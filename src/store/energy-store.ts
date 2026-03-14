/**
 * [INPUT]:  无外部依赖 — 纯 TypeScript 模块级状态
 * [OUTPUT]: 对外提供 integrateA/B、resetA/B、snapshotA/B、clearEnergyTimestamps
 * [POS]:    store/ 的能量累积器，被 measurement-store 的 pushSample 驱动，
 *           被 EnergyStats 组件通过 rAF 轮询消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
//  单通道累积状态 — 零 GC，零 React
// ============================================================

interface ChannelAccum {
  chargeUAh:   number;  // 已累积电荷量 (µAh)
  startWallMs: number;  // 上次 reset 的挂钟时间 (ms)
  lastDeviceTs: number; // 上一个设备时间戳 (ms)，-1 表示尚无样本
}

function makeChannel(): ChannelAccum {
  return { chargeUAh: 0, startWallMs: Date.now(), lastDeviceTs: -1 };
}

const state = {
  A: makeChannel(),
  B: makeChannel(),
};

// ============================================================
//  积分核心 — 仅在 dt 合理时累积，防止重连跳变
// ============================================================
//  dt < 0      : 设备时间戳回绕，跳过
//  dt > 500ms  : 流中断/丢帧，跳过
//  dQ(µAh) = I(A) × dt(s) × (1_000_000 / 3600)
// ============================================================

function integrate(ch: ChannelAccum, currentA: number, deviceTs: number): void {
  if (ch.lastDeviceTs >= 0) {
    const dt_s = (deviceTs - ch.lastDeviceTs) / 1000;
    if (dt_s > 0 && dt_s < 0.5) {
      ch.chargeUAh += currentA * dt_s * (1_000_000 / 3600);
    }
  }
  ch.lastDeviceTs = deviceTs;
}

// ============================================================
//  写入接口 — 由 measurement-store.pushSample 调用
// ============================================================

export function integrateA(currentA: number, deviceTs: number): void {
  integrate(state.A, currentA, deviceTs);
}

export function integrateB(currentA: number, deviceTs: number): void {
  integrate(state.B, currentA, deviceTs);
}

// ============================================================
//  重置接口 — 由 UI Reset 按钮触发
// ============================================================

export function resetA(): void {
  state.A.chargeUAh   = 0;
  state.A.startWallMs = Date.now();
  state.A.lastDeviceTs = -1;
}

export function resetB(): void {
  state.B.chargeUAh   = 0;
  state.B.startWallMs = Date.now();
  state.B.lastDeviceTs = -1;
}

/** 重连时清空时间戳，防止跨连接积分 */
export function clearEnergyTimestamps(): void {
  state.A.lastDeviceTs = -1;
  state.B.lastDeviceTs = -1;
}

// ============================================================
//  快照接口 — rAF 轮询端消费
// ============================================================

export interface EnergySnapshot {
  chargeUAh:  number;  // 累积电荷 (µAh)
  chargeMah:  number;  // 累积电荷 (mAh)
  elapsedMs:  number;  // 统计已用时 (ms)，lastDeviceTs=-1 时为 0
}

function snapshot(ch: ChannelAccum): EnergySnapshot {
  return {
    chargeUAh: ch.chargeUAh,
    chargeMah: ch.chargeUAh / 1000,
    elapsedMs: ch.lastDeviceTs < 0 ? 0 : Date.now() - ch.startWallMs,
  };
}

export function snapshotA(): EnergySnapshot { return snapshot(state.A); }
export function snapshotB(): EnergySnapshot { return snapshot(state.B); }
