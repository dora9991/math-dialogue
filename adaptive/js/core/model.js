// ============================================================
// model.js — 学習者モデル（単元ごとの4段階の「習熟の状態」を推定する）
//
//  ■ 考え方（先生向けの説明）
//   ・各単元には 0=未習 / 1=基礎 / 2=標準 / 3=発展 の4段階の状態がある（本人は観測できない）。
//     「習熟」＝ 2 以上（標準問題をほぼ解ける）。
//   ・状態が分かれば、問題（難易度1〜3）の正答確率が決まる。
//        P(正解) = g + (1-g-slip)·σ(傾き·(状態の力 − 問題の難しさ))
//     g は当て推量（選択式は高く、数値入力は低い）。「わからない」は g=0 の不正解。
//   ・前提関係：前提の単元がすべて整っているとき、その単元の状態は「学年から見た基準の分布」に従う。
//     前提が弱いと、その先の単元も低い状態に寄る（前提が1段階足りないごとに、上の状態が 1/4 に）。
//     川の上流が細ければ下流も細くなる。これを確率の条件付き分布として持つので、
//     「下流でつまずいた」→「上流のどこかが弱い」→「上流の1つが弱いと分かれば、他の疑いは晴れる」
//     という原因の切り分け（explaining away）が自然に起きる。
//   ・学年から見た初期の見立て（下の学年ほど習得済みの確率が高い）に加え、
//     「全体的にできる子／苦手な子」(G)、「この領域が得意／苦手」(Gs) を表す変数も持つ。
//     数問の結果から、まだ聞いていない単元までまとめて傾けるための仕掛け。
//   ・答えるたびに、証拠（正誤）を単元ごとに足していき、
//     全単元の状態の同時分布をギブスサンプリングで近似する（乱数は固定seed＝同じ記録なら同じ結果）。
//
//  ■ 何が良いのか
//   ・「間違えた」→ 原因が この単元か、前提のどれかか を、他の答えとの兼ね合いで按分できる
//     （原因を確かめると、他方の疑いが自然に下がる＝explaining away）。
//   ・難しさの違う問題の結果も、1つの状態にまとめられる（易しいのはできて難しいのはできない、など）。
//
//  ■ 保存は「解答ログ」だけ。モデルはログから毎回作り直す（パラメータ調整しても記録が生きる）。
// ============================================================
import { SKILLS, ORDER, STRANDS } from "../data/graph.js";
import { MISCONCEPTIONS } from "../data/misconceptions.js";
import { makeRng } from "./rng.js";
import { LEVEL_B } from "./items.js";

export const PARAMS = {
  theta: [-2.0, -0.3, 1.3, 2.8], // 各状態の「力」
  slope: 1.5,
  slip: 0.03,
  guess: { num: 0.02, fields: 0.01, choice: 0.3 },
  edgeLambda: Math.log(4), // 前提が1段階足りないごとのペナルティ（対数）
  masterState: 2, // これ以上を「習熟」とみなす
  mcBlame: { w: 0.8, level: 2 },
  chain: { burn: 120, keep: 500, chains: 2 },
  // 「全体的にできる子／苦手な子」(G) と「この領域が得意／苦手」(Gs) が、
  // 各単元の事前分布をどれだけ傾けるか。値は -2..+2 の5段階で、下の重みが事前確率。
  tiltGlobal: 0.3,
  tiltStrand: 0.45,
  gWeights: [0.06, 0.2, 0.48, 0.2, 0.06],
  gsWeights: [0.08, 0.22, 0.4, 0.22, 0.08],
  forgetHalfLifeDays: 45, // 時間がたつと、その単元の過去の証拠は薄まる
  discount: 1, // 同じ単元で答えるたび、過去の証拠を割り引く（診断=1、練習=0.85）
};

export const NS = 4;
const NG = 5; // G の取りうる値の数（-2..+2）
const sigma = (x) => 1 / (1 + Math.exp(-x));

