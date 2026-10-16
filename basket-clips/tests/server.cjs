// テスト用の静的サーバー（キャッシュなし・Range 対応）。basket-clips/ をそのまま配る
//   node basket-clips/tests/server.cjs [port]   → http://localhost:5192/
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.png': 'image/png', '.svg': 'image/svg+xml' };

function start(port, root) {
  const base = root || ROOT;
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(base, p);
      if (!file.startsWith(base)) { res.writeHead(403); return res.end(); }
      fs.stat(file, (err, st) => {
        if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
        const headers = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' };
        const range = req.headers.range;
        if (range) {
          const m = /bytes=(\d*)-(\d*)/.exec(range);
          const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : st.size - 1;
          res.writeHead(206, Object.assign(headers, { 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }));
          return fs.createReadStream(file, { start: a, end: b }).pipe(res);
        }
        res.writeHead(200, Object.assign(headers, { 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }));
        fs.createReadStream(file).pipe(res);
      });
    });
    srv.listen(port || 0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}/`, close: () => new Promise((r) => srv.close(r)) }));
  });
}
module.exports = { start };
if (require.main === module) start(+(process.argv[2] || 5192)).then((s) => console.log('basket-clips test server ' + s.url));
