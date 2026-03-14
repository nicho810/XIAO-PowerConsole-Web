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
//  App Shell — 可拖拽双栏布局 (左信息区 4:8 右图表区)
// ============================================================

/** 左栏像素下限 / 上限（上限为容器宽度的 50%） */
const MIN_LEFT_PX = 430;
const MAX_LEFT_PCT = 50;

export function App() {
  const [leftPx, setLeftPx] = useState(MIN_LEFT_PX);
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
      const px = ev.clientX - rect.left;
      const maxPx = rect.width * MAX_LEFT_PCT / 100;
      setLeftPx(Math.min(Math.max(px, MIN_LEFT_PX), maxPx));
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
        className="overflow-y-auto p-5 flex-shrink-0"
        style={{ width: leftPx }}
      >
        <Sidebar />
      </div>

      {/* 拖拽条 — 加宽 + 三圆点手柄 + 透明热区 */}
      <div
        className="relative w-px flex-shrink-0 bg-[hsl(var(--border))] hover:bg-[hsl(var(--primary))] cursor-col-resize transition-colors group before:content-[''] before:absolute before:inset-y-0 before:-left-2 before:-right-2"
        onPointerDown={onPointerDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="block w-1 h-1 rounded-full bg-[hsl(var(--muted-foreground))]" />
          <span className="block w-1 h-1 rounded-full bg-[hsl(var(--muted-foreground))]" />
          <span className="block w-1 h-1 rounded-full bg-[hsl(var(--muted-foreground))]" />
        </div>
      </div>

      {/* 右 — 图表区 */}
      <div className="flex-1 overflow-hidden p-5 flex flex-col">
        <MainContent />
      </div>
    </main>
  );
}
