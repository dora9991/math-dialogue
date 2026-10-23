// ============================================================
// preview.mjs — 移した問題を、1枚の HTML で見られるようにする（確かめ用。スマホでも読める）
//   node ikkan/kotsu/preview.mjs [出力先=ikkan/kotsu/preview.html] [1テンプレートの見本の数=2]
//   単元ごとに、テンプレートの見本（問題・選択肢・答え・ヒント・解説）と、もとの ikkan の問題、移さなかった問題（理由つき）を並べる。
//   数式（$...$）は MathML で出すので、katex（npm の katex）が必要（なければ、$ のまま出す）。ネットにつながなくても読める。
//   見本は、実行のたびに乱数でつくりかえる。
// ============================================================
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const IKKAN = path.resolve(HERE, "..");
const out = path.resolve(process.argv[2] || path.join(HERE, "preview.html"));
const PER = Number(process.argv[3] || 2);

let katex = null;
try { katex = createRequire(import.meta.url)("katex"); } catch (e) { /* なければ $ のまま */ }
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/** 文字の中の $...$ を、MathML にする。ほかは、そのまま（改行は <br>） */
function tx(s) {
  const parts = String(s ?? "").split("$");
  return parts.map((seg, i) => {
    if (i % 2 === 0) return esc(seg).replace(/\n/g, "<br>");
    if (!katex) return `<code>${esc(seg)}</code>`;
    try { return katex.renderToString(seg, { output: "mathml", throwOnError: true }); } catch (e) { return `<code>${esc(seg)}</code>`; }
  }).join("");
}

// ikkan の問題の一覧
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
const dataDir = fs.readdirSync(path.join(IKKAN, "data"));
for (const f of ["js/vendor/qrcode.js", "js/core.js", "js/qr.js", "js/figs.js", "js/figs3d.js", "js/plan.js", "js/rec.js", "js/plansheet.js", "data/lessons.js",
  ...dataDir.filter((f) => /^ws_.*\.js$/.test(f)).sort().map((f) => "data/" + f),
  ...dataDir.filter((f) => /^lesson_.*\.js$/.test(f)).sort().map((f) => "data/" + f)]) vm.runInContext(fs.readFileSync(path.join(IKKAN, f), "utf8"), ctx, { filename: f });
const catalog = new Map(ctx.IK.rec.catalog("kukan").map((c) => [c.id, c]));
const plain = (s) => String(s).replace(/\{\{([\s\S]*?)\}\}/g, "$1").replace(/\[\[([^\]/]*)\/([^\]]*)\]\]/g, "$1/$2").replace(/\*\*/g, "");

const files = fs.readdirSync(path.join(HERE, "content")).filter((f) => f.endsWith(".js")).sort();
const LV = { 1: "基礎", 2: "標準", 3: "応用", 4: "入試レベル" };
const rnd2 = rnd;
let nT = 0, nSk = 0, body = "";
const nav = [];

for (const f of files) {
  let mod;
  try { mod = await import(pathToFileURL(path.join(HERE, "content", f)).href); } catch (e) { console.log(`△ ${f} を読めない：${String(e.message).split("\n")[0]}`); continue; }
  for (const u of mod.UNITS) {
    nav.push(`<a href="#${u.id}">${esc(u.ikkan.lesson.replace("kukan-", ""))}</a>`);
    let h = `<section class="u" id="${u.id}"><h2><small>空間図形 第${+u.ikkan.lesson.replace("kukan-", "")}時　${u.id}</small>${esc(u.name)}</h2><p class="desc">${esc(u.desc || "")}</p>`;
    h += `<ul class="pts">${(u.points || []).map((p) => `<li>${tx(p)}</li>`).join("")}</ul>`;
    for (const L of Object.keys(u.levels).sort()) {
      h += `<h3>レベル${L}　${LV[L]}</h3>`;
      for (const tpl of u.levels[L]) {
        nT++;
        const m = /^(\d{2})([dqwx])(\d{2})/.exec(tpl.id);
        const qid = m && (m[2] === "d" || m[2] === "q") ? `kukan-${m[1]}.${m[2] === "d" ? "dr" : "qz"}.${+m[3]}` : "";
        const src = qid && catalog.get(qid) ? `<div class="src"><b>もとの問題</b>（${esc(qid)}）${esc(plain(catalog.get(qid).text).replace(/\n/g, " "))}</div>` : (m && m[2] === "x" ? `<div class="src">ikkan にない、補いの問題</div>` : "");
        h += `<article class="t"><div class="th"><code>${esc(tpl.id)}</code>${tpl.fixed ? '<span class="fx">いつも同じ</span>' : ""}</div>${src}`;
        for (let i = 0; i < PER; i++) {
          let p, n = 0;
          try { do { p = tpl.build(rnd2); n++; } while (p && p.skip && n < 50); } catch (e) { p = { q: `（エラー：${e.message}）`, ans: "", hint: "", steps: [] }; }
          h += `<div class="ex"><div class="q">${tx(p.q)}</div>`;
          if (p.choices) h += `<ol class="ch">${p.choices.map((c) => `<li class="${String(c) === String(p.ans) ? "ok" : ""}">${tx(String(c))}</li>`).join("")}</ol>`;
          else h += `<div class="inp">入力${p.unit ? `（単位：${esc(p.unit)}）` : ""}</div>`;
          h += `<details><summary>答え・ヒント・解説</summary><div class="a"><b>答え</b>　${tx(String(p.ans))}${p.unit ? " " + esc(p.unit) : ""}</div><div class="hn"><b>ヒント</b>　${tx(p.hint)}</div><ol class="st">${(p.steps || []).map((s) => `<li>${tx(s)}</li>`).join("")}</ol></details></div>`;
        }
        h += "</article>";
      }
    }
    if ((mod.SKIPPED || []).length) {
      h += `<h3>移さなかった問題</h3><ul class="sk">${mod.SKIPPED.map(([qid, why]) => { nSk++; const c = catalog.get(qid); return `<li><code>${esc(qid)}</code> ${esc(c ? plain(c.text).replace(/\n/g, " ").slice(0, 60) : "")}<br><span class="why">${esc(why)}</span></li>`; }).join("")}</ul>`;
    }
    body += h + "</section>";
  }
}

