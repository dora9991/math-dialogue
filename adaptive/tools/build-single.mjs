// ============================================================
// tools/build-single.mjs — 1 枚の HTML にまとめる（サーバーなしで、ダブルクリックで開ける）
//
//   node tools/build-single.mjs [--out dist/tsumazuki-navi.html] [--artifact]
//
//  --artifact … claude.ai の Artifact のように「枠の中」で動かす形で出す。
//     ・文書の外枠(<!doctype>/<html>/<head>/<body>)は置き場所側が付けるので、<title>・<style>・中身・<script> だけを出す
//     ・枠の中ではファイルのダウンロード・印刷・confirm() が使えないので、
//       globalThis.TSUMAZUKI_SANDBOX を立てて、画面の中の代わりの操作（コピーして保存・確認ダイアログ）に切りかえる
//
//  ES モジュールの import/export を小さな変換でつなぎ直して 1 つのスクリプトにし、
//  CSS・KaTeX・フォントを埋め込む。外部の通信はしない（オフラインで動く）。
//  ※ ファイルを直接開く(file://)ときは、ブラウザが ES モジュールの読み込みを禁止するので、この 1 枚版が便利。
//     開発中は、これまでどおり `python3 -m http.server --directory adaptive` で十分。
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const ARTIFACT = args.includes("--artifact");
const OUT = path.resolve(ROOT, args.includes("--out") ? args[args.indexOf("--out") + 1] : ARTIFACT ? "dist/tsumazuki-navi.artifact.html" : "dist/tsumazuki-navi.html");

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// ── モジュールの変換 ────────────────────────
const IMPORT_RE = /^import\s+([\s\S]*?)\s+from\s+["']([^"']+)["'];?[ \t]*$/gm;
const EXPORT_LIST_RE = /^export\s*\{([\s\S]*?)\}\s*;?[ \t]*$/gm;

/** import の節（"{ a, b as c }" など）を、代入の文に変える */
function importBindings(clause, modVar) {
  const out = [];
  let rest = clause.trim();
  const ns = /^\*\s+as\s+([A-Za-z_$][\w$]*)$/.exec(rest);
  if (ns) return `const ${ns[1]} = ${modVar};`;
  const def = /^([A-Za-z_$][\w$]*)\s*(?:,\s*)?/.exec(rest);
  if (def && !rest.startsWith("{")) {
    out.push(`const ${def[1]} = ${modVar}.default;`);
    rest = rest.slice(def[0].length).trim();
  }
  const named = /^\{([\s\S]*)\}$/.exec(rest);
  if (named) {
    const items = named[1]
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => {
        const m = /^([\w$]+)\s+as\s+([\w$]+)$/.exec(x);
        return m ? `${m[1]}: ${m[2]}` : x;
      });
    if (items.length) out.push(`const { ${items.join(", ")} } = ${modVar};`);
  }
  return out.join(" ");
}

function transform(id, src) {
  const deps = [];
  const exported = []; // [公開名, 内部名]
  let code = src.replace(IMPORT_RE, (_, clause, spec) => {
    const depId = path.posix.normalize(path.posix.join(path.posix.dirname(id), spec));
    deps.push(depId);
    return importBindings(clause, `__r(${JSON.stringify(depId)})`);
  });
  code = code.replace(EXPORT_LIST_RE, (_, list) => {
    for (const item of list.split(",").map((x) => x.trim()).filter(Boolean)) {
      const m = /^([\w$]+)\s+as\s+([\w$]+)$/.exec(item);
      exported.push(m ? [m[2], m[1]] : [item, item]);
    }
    return "";
  });
  code = code.replace(/^export\s+default\s+/gm, "__exports.default = ");
  code = code.replace(/^export\s+((?:async\s+)?function\*?|class)\s+([\w$]+)/gm, (_, kind, name) => {
    exported.push([name, name]);
    return `${kind} ${name}`;
  });
  code = code.replace(/^export\s+(const|let|var)\s+([\w$]+)/gm, (_, kind, name) => {
    exported.push([name, name]);
    return `${kind} ${name}`;
  });
  if (/^\s*export\s/m.test(code)) throw new Error(`${id}: 変換できない export が残っています`);
  const tail = exported.length ? `\nObject.assign(__exports, { ${exported.map(([a, b]) => (a === b ? a : `${a}: ${b}`)).join(", ")} });` : "";
  return { deps, body: code + tail };
}

