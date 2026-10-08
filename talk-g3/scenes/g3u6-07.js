/* 中3 6章 円　第7時「円の中に、相似な三角形を見つけよう」（活）。自作。円と相似。
   弦 AB、CD が円の内部の点 P で交わる。P を原点（cm）に、A(−12,0)、B(4,0)、C＝8(−9/16,√175/16)＝(−4.5,6.614)、D＝6(9/16,−√175/16)＝(3.375,−4.961)。
   PA＝12、PB＝4、PC＝8、PD＝6（PA×PB＝PC×PD＝48 だが、この式は使わない）。円の中心(−4,−1.512)、半径8.116。AC＝10、DB＝5（sympy で検算）。
   ∠APC＝∠DPB＝55.77°（対頂角）、∠PAC＝∠PDB＝41.41°（弧BCの円周角）→ △PAC∽△PDB（相似比 PA：PD＝12：6＝2：1、PC：PB＝8：4＝2：1、AC：DB＝10：5）。
   図は縮尺 0.2886（1cm→0.2886）で、円の中心を (5.9,3.0) に置く。 */
(function () {
  const { T: T0, B: B0, Q, FIG, tbl } = KL;
  /* ---- 読み上げ（say）：記号・英字・読みにくい語を、かなにする。字幕と読みがちがう行にだけ say がつく ---- */
  const plainS = s => String(s).replace(/\{\{|\}\}|\*\*/g, '');
  const KA = { A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', F: 'エフ', G: 'ジー', H: 'エイチ', I: 'アイ', J: 'ジェー', K: 'ケー', L: 'エル', M: 'エム', N: 'エヌ', O: 'オー', P: 'ピー', Q: 'キュー', R: 'アール', S: 'エス', T: 'ティー', U: 'ユー', V: 'ブイ', W: 'ダブリュー', X: 'エックス', Y: 'ワイ', Z: 'ゼット' };
  const KS = { a: 'エー', b: 'ビー', c: 'シー', d: 'ディー', e: 'イー', f: 'エフ', g: 'ジー', h: 'エイチ', i: 'アイ', j: 'ジェー', k: 'ケー', l: 'エル', m: 'エム', n: 'エヌ', o: 'オー', p: 'ピー', q: 'キュー', r: 'アール', s: 'エス', t: 'ティー', u: 'ユー', v: 'ブイ', w: 'ダブリュー', x: 'エックス', y: 'ワイ', z: 'ゼット' };
  const WD = [['円周角', 'えんしゅうかく'], ['中心角', 'ちゅうしんかく'], ['弦', 'げん'], ['接線', 'せっせん'], ['接点', 'せってん'], ['作図', 'さくず'], ['無作為', 'むさくい'], ['抽出', 'ちゅうしゅつ'], ['母集団', 'ぼしゅうだん'], ['標識', 'ひょうしき'], ['全数調査', 'ぜんすうちょうさ'], ['推定', 'すいてい'], ['偏', 'かたよ'], ['対頂角', 'たいちょうかく'], ['錯角', 'さっかく'], ['同位角', 'どういかく'], ['鯉', 'こい'], ['印', 'しるし'], ['周上', 'しゅうじょう']];
  const CN = ['いち', 'に', 'さん', 'よん', 'ご', 'ろく'];
  const rd = s => plainS(s)
    .replace(/\[\[(\d+)\/(\d+)\]\]/g, '$2分の$1').replace(/角∠/g, '角、∠')
    .replace(/[①-⑥]+/g, m => m.length === 1 ? 'まる' + CN['①②③④⑤⑥'.indexOf(m)] + '、' : [...m].map(c => CN['①②③④⑤⑥'.indexOf(c)]).join('、') + '、')
    .replace(/△/g, 'さんかく ').replace(/∠/g, 'かく ').replace(/≡/g, ' 合同 ').replace(/∽/g, ' そうじ ').replace(/∥/g, ' へいこう ').replace(/⊥/g, ' 垂直 ')
    .replace(/°/g, '度').replace(/＝/g, ' イコール ').replace(/≠/g, ' イコールではない ').replace(/≒/g, ' ほぼ ').replace(/：/g, ' たい ')
    .replace(/＜/g, ' より小さい ').replace(/＞/g, ' より大きい ').replace(/%/g, 'パーセント').replace(/π/g, 'パイ').replace(/′/g, 'ダッシュ')
    .replace(/(?<=[0-9度A-Za-z）)])−/g, 'ひく').replace(/−/g, 'マイナス').replace(/÷/g, 'わる').replace(/×/g, 'かける').replace(/＋/g, 'たす')
    .replace(/[(（]/g, 'かっこ、').replace(/[)）]/g, '、かっことじ、')
    .replace(/cm²/g, 'へいほうセンチメートル').replace(/cm/g, 'センチメートル').replace(/²/g, 'の2乗')
    .replace(/[A-Z]+/g, m => [...m].map(c => KA[c] || c).join(''))
    .replace(/(?<![A-Za-z])[a-z](?![A-Za-z])/g, m => KS[m] || m)
    .replace(/、、+/g, '、').replace(/ {2,}/g, ' ').trim();
  const rdw = s => { let r = rd(s); for (const [a, b] of WD) r = r.split(a).join(b); return r; };
  const wrap = f => (s, o = {}) => { const r = rdw(s); return f(s, r === plainS(s) ? o : Object.assign({ say: r }, o)); };
  const T = wrap(T0), B = wrap(B0);
  const sad = { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } };      // ポンタのまちがいを、先生がやさしく直す
  const memo = (label, text, color) => ({ col: 0, type: 'box', color: color || 'y', size: 'xs', label, text, t: 4.5 });
  const note = (text, label) => ({ col: 0, type: 'text', size: 'xs', label, text, t: 3.5 });
  /* ---- 図の部品（座標は数学の座標・y が上。1目もり＝100px の図 11.8×6.0） ---- */
  const R2D = 180 / Math.PI, D2R = Math.PI / 180;
  const view = [0, 0, 11.8, 6.0];
  const mkFig = id => FIG(id, view, 1180, 600, [], { col: 1 });
  const GF = id => (...i) => ({ fig: id, items: i.flat(3) });
  const cpt = (O, r, deg) => [O[0] + r * Math.cos(deg * D2R), O[1] + r * Math.sin(deg * D2R)];   // 円周上の点（中心・半径・角度）
  const away = (p, O) => { const d = [p[0] - O[0], p[1] - O[1]], l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l]; };
  const dirOf = (V, P) => Math.atan2(P[1] - V[1], P[0] - V[0]) * R2D;
  const sweep = (V, P, Q2) => { let a1 = dirOf(V, P), a2 = dirOf(V, Q2); let d = ((a2 - a1) % 360 + 360) % 360; if (d > 180) { const t = a1; a1 = a2; a2 = t; d = 360 - d; } return [a1, a1 + d]; };
  const mark = (V, P, Q2, r, c, o) => { const s = sweep(V, P, Q2); return Object.assign({ k: 'ell', o: V, rx: r, ry: r, a1: s[0], a2: s[1], c, wd: 3.4, d: 0.3 }, o || {}); };
  const num = (V, P, Q2, r, text, c, o) => { const s = sweep(V, P, Q2), m = (s[0] + s[1]) / 2 * D2R; return Object.assign({ k: 'label', at: [V[0] + r * Math.cos(m), V[1] + r * Math.sin(m)], text, c, size: 27, d: 0.2 }, o || {}); };
  const lab = (x, y, text, c, o) => Object.assign({ k: 'label', at: [x, y], text, c: c || 'w', size: 28, d: 0.2 }, o || {});
  const ln = (a, b, c, o) => Object.assign({ k: 'seg', a, b, c: c || 'w', wd: 3.4, d: 0.6 }, o || {});
  const dot = (at, name, dir, c, o) => Object.assign({ k: 'pt', at, name, dir, off: 26, c: c || 'y', r: 6, d: 0.15 }, o || {});
  const dots = (list, c) => ({ k: 'pts', list, c: c || 'y', r: 6, d: 0.15 });
  const circ = (O, r, c, o) => Object.assign({ k: 'ell', o: O, rx: r, ry: r, c: c || 'w', wd: 3.4, d: 1.0 }, o || {});
  const arcO = (O, r, a1, a2, c, o) => Object.assign({ k: 'ell', o: O, rx: r, ry: r, a1, a2, c, wd: 5, d: 0.6 }, o || {});
  const tri = (pts, c, fill, o) => Object.assign({ k: 'poly', pts, close: true, c: c || 'w', wd: 3.2, d: 0.7 }, fill ? { fill, alpha: 0.16 } : {}, o || {});
  const rt = (v, p, q, c) => { const u = x => { const l = Math.hypot(x[0] - v[0], x[1] - v[1]); return [(x[0] - v[0]) / l, (x[1] - v[1]) / l]; }; return { k: 'right', at: v, u: u(p), v: u(q), s: 15, c: c || 'w', d: 0.2 }; };
  const tick = (a, b, n, c) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, h = 0.17, g = 0.13, out = []; for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * g, cx = mx + ux * o, cy = my + uy * o; out.push({ k: 'seg', a: [cx - uy * h, cy + ux * h], b: [cx + uy * h, cy - ux * h], c, wd: 3, d: 0.1 }); } return out; };
