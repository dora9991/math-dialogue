// ============================================================
// practice.js — 演習：次に何を・どの難しさで出すか（適応学習）
//
//  ■ 方針
//   1. いま取り組む単元は「前提がそろっていて、まだ習熟していない」ものから選ぶ
//      （前提が怪しい単元を先にやっても、積み上がらないから）。
//      下流に苦手をたくさん抱える単元＝源流を優先する。
//   2. すでに他の単元の結果から「できていそう」な単元は飛ばす。
//   3. 難しさは、期待正答率が 75% 前後になるレベル（易しすぎず難しすぎず）。
//   4. 同じ単元で続けて間違えたら、前提へさかのぼる。
//   5. たまに、以前できた単元の見直し（忘れかけ）を混ぜる。
// ============================================================
import { SKILLS, PLAYABLE_IDS } from "../data/graph.js";
import { impactOf } from "./report.js";
import { kindOf, relevance, relevanceOf } from "./diagnose.js";

export const CLEAR = { pm: 0.85, minN: 1 };
export const TARGET_ACC = 0.75;

/** その単元をクリアしたか（習熟している確率が高く、標準以上を1問は解けている）。選択式1問の偶然は pMaster が割り引く */
export function isCleared(L, id) {
  const st = L.stat[id];
  if (st.n < CLEAR.minN) return false;
  if (L.pMaster(id) < CLEAR.pm) return false;
  return st.lv[2][1] + st.lv[3][1] >= 1;
}

/** 前提がそろっているか（前提の単元を先に練習すべきなら false） */
function prereqsReady(L, id, playable) {
  return SKILLS[id].prereqs.every((p) => !playable.has(p) || L.pMaster(p) >= 0.55);
}

/**
 * 取り組める単元の候補（いまやる価値が高い順）。
 * @param ctx { above?: 学年より上を許す幅(既定1), playable?: id[] }
 */
