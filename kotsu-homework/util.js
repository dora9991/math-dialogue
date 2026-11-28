// util.js — 文字・日付（日本時間）・単元の名前などの小さな道具
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ── 日付：すべて日本時間（Asia/Tokyo）。「YYYY-MM-DD」の文字で持つ ──
const JST = 9 * 3600e3, DAY = 86400000;
export const ymdJST = (ms = Date.now()) => new Date(ms + JST).toISOString().slice(0, 10);
export const ymdMs = (ymd) => { const [y, m, d] = ymd.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const addDays = (ymd, n) => new Date(ymdMs(ymd) + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a, b) => Math.round((ymdMs(a) - ymdMs(b)) / DAY);   // a - b（日）
export const validYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !isNaN(ymdMs(s)) && new Date(ymdMs(s)).toISOString().slice(0, 10) === s;
const WD = ["日", "月", "火", "水", "木", "金", "土"];
export const wday = (ymd) => WD[new Date(ymdMs(ymd)).getUTCDay()];
export const md = (ymd) => { const [, m, d] = ymd.split("-").map(Number); return `${m}/${d}`; };
export const mdw = (ymd) => `${md(ymd)}（${wday(ymd)}）`;
export function fmtPeriod(start, due, today) {
  const y = (s) => (s.slice(0, 4) === today.slice(0, 4) ? md(s) : `${s.slice(0, 4)}/${md(s)}`);
  return start === due ? `${y(start)} の1日` : `${y(start)}〜${y(due)}`;
}
// 期間の段階：upcoming（これから）／active（期間中）／ended（期限をすぎた）
export const phaseOf = (hw, today) => (today < hw.start_date ? "upcoming" : today > hw.due_date ? "ended" : "active");
export function leftText(hw, today) {
  const ph = phaseOf(hw, today);
  if (ph === "upcoming") { const d = diffDays(hw.start_date, today); return d === 1 ? "あす から" : `${d}日後から`; }
  if (ph === "ended") { const d = diffDays(today, hw.due_date); return d === 1 ? "きのう 終わり" : `${d}日前に終わり`; }
  const d = diffDays(hw.due_date, today);
  return d === 0 ? "きょうまで" : d === 1 ? "あす まで" : `あと${d}日`;
}

// ── 時間・数 ──
export const fmtMin = (sec) => { const s = Math.max(0, Number(sec) || 0); const m = Math.round(s / 60); return s > 0 && m === 0 ? "1分未満" : `${m}分`; };
export const pct100 = (p) => `${Math.round((Number(p) || 0) * 100)}%`;
export const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));

// ── 小単元（units.json）──
let UNITS = null, UNIT_MAP = new Map();
export async function loadUnits() {
  if (UNITS) return UNITS;
  const r = await fetch("units.json", { cache: "no-cache" });
  if (!r.ok) throw new Error(`units.json ${r.status}`);
  UNITS = await r.json();
  UNIT_MAP = new Map();
  for (const g of UNITS.grades) for (const c of g.chapters) for (const u of c.units) UNIT_MAP.set(u.id, { id: u.id, name: u.name, grade: g.id, gradeName: g.name, chapter: c.name });
  return UNITS;
}
export const unitInfo = (id) => UNIT_MAP.get(id) || null;
export const unitName = (id, fallback) => (id ? (UNIT_MAP.get(id) || {}).name || fallback || id : "");

// ── 宿題の文 ──
export const condText = (hw) => {
  const parts = [];
  if (hw.unit_id && hw.n != null) parts.push(`${hw.unit_name || unitName(hw.unit_id)} ${hw.n}問`);
  if (hw.min != null) parts.push(`${hw.min}分`);
  return parts.join("・");
};
// 題が空のときの自動の題：「単元名 N問」「M分 学習」（両方なら「単元名 N問・M分」）
export function autoTitle({ unitName: un, n, min }) {
  const a = un && n ? `${un} ${n}問` : "";
  const b = min ? `${min}分` : "";
  return a && b ? `${a}・${b}` : a || (b ? `${b} 学習` : "");
}
export const shortTitle = (t, n = 7) => { const a = [...String(t || "")]; return a.length > n ? a.slice(0, n).join("") + "…" : a.join(""); };

// ── 進み具合の見せ方（達成＝緑・一部＝黄・まだ＝赤・期間前＝白）──
export const ST_LABEL = { done: "達成", partial: "一部", none: "まだ", upcoming: "これから", na: "対象外" };
export const ST_MARK = { done: "○", partial: "△", none: "×", upcoming: "", na: "–" };
// 宿題 hw の、ある生徒の状態を、色の種類にする（期間前は status に関係なく upcoming）
export const cellKind = (hw, status, today) => (phaseOf(hw, today) === "upcoming" ? "upcoming" : status === "done" || status === "partial" || status === "none" ? status : "none");
