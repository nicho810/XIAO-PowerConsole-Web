/**
 * [INPUT]:  依赖 @/types/protocol 的 RealtimeDataPayload/DeviceConfigPayload，
 *           依赖 @/types/measurement 的 DualChannelSample
 * [OUTPUT]: 对外提供 decodeRealtimeData、decodeDeviceConfig、deriveMeasurement
 * [POS]:    protocol/ 的解码 & 派生计算层，衔接帧解析器与业务数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { RealtimeDataPayload, DeviceConfigPayload } from '@/types/protocol.js';
import type { DualChannelSample } from '@/types/measurement.js';

// ============================================================
//  载荷解码 — 从原始字节到结构体
// ============================================================

/**
 * 解码实时采样载荷 (20 字节 little-endian)
 *
 * 布局: busV_a(f32) + shuntV_a(f32) + busV_b(f32) + shuntV_b(f32) + timestamp(u32)
 */
export function decodeRealtimeData(payload: Uint8Array): RealtimeDataPayload {
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return {
    busV_a:    view.getFloat32(0,  true),
    shuntV_a:  view.getFloat32(4,  true),
    busV_b:    view.getFloat32(8,  true),
    shuntV_b:  view.getFloat32(12, true),
    timestamp: view.getUint32(16,  true),
  };
}

/**
 * 解码设备配置载荷 (9 字节 little-endian)
 *
 * 布局: shuntR_a(f32) + shuntR_b(f32) + version(u8)
 */
export function decodeDeviceConfig(payload: Uint8Array): DeviceConfigPayload {
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return {
    shuntR_a: parseFloat(view.getFloat32(0, true).toFixed(3)),
    shuntR_b: parseFloat(view.getFloat32(4, true).toFixed(3)),
    version:  view.getUint8(8),
  };
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
  const currentA = data.shuntV_a / config.shuntR_a;
  const currentB = data.shuntV_b / config.shuntR_b;

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
