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

// Násobek CPU throttlingu: viz README v odpovědi. Default 6 = hrubý poměr
// single-core výkonu Apple Silicon vs. Cortex-A72 @1,5 GHz. ZKALIBRUJ přes
// `npm run bench:calibrate`, jinak jsou absolutní čísla jen orientační.
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
