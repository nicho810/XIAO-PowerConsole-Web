/**
 * [INPUT]: node:test 与显示/健康/CSV 录制模块
 * [OUTPUT]: 暂停隔离、共享游标采样、断流监测与录制完整性回归
 * [POS]: tests/ 的测量工作区测试，由 core.test.ts 引入
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CsvRecorder, recording } from '../src/store/recording-store.js';
import { StreamHealth } from '../src/store/health-store.js';
import { setPaused, setTimeWindow, getChartFrame, getDisplayReadings } from '../src/store/chart-view-store.js';
import { pushSample, clearMeasurements, buffers } from '../src/store/measurement-store.js';
import { sharedPeakIndices } from '../src/lib/peak-sampling.js';
import { FrameParser } from '../src/protocol/frame-parser.js';
import { buildStartFrame } from '../src/protocol/frame-builder.js';

const config = { shuntR_a: 0.00049, shuntR_b: 0.123456, version: 1 };
function sample(timestamp: number, current = 0.123456789) {
  const channel = { timestamp, busVoltage: 5.001, shuntVoltage: current * config.shuntR_a, current, power: 5.001 * current };
  return { channelA: channel, channelB: { ...channel, busVoltage: 3.301, power: 3.301 * current } };
}

test('recording outlives the 3000-sample display buffer and exports full precision', async () => {
  recording.stop(); recording.clear(); clearMeasurements();
  recording.start(config, 0);
  for (let i = 0; i < 4100; i++) pushSample(sample(i * 10));
  assert.equal(buffers.timestamp.length, 3000);
  assert.equal(recording.snapshot().count, 4100);
  recording.stop();
  clearMeasurements();
  const lines = (await recording.exportBlob().text()).trim().split('\r\n');
  assert.equal(lines.length, 4101);
  assert.equal(lines[1].split(',')[6], '0.123456789');
  assert.equal(lines[1].split(',')[12], '0.00049');
  assert.equal(lines.at(-1)?.split(',')[3], '40990');
  assert.equal(lines[0].split(',').length, lines[1].split(',').length);
  recording.clear();
});

test('CSV export is an immutable snapshot while recording continues; stop/resume appends segments', async () => {
  const recorder = new CsvRecorder();
  recorder.start(config, 0);
  recorder.append(sample(10), 0);
  const first = recorder.exportBlob();
  recorder.append(sample(20), 10);
  recorder.stop();
  recorder.append(sample(30), 20);
  recorder.start(config, 30);
  recorder.append(sample(5), 30);
  assert.equal((await first.text()).trim().split('\r\n').length, 2);
  const lines = (await recorder.exportBlob().text()).trim().split('\r\n');
  assert.equal(lines.length, 4);
  assert.equal(lines.at(-1)?.split(',')[1], '2');
  recorder.clear();
  assert.equal(recorder.snapshot().count, 3, 'active recording cannot be cleared');
  recorder.stop(); recorder.clear();
  assert.equal(recorder.snapshot().count, 0);
});

test('CSV respects size limit without a partial row and exposes an explicit stop reason', async () => {
  const recorder = new CsvRecorder(500);
  recorder.start(config, 0);
  for (let i = 0; i < 100; i++) recorder.append(sample(i), i);
  const state = recorder.snapshot();
  assert.equal(state.active, false);
  assert.equal(state.reason, 'limit');
  assert.ok(state.count > 0);
  const blob = recorder.exportBlob();
  assert.ok(blob.size <= 500);
  assert.equal(blob.size, state.bytes);
  assert.equal((await blob.text()).trim().split('\r\n').length, state.count + 1);
  recorder.start(config);
  assert.equal(recorder.snapshot().active, false);
});

test('paused view is stable while acquisition and recording advance; resume shows newest data', () => {
  setPaused(false); setTimeWindow(30000); clearMeasurements();
  recording.start(config);
  pushSample(sample(1000, 1));
  const live = getChartFrame(1000);
  setPaused(true);
  const frozen = getChartFrame(1001);
  for (let i = 0; i < 3100; i++) pushSample(sample(1010 + i * 10, 2));
  assert.equal(getChartFrame(10000), frozen);
  assert.equal(getDisplayReadings().latest?.channelA.current, 1);
  assert.equal(recording.snapshot().count, 3101);
  clearMeasurements();
  assert.equal(getChartFrame(11000), frozen, 'disconnect does not erase frozen inspection');
  pushSample(sample(50000, 3));
  setPaused(false);
  assert.equal(getDisplayReadings().latest?.channelA.current, 3);
  assert.notEqual(getChartFrame(12000), live);
  assert.equal(getChartFrame(12000).max, 50000);
  recording.stop(); recording.clear(); clearMeasurements();
});

test('time window uses device time and can change within a frozen snapshot', () => {
  setPaused(false); clearMeasurements();
  for (let i = 0; i <= 1000; i++) pushSample(sample(i * 10));
  setPaused(true); setTimeWindow(5000);
  const frame = getChartFrame(20000);
  assert.equal(frame.min, 5000);
  assert.equal(frame.max, 10000);
  setTimeWindow(10000);
  assert.equal(getChartFrame(20001).min, 0);
  setPaused(false); setTimeWindow(30000); clearMeasurements();
});

test('shared chart frames use identical sample times across voltage/current/power and preserve spikes', () => {
  const ts = Float64Array.from({ length: 3000 }, (_, i) => i * 10);
  const a = new Float64Array(3000);
  const b = new Float64Array(3000);
  a[17] = 100; b[23] = -80;
  const indices = sharedPeakIndices(ts, [a, b]);
  assert.ok(indices.includes(17)); assert.ok(indices.includes(23));
  assert.equal(indices[0], 0); assert.equal(indices.at(-1), 2999);
  assert.ok(indices.length <= 600);
  const withGap = sharedPeakIndices(Float64Array.of(0, 10, 1000), [Float64Array.of(1, 2, 3)]);
  assert.deepEqual(withGap, [0, 1, -3, 2]);
});

test('health reports waiting, stale, recovery, rate and CRC count independently of device clock', () => {
  const health = new StreamHealth();
  health.begin(0);
  assert.equal(health.snapshot(100).state, 'waiting');
  assert.equal(health.snapshot(2000).state, 'stale');
  health.sample(2100);
  assert.equal(health.snapshot(2100).state, 'live');
  assert.equal(health.snapshot(4200).rateHz, 0);
  health.crcError(); health.receiveBytes(500);
  assert.equal(health.snapshot(4200).crcErrors, 1);
  health.end();
  assert.equal(health.snapshot(4200).state, 'idle');
  health.begin(5000);
  for (let i = 0; i < 300; i++) health.sample(5000 + i * 10);
  assert.ok(Math.abs(health.snapshot(8000).rateHz - 100) < 1);
  assert.equal(health.snapshot(8000).crcErrors, 0);
});

test('CRC diagnostics count rejected frames without preventing resynchronization', () => {
  let errors = 0;
  const parser = new FrameParser(() => errors++);
  const corrupted = buildStartFrame();
  corrupted[corrupted.length - 1] ^= 1;
  assert.equal(parser.feedMany(corrupted).length, 0);
  assert.equal(errors, 1);
  assert.equal(parser.feedMany(buildStartFrame()).length, 1);
});
