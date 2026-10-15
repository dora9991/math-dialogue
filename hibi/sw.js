/* ひびの手帳：オフラインでも画面を出すための service worker。
   ・画面の部品（HTML・CSS・JS・アイコン）は、手元の控えをすぐ出して、うしろで新しいものに入れかえる
   ・データ（裏側の Apps Script への POST）は、ここでは一切さわらない
   公開のたびに tools/deploy.cjs が VERSION を書きかえる（それで古い控えが入れかわる）。 */
const VERSION = 'hibi-dev';
const SHELL = ['./', 'index.html', 'css/hibi.css', 'js/core.js', 'js/api.js', 'js/image.js', 'js/guide.js', 'js/sample.js', 'js/app.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(key, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    return res || new Response('オフラインです', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
