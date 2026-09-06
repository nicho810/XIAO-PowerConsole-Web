/**
 * [INPUT]: node:test、协议/串口/抽样/积分模块与 Web Streams 模拟串口
 * [OUTPUT]: 核心正确性回归测试，无需真实硬件
 * [POS]: tests/ 的边界与生命周期验证
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import './monitor.test.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { SerialConnection } from '../src/serial/serial-port.js';
import { SerialSession } from '../src/serial/handshake.js';
import { decodeDeviceConfig, decodeRealtimeData, deriveMeasurement } from '../src/protocol/codec.js';
import { crc8Maxim } from '../src/protocol/crc8.js';
import { FrameParser } from '../src/protocol/frame-parser.js';
import { peakPoints } from '../src/lib/peak-sampling.js';
import { integrateA, resetA, snapshotA, clearEnergyTimestamps } from '../src/store/energy-store.js';
import { pushSample, clearMeasurements, getMeasurementVersion, buffers } from '../src/store/measurement-store.js';

function configBytes(a = 0.00049, b = 0.123456): Uint8Array {
  const bytes = new Uint8Array(9);
  const view = new DataView(bytes.buffer);
  view.setFloat32(0, a, true);
  view.setFloat32(4, b, true);
  bytes[8] = 1;
  return bytes;
}
function sampleBytes(timestamp = 10): Uint8Array {
  const bytes = new Uint8Array(20);
  const view = new DataView(bytes.buffer);
  [5, 0.00049, 3.3, 0.123456].forEach((value, i) => view.setFloat32(i * 4, value, true));
  view.setUint32(16, timestamp, true);
  return bytes;
}
function frame(type: number, payload: Uint8Array): Uint8Array {
  const body = Uint8Array.of(type, payload.length, ...payload);
  return Uint8Array.of(0xaa, 0x55, ...body, crc8Maxim(body));
}

class FakePort extends EventTarget {
  controller!: ReadableStreamDefaultController<Uint8Array>;
  readable = new ReadableStream<Uint8Array>({ start: (controller) => { this.controller = controller; } });
  commands: number[] = [];
  failAck = false;
  openCount = 0;
  closeCount = 0;
  writable = new WritableStream<Uint8Array>({ write: (bytes) => {
    this.commands.push(bytes[2]);
    if (bytes[2] === 0xc1 && this.failAck) throw new Error('ACK failed');
  } });
  async open() { this.openCount++; }
  async close() {
    assert.equal(this.readable.locked, false, 'reader released before port.close');
    assert.equal(this.writable.locked, false, 'writer released before port.close');
    this.closeCount++;
  }
}
function usePort(requestPort: () => Promise<FakePort>) {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serial: { requestPort } } });
}
async function until(predicate: () => boolean) {
  for (let i = 0; i < 200; i++) {
    if (predicate()) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  assert.fail('Condition did not settle');
}
function setup(port = new FakePort()) {
  usePort(async () => port);
  const samples: unknown[] = [];
  const configs: unknown[] = [];
  const errors: unknown[] = [];
  const session = new SerialSession({
    onHandshake() {}, onConfig: (config) => configs.push(config),
    onSample: (sample) => samples.push(sample), onError: (error) => errors.push(error),
  });
  return { port, samples, configs, errors, session };
}
async function startStreaming(context: ReturnType<typeof setup>) {
  const start = context.session.start();
  await until(() => context.port.commands.includes(0xc0));
  context.port.controller.enqueue(frame(0xfe, configBytes()));
  await start;
}

test('calibration keeps float32 precision, including sub-milliohm resistors', () => {
  const config = decodeDeviceConfig(configBytes());
  assert.equal(config.shuntR_a, Math.fround(0.00049));
  const measurement = deriveMeasurement(decodeRealtimeData(sampleBytes()), config);
  assert.equal(measurement.channelA.current, 1);
  assert.equal(measurement.channelA.power, 5);
});

test('payload lengths, invalid resistance and non-finite measurements are rejected', () => {
  for (const length of [0, 8, 10]) assert.throws(() => decodeDeviceConfig(new Uint8Array(length)));
  for (const length of [0, 19, 21]) assert.throws(() => decodeRealtimeData(new Uint8Array(length)));
  for (const value of [0, -1, NaN, Infinity]) assert.throws(() => decodeDeviceConfig(configBytes(value)));
  const bytes = sampleBytes();
  new DataView(bytes.buffer).setFloat32(0, NaN, true);
  assert.throws(() => decodeRealtimeData(bytes));
  const padded = Uint8Array.of(1, 2, ...configBytes(), 3);
  assert.equal(decodeDeviceConfig(padded.subarray(2, 11)).shuntR_a, Math.fround(0.00049));
});

test('CRC parser handles split frames and discards corruption', () => {
  const parser = new FrameParser();
  const bytes = frame(0x01, sampleBytes());
  assert.equal(parser.feedMany(bytes.subarray(0, 7)).length, 0);
  assert.equal(parser.feedMany(bytes.subarray(7)).length, 1);
  bytes[bytes.length - 1] ^= 1;
  assert.equal(parser.feedMany(bytes).length, 0);
  assert.equal(parser.feedMany(frame(0xfe, configBytes())).length, 1);
});

test('single reader preserves CONFIG + DATA in one chunk, split DATA and re-handshake', async () => {
  const context = setup();
  const start = context.session.start();
  await until(() => context.port.commands.includes(0xc0));
  const next = frame(0x01, sampleBytes(20));
  context.port.controller.enqueue(Uint8Array.of(...frame(0xfe, configBytes()), ...frame(0x01, sampleBytes()), ...next.subarray(0, 8)));
  await start;
  context.port.controller.enqueue(next.subarray(8));
  context.port.controller.enqueue(Uint8Array.of(...frame(0xfe, configBytes(0.001)), ...frame(0x01, sampleBytes(30))));
  await until(() => context.samples.length === 3);
  assert.equal(context.configs.length, 2);
  assert.equal(context.errors.length, 0);
  assert.equal(context.port.commands.filter((type) => type === 0xc1).length, 2);
  await context.session.close();
  await context.session.close();
  assert.equal(context.port.closeCount, 1);
  assert.equal(context.port.commands.at(-1), 0xc2);
});

test('cancellation waits for pending port selection without starting a stale session', async () => {
  const port = new FakePort();
  let select!: (port: FakePort) => void;
  usePort(() => new Promise((resolve) => { select = resolve; }));
  let handshake = false;
  const session = new SerialSession({ onHandshake: () => { handshake = true; }, onConfig() {}, onSample() {}, onError() {} });
  const start = session.start();
  const rejected = assert.rejects(start, /cancelled/);
  const closing = session.close();
  select(port);
  await Promise.all([rejected, closing]);
  assert.equal(handshake, false);
  assert.equal(port.closeCount, 1);
});

test('closing while blocked in read cancels and releases locks', async () => {
  const context = setup();
  await startStreaming(context);
  await context.session.close();
  assert.equal(context.port.readable.locked, false);
  assert.equal(context.errors.length, 0);
});

test('handshake timeout can be cleaned up and the next connection succeeds', async () => {
  const context = setup();
  await assert.rejects(context.session.start(10), /timeout/);
  await context.session.close();
  const next = setup();
  await startStreaming(next);
  await next.session.close();
});

test('ACK rejection fails handshake and releases resources', async () => {
  const context = setup();
  context.port.failAck = true;
  const result = assert.rejects(context.session.start(), /ACK failed/);
  await until(() => context.port.commands.includes(0xc0));
  context.port.controller.enqueue(frame(0xfe, configBytes()));
  await result;
  await context.session.close();
  assert.equal(context.configs.length, 0);
  assert.equal(context.errors.length, 1);
});

test('device EOF and stream error propagate once instead of restarting the read loop', async () => {
  for (const mode of ['eof', 'error']) {
    const context = setup();
    await startStreaming(context);
    if (mode === 'eof') context.port.controller.close();
    else context.port.controller.error(new Error('Device removed'));
    await until(() => context.errors.length === 1);
    await context.session.close();
    assert.equal(context.errors.length, 1);
  }
});

test('transport refuses a second reader', async () => {
  const port = new FakePort();
  usePort(async () => port);
  const serial = new SerialConnection();
  await serial.connect();
  const reading = serial.startReading(async () => {});
  assert.throws(() => serial.startReading(async () => {}), /already active/);
  await serial.disconnect();
  await reading;
});

test('peak sampling preserves narrow positive and negative spikes, actual timestamps and endpoints', () => {
  const timestamps = Float64Array.from({ length: 3000 }, (_, i) => i * 10);
  const values = new Float64Array(3000);
  values[17] = 100;
  values[23] = -80;
  values[2999] = 12;
  const points = peakPoints(timestamps, values, 3000);
  assert.ok(points.some(([ts, value]) => ts === 170 && value === 100));
  assert.ok(points.some(([ts, value]) => ts === 230 && value === -80));
  assert.deepEqual(points[0], [0, 0]);
  assert.deepEqual(points.at(-1), [29990, 12]);
  assert.ok(points.length <= 600);
  assert.ok(points.every(([ts], i) => i === 0 || ts > points[i - 1][0]));
});

test('gaps stay explicit and small/empty series remain valid', () => {
  assert.deepEqual(peakPoints(new Float64Array(), new Float64Array(), 0), []);
  const points = peakPoints(Float64Array.of(0, 10, 1000, 1010), Float64Array.of(1, 2, 3, 4), 4);
  assert.deepEqual(points, [[0, 1], [10, 2], [1000, null], [1000, 3], [1010, 4]]);
});

test('charge uses trapezoidal integration and only counts valid sampling intervals', () => {
  resetA();
  assert.equal(snapshotA().elapsedMs, 0);
  integrateA(0, 1000);
  integrateA(2, 1500);
  assert.ok(Math.abs(snapshotA().chargeUAh - 500 / 3.6) < 1e-9);
  assert.equal(snapshotA().elapsedMs, 500);
  integrateA(2, 2500);
  integrateA(2, 100);
  integrateA(NaN, 110);
  integrateA(2, 120);
  assert.equal(snapshotA().elapsedMs, 500);
  clearEnergyTimestamps();
  integrateA(2, 10000);
  assert.equal(snapshotA().elapsedMs, 500);
  resetA();
  assert.deepEqual(snapshotA(), { chargeUAh: 0, chargeMah: 0, elapsedMs: 0 });
});

test('device clock reset clears chart history and increments the display revision', () => {
  clearMeasurements();
  const config = decodeDeviceConfig(configBytes());
  pushSample(deriveMeasurement(decodeRealtimeData(sampleBytes(1000)), config));
  const version = getMeasurementVersion();
  pushSample(deriveMeasurement(decodeRealtimeData(sampleBytes(10)), config));
  assert.ok(getMeasurementVersion() > version);
  assert.deepEqual(Array.from(buffers.timestamp.toArray()), [10]);
  clearMeasurements();
});

test('cancelling during handshake rejects readiness without consuming later samples', async () => {
  const context = setup();
  const rejected = assert.rejects(context.session.start(), /cancelled/);
  await until(() => context.port.commands.includes(0xc0));
  await context.session.close();
  await rejected;
  assert.equal(context.configs.length, 0);
  assert.equal(context.samples.length, 0);
  assert.equal(context.port.closeCount, 1);
});

test('malformed configuration fails the session instead of publishing invalid readings', async () => {
  const context = setup();
  const rejected = assert.rejects(context.session.start(), /positive/);
  await until(() => context.port.commands.includes(0xc0));
  context.port.controller.enqueue(Uint8Array.of(...frame(0xfe, configBytes(0)), ...frame(0x01, sampleBytes())));
  await rejected;
  await context.session.close();
  assert.equal(context.configs.length, 0);
  assert.equal(context.samples.length, 0);
});
