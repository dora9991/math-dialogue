/* 証明パターン集のデータ（★★★・★★★★）。1つの証明＝1つのオブジェクト。書き方は heikou/js/geo.js の GE.proof を見る。
   ★★★（t01〜t12）：中2「三角形と四角形」の性質（二等辺三角形・正三角形・直角三角形の合同・角の二等分線・平行四辺形・特別な四角形）を使う証明。
   ★★★★（h01〜h10）：発展・入試型（回転型・二段の証明・補助線・折り返し・平行四辺形になる・等積）。
   問題文・図・数値は自作（教科書・学力調査・高校入試の定番の形を参考にした）。
   図の座標は、仮定どおりになるように、下の道具で計算して決める（index.html は geo.js を読まないので、GE は使わない）。
   行に書いた「＝」「≡」「∥」「⊥」は、p.html で開くと GE.verify が座標で確かめる。面積（等積）は自動で確かめられないので、ここで計算して確かめる。 */
(function () {
'use strict';
var S = window.SHOMEI = window.SHOMEI || [];
/* ---- 点をつくる道具（数学の向き：y は上が正） ---- */
function pol(c, r, deg) { var t = deg * Math.PI / 180; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
function mid(a, b) { return lerp(a, b, .5); }
function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
/* a から b の向きへ、長さ d だけ進んだ点 */
function toward(a, b, d) { return lerp(a, b, d / dist(a, b)); }
function foot(p, a, b) { var d = [b[0] - a[0], b[1] - a[1]], t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]); return [a[0] + d[0] * t, a[1] + d[1] * t]; }
function reflect(p, a, b) { var f = foot(p, a, b); return [2 * f[0] - p[0], 2 * f[1] - p[1]]; }
function meet(a, b, c, d) { var r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0], t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den; return [a[0] + r[0] * t, a[1] + r[1] * t]; }
/* 三角形の面積（'ABC'） */
function area(P, s) { var a = P[s[0]], b = P[s[1]], c = P[s[2]]; return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2; }
function same(x, y) { return Math.abs(x - y) < 1e-9 * Math.max(1, Math.abs(x), Math.abs(y)); }
function check(ok, what) { if (!ok && window.console) console.error('答えがちがう：' + what); return ok; }

/* 行のひな形 */
var SAS = '2組の辺とその間の角が、それぞれ等しいので', ASA = '1組の辺とその両端の角が、それぞれ等しいので', SSS = '3組の辺が、それぞれ等しいので';
var HA = '直角三角形の斜辺と1つの鋭角が、それぞれ等しいので', HL = '直角三角形の斜辺と他の1辺が、それぞれ等しいので';
function cSide() { return { t: '合同な図形の対応する辺は等しいので', q: '合同な図形の、どんな性質を使う？', a: '対応する辺は等しい' }; }

/* ======================= ★★★ ======================= */

