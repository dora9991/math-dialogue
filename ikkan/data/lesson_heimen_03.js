/* 平面図形（新しい形） 第3時：移動した図形をかいて、対応する点の関係を調べよう。
   元：授業ナビ標準版 heimen-03（例）。平行移動した図形をかく例題1を「今日の問い」（対応する点を結んで、気づいたことを書く）に、対称移動の例題2を「例題」に、
   「動かない点はどこか」を考えよう（演習プリント（7））にした。回転移動の性質は、ことばと演習プリントで扱う。
   ・ワークシートは A4 1枚：問いは1つ（方眼で、矢印のとおりに平行移動した図をかき、AA′・BB′・CC′ の関係に気づく）。個人3分 → ペア3分 → ことば → 例題（対称移動。表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（回転の中心を見つける。ヒントカードつき）。
   ・方眼の図は IK.b.SVG で描き、移動後の図形（解答のとき赤）は、座標の計算（平行移動・折り返し・回転）から出して、checks でも別の式で確かめた。
   検算：node tools/verify.cjs heimen-03　／　見た目：node tools/check.cjs <出力先> heimen-03 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;
  const RED = '#d62828';

  // 図に見出し（図1 など）をつける
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  // 矢じり（先が (x, y)、向きが ang ラジアン。画面の座標）
  const head = (h, x, y, ang, c) => [0.45, -0.45].map(d => h.ln(x, y, x - 2.4 * Math.cos(ang + d), y - 2.4 * Math.sin(ang + d), c, 0.32, ' stroke-linecap="round"')).join('');

  /* 図の道具：数学の座標（y が上）で、方眼（grid）・多角形（polys）・線（lines）・点（dots）・字（labels）を書く。枠におさまるように、縦横比をそのままに拡大・縮小する。
     a に同じ形で書いたものは、解答のときだけ赤で出る。labels の halo は、字の下に白い地をしいて、方眼の線の上でも読めるようにする */
  const FIG = o => SVG((W, H, h) => {
    const all = [], gather = s => { (s.lines || []).forEach(l => all.push(l.p, l.q)); (s.polys || []).forEach(pl => pl.pts.forEach(p => all.push(p))); (s.dots || []).forEach(d => all.push(d.p || d)); (s.labels || []).forEach(t => all.push(t.p)); };
    gather(o); if (o.a) gather(o.a); if (o.grid) all.push([o.grid[0], o.grid[1]], [o.grid[2], o.grid[3]]);
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), pad = o.pad == null ? 6 : o.pad;
    const s = o.scale || Math.min((W - 2 * pad) / Math.max(x1 - x0, 1e-6), (H - 2 * pad) / Math.max(y1 - y0, 1e-6));
    const ox = (W - (x1 - x0) * s) / 2 - x0 * s, oy = (H - (y1 - y0) * s) / 2 + y1 * s, X = x => ox + x * s, Y = y => oy - y * s;
    const draw = (src, c) => {
      let out = '';
      (src.polys || []).forEach(pl => { out += `<polygon points="${pl.pts.map(p => h.f2(X(p[0])) + ',' + h.f2(Y(p[1]))).join(' ')}" fill="${pl.fill || 'none'}" stroke="${pl.c || c}" stroke-width="${pl.w || 0.32}" stroke-linejoin="round"${pl.dash ? ' stroke-dasharray="1.4 1"' : ''}/>`; });
      (src.lines || []).forEach(l => {
        const ax = X(l.p[0]), ay = Y(l.p[1]), bx = X(l.q[0]), by = Y(l.q[1]), col = l.c || c, ang = Math.atan2(by - ay, bx - ax);
        out += h.ln(ax, ay, bx, by, col, l.w || 0.32, (l.dash ? ' stroke-dasharray="1.4 1"' : '') + ' stroke-linecap="round"');
        if (l.arrow === 'end' || l.arrow === 'both') out += head(h, bx, by, ang, col);
        if (l.arrow === 'both') out += head(h, ax, ay, ang + Math.PI, col);
      });
      (src.dots || []).forEach(d => { const p = d.p || d; out += `<circle cx="${h.f2(X(p[0]))}" cy="${h.f2(Y(p[1]))}" r="${d.r || 0.8}" fill="${d.c || c}"/>`; });
      (src.labels || []).forEach(t => {
        const fs = t.size || 3.1, tx = X(t.p[0]) + (t.dx || 0), ty = Y(t.p[1]) + (t.dy || 0), n = String(t.t).replace(/\{\{|\}\}/g, '').length;
        if (t.halo) { const w = n * fs * 0.66 + 1.2; out += `<rect x="${h.f2(tx - w / 2)}" y="${h.f2(ty - fs * 0.62)}" width="${h.f2(w)}" height="${h.f2(fs * 1.24)}" rx="0.6" fill="#fff"/>`; }
        out += h.rich(tx, ty + fs * 0.34, t.t, fs, t.anchor || 'middle', t.cls ? ` class="${t.cls}"` : '');
      });
      return out;
    };
    let out = '';
    if (o.grid) {
      const [gx0, gy0, gx1, gy1] = o.grid;
      for (let x = gx0; x <= gx1; x++) out += h.ln(X(x), Y(gy0), X(x), Y(gy1), '#b4c0cc', 0.15);
      for (let y = gy0; y <= gy1; y++) out += h.ln(X(gx0), Y(y), X(gx1), Y(y), '#b4c0cc', 0.15);
      out += `<rect x="${h.f2(X(gx0))}" y="${h.f2(Y(gy1))}" width="${h.f2((gx1 - gx0) * s)}" height="${h.f2((gy1 - gy0) * s)}" fill="none" stroke="#7d8b99" stroke-width="0.3"/>`;
    }
    return out + draw(o, '#222') + (o.a ? h.ans(draw(o.a, RED)) : '');
  });
  const L = (p, q, x) => Object.assign({ p, q }, x || {});
  const PR = "′";

  // 三角形の頂点の字：図形の中心から外むきに、k mm はなして書く（方眼の線の上でも読めるよう、白い地つき）
  const vlab = (pts, names, k, over) => {
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    return pts.map((p, i) => { const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1, o = (over || {})[i]; return { p, t: names[i], dx: o ? o[0] : (k || 3.8) * dx / d, dy: o ? o[1] : -(k || 3.8) * dy / d, halo: true }; });   // over＝{ 番号: [dx, dy] }：字の位置を、自分で決めたいとき
  };
  const NM = 'ABC', NM2 = ['A' + PR, 'B' + PR, 'C' + PR];
  // 三角形 pts（名前 ABC）と、移動後 q（名前 A′B′C′。解答のときだけ赤）を、方眼 grid にかく。extra は、最初から出す線・字、ansExtra は、解答の線・字
  const gridFig = (grid, pts, q, extra, ansExtra, o) => {
    const e = extra || {}, ae = ansExtra || {}, links = pts.map((p, i) => L(p, q[i], { dash: true, w: 0.3 }));
    return FIG(Object.assign({
      grid, pad: 5,
      polys: [{ pts, w: 0.5 }].concat(e.polys || []),
      lines: e.lines || [],
      dots: e.dots || [],
      labels: vlab(pts, NM, null, e.over).concat(e.labels || []),
      a: { polys: [{ pts: q, w: 0.5 }], lines: (ae.noLinks ? [] : links).concat(ae.lines || []), dots: ae.dots || [], labels: vlab(q, NM2, null, ae.over).concat(ae.labels || []) }
    }, o || {}));
  };

  /* ---- 図のデータ（点の座標。移動後は、わざと自分で書き出し、checks で計算しなおして照らす） ---- */
  // 今日の問い：平行移動（矢印は右へ6、下へ1）
  const P1 = [[1, 4], [1, 2], [3, 3]], V1 = [6, -1], Q1 = [[7, 3], [7, 1], [9, 2]];
  // 例題：直線 ℓ（x＝6）で対称移動
  const P2 = [[2, 4], [4, 1], [5, 3]], Q2 = [[10, 4], [8, 1], [7, 3]];
  // 演習 図1：平行移動（右へ4）／図2：直線 ℓ（x＝4）で対称移動／図3：点 O（4, 2）を中心に時計回りに 90° 回転移動
  const P3 = [[2, 5], [1, 3], [3, 2]], V3 = [4, 0], Q3 = [[6, 5], [5, 3], [7, 2]];
  const P4 = [[1, 5], [2, 2], [3, 4]], Q4 = [[7, 5], [6, 2], [5, 4]];
  const O5 = [4, 2], P5 = [[1, 3], [2, 1], [2, 3]], Q5 = [[5, 5], [3, 4], [5, 4]];
  // チャレンジ：回転の中心 O（4, 3）をさがす（時計回りに 90°）
  const O6 = [4, 3], P6 = [[1, 5], [1, 2], [3, 3]], Q6 = [[6, 6], [3, 6], [4, 4]];
  // 小テスト：図1 平行移動（右へ5）／図2 直線 ℓ（x＝4）で対称移動
  const P7 = [[1, 3], [1, 1], [3, 2]], Q7 = [[6, 3], [6, 1], [8, 2]];
  const P8 = [[1, 4], [2, 1], [3, 3]], Q8 = [[7, 4], [6, 1], [5, 3]];

  const axis = (x, y0, y1) => ({ lines: [L([x, y0], [x, y1], { w: 0.7 })], labels: [{ p: [x, y1], t: 'ℓ', dx: 3.2, dy: 3.4, cls: 'pl', halo: true }] });

  const figWS1 = gridFig([0, 0, 12, 6], P1, Q1, { lines: [L([2, 5], [8, 4], { arrow: 'end', w: 0.6 })] });
  const figWS2 = gridFig([0, 0, 12, 5], P2, Q2, axis(6, 0, 5));
  const fig1 = gridFig([0, 0, 8, 6], P3, Q3, { lines: [L([2, 0.8], [6, 0.8], { arrow: 'end', w: 0.6 })] });
  const fig2 = gridFig([0, 0, 8, 6], P4, Q4, axis(4, 0, 6));
  const fig3 = gridFig([0, 0, 8, 6], P5, Q5, { dots: [{ p: O5 }], labels: [{ p: O5, t: 'O', dx: 3, dy: 3, halo: true }], over: { 2: [3.8, 0.6] } }, { noLinks: true });
  const fig6 = FIG({
    grid: [0, 0, 9, 7], pad: 5,
    polys: [{ pts: P6, w: 0.5 }, { pts: Q6, w: 0.5 }],
    labels: vlab(P6, NM).concat(vlab(Q6, NM2)),
    a: { lines: [L(O6, P6[0], { dash: true }), L(O6, Q6[0], { dash: true }), L(O6, P6[1], { dash: true }), L(O6, Q6[1], { dash: true })], dots: [{ p: O6, r: 1 }], labels: [{ p: O6, t: 'O', dx: 3.2, dy: 3.2, halo: true }] }
  });
  const figQ1 = gridFig([0, 0, 9, 6], P7, Q7, { lines: [L([2, 5], [7, 5], { arrow: 'end', w: 0.6 })] });
  const figQ2 = gridFig([0, 0, 9, 6], P8, Q8, Object.assign({ over: { 2: [0, 3.8] } }, axis(4, 0, 6)), { over: { 2: [0, 3.8] } });

  // 検算の道具（checks の式の先頭にそえる）
  const GL = 'const D=Math.PI/180, mv=(p,v)=>[p[0]+v[0],p[1]+v[1]], rot=(p,c,d)=>{const t=d*D,x=p[0]-c[0],y=p[1]-c[1];return [c[0]+x*Math.cos(t)-y*Math.sin(t), c[1]+x*Math.sin(t)+y*Math.cos(t)];}, refl=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy),fx=a[0]+t*dx,fy=a[1]+t*dy;return [2*fx-p[0],2*fy-p[1]];}, same=(A,Bq)=>A.every((p,i)=>near(p[0],Bq[i][0])&&near(p[1],Bq[i][1])), v2=(p,q)=>[q[0]-p[0],q[1]-p[1]], cr=(u,w)=>u[0]*w[1]-u[1]*w[0], dot=(u,w)=>u[0]*w[0]+u[1]*w[1], len=u=>Math.hypot(u[0],u[1]);';
  const J = JSON.stringify;

  IK.lesson('heimen-03', {
    unit: 'heimen', unitName: '平面図形', form: 'new', no: '第3時', title: '移動した図形をかいて、対応する点の関係を調べよう',
    summary: '方眼で、矢印のとおりに平行移動した図形をかき、対応する点を結んでできる線分の関係に気づく。対称移動・回転移動でも、対応する点の関係（軸との関係・中心からのきょり）をとらえる。',
    head: '平面図形　第3時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：△ABC を右へ 6、下へ 1 だけ平行移動（図に書いた A′B′C′ と一致）。AA′、BB′、CC′ は、平行（外積 0）で長さが等しく、矢印と同じ向き・長さ
      `(() => { ${GL} const P=${J(P1)}, Q=${J(Q1)}, V=${J(V1)}; const links=P.map((p,i)=>v2(p,Q[i])); return same(P.map(p=>mv(p,V)),Q) && links.every(u=>near(cr(u,links[0]),0) && near(len(u),len(V)) && near(dot(u,V),len(V)**2)); })()`,
      // 例題：直線 ℓ（x＝6）での対称移動。A′B′C′ は 12−x の計算と一致。A・B・C から ℓ までは 4・2・1、A′・B′・C′ からも同じ。AA′・BB′・CC′ は ℓ と垂直（内積 0）で、ℓ に 2等分される（中点の x が 6）
      `(() => { ${GL} const P=${J(P2)}, Q=${J(Q2)}, a=[6,0], b=[6,5]; const d1=P.map(p=>Math.abs(p[0]-6)), d2=Q.map(p=>Math.abs(p[0]-6)); return same(P.map(p=>refl(p,a,b)),Q) && d1.join()==='4,2,1' && d2.join()===d1.join() && P.every((p,i)=>near(dot(v2(p,Q[i]),v2(a,b)),0) && near((p[0]+Q[i][0])/2,6)); })()`,
      // （1）図1：右へ 4 の平行移動。AA′＝BB′＝CC′＝4（矢印の長さ）
      `(() => { ${GL} const P=${J(P3)}, Q=${J(Q3)}, V=${J(V3)}; return same(P.map(p=>mv(p,V)),Q) && P.every((p,i)=>near(len(v2(p,Q[i])),4)); })()`,
      // （2）図2：ℓ（x＝4）での対称移動。12−x ではなく 8−x
      `(() => { ${GL} const P=${J(P4)}, Q=${J(Q4)}; return same(P.map(p=>refl(p,[4,0],[4,6])),Q) && P.every((p,i)=>near(p[0]+Q[i][0],8)); })()`,
      // （3）図3：O(4, 2) を中心に時計回り（−90°）に 90°。OA＝OA′、∠AOA′＝90°（内積 0）
      `(() => { ${GL} const O=${J(O5)}, P=${J(P5)}, Q=${J(Q5)}; return same(P.map(p=>rot(p,O,-90)),Q) && P.every((p,i)=>near(len(v2(O,p)),len(v2(O,Q[i]))) && near(dot(v2(O,p),v2(O,Q[i])),0)); })()`,
      // （4）平行移動：CF＝7 なら BE＝7（対応する点を結ぶ線分は長さが等しい）。BE と平行な線分は AD と CF の 2本（A→D、B→E、C→F）
      `(() => { ${GL} const P=[[0,0],[2,3],[5,1]], V=[3,-2], Q=P.map(p=>mv(p,V)); const sc=7/len(V), seg=P.map((p,i)=>len(v2(p,Q[i]))*sc); return seg.every(x=>near(x,7)) && [0,2].every(i=>near(cr(v2(P[i],Q[i]),v2(P[1],Q[1])),0)); })()`,
      // （5）対称移動：AM＝3.5 なら AA′＝2×3.5＝7（M は AA′ の中点）。AA′ と ℓ は垂直（90°）：A(1,2)、ℓ：x＝4.5 で確かめる
      `(() => { ${GL} const A=[1,2], l1=[4.5,0], l2=[4.5,5], A2=refl(A,l1,l2), M=[(A[0]+A2[0])/2,(A[1]+A2[1])/2]; return near(len(v2(A,M)),3.5) && near(len(v2(A,A2)),7) && near(dot(v2(A,A2),v2(l1,l2)),0) && near(2*3.5,7); })()`,
      // （6）回転：OB＝5、∠BOB′＝55° なら OB′＝5、∠COC′＝55°（どの点も同じ角だけ回る）。O(0,0)、B(5,0)、C(3,4) を 55° 回して確かめる
      `(() => { ${GL} const O=[0,0], B=[5,0], C=[3,4], B2=rot(B,O,-55), C2=rot(C,O,-55), ang=(p,q)=>Math.acos(dot(p,q)/(len(p)*len(q)))/D; return near(len(B2),5) && near(ang(B,B2),55) && near(ang(C,C2),55); })()`,
      // （7）考えよう（答えは紙面に載せない）：動かない点。平行移動はなし、対称移動は軸の上の点、回転移動は中心だけ
      `(() => { ${GL} const pts=[]; for(let x=0;x<=6;x++) for(let y=0;y<=6;y++) pts.push([x,y]); const fixed=f=>pts.filter(p=>near(f(p)[0],p[0])&&near(f(p)[1],p[1])); return fixed(p=>mv(p,[3,1])).length===0 && fixed(p=>refl(p,[3,0],[3,6])).every(p=>p[0]===3) && fixed(p=>refl(p,[3,0],[3,6])).length===7 && fixed(p=>rot(p,[2,2],90)).length===1; })()`,
      // （8）チャレンジ：A→A′、B→B′、C→C′ が回転移動のとき、O から A と A′、B と B′、C と C′ までが等しい方眼の交点（0〜9、0〜7）は O(4, 3) だけ。O を中心に時計回り 90° で A′B′C′ にもなる
      `(() => { ${GL} const P=${J(P6)}, Q=${J(Q6)}, c=[]; for(let x=0;x<=9;x++) for(let y=0;y<=7;y++){ const O=[x,y]; if(P.every((p,i)=>near(len(v2(O,p)),len(v2(O,Q[i]))))) c.push(O.join()); } return c.join('|')==='4,3' && same(P.map(p=>rot(p,[4,3],-90)),Q); })()`,
      // 小テスト（1）図1：右へ 5。（2）図2：ℓ（x＝4）で対称移動（8−x）
      `(() => { ${GL} return same(${J(P7)}.map(p=>mv(p,[5,0])),${J(Q7)}) && same(${J(P8)}.map(p=>refl(p,[4,0],[4,6])),${J(Q8)}); })()`,
      // 小テスト（3）OA＝6 なら OA′＝6。∠COC′＝75° なら ∠AOA′＝75°　（4）PP′＝10 なら、P から軸までは 10÷2＝5
      `(() => { ${GL} const O=[0,0], A=[6,0], C=[2,5], A2=rot(A,O,75), ang=(p,q)=>Math.acos(dot(p,q)/(len(p)*len(q)))/D; const P=[1,1], P2=refl(P,[6,0],[6,3]); return near(len(A2),6) && near(ang(A,A2),75) && near(ang(C,rot(C,O,75)),75) && near(len(v2(P,P2))/2, Math.abs(P[0]-6)) && near(10/2,5); })()`,
      // 小テスト（5）チャレンジ：O を中心に 180° 回転（点対称移動）。OA＝4 なら AA′＝8、AB＝7 なら A′B′＝7、AB∥A′B′（外積 0）。A(4,0)、B(4+7cosθ, …) で確かめる
      `(() => { ${GL} const O=[0,0], A=[4,0], B=[4+7*Math.cos(1), 7*Math.sin(1)], A2=rot(A,O,180), B2=rot(B,O,180); return near(len(v2(A,A2)),8) && near(len(v2(A,B)),7) && near(len(v2(A2,B2)),7) && near(cr(v2(A,B),v2(A2,B2)),0) && near(2*4,8); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('移動した図形をかいて、対応する点の関係を調べよう'),
      K('今日の問い', '△ABC を、矢印の方向に、矢印の長さだけ動かした △A′B′C′ をかこう。AA′、BB′、CC′ を結ぶと、どんなことに気づくだろう。', 2),
      F(6, figWS1),
      T('①', '自分の考え（3分）　△A′B′C′ をかいて、気づいたことを書こう。', 1),
      B(3, '（例）A′、B′、C′ は、A、B、C から、右へ 6、下へ 1。\nAA′、BB′、CC′ は、どれも平行で、長さも同じ。'),
      T('②', 'ペアの考え（3分）　自分とちがう気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('平行移動：対応する点を結ぶと、{{平行}}で長さが{{等しい}}\n対称移動：結ぶ線分は、軸で{{垂直}}に{{2等分}}される\n回転移動：対応する点は、中心から{{等しい}}きょりにある\n180° の回転移動を{{点対称移動}}という', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '△ABC を、直線 ℓ を対称の軸として対称移動した △A′B′C′ をかこう。表を完成させよう。', 2),
      F(5, figWS2),
      TB('', ['A と A′', 'B と B′', 'C と C′'], [
        ['ℓ までの目もり（A、B、C）', ['4', '2', '1']],
        ['ℓ までの目もり（A′、B′、C′）', ['{{4}}', '{{2}}', '{{1}}']],
        ['線分と ℓ のつくる角', ['{{90°}}', '{{90°}}', '{{90°}}']]
      ], { hw: 62 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 平行移動では、対応する点を結ぶ線分は、{{平行}}で長さが{{等しい}}。\n② 対称移動では、結ぶ線分は、軸で{{垂直}}に{{2等分}}される。\n③ 回転移動では、対応する点は、{{中心}}から{{等しい}}きょりにある。\n④ 180° の回転移動を、{{点対称移動}}という。', 4, { label: 'ことば' }),
      F(6, cap(fig1, '図1'), cap(fig2, '図2'), cap(fig3, '図3')),
      C2([
        T('（1）', '図1で、△ABC を、矢印の方向に、矢印の長さだけ平行移動した △A′B′C′ をかこう。', 3),
        B(2, '図1の赤い三角形\n（A′ は A から右へ 4）')
      ], [
        T('（2）', '図2で、△ABC を、直線 ℓ を軸として対称移動した △A′B′C′ をかこう。', 3),
        B(2, '図2の赤い三角形\n（A′ は A と同じ高さ）')
      ], '1:1'),
      MA('【説明】対応する点を結ぶ線分の性質を、平行移動と対称移動で言い比べよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '移動の性質を使って、図をかいたり、求めたりしよう。'),
      C2([
        T('（3）', '図3で、△ABC を、点 O を中心に時計回りに 90° 回転移動した △A′B′C′ をかこう。', 3),
        B(2, '図3の赤い三角形\n（OA＝OA′、∠AOA′＝90°）')
      ], [
        T('（4）', '△ABC を平行移動した △A′B′C′ で、CC′＝7cm。BB′ の長さと、BB′ に平行な線分は。', 3),
        B(2, 'BB′＝7cm\nAA′、CC′')
      ], '1:1'),
      C2([
        T('（5）', '点 A を直線 ℓ で対称移動した点が A′。AA′ と ℓ の交点 M で AM＝3.5cm のとき、AA′ の長さと、2直線の角は。', 4),
        B(2, 'AA′＝3.5×2＝7（cm）\n角は 90°')
      ], [
        T('（6）', '△ABC を、点 O を中心に時計回りに 55° 回転移動して △A′B′C′ にした。OB＝5cm のとき、OB′ と ∠BOB′、∠COC′ は。', 4),
        B(2, 'OB′＝5cm\n∠BOB′＝∠COC′＝55°')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：動かない点があるか、調べよう。'),
      T('（7）', '3つの移動のそれぞれで、動かない点（動かす前と後で、同じ位置にある点）はあるだろうか。あるときは、どこにあるか、図をかいて調べよう。', 3),
      TB('移動', ['平行移動', '対称移動', '回転移動'], [['動かない点', ['', '', '']]], { hw: 36 }),
      C2([
        T('', '図をかいて調べたこと', 1),
        B(8, '')
      ], [
        T('', '気づいたこと', 1),
        B(8, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図で、△ABC を、ある点 O を中心に回転移動すると、△A′B′C′ に重なった。回転の中心 O を図にかきこもう。また、時計回りに何度回転したか答えよう。（180° 以下）', 6),
        B(4, 'A と A′、B と B′ から\n等しいきょりの点が O\n左から 4、下から 3\n時計回りに 90°')
      ], [
        MA('① 回転の中心から、A までと、A′ までは、どんな関係だったかな。\n② A と A′ から等しいきょりの点を、方眼でさがしてみよう。', 6, { label: 'ヒントカード' }),
        F(9, fig6)
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      F(6, cap(figQ1, '図1'), cap(figQ2, '図2')),
      T('（1）', '図1で、△ABC を平行移動した △A′B′C′ をかこう。（3点）\n矢印の方向に、矢印の長さだけ動かす。', 2),
      B(1, '図1の赤い三角形'),
      T('（2）', '図2で、△ABC を対称移動した △A′B′C′ をかこう。（3点）\n直線 ℓ を、対称の軸とする。', 2),
      B(1, '図2の赤い三角形'),
      T('（3）', '△ABC を、点 O を中心に回転移動して、△A′B′C′ に重ねた。OA＝6cm、∠COC′＝75° のとき、OA′ の長さと ∠AOA′ の大きさを求めよう。（2点）', 3),
      B(2, 'OA′＝6cm、∠AOA′＝75°'),
      T('（4）', '対称移動で、点 P が点 P′ に移った。線分 PP′ の長さが 10cm のとき、P から対称の軸までのきょりを求めよう。（2点）', 3),
      B(2, '10÷2＝5（cm）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '△ABC を、点 O を中心に 180° 回転移動して、△A′B′C′ に重ねた。OA＝4cm、AB＝7cm のとき、線分 A′B′ と線分 AA′ の長さを求めよう。また、AB と A′B′ の関係を、記号で表そう。', 4),
      B(3, 'A′B′＝AB＝7cm\nAA′＝4×2＝8cm　　AB∥A′B′')
    ]
  });
})();
