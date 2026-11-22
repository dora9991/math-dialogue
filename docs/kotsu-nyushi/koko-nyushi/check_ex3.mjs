// 使い方: node check_ex3.mjs out/<A-G>   フォルダ内の b*.json（5問ずつ）をまとめて検査する
import fs from 'node:fs'; import path from 'node:path';
const dir = process.argv[2]; const tag = path.basename(dir);
const files = fs.readdirSync(dir).filter(f => /^b\d+\.json$/.test(f)).sort();
const items = [], errs = [], warns = []; const E = (id, m) => errs.push(`${id}: ${m}`), W = (id, m) => warns.push(`${id}: ${m}`);
for (const f of files) { try { const a = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (!Array.isArray(a)) throw new Error('配列ではない'); items.push(...a); } catch (e) { errs.push(`${f}: JSON が読めません: ${e.message}`); } }
const norm = s => String(s).replace(/\$/g, '').replace(/[\s　]/g, '').replace(/＝/g, '=').replace(/－|−/g, '-').replace(/＋/g, '+').replace(/\\left|\\right/g, '').replace(/\\dfrac/g, '\\frac');
const seen = new Set(), pos = [0, 0, 0, 0], dc = { 3: 0, 4: 0 };
for (const it of items) {
  const id = it && it.id || '(idなし)';
  const m = /^ex3-([A-G])-(\d{3})$/.exec(id); if (!m) { E(id, 'id の形がちがう（例 ex3-C-007）'); continue; }
  if (m[1] !== tag) E(id, `分野の記号が ${tag} ではない`); if (seen.has(id)) E(id, 'id が重なっている'); seen.add(id);
  if (it.u !== `J3-X${m[1]}`) E(id, `u は J3-X${m[1]}`); if (it.s !== `J3-X${m[1]}-01`) E(id, `s は J3-X${m[1]}-01`); if (it.l !== `ex3-${m[1]}`) E(id, `l は ex3-${m[1]}`);
  if (it.d !== 3 && it.d !== 4) E(id, 'd は 3 か 4（数）'); else dc[it.d]++;
  for (const k of ['q', 'e', 'h']) if (typeof it[k] !== 'string' || !it[k].trim()) E(id, `${k} が空`);
  const extra = Object.keys(it).filter(k => !['id', 'u', 's', 'l', 'd', 'q', 'c', 'e', 'h'].includes(k)); if (extra.length) E(id, `余分な項目: ${extra}`);
  if (!Array.isArray(it.c) || it.c.length !== 4) { E(id, '選択肢は4つ'); continue; }
  const ci = it.c.findIndex(x => x && x.k === 1); if (it.c.filter(x => x && x.k === 1).length !== 1) E(id, '正解（k:1）は1つだけ'); else pos[ci]++;
  if (new Set(it.c.map(x => norm(x && x.t))).size !== 4) E(id, '選択肢が重なっている');
  for (const x of it.c) { if (!x || typeof x.t !== 'string' || !x.t.trim()) E(id, '選択肢の t が空'); const bad = Object.keys(x || {}).filter(k => !['t', 'k', 'w'].includes(k)); if (bad.length) E(id, `選択肢の余分な項目: ${bad}`); if (x && x.k === 1 && x.w) E(id, '正解に w が付いている'); if (x && x.k !== undefined && x.k !== 1) E(id, 'k は 1 だけ'); }
  if (it.c.filter(x => x && x.k !== 1 && x.w).length < 2) W(id, 'w が2つ未満');
  if ([it.q, it.e, it.h, ...it.c.map(x => x.t)].some(s => ((s || '').match(/\$/g) || []).length % 2 === 1)) E(id, '$ の数が奇数');
  if (/図(の|に|で|を|から|より)|右の図|下の図|上の図|左の図|次の図/.test(it.q)) E(id, '図を指す言い方');
  const an = norm(it.c[ci] && it.c[ci].t || ''); if (an.length >= 3 && norm(it.h).includes(an)) W(id, 'ヒントに正解がそのまま出ている');
  const n = String(it.e || '').split('\n').filter(Boolean).length; if (n < 2) W(id, 'e が1行だけ'); if (String(it.q).length > 260) W(id, '問題文が長い');
}
console.log(`分野 ${tag}：ファイル ${files.length}・問題 ${items.length} 問（d3=${dc[3]} d4=${dc[4]}）正解位置 ${pos}`);
if (warns.length) { console.log(`警告 ${warns.length} 件`); warns.slice(0, 30).forEach(w => console.log('  △ ' + w)); }
if (errs.length) { console.log(`エラー ${errs.length} 件`); errs.slice(0, 40).forEach(e => console.log('  ✗ ' + e)); process.exit(1); }
console.log('エラー 0');
