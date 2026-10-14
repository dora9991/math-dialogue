/* theory.js の検査：コード記号の読みとり・綴り・移調・調号・ローマ数字
   使い方：node adlib/test/theory.js */
const assert = require('assert');
require('../js/theory.js');
const T = globalThis.AL.T;
let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };
const eq = (a, b, msg) => { assert.deepStrictEqual(a, b, msg); n++; };

/* ---- 音名・音高 ---- */
eq(T.parseSpell('F#'), { l: 3, a: 1 });
eq(T.parseSpell('Bb'), { l: 6, a: -1 });
eq(T.parseSpell('Cb'), { l: 0, a: -1 });
eq(T.parseSpell('H'), null);
eq(T.spellStr({ l: 6, a: -1 }), 'Bb');
eq(T.spellStr({ l: 3, a: 1 }, true), 'F♯');
eq(T.pitchMidi(T.parsePitch('C4')), 60);
eq(T.pitchMidi(T.parsePitch('A4')), 69);
eq(T.pitchMidi(T.parsePitch('Cb4')), 59);
eq(T.pitchMidi(T.parsePitch('B#3')), 60);
eq(T.pitchStr(T.pitchFromMidi(61, true)), 'Db4');
eq(T.pitchStr(T.pitchFromMidi(61, false)), 'C#4');
eq(T.pitchStr(T.pitchFromMidi(71, false)), 'B4');
// 文字ぶんの距離と半音で動かす（綴りが保たれる）
eq(T.pitchStr(T.shiftPitch(T.parsePitch('C4'), 2, 4)), 'E4');           // 長3度
eq(T.pitchStr(T.shiftPitch(T.parsePitch('G4'), 2, 4)), 'B4');
eq(T.pitchStr(T.shiftPitch(T.parsePitch('F#4'), 2, 4)), 'A#4');
eq(T.pitchStr(T.shiftPitch(T.parsePitch('B3'), 1, 2)), 'C#4');
eq(T.pitchStr(T.shiftPitch(T.parsePitch('Bb3'), 1, 1)), 'Cb4');        // 短2度（B♭→C♭）
eq(T.pitchStr(T.shiftPitch(T.parsePitch('F##4'), 2, 4)), 'A##4');       // 二重♯は綴れる
eq(T.shiftPitch(T.parsePitch('F##4'), 1, 3), null);                      // 三重♯は綴れない

/* ---- 度数 ---- */
eq(T.parseDegree('b7'), { n: 7, alt: -1, steps: 6, semis: 10 });
eq(T.parseDegree('#11'), { n: 11, alt: 1, steps: 10, semis: 18 });
eq(T.parseDegree('b13').semis, 20);
eq(T.spellStr(T.degreeSpell(T.parseSpell('G'), 'b9')), 'Ab');
eq(T.spellStr(T.degreeSpell(T.parseSpell('G'), '#9')), 'A#');
eq(T.spellStr(T.degreeSpell(T.parseSpell('F#'), '7')), 'E#');
eq(T.spellStr(T.degreeSpell(T.parseSpell('Db'), 'b7')), 'Cb');
eq(T.spellStr(T.degreeSpell(T.parseSpell('C'), 'b5')), 'Gb');
eq(T.spellStr(T.degreeSpell(T.parseSpell('C'), '#4')), 'F#');

