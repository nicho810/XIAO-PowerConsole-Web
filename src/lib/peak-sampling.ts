/**
 * [INPUT]: 有序设备时间戳、测量值缓冲区与显示点预算
 * [OUTPUT]: peakPoints，保留桶内极值、首尾样本和断流缺口的 [ms, value] 点列
 * [POS]: lib/ 的纯图表抽样算法，被 RealtimeChart 使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
export type ChartPoint = [number, number | null];

function appendBucket(out: ChartPoint[], ts: Float64Array, values: Float64Array, start: number, end: number): void {
  let min = start;
  let max = start;
  for (let i = start + 1; i < end; i++) {
    if (values[i] < values[min]) min = i;
    if (values[i] > values[max]) max = i;
  }
  for (const index of [...new Set([start, min, max, end - 1])].sort((a, b) => a - b)) {
    out.push([ts[index], values[index]]);
  }
}

/** 桶内首尾保证阶跃边缘；大量缺口时允许超出软预算，优先保持数据语义。 */
export function peakPoints(ts: Float64Array, values: Float64Array, length: number, maxPoints = 600): ChartPoint[] {
  const out: ChartPoint[] = [];
  const bucketSize = Math.max(1, Math.ceil(length * 4 / Math.max(4, maxPoints)));
  let start = 0;
  for (let i = 1; i <= length; i++) {
    const gap = i < length && (ts[i] <= ts[i - 1] || ts[i] - ts[i - 1] > 500);
    if (i < length && i - start < bucketSize && !gap) continue;
    appendBucket(out, ts, values, start, i);
    if (gap) out.push([ts[i], null]);
    start = i;
  }
  return out;
}
