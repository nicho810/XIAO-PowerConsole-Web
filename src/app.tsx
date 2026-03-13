/**
 * [INPUT]:  依赖 react, layout 组件, hooks/use-theme
 * [OUTPUT]: 对外提供 App 组件 — 应用外壳
 * [POS]:    src/ 的根组件，组合 Header + Sidebar + MainContent
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Header } from './components/layout/header.js';
import { Sidebar } from './components/layout/sidebar.js';
import { MainContent } from './components/layout/main-content.js';

// ============================================================
//  App Shell — 双面板布局
// ============================================================

export function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4">
        <Sidebar />
        <MainContent />
      </main>
    </div>
  );
}
