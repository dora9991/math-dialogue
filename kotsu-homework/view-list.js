// view-list.js — 「いまの宿題」の一覧と、1件の詳細（生徒ごとの進み）
import { rpc, isAuthError, errText } from "./api.js";
import { esc, md, mdw, fmtPeriod, leftText, phaseOf, condText, fmtMin, pct100, ST_LABEL, ST_MARK, cellKind, clamp01 } from "./util.js";

const LS = { show: "kotsu-hw-show", sort: "kotsu-hw-sort" };
const lsGet = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* なくても動く */ } };
const L = { cls: "", show: lsGet(LS.show, "open"), sort: lsGet(LS.sort, "due") };

const group = (hw, today) => (hw.closed ? "closed" : hw.due_date < today ? "ended" : "open");
const who = (hw) => (hw.class_id ? hw.class_name || "クラス" : `個人宛て（${(hw.user_ids || []).length || hw.total || 0}人）`);

const cmp = (x, y) => (x > y ? 1 : x < y ? -1 : 0);
const byNewest = (a, b) => cmp(b.created_at || "", a.created_at || "");
// 期限が近い順：出している宿題は、期限が近いものから。期限がすぎた・締めたものは、そのあと（新しく終わったものから）
const byDue = (a, b, today) => {
  const ord = { open: 0, ended: 1, closed: 2 }, ga = group(a, today), gb = group(b, today);
  if (ga !== gb) return ord[ga] - ord[gb];
  return ga === "open" ? cmp(a.due_date, b.due_date) || byNewest(a, b) : cmp(b.due_date, a.due_date) || byNewest(a, b);
};

function cardHtml(hw, today, flashId) {
  const ph = phaseOf(hw, today), g = group(hw, today);
  const total = hw.total || 0, d = hw.done || 0, p = hw.partial || 0, n = hw.none || 0, m = hw.missed || 0;
  const w = (x) => (total ? (x / total) * 100 : 0).toFixed(2);
  const leftCls = g === "closed" ? "gray" : ph === "ended" ? "gray" : ph === "upcoming" ? "blue" : (hw.due_date === today ? "warn" : "sun");
  return `<a class="hw ${hw.closed ? "closed" : ""} ${flashId && hw.id === flashId ? "flash" : ""}" href="#hw/${encodeURIComponent(hw.id)}" data-id="${esc(hw.id)}" data-group="${g}">
    <div class="t"><span class="tt">${esc(hw.title || "（題なし）")}</span>${hw.closed ? `<span class="k-chip gray">締めた</span>` : ""}</div>
    <div class="meta">
      <span class="k-chip ${hw.class_id ? "blue" : "sun"}">${hw.class_id ? "🏫" : "👤"} ${esc(who(hw))}</span>
      <span class="k-chip">📅 ${esc(fmtPeriod(hw.start_date, hw.due_date, today))}</span>
      <span class="k-chip ${leftCls}">${esc(hw.closed ? "締めた" : leftText(hw, today))}</span>
      ${(hw.title || "").includes(condText(hw)) ? "" : `<span class="k-chip ok">${esc(condText(hw))}</span>`}
    </div>
    <div class="sbar" role="img" aria-label="達成${d}人・一部${p}人・まだ${n}人${m ? `・期限切れ${m}人` : ""}"><i class="d" style="width:${w(d)}%"></i><i class="p" style="width:${w(p)}%"></i><i class="n" style="width:${w(n)}%"></i><i class="m" style="width:${w(m)}%"></i></div>
    <div class="counts"><span><i class="dot d"></i><b>${d}</b>人 達成</span><span><i class="dot p"></i><b>${p}</b>人 一部</span><span><i class="dot n"></i><b>${n}</b>人 まだ</span>${m ? `<span><i class="dot m"></i><b>${m}</b>人 期限切れ</span>` : ""}<span class="k-muted">（${total}人）</span></div>
  </a>`;
}

