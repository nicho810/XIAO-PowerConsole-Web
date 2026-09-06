/**
 * [INPUT]:  依赖 react, layout/header, layout/sidebar, layout/main-content
 * [OUTPUT]: 对外提供 App 组件 — 应用外壳
 * [POS]:    src/ 的根组件，顶部 Header、桌面可拖拽双栏与窄屏单栏布局
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { useRef, useCallback, useState } from 'react';
import { Header } from './components/layout/header.js';
import { Sidebar } from './components/layout/sidebar.js';
import { MainContent } from './components/layout/main-content.js';

// ============================================================
//  App Shell — 可拖拽双栏布局 (顶栏 + 设备侧栏 + 测量工作区)
// ============================================================

/** 左栏像素下限 / 上限（上限为容器宽度的 50%） */
const MIN_LEFT_PX = 260;
const MAX_LEFT_PCT = 50;

export function App() {
  const [leftPx, setLeftPx] = useState(280);
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
      handle.removeEventListener('pointercancel', onPointerUp);
      handle.removeEventListener('lostpointercapture', onPointerUp);
    };

    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);
    handle.addEventListener('lostpointercapture', onPointerUp);
  }, []);

  return (
    <div className="app-shell">
      <Header />
      <div ref={containerRef} className="app-body">

      {/* 左 — 信息区 */}
      <div
        className="app-sidebar flex flex-col flex-shrink-0 overflow-hidden"
        style={{ '--sidebar-width': `${leftPx}px` } as React.CSSProperties}
      >
        <Sidebar />
      </div>

      {/* 拖拽条 — 加宽 + 三圆点手柄 + 透明热区 */}
      <div
        className="hidden lg:block relative w-px flex-shrink-0 bg-[hsl(var(--border))] hover:bg-[hsl(var(--primary))] cursor-col-resize group before:content-[''] before:absolute before:inset-y-0 before:-left-2 before:-right-2"
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        aria-valuemin={MIN_LEFT_PX}
        aria-valuemax={Math.max(MIN_LEFT_PX, (containerRef.current?.clientWidth ?? 1280) / 2)}
        aria-valuenow={leftPx}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const max = (containerRef.current?.clientWidth ?? 1280) / 2;
          setLeftPx((value) => Math.min(max, Math.max(MIN_LEFT_PX, value + (event.key === 'ArrowRight' ? 16 : -16))));
        }}
        onPointerDown={onPointerDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100">
          <span className="block w-1 h-1 rounded-full bg-[hsl(var(--muted-foreground))]" />
          <span className="block w-1 h-1 rounded-full bg-[hsl(var(--muted-foreground))]" />
          <span className="block w-1 h-1 rounded-full bg-[hsl(var(--muted-foreground))]" />
        </div>
      </div>

      {/* 右 — 图表区 */}
      <main className="app-workspace min-w-0 flex-1 p-4 lg:p-5">
        <MainContent />
      </main>
      </div>
    </div>
  );
}