/* t01 二等辺三角形：底角を使う合同 */
S.push({ id: 't01', lv: 3, kind: '二等辺三角形', ttl: '底辺上の2点と二等辺三角形',
  q: '△ABC は AB＝AC の二等辺三角形。辺 BC 上に、BD＝CE となる点 D、E をとる。このとき、AD＝AE であることを証明しよう。',
  P: { A: [0, 4.6], B: [-4.2, 0], C: [4.2, 0], D: [-1.6, 0], E: [1.6, 0] },
  fig: { segs: ['AB', 'AC', 'BC', 'AD', 'AE'], ticks: [['AB', 1], ['AC', 1], ['BD', 2], ['CE', 2]], dir: { D: 's', E: 's', A: 'n' } },
  hyp: 'AB＝AC、BD＝CE', goal: 'AD＝AE', tri: ['ABD', 'ACE'],
  L: [{ t: '△ABD と △ACE で' }, { t: 'AB＝AC', r: '仮定', n: 1 }, { t: 'BD＝CE', r: '仮定', n: 2 },
    { t: '∠ABD＝∠ACE', r: '二等辺三角形の底角は等しい', n: 3, hint: '図に印のない、等しい角は？（△ABC は二等辺三角形）' },
    { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△ABD≡△ACE' }, cSide(), { t: 'AD＝AE' }],
  point: { a: '二等辺三角形の「底角は等しい」は、図に印がなくても使える' } });

/* t02 2つの角が等しい → 二等辺三角形（底角の二等分線） */
(function () {
  var B = [-3.4, 0], C = [3.4, 0], A = [0, 6.3], hb = Math.atan2(A[1], A[0] - B[0]) / 2;
  S.push({ id: 't02', lv: 3, kind: '二等辺三角形になる', ttl: '底角の二等分線でできる三角形',
    q: '△ABC は AB＝AC の二等辺三角形。∠ABC と ∠ACB の二等分線の交点を P とする。このとき、△PBC は二等辺三角形であることを証明しよう。',
    P: { A: A, B: B, C: C, P: [0, C[0] * Math.tan(hb)] },
    fig: { segs: ['AB', 'AC', 'BC', 'PB', 'PC'], ticks: [['AB', 1], ['AC', 1]], angs: [['ABP', 1], ['PBC', 1], ['ACP', 2], ['PCB', 2]], dir: { P: 'n', A: 'n' } },
    hyp: 'AB＝AC、∠ABP＝∠PBC、∠ACP＝∠PCB', goal: '△PBC は二等辺三角形（PB＝PC）',
    plan: { q: '△PBC が二等辺三角形といえるには、何がいえればよい？', a: '∠PBC＝∠PCB（2つの角が等しい）', sub: 'この証明は、三角形の合同を使わずに、角だけで示せる' },
    L: [{ t: '∠ABC＝∠ACB', r: '二等辺三角形の底角は等しい', n: 1, hint: 'まず、△ABC で等しい角は？　根拠も。' },
      { t: '∠PBC は ∠ABC の半分', r: 'BP は ∠ABC の二等分線', n: 2, ask: 'r' },
      { t: '∠PCB は ∠ACB の半分', r: 'CP は ∠ACB の二等分線', n: 3, ask: 'r' },
      { t: '①②③より、∠PBC＝∠PCB', q: '①②③から、△PBC のどの角とどの角が等しい？', a: '∠PBC＝∠PCB', sub: '等しい角の半分どうしは、等しい' },
      { t: '2つの角が等しいので、△PBC は二等辺三角形（PB＝PC）', q: 'だから、△PBC はどんな三角形？', a: '2つの角が等しいので、二等辺三角形', sub: 'PB＝PC' }],
    point: { a: '「2つの角が等しい三角形は、二等辺三角形」：角から辺へ' } });
})();

/* t03 2つの角が等しい → 二等辺三角形（角の二等分線と平行線） */
(function () {
  var B = [0, 0], A = pol(B, 4, 66), D = [A[1] / Math.tan(33 * Math.PI / 180), A[1]];
  S.push({ id: 't03', lv: 3, kind: '二等辺三角形になる', ttl: '角の二等分線と平行線',
    q: '△ABC で、∠ABC の二等分線と、点 A を通り辺 BC に平行な直線との交点を D とする。このとき、△ABD は二等辺三角形であることを証明しよう。',
    P: { A: A, B: B, C: [7.4, 0], D: D },
    fig: { segs: ['AB', 'BC', 'CA', 'BD', 'AD'], pars: [['AD', 1], ['BC', 1]], angs: [['ABD', 1], ['DBC', 1]], dir: { A: 'nw', D: 'ne' } },
    hyp: '∠ABD＝∠DBC、AD∥BC', goal: '△ABD は二等辺三角形（AB＝AD）',
    plan: { q: '△ABD が二等辺三角形といえるには、どの角とどの角が等しいといえればよい？', a: '∠ABD＝∠ADB', sub: '2つの角が等しい三角形は、二等辺三角形' },
    L: [{ t: '∠ABD＝∠DBC', r: 'BD は ∠ABC の二等分線', n: 1 },
      { t: '∠ADB＝∠DBC', r: 'AD∥BC で、錯角は等しい', n: 2, hint: '平行な線がある。∠DBC と等しい角は？　根拠も。' },
      { t: '①②より、∠ABD＝∠ADB', q: '①②から、△ABD のどの角とどの角が等しい？', a: '∠ABD＝∠ADB' },
      { t: '2つの角が等しいので、△ABD は二等辺三角形（AB＝AD）', q: 'だから、△ABD はどんな三角形？', a: '2つの角が等しいので、二等辺三角形', sub: 'AB＝AD' }],
    point: { a: '角の二等分線と平行線の錯角で、等しい角が2つ → 二等辺三角形' } });
})();

/* t04 正三角形：辺と角 */
(function () {
  var A = [0, 3 * Math.sqrt(3)], B = [-3, 0], C = [3, 0];
  S.push({ id: 't04', lv: 3, kind: '正三角形', ttl: '正三角形の中の合同',
    q: '△ABC は正三角形。辺 AB 上に点 D、辺 BC 上に点 E を、AD＝BE となるようにとる。このとき、AE＝CD であることを証明しよう。',
    P: { A: A, B: B, C: C, D: toward(A, B, 2.2), E: toward(B, C, 2.2) },
    fig: { segs: ['AB', 'BC', 'CA', 'AE', 'CD'], ticks: [['AD', 1], ['BE', 1]], dir: { D: 'w', E: 's', A: 'n' } },
    hyp: '△ABC は正三角形、AD＝BE', goal: 'AE＝CD', tri: ['ABE', 'CAD'],
    L: [{ t: '△ABE と △CAD で' }, { t: 'AB＝CA', r: '正三角形の辺', n: 1, hint: '正三角形だから、等しい辺は？' }, { t: 'BE＝AD', r: '仮定', n: 2 },
      { t: '∠ABE＝∠CAD＝60°', r: '正三角形の角', n: 3, hint: '正三角形の角について、いえることは？' },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△ABE≡△CAD' }, cSide(), { t: 'AE＝CD' }],
    point: { a: '正三角形は「3つの辺が等しい」「3つの角がどれも60°」の両方が使える' } });
})();

/* t05 直角三角形の合同（斜辺と1鋭角） */
(function () {
  var A = [0, 5.6], B = [-3.1, 0], C = [3.1, 0];
  S.push({ id: 't05', lv: 3, kind: '直角三角形の合同', ttl: '二等辺三角形の2本の垂線',
    q: '△ABC は AB＝AC の二等辺三角形。頂点 B、C から、辺 AC、AB に垂線 BD、CE をひく。このとき、BD＝CE であることを証明しよう。',
    P: { A: A, B: B, C: C, D: foot(B, A, C), E: foot(C, A, B) },
    fig: { segs: ['AB', 'AC', 'BC', 'BD', 'CE'], ticks: [['AB', 1], ['AC', 1]], rights: ['BDC', 'CEB'], dir: { D: 'e', E: 'w', A: 'n' } },
    hyp: 'AB＝AC、BD⊥AC、CE⊥AB', goal: 'BD＝CE', tri: ['DBC', 'ECB'],
    L: [{ t: '△DBC と △ECB で' }, { t: '∠BDC＝∠CEB＝90°', r: '仮定', n: 1 }, { t: 'BC＝CB', r: '共通', n: 2 },
      { t: '∠DCB＝∠EBC', r: '二等辺三角形の底角は等しい', n: 3 },
      { t: '①②③より、' + HA, c: 'HA' }, { t: '△DBC≡△ECB' }, cSide(), { t: 'BD＝CE' }],
    point: { a: '直角三角形は「斜辺と1つの鋭角」で合同がいえる。斜辺がどこかを先に見る' } });
})();

/* t06 直角三角形の合同（斜辺と他の1辺）→ 二等辺三角形 */
(function () {
  var A = [0, 5], B = [-3.8, 0], C = [3.8, 0], M = [0, 0];
  S.push({ id: 't06', lv: 3, kind: '直角三角形の合同', ttl: '中点からの垂線が等しい三角形',
    q: '△ABC の辺 BC の中点を M とし、M から辺 AB、AC に垂線 MD、ME をひく。MD＝ME のとき、△ABC は二等辺三角形であることを証明しよう。',
    P: { A: A, B: B, C: C, M: M, D: foot(M, A, B), E: foot(M, A, C) },
    fig: { segs: ['AB', 'AC', 'BC', 'MD', 'ME'], rights: ['BDM', 'CEM'], ticks: [['BM', 1], ['CM', 1], ['DM', 2], ['EM', 2]], dir: { M: 's', D: 'nw', E: 'ne', A: 'n' } },
    hyp: 'BM＝CM、MD⊥AB、ME⊥AC、MD＝ME', goal: '△ABC は二等辺三角形（AB＝AC）', tri: ['DBM', 'ECM'],
    plan: { q: '△ABC が二等辺三角形といえるには、∠ABC＝∠ACB がいえればよい。そのために、どの三角形の合同を示す？', a: '△DBM と △ECM' },
    L: [{ t: '△DBM と △ECM で' }, { t: '∠BDM＝∠CEM＝90°', r: '仮定', n: 1 }, { t: 'BM＝CM', r: 'M は BC の中点', n: 2 }, { t: 'DM＝EM', r: '仮定', n: 3 },
      { t: '①②③より、' + HL, c: 'HL' }, { t: '△DBM≡△ECM' },
      { t: '合同な図形の対応する角は等しいので、∠DBM＝∠ECM', q: '合同から、どの角とどの角が等しいといえる？', a: '∠DBM＝∠ECM（対応する角は等しい）' },
      { t: '2つの角が等しいので、△ABC は二等辺三角形（AB＝AC）', q: '∠ABC＝∠ACB だから、△ABC はどんな三角形？', a: '2つの角が等しいので、二等辺三角形', sub: 'AB＝AC' }],
    point: { a: '直角三角形の合同 → 角が等しい → 二等辺三角形、の2段で進む' } });
})();

/* t07 角の二等分線上の点と、2辺までの距離 */
(function () {
  var O = [0, 0], P = pol(O, 5.4, 31);
  S.push({ id: 't07', lv: 3, kind: '角の二等分線', ttl: '角の二等分線上の点',
    q: '∠XOY の二等分線上の点 P から、辺 OX、OY に垂線 PA、PB をひく。このとき、PA＝PB であることを証明しよう。',
    P: { O: O, X: [8.4, 0], Y: pol(O, 8.4, 62), P: P, A: foot(P, O, [1, 0]), B: foot(P, O, pol(O, 1, 62)) },
    fig: { segs: ['OX', 'OY', 'OP', 'PA', 'PB'], rights: ['OAP', 'OBP'], angs: [['AOP', 1], ['POB', 1]], dir: { O: 'w', A: 's', B: 'nw', P: 'e', X: 'e', Y: 'n' } },
    hyp: '∠AOP＝∠BOP、PA⊥OX、PB⊥OY', goal: 'PA＝PB', tri: ['OAP', 'OBP'],
    L: [{ t: '△OAP と △OBP で' }, { t: '∠OAP＝∠OBP＝90°', r: '仮定', n: 1 }, { t: 'OP＝OP', r: '共通', n: 2 }, { t: '∠AOP＝∠BOP', r: '仮定', n: 3 },
      { t: '①②③より、' + HA, c: 'HA' }, { t: '△OAP≡△OBP' }, cSide(), { t: 'PA＝PB' }],
    point: { a: '角の二等分線上の点は、角の2辺から等しい距離にある（斜辺 OP が共通）' } });
})();

/* t08 平行四辺形の性質（対辺・錯角）を使う合同 */
(function () {
  var B = [0, 0], C = [6.4, 0], A = [1.6, 3.6], D = add(A, C);
  S.push({ id: 't08', lv: 3, kind: '平行四辺形の性質', ttl: '平行四辺形の対角線上の2点',
    q: '平行四辺形 ABCD の対角線 BD 上に、BE＝DF となる点 E、F をとる。このとき、AE＝CF であることを証明しよう。',
    P: { A: A, B: B, C: C, D: D, E: lerp(B, D, .27), F: lerp(B, D, .73) },
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'BD', 'AE', 'CF'], ticks: [['BE', 1], ['DF', 1]], dir: { E: 'se', F: 'nw' } },
    hyp: '四角形 ABCD は平行四辺形、BE＝DF', goal: 'AE＝CF', tri: ['ABE', 'CDF'],
    L: [{ t: '△ABE と △CDF で' }, { t: 'AB＝CD', r: '平行四辺形の対辺は等しい', n: 1, hint: '平行四辺形の性質から、等しい辺は？' }, { t: 'BE＝DF', r: '仮定', n: 2 },
      { t: '∠ABE＝∠CDF', r: 'AB∥DC で、錯角は等しい', n: 3, hint: '平行四辺形の向かい合う辺は平行。等しい角は？' },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△ABE≡△CDF' }, cSide(), { t: 'AE＝CF' }],
    point: { a: '平行四辺形の「対辺は等しい」と「平行線の錯角」をいっしょに使う' } });
})();

/* t09 平行四辺形の性質（対角線）を使う合同 */
(function () {
  var B = [0, 0], C = [7, 0], A = [1.8, 4], D = add(A, C), O = mid(A, C), E = [3.1, 4];
  S.push({ id: 't09', lv: 3, kind: '平行四辺形の性質', ttl: '対角線の交点を通る直線',
    q: '平行四辺形 ABCD の対角線の交点を O とする。O を通る直線が、辺 AD、BC と交わる点を、それぞれ E、F とする。このとき、OE＝OF であることを証明しよう。',
    P: { A: A, B: B, C: C, D: D, O: O, E: E, F: meet(E, O, B, C) },
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'AC', 'BD', 'EF'], dir: { O: 'n', E: 'n', F: 's' } },
    hyp: '四角形 ABCD は平行四辺形、O は対角線の交点', goal: 'OE＝OF', tri: ['OAE', 'OCF'],
    L: [{ t: '△OAE と △OCF で' }, { t: 'OA＝OC', r: '平行四辺形の対角線は、それぞれの中点で交わる', n: 1, hint: '平行四辺形の対角線の性質から、等しい辺は？' },
      { t: '∠AOE＝∠COF', r: '対頂角は等しい', n: 2 }, { t: '∠OAE＝∠OCF', r: 'AD∥BC で、錯角は等しい', n: 3 },
      { t: '①②③より、' + ASA, c: 'ASA' }, { t: '△OAE≡△OCF' }, cSide(), { t: 'OE＝OF' }],
    point: { a: '平行四辺形の対角線は「それぞれの中点で交わる」：OA＝OC、OB＝OD' } });
})();

