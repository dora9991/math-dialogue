// ============================================================
// graph.js — 知識グラフを組み立てる（定義 + 問題テンプレ + 前後関係の索引）
//
//  SKILLS[id] = { id, name, strand, stage, prereqs, point, tpl,
//                 children, anc: Map(祖先ID→距離), desc: Map(子孫ID→距離) }
//  「祖先」＝前提をたどった先（さかのぼり先）、「子孫」＝そこから先に進む単元。
// ============================================================
import { SKILL_DEFS, STRANDS, STAGE_LABEL } from "./graph_def.js";
import { TEMPLATES } from "./tpl/index.js";

export { STRANDS, STAGE_LABEL };

const MAX_DEPTH = 4; // 証拠を伝える範囲（これより遠い関係は薄すぎるので無視）

export const SKILLS = {};
for (const d of SKILL_DEFS) {
  SKILLS[d.id] = { ...d, tpl: TEMPLATES[d.id] || [], children: [], anc: new Map(), desc: new Map() };
}

// 子の索引
for (const s of Object.values(SKILLS)) {
  for (const p of s.prereqs) SKILLS[p]?.children.push(s.id);
}

// 祖先（最短距離）と子孫（最短距離）
function bfs(startId, next) {
  const dist = new Map();
  let frontier = [startId];
  for (let depth = 1; depth <= MAX_DEPTH && frontier.length; depth++) {
    const nxt = [];
    for (const id of frontier) {
      for (const n of next(id)) {
        if (n === startId || dist.has(n)) continue;
        dist.set(n, depth);
        nxt.push(n);
      }
    }
    frontier = nxt;
  }
  return dist;
}
for (const s of Object.values(SKILLS)) {
  s.anc = bfs(s.id, (id) => SKILLS[id]?.prereqs || []);
  s.desc = bfs(s.id, (id) => SKILLS[id]?.children || []);
}

/** 学習順（前提が先に来る並び）。循環があれば残りは末尾に付く */
export const ORDER = (() => {
  const indeg = {};
  for (const s of Object.values(SKILLS)) indeg[s.id] = s.prereqs.filter((p) => SKILLS[p]).length;
  const q = Object.values(SKILLS)
    .filter((s) => indeg[s.id] === 0)
    .sort((a, b) => a.stage - b.stage);
  const out = [];
  while (q.length) {
    const s = q.shift();
    out.push(s.id);
    for (const c of s.children) {
      if (--indeg[c] === 0) {
        q.push(SKILLS[c]);
        q.sort((a, b) => a.stage - b.stage);
      }
    }
  }
  for (const id of Object.keys(SKILLS)) if (!out.includes(id)) out.push(id);
  return out;
})();

export const ALL_IDS = Object.keys(SKILLS);
export const skill = (id) => SKILLS[id];
export const skillName = (id) => SKILLS[id]?.name || id;
export const stageLabel = (st) => STAGE_LABEL[st] || String(st);
export const hasTemplates = (id) => (SKILLS[id]?.tpl?.length || 0) > 0;

/** 出題できる（テンプレのある）スキルだけ */
export const PLAYABLE_IDS = ALL_IDS.filter(hasTemplates);

/**
 * グラフの整合性チェック。問題があれば文字列の配列を返す（空なら健全）。
 *  ・重複ID／未知の前提／自己ループ／循環／前提より下の学年の単元が前提になっていないか
 */
export function validateGraph() {
  const errs = [];
  const seen = new Set();
  for (const d of SKILL_DEFS) {
    if (seen.has(d.id)) errs.push(`重複ID: ${d.id}`);
    seen.add(d.id);
    if (!STRANDS[d.strand]) errs.push(`${d.id}: 未知の領域 ${d.strand}`);
    if (!STAGE_LABEL[d.stage]) errs.push(`${d.id}: 未知の学年 ${d.stage}`);
    if (!d.point) errs.push(`${d.id}: ポイントが空`);
  }
  for (const s of Object.values(SKILLS)) {
    for (const p of s.prereqs) {
      if (p === s.id) errs.push(`${s.id}: 自分自身が前提`);
      else if (!SKILLS[p]) errs.push(`${s.id}: 未知の前提 ${p}`);
      else if (SKILLS[p].stage > s.stage) errs.push(`${s.id}(${stageLabel(s.stage)}): 前提 ${p} が上の学年(${stageLabel(SKILLS[p].stage)})`);
    }
  }
  // 循環検出（DFS）
  const state = {};
  const stack = [];
  const dfs = (id) => {
    state[id] = 1;
    stack.push(id);
    for (const p of SKILLS[id]?.prereqs || []) {
      if (!SKILLS[p]) continue;
      if (state[p] === 1) errs.push(`循環: ${[...stack.slice(stack.indexOf(p)), p].join(" → ")}`);
      else if (!state[p]) dfs(p);
    }
    stack.pop();
    state[id] = 2;
  };
  for (const id of Object.keys(SKILLS)) if (!state[id]) dfs(id);
  return errs;
}
