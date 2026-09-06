/**
 * [INPUT]: 依赖设备 store 与 useLocale
 * [OUTPUT]: DeviceInfo，可展开的设备校准与协议信息
 * [POS]: connection/ 的低频配置视图，位于侧栏；实时读数由 measurement-summary 提供
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { Cpu } from 'lucide-react';
import { useDeviceStore } from '@/store/device-store.js';
import { useLocale } from '@/hooks/use-locale.js';

export function DeviceInfo() {
  const config = useDeviceStore((s) => s.config);
  const { t } = useLocale();
  const rows = [
    [t.shuntRA, config ? `${Number(config.shuntR_a.toPrecision(6))} Ω` : '—'],
    [t.shuntRB, config ? `${Number(config.shuntR_b.toPrecision(6))} Ω` : '—'],
    [t.protocol, config ? `v${config.version}` : '—'],
  ];
  return (
    <details className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <summary className="cursor-pointer text-sm font-medium">
        <Cpu className="inline w-4 h-4 mr-2 align-text-bottom" />{t.deviceInfo}
      </summary>
      <dl className="mt-4 space-y-3 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-[hsl(var(--muted-foreground))]">{label}</dt>
            <dd className="data-value">{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
