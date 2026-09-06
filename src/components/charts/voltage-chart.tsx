/**
 * [INPUT]:  依赖 RealtimeChart, measurement-store 的 buffers/getMeasurementVersion, hooks/use-locale
 * [OUTPUT]: 对外提供 VoltageChart 组件
 * [POS]:    charts/ 的电压图表，被 MainContent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { RealtimeChart, type BufferSeriesConfig } from './realtime-chart.js';
import { buffers, getMeasurementVersion } from '@/store/measurement-store.js';
import { useLocale } from '@/hooks/use-locale.js';

// ── 模块级常量 — 稳定引用，零分配 ──────────────────────────────
const SERIES: BufferSeriesConfig[] = [
  { name: 'Ch A', color: '--chart-voltage-a', buffer: buffers.voltageA },
  { name: 'Ch B', color: '--chart-voltage-b', buffer: buffers.voltageB },
];

export function VoltageChart() {
  const { t } = useLocale();
  return (
    <RealtimeChart
      title={t.voltage}
      unit="V"
      timestampBuffer={buffers.timestamp}
      series={SERIES}
      getVersion={getMeasurementVersion}
    />
  );
}
