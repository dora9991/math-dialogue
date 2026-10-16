#!/usr/bin/env node
/* 楽譜の見た目の確認用：コード譜からソロを作って譜面を描画し、PNG に保存する。
   使い方：NODE_PATH=$(npm root -g) node adlib/tools/shot-notation.js "| Dm7 | G7 | Cmaj7 | % |" out.png [seed] [楽器id] [幅] [1小節の拍数]（環境変数 LEVEL=1..3 DENS=0..2 で難しさ・音の多さ） */
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const JS = path.join(__dirname, '../js');
const FILES = ['theory', 'chart', 'analysis', 'licks', ...fs.readdirSync(JS).filter(f => /^licks-.*\.js$/.test(f)).map(f => f.replace(/\.js$/, '')).sort(), 'solo', 'glyphs', 'notation'];
const CSS = `body{margin:0;padding:12px;background:#fff;color:#1d1d1f}.ntn{display:block}.ntn .staff,.ntn .bar,.ntn .stem,.ntn .ledger,.ntn .tie,.ntn .tupb{stroke:currentColor}.ntn .g,.ntn .beam{fill:currentColor}.ntn text{fill:currentColor;font-family:system-ui,"Hiragino Sans","Noto Sans JP",sans-serif}.ntn .chord{font-weight:600}.ntn .feel{font-style:italic}.ntn .tup{font-style:italic;font-weight:600}.ntn .rehearsal rect{fill:none;stroke:currentColor}.ntn .mark path{stroke:currentColor;opacity:.5}.ntn .mark .hit{stroke-opacity:0}.ntn .mark text{opacity:.7}.ntn .barno{opacity:.6}.ntn .chord.nc{opacity:.6}`;
(async () => {
  const [text, out, seed, instId, width, bpbArg] = process.argv.slice(2);
  const level = +process.env.LEVEL || 2, density = process.env.DENS != null ? +process.env.DENS : 1;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 2 });
  await page.goto('about:blank');
  await page.addStyleTag({ content: CSS });
  for (const f of FILES) await page.addScriptTag({ path: path.join(JS, f + '.js') });
  const info = await page.evaluate(([text, seed, instId, width, bpbArg, level, density]) => {
    const { T, C, A, S, L, N, Au } = AL;
    const bpbN = +bpbArg || 4, ch = C.parse(text, { beatsPerBar: bpbN }), slots = C.slotsOf(ch), hs = C.harmonicSlots(slots), an = A.analyze(hs, { beatsPerBar: bpbN });
    const INST = { altosax: { transpose: 9, clef: 'treble' }, trumpet: { transpose: 2, clef: 'treble' }, tenorsax: { transpose: 14, clef: 'treble' }, trombone: { transpose: 0, clef: 'bass' }, guitar: { transpose: 12, clef: 'treble' } };
    const rg = S.RANGES[instId] || S.RANGES.default;
    const solo = S.generate(hs, an, { seed: +seed || 3, level, density, lo: rg[0], hi: rg[1], bpb: bpbN });
    const marks = solo.decisions.map((d, i) => { const l = L.byId[d.id]; const h0 = hs[d.i0]; return { t0: d.t, t1: d.t + (d.cut || l.total), label: d.kind === 'pattern' ? (d.pat || '') : '', tone: i }; }).filter(m => m.label);
    const score = N.scoreFromEvents({ events: solo.events.map((e, i) => Object.assign({}, e, { id: i })), slots, bpb: ch.beatsPerBar, bars: ch.chorusBars, keySpell: an.key.spell, keyMode: an.key.mode, inst: INST[instId] || null, marks, feel: 'Swing' });
    const r = N.render(score, { width: +width || 900, ss: 8, barsPerSystem: 4 });
    document.body.insertAdjacentHTML('beforeend', r.svg);
    return { key: an.key.name, h: r.height, n: solo.events.length };
  }, [text, seed, instId, width, bpbArg, level, density]);
  await page.setViewportSize({ width: 960, height: Math.ceil(info.h) + 30 });
  await page.screenshot({ path: out, fullPage: true });
  console.log(JSON.stringify(info), '→', out);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
