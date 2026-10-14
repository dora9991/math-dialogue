#!/usr/bin/env node
/* アプリ全体のスクリーンショット確認用。
   使い方：NODE_PATH=$(npm root -g) node adlib/tools/shot-app.js 出力フォルダ [幅] [dark]
   adlib/index.html を file:// で開き、各タブを撮影する（コンソールエラーがあれば表示）。 */
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const out = path.resolve(process.argv[2] || '/tmp/adlib-shots');
  const width = +process.argv[3] || 1100, dark = process.argv[4] === 'dark';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForTimeout(600);
  for (const tab of ['chart', 'solo', 'dict', 'sound']) {
    await page.click(`#tabs button[data-tab="${tab}"]`);
    await page.waitForTimeout(500);
    const hgt = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width, height: Math.min(6000, hgt + 4) });
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(out, `${tab}${dark ? '-dark' : ''}-${width}.png`) });
    await page.setViewportSize({ width, height: 900 });
  }
  console.log(errors.length ? errors.join('\n') : 'エラーなし');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
