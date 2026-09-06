/**
 * [INPUT]:  依赖 react, device-store, hooks/use-locale
 * [OUTPUT]: 对外提供 ConnectionStatus 组件 — 状态指示器
 * [POS]:    connection/ 的状态显示，被 ConnectionPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { useDeviceStore, type ConnectionStatus as Status } from '@/store/device-store.js';
import { useLocale } from '@/hooks/use-locale.js';
import type { LocaleStrings } from '@/i18n/locales.js';

// ── 状态配置: CSS 变量色 + 脉冲动画 ────────────────────────────
type StatusConfig = { color: string; pulse: boolean; label: string };

function buildConfig(t: LocaleStrings): Record<Status, StatusConfig> {
  return {
    disconnecting: { color: 'bg-[hsl(var(--status-connecting))]', pulse: true, label: `${t.disconnect}…` },
    disconnected: { color: 'bg-[hsl(var(--status-idle))]',       pulse: false, label: t.disconnected },
    connecting:   { color: 'bg-[hsl(var(--status-connecting))]',  pulse: true,  label: t.connecting  },
    handshaking:  { color: 'bg-[hsl(var(--status-connecting))]',  pulse: true,  label: t.handshaking },
    streaming:    { color: 'bg-[hsl(var(--status-streaming))]',   pulse: true,  label: t.streaming   },
    'test-mode':  { color: 'bg-[hsl(var(--status-test))]',       pulse: true,  label: t.testMode    },
  };
}

export function ConnectionStatus() {
  const status = useDeviceStore((s) => s.status);
  const error  = useDeviceStore((s) => s.error);
  const { t }  = useLocale();
  const { color, pulse, label } = buildConfig(t)[status];

  return (
    <div role="status" className="flex flex-wrap items-center gap-2">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} ${pulse ? 'animate-pulse-dot' : ''} transition-colors`} />
      <span className="text-sm font-medium">{label}</span>
      {error && (
        <span className="text-xs text-[hsl(var(--status-error))] basis-full break-words" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
