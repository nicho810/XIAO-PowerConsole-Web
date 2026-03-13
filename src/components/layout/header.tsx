/**
 * [INPUT]:  依赖 react, hooks/use-theme
 * [OUTPUT]: 对外提供 Header 组件 — 标题栏 + 主题切换
 * [POS]:    layout/ 的顶部栏，被 App 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTheme } from '@/hooks/use-theme.js';

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
      <h1 className="text-xl font-bold tracking-tight">XIAO PowerConsole</h1>
      <button
        onClick={toggle}
        className="rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--muted))] transition"
      >
        {theme === 'light' ? 'Dark' : 'Light'}
      </button>
    </header>
  );
}