const css = `:root{color-scheme:light dark;--bg:#f6f5f1;--panel:#fff;--ink:#1f2933;--ink2:#52606d;--line:#d9d6cc;--acc:#1d5fbf;--ok:#1e7a4a;--okbg:#e3f4ea}
@media (prefers-color-scheme:dark){:root{--bg:#14181d;--panel:#1d2329;--ink:#e6e9ec;--ink2:#a9b3bd;--line:#2f3841;--acc:#7db2ff;--ok:#6fd19a;--okbg:#1b3326}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 -apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans JP","Yu Gothic UI",sans-serif}
header{padding:16px;max-width:760px;margin:0 auto}h1{font-size:20px;margin:0 0 4px}header p{margin:4px 0;color:var(--ink2);font-size:14px}
nav{position:sticky;top:0;z-index:5;display:flex;gap:6px;flex-wrap:wrap;padding:8px 16px;background:var(--panel);border-bottom:1px solid var(--line)}nav a{padding:2px 9px;border:1px solid var(--line);border-radius:999px;text-decoration:none;color:var(--acc);font-size:13px}
main{max-width:760px;margin:0 auto;padding:0 16px 60px}.u{margin:28px 0}.u h2{font-size:18px;margin:0}.u h2 small{display:block;font-size:12px;color:var(--ink2);font-weight:700}.desc{margin:2px 0 6px;color:var(--ink2);font-size:14px}
.pts{margin:6px 0 10px;padding-left:1.3em;font-size:14px;color:var(--ink2)}h3{font-size:14px;margin:18px 0 6px;color:var(--acc)}
.t{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:0 0 10px}.th{display:flex;gap:8px;align-items:center;margin-bottom:4px}.th code{font-weight:700}.fx{font-size:11px;padding:0 7px;border-radius:999px;background:var(--line);color:var(--ink2)}
.src{font-size:12.5px;color:var(--ink2);margin:0 0 6px;padding:4px 8px;border-left:3px solid var(--line)}.src b{margin-right:6px}.ex{padding:8px 0;border-top:1px dashed var(--line)}.ex:first-of-type{border-top:0}
.q{font-size:15.5px}.ch{margin:4px 0;padding-left:1.4em;list-style:upper-alpha}.ch li.ok{background:var(--okbg);border-radius:6px}.inp{font-size:12px;color:var(--ink2);margin:2px 0}
details{margin-top:4px}summary{cursor:pointer;color:var(--acc);font-size:13px}.a{color:var(--ok);font-weight:700;font-size:15px}.hn,.st{font-size:14px;color:var(--ink2)}.st{margin:2px 0 0;padding-left:1.4em}
.sk{font-size:13.5px;padding-left:1.2em}.why{color:var(--ink2);font-size:12.5px}code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.92em}math{font-size:1.05em}`;

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>空間図形の問題（コツコツくん形式）</title><style>${css}</style></head><body>
<header><h1>空間図形の問題（コツコツくん形式）</h1><p>ikkan の演習プリント・小テストの問題を、コツコツくんの問題テンプレートにしたものの見本です。テンプレートごとに ${PER} 問ずつ、乱数でつくっています（開くたび・つくりなおすたびに数字が変わります）。答えは「答え・ヒント・解説」をひらいて確かめます。</p><p>テンプレート ${nT} 本／移さなかった問題 ${nSk} 問</p></header>
<nav>${nav.join("")}</nav><main>${body}</main></body></html>`;
fs.writeFileSync(out, html);
console.log(`書き出した：${out}（${Math.round(html.length / 1024)} KB・テンプレート ${nT} 本・見本 ${PER} 問ずつ・移さなかった問題 ${nSk}）`);
