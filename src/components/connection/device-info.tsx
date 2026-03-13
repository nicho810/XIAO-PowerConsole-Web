/**
 * [INPUT]:  依赖 react, lucide-react, device-store, measurement-store
 * [OUTPUT]: 对外提供 DeviceInfo 组件 — 设备配置与实时数值显示
 * [POS]:    connection/ 的信息面板，被 Sidebar 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useRef } from 'react';
import { Cpu } from 'lucide-react';
import { useDeviceStore } from '@/store/device-store.js';
import { getSampleCount, getLatest } from '@/store/measurement-store.js';
import { formatVoltage, formatCurrent, formatPower } from '@/lib/utils.js';
import type { DualChannelSample } from '@/types/measurement.js';

/** 10Hz 足够人眼读取数字 */
const DISPLAY_THROTTLE = 100;

// ── 数据格子 — 居中显示 label + value + 色点 ───────────────────
function DataCell({ label, value, dotColor }: { label: string; value: string; dotColor?: string }) {
  return (
    <div className="rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-0.5">
        {dotColor && <span className={`inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(${dotColor}))]`} />}
        <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{label}</span>
      </div>
      <span className="data-value text-sm font-semibold">{value}</span>
    </div>
  );
}

// ── Config Row ──────────────────────────────────────────────────
function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="data-value font-medium">{value}</span>
    </div>
  );
}

export function DeviceInfo() {
  const config = useDeviceStore((s) => s.config);
  const status = useDeviceStore((s) => s.status);

  // ── rAF 轮询 — 100Hz 数据不碰 React，10Hz 刷新显示 ──────
  const [latest, setLatest] = useState<DualChannelSample | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const lastSeenRef = useRef(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    let rafId = 0;

    function tick() {
      rafId = requestAnimationFrame(tick);

      const count = getSampleCount();
      if (count === lastSeenRef.current) return;
      lastSeenRef.current = count;

      if (count === 0) {
        setLatest(null);
        setSampleCount(0);
        return;
      }

      const now = performance.now();
      if (now - lastUpdateRef.current < DISPLAY_THROTTLE) return;
      lastUpdateRef.current = now;

      setLatest(getLatest());
      setSampleCount(count);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  if (status === 'disconnected') {
    return (
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-elevated p-4">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Device Info</h2>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">No device connected</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-elevated p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Device Info</h2>
      </div>

      {/* ── Config 行 ──────────────────────────────────────────── */}
      <div className="space-y-1 mb-3">
        {config && (
          <>
            <ConfigRow label="Shunt R (A)" value={`${config.shuntR_a.toFixed(3)} Ω`} />
            <ConfigRow label="Shunt R (B)" value={`${config.shuntR_b.toFixed(3)} Ω`} />
            <ConfigRow label="Protocol" value={`v${config.version}`} />
          </>
        )}
        <ConfigRow label="Samples" value={String(sampleCount)} />
      </div>

      {/* ── Channel 数据网格 ───────────────────────────────────── */}
      {latest && (
        <>
          <div className="border-t border-[hsl(var(--border))] my-3" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Channel A</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <DataCell label="Voltage" value={formatVoltage(latest.channelA.busVoltage)} dotColor="--chart-voltage-a" />
            <DataCell label="Current" value={formatCurrent(latest.channelA.current)} dotColor="--chart-current-a" />
            <DataCell label="Power" value={formatPower(latest.channelA.power)} dotColor="--chart-power-a" />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Channel B</p>
          <div className="grid grid-cols-3 gap-2">
            <DataCell label="Voltage" value={formatVoltage(latest.channelB.busVoltage)} dotColor="--chart-voltage-b" />
            <DataCell label="Current" value={formatCurrent(latest.channelB.current)} dotColor="--chart-current-b" />
            <DataCell label="Power" value={formatPower(latest.channelB.power)} dotColor="--chart-power-b" />
          </div>
        </>
      )}
    </div>
  );
}
