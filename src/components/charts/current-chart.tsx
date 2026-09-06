/**
 * [INPUT]:  依赖 RealtimeChart, measurement-store 的 buffers/getMeasurementVersion, hooks/use-locale
 * [OUTPUT]: 对外提供 CurrentChart 组件
 * [POS]:    charts/ 的电流图表，被 MainContent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { RealtimeChart, type BufferSeriesConfig } from './realtime-chart.js';
import { buffers, getMeasurementVersion } from '@/store/measurement-store.js';
import { useLocale } from '@/hooks/use-locale.js';

// ── 模块级常量 — 稳定引用，零分配 ──────────────────────────────
const SERIES: BufferSeriesConfig[] = [
  { name: 'Ch A', color: '--chart-current-a', buffer: buffers.currentA },
  { name: 'Ch B', color: '--chart-current-b', buffer: buffers.currentB },
];

export function CurrentChart() {
  const { t } = useLocale();
  return (
    <RealtimeChart
      title={t.current}
      unit="mA"
      timestampBuffer={buffers.timestamp}
      series={SERIES}
      getVersion={getMeasurementVersion}
    />
  );
}
