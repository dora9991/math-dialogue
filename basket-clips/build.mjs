// バスケ得点クリップ — 1ファイル版を作る: node basket-clips/build.mjs
//   → public/basket-clips/index.html（GitHub Pages で公開するもの。ダブルクリックでも開ける）
// CSS と JS を index.html に埋め込むだけ（外部ライブラリなし・通信なし）。
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
const outDir = path.join(root, '..', 'public', 'basket-clips');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'index.html');
fs.writeFileSync(out, html);
console.log(`public/basket-clips/index.html を作りました（${files} ファイルを埋め込み、${(fs.statSync(out).size / 1024).toFixed(0)} KB）`);
