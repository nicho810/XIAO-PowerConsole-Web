# hooks/
> L2 | 父级: /CLAUDE.md

React Hooks — 串口控制、主题切换、日志管理、语言切换

## 成员清单
- `use-serial.ts`: useSerial — 串口连接生命周期管理（connect/disconnect），100Hz 数据流消费
- `use-theme.ts`: useTheme — 亮/暗主题切换，localStorage 持久化
- `use-log.ts`: useLog — 调试日志管理
- `use-locale.ts`: useLocale — 多语言切换，模块级共享状态 + localStorage 持久化；消费 i18n/locales 字典

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
