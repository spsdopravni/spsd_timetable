// In-page sonda. Instaluje se přes page.evaluateOnNewDocument, tj. BĚŽÍ DŘÍV
// než jakýkoli skript aplikace (proto může přepsat setInterval/setTimeout).
// Data se agregují do histogramů s KONSTANTNÍ pamětí — kdybychom si drželi pole
// všech snímků, sonda sama by rostla a znehodnotila leak test.
export function installProbe(opts) {
  const N = 210; // 0..199 ms + přetečení
  const mk = () => ({ count: 0, sum: 0, max: 0, hist: new Array(N).fill(0) });
  const add = (b, v) => {
    b.count++; b.sum += v; if (v > b.max) b.max = v;
    b.hist[Math.min(N - 1, Math.round(v))]++;
  };
  const B = {
    frames: mk(), longTasks: mk(), paint: {}, timerMap: {}, errors: [],
    startedAt: performance.now(),
  };
  window.__bench = B;

  // ── FPS: měříme mezery mezi rAF snímky, které aplikace reálně dostane ──
  let last = -1;
  const tick = (t) => { if (last >= 0) add(B.frames, t - last); last = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);

  const obs = (type, cb) => { try { new PerformanceObserver(cb).observe({ type, buffered: true }); } catch (e) {} };
  obs('longtask', (l) => { for (const e of l.getEntries()) add(B.longTasks, e.duration); });
  obs('paint', (l) => { for (const e of l.getEntries()) B.paint[e.name] = Math.round(e.startTime); });
  obs('largest-contentful-paint', (l) => {
    const es = l.getEntries(); B.paint.lcp = Math.round(es[es.length - 1].startTime);
  });

  window.addEventListener('error', (e) => { if (B.errors.length < 50) B.errors.push(String(e.message)); });
  window.addEventListener('unhandledrejection', (e) => { if (B.errors.length < 50) B.errors.push('rejection: ' + String(e.reason)); });

  // ── zrychlení času pro leak test ──
  // Škálují se jen delaye >= minScaledMs (default 1000), aby se nerozbily
  // krátké debounce/transition timeouty. Floor brání tomu, aby 1s tik spadl
  // na 20 ms a saturoval hlavní vlákno (to už by nebyl leak test, ale DoS).
  if (opts && opts.speed > 1) {
    const scale = (d) => {
      const orig = Number(d) || 0;
      if (orig < opts.minScaledMs) return orig;
      const s = Math.max(opts.floorMs, Math.round(orig / opts.speed));
      B.timerMap[orig] = s;
      return s;
    };
    const si = window.setInterval.bind(window);
    const st = window.setTimeout.bind(window);
    window.setInterval = (fn, d, ...a) => si(fn, scale(d), ...a);
    window.setTimeout = (fn, d, ...a) => st(fn, scale(d), ...a);
  }

  // read(reset) — harness ji volá při každém vzorku; vrací agregát
  B.read = (reset) => {
    const pack = (b) => ({ count: b.count, sum: +b.sum.toFixed(1), max: +b.max.toFixed(1), hist: b.hist.slice() });
    const out = {
      t: performance.now(), frames: pack(B.frames), longTasks: pack(B.longTasks),
      paint: B.paint, timerMap: B.timerMap, errors: B.errors.slice(),
      domNodes: document.getElementsByTagName('*').length,
    };
    if (reset) { B.frames = mk(); B.longTasks = mk(); }
    return out;
  };
}
