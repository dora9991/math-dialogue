// ============================================================
// simulate-practice.mjs — 診断のあとの「演習ループ」が破綻しないかを確かめる
//
//   node adaptive/tools/simulate-practice.mjs [--n 12] [--diag 20] [--q 120] [--seed 2]
//
//  診断 → 演習（適応出題）を合成生徒で回し、次を確認する：
//   ・同じ単元をだらだら続けない／前提へさかのぼる／クリアして次へ進む
//   ・出題の多くが「本当に習得していない単元」に向いている（すでにできる単元に時間を使わない）
//   ・難しさ（レベル）が、生徒の力に合っている（正答率が 60〜85% あたり）
//  ※ 生徒の「学習」は簡単なモデル（解くたびに少し伸びる。前提を超えては伸びない）。
// ============================================================
import { SKILLS, ALL_IDS, ORDER } from "../js/data/graph.js";
import { Learner } from "../js/core/model.js";
import { chooseDiagnostic, kindOf as realKindOf } from "../js/core/diagnose.js";
import { nextPractice, isCleared } from "../js/core/practice.js";
import { LEVEL_B } from "../js/core/items.js";
import { makeRng, hashSeed } from "../js/core/rng.js";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const NSTUDENTS = opt("n", 12);
const NDIAG = opt("diag", 20);
const NQ = opt("q", 120);
const SEED = opt("seed", 2);
const sigma = (x) => 1 / (1 + Math.exp(-x));

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

function makeStudent(r, grade) {
  const A = normal(r) * 0.6;
  const strands = ["num", "ratio", "alg", "func", "geom", "data", "calc"];
  const off = {};
  for (const st of strands) off[st] = A + normal(r) * 0.9;
  if (r.next() < 0.5) off[r.pick(strands)] -= 2.5 + r.next() * 1.5;
  const learned = {};
  const theta = {};
  for (const id of ORDER) {
    const s = SKILLS[id];
    const f = grade - 0.5 + off[s.strand];
    let p = sigma((f - s.stage) * 1.5 + 1.0) * 0.96;
    for (const q of s.prereqs) if (!learned[q]) p *= 0.5;
    p = Math.min(0.99, Math.max(0.005, p));
    learned[id] = r.next() < p;
    theta[id] = learned[id] ? 2.0 + A * 0.5 + normal(r) * 0.6 : -2.0 + A * 0.3 + normal(r) * 0.7;
  }
  const relevant = ALL_IDS.filter((id) => SKILLS[id].stage <= grade);
  return { grade, learned, theta, relevant };
}

function answer(r, stu, skillId, level, kind) {
  const b = LEVEL_B[level];
  const g = { num: 0.02, fields: 0.01, choice: 0.25 }[kind];
  const p = g + (1 - g - 0.03) * sigma(stu.theta[skillId] - b);
  if (p < 0.4 && r.next() < 0.4) return { ok: false, skipped: true, p };
  return { ok: r.next() < p, skipped: false, p };
}

/** 解くたびに少し伸びる（前提の力を超えては伸びない） */
function learn(stu, skillId, ok) {
  const cap = Math.min(3.0, ...SKILLS[skillId].prereqs.map((p) => stu.theta[p] + 1.0));
  stu.theta[skillId] = Math.min(cap, stu.theta[skillId] + (ok ? 0.25 : 0.4));
}

