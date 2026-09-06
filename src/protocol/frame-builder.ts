/**
 * [INPUT]:  依赖 @/types/protocol 的 SYNC_0/SYNC_1/FRAME_TYPE，依赖 @/protocol/crc8 的 crc8Maxim
 * [OUTPUT]: 对外提供 buildStartFrame、buildConfigAckFrame、buildStopFrame
 * [POS]:    protocol/ 的下行帧构造器，被串口发送层消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { SYNC_0, SYNC_1, FRAME_TYPE } from '@/types/protocol.js';
import { crc8Maxim } from './crc8.js';

// ============================================================
//  PC → 设备 命令帧构造
// ============================================================
//  所有命令帧均为零载荷: [0xAA][0x55][TYPE][0x00][CRC8]
//  CRC 覆盖 [TYPE, LEN]
// ============================================================

/** 构造零载荷命令帧的通用工厂 */
function buildCommandFrame(type: number): Uint8Array {
  const crc = crc8Maxim(new Uint8Array([type, 0x00]));
  return new Uint8Array([SYNC_0, SYNC_1, type, 0x00, crc]);
}

/** 启动采集命令 0xC0 */
export function buildStartFrame(): Uint8Array {
  return buildCommandFrame(FRAME_TYPE.START);
}

/** 配置应答命令 0xC1 */
export function buildConfigAckFrame(): Uint8Array {
  return buildCommandFrame(FRAME_TYPE.CONFIG_ACK);
}

/** 停止采集命令 0xC2 */
export function buildStopFrame(): Uint8Array {
  return buildCommandFrame(FRAME_TYPE.STOP);
}
