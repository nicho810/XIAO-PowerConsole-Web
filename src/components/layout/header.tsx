/**
 * [INPUT]: lucide-react、useTheme 和 useLocale
 * [OUTPUT]: Header，品牌、仓库入口、主题与语言选择
 * [POS]: layout/ 的全局顶栏，由 App 唯一挂载主题 hook
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { Sun, Moon, Github } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme.js';
import { useLocale } from '@/hooks/use-locale.js';
import type { Locale } from '@/i18n/locales.js';

export function Header() {
  const { theme, toggle } = useTheme();
  const { locale, t, labels, setLocale } = useLocale();
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <img src="/XPB-logo.png" alt="" className={theme === 'dark' ? 'invert' : ''} />
        <div><h1>XIAO <span>PowerConsole</span></h1><p>PRECISION POWER MONITORING</p></div>
      </div>
      <nav className="header-tools" aria-label="Preferences">
        <a className="monitor-button" href="https://github.com/nicho810/XIAO-PowerBread" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository"><Github /></a>
        <button className="monitor-button" onClick={toggle} aria-label={theme === 'light' ? t.switchToDark : t.switchToLight}>{theme === 'light' ? <Moon /> : <Sun />}</button>
        <select className="monitor-button language-select" aria-label={t.language} value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
          {(Object.keys(labels) as Locale[]).map((key) => <option key={key} value={key}>{labels[key]}</option>)}
        </select>
      </nav>
    </header>
  );
}
