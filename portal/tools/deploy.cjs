#!/usr/bin/env node
/* 公開：数学ポータル（portal/）と、小テスト（quiz/）・応用チャレンジ（applied/）・家庭学習ノート（home/）を
   1 つのサイトに組み立てて、Cloudflare Pages（math-portal）に出す。
   同じサイト（同じドメイン）に並べるので、ポータルで1回ログインすれば、3つのツールがそのまま本人を覚えている。

   使い方（リポジトリのいちばん上で）：
     node portal/tools/deploy.cjs                … 組み立てて、公開する（先に、一度だけ：npx wrangler login）
     node portal/tools/deploy.cjs --dry          … 組み立てるだけ（できた場所を表示する）
     node portal/tools/deploy.cjs --out <フォルダ> … 組み立てる場所を決める（手元で確かめる用。公開はしない）

   組み立てたサイトの形（リポジトリと同じ並び。だから相対リンクは手元でもそのまま動く）：
     /index.html          → /portal/ へ案内するだけ
     /portal/             生徒の入口（index.html）・先生用（teacher.html）
     /quiz/ /applied/ /home/   これまでのツール（中身はそのまま。生徒画面にだけ「← 数学ポータル」を足す）
     robots.txt・_headers  検索に出ないようにする
   README・schema.sql・tools は出さない。

   公開先の URL：https://math-portal.pages.dev/（生徒）／ https://math-portal.pages.dev/portal/teacher.html（先生） */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT = 'math-portal';
const root = path.resolve(__dirname, '..', '..');
const TOOLS = ['portal', 'quiz', 'applied', 'home'];
const SKIP = new Set(['README.md', 'schema.sql', 'tools', '.DS_Store']);
// 生徒が使う画面にだけ「← 数学ポータル」を足す（../portal/back.js を読み込ませる）
const BACK_LINK = ['quiz/index.html', 'applied/challenge.html', 'home/index.html'];

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const outArg = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
if (args.includes('--out') && !outArg) { console.error('--out のあとにフォルダを書いてください'); process.exit(1); }

const out = outArg ? path.resolve(outArg) : fs.mkdtempSync(path.join(os.tmpdir(), 'portal-deploy-'));
if (outArg) {
  if (fs.existsSync(out) && fs.readdirSync(out).length && !fs.existsSync(path.join(out, 'portal', 'back.js'))) {
    console.error(`${out} は空ではなく、前に組み立てたものでもありません。別のフォルダを指定してください。`);
    process.exit(1);
  }
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
}

function copyDir(src, dst, top) {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (SKIP.has(name) && (top || name === '.DS_Store')) continue;
    const s = path.join(src, name), d = path.join(dst, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d, false);
    else fs.copyFileSync(s, d);
  }
}
for (const t of TOOLS) copyDir(path.join(root, t), path.join(out, t), true);

for (const rel of BACK_LINK) {
  const f = path.join(out, rel);
  const html = fs.readFileSync(f, 'utf8');
  const at = html.lastIndexOf('</body>');
  if (at < 0) { console.error(`${rel} に </body> が見つからない`); process.exit(1); }
  fs.writeFileSync(f, html.slice(0, at) + '<script src="../portal/back.js"></script>\n' + html.slice(at));
}

fs.writeFileSync(path.join(out, 'index.html'), `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>数学ポータル</title>
<script>location.replace("portal/" + location.search);</script>
<noscript><meta http-equiv="refresh" content="0; url=portal/"></noscript></head>
<body><p><a href="portal/">数学ポータルへ</a></p></body></html>
`);
fs.writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(out, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n');
console.log(`組み立てた：${out}（${fs.readdirSync(out).sort().join('、')}）`);
if (dry || outArg) process.exit(0);

const r = spawnSync('npx', ['wrangler', 'pages', 'deploy', out, '--project-name', PROJECT, '--branch', 'main', '--commit-dirty=true'], { cwd: root, stdio: 'inherit' });
fs.rmSync(out, { recursive: true, force: true });
process.exit(r.status === null ? 1 : r.status);
