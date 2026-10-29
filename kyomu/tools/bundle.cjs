#!/usr/bin/env node
/* 全部を 1 つの HTML にまとめる（index.html の CSS・スクリプトを、書いてある順に埋めこむ）。
   使い方：  node tools/bundle.cjs   … kyomu-all-in-one.html（ダブルクリックで開ける1ファイル。ネットにつながっていなくても動く）
   アプリを直したら、もう一度実行して作り直す（できたファイルは手で直さない）。 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'kyomu-all-in-one.html'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => read(m[1])).join('\n');
const js = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map((m) => `/* ---- ${m[1]} ---- */\n${read(m[1])}`)
  .join('\n')
  .replace(/<\/script/gi, '<\\/script')
  .replace(/<!--/g, '<\\!--');
// タブの小さな印：時間割のマス目
const icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#22324a"/><path d="M6 10h20M6 16h20M6 22h20M13 6v20M19 6v20" stroke="#fff" stroke-width="1.6"/><rect x="13" y="16" width="6" height="6" fill="#ffd400"/></svg>');
const body = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="${icon}">
<title>教務・時間割</title>
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<div id="print-area"></div>
<script>
${js}
</script>
</body>
</html>
`;
fs.writeFileSync(out, body);
console.log(`書き出した：${path.relative(process.cwd(), out)}（${Math.round(Buffer.byteLength(body) / 1024)} KB）`);
