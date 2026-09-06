/**
 * [INPUT]: 会话起止、有效采样到达时间与 CRC 错误事件
 * [OUTPUT]: StreamHealth 与 streamHealth 单例，最近 2 秒接收速率、最后采样和断流判定
 * [POS]: store/ 的采集健康诊断；显示暂停不影响健康计数
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
export class StreamHealth {
  private active = false;
  private startedAt = 0;
  private lastSampleAt: number | null = null;
  private crcErrors = 0;
  private receivedBytes = 0;
  private buckets = new Map<number, number>();

  begin(now = performance.now()): void {
    this.active = true;
    this.startedAt = now;
    this.lastSampleAt = null;
    this.crcErrors = 0;
    this.receivedBytes = 0;
    this.buckets.clear();
  }
  end(): void { this.active = false; }
  crcError(): void { this.crcErrors++; }
  receiveBytes(bytes: number): void { this.receivedBytes += bytes; }

  sample(now = performance.now()): void {
    if (!this.active) return;
    this.lastSampleAt = now;
    const bucket = Math.floor(now / 100);
    this.buckets.set(bucket, (this.buckets.get(bucket) ?? 0) + 1);
    this.prune(bucket);
  }
  private prune(bucket: number): void {
    for (const key of this.buckets.keys()) if (key <= bucket - 20) this.buckets.delete(key);
  }

  snapshot(now = performance.now()) {
    const bucket = Math.floor(now / 100);
    this.prune(bucket);
    const ageMs = this.lastSampleAt === null ? null : Math.max(0, now - this.lastSampleAt);
    const silent = now - (this.lastSampleAt ?? this.startedAt) >= 2000;
    const state = !this.active ? 'idle' : silent ? 'stale' : this.lastSampleAt === null ? 'waiting' : 'live';
    const windowStart = Math.max(this.startedAt, (bucket - 19) * 100);
    const duration = Math.max(100, now - windowStart);
    const samples = [...this.buckets.values()].reduce((sum, count) => sum + count, 0);
    return { state, ageMs, rateHz: this.active && !silent ? samples * 1000 / duration : 0,
      crcErrors: this.crcErrors, receivedBytes: this.receivedBytes };
  }
}
export const streamHealth = new StreamHealth();
