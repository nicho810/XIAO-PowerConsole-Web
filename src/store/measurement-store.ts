/**
 * [INPUT]:  依赖 zustand，依赖 @/lib/ring-buffer 的 RingBuffer，
 *           依赖 @/types/measurement 的 DualChannelSample
 * [OUTPUT]: 对外提供 useMeasurementStore — 环形缓冲区存储测量数据
 * [POS]:    store/ 的测量数据管理，被图表渲染和协议 hook 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand';
import { RingBuffer } from '@/lib/ring-buffer.js';
import type { DualChannelSample } from '@/types/measurement.js';

// ============================================================
//  缓冲区容量: 3000 = 30s @ 100Hz
// ============================================================

const CAPACITY = 3000;

// ============================================================
//  6 个环形缓冲区 — 可变外部状态，不走 React 渲染
// ============================================================

export const buffers = {
  voltageA:  new RingBuffer(CAPACITY),
  voltageB:  new RingBuffer(CAPACITY),
  currentA:  new RingBuffer(CAPACITY),
  currentB:  new RingBuffer(CAPACITY),
  powerA:    new RingBuffer(CAPACITY),
  powerB:    new RingBuffer(CAPACITY),
  timestamp: new RingBuffer(CAPACITY),
};

// ============================================================
//  Store — 仅存储最新值和采样计数器（驱动 UI 刷新）
// ============================================================

interface MeasurementState {
  latest: DualChannelSample | null;
  sampleCount: number;
}

interface MeasurementActions {
  pushSample: (sample: DualChannelSample) => void;
  clear: () => void;
}

export const useMeasurementStore = create<MeasurementState & MeasurementActions>()(
  (set) => ({
    latest: null,
    sampleCount: 0,

    pushSample: (sample) => {
      // 写入环形缓冲区 — 可变操作，零 GC
      buffers.voltageA.push(sample.channelA.busVoltage);
      buffers.voltageB.push(sample.channelB.busVoltage);
      buffers.currentA.push(sample.channelA.current);
      buffers.currentB.push(sample.channelB.current);
      buffers.powerA.push(sample.channelA.power);
      buffers.powerB.push(sample.channelB.power);
      buffers.timestamp.push(sample.channelA.timestamp);

      // 更新 React 感知的状态（节流由 use-chart-data 处理）
      set((s) => ({ latest: sample, sampleCount: s.sampleCount + 1 }));
    },

    clear: () => {
      Object.values(buffers).forEach((b) => b.clear());
      set({ latest: null, sampleCount: 0 });
    },
  }),
);
