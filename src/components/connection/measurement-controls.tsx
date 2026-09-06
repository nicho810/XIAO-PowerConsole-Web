/**
 * [INPUT]: React、显示/录制/健康/设备 store 和十语言监测文案
 * [OUTPUT]: MeasurementControls，暂停、窗口、CSV 录制导出与实时健康状态
 * [POS]: connection/ 的采集工具栏，位于主工作区顶部；健康信息始终保持实时
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useCallback, useEffect, useState } from 'react';
import { Pause, Play, Circle, Square, Download, Trash2 } from 'lucide-react';
import { getViewState, setPaused, setTimeWindow, type TimeWindow } from '@/store/chart-view-store.js';
import { recording } from '@/store/recording-store.js';
import { streamHealth } from '@/store/health-store.js';
import { useDeviceStore } from '@/store/device-store.js';
import { useLocale } from '@/hooks/use-locale.js';
import { MONITOR_STRINGS } from '@/i18n/monitor-strings.js';

function snapshot() { return { view: getViewState(), record: recording.snapshot(), health: streamHealth.snapshot() }; }

function exportCsv(): void {
  const blob = recording.exportBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `powerconsole-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MeasurementControls() {
  const { locale } = useLocale();
  const t = MONITOR_STRINGS[locale];
  const status = useDeviceStore((s) => s.status);
  const [state, setState] = useState(snapshot);
  const [error, setError] = useState(false);
  const refresh = useCallback(() => setState(snapshot()), []);
  useEffect(() => {
    const timer = setInterval(refresh, 250);
    return () => clearInterval(timer);
  }, [refresh]);
  const { view, record, health } = state;
  const canRecord = status === 'streaming' || status === 'test-mode';
  const label = { live: t.live, waiting: t.waiting, stale: t.stale, idle: t.idle }[health.state];

  return (
    <section className="monitor-panel rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        <button className="monitor-button" aria-pressed={view.paused} onClick={() => { setPaused(!view.paused); refresh(); }}>
          {view.paused ? <Play /> : <Pause />}{view.paused ? t.resume : t.pause}
        </button>
        <label className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          {t.window}
          <select className="monitor-button" value={view.windowMs} onChange={(event) => { setTimeWindow(Number(event.target.value) as TimeWindow); refresh(); }}>
            <option value={5000}>5 s</option><option value={10000}>10 s</option><option value={30000}>30 s</option>
          </select>
        </label>
        <div aria-label={t.health} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs lg:ml-auto">
          <span role="status" className={health.state === 'stale' ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--muted-foreground))]'}>{label}</span>
          <span className="data-value">{health.rateHz.toFixed(1)} Hz</span>
          <span className="text-[hsl(var(--muted-foreground))]">{t.last}: {health.ageMs === null ? '—' : `${(health.ageMs / 1000).toFixed(1)} s`}</span>
          <span className={health.crcErrors ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--muted-foreground))]'}>{t.crc}: {health.crcErrors}</span>
        </div>
      </div>
      {view.paused && <p role="status" className="text-xs text-[hsl(var(--warning))] mt-2">{t.pausedHint}</p>}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[hsl(var(--border))]">
        <button
          className="monitor-button" disabled={!record.active && (!canRecord || record.reason === 'limit')}
          onClick={() => { record.active ? recording.stop() : recording.start(useDeviceStore.getState().config); refresh(); }}
        >
          {record.active ? <Square className="text-[hsl(var(--destructive))]" /> : <Circle />}
          {record.active ? t.stop : record.count ? t.append : t.start}
        </button>
        <button className="monitor-button" disabled={!record.count} onClick={() => { try { exportCsv(); setError(false); } catch { setError(true); } }}><Download />{t.export}</button>
        <button className="monitor-button" disabled={record.active || !record.count} onClick={() => { recording.clear(); setError(false); refresh(); }}><Trash2 />{t.clear}</button>
        <span className="text-xs data-value text-[hsl(var(--muted-foreground))] lg:ml-auto">
          {record.active && <span className="text-[hsl(var(--destructive))] mr-2">● {t.recording}</span>}
          {record.count.toLocaleString(locale)} {t.recorded} · {(record.bytes / 1048576).toFixed(2)} MiB
        </span>
      </div>
      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">{t.local}</p>
      {record.reason === 'limit' && <p role="alert" className="text-xs text-[hsl(var(--warning))] mt-2">{t.limit}</p>}
      {error && <p role="alert" className="text-xs text-[hsl(var(--destructive))] mt-2">{t.exportError}</p>}
    </section>
  );
}
