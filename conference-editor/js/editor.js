/* 編集画面：お知らせ・大会概要・日程と流れを、項目を入力する形で編集する。
   保存先は config.js の BACKEND で切り替わる（local＝このブラウザの中／supabase＝ログインして共同編集）。
   文字はすべて textContent / value で入れる（HTML としては解釈しない）。

   画面は3列：左＝サイトの見取り図（どこを編集するか選ぶ）／中＝入力欄／右＝サイトでの見え方。
   入力欄に触ると、右のプレビューの該当する行が光る。プレビューの行を押すと、その入力欄に移る。 */
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
  function clip(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; }
  var uidn = 0;
  function uid() { return "ce-f" + (++uidn); }

  // 各場所の説明（「サイトのどこか」を言葉で示す）。サイトの見出しに合わせてある。
  var INFO = {
    news:     { short: "サイトの「お知らせ」の欄",   desc: "サイトの「お知らせ」の一覧です。日付と本文が、1件ずつ並びます。上に置いたものが、サイトでも上に出ます。" },
    overview: { short: "サイトの「大会概要」の表",   desc: "サイトの「大会概要」の表です。左に項目名、右に内容が並びます。" },
    program:  { short: "サイトの「日程と流れ」",     desc: "サイトの「日程と流れ」です。日ごとのカードに、時刻つきの項目が並びます。" }
  };
  var ANCHORS = { news: "news", overview: "overview", program: "schedule" };   // サイト側のセクションID（config.js の SITE_ANCHORS で変えられる）

  var state = { key: "news", rows: null, work: {}, saved: {}, busy: false, loggedInAs: null, active: { i: null, j: null } };
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
  // 入力欄：ラベル（太字）＋「サイトのどこに出るか」の説明
  function field(label, control, hint) {
    var id = uid();
    control.id = id;
    var kids = [el("label", { "for": id }, [el("span", { "class": "ce-lab" }, [label])])];
    if (hint) {
      var hid = id + "-h";
      kids.push(el("span", { "class": "ce-hint", id: hid }, [hint]));
      control.setAttribute("aria-describedby", hid);
    }
    kids.push(control);
    return el("div", { "class": "ce-field" }, kids);
  }
  function input(type, value, data, onInput, ph) {
    var i = el("input", { type: type, "data-f": data });
    if (ph) i.setAttribute("placeholder", ph);
    i.value = value || "";
    i.addEventListener("input", function () { onInput(i.value); changed(); });
    return i;
  }
  function textarea(value, rows, data, onInput, ph) {
    var t = el("textarea", { rows: String(rows), "data-f": data });
    if (ph) t.setAttribute("placeholder", ph);
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

  // カードの見出し（「お知らせ 1」＋中身の要約＋「編集中」の札＋↑↓削除）
  function head(title, sumId, sumText, opsNode) {
    return el("div", { "class": "ce-head" }, [
      el("strong", {}, [title]),
      el("span", { "class": "ce-sum", "data-sum": sumId }, [sumText]),
      el("span", { "class": "ce-now" }, ["編集中"]),
      opsNode
    ]);
  }
  function summaryOf(key, i) {
    var it = state.work[key][i];
    if (!it) return "";
    if (key === "news") return (it.date ? S.jpDate(it.date) : "日付なし") + "｜" + (it.text ? clip(it.text, 24) : "（本文が空）");
    if (key === "overview") return (it.k || "（項目名が空）") + "：" + (it.v ? clip(it.v, 18) : "（内容が空）");
    return (it.label || "（見出しが空）") + (it.sub ? "｜" + clip(it.sub, 14) : "");
  }
  function subSummary(i, j) {
    var it = state.work.program[i] && state.work.program[i].items[j];
    if (!it) return "";
    return (it.time ? it.time + " " : "") + (it.text ? clip(it.text, 20) : "（内容が空）");
  }

  // ---------- 各場所の編集欄 ----------
  function buildNews(root) {
    var list = state.work.news;
    list.forEach(function (n, i) {
      root.appendChild(el("div", { "class": "ce-item", "data-i": String(i) }, [
        head("お知らせ " + (i + 1), String(i), summaryOf("news", i), ops(list, i, "お知らせ" + (i + 1))),
        field("日付", input("date", n.date, "date", function (v) { n.date = v; }), "サイトでは、お知らせの左に出ます（例：2027年5月1日）"),
        field("本文", textarea(n.text, 3, "text", function (v) { n.text = v; }, "例：参加の受付を始めました"), "お知らせの文章です。「【調整中】」と書くと、「調整中」の札になります"),
        field("リンク（なくても大丈夫）", input("url", n.url, "url", function (v) { n.url = v; }, "https://…"), "入れると、本文を押したときに、このページが開きます")
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
      var v = textarea(r.v, 2, "v", function (x) { r.v = x; }, "例：サンプル大学 サンプルキャンパス");
      var tbd = button("【調整中】を入れる", function () {
        if (r.v.indexOf("【調整中】") !== 0) { r.v = "【調整中】" + r.v; v.value = r.v; changed(); }
        v.focus();
      }, "ce-ghost");
      root.appendChild(el("div", { "class": "ce-item", "data-i": String(i) }, [
        head("項目 " + (i + 1), String(i), summaryOf("overview", i), ops(list, i, "項目" + (i + 1))),
        field("項目名", input("text", r.k, "k", function (x) { r.k = x; }, "例：会場"), "サイトでは、表の左側に出ます"),
        field("内容", v, "サイトでは、表の右側に出ます。まだ決まっていないときは、下のボタンで「調整中」の札を入れられます"),
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
      var card = el("div", { "class": "ce-item", "data-i": String(i) }, [
        head("日 " + (i + 1), String(i), summaryOf("program", i), ops(days, i, (i + 1) + "つ目の日")),
        field("日の見出し", input("text", d.label, "label", function (x) { d.label = x; }, "例：1日目"), "サイトでは、カードの上の大きな文字です"),
        field("ひとこと（なくても大丈夫）", input("text", d.sub, "sub", function (x) { d.sub = x; }, "例：総会と分科会"), "見出しの下の小さな文字です")
      ]);
      d.items.forEach(function (it, j) {
        card.appendChild(el("div", { "class": "ce-sub", "data-j": String(j) }, [
          head("この日の項目 " + (j + 1), i + "." + j, subSummary(i, j), ops(d.items, j, (i + 1) + "日目の項目" + (j + 1))),
          el("div", { "class": "ce-row" }, [
            field("時刻（なくても大丈夫）", input("text", it.time, "time", function (x) { it.time = x; }, "9:30"), "項目の上の小さな文字です"),
            field("内容", input("text", it.text, "text", function (x) { it.text = x; }, "例：受付"), "項目の文章です")
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

  // ---------- サイトの見取り図（左） ----------
  var SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(name, attrs) { var n = document.createElementNS(SVGNS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  // 場所ごとの、ページの形の小さな絵
  function icon(key) {
    var s = svgEl("svg", { viewBox: "0 0 40 28", width: "40", height: "28", "aria-hidden": "true", "class": "ce-tab-ico" });
    s.appendChild(svgEl("rect", { x: "0.5", y: "0.5", width: "39", height: "27", rx: "3", fill: "none", stroke: "currentColor" }));
    function bar(x, y, w, h, o) { s.appendChild(svgEl("rect", { x: x, y: y, width: w, height: h, fill: "currentColor", opacity: o || "1" })); }
    if (key === "news") { [6, 13, 20].forEach(function (y) { bar(4, y, 8, 3, ".45"); bar(15, y, 21, 3); }); }
    else if (key === "overview") { [5, 12, 19].forEach(function (y) { bar(4, y, 9, 3, ".45"); bar(16, y, 20, 3); }); }
    else if (key === "program") { [4, 15, 26 - 0.5].forEach(function (x) { s.appendChild(svgEl("rect", { x: x, y: "5", width: "9.5", height: "18", fill: "none", stroke: "currentColor" })); bar(x, 5, 9.5, 3); }); }
    else { s.appendChild(svgEl("rect", { x: "4", y: "5", width: "32", height: "18", fill: "none", stroke: "currentColor", "stroke-dasharray": "2 2", opacity: ".6" })); }
    return s;
  }
  function fixedItem(name, sub) {
    return el("div", { "class": "ce-tab-fixed", "aria-hidden": "true" }, [icon(""), el("span", { "class": "ce-tab-name" }, [name]), el("span", { "class": "ce-tab-sub" }, [sub])]);
  }

  function isDirty(key) { return JSON.stringify(S.normalize(key, state.work[key], false)) !== state.saved[key]; }
  function anyDirty() { return S.KEYS.some(isDirty); }
  function rowOf(key) { return state.rows[key]; }
  function everPublished(key) { return !!rowOf(key).published_at; }
  function draftSameAsPublished(key) { return everPublished(key) && S.sameContent(key, rowOf(key).draft, rowOf(key).published); }

  function selectKey(key) { state.key = key; state.active = { i: null, j: null }; renderAll(); }

  function renderTabs() {
    var box = $("ce-tabs");
    box.textContent = "";
    box.appendChild(fixedItem("ページの上", "タイトルなど（このツールでは編集しません）"));
    S.KEYS.forEach(function (key) {
      var sel = key === state.key;
      var dirty = isDirty(key);
      var name = el("span", { "class": "ce-tab-name" }, [S.LABELS[key]]);
      if (dirty) name.appendChild(el("span", { "class": "ce-dot", "aria-hidden": "true" }));
      var b = el("button", { type: "button", "class": "ce-tab", role: "tab", "data-key": key, "aria-selected": String(sel), tabindex: sel ? "0" : "-1",
        "aria-label": S.LABELS[key] + (dirty ? "（未保存の変更あり）" : "") + (sel ? "（いま編集中）" : "") }, [icon(key), name, el("span", { "class": "ce-tab-sub" }, [INFO[key].short])]);
      if (sel) b.appendChild(el("span", { "class": "ce-tab-now", "aria-hidden": "true" }, ["編集中"]));
      b.addEventListener("click", function () { selectKey(key); });
      b.addEventListener("keydown", function (e) {
        var d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        selectKey(S.KEYS[(S.KEYS.indexOf(key) + d + S.KEYS.length) % S.KEYS.length]);
        var cur = box.querySelector('[data-key="' + state.key + '"]');
        if (cur) cur.focus();
      });
      box.appendChild(b);
    });
    box.appendChild(fixedItem("そのほかの部分", "HTML（index.html）で編集します"));
  }

  // ---------- 中：いま編集しているところ ----------
  function renderWhere() {
    var key = state.key;
    $("ce-where-title").textContent = S.LABELS[key];
    $("ce-where-desc").textContent = INFO[key].desc;
    var a = $("ce-where-link");
    if (cfg.SITE_URL) {
      var anchors = {};
      for (var k in ANCHORS) anchors[k] = (cfg.SITE_ANCHORS && cfg.SITE_ANCHORS[k]) || ANCHORS[k];
      a.href = String(cfg.SITE_URL) + "#" + anchors[key];
      a.hidden = false;
    } else { a.hidden = true; }
  }
  function renderPanel() {
    var p = $("ce-panel");
    p.textContent = "";
    BUILD[state.key](p);
    markActive();
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
    $("ce-status").textContent = "「" + S.LABELS[key] + "」　下書き：" + (dirty ? "保存していない変更があります" : "保存済み") + who + "　／　" + pub;
    $("ce-save").disabled = state.busy || !dirty;
    $("ce-publish").disabled = state.busy || (!dirty && draftSameAsPublished(key));
    $("ce-discard").disabled = state.busy || !everPublished(key) || S.sameContent(key, state.work[key], row.published);
  }
  function updateSummaries() {
    var key = state.key;
    [].forEach.call($("ce-panel").querySelectorAll("[data-sum]"), function (n) {
      var id = n.getAttribute("data-sum");
      var parts = id.split(".");
      n.textContent = parts.length === 2 ? subSummary(+parts[0], +parts[1]) : summaryOf(key, +parts[0]);
    });
  }

  // ---------- 右：サイトでの見え方 ----------
  function renderPreview() {
    var key = state.key;
    $("ce-pv-h").textContent = S.LABELS[key];
    var node = key === "news" ? el("ul", { "class": "news" }) : key === "overview" ? el("dl", { "class": "spec" }) : el("ol", { "class": "days" });
    var box = $("ce-preview");
    box.textContent = "";
    box.appendChild(node);
    var content = {}, targets = {};
    content[key] = state.work[key]; targets[key] = node;
    SC.render(content, targets, { keepBlank: true });
    if (!node.firstChild) box.appendChild(el("p", { "class": "ce-note" }, ["（まだ何も書いていません。左の入力欄から追加してください）"]));
    applyHighlight(false);
  }

  // ---------- 入力欄 ⇔ プレビュー：いま編集している行を示す ----------
  function markActive() {
    var panel = $("ce-panel");
    [].forEach.call(panel.querySelectorAll(".ce-active"), function (n) { n.classList.remove("ce-active"); });
    var a = state.active;
    if (!a || a.i == null) return;
    var card = panel.querySelector('.ce-item[data-i="' + a.i + '"]');
    if (!card) return;
    card.classList.add("ce-active");
    if (a.j != null) { var sub = card.querySelector('.ce-sub[data-j="' + a.j + '"]'); if (sub) sub.classList.add("ce-active"); }
  }
  function scrollSide(node) {
    var side = $("ce-side");
    if (getComputedStyle(side).position !== "sticky") return;   // 縦に並んでいるとき（狭い画面）は、動かさない
    var top = node.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop;
    if (top < side.scrollTop + 40 || top > side.scrollTop + side.clientHeight - 90) side.scrollTop = Math.max(0, top - 90);
  }
  function applyHighlight(scroll) {
    var box = $("ce-preview");
    [].forEach.call(box.querySelectorAll(".ce-hl,.ce-hl2"), function (n) { n.classList.remove("ce-hl"); n.classList.remove("ce-hl2"); });
    var a = state.active;
    if (!a || a.i == null) return;
    var row = box.querySelector('[data-i="' + a.i + '"]');
    if (!row) return;
    row.classList.add("ce-hl");
    if (scroll) scrollSide(row);
    if (state.key === "program" && a.j != null) {
      var li = row.querySelector('li[data-j="' + a.j + '"]');
      if (li) { li.classList.add("ce-hl2"); if (scroll) scrollSide(li); }
    }
  }
  function setActive(i, j) {
    state.active = { i: i, j: j };
    markActive();
    applyHighlight(true);
  }

  function changed() { renderTabs(); renderProblems(); renderStatus(); renderPreview(); updateSummaries(); }
  function redraw(focusFn) { state.active = { i: null, j: null }; renderPanel(); changed(); if (focusFn) focusFn(); }
  function renderAll() { renderPanel(); renderWhere(); changed(); }

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
    try { await save(state.key); renderAll(); banner("「" + S.LABELS[state.key] + "」の下書きを保存しました。", "good"); }
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
      banner("「" + S.LABELS[key] + "」を公開しました。サイトを読み込み直すと反映されます。", "good");
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
    state.rows = rows; state.work = {}; state.saved = {}; state.active = { i: null, j: null };
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

  // 入力欄に触れたら、その行を「いま編集している行」にする
  function onPanelFocusIn(e) {
    var card = e.target.closest ? e.target.closest(".ce-item") : null;
    if (!card) return;
    var sub = e.target.closest(".ce-sub");
    var i = +card.getAttribute("data-i"), j = sub ? +sub.getAttribute("data-j") : null;
    if (state.active && state.active.i === i && state.active.j === j) return;
    setActive(i, j);
  }
  // プレビューの行を押したら、その入力欄に移る（リンクは開かない）
  function onPreviewClick(e) {
    if (e.target.closest && e.target.closest("a")) e.preventDefault();
    var row = e.target.closest ? e.target.closest("[data-i]") : null;
    if (!row) return;
    var i = +row.getAttribute("data-i");
    var li = state.key === "program" ? e.target.closest("li[data-j]") : null;
    var j = li ? +li.getAttribute("data-j") : null;
    var card = $("ce-panel").querySelector('.ce-item[data-i="' + i + '"]');
    if (!card) return;
    var scope = j != null ? (card.querySelector('.ce-sub[data-j="' + j + '"]') || card) : card;
    var target = scope.querySelector("input, textarea");
    if (card.scrollIntoView) card.scrollIntoView({ block: "center", behavior: "smooth" });
    if (target) target.focus({ preventScroll: true });
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
    $("ce-panel").addEventListener("focusin", onPanelFocusIn);
    $("ce-preview").addEventListener("click", onPreviewClick);
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
