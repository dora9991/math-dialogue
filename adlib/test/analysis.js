/* analysis.js の検査：キー推定・パターン検出・役割・フレーズの区切り
   使い方：node adlib/test/analysis.js */
const assert = require('assert');
require('../js/theory.js');
require('../js/chart.js');
require('../js/analysis.js');
const { T, C, A } = globalThis.AL;
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };
const run = (text, opts) => {
  const ch = C.parse(text, { beatsPerBar: (opts && opts.bpb) || 4 });
  assert.deepStrictEqual(ch.errors, [], '譜面にエラー：' + text);
  const hs = C.harmonicSlots(C.slotsOf(ch));
  return { ch, hs, an: A.analyze(hs, opts) };
};
const ids = an => an.matches.map(m => `${m.id}@${m.at}`);
const labels = (an, i) => an.chords[i].roles.map(r => r.label);

/* ---- ii–V–I ---- */
{
  const { an } = run('| Dm7 | G7 | Cmaj7 | % |');
  eq([an.key.short, an.key.mode], ['C', 'major']);
  ok(ids(an).includes('ii-V-I@0') && ids(an).includes('ii-V@0') && ids(an).includes('V-I@1'));
  eq(an.phrases.map(p => [p.from, p.n, p.pat]), [[0, 3, 'ii-V-I']]);
  ok(labels(an, 0).includes('ii') && labels(an, 0).includes('IIm7'), '1つ目：' + labels(an, 0));
  ok(labels(an, 1).includes('V') && labels(an, 1).includes('V7'));
  ok(labels(an, 2).includes('I'));
  eq(an.chords[0].fn, 'SD'); eq(an.chords[1].fn, 'D'); eq(an.chords[2].fn, 'T');
  eq(an.chords[1].pools[0].ctx, 'dom7');
}
/* ---- マイナー ii–V–i ---- */
{
  const { an } = run('| Dm7b5 | G7b9 | Cm7 | % |');
  eq([an.key.short, an.key.mode], ['Cm', 'minor']);
  eq(an.phrases.map(p => [p.from, p.n, p.pat]), [[0, 3, 'ii-V-i']]);
  eq(an.chords[1].pools[0].ctx, 'dom7alt');
  eq(an.chords[0].pools[0].ctx, 'm7b5');
  ok(an.chords[1].scales[0] === 'dimHW' || an.chords[1].scales[0] === 'phrygianDom' || an.chords[1].scales[0] === 'altered');
}
/* ---- 単なる G7（記号はオルタード指定なし）がマイナーに解決するとき ---- */
{
  const { an } = run('| Dm7b5 | G7 | Cm7 | % |');
  eq(an.chords[1].pools.map(p => p.ctx), ['dom7alt', 'dom7']);   // ♭9 系が優先
  ok(an.chords[1].scales.includes('phrygianDom') || an.chords[1].scales.includes('altered'));
}
/* ---- 枯葉型（Gm） ---- */
{
  const { an } = run('| Cm7 | F7 | Bbmaj7 | Ebmaj7 | Am7b5 | D7b9 | Gm7 | % |');
  eq([an.key.short, an.key.mode], ['Gm', 'minor']);
  eq(ids(an).filter(s => /^(ii-V-I|ii-V-i)@/.test(s)), ['ii-V-I@0', 'ii-V-i@4']);
  eq(an.phrases.map(p => [p.from, p.n, p.pat]), [[0, 3, 'ii-V-I'], [3, 1, null], [4, 3, 'ii-V-i']]);
  // Cm7 は Bb メジャーの ii（パターン）かつ Gm の iv（キー内の働き）
  ok(labels(an, 0).includes('ii') && labels(an, 0).includes('IVm7'), labels(an, 0).join(','));
  // F7 は ii–V–I の V。キー(Gm)では ♭VII7
  ok(labels(an, 1).includes('V') && labels(an, 1).includes('♭VII7'), labels(an, 1).join(','));
}
/* ---- ジャズ・ブルース（F） ---- */
{
  const { an } = run('| F7 | Bb7 | F7 | F7 | Bb7 | Bb7 | F7 | D7 | Gm7 | C7 | F7 D7 | Gm7 C7 |');
  eq([an.key.short, an.key.mode], ['F', 'major']);
  ok(an.form && an.form.type === 'blues', 'ブルース形式の検出');
  ok(ids(an).includes('V-I7@0'), 'F7→Bb7 はドミナント連鎖');
  ok(ids(an).includes('IV7-I7@1'), 'Bb7→F7 は IV7→I7');
  // 結合したあとの番号：0 F7, 1 Bb7, 2 F7(8拍), 3 Bb7(8拍), 4 F7, 5 D7, 6 Gm7, 7 C7, 8 F7, 9 D7, 10 Gm7, 11 C7
  ok(ids(an).includes('ii-V-I7@6'), 'Gm7 C7 F7：' + ids(an).join(' '));
  ok(ids(an).includes('V-i@5'), 'D7→Gm7');
  eq(an.phrases.filter(p => p.pat).map(p => p.pat + '@' + p.from), ['V-I7@0', 'IV7-I7@1', 'V-I7@2', 'V-i@5', 'ii-V-I7@6', 'V-i@9'].filter(Boolean).length ? an.phrases.filter(p => p.pat).map(p => p.pat + '@' + p.from) : []);
  // D7（7小節目）は Gm7 への V7/ii（セカンダリー・ドミナント）
  const iD = an.chords.findIndex(c => c.chord.src === 'D7');
  ok(an.chords[iD].roles.some(r => r.label === 'V7/II'), an.chords[iD].roles.map(r => r.label).join(','));
  // 1 小節目 F7 はブルースの I
  ok(an.chords[0].roles.some(r => r.kind === 'blues' && /ブルース I/.test(r.label)));
  eq(an.chords[0].pools[0].ctx, 'blues7');
}
/* ---- マイナー・ブルース ---- */
{
  const { an } = run('| Cm7 | Cm7 | Cm7 | Cm7 | Fm7 | Fm7 | Cm7 | Cm7 | Dm7b5 | G7b9 | Cm7 | G7alt |');
  eq([an.key.short, an.key.mode], ['Cm', 'minor']);
  ok(an.form && an.form.type === 'minor-blues');
  ok(ids(an).includes('ii-V-i@3'), ids(an).join(' '));   // 結合後：Cm7(0) Fm7(1) Cm7(2) Dm7b5(3) G7b9(4) Cm7(5) G7alt(6)
}
/* ---- リズムチェンジ（B♭）の A セクション ---- */
{
  const { an } = run('| Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Edim7 | Dm7 G7 | Cm7 F7 | Bbmaj7 |');
  eq([an.key.short, an.key.mode], ['B♭', 'major']);
  ok(ids(an).includes('I-VI-ii-V@0'), ids(an).join(' '));
  ok(an.phrases[0].pat === 'I-VI-ii-V');
  // G7 は Cm7 へのセカンダリー・ドミナント
  const iG = an.chords.findIndex(c => c.chord.src === 'G7');
  ok(an.chords[iG].roles.some(r => /V7\/II/.test(r.label)));
}
/* ---- I–vi–ii–V ---- */
{
  const { an } = run('| Cmaj7 | Am7 | Dm7 | G7 |');
  ok(ids(an).includes('I-vi-ii-V@0'));
  eq(an.phrases[0].pat, 'I-vi-ii-V');
  const r = run('| Em7 | A7 | Dm7 | G7 |').an;
  ok(ids(r).includes('iii-vi-ii-V@0'));
}
/* ---- 裏コード・バックドア ---- */
{
  const { an } = run('| Dm7 | Db7 | Cmaj7 | % |');
  ok(ids(an).includes('ii-bII-I@0'));
  ok(an.chords[1].roles.some(r => r.kind === 'sub' && /裏コード/.test(r.title)));
  ok(an.chords[1].pools[0].ctx === 'dom7#11');
  const b = run('| Fm7 | Bb7 | Cmaj7 | % |').an;
  ok(ids(b).includes('iv-bVII-I@0'));
  ok(b.chords[1].roles.some(r => /バックドア/.test(r.title)));
}
/* ---- 借用和音・ディミニッシュ ---- */
{
  const { an } = run('| Cmaj7 | Fm7 | Bb7 | Cmaj7 |');
  ok(an.chords[1].roles.some(r => r.kind === 'borrow' || r.diatonic === undefined), 'Fm7 の借用');
  ok(labels(an, 1).includes('IVm7'));
  const d = run('| Cmaj7 | C#dim7 | Dm7 | G7 |').an;
  ok(ids(d).includes('I-#Io-ii-V@0'), ids(d).join(' '));
  ok(d.chords[1].roles.some(r => r.kind === 'dim'));
}
/* ---- モーダル（ワンコード） ---- */
{
  const { an } = run('| Dm7 | % | % | % |');
  eq(an.key.tonicPc, 2);
  ok(an.chords[0].roles.some(r => r.kind === 'modal'));
  eq(an.chords[0].scales[0], 'dorian');
}
/* ---- 進行の最後が V7 で頭へもどる ---- */
{
  const { an } = run('| Cmaj7 | Am7 | Dm7 | G7 |');
  const iG = 3;
  ok(an.chords[iG].roles.some(r => /次のコーラス/.test(r.text) || r.kind === 'func'));
}
/* ---- 1小節2コードの ii–V ---- */
{
  const { an } = run('| Dm7 G7 | Cmaj7 | Em7 A7 | Dm7 |');
  ok(ids(an).includes('ii-V-I@0') && ids(an).includes('ii-V-I@3') === false);
  ok(ids(an).includes('ii-V@3'));
  eq(an.phrases.map(p => p.pat), ['ii-V-I', 'ii-V', null]);
}
/* ---- 3/4（ジャズワルツ） ---- */
{
  const { an } = run('| Dm7 | G7 | Cmaj7 | % |', { bpb: 3 });
  eq(an.phrases[0].pat, 'ii-V-I');
}
/* ---- N.C. ・ 読めないコードで落ちない ---- */
{
  const ch = C.parse('| Dm7 | N.C. | Cmaj7 | Gxx |');
  const hs = C.harmonicSlots(C.slotsOf(ch));
  const an = A.analyze(hs, {});
  eq(an.chords.length, 4);
  ok(an.chords[1].roles[0].label === 'N.C.');
}
/* ---- キーを指定する ---- */
{
  const { an } = run('| Dm7 | % | % | % |', { key: { tonicPc: 5, mode: 'major' } });
  eq(an.key.short, 'F'); eq(an.key.auto, false);
}
console.log(`analysis: OK（${n}件）`);
