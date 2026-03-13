/**
 * [INPUT]:  依赖 chart 组件 (voltage/current/power)
 * [OUTPUT]: 对外提供 MainContent 组件 — 右面板图表区
 * [POS]:    layout/ 的右侧内容区，包含三个实时图表
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { VoltageChart } from '@/components/charts/voltage-chart.js';
import { CurrentChart } from '@/components/charts/current-chart.js';
import { PowerChart } from '@/components/charts/power-chart.js';

export function MainContent() {
  return (
    <section className="flex-1 flex flex-col gap-4">
      <VoltageChart />
      <CurrentChart />
      <PowerChart />
    </section>
  );
}
