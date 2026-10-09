// talk-g2/validate.mjs — Mac の check.mjs が使えない場所で、台本(scenes/<ID>.js)の「構造」だけを確かめる簡易検査。
//  ・KL（T/B/Q/lesson/FIG/lbl/…）を差し替えて台本を実行し、字幕の長さ・4択・ステップ数などを数える。
//  ・黒板のはみ出し・図の見た目・読み上げは確かめない（それは Mac の check.mjs --shots で）。
//  使い方: node validate.mjs <ID> [<ID>...]   /  node validate.mjs --all   /  node validate.mjs --file path/to/script.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
let files = [];
if (args.includes('--all')) files = fs.readdirSync(path.join(HERE, 'scenes')).filter(f => f.endsWith('.js')).map(f => path.join(HERE, 'scenes', f));
else if (args[0] === '--file') files = args.slice(1);
else files = args.map(id => path.join(HERE, 'scenes', id.replace(/\.js$/, '') + '.js'));

const MAX_SUB = 52;            // 字幕（sub があれば sub、なければ本文）の、1文の最大文字数
const EXPECT_CLIPS = [34, 56]; // 声の本数（T/B の行すべて・分岐ぶんも数える）のめやす

function makeKL(out) {
  const mk = name => (...a) => ({ k: name, a });
  const KL = {
    T: (text, o = {}) => ({ who: 'T', text, ...o }),
    B: (text, o = {}) => ({ who: 'B', text, ...o }),
    Q: (id, q, choices, br = {}) => ({ type: 'Q', id, q, choices, br }),
    FIG: (id, view, w, h, prims, o = {}) => ({ type: 'fig', id, view, w, h, prims, ...o }),
    tbl: (rows, o = {}) => ({ type: 'table', rows, ...o }),
    lesson: def => { out.lesson = def; },
  };
  for (const n of ['lbl', 'rect', 'poly', 'seg', 'arc', 'pt', 'circle', 'sector', 'arrow', 'hist']) KL[n] = mk(n);
  KL.cells = (...a) => [{ k: 'cells', a }];                                   // 配列で返る部品（展開して使う台本がある）
  KL.S3 = new Proxy({}, { get: (_, n) => (...a) => [{ k: 'S3.' + String(n), a }] });
  return KL;
}

// 表示される字幕の文字数：{{ }} ** は取り、[[a/b]] は a/b
const plain = s => String(s).replace(/\{\{|\}\}|\*\*/g, '').replace(/\[\[([^\]]*)\]\]/g, '$1');
const subtitleOf = st => plain(st.sub != null ? st.sub : st.text);

