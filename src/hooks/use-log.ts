/**
 * [INPUT]:  依赖 zustand
 * [OUTPUT]: 对外提供 useLog hook 和 useLogStore — 调试日志系统
 * [POS]:    hooks/ 的日志基础设施，被全部需要日志的模块消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { useCallback } from 'react';
import { create } from 'zustand';

// ============================================================
//  日志条目与 Store
// ============================================================

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: number;
  time: string;
  message: string;
  level: LogLevel;
}

const MAX_ENTRIES = 100;
let nextId = 0;

interface LogState {
  entries: LogEntry[];
  push: (message: string, level: LogLevel) => void;
  clear: () => void;
}

export const useLogStore = create<LogState>()((set) => ({
  entries: [],

  push: (message, level) => {
    const entry: LogEntry = {
      id: nextId++,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      level,
    };
    set((s) => ({
      entries: [...s.entries.slice(-(MAX_ENTRIES - 1)), entry],
    }));
  },

  clear: () => set({ entries: [] }),
}));

// ============================================================
//  便捷 Hook — 返回稳定的 log 函数
// ============================================================

export function useLog() {
  const push = useLogStore((s) => s.push);
  return useCallback(
    (message: string, level: LogLevel = 'info') => push(message, level),
    [push],
  );
}
