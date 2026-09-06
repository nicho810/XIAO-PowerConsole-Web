/**
 * [INPUT]:  依赖 recording-store、health-store 与 @/lib/ring-buffer 的 RingBuffer，
 *           依赖 @/types/measurement 的 DualChannelSample，
 *           依赖 @/store/energy-store 的 integrateA/B/clearEnergyTimestamps
 * [OUTPUT]: 对外提供 pushSample / clearMeasurements / getSampleCount / getLatest / getMeasurementVersion
 *           + buffers 环形缓冲区引用
 * [POS]:    store/ 的测量数据管理，100Hz 热路径零 React 零 Zustand；时钟复位清图，版本单调增长
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { recording } from './recording-store.js';
import { streamHealth } from './health-store.js';
import { RingBuffer } from '@/lib/ring-buffer.js';
import type { DualChannelSample } from '@/types/measurement.js';
import { integrateA, integrateB, clearEnergyTimestamps } from '@/store/energy-store.js';

// ============================================================
//  缓冲区容量: 3000 = 30s @ 100Hz
// ============================================================

const CAPACITY = 3000;

// ============================================================
//  7 个环形缓冲区 — 可变外部状态，不走 React 渲染
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
//  模块级可变状态 — 100Hz 热路径，无 React 通知；录制单独分块追加
// ============================================================
//  采集不广播高频 React 更新；图表按 15fps 读取共享帧，数字按 10Hz 更新。
// ============================================================

let _sampleCount = 0;
let _version = 0;
let _latest: DualChannelSample | null = null;

export function getMeasurementVersion(): number { return _version; }
export function getSampleCount(): number { return _sampleCount; }
export function getLatest(): DualChannelSample | null { return _latest; }

// ============================================================
//  写入接口
// ============================================================

/** 100Hz 热路径 — 写入原始采样、积分与录制；仅启用录制时分配 CSV 行 */
export function pushSample(sample: DualChannelSample): void {
  if (_latest && sample.channelA.timestamp < _latest.channelA.timestamp) {
    clearMeasurements();
  }
  buffers.voltageA.push(sample.channelA.busVoltage);
  buffers.voltageB.push(sample.channelB.busVoltage);
  buffers.currentA.push(sample.channelA.current);
  buffers.currentB.push(sample.channelB.current);
  buffers.powerA.push(sample.channelA.power);
  buffers.powerB.push(sample.channelB.power);
  buffers.timestamp.push(sample.channelA.timestamp);

  integrateA(sample.channelA.current, sample.channelA.timestamp);
  integrateB(sample.channelB.current, sample.channelB.timestamp);

  recording.append(sample);
  streamHealth.sample();
  _latest = sample;
  _sampleCount++;
  _version++;
}

/** 清空所有缓冲区和状态 */
export function clearMeasurements(): void {
  Object.values(buffers).forEach((b) => b.clear());
  clearEnergyTimestamps();
  _latest = null;
  _sampleCount = 0;
  _version++;
}
