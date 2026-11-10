// distractors.mjs — 数値入力の問題を 4択にするための「ありがちな誤答」をつくる。
//
//   ① 系統ごとの誤答（柱・錐・球の体積・表面積）：問題文から数字を読み取り、正しい式で計算し直して、
//      答えと一致したときだけ使う（一致しなければ使わない）。誤答は、よくある間違いの式で計算し、理由をつける。
//   ② 途中の計算結果：解き方（steps）の途中の値を、「最後まで計算せずに答えにした」誤答として使う。
//   ③ それでも足りないときは、答えに近い値で埋める。このときは、理由（w）をつけない（理由をでっち上げない）。
//
// 返す値：[{ v: 値(有理数), w: 理由 or null, kind: "family" | "step" | "near" }]（正解は入れない）

// ── 有理数 ────────────────────────────────────────────
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export const rat = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
const R = (x) => (typeof x === "number" ? rat(x, 1) : x);
const add = (a, b) => { a = R(a); b = R(b); return rat(a.n * b.d + b.n * a.d, a.d * b.d); };
const mul = (a, b) => { a = R(a); b = R(b); return rat(a.n * b.n, a.d * b.d); };
const div = (a, b) => { a = R(a); b = R(b); return rat(a.n * b.d, a.d * b.n); };
const eq = (a, b) => { a = R(a); b = R(b); return a.n === b.n && a.d === b.d; };
export const fmtRat = (r) => (r.d === 1 ? String(r.n) : `${r.n}/${r.d}`);
export const parseAns = (ans) => {
  if (typeof ans === "number") return Number.isInteger(ans) ? rat(ans) : null;       // 小数は扱わない
  const m = String(ans).trim().match(/^(-?\d+)\/(\d+)$/);
  return m ? rat(+m[1], +m[2]) : /^-?\d+$/.test(String(ans).trim()) ? rat(+ans) : null;
};
const third = (x) => div(x, 3);

// ── 問題文から数字を読む ───────────────────────────────
const num = (q, re) => { const m = q.match(re); return m ? Number(m[1]) : null; };
const radius = (q) => {
  const r = num(q, /半径(?:が)? ?(\d+)cm/); if (r != null) return { r, diam: false };
  const d = num(q, /直径(?:が)? ?(\d+)cm/); if (d != null && d % 2 === 0) return { r: d / 2, d, diam: true };
  return null;
};
const height = (q) => num(q, /高さ(?:が)? ?(\d+)cm/);
const slant = (q) => num(q, /母線の長さ(?:が)? ?(\d+)cm/);

