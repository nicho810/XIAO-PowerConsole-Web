/**
 * [INPUT]:  无外部依赖 — 纯 TypeScript
 * [OUTPUT]: 对外提供 formatVoltage、formatCurrent、formatPower、cn 工具函数
 * [POS]:    lib/ 的通用格式化工具集，被 UI 展示层消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
//  数值格式化 — 物理量 → 人类可读字符串
// ============================================================

/** 电压格式化: V → "x.xxx V" */
export function formatVoltage(v: number): string {
  return `${v.toFixed(3)} V`;
}

/** 电流格式化: A → "x.xx mA" */
export function formatCurrent(a: number): string {
  return `${(a * 1000).toFixed(2)} mA`;
}

/** 功率格式化: W → "x.xx mW" */
export function formatPower(w: number): string {
  return `${(w * 1000).toFixed(2)} mW`;
}

// ============================================================
//  样式工具
// ============================================================

/** 条件类名拼接 — 过滤 falsy 值后空格连接 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
