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
