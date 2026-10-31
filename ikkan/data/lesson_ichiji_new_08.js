/* 一次関数（新しい形） 第8時：x の変域から、y の変域を求めよう。 元：lesson_ichiji_08.js（授業ナビ ichiji の第8時）を、次のように組みかえた。
   ・ワークシートは A4 1枚（約12分）：今日の問い＝y＝2x−1 の、x が −1 以上 3 以下の部分のグラフから、y の範囲を考える（数・式は全部印刷。座標平面は白紙で、解答のときだけ赤で線分と両はしの点）。
     個人3分 → ペア3分 → ことば（変域・ふくむ・ふくまない・線分）→ 例題（y＝−2x+5、−1≦x≦3。座標平面つき）。例題の答えは、「右下がりだから…」のような一般化を書かず、両はしの値だけにした。
   ・演習プリントは表裏：表＝確かめる 2問（正の傾き・負の傾き）・使ってみる 4問（端をふくまない／水そう／a を求める／y の変域から x の変域）／
     裏＝ひろげる（元の考えよう：x の変域 −2≦x≦4 で、a＝2、[[1/2]]、−1、−3 の表をうめて、a と y の変域の関係を見つける。答えなし）・チャレンジ★★（元の入試（8）：差が 10 になる a。ヒントカードつき）。
   ・元の標準（3）（グラフをかく）は、表の紙面に座標平面が入らないので、演習プリントからはぬいた（グラフをかく活動は、ワークシートの今日の問い・例題で行う）。元の入試（7）の②（y の変域から x の変域）は、使ってみる（6）にした。
   ・考えようの答え（a が正か負かで端がかわること、変域の幅 |a|×6）は、どこにも書かない。ヒントカード・チャレンジの答えも、a の正負で分ける言い方を避け、2つの式を計算するだけにした。
   ・checks：問題の文（画面）から式と x の範囲を取り出し、x を細かく動かして y の最大・最小を調べ直した（両はしの値でなく、全体を走査）。答えの文の変域・途中の「x＝… のとき y＝…」と照らす。
     端をふくむか（≦・＜）は、問題の文から読みとる。(5)(6)(8) は a や x を細かい間かくで走査して、答えがただ1つ（（8）は2つ）になることを確かめた。元の数値・答えは、まちがいがなかった（変えていない）。
   検算：node tools/verify.cjs ichiji_new-08　／　見た目：node tools/check.cjs <出力先> ichiji_new-08 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, CO } = IK.b;
  const J = JSON.stringify;

  /* 座標平面 CO の字（目もりの数字・点の名前・式）に、白いふちをつけて、線の上に重ねて出す。
     解答のときだけ出る赤い字（ansx の中）は、そのまま ansx の中に残す（生徒用の紙には出ない）。 */
  const COX = o => {
    const base = CO(o), f = base.svg, re = /<text\b[^>]*>[\s\S]*?<\/text>/g;
    const halo = t => t.replace(/^<text /, '<text stroke="#fff" stroke-width="1.1" stroke-linejoin="round" paint-order="stroke" ');
    return Object.assign({}, base, {
      svg: (W, H, h) => {
        const s = f(W, H, h), gi = s.indexOf('<g class="ansx">'), head = gi < 0 ? s : s.slice(0, gi), tail = gi < 0 ? '' : s.slice(gi);
        return head.replace(re, '') + tail.replace(re, halo) + (head.match(re) || []).map(halo).join('');
      }
    });
  };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     EV：画面に出す式の書き方（[[A/B]]・×・−）のまま、x に数を入れて計算する　ab：「y＝…」から [傾き, 切片]　nn：「−1」→ −1
     probA：画面の文「y＝… で、x の変域が p≦x≦q」を取り出す　probB：「y＝…　（p≦x≦q）」を取り出す　rng：答えの文の「p≦y≦q」を取り出す
     calc：式と x の範囲から、y の範囲を計算する（傾きが負なら大小がいれかわる。端をふくむかも引きつぐ）
     sweep：x を p から q まで 4000 等分して、y の最小・最大を調べる（両はしの値を使わない、別のやり方）
     ptsOK：答えの文の「x＝p のとき y＝q」が、式で成り立つか　arith：文字のない「…＝…」が計算として正しいか */
  const EV = (s, v) => {
    let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))');
    t = t.replace(/([a-z])\^(\d)/g, '($1**$2)').replace(/([0-9a-z)])(?=[a-z(])/g, '$1*');
    const ks = [...new Set(t.match(/[a-z]/g) || [])];
    return new Function(...ks, 'return ' + t)(...ks.map(k => (v && k in v ? v[k] : 1)));
  };
  const ab = eq => { const r = String(eq).replace(/^y＝/, ''), f = x => EV(r, { x }); return [f(1) - f(0), f(0)]; };
  const nn = s => +String(s).replace('−', '-');
  const strip = t => String(t).replace(/\{\{|\}\}/g, '');
  const probA = t => [...strip(t).matchAll(/(y＝[^\s　で、]+) で、x の変域が (−?\d+)(≦|＜)x(≦|＜)(−?\d+)/g)].map(m => ({ eq: m[1], lo: nn(m[2]), lop: m[3], hip: m[4], hi: nn(m[5]) }));
  const probB = t => [...strip(t).matchAll(/(y＝[^\s　（）]+)[　\s]*（(−?\d+)(≦|＜)x(≦|＜)(−?\d+)）/g)].map(m => ({ eq: m[1], lo: nn(m[2]), lop: m[3], hip: m[4], hi: nn(m[5]) }));
  const rng = t => [...String(t).matchAll(/(−?\d+)(≦|＜)y(≦|＜)(−?\d+)/g)].map(m => ({ lo: nn(m[1]), lop: m[2], hip: m[3], hi: nn(m[4]) }));
  const calc = p => { const a = ab(p.eq)[0], f = x => ab(p.eq)[0] * x + ab(p.eq)[1]; return a > 0 ? { lo: f(p.lo), lop: p.lop, hip: p.hip, hi: f(p.hi) } : { lo: f(p.hi), lop: p.hip, hip: p.lop, hi: f(p.lo) }; };
  const same = (r, c) => near(r.lo, c.lo) && near(r.hi, c.hi) && r.lop === c.lop && r.hip === c.hip;
  const sweep = p => { const r = p.eq.replace(/^y＝/, ''); let mn = Infinity, mx = -Infinity; for (let i = 0; i <= 4000; i++) { const y = EV(r, { x: p.lo + (p.hi - p.lo) * i / 4000 }); mn = Math.min(mn, y); mx = Math.max(mx, y); } return { lo: mn, hi: mx }; };
  const ptsOK = (eq, t) => { const r = eq.replace(/^y＝/, ''), m = [...String(t).matchAll(/x＝(−?\d+) のとき y＝(−?\d+)/g)]; return m.length > 0 && m.every(q => near(EV(r, { x: nn(q[1]) }), nn(q[2]))); };
  const arith = t => String(t).replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝') && !/[a-z]/.test(u)).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || p.map(s => EV(s, {})).every(v => near(v, EV(p[0], {}))); });
  const LIB = 'const EV = ' + EV + '; const ab = ' + ab + '; const nn = ' + nn + '; const strip = ' + strip + '; const probA = ' + probA + '; const probB = ' + probB + '; const rng = ' + rng + '; const calc = ' + calc + '; const same = ' + same + '; const sweep = ' + sweep + '; const ptsOK = ' + ptsOK + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const TXT = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'text' || b.type === 'kadai') o.push(b.text); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const blank = n => Array.from({ length: n }, () => '');
  const mn = n => String(n).replace('-', '−');
  // 問題の文（画面）を、1つのデータから作る
  const prA = (d) => '一次関数 ' + d.eq + ' で、x の変域が ' + mn(d.lo) + (d.lop || '≦') + 'x' + (d.hip || '≦') + mn(d.hi) + ' のとき、y の変域を求めよう。';
  const prB = (d) => d.eq + '　（' + mn(d.lo) + (d.lop || '≦') + 'x' + (d.hip || '≦') + mn(d.hi) + '）';

  /* ---------------- 問題のデータ ---------------- */
  // 今日の問い：y＝2x−1（−1≦x≦3）→ −3≦y≦5　／　例題：y＝−2x+5（−1≦x≦3）→ −1≦y≦7
  const L1 = { eq: 'y＝2x−1', a: 2, b: -1, lo: -1, hi: 3, y: '−3≦y≦5' };
  const L2 = { eq: 'y＝−2x+5', a: -2, b: 5, lo: -1, hi: 3, y: '−1≦y≦7' };
  const WIN1 = { xmin: -2, xmax: 4, ymin: -4, ymax: 6 }, WIN2 = { xmin: -2, xmax: 4, ymin: -3, ymax: 8 };
  const T_L1 = '（例）x＝−1 のとき y＝−3\nx＝3 のとき y＝5\n2点 (−1, −3)、(3, 5)\nを結ぶ線分だから\n−3≦y≦5';
  const T_L2 = 'x＝−1 のとき y＝7\nx＝3 のとき y＝−1\n線分の両はしは\n(−1, 7)、(3, −1)\n小さい数を左に書く\n−1≦y≦7';
  const planeTask = COX(Object.assign({}, WIN1, {
    lines: [{ a: L1.a, b: L1.b, from: L1.lo, to: L1.hi }],
    points: [{ x: -1, y: -3, text: '(−1, −3)', at: [-1.2, -3.6], anchor: 'end' }, { x: 3, y: 5, text: '(3, 5)', at: [3.2, 5.4], anchor: 'start' }]
  }));
  const planeEx = COX(Object.assign({}, WIN2, {
    lines: [{ a: L2.a, b: L2.b, from: L2.lo, to: L2.hi }],
    points: [{ x: -1, y: 7, text: '(−1, 7)', at: [-1.2, 7.3], anchor: 'end' }, { x: 3, y: -1, text: '(3, −1)', at: [3.2, -1.7], anchor: 'start' }]
  }));
  // 考えよう（答えは載せない。checks だけ）：x の変域 −2≦x≦4。a＝2、[[1/2]]、−1、−3
  const TH = ['y＝2x+1', 'y＝[[1/2]]x−1', 'y＝−x+2', 'y＝−3x'], THX = [-2, 4];
  // 確かめる（1）（2）、使ってみる（3）
  const D1 = { eq: 'y＝2x+3', lo: 0, hi: 5, y: '3≦y≦13', s: 'x＝0 のとき y＝3\nx＝5 のとき y＝13\n3≦y≦13' };
  const D2 = { eq: 'y＝−x+6', lo: 1, hi: 5, y: '1≦y≦5', s: 'x＝1 のとき y＝5\nx＝5 のとき y＝1\n1≦y≦5' };
  const D3 = { eq: 'y＝−x+3', lo: 1, hi: 4, lop: '≦', hip: '＜', y: '−1＜y≦2', s: 'x＝1 のとき y＝2\nx＝4 のとき y＝−1\n　（4 はふくまない）\n−1＜y≦2' };
  // （4）水そう：y＝−2x+30、0≦x≦15、0≦y≦30　（5）y＝ax−2（a＞0）、1≦x≦4 で 1≦y≦10 → a＝3　（6）y＝−[[3/4]]x+5、−1≦y≦5 → 0≦x≦8
  const D4 = { a: -2, b: 30, xr: '0≦x≦15', yr: '0≦y≦30' };
  const D5 = { a: 3, b: -2, lo: 1, hi: 4, ylo: 1, yhi: 10 };
  const D6 = { eq: 'y＝−[[3/4]]x+5', ylo: -1, yhi: 5, xr: '0≦x≦8' };
  // （8）y＝ax+2、−2≦x≦3、最大値−最小値＝10 → a＝2、−2
  const D8 = { b: 2, lo: -2, hi: 3, diff: 10, as: [2, -2] };
  // 小テスト
  const Q = [
    { eq: 'y＝3x−4', lo: 1, hi: 3, pt: 2, y: '−1≦y≦5', s: 'x＝1 のとき y＝−1\nx＝3 のとき y＝5\n−1≦y≦5' },
    { eq: 'y＝−x+8', lo: 2, hi: 6, pt: 3, y: '2≦y≦6', s: 'x＝2 のとき y＝6\nx＝6 のとき y＝2\n2≦y≦6' },
    { eq: 'y＝−[[1/2]]x+1', lo: -4, hi: 2, pt: 3, y: '0≦y≦3', s: 'x＝−4 のとき y＝3\nx＝2 のとき y＝0\n0≦y≦3' },
    { eq: 'y＝2x−1', lo: 0, hi: 3, lop: '≦', hip: '＜', pt: 2, y: '−1≦y＜5', s: 'x＝0 のとき y＝−1\nx＝3 のとき y＝5（ふくまない）\n−1≦y＜5' }
  ];
  const QC = { b: 3, lo: -2, hi: 4, ylo: -5, yhi: 7, a: -2 };

  const DEF = {
    unit: 'ichiji_new', unitName: '一次関数（新しい形）', form: 'new', no: '第8時', title: 'x の変域から、y の変域を求めよう',
    summary: 'x の変域があると、一次関数のグラフは線分になる。両はしの点の y 座標から、y の変域を求める。考えようは、a の値と、y の変域の関係。',
    head: '一次関数　第8時',
    pitch: 8, dots: true,
    checks: [],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('x の変域から、y の変域を求めよう'),
      K('今日の問い', '一次関数 y＝2x−1 で、x の値が −1 以上 3 以下のとき、y の値は、どんな範囲の値をとるだろう。右の図にグラフをかいて、考えよう。', 2),
      C2([
        T('①', '自分の考え（3分）　y の範囲を書こう。', 1),
        B(5, T_L1),
        T('②', 'ペアの考え（3分）　ちがう考えを書こう。', 2),
        B(3, '')
      ], [F(11, planeTask)], '3:2'),
      G(1),
      WD('x、y のとりうる範囲を{{変域}}という。\n−1≦x≦3 は、−1 も 3 も{{ふくむ}}。\n−1＜x≦3 は、−1 を{{ふくまない}}。\n変域があるとき、グラフは{{線分}}。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '一次関数 y＝−{{2}}x+{{5}} で、x の変域が {{−1}}≦x≦{{3}} のとき、y の変域を求めよう。右の図に、グラフもかこう。', 4),
        B(6, T_L2)
      ], [F(10, planeEx)], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① x のとりうる値の範囲を、x の{{変域}}という。\n② x の変域があるとき、一次関数のグラフは{{線分}}になる。\n③ y の変域は、{{両はし}}の点の y 座標を求め、{{小さい}}数を左に書く。\n④ −2＜x≦3 は、x が −2 より大きく 3 以下。−2 は{{ふくまない}}。', 4, { label: 'ことば' }),
      C2([T('（1）', prA(D1), 3), B(3, D1.s)], [T('（2）', prA(D2), 3), B(3, D2.s)], '1:1'),
      MA('【説明】（1）の y の変域を、「両はし」と「代入」を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '変域に気をつけて、求めよう。'),
      C2([
        T('（3）', prA(D3), 4),
        B(4, D3.s)
      ], [
        T('（4）', '高さ 30cm の水そうに、水がいっぱい入っている。水面は 1分間に 2cm ずつ下がる。水がなくなるまでの、x分後の水面の高さ y cm について、x の変域と y の変域を求めよう。', 5),
        B(3, 'y＝−2x+30\n0＝−2x+30 より x＝15\n' + D4.xr + '、' + D4.yr)
      ], '1:1'),
      C2([
        T('（5）', '一次関数 y＝ax−2（a＞0）で、x の変域が 1≦x≦4 のとき、y の変域は 1≦y≦10 である。a の値を求めよう。', 4),
        B(4, 'x＝1 のとき y＝1\n1＝a−2 より a＝3\n確かめ　4×3−2＝10')
      ], [
        T('（6）', '一次関数 ' + D6.eq + ' で、y の変域が −1≦y≦5 のとき、x の変域を求めよう。', 4),
        B(4, 'y＝5 のとき x＝0\ny＝−1 のとき x＝8\n' + D6.xr)
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：a の値と、y の変域の関係を見つけよう。'),
      T('（7）', '一次関数 y＝ax+b で、x の変域が −2≦x≦4 のとき、y の変域は、a の値によって、どう変わるだろう。表をうめて、調べよう。', 2),
      TB('一次関数', TH, [['x＝−2 のとき y', blank(4)], ['x＝4 のとき y', blank(4)], ['y の変域', blank(4)]], { hw: 34 }),
      C2([
        T('', '気づいたこと', 1),
        B(7, '')
      ], [
        T('', 'どんな一次関数でも使える、y の変域の求め方を、まとめよう。', 2),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '一次関数 y＝ax+2 で、x の変域が −2≦x≦3 のとき、y の最大値と最小値の差が 10 になった。a の値をすべて求めよう。', 6),
        B(7, 'x＝−2 で y＝−2a+2\nx＝3 で y＝3a+2\n3a+2 が大きいとき\n　5a＝10　a＝2\n−2a+2 が大きいとき\n　−5a＝10　a＝−2\na＝2、−2')
      ], [
        MA('① x＝−2 と x＝3 のとき、y を a の式で表してみよう。\n② 最大値と最小値の差が 10 になるのは、どんなときかな。（7）で気づいたことも使えないかな。', 8, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('', '次の一次関数について、x の変域が（　）の中のときの、y の変域を求めよう。', 1),
      T('（1）', prB(Q[0]) + '　（' + Q[0].pt + '点）', 1),
      B(3, Q[0].s),
      T('（2）', prB(Q[1]) + '　（' + Q[1].pt + '点）', 1),
      B(3, Q[1].s),
      T('（3）', prB(Q[2]) + '　（' + Q[2].pt + '点）', 1),
      B(3, Q[2].s),
      T('（4）', prB(Q[3]) + '　（' + Q[3].pt + '点）', 1),
      B(3, Q[3].s),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '一次関数 y＝ax+3 で、x の変域が −2≦x≦4 のとき、y の変域は −5≦y≦7 である。a を求めよう。', 2),
      B(7, 'a＞0 のとき　x＝−2 で最小\n　−2a+3＝−5 より a＝4\n　x＝4 のとき 4×4+3＝19　7 にならない\na＜0 のとき　x＝−2 で最大\n　−2a+3＝7 より a＝−2\n　x＝4 のとき −2×4+3＝−5　合う\na＝−2')
    ]
  };

  // ---------------- 検算：画面の問題の文と、答えの文から、独立に確かめる ----------------
  const A_WS = ANS(DEF.ws), A_DR = ANS(DEF.dr), A_QZ = ANS(DEF.qz);
  const T_WS = TXT(DEF.ws), T_DR = TXT(DEF.dr), T_QZ = TXT(DEF.qz);
  const push = (label, body) => DEF.checks.push(chk(label, body));
  // 今日の問い・例題：画面の文（式と x の範囲）から、x を動かして y の範囲を調べ直し、答えの文・図の点と照らす。例題は傾きが負（大小がいれかわる）
  push('第8時 今日の問い・例題', `const L = [${J(L1)}, ${J(L2)}], T0 = ${J(T_WS[0])}, T1 = ${J(T_WS.find(t => t.includes('{{2}}x+{{5}}')))}, A = [${J(A_WS[0])}, ${J(A_WS[1])}]; const P1 = probA(T1); const t0 = /y＝2x−1 で、x の値が −1 以上 3 以下/.test(T0); return t0 && P1.length === 1 && P1[0].eq === L[1].eq && P1[0].lo === -1 && P1[0].hi === 3 && L.every((l, i) => { const p = i === 0 ? { eq: l.eq, lo: -1, hi: 3 } : P1[0]; const s = sweep(p), r = rng(A[i]); return near(ab(l.eq)[0], l.a) && near(ab(l.eq)[1], l.b) && r.length === 1 && near(r[0].lo, s.lo) && near(r[0].hi, s.hi) && r[0].lop === '≦' && r[0].hip === '≦' && ptsOK(l.eq, A[i].replace(/\\n/g, ' ')); }) && near(sweep({ eq: L[0].eq, lo: -1, hi: 3 }).lo, -3) && near(sweep({ eq: L[0].eq, lo: -1, hi: 3 }).hi, 5) && near(sweep(P1[0]).lo, -1) && near(sweep(P1[0]).hi, 7) && L[0].a > 0 && L[1].a < 0;`);
  // 座標平面（−2≦x≦4、−4≦y≦6 と −3≦y≦8）に、両はしの点（−1, −3)(3, 5)、(−1, 7)(3, −1) が入る。赤い線分は、式から求めた両はしの点を結ぶ
  push('第8時 座標平面', `const W1 = ${J(WIN1)}, W2 = ${J(WIN2)}, L = [${J(L1)}, ${J(L2)}]; const inw = (w, x, y) => x >= w.xmin && x <= w.xmax && y >= w.ymin && y <= w.ymax; return [-1, 3].every(x => inw(W1, x, L[0].a * x + L[0].b) && inw(W2, x, L[1].a * x + L[1].b)) && near(L[0].a * -1 + L[0].b, -3) && near(L[0].a * 3 + L[0].b, 5) && near(L[1].a * -1 + L[1].b, 7) && near(L[1].a * 3 + L[1].b, -1);`);
  // 確かめる（1）（2）・使ってみる（3）：画面の文から x を動かして y の範囲を調べ、答えの変域と照らす。（3）は x＝4 をふくまない → y＝−1 もふくまない（−1＜y≦2）
  push('第8時 確かめる（1）（2）・使ってみる（3）', `const P = [${J(T_DR[0])}, ${J(T_DR[1])}, ${J(T_DR[2])}].map(t => probA(t)[0]), A = [${J(A_DR[0])}, ${J(A_DR[1])}, ${J(A_DR[2])}]; return P.every(p => !!p) && P.every((p, i) => { const s = sweep(p), r = rng(A[i].split('\\n').pop())[0], c = calc(p); return near(r.lo, s.lo) && near(r.hi, s.hi) && same(r, c) && ptsOK(p.eq, A[i]); }) && P[0].eq === 'y＝2x+3' && P[1].eq === 'y＝−x+6' && ab(P[0].eq)[0] > 0 && ab(P[1].eq)[0] < 0 && P[2].hip === '＜' && rng(A[2].split('\\n').pop())[0].lop === '＜' && rng(A[2].split('\\n').pop())[0].hip === '≦';`);
  // （4）水そう：高さ 30cm、1分間に 2cm ずつ下がる。1分ずつ数えると、15分後に 0（なくなる）。x＝40 だと y＝−50（変域がないと負になる）
  push('第8時 使ってみる（4）', `const D = ${J(D4)}; let h = 30, t = 0; while (h > 0) { h -= 2; t++; } return t === 15 && near(D.a * 15 + D.b, 0) && near(D.a * 0 + D.b, 30) && near(D.a * 40 + D.b, -50) && ${J(A_DR[3])}.includes('${D4.xr}') && ${J(A_DR[3])}.includes('${D4.yr}') && ${J(A_DR[3])}.includes('x＝15') && /30cm/.test(${J(T_DR[3])}) && /2cm ずつ/.test(${J(T_DR[3])});`);
  // （5）y＝ax−2（a＞0）で、1≦x≦4 のとき 1≦y≦10。a を 0.5 きざみで走査すると、a＝3 だけ
  push('第8時 使ってみる（5）', `const D = ${J(D5)}, sol = []; for (let k = 1; k <= 80; k++) { const a = k / 2, s = sweep({ eq: 'y＝' + a + 'x−2', lo: D.lo, hi: D.hi }); if (near(s.lo, D.ylo) && near(s.hi, D.yhi)) sol.push(a); } return sol.join() === '3' && /y＝ax−2（a＞0）/.test(${J(T_DR[4])}) && /1≦x≦4/.test(${J(T_DR[4])}) && /1≦y≦10/.test(${J(T_DR[4])}) && ${J(A_DR[4])}.includes('a＝3') && near(4 * 3 - 2, 10) && near(3 - 2, 1);`);
  // （6）y＝−[[3/4]]x+5、y の変域 −1≦y≦5：x を −20〜20 で 0.25 きざみに走査して、y が −1〜5 に入る x の最小・最大が 0 と 8
  push('第8時 使ってみる（6）', `const D = ${J(D6)}, r = D.eq.replace(/^y＝/, ''); let lo = Infinity, hi = -Infinity; for (let k = -80; k <= 80; k++) { const x = k / 4, y = EV(r, { x }); if (y >= D.ylo - 1e-9 && y <= D.yhi + 1e-9) { lo = Math.min(lo, x); hi = Math.max(hi, x); } } const ans = ${J(A_DR[5])}; return lo === 0 && hi === 8 && ans.includes('${D6.xr}') && ptsOK ('y＝' + r, 'x＝0 のとき y＝5 x＝8 のとき y＝−1') && /−1≦y≦5/.test(${J(T_DR[5])}) && near(EV(r, { x: 0 }), 5) && near(EV(r, { x: 8 }), -1);`);
  // 考えよう（答えは載せない。ここで確かめるだけ）：x の変域 −2≦x≦4。a＝2、[[1/2]]、−1、−3。正なら x＝−2 で最小、負なら x＝−2 で最大。y の変域の幅は |a|×6
  push('第8時 考えよう', `const E = ${J(TH)}, X = ${J(THX)}; const r = E.map(e => { const a = ab(e)[0], s = sweep({ eq: e, lo: X[0], hi: X[1] }); return { a, lo: s.lo, hi: s.hi, w: s.hi - s.lo, minAtLeft: EV(e.replace(/^y＝/, ''), { x: X[0] }) < EV(e.replace(/^y＝/, ''), { x: X[1] }) }; }); return r.map(q => q.a).join() === '2,0.5,-1,-3' && r.every(q => (q.a > 0) === q.minAtLeft && near(q.w, Math.abs(q.a) * 6)) && near(r[0].lo, -3) && near(r[0].hi, 9) && near(r[1].lo, -2) && near(r[1].hi, 1) && near(r[2].lo, -2) && near(r[2].hi, 4) && near(r[3].lo, -12) && near(r[3].hi, 6) && ${J(A_DR.concat(A_WS).concat(A_QZ))}.every(t => !/a が正|a が負|右下がりだから/.test(t));`);
  // チャレンジ（8）y＝ax+2、−2≦x≦3、最大−最小＝10。a を 0.1 きざみで走査すると、a＝2、−2 だけ（a＝0 はのぞく）
  push('第8時 チャレンジ（8）', `const D = ${J(D8)}, sol = []; for (let k = -200; k <= 200; k++) { const a = k / 10; if (near(a, 0)) continue; const s = sweep({ eq: 'y＝' + a + 'x+2', lo: D.lo, hi: D.hi }); if (near(s.hi - s.lo, D.diff)) sol.push(a); } return sol.join() === '-2,2' && D.as.every(a => sol.includes(a)) && ${J(A_DR[6])}.includes('a＝2、−2') && near(3 * 2 + 2 - (-2 * 2 + 2), 10) && near(-2 * -2 + 2 - (3 * -2 + 2), 10) && /最大値と最小値の差が 10/.test(${J(T_DR.find(t => /最大値と最小値の差/.test(t)))});`);
  // 小テスト（1）〜（4）：画面の文から x を動かして y の範囲を調べ、答えと照らす。（4）は x＝3 をふくまない → −1≦y＜5
  push('第8時 小テスト（1）〜（4）', `const P = probB(${J(T_QZ.slice(1, 5).join('\\n'))}), A = ${J(A_QZ.slice(0, 4))}; return P.length === 4 && P.every((p, i) => { const r = rng(A[i].split('\\n').pop())[0], s = sweep(p); return near(r.lo, s.lo) && near(r.hi, s.hi) && same(r, calc(p)) && ptsOK(p.eq, A[i]); }) && P[3].hip === '＜' && P[3].lop === '≦' && rng(A[3].split('\\n').pop())[0].hip === '＜' && P.filter(p => ab(p.eq)[0] < 0).length === 2;`);
  // 小テスト チャレンジ：y＝ax+3、−2≦x≦4、−5≦y≦7 → a＝−2 だけ（a＞0 だと 4a+3＝19 で合わない）
  push('第8時 小テスト チャレンジ', `const D = ${J(QC)}, sol = []; for (let k = -200; k <= 200; k++) { const a = k / 10; if (near(a, 0)) continue; const s = sweep({ eq: 'y＝' + a + 'x+3', lo: D.lo, hi: D.hi }); if (near(s.lo, D.ylo) && near(s.hi, D.yhi)) sol.push(a); } return sol.join() === '-2' && near(-2 * -2 + 3, 7) && near(-2 * 4 + 3, -5) && near(4 * 4 + 3, 19) && ${J(A_QZ[4])}.includes('a＝−2') && same(rng(${J(T_QZ[T_QZ.length - 1])})[0], { lo: -5, lop: '≦', hip: '≦', hi: 7 });`);
  // 小テストの得点：2＋3＋3＋2＝10
  push('第8時 小テストの配点', `return ${J(Q.map(d => d.pt))}.reduce((a, c) => a + c, 0) === 10;`);
  // 答えの文の中の、文字のない式（4×3−2＝10 など）が、計算として正しい
  push('第8時 答えの文の計算', `const T = ${J(A_WS.concat(A_DR).concat(A_QZ))}; return T.length > 12 && T.every(arith);`);

  IK.lesson('ichiji_new-08', DEF);
})();
