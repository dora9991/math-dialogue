#!/usr/bin/env node
// 感想の生データ（1行1件のテキストファイル）を *-data.js に変換する。
//
//   node make-data.mjs raw-comments.txt taiikusai-data.js
//   node make-data.mjs raw-comments.txt shukuhaku-data.js
//
// raw-comments.txt は「感想1件を1行」で並べたテキストファイル。
// Excel/スプレッドシートの列をコピーしてそのまま貼り付ければよい（空行は無視される）。
// タブや改行を含む長文をどうしても1行にできない場合は、先に \n を実際の改行のまま貼り付けず、
// セル内で改行を消してから1行にしてください。
// 出力先（2番目の引数）を省略すると taiikusai-data.js になる。

import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2];
const dest = process.argv[3] || "taiikusai-data.js";
if (!src) {
  console.error("使い方: node make-data.mjs raw-comments.txt [出力先.js]");
  process.exit(1);
}

const lines = readFileSync(src, "utf8")
  .split(/\r?\n/)
  .map((s) => s.trim().replace(/[ 　]{3,}/g, "　"))
  .filter((s) => s.length > 0);

if (lines.length === 0) {
  console.error("感想が1件も読み取れませんでした。ファイルの中身を確認してください。");
  process.exit(1);
}

const body = lines.map((s) => JSON.stringify(s)).join(",\n  ");
const out =
  `// 感想ひろばのデータ（${src} から自動生成、${lines.length}件）\n` +
  `window.EVENT_DATA = [\n  ${body}\n];\n`;

writeFileSync(dest, out, "utf8");
console.log(`✅ ${lines.length}件の感想を ${dest} に書き出しました。`);