export async function renderList(ctx, el, my) {
  const load = async () => {
    const r = await rpc("hw_t_list", { p_token: ctx.token(), p_class: L.cls || null, p_limit: 60 });
    return r.items || [];
  };
  let items = await load();
  if (ctx.nav !== my) return;
  const flash = ctx.flash; ctx.flash = null;
  const today = ctx.today();

  const draw = () => {
    const today = ctx.today();
    const cnt = { open: 0, ended: 0, closed: 0 };
    for (const h of items) cnt[group(h, today)]++;
    let show = L.show;
    const sel = items.filter((h) => show === "all" || group(h, today) === show);
    sel.sort(L.sort === "new" ? byNewest : (a, b) => byDue(a, b, today));
    const seg = (id, label, n) => `<button type="button" data-show="${id}" class="${show === id ? "on" : ""}">${label}<span class="n">${n}</span></button>`;
    const classOpts = `<option value="">すべてのクラス</option>${ctx.classes.map((c) => `<option value="${esc(c.id)}"${c.id === L.cls ? " selected" : ""}>${esc(c.name)}</option>`).join("")}`;
    let body;
    if (!items.length) {
      body = `<div class="k-empty" id="empty-list"><div class="big">📭</div><h2>${L.cls ? "このクラスには、まだ宿題がありません" : "まだ宿題がありません"}</h2>「宿題を出す」から、クラスや生徒に出してみましょう。<br><a class="k-btn" href="#new">✏️ 宿題を出す</a></div>`;
    } else if (!sel.length) {
      const hint = Object.entries({ open: "出している", ended: "期限がすぎた", closed: "締めた" }).filter(([k]) => cnt[k]).map(([k, v]) => `<button type="button" class="k-btn ghost sm" data-show="${k}">${v}宿題を見る（${cnt[k]}）</button>`).join(" ");
      body = `<div class="k-empty" id="empty-filter"><div class="big">🎉</div><h2>${show === "open" ? "いま出している宿題は、ありません" : "この分類の宿題は、ありません"}</h2><div class="k-row" style="justify-content:center">${hint}</div></div>`;
    } else body = `<div class="hw-list" id="hw-list">${sel.map((h) => cardHtml(h, today, flash && flash.id)).join("")}</div>`;
    el.innerHTML = `
      <div class="k-title"><h1>📌 いまの宿題</h1><span class="sub">達成・一部・まだ の人数と、生徒ごとの進みが見られます</span></div>
      ${flash ? `<div class="k-ok-bar" id="flash-bar" role="status">✅ 出しました：「${esc(flash.title)}」（${esc(flash.target)}）。生徒の画面に出ます。</div>` : ""}
      <div class="bar-tools">
        <label>クラス <select class="k-select" id="l-class">${classOpts}</select></label>
        <div class="k-seg" id="l-show" role="group" aria-label="分類">${seg("open", "出している", cnt.open)}${seg("ended", "期限切れ", cnt.ended)}${seg("closed", "締めた", cnt.closed)}${seg("all", "すべて", items.length)}</div>
        <label>ならびかた <select class="k-select" id="l-sort"><option value="due"${L.sort === "due" ? " selected" : ""}>期限が近い順</option><option value="new"${L.sort === "new" ? " selected" : ""}>新しい順</option></select></label>
        <div class="grow"></div>
        <button type="button" class="k-btn ghost sm" id="l-reload">↻ 更新</button>
      </div>
      ${body}
      <p class="hint" style="margin-top:12px">新しいものから ${items.length} 件（最大60件）を読みこんでいます。むかしの分は「これまでの取り組み」で見られます。</p>`;
    el.querySelector("#l-show").onclick = (e) => { const b = e.target.closest("button[data-show]"); if (b) { L.show = b.dataset.show; lsSet(LS.show, L.show); draw(); } };
    for (const b of el.querySelectorAll("#empty-filter [data-show]")) b.onclick = () => { L.show = b.dataset.show; lsSet(LS.show, L.show); draw(); };
    el.querySelector("#l-sort").onchange = (e) => { L.sort = e.target.value; lsSet(LS.sort, L.sort); draw(); };
    el.querySelector("#l-class").onchange = async (e) => { L.cls = e.target.value; await reload(); };
    el.querySelector("#l-reload").onclick = () => reload();
    const f = el.querySelector(".hw.flash"); if (f) f.scrollIntoView({ block: "center" });
  };
  const reload = async () => {
    try { items = await load(); } catch (e) { if (isAuthError(e)) return ctx.authLost(e); ctx.toast(errText(e), 4000); return; }
    if (ctx.nav !== my) return;
    draw();
  };
  // 出した直後なのに「出している」に入らないとき（開始が先など）は、すべてを見せる
  if (flash && flash.id) { const h = items.find((x) => x.id === flash.id); if (h && group(h, today) !== L.show && L.show !== "all") L.show = group(h, today); }
  draw();
}