/* ==== ここまで共通の部品 ==== */
  const sc = 2.35 / 8.1416, cc = [-4, -4 * Math.sqrt(7) / 7];
  const F = p => [5.9 + sc * (p[0] - cc[0]), 3.0 + sc * (p[1] - cc[1])];
  const cphi = 9 / 16, sphi = Math.sqrt(1 - cphi * cphi);
  const A = F([-12, 0]), Bp = F([4, 0]), C = F([-8 * cphi, 8 * sphi]), D = F([6 * cphi, -6 * sphi]), P = F([0, 0]), O = [5.9, 3.0], R = 2.35;
  const f1 = mkFig('f1'), f2 = mkFig('f2'), f3 = mkFig('f3');
  const G1 = GF('f1'), G2 = GF('f2'), G3 = GF('f3');
  const nm = (p, n, c) => dot(p, n, away(p, O), c || 'y');
  const base = [circ(O, R, 'w'), nm(A, 'A'), nm(Bp, 'B'), nm(C, 'C'), nm(D, 'D'), dot(P, 'P', [-0.6, -1], 'w', { off: 24, r: 5 }), ln(A, Bp, 'w'), ln(C, D, 'w')];
  const tri1 = tri([P, A, C], 'y', 'y', { temp: true }), tri2 = tri([P, D, Bp], 'p', 'p', { temp: true });
  const sides = [ln(A, C, 'y', { wd: 3 }), ln(D, Bp, 'p', { wd: 3 })];
  const vert = [mark(P, A, C, 0.55, 'g'), mark(P, D, Bp, 0.55, 'g')];
  const arcAng = [mark(A, P, C, 1.0, 'b'), mark(D, P, Bp, 0.6, 'b')];
  const arcBC = [arcO(O, R, Math.min(dirOf(O, Bp), dirOf(O, C)), Math.max(dirOf(O, Bp), dirOf(O, C)), 'b', { wd: 4.4 })];
  const lenL = (p, q, text, c, dx, dy) => lab((p[0] + q[0]) / 2 + dx, (p[1] + q[1]) / 2 + dy, text, c, { size: 24 });
  const len4 = [lenL(P, A, 'PA＝12cm', 'y', 0, -0.3), lenL(P, C, 'PC＝8cm', 'y', -0.5, 0.05), lab((P[0] + D[0]) / 2 - 0.1, (P[1] + D[1]) / 2 - 0.05, 'PD＝6cm', 'p', { size: 24, anchor: 'end' }), lab((P[0] + Bp[0]) / 2, P[1] + 0.3, 'PB＝？', 'p', { size: 24 })];
  const len5 = [lenL(A, C, 'AC＝10cm', 'y', 0.45, -0.3), lab(D[0] + 0.3, (D[1] + Bp[1]) / 2, 'DB＝？', 'p', { size: 24, anchor: 'start' })];

  KL.lesson({ id: 'g3u6-07', unit: '中3　円', kick: '3年6章　第7時', title: '円の中に、相似な三角形を見つけよう', card: '円の中に、相似な三角形を見つけよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、円の中に、相似な三角形を、見つけます。', { title: true, point: false, ft: 'happy' }),
    B('円の中で、線がバッテンになると、ちょうちょの形になるよ！ ぼく、ちょうちょを捕まえるのは、とくいだよ！', { title: true, fb: 'happy', up: true }),
    T('ちょうちょの羽のような、2つの三角形が、実は、相似になっています。そのわけを、考えましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。円の中で、弦ABと弦CDが、点Pで交わっています。△PACと△PDBが、相似になることを、説明します。', { part: '問題を読もう', ft: 'normal',
      add: [memo('めあて', '△PAC∽△PDB\nになるわけ', 'y'), Object.assign(f1, { prims: [] })],
      draw: [G1(base, tri1, tri2)] }),
    T('相似条件を使うには、等しい角を探します。まず、点Pに集まる角に、注目します。', { ft: 'normal', point: false }),

    /* ---------- 問1：対頂角 ---------- */
    Q('q1', T('問題です。∠APCと、等しい角は、どれでしょう。', { ft: 'normal' }),
      [{ t: '∠PAC' }, { t: '∠PCA' }, { t: '∠DPB', ok: true }, { t: '∠ABD' }],
      { 0: [B('同じ三角形PACの角だから、∠APCと∠PACは、仲間で、等しいでしょ？', { fb: 'happy', up: true }), T('同じ三角形の角が、等しいとは、かぎりません。∠APCと等しいのは、向かい合う角、対頂角の∠DPBです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('∠PCAも、△PACの角です。∠APCとは、別の角です。向かい合う角の、∠DPBが、対頂角で等しいです。', { ft: 'normal' })],
        ok: [T('正解！ 直線ABとCDが交わる点Pで、向かい合う角です。対頂角は等しいので、∠APC＝∠DPBです。', { ft: 'happy', draw: [G1(vert)], add: [note('△PACと△PDBにおいて\n対頂角は等しいから\n∠APC＝∠DPB …①', '証明')] }), B('バッテンの、向かい合う角だね！', { fb: 'star', up: true })],
        wrong: [T('∠ABDは、円周角です。点Pで向かい合う、∠DPBが、対頂角で、∠APCと等しいです。', { ft: 'normal', draw: [G1(vert)], add: [note('△PACと△PDBにおいて\n対頂角は等しいから\n∠APC＝∠DPB …①', '証明')] })] }),

    T('もう1組の等しい角は、円周角から見つけます。弧BCに対する円周角を、探しましょう。', { ft: 'normal', point: false, draw: [G1(arcBC)] }),

    /* ---------- 問2：円周角 ---------- */
    Q('q2', T('問題です。∠PACと、等しい角は、どれでしょう。弧BCに対する円周角です。', { ft: 'normal' }),
      [{ t: '∠CDB', ok: true }, { t: '∠ACD' }, { t: '∠ABD' }, { t: '∠CBD' }],
      { 1: [B('Cの角も、Aと同じ三角形にあるから、等しいでしょ？', { fb: 'happy', up: true }), T('∠ACDは、弧ADに対する円周角です。弧BCを見ている角は、AとDにある、∠PAC（∠BAC）と、∠CDBです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('∠ABDは、弧ADに対する円周角です。弧BCに対する円周角は、AとDから見た、∠BACと∠CDBです。', { ft: 'normal' })],
        ok: [T('正解！ ∠PAC（∠BAC）も、∠CDBも、弧BCに対する円周角です。同じ弧の円周角なので、等しくなります。', { ft: 'happy', draw: [G1(arcAng)], add: [note('弧BCの円周角は等しいから\n∠PAC＝∠PDB …②')] }), B('円周角の定理が、ここで使えるんだね！', { fb: 'star', up: true })],
        wrong: [T('∠CBDは、弧CDに対する円周角です。弧BCを見ているのは、AとDにある、∠BACと∠CDBです。', { ft: 'normal', draw: [G1(arcAng)], add: [note('弧BCの円周角は等しいから\n∠PAC＝∠PDB …②')] })] }),

    T('等しい角が、2組、見つかりました。これで、どの相似条件が、使えるでしょう。', { clear: true, cols: [0.34, 0.66], part: '相似を言おう', ft: 'normal',
      add: [note('∠APC＝∠DPB …①\n∠PAC＝∠PDB …②', 'わかったこと'), Object.assign(f2, { prims: [] })],
      draw: [G2(base, vert, arcAng, sides)] }),

    /* ---------- 問3：相似条件 ---------- */
    Q('q3', T('問題です。辺の長さが、わからなくても使える、相似条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '3組の辺の比が等しい' }, { t: '2組の角が等しい', ok: true }, { t: '2組の辺の比と間の角が等しい' }, { t: '1組の辺と両端の角が等しい' }],
      { 0: [T('3組の辺の比を使うには、辺の長さが、わかっていなければなりません。角だけがわかっているときは、2組の角を使います。', { ft: 'normal' })],
        2: [B('間の角が等しいから、この条件も、使えるでしょ？', { fb: 'happy', up: true }), T('辺の比が、わかっていないので、使えません。わかっているのは、角だけです。2組の角が等しいことで、言えます。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ ①②より、2組の角が、それぞれ等しいので、△PAC∽△PDBです。', { ft: 'happy', add: [note('①②より、2組の角が\nそれぞれ等しいから\n△PAC∽△PDB', '結論')] }), B('角が2組そろえば、相似なんだね！', { fb: 'star', up: true })],
        wrong: [T('1組の辺と両端の角が等しい、は、合同条件です。相似条件は、2組の角が等しい、を使います。', { ft: 'normal', add: [note('①②より、2組の角が\nそれぞれ等しいから\n△PAC∽△PDB', '結論')] })] }),

    T('相似がわかったので、辺の長さを、求められます。PA＝12cm、PC＝8cm、PD＝6cmのとき、PBを求めます。', { clear: true, cols: [0.34, 0.66], part: '長さを求めよう', ft: 'normal',
      add: [memo('相似な三角形', '△PAC∽△PDB\n対応する辺の比は等しい', 'y'), Object.assign(f3, { prims: [] })],
      draw: [G3(base, sides, len4)] }),

    /* ---------- 問4：PB ---------- */
    Q('q4', T('問題です。PBの長さは、何cmでしょう。PAとPD、PCとPBが、それぞれ対応します。', { ft: 'normal' }),
      [{ t: '4cm', ok: true }, { t: '6cm' }, { t: '9cm' }, { t: '16cm' }],
      { 3: [B('PA：PD＝PB：PC と考えて、12：6＝PB：8で、16cmだよ！', { fb: 'happy', up: true }), T('対応する辺を、入れかえています。PAとPD、PCとPBが対応するので、12：6＝8：PBです。PBは、4cmです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('9cmは、12：8＝PB：6 と、対応を、まちがえた答えです。△PACの辺と、△PDBの辺を、順に対応させます。', { ft: 'normal' })],
        ok: [T('正解！ PA：PD＝PC：PB より、12：6＝8：PB。12×PB＝6×8、PB＝4cmです。', { ft: 'happy', add: [note('PA：PD＝PC：PB\n12：6＝8：PB\nPB＝4cm', '比例式')] }), B('相似比は、2：1なんだね！', { fb: 'star', up: true })],
        wrong: [T('6cmは、PDの長さです。12：6＝8：PB を解いて、PBは4cmです。', { ft: 'normal', add: [note('PA：PD＝PC：PB\n12：6＝8：PB\nPB＝4cm', '比例式')] })] }),

    T('もう1問。ACの長さが10cmのとき、DBの長さを、求めます。相似比は、PA：PD＝12：6＝2：1です。', { ft: 'normal', point: false, draw: [G3(len5)] }),

    /* ---------- 問5：DB ---------- */
    Q('q5', T('最後の問題です。DBの長さは、何cmでしょう。', { ft: 'happy' }),
      [{ t: '4cm' }, { t: '5cm', ok: true }, { t: '10cm' }, { t: '20cm' }],
      { 2: [B('相似なんだから、ACと同じ、10cmでしょ？', { fb: 'happy', up: true }), T('相似は、形が同じで、大きさは、同じとは限りません。相似比が2：1なので、DBは、ACの半分です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('20cmは、相似比を逆にして、10×2とした答えです。△PDBのほうが小さいので、DBは、ACより短くなります。', { ft: 'normal' })],
        ok: [T('正解！ AC：DB＝2：1 より、10：DB＝2：1。DB＝5cmです。', { ft: 'happy' }), B('ちょうちょの、小さい羽の辺だね！', { fb: 'star', up: true })],
        wrong: [T('4cmは、PBの長さです。AC：DB＝2：1 より、DBは、10cmの半分の、5cmです。', { ft: 'normal' })] }),

    T('まとめます。円の中で、2本の弦が交わるとき、対頂角と、同じ弧の円周角から、相似な三角形が見つかります。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [memo('ポイント', '対頂角は等しい\n同じ弧の円周角は等しい\n2組の角→相似→辺の比', 'y')] }),
    B('ちょうちょの羽は、大きさがちがっても、形は同じなんだね！ 円の中にも、ちょうちょがいたよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
