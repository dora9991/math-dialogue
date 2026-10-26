#!/usr/bin/env node
/* 授業スライドを、授業ごとの 1 ページ（slides/<授業のID>.html）にまとめる。
   使い方：node tools/build-slides.cjs            … slides-src/ の全部から、slides/ と data/slides.js をつくる
          node tools/build-slides.cjs --check     … つくらずに、検査だけ（数・id・画像・順番）

   スライドの元（slides-src/<単元>/<接頭字><授業の番号2けた>-<種類>.html）：1枚＝<section id="…"> が1つだけのファイル（1920×1080 の画面。
   スタイルは、すべてインライン。<aside> が、先生の速記メモ）。画像は、`img/<名前>.png`（slides/img/ にある）。
   接頭字：k＝空間図形（kukan）、d＝データの活用（data）、s＝式の計算（shiki）、r＝連立方程式（renritsu）、i＝一次関数（ichiji）
   種類（この順に並ぶ）：pair（ペア学習）・aim（めあて＋学習課題）・aim-a・word-q（ことば）・word-a・ex-q（例題）・ex-a・ex2-q・ex2-a・ex3-q・ex3-a・think（考えよう）・end（振り返り）
   できるもの：slides/<授業のID>.html（そのまま、ブラウザで開ける。矢印キー・タップで進む。F＝全画面、N＝先生のメモ、P＝印刷）、data/slides.js（授業のID → ページ・枚数） */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const PREFIX = { k: 'kukan', d: 'data', s: 'shiki', r: 'renritsu', i: 'ichiji' };
const KINDS = ['pair', 'aim', 'aim-a', 'word-q', 'word-a', 'ex-q', 'ex-a', 'ex2-q', 'ex2-a', 'ex3-q', 'ex3-a', 'think', 'end'];

// ikkan の授業データ（題・単元名を使う）
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
const dataDir = fs.readdirSync(path.join(root, 'data'));
for (const f of ['js/vendor/qrcode.js', 'js/core.js', 'js/qr.js', 'js/figs.js', 'js/figs3d.js', 'js/plan.js', 'js/rec.js', 'js/plansheet.js', 'data/lessons.js',
  ...dataDir.filter((f) => /^ws_.*\.js$/.test(f)).sort().map((f) => 'data/' + f),
  ...dataDir.filter((f) => /^lesson_.*\.js$/.test(f)).sort().map((f) => 'data/' + f)]) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const IK = ctx.IK;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const problems = [];
const bad = (m) => problems.push(m);

// 1) 元のファイルを読む
const lessons = {};   // 授業のID → [{ id, kind, file, html }]
const srcRoot = path.join(root, 'slides-src');
for (const unit of fs.existsSync(srcRoot) ? fs.readdirSync(srcRoot).sort() : []) {
  const dir = path.join(srcRoot, unit);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html')).sort()) {
    const m = /^([a-z])(\d{2})-([a-z0-9-]+)\.html$/.exec(f);
    if (!m || PREFIX[m[1]] !== unit) { bad(`${unit}/${f}：ファイル名が「<接頭字><番号2けた>-<種類>.html」でない（${unit} の接頭字は ${Object.keys(PREFIX).find((k) => PREFIX[k] === unit)}）`); continue; }
    const lid = `${unit}-${m[2]}`, kind = m[3];
    if (KINDS.indexOf(kind) < 0) { bad(`${unit}/${f}：種類 ${kind} は、決められた種類（${KINDS.join('・')}）にない`); continue; }
    const html = fs.readFileSync(path.join(dir, f), 'utf8').trim();
    const id = `${m[1]}${m[2]}-${kind}`;
    if ((html.match(/<section\b/g) || []).length !== 1 || !html.startsWith('<section') || !html.endsWith('</section>')) bad(`${unit}/${f}：<section> が、先頭から終わりまで1つだけの形でない`);
    if (!new RegExp(`<section id="${id}"`).test(html)) bad(`${unit}/${f}：section の id が ${id} でない`);
    for (const im of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
      if (!/^img\/[A-Za-z0-9_.-]+\.png$/.test(im[1])) bad(`${unit}/${f}：画像の場所 ${im[1]} は、img/<名前>.png にする`);
      else if (!fs.existsSync(path.join(root, 'slides', im[1]))) bad(`${unit}/${f}：画像 ${im[1]} が slides/img/ にない`);
    }
    if (/<script\b|<style\b|\bon[a-z]+=/i.test(html)) bad(`${unit}/${f}：<script>・<style>・イベント属性は使えない`);
    (lessons[lid] = lessons[lid] || []).push({ id, kind, file: `${unit}/${f}`, html });
  }
}
for (const lid of Object.keys(lessons)) {
  lessons[lid].sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind));
  const L = IK.lessons[lid];
  if (!L) { bad(`${lid}：ikkan にこの授業がない`); continue; }
  const kinds = lessons[lid].map((s) => s.kind);
  for (const need of ['pair', 'aim', 'end']) if (kinds.indexOf(need) < 0) bad(`${lid}：${need} の枚がない`);
  if (new Set(kinds).size !== kinds.length) bad(`${lid}：同じ種類の枚が2つある`);
  // 解答の枚（-a）の前に、問題の枚（-q／aim）がある
  for (const s of lessons[lid]) if (/-a$/.test(s.kind) && kinds.indexOf(s.kind.replace(/-a$/, s.kind === 'aim-a' ? '' : '-q')) < 0) bad(`${lid}：${s.kind} の前の問題の枚がない`);
}