/* t10 平行四辺形になる（対角線がそれぞれの中点で交わる） */
(function () {
  var B = [0, 0], C = [6.6, 0], A = [-1.3, 3.9], D = add(A, C);
  S.push({ id: 't10', lv: 3, kind: '平行四辺形になる', ttl: '対角線を使って平行四辺形を示す',
    q: '平行四辺形 ABCD の対角線 BD 上に、BE＝DF となる点 E、F をとる。このとき、四角形 AECF は平行四辺形であることを証明しよう。',
    P: { A: A, B: B, C: C, D: D, E: lerp(B, D, .2), F: lerp(B, D, .8), O: mid(B, D) },
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'BD', 'AC', 'AE', 'EC', 'CF', 'FA'], ticks: [['BE', 1], ['DF', 1]], dir: { O: 's', E: 'n', F: 's' } },
    hyp: '四角形 ABCD は平行四辺形、BE＝DF', goal: '四角形 AECF は平行四辺形',
    plan: { q: '四角形 AECF の対角線は AC と EF。平行四辺形になる条件のうち、どれが使えそう？', a: '対角線が、それぞれの中点で交わる', sub: 'OA＝OC と OE＝OF がいえればよい' },
    L: [{ t: '対角線 AC と BD の交点を O とする' },
      { t: 'OA＝OC', r: '平行四辺形の対角線は、それぞれの中点で交わる', n: 1, hint: '平行四辺形 ABCD の対角線の性質から、等しい線分は？' },
      { t: 'OB＝OD', r: '平行四辺形の対角線は、それぞれの中点で交わる', n: 2, hint: 'もう1組、等しい線分は？' },
      { t: 'BE＝DF', r: '仮定', n: 3 },
      { t: 'OE＝OB−BE＝OD−DF＝OF', n: 4, q: '②③から、OE と OF の長さの関係は？', a: 'OE＝OB−BE＝OD−DF＝OF' },
      { t: '①④より、対角線が、それぞれの中点で交わるので、四角形 AECF は平行四辺形', q: '①④から、四角形 AECF は？　根拠の条件も。', a: '対角線が、それぞれの中点で交わるので、平行四辺形' }],
    point: { a: '平行四辺形になる条件は5つ。図に合うもの（ここでは対角線）を選ぶ' } });
})();

