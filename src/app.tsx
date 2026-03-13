/**
 * [INPUT]:  依赖 react, layout/sidebar, layout/main-content
 * [OUTPUT]: 对外提供 App 组件 — 应用外壳
 * [POS]:    src/ 的根组件，可拖拽双栏布局 (Sidebar + MainContent)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef, useCallback, useState } from 'react';
import { Sidebar } from './components/layout/sidebar.js';
import { MainContent } from './components/layout/main-content.js';

// ============================================================
//  App Shell — 可拖拽双栏布局 (左信息区 3:9 右图表区)
// ============================================================

/** 左栏百分比下限 / 上限 */
const MIN_LEFT = 15;
const MAX_LEFT = 50;

/** 3:12 = 25% */
const DEFAULT_LEFT = 25;

export function App() {
  const [leftPct, setLeftPct] = useState(DEFAULT_LEFT);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── 拖拽分隔条 ────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onPointerMove = (ev: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(Math.max(pct, MIN_LEFT), MAX_LEFT));
    };

    const onPointerUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      handle.removeEventListener('pointermove', onPointerMove);
      handle.removeEventListener('pointerup', onPointerUp);
    };

    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
  }, []);

  return (
    <main ref={containerRef} className="h-screen flex overflow-hidden">

      {/* 左 — 信息区 */}
      <div
        className="overflow-y-auto p-4 flex-shrink-0"
        style={{ width: `${leftPct}%` }}
      >
        <Sidebar />
      </div>

      {/* 拖拽条 */}
      <div
        className="w-1 flex-shrink-0 bg-[hsl(var(--border))] hover:bg-[hsl(var(--primary))] cursor-col-resize transition-colors"
        onPointerDown={onPointerDown}
      />

      {/* 右 — 图表区 */}
      <div className="flex-1 overflow-y-auto p-4">
        <MainContent />
      </div>
    </main>
  );
}
