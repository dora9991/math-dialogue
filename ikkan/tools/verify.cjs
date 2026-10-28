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
   ⑥ 考えようの解答（教卓の解答）に、考えようの答えが載っていないか（ワークシートの考えようの下の B に、答えを書いていない）
   演習プリント・小テストについて（印刷の3点セット）：
   ⑦ 演習プリントは A4 表裏の 2ページ。表＝基礎・標準、裏＝応用・入試レベル
   ⑧ 小テストは A4 1ページ・10点満点。チャレンジの前の問題の点数（○点）の合計が 10。最後の「チャレンジ」は 1問だけで、別枠（正解なら、ほかがまちがっていても満点） 
   記録ページ（IK.qrUnits の単元）について：
⑨ 演習プリント・小テストに QR があり、読みとりやすい大きさ（33 モジュール＝バージョン 4 まで）か。問題の番号・問題IDがかぶらないか。
   答えのない問題（作図など）は、ひろって知らせる。学習予定表が A4 表裏 2 ページ以内におさまるか
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
const dataDir = fs.readdirSync(path.join(root, 'data'));
const files = ['js/vendor/qrcode.js', 'js/core.js', 'js/qr.js', 'js/figs.js', 'js/geo.js', 'js/figs3d.js', 'js/plan.js', 'js/rec.js', 'js/plansheet.js', 'data/lessons.js',
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

// ⑦ 演習プリントの表と裏
function checkDrill(id, dr) {
  const pages = [[]];
  dr.blocks.forEach(b => { if (b.type === 'break') pages.push([]); else pages[pages.length - 1].push(b); });
  const labels = bl => bl.filter(b => b.type === 'meate' && b.label).map(b => b.label);
  total += 3;
  if (pages.length !== 2) { bad(id, `演習プリントが ${pages.length} ページ（A4 の表裏 2ページにする）`); return; }
  // 新しい形の見出し（確かめる・使ってみる・ひろげる・チャレンジ★★）は、基礎・標準・応用・入試レベルと同じ段として読む
  const AS = { 確かめる: '基礎', 使ってみる: '標準', ひろげる: '応用', 'チャレンジ★★': '入試レベル', 'チャレンジ★': '入試レベル' }, std = x => AS[x] || x;
  const f = labels(pages[0]).map(std), r = labels(pages[1]).map(std);
  if (!(f.includes('基礎') && f.includes('標準')) || f.includes('応用') || f.includes('入試レベル')) bad(id, `演習プリントの表は「基礎・標準」にする（いまの見出し：${f.join('・')}）`);
  else if (!(r.includes('応用') && r.includes('入試レベル')) || r.includes('基礎') || r.includes('標準')) bad(id, `演習プリントの裏は「応用・入試レベル」にする（いまの見出し：${r.join('・')}）`);
  else console.log(`  演習プリント：表＝${f.join('・')}／裏＝${r.join('・')}`);
}

// ⑧ 小テスト：10点満点（チャレンジの前の問題）＋ チャレンジ 1問は別枠（正解なら、ほかがまちがっていても満点）
function checkQuiz(id, qz) {
  total += 5;
  const flat = []; eachBlock(qz.blocks, b => flat.push(b));
  if (flat.some(b => b.type === 'break')) bad(id, '小テストが 2ページ以上ある（A4 1ページにする）');
  const at = flat.findIndex(b => b.type === 'meate' && b.label === 'チャレンジ');
  if (at < 0) { bad(id, '小テストに「チャレンジ」の見出しがない（最後の 1問は入試レベル）'); return; }
  const qs = flat.slice(0, at).filter(b => b.type === 'text' && b.label), after = flat.slice(at + 1).filter(b => b.type === 'text' && b.label);
  if (after.length !== 1) bad(id, `小テストのチャレンジは 1問だけにする（いま ${after.length} 問）`);
  else console.log(`  小テスト：${qs.length}問＋チャレンジ 1問（別枠）`);
  const head = flat.find(b => b.type === 'meate' && b.label === '小テスト'), full = head && String(head.text).match(/／\s*(\d+)点/);
  const pts = qs.map(q => { const m = String(q.text).match(/（(\d+)点）/); return m ? +m[1] : NaN; });
  if (pts.some(isNaN)) bad(id, 'チャレンジの前の問題に、点数（○点）が書いていない問題がある');
  else if (!full) bad(id, '小テストの見出しに、得点らん（／○点）がない');
  else if (+full[1] !== 10) bad(id, `小テストは 10点満点にする（いま ${full[1]}点）`);
  else if (pts.reduce((a, c) => a + c, 0) !== 10) bad(id, `チャレンジの前の問題の点数の合計 ${pts.reduce((a, c) => a + c, 0)} が、満点 10 とちがう`);
  else console.log('  小テスト：チャレンジの前の問題の点数の合計 10点（満点）');
  const ch = flat[at], chQ = after[0];
  if (!/別枠/.test(ch.text) || !/正解/.test(ch.text) || !/10点/.test(ch.text)) bad(id, 'チャレンジの見出しに、「別枠」「正解なら…10点」の説明がない');
  if (chQ && /（\d+点）/.test(chQ.text)) bad(id, 'チャレンジの問題に、点数（○点）を書かない（別枠で、正解なら満点）');
  if (!qs.length || [...qs, ...after].some(q => !flat.slice(flat.indexOf(q) + 1).some(b => b.type === 'board'))) bad(id, '小テストの問題に、解答（B）がない');
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

// ⑨ 記録ページ：QR・問題の取り出し・問題ID
const seen = {};
function checkRec(id) {
  ['dr', 'qz'].forEach(k => {
    const sh = k === 'dr' ? IK.drills[id] : IK.quizzes[id], nm = k === 'dr' ? '演習プリント' : '小テスト';
    if (!sh) return;
    total += 4;
    if (sh.qr !== `r/${id}/${k}`) { bad(id, `${nm}の QR の行き先が ${sh.qr || '（なし）'}（r/${id}/${k} にする）`); return; }
    const size = IK.qr.size(IK.qrBase + '#/' + sh.qr);
    if (size > 33) bad(id, `${nm}の QR が大きすぎる（${size} モジュール。印刷で読みにくくなる。33 まで）`);
    const items = IK.rec.items(id, k), nos = items.map(i => i.no);
    if (!items.length) { bad(id, `${nm}から、問題（（1）（2）…）を取り出せない`); return; }
    if (nos.length !== new Set(nos).size) bad(id, `${nm}の問題の番号がかぶっている：${nos.join('、')}`);
    const noAns = items.filter(i => !i.ans).map(i => i.label);
    console.log(`  記録ページ（${nm}）：${items.length}問・QR ${size}モジュール${noAns.length ? `・答えのない問題 ${noAns.join('')}（作図など）` : ''}`);
    items.forEach(i => { seen[i.id] = (seen[i.id] || 0) + 1; });
  });
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
  if (IK.drills[id]) { checkSheet(id, '演習プリント', IK.drills[id]); checkDrill(id, IK.drills[id]); }
  if (IK.quizzes[id]) { checkSheet(id, '小テスト', IK.quizzes[id]); checkQuiz(id, IK.quizzes[id]); }
  if (IK.plans[id]) checkPlan(id, IK.plans[id]);
  if (IK.qrUnits.indexOf(l.unit) >= 0 && (IK.drills[id] || IK.quizzes[id])) checkRec(id);
}
// ⑨ 問題IDが全体でかぶらないか、学習予定表が表裏 2 ページ以内か
total++;
const dup = Object.keys(seen).filter(k => seen[k] > 1);
if (dup.length) bad('記録', `問題IDがかぶっている：${dup.slice(0, 5).join('、')}`); else console.log(`\n記録ページ：問題ID ${Object.keys(seen).length} 件（かぶりなし）`);
IK.qrUnits.forEach(u => {
  const ps = IK.plansheet(u);
  if (!ps) return;
  total++;
  const n = ps.blocks.filter(b => b.type === 'break').length + 1;
  if (n > 2) bad('学習予定表', `${u}：${n} ページ（A4 表裏の 2 ページにする）`); else console.log(`学習予定表（${u}）：${n} ページ`);
});
console.log(ng ? `\n✗ ${ng} 件の指摘（確かめた項目 ${total}）` : `\n○ 指摘 0（確かめた項目 ${total}）`);
process.exit(ng ? 1 : 0);
