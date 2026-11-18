/* 大会サイトの中身（お知らせ・大会概要・プログラム）の「形」と、安全な整え方。
   エディターと公開側の両方が使う。ブラウザでも Node でも読める。

   お知らせ  news     [{ date: "2027-03-06", text: "…", url: "" }]
   大会概要  overview [{ k: "会場", v: "…" }]                         ← 「【調整中】」と書くと、画面では「調整中」の札になる
   プログラム program  [{ label: "1日目", sub: "総会と分科会", items: [{ time: "9:30", text: "受付" }] }]  */
(function (root) {
  "use strict";

  var KEYS = ["news", "overview", "program"];
  var LABELS = { news: "お知らせ", overview: "大会概要", program: "日程と流れ" };
  var LIMITS = { items: 100, days: 10, dayItems: 60, short: 120, long: 1000, url: 500 };
  var LOCAL_KEY = "conferenceEditor.v1"; // ブラウザ内保存（ローカルモード）の保存先

  // 画面に出すエラー。code: conflict | auth | forbidden | network | invalid | other
  function ConfError(code, message) {
    var e = new Error(message);
    e.name = "ConfError";
    e.code = code;
    return e;
  }

  function str(v, max) {
    return typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max) : "";
  }
  function safeUrl(v) {
    v = str(v, LIMITS.url);
    return /^https?:\/\/[^\s<>"']+$/i.test(v) ? v : "";
  }
  function isoDate(v) {
    v = str(v, 10);
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!m) return "";
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    var ok = d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
    return ok ? v : "";
  }
  function jpDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? m[1] + "年" + +m[2] + "月" + +m[3] + "日" : "";
  }

  // 保存・表示の前に、型と長さを整える。dropEmpty=true なら、空の行や項目を取り除く（公開用）。
  function normalize(key, value, dropEmpty) {
    var a = Array.isArray(value) ? value : [];
    var out;
    if (key === "news") {
      out = a.slice(0, LIMITS.items).map(function (n) {
        n = n || {};
        return { date: isoDate(n.date), text: str(n.text, LIMITS.long), url: safeUrl(n.url) };
      });
      return dropEmpty ? out.filter(function (n) { return n.text; }) : out;
    }
    if (key === "overview") {
      out = a.slice(0, LIMITS.items).map(function (r) {
        r = r || {};
        return { k: str(r.k, LIMITS.short), v: str(r.v, LIMITS.long) };
      });
      return dropEmpty ? out.filter(function (r) { return r.k && r.v; }) : out;
    }
    if (key === "program") {
      out = a.slice(0, LIMITS.days).map(function (d) {
        d = d || {};
        var items = (Array.isArray(d.items) ? d.items : []).slice(0, LIMITS.dayItems).map(function (it) {
          it = it || {};
          return { time: str(it.time, LIMITS.short), text: str(it.text, LIMITS.long) };
        });
        if (dropEmpty) items = items.filter(function (it) { return it.text; });
        return { label: str(d.label, LIMITS.short), sub: str(d.sub, LIMITS.short), items: items };
      });
      return dropEmpty ? out.filter(function (d) { return d.label; }) : out;
    }
    return [];
  }

  // 公開前の点検。error があると公開できない。warn は注意だけ。
  function validate(key, raw) {
    var a = Array.isArray(raw) ? raw : [];
    var out = [];
    function add(level, where, message) { out.push({ level: level, where: where, message: message }); }
    function blank(v) { return !str(v, 100000); }
    a.forEach(function (n, i) {
      n = n || {};
      if (key === "news") {
        var w = "お知らせ " + (i + 1) + "件目";
        if (blank(n.text)) add("error", w, "本文が空です。");
        if (blank(n.date)) add("warn", w, "日付がありません。");
        else if (!isoDate(n.date)) add("error", w, "日付の形が正しくありません。");
        if (!blank(n.url) && !safeUrl(n.url)) add("error", w, "リンクは http:// か https:// で始まるURLにしてください。");
      } else if (key === "overview") {
        var w2 = "大会概要 " + (i + 1) + "行目";
        if (blank(n.k) && !blank(n.v)) add("error", w2, "項目名が空です。");
        else if (!blank(n.k) && blank(n.v)) add("warn", w2, "「" + str(n.k, 30) + "」の内容が空です（公開されません）。");
      } else if (key === "program") {
        var w3 = "日程と流れ " + (i + 1) + "日目";
        if (blank(n.label)) add("error", w3, "日の見出し（例：1日目）が空です。");
        (Array.isArray(n.items) ? n.items : []).forEach(function (it, j) {
          if (blank((it || {}).text)) add("error", w3 + " の " + (j + 1) + "つ目", "内容が空です。");
        });
      }
    });
    return out;
  }

  function sameContent(key, a, b) {
    return JSON.stringify(normalize(key, a, true)) === JSON.stringify(normalize(key, b, true));
  }

  var api = {
    KEYS: KEYS, LABELS: LABELS, LIMITS: LIMITS, LOCAL_KEY: LOCAL_KEY,
    ConfError: ConfError, normalize: normalize, validate: validate, sameContent: sameContent,
    safeUrl: safeUrl, isoDate: isoDate, jpDate: jpDate
  };
  root.ConfSchema = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
