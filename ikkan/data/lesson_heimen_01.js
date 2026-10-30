/* 平面図形（新しい形） 第1時：直線や角を、記号を使って表そう。
   元：授業ナビ標準版 heimen-01（例）。直線・線分・半直線のちがいを考える問い（課題）を「今日の問い」に、長方形での ∠・⊥・∥・きょり（例題2・3）を「例題」に、
   「平行な2直線の間のきょりは、どこではかっても同じか」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（ア〜ウの線のちがいを、名前と書き表し方で区別する）。個人3分 → ペア3分 → ことば → 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・数値・問題・図は新しく作り、答えは checks で別の式（座標・内積・外積・数えあげ）から出しなおした。
   検算：node tools/verify.cjs heimen-01　／　見た目：node tools/check.cjs <出力先> heimen-01 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const RED = '#d62828';

  // 図に、見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  // 矢じり（先が (x, y)、向きが ang ラジアン。画面の座標）
  const head = (h, x, y, ang, c) => [0.45, -0.45].map(d => h.ln(x, y, x - 2.4 * Math.cos(ang + d), y - 2.4 * Math.sin(ang + d), c, 0.32, ' stroke-linecap="round"')).join('');

  // 直線・線分・半直線（点 A、B を通る）
  const lineFig = kind => SVG((W, H, h) => {
    const y = H * 0.38, ax = W * 0.3, bx = W * 0.62, x0 = kind === 'line' ? 2.5 : ax, x1 = kind === 'seg' ? bx : W - 2.5;
    let s = h.ln(x0, y, x1, y, '#222', 0.32, ' stroke-linecap="round"');
    if (kind === 'line') s += head(h, 2.5, y, Math.PI, '#222');
    if (kind !== 'seg') s += head(h, W - 2.5, y, 0, '#222');
    [[ax, 'A'], [bx, 'B']].forEach(([x, n]) => { s += `<circle cx="${h.f2(x)}" cy="${h.f2(y)}" r="0.8" fill="#222"/>` + h.tx(x, y + 5.6, n, 3.1, 'middle', ' class="pl"'); });
    return s;
  });

  // 図1：4つの点。解答は、直線 AB・線分 CD・半直線 AC（赤）
  const fig1 = SVG((W, H, h) => {
    const P = { A: [0.4, 3.0], B: [4.2, 3.3], C: [1.2, 0.8], D: [5.6, 0.3] };
    const u = Math.min((W - 16) / 6, (H - 12) / 3.2), ox = (W - 5.6 * u) / 2 - 0.4 * u + 0.0, oy = H - 5;
    const X = p => ox + p[0] * u, Y = p => oy - (p[1] - 0.3) * u;
    let s = '';
    Object.keys(P).forEach(n => { s += `<circle cx="${h.f2(X(P[n]))}" cy="${h.f2(Y(P[n]))}" r="0.8" fill="#222"/>`; });
    const lab = (n, dx, dy) => h.tx(X(P[n]) + dx, Y(P[n]) + dy, n, 3.1, 'middle', ' class="pl"');
    s += lab('A', -3, -2) + lab('B', 0, -3) + lab('C', -3.4, 1) + lab('D', 3.4, 1);
    // 解答：直線 AB（両はしに矢じり）、線分 CD、半直線 AC（C をこえてのばす。先に矢じり）
    const a = P.A, b = P.B, dx = X(b) - X(a), dy = Y(b) - Y(a), L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const lx0 = 2.5, lx1 = W - 2.5, t0 = (lx0 - X(a)) / ux, t1 = (lx1 - X(a)) / ux;
    let r = h.ln(X(a) + ux * t0, Y(a) + uy * t0, X(a) + ux * t1, Y(a) + uy * t1, RED, 0.5, ' stroke-linecap="round"')
      + head(h, X(a) + ux * t1, Y(a) + uy * t1, Math.atan2(uy, ux), RED) + head(h, X(a) + ux * t0, Y(a) + uy * t0, Math.atan2(-uy, -ux), RED);
    r += h.ln(X(P.C), Y(P.C), X(P.D), Y(P.D), RED, 0.5, ' stroke-linecap="round"');
    const c = P.C, ex = X(c) - X(a), ey = Y(c) - Y(a), EL = Math.hypot(ex, ey), vx = ex / EL, vy = ey / EL, ext = 4.5;
    r += h.ln(X(a), Y(a), X(c) + vx * ext, Y(c) + vy * ext, RED, 0.5, ' stroke-linecap="round"') + head(h, X(c) + vx * ext, Y(c) + vy * ext, Math.atan2(vy, vx), RED);
    return s + h.ans(r);
  });

  // 図2：三角形 ABC。D は辺 BC の上の点。∠x（A のところ）、∠y（D のところ）
  const fig2 = GEO({
    pts: { A: [2, 4], B: [0, 0], C: [6, 0], D: [3.5, 0] }, poly: 'ABC', segs: ['AD'], dots: ['D'], pad: 8,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 270] },
    ang: [{ at: 'A', a: 'B', b: 'D', t: 'x', r: 5 }, { at: 'D', a: 'B', b: 'A', t: 'y', r: 4.5 }]
  });

  // 図3：台形 ABCD（AD∥BC、∠A＝∠B＝90°）
  const fig3 = GEO({
    pts: { A: [0, 3], B: [0, 0], C: [6, 0], D: [4, 3] }, poly: 'ABCD', pad: 9,
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45] },
    ang: [{ at: 'B', a: 'A', b: 'C', right: true }, { at: 'A', a: 'B', b: 'D', right: true }],
    txt: [{ p: [0, 1.5], t: '3cm', dx: -6 }, { p: [3, 0], t: '6cm', dy: 5.5 }, { p: [2, 3], t: '4cm', dy: -4 }]
  });

  // 例題：長方形 ABCD と対角線 AC（∠a は A のところ）
  const rect = GEO({
    pts: { A: [0, 3], B: [0, 0], C: [5, 0], D: [5, 3] }, poly: 'ABCD', segs: ['AC'], pad: 7,
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45] },
    ang: [{ at: 'A', a: 'B', b: 'C', t: 'a', r: 5 }, { at: 'B', a: 'A', b: 'C', right: true }],
    txt: [{ p: [0, 1.5], t: '3cm', dx: -7 }, { p: [2.5, 0], t: '5cm', dy: 5.5 }]
  });

  // （7）：平行な 2直線 ℓ、m（30mm はなれている。印刷そのままの大きさで、定規ではかれる）と、ℓ 上の点 P、Q、R
  const para = SVG((W, H, h) => {
    const y1 = 5, y2 = 35, xs = [W * 0.2, W * 0.5, W * 0.78];
    let s = h.ln(5, y1, W - 5, y1, '#222', 0.35, ' stroke-linecap="round"') + h.ln(5, y2, W - 5, y2, '#222', 0.35, ' stroke-linecap="round"');
    s += h.tx(W - 5, y1 - 1.6, 'ℓ', 3.2, 'end', ' class="pl"') + h.tx(W - 5, y2 - 1.6, 'm', 3.2, 'end', ' class="pl"');
    ['P', 'Q', 'R'].forEach((n, i) => { s += `<circle cx="${h.f2(xs[i])}" cy="${y1}" r="0.8" fill="#222"/>` + h.tx(xs[i], y1 + 5, n, 3.1, 'middle', ' class="pl"'); });
    return s;
  });

  // 検算の道具（checks の式の先頭にそえる）
  const LIB = 'const v=(P,Q)=>[Q[0]-P[0],Q[1]-P[1]], dot=(u,w)=>u[0]*w[0]+u[1]*w[1], cr=(u,w)=>u[0]*w[1]-u[1]*w[0], dist=(P,Q,R)=>Math.abs(cr(v(Q,R),v(Q,P)))/Math.hypot(...v(Q,R));';

  IK.lesson('heimen-01', {
    unit: 'heimen', unitName: '平面図形', form: 'new', no: '第1時', title: '直線や角を、記号を使って表そう',
    summary: '点 A、B を通る3つの線のちがいを考え、直線・線分・半直線を記号で書き分ける。角（∠）・垂直（⊥）・平行（∥）の表し方と、点と直線のきょり（垂線の長さ）をとらえる。',
    head: '平面図形　第1時',
    pitch: 8, dots: true,
    checks: [
      // 例題：長方形 ABCD（A(0,3)・B(0,0)・C(5,0)・D(5,3)）。AB⊥BC（内積 0）、AB∥DC（外積 0）、点 A と直線 BC のきょり＝3（線分 AC の長さではない）
      `(() => { ${LIB} const A=[0,3],B=[0,0],C=[5,0],D=[5,3]; return dot(v(B,A),v(B,C))===0 && cr(v(A,B),v(D,C))===0 && near(dist(A,B,C),3) && Math.hypot(...v(A,C))>3 && near(Math.hypot(...v(A,C)), Math.sqrt(34)); })()`,
      // 例題 ∠a＝∠BAC：A のところの、AB と AC のあいだの角（約59°）は、∠CAB と同じ角
      `(() => { ${LIB} const A=[0,3],B=[0,0],C=[5,0]; const t=(P,Q)=>Math.atan2(Q[1]-P[1],Q[0]-P[0]); const a1=Math.abs(t(A,B)-t(A,C)), a2=Math.abs(t(A,C)-t(A,B)); return near(a1,a2) && near(a1*180/PI, Math.atan(5/3)*180/PI); })()`,
      // （3）（4）台形 ABCD（A(0,3)・B(0,0)・C(6,0)・D(4,3)）：AD∥BC、AB⊥BC、AB⊥AD。辺 DC は AB と垂直でも平行でもない。点 D と直線 AB のきょりは 4
      `(() => { ${LIB} const A=[0,3],B=[0,0],C=[6,0],D=[4,3]; return cr(v(A,D),v(B,C))===0 && dot(v(B,A),v(B,C))===0 && dot(v(A,B),v(A,D))===0 && dot(v(D,C),v(B,A))!==0 && cr(v(B,A),v(C,D))!==0 && near(dist(D,A,B),4); })()`,
      // （5）A、B、C がこの順に一直線上（位置 0・1・3）：半直線は、はしの点と向きで決まる。半直線 AB と同じものは 半直線 AC だけ
      `(() => { const pos={A:0,B:1,C:3}; const ray=s=>[pos[s[0]], Math.sign(pos[s[1]]-pos[s[0]])].join(); return ['AC','BA','BC','CA'].filter(r=>ray(r)===ray('AB')).join()==='AC'; })()`,
      // （6）向きの角度で考える：m が ℓ に垂直（+90°）、n が m に垂直（さらに +90°）なら、n は ℓ と平行（180° ちがい）。ℓ∥m、m∥n なら ℓ∥n
      `(() => { const l=25, m=l+90, n=m+90, par=(a,b)=>((a-b)%180+180)%180===0; return par(n,l) && !par(m,l) && par(l,l) && par(l+0,l+0); })()`,
      // （7）考えよう：平行な直線（y＝0 と y＝30）の間のきょりは、ℓ 上のどの点から測っても 30
      `(() => { ${LIB} return [10,40,70].map(x=>dist([x,30],[0,0],[1,0])).every(d=>near(d,30)); })()`,
      // （8）5点：線分は 2点の組＝10 本、半直線は（はしの点、通る点）の順序つきの組＝20 本
      `(() => { const P=[...'ABCDE']; const seg=P.flatMap((p,i)=>P.slice(i+1).map(q=>p+q)).length, ray=P.flatMap(p=>P.filter(q=>q!==p).map(q=>p+q)).length; return seg===10 && ray===20 && near(5*4/2,10) && near(5*4,20); })()`,
      // 小テスト（2）AB＝3、BC＝8 の長方形：点 A と辺 BC のきょり 3　（3）AD∥BC
      `(() => { ${LIB} const A=[0,3],B=[0,0],C=[8,0],D=[8,3]; return near(dist(A,B,C),3) && cr(v(A,D),v(B,C))===0 && dot(v(B,A),v(B,C))===0; })()`,
      // 小テスト（5）チャレンジ：A(0,0)・B(1,0)・C(3,0) は一直線上、D(1,2) は外。2点を通る直線を、式（ax+by+c＝0）で区別して数えると 4本
      `(() => { const P=[[0,0],[1,0],[3,0],[1,2]], set=new Set(); for(let i=0;i<4;i++) for(let j=i+1;j<4;j++){ const [x1,y1]=P[i], [x2,y2]=P[j]; let a=y2-y1, b=x1-x2, c=-(a*x1+b*y1); const g=Math.hypot(a,b); a/=g; b/=g; c/=g; if(a<0||(a===0&&b<0)){a=-a;b=-b;c=-c;} set.add([a,b,c].map(t=>Math.round(t*1e6)/1e6+0).join()); } return set.size===4 && near(1+3,4); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('直線や角を、記号を使って表そう'),
      K('今日の問い', 'ア〜ウは、どれも点 A、B を通る線である。3つのちがいがわかるように、それぞれの名前と、書き表し方を考えよう。', 2),
      F(3, cap(lineFig('line'), 'ア'), cap(lineFig('seg'), 'イ'), cap(lineFig('ray'), 'ウ')),
      T('①', '自分の考え（3分）　ア〜ウのちがいと、書き表し方を書こう。', 1),
      B(3, '（例）ア … 両方向に限りなくのびている　→　直線 AB\nイ … A から B までだけ　→　線分 AB\nウ … A から B の方向にのびている　→　半直線 AB'),
      T('②', 'ペアの考え（3分）　自分とちがう書き表し方・気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('{{直線}} AB … 両方向にのびる線\n{{線分}} AB … A から B までの部分\n{{半直線}} AB … A から B の方向にのびる線\n∠ABC … {{頂点}}をまん中に書く角', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '長方形 ABCD に、対角線 AC をひいた。垂直は ⊥、平行は ∥ で表すことにして、表を完成させよう。', 2),
      F(4, rect),
      TB('', null, [
        ['(1) ∠a を、A、B、C で表す', ['∠{{BAC}}']],
        ['(2) 辺 AB と辺 BC の関係', ['AB{{⊥}}BC']],
        ['(3) 辺 AB と辺 DC の関係', ['AB{{∥}}DC']],
        ['(4) 点 A と辺 BC のきょり', ['{{3}}cm']]
      ], { hw: 70 }),
      T('', '【きょりのくふう】点 A と辺 BC のきょりは、線分 AC の長さではない。なぜだろう。', 2),
      B(2, 'きょりは、点から直線にひいた垂線の長さ。\nAB は BC に垂直だから、AB の長さ 3cm がきょりになる。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 両方向に限りなくのびる線を{{直線}}、A から B までの部分を{{線分}}という。\n② A から B の方向に限りなくのびる線を{{半直線}} AB という。\n③ 角は、{{頂点}}をまん中にして、∠ABC のように書く。\n④ 点から直線にひいた{{垂線}}の長さを、点と直線の{{きょり}}という。', 4, { label: 'ことば' }),
      F(5, cap(fig1, '図1'), cap(fig2, '図2'), cap(fig3, '図3')),
      C2([
        T('（1）', '図1に、直線 AB、線分 CD、半直線 AC をかこう。', 2),
        B(2, '図1の赤い線\n（半直線 AC は、C をこえてのばす）')
      ], [
        T('（2）', '図2で、∠x、∠y を、A、B、C、D を使って表そう。', 2),
        B(2, '∠x＝∠BAD　　∠y＝∠ADB\n（∠DAB、∠BDA でもよい）')
      ], '1:1'),
      MA('【説明】半直線 AB と半直線 BA は、どこがちがうか。隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '記号を使って、図形の関係を表そう。'),
      C2([
        T('（3）', '図3の台形 ABCD で、平行な辺と、辺 AB に垂直な辺を、記号で表そう。', 3),
        B(3, '平行 … AD∥BC\n垂直 … AB⊥BC、AB⊥AD')
      ], [
        T('（4）', '図3で、点 D と辺 AB のきょりは、何 cm か。', 3),
        B(3, '4cm（辺 AD の長さ。\nAD は AB に垂直）')
      ], '1:1'),
      C2([
        T('（5）', 'A、B、C は、この順に一直線上にある。半直線 AC、半直線 BA、半直線 BC のうち、半直線 AB と同じものを答えよう。', 5),
        B(1, '半直線 AC')
      ], [
        T('（6）', '同じ平面上の直線 ℓ、m、n がある。① ℓ∥m、m∥n　② ℓ⊥m、m⊥n のとき、ℓ と n の関係を、それぞれ記号で表そう。', 5),
        B(2, '① ℓ∥n\n② ℓ∥n')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：平行な2直線の間のきょりを、調べよう。'),
      T('（7）', '図の直線 ℓ、m は平行である。ℓ 上の点 P、Q、R から m に垂線をひき、その長さをはかって、表にまとめよう。どんなことに気づくだろう。', 3),
      F(5, para),
      TB('点', ['P', 'Q', 'R'], [['m までのきょり（mm）', ['', '', '']]], { hw: 52 }),
      C2([
        T('', '気づいたこと', 1),
        B(6, '')
      ], [
        T('', 'なぜそうなるのか、図に線をかき入れて説明しよう', 2),
        B(5, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', 'どの3点も一直線上にない 5つの点 A、B、C、D、E がある。\n① 2点を結ぶ線分は、全部で何本ひけるか。\n② 一方の点から、もう一方の点の方向にのびる半直線は、全部で何本ひけるか。（半直線 AB と半直線 BA は、別のものとする。）', 9),
        B(4, '① 点の組は 5×4÷2＝10　　10本\n② どの点からも、ほかの 4点の方向に\n　 4本ずつ　5×4＝20　　20本')
      ], [
        MA('① 線分 AB と線分 BA は、同じかな。半直線 AB と半直線 BA は、どうかな。\n② 点 A を、はしの点にする半直線は、何本あるかな。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次を、記号を使って表そう。（3点）\nア 直線 PQ と直線 RS は垂直である。\nイ 直線 PQ と直線 RS は平行である。\nウ 点 Q を頂点とし、辺 QP と辺 QR がつくる角', 4),
      B(2, 'ア PQ⊥RS　　イ PQ∥RS　　ウ ∠PQR'),
      T('（2）', '長方形 ABCD で、AB＝3cm、BC＝8cm である。\n点 A と辺 BC のきょりを求めよう。（2点）', 2),
      B(2, '3cm（線分 AB の長さ）'),
      T('（3）', '（2）の長方形で、辺 AD と平行な辺を、記号を使って表そう。（2点）', 2),
      B(2, 'AD∥BC'),
      T('（4）', '半直線 PQ と半直線 QP は、どこがちがうか。（3点）', 1),
      B(3, '半直線 PQ は、P から Q の方向にのびる線。\n半直線 QP は、Q から P の方向にのびる線。\n（はしの点と、のびる方向がちがう）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '4つの点 A、B、C、D があり、A、B、C は一直線上にあり、D はその直線上にない。2点を通る直線は、全部で何本ひけるか。', 3),
      B(4, '直線 ABC が 1本\nD と A、B、C を結ぶ直線が 3本\n合わせて 1+3＝4（本）')
    ]
  });
})();