/* t11 平行四辺形になる（1組の対辺が平行で、その長さが等しい） */
(function () {
  var B = [0, 0], C = [7.2, 0], A = [2, 3.6], D = add(A, C);
  S.push({ id: 't11', lv: 3, kind: '平行四辺形になる', ttl: '1組の対辺で平行四辺形を示す',
    q: '平行四辺形 ABCD の辺 AD、BC 上に、AE＝CF となる点 E、F をとる。このとき、四角形 EBFD は平行四辺形であることを証明しよう。',
    P: { A: A, B: B, C: C, D: D, E: toward(A, D, 2.1), F: toward(C, B, 2.1) },
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'EB', 'FD'], ticks: [['AE', 1], ['CF', 1]], dir: { E: 'n', F: 's' } },
    hyp: '四角形 ABCD は平行四辺形、AE＝CF', goal: '四角形 EBFD は平行四辺形',
    plan: { q: '四角形 EBFD の辺 ED と BF に目をつけよう。平行四辺形になる条件のうち、どれが使えそう？', a: '1組の対辺が平行で、その長さが等しい', sub: 'ED∥BF と ED＝BF がいえればよい' },
    L: [{ t: 'ED∥BF', r: 'AD∥BC', n: 1, hint: 'ED と BF の位置の関係は？　根拠も。' },
      { t: 'AD＝BC', r: '平行四辺形の対辺は等しい', n: 2, hint: '平行四辺形 ABCD の性質から、等しい辺は？' }, { t: 'AE＝CF', r: '仮定', n: 3 },
      { t: 'ED＝AD−AE＝BC−CF＝BF', n: 4, q: '②③から、ED と BF の長さの関係は？', a: 'ED＝AD−AE＝BC−CF＝BF' },
      { t: '①④より、1組の対辺が平行で、その長さが等しいので、四角形 EBFD は平行四辺形', q: '①④から、四角形 EBFD は？　根拠の条件も。', a: '1組の対辺が平行で、その長さが等しいので、平行四辺形' }],
    point: { a: '「1組の対辺が平行で、その長さが等しい」は、合同を使わずに示せることが多い' } });
})();

/* t12 特別な四角形（ひし形） */
(function () {
  var B = [0, 0], C = [5.2, 0], A = pol(B, 5.2, 62), D = add(A, C);
  S.push({ id: 't12', lv: 3, kind: '特別な四角形', ttl: 'ひし形の中の合同',
    q: 'ひし形 ABCD の辺 AB、AD 上に、BE＝DF となる点 E、F をとる。このとき、CE＝CF であることを証明しよう。',
    P: { A: A, B: B, C: C, D: D, E: toward(B, A, 1.9), F: toward(D, A, 1.9) },
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'CE', 'CF'], ticks: [['BE', 1], ['DF', 1]], dir: { E: 'w', F: 'n' } },
    hyp: '四角形 ABCD はひし形、BE＝DF', goal: 'CE＝CF', tri: ['CBE', 'CDF'],
    L: [{ t: '△CBE と △CDF で' }, { t: 'CB＝CD', r: 'ひし形の4つの辺は等しい', n: 1, hint: 'ひし形の性質から、等しい辺は？' }, { t: 'BE＝DF', r: '仮定', n: 2 },
      { t: '∠CBE＝∠CDF', r: 'ひし形（平行四辺形）の対角は等しい', n: 3, hint: 'ひし形は平行四辺形の仲間。等しい角は？' },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△CBE≡△CDF' }, cSide(), { t: 'CE＝CF' }],
    point: { a: 'ひし形は「4つの辺が等しい」に加えて、平行四辺形の性質（対角が等しい）も使える' } });
})();

