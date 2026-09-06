# src/protocol/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `codec.ts` — 对外提供 decodeRealtimeData、decodeDeviceConfig、deriveMeasurement
- `crc8.ts` — 对外提供 crc8Maxim 校验函数
- `frame-builder.ts` — 对外提供 buildStartFrame、buildConfigAckFrame、buildStopFrame
- `frame-parser.ts` — 对外提供 FrameParser 字节级状态机解析器
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
纯 TypeScript 协议层；codec 验证载荷长度、有限数值和正电阻，计算不做展示舍入。CRC 不通过的帧由 parser 丢弃。

## 变更记录
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
