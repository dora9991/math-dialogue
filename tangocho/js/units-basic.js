/* 単元：1けたの計算・2けたの計算（たし算・ひき算・かけ算・わり算）。
   各 STEP は 前半（gen／mix）＋ 後半（gen2／mix2＝同じ STEP の中で少しだけむずかしい。name2 がその説明）。
   どれも「条件に合わなければ null を返して作りなおす」書き方。条件は tools/verify.cjs が別の道すじで確かめる。
   問題数（n）は「計算のとても速い人が、1分でやっと解き終わる量」を目安にした。短い計算ほど多い（1けたのたし算・ひき算は50問）。
   単元の n が基本で、STEP だけちがうときは STEP に n を書く（前半と後半で半分ずつ）。 */
(function () {
  'use strict';
  const TG = window.TG;
  const q = (pre, ans, o) => Object.assign({ pre: String(pre), eq: true, ans: String(ans) }, o);
  // 順番を入れかえても同じ問題として数える（key を式の形にそろえる）。2けた×1けたは、たまに順番を入れかえて出す
  const mulQ = (r, a, m) => q(r.chance(0.25) ? `${m} × ${a}` : `${a} × ${m}`, a * m, { key: `${a}×${m}` });
  const either = (r, a, b) => q(r.chance(0.5) ? `${a} × ${b}` : `${b} × ${a}`, a * b);   // 7×8 と 8×7 は、べつの問題（九九は往復で覚える）

  /* ---------- 1けた ---------- */
  TG.addUnit({
    id: 'add1', cat: 'basic', name: 'たし算（1けた）', note: '1けた＋1けた', n: 50, goal: [15, 12, 8],
    steps: [
      { name: '和が10まで',
        gen: r => { const a = r.int(1, 9), b = r.int(1, 9); return a + b <= 10 ? q(`${a} + ${b}`, a + b) : null; },
        name2: '3つの数（和が10まで）',
        gen2: r => { const a = r.int(1, 6), b = r.int(1, 6), c = r.int(1, 6); return a + b + c >= 6 && a + b + c <= 10 ? q(`${a} + ${b} + ${c}`, a + b + c) : null; } },
      { name: 'くり上がりあり', n: 40,
        gen: r => { const a = r.int(2, 9), b = r.int(2, 9); return a + b >= 11 ? q(`${a} + ${b}`, a + b) : null; },
        name2: '2けた＋1けた（くり上がり）',
        gen2: r => { const a = r.int(12, 89), b = r.int(2, 9); return a % 10 + b >= 10 ? q(r.chance(0.3) ? `${b} + ${a}` : `${a} + ${b}`, a + b, { key: `${a}+${b}` }) : null; } },
      { name: '3つの数（10をつくる）', n: 30,
        gen: r => { const a = r.int(1, 9), c = r.int(2, 9); return q(r.shuffle([a, 10 - a, c]).join(' + '), 10 + c); },
        name2: '3つの数（10の組なし）',
        gen2: r => {
          const v = [r.int(3, 9), r.int(3, 9), r.int(3, 9)], s = v[0] + v[1] + v[2];
          return s >= 18 && s <= 26 && !(v[0] + v[1] === 10 || v[0] + v[2] === 10 || v[1] + v[2] === 10) ? q(v.join(' + '), s) : null;
        } },
    ],
  });

  TG.addUnit({
    id: 'sub1', cat: 'basic', name: 'ひき算（1けた）', note: '10までの数・くり下がり', n: 50, goal: [14, 11, 8],
    steps: [
      { name: '10までのひき算',
        gen: r => { const a = r.int(2, 10), b = r.int(1, a - 1); return q(`${a} − ${b}`, a - b); },
        name2: 'ひき算を2回',
        gen2: r => { const a = r.int(6, 10), b = r.int(1, 5), c = r.int(1, 5); return a - b - c >= 1 ? q(`${a} − ${b} − ${c}`, a - b - c) : null; } },
      { name: 'くり下がりあり（11〜18−1けた）', n: 40,
        gen: r => { const a = r.int(11, 18), b = r.int(2, 9); return b > a % 10 ? q(`${a} − ${b}`, a - b) : null; },
        name2: '2けた−1けた（くり下がり）',
        gen2: r => { const a = r.int(21, 98), b = r.int(2, 9); return b > a % 10 ? q(`${a} − ${b}`, a - b) : null; } },
      { name: 'ミックス', n: 40,
        gen: r => { const a = r.int(10, 19), b = r.int(2, 9); return q(`${a} − ${b}`, a - b); },
        name2: 'ひき算を2回（10をまたぐ）',
        gen2: r => {
          const a = r.int(12, 19), b = r.int(2, 7), c = r.int(2, 7), x = a - b - c;
          return x >= 1 && Math.floor(a / 10) !== Math.floor(x / 10) ? q(`${a} − ${b} − ${c}`, x) : null;
        } },
    ],
  });

  TG.addUnit({
    id: 'mul1', cat: 'basic', name: 'かけ算（九九）', note: '1けた×1けた', n: 40, goal: [14, 10, 10],
    steps: [
      { name: '2・3・4・5のだん',
        gen: r => { const a = r.pick([2, 3, 4, 5]), b = r.int(2, 9); return q(r.chance(0.5) ? `${a} × ${b}` : `${b} × ${a}`, a * b); },
        name2: '6〜9をかける',
        gen2: r => either(r, r.pick([2, 3, 4, 5]), r.int(6, 9)) },
      { name: '6・7・8・9のだん', n: 32,   // 6〜9どうしの九九は16通りしかない（後半は、その全部）
        gen: r => { const a = r.pick([6, 7, 8, 9]), b = r.int(3, 9); return q(r.chance(0.5) ? `${a} × ${b}` : `${b} × ${a}`, a * b); },
        name2: '6〜9どうし',
        gen2: r => either(r, r.int(6, 9), r.int(6, 9)) },
      { name: 'ミックス（全部のだん）',
        gen: r => { const a = r.int(2, 9), b = r.int(2, 9); return q(`${a} × ${b}`, a * b); },
        name2: '10のかたまり×1けた',
        gen2: r => { const a = r.int(2, 9) * 10, b = r.int(2, 9); return q(r.chance(0.5) ? `${a} × ${b}` : `${b} × ${a}`, a * b, { key: `${a}×${b}` }); } },
    ],
  });

  TG.addUnit({
    id: 'div1', cat: 'basic', name: 'わり算（九九のぎゃく）', note: '九九で答えが出るわり算', n: 40, goal: [12, 9, 9],
    steps: [
      { name: 'わる数が2〜5', n: 32,   // 九九のぎゃくは32通り（後半は、そのうち答えが6〜9の16通り）
        gen: r => { const d = r.int(2, 5), v = r.int(2, 9); return q(`${d * v} ÷ ${d}`, v); },
        name2: '答えが6〜9',
        gen2: r => { const d = r.int(2, 5), v = r.int(6, 9); return q(`${d * v} ÷ ${d}`, v); } },
      { name: 'わる数が6〜9', n: 32,
        gen: r => { const d = r.int(6, 9), v = r.int(2, 9); return q(`${d * v} ÷ ${d}`, v); },
        name2: '答えが6〜9',
        gen2: r => { const d = r.int(6, 9), v = r.int(6, 9); return q(`${d * v} ÷ ${d}`, v); } },
      { name: 'ミックス',
        gen: r => { const d = r.int(2, 9), v = r.int(2, 9); return q(`${d * v} ÷ ${d}`, v); },
        name2: '10のかたまりのわり算',
        gen2: r => { const d = r.int(2, 9), v = r.int(2, 9); return q(`${d * v * 10} ÷ ${d}`, v * 10); } },
    ],
  });

  /* ---------- 2けた ---------- */
  // 2けた−2けた（くり下がりあり）の式をひとつ作る
  const borrow2 = r => {
    const ta = r.int(2, 9), tb = r.int(1, 8), ua = r.int(0, 8), ub = r.int(1, 9);
    if (ua >= ub || ta <= tb) return null;
    const a = ta * 10 + ua, b = tb * 10 + ub; return q(`${a} − ${b}`, a - b);
  };

  TG.addUnit({
    id: 'add2', cat: 'two', name: 'たし算（2けた）', note: '2けた＋2けた', n: 30, goal: [8, 6, 5],
    steps: [
      { name: 'くり上がりなし',
        gen: r => {
          const ta = r.int(1, 8), tb = r.int(1, 8), ua = r.int(1, 9), ub = r.int(1, 9);
          if (ua + ub > 9 || ta + tb > 9) return null;
          const a = ta * 10 + ua, b = tb * 10 + ub; return q(`${a} + ${b}`, a + b);
        },
        name2: '十の位がくり上がる',
        gen2: r => {
          const ta = r.int(2, 9), tb = r.int(2, 9), ua = r.int(1, 9), ub = r.int(1, 9);
          if (ua + ub > 9 || ta + tb < 10) return null;
          const a = ta * 10 + ua, b = tb * 10 + ub; return q(`${a} + ${b}`, a + b);
        } },
      { name: '一の位がくり上がる（100未満）', n: 24,
        gen: r => {
          const ta = r.int(1, 8), tb = r.int(1, 8), ua = r.int(1, 9), ub = r.int(1, 9);
          if (ua + ub < 10 || ta + tb + 1 > 9) return null;
          const a = ta * 10 + ua, b = tb * 10 + ub; return q(`${a} + ${b}`, a + b);
        },
        name2: '答えが80〜99',
        gen2: r => {
          const a = r.int(21, 89), b = r.int(21, 89), s = a + b;
          return a % 10 + b % 10 >= 10 && s >= 80 && s <= 99 ? q(`${a} + ${b}`, s) : null;
        } },
      { name: '答えが100をこえる', n: 20,
        gen: r => {
          const a = r.int(21, 99), b = r.int(21, 99);
          return a + b < 100 || (a % 10 === 0 && b % 10 === 0) ? null : q(`${a} + ${b}`, a + b);
        },
        name2: '大きい数どうし',
        gen2: r => {
          const a = r.int(55, 99), b = r.int(55, 99);
          return a % 10 + b % 10 >= 10 && a + b >= 120 ? q(`${a} + ${b}`, a + b) : null;
        } },
    ],
  });

  TG.addUnit({
    id: 'sub2', cat: 'two', name: 'ひき算（2けた）', note: '2けた−2けた', n: 30, goal: [8, 6, 5],
    steps: [
      { name: 'くり下がりなし',
        gen: r => {
          const ta = r.int(2, 9), tb = r.int(1, 8), ua = r.int(1, 9), ub = r.int(1, 9);
          if (ua < ub || ta <= tb) return null;
          const a = ta * 10 + ua, b = tb * 10 + ub; return q(`${a} − ${b}`, a - b);
        },
        name2: '3つの数のひき算',
        gen2: r => {
          const a = r.int(60, 99), b = r.int(11, 39), c = r.int(11, 39);
          return a % 10 >= b % 10 + c % 10 && Math.floor(a / 10) >= Math.floor(b / 10) + Math.floor(c / 10) + 1 && b % 10 && c % 10 ? q(`${a} − ${b} − ${c}`, a - b - c) : null;
        } },
      { name: 'くり下がりあり', n: 24,
        gen: borrow2,
        name2: '一の位が0／差が小さい',
        mix2: [
          [1, r => { const a = r.int(3, 9) * 10, b = r.int(11, a - 1); return b % 10 ? q(`${a} − ${b}`, a - b) : null; }],
          [1, r => { const a = r.int(50, 99), b = a - r.int(5, 19); return b >= 11 && a % 10 < b % 10 ? q(`${a} − ${b}`, a - b) : null; }],
        ] },
      { name: '100からひく／ミックス', n: 20,
        mix: [
          [1, r => { const b = r.int(11, 99); return b % 10 ? q(`100 − ${b}`, 100 - b) : null; }],
          [1, borrow2],
        ],
        name2: '3けた−2けた',
        gen2: r => { const a = r.int(110, 199), b = r.int(11, 99); return a - b >= 10 && a % 10 < b % 10 ? q(`${a} − ${b}`, a - b) : null; } },
    ],
  });

  TG.addUnit({
    id: 'mul2', cat: 'two', name: 'かけ算（2けた×1けた）', note: '2けた×1けた', n: 20, goal: [7, 5, 4],
    steps: [
      { name: 'くり上がりなし',
        gen: r => {
          const m = r.int(2, 4), t = r.int(1, 4), u = r.int(0, 4);
          if (t * m > 9 || u * m > 9 || (u === 0 && r.chance(0.7))) return null;
          return mulQ(r, t * 10 + u, m);
        },
        name2: 'くり上がりが1回',
        gen2: r => {
          const m = r.int(2, 5), a = r.int(11, 49);
          return a % 10 * m >= 10 && a % 10 * m <= 19 && a * m < 100 ? mulQ(r, a, m) : null;
        } },
      { name: 'くり上がりあり（100未満）',
        gen: r => {
          const t = r.int(1, 9), u = r.int(2, 9), m = r.int(2, 9), a = t * 10 + u;
          return u * m >= 10 && a * m < 100 ? mulQ(r, a, m) : null;
        },
        name2: 'かける数が5〜9',
        gen2: r => {
          const a = r.int(11, 19), m = r.int(5, 9);
          return a % 10 * m >= 10 && a * m < 100 ? mulQ(r, a, m) : null;
        } },
      { name: '答えが100をこえる',
        gen: r => {
          const a = r.int(12, 99), m = r.int(2, 9), p = a * m;
          return a % 10 && p >= 100 && p <= 300 ? mulQ(r, a, m) : null;
        },
        name2: '答えが300〜600',
        gen2: r => {
          const a = r.int(35, 99), m = r.int(4, 9), p = a * m;
          return a % 10 && p >= 300 && p <= 600 ? mulQ(r, a, m) : null;
        } },
    ],
  });

  TG.addUnit({
    id: 'div2', cat: 'two', name: 'わり算（2けた÷1けた）', note: 'わりきれるもの', n: 20, goal: [7, 5, 5],
    steps: [
      { name: 'あまりが出ない（十の位からわれる）',
        gen: r => {
          const d = r.int(2, 4), a = r.int(1, 9), b = r.int(0, 9);
          if (d * a > 9 || d * b > 9 || (b === 0 && r.chance(0.6))) return null;
          const v = a * 10 + b; return q(`${d * v} ÷ ${d}`, v);
        },
        name2: '十の位にあまりが出る（わる数2〜4）',
        gen2: r => {
          const d = r.int(2, 4), v = r.int(10, Math.floor(99 / d)), x = d * v;
          return Math.floor(x / 10) % d ? q(`${x} ÷ ${d}`, v) : null;
        } },
      { name: '十の位にあまりが出る',
        gen: r => {
          const d = r.int(2, 9), v = r.int(10, Math.floor(99 / d)), x = d * v;
          return Math.floor(x / 10) % d ? q(`${x} ÷ ${d}`, v) : null;
        },
        name2: 'わる数が5〜9',
        gen2: r => {
          const d = r.int(5, 9), v = r.int(10, Math.floor(99 / d)), x = d * v;
          return Math.floor(x / 10) % d ? q(`${x} ÷ ${d}`, v) : null;
        } },
      { name: 'ミックス（九九の範囲もふくむ）',
        gen: r => {
          const d = r.int(2, 9), v = r.int(2, Math.floor(99 / d)), x = d * v;
          return x >= 10 ? q(`${x} ÷ ${d}`, v) : null;
        },
        name2: '3けた÷1けた',
        gen2: r => {
          const d = r.int(2, 9), v = r.int(11, 125), x = d * v;
          return x >= 100 && x <= 250 ? q(`${x} ÷ ${d}`, v) : null;
        } },
    ],
  });
})();
