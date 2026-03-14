# connection/
> L2 | 父级: /CLAUDE.md

连接控制与设备信息组件 — 串口连接、实时测量展示、能量统计

## 成员清单
- `connection-panel.tsx`: 连接按钮组 (Connect/Disconnect)，消费 useSerial hook
- `connection-status.tsx`: 状态指示器 (颜色点 + 脉冲动画)，根据 status 枚举查表渲染
- `device-info.tsx`: 合并面板 — 设备配置 + 实时 V/I/P + 能量统计(µAh/mAh/elapsed/Reset)；
  未连接时显示 animate-pulse 骨架屏预示完整布局；rAF 10Hz 轮询

## 架构决策
- 未连接时渲染骨架屏而非隐藏面板，保持侧栏布局稳定、减少跳动
- 骨架屏结构与实际数据布局一一对应，让用户预期内容形状
- Reset 按钮立即调用 resetA/B 并强制刷新 snapshot，无需等待下一帧
- elapsed 每帧刷新（即使无新样本），保证计时器视觉连续

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
