// ============================================================
// tpl/util.js — 問題テンプレを書くための小道具
//
//  テンプレは  { id, kind, db, make(r, level) }  の形。
//    kind … "num" | "choice" | "fields"（当て推量の大きさを決めるので必ず宣言）
//    db   … このテンプレだけ難しさをずらす（ロジット。省略で0）
//    make … r は seed 付き乱数、level は 1(基本)/2(標準)/3(発展)。num()/choice()/fields() を返す
//
//  ※ 問題文・数値・図はすべてここから自作。教科書や問題集の問題は転載しない。
// ============================================================
import { Q, gcd, toQ } from "../../core/rational.js";

export { Q, gcd };
export const lcm = (a, b) => (a / gcd(a, b)) * b;

/** テンプレ定義 */
export function t(kind, make, o = {}) {
  return { id: o.id || "a", kind, db: o.db || 0, make };
}
/** 同じ kind のテンプレを複数（id は a, b, c…） */
export function ts(kind, ...makes) {
  return makes.map((m, i) => t(kind, m, { id: "abcdefgh"[i] }));
}

/** レベルごとの値を選ぶ */
export const byLv = (lv, a, b, c) => (lv === 1 ? a : lv === 2 ? b : c);

/** 条件を満たすまで乱数で作り直す（無限ループ防止つき） */
export function until(gen, ok, max = 200) {
  for (let i = 0; i < max; i++) {
    const v = gen();
    if (ok(v)) return v;
  }
  throw new Error("until: 条件を満たす値が作れなかった");
}

/** 独立検証：a と b が等しいことを確かめる（テンプレの答えを別の方法で計算し直すのに使う） */
export function same(a, b, msg = "検証に失敗") {
  const A = typeof a === "object" && a ? a : toQ(a);
  const B = typeof b === "object" && b ? b : toQ(b);
  if (A.n !== B.n || A.d !== B.d) throw new Error(`${msg}: ${A.n}/${A.d} != ${B.n}/${B.d}`);
}
export function assert(cond, msg = "assert に失敗") {
  if (!cond) throw new Error(msg);
}

/** 整数の各桁（上位から） */
export const digitsOf = (n) => String(Math.abs(n)).split("").map(Number);

/** 名前・題材（文章題用。すべてオリジナルの言い回し） */
export const NAMES = ["あおい", "けんた", "ゆうき", "さくら", "はると", "みお", "そうた", "ひなた", "りく", "なずな"];
export const FRUITS = ["りんご", "みかん", "もも", "なし", "かき", "いちご"];

/** 小数を文字列に（末尾の0を落とす）。浮動小数の誤差を避けるため toFixed を使う */
export function dec(x, digits = 6) {
  let s = Number(x).toFixed(digits);
  s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s === "-0" ? "0" : s;
}

/** 有限小数の Q を作る：整数 n を 10^k でわる */
export const decQ = (n, k) => Q(n, Math.pow(10, k));

/** 分母 d に対して既約な真分数の分子（1〜d-1、d と互いに素）。約分の必要がない分数を作るのに使う */
export function properNum(r, d) {
  return until(() => r.int(1, d - 1), (x) => gcd(x, d) === 1);
}

/** 「約分して ○」の説明文。すでに既約ならその旨を書く */
export function reduceNote(n, d, tex) {
  return gcd(n, d) === 1 ? `これ以上約分できないので $${tex}$。` : `約分して $${tex}$。`;
}

/** 桁数指定で乱数（k桁の整数） */
export function nDigit(r, k) {
  return r.int(Math.pow(10, k - 1), Math.pow(10, k) - 1);
}
