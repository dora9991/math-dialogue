// 使い方: node tools/deploy.mjs <出力先フォルダ>   例: …/gh-pages/solo/teacher/homework
// 公開に必要なファイルだけをコピーする（README.md・tools・package.json は含めない）。units.json は含める。
// 出力先は、いったん空にしてから書く（古いファイルが残らないように）。公開（push）はしない。
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = process.argv[2] && resolve(process.argv[2]);
if (!dest) { console.error("出力先フォルダを指定してください"); process.exit(1); }
if (dest === root || root.startsWith(dest + "/")) { console.error("出力先が、このフォルダ（またはその親）になっています"); process.exit(1); }
const FILES = ["index.html", "style.css", "app.js", "api.js", "util.js", "ui.js", "view-new.js", "view-list.js", "view-grid.js", "units.json"];
for (const f of FILES) if (!existsSync(join(root, f))) { console.error(`${f} がありません`); process.exit(1); }
// index.html・js が読むファイルが、全部そろっているかを確かめる
const need = new Set();
for (const f of FILES.filter((x) => x.endsWith(".js") || x.endsWith(".html"))) {
  const t = readFileSync(join(root, f), "utf8");
  for (const m of t.matchAll(/(?:from\s+|import\s*\(\s*|src=|href=)["']\.\/?([\w.-]+\.(?:js|css|json))["']/g)) need.add(m[1]);
  for (const m of t.matchAll(/fetch\(\s*["']([\w.-]+\.json)["']/g)) need.add(m[1]);
}
for (const n of need) if (!FILES.includes(n)) { console.error(`読みこまれる ${n} が、コピーの一覧に入っていません`); process.exit(1); }
if (existsSync(dest)) {
  // まちがえて別のフォルダを消さないように：空か、前に出力したもの（index.html がある）だけ
  const names = readdirSync(dest);
  if (names.length && !names.includes("index.html")) { console.error(`${dest} は空ではなく、index.html もありません。別のフォルダかもしれないので止めました`); process.exit(1); }
  rmSync(dest, { recursive: true, force: true });
}
mkdirSync(dest, { recursive: true });
for (const f of FILES) cpSync(join(root, f), join(dest, f));
console.log(`コピーしました：${dest}（${readdirSync(dest).length}ファイル：${FILES.join("・")}）`);
