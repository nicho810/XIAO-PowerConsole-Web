/**
 * [INPUT]:  依赖 react, echarts, hooks/use-theme
 * [OUTPUT]: 对外提供 RealtimeChart — 通用 ECharts 实时折线图组件
 * [POS]:    charts/ 的基础图表组件，被 voltage/current/power chart 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef, useEffect } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useTheme } from '@/hooks/use-theme.js';

// ── ECharts 按需注册 ───────────────────────────────────────────
echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

// ============================================================
//  RealtimeChart — 命令式 ECharts 更新，绕过 React 渲染
// ============================================================

export interface ChartSeries {
  name: string;
  data: Float64Array;
  color: string;
}

interface Props {
  title: string;
  unit: string;
  timestamps: Float64Array;
  series: ChartSeries[];
  height?: number;
}

/** 时间戳 → HH:MM:SS.mmm 标签 */
function formatTimestamp(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60) % 60;
  const s = Math.floor(totalSec) % 60;
  const frac = Math.floor((totalSec % 1) * 10);
  return `${m}:${String(s).padStart(2, '0')}.${frac}`;
}

export function RealtimeChart({ title, unit, timestamps, series, height = 200 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const { theme } = useTheme();

  // 初始化 ECharts 实例
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

  // 命令式数据更新 — 不走 vDOM diff
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || timestamps.length === 0) return;

    const xData = Array.from(timestamps).map(formatTimestamp);

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { left: 50, right: 16, top: 30, bottom: 24 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
        textStyle: { color: theme === 'dark' ? '#e2e8f0' : '#1e293b', fontSize: 11 },
      },
      legend: {
        data: series.map((s) => s.name),
        textStyle: { color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 },
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: { color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 },
        axisLine: { lineStyle: { color: theme === 'dark' ? '#334155' : '#e2e8f0' } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: unit,
        nameTextStyle: { color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 },
        axisLabel: { color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: theme === 'dark' ? '#1e293b' : '#f1f5f9' } },
      },
      series: series.map((s) => ({
        name: s.name,
        type: 'line',
        data: Array.from(s.data),
        showSymbol: false,
        lineStyle: { width: 1.5, color: s.color },
        itemStyle: { color: s.color },
        animation: false,
      })),
      animation: false,
    }, true);
  }, [timestamps, series, theme]);

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
