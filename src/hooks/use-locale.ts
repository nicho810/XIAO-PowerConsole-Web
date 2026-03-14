/**
 * [INPUT]:  依赖 react/useSyncExternalStore, i18n/locales, localStorage
 * [OUTPUT]: 对外提供 useLocale hook — 多语言切换，模块级共享状态 + localStorage 持久化
 * [POS]:    hooks/ 的语言管理，被所有需要多语言的组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useSyncExternalStore } from 'react';
import { LOCALES, LOCALE_LABELS, type Locale, type LocaleStrings } from '@/i18n/locales.js';

// ============================================================
//  模块级共享状态 — 跨组件单一真相源，无需 Context Provider
// ============================================================

const VALID: ReadonlySet<string> = new Set(Object.keys(LOCALES));

function readStored(): Locale {
  const saved = localStorage.getItem('locale');
  return saved && VALID.has(saved) ? (saved as Locale) : 'en';
}

let _locale: Locale = readStored();
const _listeners = new Set<() => void>();

function subscribe(fn: () => void): () => void {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}

function snapshot(): Locale { return _locale; }

export function setLocale(locale: Locale): void {
  _locale = locale;
  localStorage.setItem('locale', locale);
  _listeners.forEach((fn) => fn());
}

// ============================================================
//  useLocale — 任意组件调用即可获得响应式翻译对象
// ============================================================

export interface UseLocaleResult {
  locale: Locale;
  t:      LocaleStrings;
  labels: typeof LOCALE_LABELS;
  setLocale: (locale: Locale) => void;
}

export function useLocale(): UseLocaleResult {
  const locale = useSyncExternalStore(subscribe, snapshot);
  return { locale, t: LOCALES[locale], labels: LOCALE_LABELS, setLocale };
}
