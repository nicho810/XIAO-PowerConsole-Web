# i18n/
> L2 | 父级: /CLAUDE.md

国际化数据层 — 多语言字典与类型定义

## 成员清单
- `locales.ts`: LOCALES 翻译字典 + LOCALE_LABELS 显示名 + Locale/LocaleStrings 类型；支持 10 种语言（en/ja/ko/vi/ms/de/fr/it/es/zh-TW）

## 架构决策
- 纯数据文件，零运行时副作用，零 React 依赖
- LocaleStrings 接口覆盖所有 UI 可见文本，新增 key 须同步补全所有语言
- 状态管理与持久化由 hooks/use-locale.ts 负责，i18n/ 只管数据

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