/* ======================= ★★★★ ======================= */

/* h01 回転型（正三角形を2つならべる）：60°＋∠x */
(function () {
  var C = [0, 0];
  S.push({ id: 'h01', lv: 4, kind: '回転型', ttl: '2つの正三角形（回転型）',
    q: '△ABC と △DCE は、どちらも正三角形。このとき、AD＝BE であることを証明しよう。',
    P: { A: pol(C, 5, 120), B: pol(C, 5, 180), C: C, D: pol(C, 3.6, 20), E: pol(C, 3.6, 80) },
    alias: { x: 'ACE' },
    fig: { segs: ['AB', 'BC', 'CA', 'CD', 'DE', 'EC', 'AD', 'BE'], angs: [['ACE', 1, 'x']], dir: { C: 's', A: 'n', E: 'n', D: 'e', B: 'w' } },
    hyp: '△ABC、△DCE は正三角形', goal: 'AD＝BE', tri: ['ACD', 'BCE'],
    L: [{ t: '△ACD と △BCE で' }, { t: 'AC＝BC', r: '正三角形 ABC の辺', n: 1 }, { t: 'CD＝CE', r: '正三角形 DCE の辺', n: 2 },
      { t: '∠ACD＝∠ACE＋∠ECD＝∠x＋60°', q: '∠ACE＝∠x とする。∠ACD を ∠x で表すと？', a: '∠ACD＝∠ACE＋∠ECD＝∠x＋60°' },
      { t: '∠BCE＝∠BCA＋∠ACE＝60°＋∠x', q: '∠BCE も、∠x で表すと？', a: '∠BCE＝∠BCA＋∠ACE＝60°＋∠x' },
      { t: '∠ACD＝∠BCE', r: 'どちらも 60°＋∠x', n: 3, ask: 'r' },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△ACD≡△BCE' }, cSide(), { t: 'AD＝BE' }],
    point: { a: '回転した形：等しい角は、同じ ∠x に 60° をたして作る' } });
})();

/* h02 回転型（正方形を2つならべる）：90°＋∠x */
(function () {
  var C = [0, 0], E = pol(C, 3.1, 55), G = pol(C, 3.1, -35);
  S.push({ id: 'h02', lv: 4, kind: '回転型', ttl: '2つの正方形（回転型）',
    q: '四角形 ABCD と四角形 CEFG は、どちらも正方形。このとき、BE＝DG であることを証明しよう。',
    P: { A: [-4.2, 4.2], B: [-4.2, 0], C: C, D: [0, 4.2], E: E, F: add(E, G), G: G },
    alias: { x: 'DCE' },
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'CE', 'EF', 'FG', 'GC', 'BE', 'DG'], angs: [['DCE', 1, 'x']], dir: { C: 'sw', D: 'n', E: 'n', G: 's', F: 'e' } },
    hyp: '四角形 ABCD、CEFG は正方形', goal: 'BE＝DG', tri: ['BCE', 'DCG'],
    L: [{ t: '△BCE と △DCG で' }, { t: 'BC＝DC', r: '正方形 ABCD の辺', n: 1 }, { t: 'CE＝CG', r: '正方形 CEFG の辺', n: 2 },
      { t: '∠BCE＝∠BCD＋∠DCE＝90°＋∠x', q: '∠DCE＝∠x とする。∠BCE を ∠x で表すと？', a: '∠BCE＝∠BCD＋∠DCE＝90°＋∠x' },
      { t: '∠DCG＝∠DCE＋∠ECG＝∠x＋90°', q: '∠DCG も、∠x で表すと？', a: '∠DCG＝∠DCE＋∠ECG＝∠x＋90°' },
      { t: '∠BCE＝∠DCG', r: 'どちらも 90°＋∠x', n: 3, ask: 'r' },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△BCE≡△DCG' }, cSide(), { t: 'BE＝DG' }],
    point: { a: '正方形でも、正三角形と同じ「回転した形」。共通の ∠x に 90° をたす' } });
})();

/* h03 二段（合同 → 外角）：正三角形の中の 60° */
(function () {
  var A = [0, 3 * Math.sqrt(3)], B = [3, 0], C = [-3, 0], D = toward(A, B, 2.3), E = toward(B, C, 2.3);
  S.push({ id: 'h03', lv: 4, kind: '二段（合同→角）', ttl: '正三角形の中の 60°',
    q: '△ABC は正三角形。辺 AB 上に点 D、辺 BC 上に点 E を、AD＝BE となるようにとり、AE と CD の交点を P とする。このとき、∠CPE＝60° であることを証明しよう。',
    P: { A: A, B: B, C: C, D: D, E: E, P: meet(A, E, C, D) },
    fig: { segs: ['AB', 'BC', 'CA', 'AE', 'CD'], ticks: [['AD', 1], ['BE', 1]], dir: { A: 'n', D: 'e', E: 's', P: 'w' } },
    hyp: '△ABC は正三角形、AD＝BE', goal: '∠CPE＝60°', tri: ['ABE', 'CAD'],
    plan: { q: '∠CPE は △APC の外角。まず、角の材料を手に入れるために、どの三角形の合同を示す？', a: '△ABE と △CAD' },
    L: [{ t: '△ABE と △CAD で' }, { t: 'AB＝CA', r: '正三角形の辺', n: 1 }, { t: 'BE＝AD', r: '仮定', n: 2 }, { t: '∠ABE＝∠CAD＝60°', r: '正三角形の角', n: 3 },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△ABE≡△CAD' },
      { t: '合同な図形の対応する角は等しいので、∠BAE＝∠ACD', n: 4, q: '合同から、どの角とどの角が等しいといえる？（∠CPE に関係しそうな角）', a: '∠BAE＝∠ACD（対応する角は等しい）' },
      { t: '∠CPE＝∠PAC＋∠PCA', r: '三角形の外角は、そのとなりにない2つの内角の和に等しい', n: 5, hint: '△APC で、∠CPE は外角。どんな式になる？' },
      { t: '∠CPE＝∠PAC＋∠BAE＝∠BAC＝60°', q: '⑤の ∠PCA を、④で ∠BAE におきかえると？', a: '∠CPE＝∠PAC＋∠BAE＝∠BAC＝60°', sub: '∠PAC と ∠BAE をあわせると、正三角形の角 ∠BAC' }],
    point: { a: '合同で「等しい角」を見つけ、外角の性質で角をまとめる（2段の証明）' } });
})();

