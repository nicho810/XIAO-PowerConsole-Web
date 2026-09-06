# src/store/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `device-store.ts` — 对外提供 useDeviceStore — 设备连接状态与配置
- `energy-store.ts` — integrateA/B、resetA/B、snapshotA/B、clearEnergyTimestamps
- `measurement-store.ts` — 对外提供 pushSample / clearMeasurements / getSampleCount / getLatest / getMeasurementVersion
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
device-store 表示连接状态（含 disconnecting）；measurement-store 使用 7×3000 环形缓冲区，显示版本单调递增。energy-store 只计算电荷，梯形积分原始数据，0 < dt ≤ 500ms 才累计电荷和有效时长；跨连接保留累计值，Reset 显式清除。

## 变更记录
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
