// make-vectors.mjs — SQL の _hw_progress を、基準の実装（../progress.mjs）と照らし合わせるための材料を作る。
//   node make-vectors.mjs <出力フォルダ> [ランダムの件数=2000] [種=20261118]
//   出力：vectors.jsonl（../vectors.json の全件を 1行 1件に）、random-vectors.jsonl（ランダムな件。expect は progress.mjs が出した値）
// 1行 1件：{name, hw, state, nowMs, expect}（vectors.json と同じ形）。psql の \copy で、csv 形式（区切り・引用を使わない）で読む。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { progress, windowMs, ymdJST } from "../progress.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || here;
const N = Number(process.argv[3] || 2000);
let seed = Number(process.argv[4] || 20261118) >>> 0;
mkdirSync(out, { recursive: true });

// 検算データ（契約 7）。そのまま 1行ずつ
const vec = JSON.parse(readFileSync(join(here, "..", "vectors.json"), "utf8"));
writeFileSync(join(out, "vectors.jsonl"), vec.map((v) => JSON.stringify(v)).join("\n") + "\n");

// ランダム（種を固定。毎回同じ）
const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const DAY = 86400000;
const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);
const base = Date.UTC(2026, 9, 20);                       // 2026-10-20

const UNITS = ["J1-u1", "J1-u2", "J1-d1", "E1-100"];
const cases = [];
for (let i = 0; i < N; i++) {
  const startMs = base + ri(0, 40) * DAY;
  const len = pick([1, 1, 2, 3, 5, 7, 14, 30, 59, 60, ri(1, 60)]);
  const hw = { unit_id: null, n: null, min: null, start_date: ymd(startMs), due_date: ymd(startMs + (len - 1) * DAY) };
  const kind = pick(["n", "n", "m", "nm", "nm", "m"]);
  if (kind !== "m") { hw.unit_id = pick(UNITS); hw.n = pick([1, 2, 3, 5, 10, 20, 50, 200, ri(1, 200)]); }
  if (kind !== "n") hw.min = pick([1, 5, 10, 20, 60, 240, ri(1, 240)]);
  if (i % 97 === 0) { hw.unit_id = null; hw.n = 3; }          // 単元なしの n（データベースの制約では作れないが、関数としては基準と同じ結果になる）
  if (i % 101 === 0) { hw.n = null; hw.min = null; }           // どちらもなし（pct 0・未達成）
  const [s, e] = windowMs(hw.start_date, hw.due_date);

  // log
  const log = [];
  const nlog = pick([0, 0, 1, 3, 10, 40, ri(0, 80), 400]);
  const tpick = () => pick([
    () => ri(s, e), () => ri(s, e), () => ri(s, e), () => s, () => e, () => s - 1, () => e + 1,
    () => ri(s - 3 * DAY, e + 3 * DAY), () => s + ri(0, 3) * DAY + ri(0, 3) * 1000,
    () => ri(s, e) + 0.5,
  ])();
  for (let k = 0; k < nlog; k++) {
    const x = { t: tpick(), u: rnd() < 0.8 ? hw.unit_id || pick(UNITS) : pick(UNITS), L: ri(1, 3), ok: pick([true, true, false, false, true]), h: false, d: ri(3, 40) };
    const r = rnd();
    if (r < 0.01) delete x.ok; else if (r < 0.02) x.ok = 1; else if (r < 0.03) x.ok = 0; else if (r < 0.04) x.ok = ""; else if (r < 0.05) x.ok = "x"; else if (r < 0.06) x.ok = null;
    if (rnd() < 0.01) log.push(null); else if (rnd() < 0.005) log.push(7); else if (rnd() < 0.005) log.push("str");
    if (rnd() < 0.01) delete x.t; else if (rnd() < 0.01) x.t = String(x.t);   // t が無い／文字列：数ではないので数えない（基準も、文字列の t は比べない…文字列は JS が数に直して比べるので、この 1% は除く）
    log.push(x);
  }
  // t が文字列のものは、JS が数に直して比べる（基準の実装の癖）。SQL は数だけを数える仕様なので、この比較からは外す
  const log2 = log.filter((x) => !(x && typeof x === "object" && typeof x.t === "string"));
  if (rnd() < 0.5) log2.sort((a, b) => ((b && b.t) || 0) - ((a && a.t) || 0));
  else if (rnd() < 0.5) log2.sort((a, b) => ((a && a.t) || 0) - ((b && b.t) || 0));

  // daily
  const daily = {};
  const days = [];
  for (let t = s - 2 * DAY; t <= e + 2 * DAY; t += DAY) days.push(ymd(t + 9 * 3600e3));
  const fill = pick([0.0, 0.3, 0.6, 1.0]);
  const mt = hw.min ? hw.min * 60 : 600;
  for (const d of days) {
    if (rnd() > fill) continue;
    const secv = pick([() => ri(0, 2 * mt), () => Math.floor(mt / Math.max(1, len)) + ri(-5, 5), () => ri(0, 600), () => ri(0, 90) + 0.5, () => 0, () => mt]);
    const r = rnd();
    let v;
    if (r < 0.80) v = { n: ri(0, 30), c: ri(0, 30), xp: 0, sec: secv() };
    else if (r < 0.84) v = { sec: String(secv()) };
    else if (r < 0.86) v = { sec: " " + secv() + " " };
    else if (r < 0.88) v = { sec: -ri(1, 50) };
    else if (r < 0.90) v = { sec: null };
    else if (r < 0.92) v = { sec: "abc" };
    else if (r < 0.93) v = { sec: "" };
    else if (r < 0.94) v = {};
    else if (r < 0.95) v = 5;
    else if (r < 0.96) v = "abc";
    else if (r < 0.97) v = null;
    else v = { n: 1, sec: secv() };
    daily[d] = v;
  }
  let state = { log: log2, daily, v: 1 };
  const sr = rnd();
  if (sr < 0.02) state = null;
  else if (sr < 0.04) state = {};
  else if (sr < 0.05) state = { log: "oops", daily: [] };
  else if (sr < 0.06) state = { log: { a: 1 }, daily: "x" };
  else if (sr < 0.07) state = { log: log2 };
  else if (sr < 0.08) state = { daily };

  const nowMs = pick([() => ri(s - 5 * DAY, e + 5 * DAY), () => s - 1, () => s, () => e, () => e + 1, () => ri(s, e), () => s - DAY, () => e + DAY])();
  const hwForJs = { ...hw };
  const expect = progress(hwForJs, state, nowMs);
  cases.push({ name: `r${i}`, hw, state, nowMs, expect });
}
writeFileSync(join(out, "random-vectors.jsonl"), cases.map((v) => JSON.stringify(v)).join("\n") + "\n");
const stat = { n: cases.length, done: cases.filter((c) => c.expect.done).length, partial: cases.filter((c) => c.expect.status === "partial").length, none: cases.filter((c) => c.expect.status === "none").length,
  upcoming: cases.filter((c) => c.expect.phase === "upcoming").length, ended: cases.filter((c) => c.expect.phase === "ended").length, withDoneAt: cases.filter((c) => c.expect.doneAt).length };
console.log(JSON.stringify(stat));
