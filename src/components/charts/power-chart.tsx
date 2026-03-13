/**
 * [INPUT]:  依赖 react, RealtimeChart, ChartSnapshot
 * [OUTPUT]: 对外提供 PowerChart 组件
 * [POS]:    charts/ 的功率图表，被 MainContent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useMemo } from 'react';
import { RealtimeChart, type ChartSeries } from './realtime-chart.js';
import type { ChartSnapshot } from '@/hooks/use-chart-data.js';

export function PowerChart({ data }: { data: ChartSnapshot }) {
  const series = useMemo<ChartSeries[]>(() => [
    { name: 'Ch A', data: data.powerA, color: '#ef4444' },
    { name: 'Ch B', data: data.powerB, color: '#eab308' },
  ], [data.powerA, data.powerB]);

  return (
    <RealtimeChart
      title="Power"
      unit="mW"
      timestamps={data.timestamps}
      series={series}
    />
  );
}
