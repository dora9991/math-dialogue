#!/usr/bin/env node
/* 配布用の PDF を書き出す（index.html の印刷シート・ハンドブックを、ブラウザで開いて PDF にする）。
   使い方：  node tools/make-pdf.cjs            … pdf/ に書き出す
   Playwright が要る（npm i -g playwright。ブラウザは npx playwright install chromium）。
     ・計算単語帳_ペア用_セット1.pdf   … 全単元・全 STEP のセット1。両面印刷（長辺とじ）で、おもて＝問題／うら＝問題と答え
     ・計算単語帳_ハンドブック_小3-中3.pdf … ハンドブック（読み物）。先生メモつき
   問題の作り方を直したら、作り直す。 */
const path = require('path');
const { execSync } = require('child_process');
function load() {
  try { return require('playwright'); } catch (e) { /* 次へ */ }
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const { chromium } = load();
const root = path.resolve(__dirname, '..');
const url = 'file://' + path.join(root, 'index.html');
const jobs = [
  ['計算単語帳_ペア用_セット1.pdf', '#/sheet?mode=pair&u=all&step=all&from=1&to=1', null],
  ['計算単語帳_ハンドブック_小3-中3.pdf', '#/book', async (p) => { await p.click('#memo'); }],
];
(async () => {
  const b = await chromium.launch();
  for (const [name, hash, before] of jobs) {
    const p = await b.newPage();
    await p.goto(url + hash);
    await p.waitForTimeout(300);
    if (before) await before(p);
    const out = path.join(root, 'pdf', name);
    await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true, margin: name.includes('ハンドブック') ? { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } : undefined });
    console.log('書き出した：' + path.relative(process.cwd(), out));
    await p.close();
  }
  await b.close();
})();
