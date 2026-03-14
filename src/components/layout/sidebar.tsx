/**
 * [INPUT]:  依赖 react, lucide-react, hooks/use-theme, hooks/use-locale, connection 组件, console 组件
 * [OUTPUT]: 对外提供 Sidebar 组件 — 左面板容器 (含标题栏 + 主题切换 + 语言选择)
 * [POS]:    layout/ 的左侧面板，包含标题、主题切换、语言选择、连接控制、设备信息和调试控制台
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Globe, ChevronDown, Github } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme.js';
import { useLocale } from '@/hooks/use-locale.js';
import type { Locale } from '@/i18n/locales.js';
import { ConnectionPanel } from '@/components/connection/connection-panel.js';
import { DeviceInfo } from '@/components/connection/device-info.js';
import { DebugConsole } from '@/components/console/debug-console.js';

// ============================================================
//  LangSelect — 自定义语言下拉，样式与主题按钮统一
// ============================================================

interface LangSelectProps {
  locale:    Locale;
  labels:    Record<Locale, string>;
  setLocale: (l: Locale) => void;
  ariaLabel: string;
}

function LangSelect({ locale, labels, setLocale, ariaLabel }: LangSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* ── 触发按钮 — 与主题按钮同款 ──────────────────── */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 py-2 hover:bg-[hsl(var(--muted))] transition"
      >
        <Globe className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <span className="text-xs font-medium leading-none">{labels[locale]}</span>
        <ChevronDown className={`w-3 h-3 text-[hsl(var(--muted-foreground))] transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* ── 下拉列表 ─────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[144px] rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))] shadow-md overflow-hidden">
          {(Object.keys(labels) as Locale[]).map((key) => (
            <button
              key={key}
              onClick={() => { setLocale(key); setOpen(false); }}
              className={[
                'w-full text-left px-3 py-2 text-xs transition-colors',
                'hover:bg-[hsl(var(--muted))]',
                key === locale
                  ? 'font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--muted))]'
                  : 'text-[hsl(var(--foreground))]',
              ].join(' ')}
            >
              {labels[key]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  Sidebar
// ============================================================

export function Sidebar() {
  const { theme, toggle } = useTheme();
  const { locale, t, labels, setLocale } = useLocale();

  return (
    <aside className="flex flex-col h-full overflow-hidden">
      {/* ── 标题 + 工具栏（固定不滚动）────────────────────────── */}
      <div className="flex-shrink-0 px-5 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/XPB-logo.png"
              alt="XPB Logo"
              className={`w-10 h-10 object-contain ${theme === 'dark' ? 'invert' : ''}`}
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">XIAO</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">XPB Web Console</p>
            </div>
          </div>

          {/* ── 工具栏: GitHub + 主题 + 语言 ────────────────── */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/nicho810/XIAO-PowerBread"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] p-2 hover:bg-[hsl(var(--muted))] transition"
            >
              <Github className="w-4 h-4" />
            </a>
            <button
              onClick={toggle}
              aria-label={theme === 'light' ? t.switchToDark : t.switchToLight}
              className="rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] p-2 hover:bg-[hsl(var(--muted))] transition"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <LangSelect
              locale={locale}
              labels={labels}
              setLocale={setLocale}
              ariaLabel={t.language}
            />
          </div>
        </div>
        <hr className="border-[hsl(var(--border))] mt-5" />
      </div>

      {/* ── 可滚动内容区 ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-5 flex flex-col gap-5">
        <ConnectionPanel />
        <DeviceInfo />
        <DebugConsole />
      </div>
    </aside>
  );
}
