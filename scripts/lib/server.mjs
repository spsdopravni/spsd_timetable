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
