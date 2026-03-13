/**
 * [INPUT]:  依赖 RealtimeChart, measurement-store 的 buffers/getSampleCount
 * [OUTPUT]: 对外提供 PowerChart 组件
 * [POS]:    charts/ 的功率图表，被 MainContent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { RealtimeChart, type BufferSeriesConfig } from './realtime-chart.js';
import { buffers, getSampleCount } from '@/store/measurement-store.js';

// ── 模块级常量 — 稳定引用，零分配 ──────────────────────────────
const SERIES: BufferSeriesConfig[] = [
  { name: 'Ch A', color: '--chart-power-a', buffer: buffers.powerA },
  { name: 'Ch B', color: '--chart-power-b', buffer: buffers.powerB },
];

export function PowerChart() {
  return (
    <RealtimeChart
      title="Power"
      unit="mW"
      timestampBuffer={buffers.timestamp}
      series={SERIES}
      getSampleCount={getSampleCount}
    />
  );
}