/* ---- コード記号 ---- */
// [書き方, 種類, 構成音（度数名:音名）]
const CH = [
  ['C', 'maj', '1:C 3:E 5:G'],
  ['Cmaj7', 'maj', '1:C 3:E 5:G 7:B'],
  ['CM7', 'maj', '1:C 3:E 5:G 7:B'],
  ['C^7', 'maj', '1:C 3:E 5:G 7:B'],
  ['CΔ7', 'maj', '1:C 3:E 5:G 7:B'],
  ['CΔ', 'maj', '1:C 3:E 5:G 7:B'],
  ['Cmaj', 'maj', '1:C 3:E 5:G 7:B'],
  ['Cmaj9', 'maj', '1:C 3:E 5:G 7:B 9:D'],
  ['Cmaj13', 'maj', '1:C 3:E 5:G 7:B 9:D 13:A'],
  ['Cmaj7#11', 'maj', '1:C 3:E 5:G 7:B #11:F#'],
  ['Cmaj7(#11)', 'maj', '1:C 3:E 5:G 7:B #11:F#'],
  ['Cmaj7#5', 'maj', '1:C 3:E #5:G# 7:B'],
  ['C6', 'maj', '1:C 3:E 5:G 6:A'],
  ['C69', 'maj', '1:C 3:E 5:G 6:A 9:D'],
  ['C6/9', 'maj', '1:C 3:E 5:G 6:A 9:D'],
  ['Cadd9', 'maj', '1:C 3:E 5:G 9:D'],
  ['Cm', 'min', '1:C b3:Eb 5:G'],
  ['C-', 'min', '1:C b3:Eb 5:G'],
  ['Cmin7', 'min', '1:C b3:Eb 5:G b7:Bb'],
  ['Cm7', 'min', '1:C b3:Eb 5:G b7:Bb'],
  ['C-7', 'min', '1:C b3:Eb 5:G b7:Bb'],
  ['Cm9', 'min', '1:C b3:Eb 5:G b7:Bb 9:D'],
  ['Cm11', 'min', '1:C b3:Eb 5:G b7:Bb 9:D 11:F'],
  ['Cm6', 'min', '1:C b3:Eb 5:G 6:A'],
  ['Cm69', 'min', '1:C b3:Eb 5:G 6:A 9:D'],
  ['Cm(maj7)', 'minmaj', '1:C b3:Eb 5:G 7:B'],
  ['CmM7', 'minmaj', '1:C b3:Eb 5:G 7:B'],
  ['Cmmaj7', 'minmaj', '1:C b3:Eb 5:G 7:B'],
  ['C-Δ7', 'minmaj', '1:C b3:Eb 5:G 7:B'],
  ['Cm7b5', 'hdim', '1:C b3:Eb b5:Gb b7:Bb'],
  ['Cm7(b5)', 'hdim', '1:C b3:Eb b5:Gb b7:Bb'],
  ['Cm7-5', 'hdim', '1:C b3:Eb b5:Gb b7:Bb'],
  ['Cø', 'hdim', '1:C b3:Eb b5:Gb b7:Bb'],
  ['Cø7', 'hdim', '1:C b3:Eb b5:Gb b7:Bb'],
  ['Cdim', 'dim', '1:C b3:Eb b5:Gb'],
  ['Cdim7', 'dim', '1:C b3:Eb b5:Gb bb7:Bbb'],
  ['Co7', 'dim', '1:C b3:Eb b5:Gb bb7:Bbb'],
  ['C°7', 'dim', '1:C b3:Eb b5:Gb bb7:Bbb'],
  ['C7', 'dom', '1:C 3:E 5:G b7:Bb'],
  ['C9', 'dom', '1:C 3:E 5:G b7:Bb 9:D'],
  ['C13', 'dom', '1:C 3:E 5:G b7:Bb 9:D 13:A'],
  ['C7b9', 'dom', '1:C 3:E 5:G b7:Bb b9:Db'],
  ['C7(b9)', 'dom', '1:C 3:E 5:G b7:Bb b9:Db'],
  ['C7#9', 'dom', '1:C 3:E 5:G b7:Bb #9:D#'],
  ['C7#11', 'dom', '1:C 3:E 5:G b7:Bb #11:F#'],
  ['C7b13', 'dom', '1:C 3:E 5:G b7:Bb b13:Ab'],
  ['C7b5', 'dom', '1:C 3:E b5:Gb b7:Bb'],
  ['C7#5', 'dom', '1:C 3:E #5:G# b7:Bb'],
  ['C7+', 'dom', '1:C 3:E #5:G# b7:Bb'],
  ['C+7', 'dom', '1:C 3:E #5:G# b7:Bb'],
  ['C7b9#11', 'dom', '1:C 3:E 5:G b7:Bb b9:Db #11:F#'],
  ['C7#9b13', 'dom', '1:C 3:E 5:G b7:Bb #9:D# b13:Ab'],
  ['C7(b9,#11)', 'dom', '1:C 3:E 5:G b7:Bb b9:Db #11:F#'],
  ['C13b9', 'dom', '1:C 3:E 5:G b7:Bb b9:Db 13:A'],
  ['C9#11', 'dom', '1:C 3:E 5:G b7:Bb 9:D #11:F#'],
  ['C7alt', 'dom', '1:C 3:E b7:Bb b9:Db #9:D# #11:F# b13:Ab'],
  ['Caug', 'aug', '1:C 3:E #5:G#'],
  ['C+', 'aug', '1:C 3:E #5:G#'],
  ['Csus4', 'sus', '1:C 4:F 5:G'],
  ['Csus', 'sus', '1:C 4:F 5:G'],
  ['Csus2', 'sus', '1:C 2:D 5:G'],
  ['C7sus4', 'sus', '1:C 4:F 5:G b7:Bb'],
  ['C9sus4', 'sus', '1:C 4:F 5:G b7:Bb 9:D'],
  ['C13sus4', 'sus', '1:C 4:F 5:G b7:Bb 9:D 13:A'],
  ['C11', 'sus', '1:C 4:F 5:G b7:Bb 9:D'],
  ['C5', 'pow', '1:C 5:G'],
  ['F#m7b5', 'hdim', '1:F# b3:A b5:C b7:E'],
  ['Bbmaj7', 'maj', '1:Bb 3:D 5:F 7:A'],
  ['Ebm7', 'min', '1:Eb b3:Gb 5:Bb b7:Db'],
  ['Abmaj7', 'maj', '1:Ab 3:C 5:Eb 7:G'],
  ['Db7', 'dom', '1:Db 3:F 5:Ab b7:Cb'],
  ['B7b9', 'dom', '1:B 3:D# 5:F# b7:A b9:C'],
  ['E7#9', 'dom', '1:E 3:G# 5:B b7:D #9:F##'],
];
for (const [src, cls, tones] of CH) {
  const c = T.parseChord(src);
  ok(c, `読めない：${src}`);
  eq(c.cls, cls, `${src} の種類`);
  eq(c.tones.map(t => t.name + ':' + T.spellStr(t.sp)).join(' '), tones, `${src} の構成音`);
}
// 読めないものは null
for (const bad of ['', 'H7', 'Cxyz', 'C7(b9', 'C7q']) ok(T.parseChord(bad) === null || bad === 'C7(b9', `読めないはず：${bad}`);
// スラッシュコード・N.C.
{
  const c = T.parseChord('C/E');
  eq([c.rootPc, c.bassPc, c.cls], [0, 4, 'maj']);
  const d = T.parseChord('Dm7/G');
  eq([d.rootPc, d.bassPc], [2, 7]);
  const nc = T.parseChord('N.C.');
  ok(nc && nc.nc, 'N.C.');
  ok(T.parseChord('NC').nc);
}
// ガイドトーン
{
  const g = T.parseChord('G7');
  eq([g.guide3, g.guide7], [11, 5]);
  const d = T.parseChord('Dm7');
  eq([d.guide3, d.guide7], [5, 0]);
  const m = T.parseChord('Cmaj7');
  eq([m.guide3, m.guide7], [4, 11]);
  const s6 = T.parseChord('C6');
  eq([s6.guide3, s6.guide7], [4, 9]);
}
// 表示用
{
  const p = T.chordParts(T.parseChord('Bbm7b5/E'));
  eq(p, { root: 'B♭', suffix: 'm7♭5', bass: 'E' });
  eq(T.chordText(T.parseChord('F#7#9'), true), 'F♯7♯9');
  eq(T.chordText(T.parseChord('F#7#9'), false), 'F#7#9');
}

