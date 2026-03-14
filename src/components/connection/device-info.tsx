/**
 * [INPUT]:  依赖 react, lucide-react, device-store, measurement-store,
 *           energy-store 的 snapshotA/B/resetA/B，lib/utils 的格式化函数，hooks/use-locale
 * [OUTPUT]: 对外提供 DeviceInfo 组件 — 设备信息 + 实时测量 + 能量统计 合并面板
 * [POS]:    connection/ 的核心信息面板，被 Sidebar 消费；
 *           始终渲染完整结构，未连接时值显示 '—'
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Cpu, RotateCcw } from 'lucide-react';
import { useDeviceStore } from '@/store/device-store.js';
import { getSampleCount, getLatest } from '@/store/measurement-store.js';
import { snapshotA, snapshotB, resetA, resetB } from '@/store/energy-store.js';
import type { EnergySnapshot } from '@/store/energy-store.js';
import { formatVoltage, formatCurrent, formatPower, formatElapsed } from '@/lib/utils.js';
import type { ChannelMeasurement, DualChannelSample } from '@/types/measurement.js';
import { useLocale } from '@/hooks/use-locale.js';

/** 10Hz 足够人眼读取数字 */
const DISPLAY_THROTTLE = 100;

const EMPTY_SNAPSHOT: EnergySnapshot = { chargeUAh: 0, chargeMah: 0, elapsedMs: 0 };

// ============================================================
//  数据展示子组件
// ============================================================

function DataCell({ label, value, dotColor }: { label: string; value: string; dotColor?: string }) {
  return (
    <div className="rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-0.5">
        {dotColor && <span className={`inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(${dotColor}))]`} />}
        <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{label}</span>
      </div>
      <span className="data-value text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="data-value font-medium tabular-nums">{value}</span>
    </div>
  );
}

// ── 通道块 — 实时 V/I/P + 能量累积 ─────────────────────────

interface ChannelBlockProps {
  label:        string;
  channel:      ChannelMeasurement | null;
  energy:       EnergySnapshot;
  onReset:      () => void;
  voltageColor: string;
  currentColor: string;
  powerColor:   string;
  tVoltage:     string;
  tCurrent:     string;
  tPower:       string;
  tEnergy:      string;
  tReset:       string;
  tCharge:      string;
  tElapsed:     string;
}

function ChannelBlock({
  label, channel, energy, onReset,
  voltageColor, currentColor, powerColor,
  tVoltage, tCurrent, tPower, tEnergy, tReset, tCharge, tElapsed,
}: ChannelBlockProps) {
  return (
    <div>
      {/* ── 实时 V / I / P ──────────────────────────── */}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2 mb-2.5">
        <DataCell label={tVoltage} value={channel ? formatVoltage(channel.busVoltage) : '—'} dotColor={voltageColor} />
        <DataCell label={tCurrent} value={channel ? formatCurrent(channel.current)    : '—'} dotColor={currentColor} />
        <DataCell label={tPower}   value={channel ? formatPower(channel.power)         : '—'} dotColor={powerColor} />
      </div>

      {/* ── 能量统计块 ──────────────────────────────── */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-3">
        {/* 标题 + Reset */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            {tEnergy}
          </span>
          <button
            onClick={onReset}
            title={tReset}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            {tReset}
          </button>
        </div>

        {/* 累积电荷 */}
        <div className="rounded-md bg-[hsl(var(--muted))] px-2.5 py-2 mb-1.5">
          <div className="text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">{tCharge}</div>
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

        {/* 统计用时 */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[hsl(var(--muted-foreground))]">{tElapsed}</span>
          <span className="data-value font-medium tabular-nums">{formatElapsed(energy.elapsedMs)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  主组件
// ============================================================

export function DeviceInfo() {
  const config = useDeviceStore((s) => s.config);
  const { t }  = useLocale();

  const [latest, setLatest]           = useState<DualChannelSample | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [energyA, setEnergyA]         = useState<EnergySnapshot>(EMPTY_SNAPSHOT);
  const [energyB, setEnergyB]         = useState<EnergySnapshot>(EMPTY_SNAPSHOT);

  const lastSeenRef   = useRef(0);
  const lastUpdateRef = useRef(0);

  // ── rAF 轮询 — 10Hz 刷新数值 + elapsed 每帧更新 ──────
  useEffect(() => {
    let rafId = 0;

    function tick() {
      rafId = requestAnimationFrame(tick);

      const now = performance.now();
      if (now - lastUpdateRef.current < DISPLAY_THROTTLE) return;
      lastUpdateRef.current = now;

      const count = getSampleCount();
      if (count !== lastSeenRef.current) {
        lastSeenRef.current = count;
        setSampleCount(count);
        setLatest(count > 0 ? getLatest() : null);
      }

      // elapsed 持续刷新（计时器不停）
      setEnergyA(snapshotA());
      setEnergyB(snapshotB());
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleResetA = useCallback(() => { resetA(); setEnergyA(snapshotA()); }, []);
  const handleResetB = useCallback(() => { resetB(); setEnergyB(snapshotB()); }, []);

  // ── 通道块公共 props ─────────────────────────────────
  const channelProps = {
    tVoltage: t.voltage, tCurrent: t.current, tPower: t.power,
    tEnergy: t.energy, tReset: t.reset, tCharge: t.charge, tElapsed: t.elapsed,
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-elevated p-4">
      {/* ── 标题 ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t.deviceInfo}</h2>
        </div>
        <span className="text-[10px] tabular-nums text-[hsl(var(--muted-foreground))]">{sampleCount} {t.samples}</span>
      </div>

      {/* ── Config 行 ──────────────────────────────────── */}
      <div className="space-y-1 mb-3">
        <ConfigRow label={t.shuntRA}   value={config ? `${config.shuntR_a.toFixed(3)} Ω` : '—'} />
        <ConfigRow label={t.shuntRB}   value={config ? `${config.shuntR_b.toFixed(3)} Ω` : '—'} />
        <ConfigRow label={t.protocol}  value={config ? `v${config.version}`               : '—'} />
      </div>

      {/* ── 双通道数据 ─────────────────────────────────── */}
      <div className="border-t border-[hsl(var(--border))] my-3" />
      <ChannelBlock
        {...channelProps}
        label={t.channelA}
        channel={latest?.channelA ?? null}
        energy={energyA}
        onReset={handleResetA}
        voltageColor="--chart-voltage-a"
        currentColor="--chart-current-a"
        powerColor="--chart-power-a"
      />
      <div className="border-t border-[hsl(var(--border))] my-3" />
      <ChannelBlock
        {...channelProps}
        label={t.channelB}
        channel={latest?.channelB ?? null}
        energy={energyB}
        onReset={handleResetB}
        voltageColor="--chart-voltage-b"
        currentColor="--chart-current-b"
        powerColor="--chart-power-b"
      />
    </div>
  );
}
