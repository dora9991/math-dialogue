#!/usr/bin/env node
/* 検算と形の検査（ブラウザなしで動く）。  使い方：node tools/verify.cjs
   すべての授業について：
   ① checks に書いた式が成り立つか（PI＝π、near(a, b)＝ほぼ等しい）
   ② ワークシート・演習プリントが、1ページの行数（37行）におさまっているか
   ③ 板書・解答の行数（\n で区切った行）が、B(行数, …) の枠に入るか
   ④ ワークシート：1問目（最初の学習課題・例題）には、空欄 {{ }} がないか。2問目以降には、空欄（問題文か表）があるか
      （考えようは、最初から全部印刷する。「ことば」の空欄は、重要語句の穴埋めなので数えない）
   授業計画がある授業について：
   ⑤ 時間割の分の合計が 50 か。解説・発問が 10〜15 分か。演習が 20 分以上か
   ⑥ 考えようの解答（教卓の解答）に、考えようの答えが載っていないか（ワークシートの考えようの下の B に、答えを書いていない） */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
const dataDir = fs.readdirSync(path.join(root, 'data'));
const files = ['js/core.js', 'js/figs.js', 'js/plan.js', 'data/lessons.js',
  ...dataDir.filter(f => /^ws_.*\.js$/.test(f)).sort().map(f => 'data/' + f),
  ...dataDir.filter(f => /^lesson_.*\.js$/.test(f)).sort().map(f => 'data/' + f)];
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const IK = ctx.IK;

const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
let ng = 0, total = 0;
const bad = (id, msg) => { ng++; console.log(`  ✗ ${id}：${msg}`); };

const hasKadai = b => b.type === 'kadai' || (b.type === 'cols' && b.cols.some(c => c.blocks.some(hasKadai)));
function eachBlock(blocks, fn) { blocks.forEach(b => { fn(b); if (b.type === 'cols') b.cols.forEach(c => eachBlock(c.blocks, fn)); }); }
const kids = (b, out) => { if (b.type === 'kadai') out.push(b); if (b.type === 'cols') b.cols.forEach(c => c.blocks.forEach(x => kids(x, out))); return out; };
const blanks = s => (String(s).match(/\{\{/g) || []).length;

// ② 1ページの行数、③ 板書の行数
function checkSheet(id, name, sheet) {
  const g = IK.render.geo(sheet);
  let page = 1, used = 0;
  const flush = () => { total++; if (used > g.rows) bad(id, `${name} ページ${page}：${used}行（上限 ${g.rows}行）`); else console.log(`  ${name} ページ${page}：${used}／${g.rows}行`); };
  sheet.blocks.forEach(b => { if (b.type === 'break') { flush(); page++; used = 0; } else used += IK.render.heightOf(b); });
  flush();
  eachBlock(sheet.blocks, b => {
    if (b.type !== 'board' || !b.answer) return;
    total++;
    const n = String(b.answer).split('\n').length;
    if (n > b.rows) bad(id, `${name} 板書が ${n} 行で、枠（${b.rows}行）に入らない：「${String(b.answer).slice(0, 14)}…」`);
  });
}

// ④ 空欄のきまり（ワークシート）
function checkBlanks(id, l) {
  const problems = [];   // { label, text, blocks: その問題の K をふくむ最上位のブロックと、つぎの K までのブロック }
  l.blocks.forEach(b => {
    const ks = kids(b, []);
    if (ks.length) ks.forEach((k, i) => problems.push({ label: k.label || '学習課題', text: k.text, blocks: i === 0 ? [b] : [] }));
    else if (problems.length) problems[problems.length - 1].blocks.push(b);
  });
  problems.forEach((pr, i) => {
    total++;
    const body = pr.blocks.filter(b => b.type !== 'words');   // 「ことば」の空欄は、重要語句の穴埋め
    const n = blanks(pr.text) + body.reduce((a, b) => a + (b.type === 'table' ? blanks(JSON.stringify(b.data)) : b.type === 'figure' ? blanks(JSON.stringify(b.figs)) : 0), 0);
    if (i === 0) {
      const all = blanks(JSON.stringify(body));
      if (all > 0) bad(id, `1問目に空欄 {{ }} が ${all} か所ある（1問目は、数字もすべて印刷する）`);
      else console.log('  1問目：空欄なし');
    } else if (pr.label === '考えよう') {
      console.log(`  ${i + 1}問目（考えよう）：全部印刷`);
    } else if (n === 0) bad(id, `${i + 1}問目（${pr.label}）の問題文・表・図に空欄 {{ }} がない（先に解けてしまう）`);
    else console.log(`  ${i + 1}問目（${pr.label}）：空欄 ${n} か所`);
  });
  // ⑥ 考えようの下に、答えを書いていない
  const flat = []; eachBlock(l.blocks, b => flat.push(b));
  const at = flat.findIndex(b => b.type === 'kadai' && b.label === '考えよう');
  if (at >= 0) {
    total++;
    const leaked = flat.slice(at + 1).filter(b => b.type === 'board' && b.answer);
    if (leaked.length) bad(id, `考えようの下の板書に答えが書いてある（${leaked.length}か所）。考えようの答えは、教卓の解答に載せない`);
    else console.log('  考えよう：解答なし（答えを載せていない）');
  }
}

// ⑤ 授業計画の時間
function checkPlan(id, p) {
  const sum = p.flow.reduce((a, f) => a + f.m, 0), by = g => p.flow.filter(f => f.g === g).reduce((a, f) => a + f.m, 0);
  total += 3;
  if (sum !== 50) bad(id, `授業計画の時間の合計が ${sum} 分（50 分にする）`); else console.log(`  授業計画：合計 ${sum} 分（導入 ${by('導入')}・小テスト ${by('小テスト')}・解説 ${by('解説')}・演習 ${by('演習')}・振り返り ${by('振り返り')}）`);
  if (by('解説') < 10 || by('解説') > 15) bad(id, `解説・発問が ${by('解説')} 分（10〜15 分にする）`);
  if (by('演習') < 20) bad(id, `演習が ${by('演習')} 分（20 分以上にする）`);
  total++;
  const th = p.think || {};
  if (!th.q || !(th.views || []).length || !(th.hints || []).length || !th.direction) bad(id, '考えようの設計（問い・見方・ヒント・方向性）がそろっていない');
}

for (const id of IK.order) {
  const l = IK.lessons[id];
  console.log(`${id}　${l.title}`);
  (l.checks || []).forEach(src => {
    total++;
    let ok = false;
    try { ok = !!new Function('PI', 'near', `return (${src});`)(Math.PI, near); } catch (e) { bad(id, `検算の式がエラー ${src.slice(0, 40)}…（${e.message}）`); return; }
    if (!ok) bad(id, `検算が合わない：${src.slice(0, 80)}`);
  });
  if (!(l.checks || []).length) console.log('  （検算の式がありません）');
  checkSheet(id, 'ワークシート', l);
  checkBlanks(id, l);
  if (IK.drills[id]) checkSheet(id, '演習プリント', IK.drills[id]);
  if (IK.plans[id]) checkPlan(id, IK.plans[id]);
}
console.log(ng ? `\n✗ ${ng} 件の指摘（確かめた項目 ${total}）` : `\n○ 指摘 0（確かめた項目 ${total}）`);
process.exit(ng ? 1 : 0);
