// スポーツ タップ記録・サッカー タップ記録 — 公開用を作る: node sports-tap/build.mjs
//   → public/sports-tap/index.html（スポーツ タップ記録。CSS と JS を埋め込んだ1ファイル。ダブルクリックでも開ける）
//     public/soccer-tap/index.html（サッカー タップ記録。同じエンジンで、サッカーだけ。保存は別）
//     それぞれに manifest.webmanifest・icons/（ホーム画面に追加したときのアイコン）・sw.js（オフラインでも開けるように）
// 外部ライブラリなし・通信なし。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const APPS = [
  { page: 'index.html', out: 'sports-tap', manifest: 'manifest.webmanifest', icons: 'icons', cache: 'stap-v1', strip: '' },
  { page: 'soccer.html', out: 'soccer-tap', manifest: 'soccer/manifest.webmanifest', icons: 'soccer/icons', cache: 'ssoc-v1', strip: 'soccer/' }
];
for (const A of APPS) {
  let html = fs.readFileSync(path.join(root, A.page), 'utf8');
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
  // サッカーのページは、manifest とアイコンを soccer/ に置いている → 公開するフォルダでは、そのフォルダの直下に
  if (A.strip) html = html.split(`href="${A.strip}`).join('href="');
  const outDir = path.join(root, '..', 'public', A.out);
  fs.mkdirSync(path.join(outDir, 'icons'), { recursive: true });
  const out = path.join(outDir, 'index.html');
  fs.writeFileSync(out, html);
  fs.copyFileSync(path.join(root, A.manifest), path.join(outDir, 'manifest.webmanifest'));
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8').replace(/const CACHE = '[^']+';/, `const CACHE = '${A.cache}';`).replace('このフォルダ（sports-tap/）', `このフォルダ（${A.out}/）`);
  fs.writeFileSync(path.join(outDir, 'sw.js'), sw);
  for (const f of fs.readdirSync(path.join(root, A.icons))) if (f.endsWith('.png')) fs.copyFileSync(path.join(root, A.icons, f), path.join(outDir, 'icons', f));
  console.log(`public/${A.out}/index.html を作りました（${files} ファイルを埋め込み、${(fs.statSync(out).size / 1024).toFixed(0)} KB）＋ manifest・アイコン・sw.js`);
}
