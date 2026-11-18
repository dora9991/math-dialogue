// view-new.js — 「宿題を出す」
import { rpc, isAuthError, errText } from "./api.js";
import { esc, addDays, diffDays, validYmd, mdw, condText, autoTitle, loadUnits } from "./util.js";

const LS_CLASS = "kotsu-hw-class", LS_GRADE = "kotsu-hw-grade";
const lsGet = (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* 保存できなくても動く */ } };

// 入力の途中の状態（タブを行き来しても消えないように、モジュールの中で持つ）
const F = { day: "", target: "class", classId: "", userIds: new Set(), unit: null, grade: "", chapter: "", search: "", n: "", min: "", start: "", due: "", title: "", note: "", tried: false, busy: false, err: "" };
const toHalf = (s) => String(s).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
const num = (s) => { const t = toHalf(s).trim(); return t === "" ? null : /^\d+$/.test(t) ? parseInt(t, 10) : NaN; };

function resetDates(today) { F.day = today; F.start = today; F.due = addDays(today, 2); }

export function validate(f, today) {
  const e = {};
  if (!f.classId) e.class = "クラスをえらんでください。";
  if (f.target === "students" && f.classId && f.userIds.size === 0) e.students = "生徒を1人以上えらんでください。";
  const n = num(f.n), m = num(f.min), hasN = String(f.n).trim() !== "", hasM = String(f.min).trim() !== "";
  if (f.unit && !hasN) e.n = "小単元をえらんだときは、問題数（N問）も入れてください。";
  else if (!f.unit && hasN) e.n = "問題数（N問）は、小単元をえらんだときだけ出せます。";
  else if (hasN && (Number.isNaN(n) || n < 1 || n > 200)) e.n = "問題数は、1〜200 の整数で入れてください。";
  if (hasM && (Number.isNaN(m) || m < 1 || m > 240)) e.min = "時間は、1〜240 分の整数で入れてください。";
  if (!hasN && !hasM && !f.unit) e.any = "問題数（N問）か、時間（M分）の、どちらか（または両方）を入れてください。";
  if (!validYmd(f.start)) e.start = "開始日を入れてください。";
  if (!validYmd(f.due)) e.due = "期限の日を入れてください。";
  if (!e.start && !e.due) {
    if (f.due < f.start) e.due = "期限は、開始日と同じ日か、そのあとの日にしてください。";
    else if (f.due < today) e.due = "期限が、きょうより前です。きょう以降の日にしてください。";
    else if (diffDays(f.due, f.start) > 365) e.due = "期間が長すぎます（最長1年）。";
  }
  if ([...f.title.trim()].length > 60) e.title = "題は60字までです。";
  if ([...f.note.trim()].length > 200) e.note = "ひとことは200字までです。";
  return e;
}

export function buildArgs(f, token, unitNameStr) {
  const n = num(f.n), m = num(f.min);
  const t = f.title.trim() || autoTitle({ unitName: unitNameStr, n, min: m });
  return {
    p_token: token,
    p_class: f.target === "class" ? f.classId : null,
    p_users: f.target === "students" ? [...f.userIds] : null,
    p_title: t,
    p_unit: f.unit ? f.unit.id : null,
    p_n: f.unit ? n : null,
    p_min: m,
    p_start: f.start,
    p_due: f.due,
    p_note: f.note.trim() || null,
  };
}

