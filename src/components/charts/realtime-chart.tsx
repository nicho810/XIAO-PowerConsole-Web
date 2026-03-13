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
//  RealtimeChart — 命令式 ECharts 更新，零拷贝数据流
// ============================================================
//  性能关键路径:
//   1. labels 由 useChartData 预格式化，三图共享，不再逐图 format
//   2. series.data 直接传 Float64Array subarray 视图，无 Array.from
//   3. setOption merge 模式，ECharts 仅处理变化的数据
// ============================================================

export interface ChartSeries {
  name: string;
  data: Float64Array;
  color: string;
}

interface Props {
  title: string;
  unit: string;
  labels: string[];
  series: ChartSeries[];
  height?: number;
}

export function RealtimeChart({ title, unit, labels, series, height = 200 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const seriesRef = useRef(series);
  seriesRef.current = series;
  const { theme } = useTheme();

  // ── 创建 / 销毁 ECharts 实例 + 完整配置 ────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current, theme === 'dark' ? 'dark' : undefined);
    chartRef.current = chart;

    const sr = seriesRef.current;
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
        data: sr.map((s) => s.name),
        textStyle: { color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 },
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: [],
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
      series: sr.map((s) => ({
        name: s.name,
        type: 'line',
        data: [],
        showSymbol: false,
        lineStyle: { width: 1.5, color: s.color },
        itemStyle: { color: s.color },
        animation: false,
      })),
      animation: false,
    });

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [theme]);

  // ── 数据更新 — 仅推送 xAxis.data + series[].data ──────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || labels.length === 0) return;

    chart.setOption({
      xAxis: { data: labels },
      series: series.map((s) => ({ data: Array.from(s.data) })),
    });
  }, [labels, series, theme]);

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
