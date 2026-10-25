#!/usr/bin/env node
/* データの検査：data/*.js を読みこんで、つながりと書き方を調べる（ブラウザは使わない）。
   使い方：  node tools/check.cjs                        … data/ をすべて調べる
            node tools/check.cjs data/drills-shoot.js    … 指定したファイルだけ（ほかのファイルの id は、tools/registry.cjs にあれば「注意」）
            node tools/check.cjs --quiet                 … 注意（△）は数だけ
   調べること：①id の形・重複　②項目名のまちがい　③指している id があるか（registry にもなければ ✗）
              ④技能の id・level・phase・place などの値　⑤作戦図の場所と人　⑥どこからも挙げられていない練習・視点（全部を調べるときだけ）
   まちがい（✗）が1つでもあれば、終了コード 1。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const picked = args.filter((a) => !a.startsWith('--'));
const dataDir = path.join(root, 'data');
const reg = fs.existsSync(path.join(__dirname, 'registry.cjs')) ? require('./registry.cjs') : null;

const htmlOrder = () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="(data\/[^"]+)"><\/script>/g)].map((m) => m[1]);
};
let files;
if (picked.length) files = ['data/skills.js', ...picked.map((f) => path.relative(root, path.resolve(f))).filter((f) => f !== 'data/skills.js')];
else {
  const all = fs.readdirSync(dataDir).filter((f) => f.endsWith('.js')).map((f) => 'data/' + f);
  let order = [];
  try { order = htmlOrder(); } catch (e) { /* index.html がまだない */ }
  files = ['data/skills.js', ...order.filter((f) => all.includes(f) && f !== 'data/skills.js'), ...all.filter((f) => !order.includes(f) && f !== 'data/skills.js').sort()];
  const notInHtml = all.filter((f) => !order.includes(f));
  if (order.length && notInHtml.length) console.log('△ index.html に書かれていないデータ：' + notInHtml.join('、'));
}

const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
let bad = 0;
const load = (rel) => {
  const f = path.join(root, rel);
  try {
    ctx.BC && (ctx.BC.currentFile = rel);
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: rel });
  } catch (e) {
    console.log(`✗ ${rel} を読みこめない：${e.message}`);
    bad++;
  }
};
load('js/core.js');
// 動き（BC.motion）・ケガ（BC.aid）の登録のしくみを先に（data/motions-*.js・data/aid.js が使う）
for (const f of ['js/motion.js', 'js/aid.js', 'js/grow.js']) if (fs.existsSync(path.join(root, f))) load(f);
for (const f of files) load(f);

const BC = ctx.BC;
const registry = reg ? reg.byKind : null;
const { errors, warns } = BC.validate(registry);
// ファイルをしぼったときは「まだ書かれていない」「どこからも挙げられていない」は出さない
let shown = warns;
if (picked.length) shown = warns.filter((w) => !/一覧にあるが、まだ書かれていない|挙げられていない|まだ書かれていない id/.test(w));
const pending = warns.filter((w) => /まだ書かれていない id/.test(w)).length;
// ほかのファイルに書くはずの id を、このファイルで書いていないか
if (reg) {
  for (const it of BC.all()) {
    const want = reg.fileOf[it.id];
    if (want && it.file_ && want !== it.file_) errors.push(`${it.id}：${want} に書く id（いま ${it.file_}）`);
  }
}
// 動き・ケガのデータ
if (BC.validateMotions) { const m = BC.validateMotions(); for (const e of m.errors) errors.push('動き：' + e); }
if (BC.validateAid && (BC.aids || []).length) { const a = BC.validateAid(); for (const e of a.errors) errors.push('ケガ：' + e); for (const w of a.warns) shown.push('ケガ：' + w); }
for (const e of errors) console.log('✗ ' + e);
if (!quiet) for (const w of shown) console.log('△ ' + w);

const L = BC.lists;
console.log(`\n困りごと ${L.issue.length}・改善の視点 ${L.view.length}・練習メニュー ${L.drill.length}・戦術 ${L.tactic.length}・動き ${Object.keys(BC.motions || {}).length}・ケガ ${(BC.aids || []).length}・テーピング ${(BC.tapes || []).length}：まちがい ${errors.length}・注意 ${shown.length}${picked.length && pending ? `（ほかのファイルの、まだ書かれていない id への参照 ${pending} は数えていない）` : ''}`);
const byFile = {};
for (const it of BC.all()) byFile[it.file_] = (byFile[it.file_] || 0) + 1;
for (const [f, n] of Object.entries(byFile)) {
  const want = reg && reg.files[f] ? Object.keys(reg.files[f].items).length : null;
  console.log(`  ${f.padEnd(26)} ${n}${want != null ? ` / 一覧 ${want}` : ''}`);
}
if (errors.length || bad) process.exitCode = 1;
