/* 一次関数（新しい形） 第7時：式とグラフのカードを合わせて、決め手を説明しよう（活動：カードあわせ）。
   元：data/lesson_ichiji_07.js（前の形。式カード A〜F とグラフ ①〜⑥）。活動の型（遊）なので、NEW_FORM.md (D) のとおり、活動の説明を「今日の問い」と ①② に入れ、カードの式・グラフは全部印刷した。
   ・ワークシートは A4 1枚：問いは1つ（式カード A〜D と、グラフ ①〜④ を、1つずつ合わせて、決め手を言う）。①自分の考え（3分）＝カードを合わせて決め手を書く／②ペアの考え（3分）＝組を見せ合い、迷った組の決め手を言う。
     カードは 6組 → 4組にへらした（1ページにおさめるため）。まぎらわしさは、そのまま残した：A と B は切片が同じ（1）、A と C は傾きが同じ（2）、D は原点を通る（切片 0）、B・D は右下がりで、D は傾きが分数。
     6つのグラフは、座標平面 CO の given（黒）で出し、lines（赤）は使わない。合わせる組は、教卓の解答（ワークシートの B の答え）に書く。
     例題＝グラフの直線の式を、「切片は…、傾きは…だから」の言い方で求める（y＝−[[1/2]]x+2。空欄あり）。ことばは、傾き・切片・原点を通る・平行・右上がり・右下がり。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう＝グラフから式を言い当てるとき、どこから見るか。自分のカードづくりの白い座標平面つき。答えなし）・チャレンジ★★（直線 m と x 軸・y 軸で囲まれた三角形の面積。ヒントカードつき）。
   ・小テストは元のまま（行数だけつめた）。
   ・新しく作った問題：演習プリント（1）（3）（6）（8）。答えは、画面の式を読みとって、図の直線と別の式から確かめた。
   検算：node tools/verify.cjs ichiji_new-07　／　見た目：node tools/check.cjs <出力先> ichiji_new-07 */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, TB, SVG, CO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     EV：画面に出す式の書き方（[[A/B]]・×・−）のまま、x に数を入れて計算する
     ab：「y＝…」の式から、[傾き, 切片] を取り出す　onL：点 (x, y) が、式の直線の上にあるか
     lat：式の直線が、窓（x0〜x1、y0〜y1）の中で通る、方眼の交点の数
     eqsOf：画面の文の中の「y＝…」を取り出す（式は、空白・読点・かっこの手前まで。「＝」がもう 1つあるもの（y＝…＝10）は除く） */
  const EV = (s, v) => {
    let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))');
    t = t.replace(/([a-z])\^(\d)/g, '($1**$2)').replace(/([0-9a-z)])(?=[a-z(])/g, '$1*');
    const ks = [...new Set(t.match(/[a-z]/g) || [])];
    return new Function(...ks, 'return ' + t)(...ks.map(k => (v && k in v ? v[k] : 1)));
  };
  const ab = eq => { const r = String(eq).replace(/^y＝/, ''), f = x => EV(r, { x }); return [f(1) - f(0), f(0)]; };
  const onL = (eq, x, y) => near(ab(eq)[0] * x + ab(eq)[1], y);
  const lat = (eq, x0, x1, y0, y1) => { const [a, b] = ab(eq); let n = 0; for (let x = x0; x <= x1; x++) { const y = a * x + b; if (Math.abs(y - Math.round(y)) < 1e-9 && y >= y0 - 1e-9 && y <= y1 + 1e-9) n++; } return n; };
  const eqsOf = t => (String(t).match(/y＝[^\s、。（）　]+/g) || []).filter(q => q.split('＝').length === 2);
  const LIB = 'const EV = ' + EV + '; const ab = ' + ab + '; const onL = ' + onL + '; const lat = ' + lat + '; const eqsOf = ' + eqsOf + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };

  /* ---------------- 座標平面 ---------------- */
  const WIN = { xmin: -4, xmax: 4, ymin: -4, ymax: 4 };
  const WIN3 = { xmin: -3, xmax: 3, ymin: -3, ymax: 3 };
  const WIN5 = { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };
  // 座標平面（CO）の目もりの数字・O・x・y に、白いふちをつける（格子や直線と重なっても、数字が読める）
  const halo = s => s.replace(/<text /g, '<text stroke="#fff" stroke-width="0.7" stroke-linejoin="round" paint-order="stroke" ');
  const co = (o, fo) => { const blk = CO(o); return SVG((W, H, h) => halo(blk.svg(W, H, h)), fo); };
  // 図の見出し（①・カード1 など）を、座標平面の左上（目もりの枠の左はし）に書く
  const cap = (o, text, size) => {
    const blk = CO(o);
    return SVG((W, H, h) => {
      const u = Math.min((W - 13) / (o.xmax - o.xmin), (H - 13) / (o.ymax - o.ymin)), left = 6 + (W - 13 - u * (o.xmax - o.xmin)) / 2;
      return halo(blk.svg(W, H, h)) + h.tx(left, 4.3, text, size || 3.6, 'start');
    });
  };
  const line1 = (L, text, win) => cap(Object.assign({}, win || WIN, { given: { lines: [{ a: L.a, b: L.b }] } }), text);
  // 2本の直線をのせた座標平面。線の見出し（①②…）は、線が枠から出るところの外がわに書く（右はし → 上 → 下 → 左はし の順にさがす。x・y の字や、軸の近くをさける）
  const ends = (L, win) => {
    const { a, b } = L, ok = y => y <= win.ymax + 1e-9 && y >= win.ymin - 1e-9, inX = x => x >= win.xmin - 1e-9 && x <= win.xmax + 1e-9;
    const yR = a * win.xmax + b, yL = a * win.xmin + b, xT = (win.ymax - b) / a, xB = (win.ymin - b) / a;
    if (ok(yR) && Math.abs(yR) >= 1.8) return { at: [win.xmax + 0.15, yR - 0.3], anchor: 'start' };
    if (inX(xT) && (xT < -1.4 || xT > 0.8)) return { at: [xT, win.ymax + 0.9], anchor: 'middle' };
    if (inX(xB) && Math.abs(xB) >= 1.4) return { at: [xB, win.ymin - 1.3], anchor: 'middle' };
    if (ok(yL) && Math.abs(yL) >= 1.8) return { at: [win.xmin - 0.15, yL - 0.3], anchor: 'end' };
    return { at: [win.xmax + 0.15, yR - 0.3], anchor: 'start' };
  };
  const planeN = (Ls, win) => co(Object.assign({}, win, { given: { lines: Ls.map(L => Object.assign({ a: L.a, b: L.b, text: L.text }, ends(L, win))) } }));

  /* ---------------- 問題のデータ（画面の式・図・答えは、ここから作る） ---------------- */
  const NUM = '①②③④⑤⑥⑦⑧';
  // 今日の問い：式カード A〜D（eq：画面の式。a・b：図の直線。g：合うグラフの番号）
  const CARDS = [
    { k: 'A', eq: 'y＝2x+1', a: 2, b: 1, g: 3 },
    { k: 'B', eq: 'y＝−2x+1', a: -2, b: 1, g: 1 },
    { k: 'C', eq: 'y＝2x−2', a: 2, b: -2, g: 4 },
    { k: 'D', eq: 'y＝−[[1/2]]x', a: -1 / 2, b: 0, g: 2 }
  ];
  const GR = [1, 2, 3, 4].map(i => { const c = CARDS.find(c => c.g === i); return { n: i, a: c.a, b: c.b }; });   // グラフ ①〜④ の直線
  const T_MATCH = '（例）' + CARDS.map(c => c.k + '−' + NUM[c.g - 1]).join('　') + '\n決め手　A … 切片 1、右へ 1 進むと上へ 2 進む　→　③\n決め手　D … 原点を通り、右へ 2 進むと下へ 1 進む　→　②';
  // 例題：直線の式（切片 2、右へ 2 で下へ 1）
  const EX = { eq: 'y＝−[[1/2]]x+2', a: -1 / 2, b: 2, pts: [[0, 2], [2, 1]] };
  const EXW = { xmin: -4, xmax: 4, ymin: -2, ymax: 4 };
  const T_EX = '切片は 2。右へ 2 進むと、下へ 1 進むから、傾きは −[[1/2]]。\n切片が 2、傾きが −[[1/2]] だから　' + EX.eq + '\n確かめ　(2, 1) を代入すると　−[[1/2]]×2+2＝1　○';
  // 確かめる（1）y＝−[[1/2]]x+3：右下がり、切片 3 で (0, 3)　（2）ア〜エ：平行はアとウ
  const D1 = { eq: 'y＝−[[1/2]]x+3' };
  const T_D1 = '右下がり（傾き −[[1/2]] が負の数）\n(0, 3)';
  const D2 = [['ア', 'y＝3x−1'], ['イ', 'y＝−3x+2'], ['ウ', 'y＝3x+4'], ['エ', 'y＝[[1/3]]x−1']];
  const T_D2 = 'アとウ（傾きが、どちらも 3）';
  // 使ってみる（3）図の直線 ①②：y＝3x−2、y＝−[[2/3]]x+1
  const D3 = [{ n: 1, eq: 'y＝3x−2', a: 3, b: -2 }, { n: 2, eq: 'y＝−[[2/3]]x+1', a: -2 / 3, b: 1 }];
  const T_D3 = '① 切片 −2。右へ 1 進むと上へ 3 進む　y＝3x−2\n② 切片 1。右へ 3 進むと下へ 2 進む　y＝−[[2/3]]x+1';
  // （4）そうたさんのまちがい（右へ 2、上へ 3）と、正しい点（右へ 3、上へ 2）
  const D4 = { eq: 'y＝[[2/3]]x−1', a: 2 / 3, b: -1, wrong: [2, 2], right: [3, 1] };
  const T_D4 = '傾き [[2/3]] は、右へ 3 進むと、上へ 2 進むこと。\n右へ進む量と、上へ進む量が、逆になっている。\n正しい点は (3, 1)';
  // （5）ヒントで当てる
  const D5 = { b: 3, abs: 2, ans: 'y＝−2x+3', both: ['y＝2x+3', 'y＝−2x+3'] };
  const T_D5 = '① y＝2x+3、y＝−2x+3\n② 右下がりは傾きが負の数。ヒントを 3つとも使うと、y＝−2x+3 に決まる。';
  // （6）(0, −2) を通り、右へ 2 進むと上へ 3 進む直線：y＝[[3/2]]x−2。x＝8 のとき y＝10
  const D6 = { eq: 'y＝[[3/2]]x−2', a: 3 / 2, b: -2, x8: 10 };
  const T_D6 = '切片 −2。右へ 2 進むと上へ 3 進むから、傾き [[3/2]]\ny＝[[3/2]]x−2　　x＝8 のとき　[[3/2]]×8−2＝10';
  // チャレンジ（8）直線 m：(0, −3) を通り、右へ 2 進むと上へ 1 進む。y＝[[1/2]]x−3。x 軸との交点 (6, 0)、面積 6×3÷2＝9
  const D8 = { eq: 'y＝[[1/2]]x−3', a: 1 / 2, b: -3, xi: 6, area: 9 };
  const T_D8 = '切片 −3、傾き [[1/2]] だから　y＝[[1/2]]x−3\ny＝0 のとき　0＝[[1/2]]x−3　x＝6　　(6, 0)\n底辺 6cm、高さ 3cm\n面積 6×3÷2＝9\n9cm^2';
  // 小テスト
  const Q1 = 'y＝−[[2/3]]x+4';
  const Q2 = [{ n: 1, eq: 'y＝2x−3', a: 2, b: -3 }, { n: 2, eq: 'y＝−x+2', a: -1, b: 2 }, { n: 3, eq: 'y＝[[1/3]]x+1', a: 1 / 3, b: 1 }];
  const Q3 = [['ア', 'y＝2x+5'], ['イ', 'y＝−2x−3'], ['ウ', 'y＝[[1/3]]x−1'], ['エ', 'y＝x+1']];   // ① と平行：ア　③ と y 軸上の同じ点：エ
  // チャレンジ：a＜0、b＞0 のとき y＝bx+a（傾き b＞0 → 右上がり、切片 a＜0 → 下）。ア〜エの直線（符号だけが問題）
  const QC = [['ア', 'y＝−x+2', -1, 2], ['イ', 'y＝2x+1', 2, 1], ['ウ', 'y＝x−2', 1, -2], ['エ', 'y＝−2x−1', -2, -1]];

  const DEF = {
    unit: 'ichiji_new', unitName: '一次関数（新しい形）', form: 'new', no: '第7時', title: '式とグラフのカードを合わせて、決め手を説明しよう',
    summary: '式カードとグラフを、傾きと切片を決め手にして合わせ、理由を言う。自分のカードをつくって、友達に当ててもらう。考えようは、グラフを見て式を言い当てるときの、自分の手順。',
    head: '一次関数　第7時',
    pitch: 8, dots: true,
    checks: [],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('式とグラフのカードを合わせて、決め手を説明しよう'),
      K('今日の問い', '式カード A〜D に合うグラフを、①〜④ から1つずつ選ぼう。どこを見て決めたか（決め手）も、言えるようにしよう。', 2),
      TB('', ['A', 'B', 'C', 'D'], [['式カード', CARDS.map(c => c.eq)]], { hw: 26 }),
      F(6, ...GR.map(g => line1(g, NUM[g.n - 1], WIN3))),
      T('①', '自分の考え（3分）　カードを合わせて、決め手も書こう。', 1),
      B(3, T_MATCH),
      T('②', 'ペアの考え（3分）　組を見せ合い、迷った組の決め手を言おう。', 1),
      B(2, ''),
      G(1),
      WD('y＝ax+b の a を{{傾き}}、b を{{切片}}という。\nb＝0 のとき、グラフは{{原点}}を通る。\n傾きが同じ2つの直線は、{{平行}}である。\na＞0 なら{{右上がり}}、a＜0 なら{{右下がり}}。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '右の図の直線の式を求めよう。この直線は、y 軸上の点 (0, {{2}}) を通り、そこから右へ {{2}} 進むと、下へ {{1}} 進む。', 2),
      C2([
        T('', '【式の求め方】「切片は…、傾きは…だから」の言い方で、式を書こう。', 2),
        B(4, T_EX)
      ], [
        F(6, co(Object.assign({}, EXW, { given: { lines: [{ a: EX.a, b: EX.b }] }, points: EX.pts.map(p => ({ x: p[0], y: p[1] })) })))
      ], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① y＝ax+b の a を{{傾き}}、b を{{切片}}という。\n② a＞0 のとき{{右上がり}}、a＜0 のとき{{右下がり}}のグラフになる。\n③ b＝0 のとき、グラフは{{原点}}を通る。\n④ 傾きが同じ2つの直線は、たがいに{{平行}}である。', 4, { label: 'ことば' }),
      C2([
        T('（1）', D1.eq + ' のグラフは、右上がりか、右下がりか。また、y 軸と交わる点の座標を答えよう。', 3),
        B(2, T_D1)
      ], [
        T('（2）', '次のうち、グラフが平行になる 2つを選ぼう。\nア ' + D2[0][1] + '　イ ' + D2[1][1] + '\nウ ' + D2[2][1] + '　エ ' + D2[3][1], 4),
        B(1, T_D2)
      ], '1:1'),
      MA('【説明】①〜④から 1つ選び、決め手を隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '傾きと切片を決め手にして、考えよう。'),
      C2([
        T('（3）', '右の図の直線 ①、② の式を求めよう。', 1),
        B(4, T_D3)
      ], [
        F(6, planeN(D3.map(d => ({ a: d.a, b: d.b, text: NUM[d.n - 1] })), WIN))
      ], '3:2'),
      T('（4）', 'そうたさんは、' + D4.eq + ' のグラフをかくのに、点 (0, −1) から右へ 2、上へ 3 進んだ点をとった。まちがいを説明し、正しい点を答えよう。', 2),
      B(2, T_D4),
      T('（5）', '次の 3つのヒントのすべてにあてはまる式を求めよう。\nヒント1：点 (0, 3) を通る　2：傾きの絶対値は 2　3：右下がり', 2),
      B(2, T_D5),
      T('（6）', 'y 軸上の点 (0, −2) を通り、右へ 2 進むと上へ 3 進む直線の式を求めよう。また、その直線上で x＝8 のときの y の値を求めよう。', 2),
      B(2, T_D6),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：グラフから式を言い当てるときの手順を、考えよう。'),
      T('（7）', 'グラフを見て、式を言い当てるとき、どこから見ると、早く、まちがえずに決められるだろう。自分の手順を、番号をつけて書こう。', 2),
      B(6, ''),
      T('', '【カードづくり】式を決めて、直線をかこう。（傾きと切片は、整数か、きれいな分数）式は友達にかくしておき、当ててもらおう。', 2),
      F(7, cap(WIN, 'カード 1'), cap(WIN, 'カード 2')),
      T('', '自分の式　　　カード1　y＝（　　　　　　　　）　　カード2　y＝（　　　　　　　　）', 1),
      T('', '友達の答え　　カード1　y＝（　　　　　　　　）　　カード2　y＝（　　　　　　　　）', 1),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '直線 m は、y 軸上の点 (0, −3) を通り、右へ 2 進むと上へ 1 進む。m と x 軸、y 軸で囲まれた三角形の面積を求めよう。（1 目もりを 1cm とする。）', 7),
        B(7, T_D8)
      ], [
        MA('① 直線 m の式は、どう書けるかな。\n② m と x 軸が交わる点は、y の値がいくつの点かな。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点。この時間の内容。次の時間のはじめに使う） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '一次関数 ' + Q1 + ' のグラフは、右上がりか、右下がりか。また、切片はいくつか。（2点）', 2),
      B(2, '右下がり　　切片 4'),
      C2([
        T('（2）', '右の図の直線 ①〜③ の式を求めよう。（6点）', 2),
        B(4, '① ' + Q2[0].eq + '\n② ' + Q2[1].eq + '\n③ ' + Q2[2].eq + '\n（各2点。切片と傾きを読みとれていれば 1点）')
      ], [
        F(7, co(Object.assign({}, WIN5, { given: { lines: Q2.map(q => Object.assign({ a: q.a, b: q.b, text: NUM[q.n - 1] }, ends(q, WIN5))) } })))
      ], '3:2'),
      T('（3）', '次のア〜エの一次関数のうち、グラフが ① の直線と平行なものと、グラフが ③ の直線と y 軸上の同じ点で交わるものを、選ぼう。（2点）\n　　ア ' + Q3[0][1] + '　　イ ' + Q3[1][1] + '　　ウ ' + Q3[2][1] + '　　エ ' + Q3[3][1], 3),
      B(2, '① と平行 … ア（傾きがどちらも 2）\n③ と同じ点 … エ（切片がどちらも 1）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', 'a＜0、b＞0 のとき、一次関数 y＝bx+a のグラフは、次のア〜エのどれか。傾きと切片に目をつけて、理由も書こう。', 2),
      F(6, ...QC.map(o => cap(Object.assign({}, WIN, { given: { lines: [{ a: o[2], b: o[3] }] } }), o[0]))),
      B(3, 'y＝bx+a の傾きは b、切片は a。b＞0 だから右上がり。\na＜0 だから、y 軸との交点は x 軸より下。\nウ')
    ]
  };

  /* ---------------- 検算（画面の文字列・答えの文から、図の直線と独立に確かめる） ---------------- */
  const A_WS = ANS(DEF.ws), A_DR = ANS(DEF.dr), A_QZ = ANS(DEF.qz);   // 教卓の解答（B の答え）。A_DR[0]＝（1）… A_DR[5]＝（6）、A_DR[7]＝（8）、A_QZ[0]＝（1）…
  const push = (label, body) => DEF.checks.push(chk(label, body));
  // 今日の問い：式カード A〜D。画面の式から読みとった (a, b) が、図の直線と同じ。4つの式・4つのグラフは、すべてちがう。合うグラフの番号は 1〜4 に 1つずつ
  push('第7時 今日の問い（式カードと図の直線）', `const C = ${J(CARDS)}, G = ${J(GR)}; return C.every(c => near(ab(c.eq)[0], c.a) && near(ab(c.eq)[1], c.b)) && new Set(C.map(c => c.eq)).size === 4 && new Set(G.map(g => g.a + ',' + g.b)).size === 4 && [1, 2, 3, 4].every(i => C.filter(c => c.g === i).length === 1) && C.every(c => { const g = G.find(g => g.n === c.g); return near(g.a, ab(c.eq)[0]) && near(g.b, ab(c.eq)[1]); });`);
  // どのグラフも、窓（−3〜3）の中で、方眼の交点を 2つ以上通る（傾きが読みとれる）。切片の絶対値は 2 以下（y 軸との交点が見える）
  push('第7時 今日の問い（方眼の交点・切片）', `const C = ${J(CARDS)}; return C.every(c => lat(c.eq, -3, 3, -3, 3) >= 2 && Math.abs(ab(c.eq)[1]) <= 2);`);
  // まぎらわしさ：A と B は切片が同じ（1）、A と C は傾きが同じ（2）、D は原点を通る（切片 0）、B・D は右下がり。傾きと切片の両方がそろうカードはない
  push('第7時 今日の問い（まぎらわしい組）', `const C = ${J(CARDS)}, p = k => ab(C.find(c => c.k === k).eq); return near(p('A')[1], p('B')[1]) && !near(p('A')[0], p('B')[0]) && near(p('A')[0], p('C')[0]) && !near(p('A')[1], p('C')[1]) && near(p('D')[1], 0) && p('D')[0] < 0 && p('B')[0] < 0 && p('A')[0] > 0 && p('C')[0] > 0 && C.every((c, i) => C.every((d, j) => i === j || !(near(ab(c.eq)[0], ab(d.eq)[0]) && near(ab(c.eq)[1], ab(d.eq)[1]))));`);
  // 答え「A−③ …」：画面の答えの文から、組を取り出して、式と図の直線が合う。決め手の例（A、D）も合う
  push('第7時 今日の問いの答え（組みあわせ）', `const T = ${J(A_WS[0])}, C = ${J(CARDS)}, G = ${J(GR)}, N = '①②③④', m = T.match(/[A-D]−[①-④]/g) || []; return m.length === 4 && new Set(m.map(s => s[0])).size === 4 && new Set(m.map(s => s[2])).size === 4 && m.every(s => { const c = C.find(c => c.k === s[0]), g = G.find(g => g.n === N.indexOf(s[2]) + 1); return near(g.a, ab(c.eq)[0]) && near(g.b, ab(c.eq)[1]); }) && onL('y＝2x+1', 0, 1) && onL('y＝2x+1', 1, 3) && onL('y＝−[[1/2]]x', 0, 0) && onL('y＝−[[1/2]]x', 2, -1) && /A … 切片 1、右へ 1 進むと上へ 2 進む　→　③/.test(T) && /D … 原点を通り、右へ 2 進むと下へ 1 進む　→　②/.test(T);`);
  // 例題：y＝−[[1/2]]x+2。切片 2、(0, 2) から右へ 2 進むと下へ 1（点 (2, 1)）。傾き −[[1/2]]。確かめ。答えの文の式が、図の直線と同じ
  push('第7時 例題', `const e = ${J(EX.eq)}, a = ab(e), T = ${J(A_WS[1])}; return near(a[0], -1 / 2) && near(a[1], 2) && ${J(EX.pts)}.every(p => onL(e, p[0], p[1])) && near(-(1 / 2) * 2 + 2, 1) && near(-1 / 2, a[0]) && lat(e, -4, 4, -2, 4) >= 3 && eqsOf(T).every(q => near(ab(q)[0], a[0]) && near(ab(q)[1], a[1])) && eqsOf(T).length === 1;`);
  // ひろげる（7）考えよう（答えは載せない。ここで確かめるだけ）：切片 1 の式は 2枚（A、B）、傾き 2 の式は 2枚（A、C）。切片だけ・傾きだけでは決まらない。4枚は 1枚に決まる
  push('第7時 考えよう（7）', `const C = ${J(CARDS)}; return C.filter(c => near(ab(c.eq)[1], 1)).length === 2 && C.filter(c => near(ab(c.eq)[0], 2)).length === 2 && C.every((c, i) => C.every((d, j) => i === j || ab(c.eq).join() !== ab(d.eq).join()));`);
  // 確かめる（1）y＝−[[1/2]]x+3：傾きは負（右下がり）、切片 3 → (0, 3)。答えの文と合う　（2）ア〜エの式の傾きを式から読みとり、平行になる組は ア と ウ だけ
  push('第7時 確かめる（1）（2）', `const e = ${J(D1.eq)}, a = ab(e), T = ${J(A_DR[0])}, D = ${J(D2)}, p = k => ab(D.find(d => d[0] === k)[1]), pairs = []; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pairs.push([D[i][0], D[j][0]]); const par = pairs.filter(([s, t]) => near(p(s)[0], p(t)[0])).map(q => q.join('')); return a[0] < 0 && near(a[1], 3) && /右下がり/.test(T) && /\\(0, 3\\)/.test(T) && par.join() === 'アウ' && ${J(A_DR[1])}.startsWith('アとウ');`);
  // 使ってみる（3）図の直線 ①②：式から読みとった (a, b) が、図の直線と同じ。窓の中で方眼の交点を 2つ以上通る。答えの文の式が ①② の順に合う。答えの文の「右へ□進むと上（下）へ△」も合う
  push('第7時 使ってみる（3）', `const D = ${J(D3)}, T = ${J(A_DR[2])}, q = eqsOf(T), r = [...T.matchAll(/切片 (−?\\d+)。右へ (\\d+) 進むと(上|下)へ (\\d+)/g)].map(m => ({ b: +m[1].replace('−', '-'), a: (m[3] === '上' ? 1 : -1) * +m[4] / +m[2] })); return D.every(d => near(ab(d.eq)[0], d.a) && near(ab(d.eq)[1], d.b) && lat(d.eq, -4, 4, -4, 4) >= 2) && q.length === 2 && q.every((e, i) => near(ab(e)[0], D[i].a) && near(ab(e)[1], D[i].b)) && r.length === 2 && r.every((x, i) => near(x.a, D[i].a) && near(x.b, D[i].b));`);
  // （4）y＝[[2/3]]x−1 は、(0, −1) から右へ 3、上へ 2 進んだ点 (3, 1) を通る。まちがい（右へ 2、上へ 3）の点 (2, 2) は通らない
  push('第7時 使ってみる（4）', `const D = ${J(D4)}; return onL(D.eq, 0, -1) && onL(D.eq, D.right[0], D.right[1]) && !onL(D.eq, D.wrong[0], D.wrong[1]) && D.right[0] === 3 && D.right[1] - (-1) === 2 && D.wrong[0] === 2 && D.wrong[1] - (-1) === 3 && ${J(A_DR[3])}.includes('(3, 1)');`);
  // （5）ヒント 1・2 だけなら y＝2x+3、y＝−2x+3 の 2つ。ヒント 3（右下がり）まで使うと y＝−2x+3 の 1つ。式の候補を、傾き −5〜5 の整数で全部しらべる
  push('第7時 使ってみる（5）', `const D = ${J(D5)}, q = eqsOf(${J(A_DR[4])}), c = []; for (let a = -5; a <= 5; a++) if (Math.abs(a) === D.abs) c.push(a); return c.join() === '-2,2' && D.both.length === 2 && D.both.every(e => near(ab(e)[1], D.b) && near(Math.abs(ab(e)[0]), D.abs)) && D.both.filter(e => ab(e)[0] < 0).join() === D.ans && q.length === 3 && q.slice(0, 2).join() === D.both.join() && q[2] === D.ans;`);
  // （6）(0, −2) を通り、右へ 2 進むと上へ 3 進む → 傾き [[3/2]]。y＝[[3/2]]x−2。x＝8 のとき y＝10
  push('第7時 使ってみる（6）', `const D = ${J(D6)}, a = ab(D.eq), q = eqsOf(${J(A_DR[5])}); return near(a[0], 3 / 2) && near(a[1], -2) && onL(D.eq, 0, -2) && onL(D.eq, 2, 1) && near(a[0] * 8 + a[1], D.x8) && near(3 / 2 * 8 - 2, 10) && q.length >= 1 && q.every(e => near(ab(e)[0], a[0]) && near(ab(e)[1], a[1]));`);
  // チャレンジ（8）m：(0, −3)、右へ 2・上へ 1 → y＝[[1/2]]x−3。y＝0 になる x を 0〜20 までしらべて 6。三角形 (0, 0)、(6, 0)、(0, −3) の面積を座標から計算して 9
  push('第7時 チャレンジ（8）', `const D = ${J(D8)}, a = ab(D.eq), xs = []; for (let x = 0; x <= 20; x++) if (near(a[0] * x + a[1], 0)) xs.push(x); const V = [[0, 0], [D.xi, 0], [0, a[1]]], ar = Math.abs(V[0][0] * (V[1][1] - V[2][1]) + V[1][0] * (V[2][1] - V[0][1]) + V[2][0] * (V[0][1] - V[1][1])) / 2; return near(a[0], 1 / 2) && near(a[1], -3) && xs.join() === '6' && onL(D.eq, 0, -3) && onL(D.eq, 2, -2) && near(ar, D.area) && near(6 * 3 / 2, 9) && ${J(A_DR[7])}.includes('9cm^2') && eqsOf(${J(A_DR[7])}).every(e => near(ab(e)[0], a[0]) && near(ab(e)[1], a[1]));`);
  // 小テスト（1）y＝−[[2/3]]x+4：右下がり（傾き負）、切片 4　（2）直線 ①②③：式が図の直線と同じ。方眼の交点を 2つ以上通る。答えの文の式が ①②③ の順に合う　（3）① と平行：ア（傾き 2）、③ と y 軸上の同じ点：エ（切片 1）
  push('第7時 小テスト（1）（2）（3）', `const q1 = ab(${J(Q1)}), Q = ${J(Q2)}, O = ${J(Q3)}, e2 = eqsOf(${J(A_QZ[1])}), p = k => ab(O.find(o => o[0] === k)[1]); return q1[0] < 0 && near(q1[1], 4) && Q.every(q => near(ab(q.eq)[0], q.a) && near(ab(q.eq)[1], q.b) && lat(q.eq, -5, 5, -5, 5) >= 2) && e2.length === 3 && e2.every((e, i) => near(ab(e)[0], Q[i].a) && near(ab(e)[1], Q[i].b)) && O.filter(o => near(ab(o[1])[0], ab(Q[0].eq)[0])).map(o => o[0]).join('') === 'ア' && O.filter(o => near(ab(o[1])[1], ab(Q[2].eq)[1])).map(o => o[0]).join('') === 'エ' && near(p('イ')[1], ab(Q[0].eq)[1]) && near(p('ウ')[0], ab(Q[2].eq)[0]) && /右下がり/.test(${J(A_QZ[0])}) && /切片 4/.test(${J(A_QZ[0])});`);
  // チャレンジ：a＜0、b＞0 のとき y＝bx+a は、傾き b＞0（右上がり）、切片 a＜0（x 軸より下）。ア〜エのうち、あてはまるのは ウ だけ
  push('第7時 小テスト チャレンジ', `const O = ${J(QC)}; return O.every(o => near(ab(o[1])[0], o[2]) && near(ab(o[1])[1], o[3])) && O.filter(o => o[2] > 0 && o[3] < 0).map(o => o[0]).join('') === 'ウ' && new Set(O.map(o => Math.sign(o[2]) + ',' + Math.sign(o[3]))).size === 4 && O.every(o => lat(o[1], -4, 4, -4, 4) >= 2) && /ウ$/.test(${J(A_QZ[3])});`);
  // 答えの文に出てくる「y＝…」は、すべて、式として読める
  push('第7時 答えの式の読みとり', `const T = ${J([...A_WS, ...A_DR, ...A_QZ])}; return T.every(t => eqsOf(t).every(e => ab(e).every(Number.isFinite)));`);

  IK.lesson('ichiji_new-07', DEF);
})();
