/* 証明パターン集のデータ（★・★★）。1つの証明＝1つのオブジェクト。書き方は heikou/js/geo.js の GE.proof を見る。
   図の座標は、仮定どおりになるように正確に決める（行に書いた「＝」「≡」「∥」は、ページを開くと座標で確かめられる）。
   ★（k01〜k10）：等しい3組が見えやすい。根拠を答える。
   ★★（s01〜s12）：かくれた等しい組（共通・対頂角・錯角・同位角・角や長さのたし算ひき算・内角の和）を自分で見つける。合同から平行・合同を2回も。
   問題文・図・数値は自作（教科書・学力調査・入試の定番の形を参考にした）。
   ※ index.html は geo.js を読まずにこのファイルを読むので、座標の計算は GE を使わず、下の小さな道具で行う。 */
window.SHOMEI = window.SHOMEI || [];
(function () {
var RD = Math.PI / 180;
function pol(c, r, d) { return [c[0] + r * Math.cos(d * RD), c[1] + r * Math.sin(d * RD)]; }
function rot(p, c, d) { var t = d * RD, x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * Math.cos(t) - y * Math.sin(t), c[1] + x * Math.sin(t) + y * Math.cos(t)]; }
function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
function foot(p, a, b) { var d = [b[0] - a[0], b[1] - a[1]], t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]); return [a[0] + d[0] * t, a[1] + d[1] * t]; }
function refl(p, a, b) { var f = foot(p, a, b); return [2 * f[0] - p[0], 2 * f[1] - p[1]]; }
function meet(a, b, c, d) { var r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0], t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den; return [a[0] + r[0] * t, a[1] + r[1] * t]; }
/* 点の組 P を、c を中心に d 度まわす */
function turn(P, d, c) { c = c || [0, 0]; var Q = {}; Object.keys(P).forEach(function (k) { Q[k] = rot(P[k], c, d); }); return Q; }
/* よく使う行 */
var SAS = '2組の辺とその間の角が、それぞれ等しいので', ASA = '1組の辺とその両端の角が、それぞれ等しいので', SSS = '3組の辺が、それぞれ等しいので';
function hen(t) { return [{ t: '合同な図形の対応する辺は等しいので', q: '合同な図形の、どんな性質を使う？', a: '対応する辺は等しい' }, { t: t }]; }
function kaku(t) { return [{ t: '合同な図形の対応する角は等しいので', q: '合同な図形の、どんな性質を使う？', a: '対応する角は等しい' }, { t: t }]; }

