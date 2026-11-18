#!/usr/bin/env node
/* データの検査：場面のファイル（data/*.js）を読みこんで、つながりと書き方を調べる（ブラウザは使わない）。
   使い方：  node tools/check.cjs                       … data/ の場面をすべて調べる
            node tools/check.cjs data/ijime.js data/sns.js  … 指定した場面だけ（ほかの場面への jump は「まだない」の注意になる）
   調べること：①選択肢の行き先があるか（同じ場面の to、ほかの場面への jump）　②はじめからたどり着けない分かれ道がないか
              ③連携先（team）の id が data/common.js にあるか　④項目名のまちがい・長すぎる見出し・** の閉じ忘れ
   まちがい（✗）が1つでもあれば、終了コード 1 で終わる。注意（△）だけなら 0。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const dataDir = path.join(root, 'data');
const files = args.length
  ? args.map((f) => path.resolve(f))
  : fs.readdirSync(dataDir).filter((f) => f.endsWith('.js') && f !== 'common.js').sort().map((f) => path.join(dataDir, f));

const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
const load = (f) => {
  try {
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: path.relative(root, f) });
  } catch (e) {
    console.log(`✗ ${path.relative(root, f)} を読みこめない：${e.message}`);
    process.exitCode = 1;
  }
};
load(path.join(root, 'js', 'core.js'));
load(path.join(dataDir, 'common.js'));
for (const f of files) load(f);

const { errors, warns } = ctx.SN.validate();
// 指定したファイルだけを調べるときは、データのない場面の注意は出さない（jump 先がない注意は出す）
const shown = args.length ? warns.filter((w) => !w.includes('データ（data/')) : warns;
for (const e of errors) console.log('✗ ' + e);
for (const w of shown) console.log('△ ' + w);

const scs = Object.values(ctx.SN.scenarios);
const nodes = scs.reduce((n, s) => n + Object.keys(s.nodes).length, 0);
console.log(`\n場面 ${scs.length}・分かれ道 ${nodes}：まちがい ${errors.length}・注意 ${shown.length}`);
for (const s of scs) {
  const ns = Object.values(s.nodes);
  const leaves = ns.filter((n) => !(n.options || []).length).length;
  console.log(`  ${s.id.padEnd(10)} ${s.title}（分かれ道 ${ns.length}・行き止まり ${leaves}）`);
}
if (errors.length) process.exitCode = 1;
