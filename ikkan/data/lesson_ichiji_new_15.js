/* 一次関数（新しい形） 第15時：3つの料金プランを、グラフでくらべよう。 元：lesson_ichiji_15.js（授業ナビ ichiji の第15時）を、次のように組みかえた。活動型（活用：グラフで判断）。
   ・ワークシートは A4 1枚（約12分）：今日の問い＝市民プールの 3つのプラン（A：1回 300円、B：月会費 600円＋1回 100円、C：月会費 1400円で何回でも）。プランの表と、3つのグラフは全部印刷（縦の 1目もり＝100円）。
     月に何回利用するなら、どのプランがいちばん得か。個人3分（3つの式と、回数ごとに安いプラン）→ ペア3分 → ことば（下にあるほど安い・交点・連立方程式）→ 例題（2回・5回・10回の料金を式で求めて表にまとめ、グラフと合うか見る）。
     交点（3回・8回）の赤い印は、解答のときだけ出る。
   ・演習プリントは表裏：表＝確かめる 2問（自転車・コピー）・使ってみる 4問（印刷・体育館・水そう・交点から式を求める）／
     裏＝ひろげる（元の考えよう：B の月会費が 800円に上がったら、グラフと、B がいちばん安い回数はどう変わるか。3つのグラフは印刷。答えなし）・チャレンジ★★（元の応用（5）：兄が弟を追いかける。ヒントカードつき）。
   ・現実にあう数字に見直した：元の入試（6）の携帯電話「通話 1分 100円・200円」は、あまりに高いので使わない。新しく、体育館（1回 400円／月会費 1200円＋1回 200円）、
     交点から式を求める問題（基本料金なしのプラン P と、基本料金 600円のプラン Q。5回で 1000円）を作った。元の追いかけは、弟を分速 50\\m → 60\\m（ふつうの歩く速さ）、兄を分速 150\\m → 自転車で 180\\m に変えた（追いつくのは 6分後・360\\m）。
     小テストのチャレンジの C 店「1枚 5円」は安すぎるので、C 店を「会員料 450円と 1枚 10円」にした（B がいちばん安いのは 21〜29枚で、元と同じ答え）。元の水そう・コピー・印刷・自転車・写真の数字は、そのまま。
   ・考えようの答え（B のグラフは上へ平行に動く／交点は x＝4 と 6／B がいちばん安いのは 5回だけ）は、どこにも書かない。ことばにも、「グラフが動く」ことは書かない。
   ・元の基礎（1）の「グラフをかく」・応用（4）の「P が空になったときの Q」・入試（6）のグラフ読みとりは、紙面に入らないので、演習プリントからはぬいた（グラフは、ワークシートと（7）で使う）。
   ・checks：問題の文（画面）から数を取り出し、回数・時間・量を 1つずつ数えて（しらみつぶし）、同じになる点・いちばん安いプランを調べ直した。例題の表は、行の見出しの式に回数を入れて、表の数と照らす。
     図の 3本の直線は、式（円）から 100円を 1目もりにして出し直した。手で書いた答えの文の、文字のない式は、計算として正しいか確かめた。
   検算：node tools/verify.cjs ichiji_new-15　／　見た目：node tools/check.cjs <出力先> ichiji_new-15 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, CO, SVG } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     best(fs, x)：回数 x のとき、料金がいちばん安いプランの名前（同じなら「＝」でつなぐ）。fs＝{ 名前: x → 料金 }
     EV：画面に出す式の書き方（[[A/B]]・×・÷・−）のまま、文字に数を入れて計算する　arith：答えの文の中の、文字のない式を計算する
     nums：文から数を取り出す　scanV：答えの文の「…＝…」を、文字に値 v を入れて、すべて成り立つか */
  const best = (fs, x) => { const v = Object.keys(fs).map(k => [k, fs[k](x)]), m = Math.min(...v.map(p => p[1])); return v.filter(p => p[1] === m).map(p => p[0]).join('＝'); };
  const EV = (s, v) => {
    let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))');
    t = t.replace(/([a-z])\^(\d)/g, '($1**$2)').replace(/([0-9a-z)])(?=[a-z(])/g, '$1*');
    const ks = [...new Set(t.match(/[a-z]/g) || [])];
    return new Function(...ks, 'return ' + t)(...ks.map(k => (v && k in v ? v[k] : 1)));
  };
  const arith = t => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝') && !/[a-z]/.test(u)).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || p.map(s => EV(s, {})).every(v => near(v, EV(p[0], {}))); });
  const scanV = (t, v) => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝')).every(u => { const p = u.split('＝').filter(s => s !== '').map(s => EV(s, v)); return p.length > 1 && p.every(w => near(w, p[0])); });
  const LIB = 'const best = ' + best + '; const EV = ' + EV + '; const arith = ' + arith + '; const scanV = ' + scanV + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const TXT = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'text' || b.type === 'kadai') o.push(b.text); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const TABS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'table') o.push(b); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };

  /* 座標平面 CO に、白い地つきの字を足す（目もりの線にかさなって読みにくいのを防ぐ）。
     labs：[{ t：字, at：[x, y], anchor, ans：false なら生徒用にも出す（黒）。省略なら、解答を表示したときだけ（赤） }] */
  const PLANE = (o, labs) => {
    const fig = CO(o);
    return SVG((W, H, h) => {
      const u = Math.min((W - 13) / (o.xmax - o.xmin), (H - 13) / (o.ymax - o.ymin)), ox = 6 + (W - 13 - u * (o.xmax - o.xmin)) / 2, oy = 7 + (H - 13 - u * (o.ymax - o.ymin)) / 2;
      const X = x => ox + (x - o.xmin) * u, Y = y => oy + (o.ymax - y) * u;
      const lab = l => {
        const w = IK.render.emOf(l.t.replace(/\{\{|\}\}|\\/g, '')) * 3 * 0.62 + 1.4, x = X(l.at[0]), a = l.anchor || 'start', x0 = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x;
        return `<rect x="${(x0 - 0.5).toFixed(2)}" y="${(Y(l.at[1]) - 2.7).toFixed(2)}" width="${w.toFixed(2)}" height="3.9" fill="#fff"/>` + h.rich(x, Y(l.at[1]), l.t, 3, a);
      };
      const g = labs.filter(l => l.ans === false).map(lab).join(''), r = labs.filter(l => l.ans !== false).map(lab).join('');
      return fig.svg(W, H, h) + g + (r ? h.ans(r) : '');
    });
  };

  /* ---------------- 問題のデータ（料金 y は円。座標平面では、縦の 1目もり＝100円） ---------------- */
  // 学習課題・例題・考えよう：市民プールの 3つのプラン
  const PA = x => 300 * x, PB = x => 100 * x + 600, PC = () => 1400;
  const PB2 = x => 100 * x + 800;   // 考えよう：B の月会費が 800円に上がる
  const planFig = (labs, more) => PLANE(Object.assign({ xmin: 0, xmax: 10, ymin: 0, ymax: 16, labelStep: 1, given: { lines: [{ a: 3, b: 0 }, { a: 1, b: 6 }, { a: 0, b: 14 }] } }, more || {}),
    [{ t: 'A', at: [4.0, 14.9], ans: false }, { t: 'B', at: [8.4, 15.9], ans: false }, { t: 'C', at: [9.1, 12.7], ans: false }].concat(labs || []));
  const FIG_TASK = planFig([], { vlines: [{ x: 3, from: 0, to: 9 }, { x: 8, from: 0, to: 14 }], points: [{ x: 3, y: 9 }, { x: 8, y: 14 }] });
  const FIG_THINK = planFig([]);
  // 確かめる（1）自転車、（2）コピー　使ってみる（3）印刷、（4）体育館、（5）水そう、（6）交点から式　チャレンジ（8）追いかけ
  const D1 = { A: x => 200 * x, B: x => 100 * x + 400 }, D2 = { A: x => 10 * x, B: x => 5 * x + 200 };
  const D3 = { X: x => 200 * x + 3000, Y: x => 350 * x }, D4 = { A: x => 400 * x, B: x => 200 * x + 1200 };
  // 小テスト：写真の焼き増し　A 店 y＝30x、B 店 y＝15x+300、チャレンジ C 店 y＝10x+450
  const QA = x => 30 * x, QB = x => 15 * x + 300, QC = x => 10 * x + 450;

  // 手で書いた答え
  const T_TASK = '（例）A y＝300x\nB y＝100x+600　C y＝1400\n1〜2回 A、3回 A＝B、4〜7回 B\n8回 B＝C、9回以上 C';
  const T_EX = 'どの月も、グラフでいちばん下の線のプランと、同じになった。\n料金　2回 A 600円　　5回 B 1100円　　10回 C 1400円';
  const S1 = 'A 店 y＝200x　B 店 y＝100x+400\n200x＝100x+400\nx＝4　　4時間';
  const S2 = 'A 店 10×60＝600（円）\nB 店 5×60+200＝500（円）\nB 店が安い';
  const S3 = 'X 社 y＝200x+3000　Y 社 y＝350x\n200x+3000＝350x\nx＝20　　20冊';
  const S4 = '一般 y＝400x　会員 y＝200x+1200\n400x＝200x+1200\nx＝6　　6回';
  const S5 = 'P y＝−2x+50　Q y＝3x\n−2x+50＝3x\nx＝10　　10分後';
  const S6 = 'P y＝ax　1000＝a×5　a＝200\nQ y＝cx+600　1000＝c×5+600\n　c＝80\nP y＝200x　Q y＝80x+600';
  const S8 = '① 弟 y＝60x、兄 y＝180(x−4)\n② 60x＝180(x−4)\n　 120x＝720　x＝6\n　 y＝60×6＝360\n　 6分後、360\\m の地点';

  const DEF = {
    unit: 'ichiji_new', unitName: '一次関数（新しい形）', form: 'new', no: '第15時', title: '3つの料金プランを、グラフでくらべよう',
    summary: '料金プランの式をグラフに表し、グラフの上下と交点から、回数ごとにいちばん得なプランを決める。考えようは、B の月会費が上がったとき、グラフと交点はどう動くか。',
    head: '一次関数　第15時',
    pitch: 8, dots: true,
    checks: [],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('3つの料金プランを、グラフでくらべよう'),
      K('今日の問い', '市民プールの 3つのプラン（表）で、1か月に x回利用したときの料金を y円とする。右の図は 3つのグラフ（縦の 1目もりは 100円）。月に何回利用するなら、どのプランがいちばん得だろう。', 3),
      C2([
        TB('プラン', ['A', 'B', 'C'], [['月会費', ['なし', '600円', '1400円']], ['1回ごと', ['300円', '100円', 'なし']]], { hw: 24 }),
        T('①', '自分の考え（3分）　3つの式と、回数ごとに安いプランを書こう。', 2),
        B(4, T_TASK),
        T('②', 'ペアの考え（3分）　安いプランの決め方を、見くらべよう。', 2),
        B(3, '')
      ], [F(14, FIG_TASK)], '3:2'),
      G(1),
      WD('グラフが{{下}}にあるプランほど、料金は安い。\n2つのグラフの{{交点}}では、料金が{{同じ}}。\n交点は、{{連立方程式}}を解いても求められる。', 3, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', 'ゆうきさんは、月に {{2}}回、{{5}}回、{{10}}回、プールを利用する月がある。それぞれ、どのプランが得だろう。式で料金を求めて、表にまとめよう。', 2),
      TB('利用する回数', ['2回', '5回', '10回'], [
        ['A　y＝300x', ['{{600}}', '{{1500}}', '{{3000}}']],
        ['B　y＝100x+600', ['{{800}}', '{{1100}}', '{{1600}}']],
        ['C　y＝1400', ['1400', '1400', '1400']],
        ['いちばん安いプラン', ['{{A}}', '{{B}}', '{{C}}']]
      ], { hw: 46, width: 80 }),
      B(2, T_EX)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① グラフが{{下}}にあるプランほど、料金が安い。\n② 2つのグラフの{{交点}}では、2つのプランの料金が{{同じ}}になる。\n③ 交点の x 座標は、2つの式を{{連立方程式}}として解いて求められる。\n④ y＝ax+b の b は、0回のときの料金で、{{基本料金}}を表す。', 4, { label: 'ことば' }),
      C2([
        T('（1）', 'A 店は 1時間 200円、B 店は 基本料金 400円と 1時間 100円の自転車店。料金が同じになるのは何時間のときか。（x時間の料金を y円とする）', 4),
        B(3, S1)
      ], [
        T('（2）', 'コピーは、A 店が 1枚 10円、B 店が 会員料 200円と 1枚 5円。60枚とるとき、安いのはどちらの店か。', 4),
        B(3, S2)
      ], '1:1'),
      MA('【説明】（1）で、グラフの交点が何を表すか、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '式を等しいとおいて、求めよう。'),
      C2([
        T('（3）', '文集の印刷は、X 社が 基本料金 3000円と 1冊 200円、Y 社が 1冊 350円。同じ料金になるのは何冊のときか。（x冊の料金を y円）', 4),
        B(3, S3)
      ], [
        T('（4）', '市民体育館のトレーニング室は 1回 400円。会員は 月会費 1200円と 1回 200円。同じ料金になるのは月に何回か。（x回の料金を y円）', 4),
        B(3, S4)
      ], '1:1'),
      C2([
        T('（5）', '水そう P には水が 50L あり、毎分 2L ぬく。Q は空で、毎分 3L 入れる。水の量が等しくなるのは何分後か。（x分後の水の量を y L）', 4),
        B(3, S5)
      ], [
        T('（6）', 'P は基本料金なし、Q は基本料金 600円のプラン。どちらも 1回ごとの料金は一定で、5回利用すると、どちらも 1000円。P、Q の式を求めよう。', 4),
        B(4, S6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：条件が変わったとき、グラフはどう動くか考えよう。'),
      T('（7）', 'プールの B の月会費が、600円から 800円に上がった。B のグラフは、どう動くだろう。B がいちばん安い回数は、どう変わるだろう。', 2),
      C2([
        T('', '新しい B の式を書き、グラフを右の図にかこう。', 2),
        B(2, ''),
        T('', 'B がいちばん安い回数の変わり方を、予想しよう。', 2),
        B(4, '')
      ], [F(10, FIG_THINK)], '3:2'),
      T('', '式や表を使って、予想を確かめよう。', 1),
      B(4, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '弟が分速 60\\m で歩いて家を出た 4分後に、兄が自転車で分速 180\\m で追いかけた。弟が出発して x分後の、家からの道のりを y \\m とする。\n① 弟、兄の式を書こう。\n② 兄が追いつくのは、弟が出発して何分後か。また、家から何\\m の地点か。', 8),
        B(5, S8)
      ], [
        MA('① 兄が家を出るのは、弟が出発して何分後かな。兄が歩きはじめてから進んだ時間は、x を使うとどう表せるかな。\n② 追いつくとき、2人の家からの道のりは、どうなっているかな。', 8, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('', '写真を焼き増しする。A 店は 1枚 30円。B 店は、会員料 300円と、1枚 15円。x枚（x は整数）焼き増しするときの料金を y円とする。', 2),
      T('（1）', 'A 店、B 店の式を書こう。（2点）', 1),
      B(2, 'A 店 y＝30x　　B 店 y＝15x+300'),
      T('（2）', '2つの店の料金が同じになるのは、何枚のときか。（3点）', 1),
      B(3, '30x＝15x+300　　15x＝300　　x＝20　　20枚'),
      T('（3）', '50枚焼き増しするときは、どちらの店が安いか。そのときの料金も答えよう。（3点）', 2),
      B(3, 'A 店 30×50＝1500（円）　　B 店 15×50+300＝1050（円）\nB 店が安い。1050円'),
      T('（4）', 'A 店のほうが安いのは、何枚以下のときか。（2点）', 1),
      B(3, '20枚のときに同じ。それより少ないと A 店が安い。\n19枚以下'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', 'C 店は、会員料 450円と、1枚 10円である。A 店、B 店、C 店のうち、B 店がいちばん安くなるのは、何枚から何枚までか。（x は整数）', 3),
      B(6, 'B 店と C 店　15x+300＝10x+450　5x＝150　x＝30\nA 店と B 店は x＝20 で同じ。\nB が A より安い … 21枚以上　　B が C より安い … 29枚以下\n（確かめ　21枚 A 630、B 615、C 660　29枚 A 870、B 735、C 740）\n21枚から 29枚まで')
    ]
  };

  // ---------------- 検算：画面の問題の文と、答えの文から、独立に確かめる ----------------
  const A_WS = ANS(DEF.ws), A_DR = ANS(DEF.dr), A_QZ = ANS(DEF.qz);
  const T_WS = TXT(DEF.ws), T_DR = TXT(DEF.dr).map(t => t.replace(/\\/g, '')), T_QZ = TXT(DEF.qz);
  const TB_WS = TABS(DEF.ws);
  const push = (label, body) => DEF.checks.push(chk(label, body));
  // 今日の問い：画面の表（月会費・1回ごと）から 3つの式を作り、回数ごとに料金を数えて、いちばん安いプランを調べ直す。答えの文と、図の交点（3回・8回）が合う
  push('第15時 今日の問い（プラン）', `const tb = ${J(TB_WS[0])}; const num = s => +String(s).replace(/[^0-9]/g, '') || 0; const fee = tb.data[0][1].map(num), per = tb.data[1][1].map(num); const fs = { A: x => fee[0] + per[0] * x, B: x => fee[1] + per[1] * x, C: x => fee[2] + per[2] * x }; const r = []; for (let x = 1; x <= 30; x++) r.push(best(fs, x)); const e = ['A', 'A', 'A＝B', 'B', 'B', 'B', 'B', 'B＝C']; for (let x = 9; x <= 30; x++) e.push('C'); const ans = ${J(A_WS[0])}; return fee.join() === '0,600,1400' && per.join() === '300,100,0' && r.join() === e.join() && ans.includes('A y＝300x') && ans.includes('B y＝100x+600') && ans.includes('C y＝1400') && ans.includes('1〜2回 A、3回 A＝B、4〜7回 B') && ans.includes('8回 B＝C、9回以上 C') && near(fs.A(3), fs.B(3)) && near(fs.B(8), fs.C(8)) && fs.A(3) === 900 && fs.B(8) === 1400;`);
  // 座標平面（縦の 1目もり＝100円）の 3本の直線（y＝3x、y＝x+6、y＝14）は、プランの式を 100 でわったもの。交点 (3, 9)、(8, 14) は、2つの式から求めて合う。枠（0≦x≦10、0≦y≦16）に入る
  push('第15時 座標平面', `const A = ${PA}, B = ${PB}, C = ${PC}; const lines = [[3, 0], [1, 6], [0, 14]]; const f = [A, B, C]; return [0, 1, 2, 7, 10].every(x => lines.every((l, i) => near(l[0] * x + l[1], f[i](x) / 100))) && near((6) / (3 - 1), 3) && near(3 * 3, 9) && near((14 - 6) / 1, 8) && near(1 * 8 + 6, 14) && 9 <= 16 && 14 <= 16 && 8 <= 10 && 16 >= 3 * 5.33 - 1e-9 && ${J(A_WS[0])}.includes('3回');`);
  // 例題：行の見出しの式（A　y＝300x など）に回数 2・5・10 を入れて、表の数と照らす。いちばん安いプランは、表の数から選び直す
  push('第15時 例題', `const tb = ${J(TB_WS[1])}; const strip = s => String(s).replace(/\\{\\{|\\}\\}/g, ''); const xs = tb.head.map(h => parseInt(h)); const rows = tb.data.slice(0, 3); const val = rows.map(r => xs.map(x => EV(r[0].replace(/^[A-C]　y＝/, ''), { x }))); const cells = rows.map(r => r[1].map(c => +strip(c))); const low = xs.map((x, i) => 'ABC'[val.map(v => v[i]).indexOf(Math.min(...val.map(v => v[i])))]); const last = tb.data[3][1].map(strip); return xs.join() === '2,5,10' && val.every((v, i) => v.every((u, j) => near(u, cells[i][j]))) && low.join() === last.join() && last.join() === 'A,B,C' && cells[2].every(c => c === 1400) && ${J(T_EX)}.includes('2回 A 600円') && ${J(T_EX)}.includes('5回 B 1100円') && ${J(T_EX)}.includes('10回 C 1400円') && cells[0][0] === 600 && cells[1][1] === 1100 && cells[2][2] === 1400;`);
  // 考えよう（答えは載せない。ここで確かめるだけ）：B の月会費 800円。A との交点 x＝4、C との交点 x＝6（しらみつぶしで調べる）。B がいちばん安いのは 5回だけ（元は 4〜7回）
  push('第15時 考えよう', `const f1 = { A: ${PA}, B: ${PB2}, C: ${PC} }, f0 = { A: ${PA}, B: ${PB}, C: ${PC} }; const only = (fs, k) => { const a = []; for (let x = 1; x <= 30; x++) if (best(fs, x) === k) a.push(x); return a.join(); }; let ab = [], bc = []; for (let x = 0; x <= 30; x++) { if (f1.A(x) === f1.B(x)) ab.push(x); if (f1.B(x) === f1.C(x)) bc.push(x); } return ab.join() === '4' && bc.join() === '6' && only(f1, 'B') === '5' && only(f0, 'B') === '4,5,6,7' && f1.B(0) - f0.B(0) === 200 && [1, 4, 9].every(x => f1.B(x) - f0.B(x) === 200) && ${J(A_WS.concat(A_DR).concat(A_QZ))}.every(t => !/平行に|x＝4 と|5回だけ|200（円）だけ/.test(t));`);
  // 確かめる（1）自転車：画面の文から数を取り出す（A 店 200円、B 店 400円＋100円）。同じになるのは 4時間（800円）
  push('第15時 確かめる（1）', `const t = ${J(T_DR[0])}, m = t.match(/A 店は 1時間 (\\d+)円、B 店は 基本料金 (\\d+)円と 1時間 (\\d+)円/); if (!m) return false; const fs = { A: x => +m[1] * x, B: x => +m[3] * x + +m[2] }; const eq = []; for (let x = 1; x <= 50; x++) if (best(fs, x) === 'A＝B') eq.push(x); const ans = ${J(A_DR[0])}; return eq.join() === '4' && fs.A(4) === 800 && ans.includes('x＝4') && ans.includes('4時間') && scanV(ans, { x: 4, y: 800 }) && ans.includes('y＝200x') && ans.includes('y＝100x+400');`);
  // （2）コピー：A 店 1枚 10円、B 店 会員料 200円＋1枚 5円。60枚は、A 600円、B 500円で B 店が安い
  push('第15時 確かめる（2）', `const t = ${J(T_DR[1])}, m = t.match(/A 店が 1枚 (\\d+)円、B 店が 会員料 (\\d+)円と 1枚 (\\d+)円/), n = t.match(/(\\d+)枚とるとき/); if (!m || !n) return false; const fs = { A: x => +m[1] * x, B: x => +m[3] * x + +m[2] }; const ans = ${J(A_DR[1])}; return best(fs, +n[1]) === 'B' && fs.A(60) === 600 && fs.B(60) === 500 && ans.includes('600') && ans.includes('500') && ans.includes('B 店が安い') && arith(ans);`);
  // 使ってみる（3）印刷：X 社 3000円＋200円、Y 社 350円。同じになるのは 20冊（7000円）
  push('第15時 使ってみる（3）', `const t = ${J(T_DR[2])}, m = t.match(/X 社が 基本料金 (\\d+)円と 1冊 (\\d+)円、Y 社が 1冊 (\\d+)円/); if (!m) return false; const fs = { X: x => +m[1] + +m[2] * x, Y: x => +m[3] * x }; const eq = []; for (let x = 1; x <= 100; x++) if (best(fs, x) === 'X＝Y') eq.push(x); const ans = ${J(A_DR[2])}; return eq.join() === '20' && fs.X(20) === 7000 && ans.includes('x＝20') && ans.includes('20冊') && scanV(ans, { x: 20, y: 7000 }) && ans.includes('y＝200x+3000') && ans.includes('y＝350x');`);
  // （4）体育館：一般 1回 400円、会員 1200円＋200円。同じになるのは 6回（2400円）
  push('第15時 使ってみる（4）', `const t = ${J(T_DR[3])}, m = t.match(/1回 (\\d+)円。会員は 月会費 (\\d+)円と 1回 (\\d+)円/); if (!m) return false; const fs = { A: x => +m[1] * x, B: x => +m[2] + +m[3] * x }; const eq = []; for (let x = 1; x <= 60; x++) if (best(fs, x) === 'A＝B') eq.push(x); const ans = ${J(A_DR[3])}; return eq.join() === '6' && fs.A(6) === 2400 && ans.includes('x＝6') && ans.includes('6回') && scanV(ans, { x: 6, y: 2400 }) && ans.includes('y＝400x') && ans.includes('y＝200x+1200') && best(fs, 10) === 'B' && best(fs, 3) === 'A';`);
  // （5）水そう：P 50L から毎分 2L ぬく、Q 空から毎分 3L 入れる。10分後に 30L で等しい（1分ずつ数える）
  push('第15時 使ってみる（5）', `const t = ${J(T_DR[4])}, m = t.match(/P には水が (\\d+)L あり、毎分 (\\d+)L ぬく。Q は空で、毎分 (\\d+)L 入れる/); if (!m) return false; let p = +m[1], q = 0, k = 0; while (q < p) { p -= +m[2]; q += +m[3]; k++; } const ans = ${J(A_DR[4])}; return k === 10 && p === 30 && q === 30 && ans.includes('x＝10') && ans.includes('10分後') && scanV(ans, { x: 10, y: 30 }) && ans.includes('y＝−2x+50') && ans.includes('y＝3x');`);
  // （6）交点から式：5回で 1000円。P は y＝ax（1000＝5a → a＝200）、Q は y＝cx+600（1000＝5c+600 → c＝80）。1回ごとの料金を 1円きざみで走査して、ただ1つに決まる
  push('第15時 使ってみる（6）', `const t = ${J(T_DR[5])}; const m = t.match(/(\\d+)回利用すると、どちらも (\\d+)円/), b = t.match(/Q は基本料金 (\\d+)円のプラン/); if (!m || !b) return false; const n = +m[1], v = +m[2], base = +b[1]; const pa = [], qa = []; for (let a = 1; a <= 2000; a++) { if (a * n === v) pa.push(a); if (a * n + base === v) qa.push(a); } const ans = ${J(A_DR[5])}; return pa.join() === '200' && qa.join() === '80' && ans.includes('P y＝200x') && ans.includes('Q y＝80x+600') && scanV(ans, { x: 5, y: 1000, a: 200, c: 80 }) && 200 * 5 === 1000 && 80 * 5 + 600 === 1000 && base === 600;`);
  // チャレンジ（8）追いかけ：弟 分速 60 m、兄 4分後に 分速 180 m。0.01分きざみで調べると、6分後に等しく 360 m。駅（900 m）の手前
  push('第15時 チャレンジ（8）', `const t = ${J(T_DR.find(t => /兄が自転車で/.test(t)))}, m = t.match(/分速 (\\d+)m で歩いて家を出た (\\d+)分後に、兄が自転車で分速 (\\d+)m/); if (!m) return false; const v1 = +m[1], d = +m[2], v2 = +m[3]; let hit = null; for (let k = d * 100; k <= 3000; k++) { const x = k / 100; if (v2 * (x - d) >= v1 * x - 1e-9) { hit = x; break; } } const ans = ${J(A_DR[6])}; return near(hit, 6) && near(v1 * 6, 360) && near(v2 * (6 - d), 360) && 360 < 900 && ans.includes('x＝6') && ans.includes('y＝60×6＝360') && ans.includes('360') && scanV(ans, { x: 6, y: 360 }) && arith(ans) && /y\\s*m|ｍ|m とする/.test(t) && ans.includes('y＝180(x−4)') && ans.includes('y＝60x');`);
  // 小テスト：A 店 30x、B 店 15x+300。20枚で同じ（600円）。50枚は B 店（1050円）。19枚以下は A 店。チャレンジ：C 店 10x+450。B がいちばん安いのは 21〜29枚（しらみつぶし）
  push('第15時 小テスト', `const t = ${J(T_QZ[0])}, m = t.match(/A 店は 1枚 (\\d+)円。B 店は、会員料 (\\d+)円と、1枚 (\\d+)円/), c = ${J(T_QZ[T_QZ.length - 1])}.match(/C 店は、会員料 (\\d+)円と、1枚 (\\d+)円/); if (!m || !c) return false; const fs = { A: x => +m[1] * x, B: x => +m[2] + +m[3] * x }, f3 = { A: fs.A, B: fs.B, C: x => +c[1] + +c[2] * x }; const a = [], eq = [], bb = []; for (let x = 1; x <= 100; x++) { if (best(fs, x) === 'A') a.push(x); if (best(fs, x) === 'A＝B') eq.push(x); if (best(f3, x) === 'B') bb.push(x); } const ans = ${J(A_QZ.join('\\n'))}; return eq.join() === '20' && fs.A(20) === 600 && best(fs, 50) === 'B' && fs.A(50) === 1500 && fs.B(50) === 1050 && a.join() === Array.from({ length: 19 }, (_, i) => i + 1).join() && bb.join() === Array.from({ length: 9 }, (_, i) => i + 21).join() && f3.B(30) === f3.C(30) && f3.A(21) === 630 && f3.B(21) === 615 && f3.C(21) === 660 && f3.A(29) === 870 && f3.B(29) === 735 && f3.C(29) === 740 && ans.includes('19枚以下') && ans.includes('1050円') && ans.includes('21枚から 29枚まで') && ans.includes('x＝20') && ans.includes('x＝30');`);
  // 小テストの得点：2＋3＋3＋2＝10
  push('第15時 小テストの配点', `return ${J(T_QZ.slice(1, 5).map(t => +(t.match(/（(\d)点）/) || [])[1]))}.reduce((a, c) => a + c, 0) === 10;`);
  // 答えの文の中の、文字のない式（5×3＝15 など）が、計算として正しい
  push('第15時 答えの文の計算', `const T = ${J(A_WS.concat(A_DR).concat(A_QZ))}; return T.length > 10 && T.every(arith);`);

  IK.lesson('ichiji_new-15', DEF);
})();
