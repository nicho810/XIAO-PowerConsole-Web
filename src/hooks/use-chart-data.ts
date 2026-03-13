/**
 * [INPUT]:  依赖 react, measurement-store 的 buffers / getSampleCount
 * [OUTPUT]: 对外提供 useChartData hook — rAF 驱动的图表数据快照（零分配）
 * [POS]:    hooks/ 的图表数据桥接，被 chart 组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { buffers, getSampleCount } from '@/store/measurement-store.js';

// ============================================================
//  useChartData — rAF 轮询，~30fps，预分配缓冲区零拷贝快照
// ============================================================
//  核心优化:
//   1. rAF 轮询 getSampleCount() 替代 Zustand 订阅，
//      100Hz 数据不触发任何 React 机制
//   2. copyTo() 写入预分配 Float64Array，避免每帧 7× new
//   3. 显示降采样: 超过 MAX_DISPLAY 时等距抽样，原地覆写零分配
//   4. subarray() 返回视图而非拷贝，零分配
//   5. 时间标签仅格式化一次，三张图表共享
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

/** 显示上限 — 图表宽度约 600~800px，超出无视觉意义 */
const MAX_DISPLAY = 600;

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
  const versionRef = useRef(0);

  const takeSnapshot = useCallback(() => {
    const raw = buffers.timestamp.copyTo(_ts);
    buffers.voltageA.copyTo(_vA);
    buffers.voltageB.copyTo(_vB);
    buffers.currentA.copyTo(_cA);
    buffers.currentB.copyTo(_cB);
    buffers.powerA.copyTo(_pA);
    buffers.powerB.copyTo(_pB);

    // 降采样: 超过显示上限时等距抽样，原地覆写零分配
    const stride = raw > MAX_DISPLAY ? Math.ceil(raw / MAX_DISPLAY) : 1;
    const len = stride > 1 ? Math.ceil(raw / stride) : raw;

    if (stride > 1) {
      for (let i = 0; i < len; i++) {
        const s = i * stride;
        _ts[i] = _ts[s];
        _vA[i] = _vA[s];
        _vB[i] = _vB[s];
        _cA[i] = _cA[s];
        _cB[i] = _cB[s];
        _pA[i] = _pA[s];
        _pB[i] = _pB[s];
      }
    }

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

  // ── rAF 轮询 — 100Hz 数据完全不碰 React ─────────────────
  useEffect(() => {
    let rafId = 0;
    let lastSeen = 0;
    let lastUpdate = 0;

    function tick() {
      rafId = requestAnimationFrame(tick);

      const count = getSampleCount();

      // 无变化 → 跳过
      if (count === lastSeen) return;

      // 数据被清空 → 重置
      if (count === 0) {
        lastSeen = 0;
        setSnapshot(EMPTY);
        return;
      }

      lastSeen = count;

      // 节流到 ~30fps
      const now = performance.now();
      if (now - lastUpdate < THROTTLE_MS) return;
      lastUpdate = now;

      takeSnapshot();
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [takeSnapshot]);

  return snapshot;
}
