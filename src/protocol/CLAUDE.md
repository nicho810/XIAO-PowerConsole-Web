# protocol/
> L2 | 父级: /src/CLAUDE.md (待创建)

XPB 二进制协议实现层 — CRC 校验、帧解析、帧构造、载荷解码

## 成员清单
- `crc8.ts`: CRC-8/MAXIM 预计算查找表 + crc8Maxim() 校验函数
- `frame-parser.ts`: FrameParser 字节级状态机，逐字节/批量解析二进制帧
- `frame-builder.ts`: PC→设备零载荷命令帧构造 (Start/ConfigAck/Stop)
- `codec.ts`: 载荷解码 (RealtimeData/DeviceConfig) + 派生物理量计算

## 依赖关系
```
crc8 ← frame-parser, frame-builder
types/protocol ← frame-parser, frame-builder, codec
types/measurement ← codec
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
