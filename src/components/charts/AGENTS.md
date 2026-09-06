# src/components/charts/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `current-chart.tsx` — 对外提供 CurrentChart 组件
- `power-chart.tsx` — 对外提供 PowerChart 组件
- `realtime-chart.tsx` — 对外提供 RealtimeChart + BufferSeriesConfig — 命令式 ECharts 实时折线图
- `voltage-chart.tsx` — 对外提供 VoltageChart 组件
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
三张配置组件共用 RealtimeChart；共享显示帧只读，15fps 节流，真实数值时间轴、极值抽样、无平滑。空缓冲区不显示假读数；主题更新复用图表实例。

三图配置仅提供系列键，RealtimeChart 使用共享显示帧；相同原始采样索引保留全部曲线极值。ECharts connect 联动时间游标，毫秒标签区分相邻采样，tooltip 限制在各图内部。暂停与时间窗由 chart-view-store 管理，采集独立运行。

## 变更记录
2026-09-06 — 新增暂停/联动游标、独立 CSV 录制及采集健康诊断。
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
