// ============================================================
// diagnose.js — 診断テスト：次に出す1問を「いちばん多くのことが分かる問題」から選ぶ
//
//  ■ 考え方
//   各単元は「習熟している／していない」のどちらかに分類したい。
//   いま分類があいまい（習熟確率が50%に近い）な単元が集まっているあたりを、
//   1問で最も減らせる問題を選ぶ。＝ 期待情報量（bit）が最大の問題。
//   1問の正誤は前提関係を通じて周りの単元にも効くので、
//   「上流(前提)を確かめる／下流(発展)を確かめる」が自然に選ばれる。
//
//  ■ 計算
//   モデルが持つ「全単元の状態の同時サンプル」を使う。ある問題に正解(または不正解)した
//   と仮定してサンプルの重みを付け替えるだけで、全単元の習熟確率がどう変わるかが分かる。
//
//  ■ 補正
//   ・同じ単元の連続・繰り返しは減点（いろんな単元を見たい）
//   ・難しすぎて正答率が低い問題は減点（心が折れない範囲で）
//   ・学年から離れた単元は重みを小さく：いまの学年とその前の年を中心に見て、
//     古い単元は前提として必要なときにさかのぼる。2学年以上先・履修していない科目の単元は見ない
// ============================================================
import { SKILLS, PLAYABLE_IDS } from "../data/graph.js";
import { h2, pCorrect, NS } from "./model.js";

/**
 * 診断で単元を重視する度合い（単元の学年 stage が、いまの学年 grade からどれだけ離れているか）。
 *  いまの学年・1つ前 … 1、2つ前 0.7、3つ前 0.5、4つ前 0.35、それより前 0.25
 *  1つ先 … 0.4（予習の範囲）、2つ以上先（履修していない科目もここ）… 0（診断では出さない）
 *  古い単元も 0 にはしない：上の単元の答えから前提が怪しいと分かれば、さかのぼって確かめる
 */
export function relevance(stage, grade) {
  const back = grade - stage;
  if (back < -1) return 0;
  if (back === -1) return 0.4;
  if (back <= 1) return 1;
  if (back === 2) return 0.7;
  if (back === 3) return 0.5;
  if (back === 4) return 0.35;
  return 0.25;
}

/** 学習者 L にとっての単元 id の重み（履修していない科目は 0） */
export function relevanceOf(L, id) {
  return relevance(L.effStage ? L.effStage(id) : SKILLS[id].stage, L.grade);
}

/** その単元のテンプレの入力形式（当て推量の大きさを決める）。宣言がなければ選択式扱い */
export function kindOf(id) {
  return SKILLS[id]?.tpl?.[0]?.kind || "choice";
}

/** 同時出現表：co[(s*4+k)*N + j] = 「s の状態が k かつ j が習熟」のサンプル数 */
function coTable(L) {
  L.refresh();
  if (L._co) return L._co;
  const S = L.S;
  const N = L.N;
  const co = new Float64Array(N * NS * N);
  const masters = new Int32Array(N);
  const ms = L.P.masterState;
  for (let s = 0; s < S; s++) {
    const base = s * N;
    let nm = 0;
    for (let j = 0; j < N; j++) if (L.samples[base + j] >= ms) masters[nm++] = j;
    for (let i = 0; i < N; i++) {
      const off = (i * NS + L.samples[base + i]) * N;
      for (let a = 0; a < nm; a++) co[off + masters[a]]++;
    }
  }
  L._co = co;
  return co;
}

/** 全単元の重み（学年・履修科目に応じた relevance） */
export function weightsFor(L) {
  const w = new Float64Array(L.N);
  for (let i = 0; i < L.N; i++) w[i] = relevanceOf(L, L.order[i]);
  return w;
}

/**
 * 候補ひとつの期待情報量（bit、重み付き）。
 * @returns { gain, pc }  pc=その問題の期待正答率
 */
