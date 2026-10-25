#!/usr/bin/env node
/* ケガの対処とテーピングの、見た目の検査：ブラウザ（Chromium）で js/aid.js・data/aid.js を読みこんで、
   ①データの検査（BC.validateAid）のまちがい・注意を出す
   ②すべてのテーピングの全ステップの図を描いて、画像にする（tools/_out/aid-<テーピングの id>.png … 全ステップの一覧、
     aid-<id>-<ステップ>.png … スマホの幅（390px）での1枚ずつ、aid-<id>-dark.png … 暗い表示）
   ③アニメーションが動くか（途中の1こま aid-anim-mid.png）・動きを減らす設定（prefers-reduced-motion）で止まるか・
     スマホの幅で横にはみ出さないか
   ④ケガの対処の一覧を画像にする（tools/_out/aid-list.png … 全部、aid-common.png … 共通の決まりと電話、aid-<ケガの id>.png … 1つずつ）
   ⑤ことばから探す（BC.findAids）：例の文で、意図したケガが1位になるか
   使い方：  NODE_PATH=$(npm root -g) node tools/aid-look.cjs [--no-shots]
   まちがい（✗）が1つでもあれば、終了コード 1。 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const outDir = path.join(root, 'tools', '_out');
  const shots = !process.argv.includes('--no-shots');
  fs.mkdirSync(outDir, { recursive: true });
  // 検査用のページ（tools/_out/ に置く。git には入らない）
  const harness = path.join(outDir, 'aid-look.html');
  fs.writeFileSync(harness, `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="../../css/coach.css">
<style>
  body { padding: 16px; }
  h1 { font-size: 1.2rem; margin: 0 0 4px; } h2 { font-size: 1rem; margin: 18px 0 8px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 14px; }
  .cell { background: var(--sheet); border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; min-width: 0; }
  .cell h3 { margin: 0 0 6px; font-size: 0.92rem; }
  .cell p { margin: 8px 0 0; font-size: 0.8rem; color: var(--ink-2); line-height: 1.6; }
  .aid { background: var(--sheet); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; break-inside: avoid; }
  .aid.urgent { border: 2px solid var(--x); }
  .aid h3 { margin: 0; font-size: 1rem; } .aid .w { font-size: 0.72rem; color: var(--ink-3); margin: 2px 0 6px; }
  .aid b { display: block; font-size: 0.78rem; margin-top: 6px; } .aid ul, .aid ol { margin: 2px 0 0; padding-left: 1.3em; font-size: 0.8rem; line-height: 1.55; }
  .aid .call { background: var(--warn-soft); border-radius: 8px; padding: 4px 8px; margin-top: 6px; }
  .aid .note { font-size: 0.78rem; color: var(--ink-2); margin: 6px 0 0; }
  .cols { columns: 2 520px; column-gap: 14px; }
  .phone .fig { width: 100%; }
</style></head><body><div id="root"></div>
<script src="../../js/core.js"></script>
<script src="../../js/aid.js"></script>
<script src="../../data/aid.js"></script>
</body></html>`);
  const url = 'file://' + harness;

  const browser = await chromium.launch();
  let bad = 0;
  const fail = (m) => { bad++; console.log('✗ ' + m); };
  async function newPage(opt = {}) {
    const ctx = await browser.newContext({ viewport: opt.viewport || { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: opt.dark ? 'dark' : 'light', reducedMotion: opt.reduce ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    page.errors = [];
    page.on('pageerror', (e) => page.errors.push('ページのエラー：' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) page.errors.push('コンソール：' + m.text()); });
    page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) page.errors.push('読みこめない：' + r.url()); });
    await page.goto(url);
    return page;
  }
  const shot = async (page, name, full = true) => { if (shots) await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: full }); };

  // ① データの検査
  const page = await newPage({ viewport: { width: 1180, height: 900 } });
  const data = await page.evaluate(() => {
    const r = BC.validateAid();
    return {
      ...r,
      aids: BC.aids.length, urgent: BC.aids.filter((a) => a.urgent).length,
      tapes: BC.tapes.map((t) => ({ id: t.id, name: t.name, steps: t.steps.length, views: BC.tapeViews(t) })),
    };
  });
  for (const e of data.errors) fail('データ：' + e);
  for (const w of data.warns) console.log('△ データ：' + w);
  console.log(`ケガの対処 ${data.aids}（すぐ119の可能性が高いもの ${data.urgent}）・テーピング ${data.tapes.length}（ステップ ${data.tapes.reduce((t, x) => t + x.steps, 0)}）`);

  // ② テーピングの図：全ステップの一覧（明るい・暗い）
  async function grid(pg, t) {
    return pg.evaluate((id) => {
      const tape = BC.tapeById[id];
      const rootEl = document.getElementById('root');
      rootEl.innerHTML = `<h1>${tape.name}</h1><div class="grid"></div>`;
      const g = rootEl.querySelector('.grid');
      const out = [];
      for (let i = -1; i <= tape.steps.length; i++) {
        const c = document.createElement('div');
        c.className = 'cell';
        const st = tape.steps[i];
        c.innerHTML = `<h3>${i < 0 ? '巻く前' : st ? `${i + 1}. ${st.name}` : 'できあがり'}</h3><div class="fig"></div>${st ? `<p>${st.text}</p>` : ''}`;
        g.appendChild(c);
        const r = BC.drawTape(c.querySelector('.fig'), id, i, { anim: false });
        out.push(!!(r && r.svg));
      }
      return out;
    }, t.id);
  }
  for (const t of data.tapes) {
    const ok = await grid(page, t);
    if (ok.some((x) => !x)) fail(`${t.id}：描けないステップがある`);
    await page.waitForTimeout(80);
    await shot(page, `aid-${t.id}`);
  }
  const dark = await newPage({ viewport: { width: 1180, height: 900 }, dark: true });
  for (const t of data.tapes) {
    await grid(dark, t);
    await dark.waitForTimeout(80);
    await shot(dark, `aid-${t.id}-dark`);
  }

  // ② スマホの幅で1ステップずつ（いまのテープ・前のテープ・はみ出し）
  const phone = await newPage();
  for (const t of data.tapes) {
    for (let i = 0; i < t.steps; i++) {
      const r = await phone.evaluate(([id, i]) => {
        const tape = BC.tapeById[id];
        const rootEl = document.getElementById('root');
        rootEl.className = 'phone';
        rootEl.innerHTML = `<div class="cell"><h3>${i + 1}. ${tape.steps[i].name}</h3><div class="fig"></div><p>${tape.steps[i].text}</p></div>`;
        const res = BC.drawTape(rootEl.querySelector('.fig'), id, i, { anim: false });
        const svg = res.svg, box = svg.getBoundingClientRect();
        return {
          now: svg.querySelectorAll('g[data-ta="now"]').length,
          done: svg.querySelectorAll('g[data-ta="done"]').length,
          w: box.width, h: box.height,
          over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      }, [t.id, i]);
      if (!r.now) fail(`${t.id} ${i + 1}：いまのテープが描かれていない`);
      if (i > 0 && !r.done) fail(`${t.id} ${i + 1}：前のステップのテープが描かれていない`);
      if (r.over > 0) fail(`${t.id} ${i + 1}：スマホの幅で横にはみ出す（${r.over}px）`);
      if (r.h > 844 * 0.62 + 1) fail(`${t.id} ${i + 1}：図が高すぎる（${Math.round(r.h)}px）`);
      await shot(phone, `aid-${t.id}-${i + 1}`);
    }
  }

  // ③ アニメーション：いまのテープだけ動く・前のテープは動かない・replay できる
  const anim = await phone.evaluate(async () => {
    const el = document.getElementById('root');
    el.innerHTML = '<div class="fig"></div>';
    const r = BC.drawTape(el.querySelector('.fig'), 'tp-ankle', 1);
    const a = document.getAnimations();
    const onNow = a.filter((x) => x.effect && x.effect.target && x.effect.target.closest('g[data-ta="now"]')).length;
    const onDone = a.filter((x) => x.effect && x.effect.target && x.effect.target.closest('g[data-ta="done"]')).length;
    await new Promise((res) => setTimeout(res, 700));
    const mid = getComputedStyle(el.querySelector('g[data-ta="now"] path[pathLength]')).strokeDashoffset;
    r.replay();
    const again = document.getAnimations().length;
    return { n: a.length, onNow, onDone, mid, again };
  });
  if (!anim.n || !anim.onNow) fail('アニメーション：いまのテープが動かない');
  if (anim.onDone) fail('アニメーション：前のステップのテープまで動いている');
  if (!anim.again) fail('アニメーション：replay() で動かない');
  await phone.waitForTimeout(500);
  await shot(phone, 'aid-anim-mid', false);
  const still = await newPage({ reduce: true });
  const reduced = await still.evaluate(() => {
    const el = document.getElementById('root');
    el.innerHTML = '<div class="fig"></div>';
    BC.drawTape(el.querySelector('.fig'), 'tp-ankle', 1);
    return document.getAnimations().length;
  });
  if (reduced) fail(`動きを減らす設定なのに、アニメーションが ${reduced} 個ある`);
  console.log(`アニメーション：動く ${anim.onNow}（前のテープ ${anim.onDone}）・動きを減らす設定 ${reduced}`);

  // ④ ケガの対処の一覧
  await page.evaluate(() => {
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const list = (title, arr, cls = '', tag = 'ul') => (arr && arr.length ? `<div class="${cls}"><b>${title}</b><${tag}>${arr.map((s) => `<li>${esc(s)}</li>`).join('')}</${tag}></div>` : '');
    const C = BC.aidCommon || { rules: [], phones: [] };
    let h = `<h1>ケガをしたとき（${BC.aids.length}）</h1>`;
    h += `<div class="aid">${list('いつも', C.rules)}<b>電話</b><ul>${C.phones.map((p) => `<li><strong>${p.num}</strong> ${esc(p.name)}：${esc(p.text)}</li>`).join('')}</ul></div>`;
    h += '<div class="cols">';
    for (const a of BC.aids) {
      h += `<div class="aid${a.urgent ? ' urgent' : ''}"><h3>${a.urgent ? '🚑 ' : ''}${esc(a.name)} <small style="color:var(--ink-3)">${a.id}</small></h3>` +
        `<div class="w">${a.words.map(esc).join('・')}</div>` +
        list('すぐ119番', a.call, 'call') + list('その日のうちに病院へ', a.doctor) + list('その場でやること', a.steps, '', 'ol') +
        list('やってはいけないこと', a.dont) + list('練習にもどるまで', a.back) +
        (a.taping.length ? `<b>テーピング</b><ul><li>${a.taping.map((id) => esc(BC.tapeById[id].name)).join('・')}</li></ul>` : '') +
        (a.note ? `<p class="note">${esc(a.note)}</p>` : '') + '</div>';
    }
    document.getElementById('root').innerHTML = h + '</div>';
  });
  await shot(page, 'aid-list');
  // 1つずつ（読んで確かめる用）：aid-common.png・aid-<ケガの id>.png
  if (shots) {
    const cards = await page.$$('.aid');
    const ids = await page.evaluate(() => ['common', ...BC.aids.map((a) => a.id)]);
    for (let i = 0; i < cards.length; i++) await cards[i].screenshot({ path: path.join(outDir, `aid-${ids[i]}.png`) });
  }

  // 探す（BC.findAids）：例の文で、意図したケガが1位になるか
  const talk = [
    ['人が倒れて反応がない', 'a-cpr'], ['AED', 'a-cpr'], ['友だちが急にたおれた', 'a-cpr'], ['息をしていない', 'a-cpr'],
    ['頭を打ってふらふらする', 'a-head'], ['転んで頭を打った', 'a-head'], ['頭をぶつけてぼーっとする', 'a-head'], ['脳しんとうかも', 'a-head'],
    ['暑くて気分が悪い', 'a-heat'], ['熱中症かも', 'a-heat'], ['体育館が暑くて頭が痛い', 'a-heat'],
    ['足首をひねった', 'a-ankle'], ['ねんざした', 'a-ankle'], ['くじいた', 'a-ankle'], ['着地で足首をぐねった', 'a-ankle'],
    ['突き指した', 'a-finger'], ['ボールが指に当たって痛い', 'a-finger'], ['指が痛い', 'a-finger'], ['親指を突き指した', 'a-finger'],
    ['手をついて手首が痛い', 'a-wrist'], ['手首をひねった', 'a-wrist'], ['転んで手をついた', 'a-wrist'],
    ['ひざがガクッとなった', 'a-knee'], ['ひざをひねった', 'a-knee'], ['ひざが痛い', 'a-knee'],
    ['ボールが目に当たった', 'a-eye'], ['目が痛い', 'a-eye'], ['顔にボールが当たった', 'a-eye'],
    ['鼻血が止まらない', 'a-nose'], ['鼻をぶつけた', 'a-nose'], ['はなぢが出た', 'a-nose'],
    ['歯が抜けた', 'a-tooth'], ['歯が痛い', 'a-tooth'], ['前歯が欠けた', 'a-tooth'],
    ['太ももをぶつけた', 'a-bruise'], ['ももかん', 'a-bruise'], ['あざができた', 'a-bruise'], ['ぶつかって痛い', 'a-bruise'],
    ['足がつった', 'a-cramp'], ['ふくらはぎがつった', 'a-cramp'], ['こむら返り', 'a-cramp'],
    ['すりむいた', 'a-wound'], ['切り傷', 'a-wound'], ['床ですりむいて血が出た', 'a-wound'],
    ['オスグッド', 'a-growth'], ['かかとが痛い', 'a-growth'], ['ひざの下が痛い', 'a-growth'], ['成長痛', 'a-growth'],
  ];
  const found = await page.evaluate((cases) => cases.map(([q]) => { const r = BC.findAids(q); return r.length ? r[0].aid.id : ''; }), talk);
  talk.forEach(([q, want], i) => { if (found[i] !== want) fail(`探す「${q}」→ ${found[i] || 'なし'}（${want} のはず）`); });

  for (const p of [page, dark, phone, still]) for (const e of p.errors) fail(e);
  await browser.close();
  console.log(shots ? `画像：${path.relative(process.cwd(), outDir)}/aid-*.png` : '');
  console.log(bad ? `まちがい ${bad}` : 'まちがい 0');
  if (bad) process.exitCode = 1;
})();
