/**
 * [INPUT]:  依赖 RealtimeChart, chart-view-store 的系列键, hooks/use-locale
 * [OUTPUT]: 对外提供 PowerChart 组件
 * [POS]:    charts/ 的功率图表，被 MainContent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { RealtimeChart, type BufferSeriesConfig } from './realtime-chart.js';
import { useLocale } from '@/hooks/use-locale.js';

// ── 模块级常量 — 稳定引用，零分配 ──────────────────────────────
const SERIES: BufferSeriesConfig[] = [
  { name: 'Ch A', color: '--chart-power-a', key: 'powerA' },
  { name: 'Ch B', color: '--chart-power-b', key: 'powerB' },
];

export function PowerChart() {
  const { t } = useLocale();
  return (
    <RealtimeChart
      title={t.power}
      unit="mW"
      series={SERIES}
    />
  );
}
