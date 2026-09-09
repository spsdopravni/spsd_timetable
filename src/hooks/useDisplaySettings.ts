import { useCallback, useEffect, useState } from 'react';

/**
 * Nastavení tabule. Dřív si každá stránka držela vlastní kopii téhle logiky
 * a půlka přepínačů nebyla nikam zapojená — testAlert nečetlo nic,
 * disableAnimations přepínalo třídy, jejichž animace stejně zabíjel plošný
 * `* { animation-duration: 0s !important }` v index.css, a showTimesInMinutes
 * neměl v modalu ovládací prvek a stránky ho při načtení přepsaly na true.
 */

export type MotionLevel = 'full' | 'reduced' | 'off';
export type SnowfallMode = 'auto' | 'on' | 'off';

export interface DisplaySettings {
  /** Počasí v hlavičce při rozděleném zobrazení. */
  showWeatherInHeader: boolean;
  /** Odpočet ("za 4 min") místo času odjezdu ("16:32"). */
  showTimesInMinutes: boolean;
  /** Kolik odjezdů na sloupec. Na slabém HW je každý řádek práce navíc. */
  maxItems: number;
  /** full = vše, reduced = jen robot, off = nehýbe se nic. */
  motion: MotionLevel;
  /** Robot dole. Nejdražší jednotlivá věc na obrazovce. */
  showRobot: boolean;
  /** auto = podle sezóny (27. 11.–6. 1.), jinak natvrdo. */
  snowfall: SnowfallMode;
  /** Vloží ukázkový alert do banneru, ať jde ověřit, že se zobrazuje. */
  testAlert: boolean;
}

export const DEFAULT_SETTINGS: DisplaySettings = {
  showWeatherInHeader: false,
  showTimesInMinutes: true,
  maxItems: 7,
  motion: 'reduced',
  showRobot: true,
  snowfall: 'auto',
  testAlert: false,
};

/** Úsporný režim — vypne to, co podle měření stojí nejvíc výkonu. */
export const ECO_SETTINGS: Partial<DisplaySettings> = {
  motion: 'off',
  showRobot: false,
  snowfall: 'off',
  maxItems: 5,
};

const BASE_KEY = 'tram-display-settings';

/** Každá tabule si drží vlastní nastavení — Motol a Moravská jsou jiné obrazovky. */
const storageKey = (scope?: string) => (scope ? `${BASE_KEY}-${scope}` : BASE_KEY);

function load(scope?: string): DisplaySettings {
  try {
    const saved = localStorage.getItem(storageKey(scope));
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved);

    // Migrace ze starého tvaru: disableAnimations: boolean → motion
    if (typeof parsed.disableAnimations === 'boolean' && parsed.motion === undefined) {
      parsed.motion = parsed.disableAnimations ? 'off' : 'reduced';
      delete parsed.disableAnimations;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useDisplaySettings(scope?: string) {
  const [settings, setSettings] = useState<DisplaySettings>(() => load(scope));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(scope), JSON.stringify(settings));
    } catch {
      /* plný storage nesmí shodit tabuli */
    }
  }, [settings, scope]);

  // Úroveň pohybu řídí CSS přes atribut na <html>. Bez tohohle byl přepínač
  // animací jen dekorace — plošné vypnutí v index.css o něm nevědělo.
  useEffect(() => {
    document.documentElement.dataset.motion = settings.motion;
    return () => { delete document.documentElement.dataset.motion; };
  }, [settings.motion]);

  const set = useCallback(<K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyEco = useCallback(() => {
    setSettings(prev => ({ ...prev, ...ECO_SETTINGS }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  /** Robot běží, jen když je zapnutý a pohyb není úplně vypnutý. */
  const robotEnabled = settings.showRobot && settings.motion !== 'off';

  const snowfallEnabled = useCallback(
    (seasonSaysYes: boolean) => settings.snowfall === 'auto' ? seasonSaysYes : settings.snowfall === 'on',
    [settings.snowfall]
  );

  return { settings, set, applyEco, reset, robotEnabled, snowfallEnabled };
}
