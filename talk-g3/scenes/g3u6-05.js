/* 中3 6章 円　第5時「同じ角度に見える場所は、どこにあるだろう」（探）。自作。円周角の定理の逆。
   図1・2：円 O(5.9,2.9) 半径2.2。A＝210°、B＝330°（弧AB＝120°）、P＝90°、Q＝35°（円周上）→ ∠APB＝∠AQB＝60°。
   R：A、B を通る円周角40°の円（中心(5.9,4.07)、半径2.9635）の上の点（θ＝15°）→ 円Oの外側、∠ARB＝40°。S＝AB を直径とする円（中心(5.9,1.8)）の上の φ＝100° の点→ 円Oの内側、∠ASB＝90°。
   図3：円 O(5.9,3.0) 半径2.3。A＝110°、B＝200°、C＝330°、D＝40° → ∠BAC＝∠BDC＝65°（弧BC＝130°）、∠ABD＝∠ACD＝35°（弧AD＝70°）、∠ACB＝45°、∠BAD＝100°。 */
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
  const O = [5.9, 2.9], r = 2.2;
  const f1 = mkFig('f1'), f2 = mkFig('f2'), f3 = mkFig('f3');
  const G1 = GF('f1'), G2 = GF('f2'), G3 = GF('f3');
  const nm = (p, n, c, O2) => dot(p, n, away(p, O2 || O), c || 'y');
  const A = cpt(O, r, 210), Bp = cpt(O, r, 330), P = cpt(O, r, 90), Qp = cpt(O, r, 35);
  const rho = Math.hypot(Bp[0] - A[0], 0) / (2 * Math.sin(40 * D2R));
  const Oc = [5.9, 1.8 + rho * Math.cos(40 * D2R)];
  const Rp = [Oc[0] + rho * Math.cos(15 * D2R), Oc[1] + rho * Math.sin(15 * D2R)];
  const hh = (Bp[0] - A[0]) / 2, Sp = [5.9 + hh * Math.cos(100 * D2R), 1.8 + hh * Math.sin(100 * D2R)];
  const base1 = [nm(A, 'A'), nm(Bp, 'B'), nm(P, 'P', 'p'), ln(P, A, 'p'), ln(P, Bp, 'p'), mark(P, A, Bp, 0.8, 'p'), num(P, A, Bp, 1.3, '60°', 'p', { size: 25 }), ln(A, Bp, 'w', { wd: 4 })];
  const circle1 = [circ(O, r, 'w', { d: 1.2 })];
  const withQ = [nm(Qp, 'Q', 'b'), ln(Qp, A, 'b'), ln(Qp, Bp, 'b')];
  const qMark = [mark(Qp, A, Bp, 0.8, 'b'), num(Qp, A, Bp, 1.3, '60°', 'b', { size: 25 })];
  const base2 = [circ(O, r, 'w'), nm(A, 'A'), nm(Bp, 'B'), nm(P, 'P', 'p'), ln(A, Bp, 'w', { wd: 4 }), ln(P, A, 'p', { wd: 2.6 }), ln(P, Bp, 'p', { wd: 2.6 }), mark(P, A, Bp, 0.7, 'p'), num(P, A, Bp, 1.0, '60°', 'p', { size: 25 })];
  const Rfig = [nm(Rp, 'R', 'g'), ln(Rp, A, 'g'), ln(Rp, Bp, 'g')];
  const Rmark = [mark(Rp, A, Bp, 1.6, 'g'), num(Rp, A, Bp, 2.1, '40°', 'g', { size: 25 })];
  const Sfig = [nm(Sp, 'S', 'y'), ln(Sp, A, 'y'), ln(Sp, Bp, 'y')];
  const Smark = [rt(Sp, A, Bp, 'y'), lab(Sp[0] + 0.3, Sp[1] - 0.12, '90°', 'y', { size: 25, anchor: 'start' })];
  /* 図3 */
  const O3 = [5.9, 3.0], r3 = 2.3;
  const A3 = cpt(O3, r3, 110), B3 = cpt(O3, r3, 200), C3 = cpt(O3, r3, 330), D3 = cpt(O3, r3, 40);
  const quad = [nm(A3, 'A', 'y', O3), nm(B3, 'B', 'y', O3), nm(C3, 'C', 'y', O3), nm(D3, 'D', 'y', O3), tri([A3, B3, C3, D3], 'w'), ln(A3, C3, 'g', { wd: 3 }), ln(B3, D3, 'p', { wd: 3 })];
  const eq65 = [mark(A3, B3, C3, 0.8, 'g'), num(A3, B3, C3, 1.25, '65°', 'g', { size: 25 }), mark(D3, B3, C3, 0.8, 'p'), num(D3, B3, C3, 1.25, '65°', 'p', { size: 25 })];
  const circle3 = [circ(O3, r3, 'b', { wd: 3.2, d: 1.2 })];
  const eq35 = [mark(B3, A3, D3, 0.8, 'y'), num(B3, A3, D3, 1.3, '35°', 'y', { size: 24 }), mark(C3, A3, D3, 0.8, 'y'), num(C3, A3, D3, 1.3, '35°', 'y', { size: 24 })];

  KL.lesson({ id: 'g3u6-05', unit: '中3　円', kick: '3年6章　第5時', title: '同じ角度に見える場所は、どこにあるだろう', card: '同じ角度に見える場所は、どこにあるだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、同じ角度に見える場所は、どこにあるのかを、探ります。', { title: true, point: false, ft: 'happy' }),
    B('ぼく、サッカーのシュートが、とくいだよ！ ゴールがいちばん広く見える場所から、打つんだ！', { title: true, fb: 'happy', up: true }),
    T('いいところに、目をつけましたね。ゴールの両はしを見込む角を、使って、考えましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。ゴールの両はしを、A、Bとします。点Pから見ると、∠APBは60°です。同じ60°に見える場所は、ほかに、どこにあるでしょう。', { part: '問題を読もう', ft: 'normal',
      add: [memo('めあて', '同じ角度に見える\n場所を探そう', 'y'), note('∠APB＝60°', '条件'), Object.assign(f1, { prims: [] })],
      draw: [G1(base1)] }),
    B('ゴールに近づけば、大きく見えるし、遠ざかれば、小さく見える。60°に見えるのは、Pの1か所だけだよ！', { fb: 'proud', up: true }),
    T('1か所だけでしょうか。前の時間を、思い出しましょう。A、B、Pを通る円をかくと、弧ABに対する円周角は、どれも等しくなります。', { ft: 'normal', point: false, draw: [G1(circle1)] }),
    T('この円の周上で、Pと同じ側に、点Qをとります。', { ft: 'normal', point: false, draw: [G1(withQ)] }),

    /* ---------- 問1：円周上 ---------- */
    Q('q1', T('問題です。∠AQBは、何度でしょう。', { ft: 'normal' }),
      [{ t: '30°' }, { t: '60°', ok: true }, { t: '90°' }, { t: '120°' }],
      { 3: [T('120°は、弧ABに対する中心角の大きさです。円周角は、その半分で、∠APBと同じ60°です。', { ft: 'normal' })],
        0: [B('Qは、Pより低いところだから、角も、小さくなるでしょ？', { fb: 'happy', up: true }), T('高さは、関係ありません。同じ弧ABに対する円周角は、どこでも等しく、60°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 同じ弧に対する円周角は、等しいので、∠AQB＝60°です。', { ft: 'happy', draw: [G1(qMark)] }), B('Pだけじゃなくて、Qでも、60°に見えるんだね！', { fb: 'star', up: true })],
        wrong: [T('90°では、ありません。同じ弧ABに対する円周角は、等しいので、∠AQB＝60°です。', { ft: 'normal', draw: [G1(qMark)] })] }),

    T('円周上の点は、すべて、60°に見えます。では、円の外や、円の中の点は、どうでしょう。同じ側に、点Rと点Sをとります。', { clear: true, cols: [0.34, 0.66], part: '円の外と中', ft: 'normal',
      add: [note('Rは円の外\nSは円の中', '調べる点'), Object.assign(f2, { prims: [] })],
      draw: [G2(base2, Rfig, Sfig)] }),

    /* ---------- 問2：外側 ---------- */
    Q('q2', T('問題です。円の外にある点Rから、見たとき、∠ARBは、60°と比べて、どうなるでしょう。', { ft: 'normal' }),
      [{ t: '60°より大きい' }, { t: '60°と等しい' }, { t: '決まらない' }, { t: '60°より小さい', ok: true }],
      { 1: [B('Rも、ゴールの正面のほうだから、60°でしょ？', { fb: 'happy', up: true }), T('円周上の点だけが、60°です。Rは円の外で、A、Bから遠いので、角は、60°より小さくなります。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('遠くから見ると、ゴールは、せまく見えます。円の外では、角は、60°より小さくなります。', { ft: 'normal' })],
        ok: [T('正解！ 円の外の点からは、角が、60°より小さくなります。測ると、40°です。', { ft: 'happy', draw: [G2(Rmark)] }), B('遠いと、ゴールが、小さく見えるんだね！', { fb: 'star', up: true })],
        wrong: [T('角は、はっきり決まります。円の外では、60°より小さく、この図では、40°です。', { ft: 'normal', draw: [G2(Rmark)] })] }),

    /* ---------- 問3：内側 ---------- */
    Q('q3', T('問題です。円の中にある点Sから、見たとき、∠ASBは、60°と比べて、どうなるでしょう。', { ft: 'normal' }),
      [{ t: '60°より小さい' }, { t: '60°と等しい' }, { t: '60°より大きい', ok: true }, { t: '決まらない' }],
      { 0: [B('Sは、円の中だから、せまくて、角も小さいんじゃない？', { fb: 'confused', up: true }), T('円の中は、A、Bに近づくので、ゴールが、広く見えます。角は、60°より大きくなります。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('60°になるのは、円周上の点だけです。円の中では、角は、60°より大きくなります。', { ft: 'normal' })],
        ok: [T('正解！ 円の中の点からは、角が、60°より大きくなります。測ると、90°です。', { ft: 'happy', draw: [G2(Smark)] }), B('近づくと、ゴールが、広く見えるんだね！', { fb: 'star', up: true })],
        wrong: [T('角は、はっきり決まります。円の中では、60°より大きく、この図では、90°です。', { ft: 'normal', draw: [G2(Smark)] })] }),

    T('つまり、同じ側で、60°に見える点は、この円周上にしかありません。このことを、円周角の定理の逆といいます。', { ft: 'normal', point: false,
      add: [memo('円周角の定理の逆', '2点P、Qが、直線ABの\n同じ側にあって\n∠APB＝∠AQBならば\nA、B、P、Qは同じ円周上', 'p')] }),

    T('逆の定理を、使ってみます。四角形ABCDで、AとDは、直線BCの同じ側にあります。∠BACと∠BDCは、どちらも65°です。', { clear: true, cols: [0.34, 0.66], part: '逆を使おう', ft: 'normal',
      add: [note('∠BAC＝65°\n∠BDC＝65°', '条件'), Object.assign(f3, { prims: [] })],
      draw: [G3(quad, eq65)] }),

    /* ---------- 問4：逆の利用 ---------- */
    Q('q4', T('問題です。このとき、4点A、B、C、Dについて、言えることは、どれでしょう。', { ft: 'normal' }),
      [{ t: 'AD∥BC である' }, { t: 'BCは直径である' }, { t: 'AB＝DC である' }, { t: '同じ円周上にある', ok: true }],
      { 0: [B('AとDは、同じ高さに見えるから、平行でしょ？', { fb: 'happy', up: true }), T('見た目では、決められません。AとDが、BCの同じ側で、∠BAC＝∠BDCだから、4点は、同じ円周上にあると、言えます。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('BCが直径なら、円周角は90°です。ここは65°なので、BCは直径ではありません。同じ円周上にあると、言えます。', { ft: 'normal' })],
        ok: [T('正解！ 同じ側で、∠BAC＝∠BDC。円周角の定理の逆から、4点は、同じ円周上にあります。', { ft: 'happy', draw: [G3(circle3)] }), B('角が等しいだけで、円が見つかったね！', { fb: 'star', up: true })],
        wrong: [T('AB＝DCは、言えません。言えるのは、円周角の定理の逆から、4点が、同じ円周上にあることです。', { ft: 'normal', draw: [G3(circle3)] })] }),

    T('4点が、同じ円周上にあるとわかると、前の時間に学んだ円周角の定理が、使えます。', { ft: 'normal', point: false, draw: [G3(circle3)] }),

    /* ---------- 問5：円周角の定理 ---------- */
    Q('q5', T('最後の問題です。∠ABDと、等しい角は、どれでしょう。', { ft: 'happy' }),
      [{ t: '∠ACD', ok: true }, { t: '∠ACB' }, { t: '∠BDC' }, { t: '∠BAD' }],
      { 2: [B('∠BDCは、65°と、わかっている角だから、これでしょ？', { fb: 'happy', up: true }), T('∠BDCは、弧BCに対する円周角です。∠ABDは、弧ADに対する円周角で、同じ弧の∠ACDと、等しくなります。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('∠ACBは、弧ABに対する円周角です。∠ABDと同じ弧、弧ADに対する円周角は、∠ACDです。', { ft: 'normal' })],
        ok: [T('正解！ ∠ABDも∠ACDも、弧ADに対する円周角なので、等しくなります。どちらも35°です。', { ft: 'happy', draw: [G3(eq35)] }), B('同じ弧を見ている角を、探せばいいんだね！', { fb: 'star', up: true })],
        wrong: [T('∠BADは、弧BDに対する円周角で、別の弧です。弧ADを見ている、∠ACDが、等しい角です。', { ft: 'normal', draw: [G3(eq35)] })] }),

    T('まとめます。同じ側で、同じ角度に見える点は、1つの円周上に並びます。同じ側で角が等しければ、4点が、同じ円周上にあるといえます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [memo('ポイント', '円周上の点→同じ角度\n円の外→角は小さい\n円の中→角は大きい\n同じ側で角が等しい\n→同じ円周上', 'y')] }),
    B('サッカーボールも丸いし、ねらう場所も円の上。円周角の定理の逆で、ゴールを決めるよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
