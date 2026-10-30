/* 公開側：エディターで公開した中身（お知らせ・大会概要・プログラム）を、サイトの決まった場所に流し込む。
   - 公開していない項目（まだ一度も「公開する」を押していない）や、読み込みに失敗したときは、元のHTMLをそのまま残す。
   - 文字は textContent で入れる（HTML としては解釈しない）。リンクは http / https だけ。
   使い方（サイト側）：
     <ul class="news" data-content="news"> …元の項目… </ul>
     <dl class="spec" data-content="overview"> … </dl>
     <ol class="days" data-content="program"> … </ol>
     <script src="…/config.js"></script><script src="…/schema.js"></script><script src="…/site-content.js"></script>
     <script>SiteContent.apply(window.CONF_EDITOR_CONFIG);</script> */
(function (root) {
  "use strict";
  var S = root.ConfSchema || (typeof require === "function" ? require("./schema.js") : null);
  var TBD = "【調整中】";

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) {
      if (c == null || c === "") return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  // 「【調整中】」は札（<span class="tbd">調整中</span>）にする
  function withTbd(text) {
    var frag = document.createDocumentFragment();
    String(text).split(TBD).forEach(function (part, i) {
      if (i > 0) frag.appendChild(el("span", { "class": "tbd" }, ["調整中"]));
      if (part) frag.appendChild(document.createTextNode(part));
    });
    return frag;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  // 編集画面のプレビュー用：空の行も「（…を書いてください）」と薄く出す（opts.keepBlank）。公開側では、空の行は出さない。
  function ph(text) { return el("span", { "class": "ce-ph" }, [text]); }
  function keep(opts) { return !!(opts && opts.keepBlank); }

  // どの行も、元の並びの番号を data-i に持つ（編集画面で「いま編集している行」を光らせるため）
  function renderNews(target, items, opts) {
    clear(target);
    items.forEach(function (n, i) {
      var time = el("time", n.date ? { datetime: n.date } : {}, [S.jpDate(n.date)]);
      var p = el("p", {}, []);
      if (n.text) p.appendChild(n.url ? el("a", { href: n.url, target: "_blank", rel: "noopener" }, [n.text]) : withTbd(n.text));
      else if (keep(opts)) p.appendChild(ph("（本文を書いてください。公開すると、この行は出ません）"));
      var li = el("li", { "data-i": String(i) }, [time, p]);
      if (!n.text) li.className = "ce-blank";
      target.appendChild(li);
    });
  }
  function renderOverview(target, rows, opts) {
    clear(target);
    rows.forEach(function (r, i) {
      var dt = el("dt", {}, []), dd = el("dd", {}, []);
      if (r.k) dt.appendChild(document.createTextNode(r.k)); else if (keep(opts)) dt.appendChild(ph("（項目名）"));
      if (r.v) dd.appendChild(withTbd(r.v)); else if (keep(opts)) dd.appendChild(ph("（内容を書いてください）"));
      var row = el("div", { "data-i": String(i) }, [dt, dd]);
      if (!r.k || !r.v) row.className = "ce-blank";
      target.appendChild(row);
    });
  }
  function renderProgram(target, days, opts) {
    clear(target);
    days.forEach(function (d, i) {
      var ul = el("ul", {}, []);
      d.items.forEach(function (it, j) {
        var li = el("li", { "data-j": String(j) }, it.time ? [el("span", {}, [it.time])] : []);
        if (it.text) li.appendChild(withTbd(it.text)); else if (keep(opts)) li.appendChild(ph("（内容を書いてください）"));
        if (!it.text) li.className = "ce-blank";
        ul.appendChild(li);
      });
      var h3 = el("h3", {}, []);
      if (d.label) h3.appendChild(document.createTextNode(d.label)); else if (keep(opts)) h3.appendChild(ph("（日の見出し）"));
      var day = el("li", { "class": d.label ? "day" : "day ce-blank", "data-i": String(i) }, [h3, d.sub ? el("p", { "class": "sub" }, [d.sub]) : null, ul]);
      target.appendChild(day);
    });
  }
  var RENDER = { news: renderNews, overview: renderOverview, program: renderProgram };

  // content: { news?: [...], overview?: [...], program?: [...] } を targets の各要素に描く。描いた key の一覧を返す。
  // opts.keepBlank: 空の行も（薄く）出す（編集画面のプレビュー用）。
  function render(content, targets, opts) {
    var done = [];
    S.KEYS.forEach(function (key) {
      if (!content || !Array.isArray(content[key]) || !targets || !targets[key]) return;
      RENDER[key](targets[key], S.normalize(key, content[key], !keep(opts)), opts);
      done.push(key);
    });
    return done;
  }

  // 公開済みの中身を取ってくる。一度も公開していない key は含めない。
  function load(cfg) {
    cfg = cfg || {};
    if (cfg.BACKEND === "supabase") {
      var base = String(cfg.SUPABASE_URL || "").replace(/\/+$/, "");
      var headers = { apikey: cfg.SUPABASE_ANON_KEY };
      // 新形式の公開キー（sb_publishable_…）は JWT ではないので、Authorization には入れない
      if (String(cfg.SUPABASE_ANON_KEY).split(".").length === 3) headers.Authorization = "Bearer " + cfg.SUPABASE_ANON_KEY;
      return fetch(base + "/rest/v1/conf_content?select=key,published,published_at", { headers: headers }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      }).then(function (rows) {
        var out = {};
        (Array.isArray(rows) ? rows : []).forEach(function (r) {
          if (r && r.published_at && S.KEYS.indexOf(r.key) >= 0) out[r.key] = r.published;
        });
        return out;
      });
    }
    return new Promise(function (resolve) {
      var out = {};
      try {
        var all = JSON.parse(root.localStorage.getItem(S.LOCAL_KEY) || "{}");
        S.KEYS.forEach(function (key) { if (all[key] && all[key].published_at) out[key] = all[key].published; });
      } catch (e) { /* 読めなければ空 */ }
      resolve(out);
    });
  }

  // 読み込んで流し込む。失敗しても元のHTMLが残るだけ。描いた key の一覧で解決する。
  function apply(cfg, targets) {
    if (!targets) {
      targets = {};
      S.KEYS.forEach(function (key) { targets[key] = document.querySelector('[data-content="' + key + '"]'); });
    }
    return load(cfg).then(function (content) { return render(content, targets); }).catch(function () { return []; });
  }

  var api = { render: render, load: load, apply: apply, renderNews: renderNews, renderOverview: renderOverview, renderProgram: renderProgram };
  root.SiteContent = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
