/* 編集画面：お知らせ・大会概要・プログラムを、項目を入力する形で編集する。
   保存先は config.js の BACKEND で切り替わる（local＝このブラウザの中／supabase＝ログインして共同編集）。
   文字はすべて textContent / value で入れる（HTML としては解釈しない）。 */
(function () {
  "use strict";
  var S = window.ConfSchema;
  var SC = window.SiteContent;
  var cfg = window.CONF_EDITOR_CONFIG || {};

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  var uidn = 0;
  function uid() { return "ce-f" + (++uidn); }

  var state = { key: "news", rows: null, work: {}, saved: {}, busy: false, loggedInAs: null };
  var store = null;

  // ---------- 部品 ----------
  function banner(msg, kind, action) {
    var b = $("ce-banner");
    b.textContent = "";
    if (!msg) { b.hidden = true; return; }
    b.className = "ce-banner" + (kind ? " ce-" + kind : "");
    b.appendChild(document.createTextNode(msg));
    if (action) {
      var btn = el("button", { type: "button", "class": "ce-btn" }, [action.label]);
      btn.addEventListener("click", action.run);
      b.appendChild(btn);
    }
    b.hidden = false;
  }
  function button(label, onClick, cls) {
    var b = el("button", { type: "button", "class": "ce-btn" + (cls ? " " + cls : "") }, [label]);
    b.addEventListener("click", onClick);
    return b;
  }
  function field(label, control) {
    var id = uid();
    control.id = id;
    return el("div", { "class": "ce-field" }, [el("label", { "for": id }, [el("span", { "class": "ce-lab" }, [label])]), control]);
  }
  function input(type, value, data, onInput) {
    var i = el("input", { type: type, "data-f": data });
    i.value = value || "";
    i.addEventListener("input", function () { onInput(i.value); changed(); });
    return i;
  }
  function textarea(value, rows, data, onInput) {
    var t = el("textarea", { rows: String(rows), "data-f": data });
    t.value = value || "";
    t.addEventListener("input", function () { onInput(t.value); changed(); });
    return t;
  }
  function isBlank(o) {
    if (typeof o === "string") return !o.trim();
    if (Array.isArray(o)) return o.every(isBlank);
    if (o && typeof o === "object") return Object.keys(o).every(function (k) { return isBlank(o[k]); });
    return true;
  }
  // ↑ ↓ 削除。list の i 番目を動かす／消す
  function ops(list, i, what) {
    function mk(label, aria, data, disabled, run) {
      var b = el("button", { type: "button", "class": "ce-ic" + (data === "del" ? " ce-del" : ""), "aria-label": what + "を" + aria, "data-op": data }, [label]);
      if (disabled) b.disabled = true;
      b.addEventListener("click", run);
      return b;
    }
    function swap(a, b) { var t = list[a]; list[a] = list[b]; list[b] = t; redraw(); }
    return el("div", { "class": "ce-ops" }, [
      mk("↑", "上へ", "up", i === 0, function () { swap(i, i - 1); }),
      mk("↓", "下へ", "down", i === list.length - 1, function () { swap(i, i + 1); }),
      mk("削除", "削除", "del", false, function () {
        if (!isBlank(list[i]) && !window.confirm(what + "を削除します。よろしいですか？")) return;
        list.splice(i, 1); redraw();
      })
    ]);
  }
  function focusIn(selector) {
    return function () {
      var nodes = $("ce-panel").querySelectorAll(selector);
      var n = nodes[nodes.length - 1];
      if (n) n.focus();
    };
  }

  // ---------- 各項目の編集欄 ----------
  function buildNews(root) {
    var list = state.work.news;
    list.forEach(function (n, i) {
      root.appendChild(el("div", { "class": "ce-item" }, [
        el("div", { "class": "ce-head" }, [el("strong", {}, ["お知らせ " + (i + 1)]), ops(list, i, "お知らせ" + (i + 1))]),
        field("日付", input("date", n.date, "date", function (v) { n.date = v; })),
        field("本文（「【調整中】」と書くと「調整中」の札になります）", textarea(n.text, 3, "text", function (v) { n.text = v; })),
        field("リンク（任意。入れると本文がリンクになります）", input("url", n.url, "url", function (v) { n.url = v; }))
      ]));
    });
    root.appendChild(el("div", { "class": "ce-add" }, [
      button("お知らせを追加", function () { list.push({ date: today(), text: "", url: "" }); redraw(focusIn('.ce-item [data-f="text"]')); }),
      button("日付の新しい順に並べ替え", function () {
        var idx = list.map(function (n, i) { return { n: n, i: i }; });
        idx.sort(function (a, b) { return (b.n.date || "").localeCompare(a.n.date || "") || a.i - b.i; });
        state.work.news = idx.map(function (x) { return x.n; });
        redraw();
      }, "ce-ghost")
    ]));
  }

  function buildOverview(root) {
    var list = state.work.overview;
    if (!list.length) {
      root.appendChild(el("p", { "class": "ce-note" }, ["まだ項目がありません。標準の項目を入れてから、内容を書いてください。"]));
    }
    list.forEach(function (r, i) {
      var v = textarea(r.v, 2, "v", function (x) { r.v = x; });
      var tbd = button("【調整中】を入れる", function () {
        if (r.v.indexOf("【調整中】") !== 0) { r.v = "【調整中】" + r.v; v.value = r.v; changed(); }
        v.focus();
      }, "ce-ghost");
      root.appendChild(el("div", { "class": "ce-item" }, [
        el("div", { "class": "ce-head" }, [el("strong", {}, ["項目 " + (i + 1)]), ops(list, i, "項目" + (i + 1))]),
        field("項目名（例：会場）", input("text", r.k, "k", function (x) { r.k = x; })),
        field("内容", v),
        el("p", { "class": "ce-add" }, [tbd])
      ]));
    });
    var adds = [button("項目を追加", function () { list.push({ k: "", v: "" }); redraw(focusIn('.ce-item [data-f="k"]')); })];
    if (!list.length) {
      adds.unshift(button("標準の項目を入れる", function () {
        ["大会名", "開催日程", "会場", "主催", "参加費"].forEach(function (k) { list.push({ k: k, v: "" }); });
        redraw();
      }, "ce-primary"));
    }
    root.appendChild(el("div", { "class": "ce-add" }, adds));
  }

  function buildProgram(root) {
    var days = state.work.program;
    days.forEach(function (d, i) {
      var card = el("div", { "class": "ce-item" }, [
        el("div", { "class": "ce-head" }, [el("strong", {}, ["日 " + (i + 1)]), ops(days, i, (i + 1) + "つ目の日")]),
        field("日の見出し（例：1日目）", input("text", d.label, "label", function (x) { d.label = x; })),
        field("ひとこと（例：総会と分科会）", input("text", d.sub, "sub", function (x) { d.sub = x; }))
      ]);
      d.items.forEach(function (it, j) {
        card.appendChild(el("div", { "class": "ce-sub" }, [
          el("div", { "class": "ce-head" }, [el("strong", {}, ["項目 " + (j + 1)]), ops(d.items, j, (i + 1) + "日目の項目" + (j + 1))]),
          el("div", { "class": "ce-row" }, [
            field("時刻", input("text", it.time, "time", function (x) { it.time = x; })),
            field("内容", input("text", it.text, "text", function (x) { it.text = x; }))
          ])
        ]));
      });
      card.appendChild(el("div", { "class": "ce-add" }, [
        button("この日に項目を追加", function () { d.items.push({ time: "", text: "" }); redraw(function () {
          var cards = $("ce-panel").querySelectorAll(".ce-item");
          var subs = cards[i].querySelectorAll('.ce-sub [data-f="time"]');
          if (subs.length) subs[subs.length - 1].focus();
        }); })
      ]));
      root.appendChild(card);
    });
    root.appendChild(el("div", { "class": "ce-add" }, [
      button("日を追加", function () { days.push({ label: (days.length + 1) + "日目", sub: "", items: [] }); redraw(focusIn('.ce-item [data-f="label"]')); })
    ]));
  }
  var BUILD = { news: buildNews, overview: buildOverview, program: buildProgram };

  // ---------- 画面の更新 ----------
  function isDirty(key) { return JSON.stringify(S.normalize(key, state.work[key], false)) !== state.saved[key]; }
  function anyDirty() { return S.KEYS.some(isDirty); }
  function rowOf(key) { return state.rows[key]; }
  function everPublished(key) { return !!rowOf(key).published_at; }
  function draftSameAsPublished(key) { return everPublished(key) && S.sameContent(key, rowOf(key).draft, rowOf(key).published); }

  function renderTabs() {
    var box = $("ce-tabs");
    box.textContent = "";
    S.KEYS.forEach(function (key) {
      var sel = key === state.key;
      var dirty = isDirty(key);
      var b = el("button", { type: "button", "class": "ce-tab", role: "tab", "data-key": key, "aria-selected": String(sel), tabindex: sel ? "0" : "-1", "aria-label": S.LABELS[key] + (dirty ? "（未保存の変更あり）" : "") }, [S.LABELS[key]]);
      if (dirty) b.appendChild(el("span", { "class": "ce-dot", "aria-hidden": "true" }));
      b.addEventListener("click", function () { state.key = key; renderAll(); });
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        state.key = S.KEYS[(S.KEYS.indexOf(key) + d + S.KEYS.length) % S.KEYS.length];
        renderAll();
        var cur = box.querySelector('[data-key="' + state.key + '"]');
        if (cur) cur.focus();
      });
      box.appendChild(b);
    });
  }
  function renderPanel() {
    var p = $("ce-panel");
    p.textContent = "";
    BUILD[state.key](p);
  }
  function renderProblems() {
    var box = $("ce-problems");
    box.textContent = "";
    var list = S.validate(state.key, state.work[state.key]);
    if (!list.length) { box.appendChild(el("p", { "class": "ce-note" }, ["公開前の点検：問題はありません。"])); return; }
    var ul = el("ul");
    list.forEach(function (p) {
      ul.appendChild(el("li", { "class": p.level === "error" ? "ce-e" : "ce-w" }, [(p.level === "error" ? "直してください：" : "注意：") + p.where + "：" + p.message]));
    });
    box.appendChild(ul);
  }
  function renderStatus() {
    var key = state.key, row = rowOf(key), dirty = isDirty(key);
    var who = row.updated_by ? "（最終更新：" + row.updated_by + "）" : "";
    var pub = !everPublished(key) ? "公開：まだ公開していません（サイトには元の内容が表示されます）"
      : draftSameAsPublished(key) ? "公開：公開中（下書きと同じ内容）" : "公開：公開中（下書きに、まだ公開していない変更があります）";
    $("ce-status").textContent = "下書き：" + (dirty ? "保存していない変更があります" : "保存済み") + who + "　／　" + pub;
    $("ce-save").disabled = state.busy || !dirty;
    $("ce-publish").disabled = state.busy || (!dirty && draftSameAsPublished(key));
    $("ce-discard").disabled = state.busy || !everPublished(key) || S.sameContent(key, state.work[key], row.published);
  }
  function renderPreview() {
    var key = state.key;
    var node = key === "news" ? el("ul", { "class": "news" }) : key === "overview" ? el("dl", { "class": "spec" }) : el("ol", { "class": "days" });
    var box = $("ce-preview");
    box.textContent = "";
    box.appendChild(node);
    var content = {}, targets = {};
    content[key] = state.work[key]; targets[key] = node;
    SC.render(content, targets);
    if (!node.firstChild) box.appendChild(el("p", { "class": "ce-note" }, ["（まだ表示される内容がありません）"]));
  }
  function changed() { renderTabs(); renderProblems(); renderStatus(); renderPreview(); }
  function redraw(focusFn) { renderPanel(); changed(); if (focusFn) focusFn(); }
  function renderAll() { renderPanel(); changed(); }

  // ---------- 操作 ----------
  function setBusy(b) { state.busy = b; if (state.rows) renderStatus(); }
  function fail(e) {
    if (e && e.code === "auth") { showLogin(e.message); return; }
    if (e && e.code === "conflict") { banner(e.message, "error", { label: "最新を読み込む", run: reloadLatest }); return; }
    banner((e && e.message) || "エラーが起きました。", "error");
  }
  async function save(key) {
    var row = rowOf(key);
    var r = await store.saveDraft(key, state.work[key], row.version);
    row.version = r.version;
    row.updated_at = r.updated_at;
    row.updated_by = r.updated_by || row.updated_by;
    row.draft = S.normalize(key, state.work[key], false);
    state.work[key] = clone(row.draft);        // 実際に保存された形（不正なURLは空になる）を画面に戻す
    state.saved[key] = JSON.stringify(row.draft);
  }
  async function onSave() {
    banner("");
    setBusy(true);
    try { await save(state.key); renderAll(); banner("下書きを保存しました。", "good"); }
    catch (e) { fail(e); } finally { setBusy(false); }
  }
  async function onPublish() {
    var key = state.key;
    banner("");
    if (S.validate(key, state.work[key]).some(function (p) { return p.level === "error"; })) {
      banner("赤い項目を直してから公開してください。", "error");
      return;
    }
    var msg = "「" + S.LABELS[key] + "」を公開します。サイトに反映されます。" + (isDirty(key) ? "\n（保存していない変更も、先に保存してから公開します）" : "") + "\nよろしいですか？";
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      if (isDirty(key)) await save(key);
      var r = await store.publish(key);
      var row = rowOf(key);
      row.published = S.normalize(key, row.draft, true);
      row.published_at = r.published_at;
      row.version = r.version;
      row.updated_by = r.updated_by || row.updated_by;
      renderAll();
      banner("公開しました。サイトを読み込み直すと反映されます。", "good");
    } catch (e) { fail(e); } finally { setBusy(false); }
  }
  async function onDiscard() {
    var key = state.key, row = rowOf(key);
    if (!window.confirm("下書きを、いま公開している内容に戻します。書きかけの内容は消えます。よろしいですか？")) return;
    banner("");
    setBusy(true);
    try {
      state.work[key] = clone(S.normalize(key, row.published, false));
      await save(key);
      renderAll();
      banner("公開中の内容に戻しました。", "good");
    } catch (e) { fail(e); } finally { setBusy(false); }
  }
  async function reloadLatest() {
    if (anyDirty() && !window.confirm("最新を読み込みます。保存していない変更は消えます。よろしいですか？")) return;
    banner("");
    try { await load(); } catch (e) { fail(e); }
  }

  // ---------- ログインと読み込み ----------
  function showLogin(message) {
    $("ce-app").hidden = true;
    $("ce-login").hidden = false;
    $("ce-logout").hidden = true;
    $("ce-mode").textContent = "共同編集：ログインしてください";
    $("ce-password").value = "";
    if (message) banner(message, "error");
  }
  async function load() {
    var rows = await store.loadAll();
    state.rows = rows; state.work = {}; state.saved = {};
    S.KEYS.forEach(function (k) {
      state.work[k] = clone(S.normalize(k, rows[k].draft, false));
      state.saved[k] = JSON.stringify(state.work[k]);
    });
    $("ce-login").hidden = true;
    $("ce-app").hidden = false;
    if (store.kind === "supabase") {
      $("ce-mode").textContent = "共同編集：" + state.loggedInAs;
      $("ce-logout").hidden = false;
    } else {
      $("ce-mode").textContent = "ローカルモード：この端末のブラウザだけに保存";
    }
    renderAll();
  }
  async function afterLogin(email) {
    state.loggedInAs = email;
    try { await load(); }
    catch (e) {
      try { await store.signOut(); } catch (e2) { /* 無視 */ }
      showLogin(e.message);
    }
  }
  async function onSignin() {
    var email = $("ce-email").value.trim(), pw = $("ce-password").value;
    if (!email || !pw) { banner("メールアドレスとパスワードを入力してください。", "error"); return; }
    banner(""); $("ce-signin").disabled = true;
    try { var r = await store.signInWithPassword(email, pw); $("ce-password").value = ""; await afterLogin(r.user); }
    catch (e) { banner(e.message, "error"); } finally { $("ce-signin").disabled = false; }
  }
  async function onSend() {
    var email = $("ce-email").value.trim();
    if (!email) { banner("メールアドレスを入力してください。", "error"); return; }
    banner(""); $("ce-send").disabled = true;
    try {
      await store.requestLogin(email);
      $("ce-code-box").hidden = false;
      banner("メールを送りました。届いたメールのリンクを開くか、6桁のコードを下に入力してください。", "good");
      $("ce-code").focus();
    } catch (e) { banner(e.message, "error"); } finally { $("ce-send").disabled = false; }
  }
  async function onVerify() {
    var email = $("ce-email").value.trim(), code = $("ce-code").value.trim();
    if (!email || !code) { banner("メールアドレスとコードを入力してください。", "error"); return; }
    banner(""); $("ce-verify").disabled = true;
    try { var r = await store.verifyCode(email, code); await afterLogin(r.user); }
    catch (e) { banner(e.message, "error"); } finally { $("ce-verify").disabled = false; }
  }
  async function onLogout() {
    if (anyDirty() && !window.confirm("保存していない変更があります。ログアウトすると消えます。よろしいですか？")) return;
    await store.signOut();
    state.rows = null; state.loggedInAs = null;
    banner("");
    showLogin("");
  }

  async function start() {
    if (cfg.BACKEND === "supabase") {
      if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
        banner("config.js の SUPABASE_URL と SUPABASE_ANON_KEY を設定してください（README の手順）。", "error");
        return;
      }
      store = new window.ConfStoreSupabase(cfg);
    } else {
      store = new window.ConfStoreLocal();
    }
    $("ce-save").addEventListener("click", onSave);
    $("ce-publish").addEventListener("click", onPublish);
    $("ce-discard").addEventListener("click", onDiscard);
    $("ce-send").addEventListener("click", onSend);
    $("ce-verify").addEventListener("click", onVerify);
    $("ce-signin").addEventListener("click", onSignin);
    $("ce-password").addEventListener("keydown", function (e) { if (e.key === "Enter") onSignin(); });
    $("ce-logout").addEventListener("click", onLogout);
    window.addEventListener("beforeunload", function (e) {
      if (state.rows && anyDirty()) { e.preventDefault(); e.returnValue = ""; }
    });
    try {
      var init = await store.init();
      if (init.error) banner(init.error, "error");
      if (init.needsLogin) { showLogin(""); return; }
      await afterLogin(init.user);
    } catch (e) { fail(e); }
  }

  start();
})();
