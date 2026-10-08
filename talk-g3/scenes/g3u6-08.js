/* 中3 6章 円　第8時「「円」で学んだことを、整理して確かめよう」（確・単元のまとめ）。自作。
   Q1：中心角148° → 円周角74°。Q2（図1）：円 O(5.9,3.0) 半径2.4、B＝300°、C＝14°（弧BC＝74°）、A＝150°、D＝220° → ∠BAC＝∠BDC＝37°。
   Q3（図2）：AB が直径（A＝180°、B＝0°）、C＝52° → ∠CAB＝26°、∠ACB＝90°、∠ABC＝64°。
   Q4（図3）：C＝250°、D＝344°（弧CD＝94°）、A＝90°、B＝150°（CD の同じ側）→ ∠CAD＝∠CBD＝47° → 4点は同じ円周上（逆）。AD と BC は平行でない（傾き −1.32 と −2.75）。
   Q5（図4）：弦 AB、CD が P で交わる。PA＝9、PB＝2、PC＝3、PD＝6（∠APC＝60°）。△PAC∽△PDB：PA：PD＝PC：PB＝3：2。円の半径6.658cm → 図は縮尺0.3604。 */
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
  const nm = (p, n, c) => dot(p, n, away(p, O), c || 'y');
  /* 図1 */
  const A1 = cpt(O, r, 150), B1 = cpt(O, r, 300), C1 = cpt(O, r, 14), D1 = cpt(O, r, 220);
  const fig1 = [circ(O, r, 'w'), nm(A1, 'A'), nm(B1, 'B'), nm(C1, 'C'), nm(D1, 'D', 'p'), ln(A1, B1, 'y'), ln(A1, C1, 'y'), ln(D1, B1, 'p'), ln(D1, C1, 'p'),
    mark(A1, B1, C1, 0.7, 'y'), num(A1, B1, C1, 1.1, '37°', 'y', { size: 25 }), mark(D1, B1, C1, 0.7, 'p'), num(D1, B1, C1, 1.1, 'x', 'p')];
  /* 図2 */
  const A2 = cpt(O, r, 180), B2 = cpt(O, r, 0), C2 = cpt(O, r, 52);
  const fig2 = [circ(O, r, 'w'), nm(A2, 'A'), nm(B2, 'B'), nm(C2, 'C'), dot(O, 'O', [0, -1], 'w', { off: 24, r: 4.5 }), ln(A2, B2, 'w'), ln(A2, C2, 'y'), ln(B2, C2, 'y'),
    mark(A2, B2, C2, 0.8, 'p'), num(A2, B2, C2, 1.3, '26°', 'p', { size: 25 }), mark(B2, A2, C2, 0.8, 'b'), num(B2, A2, C2, 1.3, 'x', 'b')];
  const rtC = [rt(C2, A2, B2, 'g')];
  /* 図3 */
  const A3 = cpt(O, r, 90), B3 = cpt(O, r, 150), C3 = cpt(O, r, 250), D3 = cpt(O, r, 344);
  const fig3 = [nm(A3, 'A'), nm(B3, 'B'), nm(C3, 'C'), nm(D3, 'D'), ln(A3, C3, 'y'), ln(A3, D3, 'y'), ln(B3, C3, 'p'), ln(B3, D3, 'p'), ln(C3, D3, 'w'),
    mark(A3, C3, D3, 0.8, 'y'), num(A3, C3, D3, 1.3, '47°', 'y', { size: 25 }), mark(B3, C3, D3, 0.8, 'p'), num(B3, C3, D3, 1.3, '47°', 'p', { size: 25 })];
  const circle3 = [circ(O, r, 'b', { wd: 3.2, d: 1.2 })];
  /* 図4 */
  const sc = r / 6.6583, cc = [-3.5, -13 * Math.sqrt(3) / 6];
  const rho = 38 * D2R, rot = p => [p[0] * Math.cos(rho) - p[1] * Math.sin(rho), p[0] * Math.sin(rho) + p[1] * Math.cos(rho)], ccr = rot(cc);
  const F = p => { const q = rot(p); return [5.9 + sc * (q[0] - ccr[0]), 3.0 + sc * (q[1] - ccr[1])]; };
  const A4 = F([-9, 0]), B4 = F([2, 0]), C4 = F([-1.5, 3 * Math.sin(Math.PI / 3)]), D4 = F([3, -6 * Math.sin(Math.PI / 3)]), P4 = F([0, 0]);
  const fig4 = [circ(O, r, 'w'), nm(A4, 'A'), nm(B4, 'B'), nm(C4, 'C'), nm(D4, 'D'), dot(P4, 'P', [0.2, 1], 'w', { off: 24, r: 5 }), ln(A4, B4, 'w'), ln(C4, D4, 'w'), ln(A4, C4, 'y', { wd: 3 }), ln(D4, B4, 'p', { wd: 3 })];

  KL.lesson({ id: 'g3u6-08', unit: '中3　円', kick: '3年6章　第8時', title: '「円」で学んだことを、整理して確かめよう', card: '「円」で学んだことを、整理して確かめよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、円の章の、まとめです。円周角の定理から、相似まで、5つの問題で、確かめましょう。', { title: true, point: false, ft: 'happy' }),
    B('ぼく、円なら、まんまるだから、全部、まるごと、覚えてるよ！ 早押しボタンも、持ってきたよ！', { title: true, fb: 'proud', up: true }),
    T('頼もしいですね。でも、ボタンを押す前に、よく考えて、答えましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('第1問は、円周角と、中心角の関係です。この章でいちばん大切な、円周角の定理を、使います。', { part: '第1問：円周角の定理', ft: 'normal',
      add: [memo('円周角の定理', '円周角は、同じ弧に対する\n中心角の[[1/2]]', 'y')] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。弧ABに対する中心角が148°のとき、同じ弧に対する円周角は、何度でしょう。', { ft: 'normal' }),
      [{ t: '37°' }, { t: '74°', ok: true }, { t: '148°' }, { t: '296°' }],
      { 2: [B('同じ弧の角だから、同じ、148°だよ！ ピンポーン！', { fb: 'happy', up: true }), T('円周角は、中心角と同じではありません。中心角の半分で、148°÷2＝74°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('296°は、中心角を2倍にした数です。円周角は、中心角の半分なので、148°÷2＝74°です。', { ft: 'normal' })],
        ok: [T('正解！ 円周角は、中心角の半分。148°÷2＝74°です。', { ft: 'happy' }), B('半分にするだけ！ かんたんだね！', { fb: 'star', up: true })],
        wrong: [T('37°は、半分の、さらに半分です。半分にするのは1回だけで、148°÷2＝74°です。', { ft: 'normal' })] }),

    T('第2問は、同じ弧に対する円周角です。円周上に、4点A、B、C、Dがあります。∠BAC＝37°です。', { clear: true, cols: [0.34, 0.66], part: '第2問：同じ弧', ft: 'normal',
      add: [memo('同じ弧', '同じ弧に対する円周角は\n等しい', 'y'), note('∠BAC＝37°\n∠BDC＝x', '問題'), Object.assign(f1, { prims: [] })],
      draw: [G1(fig1)] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。∠BDCは、何度でしょう。', { ft: 'normal' }),
      [{ t: '37°', ok: true }, { t: '53°' }, { t: '74°' }, { t: '143°' }],
      { 2: [B('弧BCの中心角と同じで、74°でしょ？', { fb: 'happy', up: true }), T('74°は、弧BCに対する中心角です。∠BDCは、円周角なので、∠BACと同じ、37°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('143°は、180°−37°の数です。同じ弧に対する円周角は、等しいので、∠BDC＝37°です。', { ft: 'normal' })],
        ok: [T('正解！ ∠BACも∠BDCも、弧BCに対する円周角なので、等しくなります。', { ft: 'happy' }), B('同じ弧を見ていれば、同じ角だね！', { fb: 'star', up: true })],
        wrong: [T('53°は、90°−37°の数です。ここでは、半円は関係ありません。同じ弧の円周角で、37°です。', { ft: 'normal' })] }),

    T('第3問は、半円の弧です。ABは、円の直径です。∠CAB＝26°とします。', { clear: true, cols: [0.34, 0.66], part: '第3問：半円の弧', ft: 'normal',
      add: [memo('半円の弧', '半円の弧に対する円周角は\n90°', 'y'), note('∠CAB＝26°\n∠ABC＝x', '問題'), Object.assign(f2, { prims: [] })],
      draw: [G2(fig2)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。∠ABCは、何度でしょう。', { ft: 'normal' }),
      [{ t: '26°' }, { t: '52°' }, { t: '64°', ok: true }, { t: '116°' }],
      { 0: [B('△ABCは、二等辺三角形みたいだから、∠ABCも、26°でしょ？', { fb: 'happy', up: true }), T('二等辺三角形とは、かぎりません。∠ACB＝90°なので、∠ABC＝180°−90°−26°＝64°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('52°は、26°を2倍した数です。2倍する理由は、ありません。180°−90°−26°＝64°です。', { ft: 'normal' })],
        ok: [T('正解！ ∠ACB＝90°なので、∠ABC＝180°−90°−26°＝64°です。', { ft: 'happy', draw: [G2(rtC)] }), B('半円の直角を、見つけられたよ！', { fb: 'star', up: true })],
        wrong: [T('116°は、90°＋26°の数です。足すのではなく、180°から、90°と26°を、ひきます。64°です。', { ft: 'normal', draw: [G2(rtC)] })] }),

    T('第4問は、円周角の定理の逆です。A、Bは、直線CDの同じ側にあります。∠CADと∠CBDは、どちらも47°です。', { clear: true, cols: [0.34, 0.66], part: '第4問：定理の逆', ft: 'normal',
      add: [memo('定理の逆', '同じ側で、角が等しい\n→同じ円周上', 'y'), note('∠CAD＝47°\n∠CBD＝47°', '条件'), Object.assign(f3, { prims: [] })],
      draw: [G3(fig3)] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。このとき、4点A、B、C、Dについて、言えることは、どれでしょう。', { ft: 'normal' }),
      [{ t: 'AD∥BC である' }, { t: 'CDは直径である' }, { t: '△ABCは二等辺三角形' }, { t: '4点は同じ円周上にある', ok: true }],
      { 0: [B('ADとBCは、ならんでいるように、見えるから、平行だよ！', { fb: 'happy', up: true }), T('見た目では、決められません。同じ側で、∠CAD＝∠CBDなので、言えるのは、4点が、同じ円周上にあることです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('CDが直径なら、円周角は90°です。ここは47°なので、直径ではありません。言えるのは、同じ円周上にあることです。', { ft: 'normal' })],
        ok: [T('正解！ 同じ側で、角が等しいので、円周角の定理の逆から、4点は、同じ円周上にあります。', { ft: 'happy', draw: [G3(circle3)] }), B('角が等しいだけで、円ができたね！', { fb: 'star', up: true })],
        wrong: [T('△ABCが二等辺三角形とは、言えません。言えるのは、円周角の定理の逆から、4点が、同じ円周上にあることです。', { ft: 'normal', draw: [G3(circle3)] })] }),

    T('第5問は、円の中の、相似です。弦ABと弦CDが、点Pで交わり、△PAC∽△PDBです。PA＝9cm、PC＝3cm、PD＝6cmです。', { clear: true, cols: [0.34, 0.66], part: '第5問：円と相似', ft: 'normal',
      add: [memo('円と相似', '対頂角は等しい\n同じ弧の円周角は等しい\n→△PAC∽△PDB', 'y'), note('PA＝9cm\nPC＝3cm\nPD＝6cm\nPB＝？', '長さ'), Object.assign(f4, { prims: [] })],
      draw: [G4(fig4)] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('最後の問題です。PBの長さは、何cmでしょう。PAとPD、PCとPBが、対応します。', { ft: 'happy' }),
      [{ t: '2cm', ok: true }, { t: '[[9/2]]cm' }, { t: '6cm' }, { t: '18cm' }],
      { 1: [B('PA：PD＝PB：PC で、9：6＝PB：3 だから、[[9/2]]cmだよ！', { fb: 'happy', up: true }), T('対応する辺を、入れかえています。PAとPD、PCとPBが対応するので、9：6＝3：PBです。PBは、2cmです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('18cmは、9：3＝PB：6 と、対応を、まちがえた答えです。9：6＝3：PB を解くと、2cmです。', { ft: 'normal' })],
        ok: [T('正解！ PA：PD＝PC：PB より、9：6＝3：PB。9×PB＝6×3、PB＝2cmです。', { ft: 'happy' }), B('相似比3：2を、使ったんだね！', { fb: 'star', up: true })],
        wrong: [T('6cmは、PDの長さです。9：6＝3：PB を解いて、PBは、2cmです。', { ft: 'normal' })] }),

    T('接線の作図も、思い出しましょう。円の外の点Pから、OPを直径とする円をかいて、円Oとの交点を、Pと結びます。半円の弧の円周角は90°なので、接線になるのでしたね。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [memo('円のまとめ', '①円周角＝中心角の[[1/2]]\n②同じ弧の円周角は等しい\n③半円の弧の円周角は90°\n④逆：同じ側で角が等しい\n　→同じ円周上', 'y'), memo('利用', '⑤OPを直径とする円で接線\n⑥弦が交わる→相似', 'p')] }),
    B('円の勉強、ぜんぶ、まるごと、覚えたよ！ ピンポーン！ ……あれ、ボタンは、押さなくてもいいの？', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
