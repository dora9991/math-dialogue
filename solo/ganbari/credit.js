// credit.js — 動画を見ていた時間を、コツコツくんの「学習時間」（state.daily[今日].sec）に足す
//
// アプリ本体の時間の仕組み（kotsu-time-credit-v1）と同じ上限の入れ物を使う：
//   localStorage "kotsu-time-credit-v1" = { d:"YYYY-MM-DD", s:{ les, tst, nav, ref, fb, vid: 秒 }, at:最後に数えた時刻(ms), v:{問番号:秒} }
//   ・動画（vid）は1日 40分まで。アプリ全体の1日 90分の上限にも含まれる。
//   ・「同じ時刻は1回だけ」：at より前の時間は数えない（アプリの別のタブと二重にならない）。
//   ・1つの動画は、1日に、動画の長さの2倍まで（くり返し見ても、稼げない）。
//   ・数えるのは、画面が見えていて、動画が再生中か、最後の操作から45秒以内のあいだだけ。
// 解いた問題数（daily.n）や経験値には、触らない（時間だけ）。
export const CAP_VID = 2400, CAP_ALL = 5400, IDLE_MS = 45000;
const STATE_KEY = "mathlab-solo-v1", CREDIT_KEY = "kotsu-time-credit-v1";
const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const readJSON = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const r3 = (x) => Math.round(x * 1000) / 1000;
let mem = null;

// from〜to（ms）のうち、数えてよい長さ（ms）を返し、記録する
export function grant(from, to, n, limitSec) {
  const day = ymd();
  let r = readJSON(CREDIT_KEY);
  if (!r || typeof r !== "object") r = mem;
  if (!r || r.d !== day || !r.s || typeof r.s !== "object") r = { d: day, s: {}, at: 0 };
  const avail = to - Math.max(from, Number(r.at) || 0);
  if (avail <= 0) return 0;
  const used = Number(r.s.vid) || 0;
  const all = Object.values(r.s).reduce((a, b) => a + (Number(b) || 0), 0);
  if (!r.v || typeof r.v !== "object") r.v = {};
  const pv = Number(r.v[n]) || 0;
  const ms = Math.max(0, Math.min(avail, (CAP_VID - used) * 1000, (CAP_ALL - all) * 1000, (limitSec - pv) * 1000));
  if (ms > 0) {
    r.s.vid = r3(used + ms / 1000);
    r.v[n] = r3(pv + ms / 1000);
    r.at = to;
    mem = r;
    try { localStorage.setItem(CREDIT_KEY, JSON.stringify(r)); } catch {}
  }
  return ms;
}

// 学習の記録（state）の「きょうの学習時間」に、秒を足す。ログインしていない・記録がないときは何もしない
export function addToday(sec) {
  sec = Math.round(sec);
  if (!(sec > 0)) return false;
  const st = readJSON(STATE_KEY);
  if (!st || st.v !== 1 || !st.profile || !st.daily || typeof st.daily !== "object") return false;
  const day = ymd(), cur = st.daily[day] || { n: 0, c: 0, xp: 0, sec: 0 };
  st.daily = { ...st.daily, [day]: { ...cur, sec: (Number(cur.sec) || 0) + sec } };
  try { localStorage.setItem(STATE_KEY, JSON.stringify(st)); return true; } catch { return false; }
}
export function todaySec() {
  const st = readJSON(STATE_KEY);
  return Math.round(Number(st && st.daily && st.daily[ymd()] && st.daily[ymd()].sec) || 0);
}
export const hasRecord = () => { const st = readJSON(STATE_KEY); return !!(st && st.v === 1 && st.profile); };
export function fmtMin(s) {
  s = Math.max(0, Math.floor(s));
  if (s < 60) return s ? "1分未満" : "0分";
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}分` : `${Math.floor(m / 60)}時間${m % 60}分`;
}

// 見ている時間の計測（app.js から使う）
export function createWatcher({ getPlayer, getProblem, onChange }) {
  let last = Date.now(), touch = 0, pendingMs = 0, lastFlush = Date.now();
  const touchEv = ["pointerdown", "keydown", "scroll", "touchstart"];
  const onTouch = () => { touch = Date.now(); };
  const flush = () => {
    const sec = Math.floor(pendingMs / 1000);
    if (sec > 0) { pendingMs -= sec * 1000; addToday(sec); onChange && onChange(); }
    lastFlush = Date.now();
  };
  const tick = () => {
    const now = Date.now(), dt = Math.min(2500, Math.max(0, now - last));
    last = now;
    const pl = getPlayer(), pr = getProblem();
    if (document.hidden || !dt || !pl || !pr) return;
    if (!(pl.playing || now - touch < IDLE_MS)) return;
    pendingMs += grant(now - dt, now, pr.n, pr.limitSec);
    if (now - lastFlush >= 30000) flush();
  };
  const timer = setInterval(tick, 1000);
  touchEv.forEach((e) => window.addEventListener(e, onTouch, { capture: true, passive: true }));
  const hide = () => { last = Date.now(); if (document.hidden) flush(); };
  document.addEventListener("visibilitychange", hide);
  window.addEventListener("pagehide", flush);
  return { flush, stop() { clearInterval(timer); touchEv.forEach((e) => window.removeEventListener(e, onTouch, { capture: true })); document.removeEventListener("visibilitychange", hide); window.removeEventListener("pagehide", flush); flush(); } };
}
