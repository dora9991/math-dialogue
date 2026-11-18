#!/usr/bin/env node
/* 全部を 1 つの HTML ファイルにまとめる（index.html の CSS・スクリプトを、順番どおりに埋めこむ）。
   できたファイルは、ダブルクリックでそのままブラウザで開ける（フォルダごと持ち歩かなくてよい）。
   使い方：  node tools/bundle.cjs [出力先]            … 1 ファイル版（既定：gym-booking-all-in-one.html）
            node tools/bundle.cjs --artifact [出力先]  … 埋めこみ表示用（<html> などの枠なし。「ファイルに保存」ボタンなし）
   js・css を直したら、もう一度実行して作り直す（できたファイルは、手で直さない）。 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2), artifact = args.includes('--artifact');
const out = path.resolve(args.find(a => !a.startsWith('--')) || path.join(root, artifact ? 'gym-booking-artifact.html' : 'gym-booking-all-in-one.html'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const css = [...html.matchAll(/<link rel="stylesheet" href="(css\/[^"]+)">/g)].map(m => read(m[1])).join('\n');
const js = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => `/* ---- ${m[1]} ---- */\n${read(m[1])}`).join('\n').replace(/<\/script/gi, '<\\/script');
const fonts = html.match(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com[^"]+)">/)[1];
const title = html.match(/<title>([^<]+)<\/title>/)[1];
const icon = html.match(/<link rel="icon" href="([^"]+)">/)[1];

const body = artifact
  ? `<title>${title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="${fonts}">\n<style>\n${css}\n</style>\n<div id="app"></div>\n<script>\nwindow.GB_ENV = { artifact: true };\n${js}\n</script>\n`
  : `<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="robots" content="noindex,nofollow">\n<title>${title}</title>\n<link rel="icon" href="${icon}">\n<link rel="stylesheet" href="${fonts}">\n<style>\n${css}\n</style>\n</head>\n<body>\n<div id="app"></div>\n<script>\n${js}\n</script>\n</body>\n</html>\n`;
fs.writeFileSync(out, body);
console.log(`書き出した：${out}（${Math.round(Buffer.byteLength(body) / 1024)} KB）`);
