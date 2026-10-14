#!/usr/bin/env node
/* 案内の通し確認：3分デモ・やりたいこと検索・使い方パネルを、本物のブラウザで動かす。
   ・デモの各場面で、光らせる場所が見つかるか（画面を tools/_out/demo-*.png に保存）
   ・デモが終わったら、元のデータに戻っているか（デモの中の変更が残っていないか）
   ・「請求書」で探して選ぶと、その画面へ行って押す場所が光るか
   ・使い方パネルが開くか
   使い方：  node tools/guide-tour.cjs            … PC とスマホ
            node tools/guide-tour.cjs --pc       … PC だけ */
const path = require('path');
const { open, closeAll, OUT } = require('./check.cjs');
let failed = 0;
const ok = (c, m) => { console.log((c ? 'OK  ' : 'NG  ') + m); if (!c) failed++; };

(async () => {
  const args = process.argv.slice(2);
  const widths = args.includes('--pc') ? [false] : args.includes('--phone') ? [true] : [false, true];
  for (const phone of widths) {
    const tag = phone ? 'スマホ' : 'PC';
    const { page, errs, close } = await open({ app: '', fresh: true, phone, wait: 800 });
    ok(await page.$('.app-start') !== null, `${tag}：初めて開くと「まずはここから」が出る`);
    // 本物のデータを少し入れておく（デモのあとで残っているか確かめる）
    await page.evaluate(async () => { await Kit.store.put('leads', { name: '本物 太郎', email: 'real@example.com', kind: '確認', message: '本物', status: 'new', tags: [], notes: [] }); await Kit.store.flush(); });
    const before = await page.evaluate(async () => (await Kit.store.list('leads')).length);

    await page.click('.app-start .st-hero .btn.primary');
    let n = 0;
    for (;;) {
      await page.waitForSelector('.gd-card h3', { timeout: 8000 });
      await page.waitForFunction(() => !document.querySelector('.gd-card') || !/画面を開いています/.test(document.querySelector('.gd-card').textContent), null, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(500);
      n++;
      const info = await page.evaluate(() => { const c = document.querySelector('.gd-card'); return { title: c.querySelector('h3').textContent, missing: /見つかりませんでした/.test(c.textContent), last: !!c.querySelector('.btn.primary span') && /デモを終わる/.test(c.textContent), mode: Kit.store.mode }; });
      ok(!info.missing && info.mode === 'demo', `${tag}：デモ ${n}「${info.title}」 光らせる場所あり・保存しない箱の中`);
      await page.screenshot({ path: path.join(OUT, `demo-${phone ? 'phone' : 'pc'}-${n}.png`) });
      if (info.last) { await page.click('.gd-card .btn.primary'); break; }
      await page.click('.gd-card .btn.primary');
      if (n > 12) break;
    }
    await page.waitForTimeout(900);
    const after = await page.evaluate(async () => ({ n: (await Kit.store.list('leads')).length, mode: Kit.store.mode, real: (await Kit.store.list('leads')).some((l) => l.name === '本物 太郎'), demo: (await Kit.store.list('leads')).some((l) => l.name === '森 はるか'), app: Kit.current() }));
    ok(after.mode !== 'demo' && after.n === before && after.real && !after.demo, `${tag}：デモのあとは元のデータに戻る（${before}件 → ${after.n}件、デモの問い合わせは残っていない）`);
    ok(after.app === 'start', `${tag}：デモが終わると「まずはここから」に戻る`);

    // やりたいことから探す
    await page.evaluate(() => Guide.openSearch());
    await page.fill('#gd-pal-q', '請求書');
    await page.waitForTimeout(200);
    const hits = await page.$$eval('.gd-pal-item', (els) => els.map((e) => e.querySelector('.t').textContent));
    ok(hits.length > 0, `${tag}：「請求書」で探すと ${hits.length}件（${hits.slice(0, 3).join('／')}）`);
    await page.screenshot({ path: path.join(OUT, `guide-search-${phone ? 'phone' : 'pc'}.png`) });
    await page.keyboard.press('Enter');
    await page.waitForSelector('.gd-layer.is-tip .gd-card', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(700);
    const tip = await page.evaluate(() => { const c = document.querySelector('.gd-card'); return c ? { t: c.querySelector('h3').textContent, missing: /見つかりませんでした/.test(c.textContent), app: Kit.current() } : null; });
    ok(tip && !tip.missing, `${tag}：選ぶと「${tip && tip.t}」の場所が光る（${tip && tip.app}）`);
    await page.screenshot({ path: path.join(OUT, `guide-tip-${phone ? 'phone' : 'pc'}.png`) });
    await page.keyboard.press('Escape');

    // 使い方パネル
    await page.evaluate(() => Kit.go('inbox'));
    await page.waitForTimeout(500);
    await page.evaluate(() => Guide.openHelp());
    await page.waitForSelector('.gd-panel', { timeout: 4000 }).catch(() => {});
    const pan = await page.evaluate(() => { const p = document.querySelector('.gd-panel'); return p ? p.querySelector('h2').textContent : null; });
    ok(!!pan, `${tag}：使い方パネルが開く（${pan}）`);
    await page.screenshot({ path: path.join(OUT, `guide-panel-${phone ? 'phone' : 'pc'}.png`) });
    ok(errs.length === 0, `${tag}：コンソールにエラーがない` + (errs.length ? '\n    ' + errs.join('\n    ') : ''));
    await close();
  }
  await closeAll();
  console.log(failed ? `\n${failed} 件に問題あり` : '\nすべて OK');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
