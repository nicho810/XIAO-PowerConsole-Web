/**
 * [INPUT]:  依赖 react, device-store
 * [OUTPUT]: 对外提供 ConnectionStatus 组件 — 状态指示器
 * [POS]:    connection/ 的状态显示，被 ConnectionPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useDeviceStore, type ConnectionStatus as Status } from '@/store/device-store.js';

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  disconnected: { color: 'bg-gray-400',  label: 'Disconnected' },
  connecting:   { color: 'bg-yellow-400', label: 'Connecting...' },
  handshaking:  { color: 'bg-yellow-400', label: 'Handshaking...' },
  streaming:    { color: 'bg-green-500',  label: 'Streaming' },
  'test-mode':  { color: 'bg-blue-500',   label: 'Test Mode' },
};

export function ConnectionStatus() {
  const status = useDeviceStore((s) => s.status);
  const error = useDeviceStore((s) => s.error);
  const { color, label } = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} transition-colors`} />
      <span className="text-sm font-medium">{label}</span>
      {error && (
        <span className="text-xs text-red-500 ml-auto truncate max-w-[150px]" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
