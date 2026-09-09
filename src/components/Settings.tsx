import { useEffect, useRef } from 'react';
import {
  X, CloudSun, Timer, Rows3, Sparkles, Bot, Snowflake, Megaphone, Leaf, RotateCcw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DisplaySettings, MotionLevel, SnowfallMode } from '@/hooks/useDisplaySettings';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DisplaySettings;
  onSettingChange: <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => void;
  onApplyEco: () => void;
  onReset: () => void;
}

/* ── stavební prvky ──────────────────────────────────────────── */

interface RowProps {
  icon: LucideIcon;
  title: string;
  hint: string;
  children: React.ReactNode;
}

const Row = ({ icon: Icon, title, hint, children }: RowProps) => (
  <div className="flex items-center justify-between gap-6 py-4">
    <div className="flex items-start gap-3 min-w-0">
      <Icon className="w-5 h-5 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-slate-900 leading-tight">{title}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{hint}</p>
      </div>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

/** Segmentovaný přepínač. Vidět je vždycky celá škála i to, kde stojíš. */
function Segmented<T extends string | number>({
  value, options, onChange, label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-slate-100 p-1 gap-1">
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={[
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors tabular-nums',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={[
      'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
      checked ? 'bg-blue-600' : 'bg-slate-300',
    ].join(' ')}
  >
    <span
      className={[
        'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1',
      ].join(' ')}
    />
  </button>
);

/* ── modal ───────────────────────────────────────────────────── */

export const Settings = ({
  isOpen, onClose, settings, onSettingChange, onApplyEco, onReset,
}: SettingsProps) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ecoActive =
    settings.motion === 'off' && !settings.showRobot && settings.snowfall === 'off' && settings.maxItems <= 5;

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-slate-200">
          <div>
            <h2 id="settings-title" className="text-xl font-bold text-slate-900">Nastavení tabule</h2>
            <p className="text-sm text-slate-500 mt-1">Platí jen pro tuhle obrazovku, ukládá se do prohlížeče.</p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Zavřít nastavení"
            className="p-2 -m-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-6">
          <section className="pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Zobrazení</h3>
            <div className="divide-y divide-slate-100">
              <Row icon={Timer} title="Formát času" hint="Odpočet do odjezdu, nebo čas z jízdního řádu.">
                <Segmented
                  label="Formát času"
                  value={settings.showTimesInMinutes ? 'min' : 'abs'}
                  onChange={v => onSettingChange('showTimesInMinutes', v === 'min')}
                  options={[{ value: 'min', label: 'Za 4 min' }, { value: 'abs', label: '16:32' }]}
                />
              </Row>

              <Row icon={Rows3} title="Odjezdů na sloupec" hint="Míň řádků = míň práce při každém překreslení.">
                <Segmented
                  label="Odjezdů na sloupec"
                  value={settings.maxItems}
                  onChange={v => onSettingChange('maxItems', v)}
                  options={[4, 5, 6, 7, 8].map(n => ({ value: n, label: String(n) }))}
                />
              </Row>

              <Row icon={CloudSun} title="Počasí v hlavičce" hint="Jen při rozděleném zobrazení dvou zastávek.">
                <Toggle
                  label="Počasí v hlavičce"
                  checked={settings.showWeatherInHeader}
                  onChange={v => onSettingChange('showWeatherInHeader', v)}
                />
              </Row>
            </div>
          </section>

          <section className="pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pohyb na obrazovce</h3>
            <p className="text-sm text-slate-500 mt-1">
              Tohle rozhoduje o plynulosti na slabém počítači víc než cokoli jiného.
            </p>
            <div className="divide-y divide-slate-100 mt-1">
              <Row icon={Sparkles} title="Animace" hint="Přechody karet a střídání směrů.">
                <Segmented
                  label="Animace"
                  value={settings.motion}
                  onChange={v => onSettingChange('motion', v as MotionLevel)}
                  options={[
                    { value: 'full' as MotionLevel, label: 'Vše' },
                    { value: 'reduced' as MotionLevel, label: 'Jen robot' },
                    { value: 'off' as MotionLevel, label: 'Vypnout' },
                  ]}
                />
              </Row>

              <Row
                icon={Bot}
                title="Robot"
                hint={settings.motion === 'off'
                  ? 'Vypnutý spolu s animacemi.'
                  : 'Projede spodní hranou jednou za minutu.'}
              >
                <Toggle
                  label="Robot"
                  checked={settings.showRobot && settings.motion !== 'off'}
                  onChange={v => onSettingChange('showRobot', v)}
                />
              </Row>

              <Row icon={Snowflake} title="Sněžení" hint="Automaticky od 27. 11. do 6. 1.">
                <Segmented
                  label="Sněžení"
                  value={settings.snowfall}
                  onChange={v => onSettingChange('snowfall', v as SnowfallMode)}
                  options={[
                    { value: 'auto' as SnowfallMode, label: 'Podle data' },
                    { value: 'on' as SnowfallMode, label: 'Zapnout' },
                    { value: 'off' as SnowfallMode, label: 'Vypnout' },
                  ]}
                />
              </Row>
            </div>
          </section>

          <section className="pt-6 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kontrola</h3>
            <div className="divide-y divide-slate-100">
              <Row icon={Megaphone} title="Zkušební hlášení" hint="Vloží ukázkový alert, ať jde ověřit, že se banner zobrazí.">
                <Toggle
                  label="Zkušební hlášení"
                  checked={settings.testAlert}
                  onChange={v => onSettingChange('testAlert', v)}
                />
              </Row>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onApplyEco}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Leaf className="w-4 h-4 text-emerald-600" />
            {ecoActive ? 'Úsporný režim je zapnutý' : 'Zapnout úsporný režim'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <RotateCcw className="w-4 h-4" />
              Výchozí
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Hotovo
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