export function frontier(L, ctx = {}) {
  const playable = new Set(ctx.playable || PLAYABLE_IDS);
  const above = ctx.above ?? 1;
  const out = [];
  for (const id of playable) {
    const est = L.effStage(id); // 履修していない科目の単元は「先の単元」になる
    if (est > L.grade + above) continue;
    if (isCleared(L, id)) continue;
    if (ctx.stuck?.has(id)) continue; // 今回は行き詰まった単元（先生に相談の候補）
    const pm = L.pMaster(id);
    // 測っていないがほぼ確実にできている単元は飛ばす（時間の節約）
    if (L.stat[id].n === 0 && pm >= 0.85) continue;
    if (!prereqsReady(L, id, playable)) continue;
    const { impact } = impactOf(L, id);
    const score = 2 * (1 - pm) + 0.15 * impact - 0.04 * est + (est <= L.grade ? 0.3 : 0);
    out.push({ id, pm, impact, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

/**
 * 出題レベルを決める。
 *  ・まだほとんど測っていない単元（答えが0〜1回で、習熟かどうか五分五分）は、
 *    まず「標準」で確かめる（できていれば1〜2問で先へ進める）。
 *  ・それ以外は、期待正答率が target(75%) に近いレベル。連続正解・不正解で補正。
 *  ・opts.maxLevel で上限（さかのぼりの確認は標準まで）。
 */
export function chooseLevel(L, id, kind, opts = {}) {
  const maxLevel = opts.maxLevel ?? 3;
  const st = L.stat[id];
  const pm = L.pMaster(id);
  if (st.n <= 1 && pm >= 0.3 && pm <= 0.85 && !(st.n === 1 && st.wrongStreak >= 1)) return Math.min(2, maxLevel);
  let best = 1;
  let bestD = Infinity;
  for (const lv of [1, 2, 3]) {
    const d = Math.abs(L.expectedAcc(id, lv, kind) - (opts.target ?? TARGET_ACC));
    if (d < bestD - 1e-9) {
      bestD = d;
      best = lv;
    }
  }
  if (st.streak >= 3 && opts.lastLevel) best = Math.max(best, Math.min(3, opts.lastLevel + 1));
  if (st.wrongStreak >= 2 && opts.lastLevel) best = Math.min(best, Math.max(1, opts.lastLevel - 1));
  return Math.min(best, maxLevel);
}

/**
 * 何度やっても進まない単元か。
 *  ・このセッションで6回以上取り組んで、直近6回の正答が2回以下 → 行き詰まり
 *  ・または16回取り組んでもクリアしていない
 */
export function isStuck(hist, skillId, opts = {}) {
  const mine = hist.filter((h) => h.skillId === skillId);
  if (mine.length >= (opts.hardCap ?? 16)) return true;
  if (mine.length >= 6) {
    const recent = mine.slice(-6);
    return recent.filter((h) => h.ok).length <= 2;
  }
  return false;
}

/**
 * 次の出題を決める。
 * @param ctx {
 *   current?: 取り組み中の単元ID, focus?: 生徒が選んだ単元ID,
 *   history?: [{skillId, ok, level}]（このセッションの直近から）,
 *   now?: 時刻, rng?, playable?, above?, review?: 見直しを混ぜる確率(既定0.12), stuckLimit?: 16(回数の上限),
 *   stuck?: Set（行き詰まった単元をここに入れる。今回の演習ではもう出さない）
 * }
 * @returns { skillId, level, kind, reason, note? }
 *   reason: "focus"|"continue"|"new"|"backtrack"|"review"
 */
export function nextPractice(L, ctx = {}) {
  const playable = new Set(ctx.playable || PLAYABLE_IDS);
  const kindFn = ctx.kindOf || kindOf;
  const hist = ctx.history || [];
  const rng = ctx.rng;
  const last = hist[hist.length - 1];

  const make = (id, reason, note, maxLevel) => {
    const kind = kindFn(id);
    const lastLevel = last && last.skillId === id ? last.level : null;
    return { skillId: id, level: chooseLevel(L, id, kind, { lastLevel, maxLevel }), kind, reason, note };
  };

  // 1) さかのぼり：同じ単元で連続して間違えたら前提へ
  let cur = ctx.current || ctx.focus || null;
  if (cur && SKILLS[cur]) {
    const st = L.stat[cur];
    if (st.wrongStreak >= 2) {
      const cands = SKILLS[cur].prereqs.filter((p) => playable.has(p) && L.pMaster(p) < 0.85 && !isCleared(L, p));
      if (cands.length) {
        cands.sort((a, b) => L.pMaster(a) - L.pMaster(b));
        return make(cands[0], "backtrack", `「${SKILLS[cur].name}」でつまずいたので、前提の単元を確かめます`, 2);
      }
    }
  }

  // 2) 見直し：以前できた単元で、時間がたって怪しくなったもの
  const reviewP = ctx.review ?? 0.12;
  if (rng && rng.next() < reviewP) {
    const cands = [...playable].filter((id) => L.stat[id].n >= CLEAR.minN && L.stat[id].c >= 2 && isMasteredDirect(L, id) && L.pMaster(id) < 0.9 && id !== cur);
    if (cands.length) {
      cands.sort((a, b) => L.pMaster(a) - L.pMaster(b));
      return make(cands[0], "review", "前にできた単元の見直しです");
    }
  }

  // 3) 取り組み中の単元を続ける（クリアするか、行き詰まるまで）
  if (cur && playable.has(cur) && !isCleared(L, cur) && !ctx.stuck?.has(cur)) {
    const stuck = isStuck(hist, cur, { hardCap: ctx.stuckLimit });
    const ready = prereqsReady(L, cur, playable);
    if (stuck) {
      // 何度やっても進まない単元：今回は保留にして、先生に知らせる候補にする
      if (ctx.stuck) ctx.stuck.add(cur);
    } else if (ready) return make(cur, ctx.focus === cur ? "focus" : "continue");
  }

  // 4) 新しい単元を選ぶ
  const fr = frontier(L, ctx).filter((f) => f.id !== cur || isCleared(L, cur));
  if (fr.length) return make(fr[0].id, "new");
  // 全部クリア済みなら、いちばん怪しい単元を見直す
  const rest = [...playable].sort((a, b) => L.pMaster(a) - L.pMaster(b));
  return rest.length ? make(rest[0], "review", "ひととおり終わりました。見直しをしましょう") : null;
}

function isMasteredDirect(L, id) {
  return L.stat[id].n > 0 && L.pMaster(id) >= 0.75;
}

/** 学習プラン（これから取り組む順の単元リスト）。画面の「この順で進めます」用 */
export function studyPlan(L, ctx = {}) {
  const limit = ctx.limit ?? 8;
  const playable = new Set(ctx.playable || PLAYABLE_IDS);
  const above = ctx.above ?? 1;
  // 未習熟の単元を集め、前提が先に来るように並べる（graph の ORDER 順）
  const cand = [...playable].filter((id) => {
    if (L.effStage(id) > L.grade + above) return false;
    if (isCleared(L, id)) return false;
    if (L.stat[id].n === 0 && L.pMaster(id) >= 0.85) return false;
    return L.pMaster(id) < 0.75 || L.stat[id].n === 0;
  });
  const set = new Set(cand);
  // 前提がまだ候補に残っている単元は後ろへ。優先度：源流（前提が候補にない）→ 影響の大きい順
  const out = [];
  const done = new Set();
  while (out.length < limit && out.length < cand.length) {
    const ready = cand.filter((id) => !done.has(id) && SKILLS[id].prereqs.every((p) => !set.has(p) || done.has(p)));
    if (!ready.length) break;
    ready.sort((a, b) => {
      const sa = 2 * (1 - L.pMaster(a)) + 0.15 * impactOf(L, a).impact - 0.04 * SKILLS[a].stage;
      const sb = 2 * (1 - L.pMaster(b)) + 0.15 * impactOf(L, b).impact - 0.04 * SKILLS[b].stage;
      return sb - sa;
    });
    out.push(ready[0]);
    done.add(ready[0]);
  }
  return out;
}

export { relevance, relevanceOf };
