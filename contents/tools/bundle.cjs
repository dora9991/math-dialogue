#!/usr/bin/env node
/* 全部を 1 つの HTML にまとめる（index.html の CSS・スクリプトを、書いてある場所に埋めこむ）。
   使い方：  node contents/tools/bundle.cjs   … contents/contents-all-in-one.html（ダブルクリックで開ける1ファイル）
   一覧を足したり直したりしたら、もう一度実行して作り直す（できたファイルは手で直さない）。 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'contents-all-in-one.html'));
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

let files = 0;
const html = read('index.html')
  .replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
    files++;
    return `<style>\n${read(href)}\n</style>`;
  })
  .replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
    files++;
    return `<script>\n/* ---- ${src} ---- */\n${read(src).replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--')}\n</script>`;
  });
if (/<script src=|<link rel="stylesheet"/.test(html)) throw new Error('埋めこめていないファイルがあります');
fs.writeFileSync(out, html);
console.log(`書き出した：${path.relative(process.cwd(), out)}（${files} ファイルを埋めこみ、${Math.round(Buffer.byteLength(html) / 1024)} KB）`);
