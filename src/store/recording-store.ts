/**
 * [INPUT]: 原始双通道测量、设备配置和接收时间
 * [OUTPUT]: CsvRecorder 与 recording 单例，分块录制、停止、清空和 CSV 快照
 * [POS]: store/ 的独立录制层；不受图表窗口、暂停或环形缓冲区覆盖影响
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import type { DualChannelSample } from '@/types/measurement.js';
import type { DeviceConfigPayload } from '@/types/protocol.js';

export type StopReason = 'manual' | 'disconnected' | 'limit' | null;
const HEADER = 'sample,segment,received_at_utc,device_timestamp_ms,voltage_a_v,shunt_voltage_a_v,current_a_a,power_a_w,voltage_b_v,shunt_voltage_b_v,current_b_a,power_b_w,shunt_r_a_ohm,shunt_r_b_ohm,protocol_version\r\n';

export class CsvRecorder {
  private chunks: string[] = [];
  private pending: string[] = [];
  private config: DeviceConfigPayload | null = null;
  private active = false;
  private count = 0;
  private bytes = HEADER.length;
  private segment = 0;
  private lastTimestamp = -1;
  private reason: StopReason = null;
  private startedAt: number | null = null;

  constructor(readonly maxBytes = 64 * 1024 * 1024) {}

  start(config: DeviceConfigPayload | null, now = Date.now()): void {
    if (this.active || this.reason === 'limit') return;
    this.config = config;
    this.active = true;
    this.reason = null;
    this.segment++;
    this.lastTimestamp = -1;
    this.startedAt ??= now;
  }

  setConfig(config: DeviceConfigPayload): void { this.config = config; }

  append(sample: DualChannelSample, receivedAt = Date.now()): void {
    if (!this.active) return;
    const { channelA: a, channelB: b } = sample;
    if (a.timestamp < this.lastTimestamp) this.segment++;
    const row = [this.count + 1, this.segment, new Date(receivedAt).toISOString(), a.timestamp,
      a.busVoltage, a.shuntVoltage, a.current, a.power, b.busVoltage, b.shuntVoltage, b.current, b.power,
      this.config?.shuntR_a ?? '', this.config?.shuntR_b ?? '', this.config?.version ?? '',
    ].join(',') + '\r\n';
    if (this.bytes + row.length > this.maxBytes) { this.stop('limit'); return; }
    this.pending.push(row);
    this.count++;
    this.bytes += row.length;
    this.lastTimestamp = a.timestamp;
    if (this.pending.length >= 256) this.flush();
  }

  private flush(): void {
    if (!this.pending.length) return;
    this.chunks.push(this.pending.join(''));
    this.pending = [];
  }

  stop(reason: StopReason = 'manual'): void {
    if (!this.active) return;
    this.active = false;
    this.reason = reason;
    this.flush();
  }

  clear(): void {
    if (this.active) return;
    this.chunks = [];
    this.pending = [];
    this.count = 0;
    this.bytes = HEADER.length;
    this.segment = 0;
    this.lastTimestamp = -1;
    this.reason = null;
    this.startedAt = null;
  }

  snapshot() {
    return { active: this.active, count: this.count, bytes: this.bytes, reason: this.reason, startedAt: this.startedAt };
  }

  /** 导出当前完整行的快照；之后继续录制不会修改已生成的 Blob。 */
  exportBlob(): Blob {
    this.flush();
    return new Blob([HEADER, ...this.chunks], { type: 'text/csv;charset=utf-8' });
  }
}
export const recording = new CsvRecorder();
