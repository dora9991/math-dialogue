/* 単元：分数のかけ算・わり算（かんたんなもの）、小数のたし算・ひき算。
   分数の答えは約分したもの（整数になるなら整数）。小数は 100倍した整数で計算して、誤差を出さない。
   各 STEP は 前半（gen／mix）＋ 後半（gen2／mix2＝同じ STEP の中で少しだけむずかしい。name2 がその説明）。 */
(function () {
  'use strict';
  const TG = window.TG;
  const { gcd, frac: f, fracRaw: raw, dec } = TG;
  const q = (pre, ans, o) => Object.assign({ pre: String(pre), eq: true, ans: String(ans) }, o);
  // 約分ずみの真分数 a/b（b は lo〜max）を作る
  const proper = (r, max, lo) => { const b = r.int(lo || 2, max), a = r.int(1, b - 1); return gcd(a, b) === 1 ? [a, b] : null; };
  // 2つの真分数
  const two = (r, max, lo) => { const p = proper(r, max, lo), s = proper(r, max, lo); return p && s ? [p[0], p[1], s[0], s[1]] : null; };

  /* ---------- 分数のかけ算 ---------- */
  TG.addUnit({
    id: 'fmul', cat: 'frac', name: '分数のかけ算', note: 'かんたんなもの', n: 20, goal: [6, 5, 4],
    steps: [
      { name: '分数×整数（答えが整数）',
        gen: r => {
          const p = proper(r, 8), k = r.int(1, 4);
          if (!p || p[1] * k > 30) return null;
          const [a, b] = p, n = b * k;
          return q(r.chance(0.7) ? `${raw(a, b)} × ${n}` : `${n} × ${raw(a, b)}`, a * k, { key: `${a}/${b}×${n}` });
        },
        name2: '分母が6〜9',
        gen2: r => {
          const p = proper(r, 9, 6), k = r.int(2, 4);
          if (!p) return null;
          const [a, b] = p, n = b * k;
          return q(r.chance(0.7) ? `${raw(a, b)} × ${n}` : `${n} × ${raw(a, b)}`, a * k, { key: `${a}/${b}×${n}` });
        } },
      { name: '分数×分数（約分なし）',
        gen: r => {
          const t = two(r, 9); if (!t) return null;
          const [a, b, c, d] = t;
          return gcd(a * c, b * d) === 1 && b * d <= 45 ? q(`${raw(a, b)} × ${raw(c, d)}`, raw(a * c, b * d)) : null;
        },
        name2: '分子も2以上',
        gen2: r => {
          const t = two(r, 9, 5); if (!t) return null;
          const [a, b, c, d] = t;
          return a >= 2 && c >= 2 && gcd(a * c, b * d) === 1 && b * d <= 63 ? q(`${raw(a, b)} × ${raw(c, d)}`, raw(a * c, b * d)) : null;
        } },
      { name: '約分がある',
        mix: [
          [3, r => {   // 分数×整数（整数と分母が約分できる）
            const p = proper(r, 9), n = r.int(2, 12);
            if (!p) return null;
            const [a, b] = p;
            return gcd(b, n) > 1 && n % b ? q(`${raw(a, b)} × ${n}`, f(a * n, b)) : null;
          }],
          [7, r => {
            const t = two(r, 9); if (!t) return null;
            const [a, b, c, d] = t;
            return gcd(a * c, b * d) > 1 && b * d <= 72 ? q(`${raw(a, b)} × ${raw(c, d)}`, f(a * c, b * d)) : null;
          }],
        ],
        name2: '約分が2回',
        gen2: r => {
          const t = two(r, 9); if (!t) return null;
          const [a, b, c, d] = t;
          return gcd(a, d) > 1 && gcd(c, b) > 1 ? q(`${raw(a, b)} × ${raw(c, d)}`, f(a * c, b * d)) : null;
        } },
    ],
  });

  /* ---------- 分数のわり算 ---------- */
  TG.addUnit({
    id: 'fdiv', cat: 'frac', name: '分数のわり算', note: 'かんたんなもの', n: 20, goal: [6, 4, 4],
    steps: [
      { name: '分数÷整数',
        gen: r => {
          const p = proper(r, 8), n = r.int(2, 6);
          if (!p || p[1] * n > 40) return null;
          return q(`${raw(p[0], p[1])} ÷ ${n}`, f(p[0], p[1] * n));
        },
        name2: '分子を整数でわれる（約分）',
        gen2: r => {
          const p = proper(r, 9, 3), n = r.int(2, 6);
          if (!p || gcd(p[0], n) === 1 || p[1] * n > 54) return null;
          return q(`${raw(p[0], p[1])} ÷ ${n}`, f(p[0], p[1] * n));
        } },
      { name: '分数÷分数（約分なし）',
        gen: r => {
          const t = two(r, 9); if (!t) return null;
          const [a, b, c, d] = t;
          return gcd(a * d, b * c) === 1 && a * d <= 40 && b * c <= 40 ? q(`${raw(a, b)} ÷ ${raw(c, d)}`, raw(a * d, b * c)) : null;
        },
        name2: '分子も2以上',
        gen2: r => {
          const t = two(r, 9, 5); if (!t) return null;
          const [a, b, c, d] = t;
          return a >= 2 && c >= 2 && gcd(a * d, b * c) === 1 && a * d <= 63 && b * c <= 63 ? q(`${raw(a, b)} ÷ ${raw(c, d)}`, raw(a * d, b * c)) : null;
        } },
      { name: '約分がある／整数÷分数',
        mix: [
          [4, r => {   // 整数÷分数（わられる数が、分子の倍数）
            const s = proper(r, 9), k = r.int(1, 4);
            if (!s || s[0] * k < 2) return null;
            return q(`${s[0] * k} ÷ ${raw(s[0], s[1])}`, s[1] * k);
          }],
          [6, r => {
            const t = two(r, 9); if (!t) return null;
            const [a, b, c, d] = t;
            return gcd(a * d, b * c) > 1 && a * d !== b * c && a * d <= 72 && b * c <= 72 ? q(`${raw(a, b)} ÷ ${raw(c, d)}`, f(a * d, b * c)) : null;
          }],
        ],
        name2: '大きく約分できる',
        gen2: r => {
          const t = two(r, 9, 4); if (!t) return null;
          const [a, b, c, d] = t;
          return gcd(a * d, b * c) >= 3 && a * d !== b * c && a * d <= 100 && b * c <= 100 ? q(`${raw(a, b)} ÷ ${raw(c, d)}`, f(a * d, b * c)) : null;
        } },
    ],
  });

  /* ---------- 小数のたし算（数は 100倍した整数で持つ） ---------- */
  TG.addUnit({
    id: 'dadd', cat: 'frac', name: '小数のたし算', note: '小数第1位・第2位', n: 20, goal: [7, 6, 4],
    steps: [
      { name: '小数第1位（くり上がりなし）',
        gen: r => {
          const ta = r.int(1, 9), tb = r.int(1, 9);
          if (ta + tb > 9) return null;
          const a = r.int(0, 9) * 100 + ta * 10, b = r.int(0, 9) * 100 + tb * 10;
          return q(`${dec(a)} + ${dec(b)}`, dec(a + b));
        },
        name2: '整数の部分が2けた',
        gen2: r => {
          const ta = r.int(1, 9), tb = r.int(1, 9);
          if (ta + tb > 9) return null;
          const a = r.int(10, 29) * 100 + ta * 10, b = r.int(10, 29) * 100 + tb * 10;
          return q(`${dec(a)} + ${dec(b)}`, dec(a + b));
        } },
      { name: '小数第1位（くり上がりあり）',
        gen: r => {
          const ta = r.int(1, 9), tb = r.int(1, 9);
          if (ta + tb < 10) return null;
          const a = r.int(0, 9) * 100 + ta * 10, b = r.int(0, 9) * 100 + tb * 10;
          return q(`${dec(a)} + ${dec(b)}`, dec(a + b));
        },
        name2: '整数の部分が2けた',
        gen2: r => {
          const ta = r.int(1, 9), tb = r.int(1, 9), ia = r.int(5, 29), ib = r.int(5, 29);
          if (ta + tb < 10 || (ia < 10 && ib < 10)) return null;
          const a = ia * 100 + ta * 10, b = ib * 100 + tb * 10;
          return q(`${dec(a)} + ${dec(b)}`, dec(a + b));
        } },
      { name: '小数第2位（かんたんなもの）',
        mix: [
          [3, r => {   // 合わせて整数になる組（0.25＋0.75 など）
            const t = r.int(0, 8), h = r.int(1, 9);
            const a = r.int(0, 3) * 100 + t * 10 + h, b = r.int(0, 3) * 100 + (9 - t) * 10 + (10 - h);
            return q(`${dec(a)} + ${dec(b)}`, dec(a + b));
          }],
          [7, r => {   // 100分の1の位でくり上がらない
            const ha = r.int(1, 9), hb = r.int(0, 9);
            if (ha + hb > 9) return null;
            const a = r.int(0, 3) * 100 + r.int(0, 9) * 10 + ha, b = r.int(0, 3) * 100 + r.int(0, 9) * 10 + hb;
            return b ? q(`${dec(a)} + ${dec(b)}`, dec(a + b)) : null;
          }],
        ],
        name2: '10分の1の位もくり上がる',
        gen2: r => {
          const ha = r.int(1, 9), hb = r.int(1, 9), ta = r.int(1, 9), tb = r.int(1, 9);
          if (ha + hb > 9 || ta + tb < 10) return null;
          const a = r.int(0, 3) * 100 + ta * 10 + ha, b = r.int(0, 3) * 100 + tb * 10 + hb;
          return q(`${dec(a)} + ${dec(b)}`, dec(a + b));
        } },
    ],
  });

  /* ---------- 小数のひき算 ---------- */
  TG.addUnit({
    id: 'dsub', cat: 'frac', name: '小数のひき算', note: '小数第1位・第2位', n: 20, goal: [7, 5, 4],
    steps: [
      { name: '小数第1位（くり下がりなし）',
        gen: r => {
          const ia = r.int(1, 9), ib = r.int(0, ia), ta = r.int(1, 9), tb = r.int(1, ta);
          const a = ia * 100 + ta * 10, b = ib * 100 + tb * 10;
          return a > b ? q(`${dec(a)} − ${dec(b)}`, dec(a - b)) : null;
        },
        name2: '整数の部分が2けた',
        gen2: r => {
          const ia = r.int(12, 29), ib = r.int(10, ia), ta = r.int(1, 9), tb = r.int(1, ta);
          const a = ia * 100 + ta * 10, b = ib * 100 + tb * 10;
          return a > b ? q(`${dec(a)} − ${dec(b)}`, dec(a - b)) : null;
        } },
      { name: '小数第1位（くり下がりあり）',
        gen: r => {
          const ib = r.int(0, 8), ia = r.int(ib + 1, 9), tb = r.int(1, 9), ta = r.chance(0.3) ? 0 : r.int(0, tb - 1);
          const a = ia * 100 + ta * 10, b = ib * 100 + tb * 10;
          return q(`${dec(a)} − ${dec(b)}`, dec(a - b));
        },
        name2: '整数の部分が2けた',
        gen2: r => {
          const ib = r.int(5, 28), ia = r.int(Math.max(ib + 1, 11), 30), tb = r.int(1, 9), ta = r.chance(0.3) ? 0 : r.int(0, tb - 1);
          const a = ia * 100 + ta * 10, b = ib * 100 + tb * 10;
          return q(`${dec(a)} − ${dec(b)}`, dec(a - b));
        } },
      { name: '小数第2位（かんたんなもの）',
        mix: [
          [4, r => {   // 1−0.25 のように、整数から末尾が5の小数をひく
            const ia = r.int(1, 5), a = ia * 100, b = r.int(0, ia - 1) * 100 + r.int(0, 9) * 10 + 5;
            return q(`${dec(a)} − ${dec(b)}`, dec(a - b));
          }],
          [6, r => {   // どの位もくり下がらない
            const ia = r.int(0, 3), ib = r.int(0, ia), ta = r.int(0, 9), tb = r.int(0, ta), ha = r.int(1, 9), hb = r.int(0, ha);
            const a = ia * 100 + ta * 10 + ha, b = ib * 100 + tb * 10 + hb;
            return b > 0 && a > b && (ib < ia || tb < ta || hb < ha) ? q(`${dec(a)} − ${dec(b)}`, dec(a - b)) : null;
          }],
        ],
        name2: '10分の1の位がくり下がる',
        gen2: r => {
          const ib = r.int(0, 2), ia = r.int(ib + 1, 3), tb = r.int(2, 9), ta = r.int(0, tb - 1), ha = r.int(1, 9), hb = r.int(1, ha);
          const a = ia * 100 + ta * 10 + ha, b = ib * 100 + tb * 10 + hb;
          return q(`${dec(a)} − ${dec(b)}`, dec(a - b));
        } },
    ],
  });
})();
