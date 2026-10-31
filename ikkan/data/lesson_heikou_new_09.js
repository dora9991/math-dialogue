/* 平行と合同（新しい形） 第9時：三角形は、何がわかれば1つに決まるだろう。 元：data/lesson_heikou_09.js を、新しい形に組みかえた。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（△ABC の3辺・3角の値を印刷。友達に電話で伝えるとき、何を伝えれば1つに決まるか）。個人3分 → ペア3分 → ことば（合同条件。ここではじめて出す）→ 例題（2組の辺とその間の角／1組の辺とその両端の角を、作図して重ねる。空欄あり）。
     元の学習課題（3辺の作図）は、今日の問いの「電話で伝える」に広げ、3辺の作図は演習（6）にまわした。めあて・今日の問いに、合同条件の3つは書いていない。
     作図の線分は、座標（cm）から描いたので、印刷すると本当の長さになる（1cm＝10mm。BC＝6cm は 60mm）。印刷は、拡大・縮小しない（100％）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる 1問（元の考えよう：BC＝6cm、CA＝4cm、∠B＝35° は1つに決まるか。答えは載せない。発展は使わない）・チャレンジ★★ 1問（元の応用（5）：BC＝EF、∠B＝∠E のとき、あと1つ 3通り。ヒントカードつき）。
     元の基礎（1）（2）を（1）（2）に、標準（3）（4）を（3）（4）に（（4）は、線分 5cm の作図にした）、応用（6）は、角の大きさを求める問い（5）にかえ、3辺の作図（6）を新しく作った。
     元の入試（7）（8）は、どちらも「2辺と、その間にない角」の答えが出てしまい、考えようの答えが演習の解答に載るので、使わない（第10時で、条件が足りない場合として出てくる）。
   ・数値・答えは、座標から測り直した（checks）：図の長さ・角の字、例題の A の位置、（4）AC＝約4.6cm、（6）∠B＝約59°、（5）∠F＝65°、（7）の交点が 2つ（答えは載せない）、（8）の3通り（と、CA＝FD では足りないこと）。
   ・範囲：作図（コンパス・定規・分度器）は中1。合同・対応・≡ は第8時までに学習ずみ。証明・「仮定」「結論」は使わない（第11時）。
   検算：node tools/verify.cjs heikou_new-09　／　見た目：node tools/check.cjs <出力先> heikou_new-09 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  const rad = d => d * Math.PI / 180;
  const pol = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  const FIGS = [];
  const reg = (name, spec) => { spec.name = name; FIGS.push(spec); return spec; };
  /* 作図の図：底辺 P→Q（長さ len cm）と、上下の余白をとる見えない点（T・U）。scale＝10：1cm＝10mm。
     o.ray＝[向き, 長さ]：P から出す半直線　o.cap＝見出し　o.ask＝［[頂点, 頂点, 長さ(cm)]…］（答えの長さ）　o.top／o.bot＝上・下の余白（cm） */
  const base = (name, P, Q, len, top, o) => {
    o = o || {};
    const pts = { [P]: [0, 0], [Q]: [len, 0], T: [len / 2, top], U: [len / 2, -(o.bot || 0.8)], L: [-(o.left || 0.6), 0.5], Rt: [len + (o.right || 0.5), 0.5] };
    const segs = [[P, Q]], ang = [], txt = [];
    if (o.ray) { pts.R = pol([0, 0], o.ray[1], o.ray[0]); segs.push([P, 'R']); ang.push({ at: P, a: Q, b: 'R', t: o.ray[0] + '°', r: 8, lr: 14 }); }
    if (o.cap) { pts.CAP = [-0.3, top - 0.4]; txt.push({ p: 'CAP', t: o.cap, anchor: 'start', size: 3.4 }); }
    return reg(name, { pts, segs, ang, txt, dots: [P, Q], scale: 10, vl: { [P]: [P, 225, 3.4], [Q]: [Q, 315, 3.4] }, segLen: [[P, Q, len]], ask: o.ask || [] });
  };
  // 解答の赤：頂点 X から、底辺の両はし（P・Q）への線と、字
  const redTri = (X, P, Q, angs, d) => ({ segs: [[P, X], [X, Q]], vl: { [X]: [X, d || 90, 3.4] }, ang: angs });

  /* ---------------- 問題の図（座標から作る） ---------------- */
  // 今日の問い：△ABC（AB＝4、BC＝6、CA＝5）。A は、B から 4、C から 5 の点。角は 83°・56°・41°（四捨五入）
  const A0 = [(16 + 36 - 25) / 12, Math.sqrt(16 - ((16 + 36 - 25) / 12) ** 2)];
  const Z_T = reg('今日の問い', {
    pts: { A: A0, B: [0, 0], C: [6, 0] }, poly: 'ABC', pad: 5, vl: { A: ['A', 90, 3.4], B: ['B', 225, 3.4], C: ['C', 315, 3.4] },
    lens: [['A', 'B', 4], ['B', 'C', 6], ['C', 'A', 5]], angTol: 0.5,
    txt: [{ p: [A0[0] / 2, A0[1] / 2], t: '4cm', dx: -6, dy: -1 }, { p: [3, 0], t: '6cm', dx: 0, dy: 7 }, { p: [(A0[0] + 6) / 2, A0[1] / 2], t: '5cm', dx: 6, dy: -1 }],
    ang: [{ at: 'A', a: 'B', b: 'C', t: '83°', r: 6, lr: 11 }, { at: 'B', a: 'C', b: 'A', t: '56°', r: 7, lr: 13 }, { at: 'C', a: 'B', b: 'A', t: '41°', r: 7, lr: 14 }]
  });
  // 例題（1）AB＝4、BC＝6、∠B＝50°　（2）BC＝6、∠B＝40°、∠C＝60°
  const A2 = pol([0, 0], 4, 50), s3 = 6 * Math.sin(rad(60)) / Math.sin(rad(80)), A3 = pol([0, 0], s3, 40);
  const Z_E1 = base('例題（1）', 'B', 'C', 6, 3.8, { cap: '（1）', ask: [['A', 'B', 4]] });
  Z_E1.pts.A = A2; Z_E1.a = redTri('A', 'B', 'C', [{ at: 'B', a: 'C', b: 'A', t: '50°', r: 8, lr: 14 }]);
  const Z_E2 = base('例題（2）', 'B', 'C', 6, 3.8, { cap: '（2）' });
  Z_E2.pts.A = A3; Z_E2.a = redTri('A', 'B', 'C', [{ at: 'B', a: 'C', b: 'A', t: '40°', r: 8, lr: 14 }, { at: 'C', a: 'B', b: 'A', t: '60°', r: 8, lr: 14 }]);
  // ひろげる（7）：BC＝6、∠B＝35° の半直線（長さ 7.6）
  const Z_K = base('ひろげる（7）', 'B', 'C', 6, 4.4, { ray: [35, 7.6], bot: 1.0 });
  // 使ってみる（4）図1：AB＝5cm の線分。∠A＝50°、∠B＝60° の △ABC（C は上）。AC＝5 sin60°÷sin70°＝約4.61
  const AC4 = 5 * Math.sin(rad(60)) / Math.sin(rad(70));
  const Z_D1 = base('図1', 'A', 'B', 5, 3.95, { cap: '図1', bot: 0.7, ask: [['A', 'C', AC4]] });
  Z_D1.pts.C = pol([0, 0], AC4, 50);
  Z_D1.a = redTri('C', 'A', 'B', [{ at: 'A', a: 'B', b: 'C', t: '50°', r: 8, lr: 14 }, { at: 'B', a: 'A', b: 'C', t: '60°', r: 8, lr: 14 }], 30);
  // 使ってみる（6）図2：BC＝5cm の線分。AB＝4cm、CA＝4.5cm の △ABC（A は上）。∠B＝約58.8°
  const A6 = [(16 + 25 - 20.25) / 10, Math.sqrt(16 - ((16 + 25 - 20.25) / 10) ** 2)];
  const Z_D2 = base('図2', 'B', 'C', 5, 3.85, { cap: '図2', bot: 0.7, ask: [['A', 'B', 4], ['A', 'C', 4.5]] });
  Z_D2.pts.A = A6;
  Z_D2.a = { segs: [['B', 'A'], ['A', 'C']], vl: { A: ['A', 90, 3.4] }, txt: [{ p: [A6[0] / 2, A6[1] / 2], t: '4cm', dx: -6.5, dy: -1 }, { p: [(A6[0] + 5) / 2, A6[1] / 2], t: '4.5cm', dx: 7.5, dy: -1 }] };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     figCheck：すべての図で、線分の長さ（cm）・辺の字・角の字・答えの長さを、座標から測り直して、合うか（合わないものの一覧を返す）
     ag(P, a, b, c)：∠abc（b が頂点）の大きさ　dist：2点の距離　lineX：点 p から向き d1 の半直線と、点 q から向き d2 の半直線の交点
     cross：円（中心 C、半径 r）と、B から出る半直線（B と C の距離 d、∠B＝t°）の交点の B からの距離（2次方程式の正の解）
     arith：答えの文の中の、数だけの「…＝…＝…」が、計算として正しいか */
  const ag = (P, a, b, c) => { const u = [P[a][0] - P[b][0], P[a][1] - P[b][1]], v = [P[c][0] - P[b][0], P[c][1] - P[b][1]]; return Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1])) * 180 / Math.PI; };
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const lineX = (p, d1, q, d2) => { const R = Math.PI / 180, u = [Math.cos(d1 * R), Math.sin(d1 * R)], v = [Math.cos(d2 * R), Math.sin(d2 * R)], den = u[0] * (-v[1]) - u[1] * (-v[0]), s = ((q[0] - p[0]) * (-v[1]) - (q[1] - p[1]) * (-v[0])) / den; return [p[0] + s * u[0], p[1] + s * u[1]]; };
  const cross = (d, t, r) => { const b = d * Math.cos(t * Math.PI / 180), disc = b * b - (d * d - r * r), out = []; if (disc > 1e-12) { [b - Math.sqrt(disc), b + Math.sqrt(disc)].forEach(s => { if (s > 1e-9) out.push(s); }); } else if (Math.abs(disc) <= 1e-12 && b > 0) out.push(b); return out; };
  const figCheck = (F, ag, dist) => {
    const bad = [];
    if (F.length < 6) bad.push('図の数');
    F.forEach(f => {
      const P = f.pts, no = s => bad.push(f.name + '：' + s);
      (f.segLen || []).forEach(l => { if (Math.abs(dist(P[l[0]], P[l[1]]) - l[2]) > 1e-9) no('線分の長さ ' + l[0] + l[1]); });
      if (f.segLen && f.scale !== 10) no('縮尺');
      (f.lens || []).forEach(l => { if (Math.abs(dist(P[l[0]], P[l[1]]) - l[2]) > 1e-9) no('辺の長さ ' + l[0] + l[1]); const lab = (f.txt || []).map(t => t.t); if (!lab.includes(l[2] + 'cm')) no('辺の字 ' + l[2] + 'cm がない'); });
      (f.ask || []).forEach(s => { if (Math.abs(dist(P[s[0]], P[s[1]]) - s[2]) > 0.01) no('答えの長さ ' + s[0] + s[1] + '＝' + s[2] + '（測った長さ ' + dist(P[s[0]], P[s[1]]).toFixed(3) + '）'); });
      const angOK = L => (L || []).forEach(an => {
        const m = ag(P, an.a, an.at, an.b), v = parseFloat(String(an.t == null ? '' : an.t).replace(/[{}]/g, ''));
        if (!isNaN(v) && Math.abs(m - v) > (f.angTol || 0.05)) no('角 ' + an.at + ' の字 ' + an.t + '（測った大きさ ' + m.toFixed(2) + '°）');
      });
      angOK(f.ang); angOK(f.a && f.a.ang);
    });
    return bad;
  };
  const arith = t => {
    const S = String(t).replace(/°/g, ''), re = /[0-9.(][0-9.()+\-−×÷\[\]\/]*(?:＝[0-9.(][0-9.()+\-−×÷\[\]\/]*)+/g;
    let m, ok = true;
    while ((m = re.exec(S))) {
      if (m.index > 0 && /[0-9.()+\-−×÷\[\]\/A-Za-z]/.test(S[m.index - 1])) continue;
      const ps = m[0].split('＝');
      if (ps.some(p => (p.match(/\(/g) || []).length !== (p.match(/\)/g) || []).length)) continue;
      if (ps.some(p => /[+\-−×÷\/]$/.test(p))) continue;
      let vs;
      try { vs = ps.map(p => new Function('return ' + p.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/'))()); } catch (e) { continue; }
      if (vs.some(v => !(Math.abs(v - vs[0]) < 1e-9 * Math.max(1, Math.abs(vs[0]))))) ok = false;
    }
    return ok;
  };
  const LIB = 'const ag = ' + ag + '; const dist = ' + dist + '; const lineX = ' + lineX + '; const cross = ' + cross + '; const figCheck = ' + figCheck + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };

  /* ---------------- 手で書いた答え（画面にも checks にも、同じ文字列を使う） ---------------- */
  const T_W1 = '（例）3つの辺 AB・BC・CA を伝える。\n2つの辺 AB・BC と、その間の角 ∠B を伝える。\n1つの辺 BC と、その両端の角 ∠B・∠C を伝える。';
  const T_E = '（1）（2）とも、となりの人の三角形と、ぴったり重なる。\n（1）2組の辺とその間の角が決まると、1つに決まる。\n（2）1組の辺とその両端の角が決まると、1つに決まる。';
  const T_D1 = '間の角 … ∠A　　両端の角 … ∠B と ∠C';
  const T_D2 = '① 3組の辺　② 2組の辺とその間の角　③ 1組の辺とその両端の角';
  const T_D3 = 'CA＝FD（3組の辺）\n∠B＝∠E\n（2組の辺とその間の角）';
  const T_D4 = '約 4.6 cm\n（1組の辺とその両端の角）';
  const T_D5 = '2組の辺とその間の角が等しいから\n△ABC≡△DEF\n∠F＝∠C＝180°−75°−40°＝65°';
  const T_D6 = '約 59°\n（3組の辺が決まると、1つに決まる）';
  const T_D8 = 'AB＝DE　（2組の辺とその間の角）\n∠C＝∠F　（1組の辺とその両端の角）\n∠A＝∠D　（内角の和から ∠C＝∠F。1組の辺とその両端の角）';
  const T_Q1 = '① 3組の辺が、それぞれ等しい。\n② 2組の辺とその間の角が、それぞれ等しい。\n③ 1組の辺とその両端の角が、それぞれ等しい。';
  const T_Q2 = '① 3組の辺\n② 2組の辺とその間の角\n③ 1組の辺とその両端の角';
  const T_Q3 = '間の角 … ∠C\n両端の角 … ∠A と ∠B';
  const T_Q4 = '（例）BC＝EF　（2組の辺とその間の角）\n　　　∠A＝∠D　（1組の辺とその両端の角）\n　　　∠C＝∠F　（内角の和から ∠A＝∠D）\nどれか1つ書けていれば○';
  const T_QC = 'いえる。\n∠B＝180°−∠A−∠C、∠E＝180°−∠D−∠F\n∠A＝∠D、∠C＝∠F だから　∠B＝∠E\nAB＝DE、∠A＝∠D、∠B＝∠E で、\n1組の辺とその両端の角が、それぞれ等しい。\nよって　△ABC≡△DEF';

  const DEF = {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第9時', title: '三角形は、何がわかれば1つに決まるだろう',
    summary: '友達に電話で伝えるつもりで、三角形が1つに決まる条件を考え、作図で確かめて、三角形の合同条件（3つ）をとらえる。ひろげるは、2辺と、その間にない角のとき。',
    head: '平行と合同　第9時',
    pitch: 8, dots: true,
    checks: [
      chk('第9時 すべての図', `return figCheck(${J(FIGS)}, ag, dist).length === 0;`),
      // 今日の問い：3辺 4・6・5 から、余弦定理で角を出し直す（83°・56°・41°、和は 180°）。図の座標も同じ
      chk('第9時 今日の問い', `const f = ${J(Z_T)}, P = f.pts; const dg = x => x * 180 / Math.PI, A = dg(Math.acos((16 + 25 - 36) / (2 * 4 * 5))), Bq = dg(Math.acos((16 + 36 - 25) / (2 * 4 * 6))), C = dg(Math.acos((36 + 25 - 16) / (2 * 6 * 5))); return near(dist(P.A, P.B), 4) && near(dist(P.B, P.C), 6) && near(dist(P.A, P.C), 5) && Math.round(A) === 83 && Math.round(Bq) === 56 && Math.round(C) === 41 && near(A + Bq + C, 180) && near(ag(P, 'B', 'A', 'C'), A) && near(ag(P, 'A', 'B', 'C'), Bq) && near(ag(P, 'A', 'C', 'B'), C) && f.ang.map(a => a.t).join() === '83°,56°,41°' && ${J(T_W1)}.includes('AB・BC と、その間の角 ∠B') && ${J(T_W1)}.includes('BC と、その両端の角 ∠B・∠C');`),
      // 例題：（1）A は B から 50° の向きに 4cm　（2）A は、B から 40° の半直線と、C から 120°（∠C＝60°）の半直線の交点。座標から測り直す
      chk('第9時 例題', `const a = ${J(Z_E1)}.pts, b = ${J(Z_E2)}.pts; const X = lineX([0, 0], 40, [6, 0], 120); return near(dist(a.B, a.A), 4) && near(ag(a, 'C', 'B', 'A'), 50) && near(dist(a.B, a.C), 6) && near(X[0], b.A[0]) && near(X[1], b.A[1]) && near(ag(b, 'C', 'B', 'A'), 40) && near(ag(b, 'B', 'C', 'A'), 60) && near(ag(b, 'B', 'A', 'C'), 80) && arith(${J(T_E)});`),
      // 使ってみる（4）AB＝5、∠A＝50°、∠B＝60°：C は、A から 50°・B から 120° の半直線の交点。AC＝約4.6（正弦定理でも）
      chk('第9時 使ってみる（4）', `const o = ${J(Z_D1)}, P = o.pts, X = lineX([0, 0], 50, [5, 0], 120); return near(dist(P.A, X), 5 * Math.sin(60 * Math.PI / 180) / Math.sin((180 - 50 - 60) * Math.PI / 180)) && Math.abs(dist(P.A, X) - 4.6) < 0.05 && Math.abs(dist(P.A, P.C) - 4.6) < 0.05 && near(ag(P, 'B', 'A', 'C'), 50) && near(ag(P, 'A', 'B', 'C'), 60) && near(ag(P, 'A', 'C', 'B'), 70) && ${J(T_D4)}.includes('約 4.6 cm');`),
      // 使ってみる（6）BC＝5、AB＝4、CA＝4.5：余弦定理で ∠B＝約58.8°（約59°）。図の座標からも
      chk('第9時 使ってみる（6）', `const o = ${J(Z_D2)}, P = o.pts, B = Math.acos((16 + 25 - 20.25) / (2 * 4 * 5)) * 180 / Math.PI; return near(dist(P.A, P.B), 4) && near(dist(P.A, P.C), 4.5) && near(dist(P.B, P.C), 5) && Math.round(B) === 59 && near(ag(P, 'C', 'B', 'A'), B) && ${J(T_D6)}.includes('約 59°');`),
      // 使ってみる（3）AB＝DE、BC＝EF のとき：CA＝FD でも ∠B＝∠E でも、三角形は 1つに決まる（∠B を 1°ずつかえて、CA が全部ちがう）
      chk('第9時 使ってみる（3）', `const ca = t => { const R = t * Math.PI / 180; return dist([4 * Math.cos(R), 4 * Math.sin(R)], [6, 0]); }; let ok = true; for (let s = 1; s < 180; s++) for (let t = s + 1; t < 180; t++) if (near(ca(s), ca(t))) ok = false; return ok && ${J(T_D3)}.includes('CA＝FD') && ${J(T_D3)}.includes('∠B＝∠E');`),
      // 使ってみる（5）AB＝DE、BC＝EF、∠B＝∠E で、∠A＝75°、∠B＝40°：△DEF を △ABC のコピー（回転・平行移動）にして、∠F＝∠C＝65°
      chk('第9時 使ってみる（5）', `const R = Math.PI / 180, A = [4 * Math.cos(40 * R), 4 * Math.sin(40 * R)], Bp = [0, 0], BC = 4 * Math.sin(75 * R) / Math.sin(65 * R), Cp = [BC, 0]; const rot = p => [10 + p[0] * Math.cos(0.7) - p[1] * Math.sin(0.7), 3 + p[0] * Math.sin(0.7) + p[1] * Math.cos(0.7)]; const P = { A, B: Bp, C: Cp, D: rot(A), E: rot(Bp), F: rot(Cp) }; return near(ag(P, 'B', 'A', 'C'), 75) && near(ag(P, 'A', 'B', 'C'), 40) && near(ag(P, 'A', 'C', 'B'), 65) && near(ag(P, 'E', 'F', 'D'), 65) && near(dist(P.A, P.B), dist(P.D, P.E)) && near(dist(P.B, P.C), dist(P.E, P.F)) && near(180 - 75 - 40, 65) && arith(${J(T_D5)});`),
      // ひろげる（7）（答えは載せない。ここで確かめるだけ）：BC＝6、∠B＝35°、CA＝4 の三角形は、B から約2.876 と約6.954 の A の 2つ。どちらも条件をみたし、AB がちがう
      chk('第9時 ひろげる（7）', `const k = cross(6, 35, 4), R = Math.PI / 180; return k.length === 2 && k.every(s => { const A = [s * Math.cos(35 * R), s * Math.sin(35 * R)]; return near(dist(A, [6, 0]), 4) && near(ag({ A, B: [0, 0], C: [6, 0] }, 'A', 'B', 'C'), 35); }) && Math.abs(k[0] - 2.876) < 0.001 && Math.abs(k[1] - 6.954) < 0.001 && k[1] - k[0] > 1 && 6 * Math.sin(35 * R) < 4 && 4 < 6;`),
      // チャレンジ（8）BC＝EF＝6、∠B＝∠E＝35°：三角形は AB＝s で決まる。∠C も ∠A も、s がちがえばちがう（∠C＝∠F、∠A＝∠D で 1つに決まる）。∠A+35°+∠C＝180°。CA は、s がちがっても同じになる組がある（CA＝FD は足りない）
      chk('第9時 チャレンジ（8）', `const R = Math.PI / 180, tri = s => ({ A: [s * Math.cos(35 * R), s * Math.sin(35 * R)], B: [0, 0], C: [6, 0] }); const ss = []; for (let s = 0.5; s <= 12; s += 0.25) ss.push(s); let ok = true; for (let i = 0; i < ss.length; i++) { const T1 = tri(ss[i]); ok = ok && near(ag(T1, 'B', 'A', 'C') + 35 + ag(T1, 'A', 'C', 'B'), 180); for (let j = i + 1; j < ss.length; j++) { const T2 = tri(ss[j]); if (near(ag(T1, 'A', 'C', 'B'), ag(T2, 'A', 'C', 'B')) || near(ag(T1, 'B', 'A', 'C'), ag(T2, 'B', 'A', 'C'))) ok = false; } } const k = cross(6, 35, 4); return ok && k.length === 2 && near(dist(tri(k[0]).A, [6, 0]), dist(tri(k[1]).A, [6, 0])) && ${J(T_D8)}.includes('∠A＝∠D');`),
      // 小テスト（4）AB＝DE、∠B＝∠E：BC＝EF でも、∠A＝∠D でも、∠C＝∠F でも、△DEF は △ABC と合わさる（辺の長さ 3つが等しい）。AB＝4.3、∠B＝47°、BC は 3・5・7 で確かめ
      chk('第9時 小テスト（4）', `const R = Math.PI / 180; let ok = true; [3, 5, 7].forEach(bc => { const A = [4.3 * Math.cos(47 * R), 4.3 * Math.sin(47 * R)], P = { A, B: [0, 0], C: [bc, 0] }, al = ag(P, 'B', 'A', 'C'), ga = ag(P, 'A', 'C', 'B'), CA = dist(A, P.C); const asa = (a1) => { const g = 180 - 47 - a1, e = 4.3 * Math.sin(a1 * R) / Math.sin(g * R); return Math.abs(e - bc) < 1e-9 && Math.abs(4.3 * Math.sin(47 * R) / Math.sin(g * R) - CA) < 1e-9; }; ok = ok && asa(al) && asa(180 - 47 - ga); }); return ok && ${J(T_Q4)}.includes('BC＝EF') && ${J(T_Q4)}.includes('∠A＝∠D') && ${J(T_Q4)}.includes('∠C＝∠F');`),
      // 小テスト チャレンジ：AB＝DE、∠A＝∠D、∠C＝∠F → ∠B＝∠E（180°−∠A−∠C）。1組の辺 AB とその両端の角が等しく、辺の長さ 3つも等しくなる（AB＝6、∠A＝55°、∠C＝65° → ∠B＝60°）
      chk('第9時 小テスト チャレンジ', `const R = Math.PI / 180, mk = (a, c) => { const b = 180 - a - c, bc = 6 * Math.sin(a * R) / Math.sin(c * R), ca = 6 * Math.sin(b * R) / Math.sin(c * R); return { b, bc, ca }; }; const t1 = mk(55, 65), t2 = mk(55, 65); return near(180 - 55 - 65, 60) && near(t1.b, 60) && near(t1.bc, t2.bc) && near(t1.ca, t2.ca) && [[40, 70], [35, 80], [72, 41]].every(([a, c]) => near(mk(a, c).b, 180 - a - c)) && arith(${J(T_QC)});`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('三角形が1つに決まる条件を、見つけよう'),
      C2([
        K('今日の問い', '右の △ABC の形と大きさを、友達に電話で伝えたい。辺や角のうち、何を伝えれば、友達は △ABC を1つに決めてかけるだろう。', 4),
        T('', '※ 角の大きさは、四捨五入した値。', 1)
      ], [
        F(5, GEO(Z_T))
      ], '3:2'),
      T('①', '自分の考え（3分）　伝えるものを、2組以上書こう。', 1),
      B(3, T_W1),
      T('②', 'ペアの考え（3分）　自分とちがう組を書いて、確かめよう。', 1),
      B(3, ''),
      G(1),
      WD('三角形の{{合同条件}}\n① {{3組の辺}}が、それぞれ等しい。\n② {{2組の辺とその間の角}}が、それぞれ等しい。\n③ {{1組の辺とその両端の角}}が、それぞれ等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '次の条件で △ABC をかき、となりの人のと重ねよう。\n（1）AB＝{{4}}cm、BC＝{{6}}cm、∠B＝{{50}}°\n（2）BC＝{{6}}cm、∠B＝{{40}}°、∠C＝{{60}}°', 3),
      F(6, GEO(Z_E1), GEO(Z_E2)),
      T('', '【重ねると、どうなっただろう】', 1),
      B(3, T_E)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 合同条件の1つは、{{3組の辺}}が、それぞれ等しいこと。\n② 合同条件の1つは、{{2組の辺}}とその{{間の角}}が、それぞれ等しいこと。\n③ 合同条件の1つは、{{1組の辺}}とその{{両端の角}}が、それぞれ等しいこと。', 3, { label: 'ことば' }),
      T('（1）', '△ABC で、辺 AB と辺 AC の間の角と、辺 BC の両端の角を答えよう。', 1),
      B(1, T_D1),
      T('（2）', '△ABC と △DEF で、次のとき、合同条件を答えよう。\n① AB＝DE、BC＝EF、CA＝FD　　② AB＝DE、BC＝EF、∠B＝∠E\n③ BC＝EF、∠B＝∠E、∠C＝∠F', 3),
      B(1, T_D2),
      MA('【説明】三角形が1つに決まる条件を、図をかいて、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '合同条件を使って、考えよう。'),
      F(6, GEO(Z_D1), GEO(Z_D2)),
      C2([
        T('（3）', 'AB＝DE、BC＝EF のとき、あと1つ、何がわかれば △ABC≡△DEF といえるか。2通り答えよう。', 3),
        B(3, T_D3)
      ], [
        T('（4）', '図1の線分 AB を使って、∠A＝50°、∠B＝60° の △ABC をかこう。AC は、約何 cm か。', 3),
        B(3, T_D4)
      ], '1:1'),
      C2([
        T('（5）', 'AB＝DE、BC＝EF、∠B＝∠E で、∠A＝75°、∠B＝40° のとき、∠F の大きさと、使った合同条件を答えよう。', 4),
        B(3, T_D5)
      ], [
        T('（6）', '図2の線分 BC を使い、AB＝4cm、CA＝4.5cm の △ABC を、コンパスでかこう。∠B は、約何度か。', 4),
        B(2, T_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：条件によっては、どうなるだろう。'),
      T('（7）', '△ABC を、BC＝6cm、CA＝4cm、∠B＝35° の条件でかこう。図には、線分 BC と、∠B＝35° の半直線がかいてある。かいた三角形は、1つに決まるだろうか。', 2),
      C2([
        T('①', 'C を中心に半径 4cm の円（弧）をかいて、△ABC をかこう。何通りできるだろう。', 3),
        B(5, ''),
        T('②', '例題（1）のときと、何がちがうだろう。かき方をふり返って、説明しよう。', 3),
        B(7, '')
      ], [
        F(7, GEO(Z_K))
      ], '3:2'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      T('（8）', '△ABC と △DEF で、BC＝EF、∠B＝∠E がわかっている。あと1つ、何がわかれば △ABC≡△DEF といえるだろう。3通り答えよう。', 2),
      B(3, T_D8),
      MA('① 合同条件の3つのうち、BC＝EF と ∠B＝∠E の両方を使えるのは、どれとどれかな。\n② 辺 BC の両端の角は、∠B と、もう1つ。その角が等しいことを、ほかの角から言えないかな。', 4, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 片面・5分） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '2つの三角形が合同であるといえるための条件を、3つ書こう。（3点）', 1),
      B(3, T_Q1),
      T('（2）', '△ABC と △DEF で、次のことがわかっている。合同条件を答えよう。（3点）\n① AB＝DE、BC＝EF、CA＝FD\n② AB＝DE、AC＝DF、∠A＝∠D\n③ ∠B＝∠E、BC＝EF、∠C＝∠F', 4),
      B(3, T_Q2),
      T('（3）', '△ABC で、辺 BC と辺 CA の間の角と、辺 AB の両端の角を答えよう。（2点）', 1),
      B(2, T_Q3),
      T('（4）', '△ABC と △DEF で、AB＝DE、∠B＝∠E がわかっている。あと1つ、何がわかれば △ABC≡△DEF といえるだろう。1つ答えよう。（2点）', 2),
      B(4, T_Q4),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '△ABC と △DEF で、AB＝DE、∠A＝∠D、∠C＝∠F がわかっている。△ABC≡△DEF といえるか。理由もつけて答えよう。', 3),
      B(6, T_QC)
    ]
  };
  DEF.checks.push(chk('第9時 答えの文の計算', `const T = ${J(ANS(DEF.ws).concat(ANS(DEF.dr), ANS(DEF.qz)))}; return T.length > 10 && T.every(arith);`));
  IK.lesson('heikou_new-09', DEF);
})();