export function expectedGain(L, skillId, level, kind, weights) {
  const co = coTable(L);
  const S = L.S;
  const N = L.N;
  const s = L.idx[skillId];
  const lik = [0, 0, 0, 0];
  for (let k = 0; k < NS; k++) lik[k] = pCorrect(k, level, kind, { params: L.P });
  const m = [L.marg[s * NS], L.marg[s * NS + 1], L.marg[s * NS + 2], L.marg[s * NS + 3]];
  let pc = 0;
  for (let k = 0; k < NS; k++) pc += m[k] * lik[k];
  let denOk = 0;
  let denNg = 0;
  for (let k = 0; k < NS; k++) {
    denOk += lik[k] * m[k] * S;
    denNg += (1 - lik[k]) * m[k] * S;
  }
  let gain = 0;
  for (let j = 0; j < N; j++) {
    const w = weights[j];
    if (!w) continue;
    let before = 0;
    let numOk = 0;
    let numNg = 0;
    for (let k = 0; k < NS; k++) {
      const c = co[(s * NS + k) * N + j];
      before += c;
      numOk += lik[k] * c;
      numNg += (1 - lik[k]) * c;
    }
    before /= S;
    const pOk = denOk > 0 ? numOk / denOk : before;
    const pNg = denNg > 0 ? numNg / denNg : before;
    gain += w * (h2(before) - (pc * h2(pOk) + (1 - pc) * h2(pNg)));
  }
  return { gain, pc };
}

/** 全体の「あいまいさ」（重み付き平均の二値エントロピー）。小さいほど診断が進んでいる */
export function uncertainty(L) {
  const w = weightsFor(L);
  let s = 0;
  let ws = 0;
  for (let i = 0; i < L.N; i++) {
    s += w[i] * h2(L.pMaster(L.order[i]));
    ws += w[i];
  }
  return s / ws;
}

/**
 * 診断の次の1問を選ぶ。
 * @param L    Learner
 * @param ctx  { asked: [skillId,…]（これまでの出題順）, playable?: id[], kindOf?, rng?, levels? }
 * @returns { skillId, level, kind, gain, pc } | null
 */
export function chooseDiagnostic(L, ctx = {}) {
  const playable = ctx.playable || PLAYABLE_IDS;
  const kindFn = ctx.kindOf || kindOf;
  const asked = ctx.asked || [];
  const levels = ctx.levels || [1, 2, 3];
  const weights = weightsFor(L);
  const recent = new Set(asked.slice(-3));
  const cnt = {};
  for (const id of asked) cnt[id] = (cnt[id] || 0) + 1;

  const cands = [];
  for (const id of playable) {
    if (!weights[L.idx[id]]) continue; // 2学年以上先・履修していない科目の単元は出さない
    const kind = kindFn(id);
    for (const level of levels) {
      const { gain, pc } = expectedGain(L, id, level, kind, weights);
      let score = gain;
      if (recent.has(id)) score *= 0.2;
      else if (cnt[id] >= 2) score *= 0.5;
      else if (cnt[id] === 1) score *= 0.8;
      if (pc < 0.3) score *= Math.max(0.2, pc / 0.3); // 難しすぎる問題は避ける
      cands.push({ skillId: id, level, kind, gain, pc, score });
    }
  }
  cands.sort((a, b) => b.score - a.score);
  if (!cands.length) return null;
  if (ctx.rng) {
    // 上位でほぼ同点のものからランダムに（毎回同じ順にならないように）
    const top = cands.filter((c) => c.score >= cands[0].score * 0.93).slice(0, 4);
    return top[Math.floor(ctx.rng.next() * top.length)];
  }
  return cands[0];
}

/** 診断を終えてよいか。 */
export function shouldStop(L, n, opts = {}) {
  const min = opts.min ?? 12;
  const max = opts.max ?? 30;
  if (n >= max) return true;
  if (n < min) return false;
  return uncertainty(L) < (opts.target ?? 0.3);
}
