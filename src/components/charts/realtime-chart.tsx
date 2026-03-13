/**
 * [INPUT]:  依赖 react, echarts, hooks/use-theme, lib/ring-buffer
 * [OUTPUT]: 对外提供 RealtimeChart + BufferSeriesConfig — 命令式 ECharts 实时折线图
 * [POS]:    charts/ 的基础图表组件，被 voltage/current/power chart 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef, useEffect } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useTheme } from '@/hooks/use-theme.js';
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
  height?: number;
  timestampBuffer: RingBuffer;
  series: BufferSeriesConfig[];
  getSampleCount: () => number;
}

/** ~15fps — 每帧 3 图各一次 setOption，总 45/sec */
const THROTTLE_MS = 66;

/** 显示上限 — 图表宽度约 600~800px，超出无视觉意义 */
const MAX_DISPLAY = 600;

/** 时间戳 → "M:SS.f" 标签 */
function formatTimestamp(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60) % 60;
  const s = Math.floor(totalSec) % 60;
  const frac = Math.floor((totalSec % 1) * 10);
  return `${m}:${String(s).padStart(2, '0')}.${frac}`;
}

export function RealtimeChart({
  title, unit, timestampBuffer, series: seriesConfig, getSampleCount, height = 200,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const { theme } = useTheme();

  // ── Ref 桥接 — 让 rAF 闭包读到最新值，无需重启循环 ────────
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const seriesRef = useRef(seriesConfig);
  seriesRef.current = seriesConfig;

  // ── 创建 / 销毁 ECharts 实例 ───────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current, theme === 'dark' ? 'dark' : undefined);
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

    // ── 预分配读取缓冲区 ──────────────────────────────────────
    const cap = timestampBuffer.capacity;
    const _ts = new Float64Array(cap);
    const _bufs = seriesConfig.map(() => new Float64Array(cap));

    function tick() {
      rafId = requestAnimationFrame(tick);
      const chart = chartRef.current;
      if (!chart) { currentChart = null; return; }

      // ── 检测图表实例变化（主题切换时重建）─────────────────
      const needsInit = chart !== currentChart;
      currentChart = chart;

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
        const t = themeRef.current;
        chart.setOption({
          backgroundColor: 'transparent',
          grid: { left: 50, right: 16, top: 30, bottom: 24 },
          tooltip: {
            trigger: 'axis',
            backgroundColor: t === 'dark' ? '#1e293b' : '#fff',
            borderColor: t === 'dark' ? '#334155' : '#e2e8f0',
            textStyle: { color: t === 'dark' ? '#e2e8f0' : '#1e293b', fontSize: 11 },
          },
          legend: {
            data: sc.map((s) => s.name),
            textStyle: { color: t === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 },
            top: 0,
          },
          xAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: t === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 },
            axisLine: { lineStyle: { color: t === 'dark' ? '#334155' : '#e2e8f0' } },
            splitLine: { show: false },
          },
          yAxis: {
            type: 'value',
            name: unit,
            nameTextStyle: { color: t === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 },
            axisLabel: { color: t === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 },
            splitLine: { lineStyle: { color: t === 'dark' ? '#1e293b' : '#f1f5f9' } },
          },
          series: sc.map((s, i) => ({
            name: s.name,
            type: 'line',
            data: seriesData[i].data,
            showSymbol: false,
            lineStyle: { width: 1.5, color: s.color },
            itemStyle: { color: s.color },
            animation: false,
          })),
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
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
