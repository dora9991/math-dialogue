/* 一次関数（新しい形） 第12時：y＝k、x＝h のグラフをかこう。 元：lesson_ichiji_12.js（授業ナビ ichiji の第12時）を、次のように組みかえた。
   ・ワークシートは A4 1枚（約12分）：今日の問い＝y＝3 のグラフはどんな形か（x の値は印刷した表で、y の値をうめ、座標平面に点をとる。数・図は全部印刷。座標平面は白紙で、解答のときだけ赤で点と直線）。
     個人3分 → ペア3分 → ことば（x 軸に平行・y 軸に平行）→ 例題（（1）x＝−2　（2）2y+6＝0。座標平面つき）。
   ・演習プリントは表裏：表＝確かめる 2問（図1にかく・図2から式を読む。図は ことばの下に横ならべ）・使ってみる 4問（形に直す／式を求める／長方形の面積／点が直線の上）／
     裏＝ひろげる（元の考えよう：2点 A(3, 1)、B(3, 5) を通る直線の式。座標平面は白紙。答えなし）・チャレンジ★★（元の入試（8）：y＝[[3/2]]x、y＝6、x＝0 の三角形。ヒントカードつき）。
   ・考えようの答え（傾きが求められない・x＝3・y＝ax+b の形で表せない）が、ほかに出ないよう、元の標準（3）の「2点 (1, 7)、(1, −2) を通る直線」は使わず、点 (−4, 5) を通る x 軸・y 軸に平行な直線にした。
     ことばにも、「y＝ax+b の形では表せない」は書かない。
   ・座標平面 CO：生徒がかく直線は lines・vlines（解答のときだけ赤）、読みとる直線は given（黒）。x＝h は vlines。図の字には白いふちをつけた。
   ・checks：直線を ax+by＝c の形にして、交点を連立方程式（行列式）で求め、四角形・三角形の面積を、頂点の座標から（座標の公式で）出し直した。方程式の解（2y+6＝0 など）は、式の値の変化から解き直す。
     手で書いた答えの文は、値を入れて成り立つか確かめた。元の数値・答えは、まちがいがなかった（変えていない）。元の応用（5）（6）・入試（7）は使わず、（6）は元の応用（6）の P だけにした。
   検算：node tools/verify.cjs ichiji_new-12　／　見た目：node tools/check.cjs <出力先> ichiji_new-12 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, CO } = IK.b;
  const J = JSON.stringify;

  /* 座標平面 CO の字（目もりの数字・点の名前・式）を、線の上に重ねて出し、白いふちをつける。
     解答のときだけ出る赤い字（ansx の中）は、そのまま ansx の中に残す（生徒用の紙には出ない）。
     cap：図の名前（図1 など）を、左上に書く */
  const COX = (o, cap) => {
    const base = CO(o), f = base.svg, re = /<text\b[^>]*>[\s\S]*?<\/text>/g;
    const halo = t => t.replace(/^<text /, '<text stroke="#fff" stroke-width="1.1" stroke-linejoin="round" paint-order="stroke" ');
    return Object.assign({}, base, {
      svg: (W, H, h) => {
        const s = f(W, H, h), gi = s.indexOf('<g class="ansx">'), head = gi < 0 ? s : s.slice(0, gi), tail = gi < 0 ? '' : s.slice(gi);
        return head.replace(re, '') + tail.replace(re, halo) + (head.match(re) || []).map(halo).join('') + (cap ? h.tx(2, 4.5, cap, 3, 'start', ' class="cap"') : '');
      }
    });
  };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     EV：画面に出す式の書き方（[[A/B]]・×・÷・−）のまま、文字に数を入れて計算する　hold：「左辺＝右辺」が成り立つか
     solve1(eq, v)：文字 v の1次方程式「左辺＝右辺」を、式の値の変化から解く（答えの数を写さない）
     isect(p, q)：直線 a x+b y＝c の [a, b, c] 2本の交点　area(P)：頂点 P（順にならぶ）の多角形の面積（座標の公式）
     scanV：答えの文の「…＝…」を、文字に値 v を入れて、すべて成り立つか　arith：文字のない「…＝…」が計算として正しいか */
  const EV = (s, v) => {
    let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))');
    t = t.replace(/([a-z])\^(\d)/g, '($1**$2)').replace(/([0-9a-z)])(?=[a-z(])/g, '$1*');
    const ks = [...new Set(t.match(/[a-z]/g) || [])];
    return new Function(...ks, 'return ' + t)(...ks.map(k => (v && k in v ? v[k] : 1)));
  };
  const hold = (s, x, y) => { const p = String(s).split('＝').map(u => EV(u, { x, y })); return p.length > 1 && p.every(v => near(v, p[0])); };
  const solve1 = (eq, v) => { const [l, r] = String(eq).split('＝'), f = t => EV(l, { [v]: t }) - EV(r, { [v]: t }); return -f(0) / (f(1) - f(0)); };
  const isect = (p, q) => { const d = p[0] * q[1] - q[0] * p[1]; return [(p[2] * q[1] - q[2] * p[1]) / d, (p[0] * q[2] - q[0] * p[2]) / d]; };
  const area = P => Math.abs(P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const scanV = (t, v) => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝')).every(u => { const p = u.split('＝').filter(s => s !== '').map(s => EV(s, v)); return p.length > 1 && p.every(w => near(w, p[0])); });
  const arith = t => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝') && !/[a-z]/.test(u)).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || p.map(s => EV(s, {})).every(v => near(v, EV(p[0], {}))); });
  const LIB = 'const EV = ' + EV + '; const hold = ' + hold + '; const solve1 = ' + solve1 + '; const isect = ' + isect + '; const area = ' + area + '; const scanV = ' + scanV + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const TXT = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'text' || b.type === 'kadai') o.push(b.text); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const blank = n => Array.from({ length: n }, () => '');
  const mn = n => String(n).replace('-', '−');

  /* ---------------- 問題のデータ（画面の式・答えの文は、ここから作る） ---------------- */
  // 今日の問い：y＝3（x＝−3、−1、0、2、4）
  const W1 = { eq: 'y＝3', xs: [-3, -1, 0, 2, 4] };
  // 例題：（1）x＝−2　（2）2y+6＝0（y＝−3）
  const EX = { v: -2, e2: '2y+6＝0', k: -3 };
  // 考えよう：A(3, 1)、B(3, 5)
  const TH = { A: [3, 1], B: [3, 5] };
  // 確かめる（1）図1：ア y＝2、イ x＝−3（かく）　（2）図2：ウ y＝−2、エ x＝2（読みとる）
  const D1 = { a: ['y', 2], i: ['x', -3] }, D2 = { u: ['y', -2], e: ['x', 2] };
  // 使ってみる（3）2y＝−8、3x−12＝0　（4）点 (−4, 5)　（5）x＝−2、3、y＝−1、2　（6）P(2a−1, a+3) が x＝5 上
  const D3 = [['2y＝−8', 'y', -4], ['3x−12＝0', 'x', 4]];
  const D4 = { p: [-4, 5] };
  const D5 = { x1: -2, x2: 3, y1: -1, y2: 2, area: 15 };
  const D6 = { a: 3, y: 6 };
  // チャレンジ（8）y＝[[3/2]]x、y＝6、x＝0 → 三角形 12
  const D8 = { a: 1.5, y: 6, area: 12 };
  // 小テスト：（1）① y＝3　② x＝−2　③ 2y+4＝0　（2）点 (−3, 2)　（3）x＝−1、4、y＝−3、1　チャレンジ y＝x、y＝5、x＝−1
  const QA = { e3: '2y+4＝0', k: -2 };
  const Q2 = { p: [-3, 2] };
  const Q3 = { x1: -1, x2: 4, y1: -3, y2: 1, area: 20 };
  const QC = { a: 1, y: 5, x: -1, area: 18 };

  // 手で書いた答え
  const T_W1 = '（例）x がどんな値でも y＝3\n点 (−3, 3)、(0, 3)、(4, 3) …\nx 軸に平行な直線になる';
  const T_EX = '（1）どの点も x 座標が −2\n　点 (−2, 0) を通り\n　y 軸に平行な直線\n（2）2y＝−6　y＝−3\n　点 (0, −3) を通り\n　x 軸に平行な直線';
  const A_D3 = 'y＝−4　　x＝4';
  const A_D5 = '横 3−(−2)＝5、縦 2−(−1)＝3\n5×3＝15（cm^2）';
  const A_D6 = '2a−1＝5　2a＝6　a＝3\ny＝3+3＝6\nP(5, 6)';
  const A_D8 = '交点　6＝[[3/2]]x　x＝4\n頂点は (0, 0)、(0, 6)、(4, 6)\n底辺 6、高さ 4\n[[1/2]]×6×4＝12（cm^2）';
  const A_Q1 = '① 点 (0, 3) を通り、x 軸に平行\n② 点 (−2, 0) を通り、y 軸に平行\n③ 2y＝−4　y＝−2\n　点 (0, −2) を通り、x 軸に平行';
  const A_Q3 = '横 4−(−1)＝5、縦 1−(−3)＝4\n5×4＝20（cm^2）';
  const A_QC = 'y＝x と y＝5 の交点は (5, 5)\ny＝x と x＝−1 の交点は (−1, −1)\ny＝5 と x＝−1 の交点は (−1, 5)\n底辺 5−(−1)＝6、高さ 5−(−1)＝6\n[[1/2]]×6×6＝18（cm^2）';

  // 座標平面（生徒がかく図は lines・vlines なし。lines・vlines・points は解答を表示したときだけ赤。given は黒）
  const planeTask = COX({
    xmin: -4, xmax: 5, ymin: -3, ymax: 5,
    lines: [{ a: 0, b: 3, text: 'y＝3', at: [3.6, 3.4], anchor: 'start' }],
    points: W1.xs.map(x => ({ x, y: 3 }))
  });
  const planeEx = COX({
    xmin: -5, xmax: 4, ymin: -5, ymax: 4,
    vlines: [{ x: EX.v, text: 'x＝−2', at: [-1.8, 3.3], anchor: 'start' }],
    lines: [{ a: 0, b: EX.k, text: 'y＝−3', at: [0.8, -2.6], anchor: 'start' }]
  });
  const planeTh = COX({ xmin: -2, xmax: 6, ymin: -1, ymax: 7 });
  const WIN = { xmin: -5, xmax: 5, ymin: -4, ymax: 4, labelStep: 2 };
  const plane1 = COX(Object.assign({}, WIN, {
    lines: [{ a: 0, b: D1.a[1], text: 'ア', at: [4.0, 2.4], anchor: 'start' }],
    vlines: [{ x: D1.i[1], text: 'イ', at: [-2.8, 3.2], anchor: 'start' }]
  }), '図1');
  const plane2 = COX(Object.assign({}, WIN, {
    given: {
      lines: [{ a: 0, b: D2.u[1], text: 'ウ', at: [4.0, -1.6], anchor: 'start' }],
      vlines: [{ x: D2.e[1], text: 'エ', at: [2.2, 3.2], anchor: 'start' }]
    }
  }), '図2');
  const planeQ = COX({
    xmin: -5, xmax: 4, ymin: -4, ymax: 4,
    lines: [{ a: 0, b: 3, text: '①', at: [3.2, 3.3], anchor: 'start' }, { a: 0, b: QA.k, text: '③', at: [3.2, -1.7], anchor: 'start' }],
    vlines: [{ x: -2, text: '②', at: [-1.8, 3.3], anchor: 'start' }]
  });

  const DEF = {
    unit: 'ichiji_new', unitName: '一次関数（新しい形）', form: 'new', no: '第12時', title: 'y＝k、x＝h のグラフをかこう',
    summary: 'y＝k のグラフは x 軸に平行、x＝h のグラフは y 軸に平行な直線になることを、点をとって確かめ、グラフをかく。考えようは、2点 A(3, 1)、B(3, 5) を通る直線の式を求められるか。',
    head: '一次関数　第12時',
    pitch: 8, dots: true,
    checks: [],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('y＝k、x＝h のグラフをかこう'),
      K('今日の問い', 'y＝3 のグラフは、どんな形になるだろう。表の x の値に対する y の値を調べ、右の座標平面に点をとって、考えよう。', 2),
      C2([
        TB('x', W1.xs.map(mn), [['y', blank(5)]], { hw: 14 }),
        T('①', '自分の考え（3分）　表をうめて、点をとって、気づいたことを書こう。', 2),
        B(4, T_W1),
        T('②', 'ペアの考え（3分）　ちがう考えを書こう。', 1),
        B(3, '')
      ], [F(12, planeTask)], '3:2'),
      G(1),
      WD('y＝k のグラフは、{{x}} 軸に平行な直線。\nx＝h のグラフは、{{y}} 軸に平行な直線。\ny＝0 は {{x}} 軸、x＝0 は {{y}} 軸のこと。', 3, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '次の方程式のグラフを、右の図にかこう。\n（1）x＝{{−2}}　　（2）2y+{{6}}＝0', 3),
        B(6, T_EX)
      ], [F(10, planeEx)], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① y＝k のグラフは、点 (0, k) を通り、{{x}} 軸に{{平行}}な直線。\n② x＝h のグラフは、点 (h, 0) を通り、{{y}} 軸に{{平行}}な直線。\n③ y＝0 のグラフは {{x}} 軸、x＝0 のグラフは {{y}} 軸。\n④ 直線 x＝4 の上の点は、どの点も {{x}} 座標が 4 である。', 4, { label: 'ことば' }),
      F(6, plane1, plane2),
      C2([
        T('（1）', '図1に、ア y＝2　イ x＝−3 のグラフをかこう。', 2),
        B(2, 'ア x 軸に平行な直線\nイ y 軸に平行な直線')
      ], [
        T('（2）', '図2の直線 ウ、エ の式を答えよう。', 2),
        B(2, 'ウ y＝−2　　エ x＝2')
      ], '1:1'),
      MA('【説明】y＝3 のグラフを、「y 座標」を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '軸に平行な直線の式を、求めよう。'),
      C2([
        T('（3）', '2y＝−8 と 3x−12＝0 を、y＝k、x＝h の形に直そう。', 3),
        B(2, A_D3)
      ], [
        T('（4）', '次の直線の式を求めよう。\n① 点 (−4, 5) を通り、x 軸に平行\n② 点 (−4, 5) を通り、y 軸に平行', 4),
        B(2, '① y＝5　　② x＝−4')
      ], '1:1'),
      C2([
        T('（5）', '4つの直線 x＝−2、x＝3、y＝−1、y＝2 で囲まれた長方形の面積を求めよう。（1目もり 1cm）', 4),
        B(2, A_D5)
      ], [
        T('（6）', '点 P(2a−1, a+3) は、直線 x＝5 の上にある。a の値と、P の座標を求めよう。', 3),
        B(3, A_D6)
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：2点を通る直線の式を、求められるか考えよう。'),
      T('（7）', '2点 A(3, 1)、B(3, 5) を通る直線の式を求めよう。前の時間の方法で、うまくいくだろうか。', 2),
      C2([
        T('', '【図】A、B を右の図にとって、直線をひこう。', 2),
        T('', '【計算】2点から、傾きを求めてみよう。どうなっただろう。', 2),
        B(6, '')
      ], [F(10, planeTh)], '1:1'),
      C2([
        T('', '気づいたこと', 1),
        B(7, '')
      ], [
        T('', 'この直線の式と、y＝ax+b の形で表せるかどうか', 2),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '3つの直線 y＝[[3/2]]x、y＝6、x＝0 で囲まれた三角形の面積を求めよう。（1目もり 1cm）', 4),
        B(5, A_D8)
      ], [
        MA('① まず、3つの頂点の座標を求めよう。y＝[[3/2]]x と y＝6 の交点は、どこかな。\n② 図をかいて、底辺と高さを決めよう。どの辺を底辺にすると、長さが求めやすいかな。', 8, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '次の方程式のグラフを、右の図にかこう。\n① y＝3　　② x＝−2　　③ 2y+4＝0　（4点）', 3),
        B(4, A_Q1)
      ], [F(8, planeQ)], '3:2'),
      T('（2）', '点 (−3, 2) を通る、次の直線の式を答えよう。\n① x 軸に平行な直線　　② y 軸に平行な直線　（3点）', 2),
      B(2, '① y＝2　　② x＝−3'),
      T('（3）', '4つの直線 x＝−1、x＝4、y＝−3、y＝1 で囲まれた長方形の面積を求めよう。（1目もり 1cm）（3点）', 2),
      B(2, A_Q3),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '3つの直線 y＝x、y＝5、x＝−1 で囲まれた三角形の面積を求めよう。（1目もり 1cm）', 2),
      B(5, A_QC)
    ]
  };

  // ---------------- 検算：画面の問題の文と、答えの文から、独立に確かめる ----------------
  const A_WS = ANS(DEF.ws), A_DR = ANS(DEF.dr), A_QZ = ANS(DEF.qz);
  const T_WS = TXT(DEF.ws), T_DR = TXT(DEF.dr), T_QZ = TXT(DEF.qz);
  const push = (label, body) => DEF.checks.push(chk(label, body));
  // 今日の問い：y＝3。表の x（5つ）に対し、y はどれも 3（式の値）。点は座標平面（−4≦x≦5、−3≦y≦5）に入り、x 座標がすべてちがう
  push('第12時 今日の問い', `const W = ${J(W1)}; const win = { xmin: -4, xmax: 5, ymin: -3, ymax: 5 }; return W.xs.every(x => hold(W.eq, x, 3) && x >= win.xmin && x <= win.xmax) && !hold(W.eq, 0, 2) && new Set(W.xs).size === 5 && 3 >= win.ymin && 3 <= win.ymax && /y＝3 のグラフ/.test(${J(T_WS[0])}) && scanV(${J(A_WS[0])}, { x: 0, y: 3 });`);
  // 例題：（1）x＝−2：y がどんな値でも点 (−2, y) は成り立つ。（2）2y+6＝0 を式の値の変化から解くと y＝−3。座標平面（−5≦x≦4、−5≦y≦4）に入る
  push('第12時 例題', `const E = ${J(EX)}, win = { xmin: -5, xmax: 4, ymin: -5, ymax: 4 }; const k = solve1(E.e2, 'y'); return near(k, -3) && near(k, E.k) && [-1, 0, 3].every(y => hold('x＝' + E.v, E.v, y)) && E.v >= win.xmin && E.v <= win.xmax && k >= win.ymin && k <= win.ymax && !hold(E.e2, 0, 3) && /x＝−2/.test(${J(T_WS.find(t => t.includes('2y+{{6}}')).replace(/\{\{|\}\}/g, ''))}) && /2y\\+6＝0/.test(${J(T_WS.find(t => t.includes('2y+{{6}}')).replace(/\{\{|\}\}/g, ''))}) && scanV(${J(A_WS[1])}, { x: -2, y: -3 });`);
  // 考えよう（答えは載せない。ここで確かめるだけ）：A(3, 1)、B(3, 5)。x の増加量 0 で傾きが求められない。直線は x＝3（x 座標がいつも 3）。座標平面（−2≦x≦6、−1≦y≦7）に A、B が入る
  push('第12時 考えよう', `const T = ${J(TH)}; const dx = T.B[0] - T.A[0], dy = T.B[1] - T.A[1]; return dx === 0 && dy === 4 && !Number.isFinite(dy / dx) && [1, 5, 8, -2].every(y => hold('x＝3', 3, y)) && [T.A, T.B].every(p => p[0] >= -2 && p[0] <= 6 && p[1] >= -1 && p[1] <= 7) && ${J(A_WS.concat(A_DR).concat(A_QZ))}.every(t => !/傾きが求められない|0 でわる|y＝ax\\+b の形では表せ/.test(t));`);
  // 確かめる（1）（2）：図1・図2の直線は、座標平面（−5≦x≦5、−4≦y≦4）に入る。ア・ウは x 軸に平行（y＝k）、イ・エは y 軸に平行（x＝h）。通る点（2点）で成り立つ
  push('第12時 確かめる（1）（2）', `const D1 = ${J(D1)}, D2 = ${J(D2)}; const win = { xmin: -5, xmax: 5, ymin: -4, ymax: 4 }; const ok = d => (d[0] === 'y' ? d[1] >= win.ymin && d[1] <= win.ymax && [-3, 4].every(x => hold('y＝' + d[1], x, d[1])) : d[1] >= win.xmin && d[1] <= win.xmax && [-2, 3].every(y => hold('x＝' + d[1], d[1], y))); return [D1.a, D1.i, D2.u, D2.e].every(ok) && D1.a[0] === 'y' && D1.i[0] === 'x' && D2.u[0] === 'y' && D2.e[0] === 'x' && /ア y＝2/.test(${J(T_DR[0])}) && /イ x＝−3/.test(${J(T_DR[0])}) && D2.u[1] === -2 && scanV(${J(A_DR[1])}, { x: 2, y: -2 }) && ${J(A_DR[1])}.includes('ウ y＝−2') && ${J(A_DR[1])}.includes('エ x＝2');`);
  // 使ってみる（3）：2y＝−8 → y＝−4、3x−12＝0 → x＝4（式の値の変化から解く）
  push('第12時 使ってみる（3）', `const D = ${J(D3)}; return D.every(([e, ax, v]) => near(solve1(e, ax), v)) && D[0][1] === 'y' && D[1][1] === 'x' && scanV(${J(A_D3)}, { x: 4, y: -4 }) && /2y＝−8/.test(${J(T_DR[2])}) && /3x−12＝0/.test(${J(T_DR[2])});`);
  // （4）点 (−4, 5)：x 軸に平行 → y＝5、y 軸に平行 → x＝−4（どちらも点を通る）
  push('第12時 使ってみる（4）', `const P = ${J(D4.p)}; return hold('y＝5', P[0], P[1]) && hold('x＝−4', P[0], P[1]) && /点 \\(−4, 5\\) を通り、x 軸に平行/.test(${J(T_DR[3])}) && /点 \\(−4, 5\\) を通り、y 軸に平行/.test(${J(T_DR[3])}) && ${J(A_DR[3])}.includes('① y＝5') && ${J(A_DR[3])}.includes('② x＝−4');`);
  // （5）x＝−2、3、y＝−1、2：頂点を交点（連立方程式）で求め、座標の公式で面積 15
  push('第12時 使ってみる（5）', `const D = ${J(D5)}; const V = [[1, 0, D.x1], [1, 0, D.x2]], H = [[0, 1, D.y1], [0, 1, D.y2]]; const P = [isect(V[0], H[0]), isect(V[1], H[0]), isect(V[1], H[1]), isect(V[0], H[1])]; return near(area(P), D.area) && D.area === 15 && /x＝−2、x＝3、y＝−1、y＝2/.test(${J(T_DR[4])}) && arith(${J(A_D5)});`);
  // （6）P(2a−1, a+3) が x＝5 上：2a−1＝5 を解くと a＝3、y 座標 a+3＝6
  push('第12時 使ってみる（6）', `const D = ${J(D6)}; const a = solve1('2a−1＝5', 'a'); return near(a, D.a) && near(a + 3, D.y) && near(2 * a - 1, 5) && scanV(${J(A_D6)}, { a: 3, y: 6 }) && /P\\(2a−1, a\\+3\\)/.test(${J(T_DR[5])}) && /x＝5/.test(${J(T_DR[5])});`);
  // チャレンジ（8）y＝[[3/2]]x、y＝6、x＝0：頂点を連立方程式で求め、座標の公式で面積 12
  push('第12時 チャレンジ（8）', `const D = ${J(D8)}; const L = [[-D.a, 1, 0], [0, 1, D.y], [1, 0, 0]]; const P = [isect(L[0], L[1]), isect(L[1], L[2]), isect(L[0], L[2])]; return near(P[0][0], 4) && near(P[0][1], 6) && near(P[1][0], 0) && near(P[1][1], 6) && near(P[2][0], 0) && near(P[2][1], 0) && near(area(P), D.area) && D.area === 12 && scanV(${J(A_D8)}, { x: 4 }) && arith(${J(A_D8)}) && /y＝\\[\\[3\\/2\\]\\]x、y＝6、x＝0/.test(${J(T_DR.find(t => /で囲まれた三角形/.test(t)))});`);
  // 小テスト（1）：y＝3、x＝−2、2y+4＝0（解くと y＝−2）。座標平面（−5≦x≦4、−4≦y≦4）に入る　（2）点 (−3, 2)：y＝2、x＝−3　（3）x＝−1、4、y＝−3、1 の長方形 20
  push('第12時 小テスト（1）〜（3）', `const A = ${J(QA)}, P = ${J(Q2.p)}, D = ${J(Q3)}; const win = { xmin: -5, xmax: 4, ymin: -4, ymax: 4 }; const k = solve1(A.e3, 'y'); const R = [isect([1, 0, D.x1], [0, 1, D.y1]), isect([1, 0, D.x2], [0, 1, D.y1]), isect([1, 0, D.x2], [0, 1, D.y2]), isect([1, 0, D.x1], [0, 1, D.y2])]; return near(k, A.k) && near(k, -2) && 3 <= win.ymax && -2 >= win.xmin && k >= win.ymin && hold('y＝2', P[0], P[1]) && hold('x＝−3', P[0], P[1]) && near(area(R), D.area) && D.area === 20 && arith(${J(A_Q3)}) && scanV(${J(A_Q1)}, { y: -2 }) && /y＝3/.test(${J(T_QZ[0])}) && /2y\\+4＝0/.test(${J(T_QZ[0])}) && /点 \\(−3, 2\\)/.test(${J(T_QZ[1])}) && /x＝−1、x＝4、y＝−3、y＝1/.test(${J(T_QZ[2])});`);
  // 小テスト チャレンジ：y＝x、y＝5、x＝−1：頂点 (5, 5)、(−1, −1)、(−1, 5) を連立方程式で求め、面積 18
  push('第12時 小テスト チャレンジ', `const D = ${J(QC)}; const L = [[-D.a, 1, 0], [0, 1, D.y], [1, 0, D.x]]; const P = [isect(L[0], L[1]), isect(L[0], L[2]), isect(L[1], L[2])]; return near(P[0][0], 5) && near(P[0][1], 5) && near(P[1][0], -1) && near(P[1][1], -1) && near(P[2][0], -1) && near(P[2][1], 5) && near(area(P), D.area) && D.area === 18 && arith(${J(A_QC)}) && /y＝x、y＝5、x＝−1/.test(${J(T_QZ[T_QZ.length - 1])});`);
  // 小テストの得点：4＋3＋3＝10
  push('第12時 小テストの配点', `return [4, 3, 3].reduce((a, c) => a + c, 0) === 10 && ${J(T_QZ.slice(0, 3).map(t => (t.match(/（(\d)点）/) || [])[1]))}.join() === '4,3,3';`);
  // 答えの文の中の、文字のない式（5×3＝15 など）が、計算として正しい
  push('第12時 答えの文の計算', `const T = ${J(A_WS.concat(A_DR).concat(A_QZ))}; return T.length > 8 && T.every(arith);`);

  IK.lesson('ichiji_new-12', DEF);
})();
