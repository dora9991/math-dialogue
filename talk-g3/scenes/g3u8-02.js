/* 中3 8章 標本調査　第2時「袋の中の玉の数を、取り出した玉から当てよう」（遊）。自作。無作為抽出の実験。
   袋：赤玉87個、白玉213個（合計300個）。python の random.Random(3)、random.sample で20個ずつ5回（取り出しては袋に戻す）。
   赤玉の数：4、9、2、8、8（合計31／100個）。1回目の並び：WWRWWWRRWWWWWWWWWRWW（赤4個）。割合：20%、45%、10%、40%、40%。
   推定：300×31÷100＝93（実際87）。1回目だけ：300×4÷20＝60。 */
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
  const seq = 'WWRWWWRRWWWWWWWWWRWW';
  const bx = i => 4.6 + 0.68 * (i % 10), by = i => (i < 10 ? 3.9 : 3.05);
  const pos = c => [...seq].map((ch, i) => (ch === c ? [bx(i), by(i)] : null)).filter(Boolean);
  const f1 = mkFig('f1');
  const G1 = GF('f1');
  const bag = [circ([2.0, 3.45], 1.45, 'w', { wd: 4 }), lab(2.0, 3.45, '袋', 'w', { size: 44 }), lab(2.0, 1.55, '赤玉と白玉', 'w', { size: 24 }), lab(2.0, 1.15, '合わせて300個', 'y', { size: 26 })];
  const balls = [{ k: 'pts', list: pos('R'), c: 'p', r: 15, d: 0.5 }, { k: 'pts', list: pos('W'), c: 'w', r: 15, d: 0.5 }, ln([3.6, 3.45], [4.05, 3.45], 'y', { arrow: true, wd: 4 }),
    lab(7.7, 2.35, '取り出した20個', 'w', { size: 26 }), lab(7.7, 1.8, '赤玉　4個', 'p', { size: 30 })];
  const trials = tbl([['回', '1', '2', '3', '4', '5'], ['赤玉の数（個）', '4', '9', '2', '8', '8'], ['赤玉の割合', '20%', '45%', '10%', '40%', '40%']], { style: 'font-size:34px; align-self:center; margin-top:20px', t: 1.0 });

  KL.lesson({ id: 'g3u8-02', unit: '中3　標本調査', kick: '3年8章　第2時', title: '袋の中の玉の数を、取り出した玉から当てよう', card: '袋の中の玉の数を、取り出した玉から当てよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、ゲームです。袋の中の玉の数を、取り出した玉から、当てましょう。', { title: true, point: false, ft: 'happy' }),
    B('ゲーム！ ぼく、玉当てなら、まかせて！ 袋ごと、のぞいちゃうよ！', { title: true, fb: 'happy', up: true }),
    T('のぞくのは、ルール違反ですよ。取り出して調べた玉だけを、ヒントにして、答えを考えましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('ルールを説明します。袋の中には、赤玉と白玉が、合わせて300個入っています。赤玉は、全部で何個あるでしょう。', { part: '玉当てチャレンジ', ft: 'normal',
      add: [memo('ルール', '①よくかき混ぜる\n②20個を取り出す\n③赤玉を数えて戻す\n④5回くり返す', 'y'), Object.assign(f1, { prims: [] })],
      draw: [G1(bag)] }),
    B('300個を、ぜんぶ、数えちゃえば、いいんじゃない？', { fb: 'happy', up: true }),
    T('全部を数えたら、ゲームになりません。標本調査で、赤玉の数を、推定します。1回目です。袋をかき混ぜて、20個を取り出します。', { ft: 'normal', point: false, draw: [G1(balls)] }),

    /* ---------- 問1：割合 ---------- */
    Q('q1', T('問題です。1回目は、20個のうち、赤玉が4個でした。赤玉の割合は、何%でしょう。', { ft: 'normal' }),
      [{ t: '80%' }, { t: '25%' }, { t: '20%', ok: true }, { t: '4%' }],
      { 3: [B('4個だから、4%でしょ？', { fb: 'happy', up: true }), T('4は、個数です。割合は、赤玉の数を、取り出した数でわって、4÷20＝[[1/5]]、つまり20%です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('25%は、4÷16と、計算した値です。わる数は、取り出した20個全部で、4÷20＝[[1/5]]、つまり20%です。', { ft: 'normal' })],
        ok: [T('正解！ 4÷20＝[[1/5]]、つまり20%です。', { ft: 'happy' }), B('割合は、全体でわるんだね！', { fb: 'star', up: true })],
        wrong: [T('80%は、白玉の割合です。赤玉は、4÷20＝[[1/5]]、つまり20%です。', { ft: 'normal' })] }),

    /* ---------- 問2：かき混ぜる理由 ---------- */
    Q('q2', T('問題です。取り出す前に、袋をよくかき混ぜるのは、なぜでしょう。', { ft: 'normal' }),
      [{ t: '玉を取り出しやすくするため' }, { t: '玉の数を増やすため' }, { t: '赤玉を見つけやすくするため' }, { t: '偏りなく、偶然で取り出すため', ok: true }],
      { 2: [B('赤玉が上にくるように、混ぜるんでしょ？', { fb: 'happy', up: true }), T('赤玉を選んで取り出すと、赤玉に偏ります。かき混ぜて、見ないで取り出すのが、無作為です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('取り出しやすさが、目的ではありません。かき混ぜる目的は、偏りなく、偶然で取り出すことです。', { ft: 'normal' })],
        ok: [T('正解！ よく混ぜると、どの玉も、同じように、取り出されやすくなります。', { ft: 'happy' }), B('偶然で選ぶのが、大切なんだね！', { fb: 'star', up: true })],
        wrong: [T('混ぜても、玉の数は、増えません。目的は、偏りなく、偶然で取り出すことです。', { ft: 'normal' })] }),

    T('同じように、5回、くり返しました。取り出した玉は、毎回、袋に戻して、よく混ぜています。結果は、こちらです。', { clear: true, cols: [0.34, 0.66], part: '5回の結果', ft: 'normal',
      add: [memo('結果', '20個ずつ、5回\n赤玉の数を数える', 'y'), trials] }),

    /* ---------- 問3：ちがう理由 ---------- */
    Q('q3', T('問題です。赤玉の数は、4個、9個、2個、8個、8個と、毎回ちがいます。なぜでしょう。', { ft: 'normal' }),
      [{ t: '玉が、毎回、入れかわるから' }, { t: '取り出す玉が、偶然で決まるから', ok: true }, { t: '数えまちがいが、あったから' }, { t: 'ホー先生が、ごまかしたから' }],
      { 3: [B('ホー先生、ちょっと、怪しいな〜！', { fb: 'confused', up: true }), T('ごまかしていませんよ。無作為に取り出すと、偶然によって、毎回少しずつ、ちがう結果になります。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('玉は、毎回、袋に戻しています。入れかわってはいません。結果がちがうのは、取り出す玉が、偶然で決まるからです。', { ft: 'normal' })],
        ok: [T('正解！ 無作為に取り出すので、玉の選ばれ方が、毎回ちがい、結果も、ちがってきます。', { ft: 'happy' }), B('毎回ちがうのが、ふつうなんだね！', { fb: 'star', up: true })],
        wrong: [T('数えまちがいでは、ありません。結果がちがうのは、取り出す玉が、偶然で決まるからです。', { ft: 'normal' })] }),

    T('5回分を、まとめます。20個×5回で、標本の大きさは100個です。赤玉は、4＋9＋2＋8＋8＝31個でした。割合は、31%です。', { ft: 'normal', point: false,
      add: [memo('5回分', '標本の大きさ　100個\n赤玉　31個\n割合　31%', 'p')] }),

    /* ---------- 問4：推定 ---------- */
    Q('q4', T('問題です。袋の300個の中の、赤玉は、およそ何個と推定できるでしょう。', { ft: 'normal' }),
      [{ t: '300個' }, { t: '100個' }, { t: '93個', ok: true }, { t: '31個' }],
      { 3: [B('赤玉は、31個、見つかったから、31個でしょ？', { fb: 'happy', up: true }), T('31個は、取り出した100個の中の数です。袋全体の300個には、300×31÷100＝93個と、推定できます。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('300個は、袋の中の玉、全部の数です。赤玉は、その一部で、割合31%を使って、93個と推定します。', { ft: 'normal' })],
        ok: [T('正解！ 標本の割合31%を、袋全体にあてはめて、300×31÷100＝93。およそ93個と、推定できます。', { ft: 'happy' }), B('割合を、全体にあてはめるんだね！', { fb: 'star', up: true })],
        wrong: [T('100個は、標本の大きさです。赤玉は、300×31÷100＝93個と、推定します。', { ft: 'normal' })] }),

    T('答え合わせです。袋の中の赤玉は、実は、87個でした。推定の93個は、ぴったりではありませんが、近い値です。', { clear: true, cols: [0.34, 0.66], part: '答え合わせ', ft: 'normal',
      add: [memo('答え合わせ', '推定　およそ93個\n実際　87個', 'y')] }),
    B('93個と87個、惜しい！ ぼく、あと6個で、ぴったりだったのに！', { fb: 'sad', up: true, fx: { b: 'sweat' } }),
    T('標本調査の結果は、このように、近い値になる推定値です。では、1回目の、20個だけで推定すると、どうなるでしょう。', { ft: 'normal', point: false }),

    /* ---------- 問5：1回だけ ---------- */
    Q('q5', T('最後の問題です。1回目の、20個だけで推定すると、赤玉は、およそ何個になるでしょう。', { ft: 'happy' }),
      [{ t: '60個', ok: true }, { t: '87個' }, { t: '93個' }, { t: '300個' }],
      { 1: [B('87個が、答えだって、教えてもらったから、87個でしょ？', { fb: 'happy', up: true }), T('87個は、実際の数です。1回目の標本から推定すると、300×4÷20＝60個になります。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('93個は、5回分、100個の標本から、推定した数です。1回目の20個だけなら、300×4÷20＝60個です。', { ft: 'normal' })],
        ok: [T('正解！ 300×4÷20＝60個です。実際の87個から、だいぶ、はなれましたね。', { ft: 'happy' }), B('1回だけだと、ずれやすいんだね！', { fb: 'surprised', up: true })],
        wrong: [T('300個は、玉全部の数です。1回目の標本の割合20%を使うと、300×4÷20＝60個です。', { ft: 'normal' })] }),

    T('まとめます。標本は、無作為に取り出します。標本の割合を、全体にあてはめて、推定します。標本が大きいほど、結果は、安定します。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [memo('ポイント', '無作為に取り出す\n標本の割合を全体に\nあてはめて推定する\n標本が大きいほど安定', 'y')] }),
    B('ぼくの推定は、93個。惜しかったけど、袋ごとのぞくより、ずっと、おもしろかったよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