// ── 1件の詳細 ──
const sortFns = {
  no: (a, b) => (a.no ?? 9999) - (b.no ?? 9999),
  low: (a, b) => (a.pct || 0) - (b.pct || 0) || (a.no ?? 9999) - (b.no ?? 9999),
  high: (a, b) => (b.pct || 0) - (a.pct || 0) || (a.no ?? 9999) - (b.no ?? 9999),
};
let detailSort = "no";

export function studentRowHtml(hw, s, today) {
  const kind = cellKind(hw, s.status, today);
  const pct = clamp01(s.pct);
  const hasN = hw.n != null, hasM = hw.min != null;
  const q = hasN ? `${s.count ?? 0}/${hw.n}問<em>（正解${s.correct ?? 0}）</em>` : (hw.unit_id ? `${s.count ?? 0}問<em>（正解${s.correct ?? 0}）</em>` : "―");
  const tm = hasM ? `${Math.round((s.sec || 0) / 60)}/${hw.min}分` : fmtMin(s.sec);
  const mk = kind === "done" ? "🎉 達成" : `${ST_MARK[kind]} ${ST_LABEL[kind]}`.trim();
  return `<div class="srow s-${kind === "upcoming" ? "none" : kind}" data-sid="${esc(s.id)}" data-kind="${kind}">
    <span class="no">${s.no ?? ""}</span>
    <span class="nm">${esc(s.nick || s.login || "")}${s.login && s.nick && s.login !== s.nick ? `<small>${esc(s.login)}</small>` : ""}</span>
    <span class="pg"><span class="pbar"><i style="width:${(pct * 100).toFixed(1)}%"></i></span><b>${pct100(pct)}</b></span>
    <span class="infos"><span class="q"><small class="lab">解いた</small>${q}</span><span class="tm"><small class="lab">時間</small>${tm}</span><span class="dn"><small class="lab">達成日</small>${s.done_at ? md(s.done_at) : "―"}</span></span>
    <span class="mk-c"><span class="mk s-${kind}">${esc(mk)}</span></span>
  </div>`;
}

