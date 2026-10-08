/* 中3 6章 円　第1時「円周上の点を動かすと、角の大きさはどうなるだろう」（探）。自作。円周角と中心角。
   図：円 O(5.9,3.0) 半径2.4。A＝220°、B＝320°（弧ABは100°）。P＝90°、Q＝35°、R＝155°（弧ABを含まない側）→ ∠APB＝∠AQB＝∠ARB＝50°，中心角∠AOB＝100°。
   別の弧：C＝200°、D＝280°（80°）、S＝60° → ∠CSD＝40°，∠COD＝80°。 */
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
  const O = [5.9, 3.0], r = 2.4;
  const f1 = mkFig('f1'), f2 = mkFig('f2'), f3 = mkFig('f3'), f4 = mkFig('f4');
  const G1 = GF('f1'), G2 = GF('f2'), G3 = GF('f3'), G4 = GF('f4');
  const A = cpt(O, r, 220), Bp = cpt(O, r, 320), P = cpt(O, r, 90), Qp = cpt(O, r, 35), Rp = cpt(O, r, 155);
  const C = cpt(O, r, 200), D = cpt(O, r, 280), S = cpt(O, r, 60);
  const base = (names) => [circ(O, r, 'w'), dot(A, 'A', away(A, O), 'y'), dot(Bp, 'B', away(Bp, O), 'y'), names];
  const ptName = (p, n, c) => dot(p, n, away(p, O), c || 'y');
  const feet = (p, c) => [ln(p, A, c), ln(p, Bp, c)];
  const arcAB = [arcO(O, r, 220, 320, 'g'), lab(5.9, 0.3, '弧AB', 'g', { size: 28 })];
  const centre = [dot(O, 'O', [0, 1], 'w', { off: 24, r: 4.5 }), ln(O, A, 'b'), ln(O, Bp, 'b')];

  KL.lesson({ id: 'g3u6-01', unit: '中3　円', kick: '3年6章　第1時', title: '円周上の点を動かすと、角の大きさはどうなるだろう', card: '円周上の点を動かすと、角の大きさはどうなるだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、円周上の点を動かしたとき、角の大きさが、どうなるかを調べます。', { title: true, point: false, ft: 'happy' }),
    B('ぼく、池のまわりを歩くのは、とくいだよ！ 歩けば歩くほど、景色が変わるもんね！', { title: true, fb: 'happy', up: true }),
    T('ちょうどいい例ですね。円い池のまわりを歩きながら、向こうに立つ2本の旗を見る角を、考えましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。円い池のふちの上に、旗A、旗Bが立っています。ふちの上の点Pから、2本の旗を見たときの∠APBは、Pの場所で変わるでしょうか。', { part: '問題を読もう', ft: 'normal',
      add: [memo('めあて', '円周上の点を\n動かすと、角の大きさは\nどうなるか', 'y'), Object.assign(f1, { prims: [] })],
      draw: [G1(base(ptName(P, 'P')), feet(P, 'y'))] }),
    B('旗に近づくほど、旗が大きく見えるから、角も大きくなるでしょ！', { fb: 'happy', up: true }),
    T('見た目の大きさは変わりそうですね。でも、角の大きさが、本当に変わるのか、動かして調べてみます。', { ft: 'normal', point: false }),
    T('その前に、用語を決めます。円周上の2点A、Bで分けた円周の一部を、弧といいます。この図の、下の短いほうを、弧ABとします。', { ft: 'normal', point: false, draw: [G1(arcAB)],
      add: [note('円周の一部\n＝弧', '用語')] }),
    T('弧ABにふくまれない点Pについて、∠APBを、弧ABに対する円周角といいます。中心Oと結んだ∠AOBは、中心角です。', { ft: 'normal', point: false, draw: [G1(centre)],
      add: [memo('用語', '円周角　∠APB\n中心角　∠AOB', 'p')] }),

    /* ---------- 問1：用語 ---------- */
    Q('q1', T('問題です。弧ABに対する円周角は、どれでしょう。', { ft: 'normal' }),
      [{ t: '∠AOB' }, { t: '∠OAB' }, { t: '∠OPB' }, { t: '∠APB', ok: true }],
      { 0: [T('∠AOBは、頂点が中心Oなので、中心角です。円周角は、頂点が円周上にある角です。', { ft: 'normal' })],
        1: [B('Aも円周の上にあるから、∠OABも、円周角でしょ？', { fb: 'happy', up: true }), T('頂点は円周上ですが、辺の1つがOに向かっています。円周角は、2つの辺が、弧の両はしA、Bを通る角です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 頂点Pが円周上にあって、2つの辺が、A、Bを通る、∠APBが円周角です。', { ft: 'happy' }), B('弧の両はしを、円周上から見た角なんだね！', { fb: 'star', up: true })],
        wrong: [T('∠OPBは、辺POが中心Oに向かうので、円周角ではありません。弧の両はしA、Bを見る、∠APBです。', { ft: 'normal' })] }),

    T('では、Pを動かして、∠APBを測ります。いまの位置のPでは、∠APBは50°でした。', { clear: true, cols: [0.34, 0.66], part: '点を動かして測ろう', ft: 'normal',
      add: [note('P　∠APB＝50°', '測った角'), Object.assign(f2, { prims: [] })],
      draw: [G2(base(ptName(P, 'P')), feet(P, 'y'), mark(P, A, Bp, 0.8, 'y'), num(P, A, Bp, 1.25, '50°', 'y'))] }),
    T('つぎに、Pを右へ動かして、点Qの位置にします。測ると、∠AQBも、50°でした。', { ft: 'normal', point: false,
      add: [note('Q　∠AQB＝50°')],
      draw: [G2(ptName(Qp, 'Q', 'p'), feet(Qp, 'p'), mark(Qp, A, Bp, 0.8, 'p'))] }),
    B('50°が2回続いたよ！ ぐうぜんかな？ それとも、まじないかな？', { fb: 'surprised', up: true }),
    T('ぐうぜんかどうか、もう1つ確かめます。Pを左へ動かして、点Rの位置にします。', { ft: 'normal', point: false,
      draw: [G2(ptName(Rp, 'R', 'b'), feet(Rp, 'b'))] }),

    /* ---------- 問2：予想 ---------- */
    Q('q2', T('問題です。PでもQでも、50°でした。点Rで測る、∠ARBは、何度になるでしょう。', { ft: 'normal' }),
      [{ t: '90°' }, { t: '70°' }, { t: '50°', ok: true }, { t: '30°' }],
      { 0: [B('Rは旗から遠くて、広い場所だから、角も、90°くらいに、大きくなるよ！', { fb: 'happy', up: true }), T('これまでの2回は、場所が変わっても、50°のままでした。Rで測っても、∠ARBは50°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('30°と、予想したのですね。でも、PでもQでも、50°でした。Rで測ると、やはり50°です。', { ft: 'normal' })],
        ok: [T('正解！ ∠ARBも、50°です。', { ft: 'happy', draw: [G2(mark(Rp, A, Bp, 0.8, 'b'))], add: [note('R　∠ARB＝50°')] }), B('3回とも、50°！ ぐうぜんじゃなさそうだね！', { fb: 'star', up: true })],
        wrong: [T('P、Qの結果から、角は変わらないと、見当がつきます。Rで測ると、∠ARBは50°です。', { ft: 'normal', draw: [G2(mark(Rp, A, Bp, 0.8, 'b'))], add: [note('R　∠ARB＝50°')] })] }),
    T('弧ABにふくまれない円周上なら、どこにとっても、円周角は、同じ大きさになるようです。旗の向こう側のふちを歩いても、旗を見る角は、変わりません。', { ft: 'normal', point: false,
      add: [memo('わかったこと', '同じ弧に対する円周角は\nどこにとっても等しい', 'y')] }),

    T('つぎに、中心角との関係を調べます。弧ABに対する中心角∠AOBは、100°です。円周角の50°と、比べましょう。', { clear: true, cols: [0.34, 0.66], part: '中心角と比べよう', ft: 'normal',
      add: [note('中心角　∠AOB＝100°', '比べる'), note('円周角　∠APB＝50°'), Object.assign(f3, { prims: [] })],
      draw: [G3(base(ptName(P, 'P')), feet(P, 'y'), centre, mark(P, A, Bp, 0.8, 'y'), num(P, A, Bp, 1.25, '50°', 'y'), mark(O, A, Bp, 0.7, 'b'), num(O, A, Bp, 1.1, '100°', 'b'))] }),

    /* ---------- 問3：半分 ---------- */
    Q('q3', T('問題です。円周角の50°は、中心角の100°の、何倍でしょう。', { ft: 'normal' }),
      [{ t: '[[1/2]]倍', ok: true }, { t: '2倍' }, { t: '1倍（同じ）' }, { t: '[[1/4]]倍' }],
      { 1: [B('円周角のほうが、大きく見えるから、2倍でしょ？', { fb: 'happy', up: true }), T('逆です。50°を2倍すると100°。大きいのは、中心角のほうです。円周角は、中心角の[[1/2]]倍です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('50°と100°は、同じではありません。100°のほうが、2倍大きいので、円周角は中心角の[[1/2]]倍です。', { ft: 'normal' })],
        ok: [T('正解！ 50÷100＝[[1/2]]。円周角は、中心角の半分です。', { ft: 'happy' }), B('50°は、100°の半分だね！', { fb: 'star', up: true })],
        wrong: [T('[[1/4]]倍だと25°です。50°は、100°の半分、つまり[[1/2]]倍です。', { ft: 'normal' })] }),
    T('P、Q、Rのどこで測っても、50°でした。つまり、円周角は、いつも、中心角の半分になるようです。', { ft: 'normal', point: false,
      add: [memo('円周角の定理', '①同じ弧に対する円周角は\n　どれも等しい\n②円周角＝中心角の[[1/2]]', 'p')] }),
    B('この関係を使えば、中心角から、円周角がわかるね！', { fb: 'happy', up: true }),

    T('別の弧でも、確かめましょう。弧CDに対する中心角∠CODは、80°です。', { clear: true, cols: [0.34, 0.66], part: '別の弧で確かめよう', ft: 'normal',
      add: [note('中心角　∠COD＝80°', '別の弧'), Object.assign(f4, { prims: [] })],
      draw: [G4(circ(O, r, 'w'), dot(C, 'C', away(C, O), 'y'), dot(D, 'D', away(D, O), 'y'), ptName(S, 'S', 'p'), dot(O, 'O', [0, 1], 'w', { off: 24, r: 4.5 }), ln(O, C, 'b'), ln(O, D, 'b'), ln(S, C, 'p'), ln(S, D, 'p'), mark(O, C, D, 0.7, 'b'), num(O, C, D, 1.1, '80°', 'b'), mark(S, C, D, 0.8, 'p'), num(S, C, D, 1.3, 'x', 'p'))] }),

    /* ---------- 問4：別の弧 ---------- */
    Q('q4', T('最後の問題です。弧CDに対する円周角∠CSDの大きさxは、何度でしょう。', { ft: 'happy' }),
      [{ t: '20°' }, { t: '40°', ok: true }, { t: '80°' }, { t: '160°' }],
      { 2: [B('弧CDの角は、80°でしょ？ そのまま、80°だよ！', { fb: 'happy', up: true }), T('80°は、中心角です。円周角は、その半分だから、80°÷2＝40°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('160°は、中心角を2倍にした数です。円周角は、中心角の半分なので、80°÷2＝40°です。', { ft: 'normal' })],
        ok: [T('正解！ 80°÷2＝40°。円周角は、中心角の半分です。', { ft: 'happy' }), B('どこにSをとっても、40°なんだね！', { fb: 'star', up: true })],
        wrong: [T('20°は、半分の、さらに半分です。半分にするのは、1回だけで、80°÷2＝40°です。', { ft: 'normal' })] }),
    T('まとめます。同じ弧に対する円周角は、どれも等しく、中心角の半分です。なぜ半分になるのかは、次の時間に、説明します。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [memo('ポイント', '同じ弧に対する円周角は\n等しい\n円周角＝中心角の[[1/2]]', 'y')] }),
    B('旗の向こう側を歩いても、旗を見る角は、変わらないんだね！ 歩く距離は、変わるけど！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
