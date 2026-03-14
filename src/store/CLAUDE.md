# store/
> L2 | 父级: /CLAUDE.md

状态层 — 设备连接状态 (Zustand) + 测量数据 + 能量积分 (纯模块级，零 React)

## 成员清单
- `device-store.ts`: Zustand store，连接状态机 (disconnected→connecting→handshaking→streaming)，设备配置 (shuntR, version)
- `measurement-store.ts`: 7 个 RingBuffer × 3000 容量，pushSample 100Hz 热路径，调用能量积分
- `energy-store.ts`: 双通道电荷累积器 (µAh/mAh)，梯形积分 I×dt，支持 resetA/B，snapshotA/B

## 架构决策
- measurement-store 和 energy-store 不使用 Zustand，避免 100Hz 高频通知开销
- energy-store 积分时过滤 dt < 0 和 dt > 500ms，防止重连跳变污染统计
- clearMeasurements() 同步调用 clearEnergyTimestamps()，重连时自动隔离时间戳

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
