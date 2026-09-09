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