/* h04 二段の合同（たこ形） */
S.push({ id: 'h04', lv: 4, kind: '二段の合同', ttl: 'たこ形の対角線上の点',
  q: '四角形 ABCD で、AB＝AD、CB＝CD である。対角線 AC 上に点 P をとるとき、PB＝PD であることを証明しよう。',
  P: { A: [-4.6, 0], B: [0, -2.9], C: [3.4, 0], D: [0, 2.9], P: [1.5, 0] },
  fig: { segs: ['AB', 'BC', 'CD', 'DA', 'AC', 'PB', 'PD'], ticks: [['AB', 1], ['AD', 1], ['CB', 2], ['CD', 2]], dir: { P: 'ne', A: 'w', C: 'e', B: 's', D: 'n' } },
  hyp: 'AB＝AD、CB＝CD', goal: 'PB＝PD', tri: ['ABC', 'ADC'],
  plan: { q: 'PB＝PD は、△ABP と △ADP の合同で示したい。でも、まだ材料が足りない。まず、どの三角形の合同を示す？', a: '△ABC と △ADC', sub: 'ここで「等しい角」を手に入れて、2回目の合同に使う' },
  L: [{ t: '△ABC と △ADC で' }, { t: 'AB＝AD', r: '仮定', n: 1 }, { t: 'CB＝CD', r: '仮定', n: 2 }, { t: 'AC＝AC', r: '共通', n: 3 },
    { t: '①②③より、' + SSS, c: 'SSS' }, { t: '△ABC≡△ADC' },
    { t: '合同な図形の対応する角は等しいので、∠BAC＝∠DAC', n: 4, q: '合同から、2回目の合同に使えそうな、等しい角は？', a: '∠BAC＝∠DAC（対応する角は等しい）' },
    { t: 'つぎに、△ABP と △ADP で', q: 'PB＝PD を示すために、つぎは、どの三角形の合同を示す？', a: '△ABP と △ADP' },
    { t: 'AB＝AD', r: '仮定', n: 5 }, { t: 'AP＝AP', r: '共通', n: 6 }, { t: '∠BAP＝∠DAP', r: '④', n: 7, hint: '④を使うと、等しい角は？' },
    { t: '⑤⑥⑦より、' + SAS, c: 'SAS' }, { t: '△ABP≡△ADP' }, cSide(), { t: 'PB＝PD' }],
  point: { a: '1回目の合同で角を手に入れ、2回目の合同に使う（二段の証明）' } });

/* h05 補助線（対角線をひく）：平行四辺形の対辺が等しいことを示す */
(function () {
  var B = [0, 0], C = [6.6, 0], A = [-1.1, 3.8], D = add(A, C);
  S.push({ id: 'h05', lv: 4, kind: '補助線', ttl: '補助線で平行四辺形の性質を示す',
    q: '四角形 ABCD で、AB∥DC、AD∥BC である。このとき、AB＝DC、AD＝BC であることを、補助線（対角線 AC）をひいて証明しよう。',
    P: { A: A, B: B, C: C, D: D },
    fig: { segs: ['AB', 'BC', 'CD', 'DA'], dash: ['AC'], pars: [['AB', 1], ['DC', 1], ['AD', 2], ['BC', 2]] },
    hyp: 'AB∥DC、AD∥BC', goal: 'AB＝DC、AD＝BC', tri: ['ABC', 'CDA'],
    plan: { q: '補助線 AC をひくと、三角形が2つできる。どの三角形とどの三角形の合同を示す？', a: '△ABC と △CDA', sub: '平行線があるので、錯角が2組できる' },
    L: [{ t: '△ABC と △CDA で' }, { t: '∠BAC＝∠DCA', r: 'AB∥DC で、錯角は等しい', n: 1 }, { t: '∠BCA＝∠DAC', r: 'AD∥BC で、錯角は等しい', n: 2 },
      { t: 'AC＝CA', r: '共通', n: 3 },
      { t: '①②③より、' + ASA, c: 'ASA' }, { t: '△ABC≡△CDA' }, cSide(), { t: 'AB＝DC、AD＝BC' }],
    point: { a: '平行線があるときは、対角線を補助線にすると、錯角が2組と共通の辺ができる' } });
})();

