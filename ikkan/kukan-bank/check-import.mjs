// check-import.mjs — 取りこんだあとのコツコツくんの「ビルド結果（solo/assets など）」に、300問が入っているかを、文字列で確かめる簡易検査
//
//   node ikkan/kukan-bank/check-import.mjs <ビルド結果のフォルダ> [--fold-level4]
//
// 見ること（import/problems.json の300問それぞれについて）：
//   ① 問題ID と問題文が、同じファイルにある（＝問題データが入っている）
//   ② 4つの選択肢の文面が、そのファイルにある
//   ③ 問題ID が出てくる回数（問題データ・pool・dir に、それぞれ1回ずつ載るなら 3回以上）。0回は未登録、1回は pool/dir に載っていない
// 限界：ビルド後のコードを文字列で探すだけです。pool や dir の「正しい単元・段階に入っているか」までは見えません。
//       それは、アプリ側の検査（solo-verify.mjs など）と、実際に1つの解説の演習を開いて確かめてください。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) { console.error("使い方: node check-import.mjs <ビルド結果のフォルダ>"); process.exit(2); }
const problems = JSON.parse(fs.readFileSync(path.join(HERE, "import", "problems.json"), "utf8"));

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(dir).filter((f) => /\.(m?js|json|html)$/.test(f)).map((f) => [f, fs.readFileSync(f, "utf8")]);
const has = (text, s) => text.includes(s) || text.includes(JSON.stringify(s).slice(1, -1));   // そのまま、または JSON の文字列エスケープ後

let noData = 0, noChoices = 0, notListed = 0, listed = 0;
const missing = [];
for (const p of problems) {
  const withId = files.filter(([, t]) => t.includes(p.id));
  const dataFile = withId.find(([, t]) => has(t, p.q));
  const occ = withId.reduce((n, [, t]) => n + t.split(p.id).length - 1, 0);
  if (!dataFile) { noData++; missing.push(p.id); continue; }
  if (!p.c.every((c) => has(dataFile[1], c.t))) noChoices++;
  if (occ >= 3) listed++; else notListed++;
}
console.log(`検査したフォルダ: ${dir}（${files.length}ファイル）`);
console.log(`① 問題データ（ID と問題文）が見つかった: ${problems.length - noData} / ${problems.length}`);
console.log(`② 4つの選択肢がそろっている: ${problems.length - noData - noChoices} / ${problems.length - noData}`);
console.log(`③ ID が 3回以上出てくる（問題データ・pool・dir）: ${listed} / ${problems.length - noData}（残り ${notListed} 問は 1〜2回）`);
if (missing.length) console.log(`未登録の例: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ` …ほか ${missing.length - 5}問` : ""}`);
if (noData || noChoices) { console.log("\n結果: 未完了"); process.exit(1); }
console.log(notListed ? "\n結果: 問題データは入っている。pool・dir への載り方は、アプリ側で確かめる" : "\n結果: OK");
