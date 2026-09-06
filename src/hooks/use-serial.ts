/**
 * [INPUT]: 依赖 React、SerialSession、设备与测量 store、日志 hook
 * [OUTPUT]: 对外提供 useSerial，连接/取消/断开及卸载清理
 * [POS]: hooks/ 的会话所有者，仅被 ConnectionPanel 挂载
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useCallback, useEffect, useRef } from 'react';
import { SerialSession } from '@/serial/handshake.js';
import { useDeviceStore } from '@/store/device-store.js';
import { pushSample, clearMeasurements } from '@/store/measurement-store.js';
import { useLog } from './use-log.js';

export function useSerial() {
  const sessionRef = useRef<SerialSession | null>(null);
  const log = useLog();

  const finish = useCallback(async (session: SerialSession, error?: unknown) => {
    if (sessionRef.current !== session) return;
    useDeviceStore.getState().setStatus('disconnecting');
    let failure = error;
    try { await session.close(); } catch (err) { failure ??= err; }
    if (sessionRef.current !== session) return;
    sessionRef.current = null;
    clearMeasurements();
    useDeviceStore.getState().reset();
    if (failure) {
      const message = failure instanceof Error ? failure.message : String(failure);
      useDeviceStore.getState().setError(message);
      log(message, 'error');
    } else log('Disconnected', 'info');
  }, [log]);

  const connect = useCallback(async () => {
    if (sessionRef.current) return;
    const store = useDeviceStore.getState();
    const session = new SerialSession({
      onHandshake: () => store.setStatus('handshaking'),
      onConfig: (config) => { store.setConfig(config); store.setStatus('streaming'); },
      onSample: pushSample,
      onError: (error) => { void finish(session, error); },
    });
    sessionRef.current = session;
    clearMeasurements();
    store.setStatus('connecting');
    log('Requesting serial port...', 'info');
    try {
      await session.start();
      if (sessionRef.current === session) log('Streaming started', 'success');
    } catch (error) {
      if (useDeviceStore.getState().status !== 'disconnecting') await finish(session, error);
    }
  }, [finish, log]);

  const disconnect = useCallback(async () => {
    const session = sessionRef.current;
    if (session) await finish(session);
  }, [finish]);

  useEffect(() => () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) void session.close().catch(() => {});
    useDeviceStore.getState().reset();
    clearMeasurements();
  }, []);

  return { connect, disconnect };
}
