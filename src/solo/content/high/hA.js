// ============================================================
// high/hA.js — 高校 数学A の単元（数学ラボ ソロ）
//  場合の数・確率・条件付き確率と期待値・図形の性質・整数の性質
//  答えはすべてプログラムで計算する（数え上げで確かめられるものは数え上げる）。
// ============================================================
import { t, pick, rnz, shuffle, sample, gcd, lcm, reduce, fracAns, fracTex, sqrtTex, choices4, tex } from "../kit.js";

// ── 小さな道具 ─────────────────────────────────────────
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const nPr = (n, k) => (k < 0 || k > n ? 0 : fact(n) / fact(n - k));
const nCr = (n, k) => (k < 0 || k > n ? 0 : Math.round(fact(n) / (fact(k) * fact(n - k))));
const P_ = (n, k) => `{}_{${n}}\\mathrm{P}_{${k}}`;
const C_ = (n, k) => `{}_{${n}}\\mathrm{C}_{${k}}`;
// 分数 [分子, 分母]
const F = (n, d = 1) => reduce(n, d);
const fadd = ([a, b], [c, d]) => F(a * d + c * b, b * d);
const fsub = ([a, b], [c, d]) => F(a * d - c * b, b * d);
const fmul = ([a, b], [c, d]) => F(a * c, b * d);
const fpow = (x, n) => { let o = [1, 1]; for (let i = 0; i < n; i++) o = fmul(o, x); return o; };
const ft = ([a, b]) => fracTex(a, b);
const fa = ([a, b]) => fracAns(a, b);
/** a/b を「約分前=約分後」で（約分できなければ1つだけ） */
const fr = (a, b) => (gcd(a, b) === 1 ? fracTex(a, b) : `\\frac{${a}}{${b}}=${fracTex(a, b)}`);
/** さいころ n 個の目の組をすべて列挙 */
function dice(n) {
  let out = [[]];
  for (let i = 0; i < n; i++) out = out.flatMap((a) => [1, 2, 3, 4, 5, 6].map((v) => [...a, v]));
  return out;
}
const divisors = (n) => { const o = []; for (let d = 1; d <= n; d++) if (n % d === 0) o.push(d); return o; };

// m 進法で abc、n 進法で cba になる数（答えが1つに決まるもの） [m, n, a, b, c, N]
const BASE_REV = [];
for (let m = 3; m <= 9; m++) for (let n = 3; n <= 9; n++) {
  if (m === n) continue;
  const B = Math.min(m, n), sols = [];
  for (let a = 1; a < B; a++) for (let b = 0; b < B; b++) for (let c = 1; c < B; c++) {
    if (a * m * m + b * m + c === c * n * n + b * n + a) sols.push([a, b, c, a * m * m + b * m + c]);
  }
  if (sols.length === 1) BASE_REV.push([m, n, ...sols[0]]);
}

const H = { grade: "H1", course: "数学A", rikei: false };

