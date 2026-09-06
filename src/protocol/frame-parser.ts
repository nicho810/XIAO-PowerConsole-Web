/**
 * [INPUT]:  依赖 @/types/protocol 的帧常量与状态枚举，依赖 @/protocol/crc8 的 crc8Maxim
 * [OUTPUT]: 对外提供 FrameParser 字节级状态机解析器
 * [POS]:    protocol/ 的核心解析引擎，被串口数据流驱动层消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import {
  SYNC_0, SYNC_1,
  ParserState,
} from '@/types/protocol.js';
import type { ParsedFrame, FrameType } from '@/types/protocol.js';
import { crc8Maxim } from './crc8.js';

// ============================================================
//  FrameParser — 字节级状态机
// ============================================================
//  帧结构: [0xAA][0x55][TYPE][LEN][PAYLOAD...][CRC8]
//  CRC 范围: [TYPE, LEN, PAYLOAD...]
//  错误时自动回退到 WAIT_SYNC_0 重新同步
// ============================================================

/** 载荷最大长度限制，防止异常帧吃光内存 */
const MAX_PAYLOAD_LEN = 64;

export class FrameParser {
  private _state: ParserState = ParserState.WAIT_SYNC_0;
  private _type  = 0;
  private _len   = 0;
  private _buf   = new Uint8Array(MAX_PAYLOAD_LEN);
  private _pos   = 0;

  // ----------------------------------------------------------
  //  逐字节驱动
  // ----------------------------------------------------------

  /** 喂入一个字节，帧完整时返回 ParsedFrame，否则 null */
  feed(byte: number): ParsedFrame | null {
    switch (this._state) {
      case ParserState.WAIT_SYNC_0:
        if (byte === SYNC_0) this._state = ParserState.WAIT_SYNC_1;
        return null;

      case ParserState.WAIT_SYNC_1:
        this._state = byte === SYNC_1
          ? ParserState.READ_TYPE
          : ParserState.WAIT_SYNC_0;
        return null;

      case ParserState.READ_TYPE:
        this._type = byte;
        this._state = ParserState.READ_LEN;
        return null;

      case ParserState.READ_LEN:
        this._len = byte;
        this._pos = 0;
        if (this._len > MAX_PAYLOAD_LEN) {
          this._reset();
          return null;
        }
        this._state = ParserState.READ_BODY;
        return null;

      case ParserState.READ_BODY:
        return this._collectBody(byte);
    }
  }

  // ----------------------------------------------------------
  //  批量喂入
  // ----------------------------------------------------------

  /** 一次性处理整个 chunk，返回本轮解析出的所有完整帧 */
  feedMany(data: Uint8Array): ParsedFrame[] {
    const frames: ParsedFrame[] = [];
    for (let i = 0; i < data.length; i++) {
      const frame = this.feed(data[i]);
      if (frame) frames.push(frame);
    }
    return frames;
  }

  // ----------------------------------------------------------
  //  内部实现
  // ----------------------------------------------------------

  /** 收集载荷字节 + 校验 CRC */
  private _collectBody(byte: number): ParsedFrame | null {
    if (this._pos < this._len) {
      this._buf[this._pos++] = byte;
      return null;
    }

    // 载荷读完，当前 byte 是 CRC — 先保存再 reset
    const frameType = this._type as FrameType;
    const payloadLen = this._len;
    const payload = this._buf.slice(0, payloadLen);

    // CRC 校验区域: [TYPE, LEN, PAYLOAD...]
    const crcBuf = new Uint8Array(2 + payloadLen);
    crcBuf[0] = frameType;
    crcBuf[1] = payloadLen;
    crcBuf.set(payload, 2);

    const computedCrc = crc8Maxim(crcBuf);

    this._reset();

    if (byte !== computedCrc) return null;

    return { type: frameType, payload };
  }

  /** 状态机归零 */
  private _reset(): void {
    this._state = ParserState.WAIT_SYNC_0;
    this._type = 0;
    this._len = 0;
    this._pos = 0;
  }
}
