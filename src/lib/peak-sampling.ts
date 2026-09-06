/**
 * [INPUT]: 有序设备时间戳、测量值缓冲区与显示点预算
 * [OUTPUT]: peakPoints / sharedPeakIndices，保留桶内极值、首尾样本和断流缺口的 [ms, value] 点列
 * [POS]: lib/ 的纯图表抽样算法，被 RealtimeChart 使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
export type ChartPoint = [number, number | null];

/** 单曲线入口与三图共享入口复用同一抽样算法。 */
export function peakPoints(ts: Float64Array, values: Float64Array, length: number, maxPoints = 600): ChartPoint[] {
  return sharedPeakIndices(ts.subarray(0, length), [values.subarray(0, length)], maxPoints)
    .map((index): ChartPoint => index < 0 ? [ts[-index - 1], null] : [ts[index], values[index]]);
}

/** 所有曲线共享索引；每桶保留每条曲线的极值，以便同一游标比较同一采样。 */
export function sharedPeakIndices(ts: Float64Array, values: Float64Array[], maxPoints = 600): number[] {
  const out: number[] = [];
  const pointsPerBucket = values.length * 2 + 2;
  const bucketSize = Math.max(1, Math.ceil(ts.length * pointsPerBucket / maxPoints));
  let start = 0;
  for (let i = 1; i <= ts.length; i++) {
    const gap = i < ts.length && (ts[i] <= ts[i - 1] || ts[i] - ts[i - 1] > 500);
    if (i < ts.length && i - start < bucketSize && !gap) continue;
    const indices = new Set([start, i - 1]);
    for (const series of values) addExtrema(indices, series, start, i);
    out.push(...[...indices].sort((a, b) => a - b));
    if (gap) out.push(-i - 1);
    start = i;
  }
  return out;
}

function addExtrema(indices: Set<number>, values: Float64Array, start: number, end: number): void {
  let min = start;
  let max = start;
  for (let i = start + 1; i < end; i++) {
    if (values[i] < values[min]) min = i;
    if (values[i] > values[max]) max = i;
  }
  indices.add(min);
  indices.add(max);
}
