/**
 * [INPUT]:  无外部依赖 — 纯类型定义
 * [OUTPUT]: 对外提供 ChannelMeasurement、DualChannelSample 导出测量接口
 * [POS]:    types/ 的测量语义层，由 protocol/codec.ts 生产，被 UI 组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
//  派生测量值 — PC 端从原始帧计算得到
// ============================================================

/** 单通道测量快照 */
export interface ChannelMeasurement {
  readonly busVoltage:   number;   // 总线电压 (V)
  readonly shuntVoltage: number;   // 分流电压 (V)
  readonly current:      number;   // 电流 (A)  = shuntV / shuntR
  readonly power:        number;   // 功率 (W)  = busV * current
  readonly timestamp:    number;   // 设备时间戳 (ms)
}

/** 双通道采样点 — 一帧产生一个 */
export interface DualChannelSample {
  readonly channelA: ChannelMeasurement;
  readonly channelB: ChannelMeasurement;
}
