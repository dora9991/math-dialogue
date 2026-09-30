// ============================================================
// tpl/elem_num2.js — 小学校 数と計算（小数・分数）
//   dec_place / dec_add_sub / frac_meaning / frac_add_same / mult_factor / gcd_lcm /
//   dec_mul / dec_div / frac_reduce / frac_common / frac_add_unlike / frac_dec_convert /
//   frac_mul / frac_div / frac_mixed_calc
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, eq, cmp, toDecimalString, num as qnum } from "../../core/rational.js";
import { tq, tmixed, tfrac, comma } from "../../core/tex.js";
import { t, until, same, assert, byLv, gcd, lcm, dec, properNum, reduceNote } from "./util.js";
import { evalTokens, texTokens } from "./arith.js";

const D = (n, k) => Object.assign(Q(n, Math.pow(10, k)), { tex: toDecimalString(Q(n, Math.pow(10, k))) }); // 小数の演算数（TeXは小数表記）
const decStr = (q) => toDecimalString(q);
const fracTeX = (n, d) => `\\frac{${n}}{${d}}`;
const shuffleUnique = (r, arr) => r.shuffle([...new Set(arr)]);

/** 仮分数 n/d → 帯分数の {w, n, d}（n>d>0、約分済みの真分数部） */
function toMixed(n, d) {
  return { w: Math.floor(n / d), n: n % d, d };
}

