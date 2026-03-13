/**
 * [INPUT]:  依赖 Web Serial API (navigator.serial)
 * [OUTPUT]: 对外提供 SerialConnection 类 — 串口连接/断开/读写
 * [POS]:    serial/ 的底层传输封装，被 use-serial hook 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
//  Web Serial API 封装 — 二进制读写
// ============================================================

export class SerialConnection {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  /** 请求串口并打开连接 */
  async connect(baudRate = 115200): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported. Please use Chrome or Edge.');
    }

    this.port = await navigator.serial.requestPort();
    await this.port.open({ baudRate });
  }

  /** 发送二进制数据 */
  async write(data: Uint8Array): Promise<void> {
    if (!this.port?.writable) throw new Error('Port not writable');

    if (!this.writer) {
      this.writer = this.port.writable.getWriter();
    }
    await this.writer.write(data);
  }

  /**
   * 启动读取循环，每次收到 chunk 回调 onData
   * 返回一个 abort 函数用于外部终止
   */
  startReading(onData: (chunk: Uint8Array) => void): () => void {
    if (!this.port?.readable) throw new Error('Port not readable');

    let running = true;
    const readable = this.port.readable;

    const run = async () => {
      while (running && readable) {
        try {
          this.reader = readable.getReader();
          while (running) {
            const { value, done } = await this.reader.read();
            if (done || !value) break;
            onData(value);
          }
        } catch (err) {
          if (running) console.error('[Serial] read error:', err);
        } finally {
          this.reader?.releaseLock();
          this.reader = null;
        }
      }
    };

    run();

    return () => { running = false; };
  }

  /** 断开连接，释放所有资源 */
  async disconnect(): Promise<void> {
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
    } catch { /* ignore */ }

    try {
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
    } catch { /* ignore */ }

    try {
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch { /* ignore */ }
  }

  get isOpen(): boolean {
    return this.port !== null;
  }
}
