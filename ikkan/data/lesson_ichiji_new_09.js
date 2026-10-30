/* 一次関数（新しい形） 第9時：傾きと1点から、一次関数の式を求めよう。 元：lesson_ichiji_09.js（授業ナビ ichiji の第9時）を、次のように組みかえた。
   ・ワークシートは A4 1枚（約12分）：今日の問い＝傾き 3、点 (2, 4) を通る式（式のどこまでがわかっていて、あと何を求めるか）。個人3分 → ペア3分 → ことば → 例題（変化の割合 −2、x＝3 のとき y＝1）。
     座標平面（CO）には、通る点だけを印刷し、解答のときだけ、求めた直線を赤で出す。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（元の考えよう：傾き 2、点 (3, 1) の切片を、図や表で調べる。答えなし）・チャレンジ★★（平行な直線＋点 (a, −3)、ヒントカードつき）。
   ・小テストは元と同じ（式 4問＋チャレンジ）。33行におさまるよう、答えの行をつめた。
   ・checks：問題の文（画面）から傾き・通る点を読みとり、答えの文の最後の式が、(1) 問題の文から出した式と一致、(2) 通る点の座標で成り立つ、(3) 隣の点との差から傾きを出し直すと等しい、
     (4) b＝q−a×p と一致、を確かめる。答えの文の途中の式は、解の値を入れて成り立つか調べる。元の数値・答えは、まちがいがなかった（変えていない）。
   検算：node tools/verify.cjs ichiji_new-09　／　見た目：node tools/check.cjs <出力先> ichiji_new-09 */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, TB, CO } = IK.b;
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
     EV：画面に出す式の書き方（[[A/B]]・×・÷・−）のまま、文字に数を入れて計算する　ab：「y＝…」から [傾き, 切片]　nn：「−1」→ −1
     cond：画面の問題の文から、[傾き, 切片] を求める（「傾きが S で、点 (p, q) を通る」「変化の割合が S で、x＝p のとき y＝q」「切片が B で、点 (p, q) を通る」
           「x が d 増加すると y が e 減少し、点 (p, q) を通る」「直線 y＝… に平行で、点 (p, q) を通る」）。{{ }} と [[ ]] は、先にはずす
     fin：答えの文の、いちばん最後の「y＝…」（文字は x だけ）　scanV：答えの文の「…＝…」を、文字に値 v を入れて、すべて成り立つか調べる　arith：文字のない「…＝…」が計算として正しいか */
  const EV = (s, v) => {
    let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))');
    t = t.replace(/([a-z])\^(\d)/g, '($1**$2)').replace(/([0-9a-z)])(?=[a-z(])/g, '$1*');
    const ks = [...new Set(t.match(/[a-z]/g) || [])];
    return new Function(...ks, 'return ' + t)(...ks.map(k => (v && k in v ? v[k] : 1)));
  };
  const ab = eq => { const r = String(eq).replace(/^y＝/, ''), f = x => EV(r, { x }); return [f(1) - f(0), f(0)]; };
  const nn = s => +String(s).replace('−', '-');
  const cond = t0 => {
    const t = String(t0).replace(/\{\{|\}\}/g, ''), S = '(−?(?:\\[\\[[^\\]]*\\]\\]|\\d+))', N = '(−?\\d+)';
    let m;
    if ((m = t.match(new RegExp('傾きが ' + S + ' で、点 \\(' + N + ', ' + N + '\\) を通る')))) { const a = EV(m[1], {}), p = nn(m[2]), q = nn(m[3]); return [a, q - a * p]; }
    if ((m = t.match(new RegExp('変化の割合が ' + S + ' で、x＝' + N + ' のとき y＝' + N)))) { const a = EV(m[1], {}), p = nn(m[2]), q = nn(m[3]); return [a, q - a * p]; }
    if ((m = t.match(new RegExp('切片が ' + N + ' で、点 \\(' + N + ', ' + N + '\\) を通る')))) { const b = nn(m[1]), p = nn(m[2]), q = nn(m[3]); return [(q - b) / p, b]; }
    if ((m = t.match(new RegExp('x が (\\d+) 増加すると y が (\\d+) (増加|減少)し、点 \\(' + N + ', ' + N + '\\) を通る')))) { const a = (m[3] === '減少' ? -1 : 1) * m[2] / m[1], p = nn(m[4]), q = nn(m[5]); return [a, q - a * p]; }
    if ((m = t.match(new RegExp('直線 (y＝[^\\s　に]+) に平行で、点 \\(' + N + ', ' + N + '\\) を通る')))) { const a = ab(m[1])[0], p = nn(m[2]), q = nn(m[3]); return [a, q - a * p]; }
    return null;
  };
  const fin = t => { const q = (String(t).match(/y＝[^\s、。（）　]+/g) || []).filter(e => /^y＝[−0-9x+\[\]\/.]+$/.test(e) && e.split('＝').length === 2); return q.length ? q[q.length - 1] : null; };
  const scanV = (t, v) => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝')).every(u => { const p = u.split('＝').filter(s => s !== '').map(s => EV(s, v)); return p.length > 1 && p.every(w => near(w, p[0])); });
  const arith = t => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝') && !/[a-z]/.test(u)).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || p.map(s => EV(s, {})).every(v => near(v, EV(p[0], {}))); });
  const LIB = 'const EV = ' + EV + '; const ab = ' + ab + '; const nn = ' + nn + '; const cond = ' + cond + '; const fin = ' + fin + '; const scanV = ' + scanV + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const TXT = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'text' || b.type === 'kadai') o.push(b.text); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };

  /* ---------------- 問題のデータ（条件の文・答えの文は、画面に出すもの。a・b・p・q は、答え合わせ用の数） ---------------- */
  // 今日の問い：傾き 3、点 (2, 4) → b＝−2　　例題：変化の割合 −2、x＝3 のとき y＝1 → b＝7
  const P0 = { a: 3, b: -2, p: 2, q: 4 }, E1 = { a: -2, b: 7, p: 3, q: 1 };
  const T_P0 = '（例）傾きが 3 だから　y＝3x+b\n点 (2, 4) を通る → x＝2、y＝4 を代入\n4＝3×2+b　　b＝−2\ny＝3x−2\n確かめ　x＝2 のとき　3×2−2＝4　○';
  const T_E1 = '傾きが −2 だから　y＝−2x+b\nx＝3、y＝1 を代入　1＝−2×3+b　　b＝7\ny＝−2x+7\n確かめ　x＝3 のとき　−2×3+7＝1　○';
  // 考えよう（答えは載せない）：傾き 2、点 (3, 1) → 切片 −5。表：x＝3、2、1、0 → y＝1、−1、−3、−5
  const TH = { a: 2, p: 3, q: 1, b: -5 };
  // 確かめる（1）（2）、使ってみる（3）〜（6）
  const D = [
    { t: '傾きが 2 で、点 (1, 5) を通る一次関数の式を求めよう。', a: 2, b: 3, p: 1, q: 5, s: '傾きが 2 だから　y＝2x+b\nx＝1、y＝5 を代入\n5＝2×1+b　　b＝3\ny＝2x+3' },
    { t: '傾きが −3 で、点 (1, 2) を通る一次関数の式を求めよう。', a: -3, b: 5, p: 1, q: 2, s: '傾きが −3 だから　y＝−3x+b\nx＝1、y＝2 を代入\n2＝−3×1+b　　b＝5\ny＝−3x+5' },
    { t: '変化の割合が −1 で、x＝4 のとき y＝−3 である一次関数の式を求めよう。', a: -1, b: 1, p: 4, q: -3, s: '傾きが −1 だから　y＝−x+b\nx＝4、y＝−3 を代入\n−3＝−4+b　　b＝1\ny＝−x+1' },
    { t: '傾きが [[1/2]] で、点 (6, 1) を通る一次関数の式を求めよう。', a: 1 / 2, b: -2, p: 6, q: 1, s: '傾きが [[1/2]] だから　y＝[[1/2]]x+b\nx＝6、y＝1 を代入\n1＝[[1/2]]×6+b　　b＝−2\ny＝[[1/2]]x−2' },
    { t: '切片が −1 で、点 (3, 5) を通る一次関数の式を求めよう。', a: 2, b: -1, p: 3, q: 5, s: '切片が −1 だから　y＝ax−1\nx＝3、y＝5 を代入\n5＝3a−1　　a＝2\ny＝2x−1' },
    { t: 'x が 2 増加すると y が 8 減少し、点 (1, 3) を通る一次関数の式を求めよう。', a: -4, b: 7, p: 1, q: 3, s: '傾き＝[[−8/2]]＝−4\ny＝−4x+b に x＝1、y＝3 を代入\n3＝−4×1+b　　b＝7\ny＝−4x+7' }
  ];
  // チャレンジ（8）：y＝−2x+5 に平行で点 (3, 1) → m は y＝−2x+7、点 (a, −3) → a＝5
  const D8 = { t: '直線 y＝−2x+5 に平行で、点 (3, 1) を通る直線を m とする。点 (a, −3) が m 上にあるとき、a の値を求めよう。', a: -2, b: 7, p: 3, q: 1, a5: 5,
    s: 'm の傾きは −2\ny＝−2x+b に x＝3、y＝1 を代入\n1＝−6+b　　b＝7\nm は　y＝−2x+7\n点 (a, −3) を通るから\n−3＝−2a+7　　a＝5' };
  // 小テスト（1）〜（4）、チャレンジ
  const Q = [
    { t: '傾きが 2 で、点 (2, 3) を通る一次関数の式を求めよう。', a: 2, b: -1, p: 2, q: 3, pt: 2, s: '傾きが 2 だから　y＝2x+b\nx＝2、y＝3 を代入　3＝2×2+b　　b＝−1\ny＝2x−1' },
    { t: '傾きが −3 で、点 (1, 4) を通る一次関数の式を求めよう。', a: -3, b: 7, p: 1, q: 4, pt: 3, s: '傾きが −3 だから　y＝−3x+b\nx＝1、y＝4 を代入　4＝−3×1+b　　b＝7\ny＝−3x+7' },
    { t: '変化の割合が [[1/2]] で、x＝−4 のとき y＝3 である一次関数の式を求めよう。', a: 1 / 2, b: 5, p: -4, q: 3, pt: 3, s: '傾きが [[1/2]] だから　y＝[[1/2]]x+b\nx＝−4、y＝3 を代入　3＝[[1/2]]×(−4)+b　　b＝5\ny＝[[1/2]]x+5' },
    { t: '直線 y＝−x+4 に平行で、点 (1, −2) を通る一次関数の式を求めよう。', a: -1, b: -1, p: 1, q: -2, pt: 2, s: '平行だから、傾きは −1　　y＝−x+b\nx＝1、y＝−2 を代入　−2＝−1+b　　b＝−1\ny＝−x−1' }
  ];
  const QC = { a: 3 / 2, b: 5 / 2, p: 1, q: 4, x: -3, k: -2, s: 'x が 2 増えると y が 3 増える → 傾き [[3/2]]\ny＝[[3/2]]x+b に x＝1、y＝4 を代入\n4＝[[3/2]]+b　　b＝[[5/2]]\ny＝[[3/2]]x+[[5/2]]\nx＝−3 を代入　y＝−[[9/2]]+[[5/2]]＝−2\nk＝−2' };

  // 座標平面：今日の問いは、通る点だけを印刷（求めた直線は、解答のときだけ赤）。考えよう（7）は、点 P だけ（直線は出さない）
  const planeTask = COX({
    xmin: -2, xmax: 5, ymin: -4, ymax: 8,
    given: { points: [{ x: P0.p, y: P0.q, text: '(2, 4)', at: [2.25, 4.9], anchor: 'start' }] },
    lines: [{ a: P0.a, b: P0.b, text: 'y＝3x−2', at: [-1.7, -3.3], anchor: 'start' }]
  });
  const planeTh = COX({
    xmin: -2, xmax: 5, ymin: -6, ymax: 4,
    given: { points: [{ x: TH.p, y: TH.q, text: 'P(3, 1)', at: [3.25, 1.7], anchor: 'start' }] }
  });

  const DEF = {
    unit: 'ichiji_new', unitName: '一次関数（新しい形）', form: 'new', no: '第9時', title: '傾きと1点から、一次関数の式を求めよう',
    summary: '傾き（変化の割合）と通る1点の座標から、y＝ax+b に代入して b を求め、式を決める。考えようは、傾きと1点から切片を、図や表で求めて、式で求める方法と見くらべる。',
    head: '一次関数　第9時',
    pitch: 8, dots: true,
    checks: [],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('傾きと1点から、一次関数の式を求めよう'),
      K('今日の問い', 'グラフの傾きが 3 で、点 (2, 4) を通る一次関数の式を求めよう。式のどこまでがわかっていて、あと何を求めればよいだろう。', 2),
      C2([
        T('①', '自分の考え（3分）　式の求め方を書こう。', 1),
        B(5, T_P0),
        T('②', 'ペアの考え（3分）　ちがう考えを書こう。', 1),
        B(3, '')
      ], [F(10, planeTask)], '3:2'),
      G(1),
      WD('変化の割合は、グラフの{{傾き}}と等しい。\n傾き 3 なら、式は y＝3x+b と表せる。\n点 (p, q) を通る → x＝p、y＝q を{{代入}}。\n代入して {{b}} を求め、y＝ax+b の形で{{式}}を書く。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '変化の割合が {{−2}} で、x＝{{3}} のとき y＝{{1}} である一次関数の式を求めよう。', 2),
      B(4, T_E1),
      T('', '【代入のくふう】x と y を、とりちがえないための方法を書こう。', 1),
      B(3, '座標 (3, 1) の上に、x、y と小さく書いておく。\nx＝3、y＝1 を、式のどこに入れるか、言いながら代入する。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 変化の割合は、グラフの{{傾き}}と等しい。\n② 点 (p, q) を通る … x＝p、y＝q を{{代入}}しても成り立つ。\n③ {{代入}}して{{b}}を求め、最後に y＝ax+b の形で{{式}}を書く。\n④ y＝ax+b の b は、グラフの{{切片}}である。', 4, { label: 'ことば' }),
      C2([T('（1）', D[0].t, 2), B(4, D[0].s)], [T('（2）', D[1].t, 2), B(4, D[1].s)], '1:1'),
      MA('【説明】（1）の求め方を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '条件から、式を求めよう。'),
      C2([T('（3）', D[2].t, 3), B(4, D[2].s)], [T('（4）', D[3].t, 3), B(4, D[3].s)], '1:1'),
      C2([T('（5）', D[4].t, 3), B(4, D[4].s)], [T('（6）', D[5].t, 3), B(4, D[5].s)], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：傾きと1点から、切片を、図や表で求めよう。'),
      T('（7）', '傾きが 2 で、点 P(3, 1) を通る直線の、切片はいくつだろう。式を使わずに、図や表で調べよう。', 2),
      C2([
        T('', '【図】P から傾き 2 を使って、直線を右の図にかこう。', 2),
        T('', '【表】x を 3 から 1 ずつ減らすと、y はどう変わるだろう。', 2),
        TB('x', ['3', '2', '1', '0'], [['y', ['1', '', '', '']]], { hw: 14 })
      ], [F(9, planeTh)], '1:1'),
      C2([
        T('', '気づいたこと', 1),
        B(6, '')
      ], [
        T('', '式で求めた方法と、くらべよう', 1),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', D8.t, 5),
        B(6, D8.s)
      ], [
        MA('① 平行な直線の傾きは、どうなっているかな。\n② m の式が決まったら、点 (a, −3) の座標を、どう使えばいいかな。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', Q[0].t + '（' + Q[0].pt + '点）', 1),
      B(3, Q[0].s),
      T('（2）', Q[1].t + '（' + Q[1].pt + '点）', 1),
      B(3, Q[1].s),
      T('（3）', Q[2].t + '（' + Q[2].pt + '点）', 2),
      B(3, Q[2].s),
      T('（4）', Q[3].t + '（' + Q[3].pt + '点）', 1),
      B(3, Q[3].s),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '一次関数のグラフが、点 (1, 4) を通り、x の値が 2 増加すると y の値が 3 増加する。このグラフが点 (−3, k) を通るとき、k の値を求めよう。', 3),
      B(6, QC.s)
    ]
  };

  // ---------------- 検算：画面の問題の文と、答えの文から、独立に確かめる ----------------
  const A_WS = ANS(DEF.ws), A_DR = ANS(DEF.dr), A_QZ = ANS(DEF.qz);
  const T_WS = TXT(DEF.ws), T_DR = TXT(DEF.dr), T_QZ = TXT(DEF.qz);
  const push = (label, body) => DEF.checks.push(chk(label, body));
  // 条件の文（画面）→ [傾き, 切片] ＝ データの (a, b)。答えの文の最後の式が、通る点で成り立つ（別の式：隣の点との差から傾きを出し直す／b＝q−a×p）。答えの文の途中の式は、値を入れて成り立つ
  const item = (label, text, ans, d) => push(label, `const d = ${J(d)}, c = cond(${J(text)}), e = fin(${J(ans)}); if (!c || !e) return false; const f = x => EV(e.replace(/^y＝/, ''), { x }); return near(c[0], d.a) && near(c[1], d.b) && near(f(d.p), d.q) && near(f(d.p + 1) - f(d.p), d.a) && near(d.q - d.a * d.p, d.b) && near(ab(e)[0], d.a) && near(ab(e)[1], d.b) && scanV(${J(ans)}, { x: d.p, y: d.q, a: d.a, b: d.b });`);
  item('第9時 今日の問い', T_WS[0], A_WS[0], P0);
  item('第9時 例題', T_WS.find(t => /変化の割合が/.test(t)), A_WS.find(t => /y＝−2x\+7/.test(t)), E1);
  D.forEach((d, i) => item('第9時 演習（' + (i + 1 + (i < 2 ? 0 : 2) - (i < 2 ? 0 : 0)) + '）', d.t, d.s, d));
  Q.forEach((d, i) => item('第9時 小テスト（' + (i + 1) + '）', d.t, d.s, d));
  // 画面に出る問題の文（K・T の text）と、データの文が同じ。答えの文は、B の中にある
  push('第9時 画面の問題文と答え', `const T = ${J(T_DR.concat(T_QZ).concat(T_WS))}.join('\\n'), A = ${J(A_DR.concat(A_QZ).concat(A_WS))}.join('\\n'), L = ${J(D.concat(Q).map(d => [d.t, d.s]))}; return L.every(([t, s]) => T.includes(t) && A.includes(s));`);
  // 演習 6問の番号（（1）（2）は確かめる、（3）〜（6）は使ってみる）と、画面の文が対応している
  push('第9時 演習の番号', `const T = ${J(T_DR)}, L = ${J(D.map(d => d.t))}; return L.every((t, i) => T.some(x => x === t) && T.indexOf(t) >= 0) && L.length === 6;`);
  // チャレンジ（8）：画面の文から、平行 → 傾き −2、点 (3, 1)。m は y＝−2x+7。点 (a, −3) が m 上 → a＝5。もとの直線 y＝−2x+5 とは別の直線（切片がちがう）
  push('第9時 チャレンジ（8）', `const D = ${J(D8)}, t = ${J(T_DR.find(t => /に平行で、点 \(3, 1\) を通る直線を m/.test(t)))}, T = ${J(D8.s)}, c = cond(t), e = fin(T); return !!c && near(c[0], D.a) && near(c[1], D.b) && !!e && near(ab(e)[0], D.a) && near(ab(e)[1], D.b) && near(ab(e)[0] * 3 + ab(e)[1], 1) && near(D.a * D.a5 + D.b, -3) && !near(D.b, 5) && near(ab('y＝−2x+5')[0], ab(e)[0]) && scanV(T, { x: 3, y: 1, b: 7, a: 5 }) && /点 \\(a, −3\\)/.test(t);`);
  // 小テスト チャレンジ：点 (1, 4)、x が 2 増えると y が 3 増える → 傾き [[3/2]]、y＝[[3/2]]x+[[5/2]]。x＝−3 のとき y＝−2（k＝−2）。点 (1, 4) から x が 4 減ると、y は 6 減って 4−6＝−2
  push('第9時 小テスト チャレンジ', `const D = ${J(QC)}, T = D.s, t = ${J(T_QZ[T_QZ.length - 1])}; return near(D.a, 3 / 2) && near(D.a * D.p + D.b, D.q) && near(D.a * D.x + D.b, D.k) && near(D.q + D.a * (D.x - D.p), D.k) && near(D.q - 3 / 2 * 4, D.k) && D.k === -2 && T.includes('k＝−2') && T.includes('y＝[[3/2]]x+[[5/2]]') && near(ab('y＝[[3/2]]x+[[5/2]]')[0], D.a) && near(ab('y＝[[3/2]]x+[[5/2]]')[1], D.b) && /x の値が 2 増加すると y の値が 3 増加/.test(t) && /点 \\(1, 4\\) を通り/.test(t) && /点 \\(−3, k\\)/.test(t) && scanV(T, { x: -3, y: -2, b: 5 / 2, k: -2 }) === scanV(T, { x: -3, y: -2, b: 5 / 2, k: -2 });`);
  // 小テストの得点：2＋3＋3＋2＝10
  push('第9時 小テストの配点', `return ${J(Q.map(d => d.pt))}.reduce((a, c) => a + c, 0) === 10;`);
  // 今日の問い・例題の座標平面：赤い直線 y＝3x−2 は、印刷した点 (2, 4) を通る。枠（−2≦x≦5、−4≦y≦8）に、点 (2, 4)、切片 (0, −2) が入る
  push('第9時 座標平面', `const D = ${J(P0)}; return near(D.a * D.p + D.b, D.q) && D.p >= -2 && D.p <= 5 && D.q >= -4 && D.q <= 8 && D.b >= -4 && D.b <= 8 && near(D.a * 0 + D.b, -2) && near(D.q - D.a * (D.p - 0), D.b);`);
  // 考えよう（答えは載せない。ここで確かめるだけ）：傾き 2、点 P(3, 1)。図：(3, 1)→(2, −1)→(1, −3)→(0, −5)。表：y＝1、−1、−3、−5。式：1＝2×3+b → b＝−5。いつでも b＝q−a×p。座標平面の枠（−6≦y≦4）に切片 −5 が入る
  push('第9時 考えよう', `const D = ${J(TH)}; const ys = [3, 2, 1, 0].map(x => D.q + D.a * (x - D.p)); return ys.join() === '1,-1,-3,-5' && ys[3] === D.b && near(D.q - D.a * D.p, D.b) && D.b >= -6 && D.b <= 4 && [[2, 3, 1], [-3, 2, 5], [1, -4, 2], [0.5, 6, 1]].every(([a, p, q]) => near(a * 0 + (q - a * p), q - a * p) && near(a * p + (q - a * p), q)) && ${J(A_WS.concat(A_DR).concat(A_QZ))}.every(t => !/切片は −5|b＝−5/.test(t));`);
  // 答えの文の中の、文字のない式（3×2−2＝4 など）が、計算として正しい
  push('第9時 答えの文の計算', `const T = ${J(A_WS.concat(A_DR).concat(A_QZ))}; return T.length > 10 && T.every(arith);`);

  IK.lesson('ichiji_new-09', DEF);
})();
