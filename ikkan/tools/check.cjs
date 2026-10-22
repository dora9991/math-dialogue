#!/usr/bin/env node
/* 見た目の検査：全授業の、ワークシート・演習プリント（生徒用／解答つき）と授業計画を開き、はみ出しを調べて、紙面の画像（PNG）を書き出す。
   使い方：  NODE_PATH=$(npm root -g) node tools/check.cjs [画像の出力先フォルダ] [授業のID …]
   3点セットのタブ（#/ID/set）は、ページ数（ワークシート＋演習プリント＋小テスト）と、印刷（PDF）のページ数も調べる
   単元まとめ印刷（#/print/<単元>）も、ページ数（両面印刷の白紙をふくむ）と、印刷（PDF）のページ数を調べる（授業のIDを指定したときは、しない）
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
  const lessons = await page.evaluate(() => IK.order.map(id => ({ id, plan: !!IK.plans[id], dr: !!IK.drills[id], qz: !!IK.quizzes[id], trial: /試作/.test(IK.lessons[id].no || '') })));
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
      const res = await page.evaluate(trial => {
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
          // 図が、ほかの図や、ほかのブロックと重なっていないか。図の中の字どうしが重なっていないか
          const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          const figsAll = [...sp.querySelectorAll('.fsvg')], blocksAll = [...sp.querySelectorAll('.wb')];
          figsAll.forEach((f, i) => {
            if (trial) return;   // 旧形式の試作（座標の目もりなど）は、しらべない
            const rf = f.getBoundingClientRect();
            figsAll.forEach((g, j) => { if (j > i && inter(rf, g.getBoundingClientRect()) > 16) issues.push(`ページ${pi + 1} 図${i + 1}と図${j + 1}が重なっている`); });
            blocksAll.forEach(b => {
              if (b.contains(f) || f.contains(b) || b.querySelector('.fsvg')) return;
              const rb = b.getBoundingClientRect(), a = inter(rf, rb);
              if (a > 16 && !b.querySelector('.tx') && !b.querySelector('table')) return;   // 中身のない枠は、ふくめない
              if (a > 16) issues.push(`ページ${pi + 1} 図${i + 1}が、ほかのブロック「${(b.textContent || '').trim().slice(0, 14)}」と重なっている（${Math.round(a)}px²）`);
            });
            const shapes = [...f.querySelectorAll('line,polyline,polygon,path,circle,ellipse')].filter(e => e.getClientRects().length && !e.closest('defs'));
            let out = 0; shapes.forEach(e => { const q = e.getBoundingClientRect(); if (q.left < rf.left - 3 || q.right > rf.right + 3 || q.top < rf.top - 3 || q.bottom > rf.bottom + 3) out++; });
            if (out) issues.push(`ページ${pi + 1} 図${i + 1}の線が、図の枠の外に ${out}本 出ている（となりの図や字と重なるおそれ）`);
            // 図の中の字が、線（辺・だ円・曲線など）の上にのっていないか（字の高さのまん中あたりを、線が横切っているものだけ）
            const txs = [...f.querySelectorAll('text')].filter(t => t.getClientRects().length && !t.closest('.cap') && (t.textContent || '').trim());
            const geos = [...f.querySelectorAll('line,polyline,polygon,path,circle,ellipse')].filter(e => e.getClientRects().length && e.getTotalLength && !e.closest('defs'));
            const hitTexts = new Set();
            const whites = [...f.querySelectorAll('rect[fill="#fff"]')].map(e => e.getBoundingClientRect()).filter(q => q.width < rf.width * 0.5 && q.height < rf.height * 0.3);   // 字の白い地
            geos.forEach(g => {
              const L = g.getTotalLength(), m = g.getScreenCTM(); if (!m || !L) return;
              const pts = []; const step = Math.max(L / 400, 0.2);
              for (let d = 0; d <= L; d += step) { const q = g.getPointAtLength(d); pts.push([m.a * q.x + m.c * q.y + m.e, m.b * q.x + m.d * q.y + m.f]); }
              txs.forEach(t => {
                if (t.contains(g)) return;
                if (t.getAttribute('stroke') === '#fff') return;   // 白いふちの字は、線にかさねてよい
                if (whites.some(w => w.left <= (t.getBoundingClientRect().left + t.getBoundingClientRect().right) / 2 && w.right >= (t.getBoundingClientRect().left + t.getBoundingClientRect().right) / 2 && w.top <= (t.getBoundingClientRect().top + t.getBoundingClientRect().bottom) / 2 && w.bottom >= (t.getBoundingClientRect().top + t.getBoundingClientRect().bottom) / 2)) return;   // 白い地の上の字は、線にかさねてよい
                const r = t.getBoundingClientRect(), h = r.height, x0 = r.left + r.width * 0.12, x1 = r.right - r.width * 0.12, y0 = r.top + h * 0.25, y1 = r.bottom - h * 0.25;
                if (x1 <= x0 || y1 <= y0) return;
                const n = pts.filter(q => q[0] >= x0 && q[0] <= x1 && q[1] >= y0 && q[1] <= y1).length;
                if (n >= 2) hitTexts.add(t.textContent.trim());
              });
            });
            hitTexts.forEach(tt => issues.push(`ページ${pi + 1} 図${i + 1}の字「${tt}」が、線とかさなっている`));
            const ts = [...f.querySelectorAll('text')].filter(t => t.getClientRects().length);
            for (let x = 0; x < ts.length; x++) for (let y = x + 1; y < ts.length; y++) {
              const ra = ts[x].getBoundingClientRect(), rb2 = ts[y].getBoundingClientRect(), ov = inter(ra, rb2), mn = Math.min(ra.width * ra.height, rb2.width * rb2.height);
              if (mn > 0 && ov / mn > 0.25) issues.push(`ページ${pi + 1} 図${i + 1}の字どうしが重なっている：「${ts[x].textContent}」と「${ts[y].textContent}」`);
            }
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
      }, L.trial);
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
  // 単元まとめ印刷：ページ数（両面印刷の白紙をふくむ）と、印刷（PDF）のページ数
  if (!only.length) {
    const units = await page.evaluate(() => IK.units.map(u => {
      const ids = IK.order.filter(id => IK.lessons[id].unit === u.key && (IK.plans[id] || IK.drills[id] || IK.quizzes[id]));
      const docs = ids.flatMap(id => [IK.lessons[id], IK.drills[id], IK.quizzes[id]].filter(Boolean)).map(sh => sh.blocks.filter(b => b.type === 'break').length + 1);
      return { key: u.key, n: ids.length, pages: docs.reduce((a, c) => a + c, 0), blanks: docs.filter((n, i) => n % 2 === 1 && i < docs.length - 1).length };
    }).filter(u => u.n));
    for (const u of units) {
      await page.goto(url + '#/print/' + u.key);
      await page.reload();
      await page.waitForSelector('.pbar');
      const got = await page.locator('.wsp').count(), blank = await page.locator('.wsp-blank').count();
      const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      const pdfPages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
      const want = u.pages + u.blanks, msgs = [];
      if (got !== want) msgs.push(`ページ数が ${got}（${want} ページのはず）`);
      if (blank !== u.blanks) msgs.push(`白紙が ${blank} ページ（${u.blanks} ページのはず）`);
      if (pdfPages !== want) msgs.push(`印刷（PDF）のページ数が ${pdfPages}（${want} ページのはず）`);
      await page.setViewportSize({ width: 390, height: 800 });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) msgs.push('スマホの幅で、横にはみ出している');
      await page.setViewportSize({ width: 1000, height: 1300 });
      if (msgs.length) { bad += msgs.length; console.log(`✗ ${u.key}（単元まとめ印刷）`); msgs.forEach(m => console.log('   ' + m)); }
      else console.log(`○ ${u.key}（単元まとめ印刷）　${u.n}時間・${got}ページ（白紙 ${blank}）・印刷 ${pdfPages}ページ`);
    }
  }
  if (errors.length) { bad += errors.length; console.log('ブラウザのエラー：'); errors.forEach(e => console.log('   ' + e)); }
  await browser.close();
  console.log(`画像：${outDir}`);
  process.exit(bad ? 1 : 0);
})();
