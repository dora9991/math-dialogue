#!/usr/bin/env node
/* 見た目と動きの検査：ブラウザ（Chromium）で開いて、
   ①すべての場面の、すべての分かれ道を開き、見出しが出るか・スマホの幅（390px）で横にはみ出していないか
   ②場面の全体（#<場面>.all）と、基本のページも同じように
   ③ホームからカードを押し、選択肢を押して、次の分かれ道へ進めるか。ほかの場面へ移ったとき「もどる」が出て、押すと戻れるか
   ④検索で結果が出て、押すとその分かれ道が開くか
   ⑤画像（ホーム・分かれ道・全体・基本。PC・スマホ・暗い表示）を tools/_out/ に書き出す
   使い方：  NODE_PATH=$(npm root -g) node tools/look.cjs [開くHTML] [--no-shots]
            （開くHTML を省くと index.html。seitoshido-navi-all-in-one.html も調べられる）
   必要なもの：playwright（Chromium は PLAYWRIGHT_BROWSERS_PATH にあればそれを使う）
   まちがい（✗）が1つでもあれば、終了コード 1。 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const args = process.argv.slice(2);
  const file = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(root, 'index.html'));
  const shots = !args.includes('--no-shots');
  const url = 'file://' + file;
  const outDir = path.join(root, 'tools', '_out');
  if (shots) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  const isFont = (u) => /fonts\.(googleapis|gstatic)\.com/.test(u);
  page.on('pageerror', (e) => errors.push('ページのエラー：' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !isFont(m.text())) errors.push('コンソール：' + m.text()); });
  page.on('requestfailed', (r) => { if (!isFont(r.url())) errors.push('読みこめない：' + r.url()); });

  let bad = 0;
  const fail = (m) => { bad++; console.log('✗ ' + m); };
  const goHash = async (h) => {
    await page.evaluate((x) => { location.hash = x; }, h);
    await page.waitForTimeout(30);
  };
  const h1 = () => page.evaluate(() => (document.querySelector('h1') || {}).textContent || '');
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  await page.goto(url + '#top');
  await page.waitForSelector('.card');
  const data = await page.evaluate(() => ({
    scenes: SN.ordered().map((s) => ({ id: s.id, title: s.title, nodes: Object.keys(s.nodes).map((nid) => ({ nid, title: s.nodes[nid].title, hash: '#' + [s.id].concat(SN.pathTo(s.id, nid).slice(1)).join('~') })) })),
    guides: SN.guides.map((g) => ({ id: g.id, title: g.title })),
    errors: SN.validate().errors,
  }));
  for (const e of data.errors) fail('データ：' + e);

  // ① すべての分かれ道
  let opened = 0;
  for (const s of data.scenes) {
    for (const n of s.nodes) {
      await goHash(n.hash);
      const t = await h1();
      if (t !== n.title) fail(`開けない：${s.id} › ${n.nid}（見出し「${t}」）`);
      const o = await overflow();
      if (o > 1) fail(`横にはみ出し ${o}px：${s.id} › ${n.nid}`);
      opened++;
    }
    // ② 全体
    await goHash('#' + s.id + '.all');
    const t = await h1();
    if (!t.startsWith(s.title)) fail(`全体が開けない：${s.id}`);
    const cnt = await page.evaluate(() => document.querySelectorAll('.all-node').length);
    if (cnt !== s.nodes.length) fail(`全体の分かれ道の数が合わない：${s.id}（${cnt} / ${s.nodes.length}）`);
    const o = await overflow();
    if (o > 1) fail(`横にはみ出し ${o}px：${s.id}.all`);
  }
  for (const g of data.guides) {
    await goHash('#' + g.id);
    if ((await h1()) !== g.title) fail(`基本のページが開けない：${g.id}`);
    const o = await overflow();
    if (o > 1) fail(`横にはみ出し ${o}px：#${g.id}`);
  }
  await goHash('#top');
  const o = await overflow();
  if (o > 1) fail(`横にはみ出し ${o}px：ホーム`);

  // ③ 押して進む
  const first = data.scenes.find((s) => s.id === 'ijime') || data.scenes[0];
  await page.click(`a.card[href="#${first.id}"]`);
  if ((await h1()) !== first.nodes[0].title) fail('ホームのカードを押しても、はじめの分かれ道が開かない');
  const before = await h1();
  await page.click('.opts a.opt:not(.jump)');
  await page.waitForTimeout(30);
  const after = await h1();
  if (after === before) fail('選択肢を押しても、次の分かれ道へ進まない');
  const crumbs = await page.evaluate(() => document.querySelectorAll('.crumbs a').length);
  if (crumbs < 1) fail('道すじ（パンくず）が出ない');
  await page.click('a.back');
  await page.waitForTimeout(30);
  if ((await h1()) !== before) fail('「前の分かれ道に戻る」で戻れない');
  // ほかの場面へ
  const jumpFrom = await page.evaluate(() => {
    for (const s of SN.ordered()) for (const nid of Object.keys(s.nodes)) {
      const o = (s.nodes[nid].options || []).find((x) => x.jump && SN.scenarios[x.jump.split('~')[0]]);
      if (o) return { hash: '#' + [s.id].concat(SN.pathTo(s.id, nid).slice(1)).join('~'), title: s.nodes[nid].title };
    }
    return null;
  });
  if (jumpFrom) {
    await goHash(jumpFrom.hash);
    await page.click('.opts a.opt.jump');
    await page.waitForTimeout(30);
    if (!(await page.$('a.from'))) fail('ほかの場面へ移ったとき「もどる」が出ない');
    else {
      await page.click('a.from');
      await page.waitForTimeout(30);
      if ((await h1()) !== jumpFrom.title) fail('「もどる」で、元の分かれ道に戻れない');
    }
  }
  // ④ 検索
  await goHash('#top');
  await page.fill('#q', '保護者');
  await page.waitForTimeout(50);
  const hits = await page.evaluate(() => document.querySelectorAll('#results a').length);
  if (!hits) fail('検索「保護者」で結果が出ない');
  else {
    const want = await page.evaluate(() => document.querySelector('#results a .r-path').textContent);
    await page.click('#results a');
    await page.waitForTimeout(30);
    const got = await h1();
    if (!want.endsWith(got) && !want.includes(got)) fail(`検索の結果を押しても、その分かれ道が開かない（${want} → ${got}）`);
  }
  await goHash('#top');
  const keep = await page.evaluate(() => document.getElementById('q').value);
  if (keep !== '保護者') fail('ホームに戻ったとき、検索の言葉が消えている');
  await page.click('[data-clear]');

  // ⑤ 画像
  if (shots) {
    const shoot = async (name, hash, w, dark) => {
      await page.setViewportSize({ width: w, height: w < 600 ? 844 : 900 });
      await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light' });
      await goHash(hash);
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: true });
    };
    const ex = first.id;
    const deep = (first.nodes.find((n) => n.hash.split('~').length >= 3) || first.nodes[1] || first.nodes[0]).hash;
    await shoot('home-pc', '#top', 1280);
    await shoot('home-sp', '#top', 390);
    await shoot('home-pc-dark', '#top', 1280, true);
    await shoot('node-pc', deep, 1280);
    await shoot('node-sp', deep, 390);
    await shoot('node-pc-dark', deep, 1280, true);
    await shoot('start-sp', '#' + ex, 390);
    await shoot('all-pc', '#' + ex + '.all', 1280);
    await shoot('guide-renkei-sp', '#renkei', 390);
    await shoot('guide-kiroku-pc', '#kiroku', 1280);
    console.log('画像：' + path.relative(process.cwd(), outDir) + '/');
  }

  for (const e of [...new Set(errors)]) fail(e);
  console.log(`\n分かれ道 ${opened}・場面 ${data.scenes.length}・基本 ${data.guides.length} を開いた：まちがい ${bad}`);
  await browser.close();
  process.exitCode = bad ? 1 : 0;
})();
