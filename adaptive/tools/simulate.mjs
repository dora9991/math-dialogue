// ============================================================
// simulate.mjs — 合成生徒で「診断ロジックが本当につまずきを当てられるか」を測る
//
//   node adaptive/tools/simulate.mjs [--n 60] [--q 30] [--seed 1] [--quick] [--noise 0.4]
//
//  ・「本当の力」を持つ仮想の生徒を作る（習っていない穴があり、穴の下流は崩れやすい）。
//  ・モデルは本当の力を知らない。出題ロジックで問題を選び、確率で正誤を返して診断させる。
//  ・診断後に、単元ごとの習熟/未習熟の当たり具合と「つまずきの源流」の当たり具合を測る。
//  ※ 生徒の作り方はモデルの仮定とは別に書いている（モデルに都合のよい世界にしない）。
//     ただし合成データなので、実際の生徒での精度を保証するものではない。
// ============================================================
import { SKILLS, ALL_IDS, ORDER } from "../js/data/graph.js";
import { Learner } from "../js/core/model.js";
import { chooseDiagnostic, kindOf as realKindOf } from "../js/core/diagnose.js";
import { rootCauses } from "../js/core/report.js";
import { LEVEL_B } from "../js/core/items.js";
import { makeRng, hashSeed } from "../js/core/rng.js";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const NSTUDENTS = opt("n", 60);
const NQ = opt("q", 30);
const SEED = opt("seed", 1);
const NOISE = opt("noise", 0.4);
const CASCADE = opt("cascade", 0.5);
const sigma = (x) => 1 / (1 + Math.exp(-x));

// 問題テンプレがまだ無い単元でも動くよう、形式を単元IDから決めて代用する
const kindOf = (id) =>
  SKILLS[id].tpl?.length
    ? realKindOf(id)
    : (SKILLS[id].strand === "alg" || SKILLS[id].strand === "calc" || SKILLS[id].strand === "func") && SKILLS[id].stage >= 8
      ? "choice"
      : hashSeed(id) % 3 === 0
        ? "choice"
        : "num";

