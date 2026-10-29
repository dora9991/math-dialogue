// スポーツ タップ記録 — 公開用を作る: node sports-tap/build.mjs
//   → public/sports-tap/index.html（CSS と JS を埋め込んだ1ファイル。ダブルクリックでも開ける）
//     public/sports-tap/manifest.webmanifest・icons/（ホーム画面に追加したときのアイコン）・sw.js（オフラインでも開けるように）
// 外部ライブラリなし・通信なし。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let files = 0;
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
  files++;
  return `<style>\n${fs.readFileSync(path.join(root, href), 'utf8')}\n</style>`;
});
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  files++;
  const code = fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script>\n/* ${src} */\n${code}\n</script>`;
});
if (/<script src=|<link rel="stylesheet"/.test(html)) throw new Error('埋め込めていないファイルがあります');
const outDir = path.join(root, '..', 'public', 'sports-tap');
fs.mkdirSync(path.join(outDir, 'icons'), { recursive: true });
const out = path.join(outDir, 'index.html');
fs.writeFileSync(out, html);
fs.copyFileSync(path.join(root, 'manifest.webmanifest'), path.join(outDir, 'manifest.webmanifest'));
fs.copyFileSync(path.join(root, 'sw.js'), path.join(outDir, 'sw.js'));
for (const f of fs.readdirSync(path.join(root, 'icons'))) if (f.endsWith('.png')) fs.copyFileSync(path.join(root, 'icons', f), path.join(outDir, 'icons', f));
console.log(`public/sports-tap/index.html を作りました（${files} ファイルを埋め込み、${(fs.statSync(out).size / 1024).toFixed(0)} KB）＋ manifest・アイコン・sw.js`);
