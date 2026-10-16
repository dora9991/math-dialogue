#!/usr/bin/env node
/* 公開：アプリ（hibi/ の画面のファイル）を、Cloudflare Pages（プロジェクト名 hibi-techo）に出す。ikkan と同じやり方。
   使い方：  node hibi/tools/deploy.cjs          … 組み立てて、公開する（先に一度だけ：npx wrangler login）
            node hibi/tools/deploy.cjs --dry    … 組み立てるだけ（できた場所を表示する）
   出すもの：index.html・css・js・icons・manifest・sw.js と、検索に出ないための robots.txt・_headers。gas/・tools/・docs/ は出さない。
   sw.js の VERSION は、中身から作った番号に書きかえる（公開のたびに、iPhone の控えが新しくなる）。
   公開先の URL：https://hibi-techo.pages.dev/（名前がほかの人に使われていたら、wrangler が別の URL を出す） */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const PROJECT = 'hibi-techo';
const root = path.resolve(__dirname, '..');
const dry = process.argv.includes('--dry');
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'css/hibi.css', 'js/core.js', 'js/api.js', 'js/passkey.js', 'js/image.js', 'js/guide.js', 'js/sample.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'hibi-deploy-'));
const hash = crypto.createHash('sha256');
FILES.forEach(f => {
  const src = path.join(root, f);
  if (!fs.existsSync(src)) { console.error('ない：' + f); process.exit(1); }
  fs.mkdirSync(path.dirname(path.join(out, f)), { recursive: true });
  fs.copyFileSync(src, path.join(out, f));
  if (f !== 'sw.js') hash.update(fs.readFileSync(src));
});
const ver = 'hibi-' + hash.digest('hex').slice(0, 10);
const sw = path.join(out, 'sw.js');
fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/const VERSION = '[^']*';/, `const VERSION = '${ver}';`));
fs.writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; " +
  "connect-src 'self' https://script.google.com https://script.googleusercontent.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
fs.writeFileSync(path.join(out, '_headers'), `/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Content-Security-Policy: ${csp}\n/index.html\n  Cache-Control: no-cache\n/sw.js\n  Cache-Control: no-cache\n`);
console.log(`組み立てた：${out}（${ver}）`);
if (dry) process.exit(0);

const r = spawnSync('npx', ['wrangler', 'pages', 'deploy', out, '--project-name', PROJECT, '--branch', 'main', '--commit-dirty=true'], { cwd: root, stdio: 'inherit' });
fs.rmSync(out, { recursive: true, force: true });
process.exit(r.status === null ? 1 : r.status);
