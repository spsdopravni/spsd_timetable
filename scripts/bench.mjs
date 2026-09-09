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
  settings: '',
});

// --settings motion=off,showRobot=false — předvyplní nastavení tabule,
// aby šla změřit cena jednotlivých funkcí (robot, sněžení, animace).
if (typeof args.settings === 'string') {
  args.settings = Object.fromEntries(args.settings.split(',').filter(Boolean).map(pair => {
    const [k, v] = pair.split('=');
    return [k, v === 'true' ? true : v === 'false' ? false : /^\d+$/.test(v) ? Number(v) : v];
  }));
}

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
