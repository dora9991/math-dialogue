#!/usr/bin/env node
/* 全部を 1 つの HTML ファイルにまとめる（index.html の CSS・スクリプトを、順番どおりに埋めこむ）。
   できたファイルは、ダブルクリックでそのままブラウザで開ける（フォルダごと持ち歩かなくてよい）。
   ★ library.js（自分の動画の一覧・要約）は、まとめない。できた HTML と同じフォルダに library.js を置くと読みこむ。
     （このリポジトリは公開。購入した動画に関わる中身は、ここに入れない。）
   使い方：  node tools/bundle.cjs [出力先]       … 配る用の 1 ファイル（既定：basket-navi.html）
            node tools/bundle.cjs --pwa <フォルダ>  … iPad・スマホ用（ホーム画面に追加・オフライン）。index.html・manifest・sw.js・アイコンを書き出す。
                                                    library.js は読みこまない（公開ページには置かない。端末に「取りこむ」）
            node tools/bundle.cjs --all          … 上の 2 つを、まとめて作り直す（basket-navi.html と ../public/basket-navi/）
   コードを直したら、もう一度実行して作り直す（できたファイルは、手で直さない）。 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const all = args.includes('--all');
const pi = args.indexOf('--pwa');
if (pi >= 0 && !args[pi + 1]) { console.error('--pwa の後ろに、書き出し先のフォルダを書く'); process.exit(1); }
const pwaDir = all ? path.resolve(root, '..', 'public', 'basket-navi') : (pi >= 0 ? path.resolve(args[pi + 1]) : null);
const positional = args.filter((a, i) => !a.startsWith('--') && i !== (pi >= 0 ? pi + 1 : -1));   // --pwa の後ろのフォルダ名は、出力先ではない
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'バスケ指導ナビ';
const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => read(m[1])).join('\n');

function build(pwa) {
  const scripts = [...html.matchAll(/<script src="([^"]+)"([^>]*)><\/script>/g)].map(m => {
    const external = /data-external/.test(m[2]);
    if (external) return pwa ? '' : `<script src="${path.basename(m[1])}"></script>`;
    if (/(^|\/)library\.js$/.test(m[1])) throw new Error('library.js は埋めこまない（data-external を付ける）：' + m[1]);
    return `<script>\n/* ---- ${m[1]} ---- */\n${read(m[1]).replace(/<\/script/gi, '<\\/script')}\n</script>`;
  }).filter(Boolean).join('\n');
  const head = pwa ? `<meta name="theme-color" content="#c2410c">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="バスケ指導">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" href="icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
` : '';
  const tail = pwa ? `<script>if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) { navigator.serviceWorker.register('sw.js').catch(function () {}); }</script>\n` : '';
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light dark">
${head}<title>${title}</title>
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<noscript>JavaScript をオンにしてください。</noscript>
${scripts}
${tail}</body>
</html>
`;
}

const manifest = {
  name: 'バスケ指導ナビ',
  short_name: 'バスケ指導',
  description: '購入した動画と、見どころと、練習メニューをつなぐ、指導用のノート',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'any',
  background_color: '#f6f3ec',
  theme_color: '#c2410c',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};
const swSource = ver => `/* バスケ指導ナビ：オフラインで開けるようにする（体育館の電波が弱くても使えるように）。
   覚えるのは、アプリ本体だけ。動画・library.js・記録（localStorage）には触らない。
   つながっているときは、いつも最新を取りにいき、つながらないときだけ、覚えているものを出す。 */
const CACHE = 'basket-navi-${ver}';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.indexOf('basket-navi-') === 0 && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
`;

function writePwa(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const page = build(true);
  const ver = crypto.createHash('sha1').update(page).digest('hex').slice(0, 10);
  fs.writeFileSync(path.join(dir, 'index.html'), page);
  fs.writeFileSync(path.join(dir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(dir, 'sw.js'), swSource(ver));
  for (const f of ['icon-180.png', 'icon-192.png', 'icon-512.png']) {
    const src = path.join(root, 'assets', f);
    if (!fs.existsSync(src)) throw new Error(`${src} がありません。先に python3 tools/make_icons.py を実行する`);
    fs.copyFileSync(src, path.join(dir, f));
  }
  console.log(`書き出した（iPad・スマホ用）：${dir}（index.html ${Math.round(Buffer.byteLength(page) / 1024)} KB、manifest、sw.js、アイコン）`);
}
function writeSingle(file) {
  const body = build(false);
  fs.writeFileSync(file, body);
  console.log(`書き出した：${file}（${Math.round(Buffer.byteLength(body) / 1024)} KB）`);
  console.log('library.js は含めていない。同じフォルダに置くと読みこむ。');
}

if (all) { writeSingle(path.join(root, 'basket-navi.html')); writePwa(pwaDir); }
else if (pwaDir) writePwa(pwaDir);
else writeSingle(path.resolve(positional[0] || path.join(root, 'basket-navi.html')));
