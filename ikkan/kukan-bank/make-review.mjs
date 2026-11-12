// make-review.mjs — bank.json から、先生が300問を目で確かめるための確認ページ（review.html）をつくる。
//
//   node ikkan/kukan-bank/make-review.mjs            → review.html（このフォルダ。単独で開ける）
//   node ikkan/kukan-bank/make-review.mjs --fragment <出力パス>   → Artifact に載せる用（doctype・head なしの本体だけ）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bank = JSON.parse(fs.readFileSync(path.join(HERE, "bank.json"), "utf8"));
const meta = JSON.parse(fs.readFileSync(path.join(HERE, "meta.json"), "utf8"));
const redis = JSON.parse(fs.readFileSync(path.join(HERE, "existing-redistribution.json"), "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const br = (s) => esc(s).replace(/\n/g, "<br>");
const LEVEL = { 1: "簡単", 2: "普通", 3: "難しい", 4: "入試レベル" };

const lessons = [];
for (let n = 1; n <= 15; n++) {
  const id = `kukan-${String(n).padStart(2, "0")}`;
  const first = bank.find((p) => p.l === id);
  lessons.push({ id, n, name: meta[first.id].lessonName, count: bank.filter((p) => p.l === id).length, existing: redis.perLesson[id] || 0 });
}
const wrongs = bank.flatMap((p) => p.c.filter((c) => !c.k));
const withReason = wrongs.filter((c) => c.w).length;

const card = (p) => {
  const lis = p.c.map((c, i) => {
    const mark = c.k ? '<span class="mark ok" aria-label="正解">◎</span>' : '<span class="mark"></span>';
    const why = c.w ? `<span class="why">${esc(c.w)}</span>` : "";
    return `<li class="${c.k ? "right" : ""}">${mark}<span class="lab">${"ABCD"[i]}</span><span class="txt">${esc(c.t)}${why}</span></li>`;
  }).join("");
  return `<article class="prob" data-l="${p.l}" data-d="${p.d}" id="${p.id}">
  <header><span class="lv lv${p.d}">${LEVEL[p.d]}</span><span class="pid">${p.id}</span></header>
  <p class="q">${esc(p.q)}</p>
  <ol class="choices">${lis}</ol>
  <details><summary>解説とヒント</summary><p class="e">${br(p.e)}</p>${p.h ? `<p class="h"><b>ヒント</b> ${esc(p.h)}</p>` : ""}</details>
</article>`;
};

const sections = lessons.map((ls) => `<section class="lesson" data-l="${ls.id}">
<h2><span class="no">${String(ls.n).padStart(2, "0")}</span>${esc(ls.name)}<span class="cnt">${ls.count}問</span></h2>
<div class="grid">${bank.filter((p) => p.l === ls.id).map(card).join("\n")}</div>
</section>`).join("\n");

const rows = lessons.map((ls) => `<tr><td>${String(ls.n).padStart(2, "0")}</td><td>${esc(ls.name)}</td><td class="num">${ls.count}</td><td class="num">${ls.existing || "―"}</td></tr>`).join("");
const rules = redis.rules.map((r) => `<tr><td>${esc(r.ids)}</td><td class="num">${r.count}</td><td>${r.lesson.slice(-2)} ${esc(r.lessonName)}</td><td>${esc(r.what)}${r.note ? `<br><small>${esc(r.note)}</small>` : ""}</td></tr>`).join("");

const STYLE = `
/* 確認ページ：左に解説の目次、右に問題カード。ふだんの先生の作業（解説を選ぶ→段階を選ぶ→1問ずつ見る）に合わせる。 */
:root {
  --bg: #f6f7f4; --surface: #ffffff; --ink: #1c2420; --ink2: #5a655f; --line: #dde2dc; --accent: #1f6f5c; --accent-soft: #e3f0eb;
  --ok: #1f6f5c; --ok-bg: #e3f0eb; --warn-bg: #fbf1d8; --warn-ink: #6b4a00;
  --lv1: #4f8f7b; --lv2: #3f7fb0; --lv3: #b0791f; --lv4: #b0364f;
  --font-jp: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #131815; --surface: #1b221e; --ink: #e6ede8; --ink2: #9aa8a0; --line: #2c3631; --accent: #5cc7a8; --accent-soft: #1b3a31;
    --ok: #5cc7a8; --ok-bg: #1b3a31; --warn-bg: #352d12; --warn-ink: #ecd48a;
    --lv1: #6fbfa5; --lv2: #6fa8d6; --lv3: #dba44d; --lv4: #e47a91; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #131815; --surface: #1b221e; --ink: #e6ede8; --ink2: #9aa8a0; --line: #2c3631; --accent: #5cc7a8; --accent-soft: #1b3a31;
  --ok: #5cc7a8; --ok-bg: #1b3a31; --warn-bg: #352d12; --warn-ink: #ecd48a;
  --lv1: #6fbfa5; --lv2: #6fa8d6; --lv3: #dba44d; --lv4: #e47a91; color-scheme: dark;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.7 var(--font-jp);
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 20px 56px; }
main { max-width: 1040px; margin: 0 auto; }
h1 { font-size: 24px; line-height: 1.35; margin: 0 0 6px; text-wrap: balance; }
h2 { display: flex; align-items: baseline; gap: 10px; font-size: 18px; margin: 0 0 12px; text-wrap: balance; }
h3 { font-size: 16px; margin: 28px 0 8px; }
.no { font-variant-numeric: tabular-nums; color: var(--accent); font-weight: 700; }
.cnt { margin-left: auto; font-size: 13px; color: var(--ink2); font-weight: 400; }
.lead { color: var(--ink2); margin: 0 0 14px; }
.status { background: var(--warn-bg); color: var(--warn-ink); border-radius: 10px; padding: 10px 14px; font-size: 14px; margin: 0 0 16px; }
.status b { font-weight: 700; }
.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 10px; margin: 0 0 18px; padding: 0; list-style: none; }
.summary li { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; min-width: 0; }
.summary b { display: block; font-size: 20px; font-variant-numeric: tabular-nums; }
.summary span { font-size: 13px; color: var(--ink2); }
.bar { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; background: var(--bg); padding: 10px 0; border-bottom: 1px solid var(--line); margin-bottom: 18px; }
.bar label { font-size: 13px; color: var(--ink2); }
select, .chip { font: inherit; font-size: 14px; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; }
select { max-width: 100%; min-width: 0; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { cursor: pointer; }
.chip[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--bg); font-weight: 700; }
.chip:focus-visible, select:focus-visible, summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
.lesson { margin: 0 0 34px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 440px), 1fr)); gap: 12px; }
.prob { min-width: 0; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
.prob header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.lv { font-size: 12px; font-weight: 700; padding: 1px 10px; border-radius: 999px; color: var(--bg); }
.lv1 { background: var(--lv1); } .lv2 { background: var(--lv2); } .lv3 { background: var(--lv3); } .lv4 { background: var(--lv4); }
.pid { font-size: 12px; color: var(--ink2); font-variant-numeric: tabular-nums; }
.q { margin: 0 0 8px; overflow-wrap: anywhere; }
.choices { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.choices li { display: grid; grid-template-columns: 1.4em 1.4em minmax(0, 1fr); gap: 4px; align-items: start; padding: 3px 6px; border-radius: 6px; }
.choices li.right { background: var(--ok-bg); }
.mark.ok { color: var(--ok); font-weight: 700; }
.lab { color: var(--ink2); font-size: 13px; }
.txt { overflow-wrap: anywhere; }
.why { display: block; font-size: 12px; color: var(--ink2); line-height: 1.5; }
details { margin-top: 8px; border-top: 1px dashed var(--line); padding-top: 6px; }
summary { cursor: pointer; font-size: 13px; color: var(--accent); }
.e, .h { margin: 6px 0 0; font-size: 14px; overflow-wrap: anywhere; }
.h { color: var(--ink2); }
.scroll { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 14px; background: var(--surface); }
th, td { border: 1px solid var(--line); padding: 5px 10px; text-align: left; vertical-align: top; }
th { background: var(--accent-soft); }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
small { color: var(--ink2); }
ul.notes { padding-left: 20px; margin: 0; } ul.notes li { margin: 6px 0; }
@media (max-width: 520px) { h1 { font-size: 21px; } .grid { grid-template-columns: minmax(0, 1fr); } }
@media print { .bar { position: static; } }
`;

const SCRIPT = `
(function () {
  var lessonSel = document.getElementById("lesson-sel"), chips = document.querySelectorAll(".chip[data-d]"), showE = document.getElementById("show-e");
  var state = { l: "all", d: "all" };
  function apply() {
    document.querySelectorAll(".lesson").forEach(function (s) { s.hidden = state.l !== "all" && s.getAttribute("data-l") !== state.l; });
    document.querySelectorAll(".prob").forEach(function (p) { p.hidden = state.d !== "all" && p.getAttribute("data-d") !== state.d; });
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-d") === state.d)); });
    document.querySelectorAll(".prob details").forEach(function (d) { d.open = showE.checked; });
  }
  lessonSel.addEventListener("change", function () { state.l = lessonSel.value; apply(); });
  chips.forEach(function (c) { c.addEventListener("click", function () { state.d = c.getAttribute("data-d"); apply(); }); });
  showE.addEventListener("change", apply);
  apply();
})();
`;

const BODY = `<main>
  <h1>空間図形 演習バンク</h1>
  <p class="lead">中1「空間図形」の解説15本それぞれに、簡単・普通・難しい・入試レベルの4段階を5問ずつ。合わせて300問です。答えは、ikkan の問題テンプレートが計算で出したものです。</p>
  <p class="status"><b>コツコツくんにはまだ入れていません。</b>アプリの本体（ソース）がこのリポジトリに無いため、取り込みは先生側の作業になります。</p>
  <ul class="summary">
    <li><b>300問</b><span>15解説 × 4段階 × 5問</span></li>
    <li><b>299 / 300</b><span>正解を伏せて解き直し、一致した問題数。食い違った1問は調べて、問題集が正しいと確認</span></li>
    <li><b>${withReason} / ${wrongs.length}</b><span>まちがえ方の理由がついた誤答（残りは、答えに近い数や、もとの問題の選択肢）</span></li>
  </ul>

  <div class="bar" role="group" aria-label="絞り込み">
    <label for="lesson-sel">解説</label>
    <select id="lesson-sel"><option value="all">15本すべて</option>${lessons.map((l) => `<option value="${l.id}">${String(l.n).padStart(2, "0")} ${esc(l.name)}</option>`).join("")}</select>
    <div class="chips"><button type="button" class="chip" data-d="all" aria-pressed="true">全段階</button>${[1, 2, 3, 4].map((d) => `<button type="button" class="chip" data-d="${d}" aria-pressed="false">${LEVEL[d]}</button>`).join("")}</div>
    <label><input type="checkbox" id="show-e" checked> 解説を開く</label>
  </div>

  ${sections}

  <h3>既存の演習150問の振り分け</h3>
  <p class="lead">いまの演習（J1-SP-001〜150）は消さずに、解説ごとの「復習」として残します。どの解説に付けるかの案です。</p>
  <div class="scroll"><table><thead><tr><th>解説</th><th>名前</th><th>新しい問題</th><th>既存</th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="scroll" style="margin-top:12px"><table><thead><tr><th>既存の問題</th><th>件数</th><th>付ける解説</th><th>中身（判断したところ）</th></tr></thead><tbody>${rules}</tbody></table></div>

  <h3>見てほしいところ</h3>
  <ul class="notes">
    <li>段階は ikkan の4段階（基礎・標準・応用・入試レベル）のとおりで、簡単・普通・難しい・入試レベルの順です。コツコツくんの難易度は d=1〜3 までしか確認できていません。d=4 を受けつけるかは、アプリ側で確かめる必要があります。</li>
    <li>解説 01・06・08・12・14・15 には、振り分けられる既存の問題がありません（今の演習が、柱体・錐体の計算と位置関係に偏っているため）。</li>
    <li>「縦」「横」は ikkan の教材に合わせ、展開図の縦＝高さ、横＝底面のまわり、としています（K07-L3-03 など）。</li>
    <li>誤答の理由が付かないもの（約${Math.round(((wrongs.length - withReason) / wrongs.length) * 100)}%）は、答えに近い数です。理由つきにするには、問題ごとに手で書く必要があります。</li>
  </ul>
</main>`;

const fragIdx = process.argv.indexOf("--fragment");
if (fragIdx > 0) {
  fs.writeFileSync(process.argv[fragIdx + 1], `<title>空間図形 演習バンク</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap">
<style>${STYLE}</style>
${BODY}
<script>${SCRIPT}</script>
`);
  console.log("fragment:", process.argv[fragIdx + 1]);
} else {
  fs.writeFileSync(path.join(HERE, "review.html"), `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>空間図形 演習バンク</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap">
<style>${STYLE}</style></head><body>
${BODY}
<script>${SCRIPT}</script>
</body></html>
`);
  console.log("review.html を書きました");
}
