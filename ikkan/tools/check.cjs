#!/usr/bin/env node
/* 見た目の検査：全授業の、ワークシート・演習プリント（生徒用／解答つき）と授業計画を開き、はみ出しを調べて、紙面の画像（PNG）を書き出す。
   使い方：  NODE_PATH=$(npm root -g) node tools/check.cjs [画像の出力先フォルダ] [授業のID …]
   3点セットのタブ（#/ID/set）は、ページ数（ワークシート＋演習プリント＋小テスト）と、印刷（PDF）のページ数も調べる
   必要なもの：playwright（npm i -g playwright。Chromium は PLAYWRIGHT_BROWSERS_PATH にあればそれを使う）
   調べること：①ブロックの行数に文字がおさまっているか　②1ページの行数をこえていないか　③字が横にはみ出していないか
              ④授業計画が A4 1枚におさまっているか（下の「準備・教卓」と重ならないか） */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const outDir = path.resolve(process.argv[2] || path.join(root, 'tools', '_out'));
  const only = process.argv.slice(3);
  fs.mkdirSync(outDir, { recursive: true });
  const url = 'file://' + path.join(root, 'index.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url + '#/');
  const lessons = await page.evaluate(() => IK.order.map(id => ({ id, plan: !!IK.plans[id], dr: !!IK.drills[id], qz: !!IK.quizzes[id] })));
  let bad = 0;

  for (const L of lessons.filter(l => !only.length || only.includes(l.id))) {
    const jobs = [['ws', false], ['ws', true]];
    if (L.dr) jobs.push(['dr', false], ['dr', true]);
    if (L.qz) jobs.push(['qz', false], ['qz', true]);
    if (L.plan) jobs.push(['plan', false]);
    for (const [tab, ans] of jobs) {
      await page.goto(url + '#/' + L.id + '/' + tab + (ans ? '/ans' : ''));
      await page.reload();
      await page.waitForSelector('.wsp');
      await page.evaluate(() => { document.querySelector('.pages').style.zoom = 1; });
      const res = await page.evaluate(() => {
        const issues = [], first = document.querySelector('.wsp');
        const pitchPx = parseFloat(first.style.getPropertyValue('--pitch') || '7') * 96 / 25.4;
        document.querySelectorAll('.wsp').forEach((sp, pi) => {
          if (sp.classList.contains('plan-page')) {
            const body = sp.querySelector('.plan-body'), prep = sp.querySelector('.pl-prep'), tips = sp.querySelector('.pl-tips');
            const last = tips || sp.querySelector('.pl-low');
            if (body.scrollHeight > body.clientHeight + 1) issues.push(`授業計画が A4 1枚におさまらない（${body.scrollHeight}px ＞ ${body.clientHeight}px）`);
            if (last && prep && last.getBoundingClientRect().bottom > prep.getBoundingClientRect().top - 2) issues.push('授業計画：下の「準備・教卓」と、内容が重なっている');
            return;
          }
          const mid = sp.querySelector('.wh-mid');
          if (mid && mid.scrollWidth > mid.clientWidth + 1) issues.push(`ページ${pi + 1}：上の題（${mid.textContent}）が、はみ出して「…」になる`);
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
          sp.querySelectorAll('.wt').forEach((t, k) => {   // 表が、枠の高さを超えていないか
            const box = t.parentElement.getBoundingClientRect(), tb = t.getBoundingClientRect();
            if (tb.height > box.height + 1) issues.push(`ページ${pi + 1} 表${k + 1}が枠より高い（${Math.round(tb.height)}px ＞ ${Math.round(box.height)}px）`);
            t.querySelectorAll('td,th').forEach(c => { if (c.scrollWidth > c.clientWidth + 1) issues.push(`ページ${pi + 1} 表${k + 1}のセルが横にはみ出し「${c.textContent.slice(0, 10)}」`); });
          });
          sp.querySelectorAll('.fsvg').forEach((sv, k) => {   // 図：SVG の中の字が図の枠の外に出ていないか
            const r = sv.getBoundingClientRect();
            sv.querySelectorAll('text').forEach(t => {
              if (t.getClientRects().length === 0) return;   // 解答を出していないときの赤い字は、見えていない
              const b = t.getBoundingClientRect();
              if (b.left < r.left - 1 || b.right > r.right + 1 || b.top < r.top - 1 || b.bottom > r.bottom + 1) issues.push(`ページ${pi + 1} 図${k + 1}の字が枠の外：「${t.textContent}」`);
            });
          });
        });
        return { issues };
      });
      const mode = tab === 'plan' ? '授業計画' : (ans ? '解答つき' : '生徒用'), tag = tab === 'plan' ? 'plan' : (ans ? 'ans' : 'student');
      const n = await page.locator('.wsp').count();
      for (let i = 0; i < n; i++) await page.locator('.wsp').nth(i).screenshot({ path: path.join(outDir, `${L.id}_${tab}_${tag}_p${i + 1}.png`) });
      const name = `${L.id}（${tab === 'dr' ? '演習プリント・' : tab === 'qz' ? '小テスト・' : tab === 'plan' ? '' : 'ワークシート・'}${mode}）`;
      if (res.issues.length) { bad += res.issues.length; console.log(`✗ ${name}`); res.issues.forEach(s => console.log('   ' + s)); }
      else console.log(`○ ${name}　${n}ページ・指摘 0`);
    }
  }
  // 3点セット：ページ数と、印刷（PDF）のページ数
  for (const L of lessons.filter(l => (!only.length || only.includes(l.id)) && (l.dr || l.qz))) {
    await page.goto(url + '#/' + L.id + '/set');
    await page.reload();
    await page.waitForSelector('.wsp');
    const want = await page.evaluate(id => [IK.lessons[id], IK.drills[id], IK.quizzes[id]].filter(Boolean).reduce((a, sh) => a + sh.blocks.filter(b => b.type === 'break').length + 1, 0), L.id);
    const got = await page.locator('.wsp').count();
    const ansOn = await page.evaluate(() => document.body.classList.contains('ans-on'));
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const pdfPages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    const msgs = [];
    if (got !== want) msgs.push(`3点セットのページ数が ${got}（${want} ページのはず）`);
    if (ansOn) msgs.push('3点セットを開いたとき、解答が出ている');
    if (pdfPages !== want) msgs.push(`印刷（PDF）のページ数が ${pdfPages}（${want} ページのはず）`);
    if (msgs.length) { bad += msgs.length; console.log(`✗ ${L.id}（3点セット）`); msgs.forEach(m => console.log('   ' + m)); }
    else console.log(`○ ${L.id}（3点セット）　${got}ページ・印刷 ${pdfPages}ページ（両面なら ${Math.ceil(want / 2)}枚＋）`);
  }
  if (errors.length) { bad += errors.length; console.log('ブラウザのエラー：'); errors.forEach(e => console.log('   ' + e)); }
  await browser.close();
  console.log(`画像：${outDir}`);
  process.exit(bad ? 1 : 0);
})();
