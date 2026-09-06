/**
 * [INPUT]: React、测量/电荷 store、useLocale 与物理量格式化工具
 * [OUTPUT]: MeasurementSummary，双通道实时读数和紧凑电荷统计
 * [POS]: connection/ 的主要读数视图，由 MainContent 放在图表之前
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useCallback, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { getLatest, getSampleCount, getMeasurementVersion } from '@/store/measurement-store.js';
import { snapshotA, snapshotB, resetA, resetB } from '@/store/energy-store.js';
import { formatVoltage, formatCurrent, formatPower, formatElapsed } from '@/lib/utils.js';
import { useLocale } from '@/hooks/use-locale.js';

function readSnapshot() {
  return { latest: getLatest(), count: getSampleCount(), charge: [snapshotA(), snapshotB()] };
}

function useReadings() {
  const [reading, setReading] = useState(readSnapshot);
  const refresh = useCallback(() => setReading(readSnapshot()), []);
  useEffect(() => {
    let version = getMeasurementVersion();
    refresh();
    const timer = setInterval(() => {
      const next = getMeasurementVersion();
      if (next === version) return;
      version = next;
      refresh();
    }, 100);
    return () => clearInterval(timer);
  }, [refresh]);
  return { reading, refresh };
}

export function MeasurementSummary() {
  const { reading, refresh } = useReadings();
  const { t } = useLocale();
  const channels = [reading.latest?.channelA, reading.latest?.channelB];
  return (
    <section aria-label={`${t.channelA} / ${t.channelB}`} className="grid grid-cols-1 xl:grid-cols-2 gap-4 shrink-0">
      {channels.map((channel, index) => {
        const label = index === 0 ? t.channelA : t.channelB;
        const color = index === 0 ? '--chart-voltage-a' : '--chart-voltage-b';
        const charge = reading.charge[index];
        const metrics = [
          [t.voltage, channel ? formatVoltage(channel.busVoltage) : '—'],
          [t.current, channel ? formatCurrent(channel.current) : '—'],
          [t.power, channel ? formatPower(channel.power) : '—'],
        ];
        return (
          <article key={label} className="reading-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <header className="flex items-center justify-between gap-3 mb-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(var(${color}))` }} />{label}
              </h2>
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] data-value">{reading.count} {t.samples}</span>
            </header>
            <dl className="grid grid-cols-3 gap-3">
              {metrics.map(([name, value]) => (
                <div key={name} className="min-w-0">
                  <dt className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">{name}</dt>
                  <dd className="data-value reading-value font-semibold tracking-tight" title={value}>{value}</dd>
                </div>
              ))}
            </dl>
            <footer className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">{t.charge}</span>
              <span className="data-value font-medium">
                {Math.abs(charge.chargeUAh) < 1000 ? `${charge.chargeUAh.toFixed(1)} µAh` : `${charge.chargeMah.toFixed(3)} mAh`}
              </span>
              <span className="text-[hsl(var(--muted-foreground))] data-value" title={t.elapsed}>{formatElapsed(charge.elapsedMs)}</span>
              <button
                className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                aria-label={`${t.reset} · ${label} · ${t.charge}`}
                onClick={() => { (index === 0 ? resetA : resetB)(); refresh(); }}
              ><RotateCcw className="w-3 h-3" />{t.reset}</button>
            </footer>
          </article>
        );
      })}
    </section>
  );
}
