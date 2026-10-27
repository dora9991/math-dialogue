/* data/archive.js の一覧を「アーカイブ配信」に流し込む。基本的に触らなくてよい。 */
(function () {
  "use strict";
  const A = window.ARCHIVE || { videos: [] };
  const $ = (id) => document.getElementById(id);

  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
    (kids || []).forEach((c) => { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  const safeUrl = (u) => (/^https?:\/\//.test(u || "") ? u : "");

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

  // 再生リスト・チャンネル
  const links = $("archive-links");
  const pl = /^[\w-]+$/.test(A.playlistId || "") ? A.playlistId : "";
  if (pl) {
    const b = el("button", { type: "button", class: "fchip" }, ["再生リストで通して見る"]);
    b.addEventListener("click", () => openPlayer("https://www.youtube-nocookie.com/embed/videoseries?list=" + pl + "&rel=0", "再生リスト"));
    links.appendChild(el("li", {}, [b]));
  }
  const ch = safeUrl(A.channelUrl);
  if (ch) links.appendChild(el("li", {}, [el("a", { href: ch, target: "_blank", rel: "noopener" }, ["YouTube チャンネルを開く"])]));
  links.hidden = !links.childNodes.length;

  // 一覧
  const videos = (A.videos || []).filter((v) => /^[\w-]{11}$/.test(v.id || ""));
  $("archive-empty").hidden = videos.length > 0;
  if (!videos.length) return;

  const groups = [];
  videos.forEach((v) => { if (v.group && groups.indexOf(v.group) < 0) groups.push(v.group); });
  let active = "";

  function renderChips() {
    const box = $("archive-chips");
    box.textContent = "";
    box.hidden = groups.length < 2;
    if (box.hidden) return;
    [""].concat(groups).forEach((g) => {
      const c = el("button", { type: "button", class: "fchip", "aria-pressed": String(g === active) }, [g || "すべて"]);
      c.addEventListener("click", () => { active = g; renderChips(); renderGrid(); });
      box.appendChild(c);
    });
  }
  function renderGrid() {
    const grid = $("archive-grid");
    grid.textContent = "";
    videos.filter((v) => !active || v.group === active).forEach((v) => {
      const thumb = el("span", { class: "thumb" }, [
        el("img", { src: "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg", alt: "", loading: "lazy" }),
        el("span", { class: "play" })
      ]);
      const body = el("span", { class: "vbody" }, [
        v.group ? el("span", { class: "vgroup" }, [v.group]) : null,
        el("span", { class: "vtitle" }, [v.title || ""]),
        v.speaker ? el("span", { class: "vspeaker" }, [v.speaker]) : null
      ]);
      const card = el("button", { type: "button", class: "vcard", "aria-label": "再生：" + (v.title || "") }, [thumb, body]);
      card.addEventListener("click", () => openPlayer("https://www.youtube-nocookie.com/embed/" + v.id + "?rel=0&autoplay=1", v.title || ""));
      grid.appendChild(card);
    });
  }
  renderChips();
  renderGrid();
})();
