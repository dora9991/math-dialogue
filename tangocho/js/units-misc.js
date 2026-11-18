/* 単元：割合・単位の変換・時間。  種類のまざる STEP は mix（js/core.js）で、種類ごとの出る割合を決めている。
   各 STEP は 前半（gen／mix）＋ 後半（gen2／mix2＝同じ STEP の中で少しだけむずかしい。name2 がその説明）。 */
(function () {
  'use strict';
  const TG = window.TG;
  const { dec, fracRaw: raw, frac: f } = TG;
  const q = (pre, ans, o) => Object.assign({ pre: String(pre), eq: true, ans: String(ans) }, o);

  /* ---------- 割合 ---------- */
  // 分数→百分率（暗算でできるものだけ）
  const FRAC_PCT = [[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [3, 5, 60], [4, 5, 80], [1, 10, 10], [3, 10, 30], [7, 10, 70], [9, 10, 90], [1, 20, 5], [3, 20, 15]];
  const BASES = [10, 20, 25, 40, 50, 60, 80, 100, 200, 250, 300, 400, 500];   // もとにする量（暗算しやすい数）
  const PCTS = [5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
  const wari = p => `${Math.floor(p / 10)}割${p % 10 ? p % 10 + '分' : ''}`;   // 35 → 3割5分（p は10〜99）

  TG.addUnit({
    id: 'ratio', cat: 'other', name: '割合', note: '百分率・歩合・○％の計算', n: 20, goal: [7, 6, 4],
    steps: [
      { name: '割合のいいかえ（小数・％・割）', mix: [
        [1, r => { const p = r.chance(0.7) ? r.int(2, 98) : r.pick([110, 120, 125, 130, 150, 175, 200]); return q(dec(p), p, { post: '%' }); }],   // 小数→％
        [1, r => { const p = r.chance(0.8) ? r.int(2, 98) : r.pick([110, 120, 125, 150, 200]); return q(`${p} %`, dec(p)); }],                 // ％→小数
        [1, r => { const w = r.int(1, 9), s = r.chance(0.5) ? r.int(1, 9) : 0; return q(`${w}割${s ? s + '分' : ''}`, w * 10 + s, { post: '%' }); }],   // 割→％
        [1, r => { const p = r.int(2, 19) * 5; return p % 10 ? q(`${p} %`, `${Math.floor(p / 10)}割5分`) : q(`${p} %`, p / 10, { post: '割' }); }],   // ％→割
        [1, r => { const [a, b, p] = r.pick(FRAC_PCT); return q(raw(a, b), p, { post: '%' }); }],                                              // 分数→％
      ],
        name2: 'いろいろないいかえ',
        mix2: [
          [1, r => { const p = r.pick([10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 5, 15]); return q(`${p} %`, f(p, 100)); }],      // ％→分数
          [1, r => { const p = r.int(2, 19) * 5; return q(dec(p), wari(p)); }],                                                      // 小数→歩合（0.35＝3割5分）
          [1, r => { const p = r.int(2, 19) * 5; return q(wari(p), dec(p)); }],                                                      // 歩合→小数
          [1, r => { const p = r.pick([105, 110, 120, 125, 130, 140, 150, 175, 180, 200, 250]); return q(`${p} %`, dec(p)); }],     // 100％をこえる
        ] },
      { name: '○の△％（きりのいい数）', mix: [
        [1, r => {   // ○の△割
          const base = r.pick(BASES.filter(b => b % 10 === 0)), w = r.int(1, 9), v = base * w / 10;
          return v <= 400 ? q(`${base} の ${w}割`, v) : null;
        }],
        [3, r => {   // ○の△％（100％をこえるものもふくむ）
          const base = r.pick([20, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000]), p = r.pick([...PCTS, 150, 200]);
          const v = base * p / 100;
          return v === Math.floor(v) && v >= 1 && v <= 400 ? q(`${base} の ${p} %`, v) : null;
        }],
      ],
        name2: '5％・15％・110％など',
        gen2: r => {
          const base = r.pick([20, 40, 60, 80, 100, 120, 160, 200, 240, 280, 300, 400, 600]), p = r.pick([5, 15, 35, 45, 55, 65, 85, 95, 110, 120, 125, 150]);
          const v = base * p / 100;
          return v === Math.floor(v) && v >= 1 && v <= 500 ? q(`${base} の ${p} %`, v) : null;
        } },
      { name: '何％？・もとにする量・割引', mix: [
        [35, r => {   // □は○の何％
          const base = r.pick(BASES), p = r.pick(PCTS), v = base * p / 100;
          return v === Math.floor(v) ? q(`${v} は ${base} の`, p, { eq: false, post: '%' }) : null;
        }],
        [25, r => {   // もとにする量
          const base = r.pick(BASES), p = r.pick([10, 20, 25, 30, 40, 50, 60, 75, 80]), v = base * p / 100;
          return v === Math.floor(v) ? q('', base, { eq: false, post: `の ${p} % は ${v}` }) : null;
        }],
        [25, r => {   // 割引き
          const price = r.pick([200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000]);
          const wari = r.chance(0.5), p = wari ? r.pick([1, 2, 3, 5]) * 10 : r.pick([10, 20, 25, 30, 50]);
          return price * p % 100 ? null : q(`${price}円の ${wari ? p / 10 + '割' : p + ' %'}引き`, price - price * p / 100, { post: '円' });
        }],
        [15, r => {   // 増し
          const base = r.pick([40, 50, 80, 100, 200, 300, 400, 500]), p = r.pick([10, 20, 25, 50]);
          return base * p % 100 ? null : q(`${base}人の ${p} %増し`, base + base * p / 100, { post: '人' });
        }],
      ],
        name2: 'ねだんの変化から割合を出す',
        mix2: [
          [1, r => {   // ○円→△円は、□％引き
            const price = r.pick([200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000]), p = r.pick([10, 20, 25, 30, 40, 50, 60, 75]);
            return price * p % 100 ? null : q(`${price}円 → ${price - price * p / 100}円は`, p, { eq: false, post: '%引き' });
          }],
          [1, r => {   // □円の○割引きが△円
            const price = r.pick([200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000]), p = r.pick([10, 20, 25, 30, 40, 50]);
            return price * p % 100 ? null : q('', price, { eq: false, post: `円の ${p % 10 ? p + ' %' : p / 10 + '割'}引きが ${price - price * p / 100}円` });
          }],
          [1, r => {   // ○人→△人は、□％増し
            const base = r.pick([40, 50, 80, 100, 200, 300, 400]), p = r.pick([10, 20, 25, 50]);
            return base * p % 100 ? null : q(`${base}人 → ${base + base * p / 100}人は`, p, { eq: false, post: '%増し' });
          }],
        ] },
    ],
  });

  /* ---------- 単位の変換 ---------- */
  // [大きい単位, 小さい単位, 倍率]
  const LEN = [['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10], ['kg', 'g', 1000], ['t', 'kg', 1000], ['L', 'mL', 1000], ['L', 'dL', 10], ['dL', 'mL', 100]];
  const AREA = [['m²', 'cm²', 10000], ['ha', 'm²', 10000], ['a', 'm²', 100], ['m³', 'L', 1000], ['L', 'cm³', 1000], ['dL', 'cm³', 100], ['m³', 'cm³', 1000000]];
  const both = (r, big, small, k, v) => (r.chance(0.5) ? q(`${v} ${big}`, v * k, { post: small }) : q(`${v * k} ${small}`, v, { post: big }));

  TG.addUnit({
    id: 'unit', cat: 'other', name: '単位の変換', note: '長さ・重さ・かさ・面積・体積', n: 20, goal: [10, 8, 7],
    steps: [
      { name: '大きい単位→小さい単位',
        gen: r => {
          const [big, small, k] = r.pick(LEN), v = k === 10 ? r.int(2, 20) : r.int(2, 9);
          return q(`${v} ${big}`, v * k, { post: small });
        },
        name2: '2つの単位をあわせる（2 m 30 cm など）',
        gen2: r => {
          const [big, small, k] = r.pick(LEN);
          const a = r.int(1, 9), b = k === 10 ? r.int(1, 9) : k === 100 ? r.int(1, 19) * 5 : r.int(1, 9) * 100;   // 小さい単位の端数（k 未満）
          return b < k ? q(`${a} ${big} ${b} ${small}`, a * k + b, { post: small }) : null;
        } },
      { name: '小さい単位↔大きい単位（小数）',
        gen: r => {
          const [big, small, k] = r.pick(LEN), t = r.int(2, 99);   // t＝大きい単位で数えた値の10倍（0.2〜9.9）
          if (t % 10 === 0) return null;
          const sm = t * k / 10;
          return r.chance(0.5) ? q(`${sm} ${small}`, dec(t * 10), { post: big }) : q(`${dec(t * 10)} ${big}`, sm, { post: small });
        },
        name2: '小数第2位（0.35 m など）',
        gen2: r => {
          const [big, small, k] = r.pick(LEN.filter(l => l[2] >= 100)), h = r.int(5, 299);   // h＝大きい単位で数えた値の100倍
          if (h % 10 === 0) return null;
          const sm = h * k / 100;
          return r.chance(0.5) ? q(`${sm} ${small}`, dec(h), { post: big }) : q(`${dec(h)} ${big}`, sm, { post: small });
        } },
      { name: '面積・体積の単位',
        mix: [
          [9, r => { const [big, small, k] = r.pick(AREA); return both(r, big, small, k, k === 1000000 ? r.int(1, 3) : r.int(2, 9)); }],
          [1, r => both(r, 'mL', 'cm³', 1, r.int(2, 9))],   // 1 mL ＝ 1 cm³（同じ大きさ）。たまに出す
        ],
        name2: '小数がまざる',
        gen2: r => {
          const [big, small, k] = r.pick(AREA.filter(l => l[2] <= 10000)), t = r.int(2, 99);
          if (t % 10 === 0) return null;
          const sm = t * k / 10;
          return r.chance(0.5) ? q(`${sm} ${small}`, dec(t * 10), { post: big }) : q(`${dec(t * 10)} ${big}`, sm, { post: small });
        } },
    ],
  });

  /* ---------- 時間 ---------- */
  const T = (h, m) => (m ? `${h}時${m}分` : `${h}時`);              // 時刻
  const D = min => { const h = Math.floor(min / 60), m = min % 60; return (h ? `${h}時間` : '') + (m ? `${m}分` : ''); };   // 時間の長さ
  const MIN5 = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  TG.addUnit({
    id: 'time', cat: 'other', name: '時間', note: '時刻・単位・経過時間', n: 20, goal: [7, 6, 5],
    steps: [
      { name: '○分後・○分前の時刻',
        gen: r => {
          const start = r.int(6, 10) * 60 + r.pick(MIN5), d = r.pick([10, 15, 20, 25, 30, 35, 40, 45, 50, 70, 75, 80, 90, 100, 110, 130, 150]);
          const dir = r.chance(0.5) ? 1 : -1, end = start + dir * d;
          if (end < 5 * 60 || end >= 12 * 60) return null;
          return q(`${T(Math.floor(start / 60), start % 60)}の ${D(d)}${dir > 0 ? '後' : '前'}`, T(Math.floor(end / 60), end % 60));
        },
        name2: '長い時間（1時間25分 など）',
        gen2: r => {
          const start = r.int(6, 10) * 60 + r.pick(MIN5), d = r.pick([85, 95, 105, 115, 125, 135, 145, 155, 165, 175, 185]);
          const dir = r.chance(0.5) ? 1 : -1, end = start + dir * d;
          if (end < 5 * 60 || end >= 13 * 60) return null;
          return q(`${T(Math.floor(start / 60), start % 60)}の ${D(d)}${dir > 0 ? '後' : '前'}`, T(Math.floor(end / 60), end % 60));
        } },
      { name: '時間の単位（時・分・秒）', mix: [
        [1, r => { const m = r.int(65, 170); return m % 60 && m % 5 === 0 ? q(`${m}分`, D(m)) : null; }],                                                       // 分→時間と分
        [1, r => { const h = r.int(1, 3), m = r.pick([5, 10, 15, 20, 25, 30, 40, 45, 50]); return q(`${h}時間${m}分`, h * 60 + m, { post: '分' }); }],           // 時間と分→分
        [1, r => { const s = r.pick([120, 180, 240, 300, 360, 420]); return q(`${s}秒`, s / 60, { post: '分' }); }],                                            // 秒→分
        [1, r => { const x = r.pick([25, 50, 75, 125, 150, 225, 250]); return q(`${dec(x)}時間`, x * 60 / 100, { post: '分' }); }],                              // 小数の時間→分
        [1, r => { const m = r.pick([15, 30, 45, 75, 90, 105, 150]); return q(`${m}分`, dec(m * 100 / 60), { post: '時間' }); }],                                // 分→小数の時間
      ],
        name2: '小数の時間・分と秒',
        mix2: [
          [1, r => { const h = r.int(1, 4), m = r.pick([15, 30, 45]); return q(`${h}時間${m}分`, dec(h * 100 + m * 100 / 60), { post: '時間' }); }],   // 1時間30分＝1.5時間
          [1, r => { const m = r.int(35, 60) * 5; return m % 60 ? q(`${m}分`, D(m)) : null; }],                                                       // 205分＝3時間25分
          [1, r => { const s = r.int(9, 40) * 10; return s % 60 ? q(`${s}秒`, `${Math.floor(s / 60)}分${s % 60 ? s % 60 + '秒' : ''}`) : null; }],   // 210秒＝3分30秒
          [1, r => { const m = r.int(1, 6), s = r.int(1, 5) * 10; return q(`${m}分${s}秒`, m * 60 + s, { post: '秒' }); }],                           // 2分30秒＝150秒
        ] },
      { name: '経過時間（時刻の差）',
        gen: r => {
          const a = r.int(7, 11) * 60 + r.pick(MIN5), d = r.int(5, 50) * 5;
          const b = a + d;
          if (b >= 13 * 60) return null;   // 午前〜お昼すぎの時刻だけ（24時間表記は使わない）
          return q(`${T(Math.floor(a / 60), a % 60)}〜${T(Math.floor(b / 60), b % 60)}`, D(d));
        },
        name2: '分がたりない（くり下がり）',
        gen2: r => {
          const a = r.int(6, 9) * 60 + r.pick(MIN5.slice(1)), d = r.int(13, 70) * 5, b = a + d;
          if (b >= 13 * 60 || b % 60 >= a % 60) return null;   // 終わりの「分」が始めの「分」より小さい
          return q(`${T(Math.floor(a / 60), a % 60)}〜${T(Math.floor(b / 60), b % 60)}`, D(d));
        } },
    ],
  });
})();
