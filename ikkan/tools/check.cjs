#!/usr/bin/env node
/* 見た目の検査：全ワークシートを、生徒用（解答なし）と解答つきで開き、はみ出しを調べて、紙面の画像（PNG）を書き出す。
   使い方：  NODE_PATH=$(npm root -g) node tools/check.cjs [画像の出力先フォルダ] [授業のID …]
   必要なもの：playwright（npm i -g playwright。Chromium は PLAYWRIGHT_BROWSERS_PATH にあればそれを使う）
   調べること：①ブロックの行数に文字がおさまっているか　②1ページの行数をこえていないか　③字が横にはみ出していないか */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const outDir = path.resolve(process.argv[2] || path.join(root, 'tools', '_out'));
  const only = process.argv.slice(3);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.join(root, 'index.html') + '#/');
  const ids = await page.evaluate(() => IK.order.slice());
  let bad = 0;
  for (const id of ids.filter(i => !only.length || only.includes(i))) {
    for (const ans of [false, true]) {
      await page.goto('file://' + path.join(root, 'index.html') + '#/' + id + (ans ? '/ans' : ''));
      await page.reload();
      await page.evaluate(() => { document.querySelector('.pages').style.zoom = 1; });
      const res = await page.evaluate(() => {
        const px = document.querySelector('.wsp').style.getPropertyValue('--pitch');
        const pitchPx = parseFloat(px) * 96 / 25.4, issues = [];
        document.querySelectorAll('.wsp').forEach((sp, pi) => {
          const body = sp.querySelector('.wsp-body'), flow = sp.querySelector('.wsp-flow');
          const rows = Math.round(body.getBoundingClientRect().height / pitchPx), used = Math.round(flow.getBoundingClientRect().height / pitchPx * 100) / 100;
          if (used > rows + 0.01) issues.push(`ページ${pi + 1}：${used}行を使っている（上限 ${rows}行）`);
          sp.querySelectorAll('.wb-t, .wb-b').forEach(b => {
            const tx = b.querySelector('.tx'); if (!tx || getComputedStyle(tx).display === 'none') return;
            const lines = tx.getBoundingClientRect().height / pitchPx, have = b.getBoundingClientRect().height / pitchPx;
            const label = (b.querySelector('.tag') ? b.querySelector('.tag').textContent + '：' : '板書：') + tx.textContent.slice(0, 18);
            if (lines > have + 0.05) issues.push(`ページ${pi + 1} 行あふれ（${have}行の枠に ${Math.round(lines * 100) / 100}行）「${label}」`);
            if (tx.scrollWidth > tx.clientWidth + 1) issues.push(`ページ${pi + 1} 横はみ出し「${label}」`);
          });
          // 図：SVG の中の字が図の枠の外に出ていないか
          sp.querySelectorAll('.fsvg').forEach((sv, k) => {
            const r = sv.getBoundingClientRect();
            sv.querySelectorAll('text').forEach(t => {
              if (t.getClientRects().length === 0) return;   // 解答を出していないときの赤い字は、見えていない
              const b = t.getBoundingClientRect();
              if (b.left < r.left - 1 || b.right > r.right + 1 || b.top < r.top - 1 || b.bottom > r.bottom + 1) issues.push(`ページ${pi + 1} 図${k + 1}の字が枠の外：「${t.textContent}」`);
            });
          });
        });
        return { issues, rows: Math.round(document.querySelector('.wsp-body').getBoundingClientRect().height / pitchPx) };
      });
      const tag = ans ? 'ans' : 'student';
      const n = await page.locator('.wsp').count();
      for (let i = 0; i < n; i++) await page.locator('.wsp').nth(i).screenshot({ path: path.join(outDir, `${id}_${tag}_p${i + 1}.png`) });
      if (res.issues.length) { bad += res.issues.length; console.log(`✗ ${id}（${ans ? '解答つき' : '生徒用'}）`); res.issues.forEach(s => console.log('   ' + s)); }
      else console.log(`○ ${id}（${ans ? '解答つき' : '生徒用'}）　${n}ページ・指摘 0`);
    }
  }
  if (errors.length) { bad += errors.length; console.log('ブラウザのエラー：'); errors.forEach(e => console.log('   ' + e)); }
  await browser.close();
  console.log(`画像：${outDir}`);
  process.exit(bad ? 1 : 0);
})();
