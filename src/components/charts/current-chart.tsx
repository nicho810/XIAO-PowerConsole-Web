/**
 * [INPUT]:  依赖 react, RealtimeChart, ChartSnapshot
 * [OUTPUT]: 对外提供 CurrentChart 组件
 * [POS]:    charts/ 的电流图表，被 MainContent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useMemo } from 'react';
import { RealtimeChart, type ChartSeries } from './realtime-chart.js';
import type { ChartSnapshot } from '@/hooks/use-chart-data.js';

export function CurrentChart({ data }: { data: ChartSnapshot }) {
  const series = useMemo<ChartSeries[]>(() => [
    { name: 'Ch A', data: data.currentA, color: '#22c55e' },
    { name: 'Ch B', data: data.currentB, color: '#a855f7' },
  ], [data.currentA, data.currentB]);

  return (
    <RealtimeChart
      title="Current"
      unit="mA"
      timestamps={data.timestamps}
      series={series}
    />
  );
}
