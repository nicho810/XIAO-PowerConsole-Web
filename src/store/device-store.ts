/**
 * [INPUT]:  依赖 zustand，依赖 @/types/protocol 的 DeviceConfigPayload
 * [OUTPUT]: 对外提供 useDeviceStore — 设备连接状态与配置
 * [POS]:    store/ 的设备状态管理，被连接组件和协议 hook 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand';
import type { DeviceConfigPayload } from '@/types/protocol.js';

// ============================================================
//  连接状态枚举
// ============================================================

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'handshaking'
  | 'streaming'
  | 'test-mode';

// ============================================================
//  Store 定义
// ============================================================

interface DeviceState {
  status: ConnectionStatus;
  config: DeviceConfigPayload | null;
  error: string | null;
}

interface DeviceActions {
  setStatus: (status: ConnectionStatus) => void;
  setConfig: (config: DeviceConfigPayload) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: DeviceState = {
  status: 'disconnected',
  config: null,
  error: null,
};

export const useDeviceStore = create<DeviceState & DeviceActions>()((set) => ({
  ...initialState,

  setStatus: (status) => set({ status, error: null }),
  setConfig: (config) => set({ config }),
  setError:  (error)  => set({ error, status: 'disconnected' }),
  reset:     ()       => set(initialState),
}));
