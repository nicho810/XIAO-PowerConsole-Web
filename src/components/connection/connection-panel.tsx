/**
 * [INPUT]:  依赖 react, lucide-react, hooks/use-serial, hooks/use-test-mode, device-store
 * [OUTPUT]: 对外提供 ConnectionPanel 组件 — 连接控制按钮组
 * [POS]:    connection/ 的操作面板，被 Sidebar 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Plug, Unplug, FlaskConical, Square, Cable } from 'lucide-react';
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
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-elevated p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cable className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Connection</h2>
      </div>
      <ConnectionStatus />
      <div className="flex gap-2 mt-3">
        {/* Connect — 主要操作: primary 填充 */}
        <button
          onClick={connect}
          disabled={isActive || isBusy}
          aria-label="Connect to device"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Plug className="w-3.5 h-3.5" />
          {isBusy ? 'Connecting...' : 'Connect'}
        </button>

        {/* Disconnect — 次要操作: outline */}
        <button
          onClick={disconnect}
          disabled={status === 'disconnected' || isTestMode}
          aria-label="Disconnect device"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Unplug className="w-3.5 h-3.5" />
          Disconnect
        </button>

        {/* Test — 状态切换: 语义色 */}
        <button
          onClick={toggleTest}
          disabled={status === 'streaming' || isBusy}
          aria-label={isTestMode ? 'Stop test mode' : 'Start test mode'}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
            isTestMode
              ? 'bg-[hsl(var(--btn-danger))] text-[hsl(var(--btn-danger-foreground))] hover:opacity-90'
              : 'bg-[hsl(var(--btn-success))] text-[hsl(var(--btn-success-foreground))] hover:opacity-90'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isTestMode ? <Square className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
          {isTestMode ? 'Stop Test' : 'Test'}
        </button>
      </div>
    </div>
  );
}
