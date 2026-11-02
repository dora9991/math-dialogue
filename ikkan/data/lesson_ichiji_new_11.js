/* 一次関数（新しい形） 第11時：2元1次方程式の解を、グラフに表そう。 元：lesson_ichiji_11.js（授業ナビ ichiji の第11時）を、次のように組みかえた。
   ・ワークシートは A4 1枚（約12分）：今日の問い＝2x+y＝6 の解を表にして、座標平面（CO。白紙）に点をとり、点のならびを調べる（解答のときだけ、点と直線を赤で出す）。個人3分 → ペア3分 → ことば → 例題（3x−2y＝6 のグラフ。座標平面つき）。
   ・演習プリントは表裏：表＝確かめる 2問（y について解く／グラフをかく）・使ってみる 4問（点がグラフ上か／軸との交点／a の値／面積）／
     裏＝ひろげる（元の考えよう：係数や右辺を変えた 6本のグラフを、2つの座標平面にかいてくらべる。答えなし）・チャレンジ★★（元の入試（8）：x+2y＝8 のグラフ上の、自然数の点。ヒントカードつき）。
   ・小テストは元と同じ（y について解く・グラフをかく・軸との交点＋チャレンジ：ax+by＝6）。33行におさまるよう、答えの行をつめた。
   ・checks：問題の文（画面）から方程式を読みとり、(1) 係数から y について解いた [傾き, 切片] を出し直し、答えの文の式と一致、(2) 答えの文の座標が方程式の解、(3) 図の直線・点が、その方程式の直線・解、を確かめる。
     選ぶ問題・自然数の点は、総当たりで数えて答えと一致を確かめる。元の数値・答えは、まちがいがなかった（変えていない）。
   検算：node tools/verify.cjs ichiji_new-11　／　見た目：node tools/check.cjs <出力先> ichiji_new-11 */
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
     EV：画面に出す式の書き方（[[A/B]]・×・÷・−）のまま、文字に数を入れて計算する　hold：「左辺＝右辺」が x、y の値で成り立つか
     cf：「ax+by＝c」から [a, b, c]　yf：y について解いた [傾き, 切片]（b が 0 でないとき）　ab：「y＝…」から [傾き, 切片]　fin：答えの文の、いちばん最後の「y＝…」
     E：問題の文から、x と y の両方をふくむ方程式（「…＝数」）を取り出す　pts：問題の文から、座標 (x, y) を取り出す
     scanV：答えの文の「…＝…」を、文字に値 v を入れて、すべて成り立つか　arith：文字のない「…＝…」が計算として正しいか
     rowsOK：［行, 値 v］の並び（板書の行ごとに、その行で使う値）を、行ごとに scanV・arith で確かめる */
  const EV = (s, v) => {
    let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))');
    t = t.replace(/([a-z])\^(\d)/g, '($1**$2)').replace(/([0-9a-z)])(?=[a-z(])/g, '$1*');
    const ks = [...new Set(t.match(/[a-z]/g) || [])];
    return new Function(...ks, 'return ' + t)(...ks.map(k => (v && k in v ? v[k] : 1)));
  };
  const hold = (s, x, y) => { const p = String(s).split('＝').map(u => EV(u, { x, y })); return p.length > 1 && p.every(v => near(v, p[0])); };
  const cf = s => { const [l, r] = String(s).split('＝'); const f = (x, y) => EV(l, { x, y }) - EV(r, { x, y }); const c0 = f(0, 0); return [f(1, 0) - c0, f(0, 1) - c0, -c0]; };
  const yf = s => { const [a, b, c] = cf(s); return [-a / b, c / b]; };
  const ab = eq => { const r = String(eq).replace(/^y＝/, ''), f = x => EV(r, { x }); return [f(1) - f(0), f(0)]; };
  const nn = s => +String(s).replace('−', '-');
  const fin = t => { const q = (String(t).match(/y＝[^\s、。（）　]+/g) || []).filter(e => /^y＝[−0-9x+\[\]\/.]+$/.test(e) && e.split('＝').length === 2); return q.length ? q[q.length - 1] : null; };
  const E = t => (String(t).replace(/\{\{|\}\}/g, '').match(/[0-9a-z+−]+＝−?\d+/g) || []).filter(e => /x/.test(e) && /y/.test(e));
  const pts = t => [...String(t).replace(/\{\{|\}\}/g, '').matchAll(/\((−?\d+(?:\.\d+)?), (−?\d+(?:\.\d+)?)\)/g)].map(m => [nn(m[1]), nn(m[2])]);
  const scanV = (t, v) => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝')).every(u => { const p = u.split('＝').filter(s => s !== '').map(s => EV(s, v)); return p.length > 1 && p.every(w => near(w, p[0])); });
  const arith = t => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝') && !/[a-z]/.test(u)).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || p.map(s => EV(s, {})).every(v => near(v, EV(p[0], {}))); });
  const rowsOK = R => R.every(([t, v]) => (v === 'skip' || scanV(t, v || {})) && arith(t));
  const LIB = 'const EV = ' + EV + '; const hold = ' + hold + '; const cf = ' + cf + '; const yf = ' + yf + '; const ab = ' + ab + '; const nn = ' + nn + '; const fin = ' + fin + '; const E = ' + E + '; const pts = ' + pts + '; const scanV = ' + scanV + '; const arith = ' + arith + '; const rowsOK = ' + rowsOK + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const TXT = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'text' || b.type === 'kadai') o.push(b.text); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const blank = n => Array.from({ length: n }, () => '');
  const mn = n => String(n).replace('-', '−');
  const txt = R => R.map(r => r[0]).join('\n');   // 板書の行（［行, 行で使う値］の並びから）
  const LN = eq => { const f = yf(eq); return { a: f[0], b: f[1] }; };   // 方程式 → 図の直線（y＝ax+b）

  /* ---------------- 問題のデータ ---------------- */
  // 今日の問い：2x+y＝6。x＝−1〜4 のときの y　　例題：3x−2y＝6 → y＝[[3/2]]x−3。軸との交点 (2, 0)、(0, −3)
  const W1 = { eq: '2x+y＝6', xs: [-1, 0, 1, 2, 3, 4], ys: [8, 6, 4, 2, 0, -2] };
  const EXQ = { eq: '3x−2y＝6', a: 1.5, b: -3, pts: [[0, -3], [2, 0], [4, 3]] };
  // 考えよう（答えは載せない）：左＝x の係数だけを変える（点 (0, 6) を通る）／右＝右辺だけを変える（平行）
  const THL = ['x+y＝6', '2x+y＝6', '3x+y＝6'], THR = ['2x+y＝2', '2x+y＝4', '2x+y＝6'];
  // 演習プリント：（1）y について解く　（2）グラフをかく　（3）グラフ上の点　（4）軸との交点　（5）a の値　（6）面積　（8）自然数の点
  const D1 = [['x+y＝4', -1, 4], ['2x−y＝3', 2, -3]];
  const D2 = { eq: 'x−2y＝4', a: 0.5, b: -2 };
  const D3 = { eq: '2x−3y＝6', c: [['ア', 3, 0], ['イ', 0, 2], ['ウ', -3, -4], ['エ', 5, 1]] };
  const D4 = { eq: '3x+5y＝15', xi: 5, yi: 3 };
  const D5 = { eq: 'ax+3y＝12', pt: [3, 1], a: 3, ga: -1, gb: 4 };
  const D6 = { eq: '2x+3y＝12', xi: 6, yi: 4, area: 12 };
  const D8 = { eq: 'x+2y＝8', pts: [[2, 3], [4, 2], [6, 1]] };
  // 小テスト：（1）y について解く　（2）グラフ　（3）軸との交点　チャレンジ：ax+by＝6 が 2点 (3, 0)、(0, −2) を通る → a＝2、b＝−3
  const Q1 = [['x+y＝7', -1, 7], ['2x−y＝5', 2, -5], ['x+3y＝6', -1 / 3, 2]];
  const Q2 = [['x+y＝3', -1, 3], ['2x−y＝4', 2, -4]];
  const Q3 = { eq: '3x+2y＝12', xi: 4, yi: 6 };
  const QC = { a: 2, b: -3, pts: [[3, 0], [0, -2]] };

  // 手で書いた答え［行, 行で使う値］（画面にも checks にも、同じ文字列を使う）
  const R_W1 = [
    ['（例）表の y … 8、6、4、2、0、−2', null],
    ['6つの点は、一直線上にならぶ。', null],
    ['x＝0.5、y＝5 の点も、同じ直線上', { x: 0.5, y: 5 }],
    ['y について解くと　y＝−2x+6', { x: 1, y: 4 }]
  ];
  const R_EX = [
    ['3x−2y＝6 → −2y＝−3x+6', { x: 2, y: 0 }],
    ['y＝[[3/2]]x−3　傾き [[3/2]]、切片 −3', { x: 2, y: 0 }],
    ['点 (0, −3) から、右へ 2、上へ 3', null],
    ['（別の方法）(2, 0)、(0, −3) を結ぶ', null],
    ['確かめ　3×2−2×0＝6　○', null],
    ['　　　　3×0−2×(−3)＝6　○', null]
  ];
  const R_D1 = [['ア y＝−x+4', { x: 1, y: 3 }], ['イ −y＝−2x+3　y＝2x−3', { x: 1, y: -1 }]];
  const R_D2 = [['y＝[[1/2]]x−2', { x: 2, y: -1 }], ['点 (0, −2) から、右へ 2、上へ 1', null]];
  const R_D3 = [['ア 2×3−3×0＝6　○', null], ['ウ −6+12＝6　○', null], ['答え　ア、ウ', null]];
  const R_D4 = [['y＝0 → x＝5　(5, 0)', { x: 5, y: 0 }], ['x＝0 → y＝3　(0, 3)', { x: 0, y: 3 }]];
  const R_D5 = [['x＝3、y＝1 を代入', { x: 3, y: 1, a: 3 }], ['3a+3＝12　3a＝9　a＝3', { a: 3 }], ['y＝−x+4　傾き −1、切片 4', { x: 3, y: 1 }]];
  const R_D6 = [['x 軸との交点 (6, 0)', null], ['y 軸との交点 (0, 4)', null], ['[[1/2]]×6×4＝12（cm^2）', null]];
  const R_D8 = [
    ['x＝2 のとき　y＝3　(2, 3)', { x: 2, y: 3 }],
    ['x＝4 のとき　y＝2　(4, 2)', { x: 4, y: 2 }],
    ['x＝6 のとき　y＝1　(6, 1)', { x: 6, y: 1 }],
    ['x が奇数 → y は整数でない', null],
    ['x＝8 → y＝0（自然数でない）', { x: 8, y: 0 }]
  ];
  const R_Q1 = [['① y＝−x+7', { x: 1, y: 6 }], ['② −y＝−2x+5　y＝2x−5', { x: 3, y: 1 }], ['③ 3y＝−x+6　y＝−[[1/3]]x+2', { x: 3, y: 1 }]];
  const R_Q2 = [['① y＝−x+3　(0, 3)、(3, 0) を通る', { x: 3, y: 0 }], ['② y＝2x−4　(0, −4)、(2, 0) を通る', { x: 2, y: 0 }]];
  const R_Q3 = [['y＝0 → x＝4　(4, 0)', { x: 4, y: 0 }], ['x＝0 → y＝6　(0, 6)', { x: 0, y: 6 }]];
  const R_QC = [['(3, 0) を代入　3a＝6　a＝2', { a: 2 }], ['(0, −2) を代入　−2b＝6　b＝−3', { b: -3 }], ['a＝2、b＝−3', { a: 2, b: -3 }]];

  // 座標平面：生徒がかく図は lines なし。lines・points は解答を表示したときだけ赤。図の直線は、方程式から求める（LN）
  const planeTask = COX({
    xmin: -2, xmax: 5, ymin: -3, ymax: 9,
    lines: [Object.assign(LN(W1.eq), { text: '2x+y＝6', at: [0.3, 8.1], anchor: 'start' })],
    points: W1.xs.map((x, i) => ({ x, y: W1.ys[i] }))
  });
  const planeEx = COX({
    xmin: -3, xmax: 6, ymin: -5, ymax: 4,
    lines: [Object.assign(LN(EXQ.eq), { text: '3x−2y＝6', at: [1.2, 3.4], anchor: 'start' })],
    points: EXQ.pts.map(p => ({ x: p[0], y: p[1] }))
  });
  const plane2 = COX({
    xmin: -3, xmax: 6, ymin: -3, ymax: 6,
    lines: [Object.assign(LN(D2.eq), { text: 'x−2y＝4', at: [3.0, 1.3], anchor: 'start' })]
  });
  const planeTh = COX({ xmin: -2, xmax: 7, ymin: -2, ymax: 8 });
  const planeQ = COX({
    xmin: -3, xmax: 6, ymin: -5, ymax: 5,
    lines: [Object.assign(LN(Q2[0][0]), { text: '①', at: [-2.4, 5.0], anchor: 'start' }), Object.assign(LN(Q2[1][0]), { text: '②', at: [3.6, 2.4], anchor: 'start' })]
  });
  const PLANES = { task: LN(W1.eq), ex: LN(EXQ.eq), p2: LN(D2.eq), q: Q2.map(q => LN(q[0])) };

  const DEF = {
    unit: 'ichiji_new', unitName: '一次関数（新しい形）', form: 'new', no: '第11時', title: '2元1次方程式の解を、グラフに表そう',
    summary: '2元1次方程式の解を座標とする点を座標平面にとると、直線にならぶことを見つけ、y について解く・軸との交点を求める、の 2通りでグラフをかく。考えようは、係数や右辺を変えたときの、グラフのちがい。',
    head: '一次関数　第11時',
    pitch: 8, dots: true,
    checks: [],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('2元1次方程式の解を、グラフに表そう'),
      K('今日の問い', '2元1次方程式 2x+y＝6 の解 (x, y) を、座標とする点を、右の座標平面にとろう。点は、どのようにならぶだろう。', 2),
      C2([
        T('①', '自分の考え（3分）　表をうめ、点をとって、気づいたことを書こう。', 2),
        TB('x', W1.xs.map(mn), [['y', blank(6)]], { hw: 14 }),
        B(4, txt(R_W1)),
        T('②', 'ペアの考え（3分）　ちがう気づきを書こう。', 1),
        B(3, '')
      ], [F(12, planeTask)], '3:2'),
      G(1),
      WD('解 (x, y) を点にとると、{{直線}}になる。\nこの直線を、方程式の{{グラフ}}という。\ny について{{解く}}と、傾きと切片がわかる。\n軸との交点は、y＝{{0}} または x＝{{0}} とおく。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '方程式 3x−2y＝6 のグラフを、右の座標平面にかこう。y について解くと、y＝{{[[3/2]]}}x−{{3}}。', 3),
        B(6, txt(R_EX))
      ], [F(9, planeEx)], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 解 (x, y) を座標とする点は、{{直線}}の上にならぶ。\n② この直線を、方程式の{{グラフ}}という。\n③ 方程式を y について{{解く}}と、{{傾き}}と{{切片}}がわかる。\n④ x 軸との交点は y＝{{0}}、y 軸との交点は x＝{{0}} とおいて求める。', 4, { label: 'ことば' }),
      C2([
        T('（1）', 'y について解こう。\nア x+y＝4　　イ 2x−y＝3', 2),
        B(2, txt(R_D1)),
        T('（2）', '方程式 x−2y＝4 のグラフを、右の図にかこう。', 2),
        B(2, txt(R_D2))
      ], [F(8, plane2)], '3:2'),
      MA('【説明】y について解いて、グラフをかく手順を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '解や、軸との交点を使って、求めよう。'),
      C2([
        T('（3）', '2x−3y＝6 のグラフ上にある点を、すべて選ぼう。\nア (3, 0)　イ (0, 2)\nウ (−3, −4)　エ (5, 1)', 4),
        B(3, txt(R_D3))
      ], [
        T('（4）', '方程式 3x+5y＝15 のグラフと、x 軸、y 軸との交点の座標を求めよう。', 3),
        B(2, txt(R_D4))
      ], '1:1'),
      C2([
        T('（5）', '方程式 ax+3y＝12 のグラフが、点 (3, 1) を通る。a の値と、グラフの傾き・切片を求めよう。', 4),
        B(3, txt(R_D5))
      ], [
        T('（6）', '2x+3y＝12 のグラフと、x 軸、y 軸で囲まれた三角形の面積を求めよう。（1 目もり 1cm）', 3),
        B(3, txt(R_D6))
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：方程式の数を変えると、グラフはどう変わるだろう。'),
      T('（7）', '方程式のグラフを、左の図に 3本、右の図に 3本かこう。\n左　x+y＝6、2x+y＝6、3x+y＝6\n右　2x+y＝2、2x+y＝4、2x+y＝6', 3),
      F(10, planeTh, planeTh),
      C2([
        T('', '気づいたこと', 1),
        B(5, '')
      ], [
        T('', 'なぜ、そうなるのだろう。y について解いて、説明しよう。', 2),
        B(5, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '方程式 x+2y＝8 のグラフ上の点で、x 座標、y 座標が、どちらも自然数である点を、すべて求めよう。', 4),
        B(5, txt(R_D8))
      ], [
        MA('① x+2y＝8 を、y について解いてみよう。\n② y が自然数になるのは、x がどんな数のときかな。x に、小さい数を入れてみよう。', 7, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次の方程式を、y について解こう。（3点）\nア x+y＝7　　イ 2x−y＝5　　ウ x+3y＝6', 2),
      B(3, txt(R_Q1)),
      C2([
        T('（2）', '次の方程式のグラフを、右の座標平面にかこう。（4点）\n① x+y＝3　　② 2x−y＝4', 3),
        B(3, txt(R_Q2))
      ], [F(10, planeQ)], '1:1'),
      T('（3）', '方程式 ' + Q3.eq + ' のグラフと、x 軸、y 軸との交点の座標を、それぞれ求めよう。（3点）', 2),
      B(2, txt(R_Q3)),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '方程式 ax+by＝6 のグラフが、2点 (3, 0)、(0, −2) を通る。a、b の値を求めよう。', 2),
      B(3, txt(R_QC))
    ]
  };

  // ---------------- 検算：画面の問題の文と、答えの文から、独立に確かめる ----------------
  const A_WS = ANS(DEF.ws), A_DR = ANS(DEF.dr), A_QZ = ANS(DEF.qz);
  const T_WS = TXT(DEF.ws), T_DR = TXT(DEF.dr), T_QZ = TXT(DEF.qz);
  const push = (label, body) => DEF.checks.push(chk(label, body));
  // 今日の問い：画面の文の方程式 2x+y＝6 から、係数で y を出し直す（y＝(c−ax)÷b）。表の値・点が、すべて解。点は座標平面（−2≦x≦5、−3≦y≦9）に入る。赤い直線は、解と同じ（傾き −2、切片 6）
  push('第11時 今日の問い', `const W = ${J(W1)}, e = E(${J(T_WS[0])})[0], [a, b, c] = cf(e), f = yf(e), P = ${J(PLANES.task)}; return e === W.eq && W.xs.every((x, i) => near((c - a * x) / b, W.ys[i]) && hold(e, x, W.ys[i]) && x >= -2 && x <= 5 && W.ys[i] >= -3 && W.ys[i] <= 9) && W.xs.slice(1).every((x, i) => near((W.ys[i + 1] - W.ys[i]) / (x - W.xs[i]), f[0])) && near(f[0], -2) && near(f[1], 6) && near(P.a, f[0]) && near(P.b, f[1]) && hold(e, 0.5, 5) && ${J(txt(R_W1))}.includes(W.ys.map(y => String(y).replace('-', '−')).join('、')) && rowsOK(${J(R_W1)});`);
  // 例題：画面の文の方程式 3x−2y＝6 → y＝[[3/2]]x−3。印刷した答えの空欄・図の直線・点 (0, −3)、(2, 0)、(4, 3) が、すべて解。座標平面（−3≦x≦6、−5≦y≦4）に入る
  push('第11時 例題', `const D = ${J(EXQ)}, e = E(${J(T_WS.find(t => /方程式 3x−2y/.test(t)))})[0], f = yf(e), P = ${J(PLANES.ex)}; return e === D.eq && near(f[0], D.a) && near(f[1], D.b) && near(P.a, D.a) && near(P.b, D.b) && D.pts.every(p => hold(e, p[0], p[1]) && p[0] >= -3 && p[0] <= 6 && p[1] >= -5 && p[1] <= 4) && !hold(e, 1, -1) && ${J(T_WS.find(t => /方程式 3x−2y/.test(t)))}.includes('{{[[3/2]]}}x−{{3}}') && rowsOK(${J(R_EX)});`);
  // 演習（1）：画面の文の 2つの方程式 → y について解いた式が、答えの文の最後の式と一致
  push('第11時 演習（1）', `const D = ${J(D1)}, Es = E(${J(T_DR.find(t => /ア x\+y＝4/.test(t)))}), L = ${J(txt(R_D1))}.split('\\n'); return Es.length === 2 && D.every(([eq, a, b], i) => Es[i] === eq && near(yf(eq)[0], a) && near(yf(eq)[1], b) && near(ab(fin(L[i]))[0], a) && near(ab(fin(L[i]))[1], b) && [-2, 0, 3].every(x => hold(eq, x, a * x + b))) && rowsOK(${J(R_D1)});`);
  // 演習（2）：x−2y＝4 → y＝[[1/2]]x−2。図の直線と一致。点 (0, −2)、(2, −1)、(4, 0) が解で、座標平面（−3≦x≦6、−3≦y≦6）に入る
  push('第11時 演習（2）', `const D = ${J(D2)}, e = E(${J(T_DR.find(t => /方程式 x−2y＝4/.test(t)))})[0], f = yf(e), P = ${J(PLANES.p2)}, L = ${J(txt(R_D2))}.split('\\n'); return e === D.eq && near(f[0], D.a) && near(f[1], D.b) && near(P.a, D.a) && near(P.b, D.b) && near(ab(fin(L[0]))[0], D.a) && near(ab(fin(L[0]))[1], D.b) && [[0, -2], [2, -1], [4, 0]].every(p => hold(e, p[0], p[1]) && p[0] >= -3 && p[0] <= 6 && p[1] >= -3 && p[1] <= 6) && rowsOK(${J(R_D2)});`);
  // 演習（3）：画面の文の 4点のうち、2x−3y＝6 の解になる点を総当たりで調べる → ア、ウ。答えの文の最後の行と一致
  push('第11時 演習（3）', `const D = ${J(D3)}, t = ${J(T_DR.find(t => /ウ \(−3, −4\)/.test(t)))}, P = pts(t), e = E(t)[0], L = ${J(txt(R_D3))}.split('\\n'); return e === D.eq && P.length === 4 && P.every((p, i) => p[0] === D.c[i][1] && p[1] === D.c[i][2]) && P.map((p, i) => hold(e, p[0], p[1]) ? 'アイウエ'[i] : '').join('') === 'アウ' && L[L.length - 1] === '答え　ア、ウ' && rowsOK(${J(R_D3)});`);
  // 演習（4）：3x+5y＝15 の x 軸との交点（y＝0 → x＝15÷3）と y 軸との交点（x＝0 → y＝15÷5）。答えの文の座標が解
  push('第11時 演習（4）', `const D = ${J(D4)}, t = ${J(T_DR.find(t => /方程式 3x\+5y＝15/.test(t)))}, e = E(t)[0], [a, b, c] = cf(e), P = pts(${J(txt(R_D4))}); return e === D.eq && near(c / a, D.xi) && near(c / b, D.yi) && P.length === 2 && P[0][1] === 0 && P[1][0] === 0 && hold(e, P[0][0], P[0][1]) && hold(e, P[1][0], P[1][1]) && P[0][0] === D.xi && P[1][1] === D.yi && rowsOK(${J(R_D4)});`);
  // 演習（5）：ax+3y＝12 が (3, 1) を通る → 3a+3＝12 より a＝3（(12−3×1)÷3）。3x+3y＝12 → y＝−x+4（傾き −1、切片 4）
  push('第11時 演習（5）', `const D = ${J(D5)}, t = ${J(T_DR.find(t => /方程式 ax\+3y/.test(t)))}, P = pts(t)[0], a = (12 - 3 * P[1]) / P[0], e = a + 'x+3y＝12', f = yf(e); return /ax\\+3y＝12/.test(t) && P.join() === D.pt.join() && near(a, D.a) && hold(e, P[0], P[1]) && near(f[0], D.ga) && near(f[1], D.gb) && rowsOK(${J(R_D5)});`);
  // 演習（6）：2x+3y＝12 の軸との交点 (6, 0)、(0, 4)（y＝0 → x＝12÷2、x＝0 → y＝12÷3）。面積 ½×6×4＝12
  push('第11時 演習（6）', `const D = ${J(D6)}, t = ${J(T_DR.find(t => /2x\+3y＝12 のグラフと/.test(t)))}, e = E(t)[0], [a, b, c] = cf(e); return e === D.eq && near(c / a, D.xi) && near(c / b, D.yi) && near(c / a * (c / b) / 2, D.area) && hold(e, D.xi, 0) && hold(e, 0, D.yi) && rowsOK(${J(R_D6)});`);
  // 考えよう（答えは載せない。ここで確かめるだけ）：左の 3本は点 (0, 6) を通り、傾きが −1、−2、−3。右の 3本は傾き −2 で、切片が 2、4、6（平行）。それぞれの軸との交点が、座標平面（−2≦x≦7、−2≦y≦8）に入る。画面の文の方程式と一致
  push('第11時 考えよう', `const L = ${J(THL)}, R = ${J(THR)}, t = ${J(T_DR.find(t => /左の図に 3本/.test(t)))}; const yl = L.map(yf), yr = R.map(yf); return E(t).join() === L.concat(R).join() && yl.every(f => near(f[1], 6)) && yl.map(f => f[0]).join() === '-1,-2,-3' && L.every(e => hold(e, 0, 6)) && yr.every(f => near(f[0], -2)) && yr.map(f => f[1]).join() === '2,4,6' && L.concat(R).every(e => { const [a, b, c] = cf(e); return c / a >= -2 && c / a <= 7 && c / b >= -2 && c / b <= 8; });`);
  // 考えようの答え（3本とも点 (0, 6) を通る／3本は平行）は、どこにも書いていない
  push('第11時 考えようの答えが出ていない', `const T = ${J(A_WS.concat(A_DR).concat(A_QZ))}.join('\\n'), V = ${J(T_WS.concat(T_DR).concat(T_QZ))}.join('\\n'); return !/平行|(0, 6) を通る|切片が同じ|傾きが同じ/.test(T + V);`);
  // チャレンジ（8）：x+2y＝8 の、x・y がどちらも自然数の点を総当たり → (2, 3)、(4, 2)、(6, 1) の 3個。答えの文の座標と一致
  push('第11時 チャレンジ（8）', `const D = ${J(D8)}, t = ${J(T_DR.find(t => /x\+2y＝8 のグラフ上/.test(t)))}, e = E(t)[0], all = []; for (let x = 1; x <= 30; x++) for (let y = 1; y <= 30; y++) if (hold(e, x, y)) all.push(x + ',' + y); const P = pts(${J(txt(R_D8))}); return e === D.eq && all.join(' ') === '2,3 4,2 6,1' && P.map(p => p.join()).join(' ') === all.join(' ') && rowsOK(${J(R_D8)});`);
  // 小テスト（1）：画面の文の 3つの方程式 → y について解いた式が、答えの文の式と一致
  push('第11時 小テスト（1）', `const D = ${J(Q1)}, Es = E(${J(T_QZ[0])}), L = ${J(txt(R_Q1))}.split('\\n'); return Es.length === 3 && D.every(([eq, a, b], i) => Es[i] === eq && near(yf(eq)[0], a) && near(yf(eq)[1], b) && near(ab(fin(L[i]))[0], a) && near(ab(fin(L[i]))[1], b) && [-3, 0, 6].every(x => hold(eq, x, a * x + b))) && rowsOK(${J(R_Q1)});`);
  // 小テスト（2）：x+y＝3、2x−y＝4 のグラフ。図の直線は、方程式から出した直線と一致。軸との交点 (0, 3)、(3, 0)、(0, −4)、(2, 0) が解で、座標平面（−3≦x≦6、−5≦y≦5）に入る
  push('第11時 小テスト（2）', `const D = ${J(Q2)}, Es = E(${J(T_QZ[1])}), P = ${J(PLANES.q)}; return Es.length === 2 && D.every(([eq, a, b], i) => Es[i] === eq && near(yf(eq)[0], a) && near(yf(eq)[1], b) && near(P[i].a, a) && near(P[i].b, b)) && [['x+y＝3', [0, 3], [3, 0]], ['2x−y＝4', [0, -4], [2, 0]]].every(([e, p, q]) => hold(e, p[0], p[1]) && hold(e, q[0], q[1]) && [p, q].every(z => z[0] >= -3 && z[0] <= 6 && z[1] >= -5 && z[1] <= 5)) && rowsOK(${J(R_Q2)});`);
  // 小テスト（3）：3x+2y＝12 の x 軸との交点（12÷3）と y 軸との交点（12÷2）。チャレンジ：ax+by＝6 が (3, 0)、(0, −2) を通る → a＝6÷3、b＝6÷(−2)
  push('第11時 小テスト（3）', `const D = ${J(Q3)}, t = ${J(T_QZ.find(t => /方程式 3x\+2y＝12/.test(t)))}, e = E(t)[0], [a, b, c] = cf(e), P = pts(${J(txt(R_Q3))}); return e === D.eq && near(c / a, D.xi) && near(c / b, D.yi) && P.length === 2 && hold(e, P[0][0], P[0][1]) && hold(e, P[1][0], P[1][1]) && P[0][0] === D.xi && P[1][1] === D.yi && rowsOK(${J(R_Q3)});`);
  push('第11時 小テスト チャレンジ', `const D = ${J(QC)}, t = ${J(T_QZ[T_QZ.length - 1])}, P = pts(t); const a = 6 / P[0][0], b = 6 / P[1][1]; return P.length === 2 && P[0][1] === 0 && P[1][0] === 0 && near(a, D.a) && near(b, D.b) && P.every(p => near(a * p[0] + b * p[1], 6)) && /ax\\+by＝6/.test(t) && rowsOK(${J(R_QC)});`);
  // 小テストの得点：3＋4＋3＝10
  push('第11時 小テストの配点', `return ${J(T_QZ.slice(0, 3))}.map(t => +t.match(/（(\\d+)点）/)[1]).reduce((a, c) => a + c, 0) === 10;`);
  // 答えの文の中の、文字のない式（3×2−2×0＝6 など）が、計算として正しい
  push('第11時 答えの文の計算', `const T = ${J(A_WS.concat(A_DR).concat(A_QZ))}; return T.length > 8 && T.every(arith);`);

  IK.lesson('ichiji_new-11', DEF);
})();
