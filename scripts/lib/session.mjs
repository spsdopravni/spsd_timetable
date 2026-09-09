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
    settings: args.settings,
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
