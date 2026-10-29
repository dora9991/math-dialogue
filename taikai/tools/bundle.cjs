#!/usr/bin/env node
/* 全部を 1 つの HTML にまとめる（index.html の CSS・スクリプトを、書いてある順に埋めこむ）。
   使い方：  node tools/bundle.cjs        … taikai-all-in-one.html（ダブルクリックで開ける1ファイル）
   直したら、もう一度実行して作り直す（できたファイルは手で直さない）。 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'taikai-all-in-one.html'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const missing = [];
const exists = (f) => fs.existsSync(path.join(root, f)) || (missing.push(f), false);
let body = html
  // 手元の CSS を <style> に
  .replace(/<link rel="stylesheet" href="((?!https:)[^"]+)">/g, (m, f) => (exists(f) ? `<style>/* ${f} */\n${read(f)}\n</style>` : ''))
  // 手元のスクリプトを <script> に
  .replace(/<script src="([^"]+)"><\/script>/g, (m, f) => {
    if (!exists(f)) return '';
    const js = read(f).replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
    return `<script>/* ---- ${f} ---- */\n${js}\n</script>`;
  });
if (missing.length) console.log('△ まだないので入れなかった：' + missing.join('、'));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body);
console.log(`書き出した：${path.relative(process.cwd(), out)}（${Math.round(Buffer.byteLength(body) / 1024)} KB）`);