export async function renderNew(ctx, el, my) {
  const today = ctx.today();
  if (F.day !== today) resetDates(today);
  if (!ctx.classes.length) {
    el.innerHTML = `<div class="k-empty" id="no-class"><div class="big">🏫</div><h2>まだ担当のクラスがありません</h2>管理者に「クラスの先生」に入れてもらってください。</div>`;
    return;
  }
  if (!F.classId || !ctx.classes.some((c) => c.id === F.classId)) {
    const last = lsGet(LS_CLASS);
    F.classId = ctx.classes.some((c) => c.id === last) ? last : ctx.classes[0].id;
    F.userIds = new Set();
  }
  let units = null;
  try { units = await loadUnits(); } catch { /* 下で案内 */ }
  if (ctx.nav !== my) return;
  if (!F.grade) F.grade = lsGet(LS_GRADE) || "J1";
  if (units && !units.grades.some((g) => g.id === F.grade)) F.grade = units.grades[0].id;

  const mine = ctx.classes.filter((c) => c.mine !== false), others = ctx.classes.filter((c) => c.mine === false);
  const opt = (c) => `<option value="${esc(c.id)}"${c.id === F.classId ? " selected" : ""}>${esc(c.name)}${c.n != null ? `（${c.n}人）` : ""}</option>`;
  const classSel = others.length
    ? `<optgroup label="担当のクラス">${mine.map(opt).join("")}</optgroup><optgroup label="ほかのクラス（管理者）">${others.map(opt).join("")}</optgroup>`
    : ctx.classes.map(opt).join("");

  el.innerHTML = `
  <div class="k-title"><h1>✏️ 宿題を出す</h1><span class="sub">生徒の画面に「📌 先生からの宿題」として出ます</span></div>
  ${ctx.unitsError ? `<div class="k-note" id="units-err">${esc(ctx.unitsError)}（時間だけの宿題は出せます）</div>` : ""}
  <form class="k-card" id="hwform" novalidate autocomplete="off">
    <div class="step"><span>1</span>だれに出す？</div>
    <div class="k-seg" id="f-target" role="group" aria-label="宛先">
      <button type="button" data-v="class">クラス全員</button><button type="button" data-v="students">生徒をえらぶ（個人宛て）</button>
    </div>
    <label class="k-f" id="g-class"><span>クラス</span><select id="f-class">${classSel}</select></label>
    <div id="g-students" hidden></div>

    <hr style="border:0;border-top:1px solid var(--k-line);margin:16px 0">
    <div class="step"><span>2</span>何をする？<small class="hint">（問題数 か 時間、どちらかだけでも、両方でも）</small></div>
    <div class="k-f" id="g-unit"><span>小単元（問題数を出すときにえらぶ）</span>
      <div class="up" id="up">
        <div class="up-sel" id="up-sel" hidden></div>
        <input class="k-input" id="f-search" type="search" placeholder="🔍 単元をさがす（例：加法、方程式、因数分解）" aria-label="単元をさがす" style="width:100%">
        <div class="up-grades" id="up-grades" role="group" aria-label="学年"></div>
        <label class="k-f" id="g-chapter" style="margin:4px 0 8px" hidden><span>章</span><select id="f-chapter"></select></label>
        <div class="up-list" id="up-list" role="listbox" aria-label="小単元"></div>
      </div>
    </div>
    <div class="k-fs">
      <div class="k-f" id="g-n"><span>問題数（N問）</span>
        <div class="numrow"><input id="f-n" inputmode="numeric" maxlength="3" aria-label="問題数" placeholder="10"><span>問</span></div>
        <div class="qnum" id="qn">${[5, 10, 20, 30, 50].map((v) => `<button type="button" data-n="${v}">${v}問</button>`).join("")}</div>
        <small id="n-hint">1〜200 問（まちがいも数えます）</small><span class="msg" id="m-n"></span></div>
      <div class="k-f" id="g-min"><span>学習時間（M分）</span>
        <div class="numrow"><input id="f-min" inputmode="numeric" maxlength="3" aria-label="学習時間（分）" placeholder="20"><span>分</span></div>
        <div class="qnum" id="qm">${[10, 15, 20, 30, 60].map((v) => `<button type="button" data-m="${v}">${v}分</button>`).join("")}</div>
        <small>1〜240 分（期間のあいだの学習時間の合計）</small><span class="msg" id="m-min"></span></div>
    </div>
    <div class="k-err" id="m-any" hidden></div>

    <hr style="border:0;border-top:1px solid var(--k-line);margin:16px 0">
    <div class="step"><span>3</span>いつまで？</div>
    <div class="k-fs">
      <label class="k-f" id="g-start"><span>開始日</span><input id="f-start" type="date"><small>きょうより前の日にすると、その日からの取り組みも数えます。</small><span class="msg" id="m-start"></span></label>
      <label class="k-f" id="g-due"><span>期限（この日の夜まで）</span><input id="f-due" type="date"><span class="msg" id="m-due"></span></label>
    </div>
    <div class="qnum" id="qd" aria-label="期限のかんたん入力"><button type="button" data-d="0">きょうまで</button><button type="button" data-d="1">あすまで</button><button type="button" data-d="2">あさってまで</button><button type="button" data-d="7">1週間後まで</button></div>

    <hr style="border:0;border-top:1px solid var(--k-line);margin:16px 0">
    <div class="step"><span>4</span>題・ひとこと</div>
    <label class="k-f" id="g-title"><span>題 <small>（空なら、自動でつけます）</small></span><input id="f-title" maxlength="60" placeholder=""><span class="msg" id="m-title"></span></label>
    <label class="k-f" id="g-note"><span>先生のひとこと <small>（生徒の画面に出ます・200字まで）</small></span><textarea id="f-note" rows="2" maxlength="200" placeholder="例：まずは解説を読んでから、ゆっくりでいいよ。"></textarea><small id="note-count"></small><span class="msg" id="m-note"></span></label>

    <div class="k-err" id="f-errs" hidden></div>
    <div class="preview" id="f-preview" aria-live="polite"></div>
    <div class="k-row" style="margin-top:14px"><button type="submit" class="k-btn big" id="f-submit">📌 宿題を出す</button><span class="hint" id="f-busy"></span></div>
  </form>`;

  const $ = (id) => el.querySelector("#" + id);
  const form = $("hwform");
  const cls = () => ctx.classes.find((c) => c.id === F.classId);

  // ── 値を画面にもどす ──
  $("f-n").value = F.n; $("f-min").value = F.min; $("f-start").value = F.start; $("f-due").value = F.due; $("f-title").value = F.title; $("f-note").value = F.note; $("f-search").value = F.search;

  // ── 小単元の一覧 ──
  const norm = (s) => toHalf(String(s)).toLowerCase().replace(/[\s　]+/g, "");
  function drawUnits() {
    const sel = $("up-sel");
    if (F.unit) { sel.hidden = false; sel.innerHTML = `<span>✔ ${esc(F.unit.gradeName)}・${esc(F.unit.name)}</span><button type="button" class="k-btn ghost sm x" id="up-clear">× 単元をはずす</button>`; }
    else { sel.hidden = true; sel.innerHTML = ""; }
    const list = $("up-list"), grades = $("up-grades");
    if (!units) { grades.innerHTML = ""; $("g-chapter").hidden = true; list.innerHTML = `<div class="up-none">小単元の一覧を読みこめませんでした。</div>`; return; }
    const q = norm(F.search);
    grades.innerHTML = units.grades.map((g) => `<button type="button" data-g="${g.id}" class="${!q && g.id === F.grade ? "on" : ""}">${esc(g.name)}</button>`).join("");
    const item = (u, sub) => `<button type="button" role="option" aria-selected="${F.unit && F.unit.id === u.id}" data-u="${esc(u.id)}" class="${F.unit && F.unit.id === u.id ? "on" : ""}"><span>${esc(u.name)}</span>${sub ? `<small>${esc(sub)}</small>` : ""}</button>`;
    if (q) {
      $("g-chapter").hidden = true;
      const hits = [];
      for (const g of units.grades) for (const c of g.chapters) for (const u of c.units) if (norm(`${g.name}${c.name}${u.name}`).includes(q)) hits.push([u, `${g.name}${c.name ? "・" + c.name : ""}`]);
      list.innerHTML = hits.length ? `<h4>けんさく結果 ${hits.length}件${hits.length > 80 ? "（先頭の80件）" : ""}</h4>${hits.slice(0, 80).map(([u, s]) => item(u, s)).join("")}` : `<div class="up-none">「${esc(F.search)}」に合う単元はありません。</div>`;
      return;
    }
    const g = units.grades.find((x) => x.id === F.grade) || units.grades[0];
    const named = g.chapters.filter((c) => c.name);
    const cs = $("f-chapter");
    if (named.length > 1) {
      $("g-chapter").hidden = false;
      if (F.chapter && !g.chapters.some((c) => c.name === F.chapter)) F.chapter = "";
      cs.innerHTML = `<option value="">すべての章（${g.chapters.reduce((s, c) => s + c.units.length, 0)}単元）</option>` + g.chapters.map((c) => `<option value="${esc(c.name)}"${c.name === F.chapter ? " selected" : ""}>${esc(c.name)}（${c.units.length}）</option>`).join("");
    } else { $("g-chapter").hidden = true; F.chapter = ""; }
    const shown = g.chapters.filter((c) => !F.chapter || c.name === F.chapter);
    list.innerHTML = shown.map((c) => `${c.name ? `<h4>${esc(c.name)}</h4>` : ""}${c.units.map((u) => item(u, "")).join("")}`).join("");
  }

  // ── クラスの生徒（個人宛て）──
  async function drawStudents() {
    const box = $("g-students");
    if (F.target !== "students") { box.hidden = true; return; }
    box.hidden = false;
    let list = ctx.students.get(F.classId);
    if (!list) {
      box.innerHTML = `<div class="k-load">生徒を読みこんでいます…</div>`;
      const want = F.classId;
      try {
        const r = await rpc("t_class", { p_token: ctx.token(), p_class: want });
        list = (r.students || []).map((s) => ({ id: s.id, no: s.no, nick: s.nick || s.login || "", login: s.login || "" })).sort((a, b) => (a.no ?? 9999) - (b.no ?? 9999) || String(a.nick).localeCompare(String(b.nick), "ja"));
        ctx.students.set(want, list);
      } catch (e) {
        if (isAuthError(e)) return ctx.authLost(e);
        if (F.classId === want) box.innerHTML = `<div class="k-err">${esc(errText(e))}</div>`;
        return;
      }
      if (ctx.nav !== my || F.classId !== want) return;
    }
    if (!list.length) { box.innerHTML = `<div class="k-note">このクラスには、まだ生徒がいません。</div>`; return; }
    box.innerHTML = `<div class="k-f" style="margin:6px 0"><span>生徒をえらぶ <small id="who-count"></small></span>
      <div class="k-row"><button type="button" class="k-btn ghost sm" data-w="all">全員</button><button type="button" class="k-btn ghost sm" data-w="none">はずす</button></div></div>
      <div class="who-list" id="who-list" role="group" aria-label="生徒">${list.map((s) => `<label class="${F.userIds.has(s.id) ? "on" : ""}"><input type="checkbox" value="${esc(s.id)}"${F.userIds.has(s.id) ? " checked" : ""}><span class="no">${s.no ?? ""}</span><span>${esc(s.nick || s.login)}</span></label>`).join("")}</div>
      <span class="msg" id="m-students" style="color:var(--k-ng);font-weight:800;font-size:12.5px"></span>`;
    countWho();
  }
  function countWho() { const c = el.querySelector("#who-count"); if (c) c.textContent = `（${F.userIds.size}人）`; }

  // ── 表示の更新（エラー・プレビュー）──
  const touched = new Set();   // 触った欄だけ、入力の途中でもエラーを出す（出すボタンを押したあとは全部）
  function refresh() {
    const e = validate(F, ctx.today());
    const show = (k, id, gid) => { const m = el.querySelector("#" + id), g = el.querySelector("#" + gid); const on = !!e[k] && (F.tried || touched.has(k)); if (m) m.textContent = on ? e[k] : ""; if (g) g.classList.toggle("bad", on); };
    show("n", "m-n", "g-n"); show("min", "m-min", "g-min"); show("start", "m-start", "g-start"); show("due", "m-due", "g-due"); show("title", "m-title", "g-title"); show("note", "m-note", "g-note");
    const ms = el.querySelector("#m-students"); if (ms) ms.textContent = F.tried && e.students ? e.students : "";
    const any = $("m-any"); any.hidden = !(F.tried && e.any); any.textContent = e.any || "";
    $("f-n").disabled = !F.unit;
    $("qn").querySelectorAll("button").forEach((b) => { b.disabled = !F.unit; });
    $("n-hint").textContent = F.unit ? "1〜200 問（まちがいも数えます）" : "↑ 小単元をえらぶと入れられます";
    $("note-count").textContent = `${[...F.note].length}/200字`;
    $("f-title").placeholder = autoTitle({ unitName: F.unit && F.unit.name, n: num(F.n), min: num(F.min) }) || "例：正負の意味・大小 10問";
    for (const b of $("f-target").querySelectorAll("button")) b.classList.toggle("on", b.dataset.v === F.target);
    const errs = Object.entries(e);
    const box = $("f-errs");
    if (F.tried && errs.length) { box.hidden = false; box.innerHTML = `入力をたしかめてください：<ul>${errs.map(([, m]) => `<li>${esc(m)}</li>`).join("")}</ul>`; }
    else if (F.err) { box.hidden = false; box.textContent = F.err; }
    else { box.hidden = true; box.innerHTML = ""; }
    // 出す内容の確認の文
    const pv = $("f-preview");
    if (errs.length) { pv.textContent = "入力をつづけてください。ここに、出す内容が出ます。"; pv.style.opacity = ".7"; }
    else {
      const c = cls(), nn = num(F.n), mm = num(F.min);
      const who = F.target === "class" ? `<b>${esc(c ? c.name : "")}</b> の全員${c && c.n != null ? `（${c.n}人）` : ""}` : `<b>${esc(c ? c.name : "")}</b> の <b>${F.userIds.size}人</b>（個人宛て）`;
      const title = F.title.trim() || autoTitle({ unitName: F.unit && F.unit.name, n: nn, min: mm });
      const cond = condText({ unit_id: F.unit && F.unit.id, unit_name: F.unit && F.unit.name, n: F.unit ? nn : null, min: mm });
      const days = diffDays(F.due, F.start) + 1;
      pv.style.opacity = "1";
      pv.innerHTML = `📌 ${who}に、「<b>${esc(title)}</b>」を出します。<br>内容：${esc(cond)}　／　期間：${esc(mdw(F.start))}〜${esc(mdw(F.due))}（${days}日間）`;
    }
  }

  // ── イベント ──
  form.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.id === "f-n") { F.n = t.value; touched.add("n"); }
    else if (t.id === "f-min") { F.min = t.value; touched.add("min"); }
    else if (t.id === "f-start") { F.start = t.value; touched.add("start"); }
    else if (t.id === "f-due") { F.due = t.value; touched.add("due"); }
    else if (t.id === "f-title") { F.title = t.value; touched.add("title"); }
    else if (t.id === "f-note") { F.note = t.value; touched.add("note"); }
    else if (t.id === "f-search") { F.search = t.value; drawUnits(); }
    else if (t.closest("#who-list") && t.type === "checkbox") { if (t.checked) F.userIds.add(t.value); else F.userIds.delete(t.value); t.closest("label").classList.toggle("on", t.checked); countWho(); }
    F.err = "";
    refresh();
  });
  form.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.id === "f-class") { F.classId = t.value; F.userIds = new Set(); lsSet(LS_CLASS, F.classId); drawStudents(); refresh(); }
    else if (t.id === "f-chapter") { F.chapter = t.value; drawUnits(); }
  });
  form.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.closest("#f-target")) { F.target = b.dataset.v; drawStudents(); refresh(); }
    else if (b.dataset.g) { F.grade = b.dataset.g; F.chapter = ""; F.search = ""; $("f-search").value = ""; lsSet(LS_GRADE, F.grade); drawUnits(); }
    else if (b.dataset.u) {
      const id = b.dataset.u;
      const info = units.grades.flatMap((g) => g.chapters.map((c) => ({ g, c }))).map(({ g, c }) => { const u = c.units.find((x) => x.id === id); return u ? { id, name: u.name, gradeName: g.name, chapter: c.name } : null; }).find(Boolean);
      F.unit = info;
      if (String(F.n).trim() === "") { F.n = "10"; $("f-n").value = "10"; }
      drawUnits(); refresh();
    }
    else if (b.id === "up-clear") { F.unit = null; F.n = ""; $("f-n").value = ""; drawUnits(); refresh(); }
    else if (b.dataset.n) { F.n = b.dataset.n; $("f-n").value = F.n; touched.add("n"); F.err = ""; refresh(); }
    else if (b.dataset.m) { F.min = b.dataset.m; $("f-min").value = F.min; touched.add("min"); F.err = ""; refresh(); }
    else if (b.dataset.d != null && b.closest("#qd")) { F.due = addDays(ctx.today(), Number(b.dataset.d)); if (F.start > F.due) { F.start = ctx.today(); $("f-start").value = F.start; } $("f-due").value = F.due; touched.add("due"); F.err = ""; refresh(); }
    else if (b.dataset.w) {
      const list = ctx.students.get(F.classId) || [];
      F.userIds = new Set(b.dataset.w === "all" ? list.map((s) => s.id) : []);
      el.querySelectorAll("#who-list input").forEach((i) => { i.checked = F.userIds.has(i.value); i.closest("label").classList.toggle("on", i.checked); });
      countWho(); refresh();
    }
  });
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (F.busy) return;
    F.tried = true; F.err = "";
    const e = validate(F, ctx.today());
    refresh();
    if (Object.keys(e).length) {
      const first = { class: "g-class", students: "g-students", unit: "g-unit", n: "g-n", any: "g-n", min: "g-min", start: "g-start", due: "g-due", title: "g-title", note: "g-note" }[Object.keys(e)[0]];
      const t = first && el.querySelector("#" + first); if (t) t.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    F.busy = true;
    const btn = $("f-submit"); btn.disabled = true; $("f-busy").textContent = "送っています…";
    try {
      const args = buildArgs(F, ctx.token(), F.unit && F.unit.name);
      const r = await rpc("hw_t_create", args);
      ctx.flash = { id: r && r.id, title: args.p_title, target: F.target === "class" ? (cls() ? cls().name : "") : `${F.userIds.size}人` };
      // 出したので、入力をもどす（クラスと学年は、そのまま）
      F.unit = null; F.n = ""; F.min = ""; F.title = ""; F.note = ""; F.search = ""; F.userIds = new Set(); F.tried = false; resetDates(ctx.today());
      ctx.toast("出しました");
      ctx.go("#list");
    } catch (e2) {
      if (isAuthError(e2)) return ctx.authLost(e2);
      F.err = errText(e2);
      F.busy = false; btn.disabled = false; $("f-busy").textContent = "";
      refresh();
      $("f-errs").scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    } finally { F.busy = false; }
  });

  drawUnits(); drawStudents(); refresh();
}
