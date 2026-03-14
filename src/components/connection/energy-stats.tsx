/**
 * [INPUT]:  依赖 react, lucide-react, device-store, measurement-store,
 *           energy-store 的 snapshotA/B/resetA/B，lib/utils 的格式化函数
 * [OUTPUT]: 对外提供 EnergyStats 组件 — 双通道能量累积统计面板
 * [POS]:    connection/ 的能量统计面板，被 Sidebar 消费；
 *           与 DeviceInfo 平行，专注于积分量而非瞬时值
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, RotateCcw } from 'lucide-react';
import { useDeviceStore } from '@/store/device-store.js';
import { getSampleCount, getLatest } from '@/store/measurement-store.js';
import { snapshotA, snapshotB, resetA, resetB } from '@/store/energy-store.js';
import type { EnergySnapshot } from '@/store/energy-store.js';
import { formatVoltage, formatCurrent, formatElapsed } from '@/lib/utils.js';
import type { ChannelMeasurement } from '@/types/measurement.js';

/** 15Hz 足够统计数值人眼跟踪 */
const DISPLAY_THROTTLE = 67;

// ── 通道面板 ──────────────────────────────────────────────────

interface ChannelPanelProps {
  label: string;
  channel: ChannelMeasurement | null;
  energy: EnergySnapshot;
  onReset: () => void;
  voltageColor: string;
  currentColor: string;
}

function ChannelPanel({ label, channel, energy, onReset, voltageColor, currentColor }: ChannelPanelProps) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-3">
      {/* ── 通道标题 + Reset ───────────────────────────── */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          {label}
        </span>
        <button
          onClick={onReset}
          title="Reset accumulator"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          Reset
        </button>
      </div>

      {/* ── 实时 V / I ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        <div className="rounded-md bg-[hsl(var(--muted))] px-2.5 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(${voltageColor}))]`} />
            <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Voltage</span>
          </div>
          <span className="data-value text-xs font-semibold tabular-nums">
            {channel ? formatVoltage(channel.busVoltage) : '—'}
          </span>
        </div>
        <div className="rounded-md bg-[hsl(var(--muted))] px-2.5 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(${currentColor}))]`} />
            <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Current</span>
          </div>
          <span className="data-value text-xs font-semibold tabular-nums">
            {channel ? formatCurrent(channel.current) : '—'}
          </span>
        </div>
      </div>

      {/* ── 累积能量 ───────────────────────────────────── */}
      <div className="rounded-md bg-[hsl(var(--muted))] px-2.5 py-2 mb-1.5">
        <div className="text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
          Charge
        </div>
        <div className="flex items-baseline justify-between">
          <span className="data-value text-sm font-bold tabular-nums">
            {energy.chargeUAh < 1000
              ? `${energy.chargeUAh.toFixed(1)} µAh`
              : `${energy.chargeMah.toFixed(3)} mAh`}
          </span>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums">
            {energy.chargeMah.toFixed(4)} mAh
          </span>
        </div>
        <div className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums mt-0.5">
          {energy.chargeUAh.toFixed(1)} µAh
        </div>
      </div>

      {/* ── 统计用时 ───────────────────────────────────── */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[hsl(var(--muted-foreground))]">Elapsed</span>
        <span className="data-value font-medium tabular-nums">{formatElapsed(energy.elapsedMs)}</span>
      </div>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────

interface EnergyState {
  snapshotA: EnergySnapshot;
  snapshotB: EnergySnapshot;
}

const EMPTY_SNAPSHOT: EnergySnapshot = { chargeUAh: 0, chargeMah: 0, elapsedMs: 0 };

export function EnergyStats() {
  const status = useDeviceStore((s) => s.status);

  const [realtime, setRealtime] = useState<{ chA: ChannelMeasurement | null; chB: ChannelMeasurement | null }>({
    chA: null, chB: null,
  });
  const [energy, setEnergy] = useState<EnergyState>({
    snapshotA: EMPTY_SNAPSHOT,
    snapshotB: EMPTY_SNAPSHOT,
  });

  const lastSeenRef   = useRef(0);
  const lastUpdateRef = useRef(0);

  // ── rAF 轮询 — 15Hz 刷新统计数据 ──────────────────────
  useEffect(() => {
    let rafId = 0;

    function tick() {
      rafId = requestAnimationFrame(tick);

      const count = getSampleCount();

      const now = performance.now();
      if (now - lastUpdateRef.current < DISPLAY_THROTTLE) return;

      // 每帧都更新 elapsed（即使没有新样本，计时器也在走）
      const hasNewSample = count !== lastSeenRef.current;
      if (hasNewSample) lastSeenRef.current = count;

      lastUpdateRef.current = now;

      const latest = getLatest();
      setRealtime({
        chA: latest?.channelA ?? null,
        chB: latest?.channelB ?? null,
      });
      setEnergy({ snapshotA: snapshotA(), snapshotB: snapshotB() });
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Reset 回调 ─────────────────────────────────────────
  const handleResetA = useCallback(() => {
    resetA();
    setEnergy((prev) => ({ ...prev, snapshotA: snapshotA() }));
  }, []);

  const handleResetB = useCallback(() => {
    resetB();
    setEnergy((prev) => ({ ...prev, snapshotB: snapshotB() }));
  }, []);

  if (status === 'disconnected') return null;

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-elevated p-4">
      {/* ── 标题 ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Energy Stats
        </h2>
      </div>

      {/* ── 双通道 ───────────────────────────────────── */}
      <div className="space-y-2">
        <ChannelPanel
          label="Channel A"
          channel={realtime.chA}
          energy={energy.snapshotA}
          onReset={handleResetA}
          voltageColor="--chart-voltage-a"
          currentColor="--chart-current-a"
        />
        <ChannelPanel
          label="Channel B"
          channel={realtime.chB}
          energy={energy.snapshotB}
          onReset={handleResetB}
          voltageColor="--chart-voltage-b"
          currentColor="--chart-current-b"
        />
      </div>
    </div>
  );
}
