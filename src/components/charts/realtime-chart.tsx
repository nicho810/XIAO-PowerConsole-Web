/**
 * [INPUT]:  依赖 react, echarts, lib/peak-sampling, lib/ring-buffer（主题通过 MutationObserver 直读 DOM）
 * [OUTPUT]: 对外提供 RealtimeChart + BufferSeriesConfig — 命令式 ECharts 实时折线图
 * [POS]:    charts/ 的基础图表组件，被 voltage/current/power chart 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { peakPoints } from '@/lib/peak-sampling.js';
import type { RingBuffer } from '@/lib/ring-buffer.js';

// ── ECharts 按需注册 ───────────────────────────────────────────
echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

// ============================================================
//  RealtimeChart — 完全命令式 ECharts 更新
// ============================================================
//  性能关键路径:
//   1. rAF 直接读 RingBuffer，React 渲染循环零参与
//   2. 首次 replace 模式建图，后续 merge 模式只推数据
//   3. 保留桶内极值与首尾，约 600 点软预算，15fps 节流
//   4. 无新数据不重绘，主题切换更新配置并保留实例
// ============================================================

export interface BufferSeriesConfig {
  name: string;
  color: string;
  buffer: RingBuffer;
}

interface Props {
  title: string;
  unit: string;
  timestampBuffer: RingBuffer;
  series: BufferSeriesConfig[];
  getVersion: () => number;
}

/** ~15fps — 每帧 3 图各一次 setOption，总 45/sec */
const THROTTLE_MS = 66;

/** 显示上限 — 图表宽度约 600~800px，超出无视觉意义 */
const MAX_DISPLAY = 600;

/** CSS 变量 → hsl() 字符串，仅在 needsInit 时调用 */
function resolveHsl(cssVar: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return `hsl(${raw})`;
}

/** 原始 SI 值 → 显示单位格式化 (V 不变, A→mA, W→mW) */
function formatValue(raw: number, unit: string): string {
  switch (unit) {
    case 'mA': return (raw * 1000).toFixed(2);
    case 'mW': return (raw * 1000).toFixed(2);
    case 'V':  return raw.toFixed(3);
    default:   return raw.toPrecision(4);
  }
}

/** 时间戳 → "M:SS.f" 标签 */
function formatTimestamp(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec) % 60;
  const frac = Math.floor((totalSec % 1) * 10);
  return `${m}:${String(s).padStart(2, '0')}.${frac}`;
}