// ── 系統（問題文の型ごとの、正しい式と、ありがちな誤答の式） ──────────
// 係数問題（「□π cm²」「□π cm³」の □ が答え）は、π の係数を返す。
const FAMILIES = [
  { name: "円柱の表面積（係数）",
    test: (q) => /円柱の表面積は □π/.test(q) && !/おうぎ|穴|のせ|半球|側面積が|立面図/.test(q),
    run: (q) => { const rr = radius(q), h = height(q); if (!rr || h == null) return null; const r = rr.r;
      return { correct: 2 * r * h + 2 * r * r, slips: [
        [2 * r * h, "底面の円（上と下の2つ）を足し忘れ、側面積だけを答えにした"],
        [2 * r * h + r * r, "底面の円は上下で2つあるのに、1つ分しか足さなかった"],
        ...(rr.diam ? [[2 * rr.d * h + 2 * rr.d * rr.d, "直径の値をそのまま半径として使って計算した"]] : []),
        [r * r * h, "表面積ではなく、体積（底面積×高さ）を計算した"]] }; } },
  { name: "円錐の表面積（係数）",
    test: (q) => /円錐の表面積は □π/.test(q) && !/おうぎ|のせ|中心角|側面が|側面の展開図/.test(q),
    run: (q) => { const rr = radius(q), l = slant(q), h = height(q); if (!rr || l == null) return null; const r = rr.r;
      return { correct: r * l + r * r, slips: [
        [r * l, "底面の円を足し忘れ、側面積だけを答えにした"],
        ...(h != null ? [[r * h + r * r, "側面積の式の「母線」のかわりに、高さを使ってしまった"]] : []),
        [r * l + 2 * r * r, "円錐の底面は1つなのに、2つ分を足してしまった"]] }; } },
  { name: "円錐の体積（係数）",
    test: (q) => /円錐の体積は □π/.test(q) && !/容器|のせ|切り|水/.test(q),
    run: (q) => { const rr = radius(q), h = height(q), l = slant(q); if (!rr || h == null) return null; const r = rr.r;
      return { correct: third(r * r * h), slips: [
        [r * r * h, "体積の公式の「1/3」をかけ忘れた（円柱の体積のまま）"],
        ...(l != null ? [[third(r * r * l), "高さのかわりに、母線の長さを使ってしまった"]] : []),
        ...(rr.diam ? [[third(rr.d * rr.d * h), "直径の値をそのまま半径として使って計算した"]] : [])] }; } },
  { name: "円柱の体積（係数）",
    test: (q) => /円柱の体積は □π/.test(q) && !/容器|のせ|切り|水|缶|入る/.test(q),
    run: (q) => { const rr = radius(q), h = height(q); if (!rr || h == null) return null; const r = rr.r;
      return { correct: r * r * h, slips: [
        [third(r * r * h), "円錐の体積の公式の「1/3」をかけてしまった"],
        [r * h, "底面積を求めるとき、半径を2乗し忘れた"],
        ...(rr.diam ? [[rr.d * rr.d * h, "直径の値をそのまま半径として使って計算した"]] : [])] }; } },
  { name: "球の表面積（係数）",
    test: (q) => /(?<!半)球の表面積は □π/.test(q),
    run: (q) => { const rr = radius(q); if (!rr) return null; const r = rr.r;
      return { correct: 4 * r * r, slips: [
        [mul(rat(4, 3), r * r * r), "球の体積の公式（4/3×r³）と混同した"],
        [r * r, "円の面積 π×r² のまま、4倍するのを忘れた"],
        ...(rr.diam ? [[4 * rr.d * rr.d, "直径の値をそのまま半径として使って計算した"]] : []),
        [2 * r * r, "表面積を「4」ではなく「2」×πr² で計算した"]] }; } },
  { name: "球の体積（係数）",
    test: (q) => /(?<!半)球の体積は □π/.test(q),
    run: (q) => { const rr = radius(q); if (!rr) return null; const r = rr.r;
      return { correct: mul(rat(4, 3), r * r * r), slips: [
        [4 * r * r, "球の表面積の公式（4×r²）と混同した"],
        [4 * r * r * r, "体積の公式の「1/3」をかけ忘れた（4πr³ のまま）"],
        [r * r * r, "公式の「4/3」をかけ忘れた"],
        ...(rr.diam ? [[mul(rat(4, 3), rr.d * rr.d * rr.d), "直径の値をそのまま半径として使って計算した"]] : [])] }; } },
  { name: "半球の表面積（係数）",
    test: (q) => /半球の表面積.*□π/.test(q),
    run: (q) => { const rr = radius(q); if (!rr) return null; const r = rr.r;
      return { correct: 3 * r * r, slips: [
        [2 * r * r, "曲面だけで、平らな底面の円を足し忘れた"],
        [4 * r * r, "球全体の表面積で答えてしまった"],
        [r * r, "底面の円だけを答えにしてしまった"]] }; } },
  { name: "半球の体積（係数）",
    test: (q) => /半球の体積は □π/.test(q),
    run: (q) => { const rr = radius(q); if (!rr) return null; const r = rr.r;
      return { correct: mul(rat(2, 3), r * r * r), slips: [
        [mul(rat(4, 3), r * r * r), "球の体積のまま、半分にするのを忘れた"],
        [mul(rat(1, 3), r * r * r), "球の体積の公式の「2」をかけ忘れた"],
        [4 * r * r, "体積の公式と表面積の公式を混同した"]] }; } },
  { name: "四角柱（長方形の底面）の表面積",
    test: (q) => /底面が縦 \d+cm、横 \d+cm の長方形で、高さが \d+cm の四角柱の表面積/.test(q),
    run: (q) => { const m = q.match(/縦 (\d+)cm、横 (\d+)cm.*高さが (\d+)cm/); if (!m) return null; const [a, b, h] = [+m[1], +m[2], +m[3]];
      return { correct: 2 * a * b + 2 * (a + b) * h, slips: [
        [2 * (a + b) * h, "底面（上と下の2つ）を足し忘れ、側面積だけを答えにした"],
        [2 * (a + b) * h + a * b, "底面は上下で2つあるのに、1つ分しか足さなかった"],
        [(a + b) * h + 2 * a * b, "側面積を、底面のまわりの長さ 2×(縦+横) ではなく、縦+横 で求めた"],
        [a * b * h, "表面積ではなく、体積を計算した"]] }; } },
  { name: "三角柱（直角三角形の底面）の表面積",
    test: (q) => /底面が 3辺 \d+cm、\d+cm、\d+cm の直角三角形で、高さが \d+cm の三角柱の表面積/.test(q),
    run: (q) => { const m = q.match(/3辺 (\d+)cm、(\d+)cm、(\d+)cm.*高さが (\d+)cm/); if (!m) return null; const s = [+m[1], +m[2], +m[3]].sort((x, y) => x - y); const h = +m[4];
      const lat = (s[0] + s[1] + s[2]) * h, leg = s[0] * s[1];
      return { correct: lat + leg, slips: [
        [lat, "底面（上と下の2つの三角形）を足し忘れ、側面積だけを答えにした"],
        [lat + div(leg, 2), "底面の三角形は上下で2つあるのに、1つ分しか足さなかった"],
        [lat + 2 * leg, "三角形の面積を求めるとき、「÷2」を忘れた"]] }; } },
  { name: "正四角錐の表面積",
    test: (q) => /底面が 1辺 \d+cm の正方形で、側面の三角形の高さが \d+cm の正四角錐の表面積/.test(q),
    run: (q) => { const m = q.match(/1辺 (\d+)cm.*側面の三角形の高さが (\d+)cm/); if (!m) return null; const [a, s] = [+m[1], +m[2]];
      return { correct: a * a + 2 * a * s, slips: [
        [2 * a * s, "底面の正方形を足し忘れ、側面積だけを答えにした"],
        [a * a + 4 * a * s, "側面の三角形の面積で、「÷2」を忘れた"],
        [a * a + a * s, "側面の三角形を4枚ではなく2枚で計算した"]] }; } },
  { name: "正四角錐の体積",
    test: (q) => /底面が 1辺 \d+cm の正方形で、高さが \d+cm の正四角錐の体積は？/.test(q),
    run: (q) => { const m = q.match(/1辺 (\d+)cm.*高さが (\d+)cm/); if (!m) return null; const [a, h] = [+m[1], +m[2]];
      return { correct: third(a * a * h), slips: [
        [a * a * h, "角錐の体積の公式の「1/3」をかけ忘れた（角柱の体積のまま）"],
        [div(a * a * h, 2), "「1/3」のかわりに「1/2」をかけてしまった"],
        [third(a * h), "底面積を求めるとき、1辺を2乗し忘れた"]] }; } },
  { name: "底面積と高さから体積（柱・錐）",
    test: (q) => /底面積が \d+cm²、高さが \d+cm の(?:角柱|[三四五六七八九]角柱|[三四五六七八九]角錐)の体積は？/.test(q),
    run: (q) => { const m = q.match(/底面積が (\d+)cm²、高さが (\d+)cm の(\S+)の体積/); if (!m) return null; const [S, h, kind] = [+m[1], +m[2], m[3]]; const cone = /錐/.test(kind);
      return cone
        ? { correct: third(S * h), slips: [[S * h, "角錐の体積の公式の「1/3」をかけ忘れた（角柱の体積のまま）"], [div(S * h, 2), "「1/3」のかわりに「1/2」をかけてしまった"]] }
        : { correct: S * h, slips: [[third(S * h), "角柱の体積に、角錐の公式の「1/3」をかけてしまった"], [S + h, "かけ算ではなく、底面積と高さを足してしまった"]] }; } },
  { name: "直方体の体積",
    test: (q) => /^縦 \d+cm、横 \d+cm、高さ \d+cm の直方体の体積は？$/.test(q),
    run: (q) => { const m = q.match(/縦 (\d+)cm、横 (\d+)cm、高さ (\d+)cm/); if (!m) return null; const [a, b, c] = [+m[1], +m[2], +m[3]];
      return { correct: a * b * c, slips: [
        [2 * (a * b + b * c + c * a), "体積ではなく、表面積を計算した"],
        [a * b + b * c + c * a, "3つの面の面積を足しただけで、体積を求めていない"]] }; } },
];

