// ============================================================
// _algebra.js — 中2/中3の「式で答える」問題のための記号式ヘルパー
//  ・単項式 mono = { c:係数, v:{変数:指数} }（例 -6ab² → { c:-6, v:{a:1,b:2} }）
//  ・多項式 = mono の配列
//  ・整形（符号・係数1の省略・指数の上付き・同類項まとめ）と、
//    「ありがちな誤答」の式ダミーづくりを共通化する。
//  中1の数値問題と同じ {q, ans, h1, h2, choices} を返せるようにするための土台。
// ============================================================

const MINUS = "−"; // U+2212（データ既存の表記に合わせる）
const VAR_ORDER = ["x", "y", "z", "a", "b", "c", "m", "n", "t"];

/** 指数を上付き文字に（1は空、2→² 3→³ … それ以上は ^n） */
export function sup(e) {
  if (e === 1) return "";
  const map = { 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶" };
  return map[e] || "^" + e;
}

/** 変数部の文字列（{a:1,b:2} → "ab²"）。決まった順に並べる */
export function varStr(v = {}) {
  return VAR_ORDER.filter((k) => v[k]).map((k) => k + sup(v[k])).join("");
}

/** 係数の絶対値＋変数部（符号は呼び出し側で付ける）。係数1は変数があれば省略 */
function absMono(c, v = {}) {
  const vs = varStr(v);
  const a = Math.abs(c);
  if (vs === "") return String(a);     // ただの数
  if (a === 1) return vs;              // 1ab → ab
  return a + vs;
}

/** 1つの単項式を符号つきで（例 {c:-6,v:{a:1,b:1}} → "−6ab"）。0は "0" */
export function monoStr(c, v = {}) {
  if (c === 0) return "0";
  return (c < 0 ? MINUS : "") + absMono(c, v);
}

/** 同類項をまとめる（変数部が同じものの係数を合算） */
export function merge(terms) {
  const map = new Map();
  for (const t of terms) {
    const key = varStr(t.v);
    const cur = map.get(key) || { c: 0, v: t.v };
    cur.c += t.c;
    map.set(key, cur);
  }
  // 次数の高い順 → 変数順、最後に定数。簡易に「変数あり → なし」で並べる
  return [...map.values()].filter((t) => t.c !== 0);
}

/** 多項式を文字列に（同類項まとめ込み）。例 [{c:-3,v:{a:1}},{c:-1,v:{b:1}},{c:-3,v:{}}] → "−3a−b−3" */
export function polyStr(terms) {
  const nz = merge(terms);
  if (nz.length === 0) return "0";
  // 変数ありを先、定数を後ろへ
  nz.sort((p, q) => (varStr(q.v) ? 1 : 0) - (varStr(p.v) ? 1 : 0));
  let s = "";
  nz.forEach((t, i) => {
    const mag = absMono(t.c, t.v);
    if (i === 0) s += (t.c < 0 ? MINUS : "") + mag;
    else s += (t.c < 0 ? MINUS : "+") + mag;
  });
  return s;
}

/** 単項式どうしの積 {c,v} × {c,v}（指数は足す） */
export function mulMono(m1, m2) {
  const v = { ...m1.v };
  for (const k in m2.v) v[k] = (v[k] || 0) + m2.v[k];
  return { c: m1.c * m2.c, v };
}

/** 単項式の商 m1 ÷ m2（割り切れないときは null）。指数は引く（0は消す） */
export function divMono(m1, m2) {
  if (m2.c === 0 || m1.c % m2.c !== 0) return null;
  const v = { ...m1.v };
  for (const k in m2.v) {
    const e = (v[k] || 0) - m2.v[k];
    if (e < 0) return null;       // 約分で負の指数（分数）になる → この問題では出さない
    if (e === 0) delete v[k]; else v[k] = e;
  }
  return { c: m1.c / m2.c, v };
}

// ── 乱数ヘルパー（build(r) の r は r(min,max)＝整数） ──
export const rsign = (r) => (r(0, 1) ? 1 : -1);                 // ±1
export const rnz = (r, a, b) => { let x = 0; while (x === 0) x = r(a, b); return x; }; // 0以外
export const rpick = (r, arr) => arr[r(0, arr.length - 1)];

/**
 * 式の4択をつくる。correct（正解の文字列）＋ variants（誤答候補の文字列配列）から
 * 重複・正解一致を除いて3つ選び、足りなければ generic で補う。シャッフルして返す。
 * @param {string} correct
 * @param {string[]} variants  ありがちな誤答（前から優先）
 * @param {string[]} [filler]  予備のダミー
 */
export function exprChoices(correct, variants = [], filler = [], r = null) {
  const out = [];
  const seen = new Set([correct.replace(/\s/g, "")]);
  const add = (s) => {
    if (s == null) return;
    const k = String(s).replace(/\s/g, "");
    if (k === "" || seen.has(k)) return;
    seen.add(k); out.push(s);
  };
  for (const v of variants) { if (out.length >= 3) break; add(v); }
  for (const v of filler) { if (out.length >= 3) break; add(v); }
  const all = [correct, ...out.slice(0, 3)];
  // シャッフル（r があれば決定的、なければ Math.random）
  for (let i = all.length - 1; i > 0; i--) {
    const j = r ? r(0, i) : Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}