/* ---- 座標 ---- */
/* k02：2つの三角形（SAS）。△DEF は △ABC をまわしてずらした形 */
var k02 = (function () {
  var B = [0, 0], C = [4.2, 0], A = pol(B, 3.2, 62), E = [4.9, -2.5];
  function m(p) { var q = rot(p, B, -18); return [q[0] + E[0], q[1] + E[1]]; }
  return { A: A, B: B, C: C, D: m(A), E: m(B), F: m(C) };
})();
/* k03：裏返しの三角形（ASA）。△DEF は △ABC を直線で折り返した形 */
var k03 = (function () {
  var B = [0, 0], C = [4.4, 0], A = meet(B, pol(B, 1, 58), C, pol(C, 1, 180 - 46)), l0 = [5.2, 0], l1 = [6.0, 3];
  return { A: A, B: B, C: C, D: refl(A, l0, l1), E: refl(B, l0, l1), F: refl(C, l0, l1) };
})();
/* k04：たこ形 */
var k04 = turn((function () { var A = [-3.4, 0], C = [3.4, 0], B = [-0.8, 2.6]; return { A: A, B: B, C: C, D: refl(B, A, C) }; })(), 14);
/* k05：交わる2直線（左右の折り返し） */
var k05 = turn((function () { var O = [0, 0]; return { O: O, A: pol(O, 3.6, 55), C: pol(O, 2.6, 125), B: pol(O, 3.6, -55), D: pol(O, 2.6, 235) }; })(), 6);
/* k06：AB∥CD の砂時計形（O について点対称） */
var k06 = (function () { var O = [0, 0]; return { O: O, A: pol(O, 3.2, 140), D: pol(O, 3.2, -40), B: pol(O, 2.4, 220), C: pol(O, 2.4, 40) }; })();
/* k07：中線をのばす */
var k07 = (function () { var B = [0, 0], C = [6, 0], A = [1.5, 3.6], M = mid(B, C); return { A: A, B: B, C: C, M: M, D: [2 * M[0] - A[0], 2 * M[1] - A[1]] }; })();
/* k08：二辺の上の点（AD＝AE、∠ADC＝∠AEB） */
var k08 = (function () { var A = [0, 5], B = [-3, 0], C = [3, 0]; return { A: A, B: B, C: C, D: lerp(A, B, .42), E: lerp(A, C, .42) }; })();
/* k09：角の二等分線（OA＝OB） */
var k09 = (function () { var O = [0, 0]; return { O: O, X: pol(O, 7, -10), Y: pol(O, 7, 60), A: pol(O, 3.6, -10), B: pol(O, 3.6, 60), P: pol(O, 6, 25) }; })();
/* k10：垂直二等分線（L は直線 ℓ のはし） */
var k10 = turn({ A: [-3.4, 0], B: [3.4, 0], M: [0, 0], P: [0, 4.2], L: [0, -1.8] }, 10);
/* s01：底辺 BC を共有する2つの三角形 */
var s01 = { B: [0, 0], C: [6.4, 0], A: [1.3, 3.4], D: [5.1, 3.4] };
/* s02：角の2辺の上の4点（OA＝OB、∠OAD＝∠OBC） */
var s02 = (function () { var O = [0, 0]; return { O: O, X: pol(O, 6.6, -15), Y: pol(O, 6.6, 45), A: pol(O, 2.4, -15), C: pol(O, 5.2, -15), B: pol(O, 2.4, 45), D: pol(O, 5.2, 45) }; })();
/* s03：平行な2直線 ℓ（UV）、m（ST） */
var s03 = (function () { var A = [0.6, 3.8], B = [3.4, 0], M = mid(A, B), Pp = [4.4, 3.8]; return { U: [-1.4, 3.8], V: [6.2, 3.8], S: [-1.4, 0], T: [6.2, 0], A: A, B: B, M: M, P: Pp, Q: [2 * M[0] - Pp[0], 2 * M[1] - Pp[1]] }; })();
/* s04：一直線上の4点 B, E, C, F（△DEF は △ABC を右へずらした形） */
var s04 = (function () { var B = [0, 0], C = [5.2, 0], A = [1.4, 3.3], s = 1.5; return { A: A, B: B, C: C, D: [A[0] + s, A[1]], E: [B[0] + s, 0], F: [C[0] + s, 0] }; })();
/* s05：頂点 B を共有する2つの三角形（∠ABD＝∠CBE） */
var s05 = (function () { var B = [0, 0]; return { B: B, A: pol(B, 4.2, 170), D: pol(B, 4.2, 120), C: pol(B, 3, 60), E: pol(B, 3, 10) }; })();
/* s06：一直線上の点 B で2つの三角形（∠ABD＝∠CBE。180° からひく） */
var s06 = (function () { var B = [0, 0]; return { A: [-4.2, 0], B: B, C: [3.2, 0], D: pol(B, 4.2, 180 - 58), E: pol(B, 3.2, 58) }; })();
/* s07：向かい合う辺が等しい四角形 */
var s07 = { A: [0, 0], B: [5, -0.8], C: [6.6, 2.8], D: [1.6, 3.6] };
/* s08：中点で交わる線分（k01 と同じ仮定・ちがう形） */
var s08 = (function () { var O = [0, 0]; return { O: O, A: pol(O, 3.8, 105), B: pol(O, 3.8, 285), C: pol(O, 2.8, 200), D: pol(O, 2.8, 20) }; })();
/* s09：辺の上の2点（AD＝AE、DB＝EC） */
var s09 = (function () { var A = [0, 0], B = pol(A, 6, 24), C = pol(A, 6, -30); return { A: A, B: B, C: C, D: lerp(A, B, .42), E: lerp(A, C, .42) }; })();
/* s10：中点で交わる線分と、O を通る直線 PQ（O について点対称） */
var s10 = (function () { var O = [0, 0], A = pol(O, 3.6, 160), C = pol(O, 3, 215), P = meet(O, pol(O, 1, 192), A, C);
  return { O: O, A: A, B: [-A[0], -A[1]], C: C, D: [-C[0], -C[1]], P: P, Q: [-P[0], -P[1]] }; })();
/* s11：中線 AM に下ろした垂線 BD、CE */
var s11 = (function () { var B = [0, 0], C = [6.4, 0], M = mid(B, C), A = pol(M, 4.6, 128); return { A: A, B: B, C: C, M: M, D: foot(B, A, M), E: foot(C, A, M) }; })();
/* s12：角の二等分線と ∠OPA＝∠OPB */
var s12 = (function () { var O = [0, 0]; return { O: O, X: pol(O, 7.2, -20), Y: pol(O, 7.2, 50), P: pol(O, 4.5, 15), A: pol(O, 5.4, -20), B: pol(O, 5.4, 50) }; })();