if (problems.length) { console.log(problems.map((p) => '✗ ' + p).join('\n')); console.log(`\n✗ ${problems.length} 件`); process.exit(1); }

// 2) ページをつくる
const page = (lid, slides) => {
  const L = IK.lessons[lid], unitName = L.unitName || '', title = `${unitName}　${L.no || ''}　${L.title}`;
  const sections = slides.map((s) => s.html).join('\n');
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)}　スライド</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap">
<style>
html,body{margin:0;height:100%;background:#0f1722;color:#e6e9ec;font-family:'Noto Sans JP',-apple-system,BlinkMacSystemFont,'Hiragino Sans','Yu Gothic UI',sans-serif;overflow:hidden}
#stage{position:absolute;left:0;right:0;top:0;bottom:44px;overflow:hidden}
#deck{position:absolute;left:50%;top:50%;width:1920px;height:1080px;transform-origin:0 0}
#deck>section{position:absolute;left:0;top:0;width:1920px;height:1080px;box-sizing:border-box;overflow:hidden}
#deck>section:not(.on){display:none !important}   /* 各枚の style="display:flex" より強くする */
#deck p,#deck h1,#deck h2,#deck h3,#deck ul,#deck ol{margin:0}
#deck ul,#deck ol{padding-left:1.2em}
#deck table{border-collapse:collapse}
#deck th,#deck td{border:3px solid #2b3647;padding:6px 14px}   /* 表の罫線は、色ではなく、はっきりした濃い線（プロジェクターでも見える） */
#deck th{background:#eceff4}
${/^ichiji-/.test(lid) ? "#deck th,#deck td{border:0}   /* 一次関数の表：x・y の見出しの右だけ縦の線。数字のところには線を引かない */\n#deck tr>:first-child{border-right:3px solid #2b3647}\n#deck th{background:none}\n" : ''}#deck aside{display:none}
#bar{position:absolute;left:0;right:0;bottom:0;height:44px;display:flex;align-items:center;gap:6px;padding:0 10px;background:#18222f;border-top:1px solid #2a3647;font-size:14px;white-space:nowrap;overflow-x:auto}
#bar button,#bar a{font:inherit;color:#e6e9ec;background:#243245;border:1px solid #34455b;border-radius:8px;padding:5px 12px;cursor:pointer;text-decoration:none}
#bar button:hover,#bar a:hover{border-color:#7cb1ff}
#bar .sp{flex:1}
#bar .no{min-width:64px;text-align:center;font-variant-numeric:tabular-nums}
#notes{position:absolute;left:0;right:0;bottom:44px;max-height:42%;overflow:auto;padding:12px 18px;background:#fffdf5;color:#1f2933;font-size:16px;line-height:1.7;border-top:3px solid #d9730d;display:none;white-space:pre-wrap}
body.notes #notes{display:block}
@page{size:1920px 1080px;margin:0}
@media print{
  html,body{height:auto;overflow:visible;background:#fff}
  #bar,#notes{display:none !important}
  #stage{position:static}
  #deck{position:static;transform:none !important;width:auto;height:auto}
  #deck>section:not(.on),#deck>section{display:flex !important;position:relative;break-after:page;page-break-after:always}
}
</style>
</head>
<body>
<div id="stage"><div id="deck">
${sections}
</div></div>
<div id="notes" aria-live="polite"></div>
<div id="bar">
  <button type="button" id="prev" aria-label="前へ">◀</button><span class="no" id="no"></span><button type="button" id="next" aria-label="次へ">▶</button>
  <span class="sp"></span>
  <button type="button" id="nt" title="先生のメモ（N）">メモ</button>
  <button type="button" id="fs" title="全画面（F）">全画面</button>
  <button type="button" id="pr" title="1枚ずつ印刷・PDF（P）">印刷</button>
</div>
<script>
(function () {
  var S = [].slice.call(document.querySelectorAll('#deck>section')), cur = 0, deck = document.getElementById('deck'), stage = document.getElementById('stage');
  function fit() { var w = stage.clientWidth, h = stage.clientHeight, k = Math.min(w / 1920, h / 1080); deck.style.transform = 'translate(' + (-960 * k) + 'px,' + (-540 * k) + 'px) scale(' + k + ')'; }
  function show(i, noHash) {
    cur = Math.max(0, Math.min(S.length - 1, i));
    S.forEach(function (s, j) { s.classList.toggle('on', j === cur); });
    document.getElementById('no').textContent = (cur + 1) + ' / ' + S.length;
    var a = S[cur].querySelector('aside'); document.getElementById('notes').textContent = a ? a.textContent.trim() : '（この枚のメモはありません）';
    if (!noHash) { try { history.replaceState(null, '', '#' + S[cur].id); } catch (e) {} }
  }
  function fromHash() { var h = location.hash.replace('#', ''), j = S.findIndex(function (s) { return s.id === h; }); if (j < 0 && /^\\d+$/.test(h)) j = +h - 1; show(j < 0 ? 0 : j, true); }
  document.getElementById('prev').onclick = function () { show(cur - 1); };
  document.getElementById('next').onclick = function () { show(cur + 1); };
  document.getElementById('nt').onclick = function () { document.body.classList.toggle('notes'); fit(); };
  document.getElementById('pr').onclick = function () { window.print(); };
  document.getElementById('fs').onclick = function () { var d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen(); };
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { show(cur + 1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { show(cur - 1); e.preventDefault(); }
    else if (k === 'Home') show(0); else if (k === 'End') show(S.length - 1);
    else if (k === 'f' || k === 'F') document.getElementById('fs').click();
    else if (k === 'n' || k === 'N') document.getElementById('nt').click();
    else if (k === 'p' || k === 'P') window.print();
  });
  var x0 = null;
  stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); else { var r = stage.getBoundingClientRect(), x = e.changedTouches[0].clientX - r.left; show(cur + (x < r.width * 0.3 ? -1 : 1)); } });
  stage.addEventListener('click', function (e) { var r = stage.getBoundingClientRect(); show(cur + ((e.clientX - r.left) < r.width * 0.3 ? -1 : 1)); });
  window.addEventListener('resize', fit); window.addEventListener('hashchange', fromHash);
  fit(); fromHash();
})();
</script>
</body>
</html>
`;
};

const registry = {};
for (const lid of Object.keys(lessons).sort()) {
  const slides = lessons[lid];
  registry[lid] = { n: slides.length, file: `slides/${lid}.html` };
  if (!CHECK) fs.writeFileSync(path.join(root, 'slides', `${lid}.html`), page(lid, slides));
}
const js = `/* 授業スライドの一覧（tools/build-slides.cjs が書く。手で直さない）。授業のID → { n: 枚数, file: ページ } */
(function () {
  window.IK = window.IK || {};
  IK.slides = ${JSON.stringify(registry, null, 1).replace(/\n\s*/g, ' ').replace(/\{ "/, '{\n  "').replace(/\}, "/g, '},\n  "').replace(/ \}$/, '\n}')};
})();
`;
if (!CHECK) fs.writeFileSync(path.join(root, 'data', 'slides.js'), js);
const total = Object.values(registry).reduce((a, r) => a + r.n, 0);
console.log(`${CHECK ? '検査' : '書き出した'}：授業 ${Object.keys(registry).length} 本・スライド ${total} 枚`);
