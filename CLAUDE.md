# XIAO PowerConsole Web — USB 功率监控仪 Web 前端
React 19 + TypeScript 5.8 + Vite 6 + Tailwind 4 + Zustand 5 + ECharts 5

## 目录结构

```
src/
├── main.tsx              — Vite 入口，挂载 React
├── app.tsx               — App Shell，可拖拽双栏布局 (左信息区 3:9 右图表区)
├── index.css             — Tailwind 指令 + CSS 变量（亮/暗主题）
│
├── types/                — 纯类型定义，零运行时 (2 文件)
├── protocol/             — XPB 二进制协议: CRC, 解析, 构建, 解码 (4 文件)
├── serial/               — Web Serial API 封装 + 三阶段握手 (2 文件)
├── store/                — Zustand 状态: 设备连接 + 环形缓冲区 (2 文件)
├── hooks/                — React Hooks: 串口, 测试模式, 主题, 日志 (4 文件)
├── lib/                  — 工具: RingBuffer + 格式化函数 (2 文件)
│
└── components/
    ├── layout/           — Sidebar (含标题+主题切换) + MainContent (2 文件)
    ├── connection/       — 连接面板 + 状态指示 + 设备信息 (3 文件)
    ├── charts/           — ECharts 实时折线图: 电压/电流/功率 (4 文件)
    └── console/          — 可折叠调试日志 (1 文件)
```

## 配置文件

- `vite.config.ts` — Vite 构建配置，React + Tailwind 插件
- `tsconfig.app.json` — TS 编译配置，路径别名 `@/* → ./src/*`
- `package.json` — 依赖: react, echarts, zustand, tailwindcss

## 数据流

```
USB Device → Web Serial (Uint8Array) → FrameParser (字节状态机)
  → codec 解码 → deriveMeasurement 派生 → RingBuffer × 7
  → 图表内嵌 rAF 15fps 直读 buffer → ECharts 命令式更新（零 React 渲染）
```

## 架构决策

- 协议层零 React 依赖，纯 TypeScript 实现
- `verbatimModuleSyntax` 强制 type-only import
- CRC-8/MAXIM 预计算查找表，模块加载时生成
- RingBuffer 用 Float64Array 避免 GC 压力
- 100Hz 数据不走 React 渲染，RingBuffer 可变外部状态
- ECharts 首次 replace 建图 + 后续 merge 推数据，图表内 rAF 直读 buffer
- 图表数据路径零 React 渲染：无 setState，无 useEffect 触发，无 props diff
- 三阶段握手: START → CONFIG → CONFIG_ACK → DATA stream
- 测试模式与实机走同一 pushSample 路径

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
