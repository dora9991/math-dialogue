#!/usr/bin/env node
/* 動きの検査と画像：data/motions-*.js の動きを、コマ送りの画像にして tools/_out/ に書き出す（目で確かめる用）。
   使い方：  NODE_PATH=$(npm root -g) node tools/motion-look.cjs [動きの id …] [--mode=よくない形の id] [--angles] [--dark]
            … tools/_out/motions.png（1行に1つの動き・8コマ）
            NODE_PATH=$(npm root -g) node tools/motion-look.cjs --big pound@0.2 shoot@0.3@stiff crossover@0.3@@a
            … tools/_out/motions-big.png（id@時刻@よくない形@a（角度）または t（動きのあと））
   BC.validateMotions() のまちがいも出す（まちがいがあれば終了コード 1）。 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const big = args.includes('--big');
const dark = args.includes('--dark');
const mode = (args.find((a) => a.startsWith('--mode=')) || '').slice(7);
const ang = args.includes('--angles');
const only = args.filter((a) => !a.startsWith('--'));
const outDir = path.join(root, 'tools', '_out');
fs.mkdirSync(outDir, { recursive: true });
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = ['js/core.js', ...[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((f) => f.startsWith('data/') || f === 'js/motion.js')];
const page = `<!doctype html><meta charset=utf-8><link rel=stylesheet href="file://${root}/css/coach.css"><style>body{padding:8px}.row{display:grid;grid-template-columns:110px repeat(8,1fr);gap:4px;margin-bottom:6px;align-items:center;font-size:11px}.cell{border:1px solid var(--line);border-radius:6px;background:var(--sheet-2)}#g.big{display:grid;gap:8px}</style><div id=g></div>
${[...new Set(scripts)].filter((f) => fs.existsSync(path.join(root, f))).map((f) => `<script src="file://${root}/${f}"></script>`).join('')}`;
const tmp = path.join(outDir, '_motion-look.html');
fs.writeFileSync(tmp, page);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: big ? 1400 : 1500, height: 800 }, colorScheme: dark ? 'dark' : 'light' });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + tmp);
  const v = await p.evaluate(() => BC.validateMotions());
  for (const e of v.errors) console.log('✗ ' + e);
  for (const w of v.warns.filter((w) => !/データにない/.test(w))) console.log('△ ' + w);
  await p.evaluate(([only, mode, ang, big]) => {
    const g = document.getElementById('g');
    if (big) {
      g.className = 'big';
      g.style.gridTemplateColumns = `repeat(${Math.min(5, only.length)},1fr)`;
      for (const s of only) {
        const [id, t, md, opt] = s.split('@');
        const c = BC.motions[id]; if (!c) continue;
        const m = (c.mistakes || []).find((x) => x.id === md);
        const d = document.createElement('div'); d.className = 'cell';
        d.innerHTML = BC.motionSVG(id, +t, { mods: m ? m.mods : null, angles: opt === 'a', trail: opt === 't' }) + `<small>${s}</small>`;
        g.appendChild(d);
      }
      return;
    }
    for (const id of Object.keys(BC.motions)) {
      if (only.length && !only.includes(id)) continue;
      const c = BC.motions[id];
      const m = (c.mistakes || []).find((x) => x.id === mode);
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `<b>${id}${m ? '<br>×' + m.label : ''}<br><small>${(c.phases || []).map((x) => x.label).join('→')}</small></b>`;
      g.appendChild(row);
      for (let i = 0; i < 8; i++) {
        const d = document.createElement('div'); d.className = 'cell'; row.appendChild(d);
        const t = i / 8 + 0.01;
        d.innerHTML = BC.motionSVG(id, t, { mods: m ? m.mods : null, angles: ang }) + `<small>${t.toFixed(2)}</small>`;
      }
    }
  }, [only, mode, ang, big]);
  await p.waitForTimeout(150);
  const out = path.join(outDir, big ? 'motions-big.png' : 'motions.png');
  await p.screenshot({ path: out, fullPage: true });
  console.log('画像：' + path.relative(process.cwd(), out) + `（動き ${await p.evaluate(() => Object.keys(BC.motions).length)}）`);
  for (const e of errs) console.log('✗ ページのエラー：' + e);
  await b.close();
  if (v.errors.length || errs.length) process.exitCode = 1;
})();
