/**
 * [INPUT]:  依赖 react, SerialConnection, handshake, frame-parser, codec,
 *           device-store, measurement-store, use-log
 * [OUTPUT]: 对外提供 useSerial hook — 串口连接生命周期管理
 * [POS]:    hooks/ 的串口控制核心，被 ConnectionPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useCallback, useRef } from 'react';
import { SerialConnection } from '@/serial/serial-port.js';
import { performHandshake } from '@/serial/handshake.js';
import { FrameParser } from '@/protocol/frame-parser.js';
import { decodeRealtimeData, deriveMeasurement } from '@/protocol/codec.js';
import { buildStopFrame } from '@/protocol/frame-builder.js';
import { FRAME_TYPE } from '@/types/protocol.js';
import { useDeviceStore } from '@/store/device-store.js';
import { useMeasurementStore } from '@/store/measurement-store.js';
import { useLog } from './use-log.js';

// ============================================================
//  useSerial — 连接 / 断开 / 数据流管理
// ============================================================

export function useSerial() {
  const serialRef = useRef<SerialConnection | null>(null);
  const stopReadingRef = useRef<(() => void) | null>(null);

  const { setStatus, setConfig, setError, reset, config } = useDeviceStore();
  const pushSample = useMeasurementStore((s) => s.pushSample);
  const clearMeasurements = useMeasurementStore((s) => s.clear);
  const log = useLog();

  const connect = useCallback(async () => {
    try {
      setStatus('connecting');
      log('Requesting serial port...', 'info');

      const serial = new SerialConnection();
      serialRef.current = serial;
      await serial.connect();

      // 三阶段握手
      setStatus('handshaking');
      log('Starting handshake...', 'info');

      const { config: deviceConfig, stopReading: stopHandshake } = await performHandshake(
        serial,
        (msg) => log(msg, 'info'),
      );

      // 握手完成，停止握手读取，切换到数据流读取
      stopHandshake();
      setConfig(deviceConfig);

      // 启动数据流读取
      const parser = new FrameParser();
      const stopReading = serial.startReading((chunk) => {
        const frames = parser.feedMany(chunk);
        for (const frame of frames) {
          if (frame.type === FRAME_TYPE.REALTIME_DATA) {
            const raw = decodeRealtimeData(frame.payload);
            const sample = deriveMeasurement(raw, deviceConfig);
            pushSample(sample);
          }
        }
      });

      stopReadingRef.current = stopReading;
      setStatus('streaming');
      log('Streaming started', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      log(`Connection failed: ${msg}`, 'error');
      await cleanup();
    }
  }, [setStatus, setConfig, setError, pushSample, log]);

  const disconnect = useCallback(async () => {
    log('Disconnecting...', 'warning');
    await cleanup();
    reset();
    clearMeasurements();
    log('Disconnected', 'warning');
  }, [reset, clearMeasurements, log]);

  const cleanup = async () => {
    stopReadingRef.current?.();
    stopReadingRef.current = null;

    if (serialRef.current) {
      try {
        await serialRef.current.write(buildStopFrame());
      } catch { /* 设备可能已断开 */ }

      await serialRef.current.disconnect();
      serialRef.current = null;
    }
  };

  return { connect, disconnect };
}
