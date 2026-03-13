/**
 * [INPUT]:  无外部依赖 — 纯 TypeScript
 * [OUTPUT]: 对外提供 RingBuffer 泛型环形缓冲区类
 * [POS]:    lib/ 的核心数据结构，被图表渲染层消费以获取有序时间序列
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
//  RingBuffer — 定容环形缓冲区 (Float64Array)
// ============================================================
//  默认 3000 = 30s @ 100Hz，O(1) push，O(n) 快照
//  toArray(): 分配新数组返回   copyTo(): 写入外部缓冲区零分配
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

  /** 返回按时间排序的快照数组（每次分配新 Float64Array） */
  toArray(): Float64Array {
    const out = new Float64Array(this._length);
    this.copyTo(out);
    return out;
  }

  /** 将有序数据写入目标缓冲区，返回有效元素数。零分配。 */
  copyTo(target: Float64Array): number {
    if (this._length < this.capacity) {
      target.set(this._buf.subarray(0, this._length));
    } else {
      const tail = this.capacity - this._head;
      target.set(this._buf.subarray(this._head, this._head + tail), 0);
      target.set(this._buf.subarray(0, this._head), tail);
    }
    return this._length;
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
