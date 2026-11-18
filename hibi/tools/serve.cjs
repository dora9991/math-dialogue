#!/usr/bin/env node
/* 開発用サーバー：アプリ（hibi/）を配り、/gas で「にせものの裏側」（gas/Code.gs を tools/gas-mock.cjs の上で動かしたもの）に答える。
   本物の Google にはつながない。データはメモリの上だけ（止めると消える）。
   使い方：node hibi/tools/serve.cjs [--port=8793]
     → 表示された「接続リンク」を開くと、すぐ使える。
   テスト用の口（本物にはない）：
     POST /__outbox   本文の JSON を、Claude の結果として _system/claudeから に置く
     POST /__drop?name=a.jpg&mime=image/jpeg   本文（base64）を、ドライブの受信箱に直接入れたファイルとして置く
     GET  /__state    いまの db.json を返す */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createGasEnv } = require('./gas-mock.cjs');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.md': 'text/markdown; charset=utf-8' };

function start(port, opts = {}) {
  const env = createGasEnv({ serviceUrl: `http://localhost:${port}/gas` });
  env.call('setup');
  const token = env.props.get('TOKEN');
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      const param = Object.fromEntries(url.searchParams);
      const cors = { 'Access-Control-Allow-Origin': '*' };
      try {
        if (url.pathname === '/gas') {
          const r = env.handle(req.method, req.method === 'POST' ? body : null, param);
          res.writeHead(200, Object.assign({ 'Content-Type': (r.mime || 'text/plain') + '; charset=utf-8' }, cors));
          return res.end(r.content);
        }
        if (url.pathname === '/__outbox' && req.method === 'POST') {
          const name = param.name || 'claude_' + env.today() + '_' + Date.now() + '.json';
          env.putFile('ひびの手帳/_system/claudeから', name, 'application/json', body);
          res.writeHead(200, cors); return res.end('ok');
        }
        if (url.pathname === '/__drop' && req.method === 'POST') {
          const n = env.putFile('ひびの手帳/受信箱', param.name || 'drop.jpg', param.mime || 'image/jpeg', Buffer.from(body, 'base64'));
          res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors)); return res.end(JSON.stringify({ fileId: n.id }));
        }
        if (url.pathname === '/__state') {
          res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors));
          return res.end(env.readText(env.find('ひびの手帳/_system/db.json').id));
        }
        let file = path.join(ROOT, decodeURIComponent(url.pathname));
        if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
        // 公開したときと同じ CSP（tools/deploy.cjs の _headers）で動くか確かめる
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://script.google.com https://script.googleusercontent.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" });
        fs.createReadStream(file).pipe(res);
      } catch (e) {
        res.writeHead(500); res.end(String(e.stack || e));
      }
    });
  });
  return new Promise(resolve => server.listen(port, () => {
    const gas = `http://localhost:${port}/gas`;
    const connect = `http://localhost:${port}/#connect=` + Buffer.from(JSON.stringify({ u: gas, t: token })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (!opts.quiet) console.log(`ひびの手帳（開発用）：http://localhost:${port}/\n  裏側の URL：${gas}\n  合言葉：${token}\n  接続リンク：${connect}`);
    resolve({ server, env, token, gas, connect, port });
  }));
}

if (require.main === module) {
  const p = Number((process.argv.find(a => a.startsWith('--port=')) || '').split('=')[1]) || 8793;
  start(p);
}
module.exports = { start };
