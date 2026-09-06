/**
 * [INPUT]: connection 组件和 DebugConsole
 * [OUTPUT]: Sidebar，设备连接、配置和日志面板
 * [POS]: layout/ 的设备侧栏；品牌和偏好由 Header 管理
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { ConnectionPanel } from '@/components/connection/connection-panel.js';
import { DeviceInfo } from '@/components/connection/device-info.js';
import { DebugConsole } from '@/components/console/debug-console.js';

export function Sidebar() {
  return (
    <aside className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      <div className="sidebar-label">XIAO POWERBREAD<span>USB POWER MONITOR</span></div>
      <ConnectionPanel />
      <DeviceInfo />
      <DebugConsole />
    </aside>
  );
}