/** 状態 k の生徒が、難易度 level・形式 kind の問題に正解する確率 */
export function pCorrect(k, level, kind, o = {}) {
  const P = o.params || PARAMS;
  const g = o.skipped ? 0 : (P.guess[kind] ?? P.guess.choice);
  return g + (1 - g - P.slip) * sigma(P.slope * (P.theta[k] - LEVEL_B[level]));
}

/** 学年 grade の生徒にとっての、単元（学年 stage）の事前分布（4状態） */
export function priorDist(stage, grade) {
  const gap = grade - stage;
  if (gap >= 4) return [0.04, 0.1, 0.46, 0.4];
  if (gap === 3) return [0.05, 0.13, 0.47, 0.35];
  if (gap === 2) return [0.07, 0.18, 0.47, 0.28];
  if (gap === 1) return [0.12, 0.26, 0.42, 0.2];
  if (gap === 0) return [0.25, 0.32, 0.31, 0.12];
  if (gap === -1) return [0.55, 0.28, 0.13, 0.04];
  return [0.85, 0.11, 0.03, 0.01];
}

/** 実際の知識グラフをモデル用の形にする（テストでは小さなグラフを差し替える） */
export function defaultGraph() {
  return { order: ORDER, skills: SKILLS, strands: Object.keys(STRANDS) };
}

export class Learner {
  /**
   * @param opts.grade  いまの学年（stage の数値。中2=8）
   * @param opts.courses 履修している高校の科目（["I","A",…]）。高校生のときだけ使う。省略ですべて履修扱い
   * @param opts.params PARAMS の上書き
   * @param opts.graph  { order, skills:{id:{stage,strand,prereqs}}, strands:[…] }（省略で本物）
   */
  constructor(opts = {}) {
    this.grade = opts.grade ?? 8;
    // 科目の区別は高校生だけ（中学生以下は、高校の単元はどれも「まだ先の単元」）
    this.courses = this.grade >= 10 && Array.isArray(opts.courses) ? new Set(opts.courses) : null;
    this.P = { ...PARAMS, ...(opts.params || {}), guess: { ...PARAMS.guess, ...(opts.params?.guess || {}) } };
    const g = opts.graph || defaultGraph();
    this.order = g.order;
    this.skills = g.skills;
    this.N = g.order.length;
    this.idx = {};
    g.order.forEach((id, i) => (this.idx[id] = i));
    this.strandKeys = g.strands;
    this.NST = g.strands.length;
    this.sidx = g.order.map((id) => g.strands.indexOf(g.skills[id].strand));
    this.pa = g.order.map((id) => g.skills[id].prereqs.filter((p) => this.idx[p] != null).map((p) => this.idx[p]));
    this.ch = g.order.map(() => []);
    this.pa.forEach((ps, i) => ps.forEach((p) => this.ch[p].push(i)));

    this.logU = new Float64Array(this.N * NS); // 単元ごとの証拠（対数尤度の合計）
    this.stat = {};
    for (const id of g.order) {
      this.stat[id] = { n: 0, c: 0, lv: { 1: [0, 0], 2: [0, 0], 3: [0, 0] }, last: null, tDecay: null, streak: 0, wrongStreak: 0 };
    }
    this.mcCount = {};
    this.n = 0;
    this._dirty = true;
    this._seedBase = opts.seed ?? 20240611;
    this._buildPriors();
  }

  /** 履修している科目の単元か（科目のない単元・科目の指定がないときは true） */
  takes(id) {
    const c = this.skills[id]?.course;
    return !c || !this.courses || this.courses.has(c);
  }

  /** この生徒にとっての単元の学年。履修していない科目の単元は「2学年以上先（まだ習わない）」として扱う */
  effStage(id) {
    const st = this.skills[id].stage;
    return this.takes(id) ? st : Math.max(st, this.grade + 2);
  }