/* h06 折り返し（長方形を対角線で折る）：二等辺三角形 → 直角三角形の合同 */
(function () {
  var A = [0, 3.4], B = [0, 0], C = [8, 0], D = [8, 3.4], E = reflect(C, B, D);
  S.push({ id: 'h06', lv: 4, kind: '折り返し', ttl: '長方形の折り返し',
    q: '長方形 ABCD を、対角線 BD を折り目として折り返し、点 C が移った点を E とする。BE と AD の交点を F とするとき、AF＝EF であることを証明しよう。',
    P: { A: A, B: B, C: C, D: D, E: E, F: meet(B, E, A, D) },
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'BD', 'BE', 'ED'], rights: ['DAB', 'BCD'], dir: { F: 'nw', E: 'n', A: 'w', D: 'e' } },
    hyp: '四角形 ABCD は長方形、△EBD は △CBD を BD で折り返したもの', goal: 'AF＝EF', tri: ['ABF', 'EDF'],
    plan: { q: 'AF＝EF を示すには、どの三角形とどの三角形の合同を示す？', a: '△ABF と △EDF', sub: 'その材料を、まず △FBD から手に入れる' },
    L: [{ t: 'まず、△FBD について考える', q: '△FBD に目をつけよう。この三角形は、どんな三角形になりそう？', a: '二等辺三角形（FB＝FD）になりそう' },
      { t: '∠FBD＝∠CBD', r: '折り返した角は等しい', n: 1, hint: '折り返すと、重なる角は等しい。∠FBD と等しい角は？' },
      { t: '∠FDB＝∠CBD', r: 'AD∥BC で、錯角は等しい', n: 2 },
      { t: '①②より、∠FBD＝∠FDB だから、FB＝FD', n: 3, q: '①②から、△FBD について何がいえる？', a: '∠FBD＝∠FDB で、2つの角が等しいので、FB＝FD' },
      { t: 'つぎに、△ABF と △EDF で' },
      { t: '∠BAF＝∠DEF＝90°', r: '長方形の角と、それを折り返した角', n: 4 }, { t: 'FB＝FD', r: '③', n: 5 },
      { t: 'AB＝ED', r: 'どちらも CD に等しい（長方形の対辺・折り返し）', n: 6, hint: 'もう1組、等しい辺は？（折り返す前は、どこの辺？）' },
      { t: '④⑤⑥より、' + HL, c: 'HL' }, { t: '△ABF≡△EDF' }, cSide(), { t: 'AF＝EF' }],
    point: { a: '折り返し → 重なる角・辺は等しい。長方形の平行線の錯角と組み合わせる' } });
})();

/* h07 平行四辺形になる（直角三角形の合同 → 1組の対辺が平行で等しい） */
(function () {
  var B = [0, 0], C = [7, 0], A = [2, 3.8], D = add(A, C);
  S.push({ id: 'h07', lv: 4, kind: '平行四辺形になる', ttl: '垂線でつくる平行四辺形',
    q: '平行四辺形 ABCD の頂点 A、C から、対角線 BD に垂線 AE、CF をひく。このとき、四角形 AECF は平行四辺形であることを証明しよう。',
    P: { A: A, B: B, C: C, D: D, E: foot(A, B, D), F: foot(C, B, D) },
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'BD', 'AE', 'CF', 'AF', 'EC'], rights: ['BEA', 'DFC'], dir: { E: 'se', F: 'nw' } },
    hyp: '四角形 ABCD は平行四辺形、AE⊥BD、CF⊥BD', goal: '四角形 AECF は平行四辺形', tri: ['ABE', 'CDF'],
    plan: { q: '四角形 AECF の辺 AE と CF に目をつけよう。AE∥CF はすぐいえる。あと何がいえれば、平行四辺形？', a: 'AE＝CF（1組の対辺が平行で、その長さが等しい）', sub: 'AE＝CF は、△ABE と △CDF の合同で示す' },
    L: [{ t: 'AE∥CF', r: 'どちらも BD に垂直', n: 1, ask: 'r' },
      { t: '△ABE と △CDF で', q: 'AE＝CF を示すために、どの三角形の合同を示す？', a: '△ABE と △CDF' },
      { t: '∠AEB＝∠CFD＝90°', r: '仮定', n: 2 }, { t: 'AB＝CD', r: '平行四辺形の対辺は等しい', n: 3 },
      { t: '∠ABE＝∠CDF', r: 'AB∥DC で、錯角は等しい', n: 4 },
      { t: '②③④より、' + HA, c: 'HA' }, { t: '△ABE≡△CDF' },
      { t: '合同な図形の対応する辺は等しいので、AE＝CF', n: 5, q: '合同から、何がいえる？', a: 'AE＝CF（対応する辺は等しい）' },
      { t: '①⑤より、1組の対辺が平行で、その長さが等しいので、四角形 AECF は平行四辺形', q: '①⑤から、四角形 AECF は？　根拠の条件も。', a: '1組の対辺が平行で、その長さが等しいので、平行四辺形' }],
    point: { a: '合同で長さを示し、平行四辺形になる条件へつなぐ（2段の証明）' } });
})();

/* h08 等積（台形）：共通な部分をひく */
(function () {
  var A = [1.7, 3.4], D = [5.1, 3.4], B = [0, 0], C = [7.6, 0];
  var P = { A: A, B: B, C: C, D: D, O: meet(A, C, B, D), H: [A[0], 0], K: [D[0], 0] };
  check(same(area(P, 'ABC'), area(P, 'DBC')), 'h08：△ABC＝△DBC');
  check(same(area(P, 'ABO'), area(P, 'ABC') - area(P, 'OBC')) && same(area(P, 'DCO'), area(P, 'DBC') - area(P, 'OBC')), 'h08：△ABO＝△ABC−△OBC、△DCO＝△DBC−△OBC');
  check(same(area(P, 'ABO'), area(P, 'DCO')), 'h08：△ABO＝△DCO');
  S.push({ id: 'h08', lv: 4, kind: '等積', ttl: '台形の中の等しい面積',
    q: 'AD∥BC の台形 ABCD で、対角線 AC と BD の交点を O とする。このとき、△ABO と △DCO の面積が等しいことを証明しよう。',
    P: P,
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'AC', 'BD'], dash: ['AH', 'DK'], rights: ['AHC', 'DKC'], pars: [['AD', 1], ['BC', 1]], labels: ['A', 'B', 'C', 'D', 'O'], dir: { O: 'n' } },
    hyp: 'AD∥BC', goal: '△ABO＝△DCO（面積）', tri: ['ABC', 'DBC'],
    plan: { q: '△ABO と △DCO は合同ではない。面積が等しいことを、どう示す？', a: '共通の △OBC をつけたした、△ABC と △DBC の面積をくらべる', sub: '底辺が共通で、高さが等しい三角形は、面積が等しい' },
    L: [{ t: 'AD∥BC だから、△ABC と △DBC は、底辺 BC が共通で高さが等しい', n: 1, q: '△ABC と △DBC をくらべよう。底辺と高さは？', a: '底辺 BC が共通で、AD∥BC だから高さも等しい' },
      { t: 'よって、△ABC＝△DBC', n: 2, q: '①から、何がいえる？', a: '△ABC＝△DBC（面積が等しい）' },
      { t: '△ABO＝△ABC−△OBC', n: 3, q: '△ABO の面積を、△ABC と △OBC で表すと？', a: '△ABO＝△ABC−△OBC' },
      { t: '△DCO＝△DBC−△OBC', n: 4, q: '△DCO の面積も、同じように表すと？', a: '△DCO＝△DBC−△OBC' },
      { t: '②③④より、△ABO＝△DCO', q: '②③④から、何がいえる？', a: '△ABO＝△DCO（面積が等しい）' }],
    point: { a: '面積が等しい2つの三角形から、共通な部分（△OBC）をひく' } });
})();

