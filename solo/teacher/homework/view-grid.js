// view-grid.js — 「これまでの取り組み」（行＝生徒・列＝宿題のマス目）
import { rpc, isAuthError, errText } from "./api.js";
import { esc, md, mdw, fmtPeriod, phaseOf, condText, fmtMin, pct100, shortTitle, ST_LABEL, ST_MARK, cellKind } from "./util.js";
import { modal } from "./ui.js";

const LS_CLASS = "kotsu-hw-class";
const lsGet = (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* なくても動く */ } };
let limit = 40;
const detailCache = new Map();   // 宿題id → hw_t_detail の返り値（マスのくわしい記録用。画面を更新すると捨てる）

const sym = (kind) => ST_MARK[kind] || "";
const pctText = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "―");

export async function renderGrid(ctx, el, my, clsArg) {
  if (!ctx.classes.length) {
    el.innerHTML = `<div class="k-empty" id="no-class"><div class="big">🏫</div><h2>まだ担当のクラスがありません</h2>管理者に「クラスの先生」に入れてもらってください。</div>`;
    return;
  }
  let cls = clsArg && ctx.classes.some((c) => c.id === clsArg) ? clsArg : lsGet(LS_CLASS);
  if (!ctx.classes.some((c) => c.id === cls)) cls = ctx.classes[0].id;
  lsSet(LS_CLASS, cls);
  detailCache.clear();
  const r = await rpc("hw_t_grid", { p_token: ctx.token(), p_class: cls, p_limit: limit });
  if (ctx.nav !== my) return;
  const today = ctx.today();
  const hws = r.hws || [];
  const students = [...(r.students || [])].sort((a, b) => (a.no ?? 9999) - (b.no ?? 9999) || String(a.nick).localeCompare(String(b.nick), "ja"));
  const hwById = new Map(hws.map((h) => [h.id, h]));
  const stById = new Map(students.map((s) => [s.id, s]));
  const phases = new Map(hws.map((h) => [h.id, phaseOf(h, today)]));

  // 達成率：期間前の宿題と、対象でないマスは、ふくめない
  const colStat = new Map(hws.map((h) => [h.id, { done: 0, all: 0 }]));
  let allDone = 0, allCnt = 0;
  const rowStat = students.map((s) => {
    let d = 0, a = 0;
    for (const h of hws) {
      const c = s.cells && s.cells[h.id];
      if (!c || phases.get(h.id) === "upcoming") continue;
      a++; if (c.status === "done") d++;
      const cs = colStat.get(h.id); cs.all++; if (c.status === "done") cs.done++;
    }
    allDone += d; allCnt += a;
    return { done: d, all: a };
  });

  const opts = ctx.classes.map((c) => `<option value="${esc(c.id)}"${c.id === cls ? " selected" : ""}>${esc(c.name)}</option>`).join("");
  const head = `
    <div class="k-title"><h1>🟩 これまでの取り組み</h1><span class="sub">行＝生徒（出席番号順）／列＝宿題（古い順）。マスをタップすると、くわしく見られます</span></div>
    <div class="bar-tools">
      <label>クラス <select class="k-select" id="g-class">${opts}</select></label>
      <div class="grow"></div>
      <button type="button" class="k-btn ghost sm" id="g-reload">↻ 更新</button>
    </div>`;
  if (!hws.length || !students.length) {
    el.innerHTML = `${head}<div class="k-empty" id="${!students.length ? "empty-students" : "empty-grid"}"><div class="big">${!students.length ? "🧑‍🎓" : "📭"}</div><h2>${!students.length ? "このクラスには、まだ生徒がいません" : "このクラスには、まだ宿題がありません"}</h2>${!students.length ? "" : `「宿題を出す」から、このクラスに宿題を出してみましょう。<br><a class="k-btn" href="#new">✏️ 宿題を出す</a>`}</div>`;
    bind();
    return;
  }

  // ── マス目の表（文字列でまとめて作る：40人×40件でも速い）──
  const h1 = hws.map((h) => `<th class="hc" scope="col"><button type="button" class="hh${h.closed ? " closed" : ""}" data-hw="${esc(h.id)}" title="${esc(h.title)}（${esc(fmtPeriod(h.start_date, h.due_date, today))}）" aria-label="${esc(h.title)}、${esc(md(h.start_date))}から${esc(md(h.due_date))}。くわしく見る"><span class="hd">${esc(md(h.due_date))}</span><span class="ht">${esc(shortTitle(h.title, 7))}</span></button></th>`).join("");
  const h2 = hws.map((h) => { const c = colStat.get(h.id), up = phases.get(h.id) === "upcoming"; const p = c.all ? Math.round((c.done / c.all) * 100) : 0; return `<th class="hc rt" scope="col" style="--p:${up ? 0 : p}" title="${esc(h.title)}：達成 ${c.done}／${c.all}人">${up ? "―" : pctText(c.done, c.all)}</th>`; }).join("");
  const rows = students.map((s, i) => {
    const rs = rowStat[i];
    const cells = hws.map((h) => {
      const c = s.cells && s.cells[h.id];
      if (!c) return `<td class="cc"><span class="cell s-na" title="対象外" aria-label="${esc(s.nick)}・${esc(h.title)}：対象外">–</span></td>`;
      const kind = cellKind(h, c.status, today);
      return `<td class="cc"><button type="button" class="cell s-${kind}" data-hw="${esc(h.id)}" data-st="${esc(s.id)}" data-kind="${kind}" aria-label="${esc(s.no ?? "")} ${esc(s.nick)}・${esc(h.title)}：${ST_LABEL[kind]}">${sym(kind)}</button></td>`;
    }).join("");
    return `<tr data-sid="${esc(s.id)}"><th class="sc1" scope="row">${s.no ?? ""}</th><th class="sc2" scope="row" title="${esc(s.nick)}">${esc(s.nick)}</th><td class="rt" style="--p:${rs.all ? Math.round((rs.done / rs.all) * 100) : 0}" title="達成 ${rs.done}／${rs.all}件">${pctText(rs.done, rs.all)}</td>${cells}</tr>`;
  }).join("");
  const table = `<table class="g" id="grid-table">
    <thead>
      <tr class="r1"><th class="sc1" scope="col">番号</th><th class="sc2" scope="col">ニックネーム</th><th class="rt" scope="col" style="vertical-align:bottom">行の<br>達成率</th>${h1}</tr>
      <tr class="r2"><th class="sc1"></th><th class="sc2" style="font-size:11px">列の達成率</th><th class="rt" style="--p:${allCnt ? Math.round((allDone / allCnt) * 100) : 0}">${pctText(allDone, allCnt)}</th>${h2}</tr>
    </thead>
    <tbody>${rows}</tbody></table>`;
  const legend = `<div class="legend" id="legend" aria-label="凡例">
    <span><i class="s-done">○</i>達成</span><span><i class="s-partial">△</i>一部</span><span><i class="s-none">×</i>まだ</span><span><i class="s-upcoming"></i>期間前（これから）</span><span><i class="s-na">–</i>対象外</span></div>`;
  const more = hws.length >= limit && limit < 200 ? `<button type="button" class="k-btn ghost sm" id="g-more">もっと前の宿題も見る（いま ${hws.length}件）</button>` : "";
  el.innerHTML = `${head}
    <div class="gsum" id="gsum"><span>クラス全体の達成率 <b>${pctText(allDone, allCnt)}</b>（${allCnt}マスのうち ${allDone}マスが達成）</span><span>生徒 ${students.length}人 ／ 宿題 ${hws.length}件</span></div>
    ${legend}
    <div class="gw" id="gw" tabindex="0" role="region" aria-label="取り組みのマス目（横にスクロールできます）">${table}</div>
    <div class="k-row" style="margin-top:10px">${more}<span class="hint">スマホでは、横にスクロールできます（番号と名前は動きません）。列の見出しをタップすると、その宿題の一覧に行きます。</span></div>`;
  bind();

  function bind() {
    el.querySelector("#g-class").onchange = (e) => ctx.go(`#grid/${encodeURIComponent(e.target.value)}`);
    el.querySelector("#g-reload").onclick = () => { ctx.go(location.hash); };
    const more = el.querySelector("#g-more");
    if (more) more.onclick = () => { limit = Math.min(200, limit + 40); ctx.go(location.hash); };
    const gw = el.querySelector("#gw");
    if (gw) gw.addEventListener("click", (e) => {
      const hh = e.target.closest(".hh"); if (hh) { ctx.go(`#hw/${encodeURIComponent(hh.dataset.hw)}`); return; }
      const c = e.target.closest("button.cell"); if (c) openCell(c.dataset.hw, c.dataset.st, c);
    });
  }

  // ── マスをタップ：その生徒のその宿題のくわしい記録（○問・○分）──
  async function openCell(hwId, stId, btn) {
    const hw = hwById.get(hwId), st = stById.get(stId);
    if (!hw || !st) return;
    const cell = st.cells[hwId], kind = cellKind(hw, cell.status, today);
    const mk = kind === "done" ? "🎉 達成" : `${sym(kind)} ${ST_LABEL[kind]}`.trim();
    const head = `<div class="cellmodal"><div class="big"><b>${esc(hw.title)}</b></div>
      <div class="k-row" style="gap:5px;margin:4px 0"><span class="k-chip">📅 ${esc(fmtPeriod(hw.start_date, hw.due_date, today))}</span><span class="k-chip ok">${esc(condText(hw))}</span></div>
      <div style="margin:8px 0"><span class="mk s-${kind}" id="cm-mk">${esc(mk)}</span> <span class="k-muted k-small">進み ${pct100(cell.pct)}</span></div>
      <div id="cm-detail" class="k-muted k-small">くわしい記録を読みこんでいます…</div></div>`;
    const m = modal({ title: `${st.no ?? ""} ${st.nick}`.trim(), html: head, sheet: true, foot: [{ label: "この宿題の一覧へ", kind: "soft", value: "open" }, { label: "とじる", kind: "ghost", value: null }] });
    m.done.then((v) => { if (v === "open") ctx.go(`#hw/${encodeURIComponent(hwId)}`); });
    try {
      let d = detailCache.get(hwId);
      if (!d) { d = await rpc("hw_t_detail", { p_token: ctx.token(), p_id: hwId }); detailCache.set(hwId, d); }
      const row = (d.students || []).find((x) => x.id === stId);
      const box = m.el.querySelector("#cm-detail"); if (!box) return;
      if (!row) { box.textContent = "くわしい記録が見つかりませんでした。"; return; }
      const hasN = hw.n != null;
      box.className = "";
      box.innerHTML = `<dl>
        <dt>解いた問題</dt><dd>${hw.unit_id ? `${row.count ?? 0}問（正解 ${row.correct ?? 0}問）${hasN ? `／目標 ${hw.n}問` : ""}` : "―（時間だけの宿題）"}</dd>
        <dt>学習時間</dt><dd>${esc(fmtMin(row.sec))}${hw.min != null ? `／目標 ${hw.min}分` : ""}</dd>
        <dt>達成日</dt><dd>${row.done_at ? esc(mdw(row.done_at)) : "―"}</dd></dl>`;
    } catch (e) {
      if (isAuthError(e)) { m.close(); return ctx.authLost(e); }
      const box = m.el.querySelector("#cm-detail"); if (box) { box.className = "k-err"; box.textContent = errText(e); }
    }
  }
}
