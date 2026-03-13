/**
 * [INPUT]:  依赖 react, chart 组件, hooks/use-chart-data
 * [OUTPUT]: 对外提供 MainContent 组件 — 右面板图表区
 * [POS]:    layout/ 的右侧内容区，包含三个实时图表
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useChartData } from '@/hooks/use-chart-data.js';
import { VoltageChart } from '@/components/charts/voltage-chart.js';
import { CurrentChart } from '@/components/charts/current-chart.js';
import { PowerChart } from '@/components/charts/power-chart.js';

export function MainContent() {
  const data = useChartData();

  return (
    <section className="flex-1 flex flex-col gap-4">
      <VoltageChart data={data} />
      <CurrentChart data={data} />
      <PowerChart data={data} />
    </section>
  );
}
