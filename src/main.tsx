/**
 * [INPUT]:  依赖 react-dom, App 组件, index.css
 * [OUTPUT]: Vite 入口 — 挂载 React 应用到 #root
 * [POS]:    项目入口文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.js';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
