// ============================================================
// preview.mjs — 移した問題を、1枚の HTML で見られるようにする（確かめ用。スマホでも読める）
//   node ikkan/kotsu/preview.mjs [出力先=ikkan/kotsu/preview.html] [1テンプレートの見本の数=2] [--artifact] [--unit=kukan,data,shiki,renritsu,ichiji]
//   --artifact … 埋めこみ表示（Claude の Artifact）用に、<html>・<head>・<body> のない形で書き出す
//   --unit     … 見本にする単元（空間図形 kukan・データの活用 data・式の計算 shiki・連立方程式 renritsu・一次関数 ichiji。省略すると、全部）
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
const ARGS = process.argv.slice(2), ART = ARGS.includes("--artifact"), POS = ARGS.filter((a) => !a.startsWith("--"));
const UNIT_NAMES = { kukan: "空間図形", data: "データの活用", shiki: "式の計算", renritsu: "連立方程式", ichiji: "一次関数" };
const UNIT_ARG = ARGS.find((a) => a.startsWith("--unit="));
const KEYS = UNIT_ARG ? UNIT_ARG.slice(7).split(",").filter(Boolean) : Object.keys(UNIT_NAMES);
const TITLE = KEYS.map((k) => UNIT_NAMES[k] || k).join("・");
const out = path.resolve(POS[0] || path.join(HERE, "preview.html"));
const PER = Number(POS[1] || 2);

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
for (const f of ["js/vendor/qrcode.js", "js/core.js", "js/qr.js", "js/figs.js", "js/geo.js", "js/figs3d.js", "js/plan.js", "js/rec.js", "js/plansheet.js", "data/lessons.js",
  ...dataDir.filter((f) => /^ws_.*\.js$/.test(f)).sort().map((f) => "data/" + f),
  ...dataDir.filter((f) => /^lesson_.*\.js$/.test(f)).sort().map((f) => "data/" + f)]) vm.runInContext(fs.readFileSync(path.join(IKKAN, f), "utf8"), ctx, { filename: f });
const catalog = new Map(ctx.IK.rec.catalog(KEYS).map((c) => [c.id, c]));
const plain = (s) => String(s).replace(/\{\{([\s\S]*?)\}\}/g, "$1").replace(/\[\[([^\]/]*)\/([^\]]*)\]\]/g, "$1/$2").replace(/\*\*/g, "");

const files = fs.readdirSync(path.join(HERE, "content")).filter((f) => f.endsWith(".js") && KEYS.includes(f.split("-")[0])).sort();
const LV = { 1: "基礎", 2: "標準", 3: "応用", 4: "入試レベル" };
const rnd2 = rnd;
let nT = 0, nSk = 0, nAll = 0, nMoved = 0, body = "";
const rows = [];
const nav = [];