/* ---- スケール ---- */
eq(T.scaleNotes(T.parseSpell('C'), 'mixolydian').map(s => T.spellStr(s)).join(' '), 'C D E F G A Bb');
eq(T.scaleNotes(T.parseSpell('G'), 'altered').map(s => T.spellStr(s)).join(' '), 'G Ab A# B Db Eb F');
eq(T.scaleNotes(T.parseSpell('D'), 'dorian').map(s => T.spellStr(s)).join(' '), 'D E F G A B C');
eq(T.scaleNotes(T.parseSpell('F#'), 'ionian').map(s => T.spellStr(s)).join(' '), 'F# G# A# B C# D# E#');
eq(T.scaleNotes(T.parseSpell('C'), 'bebopDom').map(s => T.spellStr(s)).join(' '), 'C D E F G A Bb B');
eq(T.scalePcs(0, 'dimHW').join(','), '0,1,3,4,6,7,9,10');
eq(T.defaultScales(T.parseChord('G7'))[0], 'mixolydian');
eq(T.defaultScales(T.parseChord('G7alt'))[0], 'altered');
eq(T.defaultScales(T.parseChord('G7b9'))[0], 'dimHW');
eq(T.defaultScales(T.parseChord('Dm7'))[0], 'dorian');
eq(T.defaultScales(T.parseChord('Dm7b5'))[0], 'locrian2');
eq(T.defaultScales(T.parseChord('Cmaj7#11'))[0], 'lydian');
eq(T.defaultScales(T.parseChord('C7#11'))[0], 'lydianDom');