// ── ② 途中の計算結果 ────────────────────────────────────
// steps（平文）の各行の「＝ 数」を取り出す（最後の行は除く）。π が付いている値は、係数だけを見る。
function stepValues(steps) {
  // 「= 36π（cm³）」「= 16π」のように、式が最後の値で終わっているものだけを拾う。
  // 「= 8/15π ℓ」（文字がつづく）や「V = 1/3 × π …」（式がつづく）は、途中の式の一部なので拾わない。
  const out = [];
  (steps || []).slice(0, -1).forEach((line) => {
    const ms = [...String(line).matchAll(/[=＝]\s*(-?\d+(?:\/\d+)?)\s*π?(?=\s*(?:[（(。、,）)]|cm|m\b|$))/g)];
    if (ms.length) { const v = parseAns(ms[ms.length - 1][1]); if (v) out.push(v); }
  });
  return out;
}

/** 分数の答えの近くにある「ありそうな分数」を選ぶ。
 *  ・正解と同じ分母のもの（例 32/3 なら 31/3, 35/3 …）を最優先
 *  ・正解が割り切れる小数（1/2 → 0.5 と表示される）なら、誤答も割り切れる分数（分母 2・4・5・8・10）だけにして、表示の形をそろえる
 *  ・「何分のいくつ」(1 より小さい) の答えには、1 以上を混ぜない */
