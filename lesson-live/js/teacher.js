/* ============================================================
   授業ライブ — 先生の画面
   ============================================================ */
(function () {
  "use strict";
  const { $, esc, Store, toast, modal, confirmBox, promptBox, mmss, hm, md, ymd, Clock, qrSVG, copyText, downloadCSV, on } = UI;
  const app = $("#app"), tabsEl = $("#tabs"), clsSel = $("#clsSel"), screenBtn = $("#screenBtn");
  const K = { tok: "ll:t:token", cls: "ll:t:class", tab: "ll:t:tab" };
  const FACE = ["", "😣", "😐", "🙂", "😄"];
  const ic = (n, c) => IC.svg(n, c);
  const secHead = (icon, eyebrow, title, right) => `<div class="row between" style="margin-bottom:10px"><div class="sec-head" style="margin:0">${ic(icon)}<div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div></div>${right || ""}</div>`;
  $("#brand").insertAdjacentHTML("afterbegin", IC.emblem());
  tabsEl.querySelectorAll("[data-ic]").forEach(b => {
    const t = b.textContent.trim();
    if (t) { b.title = t; b.setAttribute("aria-label", t); }
    b.innerHTML = ic(b.dataset.ic) + (t ? `<span class="lb">${esc(t)}</span>` : "");
  });
  screenBtn.insertAdjacentHTML("afterbegin", ic("screen"));
  const LVL = ["−", "○", "◎"];

  const T = {
    token: null, classes: [], cls: null, tab: Store.get(K.tab, "live"), pulseT: null, P: null,
    posts: new Map(), since: 0, lessonKey: null, sig: {}, rf: { lesson: "all", flag: "all", cat: "all", view: "list", student: null },
    qa: { lesson: null }, log: { key: null },
  };

  /* ---------- 認証 ---------- */
  function tokenGet() { const t = Store.get(K.tok); if (t && t.exp > Date.now()) return t.v; Store.del(K.tok); return null; }
  function tokenSet(v) { Store.set(K.tok, { v, exp: Date.now() + 11.5 * 3600e3 }); }
  async function call(fn, args) {
    const r = await API.rpc(fn, Object.assign({ p_token: T.token }, args || {}));
    if (r && r.error === "auth") { logout(true); throw new Error("auth"); }
    return r;
  }
  function logout(expired) {
    clearTimeout(T.pulseT);
    if (T.token && !expired) API.rpc("live_t_logout", { p_token: T.token }).catch(() => {});
    Store.del(K.tok); T.token = null; T.cls = null;
    renderLogin(expired ? "ログインの期限が切れました（12時間）。もう一度ログインしてください。" : "");
  }

  async function boot() {
    applyTheme();
    T.token = tokenGet();
    if (!T.token) return renderLogin();
    try { await loadClasses(); } catch (e) { if (e.message !== "auth") app.innerHTML = `<div class="card"><p>サーバーにつながりません（${esc(API.config.name)}）。</p><button class="btn" id="rt">再読み込み</button></div>`; const b = $("#rt"); if (b) b.onclick = () => location.reload(); return; }
    afterClasses();
  }

  function renderLogin(msg) {
    clsSel.hidden = true; tabsEl.hidden = true; screenBtn.hidden = true;
    app.innerHTML = `<div class="card stack enter" style="max-width:460px;margin:40px auto;padding:26px 22px">
      <div class="center">
        <div style="width:72px;margin:0 auto 6px">${IC.emblem()}</div>
        <div class="eyebrow gold">Astra Academy · Teacher's Console</div>
        <h1 style="font-size:30px;margin:6px 0 2px;letter-spacing:.12em">授業ライブ</h1>
        <p class="small muted mb0">先生用の管制室。授業の操作と、小テスト・振り返りの分析</p>
      </div>
      <form id="lf" class="stack" novalidate>
        <input type="text" name="username" value="teacher" autocomplete="username" hidden>
        <label class="f" for="tp">合言葉（8文字以上）</label>
        <input class="in" id="tp" type="password" autocomplete="current-password" maxlength="128">
        <button class="btn primary big slant" type="submit">${ic("play")} ログイン</button>
        <div id="lm">${msg ? `<div class="msg warn">${esc(msg)}</div>` : ""}</div>
      </form>
      <p class="small muted mb0">接続先：${esc(API.config.name)}。ログインは12時間有効です（授業中つけっぱなしでOK）。</p>
      ${UI.isLocal() ? `<p class="msg info small mb0">🧪 検証用サーバーです。合言葉は <b class="kbd">test-pass-1234</b>（半角）。旧 quiz/ のPINとは別です。</p>` : ""}
    </div>`;
    $("#tp").focus();
    $("#lf").addEventListener("submit", async e => {
      e.preventDefault();
      const say = (t, k) => { $("#lm").innerHTML = `<div class="msg ${k || "bad"}">${t}</div>`; };
      say("確認しています…", "info");
      try {
        const r = await API.rpc("live_t_login", { p_pass: UI.pw($("#tp").value) });
        if (r.ok) { tokenSet(r.token); T.token = r.token; await loadClasses(); return afterClasses(); }
        if (r.error === "not_setup") return say(`まだ合言葉が設定されていません。Supabase の SQL Editor で次の1行を実行してください：<br><code class="kbd">select live_admin_set_teacher_pass('8文字以上の合言葉');</code>`, "warn");
        if (r.error === "locked") return say("何度もまちがえたため、しばらくログインできません（15分ほど）。");
        say("合言葉がちがいます。10分に8回まちがえると、15分ほどログインできなくなります。");
      } catch (err) { say("サーバーにつながりませんでした"); }
    });
  }

  async function loadClasses() {
    const r = await call("live_t_classes");
    T.classes = r.classes || [];
  }
  function afterClasses() {
    const saved = Store.get(K.cls);
    T.cls = T.classes.find(c => c.id === saved) || T.classes[0] || null;
    fillClassSel();
    if (!T.cls) return renderClassAdmin();
    tabsEl.hidden = false; screenBtn.hidden = false;
    showTab(T.tab);
    tpulse();
  }
  function fillClassSel() {
    clsSel.hidden = false;
    clsSel.innerHTML = T.classes.map(c => `<option value="${c.id}" ${T.cls && c.id === T.cls.id ? "selected" : ""}>${esc(c.school)} ${esc(c.label)}</option>`).join("") + `<option value="__admin">＋ クラスを追加・管理</option>`;
  }
  clsSel.addEventListener("change", () => {
    if (clsSel.value === "__admin") { fillClassSel(); return renderClassAdmin(); }
    T.cls = T.classes.find(c => c.id === clsSel.value);
    Store.set(K.cls, T.cls.id);
    T.posts.clear(); T.since = 0; T.P = null; T.sig = {};
    tabsEl.hidden = false; screenBtn.hidden = false;
    showTab(T.tab);
    tpulse();
  });
  screenBtn.addEventListener("click", () => { if (T.cls) window.open(`screen.html?c=${encodeURIComponent(T.cls.id)}`, "ll-screen"); });

  function renderClassAdmin() {
    tabsEl.hidden = true; screenBtn.hidden = true;
    clearTimeout(T.pulseT);
    app.innerHTML = `<div class="stack" style="max-width:760px;margin:0 auto">
      <div class="card enter">
        ${secHead("plus", "New Class", "クラスを追加")}
        <p class="small muted">学校コードは「アルファベット1文字-数字」（例 E-10）。<b>学校名そのものは使わず</b>、先生が決めた合言葉にします（どの学校かの対応表は、このツールにもメモにも書かないでください）。</p>
        <div class="row">
          <input class="in" id="ns" placeholder="E-10" style="max-width:120px" maxlength="5" autocapitalize="characters">
          <select class="in" id="ng" style="max-width:100px">${[1, 2, 3].map(g => `<option value="${g}">${g}年</option>`).join("")}</select>
          <select class="in" id="nc" style="max-width:100px">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => `<option value="${c}">${c}組</option>`).join("")}</select>
          <button class="btn primary" id="nadd">${ic("plus")} 追加する</button>
        </div>
        <div id="nm"></div>
      </div>
      <div class="card enter">
        ${secHead("users", "Classes", "クラス一覧")}
        ${T.classes.length ? `<div class="stack">${T.classes.map(c => `<div class="row between" style="border-top:1px solid var(--line);padding-top:10px">
          <div><b>${esc(c.school)} ${esc(c.label)}</b> <span class="small muted">生徒 ${c.students} 人・いま ${c.online} 人接続${c.lesson_id ? `・授業中 ${esc(c.lesson_id)}` : ""}</span></div>
          <button class="btn small primary" data-open="${c.id}">${ic("play")} 開く</button></div>`).join("")}</div>` : `<p class="empty">まだクラスがありません。上で追加してください。</p>`}
      </div></div>`;
    const ns = $("#ns");
    ns.value = Store.get("ll:t:school", "");
    $("#nadd").addEventListener("click", async () => {
      const school = ns.value.trim().toUpperCase().replace(/ー|－/g, "-");
      if (!/^[A-Z]-[0-9]{1,3}$/.test(school)) { $("#nm").innerHTML = `<div class="msg bad">学校コードは「E-10」のような形にしてください</div>`; return; }
      Store.set("ll:t:school", school);
      const r = await call("live_t_class_create", { p_school: school, p_grade: +$("#ng").value, p_class_no: +$("#nc").value });
      if (r.error === "exists") { $("#nm").innerHTML = `<div class="msg warn">そのクラスはもうあります</div>`; return; }
      if (!r.ok) { $("#nm").innerHTML = `<div class="msg bad">追加できませんでした（${esc(r.error)}）</div>`; return; }
      await loadClasses();
      T.cls = T.classes.find(c => c.id === r.id);
      Store.set(K.cls, T.cls.id);
      toast("クラスを追加しました", "good");
      fillClassSel(); tabsEl.hidden = false; screenBtn.hidden = false;
      showTab("students"); tpulse();
    });
    on(app, "click", "[data-open]", (e, b) => {
      T.cls = T.classes.find(c => c.id === b.dataset.open);
      if (!T.cls) return;
      Store.set(K.cls, T.cls.id); fillClassSel();
      T.posts.clear(); T.since = 0; T.P = null; T.sig = {};
      tabsEl.hidden = false; screenBtn.hidden = false; showTab("live"); tpulse();
    });
  }

  /* ---------- タブ ---------- */
  function showTab(tab) {
    T.tab = tab; Store.set(K.tab, tab);
    tabsEl.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
    T.sig = {};
    if (tab === "live") renderLive();
    if (tab === "quiz") renderQuizTab();
    if (tab === "refl") renderReflTab();
    if (tab === "log") renderLogTab();
    if (tab === "students") renderStudentsTab();
    if (tab === "bank") renderBankTab();
    if (tab === "settings") renderSettings();
  }
  tabsEl.addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) showTab(b.dataset.tab); });

  /* ---------- 確認（数秒ごと） ---------- */
  async function tpulse() {
    clearTimeout(T.pulseT);
    if (!T.cls || !T.token) return;
    try {
      const r = await call("live_t_pulse", { p_class_id: T.cls.id, p_since: T.since });
      if (r.error) throw new Error(r.error);
      Clock.sync(r.now);
      const key = (r.state.lesson_id || "") + "|" + (r.state.lesson_started_at || "");
      if (key !== T.lessonKey) { T.lessonKey = key; T.posts.clear(); T.since = 0; if (T.P) { T.P = r; return tpulse(); } }
      (r.posts || []).forEach(p => { T.posts.set(p.id, p); T.since = Math.max(T.since, p.id); });
      (r.post_meta || []).forEach(m => { const p = T.posts.get(m.id); if (p) Object.assign(p, m); });
      T.P = r;
      if (T.tab === "live") updateLive();
    } catch (e) {
      if (e.message === "auth") return;
    }
    T.pulseT = setTimeout(tpulse, document.hidden ? 10000 : 2500);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && T.cls && T.token) tpulse(); });

  async function setState(patch, okMsg) {
    try {
      const r = await call("live_t_set", { p_class_id: T.cls.id, p_patch: patch });
      if (!r.ok) { toast("変更できませんでした（" + (r.error || "") + "）", "bad"); return false; }
      if (okMsg) toast(okMsg, "good");
      T.sig = {};
      await tpulse();
      return true;
    } catch (e) { if (e.message !== "auth") toast("通信できませんでした", "bad"); return false; }
  }

  /* ============================================================
     ライブ（授業中の操作パネル）
     ============================================================ */
  function lessonOptions(sel, withNone) {
    return (withNone ? `<option value="">（えらぶ）</option>` : "") + LL.UNITS.map(u => `<optgroup label="${u.no}章 ${esc(u.name)}">${LL.lessonsOf(u.no).map(L => `<option value="${L.id}" ${L.id === sel ? "selected" : ""}>${L.id} ${esc(L.title)}</option>`).join("")}</optgroup>`).join("");
  }
  const prevLessonId = id => {
    const i = LL.LESSONS.findIndex(L => L.id === id);
    return i > 0 ? LL.LESSONS[i - 1].id : id;
  };

  function renderLive() {
    app.innerHTML = `<div class="cockpit">
      <div class="stack col1"><div class="card" id="ctl"></div></div>
      <div class="stack col2">
        <div class="card" id="room"></div>
        <div class="card" id="rx"></div>
      </div>
      <div class="stack col3">
        <div id="pollview"></div>
        <div id="quizview"></div>
        <div class="card" id="voices"></div>
      </div></div>`;
    updateLive();
    if (!T.clockIv) T.clockIv = setInterval(() => { if (T.tab === "live") liveClock(); }, 500);
  }

  function updateLive() {
    if (!T.P || T.tab !== "live" || !$("#ctl")) return;
    const s = T.P.state;
    const ctlSig = JSON.stringify([s.lesson_id, s.meate, s.notice, s.quiz_lesson, s.quiz_limit_sec, s.reflect_lesson, s.reflect_mode, s.timer_end, s.task_no, s.task_label, s.poll && [s.poll.id, s.poll.open, s.poll.show], s.share_posts]);
    const ctl = $("#ctl");
    if (T.sig.ctl !== ctlSig && !ctl.contains(document.activeElement)) { T.sig.ctl = ctlSig; renderControls(ctl, s); }
    renderRoom();
    renderRx();
    renderPollView();
    renderQuizView();
    renderVoices();
  }

  function renderControls(el, s) {
    const L = s.lesson_id ? LL.lesson(s.lesson_id) : null;
    const pickL = Store.get("ll:t:pick", "1-1");
    const quizDefault = s.quiz_lesson || (L ? L.id : pickL);
    const reflDefault = s.reflect_lesson || (L ? L.id : pickL);
    const limitMin = s.quiz_limit_sec ? Math.round(s.quiz_limit_sec / 60) : Math.round(((LL.lesson(quizDefault) || {}).limit || 420) / 60);
    const poll = s.poll;
    el.innerHTML = `
      ${secHead("sparkle", "Control", "授業の操作")}
      <div class="ctl">
        <h3><span class="t">${ic("play")} 授業</span> ${L ? `<span class="chip g">授業中</span>` : `<span class="chip">授業していません</span>`}</h3>
        ${L ? `<div style="margin:4px 0 8px"><b><span class="lesson-no">${esc(L.id)}</span> ${esc(L.title)}</b><div class="small muted">${hm(s.lesson_started_at)} 開始</div></div>` : ""}
        <div class="row"><select class="in grow" id="c-lesson">${lessonOptions(L ? L.id : pickL)}</select></div>
        <div class="row" style="margin-top:8px">
          <button class="btn ${L ? "blue" : "primary big slant"} grow" data-c="start" ${L ? "disabled" : ""}>${L ? `${ic("refresh")} 授業を選ぶと切りかえられます` : `${ic("play")} この授業を始める`}</button>
          ${L ? `<button class="btn ghost" data-c="end">授業を終える</button>` : ""}
        </div>
      </div>
      <div class="ctl">
        <h3><span class="t">${ic("star")} めあて</span></h3>
        <div class="row"><input class="in grow" id="c-meate" maxlength="120" value="${esc(s.meate || (L ? L.goal : ""))}" placeholder="めあて"><button class="btn small" data-c="meate">配信</button></div>
      </div>
      <div class="ctl">
        <h3><span class="t">${ic("megaphone")} お知らせ</span> ${s.notice ? `<button class="btn small ghost" data-c="notice-clear">消す</button>` : ""}</h3>
        <div class="row"><input class="in grow" id="c-notice" maxlength="200" value="${esc(s.notice || "")}" placeholder="例：ノートに式も書こう"><button class="btn small" data-c="notice">配信</button></div>
      </div>
      <div class="ctl">
        <h3><span class="t">${ic("clock")} タイマー</span> <span id="c-tleft" class="chip"></span></h3>
        <div class="row">${[1, 3, 5, 7, 10].map(m => `<button class="btn small" data-timer="${m * 60}">${m}分</button>`).join("")}
          <input class="in" id="c-tmin" type="number" min="1" max="120" placeholder="分" style="width:70px;min-height:34px"></div>
        <div class="row" style="margin-top:6px"><input class="in grow" id="c-tlabel" maxlength="40" placeholder="ラベル（例：問題演習）" value="${esc(s.timer_label || "")}" style="min-height:36px">
          <button class="btn small" data-c="timer-custom">開始</button>${s.timer_end ? `<button class="btn small ghost" data-c="timer-stop">止める</button>` : ""}</div>
      </div>
      <div class="ctl">
        <h3><span class="t">${ic("task")} 課題（できた！ボタン）</span></h3>
        ${s.task_no ? `<div class="small">いま：<b>${esc(s.task_label || "課題 " + s.task_no)}</b></div>` : ""}
        <div class="row" style="margin-top:6px"><input class="in grow" id="c-task" maxlength="60" placeholder="例：教科書の問1〜3" style="min-height:36px"><button class="btn small" data-c="task">${s.task_no ? "次の課題へ" : "課題を出す"}</button></div>
      </div>
      <div class="ctl">
        <h3><span class="t">${ic("quiz")} 小テスト</span> ${s.quiz_lesson ? `<span class="chip p">配布中</span>` : ""}</h3>
        <div class="row"><select class="in grow" id="c-quiz">${lessonOptions(quizDefault)}</select></div>
        <div class="row" style="margin-top:6px">
          <label class="small">制限 <input class="in" id="c-qmin" type="number" min="1" max="60" value="${limitMin}" style="width:64px;min-height:34px"> 分</label>
          ${s.quiz_lesson ? `<button class="btn small bad" data-c="quiz-stop">${ic("stop")} 締め切る</button>` : `<button class="btn small primary" data-c="quiz-start">${ic("play")} 配布する</button>`}
          ${!s.quiz_lesson && L ? `<button class="btn small ghost" data-c="quiz-prev" title="前の授業の内容で小テスト">前回の内容で</button>` : ""}
        </div>
      </div>
      <div class="ctl">
        <h3><span class="t">${ic("quill")} 振り返り</span> ${s.reflect_lesson ? `<span class="chip p">受付中</span>` : ""}</h3>
        <div class="row"><select class="in grow" id="c-refl">${lessonOptions(reflDefault)}</select></div>
        <div class="row" style="margin-top:6px">
          <div class="seg" id="c-rmode"><button data-rm="light" class="${s.reflect_mode !== "deep" ? "on" : ""}">ふだん</button><button data-rm="deep" class="${s.reflect_mode === "deep" ? "on" : ""}">じっくり（単元末）</button></div>
          ${s.reflect_lesson ? `<button class="btn small bad" data-c="refl-stop">${ic("stop")} 締め切る</button>` : `<button class="btn small primary" data-c="refl-start">${ic("play")} 受付開始</button>`}
        </div>
      </div>
      <div class="ctl">
        <h3><span class="t">${ic("poll")} クイック投票</span> ${poll ? `<span class="chip ${poll.open ? "p" : ""}">${poll.open ? "受付中" : "締め切り"}</span>` : ""}</h3>
        ${poll ? `<div class="small">${esc(poll.q || { scale: "理解度", abcd: "A〜D", tf: "○×", num: "数値・式", text: "ひとこと" }[poll.kind])}</div>
          <div class="row" style="margin-top:6px">
            ${poll.open ? `<button class="btn small" data-c="poll-close">締め切る</button>` : `<button class="btn small" data-c="poll-reopen">再開</button>`}
            ${poll.show ? `<button class="btn small" data-c="poll-hide">結果をかくす</button>` : `<button class="btn small primary" data-c="poll-show">生徒に結果を見せる</button>`}
            <button class="btn small ghost" data-c="poll-clear">終わる</button>
          </div>`
        : `<div class="seg" id="c-pkind">${[["scale", "理解度"], ["abcd", "A〜D"], ["tf", "○×"], ["num", "数値・式"], ["text", "ひとこと"]].map(([k, t], i) => `<button data-pk="${k}" class="${i === 0 ? "on" : ""}">${t}</button>`).join("")}</div>
          <input class="in" id="c-pq" maxlength="200" placeholder="質問文（空なら『今の理解度は？』など）" style="margin-top:6px;min-height:38px">
          <div id="c-pextra"></div>
          <button class="btn small primary" style="margin-top:8px" data-c="poll-start">${ic("play")} 出す</button>`}
      </div>
      <div class="ctl">
        <h3><span class="t">${ic("gear")} その他</span></h3>
        <label class="check"><input type="checkbox" id="c-share" ${s.share_posts !== false ? "checked" : ""}> 質問をクラス全員に見せる（名前は出ない）</label>
        <div class="row" style="margin-top:6px"><button class="btn small" data-c="clear-lost">「わからない」を全員リセット</button><button class="btn small" data-c="clear-hand">挙手を全員おろす</button></div>
      </div>`;
    const pk = el.querySelector("#c-pkind");
    if (pk) {
      const extra = () => {
        const k = pk.querySelector(".on").dataset.pk;
        const box = el.querySelector("#c-pextra");
        if (k === "abcd") box.innerHTML = `<div class="row" style="margin-top:6px">${"ABCD".split("").map(c => `<input class="in" data-opt="${c}" placeholder="${c}" style="width:22%;min-height:36px">`).join("")}</div><label class="small">正解（任意）<select class="in" id="c-pans" style="width:auto;min-height:34px"><option value="">なし</option>${"ABCD".split("").map(c => `<option>${c}</option>`).join("")}</select></label>`;
        else if (k === "tf") box.innerHTML = `<label class="small">正解（任意）<select class="in" id="c-pans" style="width:auto;min-height:34px"><option value="">なし</option><option>○</option><option>×</option></select></label>`;
        else if (k === "num") box.innerHTML = `<div class="row" style="margin-top:6px"><label class="small">答えの種類 <select class="in" id="c-pmode" style="width:auto;min-height:34px"><option value="num">数</option><option value="lin">文字式</option><option value="coord">座標</option><option value="rel">等式・不等式</option></select></label><input class="in" id="c-pans" placeholder="正解（任意）例: -5/6" style="width:160px;min-height:34px"></div>`;
        else box.innerHTML = "";
      };
      pk.addEventListener("click", e => { const b = e.target.closest("[data-pk]"); if (!b) return; pk.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); extra(); });
      extra();
    }
    const rm = el.querySelector("#c-rmode");
    rm.addEventListener("click", e => {
      const b = e.target.closest("[data-rm]"); if (!b) return;
      rm.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
      if (s.reflect_lesson) setState({ reflect_mode: b.dataset.rm }, b.dataset.rm === "deep" ? "じっくりモードにしました" : "ふだんモードにしました");
    });
    el.querySelector("#c-lesson").addEventListener("change", e => {
      Store.set("ll:t:pick", e.target.value);
      if (!L) return;
      const btn = el.querySelector('[data-c="start"]'), same = e.target.value === L.id;
      btn.disabled = same;
      btn.innerHTML = same ? `${ic("refresh")} 授業を選ぶと切りかえられます` : `${ic("refresh")} この授業に切りかえる`;
    });
    el.querySelector("#c-share").addEventListener("change", e => setState({ share_posts: e.target.checked }, e.target.checked ? "質問をクラスに公開します" : "質問は先生だけが見ます"));
    el.querySelector("#c-quiz").addEventListener("change", e => { const Lq = LL.lesson(e.target.value); if (Lq) el.querySelector("#c-qmin").value = Math.round(Lq.limit / 60); });
    liveClock();
  }

  on(app, "click", "[data-timer]", (e, b) => {
    if (T.tab !== "live") return;
    setState({ timer_sec: +b.dataset.timer, timer_label: ($("#c-tlabel") || {}).value || "" }, `タイマー ${+b.dataset.timer / 60} 分を開始`);
  });
  on(app, "click", "[data-c]", async (e, b) => {
    if (T.tab !== "live") return;
    const c = b.dataset.c, s = T.P.state;
    const v = id => ($(id) || {}).value;
    if (c === "start") {
      const id = v("#c-lesson"), L = LL.lesson(id);
      if (s.lesson_id && s.lesson_id !== id && !(await confirmBox("授業を切りかえますか？", `<p>${esc(L.id)} ${esc(L.title)} に切りかえます。タイマー・投票・課題・生徒の「わからない」などはリセットされます。</p>`, "切りかえる"))) return;
      await setState({ lesson_id: id, meate: L.goal }, `${L.id} を始めました`);
    }
    if (c === "end") {
      const ok = await confirmBox("授業を終えますか？", `<p>反応ボタンが止まります。${s.quiz_lesson || s.reflect_lesson ? "<b>小テスト・振り返りの受付はそのまま続きます</b>（家で書かせたいときに便利）。必要なら個別に締め切ってください。" : ""}</p>`, "終える");
      if (ok) await setState({ lesson_id: null }, "授業を終えました");
    }
    if (c === "meate") await setState({ meate: v("#c-meate") }, "めあてを配信しました");
    if (c === "notice") await setState({ notice: v("#c-notice") }, "お知らせを配信しました");
    if (c === "notice-clear") await setState({ notice: "" }, "お知らせを消しました");
    if (c === "timer-custom") { const m = +v("#c-tmin"); if (!(m > 0)) return toast("分を入れてください"); await setState({ timer_sec: Math.round(m * 60), timer_label: v("#c-tlabel") }, `タイマー ${m} 分を開始`); }
    if (c === "timer-stop") await setState({ timer_stop: true }, "タイマーを止めました");
    if (c === "task") await setState({ task_next: true, task_label: v("#c-task") || "" }, "課題を出しました（できた！がリセットされます）");
    if (c === "quiz-start" || c === "quiz-prev") {
      const id = c === "quiz-prev" ? prevLessonId(s.lesson_id) : v("#c-quiz");
      const L = LL.lesson(id);
      const min = +v("#c-qmin") || Math.round(L.limit / 60);
      await setState({ quiz_lesson: id, quiz_limit_sec: Math.round(min * 60) }, `小テスト ${id} を配布しました`);
    }
    if (c === "quiz-stop") {
      const q = T.P.quiz || { n: 0 };
      const ok = await confirmBox("小テストを締め切りますか？", `<p>提出 ${q.n} / ${T.P.roster.length} 人。締め切ると、まだの生徒は提出できなくなります（解答は生徒の端末に残ります）。</p>`, "締め切る", true);
      if (ok) await setState({ quiz_lesson: null }, "小テストを締め切りました");
    }
    if (c === "refl-start") {
      const mode = $("#c-rmode .on").dataset.rm;
      await setState({ reflect_lesson: v("#c-refl"), reflect_mode: mode }, "振り返りの受付を始めました");
    }
    if (c === "refl-stop") await setState({ reflect_lesson: null }, "振り返りを締め切りました");
    if (c === "poll-start") {
      const kind = $("#c-pkind .on").dataset.pk;
      const poll = { kind, q: v("#c-pq") || "" };
      const ans = v("#c-pans");
      if (ans) poll.answer = ans;
      if (kind === "abcd") poll.options = ["A", "B", "C", "D"].map(c2 => (($(`[data-opt="${c2}"]`) || {}).value || "").trim()).map((o, i) => o || "ABCD"[i]);
      if (kind === "num") poll.mode = v("#c-pmode") || "num";
      await setState({ poll }, "投票を出しました");
    }
    if (c === "poll-close") await setState({ poll_open: false }, "締め切りました");
    if (c === "poll-reopen") await setState({ poll_open: true });
    if (c === "poll-show") await setState({ poll_open: false, poll_show: true }, "生徒に結果を見せました");
    if (c === "poll-hide") await setState({ poll_show: false });
    if (c === "poll-clear") await setState({ poll_clear: true });
    if (c === "clear-lost" || c === "clear-hand") {
      await call("live_t_status_clear", { p_class_id: T.cls.id, p_account_id: null, p_what: c === "clear-lost" ? "lost" : "hand" });
      toast(c === "clear-lost" ? "「わからない」をリセットしました" : "挙手をおろしました", "good"); tpulse();
    }
  });

  function liveClock() {
    const s = T.P && T.P.state;
    const el = $("#c-tleft");
    if (!el || !s) return;
    if (!s.timer_end) { el.textContent = ""; el.className = "chip"; return; }
    const left = (new Date(s.timer_end).getTime() - Clock.now()) / 1000;
    el.textContent = left > 0 ? "残り " + mmss(left) : "時間です";
    el.className = "chip " + (left <= 0 ? "b" : left < 30 ? "w" : "p");
  }

  function setBox(id, sig, html, after) {
    if (T.sig[id] === sig) return;
    T.sig[id] = sig;
    const el = $("#" + id); if (!el) return;
    el.innerHTML = html;
    if (after) after(el);
  }

  // 教室のようす（座席・挙手・ヘルプ）
  function renderRoom() {
    const P = T.P, R = P.roster, s = P.state;
    const online = R.filter(x => x.online).length;
    const lost = R.filter(x => x.lost), hand = R.filter(x => x.hand).sort((a, b) => a.hand.localeCompare(b.hand)), help = R.filter(x => x.help).sort((a, b) => a.help.localeCompare(b.help));
    const done = R.filter(x => x.done).length;
    const sig = JSON.stringify(R) + s.task_no;
    setBox("room", sig, `
      ${secHead("users", "Classroom", "いまの教室", `<button class="btn small violet" data-pickone title="接続中の生徒から1人を選ぶ">${ic("dice")} ランダム指名</button>`)}
      <div class="meters" style="margin:10px 0">
        <div class="meter m-online"><div class="k">${ic("wave")} 接続</div><div class="n">${online}<small class="muted" style="font-size:14px"> / ${R.length}</small></div></div>
        <div class="meter m-lost ${lost.length ? "hot" : ""}"><div class="k">${ic("question")} わからない</div><div class="n">${lost.length}</div></div>
        <div class="meter m-hand"><div class="k">${ic("hand")} 挙手</div><div class="n">${hand.length}</div></div>
        <div class="meter m-help ${help.length ? "hot" : ""}"><div class="k">${ic("lifebuoy")} ヘルプ</div><div class="n">${help.length}</div></div>
      </div>
      ${s.task_no ? `<div class="hbar" style="grid-template-columns:90px 1fr 70px"><span class="small"><b>できた！</b></span><div class="bar good"><i style="width:${R.length ? Math.round(done / R.length * 100) : 0}%"></i></div><span><b>${done}</b> / ${R.length}</span></div>` : ""}
      ${R.length && online < R.length ? `<p class="small muted mb0">未接続：${R.filter(x => !x.online).map(x => x.no).join(", ")}</p>` : ""}
      <div class="legend" style="margin-top:8px"><span><i style="background:rgba(120,200,255,.5)"></i>接続中</span><span><i style="background:#ff8fa8"></i>わからない</span><span><i style="background:#b19cff"></i>挙手</span><span><i style="background:#ffc56b"></i>ヘルプ</span><span>✓ できた</span><span>（番号を押すと操作）</span></div>
      <div class="seats" style="margin-top:8px">${R.map(x => `<button class="seat ${x.online ? "on" : ""} ${x.lost ? "lost" : ""} ${x.hand ? "hand" : ""} ${x.help ? "help" : ""} ${x.done ? "done" : ""}" data-seat="${esc(x.id)}" title="${esc(x.id)}${x.seen ? "（最終 " + hm(x.seen) + "）" : ""}">${x.no}<span class="st">${x.help ? "🆘" : x.hand ? "✋" : x.lost ? "🤔" : ""}</span></button>`).join("") || `<p class="empty">まだ生徒が登録していません。「生徒・参加」タブの参加コードを見せてください。</p>`}</div>
      ${hand.length || help.length ? `<div class="row" style="align-items:flex-start;margin-top:12px;gap:18px">
        ${help.length ? `<div class="grow"><h3 style="display:flex;gap:6px;align-items:center">${ic("lifebuoy")} ヘルプの順番</h3><ol class="queue">${help.map(x => `<li><b>${x.no}番</b><span class="small muted">${hm(x.help)}</span><button class="btn small" data-clr="${esc(x.id)}" data-what="help">対応した</button></li>`).join("")}</ol></div>` : ""}
        ${hand.length ? `<div class="grow"><h3 style="display:flex;gap:6px;align-items:center">${ic("hand")} 挙手の順番</h3><ol class="queue">${hand.map(x => `<li><b>${x.no}番</b><span class="small muted">${hm(x.hand)}</span><button class="btn small" data-clr="${esc(x.id)}" data-what="hand">当てた</button></li>`).join("")}</ol></div>` : ""}
      </div>` : ""}`);
  }
  // ランダム指名（オンライン授業でも使える）。最近当てた人はしばらく選ばない
  const picked = [];
  on(app, "click", "[data-pickone]", () => {
    const R = (T.P && T.P.roster) || [];
    let pool = R.filter(x => x.online && !picked.includes(x.id));
    if (!pool.length) { picked.length = 0; pool = R.filter(x => x.online); }
    if (!pool.length) return toast("接続中の生徒がいません");
    const x = pool[Math.floor(Math.random() * pool.length)];
    picked.push(x.id); if (picked.length > Math.max(3, Math.floor(R.length * 0.7))) picked.shift();
    const m = modal(`<div class="center"><div class="eyebrow gold">Random Pick</div><div class="small muted">ランダム指名</div><div class="score-big" style="font-size:110px;margin:6px 0">${x.no}<small>番</small></div>
      <div class="row" style="justify-content:center"><button class="btn" data-again>もう一度</button><button class="btn primary" data-ok>OK</button></div></div>`);
    m.el.querySelector("[data-ok]").onclick = () => m.close();
    m.el.querySelector("[data-again]").onclick = () => { m.close(); app.querySelector("[data-pickone]").click(); };
  });
  on(app, "click", "[data-clr]", async (e, b) => {
    await call("live_t_status_clear", { p_class_id: T.cls.id, p_account_id: b.dataset.clr, p_what: b.dataset.what });
    tpulse();
  });
  on(app, "click", "[data-seat]", (e, b) => {
    const x = T.P.roster.find(r => r.id === b.dataset.seat); if (!x) return;
    const m = modal(`<h2>${x.no}番 <span class="small muted">${esc(x.id)}</span></h2>
      <p class="small">${x.online ? "🟢 接続中" : "⚪ 未接続"}${x.seen ? `（最終 ${hm(x.seen)}）` : ""}　${x.lost ? "🤔 わからない" : ""} ${x.hand ? "✋ 挙手" : ""} ${x.help ? "🆘 ヘルプ" : ""} ${x.done ? "✓ できた" : ""}</p>
      <div class="row"><button class="btn" data-w="all">わからない・挙手・ヘルプを解除</button><button class="btn ghost" data-w="x">とじる</button></div>`);
    m.el.addEventListener("click", async ev => {
      const w = ev.target.closest("[data-w]"); if (!w) return;
      if (w.dataset.w === "all") { await call("live_t_status_clear", { p_class_id: T.cls.id, p_account_id: x.id, p_what: "all" }); tpulse(); }
      m.close();
    });
  });

  // 反応（いいね・なるほど・ゆっくり など）の流れ
  const RXK = [["like", "👍 いいね"], ["aha", "💡 なるほど"], ["slow", "🐢 ゆっくり"], ["lost", "🤔 わからない"], ["hand", "✋ 挙手"], ["help", "🆘 ヘルプ"]];
  function renderRx() {
    const P = T.P;
    const rx = P.reactions || {};
    setBox("rx", JSON.stringify(rx) + JSON.stringify(P.series), `
      ${secHead("wave", "Reactions", "反応", `<span class="small muted">直近1分 / 5分 / この授業</span>`)}
      <div style="margin-top:8px">${RXK.map(([k, t]) => { const r = rx[k] || { m1: 0, m5: 0, all: 0 }; return `<div class="hbar" style="grid-template-columns:110px 1fr 110px"><span class="small">${t}</span><div class="bar ${k === "lost" || k === "slow" ? "warn" : ""}"><i style="width:${Math.min(100, r.m5 * 8)}%"></i></div><span class="small"><b>${r.m1}</b> / ${r.m5} / ${r.all}</span></div>`; }).join("")}</div>
      ${seriesSVG(P.series || [], P.state.lesson_started_at)}`);
  }
  function seriesSVG(series, start) {
    if (!series.length) return `<p class="small muted">反応がまだありません。</p>`;
    const now = Clock.now(), from = Math.max(new Date(start || now - 3600e3).getTime(), now - 60 * 60e3);
    const mins = Math.max(10, Math.ceil((now - from) / 60e3));
    const W = 560, H = 90, pad = 4;
    const kinds = { lost: "var(--bad)", aha: "var(--good)", like: "var(--primary)", slow: "var(--warn)" };
    const buckets = {};
    series.forEach(p => { const i = Math.floor((new Date(p.t).getTime() - from) / 60e3); if (i >= 0 && i <= mins && kinds[p.k]) { (buckets[p.k] = buckets[p.k] || [])[i] = ((buckets[p.k] || [])[i] || 0) + p.n; } });
    const max = Math.max(3, ...Object.values(buckets).flatMap(a => a.filter(Boolean)));
    const X = i => pad + i * (W - 2 * pad) / mins, Y = n => H - pad - n / max * (H - 2 * pad - 10);
    const lines = Object.keys(kinds).map(k => { const a = buckets[k] || []; const pts = Array.from({ length: mins + 1 }, (_, i) => `${X(i).toFixed(1)},${Y(a[i] || 0).toFixed(1)}`).join(" "); return `<polyline fill="none" stroke="${kinds[k]}" stroke-width="2" points="${pts}"/>`; }).join("");
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:90px;margin-top:8px" aria-label="1分ごとの反応">${lines}</svg>
      <div class="row small muted" style="gap:12px"><span style="color:var(--bad)">■ わからない</span><span style="color:var(--good)">■ なるほど</span><span style="color:var(--primary)">■ いいね</span><span style="color:var(--warn)">■ ゆっくり</span><span>（${mins}分前 → いま）</span></div>`;
  }

  // 投票の集計
  function pollDist(poll, answers) {
    const groups = new Map();
    const keyOf = a => (poll.kind === "num" ? LM.normalize(a) : a);
    answers.forEach(x => { const k = keyOf(x.a); const g = groups.get(k) || { a: x.a, n: 0, by: [] }; g.n++; g.by.push(x.by); groups.set(k, g); });
    const right = a => poll.answer != null && poll.answer !== "" && (poll.kind === "num" ? LM.gradeSub({ mode: poll.mode || "num", a: poll.answer }, a).ok : String(a) === String(poll.answer));
    return [...groups.values()].map(g => Object.assign(g, { ok: right(g.a) })).sort((a, b) => b.n - a.n);
  }
  function renderPollView() {
    const P = T.P, poll = P.state.poll;
    if (!poll) return setBox("pollview", "none", "");
    const ans = P.poll_answers || [];
    const dist = pollDist(poll, ans);
    const total = ans.length;
    const R = P.roster.length;
    const label = a => {
      if (poll.kind === "scale") return ["", "😣 わからない", "😐 すこし不安", "🙂 だいたい", "😄 バッチリ"][+a] || a;
      if (poll.kind === "abcd") { const i = "ABCD".indexOf(a); const o = (poll.options || [])[i]; return o && o !== a ? `${a}　${o}` : a; }
      if (poll.kind === "num") return LM.preview(a, poll.mode || "num").html || esc(a);
      return esc(a);
    };
    const order = poll.kind === "scale" ? ["4", "3", "2", "1"] : poll.kind === "abcd" ? ["A", "B", "C", "D"] : poll.kind === "tf" ? ["○", "×"] : null;
    const rows = order ? order.map(k => dist.find(d => d.a === k) || { a: k, n: 0, by: [], ok: poll.answer === k }) : dist;
    const numOf = id => (P.roster.find(r => r.id === id) || {}).no;
    setBox("pollview", JSON.stringify([poll, ans]), `<div class="tile cyan">
      ${secHead("poll", "Live Poll", "投票の結果", `<span class="chip ${poll.open ? "p" : ""}">${total} / ${R} 人</span>`)}
      <p class="small">${esc(poll.q || "")}${poll.answer ? `　正解：<b>${poll.kind === "num" ? LM.toHTML(poll.answer) : esc(poll.answer)}</b>` : ""}</p>
      ${poll.kind === "text" ? `<div class="stack small">${dist.map(d => `<div>「${esc(d.a)}」${d.n > 1 ? ` ×${d.n}` : ""}</div>`).join("") || `<span class="muted">まだ回答がありません</span>`}</div>`
        : rows.map(d => `<div class="hbar" style="grid-template-columns:140px 1fr 90px"><span class="small">${label(d.a)}${d.ok ? " ✅" : ""}</span><div class="bar ${d.ok ? "good" : ""}"><i style="width:${total ? Math.round(d.n / total * 100) : 0}%"></i></div><span class="small"><b>${d.n}</b>人 ${d.by.length && d.by.length <= 6 ? `<span class="muted">(${d.by.map(numOf).join(",")})</span>` : ""}</span></div>`).join("")}
      ${poll.kind === "scale" && total ? `<p class="small muted mb0">平均 ${(ans.reduce((a, x) => a + (+x.a || 0), 0) / total).toFixed(2)}　😣 を選んだ人：${ans.filter(x => x.a === "1").map(x => numOf(x.by) + "番").join("、") || "なし"}</p>` : ""}
    </div>`);
  }

  // 小テストの提出状況（設問ごとの正答率）
  function renderQuizView() {
    const P = T.P, s = P.state;
    if (!s.quiz_lesson) return setBox("quizview", "none", "");
    const L = LL.lesson(s.quiz_lesson);
    const q = P.quiz || { n: 0, items: {}, by: [] };
    const R = P.roster;
    const not = R.filter(r => !(q.by || []).includes(r.id));
    const its = L ? QC.items(L) : [];
    const rows = its.map(it => { const x = q.items[it.k] || { ok: 0, n: 0 }; return { it, rate: x.n ? x.ok / x.n : null, ok: x.ok, n: x.n }; });
    const worst = rows.filter(r => r.rate !== null && r.rate < 0.8).sort((a, b) => a.rate - b.rate).slice(0, 3);
    setBox("quizview", JSON.stringify(q) + R.length, `<div class="card">
      ${secHead("quiz", "Quiz", `小テスト <span class="lesson-no">${esc(s.quiz_lesson)}</span>`, `<span class="chip p">提出 ${q.n} / ${R.length}</span>`)}
      ${q.n ? `<p class="small">平均 <b>${Math.min(100, q.avg)}</b>%　${worst.length ? `正答率が低い：${worst.map(w => `<b>${esc(QC.label(w.it))}</b>（${Math.round(w.rate * 100)}%）`).join("、")}` : `<span class="chip g">どの設問も80%以上</span>`}</p>` : `<p class="small muted">まだ提出はありません。</p>`}
      <details class="more"><summary>設問ごとの正答率</summary>${rows.map(r => `<div class="hbar" style="grid-template-columns:90px 1fr 70px"><span class="small">${esc(QC.label(r.it))}</span><div class="bar ${r.rate !== null && r.rate < 0.5 ? "bad" : r.rate !== null && r.rate < 0.8 ? "warn" : "good"}"><i style="width:${r.rate === null ? 0 : Math.round(r.rate * 100)}%"></i></div><span class="small">${r.n ? `${r.ok}/${r.n}` : "—"}</span></div>`).join("")}</details>
      ${not.length && q.n ? `<p class="small muted mb0">まだ：${not.map(r => r.no).join(", ")}</p>` : ""}
      <p class="small mb0"><a href="#" data-goquiz>くわしい分析 →</a></p>
    </div>`);
  }
  on(app, "click", "[data-goquiz]", e => { e.preventDefault(); T.qa.lesson = T.P.state.quiz_lesson; showTab("quiz"); });

  // 質問とコメント
  function renderVoices() {
    const P = T.P;
    const posts = [...T.posts.values()];
    const qs = posts.filter(p => p.kind === "q" && p.status !== "hidden").sort((a, b) => (a.status === "done") - (b.status === "done") || b.plus - a.plus || b.id - a.id);
    const cs = posts.filter(p => p.kind === "c" && p.status !== "hidden").sort((a, b) => b.id - a.id);
    const hidden = posts.filter(p => p.status === "hidden").length;
    const rf = P.reflect;
    setBox("voices", JSON.stringify(posts) + JSON.stringify(rf), `
      ${rf ? `<div class="msg info" style="margin:0 0 10px">✏️ 振り返り ${rf.n} / ${P.roster.length} 人　理解度の平均 ${rf.avg || "—"}　${rf.flags ? `<b style="color:var(--bad)">⚠ 要フォロー ${rf.flags} 人</b>` : ""}　<a href="#" data-gorefl>見る →</a></div>` : ""}
      ${secHead("question", "Questions", `質問 <span class="chip">${qs.length}</span>`)}
      ${qs.length ? qs.map(p => voiceHTML(p)).join("") : `<p class="empty">まだ質問はありません</p>`}
      <div style="margin-top:14px">${secHead("chat", "Comments", `コメント <span class="chip">${cs.length}</span>`)}</div>
      ${cs.length ? cs.slice(0, 30).map(p => voiceHTML(p)).join("") : `<p class="empty">まだコメントはありません</p>`}
      ${hidden ? `<p class="small muted">非表示にした投稿 ${hidden} 件</p>` : ""}`);
  }
  function voiceHTML(p) {
    return `<div class="post"><div class="body">${esc(p.body)}
      <div class="row small" style="gap:6px;margin-top:4px"><span class="muted">${p.no != null ? p.no + "番" : ""}・${hm(p.at)}</span>
        ${p.kind === "q" ? `<span class="chip ${p.plus ? "p" : ""}">🙋 ${p.plus}</span>` : ""}${p.status === "done" ? `<span class="chip g">回答ずみ</span>` : ""}${p.pinned ? `<span class="chip v">📌 公開中</span>` : ""}</div></div>
      <div class="row" style="gap:4px;flex-wrap:nowrap">
        ${p.kind === "q" ? `<button class="btn small ${p.status === "done" ? "on" : ""}" data-post="${p.id}" data-op="done" title="回答ずみ" aria-label="回答ずみ">${ic("check")}</button>` : ""}
        <button class="btn small ${p.pinned ? "on" : ""}" data-post="${p.id}" data-op="pin" title="${p.kind === "q" ? "投影画面で強調" : "名前なしでクラスに公開"}" aria-label="ピックアップ">${ic("pin")}</button>
        <button class="btn small ghost" data-post="${p.id}" data-op="hide" title="非表示" aria-label="非表示">${ic("eyeoff")}</button>
      </div></div>`;
  }
  on(app, "click", "[data-gorefl]", e => { e.preventDefault(); T.rf.lesson = T.P.state.reflect_lesson || "all"; showTab("refl"); });
  on(app, "click", "[data-post]", async (e, b) => {
    const p = T.posts.get(+b.dataset.post); if (!p) return;
    const op = b.dataset.op;
    const args = { p_post_id: p.id };
    if (op === "done") args.p_status = p.status === "done" ? "open" : "done";
    if (op === "pin") args.p_pinned = !p.pinned;
    if (op === "hide") { if (!(await confirmBox("非表示にしますか？", "<p>生徒の画面からも消えます（記録は残ります）。</p>", "非表示にする"))) return; args.p_status = "hidden"; }
    await call("live_t_post_update", args);
    Object.assign(p, { status: args.p_status || p.status, pinned: args.p_pinned === undefined ? p.pinned : args.p_pinned });
    T.sig.voices = null; renderVoices();
  });

  /* ============================================================
     小テストの結果
     ============================================================ */
  async function loadRoster() {
    const r = await call("live_t_students", { p_class_id: T.cls.id });
    T.students = r.students || [];
    return T.students;
  }
  const noOf = id => { const s = (T.students || []).find(x => x.id === id); return s ? s.no : +String(id).slice(-2); };

  async function renderQuizTab() {
    app.innerHTML = `<p class="empty">読み込み中…</p>`;
    let res;
    try { [res] = await Promise.all([call("live_t_results", { p_class_id: T.cls.id }), loadRoster()]); } catch (e) { return; }
    const atts = (res.attempts || []).filter(a => !a.voided).map(a => {
      const L = LL.lesson(a.lesson_id);
      const g = L ? QC.grade(L, QC.answersFrom(a.answers)) : null;
      return Object.assign(a, { g, mismatch: g && g.score !== a.score });
    });
    T.atts = atts;
    const lessons = [...new Set(atts.map(a => a.lesson_id))].sort((a, b) => LL.LESSONS.findIndex(L => L.id === a) - LL.LESSONS.findIndex(L => L.id === b));
    if (!T.qa.lesson || !lessons.includes(T.qa.lesson)) T.qa.lesson = lessons[lessons.length - 1] || null;
    const cell = (sid, lid) => {
      const list = atts.filter(a => a.by === sid && a.lesson_id === lid);
      const a = list[list.length - 1];
      if (!a) return `<td class="none">—</td>`;
      const pct = a.max_score || a.max ? Math.min(a.score, a.max) / a.max : 0;
      return `<td class="s clickable ${pct >= 0.8 ? "hi" : pct >= 0.5 ? "mid" : "lo"}" data-att="${a.id}" title="${esc(md(a.date))}${a.score > a.max ? "・ボーナス正解" : ""}">${Math.min(a.score, a.max)}/${a.max}${a.score > a.max ? ` <span class="bonus-star">★</span>` : ""}${a.mismatch ? " ⚠" : ""}</td>`;
    };
    const mism = atts.filter(a => a.mismatch).length;
    app.innerHTML = `<div class="stack enter">
      <div class="card paper">
        ${secHead("quiz", "Quiz Results", `小テストの結果（${esc(T.cls.label)}）`, `<div class="row"><button class="btn small" data-qx="csv">${ic("download")} CSV（Excel）</button><button class="btn small" data-qx="reload">${ic("refresh")} 更新</button></div>`)}
        <p class="small muted">点数は、生徒の解答からこの画面で<b>採点し直して</b>確かめています${mism ? `。<b style="color:var(--bad)">⚠ 送られてきた点数と一致しないものが ${mism} 件</b>（改ざん・古いバージョンの可能性）` : "（すべて一致）"}。セルをクリックすると解答が見られます。</p>
        ${lessons.length ? `<div class="tscroll"><table class="t matrix"><thead><tr><th class="sticky">番号</th>${lessons.map(l => `<th title="${esc(LL.lessonLabel(l))}">${esc(l)}</th>`).join("")}</tr></thead>
          <tbody>${T.students.map(s => `<tr><th class="sticky">${s.no}</th>${lessons.map(l => cell(s.id, l)).join("")}</tr>`).join("")}</tbody></table></div>` : `<p class="empty">まだ提出がありません。</p>`}
      </div>
      ${T.qa.lesson ? analysisHTML(T.qa.lesson, lessons) : ""}
    </div>`;
  }

  function analysisHTML(lid, lessons) {
    const L = LL.lesson(lid);
    if (!L) return "";
    const list = latestBy(T.atts.filter(a => a.lesson_id === lid));
    const its = QC.items(L);
    const bi = QC.bonusItem(L);
    const n = list.length;
    const avg = n ? Math.round(list.reduce((s, a) => s + Math.min(a.g.score, a.g.max) / a.g.max, 0) / n * 100) : 0;
    const rows = its.concat(bi ? [bi] : []).map(it => {
      const res = list.map(a => ({ a, r: it.bonus ? a.g.bonus : a.g.items.find(x => x.k === it.k) })).filter(x => x.r);
      const ok = res.filter(x => x.r.ok).length;
      const wrong = {};
      res.filter(x => !x.r.ok).forEach(x => {
        const raw = x.r.a;
        const key = raw === null || raw === undefined || raw === "" ? "（未回答）" : typeof raw === "string" ? LM.normalize(raw) : JSON.stringify(raw);
        const w = wrong[key] || (wrong[key] = { raw, n: 0, who: [], why: QC.whyText(x.r) });
        w.n++; w.who.push(noOf(x.a.by));
      });
      return { it, ok, n: res.length, rate: res.length ? ok / res.length : 0, wrong: Object.values(wrong).sort((a, b) => b.n - a.n) };
    });
    const worst = rows.filter(r => !r.it.bonus && r.n && r.rate < 0.8).sort((a, b) => a.rate - b.rate).slice(0, 3);
    return `<div class="card paper">
      ${secHead("target", "Analysis", "設問ごとの分析", `<select class="in" id="qa-l" style="width:auto">${lessons.map(l => `<option value="${l}" ${l === lid ? "selected" : ""}>${esc(LL.lessonLabel(l))}</option>`).join("")}</select>`)}
      <p>提出 <b>${n}</b> 人・平均 <b>${avg}</b>%${worst.length ? `　解説するならここ：${worst.map(w => `<b>${esc(QC.label(w.it))}</b>（${Math.round(w.rate * 100)}%）`).join("、")}` : n ? `　<span class="chip g">どの設問も正答率80%以上</span>` : ""}</p>
      <div class="stack">${rows.map(r => `<div class="card paper flat">
        <div class="row between"><b>${esc(QC.label(r.it))}</b><span class="chip ${r.rate >= 0.8 ? "g" : r.rate >= 0.5 ? "w" : "b"}">${r.ok} / ${r.n}（${r.n ? Math.round(r.rate * 100) : 0}%）</span></div>
        <div class="small">${r.it.sub && r.it.sub.p ? LM.richText(r.it.sub.p) + "　" : ""}正解：${QC.rightHTML(r.it)}</div>
        ${r.wrong.length ? `<div class="small" style="margin-top:6px">${r.wrong.slice(0, 6).map(w => `<div>✗ ${w.raw === null || w.raw === undefined || w.raw === "" ? "<span class='muted'>（未回答）</span>" : QC.userHTML(r.it, w.raw)} <b>${w.n}人</b> <span class="muted">(${w.who.join(",")}番)</span>${w.why ? ` <span class="why" style="display:inline">— ${esc(w.why)}</span>` : ""}</div>`).join("")}</div>` : ""}
      </div>`).join("")}</div></div>`;
  }
  function latestBy(list) {
    const m = new Map();
    list.forEach(a => m.set(a.by, a));
    return [...m.values()];
  }
  on(app, "change", "#qa-l", (e, s) => { T.qa.lesson = s.value; renderQuizTab(); });
  on(app, "click", "[data-qx]", (e, b) => {
    if (b.dataset.qx === "reload") return renderQuizTab();
    const lessons = [...new Set(T.atts.map(a => a.lesson_id))];
    const rows = [["番号", "ID", ...lessons.flatMap(l => [`${l} 点`, `${l} 満点`, `${l} ボーナス`])]];
    T.students.forEach(s => rows.push([s.no, s.id, ...lessons.flatMap(l => { const a = latestBy(T.atts.filter(x => x.by === s.id && x.lesson_id === l))[0]; return a ? [Math.min(a.g.score, a.g.max), a.g.max, a.g.score > a.g.max ? "★" : ""] : ["", "", ""]; })]));
    const detail = [["番号", "ID", "授業", "日付", "設問", "解答", "正誤"]];
    T.atts.forEach(a => { const L = LL.lesson(a.lesson_id); if (!L) return; a.g.items.forEach(r => { const it = QC.findItem(L, r.k); detail.push([noOf(a.by), a.by, a.lesson_id, a.date, QC.label(it), typeof r.a === "string" ? r.a : JSON.stringify(r.a), r.ok ? "○" : "×"]); }); });
    downloadCSV(`小テスト_${T.cls.label}_${ymd(Date.now())}.csv`, rows);
    setTimeout(() => downloadCSV(`小テスト_設問別_${T.cls.label}_${ymd(Date.now())}.csv`, detail), 400);
  });
  on(app, "click", "[data-att]", (e, td) => {
    const a = T.atts.find(x => x.id === td.dataset.att); if (!a) return;
    const L = LL.lesson(a.lesson_id);
    const its = QC.items(L);
    const m = modal(`<div class="eyebrow gold">Answer Sheet</div><h2>${noOf(a.by)}番　<span class="lesson-no">${esc(L.id)}</span> ${esc(L.title)}</h2>
      <p class="small">${esc(md(a.date))} ${a.at ? hm(a.at) : ""}提出・${a.sec ? mmss(a.sec) + " で解答" : ""}　<b>${Math.min(a.g.score, a.g.max)} / ${a.g.max}</b>${a.g.score > a.g.max ? `<span class="chip w" style="margin-left:6px">★ ボーナス正解</span>` : ""}${a.mismatch ? `　<span class="chip b">⚠ 送信された点数は ${a.score}（採点し直しと不一致）</span>` : ""}</p>
      <div>${a.g.items.map(r => { const it = its.find(x => x.k === r.k); return `<div class="res-item"><span class="mark ${r.ok ? "o" : "x"}">${r.ok ? "○" : "×"}</span><div><b class="small">${esc(QC.label(it))}</b>　${QC.userHTML(it, r.a)}${r.ok ? "" : `<div class="small muted">正解：${QC.rightHTML(it)}</div>`}</div></div>`; }).join("")}
      ${a.g.bonus ? `<div class="res-item"><span class="mark ${a.g.bonus.ok ? "o" : "x"}">★</span><div class="small">チャレンジ：${QC.userHTML(QC.bonusItem(L), a.g.bonus.a)}</div></div>` : ""}</div>
      <div class="row end" style="margin-top:12px"><button class="btn" data-void>やり直しを許可（今日もう一度受けられる）</button><button class="btn ghost" data-x>とじる</button></div>`);
    m.el.querySelector("[data-x]").onclick = () => m.close();
    m.el.querySelector("[data-void]").onclick = async () => {
      if (!(await confirmBox("やり直しを許可しますか？", "<p>この提出は「無効」になり（記録は残ります）、生徒は同じ小テストをもう一度提出できます。配布中のときだけ受けられます。</p>", "許可する"))) return;
      await call("live_t_attempt_void", { p_attempt_id: a.id });
      m.close(); toast("やり直しを許可しました", "good"); renderQuizTab();
    };
  });

  /* ============================================================
     振り返り（観点評価）
     ============================================================ */
  async function renderReflTab() {
    app.innerHTML = `<p class="empty">読み込み中…</p>`;
    try {
      const [r] = await Promise.all([call("live_t_reflections", { p_class_id: T.cls.id }), loadRoster()]);
      T.refl = (r.reflections || []).map(x => Object.assign(x, { no: noOf(x.by) }));
    } catch (e) { return; }
    drawRefl();
  }
  const lv = (r, k) => RF.lvOf(r, k);
  function filteredRefl() {
    const f = T.rf;
    return T.refl.filter(r =>
      (f.lesson === "all" || r.lesson_id === f.lesson) &&
      (f.flag === "all" || (f.flag === "follow" && (r.flag || r.understanding === 1)) || (f.flag === "sos" && r.flag === "sos") ||
        (f.flag === "dup" && r.auto_eval && r.auto_eval.flags && r.auto_eval.flags.dup) || (f.flag === "note" && !r.teacher_note)) &&
      (f.cat === "all" || lv(r, f.cat) >= 1));
  }
  function drawRefl() {
    const f = T.rf;
    const lessons = [...new Set(T.refl.map(r => r.lesson_id))].sort((a, b) => LL.LESSONS.findIndex(L => L.id === a) - LL.LESSONS.findIndex(L => L.id === b));
    const list = filteredRefl();
    const sos = T.refl.filter(r => r.flag === "sos" && (Date.now() - new Date(r.at).getTime()) < 14 * 864e5);
    app.innerHTML = `<div class="stack">
      ${sos.length ? `<div class="card bad"><b>⚠ 心配なことばがあった振り返り（直近2週間）：</b> ${sos.map(r => `${r.no}番（${esc(r.lesson_id)}・${md(r.date)}）`).join("、")}　<span class="small">→ 声をかける・ようすを見るなど、先生の判断で。</span></div>` : ""}
      <div class="card paper">
        ${secHead("quill", "Reflections", `振り返り（${esc(T.cls.label)}）`, `<div class="seg">${[["list", "一覧"], ["map", "観点マップ"], ["student", "生徒ごと"]].map(([k, t]) => `<button data-rv="${k}" class="${f.view === k ? "on" : ""}">${t}</button>`).join("")}</div>`)}
        <div class="row" style="margin-top:10px">
          <select class="in" id="rf-l" style="width:auto"><option value="all">すべての授業</option>${lessons.map(l => `<option value="${l}" ${f.lesson === l ? "selected" : ""}>${esc(LL.lessonLabel(l))}</option>`).join("")}</select>
          <select class="in" id="rf-f" style="width:auto">${[["all", "すべて"], ["follow", "⚠ 要フォロー（理解度1・ヘルプ・SOS）"], ["sos", "⚠ 心配なことば"], ["dup", "📋 使い回しの疑い"], ["note", "ひとこと未記入"]].map(([k, t]) => `<option value="${k}" ${f.flag === k ? "selected" : ""}>${t}</option>`).join("")}</select>
          <select class="in" id="rf-c" style="width:auto"><option value="all">観点：すべて</option>${RF.CATS.map(c => `<option value="${c.k}" ${f.cat === c.k ? "selected" : ""}>${esc(c.label)} が○以上</option>`).join("")}</select>
          <span class="grow"></span>
          <button class="btn small violet" data-rx="ai">${ic("ai")} AIに見てもらう（プロンプトをコピー）</button>
          <button class="btn small" data-rx="csv">${ic("download")} CSV</button>
        </div>
        <p class="small muted mb0" style="margin-top:8px">観点のチップは<b>クリックで −→○→◎ と直せます</b>（先生の判断が優先されます）。チップにマウスを乗せると根拠の文が見られます。判定は下書きです。文章のうまさ・前向きさは評価していません。</p>
      </div>
      <div id="rf-body" class="paper"></div>
    </div>`;
    const body = $("#rf-body");
    if (f.view === "list") body.innerHTML = list.length ? `<div class="stack">${list.slice().reverse().map(reflCardHTML).join("")}</div>` : `<div class="card paper empty">該当する振り返りはありません。</div>`;
    if (f.view === "map") body.innerHTML = mapHTML(list);
    if (f.view === "student") body.innerHTML = studentHTML();
  }
  const FIELD_NAMES = { summary: "まとめ", stuck: "つまずき", how: "学び方", next: "次にやること", question: "問い", predict: "予想" };
  function reflCardHTML(r) {
    const ev = r.auto_eval || { cats: {}, flags: {} };
    const L = LL.lesson(r.lesson_id);
    const fl = ev.flags || {};
    const flagChips = [
      r.flag === "sos" ? `<span class="chip b">⚠ 心配なことば</span>` : "",
      r.flag === "help" || r.understanding === 1 ? `<span class="chip b">要フォロー</span>` : "",
      fl.dup ? `<span class="chip w">📋 ${esc(fl.dup)} とほぼ同じ</span>` : "",
      r.body.prev_done ? `<span class="chip v">前回の一手：${{ yes: "できた", some: "少し", no: "まだ" }[r.body.prev_done] || ""}</span>` : "",
      r.mode === "deep" ? `<span class="chip">じっくり</span>` : "",
    ].join("");
    const hl = text => {
      let h = esc(text);
      // 根拠になった文を強調
      Object.values(ev.cats || {}).forEach(c => (c.ev || []).forEach(s => { const e2 = esc(String(s).replace(/…$/, "")); if (e2.length > 4 && h.includes(e2)) h = h.replace(e2, `<mark>${e2}</mark>`); }));
      return h;
    };
    return `<div class="rcard ${r.flag ? "flag" : ""}">
      <div class="row between"><div class="row" style="gap:8px"><span class="who"><span class="num">${r.no}</span></span><b style="font-size:17px">${r.no}番</b><span class="lesson-no">${esc(r.lesson_id)}</span><span class="small muted">${esc(L ? L.title : "")}・${md(r.date)}</span><span title="理解度">${FACE[r.understanding]} ${r.understanding}</span>${flagChips}</div>
        <button class="btn small ghost" data-rdel="${r.id}" title="削除（生徒の入力ミスの申告など）" aria-label="削除">${ic("trash")}</button></div>
      <div class="stack" style="gap:4px;margin-top:6px">${Object.keys(FIELD_NAMES).filter(k => r.body[k]).map(k => `<div><span class="chip">${FIELD_NAMES[k]}</span> <span class="txt">${hl(r.body[k])}</span></div>`).join("")}</div>
      <div class="ev">${RF.CATS.map(c => {
        const auto = ev.cats && ev.cats[c.k] ? ev.cats[c.k] : { lv: 0, ev: [], why: "" };
        const edited = r.teacher_eval && r.teacher_eval[c.k] !== undefined && r.teacher_eval[c.k] !== null;
        const l = lv(r, c.k);
        const tip = `${c.label}：${c.desc}\n自動判定 ${LVL[auto.lv]}${auto.why ? "（" + auto.why + "）" : ""}${auto.ev && auto.ev[0] ? "\n根拠「" + auto.ev[0] + "」" : ""}${edited ? "\n先生の判定 " + LVL[l] : ""}`;
        return `<button class="chip ${l >= 2 ? "v lv2" : l === 1 ? "p" : ""} l${l} ${edited ? "edited" : ""}" data-cyc="${r.id}" data-k="${c.k}" title="${esc(tip)}">${esc(c.short)} ${LVL[l]}</button>`;
      }).join("")}</div>
      <div class="row" style="margin-top:8px"><input class="in grow" data-note="${r.id}" maxlength="300" placeholder="先生からのひとこと（生徒の「わたしの記録」に表示されます）" value="${esc(r.teacher_note || "")}" style="min-height:38px"><button class="btn small" data-savenote="${r.id}">保存</button></div>
    </div>`;
  }
  function mapHTML(list) {
    const bySt = new Map();
    list.forEach(r => { (bySt.get(r.by) || bySt.set(r.by, []).get(r.by)).push(r); });
    const rows = (T.students || []).map(s => ({ s, rs: bySt.get(s.id) || [] }));
    const cellCls = n => (n >= 2 ? "l2" : n >= 1 ? "l1" : "l0");
    return `<div class="card paper">${secHead("chart", "Viewpoint Map", "観点マップ")}<div class="tscroll"><table class="t heat">
      <thead><tr><th>番号</th><th>回数</th>${RF.CATS.map(c => `<th title="${esc(c.desc)}">${esc(c.short)}</th>`).join("")}<th title="粘り強さ（学び方・つまずき・関心）">粘り強さ</th><th title="自己調整（改善・接続）">自己調整</th><th title="思考（問い・見方・予測）">思考</th><th title="主体的に学習に取り組む態度（下書き）">態度<br><span class="tiny muted">下書き</span></th></tr></thead>
      <tbody>${rows.map(({ s, rs }) => {
        const sm = RF.studentSummary(rs);
        return `<tr style="cursor:pointer" data-stu="${esc(s.id)}"><th>${s.no}</th><td>${rs.length}</td>${RF.CATS.map(c => { const cnt = rs.filter(r => lv(r, c.k) >= 1).length; const mx = Math.max(0, ...rs.map(r => lv(r, c.k))); return `<td class="${cellCls(mx)}" title="○以上 ${cnt} 回">${rs.length ? (cnt ? cnt : "") + (mx === 2 ? "◎" : "") : ""}</td>`; }).join("")}
          <td>${rs.length ? sm.nebari.g : ""}</td><td>${rs.length ? sm.jiko.g : ""}</td><td>${rs.length ? sm.shiko.g : ""}</td><td><b>${rs.length ? sm.attitude : ""}</b></td></tr>`;
      }).join("")}</tbody></table></div>
      <p class="small muted mb0">数字＝その観点が○以上だった回数、◎＝◎が1回以上。A/B/C は「○以上の割合 60%以上かつ◎あり＝A、30%以上＝B」の目安で、<b>評定に使う前に必ず本文で確かめてください</b>。行をクリックすると生徒ごとの記録へ。</p></div>`;
  }
  function studentHTML() {
    const st = T.students || [];
    const inLesson = r => T.rf.lesson === "all" || r.lesson_id === T.rf.lesson;
    const has = new Set(T.refl.filter(inLesson).map(r => r.by));
    const first = st.find(s => has.has(s.id)) || st[0];
    const sid = T.rf.student || (first && first.id);
    const rs = T.refl.filter(r => r.by === sid && inLesson(r));
    const sm = RF.studentSummary(rs);
    const pct = x => Math.round(x * 100) + "%";
    return `<div class="card paper">
      <div class="row"><select class="in" id="rf-s" style="width:auto">${st.map(s => `<option value="${esc(s.id)}" ${s.id === sid ? "selected" : ""}>${s.no}番${has.has(s.id) ? "" : "（未提出）"}</option>`).join("")}</select>
        <span class="small muted">振り返り ${rs.length} 回${sm.doneRate !== null ? `・前回の一手を「できた」${pct(sm.doneRate)}` : ""}</span></div>
      ${rs.length ? `<div class="meters" style="margin-top:10px">
        <div class="meter"><div class="k">粘り強さ</div><div class="n">${sm.nebari.g}</div><div class="small muted">${pct(sm.nebari.rate)}</div></div>
        <div class="meter"><div class="k">自己調整</div><div class="n">${sm.jiko.g}</div><div class="small muted">${pct(sm.jiko.rate)}</div></div>
        <div class="meter"><div class="k">思考の手がかり</div><div class="n">${sm.shiko.g}</div><div class="small muted">${pct(sm.shiko.rate)}</div></div>
        <div class="meter"><div class="k">態度（下書き）</div><div class="n">${sm.attitude}</div></div></div>` : ""}
      <div class="stack" style="margin-top:12px">${rs.slice().reverse().map(reflCardHTML).join("") || `<p class="empty">振り返りがありません</p>`}</div></div>`;
  }
  on(app, "click", "[data-rv]", (e, b) => { T.rf.view = b.dataset.rv; drawRefl(); });
  on(app, "change", "#rf-l", (e, s) => { T.rf.lesson = s.value; drawRefl(); });
  on(app, "change", "#rf-f", (e, s) => { T.rf.flag = s.value; drawRefl(); });
  on(app, "change", "#rf-c", (e, s) => { T.rf.cat = s.value; drawRefl(); });
  on(app, "change", "#rf-s", (e, s) => { T.rf.student = s.value; drawRefl(); });
  on(app, "click", "[data-stu]", (e, tr) => { T.rf.student = tr.dataset.stu; T.rf.view = "student"; drawRefl(); });
  on(app, "click", "[data-cyc]", async (e, b) => {
    const r = T.refl.find(x => x.id === +b.dataset.cyc); if (!r) return;
    const k = b.dataset.k;
    const next = (lv(r, k) + 1) % 3;
    r.teacher_eval = Object.assign({}, r.teacher_eval || {}, { [k]: next });
    const auto = r.auto_eval && r.auto_eval.cats && r.auto_eval.cats[k] ? r.auto_eval.cats[k].lv : 0;
    if (next === auto) delete r.teacher_eval[k];
    try { await call("live_t_reflection_update", { p_id: r.id, p_teacher_eval: r.teacher_eval }); } catch (err) { return; }
    const card = b.closest(".rcard");
    card.outerHTML = reflCardHTML(r);
  });
  on(app, "click", "[data-savenote]", async (e, b) => {
    const r = T.refl.find(x => x.id === +b.dataset.savenote); if (!r) return;
    const inp = app.querySelector(`[data-note="${r.id}"]`);
    r.teacher_note = inp.value.trim();
    await call("live_t_reflection_update", { p_id: r.id, p_note: r.teacher_note });
    toast(r.teacher_note ? "ひとことを保存しました（生徒の記録に表示）" : "ひとことを消しました", "good");
  });
  on(app, "keydown", "[data-note]", (e, inp) => { if (e.key === "Enter" && !e.isComposing) { const b = app.querySelector(`[data-savenote="${inp.dataset.note}"]`); if (b) b.click(); } });
  on(app, "click", "[data-rdel]", async (e, b) => {
    const r = T.refl.find(x => x.id === +b.dataset.rdel); if (!r) return;
    if (!(await confirmBox("この振り返りを削除しますか？", `<p>${r.no}番・${esc(r.lesson_id)}・${md(r.date)}。元にはもどせません。</p>`, "削除する", true))) return;
    await call("live_t_reflection_delete", { p_id: r.id });
    T.refl = T.refl.filter(x => x !== r); drawRefl();
  });
  on(app, "click", "[data-rx]", async (e, b) => {
    if (T.tab !== "refl") return;
    const list = filteredRefl();
    if (b.dataset.rx === "ai") {
      const title = T.rf.lesson === "all" ? "複数の授業" : LL.lessonLabel(T.rf.lesson);
      const txt = RF.aiPrompt(title, list.map(r => ({ label: `${r.no}番・${r.lesson_id}`, understanding: r.understanding, body: r.body })));
      const ok = await copyText(txt);
      modal(`<div class="eyebrow gold">AI Assist</div><h2>AIに見てもらう</h2><p class="small">${ok ? "プロンプトをコピーしました。" : "下の文をコピーしてください。"}Claude などに貼り付けると、観点ごとの見立てと根拠・問い返しの案が返ってきます。<b>氏名は含まれていません（番号のみ）</b>。学校のルールに合わせて使ってください。</p>
        <textarea class="in" rows="12" readonly>${esc(txt)}</textarea>`);
      return;
    }
    const rows = [["番号", "ID", "授業", "日付", "理解度", "まとめ", "つまずき", "学び方", "次にやること", "問い", "予想", "前回の一手", ...RF.CATS.map(c => c.label), "フラグ", "先生のひとこと"]];
    list.forEach(r => rows.push([r.no, r.by, r.lesson_id, r.date, r.understanding, r.body.summary || "", r.body.stuck || "", r.body.how || "", r.body.next || "", r.body.question || "", r.body.predict || "", r.body.prev_done || "", ...RF.CATS.map(c => LVL[lv(r, c.k)]), r.flag || "", r.teacher_note || ""]));
    downloadCSV(`振り返り_${T.cls.label}_${ymd(Date.now())}.csv`, rows);
  });

  /* ============================================================
     反応ログ（授業のふり返り用）
     ============================================================ */
  async function renderLogTab() {
    app.innerHTML = `<p class="empty">読み込み中…</p>`;
    let r;
    try { [r] = await Promise.all([call("live_t_reaction_log", { p_class_id: T.cls.id, p_days: 60 }), loadRoster()]); } catch (e) { return; }
    const sessions = new Map();
    (r.rows || []).forEach(x => {
      const d = ymd(x.t);
      const key = d + "|" + (x.lesson_id || "");
      const s = sessions.get(key) || { key, date: d, lesson: x.lesson_id, rows: [], total: {}, posts: [] };
      s.rows.push(x); s.total[x.k] = (s.total[x.k] || 0) + x.n;
      sessions.set(key, s);
    });
    (r.posts || []).forEach(p => { const key = ymd(p.at) + "|" + (p.lesson_id || ""); const s = sessions.get(key) || { key, date: ymd(p.at), lesson: p.lesson_id, rows: [], total: {}, posts: [] }; s.posts.push(p); sessions.set(key, s); });
    const list = [...sessions.values()].sort((a, b) => b.key.localeCompare(a.key));
    if (!T.log.key || !sessions.has(T.log.key)) T.log.key = list[0] && list[0].key;
    const cur = sessions.get(T.log.key);
    app.innerHTML = `<div class="cockpit" style="grid-template-columns:320px minmax(0,1fr)">
      <div class="card">${secHead("chart", "Reaction Log", "授業ごとの反応")}
        ${list.length ? list.map(s => `<button class="btn block ${s.key === T.log.key ? "on" : "ghost"}" style="justify-content:space-between;margin-bottom:4px" data-lk="${esc(s.key)}"><span>${md(s.date)} <span class="lesson-no">${esc(s.lesson || "—")}</span></span><span class="small">🤔${s.total.lost || 0} 💡${s.total.aha || 0} ❓${s.posts.filter(p => p.kind === "q").length}</span></button>`).join("") : `<p class="empty">まだ記録がありません</p>`}
      </div>
      <div class="card paper">${cur ? sessionHTML(cur) : `<p class="empty">左から授業を選んでください</p>`}</div></div>`;
  }
  function sessionHTML(s) {
    const L = LL.lesson(s.lesson);
    const ts = s.rows.map(x => new Date(x.t).getTime());
    const t0 = Math.min(...ts, ...s.posts.map(p => new Date(p.at).getTime())), t1 = Math.max(...ts, ...s.posts.map(p => new Date(p.at).getTime()));
    const mins = Math.max(10, Math.round((t1 - t0) / 60e3) + 1);
    const kinds = [["lost", "🤔 わからない", "var(--bad)"], ["aha", "💡 なるほど", "var(--good)"], ["like", "👍 いいね", "var(--primary)"], ["slow", "🐢 ゆっくり", "var(--warn)"], ["help", "🆘 ヘルプ", "var(--violet)"]];
    const W = 680, RH = 34, LX = 118, TOP = 4, n = kinds.length;
    const bw = (W - LX - 8) / mins, barW = Math.max(3, Math.min(bw * 0.7, 16));
    const peak = {};
    const at = i => hm(t0 + i * 60e3);
    const rowsSvg = kinds.map(([k, t, col], r) => {
      const a = [];
      s.rows.filter(x => x.k === k).forEach(x => { const i = Math.round((new Date(x.t).getTime() - t0) / 60e3); a[i] = (a[i] || 0) + x.n; });
      const mx = Math.max(1, ...a.filter(Boolean));
      const pi = a.indexOf(Math.max(...a.filter(Boolean), 0));
      if (a.length) peak[k] = { i: pi, n: a[pi] };
      const base = TOP + (r + 1) * RH - 5;
      return `<g><text x="0" y="${base - 8}" class="fg-txt" style="font-size:13px;font-weight:700">${t}</text>
        <line x1="${LX}" x2="${W - 8}" y1="${base}" y2="${base}" class="tl-base"/>
        ${a.map((v, i) => { if (!v) return ""; const h = Math.max(3, v / mx * (RH - 10)); return `<rect x="${(LX + i * bw + (bw - barW) / 2).toFixed(1)}" y="${(base - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(3, barW / 2).toFixed(1)}" fill="${col}" opacity=".88"><title>${at(i)}　${v}件</title></rect>`; }).join("")}</g>`;
    });
    const step = mins <= 15 ? 5 : mins <= 40 ? 10 : 15;
    const ticks = [];
    for (let i = 0; i < mins; i += step) {
      const x = LX + i * bw + bw / 2;
      ticks.push(`<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${TOP}" y2="${TOP + n * RH - 5}" class="tl-tick"/><text x="${x.toFixed(1)}" y="${TOP + n * RH + 12}" text-anchor="middle" class="fg-txt" style="font-size:11px">${at(i)}</text>`);
    }
    const SH = TOP + n * RH + 18;
    return `<h2 style="font-family:var(--font-mincho);font-size:21px"><span class="lesson-no">${esc(s.lesson || "—")}</span> ${esc(L ? L.title : "")}　<span class="small muted">${md(s.date)}</span></h2>
      <p class="small">${peak.lost ? `🤔 「わからない」がいちばん多かったのは <b>${at(peak.lost.i)}ごろ</b>（${peak.lost.n}件）。` : "「わからない」はありませんでした。"}${peak.aha ? `　💡 「なるほど」は <b>${at(peak.aha.i)}ごろ</b> が最多。` : ""}</p>
      <div class="tscroll"><svg class="timeline" viewBox="0 0 ${W} ${SH}" style="width:100%;min-width:520px;height:auto;display:block" role="img" aria-label="反応の時間ごとの変化">${ticks.join("")}${rowsSvg.join("")}</svg></div>
      <h3 style="margin-top:14px">この授業の質問・コメント</h3>
      ${s.posts.length ? s.posts.map(p => `<div class="post"><div class="body">${p.kind === "q" ? "❓" : "💬"} ${esc(p.body)} <span class="small muted">${noOf(p.by)}番・${hm(p.at)}${p.kind === "q" ? `・🙋${p.plus}` : ""}${p.status === "done" ? "・回答ずみ" : p.status === "hidden" ? "・非表示" : ""}</span></div></div>`).join("") : `<p class="empty">ありません</p>`}
      <p class="small muted">授業改善のヒント：「わからない」が増えた時刻の直前に何を説明していたかをふり返ると、次の授業の発問や例の出し方を変える手がかりになります。</p>`;
  }
  on(app, "click", "[data-lk]", (e, b) => { T.log.key = b.dataset.lk; renderLogTab(); });

  /* ============================================================
     生徒・参加
     ============================================================ */
  function studentURL(join) {
    const base = location.href.replace(/[^/]*(\?.*)?$/, "");
    return `${base}index.html${join ? "?join=" + encodeURIComponent(join) : ""}`;
  }
  async function renderStudentsTab() {
    app.innerHTML = `<p class="empty">読み込み中…</p>`;
    try { await Promise.all([loadClasses(), loadRoster()]); } catch (e) { return; }
    T.cls = T.classes.find(c => c.id === T.cls.id) || T.cls;
    const c = T.cls;
    const url = studentURL(c.join_code);
    app.innerHTML = `<div class="cockpit" style="grid-template-columns:minmax(0,420px) minmax(0,1fr)">
      <div class="card stack">
        ${secHead("qr", "Join", `参加コード（${esc(c.school)} ${esc(c.label)}）`)}
        ${c.join_open ? `<div class="center"><div class="qr" style="width:220px">${qrSVG(url)}</div><div class="code-big">${esc(c.join_code)}</div></div>
          <p class="small">生徒はQRを読むか、生徒ページで「はじめての人」を選んでこのコードを入れます。</p>`
          : `<p class="msg warn">いまは新しい登録を受け付けていません（すでに登録した生徒はログインできます）。</p>`}
        <div class="row"><button class="btn small ${c.join_open ? "" : "primary"}" data-jo="${c.join_open ? "close" : "open"}">${c.join_open ? `${ic("lock")} 登録の受付を止める` : `${ic("play")} 登録の受付を再開`}</button>
          <button class="btn small ghost" data-jo="regen">コードを作り直す</button>
          <button class="btn small ghost" data-jo="copy">URLをコピー</button></div>
        <p class="small muted mb0">全員が登録できたら受付を止めておくと、ほかの人が勝手に登録できなくなります。</p>
        <p class="small muted mb0">生徒ページ：<span class="kbd">${esc(studentURL(""))}</span></p>
      </div>
      <div class="card paper">
        ${secHead("users", "Students", `登録した生徒（${T.students.length}人）`, `<button class="btn small" data-jo="reload">${ic("refresh")} 更新</button>`)}
        <div class="tscroll"><table class="t" style="margin-top:10px"><thead><tr><th>番号</th><th>ID</th><th>登録日</th><th>最後の接続</th><th>状態</th><th></th></tr></thead>
        <tbody>${T.students.map(s => `<tr><td><b>${s.no}</b></td><td class="nowrap"><span class="kbd">${esc(s.id)}</span></td><td class="small nowrap">${md(s.created_at)}</td><td class="small nowrap">${s.last_seen ? md(s.last_seen) + " " + hm(s.last_seen) : "—"}</td>
          <td>${s.locked ? `<span class="chip b">ロック中</span>` : ""}${s.must_change ? `<span class="chip w">仮パスワード</span>` : ""}</td>
          <td class="nowrap"><button class="btn small" data-pw="${esc(s.id)}">パスワード再発行</button> <button class="btn small ghost" data-del="${esc(s.id)}" title="番号をまちがえて登録した場合など">削除</button></td></tr>`).join("") || `<tr><td colspan="6" class="empty">まだいません</td></tr>`}</tbody></table></div>
        <p class="small muted">パスワードを忘れた生徒には「再発行」で4けたの仮パスワードを伝えます（ログイン後に自分で変えるよう案内が出ます）。小テスト・振り返りの記録は消えません。</p>
      </div></div>`;
  }
  on(app, "click", "[data-jo]", async (e, b) => {
    const op = b.dataset.jo, c = T.cls;
    if (op === "reload") return renderStudentsTab();
    if (op === "copy") { const ok = await copyText(studentURL(c.join_code)); return toast(ok ? "コピーしました" : "コピーできませんでした"); }
    if (op === "regen" && !(await confirmBox("参加コードを作り直しますか？", "<p>今のコードは使えなくなります（登録ずみの生徒には影響しません）。</p>", "作り直す"))) return;
    await call("live_t_class_join", { p_class_id: c.id, p_open: op === "open" ? true : op === "close" ? false : null, p_regen: op === "regen" });
    renderStudentsTab();
  });
  on(app, "click", "[data-pw]", async (e, b) => {
    const id = b.dataset.pw;
    if (!(await confirmBox("仮パスワードを発行しますか？", `<p>${esc(id)} の今のパスワードは使えなくなります。</p>`, "発行する"))) return;
    const r = await call("live_t_reset_password", { p_account_id: id });
    if (r.ok) modal(`<div class="eyebrow gold">Temporary Password</div><h2>仮パスワード</h2><p>${esc(id)} の仮パスワードは</p><p class="code-big center">${esc(r.temp)}</p><p class="small">生徒に伝えてください。ログインすると、自分のパスワードに変えるよう案内されます。</p>`);
    renderStudentsTab();
  });
  on(app, "click", "[data-del]", async (e, b) => {
    const id = b.dataset.del;
    if (!(await confirmBox("この生徒のアカウントを削除しますか？", `<p>${esc(id)} はログインできなくなります。小テスト・振り返りの記録は残ります。同じ番号で登録し直せます。</p>`, "削除する", true))) return;
    await call("live_t_delete_student", { p_account_id: id });
    renderStudentsTab();
  });

  /* ============================================================
     問題（配布前の確認・紙で配る用の印刷）
     ============================================================ */
  function renderBankTab() {
    const id = Store.get("ll:t:bank", T.P && T.P.state.lesson_id || "1-1");
    const showAns = Store.get("ll:t:bankans", true);
    const L = LL.lesson(id) || LL.LESSONS[0];
    const kana = "アイウエオカキク";
    const qHTML = (q, label) => {
      let h = `<div class="card paper flat" style="break-inside:avoid"><span class="q-pill ${label.includes("★") ? "star" : ""}">${esc(label)}</span><div class="lead">${LM.richText(q.lead)}</div>`;
      if (q.hint) h += `<p class="small muted no-print">💡 ${LM.richText(q.hint)}</p>`;
      if (q.table) h += `<div class="tscroll"><table class="t"><thead><tr>${q.table.head.map(x => `<th>${LM.richText(x)}</th>`).join("")}</tr></thead><tbody>${q.table.rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${LM.richText(c)}</td>` : `<th>${LM.richText(c)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      if (q.fig) h += LF.render(q.fig);
      if (q.type === "choice" || q.type === "multi") h += `<div class="small">${q.choices.map((c, i) => `<span style="margin-right:14px">${kana[i]}　${LM.richText(c)}</span>`).join("")}</div>`;
      if (q.type === "graph" || q.type === "plot") h += LF.wrap(400, 400, LF.grid(q.R).body, "sq", LF.grid(q.R).defs);
      if (q.type === "plot") h += `<p class="small">${q.points.map(p => `${esc(p[0])}(${p[1]}, ${p[2]})`).join("　")}</p>`;
      const subs = q.type === "input" || q.type === "choice" ? q.subs : [];
      h += subs.map(sub => `<div class="sub"><div class="p">${sub.lb ? `<span class="lb">${esc(sub.lb)}</span>` : ""}${sub.p ? LM.richText(sub.p) : ""}</div>${sub.fig ? LF.render(sub.fig) : ""}
        <div class="small ans" ${showAns ? "" : "hidden"}>答え：<b>${q.type === "choice" ? kana[sub.a] + "　" + LM.richText(q.choices[sub.a]) : LM.answerHTML(Object.assign({ mode: q.mode }, sub))}</b></div></div>`).join("");
      if (q.type === "multi") h += `<div class="small ans" ${showAns ? "" : "hidden"}>答え：<b>${q.a.map(i => kana[i]).join("、")}</b></div>`;
      if (q.type === "graph") h += `<div class="small ans" ${showAns ? "" : "hidden"}>答え：${QC.rightHTML({ type: "graph", q })}</div>`;
      if (q.sol) h += `<div class="sol ans" ${showAns ? "" : "hidden"}>📘 ${LM.richText(q.sol)}</div>`;
      return h + "</div>";
    };
    app.innerHTML = `<div class="stack" style="max-width:900px;margin:0 auto">
      <div class="card no-print">${secHead("book", "Problem Bank", "問題の確認・印刷")}<div class="row">
        <select class="in" id="bk-l" style="width:auto">${lessonOptions(L.id)}</select>
        <label class="check"><input type="checkbox" id="bk-a" ${showAns ? "checked" : ""}> 答えと解説を表示</label>
        <span class="grow"></span>
        <button class="btn small primary" id="bk-p">${ic("print")} 印刷（紙で配る）</button></div>
        <p class="small muted mb0">問題はすべてこのツールのために作ったものです。制限時間 ${Math.round(L.limit / 60)} 分・${QC.items(L).length} 問${L.bonus ? "＋★チャレンジ" : ""}${L.gen ? "・類題の自動生成あり" : ""}。印刷するときは「答えと解説を表示」を外すと問題用紙、付けると解答になります。</p></div>
      <div class="card paper">
        <h2 style="font-family:var(--font-mincho);font-size:22px"><span class="lesson-no">${esc(L.id)}</span> ${esc(L.title)}</h2>
        <p class="small">めあて：${esc(L.goal)}　<span class="print-only">年　　組　　番</span></p>
        <div class="stack">${L.qs.map((q, i) => qHTML(q, "問" + (i + 1))).join("")}${L.bonus ? qHTML(L.bonus, "★チャレンジ") : ""}</div>
      </div></div>`;
    $("#bk-l").onchange = e => { Store.set("ll:t:bank", e.target.value); renderBankTab(); };
    $("#bk-a").onchange = e => { Store.set("ll:t:bankans", e.target.checked); renderBankTab(); };
    $("#bk-p").onclick = () => window.print();
  }

  /* ---------- 設定 ---------- */
  function renderSettings() {
    app.innerHTML = `<div class="stack" style="max-width:640px">
      <div class="card">${secHead("key", "Security", "合言葉を変える")}
        <label class="f">今の合言葉</label><input class="in" type="password" id="s-old" autocomplete="current-password">
        <label class="f">新しい合言葉（8文字以上）</label><input class="in" type="password" id="s-new" autocomplete="new-password">
        <div class="row" style="margin-top:10px"><button class="btn primary" id="s-go">変える</button></div>
        <p class="small muted">変えると、ほかの端末の先生ログインは切れます。</p></div>
      <div class="card">${secHead(themeNow() === "day" ? "sun" : "moon", "Display", "画面")}<div class="row"><button class="btn" id="s-theme">${ic(themeNow() === "day" ? "moon" : "sun")} ${themeNow() === "day" ? "夜空の表示にする" : "昼の明るい表示にする"}</button><span class="small muted">いま：${themeNow() === "day" ? "昼" : "夜空"}</span></div></div>
      <div class="card">${secHead("sparkle", "About", "このツールについて")}
        <p class="small">接続先：${esc(API.config.name)}<br>問題：中1の全7章・${LL.LESSONS.length}回分（すべてこのツールのための自作問題）<br>
        生徒の名前・学校名は保存しません。IDは「学校コード＋学年・組・番号」です。</p>
        <button class="btn" id="s-out">${ic("logout")} ログアウト</button></div></div>`;
    $("#s-go").onclick = async () => {
      const r = await call("live_t_change_pass", { p_old: UI.pw($("#s-old").value), p_new: UI.pw($("#s-new").value) });
      toast(r.ok ? "合言葉を変えました" : { bad_pass: "今の合言葉がちがいます", weak_password: "8文字以上にしてください" }[r.error] || "変えられませんでした", r.ok ? "good" : "bad");
    };
    $("#s-theme").onclick = () => { Store.set("ll:theme", themeNow() === "day" ? "night" : "day"); applyTheme(); renderSettings(); };
    $("#s-out").onclick = () => logout(false);
  }
  function themeNow() { const t = Store.get("ll:theme", "night"); return t === "light" || t === "day" ? "day" : "night"; }
  function applyTheme() { if (themeNow() === "day") document.documentElement.setAttribute("data-theme", "day"); else document.documentElement.removeAttribute("data-theme"); }

  boot();
})();
