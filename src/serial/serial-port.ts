/**
 * [INPUT]: 依赖 Web Serial API 的串口与 Web Streams
 * [OUTPUT]: 对外提供 SerialConnection，单读取任务与可等待的资源关闭
 * [POS]: serial/ 的传输层，被握手会话独占持有
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
export class SerialConnection {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private reading: Promise<void> | null = null;
  private closing = false;

  async connect(baudRate = 115200): Promise<void> {
    if (!('serial' in navigator)) throw new Error('Please use Chrome or Edge with Web Serial support.');
    this.port = await navigator.serial.requestPort();
    await this.port.open({ baudRate });
  }

  async write(data: Uint8Array): Promise<void> {
    if (this.closing || !this.port?.writable) throw new Error('Port not writable');
    this.writer ??= this.port.writable.getWriter();
    await this.writer.write(data);
  }

  startReading(onData: (chunk: Uint8Array) => Promise<void>): Promise<void> {
    if (this.reading) throw new Error('Serial reader already active');
    if (!this.port?.readable) throw new Error('Port not readable');
    this.reader = this.port.readable.getReader();
    this.reading = this.readLoop(this.reader, onData);
    return this.reading;
  }

  private async readLoop(reader: ReadableStreamDefaultReader<Uint8Array>, onData: (chunk: Uint8Array) => Promise<void>): Promise<void> {
    try {
      while (!this.closing) {
        const { value, done } = await reader.read();
        if (this.closing) return;
        if (done) throw new Error('Serial device disconnected');
        if (value) await onData(value);
      }
    } finally {
      reader.releaseLock();
      this.reader = null;
    }
  }

  async disconnect(): Promise<void> {
    this.closing = true;
    // -- 先中断阻塞读写，再等待读取任务释放唯一的 reader 锁 --
    await Promise.allSettled([this.reader?.cancel(), this.writer?.abort()]);
    await this.reading?.catch(() => {});
    this.writer?.releaseLock();
    this.writer = null;
    const port = this.port;
    this.port = null;
    if (port) await port.close();
  }
}
