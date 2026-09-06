/* ================================================================
 * [INPUT]: DOM 和 Web Streams 类型
 * [OUTPUT]: SerialPort、Serial 与 navigator.serial 全局声明
 * [POS]: types/ 的浏览器串口类型补充
 * TypeScript 尚未内置 Web Serial，手动补充全局类型
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 * ================================================================ */

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}

interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: ParityType;
  bufferSize?: number;
  flowControl?: FlowControlType;
}

type ParityType = "none" | "even" | "odd";
type FlowControlType = "none" | "hardware";

interface SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  getInfo(): SerialPortInfo;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
}

interface Serial extends EventTarget {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}

interface Navigator {
  readonly serial: Serial;
}
