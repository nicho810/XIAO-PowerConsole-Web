# src/components/connection/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `measurement-controls.tsx` — 显示暂停、5/10/30秒窗口、录制导出和实时健康状态。
- `connection-panel.tsx` — 对外提供 ConnectionPanel 组件 — 连接控制按钮组
- `connection-status.tsx` — 对外提供 ConnectionStatus 组件 — 状态指示器
- `device-info.tsx` — DeviceInfo，可展开的设备校准与协议信息
- `measurement-summary.tsx` — MeasurementSummary，双通道实时读数和紧凑电荷统计
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
ConnectionPanel 唯一挂载 useSerial。DeviceInfo 只订阅低频配置；MeasurementSummary 按显示版本变化以 10Hz 更新，空闲不重复 setState；Reset 即时刷新。

MeasurementControls 以 4Hz 显示实时健康和录制计数；显示暂停冻结图表及读数，健康信息保持实时。录制可停止/追加，清空仅在停止时可用，导出不停止录制。MeasurementSummary 暂停时禁用统计重置。

## 变更记录
2026-09-06 — 新增暂停/联动游标、独立 CSV 录制及采集健康诊断。
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
