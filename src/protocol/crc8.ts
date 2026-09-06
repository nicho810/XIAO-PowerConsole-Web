/**
 * [INPUT]:  无外部依赖 — 纯 TypeScript
 * [OUTPUT]: 对外提供 crc8Maxim 校验函数
 * [POS]:    protocol/ 的校验基础，被 frame-parser.ts 和 frame-builder.ts 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ============================================================
//  CRC-8/MAXIM (Dallas/iButton)
//  多项式 0x31  初始值 0x00  无反转
//  预计算 256 条目查找表，O(n) 校验
// ============================================================

/** 预计算查找表 — 在模块加载时一次性生成 */
const TABLE = /* @__PURE__ */ buildTable(0x31);

function buildTable(poly: number): Uint8Array {
  const t = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x80 ? ((crc << 1) ^ poly) & 0xFF : (crc << 1) & 0xFF;
    }
    t[i] = crc;
  }
  return t;
}

// ============================================================
//  公共 API
// ============================================================

/**
 * 计算 CRC-8/MAXIM 校验值
 *
 * @param data    输入字节数组
 * @param offset  起始偏移 (默认 0)
 * @param length  计算长度 (默认到末尾)
 * @returns       8 位校验值
 */
export function crc8Maxim(
  data: Uint8Array,
  offset = 0,
  length = data.length - offset,
): number {
  let crc = 0x00;
  const end = offset + length;
  for (let i = offset; i < end; i++) {
    crc = TABLE[crc ^ data[i]];
  }
  return crc;
}
