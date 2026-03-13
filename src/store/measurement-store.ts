/**
 * [INPUT]:  依赖 @/lib/ring-buffer 的 RingBuffer，
 *           依赖 @/types/measurement 的 DualChannelSample
 * [OUTPUT]: 对外提供 pushSample / clearMeasurements / getSampleCount / getLatest
 *           + buffers 环形缓冲区引用
 * [POS]:    store/ 的测量数据管理，100Hz 热路径零 React 零 Zustand
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

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
//  模块级可变状态 — 100Hz 热路径，零分配，零通知
// ============================================================
//  不用 Zustand 是因为:
//   set() 每次调用创建 3 个对象 + 通知所有订阅者
//   100Hz × 3 objects = 300 objects/sec 纯开销
//   消费端改用 rAF 轮询，按显示帧率读取即可
// ============================================================

let _sampleCount = 0;
let _latest: DualChannelSample | null = null;

export function getSampleCount(): number { return _sampleCount; }
export function getLatest(): DualChannelSample | null { return _latest; }

// ============================================================
//  写入接口
// ============================================================

/** 100Hz 热路径 — 仅写入环形缓冲区 + 更新计数器，零 GC */
export function pushSample(sample: DualChannelSample): void {
  buffers.voltageA.push(sample.channelA.busVoltage);
  buffers.voltageB.push(sample.channelB.busVoltage);
  buffers.currentA.push(sample.channelA.current);
  buffers.currentB.push(sample.channelB.current);
  buffers.powerA.push(sample.channelA.power);
  buffers.powerB.push(sample.channelB.power);
  buffers.timestamp.push(sample.channelA.timestamp);

  _latest = sample;
  _sampleCount++;
}

/** 清空所有缓冲区和状态 */
export function clearMeasurements(): void {
  Object.values(buffers).forEach((b) => b.clear());
  _latest = null;
  _sampleCount = 0;
}
