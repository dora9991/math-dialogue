// バスケ シーン — 公開用を作る: node build.mjs
//   → docs/index.html（CSS と JS を埋め込んだ 1 ファイル。ダブルクリックでも開ける）＋ docs/demo/（見本の試合）
// 外部ライブラリなし・通信なし。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let files = 0;
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => { files++; return `<style>\n/* ${href} */\n${fs.readFileSync(path.join(root, href), 'utf8')}\n</style>`; });
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => { files++; return `<script>\n/* ${src} */\n${fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script/gi, '<\\/script')}\n</script>`; });
if (/<script src=|<link rel="stylesheet"/.test(html)) throw new Error('埋め込めていないファイルがあります');
const outDir = path.join(root, 'docs');
fs.mkdirSync(path.join(outDir, 'demo'), { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
for (const f of fs.readdirSync(path.join(root, 'demo'))) if (/\.(mp4|json)$/.test(f)) fs.copyFileSync(path.join(root, 'demo', f), path.join(outDir, 'demo', f));
console.log(`docs/index.html を作りました（${files} ファイルを埋め込み、${(fs.statSync(path.join(outDir, 'index.html')).size / 1024).toFixed(0)} KB）＋ demo/`);
