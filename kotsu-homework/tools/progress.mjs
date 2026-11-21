// 宿題の進み具合の「基準の実装」。日本時間。HW-CONTRACT.md の 3. と同じ。
const JST = 9 * 3600e3, DAY = 86400000;
export const ymdJST = (ms) => new Date(ms + JST).toISOString().slice(0, 10);
const ymdMs = (ymd) => { const [y, m, d] = ymd.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export function windowMs(start, due) {
  return [ymdMs(start) - JST, ymdMs(due) - JST + DAY - 1];
}
export function progress(hw, state, nowMs) {
  const [s, e] = windowMs(hw.start_date, hw.due_date);
  const log = (state && Array.isArray(state.log) && state.log) || [];
  const daily = (state && state.daily) || {};
  const inWin = hw.unit_id ? log.filter((x) => x && x.u === hw.unit_id && x.t >= s && x.t <= e) : [];
  const count = inWin.length, correct = inWin.filter((x) => x.ok).length;
  const days = [];
  for (let t = ymdMs(hw.start_date); t <= ymdMs(hw.due_date); t += DAY) days.push(new Date(t).toISOString().slice(0, 10));
  const secByDay = days.map((d) => Math.max(0, Number(daily[d] && daily[d].sec) || 0));
  const sec = secByDay.reduce((a, b) => a + b, 0);
  const hasN = hw.n != null, hasM = hw.min != null;
  const parts = [];
  if (hasN) parts.push(Math.min(1, count / hw.n));
  if (hasM) parts.push(Math.min(1, sec / (hw.min * 60)));
  const pct = parts.length ? Math.min(...parts) : 0;
  const done = parts.length > 0 && (!hasN || count >= hw.n) && (!hasM || sec >= hw.min * 60);
  let doneAt = null;
  if (done) {
    const ds = [];
    if (hasN) ds.push(ymdJST([...inWin].sort((a, b) => a.t - b.t)[hw.n - 1].t));
    if (hasM) { let acc = 0; for (let i = 0; i < days.length; i++) { acc += secByDay[i]; if (acc >= hw.min * 60) { ds.push(days[i]); break; } } }
    doneAt = ds.sort()[ds.length - 1];
  }
  const status = done ? "done" : pct > 0 ? "partial" : "none";
  const phase = nowMs < s ? "upcoming" : nowMs > e ? "ended" : "active";
  return { count, correct, sec, pct: Math.round(pct * 1000) / 1000, done, doneAt, status, phase };
}