  _buildPriors() {
    const P = this.P;
    // logPi[i][combo*4 + k]：単元 i の事前分布（対数）。combo = (G+2)*5 + (Gs+2)
    this.logPi = [];
    for (let i = 0; i < this.N; i++) {
      const base = priorDist(this.effStage(this.order[i]), this.grade);
      const arr = new Float64Array(NG * NG * NS);
      for (let gg = 0; gg < NG; gg++) {
        for (let gs = 0; gs < NG; gs++) {
          const c = P.tiltGlobal * (gg - 2) + P.tiltStrand * (gs - 2);
          let z = 0;
          const tmp = base.map((p, k) => {
            const v = p * Math.exp(c * (k - 1.5));
            z += v;
            return v;
          });
          const o = (gg * NG + gs) * NS;
          for (let k = 0; k < NS; k++) arr[o + k] = Math.log(tmp[k] / z);
        }
      }
      this.logPi.push(arr);
    }
    this.logGw = P.gWeights.map((w) => Math.log(w));
    this.logGsw = P.gsWeights.map((w) => Math.log(w));
    // 辺のペナルティ：edgeExp[kc*4+kp] = exp(-λ·max(0, min(kc,2) - kp))
    this.edgeExp = new Float64Array(NS * NS);
    for (let kc = 0; kc < NS; kc++) for (let kp = 0; kp < NS; kp++) this.edgeExp[kc * NS + kp] = Math.exp(-P.edgeLambda * Math.max(0, Math.min(kc, 2) - kp));
    this.piExp = this.logPi.map((a) => a.map(Math.exp));
  }

  /** 単元 i の「前提の状態から決まる重み」prod[i*4+k] = Π_p edgeExp[k][state[p]] を作る */
  _prodOf(i, state, prod) {
    const pa = this.pa[i];
    for (let k = 0; k < NS; k++) {
      let v = 1;
      for (let a = 0; a < pa.length; a++) v *= this.edgeExp[k * NS + state[pa[a]]];
      prod[i * NS + k] = v;
    }
  }

  // ── 解答の反映 ───────────────────────────────────
  /**
   * @param o { skillId, level, ok, skipped?, kind?, mc?, t? }
   */
  observe(o) {
    const P = this.P;
    const i = this.idx[o.skillId];
    const st = this.stat[o.skillId];
    // 同じ単元の過去の証拠を、時間と回数に応じて薄める
    let f = P.discount;
    if (o.t && st.tDecay) {
      const days = Math.max(0, (o.t - st.tDecay) / 86400000);
      f *= Math.pow(0.5, days / P.forgetHalfLifeDays);
    }
    if (f < 1) for (let k = 0; k < NS; k++) this.logU[i * NS + k] *= f;

    this._addEvidence(i, o.level, o.kind || "choice", o.ok, o.skipped, 1);
    if (!o.ok) {
      const mc = o.mc && MISCONCEPTIONS[o.mc];
      if (mc?.blame && mc.blame !== o.skillId && this.idx[mc.blame] != null) {
        this._addEvidence(this.idx[mc.blame], P.mcBlame.level, "num", false, false, P.mcBlame.w);
      }
    }
    st.n++;
    if (o.ok) st.c++;
    if (o.level && st.lv[o.level]) {
      st.lv[o.level][0]++;
      if (o.ok) st.lv[o.level][1]++;
    }
    st.streak = o.ok ? st.streak + 1 : 0;
    st.wrongStreak = o.ok ? 0 : st.wrongStreak + 1;
    if (o.t) {
      st.last = o.t;
      st.tDecay = o.t;
    }
    if (o.mc) this.mcCount[o.mc] = (this.mcCount[o.mc] || 0) + 1;
    this.n++;
    this._dirty = true;
  }

  _addEvidence(i, level, kind, ok, skipped, w) {
    for (let k = 0; k < NS; k++) {
      const p = pCorrect(k, level, kind, { skipped, params: this.P });
      this.logU[i * NS + k] += w * Math.log(Math.max(1e-9, ok ? p : 1 - p));
    }
  }

