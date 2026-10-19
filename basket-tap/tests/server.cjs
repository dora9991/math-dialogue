// テスト用の静的サーバー（キャッシュなし）。basket-tap/ か public/basket-tap/ をそのまま配る
//   node basket-tap/tests/server.cjs [port]   → http://127.0.0.1:5193/
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };

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
if (require.main === module) start(+(process.argv[2] || 5193)).then((s) => console.log('basket-tap test server ' + s.url));
