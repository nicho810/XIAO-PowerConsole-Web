# tests/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `core.test.ts` — 核心正确性回归测试，无需真实硬件
- `preview.html` — 确定性的双通道读数、窄峰值与断流预览
- `run.mjs` — npm test 的退出码；编译产物仅写临时目录并在结束后清理

## 依赖与决策
npm test 使用已有 Vite 将 TypeScript 测试编译到临时目录，Node test 执行后清理；模拟 Web Streams 串口，无真实硬件依赖。

## 变更记录
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
