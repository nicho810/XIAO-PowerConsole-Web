# XIAO PowerConsole Web — 双通道 USB 功率测量台
React 19 + TypeScript 5.8 + Vite 6 + Tailwind 4 + Zustand 5 + ECharts 5

## 目录
```
src/        应用、协议、采集状态和展示（见 src/AGENTS.md）
public/     品牌图标
tests/     核心行为回归测试与独立运行器
```
## 配置
package.json — npm 开发、构建和测试入口。
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
2026-09-06 — 新增显示快照与三图联动、独立 CSV 录制、采集健康状态；采集与显示解耦。
2026-09-06 — 统一串口会话、测量校验、极值抽样与读数优先布局，建立 AGENTS 文档入口。
