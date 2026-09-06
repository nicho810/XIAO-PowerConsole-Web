# src/components/charts/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `current-chart.tsx` — 对外提供 CurrentChart 组件
- `power-chart.tsx` — 对外提供 PowerChart 组件
- `realtime-chart.tsx` — 对外提供 RealtimeChart + BufferSeriesConfig — 命令式 ECharts 实时折线图
- `voltage-chart.tsx` — 对外提供 VoltageChart 组件
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
三张配置组件共用 RealtimeChart；环形缓冲区只读，15fps 节流，真实数值时间轴、极值抽样、无平滑。空缓冲区不显示假读数；主题更新复用图表实例。

## 变更记录
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