  // ── 推論（ギブスサンプリング） ─────────────────────
  /** 記録が増えていたらサンプルを取り直す */
  refresh() {
    if (!this._dirty) return;
    const N = this.N;
    const { burn, keep, chains } = this.P.chain;
    const perChain = Math.ceil(keep / chains);
    const S = perChain * chains;
    const samples = new Uint8Array(S * N);
    const seedBase = this._seedBase + this.n * 7919 + this.grade * 31;
    this.expU = this.logU.map(Math.exp); // 証拠を確率の重みに
    let row = 0;
    for (let c = 0; c < chains; c++) {
      const r = makeRng(seedBase + c * 104729);
      const state = new Uint8Array(N);
      // 初期値：チェーンごとに変える（0:事前のモード / 1:全部標準）
      for (let i = 0; i < N; i++) state[i] = c === 0 ? this._modeOf(i) : 2;
      const G = { g: 2, s: new Uint8Array(this.NST).fill(2) };
      const prod = new Float64Array(N * NS);
      for (let i = 0; i < N; i++) this._prodOf(i, state, prod);
      const total = burn + perChain;
      for (let sweep = 0; sweep < total; sweep++) {
        this._sweep(state, G, prod, r, sweep);
        if (sweep >= burn) {
          samples.set(state, row * N);
          row++;
        }
      }
    }
    this.samples = samples;
    this.S = S;
    // 周辺分布
    const marg = new Float64Array(N * NS);
    for (let s = 0; s < S; s++) for (let i = 0; i < N; i++) marg[i * NS + samples[s * N + i]]++;
    for (let j = 0; j < marg.length; j++) marg[j] /= S;
    this.marg = marg;
    this._co = null; // 同時出現表は必要なときに作る
    this._dirty = false;
  }

  _modeOf(i) {
    const o = (2 * NG + 2) * NS;
    let best = 0;
    let bv = -Infinity;
    for (let k = 0; k < NS; k++) {
      const v = this.logPi[i][o + k] + this.logU[i * NS + k];
      if (v > bv) {
        bv = v;
        best = k;
      }
    }
    return best;
  }

  /** 5値の対数重みからサンプル */
  _draw5(l, r) {
    let m = -Infinity;
    for (let a = 0; a < l.length; a++) if (l[a] > m) m = l[a];
    let z = 0;
    const e = l.map((v) => {
      const x = Math.exp(v - m);
      z += x;
      return x;
    });
    let u = r.next() * z;
    let pick = 0;
    for (; pick < e.length - 1; pick++) {
      u -= e[pick];
      if (u <= 0) break;
    }
    return pick;
  }

