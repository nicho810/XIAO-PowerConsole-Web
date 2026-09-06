# src/hooks/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `use-locale.ts` — 对外提供 useLocale hook — 多语言切换，模块级共享状态 + localStorage 持久化
- `use-log.ts` — 对外提供 useLog hook 和 useLogStore — 调试日志系统
- `use-serial.ts` — 对外提供 useSerial，连接/取消/断开及卸载清理
- `use-theme.ts` — 对外提供 useTheme hook — 暗/亮主题持久化切换
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
useSerial 是会话所有者，处理取消、异常、关闭及卸载；主题、语言和日志各自独立。

useSerial 在开始握手时重置健康会话，转发 CRC/字节事件；配置变化同步录制元数据，断开或卸载立即停止录制并结束健康会话。

## 变更记录
2026-09-06 — Header 唯一消费 useTheme；首次访问默认深色，保留已保存的明暗偏好。
2026-09-06 — 新增暂停/联动游标、独立 CSV 录制及采集健康诊断。
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
