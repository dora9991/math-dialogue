/* 中3 8章 標本調査　第1時「全部を調べなくても、全体のことがわかるだろうか」（探）。自作。全数調査と標本調査。
   乾電池の寿命の検査（標本調査）／健康診断（全数調査）。全校生徒600人から50人を選んで通学時間を調べる：母集団＝全校生徒600人、標本＝50人、標本の大きさ＝50。無作為に抽出する。数値の計算はない（用語中心）。 */
(function () {
  const { T: T0, B: B0, Q, FIG, tbl } = KL;
  /* ---- 読み上げ（say）：記号・英字・読みにくい語を、かなにする。字幕と読みがちがう行にだけ say がつく ---- */
  const plainS = s => String(s).replace(/\{\{|\}\}|\*\*/g, '');
  const KA = { A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', F: 'エフ', G: 'ジー', H: 'エイチ', I: 'アイ', J: 'ジェー', K: 'ケー', L: 'エル', M: 'エム', N: 'エヌ', O: 'オー', P: 'ピー', Q: 'キュー', R: 'アール', S: 'エス', T: 'ティー', U: 'ユー', V: 'ブイ', W: 'ダブリュー', X: 'エックス', Y: 'ワイ', Z: 'ゼット' };
  const KS = { a: 'エー', b: 'ビー', c: 'シー', d: 'ディー', e: 'イー', f: 'エフ', g: 'ジー', h: 'エイチ', i: 'アイ', j: 'ジェー', k: 'ケー', l: 'エル', m: 'エム', n: 'エヌ', o: 'オー', p: 'ピー', q: 'キュー', r: 'アール', s: 'エス', t: 'ティー', u: 'ユー', v: 'ブイ', w: 'ダブリュー', x: 'エックス', y: 'ワイ', z: 'ゼット' };
  const WD = [['円周角', 'えんしゅうかく'], ['中心角', 'ちゅうしんかく'], ['弦', 'げん'], ['接線', 'せっせん'], ['接点', 'せってん'], ['作図', 'さくず'], ['無作為', 'むさくい'], ['抽出', 'ちゅうしゅつ'], ['母集団', 'ぼしゅうだん'], ['標識', 'ひょうしき'], ['全数調査', 'ぜんすうちょうさ'], ['推定', 'すいてい'], ['偏', 'かたよ']];
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
  const terms = tbl([['言葉', '意味'], ['全数調査', '対象のすべてを調べる'], ['標本調査', '一部を調べて、全体を推定する'], ['母集団', '調べたい集団の全体'], ['標本', '母集団から取り出した一部'], ['標本の大きさ', '標本にふくまれる個数']],
    { style: 'font-size:34px; align-self:center; margin-top:20px', t: 1.0 });
  const sample = tbl([['全校生徒（母集団）', '600人'], ['選んだ50人（標本）', '通学時間を調べる'], ['標本の大きさ', '{{？}}']], { style: 'font-size:38px; align-self:center; margin-top:20px', t: 1.0 });

  KL.lesson({ id: 'g3u8-01', unit: '中3　標本調査', kick: '3年8章　第1時', title: '全部を調べなくても、全体のことがわかるだろうか', card: '全部を調べなくても、全体のことがわかるだろうか', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、全部を調べなくても、全体のことがわかるのかを、考えます。', { title: true, point: false, ft: 'happy' }),
    B('ぼく、味見係なら、まかせて！ でも、味見のつもりが、いつも、ぜんぶ、食べちゃうんだ！', { title: true, fb: 'happy', up: true }),
    T('その味見が、今日のヒントです。ひと口で、全体の味を知る方法を、調べましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。学校の健康診断では、全校生徒の視力を、1人ずつ調べます。工場で作った乾電池の、長持ちの検査も、全部の電池を、調べるべきでしょうか。', { part: '問題を読もう', ft: 'normal',
      add: [memo('めあて', '全部を調べなくても\n全体のことが\nわかるだろうか', 'y'), note('健康診断の視力\n乾電池の長持ち検査', '調べるもの')] }),
    B('全部、調べないと、不安だよ！ 長持ちしない電池が、混ざっているかもしれないもん！', { fb: 'proud', up: true }),
    T('電池の寿命は、使い切って、調べます。全部を調べると、売る電池が、1つも、なくなってしまいますね。', { ft: 'sigh', fx: { t: 'sweat' }, point: false }),

    /* ---------- 問1：標本調査が適する場面 ---------- */
    Q('q1', T('問題です。標本調査が、適しているのは、どれでしょう。', { ft: 'normal' }),
      [{ t: 'クラスの出席の確認' }, { t: '入学試験の採点' }, { t: '乾電池の寿命の検査', ok: true }, { t: '健康診断の視力検査' }],
      { 0: [T('出席の確認は、全員を、確かめる必要があります。全員を調べる、全数調査です。', { ft: 'normal' })],
        3: [B('視力も、何人かだけ調べれば、十分でしょ？', { fb: 'happy', up: true }), T('健康診断は、1人ひとりの健康のために行います。だから、全員を調べる、全数調査です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 乾電池は、使い切って調べるので、一部だけを調べる、標本調査です。', { ft: 'happy' }), B('味見と、同じ考え方なんだね！', { fb: 'star', up: true })],
        wrong: [T('入学試験は、受験者全員の点数が、必要です。全員を調べる、全数調査です。', { ft: 'normal' })] }),

    T('対象のすべてを調べる調査を、全数調査といいます。一部だけを調べて、全体の様子を推測する調査を、標本調査といいます。', { clear: true, cols: [0.34, 0.66], part: '用語を覚えよう', ft: 'normal',
      add: [memo('2つの調査', '全数調査\n標本調査', 'y'), terms] }),
    T('標本調査で、調べたい集団の全体を、母集団といいます。母集団から取り出して調べた一部が、標本です。標本の個数を、標本の大きさといいます。', { ft: 'normal', point: false }),
    T('例で確かめます。ある中学校の、全校生徒600人から、50人を選んで、通学時間を調べました。', { clear: true, cols: [0.34, 0.66], part: '例で確かめよう', ft: 'normal',
      add: [memo('調査', '全校生徒600人から\n50人を選んで\n通学時間を調べる', 'y'), sample] }),

    /* ---------- 問2：母集団 ---------- */
    Q('q2', T('問題です。この調査の、母集団は、どれでしょう。', { ft: 'normal' }),
      [{ t: '選んだ50人' }, { t: '通学時間' }, { t: '50分' }, { t: '全校生徒600人', ok: true }],
      { 0: [B('選んだ50人が、調べた人だから、母集団でしょ？', { fb: 'happy', up: true }), T('選んだ50人は、標本です。母集団は、調べたい集団の全体、つまり、全校生徒600人です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('通学時間は、調べる内容です。調べたい集団の全体は、全校生徒600人で、これが母集団です。', { ft: 'normal' })],
        ok: [T('正解！ 調べたい集団の全体、全校生徒600人が、母集団です。', { ft: 'happy' }), B('標本は、そこから選んだ、50人なんだね！', { fb: 'star', up: true })],
        wrong: [T('50分は、通学時間の例です。母集団は、集団の全体で、全校生徒600人です。', { ft: 'normal' })] }),

    /* ---------- 問3：標本の大きさ ---------- */
    Q('q3', T('問題です。この調査の、標本の大きさは、いくつでしょう。', { ft: 'normal' }),
      [{ t: '50人', ok: true }, { t: '550人' }, { t: '600人' }, { t: '650人' }],
      { 2: [T('600人は、母集団の人数です。標本の大きさは、選んで調べた人数で、50人です。', { ft: 'normal' })],
        1: [B('選ばなかった人も、数えるでしょ？ 600−50で、550人だよ！', { fb: 'confused', up: true }), T('選ばなかった人は、標本に入りません。標本の大きさは、調べた50人です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 標本の大きさは、調べた人数の、50人です。', { ft: 'happy' }), B('母集団より、ずっと小さいね！', { fb: 'star', up: true })],
        wrong: [T('650人は、600人より多くなり、ありえません。標本は、母集団の一部で、50人です。', { ft: 'normal' })] }),

    T('50人を選ぶとき、特定の人に、偏ってはいけません。くじ引きのように、まったくの偶然で選ぶことを、無作為に抽出する、といいます。', { clear: true, cols: [0.34, 0.66], part: '標本の選び方', ft: 'normal',
      add: [memo('無作為に抽出', '偏りなく\n偶然で選ぶ', 'p')] }),

    /* ---------- 問4：無作為 ---------- */
    Q('q4', T('問題です。全校生徒から50人を、無作為に選ぶ方法は、どれでしょう。', { ft: 'normal' }),
      [{ t: '野球部の部員50人' }, { t: '名簿からくじ引きで選ぶ', ok: true }, { t: '朝いちばんに登校した50人' }, { t: '背の高い順の50人' }],
      { 0: [B('野球部は、元気で、すぐ集まるから、いいでしょ？', { fb: 'happy', up: true }), T('野球部の部員は、生活が、似ているかもしれません。全校生徒の代表には、なりません。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('早く登校する人は、学校の近くに住む人に、偏るかもしれません。偶然で選んだとは、言えません。', { ft: 'normal' })],
        ok: [T('正解！ 名簿からくじ引きで選べば、だれが選ばれるかは、偶然で決まります。', { ft: 'happy' }), B('くじ引きなら、えこひいきが、ないね！', { fb: 'star', up: true })],
        wrong: [T('背の高い順に選ぶと、3年生ばかりに、偏ります。無作為ではありません。', { ft: 'normal' })] }),

    T('無作為に選んだ標本の結果から、母集団の様子を、おおよそ推定できます。ただし、結果は、母集団と、ぴったり同じとは、限りません。', { ft: 'normal', point: false }),

    /* ---------- 問5：長所 ---------- */
    Q('q5', T('最後の問題です。標本調査の、長所は、どれでしょう。', { ft: 'happy' }),
      [{ t: '必ず母集団と同じ結果' }, { t: '全員の結果がわかる' }, { t: '費用や時間を、少なくできる', ok: true }, { t: '偏りが絶対に出ない' }],
      { 0: [B('必ず同じ結果なら、すごく便利だね！', { fb: 'happy', up: true }), T('必ず同じとは、限りません。標本調査の結果は、母集団の値に近いと考えられる、推定値です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('全員の結果がわかるのは、全数調査です。標本調査は、一部だけを調べるので、費用や時間が少なくてすみます。', { ft: 'normal' })],
        ok: [T('正解！ 一部だけを調べるので、費用や時間を、少なくできます。', { ft: 'happy' }), B('電池も、売る分が、残るもんね！', { fb: 'star', up: true })],
        wrong: [T('選び方によっては、偏りが出ることも、あります。だから、無作為に選ぶことが、大切です。', { ft: 'normal' })] }),

    T('まとめます。全数調査は全部を調べ、標本調査は一部を調べて、全体を推定します。標本は、無作為に選ぶことが、大切です。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [memo('ポイント', '全数調査＝全部を調べる\n標本調査＝一部から推定\n標本は無作為に抽出', 'y')] }),
    B('味見は、ひと口だけ。ぜんぶ食べたら、全数調査になっちゃうもんね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
