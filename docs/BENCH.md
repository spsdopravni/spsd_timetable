# Benchmark & test harness pro tabuli — hotové soubory

Všechny soubory **už jsou zapsané na disku** v `/Users/hatcyk/Desktop/Main/weby/odjezdy` (untracked, branch `dev`), `package.json` a `.gitignore` jsou upravené. Níže je jejich přesný obsah + postup. Ověřeno reálným během na tomto Macu (výsledky dole).

---

## 0. Co je hotové a proč to nepoužívá `vite preview`

| soubor | role |
|---|---|
| `scripts/lib/harness.mjs` | společné utility: build, launch Chrome, CDP, statistika, ukládání reportů |
| `scripts/lib/server.mjs` | statický server nad `dist-bench` + **mock meteostanice** (režimy `ok`/`slow`/`hang`/`down`) |
| `scripts/lib/probe.mjs` | in-page sonda (FPS z rAF, long tasks, paint, zrychlení časovačů) |
| `scripts/lib/session.mjs` | jádro měření — sdílí `bench` i `leak` |
| `scripts/lib/workload.mjs` | deterministická mikro-zátěž pro kalibraci CPU throttlingu |
| `scripts/bench.mjs` | FPS / CPU / startup / paměť jedné routy |
| `scripts/leak.mjs` | dlouhý běh se zrychlenými časovači + verdikt o leaku |
| `scripts/robot-duty.mjs` | duty cycle DailyRobota (přímé ověření nálezu „21 s místo 60 s“) |
| `scripts/calibrate.mjs` | kalibrace `Emulation.setCPUThrottlingRate` proti reálnému Pi |
| `scripts/baseline.mjs` | vytvoří srovnávací základnu (sada scénářů → `bench/baseline/`) |
| `scripts/compare.mjs` | diff dvou reportů s šumovým prahem |

**Proč vlastní HTTP server místo `vite preview`:** (1) `vite preview` neaplikuje `server.proxy` z `vite.config.ts:11-17`, takže `/meteo` by na Macu neexistovalo a meteostanice by okamžitě spadla do circuit breakeru — nešly by měřit oba stavy; (2) potřebujeme scénář **zamrzlý ESP32** (`meteo=hang`), který drží reálné TCP sokety — puppeteer request-interception socket nezabere a hang se nereprodukuje; (3) `cache-control: no-store` na všem, aby startup měření bylo vždy „studený reboot“.

**Prerekvizita v aplikaci (už opraveno v pracovním stromu):** `src/utils/pidApi.ts:410` vracelo `{ departures: getMockDepartures(), alerts: [] }`, ale `getMockDepartures()` (`src/utils/mockData.ts:4`) už vrací `{ departures, alerts }` — dvojité zabalení. Bez téhle opravy je `VITE_USE_MOCK_DATA=true` (a tím i celý bench, a i běžný `npm run dev:watch`) bez odjezdů. Je to skutečná chyba dev módu, ne jen bench hack.

---

## 1. `package.json` — přidané řádky

```jsonc
  "scripts": {
    "dev": "vite build && vite preview",
    "dev:watch": "vite",
    "start": "vite build && vite preview",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    "bench": "node scripts/bench.mjs",
    "leak": "node scripts/leak.mjs",
    "bench:baseline": "node scripts/baseline.mjs",
    "bench:calibrate": "node scripts/calibrate.mjs",
    "bench:compare": "node scripts/compare.mjs",
    "bench:robot": "node scripts/robot-duty.mjs"
  },
```

`.gitignore` (přidáno na konec):

```gitignore
# bench
dist-bench
dist-dbg
bench/results
bench/snapshots
bench/traces
bench/latest.json
```

`bench/baseline/` se **necommitovat nesmí** — ta se naopak verzuje (viz §5).

---

## 2. Soubory

### `scripts/lib/harness.mjs`

```js
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { startServer } from './server.mjs';
import { installProbe } from './probe.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function parseArgs(argv, defaults) {
  const out = { ...defaults };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { out[key] = true; continue; }
    out[key] = /^-?\d+(\.\d+)?$/.test(next) ? Number(next) : next;
    i++;
  }
  return out;
}

export function gitInfo() {
  const sh = (c) => { try { return execSync(c, { cwd: ROOT }).toString().trim(); } catch { return ''; } };
  return {
    branch: sh('git rev-parse --abbrev-ref HEAD'),
    sha: sh('git rev-parse --short HEAD'),
    subject: sh('git log -1 --pretty=%s'),
    dirty: sh('git status --porcelain').length > 0,
  };
}

export function buildApp({ outDir = 'dist-bench', mock = true } = {}) {
  const t0 = Date.now();
  execSync(`npx vite build --outDir ${outDir} --emptyOutDir`, {
    cwd: ROOT, stdio: 'inherit',
    env: { ...process.env, VITE_USE_MOCK_DATA: mock ? 'true' : 'false' },
  });
  const dir = path.join(ROOT, outDir, 'assets');
  const chunks = fs.existsSync(dir)
    ? fs.readdirSync(dir).map((f) => ({ file: f, bytes: fs.statSync(path.join(dir, f)).size }))
        .sort((a, b) => b.bytes - a.bytes)
    : [];
  return {
    buildMs: Date.now() - t0, outDir,
    totalJsBytes: chunks.filter((c) => c.file.endsWith('.js')).reduce((s, c) => s + c.bytes, 0),
    chunks: chunks.slice(0, 15),
  };
}

// Násobek CPU throttlingu. Default 6 je jen bezpečný start — ZKALIBRUJ
// přes `npm run bench:calibrate`, jinak jsou absolutní čísla orientační.
export const DEFAULT_CPU_RATE = 6;

export async function launch({ cpuRate, headless, offline, width = 1920, height = 1080 }) {
  const args = [
    `--window-size=${width},${height + 90}`,
    '--force-device-scale-factor=1',
    '--hide-scrollbars',
    // bez těchto tří Chrome uspí časovače a rAF, jakmile okno ztratí fokus
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=CalculateNativeWinOcclusion,Translate',
    '--no-first-run', '--no-default-browser-check',
    '--use-mock-keychain',
  ];
  // offline = DNS pro cizí hosty selže okamžitě (gstatic, cdnjs, golemio,
  // weatherapi, worldtimeapi, supabase). Localhost projde.
  if (offline) args.push('--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost');

  const browser = await puppeteer.launch({
    headless: headless ? 'new' : false,
    defaultViewport: { width, height, deviceScaleFactor: 1 },
    args,
  });
  return browser;
}

export async function openPage(browser, { url, route, cpuRate, speed, floorMs, minScaledMs }) {
  const page = (await browser.pages())[0] || (await browser.newPage());
  const net = { requests: 0, finished: 0, failed: 0, byHost: {}, jsBytes: 0, docs: [] };
  page.on('request', (r) => {
    net.requests++;
    const h = new URL(r.url()).host + (r.url().includes('/meteo/') ? '/meteo' : '');
    net.byHost[h] = (net.byHost[h] || 0) + 1;
  });
  page.on('requestfinished', async (r) => {
    net.finished++;
    if (r.resourceType() === 'script') {
      try { const s = (await r.response().buffer()).length; net.jsBytes += s; net.docs.push(r.url().split('/').pop()); } catch {}
    }
  });
  page.on('requestfailed', () => { net.failed++; });

  const console_ = { errors: [], warnings: 0 };
  page.on('console', (m) => {
    if (m.type() === 'error' && console_.errors.length < 30) console_.errors.push(m.text().slice(0, 200));
    if (m.type() === 'warning') console_.warnings++;
  });
  page.on('pageerror', (e) => { if (console_.errors.length < 30) console_.errors.push('pageerror: ' + String(e).slice(0, 200)); });

  await page.evaluateOnNewDocument(installProbe, { speed, floorMs, minScaledMs });

  const client = await page.createCDPSession();
  await client.send('Performance.enable', { timeDomain: 'timeTicks' });
  await client.send('HeapProfiler.enable');
  await client.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });

  const t0 = Date.now();
  await page.goto(url + route, { waitUntil: 'load', timeout: 120000 });
  const loadMs = Date.now() - t0;
  await page.bringToFront();

  return { page, client, net, console_, loadMs };
}

export async function metrics(client) {
  const { metrics: m } = await client.send('Performance.getMetrics');
  return Object.fromEntries(m.map((x) => [x.name, x.value]));
}

export async function gc(client) { try { await client.send('HeapProfiler.collectGarbage'); } catch {} }

export function pct(hist, p) {
  const total = hist.reduce((a, b) => a + b, 0);
  if (!total) return null;
  let acc = 0;
  for (let i = 0; i < hist.length; i++) { acc += hist[i]; if (acc / total >= p) return i; }
  return hist.length - 1;
}

// lineární regrese y = a + b*x; vrací slope za minutu a R^2
export function trend(samples, key) {
  const xs = samples.map((s) => s.tMs / 60000);
  const ys = samples.map((s) => s[key]);
  const n = xs.length;
  if (n < 3) return { slopePerMin: 0, r2: 0 };
  const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  const b = sxx ? sxy / sxx : 0;
  return { slopePerMin: b, r2: syy ? (sxy * sxy) / (sxx * syy) : 0 };
}

export function saveReport(report, { label, route }) {
  const dir = path.join(ROOT, 'bench', 'results');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const slug = route.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'index';
  const file = path.join(dir, `${stamp}_${report.git.sha || 'nogit'}_${label}_${slug}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(ROOT, 'bench', 'latest.json'), JSON.stringify(report, null, 2));
  return file;
}

