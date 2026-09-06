/**
 * [INPUT]:  无外部依赖 — 纯类型定义
 * [OUTPUT]: 对外提供 XPB 协议常量、帧类型枚举、载荷接口、解析器状态枚举
 * [POS]:    types/ 的协议基石，被 protocol/ 全部模块消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ============================================================
//  XPB Binary Protocol V1 — 同步字节 & 帧类型
// ============================================================

/** 帧头同步字节 */
export const SYNC_0 = 0xAA;
export const SYNC_1 = 0x55;

/** 帧类型常量 — 区分设备上报 vs PC 下行 */
export const FRAME_TYPE = {
  /** 实时采样数据  LEN=20  设备→PC */
  REALTIME_DATA:  0x01,
  /** 启动命令      LEN=0   PC→设备 */
  START:          0xC0,
  /** 配置应答      LEN=0   PC→设备 */
  CONFIG_ACK:     0xC1,
  /** 停止命令      LEN=0   PC→设备 */
  STOP:           0xC2,
  /** 设备配置信息  LEN=9   设备→PC */
  DEVICE_CONFIG:  0xFE,
} as const;

export type FrameType = (typeof FRAME_TYPE)[keyof typeof FRAME_TYPE];

// ============================================================
//  载荷接口
// ============================================================

/** 实时采样载荷 — 20 字节 little-endian */
export interface RealtimeDataPayload {
  readonly busV_a:    number;   // f32 总线电压 A (V)
  readonly shuntV_a:  number;   // f32 分流电压 A (V)
  readonly busV_b:    number;   // f32 总线电压 B (V)
  readonly shuntV_b:  number;   // f32 分流电压 B (V)
  readonly timestamp: number;   // u32 设备时间戳 (ms)
}

/** 设备配置载荷 — 9 字节 little-endian */
export interface DeviceConfigPayload {
  readonly shuntR_a: number;    // f32 分流电阻 A (ohm)
  readonly shuntR_b: number;    // f32 分流电阻 B (ohm)
  readonly version:  number;    // u8  固件版本号
}

// ============================================================
//  解析结果
// ============================================================

/** 解析后的帧 — 统一输出结构 */
export interface ParsedFrame {
  readonly type:    FrameType;
  readonly payload: Uint8Array;
}

// ============================================================
//  解析器状态机
// ============================================================

/** 字节级状态机状态 */
export const enum ParserState {
  WAIT_SYNC_0 = 0,
  WAIT_SYNC_1 = 1,
  READ_TYPE    = 2,
  READ_LEN     = 3,
  READ_BODY    = 4,
}
