/* 一次関数（新しい形） 第10時：2点から、一次関数の式を求めよう。 元：lesson_ichiji_10.js（授業ナビ ichiji の第10時）を、次のように組みかえた。
   ・ワークシートは A4 1枚（約12分）：今日の問い＝2点 A(1, 3)、B(3, 7) を通る式（座標平面 CO に、点だけを印刷。解答のときだけ、求めた直線を赤で出す）。個人3分 → ペア3分 → ことば（方法1・方法2）→ 例題（2点 (−2, 5)、(4, −1)。座標平面つき）。
   ・演習プリントは表裏：表＝確かめる 2問（傾き・式）・使ってみる 4問（連立方程式で／傾きが分数／x と y の値の組／軸との交点）／裏＝ひろげる（元の考えよう：グラフ上の点から 2点を選ぶ。座標平面 CO に直線と●を出す。答えなし）・
     チャレンジ★★（元の入試（9）：変域から 2通りの式。ヒントカードつき）。
   ・小テストは元と同じ（傾き・式・x と y の値の組・連立方程式で＋チャレンジ：x 軸との交点）。33行におさまるよう、答えの行をつめた。
   ・checks：問題の文（画面）から 2点を読みとり、(1) 傾きを (yの差)÷(xの差) で、(2) 2点を代入した連立方程式の解（行列式）で、別々に出し、答えの文の最後の式と一致すること、
     その式が 2点の座標を通ること、答えの文の途中の式が、解の値で成り立つことを確かめる。変域の問題は、a・b を総当たりして、答えが 2通りだけであることを確かめる。
     元の数値・答えは、まちがいがなかった（変えていない）。
   検算：node tools/verify.cjs ichiji_new-10　／　見た目：node tools/check.cjs <出力先> ichiji_new-10 */
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
     pts：問題の文から、座標 (x, y) を、出てきた順に取り出す　xy：「x＝p のとき y＝q」の組を取り出す　fin：答えの文の、いちばん最後の「y＝…」
     fit：2点を通る直線の [傾き, 切片]（傾き＝(yの差)÷(xの差)）　cramer：2点を a・x+b＝y に代入した連立方程式を、行列式で解いた [a, b]（fit とは別の計算）
     scanV：答えの文の「…＝…」を、文字に値 v を入れて、すべて成り立つか調べる　arith：文字のない「…＝…」が計算として正しいか
     rowsOK：［行, 値 v］の並び（板書の行ごとに、その行で使う値）を、行ごとに scanV・arith で確かめる（v が 'skip' の行は、scanV をしない） */
  const EV = (s, v) => {
    let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))');
    t = t.replace(/([a-z])\^(\d)/g, '($1**$2)').replace(/([0-9a-z)])(?=[a-z(])/g, '$1*');
    const ks = [...new Set(t.match(/[a-z]/g) || [])];
    return new Function(...ks, 'return ' + t)(...ks.map(k => (v && k in v ? v[k] : 1)));
  };
  const ab = eq => { const r = String(eq).replace(/^y＝/, ''), f = x => EV(r, { x }); return [f(1) - f(0), f(0)]; };
  const nn = s => +String(s).replace('−', '-');
  const pts = t => [...String(t).replace(/\{\{|\}\}/g, '').matchAll(/\((−?\d+), (−?\d+)\)/g)].map(m => [nn(m[1]), nn(m[2])]);
  const xy = t => [...String(t).matchAll(/x＝(−?\d+) のとき y＝(−?\d+)/g)].map(m => [nn(m[1]), nn(m[2])]);
  const fin = t => { const q = (String(t).match(/y＝[^\s、。（）　]+/g) || []).filter(e => /^y＝[−0-9x+\[\]\/.]+$/.test(e) && e.split('＝').length === 2); return q.length ? q[q.length - 1] : null; };
  const fit = (p, q) => { const a = (q[1] - p[1]) / (q[0] - p[0]); return [a, p[1] - a * p[0]]; };
  const cramer = (p, q) => { const D = p[0] - q[0]; return [(p[1] - q[1]) / D, (p[0] * q[1] - q[0] * p[1]) / D]; };
  const scanV = (t, v) => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝')).every(u => { const p = u.split('＝').filter(s => s !== '').map(s => EV(s, v)); return p.length > 1 && p.every(w => near(w, p[0])); });
  const arith = t => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝') && !/[a-z]/.test(u)).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || p.map(s => EV(s, {})).every(v => near(v, EV(p[0], {}))); });
  const rowsOK = R => R.every(([t, v]) => (v === 'skip' || scanV(t, v || {})) && arith(t));
  const LIB = 'const EV = ' + EV + '; const ab = ' + ab + '; const nn = ' + nn + '; const pts = ' + pts + '; const xy = ' + xy + '; const fin = ' + fin + '; const fit = ' + fit + '; const cramer = ' + cramer + '; const scanV = ' + scanV + '; const arith = ' + arith + '; const rowsOK = ' + rowsOK + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const TXT = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'text' || b.type === 'kadai') o.push(b.text); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const txt = R => R.map(r => r[0]).join('\n');   // 板書の行（［行, 行で使う値］の並びから）

  /* ---------------- 問題のデータ（a・b は、答え合わせ用の数。画面の問題の文は、下の T・K に書いたもの） ---------------- */
  // 今日の問い：A(1, 3)、B(3, 7) → y＝2x+1　　例題：(−2, 5)、(4, −1) → y＝−x+3
  const L1 = { a: 2, b: 1, A: [1, 3], B: [3, 7] }, EX = { a: -1, b: 3, A: [-2, 5], B: [4, -1] };
  // 考えよう（答えは載せない）：直線 y＝−[[3/2]]x+2 の上の格子点（●）
  const TH = { a: -1.5, b: 2, pts: [[-2, 5], [0, 2], [2, -1], [4, -4]] };
  // 演習プリント：（1）傾き ア・イ　（2）式　（3）連立方程式で　（4）傾きが分数　（5）x と y の値の組　（6）軸との交点　（8）変域から 2通り
  const D1 = [[[1, 3], [4, 9], 2], [[-2, 5], [1, -1], -2]];
  const D2 = { a: 3, b: -1 }, D3 = { a: 3, b: 1 }, D4 = { a: -0.5, b: 3 }, D5 = { a: -3, b: -1 }, D6 = { a: 2 / 3, b: -4 };
  const D8 = [[[1, 3], [4, 9], 2, 1], [[1, 9], [4, 3], -2, 11]];
  // 小テスト：（1）傾き　（2）式　（3）x と y の値の組　（4）連立方程式で　チャレンジ：x 軸との交点
  const Q1 = { a: 2 }, Q2 = { a: -2, b: 7 }, Q3 = { a: -0.5, b: -1 }, Q4 = { a: 2, b: -1 }, QC = { a: -0.5, b: 4, x: 8 };

  // 手で書いた答え［行, 行で使う値］（画面にも checks にも、同じ文字列を使う）
  const R_L1 = [
    ['（例）x が 2 増えると y は 4 増える', null],
    ['傾き＝(7−3)÷(3−1)＝2　y＝2x+b', { x: 1, y: 3, b: 1 }],
    ['A(1, 3) を代入　3＝2×1+b　b＝1', { b: 1 }],
    ['y＝2x+1', { x: 1, y: 3 }],
    ['確かめ　B(3, 7)：2×3+1＝7　○', null]
  ];
  const R_EX = [
    ['方法1　傾き＝(−1−5)÷(4−(−2))＝−1', null],
    ['　　　(4, −1) を代入　−1＝−4+b　b＝3', { b: 3 }],
    ['方法2　5＝−2a+b …①　−1＝4a+b …②', { a: -1, b: 3 }],
    ['　　　②−①　−6＝6a　a＝−1　b＝3', { a: -1, b: 3 }],
    ['どちらも　y＝−x+3', { x: 4, y: -1 }],
    ['確かめ　(−2, 5)：−(−2)+3＝5　○', null],
    ['　　　(4, −1)：−4+3＝−1　○', null]
  ];
  const R_D1 = [['ア (9−3)÷(4−1)＝2', null], ['イ (−1−5)÷(1−(−2))＝−2', null]];
  const R_D2 = [['傾き (8−2)÷(3−1)＝3', null], ['y＝3x+b に (1, 2) を代入', { x: 1, y: 2, b: -1 }], ['2＝3×1+b　　b＝−1', { b: -1 }], ['y＝3x−1', { x: 1, y: 2 }]];
  const R_D3 = [['4＝a+b …①', { a: 3, b: 1 }], ['10＝3a+b …②', { a: 3, b: 1 }], ['②−①　6＝2a　a＝3', { a: 3 }], ['① に代入　4＝3+b　b＝1', { b: 1 }], ['y＝3x+1', { x: 1, y: 4 }]];
  const R_D4 = [['傾き (2−5)÷(2−(−4))＝−[[1/2]]', null], ['y＝−[[1/2]]x+b に (2, 2) を代入', { x: 2, y: 2, b: 3 }], ['2＝−1+b　　b＝3', { b: 3 }], ['y＝−[[1/2]]x+3', { x: 2, y: 2 }]];
  const R_D5 = [['2点 (−3, 8)、(1, −4) を通る', null], ['傾き (−4−8)÷(1−(−3))＝−3', null], ['8＝−3×(−3)+b　　b＝−1', { b: -1 }], ['y＝−3x−1', { x: 1, y: -4 }]];
  const R_D6 = [['切片は −4', null], ['傾き (−4−0)÷(0−6)＝[[2/3]]', null], ['y＝[[2/3]]x−4', { x: 6, y: 0 }]];
  const R_D8 = [
    ['a が正：(1, 3)、(4, 9)', null], ['傾き (9−3)÷(4−1)＝2', null], ['3＝2×1+b　b＝1', { b: 1 }], ['y＝2x+1', { x: 1, y: 3 }],
    ['a が負：(1, 9)、(4, 3)', null], ['傾き (3−9)÷(4−1)＝−2', null], ['9＝−2×1+b　b＝11', { b: 11 }], ['y＝−2x+11', { x: 1, y: 9 }],
    ['答え　y＝2x+1、y＝−2x+11', 'skip']
  ];
  const R_Q1 = [['(7−1)÷(5−2)＝6÷3＝2', null]];
  const R_Q2 = [['傾き＝(1−5)÷(3−1)＝−4÷2＝−2　y＝−2x+b', { x: 1, y: 5, b: 7 }], ['点 (1, 5) を代入　5＝−2×1+b　b＝7', { b: 7 }], ['y＝−2x+7', { x: 1, y: 5 }]];
  const R_Q3 = [['傾き＝(−2−1)÷(2−(−4))＝−3÷6＝−[[1/2]]', null], ['y＝−[[1/2]]x+b に (2, −2) を代入　−2＝−1+b　b＝−1', { x: 2, y: -2, b: -1 }], ['y＝−[[1/2]]x−1', { x: 2, y: -2 }]];
  const R_Q4 = [['−3＝−a+b …①　　3＝2a+b …②', { a: 2, b: -1 }], ['②−①　6＝3a　a＝2　　② に代入　3＝4+b　b＝−1', { a: 2, b: -1 }], ['y＝2x−1', { x: 2, y: 3 }]];
  const R_QC = [['傾き (1−3)÷(6−2)＝−[[1/2]]', null], ['y＝−[[1/2]]x+b に (2, 3) を代入', { x: 2, y: 3, b: 4 }], ['3＝−1+b　　b＝4　　y＝−[[1/2]]x+4', { x: 2, y: 3, b: 4 }], ['y＝0 のとき　0＝−[[1/2]]x+4　x＝8', { x: 8, y: 0 }], ['(8, 0)', null]];

  // 座標平面：生徒に見せるのは、点（黒）だけ。lines・points は解答を表示したときだけ赤
  const planeTask = COX({
    xmin: -1, xmax: 5, ymin: -1, ymax: 8,
    given: { points: [{ x: 1, y: 3, text: 'A(1, 3)', at: [1.3, 2.3], anchor: 'start' }, { x: 3, y: 7, text: 'B(3, 7)', at: [3.3, 6.6], anchor: 'start' }] },
    lines: [{ a: L1.a, b: L1.b, text: 'y＝2x+1', at: [0.4, 7.0], anchor: 'start' }]
  });
  const planeEx = COX({
    xmin: -3, xmax: 5, ymin: -2, ymax: 7,
    given: { points: [{ x: -2, y: 5, text: '(−2, 5)', at: [-1.8, 5.6], anchor: 'start' }, { x: 4, y: -1, text: '(4, −1)', at: [3.7, -1.9], anchor: 'end' }] },
    lines: [{ a: EX.a, b: EX.b, text: 'y＝−x+3', at: [0.2, 4.4], anchor: 'start' }]
  });
  // 考えよう（7）：直線と格子点（●）を、最初から出す（式は書かない）
  const planeThink = COX({
    xmin: -4, xmax: 6, ymin: -5, ymax: 6,
    given: { lines: [{ a: TH.a, b: TH.b }], points: TH.pts.map(p => ({ x: p[0], y: p[1] })) }
  });

  const DEF = {
    unit: 'ichiji_new', unitName: '一次関数（新しい形）', form: 'new', no: '第10時', title: '2点から、一次関数の式を求めよう',
    summary: 'グラフが通る 2点の座標から、傾きを先に求める方法と、2点を代入して連立方程式をつくる方法で、一次関数の式を求める。考えようは、グラフ上の 2点の選び方を変えても、式は変わるか。',
    head: '一次関数　第10時',
    pitch: 8, dots: true,
    checks: [],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('2点から、一次関数の式を求めよう'),
      K('今日の問い', 'グラフが 2点 A(1, 3)、B(3, 7) を通る一次関数の式を求めよう。前の時間とちがい、傾きはわからない。どう求めればよいだろう。', 2),
      C2([
        T('①', '自分の考え（3分）　求め方と式を書こう。', 1),
        B(5, txt(R_L1)),
        T('②', 'ペアの考え（3分）　ちがう求め方を書こう。', 1),
        B(4, '')
      ], [F(11, planeTask)], '3:2'),
      G(1),
      WD('方法1　傾き a＝(y の{{増加量}})÷(x の{{増加量}})\n　　　1点の座標を{{代入}}して b を求める。\n方法2　2点の座標を{{それぞれ}}代入して、\n　　　a、b の{{連立方程式}}を解く。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', 'グラフが 2点 ({{−2}}, 5)、(4, {{−1}}) を通る式を求めよう。どちらの方法でもよい。', 2),
        B(7, txt(R_EX))
      ], [F(9, planeEx)], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 傾きは、(y の{{増加量}})÷(x の{{増加量}}) で求める。\n② 1点の座標を{{代入}}して、{{b}}を求める。\n③ 2点を代入して、a、b の{{連立方程式}}を解いてもよい。\n④ 変化の割合は、グラフの{{傾き}}と等しい。', 4, { label: 'ことば' }),
      C2([
        T('（1）', '2点を通る直線の傾きを求めよう。\nア (1, 3)、(4, 9)\nイ (−2, 5)、(1, −1)', 3),
        B(2, txt(R_D1))
      ], [
        T('（2）', 'グラフが 2点 (1, 2)、(3, 8) を通る一次関数の式を求めよう。', 3),
        B(4, txt(R_D2))
      ], '1:1'),
      MA('【説明】（1）（2）で使った求め方を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '2点がわかれば、式が決まる。'),
      C2([
        T('（3）', 'グラフが 2点 (1, 4)、(3, 10) を通る式を、連立方程式を使って求めよう。', 3),
        B(5, txt(R_D3))
      ], [
        T('（4）', 'グラフが 2点 (−4, 5)、(2, 2) を通る一次関数の式を求めよう。', 3),
        B(4, txt(R_D4))
      ], '1:1'),
      C2([
        T('（5）', 'ある一次関数で、x＝−3 のとき y＝8、x＝1 のとき y＝−4 である。式を求めよう。', 3),
        B(4, txt(R_D5))
      ], [
        T('（6）', 'グラフが x 軸と点 (6, 0)、y 軸と点 (0, −4) で交わる直線の式を求めよう。', 3),
        B(3, txt(R_D6))
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：2点の選び方を変えると、式は変わるだろうか。'),
      T('（7）', 'グラフ上の点（●）から 2点を選んで、この一次関数の式を求めよう。選ぶ 2点を変えると、式は変わるだろうか。', 2),
      C2([
        T('', '選んだ 2点と、求めた式を書こう。', 2),
        B(6, '')
      ], [F(9, planeThink)], '1:1'),
      C2([
        T('', '別の 2点を選んで、もう一度、求めよう。', 2),
        B(4, '')
      ], [
        T('', '気づいたこと。どの 2点を選ぶと、計算が楽になるだろう。', 2),
        B(4, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '一次関数 y＝ax+b で、x の変域が 1≦x≦4 のとき、y の変域は 3≦y≦9 である。この一次関数の式を、すべて求めよう。', 4),
        B(9, txt(R_D8))
      ], [
        MA('① a が正のときと、負のときで、x＝1 と x＝4 のときの y の値は、どうなるかな。\n② 通る 2点が決まったら、傾きと b を、順に求めよう。', 7, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '2点 (2, 1)、(5, 7) を通る直線の傾きを求めよう。（2点）', 1),
      B(2, txt(R_Q1)),
      T('（2）', 'グラフが 2点 (1, 5)、(3, 1) を通る一次関数の式を求めよう。（3点）', 1),
      B(4, txt(R_Q2)),
      T('（3）', 'x＝−4 のとき y＝1、x＝2 のとき y＝−2 である一次関数の式を求めよう。（3点）', 2),
      B(4, txt(R_Q3)),
      T('（4）', 'グラフが 2点 (−1, −3)、(2, 3) を通る一次関数の式を、連立方程式を使って求めよう。（2点）', 2),
      B(4, txt(R_Q4)),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '2点 (2, 3)、(6, 1) を通る直線 ℓ が、x 軸と交わる点の座標を求めよう。', 2),
      B(6, txt(R_QC))
    ]
  };

  // ---------------- 検算：画面の問題の文と、答えの文から、独立に確かめる ----------------
  const A_WS = ANS(DEF.ws), A_DR = ANS(DEF.dr), A_QZ = ANS(DEF.qz);
  const T_WS = TXT(DEF.ws), T_DR = TXT(DEF.dr), T_QZ = TXT(DEF.qz);
  const push = (label, body) => DEF.checks.push(chk(label, body));
  // 2点（画面の問題の文）→ 傾きを (yの差)÷(xの差)、連立方程式を行列式で、別々に解く → どちらもデータの (a, b)。答えの文の最後の式が、(a, b) で、2点を通る
  const two = (label, text, ans, d) => push(label, `const d = ${J(d)}, t = ${J(text)}, P = pts(t).length >= 2 ? pts(t) : xy(t), e = fin(${J(ans)}); if (P.length !== 2 || !e) return false; const [p, q] = P, f = x => EV(e.replace(/^y＝/, ''), { x }), g = fit(p, q), c = cramer(p, q); return near(g[0], d.a) && near(g[1], d.b) && near(c[0], d.a) && near(c[1], d.b) && near(f(p[0]), p[1]) && near(f(q[0]), q[1]) && near(ab(e)[0], d.a) && near(ab(e)[1], d.b) && d.a !== 0;`);
  two('第10時 今日の問い', T_WS[0], txt(R_L1), L1);
  two('第10時 例題', T_WS.find(t => /2点 \(\{\{−2\}\}/.test(t)), txt(R_EX), EX);
  push('第10時 今日の問い・例題の答えの文', `return rowsOK(${J(R_L1)}) && rowsOK(${J(R_EX)});`);
  // 座標平面：印刷する点・赤い直線は、データと同じ。直線は 2点を通り、枠（今日の問い −1≦x≦5・−1≦y≦8、例題 −3≦x≦5・−2≦y≦7）に入る
  push('第10時 座標平面', `const L = ${J(L1)}, E = ${J(EX)}; return [L, E].every(d => near(d.a * d.A[0] + d.b, d.A[1]) && near(d.a * d.B[0] + d.b, d.B[1])) && [L.A, L.B].every(p => p[0] >= -1 && p[0] <= 5 && p[1] >= -1 && p[1] <= 8) && [E.A, E.B].every(p => p[0] >= -3 && p[0] <= 5 && p[1] >= -2 && p[1] <= 7);`);
  // 演習（1）傾き ア・イ：画面の 2組の点から (yの差)÷(xの差)。答えの文の最後の数と一致
  push('第10時 演習（1）', `const D = ${J(D1)}, P = pts(${J(T_DR.find(t => /2点を通る直線の傾き/.test(t)))}), L = ${J(txt(R_D1))}.split('\\n'); return P.length === 4 && D.every(([p, q, a], i) => P[2 * i].join() === p.join() && P[2 * i + 1].join() === q.join() && near((q[1] - p[1]) / (q[0] - p[0]), a) && near(EV(L[i].split('＝').pop(), {}), a)) && rowsOK(${J(R_D1)});`);
  // 演習（2）〜（6）：式
  two('第10時 演習（2）', T_DR.find(t => /\(1, 2\)、\(3, 8\)/.test(t)), txt(R_D2), D2);
  two('第10時 演習（3）', T_DR.find(t => /\(1, 4\)、\(3, 10\)/.test(t)), txt(R_D3), D3);
  two('第10時 演習（4）', T_DR.find(t => /\(−4, 5\)、\(2, 2\)/.test(t)), txt(R_D4), D4);
  two('第10時 演習（5）', T_DR.find(t => /x＝−3 のとき y＝8/.test(t)), txt(R_D5), D5);
  two('第10時 演習（6）', T_DR.find(t => /x 軸と点 \(6, 0\)/.test(t)), txt(R_D6), D6);
  push('第10時 演習（2）〜（6）の答えの文', `return rowsOK(${J(R_D2)}) && rowsOK(${J(R_D3)}) && rowsOK(${J(R_D4)}) && rowsOK(${J(R_D5)}) && rowsOK(${J(R_D6)});`);
  // （6）軸との交点：x 軸との交点 (6, 0)、y 軸との交点 (0, −4)。式に代入して成り立つ
  push('第10時 演習（6）軸との交点', `const e = ${J(fin(txt(R_D6)) || 'y＝[[2/3]]x−4')}, f = x => EV(e.replace(/^y＝/, ''), { x }); return near(f(6), 0) && near(f(0), -4) && near(ab(e)[1], -4);`);
  // チャレンジ（8）：変域 1≦x≦4 のとき 3≦y≦9。a・b を総当たり（a≠0）して、答えが 2通りだけ。答えの文の式が、その 2つ
  push('第10時 チャレンジ（8）', `const A = ${J(D8)}, T = ${J(txt(R_D8))}; const all = []; for (let a = -12; a <= 12; a++) for (let b = -30; b <= 30; b++) { if (a === 0) continue; const y1 = a + b, y4 = 4 * a + b; if (Math.min(y1, y4) === 3 && Math.max(y1, y4) === 9) all.push(a + ',' + b); } const es = T.split('\\n').pop().match(/y＝[^\\s、。]+/g).map(e => ab(e).join()); return all.sort().join(' ') === '-2,11 2,1' && es.length === 2 && es.slice().sort().join(' ') === '-2,11 2,1' && A.every(([p, q, a, b]) => { const g = fit(p, q), c = cramer(p, q); return near(g[0], a) && near(g[1], b) && near(c[0], a) && near(c[1], b); }) && rowsOK(${J(R_D8)}) && /1≦x≦4/.test(${J(T_DR.find(t => /変域/.test(t)))}) && /3≦y≦9/.test(${J(T_DR.find(t => /変域/.test(t)))});`);
  // 小テスト（1）傾き（2点 (2, 1)、(5, 7)）、（2）〜（4）式、チャレンジ
  push('第10時 小テスト（1）', `const P = pts(${J(T_QZ[0])}); return P.length === 2 && near(fit(P[0], P[1])[0], ${Q1.a}) && near(EV(${J(txt(R_Q1))}.split('＝').pop(), {}), ${Q1.a}) && rowsOK(${J(R_Q1)});`);
  two('第10時 小テスト（2）', T_QZ[1], txt(R_Q2), Q2);
  two('第10時 小テスト（3）', T_QZ[2], txt(R_Q3), Q3);
  two('第10時 小テスト（4）', T_QZ[3], txt(R_Q4), Q4);
  push('第10時 小テストの答えの文', `return rowsOK(${J(R_Q2)}) && rowsOK(${J(R_Q3)}) && rowsOK(${J(R_Q4)});`);
  // 小テスト チャレンジ：(2, 3)、(6, 1) → 傾き −[[1/2]]、y＝−[[1/2]]x+4。x 軸との交点は y＝0 のとき x＝8。(8, 0) が、2点を通る直線上（(2, 3) から x が 6 増えると y は 3 減って 0）
  push('第10時 小テスト チャレンジ', `const D = ${J(QC)}, P = pts(${J(T_QZ[T_QZ.length - 1])}), g = fit(P[0], P[1]), c = cramer(P[0], P[1]); return P.length === 2 && near(g[0], D.a) && near(g[1], D.b) && near(c[0], D.a) && near(c[1], D.b) && near(D.a * D.x + D.b, 0) && near(3 + D.a * (D.x - 2), 0) && rowsOK(${J(R_QC)}) && ${J(txt(R_QC))}.split('\\n').pop() === '(8, 0)';`);
  // 小テストの得点：2＋3＋3＋2＝10
  push('第10時 小テストの配点', `return ${J(T_QZ.slice(0, 4))}.map(t => +t.match(/（(\\d+)点）/)[1]).reduce((a, c) => a + c, 0) === 10;`);
  // 考えよう（答えは載せない。ここで確かめるだけ）：直線上の格子点 4つ。どの 2点を選んでも（6通り）、同じ傾き・切片。y 軸上の点 (0, 2) を選ぶと b がそのまま読める。座標平面の枠（−4≦x≦6、−5≦y≦6）に入る。式は、どこにも載せていない
  push('第10時 考えよう', `const T = ${J(TH)}, P = T.pts; let ok = P.every(p => near(T.a * p[0] + T.b, p[1]) && p[0] >= -4 && p[0] <= 6 && p[1] >= -5 && p[1] <= 6), n = 0; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const f = fit(P[i], P[j]), c = cramer(P[i], P[j]); n++; ok = ok && near(f[0], T.a) && near(f[1], T.b) && near(c[0], T.a) && near(c[1], T.b); } return ok && n === 6 && P.some(p => p[0] === 0 && near(p[1], T.b)) && ${J(A_WS.concat(A_DR).concat(A_QZ))}.every(t => !/\\[\\[3\\/2\\]\\]x\\+2|傾き −\\[\\[3\\/2\\]\\]/.test(t)) && ${J(T_WS.concat(T_DR).concat(T_QZ))}.every(t => !/\\[\\[3\\/2\\]\\]x/.test(t));`);
  // 答えの文の中の、文字のない式（(7−3)÷(3−1)＝2 など）が、計算として正しい
  push('第10時 答えの文の計算', `const T = ${J(A_WS.concat(A_DR).concat(A_QZ))}; return T.length > 10 && T.every(arith);`);

  IK.lesson('ichiji_new-10', DEF);
})();
