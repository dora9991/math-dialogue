/* 平行と合同（新しい形） 第8時：ぴったり重なる図形の、辺や角の関係を調べよう。 元：data/lesson_heikou_08.js（前の形・40KB）。題・めあて・数値・図の関数・checks を引きつぎ、次のように組みかえた。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（ア〜オの5つの三角形から、ぴったり重なる組（ウは裏返す）を見つけ、重ならないものはどこがちがうか。辺の長さも全部印刷）。
     個人3分 → ペア3分 → ことば（合同・対応・長さ大きさ等しい・≡）→ 例題（四角形 ABCD≡四角形 EFGH。対応する頂点の表・FG・∠G。空欄あり）。
   ・演習プリントは表裏：表＝確かめる 2問（図1・図2）・使ってみる 4問／裏＝ひろげる 1問（元の考えよう：△ABC≡△EDF と書いたらどうなるか。答えは載せない）・チャレンジ★★ 1問（元の入試（9）折り返し。ヒントカードつき）。
     元の基礎（1）（2）は、小問を減らして（1）（2）に。標準（3）は図なしの読みとり問題（対応する辺と角）に、標準（4）→（4）、応用（6）→（5）、入試（8）→（6）。元の応用（5）（いつでも合同か）は小テスト（4）に残る。
     元の応用（7）・発展・授業計画は使わない。
   ・考えよう（演習プリント（7））の答え（≡ の順が対応を表す。EDF だと BC に DF が対応して長さが合わない）は、どこにも書かない。ことばにも、演習（3）の答えにも、「≡ は対応する頂点を同じ順に書く」とは書いていない。
   ・変えた数値（元のまちがいではない。答えが別の値と重なって、見分けがつかないものを直した）：
       演習（2）四角形：辺 4・6・5・3cm（元は 4・5・5・2cm。BC＝CD＝5cm で、GH と FG が見分けられなかった）／演習（4）∠A＝100°・∠B＝80°・∠C＝95° → ∠H＝85°（元は 95°・70°・100° で、答え 95° が ∠A と同じ）
       チャレンジ（8）折り返し：∠B＝70°・∠C＝48°（元は 50°。∠ADE＝50° と見分けがつかなかった）→ ∠A＝62°、∠AED＝68°、∠x＝44°
       小テスト チャレンジ：周の長さ 42cm（元は 40cm。AB＝CA＝13cm で、DE と DF が同じ長さになった）→ AB＝13・BC＝14・CA＝15、DF＝15cm
   ・図は、すべて座標（cm）から描いた（GEO）。合同な 2つの図形は、1つを裏返し・回転して動かした座標なので、対応する辺の長さ・角の大きさが本当に等しい。checks では、すべての図（11）で、辺の長さの字・角の字を座標から測り直し、合同な組の対応・答えを確かめた。
   検算：node tools/verify.cjs heikou_new-08　／　見た目：node tools/check.cjs <出力先> heikou_new-08 */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, TB, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 座標（cm）をつくる道具 ----------------
     triSSS：3辺（AB・BC・CA）から △ABC の座標　rigid：図形を、裏返し（flip）→回転（rot 度）→平行移動（to）で動かす
     pair：図形 P1（頂点の名前 na）と、それを動かしてできる合同な図形（名前 nb。対応する順に同じ番号）を、1つの図にならべる */
  const rad = d => d * Math.PI / 180;
  const triSSS = (ab, bc, ca) => { const x = (ab * ab + bc * bc - ca * ca) / (2 * bc); return [[x, Math.sqrt(ab * ab - x * x)], [0, 0], [bc, 0]]; };   // A・B・C
  const rigid = (P, o) => P.map(p => { let x = o.flip ? -p[0] : p[0], y = p[1]; const t = rad(o.rot || 0), c = Math.cos(t), s = Math.sin(t); [x, y] = [x * c - y * s, x * s + y * c]; return [x + (o.to ? o.to[0] : 0), y + (o.to ? o.to[1] : 0)]; });
  const cen = P => [P.reduce((a, p) => a + p[0], 0) / P.length, P.reduce((a, p) => a + p[1], 0) / P.length];
  // 辺 i→j の字（text）：多角形の外がわ（中心から遠ざかる向き）に k mm
  const lenTxt = (P, names, i, j, text, k) => {
    const a = P[i], b = P[j], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], c = cen(P), d = Math.hypot(m[0] - c[0], m[1] - c[1]) || 1, nx = (m[0] - c[0]) / d, ny = (m[1] - c[1]) / d;
    const w = [...String(text).replace(/[{}]/g, '')].reduce((s, ch) => s + (/[\x20-\x7e]/.test(ch) ? 1.7 : 3), 0), kk = Math.max(k || 0, w / 2 * Math.abs(nx) + 1.6 * Math.abs(ny) + 1.8);   // 字の大きさしだいで、辺からはなす
    return { p: m, t: text, dx: kk * nx, dy: -kk * ny, i: names[i] + names[j] };
  };
  const FIGS = [];   // 検算（checks）に渡す、すべての図
  const reg = (name, spec) => { spec.name = name; FIGS.push(spec); return spec; };
  const cap = (spec, text) => {
    const ps = Object.values(spec.pts), x = Math.min(...ps.map(p => p[0])), y = Math.max(...ps.map(p => p[1]));
    spec.pts.CAP = [x, y + 0.5];
    spec.txt = (spec.txt || []).concat([{ p: 'CAP', t: text, anchor: 'start', size: 3.4, dy: -4.5 }]);
    return spec;
  };

  /* 1つの三角形の図（今日の問い）。辺の長さの字は、そのまま座標から測った長さ（lens）。スケールは 1cm＝4mm（大きさのちがいが、見てわかる） */
  const one = (name, P, text) => {
    const pts = { A: P[0], B: P[1], C: P[2] }, lens = [['A', 'B', text[0]], ['B', 'C', text[1]], ['C', 'A', text[2]]];
    return reg(name, { pts, poly: 'ABC', scale: 4, txt: lens.map(l => lenTxt(P, 'ABC', 'ABC'.indexOf(l[0]), 'ABC'.indexOf(l[1]), l[2], 4.2)), lens: lens.map(l => l.slice(0, 3)), tri: [['A', 'B', 'C']] });
  };

  /* 合同な 2つの図形の図。P1（名前 na）と、P1 を動かした P2（名前 nb）。
     o.tf：動かし方　o.lens1＝[[i, j, 字]]（P1 の辺の長さ）　o.angs1＝[[i, 字]]（P1 の角。'R'＝直角）　o.lens2・o.angs2：P2 の字　o.rlens2・o.rangs2：P2 の、解答のときだけ出す赤い字
     o.map：対応（P1 の頂点 → P2 の頂点。検算用）　o.ask：答えの確かめ［[頂点, 頂点, 長さ]…］（辺の長さ）、o.askA：［[頂点, 頂点, 頂点, 大きさ]…］（角） */
  const pair = (name, P1, na, nb, o) => {
    const P2a = rigid(P1, o.tf), n = P1.length, minB = Math.min(...P2a.map(p => p[0])), maxA = Math.max(...P1.map(p => p[0]));
    const ya = (Math.min(...P1.map(p => p[1])) + Math.max(...P1.map(p => p[1]))) / 2, yb = (Math.min(...P2a.map(p => p[1])) + Math.max(...P2a.map(p => p[1]))) / 2;
    const minA = Math.min(...P1.map(p => p[1])), maxB = Math.max(...P2a.map(p => p[1])), xa = (Math.min(...P1.map(p => p[0])) + maxA) / 2, xb = (minB + Math.max(...P2a.map(p => p[0]))) / 2;
    const P2 = o.stack ? P2a.map(p => [p[0] + xa - xb, p[1] + minA - (o.gap || 1.4) - maxB]) : P2a.map(p => [p[0] + maxA + (o.gap || 2.8) - minB, p[1] + ya - yb]);   // stack：下にならべる
    const pts = {}; [...na].forEach((k, i) => { pts[k] = P1[i]; }); [...nb].forEach((k, i) => { pts[k] = P2[i]; });
    const nm = (names, i) => names[(i + n) % n];
    const txt = [], ang = [], lens = [], at = (P, names, L) => (L || []).forEach(l => { const t = lenTxt(P, names, l[0], l[1], l[2], 4); txt.push(t); lens.push([names[l[0]], names[l[1]], l[2]]); });
    at(P1, na, o.lens1);
    (o.angs1 || []).forEach(a => ang.push(a[1] === 'R' ? { at: nm(na, a[0]), a: nm(na, a[0] - 1), b: nm(na, a[0] + 1), right: true } : { at: nm(na, a[0]), a: nm(na, a[0] - 1), b: nm(na, a[0] + 1), t: a[1], r: 4.5, lr: a[2] || 9 }));
    at(P2, nb, o.lens2);
    (o.angs2 || []).forEach(a => ang.push(a[1] === 'R' ? { at: nm(nb, a[0]), a: nm(nb, a[0] - 1), b: nm(nb, a[0] + 1), right: true } : { at: nm(nb, a[0]), a: nm(nb, a[0] - 1), b: nm(nb, a[0] + 1), t: a[1], r: 4.5, lr: a[2] || 9 }));
    const red = { txt: [], ang: [] };
    (o.rlens2 || []).forEach(l => { const t = lenTxt(P2, nb, l[0], l[1], l[2], 4); red.txt.push(t); lens.push([nb[l[0]], nb[l[1]], l[2]]); });
    (o.rangs2 || []).forEach(a => red.ang.push({ at: nm(nb, a[0]), a: nm(nb, a[0] - 1), b: nm(nb, a[0] + 1), t: a[1], r: 4.5, lr: a[2] || 9 }));
    const vl = {}; [[P1, na], [P2, nb]].forEach(([P, names]) => { const c = cen(P); [...names].forEach((k, i) => { vl[k] = [k, Math.atan2(P[i][1] - c[1], P[i][0] - c[0]) * 180 / Math.PI, 3.6]; }); });
    const spec = { pts, poly: [na, nb], txt, ang, vl, lens, cong: [[[...na], [...nb]]], map: o.map || null, ask: o.ask || [], askA: o.askA || [], tf: o.tf };
    if (red.txt.length || red.ang.length) spec.a = red;
    if (o.pad != null) spec.pad = o.pad;
    return reg(name, spec);
  };

  /* ---------------- 問題の図 ---------------- */
  const T0 = triSSS(4, 6, 5);                                                       // 辺 4cm・6cm・5cm の三角形（A・B・C）
  const Z_ア = one('今日の問い ア', T0, ['4cm', '6cm', '5cm']);
  const Z_イ = one('今日の問い イ', rigid(T0, { rot: 125 }), ['4cm', '6cm', '5cm']);
  const Z_ウ = one('今日の問い ウ', rigid(T0, { flip: true, rot: 20 }), ['4cm', '6cm', '5cm']);
  const Z_エ = one('今日の問い エ', triSSS(2, 3, 2.5), ['2cm', '3cm', '2.5cm']);
  const Z_オ = one('今日の問い オ', triSSS(4, 7, 5), ['4cm', '7cm', '5cm']);
  [Z_ア, Z_イ, Z_ウ, Z_エ, Z_オ].forEach((z, i) => cap(z, 'アイウエオ'[i]));
  // 例題：四角形 ABCD（AB＝3、BC＝4、CD＝2.5、∠B＝90°、∠C＝70°）と、それを裏返して回した 四角形 EFGH
  const Q1 = [[0, 3], [0, 0], [4, 0], [4 + 2.5 * Math.cos(rad(110)), 2.5 * Math.sin(rad(110))]];
  const Z_E = pair('例題', Q1, 'ABCD', 'EFGH', {
    tf: { flip: true, rot: -70 }, stack: true, gap: 3, lens1: [[0, 1, '{{3cm}}'], [1, 2, '{{4cm}}'], [2, 3, '{{2.5cm}}']], angs1: [[1, 'R'], [2, '{{70°}}']],
    rlens2: [[1, 2, '4cm']], rangs2: [[2, '70°']], map: { A: 'E', B: 'F', C: 'G', D: 'H' }, ask: [['F', 'G', 4], ['G', 'H', 2.5], ['E', 'F', 3]], askA: [['F', 'G', 'H', 70]]
  });
  // ひろげる（7）：△ABC（AB＝4、BC＝6、CA＝5）と、△DEF（△ABC を裏返して回した形。DE＝4、EF＝6、FD＝5）
  const Z_K = pair('ひろげる（7）', T0, 'ABC', 'DEF', {
    tf: { flip: true, rot: 205 }, lens1: [[0, 1, '4cm'], [1, 2, '6cm'], [2, 0, '5cm']], lens2: [[0, 1, '4cm'], [1, 2, '6cm'], [2, 0, '5cm']],
    map: { A: 'D', B: 'E', C: 'F' }, ask: [['D', 'E', 4], ['E', 'F', 6], ['F', 'D', 5]]
  });
  // 確かめる（1）図1：△ABC（AB＝5、BC＝3、CA＝4、∠C＝90°）と △DEF
  const R1 = [[0, 4], [3, 0], [0, 0]];                                                // A・B・C（C が直角）
  const Z_D1 = cap(pair('確かめる（1）図1', R1, 'ABC', 'DEF', {
    tf: { flip: true, rot: 100 }, lens1: [[0, 1, '5cm'], [1, 2, '3cm'], [2, 0, '4cm']], angs1: [[2, 'R']], map: { A: 'D', B: 'E', C: 'F' },
    ask: [['D', 'E', 5], ['E', 'F', 3], ['D', 'F', 4]], askA: [['E', 'F', 'D', 90]]
  }), '図1');
  // 確かめる（2）図2：四角形 ABCD（AB＝4、BC＝6、CD＝5、DA＝3、∠A＝∠B＝90°）と 四角形 EFGH
  const Q2 = [[0, 4], [0, 0], [6, 0], [3, 4]];
  const Z_D2 = cap(pair('確かめる（2）図2', Q2, 'ABCD', 'EFGH', {
    tf: { rot: 200 }, lens1: [[0, 1, '4cm'], [1, 2, '6cm'], [2, 3, '5cm'], [3, 0, '3cm']], angs1: [[0, 'R'], [1, 'R']], map: { A: 'E', B: 'F', C: 'G', D: 'H' },
    ask: [['E', 'F', 4], ['G', 'H', 5], ['E', 'H', 3]], askA: [['E', 'F', 'G', 90]]
  }), '図2');
  // 小テスト（2）：△ABC（AB＝3、∠B＝70°、BC＝4）と △DEF
  const S2 = [[3 * Math.cos(rad(70)), 3 * Math.sin(rad(70))], [0, 0], [4, 0]];
  const Z_Q2 = pair('小テスト（2）', S2, 'ABC', 'DEF', {
    tf: { flip: true, rot: 140 }, lens1: [[0, 1, '3cm'], [1, 2, '4cm']], angs1: [[1, '70°']], map: { A: 'D', B: 'E', C: 'F' },
    ask: [['E', 'F', 4], ['D', 'E', 3]], askA: [['D', 'E', 'F', 70]]
  });
  // チャレンジ（8）折り返し：△ABC（∠B＝70°、∠C＝48°、∠A＝62°）を、A が BC 上の A′ に重なるように、DE で折る。∠BDA′＝80°
  const fold = (() => {
    const Bp = [0, 0], Cp = [6, 0];
    const A = (() => { const s = 6 * Math.sin(rad(48)) / Math.sin(rad(62)); return [s * Math.cos(rad(70)), s * Math.sin(rad(70))]; })();   // 正弦定理で AB を出す（∠A＝62°）
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1], sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
    // A′ ＝ (t, 0)。折り目は AA′ の垂直二等分線。D は AB 上、E は AC 上。∠BDA′ が 80° になる t を、はさみうちで探す
    const calc = t => {
      const Ap = [t, 0], m = [(A[0] + Ap[0]) / 2, (A[1] + Ap[1]) / 2], n = sub(Ap, A);
      const hit = (P, Q) => { const d = sub(Q, P), u = dot(sub(m, P), n) / dot(d, n); return [P[0] + d[0] * u, P[1] + d[1] * u]; };
      const D = hit(Bp, A), E = hit(Cp, A), ang = (P, Q, R) => { const a = sub(P, Q), b = sub(R, Q); return Math.acos(dot(a, b) / Math.hypot(...a) / Math.hypot(...b)) * 180 / Math.PI; };
      return { Ap, D, E, bda: ang(Bp, D, Ap) };
    };
    let lo = 0.3, hi = 5.7;
    for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (calc(mid).bda > 80) hi = mid; else lo = mid; }   // t が大きいほど ∠BDA′ は大きい
    const r = calc((lo + hi) / 2);
    return Object.assign({ A, B: Bp, C: Cp }, r);
  })();
  const Z_D9 = reg('チャレンジ（8）', {
    pts: { A: fold.A, B: fold.B, C: fold.C, D: fold.D, E: fold.E, "A'": fold.Ap }, poly: ['ABC'], segs: [['D', 'E', { dash: 1 }], ['D', "A'"], ["A'", 'E']],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 150], E: ['E', 30], "A'": ["A′", 270, 3.6] },
    ang: [{ at: 'B', a: 'C', b: 'A', t: '70°', r: 3.6, lr: 6.8 }, { at: 'C', a: 'B', b: 'A', t: '48°', r: 5, lr: 10 }, { at: 'D', a: 'B', b: "A'", t: '80°', r: 5, lr: 8 }, { at: 'E', a: "A'", b: 'C', t: 'x', r: 5, lr: 9 }],
    xv: 44, fold: true,
    a: { ang: [{ at: 'D', a: 'A', b: 'E', t: '50°', r: 6, lr: 10 }, { at: 'D', a: 'E', b: "A'", t: '50°', r: 6, lr: 10 }, { at: 'E', a: 'D', b: 'A', t: '68°', r: 6, lr: 10 }, { at: 'E', a: "A'", b: 'D', t: '68°', r: 6, lr: 10 }] }
  });

  // 小さい図（演習プリント裏の折り返し）：字・弧・字をおく距離を 0.8 倍、字の大きさ 2.6、まわりの余白 4 にして、図を大きくする
  const compact = spec => {
    const f = 0.8, fix = src => {
      if (!src) return;
      (src.ang || []).forEach(an => { an.r = (an.r || 5) * f; if (an.lr != null) an.lr *= f; });
      Object.keys(src.vl || {}).forEach(n => { const v = src.vl[n]; if (Array.isArray(v)) src.vl[n] = [v[0], v[1], (v[2] == null ? 3.4 : v[2]) * f]; });
    };
    fix(spec); fix(spec.a); spec.size = 2.6; spec.pad = 4;
    return spec;
  };
  compact(Z_D9);

  /* ---------------- 答えの文（画面にも検算にも、同じ文字列を使う） ---------------- */
  const T_W = '（例）重なる組 … ア・イ・ウ（ウは、裏返すと重なる）\nエ … 形は同じだが、大きさ（辺の長さ）がちがう。\nオ … 辺の長さが 4cm・7cm・5cm で、ちがう。';
  const T_E = '（2）FG は BC に対応する\n　　から　FG＝4cm\n（3）∠G は ∠C に対応する\n　　から　∠G＝70°';
  const T_D1 = '① 頂点 E\n② DE＝AB＝5cm';
  const T_D2 = '① GH＝CD＝5cm\n② ∠F＝∠B＝90°';
  const T_D3 = '辺 AC に対応する辺は　辺 FD\n∠E に対応する角は　∠B';
  const T_D4 = '∠D＝360°−(100°+80°+95°)＝85°\n∠H は ∠D に対応するから 85°';
  const T_D5 = 'CA＝21−6−8＝7（cm）\nDF は CA に対応するから 7cm';
  const T_D6 = '3x−2＝x+6 より　x＝4\n2x+1＝y+3 に x＝4 を\n入れて　9＝y+3　y＝6';
  const T_D8 = '折り返したから △ADE≡△A′DE\n∠ADE＝(180°−80°)÷2＝50°\n∠A＝180°−70°−48°＝62°\n∠AED＝180°−62°−50°＝68°\n∠A′ED＝∠AED＝68° だから\n∠x＝180°−68°−68°＝44°';
  const T_Q1 = '対応する頂点・辺・角　　記号 ≡';
  const T_Q2 = '① 頂点 D　　② EF＝BC＝4cm\n③ ∠E＝∠B＝70°';
  const T_Q3 = '∠B＝∠E＝70° だから　∠C＝180°−50°−70°＝60°\n∠F＝∠C＝60°';
  const T_Q4 = 'ア、イ、エ';
  const T_QC = 'AB＝DE だから　2x+3＝x+8　　x＝5\nAB＝13cm、BC＝3×5−1＝14cm\nCA＝42−13−14＝15cm　　DF＝CA＝15cm';

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     figCheck：すべての図で、辺の長さの字・角の字を座標から測り直し、合同な組は対応する辺・角が等しいか、対応（map）が長さを変えないか、答え（ask・askA）が合うか
     arith：答えの文の中の、数だけの式（180°−70°−48°＝62° など）が計算として合うか */
  const figCheck = F => {
    const ang = (P, Q, R) => { const a = Math.atan2(P[1] - Q[1], P[0] - Q[0]), b = Math.atan2(R[1] - Q[1], R[0] - Q[0]); const d = Math.abs(a - b) * 180 / Math.PI; return d > 180 ? 360 - d : d; };
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]), bad = [];
    if (F.length !== 11) bad.push('図の数');
    F.forEach(f => {
      const P = f.pts, pt = k => (typeof k === 'string' ? P[k] : k), no = s => bad.push(f.name + '：' + s);
      (f.lens || []).forEach(l => { if (/^[0-9.]+cm$/.test(String(l[2]).replace(/[{}]/g, '')) && Math.abs(dist(P[l[0]], P[l[1]]) - parseFloat(String(l[2]).replace(/[{}]/g, ''))) > 0.01) no('辺 ' + l[0] + l[1] + ' の字 ' + l[2] + '（測った長さ ' + dist(P[l[0]], P[l[1]]).toFixed(3) + '）'); });
      const angOK = L => (L || []).forEach(an => {
        const m = ang(pt(an.a), P[an.at], pt(an.b));
        if (an.right) { if (Math.abs(m - 90) > 0.05) no('直角のしるし ' + an.at); return; }
        const t = String(an.t == null ? '' : an.t).replace(/[{}]/g, '');
        if (t === 'x') { if (Math.abs(m - f.xv) > 0.05) no('x（' + an.at + '）が ' + m.toFixed(2) + '°'); return; }
        const v = parseFloat(t);
        if (!isNaN(v) && Math.abs(m - v) > 0.05) no('角 ' + an.at + ' の字 ' + t + '（測った大きさ ' + m.toFixed(2) + '°）');
      });
      angOK(f.ang); angOK(f.a && f.a.ang);
      (f.cong || []).forEach(c => { const a = c[0], b = c[1], n = a.length; a.forEach((_, i) => { if (Math.abs(dist(P[a[i]], P[a[(i + 1) % n]]) - dist(P[b[i]], P[b[(i + 1) % n]])) > 1e-9) no('合同でない（辺 ' + a[i] + a[(i + 1) % n] + '）'); if (Math.abs(ang(P[a[(i + n - 1) % n]], P[a[i]], P[a[(i + 1) % n]]) - ang(P[b[(i + n - 1) % n]], P[b[i]], P[b[(i + 1) % n]])) > 1e-9) no('合同でない（角 ' + a[i] + '）'); }); });
      const ks = f.map ? Object.keys(f.map) : [];
      ks.forEach(a => ks.forEach(b => { if (Math.abs(dist(P[a], P[b]) - dist(P[f.map[a]], P[f.map[b]])) > 1e-9) no('対応がずれている ' + a + b); }));
      (f.ask || []).forEach(s => { if (Math.abs(dist(P[s[0]], P[s[1]]) - s[2]) > 0.01) no('答えの長さ ' + s[0] + s[1] + '＝' + s[2] + '（測った長さ ' + dist(P[s[0]], P[s[1]]).toFixed(3) + '）'); });
      (f.askA || []).forEach(s => { if (Math.abs(ang(P[s[0]], P[s[1]], P[s[2]]) - s[3]) > 0.05) no('答えの角 ' + s[1] + '＝' + s[3] + '°（測った大きさ ' + ang(P[s[0]], P[s[1]], P[s[2]]).toFixed(2) + '°）'); });
    });
    return bad;
  };
  const arith = t => String(t).split('\n').every(line => {
    const s = line.replace(/°/g, '').replace(/−/g, '-').replace(/÷/g, '/').replace(/×/g, '*'), re = /[0-9+\-*/＝().]+/g;
    let m, ok = true;
    while ((m = re.exec(s))) {
      let r = m[0];
      if (/^[+\-*/]/.test(r) || /[+\-*/]$/.test(r)) continue;
      if (r[0] === '＝') r = r.slice(1);
      const parts = r.split('＝').filter(z => z !== '');
      if (parts.length < 2 || r.split('(').length !== r.split(')').length || /^[).]|[(.]$/.test(r)) continue;
      const v = parts.map(z => { try { return new Function('return ' + z)(); } catch (e) { return NaN; } });
      if (!v.every(w => Math.abs(w - v[0]) < 1e-9)) ok = false;
    }
    return ok;
  });
  const FIGCHK = '/* 平行と合同 第8時：すべての図（11）で、辺の長さ・角の字、合同な組の対応、答えが、座標から測り直して合うか */ (' + figCheck + ')(' + J(FIGS) + ').length === 0';
  const ARITH = '/* 答えの文の中の、数だけの式が合うか */ (() => { const arith = ' + arith + '; return ' + J([T_W, T_E, T_D1, T_D2, T_D3, T_D4, T_D5, T_D6, T_D8, T_Q2, T_Q3, T_QC]) + '.every(arith); })()';
  // 今日の問い の 5つの三角形：ア・イ・ウは合同（3辺が同じ。ウは向きが逆＝裏返し）、エは大きさがちがう（辺が半分）、オは辺の長さがちがう
  const triCheck = Ts => {
    const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]), sides = P => [d(P.A, P.B), d(P.B, P.C), d(P.C, P.A)], srt = a => a.slice().sort((x, y) => x - y);
    const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9), turn = P => (P.B[0] - P.A[0]) * (P.C[1] - P.A[1]) - (P.B[1] - P.A[1]) * (P.C[0] - P.A[0]);
    const s0 = sides(Ts[0]);
    return same(s0, sides(Ts[1])) && same(s0, sides(Ts[2])) && turn(Ts[0]) * turn(Ts[1]) > 0 && turn(Ts[0]) * turn(Ts[2]) < 0 &&
      same(srt(s0), [4, 5, 6]) && same(srt(sides(Ts[3])).map(v => v * 2), srt(s0)) && !same(srt(sides(Ts[4])), srt(s0)) && same(srt(sides(Ts[4])), [4, 5, 7]);
  };
  const TRIS = '/* 今日の問い：ア・イ・ウは合同（ウは裏返し）、エ・オは合同でない */ (' + triCheck + ')(' + J([Z_ア, Z_イ, Z_ウ, Z_エ, Z_オ].map(z => z.pts)) + ')';
  // ひろげる（7）（答えは載せない。ここで確かめるだけ）：△ABC≡△DEF の対応（A-D、B-E、C-F）では辺の長さが全部合う。△ABC≡△EDF の対応（A-E、B-D、C-F）では、BC（6cm）に DF（5cm）が対応して合わない
  const KOUSEI = '/* ひろげる（7）：DEF の対応は合い、EDF の対応は BC と DF の長さが合わない（座標から） */ (() => { const P = ' + J(Z_K.pts) + ', d = (a, b) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]); const ok = m => ["AB", "BC", "CA"].every(s => Math.abs(d(s[0], s[1]) - d(m[s[0]], m[s[1]])) < 1e-9); return ok({ A: "D", B: "E", C: "F" }) && !ok({ A: "E", B: "D", C: "F" }) && Math.abs(d("B", "C") - 6) < 1e-9 && Math.abs(d("D", "F") - 5) < 1e-9; })()';

  IK.lesson('heikou_new-08', {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第8時', title: 'ぴったり重なる図形の、辺や角の関係を調べよう',
    summary: 'ぴったり重なる図形（合同な図形）の、対応する頂点・辺・角を読みとり、記号 ≡ で表す。ひろげるは、△ABC≡△DEF と △ABC≡△EDF の書き方のちがい。',
    head: '平行と合同　第8時',
    pitch: 8, dots: true,
    checks: [
      FIGCHK,
      TRIS,
      KOUSEI,
      ARITH,
      // 使ってみる（3）≡ の順：△ABC≡△FED のとき、対応は A-F、B-E、C-D。AC ↔ FD、∠E ↔ ∠B（対応を作り直して確かめる）
      '(() => { const m = {}; [..."ABC"].forEach((k, i) => { m[k] = [..."FED"][i]; }); const inv = {}; Object.keys(m).forEach(k => { inv[m[k]] = k; }); return m.A + m.C === "FD" && inv.E === "B"; })()',
      // 使ってみる（4）四角形 ABCD の ∠A＝100°、∠B＝80°、∠C＝95° → ∠D＝360−275＝85°。向きを回して四角形の座標をつくり（AB＝4、BC＝3）、∠D を測り直す
      '(() => { const R = Math.PI / 180, u = d => [Math.cos(d * R), Math.sin(d * R)], ang = (P, Q, S) => { const a = Math.atan2(P[1] - Q[1], P[0] - Q[0]), b = Math.atan2(S[1] - Q[1], S[0] - Q[0]); const d = Math.abs(a - b) / R; return d > 180 ? 360 - d : d; }; const A = [0, 0], B = [4, 0], C = [B[0] + 3 * u(100)[0], 3 * u(100)[1]], u2 = u(185), u3 = u(280), det = u2[0] * u3[1] - u2[1] * u3[0], L = (-C[0] * u3[1] + C[1] * u3[0]) / det, M = (u2[0] * -C[1] - u2[1] * -C[0]) / det, D = [C[0] + L * u2[0], C[1] + L * u2[1]]; return L > 0 && M > 0 && near(ang(B, A, D), 100) && near(ang(A, B, C), 80) && near(ang(B, C, D), 95) && near(ang(C, D, A), 85) && near(360 - (100 + 80 + 95), 85); })()',
      // 使ってみる（5）周 21、AB＝6、BC＝8 → CA＝7、DF＝CA（しらみつぶし）
      '(() => { const s = []; for (let c = 1; c < 21; c++) if (6 + 8 + c === 21) s.push(c); return s.join() === "7"; })()',
      // 使ってみる（6）3x−2＝x+6 → x＝4、2x+1＝y+3 → y＝6。しらみつぶし（x は 1〜20、y は 1〜20）
      '(() => { const a = []; for (let x = 1; x <= 20; x++) for (let y = 1; y <= 20; y++) if (3 * x - 2 === x + 6 && 2 * x + 1 === y + 3) a.push([x, y]); return a.length === 1 && a[0][0] === 4 && a[0][1] === 6 && near(3 * 4 - 2, 10) && near(4 + 6, 10) && near(2 * 4 + 1, 9) && near(6 + 3, 9); })()',
      // チャレンジ（8）折り返し：∠ADE＝(180−80)÷2＝50、∠A＝62、∠AED＝180−62−50＝68、x＝180−68×2＝44（図の座標から測った x と同じ）。ほかの ∠B・∠C でも x＝2∠A−80
      '(() => { const A = 180 - 70 - 48; return near((180 - 80) / 2, 50) && A === 62 && near(180 - A - 50, 68) && near(180 - 68 - 68, 44) && [[70, 48], [65, 55], [60, 60]].every(([b, c]) => near(180 - 2 * (180 - (180 - b - c) - 50), 2 * (180 - b - c) - 80)); })()',
      // 小テスト（3）∠B＝∠E＝70、∠C＝180−50−70＝60　チャレンジ x＝5、AB＝13、BC＝14、CA＝42−27＝15（三角形がつくれる。AB・BC・CA がちがう）
      'near(180 - 50 - 70, 60) && (() => { const a = []; for (let x = 1; x <= 30; x++) if (2 * x + 3 === x + 8) a.push(x); const ab = 2 * 5 + 3, bc = 3 * 5 - 1, ca = 42 - ab - bc; return a.length === 1 && a[0] === 5 && ab === 13 && bc === 14 && ca === 15 && near(5 + 8, 13) && ab + bc > ca && bc + ca > ab && ca + ab > bc && new Set([ab, bc, ca]).size === 3; })()',
      // 小テスト（4）ア〜エのうち、いつでも合同といえるのは ア・イ・エ。ウ：周が 12cm の長方形は 1×5 と 2×4 など、いくつもあって、重ならない
      '(() => { const r = []; for (let a = 1; a <= 5; a++) for (let b = a; b <= 5; b++) if (2 * (a + b) === 12) r.push(a + "x" + b); return r.length >= 2 && r.includes("1x5") && r.includes("2x4"); })()'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('ぴったり重なる図形の、辺や角の関係を調べよう'),
      K('今日の問い', '下のア〜オのうち、ぴったり重ねられる（裏返してもよい）図形の組を見つけよう。重ならない図形は、どこがちがうだろう。', 2),
      F(5, GEO(Z_ア), GEO(Z_イ), GEO(Z_ウ), GEO(Z_エ), GEO(Z_オ)),
      T('①', '自分の考え（3分）　重なる組と、ちがうところを書こう。', 1),
      B(3, T_W),
      T('②', 'ペアの考え（3分）　自分とちがう見つけ方を書こう。', 1),
      B(2, ''),
      G(1),
      WD('移動して重なる 2つの図形は{{合同}}。\n重なり合う頂点・辺・角は、たがいに{{対応}}する。\n合同な図形で、対応する{{長さ}}・{{大きさ}}は等しい。\n合同は、記号 {{≡}} で表す。（△ABC≡△DEF）', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '右の図で、四角形 ABCD≡四角形 EFGH である。BC＝{{4}}cm、∠C＝{{70}}° のとき、次を答えよう。\n（1）頂点 A、B、C、D に対応する頂点　（2）辺 FG の長さ　（3）∠G の大きさ', 3),
      C2([
        TB('頂点', ['A', 'B', 'C', 'D'], [['対応する頂点', ['{{E}}', '{{F}}', '{{G}}', '{{H}}']]], { hw: 34 }),
        T('', '【（2）（3）】', 1),
        B(4, T_E)
      ], [
        F(9, GEO(Z_E))
      ], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 移動して、ぴったり重ねることができる 2つの図形を、{{合同}}な図形という。\n② 重なり合う頂点・辺・角を、{{対応}}する頂点・辺・角という。\n③ 合同な図形では、対応する{{長さ}}と{{大きさ}}は、それぞれ等しい。\n④ 合同を表す記号は {{≡}} である。', 4, { label: 'ことば' }),
      F(4, GEO(Z_D1), GEO(Z_D2)),
      C2([
        T('（1）', '図1で、△ABC≡△DEF。\n① 頂点 B に対応する頂点\n② 辺 DE の長さ', 4),
        B(2, T_D1)
      ], [
        T('（2）', '図2で、四角形 ABCD≡四角形 EFGH。\n① 辺 GH の長さ\n② ∠F の大きさ', 4),
        B(2, T_D2)
      ], '1:1'),
      MA('【説明】「対応する」とは何か、図を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '対応を読みとって、求めよう。'),
      C2([
        T('（3）', '△ABC≡△FED のとき、辺 AC に対応する辺と、∠E に対応する角を答えよう。', 4),
        B(2, T_D3)
      ], [
        T('（4）', '四角形 ABCD≡四角形 EFGH で、∠A＝100°、∠B＝80°、∠C＝95° のとき、∠H を求めよう。', 4),
        B(2, T_D4)
      ], '1:1'),
      C2([
        T('（5）', '△ABC≡△DEF で、AB＝6cm、BC＝8cm、△ABC の周の長さは 21cm である。辺 DF の長さを求めよう。', 4),
        B(2, T_D5)
      ], [
        T('（6）', '△ABC≡△DEF で、AB＝(3x−2)cm、DE＝(x+6)cm、BC＝(2x+1)cm、EF＝(y+3)cm のとき、x、y の値を求めよう。', 4),
        B(3, T_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：記号 ≡ の書き方を、くらべよう。'),
      T('（7）', '下の図の △ABC と △DEF は合同で、△ABC≡△DEF と書ける。△ABC≡△EDF と書いたら、どうなるだろう。辺の長さをもとに、調べよう。', 2),
      F(4, GEO(Z_K)),
      T('', '頂点 A、B、C に対応する頂点を、表に書こう。', 1),
      TB('頂点', ['A', 'B', 'C'], [['△ABC≡△DEF', ['', '', '']], ['△ABC≡△EDF', ['', '', '']]], { hw: 44 }),
      T('', '△ABC≡△EDF と書いたとき、辺 BC に対応する辺は、どの辺か。長さを図から読みとり、BC とくらべよう。', 2),
      B(3, ''),
      T('', '△ABC≡△DEF と △ABC≡△EDF は、同じ意味だろうか。わけも書こう。', 1),
      B(3, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '△ABC を、頂点 A が辺 BC 上の点 A′ に重なるように、線分 DE を折り目として折った（右の図）。∠x の大きさを求めよう。', 4),
        B(6, T_D8)
      ], [
        F(6, GEO(Z_D9)),
        MA('① 折ると、△ADE に重なる三角形は？\n② 重なる角は、どうなる？D のまわりの角は？', 5, { label: 'ヒントカード' })
      ], '3:2')
    ],

    /* ================= 小テスト（A4 片面・5分。この時間の内容。次の時間のはじめに使う） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '合同な図形で、重なり合う頂点・辺・角を、それぞれ何というか。また、合同を表す記号を書こう。（3点）', 2),
      B(1, T_Q1),
      C2([
        T('（2）', '右の図で、△ABC≡△DEF である。（3点）\n① 頂点 A に対応する頂点\n② 辺 EF の長さ\n③ ∠E の大きさ', 5),
        B(2, T_Q2)
      ], [
        F(7, GEO(Z_Q2))
      ], '3:2'),
      T('（3）', '△ABC≡△DEF で、∠A＝50°、∠E＝70° である。∠F の大きさを求めよう。（2点）', 2),
      B(2, T_Q3),
      T('（4）', '次のア〜エのうち、いつでも合同といえるものを、すべて選ぼう。（2点）\nア 半径が等しい 2つの円　　イ 面積が等しい 2つの正方形\nウ 周の長さが等しい 2つの長方形　　エ 1辺の長さが等しい 2つの正三角形', 3),
      B(1, T_Q4),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '△ABC≡△DEF で、AB＝(2x+3)cm、DE＝(x+8)cm、BC＝(3x−1)cm である。△ABC の周の長さが 42cm のとき、辺 DF の長さを求めよう。', 3),
      B(3, T_QC)
    ]
  });
})();
