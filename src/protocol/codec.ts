/**
 * [INPUT]:  依赖 @/types/protocol 的 RealtimeDataPayload/DeviceConfigPayload，
 *           依赖 @/types/measurement 的 DualChannelSample
 * [OUTPUT]: 对外提供 decodeRealtimeData、decodeDeviceConfig、deriveMeasurement
 * [POS]:    protocol/ 的解码 & 派生计算层，衔接帧解析器与业务数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import type { RealtimeDataPayload, DeviceConfigPayload } from '@/types/protocol.js';
import type { DualChannelSample } from '@/types/measurement.js';

// ============================================================
//  载荷解码 — 严格长度与有限值校验，保留原始 float32 校准精度
// ============================================================

/**
 * 解码实时采样载荷 (20 字节 little-endian)
 *
 * 布局: busV_a(f32) + shuntV_a(f32) + busV_b(f32) + shuntV_b(f32) + timestamp(u32)
 */
export function decodeRealtimeData(payload: Uint8Array): RealtimeDataPayload {
  if (payload.length !== 20) throw new Error('Expected 20-byte measurement payload');
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const data = {
    busV_a:    view.getFloat32(0,  true),
    shuntV_a:  view.getFloat32(4,  true),
    busV_b:    view.getFloat32(8,  true),
    shuntV_b:  view.getFloat32(12, true),
    timestamp: view.getUint32(16,  true),
  };
  if (!Object.values(data).every(Number.isFinite)) throw new Error('Invalid measurement values');
  return data;
}

/**
 * 解码设备配置载荷 (9 字节 little-endian)
 *
 * 布局: shuntR_a(f32) + shuntR_b(f32) + version(u8)
 */
export function decodeDeviceConfig(payload: Uint8Array): DeviceConfigPayload {
  if (payload.length !== 9) throw new Error('Expected 9-byte configuration payload');
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const config = {
    shuntR_a: view.getFloat32(0, true),
    shuntR_b: view.getFloat32(4, true),
    version:  view.getUint8(8),
  };
  validateResistance(config);
  return config;
}

// ============================================================
//  派生计算 — 从原始值到物理量
// ============================================================

/**
 * 从实时数据 + 设备配置计算双通道测量值
 *
 * current = shuntV / shuntR  (A)
 * power   = busV * current   (W)
 */
export function deriveMeasurement(
  data:   RealtimeDataPayload,
  config: DeviceConfigPayload,
): DualChannelSample {
  validateResistance(config);
  if (!Object.values(data).every(Number.isFinite)) throw new Error('Invalid measurement values');
  const currentA = data.shuntV_a / config.shuntR_a;
  const currentB = data.shuntV_b / config.shuntR_b;

  if (![currentA, currentB, data.busV_a * currentA, data.busV_b * currentB].every(Number.isFinite)) {
    throw new Error('Measurement exceeds numeric range');
  }
  return {
    channelA: {
      busVoltage:   data.busV_a,
      shuntVoltage: data.shuntV_a,
      current:      currentA,
      power:        data.busV_a * currentA,
      timestamp:    data.timestamp,
    },
    channelB: {
      busVoltage:   data.busV_b,
      shuntVoltage: data.shuntV_b,
      current:      currentB,
      power:        data.busV_b * currentB,
      timestamp:    data.timestamp,
    },
  };
}

function validateResistance(config: DeviceConfigPayload): void {
  const valid = [config.shuntR_a, config.shuntR_b].every((r) => Number.isFinite(r) && r > 0);
  if (!valid) throw new Error('Shunt resistance must be finite and positive');
}
