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
