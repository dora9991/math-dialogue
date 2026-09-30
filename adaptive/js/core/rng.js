// ============================================================
// rng.js — seed で再現できる乱数
//
// 問題は「テンプレ ID・難易度・seed」の3つで完全に再現できる。
// （「気になる」報告に seed を残しておけば、同じ問題をあとから開き直せる）
// mulberry32 を使用。暗号用途ではない。
// ============================================================

/** 文字列 → 32bit の整数（seed の派生用） */
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** 新しい seed を作る（画面から出題するときだけ使う） */
export function newSeed() {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/**
 * seed から乱数生成器を作る。
 * r.int(lo,hi) は両端を含む整数。
 */
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    /** lo〜hi（両端を含む）の整数 */
    int(lo, hi) {
      return lo + Math.floor(next() * (hi - lo + 1));
    },
    /** lo〜hi の整数（0 を除く） */
    nz(lo, hi) {
      let v;
      do v = r.int(lo, hi); while (v === 0);
      return v;
    },
    /** 配列から1つ */
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    /** 確率 p で true */
    chance(p) {
      return next() < p;
    },
    /** +1 か -1 */
    sign() {
      return next() < 0.5 ? -1 : 1;
    },
    /** 配列のコピーをシャッフル */
    shuffle(arr) {
      const b = arr.slice();
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
      }
      return b;
    },
    /** 重複なしで k 個 */
    sample(arr, k) {
      return r.shuffle(arr).slice(0, k);
    },
    /** lo〜hi の整数を、除外リスト以外から */
    intExcept(lo, hi, excl) {
      const pool = [];
      for (let v = lo; v <= hi; v++) if (!excl.includes(v)) pool.push(v);
      return pool.length ? r.pick(pool) : lo;
    },
  };
  return r;
}
