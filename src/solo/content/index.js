// ============================================================
// content/index.js — 小1〜高3 の全単元を束ねる窓口（数学ラボ ソロ）
//
//  画面・エンジンは「import { UNITS, getUnit, genProblem } from '../content'」だけ使う。
//  単元を足すときは、elem/ jhs/ high/ のファイルに書いて、ここで import するだけ。
// ============================================================
import { UNITS as E1 } from "./elem/e1.js";
import { UNITS as E2 } from "./elem/e2.js";
import { UNITS as E3 } from "./elem/e3.js";
import { UNITS as E4 } from "./elem/e4.js";
import { UNITS as E5 } from "./elem/e5.js";
import { UNITS as E6 } from "./elem/e6.js";
import { UNITS as JHS, adapt } from "./jhs/index.js";
import { UNITS as HI } from "./high/hI.js";
import { UNITS as HA } from "./high/hA.js";
import { UNITS as HII } from "./high/hII.js";
import { UNITS as HB } from "./high/hB.js";
import { UNITS as HC } from "./high/hC.js";
import { UNITS as HIII } from "./high/hIII.js";
import { dbTemplatesFor } from "../../data/dbProblems.js";

// ── 学年・分野・レベルの共通定義 ─────────────────────────
export const GRADE_ORDER = ["E1", "E2", "E3", "E4", "E5", "E6", "J1", "J2", "J3", "H1", "H2", "H3"];
export const GRADE_LABEL = {
  E1: "小1", E2: "小2", E3: "小3", E4: "小4", E5: "小5", E6: "小6",
  J1: "中1", J2: "中2", J3: "中3", H1: "高1", H2: "高2", H3: "高3",
};
export const STAGE_OF = (g) => g[0]; // "E" | "J" | "H"
export const STAGE_LABEL = { E: "小学校", J: "中学校", H: "高校" };
export const gradeIndex = (g) => GRADE_ORDER.indexOf(g);

export const AREAS = ["num", "geo", "func", "data"];
export const AREA_INFO = {
  num: { label: "数と式", short: "数式", color: "#6366f1", icon: "🔢" },
  geo: { label: "図形", short: "図形", color: "#10b981", icon: "📐" },
  func: { label: "関数・変化", short: "関数", color: "#f59e0b", icon: "📈" },
  data: { label: "データ・確率", short: "データ", color: "#ec4899", icon: "🎲" },
};

export const LEVELS = [1, 2, 3, 4];
export const LEVEL_INFO = {
  1: { label: "簡単", color: "#22c55e", xp: 10 },
  2: { label: "標準", color: "#3b82f6", xp: 15 },
  3: { label: "応用", color: "#f97316", xp: 20 },
  4: { label: "難関", color: "#a855f7", xp: 30 },
};

// ── 単元の一覧 ───────────────────────────────────────
// 中1の実問題（教科書PDF由来・problem_bank.json）を、該当単元の各レベルに1枠として混ぜる
const DB_LEVEL = { 1: "easy", 2: "standard", 3: "advanced" };
function withDbProblems(u) {
  if (!u.srcUnitId) return u;
  const levels = { ...u.levels };
  for (const [L, key] of Object.entries(DB_LEVEL)) {
    const db = dbTemplatesFor(u.srcUnitId, key);
    if (!db.length) continue;
    levels[L] = [
      ...(levels[L] || []),
      { id: `${u.id}-db${L}`, fromDb: true, build: (r) => adapt(db[r(0, db.length - 1)].build(r)) },
    ];
  }
  return { ...u, levels };
}

const RAW = [...E1, ...E2, ...E3, ...E4, ...E5, ...E6, ...JHS.map(withDbProblems), ...HI, ...HA, ...HII, ...HB, ...HC, ...HIII];

export const UNITS = RAW.map((u) => ({
  ...u,
  gi: gradeIndex(u.grade),
  maxLevel: Math.max(0, ...LEVELS.filter((L) => (u.levels?.[L] || []).length > 0)),
}));

const BY_ID = new Map(UNITS.map((u) => [u.id, u]));
export const getUnit = (id) => BY_ID.get(id) || null;

// 前提（prereqs）の逆引き＝この単元を土台にしている単元
const DEPENDENTS = new Map(UNITS.map((u) => [u.id, []]));
for (const u of UNITS) for (const p of u.prereqs || []) DEPENDENTS.get(p)?.push(u.id);
export const dependentsOf = (id) => DEPENDENTS.get(id) || [];
export const prereqsOf = (id) => (getUnit(id)?.prereqs || []).filter((p) => BY_ID.has(p));

/** 先祖（前提の前提…）をすべて。近い順 */
export function ancestorsOf(id) {
  const out = [];
  const seen = new Set([id]);
  let frontier = [id];
  while (frontier.length) {
    const next = [];
    for (const x of frontier) for (const p of prereqsOf(x)) if (!seen.has(p)) { seen.add(p); out.push(p); next.push(p); }
    frontier = next;
  }
  return out;
}

/** 子孫（この単元を土台にする単元すべて） */
export function descendantsOf(id) {
  const out = [];
  const seen = new Set([id]);
  let frontier = [id];
  while (frontier.length) {
    const next = [];
    for (const x of frontier) for (const d of dependentsOf(x)) if (!seen.has(d)) { seen.add(d); out.push(d); next.push(d); }
    frontier = next;
  }
  return out;
}

/** 学年ラベル（"中1"）＋単元名 */
export const unitTitle = (u) => (u ? `${GRADE_LABEL[u.grade]}　${u.name}` : "");

// ── 問題の生成 ───────────────────────────────────────
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/** 出せるレベル（指定レベルが無ければ近い下のレベル→上のレベル） */
export function usableLevel(u, level) {
  if ((u.levels?.[level] || []).length) return level;
  for (let L = level - 1; L >= 1; L--) if ((u.levels?.[L] || []).length) return L;
  for (let L = level + 1; L <= 4; L++) if ((u.levels?.[L] || []).length) return L;
  return 0;
}

/**
 * 1問つくる。
 * @param {string} unitId
 * @param {number} level 1〜4
 * @param {string[]} recent 直近に出したテンプレID（連続を避ける）
 * @returns {object|null} { q, ans, choices?, unit?, hint, steps, unitId, level, tplId, key }
 */
export function genProblem(unitId, level, recent = []) {
  const u = getUnit(unitId);
  if (!u) return null;
  const L = usableLevel(u, level);
  if (!L) return null;
  const pool = u.levels[L];
  const fresh = pool.filter((t) => !recent.includes(t.id));
  const list = fresh.length ? fresh : pool;
  for (let i = 0; i < 40; i++) {
    const tpl = list[rnd(0, list.length - 1)];
    let p;
    try { p = tpl.build(rnd); } catch (e) { console.warn("問題の生成に失敗", tpl.id, e); continue; }
    if (!p || p.skip) continue;
    return { ...p, unitId, level: L, tplId: tpl.id, key: `${tpl.id}:${p.q}` };
  }
  return null;
}
