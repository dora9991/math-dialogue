// テスト用の静的サーバー（キャッシュなし）。このフォルダ（開発版）か docs/（1ファイル版）をそのまま配る
//   node tests/server.cjs [port]   → http://127.0.0.1:5194/
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };

function start(port, root) {
  const base = root || ROOT;
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(base, p);
      if (!file.startsWith(base)) { res.writeHead(403); return res.end(); }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(data);
      });
    });
    srv.listen(port || 0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}/`, close: () => new Promise((r) => srv.close(r)) }));
  });
}
module.exports = { start };
if (require.main === module) start(+(process.argv[2] || 5194)).then((s) => console.log('basket-scene test server ' + s.url));
