// ============================================================
// tpl/elem_num1.js — 小学校 数と計算（整数の四則・筆算・大きな数）
//   add_carry / sub_borrow / mul_table / div_basic / add_sub_big / mul_by_1digit /
//   div_rem / mul_2digit / div_long_1 / div_long_2 / big_numbers / estimate_round / order_ops_int
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { t, ts, until, same, assert, byLv, nDigit, NAMES } from "./util.js";
import { evalTokens, evalInt, texTokens } from "./arith.js";
import { comma } from "../../core/tex.js";

/** 足し算で「くり上がる桁」（0=一の位）の一覧 */
function carryCols(a, b) {
  const cols = [];
  let carry = 0;
  for (let j = 0; j < 10 && (a >= Math.pow(10, j) || b >= Math.pow(10, j) || carry); j++) {
    const s = Math.floor(a / Math.pow(10, j)) % 10 + (Math.floor(b / Math.pow(10, j)) % 10) + carry;
    carry = s >= 10 ? 1 : 0;
    if (carry) cols.push(j);
  }
  return cols;
}
/** 引き算で「くり下げる桁」の一覧（a > b） */
function borrowCols(a, b) {
  const cols = [];
  let borrow = 0;
  for (let j = 0; j < 10 && (a >= Math.pow(10, j) || b >= Math.pow(10, j)); j++) {
    const x = (Math.floor(a / Math.pow(10, j)) % 10) - borrow;
    const y = Math.floor(b / Math.pow(10, j)) % 10;
    if (x < y) {
      cols.push(j);
      borrow = 1;
    } else borrow = 0;
  }
  return cols;
}
/** 桁ごとに大きい方から小さい方をひいた（くり下げを使わない誤り） */
function reverseSub(a, b) {
  let out = 0;
  for (let j = 0; j < 10; j++) {
    const x = Math.floor(a / Math.pow(10, j)) % 10;
    const y = Math.floor(b / Math.pow(10, j)) % 10;
    out += Math.abs(x - y) * Math.pow(10, j);
  }
  return out;
}

/** 数を漢字まじりの読み（三千五百二十万…）にする。10^12 未満 */
export function toKanji(n) {
  if (n === 0) return "零";
  const D = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const group = (g) => {
    let s = "";
    const th = Math.floor(g / 1000) % 10;
    const hu = Math.floor(g / 100) % 10;
    const te = Math.floor(g / 10) % 10;
    const on = g % 10;
    if (th) s += (th === 1 ? "" : D[th]) + "千";
    if (hu) s += (hu === 1 ? "" : D[hu]) + "百";
    if (te) s += (te === 1 ? "" : D[te]) + "十";
    if (on) s += D[on];
    return s;
  };
  const units = ["", "万", "億", "兆"];
  let out = "";
  for (let i = 3; i >= 0; i--) {
    const g = Math.floor(n / Math.pow(10000, i)) % 10000;
    if (g) out += group(g) + units[i];
  }
  return out;
}

