# src/store/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `chart-view-store.ts` — 同步暂停快照、5/10/30秒窗口与三图共享极值抽样帧。
- `recording-store.ts` — CsvRecorder，64MiB 有界分块 CSV 录制，支持跨会话追加和完整快照导出。
- `health-store.ts` — StreamHealth，2 秒滑动接收速率、CRC 计数和无采样超时。
- `device-store.ts` — 对外提供 useDeviceStore — 设备连接状态与配置
- `energy-store.ts` — integrateA/B、resetA/B、snapshotA/B、clearEnergyTimestamps
- `measurement-store.ts` — 对外提供 pushSample / clearMeasurements / getSampleCount / getLatest / getMeasurementVersion
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
device-store 表示连接状态（含 disconnecting）；measurement-store 使用 7×3000 环形缓冲区，显示版本单调递增，原始样本另行写入 recording-store 与 health-store。energy-store 只计算电荷，梯形积分原始数据，0 < dt ≤ 500ms 才累计电荷和有效时长；跨连接保留累计值，Reset 显式清除。

显示状态单向依赖测量层：暂停捕获原始缓冲区与读数，采集和录制继续；恢复读取最新数据。三图共用 15fps 抽样帧与时间索引，窗口按真实设备毫秒过滤。CSV 独立追加原始样本（含接收 UTC、校准值与分段编号），64MiB 上限自动停止；断开停止录制但保留数据，导出为不可变快照。健康状态按主机单调时钟计算最近 2 秒接收速率与最后有效采样年龄，2 秒无采样判定 stale，CRC 错误从 parser 上报。

## 变更记录
2026-09-06 — 新增暂停/联动游标、独立 CSV 录制及采集健康诊断。
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
