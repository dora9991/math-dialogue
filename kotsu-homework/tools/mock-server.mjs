// 模擬のサーバー：HW-CONTRACT.md の RPC（hw_t_*）と、先生の画面の既存の RPC（t_home・t_class）を、メモリの上で動かす。
// 進み具合は、生徒の state（log・daily）から tools/progress.mjs（基準の実装）で計算する。
// PostgREST と同じく、引数の名前がちがえば 404（PGRST202）、必須の引数がなければ 404。アプリのエラーは 200 で {error:"…"}。
//
// 手で見るとき：  node tools/mock-server.mjs [--port 54474]
//   → http://127.0.0.1:54474/__login?as=t1 をひらくと、先生（t1）でログインした状態で、このページがひらく。
// テストでは：  import { createMock } from "./mock-server.mjs"
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { progress, ymdJST } from "./progress.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const DAY = 86400000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (s) => typeof s === "string" && DATE_RE.test(s) && !isNaN(Date.parse(s + "T00:00:00Z")) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
export const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// 関数の引数（PostgREST は、名前の合う関数だけを呼べる）。req＝必須、opt＝省略できる（default あり）
const SIG = {
  t_home: { req: ["p_token"], opt: [] },
  t_class: { req: ["p_token", "p_class"], opt: [] },
  hw_t_create: { req: ["p_token", "p_class", "p_users", "p_title", "p_unit", "p_n", "p_min", "p_start", "p_due", "p_note"], opt: [] },
  hw_t_list: { req: ["p_token"], opt: ["p_class", "p_limit"] },
  hw_t_detail: { req: ["p_token", "p_id"], opt: [] },
  hw_t_grid: { req: ["p_token", "p_class"], opt: ["p_from", "p_to", "p_limit"] },
  hw_t_close: { req: ["p_token", "p_id"], opt: ["p_closed"] },
  hw_t_delete: { req: ["p_token", "p_id"], opt: [] },
};

