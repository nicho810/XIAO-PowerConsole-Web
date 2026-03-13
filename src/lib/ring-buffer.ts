/**
 * [INPUT]:  无外部依赖 — 纯 TypeScript
 * [OUTPUT]: 对外提供 RingBuffer 泛型环形缓冲区类
 * [POS]:    lib/ 的核心数据结构，被图表渲染层消费以获取有序时间序列
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
//  RingBuffer — 定容环形缓冲区 (Float64Array)
// ============================================================
//  默认 3000 = 30s @ 100Hz，O(1) push，O(n) toArray 快照
//  内部用 Float64Array 避免 GC 压力，适合高频实时数据流
// ============================================================

export class RingBuffer {
  private readonly _buf: Float64Array;
  private _head = 0;      // 下一次写入位置
  private _length = 0;    // 当前有效元素数

  constructor(readonly capacity = 3000) {
    this._buf = new Float64Array(capacity);
  }

  // ----------------------------------------------------------
  //  写入
  // ----------------------------------------------------------

  /** 追加一个值，满时覆盖最旧数据 */
  push(value: number): void {
    this._buf[this._head] = value;
    this._head = (this._head + 1) % this.capacity;
    if (this._length < this.capacity) this._length++;
  }

  // ----------------------------------------------------------
  //  读取
  // ----------------------------------------------------------

  /** 返回按时间排序的快照数组，供图表一次性渲染 */
  toArray(): Float64Array {
    const out = new Float64Array(this._length);

    if (this._length < this.capacity) {
      // 未满：数据从 0 开始连续排列
      out.set(this._buf.subarray(0, this._length));
    } else {
      // 已满：_head 指向最旧数据
      const tail = this.capacity - this._head;
      out.set(this._buf.subarray(this._head, this._head + tail), 0);
      out.set(this._buf.subarray(0, this._head), tail);
    }

    return out;
  }

  // ----------------------------------------------------------
  //  状态
  // ----------------------------------------------------------

  get length(): number {
    return this._length;
  }

  /** 清空缓冲区，保留容量 */
  clear(): void {
    this._head = 0;
    this._length = 0;
  }
}
