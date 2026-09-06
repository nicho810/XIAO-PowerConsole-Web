/**
 * [INPUT]:  依赖 react, device-store, hooks/use-locale
 * [OUTPUT]: 对外提供 ConnectionStatus 组件 — 状态指示器
 * [POS]:    connection/ 的状态显示，被 ConnectionPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { useDeviceStore, type ConnectionStatus as Status } from '@/store/device-store.js';
import { useLocale } from '@/hooks/use-locale.js';
import type { LocaleStrings } from '@/i18n/locales.js';

// ── 状态配置: 静态 CSS 变量色 + 文字状态 ────────────────────────────
type StatusConfig = { color: string; label: string };

function buildConfig(t: LocaleStrings): Record<Status, StatusConfig> {
  return {
    disconnecting: { color: 'bg-[hsl(var(--status-connecting))]', label: `${t.disconnect}…` },
    disconnected: { color: 'bg-[hsl(var(--status-idle))]',       label: t.disconnected },
    connecting:   { color: 'bg-[hsl(var(--status-connecting))]',   label: t.connecting  },
    handshaking:  { color: 'bg-[hsl(var(--status-connecting))]',   label: t.handshaking },
    streaming:    { color: 'bg-[hsl(var(--status-streaming))]',    label: t.streaming   },
    'test-mode':  { color: 'bg-[hsl(var(--status-test))]',        label: t.testMode    },
  };
}

export function ConnectionStatus() {
  const status = useDeviceStore((s) => s.status);
  const error  = useDeviceStore((s) => s.error);
  const { t }  = useLocale();
  const { color, label } = buildConfig(t)[status];

  return (
    <div role="status" className="flex flex-wrap items-center gap-2">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-sm font-medium">{label}</span>
      {error && (
        <span className="text-xs text-[hsl(var(--status-error))] basis-full break-words" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
