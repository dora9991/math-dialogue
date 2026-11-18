// app.js — 宿題（先生）のページ：ログインの確認・クラス一覧・タブと画面の切りかえ
import { SERVER, readStaff, isStaff, rpc, isAuthError, errText } from "./api.js";
import { esc, ymdJST, loadUnits } from "./util.js";
import { toast, confirmDialog } from "./ui.js";
import { renderNew } from "./view-new.js";
import { renderList, renderDetail } from "./view-list.js";
import { renderGrid } from "./view-grid.js";

const $ = (id) => document.getElementById(id);
const main = $("main");

// 画面どうしで共有するもの
export const ctx = {
  staff: null,
  home: null,          // t_home の返り値（classes・org・me）
  classes: [],
  unitsError: "",
  nav: 0,              // 画面を切りかえるたびに増やす（古い読みこみの結果を捨てるため）
  students: new Map(), // クラスの生徒（t_class）のキャッシュ
  flash: null,         // 宿題を出した直後の知らせ {id, title}
  today: () => ymdJST(Date.now()),
  go: (hash) => { if (location.hash === hash) route(); else location.hash = hash; },
  toast,
  confirm: confirmDialog,
  authLost: (e) => showLogin(e),
  token: () => ctx.staff && ctx.staff.token,
  className: (id) => { const c = ctx.classes.find((x) => x.id === id); return c ? c.name : ""; },
};

// ── ログインが必要な案内（先生の画面でログインしてください）──
function showLogin(err) {
  ctx.nav++;
  ctx.staff = null;
  $("who").hidden = true; $("org").hidden = true;
  let msg = "宿題のページは、先生の画面のログインをそのまま使います。先に先生の画面でログインしてから、ここにもどってきてください。";
  let head = "先生の画面でログインしてください";
  if (err) {
    if (err.code === "auth") { head = "ログインの期限が切れました"; msg = "先生の画面でもう一度ログインしてから、ここにもどってきてください。"; }
    else if (isAuthError(err)) msg = errText(err);
  }
  main.innerHTML = `<div class="k-login"><div class="k-card k-login-card" id="login-guide">
    <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#13a07f"/><rect x="10" y="38" width="13" height="16" rx="3" fill="#fff"/><rect x="26" y="26" width="13" height="28" rx="3" fill="#fff"/><rect x="42" y="12" width="13" height="42" rx="3" fill="#ffd166"/></svg>
    <h1>${esc(head)}</h1>
    <p>${esc(msg)}</p>
    <a class="k-btn big" id="login-link" href="../">先生の画面へ（ログイン）</a><br>
    <button type="button" class="k-btn ghost sm" id="login-retry">ログインしたので、読みこみなおす</button>
  </div></div>`;
  $("login-retry").onclick = () => boot();
}

function setHeader() {
  const s = ctx.staff, h = ctx.home;
  const org = (h && h.org) || s.org || {};
  if (org.name || org.code) { $("org").hidden = false; $("org").innerHTML = `<b>${esc(org.name || "")}</b><small>組織コード ${esc(org.code || "")}</small>`; }
  const u = (h && h.me) || s.user || {};
  $("who").hidden = false;
  $("who").textContent = `${(s.user && s.user.nick) || u.nick || u.login || ""}${s.user && s.user.role === "admin" ? "（管理者）" : ""}`;
  if (SERVER.local) { $("srvnote").hidden = false; $("srvnote").textContent = SERVER.mock ? "模擬のサーバー（テスト用）につないでいます。本番ではありません。" : "手元の検証用サーバーにつないでいます（本番ではありません）"; }
}

// ── ルート：#new（宿題を出す）／#list（いまの宿題・既定）／#hw/<id>（1件）／#grid[/<クラスid>]（これまでの取り組み）──
export function parseHash(h = location.hash) {
  const s = h.replace(/^#/, "");
  if (s.startsWith("hw/")) return { name: "detail", id: decodeURIComponent(s.slice(3)) };
  if (s === "grid" || s.startsWith("grid/")) return { name: "grid", cls: decodeURIComponent(s.slice(5)) || null };
  if (s === "new") return { name: "new" };
  return { name: "list" };
}
const TABS = [["new", "✏️", "宿題を出す", "#new"], ["list", "📌", "いまの宿題", "#list"], ["grid", "🟩", 'これまでの<span class="sp-br"></span>取り組み', "#grid"]];
function tabsHtml(cur) {
  return `<nav class="k-tabs" role="tablist" aria-label="宿題のメニュー">${TABS.map(([id, ic, label, href]) => `<button type="button" role="tab" id="tab-${id}" data-href="${href}" aria-selected="${cur === id}" class="${cur === id ? "on" : ""}"><span class="ic" aria-hidden="true">${ic}</span><span class="lb">${label}</span></button>`).join("")}</nav>`;
}

async function route() {
  if (!ctx.staff || !ctx.home) return;
  const r = parseHash();
  const my = ++ctx.nav;
  const cur = r.name === "detail" ? "list" : r.name;
  main.innerHTML = `${tabsHtml(cur)}<div id="view"><div class="k-load">読みこんでいます…</div></div>`;
  for (const b of main.querySelectorAll(".k-tabs button")) b.onclick = () => ctx.go(b.dataset.href);
  const el = $("view");
  try {
    if (r.name === "new") await renderNew(ctx, el, my);
    else if (r.name === "detail") await renderDetail(ctx, el, my, r.id);
    else if (r.name === "grid") await renderGrid(ctx, el, my, r.cls);
    else await renderList(ctx, el, my);
  } catch (e) {
    if (ctx.nav !== my) return;
    if (isAuthError(e)) return showLogin(e);
    el.innerHTML = `<div class="k-err" id="view-err">${esc(errText(e))}</div><button type="button" class="k-btn ghost" id="view-retry">もう一度よみこむ</button>`;
    $("view-retry").onclick = () => route();
  }
  if (ctx.nav === my) window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

// ── 起動 ──
async function boot() {
  const s = readStaff();
  if (!s || !isStaff(s)) { showLogin(null); return; }
  ctx.staff = s;
  main.innerHTML = `<div class="k-load">読みこんでいます…</div>`;
  const unitsP = loadUnits().then(() => "", (e) => { console.warn("units.json を読めませんでした", e); return "小単元の一覧を読みこめませんでした。ページを読みこみなおしてください。"; });
  try {
    ctx.home = await rpc("t_home", { p_token: s.token });
  } catch (e) {
    if (isAuthError(e)) return showLogin(e);
    main.innerHTML = `<div class="k-err" id="boot-err">${esc(errText(e))}</div><button type="button" class="k-btn ghost" id="boot-retry">もう一度よみこむ</button>`;
    $("boot-retry").onclick = () => boot();
    return;
  }
  ctx.unitsError = await unitsP;
  // クラス：自分の担当を先に、管理者は「ほかのクラス」も（先生の画面と同じ）
  const cl = (ctx.home && ctx.home.classes) || [];
  ctx.classes = [...cl.filter((c) => c.mine !== false), ...cl.filter((c) => c.mine === false)];
  setHeader();
  route();
}
// 先生の画面でログインしなおしたあと、このタブにもどったら、案内の画面から自動で読みこみなおす
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !ctx.staff && readStaff()) boot(); });
boot();
