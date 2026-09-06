# src/types/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `measurement.ts` — 对外提供 ChannelMeasurement、DualChannelSample 导出测量接口
- `protocol.ts` — 对外提供 XPB 协议常量、帧类型枚举、载荷接口、解析器状态枚举
- `web-serial.d.ts` — SerialPort、Serial 与 navigator.serial 全局声明
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
按文件头部 INPUT/OUTPUT/POS 维护模块依赖与边界。

## 变更记录
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