/* ---- 調号 ---- */
eq(T.keyFifths(T.parseSpell('C'), 'major'), 0);
eq(T.keyFifths(T.parseSpell('G'), 'major'), 1);
eq(T.keyFifths(T.parseSpell('Bb'), 'major'), -2);
eq(T.keyFifths(T.parseSpell('F#'), 'major'), 6);
eq(T.keyFifths(T.parseSpell('Db'), 'major'), -5);
eq(T.keyFifths(T.parseSpell('A'), 'minor'), 0);
eq(T.keyFifths(T.parseSpell('C'), 'minor'), -3);
eq(T.keyFifths(T.parseSpell('G'), 'minor'), -2);
eq(T.keyFifths(T.parseSpell('F#'), 'minor'), 3);
eq(T.keySigAccs(-2), [0, 0, -1, 0, 0, 0, -1]);   // B♭ と E♭
eq(T.keySigAccs(3), [1, 0, 0, 1, 1, 0, 0]);      // F♯ C♯ G♯
eq(T.keySigAccs(0), [0, 0, 0, 0, 0, 0, 0]);

/* ---- 移調 ---- */
{
  const F = { tonicPc: 5, fifths: -1 }, G = { tonicPc: 7, fifths: 1 }, C = { tonicPc: 0, fifths: 0 };
  eq(T.transposeChordStr('Dm7', 3, C), 'Fm7');
  eq(T.transposeChordStr('G7', 5, C), 'C7');
  eq(T.transposeChordStr('Cmaj7', 5, F), 'Fmaj7');
  eq(T.transposeChordStr('Cmaj7', 1, { tonicPc: 1, fifths: -5 }), 'Dbmaj7');
  eq(T.transposeChordStr('Cmaj7', 6, { tonicPc: 6, fifths: -6 }), 'Gbmaj7');
  eq(T.transposeChordStr('Cmaj7', 7, G), 'Gmaj7');
  eq(T.transposeChordStr('A7b9', 7, G), 'E7b9');
  eq(T.transposeChordStr('Dm7b5/G', 5, F), 'Gm7b5/C');
  eq(T.transposeChordStr('C#dim7', 2, { tonicPc: 2, fifths: 2 }), 'D#dim7');
  eq(T.transposeChordStr('N.C.', 3, C), 'N.C.');
  eq(T.transposeChordStr('Bb7', -2, C), 'Ab7');
  // C のなかの迷い：ドミナントは♭、m7♭5 は♯
  eq(T.transposeChordStr('Gb7', 0, C), 'Gb7');
  eq(T.transposeChordStr('F#m7b5', 0, C), 'F#m7b5');
  // 12回まわしても元にもどる（音の高さ）
  for (const src of ['Cmaj7', 'Dm7b5', 'G7alt', 'Ab6/9', 'F#m7']) {
    let s = src;
    for (let i = 0; i < 12; i++) s = T.transposeChordStr(s, 1, { tonicPc: 0, fifths: 0 });
    eq(T.parseChord(s).rootPc, T.parseChord(src).rootPc, `${src} を12回半音上げる`);
  }
}

/* ---- ローマ数字 ---- */
{
  const r = (s, t) => T.romanLabel(T.parseChord(s), t);
  eq(r('Dm7', 0), 'IIm7');
  eq(r('G7', 0), 'V7');
  eq(r('Cmaj7', 0), 'Imaj7');
  eq(r('Db7', 0), '♭II7');
  eq(r('Bb7', 0), '♭VII7');
  eq(r('F#m7b5', 0), '♯IVm7♭5');
  eq(r('Gb7', 0), '♭V7');
  eq(r('Dm7b5', 0), 'IIm7♭5');
  eq(r('C/E', 0), 'I/III');
  eq(r('Ab', 3), 'IV');          // E♭ の調の A♭ は IV
  eq(r('Abmaj7', 3), 'IVmaj7');
  eq(r('Ebm7', 2), '♭IIm7');      // D のドリアンから E♭m7
  eq(r('Dbm7', 0), '♭IIm7');
  eq(r('C#m7', 0), '♯Im7');
  eq(r('Gbm7b5', 0), '♭Vm7♭5');
}
console.log(`theory: OK（${n}件）`);