export function RealtimeChart({
  title, unit, timestampBuffer, series: seriesConfig, getVersion,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // ── 直接监听 DOM class 变化，避免独立 state 实例不同步问题 ──
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // ── Ref 桥接 — 让 rAF 闭包读到最新值，无需重启循环 ────────
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const seriesRef = useRef(seriesConfig);
  seriesRef.current = seriesConfig;

  // ── 创建 / 销毁 ECharts 实例 ───────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  // ── rAF 数据循环 — 直读 buffer → ECharts，零 React 渲染 ───
  useEffect(() => {
    let rafId = 0;
    let lastSeen = 0;
    let lastUpdate = 0;
    let currentChart: echarts.ECharts | null = null;
    let lastTheme = '';

    // ── 预分配读取缓冲区 ──────────────────────────────────────
    const cap = timestampBuffer.capacity;
    const _ts = new Float64Array(cap);
    const _bufs = seriesConfig.map(() => new Float64Array(cap));

    function tick() {
      rafId = requestAnimationFrame(tick);
      const chart = chartRef.current;
      if (!chart) { currentChart = null; return; }

      // ── 检测图表实例变化 或 主题切换 ──────────────────────
      const t = themeRef.current;
      const needsInit = chart !== currentChart || t !== lastTheme;
      currentChart = chart;
      lastTheme = t;

      const count = getVersion();

      // ── 数据被清空 → 重置 ──────────────────────────────────
      if (timestampBuffer.length === 0 && count !== lastSeen && !needsInit) {
        lastSeen = count;
        chart.setOption({
          series: seriesRef.current.map((s) => ({ name: s.name, data: [] })),
        });
        return;
      }

      // ── 无变化且无需初始化 → 跳过 ─────────────────────────
      if (count === lastSeen && !needsInit) return;
      // ── 节流 ~15fps ────────────────────────────────────────
      const now = performance.now();
      if (now - lastUpdate < THROTTLE_MS && !needsInit) return;
      lastUpdate = now;
      lastSeen = count;

      // ── 读取 buffer ────────────────────────────────────────
      const raw = timestampBuffer.copyTo(_ts);
      const sc = seriesRef.current;
      for (let i = 0; i < sc.length; i++) {
        sc[i].buffer.copyTo(_bufs[i]);
      }

      // -- 每条曲线保留独立极值，使用真实时间轴和断流缺口 --
      const seriesData = sc.map((s, i) => ({
        name: s.name,
        data: peakPoints(_ts, _bufs[i], raw, MAX_DISPLAY),
      }));

      // ── setOption: 首次 replace 建图，后续 merge 推数据 ────
      if (needsInit) {
        const isDark = t === 'dark';
        const mutedFg = resolveHsl('--muted-foreground');
        const borderClr = resolveHsl('--border');

        chart.setOption({
          backgroundColor: 'transparent',
          grid: { left: 50, right: 16, top: 28, bottom: 28, containLabel: false },
          tooltip: {
            trigger: 'axis',
            backgroundColor: isDark ? 'hsl(222 84% 6% / 0.85)' : 'hsl(0 0% 100% / 0.85)',
            borderColor: borderClr,
            borderRadius: 8,
            padding: [8, 12],
            textStyle: {
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontSize: 11,
              fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
            },
            extraCssText: 'backdrop-filter: blur(8px); box-shadow: 0 4px 16px hsl(0 0% 0% / 0.2);',
            axisPointer: { type: 'cross', crossStyle: { color: mutedFg, width: 0.8 } },
            valueFormatter: (v: number | [number, number]) => `${formatValue(Array.isArray(v) ? v[1] : v, unit)} ${unit}`,
          },
          legend: {
            data: sc.map((s) => s.name),
            textStyle: { color: mutedFg, fontSize: 10 },
            top: 4,
            right: 8,
            icon: 'circle',
            itemWidth: 11,
            itemHeight: 11,
            itemGap: 14,
          },
          xAxis: {
            type: 'value',
            min: 'dataMin',
            max: 'dataMax',
            axisPointer: { label: { formatter: ({ value }: { value: number }) => formatTimestamp(value) } },
            axisLabel: {
              color: mutedFg,
              fontSize: 10,
              fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
              hideOverlap: true,
              formatter: formatTimestamp,
            },
            axisLine: { lineStyle: { color: borderClr } },
            splitLine: { show: false },
            animation: false,
          },
          yAxis: {
            type: 'value',
            name: unit,
            axisPointer: { label: { formatter: ({ value }: { value: number }) => `${formatValue(value, unit)} ${unit}` } },
            nameTextStyle: { color: mutedFg, fontSize: 10 },
            axisLabel: {
              color: mutedFg,
              fontSize: 10,
              width: 40,
              overflow: 'truncate',
              formatter: (v: number) => formatValue(v, unit),
            },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)', type: 'dashed', width: 0.8 } },
            animation: false,
          },
          series: sc.map((s, i) => {
            const resolved = resolveHsl(s.color);
            return {
              name: s.name,
              type: 'line',
              data: seriesData[i].data,
              showSymbol: false,
              smooth: false,
              connectNulls: false,
              lineStyle: { width: 2, color: resolved, cap: 'round', join: 'round' },
              itemStyle: { color: resolved },
              emphasis: { disabled: true },
              animation: false,
            };
          }),
          animation: false,
        }, true);
      } else {
        // ── merge 模式 — 只推数据，ECharts 内部增量更新 ──────
        chart.setOption({
          series: seriesData,
        });
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps — rAF 闭包通过 ref 读最新值，无需重启
  }, []);

  return (
    <div className="flex-1 min-h-[170px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-elevated overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[hsl(var(--border))]">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">{title}</h3>
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] opacity-60">{unit}</span>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
