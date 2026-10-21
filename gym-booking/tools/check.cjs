#!/usr/bin/env node
/* 画面の検査：パソコン（明るい画面）とスマホ（暗い画面）で開き、ひととおり操作して、
   エラーが出ないか・横にはみ出さないかを調べ、画面の画像（PNG）を書き出す。
   使い方：  NODE_PATH=$(npm root -g) node tools/check.cjs [画像の出力先フォルダ]
   必要なもの：playwright（npm i -g playwright。Chromium は PLAYWRIGHT_BROWSERS_PATH にあればそれを使う）
   流れ：しくみ → 団体で抽選に申し込む → 市役所で抽選・確かめ → 団体で確定 → 日付を進めて先着予約 → 学校で利用の確認 → 市役所で大会の優先確保・各画面 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const outDir = path.resolve(process.argv[2] || path.join(root, 'tools', '_out'));
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const problems = [];
  for (const [w, h, scheme, tag] of [[1280, 900, 'light', 'pc'], [390, 844, 'dark', 'phone']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    const page = await ctx.newPage();
    page.on('pageerror', e => problems.push(`[${tag}] ${e}`));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) problems.push(`[${tag}] ${m.text()}`); });
    const shot = async name => {
      if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) problems.push(`[${tag}] 横にはみ出している：${name}`);
      await page.screenshot({ path: path.join(outDir, `${tag}-${name}.png`) });
    };
    const toast = async () => (await page.locator('.toast').textContent()).trim();
    const tab = async (v, t) => { await page.click(`button.view[data-v="${v}"]`); if (t) await page.click(`button.tab[data-tab="${t}"]`); };
    await page.goto('file://' + path.join(root, 'index.html'));
    await shot('01-しくみ');
    await tab('org', 'cal');
    await shot('02-団体-時間割');
    const frees = page.locator('.cell.t-free');
    let applied = false;
    for (let i = 0; i < await frees.count() && !applied; i++) {
      await frees.nth(i).click();
      const b = page.locator('.sheet button[data-act="apply"]:not([disabled])');
      if (await b.count()) { await shot('03-コマ'); await b.first().click(); applied = true; console.log(`[${tag}] ${await toast()}`); }
      await page.click('.sheet .x');
    }
    if (!applied) problems.push(`[${tag}] 申し込めるコマが見つからない`);
    await tab('admin', 'overview');
    await shot('04-市役所-概要');
    await page.click('button.tab[data-tab="lottery"]');
    await page.locator('form[data-form="draw"] button.btn').click();
    console.log(`[${tag}] ${await toast()}`);
    await page.click('button[data-act="verify"]');
    if (!(await page.locator('.okmsg').count())) problems.push(`[${tag}] 抽選の確かめが合わない`);
    await shot('05-市役所-抽選');
    await tab('org', 'home');
    if (await page.locator('button[data-act="confirm-all"]').count()) { await page.click('button[data-act="confirm-all"]'); console.log(`[${tag}] ${await toast()}`); }
    await shot('06-団体-ホーム');
    await page.click('button[data-act="clock"]');
    await page.locator('.clock-panel button[data-act="setclock"]').first().click();
    await page.click('button.tab[data-tab="cal"]');
    await shot('07-団体-先着');
    const can = page.locator('.cell.t-can');
    if (await can.count()) { await can.first().click(); await page.locator('.sheet button[data-act="book"]:not([disabled])').first().click(); console.log(`[${tag}] ${await toast()}`); await page.click('.sheet .x'); }
    else problems.push(`[${tag}] 先着で予約できるコマが見つからない`);
    await tab('school', 'check');
    await shot('08-学校-利用の確認');
    for (const t of ['cal', 'block']) { await page.click(`button.tab[data-tab="${t}"]`); await shot(`09-学校-${t}`); }
    await tab('admin', 'cal');
    const future = page.locator('.cal .row:not(.past) .cell.t-free');
    if (await future.count()) {
      await future.last().click();
      await page.locator('.sheet form[data-form="sheet-block"] button[value="slot"]').click();
      console.log(`[${tag}] ${await toast()}`);
      await page.click('.sheet .x');
    }
    await shot('10-市役所-cal');
    for (const t of ['orgs', 'facilities', 'regular', 'rules', 'data']) { await page.click(`button.tab[data-tab="${t}"]`); await shot(`10-市役所-${t}`); }
    await ctx.close();
  }
  await browser.close();
  console.log(problems.length ? `✗ ${problems.length} 件\n${problems.join('\n')}` : `○ 問題なし（画像：${outDir}）`);
  process.exit(problems.length ? 1 : 0);
})();
