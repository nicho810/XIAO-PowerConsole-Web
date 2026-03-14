/**
 * [INPUT]:  依赖 react, lucide-react, hooks/use-log
 * [OUTPUT]: 对外提供 DebugConsole 组件 — 可折叠日志面板
 * [POS]:    console/ 的调试日志显示，被 Sidebar 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useLogStore, type LogLevel } from '@/hooks/use-log.js';

// ── 日志级别颜色 — 统一 CSS 变量 ────────────────────────────────
const LEVEL_CLASS: Record<LogLevel, string> = {
  info:    'text-[hsl(var(--muted-foreground))]',
  success: 'text-[hsl(var(--status-streaming))]',
  warning: 'text-[hsl(var(--status-connecting))]',
  error:   'text-[hsl(var(--status-error))]',
};

export function DebugConsole() {
  const [collapsed, setCollapsed] = useState(false);
  const entries = useLogStore((s) => s.entries);
  const clear = useLogStore((s) => s.clear);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 仅在控制台自身容器内滚动到底部，不影响父级滚动区
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-elevated">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Debug Console</h3>
          {entries.length > 0 && (
            <span className="text-[10px] rounded-full bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[hsl(var(--muted-foreground))]">
              {entries.length}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={clear}
            aria-label="Clear console"
            className="p-1 rounded hover:bg-[hsl(var(--muted))] transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
          </button>
          <button
            onClick={() => setCollapsed((p) => !p)}
            aria-label={collapsed ? 'Expand console' : 'Collapse console'}
            className="p-1 rounded hover:bg-[hsl(var(--muted))] transition"
          >
            {collapsed
              ? <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
              : <ChevronUp className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div ref={scrollRef} className="max-h-60 overflow-y-auto px-3 py-2 data-value text-xs space-y-0.5">
          {entries.length === 0 && (
            <p className="text-[hsl(var(--muted-foreground))]">No messages</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className={LEVEL_CLASS[e.level]}>
              <span className="opacity-60">[{e.time}]</span> {e.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
