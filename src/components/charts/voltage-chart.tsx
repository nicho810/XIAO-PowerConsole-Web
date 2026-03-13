/**
 * [INPUT]:  依赖 RealtimeChart, measurement-store 的 buffers/getSampleCount
 * [OUTPUT]: 对外提供 VoltageChart 组件
 * [POS]:    charts/ 的电压图表，被 MainContent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { RealtimeChart, type BufferSeriesConfig } from './realtime-chart.js';
import { buffers, getSampleCount } from '@/store/measurement-store.js';

// ── 模块级常量 — 稳定引用，零分配 ──────────────────────────────
const SERIES: BufferSeriesConfig[] = [
  { name: 'Ch A', color: '--chart-voltage-a', buffer: buffers.voltageA },
  { name: 'Ch B', color: '--chart-voltage-b', buffer: buffers.voltageB },
];

export function VoltageChart() {
  return (
    <RealtimeChart
      title="Voltage"
      unit="V"
      timestampBuffer={buffers.timestamp}
      series={SERIES}
      getSampleCount={getSampleCount}
    />
  );
}
