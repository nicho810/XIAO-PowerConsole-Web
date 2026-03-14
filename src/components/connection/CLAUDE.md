# connection/
> L2 | 父级: /CLAUDE.md

连接控制与设备信息组件 — 串口连接、实时测量展示、能量统计

## 成员清单
- `connection-panel.tsx`: 连接按钮组 (Connect/Disconnect)，消费 useSerial hook
- `connection-status.tsx`: 状态指示器 (颜色点 + 脉冲动画)，根据 status 枚举查表渲染
- `device-info.tsx`: 设备配置行 + rAF 轮询 10Hz 实时 V/I/P 三格网格，零 Zustand 订阅
- `energy-stats.tsx`: 双通道电量统计面板，rAF 轮询 15Hz，显示实时 V/I + 累积 µAh/mAh + 计时 + Reset 按钮

## 架构决策
- 所有实时数值组件均用 rAF + DISPLAY_THROTTLE 节流，不依赖 Zustand 订阅
- energy-stats 在 status=disconnected 时返回 null，与 device-info 保持一致
- Reset 按钮立即调用 resetA/B 并强制刷新 snapshot 状态，无需等待下一帧

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
