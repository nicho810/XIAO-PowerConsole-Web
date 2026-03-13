/**
 * [INPUT]:  依赖 react, device-store, measurement-store
 * [OUTPUT]: 对外提供 DeviceInfo 组件 — 设备配置与实时数值显示
 * [POS]:    connection/ 的信息面板，被 Sidebar 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/device-store.js';
import { getSampleCount, getLatest } from '@/store/measurement-store.js';
import { formatVoltage, formatCurrent, formatPower } from '@/lib/utils.js';
import type { DualChannelSample } from '@/types/measurement.js';

/** 10Hz 足够人眼读取数字 */
const DISPLAY_THROTTLE = 100;

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
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <h2 className="text-base font-semibold mb-2">Device Info</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">No device connected</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <h2 className="text-base font-semibold mb-2">Device Info</h2>
      <div className="space-y-1 text-sm">
        {config && (
          <>
            <Row label="Shunt R (A)" value={`${config.shuntR_a} ohm`} />
            <Row label="Shunt R (B)" value={`${config.shuntR_b} ohm`} />
            <Row label="Protocol" value={`v${config.version}`} />
          </>
        )}
        <Row label="Samples" value={String(sampleCount)} />
        {latest && (
          <>
            <div className="border-t border-[hsl(var(--border))] my-2" />
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Channel A</p>
            <Row label="Voltage" value={formatVoltage(latest.channelA.busVoltage)} />
            <Row label="Current" value={formatCurrent(latest.channelA.current)} />
            <Row label="Power" value={formatPower(latest.channelA.power)} />
            <div className="border-t border-[hsl(var(--border))] my-2" />
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Channel B</p>
            <Row label="Voltage" value={formatVoltage(latest.channelB.busVoltage)} />
            <Row label="Current" value={formatCurrent(latest.channelB.current)} />
            <Row label="Power" value={formatPower(latest.channelB.power)} />
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