export function envInfo() {
  const cpu = os.cpus()[0]?.model || 'unknown';
  return { node: process.version, platform: `${os.platform()} ${os.release()}`, cpu, cores: os.cpus().length, totalMemGB: +(os.totalmem() / 2 ** 30).toFixed(1) };
}

export { startServer, puppeteer };
```

### `scripts/lib/server.mjs`

```js
// Statický server pro dist-bench + mock meteostanice.
// Vlastní server (ne `vite preview`), protože potřebujeme:
//  1) jeden origin pro appku i /meteo (vite preview neumí server.proxy z configu),
//  2) REÁLNÉ sokety pro scénář "zamrzlý ESP32" (mode=hang drží spojení otevřené,
//     puppeteer request-interception by socket nezabral a hang by se nereprodukoval).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
};

// ESPHome vrací {"id":"sensor-x","value":21.3,"state":"21.3 °C"}
function meteoPayload(urlPath, t) {
  const isText = urlPath.includes('/text_sensor/');
  if (isText) {
    if (urlPath.includes('kompas')) return { id: 'text_sensor-x', value: 'SZ', state: 'SZ' };
    if (urlPath.includes('beaufort')) return { id: 'text_sensor-x', value: '2 - Vanek', state: '2' };
    return { id: 'text_sensor-x', value: String(180 + Math.sin(t / 5e4) * 40), state: 'deg' };
  }
  const v = Math.round((15 + Math.sin(t / 6e4) * 5) * 10) / 10;
  return { id: 'sensor-x', value: v, state: `${v}` };
}

