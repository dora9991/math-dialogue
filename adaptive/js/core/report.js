// ============================================================
// report.js — 診断結果を「人が読める形」にまとめる
//
//  ・つまずきの源流：苦手と推定される単元のうち、その前提がまだ怪しくないもの
//    （＝ 川をさかのぼった一番上流）。影響を受ける下流の単元数で並べる。
//  ・領域ごとの到達学年
//  ・よく出るまちがいパターン
// ============================================================
import { SKILLS, ALL_IDS, STRANDS } from "../data/graph.js";
import { MISCONCEPTIONS } from "../data/misconceptions.js";
import { relevanceOf } from "./diagnose.js";

/** 単元 id の下流への影響の大きさ（苦手そうな下流をどれだけ巻き込んでいるか） */
export function impactOf(L, id) {
  const s = SKILLS[id];
  let impact = 0;
  const blocked = [];
  for (const [d, k] of s.desc) {
    const pd = 1 - L.pMaster(d);
    if (pd > 0.5) blocked.push(d);
    impact += (pd * relevanceOf(L, d)) / k;
  }
  return { impact, blocked };
}

/**
 * つまずきの源流。
 * @param opts.gap   源流と認める pMaster の上限（既定 0.35）
 * @param opts.weak  前提がこれ以下なら「そちらが源流かも」として除外（既定 0.5）
 * @param opts.above 学年より上の単元も見る幅（既定 0＝習ったはずの単元だけ）
 */
export function rootCauses(L, opts = {}) {
  const gapThr = opts.gap ?? 0.35;
  const weakThr = opts.weak ?? 0.5;
  const above = opts.above ?? 0;
  const out = [];
  for (const id of ALL_IDS) {
    const s = SKILLS[id];
    if (L.effStage(id) > L.grade + above) continue; // 履修していない科目の単元は、つまずきとして挙げない
    const pm = L.pMaster(id);
    if (pm > gapThr) continue;
    if (s.prereqs.some((p) => L.pMaster(p) <= weakThr)) continue;
    const { impact, blocked } = impactOf(L, id);
    out.push({ id, pMaster: pm, direct: L.stat[id].n > 0, n: L.stat[id].n, impact, blocked, score: (1 - pm) * (1 + impact) });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

/** 領域ごとの状況 */
export function strandSummary(L) {
  const res = {};
  for (const key of Object.keys(STRANDS)) {
    const ids = ALL_IDS.filter((id) => SKILLS[id].strand === key).sort((a, b) => SKILLS[a].stage - SKILLS[b].stage);
    const counts = { mastered: 0, infOk: 0, shaky: 0, gap: 0, infGap: 0, unknown: 0, future: 0 };
    for (const id of ids) counts[L.state(id)]++;
    // 到達学年：その学年までの単元の8割以上が「できていそう(pMaster≥0.6)」な最大の学年
    const stages = [...new Set(ids.map((id) => SKILLS[id].stage))].sort((a, b) => a - b);
    let reach = null;
    for (const st of stages) {
      const upto = ids.filter((id) => SKILLS[id].stage <= st);
      const ok = upto.filter((id) => L.pMaster(id) >= 0.6).length;
      if (ok / upto.length >= 0.8) reach = st;
      else break;
    }
    res[key] = { ...counts, total: ids.length, reach, ids };
  }
  return res;
}

/** まちがいパターンの一覧（回数の多い順） */
export function misconceptionSummary(L, log = []) {
  const bySkill = {};
  for (const o of log) {
    if (!o.mc) continue;
    (bySkill[o.mc] ||= new Set()).add(o.skillId);
  }
  return Object.entries(L.mcCount)
    .map(([id, count]) => ({ id, count, ...(MISCONCEPTIONS[id] || { name: id, blame: null, tip: "" }), skills: [...(bySkill[id] || [])] }))
    .sort((a, b) => b.count - a.count);
}

/** 全体の集計（画面の見出し用） */
export function overview(L) {
  const c = { mastered: 0, infOk: 0, shaky: 0, gap: 0, infGap: 0, unknown: 0, future: 0 };
  let relevantTotal = 0;
  for (const id of ALL_IDS) {
    if (L.effStage(id) > L.grade) continue;
    relevantTotal++;
    c[L.state(id)]++;
  }
  return { ...c, relevantTotal, answered: L.n };
}