function normal(r) {
  const u = Math.max(1e-9, r.next());
  const v = r.next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * 本当の力を持つ仮想生徒。
 *  ・領域ごとに「到達点（フロンティア）」がある：それより下の単元はだいたい習得、上は未習得。
 *  ・領域によって進み具合がちがう。ときどき、ある領域だけ大きく遅れている（例：分数がずっと弱い）。
 *  ・前提の単元が未習得だと、その先の単元も習得できていない確率が高い。
 *  ・そこに、ランダムな取りこぼし（忘れ・つまずき）が少しある。
 */
function makeStudent(r, grade) {
  const A = normal(r) * 0.6; // 全体的な力
  const strands = ["num", "ratio", "alg", "func", "geom", "data", "calc"];
  const off = {};
  for (const st of strands) off[st] = A + normal(r) * 0.9;
  if (r.next() < 0.5) off[r.pick(strands)] -= 2.5 + r.next() * 1.5; // 特定の領域が大きく遅れている
  const learned = {};
  const theta = {};
  for (const id of ORDER) {
    const s = SKILLS[id];
    const f = grade - 0.5 + off[s.strand];
    let p = sigma((f - s.stage) * 1.5 + 1.0);
    p *= 0.96; // ランダムな取りこぼし
    for (const q of s.prereqs) if (!learned[q]) p *= CASCADE;
    p = Math.min(0.99, Math.max(0.005, p));
    learned[id] = r.next() < p;
    theta[id] = learned[id] ? 2.0 + A * 0.5 + normal(r) * 0.6 : -2.0 + A * 0.3 + normal(r) * 0.7;
  }
  // 問題ごとの実際の難しさは、名目の目盛りからずれている（モデルは知らない）
  const itemNoise = {};
  for (const id of ALL_IDS) for (const lv of [1, 2, 3]) itemNoise[`${id}|${lv}`] = normal(r) * NOISE;
  // 本当の「源流」= 習得できていない単元のうち、前提がすべて習得済みのもの（習う学年まで）
  const relevant = ALL_IDS.filter((id) => SKILLS[id].stage <= grade);
  const truthGap = relevant.filter((id) => !learned[id]);
  const truthRoots = truthGap.filter((id) => SKILLS[id].prereqs.every((p) => learned[p]));
  return { grade, A, learned, theta, itemNoise, truthGap, truthRoots, relevant };
}

/** 生徒が1問に答える（正誤・わからない） */
function answer(r, stu, skillId, level, kind) {
  const b = LEVEL_B[level] + stu.itemNoise[`${skillId}|${level}`];
  const g = { num: 0.02, fields: 0.01, choice: 0.25 }[kind];
  const p = g + (1 - g - 0.03) * sigma(stu.theta[skillId] - b);
  // 自信がないとき、「わからない」を押す生徒もいる
  if (p < 0.4 && r.next() < 0.4) return { ok: false, skipped: true };
  return { ok: r.next() < p, skipped: false };
}

function evaluate(L, stu) {
  // 明らかに習熟(θ≥1.6)／明らかにつまずき(習得していない)だけで集計（境界は除く）
  let tp = 0, fn = 0, fp = 0, tn = 0, brier = 0, cnt = 0;
  for (const id of stu.relevant) {
    const gapT = !stu.learned[id];
    const masterT = stu.learned[id] && stu.theta[id] >= 1.6;
    if (!gapT && !masterT) continue;
    const pm = L.pMaster(id);
    brier += (pm - (masterT ? 1 : 0)) ** 2;
    cnt++;
    const predMaster = pm >= 0.5;
    if (gapT && !predMaster) tp++;
    else if (gapT && predMaster) fn++;
    else if (masterT && !predMaster) fp++;
    else tn++;
  }
  const roots = rootCauses(L).slice(0, 5);
  const truthRootSet = new Set(stu.truthRoots);
  const truthGapSet = new Set(stu.truthGap);
  const hit = roots.filter((x) => truthRootSet.has(x.id)).length;
  const gapHit = roots.filter((x) => truthGapSet.has(x.id)).length;
  return {
    acc: (tp + tn) / cnt,
    gapRecall: tp + fn === 0 ? null : tp / (tp + fn),
    falseAlarm: fp + tn === 0 ? null : fp / (fp + tn),
    brier: brier / cnt,
    rootRecall: stu.truthRoots.length === 0 ? null : hit / Math.min(5, stu.truthRoots.length),
    rootPrecision: roots.length === 0 ? null : hit / roots.length,
    rootGapPrecision: roots.length === 0 ? null : gapHit / roots.length,
    nRoots: roots.length,
  };
}

function runOne(stu, strategy, checkpoints, rngSeed) {
  const r = makeRng(rngSeed);
  const L = new Learner({ grade: stu.grade });
  const asked = [];
  const out = {};
  const t0 = Date.now();
  for (let q = 1; q <= NQ; q++) {
    let pick;
    if (strategy === "random") {
      const id = r.pick(ALL_IDS.filter((x) => SKILLS[x].stage <= stu.grade + 1));
      pick = { skillId: id, level: 2, kind: kindOf(id) };
    } else {
      pick = chooseDiagnostic(L, { asked, playable: ALL_IDS, kindOf, rng: null });
    }
    asked.push(pick.skillId);
    const res = answer(r, stu, pick.skillId, pick.level, pick.kind);
    L.observe({ skillId: pick.skillId, level: pick.level, ok: res.ok, skipped: res.skipped, kind: pick.kind });
    if (checkpoints.includes(q)) out[q] = evaluate(L, stu);
  }
  out.ms = Date.now() - t0;
  return out;
}

function mean(xs) {
  const v = xs.filter((x) => x != null && !Number.isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
}


// --trace i : i 番目の生徒の診断の様子をすべて表示する（原因調査用）
function traceOne(stu, seed) {
  const r = makeRng(seed);
  const L = new Learner({ grade: stu.grade });
  const asked = [];
  console.log(`\n=== trace: 学年${stu.grade} A=${stu.A.toFixed(2)} 習う範囲${stu.relevant.length} 未習得${stu.truthGap.length} 源流${stu.truthRoots.length}`);
  console.log("本当の源流:", stu.truthRoots.join(", "));
  for (let q = 1; q <= NQ; q++) {
    const pick = chooseDiagnostic(L, { asked, playable: ALL_IDS, kindOf, rng: null });
    asked.push(pick.skillId);
    const before = L.pMaster(pick.skillId);
    const res = answer(r, stu, pick.skillId, pick.level, pick.kind);
    L.observe({ skillId: pick.skillId, level: pick.level, ok: res.ok, skipped: res.skipped, kind: pick.kind });
    console.log(`Q${String(q).padStart(2)} ${pick.skillId.padEnd(18)} L${pick.level} ${pick.kind.padEnd(6)} gain=${pick.gain.toFixed(2)} pc=${pick.pc.toFixed(2)} 事前pM=${before.toFixed(2)} → ${res.skipped ? "わからない" : res.ok ? "○" : "×"}  (本当: ${stu.learned[pick.skillId] ? "習得" : "未習得"} θ=${stu.theta[pick.skillId].toFixed(1)})  事後pM=${L.pMaster(pick.skillId).toFixed(2)}`);
  }
  const roots = rootCauses(L).slice(0, 8);
  console.log("推定した源流:", roots.map((x) => `${x.id}(pM=${x.pMaster.toFixed(2)},${stu.truthRoots.includes(x.id) ? "◎源流" : stu.truthGap.includes(x.id) ? "○未習得" : "×誤り"})`).join(", "));
  const missed = stu.truthRoots.filter((id) => !roots.some((x) => x.id === id));
  console.log("見逃した源流:", missed.map((id) => `${id}(pM=${L.pMaster(id).toFixed(2)}, 直接測定${L.stat[id].n}回)`).join(", "));
}
const ti = args.indexOf("--trace");
const checkpoints = [10, 15, 20, 30, 40, 50].filter((c) => c <= NQ);
const r0 = makeRng(SEED);
const grades = [5, 6, 7, 8, 9, 10, 11];
const students = [];
for (let i = 0; i < NSTUDENTS; i++) students.push(makeStudent(r0, grades[i % grades.length]));

if (ti >= 0) {
  traceOne(students[Number(args[ti + 1])], 1000 + Number(args[ti + 1]));
  process.exit(0);
}
const base = students.map((s) => evaluate(new Learner({ grade: s.grade }), s));

console.log(`生徒 ${NSTUDENTS} 人 / 診断 ${NQ} 問まで / seed=${SEED} / 問題の難しさのズレ sd=${NOISE} / 単元 ${ALL_IDS.length}`);
console.log(`平均の「本当の源流」数: ${mean(students.map((s) => s.truthRoots.length)).toFixed(1)}、習っているはずなのに未習得の単元数: ${mean(students.map((s) => s.truthGap.length)).toFixed(1)} / 習う範囲 ${mean(students.map((s) => s.relevant.length)).toFixed(0)}`);
console.log("");
const fmt = (x) => (Number.isNaN(x) ? "  -  " : x.toFixed(3));
const row = (label, q, es) =>
  console.log(
    `${label.padEnd(10)} ${String(q).padStart(4)}  ${fmt(mean(es.map((e) => e.acc)))}   ${fmt(mean(es.map((e) => e.gapRecall)))}        ${fmt(mean(es.map((e) => e.falseAlarm)))}    ${fmt(mean(es.map((e) => e.brier)))}   ${fmt(mean(es.map((e) => e.rootRecall)))}        ${fmt(mean(es.map((e) => e.rootPrecision)))}        ${fmt(mean(es.map((e) => e.rootGapPrecision)))}          ${mean(es.map((e) => e.nRoots)).toFixed(1)}`,
  );
console.log("方式        問数  正解率  つまずき発見率  誤警報率  Brier  源流再現率  源流適合率  (源流or未習得)適合率  挙げた数");
row("(見立てのみ)", 0, base);
for (const strategy of process.argv.includes("--quick") ? ["eig"] : ["random", "eig"]) {
  const results = students.map((s, i) => runOne(s, strategy, checkpoints, 1000 + i));
  for (const c of checkpoints) row(strategy, c, results.map((x) => x[c]));
  console.log(`  (${strategy}: 1人あたり ${mean(results.map((x) => x.ms)).toFixed(0)} ms / ${NQ} 問)`);
}