function check(file) {
  const id = path.basename(file).replace(/\.js(\.verbatim)?(\.js)?$/, '').replace(/^example-/, '');
  const errs = [], warns = [];
  const src = fs.readFileSync(file, 'utf8');
  const out = {};
  try { vm.runInNewContext(src, { KL: makeKL(out), Math, console, String, Array, Object, Number, JSON }, { filename: file, timeout: 5000 }); }
  catch (e) { return { id, errs: ['実行できない: ' + e.message], warns, n: 0 }; }
  const L = out.lesson;
  if (!L) return { id, errs: ['KL.lesson が呼ばれていない'], warns, n: 0 };
  if (L.id !== id) errs.push(`id「${L.id}」がファイル名「${id}」とちがう`);
  for (const k of ['unit', 'kick', 'title', 'card', 'sub']) if (!L[k]) errs.push(`${k} が空`);
  if (!Array.isArray(L.cols) || L.cols.length !== 2) errs.push('cols が [左,右] でない');
  if (/\\n/.test(src.replace(/'[^'\n]*\\n[^'\n]*'/g, "''")) ) { /* ふつうの \n は文字列の中で使う */ }
  if (/\\\\n/.test(src)) errs.push('「\\\\n」が文字のまま入っている');
  if (!Array.isArray(L.steps) || !L.steps.length) return { id, errs: [...errs, 'steps が空'], warns, n: 0 };

  let clips = 0, qn = 0, titles = 0, results = 0, last = L.steps[L.steps.length - 1];
  const seenIds = new Set();
  const lineCheck = (st, where) => {
    if (!st || !st.who) { errs.push(`${where}: T/B でない要素`); return; }
    clips++;
    const sub = subtitleOf(st);
    if (!st.text || !String(st.text).trim()) errs.push(`${where}: 本文が空`);
    // 字幕は1文ずつ（。！？で区切る）出る。1文が52字をこえると、check.mjs が警告する
    for (const sent of sub.split(/(?<=[。！？])/)) if (sent.trim().length > MAX_SUB) errs.push(`${where}: 1文が${sent.trim().length}字（${MAX_SUB}字まで）「${sent.trim().slice(0, 20)}…」`);
    if (/[^\u0000-\u007f]'|'[^\u0000-\u007f]/.test(String(st.text)) && /'/.test(String(st.text))) warns.push(`${where}: 半角 ' が本文にある`);
    if (st.title) titles++;
    if (st.result) results++;
    if (st.who === 'B' && st.up !== true) warns.push(`${where}: ポンタの行に up:true がない`);
    if (st.ft && !['normal', 'happy', 'surprised', 'sigh', 'think', 'proud', 'sorry'].includes(st.ft)) errs.push(`${where}: ft「${st.ft}」は未定義`);
    if (st.fb && !['happy', 'star', 'surprised', 'confused', 'sad', 'think', 'proud', 'spiral', 'sweat'].includes(st.fb)) errs.push(`${where}: fb「${st.fb}」は未定義`);
    if (st.who === 'T' && st.fb) { /* 先生行に fb を付ける例がある（kukan）ので許す */ }
  };
  L.steps.forEach((st, i) => {
    const w = `step${i + 1}`;
    if (st.type === 'Q') {
      qn++;
      if (seenIds.has(st.id)) errs.push(`${w}: Q の id「${st.id}」が重複`);
      seenIds.add(st.id);
      lineCheck(st.q, w + '(問い)');
      const ch = st.choices || [];
      if (ch.length !== 4) errs.push(`${w}: 選択肢が${ch.length}個（4択にする）`);
      const oks = ch.map((c, j) => (c.ok ? j : -1)).filter(j => j >= 0);
      if (oks.length !== 1) errs.push(`${w}: 正解が${oks.length}個（ちょうど1つ）`);
      const texts = ch.map(c => String(c.t));
      if (new Set(texts).size !== texts.length) errs.push(`${w}: 選択肢に同じ文がある`);
      texts.forEach((t, j) => { if (plain(t).length > 20) warns.push(`${w}: 選択肢${j}が長い（${plain(t).length}字）`); });
      const br = st.br || {};
      if (!br.ok || !br.ok.length) errs.push(`${w}: ok（正解のときの返し）がない`);
      if (!br.wrong || !br.wrong.length) errs.push(`${w}: wrong（その他の誤答の返し）がない`);
      for (const [key, arr] of Object.entries(br)) {
        if (!/^(ok|wrong|\d)$/.test(key)) errs.push(`${w}: 分岐キー「${key}」が不正`);
        if (/^\d$/.test(key)) {
          const j = Number(key);
          if (j >= ch.length) errs.push(`${w}: 分岐 ${key} は選択肢の外`);
          else if (ch[j].ok) errs.push(`${w}: 分岐 ${key} は正解の選択肢（ok で書く）`);
        }
        (arr || []).forEach((s2, j) => lineCheck(s2, `${w}.${key}[${j}]`));
      }
    } else lineCheck(st, w);
  });
  if (titles !== 3) warns.push(`title:true が${titles}個（開始は3ステップ）`);
  if (!last.result) errs.push('最後のステップに result:true がない');
  if (results !== 1) errs.push(`result:true が${results}個（1つだけ）`);
  if (qn < 3 || qn > 5) warns.push(`4択が${qn}問（3〜5問）`);
  if (clips < EXPECT_CLIPS[0] || clips > EXPECT_CLIPS[1]) warns.push(`声の本数が${clips}（めやす ${EXPECT_CLIPS[0]}〜${EXPECT_CLIPS[1]}）`);
  return { id, errs, warns, n: clips, qn };
}

let bad = 0;
for (const f of files) {
  if (!fs.existsSync(f)) { console.log(`✗ ${path.basename(f)}: ファイルがない`); bad++; continue; }
  const r = check(f);
  const mark = r.errs.length ? '✗' : r.warns.length ? '⚠' : '✓';
  console.log(`${mark} ${r.id}  声${r.n}本 4択${r.qn ?? '-'}問`);
  r.errs.forEach(e => console.log('   ✗ ' + e));
  r.warns.forEach(e => console.log('   ⚠ ' + e));
  if (r.errs.length) bad++;
}
if (files.length > 1) console.log(`\n${files.length - bad}/${files.length} 本が✗なし`);
process.exit(bad ? 1 : 0);
