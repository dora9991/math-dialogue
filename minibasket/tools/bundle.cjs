#!/usr/bin/env node
/* 全部を 1 つの HTML にまとめる（index.html の CSS・スクリプトを、順番どおりに埋めこむ）。
   使い方：  node minibasket/tools/bundle.cjs              … ダブルクリックで開ける1ファイル（minibasket-all-in-one.html）
            node minibasket/tools/bundle.cjs --artifact   … Claude のアーティファクト用（<html>などの枠なし。minibasket-artifact.html）
   コードを変えたら、もう一度実行して作り直す（できたファイルは、手で直さない）。 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2), artifact = args.includes('--artifact');
const out = path.resolve(args.find(a => !a.startsWith('--')) || path.join(root, artifact ? 'minibasket-artifact.html' : 'minibasket-all-in-one.html'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const localCss = [...html.matchAll(/<link rel="stylesheet" href="((?!https?:)[^"]+)">/g)].map(m => read(m[1])).join('\n');
const js = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => `/* ---- ${m[1]} ---- */\n${read(m[1])}`).join('\n').replace(/<\/script/gi, '<\\/script');
const fonts = [...html.matchAll(/<link rel="(?:preconnect|stylesheet)" href="(https:[^"]+)"[^>]*>/g)].map(m => m[0]).join('\n');
const icon = (html.match(/<link rel="icon"[^>]*>/) || [''])[0];
const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || 'ミニバス スコアシート分析';

const body = artifact
  ? `<title>${title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${fonts}\n<style>\n${localCss}\n</style>\n<div id="app"></div>\n<script>\n${js}\n</script>\n`
  : `<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="robots" content="noindex,nofollow">\n<title>${title}</title>\n${icon}\n${fonts}\n<style>\n${localCss}\n</style>\n</head>\n<body>\n<div id="app"></div>\n<script>\n${js}\n</script>\n</body>\n</html>\n`;
fs.writeFileSync(out, body);
console.log(`書き出した：${path.relative(process.cwd(), out)}（${Math.round(Buffer.byteLength(body) / 1024)} KB）`);
