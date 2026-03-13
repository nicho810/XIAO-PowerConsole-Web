/**
 * [INPUT]:  依赖 react, device-store, measurement-store, use-log
 * [OUTPUT]: 对外提供 useTestMode hook — 模拟数据生成
 * [POS]:    hooks/ 的测试模式，走同一 pushSample 路径
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useCallback, useRef } from 'react';
import { useDeviceStore } from '@/store/device-store.js';
import { pushSample, clearMeasurements } from '@/store/measurement-store.js';
import { useLog } from './use-log.js';
import type { DualChannelSample } from '@/types/measurement.js';

// ============================================================
//  useTestMode — 正弦波模拟数据 @ 100Hz
// ============================================================

export function useTestMode() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const { status, setStatus, setConfig, reset: resetDevice } = useDeviceStore();
  const log = useLog();

  const start = useCallback(() => {
    if (timerRef.current) return;

    // 模拟设备配置
    setConfig({ shuntR_a: 0.1, shuntR_b: 0.1, version: 1 });
    setStatus('test-mode');
    clearMeasurements();
    startTimeRef.current = Date.now();
    log('Test mode started — generating sine wave data', 'success');

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const t = elapsed / 1000; // 秒

      const sample: DualChannelSample = {
        channelA: {
          busVoltage:   5.0 + 0.5 * Math.sin(2 * Math.PI * 0.5 * t),
          shuntVoltage: 0.01 + 0.005 * Math.sin(2 * Math.PI * 0.3 * t),
          current:      0.1 + 0.05 * Math.sin(2 * Math.PI * 0.3 * t),
          power:        0.5 + 0.25 * Math.sin(2 * Math.PI * 0.4 * t),
          timestamp:    elapsed,
        },
        channelB: {
          busVoltage:   3.3 + 0.3 * Math.sin(2 * Math.PI * 0.7 * t + 1),
          shuntVoltage: 0.005 + 0.002 * Math.sin(2 * Math.PI * 0.5 * t + 1),
          current:      0.05 + 0.02 * Math.sin(2 * Math.PI * 0.5 * t + 1),
          power:        0.165 + 0.066 * Math.sin(2 * Math.PI * 0.6 * t + 1),
          timestamp:    elapsed,
        },
      };

      pushSample(sample);
    }, 10); // 100Hz
  }, [setConfig, setStatus, log]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    resetDevice();
    clearMeasurements();
    log('Test mode stopped', 'warning');
  }, [resetDevice, log]);

  const toggle = useCallback(() => {
    if (status === 'test-mode') stop();
    else start();
  }, [status, start, stop]);

  return { toggle, isTestMode: status === 'test-mode' };
}
