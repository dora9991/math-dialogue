// ============================================================
// answer.js — 答え合わせ
//  入力式：数値・小数・分数（"3/4"）を受け付ける。分数の答えは約分まで求める。
//  4択：選んだ選択肢が正解と同じか。
// ============================================================

/** 入力のゆれをそろえる（全角→半角、いろいろなマイナス→"-"、空白を消す） */
export function normalizeInput(s) {
  return String(s ?? "")
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, ".")
    .replace(/[／]/g, "/")
    .replace(/[−－ーｰ‐–—]/g, "-")
    .replace(/[＋]/g, "+")
    .replace(/\s/g, "");
}

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

/** 文字列 → { value, isFrac, reduced } または null */
export function parseNumber(raw) {
  const s = normalizeInput(raw).replace(/^\+/, "");
  if (/^-?\d+(\.\d+)?$/.test(s) || /^-?\.\d+$/.test(s)) return { value: Number(s), isFrac: false, reduced: true };
  const m = s.match(/^(-?)(\d+)\/(-?)(\d+)$/);
  if (m) {
    const n = Number(m[2]), d = Number(m[4]);
    if (d === 0) return null;
    const neg = (m[1] === "-") !== (m[3] === "-");
    return { value: (neg ? -1 : 1) * (n / d), isFrac: true, reduced: gcd(n, d) === 1 && d !== 1 };
  }
  return null;
}

/** 正解の値（数値 or "a/b"）を数値に */
export function ansValue(ans) {
  if (typeof ans === "number") return ans;
  const p = parseNumber(ans);
  return p ? p.value : NaN;
}

/**
 * 判定。
 * @returns {{ correct: boolean, note?: string }}
 */
export function checkAnswer(problem, input) {
  if (problem.choices) {
    const ok = String(input) === String(problem.ans);
    return { correct: ok };
  }
  const p = parseNumber(input);
  if (!p) return { correct: false, note: "数字で答えよう（分数は「3/4」のように）" };
  const want = ansValue(problem.ans);
  const same = Math.abs(p.value - want) < 1e-9 * Math.max(1, Math.abs(want));
  if (!same) return { correct: false };
  // 分数の答えは約分まで
  if (p.isFrac && !p.reduced) return { correct: false, note: "値は合っているよ。約分しよう！" };
  return { correct: true };
}