class AppError extends Error { constructor(code) { super(code); this.code = code; } }
class HttpError extends Error { constructor(status, body) { super(body.message || String(status)); this.status = status; this.body = body; } }

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function createMock({ now = () => Date.now(), units = null } = {}) {
  let clock = now;
  const mock = { calls: [], latency: 0, failures: new Map(), db: null, setNow(ms) { clock = typeof ms === "function" ? ms : () => ms; }, now: () => clock() };
  let unitIds = null;
  try { const u = units || JSON.parse(readFileSync(join(root, "units.json"), "utf8")); unitIds = new Map(); for (const g of u.grades) for (const c of g.chapters) for (const x of c.units) unitIds.set(x.id, x.name); } catch { /* units.json なしでも動く */ }

  const reset = () => {
    mock.db = {
      orgs: new Map([["org-a", { code: "MOCK01", name: "模擬中学校" }], ["org-b", { code: "OTHER2", name: "ほかの学校" }]]),
      staff: new Map(),      // token → {id, login, nick, role, org, classIds}
      classes: new Map(),    // id → {id, org, name, teacherIds:[], studentIds:[]}
      students: new Map(),   // id → {id, org, classId, no, nick, login, state}
      hws: new Map(),        // id → hw
      seq: 1,
    };
    mock.calls.length = 0; mock.failures.clear(); mock.latency = 0;
  };
  mock.reset = reset; reset();
  const db = () => mock.db;
  const nextId = () => uuid(0x100000 + db().seq++);

  // ── データを作る道具 ──
  mock.addStaff = (token, { id = nextId(), login, nick, role = "teacher", org = "org-a", classIds = [] }) => { db().staff.set(token, { id, login: login || token, nick: nick || login || token, role, org, classIds: [...classIds] }); return db().staff.get(token); };
  mock.addClass = ({ id = nextId(), org = "org-a", name }) => { db().classes.set(id, { id, org, name, studentIds: [] }); return db().classes.get(id); };
  mock.addStudent = ({ id = nextId(), classId, no, nick, login, state = { log: [], daily: {} } }) => {
    const c = db().classes.get(classId);
    const s = { id, org: c.org, classId, no, nick, login: login || `s${String(no).padStart(2, "0")}`, state };
    db().students.set(id, s); c.studentIds.push(id); return s;
  };
  mock.expire = (token) => { db().staff.delete(token); };
  // 先生が担当するクラスをはずす（出そうとすると forbidden になる）
  mock.revokeClass = (token, classId) => { const u = db().staff.get(token); if (u) u.classIds = u.classIds.filter((x) => x !== classId); };
  mock.fail = (name, result, times = 1) => { mock.failures.set(name, { result, times }); };

  // 宿題を直接入れる（テストの準備用。RPC を通さないので、検証をしない）。outcome(s, i) → "done"|"partial"|"none"|"skip" で、生徒の記録も作る
  mock.addHomework = (h, { outcome = null, seed = 1, createdBy = null } = {}) => {
    const hw = { id: h.id || nextId(), org_id: h.org || "org-a", class_id: h.class_id ?? null, user_ids: h.user_ids ?? null, title: h.title, unit_id: h.unit_id ?? null, n: h.n ?? null, min: h.min ?? null, start_date: h.start_date, due_date: h.due_date, note: h.note ?? null, created_by: createdBy || h.created_by || "t1", created_at: h.created_at || new Date(clock()).toISOString(), closed: !!h.closed };
    db().hws.set(hw.id, hw);
    if (outcome) {
      const r = rng(seed);
      targets(hw).forEach((s, i) => { const o = typeof outcome === "function" ? outcome(s, i, r) : outcome; if (o && o !== "skip") giveProgress(hw, s, o, r); });
    }
    return hw;
  };
  // 生徒に、宿題の期間のなかの学習の記録を足す（期間が未来なら、何もしない）
  function giveProgress(hw, s, outcome, r) {
    const [ws, we] = [Date.parse(hw.start_date + "T00:00:00+09:00"), Date.parse(hw.due_date + "T23:59:59.999+09:00")];
    const lo = ws, hi = Math.min(we, clock() - 1000);
    if (hi <= lo) return;
    const st = s.state; st.log = st.log || []; st.daily = st.daily || {};
    const frac = outcome === "done" ? 1 : outcome === "partial" ? 0.3 + r() * 0.4 : 0;
    if (frac === 0) return;
    if (hw.unit_id && hw.n != null) {
      const cnt = outcome === "done" ? hw.n + Math.floor(r() * 3) : Math.max(1, Math.min(hw.n - 1, Math.floor(hw.n * frac)));
      for (let k = 0; k < cnt; k++) st.log.push({ t: Math.floor(lo + r() * (hi - lo)), u: hw.unit_id, L: 1, ok: r() < 0.8, h: false, d: 10 });
      st.log.sort((a, b) => b.t - a.t);
    }
    // 学習時間：宿題が時間つきなら、その割合。n だけの宿題でも、解いた分の時間を足す
    const secTarget = hw.min != null ? hw.min * 60 : (hw.n || 0) * 20;
    const secTotal = outcome === "done" ? secTarget + 60 : Math.floor(secTarget * frac);
    const days = []; for (let t = Date.parse(hw.start_date + "T00:00:00Z"); t <= Date.parse(hw.due_date + "T00:00:00Z"); t += DAY) { const d = new Date(t).toISOString().slice(0, 10); if (Date.parse(d + "T00:00:00+09:00") <= clock()) days.push(d); }
    if (days.length && secTotal > 0) { const per = Math.ceil(secTotal / days.length); let left = secTotal; for (const d of days) { const x = Math.min(per, left); left -= x; if (x > 0) st.daily[d] = { ...(st.daily[d] || {}), n: 1, c: 1, xp: 0, sec: ((st.daily[d] && st.daily[d].sec) || 0) + x }; } }
  }

  // ── 権限 ──
  const staffOf = (token) => { const u = db().staff.get(token); if (!u) throw new AppError("auth"); return u; };
  const canClass = (u, classId) => { const c = db().classes.get(classId); return !!c && c.org === u.org && (u.role === "admin" || u.classIds.includes(classId)); };
  const targets = (hw) => hw.class_id ? db().classes.get(hw.class_id).studentIds.map((id) => db().students.get(id)) : (hw.user_ids || []).map((id) => db().students.get(id)).filter(Boolean);
  const canHw = (u, hw) => hw.org_id === u.org && (hw.class_id ? canClass(u, hw.class_id) : targets(hw).some((s) => canClass(u, s.classId)));
  const needClass = (u, id) => { if (!UUID_RE.test(String(id))) throw new HttpError(400, { code: "22P02", message: `invalid input syntax for type uuid: "${id}"` }); const c = db().classes.get(id); if (!c) throw new AppError("not_found"); if (!canClass(u, id)) throw new AppError("forbidden"); return c; };
  const needHw = (u, id) => { if (!UUID_RE.test(String(id))) throw new HttpError(400, { code: "22P02", message: `invalid input syntax for type uuid: "${id}"` }); const hw = db().hws.get(id); if (!hw) throw new AppError("not_found"); if (!canHw(u, hw)) throw new AppError("forbidden"); return hw; };

  // ── 進み具合 ──
  const rowOf = (hw, s) => { const p = progress(hw, s.state, clock()); return { id: s.id, no: s.no, nick: s.nick, login: s.login, count: p.count, correct: p.correct, sec: p.sec, pct: p.pct, status: p.status, done_at: p.doneAt, phase: p.phase }; };
  const hwOut = (hw, withCounts = true) => {
    const cls = hw.class_id ? db().classes.get(hw.class_id) : null;
    const o = { id: hw.id, title: hw.title, class_id: hw.class_id, class_name: cls ? cls.name : null, user_ids: hw.user_ids, unit_id: hw.unit_id, unit_name: hw.unit_id && unitIds ? unitIds.get(hw.unit_id) : null, n: hw.n, min: hw.min, start_date: hw.start_date, due_date: hw.due_date, note: hw.note, created_at: hw.created_at, closed: hw.closed };
    if (withCounts) {
      const rows = targets(hw).map((s) => rowOf(hw, s));
      const ended = rows.length ? rows[0].phase === "ended" : (clock() > Date.parse(hw.due_date + "T23:59:59.999+09:00"));
      o.total = rows.length;
      o.done = rows.filter((r) => r.status === "done").length;
      o.partial = rows.filter((r) => r.status === "partial").length;
      const none = rows.filter((r) => r.status === "none").length;
      o.none = ended ? 0 : none;           // 期間外の未達成（まったく取り組まなかった）は、none に入れず missed に
      o.missed = ended ? none : 0;
    }
    return o;
  };
  const byNo = (a, b) => (a.no ?? 9999) - (b.no ?? 9999) || String(a.nick).localeCompare(String(b.nick), "ja");
  const lim = (v, d) => (v == null ? d : Math.max(1, Math.min(500, Number(v) | 0)));

  // ── RPC ──
  const RPC = {
    t_home({ p_token }) {
      const u = staffOf(p_token);
      const org = db().orgs.get(u.org);
      const cls = [...db().classes.values()].filter((c) => c.org === u.org && (u.role === "admin" || u.classIds.includes(c.id)));
      return {
        me: { login: u.login, nick: u.nick, role: u.role, name_enc: null }, org: { code: org.code, name: org.name, roster: null },
        classes: cls.map((c) => ({ id: c.id, name: c.name, n: c.studentIds.length, active7: Math.floor(c.studentIds.length / 2), teachers: [...db().staff.values()].filter((t) => t.classIds.includes(c.id)).map((t) => ({ nick: t.nick })), mine: u.classIds.includes(c.id) })),
      };
    },
    t_class({ p_token, p_class }) {
      const u = staffOf(p_token); const c = needClass(u, p_class);
      return { class: { id: c.id, name: c.name }, students: c.studentIds.map((id) => { const s = db().students.get(id); return { id: s.id, no: s.no, nick: s.nick, login: s.login, grade: "J1", name_enc: null, summary: {} }; }) };
    },
    hw_t_create(a) {
      const u = staffOf(a.p_token);
      const bad = () => { throw new AppError("bad_args"); };
      const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
      if (a.p_n != null && !isInt(a.p_n, 1, 200)) bad();
      if (a.p_min != null && !isInt(a.p_min, 1, 240)) bad();
      if (a.p_n != null && a.p_unit == null) bad();                 // 単元なしの N問は、だめ
      if (a.p_unit != null && a.p_n == null) bad();                 // 単元があるのに N が無いのも、だめ
      if (a.p_n == null && a.p_min == null) bad();
      if (a.p_unit != null && unitIds && !unitIds.has(a.p_unit)) bad();
      if (!validDate(a.p_start) || !validDate(a.p_due) || a.p_due < a.p_start) bad();
      if (Math.round((Date.parse(a.p_due) - Date.parse(a.p_start)) / DAY) > 59) bad();      // 期間は最長60日（両端をふくむ）：本番 hw.sql と同じ
      if (a.p_note != null && [...String(a.p_note)].length > 200) bad();
      if (a.p_title != null && [...String(a.p_title)].length > 100) bad();
      if ((a.p_class == null) === (a.p_users == null)) bad();        // どちらか一方だけ
      let users = null;
      if (a.p_class != null) needClass(u, a.p_class);
      else {
        if (!Array.isArray(a.p_users) || !a.p_users.length || a.p_users.length > 500) bad();
        users = [...new Set(a.p_users)];
        for (const id of users) { if (!UUID_RE.test(String(id))) throw new HttpError(400, { code: "22P02", message: "invalid input syntax for type uuid" }); const s = db().students.get(id); if (!s || !canClass(u, s.classId)) throw new AppError("forbidden"); }
      }
      let title = String(a.p_title || "").trim();
      if (!title) { const nm = a.p_unit && unitIds ? unitIds.get(a.p_unit) : ""; title = nm && a.p_n ? `${nm} ${a.p_n}問${a.p_min ? `・${a.p_min}分` : ""}` : `${a.p_min}分 学習`; }
      const hw = { id: nextId(), org_id: u.org, class_id: a.p_class ?? null, user_ids: users, title, unit_id: a.p_unit ?? null, n: a.p_n ?? null, min: a.p_min ?? null, start_date: a.p_start, due_date: a.p_due, note: a.p_note ? String(a.p_note).trim() || null : null, created_by: u.id, created_at: new Date(clock()).toISOString(), closed: false };
      db().hws.set(hw.id, hw);
      return { ok: true, id: hw.id };
    },
    hw_t_list({ p_token, p_class = null, p_limit = 60 }) {
      const u = staffOf(p_token);
      if (p_class != null) needClass(u, p_class);
      let list = [...db().hws.values()].filter((h) => canHw(u, h));
      if (p_class != null) list = list.filter((h) => h.class_id === p_class || (!h.class_id && targets(h).some((s) => s.classId === p_class)));
      list.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
      return { ok: true, items: list.slice(0, lim(p_limit, 60)).map((h) => hwOut(h)) };
    },
    hw_t_detail({ p_token, p_id }) {
      const u = staffOf(p_token); const hw = needHw(u, p_id);
      const students = targets(hw).map((s) => rowOf(hw, s)).sort(byNo).map(({ phase, ...r }) => r);
      return { ok: true, hw: hwOut(hw, false), students };
    },
    hw_t_grid({ p_token, p_class, p_from = null, p_to = null, p_limit = 40 }) {
      const u = staffOf(p_token); const c = needClass(u, p_class);
      if ((p_from != null && !validDate(p_from)) || (p_to != null && !validDate(p_to))) throw new HttpError(400, { code: "22007", message: "invalid input syntax for type date" });
      let list = [...db().hws.values()].filter((h) => !h.closed && h.org_id === c.org && (h.class_id === c.id || (!h.class_id && targets(h).some((s) => s.classId === c.id))));
      if (p_from) list = list.filter((h) => h.due_date >= p_from);
      if (p_to) list = list.filter((h) => h.start_date <= p_to);
      list.sort((a, b) => (a.start_date > b.start_date ? 1 : a.start_date < b.start_date ? -1 : a.created_at > b.created_at ? 1 : -1));
      list = list.slice(Math.max(0, list.length - lim(p_limit, 40)));        // 新しいほうから p_limit 件 → 古い順
      const stu = c.studentIds.map((id) => db().students.get(id)).sort(byNo);
      return {
        ok: true,
        hws: list.map((h) => ({ id: h.id, title: h.title, start_date: h.start_date, due_date: h.due_date, unit_id: h.unit_id, n: h.n, min: h.min })),
        students: stu.map((s) => { const cells = {}; for (const h of list) { if (h.class_id === c.id || (h.user_ids || []).includes(s.id)) { const r = rowOf(h, s); cells[h.id] = { pct: r.pct, status: r.status }; } } return { id: s.id, no: s.no, nick: s.nick, cells }; }),
      };
    },
    hw_t_close({ p_token, p_id, p_closed = true }) {
      const u = staffOf(p_token); const hw = needHw(u, p_id);
      if (typeof p_closed !== "boolean") throw new HttpError(400, { code: "22P02", message: "invalid input syntax for type boolean" });
      hw.closed = p_closed; return { ok: true };
    },
    hw_t_delete({ p_token, p_id }) {
      const u = staffOf(p_token); const hw = needHw(u, p_id);
      // 消せるのは、作ってから 1日以内、または 取り組んだ生徒が 0 人のとき（契約の「決めて報告」の、この模擬での決め）
      const fresh = clock() - Date.parse(hw.created_at) < DAY;
      const touched = targets(hw).some((s) => { const r = rowOf(hw, s); return (hw.n != null && r.count > 0) || (hw.min != null && r.sec > 0); });   // n の宿題は その単元を解いた／min の宿題は 学習した（本番 hw.sql と同じ）
      if (!fresh && touched) throw new AppError("not_deletable");
      db().hws.delete(hw.id); return { ok: true };
    },
  };

  // ── HTTP ──
  const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "content-type, content-profile, accept-profile, apikey, authorization, prefer, x-client-info", "Access-Control-Max-Age": "600" };
  const send = (res, status, body, extra = {}) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS, ...extra }); res.end(JSON.stringify(body)); };
  const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };

  async function handleRpc(req, res, name) {
    const chunks = []; for await (const c of req) chunks.push(c);
    let args = {};
    try { args = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return send(res, 400, { code: "PGRST102", message: "Empty or invalid json" }); }
    const h = req.headers;
    if (!h.apikey || !h.authorization) return send(res, 401, { message: "No API key found in request", hint: "No `apikey` request header or url param was found." });
    if (h["content-profile"] !== "kotsu") return send(res, 406, { code: "PGRST106", message: "The schema must be one of the following: public" });
    const sig = SIG[name];
    const keys = Object.keys(args || {});
    if (!sig || keys.some((k) => ![...sig.req, ...sig.opt].includes(k)) || sig.req.some((k) => !keys.includes(k))) {
      return send(res, 404, { code: "PGRST202", details: `Searched for the function kotsu.${name} with parameter(s) ${keys.sort().join(", ")}, but no matches were found in the schema cache.`, hint: null, message: `Could not find the function kotsu.${name}(${keys.sort().join(", ")}) in the schema cache` });
    }
    mock.calls.push({ name, args: JSON.parse(JSON.stringify(args)), at: clock() });
    if (mock.latency) await new Promise((r) => setTimeout(r, mock.latency));
    const f = mock.failures.get(name);
    if (f && f.times > 0) { f.times--; const out = typeof f.result === "function" ? f.result(args) : f.result; if (out && out.__http) return send(res, out.__http, out.body || {}); return send(res, 200, out); }
    try { return send(res, 200, RPC[name](args)); }
    catch (e) {
      if (e instanceof AppError) return send(res, 200, { error: e.code });
      if (e instanceof HttpError) return send(res, e.status, e.body);
      console.error(e); return send(res, 500, { code: "XX000", message: String(e && e.message) });
    }
  }

  mock.handler = async (req, res) => {
    try {
      const u = new URL(req.url, "http://x");
      if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
      const m = /^(?:\/rest\/v1)?\/rpc\/([a-z_0-9]+)$/.exec(u.pathname);
      if (m && req.method === "POST") return await handleRpc(req, res, m[1]);
      // 手で見るための、ログインの入口と、静的ファイル
      if (u.pathname === "/__login") {
        const as = u.searchParams.get("as") || "t1";
        const token = ({ t1: "tok-t1", t2: "tok-t2", admin: "tok-admin" })[as] || as;
        const s = db().staff.get(token);
        const port = req.socket.localPort;
        const val = s ? { token, user: { id: s.id, login: s.login, nick: s.nick, role: s.role }, org: { code: db().orgs.get(s.org).code, name: db().orgs.get(s.org).name }, keep: true, server: `http://127.0.0.1:${port}` } : null;
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(`<!doctype html><meta charset=utf-8><script>localStorage.setItem("kotsu-staff-v1",${JSON.stringify(JSON.stringify(val))});location.replace("/index.html?server=mock:${port}")</script>`);
      }
      let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
      const fp = join(root, p);
      if (req.method === "GET" && fp.startsWith(root) && !fp.startsWith(join(root, "tools")) && existsSync(fp)) { res.writeHead(200, { "Content-Type": MIME[extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" }); return res.end(readFileSync(fp)); }
      res.writeHead(404, { "Content-Type": "text/plain", ...CORS }); res.end("not found");
    } catch (e) { console.error(e); try { send(res, 500, { message: String(e) }); } catch { /* 無視 */ } }
  };
  mock.listen = (port = 0) => new Promise((resolve) => {
    const srv = createServer(mock.handler);
    srv.listen(port, "127.0.0.1", () => resolve({ port: srv.address().port, url: `http://127.0.0.1:${srv.address().port}`, close: () => new Promise((r) => srv.close(r)) }));
  });
  return mock;
}

// ── 見本のデータ（手で見るとき・テストの土台）──
const NICKS = ["ひまわり", "そら", "もも", "かえで", "ゆうき", "はると", "りく", "みお", "さくら", "れん", "あおい", "ことは", "しゅん", "なぎさ", "ひなた", "つばさ", "いちご", "だいち", "のぞみ", "ようへい", "あかり", "けいた", "まこと", "りん", "ゆず", "たいが", "めい", "こはる", "かいと", "ひかり", "そうた", "ちひろ", "らん", "ゆいな", "はるき", "みなと", "あずさ", "しょうた", "くるみ", "りゅう"];
export const IDS = { classA: uuid(1), classB: uuid(2), classC: uuid(3), classX: uuid(9) };

export function seedDemo(mock) {
  mock.addStaff("tok-t1", { id: uuid(901), login: "tanaka", nick: "田中先生", role: "teacher", classIds: [IDS.classA, IDS.classB] });
  mock.addStaff("tok-t2", { id: uuid(902), login: "suzuki", nick: "鈴木先生", role: "teacher", classIds: [IDS.classC] });
  mock.addStaff("tok-admin", { id: uuid(903), login: "admin", nick: "管理者", role: "admin", classIds: [] });
  mock.addClass({ id: IDS.classA, name: "中1 A組" });
  mock.addClass({ id: IDS.classB, name: "中1 B組" });
  mock.addClass({ id: IDS.classC, name: "中2 A組" });
  mock.addClass({ id: IDS.classX, org: "org-b", name: "ほかの学校 1組" });
  const mk = (classId, count, prefix) => { for (let i = 0; i < count; i++) mock.addStudent({ classId, no: i + 1, nick: NICKS[i % NICKS.length] + (i >= NICKS.length ? "2" : ""), login: `${prefix}${String(i + 1).padStart(2, "0")}` }); };
  mk(IDS.classA, 32, "a"); mk(IDS.classB, 40, "b"); mk(IDS.classC, 20, "c"); mk(IDS.classX, 5, "x");
  return mock;
}
export function seedHomework(mock, now = mock.now()) {
  const today = ymdJST(now), day = (n) => ymdJST(now + n * DAY);
  const pick = (r) => (i, s, rr) => { const x = rr(); return x < r[0] ? "done" : x < r[0] + r[1] ? "partial" : "none"; };
  const A = IDS.classA, B = IDS.classB;
  const base = { org: "org-a" };
  mock.addHomework({ ...base, class_id: A, title: "正負の意味・大小 10問", unit_id: "J1-u1", n: 10, start_date: day(-5), due_date: day(-2), created_at: new Date(now - 5 * DAY).toISOString() }, { outcome: pick([0.7, 0.2]), seed: 11 });
  mock.addHomework({ ...base, class_id: A, title: "加法（足し算） 15問", unit_id: "J1-u2", n: 15, start_date: day(-1), due_date: day(1), created_at: new Date(now - 1 * DAY).toISOString() }, { outcome: pick([0.4, 0.35]), seed: 12 });
  mock.addHomework({ ...base, class_id: A, title: "20分 学習", min: 20, start_date: today, due_date: day(2), note: "毎日少しずつでOK！", created_at: new Date(now - 3600e3).toISOString() }, { outcome: pick([0.2, 0.3]), seed: 13 });
  mock.addHomework({ ...base, class_id: A, title: "減法（引き算） 10問・15分", unit_id: "J1-u3", n: 10, min: 15, start_date: day(3), due_date: day(6), created_at: new Date(now - 7200e3).toISOString() }, { outcome: "skip" });
  mock.addHomework({ ...base, class_id: B, title: "正負の意味・大小 20問", unit_id: "J1-u1", n: 20, start_date: day(-3), due_date: day(0), created_at: new Date(now - 3 * DAY).toISOString() }, { outcome: pick([0.5, 0.3]), seed: 14 });
  mock.addHomework({ ...base, class_id: B, title: "（締めた）文字の式 10問", unit_id: "J1-v1", n: 10, start_date: day(-4), due_date: day(2), closed: true, created_at: new Date(now - 4 * DAY).toISOString() }, { outcome: pick([0.3, 0.3]), seed: 15 });
  const some = [...mock.db.classes.get(A).studentIds].slice(0, 4);
  mock.addHomework({ ...base, class_id: null, user_ids: some, title: "個人宛て：正負の意味・大小 5問", unit_id: "J1-u1", n: 5, start_date: day(-1), due_date: day(3), created_at: new Date(now - 1800e3).toISOString() }, { outcome: pick([0.5, 0.25]), seed: 16 });
}

// ── 手で動かす ──
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pi = process.argv.indexOf("--port");
  const port = pi > 0 ? Number(process.argv[pi + 1]) : 54474;
  const mock = createMock();
  seedDemo(mock);
  seedHomework(mock);
  const s = await mock.listen(port);
  console.log(`模擬のサーバー：${s.url}（RPC は ${s.url}/rpc/<名前>）`);
  console.log(`  先生でログインして、ページをひらく： ${s.url}/__login?as=t1      （別の先生 t2、管理者 admin）`);
  console.log(`  ページ（手動）： ${s.url}/index.html?server=mock:${s.port}   ← 先にログインの入口を通ること`);
}
