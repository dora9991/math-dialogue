/* ============================================================
   授業ライブ — 生徒の画面（デザイン：Astra 教室版）
   ============================================================ */
(function () {
  "use strict";
  const { $, esc, Store, toast, modal, confirmBox, mmss, md, Clock, on } = UI;
  const app = $("#app"), dock = $("#dock"), who = $("#who"), menuBtn = $("#menuBtn");
  const params = new URLSearchParams(location.search);
  const K = { tok: "ll:s:token", id: "ll:s:id", me: "ll:s:me" };
  const ic = (n, c) => IC.svg(n, c);

  // ヘッダーの紋章とメニューのアイコン
  $("#brand").insertAdjacentHTML("afterbegin", IC.emblem());
  menuBtn.innerHTML = ic("menu");

  const S = {
    token: null, me: null, v: null, state: null, st: {}, view: "boot", online: true,
    pulseTimer: null, posts: [], pulseN: 0, sig: {}, history: null, timerIv: null, lastBeep: null,
  };
  // 振り返りの観点ごとのアイコン（メダルに使う）
  const CAT_IC = { matome: "book", kanketsu: "check", toi: "question", mikata: "orbit", yosoku: "target", kanshin: "sparkle", manabikata: "quill", kaizen: "flag", tsumazuki: "lifebuoy", setsuzoku: "refresh" };

  /* ---------- 画面の明るさ（夜＝既定／昼） ---------- */
  function themeNow() { const t = Store.get("ll:theme", "night"); return t === "light" || t === "day" ? "day" : "night"; }
  function applyTheme() { if (themeNow() === "day") document.documentElement.setAttribute("data-theme", "day"); else document.documentElement.removeAttribute("data-theme"); }
  function toggleTheme() { Store.set("ll:theme", themeNow() === "day" ? "night" : "day"); applyTheme(); toast(themeNow() === "day" ? "昼の明るい表示にしました" : "夜空の表示にしました"); }
  applyTheme();

  /* ---------- 認証 ---------- */
  const getToken = () => Store.get(K.tok) || Store.sget(K.tok);
  function setToken(t, remember) {
    if (remember) { Store.set(K.tok, t); Store.sdel(K.tok); } else { Store.sset(K.tok, t); Store.del(K.tok); }
  }
  function clearToken() { Store.del(K.tok); Store.sdel(K.tok); Store.del(K.me); }

  async function boot() {
    S.token = getToken();
    if (S.token) {
      try {
        const r = await API.rpc("live_me", { p_token: S.token });
        if (r.ok) { S.me = r; Store.set(K.me, r); return enter(); }
        if (r.error === "auth") clearToken();
      } catch (e) {
        const me = Store.get(K.me);
        if (me) { S.me = me; setOnline(false); return enter(); }
      }
    }
    renderAuth(params.get("join") ? "reg" : "login");
  }

  function renderAuth(tab, msg) {
    S.view = "auth";
    dock.hidden = true; menuBtn.hidden = true; who.innerHTML = "";
    const join = (params.get("join") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    const lastId = Store.get(K.id) || "";
    app.innerHTML = `
      <div class="card stack enter" style="max-width:470px;margin:26px auto;padding:26px 22px">
        <div class="center">
          <div style="width:72px;margin:0 auto 6px">${IC.emblem()}</div>
          <div class="eyebrow gold">Astra Academy · Live Classroom</div>
          <h1 style="font-size:32px;margin:6px 0 2px;letter-spacing:.14em">授業ライブ</h1>
          <p class="small muted mb0">ログインして、今日の授業に参加しよう</p>
        </div>
        <div class="seg" role="tablist" id="auth-tabs" style="align-self:center">
          <button role="tab" data-tab="login" class="${tab === "login" ? "on" : ""}">ログイン</button>
          <button role="tab" data-tab="reg" class="${tab === "reg" ? "on" : ""}">はじめての人（登録）</button>
        </div>
        ${tab === "login" ? `
        <form id="f-login" class="stack" autocomplete="on" novalidate>
          <div>
            <label class="f" for="l-id">ID</label>
            <input class="in" id="l-id" name="username" autocomplete="username" placeholder="例: E-101205" value="${esc(lastId)}" autocapitalize="characters" spellcheck="false" maxlength="12" style="font-family:var(--font-round);font-weight:800;letter-spacing:.06em">
            <div class="field-hint">学校コード＋学年・組・番号。登録したときに表示されたIDです</div>
          </div>
          <div>
            <label class="f" for="l-pw">パスワード</label>
            <input class="in" id="l-pw" name="password" type="password" autocomplete="current-password" maxlength="64">
          </div>
          <label class="check"><input type="checkbox" id="l-rem" checked> この端末でログインしたままにする</label>
          <button class="btn primary big block slant" type="submit">${ic("play")} ログイン</button>
          <div id="msg">${msg ? `<div class="msg bad">${esc(msg)}</div>` : ""}</div>
          <p class="small muted mb0">IDやパスワードを忘れたときは、先生に伝えてください（仮のパスワードを出してもらえます）。はじめて使う人は上の「はじめての人（登録）」から。</p>
          ${UI.isLocal() ? `<p class="msg info small">🧪 検証用サーバーにつながっています（本番とは別のデータ）。旧 quiz/ のIDは使えません。先生画面の「生徒・参加」タブにある参加コードで登録するか、先生画面で「パスワード再発行」をしてください。</p>` : ""}
        </form>` : `
        <form id="f-reg" class="stack" novalidate>
          <div>
            <label class="f" for="r-join">参加コード（6文字）</label>
            <input class="in" id="r-join" value="${esc(join)}" autocapitalize="characters" spellcheck="false" maxlength="6" placeholder="先生が見せているコード" style="font-family:var(--mono);letter-spacing:.3em;font-size:22px;font-weight:800;text-align:center">
            <div class="field-hint" id="r-cls"></div>
          </div>
          <div>
            <label class="f" for="r-no">出席番号</label>
            <input class="in" id="r-no" type="number" inputmode="numeric" min="1" max="99" placeholder="例: 5" style="max-width:140px;font-family:var(--font-round);font-weight:800;font-size:20px">
          </div>
          <div>
            <label class="f" for="r-pw">パスワード（4文字以上）</label>
            <input class="in" id="r-pw" type="password" autocomplete="new-password" maxlength="64">
            <div class="field-hint">1234 や出席番号と同じものは使えません。ほかの人に見せないでね</div>
          </div>
          <div>
            <label class="f" for="r-pw2">もう一度（確認）</label>
            <input class="in" id="r-pw2" type="password" autocomplete="new-password" maxlength="64">
          </div>
          <label class="check"><input type="checkbox" id="r-rem" checked> この端末でログインしたままにする</label>
          <button class="btn primary big block slant" type="submit">${ic("sparkle")} 登録する</button>
          <div id="msg">${msg ? `<div class="msg bad">${esc(msg)}</div>` : ""}</div>
          <p class="small muted mb0">名前や学校名は保存しません。記録は「ID」で管理されます。</p>
        </form>`}
      </div>`;
    $("#auth-tabs").addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b && b.dataset.tab !== tab) renderAuth(b.dataset.tab); });
    if (tab === "login") {
      $("#f-login").addEventListener("submit", async e => {
        e.preventDefault();
        const id = UI.idNorm($("#l-id").value), pw = UI.pw($("#l-pw").value);
        if (!id || !pw) return showMsg("IDとパスワードを入れてください");
        showMsg("確認しています…", "info");
        try {
          const r = await API.rpc("live_login", { p_account_id: id, p_password: pw });
          if (r.ok) return afterLogin(r, $("#l-rem").checked);
          showMsg({ bad_login: "IDかパスワードがちがいます", locked: `何度もまちがえたので、${r.minutes || 5}分ほど待ってからためしてね`, no_class: "先生がまだクラスを作っていません。先生に伝えてください" }[r.error] || "ログインできませんでした");
        } catch (err) { showMsg("通信できませんでした。インターネットの接続を確かめてください"); }
      });
      if (!lastId) $("#l-id").focus(); else $("#l-pw").focus();
    } else {
      const joinIn = $("#r-join");
      const checkJoin = async () => {
        const code = UI.idNorm(joinIn.value).replace(/[^A-Z0-9]/g, "");
        if (joinIn.value !== code) joinIn.value = code;
        const box = $("#r-cls");
        if (code.length !== 6) { box.textContent = ""; return; }
        try {
          const r = await API.rpc("live_join_info", { p_join: code });
          box.innerHTML = r.ok ? `<span class="chip g">✓ ${esc(r.label)}に参加します</span>` : `<span class="chip b">参加コードがちがうか、受付が終わっています</span>`;
        } catch (err) { box.textContent = ""; }
      };
      joinIn.addEventListener("input", () => { if (joinIn.value.length >= 6) checkJoin(); });
      if (join) checkJoin();
      $("#f-reg").addEventListener("submit", async e => {
        e.preventDefault();
        const code = UI.idNorm(joinIn.value).replace(/[^A-Z0-9]/g, ""), no = parseInt(UI.pw($("#r-no").value), 10), pw = UI.pw($("#r-pw").value), pw2 = UI.pw($("#r-pw2").value);
        if (code.length !== 6) return showMsg("参加コード（6文字）を入れてください");
        if (!(no >= 1 && no <= 99)) return showMsg("出席番号を入れてください");
        if (pw.length < 4) return showMsg("パスワードは4文字以上にしてください");
        if (pw !== pw2) return showMsg("確認のパスワードが一致しません");
        showMsg("登録しています…", "info");
        try {
          const r = await API.rpc("live_register", { p_join: code, p_number: no, p_password: pw });
          if (r.ok) {
            await new Promise(res => {
              const m = modal(`<div class="center"><div class="eyebrow gold">Welcome</div><h2>登録できました</h2>
                <p class="mb0">あなたのIDは</p><p class="code-big center" style="letter-spacing:.06em;margin:6px 0">${esc(r.account_id)}</p>
                <p class="small">次からはこのIDとパスワードでログインします。<b>ノートにメモしておこう。</b></p>
                <button class="btn primary block big" data-ok>OK</button></div>`, { sticky: true, onClose: res });
              m.el.querySelector("[data-ok]").addEventListener("click", () => m.close());
            });
            return afterLogin(r, $("#r-rem").checked);
          }
          showMsg({
            id_taken: `その番号はもう登録されています（ID: ${r.account_id || ""}）。自分のIDなら「ログイン」から。パスワードを忘れたときは、先生に「パスワード再発行」をしてもらってください`,
            weak_password: "かんたんすぎるパスワードです。1234 や番号と同じものは使えません",
            bad_join: "参加コードがちがうか、受付が終わっています", bad_number: "出席番号を確かめてください",
            locked: "少し時間をおいてからためしてください",
          }[r.error] || "登録できませんでした");
        } catch (err) { showMsg("通信できませんでした"); }
      });
      (join ? $("#r-no") : joinIn).focus();
    }
  }
  function showMsg(t, kind) { const b = $("#msg"); if (b) b.innerHTML = `<div class="msg ${kind || "bad"}">${esc(t)}</div>`; }

  async function afterLogin(r, remember) {
    setToken(r.token, remember);
    S.token = r.token;
    S.me = { account_id: r.account_id, class: r.class, must_change: r.must_change, number: +String(r.account_id).slice(-2) };
    Store.set(K.id, r.account_id);
    Store.set(K.me, S.me);
    if (params.get("join")) history.replaceState(null, "", location.pathname);
    enter();
    if (r.must_change) setTimeout(() => changePassword(true), 400);
  }

  function logout(expired) {
    clearTimeout(S.pulseTimer);
    if (S.token && !expired) API.rpc("live_logout", { p_token: S.token }).catch(() => {});
    clearToken();
    S.token = null; S.v = null; S.state = null;
    renderAuth("login", expired ? "ログインの期限が切れました。もう一度ログインしてください" : "");
  }

  async function changePassword(forced) {
    const m = modal(`<h2>${ic("key")} パスワードを変える</h2>
      ${forced ? `<p class="msg warn">先生が出した仮のパスワードでログインしました。自分だけのパスワードに変えましょう。</p>` : ""}
      <label class="f">今のパスワード</label><input class="in" type="password" id="cp-old" autocomplete="current-password">
      <label class="f">新しいパスワード（4文字以上）</label><input class="in" type="password" id="cp-new" autocomplete="new-password">
      <label class="f">もう一度</label><input class="in" type="password" id="cp-new2" autocomplete="new-password">
      <div id="cp-msg"></div>
      <div class="row end" style="margin-top:14px"><button class="btn ghost" data-x>${forced ? "あとで" : "やめる"}</button><button class="btn primary" data-go>変える</button></div>`);
    m.el.querySelector("[data-x]").addEventListener("click", () => m.close());
    m.el.querySelector("[data-go]").addEventListener("click", async () => {
      const o = UI.pw($("#cp-old").value), n = UI.pw($("#cp-new").value), n2 = UI.pw($("#cp-new2").value);
      const say = t => { $("#cp-msg").innerHTML = `<div class="msg bad">${esc(t)}</div>`; };
      if (n.length < 4) return say("4文字以上にしてください");
      if (n !== n2) return say("確認が一致しません");
      try {
        const r = await API.rpc("live_change_password", { p_token: S.token, p_old: o, p_new: n });
        if (r.ok) { m.close(); toast("パスワードを変えました", "good"); S.me.must_change = false; Store.set(K.me, S.me); }
        else say({ bad_login: "今のパスワードがちがいます", weak_password: "かんたんすぎるパスワードです" }[r.error] || "変えられませんでした");
      } catch (e) { say("通信できませんでした"); }
    });
  }

  /* ---------- 入室後 ---------- */
  function enter() {
    menuBtn.hidden = false;
    const no = S.me.number || +String(S.me.account_id).slice(-2);
    who.innerHTML = `<span class="badge"><span class="num">${esc(no)}</span>${esc(S.me.class ? S.me.class.label : "")}</span><span class="dot on" id="netdot" title="接続中"></span>`;
    goHome();
    pulse();
    if (!S.timerIv) S.timerIv = setInterval(tickTimer, 250);
  }

  function setOnline(v) {
    S.online = v;
    $("#offline").hidden = v;
    const d = $("#netdot");
    if (d) { d.className = "dot " + (v ? "on" : "off"); d.title = v ? "接続中" : "オフライン"; }
  }

  async function pulse() {
    clearTimeout(S.pulseTimer);
    if (!S.token) return;
    try {
      const r = await API.rpc("live_pulse", { p_token: S.token, p_v: S.v }, { timeout: 8000 });
      if (r.error === "auth") return logout(true);
      Clock.sync(r.now);
      setOnline(true);
      S.st = r.me || {};
      if (r.state !== undefined) {
        const prev = S.state;
        S.state = r.state;
        S.v = r.v;
        onStateChange(prev, r.state);
      }
      S.pulseN++;
      if (S.view === "home") {
        if (S.state && S.state.lesson_id && S.pulseN % 3 === 1) loadPosts();
        updateHome();
      }
      updateDock();
    } catch (e) {
      setOnline(false);
    }
    API.flush(onFlushed);
    const delay = !S.online ? 5000 : document.hidden ? 15000 : S.view === "quiz" ? 6000 : 3000;
    S.pulseTimer = setTimeout(pulse, delay);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && S.token) pulse(); });
  window.addEventListener("online", () => { if (S.token) pulse(); });

  function onFlushed(item, r) {
    if (r && r.ok) toast(item.meta.label ? `${item.meta.label}を送信しました` : "保存していた記録を送信しました", "good");
    else if (r && r.error) toast(`${item.meta.label || "記録"}は送れませんでした（${r.error === "closed" ? "受付が終わっていました" : r.error === "already" ? "すでに提出済み" : "エラー"}）`, "bad", 5000);
  }

  function onStateChange(prev, cur) {
    if (!cur) return;
    const p = prev || {};
    if (prev) {
      // 同時にいくつも変わったときは、通知を1つにまとめる
      const msgs = [];
      let bz = false;
      if (cur.lesson_id && cur.lesson_id !== p.lesson_id) msgs.push("授業が始まりました ✨");
      if (cur.quiz_lesson && cur.quiz_lesson !== p.quiz_lesson) { msgs.push("小テストが配布されました 📝"); bz = true; }
      if (cur.reflect_lesson && cur.reflect_lesson !== p.reflect_lesson) msgs.push("振り返りの受付が始まりました ✏️");
      if (cur.poll && cur.poll.open && (!p.poll || p.poll.id !== cur.poll.id)) { msgs.push("先生から質問が届きました 🙋"); bz = true; }
      if (cur.notice && cur.notice !== p.notice) msgs.push("お知らせ：" + cur.notice);
      if (cur.task_no !== p.task_no && cur.task_label) msgs.push("課題：" + cur.task_label);
      if (msgs.length === 1) toast(msgs[0], null, 3500);
      else if (msgs.length > 1) toast(`${msgs[0]}（ほかに ${msgs.length - 1} 件）`, null, 3500);
      if (bz) buzz();
    }
    if (S.view === "quiz" && Q && !Q.practice && cur.quiz_lesson !== Q.lesson.id) {
      toast("先生が小テストを締め切りました。解答はこの端末に保存されています", "bad", 5000);
    }
  }
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) { /* なにもしない */ } }

  /* ---------- メニュー ---------- */
  menuBtn.addEventListener("click", () => {
    const item = (k, icon, t, sub) => `<button class="btn block" style="justify-content:flex-start;min-height:52px" data-m="${k}">${ic(icon)}<span style="text-align:left"><b>${t}</b>${sub ? `<br><span class="small muted" style="font-weight:600">${sub}</span>` : ""}</span></button>`;
    const m = modal(`<div class="eyebrow gold">Menu</div><h2>メニュー</h2><div class="stack" style="gap:8px">
      ${item("home", "home", "ホーム")}
      ${item("records", "book", "わたしの記録", "小テストの点数・振り返り・光ったところ")}
      ${item("practice", "target", "練習する", "何回でも。記録されません")}
      ${item("pw", "key", "パスワードを変える")}
      ${item("theme", themeNow() === "day" ? "moon" : "sun", themeNow() === "day" ? "夜空の表示にする" : "昼の明るい表示にする")}
      ${item("logout", "logout", "ログアウト")}
      <p class="small muted center mb0">ID: ${esc(S.me.account_id)}　接続先: ${esc(API.config.name)}</p></div>`);
    m.el.addEventListener("click", e => {
      const b = e.target.closest("[data-m]"); if (!b) return;
      m.close();
      const k = b.dataset.m;
      if (k === "home") goHome();
      if (k === "records") openRecords();
      if (k === "practice") openPractice();
      if (k === "pw") changePassword(false);
      if (k === "theme") toggleTheme();
      if (k === "logout") confirmBox("ログアウトしますか？", "<p>次に使うときはIDとパスワードが必要です。</p>", "ログアウト").then(ok => { if (ok) logout(false); });
    });
  });

  /* ---------- ホーム ---------- */
  function goHome() {
    S.view = "home";
    S.sig = {};
    app.innerHTML = `
      <div id="h-notice"></div>
      <div id="h-timer" class="timerbar" hidden></div>
      <div class="stack enter">
        <section id="h-lesson"></section>
        <section id="h-poll"></section>
        <section id="h-task"></section>
        <section id="h-quiz"></section>
        <section id="h-reflect"></section>
        <section id="h-board"></section>
        <section id="h-more"></section>
      </div>`;
    updateHome();
    updateDock();
    if (S.state && S.state.lesson_id) loadPosts();
    window.scrollTo(0, 0);
  }

  function setPart(id, sig, html, after) {
    if (S.sig[id] === sig) return;
    S.sig[id] = sig;
    const el = $("#" + id);
    if (!el) return;
    el.innerHTML = html;
    if (after) after(el);
  }

  function updateHome() {
    if (S.view !== "home") return;
    const s = S.state || {};
    const L = s.lesson_id ? LL.lesson(s.lesson_id) : null;
    setPart("h-notice", "n" + (s.notice || ""), s.notice ? `<div class="card warn enter" style="margin-bottom:14px;display:flex;gap:10px;align-items:center">${ic("megaphone")}<div><div class="eyebrow gold">Notice</div><b>${esc(s.notice)}</b></div></div>` : "");

    // 授業（ヒーロー）／授業前（待機）
    if (L) {
      const u = LL.unit(L.unit);
      setPart("h-lesson", `L${L.id}|${s.meate}`, `<div class="hero enter" style="--uc:${u.color}">
        <div class="hero-crest">${IC.unit(u.no)}</div>
        <div class="eyebrow">Today's Lesson · 第${u.no}章 ${esc(u.name)}</div>
        <div class="hero-title"><span class="lesson-no">${esc(L.id)}</span>${esc(L.title)}</div>
        <div class="objective">${ic("star")}<span class="k">Objective · めあて</span><p>${esc(s.meate || L.goal)}</p></div>
        <p class="hero-hint">下の光るボタンで「いいね」「わからない」などを先生に伝えられます。名前はみんなには出ません。</p>
      </div>`);
    } else {
      setPart("h-lesson", "none", `<div class="card await enter">
        <div class="orb" aria-hidden="true"></div>
        <div class="eyebrow gold">Waiting for class</div>
        <h2>授業の開始を待っています<span class="twinkle" aria-hidden="true"><i></i><i></i><i></i></span></h2>
        <p class="muted small mb0">先生が授業を始めると、この画面が自動で切りかわります。<br>そのあいだに、前の授業をふり返ったり練習したりできます。</p>
      </div>`);
    }

    // 投票
    const poll = s.poll;
    if (poll && (poll.open || poll.show)) {
      setPart("h-poll", "p" + JSON.stringify(poll), pollHTML(poll), wirePoll);
    } else setPart("h-poll", "none", "");

    // 課題（できた！）
    if (L && (s.task_label || s.task_no > 0)) {
      const done = !!S.st.done;
      setPart("h-task", `t${s.task_no}|${s.task_label}|${done}`, `<div class="tile mint enter">
        ${ic("task", "big-ic")}
        <div class="ribbon">Mission · いまの課題</div>
        <h2>${esc(s.task_label || "課題 " + s.task_no)}</h2>
        <p class="meta">${done ? "終わった人は、まわりの人に説明したり、★チャレンジに進もう。" : "終わったら「できた！」を押して先生に知らせよう。"}</p>
        <button class="btn ${done ? "" : "good"} big block ${done ? "" : "slant"}" data-act="done" aria-pressed="${done}">${done ? `${ic("check")} できた！（もう一度押すと取り消し）` : `${ic("check")} できた！`}</button>
      </div>`);
    } else setPart("h-task", "none", "");

    // 小テスト
    if (s.quiz_lesson) {
      const QL = LL.lesson(s.quiz_lesson);
      const limit = s.quiz_limit_sec || (QL && QL.limit) || 420;
      const res = Store.get(resKey(s.quiz_lesson));
      setPart("h-quiz", `q${s.quiz_lesson}|${s.quiz_done}|${limit}|${!!res}`, QL ? `<div class="tile cyan enter">
        ${ic("quiz", "big-ic")}
        <div class="ribbon">Quiz · 小テスト</div>
        <h2><span class="lesson-no">${esc(QL.id)}</span> ${esc(QL.title)}</h2>
        ${s.quiz_done
          ? `<p class="meta"><span class="state">${ic("check")} 提出しました${res ? `（${Math.min(res.score, res.max)} / ${res.max} 点${res.score > res.max ? "＋★" : ""}）` : ""}</span></p>
             <div class="row">${res ? `<button class="btn blue" data-act="quiz-result">${ic("book")} 結果と解説を見る</button>` : ""}<button class="btn" data-act="quiz-practice">${ic("refresh")} もう一度（練習）</button></div>`
          : `<p class="meta">${ic("clock")} 制限時間 ${Math.round(limit / 60)} 分・${QC.items(QL).length} 問${QL.bonus ? "＋★チャレンジ" : ""}<br><span class="small">途中で閉じても、続きから再開できます。</span></p>
             <button class="btn primary big block slant" data-act="quiz-start">${ic("play")} はじめる</button>`}
      </div>` : "");
    } else setPart("h-quiz", "none", "");

    // 振り返り
    if (s.reflect_lesson) {
      const RL = LL.lesson(s.reflect_lesson);
      setPart("h-reflect", `r${s.reflect_lesson}|${s.reflect_done}|${s.reflect_mode}`, RL ? `<div class="tile violet enter">
        ${ic("quill", "big-ic")}
        <div class="ribbon">Reflection · 振り返り${s.reflect_mode === "deep" ? "（じっくり）" : ""}</div>
        <h2><span class="lesson-no">${esc(RL.id)}</span> ${esc(RL.title)}</h2>
        ${s.reflect_done
          ? `<p class="meta"><span class="state">${ic("check")} 書きました。書き直すこともできます。</span></p><button class="btn violet" data-act="reflect">${ic("quill")} 書き直す</button>`
          : `<p class="meta">${s.reflect_mode === "deep" ? "単元のまとめ。少し時間をかけて書こう（10分くらい）" : "2〜3分でOK。単語や箇条書きでもだいじょうぶ"}</p>
             <button class="btn primary big block slant" data-act="reflect">${ic("quill")} 振り返りを書く</button>`}
      </div>` : "");
    } else setPart("h-reflect", "none", "");

    // 質問ボード
    if (L) {
      const qs = S.posts.filter(p => p.kind === "q");
      const pins = S.posts.filter(p => p.kind === "c" && (p.pinned || p.mine));
      setPart("h-board", "b" + JSON.stringify(S.posts) + s.share_posts, `<div class="card enter">
        <div class="row between"><div class="sec-head" style="margin:0">${ic("question")}<div><span class="eyebrow">Questions</span><h2>みんなの質問 <span class="chip">${qs.length}</span></h2></div></div><button class="btn small blue" data-act="post-q">${ic("plus")} 質問する</button></div>
        <p class="small muted">同じことが気になったら「わたしも」。多い質問から先生がとり上げます。${s.share_posts === false ? "（いまは先生だけが見ています）" : ""}</p>
        <div>${qs.length ? qs.map(postHTML).join("") : `<div class="empty">まだ質問はありません。最初の質問者になろう！</div>`}</div>
        ${pins.length ? `<h3 style="margin-top:12px;display:flex;align-items:center;gap:6px">${ic("chat")} コメント</h3>${pins.map(postHTML).join("")}` : ""}
      </div>`);
    } else setPart("h-board", "none", "");

    setPart("h-more", "more", `<div class="row" style="justify-content:center">
      <button class="btn soft" data-act="records">${ic("book")} わたしの記録</button>
      <button class="btn soft" data-act="practice">${ic("target")} 練習する</button></div>`);
  }

  function postHTML(p) {
    return `<div class="post">
      <div class="body">${esc(p.body)}
        <div class="row small" style="margin-top:4px;gap:6px">
          ${p.mine ? `<span class="chip p">あなた</span>` : ""}${p.pinned ? `<span class="chip v">📌 先生がピックアップ</span>` : ""}${p.status === "done" ? `<span class="chip g">✓ 回答ずみ</span>` : ""}
        </div>
      </div>
      ${p.kind === "q" ? `<button class="btn small plus ${p.plused ? "on" : ""}" data-plus="${p.id}" ${p.mine ? "disabled title='自分の質問'" : ""} aria-pressed="${!!p.plused}">🙋 わたしも <b>${p.plus}</b></button>` : ""}
    </div>`;
  }

  async function loadPosts() {
    try {
      const r = await API.rpc("live_posts_student", { p_token: S.token });
      if (r.posts) { S.posts = r.posts; updateHome(); }
    } catch (e) { /* 次の確認でやり直す */ }
  }

  on(app, "click", "[data-plus]", async (e, b) => {
    const id = +b.dataset.plus;
    const p = S.posts.find(x => x.id === id);
    if (p) { p.plused = !p.plused; p.plus += p.plused ? 1 : -1; S.sig["h-board"] = null; updateHome(); }
    try { await API.rpc("live_plus", { p_token: S.token, p_post_id: id }); } catch (err) { toast("通信できませんでした", "bad"); }
    loadPosts();
  });

  on(app, "click", "[data-act]", (e, b) => {
    const a = b.dataset.act;
    if (a === "quiz-start") startQuiz(S.state.quiz_lesson, false);
    if (a === "quiz-practice") startQuiz(S.state.quiz_lesson, true);
    if (a === "quiz-result") { const r = Store.get(resKey(S.state.quiz_lesson)); if (r) showResult(LL.lesson(S.state.quiz_lesson), r.answers, { state: "saved", practice: false }); }
    if (a === "reflect") openReflect(S.state.reflect_lesson);
    if (a === "done") react(S.st.done ? "undone" : "done");
    if (a === "post-q") openPost("q");
    if (a === "records") openRecords();
    if (a === "practice") openPractice();
    if (a === "home") goHome();
  });

  /* ---------- 投票 ---------- */
  const SCALE = [["1", "😣", "わからない"], ["2", "😐", "すこし不安"], ["3", "🙂", "だいたい"], ["4", "😄", "バッチリ"]];
  function pollOptions(poll) {
    if (poll.kind === "scale") return SCALE.map(([v, e, t]) => ({ v, label: `${e} ${t}` }));
    if (poll.kind === "tf") return [{ v: "○", label: "○" }, { v: "×", label: "×" }];
    if (poll.kind === "abcd") {
      const ops = Array.isArray(poll.options) && poll.options.length ? poll.options : ["A", "B", "C", "D"];
      return ops.map((o, i) => ({ v: "ABCDEF"[i], label: `${"ABCDEF"[i]}${o && o !== "ABCDEF"[i] ? "　" + o : ""}` }));
    }
    return null;
  }
  function pollHTML(poll) {
    const ops = pollOptions(poll);
    const mine = poll.mine;
    let body = "";
    if (poll.show && poll.result) {
      const total = poll.result.reduce((a, r) => a + r.n, 0) || 1;
      const labelOf = v => { const o = ops && ops.find(x => x.v === v); return o ? o.label : v; };
      const isRight = v => poll.answer != null && String(poll.answer) !== "" && (poll.kind === "num" ? LM.gradeSub({ mode: poll.mode || "num", a: poll.answer }, v).ok : String(v) === String(poll.answer));
      body = `<div>${poll.result.map(r => `<div class="hbar" style="grid-template-columns:120px 1fr 48px"><span>${poll.kind === "num" ? LM.preview(r.a, poll.mode || "num").html || esc(r.a) : esc(labelOf(r.a))}${isRight(r.a) ? " ✅" : ""}</span><div class="bar ${isRight(r.a) ? "good" : ""}"><i style="width:${Math.round(r.n / total * 100)}%"></i></div><span>${r.n}人</span></div>`).join("")}</div>
        ${mine ? `<p class="small mb0" style="margin-top:6px">あなたの答え：<b>${poll.kind === "num" ? LM.preview(mine, poll.mode || "num").html : esc(labelOf(mine))}</b>${poll.answer != null && poll.answer !== "" ? (isRight(mine) ? " ⭕" : " ❌") : ""}</p>` : ""}`;
    } else if (!poll.open) {
      body = `<p class="muted mb0">締め切りました。${mine ? "あなたの答えは送信ずみです。" : ""}</p>`;
    } else if (ops) {
      body = `<div class="choices ${ops.length === 4 || ops.length === 2 ? "cols2" : ""}">${ops.map(o => `<button class="choice ${mine === o.v ? "on" : ""}" data-pv="${esc(o.v)}"><span class="mk"></span><span>${LM.richText(o.label)}</span></button>`).join("")}</div>
        ${mine ? `<p class="small muted mb0" style="margin-top:8px">送信しました。締め切りまで変えられます。</p>` : ""}`;
    } else {
      body = `<div id="poll-in"></div><div class="row end" style="margin-top:8px">${mine ? `<span class="small muted">送信ずみ（変えられます）</span>` : ""}<button class="btn primary" data-psend>${ic("play")} 送信</button></div>`;
    }
    return `<div class="tile cyan enter">
      ${ic("poll", "big-ic")}
      <div class="ribbon">Question · 先生からの質問</div>
      <h2>${poll.q ? LM.richText(poll.q) : { scale: "今の理解度は？", abcd: "どれだと思う？", tf: "○か×か？", num: "答えを入力しよう", text: "ひとことで答えよう" }[poll.kind]}</h2>
      ${body}</div>`;
  }
  let pollField = null;
  function wirePoll(el) {
    const poll = S.state.poll;
    el.querySelectorAll("[data-pv]").forEach(b => b.addEventListener("click", () => sendPoll(b.dataset.pv)));
    const box = el.querySelector("#poll-in");
    if (box) {
      if (poll.kind === "num") { pollField = MI.create({ mode: poll.mode || "num", value: poll.mine || "", onEnter: () => sendPoll(pollField.value) }); box.appendChild(pollField.el); }
      else { box.innerHTML = `<input class="in" id="poll-text" maxlength="60" placeholder="ひとことで（60字まで）" value="${esc(poll.mine || "")}">`; pollField = { get value() { return $("#poll-text").value; } }; }
    }
    const sb = el.querySelector("[data-psend]");
    if (sb) sb.addEventListener("click", () => sendPoll(pollField ? pollField.value : ""));
  }
  async function sendPoll(v) {
    v = String(v || "").trim();
    if (!v) return toast("答えを入れてね");
    const poll = S.state.poll;
    if (poll.kind === "num") {
      const pv = LM.preview(v, poll.mode || "num");
      if (pv.err) return toast("読み取れない式です：" + pv.err, "bad", 3500);
    }
    try {
      const r = await API.rpc("live_poll_answer", { p_token: S.token, p_poll_id: poll.id, p_answer: v });
      if (r.ok) { poll.mine = v; S.sig["h-poll"] = null; updateHome(); toast("送信しました", "good"); }
      else toast(r.error === "closed" ? "締め切られていました" : "送信できませんでした", "bad");
    } catch (e) { toast("通信できませんでした", "bad"); }
  }

  /* ---------- 反応ボタン ---------- */
  const EMO = { like: "👍", aha: "💡", slow: "🐢", again: "🔁", lost: "🤔", hand: "✋", help: "🆘" };
  const cool = {};
  function updateDock() {
    const show = S.view === "home" && S.state && S.state.lesson_id;
    dock.hidden = !show;
    if (!show) return;
    const setT = (k, on, onLabel, offLabel) => {
      const b = dock.querySelector(`[data-rx="${k}"]`);
      b.classList.toggle("on", !!on);
      b.setAttribute("aria-pressed", String(!!on));
      b.querySelector(".lbl").textContent = on ? onLabel : offLabel;
    };
    setT("lost", S.st.lost, "わからない中", "わからない");
    setT("hand", S.st.hand, "手をあげ中", "手をあげる");
    setT("help", S.st.help, "先生を呼び中", "ヘルプ");
  }
  on(dock, "click", "[data-rx]", (e, b) => {
    const k = b.dataset.rx;
    if (k === "q" || k === "c") return openPost(k);
    if (k === "lost" || k === "hand" || k === "help") {
      const now = !S.st[k];
      S.st[k] = now; updateDock();
      react(`${k}_${now ? "on" : "off"}`);
      if (now) floaty(b, EMO[k]);
      toast({ lost: now ? "「わからない」を先生に伝えました。わかったらもう一度おしてね" : "わかった！よかった👏", hand: now ? "手をあげました。先生が当てるまで待とう" : "手をおろしました", help: now ? "先生を呼んでいます。少し待ってね" : "ヘルプを取り消しました" }[k]);
      return;
    }
    if (cool[k] && Date.now() - cool[k] < 1500) return;
    cool[k] = Date.now();
    floaty(b, EMO[k]);
    react(k);
  });
  function floaty(btn, emo) {
    const r = btn.getBoundingClientRect();
    const f = document.createElement("div");
    f.className = "floaty"; f.textContent = emo;
    f.style.left = (r.left + r.width / 2) + "px"; f.style.top = (r.top - 10) + "px";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  }
  async function react(kind) {
    try {
      const r = await API.rpc("live_react", { p_token: S.token, p_kind: kind });
      if (r.error === "no_lesson") toast("いまは授業中ではありません");
      if (kind === "done" || kind === "undone") { S.st.done = kind === "done"; S.sig["h-task"] = null; updateHome(); if (kind === "done") toast("できた！を送りました 🎉", "good"); }
    } catch (e) { toast("通信できませんでした", "bad"); }
  }

  function openPost(kind) {
    const m = modal(`<div class="eyebrow">${kind === "q" ? "Question" : "Comment"}</div><h2>${kind === "q" ? "質問する" : "コメントする"}</h2>
      <p class="small muted">${kind === "q" ? "みんなには名前を出さずに表示されます（先生には表示されます）。" : "先生にだけ届きます。先生がピックアップすると、名前なしでみんなに表示されます。"}</p>
      <textarea class="in" id="pt" maxlength="300" placeholder="${kind === "q" ? "例：なぜ負の数どうしをかけると正になるの？" : "例：数直線で考えるとわかりやすかった"}"></textarea>
      <div class="row between" style="margin-top:10px"><span class="small muted" id="pc">0 / 300</span>
      <span class="row"><button class="btn ghost" data-x>やめる</button><button class="btn primary" data-go>${ic("play")} 送る</button></span></div>`);
    const ta = m.el.querySelector("#pt");
    ta.addEventListener("input", () => { m.el.querySelector("#pc").textContent = `${ta.value.length} / 300`; });
    m.el.querySelector("[data-x]").addEventListener("click", () => m.close());
    m.el.querySelector("[data-go]").addEventListener("click", async () => {
      const t = ta.value.trim();
      if (!t) return toast("何か書いてね");
      try {
        const r = await API.rpc("live_post", { p_token: S.token, p_kind: kind, p_body: t });
        if (r.ok) { m.close(); toast(kind === "q" ? "質問を送りました" : "コメントを送りました", "good"); loadPosts(); }
        else toast({ too_many: "少し時間をおいてから送ってね", no_lesson: "いまは授業中ではありません", empty: "何か書いてね" }[r.error] || "送れませんでした", "bad");
      } catch (e) { toast("通信できませんでした", "bad"); }
    });
  }

  /* ---------- タイマー ---------- */
  function tickTimer() {
    const box = $("#h-timer");
    const s = S.state;
    if (!box || S.view !== "home") return;
    if (!s || !s.timer_end) { box.hidden = true; return; }
    const left = (new Date(s.timer_end).getTime() - Clock.now()) / 1000;
    const total = s.timer_total || 60;
    box.hidden = false;
    const pct = Math.max(0, Math.min(100, left / total * 100));
    const cls = left <= 0 ? "bad" : left < 30 ? "warn" : "";
    const txt = left > 0 ? mmss(left) : "時間です！";
    const html = `<div class="card">${ic("clock")}<div class="grow"><div class="eyebrow gold" style="font-size:10px">${esc(s.timer_label || "Timer")}</div><div class="bar ${cls}"><i style="width:${pct}%"></i></div></div><span class="t">${txt}</span></div>`;
    if (box.innerHTML !== html) box.innerHTML = html;
    if (left <= 0 && S.lastBeep !== s.timer_end) { S.lastBeep = s.timer_end; buzz(); }
  }

  /* ============================================================
     小テスト
     ============================================================ */
  let Q = null;
  const today = () => UI.ymd(Clock.now());
  const draftKey = id => `ll:draft:${S.me.account_id}:${id}:${today()}`;
  const resKey = id => `ll:res:${S.me && S.me.account_id}:${id}:${today()}`;

  function startQuiz(lessonId, practice, opts) {
    const L = LL.lesson(lessonId);
    if (!L) return toast("この小テストはまだ用意されていません", "bad");
    opts = opts || {};
    const dk = draftKey(lessonId) + (practice ? ":p" : "");
    const saved = practice && !opts.resume ? null : Store.get(dk);
    const limit = practice ? 0 : (S.state && S.state.quiz_limit_sec) || L.limit;
    Q = {
      lesson: L, practice, dk, answers: (saved && saved.answers) || {}, startedAt: (saved && saved.startedAt) || Clock.now(),
      limit, cur: (saved && saved.cur) || 0, submitted: false, fields: [],
    };
    if (practice) Q.startedAt = Clock.now();
    S.view = "quiz";
    dock.hidden = true;
    renderQuiz();
    if (Q.limit) { clearInterval(Q.iv); Q.iv = setInterval(quizTick, 500); }
  }
  function saveDraft() { if (Q && !Q.submitted) Store.set(Q.dk, { answers: Q.answers, startedAt: Q.startedAt, cur: Q.cur }); }
  const nQ = () => Q.lesson.qs.length + (Q.lesson.bonus ? 1 : 0);
  function qAt(i) { return i < Q.lesson.qs.length ? Q.lesson.qs[i] : Q.lesson.bonus; }
  function keysOf(i) {
    const q = qAt(i);
    if (i >= Q.lesson.qs.length) return ["b"];
    if (q.type === "input" || q.type === "choice") return q.subs.map((s, si) => `${i}.${si}`);
    return [`${i}`];
  }
  const answered = k => { const a = Q.answers[k]; return a !== undefined && a !== null && a !== "" && !(Array.isArray(a) && !a.length) && !(typeof a === "object" && !Array.isArray(a) && !Object.keys(a).length); };
  function progressPct() {
    const its = QC.items(Q.lesson);
    return its.length ? Math.round(its.filter(it => answered(it.k)).length / its.length * 100) : 0;
  }

  function quizTick() {
    if (!Q || Q.submitted || !Q.limit || S.view !== "quiz") return;
    const left = Q.limit - (Clock.now() - Q.startedAt) / 1000;
    const el = $("#qtimer");
    if (el) { el.innerHTML = `${ic("clock")} ${left > 0 ? mmss(left) : "0:00"}`; el.className = "chip " + (left < 60 ? "b" : left < 120 ? "w" : "p"); }
    if (left <= 0) { toast("時間になりました。提出します", "bad"); submitQuiz(true); }
  }

  function renderQuiz() {
    const L = Q.lesson;
    const n = nQ();
    const done = Array.from({ length: n }, (_, i) => keysOf(i).every(answered));
    app.innerHTML = `
      <div class="qhead">
        <button class="btn ghost small" data-q="exit">${ic("left")} ${Q.practice ? "やめる" : "中断"}</button>
        <div class="grow"><div class="eyebrow" style="font-size:10px">${Q.practice ? "Practice · 練習（記録されません）" : "Quiz · 小テスト"}</div><b><span class="lesson-no">${esc(L.id)}</span> ${esc(L.title)}</b></div>
        ${Q.limit ? `<span class="chip p" id="qtimer" style="font-size:16px;padding:5px 12px"></span>` : ""}
      </div>
      <div class="qprog" aria-hidden="true"><i id="qprog" style="width:${progressPct()}%"></i></div>
      <div class="qnav" role="tablist" aria-label="問題の番号">
        ${Array.from({ length: n }, (_, i) => `<button role="tab" class="${done[i] ? "done" : ""} ${i === Q.cur ? "cur" : ""} ${i >= L.qs.length ? "star" : ""}" data-go="${i}" aria-label="${i >= L.qs.length ? "チャレンジ" : "問" + (i + 1)}">${i >= L.qs.length ? "★" : i + 1}</button>`).join("")}
        <button data-go="review" class="rv ${Q.cur === "review" ? "cur" : ""}">見直し</button>
      </div>
      <div id="qbody" class="enter"></div>
      <div class="row between" style="margin-top:16px">
        <button class="btn" data-q="prev" ${Q.cur === 0 ? "disabled" : ""}>${ic("left")} まえ</button>
        ${Q.cur === "review" ? "" : Q.cur >= n - 1 ? `<button class="btn primary" data-go="review">見直して提出へ ${ic("right")}</button>` : `<button class="btn blue" data-q="next">つぎ ${ic("right")}</button>`}
      </div>`;
    const body = $("#qbody");
    if (Q.cur === "review") body.appendChild(reviewEl());
    else body.appendChild(questionEl(Q.cur));
    quizTick();
    window.scrollTo(0, 0);
  }

  function questionEl(i) {
    const q = qAt(i);
    const isBonus = i >= Q.lesson.qs.length;
    const card = document.createElement("div");
    card.className = "card paper";
    card.innerHTML = `
      ${isBonus ? `<span class="q-pill star">★ チャレンジ</span> <span class="small muted">基本が満点のとき ＋1点</span>` : `<span class="q-pill">問 ${i + 1}</span>`}
      <div class="lead">${LM.richText(q.lead)}</div>
      ${q.hint ? `<p class="small muted">💡 ${LM.richText(q.hint)}</p>` : ""}
      ${q.table ? tableHTML(q.table) : ""}
      ${q.fig ? LF.render(q.fig) : ""}
      <div class="subs"></div>`;
    const subsBox = card.querySelector(".subs");
    const keys = keysOf(i);
    const setA = (k, v) => { Q.answers[k] = v; saveDraft(); markNav(i); };
    if (q.type === "input") {
      const subs = isBonus ? q.subs.slice(0, 1) : q.subs;
      const fields = [];
      subs.forEach((s, si) => {
        const k = keys[si];
        const d = document.createElement("div");
        d.className = "sub";
        d.innerHTML = `<div class="p">${s.lb ? `<span class="lb">${esc(s.lb)}</span>` : ""}${s.p ? LM.richText(s.p) : ""}</div>`;
        if (s.fig) d.insertAdjacentHTML("beforeend", LF.render(s.fig));
        const f = MI.create({
          mode: s.mode || q.mode, value: Q.answers[k] || "", ph: s.ph, unit: s.unit, label: `${s.lb || ""} の答え`,
          onInput: v => setA(k, v),
          onEnter: () => { const nx = fields[si + 1]; if (nx) nx.focus(); else if (Q.cur < nQ() - 1) { Q.cur++; renderQuiz(); } else { Q.cur = "review"; renderQuiz(); } },
        });
        fields.push(f);
        d.appendChild(f.el);
        subsBox.appendChild(d);
      });
      if (!UI.isCoarse() && fields[0] && !answered(keys[0])) setTimeout(() => fields[0].focus(), 50);
    } else if (q.type === "choice") {
      const subs = isBonus ? q.subs.slice(0, 1) : q.subs;
      subs.forEach((s, si) => {
        const k = keys[si];
        const d = document.createElement("div");
        d.className = "sub";
        const cols = q.choices.every(c => String(c).length <= 14) && (q.choices.length === 4 || q.choices.length === 2) ? "cols2" : "";
        d.innerHTML = `<div class="p">${s.lb ? `<span class="lb">${esc(s.lb)}</span>` : ""}${s.p ? LM.richText(s.p) : ""}</div>
          ${s.fig ? LF.render(s.fig) : ""}
          <div class="choices ${cols}" role="radiogroup">${q.choices.map((c, ci) => `<button type="button" role="radio" aria-checked="${Q.answers[k] === ci}" class="choice ${Q.answers[k] === ci ? "on" : ""}" data-ci="${ci}"><span class="mk"></span><span>${LM.richText(c)}</span></button>`).join("")}</div>`;
        d.addEventListener("click", e => {
          const b = e.target.closest("[data-ci]"); if (!b) return;
          setA(k, +b.dataset.ci);
          d.querySelectorAll("[data-ci]").forEach(x => { const onn = +x.dataset.ci === Q.answers[k]; x.classList.toggle("on", onn); x.setAttribute("aria-checked", onn); });
        });
        subsBox.appendChild(d);
      });
    } else if (q.type === "multi") {
      const k = keys[0];
      const d = document.createElement("div");
      d.className = "sub";
      const sel = () => (Array.isArray(Q.answers[k]) ? Q.answers[k] : []);
      d.innerHTML = `<p class="small muted">あてはまるものを すべて 選びます</p><div class="choices">${q.choices.map((c, ci) => `<button type="button" role="checkbox" aria-checked="${sel().includes(ci)}" class="choice multi ${sel().includes(ci) ? "on" : ""}" data-ci="${ci}"><span class="mk"></span><span>${LM.richText(c)}</span></button>`).join("")}</div>`;
      d.addEventListener("click", e => {
        const b = e.target.closest("[data-ci]"); if (!b) return;
        const ci = +b.dataset.ci;
        const cur = sel().slice();
        const at = cur.indexOf(ci);
        if (at >= 0) cur.splice(at, 1); else cur.push(ci);
        setA(k, cur.sort((x, y) => x - y));
        b.classList.toggle("on", cur.includes(ci)); b.setAttribute("aria-checked", cur.includes(ci));
      });
      subsBox.appendChild(d);
    } else if (q.type === "graph") {
      const k = keys[0];
      subsBox.appendChild(GI.graph(q, Q.answers[k], v => setA(k, v)));
    } else if (q.type === "plot") {
      const k = keys[0];
      subsBox.appendChild(GI.plot(q, Q.answers[k], v => setA(k, v)));
    }
    return card;
  }
  function markNav(i) {
    const b = app.querySelector(`.qnav [data-go="${i}"]`);
    if (b) b.classList.toggle("done", keysOf(i).every(answered));
    const p = $("#qprog");
    if (p) p.style.width = progressPct() + "%";
  }
  function tableHTML(t) {
    return `<div class="tscroll"><table class="t"><thead><tr>${t.head.map(h => `<th>${LM.richText(h)}</th>`).join("")}</tr></thead>
      <tbody>${t.rows.map(r => `<tr>${r.map((c, i) => i === 0 ? `<th>${LM.richText(c)}</th>` : `<td>${LM.richText(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function reviewEl() {
    const el = document.createElement("div");
    el.className = "card paper stack";
    const its = QC.items(Q.lesson);
    const bi = QC.bonusItem(Q.lesson);
    const all = bi ? its.concat([bi]) : its;
    const empty = all.filter(it => !it.bonus && !answered(it.k)).length;
    el.innerHTML = `<div><span class="q-pill">見直し</span><p class="small muted mb0">答えをタップすると、その問題にもどれます。</p></div>
      <div>${all.map(it => `<div class="res-item" style="cursor:pointer" data-jump="${it.qi}">
        <span class="mark ${answered(it.k) ? "o" : "x"}" style="font-size:12px">${answered(it.k) ? "✓" : "?"}</span>
        <div><b class="small">${esc(QC.label(it))}</b>　${answered(it.k) ? QC.userHTML(it, Q.answers[it.k]) : `<span class="chip b">まだ</span>`}</div></div>`).join("")}</div>
      ${empty ? `<div class="msg warn">まだ答えていない問題が ${empty} 問あります。</div>` : `<div class="msg good">全部答えました。</div>`}
      <button class="btn primary big block slant" data-q="submit">${ic("sparkle")} ${Q.practice ? "答え合わせする" : "提出する"}</button>`;
    on(el, "click", "[data-jump]", (e, b) => { const v = b.dataset.jump; Q.cur = v === "b" ? Q.lesson.qs.length : +v; renderQuiz(); });
    return el;
  }

  on(app, "click", "[data-go]", (e, b) => {
    if (S.view !== "quiz") return;
    const v = b.dataset.go;
    Q.cur = v === "review" ? "review" : +v;
    saveDraft(); renderQuiz();
  });
  on(app, "click", "[data-q]", async (e, b) => {
    if (S.view !== "quiz" && S.view !== "result") return;
    const a = b.dataset.q;
    if (a === "prev") { Q.cur = Q.cur === "review" ? nQ() - 1 : Math.max(0, Q.cur - 1); saveDraft(); renderQuiz(); }
    if (a === "next") { Q.cur = Math.min(nQ() - 1, Q.cur + 1); saveDraft(); renderQuiz(); }
    if (a === "exit") {
      if (Q.practice) { clearInterval(Q.iv); Q = null; return goHome(); }
      const ok = await confirmBox("小テストを中断しますか？", "<p>ここまでの答えはこの端末に保存されます。ホームの「はじめる」から続きができます（時間は進みます）。</p>", "中断する");
      if (ok) { clearInterval(Q.iv); goHome(); }
    }
    if (a === "submit") {
      const its = QC.items(Q.lesson);
      const empty = its.filter(it => !answered(it.k)).length;
      if (!Q.practice) {
        const ok = await confirmBox("提出しますか？", `<p>${empty ? `<b>まだ答えていない問題が ${empty} 問あります。</b><br>` : ""}提出すると、今日はもう答えを変えられません。</p>`, "提出する");
        if (!ok) return;
      }
      submitQuiz(false);
    }
  });

  async function submitQuiz(auto) {
    if (!Q || Q.submitted) return;
    Q.submitted = true;
    clearInterval(Q.iv);
    const g = QC.grade(Q.lesson, Q.answers);
    if (Q.practice) return showResult(Q.lesson, Q.answers, { practice: true, state: "practice" });
    const dur = Math.round((Clock.now() - Q.startedAt) / 1000);
    Store.set(resKey(Q.lesson.id), { answers: Q.answers, score: g.score, max: g.max });
    showResult(Q.lesson, Q.answers, { state: "sending", auto });
    let st = "fail";
    try {
      const r = await API.send("live_quiz_submit", { p_token: S.token, p_lesson_id: Q.lesson.id, p_score: g.score, p_max: g.max, p_answers: QC.payload(g), p_duration: dur }, { label: "小テスト" });
      st = r.queued ? "queued" : r.ok ? "ok" : r.error || "fail";
    } catch (e) { st = "fail"; }
    if (st === "ok" || st === "queued") Store.del(Q.dk);
    if (st === "ok" && S.state) S.state.quiz_done = true;
    const box = $("#sendstate");
    if (box) box.innerHTML = sendStateHTML(st);
  }
  function sendStateHTML(st) {
    return {
      sending: `<span class="chip">送信中…</span>`,
      ok: `<span class="chip g">✓ 先生に送信しました</span>`,
      queued: `<span class="chip w">📡 送信待ち（つながったら自動で送ります）</span>`,
      already: `<span class="chip w">今日はもう提出ずみでした</span>`,
      closed: `<span class="chip b">締め切り後だったため送れませんでした。先生に伝えてください</span>`,
      saved: `<span class="chip g">✓ 提出ずみ</span>`,
      practice: `<span class="chip">練習（記録されません）</span>`,
    }[st] || `<span class="chip b">送信できませんでした（${esc(st)}）</span>`;
  }

  function starsHTML(n) {
    return `<div class="stars3" aria-label="星 ${n} こ">${[0, 1, 2].map(i => IC.svg("star", i < n ? "lit" : "")).join("")}</div>`;
  }
  function confetti(n) {
    const col = ["#ffd479", "#78e7ff", "#b19cff", "#72e5b2", "#ff8fb0", "#ffffff"];
    return `<div class="confetti" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:${col[i % col.length]};animation-delay:${(i % 9) * 0.12}s;transform:rotate(${i * 23}deg)"></i>`).join("")}</div>`;
  }

  function showResult(L, answers, opt) {
    S.view = "result";
    dock.hidden = true;
    const g = QC.grade(L, answers);
    const pct = g.max ? Math.round(Math.min(g.score, g.max) / g.max * 100) : 0;
    const stars = pct === 100 ? 3 : pct >= 80 ? 2 : pct >= 50 ? 1 : 0;
    const tier = pct === 100 ? ["Perfect Clear", "満点！すばらしい"] : pct >= 80 ? ["Great", "よくできました"] : pct >= 50 ? ["Good Try", "もう少し！まちがえた問題を見直そう"] : ["Keep Going", "ここから伸びるよ。解説を読んでみよう"];
    const byQ = {};
    g.items.forEach(r => { const qi = r.k.split(".")[0]; (byQ[qi] = byQ[qi] || []).push(r); });
    const its = QC.items(L);
    app.innerHTML = `
      <div class="rbanner enter">
        ${pct >= 80 ? confetti(36) : ""}
        <div class="eyebrow">${tier[0]}</div>
        <div class="sub-t"><span class="lesson-no">${esc(L.id)}</span> ${esc(L.title)}</div>
        ${starsHTML(stars)}
        <div class="score-big">${Math.min(g.score, g.max)}<small> / ${g.max}</small></div>
        ${g.bonus && g.bonus.awarded ? `<div class="chip w">★ チャレンジ正解 ＋1</div>` : ""}
        <div class="head">${tier[1]}</div>
        <div id="sendstate">${sendStateHTML(opt.state)}</div>
        ${opt.auto ? `<p class="small muted mb0">時間になったので自動で提出しました。</p>` : ""}
      </div>
      <div class="stack" style="margin-top:14px">
        ${L.qs.map((q, qi) => `<div class="card paper">
          <span class="q-pill">問 ${qi + 1}</span>
          <div class="small" style="margin-bottom:6px">${LM.richText(q.lead)}</div>
          ${(byQ[qi] || []).map(r => itemResultHTML(its.find(it => it.k === r.k), r)).join("")}
          ${q.sol ? `<div class="sol">📘 ${LM.richText(q.sol)}</div>` : ""}
        </div>`).join("")}
        ${L.bonus ? `<div class="card paper">
          <span class="q-pill star">★ チャレンジ</span>
          <div class="small" style="margin:6px 0">${LM.richText(L.bonus.lead)}</div>
          ${itemResultHTML(QC.bonusItem(L), g.bonus)}
          ${L.bonus.sol ? `<div class="sol">📘 ${LM.richText(L.bonus.sol)}</div>` : ""}
        </div>` : ""}
      </div>
      <div class="row" style="justify-content:center;margin-top:18px">
        ${L.gen ? `<button class="btn primary" data-r="gen">${ic("target")} 類題でれんしゅう</button>` : ""}
        <button class="btn blue" data-r="again">${ic("refresh")} もう一度（練習）</button>
        <button class="btn ghost" data-r="home">${ic("home")} ホームへ</button>
      </div>`;
    window.scrollTo(0, 0);
    app.querySelectorAll("[data-r]").forEach(b => b.addEventListener("click", () => {
      const a = b.dataset.r;
      if (a === "gen") openGen(L);
      if (a === "again") startQuiz(L.id, true);
      if (a === "home") goHome();
    }));
  }
  function itemResultHTML(it, r) {
    if (!it || !r) return "";
    const withFig = it.type === "graph" || it.type === "plot";
    return `<div class="res-item">
      <span class="mark ${r.ok ? "o" : "x"}">${r.ok ? "○" : "×"}</span>
      <div>
        <div><b class="small">${esc(QC.label(it))}</b>${it.sub && it.sub.p ? `　<span class="small">${LM.richText(it.sub.p)}</span>` : ""}</div>
        <div class="small">あなた：${QC.userHTML(it, r.a)}${it.type === "plot" ? `（${r.pts}/${it.max}）` : ""}</div>
        ${r.ok ? "" : `<div class="small">正解：<b>${QC.rightHTML(it)}</b></div>`}
        ${!r.ok && QC.whyText(r) ? `<div class="why">💡 ${esc(QC.whyText(r))}</div>` : ""}
        ${withFig && !r.ok ? GI.resultFig(it.q, r.a) : ""}
      </div></div>`;
  }

  /* ---------- 類題でれんしゅう（その場で答え合わせ） ---------- */
  function openGen(L) {
    S.view = "gen";
    dock.hidden = true;
    const subs = L.gen();
    app.innerHTML = `
      <div class="qhead"><button class="btn ghost small" data-g="home">${ic("left")} もどる</button><div class="grow"><div class="eyebrow" style="font-size:10px">Training · 類題でれんしゅう（記録されません）</div><b><span class="lesson-no">${esc(L.id)}</span> ${esc(L.title)}</b></div></div>
      <div class="card paper stack enter" id="gen" style="margin-top:12px"></div>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn primary" data-g="more">${ic("refresh")} 新しい問題</button></div>`;
    const box = $("#gen");
    subs.forEach(s => {
      const d = document.createElement("div");
      d.className = "sub";
      d.innerHTML = `<div class="p"><span class="lb">${esc(s.lb)}</span>${LM.richText(s.p)}</div>`;
      const f = MI.create({ mode: s.mode, unit: s.unit, onEnter: () => check() });
      d.appendChild(f.el);
      const row = document.createElement("div");
      row.className = "row"; row.style.marginTop = "6px";
      row.innerHTML = `<button class="btn small" type="button">${ic("check")} 答え合わせ</button><span class="res small"></span>`;
      d.appendChild(row);
      const check = () => {
        const it = { k: "g", q: { mode: s.mode }, sub: s, type: "input", max: 1 };
        const gr = QC.gradeItem(it, f.value);
        row.querySelector(".res").innerHTML = gr.ok ? `<span class="chip g">○ 正解！</span>` : `<span class="chip b">× 正解は ${QC.rightHTML(it)}</span> ${QC.whyText(gr) ? `<span class="why">${esc(QC.whyText(gr))}</span>` : ""}`;
      };
      row.querySelector("button").addEventListener("click", check);
      box.appendChild(d);
    });
    app.querySelector('[data-g="home"]').addEventListener("click", () => goHome());
    app.querySelector('[data-g="more"]').addEventListener("click", () => openGen(L));
  }

  /* ---------- 練習の入口 ---------- */
  function openPractice() {
    S.view = "practice";
    dock.hidden = true;
    const unitNo = Store.get("ll:pu", 1);
    const u = LL.unit(unitNo);
    app.innerHTML = `
      <div class="qhead"><button class="btn ghost small" data-pr="home">${ic("left")} ホーム</button><div class="grow"><div class="eyebrow" style="font-size:10px">Training</div><h1 class="mb0">練習する</h1></div></div>
      <p class="small muted">練習は何回でもできます。先生への記録には入りません。</p>
      <div class="seg" style="margin-bottom:14px">${LL.UNITS.map(x => `<button data-u="${x.no}" class="${x.no === unitNo ? "on" : ""}">${esc(x.short)}</button>`).join("")}</div>
      <div class="hero enter" style="--uc:${u.color};padding:16px 18px;margin-bottom:14px"><div class="hero-crest" style="width:60px;top:14px;right:16px">${IC.unit(u.no)}</div><div class="eyebrow">Chapter ${u.no}</div><div class="hero-title" style="font-size:24px;margin:4px 0 0">${esc(u.name)}</div></div>
      <div class="stack">${LL.lessonsOf(unitNo).map(L => `<div class="card row between enter">
        <div class="grow"><b style="font-family:var(--font-mincho);font-size:17px"><span class="lesson-no">${esc(L.id)}</span> ${esc(L.title)}</b><div class="small muted">${esc(L.goal)}</div></div>
        <div class="row">${L.gen ? `<button class="btn small" data-gen="${L.id}">${ic("target")} 類題</button>` : ""}<button class="btn small primary" data-pq="${L.id}">${ic("quiz")} 小テスト形式</button></div>
      </div>`).join("")}</div>`;
    app.querySelector('[data-pr="home"]').addEventListener("click", () => goHome());
    app.querySelectorAll("[data-u]").forEach(b => b.addEventListener("click", () => { Store.set("ll:pu", +b.dataset.u); openPractice(); }));
    app.querySelectorAll("[data-gen]").forEach(b => b.addEventListener("click", () => openGen(LL.lesson(b.dataset.gen))));
    app.querySelectorAll("[data-pq]").forEach(b => b.addEventListener("click", () => startQuiz(b.dataset.pq, true)));
    window.scrollTo(0, 0);
  }

  /* ============================================================
     振り返り
     ============================================================ */
  const FACES = [[1, "😣", "わからない"], [2, "😐", "すこし不安"], [3, "🙂", "だいたい"], [4, "😄", "バッチリ"]];
  // 書き出し（押すとカーソル位置に入り、そのまま続きを書ける）
  const STEMS = {
    summary: ["大事なのは、", "くらべると、", "きまりは、", "つまり、", "たとえば、"],
    next: ["次は、", "気をつけたいのは、", "家で、", "まちがえた問題を"],
    question: ["なぜ", "もし", "いつでも", "ほかの場合でも"],
    stuck: ["まちがえたのは、", "こんがらがったのは、", "わすれていたのは、"],
    how: ["図をかいたら、", "友だちに説明したら、", "表にまとめたら、", "確かめたら、"],
    predict: ["次の時間は、", "予想は、", "なぜなら、"],
  };
  const FIELDS_LIGHT = [
    ["summary", "今日わかったこと（まとめ）", "今日の授業で大事だと思ったことを、自分の言葉で1〜2文で", true],
    ["next", "次にやること", "次の授業や家で、何をどうするか", false],
    ["question", "もやもや・質問（あれば）", "なぜ？ もし〜なら？ など", false],
  ];
  const FIELDS_DEEP = [
    ["summary", "この時間・単元でわかったこと（まとめ）", "大事な言葉を使って、自分の言葉で", true],
    ["stuck", "つまずいたところ", "どこで・なぜつまずいたか", false],
    ["how", "学び方（どうやって考えた・覚えた？）", "図・表・説明・見直し など、やってよかったこと", false],
    ["next", "次にやること", "何を・どうするか", false],
    ["question", "新しい問い", "なぜ？ もし〜なら？ いつでも？", false],
    ["predict", "予想（次はどうなると思う？）", "次の授業や、別の場合を予想してみよう", false],
  ];

  async function openReflect(lessonId) {
    const L = LL.lesson(lessonId);
    if (!L) return;
    S.view = "reflect";
    dock.hidden = true;
    app.innerHTML = `<p class="empty">読み込み中…</p>`;
    let got = { today: null, prev: null };
    try {
      got = await API.rpc("live_reflection_get", { p_token: S.token, p_lesson_id: lessonId });
      if (!S.history) {
        const rec = await API.rpc("live_my_records", { p_token: S.token });
        S.history = (rec.reflections || []).map(r => ({ date: r.date, lesson_id: r.lesson_id, text: Object.values(r.body || {}).filter(v => typeof v === "string" && v.length > 3).join("\n") }));
      }
    } catch (e) { toast("通信できませんでした。書いた内容は端末に保存されます", "bad"); }
    const mode = (S.state && S.state.reflect_mode) || "light";
    const dk = `ll:rdraft:${S.me.account_id}:${lessonId}:${today()}`;
    const draft = Store.get(dk) || (got.today ? { understanding: got.today.understanding, body: got.today.body } : { body: {} });
    const R = { L, mode, dk, understanding: draft.understanding || null, body: Object.assign({}, draft.body || {}), prev: got.prev };
    const fields = mode === "deep" ? FIELDS_DEEP : FIELDS_LIGHT;
    const prevNext = R.prev && R.prev.body && R.prev.body.next;
    app.innerHTML = `
      <div class="qhead"><button class="btn ghost small" data-rf="home">${ic("left")} もどる</button>
        <div class="grow"><div class="eyebrow" style="font-size:10px">Reflection · 振り返り${mode === "deep" ? "（じっくり）" : ""}</div><b><span class="lesson-no">${esc(L.id)}</span> ${esc(L.title)}</b></div></div>
      <div class="stack enter" style="margin-top:12px">
        <div class="card paper">
          <span class="q-pill">1</span>
          <h2>今日の授業、どれくらいわかった？</h2>
          <div class="faces" role="radiogroup">${FACES.map(([v, e, t]) => `<button type="button" role="radio" class="face ${R.understanding === v ? "on" : ""}" data-u="${v}" aria-checked="${R.understanding === v}"><span class="e">${e}</span>${t}</button>`).join("")}</div>
        </div>
        ${prevNext ? `<div class="card paper">
          <span class="q-pill" style="background:linear-gradient(135deg,#7b4fd0,#b35bd6)">前回とつなぐ</span>
          <div class="prevbox"><div class="small muted">前回（${esc(R.prev.lesson_id)}・${md(R.prev.date)}）に決めた「次にやること」</div><b>${esc(prevNext)}</b></div>
          <p style="margin:10px 0 6px;font-weight:800">やってみた？</p>
          <div class="seg">${[["yes", "できた"], ["some", "少しできた"], ["no", "まだ"]].map(([v, t]) => `<button type="button" data-pd="${v}" class="${R.body.prev_done === v ? "on" : ""}">${t}</button>`).join("")}</div>
        </div>` : ""}
        <div class="card paper stack">
          <div><span class="q-pill">${prevNext ? 3 : 2}</span> <span class="small muted">✍️ うまく書けなくてもだいじょうぶ。単語だけ・箇条書きでもOK。点線のボタンを押すと、書き出しが入ります。</span></div>
          ${fields.map(([k, label, ph, req]) => `<div>
            <label class="f" for="rf-${k}">${esc(label)}${req ? "" : ` <span class="muted">（任意）</span>`}</label>
            <textarea class="in" id="rf-${k}" data-k="${k}" maxlength="400" placeholder="${esc(ph)}" rows="${k === "summary" ? 3 : 2}">${esc(R.body[k] || "")}</textarea>
            <div class="stems">${(STEMS[k] || []).map(s => `<button type="button" data-stem="${k}">${esc(s)}</button>`).join("")}</div>
          </div>`).join("")}
        </div>
        <button class="btn primary big block slant" data-rf="send">${ic("sparkle")} 送信する</button>
        <p class="small muted center">書いた内容は先生だけが読みます。</p>
      </div>`;
    const save = () => Store.set(dk, { understanding: R.understanding, body: R.body });
    app.querySelectorAll("[data-u]").forEach(b => b.addEventListener("click", () => {
      R.understanding = +b.dataset.u;
      app.querySelectorAll("[data-u]").forEach(x => { const o = +x.dataset.u === R.understanding; x.classList.toggle("on", o); x.setAttribute("aria-checked", o); });
      save();
    }));
    app.querySelectorAll("[data-pd]").forEach(b => b.addEventListener("click", () => {
      R.body.prev_done = b.dataset.pd;
      app.querySelectorAll("[data-pd]").forEach(x => x.classList.toggle("on", x.dataset.pd === R.body.prev_done));
      save();
    }));
    app.querySelectorAll("textarea[data-k]").forEach(t => t.addEventListener("input", () => { R.body[t.dataset.k] = t.value; save(); }));
    app.querySelectorAll("[data-stem]").forEach(b => b.addEventListener("click", () => {
      const t = $(`#rf-${b.dataset.stem}`);
      const s0 = t.selectionStart ?? t.value.length;
      const before = t.value.slice(0, s0);
      const add = (before && !/[\s。、！？\n]$/.test(before) ? "。" : "") + b.textContent;
      t.value = before + add + t.value.slice(t.selectionEnd ?? s0);
      const pos = s0 + add.length;
      t.focus();
      try { t.setSelectionRange(pos, pos); } catch (e) { /* なにもしない */ }
      t.dispatchEvent(new Event("input"));
    }));
    app.querySelector('[data-rf="home"]').addEventListener("click", () => goHome());
    app.querySelector('[data-rf="send"]').addEventListener("click", () => sendReflect(R));
    window.scrollTo(0, 0);
  }

  async function sendReflect(R) {
    if (!R.understanding) { toast("「どれくらいわかった？」を選んでね", "bad"); window.scrollTo(0, 0); return; }
    const body = {};
    Object.keys(R.body).forEach(k => { const v = String(R.body[k] || "").trim(); if (v) body[k] = v; });
    if (!body.summary && !body.question && !body.stuck) { toast("まとめを一言だけでも書いてみよう", "bad"); $("#rf-summary").focus(); return; }
    const L = R.L;
    const vocab = (L.vocab || []).concat(LL.unit(L.unit).vocab);
    const history = (S.history || []).filter(h => !(h.lesson_id === L.id && h.date === today()));
    const ev = RF.analyze({ body, understanding: R.understanding, vocab, prev: R.prev, history });
    const flag = ev.flags.sos ? "sos" : ev.flags.help ? "help" : null;
    const btn = app.querySelector('[data-rf="send"]');
    btn.disabled = true; btn.textContent = "送信中…";
    let st = "fail";
    try {
      const r = await API.send("live_reflection_submit", { p_token: S.token, p_lesson_id: L.id, p_understanding: R.understanding, p_mode: R.mode, p_body: body, p_auto: ev, p_flag: flag }, { label: "振り返り" });
      st = r.queued ? "queued" : r.ok ? "ok" : r.error || "fail";
    } catch (e) { st = "fail"; }
    if (st === "ok" || st === "queued") {
      Store.del(R.dk);
      if (S.history) S.history.push({ date: today(), lesson_id: L.id, text: Object.values(body).join("\n") });
      if (S.state && st === "ok") S.state.reflect_done = true;
      reflectDone(R, ev, body, st);
    } else {
      btn.disabled = false; btn.innerHTML = `${ic("sparkle")} 送信する`;
      toast(st === "closed" ? "振り返りの受付が終わっていました。書いた内容は端末に残っています" : "送信できませんでした", "bad", 4000);
    }
  }

  function medalHTML(c, lv, extra) {
    return `<div class="medal ${lv >= 2 ? "" : lv === 1 ? "lv1" : "off"}"><div class="m">${ic(CAT_IC[c.k] || "star")}</div><small>${esc(c.shine)}</small>${extra || ""}</div>`;
  }

  function reflectDone(R, ev, body, st) {
    S.view = "reflectDone";
    const fb = RF.feedback(ev, R.understanding, body);
    const shine = RF.CATS.filter(c => ev.cats[c.k].lv >= 1).sort((a, b) => ev.cats[b.k].lv - ev.cats[a.k].lv);
    app.innerHTML = `
      <div class="rbanner enter">
        ${confetti(28)}
        <div class="eyebrow">Reflection Complete</div>
        <h1 style="font-size:28px;margin:8px 0 4px">送信しました</h1>
        <p class="sub-t mb0"><span class="lesson-no">${esc(R.L.id)}</span> ${esc(R.L.title)}</p>
        ${st === "queued" ? `<p class="mb0" style="margin-top:8px"><span class="chip w">📡 送信待ち（つながったら自動で送ります）</span></p>` : ""}
      </div>
      <div class="stack" style="margin-top:14px">
        ${shine.length ? `<div class="card enter"><div class="sec-head">${ic("sparkle")}<div><span class="eyebrow">Your Stars</span><h2>今日の振り返りで光ったところ</h2></div></div>
          <div class="medals">${shine.map(c => medalHTML(c, ev.cats[c.k].lv)).join("")}</div>
          <p class="small muted center mb0" style="margin-top:10px">金のメダルは、とくによく書けたところ。</p></div>` : ""}
        <div class="card enter"><div class="sec-head">${ic("chat")}<div><span class="eyebrow">Message</span><h2>先生から</h2></div></div><div class="bubble">${esc(fb.msg)}</div></div>
        ${fb.nudge ? `<div class="card flat enter"><b>🌱 ${esc(fb.nudge.t)}</b><p class="small muted mb0">例：${esc(fb.nudge.ex)}</p></div>` : ""}
        <div class="row" style="justify-content:center"><button class="btn" data-x="edit">${ic("quill")} 書き直す</button><button class="btn primary" data-x="home">${ic("home")} ホームへ</button></div>
      </div>`;
    app.querySelector('[data-x="edit"]').addEventListener("click", () => openReflect(R.L.id));
    app.querySelector('[data-x="home"]').addEventListener("click", () => goHome());
    window.scrollTo(0, 0);
  }

  /* ============================================================
     わたしの記録
     ============================================================ */
  async function openRecords() {
    S.view = "records";
    dock.hidden = true;
    app.innerHTML = `<p class="empty">読み込み中…</p>`;
    let r;
    try { r = await API.rpc("live_my_records", { p_token: S.token }); }
    catch (e) { app.innerHTML = `<div class="card"><p>通信できませんでした。</p><button class="btn" data-rc="home">ホームへ</button></div>`; app.querySelector("[data-rc]").addEventListener("click", goHome); return; }
    const byL = {};
    (r.attempts || []).forEach(a => { (byL[a.lesson_id] = byL[a.lesson_id] || { at: [], rf: [] }).at.push(a); });
    (r.reflections || []).forEach(x => { (byL[x.lesson_id] = byL[x.lesson_id] || { at: [], rf: [] }).rf.push(x); });
    S.history = (r.reflections || []).map(x => ({ date: x.date, lesson_id: x.lesson_id, text: Object.values(x.body || {}).filter(v => typeof v === "string" && v.length > 3).join("\n") }));
    const ids = Object.keys(byL).sort((a, b) => { const [ua, la] = a.split("-").map(Number), [ub, lb] = b.split("-").map(Number); return ub - ua || lb - la; });
    // 光ったところの回数（メダルのコレクション）
    const shineCount = {}, goldCount = {};
    (r.reflections || []).forEach(x => {
      const cats = (x.auto_eval && x.auto_eval.cats) || {};
      ((x.auto_eval && x.auto_eval.shine) || []).forEach(k => { shineCount[k] = (shineCount[k] || 0) + 1; if (cats[k] && cats[k].lv >= 2) goldCount[k] = (goldCount[k] || 0) + 1; });
    });
    const und = (r.reflections || []).slice().reverse().map(x => x.understanding);
    const perfect = (r.attempts || []).filter(a => a.score >= a.max).length;
    app.innerHTML = `
      <div class="qhead"><button class="btn ghost small" data-rc="home">${ic("left")} ホーム</button><div class="grow"><div class="eyebrow" style="font-size:10px">My Records</div><h1 class="mb0">わたしの記録</h1></div></div>
      <div class="stack" style="margin-top:12px">
        <div class="card enter">
          <div class="sec-head">${ic("chart")}<div><span class="eyebrow">Growth</span><h2>わたしの成長</h2></div></div>
          <div class="meters" style="grid-template-columns:repeat(3,1fr)">
            <div class="meter"><div class="k">${ic("quiz")} 小テスト</div><div class="n">${(r.attempts || []).length}<small class="muted" style="font-size:13px"> 回</small></div></div>
            <div class="meter m-online"><div class="k">${ic("star")} 満点</div><div class="n">${perfect}<small class="muted" style="font-size:13px"> 回</small></div></div>
            <div class="meter m-hand"><div class="k">${ic("quill")} 振り返り</div><div class="n">${(r.reflections || []).length}<small class="muted" style="font-size:13px"> 回</small></div></div>
          </div>
          ${und.length >= 2 ? `<div class="small muted" style="margin-top:10px">理解度の変化（左が古い）</div>${sparkUnd(und)}` : ""}
        </div>
        <div class="card enter">
          <div class="sec-head">${ic("sparkle")}<div><span class="eyebrow">Collection</span><h2>光ったところのメダル</h2></div></div>
          <div class="medals">${RF.CATS.map(c => medalHTML(c, goldCount[c.k] ? 2 : shineCount[c.k] ? 1 : 0, `<span class="cnt">${shineCount[c.k] ? "×" + shineCount[c.k] : "—"}</span>`)).join("")}</div>
          <p class="small muted center mb0" style="margin-top:10px">振り返りを書くと、よく書けた観点のメダルが集まります。</p>
        </div>
        ${ids.length ? ids.map(id => {
          const L = LL.lesson(id); const d = byL[id];
          return `<div class="card paper enter">
            <div class="row between"><h2 class="mb0" style="font-family:var(--font-mincho)"><span class="lesson-no">${esc(id)}</span> ${esc(L ? L.title : "")}</h2>
              ${L ? `<button class="btn small" data-pq="${esc(id)}">${ic("target")} 練習</button>` : ""}</div>
            ${d.at.map(a => `<div class="row small" style="margin-top:8px"><span class="chip ${a.score >= a.max ? "g" : a.score / a.max >= 0.6 ? "p" : "w"}">${a.score >= a.max ? "★ " : ""}小テスト ${Math.min(a.score, a.max)} / ${a.max}${a.score > a.max ? " ＋チャレンジ" : ""}</span><span class="muted">${md(a.date)}</span>${L ? `<button class="btn small ghost" data-see='${esc(JSON.stringify({ id, i: d.at.indexOf(a) }))}'>解説を見る</button>` : ""}</div>`).join("")}
            ${d.rf.map(x => `<div style="margin-top:10px;border-top:1px dashed var(--line);padding-top:10px">
              <div class="small muted">${md(x.date)} の振り返り　${FACES[x.understanding - 1][1]} ${FACES[x.understanding - 1][2]}</div>
              ${x.body.summary ? `<div style="font-weight:700">${esc(x.body.summary)}</div>` : ""}
              ${x.body.next ? `<div class="small">➡ 次にやること：${esc(x.body.next)}</div>` : ""}
              ${x.teacher_note ? `<div class="bubble small" style="margin-top:8px;border:1px solid #e2d7ff;box-shadow:none">👩‍🏫 先生より：${esc(x.teacher_note)}</div>` : ""}
            </div>`).join("")}
          </div>`;
        }).join("") : `<div class="card empty">まだ記録はありません。</div>`}
      </div>`;
    app.querySelector('[data-rc="home"]').addEventListener("click", () => goHome());
    app.querySelectorAll("[data-pq]").forEach(b => b.addEventListener("click", () => startQuiz(b.dataset.pq, true)));
    app.querySelectorAll("[data-see]").forEach(b => b.addEventListener("click", () => {
      const { id, i } = JSON.parse(b.dataset.see);
      const a = byL[id].at[i];
      showResult(LL.lesson(id), QC.answersFrom(a.answers), { state: "saved" });
    }));
    window.scrollTo(0, 0);
  }
  function sparkUnd(vals) {
    const W = 300, H = 64, n = vals.length;
    const X = i => 8 + i * (W - 16) / Math.max(n - 1, 1), Y = v => H - 8 - (v - 1) / 3 * (H - 16);
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="理解度の変化"><polyline fill="none" class="fg-acc" points="${vals.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}"/>${vals.map((v, i) => `<circle class="fg-pick" cx="${X(i)}" cy="${Y(v)}" r="3.5"/>`).join("")}</svg>`;
  }

  boot();
})();