const terminating = (d) => { let x = d; while (x % 2 === 0) x /= 2; while (x % 5 === 0) x /= 5; return x === 1; };
function fracNear(A, rnd, i) {
  const target = A.n / A.d, tA = terminating(A.d), pool = [];
  for (let d = 2; d <= 12; d++) {
    if (tA && !terminating(d)) continue;
    for (let n = 1; n <= d * 3; n++) {
      const v = n / d; if (Math.abs(v - target) < 1e-9) continue;
      if (target < 1 && v >= 1) continue;
      pool.push({ n, d, dist: Math.abs(v - target) + (d === A.d ? 0 : 0.6 + d * 0.01) });
    }
  }
  pool.sort((x, y) => x.dist - y.dist);
  const top = pool.slice(0, 6);
  const pick = top[(i + Math.floor(rnd() * top.length)) % top.length];
  return rat(pick.n, pick.d);
}

/** 誤答の候補を、正解・問題文・steps から作る。count 個ぶん返す（足りなければ、近い値で埋める） */
export function makeDistractors({ q, ans, steps }, count = 3, rnd = Math.random) {
  const A = parseAns(ans);
  if (!A) return null;                                   // 小数などは、ここでは扱わない（呼び出し側で別の扱い）
  const cands = [];
  const used = new Set([fmtRat(A)]);
  const push = (v, w, kind) => {
    const r = R(v);
    if (r.n <= 0 || !Number.isFinite(r.n / r.d)) return;
    const k = fmtRat(r);
    if (used.has(k)) return;
    used.add(k); cands.push({ v: r, w, kind });
  };
  // ① 系統
  for (const f of FAMILIES) {
    if (!f.test(q)) continue;
    let res = null; try { res = f.run(q); } catch (e) { res = null; }
    if (!res || !eq(res.correct, A)) continue;           // 正しい式で計算し直して、答えと合わなければ使わない
    res.slips.forEach(([v, w]) => push(v, w, "family"));
    break;
  }
  // ② 途中の値
  const aNum = A.n / A.d;
  stepValues(steps).filter((v) => { const x = Number(v.n) / Number(v.d); return x >= aNum / 4 && x <= aNum * 6; })
    .forEach((v) => push(v, `途中の計算結果「${fmtRat(R(v))}」を、最後まで計算せずに、そのまま答えにしてしまった。`, "step"));
  // 選ぶ：系統の誤答を優先（先頭から）、足りなければ途中の値
  let picked = cands.slice(0, count);
  // ③ 近い値で埋める（理由なし）
  const mag = Math.max(1, Math.round(A.n / A.d));
  // 理由のない誤答は、正解に「ほどよく近い」数にする。数が小さい（個数や本数）なら ±1〜3、大きければ 1 割・2 割・5 割ずらす
  const pct = (x) => Math.max(1, Math.round(mag * x));
  const deltas = A.d === 1
    ? (mag <= 12 ? [1, -1, 2, -2, 3, -3, 4] : [1, -1, 2, -2, pct(0.1), -pct(0.1), pct(0.2), -pct(0.2), pct(0.5), -pct(0.5)])
    : [];
  for (let i = 0; picked.length < count && i < 80; i++) {
    let v;
    if (A.d === 1) v = rat(A.n + deltas[(i + Math.floor(rnd() * deltas.length)) % deltas.length]);
    else v = fracNear(A, rnd, i);                                              // 分数は、近い「よくある分数」から
    const r = R(v); const k = fmtRat(r);
    if (r.n <= 0 || used.has(k)) continue;
    used.add(k); picked.push({ v: r, w: null, kind: "near" });
  }
  return picked.length >= count ? picked : null;
}
