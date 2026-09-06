/**
 * [INPUT]: MeasurementControls、双通道 MeasurementSummary 和电压/电流/功率图表
 * [OUTPUT]: MainContent，读数优先的测量工作区
 * [POS]: layout/ 主体；上方概览、下方趋势，空间不足时整体滚动
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { MeasurementControls } from '@/components/connection/measurement-controls.js';
import { MeasurementSummary } from '@/components/connection/measurement-summary.js';
import { VoltageChart } from '@/components/charts/voltage-chart.js';
import { CurrentChart } from '@/components/charts/current-chart.js';
import { PowerChart } from '@/components/charts/power-chart.js';

export function MainContent() {
  return (
    <div className="min-h-full flex flex-col gap-4">
      <MeasurementControls />
      <MeasurementSummary />
      <section className="flex-1 flex flex-col gap-4 min-h-[540px]">
        <VoltageChart />
        <CurrentChart />
        <PowerChart />
      </section>
    </div>
  );
}
