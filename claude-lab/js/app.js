// Claudeラボ — 画面を動かす部分。レッスンの中身は data/*.js（window.CLAB_LEVELS）にある。
// 依存なし・ビルドなし。index.html をそのまま開いても動く。
(function () {
  "use strict";

  var STORE_KEY = "claudeLab.v1";
  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ---------- データ ----------
  var LEVELS = (window.CLAB_LEVELS || []).slice().sort(function (a, b) { return a.no - b.no; });
  var MISSIONS = []; // 表示順の全ミッション { mission, level }
  LEVELS.forEach(function (lv) {
    (lv.missions || []).forEach(function (m) { MISSIONS.push({ mission: m, level: lv }); });
  });
  function findMission(id) {
    for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].mission.id === id) return MISSIONS[i];
    return null;
  }

  // ---------- 保存（この端末のブラウザの中だけ） ----------
  function loadStore() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && typeof s === "object") return { done: s.done || {}, tried: s.tried || {}, notes: s.notes || {} };
    } catch (e) { /* 保存できない環境でも動かす */ }
    return { done: {}, tried: {}, notes: {} };
  }
  var store = loadStore();
  function saveStore() { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* 何もしない */ } }

  // ---------- 小さな部品 ----------
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") el.className = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }

  // ---------- 指示の組み立て ----------
  // k個ぶんの材料を足した指示を、表示用の部品の並びにする。
  function promptParts(m, k) {
    var parts = [{ kind: "base", text: m.base.text }];
    for (var i = 0; i < k; i++) {
      var s = m.steps[i];
      parts.push({ kind: "added", step: i, text: s.add });
      if (s.attach && m.material) parts.push({ kind: "attach", step: i, label: m.material.label, text: m.material.text });
    }
    return parts;
  }
  function partsToText(parts) {
    return parts.map(function (p) { return p.kind === "attach" ? "\n" + p.text + "\n" : p.text; }).join("\n").trim();
  }
  // followups 型は、別ミッションの完成形を最初の下書きとして借りられる（baseFrom）。
  function resolveBase(m) {
    if (m.baseFrom) {
      var src = findMission(m.baseFrom);
      if (src && src.mission.steps && src.mission.steps.length) {
        var last = src.mission.steps.length;
        var parts = promptParts(src.mission, last);
        return { parts: parts, text: partsToText(parts), result: src.mission.steps[last - 1].result, from: src };
      }
    }
    return { parts: [{ kind: "base", text: m.base.text }], text: m.base.text, result: m.base.result, from: null };
  }

  // ---------- 吹き出し ----------
  function userBubble(parts, newStep) {
    var body = h("div", { class: "bubble" });
    parts.forEach(function (p) {
      if (p.kind === "attach") {
        body.append(h("div", { class: "attach" },
          h("div", { class: "attach-label" }, "貼りつけ：" + p.label),
          h("pre", null, p.text)));
      } else {
        var cls = "line " + p.kind + (p.kind === "added" && p.step === newStep ? " is-new" : "");
        body.append(h("p", { class: cls }, p.text));
      }
    });
    return h("div", { class: "msg user" }, h("div", { class: "who" }, "あなた"), body);
  }
  function claudeBubble() {
    var result = h("div", { class: "result", tabindex: "0" });
    var el = h("div", { class: "msg claude" },
      h("div", { class: "who" }, "Claude", h("span", { class: "sample-badge" }, "見本の応答")),
      h("div", { class: "bubble" }, result));
    return { el: el, result: result };
  }
  function insight(text) {
    return h("aside", { class: "insight" }, h("b", null, "気づき"), h("p", null, text));
  }

  // ---------- 文字が流れる表示（クリックですぐ全部出る） ----------
  var typing = null;
  function cancelTyping() {
    if (!typing) return;
    clearInterval(typing.timer);
    typing.body.classList.remove("typing");
    typing.body.style.minHeight = "";
    typing = null;
  }
  function finishTyping() {
    if (!typing) return;
    var t = typing;
    cancelTyping();
    t.body.textContent = t.text;
    if (t.done) t.done();
  }
  function typeInto(body, text, done) {
    finishTyping();
    if (REDUCED) { body.textContent = text; if (done) done(); return; }
    // 完成後の高さを先に確保する（流れている途中でも、スクロール位置がずれないように）
    body.textContent = text;
    body.style.minHeight = body.offsetHeight + "px";
    var i = 0;
    body.textContent = "";
    body.classList.add("typing");
    var timer = setInterval(function () {
      i = Math.min(text.length, i + 4);
      body.textContent = text.slice(0, i);
      if (i >= text.length) finishTyping();
    }, 18);
    typing = { timer: timer, body: body, text: text, done: done };
    body.addEventListener("click", finishTyping, { once: true });
  }

  // ---------- コピー ----------
  function copyText(text, btn) {
    var label = btn.textContent;
    function ok() { btn.textContent = "コピーしました"; setTimeout(function () { btn.textContent = label; }, 1600); }
    function fallback() {
      var ta = h("textarea", { style: "position:fixed;opacity:0;left:-999px" });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      try { document.execCommand("copy") ? ok() : (btn.textContent = "上の文を選んでコピーしてください"); }
      catch (e) { btn.textContent = "上の文を選んでコピーしてください"; }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  }

  // ---------- ホーム ----------
  function renderHome() {
    var next = null;
    for (var i = 0; i < MISSIONS.length; i++) if (!store.done[MISSIONS[i].mission.id]) { next = MISSIONS[i].mission.id; break; }

    var levels = h("div", { class: "levels" });
    LEVELS.forEach(function (lv) {
      var card = h("article", { class: "level" + (lv.coming ? " coming" : "") },
        h("div", { class: "level-no" }, "Lv." + lv.no),
        h("div", null,
          h("h3", null, lv.title, " ", lv.coming ? h("span", { class: "badge soon" }, "準備中") : null),
          h("p", { class: "lead" }, lv.lead),
          lv.coming ? null : h("ul", { class: "missions" }, (lv.missions || []).map(function (m) {
            return h("li", null, h("a", { href: "#/m/" + m.id },
              h("span", { class: "dot" + (store.done[m.id] ? " done" : ""), "aria-hidden": "true" }, "✓"),
              h("span", { class: "mid" }, m.id),
              h("span", { class: "mtitle" }, m.title),
              store.done[m.id] ? h("span", { class: "sr" }, "（完了）") : null,
              m.id === next ? h("span", { class: "badge" }, "つぎはここ") : null));
          }))));
      levels.append(card);
    });

    return h("div", null,
      h("section", { class: "hero" },
        h("h1", null, "指示を足すと、", h("em", null, "結果が変わる。")),
        h("p", { class: "sub" }, "Claudeの使い方を、使いながら学ぶ練習場。指示を少しずつ育てて、どんな結果が返ってくるかを見くらべます。むずかしい用語は、ありません。"),
        h("ol", { class: "howto" },
          h("li", null, "場面を読む"),
          h("li", null, "指示に「材料」を足す"),
          h("li", null, "送って、結果を見くらべる"),
          h("li", null, "本物のClaudeでも試す")),
        h("p", { class: "notice" }, "ここに出る結果は、あらかじめ用意した見本です。本物のClaudeは、同じ指示でも毎回少しちがう答えを返します。だから最後は、本物でも試して、見くらべてください。")),
      levels);
  }

  // ---------- ミッション ----------
  function renderMission(info) {
    var m = info.mission;
    var lv = info.level;
    var pos = MISSIONS.indexOf(info);
    var isFollow = m.type === "followups";
    var base = resolveBase(m);

    var st = { k: 0, sel: 0, sent: {}, nsent: 0, lastKey: null, tipShown: false };
    var root = h("div", { class: "mission" });

    var log = h("section", { class: "log", "aria-live": "polite", "aria-label": "やりとり" });
    var preview = h("div", { class: "preview" });
    var chips = h("div", { class: "chips", role: "group", "aria-label": isFollow ? "追加のひとこと" : "指示に足す材料" });
    var hint = h("p", { class: "hint" });
    var sendBtn = h("button", { type: "button", class: "btn primary", onclick: send }, "この指示を送る");
    var after = h("div", { class: "after-slot" });

    // 先頭：場面と案内
    root.append(
      h("div", { class: "crumb" },
        h("a", { href: "#/" }, "← 一覧へ"),
        h("span", null, "Lv." + lv.no + " " + lv.title + " ／ ミッション " + m.id)),
      h("h2", null, m.title),
      h("div", { class: "scene" }, h("b", null, "場面"), m.scene),
      h("p", { class: "guide" }, isFollow
        ? "最初の下書きに、ひとことを足して送ってみよう。気になるものを、いくつでも。"
        : "まずは「ざっくり」のまま送ってみよう。そのあと、材料を足して、もう一度送って見くらべる。"));

    // 追加の指示型は、最初の下書きを最初から見せる
    if (isFollow) {
      var baseResult = claudeBubble();
      baseResult.result.textContent = base.result;
      var head = h("div", { class: "entry-head" },
        h("span", { class: "entry-no" }, "最初の下書き"),
        base.from ? h("a", { href: "#/m/" + base.from.mission.id }, "ミッション " + base.from.mission.id + " の完成形") : null);
      log.append(h("article", { class: "entry is-base" }, head, userBubble(base.parts, -1), baseResult.el));
    }
    root.append(log);

    // 指示を組み立てる場所
    m.steps.forEach(function (s, i) {
      chips.append(h("button", {
        type: "button", class: "chip", "aria-pressed": "false", "data-i": String(i),
        onclick: function () {
          if (isFollow) st.sel = i;
          else st.k = i < st.k ? i : i + 1; // 押した材料までを足す。足してある材料を押すと、そこまで戻す
          refresh();
        },
      }, h("span", { class: "chip-no" }, String(i + 1)), s.label));
    });
    root.append(
      h("section", { class: "draft" },
        h("h3", null, isFollow ? "あなたのひとこと" : "あなたの指示（材料を足すと育つ）"),
        preview),
      h("div", { class: "bar" },
        h("h3", null, isFollow ? "ひとこと（1つえらぶ）" : "指示に足す材料（順番に押す）"),
        chips,
        h("div", { class: "actions" }, sendBtn, hint)));
    root.append(after);

    // 前後ナビ
    var prev = MISSIONS[pos - 1];
    var nextM = MISSIONS[pos + 1];
    root.append(h("nav", { class: "pager", "aria-label": "ミッションの移動" },
      prev ? h("a", { class: "btn", href: "#/m/" + prev.mission.id }, "← " + prev.mission.id + " " + prev.mission.title) : h("span"),
      nextM ? h("a", { class: "btn", href: "#/m/" + nextM.mission.id }, nextM.mission.id + " " + nextM.mission.title + " →")
        : h("a", { class: "btn", href: "#/" }, "一覧へ")));

    function refresh() {
      preview.replaceChildren(isFollow
        ? userBubble([{ kind: "base", text: m.steps[st.sel].text }], -1)
        : userBubble(promptParts(m, st.k), st.k - 1));
      Array.prototype.forEach.call(chips.children, function (c, i) {
        var on = isFollow ? i === st.sel : i < st.k;
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var need = isFollow ? Math.max(0, 2 - st.nsent) : 0;
      if (isFollow) hint.textContent = st.nsent === 0 ? "ひとことを選んで「送る」を押そう。" : (need > 0 ? "あと" + need + "つ送ると、ミッション完了。" : "ほかのひとことも、試してみよう。");
      else if (st.nsent === 0) hint.textContent = "いまは「ざっくり」の指示。このまま送ってみよう。";
      else if (st.k < m.steps.length) hint.textContent = "材料を足して、もう一度送ろう。結果がどう変わるか、上の結果と見くらべる。";
      else hint.textContent = "すべての材料が入った指示。ここまで来たら、前の結果と見くらべてみよう。";
    }

    function send() {
      var key = isFollow ? "f" + st.sel : "k" + st.k;
      if (st.lastKey === key) { // 同じ内容を続けて送っても増やさない
        finishTyping();
        var lastEntry = log.lastElementChild;
        if (lastEntry) lastEntry.scrollIntoView({ block: "start", behavior: REDUCED ? "auto" : "smooth" });
        return;
      }
      st.lastKey = key;
      st.nsent += 1;
      st.sent[key] = true;

      var label, userEl, result, tip;
      if (isFollow) {
        var f = m.steps[st.sel];
        label = f.label; userEl = userBubble([{ kind: "base", text: f.text }], -1); result = f.result; tip = f.tip;
      } else if (st.k === 0) {
        label = m.base.label; userEl = userBubble(promptParts(m, 0), -1); result = m.base.result; tip = m.base.tip;
      } else {
        var s = m.steps[st.k - 1];
        label = "＋" + s.label; userEl = userBubble(promptParts(m, st.k), st.k - 1); result = s.result; tip = s.tip;
      }

      var cb = claudeBubble();
      var tipSlot = h("div");
      var entry = h("article", { class: "entry" },
        h("div", { class: "entry-head" },
          h("span", { class: "entry-no" }, st.nsent + "回目"),
          h("span", { class: "entry-label" }, label)),
        userEl, cb.el, tipSlot);
      log.append(entry);
      typeInto(cb.result, result, function () { tipSlot.append(insight(tip)); });
      // 送った指示が長い（メモつきなど）ときは、返事の先頭が画面の下に隠れるので、返事に合わせてスクロールする
      var target = userEl.offsetHeight > window.innerHeight * 0.35 ? cb.el : entry;
      target.scrollIntoView({ block: "start", behavior: REDUCED ? "auto" : "smooth" });

      var doneNow = isFollow ? Object.keys(st.sent).length >= 2 : st.k === m.steps.length;
      if (doneNow) markDone();
      refresh();
    }

    function markDone() {
      if (!store.done[m.id]) { store.done[m.id] = true; saveStore(); updateProgress(); }
      showAfter();
    }

    function showAfter() {
      var tryIt = m.tryIt || {};
      var copy = tryIt.copy || (isFollow ? base.text : partsToText(promptParts(m, m.steps.length)));
      var copyBtn = h("button", { type: "button", class: "btn primary", onclick: function () { copyText(copy, copyBtn); } }, "コピーする");
      var tried = h("input", { type: "checkbox", id: "tried", onchange: function () {
        if (tried.checked) store.tried[m.id] = true; else delete store.tried[m.id];
        saveStore();
      } });
      tried.checked = !!store.tried[m.id];
      var note = h("textarea", { "aria-label": "ふりかえりメモ", placeholder: "ここにメモ（この端末のブラウザの中にだけ保存されます）", oninput: function () {
        if (note.value) store.notes[m.id] = note.value; else delete store.notes[m.id];
        saveStore();
      } });
      note.value = store.notes[m.id] || "";

      after.replaceChildren(h("section", { class: "after" },
        h("span", { class: "done-badge" }, "ミッション完了"),
        h("h3", null, "本物のClaudeでも試してみよう"),
        h("p", null, tryIt.intro || "同じ指示を、本物のClaudeに送ってみよう。結果がちがっても、それが普通。何がちがうかを見るのが、練習になる。"),
        h("div", { class: "copybox" }, h("pre", null, copy)),
        h("div", { class: "row" },
          copyBtn,
          h("a", { class: "btn", href: "https://claude.ai/new", target: "_blank", rel: "noopener noreferrer" }, "Claudeを開く ↗")),
        tryIt.caution ? h("p", { class: "caution" }, tryIt.caution) : null,
        h("label", { class: "check", for: "tried" }, tried, "本物のClaudeでも試した"),
        m.reflect ? h("div", { class: "reflect" }, h("h4", null, "ふりかえり"), h("p", null, m.reflect), note) : null));
    }

    refresh();
    if (store.done[m.id]) showAfter(); // 一度終えたミッションは、コピー用のパネルを最初から出す
    return root;
  }

  // ---------- 進み具合 ----------
  function updateProgress() {
    var n = 0;
    MISSIONS.forEach(function (x) { if (store.done[x.mission.id]) n += 1; });
    var el = document.getElementById("progress");
    if (el) el.textContent = "完了 " + n + " / " + MISSIONS.length;
  }

  // ---------- ルーター ----------
  function route() {
    cancelTyping();
    var view = document.getElementById("view");
    var hit = location.hash.match(/^#\/m\/([\w-]+)/);
    var info = hit ? findMission(hit[1]) : null;
    view.replaceChildren(info ? renderMission(info) : renderHome());
    document.title = (info ? info.mission.title + " — " : "") + "Claudeラボ — 使いながら学ぶ";
    window.scrollTo(0, 0);
    updateProgress();
  }
  window.addEventListener("hashchange", route);

  document.getElementById("btnReset").addEventListener("click", function () {
    if (!window.confirm("完了の印と、ふりかえりメモを、すべて消します。よろしいですか？")) return;
    store = { done: {}, tried: {}, notes: {} };
    saveStore();
    route();
  });

  route();
})();
