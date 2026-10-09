#!/usr/bin/env node
/* 公開：1 つにまとめた HTML を index.html にして、Cloudflare Pages（math-ikkan）に出す。
   使い方：  node tools/deploy.cjs          … まとめて、公開する（Cloudflare にログイン済みであること：npx wrangler login）
            node tools/deploy.cjs --dry    … まとめるだけ（できた場所を表示する）
   出すもの：index.html（全ワークシート入り）・robots.txt・_headers（検索に出ないようにする）。README や tools は出さない。
   公開先の URL：https://math-ikkan.pages.dev/ */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT = 'math-ikkan';
const root = path.resolve(__dirname, '..');
const dry = process.argv.includes('--dry');

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'ikkan-deploy-'));
const b = spawnSync(process.execPath, [path.join(__dirname, 'bundle.cjs'), path.join(out, 'index.html')], { stdio: 'inherit' });
if (b.status !== 0) { console.error('まとめるのに失敗した'); process.exit(b.status || 1); }
fs.writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(out, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n/index.html\n  Cache-Control: no-cache\n');
console.log(`組み立てた：${out}（${fs.readdirSync(out).join('、')}）`);
if (dry) process.exit(0);

const r = spawnSync('npx', ['wrangler', 'pages', 'deploy', out, '--project-name', PROJECT, '--branch', 'main', '--commit-dirty=true'], { cwd: root, stdio: 'inherit' });
fs.rmSync(out, { recursive: true, force: true });
process.exit(r.status === null ? 1 : r.status);