for (const f of files) {
  let mod;
  try { mod = await import(pathToFileURL(path.join(HERE, "content", f)).href); } catch (e) { console.log(`△ ${f} を読めない：${String(e.message).split("\n")[0]}`); continue; }
  for (const u of mod.UNITS) {
    const [uk, un] = u.ikkan.lesson.split("-"), uname = UNIT_NAMES[uk] || uk;
    nav.push(`<a href="#${u.id}">${KEYS.length > 1 ? esc(uname.slice(0, 2)) + " " : ""}${esc(un)}</a>`);
    let uT = 0; const qids = new Set();
    let h = `<section class="u" id="${u.id}"><h2><small>${esc(uname)} 第${+un}時　${u.id}</small>${esc(u.name)}</h2><p class="desc">${esc(u.desc || "")}</p>`;
    h += `<ul class="pts">${(u.points || []).map((p) => `<li>${tx(p)}</li>`).join("")}</ul>`;
    for (const L of Object.keys(u.levels).sort()) {
      h += `<h3>レベル${L}　${LV[L]}</h3>`;
      for (const tpl of u.levels[L]) {
        nT++; uT++;
        const m = /^(\d{2})([dqwx])(\d{2})/.exec(tpl.id);
        const qid = m && (m[2] === "d" || m[2] === "q") ? `${uk}-${m[1]}.${m[2] === "d" ? "dr" : "qz"}.${+m[3]}` : "";
        if (qid) qids.add(qid);
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
    const all = [...catalog.keys()].filter((k) => k.startsWith(u.ikkan.lesson + ".")).length;
    nAll += all; nMoved += qids.size;
    rows.push({ id: u.id, name: `${uname} 第${+un}時　${u.name}`, nT: uT, moved: `${qids.size}／${all}`, skip: (mod.SKIPPED || []).length });
    body += h + "</section>";
  }
}

const css = `:root{--bg:#f2f4f6;--panel:#ffffff;--ink:#1b2430;--ink2:#546170;--line:#d5dce4;--acc:#1f5fbf;--ok:#1a7849;--okbg:#e0f2e8;--chip:#e8eef7}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#11161c;--panel:#1a2129;--ink:#e6eaee;--ink2:#a3afbb;--line:#2a343f;--acc:#7cb1ff;--ok:#6fd19a;--okbg:#163223;--chip:#243040;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#11161c;--panel:#1a2129;--ink:#e6eaee;--ink2:#a3afbb;--line:#2a343f;--acc:#7cb1ff;--ok:#6fd19a;--okbg:#163223;--chip:#243040;color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font:16px/1.75 "BIZ UDPGothic","Hiragino Sans","Noto Sans JP","Yu Gothic UI",sans-serif;margin:0;padding-block:12px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--panel)}
.wrap{max-width:760px;margin:0 auto}
header{padding:8px 0 4px}h1{font-size:22px;line-height:1.35;margin:0 0 6px;text-wrap:balance}header p{margin:4px 0;color:var(--ink2);font-size:14px}
.tools{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 0}.tools button{font:inherit;font-size:14px;padding:6px 14px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink);cursor:pointer}.tools button:focus-visible,summary:focus-visible,nav a:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:11;display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;margin:10px 0 0;padding:8px 0;background:var(--bg);border-bottom:1px solid var(--line)}nav a{flex:none;padding:1px 10px;border:1px solid var(--line);border-radius:999px;text-decoration:none;color:var(--acc);font-size:13px;background:var(--panel)}
.u{margin:30px 0;scroll-margin-top:56px}.u h2{font-size:18px;line-height:1.4;margin:0;text-wrap:balance}.u h2 small{display:block;font-size:12px;color:var(--ink2);font-weight:700;letter-spacing:.04em}.desc{margin:2px 0 6px;color:var(--ink2);font-size:14px}
.pts{margin:6px 0 10px;padding-left:1.3em;font-size:14px;color:var(--ink2)}h3{font-size:14px;margin:20px 0 6px;color:var(--acc);letter-spacing:.04em}
.t{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:0 0 10px;min-width:0}.th{display:flex;gap:8px;align-items:center;margin-bottom:4px}.th code{font-weight:700}.fx{font-size:11px;padding:0 8px;border-radius:999px;background:var(--chip);color:var(--ink2)}
.src{font-size:12.5px;color:var(--ink2);margin:0 0 6px;padding:2px 10px;border-left:3px solid var(--line)}.src b{margin-right:6px}.ex{padding:8px 0;border-top:1px dashed var(--line)}.ex:first-of-type{border-top:0}
.q{font-size:15.5px;overflow-wrap:anywhere}.ch{margin:4px 0;padding-left:1.4em;list-style:upper-alpha}.ch li{overflow-wrap:anywhere}.ch li.ok{background:var(--okbg);border-radius:6px}.inp{font-size:12px;color:var(--ink2);margin:2px 0}
details{margin-top:4px}summary{cursor:pointer;color:var(--acc);font-size:13px}.a{color:var(--ok);font-weight:700;font-size:15px;overflow-wrap:anywhere}.hn,.st{font-size:14px;color:var(--ink2);overflow-wrap:anywhere}.st{margin:2px 0 0;padding-left:1.4em}
.sk{font-size:13.5px;padding-left:1.2em}.why{color:var(--ink2);font-size:12.5px}code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.92em}math{font-size:1.05em}
.tbl{overflow-x:auto;margin:12px 0}table{border-collapse:collapse;font-size:13px;width:100%}th,td{border-bottom:1px solid var(--line);padding:4px 6px;text-align:right;white-space:nowrap;font-weight:400}th{color:var(--ink2);font-size:12px}th:first-child,td:first-child{text-align:left;white-space:normal;min-width:9em}`;

const lessonRows = rows.map((r) => `<tr><td><a href="#${r.id}">${esc(r.name)}</a></td><td>${r.nT}</td><td>${r.moved}</td><td>${r.skip}</td></tr>`).join("");
const inner = `<div class="wrap"><header><h1>${esc(TITLE)}の問題見本</h1><p>ikkan の演習プリント・小テストの問題を、コツコツくんの問題テンプレートにしたものから、テンプレートごとに ${PER} 問ずつ、乱数でつくった見本です。数字は、つくった時点のものです（実際は、出るたびに変わります）。</p><p>テンプレート ${nT} 本／ikkan の問題 ${nAll} 問のうち、移した ${nMoved} 問・移さなかった ${nSk} 問（理由つき）</p><div class="tools"><button type="button" id="openAll">答え・解説をすべてひらく</button><button type="button" id="closeAll">すべてとじる</button></div></header>
<div class="tbl"><table><thead><tr><th>授業</th><th>本数</th><th>移した</th><th>見送り</th></tr></thead><tbody>${lessonRows}</tbody></table></div>
<nav>${nav.join("")}</nav><main>${body}</main></div>
<script>document.getElementById("openAll").onclick=function(){document.querySelectorAll("details").forEach(function(d){d.open=true})};document.getElementById("closeAll").onclick=function(){document.querySelectorAll("details").forEach(function(d){d.open=false})};</script>`;
const fonts = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap">`;
const html = ART
  ? `<title>${esc(TITLE)} 問題見本</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${fonts}\n<style>${css}</style>\n${inner}\n`
  : `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(TITLE)} 問題見本</title>${fonts}<style>${css}</style></head><body>${inner}</body></html>`;
fs.writeFileSync(out, html);
console.log(`書き出した：${out}（${Math.round(html.length / 1024)} KB・テンプレート ${nT} 本・見本 ${PER} 問ずつ・移さなかった問題 ${nSk}）`);
