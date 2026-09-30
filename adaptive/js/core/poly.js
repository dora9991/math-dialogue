// ============================================================
// poly.js — 有理数係数の多変数多項式（展開・因数分解・式の計算の問題づくり用）
//
//  計算は厳密（rational.js）。等しいかどうかも構造で比べられるので、
//  「展開した結果が本当に正しいか」をテンプレ側で機械的に検証できる。
// ============================================================
import { Q, toQ, add as qadd, mul as qmul, neg as qneg, eq as qeq } from "./rational.js";
import { tq } from "./tex.js";

const keyOf = (e) =>
  Object.keys(e)
    .filter((v) => e[v] > 0)
    .sort()
    .map((v) => `${v}${e[v]}`)
    .join("|");

export class Poly {
  constructor(terms = new Map()) {
    this.t = terms; // key -> { c: Q, e: {var: exp} }
  }

  static const(c) {
    return Poly.mono(c, {});
  }
  /** 変数 v の k 乗 */
  static v(v = "x", k = 1) {
    return Poly.mono(1, { [v]: k });
  }
  /** c * (単項式) */
  static mono(c, e = {}) {
    const p = new Poly();
    const q = toQ(c);
    if (q.n !== 0) {
      const ee = {};
      for (const v of Object.keys(e)) if (e[v] > 0) ee[v] = e[v];
      p.t.set(keyOf(ee), { c: q, e: ee });
    }
    return p;
  }
  /** 単変数：係数を低次から並べた配列（[定数項, 1次, 2次, …]） */
  static fromCoeffs(cs, v = "x") {
    let p = new Poly();
    cs.forEach((c, k) => {
      p = p.add(Poly.mono(c, k ? { [v]: k } : {}));
    });
    return p;
  }

  clone() {
    const p = new Poly();
    for (const [k, t] of this.t) p.t.set(k, { c: t.c, e: { ...t.e } });
    return p;
  }

  add(o) {
    const p = this.clone();
    for (const [k, t] of o.t) {
      const cur = p.t.get(k);
      if (cur) {
        const c = qadd(cur.c, t.c);
        if (c.n === 0) p.t.delete(k);
        else p.t.set(k, { c, e: cur.e });
      } else p.t.set(k, { c: t.c, e: { ...t.e } });
    }
    return p;
  }
  neg() {
    const p = new Poly();
    for (const [k, t] of this.t) p.t.set(k, { c: qneg(t.c), e: { ...t.e } });
    return p;
  }
  sub(o) {
    return this.add(o.neg());
  }
  scale(q) {
    q = toQ(q);
    if (q.n === 0) return new Poly();
    const p = new Poly();
    for (const [k, t] of this.t) p.t.set(k, { c: qmul(t.c, q), e: { ...t.e } });
    return p;
  }
  mul(o) {
    let p = new Poly();
    for (const a of this.t.values()) {
      for (const b of o.t.values()) {
        const e = { ...a.e };
        for (const v of Object.keys(b.e)) e[v] = (e[v] || 0) + b.e[v];
        p = p.add(Poly.mono(qmul(a.c, b.c), e));
      }
    }
    return p;
  }
  pow(n) {
    let p = Poly.const(1);
    for (let i = 0; i < n; i++) p = p.mul(this);
    return p;
  }
  isZero() {
    return this.t.size === 0;
  }
  equals(o) {
    if (this.t.size !== o.t.size) return false;
    for (const [k, t] of this.t) {
      const u = o.t.get(k);
      if (!u || !qeq(t.c, u.c)) return false;
    }
    return true;
  }
  /** 全体の次数 */
  degree() {
    let d = 0;
    for (const t of this.t.values()) d = Math.max(d, Object.values(t.e).reduce((a, b) => a + b, 0));
    return d;
  }
  /** 変数 v についての k 次の係数（他の変数を含まない項のみ。単変数用） */
  coeff(k, v = "x") {
    const t = this.t.get(k ? keyOf({ [v]: k }) : "");
    return t ? t.c : Q(0);
  }
  /** 代入 { x: 数 or Q } → Q */
  eval(env) {
    let s = Q(0);
    for (const t of this.t.values()) {
      let term = t.c;
      for (const v of Object.keys(t.e)) {
        let x = Q(1);
        const b = toQ(env[v]);
        for (let i = 0; i < t.e[v]; i++) x = qmul(x, b);
        term = qmul(term, x);
      }
      s = qadd(s, term);
    }
    return s;
  }

  /**
   * TeX にする。
   *  opts.order … 変数の並び（例 ["x","y"]）。既定はアルファベット順
   */
  toTeX(opts = {}) {
    if (this.t.size === 0) return "0";
    const order = opts.order || [];
    // 変数の並び：指定があればその順、残りはアルファベット順
    const allVars = [...new Set([...order, ...[...this.t.values()].flatMap((t) => Object.keys(t.e)).sort()])];
    const rank = (v) => allVars.indexOf(v);
    // 次数の高い項から。同じ次数なら、並びの前の変数の指数が大きい項から（辞書式）
    const terms = [...this.t.values()].sort((a, b) => {
      const da = Object.values(a.e).reduce((s, x) => s + x, 0);
      const db = Object.values(b.e).reduce((s, x) => s + x, 0);
      if (da !== db) return db - da;
      for (const v of allVars) {
        const ea = a.e[v] || 0;
        const eb = b.e[v] || 0;
        if (ea !== eb) return eb - ea;
      }
      return 0;
    });
    let s = "";
    terms.forEach((t, i) => {
      const negative = t.c.n < 0;
      const ac = negative ? qneg(t.c) : t.c;
      const vars = Object.keys(t.e).sort((p, q) => rank(p) - rank(q));
      const mono = vars.map((v) => (t.e[v] === 1 ? v : `${v}^{${t.e[v]}}`)).join("");
      let coef;
      if (vars.length === 0) coef = tq(ac);
      else if (ac.n === 1 && ac.d === 1) coef = "";
      else coef = tq(ac);
      const body = coef + mono;
      if (i === 0) s += (negative ? "-" : "") + body;
      else s += (negative ? "-" : "+") + body;
    });
    return s;
  }
}

/** 短縮：P.x(2) は x^2、P.c(3) は定数 3 */
export const P = {
  x: (k = 1) => Poly.v("x", k),
  v: (name, k = 1) => Poly.v(name, k),
  c: (q) => Poly.const(q),
  lin: (a, b, v = "x") => Poly.mono(a, { [v]: 1 }).add(Poly.const(b)), // a v + b
  mono: Poly.mono,
  coeffs: Poly.fromCoeffs,
};
