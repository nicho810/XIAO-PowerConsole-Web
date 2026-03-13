/**
 * [INPUT]:  依赖 react, connection 组件, console 组件
 * [OUTPUT]: 对外提供 Sidebar 组件 — 左面板容器
 * [POS]:    layout/ 的左侧面板，包含连接控制和调试控制台
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ConnectionPanel } from '@/components/connection/connection-panel.js';
import { DeviceInfo } from '@/components/connection/device-info.js';
import { DebugConsole } from '@/components/console/debug-console.js';

export function Sidebar() {
  return (
    <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col gap-4">
      <ConnectionPanel />
      <DeviceInfo />
      <DebugConsole />
    </aside>
  );
}
