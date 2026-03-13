/**
 * [INPUT]:  依赖 RealtimeChart, measurement-store 的 buffers/getSampleCount
 * [OUTPUT]: 对外提供 CurrentChart 组件
 * [POS]:    charts/ 的电流图表，被 MainContent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { RealtimeChart, type BufferSeriesConfig } from './realtime-chart.js';
import { buffers, getSampleCount } from '@/store/measurement-store.js';

// ── 模块级常量 — 稳定引用，零分配 ──────────────────────────────
const SERIES: BufferSeriesConfig[] = [
  { name: 'Ch A', color: '--chart-current-a', buffer: buffers.currentA },
  { name: 'Ch B', color: '--chart-current-b', buffer: buffers.currentB },
];

export function CurrentChart() {
  return (
    <RealtimeChart
      title="Current"
      unit="mA"
      timestampBuffer={buffers.timestamp}
      series={SERIES}
      getSampleCount={getSampleCount}
    />
  );
}
