# src/components/connection/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `connection-panel.tsx` — 对外提供 ConnectionPanel 组件 — 连接控制按钮组
- `connection-status.tsx` — 对外提供 ConnectionStatus 组件 — 状态指示器
- `device-info.tsx` — DeviceInfo，可展开的设备校准与协议信息
- `measurement-summary.tsx` — MeasurementSummary，双通道实时读数和紧凑电荷统计
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
ConnectionPanel 唯一挂载 useSerial。DeviceInfo 只订阅低频配置；MeasurementSummary 按测量版本变化以 10Hz 更新，空闲不重复 setState；Reset 即时刷新。

## 变更记录
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