const TRACE = args.includes('--trace') ? Number(args[args.indexOf('--trace') + 1]) : -1;
const r0 = makeRng(SEED);
const grades = [6, 7, 8, 9, 10];
const rows = [];
for (let si = 0; si < NSTUDENTS; si++) {
  const stu = makeStudent(r0, grades[si % grades.length]);
  const r = makeRng(5000 + si);
  const L = new Learner({ grade: stu.grade });
  const asked = [];
  for (let q = 0; q < NDIAG; q++) {
    const pick = chooseDiagnostic(L, { asked, playable: ALL_IDS, kindOf });
    asked.push(pick.skillId);
    const res = answer(r, stu, pick.skillId, pick.level, pick.kind);
    L.observe({ skillId: pick.skillId, level: pick.level, ok: res.ok, skipped: res.skipped, kind: pick.kind });
  }
  const gapsAtStart = stu.relevant.filter((id) => stu.theta[id] < 1.1).length;
  L.P.discount = 0.85; // 練習中は力が伸びるので、過去の証拠を少し割り引く
  const ctx = { current: null, history: [], playable: ALL_IDS, kindOf, rng: r, stuck: new Set() };
  const st = { onGap: 0, onMastered: 0, backtracks: 0, reviews: 0, news: 0, cleared: new Set(), maxRun: 0, run: 0, lastSkill: null, correct: 0, levels: [0, 0, 0, 0], perSkill: {} };
  for (let q = 0; q < NQ; q++) {
    const pick = nextPractice(L, ctx);
    if (!pick) break;
    const wasGap = stu.theta[pick.skillId] < 1.1;
    if (wasGap) st.onGap++;
    else st.onMastered++;
    if (pick.reason === "backtrack") st.backtracks++;
    if (pick.reason === "review") st.reviews++;
    if (pick.reason === "new") st.news++;
    const pmBefore = L.pMaster(pick.skillId);
    const res = answer(r, stu, pick.skillId, pick.level, pick.kind);
    if (res.ok) st.correct++;
    st.levels[pick.level]++;
    L.observe({ skillId: pick.skillId, level: pick.level, ok: res.ok, skipped: res.skipped, kind: pick.kind });
    if (si === TRACE) console.log(`P${String(q + 1).padStart(3)} ${pick.reason.padEnd(9)} ${pick.skillId.padEnd(18)} L${pick.level} ${pick.kind.padEnd(6)} ${res.skipped ? 'わからない' : res.ok ? '○' : '×'}  pM ${pmBefore.toFixed(2)}→${L.pMaster(pick.skillId).toFixed(2)} n=${L.stat[pick.skillId].n}  本当のθ=${stu.theta[pick.skillId].toFixed(1)} ${stu.learned[pick.skillId] ? '' : '(穴)'}`);
    learn(stu, pick.skillId, res.ok);
    ctx.history.push({ skillId: pick.skillId, ok: res.ok, level: pick.level });
    ctx.current = pick.skillId;
    st.perSkill[pick.skillId] = (st.perSkill[pick.skillId] || 0) + 1;
    if (pick.skillId === st.lastSkill) st.run++;
    else st.run = 1;
    st.maxRun = Math.max(st.maxRun, st.run);
    st.lastSkill = pick.skillId;
    if (isCleared(L, pick.skillId)) st.cleared.add(pick.skillId);
  }
  const gapsAtEnd = stu.relevant.filter((id) => stu.theta[id] < 1.1).length;
  const clearedTrueGap = [...st.cleared].filter((id) => !stu.learned[id]).length;
  rows.push({
    grade: stu.grade,
    gapsAtStart,
    gapsAtEnd,
    cleared: st.cleared.size,
    clearedTrueGap,
    onGapRate: st.onGap / (st.onGap + st.onMastered),
    acc: st.correct / NQ,
    backtracks: st.backtracks,
    reviews: st.reviews,
    news: st.news,
    maxRun: st.maxRun,
    distinct: Object.keys(st.perSkill).length,
    maxPerSkill: Math.max(...Object.values(st.perSkill)),
    levels: st.levels.slice(1).join("/"),
    stuck: ctx.stuck.size,
  });
}
console.log(`生徒 ${NSTUDENTS} 人 / 診断 ${NDIAG} 問 → 演習 ${NQ} 問`);
console.log("学年 開始時の未習得 終了時 クリア数(うち本当の穴) 未習得単元への出題率 全体正答率 さかのぼり 見直し 新単元 最長連続 取り組んだ単元数 最多出題 レベル1/2/3 保留");
for (const x of rows) {
  console.log(
    `${String(x.grade).padStart(3)}  ${String(x.gapsAtStart).padStart(8)} ${String(x.gapsAtEnd).padStart(6)}  ${String(x.cleared).padStart(6)}(${String(x.clearedTrueGap).padStart(2)})        ${x.onGapRate.toFixed(2)}          ${x.acc.toFixed(2)}     ${String(x.backtracks).padStart(6)} ${String(x.reviews).padStart(6)} ${String(x.news).padStart(6)} ${String(x.maxRun).padStart(7)} ${String(x.distinct).padStart(10)} ${String(x.maxPerSkill).padStart(8)}  ${x.levels}  ${x.stuck}`,
  );
}
const mean = (k) => rows.reduce((a, x) => a + x[k], 0) / rows.length;
console.log(`平均: 未習得 ${mean("gapsAtStart").toFixed(1)} → ${mean("gapsAtEnd").toFixed(1)}、クリア ${mean("cleared").toFixed(1)}、未習得単元への出題率 ${mean("onGapRate").toFixed(2)}、正答率 ${mean("acc").toFixed(2)}、最長連続 ${mean("maxRun").toFixed(1)}`);
