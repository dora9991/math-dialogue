/* data/site-data.js の中身を画面に流し込む。ここは基本的に触らなくてよい。 */
(function () {
  "use strict";
  const S = window.SITE;
  const $ = (id) => document.getElementById(id);

  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach((c) => { if (c != null && c !== "") n.appendChild(typeof c === "string" ? txt(c) : c); });
    return n;
  }

  // 【要入力】から句読点・改行までを黄色くマークする
  function txt(s) {
    const frag = document.createDocumentFragment();
    String(s == null ? "" : s).split(/(【要入力】[^\s、。]*)/).forEach((p) => {
      if (!p) return;
      if (p.indexOf("【要入力】") === 0) frag.appendChild(el("span", { class: "todo" }, [document.createTextNode(p)]));
      else frag.appendChild(document.createTextNode(p));
    });
    return frag;
  }
  function put(id, s) { const n = $(id); n.textContent = ""; n.appendChild(txt(s)); }

  const safeUrl = (u) => (/^(https?:\/\/|mailto:|tel:)/.test(u || "") ? u : "");
  function link(url, label, cls) {
    const u = safeUrl(url);
    if (!u) return null;
    const a = el("a", { href: u, class: cls || "" }, [label]);
    if (/^https?:/.test(u)) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }
  function rows(listId, items) {
    const dl = $(listId);
    items.forEach((r) => {
      if (r.v == null || r.v === "") return;
      dl.appendChild(el("div", { class: "row" }, [el("dt", {}, [r.k]), el("dd", {}, [r.v instanceof Node ? r.v : String(r.v)])]));
    });
  }

  // 上部・ヒーロー
  document.title = S.name + (S.draft ? "（準備中）" : "");
  $("draft-banner").hidden = !S.draft;
  $("brand-org").textContent = S.org;
  put("hero-org", S.orgFull);
  put("hero-theme", S.theme);
  put("hero-dates", S.dates);
  put("hero-venue", S.venue);
  put("foot-name", S.name);

  // お知らせ
  S.news.forEach((n) => {
    const t = link(n.url, n.title) || el("span", {}, [n.title]);
    $("news-list").appendChild(el("div", { class: "news-item" }, [
      el("div", { class: "news-date" }, [n.date]),
      el("div", { class: "news-title" }, [t]),
      n.body ? el("p", { class: "news-body" }, [n.body]) : null
    ]));
  });

  // 開催概要
  rows("overview-list", S.overview);

  // プログラム
  S.program.forEach((d) => {
    const ul = el("ul", { class: "day-list" });
    d.items.forEach((it) => {
      const meta = [it.place, it.speaker].filter(Boolean).join("　／　");
      ul.appendChild(el("li", {}, [
        el("div", { class: "time" }, [it.time]),
        el("div", {}, [el("div", { class: "item-title" }, [it.title]), meta ? el("div", { class: "item-meta" }, [meta]) : null])
      ]));
    });
    $("program-list").appendChild(el("div", { class: "day" }, [
      el("div", { class: "day-head" }, [el("b", {}, [d.label]), el("span", {}, [d.date])]), ul
    ]));
  });

  // アーカイブ
  const A = S.archive;
  put("archive-note", A.note);
  const links = $("archive-links");
  const pl = /^[\w-]+$/.test(A.playlistId || "") ? A.playlistId : "";
  if (pl) {
    const b = el("button", { type: "button", class: "chip", "aria-pressed": "false" }, ["再生リストで通して見る"]);
    b.addEventListener("click", () => openPlayer("https://www.youtube-nocookie.com/embed/videoseries?list=" + pl + "&rel=0", "再生リスト"));
    links.appendChild(b);
  }
  const ch = link(A.channelUrl, "YouTube チャンネルを開く");
  if (ch) links.appendChild(ch);
  if (!links.childNodes.length) links.hidden = true;

  const days = [];
  A.videos.forEach((v) => { if (v.day && days.indexOf(v.day) < 0) days.push(v.day); });
  let activeDay = "";
  function renderChips() {
    const box = $("archive-chips");
    box.textContent = "";
    if (days.length < 2) { box.hidden = true; return; }
    [""].concat(days).forEach((d) => {
      const c = el("button", { type: "button", class: "chip", "aria-pressed": String(d === activeDay) }, [d || "すべて"]);
      c.addEventListener("click", () => { activeDay = d; renderChips(); renderGrid(); });
      box.appendChild(c);
    });
  }
  function renderGrid() {
    const g = $("archive-grid");
    g.textContent = "";
    const list = A.videos.filter((v) => !activeDay || v.day === activeDay);
    if (!list.length) { g.appendChild(el("p", { class: "empty" }, ["アーカイブは準備中です。"])); return; }
    list.forEach((v) => {
      const ok = /^[\w-]{11}$/.test(v.id || "");
      const body = el("div", { class: "vbody" }, [
        v.day ? el("div", { class: "vday" }, [v.day]) : null,
        el("div", { class: "vtitle" }, [v.title]),
        v.speaker ? el("div", { class: "vspeaker" }, [v.speaker]) : null
      ]);
      if (!ok) {
        g.appendChild(el("div", { class: "vcard" }, [el("div", { class: "thumb" }, ["公開準備中"]), body]));
        return;
      }
      const img = el("img", { src: "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg", alt: "", loading: "lazy" });
      const card = el("button", { type: "button", class: "vcard", "aria-label": "再生：" + v.title }, [
        el("div", { class: "thumb" }, [img, el("span", { class: "play" })]), body
      ]);
      card.addEventListener("click", () => openPlayer("https://www.youtube-nocookie.com/embed/" + v.id + "?rel=0&autoplay=1", v.title));
      g.appendChild(card);
    });
  }
  renderChips();
  renderGrid();

  // 動画プレーヤー（閉じたら再生を止める）
  const dlg = $("player"), frame = $("player-frame");
  function openPlayer(src, title) {
    $("player-title").textContent = title;
    frame.src = src;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function closePlayer() { frame.src = "about:blank"; if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
  $("player-close").addEventListener("click", closePlayer);
  dlg.addEventListener("close", () => { frame.src = "about:blank"; });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closePlayer(); });

  // アクセス
  const X = S.access, ab = $("access-body");
  ab.appendChild(el("div", { class: "panel" }, [
    el("p", {}, [el("b", {}, [X.venue])]),
    el("p", {}, [X.address]),
    X.directions && X.directions.length ? el("ul", { class: "access-list" }, X.directions.map((d) => el("li", {}, [d]))) : null,
    link(X.mapUrl, "地図を開く", "btn solid")
  ]));
  if ((X.mapEmbed || "").indexOf("https://www.google.com/maps/embed") === 0) {
    ab.appendChild(el("iframe", { class: "map", src: X.mapEmbed, title: "会場の地図", loading: "lazy", referrerpolicy: "no-referrer-when-downgrade" }));
  }

  // 参加申込
  const P = S.apply, pb = $("apply-body");
  pb.appendChild(el("p", {}, [el("b", {}, ["申込締切　"]), P.deadline]));
  pb.appendChild(el("p", {}, [el("b", {}, ["参加費　"]), P.fee]));
  if (P.note) pb.appendChild(el("p", {}, [P.note]));
  const form = link(P.formUrl, "申込フォームへ", "btn solid");
  if (form) pb.appendChild(form);
  else pb.appendChild(el("a", { class: "btn solid", href: "#apply", "aria-disabled": "true" }, ["申込フォーム（準備中）"]));

  // お問い合わせ
  const C = S.contact;
  rows("contact-list", [
    { k: "事務局", v: C.office },
    { k: "メール", v: link(C.email ? "mailto:" + C.email : "", C.email) },
    { k: "電話", v: link(C.tel ? "tel:" + C.tel : "", C.tel) },
    { k: "備考", v: C.note }
  ]);
})();
