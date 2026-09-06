/**
 * [INPUT]: 依赖 SerialConnection、协议解析/解码/命令与测量类型
 * [OUTPUT]: 对外提供 SerialSession，握手、重握手和采样共用一个读取循环
 * [POS]: serial/ 的会话状态机，由 useSerial 创建并关闭
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { FRAME_TYPE, type DeviceConfigPayload, type ParsedFrame } from '@/types/protocol.js';
import type { DualChannelSample } from '@/types/measurement.js';
import { FrameParser } from '@/protocol/frame-parser.js';
import { decodeDeviceConfig, decodeRealtimeData, deriveMeasurement } from '@/protocol/codec.js';
import { buildStartFrame, buildConfigAckFrame, buildStopFrame } from '@/protocol/frame-builder.js';
import { SerialConnection } from './serial-port.js';

interface SessionEvents {
  onHandshake: () => void;
  onConfig: (config: DeviceConfigPayload) => void;
  onSample: (sample: DualChannelSample) => void;
  onError: (error: unknown) => void;
}

export class SerialSession {
  private readonly parser = new FrameParser();
  private config: DeviceConfigPayload | null = null;
  private closed = false;
  private opening: Promise<void> | null = null;
  private closing: Promise<void> | null = null;
  private resolveReady: () => void = () => {};
  private rejectReady: (error: unknown) => void = () => {};

  constructor(private readonly events: SessionEvents, private readonly serial = new SerialConnection()) {}

  async start(timeoutMs = 3000): Promise<void> {
    this.opening = this.serial.connect();
    await this.opening;
    if (this.closed) throw new Error('Connection cancelled');
    this.events.onHandshake();
    const ready = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    const timer = setTimeout(() => this.rejectReady(new Error('Handshake timeout')), timeoutMs);
    try {
      void this.serial.startReading((chunk) => this.consume(chunk)).catch((error) => this.fail(error));
      void this.serial.write(buildStartFrame()).catch((error) => this.fail(error));
      await ready;
    } finally {
      clearTimeout(timer);
    }
  }

  private async consume(chunk: Uint8Array): Promise<void> {
    // -- 保留跨 chunk 的解析状态；CONFIG 后同一 chunk 的采样也不会丢失 --
    for (const frame of this.parser.feedMany(chunk)) {
      if (this.closed) return;
      await this.handleFrame(frame);
    }
  }

  private async handleFrame(frame: ParsedFrame): Promise<void> {
    if (frame.type === FRAME_TYPE.DEVICE_CONFIG) {
      const config = decodeDeviceConfig(frame.payload);
      await this.serial.write(buildConfigAckFrame());
      if (this.closed) return;
      this.config = config;
      this.events.onConfig(config);
      this.resolveReady();
    } else if (frame.type === FRAME_TYPE.REALTIME_DATA && this.config) {
      this.events.onSample(deriveMeasurement(decodeRealtimeData(frame.payload), this.config));
    }
  }

  private fail(error: unknown): void {
    if (this.closed) return;
    this.rejectReady(error);
    this.events.onError(error);
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.closed = true;
    this.rejectReady(new Error('Connection cancelled'));
    this.closing = this.shutdown();
    return this.closing;
  }

  private async shutdown(): Promise<void> {
    await this.opening?.catch(() => {});
    // -- STOP 最多等待 200ms，拔线或写阻塞不妨碍清理 --
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.serial.write(buildStopFrame()).catch(() => {}),
        new Promise<void>((resolve) => { timer = setTimeout(resolve, 200); }),
      ]);
    } finally {
      clearTimeout(timer);
      await this.serial.disconnect();
    }
  }
}
