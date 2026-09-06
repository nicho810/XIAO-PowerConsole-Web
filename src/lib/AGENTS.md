# src/lib/
> L2 | 父级: [AGENTS.md](../AGENTS.md)

## 成员清单
- `peak-sampling.ts` — peakPoints / sharedPeakIndices，保留桶内极值、首尾样本和断流缺口的 [ms, value] 点列
- `ring-buffer.ts` — 对外提供 RingBuffer 泛型环形缓冲区类
- `utils.ts` — 对外提供 formatVoltage、formatCurrent、formatPower、cn 工具函数
- `CLAUDE.md` — 历史工具入口，指向本地图。

## 依赖与决策
纯数据结构、格式化和抽样算法。peakPoints / sharedPeakIndices 保留桶内首尾与极值，按真实时间排列；超过 500ms 缺口用 null 断线，点数预算为软限制。sharedPeakIndices 对全部曲线合并极值索引，负索引编码断流标记。

## 变更记录
2026-09-06 — 同步串口生命周期、测量精度、峰值保真与读数层级改动。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
