# src/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `app.tsx` — 对外提供 App 组件 — 应用外壳
- `index.css` — 主题 token、通道身份色、响应式布局和键盘焦点样式
- `main.tsx` — Vite 入口 — 挂载 React 应用到 #root
- `vite-env.d.ts` — Vite 客户端资源类型声明。
- [components/](components/AGENTS.md) — 子模块职责与成员地图。
- [hooks/](hooks/AGENTS.md) — 子模块职责与成员地图。
- [i18n/](i18n/AGENTS.md) — 子模块职责与成员地图。
- [lib/](lib/AGENTS.md) — 子模块职责与成员地图。
- [protocol/](protocol/AGENTS.md) — 子模块职责与成员地图。
- [serial/](serial/AGENTS.md) — 子模块职责与成员地图。
- [store/](store/AGENTS.md) — 子模块职责与成员地图。
- [types/](types/AGENTS.md) — 子模块职责与成员地图。

## 依赖与决策
入口 main → App → layout；serial → protocol → store → 图表/读数。依赖从采集单向流向展示。

## 变更记录
2026-09-06 — store 增加显示、录制与健康状态；连接组件新增采集工具栏。
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
