# src/components/layout/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `main-content.tsx` — MainContent，读数优先的测量工作区
- `sidebar.tsx` — 对外提供 Sidebar 组件 — 左面板容器 (含标题栏 + 主题切换 + 语言选择)

## 依赖与决策
侧栏包含连接、折叠配置和折叠日志；主工作区先读数后图表。桌面双栏独立滚动，窄屏单栏自然滚动。

## 变更记录
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