  /**
   * 全単元を1回ずつ更新（順序は行きと帰りで入れ替える）。G, Gs は2回に1回更新。
   *  単元 i の条件付き分布：
   *    P(k_i | 前提) = π_i(k_i)·prod_i[k_i] / Z_i,   Z_i = Σ_k π_i(k)·prod_i[k]
   *  ギブスの条件（i の周り）：P(k_i | 前提)·U_i(k_i)·Π_{子c} P(k_c | c の前提)
   *  子 c の前提に i が含まれるので、i の値によって c の prod と Z_c が変わる。
   *  （確率の積のまま計算する。対数・指数は使わない）
   */
  _sweep(state, G, prod, r, sweepNo) {
    const N = this.N;
    const forward = sweepNo % 2 === 0;
    const edgeExp = this.edgeExp;
    const expU = this.expU;
    const w = [0, 0, 0, 0];
    for (let t = 0; t < N; t++) {
      const i = forward ? t : N - 1 - t;
      const ch = this.ch[i];
      const pe = this.piExp[i];
      const o = (G.g * NG + G.s[this.sidx[i]]) * NS;
      // 自分の条件付き確率（前提から）× 証拠
      let zi = 0;
      for (let k = 0; k < NS; k++) zi += pe[o + k] * prod[i * NS + k];
      for (let k = 0; k < NS; k++) w[k] = ((pe[o + k] * prod[i * NS + k]) / zi) * expU[i * NS + k];
      // 子ごとの P(k_c | c の前提)
      const si = state[i];
      for (let a = 0; a < ch.length; a++) {
        const c = ch[a];
        const pc = this.piExp[c];
        const oc = (G.g * NG + G.s[this.sidx[c]]) * NS;
        const kc0 = state[c];
        // c の前提のうち i の寄与を除いた重み
        let b0 = prod[c * NS] / edgeExp[si];
        let b1 = prod[c * NS + 1] / edgeExp[NS + si];
        let b2 = prod[c * NS + 2] / edgeExp[2 * NS + si];
        let b3 = prod[c * NS + 3] / edgeExp[3 * NS + si];
        b0 *= pc[oc];
        b1 *= pc[oc + 1];
        b2 *= pc[oc + 2];
        b3 *= pc[oc + 3];
        const bk = kc0 === 0 ? b0 : kc0 === 1 ? b1 : kc0 === 2 ? b2 : b3;
        for (let k = 0; k < NS; k++) {
          const zc = b0 * edgeExp[k] + b1 * edgeExp[NS + k] + b2 * edgeExp[2 * NS + k] + b3 * edgeExp[3 * NS + k];
          w[k] *= (bk * edgeExp[kc0 * NS + k]) / zc;
        }
      }
      const z = w[0] + w[1] + w[2] + w[3];
      let u = r.next() * z;
      let pick = 0;
      for (; pick < NS - 1; pick++) {
        u -= w[pick];
        if (u <= 0) break;
      }
      if (pick !== si) {
        state[i] = pick;
        for (let a = 0; a < ch.length; a++) this._prodOf(ch[a], state, prod);
      }
    }
    if (sweepNo % 2 !== 0) return;
    // G の更新：Π_i P(k_i | 前提, G, Gs)
    const gl = [];
    for (let gg = 0; gg < NG; gg++) {
      let v = this.logGw[gg];
      for (let i = 0; i < N; i++) v += this._logCond(i, gg, G.s[this.sidx[i]], state, prod);
      gl.push(v);
    }
    G.g = this._draw5(gl, r);
    // 領域ごとの Gs の更新（その領域の単元だけ見ればよい）
    for (let t = 0; t < this.NST; t++) {
      const sl = [];
      for (let gs = 0; gs < NG; gs++) {
        let v = this.logGsw[gs];
        for (let i = 0; i < N; i++) if (this.sidx[i] === t) v += this._logCond(i, G.g, gs, state, prod);
        sl.push(v);
      }
      G.s[t] = this._draw5(sl, r);
    }
  }

  /** log P(k_i | 前提の状態, G, Gs) */
  _logCond(i, gg, gs, state, prod) {
    const pe = this.piExp[i];
    const o = (gg * NG + gs) * NS;
    const zi = pe[o] * prod[i * NS] + pe[o + 1] * prod[i * NS + 1] + pe[o + 2] * prod[i * NS + 2] + pe[o + 3] * prod[i * NS + 3];
    return Math.log((pe[o + state[i]] * prod[i * NS + state[i]]) / zi);
  }

  // ── 推定値の読み出し ─────────────────────────────
  /** 単元 id の状態の分布 [未習, 基礎, 標準, 発展] */
  stateDist(id) {
    this.refresh();
    const i = this.idx[id];
    return [this.marg[i * NS], this.marg[i * NS + 1], this.marg[i * NS + 2], this.marg[i * NS + 3]];
  }
  /** 習熟している確率（標準以上） */
  pMaster(id) {
    this.refresh();
    const i = this.idx[id];
    return this.marg[i * NS + 2] + this.marg[i * NS + 3];
  }
  /** 「基礎以上」の確率（未習でない確率） */
  pBasic(id) {
    this.refresh();
    return 1 - this.marg[this.idx[id] * NS];
  }
  /** 期待される状態（0〜3の連続値） */
  meanState(id) {
    const d = this.stateDist(id);
    return d[1] + 2 * d[2] + 3 * d[3];
  }
  /** 難易度 level・形式 kind の問題を出したときの期待正答率 */
  expectedAcc(id, level, kind = "choice") {
    const d = this.stateDist(id);
    let s = 0;
    for (let k = 0; k < NS; k++) s += d[k] * pCorrect(k, level, kind, { params: this.P });
    return s;
  }

