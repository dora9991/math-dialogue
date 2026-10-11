// ============================================================
// e5.js — 小学5年の単元（数学ラボ ソロ）
//   書き方は docs/solo-問題データの書き方.md
// ============================================================
import { t, pick, shuffle, sample, gcd, lcm, round, reduce, fracAns, fracTex, choices4, numChoices } from "../kit.js";

// ── この学年で使う小さな道具 ─────────────────────────────

const $ = (s) => `$${s}$`;

/** 約分した帯分数の TeX（1より小さいときは真分数、整数なら整数） */
function mixTex(n, d) {
  const [a, b] = reduce(n, d);
  if (b === 1) return String(a);
  const q = Math.floor(a / b);
  const m = a - q * b;
  return q === 0 ? `\\frac{${m}}{${b}}` : `${q}\\frac{${m}}{${b}}`;
}

/** a ÷ b を小数第2位まで（わり切れないときは「…」をつける） */
const approx = (a, b) => (round(a / b, 2) === round(a / b) ? String(round(a / b)) : `${Math.floor((a / b) * 100) / 100}…`);

/** 漢数字（1〜99） */
function kan(n) {
  const d = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const t = Math.floor(n / 10);
  return (t ? (t === 1 ? "" : d[t]) + "十" : "") + d[n % 10];
}

/** 約数の一覧 */
const divisors = (n) => {
  const out = [];
  for (let k = 1; k <= n; k++) if (n % k === 0) out.push(k);
  return out;
};

/** 問題に出てくる人の名前（「〜さん」をつけて使う） */
const NAMES = ["ゆうと", "さくら", "はると", "あおい", "そうた", "ひなた", "れん", "ゆい"];

/** 分母 d の真分数で、それ以上約分できない分子を1つ選ぶ */
const numer = (r, d) => pick(r, Array.from({ length: d - 1 }, (_, i) => i + 1).filter((k) => gcd(k, d) === 1));

/** p ÷ q の小数（わり切れないときは小数第3位まで書いて「…」をつける） */
function decStr(p, q) {
  const v = p / q;
  if (Number.isInteger(round(v * 1000, 6))) return String(round(v));
  return `${Math.floor(v * 1000) / 1000}…`;
}

/** 分数の4択（値が同じものは同じ文字列になる fracTex を使う） */
function fracChoices(r, [n, d], traps) {
  const f = ([a, b]) => (b > 0 && a > 0 ? $(fracTex(a, b)) : null);
  const ans = f([n, d]);
  return { ans, choices: choices4(r, ans, traps.map(f), (i) => f([n + (i % 2 ? -1 : 1) * (Math.floor(i / 2) + 1), d])) };
}

