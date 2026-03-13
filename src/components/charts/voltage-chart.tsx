/**
 * [INPUT]:  依赖 react, RealtimeChart, ChartSnapshot
 * [OUTPUT]: 对外提供 VoltageChart 组件
 * [POS]:    charts/ 的电压图表，被 MainContent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useMemo } from 'react';
import { RealtimeChart, type ChartSeries } from './realtime-chart.js';
import type { ChartSnapshot } from '@/hooks/use-chart-data.js';

export function VoltageChart({ data }: { data: ChartSnapshot }) {
  const series = useMemo<ChartSeries[]>(() => [
    { name: 'Ch A', data: data.voltageA, color: '#3b82f6' },
    { name: 'Ch B', data: data.voltageB, color: '#f97316' },
  ], [data.voltageA, data.voltageB]);

  return (
    <RealtimeChart
      title="Voltage"
      unit="V"
      timestamps={data.timestamps}
      series={series}
    />
  );
}