  /**
   * 単元の状態ラベル。
   *  mastered / gap / shaky … 直接測った単元
   *  infOk / infGap / unknown … 測っていない単元（他の結果からの推定）
   *  future … 測っていない、まだ習わない単元（学年より先・履修していない科目）。つまずきとは呼ばない
   */
  state(id) {
    const st = this.stat[id];
    const pm = this.pMaster(id);
    if (st.n === 0 && this.effStage(id) > this.grade) return "future";
    if (st.n > 0) {
      if (pm >= 0.75) return "mastered";
      if (pm <= 0.25) return "gap";
      return "shaky";
    }
    if (pm >= 0.8) return "infOk";
    if (pm <= 0.2) return "infGap";
    return "unknown";
  }

  // ── 時間経過 ────────────────────────────────────
  /** いまの時刻までの忘却を反映する（証拠を薄める） */
  decayTo(now) {
    const P = this.P;
    let changed = false;
    for (const id of this.order) {
      const st = this.stat[id];
      if (st.n === 0 || !st.tDecay) continue;
      const days = (now - st.tDecay) / 86400000;
      if (days < 1) continue;
      const f = Math.pow(0.5, days / P.forgetHalfLifeDays);
      const i = this.idx[id];
      for (let k = 0; k < NS; k++) this.logU[i * NS + k] *= f;
      st.tDecay = now;
      changed = true;
    }
    if (changed) this._dirty = true;
  }

  // ── テスト用：厳密な周辺分布（小さなグラフのみ） ─────
  /** 全状態を列挙して周辺分布を厳密に計算する。単元数 ≤ 6 程度でのみ使う */
  exactMarginals() {
    const N = this.N;
    if (N > 7) throw new Error("exactMarginals: グラフが大きすぎる");
    const total = Math.pow(NS, N);
    const marg = new Float64Array(N * NS);
    let Z = 0;
    const state = new Uint8Array(N);
    const gsCombos = Math.pow(NG, this.NST);
    for (let code = 0; code < total; code++) {
      let c = code;
      for (let i = 0; i < N; i++) {
        state[i] = c % NS;
        c = Math.floor(c / NS);
      }
      // 状態に依存する部分（証拠）
      let base = 0;
      for (let i = 0; i < N; i++) base += this.logU[i * NS + state[i]];
      // G, Gs をすべて足し上げる：Π_i P(k_i | 前提, G, Gs)
      let w = 0;
      for (let gg = 0; gg < NG; gg++) {
        for (let gcode = 0; gcode < gsCombos; gcode++) {
          const gsv = [];
          let gc = gcode;
          let lw = this.logGw[gg];
          for (let t = 0; t < this.NST; t++) {
            gsv.push(gc % NG);
            lw += this.logGsw[gc % NG];
            gc = Math.floor(gc / NG);
          }
          for (let i = 0; i < N; i++) {
            const o = (gg * NG + gsv[this.sidx[i]]) * NS;
            let zi = 0;
            let mine = 0;
            for (let k = 0; k < NS; k++) {
              let pr = 1;
              for (const q of this.pa[i]) pr *= this.edgeExp[k * NS + state[q]];
              const term = this.piExp[i][o + k] * pr;
              zi += term;
              if (k === state[i]) mine = term;
            }
            lw += Math.log(mine / zi);
          }
          w += Math.exp(lw + base);
        }
      }
      Z += w;
      for (let i = 0; i < N; i++) marg[i * NS + state[i]] += w;
    }
    for (let j = 0; j < marg.length; j++) marg[j] /= Z;
    return marg;
  }
}

/** 二値エントロピー（ビット） */
export function h2(p) {
  if (p <= 1e-9 || p >= 1 - 1e-9) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

/** 解答ログ（配列）からモデルを作り直す */
export function replay(log, opts = {}) {
  const L = new Learner(opts);
  for (const o of log) L.observe(o);
  return L;
}
