#!/usr/bin/env node
/* 検算と形の検査（ブラウザなしで動く）。  使い方：node tools/verify.cjs
   ① checks に書いた式が成り立つか（PI＝π、near(a, b)＝ほぼ等しい）
   ② 1ページの行数（37行）におさまっているか
   ③ 板書の行数（\n で区切った行）が、B(行数, …) の枠に入るか
   ④ 1問目（最初の学習課題・例題）には、空欄 {{ }} がないか。2問目以降には、空欄が1つ以上あるか */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
const files = ['js/core.js', 'data/lessons.js', ...fs.readdirSync(path.join(root, 'data')).filter(f => /^ws_.*\.js$/.test(f)).sort().map(f => 'data/' + f)];
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const IK = ctx.IK;

const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
let ng = 0, total = 0;
const bad = (id, msg) => { ng++; console.log(`  ✗ ${id}：${msg}`); };

const hasKadai = b => b.type === 'kadai' || (b.type === 'cols' && b.cols.some(c => c.blocks.some(hasKadai)));
function eachBlock(blocks, fn) { blocks.forEach(b => { fn(b); if (b.type === 'cols') b.cols.forEach(c => eachBlock(c.blocks, fn)); }); }

for (const id of IK.order) {
  const l = IK.lessons[id];
  console.log(`${id}　${l.title}`);
  // ① 検算
  (l.checks || []).forEach(src => {
    total++;
    let ok = false;
    try { ok = !!new Function('PI', 'near', `return (${src});`)(Math.PI, near); } catch (e) { bad(id, `検算の式がエラー ${src}（${e.message}）`); return; }
    if (!ok) bad(id, `検算が合わない：${src}`);
  });
  if (!(l.checks || []).length) console.log('  （検算の式がありません）');
  // ② 行数
  const g = IK.render.geo(l);
  let page = 0, used = 0;
  const flush = () => { total++; if (used > g.rows) bad(id, `ページ${page}：${used}行（上限 ${g.rows}行）`); else console.log(`  ページ${page}：${used}／${g.rows}行`); };
  page = 1;
  l.blocks.forEach(b => { if (b.type === 'break') { flush(); page++; used = 0; } else used += IK.render.heightOf(b); });
  flush();
  // ③ 板書の行数
  eachBlock(l.blocks, b => {
    if (b.type !== 'board' || !b.answer) return;
    total++;
    const n = String(b.answer).split('\n').length;
    if (n > b.rows) bad(id, `板書が ${n} 行で、枠（${b.rows}行）に入らない：「${String(b.answer).slice(0, 14)}…」`);
  });
  // ④ 空欄のきまり
  let k = 0;
  l.blocks.filter(hasKadai).forEach(b => {
    k++;
    const n = (JSON.stringify(b).match(/\{\{/g) || []).length;   // 問題文と図の字（板書 answer には {{ }} を使わない）
    total++;
    if (k === 1 && n > 0) bad(id, `1問目に空欄 {{ }} が ${n} か所ある（1問目は、すべて印刷する）`);
    if (k > 1 && n === 0) bad(id, `${k}問目に空欄 {{ }} がない（先に解けてしまう）`);
    if (k > 1) console.log(`  ${k}問目：空欄 ${n} か所`);
  });
}
console.log(ng ? `\n✗ ${ng} 件の指摘（確かめた項目 ${total}）` : `\n○ 指摘 0（確かめた項目 ${total}）`);
process.exit(ng ? 1 : 0);
