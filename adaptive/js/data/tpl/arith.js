// ============================================================
// tpl/arith.js — 四則の式（トークン列）の評価と TeX 化
//
//  式は ["12","+",3,"×",4] のような配列（数は number か Q、演算は + - × ÷ と括弧）。
//  評価の仕方を変えて、生徒がやりがちな誤った答え（左から順に計算、かっこを無視）も作れる。
// ============================================================
import { Q, toQ, add, sub, mul, div, pow } from "../../core/rational.js";
import { tq } from "../../core/tex.js";

class DivZero extends Error {}

const isNum = (x) => typeof x === "number" || (x && typeof x === "object");

/**
 * 評価する。mode:
 *   "std"     … 正しい計算順序
 *   "ltr"     … 優先順位を無視して左から順に（かっこの中は先に）
 *   "noparen" … かっこを無視して正しい順序で
 * 0でわる場合は null を返す。
 */
export function evalTokens(tokens, mode = "std") {
  try {
    let tk = tokens;
    if (mode === "noparen") tk = tokens.filter((x) => x !== "(" && x !== ")");
    let i = 0;
    const peek = () => tk[i];
    // 累乗 ^ は最も強い。-3^2 は -(3^2)。指数は整数の数だけ
    const primary = () => {
      const x = tk[i++];
      if (x === "-") return sub(0, primary());
      let v;
      if (x === "(") {
        v = mode === "ltr" ? exprLtr() : expr();
        i++; // ")"
      } else v = toQ(x);
      if (peek() === "^") {
        i++;
        const e = toQ(tk[i++]);
        v = pow(v, e.n);
      }
      return v;
    };
    const apply = (op, a, b) => {
      if (op === "+") return add(a, b);
      if (op === "-") return sub(a, b);
      if (op === "×") return mul(a, b);
      if (b.n === 0) throw new DivZero();
      return div(a, b);
    };
    const term = () => {
      let v = primary();
      while (peek() === "×" || peek() === "÷") {
        const op = tk[i++];
        v = apply(op, v, primary());
      }
      return v;
    };
    const expr = () => {
      let v = term();
      while (peek() === "+" || peek() === "-") {
        const op = tk[i++];
        v = apply(op, v, term());
      }
      return v;
    };
    const exprLtr = () => {
      let v = primary();
      while (peek() === "+" || peek() === "-" || peek() === "×" || peek() === "÷") {
        const op = tk[i++];
        v = apply(op, v, primary());
      }
      return v;
    };
    return mode === "ltr" ? exprLtr() : expr();
  } catch (e) {
    if (e instanceof DivZero) return null;
    throw e;
  }
}

/** TeX にする。数は整数・Q（分数は \frac）。負の数は自動では括弧で囲まない（"(" を式に入れておく） */
export function texTokens(tokens) {
  return tokens
    .map((x, i) => {
      if (x === "×") return "\\times ";
      if (x === "÷") return "\\div ";
      if (x === "^") return "^";
      if (x === "+" || x === "-" || x === "(" || x === ")") return x;
      if (tokens[i - 1] === "^") return `{${tq(x)}}`; // 指数
      if (x && x.tex) return x.tex; // 小数など、表記を指定した数
      return tq(x);
    })
    .join("");
}

/** 整数として評価できたときだけ number を返す。そうでなければ null */
export function evalInt(tokens, mode = "std") {
  const v = evalTokens(tokens, mode);
  return v && v.d === 1 ? v.n : null;
}

export { isNum };