// ── 依存をたどる ────────────────────────────
const mods = new Map();
function collect(id) {
  if (mods.has(id)) return;
  const { deps, body } = transform(id, read(id));
  mods.set(id, body);
  deps.forEach(collect);
}
collect("js/app.js");

let bundle = `(function () {\n"use strict";\nconst __defs = {};\nconst __cache = {};\nfunction __r(id) {\n  if (__cache[id]) return __cache[id];\n  const exports = (__cache[id] = {});\n  __defs[id](exports);\n  return exports;\n}\n`;
for (const [id, body] of mods) bundle += `__defs[${JSON.stringify(id)}] = function (__exports) {\n${body}\n};\n`;
bundle += `__r("js/app.js");\n})();\n`;

// ── CSS（KaTeX のフォントを data URL にして埋め込む）─────
function katexCss() {
  const css = read("vendor/katex/katex.min.css");
  return css.replace(/@font-face\{[^}]*\}/g, (block) => {
    const m = /url\(fonts\/([^)]+?\.woff2)\)/.exec(block);
    if (!m) return "";
    const file = path.join(ROOT, "vendor/katex/fonts", m[1]);
    if (!fs.existsSync(file)) return ""; // 同梱していないフォント（めったに使わない書体）は省く
    const family = /font-family:("?)([^;"]+)\1/.exec(block)[2];
    const style = /font-style:(\w+)/.exec(block)?.[1] || "normal";
    const weight = /font-weight:(\d+)/.exec(block)?.[1] || "400";
    return `@font-face{font-family:${family};font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${fs.readFileSync(file).toString("base64")}) format("woff2")}`;
  });
}

// ── HTML に埋め込む ─────────────────────────
const esc = (js) => js.replace(/<\/script/gi, "<\\/script");
let html;
if (ARTIFACT) {
  html = [
    "<title>つまずきナビ</title>",
    `<style>${katexCss()}</style>`,
    `<style>\n${read("css/app.css")}\n</style>`,
    '<div id="app"></div>',
    "<noscript>このページはJavaScriptを使います。ブラウザの設定でJavaScriptを有効にしてください。</noscript>",
    `<script>${esc(read("vendor/katex/katex.min.js"))}</script>`,
    `<script>\nglobalThis.TSUMAZUKI_SANDBOX = true;\n${esc(bundle)}</script>`,
    "",
  ].join("\n");
} else {
  html = read("index.html");
  html = html.replace(/<link rel="stylesheet" href="vendor\/katex\/katex\.min\.css"\s*\/>/, () => `<style>${katexCss()}</style>`);
  html = html.replace(/<link rel="stylesheet" href="css\/app\.css"\s*\/>/, () => `<style>\n${read("css/app.css")}\n</style>`);
  html = html.replace(/<script src="vendor\/katex\/katex\.min\.js"><\/script>/, () => `<script>${esc(read("vendor/katex/katex.min.js"))}</script>`);
  html = html.replace(/<script type="module" src="js\/app\.js"><\/script>/, () => `<script>\n${esc(bundle)}</script>`);
}
if (/(href|src)="(?!data:|#)[^"]*\.(css|js)"/.test(html)) throw new Error("外部ファイルの参照が残っています");

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`✓ ${path.relative(process.cwd(), OUT)}（${(html.length / 1024 / 1024).toFixed(2)} MB、モジュール ${mods.size} 個）`);
