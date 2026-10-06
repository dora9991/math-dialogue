'use strict';
/* ============================================================
   rollback.js — ロールバック同期（通信・画面に依存しない純粋なロジック）

   考え方
   ・毎フレーム「自分の入力」だけを相手に送る（直近の入力をまとめて送るので、1つ落ちても平気）
   ・相手の入力がまだ届いていないフレームは「さっきと同じ入力」と予想して先に進む
   ・本物の入力が届いて予想が外れていたら、そのフレームまで状態を巻き戻して、やり直す
   ・シミュレーションは整数だけで決定論なので、両者のやり直し結果は必ず一致する
   ・60フレームごとに状態のハッシュを交換して、ズレ（desync）が起きていないか確かめる
   ============================================================ */
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

class RollbackSession {
  /* cfg: createMatch に渡す設定  me: 自分の番号(0=ホスト/左, 1=ゲスト/右) */
  constructor(cfg, me, o) {
    o = o || {};
    this.me = me;
    this.D = o.delay === undefined ? 2 : o.delay;      // 入力を何フレーム遅らせるか（予想はずれを減らす）
    this.maxPred = o.maxPred || 10;                    // 予想だけで先に進める最大フレーム数
    this.seed = cfg.seed;                              // 試合ID（再戦のとき、前の試合のパケットを見分ける）
    this.m = createMatch(cfg);
    this.frame = 0;
    this.localIn = []; this.remoteIn = []; this.used = [];
    this.snaps = new Map();
    for (let f = 0; f < this.D; f++) { this.localIn[f] = 0; this.remoteIn[f] = 0; }   // 開始直後は両者ニュートラル
    this.remoteKnown = this.D - 1;                     // 連続して分かっている相手入力の最後のフレーム
    this.remoteAck = this.D - 1;                       // 相手が受け取ったと伝えてきた、自分の入力の最後のフレーム
    this.verified = 0;                                 // ここより前は「予想なし」で確定済み
    this.evSig = new Map();
    this.stats = { rollbacks: 0, maxDepth: 0, stalls: 0, frames: 0 };
    this.myHash = new Map(); this.theirHash = new Map(); this.nextHash = 60; this.outSums = []; this.desync = -1;
  }

  /* 相手へ送るパケット（まだ確認されていない入力をまとめて） */
  packet() {
    const to = this.localIn.length - 1;
    const start = Math.max(this.remoteAck + 1, to - 30);
    const d = [];
    for (let f = start; f <= to; f++) d.push(this.localIn[f]);
    return { t: 'in', s: this.seed, f: start, d, a: this.remoteKnown };
  }
  takeSums() { const s = this.outSums; this.outSums = []; return s; }

  receive(p) {
    for (let i = 0; i < p.d.length; i++) {
      const fr = p.f + i;
      if (this.remoteIn[fr] === undefined) this.remoteIn[fr] = p.d[i];
    }
    while (this.remoteIn[this.remoteKnown + 1] !== undefined) this.remoteKnown++;
    if (p.a > this.remoteAck) this.remoteAck = p.a;
  }
  receiveSum(f, h) { this.theirHash.set(f, h); this._compare(f); }
  _compare(f) {
    if (this.myHash.has(f) && this.theirHash.has(f) && this.myHash.get(f) !== this.theirHash.get(f) && this.desync < 0) this.desync = f;
  }

  _predict() { return this.remoteKnown >= 0 ? this.remoteIn[this.remoteKnown] : 0; }

  /* 1フレームぶんシミュレーションする（collect に画面向けイベントを積む） */
  _sim(collect) {
    const f = this.frame;
    const mine = this.localIn[f];
    let theirs = this.remoteIn[f];
    if (theirs === undefined) theirs = this._predict();
    const in0 = this.me === 0 ? mine : theirs, in1 = this.me === 0 ? theirs : mine;
    const m = this.m;
    m.events.length = 0;
    this.snaps.set(f, JSON.stringify(m));
    this.used[f] = [in0, in1];
    stepMatch(m, in0, in1);
    // やり直しで同じ出来事を2回鳴らさない（種類＋場所で見分ける）
    let sigs = this.evSig.get(f);
    if (!sigs) { sigs = new Set(); this.evSig.set(f, sigs); }
    for (const e of m.events) {
      const sg = e.t + '|' + (e.n !== undefined ? e.n : e.i !== undefined ? e.i : '') + '|' + ((e.x || 0) >> 11);
      if (!sigs.has(sg)) { sigs.add(sg); collect.push(e); }
    }
    m.events.length = 0;
    this.frame = m.frame;
  }

  /* 毎tick（60Hz）に1回呼ぶ。mask = 今の自分の入力。 */
  tick(mask) {
    const out = { events: [], stalled: false, rolled: 0 };
    const other = this.me === 0 ? 1 : 0;
    // 1) 答え合わせ。予想が外れていたら、その時点まで巻き戻してやり直す
    let mis = -1;
    while (this.verified < this.frame && this.remoteIn[this.verified] !== undefined) {
      if (this.used[this.verified][other] !== this.remoteIn[this.verified]) { mis = this.verified; break; }
      this.verified++;
    }
    if (mis >= 0) {
      const target = this.frame;
      this.m = JSON.parse(this.snaps.get(mis));
      this.frame = mis;
      while (this.frame < target) this._sim(out.events);
      this.stats.rollbacks++;
      out.rolled = target - mis;
      if (out.rolled > this.stats.maxDepth) this.stats.maxDepth = out.rolled;
      while (this.verified < this.frame && this.remoteIn[this.verified] !== undefined) this.verified++;
    }
    // 2) ハッシュ交換（確定したフレームの状態が一致しているか）
    while (this.nextHash <= this.verified && this.snaps.has(this.nextHash)) {
      const h = hashStr(this.snaps.get(this.nextHash));
      this.myHash.set(this.nextHash, h);
      this.outSums.push({ t: 'sum', s: this.seed, f: this.nextHash, h });
      this._compare(this.nextHash);
      this.nextHash += 60;
    }
    // 3) 予想だけで先に進みすぎないよう、相手を待つ
    if (this.frame > this.remoteKnown + this.maxPred) { out.stalled = true; this.stats.stalls++; this._prune(); return out; }
    // 4) 自分の入力を D フレーム先のぶんとして予約し、1フレーム進める
    const lf = this.frame + this.D;
    if (this.localIn[lf] === undefined) this.localIn[lf] = mask;
    this._sim(out.events);
    this.stats.frames++;
    this._prune();
    return out;
  }

  _prune() {
    const keep = Math.min(this.verified - 1, this.nextHash - 1);
    for (const k of this.snaps.keys()) { if (k < keep) this.snaps.delete(k); else break; }
    for (const k of this.evSig.keys()) { if (k < this.frame - 90) this.evSig.delete(k); else break; }
  }
}
