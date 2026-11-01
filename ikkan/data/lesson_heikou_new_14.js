/* 平行と合同（新しい形） 第14時：「平行と合同」で学んだことを、整理して確かめよう（単元のまとめ）。 元：data/lesson_heikou_14.js（前の形）を、新しい形に組みかえた。
   ・ワークシートは A4 1枚：問いは1つ（3つの図で ∠x を求め、使った性質も答える：平行線の同位角と一直線／外角の性質／五角形の内角の和）。個人3分 → ペア3分 → ことば（単元の重要語句）→
     例題（AO＝DO、BO＝CO ならば AB∥DC：対頂角・合同条件・対応する角・錯角を、1つの証明の表の空欄にうめる）。先生の板書の例（B）は、①〜③ の求め方と使った性質。
   ・演習プリントは表裏：表＝確かめる 2問（（1）平行線と角・（2）多角形）・使ってみる 4問（（3）補助線をひく平行線の角・（4）正多角形・（5）合同条件の選択・（6）証明の「等しい2組の角と根拠」）
     ／裏＝ひろげる（元の考えよう：ア〜エの考えや答えが正しいか、はかることと証明することのちがい。答えなし）・チャレンジ★★（元の入試（7）：二等分線の交点 I の ∠BIC。ヒントカードつき）。
     元の基礎（1）の ②③（三角形・四角形の角）は、ワークシートの問いと重なるので、（1）は図1の平行線だけにした。元の応用（5）の証明（CM＝DM）は、33行におさまらないため、（6）を
     「△AMC≡△BMD を示すための、等しい2組の角と根拠・合同条件」の問いにかえた（証明の全体は、ワークシートの例題・小テスト（3）で扱う）。元の「発展」・授業計画は使わない。
   ・図は GEO。角度から座標を計算し、書いてある角の大きさのとおりに正確にかいた。checks では、図と同じ座標から、角の大きさ・合同・平行・答えを計算し直した（元の checks を引きつぎ、ことばの表の空欄の答えを足した）。
     合同条件の問題（演習（5））は、「合同といえない」ものを、実際に合同でない2つの三角形（座標）をつくって確かめた。
   ・元の答えの文：ワークシート ① は、「一直線の角 → 同位角」の順を「同位角 → 一直線の角」に直した（x は Q の下の右の角で、125° の同位角は Q の上の右の角）。小テスト（1）も、同じ理由で順を直した。
   ・元の演習（2）③「外角 45° の正多角形」は、考えよう イ（正八角形の外角は 45°）の答えが見えてしまうので、「外角 40° → 正九角形」に変えた。
   ・範囲：二等辺三角形・平行四辺形の性質・直角三角形の合同条件・ことがらの逆と反例は使わない。「1辺と2角」（AAS）は使わない。
   検算：node tools/verify.cjs heikou_new-14　／　見た目：node tools/check.cjs <出力先> heikou_new-14 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の座標（図と checks の両方で使う。Math だけを使う、独立した関数） ---------------- */
  // 平行な2直線 ℓ（y＝h）、m（y＝0）に、直線 n（上向きの角が al 度）が、P、Q で交わる。L1・L2＝ℓ の左右のはし、M1・M2＝m の左右のはし、U・W＝n の上と下のはし
  const parP = (al, h) => { const c = Math.cos(al * Math.PI / 180), s = Math.sin(al * Math.PI / 180); return { P: [h * c / s, h], Q: [0, 0], L1: [-2.9, h], L2: [2.9, h], M1: [-2.9, 0], M2: [2.9, 0], U: [h * c / s + 0.6 * c, h + 0.6 * s], W: [-0.6 * c, -0.6 * s] }; };
  // 三角形 ABC（底辺 BC、∠B＝b 度、∠C＝c 度）。D は BC を C のほうへのばした上の点
  const triP = (b, c, w) => { const r = Math.PI / 180, AB = w * Math.sin(c * r) / Math.sin((b + c) * r); return { B: [0, 0], C: [w, 0], A: [AB * Math.cos(b * r), AB * Math.sin(b * r)], D: [w + 1.7, 0] }; };
  // 凸多角形（A から順に、内角 angs）。はじめの辺の長さ lens をきめ、のこり 2辺は、閉じるように計算する
  const polyP = (angs, lens) => {
    const n = angs.length, r = Math.PI / 180, head = [0];
    for (let i = 1; i < n; i++) head.push(head[i - 1] + 180 - angs[i]);
    const u = h => [Math.cos(h * r), Math.sin(h * r)];
    let sx = 0, sy = 0;
    for (let i = 0; i < n - 2; i++) { sx += lens[i] * u(head[i])[0]; sy += lens[i] * u(head[i])[1]; }
    const a = u(head[n - 2]), b = u(head[n - 1]), det = a[0] * b[1] - a[1] * b[0];
    const L = lens.slice(0, n - 2).concat([(-sx * b[1] + sy * b[0]) / det, (-a[0] * sy + a[1] * sx) / det]);
    const pts = {}; let x = 0, y = 0;
    for (let i = 0; i < n; i++) { pts['ABCDEFGH'[i]] = [x, y]; x += L[i] * u(head[i])[0]; y += L[i] * u(head[i])[1]; }
    return pts;
  };
  // 平行な ℓ（y＝2.4）、m（y＝0）の間の折れ線 A−E−C（E は間の点）。∠EAL2＝a、∠ECM2＝c（どちらも右がわの角）、∠AEC＝a＋c
  const zigP = (a, c) => {
    const r = Math.PI / 180, E = [0, 1.1], t1 = (2.4 - 1.1) / Math.sin(a * r), t2 = 1.1 / Math.sin(c * r), A = [E[0] - t1 * Math.cos(a * r), 2.4], C = [E[0] - t2 * Math.cos(c * r), 0];
    return { A, E, C, L1: [A[0] - 0.8, 2.4], L2: [2.2, 2.4], M1: [C[0] - 0.8, 0], M2: [2.2, 0], G: [A[0] - 0.8, 1.1], H: [2.2, 1.1] };
  };
  // 平行な ℓ（y＝3）、m（y＝0）の間の折れ線 A−E−F−C。∠EAL2＝a、∠AEF＝e、∠FCM1＝c。∠EFC＝a＋e−c
  const wP = (a, e, c) => {
    const r = Math.PI / 180, phi = 180 - a - e, A = [0, 3], E = [A[0] + 2.4 * Math.cos(a * r), 3 - 2.4 * Math.sin(a * r)], F = [E[0] + 1.6 * Math.cos(phi * r), E[1] + 1.6 * Math.sin(phi * r)], tt = F[1] / Math.sin(c * r), C = [F[0] + tt * Math.cos(c * r), 0];
    return { A, E, F, C, L1: [-0.6, 3], L2: [C[0] + 0.6, 3], M1: [-0.6, 0], M2: [C[0] + 0.6, 0], EG: [E[0] - 1.1, E[1]], EH: [E[0] + 1.1, E[1]], FG: [F[0] - 1.1, F[1]], FH: [F[0] + 1.1, F[1]] };
  };
  // 線分 AD と BC が O で交わり、OD＝−OA、OC＝−OB（点対称）。AB∥DC
  const bowP = () => ({ O: [0, 0], A: [-2.1, 1.5], B: [1.7, 0.8], C: [-1.7, -0.8], D: [2.1, -1.5] });
  // 線分 AB、CD が O で交わり、AO＝BO、CO＝DO。∠OAC＝∠OBD、AC＝BD
  const bow2P = () => { const r = Math.PI / 180, u1 = [Math.cos(20 * r), Math.sin(20 * r)], u2 = [Math.cos(115 * r), Math.sin(115 * r)]; return { O: [0, 0], A: [-2 * u1[0], -2 * u1[1]], B: [2 * u1[0], 2 * u1[1]], C: [1.6 * u2[0], 1.6 * u2[1]], D: [-1.6 * u2[0], -1.6 * u2[1]] }; };
  // M は AB の中点、AC∥DB、C・M・D は一直線（M＝(0, 0)）
  const midP = () => { const r = Math.PI / 180, C = [-2.4 + 2.6 * Math.cos(62 * r), 2.6 * Math.sin(62 * r)]; return { A: [-2.4, 0], B: [2.4, 0], M: [0, 0], C, D: [-C[0], -C[1]] }; };
  // 三角形 ABC（∠A＝56°、∠B＝64°、∠C＝60°）と、∠B、∠C の二等分線の交点 I
  const bisP = () => {
    const r = Math.PI / 180, b = 64, c = 60, w = 4.6, AB = w * Math.sin(c * r) / Math.sin((b + c) * r), A = [AB * Math.cos(b * r), AB * Math.sin(b * r)];
    const h1 = (b / 2) * r, h2 = (180 - c / 2) * r, B = [0, 0], C = [w, 0], s = (C[1] - B[1]) * Math.cos(h2) - (C[0] - B[0]) * Math.sin(h2);
    const t = (w * Math.sin(h2)) / (Math.cos(h1) * Math.sin(h2) - Math.sin(h1) * Math.cos(h2));
    return { A, B, C, I: [t * Math.cos(h1), t * Math.sin(h1)] };
  };
  // ブーメランでない、ふつうの2つの三角形（合同条件のたしかめ用の座標）：△ABC と、それを回転・ずらした △DEF
  const twoP = () => { const r = Math.PI / 180, A = [0, 0], B = [4.6, 0], C = [1.3, 2.9], R = p => [6 + p[0] * Math.cos(40 * r) - p[1] * Math.sin(40 * r), 1 + p[0] * Math.sin(40 * r) + p[1] * Math.cos(40 * r)]; return { A, B, C, D: R(A), E: R(B), F: R(C) }; };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ---------------- */
  const d = (P, a, b) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]);
  const ang = (P, v, a, b) => { const ux = P[a][0] - P[v][0], uy = P[a][1] - P[v][1], wx = P[b][0] - P[v][0], wy = P[b][1] - P[v][1]; return Math.abs(Math.atan2(ux * wy - uy * wx, ux * wx + uy * wy)) * 180 / Math.PI; };
  const cong = (P, s, t) => [0, 1, 2].every(i => near(d(P, s[i], s[(i + 1) % 3]), d(P, t[i], t[(i + 1) % 3])) && near(ang(P, s[i], s[(i + 1) % 3], s[(i + 2) % 3]), ang(P, t[i], t[(i + 1) % 3], t[(i + 2) % 3])));
  const par = (P, a, b, c, e) => Math.abs((P[b][0] - P[a][0]) * (P[e][1] - P[c][1]) - (P[b][1] - P[a][1]) * (P[e][0] - P[c][0])) < 1e-9;
  const EV = s => { let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/'); for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))'); return new Function('return ' + t)(); };
  const arith = t => String(t).replace(/°/g, '').replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').filter(u => u.includes('＝') && !/[a-z]/.test(u)).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || p.map(EV).every(v => near(v, EV(p[0]))); });
  const LIB = 'const d = ' + d + '; const ang = ' + ang + '; const cong = ' + cong + '; const par = ' + par + '; const EV = ' + EV + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const blanksOf = s => (String(s).match(/\{\{([^}]*)\}\}/g) || []).map(t => t.slice(2, -2));

  /* ---------------- 図（GEO）。o＝上書きする設定（余白 pad など） ---------------- */
  const FIG = {
    // 平行な ℓ、m と、直線 n。angs：角のしるし（P、Q の、どの角か）。mark＝false なら、ℓ∥m のしるし（＞）をつけない
    par: (al, angs, mark, o) => GEO(Object.assign({ pts: parP(al, 2.0), segs: [['L1', 'L2', { lab: 'ℓ' }], ['M1', 'M2', { lab: 'm' }], ['U', 'W']], par: mark === false ? [] : [[[2.0, 2.0], [2.7, 2.0], 1], [[2.0, 0], [2.7, 0], 1]], ang: angs, pad: 6 }, o || {})),
    // 三角形 ABC と、BC ののばした先 D。angs：角のしるし
    tri: (b, c, angs, ext, o) => GEO(Object.assign({ pts: triP(b, c, 4.4), poly: 'ABC', segs: ext ? [['C', 'D']] : [], vl: ext ? { A: 'A', B: 'B', C: ['C', 270], D: 'D' } : 'ABC', ang: angs, pad: 6 }, o || {})),
    // 凸多角形
    poly: (angs, lens, texts, o) => { const pts = polyP(angs, lens), nm = Object.keys(pts); return GEO(Object.assign({ pts, poly: nm.join(''), vl: nm.join(''), ang: nm.map((k, i) => ({ at: k, a: nm[(i + nm.length - 1) % nm.length], b: nm[(i + 1) % nm.length], t: texts[i], r: 4.4 })), pad: 6 }, o || {})); },
    // 折れ線 A−E−C と、ℓ∥m（答えには、E を通る平行線を赤で）
    zig: o => GEO(Object.assign({ pts: zigP(38, 41), segs: [['L1', 'L2', { lab: 'ℓ' }], ['M1', 'M2', { lab: 'm' }], ['A', 'E'], ['E', 'C']], par: [['L1', 'A', 1], ['M1', 'C', 1]], vl: { A: ['A', 120], E: ['E', 40], C: ['C', 240] }, pad: 6,
      ang: [{ at: 'A', a: 'L2', b: 'E', t: '38°', r: 5 }, { at: 'C', a: 'M2', b: 'E', t: '41°', r: 5 }, { at: 'E', a: 'A', b: 'C', r: 4.5 }], txt: [{ p: 'E', t: 'x', dx: -9.5, dy: -3.2 }], a: { segs: [['G', 'H', { dash: 1 }]] } }, o || {})),
    // 折れ線 A−E−F−C（ℓ∥m）。答えには、E、F を通る平行線を赤で
    w: o => GEO(Object.assign({ pts: wP(48, 112, 63), segs: [['L1', 'L2', { lab: 'ℓ' }], ['M1', 'M2', { lab: 'm' }], ['A', 'E'], ['E', 'F'], ['F', 'C']], par: [['L1', 'A', 1], ['M1', 'C', 1]], vl: { A: ['A', 110], E: ['E', 250], F: ['F', 70], C: ['C', 290] }, pad: 6,
      ang: [{ at: 'A', a: 'L2', b: 'E', t: '48°', r: 5, lr: 11 }, { at: 'E', a: 'A', b: 'F', t: '112°', r: 4.5, lr: 8.5 }, { at: 'C', a: 'M1', b: 'F', t: '63°', r: 5, lr: 10 }, { at: 'F', a: 'E', b: 'C', t: 'x', r: 4.5, lr: 7 }],
      a: { segs: [['EG', 'EH', { dash: 1 }], ['FG', 'FH', { dash: 1 }]] } }, o || {})),
    // 線分 AD、BC が O で交わる（AO＝DO、BO＝CO）。AB∥DC は、結論なので、しるしをつけない
    bow: o => GEO(Object.assign({ pts: bowP(), segs: [['A', 'B'], ['C', 'D'], ['A', 'D'], ['B', 'C']], tick: [['A', 'O', 1], ['O', 'D', 1], ['B', 'O', 2], ['O', 'C', 2]], vl: { A: 'A', B: 'B', C: 'C', D: 'D', O: ['O', 270, 3.4] }, pad: 6 }, o || {})),
    // 線分 AB、CD が O で交わる（AO＝BO、∠OAC＝∠OBD）
    bow2: o => GEO(Object.assign({ pts: bow2P(), segs: [['A', 'B'], ['C', 'D'], ['A', 'C'], ['B', 'D']], tick: [['A', 'O', 1], ['O', 'B', 1]], vl: { A: 'A', B: 'B', C: 'C', D: 'D', O: ['O', 340, 3.4] }, pad: 6,
      ang: [{ at: 'A', a: 'O', b: 'C', n: 1, r: 4.5 }, { at: 'B', a: 'O', b: 'D', n: 1, r: 4.5 }] }, o || {})),
    // M は AB の中点、AC∥DB
    mid: o => GEO(Object.assign({ pts: midP(), segs: [['A', 'B'], ['C', 'D'], ['A', 'C'], ['D', 'B']], tick: [['A', 'M', 1], ['M', 'B', 1]], par: [['A', 'C', 1], ['D', 'B', 1]], vl: { A: 'A', B: 'B', C: 'C', D: 'D', M: ['M', 235, 3.4] }, pad: 6 }, o || {})),
    // △ABC と、∠B、∠C の二等分線の交点 I
    bis: o => GEO(Object.assign({ pts: bisP(), poly: 'ABC', segs: [['B', 'I'], ['C', 'I']], vl: { A: 'A', B: 'B', C: 'C', I: ['I', 90, 3.4] }, pad: 6,
      ang: [{ at: 'A', a: 'B', b: 'C', t: '56°', r: 5, lr: 10 }, { at: 'B', a: 'C', b: 'I', n: 1, r: 5 }, { at: 'B', a: 'I', b: 'A', n: 1, r: 5 }, { at: 'C', a: 'B', b: 'I', n: 2, r: 5 }, { at: 'C', a: 'I', b: 'A', n: 2, r: 5 }, { at: 'I', a: 'B', b: 'C', t: 'x', r: 3, lr: 5.2 }] }, o || {}))
  };

  // 例題の表（空欄をうめる）
  const EX_ROWS = [
    ['①', ['AO＝{{DO}}', '仮定']],
    ['②', ['BO＝{{CO}}', '仮定']],
    ['③', ['∠AOB＝∠{{DOC}}', '{{対頂角}}は等しい']],
    ['合同', ['△AOB≡△DOC', '{{2組の辺とその間の角}}']],
    ['対応', ['∠OAB＝∠ODC', '合同な図形の、{{対応}}する角は等しい']],
    ['結論', ['AB∥DC', '{{錯角}}が等しい']]
  ];

  /* ---------------- 答えの文（画面にも checks にも、同じ文字列を使う） ---------------- */
  const A_TASK = '① 同位角は等しく、Q の上の右の角も 125°\n　 一直線の角だから　x＝180°−125°＝55°\n② 外角の性質より　x＝52°+61°＝113°\n③ 五角形の内角の和は　180°×(5−2)＝540°　x＝540°−(110°+120°+95°+105°)＝110°';
  const A_D1 = '一直線の角　180°−123°＝57°\n平行線の同位角は等しいから　x＝57°';
  const A_D2 = '① 180°×(10−2)＝1440°　　② 180°−360°÷18＝160°\n③ 360°÷40°＝9　　正九角形';
  const A_D3 = 'E を通り、ℓ に平行な直線をひく。\n錯角は等しいから　x＝38°+41°＝79°';
  const A_D4 = 'ア、ウ　　ア … 3組の辺　　ウ … 1組の辺とその両端の角\n（イは ∠B が AB、AC の間の角でなく、エは 3組の角だけだから、合同といえない）';
  const A_D5 = '∠MAC＝∠MBD（錯角）、∠AMC＝∠BMD（対頂角）\n1組の辺とその両端の角';
  const A_D6 = '1つの外角を x° とすると　5x+x＝180　x＝30\n360÷30＝12　　正十二角形';
  const A_D7 = '① ∠IBC+∠ICB＝[[1/2]]×(180°−56°)＝62°\n　 ∠BIC＝180°−62°＝118°\n② ∠IBC+∠ICB＝[[1/2]](180°−a°)\n　 ∠BIC＝180°−[[1/2]](180°−a°)＝90°+[[1/2]]a°';
  const A_Q1 = '同位角は等しく、Q の上の左の角も 128°\n一直線の角だから　x＝180°−128°＝52°';
  const A_Q2 = '① 180°×(12−2)＝1800°\n② 360°÷15＝24°\n③ 外角は　180°−144°＝36°　　360°÷36°＝10　　正十角形';
  const A_Q3 = '左から　BO、対頂角、1組の辺とその両端の角、辺';
  const A_QC = 'E、F を通り、ℓ に平行な直線をひく。\nE で　180°−112°−48°＝20°\n錯角は等しいから　F で　20°+x+63°＝180°\nx＝180°−20°−63°＝97°';

  const DEF = {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第14時', title: '「平行と合同」で学んだことを、整理して確かめよう',
    summary: '単元の重要語句を整理し、平行線と角・多角形の角・合同条件・証明を確かめる。考えようは、この単元の問題についての、ア〜エの考えや答えが正しいかどうか。',
    head: '平行と合同　第14時',
    pitch: 8, dots: true,
    checks: [
      // 学習課題 ①：ℓ∥m。P の上の右の角 125°。Q の上の右の角も 125°（同位角）。x（Q の下の右の角）＝180°−125°＝55°
      chk('第14時 学習課題①', `const P = (${parP})(125, 2); return near(P.L2[1] - P.L1[1], 0) && par(P, 'L1', 'L2', 'M1', 'M2') && near(ang(P, 'P', 'L2', 'U'), 125) && near(ang(P, 'Q', 'M2', 'P'), 125) && near(ang(P, 'Q', 'M2', 'W'), 55) && near(180 - 125, 55);`),
      // ②：∠B＝61°、∠C＝67°、∠A＝52°。∠ACD＝∠A＋∠B＝113°
      chk('第14時 学習課題②', `const P = (${triP})(61, 67, 4.4); return near(ang(P, 'A', 'B', 'C'), 52) && near(ang(P, 'B', 'A', 'C'), 61) && near(ang(P, 'C', 'B', 'A'), 67) && near(ang(P, 'C', 'A', 'D'), 113) && near(52 + 61, 113) && near(ang(P, 'C', 'A', 'D'), ang(P, 'A', 'B', 'C') + ang(P, 'B', 'A', 'C'));`),
      // ③：五角形の内角 110°、120°、95°、105°、x。内角の和 540°
      chk('第14時 学習課題③', `const P = (${polyP})([110, 120, 95, 105, 110], [2.6, 3, 3.2]), v = 'ABCDE', a = [110, 120, 95, 105, 110]; return v.split('').every((k, i) => near(ang(P, k, v[(i + 4) % 5], v[(i + 1) % 5]), a[i])) && near(a.reduce((s, x) => s + x, 0), 180 * (5 - 2)) && near(540 - (110 + 120 + 95 + 105), 110);`),
      // 例題：AO＝DO、BO＝CO、∠AOB＝∠DOC（対頂角）→ △AOB≡△DOC → ∠OAB＝∠ODC（錯角）→ AB∥DC
      chk('第14時 例題', `const P = (${bowP})(); return near(d(P, 'A', 'O'), d(P, 'D', 'O')) && near(d(P, 'B', 'O'), d(P, 'C', 'O')) && near(ang(P, 'O', 'A', 'B'), ang(P, 'O', 'D', 'C')) && cong(P, 'AOB', 'DOC') && near(ang(P, 'A', 'O', 'B'), ang(P, 'D', 'O', 'C')) && par(P, 'A', 'B', 'D', 'C');`),
      // 考えよう（答えは載せない。ここで確かめるだけ）：ア 図は ℓ∥m だが、問題に平行と書いていない（∠x＝65°は、平行ならば成り立つ）　イ 正八角形の内角 135°、外角 45°　ウ ∠A＝50°、∠B＝60°、∠ACD＝110°　エ △ABC≡△DEF のとき、AC に対応する辺は DF（DE ではない）
      chk('第14時 考えよう', `const P = (${parP})(65, 2), T = (${triP})(60, 70, 4.4), W = (${twoP})(); return par(P, 'L1', 'L2', 'M1', 'M2') && near(ang(P, 'P', 'L2', 'U'), 65) && near(ang(P, 'Q', 'M2', 'P'), 65) && near(180 * (8 - 2) / 8, 135) && near(360 / 8, 45) && near(135 + 45, 180) && near(ang(T, 'A', 'B', 'C'), 50) && near(ang(T, 'C', 'A', 'D'), 110) && near(50 + 60, 110) && cong(W, 'ABC', 'DEF') && near(d(W, 'A', 'C'), d(W, 'D', 'F')) && !near(d(W, 'A', 'C'), d(W, 'D', 'E')) && near(d(W, 'A', 'B'), d(W, 'D', 'E'));`),
      // 基礎（1）P の上の左の角 123°（n は 57°）→ x（Q の上の右の角）＝57°（元の ②③ の三角形・四角形は、ワークシートの問いと重なるので使わない。計算の答えは、答えの文の検算で見る）
      chk('第14時 基礎（1）', `const P = (${parP})(57, 2); return par(P, 'L1', 'L2', 'M1', 'M2') && near(ang(P, 'P', 'L1', 'U'), 123) && near(ang(P, 'P', 'L2', 'U'), 180 - 123) && near(ang(P, 'Q', 'M2', 'P'), ang(P, 'P', 'L2', 'U')) && near(ang(P, 'Q', 'M2', 'P'), 57) && near(180 - 123, 57);`),
      // （2）① 十角形 1440°　② 正十八角形：外角 20°、内角 160°　③ 外角 40° → 360÷40＝9（正九角形）
      chk('第14時 基礎（2）', `return near(180 * (10 - 2), 1440) && near(360 / 18, 20) && near(180 - 360 / 18, 160) && near(180 * (18 - 2) / 18, 160) && near(360 / 40, 9) && near(180 * (9 - 2) / 9, 180 - 40) && near(180 - 40, 140);`),
      // 標準（3）ℓ∥m、∠A＝38°、∠C＝41°。x＝∠AEC＝79°（E を通る平行線）
      chk('第14時 標準（3）', `const P = (${zigP})(38, 41); return near(P.L1[1], P.A[1]) && near(P.M1[1], P.C[1]) && near(P.L2[1] - P.L1[1], 0) && near(ang(P, 'A', 'L2', 'E'), 38) && near(ang(P, 'C', 'M2', 'E'), 41) && near(ang(P, 'E', 'A', 'C'), 79) && near(38 + 41, 79) && near(P.G[1], P.E[1]) && near(P.H[1], P.E[1]);`),
      // （5）ア 3組の辺（合同の座標例）、イ AB＝DE、AC＝DF、∠B＝∠E は、合同でない 2つの三角形がある（∠B＝40°、AB＝5、AC＝3.5）、ウ 1組の辺とその両端の角、エ 3組の角（大きさがちがう相似な三角形）
      chk('第14時 標準（5）', `const W = (${twoP})(), r = Math.PI / 180, u = [Math.cos(40 * r), Math.sin(40 * r)], au = 5 * u[0], hh = Math.sqrt(au * au - (25 - 12.25)), mkT = t => ({ B: [0, 0], A: [5, 0], C: [t * u[0], t * u[1]] }), T1 = mkT(au + hh), T2 = mkT(au - hh), Pt = { A: T1.A, B: T1.B, C: T1.C, D: T2.A, E: T2.B, F: T2.C }, S = { A: W.A, B: W.B, C: W.C, D: [0, 0], E: [W.B[0] * 1.5, W.B[1] * 1.5], F: [W.C[0] * 1.5, W.C[1] * 1.5] }; return cong(W, 'ABC', 'DEF') && near(d(W, 'A', 'B'), d(W, 'D', 'E')) && near(d(W, 'B', 'C'), d(W, 'E', 'F')) && near(d(W, 'C', 'A'), d(W, 'F', 'D')) && near(d(W, 'B', 'C'), d(W, 'E', 'F')) && near(ang(W, 'B', 'A', 'C'), ang(W, 'E', 'D', 'F')) && near(ang(W, 'C', 'B', 'A'), ang(W, 'F', 'E', 'D')) && near(d(Pt, 'A', 'B'), d(Pt, 'D', 'E')) && near(d(Pt, 'A', 'C'), d(Pt, 'D', 'F')) && near(ang(Pt, 'B', 'A', 'C'), ang(Pt, 'E', 'D', 'F')) && !near(d(Pt, 'B', 'C'), d(Pt, 'E', 'F')) && !cong(Pt, 'ABC', 'DEF') && near(ang(S, 'A', 'B', 'C'), ang(S, 'D', 'E', 'F')) && near(ang(S, 'B', 'A', 'C'), ang(S, 'E', 'D', 'F')) && near(ang(S, 'C', 'A', 'B'), ang(S, 'F', 'D', 'E')) && !cong(S, 'ABC', 'DEF');`),
      // （6）M は AB の中点、AC∥DB。∠MAC＝∠MBD（錯角）、∠AMC＝∠BMD（対頂角）、AM＝BM → △AMC≡△BMD → CM＝DM
      chk('第14時 標準（6）', `const P = (${midP})(); return near(d(P, 'A', 'M'), d(P, 'B', 'M')) && par(P, 'A', 'C', 'D', 'B') && near(ang(P, 'A', 'M', 'C'), ang(P, 'B', 'M', 'D')) && near(ang(P, 'M', 'A', 'C'), ang(P, 'M', 'B', 'D')) && cong(P, 'AMC', 'BMD') && near(d(P, 'C', 'M'), d(P, 'D', 'M'));`),
      // （4）内角＝5×外角：外角 x、5x＋x＝180、x＝30、n＝12（3〜60 角形で調べる）
      chk('第14時 標準（4）', `const a = []; for (let n = 3; n <= 60; n++) if (near(180 * (n - 2) / n, 5 * (360 / n))) a.push(n); return a.length === 1 && a[0] === 12 && near(5 * 30 + 30, 180) && near(360 / 30, 12);`),
      // チャレンジ（8）△ABC：∠A＝56°、∠B＝64°、∠C＝60°。I は ∠B、∠C の二等分線の交点。∠BIC＝118°＝90°＋56°÷2。どんな三角形でも ∠BIC＝90°＋∠A÷2
      chk('第14時 チャレンジ（8）', `const P = (${bisP})(); let ok = near(ang(P, 'A', 'B', 'C'), 56) && near(ang(P, 'B', 'C', 'I'), ang(P, 'B', 'I', 'A')) && near(ang(P, 'B', 'C', 'I') * 2, ang(P, 'B', 'C', 'A')) && near(ang(P, 'C', 'B', 'I') * 2, ang(P, 'C', 'B', 'A')) && near(ang(P, 'I', 'B', 'C'), 118) && near((180 - 56) / 2, 62) && near(180 - 62, 118); for (const [b, c] of [[50, 70], [64, 60], [30, 100], [80, 55]]) { const a = 180 - b - c, Q = (${triP})(b, c, 4.6), h1 = b / 2 * Math.PI / 180, h2 = (180 - c / 2) * Math.PI / 180, t = 4.6 * Math.sin(h2) / (Math.cos(h1) * Math.sin(h2) - Math.sin(h1) * Math.cos(h2)); Q.I = [t * Math.cos(h1), t * Math.sin(h1)]; ok = ok && near(ang(Q, 'I', 'B', 'C'), 90 + a / 2); } return ok;`),
      // 小テスト（1）n が 52°：P の上の左の角 128°、x（Q の下の左の角）＝52°　（2）十二角形 1800°、正十五角形の外角 24°、内角 144° の正多角形は外角 36° → 正十角形
      chk('第14時 小テスト（1）（2）', `const P = (${parP})(52, 2); return par(P, 'L1', 'L2', 'M1', 'M2') && near(ang(P, 'P', 'L1', 'U'), 128) && near(ang(P, 'Q', 'M1', 'P'), 128) && near(ang(P, 'Q', 'M1', 'W'), 52) && near(180 - 128, 52) && near(180 * (12 - 2), 1800) && near(360 / 15, 24) && near(180 - 144, 36) && near(360 / 36, 10) && near(180 * (10 - 2) / 10, 144);`),
      // 小テスト（3）AO＝BO、∠OAC＝∠OBD、∠AOC＝∠BOD（対頂角）→ △AOC≡△BOD（1組の辺とその両端の角）→ AC＝BD
      chk('第14時 小テスト（3）', `const P = (${bow2P})(); return near(d(P, 'A', 'O'), d(P, 'B', 'O')) && near(ang(P, 'A', 'O', 'C'), ang(P, 'B', 'O', 'D')) && near(ang(P, 'O', 'A', 'C'), ang(P, 'O', 'B', 'D')) && cong(P, 'AOC', 'BOD') && near(d(P, 'A', 'C'), d(P, 'B', 'D'));`),
      // チャレンジ：ℓ∥m。∠EAℓ＝48°、∠AEF＝112°、∠FCm＝63°。E、F を通る平行線で、20°＋x＋63°＝180°、x＝97°
      chk('第14時 小テスト チャレンジ', `const P = (${wP})(48, 112, 63); return near(P.L1[1], P.A[1]) && near(P.M1[1], P.C[1]) && near(ang(P, 'A', 'L2', 'E'), 48) && near(ang(P, 'E', 'A', 'F'), 112) && near(ang(P, 'C', 'M1', 'F'), 63) && near(ang(P, 'F', 'E', 'C'), 97) && near(180 - 112 - 48, 20) && near(180 - 20 - 63, 97) && near(48 + 112 - 63 + 0, 97);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('「平行と合同」で学んだことを、整理して確かめよう'),
      K('今日の問い', '下の図で、∠x の大きさを求めよう。また、使った性質も答えよう。\n（①は ℓ∥m である。）', 2),
      F(5,
        FIG.par(125, [{ at: 'P', a: 'L2', b: 'U', t: '125°', r: 5, lr: 8 }, { at: 'Q', a: 'M2', b: 'W', t: 'x', r: 5 }], true, { pad: 5 }),
        FIG.tri(61, 67, [{ at: 'A', a: 'B', b: 'C', t: '52°', r: 5, lr: 10 }, { at: 'B', a: 'C', b: 'A', t: '61°', r: 5 }, { at: 'C', a: 'A', b: 'D', t: 'x', r: 5 }], true, { pad: 5 }),
        FIG.poly([110, 120, 95, 105, 110], [2.6, 3, 3.2], ['110°', '120°', '95°', '105°', 'x'], { pad: 5 })),
      T('①', '自分の考え（3分）　①〜③の ∠x と、使った性質を書こう。', 1),
      B(4, A_TASK),
      T('②', 'ペアの考え（3分）　ちがう求め方や、性質のことばを書こう。', 1),
      B(2, ''),
      WD('向かい合う角を{{対頂角}}という。平行線の{{同位角}}・{{錯角}}は等しい。\n三角形の内角の和は{{180°}}、n角形は{{180°×(n−2)}}。\n多角形の外角の和は{{360°}}。\n三角形の{{合同条件}}は 3つ。\n{{根拠}}をあげて筋道を立てて示すことを{{証明}}という。', 5, { label: 'ことば' }),
      G(1),
      C2([
        K('例題', '右の図で、線分 AD と BC は点 O で交わり、AO＝DO、BO＝CO である。AB∥DC を証明するために、表の空欄をうめよう。', 4)
      ], [
        F(4, FIG.bow({ pad: 4 }))
      ], '3:2'),
      TB('', ['等しいもの', 'わけ（根拠）'], EX_ROWS, { hw: 22 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 向かい合う角を{{対頂角}}という。平行線の{{同位角}}・{{錯角}}は等しい。\n② 三角形の内角の和は{{180°}}。n角形の外角の和は{{360°}}。\n③ 三角形の{{合同条件}}は 3つ。{{根拠}}をあげて示すことを{{証明}}という。', 3, { label: 'ことば' }),
      F(4,
        cap(FIG.par(57, [{ at: 'P', a: 'L1', b: 'U', t: '123°', r: 5, lr: 8 }, { at: 'Q', a: 'M2', b: 'P', t: 'x', r: 5 }], true, { pad: 4 }), '図1'),
        cap(FIG.zig({ pad: 4 }), '図2'),
        cap(FIG.mid({ pad: 4 }), '図3')),
      T('（1）', '図1で、ℓ∥m である。∠x の大きさと、使った性質を答えよう。', 1),
      B(2, A_D1),
      T('（2）', '① 十角形の内角の和　② 正十八角形の 1つの内角\n③ 1つの外角が 40° の正多角形は、正何角形か。', 2),
      B(2, A_D2),
      MA('【説明】（1）で使った性質を、ことばを使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '学んだことを、組み合わせて使おう。'),
      C2([
        T('（3）', '図2で、ℓ∥m である。∠x の大きさを求めよう。', 2),
        B(3, A_D3)
      ], [
        T('（4）', '1つの内角が、1つの外角の 5倍である正多角形は、正何角形か。', 2),
        B(3, A_D6)
      ], '1:1'),
      T('（5）', '△ABC と △DEF で、合同といえるものをすべて選び、合同条件も答えよう。\nア AB＝DE、BC＝EF、CA＝FD　　イ AB＝DE、AC＝DF、∠B＝∠E\nウ BC＝EF、∠B＝∠E、∠C＝∠F　　エ ∠A＝∠D、∠B＝∠E、∠C＝∠F', 3),
      B(2, A_D4),
      T('（6）', '図3で、AM＝BM、AC∥DB である。△AMC≡△BMD を示すとき、等しい2組の角と、その根拠、合同条件を答えよう。', 2),
      B(2, A_D5),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：どの考えや答えが、正しいだろう。'),
      T('（7）', 'ア〜エは、この単元の問題についての、ある生徒の考えや答えである。「正しい」か「正しくない」かを選び、わけを書こう。', 2),
      C2([
        T('ア', '右の図で、∠a＝65° である。ℓ と m は平行に見えるから、同位角は等しい。だから、∠x＝65° である。', 3)
      ], [
        F(3, FIG.par(65, [{ at: 'P', a: 'L2', b: 'U', t: 'a', r: 5 }, { at: 'Q', a: 'M2', b: 'P', t: 'x', r: 5 }], false, { pad: 4 }))
      ], '3:1'),
      T('イ', '正八角形の 1つの外角の大きさを、180°×(8−2)÷8＝135° と求めた。', 1),
      C2([
        T('ウ', '△ABC で、∠A＝50°、∠B＝60° である。辺 BC を C のほうへのばした直線上に点 D をとると、∠ACD＝50°+60°＝110° である。', 3)
      ], [
        F(4, FIG.tri(60, 70, [{ at: 'A', a: 'B', b: 'C', t: '50°', r: 5, lr: 10 }, { at: 'B', a: 'C', b: 'A', t: '60°', r: 5 }, { at: 'C', a: 'A', b: 'D', r: 5 }], true, { pad: 4 }))
      ], '3:1'),
      T('エ', '△ABC≡△DEF のとき、辺 AC に対応する辺は、辺 DE である。', 1),
      T('①', 'ア〜エを、○か×かと、わけで書こう。×は、直そう。', 1),
      B(4, ''),
      T('②', '角度をはかって確かめることと、証明することは、どこがちがうだろう。', 1),
      B(4, ''),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '△ABC の ∠B、∠C の二等分線の交点を I とする。\n① ∠A＝56° のとき、∠BIC の大きさを求めよう。\n② ∠A＝a° のとき、∠BIC を a を使って表そう。', 4)
      ], [
        F(4, FIG.bis({ pad: 4 }))
      ], '2:1'),
      B(4, A_D7),
      MA('① ∠IBC は ∠B の、∠ICB は ∠C の、何分の1かな。\n② △IBC の内角の和は 180° だよ。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '右の図で、ℓ∥m である。\n∠x の大きさを求めよう。（3点）', 3),
        B(2, A_Q1)
      ], [
        F(4, FIG.par(52, [{ at: 'P', a: 'L1', b: 'U', t: '128°', r: 5, lr: 8 }, { at: 'Q', a: 'M1', b: 'W', t: 'x', r: 5 }], true, { pad: 4 }))
      ], '2:1'),
      T('（2）', '① 十二角形の内角の和　　② 正十五角形の 1つの外角\n③ 1つの内角が 144° の正多角形は、正何角形か。（3点）', 2),
      B(3, A_Q2),
      C2([
        T('（3）', '右の図で、AO＝BO、∠OAC＝∠OBD ならば、AC＝BD である。空欄をうめて、証明を完成させよう。（4点）', 4)
      ], [
        F(4, FIG.bow2({ pad: 4 }))
      ], '2:1'),
      T('', '△AOC と △BOD において\n仮定より　AO＝{{BO}} …①　　∠OAC＝∠OBD …②\n{{対頂角}}は等しいから　∠AOC＝∠BOD …③\n①、②、③より、{{1組の辺とその両端の角}}が、それぞれ等しいから　△AOC≡△BOD\n合同な図形の、対応する{{辺}}は等しいから　AC＝BD', 5),
      B(1, A_Q3),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（4）', '右の図で、ℓ∥m である。\n∠x の大きさを求めよう。', 3)
      ], [
        F(5, FIG.w({ pad: 4 }))
      ], '2:1'),
      B(4, A_QC)
    ]
  };
  // 教卓の解答（B の答え）のすべてについて、文字のない式が、計算として正しいか確かめる
  DEF.checks.push(chk('第14時 答えの文の計算', `const T = ${J(ANS(DEF.ws).concat(ANS(DEF.dr), ANS(DEF.qz)))}; return T.length > 10 && T.every(arith);`));
  IK.lesson('heikou_new-14', DEF);
})();
