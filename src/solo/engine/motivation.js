// ============================================================
// motivation.js — 続けたくなる仕組み（XP・連続日数・今日の目標・バッジ・声かけ）
//
//  ゲームの派手さより「積み上げが見える」ことを大事にする。
//  さかのぼるのは後退じゃなく近道 ── 戻って直したことも、ちゃんと褒める。
// ============================================================
import { LEVEL_INFO } from "../content/index.js";

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** 1問正解したときの XP */
export function xpFor(level, { hinted = false, firstTry = true } = {}) {
  const base = LEVEL_INFO[level]?.xp || 10;
  return Math.round(base * (hinted ? 0.5 : 1) + (firstTry && !hinted ? 2 : 0));
}

/** 学習者レベル（XP から）。次のレベルまでの必要量も返す */
export function playerLevel(xp) {
  let lv = 1, need = 100, rest = xp;
  while (rest >= need) { rest -= need; lv += 1; need = Math.round(100 + (lv - 1) * 40); }
  return { lv, cur: rest, need };
}

/** 連続学習日数（今日 or 昨日まで続いていれば有効） */
export function streakDays(daily, now = new Date()) {
  let n = 0;
  const d = new Date(now);
  if (!daily[todayKey(d)]?.n) d.setDate(d.getDate() - 1); // 今日まだなら昨日から数える
  while (daily[todayKey(d)]?.n) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function bestStreak(daily) {
  const days = Object.keys(daily).filter((k) => daily[k]?.n).sort();
  let best = 0, cur = 0, prev = null;
  for (const k of days) {
    const t = new Date(k + "T00:00:00");
    cur = prev && (t - prev) / 86400000 === 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = t;
  }
  return best;
}

/** 直近 n 日の { key, n, c, xp, min } */
export function lastDays(daily, n = 14, now = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = todayKey(d);
    out.push({ key: k, label: `${d.getMonth() + 1}/${d.getDate()}`, dow: "日月火水木金土"[d.getDay()], ...(daily[k] || { n: 0, c: 0, xp: 0, sec: 0 }) });
  }
  return out;
}

// ── バッジ ─────────────────────────────────────────
export const BADGES = [
  { id: "first", icon: "🌱", name: "はじめの一歩", desc: "はじめて問題を解いた" },
  { id: "diag", icon: "🧭", name: "現在地がわかった", desc: "理解度診断を終えた" },
  { id: "streak3", icon: "🔥", name: "3日つづいた", desc: "3日連続で学習" },
  { id: "streak7", icon: "🔥", name: "1週間つづいた", desc: "7日連続で学習" },
  { id: "streak30", icon: "🌋", name: "30日つづいた", desc: "30日連続で学習" },
  { id: "q100", icon: "💯", name: "100問", desc: "合計100問を解いた" },
  { id: "q500", icon: "🏔", name: "500問", desc: "合計500問を解いた" },
  { id: "q1000", icon: "🗻", name: "1000問", desc: "合計1000問を解いた" },
  { id: "master1", icon: "🏅", name: "はじめての習得", desc: "単元を目標レベルまで習得" },
  { id: "master10", icon: "🎖", name: "習得10単元", desc: "10単元を目標レベルまで習得" },
  { id: "overcome", icon: "🌈", name: "つまずき克服", desc: "診断で見つかったつまずきを乗りこえた" },
  { id: "sakanobori", icon: "🧗", name: "さかのぼり名人", desc: "2学年以上前の単元にもどって習得（戻れるのは強さ）" },
  { id: "ouyou10", icon: "🚀", name: "応用チャレンジャー", desc: "応用レベル以上を10問正解" },
  { id: "nankan10", icon: "👑", name: "難関に挑む人", desc: "難関レベルを10問正解" },
  { id: "half", icon: "🎯", name: "目標の半分", desc: "目標までの道のりが50%に" },
];

/** 今の状態から獲得できるバッジ id の一覧 */
export function earnedBadges(state, { goalPct = 0 } = {}) {
  const got = [];
  const t = state.totals || {};
  const daily = state.daily || {};
  const st = Math.max(streakDays(daily), bestStreak(daily));
  if ((t.n || 0) >= 1) got.push("first");
  if (state.diag) got.push("diag");
  if (st >= 3) got.push("streak3");
  if (st >= 7) got.push("streak7");
  if (st >= 30) got.push("streak30");
  if ((t.n || 0) >= 100) got.push("q100");
  if ((t.n || 0) >= 500) got.push("q500");
  if ((t.n || 0) >= 1000) got.push("q1000");
  const reached = state.reached || {};
  const nReached = Object.keys(reached).length;
  if (nReached >= 1) got.push("master1");
  if (nReached >= 10) got.push("master10");
  if (Object.values(state.units || {}).some((us) => us.overcame)) got.push("overcome");
  if (Object.values(state.units || {}).some((us) => us.climbed)) got.push("sakanobori");
  if ((t.hi3 || 0) >= 10) got.push("ouyou10");
  if ((t.hi4 || 0) >= 10) got.push("nankan10");
  if (goalPct >= 50) got.push("half");
  return got;
}

// ── 声かけ ─────────────────────────────────────────
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

export function greeting(name, now = new Date()) {
  const h = now.getHours();
  const who = name ? `${name}さん、` : "";
  if (h < 10) return `${who}おはよう。朝の1問は、1日のエンジンになるよ。`;
  if (h < 17) return `${who}こんにちは。今日も一歩ずつ、積み上げていこう。`;
  if (h < 21) return `${who}おつかれさま。少しだけでも、今日の分をやっておこう。`;
  return `${who}夜おそくまでえらいね。短く集中して、早めに休もう。`;
}

export const CHEER = {
  correct: ["いいね！", "その調子！", "正解！", "ばっちり！", "考え方がいいね！", "ナイス！"],
  wrong: ["おしい！解説を見てみよう", "大丈夫、ここが伸びしろ", "まちがいは次の正解のもと", "一緒に確かめよう"],
  streak: ["連続正解！", "波に乗ってるね！", "止まらない！"],
  levelUp: ["一段上のレベルに進もう！", "レベルアップ！難しくなるよ"],
  levelDown: ["一段もどって、確実に。戻れるのは強さだよ"],
  sakanobori: [
    "さかのぼるのは後退じゃなくて、近道。",
    "土台が固まると、上の単元は驚くほど楽になるよ。",
    "わからないところまで戻れる人は、必ず伸びる。",
  ],
};
export const cheer = (kind) => pickOne(CHEER[kind] || CHEER.correct);