window.SHOMEI.push(
  { id: 'k01', lv: 1, kind: '合同（基本）', ttl: '中点で交わる2本の線分',
    q: '線分 AB と CD が点 O で交わり、AO＝BO、CO＝DO のとき、AC＝BD であることを証明しよう。',
    P: { A: [-4, 2], B: [4, -2], C: [-3, -2], D: [3, 2], O: [0, 0] },
    fig: { segs: ['AB', 'CD', 'AC', 'BD'], ticks: [['AO', 1], ['BO', 1], ['CO', 2], ['DO', 2]], dir: { O: 'n' } },
    hyp: 'AO＝BO、CO＝DO', goal: 'AC＝BD', tri: ['AOC', 'BOD'],
    L: [{ t: '△AOC と △BOD で' }, { t: 'AO＝BO', r: '仮定', n: 1 }, { t: 'CO＝DO', r: '仮定', n: 2 }, { t: '∠AOC＝∠BOD', r: '対頂角は等しい', n: 3 },
      { t: '①②③より、2組の辺とその間の角が、それぞれ等しいので', c: 'SAS' }, { t: '△AOC≡△BOD' },
      { t: '合同な図形の対応する辺は等しいので', q: '合同な図形の、どんな性質を使う？', a: '対応する辺は等しい' }, { t: 'AC＝BD' }],
    point: { a: '対頂角は、図にかいていなくても使える「かくれた等しい角」' } },

  /* ================= ★ ================= */
  { id: 'k02', lv: 1, kind: '合同（基本）', ttl: '2つの三角形（2辺とその間の角）',
    q: '△ABC と △DEF で、AB＝DE、BC＝EF、∠ABC＝∠DEF のとき、AC＝DF であることを証明しよう。',
    P: k02,
    fig: { segs: ['AB', 'BC', 'CA', 'DE', 'EF', 'FD'], ticks: [['AB', 1], ['DE', 1], ['BC', 2], ['EF', 2]], angs: [['ABC', 1], ['DEF', 1]], dir: { A: 'n', B: 'sw', C: 'se', D: 'n', E: 'sw', F: 'se' } },
    hyp: 'AB＝DE、BC＝EF、∠ABC＝∠DEF', goal: 'AC＝DF', tri: ['ABC', 'DEF'],
    L: [{ t: '△ABC と △DEF で' }, { t: 'AB＝DE', r: '仮定', n: 1 }, { t: 'BC＝EF', r: '仮定', n: 2 }, { t: '∠ABC＝∠DEF', r: '仮定', n: 3 },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△ABC≡△DEF' }].concat(hen('AC＝DF')),
    point: { a: '∠B は、辺 AB と辺 BC の「間の角」。だから 2辺とその間の角', sub: '合同条件を言う前に、角が2辺にはさまれているかを確かめる' } },

  { id: 'k03', lv: 1, kind: '合同（基本）', ttl: '裏返しの三角形（1辺と両端の角）',
    q: '△ABC と △DEF で、BC＝EF、∠ABC＝∠DEF、∠ACB＝∠DFE のとき、AB＝DE であることを証明しよう。',
    P: k03,
    fig: { segs: ['AB', 'BC', 'CA', 'DE', 'EF', 'FD'], ticks: [['BC', 1], ['EF', 1]], angs: [['ABC', 1], ['DEF', 1], ['ACB', 2], ['DFE', 2]], dir: { A: 'n', B: 'sw', C: 'se', D: 'ne', E: 'se', F: 'w' } },
    hyp: 'BC＝EF、∠ABC＝∠DEF、∠ACB＝∠DFE', goal: 'AB＝DE', tri: ['ABC', 'DEF'],
    L: [{ t: '△ABC と △DEF で' }, { t: 'BC＝EF', r: '仮定', n: 1 }, { t: '∠ABC＝∠DEF', r: '仮定', n: 2 }, { t: '∠ACB＝∠DFE', r: '仮定', n: 3 },
      { t: '①②③より、' + ASA, c: 'ASA' }, { t: '△ABC≡△DEF' }].concat(hen('AB＝DE')),
    point: { a: '裏返しになっていても合同。対応する頂点を同じ順に書く', sub: 'B と E、C と F、A と D が対応する' } },

  { id: 'k04', lv: 1, kind: '共通な辺', ttl: 'たこ形の対角線',
    q: '四角形 ABCD で、AB＝AD、CB＝CD のとき、∠ABC＝∠ADC であることを証明しよう。',
    P: k04,
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'AC'], ticks: [['AB', 1], ['AD', 1], ['CB', 2], ['CD', 2]] },
    hyp: 'AB＝AD、CB＝CD', goal: '∠ABC＝∠ADC', tri: ['ABC', 'ADC'],
    L: [{ t: '△ABC と △ADC で' }, { t: 'AB＝AD', r: '仮定', n: 1 }, { t: 'CB＝CD', r: '仮定', n: 2 }, { t: 'AC＝AC', r: '共通', n: 3 },
      { t: '①②③より、' + SSS, c: 'SSS' }, { t: '△ABC≡△ADC' }].concat(kaku('∠ABC＝∠ADC')),
    point: { a: '2つの三角形のどちらにも入っている辺 AC は「共通」で、いつでも等しい' } },

  { id: 'k05', lv: 1, kind: '対頂角', ttl: '交わる2直線と等しい角',
    q: '線分 AD と BC が点 O で交わり、AO＝BO、∠OAC＝∠OBD のとき、AC＝BD であることを証明しよう。',
    P: k05,
    fig: { segs: ['AD', 'BC', 'AC', 'BD'], ticks: [['AO', 1], ['BO', 1]], angs: [['OAC', 1], ['OBD', 1]], dir: { O: 'e' } },
    hyp: 'AO＝BO、∠OAC＝∠OBD', goal: 'AC＝BD', tri: ['AOC', 'BOD'],
    L: [{ t: '△AOC と △BOD で' }, { t: 'AO＝BO', r: '仮定', n: 1 }, { t: '∠OAC＝∠OBD', r: '仮定', n: 2 }, { t: '∠AOC＝∠BOD', r: '対頂角は等しい', n: 3 },
      { t: '①②③より、' + ASA, c: 'ASA' }, { t: '△AOC≡△BOD' }].concat(hen('AC＝BD')),
    point: { a: '辺 AO の両はしの角は ∠A と ∠O。∠O は対頂角で等しい' } },

  { id: 'k06', lv: 1, kind: '平行線と角', ttl: '平行な2辺と交わる線分',
    q: '線分 AD と BC が点 O で交わり、AB∥CD、AO＝DO のとき、AB＝DC であることを証明しよう。',
    P: k06,
    fig: { segs: ['AD', 'BC', 'AB', 'CD'], ticks: [['AO', 1], ['DO', 1]], pars: [['AB', 1], ['CD', 1]], dir: { O: 'n' } },
    hyp: 'AB∥CD、AO＝DO', goal: 'AB＝DC', tri: ['ABO', 'DCO'],
    L: [{ t: '△ABO と △DCO で' }, { t: 'AO＝DO', r: '仮定', n: 1 }, { t: '∠BAO＝∠CDO', r: '平行線の錯角は等しい', n: 2 }, { t: '∠AOB＝∠DOC', r: '対頂角は等しい', n: 3 },
      { t: '①②③より、' + ASA, c: 'ASA' }, { t: '△ABO≡△DCO' }].concat(hen('AB＝DC')),
    point: { a: '平行線があったら、錯角（Z の形）の等しい角をさがす' } },

  { id: 'k07', lv: 1, kind: '中点', ttl: '中線をのばした図形',
    q: '△ABC の辺 BC の中点を M とする。線分 AM を M のほうへのばし、AM＝DM となる点 D をとるとき、AB＝DC であることを証明しよう。',
    P: k07,
    fig: { segs: ['AB', 'BC', 'CA', 'AD', 'DC'], ticks: [['BM', 1], ['CM', 1], ['AM', 2], ['DM', 2]], dir: { M: 'ne' } },
    hyp: 'BM＝CM、AM＝DM', goal: 'AB＝DC', tri: ['ABM', 'DCM'],
    L: [{ t: '△ABM と △DCM で' }, { t: 'BM＝CM', r: '仮定', n: 1 }, { t: 'AM＝DM', r: '仮定', n: 2 }, { t: '∠AMB＝∠DMC', r: '対頂角は等しい', n: 3 },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△ABM≡△DCM' }].concat(hen('AB＝DC')),
    point: { a: '「M は BC の中点」は、BM＝CM という仮定のこと' } },

  { id: 'k08', lv: 1, kind: '共通な角', ttl: '2辺の上の点と等しい角',
    q: '△ABC の辺 AB 上に点 D、辺 AC 上に点 E があり、AD＝AE、∠ADC＝∠AEB のとき、BE＝CD であることを証明しよう。',
    P: k08,
    fig: { segs: ['AB', 'BC', 'CA', 'BE', 'CD'], ticks: [['AD', 1], ['AE', 1]], angs: [['ADC', 1], ['AEB', 1]], dir: { D: 'w', E: 'e' } },
    hyp: 'AD＝AE、∠ADC＝∠AEB', goal: 'BE＝CD', tri: ['AEB', 'ADC'],
    L: [{ t: '△AEB と △ADC で' }, { t: 'AE＝AD', r: '仮定', n: 1 }, { t: '∠AEB＝∠ADC', r: '仮定', n: 2 }, { t: '∠EAB＝∠DAC', r: '共通', n: 3 },
      { t: '①②③より、' + ASA, c: 'ASA' }, { t: '△AEB≡△ADC' }].concat(hen('BE＝CD')),
    point: { a: '重なった三角形は、別々にぬき出してみると、∠A が共通だとわかる' } },

  { id: 'k09', lv: 1, kind: '角の二等分線', ttl: '角の二等分線上の点',
    q: '∠XOY の二等分線上に点 P をとる。辺 OX 上に点 A、辺 OY 上に点 B を、OA＝OB となるようにとるとき、PA＝PB であることを証明しよう。',
    P: k09,
    fig: { segs: ['OX', 'OY', 'OP', 'PA', 'PB'], ticks: [['OA', 1], ['OB', 1]], angs: [['AOP', 1], ['BOP', 1]], dir: { O: 'w', A: 's', P: 'e' } },
    hyp: 'OA＝OB、∠AOP＝∠BOP', goal: 'PA＝PB', tri: ['OAP', 'OBP'],
    L: [{ t: '△OAP と △OBP で' }, { t: 'OA＝OB', r: '仮定', n: 1 }, { t: '∠AOP＝∠BOP', r: '仮定', n: 2 }, { t: 'OP＝OP', r: '共通', n: 3 },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△OAP≡△OBP' }].concat(hen('PA＝PB')),
    point: { a: '「OP は ∠XOY の二等分線」は、∠AOP＝∠BOP という仮定のこと' } },

  { id: 'k10', lv: 1, kind: '垂直二等分線', ttl: '垂直二等分線上の点',
    q: '線分 AB の垂直二等分線 ℓ と AB の交点を M とし、ℓ 上に点 P をとる。このとき、∠APM＝∠BPM であることを証明しよう。',
    P: k10,
    fig: { segs: ['AB', 'PL', 'PA', 'PB'], ticks: [['AM', 1], ['BM', 1]], rights: ['PMB'], labels: ['A', 'B', 'M', 'P', 'L'], name: { L: 'ℓ' }, dir: { M: 'se', P: 'n', L: 'e' } },
    hyp: 'AM＝BM、PM⊥AB', goal: '∠APM＝∠BPM', tri: ['PAM', 'PBM'],
    L: [{ t: '△PAM と △PBM で' }, { t: 'AM＝BM', r: '仮定', n: 1 }, { t: '∠PMA＝∠PMB＝90°', r: '仮定', n: 2 }, { t: 'PM＝PM', r: '共通', n: 3 },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△PAM≡△PBM' }].concat(kaku('∠APM＝∠BPM')),
    point: { a: '「垂直二等分線」は、AM＝BM と ∠PMA＝∠PMB＝90° の2つの仮定', sub: '同じように PA＝PB もいえる' } },

  /* ================= ★★ ================= */
  { id: 's01', lv: 2, kind: '共通な辺', ttl: '底辺を共有する2つの三角形',
    q: '図で、AB＝DC、AC＝DB のとき、∠ABC＝∠DCB であることを証明しよう。',
    P: s01,
    fig: { segs: ['AB', 'AC', 'DB', 'DC', 'BC'], ticks: [['AB', 1], ['DC', 1], ['AC', 2], ['DB', 2]] },
    hyp: 'AB＝DC、AC＝DB', goal: '∠ABC＝∠DCB', tri: ['ABC', 'DCB'],
    L: [{ t: '△ABC と △DCB で' }, { t: 'AB＝DC', r: '仮定', n: 1 }, { t: 'AC＝DB', r: '仮定', n: 2 },
      { t: 'BC＝CB', r: '共通', n: 3, hint: 'もう1組。2つの三角形のどちらにも入っている辺は？' },
      { t: '①②③より、' + SSS, c: 'SSS' }, { t: '△ABC≡△DCB' }].concat(kaku('∠ABC＝∠DCB')),
    point: { a: '重なった三角形では、どちらにも入っている辺（共通）をさがす', sub: '頂点の順：A↔D、B↔C、C↔B' } },

  { id: 's02', lv: 2, kind: '共通な角', ttl: '角の2辺の上の4点',
    q: '∠XOY の辺 OX 上に点 A、C、辺 OY 上に点 B、D があり、OA＝OB、∠OAD＝∠OBC のとき、AD＝BC であることを証明しよう。',
    P: s02,
    fig: { segs: ['OX', 'OY', 'AD', 'BC'], ticks: [['OA', 1], ['OB', 1]], angs: [['OAD', 1], ['OBC', 1]], dir: { O: 'w', A: 's', C: 's', B: 'nw', D: 'nw' } },
    hyp: 'OA＝OB、∠OAD＝∠OBC', goal: 'AD＝BC', tri: ['OAD', 'OBC'],
    L: [{ t: '△OAD と △OBC で' }, { t: 'OA＝OB', r: '仮定', n: 1 }, { t: '∠OAD＝∠OBC', r: '仮定', n: 2 },
      { t: '∠AOD＝∠BOC', r: '共通', n: 3, hint: 'もう1組、等しい角は？（2つの三角形の頂点 O に注目）' },
      { t: '①②③より、' + ASA, c: 'ASA' }, { t: '△OAD≡△OBC' }].concat(hen('AD＝BC')),
    point: { a: '交わる線分 AD・BC をふくむ、∠O を共有する大きな三角形に目をつける' } },

  { id: 's03', lv: 2, kind: '平行線と角', ttl: '平行な2直線と中点',
    q: 'ℓ∥m で、ℓ 上の点 A と m 上の点 B を結ぶ線分の中点を M とする。M を通る直線が ℓ、m と交わる点を P、Q とするとき、PM＝QM であることを証明しよう。',
    P: s03,
    fig: { segs: ['UV', 'ST', 'AB', 'PQ'], ticks: [['AM', 1], ['BM', 1]], pars: [['UV', 1], ['ST', 1]], labels: ['A', 'B', 'M', 'P', 'Q', 'V', 'T'], name: { V: 'ℓ', T: 'm' },
      dir: { A: 'n', P: 'n', B: 's', Q: 's', M: 'e', V: 'e', T: 'e' } },
    hyp: 'ℓ∥m、AM＝BM', goal: 'PM＝QM', tri: ['APM', 'BQM'],
    L: [{ t: '△APM と △BQM で' }, { t: 'AM＝BM', r: '仮定', n: 1 },
      { t: '∠PAM＝∠QBM', r: '平行線の錯角は等しい', n: 2, hint: '平行線 ℓ、m と直線 AB がつくる、等しい角は？' },
      { t: '∠AMP＝∠BMQ', r: '対頂角は等しい', n: 3, hint: 'もう1組、等しい角は？（点 M に注目）' },
      { t: '①②③より、' + ASA, c: 'ASA' }, { t: '△APM≡△BQM' }].concat(hen('PM＝QM')),
    point: { a: '平行線では錯角、交わる2直線では対頂角。かくれた等しい角を2つ見つける' } },

  { id: 's04', lv: 2, kind: '平行線と角', ttl: '一直線上の4点と平行線',
    q: '4点 B、E、C、F がこの順に一直線上にあり、AB∥DE、AC∥DF、BE＝CF のとき、AC＝DF であることを証明しよう。',
    P: s04,
    fig: { segs: ['AB', 'AC', 'DE', 'DF', 'BF'], ticks: [['BE', 1], ['CF', 1]], pars: [['AB', 1], ['DE', 1], ['AC', 2], ['DF', 2]], dir: { B: 's', E: 's', C: 's', F: 's', A: 'n', D: 'n' } },
    hyp: 'AB∥DE、AC∥DF、BE＝CF', goal: 'AC＝DF', tri: ['ABC', 'DEF'],
    L: [{ t: '△ABC と △DEF で' }, { t: 'BE＝CF', r: '仮定', n: 1 },
      { t: 'BC＝BE＋EC、EF＝CF＋EC', q: 'BC と EF を、それぞれ たし算で表すと？', a: 'BC＝BE＋EC、EF＝CF＋EC' },
      { t: 'BC＝EF', r: '①の両方に EC をたした', n: 2, hint: 'だから、等しいといえる辺は？' },
      { t: '∠ABC＝∠DEF', r: '平行線の同位角は等しい', n: 3, hint: 'AB∥DE から、等しいといえる角は？' },
      { t: '∠ACB＝∠DFE', r: '平行線の同位角は等しい', n: 4, hint: 'AC∥DF から、等しいといえる角は？' },
      { t: '②③④より、' + ASA, c: 'ASA' }, { t: '△ABC≡△DEF' }].concat(hen('AC＝DF')),
    point: { a: '「BE＝CF」はそのままでは三角形の辺ではない。同じ長さ EC をたして BC＝EF にする' } },

  { id: 's05', lv: 2, kind: '角の和と差', ttl: '頂点を共有する三角形（角をたす）',
    q: '図で、AB＝DB、CB＝EB、∠ABD＝∠CBE のとき、AC＝DE であることを証明しよう。',
    P: s05,
    fig: { segs: ['BA', 'BD', 'BC', 'BE', 'AC', 'DE'], ticks: [['AB', 1], ['DB', 1], ['CB', 2], ['EB', 2]], angs: [['ABD', 1], ['CBE', 1]], dir: { B: 's' } },
    hyp: 'AB＝DB、CB＝EB、∠ABD＝∠CBE', goal: 'AC＝DE', tri: ['ABC', 'DBE'],
    L: [{ t: '△ABC と △DBE で' }, { t: 'AB＝DB', r: '仮定', n: 1 }, { t: 'CB＝EB', r: '仮定', n: 2 }, { t: '∠ABD＝∠CBE', r: '仮定', n: 3 },
      { t: '∠ABC＝∠ABD＋∠DBC、∠DBE＝∠CBE＋∠DBC', q: '∠ABC と ∠DBE を、それぞれ たし算で表すと？', a: '∠ABC＝∠ABD＋∠DBC、∠DBE＝∠CBE＋∠DBC' },
      { t: '∠ABC＝∠DBE', r: '③の両方に ∠DBC をたした', n: 4, hint: 'だから、等しいといえる角は？' },
      { t: '①②④より、' + SAS, c: 'SAS' }, { t: '△ABC≡△DBE' }].concat(hen('AC＝DE')),
    point: { a: '等しい角に、同じ角（∠DBC）をたしても等しい', sub: '仮定の角 ∠ABD・∠CBE は、そのままでは三角形の角ではない' } },

  { id: 's06', lv: 2, kind: '角の和と差', ttl: '一直線上の2つの三角形（角をひく）',
    q: '3点 A、B、C が一直線上にあり、AB＝DB、CB＝EB、∠ABD＝∠CBE のとき、AE＝DC であることを証明しよう。',
    P: s06,
    fig: { segs: ['AC', 'BD', 'BE', 'AD', 'CE', 'AE', 'DC'], ticks: [['AB', 1], ['DB', 1], ['CB', 2], ['EB', 2]], angs: [['ABD', 1], ['CBE', 1]], dir: { A: 'sw', B: 's', C: 'se', D: 'n', E: 'ne' } },
    hyp: 'AB＝DB、CB＝EB、∠ABD＝∠CBE', goal: 'AE＝DC', tri: ['ABE', 'DBC'],
    L: [{ t: '△ABE と △DBC で' }, { t: 'AB＝DB', r: '仮定', n: 1 }, { t: 'BE＝BC', r: '仮定', n: 2 }, { t: '∠ABD＝∠CBE', r: '仮定', n: 3 },
      { t: '∠ABE＝180°−∠CBE、∠DBC＝180°−∠ABD', q: 'A、B、C は一直線上。∠ABE と ∠DBC を、それぞれ ひき算で表すと？', a: '∠ABE＝180°−∠CBE、∠DBC＝180°−∠ABD' },
      { t: '∠ABE＝∠DBC', r: '180° から、等しい角 ③ をひいた', n: 4, hint: 'だから、等しいといえる角は？' },
      { t: '①②④より、' + SAS, c: 'SAS' }, { t: '△ABE≡△DBC' }].concat(hen('AE＝DC')),
    point: { a: '一直線の角は 180°。等しい角を 180° からひいても等しい', sub: 's05（角をたす）と同じ仮定の形。どの角を使うかが ちがう' } },

  { id: 's07', lv: 2, kind: '合同から平行', ttl: '向かい合う辺が等しい四角形',
    q: '四角形 ABCD で、AB＝CD、AD＝CB のとき、AB∥DC であることを証明しよう。',
    P: s07,
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'AC'], ticks: [['AB', 1], ['CD', 1], ['AD', 2], ['CB', 2]] },
    hyp: 'AB＝CD、AD＝CB', goal: 'AB∥DC', tri: ['ABC', 'CDA'],
    plan: { sub: '対角線 AC をひくと、AB・DC と AC で錯角 ∠BAC・∠DCA ができる' },
    L: [{ t: '△ABC と △CDA で' }, { t: 'AB＝CD', r: '仮定', n: 1 }, { t: 'BC＝DA', r: '仮定', n: 2 },
      { t: 'CA＝AC', r: '共通', n: 3, hint: 'もう1組、等しい辺は？' },
      { t: '①②③より、' + SSS, c: 'SSS' }, { t: '△ABC≡△CDA' }].concat(kaku('∠BAC＝∠DCA')).concat([
      { t: '錯角が等しいので', q: '∠BAC と ∠DCA は、AB・DC と AC がつくる何の角？', a: '錯角（錯角が等しければ、2直線は平行）' }, { t: 'AB∥DC' }]),
    point: { a: '合同 → 対応する角が等しい → 錯角が等しい → 平行', sub: '合同は「平行」を示す道具にもなる' } },

  { id: 's08', lv: 2, kind: '合同から平行', ttl: '中点で交わる線分と平行',
    q: '線分 AB と CD が点 O で交わり、O は AB の中点で、CD の中点でもある。このとき、AC∥DB であることを証明しよう。',
    P: s08,
    fig: { segs: ['AB', 'CD', 'AC', 'DB'], ticks: [['AO', 1], ['BO', 1], ['CO', 2], ['DO', 2]], dir: { O: 'se' } },
    hyp: 'AO＝BO、CO＝DO', goal: 'AC∥DB', tri: ['AOC', 'BOD'],
    L: [{ t: '△AOC と △BOD で' }, { t: 'AO＝BO', r: '仮定', n: 1 }, { t: 'CO＝DO', r: '仮定', n: 2 },
      { t: '∠AOC＝∠BOD', r: '対頂角は等しい', n: 3, hint: 'もう1組、等しい角は？' },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△AOC≡△BOD' }].concat(kaku('∠OAC＝∠OBD')).concat([
      { t: '錯角が等しいので', q: '∠OAC と ∠OBD は、AC・DB と AB がつくる何の角？', a: '錯角（錯角が等しければ、2直線は平行）' }, { t: 'AC∥DB' }]),
    point: { a: '平行を示すには、錯角か同位角が等しいことをいう。その角を合同で示す' } },

  { id: 's09', lv: 2, kind: '重なった三角形', ttl: '2辺の上の点（長さをたす）',
    q: '△ABC の辺 AB 上に点 D、辺 AC 上に点 E があり、AD＝AE、DB＝EC のとき、BE＝CD であることを証明しよう。',
    P: s09,
    fig: { segs: ['AB', 'BC', 'CA', 'BE', 'CD'], ticks: [['AD', 1], ['AE', 1], ['DB', 2], ['EC', 2]], dir: { A: 'w', D: 'n', E: 's' } },
    hyp: 'AD＝AE、DB＝EC', goal: 'BE＝CD', tri: ['ABE', 'ACD'],
    L: [{ t: '△ABE と △ACD で' }, { t: 'AE＝AD', r: '仮定', n: 1 },
      { t: 'AB＝AD＋DB、AC＝AE＋EC', q: 'AB と AC を、それぞれ たし算で表すと？', a: 'AB＝AD＋DB、AC＝AE＋EC' },
      { t: 'AB＝AC', r: 'AD＝AE と DB＝EC をたした', n: 2, hint: 'だから、等しいといえる辺は？' },
      { t: '∠BAE＝∠CAD', r: '共通', n: 3, hint: 'もう1組、等しい角は？' },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△ABE≡△ACD' }].concat(hen('BE＝CD')),
    point: { a: '重なった三角形は、色をかえてぬき出す。辺は「たし算」で等しくできる' } },

  { id: 's10', lv: 2, kind: '合同を2回', ttl: '中点で交わる線分と、O を通る直線',
    q: '線分 AB と CD が点 O で交わり、AO＝BO、CO＝DO である。O を通る直線が AC、BD と交わる点を P、Q とするとき、OP＝OQ であることを証明しよう。',
    P: s10,
    fig: { segs: ['AB', 'CD', 'AC', 'BD', 'PQ'], ticks: [['AO', 1], ['BO', 1], ['CO', 2], ['DO', 2]], dir: { O: 'n', P: 'w', Q: 'e' } },
    hyp: 'AO＝BO、CO＝DO', goal: 'OP＝OQ', tri: ['AOC', 'BOD'],
    plan: { q: '「OP＝OQ」は △AOP と △BOQ の合同からいえそう。でも等しい組が足りない。先に、どの三角形の合同を示す？', a: '△AOC と △BOD', sub: 'まず ∠OAC＝∠OBD を示し、それを △AOP と △BOQ に使う' },
    L: [{ t: '△AOC と △BOD で' }, { t: 'AO＝BO', r: '仮定', n: 1 }, { t: 'CO＝DO', r: '仮定', n: 2 },
      { t: '∠AOC＝∠BOD', r: '対頂角は等しい', n: 3, hint: 'もう1組、等しい角は？' },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△AOC≡△BOD' },
      { t: '合同な図形の対応する角は等しいので', q: '合同な図形の、どんな性質を使う？', a: '対応する角は等しい' },
      { t: '∠OAC＝∠OBD', n: 4, q: 'どの角とどの角が等しい？（あとで使う角）', a: '∠OAC＝∠OBD' },
      { t: 'つぎに、△AOP と △BOQ で', q: 'つぎに、どの三角形の合同を示す？', a: '△AOP と △BOQ' },
      { t: 'AO＝BO', r: '仮定', n: 5 },
      { t: '∠OAP＝∠OBQ', r: '④', n: 6, hint: 'つぎに、等しいといえる角は？（1回目の合同で示した角）' },
      { t: '∠AOP＝∠BOQ', r: '対頂角は等しい', n: 7, hint: 'もう1組、等しい角は？' },
      { t: '⑤⑥⑦より、' + ASA, c: 'ASA' }, { t: '△AOP≡△BOQ' }].concat(hen('OP＝OQ')),
    point: { a: '1回目の合同で角が等しいことを示し、2回目の合同の材料にする' } },

  { id: 's11', lv: 2, kind: '中点', ttl: '中線に下ろした2本の垂線',
    q: '△ABC の辺 BC の中点を M とする。B、C から直線 AM にひいた垂線を BD、CE とするとき、BD＝CE であることを証明しよう。',
    P: s11,
    fig: { segs: ['AB', 'BC', 'CA', 'AE', 'BD', 'CE'], ticks: [['BM', 1], ['CM', 1]], rights: ['BDM', 'CEM'], dir: { M: 's', D: 'e', E: 'w' } },
    hyp: 'BM＝CM、BD⊥AM、CE⊥AM', goal: 'BD＝CE', tri: ['BDM', 'CEM'],
    L: [{ t: '△BDM と △CEM で' }, { t: 'BM＝CM', r: '仮定', n: 1 },
      { t: '∠BMD＝∠CME', r: '対頂角は等しい', n: 2, hint: '点 M のまわりで、等しい角は？' },
      { t: '∠BDM＝∠CEM＝90°', r: '仮定', n: 3 },
      { t: '∠MBD＝∠MCE', r: '②③と、三角形の内角の和は 180° であること', n: 4, hint: '②③から、もう1組の角も等しいといえる。どの角？' },
      { t: '①②④より、' + ASA, c: 'ASA' }, { t: '△BDM≡△CEM' }].concat(hen('BD＝CE')),
    point: { a: '2組の角が等しければ、残りの角も等しい（内角の和は 180°）', sub: 'こうして「1組の辺とその両端の角」にそろえる' } },

  { id: 's12', lv: 2, kind: '角の二等分線', ttl: '角の二等分線と等しい角',
    q: '∠XOY の二等分線上に点 P をとる。辺 OX 上の点 A、辺 OY 上の点 B を、∠OPA＝∠OPB となるようにとるとき、PA＝PB であることを証明しよう。',
    P: s12,
    fig: { segs: ['OX', 'OY', 'OP', 'PA', 'PB'], angs: [['AOP', 1], ['BOP', 1], ['OPA', 2], ['OPB', 2]], dir: { O: 'w', A: 's', P: 'e' } },
    hyp: '∠AOP＝∠BOP、∠OPA＝∠OPB', goal: 'PA＝PB', tri: ['OAP', 'OBP'],
    L: [{ t: '△OAP と △OBP で' }, { t: '∠AOP＝∠BOP', r: '仮定', n: 1 }, { t: '∠OPA＝∠OPB', r: '仮定', n: 2 },
      { t: 'OP＝OP', r: '共通', n: 3, hint: 'もう1組、等しい辺は？' },
      { t: '①②③より、' + ASA, c: 'ASA' }, { t: '△OAP≡△OBP' }].concat(hen('PA＝PB')),
    point: { a: '辺 OP の両はしの角が等しい。共通な辺が「1組の辺」になる' } }
);
})();
