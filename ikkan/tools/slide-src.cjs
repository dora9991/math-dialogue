#!/usr/bin/env node
/* スライドをつくるための「元の資料」を、授業ごとに書き出す。
   使い方：  NODE_PATH=$(npm root -g) node tools/slide-src.cjs <単元のキー（kukan・data・shiki・renritsu・ichiji）> <JSON の出力先フォルダ>
   書き出すもの：
     <出力先>/<授業のID>.json … ワークシートの表面・裏（問題・答え・表・図の場所）と、授業計画（50分の流れ・発問・重要語句・考えよう）
     slides/img/<授業のID>_f<N>_q.png・_a.png … ワークシートの図を、1つずつ PNG にしたもの（問題用＝空欄のまま、答え用＝赤い答え）。JSON の figs の q・a が、この場所（img/…png）
   必要なもの：playwright（Chromium）。図の PNG は、スライドの画像として、そのまま <img src="img/…png"> で使う。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const [unit, outDir] = process.argv.slice(2);
if (!unit || !outDir) { console.log('使い方：node tools/slide-src.cjs <単元のキー> <出力先フォルダ>'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
const imgDir = path.join(root, 'slides', 'img');
fs.mkdirSync(imgDir, { recursive: true });

const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
const dataDir = fs.readdirSync(path.join(root, 'data'));
for (const f of ['js/vendor/qrcode.js', 'js/core.js', 'js/qr.js', 'js/figs.js', 'js/figs3d.js', 'js/plan.js', 'js/rec.js', 'js/plansheet.js', 'data/lessons.js',
  ...dataDir.filter((f) => /^ws_.*\.js$/.test(f)).sort().map((f) => 'data/' + f),
  ...dataDir.filter((f) => /^lesson_.*\.js$/.test(f)).sort().map((f) => 'data/' + f)]) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const IK = ctx.IK;

const strip = (s) => String(s == null ? '' : s);
function blk(b) {
  const o = { type: b.type };
  if (b.label) o.label = b.label;
  if (b.text != null) o.text = strip(b.text);
  if (b.words) o.words = b.words;
  if (b.rows) o.rows = b.rows;
  if (b.answer) o.answer = strip(b.answer);
  if (b.head) o.head = b.head;
  if (b.data) o.data = b.data;
  if (b.corner != null) o.corner = b.corner;
  if (b.figs) o.figs = b.figs.map(() => ({}));   // あとで、id・w・h・q・a を入れる
  if (b.cols) o.cols = b.cols.map((c) => c.blocks.map(blk));
  return o;
}
const ids = IK.order.filter((i) => IK.lessons[i].unit === unit && (IK.plans[i] || IK.drills[i] || IK.quizzes[i]));
const out = {};
for (const id of ids) {
  const l = IK.lessons[id], p = IK.plans[id];
  const at = l.blocks.findIndex((b) => b.type === 'break');
  out[id] = { no: l.no, title: l.title, summary: l.summary, unitName: l.unitName, front: l.blocks.slice(0, at < 0 ? l.blocks.length : at).map(blk), back: at < 0 ? [] : l.blocks.slice(at + 1).map(blk), plan: p };
}

(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 6 })).newPage();
  await page.goto('file://' + path.join(root, 'index.html'));
  await page.addStyleTag({ content: 'header.top,.pbar{display:none !important}' });   // 上に貼りつく見出し（タブ・ボタン）が、図に写りこまないように
  let nFig = 0;
  for (const id of ids) {
    await page.evaluate((h) => { location.hash = h; }, '#/' + id + '/ws');
    await page.waitForTimeout(300);
    await page.evaluate(() => { document.body.classList.remove('ans-on'); document.querySelector('.pages').style.zoom = 1; });
    const sel = '.wsp .wb-fig svg', n = await page.locator(sel).count();
    const infos = [];
    for (let i = 0; i < n; i++) {
      const el = page.locator(sel).nth(i), box = await el.boundingBox();
      await el.screenshot({ path: path.join(imgDir, `${id}_f${i + 1}_q.png`), omitBackground: true });
      infos.push({ w: Math.round(box.width), h: Math.round(box.height) });
    }
    await page.evaluate(() => document.body.classList.add('ans-on'));
    for (let i = 0; i < n; i++) await page.locator(sel).nth(i).screenshot({ path: path.join(imgDir, `${id}_f${i + 1}_a.png`), omitBackground: true });
    await page.evaluate(() => document.body.classList.remove('ans-on'));
    // 図ブロックに、順番に、画像の場所を入れる（表面→裏の順、横並びは左→右）
    let k = 0;
    const fill = (bl) => bl.forEach((x) => {
      if (x.figs) x.figs = x.figs.map(() => { const i = k++; return { id: `${id}_f${i + 1}`, w: infos[i] && infos[i].w, h: infos[i] && infos[i].h, q: `img/${id}_f${i + 1}_q.png`, a: `img/${id}_f${i + 1}_a.png` }; });
      if (x.cols) x.cols.forEach(fill);
    });
    fill(out[id].front); fill(out[id].back);
    if (k !== n) console.log(`△ ${id}：図が ${n} つあるのに、ブロックの数は ${k}`);
    nFig += n;
    fs.writeFileSync(path.join(outDir, id + '.json'), JSON.stringify(out[id], null, 1));
  }
  await b.close();
  console.log(`${ids.length} 授業・図 ${nFig} つ（slides/img/ に PNG、${outDir} に JSON）`);
})();
