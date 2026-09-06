# XIAO PowerConsole Web — 双通道 USB 功率测量台
React 19 + TypeScript 5.8 + Vite 6 + Tailwind 4 + Zustand 5 + ECharts 6.1

## 目录
```
docs/       README 界面截图（见 docs/AGENTS.md）
.github/    持续集成配置（见 .github/AGENTS.md）
src/        应用、协议、采集状态和展示（见 src/AGENTS.md）
public/     品牌图标
tests/     核心行为回归测试、独立运行器与 HTML 视觉原型
```
## 配置
LICENSE — GNU GPLv3 官方全文；本项目选择 GPL-3.0-only。
package.json — npm 开发、构建和测试入口，Node 22+。
package-lock.json — 唯一依赖锁文件。
.nvmrc — 默认 Node 22 开发环境。
CONTRIBUTING.md — 问题反馈、开发与 PR 验证约定。
vite.config.ts — React、Tailwind 与路径别名。
tsconfig*.json — TypeScript 严格编译配置。
wrangler.jsonc — 现有静态资源部署配置。
README.md — 开发、测量语义、验证和使用说明。
CLAUDE.md — 历史入口，架构以 AGENTS.md 为准。

## 决策与规范
单个 SerialSession 持有单个串口 reader；协议层保留原始精度并拒绝无效输入。
采样写入环形缓冲区，图表节流直读；极值抽样不用于统计计算。
高频采集不驱动 React；电荷按原始采样梯形积分，有效间隔累计计时。
修改代码同步 L3 契约及模块地图；新增功能优先纯函数和边界测试。

## 变更记录
2026-09-06 — 采用 GPL-3.0-only，允许商业使用，分发时按 GPL 提供对应源码；同步 npm 元数据与贡献、部署说明。
2026-09-06 — 新增 CI 与贡献说明，统一 npm 锁文件，清除系统元数据跟踪，完善预览版兼容性与真机验证边界。
2026-09-06 — 正式 UI 采用石墨面板、青蓝 #03C3FF / 紫粉 #FE75E9；无装饰动效，功率读数优先。
2026-09-06 — 新增显示快照与三图联动、独立 CSV 录制、采集健康状态；采集与显示解耦。
2026-09-06 — 统一串口会话、测量校验、极值抽样与读数优先布局，建立 AGENTS 文档入口。
