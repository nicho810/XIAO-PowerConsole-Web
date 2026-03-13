/**
 * [INPUT]:  依赖 react, hooks/use-theme, connection 组件, console 组件
 * [OUTPUT]: 对外提供 Sidebar 组件 — 左面板容器 (含标题栏 + 主题切换)
 * [POS]:    layout/ 的左侧面板，包含标题、主题切换、连接控制和调试控制台
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTheme } from '@/hooks/use-theme.js';
import { ConnectionPanel } from '@/components/connection/connection-panel.js';
import { DeviceInfo } from '@/components/connection/device-info.js';
import { DebugConsole } from '@/components/console/debug-console.js';

export function Sidebar() {
  const { theme, toggle } = useTheme();

  return (
    <aside className="flex flex-col gap-4">
      {/* ── 标题 + 主题切换 ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">XIAO PowerConsole</h1>
        <button
          onClick={toggle}
          className="rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--muted))] transition"
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>

      <ConnectionPanel />
      <DeviceInfo />
      <DebugConsole />
    </aside>
  );
}
