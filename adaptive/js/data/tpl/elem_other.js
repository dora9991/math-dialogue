// ============================================================
// tpl/elem_other.js — 小学校 割合・比・速さ／図形／データ／□を使った式
//   unit_conv / avg_calc / unit_rate / percent_basic / percent_uses / percent_apps /
//   ratio_basic / ratio_split / speed_basic / prop_elem /
//   angle_basic / area_rect / polygon_angles / area_polygons / volume_cuboid / circle_elem /
//   prism_cyl / scale_figure / table_read / counting_elem / data_avg_median / blank_expr
// ============================================================
import { num, fields } from "../../core/items.js";
import { Q, add, mul, div, toDecimalString } from "../../core/rational.js";
import { tq, comma } from "../../core/tex.js";
import { t, until, assert, gcd, lcm, dec, NAMES } from "./util.js";

const decStr = (q) => toDecimalString(q) ?? tq(q);
const PI = Q(314, 100); // 円周率は 3.14 で計算する
const U = (s) => `\\mathrm{${s.replace("²", "^2").replace("³", "^3")}}`; // 単位のTeX

export default {
  // ── 単位の換算 ─────────────────────────────────
  unit_conv: [
    t("num", (r, lv) => {
      if (lv === 3) {
        // 面積・体積の単位
        const kinds = [
          { from: "m²", to: "cm²", f: 10000, vals: [1, 2, 3, 5, Q(5, 2), Q(3, 2), Q(1, 2)], wrong: 100 },
          { from: "km²", to: "m²", f: 1000000, vals: [1, 2, 3, Q(1, 2)], wrong: 1000 },
          { from: "cm²", to: "mm²", f: 100, vals: [2, 3, 5, Q(5, 2), Q(3, 2)], wrong: 10 },
          { from: "m³", to: "cm³", f: 1000000, vals: [1, 2, 3, Q(1, 2)], wrong: 100 },
          { from: "L", to: "cm³", f: 1000, vals: [2, 3, 5, Q(3, 2), Q(5, 2)], wrong: 100 },
        ];
        const k = r.pick(kinds);
        const v = r.pick(k.vals);
        const ans = mul(v, k.f);
        return num({
          q: `$${decStr(Q(typeof v === "number" ? v : v.n, typeof v === "number" ? 1 : v.d))}\\,${U(k.from)}$ は何 $${U(k.to)}$ ですか。`,
          ans,
          wrongs: [[mul(v, k.wrong), "MC-UNIT-AREA-LINEAR"], [mul(ans, 10), "MC-UNIT-POWER"], [div(ans, 10), "MC-UNIT-POWER"]],
          explain: `${k.from === "L" ? "$1\\,\\mathrm{L}=1000\\,\\mathrm{cm}^3$ です。" : "長さの関係（たとえば $1\\,\\mathrm{m}=100\\,\\mathrm{cm}$）を面積は2回、体積は3回かけ合わせます。"}$1\\,${U(k.from)}=${comma(k.f)}\\,${U(k.to)}$ なので、答えは $${decStr(ans)}$。`,
        });
      }
      const table = [
        { from: "km", to: "m", f: 1000 },
        { from: "m", to: "cm", f: 100 },
        { from: "cm", to: "mm", f: 10 },
        { from: "kg", to: "g", f: 1000 },
        { from: "t", to: "kg", f: 1000 },
        { from: "L", to: "mL", f: 1000 },
        { from: "L", to: "dL", f: 10 },
      ];
      const u = r.pick(table);
      if (lv === 2) {
        // 複名数：3 m 45 cm = □ cm
        const a = r.int(2, 9);
        const b = r.int(2, Math.min(99, u.f - 1));
        const ans = a * u.f + b;
        return num({
          q: `$${a}\\,${U(u.from)}\\ ${b}\\,${U(u.to)}$ は何 $${U(u.to)}$ ですか。`,
          ans,
          wrongs: [[a * 10 + b, "MC-UNIT-POWER"], [a * u.f * 10 + b, "MC-UNIT-POWER"], [a + b, "MC-UNIT-POWER"]],
          explain: `$1\\,${U(u.from)}=${u.f}\\,${U(u.to)}$ なので、$${a}\\,${U(u.from)}=${a * u.f}\\,${U(u.to)}$。あと $${b}\\,${U(u.to)}$ をたして $${ans}$。`,
        });
      }
      if (r.chance(0.5)) {
        const v = r.pick([Q(r.int(2, 9), 1), Q(r.int(11, 49), 10), Q(r.int(101, 299), 100)]);
        const ans = mul(v, u.f);
        return num({
          q: `$${decStr(v)}\\,${U(u.from)}$ は何 $${U(u.to)}$ ですか。`,
          ans,
          wrongs: [[mul(ans, 10), "MC-UNIT-POWER"], [div(ans, 10), "MC-UNIT-POWER"], [div(v, u.f), "MC-UNIT-DIRECTION"]],
          explain: `$1\\,${U(u.from)}=${u.f}\\,${U(u.to)}$ なので、$${decStr(v)}\\times ${u.f}=${decStr(ans)}$。`,
        });
      }
      const k = r.int(2, 9) * u.f + (r.chance(0.5) ? 0 : r.int(1, 9) * (u.f / 10));
      const ans = Q(k, u.f);
      return num({
        q: `$${comma(k)}\\,${U(u.to)}$ は何 $${U(u.from)}$ ですか。`,
        ans,
        wrongs: [[mul(ans, 10), "MC-UNIT-POWER"], [div(ans, 10), "MC-UNIT-POWER"], [mul(Q(k), u.f), "MC-UNIT-DIRECTION"]],
        explain: `$1\\,${U(u.from)}=${u.f}\\,${U(u.to)}$ なので、$${comma(k)}\\div ${u.f}=${decStr(ans)}$。`,
      });
    }),
  ],

  // ── 平均 ───────────────────────────────────────
  avg_calc: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const n = r.pick([3, 4, 5]);
        const avg = r.int(40, 90);
        const list = until(
          () => Array.from({ length: n - 1 }, () => avg + r.int(-15, 15)),
          (v) => new Set(v).size >= n - 2,
        );
        list.push(avg * n - list.reduce((a, b) => a + b, 0));
        const shown = r.shuffle(list);
        return num({
          q: `${n}回のテストの点数は ${shown.join("点、")}点でした。平均は何点ですか。`,
          ans: avg,
          post: "点",
          wrongs: [[Q(avg * n, n - 1), "MC-AVG-COUNT"], [Q(avg * n, n + 1), "MC-AVG-COUNT"], [avg * n, "MC-AVG-COUNT"]],
          explain: `平均 ＝ 合計 ÷ 個数 です。合計は $${shown.join("+")}=${avg * n}$、個数は $${n}$ なので $${avg * n}\\div ${n}=${avg}$。`,
        });
      }
      if (lv === 2) {
        const n = r.int(3, 5);
        const a1 = r.int(60, 80);
        const a2 = a1 + r.int(1, 4);
        const need = (n + 1) * a2 - n * a1;
        return num({
          q: `${n}回のテストの平均は ${a1} 点でした。あと1回テストを受けて、${n + 1}回の平均を ${a2} 点にするには、${n + 1}回目に何点とればよいですか。`,
          ans: need,
          post: "点",
          wrongs: [[a2, "MC-AVG-MISSING"], [a2 + (a2 - a1), "MC-AVG-MISSING"], [(n + 1) * a2, "MC-AVG-MISSING"]],
          explain: `${n + 1}回の合計は $${a2}\\times ${n + 1}=${(n + 1) * a2}$、はじめの${n}回の合計は $${a1}\\times ${n}=${n * a1}$。その差が${n + 1}回目の点数で $${need}$。`,
        });
      }
      const [n1, n2] = [r.pick([10, 12, 15, 20]), r.pick([5, 8, 10])];
      const a1 = r.int(50, 70);
      const a2 = a1 + r.int(2, 12);
      const total = n1 * a1 + n2 * a2;
      const tn = n1 + n2;
      const avg = Q(total, tn);
      return num({
        q: `Aグループ ${n1} 人の平均は ${a1} 点、Bグループ ${n2} 人の平均は ${a2} 点でした。全体 ${tn} 人の平均は何点ですか。`,
        ans: avg,
        post: "点",
        wrongs: [[Q(a1 + a2, 2), "MC-AVG-OF-AVG"], [Q(total, tn + 1), "MC-AVG-COUNT"], [Q(total, 2), "MC-AVG-COUNT"]],
        explain: `2つの平均をそのまま平均してはいけません。合計点はそれぞれ $${a1}\\times ${n1}=${a1 * n1}$、$${a2}\\times ${n2}=${a2 * n2}$。全体の合計 $${total}$ を人数 $${tn}$ でわって $${decStr(avg)}$。`,
      });
    }),
  ],

  // ── 単位量あたりの大きさ ───────────────────────
  unit_rate: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const area = r.int(4, 30);
        const den = r.int(20, 90);
        return num({
          q: `面積が $${area}\\,\\mathrm{km}^2$ の町に $${comma(area * den)}$ 人が住んでいます。$1\\,\\mathrm{km}^2$ あたりの人口（人口密度）は何人ですか。`,
          ans: den,
          post: "人",
          wrongs: [[Q(area, den), "MC-UNIT-RATE-INVERT"], [area * den * area, "MC-UNIT-RATE-INVERT"], [den + area, "MC-UNIT-RATE-INVERT"]],
          explain: `人口 ÷ 面積 で、$1\\,\\mathrm{km}^2$ あたりの人数を求めます。$${comma(area * den)}\\div ${area}=${den}$。`,
        });
      }
      if (lv === 2) {
        const per = Q(r.int(11, 39), 2); // 1あたり 5.5 〜 19.5
        const amt = r.pick([4, 6, 8, 10, 12]);
        const ans = mul(per, amt);
        return num({
          q: `ある車は、ガソリン $1\\,\\mathrm{L}$ あたり $${decStr(per)}\\,\\mathrm{km}$ 走ります。ガソリン $${amt}\\,\\mathrm{L}$ では何 $\\mathrm{km}$ 走れますか。`,
          ans,
          post: "km",
          wrongs: [[div(per, amt), "MC-UNIT-RATE-INVERT"], [add(per, amt), "MC-ADD-FOR-MUL"], [div(amt, per), "MC-UNIT-RATE-INVERT"]],
          explain: `1あたりの量 × いくつ分 で求めます。$${decStr(per)}\\times ${amt}=${decStr(ans)}$。`,
        });
      }
      const per = Q(r.int(3, 19), 2); // 1 m あたり 1.5〜9.5 kg
      const len1 = r.pick([2, 4, 6, 8]);
      const w1 = mul(per, len1);
      const target = r.pick([10, 12, 15, 20]);
      const ans = mul(per, target);
      return num({
        q: `同じ種類のロープが、$${len1}\\,\\mathrm{m}$ で $${decStr(w1)}\\,\\mathrm{kg}$ あります。このロープ $${target}\\,\\mathrm{m}$ の重さは何 $\\mathrm{kg}$ ですか。`,
        ans,
        post: "kg",
        wrongs: [[mul(w1, target), "MC-UNIT-RATE-INVERT"], [div(target, per), "MC-UNIT-RATE-INVERT"], [mul(len1, target), "MC-UNIT-RATE-INVERT"]],
        explain: `まず $1\\,\\mathrm{m}$ あたりの重さを求めます。$${decStr(w1)}\\div ${len1}=${decStr(per)}$ $\\mathrm{kg}$。$${target}\\,\\mathrm{m}$ では $${decStr(per)}\\times ${target}=${decStr(ans)}$（$\\mathrm{kg}$）。`,
      });
    }),
  ],

  // ── 割合・百分率・歩合 ─────────────────────────
  percent_basic: [
    t("num", (r, lv) => {
      const { pct, base, part } = until(
        () => {
          const pct = lv === 1 ? r.pick([5, 10, 20, 25, 40, 50, 60, 75, 80]) : lv === 2 ? r.pick([12, 15, 35, 45, 48, 64, 72, 85]) : r.pick([12.5, 17.5, 37.5, 62.5, 7.5, 2.5, 87.5]);
          const base = lv === 3 ? r.pick([40, 80, 200, 400, 800]) : r.pick([20, 40, 50, 80, 100, 200, 250, 500]);
          return { pct, base, part: (pct * base) / 100 };
        },
        (v) => Number.isInteger(v.part),
      );
      return num({
        q: `${base}人のうち ${part}人がバスで通学しています。バス通学の人の割合は、全体の何%ですか。`,
        ans: Q(Math.round(pct * 10), 10),
        post: "%",
        wrongs: [[Q(Math.round((part / base) * 1000), 1000), "MC-PERCENT-NO-100"], [Q(Math.round((base / part) * 1000), 10), "MC-PERCENT-INVERT"], [Q(Math.round(pct * 100), 10), "MC-PERCENT-POWER"]],
        explain: `割合 ＝ 比べる量 ÷ もとにする量 です。$${part}\\div ${base}=${dec(part / base)}$。百分率にするには $100$ をかけて $${dec(pct)}\\%$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 小数の割合 ⇔ 百分率 ⇔ 歩合
        if (lv === 1) {
          const pct = r.pick([10, 20, 30, 40, 50, 60, 70, 25, 75, 80]);
          if (r.chance(0.5)) return num({ q: `百分率 $${pct}\\%$ を、小数で表される割合にしなさい。`, ans: Q(pct, 100), wrongs: [[Q(pct, 10), "MC-PERCENT-POWER"], [Q(pct, 1000), "MC-PERCENT-POWER"], [pct, "MC-PERCENT-POWER"]], explain: `$1\\%=0.01$ なので、$${pct}\\%=${dec(pct / 100)}$。` });
          return num({ q: `割合 $${dec(pct / 100)}$ を、百分率で表しなさい。`, post: "%", ans: pct, wrongs: [[Q(pct, 10), "MC-PERCENT-POWER"], [pct * 10, "MC-PERCENT-POWER"], [Q(pct, 100), "MC-PERCENT-NO-100"]], explain: `$0.01=1\\%$ なので、$${dec(pct / 100)}=${pct}\\%$。` });
        }
        if (lv === 2) {
          const wari = r.int(1, 9);
          const bu = r.int(1, 9);
          const rate = wari * 10 + bu; // 3割5分 = 35%
          return num({
            q: `歩合で「${wari}割${bu}分」は、百分率で何%ですか。`,
            post: "%",
            ans: rate,
            wrongs: [[wari * 10 + bu * 10, "MC-PERCENT-WARI"], [wari + bu, "MC-PERCENT-WARI"], [Q(rate, 10), "MC-PERCENT-WARI"]],
            explain: `歩合は 1割＝10%、1分＝1% です。${wari}割 ${bu}分 ＝ $${wari * 10}+${bu}=${rate}\\%$。`,
          });
        }
        const pct = r.pick([12.5, 37.5, 62.5, 87.5, 7.5, 2.5, 0.5, 33.5]);
        return num({
          q: `百分率 $${dec(pct)}\\%$ を、小数で表される割合にしなさい。`,
          ans: Q(Math.round(pct * 10), 1000),
          wrongs: [[Q(Math.round(pct * 10), 100), "MC-PERCENT-POWER"], [Q(Math.round(pct * 10), 10000), "MC-PERCENT-POWER"], [Q(Math.round(pct * 10), 10), "MC-PERCENT-POWER"]],
          explain: `$1\\%=0.01$ なので、$${dec(pct)}\\%=${dec(pct)}\\times 0.01=${dec(pct / 100)}$。小数点を左へ2つ動かします。`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],

  // ── 割合の3用法 ────────────────────────────────
  percent_uses: [
    t("num", (r, lv) => {
      const mode = lv === 1 ? "part" : lv === 2 ? "base" : r.pick(["base", "part"]);
      const { pct, base, part } = until(
        () => {
          const pct = lv === 3 ? r.pick([15, 35, 45, 12.5, 32.5]) : r.pick([10, 20, 30, 40, 25, 60, 15]);
          const base = lv === 3 ? r.pick([80, 120, 160, 240, 400]) : r.pick([100, 200, 300, 400, 500, 600, 250, 150]);
          return { pct, base, part: (base * pct) / 100 };
        },
        (v) => Number.isInteger(v.part * 2),
      );
      if (mode === "part") {
        return num({
          q: `定員 ${base} 人の会場に、定員の $${dec(pct)}\\%$ の人が来ました。何人来ましたか。`,
          ans: Q(Math.round(part * 2), 2),
          post: "人",
          wrongs: [[Q(Math.round((base / pct) * 100), 100), "MC-PERCENT-USES-CONFUSE"], [base * pct, "MC-PERCENT-POWER"], [Q(Math.round(part * 20), 2), "MC-PERCENT-POWER"]],
          explain: `比べる量 ＝ もとにする量 × 割合。$${base}\\times ${dec(pct / 100)}=${dec(part)}$。`,
        });
      }
      return num({
        q: `ある本の $${dec(pct)}\\%$ にあたるページ数が ${dec(part)} ページです。この本は全部で何ページですか。`,
        ans: base,
        post: "ページ",
        wrongs: [[Q(Math.round(part * pct), 100), "MC-PERCENT-USES-CONFUSE"], [Q(Math.round(part + pct), 1), "MC-PERCENT-USES-CONFUSE"], [Q(Math.round((part / pct) * 100), 100), "MC-PERCENT-POWER"]],
        explain: `もとにする量 ＝ 比べる量 ÷ 割合。$${dec(part)}\\div ${dec(pct / 100)}=${base}$。（たしかめ：$${base}\\times ${dec(pct / 100)}=${dec(part)}$）`,
      });
    }),
  ],

  // ── 割合の利用（割引・増減・濃度） ───────────────
  percent_apps: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const price = r.pick([1200, 1500, 2000, 2400, 3000, 4000, 800]);
        const off = r.pick([10, 20, 25, 30, 40]);
        const ans = (price * (100 - off)) / 100;
        return num({
          q: `定価 ${comma(price)} 円の品物を、定価の $${off}\\%$ 引きで買いました。代金は何円ですか。`,
          ans,
          post: "円",
          wrongs: [[(price * off) / 100, "MC-PERCENT-BASE"], [price - off, "MC-PERCENT-BASE"], [(price * (100 + off)) / 100, "MC-PERCENT-BASE"]],
          explain: `$${off}\\%$ 引きは、定価の $${100 - off}\\%$ で買うということです。$${comma(price)}\\times ${dec((100 - off) / 100)}=${comma(ans)}$（円）。`,
        });
      }
      if (lv === 2) {
        const v = until(
          () => ({ cost: r.pick([400, 500, 600, 800, 1000, 1200]), up: r.pick([20, 25, 30, 40, 50]), dn: r.pick([10, 20]) }),
          ({ cost, up, dn }) => Number.isInteger((cost * (100 + up)) / 100) && Number.isInteger((((cost * (100 + up)) / 100) * (100 - dn)) / 100),
        );
        const { cost, up, dn } = v;
        const list = (cost * (100 + up)) / 100;
        const sale = (list * (100 - dn)) / 100;
        return num({
          q: `原価 ${comma(cost)} 円の品物に、原価の $${up}\\%$ の利益を見こんで定価をつけました。その定価の $${dn}\\%$ 引きで売ると、売り値は何円ですか。`,
          ans: sale,
          post: "円",
          wrongs: [[(cost * (100 + up - dn)) / 100, "MC-PERCENT-BASE"], [list, "MC-PERCENT-BASE"], [(cost * (100 - dn)) / 100, "MC-PERCENT-BASE"]],
          explain: `定価は $${comma(cost)}\\times ${dec((100 + up) / 100)}=${comma(list)}$（円）。その $${dn}\\%$ 引きなので $${comma(list)}\\times ${dec((100 - dn) / 100)}=${comma(sale)}$（円）。「$${up}\\%$ 増し」と「$${dn}\\%$ 引き」は、もとにする量がちがうので、たし引きできません。`,
        });
      }
      const [w1, p1, w2, p2] = r.pick([[200, 6, 100, 12], [300, 4, 100, 8], [150, 10, 50, 20], [400, 5, 200, 8], [120, 15, 80, 10], [250, 8, 250, 12], [100, 3, 300, 7], [500, 2, 250, 5], [80, 10, 120, 15], [180, 5, 120, 10]]);
      const salt = (w1 * p1 + w2 * p2) / 100;
      const conc = Q(Math.round(((w1 * p1 + w2 * p2) / (w1 + w2)) * 100), 100);
      return num({
        q: `$${p1}\\%$ の食塩水 ${w1} g と、$${p2}\\%$ の食塩水 ${w2} g を混ぜると、何%の食塩水になりますか。`,
        ans: conc,
        post: "%",
        wrongs: [[Q(p1 + p2, 2), "MC-CONC-AVG"], [Q(Math.round(salt * 100), 100), "MC-CONC-AVG"], [Q(p1 + p2, 1), "MC-CONC-AVG"]],
        explain: `食塩の重さは $${w1}\\times ${dec(p1 / 100)}=${dec((w1 * p1) / 100)}$ g と $${w2}\\times ${dec(p2 / 100)}=${dec((w2 * p2) / 100)}$ g で、合わせて $${dec(salt)}$ g。食塩水は全部で $${w1 + w2}$ g なので、濃度は $${dec(salt)}\\div ${w1 + w2}$、つまり $${decStr(conc)}\\%$。2つの濃度をそのまま平均してはいけません。`,
      });
    }),
  ],

  // ── 比の意味・等しい比 ─────────────────────────
  ratio_basic: [
    t("num", (r, lv) => {
      const [p, q] = until(() => [r.int(1, 9), r.int(2, 9)], ([x, y]) => x !== y && gcd(x, y) === 1);
      const k = lv === 1 ? r.int(2, 5) : r.int(3, 9);
      if (lv <= 2) {
        return r.chance(0.5)
          ? num({
              q: `$${p}:${q}=${p * k}:\\square$ にあてはまる数を答えなさい。`,
              ans: q * k,
              wrongs: [[q + (p * k - p), "MC-RATIO-ADD-SAME"], [q * p, "MC-RATIO-ADD-SAME"], [p * k, "MC-RATIO-ADD-SAME"]],
              explain: `比の両方に同じ数をかけても比は等しくなります。$${p}\\times ${k}=${p * k}$ なので、$${q}$ も $${k}$ 倍して $${q * k}$。`,
            })
          : num({
              q: `$${p * k}:${q * k}=${p}:\\square$ にあてはまる数を答えなさい。`,
              ans: q,
              wrongs: [[q * k - (p * k - p), "MC-RATIO-ADD-SAME"], [q * k, "MC-RATIO-ADD-SAME"], [q + 1, "MC-SLIP"]],
              explain: `比の両方を同じ数でわっても比は等しくなります。$${p * k}\\div ${k}=${p}$ なので、$${q * k}$ も $${k}$ でわって $${q}$。`,
            });
      }
      const [a, b] = [p * k, q * k];
      return num({
        q: `$${a}:${b}=${p * (k + 1)}:\\square$ にあてはまる数を答えなさい。`,
        ans: q * (k + 1),
        wrongs: [[b + (p * (k + 1) - a), "MC-RATIO-ADD-SAME"], [q * (k + 1) - 1, "MC-SLIP"], [q * k, "MC-RATIO-ADD-SAME"]],
        explain: `まず $${a}:${b}$ を簡単にします：$${a}:${b}=${p}:${q}$。これを $${k + 1}$ 倍して $${p * (k + 1)}:${q * (k + 1)}$ なので、□ は $${q * (k + 1)}$。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        const one = (a, b, text, expl) => {
          const g = gcd(a, b);
          const [p, q] = [a / g, b / g];
          const factor = p * 2 === a ? 2 : 2; // 途中まで約分した形の誤答
          return fields({
            q: `次の比を、もっとも簡単な整数の比にしなさい。\n${text}`,
            layout: "inline",
            fields: [
              { id: "a", value: p },
              { id: "b", value: q, pre: ":" },
            ],
            wrongs: [{ values: { a: p * factor, b: q * factor }, mc: "MC-RATIO-NOT-REDUCED" }],
            explain: `${expl}答えは $${p}:${q}$。これ以上われない（最大公約数が $1$）ので、これが答えです。`,
          });
        };
        const [p, q] = until(() => [r.int(1, 9), r.int(2, 9)], ([x, y]) => x !== y && gcd(x, y) === 1);
        const g = r.int(2, 7);
        if (lv === 1) return one(p * g, q * g, `$${p * g}:${q * g}$`, `$${p * g}$ と $${q * g}$ の最大公約数 $${g}$ でわります。`);
        if (lv === 2) return one(p * g, q * g, `$${decStr(Q(p * g, 10))}:${decStr(Q(q * g, 10))}$`, `小数の比は、両方を $10$ 倍して整数にし（$${p * g}:${q * g}$）、最大公約数 $${g}$ でわります。`);
        const { d1, d2, ra, rb } = until(
          () => {
            const [d1, d2] = [r.int(2, 5), r.int(2, 5)];
            const L = lcm(d1, d2);
            return { d1, d2, ra: (p * L) / d1, rb: (q * L) / d2, L };
          },
          (v) => Number.isInteger(v.ra) && Number.isInteger(v.rb),
        );
        const gg = gcd(ra, rb);
        return fields({
          q: `次の比を、もっとも簡単な整数の比にしなさい。\n$\\dfrac{${p}}{${d1}}:\\dfrac{${q}}{${d2}}$`,
          layout: "inline",
          fields: [
            { id: "a", value: ra / gg },
            { id: "b", value: rb / gg, pre: ":" },
          ],
          wrongs: [{ values: { a: ra, b: rb }, mc: "MC-RATIO-NOT-REDUCED" }, { values: { a: p, b: q }, mc: "MC-RATIO-FRAC-IGNORE" }],
          explain: `分母の最小公倍数 $${lcm(d1, d2)}$ を両方にかけて整数の比にします：$${ra}:${rb}$。さらに最大公約数 $${gg}$ でわって $${ra / gg}:${rb / gg}$。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 比の配分 ───────────────────────────────────
  ratio_split: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const [p, q] = until(() => [r.int(1, 5), r.int(2, 7)], ([x, y]) => x !== y);
        const k = r.int(20, 90);
        const total = (p + q) * k;
        const big = Math.max(p, q);
        return num({
          q: `${total} 円を、姉と妹で $${p}:${q}$ に分けます。${p > q ? "姉" : "妹"}の分は何円ですか。`,
          ans: big * k,
          post: "円",
          wrongs: [[Q(total, big), "MC-RATIO-SPLIT-WRONG"], [Math.min(p, q) * k, "MC-RATIO-SPLIT-WRONG"], [Q(total, 2), "MC-RATIO-SPLIT-WRONG"]],
          explain: `比の数の合計は $${p}+${q}=${p + q}$。全体を $${p + q}$ 等分した1つ分は $${total}\\div ${p + q}=${k}$ 円。大きい方は $${big}$ つ分なので $${k}\\times ${big}=${big * k}$ 円。`,
        });
      }
      if (lv === 2) {
        const [a, b, c] = r.pick([[3, 4, 5], [2, 3, 5], [1, 2, 3], [2, 5, 3], [4, 3, 1]]);
        const k = r.int(10, 60);
        const total = (a + b + c) * k;
        const target = r.pick(["最も多い", "最も少ない"]);
        const v = target === "最も多い" ? Math.max(a, b, c) : Math.min(a, b, c);
        return num({
          q: `${total} 個のあめを、3人で $${a}:${b}:${c}$ に分けます。${target}人は何個もらいますか。`,
          ans: v * k,
          post: "個",
          wrongs: [[Q(total, v), "MC-RATIO-SPLIT-WRONG"], [Q(total, 3), "MC-RATIO-SPLIT-WRONG"], [(target === "最も多い" ? Math.min(a, b, c) : Math.max(a, b, c)) * k, "MC-RATIO-SPLIT-WRONG"]],
          explain: `合計 $${a}+${b}+${c}=${a + b + c}$ で、1つ分は $${total}\\div ${a + b + c}=${k}$ 個。${target}人は $${v}$ つ分なので $${v * k}$ 個。`,
        });
      }
      const [p, q] = until(() => [r.int(3, 9), r.int(2, 8)], ([x, y]) => x > y && gcd(x, y) === 1);
      const k = r.int(3, 12);
      const diff = (p - q) * k;
      return num({
        q: `兄と弟のもっている本の数の比は $${p}:${q}$ で、兄は弟より ${diff} さつ多くもっています。兄は何さつもっていますか。`,
        ans: p * k,
        post: "さつ",
        wrongs: [[q * k, "MC-RATIO-SPLIT-WRONG"], [diff * p, "MC-RATIO-SPLIT-WRONG"], [(p + q) * k, "MC-RATIO-SPLIT-WRONG"]],
        explain: `比の差 $${p}-${q}=${p - q}$ が ${diff} さつにあたるので、1つ分は $${diff}\\div ${p - q}=${k}$ さつ。兄は $${p}$ つ分で $${p * k}$ さつ。`,
      });
    }),
  ],

  // ── 速さ・時間・道のり ─────────────────────────
  speed_basic: [
    t("num", (r, lv) => {
      if (lv === 1) {
        if (r.chance(0.5)) {
          const v = r.pick([40, 45, 50, 60, 72, 80]);
          const h = r.pick([2, 3, 2.5, 1.5, 4]);
          return num({
            q: `時速 $${v}\\,\\mathrm{km}$ で $${h}$ 時間走ると、何 $\\mathrm{km}$ 進みますか。`,
            ans: Q(Math.round(v * h * 10), 10),
            post: "km",
            wrongs: [[Q(Math.round((v / h) * 100), 100), "MC-SPEED-FORMULA"], [Q(v * 10 + Math.round(h * 10), 10), "MC-SPEED-FORMULA"], [Math.round(v * h * 10), "MC-SPEED-UNIT"]],
            explain: `道のり ＝ 速さ × 時間 です。$${v}\\times ${h}=${dec(v * h)}$（km）。`,
          });
        }
        const v = r.pick([60, 70, 80, 90, 75]);
        const m = r.pick([8, 12, 15, 20, 25]);
        return num({
          q: `分速 $${v}\\,\\mathrm{m}$ で $${m}$ 分歩くと、何 $\\mathrm{m}$ 進みますか。`,
          ans: v * m,
          post: "m",
          wrongs: [[Q(v, m), "MC-SPEED-FORMULA"], [v + m, "MC-SPEED-FORMULA"], [Q(v * m, 60), "MC-SPEED-UNIT"]],
          explain: `道のり ＝ 速さ × 時間 です。$${v}\\times ${m}=${v * m}$（m）。`,
        });
      }
      if (lv === 2) {
        const v = r.pick([50, 60, 75, 80, 40]);
        const m = r.pick([20, 25, 30, 36, 40, 45]);
        const dist = v * m; // m
        return num({
          q: `${dec(dist / 1000)} km の道のりを、分速 $${v}\\,\\mathrm{m}$ で歩くと、何分かかりますか。`,
          ans: m,
          post: "分",
          wrongs: [[Q(v, dist), "MC-SPEED-FORMULA"], [Math.max(1, Math.round(dist / 1000)), "MC-SPEED-UNIT"], [Math.round((dist / v) * 60), "MC-SPEED-UNIT"]],
          explain: `まず単位をそろえます。$${dec(dist / 1000)}\\,\\mathrm{km}=${dist}\\,\\mathrm{m}$。時間 ＝ 道のり ÷ 速さ なので $${dist}\\div ${v}=${m}$（分）。`,
        });
      }
      if (r.chance(0.5)) {
        const ms = r.pick([5, 10, 15, 20, 25, 30]);
        return num({
          q: `秒速 $${ms}\\,\\mathrm{m}$ は、時速何 $\\mathrm{km}$ ですか。`,
          ans: Q(ms * 36, 10),
          post: "km/時",
          wrongs: [[Q(ms * 60, 1000), "MC-SPEED-UNIT"], [ms * 60, "MC-SPEED-UNIT"], [Q(ms * 6, 100), "MC-SPEED-UNIT"]],
          explain: `1時間は $3600$ 秒なので、$${ms}\\times 3600=${ms * 3600}$（m）進みます。$${ms * 3600}\\,\\mathrm{m}=${dec((ms * 3600) / 1000)}\\,\\mathrm{km}$。時速 $${dec(ms * 3.6)}\\,\\mathrm{km}$。`,
        });
      }
      const kmh = r.pick([18, 36, 54, 72, 90, 108]);
      return num({
        q: `時速 $${kmh}\\,\\mathrm{km}$ は、秒速何 $\\mathrm{m}$ ですか。`,
        ans: Q(kmh * 10, 36),
        post: "m/秒",
        wrongs: [[Q(kmh, 36), "MC-SPEED-UNIT"], [Q(kmh * 60, 100), "MC-SPEED-UNIT"], [Q(kmh * 36, 10), "MC-SPEED-UNIT"]],
        explain: `$${kmh}\\,\\mathrm{km}=${kmh * 1000}\\,\\mathrm{m}$、$1$ 時間 $=3600$ 秒。$${kmh * 1000}\\div 3600=${dec(kmh / 3.6)}$（m/秒）。`,
      });
    }),
  ],

  // ── 比例と反比例（小学校） ─────────────────────
  prop_elem: [
    t("num", (r, lv) => {
      const inverse = lv === 1 ? false : lv === 2 ? true : r.chance(0.5);
      if (!inverse) {
        const k = r.int(3, 9);
        const x0 = r.int(2, 6);
        const x1 = until(() => r.int(7, 15), (x) => x !== x0);
        return num({
          q: `$y$ は $x$ に比例しています。$x=${x0}$ のとき $y=${k * x0}$ です。$x=${x1}$ のとき、$y$ はいくつですか。`,
          ans: k * x1,
          wrongs: [[Q(k * x0 * x0, x1), "MC-PROP-INV-CONFUSE"], [k * x0 + (x1 - x0), "MC-PROP-ADD"], [k * x0 * x1, "MC-PROP-INV-CONFUSE"]],
          explain: `比例では $y\\div x$ が一定です。$${k * x0}\\div ${x0}=${k}$ なので、$y=${k}\\times x$。$x=${x1}$ のとき $y=${k * x1}$。`,
        });
      }
      const prod = r.pick([12, 18, 24, 30, 36, 48, 60]);
      const divs = Array.from({ length: prod }, (_, i) => i + 1).filter((d) => prod % d === 0 && d > 1 && d < prod);
      const [x0, x1] = r.sample(divs, 2);
      return num({
        q: `$y$ は $x$ に反比例しています。$x=${x0}$ のとき $y=${prod / x0}$ です。$x=${x1}$ のとき、$y$ はいくつですか。`,
        ans: prod / x1,
        wrongs: [[(prod / x0) * x1, "MC-PROP-INV-CONFUSE"], [prod / x0 + (x1 - x0), "MC-PROP-ADD"], [prod * x1, "MC-PROP-INV-CONFUSE"]],
        explain: `反比例では $x\\times y$ が一定です。$${x0}\\times ${prod / x0}=${prod}$ なので、$x=${x1}$ のとき $y=${prod}\\div ${x1}=${prod / x1}$。`,
      });
    }),
  ],

  // ── 角度 ───────────────────────────────────────
  angle_basic: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const [a, b] = until(() => [r.int(20, 90), r.int(20, 90)], ([x, y]) => x + y < 160 && x !== y);
        return num({
          q: `三角形の3つの角のうち、2つの角が $${a}^\\circ$ と $${b}^\\circ$ です。残りの角は何度ですか。`,
          ans: 180 - a - b,
          post: "度",
          wrongs: [[360 - a - b, "MC-ANGLE-SUM-WRONG"], [180 - a, "MC-ANGLE-SUM-WRONG"], [a + b, "MC-ANGLE-SUM-WRONG"]],
          explain: `三角形の3つの角の和は $180^\\circ$ です。$180-${a}-${b}=${180 - a - b}$（度）。`,
        });
      }
      if (lv === 2) {
        if (r.chance(0.5)) {
          const [a, b, c] = until(() => [r.int(60, 120), r.int(60, 120), r.int(50, 110)], ([x, y, z]) => x + y + z < 340 && x + y + z > 200);
          return num({
            q: `四角形の4つの角のうち、3つの角が $${a}^\\circ$、$${b}^\\circ$、$${c}^\\circ$ です。残りの角は何度ですか。`,
            ans: 360 - a - b - c,
            post: "度",
            wrongs: [[a + b + c - 180, "MC-ANGLE-SUM-WRONG"], [360 - a - b, "MC-ANGLE-SUM-WRONG"], [a + b + c, "MC-ANGLE-SUM-WRONG"]],
            explain: `四角形の4つの角の和は $360^\\circ$ です。$360-${a}-${b}-${c}=${360 - a - b - c}$（度）。`,
          });
        }
        const [a, b] = until(() => [r.int(25, 70), r.int(30, 80)], ([x, y]) => x + y < 150);
        return num({
          q: `一直線上に3つの角が並んでいます。2つの角が $${a}^\\circ$ と $${b}^\\circ$ のとき、残りの角は何度ですか。`,
          ans: 180 - a - b,
          post: "度",
          wrongs: [[360 - a - b, "MC-ANGLE-SUM-WRONG"], [90 - a - b > 0 ? 90 - a - b : a + b, "MC-ANGLE-SUM-WRONG"], [a + b, "MC-ANGLE-SUM-WRONG"]],
          explain: `一直線の角は $180^\\circ$ です。$180-${a}-${b}=${180 - a - b}$（度）。`,
        });
      }
      if (r.chance(0.5)) {
        const top = r.pick([20, 30, 36, 40, 50, 80, 100, 110, 120]);
        const base = (180 - top) / 2;
        return num({
          q: `二等辺三角形で、等しい2辺にはさまれた角（頂角）が $${top}^\\circ$ です。底角の1つは何度ですか。`,
          ans: base,
          post: "度",
          wrongs: [[180 - top, "MC-ANGLE-SUM-WRONG"], [(360 - top) / 2, "MC-ANGLE-SUM-WRONG"], [top, "MC-ANGLE-SUM-WRONG"]],
          explain: `二等辺三角形の2つの底角は等しい。残りの角の和は $180-${top}=${180 - top}$ なので、底角は $${180 - top}\\div 2=${base}$（度）。`,
        });
      }
      const [p, q, s] = r.pick([[2, 3, 4], [1, 2, 3], [2, 2, 5], [3, 4, 5], [1, 1, 2]]);
      const k = 180 / (p + q + s);
      assert(Number.isInteger(k), "比の合計で180がわりきれる");
      return num({
        q: `三角形の3つの角の大きさの比が $${p}:${q}:${s}$ です。いちばん大きい角は何度ですか。`,
        ans: Math.max(p, q, s) * k,
        post: "度",
        wrongs: [[Q(Math.max(p, q, s) * 360, p + q + s), "MC-ANGLE-SUM-WRONG"], [Math.min(p, q, s) * k, "MC-RATIO-SPLIT-WRONG"], [Q(180, Math.max(p, q, s)), "MC-RATIO-SPLIT-WRONG"]],
        explain: `三角形の内角の和は $180^\\circ$。比の合計 $${p + q + s}$ で 1つ分は $180\\div ${p + q + s}=${k}$（度）。いちばん大きい角は $${Math.max(p, q, s)}$ つ分で $${Math.max(p, q, s) * k}^\\circ$。`,
      });
    }),
  ],

  // ── 長方形・正方形の面積と周 ───────────────────
  area_rect: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const [a, b] = [r.int(4, 25), r.int(3, 20)];
        const askArea = r.chance(0.6);
        return num({
          q: `たて $${a}\\,\\mathrm{cm}$、横 $${b}\\,\\mathrm{cm}$ の長方形の${askArea ? "面積" : "周りの長さ"}は何 ${askArea ? "$\\mathrm{cm}^2$" : "$\\mathrm{cm}$"} ですか。`,
          ans: askArea ? a * b : 2 * (a + b),
          post: askArea ? "cm²" : "cm",
          wrongs: [[askArea ? 2 * (a + b) : a * b, "MC-AREA-PERIM"], [a + b, "MC-AREA-PERIM"], [askArea ? a * b * 2 : a * 2 + b, "MC-AREA-PERIM"]],
          explain: askArea ? `長方形の面積 ＝ たて × 横 $=${a}\\times ${b}=${a * b}$（$\\mathrm{cm}^2$）。` : `周りの長さ ＝（たて＋横）×2 $=(${a}+${b})\\times 2=${2 * (a + b)}$（$\\mathrm{cm}$）。`,
        });
      }
      if (lv === 2) {
        const [a, b] = until(() => [r.int(4, 14), r.int(5, 18)], ([x, y]) => x !== y);
        return num({
          q: `周りの長さが $${2 * (a + b)}\\,\\mathrm{cm}$ で、たての長さが $${a}\\,\\mathrm{cm}$ の長方形があります。この長方形の面積は何 $\\mathrm{cm}^2$ ですか。`,
          ans: a * b,
          post: "cm²",
          wrongs: [[a * (2 * (a + b)), "MC-AREA-PERIM"], [(2 * (a + b) - a) * a, "MC-AREA-PERIM"], [b * 2 * a, "MC-AREA-PERIM"]],
          explain: `周りの長さの半分がたて＋横なので $${a + b}$。横は $${a + b}-${a}=${b}$（$\\mathrm{cm}$）。面積は $${a}\\times ${b}=${a * b}$。`,
        });
      }
      const [A, B] = [r.int(10, 20), r.int(12, 25)];
      const [a, b] = [r.int(3, A - 3), r.int(3, B - 4)];
      return num({
        q: `たて $${A}\\,\\mathrm{cm}$、横 $${B}\\,\\mathrm{cm}$ の長方形の紙から、たて $${a}\\,\\mathrm{cm}$、横 $${b}\\,\\mathrm{cm}$ の長方形を切り取りました。残った部分の面積は何 $\\mathrm{cm}^2$ ですか。`,
        ans: A * B - a * b,
        post: "cm²",
        wrongs: [[(A - a) * (B - b), "MC-AREA-PERIM"], [A * B + a * b, "MC-AREA-PERIM"], [2 * (A + B) - 2 * (a + b), "MC-AREA-PERIM"]],
        explain: `もとの面積 $${A}\\times ${B}=${A * B}$ から、切り取った面積 $${a}\\times ${b}=${a * b}$ をひきます。$${A * B - a * b}$（$\\mathrm{cm}^2$）。`,
      });
    }),
  ],

  // ── 多角形の内角の和 ───────────────────────────
  polygon_angles: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const n = r.int(5, 12);
        const name = { 5: "五", 6: "六", 7: "七", 8: "八", 9: "九", 10: "十", 11: "十一", 12: "十二" }[n];
        return num({
          q: `${name}角形の内角の和は何度ですか。`,
          ans: 180 * (n - 2),
          post: "度",
          wrongs: [[180 * n, "MC-POLY-180N"], [180 * (n - 1), "MC-POLY-N-1"], [360 * (n - 3) + 180, "MC-POLY-N-1"]],
          explain: `多角形は、1つの頂点から対角線を引くと $(n-2)$ 個の三角形に分けられます。内角の和は $180\\times(${n}-2)=${180 * (n - 2)}$（度）。`,
        });
      }
      if (lv === 2) {
        const n = r.pick([5, 6, 8, 9, 10, 12]);
        return num({
          q: `正${n}角形の1つの内角の大きさは何度ですか。`,
          ans: Q(180 * (n - 2), n),
          post: "度",
          wrongs: [[Q(360, n), "MC-POLY-EXTERIOR"], [180, "MC-POLY-180N"], [Q(180 * (n - 1), n), "MC-POLY-N-1"]],
          explain: `内角の和は $180\\times(${n}-2)=${180 * (n - 2)}$ 度で、正多角形は角がすべて等しいので $${180 * (n - 2)}\\div ${n}=${dec((180 * (n - 2)) / n)}$（度）。`,
        });
      }
      const n = r.int(5, 8);
      const sum = 180 * (n - 2);
      const { known, last } = until(
        () => {
          const known = Array.from({ length: n - 1 }, () => Math.round(sum / n) + r.int(-15, 15));
          return { known, last: sum - known.reduce((a, b) => a + b, 0) };
        },
        (v) => v.last > 30 && v.last < 250,
      );
      const ks = known.reduce((a, b) => a + b, 0);
      return num({
        q: `${n}角形の内角のうち、${n - 1}この角が ${known.join("°、")}° のとき、残りの1つの角は何度ですか。`,
        ans: last,
        post: "度",
        wrongs: [[180 * (n - 1) - ks, "MC-POLY-N-1"], [180 * n - ks, "MC-POLY-180N"], [360 - (ks % 360), "MC-ANGLE-SUM-WRONG"]],
        explain: `${n}角形の内角の和は $180\\times(${n}-2)=${sum}$ 度。残りの角は $${sum}-${ks}=${last}$（度）。`,
      });
    }),
  ],

  // ── 三角形・平行四辺形・台形・ひし形の面積 ─────────
  area_polygons: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const [b, h] = until(() => [r.int(4, 20), r.int(3, 16)], ([x, y]) => (x * y) % 2 === 0);
        const isTri = r.chance(0.5);
        return num({
          q: isTri ? `底辺が $${b}\\,\\mathrm{cm}$、高さが $${h}\\,\\mathrm{cm}$ の三角形の面積は何 $\\mathrm{cm}^2$ ですか。` : `底辺が $${b}\\,\\mathrm{cm}$、高さが $${h}\\,\\mathrm{cm}$ の平行四辺形の面積は何 $\\mathrm{cm}^2$ ですか。`,
          ans: isTri ? (b * h) / 2 : b * h,
          post: "cm²",
          wrongs: isTri ? [[b * h, "MC-AREA-HALF"], [b + h, "MC-AREA-HALF"], [Q(b * h, 4), "MC-AREA-HALF"]] : [[(b * h) / 2, "MC-AREA-HALF"], [2 * (b + h), "MC-AREA-PERIM"], [b + h, "MC-AREA-PERIM"]],
          explain: isTri ? `三角形の面積 ＝ 底辺 × 高さ ÷ 2 $=${b}\\times ${h}\\div 2=${(b * h) / 2}$（$\\mathrm{cm}^2$）。` : `平行四辺形の面積 ＝ 底辺 × 高さ $=${b}\\times ${h}=${b * h}$（$\\mathrm{cm}^2$）。斜めの辺の長さではなく、高さを使います。`,
        });
      }
      if (lv === 2) {
        if (r.chance(0.5)) {
          const [u, l, h] = until(() => [r.int(3, 12), r.int(5, 20), r.int(3, 12)], ([a, b, c]) => a < b && ((a + b) * c) % 2 === 0);
          return num({
            q: `上底が $${u}\\,\\mathrm{cm}$、下底が $${l}\\,\\mathrm{cm}$、高さが $${h}\\,\\mathrm{cm}$ の台形の面積は何 $\\mathrm{cm}^2$ ですか。`,
            ans: ((u + l) * h) / 2,
            post: "cm²",
            wrongs: [[(u + l) * h, "MC-AREA-HALF"], [u * l * h, "MC-AREA-HALF"], [Q((u + l) * h, 4), "MC-AREA-HALF"]],
            explain: `台形の面積 ＝（上底＋下底）× 高さ ÷ 2 $=(${u}+${l})\\times ${h}\\div 2=${((u + l) * h) / 2}$（$\\mathrm{cm}^2$）。`,
          });
        }
        const [d1, d2] = until(() => [r.int(4, 20), r.int(4, 20)], ([x, y]) => (x * y) % 2 === 0 && x !== y);
        return num({
          q: `対角線の長さが $${d1}\\,\\mathrm{cm}$ と $${d2}\\,\\mathrm{cm}$ のひし形の面積は何 $\\mathrm{cm}^2$ ですか。`,
          ans: (d1 * d2) / 2,
          post: "cm²",
          wrongs: [[d1 * d2, "MC-AREA-HALF"], [(d1 + d2) * 2, "MC-AREA-PERIM"], [Q(d1 * d2, 4), "MC-AREA-HALF"]],
          explain: `ひし形の面積 ＝ 対角線 × 対角線 ÷ 2 $=${d1}\\times ${d2}\\div 2=${(d1 * d2) / 2}$（$\\mathrm{cm}^2$）。`,
        });
      }
      const [b, h] = until(() => [r.int(6, 20), r.int(4, 16)], ([x, y]) => (x * y) % 2 === 0);
      const area = (b * h) / 2;
      return num({
        q: `面積が $${area}\\,\\mathrm{cm}^2$、底辺が $${b}\\,\\mathrm{cm}$ の三角形があります。高さは何 $\\mathrm{cm}$ ですか。`,
        ans: h,
        post: "cm",
        wrongs: [[Q(area, b), "MC-AREA-HALF"], [Q(area, 2 * b), "MC-AREA-HALF"], [b * area, "MC-AREA-HALF"]],
        explain: `三角形の面積 ＝ 底辺 × 高さ ÷ 2 なので、高さ ＝ 面積 × 2 ÷ 底辺 $=${area}\\times 2\\div ${b}=${h}$（$\\mathrm{cm}$）。`,
      });
    }),
  ],

  // ── 直方体・立方体の体積 ───────────────────────
  volume_cuboid: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const [a, b, c] = [r.int(3, 12), r.int(3, 12), r.int(2, 10)];
        return num({
          q: `たて $${a}\\,\\mathrm{cm}$、横 $${b}\\,\\mathrm{cm}$、高さ $${c}\\,\\mathrm{cm}$ の直方体の体積は何 $\\mathrm{cm}^3$ ですか。`,
          ans: a * b * c,
          post: "cm³",
          wrongs: [[2 * (a * b + b * c + c * a), "MC-VOL-AREA"], [a + b + c, "MC-VOL-AREA"], [a * b, "MC-VOL-AREA"]],
          explain: `直方体の体積 ＝ たて × 横 × 高さ $=${a}\\times ${b}\\times ${c}=${a * b * c}$（$\\mathrm{cm}^3$）。`,
        });
      }
      if (lv === 2) {
        const [a, b, c] = r.pick([[20, 30, 50], [10, 40, 50], [25, 40, 30], [20, 20, 25], [50, 40, 30], [30, 30, 40], [20, 50, 35], [40, 25, 20], [60, 20, 25]]);
        return num({
          q: `内側の長さが、たて $${a}\\,\\mathrm{cm}$、横 $${b}\\,\\mathrm{cm}$、高さ $${c}\\,\\mathrm{cm}$ の直方体の入れ物があります。この入れ物にはいる水の量は何 $\\mathrm{L}$ ですか。（$1\\,\\mathrm{L}=1000\\,\\mathrm{cm}^3$）`,
          ans: Q(a * b * c, 1000),
          post: "L",
          wrongs: [[a * b * c, "MC-UNIT-POWER"], [Q(a * b * c, 100), "MC-UNIT-POWER"], [Q(a * b * c, 10000), "MC-UNIT-POWER"]],
          explain: `体積は $${a}\\times ${b}\\times ${c}=${comma(a * b * c)}\\,\\mathrm{cm}^3$。$1\\,\\mathrm{L}=1000\\,\\mathrm{cm}^3$ なので $${comma(a * b * c)}\\div 1000=${dec((a * b * c) / 1000)}$（$\\mathrm{L}$）。`,
        });
      }
      const [a, b] = r.pick([[40, 30], [50, 20], [25, 40], [30, 30], [20, 50]]);
      const depth = r.pick([5, 8, 10, 12, 15, 20]);
      const cm3 = a * b * depth;
      return num({
        q: `底面が、たて $${a}\\,\\mathrm{cm}$、横 $${b}\\,\\mathrm{cm}$ の直方体の水そうに、水を $${dec(cm3 / 1000)}\\,\\mathrm{L}$ 入れました。水の深さは何 $\\mathrm{cm}$ ですか。`,
        ans: depth,
        post: "cm",
        wrongs: [[Q(cm3, a + b), "MC-VOL-AREA"], [Q(cm3, a * b * 10), "MC-UNIT-POWER"], [Q(cm3, a), "MC-VOL-AREA"]],
        explain: `水の体積は $${dec(cm3 / 1000)}\\,\\mathrm{L}=${comma(cm3)}\\,\\mathrm{cm}^3$。底面積が $${a}\\times ${b}=${a * b}\\,\\mathrm{cm}^2$ なので、深さ ＝ 体積 ÷ 底面積 $=${comma(cm3)}\\div ${a * b}=${depth}$（$\\mathrm{cm}$）。`,
      });
    }),
  ],

  // ── 円周・円の面積 ─────────────────────────────
  circle_elem: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const d = r.int(2, 30);
        return num({
          q: `直径が $${d}\\,\\mathrm{cm}$ の円の円周は何 $\\mathrm{cm}$ ですか。（円周率は $3.14$ とします）`,
          ans: mul(d, PI),
          post: "cm",
          wrongs: [[mul(Q(d, 2), PI), "MC-CIRC-RADIUS-DIAM"], [mul(d * d, PI), "MC-CIRC-AREA-CONFUSE"], [mul(2 * d, PI), "MC-CIRC-RADIUS-DIAM"]],
          explain: `円周 ＝ 直径 × 円周率 $=${d}\\times 3.14=${decStr(mul(d, PI))}$（$\\mathrm{cm}$）。`,
        });
      }
      if (lv === 2) {
        const r0 = r.int(2, 15);
        return num({
          q: `半径が $${r0}\\,\\mathrm{cm}$ の円の面積は何 $\\mathrm{cm}^2$ ですか。（円周率は $3.14$ とします）`,
          ans: mul(r0 * r0, PI),
          post: "cm²",
          wrongs: [[mul(r0 * 2, PI), "MC-CIRC-AREA-CONFUSE"], [mul(r0 * r0 * 4, PI), "MC-CIRC-AREA-DIAM"], [mul(r0, PI), "MC-CIRC-AREA-CONFUSE"]],
          explain: `円の面積 ＝ 半径 × 半径 × 円周率 $=${r0}\\times ${r0}\\times 3.14=${decStr(mul(r0 * r0, PI))}$（$\\mathrm{cm}^2$）。`,
        });
      }
      const r0 = r.pick([4, 5, 6, 8, 10, 12, 14, 15]);
      if (r.chance(0.5)) {
        const c = mul(2 * r0, PI);
        return num({
          q: `円周が $${decStr(c)}\\,\\mathrm{cm}$ の円の面積は何 $\\mathrm{cm}^2$ ですか。（円周率は $3.14$ とします）`,
          ans: mul(r0 * r0, PI),
          post: "cm²",
          wrongs: [[mul(4 * r0 * r0, PI), "MC-CIRC-AREA-DIAM"], [mul(r0, PI), "MC-CIRC-AREA-CONFUSE"], [mul(2 * r0 * r0, PI), "MC-CIRC-AREA-CONFUSE"]],
          explain: `円周 ＝ 直径 × $3.14$ より、直径は $${decStr(c)}\\div 3.14=${2 * r0}$、半径は $${r0}\\,\\mathrm{cm}$。面積は $${r0}\\times ${r0}\\times 3.14=${decStr(mul(r0 * r0, PI))}$（$\\mathrm{cm}^2$）。`,
        });
      }
      const r1 = Math.floor(r0 / 2);
      return num({
        q: `半径 $${r0}\\,\\mathrm{cm}$ の円から、同じ中心で半径 $${r1}\\,\\mathrm{cm}$ の円をくりぬいた図形（輪の形）の面積は何 $\\mathrm{cm}^2$ ですか。（円周率は $3.14$ とします）`,
        ans: mul(r0 * r0 - r1 * r1, PI),
        post: "cm²",
        wrongs: [[mul((r0 - r1) * (r0 - r1), PI), "MC-CIRC-RING"], [mul(r0 * r0 + r1 * r1, PI), "MC-CIRC-RING"], [mul(2 * (r0 - r1), PI), "MC-CIRC-RING"]],
        explain: `大きい円の面積 $${r0}\\times ${r0}\\times 3.14$ から小さい円の面積 $${r1}\\times ${r1}\\times 3.14$ をひきます。$(${r0 * r0}-${r1 * r1})\\times 3.14=${decStr(mul(r0 * r0 - r1 * r1, PI))}$（$\\mathrm{cm}^2$）。半径の差を2乗してはいけません。`,
      });
    }),
  ],

  // ── 角柱・円柱の体積 ───────────────────────────
  prism_cyl: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const [b, hh, H] = until(() => [r.int(4, 14), r.int(3, 12), r.int(4, 15)], ([x, y]) => (x * y) % 2 === 0);
        return num({
          q: `底面が、底辺 $${b}\\,\\mathrm{cm}$、高さ $${hh}\\,\\mathrm{cm}$ の三角形で、柱の高さが $${H}\\,\\mathrm{cm}$ の三角柱の体積は何 $\\mathrm{cm}^3$ ですか。`,
          ans: (b * hh * H) / 2,
          post: "cm³",
          wrongs: [[b * hh * H, "MC-AREA-HALF"], [(b * hh) / 2 + H, "MC-VOL-AREA"], [Q(b * hh * H, 6), "MC-VOL-PYRAMID-THIRD"]],
          explain: `角柱の体積 ＝ 底面積 × 高さ。底面積は $${b}\\times ${hh}\\div 2=${(b * hh) / 2}$、体積は $${(b * hh) / 2}\\times ${H}=${(b * hh * H) / 2}$（$\\mathrm{cm}^3$）。`,
        });
      }
      if (lv === 2) {
        const r0 = r.int(2, 10);
        const H = r.int(3, 15);
        return num({
          q: `底面の半径が $${r0}\\,\\mathrm{cm}$、高さが $${H}\\,\\mathrm{cm}$ の円柱の体積は何 $\\mathrm{cm}^3$ ですか。（円周率は $3.14$ とします）`,
          ans: mul(r0 * r0 * H, PI),
          post: "cm³",
          wrongs: [[mul(r0 * r0 * 4 * H, PI), "MC-CIRC-AREA-DIAM"], [mul(2 * r0 * H, PI), "MC-CIRC-AREA-CONFUSE"], [div(mul(r0 * r0 * H, PI), 3), "MC-VOL-PYRAMID-THIRD"]],
          explain: `円柱の体積 ＝ 底面積 × 高さ。底面積は $${r0}\\times ${r0}\\times 3.14=${decStr(mul(r0 * r0, PI))}$。体積は $${decStr(mul(r0 * r0, PI))}\\times ${H}=${decStr(mul(r0 * r0 * H, PI))}$（$\\mathrm{cm}^3$）。`,
        });
      }
      const r0 = r.pick([2, 5, 10, 4, 6]);
      const H = r.pick([5, 10, 7, 20, 8]);
      const vol = mul(r0 * r0 * H, PI);
      return num({
        q: `底面の半径が $${r0}\\,\\mathrm{cm}$ の円柱の体積が $${decStr(vol)}\\,\\mathrm{cm}^3$ です。この円柱の高さは何 $\\mathrm{cm}$ ですか。（円周率は $3.14$ とします）`,
        ans: H,
        post: "cm",
        wrongs: [[H * 2, "MC-CIRC-AREA-DIAM"], [Math.max(1, Math.round(H / 2)), "MC-CIRC-AREA-CONFUSE"], [H * r0, "MC-CIRC-AREA-CONFUSE"]],
        explain: `底面積は $${r0}\\times ${r0}\\times 3.14=${decStr(mul(r0 * r0, PI))}$。高さ ＝ 体積 ÷ 底面積 $=${decStr(vol)}\\div ${decStr(mul(r0 * r0, PI))}=${H}$（$\\mathrm{cm}$）。`,
      });
    }),
  ],

  // ── 拡大図・縮図・縮尺 ─────────────────────────
  scale_figure: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const sc = r.pick([1000, 5000, 10000, 25000, 50000]);
        const cm = r.int(2, 12);
        const real = cm * sc; // cm
        return num({
          q: `縮尺が $\\dfrac{1}{${comma(sc)}}$ の地図で、$${cm}\\,\\mathrm{cm}$ の長さは、実際には何 $\\mathrm{m}$ ですか。`,
          ans: real / 100,
          post: "m",
          wrongs: [[real, "MC-UNIT-POWER"], [real / 1000, "MC-UNIT-POWER"], [cm * sc * 10, "MC-UNIT-POWER"]],
          explain: `実際の長さ ＝ 地図上の長さ × ${comma(sc)}。$${cm}\\times ${comma(sc)}=${comma(real)}\\,\\mathrm{cm}$。$100\\,\\mathrm{cm}=1\\,\\mathrm{m}$ なので $${dec(real / 100)}\\,\\mathrm{m}$。`,
        });
      }
      if (lv === 2) {
        const sc = r.pick([10000, 25000, 50000]);
        const km = r.pick([1, 2, 3, 4, 5]);
        const cm = Q(km * 100000, sc);
        return num({
          q: `縮尺が $\\dfrac{1}{${comma(sc)}}$ の地図があります。実際に $${km}\\,\\mathrm{km}$ はなれた2地点は、地図上では何 $\\mathrm{cm}$ になりますか。`,
          ans: cm,
          post: "cm",
          wrongs: [[mul(cm, 10), "MC-UNIT-POWER"], [div(cm, 10), "MC-UNIT-POWER"], [km * sc, "MC-SCALE-DIRECTION"]],
          explain: `$${km}\\,\\mathrm{km}=${comma(km * 100000)}\\,\\mathrm{cm}$。地図上の長さ ＝ 実際の長さ ÷ ${comma(sc)} $=${comma(km * 100000)}\\div ${comma(sc)}=${decStr(cm)}$（$\\mathrm{cm}$）。`,
        });
      }
      const sc = r.pick([100, 1000, 10000]);
      const a = r.pick([2, 3, 4, 5, 6]);
      return num({
        q: `縮尺が $\\dfrac{1}{${comma(sc)}}$ の地図で、面積が $${a}\\,\\mathrm{cm}^2$ の土地は、実際には何 $\\mathrm{m}^2$ ですか。`,
        ans: Q(a * sc * sc, 10000),
        post: "m²",
        wrongs: [[Q(a * sc, 100), "MC-SCALE-AREA-LINEAR"], [Q(a * sc * sc, 100), "MC-UNIT-AREA-LINEAR"], [a * sc * sc, "MC-UNIT-AREA-LINEAR"]],
        explain: `面積は長さの縮尺の2乗になります。実際の面積は $${a}\\times ${comma(sc)}\\times ${comma(sc)}=${comma(a * sc * sc)}\\,\\mathrm{cm}^2$。$1\\,\\mathrm{m}^2=10000\\,\\mathrm{cm}^2$ なので $${dec((a * sc * sc) / 10000)}\\,\\mathrm{m}^2$。`,
      });
    }),
  ],

  // ── 表・グラフの読み取り ───────────────────────
  table_read: [
    t("num", (r, lv) => {
      const { cats, vals } = until(
        () => {
          const cats = r.sample(["りんご", "みかん", "いちご", "ぶどう", "もも", "バナナ", "なし"], lv === 1 ? 4 : 5);
          return { cats, vals: cats.map(() => r.int(4, 24)) };
        },
        (v) => new Set(v.vals).size === v.vals.length,
      );
      const head = `好きな果物を調べたところ、${cats.map((c, i) => `${c} ${vals[i]}人`).join("、")} でした。（1人1つだけ選びました）`;
      const total = vals.reduce((a, b) => a + b, 0);
      if (lv === 1) {
        return num({
          q: `${head}\n調べた人は全部で何人ですか。`,
          ans: total,
          post: "人",
          wrongs: [[total - Math.min(...vals), "MC-TABLE-SUM"], [total + Math.max(...vals), "MC-TABLE-SUM"], [Math.max(...vals), "MC-TABLE-SUM"]],
          explain: `すべての人数をたします。$${vals.join("+")}=${total}$（人）。`,
        });
      }
      if (lv === 2) {
        const mx = Math.max(...vals);
        const mn = Math.min(...vals);
        return num({
          q: `${head}\nいちばん多い果物と、いちばん少ない果物の人数の差は何人ですか。`,
          ans: mx - mn,
          post: "人",
          wrongs: [[mx + mn, "MC-TABLE-SUM"], [mx, "MC-TABLE-SUM"], [mx - mn + 1, "MC-SLIP"]],
          explain: `最も多いのは $${mx}$ 人、最も少ないのは $${mn}$ 人。差は $${mx}-${mn}=${mx - mn}$（人）。`,
        });
      }
      const avg = total / vals.length;
      const cnt = vals.filter((v) => v > avg).length;
      return num({
        q: `${head}\n人数が、5つの果物の人数の平均より多い果物は、いくつありますか。`,
        ans: cnt,
        post: "つ",
        wrongs: [[vals.length - cnt, "MC-TABLE-SUM"], [cnt + 1, "MC-SLIP"], [Math.max(0, cnt - 1), "MC-SLIP"]],
        explain: `平均は $${total}\\div ${vals.length}=${dec(avg)}$ 人。これより多いのは ${vals.filter((v) => v > avg).map((v) => `$${v}$`).join("、")} 人の果物で、$${cnt}$ つ。`,
      });
    }),
  ],

  // ── 並べ方・組み合わせ ─────────────────────────
  counting_elem: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const n = r.pick([3, 4]);
        const names = r.sample(NAMES, n);
        const ans = n === 3 ? 6 : 24;
        return num({
          q: `${names.join("さん、")}さんの${n}人が1列に並びます。並び方は全部で何通りありますか。`,
          ans,
          post: "通り",
          wrongs: [[n * 2, "MC-COUNT-PERM"], [n, "MC-COUNT-PERM"], [n === 3 ? 9 : 12, "MC-COUNT-PERM"]],
          explain: `1番目に並ぶ人は $${n}$ 通り、2番目は残りの $${n - 1}$ 通り、…と数えて、$${Array.from({ length: n }, (_, i) => n - i).join("\\times ")}=${ans}$（通り）。`,
        });
      }
      if (lv === 2) {
        const [n, k] = r.pick([[4, 2], [5, 2], [5, 3], [6, 2], [6, 3], [7, 2], [7, 3], [8, 2], [4, 3]]);
        const perm = k === 2 ? n * (n - 1) : n * (n - 1) * (n - 2);
        const fact = k === 2 ? 2 : 6;
        return num({
          q: `${n}人の中から${k}人の代表を選びます。選び方は全部で何通りありますか。（選ぶ順番は区別しません）`,
          ans: perm / fact,
          post: "通り",
          wrongs: [[perm, "MC-COUNT-PERM-COMB"], [n * k, "MC-COUNT-PERM-COMB"], [perm / fact + n, "MC-SLIP"]],
          explain: `順番を区別すると $${k === 2 ? `${n}\\times ${n - 1}` : `${n}\\times ${n - 1}\\times ${n - 2}`}=${perm}$ 通りですが、同じ組を${fact}回ずつ数えているので、${fact} でわって $${perm / fact}$（通り）。`,
        });
      }
      const nCards = r.pick([4, 5]);
      const others = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], nCards - 1).sort((a, b) => a - b);
      const cards = [0, ...others];
      const ans = (nCards - 1) * (nCards - 1) * (nCards - 2);
      return num({
        q: `${cards.map((d) => `$${d}$`).join("、")} の${nCards}まいのカードから3まいを選んで並べ、3けたの整数をつくります。何通りできますか。`,
        ans,
        post: "通り",
        wrongs: [[nCards * (nCards - 1) * (nCards - 2), "MC-COUNT-LEADING-ZERO"], [ans - (nCards - 1), "MC-COUNT-LEADING-ZERO"], [(nCards - 1) * (nCards - 2) * (nCards - 3) || 6, "MC-COUNT-LEADING-ZERO"]],
        explain: `百の位に $0$ は使えないので、百の位は $${nCards - 1}$ 通り。十の位は残り $${nCards - 1}$ まい（$0$ もOK）から $${nCards - 1}$ 通り、一の位は $${nCards - 2}$ 通り。$${nCards - 1}\\times ${nCards - 1}\\times ${nCards - 2}=${ans}$（通り）。`,
      });
    }),
  ],

  // ── 平均・中央値・最頻値・範囲 ────────────────
  data_avg_median: [
    t("num", (r, lv) => {
      const n = lv === 1 ? 5 : lv === 2 ? 6 : 7;
      const kind = lv === 1 ? r.pick(["median", "range"]) : lv === 2 ? "median" : r.pick(["mode", "median", "avgmore"]);
      if (kind === "mode") {
        const { data, mode, max } = until(
          () => {
            const base = Array.from({ length: n - 2 }, () => r.int(3, 30));
            const m = r.pick(base);
            const data = r.shuffle(base.concat([m, m]));
            const cnt = {};
            data.forEach((v) => (cnt[v] = (cnt[v] || 0) + 1));
            const max = Math.max(...Object.values(cnt));
            const modes = Object.keys(cnt).filter((k) => cnt[k] === max);
            return { data, mode: Number(modes[0]), max, unique: modes.length === 1 };
          },
          (v) => v.unique,
        );
        const sorted = data.slice().sort((a, b) => a - b);
        return num({
          q: `次の${n}個のデータの最頻値（もっとも多く出てくる値）を答えなさい。\n${data.join("、")}`,
          ans: mode,
          wrongs: [[Math.round(data.reduce((a, b) => a + b, 0) / n), "MC-MODE"], [sorted[Math.floor(n / 2)], "MC-MODE"], [Math.max(...data), "MC-MODE"]],
          explain: `同じ値がいちばん多く出てくるものを探します。$${mode}$ が ${max} 回出てくるので、最頻値は $${mode}$。`,
        });
      }
      const arr = until(() => Array.from({ length: n }, () => r.int(3, 30)), (v) => new Set(v).size >= n - 1);
      const sorted = arr.slice().sort((a, b) => a - b);
      const list = arr.join("、");
      if (kind === "range") {
        return num({
          q: `次の${n}個のデータの範囲（最大値 − 最小値）を答えなさい。\n${list}`,
          ans: sorted[n - 1] - sorted[0],
          wrongs: [[sorted[n - 1] + sorted[0], "MC-RANGE"], [sorted[n - 1], "MC-RANGE"], [sorted[n - 1] - sorted[0] + 1, "MC-SLIP"]],
          explain: `最大値は $${sorted[n - 1]}$、最小値は $${sorted[0]}$。範囲は $${sorted[n - 1]}-${sorted[0]}=${sorted[n - 1] - sorted[0]}$。`,
        });
      }
      if (kind === "avgmore") {
        const sum = sorted.reduce((a, b) => a + b, 0);
        const avg = sum / n;
        const cnt = sorted.filter((v) => v > avg).length;
        return num({
          q: `次の${n}個のデータのうち、平均より大きい値は何個ありますか。\n${list}`,
          ans: cnt,
          post: "個",
          wrongs: [[n - cnt, "MC-AVG-MEDIAN-CONFUSE"], [Math.floor(n / 2), "MC-AVG-MEDIAN-CONFUSE"], [cnt + 1, "MC-SLIP"]],
          explain: `平均は $${sum}\\div ${n}=${dec(avg)}$。これより大きいのは $${cnt}$ 個です。（平均は真ん中の値とはかぎりません）`,
        });
      }
      const med = n % 2 ? Q(sorted[(n - 1) / 2]) : Q(sorted[n / 2 - 1] + sorted[n / 2], 2);
      return num({
        q: `次の${n}個のデータの中央値を答えなさい。\n${list}`,
        ans: med,
        wrongs: [[arr[Math.floor(n / 2)], "MC-MEDIAN-UNSORTED"], [n % 2 ? Q(sorted.reduce((a, b) => a + b, 0), n) : sorted[n / 2], "MC-MEDIAN-EVEN"], [sorted[Math.floor(n / 2) - 1] + (n % 2 ? 1 : 0), "MC-MEDIAN-EVEN"]],
        explain: `大きさの順に並べると $${sorted.join(",\\ ")}$。${n % 2 ? `真ん中の値は $${sorted[(n - 1) / 2]}$。` : `真ん中の2つ $${sorted[n / 2 - 1]}$ と $${sorted[n / 2]}$ の平均 $${decStr(med)}$ が中央値です。`}並べかえてから真ん中をとります。`,
      });
    }),
  ],

  // ── □や文字を使った式 ─────────────────────────
  blank_expr: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const a = r.int(5, 40);
        const b = r.int(a + 3, a + 40);
        if (r.chance(0.5)) return num({ q: `$\\square+${a}=${b}$ のとき、□にあてはまる数を答えなさい。`, ans: b - a, wrongs: [[a + b, "MC-BLANK-INVERSE"], [b - a + 1, "MC-SLIP"], [a, "MC-BLANK-INVERSE"]], explain: `□にたして $${a}$ になるので、□ $=${b}-${a}=${b - a}$。（たしかめ：$${b - a}+${a}=${b}$）` });
        return num({ q: `$\\square-${a}=${b - a}$ のとき、□にあてはまる数を答えなさい。`, ans: b, wrongs: [[b - 2 * a, "MC-BLANK-INVERSE"], [b - a - a, "MC-BLANK-INVERSE"], [b + 1, "MC-SLIP"]], explain: `□から $${a}$ をひいて $${b - a}$ なので、□ $=${b - a}+${a}=${b}$。` });
      }
      if (lv === 2) {
        const a = r.int(2, 9);
        const x = r.int(3, 15);
        const b = r.int(1, 30);
        const total = a * x + b;
        return num({
          q: `$x$ にあてはまる数を答えなさい。\n$${a}\\times x+${b}=${total}$`,
          ans: x,
          wrongs: [[total - b + a, "MC-BLANK-INVERSE"], [total - b, "MC-BLANK-INVERSE"], [Q(total + b, a), "MC-BLANK-INVERSE"]],
          explain: `まず $${b}$ をひいて $${a}\\times x=${total - b}$。つぎに $${a}$ でわって $x=${x}$。（たしかめ：$${a}\\times ${x}+${b}=${total}$）`,
        });
      }
      const n = r.int(4, 15);
      const box = r.pick([100, 150, 200, 250]);
      const x = r.int(3, 12);
      return num({
        q: `1さつ $x$ 円のノートを ${n} さつと、${box} 円の消しゴムを1こ買ったら、代金の合計が ${n * x + box} 円でした。$x$ はいくらですか。`,
        ans: x,
        post: "円",
        wrongs: [[n * x + box - n, "MC-BLANK-INVERSE"], [Q(n * x + box, n), "MC-BLANK-INVERSE"], [n * x, "MC-BLANK-INVERSE"]],
        explain: `式にすると $${n}\\times x+${box}=${n * x + box}$。$${box}$ をひいて $${n}\\times x=${n * x}$、$${n}$ でわって $x=${x}$。`,
      });
    }),
  ],
};