export const UNITS = [
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HA-baai", area: "data", name: "場合の数", desc: "順列・組合せ・円順列・重複順列",
    prereqs: ["J2-g2c6u1"],
    points: [
      "順列 $_{n}\\mathrm{P}_{r}=\\frac{n!}{(n-r)!}$（並べる・役割がある）、組合せ $_{n}\\mathrm{C}_{r}=\\frac{n!}{r!(n-r)!}$（選ぶだけ）",
      "円順列は $(n-1)!$（1人を固定）、重複順列は $n^{r}$、同じものを含む順列は $\\frac{n!}{p!\\,q!\\,r!}$",
      "「隣り合う」はひとまとめにして並べ、中で並べかえる。「隣り合わない」は他を並べてからすき間に入れる。",
      "数えにくいときは「全体 − 条件を満たさないもの」（余事象）で数える。",
    ],
    levels: {
      1: [
        t("HA-baai-1a", (r) => {
          const n = r(4, 10), k = r(2, Math.min(4, n - 1)), isP = r(0, 1) === 1;
          const v = isP ? nPr(n, k) : nCr(n, k);
          const terms = Array.from({ length: k }, (_, i) => n - i).join("\\cdot ");
          return {
            q: `${tex(isP ? P_(n, k) : C_(n, k))} の値は？`,
            ans: v,
            hint: isP ? "$n$ から1ずつ減らしながら $r$ 個掛ける。" : "$_{n}\\mathrm{P}_{r}$ を $r!$ で割る。",
            steps: isP ? [`$${P_(n, k)}=${terms}=${v}$`] : [`$${C_(n, k)}=\\frac{${terms}}{${k}!}=\\frac{${nPr(n, k)}}{${fact(k)}}=${v}$`],
          };
        }),
        t("HA-baai-1b", (r) => {
          if (r(0, 1)) {
            const n = r(4, 7);
            return {
              q: `${n} 人が円形のテーブルのまわりに座る方法は何通り？（回転して同じになるものは同じとみなす）`,
              ans: fact(n - 1),
              unit: "通り",
              hint: "円順列は1人を固定して、残りを並べると考える。",
              steps: [`1人を固定して残り ${n - 1} 人を並べる`, `$(${n}-1)!=${n - 1}!=${fact(n - 1)}$`],
            };
          }
          const k = r(2, 4), d = r(3, 5);
          const digits = Array.from({ length: k }, (_, i) => i + 1).join(", ");
          return {
            q: `${digits} の ${k} 種類の数字を、くり返し使ってよいとして並べてできる ${d} 桁の整数は何個？`,
            ans: k ** d,
            unit: "個",
            hint: "各位に入る数字の選び方が何通りあるかを考える（重複順列）。",
            steps: [`各位に ${k} 通りずつ`, `$${k}^{${d}}=${k ** d}$`],
          };
        }),
        t("HA-baai-1c", (r) => {
          const n = r(5, 12);
          const kind = r(0, 2);
          const v = [nPr(n, 2), nCr(n, 3), nPr(n, 3)][kind];
          const what = ["委員長と副委員長を1人ずつ", "代表を3人", "委員長・副委員長・書記を1人ずつ"][kind];
          return {
            q: `${n} 人の中から${what}選ぶ方法は何通り？`,
            ans: v,
            unit: "通り",
            hint: "選んだ人に役割の区別があるか（順列）、ないか（組合せ）を考える。",
            steps: [
              kind === 1 ? "役割の区別がないので組合せ" : "役割の区別があるので順列",
              [`$${P_(n, 2)}=${n}\\cdot ${n - 1}=${v}$`, `$${C_(n, 3)}=\\frac{${n}\\cdot ${n - 1}\\cdot ${n - 2}}{3\\cdot 2\\cdot 1}=${v}$`, `$${P_(n, 3)}=${n}\\cdot ${n - 1}\\cdot ${n - 2}=${v}$`][kind],
            ],
          };
        }),
        t("HA-baai-1d", (r) => {
          const [a, b] = pick(r, [[2, 3], [2, 5], [3, 4], [3, 5], [2, 7], [3, 7], [4, 5], [5, 7], [4, 6], [6, 8], [4, 10], [6, 9]]);
          const N = r(5, 30) * 10, kind = r(0, 2);
          const L = lcm(a, b), A = Math.floor(N / a), B = Math.floor(N / b), AB = Math.floor(N / L), U = A + B - AB;
          const v = [U, N - U, A - AB][kind];
          const what = [`${a} の倍数または ${b} の倍数`, `${a} の倍数でも ${b} の倍数でもない数`, `${a} の倍数であるが ${b} の倍数でない数`][kind];
          return {
            q: `1 から ${N} までの整数のうち、${what}は何個？`,
            ans: v,
            unit: "個",
            hint: `${a} の倍数の集合を $A$、${b} の倍数の集合を $B$ として、$n(A\\cup B)=n(A)+n(B)-n(A\\cap B)$ を使う。`,
            steps: [
              `${a} の倍数の集合を $A$、${b} の倍数の集合を $B$ とすると $n(A)=${A},\\ n(B)=${B}$（${N} をそれぞれで割った商）`,
              `$A\\cap B$ は ${a} と ${b} の最小公倍数 ${L} の倍数の集合なので $n(A\\cap B)=${AB}$`,
              [`$n(A\\cup B)=${A}+${B}-${AB}=${v}$`, `$n(\\overline{A\\cup B})=${N}-(${A}+${B}-${AB})=${v}$`, `$n(A)-n(A\\cap B)=${A}-${AB}=${v}$`][kind],
            ],
          };
        }),
      ],
      2: [
        t("HA-baai-2a", (r) => {
          const cnt = pick(r, [[3, 2, 1], [2, 2, 2], [4, 2, 1], [3, 3, 1], [3, 2, 2], [2, 2, 1, 1], [4, 3, 1]]);
          const L = ["A", "B", "C", "D"];
          const word = cnt.map((c, i) => L[i].repeat(c)).join("");
          const n = word.length;
          const v = fact(n) / cnt.reduce((a, c) => a * fact(c), 1);
          return {
            q: `${word.split("").join(", ")} の ${n} 文字を1列に並べる方法は何通り？`,
            ans: v,
            unit: "通り",
            hint: "同じものを含む順列。全部を区別して並べたあと、同じ文字どうしの入れかえの分で割る。",
            steps: [
              `$\\frac{${n}!}{${cnt.map((c) => `${c}!`).join("\\,")}}=\\frac{${fact(n)}}{${cnt.reduce((a, c) => a * fact(c), 1)}}=${v}$`,
            ],
          };
        }),
        t("HA-baai-2b", (r) => {
          const m = r(2, 5), w = r(2, 3), adj = r(0, 1) === 1;
          const v = adj ? fact(m + 1) * fact(w) : fact(m) * nPr(m + 1, w);
          return {
            q: `男子 ${m} 人と女子 ${w} 人が1列に並ぶとき、${adj ? "女子が全員隣り合う" : "女子どうしが隣り合わない"}並び方は何通り？`,
            ans: v,
            unit: "通り",
            hint: adj ? "隣り合う女子をひとまとめにして1人と考える。" : "先に男子を並べ、その間と両端に女子を入れる。",
            steps: adj
              ? [`女子 ${w} 人をひとまとめにすると ${m + 1} 人の並び：$${m + 1}!=${fact(m + 1)}$`, `まとまりの中の女子の並び：$${w}!=${fact(w)}$`, `$${fact(m + 1)}\\times ${fact(w)}=${v}$`]
              : [`男子の並び：$${m}!=${fact(m)}$`, `男子の間と両端の ${m + 1} か所から ${w} か所に女子を並べる：$${P_(m + 1, w)}=${nPr(m + 1, w)}$`, `$${fact(m)}\\times ${nPr(m + 1, w)}=${v}$`],
          };
        }),
        t("HA-baai-2c", (r) => {
          const k = r(4, 7), dg = r(3, 4);
          const v = k * nPr(k, dg - 1);
          return {
            q: `0 から ${k} までの ${k + 1} 個の数字から、異なる ${dg} 個を使ってできる ${dg} 桁の整数は何個？`,
            ans: v,
            unit: "個",
            hint: "最高位に 0 は使えない。最高位から順に、使える数字の個数を数える。",
            steps: [`最高位は 0 以外の ${k} 通り`, `残りの位は、残り ${k} 個から ${dg - 1} 個を並べる：$${P_(k, dg - 1)}=${nPr(k, dg - 1)}$`, `$${k}\\times ${nPr(k, dg - 1)}=${v}$`],
          };
        }),
        t("HA-baai-2d", (r) => {
          const m = r(4, 7), w = r(3, 6), k = r(3, 4), kind = r(0, 3), n = m + w;
          const i = r(1, k - 1), T = nCr(n, k);
          const v = [nCr(m, i) * nCr(w, k - i), T - nCr(m, k) - nCr(w, k), nCr(n - 2, k - 2), T - nCr(n - 2, k)][kind];
          const cond = [`男子がちょうど ${i} 人になる`, "男子も女子も少なくとも1人ずつ含まれる", "特定の2人 A, B がともに選ばれる", "特定の2人 A, B のうち少なくとも一方が選ばれる"][kind];
          return {
            q: `男子 ${m} 人、女子 ${w} 人の中から ${k} 人の委員を選ぶ。${cond}選び方は何通り？`,
            ans: v,
            unit: "通り",
            hint: "どこから何人選ぶかに分けて組合せを掛ける。「少なくとも」は全体から引く（余事象）。",
            steps: [
              [
                `男子 ${m} 人から ${i} 人：$${C_(m, i)}=${nCr(m, i)}$、女子 ${w} 人から ${k - i} 人：$${C_(w, k - i)}=${nCr(w, k - i)}$`,
                `全体 $${C_(n, k)}=${T}$ から、男子だけの $${C_(m, k)}=${nCr(m, k)}$ 通り${w >= k ? `と女子だけの $${C_(w, k)}=${nCr(w, k)}$ 通り` : `（女子だけでは ${k} 人を選べない）`}を引く`,
                `A, B を先に選び、残りの ${n - 2} 人から ${k - 2} 人を選ぶ`,
                `全体 $${C_(n, k)}=${T}$ から、A も B も選ばれない $${C_(n - 2, k)}=${nCr(n - 2, k)}$ 通りを引く`,
              ][kind],
              [`$${nCr(m, i)}\\times ${nCr(w, k - i)}=${v}$`, `$${T}-${nCr(m, k)}${w >= k ? `-${nCr(w, k)}` : ""}=${v}$`, `$${C_(n - 2, k - 2)}=${v}$`, `$${T}-${nCr(n - 2, k)}=${v}$`][kind],
            ],
          };
        }),
      ],
      3: [
        t("HA-baai-3a", (r) => {
          const k = r(4, 6), dg = r(3, 4);
          const kind = pick(r, ["偶数", "5の倍数", "3の倍数"]);
          const test = { 偶数: (x) => x % 2 === 0, "5の倍数": (x) => x % 5 === 0, "3の倍数": (x) => x % 3 === 0 }[kind];
          let v = 0;
          const lo = 10 ** (dg - 1), hi = 10 ** dg - 1;
          for (let x = lo; x <= hi; x++) {
            const s = String(x);
            if (new Set(s).size !== dg || [...s].some((ch) => Number(ch) > k)) continue;
            if (test(x)) v++;
          }
          const c0 = nPr(k, dg - 1), mid = (k - 1) * nPr(k - 1, dg - 2);
          const E = Math.floor(k / 2), has5 = k >= 5;
          // 3の倍数：和が3の倍数になる数字の組（0 を含む組は z 個）
          const sets = [];
          (function rec(s, d) { if (s.length === dg) { if (s.reduce((x, y) => x + y, 0) % 3 === 0) sets.push(s); return; } for (let x = d; x <= k; x++) rec([...s, x], x + 1); })([], 0);
          const z = sets.filter((s) => s[0] === 0).length, nz = sets.length - z, fz = fact(dg) - fact(dg - 1);
          const st = kind === "偶数"
            ? [`一の位が 0 のとき：残り ${k} 個から並べて $${P_(k, dg - 1)}=${c0}$`, `一の位が 0 以外の偶数（${E} 通り）のとき：最高位は 0 と一の位以外の ${k - 1} 通り、残りは $${P_(k - 1, dg - 2)}$ 通り → $${E}\\times ${k - 1}\\times ${nPr(k - 1, dg - 2)}=${E * mid}$`, `合計 $${c0}+${E * mid}=${v}$ 個`]
            : kind === "5の倍数"
              ? [`一の位が 0 のとき：$${P_(k, dg - 1)}=${c0}$`, has5 ? `一の位が 5 のとき：最高位は 0 と 5 以外の ${k - 1} 通り、残りは $${P_(k - 1, dg - 2)}$ 通り → $${mid}$` : `一の位が 5 の数は作れない（5 がない）`, `合計 ${v} 個`]
              : [
                `各位の数字の和が 3 の倍数になる数字の組は${sets.length <= 8 ? ` ${sets.map((s) => `$\\{${s.join(",\\ ")}\\}$`).join(", ")} の` : ""} ${sets.length} 組（うち 0 を含む組は ${z} 組）`,
                `0 を含む組は最高位に 0 を置かないように並べる（全体 − 最高位が 0）：$${dg}!-${dg - 1}!=${fz}$ 通りずつ${nz ? `。含まない組は $${dg}!=${fact(dg)}$ 通りずつ` : ""}`,
                `合計 $${fz}\\times ${z}${nz ? `+${fact(dg)}\\times ${nz}` : ""}=${v}$ 個`,
              ];
          return {
            q: `0 から ${k} までの数字から異なる ${dg} 個を使ってできる ${dg} 桁の整数のうち、${kind}は何個？`,
            ans: v,
            unit: "個",
            hint: kind === "3の倍数" ? "各位の数字の和が3の倍数になる数字の組を先に選ぶ。0 を含むかで分ける。" : "一の位が 0 かどうかで場合分けする（0 は最高位に使えない）。",
            steps: st,
          };
        }),
        t("HA-baai-3b", (r) => {
          const parts = pick(r, [[2, 2, 2], [3, 3], [4, 2], [3, 2, 1], [3, 3, 2], [4, 4], [2, 2, 1], [3, 3, 3], [2, 2, 2, 2], [4, 2, 2]]);
          const n = parts.reduce((a, b) => a + b, 0);
          let ways = 1, rest = n;
          for (const p of parts) { ways *= nCr(rest, p); rest -= p; }
          const mult = {};
          parts.forEach((p) => { mult[p] = (mult[p] || 0) + 1; });
          const div = Object.values(mult).reduce((a, m) => a * fact(m), 1);
          const v = ways / div;
          const desc = parts.join("人, ") + "人";
          let rr = n;
          const cs = parts.map((p) => { const s = C_(rr, p); rr -= p; return s; }).join("\\times ");
          return {
            q: `${n} 人を ${desc}の ${parts.length} つの組に分ける方法は何通り？（組には名前がなく、区別しない）`,
            ans: v,
            unit: "通り",
            hint: "まず組に区別があるとして数え、人数が同じ組の入れかえの分で割る。",
            steps: [
              `組に区別があるとき $${cs}=${ways}$`,
              div > 1 ? `人数が同じ組の並べかえ $${Object.values(mult).filter((m) => m > 1).map((m) => `${m}!`).join("\\times ")}=${div}$ で割る：$${ways}\\div ${div}=${v}$` : `人数がすべて違うので割らなくてよい：${v} 通り`,
            ],
          };
        }),
        t("HA-baai-3c", (r) => {
          const m = r(4, 7), n = r(3, 5), p = r(1, m - 1), q = r(1, n - 1);
          const via = nCr(p + q, p) * nCr(m - p + n - q, m - p), all = nCr(m + n, m);
          const avoid = r(0, 1) === 1;
          return {
            q: `碁盤の目のような道で、地点 A から東へ ${m} 区画、北へ ${n} 区画進んだ地点を B とする。A から B まで最短経路で行くとき、A から東に ${p}、北に ${q} 区画進んだ交差点 P を${avoid ? "通らない" : "通る"}道順は何通り？`,
            ans: avoid ? all - via : via,
            unit: "通り",
            hint: "最短経路は「東 → の個数と北 ↑ の個数」の並べ方。P を通る道は A→P と P→B に分けて掛ける。",
            steps: [
              `A→P：$${C_(p + q, p)}=${nCr(p + q, p)}$、P→B：$${C_(m - p + n - q, m - p)}=${nCr(m - p + n - q, m - p)}$`,
              `P を通る道順は $${nCr(p + q, p)}\\times ${nCr(m - p + n - q, m - p)}=${via}$`,
              ...(avoid ? [`全体は $${C_(m + n, m)}=${all}$ なので、通らないのは $${all}-${via}=${all - via}$`] : []),
            ],
          };
        }),
        t("HA-baai-3d", (r) => {
          const n = r(4, 6);
          const L = "abcdef".slice(0, n).split("");
          const w = shuffle(r, L), word = w.join("");
          let before = 0;
          const parts = [];
          w.forEach((ch, i) => {
            const smaller = w.slice(i + 1).filter((x) => x < ch).sort();
            if (!smaller.length) return;
            const k = n - 1 - i, cnt = smaller.length * fact(k);
            before += cnt;
            parts.push(`${smaller.map((x) => w.slice(0, i).join("") + x + "□".repeat(k)).join(", ")} の形：$${smaller.length}\\times ${k}!=${cnt}$ 個`);
          });
          if (before === 0) return { skip: true };
          return {
            q: `${L.join(", ")} の ${n} 文字をすべて1回ずつ使ってできる文字列を、辞書式（アルファベット順）に並べる。${word} は何番目？`,
            ans: before + 1,
            unit: "番目",
            hint: `${word} より前にくる文字列を、先頭から1文字ずつ見て「○□□…の形」ごとに数える。`,
            steps: [
              parts.slice(0, 2).join("、"),
              ...(parts.length > 2 ? [parts.slice(2).join("、")] : []),
              `${word} より前に ${before} 個あるので $${before}+1=${before + 1}$ 番目`,
            ],
          };
        }),
      ],
      4: [
        t("HA-baai-4a", (r) => {
          if (r(0, 1)) {
            const n = r(3, 5);
            const v = fact(n - 1) * fact(n);
            return {
              q: `男子 ${n} 人と女子 ${n} 人が円形に並ぶとき、男女が交互に並ぶ並び方は何通り？`,
              ans: v,
              unit: "通り",
              hint: "まず男子だけを円形に並べ、その間に女子を入れる。",
              steps: [`男子の円順列 $(${n}-1)!=${fact(n - 1)}$`, `男子の間の ${n} か所に女子を並べる $${n}!=${fact(n)}$`, `$${fact(n - 1)}\\times ${fact(n)}=${v}$`],
            };
          }
          const a = r(3, 5), b = r(2, 3);
          const v = fact(a) * fact(b);
          return {
            q: `大人 ${a} 人と子ども ${b} 人が円形のテーブルに座るとき、子どもが全員隣り合う座り方は何通り？`,
            ans: v,
            unit: "通り",
            hint: "子どもをひとまとめにして1人と考え、円順列にする。",
            steps: [`子ども ${b} 人をひとまとめにすると ${a + 1} 人の円順列：$(${a + 1}-1)!=${fact(a)}$`, `まとまりの中の並び：$${b}!=${fact(b)}$`, `$${fact(a)}\\times ${fact(b)}=${v}$`],
          };
        }),
        t("HA-baai-4b", (r) => {
          const k = r(3, 4), n = r(k + 2, 12), pos = r(0, 1) === 1;
          const vars = ["x", "y", "z", "w"].slice(0, k);
          const v = pos ? nCr(n - 1, k - 1) : nCr(n + k - 1, k - 1);
          return {
            q: `方程式 ${tex(`${vars.join("+")}=${n}`)} を満たす${pos ? "正の整数" : " 0 以上の整数"}の組 ${tex(`(${vars.join(",\\ ")})`)} は何組？`,
            ans: v,
            unit: "組",
            hint: pos ? "○を並べ、その間に仕切りを入れると考える（間は n−1 か所）。" : "○ と仕切り｜を並べる方法として数える（重複組合せ）。",
            steps: pos
              ? [`${n} 個の○の間 ${n - 1} か所から ${k - 1} か所を選んで仕切りを入れる`, `$${C_(n - 1, k - 1)}=${v}$`]
              : [`${n} 個の○と ${k - 1} 本の仕切りを並べる`, `$${C_(n + k - 1, k - 1)}=${v}$`],
          };
        }),
        t("HA-baai-4c", (r) => {
          const rooms = r(2, 3), n = r(4, 7);
          const v = rooms === 2 ? 2 ** n - 2 : 3 ** n - 3 * 2 ** n + 3;
          return {
            q: `${n} 人を ${rooms === 2 ? "A, B の2つ" : "A, B, C の3つ"}の部屋に入れる。どの部屋にも少なくとも1人は入るような入れ方は何通り？`,
            ans: v,
            unit: "通り",
            hint: "まず空き部屋があってもよいとして数え（重複順列）、空き部屋がある場合を引く。",
            steps: rooms === 2
              ? [`空き部屋を許すと $2^{${n}}=${2 ** n}$`, `全員が A か全員が B の 2 通りを引く`, `$${2 ** n}-2=${v}$`]
              : [`空き部屋を許すと $3^{${n}}=${3 ** n}$`, `ちょうど1部屋が空く：空く部屋の選び方 3 通り × $(2^{${n}}-2)$ = ${3 * (2 ** n - 2)}`, `ちょうど2部屋が空く：3 通り`, `$${3 ** n}-${3 * (2 ** n - 2)}-3=${v}$`],
          };
        }),
        t("HA-baai-4d", (r) => {
          const n = r(4, 6), k = pick(r, [0, 0, 1, 2]), m = n - k;
          const D = [1, 0, 1, 2, 9, 44, 265];
          const v = nCr(n, k) * D[m];
          const seq = [];
          for (let j = 4; j <= m; j++) seq.push(`$D_{${j}}=${j - 1}(${D[j - 1]}+${D[j - 2]})=${D[j]}$`);
          return {
            q: `${n} 人がそれぞれプレゼントを1つずつ持ち寄って交換し、全員が1つずつ受け取る。${k === 0 ? "どの人も自分の持ってきたプレゼントを受け取らない" : `ちょうど ${k} 人だけが自分の持ってきたプレゼントを受け取る`}受け取り方は何通り？`,
            ans: v,
            unit: "通り",
            hint: "$m$ 人で誰も自分のものを受け取らない受け取り方を $D_{m}$ 通りとおき、ある人のプレゼントを受け取る人に注目して漸化式を作る。",
            steps: [
              `$m$ 人で誰も自分のものを受け取らない受け取り方を $D_{m}$ 通りとすると $D_{2}=1,\\ D_{3}=2$`,
              `人 1 のプレゼントを受け取る人 X は $m-1$ 通り。X のプレゼントを人 1 が受け取るなら残りは $D_{m-2}$ 通り、受け取らないなら（人 1 を X の代わりと考えて）$D_{m-1}$ 通り。よって $D_{m}=(m-1)(D_{m-1}+D_{m-2})$`,
              ...(seq.length ? [seq.join("、")] : []),
              k === 0 ? `$D_{${n}}=${v}$ 通り` : `自分のものを受け取る ${k} 人の選び方は $${C_(n, k)}=${nCr(n, k)}$ 通り、残りの ${m} 人は誰も自分のものを受け取らないので $${nCr(n, k)}\\times D_{${m}}=${nCr(n, k)}\\times ${D[m]}=${v}$ 通り`,
            ],
          };
        }),
        t("HA-baai-4e", (r) => {
          const k = r(2, 4), n = r(2 * k + 2, 12);
          const x = nCr(n - k - 1, k - 1), y = nCr(n - k, k), v = x + y;
          return {
            q: `円周上に等間隔に並んだ ${n} 個の点から ${k} 個を選ぶとき、選んだ点のどの2つも隣り合わない選び方は何通り？`,
            ans: v,
            unit: "通り",
            hint: "特定の1点 P を選ぶか選ばないかで分けると、どちらも「1列に並んだ点から隣り合わないように選ぶ」問題になる。",
            steps: [
              `1列に並んだ $a$ 個から隣り合わない $b$ 個を選ぶ方法は、選ばない $a-b$ 個の間と両端の $a-b+1$ か所から $b$ か所を選ぶと考えて ${tex("{}_{a-b+1}\\mathrm{C}_{b}")} 通り`,
              `点 P を選ぶとき：P の両隣は選べないので、残りの1列 ${n - 3} 個から ${k - 1} 個を選ぶ：$${C_(n - k - 1, k - 1)}=${x}$`,
              `P を選ばないとき：残りの1列 ${n - 1} 個から ${k} 個を選ぶ：$${C_(n - k, k)}=${y}$`,
              `$${x}+${y}=${v}$ 通り`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HA-kakuritsu", area: "data", name: "確率", desc: "余事象・独立試行・反復試行",
    prereqs: ["HA-baai", "J2-g2c6u3"],
    points: [
      "$P(A)=\\frac{n(A)}{n(U)}$。さいころ2個なら全体は $6^{2}=36$ 通り（2個を区別して数える）。",
      "余事象 $P(\\overline{A})=1-P(A)$。「少なくとも1つ」は余事象で考えると早い。",
      "独立な試行では確率を掛ける。反復試行：確率 $p$ の事象が $n$ 回中ちょうど $r$ 回起こる確率は $_{n}\\mathrm{C}_{r}\\,p^{r}(1-p)^{n-r}$",
    ],
    levels: {
      1: [
        t("HA-kakuritsu-1a", (r) => {
          const s = r(3, 11), atLeast = r(0, 1) === 1;
          const pairs = dice(2).filter(([a, b]) => (atLeast ? a + b >= s : a + b === s));
          return {
            q: `2個のさいころを同時に投げるとき、出た目の和が ${s}${atLeast ? " 以上" : " "}になる確率は？`,
            ans: fracAns(pairs.length, 36),
            hint: "2個のさいころを区別して、36 通りの表で数える。",
            steps: [
              pairs.length <= 8 ? `目の組は ${pairs.map(([a, b]) => `(${a}, ${b})`).join(", ")} の ${pairs.length} 通り` : `表で数えると ${pairs.length} 通り`,
              `$${fr(pairs.length, 36)}$`,
            ],
          };
        }),
        t("HA-kakuritsu-1b", (r) => {
          const a = r(2, 6), b = r(2, 6), N = a + b, both = r(0, 1) === 1;
          const num = both ? nCr(a, 2) : a * b, den = nCr(N, 2);
          return {
            q: `赤玉 ${a} 個と白玉 ${b} 個が入った袋から、同時に2個取り出すとき、${both ? "2個とも赤玉である" : "赤玉と白玉が1個ずつである"}確率は？`,
            ans: fracAns(num, den),
            hint: "全体は $_{n}\\mathrm{C}_{2}$ 通り。玉はすべて区別して数える。",
            steps: [
              `全体：$${C_(N, 2)}=${den}$ 通り`,
              both ? `赤2個：$${C_(a, 2)}=${num}$ 通り` : `赤1個・白1個：$${a}\\times ${b}=${num}$ 通り`,
              `$${fr(num, den)}$`,
            ],
          };
        }),
        t("HA-kakuritsu-1c", (r) => {
          if (r(0, 1)) {
            const n = r(2, 6);
            return {
              q: `1枚の硬貨を ${n} 回投げるとき、少なくとも1回表が出る確率は？`,
              ans: fracAns(2 ** n - 1, 2 ** n),
              hint: "「少なくとも1回」は余事象「1回も表が出ない」を考える。",
              steps: [`1回も表が出ない確率は $\\left(\\frac{1}{2}\\right)^{${n}}=\\frac{1}{${2 ** n}}$`, `$1-\\frac{1}{${2 ** n}}=${fracTex(2 ** n - 1, 2 ** n)}$`],
            };
          }
          const n = r(2, 3);
          return {
            q: `1個のさいころを ${n} 回投げるとき、少なくとも1回 6 の目が出る確率は？`,
            ans: fracAns(6 ** n - 5 ** n, 6 ** n),
            hint: "余事象「1回も 6 が出ない」の確率を1から引く。",
            steps: [`1回も 6 が出ない確率は $\\left(\\frac{5}{6}\\right)^{${n}}=\\frac{${5 ** n}}{${6 ** n}}$`, `$1-\\frac{${5 ** n}}{${6 ** n}}=${fracTex(6 ** n - 5 ** n, 6 ** n)}$`],
          };
        }),
        t("HA-kakuritsu-1d", (r) => {
          const n = r(4, 7), kind = r(0, 3);
          const cnt = [fact(n - 1) * 2, fact(n - 2), 2 * fact(n - 2), (n - 2) * 2 * fact(n - 2)][kind];
          const what = ["A と B が隣り合う", "A が左端、B が右端にくる", "A と B が両端にくる", "A と B の間にちょうど1人が入る"][kind];
          return {
            q: `A, B を含む ${n} 人が、くじで順番を決めて1列に並ぶ。${what}確率は？`,
            ans: fracAns(cnt, fact(n)),
            hint: "並び方の全体は $n!$ 通りで、どれも同様に確からしい。条件を満たす並び方を順列で数える。",
            steps: [
              `全体は $${n}!=${fact(n)}$ 通り`,
              [
                `A と B をひとまとめにして ${n - 1} 人の並び $${n - 1}!$ 通り、まとまりの中の並び 2 通り：$${fact(n - 1)}\\times 2=${cnt}$ 通り`,
                `A, B の位置が決まり、残りの ${n - 2} 人の並びは $${n - 2}!=${cnt}$ 通り`,
                `両端の A, B の並び 2 通り、残りの ${n - 2} 人の並び $${n - 2}!$ 通り：$2\\times ${fact(n - 2)}=${cnt}$ 通り`,
                `間に入る人の選び方 ${n - 2} 通り、A□B か B□A かで 2 通り、その3人をひとまとめにして残りと並べる $${n - 2}!$ 通り：$${n - 2}\\times 2\\times ${fact(n - 2)}=${cnt}$ 通り`,
              ][kind],
              `$${fr(cnt, fact(n))}$`,
            ],
          };
        }),
      ],
      2: [
        t("HA-kakuritsu-2a", (r) => {
          const n = r(3, 5), k = r(1, n - 1);
          const [ev, p] = pick(r, [["1 の目", [1, 6]], ["3 の倍数の目", [1, 3]], ["偶数の目", [1, 2]], ["5 以上の目", [1, 3]]]);
          const q = [p[1] - p[0], p[1]];
          const v = fmul([nCr(n, k), 1], fmul(fpow(p, k), fpow(q, n - k)));
          return {
            q: `1個のさいころを ${n} 回投げるとき、${ev}がちょうど ${k} 回出る確率は？`,
            ans: fa(v),
            hint: "反復試行：何回目に出るかの選び方 $_{n}\\mathrm{C}_{r}$ を掛けるのを忘れずに。",
            steps: [
              `1回で${ev}が出る確率は $${ft(p)}$`,
              `$${C_(n, k)}\\left(${ft(p)}\\right)^{${k}}\\left(${ft(q)}\\right)^{${n - k}}=${ft(v)}$`,
            ],
          };
        }),
        t("HA-kakuritsu-2b", (r) => {
          const a = r(3, 7), b = r(2, 5), N = a + b;
          const num = nCr(N, 3) - nCr(a, 3), den = nCr(N, 3);
          return {
            q: `赤玉 ${a} 個と白玉 ${b} 個が入った袋から、同時に3個取り出すとき、少なくとも1個が白玉である確率は？`,
            ans: fracAns(num, den),
            hint: "余事象「3個とも赤玉」を考える。",
            steps: [`3個とも赤玉の確率 $\\frac{${C_(a, 3)}}{${C_(N, 3)}}=${fr(nCr(a, 3), den)}$`, `$1-${fracTex(nCr(a, 3), den)}=${fracTex(num, den)}$`],
          };
        }),
        t("HA-kakuritsu-2c", (r) => {
          const p1 = pick(r, [[1, 2], [2, 3], [3, 4], [1, 3], [3, 5], [2, 5], [4, 5]]), p2 = pick(r, [[1, 2], [2, 3], [3, 4], [1, 4], [3, 5], [1, 5]]);
          const q1 = [p1[1] - p1[0], p1[1]], q2 = [p2[1] - p2[0], p2[1]];
          const one = r(0, 1) === 1;
          const v = one ? fadd(fmul(p1, q2), fmul(q1, p2)) : fsub([1, 1], fmul(q1, q2));
          return {
            q: `A、B の2人が的をねらって1回ずつ矢を射る。命中する確率はそれぞれ ${tex(ft(p1))}、${tex(ft(p2))} である。${one ? "ちょうど1人だけが命中する" : "少なくとも1人が命中する"}確率は？`,
            ans: fa(v),
            hint: one ? "「Aだけ命中」と「Bだけ命中」に分けて足す（独立なので掛け算）。" : "余事象「2人とも外れる」を考える。",
            steps: one
              ? [`Aだけ：$${ft(p1)}\\times ${ft(q2)}$、Bだけ：$${ft(q1)}\\times ${ft(p2)}$`, `$${ft(fmul(p1, q2))}+${ft(fmul(q1, p2))}=${ft(v)}$`]
              : [`2人とも外れる確率 $${ft(q1)}\\times ${ft(q2)}=${ft(fmul(q1, q2))}$`, `$1-${ft(fmul(q1, q2))}=${ft(v)}$`],
          };
        }),
        t("HA-kakuritsu-2d", (r) => {
          const n = r(3, 4), kind = r(0, 2), T = 3 ** n;
          const cnt = [3 * n, T - 3 * (2 ** n - 2), 3 * nCr(n, 2)][kind];
          const what = ["1人だけが勝つ", "あいこになる", "ちょうど2人が勝つ"][kind];
          return {
            q: `${n} 人で1回じゃんけんをする。各人はグー・チョキ・パーを同様に確からしく出すとき、${what}確率は？`,
            ans: fracAns(cnt, T),
            hint: kind === 1 ? "勝負がつくのは、出た手がちょうど2種類のとき。あいこはその余事象。" : "「誰が」勝つか、「どの手で」勝つかを選ぶ。",
            steps: [
              `手の出し方は全部で $3^{${n}}=${T}$ 通り`,
              [
                `勝つ1人の選び方 ${n} 通り、勝つ手の選び方 3 通り：$${n}\\times 3=${cnt}$ 通り`,
                `勝負がつくのは出た手が2種類のとき：2種類の手の選び方 3 通り、全員がそのどちらかを出して全員が同じではない出し方 $2^{${n}}-2=${2 ** n - 2}$ 通り。あいこは $${T}-3\\times ${2 ** n - 2}=${cnt}$ 通り`,
                `勝つ2人の選び方 $${C_(n, 2)}=${nCr(n, 2)}$ 通り、勝つ手の選び方 3 通り：$${nCr(n, 2)}\\times 3=${cnt}$ 通り`,
              ][kind],
              `$${fr(cnt, T)}$`,
            ],
          };
        }),
      ],
      3: [
        t("HA-kakuritsu-3a", (r) => {
          const k = r(2, 6), mx = r(0, 1) === 1;
          const num = mx ? k ** 3 - (k - 1) ** 3 : (7 - k) ** 3 - (6 - k) ** 3;
          return {
            q: `3個のさいころを同時に投げるとき、出た目の${mx ? "最大値" : "最小値"}が ${k} である確率は？`,
            ans: fracAns(num, 216),
            hint: mx ? "「最大値が k 以下」から「最大値が k−1 以下」を引く。" : "「最小値が k 以上」から「最小値が k+1 以上」を引く。",
            steps: mx
              ? [`最大値が ${k} 以下：$${k}^{3}$ 通り、${k - 1} 以下：$${k - 1}^{3}$ 通り`, `$\\frac{${k ** 3}-${(k - 1) ** 3}}{216}=${fr(num, 216)}$`]
              : [`最小値が ${k} 以上：$${7 - k}^{3}$ 通り、${k + 1} 以上：$${6 - k}^{3}$ 通り`, `$\\frac{${(7 - k) ** 3}-${(6 - k) ** 3}}{216}=${fr(num, 216)}$`],
          };
        }),
        t("HA-kakuritsu-3b", (r) => {
          const n = r(4, 6), a = r(1, 3), b = r(1, 2), s = r(1, n - 1);
          const [ev, p] = pick(r, [["3 の倍数", [1, 3]], ["偶数", [1, 2]]]);
          const q = [p[1] - p[0], p[1]];
          const X = s * a - (n - s) * b;
          const v = fmul([nCr(n, s), 1], fmul(fpow(p, s), fpow(q, n - s)));
          return {
            q: `数直線上の原点に点 P がある。1個のさいころを投げ、${ev}の目が出たら P を正の向きに ${a}、それ以外の目が出たら負の向きに ${b} だけ動かす。さいころを ${n} 回投げたとき、P が ${tex(`x=${X}`)} の位置にある確率は？`,
            ans: fa(v),
            hint: `${ev}の目が出る回数を $k$ として、${n} 回後の位置を $k$ で表す。`,
            steps: [
              `${ev}が $k$ 回出ると位置は $${a === 1 ? "" : a}k-${b === 1 ? "" : b}(${n}-k)$。これが ${X} になるのは $k=${s}$`,
              `$${C_(n, s)}\\left(${ft(p)}\\right)^{${s}}\\left(${ft(q)}\\right)^{${n - s}}=${ft(v)}$`,
            ],
          };
        }),
        t("HA-kakuritsu-3c", (r) => {
          const n = r(3, 4), kind = n === 3 ? r(0, 2) : r(0, 1), T = 6 ** n;
          const vs = n === 3 ? "a,\\ b,\\ c" : "a,\\ b,\\ c,\\ d";
          const inc = n === 3 ? "a<b<c" : "a<b<c<d", dec = n === 3 ? "a>b>c" : "a>b>c>d";
          const cnt = [nCr(6, n), 2 * nCr(6, n), 55][kind];
          const what = [`$${inc}$ となる`, `$${inc}$ または $${dec}$ となる`, "$a<b$ かつ $b>c$ となる"][kind];
          return {
            q: `1個のさいころを ${n} 回投げ、出た目を順に $${vs}$ とする。${what}確率は？`,
            ans: fracAns(cnt, T),
            hint: kind === 2 ? "真ん中の $b$ の値で場合分けする。" : "異なる目の組を先に選べば、小さい順（大きい順）に並べる方法は1通りに決まる。",
            steps: kind === 2
              ? ["$b=k$ のとき、$a,\\ c$ はどちらも $k$ より小さい $k-1$ 通りずつで $(k-1)^{2}$ 通り", "$b=1,\\ 2,\\ \\ldots,\\ 6$ について足して $0+1+4+9+16+25=55$ 通り", `$${fr(55, 216)}$`]
              : [`異なる ${n} 個の目の選び方 $${C_(6, n)}=${nCr(6, n)}$ 通りに対して、${kind === 0 ? "小さい順に並べる並べ方は1通り" : "増加する並べ方・減少する並べ方はそれぞれ1通り"}`, `$\\frac{${kind === 0 ? "" : "2\\times "}${nCr(6, n)}}{${T}}=${fracTex(cnt, T)}$`],
          };
        }),
        t("HA-kakuritsu-3d", (r) => {
          const s = r(5, 16);
          const combos = [];
          for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) { const c = s - a - b; if (c >= b && c <= 6) combos.push([a, b, c]); }
          const ks = combos.map(([a, b, c]) => (a === c ? 1 : a === b || b === c ? 3 : 6));
          const cnt = ks.reduce((x, y) => x + y, 0);
          const terms = [6, 3, 1].map((k) => [k, ks.filter((x) => x === k).length]).filter(([, c]) => c).map(([k, c]) => `${k}\\times ${c}`).join("+");
          return {
            q: `3個のさいころを同時に投げるとき、出た目の和が ${s} になる確率は？`,
            ans: fracAns(cnt, 216),
            hint: "目の組を大小の区別なしで書き出し、それぞれが何通りの出方にあたるか（並べ方）を数える。",
            steps: [
              `和が ${s} になる目の組（大小の区別なし）は ${combos.map((c) => `(${c.join(", ")})`).join(", ")}`,
              `3つとも異なる組は $3!=6$ 通り、2つだけ同じ組は 3 通り、3つとも同じ組は 1 通りの出方にあたるので $${terms}=${cnt}$ 通り`,
              `$${fr(cnt, 216)}$`,
            ],
          };
        }),
      ],
      4: [
        t("HA-kakuritsu-4a", (r) => {
          const m = r(3, 4), p = pick(r, [[1, 2], [2, 3], [1, 3], [3, 5]]);
          const q = [p[1] - p[0], p[1]];
          let tot = [0, 1];
          const parts = [];
          for (let k = 0; k < m; k++) {
            const term = fmul([nCr(m - 1 + k, k), 1], fmul(fpow(p, m), fpow(q, k)));
            parts.push(`$${m + k}$ 試合目：$${C_(m - 1 + k, k)}\\left(${ft(p)}\\right)^{${m - 1}}\\left(${ft(q)}\\right)^{${k}}\\times ${ft(p)}=${ft(term)}$`);
            tot = fadd(tot, term);
          }
          return {
            q: `A と B が試合を行い、1試合で A が勝つ確率は ${tex(ft(p))}（引き分けはない）とする。先に ${m} 勝した方を優勝とするとき、A が優勝する確率は？`,
            ans: fa(tot),
            hint: `A が何試合目で優勝するかで分ける。最後の試合は A が勝ち、それまでに A がちょうど ${m - 1} 勝している。`,
            steps: [parts.slice(0, 2).join("、"), parts.slice(2).join("、"), `合計 $${ft(tot)}$`],
          };
        }),
        t("HA-kakuritsu-4b", (r) => {
          const n = r(2, 3), k = pick(r, [4, 6, 8, 9, 10, 12]);
          const all = dice(n), good = all.filter((d) => d.reduce((a, b) => a * b, 1) % k === 0).length;
          if (good === 0 || n === 2 && k === 8) return { skip: true };
          return {
            q: `${n} 個のさいころを同時に投げるとき、出た目の積が ${k} の倍数になる確率は？`,
            ans: fracAns(good, 6 ** n),
            hint: `$${k}$ を素因数分解して、各素因数が積に何個含まれるかで考える。余事象を使うと数えやすい。`,
            steps: [
              `全体 $6^{${n}}=${6 ** n}$ 通り`,
              `積が ${k} の倍数にならない目の出方は ${6 ** n - good} 通り（${k} の素因数が足りない場合を数える）`,
              `$\\frac{${6 ** n}-${6 ** n - good}}{${6 ** n}}=${fr(good, 6 ** n)}$`,
            ],
          };
        }),
        t("HA-kakuritsu-4c", (r) => {
          const n = r(3, 4), b = r(1, 4), a = r(b + 1, 6), d = a - b;
          const num = (d + 1) ** n - 2 * d ** n + (d - 1) ** n;
          return {
            q: `${n} 個のさいころを同時に投げるとき、出た目の最大値が ${a}、最小値が ${b} である確率は？`,
            ans: fracAns(num, 6 ** n),
            hint: `すべての目が ${b} 以上 ${a} 以下の場合から、${a} が1つもない場合と ${b} が1つもない場合を除く。`,
            steps: [
              `すべての目が ${b}〜${a}：$${d + 1}^{${n}}$ 通り。そのうち ${a} がない：$${d}^{${n}}$、${b} がない：$${d}^{${n}}$、両方ない：$${d - 1}^{${n}}$`,
              `$${(d + 1) ** n}-2\\times ${d ** n}+${(d - 1) ** n}=${num}$ 通り`,
              `$${fr(num, 6 ** n)}$`,
            ],
          };
        }),
        t("HA-kakuritsu-4d", (r) => {
          const n = r(5, 10);
          const a = [1, 2];
          for (let k = 2; k <= n; k++) a.push(a[k - 1] + a[k - 2]);
          return {
            q: `1枚の硬貨を ${n} 回投げるとき、表が2回以上続けて出ることが一度もない確率は？`,
            ans: fracAns(a[n], 2 ** n),
            hint: "最後の回が裏か表かで場合分けして、表が続かない出方の数の漸化式を作る。",
            steps: [
              `$k$ 回投げて表が続かない出方を $a_{k}$ 通りとすると $a_{1}=2,\\ a_{2}=3$`,
              `最後が裏ならその前の $k-1$ 回は表が続かない出方で $a_{k-1}$ 通り、最後が表ならその前は裏で、さらに前の $k-2$ 回が $a_{k-2}$ 通り。よって $a_{k}=a_{k-1}+a_{k-2}$`,
              Array.from({ length: n - 2 }, (_, i) => `$a_{${i + 3}}=${a[i + 3]}$`).join("、"),
              `$\\frac{${a[n]}}{2^{${n}}}=${fracTex(a[n], 2 ** n)}$`,
            ],
          };
        }),
        t("HA-kakuritsu-4e", (r) => {
          const n = r(3, 5), k = r(2, 3);
          const sur = k === 2 ? 2 ** n - 2 : 3 ** n - 3 * 2 ** n + 3;
          const cnt = nCr(6, k) * sur, T = 6 ** n;
          return {
            q: `${n} 個のさいころを同時に投げるとき、出た目がちょうど ${k} 種類である確率は？`,
            ans: fracAns(cnt, T),
            hint: "先に「出る目の種類」を選び、その目だけを使ってどの目も少なくとも1回出る出方を数える（使われない目がある場合を除く）。",
            steps: [
              `出る ${k} 種類の目の選び方は $${C_(6, k)}=${nCr(6, k)}$ 通り`,
              k === 2
                ? `その2種類の目だけが出て、両方とも出る出方：$2^{${n}}-2=${sur}$ 通り（全部同じ目になる2通りを除く）`
                : `その3種類の目だけが出て、3種類とも出る出方：$3^{${n}}-3\\times(2^{${n}}-2)-3=${sur}$ 通り（ちょうど2種類・1種類になる場合を除く）`,
              `$\\frac{${nCr(6, k)}\\times ${sur}}{6^{${n}}}=${fr(cnt, T)}$`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HA-joken", area: "data", name: "条件付き確率と期待値", desc: "乗法定理・期待値",
    prereqs: ["HA-kakuritsu"],
    points: [
      "条件付き確率 $P_{A}(B)=\\frac{P(A\\cap B)}{P(A)}$：$A$ が起こったと分かっているときに $B$ が起こる確率。",
      "乗法定理 $P(A\\cap B)=P(A)P_{A}(B)$。引いたくじを戻さないときに使う。",
      "原因の確率：「結果がわかったとき、それが原因 $A$ によるものである確率」は $\\frac{P(A\\cap B)}{P(B)}$ で、$P(B)$ は原因ごとに分けて足す。",
      "期待値 $E=x_{1}p_{1}+x_{2}p_{2}+\\cdots+x_{n}p_{n}$（値 × 確率 の和）",
    ],
    levels: {
      1: [
        t("HA-joken-1a", (r) => {
          const n = r(6, 15), k = r(2, Math.min(5, n - 2));
          const kind = r(0, 2);
          const v = [[k, n], [k * (k - 1), n * (n - 1)], [k - 1, n - 1]][kind];
          const what = ["B が当たる", "A、B がともに当たる", "A が当たったとき、B も当たる"][kind];
          return {
            q: `${n} 本のうち ${k} 本が当たりのくじがある。A、B の順に1本ずつ引き、引いたくじは戻さない。${what}確率は？`,
            ans: fracAns(...v),
            hint: kind === 0 ? "A が当たる場合と外れる場合に分けて足す。" : kind === 1 ? "乗法定理：$P(A\\cap B)=P(A)P_{A}(B)$" : "A が当たったあと、残りのくじは何本で、当たりは何本か。",
            steps: [
              kind === 0
                ? `$\\frac{${k}}{${n}}\\cdot\\frac{${k - 1}}{${n - 1}}+\\frac{${n - k}}{${n}}\\cdot\\frac{${k}}{${n - 1}}=\\frac{${k * (n - 1)}}{${n * (n - 1)}}$`
                : kind === 1 ? `$\\frac{${k}}{${n}}\\times\\frac{${k - 1}}{${n - 1}}$` : `残り ${n - 1} 本のうち当たりは ${k - 1} 本`,
              `$${fracTex(...v)}$`,
            ],
          };
        }),
        t("HA-joken-1b", (r) => {
          const N = pick(r, [10, 20, 50, 100]);
          const a = r(1, 3), b = r(2, 8);
          if (a + b >= N) return { skip: true };
          const x = pick(r, [500, 1000, 2000, 3000, 5000]), y = pick(r, [100, 200, 300, 500]);
          if (x === y) return { skip: true }; // 2種類の当たりが同じ金額にならないように
          const E = [x * a + y * b, N];
          return {
            q: `${N} 本のくじに、${x} 円の当たりが ${a} 本、${y} 円の当たりが ${b} 本入っていて、残りは外れ（0 円）である。このくじを1本引くときの賞金の期待値は？`,
            ans: fa(E),
            unit: "円",
            hint: "（賞金）×（その確率）をすべて足す。",
            steps: [`$${x}\\times\\frac{${a}}{${N}}+${y}\\times\\frac{${b}}{${N}}+0$`, `$=\\frac{${x * a + y * b}}{${N}}=${fracTex(...E)}$ 円`],
          };
        }),
        t("HA-joken-1c", (r) => {
          const s = r(7, 10);
          const conds = [["大きいさいころの目が偶数である", ([a]) => a % 2 === 0], ["少なくとも一方の目が 6 である", ([a, b]) => a === 6 || b === 6], ["目の和が偶数である", ([a, b]) => (a + b) % 2 === 0]];
          const evs = [[`目の和が ${s} 以上である`, ([a, b]) => a + b >= s], ["2つの目が等しい", ([a, b]) => a === b], ["小さいさいころの目が 3 の倍数である", ([, b]) => b % 3 === 0]];
          const [cn, cf] = pick(r, conds), [en, ef] = pick(r, evs);
          const A = dice(2).filter(cf), AB = A.filter(ef);
          if (AB.length === 0 || AB.length === A.length) return { skip: true };
          return {
            q: `大小2個のさいころを投げる。${cn}とき、${en}確率は？`,
            ans: fracAns(AB.length, A.length),
            hint: "条件となる出方だけを全体と考えて、その中で数える。$P_{A}(B)=\\frac{n(A\\cap B)}{n(A)}$",
            steps: [`${cn}出方は ${A.length} 通り`, `そのうち${en}ものは ${AB.length} 通り`, `$${fr(AB.length, A.length)}$`],
          };
        }),
        t("HA-joken-1d", (r) => {
          if (r(0, 1)) {
            const x = r(5, 12), y = r(2, 6), z = r(0, 3);
            if (!(x > y && y > z)) return { skip: true };
            return {
              q: `1個のさいころを投げて、1 の目が出たら ${x} 点、2 か 3 の目が出たら ${y} 点、4 以上の目が出たら ${z} 点をもらえる。もらえる得点の期待値は？`,
              ans: fracAns(x + 2 * y + 3 * z, 6),
              unit: "点",
              hint: "（得点）×（その得点をもらえる確率）をすべて足す。",
              steps: ["それぞれの確率は $\\frac{1}{6},\\ \\frac{2}{6},\\ \\frac{3}{6}$", `$${x}\\times\\frac{1}{6}+${y}\\times\\frac{2}{6}+${z}\\times\\frac{3}{6}=${fr(x + 2 * y + 3 * z, 6)}$ 点`],
            };
          }
          const x = pick(r, [800, 1000, 1200, 1600, 2000]), y = pick(r, [200, 400, 600, 800]);
          if (y >= x) return { skip: true };
          return {
            q: `硬貨を3枚同時に投げて、3枚とも表なら ${x} 円、ちょうど2枚が表なら ${y} 円をもらい、それ以外は何ももらえない。もらえる金額の期待値は？`,
            ans: fracAns(x + 3 * y, 8),
            unit: "円",
            hint: "（金額）×（その金額をもらえる確率）をすべて足す。表の枚数の確率は 8 通りの出方で数える。",
            steps: [`3枚とも表：$\\frac{1}{8}$、ちょうど2枚が表：$\\frac{${C_(3, 2)}}{8}=\\frac{3}{8}$`, `$${x}\\times\\frac{1}{8}+${y}\\times\\frac{3}{8}+0=${fr(x + 3 * y, 8)}$ 円`],
          };
        }),
      ],
      2: [
        t("HA-joken-2a", (r) => {
          const bo = r(12, 22), gi = r(12, 22), m = r(2, bo - 2), f = r(2, gi - 2);
          const ask = r(0, 1);
          const v = ask ? [m, m + f] : [f, gi];
          return {
            q: `ある学級は男子 ${bo} 人、女子 ${gi} 人で、めがねをかけている人は男子 ${m} 人、女子 ${f} 人である。この学級から1人を選ぶとき、${ask ? "選んだ人がめがねをかけていたときに、その人が男子である" : "選んだ人が女子であったときに、その人がめがねをかけている"}確率は？`,
            ans: fracAns(...v),
            hint: "条件となる人たちだけを全体として考える。",
            steps: ask ? [`めがねの人は $${m}+${f}=${m + f}$ 人、そのうち男子は ${m} 人`, `$${fr(m, m + f)}$`] : [`女子 ${gi} 人のうち、めがねは ${f} 人`, `$${fr(f, gi)}$`],
          };
        }),
        t("HA-joken-2b", (r) => {
          const a = r(2, 6), b = r(2, 6), N = a + b, T = nCr(N, 2);
          const p0 = nCr(b, 2), p1 = a * b, p2 = nCr(a, 2);
          const E = [p1 + 2 * p2, T];
          return {
            q: `赤玉 ${a} 個と白玉 ${b} 個が入った袋から、同時に2個取り出す。取り出した赤玉の個数の期待値は？`,
            ans: fa(E),
            unit: "個",
            hint: "赤玉が 0 個、1 個、2 個のそれぞれの確率を求めて、期待値を計算する。",
            steps: [
              `全体 $${C_(N, 2)}=${T}$。赤 0 個：${p0} 通り、1 個：${p1} 通り、2 個：${p2} 通り`,
              `$0\\times\\frac{${p0}}{${T}}+1\\times\\frac{${p1}}{${T}}+2\\times\\frac{${p2}}{${T}}=${fr(p1 + 2 * p2, T)}$`,
            ],
          };
        }),
        t("HA-joken-2c", (r) => {
          const a1 = r(1, 5), b1 = r(1, 5), a2 = r(1, 5), b2 = r(1, 5);
          const n1 = a1 + b1, n2 = a2 + b2;
          const v = fadd(fmul([a1, n1], [a2 + 1, n2 + 1]), fmul([b1, n1], [a2, n2 + 1]));
          return {
            q: `袋 A には赤玉 ${a1} 個と白玉 ${b1} 個、袋 B には赤玉 ${a2} 個と白玉 ${b2} 個が入っている。袋 A から玉を1個取り出して袋 B に入れ、よくかき混ぜてから袋 B から玉を1個取り出す。袋 B から取り出した玉が赤玉である確率は？`,
            ans: fa(v),
            hint: "袋 A から移した玉が赤か白かで場合分けし、乗法定理で掛けてから足す。",
            steps: [
              `赤を移す（確率 $${fr(a1, n1)}$）と B は赤 ${a2 + 1} 個・白 ${b2} 個になり、赤を取り出す確率は $${fr(a2 + 1, n2 + 1)}$`,
              `白を移す（確率 $${fr(b1, n1)}$）と B は赤 ${a2} 個・白 ${b2 + 1} 個になり、赤を取り出す確率は $${fr(a2, n2 + 1)}$`,
              `$${ft([a1, n1])}\\times ${ft([a2 + 1, n2 + 1])}+${ft([b1, n1])}\\times ${ft([a2, n2 + 1])}=${ft(v)}$`,
            ],
          };
        }),
        t("HA-joken-2d", (r) => {
          const a = r(1, 2), b = r(1, 3), c = r(3, 6), x = pick(r, [1000, 500]), y = pick(r, [100, 200]);
          const N = a + b + c, T = nCr(N, 2);
          const rows = [[2 * x, nCr(a, 2)], [x + y, a * b], [x, a * c], [2 * y, nCr(b, 2)], [y, b * c], [0, nCr(c, 2)]].filter(([, k]) => k > 0);
          const S = rows.reduce((s, [v, k]) => s + v * k, 0);
          return {
            q: `${x} 円の当たりが ${a} 本、${y} 円の当たりが ${b} 本、外れが ${c} 本の、合わせて ${N} 本のくじがある。このくじを同時に2本引くとき、もらえる賞金の合計の期待値は？`,
            ans: fracAns(S, T),
            unit: "円",
            hint: "引いた2本の組合せごとに賞金の合計がいくらになるかで場合を分け、それぞれの確率を求める。",
            steps: [
              `2本の引き方は全部で $${C_(N, 2)}=${T}$ 通り`,
              `賞金の合計は ${rows.map(([v, k]) => `${v} 円が ${k} 通り`).join("、")}`,
              `$\\frac{${rows.filter(([v]) => v > 0).map(([v, k]) => `${v}\\times ${k}`).join("+")}}{${T}}=${fr(S, T)}$ 円`,
            ],
          };
        }),
      ],
      3: [
        t("HA-joken-3a", (r) => {
          const a1 = r(1, 6), b1 = r(1, 6), a2 = r(1, 6), b2 = r(1, 6);
          const [how, pA] = pick(r, [["硬貨を投げて表なら箱 A、裏なら箱 B", [1, 2]], ["さいころを投げて 1 か 2 の目なら箱 A、それ以外なら箱 B", [1, 3]]]);
          const pB = [pA[1] - pA[0], pA[1]];
          const RA = fmul(pA, [a1, a1 + b1]), RB = fmul(pB, [a2, a2 + b2]);
          const R = fadd(RA, RB);
          if (R[0] === 0) return { skip: true };
          const v = fmul(RA, [R[1], R[0]]);
          return {
            q: `箱 A には赤玉 ${a1} 個と白玉 ${b1} 個、箱 B には赤玉 ${a2} 個と白玉 ${b2} 個が入っている。${how} を選び、選んだ箱から玉を1個取り出す。取り出した玉が赤玉であったとき、それが箱 A から取り出されたものである確率は？`,
            ans: fa(v),
            hint: "「赤玉が出る」確率を、箱 A の場合と箱 B の場合に分けて求める。",
            steps: [
              `A から赤：$${ft(pA)}\\times\\frac{${a1}}{${a1 + b1}}=${ft(RA)}$、B から赤：$${ft(pB)}\\times\\frac{${a2}}{${a2 + b2}}=${ft(RB)}$`,
              `赤が出る確率は $${ft(R)}$`,
              `$\\frac{${ft(RA)}}{${ft(R)}}=${ft(v)}$`,
            ],
          };
        }),
        t("HA-joken-3b", (r) => {
          const kind = r(0, 2);
          const f = [(a, b) => Math.max(a, b), (a, b) => Math.min(a, b), (a, b) => Math.abs(a - b)][kind];
          const name = ["大きい方の目（同じならその目）", "小さい方の目（同じならその目）", "目の差の絶対値"][kind];
          const cnt = {};
          let sum = 0;
          for (const [a, b] of dice(2)) { const v = f(a, b); cnt[v] = (cnt[v] || 0) + 1; sum += v; }
          return {
            q: `2個のさいころを同時に投げるとき、${name}を ${tex("X")} とする。${tex("X")} の期待値は？`,
            ans: fracAns(sum, 36),
            hint: "$X$ のとりうる値ごとに、36 通りのうち何通りかを数えて分布表を作る。",
            steps: [
              Object.entries(cnt).map(([v, c]) => `$X=${v}$：${c} 通り`).join("、"),
              `$E=\\frac{${Object.entries(cnt).map(([v, c]) => `${v}\\cdot ${c}`).join("+")}}{36}=${fr(sum, 36)}$`,
            ],
          };
        }),
        t("HA-joken-3c", (r) => {
          const a = r(2, 6), w = r(2, 6), N = a + w, kind = r(0, 2), D = N * (N - 1);
          const second = kind === 2 ? "白" : "赤", first = kind === 1 ? "白" : "赤";
          const s2 = kind === 2 ? w : a;
          const [f1, f2] = [[a, a - 1], [w, a], [a, w]][kind];
          const num = f1 * f2, den = s2 * (N - 1);
          return {
            q: `袋の中に赤玉 ${a} 個と白玉 ${w} 個が入っている。この袋から玉を1個ずつ2回取り出す（取り出した玉は戻さない）。2回目に取り出した玉が${second}玉であったとき、1回目に取り出した玉が${first}玉である確率は？`,
            ans: fracAns(num, den),
            hint: "2回目の結果がわかったときの、1回目についての条件付き確率。$P_{B}(A)=\\frac{P(A\\cap B)}{P(B)}$",
            steps: [
              `2回目が${second}玉である確率：$\\frac{${a}}{${N}}\\cdot\\frac{${kind === 2 ? w : a - 1}}{${N - 1}}+\\frac{${w}}{${N}}\\cdot\\frac{${kind === 2 ? w - 1 : a}}{${N - 1}}=\\frac{${den}}{${D}}$`,
              `1回目が${first}玉で2回目が${second}玉である確率：$\\frac{${f1}}{${N}}\\cdot\\frac{${f2}}{${N - 1}}=\\frac{${num}}{${D}}$`,
              `求める確率は $\\frac{${num}}{${D}}\\div\\frac{${den}}{${D}}=${fracTex(num, den)}$`,
            ],
          };
        }),
        t("HA-joken-3d", (r) => {
          const n = r(3, 5);
          const [ev, p] = pick(r, [["1 の目", [1, 6]], ["3 の倍数の目", [1, 3]], ["偶数の目", [1, 2]]]);
          const qq = [p[1] - p[0], p[1]];
          const ps = [];
          for (let k = 1; k < n; k++) ps.push(fmul(fpow(qq, k - 1), p));
          ps.push(fpow(qq, n - 1));
          let E = [0, 1];
          ps.forEach((x, i) => { E = fadd(E, fmul([i + 1, 1], x)); });
          return {
            q: `1個のさいころを、${ev}が出るか、${n} 回投げ終わるまで投げ続ける。投げる回数の期待値は？`,
            ans: fa(E),
            unit: "回",
            hint: `$k$ 回目で終わる確率を求める。${n} 回目まで進んだら、${n} 回目の目に関係なく終わることに注意。`,
            steps: [
              `$k$ 回目（$k<${n}$）で終わる確率は $\\left(${ft(qq)}\\right)^{k-1}\\cdot ${ft(p)}$、${n} 回目まで投げる確率は $\\left(${ft(qq)}\\right)^{${n - 1}}$`,
              `$${n === 3 ? "1,\\ 2,\\ 3" : `1,\\ 2,\\ \\ldots,\\ ${n}`}$ 回で終わる確率は順に ${ps.map((x) => tex(ft(x))).join(", ")}`,
              `$E=${ps.map((x, i) => `${i + 1}\\times ${ft(x)}`).join("+")}=${ft(E)}$`,
            ],
          };
        }),
      ],
      4: [
        t("HA-joken-4a", (r) => {
          const p = pick(r, [1, 2, 4, 5, 10]), s = pick(r, [80, 90, 95, 98]), f = pick(r, [2, 5, 10, 20]);
          const num = p * s, den = p * s + (100 - p) * f;
          return {
            q: `ある病気にかかっている人は全体の ${p}% である。ある検査では、病気にかかっている人は ${s}% の確率で陽性と判定され、かかっていない人も ${f}% の確率で陽性と判定される。陽性と判定された人が実際に病気にかかっている確率は？`,
            ans: fracAns(num, den),
            hint: "陽性になる人を「病気で陽性」と「病気でないのに陽性」に分けて考える（全体を 10000 人などとおくとよい）。",
            steps: [
              `病気で陽性：$\\frac{${p}}{100}\\times\\frac{${s}}{100}$、病気でないのに陽性：$\\frac{${100 - p}}{100}\\times\\frac{${f}}{100}$`,
              `求める確率 $=\\frac{${p}\\times ${s}}{${p}\\times ${s}+${100 - p}\\times ${f}}=\\frac{${num}}{${den}}$`,
              `$=${fracTex(num, den)}$`,
            ],
          };
        }),
        t("HA-joken-4b", (r) => {
          const a = r(1, 4), w = r(2, 6), N = a + w;
          let E = [0, 1], surv = [1, 1];
          const ps = [];
          for (let k = 1; k <= w + 1; k++) {
            const left = N - k + 1;
            const pk = fmul(surv, [a, left]);
            ps.push(pk);
            E = fadd(E, fmul([k, 1], pk));
            surv = fmul(surv, [w - k + 1, left]);
          }
          return {
            q: `赤玉 ${a} 個と白玉 ${w} 個が入った袋から、玉を1個ずつ取り出していく（取り出した玉は戻さない）。初めて赤玉が出るまでに取り出す回数（赤玉を取り出した回も含む）の期待値は？`,
            ans: fa(E),
            unit: "回",
            hint: "初めて赤玉が出るのが $k$ 回目である確率を、乗法定理で $k=1,\\ 2,\\ \\ldots$ について求める。",
            steps: [
              `$k$ 回目に初めて赤：白が $k-1$ 回続いたあと赤。$k=1,\\ \\ldots,\\ ${w + 1}$`,
              `確率は順に ${ps.map((x) => tex(ft(x))).join(", ")}`,
              `$E=\\sum k\\,P(k)=${ft(E)}$`,
            ],
          };
        }),
        t("HA-joken-4c", (r) => {
          const [m, shape] = pick(r, [[4, "正四面体"], [6, ""], [8, "正八面体"], [12, "正十二面体"], [20, "正二十面体"]]);
          const T = r(2, 3);
          const Es = [[m + 1, 2]];
          const lines = [];
          for (let t2 = 2; t2 <= T; t2++) {
            const prev = Es[t2 - 2];
            const th = Math.floor(prev[0] / prev[1]) + 1, cont = th - 1;
            let sumStop = 0;
            for (let x = th; x <= m; x++) sumStop += x;
            const E = fmul(fadd([sumStop, 1], fmul([cont, 1], prev)), [1, m]);
            Es.push(E);
            lines.push(`${t2} 回まで投げられるとき：1回目の目が $${ft(prev)}$ より大きい ${th === m ? m : `${th}〜${m}`} ならやめ、${cont === 1 ? "1" : `1〜${cont}`} なら投げ直す（その後の期待値は $${ft(prev)}$）。期待値は $\\frac{${sumStop}+${cont}\\times ${ft(prev)}}{${m}}=${ft(E)}$`);
          }
          const ET = Es[T - 1];
          return {
            q: `${shape ? `1 から ${m} までの目が同様に確からしく出る${shape}のさいころ` : "1個のさいころ"}を投げて、出た目を得点としてやめるか、その目を捨てて投げ直すかを選べる。ただし投げられるのは最大 ${T} 回で、${T} 回目に出た目はそのまま得点になる。得点の期待値が最大になるように行動するとき、その期待値は？`,
            ans: fa(ET),
            unit: "点",
            hint: "最後の回から逆に考える。「投げ直したときの期待値」と今の目を比べ、大きい方を選ぶ。",
            steps: [`1回だけなら期待値は $\\frac{1+2+\\cdots+${m}}{${m}}=${ft(Es[0])}$`, ...lines, `よって期待値は $${ft(ET)}$`],
          };
        }),
        t("HA-joken-4d", (r) => {
          const n = r(3, 4), b = r(3, 5);
          const sur = (k) => { let s = 0; for (let j = 0; j <= k; j++) s += (-1) ** j * nCr(k, j) * (k - j) ** b; return s; };
          const rows = [];
          for (let e = 0; e < n; e++) { const c = nCr(n, e) * sur(n - e); if (c > 0) rows.push([e, c, sur(n - e)]); }
          const T = n ** b, S = rows.reduce((s, [e, c]) => s + e * c, 0);
          return {
            q: `区別のつく ${b} 個の玉を、区別のつく ${n} 個の箱に入れる。どの玉もどの箱にも同様に確からしく入るとき、空の箱の個数の期待値は？`,
            ans: fracAns(S, T),
            unit: "個",
            hint: "空の箱の個数ごとに場合を分ける。「残りの箱すべてに少なくとも1個入る」入れ方は、空き箱ができる場合を除いて数える。",
            steps: [
              `入れ方は全部で $${n}^{${b}}=${T}$ 通り。$k$ 個の箱すべてに少なくとも1個入る入れ方は、$k=1$ で 1、$k=2$ で $2^{${b}}-2$、$k=3$ で $3^{${b}}-3(2^{${b}}-2)-3$${n === 4 ? `、$k=4$ で $4^{${b}}-4\\times ${sur(3)}-6\\times ${sur(2)}-4$` : ""} 通り`,
              `空の箱が ${rows.map(([e, c, s]) => `${e} 個：$${C_(n, e)}\\times ${s}=${c}$ 通り`).join("、")}`,
              `$E=\\frac{${rows.filter(([e]) => e > 0).map(([e, c]) => `${e}\\times ${c}`).join("+")}}{${T}}=${fr(S, T)}$ 個`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HA-zukei", area: "geo", name: "図形の性質", desc: "角の二等分線・重心・方べき・メネラウス・チェバ",
    prereqs: ["J3-g3c5u2", "J3-g3c6u1"],
    points: [
      "$\\triangle ABC$ で $\\angle A$ の二等分線と辺 BC の交点を D とすると $BD:DC=AB:AC$",
      "重心は中線を $2:1$ に内分する。内心は角の二等分線の交点、外心は辺の垂直二等分線の交点。",
      "方べきの定理：点 P を通る2直線が円と A, B および C, D で交わるとき $PA\\cdot PB=PC\\cdot PD$。接線なら $PT^{2}=PA\\cdot PB$",
      "メネラウス・チェバ：$\\frac{AR}{RB}\\cdot\\frac{BP}{PC}\\cdot\\frac{CQ}{QA}=1$（頂点 → 分点 → 頂点 と一周する）",
    ],
    levels: {
      1: [
        t("HA-zukei-1a", (r) => {
          const a = r(3, 12), b = r(3, 10), c = r(3, 10);
          if (b === c || a >= b + c || b >= a + c || c >= a + b) return { skip: true };
          return {
            q: `${tex("\\triangle ABC")} で ${tex(`AB=${c},\\ BC=${a},\\ CA=${b}`)} とする。${tex("\\angle A")} の二等分線と辺 BC の交点を D とするとき、${tex("BD")} の長さは？`,
            ans: fracAns(a * c, b + c),
            hint: "$BD:DC=AB:AC$ を使って、BC を比で分ける。",
            steps: [`$BD:DC=AB:AC=${c}:${b}$`, `$BD=${a}\\times\\frac{${c}}{${c}+${b}}=${fr(a * c, b + c)}$`],
          };
        }),
        t("HA-zukei-1b", (r) => {
          const a = r(2, 9), b = r(2, 9), c = r(2, 9);
          if (r(0, 1)) {
            return {
              q: `円の2つの弦 AB と CD が円の内部の点 P で交わっている。${tex(`PA=${a},\\ PB=${b},\\ PC=${c}`)} のとき、${tex("PD")} の長さは？`,
              ans: fracAns(a * b, c),
              hint: "方べきの定理 $PA\\cdot PB=PC\\cdot PD$",
              steps: [`$${a}\\times ${b}=${c}\\times PD$`, `$PD=${fr(a * b, c)}$`],
            };
          }
          const x = r(2, 9);
          const PD = [a * (a + x), c];
          if (PD[0] <= c * c) return { skip: true };
          return {
            q: `円の外部の点 P から引いた2本の直線が、円とそれぞれ2点 A, B および C, D で交わる（A, C の方が P に近い）。${tex(`PA=${a},\\ AB=${x},\\ PC=${c}`)} のとき、${tex("CD")} の長さは？`,
            ans: fracAns(a * (a + x) - c * c, c),
            hint: "方べきの定理 $PA\\cdot PB=PC\\cdot PD$。$PB=PA+AB$ に注意。",
            steps: [`$PB=${a}+${x}=${a + x}$。$${a}\\times ${a + x}=${c}\\times PD$ より $PD=${fr(a * (a + x), c)}$`, `$CD=PD-PC=${fracTex(a * (a + x), c)}-${c}=${fracTex(a * (a + x) - c * c, c)}$`],
          };
        }),
        t("HA-zukei-1c", (r) => {
          if (r(0, 1)) {
            const m = r(3, 15), ag = r(0, 1) === 1;
            return {
              q: `${tex("\\triangle ABC")} の重心を G、辺 BC の中点を M とする。${tex(`AM=${m}`)} のとき、${tex(ag ? "AG" : "GM")} の長さは？`,
              ans: fracAns(ag ? 2 * m : m, 3),
              hint: "重心は中線を $2:1$ に内分する。",
              steps: [`$AG:GM=2:1$`, `$${ag ? "AG" : "GM"}=${m}\\times\\frac{${ag ? 2 : 1}}{3}=${fracTex(ag ? 2 * m : m, 3)}$`],
            };
          }
          const S = 3 * r(2, 20);
          return {
            q: `面積が ${S} の ${tex("\\triangle ABC")} の重心を G とするとき、${tex("\\triangle GBC")} の面積は？`,
            ans: S / 3,
            hint: "$\\triangle GBC$ と $\\triangle ABC$ は底辺 BC が共通。高さの比を考える。",
            steps: [`重心は中線 AM を $2:1$ に分けるので、G の高さは A の高さの $\\frac{1}{3}$`, `$${S}\\times\\frac{1}{3}=${S / 3}$`],
          };
        }),
      ],
      2: [
        t("HA-zukei-2a", (r) => {
          const a = r(2, 8), x = r(2, 10);
          const v = a * (a + x);
          const ok = tex(sqrtTex(1, v));
          return {
            q: `円の外部の点 P から円に接線を引き、接点を T とする。P を通る直線が円と2点 A, B で交わり（A の方が P に近い）、${tex(`PA=${a},\\ AB=${x}`)} であるとき、${tex("PT")} の長さは？`,
            ans: ok,
            choices: choices4(r, ok, [tex(sqrtTex(1, a * x)), tex(sqrtTex(1, x * (a + x))), tex(String(v))], (i) => tex(sqrtTex(1, v + i + 1))),
            hint: "接線の方べきの定理 $PT^{2}=PA\\cdot PB$。$PB=PA+AB$",
            steps: [`$PT^{2}=${a}\\times(${a}+${x})=${v}$`, `$PT=${sqrtTex(1, v)}$`],
          };
        }),
        t("HA-zukei-2b", (r) => {
          const m = r(1, 5), n = r(1, 5), s = r(1, 5), tt = r(1, 5);
          if (gcd(m, n) !== 1 || gcd(s, tt) !== 1) return { skip: true };
          return {
            q: `${tex("\\triangle ABC")} の内部の点 O に対し、直線 AO, BO, CO が辺 BC, CA, AB と交わる点をそれぞれ P, Q, R とする。${tex(`AR:RB=${m}:${n},\\ BP:PC=${s}:${tt}`)} のとき、${tex("\\frac{CQ}{QA}")} の値は？`,
            ans: fracAns(n * tt, m * s),
            hint: "チェバの定理 $\\frac{AR}{RB}\\cdot\\frac{BP}{PC}\\cdot\\frac{CQ}{QA}=1$",
            steps: [`$\\frac{${m}}{${n}}\\cdot\\frac{${s}}{${tt}}\\cdot\\frac{CQ}{QA}=1$`, `$\\frac{CQ}{QA}=\\frac{${n}\\cdot ${tt}}{${m}\\cdot ${s}}=${fracTex(n * tt, m * s)}$`],
          };
        }),
        t("HA-zukei-2c", (r) => {
          const m = r(1, 5), n = r(1, 5), s = r(1, 5), tt = r(1, 5);
          if (gcd(m, n) !== 1 || gcd(s, tt) !== 1 || n * s === m * tt) return { skip: true };
          return {
            q: `${tex("\\triangle ABC")} の辺 AB を ${tex(`${m}:${n}`)} に内分する点を R、辺 AC を ${tex(`${s}:${tt}`)} に内分する点を Q とし、直線 RQ と直線 BC の交点を P とする。${tex("\\frac{BP}{PC}")} の値は？`,
            ans: fracAns(n * s, m * tt),
            hint: "直線 PQR と $\\triangle ABC$ でメネラウスの定理 $\\frac{AR}{RB}\\cdot\\frac{BP}{PC}\\cdot\\frac{CQ}{QA}=1$",
            steps: [`$AR:RB=${m}:${n}$、$CQ:QA=${tt}:${s}$`, `$\\frac{${m}}{${n}}\\cdot\\frac{BP}{PC}\\cdot\\frac{${tt}}{${s}}=1$`, `$\\frac{BP}{PC}=\\frac{${n}\\cdot ${s}}{${m}\\cdot ${tt}}=${fracTex(n * s, m * tt)}$`],
          };
        }),
      ],
      3: [
        t("HA-zukei-3a", (r) => {
          const m = r(1, 5), n = r(1, 5), s = r(1, 5), tt = r(1, 5);
          if (gcd(m, n) !== 1 || gcd(s, tt) !== 1) return { skip: true };
          return {
            q: `${tex("\\triangle ABC")} で、辺 BC を ${tex(`${m}:${n}`)} に内分する点を D、辺 AC を ${tex(`${s}:${tt}`)} に内分する点を E（${tex(`AE:EC=${s}:${tt}`)}）とし、AD と BE の交点を P とする。${tex("\\frac{AP}{PD}")} の値は？`,
            ans: fracAns((m + n) * s, m * tt),
            hint: "$\\triangle ADC$ と直線 BPE でメネラウスの定理を使う。",
            steps: [
              `$\\triangle ADC$ と直線 BE：$\\frac{AP}{PD}\\cdot\\frac{DB}{BC}\\cdot\\frac{CE}{EA}=1$`,
              `$\\frac{AP}{PD}\\cdot\\frac{${m}}{${m + n}}\\cdot\\frac{${tt}}{${s}}=1$`,
              `$\\frac{AP}{PD}=\\frac{${m + n}\\cdot ${s}}{${m}\\cdot ${tt}}=${fracTex((m + n) * s, m * tt)}$`,
            ],
          };
        }),
        t("HA-zukei-3b", (r) => {
          const a = r(3, 12), b = r(3, 10), c = r(3, 10);
          if (a >= b + c || b >= a + c || c >= a + b) return { skip: true };
          return {
            q: `${tex("\\triangle ABC")} で ${tex(`AB=${c},\\ BC=${a},\\ CA=${b}`)} とする。内心を I、直線 AI と辺 BC の交点を D とするとき、${tex("\\frac{AI}{ID}")} の値は？`,
            ans: fracAns(b + c, a),
            hint: "まず角の二等分線の性質で BD を求める。次に $\\triangle ABD$ で BI が $\\angle B$ の二等分線であることを使う。",
            steps: [
              `$BD=${a}\\times\\frac{${c}}{${c}+${b}}=${fracTex(a * c, b + c)}$`,
              `$\\triangle ABD$ で $AI:ID=BA:BD=${c}:${fracTex(a * c, b + c)}$`,
              `$\\frac{AI}{ID}=\\frac{${b}+${c}}{${a}}=${fracTex(b + c, a)}$`,
            ],
          };
        }),
      ],
      4: [
        t("HA-zukei-4a", (r) => {
          const m = r(1, 5), n = r(1, 5), s = r(1, 5), tt = r(1, 5);
          if (gcd(m, n) !== 1 || gcd(s, tt) !== 1) return { skip: true };
          const den = (m + n) * s + m * tt;
          return {
            q: `${tex("\\triangle ABC")} で、辺 BC を ${tex(`${m}:${n}`)} に内分する点を D、辺 AC を ${tex(`${s}:${tt}`)} に内分する点を E（${tex(`AE:EC=${s}:${tt}`)}）とし、AD と BE の交点を P とする。${tex("\\triangle ABP")} の面積は ${tex("\\triangle ABC")} の面積の何倍？`,
            ans: fracAns(m * s, den),
            hint: "メネラウスの定理で $AP:PD$ を求め、$\\triangle ABP$ を $\\triangle ABD$ の何倍か、$\\triangle ABD$ を $\\triangle ABC$ の何倍かと2段階で考える。",
            steps: [
              `メネラウス（$\\triangle ADC$ と直線 BE）より $AP:PD=${(m + n) * s}:${m * tt}$`,
              `$\\triangle ABD=\\frac{${m}}{${m + n}}\\triangle ABC$、$\\triangle ABP=\\frac{${(m + n) * s}}{${den}}\\triangle ABD$`,
              `$\\frac{${m}}{${m + n}}\\times\\frac{${(m + n) * s}}{${den}}=${fracTex(m * s, den)}$ 倍`,
            ],
          };
        }),
        t("HA-zukei-4b", (r) => {
          const x2 = r(1, 6), x1 = r(x2 + 1, 12), N = x1 * x2;
          const prs = divisors(N).filter((d) => d * d <= N && d !== x2 && d !== x1).map((d) => [d, N / d]);
          if (!prs.length) return { skip: true };
          const prs2 = prs.filter(([d]) => d >= 2);
          const [a, b] = shuffle(r, pick(r, prs2.length ? prs2 : prs));
          return {
            q: `円の2つの弦 AB と CD が点 P で交わっている。${tex(`AP=${a},\\ PB=${b},\\ CD=${x1 + x2}`)}、${tex("CP>PD")} のとき、${tex("CP")} の長さは？`,
            ans: x1,
            hint: "$CP=x$ とおくと $PD=CD-x$。方べきの定理で $x$ の2次方程式を作る。",
            steps: [
              `$CP=x$ とおくと $PD=${x1 + x2}-x$。方べきの定理より $x(${x1 + x2}-x)=${a}\\times ${b}=${N}$`,
              `$x^{2}-${x1 + x2}x+${N}=0$、$(x-${x1})(x-${x2})=0$`,
              `$CP>PD$ より $x=${x1}$`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HA-seisu", area: "num", name: "整数の性質", desc: "約数の個数・互除法・n進法・1次不定方程式",
    prereqs: ["J1-u6"],
    points: [
      "$N=p^{a}q^{b}r^{c}$（素因数分解）のとき、約数の個数は $(a+1)(b+1)(c+1)$、約数の和は $(1+p+\\cdots+p^{a})(1+q+\\cdots+q^{b})(1+r+\\cdots+r^{c})$",
      "ユークリッドの互除法：$a=bq+r$ のとき $\\gcd(a,\\ b)=\\gcd(b,\\ r)$。余りが0になったときの割る数が最大公約数。",
      "$ax+by=c$（$a,\\ b$ は互いに素）は1組の解 $(x_{0},\\ y_{0})$ を見つけ、$x=x_{0}+bk,\\ y=y_{0}-ak$（$k$ は整数）",
      "$n$ 進法：$abc_{(n)}=a\\times n^{2}+b\\times n+c$。10進法から直すときは $n$ で割った余りを下から並べる。",
    ],
    levels: {
      1: [
        t("HA-seisu-1a", (r) => {
          const e = [r(0, 4), r(0, 3), r(0, 2), r(0, 1)];
          const ps = [2, 3, 5, 7];
          const N = ps.reduce((acc, p, i) => acc * p ** e[i], 1);
          if (N < 12 || N > 6000) return { skip: true };
          const used = ps.map((p, i) => [p, e[i]]).filter(([, k]) => k > 0);
          const v = e.reduce((acc, k) => acc * (k + 1), 1);
          return {
            q: `${N} の正の約数は何個？`,
            ans: v,
            unit: "個",
            hint: "素因数分解して、各素因数の指数に1を足して掛ける。",
            steps: [`$${N}=${used.map(([p, k]) => (k === 1 ? `${p}` : `${p}^{${k}}`)).join("\\times ")}$`, `$${used.map(([, k]) => `(${k}+1)`).join("\\times ")}=${v}$`],
          };
        }),
        t("HA-seisu-1b", (r) => {
          const g = r(7, 40), u = r(5, 30), w = r(5, 30);
          if (gcd(u, w) !== 1 || u === w || g * Math.max(u, w) > 999) return { skip: true };
          let A = g * Math.max(u, w), B = g * Math.min(u, w);
          const st = [];
          while (B) { const q = Math.floor(A / B), rr = A % B; st.push(`$${A}=${B}\\times ${q}${rr ? `+${rr}` : ""}$`); [A, B] = [B, rr]; }
          return {
            q: `${g * Math.max(u, w)} と ${g * Math.min(u, w)} の最大公約数は？`,
            ans: g,
            hint: "ユークリッドの互除法：大きい方を小さい方で割り、余りで割ることをくり返す。",
            steps: [...(st.length <= 3 ? st : [st[0], st[1], st.slice(2).join("、")]), `最大公約数は ${g}`],
          };
        }),
        t("HA-seisu-1c", (r) => {
          const n = pick(r, [2, 2, 3, 4, 5]);
          const len = n === 2 ? r(5, 7) : r(3, 4);
          const dg = [r(1, n - 1), ...Array.from({ length: len - 1 }, () => r(0, n - 1))];
          const v = dg.reduce((acc, d) => acc * n + d, 0);
          const terms = dg.map((d, i) => `${d}\\times ${n}^{${len - 1 - i}}`).join("+");
          return {
            q: `${n} 進法で表された数 ${tex(`${dg.join("")}_{(${n})}`)} を10進法で表すと？`,
            ans: v,
            hint: "右から順に $n^{0},\\ n^{1},\\ n^{2},\\ \\ldots$ の位。各位の数字 × 位の大きさ を足す。",
            steps: [`$${terms}$`, `$=${v}$`],
          };
        }),
      ],
      2: [
        t("HA-seisu-2a", (r) => {
          const n = pick(r, [2, 3, 4, 5, 6, 7, 8]), N = r(n * n, n === 2 ? 120 : 400);
          const ds = [];
          let x = N;
          const st = [];
          while (x) { st.push(`$${x}\\div ${n}=${Math.floor(x / n)}$ 余り ${x % n}`); ds.push(x % n); x = Math.floor(x / n); }
          const s = ds.reverse().join("");
          return {
            q: `10進法の ${N} を ${n} 進法で表すと？（数字を並べて答える）`,
            ans: Number(s),
            hint: `${n} で割り続け、余りを下から（最後の余りから）並べる。`,
            steps: [st.slice(0, 3).join("、") + (st.length > 3 ? " …" : ""), `余りを下から並べて $${s}_{(${n})}$`],
          };
        }),
        t("HA-seisu-2b", (r) => {
          const e = [r(1, 4), r(0, 2), r(0, 1)];
          const ps = [2, 3, 5];
          const N = ps.reduce((acc, p, i) => acc * p ** e[i], 1);
          if (N === 2) return { skip: true }; // 自明な問題
          const used = ps.map((p, i) => [p, e[i]]).filter(([, k]) => k > 0);
          const sums = used.map(([p, k]) => (p ** (k + 1) - 1) / (p - 1));
          const v = sums.reduce((a, b) => a * b, 1);
          return {
            q: `${N} の正の約数の総和は？`,
            ans: v,
            hint: "素因数分解 $p^{a}q^{b}$ のとき、約数の和は $(1+p+\\cdots+p^{a})(1+q+\\cdots+q^{b})$",
            steps: [
              `$${N}=${used.map(([p, k]) => (k === 1 ? `${p}` : `${p}^{${k}}`)).join("\\times ")}$`,
              `$${used.map(([p, k]) => `(${Array.from({ length: k + 1 }, (_, i) => (i === 0 ? "1" : i === 1 ? `${p}` : `${p}^{${i}}`)).join("+")})`).join("")}=${sums.length > 1 ? `${sums.join("\\times ")}=` : ""}${v}$`,
            ],
          };
        }),
        t("HA-seisu-2c", (r) => {
          const a = r(3, 25), b = r(3, 25);
          if (gcd(a, b) !== 1 || a === b) return { skip: true };
          let x = 1;
          while ((1 - a * x) % b !== 0) x++;
          const y = (1 - a * x) / b;
          return {
            q: `方程式 ${tex(`${a}x+${b}y=1`)} を満たす整数 ${tex("x,\\ y")} のうち、${tex("x")} が最小の正の整数であるものの ${tex("x")} の値は？`,
            ans: x,
            hint: "互除法を逆にたどって1組の解を見つけるか、$x=1,\\ 2,\\ \\ldots$ と代入して $1-ax$ が $b$ で割り切れるものを探す。",
            steps: [`$x=${x}$ のとき $${a}\\times ${x}+${b}\\times(${y})=1$`, `一般解は $x=${x}+${b}k$、$y=${y}-${a}k$ なので、正で最小の $x$ は ${x}`],
          };
        }),
      ],
      3: [
        t("HA-seisu-3a", (r) => {
          const a = r(2, 9), b = r(2, 9), c = r(30, 120);
          if (gcd(a, b) !== 1 || a === b) return { skip: true };
          const sols = [];
          for (let x = 1; a * x < c; x++) if ((c - a * x) % b === 0) sols.push([x, (c - a * x) / b]);
          if (sols.length === 0) return { skip: true };
          return {
            q: `方程式 ${tex(`${a}x+${b}y=${c}`)} を満たす自然数の組 ${tex("(x,\\ y)")} は何組？`,
            ans: sols.length,
            unit: "組",
            hint: "1組の解を見つけて一般解を作り、$x>0,\\ y>0$ となる $k$ の範囲を調べる。",
            steps: [
              `1組の解 $(x,\\ y)=(${sols[0][0]},\\ ${sols[0][1]})$ から、一般解は $x=${sols[0][0]}+${b}k,\\ y=${sols[0][1]}-${a}k$`,
              `$x>0,\\ y>0$ となる $k$ は ${sols.length === 1 ? "$k=0$ のみ" : sols.length <= 3 ? `$k=${sols.map((_, i) => i).join(",\\ ")}$` : `$k=0,\\ 1,\\ \\ldots,\\ ${sols.length - 1}$`}`,
              `${sols.length} 組`,
            ],
          };
        }),
        t("HA-seisu-3b", (r) => {
          const [a, b] = sample(r, [3, 4, 5, 7, 8, 9, 11], 2);
          if (gcd(a, b) !== 1) return { skip: true };
          const r1 = r(1, a - 1), r2 = r(1, b - 1), big = r(0, 1) === 1;
          const n0 = Array.from({ length: b }, (_, i) => r1 + a * i).find((x) => x % b === r2);
          if (!big && (n0 === r1 || n0 === r2)) return { skip: true }; // 答えが与えた余りそのものになる自明な組
          const list = Array.from({ length: (n0 - r1) / a + 1 }, (_, i) => r1 + a * i);
          let n = 0;
          if (big) { for (let x = 999; x >= 100; x--) if (x % a === r1 && x % b === r2) { n = x; break; } }
          else { for (let x = 1; ; x++) if (x % a === r1 && x % b === r2) { n = x; break; } }
          return {
            q: `${a} で割ると ${r1} 余り、${b} で割ると ${r2} 余る${big ? "3桁の自然数のうち、最大のもの" : "自然数のうち、最小のもの"}は？`,
            ans: n,
            hint: `「${a} で割ると ${r1} 余る数」を $${a}k+${r1}$ と書き、${b} で割った余りを調べる。`,
            steps: [
              `${a} で割ると ${r1} 余る数 ${list.join(", ")} のうち、${b} で割ると ${r2} 余る最初の数は ${n0}`,
              `条件を満たす数は ${a * b} ごとに現れるので $${n0}+${a * b}k$（$k$ は 0 以上の整数）`,
              big ? `3桁で最大は $k=${(n - n0) / (a * b)}$ のときの ${n}` : `最小のものは ${n0}`,
            ],
          };
        }),
        t("HA-seisu-3c", (r) => {
          const N = r(10, 130);
          const parts = [];
          let v = 0;
          for (let p = 5; p <= N; p *= 5) { parts.push(Math.floor(N / p)); v += Math.floor(N / p); }
          return {
            q: `${tex(`${N}!`)} を計算すると、末尾に 0 は連続して何個並ぶ？`,
            ans: v,
            unit: "個",
            hint: "末尾の0の個数は、素因数 5 の個数で決まる（2 の方が多い）。",
            steps: [
              `5 の倍数の個数、25 の倍数の個数、… を足す：$${parts.join("+")}$`,
              `$=${v}$ 個`,
            ],
          };
        }),
      ],
      4: [
        t("HA-seisu-4a", (r) => {
          const a = r(1, 5), b = r(1, 5), c = r(-6, 20), M = c + a * b;
          if (M <= 0) return { skip: true };
          const sols = [];
          for (const d of divisors(M).flatMap((x) => [x, -x])) {
            const x = b + d, y = a + M / d;
            if (x >= 1 && y >= 1) sols.push([x, y]);
          }
          if (!sols.length) return { skip: true };
          sols.sort((p, q) => p[0] - q[0]);
          return {
            q: `${tex(`xy-${a === 1 ? "" : a}x-${b === 1 ? "" : b}y=${c}`)} を満たす自然数の組 ${tex("(x,\\ y)")} は何組？`,
            ans: sols.length,
            unit: "組",
            hint: "$(x-\\square)(y-\\triangle)=$ 整数 の形に変形して、約数の組を考える（負の約数にも注意）。",
            steps: [
              `$(x-${b})(y-${a})=${c}+${a * b}=${M}$`,
              `$x-${b}\\geqq ${1 - b},\\ y-${a}\\geqq ${1 - a}$ に注意して約数の組を調べる`,
              `$(x,\\ y)=${sols.map(([x, y]) => `(${x},\\ ${y})`).join(",\\ ")}$ の ${sols.length} 組`,
            ],
          };
        }),
        t("HA-seisu-4b", (r) => {
          const n = r(2, 15);
          const v = divisors(n * n).length;
          return {
            q: `${tex(`\\frac{1}{x}+\\frac{1}{y}=\\frac{1}{${n}}`)} を満たす自然数の組 ${tex("(x,\\ y)")} は何組？`,
            ans: v,
            unit: "組",
            hint: "分母を払って $(x-n)(y-n)=n^{2}$ の形にする。$x,\\ y$ が正なら $x>n,\\ y>n$。",
            steps: [
              `$${n}y+${n}x=xy$ より $(x-${n})(y-${n})=${n * n}$`,
              `$x,\\ y>${n}$ なので $x-${n}$ は ${n * n} の正の約数`,
              `${n * n} の正の約数は ${v} 個なので ${v} 組`,
            ],
          };
        }),
        t("HA-seisu-4c", (r) => {
          const [m, n, a, b, c, N] = pick(r, BASE_REV);
          return {
            q: `ある自然数 ${tex("N")} を ${m} 進法で表すと3桁の数 ${tex(`abc_{(${m})}`)} になり、${n} 進法で表すと数字の並びが逆の3桁の数 ${tex(`cba_{(${n})}`)} になる。${tex("N")} を10進法で表すと？`,
            ans: N,
            hint: "両方を10進法の式にして等しいとおき、各数字が $0$ 以上 $\\min(m,\\ n)-1$ 以下の整数であることを使う。",
            steps: [
              `$${m * m}a+${m}b+c=${n * n}c+${n}b+a$`,
              `整理して、数字の範囲から調べると $a=${a},\\ b=${b},\\ c=${c}$`,
              `$N=${a}\\times ${m * m}+${b}\\times ${m}+${c}=${N}$`,
            ],
          };
        }),
      ],
    },
  },
];
