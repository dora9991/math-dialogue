#!/usr/bin/env node
/* 見た目と動きの検査：ブラウザ（Chromium）で全部の画面を開き、エラーと横のはみ出しを調べ、画像を tools/_out/ に書き出す。
   使い方：  NODE_PATH=$(npm root -g) node tools/check.cjs [開くHTML] [--only=admin:people,site:home] [--no-shots] [--dark]
            （開くHTML を省くと index.html。taikai-all-in-one.html も調べられる）
   画面の幅：スマホ（390px）と PC（1280px）。まちがい（✗）が1つでもあれば、終了コード 1。 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const args = process.argv.slice(2);
  const file = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(root, 'index.html'));
  const shots = !args.includes('--no-shots');
  const dark = args.includes('--dark');
  const only = ((args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '').split(',').filter(Boolean);
  const url = 'file://' + file;
  const outDir = path.join(root, 'tools', '_out');
  if (shots) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  let bad = 0;
  const fail = (m) => { bad++; console.log('✗ ' + m); };
  const external = (u) => /fonts\.(googleapis|gstatic)\.com|youtube|ytimg|google\.com|sme\.or\.jp/.test(u);

  for (const vp of [{ name: 'pc', width: 1280, height: 860 }, { name: 'sp', width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.name === 'sp' ? 2 : 1, colorScheme: dark ? 'dark' : 'light' });
    await ctx.route(/youtube|ytimg|fonts\.g/, (r) => r.abort());
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('ページのエラー：' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !external(m.text()) && !/ERR_FAILED|net::/.test(m.text())) errors.push('コンソール：' + m.text()); });
    page.on('requestfailed', (r) => { if (!external(r.url())) errors.push('読みこめない：' + r.url()); });
    page.on('dialog', (d) => d.dismiss());

    await page.goto(url + '#/');
    await page.waitForTimeout(300);
    await page.evaluate(() => sessionStorage.setItem('taikai.admin', JSON.stringify({ ok: true, who: '検査' })));
    const list = await page.evaluate(() => ({
      site: Object.keys(T.pages.site), admin: Object.keys(T.pages.admin), print: Object.entries(T.pages.print).map(([k, v]) => k),
      survey: (T.ev().surveys[0] || {}).id, news: (T.ev().news[0] || {}).id,
    }));
    const targets = [];
    for (const id of list.site) targets.push(['site', id, id === 'news' ? 'news' : id === 'survey' ? 'survey/' + list.survey : id]);
    if (list.news) targets.push(['site', 'news-one', 'news/' + list.news]);
    targets.push(['site', 'mypage-in', 'mypage?c=SG-0001&t=' + (await page.evaluate(() => T.ev().people[0].token))]);
    for (const id of list.admin) targets.push(['admin', id, 'admin/' + id]);
    for (const id of list.print) targets.push(['print', id, 'print/' + id]);

    for (const [where, id, hash] of targets) {
      if (only.length && !only.includes(where + ':' + id)) continue;
      errors.length = 0;
      await page.evaluate((h) => { location.hash = '#/' + h; }, hash);
      await page.waitForTimeout(where === 'print' ? 400 : 220);
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1: (document.querySelector('h1') || {}).textContent || '',
        bad: !!document.querySelector('.note.bad'),
        text: (document.querySelector('.note.bad') || {}).textContent || '',
      }));
      const label = `${vp.name} ${where}:${id}`;
      for (const e of errors) fail(`${label} ${e}`);
      if (info.bad) fail(`${label} 画面の中のエラー：${info.text.slice(0, 120)}`);
      if (where !== 'print' && info.overflow > 1) fail(`${label} 横にはみ出し ${info.overflow}px`);
      if (shots) await page.screenshot({ path: path.join(outDir, `${vp.name}-${where}-${id}.png`), fullPage: where !== 'admin' || vp.name === 'pc' });
    }
    await ctx.close();
  }
  await browser.close();
  console.log(bad ? `\n✗ ${bad} 件` : '\n✓ すべて開けました（エラー・はみ出しなし）');
  process.exit(bad ? 1 : 0);
})();
