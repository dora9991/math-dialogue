#!/usr/bin/env node
/* 全部を 1 つの HTML にまとめる（index.html の CSS・スクリプトを、書いてある順に埋めこむ）。
   使い方：  node tools/bundle.cjs              … startup-kit-all-in-one.html（ダブルクリックで開ける1ファイル）
            node tools/bundle.cjs --artifact   … dist/artifact.html（Artifact に公開する本体。<html> などの枠なし）
            node tools/bundle.cjs --public     … ../public/startup-kit/index.html（GitHub Pages で公開する1ファイル。
                                                   説明文と、SNSやLINEで共有したときの見出しつき）
   アプリを直したら、もう一度実行して作り直す（できたファイルは手で直さない）。 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const artifact = args.includes('--artifact');
const pub = args.includes('--public');
const out = path.resolve(args.find((a) => !a.startsWith('--')) || (artifact ? path.join(root, 'dist/artifact.html') : pub ? path.join(root, '..', 'public', 'startup-kit', 'index.html') : path.join(root, 'startup-kit-all-in-one.html')));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const fonts = [...html.matchAll(/<link rel="stylesheet" href="(https:[^"]+)">/g)].map((m) => `<link rel="stylesheet" href="${m[1]}">`).join('\n');
const css = [...html.matchAll(/<link rel="stylesheet" href="((?!https:)[^"]+)">/g)].map((m) => read(m[1])).join('\n');
const js = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map((m) => `/* ---- ${m[1]} ---- */\n${read(m[1])}`).join('\n')
  .replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const title = 'みせびらき';
const desc = 'ホームページ・動画・集客窓口・カレンダー・マネタイズ計画・見積書まで。一人で事業を始めるための、ブラウザだけで動く起業ツール一式。登録不要。入力した内容は、あなたのブラウザの中だけに保存されます。';
const PAGE_URL = 'https://dora9991.github.io/math-dialogue/startup-kit/';
// タブの小さな印：のれん（藍の地に白い切れ目）
const icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1d3f7c"/><path d="M11.5 6v20M20.5 6v20" stroke="#fff" stroke-width="2"/><rect x="4" y="4" width="24" height="3" rx="1.5" fill="#fff" opacity=".85"/></svg>');
const meta = pub
  ? `<meta name="description" content="${desc}">\n<meta property="og:type" content="website">\n<meta property="og:title" content="${title} — 起業ツール一式">\n<meta property="og:description" content="${desc}">\n<meta property="og:url" content="${PAGE_URL}">\n<meta name="twitter:card" content="summary">\n<link rel="icon" href="${icon}">`
  : `<meta name="robots" content="noindex,nofollow">\n<link rel="icon" href="${icon}">`;

const body = artifact
  ? `<title>${title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${fonts}\n<style>\n${css}\n</style>\n<div id="kit"></div>\n<script>\n${js}\n</script>\n`
  : `<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${meta}\n<title>${title}</title>\n${fonts}\n<style>\n${css}\n</style>\n</head>\n<body>\n<div id="kit"></div>\n<script>\n${js}\n</script>\n</body>\n</html>\n`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body);
console.log(`書き出した：${path.relative(process.cwd(), out)}（${Math.round(Buffer.byteLength(body) / 1024)} KB）`);
