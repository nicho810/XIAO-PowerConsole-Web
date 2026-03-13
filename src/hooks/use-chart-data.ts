/**
 * [INPUT]:  依赖 react, measurement-store 的 buffers
 * [OUTPUT]: 对外提供 useChartData hook — rAF 驱动的图表数据快照（零分配）
 * [POS]:    hooks/ 的图表数据桥接，被 chart 组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { buffers, useMeasurementStore } from '@/store/measurement-store.js';

// ============================================================
//  useChartData — rAF 节流，~30fps，预分配缓冲区零拷贝快照
// ============================================================
//  核心优化:
//   1. copyTo() 写入预分配 Float64Array，避免每帧 7× new
//   2. subarray() 返回视图而非拷贝，零分配
//   3. 时间标签仅格式化一次，三张图表共享
// ============================================================

export interface ChartSnapshot {
  version: number;
  timestamps: Float64Array;
  labels: string[];
  voltageA: Float64Array;
  voltageB: Float64Array;
  currentA: Float64Array;
  currentB: Float64Array;
  powerA: Float64Array;
  powerB: Float64Array;
}

const EMPTY: ChartSnapshot = {
  version: 0,
  timestamps: new Float64Array(0),
  labels: [],
  voltageA: new Float64Array(0),
  voltageB: new Float64Array(0),
  currentA: new Float64Array(0),
  currentB: new Float64Array(0),
  powerA: new Float64Array(0),
  powerB: new Float64Array(0),
};

/** ~33ms 间隔 ≈ 30fps */
const THROTTLE_MS = 33;

// ── 预分配缓冲区 — 模块级单例，生命周期 = 页面 ──────────────

const CAP = buffers.timestamp.capacity;
const _ts = new Float64Array(CAP);
const _vA = new Float64Array(CAP);
const _vB = new Float64Array(CAP);
const _cA = new Float64Array(CAP);
const _cB = new Float64Array(CAP);
const _pA = new Float64Array(CAP);
const _pB = new Float64Array(CAP);
const _labels: string[] = new Array<string>(CAP);

// ── 时间格式化 ─────────────────────────────────────────────

/** 时间戳 → "M:SS.f" 标签 */
function formatTimestamp(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60) % 60;
  const s = Math.floor(totalSec) % 60;
  const frac = Math.floor((totalSec % 1) * 10);
  return `${m}:${String(s).padStart(2, '0')}.${frac}`;
}

// ── Hook ────────────────────────────────────────────────────

export function useChartData(): ChartSnapshot {
  const [snapshot, setSnapshot] = useState<ChartSnapshot>(EMPTY);
  const rafRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const versionRef = useRef(0);
  const sampleCount = useMeasurementStore((s) => s.sampleCount);

  const takeSnapshot = useCallback(() => {
    // copyTo 写入预分配缓冲区，返回有效长度
    const len = buffers.timestamp.copyTo(_ts);
    buffers.voltageA.copyTo(_vA);
    buffers.voltageB.copyTo(_vB);
    buffers.currentA.copyTo(_cA);
    buffers.currentB.copyTo(_cB);
    buffers.powerA.copyTo(_pA);
    buffers.powerB.copyTo(_pB);

    // 格式化时间标签 — 每帧仅执行一次，三张图表共享
    for (let i = 0; i < len; i++) {
      _labels[i] = formatTimestamp(_ts[i]);
    }

    setSnapshot({
      version: ++versionRef.current,
      timestamps: _ts.subarray(0, len),
      labels: _labels.slice(0, len),
      voltageA: _vA.subarray(0, len),
      voltageB: _vB.subarray(0, len),
      currentA: _cA.subarray(0, len),
      currentB: _cB.subarray(0, len),
      powerA: _pA.subarray(0, len),
      powerB: _pB.subarray(0, len),
    });
  }, []);

  useEffect(() => {
    if (sampleCount === 0) {
      setSnapshot(EMPTY);
      return;
    }

    const now = performance.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) {
      // 节流: 安排下一帧更新
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0;
          lastUpdateRef.current = performance.now();
          takeSnapshot();
        });
      }
      return;
    }

    lastUpdateRef.current = now;
    takeSnapshot();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [sampleCount, takeSnapshot]);

  return snapshot;
}
