// ============================================================
// stats.js — データの活用の問題用の道具：代表値・度数分布表・相対度数・累積度数・四捨五入を「計算で」出す
//
//  問題を書くとき、平均値・中央値・度数・相対度数を手で書かない。データ（配列）か度数分布表をつくって、ここの関数で計算する。
//  度数分布表は、問題文の中では、文章で言う：freqSentence(...)（コツコツくんの問題文には、表を出せないので）。
//  四捨五入は roundHalf を使う（0.5 ちょうどの境目の数は、isTie で見つけて、skip する）。
// ============================================================

export const sum = (a) => a.reduce((s, x) => s + x, 0);
export const mean = (a) => sum(a) / a.length;
export const sorted = (a) => [...a].sort((x, y) => x - y);
/** 中央値（データの数が偶数なら、まん中の2つの平均） */
export const median = (a) => { const s = sorted(a), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
/** 最頻値（いちばん多い値。同じ個数のものが複数あれば、全部を小さい順に） */
export const modes = (a) => { const c = new Map(); a.forEach((x) => c.set(x, (c.get(x) || 0) + 1)); const m = Math.max(...c.values()); return [...c].filter(([, n]) => n === m).map(([x]) => x).sort((x, y) => x - y); };
export const range = (a) => Math.max(...a) - Math.min(...a);

/** 四捨五入（小数第 d 位まで残す。10 の d 乗倍した整数で比べるので、0.1+0.2 のような誤差に強い） */
export const roundHalf = (x, d = 0) => { const k = 10 ** d, y = Math.round(x * k * (1 + 1e-12) + 1e-9); return y / k; };
/** x を小数第 d 位までに四捨五入するとき、ちょうど 5 の境目（例 0.125 を第2位まで）なら true。この組は、問題に使わない（skip） */
export const isTie = (x, d = 0) => { const y = x * 10 ** d, f = y - Math.floor(y); return Math.abs(f - 0.5) < 1e-9; };
/** 割合（x÷n）を百分率にして、小数第 d 位まで四捨五入。0.5 の境目なら null */
export const pct = (x, n, d = 0) => (isTie((x / n) * 100, d) ? null : roundHalf((x / n) * 100, d));

/** 階級：lo から幅 w で n 個。[{ lo, hi, mid }]（hi は、その階級にふくまれない上のはし。mid ＝階級値） */
export const classes = (lo, w, n) => Array.from({ length: n }, (_, i) => ({ lo: lo + i * w, hi: lo + (i + 1) * w, mid: lo + i * w + w / 2 }));
/** データを階級に分けた度数（lo 以上 hi 未満） */
export const freqs = (data, cls) => cls.map((c) => data.filter((x) => x >= c.lo && x < c.hi).length);
/** 度数分布表 → 平均値のおよその値（階級値×度数の和÷度数の合計） */
export const meanFromFreq = (cls, f) => cls.reduce((s, c, i) => s + c.mid * f[i], 0) / sum(f);
/** 相対度数（度数÷合計）。小数第 d 位までに四捨五入。境目の数なら null */
export const relFreq = (f, n, d = 2) => (isTie(f / n, d) ? null : roundHalf(f / n, d));
/** 累積度数（先頭から、足していった数） */
export const cumulative = (f) => f.reduce((a, x) => (a.push((a.length ? a[a.length - 1] : 0) + x), a), []);
/** 中央値がふくまれる階級の番号（0 から）。累積度数が、はじめて（合計+1）÷2 以上になる階級。偶数個のとき、まん中の2つが同じ階級にあるときだけ番号を返し、ちがうなら null */
export const medianClass = (f) => {
  const n = sum(f), cu = cumulative(f), at = (k) => cu.findIndex((c) => c >= k);
  return n % 2 ? at((n + 1) / 2) : at(n / 2) === at(n / 2 + 1) ? at(n / 2) : null;
};

/** 階級の言い方：「10 以上 20 未満」。unit は「分」「点」など */
export const clsLabel = (c, unit = "") => `${c.lo}${unit}以上${c.hi}${unit}未満`;
/** 度数分布表を、文章で：「0分以上10分未満が 3人、10分以上20分未満が 8人、…」（人は unit2） */
export const freqSentence = (cls, f, unit = "", unit2 = "人") => cls.map((c, i) => `${clsLabel(c, unit)}が ${f[i]}${unit2}`).join("、");
/** データを、小さい順に並べた文字列：「3　5　7」 */
export const listData = (a, sep = "　") => a.join(sep);
