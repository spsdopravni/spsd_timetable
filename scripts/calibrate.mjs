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
