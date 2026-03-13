/**
 * [INPUT]:  依赖 react, hooks/use-serial, hooks/use-test-mode, device-store
 * [OUTPUT]: 对外提供 ConnectionPanel 组件 — 连接控制按钮组
 * [POS]:    connection/ 的操作面板，被 Sidebar 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useSerial } from '@/hooks/use-serial.js';
import { useTestMode } from '@/hooks/use-test-mode.js';
import { useDeviceStore } from '@/store/device-store.js';
import { ConnectionStatus } from './connection-status.js';

export function ConnectionPanel() {
  const { connect, disconnect } = useSerial();
  const { toggle: toggleTest, isTestMode } = useTestMode();
  const status = useDeviceStore((s) => s.status);

  const isActive = status === 'streaming' || status === 'test-mode';
  const isBusy = status === 'connecting' || status === 'handshaking';

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <h2 className="text-base font-semibold mb-3">Connection</h2>
      <ConnectionStatus />
      <div className="flex gap-2 mt-3">
        <button
          onClick={connect}
          disabled={isActive || isBusy}
          className="flex-1 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isBusy ? 'Connecting...' : 'Connect'}
        </button>
        <button
          onClick={disconnect}
          disabled={status === 'disconnected' || isTestMode}
          className="flex-1 rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] px-3 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Disconnect
        </button>
        <button
          onClick={toggleTest}
          disabled={status === 'streaming' || isBusy}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            isTestMode
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isTestMode ? 'Stop Test' : 'Test'}
        </button>
      </div>
    </div>
  );
}
