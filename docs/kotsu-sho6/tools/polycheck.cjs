// 使い方: node polycheck.cjs <out の json...>  図の 多角形（polygon）で、辺どうしが 交わる（ねじれた）ものを 出す
const fs = require('fs');
const cross = (p, q, r, s) => { const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(p, q, r), d2 = d(p, q, s), d3 = d(r, s, p), d4 = d(r, s, q); return (d1 * d2 < 0) && (d3 * d4 < 0); };
let n = 0, bad = 0;
for (const f of process.argv.slice(2)) for (const it of JSON.parse(fs.readFileSync(f, 'utf8'))) {
  if (!it.f) continue;
  for (const m of it.f.matchAll(/<polygon points="([^"]*)"/g)) {
    n++; const P = m[1].trim().split(/\s+/).map(s => s.split(',').map(Number)); const k = P.length; let x = false;
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { if (j === i + 1 || (i === 0 && j === k - 1)) continue; if (cross(P[i], P[(i + 1) % k], P[j], P[(j + 1) % k])) x = true; }
    if (x) { bad++; console.log('ねじれ', it.id, m[1]); }
  }
}
console.log('多角形', n, 'ねじれ', bad);
