/**
 * [INPUT]:  依赖 react, measurement-store 的 buffers
 * [OUTPUT]: 对外提供 useChartData hook — rAF 驱动的图表数据快照
 * [POS]:    hooks/ 的图表数据桥接，被 chart 组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { buffers, useMeasurementStore } from '@/store/measurement-store.js';

// ============================================================
//  useChartData — rAF 节流，~30fps 快照推送
// ============================================================

export interface ChartSnapshot {
  timestamps: Float64Array;
  voltageA: Float64Array;
  voltageB: Float64Array;
  currentA: Float64Array;
  currentB: Float64Array;
  powerA: Float64Array;
  powerB: Float64Array;
}

const EMPTY: ChartSnapshot = {
  timestamps: new Float64Array(0),
  voltageA: new Float64Array(0),
  voltageB: new Float64Array(0),
  currentA: new Float64Array(0),
  currentB: new Float64Array(0),
  powerA: new Float64Array(0),
  powerB: new Float64Array(0),
};

/** ~33ms 间隔 ≈ 30fps */
const THROTTLE_MS = 33;

export function useChartData(): ChartSnapshot {
  const [snapshot, setSnapshot] = useState<ChartSnapshot>(EMPTY);
  const rafRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const sampleCount = useMeasurementStore((s) => s.sampleCount);

  const takeSnapshot = useCallback(() => {
    setSnapshot({
      timestamps: buffers.timestamp.toArray(),
      voltageA: buffers.voltageA.toArray(),
      voltageB: buffers.voltageB.toArray(),
      currentA: buffers.currentA.toArray(),
      currentB: buffers.currentB.toArray(),
      powerA: buffers.powerA.toArray(),
      powerB: buffers.powerB.toArray(),
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
