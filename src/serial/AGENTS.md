# src/serial/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `handshake.ts` — 对外提供 SerialSession，握手、重握手和采样共用一个读取循环
- `serial-port.ts` — 对外提供 SerialConnection，单读取任务与可等待的资源关闭

## 依赖与决策
SerialSession 独占 SerialConnection；START/CONFIG/ACK、重握手和采样共用一个解析器与读取任务。关闭幂等，等待选端口与 reader 锁释放；错误由 useSerial 回传界面。

## 变更记录
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
