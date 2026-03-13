/**
 * [INPUT]:  依赖 react, hooks/use-log
 * [OUTPUT]: 对外提供 DebugConsole 组件 — 可折叠日志面板
 * [POS]:    console/ 的调试日志显示，被 Sidebar 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useRef, useEffect } from 'react';
import { useLogStore, type LogLevel } from '@/hooks/use-log.js';

// ============================================================
//  日志级别颜色
// ============================================================

const LEVEL_CLASS: Record<LogLevel, string> = {
  info:    'text-[hsl(var(--muted-foreground))]',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error:   'text-red-500',
};

export function DebugConsole() {
  const [collapsed, setCollapsed] = useState(false);
  const entries = useLogStore((s) => s.entries);
  const clear = useLogStore((s) => s.clear);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--border))]">
        <h3 className="text-sm font-semibold">Debug Console</h3>
        <div className="flex gap-1">
          <button
            onClick={clear}
            className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--muted))] hover:opacity-80 transition"
          >
            Clear
          </button>
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--muted))] hover:opacity-80 transition"
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="max-h-48 overflow-y-auto px-3 py-2 font-mono text-xs space-y-0.5">
          {entries.length === 0 && (
            <p className="text-[hsl(var(--muted-foreground))]">No messages</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className={LEVEL_CLASS[e.level]}>
              <span className="opacity-60">[{e.time}]</span> {e.message}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
