/**
 * [INPUT]:  依赖 react, echarts, lib/ring-buffer（主题通过 MutationObserver 直读 DOM）
 * [OUTPUT]: 对外提供 RealtimeChart + BufferSeriesConfig — 命令式 ECharts 实时折线图
 * [POS]:    charts/ 的基础图表组件，被 voltage/current/power chart 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import LinearGradient from 'zrender/lib/graphic/LinearGradient.js';
import type { RingBuffer } from '@/lib/ring-buffer.js';

// ── ECharts 按需注册 ───────────────────────────────────────────
echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

// ============================================================
//  RealtimeChart — 完全命令式 ECharts 更新
// ============================================================
//  性能关键路径:
//   1. rAF 直接读 RingBuffer，React 渲染循环零参与
//   2. 首次 replace 模式建图，后续 merge 模式只推数据
//   3. 降采样 ~600 点，15fps 节流
//   4. 每图表独立 rAF，负载自然分散到不同帧
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
  getSampleCount: () => number;
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

/** CSS 变量 → hsla() 字符串，用于面积渐变等半透明场景 */
function resolveHsla(cssVar: string, alpha: number): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return `hsl(${raw} / ${alpha})`;
}

/** 时间戳 → "M:SS.f" 标签 */
function formatTimestamp(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60) % 60;
  const s = Math.floor(totalSec) % 60;
  const frac = Math.floor((totalSec % 1) * 10);
  return `${m}:${String(s).padStart(2, '0')}.${frac}`;
}

export function RealtimeChart({
  title, unit, timestampBuffer, series: seriesConfig, getSampleCount,
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
  }, [theme]);

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

      const count = getSampleCount();

      // ── 数据被清空 → 重置 ──────────────────────────────────
      if (count === 0 && lastSeen !== 0) {
        lastSeen = 0;
        chart.setOption({
          xAxis: { data: [] },
          series: seriesRef.current.map((s) => ({ name: s.name, data: [] })),
        });
        return;
      }

      // ── 无变化且无需初始化 → 跳过 ─────────────────────────
      if (count === lastSeen && !needsInit) return;
      lastSeen = count;

      // ── 节流 ~15fps ────────────────────────────────────────
      const now = performance.now();
      if (now - lastUpdate < THROTTLE_MS && !needsInit) return;
      lastUpdate = now;

      // ── 读取 buffer ────────────────────────────────────────
      const raw = timestampBuffer.copyTo(_ts);
      const sc = seriesRef.current;
      for (let i = 0; i < sc.length; i++) {
        sc[i].buffer.copyTo(_bufs[i]);
      }

      // ── 降采样: 超过显示上限时等距抽样 ─────────────────────
      const stride = raw > MAX_DISPLAY ? Math.ceil(raw / MAX_DISPLAY) : 1;
      const len = stride > 1 ? Math.ceil(raw / stride) : raw;

      if (stride > 1) {
        for (let j = 0; j < len; j++) {
          const idx = j * stride;
          _ts[j] = _ts[idx];
          for (let i = 0; i < _bufs.length; i++) {
            _bufs[i][j] = _bufs[i][idx];
          }
        }
      }

      // ── 格式化时间标签 ─────────────────────────────────────
      const labels: string[] = new Array(len);
      for (let j = 0; j < len; j++) {
        labels[j] = formatTimestamp(_ts[j]);
      }

      // ── 构建 series 数据 ───────────────────────────────────
      const seriesData = sc.map((s, i) => ({
        name: s.name,
        data: Array.from(_bufs[i].subarray(0, len)),
      }));

      // ── setOption: 首次 replace 建图，后续 merge 推数据 ────
      if (needsInit) {
        const isDark = t === 'dark';
        const mutedFg = resolveHsl('--muted-foreground');
        const borderClr = resolveHsl('--border');

        chart.setOption({
          backgroundColor: 'transparent',
          grid: { left: 50, right: 16, top: 28, bottom: 28 },
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
            type: 'category',
            data: labels,
            axisLabel: {
              color: mutedFg,
              fontSize: 10,
              fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
            },
            axisLine: { lineStyle: { color: borderClr } },
            splitLine: { show: false },
          },
          yAxis: {
            type: 'value',
            name: unit,
            nameTextStyle: { color: mutedFg, fontSize: 10 },
            axisLabel: { color: mutedFg, fontSize: 10 },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)', type: 'dashed', width: 0.8 } },
          },
          series: sc.map((s, i) => {
            const resolved = resolveHsl(s.color);
            return {
              name: s.name,
              type: 'line',
              data: seriesData[i].data,
              showSymbol: false,
              smooth: 0.35,
              lineStyle: { width: 2, color: resolved, cap: 'round', join: 'round' },
              itemStyle: { color: resolved },
              areaStyle: {
                color: new LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: resolveHsla(s.color, 0.2) },
                  { offset: 1, color: resolveHsla(s.color, 0) },
                ]),
              },
              emphasis: { disabled: true },
              animation: false,
            };
          }),
          animation: false,
        }, true);
      } else {
        // ── merge 模式 — 只推数据，ECharts 内部增量更新 ──────
        chart.setOption({
          xAxis: { data: labels },
          series: seriesData,
        });
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps — rAF 闭包通过 ref 读最新值，无需重启
  }, []);

  return (
    <div className="flex-1 min-h-0 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-elevated overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[hsl(var(--border))]">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">{title}</h3>
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] opacity-60">{unit}</span>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