export const UNITS = [
  // ────────────────────────────────────────────────────────
  {
    id: "E5-shosukake",
    grade: "E5",
    area: "num",
    name: "小数のかけ算・わり算",
    desc: "小数×小数・小数÷小数",
    prereqs: ["E4-shosu"],
    points: [
      "小数 × 小数は、整数とみて計算し、積の小数点は「かけられる数とかける数の小数点より下のけた数の和」だけ右から数えてうつよ。",
      "小数 ÷ 小数は、わる数が整数になるように、わる数とわられる数の小数点を同じけただけ右にうつして計算するよ。",
      "1より小さい数をかけると、積はかけられる数より小さくなる。1より小さい数でわると、商はわられる数より大きくなるよ。",
    ],
    levels: {
      1: [
        t("E5-shosukake-1a", (r) => {
          const X = r(11, 99);
          const Y = r(11, 49);
          if (X % 10 === 0 || Y % 10 === 0) return { skip: true };
          const ans = round((X * Y) / 100);
          return {
            q: `${X / 10} × ${Y / 10} を計算しましょう。`,
            ans,
            hint: "整数とみて計算してから、小数点の位置を考えよう。",
            steps: [`${X} × ${Y} ＝ ${X * Y} と計算する`, "小数点より下のけた数は 1 ＋ 1 ＝ 2 けた", `答え ${ans}`],
          };
        }),
        t("E5-shosukake-1b", (r) => {
          if (r(0, 1)) {
            const X = r(1, 9);
            const Y = r(1, 9);
            const ans = round((X * Y) / 100);
            return {
              q: `${X / 10} × ${Y / 10} を計算しましょう。`,
              ans,
              hint: "整数とみて計算してから、小数点の位置を考えよう。0 を書きたすことがあるよ。",
              steps: [`${X} × ${Y} ＝ ${X * Y} と計算する`, `小数点より下は 2 けたになるので、0 を書きたして ${ans}`],
            };
          }
          const n = r(12, 90);
          const Y = r(11, 49);
          if (Y % 10 === 0) return { skip: true };
          const ans = round((n * Y) / 10);
          return {
            q: `${n} × ${Y / 10} を計算しましょう。`,
            ans,
            hint: "整数とみて計算してから、小数点の位置を考えよう。",
            steps: [`${n} × ${Y} ＝ ${n * Y} と計算する`, `小数点より下は 1 けたなので ${ans}`],
          };
        }),
        t("E5-shosukake-1c", (r) => {
          const Y = r(2, 49);
          if (Y % 10 === 0) return { skip: true };
          const q = r(2, 9);
          const X = Y * q;
          return {
            q: `${X / 10} ÷ ${Y / 10} を計算しましょう。`,
            ans: q,
            hint: "わる数が整数になるように、両方の小数点を同じだけ右にうつそう。",
            steps: [`両方を10倍して ${X} ÷ ${Y} と考える`, `${X} ÷ ${Y} ＝ ${q}`],
          };
        }),
        t("E5-shosukake-1d", (r) => {
          // 整数のかけ算の答えを使って、小数のかけ算の積を求める
          const A = r(12, 98);
          const B = r(12, 98);
          if (A % 10 === 0 || B % 10 === 0) return { skip: true };
          const P = A * B;
          const [da, db] = pick(r, [[1, 1], [1, 1], [2, 1], [1, 2], [2, 0], [0, 2], [1, 0], [0, 1]]);
          const k = da + db;
          const a = round(A / 10 ** da);
          const b = round(B / 10 ** db);
          const raw = (P / 10 ** k).toFixed(k);
          const ans = round(P / 10 ** k);
          return {
            q: `${A} × ${B} ＝ ${P} です。このことを使って、${a} × ${b} の積を求めましょう。`,
            ans,
            hint: "かけられる数とかける数の、小数点より下のけた数に注目しよう。",
            steps: [
              `小数点より下のけた数は ${da} ＋ ${db} ＝ ${k}（けた）`,
              `${P} の右から ${k}けたのところに小数点をうって ${raw}${raw !== String(ans) ? `（終わりの 0 を消して ${ans}）` : ""}`,
              `答え ${ans}`,
            ],
          };
        }),
        t("E5-shosukake-1e", (r) => {
          // 整数 × 小数、整数 ÷ 小数 の文章題（代金・1m のねだん）
          const item = pick(r, ["リボン", "ホース", "はり金", "ロープ", "布"]);
          const p = r(6, 20) * 10;
          const X = r(12, 49);
          if (X % 10 === 0) return { skip: true };
          const L = X / 10;
          const T = (p * X) / 10;
          if (r(0, 1)) {
            return {
              q: `1m のねだんが ${p}円の${item}を ${L}m 買います。代金は何円ですか。`,
              ans: T,
              unit: "円",
              hint: "代金 ＝ 1m のねだん × 長さ。長さが小数のときも、かけ算で求められるよ。",
              steps: [`${p} × ${L}`, `${p} × ${X} ＝ ${p * X}、小数点より下は 1 けたで ${T}`, `${T}円`],
            };
          }
          return {
            q: `${item} ${L}m の代金は ${T}円でした。この${item} 1m のねだんは何円ですか。`,
            ans: p,
            unit: "円",
            hint: "1m のねだん ＝ 代金 ÷ 長さ。長さが小数でも、わり算で求められるよ。",
            steps: [`${T} ÷ ${L}`, `わる数が整数になるように両方を10倍して ${T * 10} ÷ ${X} ＝ ${p}`, `${p}円`],
          };
        }),
      ],
      2: [
        t("E5-shosukake-2a", (r) => {
          const X = r(101, 999);
          const Y = r(11, 99);
          if (X % 10 === 0 || Y % 10 === 0) return { skip: true };
          const ans = round((X * Y) / 1000);
          return {
            q: `${X / 100} × ${Y / 10} の積はどれですか。`,
            ans,
            choices: numChoices(r, ans, [round(ans * 10), round(ans / 10), round(ans * 100)]),
            hint: "小数点より下のけた数は、あわせて何けたかな？",
            steps: [`${X} × ${Y} ＝ ${X * Y} と計算する`, "小数点より下のけた数は 2 ＋ 1 ＝ 3 けた", `答え ${ans}`],
          };
        }),
        t("E5-shosukake-2b", (r) => {
          const Q = r(11, 99);
          const Y = r(11, 49);
          if (Q % 10 === 0 || Y % 10 === 0) return { skip: true };
          const q = Q / 10;
          const x = round((Q * Y) / 100);
          return {
            q: `${x} ÷ ${Y / 10} を計算しましょう。`,
            ans: q,
            hint: "わる数が整数になるように、両方の小数点を同じだけ右にうつそう。",
            steps: [`両方を10倍して ${round(x * 10)} ÷ ${Y} と考える`, `商の小数点は、うつしたあとのわられる数の小数点にそろえる`, `答え ${q}`],
          };
        }),
        t("E5-shosukake-2c", (r) => {
          const a = r(12, 90);
          const small = r(1, 9) / 10;
          const bigs = sample(r, [1.2, 1.5, 2.4, 1.1, 3, 1.8, 2, 1], 3);
          const mul = r(0, 1) === 1;
          const show = (m) => (mul ? `$${a} \\times ${m}$` : `$${a} \\div ${m}$`);
          const ans = show(small);
          return {
            q: mul ? `次の計算のうち、積が ${a} より小さくなるものはどれですか。` : `次の計算のうち、商が ${a} より大きくなるものはどれですか。`,
            ans,
            choices: choices4(r, ans, bigs.map(show)),
            hint: mul ? "1より小さい数をかけると、積はどうなるかな？" : "1より小さい数でわると、商はどうなるかな？",
            steps: [mul ? "1より小さい数をかけると、積はかけられる数より小さくなる" : "1より小さい数でわると、商はわられる数より大きくなる", `${small} は1より小さいので ${ans}`],
          };
        }),
        t("E5-shosukake-2d", (r) => {
          // 商を四捨五入して、がい数で求める
          const X = r(20, 600);
          const Y = r(12, 99);
          if (Y % 10 === 0) return { skip: true };
          const v = X / Y;
          if (v < 0.1 || v >= 100) return { skip: true };
          const sig = r(0, 1) === 1; // 上から2けた
          const k = sig ? (v >= 10 ? 0 : v >= 1 ? 1 : 2) : 1; // 小数第 k 位までのがい数にする
          if ((X * 10 ** (k + 1)) % Y === 0) return { skip: true };
          const q1 = Math.floor((X * 10 ** (k + 1)) / Y);
          const ans = round((Math.floor(q1 / 10) + (q1 % 10 >= 5 ? 1 : 0)) / 10 ** k);
          const PN = (j) => (j === 0 ? "一の位" : `$\\frac{1}{${10 ** j}}$ の位`);
          const x = X / 10;
          const y = Y / 10;
          return {
            q: sig
              ? `${x} ÷ ${y} の商を、四捨五入して、上から2けたのがい数で求めましょう。`
              : `${x} ÷ ${y} の商を、四捨五入して、$\\frac{1}{10}$ の位までのがい数で求めましょう。`,
            ans,
            hint: "求める位の1つ下の位まで計算して、四捨五入しよう。",
            steps: [
              `${x} ÷ ${y} → 両方を10倍して ${X} ÷ ${Y}`,
              `${PN(k + 1)}まで計算すると ${(q1 / 10 ** (k + 1)).toFixed(k + 1)}…`,
              `${PN(k + 1)}を四捨五入して ${ans}`,
            ],
          };
        }),
        t("E5-shosukake-2e", (r) => {
          // 小数倍（何倍かを小数で表す）
          const [A, B, u] = pick(r, [
            ["赤いテープの長さ", "白いテープの長さ", "m"],
            ["バケツAに入る水の量", "バケツBに入る水の量", "L"],
            ["にもつAの重さ", "にもつBの重さ", "kg"],
            ["Aのロープの長さ", "Bのロープの長さ", "m"],
          ]);
          const k = pick(r, [0.4, 0.6, 0.8, 1.2, 1.4, 1.5, 1.6, 1.8, 2.4, 2.5, 3.5, 0.75, 1.25]);
          const Y = r(12, 49);
          if (Y % 10 === 0) return { skip: true };
          const b = Y / 10;
          const a = round(b * k);
          if (!Number.isInteger(round(a * 100, 6))) return { skip: true };
          return {
            q: `${A}は ${a}${u}、${B}は ${b}${u} です。${A}は、${B}の何倍ですか。`,
            ans: k,
            unit: "倍",
            hint: `「${B}の何倍」なので、${B}でわるよ。`,
            steps: [`何倍かは、わり算で求める：${a} ÷ ${b}`, `わる数が整数になるように両方を10倍して ${round(a * 10)} ÷ ${Y} ＝ ${k}`, `${k}倍`],
          };
        }),
        t("E5-shosukake-2f", (r) => {
          // 場面に合う式を選ぶ（かけ算か、わり算か、どちらでわるか）
          const T = "\\times";
          const D = "\\div";
          const ex = (a, op, b) => $(`${a} ${op} ${b}`);
          const k = r(0, 4);
          const v = pick(r, [0.4, 0.6, 0.8, 1.5, 2.4, 3.5]);
          let q;
          let ans;
          let wr;
          let rule;
          if (k <= 2) {
            const w = pick(r, [0.6, 0.8, 0.9, 1.2, 1.5]);
            if (w === v) return { skip: true };
            if (k === 0) {
              q = `1L の重さが ${w}kg の油があります。この油 ${v}L の重さを求める式はどれですか。`;
              [ans, wr, rule] = [ex(w, T, v), [ex(w, D, v), ex(v, D, w), ex(w, "+", v)], "1L の重さ × L の数 ＝ 全体の重さ"];
            } else if (k === 1) {
              const W = round(w * v);
              q = `${v}L の重さが ${W}kg の油があります。この油 1L の重さを求める式はどれですか。`;
              [ans, wr, rule] = [ex(W, D, v), [ex(W, T, v), ex(v, D, W), ex(W, "-", v)], "全体の重さ ÷ L の数 ＝ 1L の重さ"];
            } else {
              const W = round(w * r(3, 12));
              q = `${W}kg の米を、1ふくろに ${w}kg ずつ入れます。何ふくろできるかを求める式はどれですか。`;
              [ans, wr, rule] = [ex(W, D, w), [ex(W, T, w), ex(w, D, W), ex(W, "-", w)], "全体の重さ ÷ 1ふくろの重さ ＝ ふくろの数"];
            }
          } else {
            const p = r(6, 15) * 10;
            if (k === 3) {
              q = `1m のねだんが ${p}円のはり金を ${v}m 買います。代金を求める式はどれですか。`;
              [ans, wr, rule] = [ex(p, T, v), [ex(p, D, v), ex(v, D, p), ex(p, "+", v)], "1m のねだん × 長さ ＝ 代金"];
            } else {
              const P = round(p * v);
              q = `はり金 ${v}m の代金は ${P}円です。このはり金 1m のねだんを求める式はどれですか。`;
              [ans, wr, rule] = [ex(P, D, v), [ex(P, T, v), ex(v, D, P), ex(P, "-", v)], "代金 ÷ 長さ ＝ 1m のねだん"];
            }
          }
          return {
            q,
            ans,
            choices: choices4(r, ans, wr),
            hint: "小数を、2 や 3 のようなかんたんな整数におきかえて、どんな式になるか考えてみよう。",
            steps: [`ことばの式：${rule}`, "数が小数でも、整数のときと同じ考え方で式をつくる", `式は ${ans}`],
          };
        }),
      ],
      3: [
        t("E5-shosukake-3a", (r) => {
          const W = r(11, 49);
          const L = r(11, 49);
          if (W % 10 === 0 || L % 10 === 0) return { skip: true };
          const ans = round((W * L) / 100);
          return {
            q: `1m の重さが ${W / 10}kg の鉄のぼうがあります。この鉄のぼう ${L / 10}m の重さは何kgですか。`,
            ans,
            unit: "kg",
            hint: "1m の重さ × 長さ で求められるよ。",
            steps: [`${W / 10} × ${L / 10}`, `${W} × ${L} ＝ ${W * L}、小数点より下は 2 けたで ${ans}`, `${ans}kg`],
          };
        }),
        t("E5-shosukake-3b", (r) => {
          const W = r(11, 99);
          const L = r(12, 35);
          if (W % 10 === 0 || L % 10 === 0) return { skip: true };
          const w = W / 10;
          const total = round((W * L) / 100);
          return {
            q: `${L / 10}m の重さが ${total}kg のぼうがあります。このぼう1m の重さは何kgですか。`,
            ans: w,
            unit: "kg",
            hint: "1m あたりの重さ ＝ 重さ ÷ 長さ",
            steps: [`${total} ÷ ${L / 10}`, `両方を10倍して ${round(total * 10)} ÷ ${L} ＝ ${w}`, `${w}kg`],
          };
        }),
        t("E5-shosukake-3c", (r) => {
          const B = r(11, 25);
          const A = r(30, 99);
          if (B % 10 === 0 || A % 10 === 0) return { skip: true };
          const q = Math.floor(A / B);
          const m10 = A - B * q;
          if (q < 2 || m10 === 0) return { skip: true };
          const m = m10 / 10;
          const ans = `${q}本できて、${m}L あまる`;
          return {
            q: `${A / 10}L のジュースを、${B / 10}L ずつびんに分けます。${B / 10}L 入りのびんは何本できて、何L あまりますか。`,
            ans,
            choices: choices4(r, ans, [`${q}本できて、${m10}L あまる`, `${q}本できて、${round(m / 10)}L あまる`, `${q - 1}本できて、${round(m + B / 10)}L あまる`]),
            hint: "商は一の位まで。あまりの小数点は、わられる数のもとの小数点にそろえるよ。",
            steps: [`${A / 10} ÷ ${B / 10} → ${A} ÷ ${B} と考えて、商は ${q}、あまりは ${m10}`, `あまりの小数点はもとの位置にうつので ${m}`, `たしかめ：${B / 10} × ${q} ＋ ${m} ＝ ${A / 10}`],
          };
        }),
        t("E5-shosukake-3d", (r) => {
          // もとにする量を求める（□ × 小数 ＝ 比べる量）
          const [An, Bn, u] = pick(r, [
            ["赤いテープの長さ", "青いテープの長さ", "m"],
            ["水とうAに入る水の量", "水とうBに入る水の量", "L"],
            ["にもつAの重さ", "にもつBの重さ", "kg"],
            ["きのう走った道のり", "今日走った道のり", "km"],
          ]);
          const k = pick(r, [0.4, 0.6, 0.8, 1.2, 1.4, 1.5, 1.6, 2.5, 3.5]);
          const X = r(11, 49);
          if (X % 10 === 0) return { skip: true };
          const A = X / 10;
          const B = round(A * k);
          return {
            q: `${Bn}は ${B}${u} で、これは${An}の ${k}倍です。${An}は何${u}ですか。`,
            ans: A,
            unit: u,
            hint: `${An}を □${u} として、かけ算の式に表してみよう。`,
            steps: [`${An}を □${u} とすると、□ × ${k} ＝ ${B}`, `□ ＝ ${B} ÷ ${k}`, `＝ ${A}（${u}）`],
          };
        }),
        t("E5-shosukake-3e", (r) => {
          // 小数のわり算のあまりの処理（切り捨て・切り上げ）
          const Y = r(3, 25);
          if (Y % 10 === 0) return { skip: true };
          const X = r(Y * 3 + 1, Math.min(Y * 25, 300));
          const n = Math.floor(X / Y);
          const m10 = X - Y * n;
          if (m10 === 0) return { skip: true };
          const A = X / 10;
          const b = Y / 10;
          const m = m10 / 10;
          if (r(0, 1)) {
            return {
              q: `${A}m のロープから、${b}m のロープを切り取っていきます。${b}m のロープは何本とれますか。`,
              ans: n,
              unit: "本",
              hint: "わり算のあまりの長さで、もう1本とれるかどうか考えよう。",
              steps: [`${A} ÷ ${b} ＝ ${n} あまり ${m}`, `のこりの ${m}m では ${b}m のロープはとれない`, `${n}本`],
            };
          }
          return {
            q: `${A}L のジュースを、${b}L 入るびんに分けて、全部入れます。びんは何本いりますか。`,
            ans: n + 1,
            unit: "本",
            hint: "わり算のあまりの分のジュースも、びんに入れないといけないね。",
            steps: [`${A} ÷ ${b} ＝ ${n} あまり ${m}`, `あまりの ${m}L を入れるびんも、もう1本いる`, `${n} ＋ 1 ＝ ${n + 1}（本）`],
          };
        }),
        t("E5-shosukake-3f", (r) => {
          // 計算のきまりを使って、くふうして計算する
          if (r(0, 1)) {
            const [a, c, pr] = pick(r, [[2.5, 4, 10], [1.25, 8, 10], [12.5, 8, 100], [0.25, 40, 10], [2.5, 40, 100], [0.4, 25, 10], [0.5, 20, 10]]);
            const B = r(11, 99);
            if (B % 10 === 0) return { skip: true };
            const b = B / 10;
            const ans = round(b * pr);
            const [x, y] = r(0, 1) ? [a, c] : [c, a];
            return {
              q: `${x} × ${b} × ${y} を、くふうして計算しましょう。`,
              ans,
              hint: "かけ算は、かける順番をかえても答えは同じ。先にかけるとかんたんになる2つの数はどれかな？",
              steps: ["かけ算は、かける順番をかえても答えは同じ", `${x} × ${y} ＝ ${pr} を先に計算する`, `${b} × ${pr} ＝ ${ans}`],
            };
          }
          const A = r(11, 99);
          if (A % 10 === 0) return { skip: true };
          const a = A / 10;
          const C = r(11, 89);
          if (C % 10 === 0) return { skip: true };
          const c = C / 10;
          const plus = r(0, 1) === 1;
          const d = plus ? 10 : pick(r, [1, 10]);
          const b = plus ? round(10 - c) : round(c + d);
          const ans = round(a * d);
          const op = plus ? "＋" : "−";
          return {
            q: `${a} × ${b} ${op} ${a} × ${c} を、くふうして計算しましょう。`,
            ans,
            hint: `${a} が2回出てくるね。まとめて計算できないかな？`,
            steps: [`${a} × ${b} ${op} ${a} × ${c} ＝ ${a} × (${b} ${op} ${c})`, `＝ ${a} × ${d}`, `＝ ${ans}`],
          };
        }),
      ],
      4: [
        t("E5-shosukake-4a", (r) => {
          const p = pick(r, [2.5, 1.5, 0.5, 1.2, 0.4, 0.8]);
          const w = r(2, 20);
          const x = round(w * p);
          const ans = round(x * p);
          return {
            q: `ある数に ${p} をかけるところを、まちがえて ${p} でわってしまったので、答えが ${w} になりました。正しい答えはいくつですか。`,
            ans,
            hint: "まず、まちがえた計算を逆にたどって「ある数」を求めよう。",
            steps: [`ある数 ÷ ${p} ＝ ${w} だから、ある数 ＝ ${w} × ${p} ＝ ${x}`, `正しい答えは ${x} × ${p} ＝ ${ans}`],
          };
        }),
        t("E5-shosukake-4b", (r) => {
          // 4まいのカードで「□.□ × □.□」をつくり、積をいちばん大きく（小さく）する
          const ds = sample(r, [1, 2, 3, 4, 5, 6, 7, 8, 9], 4).sort((x, y) => y - x);
          const big = r(0, 1) === 1;
          const perms = (arr) => (arr.length <= 1 ? [arr] : arr.flatMap((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p])));
          let best = null;
          for (const [p1, p2, p3, p4] of perms(ds)) {
            const v = (p1 * 10 + p2) * (p3 * 10 + p4);
            if (best === null || (big ? v > best : v < best)) best = v;
          }
          // a, b を一の位に、c, d を 1/10 の位に入れる
          const [a, b, c, d] = big ? ds : [...ds].reverse();
          const v1 = (a * 10 + c) * (b * 10 + d);
          const v2 = (a * 10 + d) * (b * 10 + c);
          if ((big ? Math.max(v1, v2) : Math.min(v1, v2)) !== best) return { skip: true };
          const ans = round(best / 100);
          return {
            q: `4まいのカード ${shuffle(r, ds).join("、")} があります。「□.□ × □.□」の □ に、カードを1まいずつ入れて、小数のかけ算の式をつくります。積がいちばん${big ? "大きく" : "小さく"}なるときの積を求めましょう。`,
            ans,
            hint: big ? "一の位と $\\frac{1}{10}$ の位、どちらに大きい数字を入れると積が大きくなるかな？" : "一の位と $\\frac{1}{10}$ の位、どちらに小さい数字を入れると積が小さくなるかな？",
            steps: [
              `積を${big ? "大きく" : "小さく"}するには、${big ? "大きい" : "小さい"}数字 ${a} と ${b} を一の位に入れる`,
              `のこりの ${c} と ${d} の入れ方は2通り：${a}.${c} × ${b}.${d} ＝ ${round(v1 / 100)}、${a}.${d} × ${b}.${c} ＝ ${round(v2 / 100)}`,
              `${big ? "大きい" : "小さい"}ほうで ${ans}`,
            ],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E5-baisu",
    grade: "E5",
    area: "num",
    name: "倍数と約数",
    desc: "公倍数・公約数・偶数奇数",
    prereqs: ["E4-warihissan"],
    points: [
      "ある数に 1、2、3、… をかけてできる数を倍数、ある数をわり切ることができる整数を約数というよ。",
      "いくつかの数に共通な倍数が公倍数。そのうちいちばん小さいものが最小公倍数。",
      "いくつかの数に共通な約数が公約数。そのうちいちばん大きいものが最大公約数。",
      "2でわり切れる整数が偶数、わり切れない整数が奇数だよ。",
    ],
    levels: {
      1: [
        t("E5-baisu-1a", (r) => {
          const [a, b] = sample(r, [2, 3, 4, 5, 6, 8, 9, 10, 12], 2);
          const L = lcm(a, b);
          const big = Math.max(a, b);
          const small = Math.min(a, b);
          return {
            q: `${a} と ${b} の最小公倍数を求めましょう。`,
            ans: L,
            hint: `大きいほうの ${big} の倍数を順に書いて、${small} でわり切れるものをさがそう。`,
            steps: [`${big} の倍数：${[1, 2, 3, 4, 5].map((k) => big * k).join("、")}、…`, `このうち ${small} でもわり切れるいちばん小さい数は ${L}`],
          };
        }),
        t("E5-baisu-1b", (r) => {
          const g = r(2, 9);
          const [m, n] = sample(r, [1, 2, 3, 4, 5, 7], 2);
          const a = g * m;
          const b = g * n;
          const G = gcd(a, b);
          const small = Math.min(a, b);
          const big = Math.max(a, b);
          return {
            q: `${a} と ${b} の最大公約数を求めましょう。`,
            ans: G,
            hint: `小さいほうの ${small} の約数を書いて、${big} もわり切れるものをさがそう。`,
            steps: [`${small} の約数：${divisors(small).join("、")}`, `このうち ${big} もわり切れるいちばん大きい数は ${G}`],
          };
        }),
        t("E5-baisu-1c", (r) => {
          const n = pick(r, [6, 8, 10, 12, 15, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48]);
          const ds = divisors(n);
          return {
            q: `${n} の約数は全部で何こありますか。`,
            ans: ds.length,
            unit: "こ",
            hint: `${n} ＝ □ × □ となる組を、1 × ${n} から順にさがそう。`,
            steps: [`${n} の約数：${ds.join("、")}`, `全部で ${ds.length} こ`],
          };
        }),
        t("E5-baisu-1d", (r) => {
          // 倍数を選ぶ（約数ととりちがえる・一の位だけ見る などの誤答）
          const a = pick(r, [3, 4, 6, 7, 8, 9, 12, 15]);
          const k = r(3, 12);
          const ans = a * k;
          if (ans > 150) return { skip: true };
          const ok = (x) => x > 0 && x % a !== 0;
          const ds = divisors(a).filter((x) => x !== a && x !== 1);
          const wr = [ds.length ? pick(r, ds) : 1, ans + 1, ans - 1, ans + (a % 2 === 0 ? a / 2 : 2), 10 * r(1, 9) + (a % 10)].filter(ok);
          return {
            q: `次の数のうち、${a} の倍数はどれですか。`,
            ans,
            choices: choices4(r, ans, wr, (i) => (ok(ans + i + 2) ? ans + i + 2 : null)),
            hint: `${a} でわり切れるかどうかを調べよう。`,
            steps: [`${a} の倍数は、${a} × 1、${a} × 2、${a} × 3、… のように ${a} でわり切れる数`, `${ans} ＝ ${a} × ${k} なので、${ans} は ${a} の倍数`],
          };
        }),
        t("E5-baisu-1e", (r) => {
          // 公約数を全部あげたものを選ぶ
          const g = pick(r, [4, 6, 8, 9, 10, 12, 15, 16, 18]);
          const [m, n] = sample(r, [1, 2, 3, 4, 5, 7], 2);
          if (gcd(m, n) !== 1) return { skip: true };
          const a = g * m;
          const b = g * n;
          if (Math.max(a, b) > 100) return { skip: true };
          const small = Math.min(a, b);
          const big = Math.max(a, b);
          const J = (xs) => xs.join("、");
          const dg = divisors(g);
          const ans = J(dg);
          const L = lcm(a, b);
          return {
            q: `${a} と ${b} の公約数を、全部あげたものはどれですか。`,
            ans,
            choices: choices4(r, ans, [J(divisors(small)), J(dg.slice(1)), J(dg.slice(0, -1)), J([L, L * 2, L * 3])]),
            hint: `小さいほうの ${small} の約数のうち、${big} もわり切れるものをさがそう。`,
            steps: [`${small} の約数：${J(divisors(small))}`, `このうち ${big} もわり切れるのは ${ans}`, `（公約数は、最大公約数 ${g} の約数になっている）`],
          };
        }),
      ],
      2: [
        t("E5-baisu-2a", (r) => {
          const [a, b, c] = sample(r, [2, 3, 4, 5, 6, 8, 9, 10, 12], 3).sort((x, y) => x - y);
          const L = lcm(lcm(a, b), c);
          if (L > 180) return { skip: true };
          return {
            q: `${a}、${b}、${c} の最小公倍数を求めましょう。`,
            ans: L,
            hint: "いちばん大きい数の倍数の中から、ほかの2つの数でもわり切れるものをさがそう。",
            steps: [`${c} の倍数を順に調べる`, `${a} でも ${b} でもわり切れるいちばん小さい数は ${L}`],
          };
        }),
        t("E5-baisu-2b", (r) => {
          const a = r(3, 15);
          const N = r(40, 200);
          const ans = Math.floor(N / a);
          return {
            q: `1から ${N} までの整数のうち、${a} の倍数は何こありますか。`,
            ans,
            unit: "こ",
            hint: `${N} の中に ${a} がいくつあるか、わり算で考えよう。`,
            steps: [`${N} ÷ ${a} ＝ ${ans} あまり ${N % a}`, `${a} × 1 から ${a} × ${ans} までの ${ans} こ`],
          };
        }),
        t("E5-baisu-2c", (r) => {
          const odd = r(0, 1) === 1;
          const make = (isOdd) => 2 * r(50, 4999) + (isOdd ? 1 : 0);
          const ans = make(odd);
          const others = [make(!odd), make(!odd), make(!odd)];
          const choices = choices4(r, ans, others, () => make(!odd));
          return {
            q: `${choices.join("、")} のうち、${odd ? "奇数" : "偶数"}はどれですか。`,
            ans,
            choices,
            hint: "一の位の数字を見ればわかるよ。",
            steps: ["一の位が 0、2、4、6、8 なら偶数、1、3、5、7、9 なら奇数", `${ans} は一の位が ${ans % 10} なので${odd ? "奇数" : "偶数"}`],
          };
        }),
        t("E5-baisu-2d", (r) => {
          // ○番目の公倍数（公倍数は最小公倍数の倍数）
          const [a, b] = sample(r, [2, 3, 4, 5, 6, 8, 9, 10, 12], 2).sort((x, y) => x - y);
          if (b % a === 0) return { skip: true };
          const L = lcm(a, b);
          if (L > 60) return { skip: true };
          const k = r(2, 5);
          return {
            q: `${a} と ${b} の公倍数を、小さいほうから順にならべたとき、${k}番目の数はいくつですか。`,
            ans: L * k,
            hint: "公倍数を小さいほうからいくつか書き出して、どんなきまりがあるか見てみよう。",
            steps: [`${a} と ${b} の最小公倍数は ${L}`, `公倍数は ${L} の倍数になっている：${L}、${L * 2}、${L * 3}、…`, `${k}番目は ${L} × ${k} ＝ ${L * k}`],
          };
        }),
        t("E5-baisu-2e", (r) => {
          // 長方形の紙を、同じ大きさのできるだけ大きい正方形に切り分ける（最大公約数）
          const g = r(2, 12);
          const [m, n] = sample(r, [2, 3, 4, 5, 7], 2).sort((x, y) => x - y);
          if (gcd(m, n) !== 1) return { skip: true };
          const a = g * m;
          const b = g * n;
          if (b > 84) return { skip: true };
          return {
            q: `たて ${a}cm、横 ${b}cm の長方形の紙があります。この紙を、あまりが出ないように、同じ大きさの正方形に切り分けます。できるだけ大きな正方形にするとき、正方形の1辺は何cmにすればよいですか。`,
            ans: g,
            unit: "cm",
            hint: "正方形の1辺の長さで、たての長さも横の長さもわり切れないといけないね。",
            steps: [`正方形の1辺は、${a} と ${b} の公約数`, `できるだけ大きいので、最大公約数の ${g}cm`],
          };
        }),
      ],
      3: [
        t("E5-baisu-3a", (r) => {
          const [a, b] = sample(r, [3, 4, 5, 6, 8, 9, 10, 12, 15], 2).sort((x, y) => x - y);
          const L = lcm(a, b);
          return {
            q: `たて ${a}cm、横 ${b}cm の長方形のカードを、同じ向きにすきまなくならべて、できるだけ小さい正方形をつくります。正方形の1辺は何cmになりますか。`,
            ans: L,
            unit: "cm",
            hint: `正方形の1辺は、${a} の倍数でも ${b} の倍数でもあるね。`,
            steps: [`正方形の1辺は ${a} と ${b} の公倍数`, `できるだけ小さいので最小公倍数の ${L}cm`],
          };
        }),
        t("E5-baisu-3b", (r) => {
          const g = r(3, 12);
          const [m, n] = sample(r, [2, 3, 4, 5, 7], 2);
          const A = g * m;
          const B = g * n;
          if (r(0, 1)) {
            return {
              q: `えんぴつ ${A}本と、ノート ${B}さつを、どちらもあまりが出ないように、できるだけ多くの子どもに同じ数ずつ分けます。何人に分けられますか。`,
              ans: g,
              unit: "人",
              hint: `人数は、${A} の約数でも ${B} の約数でもあるね。`,
              steps: [`人数は ${A} と ${B} の公約数`, `できるだけ多いので最大公約数の ${g}人`],
            };
          }
          return {
            q: `えんぴつ ${A}本と、ノート ${B}さつを、どちらもあまりが出ないように、できるだけ多くの子どもに同じ数ずつ分けます。1人分のえんぴつは何本になりますか。`,
            ans: m,
            unit: "本",
            hint: "まず、何人に分けられるかを最大公約数で求めよう。",
            steps: [`人数は ${A} と ${B} の最大公約数で ${g}人`, `1人分のえんぴつは ${A} ÷ ${g} ＝ ${m}（本）`],
          };
        }),
        t("E5-baisu-3c", (r) => {
          const [a, b] = sample(r, [6, 8, 9, 10, 12, 15, 18, 20], 2).sort((x, y) => x - y);
          const L = lcm(a, b);
          if (L > 120) return { skip: true };
          return {
            q: `駅から、バスAは ${a}分おきに、バスBは ${b}分おきに出発します。午前8時にAとBが同時に出発しました。次に同時に出発するのは、何分後ですか。`,
            ans: L,
            unit: "分後",
            hint: `同時に出発するのは、${a} と ${b} の公倍数の時間がたったときだね。`,
            steps: [`${a} と ${b} の公倍数の時間ごとに同時に出発する`, `次は最小公倍数の ${L}分後`],
          };
        }),
        t("E5-baisu-3d", (r) => {
          // しきつめるまい数（最大公約数・最小公倍数を使って2段階で）
          if (r(0, 1)) {
            const g = pick(r, [6, 8, 10, 12, 15, 20]);
            const [m, n] = sample(r, [2, 3, 4, 5, 7], 2).sort((x, y) => x - y);
            if (gcd(m, n) !== 1) return { skip: true };
            const a = g * m;
            const b = g * n;
            return {
              q: `たて ${a}cm、横 ${b}cm の長方形の板に、同じ大きさの正方形のタイルを、すきまなくしきつめます。できるだけ大きなタイルを使うとき、タイルは何まいいりますか。`,
              ans: m * n,
              unit: "まい",
              hint: "まず、タイルの1辺の長さを考えよう。",
              steps: [`タイルの1辺は ${a} と ${b} の最大公約数で ${g}cm`, `たてに ${a} ÷ ${g} ＝ ${m}（まい）、横に ${b} ÷ ${g} ＝ ${n}（まい）ならぶ`, `${m} × ${n} ＝ ${m * n}（まい）`],
            };
          }
          const [a, b] = sample(r, [3, 4, 5, 6, 8, 9, 10, 12], 2).sort((x, y) => x - y);
          if (b % a === 0) return { skip: true };
          const L = lcm(a, b);
          if (L > 72) return { skip: true };
          return {
            q: `たて ${a}cm、横 ${b}cm の長方形のカードを、同じ向きにすきまなくならべて、できるだけ小さい正方形をつくります。カードは何まいいりますか。`,
            ans: (L / a) * (L / b),
            unit: "まい",
            hint: "まず、できる正方形の1辺の長さを考えよう。",
            steps: [`正方形の1辺は ${a} と ${b} の最小公倍数で ${L}cm`, `たてに ${L} ÷ ${a} ＝ ${L / a}（まい）、横に ${L} ÷ ${b} ＝ ${L / b}（まい）ならぶ`, `${L / a} × ${L / b} ＝ ${(L / a) * (L / b)}（まい）`],
          };
        }),
        t("E5-baisu-3e", (r) => {
          // あまりが出る分け方（あまりをのぞいてから公約数を考える）
          const g = r(5, 15);
          const [m, n] = sample(r, [2, 3, 4, 5, 7], 2);
          if (gcd(m, n) !== 1) return { skip: true };
          const ra = r(1, Math.min(4, g - 1));
          const rb = r(1, Math.min(4, g - 1));
          const [x, ux, y, uy] = pick(r, [["あめ", "こ", "ガム", "こ"], ["えんぴつ", "本", "けしゴム", "こ"], ["画用紙", "まい", "色紙", "まい"]]);
          const A = g * m + ra;
          const B = g * n + rb;
          return {
            q: `${x}が ${A}${ux}、${y}が ${B}${uy} あります。何人かの子どもに、${x}も${y}も、それぞれ同じ数ずつ配ったら、${x}は ${ra}${ux}、${y}は ${rb}${uy} あまりました。子どもの人数は、いちばん多くて何人と考えられますか。`,
            ans: g,
            unit: "人",
            hint: "あまった分を先にのぞくと、ちょうど分けられたことになるね。",
            steps: [`配った数：${x}は ${A} − ${ra} ＝ ${A - ra}（${ux}）、${y}は ${B} − ${rb} ＝ ${B - rb}（${uy}）`, `子どもの人数は、${A - ra} と ${B - rb} の公約数`, `いちばん多いのは最大公約数の ${g}人（あまりの数より大きいので、あっている）`],
          };
        }),
        t("E5-baisu-3f", (r) => {
          // 決まったはんいにある公倍数の個数
          const [a, b] = sample(r, [2, 3, 4, 5, 6, 8, 9, 10, 12], 2).sort((x, y) => x - y);
          if (b % a === 0) return { skip: true };
          const L = lcm(a, b);
          if (L > 60) return { skip: true };
          const N = r(5, 30) * 10;
          const n = Math.floor(N / L);
          if (n < 2) return { skip: true };
          return {
            q: `1から ${N} までの整数のうち、${a} でも ${b} でもわり切れる数は何こありますか。`,
            ans: n,
            unit: "こ",
            hint: `${a} でも ${b} でもわり切れる数は、${a} と ${b} の何といえるかな？`,
            steps: [`${a} でも ${b} でもわり切れる数は、${a} と ${b} の公倍数で、最小公倍数 ${L} の倍数`, `${N} ÷ ${L} ＝ ${n} あまり ${N % L}`, `${L} × 1 から ${L} × ${n} までの ${n}こ`],
          };
        }),
      ],
      4: [
        t("E5-baisu-4a", (r) => {
          const [a, b] = sample(r, [3, 4, 5, 6, 7, 8, 9], 2).sort((x, y) => x - y);
          const L = lcm(a, b);
          if (L > 60) return { skip: true };
          const m = r(1, a - 1);
          const x = m + L * Math.ceil((100 - m) / L);
          return {
            q: `${a} でわっても ${b} でわっても ${m} あまる整数のうち、いちばん小さい3けたの数はいくつですか。`,
            ans: x,
            hint: `その数から ${m} をひくと、${a} でも ${b} でもわり切れるね。`,
            steps: [`□ − ${m} は ${a} と ${b} の公倍数、つまり ${L} の倍数`, `${L} の倍数に ${m} をたした数で、3けたのいちばん小さいものをさがす`, `${L} × ${(x - m) / L} ＋ ${m} ＝ ${x}`],
          };
        }),
        t("E5-baisu-4b", (r) => {
          const [a, b] = sample(r, [2, 3, 4, 5, 6, 7], 2).sort((x, y) => x - y);
          const N = r(5, 20) * 10;
          const L = lcm(a, b);
          const na = Math.floor(N / a);
          const nb = Math.floor(N / b);
          const nl = Math.floor(N / L);
          const ans = N - (na + nb - nl);
          return {
            q: `1から ${N} までの整数のうち、${a} でも ${b} でもわり切れない数は何こありますか。`,
            ans,
            unit: "こ",
            hint: `${a} の倍数と ${b} の倍数を数えよう。両方の倍数を2回数えないように注意。`,
            steps: [`${a} の倍数は ${na} こ、${b} の倍数は ${nb} こ、両方の倍数（${L} の倍数）は ${nl} こ`, `${a} か ${b} でわり切れる数は ${na} ＋ ${nb} − ${nl} ＝ ${na + nb - nl}（こ）`, `${N} − ${na + nb - nl} ＝ ${ans}（こ）`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E5-bunsu",
    grade: "E5",
    area: "num",
    name: "分数のたし算・ひき算",
    desc: "通分・約分",
    prereqs: ["E5-baisu", "E4-bunsu"],
    points: [
      "分母がちがう分数のたし算・ひき算は、通分（分母をそろえる）してから計算するよ。分母は最小公倍数にするとかんたん。",
      "答えが約分できるときは、分母と分子を最大公約数でわって、かんたんな分数にしよう。",
      "分子どうし・分母どうしをたすのはまちがい！ $\\frac{1}{2}+\\frac{1}{3}$ は $\\frac{2}{5}$ ではなく $\\frac{5}{6}$。",
    ],
    levels: {
      1: [
        t("E5-bunsu-1a", (r) => {
          const q = r(3, 12);
          let p = r(1, q - 1);
          while (gcd(p, q) !== 1) p = r(1, q - 1);
          const k = r(2, 6);
          return {
            q: `$\\frac{${p * k}}{${q * k}}$ を約分しましょう。`,
            ans: fracAns(p, q),
            hint: "分母と分子を、同じ数（最大公約数）でわろう。",
            steps: [`${p * k} と ${q * k} の最大公約数は ${k}`, `分母と分子を ${k} でわって $\\frac{${p}}{${q}}$`],
          };
        }),
        t("E5-bunsu-1b", (r) => {
          const [b, d] = sample(r, [2, 3, 4, 5, 6, 8, 9, 10], 2);
          const [a1, b1] = reduce(r(1, Math.ceil(b / 2)), b);
          const [c1, d1] = reduce(r(1, Math.ceil(d / 2)), d);
          if (b1 === d1) return { skip: true };
          const L = lcm(b1, d1);
          const n = a1 * (L / b1) + c1 * (L / d1);
          if (n >= L) return { skip: true };
          return {
            q: `$\\frac{${a1}}{${b1}}+\\frac{${c1}}{${d1}}$ を計算しましょう。`,
            ans: fracAns(n, L),
            hint: `${b1} と ${d1} の最小公倍数で通分しよう。`,
            steps: [`分母を ${L} にそろえる：$\\frac{${a1 * (L / b1)}}{${L}}+\\frac{${c1 * (L / d1)}}{${L}}$`, `$=\\frac{${n}}{${L}}${gcd(n, L) > 1 ? `=${fracTex(n, L)}` : ""}$`],
          };
        }),
        t("E5-bunsu-1c", (r) => {
          const [b, d] = sample(r, [2, 3, 4, 5, 6, 8, 9, 10], 2);
          let [a1, b1] = reduce(r(1, b - 1), b);
          let [c1, d1] = reduce(r(1, d - 1), d);
          if (b1 === d1 || a1 * d1 === c1 * b1) return { skip: true };
          if (a1 * d1 < c1 * b1) [a1, b1, c1, d1] = [c1, d1, a1, b1];
          const L = lcm(b1, d1);
          const n = a1 * (L / b1) - c1 * (L / d1);
          return {
            q: `$\\frac{${a1}}{${b1}}-\\frac{${c1}}{${d1}}$ を計算しましょう。`,
            ans: fracAns(n, L),
            hint: `${b1} と ${d1} の最小公倍数で通分しよう。`,
            steps: [`分母を ${L} にそろえる：$\\frac{${a1 * (L / b1)}}{${L}}-\\frac{${c1 * (L / d1)}}{${L}}$`, `$=\\frac{${n}}{${L}}${gcd(n, L) > 1 ? `=${fracTex(n, L)}` : ""}$`],
          };
        }),
        t("E5-bunsu-1d", (r) => {
          // 等しい分数の □ にあてはまる数
          const d = r(2, 9);
          const n = numer(r, d);
          const k = r(2, 8);
          const S = "\\square";
          const f = r(0, 2);
          const [L, R, ans, st] =
            f === 0
              ? [`\\frac{${n}}{${d}}`, `\\frac{${S}}{${d * k}}`, n * k, [`分母が ${d} から ${d * k} へ、${k}倍になっている`, `分子も ${k}倍して ${n} × ${k} ＝ ${n * k}`]]
              : f === 1
                ? [`\\frac{${n}}{${d}}`, `\\frac{${n * k}}{${S}}`, d * k, [`分子が ${n} から ${n * k} へ、${k}倍になっている`, `分母も ${k}倍して ${d} × ${k} ＝ ${d * k}`]]
                : [`\\frac{${n * k}}{${d * k}}`, `\\frac{${S}}{${d}}`, n, [`分母が ${d * k} から ${d} へ、${k} でわった数になっている`, `分子も ${k} でわって ${n * k} ÷ ${k} ＝ ${n}`]];
          return {
            q: `$${L}=${R}$ の □ にあてはまる数を求めましょう。`,
            ans,
            hint: "分母と分子に同じ数をかけても、分母と分子を同じ数でわっても、分数の大きさは変わらないよ。",
            steps: st,
          };
        }),
        t("E5-bunsu-1e", (r) => {
          // 通分したものを選ぶ（分子をそのまま・分母の積・片方だけ などの誤答）
          const [b, d] = sample(r, [2, 3, 4, 5, 6, 8, 9, 10, 12], 2).sort((x, y) => x - y);
          const L = lcm(b, d);
          if (L > 36) return { skip: true };
          const a = numer(r, b);
          const c = numer(r, d);
          const A = a * (L / b);
          const C = c * (L / d);
          const pair = (x, y, z, w) => `$\\frac{${x}}{${y}}$ と $\\frac{${z}}{${w}}$`;
          const ans = pair(A, L, C, L);
          const wr = [pair(a, L, c, L), L !== b * d ? pair(a * d, b * d, c * b, b * d) : null, pair(A, L, c, L), pair(a, L, C, L), pair(a + L - b, L, c + L - d, L)];
          const conv = (x, y, X) => (L === y ? `$\\frac{${x}}{${y}}$ はそのまま` : `$\\frac{${x}}{${y}}=\\frac{${x}\\times${L / y}}{${y}\\times${L / y}}=\\frac{${X}}{${L}}$`);
          return {
            q: `$\\frac{${a}}{${b}}$ と $\\frac{${c}}{${d}}$ を、分母ができるだけ小さくなるように通分したものはどれですか。`,
            ans,
            choices: choices4(r, ans, wr),
            hint: `分母を、${b} と ${d} の最小公倍数にそろえよう。`,
            steps: [`分母は ${b} と ${d} の最小公倍数の ${L}`, conv(a, b, A), conv(c, d, C)],
          };
        }),
      ],
      2: [
        t("E5-bunsu-2a", (r) => {
          const [b, d] = sample(r, [2, 3, 4, 5, 6, 7, 8, 9], 2);
          const [a1, b1] = reduce(r(1, b - 1), b);
          const [c1, d1] = reduce(r(1, d - 1), d);
          if (b1 === d1) return { skip: true };
          const L = lcm(b1, d1);
          const n = a1 * (L / b1) + c1 * (L / d1);
          const { ans, choices } = fracChoices(r, [n, L], [[a1 + c1, b1 + d1], [a1 + c1, L], [a1 * (L / b1) + c1, L], [a1 + c1 * (L / d1), L]]);
          return {
            q: `$\\frac{${a1}}{${b1}}+\\frac{${c1}}{${d1}}$ を計算すると、どれになりますか。`,
            ans,
            choices,
            hint: "分子どうし・分母どうしをたしてはいけないよ。まず通分しよう。",
            steps: [`分母を ${L} にそろえる：$\\frac{${a1 * (L / b1)}}{${L}}+\\frac{${c1 * (L / d1)}}{${L}}=\\frac{${n}}{${L}}$`, gcd(n, L) > 1 ? `約分して ${ans}` : `答え ${ans}`],
          };
        }),
        t("E5-bunsu-2b", (r) => {
          const [b, d] = sample(r, [2, 3, 4, 5, 6, 8, 9, 10], 2);
          const [p, q1] = reduce(r(1, b - 1), b);
          const [s, q2] = reduce(r(1, d - 1), d);
          if (q1 === q2) return { skip: true };
          const w1 = r(1, 4);
          const w2 = r(1, 3);
          const plus = r(0, 1) === 1;
          const L = lcm(q1, q2);
          const N1 = w1 * L + p * (L / q1);
          const N2 = w2 * L + s * (L / q2);
          if (!plus && N1 <= N2) return { skip: true };
          const N = plus ? N1 + N2 : N1 - N2;
          const ans = $(mixTex(N, L));
          const W = plus ? w1 + w2 : w1 - w2;
          const naive = (w, nn, dd) => (nn > 0 && dd > 1 && nn < dd ? `$${w > 0 ? w : ""}\\frac{${nn}}{${dd}}$` : null);
          const traps = plus
            ? [$(mixTex(N - L, L)), naive(W, p + s, q1 + q2), $(mixTex(N + L, L)), naive(W + 1, p + s, q1 + q2)]
            : [$(mixTex(N + L, L)), N > L ? $(mixTex(N - L, L)) : null, naive(W, Math.abs(p - s), Math.abs(q1 - q2)), $(mixTex(N + 1, L))];
          return {
            q: `$${w1}\\frac{${p}}{${q1}}${plus ? "+" : "-"}${w2}\\frac{${s}}{${q2}}$ を計算すると、どれになりますか。`,
            ans,
            choices: choices4(r, ans, traps, (i) => $(mixTex(N + (i % 2 ? -1 : 1) * (Math.floor(i / 2) + 2), L))),
            hint: "分数の部分を通分しよう。仮分数になおして計算してもいいよ。",
            steps: [`仮分数になおして通分すると $\\frac{${N1}}{${L}}${plus ? "+" : "-"}\\frac{${N2}}{${L}}=\\frac{${N}}{${L}}$`, `帯分数になおして（約分もして）${ans}`],
          };
        }),
        t("E5-bunsu-2c", (r) => {
          const k = r(0, 2);
          if (k === 0) {
            const [p, q] = pick(r, [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [3, 20], [7, 20], [9, 25], [7, 4], [9, 5], [5, 2]]);
            return {
              q: `$\\frac{${p}}{${q}}$ を小数で表しましょう。`,
              ans: round(p / q),
              hint: "分数は「分子 ÷ 分母」のわり算で小数になおせるよ。",
              steps: [`${p} ÷ ${q} ＝ ${round(p / q)}`],
            };
          }
          if (k === 1) {
            const n = pick(r, [r(1, 9), r(11, 99)]);
            if (n % 10 === 0) return { skip: true };
            const d = n < 10 ? 10 : 100;
            return {
              q: `${n / d} を分数で表しましょう。（約分できるときは約分しよう）`,
              ans: fracAns(n, d),
              hint: d === 10 ? "0.1 ＝ $\\frac{1}{10}$ だよ。" : "0.01 ＝ $\\frac{1}{100}$ だよ。",
              steps: [`${n / d} ＝ $\\frac{${n}}{${d}}$`, gcd(n, d) > 1 ? `約分して $${fracTex(n, d)}$` : `これ以上約分できないので $${fracTex(n, d)}$`],
            };
          }
          const b = r(3, 12);
          const a = r(1, 20);
          if (a % b === 0) return { skip: true };
          return {
            q: `${a} ÷ ${b} の商を分数で表しましょう。`,
            ans: fracAns(a, b),
            hint: "わり算の商は「わられる数を分子、わる数を分母」にした分数で表せるよ。",
            steps: [`${a} ÷ ${b} ＝ $\\frac{${a}}{${b}}$`, gcd(a, b) > 1 ? `約分して $${fracTex(a, b)}$` : "これ以上約分できない"],
          };
        }),
        t("E5-bunsu-2d", (r) => {
          // 分数倍（何倍かを分数で表す）
          const a = r(2, 12);
          const b = r(2, 12);
          if (a === b || a % b === 0) return { skip: true };
          const [X, Y, u] = pick(r, [
            ["赤いテープの長さ", "白いテープの長さ", "m"],
            ["水とうAに入る水の量", "水とうBに入る水の量", "L"],
            ["にもつAの重さ", "にもつBの重さ", "kg"],
          ]);
          const red = gcd(a, b) > 1;
          return {
            q: `${X}は ${a}${u}、${Y}は ${b}${u} です。${X}は、${Y}の何倍ですか。分数で答えましょう。`,
            ans: fracAns(a, b),
            unit: "倍",
            hint: `「${Y}の何倍」なので、${Y}でわるよ。わり算の商は分数で表せるね。`,
            steps: [`${Y}をもとにするので ${a} ÷ ${b}`, `${a} ÷ ${b} ＝ $\\frac{${a}}{${b}}$${red ? ` ＝ $${fracTex(a, b)}$（約分）` : ""}`, `$${fracTex(a, b)}$倍`],
          };
        }),
        t("E5-bunsu-2e", (r) => {
          // 分数と小数の大小をくらべる
          const F = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [3, 8], [5, 8], [7, 8], [4, 9], [3, 10], [7, 10]];
          const fr = sample(r, F, 2);
          const fv = fr.map(([p, q]) => p / q);
          const near = round(fv[0] + (r(0, 1) ? 1 : -1) * (r(2, 9) / 100), 2);
          const decs = [near, round(r(10, 95) / 100, 2)];
          const vals = [...fv, ...decs];
          for (let i = 0; i < 4; i++) {
            if (vals[i] <= 0 || vals[i] >= 1) return { skip: true };
            for (let j = 0; j < i; j++) if (Math.abs(vals[i] - vals[j]) < 0.01) return { skip: true };
          }
          const show = [...fr.map(([p, q]) => `$\\frac{${p}}{${q}}$`), ...decs.map(String)];
          const big = r(0, 1) === 1;
          const target = big ? Math.max(...vals) : Math.min(...vals);
          const ans = show[vals.indexOf(target)];
          return {
            q: `${shuffle(r, show).join("、")} のうち、いちばん${big ? "大きい" : "小さい"}数はどれですか。`,
            ans,
            choices: shuffle(r, show),
            hint: "分数を小数になおしてくらべよう。分数は「分子 ÷ 分母」で小数になるよ。",
            steps: [`分数を小数になおす：${fr.map(([p, q]) => `$\\frac{${p}}{${q}}$ ＝ ${decStr(p, q)}`).join("、")}`, `小数どうしでくらべると、いちばん${big ? "大きい" : "小さい"}のは ${ans}`],
          };
        }),
        t("E5-bunsu-2f", (r) => {
          // 時間と分数（○分は何時間・○秒は何分・○時間は何分）
          const k = r(0, 2);
          if (k < 2) {
            const [big, small] = k === 0 ? ["時間", "分"] : ["分", "秒"];
            const m = pick(r, [5, 10, 12, 15, 20, 24, 25, 30, 35, 36, 40, 45, 48, 50, 55]);
            return {
              q: `${m}${small}は何${big}ですか。分数で答えましょう。`,
              ans: fracAns(m, 60),
              unit: big,
              hint: `1${big} ＝ 60${small} だね。1${small}は何${big}かな？`,
              steps: [`1${small} ＝ $\\frac{1}{60}$ ${big}`, `${m}${small} ＝ $\\frac{${m}}{60}$ ${big}${gcd(m, 60) > 1 ? ` ＝ $${fracTex(m, 60)}$ ${big}（約分）` : ""}`],
            };
          }
          const d = pick(r, [2, 3, 4, 5, 6, 10, 12, 15, 20]);
          const n = numer(r, d);
          return {
            q: `$\\frac{${n}}{${d}}$ 時間は何分ですか。`,
            ans: (60 * n) / d,
            unit: "分",
            hint: "1時間 ＝ 60分 をもとに考えよう。",
            steps: [`$\\frac{1}{${d}}$ 時間は 60 ÷ ${d} ＝ ${60 / d}（分）`, `$\\frac{${n}}{${d}}$ 時間は ${60 / d} × ${n} ＝ ${(60 * n) / d}（分）`],
          };
        }),
      ],
      3: [
        t("E5-bunsu-3a", (r) => {
          const ds = sample(r, [2, 3, 4, 5, 6, 8, 9, 10, 12], 3);
          const fs = ds.map((d) => {
            let a = r(1, d - 1);
            while (gcd(a, d) !== 1) a = r(1, d - 1);
            return [a, d];
          });
          const sign = r(0, 1) ? [1, 1, -1] : [1, -1, 1];
          if (sign[1] < 0 && fs[0][0] * fs[1][1] < fs[1][0] * fs[0][1]) [fs[0], fs[1]] = [fs[1], fs[0]];
          const L = fs.reduce((acc, [, d]) => lcm(acc, d), 1);
          if (L > 72) return { skip: true };
          let n = 0;
          for (let i = 0; i < 3; i++) {
            n += sign[i] * fs[i][0] * (L / fs[i][1]);
            if (n <= 0) return { skip: true };
          }
          const expr = fs.map(([a, d], i) => `${i === 0 ? "" : sign[i] > 0 ? "+" : "-"}\\frac{${a}}{${d}}`).join("");
          return {
            q: `$${expr}$ を計算しましょう。`,
            ans: fracAns(n, L),
            hint: "3つの分母の最小公倍数で、まとめて通分しよう。",
            steps: [`分母を ${L} にそろえる：$${fs.map(([a, d], i) => `${i === 0 ? "" : sign[i] > 0 ? "+" : "-"}\\frac{${a * (L / d)}}{${L}}`).join("")}$`, `$=\\frac{${n}}{${L}}${gcd(n, L) > 1 ? `=${fracTex(n, L)}` : ""}$`],
          };
        }),
        t("E5-bunsu-3b", (r) => {
          const [b, d] = sample(r, [2, 3, 4, 5, 6, 8, 10, 12], 2);
          let [a1, b1] = reduce(r(1, b - 1), b);
          let [c1, d1] = reduce(r(1, d - 1), d);
          if (b1 === d1 || a1 * d1 === c1 * b1) return { skip: true };
          const L = lcm(b1, d1);
          if (r(0, 1)) {
            if (a1 * d1 < c1 * b1) [a1, b1, c1, d1] = [c1, d1, a1, b1];
            const n = a1 * (L / b1) - c1 * (L / d1);
            return {
              q: `ジュースが $\\frac{${a1}}{${b1}}$L あります。$\\frac{${c1}}{${d1}}$L 飲むと、のこりは何L になりますか。`,
              ans: fracAns(n, L),
              unit: "L",
              hint: "のこりはひき算。通分してから計算しよう。",
              steps: [`$\\frac{${a1}}{${b1}}-\\frac{${c1}}{${d1}}=\\frac{${a1 * (L / b1)}}{${L}}-\\frac{${c1 * (L / d1)}}{${L}}$`, `$=${fracTex(n, L)}$（L）`],
            };
          }
          const n = a1 * (L / b1) + c1 * (L / d1);
          return {
            q: `家から公園まで $\\frac{${a1}}{${b1}}$km、公園から図書館まで $\\frac{${c1}}{${d1}}$km あります。家から公園を通って図書館まで行くと、道のりは何km ですか。`,
            ans: fracAns(n, L),
            unit: "km",
            hint: "あわせた道のりはたし算。通分してから計算しよう。",
            steps: [`$\\frac{${a1}}{${b1}}+\\frac{${c1}}{${d1}}=\\frac{${a1 * (L / b1)}}{${L}}+\\frac{${c1 * (L / d1)}}{${L}}$`, `$=${fracTex(n, L)}$（km）`],
          };
        }),
        t("E5-bunsu-3c", (r) => {
          const fs = [];
          const seen = new Set();
          let g = 0;
          while (fs.length < 4 && g++ < 50) {
            const d = pick(r, [3, 4, 5, 6, 7, 8, 9, 10, 12]);
            const [a, b] = reduce(r(1, d - 1), d);
            const key = a / b;
            if (b === 1 || seen.has(key)) continue;
            seen.add(key);
            fs.push([a, b]);
          }
          if (fs.length < 4) return { skip: true };
          const big = r(0, 1) === 1;
          const vals = fs.map(([a, b]) => a / b);
          const target = big ? Math.max(...vals) : Math.min(...vals);
          const show = fs.map(([a, b]) => $(`\\frac{${a}}{${b}}`));
          const ans = show[vals.indexOf(target)];
          return {
            q: `${show.join("、")} のうち、いちばん${big ? "大きい" : "小さい"}分数はどれですか。`,
            ans,
            choices: shuffle(r, show),
            hint: "通分して分母をそろえるか、小数になおしてくらべよう。",
            steps: [`小数になおすと（およそ）${fs.map(([a, b]) => `$\\frac{${a}}{${b}}$ → ${round(a / b, 2)}`).join("、")}`, `いちばん${big ? "大きい" : "小さい"}のは ${ans}`],
          };
        }),
        t("E5-bunsu-3d", (r) => {
          // 求差（どちらが何L多いか）
          const [X, Y, u] = pick(r, [["赤いペンキ", "青いペンキ", "L"], ["牛にゅう", "ジュース", "L"], ["さとう", "塩", "kg"]]);
          const [b, d] = sample(r, [2, 3, 4, 5, 6, 8, 9, 10, 12], 2);
          const L = lcm(b, d);
          if (L > 40) return { skip: true };
          const a = numer(r, b);
          const c = numer(r, d);
          const A = a * (L / b);
          const C = c * (L / d);
          if (A === C) return { skip: true };
          const W = A > C ? X : Y;
          const O = A > C ? Y : X;
          const diff = Math.abs(A - C);
          const say = (who, n, m) => (n > 0 && m > 0 ? `${who}が $${fracTex(n, m)}$${u} 多い` : null);
          const ans = say(W, diff, L);
          const nv = [Math.abs(a - c), Math.abs(b - d)];
          return {
            q: `${X}が $\\frac{${a}}{${b}}$${u}、${Y}が $\\frac{${c}}{${d}}$${u} あります。どちらが何${u} 多いですか。`,
            ans,
            choices: choices4(r, ans, [say(O, diff, L), say(W, ...nv), say(W, A + C, L), say(O, ...nv)], (i) => say(W, diff + i + 1, L)),
            hint: "通分して大きさをくらべてから、ひき算でちがいを求めよう。",
            steps: [`通分すると ${X} $\\frac{${A}}{${L}}$${u}、${Y} $\\frac{${C}}{${L}}$${u} なので、${W}のほうが多い`, `ちがいは $\\frac{${Math.max(A, C)}}{${L}}-\\frac{${Math.min(A, C)}}{${L}}=${fracTex(diff, L)}$（${u}）`, `答え ${ans}`],
          };
        }),
        t("E5-bunsu-3e", (r) => {
          // 小数と分数がまじった計算（小数を分数になおす）
          const dec = pick(r, [0.1, 0.3, 0.7, 0.9, 0.5, 0.25, 0.75, 0.2, 0.4, 0.6, 0.8, 0.05, 0.15]);
          const den = Number.isInteger(round(dec * 10)) ? 10 : 100;
          const [n, m] = reduce(round(dec * den), den);
          const q = pick(r, [3, 4, 6, 7, 8, 9, 12]);
          const p = numer(r, q);
          if (m === q) return { skip: true };
          const L = lcm(m, q);
          if (L > 60) return { skip: true };
          const N1 = n * (L / m);
          const N2 = p * (L / q);
          const plus = r(0, 1) === 1;
          if (!plus && N1 === N2) return { skip: true };
          const decFirst = plus ? r(0, 1) === 1 : N1 > N2;
          const N = plus ? N1 + N2 : Math.abs(N1 - N2);
          const op = plus ? "+" : "-";
          const fq = `\\frac{${p}}{${q}}`;
          const expr = decFirst ? `${dec}${op}${fq}` : `${fq}${op}${dec}`;
          const fexpr = decFirst ? `\\frac{${N1}}{${L}}${op}\\frac{${N2}}{${L}}` : `\\frac{${N2}}{${L}}${op}\\frac{${N1}}{${L}}`;
          return {
            q: `$${expr}$ を計算しましょう。答えは分数で表しましょう。`,
            ans: fracAns(N, L),
            hint: "小数を分数になおしてから、通分して計算しよう。",
            steps: [`${dec} ＝ $\\frac{${round(dec * den)}}{${den}}$${round(dec * den) !== n ? ` ＝ $\\frac{${n}}{${m}}$` : ""}`, `通分して $${fexpr}$`, `$=${fracTex(N, L)}$`],
          };
        }),
        t("E5-bunsu-3f", (r) => {
          // 逆思考（はじめはいくつ）
          const [b0, d0] = sample(r, [2, 3, 4, 5, 6, 8, 9, 10, 12], 2);
          const L = lcm(b0, d0);
          if (L > 40) return { skip: true };
          let [a, b, c, d] = [numer(r, b0), b0, numer(r, d0), d0];
          if (r(0, 1)) {
            const N = a * (L / b) + c * (L / d);
            return {
              q: `リボンを $\\frac{${a}}{${b}}$m 使ったので、のこりが $\\frac{${c}}{${d}}$m になりました。リボンは、はじめに何m ありましたか。`,
              ans: fracAns(N, L),
              unit: "m",
              hint: "はじめの長さを □m として、式に表してみよう。",
              steps: [`はじめの長さを □m とすると、□ − $\\frac{${a}}{${b}}$ ＝ $\\frac{${c}}{${d}}$`, `□ ＝ $\\frac{${c}}{${d}}+\\frac{${a}}{${b}}=\\frac{${c * (L / d)}}{${L}}+\\frac{${a * (L / b)}}{${L}}$`, `＝ $${fracTex(N, L)}$（m）`],
            };
          }
          if (a * d === c * b) return { skip: true };
          if (a * d > c * b) [a, b, c, d] = [c, d, a, b]; // 入れた量 a/b ＜ 全部の量 c/d
          const N = c * (L / d) - a * (L / b);
          return {
            q: `水とうにお茶が入っています。そこへお茶を $\\frac{${a}}{${b}}$L たしたら、全部で $\\frac{${c}}{${d}}$L になりました。はじめに何L 入っていましたか。`,
            ans: fracAns(N, L),
            unit: "L",
            hint: "はじめの量を □L として、式に表してみよう。",
            steps: [`はじめの量を □L とすると、□ ＋ $\\frac{${a}}{${b}}$ ＝ $\\frac{${c}}{${d}}$`, `□ ＝ $\\frac{${c}}{${d}}-\\frac{${a}}{${b}}=\\frac{${c * (L / d)}}{${L}}-\\frac{${a * (L / b)}}{${L}}$`, `＝ $${fracTex(N, L)}$（L）`],
          };
        }),
      ],
      4: [
        t("E5-bunsu-4a", (r) => {
          const n = r(4, 9);
          const last = n * (n + 1);
          return {
            q: `$\\frac{1}{2}+\\frac{1}{6}+\\frac{1}{12}+\\cdots+\\frac{1}{${last}}$ を計算しましょう。（分母は $1 \\times 2$、$2 \\times 3$、$3 \\times 4$、… と続きます）`,
            ans: fracAns(n, n + 1),
            hint: "$\\frac{1}{6}=\\frac{1}{2}-\\frac{1}{3}$ のように、2つの分数のひき算に分けられるよ。",
            steps: [`$\\frac{1}{2}=1-\\frac{1}{2}$、$\\frac{1}{6}=\\frac{1}{2}-\\frac{1}{3}$、…、$\\frac{1}{${last}}=\\frac{1}{${n}}-\\frac{1}{${n + 1}}$`, "たすと、とちゅうの分数が消えていく", `$1-\\frac{1}{${n + 1}}=\\frac{${n}}{${n + 1}}$`],
          };
        }),
        t("E5-bunsu-4b", (r) => {
          const d = pick(r, [8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30]);
          const ok = [];
          for (let k = 1; k < d; k++) if (gcd(k, d) === 1) ok.push(k);
          return {
            q: `分母が ${d} の真分数（$\\frac{1}{${d}}$ から $\\frac{${d - 1}}{${d}}$ まで）のうち、それ以上約分できないものは何こありますか。`,
            ans: ok.length,
            unit: "こ",
            hint: `分子が ${d} と 1 以外の公約数をもたないものを数えよう。${d} の約数に注目。`,
            steps: [`${d} の約数（1 以外）：${divisors(d).slice(1).join("、")}`, `分子がこれらと公約数をもたないもの：${ok.length <= 12 ? ok.join("、") : ok.slice(0, 12).join("、") + "、…"}`, `全部で ${ok.length} こ`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E5-heikin",
    grade: "E5",
    area: "data",
    name: "平均",
    desc: "平均＝合計÷個数",
    prereqs: ["E4-shosu"],
    points: [
      "いくつかの数や量を、同じ大きさになるようにならしたものを平均というよ。",
      "平均 ＝ 合計 ÷ 個数。合計 ＝ 平均 × 個数 も使えるようにしよう。",
      "0 のデータも、個数に入れるのをわすれないでね。",
    ],
    levels: {
      1: [
        t("E5-heikin-1a", (r) => {
          const n = r(4, 6);
          const m = r(30, 80);
          const dev = Array.from({ length: n - 1 }, () => r(-9, 9));
          const last = -dev.reduce((a, b) => a + b, 0);
          if (Math.abs(last) > 12) return { skip: true };
          const xs = [...dev, last].map((d) => m + d);
          const [what, u] = pick(r, [["テストの点数", "点"], ["たまごの重さ", "g"], ["ソフトボール投げの記録", "m"]]);
          return {
            q: `${n}回の${what}は ${xs.map((x) => `${x}${u}`).join("、")} でした。平均は何${u}ですか。`,
            ans: m,
            unit: u,
            hint: "平均 ＝ 合計 ÷ 個数",
            steps: [`合計：${xs.join(" ＋ ")} ＝ ${m * n}`, `${m * n} ÷ ${n} ＝ ${m}（${u}）`],
          };
        }),
        t("E5-heikin-1b", (r) => {
          const n = r(3, 8);
          const m = r(55, 95);
          const [what, u] = pick(r, [["テストの平均点", "点"], ["1日に読んだページ数の平均", "ページ"], ["1回のなわとびの平均回数", "回"]]);
          return {
            q: `${n}回分の${what}は ${m}${u}でした。${n}回分の合計は何${u}ですか。`,
            ans: m * n,
            unit: u,
            hint: "合計 ＝ 平均 × 個数",
            steps: [`${m} × ${n} ＝ ${m * n}（${u}）`],
          };
        }),
        t("E5-heikin-1c", (r) => {
          let xs;
          for (let g = 0; g < 50; g++) {
            xs = Array.from({ length: 5 }, () => r(0, 6));
            if (!xs.includes(0)) xs[r(0, 4)] = 0;
            if (xs.reduce((a, b) => a + b, 0) % 5 === 0 && xs.some((x) => x > 0)) break;
            xs = null;
          }
          if (!xs) return { skip: true };
          const sum = xs.reduce((a, b) => a + b, 0);
          const days = ["月", "火", "水", "木", "金"];
          return {
            q: `ある週の、5年1組の欠席者の数を調べました。${days.map((d, i) => `${d}曜日 ${xs[i]}人`).join("、")}。1日平均何人が欠席しましたか。`,
            ans: sum / 5,
            unit: "人",
            hint: "0人の日も、日数（個数）に入れよう。",
            steps: [`合計：${xs.join(" ＋ ")} ＝ ${sum}（人）`, `0人の日もふくめて5日でわる：${sum} ÷ 5 ＝ ${sum / 5}（人）`],
          };
        }),
        t("E5-heikin-1d", (r) => {
          // 個数 ＝ 合計 ÷ 平均
          const [item, lo, hi] = pick(r, [["みかん", 80, 120], ["くり", 15, 25], ["たまご", 55, 65], ["いちご", 12, 20], ["じゃがいも", 120, 180]]);
          const m = r(lo, hi);
          const n = r(8, 40);
          const M = m * n;
          return {
            q: `${item}1こあたりの重さは、平均 ${m}g です。この${item}を何こか集めて重さをはかったら、${M}g でした。${item}はおよそ何こありますか。`,
            ans: n,
            unit: "こ",
            hint: "「平均 × 個数 ＝ 合計」の式で、わからないのはどれかな？",
            steps: ["個数 ＝ 合計 ÷ 平均", `${M} ÷ ${m} ＝ ${n}（こ）`],
          };
        }),
        t("E5-heikin-1e", (r) => {
          // 平均の意味（かならず言えることを選ぶ）
          const n = r(4, 8);
          let q;
          let ans;
          let wr;
          let m;
          if (r(0, 1)) {
            m = r(3, 12);
            q = `${n}人が1か月に読んだ本のさつ数の平均は ${m}さつでした。`;
            ans = `${n}人が読んだ本は、あわせて ${n * m}さつ`;
            wr = [`${n}人全員が、${m}さつずつ読んだ`, `${m}さつ読んだ人が、かならず1人はいる`, `${m}さつより多く読んだ人と、少なく読んだ人は、同じ人数`];
          } else {
            m = r(10, 30);
            const name = pick(r, NAMES);
            q = `${name}さんが ${n}日間に読んだ本のページ数の平均は、1日 ${m}ページでした。`;
            ans = `${n}日間で、あわせて ${n * m}ページ読んだ`;
            wr = [`毎日 ${m}ページずつ読んだ`, `${m}ページ読んだ日が、かならず1日はある`, `${m}ページより多く読んだ日と、少なく読んだ日は、同じ日数`];
          }
          return {
            q: `${q}このことから、かならず言えることはどれですか。`,
            ans,
            choices: choices4(r, ans, wr),
            hint: "平均は、全体を同じ大きさにならした数だよ。平均と個数から、何が計算できるかな？",
            steps: [`合計 ＝ 平均 × 個数 なので、${m} × ${n} ＝ ${n * m}`, `だから「${ans}」は、かならず言える`, "平均は、ならした大きさなので、ほかのことは、かならずとは言えない"],
          };
        }),
      ],
      2: [
        t("E5-heikin-2a", (r) => {
          const n = pick(r, [4, 5]);
          const xs = Array.from({ length: n }, () => r(70, 130));
          const sum = xs.reduce((a, b) => a + b, 0);
          const ans = round(sum / n);
          return {
            q: `${n}このみかんの重さをはかると、${xs.map((x) => `${x}g`).join("、")} でした。みかん1こ分の重さは、平均何gですか。`,
            ans,
            unit: "g",
            hint: "平均 ＝ 合計 ÷ 個数。わり切れないときは小数で。",
            steps: [`合計：${xs.join(" ＋ ")} ＝ ${sum}（g）`, `${sum} ÷ ${n} ＝ ${ans}（g）`],
          };
        }),
        t("E5-heikin-2b", (r) => {
          let xs;
          for (let g = 0; g < 50; g++) {
            xs = Array.from({ length: 6 }, () => r(5, 25));
            xs[r(0, 5)] = 0;
            if (xs.reduce((a, b) => a + b, 0) % 6 === 0) break;
            xs = null;
          }
          if (!xs) return { skip: true };
          const sum = xs.reduce((a, b) => a + b, 0);
          const ans = sum / 6;
          return {
            q: `${pick(r, ["ゆうと", "さくら", "はると", "あおい"])}さんが、6日間に読んだ本のページ数は ${xs.join("、")} ページでした。1日平均何ページ読みましたか。`,
            ans,
            choices: numChoices(r, ans, [round(sum / 5, 1), ans + 1, ans - 1]),
            hint: "0ページの日も、日数に入れて考えよう。",
            steps: [`合計：${xs.join(" ＋ ")} ＝ ${sum}（ページ）`, `0ページの日もふくめて6日でわる：${sum} ÷ 6 ＝ ${ans}（ページ）`],
          };
        }),
        t("E5-heikin-2c", (r) => {
          const W = r(500, 650);
          const w = W / 10;
          const n = pick(r, [10, 12, 20, 30]);
          const ans = round(w * n);
          return {
            q: `たまご1こあたりの重さは、平均 ${w}g です。このたまご ${n}こ分の重さは、およそ何gと考えられますか。`,
            ans,
            unit: "g",
            hint: "合計 ＝ 平均 × 個数",
            steps: [`${w} × ${n} ＝ ${ans}（g）`],
          };
        }),
        t("E5-heikin-2d", (r) => {
          // 歩はば（平均）を使って、道のりや歩数を見積もる
          const S = r(52, 72);
          const s = S / 100;
          const u = 100 / gcd(S, 100);
          const n = u * r(Math.ceil(200 / u), Math.floor(900 / u));
          const D = round(s * n);
          const name = pick(r, NAMES);
          const place = pick(r, ["公園", "駅", "図書館", "学校"]);
          if (r(0, 1)) {
            return {
              q: `${name}さんの歩はばは、平均 ${s}m です。家から${place}まで歩いたら ${n}歩でした。家から${place}までは、およそ何m ありますか。`,
              ans: D,
              unit: "m",
              hint: "1歩で平均何m 進むか、わかっているね。",
              steps: ["道のり ＝ 歩はば × 歩数", `${s} × ${n} ＝ ${D}（m）`],
            };
          }
          return {
            q: `${name}さんの歩はばは、平均 ${s}m です。家から${place}までの道のりは ${D}m です。${name}さんが家から${place}まで歩くと、およそ何歩になりますか。`,
            ans: n,
            unit: "歩",
            hint: "道のりの中に、歩はばがいくつ分あるかを考えよう。",
            steps: ["歩数 ＝ 道のり ÷ 歩はば", `${D} ÷ ${s} ＝ ${n}（歩）`],
          };
        }),
        t("E5-heikin-2e", (r) => {
          // 平均から、のこり1人の記録を求める
          const n = r(4, 6);
          const [what, u, lo, hi] = pick(r, [["ソフトボール投げの記録", "m", 18, 35], ["算数のテストの点数", "点", 60, 88], ["1分間にとんだなわとびの回数", "回", 70, 110]]);
          const m = r(lo, hi);
          const xs = Array.from({ length: n - 1 }, () => m + r(-9, 9));
          const sum = xs.reduce((a, b) => a + b, 0);
          const x = n * m - sum;
          if (Math.abs(x - m) > 12 || x <= 0 || (u === "点" && x > 100)) return { skip: true };
          return {
            q: `${n}人の${what}の平均は ${m}${u} でした。そのうち ${n - 1}人の${what}は、${xs.map((v) => `${v}${u}`).join("、")} です。のこりの1人の${what}は何${u}ですか。`,
            ans: x,
            unit: u,
            hint: `まず、${n}人の合計を平均から求めよう。`,
            steps: [`${n}人の合計：${m} × ${n} ＝ ${n * m}（${u}）`, `${n - 1}人の合計：${xs.join(" ＋ ")} ＝ ${sum}（${u}）`, `${n * m} − ${sum} ＝ ${x}（${u}）`],
          };
        }),
        t("E5-heikin-2f", (r) => {
          // くふうして平均を求める（ある重さをこえた分の平均を考える）
          const [item, B] = pick(r, [["たまご", 50], ["トマト", 100], ["じゃがいも", 150], ["りんご", 300]]);
          const n = r(4, 6);
          let es = null;
          for (let g = 0; g < 40 && !es; g++) {
            const xs = Array.from({ length: n }, () => r(1, 19));
            if (xs.reduce((a, b) => a + b, 0) % n === 0) es = xs;
          }
          if (!es) return { skip: true };
          const sum = es.reduce((a, b) => a + b, 0);
          const ans = B + sum / n;
          return {
            q: `${n}この${item}の重さをはかると、${es.map((e) => `${B + e}g`).join("、")} でした。どれも ${B}g より重いので、${B}g をこえた分の平均を考えると、くふうして平均が求められます。${item}1この重さの平均は何gですか。`,
            ans,
            unit: "g",
            hint: `それぞれ ${B}g より何g 重いかを考えて、その平均を求めよう。`,
            steps: [`${B}g をこえた分：${es.join("、")}（g）`, `その平均：(${es.join(" ＋ ")}) ÷ ${n} ＝ ${sum} ÷ ${n} ＝ ${sum / n}（g）`, `${B} ＋ ${sum / n} ＝ ${ans}（g）`],
          };
        }),
      ],
      3: [
        t("E5-heikin-3a", (r) => {
          const n = r(3, 5);
          const m = r(65, 85);
          const M = r(m + 1, m + 5);
          const x = (n + 1) * M - n * m;
          if (x > 100) return { skip: true };
          return {
            q: `${n}回のテストの平均点は ${m}点でした。${n + 1}回目のテストで何点とれば、${n + 1}回の平均点が ${M}点になりますか。`,
            ans: x,
            unit: "点",
            hint: "平均から合計を求めて、ちがいを考えよう。",
            steps: [`${n}回の合計：${m} × ${n} ＝ ${m * n}（点）`, `${n + 1}回の合計：${M} × ${n + 1} ＝ ${M * (n + 1)}（点）`, `${M * (n + 1)} − ${m * n} ＝ ${x}（点）`],
          };
        }),
        t("E5-heikin-3b", (r) => {
          const s = r(50, 70);
          const tenS = s * 10;
          const d1 = r(-15, 15);
          const d2 = r(-15, 15);
          const ms = [tenS + d1, tenS + d2, tenS - d1 - d2].map((x) => x / 100);
          const sum = round(ms[0] + ms[1] + ms[2]);
          return {
            q: `10歩で歩いた長さを3回はかったら、${ms.map((x) => `${x}m`).join("、")} でした。この人の歩はば（1歩の長さ）は、平均何mですか。`,
            ans: s / 100,
            unit: "m",
            hint: "まず10歩の長さの平均を求めて、それを10でわろう。",
            steps: [`10歩の長さの平均：(${ms.join(" ＋ ")}) ÷ 3 ＝ ${sum} ÷ 3 ＝ ${round(sum / 3)}（m）`, `1歩は ${round(sum / 3)} ÷ 10 ＝ ${s / 100}（m）`],
          };
        }),
        t("E5-heikin-3c", (r) => {
          let a;
          let b;
          let x;
          let y;
          let ok = false;
          for (let g = 0; g < 60 && !ok; g++) {
            a = r(10, 20);
            b = r(10, 20);
            x = r(60, 90);
            y = r(60, 90);
            ok = x !== y && a !== b && (a * x + b * y) % (a + b) === 0;
          }
          if (!ok) return { skip: true };
          const ans = (a * x + b * y) / (a + b);
          return {
            q: `あるクラスで算数のテストをしました。男子 ${a}人の平均点は ${x}点、女子 ${b}人の平均点は ${y}点でした。クラス全体の平均点は何点ですか。`,
            ans,
            choices: numChoices(r, ans, [round((x + y) / 2, 1), ans + 1, ans - 1]),
            hint: "平均どうしをたして2でわるのはまちがい。まず、男子と女子それぞれの合計点を求めよう。",
            steps: [`男子の合計 ${a} × ${x} ＝ ${a * x}、女子の合計 ${b} × ${y} ＝ ${b * y}`, `全体の合計 ${a * x + b * y} を、全体の人数 ${a + b} でわる`, `${a * x + b * y} ÷ ${a + b} ＝ ${ans}（点）`],
          };
        }),
        t("E5-heikin-3d", (r) => {
          // 全体の平均と片方の組の平均から、もう片方の組の平均を求める
          let a;
          let b;
          let x;
          let y;
          let ok = false;
          for (let g = 0; g < 80 && !ok; g++) {
            a = r(15, 30);
            b = r(15, 30);
            x = r(60, 90);
            y = r(60, 90);
            ok = x !== y && (a * x + b * y) % (a + b) === 0;
          }
          if (!ok) return { skip: true };
          const N = a + b;
          const M = (a * x + b * y) / N;
          return {
            q: `5年1組と2組の ${N}人が、算数のテストを受けました。2つの組全体の平均点は ${M}点で、1組 ${a}人の平均点は ${x}点でした。2組 ${b}人の平均点は何点ですか。`,
            ans: y,
            unit: "点",
            hint: "平均のままでは、ひき算できないね。まず、合計点で考えよう。",
            steps: [`全体の合計：${M} × ${N} ＝ ${M * N}（点）`, `1組の合計：${x} × ${a} ＝ ${a * x}（点）`, `2組の合計：${M * N} − ${a * x} ＝ ${b * y}（点）`, `2組の平均：${b * y} ÷ ${b} ＝ ${y}（点）`],
          };
        }),
        t("E5-heikin-3e", (r) => {
          // まちがいに気づいたときの、正しい平均
          const n = pick(r, [4, 5, 10]);
          const [what, u, lo, hi] = pick(r, [["体重", "kg", 28, 40], ["テストの点数", "点", 60, 85]]);
          const m = r(lo, hi);
          const x = m + r(-8, 8);
          const y = x + (r(0, 1) ? 1 : -1) * r(2, 9);
          if (y <= 0 || y > 100 || x > 100) return { skip: true };
          const T = n * m - y + x;
          const ans = round(T / n);
          return {
            q: `${n}人の${what}の平均を計算したら ${m}${u} でした。ところが、1人の${what} ${x}${u} を、まちがえて ${y}${u} として計算していたことがわかりました。正しい平均は何${u}ですか。`,
            ans,
            unit: u,
            hint: "まず、まちがえたときの合計を求めて、それを正しい合計になおそう。",
            steps: [`まちがえたときの合計：${m} × ${n} ＝ ${n * m}（${u}）`, `正しい合計：${n * m} − ${y} ＋ ${x} ＝ ${T}（${u}）`, `正しい平均：${T} ÷ ${n} ＝ ${ans}（${u}）`],
          };
        }),
        t("E5-heikin-3f", (r) => {
          // 1日平均のペースで読みつづけると、あと何日かかるか（あまりの処理）
          const n = r(4, 5);
          let xs = null;
          for (let g = 0; g < 40 && !xs; g++) {
            const ys = Array.from({ length: n }, () => r(8, 30));
            if (r(0, 2) === 0) ys[r(0, n - 1)] = 0;
            if (ys.reduce((a, b) => a + b, 0) % n === 0) xs = ys;
          }
          if (!xs) return { skip: true };
          const sum = xs.reduce((a, b) => a + b, 0);
          const avg = sum / n;
          if (avg < 6) return { skip: true };
          const k = r(3, 12);
          const extra = r(1, avg - 1);
          const R = avg * k + extra;
          const P = sum + R;
          const name = pick(r, NAMES);
          return {
            q: `${name}さんは、${P}ページの本を読んでいます。はじめの${n}日間に読んだページ数は、${xs.join("、")} ページでした。この${n}日間の1日平均と同じペースで読みつづけると、のこりを読み終えるのに、あと何日かかりますか。`,
            ans: k + 1,
            unit: "日",
            hint: `まず、はじめの${n}日間の1日平均を求めよう。0ページの日も日数に入れるよ。`,
            steps: [`1日平均：(${xs.join(" ＋ ")}) ÷ ${n} ＝ ${avg}（ページ）`, `のこり：${P} − ${sum} ＝ ${R}（ページ）`, `${R} ÷ ${avg} ＝ ${k} あまり ${extra}`, `あまりの ${extra}ページを読む日もいるので、${k} ＋ 1 ＝ ${k + 1}（日）`],
          };
        }),
      ],
      4: [
        t("E5-heikin-4a", (r) => {
          let A;
          let B;
          let C;
          let ok = false;
          for (let g = 0; g < 60 && !ok; g++) {
            A = 2 * r(14, 24);
            B = 2 * r(14, 24);
            C = 2 * r(14, 24);
            ok = new Set([A, B, C]).size === 3 && (A + B + C) % 3 === 0;
          }
          if (!ok) return { skip: true };
          const p = (A + B) / 2;
          const q = (B + C) / 2;
          const s = (C + A) / 2;
          const [lab, ans, st] = pick(r, [
            ["3人の体重の平均", (A + B + C) / 3, `3人の合計は ${A + B + C}kg、平均は ${A + B + C} ÷ 3 ＝ ${(A + B + C) / 3}（kg）`],
            ["Bさんの体重", B, `Bさん ＝ 3人の合計 − (CさんとAさんの合計) ＝ ${A + B + C} − ${C + A} ＝ ${B}（kg）`],
          ]);
          return {
            q: `A、B、C の3人の体重について、AさんとBさんの平均は ${p}kg、BさんとCさんの平均は ${q}kg、CさんとAさんの平均は ${s}kg です。${lab}は何kgですか。`,
            ans,
            unit: "kg",
            hint: "2人ずつの平均から、2人ずつの合計を出してみよう。3つの合計をたすとどうなるかな？",
            steps: [`2人ずつの合計：A＋B ＝ ${2 * p}、B＋C ＝ ${2 * q}、C＋A ＝ ${2 * s}`, `3つをたすと3人の合計の2倍：${2 * p + 2 * q + 2 * s} ÷ 2 ＝ ${A + B + C}（kg）`, st],
          };
        }),
        t("E5-heikin-4b", (r) => {
          // 平均より D 点高い点を1回とると、平均は何点上がるか（平均との差をならす）
          const n = r(3, 9);
          const k = r(1, 4);
          const D = (n + 1) * k;
          const A = r(60, Math.min(80, 100 - D));
          return {
            q: `これまでに受けた ${n}回のテストの平均点より、ちょうど ${D}点高い点数を、${n + 1}回目のテストでとりました。${n + 1}回の平均点は、${n}回の平均点より何点高くなりましたか。`,
            ans: k,
            unit: "点",
            hint: `${n}回の平均点を ○点 として、${n + 1}回目の点数を「○ ＋ ${D}」と考えてみよう。`,
            steps: [`${n + 1}回目の点数のうち、平均より高い ${D}点の分を、${n + 1}回全部にならす`, `${D} ÷ ${n + 1} ＝ ${k}（点）`, `たしかめ：${n}回の平均が ${A}点なら、(${A} × ${n} ＋ ${A + D}) ÷ ${n + 1} ＝ ${A + k}（点）で、${k}点高い`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E5-tani",
    grade: "E5",
    area: "func",
    name: "単位量あたり・速さ",
    desc: "人口密度・速さ・道のり・時間",
    prereqs: ["E5-shosukake"],
    points: [
      "こみぐあいは「1m² あたりの人数」のように、単位量あたりの大きさでくらべるよ。",
      "人口密度 ＝ 人口 ÷ 面積（km²）。1km² あたりの人口のこと。",
      "速さ ＝ 道のり ÷ 時間、道のり ＝ 速さ × 時間、時間 ＝ 道のり ÷ 速さ。",
      "時速は1時間に、分速は1分間に、秒速は1秒間に進む道のりで表した速さだよ。",
    ],
    levels: {
      1: [
        t("E5-tani-1a", (r) => {
          if (r(0, 1)) {
            const v = r(6, 18) * 5;
            const h = r(2, 5);
            return {
              q: `${v * h}km の道のりを ${h}時間で走る自動車の速さは、時速何kmですか。`,
              ans: v,
              unit: "km",
              hint: "速さ ＝ 道のり ÷ 時間",
              steps: [`${v * h} ÷ ${h} ＝ ${v}`, `時速 ${v}km`],
            };
          }
          const v = r(6, 9) * 10;
          const m = r(5, 20);
          return {
            q: `${v * m}m を ${m}分で歩く人の速さは、分速何mですか。`,
            ans: v,
            unit: "m",
            hint: "速さ ＝ 道のり ÷ 時間",
            steps: [`${v * m} ÷ ${m} ＝ ${v}`, `分速 ${v}m`],
          };
        }),
        t("E5-tani-1b", (r) => {
          const v = r(6, 9) * 10;
          const m = r(5, 25);
          return {
            q: `分速 ${v}m で ${m}分間歩くと、何m 進みますか。`,
            ans: v * m,
            unit: "m",
            hint: "道のり ＝ 速さ × 時間",
            steps: [`${v} × ${m} ＝ ${v * m}（m）`],
          };
        }),
        t("E5-tani-1c", (r) => {
          const v = r(8, 16) * 5;
          const h = r(2, 6);
          return {
            q: `時速 ${v}km で走る自動車が、${v * h}km 進むのに何時間かかりますか。`,
            ans: h,
            unit: "時間",
            hint: "時間 ＝ 道のり ÷ 速さ",
            steps: [`${v * h} ÷ ${v} ＝ ${h}（時間）`],
          };
        }),
      ],
      2: [
        t("E5-tani-2a", (r) => {
          const A = r(12, 95);
          const D = r(12, 90) * 10;
          const P = A * D;
          return {
            q: `面積が ${A}km² で、人口が ${P}人の町があります。この町の人口密度を求めましょう。`,
            ans: D,
            unit: "人",
            hint: "人口密度 ＝ 人口 ÷ 面積（1km² あたりの人口）",
            steps: [`${P} ÷ ${A} ＝ ${D}`, `1km² あたり ${D}人`],
          };
        }),
        t("E5-tani-2b", (r) => {
          const a = r(8, 20);
          const b = r(8, 20);
          const x = r(10, 30);
          const y = r(10, 30);
          if (a === b) return { skip: true };
          const da = x / a;
          const db = y / b;
          const ans = Math.abs(da - db) < 1e-9 ? "どちらも同じ" : da > db ? "Aの部屋" : "Bの部屋";
          return {
            q: `Aの部屋は ${a}m² に ${x}人、Bの部屋は ${b}m² に ${y}人います。1m² あたりの人数で考えると、こんでいるのはどちらですか。`,
            ans,
            choices: shuffle(r, ["Aの部屋", "Bの部屋", "どちらも同じ"]),
            hint: "それぞれ「人数 ÷ 面積」で 1m² あたりの人数を求めよう。",
            steps: [`A：${x} ÷ ${a} ＝ ${approx(x, a)}（人）`, `B：${y} ÷ ${b} ＝ ${approx(y, b)}（人）`, `1m² あたりの人数が多いほうがこんでいる → ${ans}`],
          };
        }),
        t("E5-tani-2c", (r) => {
          const k = r(0, 2);
          if (k === 0) {
            const v = r(1, 15) * 6;
            const ans = (v * 1000) / 60;
            return {
              q: `時速 ${v}km は、分速何m ですか。`,
              ans,
              choices: numChoices(r, ans, [v * 1000, round(v / 60, 2), v * 60, ans * 10]),
              hint: "まず km を m になおしてから、1時間 ＝ 60分 で1分あたりにしよう。",
              steps: [`時速 ${v}km ＝ 時速 ${v * 1000}m`, `1分あたりは ${v * 1000} ÷ 60 ＝ ${ans}`, `分速 ${ans}m`],
            };
          }
          if (k === 1) {
            const v = r(1, 20) * 50;
            const ans = round((v * 60) / 1000);
            return {
              q: `分速 ${v}m は、時速何km ですか。`,
              ans,
              choices: numChoices(r, ans, [v * 60, round(v / 1000, 3), round(ans * 10), round(v / 60, 2)]),
              hint: "1時間 ＝ 60分 で1時間あたりの道のりを出してから、m を km になおそう。",
              steps: [`1時間に進む道のりは ${v} × 60 ＝ ${v * 60}（m）`, `${v * 60}m ＝ ${ans}km`, `時速 ${ans}km`],
            };
          }
          const v = r(2, 25);
          const ans = v * 60;
          return {
            q: `秒速 ${v}m は、分速何m ですか。`,
            ans,
            choices: numChoices(r, ans, [v * 100, round(v / 60, 2), v * 3600, v * 6]),
            hint: "1分 ＝ 60秒 だよ。",
            steps: [`1分間に進む道のりは ${v} × 60 ＝ ${ans}（m）`, `分速 ${ans}m`],
          };
        }),
      ],
      3: [
        t("E5-tani-3a", (r) => {
          const v = r(2, 12) * 6;
          const m = pick(r, [10, 20, 30, 40, 50]);
          const ans = round((v * m) / 60);
          return {
            q: `時速 ${v}km で走る自転車は、${m}分間に何km 進みますか。`,
            ans,
            unit: "km",
            hint: "時速を分速になおすか、分を時間になおしてから計算しよう。",
            steps: [`時速 ${v}km は、1分間に ${v} ÷ 60 ＝ ${round(v / 60)}（km）進む`, `${round(v / 60)} × ${m} ＝ ${ans}（km）`],
          };
        }),
        t("E5-tani-3b", (r) => {
          const v = pick(r, [40, 50, 60, 70, 75, 80]);
          const st = 100 / gcd(v, 100);
          const m = st * r(Math.ceil(6 / st), Math.floor(48 / st));
          const D = v * m;
          return {
            q: `分速 ${v}m で歩くと、${D / 1000}km の道のりを歩くのに何分かかりますか。`,
            ans: m,
            unit: "分",
            hint: "道のりの単位を m にそろえてから、時間 ＝ 道のり ÷ 速さ。",
            steps: [`${D / 1000}km ＝ ${D}m`, `${D} ÷ ${v} ＝ ${m}（分）`],
          };
        }),
        t("E5-tani-3c", (r) => {
          if (r(0, 1)) {
            const k = r(8, 20);
            const L = r(2, 6);
            const L2 = r(3, 12);
            if (L2 === L) return { skip: true };
            return {
              q: `ガソリン ${L}L で ${k * L}km 走る自動車があります。この自動車で ${k * L2}km 走るには、ガソリンは何L いりますか。`,
              ans: L2,
              unit: "L",
              hint: "まず、ガソリン 1L あたり何km 走るかを求めよう。",
              steps: [`1L あたり ${k * L} ÷ ${L} ＝ ${k}（km）走る`, `${k * L2} ÷ ${k} ＝ ${L2}（L）`],
            };
          }
          const p = r(6, 18) * 10;
          const n = r(3, 8);
          const m = r(4, 15);
          if (m === n) return { skip: true };
          return {
            q: `リボン ${n}m の代金は ${p * n}円です。このリボン ${m}m の代金は何円ですか。`,
            ans: p * m,
            unit: "円",
            hint: "まず、1m あたりのねだんを求めよう。",
            steps: [`1m あたり ${p * n} ÷ ${n} ＝ ${p}（円）`, `${p} × ${m} ＝ ${p * m}（円）`],
          };
        }),
      ],
      4: [
        t("E5-tani-4a", (r) => {
          let a;
          let b;
          let H = 0;
          for (let g = 0; g < 60; g++) {
            a = pick(r, [3, 4, 5, 6, 10, 12, 15, 20, 30, 40, 60]);
            b = pick(r, [2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 40]);
            if (a <= b) continue;
            const h = (2 * a * b) / (a + b);
            if (Number.isInteger(h)) {
              H = h;
              break;
            }
          }
          if (!H) return { skip: true };
          const d = lcm(a, b) * r(1, 2);
          return {
            q: `${d}km はなれた町まで、行きは時速 ${a}km、帰りは時速 ${b}km で往復しました。往復の平均の速さは時速何km ですか。`,
            ans: H,
            choices: numChoices(r, H, [(a + b) / 2, a - b, H + 2]),
            hint: "速さの平均は、「(行きの速さ ＋ 帰りの速さ) ÷ 2」ではないよ。往復の道のりと時間を求めよう。",
            steps: [`行き ${d} ÷ ${a} ＝ ${d / a}（時間）、帰り ${d} ÷ ${b} ＝ ${d / b}（時間）`, `往復 ${2 * d}km を ${d / a + d / b}時間で進んだ`, `${2 * d} ÷ ${d / a + d / b} ＝ ${H}、時速 ${H}km`],
          };
        }),
        t("E5-tani-4b", (r) => {
          const a = r(5, 9) * 10;
          const b = r(4, 8) * 10;
          const t0 = r(5, 20);
          if (r(0, 1)) {
            const D = (a + b) * t0;
            return {
              q: `${D}m はなれたところにいる兄と弟が、向かい合って同時に歩きはじめました。兄は分速 ${a}m、弟は分速 ${b}m で歩きます。2人が出会うのは何分後ですか。`,
              ans: t0,
              unit: "分後",
              hint: "1分間に、2人の間のきょりは何m ずつちぢまるかな？",
              steps: [`1分間に 2人の間は ${a} ＋ ${b} ＝ ${a + b}（m）ずつちぢまる`, `${D} ÷ ${a + b} ＝ ${t0}（分後）`],
            };
          }
          if (a <= b) return { skip: true };
          const D = (a - b) * t0;
          return {
            q: `弟が家を出てから何分かたったとき、弟は家から ${D}m 先を歩いていました。このとき兄が家を出て、弟を追いかけました。弟は分速 ${b}m、兄は分速 ${a}m で歩きます。兄が弟に追いつくのは、兄が家を出てから何分後ですか。`,
            ans: t0,
            unit: "分後",
            hint: "1分間に、2人の間のきょりは何m ずつちぢまるかな？",
            steps: [`1分間に 2人の間は ${a} − ${b} ＝ ${a - b}（m）ずつちぢまる`, `${D} ÷ ${a - b} ＝ ${t0}（分後）`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E5-wariai",
    grade: "E5",
    area: "func",
    name: "割合と百分率",
    desc: "比べる量・もとにする量・％・歩合",
    prereqs: ["E5-shosukake"],
    points: [
      "割合 ＝ 比べる量 ÷ もとにする量。「〜の何倍」の「〜」がもとにする量だよ。",
      "比べる量 ＝ もとにする量 × 割合、もとにする量 ＝ 比べる量 ÷ 割合。",
      "割合の 0.01 を 1％（百分率）という。歩合では 0.1 が1割、0.01 が1分、0.001 が1厘。",
    ],
    levels: {
      1: [
        t("E5-wariai-1a", (r) => {
          const p = r(1, 19) * 5;
          const A = pick(r, [20, 40, 60, 80, 100, 120, 200]);
          const B = (A * p) / 100;
          if (!Number.isInteger(B)) return { skip: true };
          return {
            q: `定員 ${A}人のバスに ${B}人乗っています。乗っている人数は、定員をもとにすると、どれだけの割合ですか。小数で答えましょう。`,
            ans: round(p / 100),
            hint: "割合 ＝ 比べる量 ÷ もとにする量。もとにする量は定員だよ。",
            steps: [`比べる量 ${B}人、もとにする量 ${A}人`, `${B} ÷ ${A} ＝ ${round(p / 100)}`],
          };
        }),
        t("E5-wariai-1b", (r) => {
          const k = r(0, 1);
          const P = r(1, 150);
          if (k === 0) {
            return {
              q: `割合を表す小数 ${round(P / 100)} を、百分率で表しましょう。`,
              ans: P,
              unit: "％",
              hint: "割合の 1 は 100％、0.01 は 1％ だよ。",
              steps: [`${round(P / 100)} × 100 ＝ ${P}`, `${P}％`],
            };
          }
          return {
            q: `${P}％ を、割合を表す小数で表しましょう。`,
            ans: round(P / 100),
            hint: "1％ は 0.01 だよ。",
            steps: [`${P} ÷ 100 ＝ ${round(P / 100)}`],
          };
        }),
        t("E5-wariai-1c", (r) => {
          const w = r(1, 9);
          const b = r(1, 9);
          const x = round(w / 10 + b / 100);
          const ans = `${w}割${b}分`;
          return {
            q: `割合を表す小数 ${x} を、歩合で表すとどれですか。`,
            ans,
            choices: choices4(r, ans, [`${w}分${b}厘`, `${w}${b}割`, `${w}割${b}厘`, `${b}割${w}分`]),
            hint: "0.1 が1割、0.01 が1分、0.001 が1厘だよ。",
            steps: [`${x} ＝ 0.1 が ${w}こ と 0.01 が ${b}こ`, `${ans}`],
          };
        }),
      ],
      2: [
        t("E5-wariai-2a", (r) => {
          const p = r(1, 19) * 5;
          const A = r(2, 30) * 100;
          const B = (A * p) / 100;
          return {
            q: `${A}円の ${p}％ は何円ですか。`,
            ans: B,
            unit: "円",
            hint: "比べる量 ＝ もとにする量 × 割合。％ を小数になおしてかけよう。",
            steps: [`${p}％ ＝ ${round(p / 100)}`, `${A} × ${round(p / 100)} ＝ ${B}（円）`],
          };
        }),
        t("E5-wariai-2b", (r) => {
          const p = pick(r, [10, 20, 25, 30, 40, 50, 60, 75, 80]);
          const A = r(2, 20) * 20;
          const B = (A * p) / 100;
          if (!Number.isInteger(B)) return { skip: true };
          return {
            q: `ある学校で、めがねをかけている人は ${B}人で、これは全校児童数の ${p}％ にあたります。全校児童数は何人ですか。`,
            ans: A,
            choices: numChoices(r, A, [Math.round((B * p) / 100), Math.round((B * 100) / (100 - p)), B + Math.round((B * p) / 100)]),
            hint: "もとにする量 ＝ 比べる量 ÷ 割合",
            steps: [`全校児童数を □人とすると、□ × ${round(p / 100)} ＝ ${B}`, `□ ＝ ${B} ÷ ${round(p / 100)} ＝ ${A}（人）`],
          };
        }),
        t("E5-wariai-2c", (r) => {
          const A = pick(r, [40, 50, 60, 80, 100, 120, 150, 200]);
          const p = r(10, 30) * 5;
          const B = (A * p) / 100;
          if (!Number.isInteger(B)) return { skip: true };
          return {
            q: `定員 ${A}人の電車に、${B}人が乗っています。乗車率（定員をもとにした乗っている人数の割合）は何％ですか。`,
            ans: p,
            unit: "％",
            hint: "割合 ＝ 比べる量 ÷ もとにする量。それを100倍すると百分率。",
            steps: [`${B} ÷ ${A} ＝ ${round(p / 100)}`, `${round(p / 100)} を百分率で表すと ${p}％`],
          };
        }),
      ],
      3: [
        t("E5-wariai-3a", (r) => {
          const p = pick(r, [10, 15, 20, 25, 30, 40]);
          const P = r(4, 40) * 100;
          const ans = (P * (100 - p)) / 100;
          return {
            q: `定価 ${P}円の品物を、定価の ${p}％ 引きで買いました。代金は何円ですか。`,
            ans,
            choices: numChoices(r, ans, [(P * p) / 100, P - p, (P * (100 + p)) / 100]),
            hint: `${p}％ 引きの代金は、定価の (100 − ${p})％ だね。`,
            steps: [`代金は定価の 100 − ${p} ＝ ${100 - p}（％）`, `${P} × ${round((100 - p) / 100)} ＝ ${ans}（円）`],
          };
        }),
        t("E5-wariai-3b", (r) => {
          const k = r(1, 4);
          const P = r(5, 40) * 100;
          const S = (P * (10 - k)) / 10;
          return {
            q: `ある品物を定価の ${k}割引きで買ったら、代金は ${S}円でした。この品物の定価は何円ですか。`,
            ans: P,
            choices: numChoices(r, P, [round((S * (10 + k)) / 10), S + (S * k) / 10 === P ? S + 100 : round(S + (S * k) / 10), round(S / (k / 10))]),
            hint: `${k}割引きの代金は、定価の (10 − ${k}) 割。もとにする量は定価だよ。`,
            steps: [`代金は定価の ${10 - k}割 ＝ ${round((10 - k) / 10)}`, `定価 ＝ ${S} ÷ ${round((10 - k) / 10)} ＝ ${P}（円）`],
          };
        }),
        t("E5-wariai-3c", (r) => {
          const p = pick(r, [10, 20, 25, 50]);
          const g = r(2, 30) * 20;
          const M = (g * (100 + p)) / 100;
          if (!Number.isInteger(M)) return { skip: true };
          return {
            q: `おかしのふくろに「${p}％ 増量」と書いてあり、中身は ${M}g です。増量する前の中身は何gですか。`,
            ans: g,
            unit: "g",
            hint: `増量したあとの量は、もとの量の (100 ＋ ${p})％ だね。`,
            steps: [`${M}g は、もとの量の ${100 + p}％ ＝ ${round((100 + p) / 100)}`, `${M} ÷ ${round((100 + p) / 100)} ＝ ${g}（g）`],
          };
        }),
      ],
      4: [
        t("E5-wariai-4a", (r) => {
          const C = r(4, 30) * 100;
          const a = r(2, 5);
          const b = r(1, 2);
          const price = (C * (10 + a)) / 10;
          const sell = (price * (10 - b)) / 10;
          const gain = sell - C;
          if (!Number.isInteger(sell) || gain <= 0) return { skip: true };
          return {
            q: `原価 ${C}円の品物に、原価の ${a}割の利益を見こんで定価をつけました。しかし売れなかったので、定価の ${b}割引きで売りました。利益は何円ですか。`,
            ans: gain,
            unit: "円",
            hint: "定価 → 売り値 の順に求めてから、売り値 − 原価 を計算しよう。",
            steps: [`定価：${C} × ${round(1 + a / 10)} ＝ ${price}（円）`, `売り値：${price} × ${round(1 - b / 10)} ＝ ${sell}（円）`, `利益：${sell} − ${C} ＝ ${gain}（円）`],
          };
        }),
        t("E5-wariai-4b", (r) => {
          const p = pick(r, [4, 5, 8, 10, 12, 15, 20, 25]);
          const total = r(1, 8) * 100;
          const salt = (total * p) / 100;
          const water = total - salt;
          return {
            q: `水 ${water}g に食塩 ${salt}g をとかして、食塩水をつくりました。この食塩水のこさは何％ですか。（こさ ＝ 食塩の重さ ÷ 食塩水の重さ）`,
            ans: p,
            choices: numChoices(r, p, [round((salt / water) * 100, 1), round((water / total) * 100, 1), p + 1]),
            hint: "もとにする量は「水」ではなく「食塩水（水 ＋ 食塩）」だよ。",
            steps: [`食塩水の重さ：${water} ＋ ${salt} ＝ ${total}（g）`, `${salt} ÷ ${total} ＝ ${round(p / 100)}`, `${p}％`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E5-menseki",
    grade: "E5",
    area: "geo",
    name: "図形の面積",
    desc: "三角形・平行四辺形・台形・ひし形",
    prereqs: ["E4-menseki"],
    points: [
      "平行四辺形 ＝ 底辺 × 高さ、三角形 ＝ 底辺 × 高さ ÷ 2。",
      "台形 ＝ (上底 ＋ 下底) × 高さ ÷ 2、ひし形 ＝ 対角線 × 対角線 ÷ 2。",
      "高さは、底辺に垂直な長さだよ。ななめの辺の長さとまちがえないように！",
    ],
    levels: {
      1: [
        t("E5-menseki-1a", (r) => {
          let a = r(3, 20);
          const h = r(2, 20);
          if ((a * h) % 2) a += 1;
          return {
            q: `底辺が ${a}cm、高さが ${h}cm の三角形の面積は何cm²ですか。`,
            ans: (a * h) / 2,
            unit: "cm²",
            hint: "三角形の面積 ＝ 底辺 × 高さ ÷ 2",
            steps: [`${a} × ${h} ÷ 2 ＝ ${(a * h) / 2}（cm²）`],
          };
        }),
        t("E5-menseki-1b", (r) => {
          const a = r(3, 20);
          const h = r(2, 20);
          return {
            q: `底辺が ${a}cm、高さが ${h}cm の平行四辺形の面積は何cm²ですか。`,
            ans: a * h,
            unit: "cm²",
            hint: "平行四辺形の面積 ＝ 底辺 × 高さ",
            steps: [`${a} × ${h} ＝ ${a * h}（cm²）`],
          };
        }),
        t("E5-menseki-1c", (r) => {
          const a = r(2, 12);
          const b = r(a + 1, 20);
          let h = r(2, 14);
          if (((a + b) * h) % 2) h += 1;
          return {
            q: `上底が ${a}cm、下底が ${b}cm、高さが ${h}cm の台形の面積は何cm²ですか。`,
            ans: ((a + b) * h) / 2,
            unit: "cm²",
            hint: "台形の面積 ＝ (上底 ＋ 下底) × 高さ ÷ 2",
            steps: [`(${a} ＋ ${b}) × ${h} ÷ 2`, `＝ ${a + b} × ${h} ÷ 2 ＝ ${((a + b) * h) / 2}（cm²）`],
          };
        }),
      ],
      2: [
        t("E5-menseki-2a", (r) => {
          let d1 = r(4, 20);
          const d2 = r(4, 20);
          if ((d1 * d2) % 2) d1 += 1;
          return {
            q: `対角線の長さが ${d1}cm と ${d2}cm のひし形の面積は何cm²ですか。`,
            ans: (d1 * d2) / 2,
            unit: "cm²",
            hint: "ひし形の面積 ＝ 対角線 × 対角線 ÷ 2",
            steps: [`${d1} × ${d2} ÷ 2 ＝ ${(d1 * d2) / 2}（cm²）`],
          };
        }),
        t("E5-menseki-2b", (r) => {
          const a = r(4, 15);
          const h = r(3, 12);
          const s = h + r(1, 5);
          if (s === a) return { skip: true };
          const ans = a * h;
          return {
            q: `底辺が ${a}cm、高さが ${h}cm、ななめの辺の長さが ${s}cm の平行四辺形があります。この平行四辺形の面積は何cm²ですか。`,
            ans,
            choices: numChoices(r, ans, [a * s, (a * h) / 2, (a + s) * 2, a * s - a * h]),
            hint: "面積に使うのは、底辺と、それに垂直な高さだよ。",
            steps: ["ななめの辺の長さは、面積の計算には使わない", `${a} × ${h} ＝ ${ans}（cm²）`],
          };
        }),
        t("E5-menseki-2c", (r) => {
          const a = r(3, 16);
          const h = r(2, 16);
          if ((a * h) % 2) return { skip: true };
          const S = (a * h) / 2;
          return {
            q: `面積が ${S}cm² で、底辺が ${a}cm の三角形があります。高さは何cmですか。`,
            ans: h,
            unit: "cm",
            hint: `${a} × 高さ ÷ 2 ＝ ${S} となる高さを考えよう。`,
            steps: [`${a} × □ ÷ 2 ＝ ${S}`, `${a} × □ ＝ ${S * 2}`, `□ ＝ ${S * 2} ÷ ${a} ＝ ${h}（cm）`],
          };
        }),
      ],
      3: [
        t("E5-menseki-3a", (r) => {
          const a = r(2, 10);
          const b = r(a + 2, 18);
          const h = r(2, 12);
          if (((a + b) * h) % 2) return { skip: true };
          const S = ((a + b) * h) / 2;
          return {
            q: `上底が ${a}cm、下底が ${b}cm で、面積が ${S}cm² の台形があります。この台形の高さは何cmですか。`,
            ans: h,
            unit: "cm",
            hint: "台形の面積の公式にあてはめて、高さを □ として逆算しよう。",
            steps: [`(${a} ＋ ${b}) × □ ÷ 2 ＝ ${S}`, `${a + b} × □ ＝ ${S * 2}`, `□ ＝ ${S * 2} ÷ ${a + b} ＝ ${h}（cm）`],
          };
        }),
        t("E5-menseki-3b", (r) => {
          const a = r(4, 16);
          const b = r(4, 20);
          if ((a * b) % 2) return { skip: true };
          return {
            q: `たて ${a}cm、横 ${b}cm の長方形 ABCD（AB がたて、BC が横）があります。辺 AD 上のどこかに点 P をとるとき、三角形 PBC の面積は何cm²ですか。`,
            ans: (a * b) / 2,
            unit: "cm²",
            hint: "三角形 PBC の底辺を BC とすると、高さはどこにあるかな？",
            steps: [`底辺を BC（${b}cm）とすると、高さは長方形のたてと同じ ${a}cm（P がどこでも変わらない）`, `${b} × ${a} ÷ 2 ＝ ${(a * b) / 2}（cm²）`],
          };
        }),
        t("E5-menseki-3c", (r) => {
          const d1 = r(4, 20);
          const d2 = r(4, 20);
          if ((d1 * d2) % 2) return { skip: true };
          const S = (d1 * d2) / 2;
          return {
            q: `面積が ${S}cm² のひし形があります。対角線の1本の長さが ${d1}cm のとき、もう1本の対角線の長さは何cmですか。`,
            ans: d2,
            unit: "cm",
            hint: "ひし形の面積 ＝ 対角線 × 対角線 ÷ 2 を使って逆算しよう。",
            steps: [`${d1} × □ ÷ 2 ＝ ${S}`, `${d1} × □ ＝ ${S * 2}`, `□ ＝ ${S * 2} ÷ ${d1} ＝ ${d2}（cm）`],
          };
        }),
      ],
      4: [
        t("E5-menseki-4a", (r) => {
          const a = 4 * r(1, 6);
          const S = (3 * a * a) / 8;
          return {
            q: `1辺が ${a}cm の正方形 ABCD があります。辺 BC の真ん中の点を E、辺 CD の真ん中の点を F とします。三角形 AEF の面積は何cm²ですか。`,
            ans: S,
            unit: "cm²",
            hint: "正方形から、まわりの3つの直角三角形をひいて求めよう。",
            steps: [
              `正方形：${a} × ${a} ＝ ${a * a}`,
              `三角形 ABE と ADF：${a} × ${a / 2} ÷ 2 ＝ ${(a * a) / 4} が2つ、三角形 ECF：${a / 2} × ${a / 2} ÷ 2 ＝ ${(a * a) / 8}`,
              `${a * a} − ${(a * a) / 4} × 2 − ${(a * a) / 8} ＝ ${S}（cm²）`,
            ],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E5-taiseki",
    grade: "E5",
    area: "geo",
    name: "体積",
    desc: "直方体・立方体・cm³・L",
    prereqs: ["E4-menseki"],
    points: [
      "1辺が 1cm の立方体の体積を 1cm³（1立方センチメートル）というよ。",
      "直方体の体積 ＝ たて × 横 × 高さ、立方体の体積 ＝ 1辺 × 1辺 × 1辺。",
      "1L ＝ 1000cm³、1mL ＝ 1cm³、1m³ ＝ 1000000cm³ ＝ 1000L。",
    ],
    levels: {
      1: [
        t("E5-taiseki-1a", (r) => {
          const a = r(2, 15);
          const b = r(2, 15);
          const c = r(2, 15);
          return {
            q: `たて ${a}cm、横 ${b}cm、高さ ${c}cm の直方体の体積は何cm³ですか。`,
            ans: a * b * c,
            unit: "cm³",
            hint: "直方体の体積 ＝ たて × 横 × 高さ",
            steps: [`${a} × ${b} × ${c} ＝ ${a * b * c}（cm³）`],
          };
        }),
        t("E5-taiseki-1b", (r) => {
          const a = r(2, 12);
          return {
            q: `1辺が ${a}cm の立方体の体積は何cm³ですか。`,
            ans: a * a * a,
            unit: "cm³",
            hint: "立方体の体積 ＝ 1辺 × 1辺 × 1辺",
            steps: [`${a} × ${a} × ${a} ＝ ${a * a * a}（cm³）`],
          };
        }),
        t("E5-taiseki-1c", (r) => {
          const a = r(2, 9);
          if (r(0, 1)) {
            return {
              q: `${a}L は何cm³ですか。`,
              ans: a * 1000,
              unit: "cm³",
              hint: "1L ＝ 1000cm³ だよ。",
              steps: ["1L ＝ 1000cm³", `${a}L ＝ ${a * 1000}cm³`],
            };
          }
          return {
            q: `${a}m³ は何L ですか。`,
            ans: a * 1000,
            unit: "L",
            hint: "1m³ ＝ 1000L だよ。",
            steps: ["1m³ ＝ 1000L", `${a}m³ ＝ ${a * 1000}L`],
          };
        }),
      ],
      2: [
        t("E5-taiseki-2a", (r) => {
          const a = r(2, 9);
          const ans = `${a * 1000000}cm³`;
          return {
            q: `${a}m³ は何cm³ですか。`,
            ans,
            choices: choices4(r, ans, [`${a * 1000}cm³`, `${a * 10000}cm³`, `${a * 100}cm³`, `${a * 100000}cm³`]),
            hint: "1m ＝ 100cm。1m³ は 100cm × 100cm × 100cm の立方体だよ。",
            steps: ["1m³ ＝ 100 × 100 × 100 ＝ 1000000（cm³）", `${a}m³ ＝ ${a * 1000000}cm³`],
          };
        }),
        t("E5-taiseki-2b", (r) => {
          const a = r(2, 12);
          const b = r(2, 12);
          const c = r(2, 12);
          const V = a * b * c;
          return {
            q: `体積が ${V}cm³ の直方体があります。たてが ${a}cm、横が ${b}cm のとき、高さは何cmですか。`,
            ans: c,
            unit: "cm",
            hint: `たて × 横 × 高さ ＝ 体積 だから、${a} × ${b} × □ ＝ ${V}`,
            steps: [`${a} × ${b} ＝ ${a * b}`, `□ ＝ ${V} ÷ ${a * b} ＝ ${c}（cm）`],
          };
        }),
        t("E5-taiseki-2c", (r) => {
          const a = r(2, 6) * 10;
          const b = r(2, 6) * 10;
          const c = r(1, 5) * 10;
          const V = a * b * c;
          return {
            q: `内のりが、たて ${a}cm、横 ${b}cm、深さ ${c}cm の直方体の形をした水そうがあります。この水そうには、水が何L 入りますか。`,
            ans: V / 1000,
            unit: "L",
            hint: "体積を cm³ で求めてから、1L ＝ 1000cm³ で L になおそう。",
            steps: [`${a} × ${b} × ${c} ＝ ${V}（cm³）`, `${V} ÷ 1000 ＝ ${V / 1000}（L）`],
          };
        }),
      ],
      3: [
        t("E5-taiseki-3a", (r) => {
          const a = r(6, 15);
          const b = r(6, 15);
          const c = r(3, 10);
          const d = r(2, a - 2);
          const e = r(2, b - 2);
          const ans = a * b * c - d * e * c;
          return {
            q: `たて ${a}cm、横 ${b}cm、高さ ${c}cm の直方体から、たて ${d}cm、横 ${e}cm、高さ ${c}cm の直方体を切り取りました。のこりの立体の体積は何cm³ですか。`,
            ans,
            unit: "cm³",
            hint: "大きい直方体の体積から、切り取った直方体の体積をひこう。",
            steps: [`大きい直方体：${a} × ${b} × ${c} ＝ ${a * b * c}`, `切り取った部分：${d} × ${e} × ${c} ＝ ${d * e * c}`, `${a * b * c} − ${d * e * c} ＝ ${ans}（cm³）`],
          };
        }),
        t("E5-taiseki-3b", (r) => {
          const a = r(2, 6) * 10;
          const b = r(2, 6) * 10;
          const h = r(2, 25);
          const V = (a * b * h) / 1000;
          return {
            q: `内のりが、たて ${a}cm、横 ${b}cm の直方体の形をした水そうに、${V}L の水を入れました。水の深さは何cmになりますか。`,
            ans: h,
            unit: "cm",
            hint: "L を cm³ になおしてから、たて × 横 でわろう。",
            steps: [`${V}L ＝ ${V * 1000}cm³`, `${a} × ${b} ＝ ${a * b}`, `${V * 1000} ÷ ${a * b} ＝ ${h}（cm）`],
          };
        }),
        t("E5-taiseki-3c", (r) => {
          const a = r(2, 6) * 5;
          const b = r(2, 6) * 5;
          const h = r(1, 6);
          return {
            q: `内のりが、たて ${a}cm、横 ${b}cm の直方体の形をした水そうに水が入っています。この中に石を入れてしずめると、水の深さが ${h}cm ふえました（水はあふれていません）。石の体積は何cm³ですか。`,
            ans: a * b * h,
            unit: "cm³",
            hint: "ふえた水の部分の体積が、石の体積と同じだよ。",
            steps: [`ふえた部分は、たて ${a}cm、横 ${b}cm、高さ ${h}cm の直方体`, `${a} × ${b} × ${h} ＝ ${a * b * h}（cm³）`],
          };
        }),
      ],
      4: [
        t("E5-taiseki-4a", (r) => {
          const a = r(3, 7);
          const b = r(3, 7);
          const c = r(3, 6);
          if (r(0, 1)) {
            const ans = (a - 2) * (b - 2) * (c - 2);
            return {
              q: `1辺 1cm の立方体を、たてに ${a}こ、横に ${b}こ、高さに ${c}こ積んで直方体をつくり、外側の面全体に色をぬりました。どの面にも色がぬられていない立方体は何こありますか。`,
              ans,
              unit: "こ",
              hint: "色がぬられていないのは、外側をひとまわりはがした内側の部分だよ。",
              steps: [`内側の部分は、たて ${a - 2}こ、横 ${b - 2}こ、高さ ${c - 2}こ`, `${a - 2} × ${b - 2} × ${c - 2} ＝ ${ans}（こ）`],
            };
          }
          const ans = 2 * ((a - 2) * (b - 2) + (b - 2) * (c - 2) + (c - 2) * (a - 2));
          return {
            q: `1辺 1cm の立方体を、たてに ${a}こ、横に ${b}こ、高さに ${c}こ積んで直方体をつくり、外側の面全体に色をぬりました。1つの面だけに色がぬられている立方体は何こありますか。`,
            ans,
            unit: "こ",
            hint: "1面だけぬられているのは、それぞれの面の、ふち以外の部分だよ。",
            steps: [`上下の面：${a - 2} × ${b - 2} ＝ ${(a - 2) * (b - 2)} が2面、前後：${b - 2} × ${c - 2} ＝ ${(b - 2) * (c - 2)} が2面、左右：${a - 2} × ${c - 2} ＝ ${(a - 2) * (c - 2)} が2面`, `(${(a - 2) * (b - 2)} ＋ ${(b - 2) * (c - 2)} ＋ ${(a - 2) * (c - 2)}) × 2 ＝ ${ans}（こ）`],
          };
        }),
        t("E5-taiseki-4b", (r) => {
          const x = r(2, 5);
          const a = 2 * x + r(4, 14);
          const s = a - 2 * x;
          const ans = s * s * x;
          return {
            q: `1辺が ${a}cm の正方形の紙の4すみから、1辺 ${x}cm の正方形を切り取り、ふたのない箱をつくります。この箱の容積は何cm³ですか。（紙の厚さは考えません）`,
            ans,
            unit: "cm³",
            hint: "箱の底は正方形になるよ。底の1辺と、箱の高さを考えよう。",
            steps: [`底の1辺：${a} − ${x} × 2 ＝ ${s}（cm）、高さ：${x}cm`, `${s} × ${s} × ${x} ＝ ${ans}（cm³）`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E5-kakudo",
    grade: "E5",
    area: "geo",
    name: "図形の角",
    desc: "三角形・四角形・多角形の角の和",
    prereqs: ["E4-kakudo"],
    points: [
      "三角形の3つの角の大きさの和は 180°、四角形の4つの角の大きさの和は 360° だよ。",
      "多角形は、1つの頂点から対角線をひくと三角形に分けられる。○角形の角の和 ＝ 180° × (○ − 2)。",
      "二等辺三角形は2つの角が等しく、正三角形は3つの角がすべて 60° だよ。",
    ],
    levels: {
      1: [
        t("E5-kakudo-1a", (r) => {
          const a = r(20, 100);
          const b = r(20, 160 - a);
          return {
            q: `三角形の2つの角が ${a}° と ${b}° のとき、のこりの角は何度ですか。`,
            ans: 180 - a - b,
            unit: "度",
            hint: "三角形の3つの角の和は 180° だよ。",
            steps: [`180 − ${a} − ${b} ＝ ${180 - a - b}（度）`],
          };
        }),
        t("E5-kakudo-1b", (r) => {
          const a = r(50, 120);
          const b = r(50, 120);
          const c = r(40, 300 - a - b);
          const d = 360 - a - b - c;
          if (d < 30 || d > 170) return { skip: true };
          return {
            q: `四角形の3つの角が ${a}°、${b}°、${c}° のとき、のこりの角は何度ですか。`,
            ans: d,
            unit: "度",
            hint: "四角形の4つの角の和は 360° だよ。",
            steps: [`360 − ${a} − ${b} − ${c} ＝ ${d}（度）`],
          };
        }),
        t("E5-kakudo-1c", (r) => {
          const n = r(5, 10);
          const name = kan(n);
          return {
            q: `${name}角形の角の大きさの和は何度ですか。`,
            ans: 180 * (n - 2),
            unit: "度",
            hint: "1つの頂点から対角線をひくと、三角形がいくつできるかな？",
            steps: [`1つの頂点から対角線をひくと、三角形が ${n} − 2 ＝ ${n - 2}こできる`, `180 × ${n - 2} ＝ ${180 * (n - 2)}（度）`],
          };
        }),
      ],
      2: [
        t("E5-kakudo-2a", (r) => {
          if (r(0, 1)) {
            const a = 2 * r(10, 70);
            return {
              q: `二等辺三角形で、等しい2つの辺にはさまれた角（頂角）が ${a}° のとき、のこりの2つの角（底角）は、それぞれ何度ですか。`,
              ans: (180 - a) / 2,
              unit: "度",
              hint: "二等辺三角形の底角は2つとも等しいよ。",
              steps: [`2つの底角の和は 180 − ${a} ＝ ${180 - a}`, `${180 - a} ÷ 2 ＝ ${(180 - a) / 2}（度）`],
            };
          }
          const b = r(20, 85);
          return {
            q: `二等辺三角形で、等しい2つの角（底角）がそれぞれ ${b}° のとき、のこりの角（頂角）は何度ですか。`,
            ans: 180 - 2 * b,
            unit: "度",
            hint: "三角形の3つの角の和は 180° だよ。",
            steps: [`${b} × 2 ＝ ${2 * b}`, `180 − ${2 * b} ＝ ${180 - 2 * b}（度）`],
          };
        }),
        t("E5-kakudo-2b", (r) => {
          const n = pick(r, [5, 6, 8, 9, 10, 12]);
          const name = kan(n);
          const S = 180 * (n - 2);
          return {
            q: `正${name}角形の1つの角の大きさは何度ですか。`,
            ans: S / n,
            unit: "度",
            hint: "まず角の大きさの和を求めて、角の数でわろう。",
            steps: [`${name}角形の角の和：180 × ${n - 2} ＝ ${S}`, `正${name}角形の角はすべて等しいので ${S} ÷ ${n} ＝ ${S / n}（度）`],
          };
        }),
        t("E5-kakudo-2c", (r) => {
          const a = r(30, 90);
          const b = r(30, 150 - a);
          return {
            q: `三角形 ABC で、角 A が ${a}°、角 B が ${b}° です。辺 BC を C のほうにのばしたとき、頂点 C のところの外側にできる角は何度ですか。`,
            ans: a + b,
            unit: "度",
            hint: "まず角 C を求めて、一直線（180°）から考えよう。",
            steps: [`角 C ＝ 180 − ${a} − ${b} ＝ ${180 - a - b}`, `外側の角 ＝ 180 − ${180 - a - b} ＝ ${a + b}（度）`, `（角 A と角 B の和と同じになる）`],
          };
        }),
      ],
      3: [
        t("E5-kakudo-3a", (r) => {
          const n = r(5, 12);
          const S = 180 * (n - 2);
          return {
            q: `角の大きさの和が ${S}° になる多角形は、何角形ですか。`,
            ans: n,
            unit: "角形",
            hint: "多角形の角の和 ＝ 180° × (頂点の数 − 2) を使って逆算しよう。",
            steps: [`${S} ÷ 180 ＝ ${n - 2}（三角形の数）`, `頂点の数は ${n - 2} ＋ 2 ＝ ${n}`, `${kan(n)}角形`],
          };
        }),
        t("E5-kakudo-3b", (r) => {
          const a = 2 * r(10, 70);
          const base = (180 - a) / 2;
          const ans = 180 - base;
          return {
            q: `AB ＝ AC の二等辺三角形 ABC で、角 A が ${a}° です。辺 BC を C のほうにのばしたとき、頂点 C のところの外側にできる角は何度ですか。`,
            ans,
            unit: "度",
            hint: "まず、底角（角 B と角 C）の大きさを求めよう。",
            steps: [`角 B ＝ 角 C ＝ (180 − ${a}) ÷ 2 ＝ ${base}`, `外側の角 ＝ 180 − ${base} ＝ ${ans}（度）`],
          };
        }),
        t("E5-kakudo-3c", (r) => {
          const a = r(60, 130);
          let b = r(60, 130);
          if ((a + b) % 2) b += 1;
          const rest = 360 - a - b;
          return {
            q: `四角形の4つの角のうち、2つの角が ${a}° と ${b}° で、のこりの2つの角の大きさは等しくなっています。のこりの角の1つは何度ですか。`,
            ans: rest / 2,
            unit: "度",
            hint: "四角形の角の和は 360° だよ。",
            steps: [`のこりの2つの角の和：360 − ${a} − ${b} ＝ ${rest}`, `${rest} ÷ 2 ＝ ${rest / 2}（度）`],
          };
        }),
      ],
      4: [
        t("E5-kakudo-4a", (r) => {
          const n = pick(r, [5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]);
          const A = 180 - 360 / n;
          return {
            q: `1つの角の大きさが ${A}° の正多角形は、正何角形ですか。`,
            ans: n,
            unit: "角形",
            hint: "各頂点で、1つの角ととなりの外側の角をあわせると 180°。外側の角を全部あわせると 360° になるよ。",
            steps: [`1つの頂点の外側の角は 180 − ${A} ＝ ${180 - A}`, `外側の角の和は 360° なので、頂点の数は 360 ÷ ${180 - A} ＝ ${n}`, `正${kan(n)}角形`],
          };
        }),
        t("E5-kakudo-4b", (r) => {
          const n = r(5, 15);
          const ans = (n * (n - 3)) / 2;
          return {
            q: `${kan(n)}角形の対角線は、全部で何本ありますか。`,
            ans,
            unit: "本",
            hint: "1つの頂点から何本ひけるかを考えよう。同じ対角線を2回数えないように。",
            steps: [`1つの頂点からは、自分ととなりの2つをのぞいた ${n} − 3 ＝ ${n - 3}本ひける`, `${n} × ${n - 3} ＝ ${n * (n - 3)} だと、1本を両はしから2回数えている`, `${n * (n - 3)} ÷ 2 ＝ ${ans}（本）`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E5-enshu",
    grade: "E5",
    area: "geo",
    name: "円周と正多角形",
    desc: "円周＝直径×3.14",
    prereqs: ["E3-en", "E5-shosukake"],
    points: [
      "円周の長さが直径の何倍になっているかを表す数を円周率という。ふつう 3.14 を使うよ。",
      "円周 ＝ 直径 × 3.14。半径がわかっているときは、まず直径（半径 × 2）にしよう。",
      "辺の長さがすべて等しく、角の大きさもすべて等しい多角形を正多角形という。円の中心のまわりの角を等分するとかけるよ。",
    ],
    levels: {
      1: [
        t("E5-enshu-1a", (r) => {
          const d = r(2, 30);
          const ans = round(d * 3.14);
          return {
            q: `直径 ${d}cm の円の円周の長さは何cmですか。`,
            ans,
            unit: "cm",
            hint: "円周 ＝ 直径 × 3.14",
            steps: [`${d} × 3.14 ＝ ${ans}（cm）`],
          };
        }),
        t("E5-enshu-1b", (r) => {
          const rr = r(2, 15);
          const ans = round(rr * 2 * 3.14);
          return {
            q: `半径 ${rr}cm の円の円周の長さは何cmですか。`,
            ans,
            choices: numChoices(r, ans, [round(rr * 3.14), round(rr * 4 * 3.14), round(rr * rr * 3.14)]),
            hint: "半径を2倍して直径にしてから、3.14 をかけよう。",
            steps: [`直径は ${rr} × 2 ＝ ${rr * 2}（cm）`, `${rr * 2} × 3.14 ＝ ${ans}（cm）`],
          };
        }),
        t("E5-enshu-1c", (r) => {
          const d = r(2, 20);
          const C = round(d * 3.14);
          return {
            q: `円周の長さが ${C}cm の円の直径は何cmですか。`,
            ans: d,
            unit: "cm",
            hint: "直径 ＝ 円周 ÷ 3.14",
            steps: [`${C} ÷ 3.14 ＝ ${d}（cm）`],
          };
        }),
      ],
      2: [
        t("E5-enshu-2a", (r) => {
          const n = pick(r, [3, 4, 5, 6, 8, 9, 10, 12]);
          const name = n === 4 ? "正方形" : `正${kan(n)}角形`;
          return {
            q: `円の中心のまわりの角を等分して、${name}をかきます。中心のまわりの角を、何度ずつに分ければよいですか。`,
            ans: 360 / n,
            unit: "度",
            hint: "中心のまわりの角は 360° だよ。",
            steps: [`360 ÷ ${n} ＝ ${360 / n}（度）`],
          };
        }),
        t("E5-enshu-2b", (r) => {
          const rr = r(2, 15);
          if (r(0, 1)) {
            return {
              q: `半径 ${rr}cm の円の中に、円周を6等分した点を結んで正六角形をかきました。この正六角形のまわりの長さは何cmですか。`,
              ans: 6 * rr,
              unit: "cm",
              hint: "正六角形は、中心から6つの正三角形に分けられるよ。",
              steps: [`中心のまわりの角は 360 ÷ 6 ＝ 60° ずつなので、6つの正三角形ができる`, `正六角形の1辺は半径と同じ ${rr}cm`, `${rr} × 6 ＝ ${6 * rr}（cm）`],
            };
          }
          return {
            q: `1辺が ${rr}cm の正六角形の6つの頂点を通る円をかきます。この円の直径は何cmですか。`,
            ans: 2 * rr,
            unit: "cm",
            hint: "正六角形は、中心から6つの正三角形に分けられるよ。",
            steps: ["正六角形は、中心から6つの正三角形に分けられる", `円の半径は正六角形の1辺と同じ ${rr}cm`, `直径は ${rr} × 2 ＝ ${2 * rr}（cm）`],
          };
        }),
        t("E5-enshu-2c", (r) => {
          const d = 2 * r(2, 15);
          const arc = round((d * 3.14) / 2);
          const ans = round(arc + d);
          return {
            q: `直径 ${d}cm の円を半分に切った形（半円）のまわりの長さは何cmですか。`,
            ans,
            choices: numChoices(r, ans, [arc, round(d * 3.14), round(arc + d / 2)]),
            hint: "まわりは、曲線の部分と、まっすぐな直径の部分でできているよ。",
            steps: [`曲線の部分：${d} × 3.14 ÷ 2 ＝ ${arc}`, `直径の部分：${d}`, `${arc} ＋ ${d} ＝ ${ans}（cm）`],
          };
        }),
      ],
      3: [
        t("E5-enshu-3a", (r) => {
          const d = pick(r, [50, 100]);
          const n = r(5, 50);
          const ans = round((d * 3.14 * n) / 100);
          return {
            q: `直径 ${d}cm の車輪が ${n}回転すると、何m 進みますか。`,
            ans,
            unit: "m",
            hint: "車輪が1回転すると、円周の長さだけ進むよ。",
            steps: [`1回転で ${d} × 3.14 ＝ ${round(d * 3.14)}（cm）`, `${n}回転で ${round(d * 3.14)} × ${n} ＝ ${round(d * 3.14 * n)}（cm）`, `${ans}m`],
          };
        }),
        t("E5-enshu-3b", (r) => {
          const rr = r(2, 20);
          const C = round(2 * rr * 3.14);
          return {
            q: `円周の長さが ${C}cm の円の半径は何cmですか。`,
            ans: rr,
            unit: "cm",
            hint: "まず直径を求めよう。直径 ＝ 円周 ÷ 3.14",
            steps: [`直径：${C} ÷ 3.14 ＝ ${2 * rr}（cm）`, `半径：${2 * rr} ÷ 2 ＝ ${rr}（cm）`],
          };
        }),
        t("E5-enshu-3c", (r) => {
          const rr = 2 * r(1, 10);
          const arc = round((2 * rr * 3.14) / 4);
          const ans = round(arc + 2 * rr);
          return {
            q: `半径 ${rr}cm の円を、中心を通る2本の直線で4等分した形の1つ（中心の角が直角の形）があります。この形のまわりの長さは何cmですか。`,
            ans,
            choices: numChoices(r, ans, [arc, round(arc + rr), round((2 * rr * 3.14) / 2 + 2 * rr)]),
            hint: "まわりは、曲線の部分と、2本の半径でできているよ。",
            steps: [`曲線の部分：${rr * 2} × 3.14 ÷ 4 ＝ ${arc}`, `半径2本：${rr} × 2 ＝ ${2 * rr}`, `${arc} ＋ ${2 * rr} ＝ ${ans}（cm）`],
          };
        }),
      ],
      4: [
        t("E5-enshu-4a", (r) => {
          const R = r(5, 30);
          const w = r(1, 5);
          const ans = round(2 * w * 3.14);
          return {
            q: `半径 ${R}m の円の形をした池があります。池のふちから ${w}m はなれたところに、池をかこむように円の形のさくをつくります。さくの長さは、池のまわりの長さより何m 長いですか。`,
            ans,
            unit: "m",
            hint: "さくの円の直径は、池の直径より何m 長いかな？",
            steps: [`さくの円の直径は、池の直径より ${w} × 2 ＝ ${2 * w}（m）長い`, `円周のちがい ＝ 直径のちがい × 3.14`, `${2 * w} × 3.14 ＝ ${ans}（m）（池の大きさに関係ない）`],
          };
        }),
        t("E5-enshu-4b", (r) => {
          const a = r(2, 12);
          const b = r(2, 12);
          const big = round(((a + b) * 3.14) / 2);
          const s1 = round((a * 3.14) / 2);
          const s2 = round((b * 3.14) / 2);
          const ans = "どちらも同じ";
          return {
            q: `直径 ${a + b}cm の半円があります。その直径を ${a}cm と ${b}cm に分けて、それぞれを直径とする2つの小さい半円をかきました。大きい半円の曲線の長さと、2つの小さい半円の曲線の長さの合計では、どちらが長いですか。`,
            ans,
            choices: shuffle(r, ["大きい半円の曲線のほうが長い", "2つの小さい半円の曲線の合計のほうが長い", ans]),
            hint: "それぞれ「直径 × 3.14 ÷ 2」で計算してくらべよう。",
            steps: [`大きい半円：${a + b} × 3.14 ÷ 2 ＝ ${big}`, `小さい半円：${a} × 3.14 ÷ 2 ＋ ${b} × 3.14 ÷ 2 ＝ ${s1} ＋ ${s2} ＝ ${round(s1 + s2)}`, "(直径の合計) × 3.14 ÷ 2 なので、どちらも同じ"],
          };
        }),
      ],
    },
  },
];