export default {
  // ── 小数の位取り・大小 ─────────────────────────
  dec_place: [
    t("num", (r, lv) => {
      const k = lv === 1 ? 1 : lv === 2 ? 2 : 3;
      const unitStr = { 1: "0.1", 2: "0.01", 3: "0.001" }[k];
      const cnt = lv === 1 ? r.int(12, 89) : lv === 2 ? r.int(101, 899) : r.int(1001, 8999);
      const ans = Q(cnt, Math.pow(10, k));
      same(mul(Q(cnt), Q(1, Math.pow(10, k))), ans, "検算");
      return num({
        q: `$${unitStr}$ を $${cnt}$ こ集めた数を答えなさい。`,
        ans,
        wrongs: [[Q(cnt, Math.pow(10, k - 1)), "MC-DEC-POINT"], [Q(cnt, Math.pow(10, k + 1)), "MC-DEC-POINT"], [cnt, "MC-DEC-POINT"]],
        explain: `$${unitStr}$ は $1$ を ${Math.pow(10, k)} 等分した1こ分です。$${cnt}$ こ集めると、$${cnt}$ の小数点を左に ${k} つ動かして $${decStr(ans)}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 10倍・100倍・1/10・1/100
        const base = lv === 1 ? Q(r.int(12, 98), 10) : lv === 2 ? Q(r.int(101, 989), 100) : Q(r.int(1001, 9899), 1000);
        const ops = [
          { label: "10倍", f: Q(10), wrongDir: Q(1, 10) },
          { label: "100倍", f: Q(100), wrongDir: Q(1, 100) },
          { label: "$\\frac{1}{10}$", f: Q(1, 10), wrongDir: Q(10) },
          { label: "$\\frac{1}{100}$", f: Q(1, 100), wrongDir: Q(100) },
        ];
        const op = r.pick(ops.slice(0, lv === 1 ? 3 : 4));
        const ans = mul(base, op.f);
        return num({
          q: `$${decStr(base)}$ の ${op.label} はいくつですか。`,
          ans,
          wrongs: [
            [mul(base, op.wrongDir), "MC-DEC-POINT"], // 小数点を逆向きに動かした
            [mul(ans, 10), "MC-DEC-POINT"], // 動かしすぎた
            [div(ans, 10), "MC-DEC-POINT"], // 動かし足りない
          ],
          explain: `10倍すると小数点は右へ1つ、100倍すると右へ2つ動きます。$\\frac1{10}$ にすると左へ1つ、$\\frac1{100}$ にすると左へ2つ動きます。${op.label} なので $${decStr(ans)}$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "choice",
      (r, lv) => {
        // いちばん大きい数
        const nd = lv === 1 ? 1 : lv === 2 ? 2 : 3;
        const vals = until(
          () => {
            const base = r.int(1, 9);
            const arr = [];
            for (let i = 0; i < 4; i++) {
              const len = r.int(1, nd);
              const digits = Array.from({ length: len }, () => r.int(0, 9));
              arr.push(`${lv === 3 ? 0 : r.int(0, 2)}.${digits.join("")}`);
            }
            return [...new Set(arr)];
          },
          (a) => a.length === 4 && a.every((s) => !s.endsWith("0")),
        );
        const best = vals.slice().sort((a, b) => parseFloat(b) - parseFloat(a))[0];
        const longest = vals.slice().sort((a, b) => b.length - a.length || parseFloat(b) - parseFloat(a))[0];
        return choice({
          q: "次の4つの数のうち、いちばん大きい数はどれですか。",
          correct: `$${best}$`,
          wrongs: vals.filter((v) => v !== best).map((v) => [`$${v}$`, v === longest ? "MC-DEC-LONGER-BIGGER" : null]),
          explain: `小数の大小は、上の位から順に比べます。${vals
            .slice()
            .sort((a, b) => parseFloat(b) - parseFloat(a))
            .map((v) => `$${v}$`)
            .join(" > ")} なので、いちばん大きいのは $${best}$。けた数が多いだけでは大きくなりません。`,
        });
      },
      { id: "c" },
    ),
  ],

  // ── 小数のたし算・ひき算 ───────────────────────
  dec_add_sub: [
    t("num", (r, lv) => {
      const isAdd = r.chance(0.5);
      let da, db, A, B;
      if (lv === 1) {
        [da, db] = [1, 1];
        [A, B] = [r.int(12, 98), r.int(12, 98)];
      } else if (lv === 2) {
        [da, db] = r.chance(0.5) ? [1, 2] : [2, 1];
        A = da === 1 ? r.int(11, 99) : r.int(101, 989);
        B = db === 1 ? r.int(11, 99) : r.int(101, 989);
      } else {
        [da, db] = r.chance(0.5) ? [0, 2] : [2, 2];
        A = da === 0 ? r.int(2, 9) : r.int(101, 989);
        B = r.int(101, 989);
      }
      let a = Q(A, Math.pow(10, da));
      let b = Q(B, Math.pow(10, db));
      if (!isAdd && cmp(a, b) < 0) [a, b] = [b, a];
      if (!isAdd && cmp(a, b) === 0) a = add(a, Q(1, 10));
      const ans = isAdd ? add(a, b) : sub(a, b);
      same(isAdd ? sub(ans, b) : add(ans, b), a, "検算");
      // 小数点をそろえず、右をそろえて整数のように計算した誤り
      const sa = decStr(a).replace(".", "");
      const sb = decStr(b).replace(".", "");
      const md = Math.max((decStr(a).split(".")[1] || "").length, (decStr(b).split(".")[1] || "").length);
      const wrongInt = isAdd ? Number(sa) + Number(sb) : Math.abs(Number(sa) - Number(sb));
      const wrongs = [[Q(wrongInt, Math.pow(10, md)), "MC-DEC-ALIGN"], [add(ans, Q(1, 10)), "MC-SLIP"], [isAdd ? sub(ans, 1) : add(ans, 1), "MC-CARRY-FORGET"]];
      return num({
        q: `次の計算をしなさい。\n$${decStr(a)}${isAdd ? "+" : "-"}${decStr(b)}$`,
        ans,
        wrongs,
        explain: `小数点の位置をそろえて、位ごとに計算します。足りない位には 0 があると考えます（例：$5.3=5.30$）。答えは $${decStr(ans)}$。`,
      });
    }),
  ],

  // ── 分数の意味（仮分数・帯分数・大きさ） ─────────
  frac_meaning: [
    t("fields", (r, lv) => {
      const d = lv === 1 ? r.int(3, 5) : lv === 2 ? r.int(4, 9) : r.int(5, 12);
      const w = lv === 1 ? r.int(1, 2) : lv === 2 ? r.int(1, 4) : r.int(3, 9);
      const n = properNum(r, d);
      const top = w * d + n;
      return fields({
        q: `仮分数 $${fracTeX(top, d)}$ を帯分数になおしなさい。`,
        layout: "mixed",
        fields: [
          { id: "w", value: w },
          { id: "n", value: n },
          { id: "d", value: d },
        ],
        wrongs: [
          { values: { w: n, n: w, d }, mc: "MC-FRAC-MIXED-WRONG" },
          { values: { w, n: d - n, d }, mc: "MC-FRAC-MIXED-WRONG" },
          { values: { w: w + 1, n, d }, mc: "MC-FRAC-MIXED-WRONG" },
        ],
        explain: `分子 $${top}$ を分母 $${d}$ でわると、商が $${w}$、あまりが $${n}$。商が整数部分、あまりが分子になり、$${tmixed(Q(top, d))}$ です。（たしかめ：$${w}\\times ${d}+${n}=${top}$）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const d = lv === 1 ? r.int(3, 5) : lv === 2 ? r.int(4, 9) : r.int(5, 12);
        const w = lv === 1 ? r.int(1, 2) : lv === 2 ? r.int(2, 4) : r.int(3, 9);
        const n = properNum(r, d);
        const top = w * d + n;
        return num({
          q: `帯分数 $${w}${fracTeX(n, d)}$ を仮分数になおしなさい。`,
          ans: Q(top, d),
          wrongs: [[Q(w * 10 + n, d), "MC-FRAC-IMPROPER-WRONG"], [Q(w * n + d, d), "MC-FRAC-IMPROPER-WRONG"], [Q(w + n, d), "MC-FRAC-IMPROPER-WRONG"]],
          explain: `整数部分 $${w}$ を分母 $${d}$ の分数にすると $${fracTeX(w * d, d)}$。これに $${fracTeX(n, d)}$ をたして $${fracTeX(top, d)}$。（分母×整数＋分子 $=${d}\\times${w}+${n}=${top}$）`,
        });
      },
      { id: "b" },
    ),
    t(
      "choice",
      (r, lv) => {
        // 分数の大小（単位分数・同じ分子の分数）
        const top = lv === 1 ? 1 : r.int(2, 4);
        const dens = [r.int(top + 1, top + 3), r.int(top + 4, top + 6), r.int(top + 7, top + 10), r.int(top + 11, top + 15)];
        const items = dens.map((d) => ({ d, n: top }));
        const best = items[0]; // 分母がいちばん小さい
        const worst = items[3];
        return choice({
          q: `次の分数のうち、いちばん大きいものはどれですか。`,
          correct: `$${fracTeX(best.n, best.d)}$`,
          wrongs: items.slice(1).map((x) => [`$${fracTeX(x.n, x.d)}$`, x === worst ? "MC-FRAC-COMPARE-DEN" : null]),
          explain: `分子が同じとき、分母が小さいほど1つ分が大きいので、分数も大きくなります。$${fracTeX(best.n, best.d)}$ がいちばん大きい。`,
        });
      },
      { id: "c" },
    ),
  ],

  // ── 同分母分数のたし算・ひき算 ───────────────────
  frac_add_same: [
    t("num", (r, lv) => {
      const d = lv === 1 ? r.int(5, 9) : r.int(6, 13);
      const isAdd = lv === 1 ? true : r.chance(0.6);
      let a, b;
      if (isAdd) {
        if (lv === 1) [a, b] = until(() => [r.int(1, d - 2), r.int(1, d - 2)], ([x, y]) => x + y < d);
        else [a, b] = until(() => [r.int(2, d - 1), r.int(2, d - 1)], ([x, y]) => x + y > d);
      } else {
        [a, b] = until(() => [r.int(d + 1, 2 * d - 1), r.int(2, d - 1)], ([x, y]) => x > y);
      }
      const ans = isAdd ? Q(a + b, d) : Q(a - b, d);
      return num({
        q: `次の計算をしなさい。\n$${fracTeX(a, d)}${isAdd ? "+" : "-"}${fracTeX(b, d)}$`,
        ans,
        wrongs: [
          [Q(isAdd ? a + b : a - b, isAdd ? 2 * d : 1 + d), "MC-FRAC-ADD-BOTH"],
          [Q(isAdd ? a + b : a - b, d * d), "MC-FRAC-ADD-BOTH"],
        ],
        explain: `分母が同じときは、分母はそのままで、分子だけを${isAdd ? "たし" : "ひき"}ます。$${fracTeX(a, d)}${isAdd ? "+" : "-"}${fracTeX(b, d)}=${fracTeX(isAdd ? a + b : a - b, d)}$。${Math.abs(isAdd ? a + b : a - b) > d ? `帯分数になおすと $${tmixed(Q(isAdd ? a + b : a - b, d))}$。` : ""}`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        // 帯分数どうしのたし算（分母が同じ）。答えの分数部分は約分の必要がない形にする
        const v = until(
          () => {
            const d = r.int(5, 9);
            return { d, w1: r.int(1, 4), w2: r.int(1, 4), n1: properNum(r, d), n2: properNum(r, d) };
          },
          ({ d, n1, n2 }) => {
            const rem = (n1 + n2) % d;
            return rem > 0 && gcd(rem, d) === 1 && (lv === 1 ? n1 + n2 < d : n1 + n2 > d);
          },
        );
        const { d, w1, w2, n1, n2 } = v;
        const total = Q((w1 + w2) * d + n1 + n2, d);
        const m = toMixed(total.n, total.d);
        assert(m.d === d && m.n === (n1 + n2) % d, "帯分数の形");
        return fields({
          q: `次の計算をして、答えを帯分数で答えなさい。\n$${w1}${fracTeX(n1, d)}+${w2}${fracTeX(n2, d)}$`,
          layout: "mixed",
          fields: [
            { id: "w", value: m.w },
            { id: "n", value: m.n },
            { id: "d", value: m.d },
          ],
          wrongs: [{ values: { w: w1 + w2, n: n1 + n2, d }, mc: "MC-FRAC-CARRY-FORGET" }],
          explain: `整数部分どうし $${w1}+${w2}=${w1 + w2}$、分数部分どうし $${fracTeX(n1, d)}+${fracTeX(n2, d)}=${fracTeX(n1 + n2, d)}$。${n1 + n2 >= d ? `分数部分が1以上になったので、整数部分に1くり上げて` : ""}答えは $${tmixed(total)}$。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 倍数と約数 ─────────────────────────────────
  mult_factor: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const n = r.pick([12, 16, 18, 20, 24, 28, 30, 36]);
        const divs = Array.from({ length: n }, (_, i) => i + 1).filter((x) => n % x === 0);
        return num({
          q: `$${n}$ の約数は、全部で何こありますか。`,
          ans: divs.length,
          post: "こ",
          wrongs: [[divs.length - 1, "MC-COUNT-OFF"], [divs.length + 1, "MC-COUNT-OFF"], [divs.length - 2, "MC-COUNT-OFF"]],
          explain: `$${n}$ をわりきれる数を小さい順にさがします：${divs.map((x) => `$${x}$`).join("、")}。$1$ と $${n}$ 自身も約数に入れます。全部で ${divs.length} こ。`,
        });
      }
      if (lv === 2) {
        const k = r.int(3, 9);
        const lim = r.int(40, 99);
        const cnt = Math.floor(lim / k);
        return num({
          q: `$1$ から $${lim}$ までの整数のうち、$${k}$ の倍数は何こありますか。`,
          ans: cnt,
          post: "こ",
          wrongs: [[cnt + 1, "MC-COUNT-OFF"], [cnt - 1, "MC-COUNT-OFF"], [Math.round(lim / k) === cnt ? cnt + 2 : Math.round(lim / k), "MC-COUNT-OFF"]],
          explain: `$${k}$ の倍数は $${k},\\ ${2 * k},\\ ${3 * k},\\dots$ です。$${lim}\\div ${k}=${cnt}$ あまり $${lim % k}$ なので、$${cnt}$ こ目までが $${lim}$ 以下です。`,
        });
      }
      const [a, b] = r.pick([[3, 4], [4, 6], [6, 8], [5, 6], [4, 10], [3, 5], [6, 9], [4, 9], [5, 8], [3, 7], [6, 10], [8, 12], [7, 9], [9, 12], [4, 14], [6, 15]]);
      const l = lcm(a, b);
      const big = r.chance(0.5);
      const ans = big ? Math.floor(99 / l) * l : Math.ceil(10 / l) * l;
      return num({
        q: `$${a}$ でも $${b}$ でもわりきれる整数のうち、2けたで${big ? "最大" : "最小"}のものを答えなさい。`,
        ans,
        wrongs: [
          [big ? ans - l : ans + l, "MC-COUNT-OFF"],
          [big ? Math.floor(99 / a) * a : Math.ceil(10 / a) * a, "MC-GCD-LCM-CONFUSE"],
          [big ? Math.floor(99 / b) * b : Math.ceil(10 / b) * b, "MC-GCD-LCM-CONFUSE"],
        ],
        explain: `$${a}$ と $${b}$ の公倍数は、最小公倍数 $${l}$ の倍数です。$${l}$ の倍数のうち、2けたで${big ? "最大" : "最小"}のものは $${ans}$。`,
      });
    }),
    t(
      "choice",
      (r) => {
        const n = r.pick([18, 24, 30, 36, 40, 42, 48, 60]);
        const divs = Array.from({ length: n }, (_, i) => i + 1).filter((x) => n % x === 0);
        const nonDivs = Array.from({ length: n }, (_, i) => i + 1).filter((x) => n % x !== 0 && x > 1 && x < n);
        const bad = r.pick(nonDivs);
        const good = r.sample(divs.filter((x) => x > 1 && x < n), 3);
        return choice({
          q: `次のうち、$${n}$ の約数でない数はどれですか。`,
          correct: `$${bad}$`,
          wrongs: good.map((x) => [`$${x}$`, null]),
          explain: `$${n}$ を ${good.map((x) => `$${x}$`).join("・")} でわると、それぞれわりきれます。$${n}\\div ${bad}$ はわりきれないので、$${bad}$ は約数ではありません。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 最大公約数・最小公倍数 ───────────────────────
  gcd_lcm: [
    t("num", (r, lv) => {
      const g = lv === 1 ? r.int(2, 4) : r.int(3, 9);
      const [p, q] = until(() => [r.int(2, lv === 1 ? 6 : 12), r.int(2, lv === 1 ? 6 : 12)], ([x, y]) => x !== y && gcd(x, y) === 1);
      const [a, b] = [g * p, g * q];
      const isG = r.chance(0.5);
      const G = gcd(a, b);
      const L = lcm(a, b);
      assert(G * L === a * b, "gcd×lcm=積");
      if (lv === 3) {
        const c = r.pick([2, 3, 4, 6, 8, 9, 12].filter((x) => x !== a && x !== b));
        const L3 = lcm(L, c);
        const G3 = gcd(G, c);
        return num({
          q: `$${a}$、$${b}$、$${c}$ の${isG ? "最大公約数" : "最小公倍数"}を答えなさい。`,
          ans: isG ? G3 : L3,
          wrongs: [[isG ? L3 : G3, "MC-GCD-LCM-CONFUSE"], [a * b * c > 5000 ? L3 * 2 : a * b * c, "MC-GCD-PRODUCT"], [isG ? Math.max(1, G3 - 1) : L3 + c, "MC-SLIP"]],
          explain: isG ? `3つの数すべてをわりきる最大の数は $${G3}$。` : `3つの数すべての倍数になる最小の数は $${L3}$。まず $${a}$ と $${b}$ の最小公倍数 $${L}$ を求め、次に $${L}$ と $${c}$ の最小公倍数を求めます。`,
        });
      }
      return num({
        q: `$${a}$ と $${b}$ の${isG ? "最大公約数" : "最小公倍数"}を答えなさい。`,
        ans: isG ? G : L,
        wrongs: [[isG ? L : G, "MC-GCD-LCM-CONFUSE"], [a * b, "MC-GCD-PRODUCT"], [isG ? Math.max(1, G - 1) : L + G, "MC-SLIP"]],
        explain: isG
          ? `$${a}$ と $${b}$ の共通の約数のうち最大のものです。$${a}=${G}\\times ${a / G}$、$${b}=${G}\\times ${b / G}$ なので $${G}$。`
          : `$${a}$ と $${b}$ の共通の倍数のうち最小のものです。$${a}$ の倍数：$${a},\\ ${2 * a},\\ ${3 * a},\\dots$ のうち、$${b}$ でもわりきれる最小の数は $${L}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const g = r.int(2, lv === 1 ? 6 : 12);
        const [p, q] = until(() => [r.int(2, 8), r.int(2, 8)], ([x, y]) => x !== y && gcd(x, y) === 1);
        const [a, b] = [g * p, g * q];
        if (r.chance(0.5)) {
          return num({
            q: `たて $${a}$ cm、横 $${b}$ cm の長方形の紙を、すき間なく同じ大きさの正方形に切り分けます。正方形をできるだけ大きくするとき、1辺は何 cm ですか。`,
            ans: gcd(a, b),
            post: "cm",
            wrongs: [[lcm(a, b), "MC-GCD-LCM-CONFUSE"], [a * b, "MC-GCD-PRODUCT"], [gcd(a, b) * 2, "MC-SLIP"]],
            explain: `正方形の1辺の長さは、たての長さ $${a}$ と横の長さ $${b}$ の両方をわりきる数（公約数）でなければなりません。いちばん大きくするので最大公約数 $${gcd(a, b)}$ cm。`,
          });
        }
        return num({
          q: `バスAは $${a}$ 分おき、バスBは $${b}$ 分おきに駅を出発します。午前7時に同時に出発しました。次に同時に出発するのは何分後ですか。`,
          ans: lcm(a, b),
          post: "分後",
          wrongs: [[gcd(a, b), "MC-GCD-LCM-CONFUSE"], [a * b, "MC-GCD-PRODUCT"], [a + b, "MC-ADD-FOR-MUL"]],
          explain: `$${a}$ の倍数でも $${b}$ の倍数でもある最小の数、つまり最小公倍数を求めます。答えは $${lcm(a, b)}$ 分後。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 小数のかけ算 ───────────────────────────────
  dec_mul: [
    t("num", (r, lv) => {
      let A, da, B, db;
      if (lv === 1) [A, da, B, db] = [r.int(12, 98), 1, r.int(2, 9), 0];
      else if (lv === 2) [A, da, B, db] = [r.int(12, 98), 1, r.int(12, 98), 1];
      else [A, da, B, db] = r.chance(0.5) ? [r.int(101, 989), 2, r.int(12, 39), 1] : [r.int(12, 98), 3, r.int(12, 98), 1];
      const a = Q(A, Math.pow(10, da));
      const b = Q(B, Math.pow(10, db));
      const ans = mul(a, b);
      same(Q(A * B, Math.pow(10, da + db)), ans, "検算");
      const wrongs = [[Q(A * B, Math.pow(10, da + db - 1)), "MC-DEC-POINT"], [Q(A * B, Math.pow(10, da + db + 1)), "MC-DEC-POINT"], [Q(A * B, Math.pow(10, Math.max(da, db))), "MC-DEC-POINT"]];
      return num({
        q: `次の計算をしなさい。\n$${decStr(a)}\\times ${decStr(b)}$`,
        ans,
        wrongs,
        explain: `小数点を無視して整数のようにかけます：$${A}\\times ${B}=${A * B}$。かけられる数の小数点以下 ${da} けたと、かける数の ${db} けたを合わせて、答えは小数点以下 ${da + db} けた。$${decStr(ans)}$。`,
      });
    }),
  ],

  // ── 小数のわり算 ───────────────────────────────
  dec_div: [
    t("num", (r, lv) => {
      let divisor, quotient;
      if (lv === 1) {
        divisor = Q(r.int(2, 9), 1);
        quotient = Q(r.int(12, 89), 10);
      } else if (lv === 2) {
        divisor = Q(r.int(3, 9), 10);
        quotient = r.chance(0.5) ? Q(r.int(3, 30), 1) : Q(r.int(12, 89), 10);
      } else {
        divisor = r.chance(0.5) ? Q(r.int(12, 48), 100) : Q(r.int(12, 48), 10);
        quotient = r.pick([Q(5, 10), Q(6, 10), Q(15, 10), Q(25, 10), Q(4, 1), Q(12, 1), Q(2, 1), Q(35, 100)]);
      }
      const dividend = mul(divisor, quotient);
      same(div(dividend, divisor), quotient, "検算");
      const wrongs = [[mul(quotient, 10), "MC-DEC-POINT"], [div(quotient, 10), "MC-DEC-POINT"], [mul(quotient, 100), "MC-DEC-POINT"]];
      return num({
        q: `次の計算をしなさい。（わりきれます）\n$${decStr(dividend)}\\div ${decStr(divisor)}$`,
        ans: quotient,
        wrongs,
        explain: `わる数を整数にするため、わる数もわられる数も同じ数（$10$ 倍や $100$ 倍）をかけます。$${decStr(dividend)}\\div ${decStr(divisor)}$ は、両方を何倍かして整数どうしのわり算にすると答えが変わらず、$${decStr(quotient)}$。（たしかめ：$${decStr(divisor)}\\times ${decStr(quotient)}=${decStr(dividend)}$）`,
      });
    }),
  ],

  // ── 約分 ──────────────────────────────────────
  frac_reduce: [
    t("num", (r, lv) => {
      const g = lv === 1 ? r.int(2, 4) : lv === 2 ? r.int(4, 9) : r.int(6, 15);
      const [p, q] = until(() => [r.int(1, lv === 3 ? 12 : 8), r.int(2, lv === 3 ? 13 : 9)], ([x, y]) => gcd(x, y) === 1 && x !== y && y > 1);
      const n = g * p;
      const d = g * q;
      const ans = Q(n, d);
      assert(ans.n === p && ans.d === q, "既約");
      return num({
        q: `次の分数を約分しなさい。\n$${fracTeX(n, d)}$`,
        reduced: true,
        ans,
        wrongs: [
          [Q(p, d), "MC-FRAC-REDUCE-ONE-SIDE"],
          [Q(n, q), "MC-FRAC-REDUCE-ONE-SIDE"],
          [Q(Math.max(1, n - g), Math.max(2, d - g)), "MC-FRAC-SUBTRACT-BOTH"],
        ],
        explain: `分母と分子の最大公約数 $${g}$ で、両方をわります。$${fracTeX(n, d)}=\\dfrac{${n}\\div ${g}}{${d}\\div ${g}}=${fracTeX(p, q)}$。分母と分子に共通の約数が $1$ しかなくなったら約分は終わりです。`,
      });
    }),
    t(
      "choice",
      (r) => {
        const irr = until(() => [r.int(2, 30), r.int(5, 39)], ([n, d]) => n < d && gcd(n, d) === 1);
        const red = [];
        while (red.length < 3) {
          const g = r.int(2, 5);
          const [p, q] = until(() => [r.int(1, 9), r.int(2, 11)], ([x, y]) => x < y && gcd(x, y) === 1);
          const f = [g * p, g * q];
          if (f[1] < 45 && !red.some((x) => x[0] === f[0] && x[1] === f[1]) && !(f[0] === irr[0] && f[1] === irr[1])) red.push(f);
        }
        return choice({
          q: "次の分数のうち、これ以上約分できない（既約な）分数はどれですか。",
          correct: `$${fracTeX(irr[0], irr[1])}$`,
          wrongs: red.map((f) => [`$${fracTeX(f[0], f[1])}$`, null]),
          explain: `分母と分子の最大公約数が $1$ のとき、それ以上約分できません。$${fracTeX(irr[0], irr[1])}$ は共通の約数が $1$ だけです。ほかの3つは ${red.map((f) => `$${fracTeX(f[0], f[1])}$（$${gcd(f[0], f[1])}$ でわれる）`).join("、")}。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 通分・分数の大小 ───────────────────────────
  frac_common: [
    t("num", (r, lv) => {
      let b, d;
      if (lv === 1) [b, d] = r.pick([[4, 6], [6, 9], [4, 10], [6, 8], [10, 15], [8, 12]]);
      else if (lv === 2) [b, d] = until(() => [r.int(4, 15), r.int(4, 15)], ([x, y]) => x !== y && gcd(x, y) > 1);
      else [b, d] = until(() => [r.int(6, 24), r.int(6, 24)], ([x, y]) => x !== y && gcd(x, y) > 1 && lcm(x, y) > 30);
      const a = properNum(r, b);
      const c = properNum(r, d);
      const L = lcm(b, d);
      return num({
        q: `$${fracTeX(a, b)}$ と $${fracTeX(c, d)}$ を通分するとき、共通の分母のうち、いちばん小さいものを答えなさい。`,
        ans: L,
        wrongs: [[b * d, "MC-LCD-PRODUCT"], [gcd(b, d), "MC-GCD-LCM-CONFUSE"], [b + d, "MC-ADD-FOR-MUL"]],
        explain: `分母 $${b}$ と $${d}$ の最小公倍数が、いちばん小さい共通の分母です。$${b}$ の倍数と $${d}$ の倍数のうち最小の共通の数は $${L}$。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 4つの分数のうち最大のもの（分母がちがう）
        const fr = until(
          () => Array.from({ length: 4 }, () => [r.int(1, 8), r.int(3, lv === 1 ? 8 : 12)]),
          (v) => v.every(([n, d]) => n < d) && new Set(v.map(([n, d]) => n / d)).size === 4 && new Set(v.map(([, d]) => d)).size >= 3 && (() => {
            const s = v.map(([n, d]) => n / d).sort((x, y) => y - x);
            return s[0] - s[1] > 0.04;
          })(),
        );
        const vals = fr.map(([n, d]) => n / d);
        const bi = vals.indexOf(Math.max(...vals));
        const L = fr.reduce((acc, [, d]) => lcm(acc, d), 1);
        const maxNumIdx = fr.map(([n]) => n).indexOf(Math.max(...fr.map(([n]) => n)));
        const maxDenIdx = fr.map(([, d]) => d).indexOf(Math.max(...fr.map(([, d]) => d)));
        return choice({
          q: "次の4つの分数のうち、いちばん大きいものはどれですか。",
          correct: `$${fracTeX(fr[bi][0], fr[bi][1])}$`,
          wrongs: fr.map(([n, d], i) => [`$${fracTeX(n, d)}$`, i === bi ? null : i === maxNumIdx ? "MC-FRAC-COMPARE-NUM" : i === maxDenIdx ? "MC-FRAC-COMPARE-DEN" : null]),
          explain: `分母を最小公倍数 $${L}$ にそろえて（通分して）分子を比べます。${fr.map(([n, d]) => `$${fracTeX(n, d)}=${fracTeX((n * L) / d, L)}$`).join("、")}。よって $${fracTeX(fr[bi][0], fr[bi][1])}$ がいちばん大きい。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 異分母分数のたし算・ひき算 ───────────────────
  frac_add_unlike: [
    t("num", (r, lv) => {
      const isAdd = lv === 1 ? true : r.chance(0.5);
      const proper = (den) => until(() => r.int(1, den - 1), (x) => gcd(x, den) === 1);
      const gen = () => {
        let b, d;
        if (lv === 1) [b, d] = r.pick([[2, 4], [3, 6], [2, 6], [4, 8], [5, 10], [3, 9]]);
        else if (lv === 2) [b, d] = until(() => [r.int(3, 9), r.int(3, 9)], ([x, y]) => x !== y && gcd(x, y) === 1);
        else [b, d] = until(() => [r.int(4, 12), r.int(4, 12)], ([x, y]) => x !== y && gcd(x, y) > 1);
        return { a: proper(b), b, c: proper(d), d };
      };
      let v = until(gen, (x) => isAdd || cmp(Q(x.a, x.b), Q(x.c, x.d)) !== 0);
      if (!isAdd && cmp(Q(v.a, v.b), Q(v.c, v.d)) < 0) v = { a: v.c, b: v.d, c: v.a, d: v.b };
      const { a, b, c, d } = v;
      const f1 = Q(a, b);
      const f2 = Q(c, d);
      const ans = isAdd ? add(f1, f2) : sub(f1, f2);
      const L = lcm(b, d);
      const wrongs = [
        [isAdd ? Q(a + c, b + d) : Q(Math.abs(a - c) || 1, Math.abs(b - d) || 1), "MC-FRAC-ADD-BOTH"],
        [Q(isAdd ? a + c : Math.abs(a - c) || 1, L), "MC-FRAC-COMMON-NUM"],
        [Q(isAdd ? a + c : Math.abs(a - c) || 1, b * d), "MC-FRAC-COMMON-NUM"],
      ];
      const rawNum = isAdd ? (a * L) / b + (c * L) / d : (a * L) / b - (c * L) / d; // 通分後の分子（約分前）
      assert(eq(Q(rawNum, L), ans), "通分の検算");
      return num({
        q: `次の計算をしなさい。（答えは約分してください）\n$${fracTeX(a, b)}${isAdd ? "+" : "-"}${fracTeX(c, d)}$`,
        reduced: true,
        ans,
        wrongs,
        explain: `分母 $${b}$ と $${d}$ を、最小公倍数 $${L}$ にそろえて通分します。$${fracTeX(a, b)}=${fracTeX((a * L) / b, L)}$、$${fracTeX(c, d)}=${fracTeX((c * L) / d, L)}$。分子を${isAdd ? "たして" : "ひいて"} $${fracTeX(rawNum, L)}$。${reduceNote(rawNum, L, tq(ans))}`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        // 帯分数のたし算（異分母）。答えは帯分数（分数部分は約分済み・0でない）
        const v = until(
          () => {
            const [b, d] = [r.int(2, 6), r.int(2, 6)];
            return { b, d, w1: r.int(1, 4), w2: r.int(1, 3), n1: properNum(r, b), n2: properNum(r, d) };
          },
          (x) => {
            if (x.b === x.d) return false;
            const tot = add(Q(x.w1 * x.b + x.n1, x.b), Q(x.w2 * x.d + x.n2, x.d));
            return tot.n % tot.d !== 0;
          },
        );
        const { b, d, w1, w2, n1, n2 } = v;
        const total = add(Q(w1 * b + n1, b), Q(w2 * d + n2, d));
        const m = toMixed(total.n, total.d);
        return fields({
          q: `次の計算をして、答えを帯分数で答えなさい。（分数部分は約分すること）\n$${w1}${fracTeX(n1, b)}+${w2}${fracTeX(n2, d)}$`,
          layout: "mixed",
          fields: [
            { id: "w", value: m.w },
            { id: "n", value: m.n },
            { id: "d", value: m.d },
          ],
          wrongs: [{ values: { w: w1 + w2, n: n1 + n2, d: b + d }, mc: "MC-FRAC-ADD-BOTH" }],
          explain: `整数部分 $${w1}+${w2}=${w1 + w2}$。分数部分 $${fracTeX(n1, b)}+${fracTeX(n2, d)}$ を通分してたします。合わせて $${tmixed(total)}$。`,
        });
      },
      { id: "b", db: 0.3 },
    ),
  ],

  // ── 分数と小数の変換 ───────────────────────────
  frac_dec_convert: [
    t("num", (r, lv) => {
      const pairs = lv === 1 ? [[1, 2], [3, 4], [2, 5], [1, 4], [3, 5], [7, 10], [1, 5], [9, 10]] : lv === 2 ? [[3, 8], [7, 20], [9, 25], [5, 8], [13, 20], [7, 8], [11, 25], [3, 16]] : [[19, 8], [27, 20], [43, 25], [37, 16], [21, 8], [51, 40]];
      const [n, d] = r.pick(pairs);
      const ans = Q(n, d);
      const s = decStr(ans);
      assert(s, "有限小数");
      return num({
        q: `分数 $${fracTeX(n, d)}$ を小数で表しなさい。`,
        ans,
        wrongs: [[Q(n * 10 + d, 100), "MC-FRAC-DEC-CONCAT"], [Q(n * 10 + d, 10), "MC-FRAC-DEC-CONCAT"], [Q(n, d * 10), "MC-FRAC-DEC-CONCAT"]],
        explain: `分数は「分子÷分母」です。$${n}\\div ${d}=${s}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const cands = lv === 1 ? ["0.5", "0.25", "0.4", "0.75", "0.6", "0.8"] : lv === 2 ? ["0.35", "0.125", "0.28", "0.45", "0.06", "0.375"] : ["1.25", "2.4", "3.75", "1.12", "0.036", "2.625"];
        const s = r.pick(cands);
        const k = (s.split(".")[1] || "").length;
        const ans = Q(Math.round(Number(s) * Math.pow(10, k)), Math.pow(10, k));
        return num({
          q: `小数 $${s}$ を、これ以上約分できない分数で表しなさい。（整数をふくむときは仮分数で答えます）`,
          reduced: true,
          ans,
          wrongs: [[Q(Math.round(Number(s) * Math.pow(10, k)), Math.pow(10, k - 1) || 1), "MC-DEC-FRAC-PLACE"], [Q(Math.round(Number(s) * Math.pow(10, k)), Math.pow(10, k + 1)), "MC-DEC-FRAC-PLACE"]],
          explain: `$${s}$ は小数第 ${k} 位まであるので、分母を $${Math.pow(10, k)}$ とします。$${s}=${fracTeX(Math.round(Number(s) * Math.pow(10, k)), Math.pow(10, k))}$、約分して $${tq(ans)}$。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 分数のかけ算 ───────────────────────────────
  frac_mul: [
    t("num", (r, lv) => {
      const properQ = (dlo, dhi) => {
        const d = r.int(dlo, dhi);
        return Q(properNum(r, d), d);
      };
      let f1, f2;
      if (lv === 1) {
        f1 = properQ(3, 9);
        f2 = Q(r.int(2, 9), 1);
      } else if (lv === 2) {
        [f1, f2] = until(() => [properQ(3, 12), properQ(3, 12)], ([x, y]) => !eq(x, y));
      } else {
        // 帯分数（仮分数として扱う）どうし、または帯分数と真分数
        const mixedQ = () => {
          const d = r.int(3, 7);
          return Q(r.int(1, 3) * d + properNum(r, d), d);
        };
        f1 = mixedQ();
        f2 = r.chance(0.5) ? mixedQ() : properQ(3, 9);
      }
      const ans = mul(f1, f2);
      const T = (f) => (lv === 3 && f.n > f.d ? tmixed(f) : tq(f));
      const [a, b, c, d] = [f1.n, f1.d, f2.n, f2.d];
      return num({
        q: `次の計算をしなさい。（答えは約分してください）\n$${T(f1)}\\times ${T(f2)}$`,
        reduced: true,
        ans,
        wrongs: [
          [Q(a * c, b + d), "MC-FRAC-MUL-ADD-DEN"],
          [Q(a * c, b), "MC-FRAC-MUL-KEEP-DEN"],
          [Q(a * d + b * c, b * d), "MC-FRAC-MUL-ADD"],
        ],
        explain: `${lv === 3 ? "帯分数は先に仮分数になおします。" : ""}分数のかけ算は、分子どうし・分母どうしをかけます。$\\dfrac{${a}\\times ${c}}{${b}\\times ${d}}=${fracTeX(a * c, b * d)}$。${reduceNote(a * c, b * d, tq(ans))}途中で約分すると計算がらくです。`,
      });
    }),
  ],

  // ── 分数のわり算 ───────────────────────────────
  frac_div: [
    t("num", (r, lv) => {
      const properQ = (dlo, dhi) => {
        const d = r.int(dlo, dhi);
        return Q(properNum(r, d), d);
      };
      let f1, f2;
      if (lv === 1) {
        f1 = properQ(3, 9);
        f2 = Q(r.int(2, 6), 1);
      } else if (lv === 2) {
        [f1, f2] = until(() => [properQ(3, 11), properQ(3, 11)], ([x, y]) => !eq(x, y));
      } else {
        const mixedQ = () => {
          const d = r.int(3, 6);
          return Q(r.int(1, 3) * d + properNum(r, d), d);
        };
        f1 = r.chance(0.5) ? Q(r.int(2, 12), 1) : mixedQ();
        f2 = properQ(3, 10);
      }
      const ans = div(f1, f2);
      const [a, b, c, d] = [f1.n, f1.d, f2.n, f2.d];
      const T = (f) => (lv === 3 && f.n > f.d && f.d > 1 ? tmixed(f) : tq(f));
      return num({
        q: `次の計算をしなさい。（答えは約分してください）\n$${T(f1)}\\div ${T(f2)}$`,
        reduced: true,
        ans,
        wrongs: [
          [mul(f1, f2), "MC-FRAC-DIV-NO-INVERT"],
          [mul(Q(b, a), f2), "MC-FRAC-DIV-INVERT-WRONG"],
        ],
        explain: `${lv === 3 && f1.n > f1.d && f1.d > 1 ? "帯分数は先に仮分数になおします。" : ""}わる数の分母と分子を入れかえて（逆数にして）かけ算にします。$${tq(f1)}\\div ${tq(f2)}=${tq(f1)}\\times ${tq(div(1, f2))}=${tq(ans)}$。`,
      });
    }),
  ],

  // ── 分数・小数の混合計算 ───────────────────────
  frac_mixed_calc: [
    t("num", (r, lv) => {
      const isNonInt = (x) => x.d > 1;
      const build = () => {
        if (lv === 1) {
          const dq = r.pick([D(5, 1), D(25, 2), D(75, 2), D(2, 1), D(4, 1), D(6, 1), D(8, 1)]);
          const f = Q(r.int(1, 3), r.pick([2, 4, 5]));
          return r.chance(0.5) ? [dq, "+", f] : [f, "+", dq];
        }
        if (lv === 2) {
          const dq = r.pick([D(5, 1), D(25, 2), D(75, 2), D(6, 1), D(8, 1), D(4, 1)]);
          const f = Q(r.int(1, 5), r.pick([2, 3, 4, 5, 6, 8]));
          const g = Q(r.int(1, 3), r.pick([2, 3, 4, 5]));
          return r.chance(0.5) ? [dq, "×", f, "+", g] : [f, "+", dq, "×", g];
        }
        const dq = r.pick([D(25, 2), D(75, 2), D(5, 1), D(15, 1), D(125, 3)]);
        const f = Q(r.int(1, 5), r.pick([2, 3, 4, 5, 6]));
        const g = Q(r.int(1, 5), r.pick([2, 3, 4, 6]));
        return r.chance(0.5) ? ["(", f, "+", dq, ")", "÷", g] : [dq, "÷", g, "-", f, "×", Q(r.int(1, 2), r.pick([3, 4, 5]))];
      };
      const tk = until(build, (v) => {
        if (!v.filter((x) => typeof x === "object").every(isNonInt)) return false; // 「×1」のような自明な数を避ける
        const e = evalTokens(v, "std");
        return e && e.n > 0 && e.d <= 60 && Math.abs(e.n) < 400;
      });
      const ans = evalTokens(tk, "std");
      const ltr = evalTokens(tk, "ltr");
      const nop = evalTokens(tk, "noparen");
      const wrongs = [];
      if (ltr && !eq(ltr, ans) && ltr.n > 0) wrongs.push([ltr, "MC-ORDER-LTR"]);
      if (nop && !eq(nop, ans) && tk.includes("(") && nop.n > 0) wrongs.push([nop, "MC-PAREN-IGNORE"]);
      wrongs.push([add(ans, Q(1, 10)), "MC-SLIP"], [mul(ans, 2), "MC-SLIP"]);
      const conv = tk.filter((x) => typeof x === "object" && x.tex).map((x) => `$${x.tex}=${tq(x)}$`);
      return num({
        q: `次の計算をしなさい。（答えは約分した分数で答えます）\n$${texTokens(tk)}$`,
        reduced: true,
        ans,
        wrongs,
        explain: `小数を分数になおします${conv.length ? "：" + conv.join("、") : ""}。そのうえで、計算のきまり（かっこ → かけ算・わり算 → たし算・ひき算）の順に進めます。答えは $${tq(ans)}$。`,
      });
    }),
  ],
};
