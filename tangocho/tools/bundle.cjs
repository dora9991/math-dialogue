#!/usr/bin/env node
/* 全部を 1 つの HTML にまとめる（index.html の CSS・スクリプトを、書いてある順に埋めこむ）。
   使い方：  node tools/bundle.cjs              … tangocho-all-in-one.html（ダブルクリックで開ける1ファイル。印刷もできる）
            node tools/bundle.cjs --artifact   … dist/artifact.html（Claude の Artifact に公開する本体。<html> などの枠なし）
   単元や問題の作り方を直したら、もう一度実行して作り直す（できたファイルは手で直さない）。 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const artifact = args.includes('--artifact');
const out = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(root, artifact ? 'dist/artifact.html' : 'tangocho-all-in-one.html'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const title = (html.match(/<title>([^<]+)<\/title>/) || [, '計算単語帳'])[1];
const icon = (html.match(/<link rel="icon" href="([^"]+)">/) || [, ''])[1];
const css = [...html.matchAll(/<link rel="stylesheet" href="((?!https:)[^"]+)">/g)].map((m) => read(m[1])).join('\n');
const missing = [];
const js = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .filter((m) => fs.existsSync(path.join(root, m[1])) || (missing.push(m[1]), false))
  .map((m) => `/* ---- ${m[1]} ---- */\n${read(m[1])}`).join('\n')
  .replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
if (missing.length) console.log('△ まだないので入れなかった：' + missing.join('、'));

const body = artifact
  ? `<title>${title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n${css}\n</style>\n<div id="app"></div>\n<script>\nwindow.TG_ARTIFACT = true;\n${js}\n</script>\n`
  : `<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex,nofollow">\n<title>${title}</title>\n<link rel="icon" href="${icon}">\n<style>\n${css}\n</style>\n</head>\n<body>\n<div id="app"></div>\n<script>\n${js}\n</script>\n</body>\n</html>\n`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body);
console.log(`書き出した：${path.relative(process.cwd(), out)}（${Math.round(Buffer.byteLength(body) / 1024)} KB）`);
