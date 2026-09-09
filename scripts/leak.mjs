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
