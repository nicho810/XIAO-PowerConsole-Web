/**
 * [INPUT]: 原始测量/电荷 store、sharedPeakIndices
 * [OUTPUT]: 暂停/恢复、显示时间窗口、同步读数与三图共用显示帧
 * [POS]: store/ 的纯展示状态；仅冻结显示，不反向控制采集与录制
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { buffers, getLatest, getSampleCount, getMeasurementVersion } from './measurement-store.js';
import { snapshotA, snapshotB } from './energy-store.js';
import { sharedPeakIndices, type ChartPoint } from '@/lib/peak-sampling.js';

export const SERIES_KEYS = ['voltageA', 'voltageB', 'currentA', 'currentB', 'powerA', 'powerB'] as const;
export type SeriesKey = typeof SERIES_KEYS[number];
export type TimeWindow = 5000 | 10000 | 30000;
type RawBuffers = Record<keyof typeof buffers, Float64Array>;

function readLive() {
  return { latest: getLatest(), count: getSampleCount(), charge: [snapshotA(), snapshotB()] };
}
function captureBuffers(): RawBuffers {
  return Object.fromEntries(Object.entries(buffers).map(([key, buffer]) => [key, buffer.toArray()])) as RawBuffers;
}

let frozen: { data: RawBuffers; reading: ReturnType<typeof readLive> } | null = null;
let windowMs: TimeWindow = 30000;
let revision = 0;
export function getViewState() { return { paused: frozen !== null, windowMs }; }
export function getDisplayVersion(): string { return `${revision}:${frozen ? 'paused' : getMeasurementVersion()}`; }
export function getDisplayReadings() { return frozen?.reading ?? readLive(); }

export function setPaused(paused: boolean): void {
  if (paused === (frozen !== null)) return;
  frozen = paused ? { data: captureBuffers(), reading: readLive() } : null;
  revision++;
}
export function setTimeWindow(value: TimeWindow): void {
  windowMs = value;
  revision++;
}

export interface ChartFrame {
  version: number;
  series: Record<SeriesKey, ChartPoint[]>;
  min: number | undefined;
  max: number | undefined;
}
let frame: ChartFrame | null = null;
let lastSource = '';
let lastRevision = -1;
let lastUpdate = -Infinity;
let frameVersion = 0;

/** 三图同帧更新，15fps 节流只做一次抽样；暂停/窗口变更立即生效。 */
export function getChartFrame(now = performance.now()): ChartFrame {
  const source = getDisplayVersion();
  if (frame && (source === lastSource || (revision === lastRevision && now - lastUpdate < 66))) return frame;
  const data = frozen?.data ?? captureBuffers();
  const end = data.timestamp[data.timestamp.length - 1];
  let first = 0;
  while (first < data.timestamp.length && end !== undefined && data.timestamp[first] < end - windowMs) first++;
  const ts = data.timestamp.subarray(first);
  const values = SERIES_KEYS.map((key) => data[key].subarray(first));
  const indices = sharedPeakIndices(ts, values);
  const series = Object.fromEntries(SERIES_KEYS.map((key, n) => [key, indices.map((index): ChartPoint =>
    index < 0 ? [ts[-index - 1], null] : [ts[index], values[n][index]])])) as Record<SeriesKey, ChartPoint[]>;
  frame = { version: ++frameVersion, series, min: ts[0], max: end };
  lastSource = source;
  lastRevision = revision;
  lastUpdate = now;
  return frame;
}
