/* ノート型ワークシートの「最初の形」を書くための道具。data/ws_<単元>.js で使う。
   1行＝罫1本分（A4・罫7mmで37行）。まとめ・振り返りは入れない（編集画面のチェックで付けられる）。
   文字の中：{{答え}}＝空欄、[[1/2]]＝分数、x^2＝累乗、**太字**、{|式1|式2|}＝連立方程式（中かっこ）、√{12×8}＝根号（上に線）。
   問題演習プリント（data/dr_<単元>.js）：WSL.addp(時間のID, ブロック) で登録。両面で1枚。
     表＝めあて（ラベル「問題演習」）→ ポイント → SEC('基礎・基本') → SEC('標準')、BR()、裏＝SEC('応用') → SEC('入試に挑戦')。
   図（GE）のきまり：「長さ A B 5cm」は点線の弧＋字、頂点には ● をかかない（必要な点だけ自動でかく）。 */
(function () {
  LDB.worksheets = LDB.worksheets || {};
  LDB.drills = LDB.drills || {};   // 問題演習プリント（data/dr_<単元>.js）
  const O = (o, extra) => Object.assign(o, extra || {});
  window.WSL = {
    M: (text, o) => O({ type: 'meate', text }, o),                                   // めあて
    K: (label, text, o) => O({ type: 'kadai', label, text }, o),                    // 学習課題・問題（枠つき）
    T: (label, text, o) => O({ type: 'text', label, text }, o),                     // 問題文・説明（印刷する）
    W: (label, rows, answer, prompt, o) => O({ type: 'write', label: label || '', rows: rows || 1, answer: answer || '', prompt: prompt || '' }, o),  // 記入欄
    S: rows => ({ type: 'write', rows: rows || 1 }),                                // 何も書いていない行
    TB: (rows, o) => O({ type: 'table', rows: rows.map(r => Array.isArray(r) ? { h: r[0], cells: r[1], blank: !!r[2], head: !!r[3] } : r) }, o),  // 表 [見出し, 値, 空欄?, 見出し行?]
    F: (rows, ...figs) => ({ type: 'figure', rows, figs }),                         // 図（横に並べられる）
    NL: o => O({ kind: 'numline', min: -10, max: 10, label: 5 }, o),               // 数直線
    CO: o => O({ kind: 'coord' }, o),                                               // 座標平面
    GE: (src, o) => O({ kind: 'geo', src: Array.isArray(src) ? src.join('\n') : src }, o),   // 図形（1行に1つ）
    SO: o => O({ kind: 'solid' }, o),                                               // 立体の見取図
    CH: o => O({ kind: 'chart' }, o),                                               // グラフ・ヒストグラム
    C2: (left, right, ratio) => ({ type: 'cols', ratio: ratio || '1:1', cols: [{ blocks: left }, { blocks: right }] }),  // 2段組
    C3: (a, b, c, ratio) => ({ type: 'cols', ratio: ratio || '1:1:1', cols: [{ blocks: a }, { blocks: b }, { blocks: c }] }),  // 3段組
    BR: () => ({ type: 'break' }),                                                  // 改ページ
    add: (id, blocks, o) => { LDB.worksheets[id] = O({ paper: 'A4', pitch: 7, dots: true, head: null, blocks }, o); },
    // 問題演習プリント（両面で1枚）：SEC＝見出し（基礎・基本／標準／応用／入試に挑戦）、addp＝登録。表と裏は BR() で分ける
    SEC: (label, text) => ({ type: 'meate', label, text: text || '' }),
    addp: (id, blocks, o) => { LDB.drills[id] = O({ paper: 'A4', pitch: 7, dots: true, head: null, kind: 'drill', blocks }, o); }
  };
  /* 問題演習プリントの小道具
       DT(ねらい)            … 最初の行（ラベル「問題演習」）
       PT(文, 行数)          … ポイント（{{ }} の空欄つき）
       NYU()                 … 「入試に挑戦」の見出し
       Q(番号, 問題文, 行数, 解答例, 検算, {p, t})   … 小問1つ（問題文＋記入欄）
       QS(小問のならび, 列の数, 行数, はじめの番号) … 小問を 1〜3列にならべる。小問は [問題文, 解答例, 検算, {rows, p, t}]
     検算のしるし：calc＝式の計算・展開／fact＝因数分解／eq＝方程式／sys＝連立方程式／quad＝二次方程式／val＝式の値。
     p は検算に使う式（問題文とちがうとき）。記入欄の行数は「解答例の行数＋1」以上にして、計算するところを広めにとる。 */
  WSL.DT = text => WSL.M(text, { label: '問題演習' });
  WSL.PT = (text, rows) => WSL.T('ポイント', text, rows ? { rows } : undefined);
  WSL.NYU = text => WSL.SEC('入試に挑戦', text || '入試でよく出る形に合わせてつくった問題に挑戦しよう。');
  WSL.Q = (n, text, rows, ans, v, o) => [WSL.T(typeof n === 'number' ? `（${n}）` : n, text, o && o.t), WSL.W('', rows, ans, '', v ? { v, vp: (o && o.p) || text } : undefined)];
  // start＝はじめの番号（省くと 1）。'①' と書くと、小問を ①②③… にする（番号つきの問いの下に、小問をならべるとき。番号が重ならないように）
  WSL.QS = (items, cols, rows, start) => {
    const CN = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫', circ = start === '①';
    const out = [], n0 = circ ? 0 : (start || 1);
    cols = cols || 1;
    for (let k = 0; k < items.length; k += cols) {
      const grp = items.slice(k, k + cols), r = Math.max(...grp.map(it => (it[3] && it[3].rows) || rows || 3));
      const cells = grp.map((it, i) => WSL.Q(circ ? CN[k + i] : n0 + k + i, it[0], r, it[1], it[2], it[3]));
      if (cols === 1) out.push(...cells[0]);
      else { while (cells.length < cols) cells.push([]); out.push({ type: 'cols', ratio: cols === 3 ? '1:1:1' : '1:1', cols: cells.map(c => ({ blocks: c })) }); }
    }
    return out;
  };
  /* 図の座標を計算する小道具（図を、問題の長さ・角度のとおりにかくため）。点は [x, y]
       pol(p, r, 度)…p から r、その向きの点　　on(p, q, t)…線分 pq を t：(1−t) に分ける点　　mid(p, q)…中点
       apex(b, c, lb, lc)…b からの距離 lb、c からの距離 lc の点（b→c の左側）　　meet(p, 度, q, 度)…2つの半直線の交点
       cross(p1, p2, p3, p4)…直線 p1p2 と p3p4 の交点　　mv(p, k, o)…k 倍して o だけずらす　　foot(p, a, b)…p から直線 ab への垂線の足
       V(名前, p, 向き)＝「頂点」の行　　P(名前, p, 向き)＝「点」の行 */
  const n3 = v => Math.round(v * 1000) / 1000, rad = d => d * Math.PI / 180;
  const cross = (p1, p2, p3, p4) => {
    const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
    const a = p1[0] * p2[1] - p1[1] * p2[0], b = p3[0] * p4[1] - p3[1] * p4[0];
    return [n3((a * (p3[0] - p4[0]) - (p1[0] - p2[0]) * b) / d), n3((a * (p3[1] - p4[1]) - (p1[1] - p2[1]) * b) / d)];
  };
  WSL.G = {
    n3, cross,
    pol: (p, r, deg) => [n3(p[0] + r * Math.cos(rad(deg))), n3(p[1] + r * Math.sin(rad(deg)))],
    on: (p, q, t) => [n3(p[0] + (q[0] - p[0]) * t), n3(p[1] + (q[1] - p[1]) * t)],
    mid: (p, q) => [n3((p[0] + q[0]) / 2), n3((p[1] + q[1]) / 2)],
    apex: (b, c, lb, lc) => {
      const d = Math.hypot(c[0] - b[0], c[1] - b[1]), x = (d * d + lb * lb - lc * lc) / (2 * d), y = Math.sqrt(Math.max(0, lb * lb - x * x));
      const ux = (c[0] - b[0]) / d, uy = (c[1] - b[1]) / d;
      return [n3(b[0] + ux * x - uy * y), n3(b[1] + uy * x + ux * y)];
    },
    meet: (p, a, q, b) => cross(p, [p[0] + Math.cos(rad(a)), p[1] + Math.sin(rad(a))], q, [q[0] + Math.cos(rad(b)), q[1] + Math.sin(rad(b))]),
    mv: (p, k, o) => [n3((o ? o[0] : 0) + p[0] * k), n3((o ? o[1] : 0) + p[1] * k)],
    foot: (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy); return [n3(a[0] + dx * t), n3(a[1] + dy * t)]; },
    // 3点を通る円（中心 c と半径 r）
    circum: (p, q, s) => {
      const d = 2 * (p[0] * (q[1] - s[1]) + q[0] * (s[1] - p[1]) + s[0] * (p[1] - q[1])), a = p[0] * p[0] + p[1] * p[1], b = q[0] * q[0] + q[1] * q[1], c = s[0] * s[0] + s[1] * s[1];
      const x = (a * (q[1] - s[1]) + b * (s[1] - p[1]) + c * (p[1] - q[1])) / d, y = (a * (s[0] - q[0]) + b * (p[0] - s[0]) + c * (q[0] - p[0])) / d;
      return { c: [n3(x), n3(y)], r: n3(Math.hypot(p[0] - x, p[1] - y)) };
    },
    // 向きの名前（角度から）：0°＝右、90°＝上 …
    dirOf: a => ['右', '右上', '上', '左上', '左', '左下', '下', '右下'][Math.round((((a % 360) + 360) % 360) / 45) % 8],
    V: (name, p, dir) => `頂点 ${name} ${p[0]} ${p[1]}${dir ? ' ' + dir : ''}`,
    P: (name, p, dir) => `点 ${name} ${p[0]} ${p[1]}${dir ? ' ' + dir : ''}`
  };
  /* よく使う図（問題の長さのとおりにかく）。data/dr_<単元>.js で const { para, bfly, hour, par3 } = WSL.FIG; として使う */
  WSL.FIG = (() => {
    const { GE } = WSL, { pol, on, apex, n3 } = WSL.G, Vx = WSL.G.V;
    const hid = (n, p) => `点 ${n} ${p[0]} ${p[1]} 非表示`;
    // 名前のない多角形（方眼の図など）
    const poly = (nm, pts, flag) => [...pts.map((p, i) => hid(nm + i, p)), `多角形 ${pts.map((p, i) => nm + i).join(' ')}${flag ? ' ' + flag : ''}`];
    // 「長さ」の行。字を '6cm|左' のように書くと、弧の向きをその場で決められる
    const len = (p, q, s, extra) => { if (!s) return []; const [lab, d] = String(s).split('|'); return [`長さ ${p} ${q} ${lab} ${d != null ? d : (extra || '')}`.trim()]; };
    /* △ABC（BC が底辺）で、D、E は A から見て AB、AC の t 倍のところ（DE∥BC。t＜0 なら A の反対側＝ちょうの形。t＝[AD÷AB, AE÷AC] と書けば平行でない図）。
       a＝BC、b＝CA、c＝AB（cm）。s＝{AD, DB, AB, AE, EC, AC, DE, BC} に字を書くと「長さ」になる。n＝点の名前 */
    const para = (a, b, c, t, s, o) => {
      o = o || {}; const tD = Array.isArray(t) ? t[0] : t, tE = Array.isArray(t) ? t[1] : t; t = tD;
      const n = o.n || 'ABCDE', B = [0, 0], C = [a, 0], A = apex(B, C, c, b), D = on(A, B, tD), E = on(A, C, tE), neg = t < 0;
      const inn = !neg && (s.DB || s.EC);   // D・E の名前を内側に書く
      const src = [Vx(n[0], A, neg ? '左' : '上'), Vx(n[1], B, '左下'), Vx(n[2], C, '右下'), `多角形 ${n[0]} ${n[1]} ${n[2]}`,
        Vx(n[3], D, o.dd || (neg ? '右上' : inn ? '右下' : '左')), Vx(n[4], E, o.ed || (neg ? '左上' : inn ? '左下' : '右')), neg ? `多角形 ${n[0]} ${n[3]} ${n[4]}` : `線分 ${n[3]} ${n[4]}`,
        ...len(n[0], n[3], s.AD, neg ? '右' : '左'), ...len(n[3], n[1], s.DB, '左'), ...len(n[0], n[1], s.AB, '左 大'),
        ...len(n[0], n[4], s.AE, neg ? '左' : '右'), ...len(n[4], n[2], s.EC, '右'), ...len(n[0], n[2], s.AC, '右 大'),
        ...len(n[3], n[4], s.DE, neg || inn ? '上' : (t < 0.62 ? '下' : '上')), ...len(n[1], n[2], s.BC, '下'), ...(o.more || [])];
      return GE(src, o.caption ? { caption: o.caption } : undefined);
    };
    // 2つの線分 AB、CD が点 O で交わる図（OA、OB、OC、OD の長さと、OA の向き・∠AOC）。AC と BD を結ぶ
    const bfly = (oa, ob, oc, od, dir, ang, s, o) => {
      o = o || {}; const n = o.n || 'ABCDO', O = [0, 0], A = pol(O, oa, dir), B = pol(O, ob, dir + 180), C = pol(O, oc, dir + ang), D = pol(O, od, dir + ang + 180);
      const src = [Vx(n[4], O, o.od || '右'), Vx(n[0], A, o.ad || '左上'), Vx(n[1], B, o.bd || '右下'), Vx(n[2], C, o.cd || '左下'), Vx(n[3], D, o.dd || '右上'),
        `線分 ${n[0]} ${n[1]}`, `線分 ${n[2]} ${n[3]}`, `線分 ${n[0]} ${n[2]}`, `線分 ${n[1]} ${n[3]}`,
        ...len(n[0], n[4], s.OA, o.oad || '上'), ...len(n[4], n[1], s.OB, o.obd || '下'), ...len(n[2], n[4], s.OC, o.ocd || '下'), ...len(n[4], n[3], s.OD, o.odd || '上'),
        ...len(n[0], n[2], s.AC, '左'), ...len(n[1], n[3], s.BD, '右'), ...(o.more || [])];
      return GE(src, o.caption ? { caption: o.caption } : undefined);
    };
    /* AB∥CD で、AD と BC が点 O で交わる図（上が AB、下が CD）。oa、ob、ab＝△OAB の辺、k＝△ODC が何倍か。s＝{AB, CD, OA, OB, OC, OD} */
    const hour = (oa, ob, ab, k, s, o) => {
      o = o || {}; const n = o.n || 'ABCDO', A = [0, 0], B = [ab, 0], O = apex(B, A, ob, oa), D = on(A, O, 1 + k), C = on(B, O, 1 + k);
      const wide = (oa * oa + ob * ob - ab * ab) / (2 * oa * ob) < 0;   // ∠AOB が鈍角なら、O の名前は上（三角形の中）に書く
      return GE([Vx(n[0], A, '左上'), Vx(n[1], B, '右上'), Vx(n[2], C, '左下'), Vx(n[3], D, '右下'), Vx(n[4], O, wide ? '上' : '右'),
        `線分 ${n[0]} ${n[1]}`, `線分 ${n[2]} ${n[3]}`, `線分 ${n[0]} ${n[3]}`, `線分 ${n[1]} ${n[2]}`,
        ...len(n[0], n[1], s.AB, '上'), ...len(n[2], n[3], s.CD, '下'), ...len(n[0], n[4], s.OA, '左'), ...len(n[4], n[1], s.OB, '右'),
        ...len(n[2], n[4], s.OC, '左'), ...len(n[4], n[3], s.OD, '右'), ...(o.more || [])], o.caption ? { caption: o.caption } : undefined);
    };
    /* 平行な3直線 ℓ、m、n（横）と、それに交わる直線。h1＝ℓとmの間、k＝（mとnの間）÷（ℓとmの間）。
       lines＝[{ n:'ABC'（上から）, top:ℓ〜m の線分の長さ, x:ℓ上の位置, lean:1（下へいくほど右）／−1, side:弧の向き, dir:名前の向き, s:[上の字, 下の字, 全体の字] }…]
       o.more(点の表) で線を足せる */
    const par3 = (h1, k, lines, o) => {
      o = o || {}; const h2 = h1 * k, src = [], xs = [], Pm = {};
      lines.forEach((L, i) => {
        const lean = L.lean || 1, cs = Math.sqrt(Math.max(0, L.top * L.top - h1 * h1)) * lean, ex = 0.9 / L.top;
        const P0 = [L.x, n3(h1 + h2)], P1 = [n3(L.x + cs), n3(h2)], P2 = [n3(L.x + cs * (1 + k)), 0];
        const e0 = on(P1, P0, 1 + ex), e2 = on(P1, P2, 1 + ex / k), dir = L.dir || (lean > 0 ? '左下' : '右下'), ds = L.dirs || [L.dir || (lean > 0 ? '右上' : '左上'), dir, dir], side = L.side || (i === 0 ? '左' : '右');
        Pm[L.n[0]] = P0; Pm[L.n[1]] = P1; Pm[L.n[2]] = P2; xs.push(e0[0], e2[0]);
        src.push(Vx(L.n[0], P0, ds[0]), Vx(L.n[1], P1, ds[1]), Vx(L.n[2], P2, ds[2]), `点 t${i}a ${e0[0]} ${e0[1]} 非表示`, `点 t${i}b ${e2[0]} ${e2[1]} 非表示`, `線分 t${i}a t${i}b`);
        const s3 = L.s || [];
        src.push(...len(L.n[0], L.n[1], s3[0], side), ...len(L.n[1], L.n[2], s3[1], side), ...len(L.n[0], L.n[2], s3[2], side + ' 大'));
      });
      const x0 = n3(Math.min(...xs) - 0.8), x1 = n3(Math.max(...xs) + (o.rm || 1.6));
      [[h1 + h2, 'ℓ'], [h2, 'm'], [0, 'n']].forEach(([y, nm], i) => src.push(`点 h${i}a ${x0} ${n3(y)} 非表示`, `点 h${i}b ${x1} ${n3(y)} 非表示`, `線分 h${i}a h${i}b`, `文字 ${n3(x1 + 0.7)} ${n3(y)} ${nm}`));
      if (o.more) src.push(...o.more(Pm));
      return GE(src, o.caption ? { caption: o.caption } : undefined);
    };
    /* 円 O と円周上の点。pts＝'A:240 B:300 P:90:上'（名前:角度[:名前の向き]）、segs＝'OA OB PA PB'（線分。1文字の名前）、more＝ほかの行
       o＝{ O:'下'（中心の名前の向き。'' なら中心をかかない）, r:半径, caption, pad } */
    const circ = (pts, segs, more, o) => {
      o = o || {}; const r = o.r || 3, pad = o.pad == null ? 0.6 : o.pad, Q = { O: [0, 0] }, ND = {};
      const src = [`点 O 0 0 ${o.O == null ? '下' : (o.O || '非表示')}`, `円 O ${r}`];
      String(pts || '').split(/\s+/).filter(Boolean).forEach(t => { const [n, a, d] = t.split(':'); Q[n] = pol([0, 0], r, +a); ND[n] = d || WSL.G.dirOf(+a); src.push(`頂点 ${n} 極 O ${r} ${a} ${ND[n]}`); });
      String(segs || '').split(/\s+/).filter(Boolean).forEach(t => src.push(`線分 ${t[0]} ${t[1]}`));
      // せまい角（36°未満）の角度は、図の外側に書く（名前とかさならない向きをえらぶ）
      src.push(...(more || []).map(t => {
        const m = /^角 (\S+) (\S+) (\S+) (\d+(?:\.\d+)?)°$/.exec(t); if (!m || +m[4] >= 36 || !Q[m[2]] || m[2] === 'O' || !Q[m[1]] || !Q[m[3]]) return t;
        const V = Q[m[2]], un = p => { const dx = p[0] - V[0], dy = p[1] - V[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }, u1 = un(Q[m[1]]), u2 = un(Q[m[3]]), bx = u1[0] + u2[0], nd = ND[m[2]];
        const dir = nd.includes('左') ? (nd === '左' ? '左下' : '左') : nd.includes('右') ? (nd === '右' ? '右下' : '右') : (bx < 0 ? '左' : '右');
        return t + ' ' + dir;
      }));
      if (!o.free) src.push(`範囲 ${-r - pad} ${-r - pad} ${r + pad} ${r + pad}`);
      return GE(src, o.caption ? { caption: o.caption } : undefined);
    };
    return { len, hid, poly, para, bfly, hour, par3, circ };
  })();
  // 根号をふくむ単元用：文字の中の √2、√(4×5) を、上に線がのびる根号（√{2}、√{4×5}）に直して登録する。図の中の文字はそのまま
  const q = s => s.replace(/√\(((?:[^()]|\([^()]*\))*)\)/g, '√{$1}').replace(/√(\d+(?:\.\d+)?|[a-z])/g, '√{$1}').replace(/\}\}\}/g, '} }}');
  const SKIP = { src: 1, lines: 1, glines: 1, points: 1, points2: 1, path: 1, steps: 1, steps2: 1, kind: 1, type: 1, id: 1 };
  const fix = o => typeof o === 'string' ? q(o) : Array.isArray(o) ? o.map(fix)
    : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, SKIP[k] ? v : fix(v)])) : o;
  WSL.addq = (id, blocks, o) => WSL.add(id, fix(blocks), o);
  WSL.addpq = (id, blocks, o) => WSL.addp(id, fix(blocks), o);
})();
