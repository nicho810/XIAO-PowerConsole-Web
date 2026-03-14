/**
 * [INPUT]:  依赖 react, lucide-react, hooks/use-theme, connection 组件, console 组件
 * [OUTPUT]: 对外提供 Sidebar 组件 — 左面板容器 (含标题栏 + 主题切换)
 * [POS]:    layout/ 的左侧面板，包含标题、主题切换、连接控制、设备信息、能量统计和调试控制台
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme.js';
import { ConnectionPanel } from '@/components/connection/connection-panel.js';
import { DeviceInfo } from '@/components/connection/device-info.js';
import { EnergyStats } from '@/components/connection/energy-stats.js';
import { DebugConsole } from '@/components/console/debug-console.js';

export function Sidebar() {
  const { theme, toggle } = useTheme();

  return (
    <aside className="flex flex-col gap-5">
      {/* ── 标题 + 主题切换 ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">XIAO</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">PowerConsole</p>
        </div>
        <button
          onClick={toggle}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] p-2 hover:bg-[hsl(var(--muted))] transition"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      <hr className="border-[hsl(var(--border))]" />

      <ConnectionPanel />
      <DeviceInfo />
      <EnergyStats />
      <DebugConsole />
    </aside>
  );
}
