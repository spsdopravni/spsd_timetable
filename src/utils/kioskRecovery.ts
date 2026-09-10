/**
 * Samoobnova pro tabuli běžící 24/7 bez klávesnice.
 *
 * V repu do teď nebylo jediné `location.reload()`. ErrorBoundary čeká na
 * lidský klik, ale tabule u vchodu nemá kam kliknout — takže jakákoli
 * neodchycená chyba znamenala trvale mrtvou obrazovku až do ručního zásahu.
 * Nejčastější spouštěč: selhaný `import()` lazy chunku poté, co se appka
 * přebuildila, zatímco tab běžel se starým manifestem.
 *
 * Pozor na smyčku: reload, který spadne znovu, nesmí cyklit donekonečna.
 * Proto počítadlo v sessionStorage s prodlužující se prodlevou a stropem.
 */

const KEY = 'kiosk-reload-count';
const KEY_TS = 'kiosk-reload-ts';
const MAX_RELOADS = 5;            // pak už to nemá smysl, nech chybu na obrazovce
const RESET_AFTER_MS = 30 * 60_000; // půl hodiny bez pádu = počítadlo zpět na nulu

/** Tabule = všechno mimo mobilní PWA. Na /m* uživatel klikat může. */
export function isKioskRoute(pathname = location.pathname): boolean {
  return pathname !== '/m' && !pathname.startsWith('/m/');
}

function readCount(): number {
  try {
    const ts = Number(sessionStorage.getItem(KEY_TS) || 0);
    if (ts && Date.now() - ts > RESET_AFTER_MS) {
      sessionStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY_TS);
      return 0;
    }
    return Number(sessionStorage.getItem(KEY) || 0);
  } catch {
    return 0;
  }
}

function bumpCount(): number {
  const next = readCount() + 1;
  try {
    sessionStorage.setItem(KEY, String(next));
    sessionStorage.setItem(KEY_TS, String(Date.now()));
  } catch {
    /* private mode / plný storage — reload stejně zkusíme */
  }
  return next;
}

/**
 * Naplánuje reload. Vrací false, když je vyčerpaný limit — volající pak má
 * nechat na obrazovce chybovou hlášku, ať je při obchůzce co přečíst.
 */
export function scheduleReload(reason: string): boolean {
  if (!isKioskRoute()) return false;

  const n = bumpCount();
  if (n > MAX_RELOADS) {
    console.error(`[kiosk] ${reason} — limit ${MAX_RELOADS} reloadů vyčerpán, nechávám chybu na obrazovce`);
    return false;
  }

  const delay = Math.min(5_000 * n, 60_000);
  console.error(`[kiosk] ${reason} — reload ${n}/${MAX_RELOADS} za ${delay / 1000} s`);
  setTimeout(() => location.reload(), delay);
  return true;
}

/** Chyba načtení chunku po redeployi. Reload z čerstvého manifestu to spraví. */
function isChunkLoadError(msg: string): boolean {
  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk \d+ failed/i.test(msg);
}

export function installKioskRecovery(): void {
  if (!isKioskRoute()) return;

  window.addEventListener('error', (e) => {
    const msg = String(e?.message || '');
    if (isChunkLoadError(msg)) scheduleReload('chunk load error');
  });

  window.addEventListener('unhandledrejection', (e) => {
    const msg = String((e as PromiseRejectionEvent)?.reason?.message ?? (e as PromiseRejectionEvent)?.reason ?? '');
    if (isChunkLoadError(msg)) scheduleReload('chunk load error (promise)');
  });

  // Půlnoční reload: uvolní fragmentaci haldy Chromia a načte nový build.
  // Doplňuje deploy/tabule-restart.timer — ten restartuje celý proces,
  // tohle stačí na samotnou stránku a nepotřebuje systemd.
  const scheduleNightlyReload = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(3, 45, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    setTimeout(() => location.reload(), next.getTime() - now.getTime());
  };
  scheduleNightlyReload();
}