export async function renderDetail(ctx, el, my, id) {
  const r = await rpc("hw_t_detail", { p_token: ctx.token(), p_id: id });
  if (ctx.nav !== my) return;
  const hw = r.hw || {}, students = r.students || [];
  const today = ctx.today();
  const ph = phaseOf(hw, today);
  const draw = () => {
    const cnt = { done: 0, partial: 0, none: 0 };
    for (const s of students) cnt[s.status === "done" ? "done" : s.status === "partial" ? "partial" : "none"]++;
    const total = students.length;
    const rows = [...students].sort(sortFns[detailSort]);
    el.innerHTML = `
      <a class="back-btn" id="back" href="#list">‹ いまの宿題にもどる</a>
      <div class="detail-head">
        <div class="ttl"><h1 id="d-title">${esc(hw.title || "（題なし）")}${hw.closed ? ` <span class="k-chip gray">締めた</span>` : ""}</h1>
          <div class="k-row" style="gap:5px">
            <span class="k-chip ${hw.class_id ? "blue" : "sun"}">${hw.class_id ? "🏫" : "👤"} ${esc(hw.class_id ? hw.class_name || "クラス" : `個人宛て（${total}人）`)}</span>
            <span class="k-chip">📅 ${esc(fmtPeriod(hw.start_date, hw.due_date, today))}</span>
            <span class="k-chip ${hw.closed || ph === "ended" ? "gray" : ph === "upcoming" ? "blue" : hw.due_date === today ? "warn" : "sun"}">${esc(hw.closed ? "締めた" : leftText(hw, today))}</span>
            ${(hw.title || "").includes(condText(hw)) ? "" : `<span class="k-chip ok">${esc(condText(hw))}</span>`}
          </div>
        </div>
        <div class="detail-act">
          <button type="button" class="k-btn ghost sm" id="d-reload">↻ 更新</button>
          <button type="button" class="k-btn ${hw.closed ? "" : "ghost"} sm" id="d-close">${hw.closed ? "▶ 再開する" : "⏹ 締める（取り消し）"}</button>
          <button type="button" class="k-btn danger sm" id="d-del">🗑 消す</button>
        </div>
      </div>
      <div class="k-err" id="act-err" hidden></div>
      ${hw.note ? `<div class="k-info" id="d-note">💬 先生のひとこと：${esc(hw.note)}</div>` : ""}
      ${hw.closed ? `<div class="k-note">この宿題は締めてあります。生徒の画面には出ません（記録は残っています）。「再開する」で、また出せます。</div>` : ""}
      ${ph === "upcoming" && !hw.closed ? `<div class="k-info">この宿題は、まだ始まっていません（開始日：${esc(mdw(hw.start_date))}）。</div>` : ""}
      <div class="tiles" id="d-tiles">
        <div class="tile d"><div class="v">${cnt.done}<small>人</small></div><div class="k">🎉 達成</div></div>
        <div class="tile p"><div class="v">${cnt.partial}<small>人</small></div><div class="k">△ 一部</div></div>
        <div class="tile n"><div class="v">${cnt.none}<small>人</small></div><div class="k">× まだ</div></div>
        <div class="tile r"><div class="v">${total ? Math.round((cnt.done / total) * 100) : 0}<small>%</small></div><div class="k">達成率（${cnt.done}/${total}人）</div></div>
      </div>
      <div class="bar-tools"><label>ならびかた <select class="k-select" id="d-sort"><option value="no"${detailSort === "no" ? " selected" : ""}>出席番号順</option><option value="low"${detailSort === "low" ? " selected" : ""}>進みの少ない順</option><option value="high"${detailSort === "high" ? " selected" : ""}>進みの多い順</option></select></label></div>
      ${total ? `<div class="srows" id="d-rows"><div class="srow hd"><span class="no">番号</span><span>ニックネーム</span><span>進み</span><span>解いた問</span><span>時間</span><span>達成日</span><span>状態</span></div>${rows.map((s) => studentRowHtml(hw, s, today)).join("")}</div>` : `<div class="k-empty">対象の生徒がいません。</div>`}`;
    el.querySelector("#d-sort").onchange = (e) => { detailSort = e.target.value; draw(); };
    el.querySelector("#d-reload").onclick = () => ctx.go(location.hash);
    el.querySelector("#d-close").onclick = onClose;
    el.querySelector("#d-del").onclick = onDelete;
  };
  const rerender = async () => { try { const x = await rpc("hw_t_detail", { p_token: ctx.token(), p_id: id }); if (ctx.nav !== my) return; hw.closed = x.hw.closed; Object.assign(hw, x.hw); students.length = 0; students.push(...(x.students || [])); draw(); } catch (e) { if (isAuthError(e)) return ctx.authLost(e); showErr(errText(e)); } };
  const showErr = (m) => { const b = el.querySelector("#act-err"); if (b) { b.hidden = false; b.textContent = m; b.scrollIntoView({ block: "center" }); } };
  async function onClose() {
    const closing = !hw.closed;
    const ok = await ctx.confirm({
      title: closing ? "この宿題を締めますか？" : "この宿題を再開しますか？",
      html: closing ? `<p>「<b>${esc(hw.title)}</b>」を締めると、<b>生徒の画面から消えます</b>。これまでの記録は残り、あとで「再開」できます。</p>` : `<p>「<b>${esc(hw.title)}</b>」を、また生徒の画面に出します。</p>`,
      ok: closing ? "締める" : "再開する", cancel: "やめる",
    });
    if (!ok) return;
    try { await rpc("hw_t_close", { p_token: ctx.token(), p_id: id, p_closed: closing }); ctx.toast(closing ? "締めました" : "再開しました"); await rerender(); }
    catch (e) { if (isAuthError(e)) return ctx.authLost(e); showErr(errText(e)); }
  }
  async function onDelete() {
    const ok = await ctx.confirm({
      title: "この宿題を消しますか？",
      html: `<p>「<b>${esc(hw.title)}</b>」を、記録ごと消します。<b>元にもどせません</b>。</p><p class="hint">出したばかりのまちがいを直すためのものです。取り組んだ生徒がいる宿題は、消さずに「締める」を使ってください。</p>`,
      ok: "消す", cancel: "やめる", danger: true,
    });
    if (!ok) return;
    try { await rpc("hw_t_delete", { p_token: ctx.token(), p_id: id }); ctx.toast("消しました"); ctx.go("#list"); }
    catch (e) { if (isAuthError(e)) return ctx.authLost(e); showErr(errText(e)); }
  }
  draw();
}
