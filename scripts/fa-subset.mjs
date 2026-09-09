#!/usr/bin/env node
/**
 * Vygeneruje podmnožinu Font Awesome jen z ikon, které jsou v src/ opravdu
 * použité.
 *
 * Plný all.min.css má 74 kB a definuje tisíce `.fa-*::before` pravidel;
 * tabule jich používá pár desítek. Načítá se to při každém startu a sedí
 * to v paměti prohlížeče celý den.
 *
 * Spouští se z npm scriptu `prebuild`, takže se subset nemůže rozejít
 * s reálným použitím ikon v kódu.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FA = path.join(ROOT, 'node_modules/@fortawesome/fontawesome-free');
const OUT_CSS = path.join(ROOT, 'src/styles/fontawesome-subset.css');
const OUT_FONTS = path.join(ROOT, 'public/webfonts');

// Rodiny stylů (fa-solid, fas, …) — ty se nesmí zahodit, i když vypadají
// jako názvy ikon.
const FAMILIES = new Set([
  'fa-solid', 'fa-regular', 'fa-brands', 'fa-light', 'fa-thin', 'fa-duotone',
  'fa-sharp', 'fa-classic', 'fa-fw', 'fa-spin', 'fa-pulse', 'fa-border',
  'fa-inverse', 'fa-stack', 'fa-ul', 'fa-li', 'fa-beat', 'fa-fade', 'fa-flip',
  'fa-shake', 'fa-bounce', 'fa-spin-reverse', 'fa-spin-pulse', 'fa-rotate',
]);

function collectUsedIcons(dir, found = new Set()) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { collectUsedIcons(p, found); continue; }
    if (!/\.(tsx?|jsx?|css|html)$/.test(e.name)) continue;
    // Nikdy nečti vlastní výstup — jinak se ikony ze subsetu započítají
    // jako "použité" a subset postupně nabobtná zpátky na plnou sadu.
    if (path.resolve(p) === OUT_CSS) continue;
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/fa-[a-z0-9]+(?:-[a-z0-9]+)*/g)) {
      if (!FAMILIES.has(m[0])) found.add(m[0]);
    }
  }
  return found;
}

const used = collectUsedIcons(path.join(ROOT, 'src'));
// index.html může mít ikony taky
const indexHtml = path.join(ROOT, 'index.html');
if (fs.existsSync(indexHtml)) {
  for (const m of fs.readFileSync(indexHtml, 'utf8').matchAll(/fa-[a-z0-9]+(?:-[a-z0-9]+)*/g)) {
    if (!FAMILIES.has(m[0])) used.add(m[0]);
  }
}

const full = fs.readFileSync(path.join(FA, 'css/all.min.css'), 'utf8');

// FA6 definuje ikony přes custom property: `.fa-wheelchair{--fa:"\f193"}`,
// často s víc aliasy v jednom selektoru. Zahoď ty, které nikdo nepoužívá.
let dropped = 0, kept = 0;
const subset = full.replace(
  /\.fa-[a-z0-9-]+(?:,\s*\.fa-[a-z0-9-]+)*\s*\{--fa[^}]*\}/g,
  (rule) => {
    const names = [...rule.matchAll(/\.(fa-[a-z0-9-]+)/g)].map(m => m[1]);
    if (names.some(n => used.has(n))) { kept++; return rule; }
    dropped++; return '';
  }
).replace(/url\((["']?)\.\.\/webfonts\//g, 'url($1/webfonts/');

fs.mkdirSync(path.dirname(OUT_CSS), { recursive: true });
fs.writeFileSync(OUT_CSS, `/* GENEROVÁNO scripts/fa-subset.mjs — needituj ručně. */\n${subset}`);

fs.mkdirSync(OUT_FONTS, { recursive: true });
for (const f of fs.readdirSync(path.join(FA, 'webfonts'))) {
  fs.copyFileSync(path.join(FA, 'webfonts', f), path.join(OUT_FONTS, f));
}

const before = Buffer.byteLength(full), after = Buffer.byteLength(subset);
console.log(`[fa-subset] ${used.size} ikon použito, ${kept} pravidel ponecháno, ${dropped} zahozeno`);
console.log(`[fa-subset] CSS ${(before / 1024).toFixed(1)} kB → ${(after / 1024).toFixed(1)} kB`);
