/**
 * [INPUT]:  依赖 react, lucide-react, hooks/use-serial, hooks/use-locale, device-store
 * [OUTPUT]: 对外提供 ConnectionPanel 组件 — 连接控制按钮组
 * [POS]:    connection/ 的操作面板，被 Sidebar 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { Plug, Unplug, Cable } from 'lucide-react';
import { useSerial } from '@/hooks/use-serial.js';
import { useDeviceStore } from '@/store/device-store.js';
import { useLocale } from '@/hooks/use-locale.js';
import { ConnectionStatus } from './connection-status.js';

export function ConnectionPanel() {
  const { connect, disconnect } = useSerial();
  const status = useDeviceStore((s) => s.status);
  const { t } = useLocale();

  const isActive = status === 'streaming';
  const isBusy = status === 'connecting' || status === 'handshaking' || status === 'disconnecting';

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-elevated p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cable className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t.connection}</h2>
      </div>
      <ConnectionStatus />
      <div className="flex gap-2 mt-3 min-w-0">
        {/* Connect — 主要操作: primary 填充 */}
        <button
          onClick={connect}
          disabled={isActive || isBusy}
          aria-label={t.connect}
          className="flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Plug className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{isBusy ? t.connecting : t.connect}</span>
        </button>

        {/* Disconnect — 次要操作: outline */}
        <button
          onClick={disconnect}
          disabled={status === 'disconnected' || status === 'disconnecting'}
          aria-label={t.disconnect}
          className="flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Unplug className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.disconnect}</span>
        </button>
      </div>
    </div>
  );
}
