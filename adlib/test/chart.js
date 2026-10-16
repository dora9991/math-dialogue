/* chart.js の検査：コード譜の文字 → 小節、くり返しの展開、書きもどし、移調
   使い方：node adlib/test/chart.js */
const assert = require('assert');
require('../js/theory.js');
require('../js/chart.js');
const { T, C } = globalThis.AL;
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };
const srcs = chart => chart.bars.map(b => b.chords.map(c => c.src).join(' '));

/* ---- 基本 ---- */
{
  const ch = C.parse('| Dm7 | G7 | Cmaj7 | % |');
  eq(srcs(ch), ['Dm7', 'G7', 'Cmaj7', 'Cmaj7']);
  eq(ch.errors, []);
  eq(ch.chorusBars, 4); eq(ch.chorusBeats, 16);
  const sl = C.slotsOf(ch);
  eq(sl.map(s => [s.t0, s.dur]), [[0, 4], [4, 4], [8, 4], [12, 4]]);
  const hs = C.harmonicSlots(sl);
  eq(hs.map(s => [s.src, s.t0, s.dur]), [['Dm7', 0, 4], ['G7', 4, 4], ['Cmaj7', 8, 8]]);   // % でつながった Cmaj7 は1つに
}
// 1小節に複数コード
{
  const ch = C.parse('| Dm7 G7 | Cmaj7 | C6 A7 Dm7 G7 | Em7 A7 D7 |');
  eq(ch.bars[0].chords.map(c => [c.beat, c.dur]), [[0, 2], [2, 2]]);
  eq(ch.bars[2].chords.map(c => [c.beat, c.dur]), [[0, 1], [1, 1], [2, 1], [3, 1]]);
  eq(ch.bars[3].chords.map(c => [c.beat, c.dur]), [[0, 2], [2, 1], [3, 1]]);   // 3つ → 2+1+1
  // 3/4 拍子
  const w = C.parse('| Dm7 G7 | Cmaj7 | Em7 A7 D7 |', { beatsPerBar: 3 });
  eq(w.bars[0].chords.map(c => [c.beat, c.dur]), [[0, 2], [2, 1]]);
  eq(w.bars[2].chords.map(c => [c.beat, c.dur]), [[0, 1], [1, 1], [2, 1]]);
}
// . で拍を保持
{
  const ch = C.parse('| Dm7 . . G7 | C . G7 . |');
  eq(ch.bars[0].chords.map(c => [c.src, c.beat, c.dur]), [['Dm7', 0, 3], ['G7', 3, 1]]);
  eq(ch.bars[1].chords.map(c => [c.src, c.beat, c.dur]), [['C', 0, 2], ['G7', 2, 2]]);
}
// 縦線なし：1語＝1小節
{
  const ch = C.parse('Dm7 G7 Cmaj7');
  eq(srcs(ch), ['Dm7', 'G7', 'Cmaj7']);
}
// コメント・改行・N.C.・スラッシュ
{
  const ch = C.parse('// ブルース\n| F7 | Bb7 | # メモ\n F7 | N.C. | C/E | Dm7/G |');
  eq(srcs(ch), ['F7', 'Bb7', 'F7', 'N.C.', 'C/E', 'Dm7/G']);
  ok(ch.bars[3].chords[0].chord.nc);
  eq(ch.bars[5].chords[0].chord.bassPc, 7);
}
// 読めないコード
{
  const ch = C.parse('| Dm7 | Gxyz | C |');
  eq(ch.errors.length, 1);
  ok(ch.errors[0].word === 'Gxyz');
  ok(ch.bars[1].chords[0].chord.bad);
}
// 空
{
  const ch = C.parse('');
  eq(ch.bars.length, 0); eq(ch.chorusBeats, 0);
  eq(C.parse('|| | |').bars.length, 0);
}
// % の前に小節がない
eq(C.parse('| % | C |').errors.length, 1);

/* ---- くり返し・かっこ ---- */
{
  const ch = C.parse('|: Dm7 | G7 :| Cmaj7 |');
  eq(ch.order.map(i => srcs(ch)[i]), ['Dm7', 'G7', 'Dm7', 'G7', 'Cmaj7']);
  const a = C.parse('| A | B :| C |');                 // |: が無ければ頭にもどる
  eq(a.order, [0, 1, 0, 1, 2]);
  const e = C.parse('|: Dm7 | G7 | [1 Cmaj7 | A7 :| [2 Cmaj7 | % |');
  eq(e.order.map(i => e.bars[i].chords[0].src), ['Dm7', 'G7', 'Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7', 'Cmaj7']);
  eq(e.bars.map(b => b.ending), [null, null, 1, 1, 2, 2]);
  eq(e.chorusBars, 8);
  // 2番かっこは次のくり返しで終わる
  const f = C.parse('|: A | [1 B :| [2 C | |: D | E :| F |');
  eq(f.order.map(i => f.bars[i].chords[0].src), ['A', 'B', 'A', 'C', 'D', 'E', 'D', 'E', 'F']);
  // セクション記号
  const g = C.parse('*A\n| C | G |\n*B\n| F | C |');
  eq(g.bars.map(b => b.section), ['A', null, 'B', null]);
}

/* ---- 書きもどし（整形）→ もう一度読むと同じ構造 ---- */
{
  const texts = [
    '| Dm7 | G7 | Cmaj7 | % |',
    '|: Dm7 | G7 | [1 Cmaj7 | A7 :| [2 Cmaj7 | % |',
    '*A\n| C6 A7 | Dm7 G7 | Em7 A7 | Dm7 G7 |\n*B\n| Dm7 . . G7 | C |',
    '| F7 | Bb7 | F7 | F7 | Bb7 | Bb7 | F7 | D7 | Gm7 | C7 | F7 D7 | Gm7 C7 |',
    '|: A :| |: B | C :| D |',
  ];
  for (const t of texts) {
    const a = C.parse(t);
    const f = C.formatText(a);
    const b = C.parse(f);
    eq(b.errors, [], `整形後にエラー：${f}`);
    const sig = c => JSON.stringify(c.bars.map(x => [x.chords.map(y => [y.src, y.beat, y.dur]), !!x.repeatStart, !!x.repeatEnd, x.ending, x.section]));
    eq(sig(b), sig(a), `整形のくり返しで構造が変わった：\n${f}`);
    eq(b.order, a.order);
  }
  eq(C.formatText(C.parse('| Dm7 | G7 | Cmaj7 | Cmaj7 | Am7 | D7 |')), '| Dm7 | G7 | Cmaj7 | % |\n| Am7 | D7 |');
}

/* ---- 移調 ---- */
{
  const src = '| Dm7 G7 | Cmaj7 | % | // コメント\n';
  eq(C.transposeText(src, 5, { tonicPc: 5, fifths: -1 }), '| Gm7 C7 | Fmaj7 | % | // コメント\n');
  eq(C.transposeText('| Dm7 | G7 | C |', 2, { tonicPc: 2, fifths: 2 }), '| Em7 | A7 | D |');
  eq(C.transposeText('|: Dm7b5/G | G7b9 :| [1 C6/9 |', -2, { tonicPc: 10, fifths: -2 }), '|: Cm7b5/F | F7b9 :| [1 Bb6/9 |');
  // 12回半音あげても同じ高さ
  let s = '| Dm7 | G7 | Cmaj7 |';
  for (let i = 0; i < 12; i++) s = C.transposeText(s, 1, { tonicPc: 0, fifths: 0 });
  eq(C.parse(s).bars.map(b => b.chords[0].chord.rootPc), [2, 7, 0]);
}
console.log(`chart: OK（${n}件）`);
