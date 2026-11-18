/* 単元：語彙カード（ハンドブック 小3〜中3）。暗記して反射にする語彙と、毎回同じ型で処理する作法のドリル。
   どのカードも、前半は「出す向き」・後半は「逆向き」（変換の往復。ハンドブック §7）。
   問題には meta（種類 k と、もとの数）を残す。tools/verify.cjs が、meta から問題の文字と答えをもう一度つくって見比べる。
   形の書き方：it(meta, 式, 答え, {post})＝「式 ＝ ［答え］ 単位」／ slot(meta, 前, 答え, 後)＝「前 ［答え］ 後」（＝なし） */
(function () {
  'use strict';
  const TG = window.TG;
  const { gcd, frac: f, fracRaw: raw, dec } = TG;
  // 乗の字：² ³ はふつうの文字、4乗以上は上つき（^{4}）
  const sup = e => (e === 2 ? '²' : e === 3 ? '³' : `^{${e}}`);
  const MINUS = '−';
  const it = (meta, pre, ans, o) => Object.assign({ pre: String(pre), eq: true, ans: String(ans), meta }, o);
  const slot = (meta, pre, ans, post, o) => Object.assign({ pre: String(pre), eq: false, ans: String(ans), post: post || '', meta }, o);
  // 決まった表（pool）から1つえらぶ。tuple を build に渡して、問題にする
  const from = (pool, build) => r => build(r.pick(pool), r);

  /* ================= 小3〜小4：九九の弱点・キリ番ペア・計算の作法 ================= */
  const FACTS = [[6, 7], [7, 8], [6, 8], [4, 7], [7, 9], [25, 4], [125, 8], [15, 4], [75, 4]];
  const factF = r => {   // 6×7 ＝ □
    const [a, b] = r.pick(FACTS), sw = r.chance(0.5), [x, y] = sw ? [b, a] : [a, b];
    return it({ k: 'mulfact', a: x, b: y, hide: 0 }, `${x} × ${y}`, x * y, { key: `mf0-${a}-${b}` });
  };
  const factR = r => {   // □ × 7 ＝ 42 ／ 6 × □ ＝ 42
    const [a, b] = r.pick(FACTS), sw = r.chance(0.5), [x, y] = sw ? [b, a] : [a, b], h = r.chance(0.5) ? 1 : 2;
    return h === 1 ? slot({ k: 'mulfact', a: x, b: y, hide: 1 }, '', x, `× ${y} ＝ ${x * y}`, { key: `mf1-${x}-${y}` })
      : slot({ k: 'mulfact', a: x, b: y, hide: 2 }, `${x} ×`, y, `＝ ${x * y}`, { key: `mf2-${x}-${y}` });
  };
  const comp100 = r => { const n = r.int(11, 89); return n % 10 ? slot({ k: 'comp', n, N: 100 }, `${n} +`, 100 - n, '＝ 100') : null; };   // 足して100
  const comp1000 = r => { const n = r.int(21, 199) * 5; return slot({ k: 'comp', n, N: 1000 }, `${n} +`, 1000 - n, '＝ 1000'); };   // 足して1000
  const evenA = r => r.int(6, 49) * 2;
  const x5 = r => { const a = evenA(r); return it({ k: 'xmul', a, m: 5 }, `${a} × 5`, a * 5); };
  const x50 = r => { const a = evenA(r); return it({ k: 'xmul', a, m: 50 }, `${a} × 50`, a * 50); };
  const x99 = r => { const a = r.pick([98, 99]), m = r.int(3, 9); return it({ k: 'xmul', a, m }, `${a} × ${m}`, a * m); };
  const reord = r => {   // 25×13×4 ＝ 25×4 を先に
    const [a, b, k] = r.chance(0.5) ? [25, 4, r.int(11, 19)] : [125, 8, r.int(3, 9)];
    const pre = r.pick([`${a} × ${k} × ${b}`, `${b} × ${k} × ${a}`]);
    return it({ k: 'reord', a, b, kk: k, pre }, pre, a * b * k);
  };

  TG.addUnit({
    id: 'vkuku', cat: 'vocab', name: '九九の弱点・キリ番・計算の作法', note: '小3〜小4の語彙', n: 20, goal: [10, 8],
    steps: [
      { name: '九九の弱点ゾーン・キリ番ペア・足して100', mix: [[1, factF], [1, comp100]], name2: '逆から（□をもとめる）・足して1000', mix2: [[1, factR], [1, comp1000]] },
      { name: '×5・×50（÷2をつかう）', mix: [[1, x5], [1, x50]], name2: '×99・×98／並べかえてキリ番', mix2: [[1, x99], [1, reord]] },
    ],
  });

  /* ================= 小5〜小6：小数⇔分数 変換表 ================= */
  const FR1 = [[1, 2, '0.5'], [1, 4, '0.25'], [3, 4, '0.75'], [1, 5, '0.2'], [2, 5, '0.4'], [3, 5, '0.6'], [4, 5, '0.8'], [1, 10, '0.1'], [3, 10, '0.3'], [7, 10, '0.7']];
  const FR2 = [[1, 8, '0.125'], [3, 8, '0.375'], [5, 8, '0.625'], [7, 8, '0.875'], [1, 20, '0.05'], [1, 25, '0.04'], [1, 50, '0.02'], [3, 20, '0.15'], [7, 20, '0.35'], [2, 25, '0.08'], [3, 25, '0.12'], [3, 50, '0.06']];
  const f2dF = pool => from(pool, ([n, d, s]) => it({ k: 'f2d', n, d, s, rev: 0 }, raw(n, d), s));
  const f2dR = pool => from(pool, ([n, d, s]) => it({ k: 'f2d', n, d, s, rev: 1 }, s, raw(n, d)));
  const REC = [[1, 3, '0.333…'], [1, 6, '0.166…'], [1, 7, '0.142857…'], [1, 9, '0.111…']];
  const recF = from(REC, ([n, d, s]) => it({ k: 'rec', n, d, s, rev: 0 }, raw(n, d), s));
  const recR = from(REC, ([n, d, s]) => it({ k: 'rec', n, d, s, rev: 1 }, s, raw(n, d)));
  const DEC = [['0.5', 1, 2], ['0.25', 1, 4], ['0.75', 3, 4], ['0.2', 1, 5], ['0.4', 2, 5], ['0.6', 3, 5], ['0.8', 4, 5], ['0.125', 1, 8], ['0.375', 3, 8]];
  const dprod = r => {   // 0.25×0.25 ＝ 1/16（分数に直すと、かんたん）
    const [sx, nx, dx] = r.pick(DEC), [sy, ny, dy] = r.pick(DEC);
    if (dx * dy > 40) return null;
    return it({ k: 'dprod', x: sx, y: sy }, `${sx} × ${sy}`, f(nx * ny, dx * dy), { key: `dp-${[sx, sy].sort().join('-')}` });
  };
  const dfrac = r => {   // 0.75×2/5 ＝ 3/10
    const [sx, nx, dx] = r.pick(DEC), [n, d] = r.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5]]);
    return it({ k: 'dfrac', x: sx, n, d }, `${sx} × ${raw(n, d)}`, f(nx * n, dx * d));
  };

  TG.addUnit({
    id: 'vfrac', cat: 'vocab', name: '小数⇔分数 変換表', note: '小5〜小6の語彙（最重要）', n: 20, goal: [10, 10, 7],
    steps: [
      { name: '1/2・1/4・1/5・1/10 の仲間', gen: f2dF(FR1), name2: '小数→分数（逆向き）', gen2: f2dR(FR1) },
      { name: '1/8・1/20・1/25・1/50 の仲間', gen: f2dF(FR2), name2: '小数→分数（逆向き）', gen2: f2dR(FR2) },
      { name: '循環小数のおまけ・小数×小数', mix: [[4, recF], [6, dprod]], name2: '逆向き・小数×分数', mix2: [[4, recR], [6, dfrac]] },
    ],
  });

  /* ================= 小5〜小6：360の約数感覚 ================= */
  const ANG = [72, 60, 45, 40, 36, 30, 90, 120, 180, 270];
  const PCT = [18, 36, 54, 72, 90, 108, 144, 180, 216, 270, 288, 324];   // 角度÷3.6 が整数になるもの
  const degF = from(ANG, a => slot({ k: 'deg', a, rev: 0 }, `${a}° は 360° の`, f(a, 360), ''));
  const degR = from(ANG, a => slot({ k: 'deg', a, rev: 1 }, `360° の ${f(a, 360)} は`, a, '°'));
  const pctF = from(PCT, a => slot({ k: 'degp', a, rev: 0 }, `${a}° は 360° の`, a * 10 / 36, '%'));
  const pctR = from(PCT, a => slot({ k: 'degp', a, rev: 1 }, `360° の ${a * 10 / 36} % は`, a, '°'));

  TG.addUnit({
    id: 'v360', cat: 'vocab', name: '360の約数感覚（角度）', note: '小5〜小6の語彙', n: 20, goal: [10, 8],
    steps: [
      { name: '角度→分数（360を約分）', gen: degF, name2: '分数→角度（逆向き）', gen2: degR },
      { name: '円グラフ・おうぎ形（％と角度）', gen: pctF, name2: '％→角度（逆向き）', gen2: pctR },
    ],
  });

  /* ================= 小5〜小6：時間⇔分数・単位換算 ================= */
  const TM = [15, 20, 45, 12, 6, 30, 10, 40, 24, 36];
  const hours = m => (m === 6 ? '0.1' : f(m, 60));
  const SPD = [18, 36, 54, 72, 90, 108];   // 時速 km（÷3.6 で秒速 m が整数）
  const UNF = [['L', 'mL', 1000], ['L', 'cm³', 1000], ['m²', 'cm²', 10000], ['ha', 'm²', 10000]];
  const tmF = from(TM, m => it({ k: 'tm', m, rev: 0 }, `${m}分`, hours(m), { post: '時間' }));
  const tmR = from(TM, m => it({ k: 'tm', m, rev: 1 }, `${hours(m)}時間`, m, { post: '分' }));
  const spdF = from(SPD, kmh => slot({ k: 'spd', kmh, rev: 0 }, `時速 ${kmh} km ＝ 秒速`, kmh * 5 / 18, 'm'));
  const spdR = from(SPD, kmh => slot({ k: 'spd', kmh, rev: 1 }, `秒速 ${kmh * 5 / 18} m ＝ 時速`, kmh, 'km'));
  const unF = from(UNF, ([a, b, fac]) => it({ k: 'unf', a, b, fac, rev: 0 }, `1 ${a}`, fac, { post: b }));
  const unR = from(UNF, ([a, b, fac]) => it({ k: 'unf', a, b, fac, rev: 1 }, `${fac} ${b}`, 1, { post: a }));

  TG.addUnit({
    id: 'vtime', cat: 'vocab', name: '時間と単位の語彙', note: '小5〜小6の語彙', n: 20, goal: [10, 8],
    steps: [
      { name: '時間⇔分数（15分＝1/4時間 など）', gen: tmF, name2: '分数の時間→分（逆向き）', gen2: tmR },
      { name: '速さ（時速→秒速）・単位換算', mix: [[6, spdF], [4, unF]], name2: '逆向き（秒速→時速など）', mix2: [[6, spdR], [4, unR]] },
    ],
  });

  /* ================= 小5〜小6：3.14の段 ================= */
  const PI_K = [2, 3, 4, 5, 6, 8, 9, 10, 16, 25];
  const PI_T = [5, 6, 8, 9, 16, 25];          // 3.14×（この数）が答えになる、たし算の合計
  const PI_D = [2, 3, 4, 5, 6, 8, 9, 16];     // ひき算の答え（段にある数）
  const piF = from(PI_K, k => it({ k: 'pi', n: k, rev: 0 }, `3.14 × ${k}`, dec(314 * k)));
  const piR = from(PI_K, k => slot({ k: 'pi', n: k, rev: 1 }, '3.14 ×', k, `＝ ${dec(314 * k)}`));
  const piSum = r => {   // 3.14×7＋3.14×9 ＝ 3.14×16（くくる）
    const T = r.pick(PI_T), a = r.int(1, T - 1), b = T - a;
    return it({ k: 'pi2', a, b, op: '+' }, `3.14 × ${a} + 3.14 × ${b}`, dec(314 * T));
  };
  const piDiff = r => {   // 3.14×25−3.14×9 ＝ 3.14×16
    const T = r.pick([9, 16, 25, 8, 6, 10, 12]), d = r.pick(PI_D);
    return d < T ? it({ k: 'pi2', a: T, b: T - d, op: '−' }, `3.14 × ${T} − 3.14 × ${T - d}`, dec(314 * d)) : null;
  };

  TG.addUnit({
    id: 'vpi', cat: 'vocab', name: '3.14の段', note: '小5〜小6の語彙', n: 20, goal: [10, 8],
    steps: [
      { name: '3.14×□ の答え', gen: piF, name2: '3.14×□＝◯ の□（逆向き）', gen2: piR },
      { name: '3.14は最後に1回だけ（くくる）', gen: piSum, name2: 'ひき算でくくる', gen2: piDiff },
    ],
  });

  /* ================= 中1〜中3：平方数・べき乗 ================= */
  const sqF = pool => from(pool, n => it({ k: 'sq', n, rev: 0 }, `${n}${sup(2)}`, n * n));
  const sqR = pool => from(pool, n => it({ k: 'sq', n, rev: 1 }, `√${n * n}`, n));
  const R1 = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], R2 = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25];

  TG.addUnit({
    id: 'vsq', cat: 'vocab', name: '平方数（11〜25）', note: '中1〜中3の語彙', n: 20, goal: [10, 10],
    steps: [
      { name: '11²〜20²', gen: sqF(R1), name2: '√ → 数（逆向き）', gen2: sqR(R1) },
      { name: '11²〜25²（20〜25で貴族）', gen: sqF(R2), name2: '√ → 数（逆向き）', gen2: sqR(R2) },
    ],
  });

  const POW1 = [2, 3, 4, 5, 6, 7, 8, 9, 10].map(e => [2, e]);
  const POW2 = [[3, 2], [3, 3], [3, 4], [3, 5], [5, 2], [5, 3], [5, 4], [4, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3]];
  const powF = pool => from(pool, ([b, e]) => it({ k: 'pw', b, e, rev: 0 }, `${b}${sup(e)}`, b ** e));
  const powR = pool => from(pool, ([b, e]) => (e === 3
    ? slot({ k: 'pw', b, e, rev: 1 }, '', b, `³ ＝ ${b ** e}`)               // □³ ＝ 343
    : slot({ k: 'pw', b, e, rev: 1 }, `${b} の`, e, `乗 ＝ ${b ** e}`)));      // 2 の □ 乗 ＝ 128

  TG.addUnit({
    id: 'vpow', cat: 'vocab', name: 'べき乗・立方数', note: '中1〜中3の語彙', n: 20, goal: [9, 9],
    steps: [
      { name: '2のべき（2²〜2の10乗）', n: 18, gen: powF(POW1), name2: '何乗か？（逆向き）', gen2: powR(POW1) },
      { name: '3・5のべき・立方数', gen: powF(POW2), name2: '何乗か？／□³（逆向き）', gen2: powR(POW2) },
    ],
  });

  /* ================= 中1〜中3：平方根 ================= */
  const RT = [[2, '1.41421356'], [3, '1.7320508'], [5, '2.2360679'], [6, '2.449'], [8, '2.83'], [10, '3.16']];
  const rtF = from(RT, ([n, s]) => slot({ k: 'rt', n, s, rev: 0 }, `√${n} ≒`, s, ''));
  const rtR = from(RT, ([n, s]) => slot({ k: 'rt', n, s, rev: 1 }, '√', n, `≒ ${s}`));
  const sqrtF = r => {   // √48 ＝ 4√3
    const a = r.int(2, 7), b = r.pick([2, 3, 5, 6, 7]);
    return a * a * b <= 200 ? it({ k: 'rts', a, b, rev: 0 }, `√${a * a * b}`, `${a}√${b}`) : null;
  };
  const sqrtR = r => {   // 4√3 ＝ √48
    const a = r.int(2, 9), b = r.pick([2, 3, 5, 6, 7]);
    return it({ k: 'rts', a, b, rev: 1 }, `${a}√${b}`, `√${a * a * b}`);
  };

  TG.addUnit({
    id: 'vroot', cat: 'vocab', name: '平方根の語彙と作法', note: '中1〜中3の語彙', n: 20, goal: [6, 8],
    steps: [
      { name: '近似値（√2・√3・√5 と その仲間）', n: 12, gen: rtF, name2: '近似値→√（逆向き）', gen2: rtR },
      { name: '√の中の平方数を見つける', gen: sqrtF, name2: 'a√b → √（逆向き）', gen2: sqrtR },
    ],
  });

  /* ================= 中1〜中3：素数っぽい合成数・倍数判定 ================= */
  const FAKE = [[51, 3, 17], [57, 3, 19], [87, 3, 29], [91, 7, 13], [119, 7, 17], [133, 7, 19], [143, 11, 13], [187, 11, 17], [209, 11, 19], [221, 13, 17]];
  const compF = from(FAKE, ([n, p, q]) => it({ k: 'fake', n, p, q, rev: 0 }, `${n}`, `${p} × ${q}`));
  const compR = from(FAKE, ([n, p, q]) => it({ k: 'fake', n, p, q, rev: 1 }, `${p} × ${q}`, n));
  const PR_LO = [53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 31, 37, 41, 43, 47], CP_LO = [51, 57, 87, 91, 93, 77, 69, 39, 49, 33];
  const PR_HI = [101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229];
  const CP_HI = [119, 133, 143, 187, 209, 221, 121, 169, 161, 203, 217, 111, 117, 123, 129, 141, 147, 153];
  const isPrime = n => { for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return n > 1; };
  const isPrimeQ = (pr, cp) => r => { const n = r.pick(r.chance(0.5) ? pr : cp); return slot({ k: 'isprime', n }, `${n} は素数？`, isPrime(n) ? '○' : '×', ''); };
  const multQ = ds => r => {
    const d = r.pick(ds), big = d >= 4 ? 99999 : 9999;
    const N = r.chance(0.5) ? d * r.int(Math.ceil(100 / d), Math.floor(big / d)) : r.int(100, big);
    return slot({ k: 'mult', N, d }, `${N} は ${d} の倍数？`, N % d === 0 ? '○' : '×', '');
  };

  TG.addUnit({
    id: 'vcomp', cat: 'vocab', name: '素数っぽい合成数・倍数判定', note: '中1〜中3の語彙', n: 20, goal: [10, 10, 9],
    steps: [
      { name: '引っかけ合成数（91＝7×13 など）', gen: compF, name2: '積→もとの数（逆向き）', gen2: compR },
      { name: '素数かどうか（○×）', gen: isPrimeQ(PR_LO, CP_LO), name2: '100〜229の数', gen2: isPrimeQ(PR_HI, CP_HI) },
      { name: '倍数判定（3・9：各位の和）', gen: multQ([3, 9]), name2: '4（下2桁）・8（下3桁）', gen2: multQ([4, 8]) },
    ],
  });

  /* ================= 中1〜中3：有名直角三角形 ================= */
  const T1 = [[3, 4, 5], [5, 12, 13]], T2 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
  const triF = trips => r => {   // 直角をはさむ2辺 → 斜辺
    const [a, b, c] = r.pick(trips), m = r.int(1, trips === T1 && c === 13 ? 3 : 4), sw = r.chance(0.5);
    const [x, y] = sw ? [b * m, a * m] : [a * m, b * m];
    return c * m <= 52 ? it({ k: 'tri', a: x, b: y, c: c * m, ask: 'hyp' }, `直角をはさむ辺 ${x}・${y} の斜辺`, c * m) : null;
  };
  const triR = trips => r => {   // 斜辺と一辺 → もう一辺
    const [a, b, c] = r.pick(trips), m = r.int(1, 3), sw = r.chance(0.5);
    const [x, y] = sw ? [b * m, a * m] : [a * m, b * m];
    return c * m <= 52 ? it({ k: 'tri', a: x, b: y, c: c * m, ask: 'leg' }, `斜辺 ${c * m}・一辺 ${x} のもう一辺`, y) : null;
  };
  // 45°定規＝1:1:√2（直角二等辺三角形）、30°定規＝1:2:√3（30°・60°・90°）
  const jogiF = r => {   // 斜辺をもとめる
    const a = r.int(2, 9);
    return r.chance(0.5) ? it({ k: 'jogi', t: 'iso', a, ask: 'hyp' }, `45°定規 等辺 ${a} の斜辺`, `${a}√2`)
      : it({ k: 'jogi', t: '30', a, ask: 'hyp' }, `30°定規 短辺 ${a} の斜辺`, 2 * a);
  };
  const jogiR = r => {   // 逆向き：斜辺→等辺／短辺→長辺
    const a = r.int(2, 9);
    return r.chance(0.5) ? it({ k: 'jogi', t: 'iso', a, ask: 'leg' }, `45°定規 斜辺 ${a}√2 の等辺`, a)
      : it({ k: 'jogi', t: '30', a, ask: 'leg' }, `30°定規 短辺 ${a} の長辺`, `${a}√3`);
  };

  TG.addUnit({
    id: 'vtri', cat: 'vocab', name: '有名直角三角形', note: '中1〜中3の語彙', n: 20, goal: [8, 8, 8],
    steps: [
      { name: '3:4:5 と 5:12:13（2倍・3倍…）', gen: triF(T1), name2: '斜辺と一辺→もう一辺', gen2: triR(T1) },
      { name: '8:15:17・7:24:25もまぜる', gen: triF(T2), name2: '斜辺と一辺→もう一辺', gen2: triR(T2) },
      { name: '三角定規（45°＝1:1:√2、30°＝1:2:√3）', gen: jogiF, name2: '逆向き・長いほうの辺', gen2: jogiR },
    ],
  });

  /* ================= 作法ドリル（小5〜中3） ================= */
  const div05 = r => { const n = r.int(3, 30); return it({ k: 'divd', n, d: '0.5' }, `${n} ÷ 0.5`, n * 2); };
  const div025 = r => { const n = r.int(3, 30); return it({ k: 'divd', n, d: '0.25' }, `${n} ÷ 0.25`, n * 4); };
  const divFr = r => {   // 整数 ÷ 1/2・1/4・1/3（÷分数 ＝ ×逆数）
    const [n, d] = r.pick([[1, 2], [1, 4], [1, 3]]), a = r.int(2, 20);
    return it({ k: 'divf', a, n, d }, `${a} ÷ ${raw(n, d)}`, a * d);
  };
  const SUBX = [`x${sup(2)}`, `${MINUS}x${sup(2)}`, `(${MINUS}x)${sup(2)}`, `2x${sup(2)}`, `${MINUS}2x${sup(2)}`, `x${sup(3)}`, `${MINUS}x${sup(3)}`];
  const subx = r => {   // x＝−3 のとき x² ＝ 9、−x² ＝ −9
    const x = -r.int(2, 6), ex = r.pick(SUBX), v = { 0: x * x, 1: -(x * x), 2: x * x, 3: 2 * x * x, 4: -2 * x * x, 5: x ** 3, 6: -(x ** 3) }[SUBX.indexOf(ex)];
    return it({ k: 'subx', x, ex }, `x ＝ ${MINUS}${-x} のとき、${ex}`, v < 0 ? `${MINUS}${-v}` : v);
  };
  const signed = n => (n < 0 ? `${MINUS}${-n}` : String(n));
  const dist = r => {   // −2(x−3) ＝ −2x＋6
    const c = r.pick([2, 3, 4, 5, 6, 7, 8, 9, -2, -3, -4, -5, -6, -7, -8, -9]), d = r.pick([1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -2, -3, -4, -5, -6, -7, -8, -9]);
    const k = c * d;
    return it({ k: 'dist', c, d }, `${c < 0 ? MINUS : ''}${Math.abs(c)}(x ${d < 0 ? MINUS : '+'} ${Math.abs(d)})`, `${signed(c)}x ${k < 0 ? MINUS : '+'} ${Math.abs(k)}`);
  };
  const recinv = r => {   // 1÷(1/4)＝4、1÷(2/3)＝3/2
    const [a, b] = r.pick([[1, 2], [1, 3], [1, 4], [1, 5], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 2], [5, 3], [4, 3]]);
    return it({ k: 'recinv', a, b }, `1 ÷ ${raw(a, b)}`, f(b, a));
  };

  TG.addUnit({
    id: 'vrule', cat: 'vocab', name: '作法ドリル（÷0.5・代入・分配）', note: '小5〜中3の作法', n: 20, goal: [8, 7],
    steps: [
      { name: '÷0.5・÷0.25（わると増える）', mix: [[1, div05], [1, div025]], name2: '小数×小数（分数に直す）・÷分数', mix2: [[1, dprod], [1, divFr]] },
      { name: '代入（括弧）・−の分配・逆数の逆数', mix: [[1, subx]], name2: '−の分配・逆数の逆数', mix2: [[1, dist], [1, recinv]] },
    ],
  });
})();
