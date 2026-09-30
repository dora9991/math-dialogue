// ============================================================
// store.js — 端末への保存（localStorage）と、書き出し・読み込み
//
//  ■ 保存するもの
//    profile  … { name, grade, createdAt }
//    log      … 解答ログ（追加するだけ）。学習者モデルはここから毎回作り直す
//               { type:"answer", t, mode:"diag"|"practice", uid, skillId, level, kind, ok, skipped, mc, given, ms }
//               { type:"start",  t, mode }               … 診断・演習の開始位置の印
//    concerns … 「気になる」の記録（問題の uid で同じ問題を再現できる）
//
//  ■ 方針
//   ・サーバーには何も送らない。データはこの端末のブラウザの中だけ。
//   ・保存できない環境（プライベートモードなど）でも動く：その場合は画面を閉じると消えるので、
//     「書き出し」で保存するよう案内する（available=false で判定できる）。
//   ・書き出しの JSON は、そのまま別の端末に読み込める。
// ============================================================
import { Learner } from "./model.js";

const KEY = "tsumazuki-navi:v1";
export const FORMAT_VERSION = 1;

/** 練習中の解答は、力が伸びるので過去の証拠を少し割り引く */
export const DISCOUNT = { diag: 1, practice: 0.85 };

function tryStorage() {
  try {
    const s = globalThis.localStorage;
    const probe = "__probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export class Store {
  /** @param storage localStorage 互換（テストでは差し替える）。null なら保存なし */
  constructor(storage = tryStorage()) {
    this.storage = storage;
    this.available = !!storage;
    this.data = { version: FORMAT_VERSION, profile: null, log: [], concerns: [] };
    this._load();
  }

  _load() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      this.data = normalize(d);
    } catch {
      // 壊れたデータは読み捨てる（元の文字列は別のキーに退避しておく）
      try {
        this.storage.setItem(`${KEY}:broken:${Date.now()}`, this.storage.getItem(KEY) || "");
        this.storage.removeItem(KEY);
      } catch {
        /* 退避できなくてもよい */
      }
    }
  }

  save() {
    if (!this.storage) return false;
    try {
      this.storage.setItem(KEY, JSON.stringify(this.data));
      return true;
    } catch {
      this.available = false; // 容量不足など
      return false;
    }
  }

  get profile() {
    return this.data.profile;
  }
  get log() {
    return this.data.log;
  }
  get concerns() {
    return this.data.concerns;
  }

  setProfile(p) {
    this.data.profile = { name: "", createdAt: Date.now(), ...(this.data.profile || {}), ...p };
    this.save();
  }

  /** 解答ログに追加して保存 */
  append(ev) {
    this.data.log.push(ev);
    this.save();
  }

  addConcern(c) {
    const item = { id: `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`, at: Date.now(), status: "open", reasons: [], memo: "", ...c };
    this.data.concerns.unshift(item);
    this.save();
    return item;
  }
  updateConcern(id, patch) {
    const c = this.data.concerns.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
    this.save();
    return c;
  }
  removeConcern(id) {
    this.data.concerns = this.data.concerns.filter((x) => x.id !== id);
    this.save();
  }

  /** すべて消す（学習の記録・気になる・プロフィール） */
  reset() {
    this.data = { version: FORMAT_VERSION, profile: null, log: [], concerns: [] };
    if (this.storage) {
      try {
        this.storage.removeItem(KEY);
      } catch {
        /* 何もしない */
      }
    }
  }

  /** 書き出し用のオブジェクト */
  exportData() {
    return { app: "tsumazuki-navi", exportedAt: new Date().toISOString(), ...this.data };
  }

  /** 読み込み（既存のデータは置きかえる）。形が違えば例外 */
  importData(obj) {
    if (!obj || typeof obj !== "object" || !Array.isArray(obj.log)) throw new Error("このファイルは読み込めません（形式がちがいます）");
    this.data = normalize(obj);
    this.save();
  }
}

/** 読み込んだデータを、想定した形に整える（足りない項目を補い、不正な行を捨てる） */
export function normalize(d) {
  const log = (Array.isArray(d.log) ? d.log : []).filter((e) => e && typeof e === "object" && (e.type === "start" || (e.type === "answer" && typeof e.skillId === "string" && [1, 2, 3].includes(e.level))));
  const concerns = (Array.isArray(d.concerns) ? d.concerns : []).filter((c) => c && typeof c === "object" && typeof c.id === "string");
  const p = d.profile && typeof d.profile === "object" ? d.profile : null;
  return { version: FORMAT_VERSION, profile: p ? { name: String(p.name || ""), grade: Number(p.grade) || 8, createdAt: Number(p.createdAt) || Date.now() } : null, log, concerns };
}

/** 解答ログから学習者モデルを作り直す（診断と演習で証拠の割り引きを変える） */
export function rebuildLearner(log, grade, opts = {}) {
  const L = new Learner({ grade, ...opts });
  for (const e of log) {
    if (e.type !== "answer") continue;
    L.P.discount = DISCOUNT[e.mode] ?? 1;
    L.observe({ skillId: e.skillId, level: e.level, ok: !!e.ok, skipped: !!e.skipped, kind: e.kind, mc: e.mc || null, t: e.t });
  }
  L.P.discount = DISCOUNT.practice;
  return L;
}

/** 最後の「開始」印より後の解答だけ（診断・演習のいまの回） */
export function currentRound(log, mode) {
  let from = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].type === "start" && log[i].mode === mode) {
      from = i + 1;
      break;
    }
  }
  return log.slice(from).filter((e) => e.type === "answer" && e.mode === mode);
}
