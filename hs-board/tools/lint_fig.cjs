// 使い方: node hs-board/tools/lint_fig.cjs <ID…>   （ID なし＝ js/lessons.js の 類題②（…b）全部）
//  黒板解説の 図（SVG）の 字の「重なり」と「図の 外への はみ出し」を、全ステップで さがす（発問は 正解を 選んだ 形・考えてみようは 答えを 出した 形）。
//  出るのは 候補。人の 目で 見て 決める。
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
let ids = process.argv.slice(2);
if (!ids.length) { const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, 'js/lessons.js'), 'utf8'))(w); ids = w.HB_LESSONS.map(l => l.id).filter(id => /\d+b$/.test(id)); }
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); let n = 0;
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  for (const ID of ids) {
    await p.goto('file://' + path.join(ROOT, 'play.html') + '?s=' + ID + '&step=0'); await p.waitForTimeout(900);
    const steps = await p.evaluate(() => HB_T.steps().length); const out = [];
    for (let k = 0; k < steps; k++) {
      const r = await p.evaluate(async (k) => {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        HB_T.go(k, true); const st = HB_T.steps()[k], a = st.ask;
        if (a && a.type === 'think') HB_T.reveal(); else if (a) HB_T.choose(a.ok);
        await sleep(60); if (HB_T.finish) HB_T.finish(); await sleep(60);
        const res = [];
        for (const svg of document.querySelectorAll('#board svg, .board svg, svg')) {
          const sr = svg.getBoundingClientRect(); if (sr.width < 60 || sr.height < 60) continue;   // KaTeX の 小さい svg は のぞく
          if (svg.closest('.katex')) continue;
          const ts = [...svg.querySelectorAll('text')].filter(t => { const cs = getComputedStyle(t); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > .3 && t.textContent.trim(); })
            .map(t => { const r = t.getBoundingClientRect(); return { s: t.textContent.trim(), l: r.left, r: r.right, t: r.top, b: r.bottom }; }).filter(t => t.r - t.l > 1);
          for (let i = 0; i < ts.length; i++) {
            const A = ts[i];
            if (A.l < sr.left - 3 || A.r > sr.right + 3 || A.t < sr.top - 3 || A.b > sr.bottom + 3) res.push(`図の外にはみ出し「${A.s}」`);
            for (let j = i + 1; j < ts.length; j++) { const B = ts[j]; if (A.s === B.s && Math.abs(A.l - B.l) < 1 && Math.abs(A.t - B.t) < 1) continue;
              // 字の 箱は 上下に 余白が ある（行の 高さ）ので、たては 60% に せばめて 比べる
              const sh = r => { const h = r.b - r.t; return { t: r.t + h * .2, b: r.b - h * .2 }; }, a2 = sh(A), b2 = sh(B);
              const w = Math.min(A.r, B.r) - Math.max(A.l, B.l), h = Math.min(a2.b, b2.b) - Math.max(a2.t, b2.t); if (w <= 2 || h <= 2) continue;
              const ar = w * h, sm = Math.min((A.r - A.l) * (a2.b - a2.t), (B.r - B.l) * (b2.b - b2.t)); if (ar / sm >= .2) res.push(`字の重なり「${A.s}」×「${B.s}」（${Math.round(ar / sm * 100)}%）`); }
          }
        }
        return [...new Set(res)];
      }, k);
      if (r.length) out.push(`  ステップ${k}（?step=${k}）: ` + r.join(' / '));
    }
    if (out.length) { n += out.length; console.log(ID + '\n' + out.join('\n')); }
  }
  await b.close(); console.log(`候補 ${n} 件（${ids.length} 本）`);
})();
