#!/usr/bin/env node
/* 全部を 1 つの HTML ファイルにまとめる（index.html の CSS・スクリプトを、順番どおりに埋めこむ）。
   できたファイルは、ダブルクリックでそのままブラウザで開ける（フォルダごと持ち歩かなくてよい）。
   ★ library.js（自分の動画の一覧・要約）は、まとめない。できた HTML と同じフォルダに library.js を置くと読みこむ。
     （このリポジトリは公開。購入した動画に関わる中身は、ここに入れない。）
   使い方：  node tools/bundle.cjs [出力先]   … 既定：basket-navi.html
   コードを直したら、もう一度実行して作り直す（できたファイルは、手で直さない）。 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'basket-navi.html'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => read(m[1])).join('\n');
const scripts = [...html.matchAll(/<script src="([^"]+)"([^>]*)><\/script>/g)].map(m => {
  const external = /data-external/.test(m[2]);
  if (external) return `<script src="${path.basename(m[1])}"></script>`;
  if (/(^|\/)library\.js$/.test(m[1])) throw new Error('library.js は埋めこまない（data-external を付ける）：' + m[1]);
  return `<script>\n/* ---- ${m[1]} ---- */\n${read(m[1]).replace(/<\/script/gi, '<\\/script')}\n</script>`;
}).join('\n');
const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'バスケ指導ナビ';

const body = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light dark">
<title>${title}</title>
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<noscript>JavaScript をオンにしてください。</noscript>
${scripts}
</body>
</html>
`;
fs.writeFileSync(out, body);
console.log(`書き出した：${out}（${Math.round(Buffer.byteLength(body) / 1024)} KB）`);
console.log('library.js は含めていない。同じフォルダに置くと読みこむ。');
