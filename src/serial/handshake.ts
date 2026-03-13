/**
 * [INPUT]:  依赖 @/serial/serial-port 的 SerialConnection，
 *           依赖 @/protocol/frame-builder 和 @/protocol/frame-parser
 * [OUTPUT]: 对外提供 performHandshake — 三阶段握手状态机
 * [POS]:    serial/ 的握手协议实现，被 use-serial hook 在连接时调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { FRAME_TYPE, type DeviceConfigPayload } from '@/types/protocol.js';
import { FrameParser } from '@/protocol/frame-parser.js';
import { decodeDeviceConfig } from '@/protocol/codec.js';
import { buildStartFrame, buildConfigAckFrame } from '@/protocol/frame-builder.js';
import type { SerialConnection } from './serial-port.js';

// ============================================================
//  三阶段握手: START → CONFIG → CONFIG_ACK → 开始数据流
// ============================================================

const HANDSHAKE_TIMEOUT = 3000; // 总超时 3s

/**
 * 执行三阶段握手
 *
 * 1. PC → START
 * 2. Device → CONFIG (包含 shuntR 等设备参数)
 * 3. PC → CONFIG_ACK
 *
 * @returns 设备配置 + 取消读取函数
 */
export async function performHandshake(
  serial: SerialConnection,
  onLog?: (msg: string) => void,
): Promise<{ config: DeviceConfigPayload; stopReading: () => void }> {
  return new Promise((resolve, reject) => {
    const parser = new FrameParser();
    let timer: ReturnType<typeof setTimeout>;

    // 启动串口读取
    const stopReading = serial.startReading((chunk) => {
      const frames = parser.feedMany(chunk);
      for (const frame of frames) {
        if (frame.type === FRAME_TYPE.DEVICE_CONFIG) {
          clearTimeout(timer);
          const config = decodeDeviceConfig(frame.payload);
          onLog?.(`Config received: shuntR_a=${config.shuntR_a}, shuntR_b=${config.shuntR_b}, v=${config.version}`);

          // Phase 3: 发送 CONFIG_ACK
          serial.write(buildConfigAckFrame()).then(() => {
            onLog?.('CONFIG_ACK sent, handshake complete');
            resolve({ config, stopReading });
          }).catch(reject);
          return;
        }
      }
    });

    // 超时处理
    timer = setTimeout(() => {
      stopReading();
      reject(new Error('Handshake timeout'));
    }, HANDSHAKE_TIMEOUT);

    // Phase 1: 发送 START
    onLog?.('Sending START...');
    serial.write(buildStartFrame()).catch((err) => {
      clearTimeout(timer);
      stopReading();
      reject(err);
    });
  });
}
