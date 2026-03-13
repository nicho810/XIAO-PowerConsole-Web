/**
 * [INPUT]:  依赖 react, device-store
 * [OUTPUT]: 对外提供 ConnectionStatus 组件 — 状态指示器
 * [POS]:    connection/ 的状态显示，被 ConnectionPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useDeviceStore, type ConnectionStatus as Status } from '@/store/device-store.js';

// ── 状态配置: CSS 变量色 + 脉冲动画 ────────────────────────────
const STATUS_CONFIG: Record<Status, { color: string; pulse: boolean; label: string }> = {
  disconnected: { color: 'bg-[hsl(var(--status-idle))]',        pulse: false, label: 'Disconnected' },
  connecting:   { color: 'bg-[hsl(var(--status-connecting))]',   pulse: true,  label: 'Connecting...' },
  handshaking:  { color: 'bg-[hsl(var(--status-connecting))]',   pulse: true,  label: 'Handshaking...' },
  streaming:    { color: 'bg-[hsl(var(--status-streaming))]',    pulse: true,  label: 'Streaming' },
  'test-mode':  { color: 'bg-[hsl(var(--status-test))]',        pulse: true,  label: 'Test Mode' },
};

export function ConnectionStatus() {
  const status = useDeviceStore((s) => s.status);
  const error = useDeviceStore((s) => s.error);
  const { color, pulse, label } = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} ${pulse ? 'animate-pulse-dot' : ''} transition-colors`} />
      <span className="text-sm font-medium">{label}</span>
      {error && (
        <span className="text-xs text-[hsl(var(--status-error))] ml-auto truncate max-w-[150px]" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