export function startServer({ distDir, meteo = 'ok', meteoLatencyMs = 5, port = 0 }) {
  const stats = { requests: 0, meteoRequests: 0, meteoHeld: 0, byPath: new Map() };
  const held = []; // pending res objekty v mode=hang (drží reálný socket)

  const server = http.createServer((req, res) => {
    stats.requests++;
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    stats.byPath.set(urlPath, (stats.byPath.get(urlPath) || 0) + 1);

    if (urlPath.startsWith('/meteo')) {
      stats.meteoRequests++;
      const mode = meteo;
      if (mode === 'hang') { held.push(res); stats.meteoHeld = held.length; return; } // nikdy neodpoví
      if (mode === 'down') { req.socket.destroy(); return; }
      const latency = mode === 'slow' ? 1500 : meteoLatencyMs;
      setTimeout(() => {
        if (res.writableEnded) return;
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end(JSON.stringify(meteoPayload(urlPath, Date.now())));
      }, latency);
      return;
    }

    let file = path.join(distDir, urlPath);
    if (!path.extname(urlPath)) file = path.join(distDir, 'index.html'); // SPA fallback
    fs.readFile(file, (err, buf) => {
      if (err) {
        fs.readFile(path.join(distDir, 'index.html'), (e2, idx) => {
          if (e2) { res.writeHead(404); res.end('404'); return; }
          res.writeHead(200, { 'content-type': MIME['.html'] }); res.end(idx);
        });
        return;
      }
      res.writeHead(200, {
        'content-type': MIME[path.extname(file)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(buf);
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${server.address().port}`;
      resolve({
        url,
        stats,
        close: () => new Promise((r) => {
          held.forEach((h) => { try { h.destroy(); } catch {} });
          server.closeAllConnections?.();
          server.close(() => r());
        }),
      });
    });
  });
}
```

### `scripts/lib/probe.mjs`

```js
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
```

### `scripts/lib/session.mjs`

```js
// Jádro měření: postaví build, nastartuje server, otevře routu, vzorkuje
// metriky a vrátí hotový report. Sdílí ho bench.mjs i leak.mjs.
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, gitInfo, buildApp, launch, openPage, metrics, gc, pct, trend, envInfo, startServer,
} from './harness.mjs';

function fromHist(h) {
  const total = h.reduce((a, b) => a + b, 0);
  let mode = 0; for (let i = 1; i < h.length; i++) if (h[i] > h[mode]) mode = i;
  const refresh = mode || 17;
  const over = (f) => h.reduce((s, c, i) => s + (i > refresh * f ? c : 0), 0);
  return {
    total, refreshMs: refresh, p50: pct(h, 0.5), p95: pct(h, 0.95), p99: pct(h, 0.99),
    droppedPct: total ? +(100 * over(1.5) / total).toFixed(2) : 0,
    badPct: total ? +(100 * over(3) / total).toFixed(2) : 0,
  };
}

async function heapSnapshot(client, file) {
  const chunks = [];
  const onChunk = (p) => chunks.push(p.chunk);
  client.on('HeapProfiler.addHeapSnapshotChunk', onChunk);
  await client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, captureNumericValue: false });
  client.off('HeapProfiler.addHeapSnapshotChunk', onChunk);
  fs.writeFileSync(file, chunks.join(''));
}

export async function runSession(args) {
  const durationMs = args.minutes * 60000;
  const build = args.build === false
    ? { outDir: args.outDir || 'dist-bench', chunks: [] }
    : buildApp({ outDir: args.outDir || 'dist-bench', mock: true });

  const server = await startServer({ distDir: path.join(ROOT, build.outDir), meteo: args.meteo });
  const browser = await launch({ cpuRate: args.cpu, headless: args.headless, offline: args.offline });
  const { page, client, net, console_, loadMs } = await openPage(browser, {
    url: server.url, route: args.route, cpuRate: args.cpu,
    speed: args.speed, floorMs: args.floor, minScaledMs: args.minScaled,
  });

  const snapDir = path.join(ROOT, 'bench', 'snapshots');
  if (args.snapshots) fs.mkdirSync(snapDir, { recursive: true });
  if (args.trace) {
    fs.mkdirSync(path.join(ROOT, 'bench', 'traces'), { recursive: true });
    await page.tracing.start({ path: path.join(ROOT, 'bench', 'traces', `${args.label}-${Date.now()}.json`) });
  }

  console.log(`[bench] ${server.url}${args.route} | cpu ${args.cpu}x | ${args.minutes} min | meteo=${args.meteo} | timers ${args.speed}x (floor ${args.floor} ms)`);
  await new Promise((r) => setTimeout(r, args.warmup * 1000));

  if (args.snapshots) { await gc(client); await heapSnapshot(client, path.join(snapDir, `${args.label}-start.heapsnapshot`)); }

  const first = await metrics(client);
  await page.evaluate(() => window.__bench.read(true));
  const t0 = Date.now();
  const samples = [];
  let last = first;

  while (Date.now() - t0 < durationMs) {
    await new Promise((r) => setTimeout(r, args.sample * 1000));
    if (args.gcEachSample) await gc(client);   // bez GC měříme pilu, ne leak
    const m = await metrics(client);
    const p = await page.evaluate(() => window.__bench.read(true));
    const dt = m.Timestamp - last.Timestamp || 1;
    const s = {
      tMs: Date.now() - t0,
      heapUsed: m.JSHeapUsedSize, heapTotal: m.JSHeapTotalSize,
      nodes: m.Nodes, listeners: m.JSEventListeners, documents: m.Documents, domNodes: p.domNodes,
      taskMsPerSec: +(1000 * (m.TaskDuration - last.TaskDuration) / dt).toFixed(1),
      scriptMsPerSec: +(1000 * (m.ScriptDuration - last.ScriptDuration) / dt).toFixed(1),
      layoutMsPerSec: +(1000 * (m.LayoutDuration - last.LayoutDuration) / dt).toFixed(1),
      styleMsPerSec: +(1000 * (m.RecalcStyleDuration - last.RecalcStyleDuration) / dt).toFixed(1),
      layoutsPerSec: +((m.LayoutCount - last.LayoutCount) / dt).toFixed(1),
      stylesPerSec: +((m.RecalcStyleCount - last.RecalcStyleCount) / dt).toFixed(1),
      frames: p.frames, longTasks: p.longTasks,
      netPending: net.requests - net.finished - net.failed, netRequests: net.requests,
    };
    samples.push(s); last = m;
    process.stdout.write(
      `  t=${String(Math.round(s.tMs / 1000)).padStart(5)}s heap=${(s.heapUsed / 1048576).toFixed(1)}MB ` +
      `nodes=${String(s.nodes).padStart(5)} listeners=${String(s.listeners).padStart(4)} ` +
      `cpu=${String(s.taskMsPerSec).padStart(5)}ms/s fps=${(1000 / (s.frames.sum / Math.max(1, s.frames.count))).toFixed(1)} pending=${s.netPending}\n`
    );
  }

  if (args.trace) await page.tracing.stop();
  if (args.snapshots) { await gc(client); await heapSnapshot(client, path.join(snapDir, `${args.label}-end.heapsnapshot`)); }

  const hist = new Array(210).fill(0);
  let fCount = 0, fSum = 0, ltCount = 0, ltSum = 0, ltMax = 0;
  for (const s of samples) {
    s.frames.hist.forEach((c, i) => { hist[i] += c; });
    fCount += s.frames.count; fSum += s.frames.sum;
    ltCount += s.longTasks.count; ltSum += s.longTasks.sum; ltMax = Math.max(ltMax, s.longTasks.max);
  }
  const fh = fromHist(hist);
  const probe = await page.evaluate(() => window.__bench.read(false));
  const minutes = (samples.at(-1)?.tMs || 60000) / 60000;
  const avg = (k) => +(samples.reduce((a, s) => a + s[k], 0) / samples.length).toFixed(1);
  const tr = (k) => trend(samples, k);

  const report = {
    schema: 'odjezdy-bench/1',
    label: args.label,
    createdAt: new Date().toISOString(),
    git: gitInfo(),
    env: envInfo(),
    config: {
      route: args.route, minutes: args.minutes, cpuThrottle: args.cpu, sampleS: args.sample,
      warmupS: args.warmup, meteo: args.meteo, timerSpeed: args.speed, timerFloorMs: args.floor,
      minScaledMs: args.minScaled, headless: !!args.headless, offline: !!args.offline,
      gcEachSample: !!args.gcEachSample, viewport: '1920x1080@1x',
    },
    build: { buildMs: build.buildMs ?? null, totalJsBytes: build.totalJsBytes ?? null, chunks: build.chunks },
    startup: {
      loadMs, fcpMs: probe.paint['first-contentful-paint'] ?? null, lcpMs: probe.paint.lcp ?? null,
      jsTransferBytes: net.jsBytes, jsFilesLoaded: [...new Set(net.docs)],
    },
    runtime: {
      fps: {
        mean: +(1000 / (fSum / Math.max(1, fCount))).toFixed(1), frames: fCount, refreshMs: fh.refreshMs,
        frameMsP50: fh.p50, frameMsP95: fh.p95, frameMsP99: fh.p99,
        droppedFramePct: fh.droppedPct, badFramePct: fh.badPct,
      },
      longTasks: { count: ltCount, totalMs: +ltSum.toFixed(0), maxMs: ltMax, perMin: +(ltCount / minutes).toFixed(1), msPerMin: +(ltSum / minutes).toFixed(0) },
      cpu: { taskMsPerSec: avg('taskMsPerSec'), scriptMsPerSec: avg('scriptMsPerSec'), layoutMsPerSec: avg('layoutMsPerSec'), styleMsPerSec: avg('styleMsPerSec') },
      counts: { layoutsPerSec: avg('layoutsPerSec'), recalcStylesPerSec: avg('stylesPerSec') },
    },
    memory: {
      heapStartMB: +(samples[0].heapUsed / 1048576).toFixed(2),
      heapEndMB: +(samples.at(-1).heapUsed / 1048576).toFixed(2),
      heapSlopeMBPerMin: +(tr('heapUsed').slopePerMin / 1048576).toFixed(3),
      heapSlopeR2: +tr('heapUsed').r2.toFixed(2),
      nodesStart: samples[0].nodes, nodesEnd: samples.at(-1).nodes,
      nodesSlopePerMin: +tr('nodes').slopePerMin.toFixed(2), nodesSlopeR2: +tr('nodes').r2.toFixed(2),
      listenersStart: samples[0].listeners, listenersEnd: samples.at(-1).listeners,
      listenersSlopePerMin: +tr('listeners').slopePerMin.toFixed(2),
      documentsEnd: samples.at(-1).documents,
    },
    network: {
      total: net.requests, failed: net.failed, pendingEnd: net.requests - net.finished - net.failed,
      pendingSlopePerMin: +tr('netPending').slopePerMin.toFixed(2),
      perMin: +(net.requests / minutes).toFixed(1), byHost: net.byHost,
      serverMeteoRequests: server.stats.meteoRequests, serverMeteoHeld: server.stats.meteoHeld,
    },
    console: { errors: console_.errors, warnings: console_.warnings, pageErrors: probe.errors },
    timerMap: probe.timerMap,
    samples: samples.map(({ frames, longTasks, ...rest }) => rest),
  };

  await browser.close();
  await server.close();
  return report;
}
```

### `scripts/lib/workload.mjs`

```js
// Deterministická mikro-zátěž pro kalibraci CPU throttlingu.
// Musí být BAJTOVĚ IDENTICKÁ na Macu i na Pi → proto je to jeden string,
// který se injektuje do puppeteeru i do bench/cpu-probe.html.
export const WORKLOAD_SRC = String.raw`
function benchWorkload() {
  // seeded PRNG, ať je zátěž mezi běhy identická
  let seed = 123456789;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  const t0 = performance.now();

  // 1) čistá aritmetika + alokace objektů (React reconciliation proxy)
  let acc = 0;
  for (let pass = 0; pass < 40; pass++) {
    const arr = [];
    for (let i = 0; i < 5000; i++) arr.push({ id: i, v: rnd(), s: 'row' + (i & 255) });
    for (const o of arr) acc += o.v * o.s.length;
    arr.sort((a, b) => a.v - b.v);
    acc += arr[0].v;
  }

  // 2) string/format práce (formatDisplayTime, toLocaleTimeString apod.)
  let str = '';
  for (let i = 0; i < 20000; i++) str = new Date(1700000000000 + i * 1000).toISOString().slice(11, 19);
  acc += str.length;

  // 3) DOM: style recalc + layout (to CPU throttling škrtí taky)
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px';
  document.body.appendChild(host);
  for (let i = 0; i < 300; i++) {
    const d = document.createElement('div');
    d.className = 'benchrow';
    d.style.cssText = 'display:flex;padding:4px;font-size:' + (12 + (i % 8)) + 'px';
    d.innerHTML = '<span>' + i + '</span><span>Dejvická</span><span>' + (i % 60) + ' min</span>';
    host.appendChild(d);
    if (i % 50 === 0) acc += host.offsetHeight; // vynucený layout
  }
  acc += host.getBoundingClientRect().height;
  host.remove();

  return { ms: Math.round(performance.now() - t0), checksum: Math.round(acc) };
}
`;
```

### `scripts/bench.mjs`

```js
#!/usr/bin/env node
// FPS / CPU / paměťový benchmark jedné routy tabule.
// npm run bench -- --route /spsmotol --minutes 2 --cpu 6 --label baseline
import path from 'node:path';
import { ROOT, parseArgs, saveReport, DEFAULT_CPU_RATE } from './lib/harness.mjs';
import { runSession } from './lib/session.mjs';

const args = parseArgs(process.argv.slice(2), {
  route: '/spsmotol',
  minutes: 3,
  cpu: DEFAULT_CPU_RATE,   // viz npm run bench:calibrate
  label: 'run',
  sample: 5,               // s — perioda vzorku
  warmup: 15,              // s — zahodí startovní špičku (lazy chunky, první data)
  meteo: 'ok',             // ok | slow | hang | down
  speed: 1,                // zrychlení časovačů; pro FPS bench VŽDY 1
  floor: 250,
  minScaled: 1000,
  headless: false,         // FPS měř JEN headful, headless je zastropovaný na ~30 fps
  offline: true,
  gcEachSample: false,
  snapshots: false,
  trace: false,
});

const report = await runSession(args);
const file = saveReport(report, { label: args.label, route: args.route });

console.log('\n' + JSON.stringify({
  fps: report.runtime.fps,
  longTasks: report.runtime.longTasks,
  cpu: report.runtime.cpu,
  counts: report.runtime.counts,
  startup: { loadMs: report.startup.loadMs, fcpMs: report.startup.fcpMs, lcpMs: report.startup.lcpMs, jsKB: Math.round(report.startup.jsTransferBytes / 1024), files: report.startup.jsFilesLoaded.length },
  memory: { heapEndMB: report.memory.heapEndMB, nodesEnd: report.memory.nodesEnd },
  network: { total: report.network.total, perMin: report.network.perMin },
}, null, 2));
if (report.console.errors.length) console.log('\n[!] console errors:', report.console.errors.slice(0, 5));
console.log(`\n[bench] report → ${path.relative(ROOT, file)}`);
```

### `scripts/leak.mjs`

```js
#!/usr/bin/env node
// Leak test: dlouhý běh se zrychlenými časovači, GC před každým vzorkem,
// regrese heapu / DOM nodů / listenerů / pending requestů.
// npm run leak -- --minutes 20 --speed 20 --floor 100 --meteo ok
import path from 'node:path';
import { ROOT, parseArgs, saveReport, DEFAULT_CPU_RATE } from './lib/harness.mjs';
import { runSession } from './lib/session.mjs';

const args = parseArgs(process.argv.slice(2), {
  route: '/spsmotol',
  minutes: 20,
  cpu: 1,            // leak test neřeší FPS → neškrtíme CPU, ať stihneme víc iterací
  label: 'leak',
  sample: 15,
  warmup: 20,
  meteo: 'ok',       // ok | slow | hang | down  ← 'hang' reprodukuje zamrzlý ESP32
  speed: 20,         // zrychlení časovačů
  floor: 100,        // ms — dolní strop, aby 1s tik nespadl na 5 ms a nesaturoval CPU
  minScaled: 1000,   // škáluj jen delay >= 1 s (kratší jsou animační/debounce)
  headless: true,    // leak test může běžet headless, FPS nás nezajímá
  offline: true,
  gcEachSample: true,
  snapshots: true,
  trace: false,
});

const report = await runSession(args);

// ── verdikt ──
const m = report.memory, n = report.network;
const checks = [
  { name: 'heap slope', value: m.heapSlopeMBPerMin, unit: 'MB/min', limit: 0.3, r2: m.heapSlopeR2 },
  { name: 'DOM nodes slope', value: m.nodesSlopePerMin, unit: 'nodes/min', limit: 20, r2: m.nodesSlopeR2 },
  { name: 'listeners slope', value: m.listenersSlopePerMin, unit: 'listeners/min', limit: 5 },
  { name: 'pending requests slope', value: n.pendingSlopePerMin, unit: 'req/min', limit: 1 },
  { name: 'pending requests end', value: n.pendingEnd, unit: 'req', limit: 24 },
  { name: 'documents', value: m.documentsEnd, unit: '', limit: 4 },
];
report.leakVerdict = checks.map((c) => ({
  ...c, fail: c.value > c.limit && (c.r2 === undefined || c.r2 > 0.6),
}));
const failed = report.leakVerdict.filter((c) => c.fail);

const file = saveReport(report, { label: args.label, route: args.route });
console.log('\n── LEAK VERDICT ──');
for (const c of report.leakVerdict) {
  console.log(`  ${c.fail ? 'FAIL' : 'ok  '}  ${c.name.padEnd(24)} ${String(c.value).padStart(10)} ${c.unit} (limit ${c.limit}${c.r2 !== undefined ? `, R²=${c.r2}` : ''})`);
}
console.log(`\n  časovače zrychleny: ${JSON.stringify(report.timerMap)}`);
console.log(`  ekvivalent: ${args.minutes} min × faktor viz timerMap výše`);
console.log(`\n[leak] ${failed.length ? 'PODEZŘENÍ NA LEAK' : 'bez leaku'} → ${path.relative(ROOT, file)}`);
process.exitCode = failed.length ? 1 : 0;
```

### `scripts/robot-duty.mjs`

```js
#!/usr/bin/env node
// Změří duty cycle DailyRobota: jak často je namountovaný a jak dlouho se
// reálně hýbe. Přímé ověření nálezu "perioda 21 s místo 60 s".
// npm run bench:robot -- --route /spsmotol --minutes 3
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, parseArgs, launch, openPage, startServer, buildApp, gitInfo, DEFAULT_CPU_RATE } from './lib/harness.mjs';

const args = parseArgs(process.argv.slice(2), {
  route: '/spsmotol', minutes: 3, cpu: DEFAULT_CPU_RATE, label: 'robot',
  build: true, outDir: 'dist-bench', headless: true, offline: true, tick: 100,
});

const build = args.build === false ? { outDir: args.outDir } : buildApp({ outDir: args.outDir, mock: true });
const server = await startServer({ distDir: path.join(ROOT, build.outDir), meteo: 'ok' });
const browser = await launch({ cpuRate: args.cpu, headless: args.headless, offline: args.offline });
const { page } = await openPage(browser, {
  url: server.url, route: args.route, cpuRate: args.cpu, speed: 1, floorMs: 250, minScaledMs: 1000,
});

await page.evaluate((tick) => {
  const S = { samples: 0, mounted: 0, moving: 0, cycles: 0, gaps: [], shows: [] };
  window.__robot = S;
  let prevX = null, prevMounted = false, tMark = performance.now();
  setInterval(() => {
    const els = document.querySelectorAll('.robot-animation');
    const el = els[els.length - 1];
    const mounted = !!el;
    S.samples++;
    if (mounted) {
      S.mounted++;
      const x = Math.round(el.getBoundingClientRect().left);
      if (prevX !== null && Math.abs(x - prevX) > 1) S.moving++;
      prevX = x;
    } else prevX = null;
    if (mounted !== prevMounted) {
      const now = performance.now();
      (mounted ? S.gaps : S.shows).push(Math.round(now - tMark));
      tMark = now;
      if (mounted) S.cycles++;
      prevMounted = mounted;
    }
  }, tick);
}, args.tick);

console.log(`[robot] ${server.url}${args.route} | ${args.minutes} min | vzorek ${args.tick} ms`);
await new Promise((r) => setTimeout(r, args.minutes * 60000));
const S = await page.evaluate(() => window.__robot);
await browser.close();
await server.close();

const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
const out = {
  schema: 'odjezdy-robot/1', label: args.label, createdAt: new Date().toISOString(), git: gitInfo(),
  config: { route: args.route, minutes: args.minutes, cpuThrottle: args.cpu, tickMs: args.tick },
  cycles: S.cycles,
  cyclesPerMin: +(S.cycles / args.minutes).toFixed(2),
  mountedPct: +(100 * S.mounted / S.samples).toFixed(1),
  movingPct: +(100 * S.moving / S.samples).toFixed(1),
  avgShowMs: avg(S.shows), avgGapMs: avg(S.gaps),
  periodMs: S.shows.length && S.gaps.length ? avg(S.shows) + avg(S.gaps) : null,
};
fs.mkdirSync(path.join(ROOT, 'bench', 'results'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'bench', `robot-${args.label}.json`), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.log('\n  cíl po opravě DailyRobot.tsx:243 → periodMs ≈ 60000, mountedPct ≈ 32, movingPct ≈ 18');
```

### `scripts/calibrate.mjs`

```js
#!/usr/bin/env node
// Kalibrace násobku Emulation.setCPUThrottlingRate proti reálnému Pi.
//
// POSTUP:
//   1) npm run bench:calibrate            → změří Mac při rate 1..12 a vygeneruje bench/cpu-probe.html
//   2) zkopíruj bench/cpu-probe.html na Pi a otevři ho v tamním Chromiu
//      (scp bench/cpu-probe.html pi@tabule:/tmp/ ; chromium-browser file:///tmp/cpu-probe.html)
//   3) npm run bench:calibrate -- --pi-ms 1840   → vypíše, jaký rate na Macu odpovídá Pi
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseArgs, launch, envInfo } from './lib/harness.mjs';
import { WORKLOAD_SRC } from './lib/workload.mjs';

const args = parseArgs(process.argv.slice(2), { rates: '1,2,3,4,6,8,10,12', repeats: 5, 'pi-ms': 0 });

const html = `<!doctype html><meta charset="utf-8"><title>odjezdy CPU probe</title>
<body style="font:16px system-ui;padding:24px">
<h1>CPU probe</h1><pre id="out">běží…</pre>
<script>${WORKLOAD_SRC}
const runs = [];
benchWorkload(); // warmup (JIT)
for (let i = 0; i < 5; i++) runs.push(benchWorkload().ms);
runs.sort((a,b)=>a-b);
document.getElementById('out').textContent =
  'median: ' + runs[2] + ' ms\\nvšechny běhy: ' + runs.join(', ') + '\\nUA: ' + navigator.userAgent;
</script></body>`;

fs.mkdirSync(path.join(ROOT, 'bench'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'bench', 'cpu-probe.html'), html);

const rates = String(args.rates).split(',').map(Number);
const browser = await launch({ cpuRate: 1, headless: true, offline: true });
const page = (await browser.pages())[0];
const client = await page.createCDPSession();
await page.goto('about:blank');
await page.evaluate(WORKLOAD_SRC + '\nwindow.benchWorkload = benchWorkload;');

const results = {};
for (const rate of rates) {
  await client.send('Emulation.setCPUThrottlingRate', { rate });
  const runs = [];
  for (let i = 0; i < args.repeats; i++) runs.push(await page.evaluate(() => window.benchWorkload().ms));
  runs.sort((a, b) => a - b);
  results[rate] = runs[Math.floor(runs.length / 2)];
  console.log(`  rate ${String(rate).padStart(2)}x → ${String(results[rate]).padStart(6)} ms (median z ${args.repeats})`);
}
await browser.close();

const out = { createdAt: new Date().toISOString(), env: envInfo(), medianMsByRate: results };
if (args['pi-ms']) {
  const pi = Number(args['pi-ms']);
  const entries = Object.entries(results).map(([r, ms]) => [Number(r), ms]);
  let best = entries[0];
  for (const e of entries) if (Math.abs(e[1] - pi) < Math.abs(best[1] - pi)) best = e;
  out.piMs = pi;
  out.recommendedRate = best[0];
  out.ratioVsRate1 = +(pi / results[1]).toFixed(2);
  console.log(`\n  Pi: ${pi} ms | Mac@1x: ${results[1]} ms → Pi je ${out.ratioVsRate1}× pomalejší`);
  console.log(`  ► používej --cpu ${best[0]}  (nejbližší změřený rate: ${best[1]} ms)`);
} else {
  console.log('\n  Teď spusť bench/cpu-probe.html na Pi a zavolej:');
  console.log('  npm run bench:calibrate -- --pi-ms <median z Pi>');
}
fs.writeFileSync(path.join(ROOT, 'bench', 'cpu-calibration.json'), JSON.stringify(out, null, 2));
console.log(`\n[calibrate] → bench/cpu-calibration.json + bench/cpu-probe.html`);
```

### `scripts/baseline.mjs`

```js
#!/usr/bin/env node
// Vytvoří srovnávací základnu: proběhne definovanou sadu scénářů a výsledky
// zkopíruje do bench/baseline/. Tohle se pouští JAKO PRVNÍ, PŘED optimalizacemi,
// na čistém stromu (git stash) a commitne se do repa.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseArgs, gitInfo, DEFAULT_CPU_RATE } from './lib/harness.mjs';

const args = parseArgs(process.argv.slice(2), { cpu: DEFAULT_CPU_RATE, minutes: 3, quick: false });

const SCENARIOS = [
  // FPS/CPU profil hlavních tabulí — headful, bez zrychlení času
  { id: 'spsmotol',        script: 'bench', a: ['--route', '/spsmotol',   '--minutes', args.minutes, '--cpu', args.cpu] },
  { id: 'spsmoravska',     script: 'bench', a: ['--route', '/spsmoravska','--minutes', args.minutes, '--cpu', args.cpu] },
  { id: 'bikefest',        script: 'bench', a: ['--route', '/bikefest',   '--minutes', args.minutes, '--cpu', args.cpu] },
  // start tabule po rebootu (studený cache, offline CDN) — krátce, jde o startup blok
  { id: 'startup-spsmotol',script: 'bench', a: ['--route', '/spsmotol',   '--minutes', 1, '--cpu', args.cpu, '--warmup', 2] },
  // stabilita: zrychlené časovače
  { id: 'leak-ok',         script: 'leak',  a: ['--route', '/spsmotol',   '--minutes', args.quick ? 5 : 20, '--meteo', 'ok'] },
  // stabilita: zamrzlý ESP32 (TCP se spojí, odpověď nikdy nepřijde)
  { id: 'leak-meteo-hang', script: 'leak',  a: ['--route', '/spsmotol',   '--minutes', args.quick ? 5 : 20, '--meteo', 'hang'] },
];

const outDir = path.join(ROOT, 'bench', 'baseline');
fs.mkdirSync(outDir, { recursive: true });
const git = gitInfo();
if (git.dirty) console.log('[!] pracovní strom je špinavý — baseline by měla vznikat na čistém stromu (git stash).');

const summary = [];
for (const s of SCENARIOS) {
  console.log(`\n════ ${s.id} ════`);
  const r = spawnSync('node', [`scripts/${s.script}.mjs`, ...s.a.map(String), '--label', s.id], { cwd: ROOT, stdio: 'inherit' });
  const latest = path.join(ROOT, 'bench', 'latest.json');
  if (!fs.existsSync(latest)) { console.log(`  [!] ${s.id} nedoběhl`); continue; }
  fs.copyFileSync(latest, path.join(outDir, `${s.id}.json`));
  const rep = JSON.parse(fs.readFileSync(latest, 'utf8'));
  summary.push({ id: s.id, fps: rep.runtime.fps.mean, dropped: rep.runtime.fps.droppedFramePct, cpuMsPerSec: rep.runtime.cpu.taskMsPerSec, heapSlope: rep.memory.heapSlopeMBPerMin, pending: rep.network.pendingEnd, exit: r.status });
}
fs.writeFileSync(path.join(outDir, '_index.json'), JSON.stringify({ createdAt: new Date().toISOString(), git, cpu: args.cpu, summary }, null, 2));
console.table(summary);
console.log(`\n[baseline] → bench/baseline/ (commitni to: git add bench/baseline && git commit -m "bench: baseline @ ${git.sha}")`);
```

### `scripts/compare.mjs`

```js
#!/usr/bin/env node
// Porovnání dvou reportů. npm run bench:compare -- bench/baseline/spsmotol.json bench/latest.json
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/harness.mjs';

const [aPath, bPath = 'bench/latest.json'] = process.argv.slice(2);
if (!aPath) { console.error('usage: compare.mjs <baseline.json> [current.json]'); process.exit(1); }
const A = JSON.parse(fs.readFileSync(path.resolve(ROOT, aPath), 'utf8'));
const B = JSON.parse(fs.readFileSync(path.resolve(ROOT, bPath), 'utf8'));

// 'lower' = nižší je lepší
const METRICS = [
  ['runtime.fps.mean', 'FPS (mean)', 'higher', 1],
  ['runtime.fps.droppedFramePct', 'dropped frames %', 'lower', 0.1],
  ['runtime.fps.frameMsP95', 'frame p95 [ms]', 'lower', 1],
  ['runtime.longTasks.perMin', 'long tasks /min', 'lower', 0.5],
  ['runtime.longTasks.msPerMin', 'long tasks ms/min', 'lower', 10],
  ['runtime.cpu.taskMsPerSec', 'CPU ms/s (total)', 'lower', 1],
  ['runtime.cpu.scriptMsPerSec', 'CPU ms/s (script)', 'lower', 1],
  ['runtime.cpu.styleMsPerSec', 'CPU ms/s (style)', 'lower', 0.5],
  ['runtime.counts.recalcStylesPerSec', 'recalc style /s', 'lower', 0.5],
  ['runtime.counts.layoutsPerSec', 'layout /s', 'lower', 0.5],
  ['startup.loadMs', 'load [ms]', 'lower', 20],
  ['startup.fcpMs', 'FCP [ms]', 'lower', 20],
  ['startup.jsTransferBytes', 'JS staženo [B]', 'lower', 1024],
  ['memory.heapEndMB', 'heap konec [MB]', 'lower', 0.2],
  ['memory.heapSlopeMBPerMin', 'heap slope [MB/min]', 'lower', 0.05],
  ['memory.nodesEnd', 'DOM nodes konec', 'lower', 20],
  ['memory.nodesSlopePerMin', 'nodes slope /min', 'lower', 2],
  ['memory.listenersEnd', 'listeners konec', 'lower', 5],
  ['network.perMin', 'requests /min', 'lower', 5],
  ['network.pendingEnd', 'pending requests', 'lower', 1],
];

const get = (o, p) => p.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
const fmt = (v) => (v === null || v === undefined ? '—' : typeof v === 'number' ? (Math.abs(v) >= 1000 ? v.toFixed(0) : v.toFixed(2)) : String(v));

console.log(`\nA (baseline): ${A.label} @ ${A.git.sha} ${A.git.dirty ? '(dirty)' : ''}  ${A.createdAt}`);
console.log(`B (current) : ${B.label} @ ${B.git.sha} ${B.git.dirty ? '(dirty)' : ''}  ${B.createdAt}`);
if (JSON.stringify(A.config) !== JSON.stringify(B.config)) {
  console.log('\n[!] POZOR: konfigurace se liší, čísla nejsou přímo srovnatelná:');
  for (const k of new Set([...Object.keys(A.config), ...Object.keys(B.config)]))
    if (JSON.stringify(A.config[k]) !== JSON.stringify(B.config[k])) console.log(`    ${k}: ${A.config[k]} → ${B.config[k]}`);
}
console.log('\n' + 'metrika'.padEnd(24) + 'baseline'.padStart(12) + 'current'.padStart(12) + 'delta'.padStart(12) + '   verdikt');
console.log('-'.repeat(72));
let better = 0, worse = 0;
for (const [p, name, dir, noise] of METRICS) {
  const a = get(A, p), b = get(B, p);
  if (a === undefined || b === undefined || a === null || b === null) continue;
  const d = b - a;
  const pctv = a ? (100 * d) / Math.abs(a) : 0;
  let verdict = '=';
  if (Math.abs(d) > noise) {
    const good = dir === 'lower' ? d < 0 : d > 0;
    verdict = good ? '▲ lepší' : '▼ HORŠÍ';
    good ? better++ : worse++;
  }
  console.log(name.padEnd(24) + fmt(a).padStart(12) + fmt(b).padStart(12) + `${d > 0 ? '+' : ''}${fmt(d)} (${pctv > 0 ? '+' : ''}${pctv.toFixed(1)}%)`.padStart(20) + '   ' + verdict);
}
console.log('-'.repeat(72));
console.log(`  ${better} metrik lepších, ${worse} horších (mimo šumový práh)\n`);
process.exitCode = worse > better ? 1 : 0;
```

---

## 3. CPU throttling — proč a jak zkalibrovat

`Emulation.setCPUThrottlingRate` **není** simulace ARM. Chromium jen periodicky uspává renderer main thread tak, aby JS trvalo `rate`× déle. Na tomto Macu je linearita ověřená (`npm run bench:calibrate`, medián z 5 běhů deterministické zátěže z `scripts/lib/workload.mjs`):

| rate | 1 | 2 | 3 | 4 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|
| ms | 50 | 102 | 152 | 203 | **301** | 403 | 511 | 604 |

→ `ms ≈ 50 × rate`, takže **doporučený rate = (medián na Pi v ms) / 50**.

**Kalibrace (3 kroky, jednou):**
1. `npm run bench:calibrate` — vygeneruje `bench/cpu-probe.html`.
2. `scp bench/cpu-probe.html pi@tabule:/tmp/` a na Pi v **tamním Chromiu** (ne přes VNC v jiném prohlížeči) otevřít `file:///tmp/cpu-probe.html`, opsat medián.
3. `npm run bench:calibrate -- --pi-ms 1840` → vypíše `► používej --cpu 12` a uloží `bench/cpu-calibration.json`.

**Default `--cpu 6` je záměrně konzervativní** (Mac ≈ 300 ms). Pi 4 (Cortex‑A72 @1,5 GHz) skončí realisticky někde na 1000–2000 ms, tj. rate 20–40; Pi 3 / Zero 2W ještě víc. Než proběhne kalibrace, ber absolutní FPS jako **optimistický horní odhad** a porovnávej výhradně relativně (baseline vs. po opravě při stejném rate).

**Co throttling zkresluje (a co proto z Macu nevyčteš):**
- škrtí **jen main thread**, ne GPU raster, ne compositor thread, ne síť, ne paměťovou propustnost;
- animace běžící čistě na compositoru (opacity/transform bez main‑thread práce) throttling **necítí** → FPS Snowfallu a robota bude na Macu vždy hezčí než na Pi;
- při vysokém rate se prodlužují long tasky lineárně, takže `longTasks.msPerMin` je použitelná relativní metrika, ale absolutně nadhodnocená vůči tomu, co udělá jiná mikroarchitektura (A72 má výrazně horší IPC i cache, poměr není konstantní napříč typy práce — proto ta kalibrační zátěž míchá aritmetiku, alokace, string formátování i style/layout).

**Nutná disciplína měření na Macu:** notebook v síti, **připojený do napájení**, bez Low Power Mode, zavřené ostatní appky, během běhu nesahat na klávesnici ani nepřepínat plochy. FPS se měří **jen headful** — ověřeno: headless dává tvrdý strop `refreshMs 33` (30 fps), headful `refreshMs 17` (60 fps). Report proto ukládá `runtime.fps.refreshMs` — reporty s různým `refreshMs` nejsou srovnatelné (pozor při ProMotion 120 Hz displeji).

---

## 4. Reálná naměřená data z tohohle Macu (commit `9023f6b`, dirty)

`npm run bench -- --route /spsmotol --minutes 1 --cpu 6 --warmup 15` (headful, 1920×1080, mock data, offline CDN):

```
fps.mean 60.0 | frameMsP95 17 | droppedFramePct 0.03 | longTasks 0
cpu.taskMsPerSec 64.6 | scriptMsPerSec 16.3 | styleMsPerSec 8.4 | layoutMsPerSec 1.7
counts.recalcStylesPerSec 37.2 | layoutsPerSec 1.7
startup: loadMs 221, FCP 392, LCP 592, JS 570 kB v 8 souborech
memory: heapEnd 4.27 MB, nodesEnd 821
network: 503 req/min (z toho ~360/min meteo)
console: pageerror "firebase is not defined" (gstatic nedostupné) — tj. mobilní stack se na tabuli
         opravdu spouští a při výpadku sítě hází chybu; potvrzuje nález o main.tsx:7
```

`npm run bench:robot -- --minutes 2` — **přímý důkaz nálezu DailyRobot.tsx:243**:

```
cycles 6 za 2 min (3/min)   periodMs 21053   avgShowMs 19013   avgGapMs 2040
mountedPct 89.9 %           movingPct 52.8 %
```

Čekáno po opravě: `periodMs ≈ 60000`, `mountedPct ≈ 32`, `movingPct ≈ 18`.

`npm run leak -- --minutes 1.5 --meteo hang` vs. `--meteo ok` (speed 20, GC před každým vzorkem) — **reprodukce zatuhnutí**:

| metrika | `meteo=ok` | `meteo=hang` |
|---|---|---|
| heap slope | +0,29 MB/min (R² 0,77) | **+0,48 MB/min (R² 0,98)** |
| DOM nodes slope | −4,5/min (R² 0,05) | **+2444/min (R² 0,98)** |
| listeners slope | +1,2/min | **+88,5/min** |
| pending requests na konci | 12 | **1350** |
| verdikt | bez leaku | **PODEZŘENÍ NA LEAK (4 checky FAIL)** |

To je přesně mechanismus z nálezu `useMeteoStation.ts:279` (chybí `AbortController`/timeout/in‑flight guard) a je **reprodukovatelný na Macu za 90 sekund**.

---

## 5. Baseline — udělej JAKO PRVNÍ

```bash
git stash -u                      # baseline musí vzniknout na čistém stromu…
git stash pop -- src/utils/pidApi.ts 2>/dev/null || true   # …kromě mock fixu, bez něj bench nemá data
npm run bench:calibrate           # a rovnou zkalibruj proti Pi (§3)
npm run bench:baseline -- --cpu 6 --minutes 3
git add -f bench/baseline && git commit -m "bench: baseline @ $(git rev-parse --short HEAD)"
```

`bench:baseline` proběhne 6 scénářů (~35 min s 20min leaky, s `--quick` ~15 min) a uloží je do `bench/baseline/{spsmotol,spsmoravska,bikefest,startup-spsmotol,leak-ok,leak-meteo-hang}.json` + `_index.json` se souhrnnou tabulkou.

**Formát reportu** (`schema: "odjezdy-bench/1"`) je navržený tak, aby byl porovnatelný napříč commity — každý report nese `git.{branch,sha,subject,dirty}`, `env.{cpu,cores,node,platform}` a **celý `config`** (route, minutes, cpuThrottle, sample, warmup, meteo, timerSpeed, headless, viewport). `compare.mjs` konfigurace diffne a když se liší, explicitně varuje, že čísla nejsou srovnatelná. Sekce: `build`, `startup`, `runtime.{fps,longTasks,cpu,counts}`, `memory`, `network`, `console`, `timerMap`, `samples[]` (surová časová řada pro vlastní grafy).

**Šumové dno si změř:** spusť `npm run bench -- --label noise1` a `--label noise2` na tomtéž commitu a porovnej je. Rozdíl, který ti vyjde, je hranice, pod kterou nesmíš interpretovat žádné zlepšení. Prahy v `compare.mjs` (`METRICS[i][3]`) si podle toho případně zvedni.

**Workflow na každou optimalizaci:**

```bash
git checkout -b perf/robot-deps
# … oprava …
npm run bench -- --route /spsmotol --minutes 3 --cpu 6 --label robot-fix
npm run bench:compare -- bench/baseline/spsmotol.json bench/latest.json
npm run bench:robot -- --minutes 3          # u robota navíc duty cycle
```

`compare.mjs` končí exit code 1, když je víc metrik horších než lepších — dá se pověsit na CI.

---

## 6. Leak test: jak z 24 hodin udělat 20 minut

`scripts/lib/probe.mjs` přepíše `setInterval`/`setTimeout` **před spuštěním aplikace** (`page.evaluateOnNewDocument`, tj. dřív než React) a vydělí delay faktorem `--speed`:

- škáluje **jen delaye ≥ `--minScaled` (1000 ms)** — kratší (framer‑motion tweeny, debounce, transition) zůstávají, jinak by se rozbila animační logika a měřil bys jinou aplikaci;
- **floor `--floor` (100 ms)** — bez něj by 1s tik DataContextu spadl na 5 ms a saturoval main thread; pak už neměříš leak, ale DoS.

Reálná mapa z běhu (uloženo v reportu jako `timerMap`, takže je vždy dohledatelné, co se zrychlilo a jak):

```
1000→100 (10×)  2000→100 (20×, meteo poll)  4000→200  15000→750  16000→800
19000→950  30000→1500 (notifikační poller)  60000→3000 (robot, refresh dat)  600000→30000
```

Efektivní zrychlení je tedy **10–20×** podle časovače → **20 minut běhu ≈ 3,5–6,5 hodiny provozu** v počtu iterací. Pro plnou 24h ekvivalenci pusť `--minutes 60 --speed 20` přes noc (`caffeinate -i npm run leak -- --minutes 60`).

**Co to zkresluje (nutno přiznat v každém závěru):**
1. **Časovače ≠ čas.** Zrychlí se počet iterací, ne stárnutí Chromia: fragmentace haldy, růst V8 code cache, akumulace v GPU procesu ani `chrome://net-internals` cache se takhle nezrychlí.
2. **Nerovnoměrné zrychlení.** 2s poll jede 20×, 60s robot taky 20×, ale 1s tik jen 10× (naráží na floor) → poměr zátěže mezi komponentami se posune. Proto se leak posuzuje podle **monotónnosti (R²)**, ne podle absolutních čísel.
3. **Souběh se mění.** Rychlejší poll znamená větší šanci na překryv dávek než reálně — což je zrovna u meteo hooku *žádoucí* (dřív odhalí chybějící in‑flight guard), ale nadhodnocuje pravděpodobnost.
4. **GC před každým vzorkem** (`gcEachSample: true`) — měříš retained heap, ne pilu. Pro odhad tlaku na GC musíš pustit i variantu s `--gcEachSample false`.
5. **Mock data.** `VITE_USE_MOCK_DATA=true` znamená konstantní odjezdy — reálná data z Golemia se mění a generují jiné React diffy. Skutečné množství DOM mutací je v provozu vyšší.
6. **Mac má 16+ GB RAM a swap.** Pi 4 s 1–2 GB spadne na OOM při růstu, který na Macu jen tiše vyroste. Absolutní hranici „kdy zatuhne“ z Macu nezjistíš — zjistíš jen **jestli růst je monotónní** (R² > 0,6), což stačí k rozhodnutí, že je co opravovat.

Prahy verdiktu (`scripts/leak.mjs:31-38`): heap > 0,3 MB/min, DOM nodes > 20/min, listeners > 5/min, pending requests > 24 na konci nebo > 1/min. `--snapshots` (default zapnuto) ukládá `bench/snapshots/<label>-{start,end}.heapsnapshot`, které se dají otevřít v Chrome DevTools → Memory → Load a udělat Comparison view; pozor, mají 7–11 MB kus, proto jsou v `.gitignore`.

Scénáře meteostanice: `--meteo ok` (normální ESP), `slow` (1,5 s latence), `hang` (**TCP se spojí, odpověď nepřijde nikdy** — přesně ten stav, kdy circuit breaker na `useMeteoStation.ts:264-272` nefunguje), `down` (RST → breaker se spustí, pojistka se ověří).

---

## 7. Který nález čím ověřit

| nález | příkaz | metrika, která se musí hnout |
|---|---|---|
| `DailyRobot.tsx:243` deps | `npm run bench:robot -- --minutes 3` | `periodMs` 21053 → ~60000, `movingPct` 52,8 → ~18 |
| totéž, dopad na FPS | `npm run bench -- --minutes 3 --cpu 6` | `cpu.taskMsPerSec`, `counts.recalcStylesPerSec`, `fps.droppedFramePct` |
| `DataContext.tsx:439/506` + `TramDeparturesConnected.tsx:37` | `npm run bench -- --route /spsmotol --minutes 3 --cpu 12` | `counts.recalcStylesPerSec` (baseline 37,2/s), `cpu.scriptMsPerSec` (16,3) |
| `useMeteoStation.ts:279` (hang) | `npm run leak -- --minutes 5 --meteo hang` | `network.pendingEnd` 1350 → ≤ 24, všechny 4 FAIL checky → ok |
| `useMeteoStation.ts:86` (POLL 2 s → 15 s) | `npm run bench -- --minutes 2` | `network.perMin` 503 → ~60 |
| `main.tsx:7` mobilní stack | `npm run bench -- --minutes 1 --warmup 2 --label startup` | `startup.jsTransferBytes` 570 kB → očekávaných ~375 kB, `jsFilesLoaded`, zmizí pageerror „firebase is not defined“, `network.byHost` bez supabase/gstatic |
| `index.html:50,56-57` blokující CDN | totéž + `--offline` (default) | `startup.fcpMs` (392), `startup.loadMs` (221) |
| `index.css:131` promotion `img` | `npm run bench -- --minutes 3 --cpu 12` | `cpu.layoutMsPerSec`, `fps.frameMsP95`; **pravda o fill‑rate je až na Pi** |
| Snowfall (`Snowfall.tsx:6`) | zimu vynutit posunem systémového data Macu na 15. 12. a pak `npm run bench` | `fps.mean`, `frameMsP95`; **hlavní dopad je GPU → měř na Pi** |

---

## 8. Co se na Macu změřit NEDÁ — ověřit až na Pi

1. **GPU fill‑rate a compositing na 55" panelu.** Apple GPU s unified memory má proti VideoCore VI řádově jinou propustnost. Sem patří **celý nález o Snowfallu** (fullscreen clear+blend), promotion `<img>` na kompozitní vrstvy (`index.css:131`), `shadow-lg` + gradient pruh robota a `filter: brightness(0) invert(1)` na `TramDeparturesConnected.tsx:527`. Puppeteer měří rAF cadence, ale na Macu tyhle vrstvy nic nestojí. → Na Pi: `chromium --show-composited-layer-borders`, `chrome://gpu`, a `vcgencmd` sledování.
2. **Skutečné rozlišení výstupu.** Jestli tabule žene 1080p, nebo 4K (a jestli Chromium škáluje). To rozhoduje, jestli Snowfall maže 2,07 Mpx nebo 8,3 Mpx. → `xrandr` / `fbset` na Pi.
3. **Teplotní a napěťový throttling.** Pi 4 v uzavřené krabici u vchodu podtaktuje po desítkách minut; to je pravděpodobný přispěvatel k „po delším běhu je to trhané“, a na Macu neexistuje. → `vcgencmd measure_temp`, `vcgencmd get_throttled` (bit 0x4/0x8) logovat každou minutu po celý den.
4. **Skutečné vyčerpání RAM a OOM killer.** Mac má swap a 16+ GB; Pi s 1–2 GB a `zram` se chová jinak. Absolutní hranice „kdy tab zamrzne“ je jen na Pi. → `free -m`, `dmesg | grep -i oom`, `/proc/<chromium>/status`.
5. **SD karta.** I/O latence, opotřebení, přeplněný `~/.cache/chromium`, logy do `/var/log` na plné kartě. Chromium při zaplněném disku začne blokovat na cache zápisech — to vypadá přesně jako „zatuhlo“. → `iostat -x`, `df -h`, `smartctl` ekvivalent není, ale `dmesg | grep mmc` ukáže I/O chyby.
6. **Chování Chromia v kiosk módu 24/7.** Renderer crash + auto‑restart, `--disable-gpu` fallback po chybě ovladače, X11/Wayland compositor leak, screensaver/DPMS. Puppeteer spouští čerstvý profil na každý běh.
7. **Reálná síť školy.** DNS timeouty na golemio/weatherapi/gstatic, captive portál, MTU. `--host-resolver-rules` simuluje jen „hostitel neexistuje okamžitě“, ne pomalý timeout 30 s, který je pro startup mnohem horší.
8. **Reálná meteostanice na 10.0.10.208.** Jestli ESP32 opravdu umí zamrznout bez RST (základní předpoklad nálezu), se ověří jen připojením na LAN a sledováním `pending` v DevTools na Pi.

**Doporučený mini‑harness na Pi** (mimo tento repo): `chromium --remote-debugging-port=9222` + `npm run bench` s ručně přepsaným `url`/`--build false`, nebo jednodušeji `bench/cpu-probe.html` (kalibrace) + logovací cron `vcgencmd get_throttled; free -m; date` do souboru po dobu 24 h a porovnání s okamžikem, kdy tabule vizuálně zatuhne.
---

## 9. Ověřené A/B měření (9. 9. 2026)

**Metodická poznámka, která platí pro každé další měření.** První kolo oprav
jsem porovnával proti baseline změřenému o půl hodiny dřív. To je špatně:
při kontrolním přeměření dal **stejný commit 65,5 ms/s tam, kde předtím dal
29,9**. Absolutní hodnoty na MacBooku driftují se stavem stroje (teplota,
ostatní procesy, stav cache) klidně dvojnásobně. Srovnávat lze jen běhy
**proložené v jedné relaci**.

Správně změřeno: `ca791fe` (jen harness, žádné opravy) a `17822d5` (po obou
kolech), střídavě A-B-A-B, `--route /spsmotol --minutes 2 --cpu 6`:

| metrika | před | po | rozdíl |
|---|---:|---:|---:|
| CPU celkem (ms/s) | 148,4 | **70,2** | −53 % |
| z toho JS (ms/s) | 33,1 | **17,9** | −46 % |
| z toho styly (ms/s) | 25,9 | **9,9** | −62 % |
| z toho layout (ms/s) | 2,8 | **2,2** | −21 % |
| přepočtů stylů / s | 37,0 | **12,3** | −67 % |
| požadavků / min | 439,5 | **83,2** | −81 % |
| JS při startu (kB) | 570 | **390** | −32 % |

Rozptyl uvnitř každé větve byl pod 5 % (148,0 / 148,8 a 72,1 / 68,3), takže
rozdíl je skutečný, ne šum. Absolutní čísla ale pořád platí jen pro tenhle
MacBook při tomhle nastavení — na Pi budou řádově jiná.

**Co z toho neplyne.** Registr aktivních zastávek (21 → 4 stahované zastávky)
se v tomhle měření na počtu requestů neprojeví, protože bench běží
s `VITE_USE_MOCK_DATA` a odjezdy nejdou po síti. Úspora 439,5 → 83,2 req/min
je meteostanice. Zisk z registru se projeví až v provozu proti Golemiu.

**Než začneš měřit vlastní optimalizaci:** pusť `npm run bench` dvakrát za
sebou na tomtéž commitu. Rozdíl, který ti vyjde, je hranice, pod kterou
nesmíš interpretovat žádné zlepšení.

## 10. Kumulativní výsledek (proložené A/B, `ca791fe` → `HEAD`)

`--route /spsmotol --minutes 2 --cpu 6`, střídavě A-B-A-B v jedné relaci,
medián ze dvou běhů na větev:

| metrika | původní | nyní | změna |
|---|---:|---:|---:|
| CPU celkem (ms/s) | 129,1 | **45,2** | −65 % |
| z toho JS (ms/s) | 27,9 | **11,1** | −60 % |
| z toho styly (ms/s) | 20,7 | **3,8** | −82 % |
| přepočtů stylů / s | 37,0 | **12,8** | −66 % |
| JS při startu (kB) | 570 | **277** | −51 % |
| FCP (ms) | 446 | **298** | −33 % |
| LCP (ms) | 748 | **566** | −24 % |
| load (ms) | 275 | **136** | −51 % |
| požadavků / min | 439,5 | **81,9** | −81 % |

## 11. Co ještě zbývá

Změřený strop: s vypnutým robotem, animacemi i sněžením (`--settings
motion=off,showRobot=false,snowfall=off`) padne CPU na ~37 ms/s. To je
podlaha, kterou dělá React, data a meteopanel. Robot po přepisu na CSS
stojí ~9 ms/s místo původních 24.

Nezpracované, seřazeno podle odhadovaného přínosu:

1. **Pořád 12,8 přepočtů stylů za sekundu**, i když je robot levný. Zbývá
   dohledat, co je spouští — kandidáti jsou opacity přechody pruhu s textem
   a vteřinová změna textu hodin.
2. **Obrázky.** Hlavička je 288 kB PNG (784×736), robot 171–249 kB každý,
   favicon 156 kB v rozlišení 489×510 px. Na Macu se to neprojeví, na Pi to
   je paměť a GPU textury. Převést na WebP a zmenšit na skutečně zobrazované
   rozměry.
3. **Snowfall chunk (46 kB)** se stahuje celý rok, i když sněžení běží
   41 dní. Načítat přes dynamický import.
4. **`setExtras` uvnitř `setData` updateru** (`useMeteoStation.ts`) — vedlejší
   efekt v reduceru, každý poll dělá dvojí render.
5. **Globální `*` pravidla s `!important`** v `index.css` — teď už jen dvě,
   ale pořád platí na každý element.

Mimo frontend, ale s větším dopadem než cokoli výše: **proxovat Golemio
a meteostanici přes školní server**. Dvě tabule by sdílely jednu cache, klíč
k API by zmizel z klientského bundlu a Pi by místo desítek requestů za
minutu stahovalo jeden hotový JSON.
