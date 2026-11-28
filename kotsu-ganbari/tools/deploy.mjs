// 使い方: node tools/deploy.mjs <出力先フォルダ>   例: …/gh-pages/solo/ganbari
// 公開に必要なファイルだけをコピーする（AUTHORING.md・tools・package.json は含めない）。manifest.json も作りなおす。
import { cpSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = process.argv[2];
if (!dest) { console.error("出力先フォルダを指定してください"); process.exit(1); }
execFileSync("node", [join(root, "tools", "build.mjs")], { stdio: "inherit" });
if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
mkdirSync(join(dest, "q"), { recursive: true });
for (const f of ["index.html", "style.css", "app.js", "player.js", "dsl.js", "geo.js", "manifest.json"]) cpSync(join(root, f), join(dest, f));
if (existsSync(join(root, "credit.js"))) cpSync(join(root, "credit.js"), join(dest, "credit.js"));
for (const f of readdirSync(join(root, "q")).filter((f) => /^q\d\d\.js$/.test(f))) cpSync(join(root, "q", f), join(dest, "q", f));
console.log(`コピーしました：${dest}（q ${readdirSync(join(dest, "q")).length}問）`);