export default {
  // ── 2けたのたし算（くり上がり）───────────────────
  add_carry: [
    t("num", (r, lv) => {
      let terms;
      if (lv === 1) {
        // 一の位だけくり上がる（答えは100未満）
        terms = until(() => [r.int(11, 79), r.int(11, 79)], ([a, b]) => a % 10 + (b % 10) >= 10 && Math.floor(a / 10) + Math.floor(b / 10) <= 8);
      } else if (lv === 2) {
        // 十の位もくり上がる（答えは3けた）
        terms = until(() => [r.int(35, 99), r.int(35, 99)], ([a, b]) => a % 10 + (b % 10) >= 10 && a + b >= 100 && a + b < 200);
      } else {
        // 3つの2けたの数
        terms = until(() => [r.int(18, 78), r.int(18, 78), r.int(18, 78)], (v) => v.reduce((x, y) => x + y, 0) < 250 && carryCols(v[0], v[1]).length + carryCols(v[0] + v[1], v[2]).length >= 2);
      }
      const ans = terms.reduce((x, y) => x + y, 0);
      const q = `次の計算をしなさい。\n$${terms.join("+")}$`;
      const wrongs = [];
      const cc = carryCols(terms[0], terms[1]);
      if (cc.length) wrongs.push([ans - Math.pow(10, cc[0] + 1), "MC-CARRY-FORGET"]);
      if (cc.length > 1) wrongs.push([ans - Math.pow(10, cc[1] + 1), "MC-CARRY-FORGET"]);
      wrongs.push([ans + 10, "MC-SLIP"], [ans - 1, "MC-SLIP"]);
      let explain;
      if (terms.length === 2) {
        const [a, b] = terms;
        explain = `一の位から順に計算します。$${a % 10}+${b % 10}=${(a % 10) + (b % 10)}$ で、10をこえたので十の位へ1くり上げます。十の位は $${Math.floor(a / 10) % 10}+${Math.floor(b / 10) % 10}+1=${(Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) + 1}$。答えは $${ans}$。`;
      } else {
        explain = `まず $${terms[0]}+${terms[1]}=${terms[0] + terms[1]}$、つぎに $${terms[0] + terms[1]}+${terms[2]}=${ans}$。くり上がりを忘れずに、位をそろえて計算します。`;
      }
      return num({ q, ans, wrongs, explain });
    }),
  ],

  // ── 2けたのひき算（くり下がり）───────────────────
  sub_borrow: [
    t("num", (r, lv) => {
      let a, b;
      if (lv === 1) [a, b] = until(() => [r.int(21, 95), r.int(12, 78)], ([x, y]) => x > y && x % 10 < y % 10);
      else if (lv === 2) [a, b] = until(() => [r.int(101, 190), r.int(15, 98)], ([x, y]) => x > y && borrowCols(x, y).length >= 1 && x - y >= 10);
      else [a, b] = until(() => [r.pick([100, 200, 300, 120, 130, 140, 150, 160, 170, 180, 190]) , r.int(13, 89)], ([x, y]) => x > y && x % 10 < y % 10);
      const ans = a - b;
      assert(ans + b === a, "検算");
      const bc = borrowCols(a, b);
      const wrongs = [[ans + Math.pow(10, bc[0] + 1), "MC-BORROW-FORGET"], [reverseSub(a, b), "MC-SUB-REVERSE"], [ans + 1, "MC-SLIP"], [ans - 10, "MC-SLIP"]];
      const explain = `一の位は $${a % 10}$ から $${b % 10}$ がひけないので、十の位から1（=10）をかりて $${(a % 10) + 10}-${b % 10}=${(a % 10) + 10 - (b % 10)}$。十の位は1かした分を引いて考えます。答えは $${ans}$。（たしかめ：$${ans}+${b}=${a}$）`;
      return num({ q: `次の計算をしなさい。\n$${a}-${b}$`, ans, wrongs, explain });
    }),
  ],

  // ── かけ算九九 ──────────────────────────────
  mul_table: [
    t("num", (r, lv) => {
      if (lv === 3) {
        const [a, b] = [r.int(3, 9), r.int(6, 9)];
        const p = a * b;
        return num({
          q: `$\\square\\times ${b}=${p}$ にあてはまる数を答えなさい。`,
          ans: a,
          wrongs: [[a + 1, "MC-TABLE-OFF"], [a - 1, "MC-TABLE-OFF"], [p - b, "MC-TABLE-OFF"], [p + b, "MC-SLIP"]],
          explain: `九九を逆にたどります。$${b}$ の段で $${p}$ になるのは $${a}\\times${b}=${p}$ なので、答えは $${a}$。`,
        });
      }
      const [a, b] = lv === 1 ? [r.int(2, 5), r.int(2, 9)] : [r.int(6, 9), r.int(6, 9)];
      const ans = a * b;
      const flip = r.chance(0.5);
      const [x, y] = flip ? [b, a] : [a, b];
      return num({
        q: `次の計算をしなさい。\n$${x}\\times ${y}$`,
        ans,
        wrongs: [[ans + x, "MC-TABLE-OFF"], [ans - x, "MC-TABLE-OFF"], [ans + y, "MC-TABLE-OFF"], [ans - y, "MC-TABLE-OFF"], [x + y, "MC-ADD-FOR-MUL"]],
        explain: `$${x}\\times ${y}=${ans}$ です。九九は「${x}の段」を思い出して、${y}番目の数を答えます。`,
      });
    }),
  ],

  // ── わり算（九九の範囲）─────────────────────────
  div_basic: [
    t("num", (r, lv) => {
      if (lv === 3 && r.chance(0.5)) {
        const [q, b] = [r.int(4, 9), r.int(6, 9)];
        const a = q * b;
        return num({
          q: `$\\square\\div ${b}=${q}$ にあてはまる数を答えなさい。`,
          ans: a,
          wrongs: [[q + b, "MC-ADD-FOR-MUL"], [a + b, "MC-TABLE-OFF"], [a - b, "MC-TABLE-OFF"], [q, "MC-DIV-DIRECTION"]],
          explain: `わり算は九九を逆にたどります。$\\square\\div ${b}=${q}$ は $${q}\\times${b}=${a}$ より、□ は $${a}$。`,
        });
      }
      if (lv === 3) {
        const name = r.pick(NAMES);
        const [q, b] = [r.int(4, 9), r.int(6, 9)];
        const a = q * b;
        return num({
          q: `${name}さんは、あめ ${a} こを ${b} 人で同じ数ずつ分けます。1人分は何こですか。`,
          ans: q,
          post: "こ",
          wrongs: [[a - b, "MC-DIV-DIRECTION"], [b, "MC-DIV-DIRECTION"], [q + 1, "MC-TABLE-OFF"], [q - 1, "MC-TABLE-OFF"]],
          explain: `同じ数ずつ分けるので、わり算です。$${a}\\div ${b}=${q}$。$${b}\\times ${q}=${a}$ でたしかめられます。`,
        });
      }
      const [q, b] = lv === 1 ? [r.int(2, 9), r.int(2, 5)] : [r.int(4, 9), r.int(6, 9)];
      const a = q * b;
      return num({
        q: `次の計算をしなさい。\n$${a}\\div ${b}$`,
        ans: q,
        wrongs: [[q + 1, "MC-TABLE-OFF"], [q - 1, "MC-TABLE-OFF"], [b, "MC-DIV-DIRECTION"], [a - b, "MC-DIV-DIRECTION"]],
        explain: `$${b}\\times \\square=${a}$ になる □ をさがします。$${b}\\times ${q}=${a}$ なので、答えは $${q}$。`,
      });
    }),
  ],

  // ── 3けた・4けたのたし算・ひき算 ──────────────────
  add_sub_big: ts(
    "num",
    (r, lv) => {
      const add = r.chance(0.5);
      let a, b;
      if (lv === 1) [a, b] = until(() => [nDigit(r, 3), nDigit(r, 3)], ([x, y]) => (add ? carryCols(x, y).length === 1 && x + y < 1000 : x > y && borrowCols(x, y).length === 1));
      else if (lv === 2) [a, b] = until(() => [nDigit(r, 4), r.chance(0.5) ? nDigit(r, 3) : nDigit(r, 4)], ([x, y]) => (add ? carryCols(x, y).length >= 2 : x > y && borrowCols(x, y).length >= 2));
      else if (add) [a, b] = until(() => [nDigit(r, 4), nDigit(r, 4)], ([x, y]) => carryCols(x, y).length >= 3);
      else [a, b] = until(() => [r.pick([1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 5003, 7002, 6004, 8001, 4005]), nDigit(r, 4)], ([x, y]) => x > y + 100 && borrowCols(x, y).length >= 1);
      const ans = add ? a + b : a - b;
      const cols = add ? carryCols(a, b) : borrowCols(a, b);
      const wrongs = add
        ? [[ans - Math.pow(10, cols[0] + 1), "MC-CARRY-FORGET"], cols[1] != null ? [ans - Math.pow(10, cols[1] + 1), "MC-CARRY-FORGET"] : [ans - 10, "MC-CARRY-FORGET"], [ans + 100, "MC-SLIP"]]
        : [[ans + Math.pow(10, cols[0] + 1), "MC-BORROW-FORGET"], [reverseSub(a, b), "MC-SUB-REVERSE"], [ans - 100, "MC-SLIP"]];
      const explain = add
        ? `位をそろえて、一の位から計算します。くり上がりは ${cols.map((j) => ["一", "十", "百", "千"][j] + "の位").join("・")} で起こります。答えは $${comma(ans)}$。`
        : `位をそろえて、一の位から計算します。ひけない位は、上の位から1（=10）をかります。くり下げは ${cols.map((j) => ["一", "十", "百", "千"][j] + "の位").join("・")} で起こります。答えは $${comma(ans)}$。（たしかめ：$${comma(ans)}+${comma(b)}=${comma(a)}$）`;
      return num({ q: `次の計算をしなさい。\n$${add ? `${a}+${b}` : `${a}-${b}`}$`, ans, wrongs, explain });
    },
  ),

  // ── 2〜3けた×1けたの筆算 ─────────────────────
  mul_by_1digit: [
    t("num", (r, lv) => {
      let a, m;
      if (lv === 1) [a, m] = until(() => [r.int(12, 49), r.int(2, 9)], ([x, y]) => x % 10 * y >= 10 && Math.floor(x / 10) * y < 10);
      else if (lv === 2) [a, m] = until(() => [nDigit(r, 3), r.int(3, 9)], ([x, y]) => x % 10 * y >= 10);
      else [a, m] = until(() => [r.pick([102, 203, 304, 405, 506, 607, 708, 809, 350, 470, 260, 380, 906]), r.int(3, 9)], () => true);
      const ans = a * m;
      const wrongs = [];
      const c0 = Math.floor(((a % 10) * m) / 10);
      if (c0) wrongs.push([ans - c0 * 10, "MC-CARRY-FORGET"]);
      const s = String(a);
      if (s.includes("0") && lv === 3) wrongs.push([Number(s.replace(/0/g, "")) * m, "MC-MUL-ZERO-SKIP"]);
      wrongs.push([ans + 10, "MC-SLIP"], [ans - 100, "MC-SLIP"], [ans + m, "MC-SLIP"]);
      return num({
        q: `次の計算をしなさい。\n$${a}\\times ${m}$`,
        ans,
        wrongs,
        explain: `位ごとにかけて、くり上がりをたします。$${a}\\times ${m}=${ans}$。${s.includes("0") ? "0の位にもくり上がりの数がはいることに注意します。" : ""}`,
      });
    }),
  ],

  // ── あまりのあるわり算 ─────────────────────────
  div_rem: [
    t("fields", (r, lv) => {
      const b = lv === 1 ? r.int(3, 7) : r.int(5, 9);
      const q = lv === 1 ? r.int(3, 9) : r.int(5, 14);
      const rem = r.int(1, b - 1);
      const a = q * b + rem;
      assert(Math.floor(a / b) === q && a % b === rem, "検算");
      return fields({
        q: `$${a}\\div ${b}$ の商とあまりを答えなさい。`,
        fields: [
          { id: "q", value: q, pre: "商" },
          { id: "r", value: rem, pre: "あまり" },
        ],
        wrongs: [
          { values: { q: q - 1, r: rem + b }, mc: "MC-REM-TOO-BIG" },
          { values: { q: rem, r: q }, mc: "MC-DIV-DIRECTION" },
          { values: { q: q + 1, r: rem }, mc: "MC-SLIP" },
        ],
        explain: `$${b}\\times ${q}=${q * b}$ で、$${a}$ にいちばん近い（こえない）のは $${q * b}$。$${a}-${q * b}=${rem}$ が、あまりです。あまりは、わる数 $${b}$ より小さくなります。（たしかめ：$${b}\\times${q}+${rem}=${a}$）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const b = r.int(3, 9);
        const q = r.int(4, lv === 1 ? 9 : 15);
        const rem = r.int(1, b - 1);
        const a = q * b + rem;
        return num({
          q: `ある数を $${b}$ でわると、商が $${q}$、あまりが $${rem}$ になりました。ある数はいくつですか。`,
          ans: a,
          wrongs: [[q * b, "MC-REM-FORGET"], [q + b + rem, "MC-ADD-FOR-MUL"], [a + b, "MC-SLIP"]],
          explain: `わる数×商＋あまり＝わられる数 です。$${b}\\times${q}+${rem}=${a}$。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 2けた×2けたの筆算 ─────────────────────────
  mul_2digit: [
    t("num", (r, lv) => {
      let a, b;
      if (lv === 1) [a, b] = [r.int(12, 39), r.int(12, 29)];
      else if (lv === 2) [a, b] = [nDigit(r, 3), r.int(21, 89)];
      else [a, b] = [r.pick([105, 206, 308, 409, 507, 60, 80, 70, 305, 402]), r.pick([40, 50, 32, 45, 65, 78, 24, 36])];
      const ans = a * b;
      const p1 = a * (b % 10);
      const p2 = a * Math.floor(b / 10);
      assert(p1 + p2 * 10 === ans, "検算");
      return num({
        q: `次の計算をしなさい。\n$${a}\\times ${b}$`,
        ans,
        wrongs: [[p1 + p2, "MC-MUL-NO-SHIFT"], [ans + 10, "MC-SLIP"], [ans - 100, "MC-SLIP"], [p1 * 10 + p2, "MC-MUL-NO-SHIFT"]],
        explain: `$${a}\\times ${b % 10}=${p1}$、$${a}\\times ${Math.floor(b / 10)}=${p2}$（十の位なので1けた左にずらして $${p2 * 10}$）。$${p1}+${p2 * 10}=${ans}$。`,
      });
    }),
  ],

  // ── 1けたでわる筆算 ────────────────────────────
  div_long_1: [
    t("num", (r, lv) => {
      const b = lv === 1 ? r.int(3, 8) : r.int(4, 9);
      let q;
      if (lv === 1) q = r.int(12, 29);
      else if (lv === 2) q = r.int(105, 299);
      else q = r.pick([104, 105, 106, 205, 207, 306, 108, 203, 309, 407, 508, 605]);
      const a = q * b;
      const alt = String(q).replace("0", "");
      return num({
        q: `次の計算をしなさい。\n$${a}\\div ${b}$`,
        ans: q,
        wrongs: [
          String(q).includes("0") ? [Number(alt), "MC-DIV-ZERO-SKIP"] : [q + 10, "MC-DIV-PLACE"],
          [q * 10, "MC-DIV-PLACE"],
          [q + 1, "MC-SLIP"],
          [q - 1, "MC-SLIP"],
        ],
        explain: `「たてる→かける→ひく→おろす」をくり返します。商のとちゅうで、おろした数が わる数 $${b}$ より小さいときは、その位に $0$ を書きます。答えは $${q}$。（たしかめ：$${b}\\times ${q}=${a}$）`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        const b = lv === 1 ? r.int(3, 8) : r.int(4, 9);
        const q = lv === 1 ? r.int(12, 29) : lv === 2 ? r.int(105, 299) : r.pick([104, 106, 205, 307, 108, 209]);
        const rem = r.int(1, b - 1);
        const a = q * b + rem;
        return fields({
          q: `次のわり算の商とあまりを答えなさい。\n$${a}\\div ${b}$`,
          fields: [
            { id: "q", value: q, pre: "商" },
            { id: "r", value: rem, pre: "あまり" },
          ],
          wrongs: [
            { values: { q: q + 1, r: rem - b >= 0 ? rem - b : rem }, mc: "MC-SLIP" },
            { values: { q: q - 1, r: rem + b }, mc: "MC-REM-TOO-BIG" },
            { values: { q, r: b - rem }, mc: "MC-SLIP" },
          ],
          explain: `筆算で商を求め、さいごに残った数があまりです。$${b}\\times ${q}=${q * b}$、$${a}-${q * b}=${rem}$。（たしかめ：$${b}\\times ${q}+${rem}=${a}$）`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 2けたでわる筆算 ────────────────────────────
  div_long_2: [
    t("num", (r, lv) => {
      const b = lv === 1 ? r.int(12, 29) : r.int(21, 59);
      const q = lv === 1 ? r.int(3, 9) : lv === 2 ? r.int(12, 39) : r.int(31, 89);
      const a = q * b;
      return num({
        q: `次の計算をしなさい。\n$${a}\\div ${b}$`,
        ans: q,
        wrongs: [[q + 1, "MC-DIV-ESTIMATE"], [q - 1, "MC-DIV-ESTIMATE"], [q * 10, "MC-DIV-PLACE"], [Math.floor(q / 10) || q + 2, "MC-DIV-PLACE"]],
        explain: `商の見当をつけて、$${b}\\times$（見当）が わられる数をこえないか確かめます。大きすぎたら1小さく、小さすぎたら1大きく直します。答えは $${q}$。（たしかめ：$${b}\\times${q}=${a}$）`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        const b = lv === 1 ? r.int(12, 29) : r.int(21, 59);
        const q = lv === 1 ? r.int(3, 9) : lv === 2 ? r.int(12, 39) : r.int(31, 89);
        const rem = r.int(1, b - 1);
        const a = q * b + rem;
        return fields({
          q: `次のわり算の商とあまりを答えなさい。\n$${a}\\div ${b}$`,
          fields: [
            { id: "q", value: q, pre: "商" },
            { id: "r", value: rem, pre: "あまり" },
          ],
          wrongs: [
            { values: { q: q - 1, r: rem + b }, mc: "MC-REM-TOO-BIG" },
            { values: { q: q + 1, r: rem }, mc: "MC-DIV-ESTIMATE" },
          ],
          explain: `$${b}\\times ${q}=${q * b}$、$${a}-${q * b}=${rem}$ なので、商は $${q}$、あまりは $${rem}$。あまりは わる数 $${b}$ より小さくなります。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 大きな数（万・億・兆）と位取り ─────────────
  big_numbers: [
    t("num", (r, lv) => {
      let n;
      if (lv === 1) n = r.int(1, 9) * 10000 + r.int(1, 9) * 1000 + r.int(0, 9) * 100 + r.int(0, 5) * 10;
      else if (lv === 2) n = r.int(1, 9) * 10000000 + r.int(1, 9) * 1000000 + r.int(0, 9) * 100000 + r.int(1, 9) * 1000;
      else n = r.int(1, 9) * 100000000 + r.int(0, 3) * 1000000 + r.int(1, 9) * 100000 + r.int(1, 9) * 1000;
      const kanji = toKanji(n);
      return num({
        q: `${kanji} を数字で書きなさい。`,
        ans: n,
        wrongs: [[n * 10, "MC-BIG-ZERO-COUNT"], [Math.round(n / 10), "MC-BIG-ZERO-COUNT"], [n * 100, "MC-BIG-ZERO-COUNT"]],
        explain: `右から4けたごとに「万」「億」「兆」の区切りがあります。${kanji} は $${comma(n)}$ です。読まない位（0）を忘れずに書きます。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const k = lv === 1 ? r.int(2, 9) : lv === 2 ? r.int(11, 99) : r.int(101, 999);
        const unit = lv === 3 ? 100000 : 10000;
        const uLabel = unit === 10000 ? "1万" : "10万";
        return num({
          q: `${uLabel}を ${k} こ集めた数を、数字で書きなさい。`,
          ans: k * unit,
          wrongs: [[k * unit * 10, "MC-BIG-ZERO-COUNT"], [k * unit / 10, "MC-BIG-ZERO-COUNT"], [k * (unit === 10000 ? 1000 : 10000), "MC-BIG-ZERO-COUNT"]],
          explain: `${uLabel}は $${comma(unit)}$ です。$${comma(unit)}\\times ${k}=${comma(k * unit)}$。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 概数・四捨五入 ─────────────────────────────
  estimate_round: [
    t("num", (r, lv) => {
      if (lv === 3) {
        // 四捨五入して百の位までの概数が X になる整数のうち、最大／最小
        const x = r.int(20, 90) * 100;
        const max = r.chance(0.5);
        const ans = max ? x + 49 : x - 50;
        return num({
          q: `四捨五入して百の位までの概数にすると $${comma(x)}$ になる整数のうち、いちばん${max ? "大きい" : "小さい"}数を答えなさい。`,
          ans,
          wrongs: [[max ? x + 50 : x - 49, "MC-ROUND-BOUNDARY"], [max ? x + 99 : x - 100, "MC-ROUND-BOUNDARY"], [x, "MC-ROUND-BOUNDARY"]],
          explain: `百の位までの概数にするとき、十の位を四捨五入します。$${comma(x)}$ になるのは $${comma(x - 50)}$ 以上 $${comma(x + 49)}$ 以下の整数です。よって、いちばん${max ? "大きい" : "小さい"}のは $${comma(ans)}$。`,
        });
      }
      const place = lv === 1 ? 10 : 100;
      const n = lv === 1 ? r.int(123, 998) : r.int(1234, 9876);
      const ans = Math.round(n / place + 1e-9) * place;
      const down = Math.floor(n / place) * place;
      return num({
        q: `$${comma(n)}$ を四捨五入して、${place === 10 ? "十" : "百"}の位までの概数にしなさい。`,
        ans,
        wrongs: [
          [down, "MC-ROUND-DOWN"],
          [ans + place, "MC-ROUND-UP"],
          [Math.round(n / (place * 10)) * place * 10, "MC-ROUND-PLACE"],
        ],
        explain: `${place === 10 ? "十" : "百"}の位までの概数にするには、そのすぐ下の${place === 10 ? "一" : "十"}の位を四捨五入します。$${comma(n)}$ の${place === 10 ? "一" : "十"}の位は $${Math.floor(n / (place / 10)) % 10}$ なので、${Math.floor(n / (place / 10)) % 10 >= 5 ? "切り上げて" : "切り捨てて"} $${comma(ans)}$。`,
      });
    }),
  ],

  // ── 整数の四則混合 ─────────────────────────────
  order_ops_int: [
    t("num", (r, lv) => {
      const build = () => {
        if (lv === 1) {
          const [a, b, c] = [r.int(10, 40), r.int(2, 9), r.int(2, 9)];
          return r.chance(0.5) ? [a, "+", b, "×", c] : [a + b * c, "-", b, "×", c];
        }
        if (lv === 2) {
          const shape = r.int(1, 3);
          if (shape === 1) return ["(", r.int(3, 20), "+", r.int(3, 20), ")", "×", r.int(2, 9)];
          if (shape === 2) {
            const [k, d] = [r.int(2, 9), r.int(2, 9)];
            return [r.int(20, 60), "-", k * d, "÷", d, "+", r.int(2, 9)];
          }
          return [r.int(2, 9), "×", r.int(3, 9), "-", r.int(2, 9), "×", r.int(2, 5)];
        }
        const shape = r.int(1, 3);
        if (shape === 1) {
          const [d, k] = [r.int(2, 6), r.int(2, 5)];
          const s = d * k;
          const x = r.int(1, s - 1);
          return [r.int(2, 9) * s, "÷", "(", x, "+", s - x, ")", "×", r.int(2, 5)];
        }
        if (shape === 2) return [r.int(30, 90), "-", "(", r.int(2, 9), "+", r.int(2, 9), ")", "×", r.int(2, 6)];
        const [x, y] = [r.int(3, 9), r.int(2, 9)];
        return ["(", r.int(20, 60), "-", x * y, "÷", y, ")", "×", r.int(2, 5), "+", r.int(1, 20)];
      };
      // 整数で、負にならない式だけを使う
      const tk = until(build, (v) => {
        const e = evalInt(v, "std");
        return e != null && e >= 0;
      });
      const std = evalInt(tk, "std");
      const ltr = evalInt(tk, "ltr");
      const nop = evalInt(tk, "noparen");
      assert(std != null && std >= 0, "整数の非負でない結果");
      const wrongs = [];
      if (ltr != null && ltr !== std) wrongs.push([ltr, "MC-ORDER-LTR"]);
      if (nop != null && nop !== std && tk.includes("(")) wrongs.push([nop, "MC-PAREN-IGNORE"]);
      wrongs.push([std + 1, "MC-SLIP"], [std - 2, "MC-SLIP"]);
      same(evalTokens(tk, "std"), std, "評価");
      return num({
        q: `次の計算をしなさい。\n$${texTokens(tk)}$`,
        ans: std,
        wrongs,
        explain: `計算の順序は、①かっこの中 ②かけ算・わり算 ③たし算・ひき算 です。${tk.includes("(") ? "かっこの中を先に計算し、" : ""}$\\times$ や $\\div$ を先にしてから、左から順に計算して $${std}$。`,
      });
    }),
  ],
};
