# hooks/
> L2 | 父级: /CLAUDE.md

React Hooks — 串口控制、测试模式、主题切换、日志管理

## 成员清单
- `use-serial.ts`: useSerial — 串口连接生命周期管理（connect/disconnect），100Hz 数据流消费
- `use-test-mode.ts`: useTestMode — 正弦波模拟数据 @ 100Hz，走同一 pushSample 路径
- `use-theme.ts`: useTheme — 亮/暗主题切换，localStorage 持久化
- `use-log.ts`: useLog — 调试日志管理

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
