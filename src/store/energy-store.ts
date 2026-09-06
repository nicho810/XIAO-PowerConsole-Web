/**
 * [INPUT]: 无外部依赖，接收电流 A 和设备时间戳 ms
 * [OUTPUT]: integrateA/B、resetA/B、snapshotA/B、clearEnergyTimestamps
 * [POS]: store/ 的电荷积分器，采集驱动；仅有效采样间隔计时，累计值由显式 Reset 清除
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
interface ChannelAccum {
  chargeUAh: number;
  elapsedMs: number;
  lastDeviceTs: number;
  lastCurrent: number;
}

function makeChannel(): ChannelAccum {
  return { chargeUAh: 0, elapsedMs: 0, lastDeviceTs: -1, lastCurrent: 0 };
}
const state = { A: makeChannel(), B: makeChannel() };

// -- 梯形积分：相邻两次采样取平均；断流、回绕和非有限值不跨越积分 --
function integrate(ch: ChannelAccum, current: number, timestamp: number): void {
  if (!Number.isFinite(current) || !Number.isFinite(timestamp)) {
    ch.lastDeviceTs = -1;
    return;
  }
  const dt = timestamp - ch.lastDeviceTs;
  if (ch.lastDeviceTs >= 0 && dt > 0 && dt <= 500) {
    ch.chargeUAh += (ch.lastCurrent + current) / 2 * dt / 3.6;
    ch.elapsedMs += dt;
  }
  ch.lastDeviceTs = timestamp;
  ch.lastCurrent = current;
}

export function integrateA(current: number, timestamp: number): void { integrate(state.A, current, timestamp); }
export function integrateB(current: number, timestamp: number): void { integrate(state.B, current, timestamp); }
export function resetA(): void { state.A = makeChannel(); }
export function resetB(): void { state.B = makeChannel(); }
export function clearEnergyTimestamps(): void {
  state.A.lastDeviceTs = -1;
  state.B.lastDeviceTs = -1;
}

export interface EnergySnapshot {
  chargeUAh: number;
  chargeMah: number;
  elapsedMs: number;
}
function snapshot(ch: ChannelAccum): EnergySnapshot {
  return { chargeUAh: ch.chargeUAh, chargeMah: ch.chargeUAh / 1000, elapsedMs: ch.elapsedMs };
}
export function snapshotA(): EnergySnapshot { return snapshot(state.A); }
export function snapshotB(): EnergySnapshot { return snapshot(state.B); }
