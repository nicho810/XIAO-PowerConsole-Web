# src/i18n/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `monitor-strings.ts` — 暂停/录制/健康状态的十语言文案。
- `locales.ts` — 对外提供 LOCALES 多语言字典、LOCALE_LABELS 显示名、Locale/LocaleStrings 类型
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
按文件头部 INPUT/OUTPUT/POS 维护模块依赖与边界。

monitor-strings.ts 提供暂停、录制、上限提示及健康状态的全部十语言文案，由 measurement-controls 消费。

## 变更记录
2026-09-06 — 新增暂停/联动游标、独立 CSV 录制及采集健康诊断。
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
