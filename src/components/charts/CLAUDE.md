# charts/
> L2 | 父级: /CLAUDE.md

ECharts 实时折线图 — 完全命令式更新，零 React 渲染路径

## 成员清单
- `realtime-chart.tsx`: RealtimeChart — 核心图表组件，内嵌 rAF 直读 RingBuffer，首次 replace 建图 + 后续 merge 推数据，15fps 节流
- `voltage-chart.tsx`: VoltageChart — 电压图表配置层，传入 voltageA/B buffer 引用
- `current-chart.tsx`: CurrentChart — 电流图表配置层，传入 currentA/B buffer 引用
- `power-chart.tsx`: PowerChart — 功率图表配置层，传入 powerA/B buffer 引用

## 架构决策
- 图表组件直接持有 RingBuffer 引用，rAF 内命令式读取 → setOption
- React 仅负责挂载/卸载/主题切换，数据更新完全绕过 vDOM
- 首次 `setOption(option, true)` replace 模式建立完整图表配置
- 后续 `setOption({ xAxis, series })` merge 模式只推数据，ECharts 内部增量更新
- `useChartData` 已删除 — 图表不再需要中间数据桥接层

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
