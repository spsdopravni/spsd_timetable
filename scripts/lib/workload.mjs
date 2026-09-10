// Deterministická mikro-zátěž pro kalibraci CPU throttlingu.
// Musí být BAJTOVĚ IDENTICKÁ na Macu i na Pi → proto je to jeden string,
// který se injektuje do puppeteeru i do bench/cpu-probe.html.
export const WORKLOAD_SRC = String.raw`
function benchWorkload() {
  // seeded PRNG, ať je zátěž mezi běhy identická
  let seed = 123456789;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  const t0 = performance.now();

  // 1) čistá aritmetika + alokace objektů (React reconciliation proxy)
  let acc = 0;
  for (let pass = 0; pass < 40; pass++) {
    const arr = [];
    for (let i = 0; i < 5000; i++) arr.push({ id: i, v: rnd(), s: 'row' + (i & 255) });
    for (const o of arr) acc += o.v * o.s.length;
    arr.sort((a, b) => a.v - b.v);
    acc += arr[0].v;
  }

  // 2) string/format práce (formatDisplayTime, toLocaleTimeString apod.)
  let str = '';
  for (let i = 0; i < 20000; i++) str = new Date(1700000000000 + i * 1000).toISOString().slice(11, 19);
  acc += str.length;

  // 3) DOM: style recalc + layout (to CPU throttling škrtí taky)
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px';
  document.body.appendChild(host);
  for (let i = 0; i < 300; i++) {
    const d = document.createElement('div');
    d.className = 'benchrow';
    d.style.cssText = 'display:flex;padding:4px;font-size:' + (12 + (i % 8)) + 'px';
    d.innerHTML = '<span>' + i + '</span><span>Dejvická</span><span>' + (i % 60) + ' min</span>';
    host.appendChild(d);
    if (i % 50 === 0) acc += host.offsetHeight; // vynucený layout
  }
  acc += host.getBoundingClientRect().height;
  host.remove();

  return { ms: Math.round(performance.now() - t0), checksum: Math.round(acc) };
}
`;
