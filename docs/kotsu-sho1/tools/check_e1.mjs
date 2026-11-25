// 使い方: node check_e1.mjs out/<担当名>.json [--lessons=kazu10-01,...]
// 構造・件数・書き方を機械で確かめる（正解の正しさは、別に計算で確かめる）。エラー 0 なら終了コード 0。
import fs from 'node:fs';
const file = process.argv[2];
const lessonsArg = (process.argv.find(a => a.startsWith('--lessons=')) || '').slice(10);
const idx = Object.fromEntries(JSON.parse(fs.readFileSync(new URL('./in/index.json', import.meta.url), 'utf8')).map(t => [t.id, t]));
let items; try { items = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('JSON が読めません:', e.message); process.exit(1); }
if (!Array.isArray(items)) { console.error('配列ではありません'); process.exit(1); }
const errs = [], warns = []; const E = (id, m) => errs.push(`${id}: ${m}`), W = (id, m) => warns.push(`${id}: ${m}`);
const norm = s => String(s).replace(/[\s　]/g, '').replace(/＝/g, '=').replace(/－|−/g, '-').replace(/＋/g, '+');
const KANJI1 = new Set('一二三四五六七八九十百千円人子女男上下左右中大小本木林森山川田土日月火水金天気雨空花草竹虫犬貝石玉王口目耳手足力名字文学校先生年早夕白赤青入出立休見音正車村町糸夕');
const seenId = new Set(), seenQ = new Map(), perLesson = {};
for (const it of items) {
  const id = it && it.id || '(idなし)';
  const m = /^([a-z0-9]+-\d\d)-L([1-4])-0([1-5])$/.exec(id);
  if (!m) { E(id, 'id の形がちがう（例 kazu10-03-L2-04）'); continue; }
  const [, l, dd] = m; const t = idx[l];
  if (!t) { E(id, `授業 ${l} は 小1の一覧に ない`); continue; }
  if (seenId.has(id)) E(id, 'id が重なっている'); seenId.add(id);
  const no = String(t.no).padStart(2, '0');
  if (it.u !== `E1-T${t.code}`) E(id, `u は E1-T${t.code}`);
  if (it.s !== `E1-T${t.code}-${no}`) E(id, `s は E1-T${t.code}-${no}`);
  if (it.l !== l) E(id, `l は ${l}`);
  if (it.d !== Number(dd)) E(id, `d は ${dd}（数）`);
  for (const k of ['q', 'e', 'h']) if (typeof it[k] !== 'string' || !it[k].trim()) E(id, `${k} が空`);
  const extra = Object.keys(it).filter(k => !['id', 'u', 's', 'l', 'd', 'q', 'c', 'e', 'h', 'f'].includes(k)); if (extra.length) E(id, `余分な項目: ${extra}`);
  if (it.f !== undefined && !(typeof it.f === 'string' && /^<svg class="fig" viewBox="0 0 \d+(\.\d+)? \d+(\.\d+)?"[^>]*>[\s\S]*<\/svg>$/.test(it.f))) E(id, 'f は figs.py で作った <svg class="fig" …>…</svg> だけ');
  if (it.f && /<script|on[a-z]+=|href=/i.test(it.f)) E(id, 'f に script・イベント・リンクを入れない');
  (perLesson[l] ||= { 1: 0, 2: 0, 3: 0, 4: 0, pos: [0, 0, 0, 0] })[it.d]++;
  if (!Array.isArray(it.c) || it.c.length !== 4) { E(id, '選択肢は4つ'); continue; }
  const ks = it.c.filter(x => x && x.k === 1); if (ks.length !== 1) E(id, `正解（k:1）が ${ks.length} つ`);
  const ci = it.c.findIndex(x => x && x.k === 1); if (ci >= 0) perLesson[l].pos[ci]++;
  const texts = it.c.map(x => norm(x && x.t)); if (new Set(texts).size !== 4) E(id, '選択肢が重なっている');
  for (const x of it.c) {
    if (!x || typeof x.t !== 'string' || !x.t.trim()) E(id, '選択肢の t が空');
    const bad = Object.keys(x || {}).filter(k => !['t', 'k', 'w'].includes(k)); if (bad.length) E(id, `選択肢の余分な項目: ${bad}`);
    if (x && x.k === 1 && x.w) E(id, '正解に w が付いている');
    if (x && x.k !== undefined && x.k !== 1) E(id, 'k は 1 だけ');
  }
  if (it.c.filter(x => x && x.k !== 1 && x.w).length < 2) W(id, 'w（まちがえ方）が 2つ未満');
  const shown = [it.q, it.e, it.h, ...it.c.map(x => x.t), ...it.c.map(x => x.w || '')].join('');
  if (/\$|\\frac|\\times/.test(shown)) E(id, 'TeX（$ や \\frac）は つかわない（小1は ふつうの 文字で）');
  const kanji = [...new Set(shown.match(/[一-龯]/g) || [])].filter(k => !KANJI1.has(k)); if (kanji.length) E(id, `1年で ならわない 漢字: ${kanji.join('')}`);
  if (/図(の|に|で|を)|右の図|下の図|上の図/.test(it.q) && !it.f) E(id, '図を指しているのに f が無い');
  const ans = it.c[ci] && it.c[ci].t; const an = norm(ans || '');
  if (an.length >= 2 && norm(it.h).includes(an) && !/^\d$/.test(an)) W(id, 'ヒントに正解がそのまま出ている');
  if (String(it.q).length > 120) W(id, '問題文が長い（小1は 120字まで）');
  const lines = String(it.e || '').split('\n').filter(Boolean); if (lines.length > 5) W(id, 'e が長い（5行まで）');
  const qk = norm(it.q) + '|' + (it.f || '') + '|' + texts.slice().sort().join('|'); if (seenQ.has(qk)) E(id, `${seenQ.get(qk)} と同じ問題・同じ選択肢`); seenQ.set(qk, id);
}
const want = lessonsArg ? lessonsArg.split(',').filter(Boolean) : null;
if (want) { for (const l of want) if (!perLesson[l]) E(l, '問題が1つも無い'); for (const l of Object.keys(perLesson)) if (!want.includes(l)) E(l, '担当外の授業が入っている'); }
for (const [l, c] of Object.entries(perLesson)) {
  for (const d of [1, 2, 3, 4]) if (c[d] !== 5) E(l, `段階${d}が ${c[d]} 問（5問ずつ）`);
  const tot = c.pos.reduce((a, b) => a + b, 0); if (tot && Math.max(...c.pos) > Math.ceil(tot * 0.4)) W(l, `正解の位置が偏っている ${c.pos}`);
}
console.log(`授業 ${Object.keys(perLesson).length} 本・問題 ${items.length} 問`);
for (const [l, c] of Object.entries(perLesson).sort()) console.log(`  ${l}: ${c[1]}/${c[2]}/${c[3]}/${c[4]}  正解位置 ${c.pos}`);
if (warns.length) { console.log(`\n警告 ${warns.length} 件`); warns.slice(0, 60).forEach(w => console.log('  △ ' + w)); }
if (errs.length) { console.log(`\nエラー ${errs.length} 件`); errs.slice(0, 80).forEach(e => console.log('  ✗ ' + e)); process.exit(1); }
console.log('\nエラー 0');
