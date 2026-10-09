// ============================================================
// markup.js — 「文章＋$…$のTeX」の混在文字列を分解する
//
//  問題文・選択肢・解説はすべてこの形式：  "次の計算をしなさい。 $\\frac{1}{2}+\\frac{1}{3}$"
//  ・$ で囲んだ部分が数式、それ以外は普通の文章。改行は \n。
//  ・$ の個数が奇数、または $$（空の数式）はエラー（テンプレの書き間違いを検出するため）。
// ============================================================

/** [{ math: boolean, s: string }, …] にする */
export function parseMarkup(str) {
  const parts = String(str).split("$");
  if (parts.length % 2 === 0) throw new Error(`$ の数が合わない: ${str}`);
  const out = [];
  parts.forEach((s, i) => {
    const math = i % 2 === 1;
    if (s === "") {
      if (math) throw new Error(`空の数式 $$: ${str}`);
      return;
    }
    out.push({ math, s });
  });
  return out;
}

/** 数式部分だけ取り出す */
export function mathParts(str) {
  return parseMarkup(str)
    .filter((p) => p.math)
    .map((p) => p.s);
}

/** 数式を除いた文章だけ（文字数の目安・NaN検査に使う） */
export function plainText(str) {
  return parseMarkup(str)
    .map((p) => (p.math ? "" : p.s))
    .join("");
}