/* h09 等積（平行四辺形）：面積の等しい三角形に乗りかえる */
(function () {
  var B = [0, 0], C = [7, 0], A = [2.2, 4], D = add(A, C), E = [4.2, 0];
  var P = { A: A, B: B, C: C, D: D, E: E, F: lerp(C, D, (C[0] - E[0]) / (C[0] - B[0])) };
  check(same(area(P, 'ABE'), area(P, 'DBE')) && same(area(P, 'DBE'), area(P, 'DBF')) && same(area(P, 'DBF'), area(P, 'ADF')), 'h09：△ABE＝△DBE＝△DBF＝△ADF');
  S.push({ id: 'h09', lv: 4, kind: '等積', ttl: '面積の等しい三角形の乗りかえ',
    q: '平行四辺形 ABCD の辺 BC 上に点 E、辺 CD 上に点 F を、EF∥BD となるようにとる。このとき、△ABE と △ADF の面積が等しいことを証明しよう。',
    P: P,
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'AE', 'AF', 'EF', 'BD'], dash: ['DE', 'BF'], pars: [['EF', 1], ['BD', 1]], dir: { E: 's', F: 'e' } },
    hyp: '四角形 ABCD は平行四辺形、EF∥BD', goal: '△ABE＝△ADF（面積）', tri: ['ABE', 'ADF'],
    plan: { q: '△ABE と △ADF は合同ではない。面積が等しいことを、どう示す？', a: '面積の等しい三角形に、つぎつぎに乗りかえる', sub: '点線の DE、BF をひいて、底辺が共通で高さが等しい三角形をさがす' },
    L: [{ t: 'AD∥BE だから、△ABE＝△DBE', n: 1, q: '△ABE と、底辺 BE が共通で高さが等しい三角形は？', a: '△DBE（AD∥BC だから）' },
      { t: 'EF∥BD だから、△DBE＝△DBF', n: 2, q: 'EF∥BD を使うと、△DBE と面積が等しい三角形は？', a: '△DBF（底辺 BD が共通）' },
      { t: 'AB∥DF だから、△DBF＝△ADF', n: 3, q: '△DBF と、底辺 DF が共通で高さが等しい三角形は？', a: '△ADF（AB∥DC だから）' },
      { t: '①②③より、△ABE＝△ADF', q: '①②③から、何がいえる？', a: '△ABE＝△ADF（面積が等しい）' }],
    point: { a: '平行線を見つけるたびに、底辺が共通な三角形へ乗りかえる' } });
})();

/* h10 二段（合同 → 垂直）：正方形 */
(function () {
  var A = [0, 6], B = [0, 0], C = [6, 0], D = [6, 6], E = [2.4, 0], F = [6, 2.4];
  S.push({ id: 'h10', lv: 4, kind: '二段（合同→垂直）', ttl: '正方形の中の垂直',
    q: '正方形 ABCD の辺 BC、CD 上に、BE＝CF となる点 E、F をとり、AE と BF の交点を P とする。このとき、AE⊥BF であることを証明しよう。',
    P: { A: A, B: B, C: C, D: D, E: E, F: F, P: meet(A, E, B, F) },
    fig: { segs: ['AB', 'BC', 'CD', 'DA', 'AE', 'BF'], ticks: [['BE', 1], ['CF', 1]], dir: { P: 'ne', E: 's', F: 'e' } },
    hyp: '四角形 ABCD は正方形、BE＝CF', goal: 'AE⊥BF', tri: ['ABE', 'BCF'],
    plan: { q: 'AE⊥BF は、∠APB＝90° を示せばよい。まず、角の材料を手に入れるために、どの三角形の合同を示す？', a: '△ABE と △BCF' },
    L: [{ t: '△ABE と △BCF で' }, { t: 'AB＝BC', r: '正方形の辺', n: 1 }, { t: 'BE＝CF', r: '仮定', n: 2 }, { t: '∠ABE＝∠BCF＝90°', r: '正方形の角', n: 3 },
      { t: '①②③より、' + SAS, c: 'SAS' }, { t: '△ABE≡△BCF' },
      { t: '合同な図形の対応する角は等しいので、∠BAE＝∠CBF', n: 4, q: '合同から、どの角とどの角が等しいといえる？', a: '∠BAE＝∠CBF（対応する角は等しい）' },
      { t: '∠BAP＋∠ABP＝∠CBF＋∠ABP＝∠ABC＝90°', n: 5, q: '④を使うと、△ABP の ∠BAP＋∠ABP は何度？', a: '∠BAP＋∠ABP＝∠CBF＋∠ABP＝∠ABC＝90°' },
      { t: '△ABP の内角の和より、∠APB＝180°−90°＝90°', q: '⑤から、△ABP の残りの角 ∠APB は？', a: '∠APB＝180°−90°＝90°' },
      { t: 'よって、AE⊥BF' }],
    point: { a: '合同で等しい角を見つけ、2つの角の和が 90° → 残りの角が 90°（垂直）' } });
})();
})();
