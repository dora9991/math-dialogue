// 使い方: node suii/tools/lint_board.cjs <ページの html...> [--json <出力>]
//  黒板の ページの「見た目の バグ」を 機械で さがす（動きは 止めて、問題の 画面と 答えの 画面の 両方を 見る）。
//   (1) 図（canvas）の 字どうしの 重なり　(2) 図の 字が 図の 外に はみ出す
//   (3) 右の らん（問題・小問・答え）が 下に あふれて 切れる　(4) 答えを 出す 前の 画面に、答えの 数が 図に 出ている（先見え の 候補）
//  画面の 大きさは 1280×720 と 1920×1080。出るのは「候補」。人の 目で 写真を 見て 決める。
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs'); const http = require('http');
const args = process.argv.slice(2); const ji = args.indexOf('--json'); const jsonOut = ji >= 0 ? args[ji + 1] : null;
const pages = args.filter((a, i) => a.endsWith('.html') && (ji < 0 || i !== ji + 1));
const ROOT = path.resolve(__dirname, '../..');
const srv = http.createServer((q, r) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0].split('#')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  const ext = path.extname(p); r.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' }[ext] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});
const HOOK = () => {
  const P = CanvasRenderingContext2D.prototype; let cur = []; window.__last = [];
  const cr = P.clearRect; P.clearRect = function (x, y, w, h) { if (this.canvas.id === 'cv' && w > 200) { window.__last = cur; cur = []; } return cr.apply(this, arguments); };
  const ft = P.fillText; P.fillText = function (s, x, y) {
    try {
      if (this.canvas.id === 'cv' && String(s).trim()) {
        const m = this.measureText(s), t = this.getTransform(), dpr = window.devicePixelRatio || 1;
        const X = (x * t.a + t.e) / dpr, Y = (y * t.d + t.f) / dpr, k = t.a / dpr;
        cur.push({ s: String(s), l: X - m.actualBoundingBoxLeft * k, r: X + m.actualBoundingBoxRight * k, t: Y - m.actualBoundingBoxAscent * k, b: Y + m.actualBoundingBoxDescent * k, a: this.globalAlpha, base: Y });
      }
    } catch (e) { }
    return ft.apply(this, arguments);
  };
};
// となり合う 字の かたまり（× ÷ で 字体を 分けて かく もの）を 1つに まとめる
function merge(ts) {
  const out = [];
  for (const t of ts) {
    const p = out[out.length - 1];
    // まとめるのは × ÷ の ところで 分けて かいた 字だけ（数どうしが 少し 重なって いるのを「1つの 字」と まちがえない）
    if (p && (/^[×÷]$/.test(t.s) || /[×÷]$/.test(p.s)) && Math.abs(p.base - t.base) < 0.6 && Math.abs(t.l - p.r) < 3 && Math.abs(p.a - t.a) < 0.01) { p.s += t.s; p.r = t.r; p.t = Math.min(p.t, t.t); p.b = Math.max(p.b, t.b); }
    else out.push({ ...t });
  }
  return out;
}
function overlaps(ts) {
  const v = ts.filter(t => t.a >= 0.35 && t.r - t.l > 1), res = [];
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) {
    const A = v[i], B = v[j]; if (A.s === B.s && Math.abs(A.l - B.l) < 1 && Math.abs(A.t - B.t) < 1) continue;   // 同じ 字を 同じ 所に 2回
    const w = Math.min(A.r, B.r) - Math.max(A.l, B.l), h = Math.min(A.b, B.b) - Math.max(A.t, B.t);
    if (w <= 1.5 || h <= 1.5) continue;
    const ar = w * h, sm = Math.min((A.r - A.l) * (A.b - A.t), (B.r - B.l) * (B.b - B.t));
    if (ar / sm >= 0.18) res.push(`「${A.s}」×「${B.s}」（重なり ${Math.round(ar / sm * 100)}%）`);
  }
  return res;
}
(async () => {
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok)); const port = srv.address().port;
  const b = await chromium.launch(); const all = [];
  for (const pg of pages) {
    const rel = path.relative(ROOT, path.resolve(pg)).split(path.sep).join('/');
    for (const [vw, vh] of [[1280, 720], [1920, 1080]]) {
      const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'reduce' }); const p = await ctx.newPage();
      await p.addInitScript(HOOK); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
      await p.goto(`http://127.0.0.1:${port}/${rel}`); await p.waitForTimeout(700);
      const total = +(await p.textContent('#pt')); let guard = 0, prob = { text: '', canvas: '' }, q0 = null, seen = new Set();
      while (guard++ < total * 3 + 5) {
        await p.waitForTimeout(220);
        const s = await p.evaluate(() => {
          const $ = id => document.getElementById(id), cv = $('cv').getBoundingClientRect(), pn = $('panel'), pr = pn.getBoundingClientRect();
          const vis = e => e && !e.hidden && e.getBoundingClientRect().height > 0;
          const kids = ['q', 'ansbox', 'notes', 'blist'].map($).filter(vis).map(e => { const r = e.getBoundingClientRect(); return { id: e.id, t: r.top, b: r.bottom, sh: e.scrollHeight, ch: e.clientHeight }; });
          return { n: +$('pn').textContent, hasAns: !$('ansbox').hidden, shown: !!$('ans').textContent, q: $('q').textContent, notes: $('notes').textContent, ans: $('ans').textContent + ' ' + $('sub').textContent,
            tag: $('tag').textContent, cvw: cv.width, cvh: cv.height, texts: window.__last.slice(), panel: { t: pr.top, b: pr.bottom, sh: pn.scrollHeight, ch: pn.clientHeight }, kids, dis: $('next').disabled };
        });
        const ts = merge(s.texts), where = `${rel} [${vw}×${vh}] ステップ${s.n}（${s.tag}）${s.hasAns ? (s.shown ? '答え' : '問い') : '問題'}`, issues = [];
        overlaps(ts).forEach(o => issues.push('字の重なり ' + o));
        ts.filter(t => t.a >= 0.35 && (t.l < -2 || t.t < -2 || t.r > s.cvw + 2 || t.b > s.cvh + 2)).forEach(t => issues.push(`図の外にはみ出し「${t.s}」`));
        const nb = s.kids.filter(k => k.id !== 'blist');   // blist（板書の まとめ）は、たまると スクロールする つくり
        nb.forEach(k => { if (k.b > s.panel.b + 2) issues.push(`右のらんが下に切れる（${k.id}：${Math.round(k.b - s.panel.b)}px）`); });
        s.kids.filter(k => k.id === 'blist').forEach(k => { if (k.b > s.panel.b + 6) issues.push(`右のらんの「これまでの答え」が下にかくれる（${Math.round(k.b - s.panel.b)}px。らんを スクロールしないと 新しい行が 見えない）`); });
        for (let i = 0; i < s.kids.length; i++) for (let j = i + 1; j < s.kids.length; j++) { const A = s.kids[i], B = s.kids[j]; if (Math.min(A.b, B.b) - Math.max(A.t, B.t) > 3) issues.push(`右のらんの重なり（${A.id} と ${B.id}：${Math.round(Math.min(A.b, B.b) - Math.max(A.t, B.t))}px）`); }
        const ctext = ts.filter(t => t.a >= 0.35).map(t => t.s).join(' ');
        const strs = ts.filter(t => t.a >= 0.35).map(t => t.s);
        if (!s.hasAns) { prob = { text: s.q + ' ' + s.notes, canvas: ctext }; seen = new Set(strs); }
        else if (!s.shown) {
          q0 = { q: s.q, canvas: ctext, where };
          // 問いの 画面で、はじめて 図に 出た 字（数だけの 字＝目もり・表の 数 は のぞく）。答えや 途中の 結果が 先に 見えて いないか、目で 見る 候補
          const fresh = [...new Set(strs.filter(x => !seen.has(x) && /\d/.test(x) && !/^[\s\d.,\-−+＋%％°]+$/.test(x)))];
          if (fresh.length) all.push(where + '\n    問いの画面で新しく出た字（先見えでないか見る）：' + fresh.map(x => '「' + x + '」').join(' '));
        }
        else if (q0) {   // 答えの 数（2けた以上・小数・分数）が、答えを 出す 前の 図に あり、問題文・問いには ない
          const nums = [...new Set((s.ans.match(/\d+(?:\.\d+)?(?:\/\d+)?/g) || []).filter(x => x.length >= 2))];
          const base = prob.text + ' ' + prob.canvas + ' ' + q0.q;
          const early = nums.filter(x => new RegExp('(^|[^\\d.])' + x.replace('.', '\\.') + '($|[^\\d.])').test(q0.canvas) && !new RegExp('(^|[^\\d.])' + x.replace('.', '\\.') + '($|[^\\d.])').test(base));
          if (early.length) all.push(q0.where + '\n    答えの先見えの候補：' + early.join('・') + '　（答え：' + s.ans.trim().slice(0, 60) + '）');
          q0 = null;
        }
        if (s.hasAns && s.shown) strs.forEach(x => seen.add(x));
        if (issues.length) all.push(where + '\n    ' + [...new Set(issues)].join('\n    '));
        if (s.dis) break;
        await p.keyboard.press('ArrowRight');
      }
      await ctx.close();
    }
  }
  await b.close(); srv.close();
  console.log(all.join('\n')); console.log(`候補 ${all.length} 件`);
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(all, null, 1));
})();
