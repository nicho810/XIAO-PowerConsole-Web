/**
 * [INPUT]:  依赖 RealtimeChart, chart-view-store 的系列键, hooks/use-locale
 * [OUTPUT]: 对外提供 VoltageChart 组件
 * [POS]:    charts/ 的电压图表，被 MainContent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { RealtimeChart, type BufferSeriesConfig } from './realtime-chart.js';
import { useLocale } from '@/hooks/use-locale.js';

// ── 模块级常量 — 稳定引用，零分配 ──────────────────────────────
const SERIES: BufferSeriesConfig[] = [
  { name: 'Ch A', color: '--chart-voltage-a', key: 'voltageA' },
  { name: 'Ch B', color: '--chart-voltage-b', key: 'voltageB' },
];

export function VoltageChart() {
  const { t } = useLocale();
  return (
    <RealtimeChart
      title={t.voltage}
      unit="V"
      series={SERIES}
    />
  );
}
