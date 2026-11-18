/* 授業ライブ — 画面の小道具（エスケープ・トースト・ダイアログ・保存・QR・CSV） */
(function (root) {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // localStorage は使えない環境（プライベートモード等）でも落ちないように
  const Store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* なにもしない */ } },
    sget(k, d) { try { const v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    sset(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* なにもしない */ } },
    sdel(k) { try { sessionStorage.removeItem(k); } catch (e) { /* なにもしない */ } },
  };

  function toast(msg, kind, ms) {
    let box = $(".toasts");
    if (!box) { box = document.createElement("div"); box.className = "toasts"; box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
    const t = document.createElement("div");
    t.className = "toast" + (kind ? " " + kind : "");
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), ms || 2600);
  }

  function modal(html, opts) {
    opts = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "modal-wrap";
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(wrap);
    const prev = document.activeElement;
    const close = v => { wrap.remove(); document.removeEventListener("keydown", onKey); if (prev && prev.focus) prev.focus(); if (opts.onClose) opts.onClose(v); };
    const onKey = e => { if (e.key === "Escape" && !opts.sticky) close(); };
    document.addEventListener("keydown", onKey);
    wrap.addEventListener("click", e => { if (e.target === wrap && !opts.sticky) close(); });
    const f = wrap.querySelector("[autofocus], input, textarea, select, button");
    if (f) setTimeout(() => f.focus(), 30);
    return { el: wrap.firstElementChild, close };
  }

  function confirmBox(title, bodyHTML, okLabel, danger) {
    return new Promise(res => {
      const m = modal(`<h2>${esc(title)}</h2><div class="stack" style="margin:8px 0 16px">${bodyHTML || ""}</div>
        <div class="row end"><button class="btn ghost" data-v="0">やめる</button><button class="btn ${danger ? "bad" : "primary"}" data-v="1">${esc(okLabel || "OK")}</button></div>`,
        { onClose: v => res(!!v) });
      m.el.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) m.close(b.dataset.v === "1"); });
    });
  }

  function promptBox(title, label, value, okLabel, opts) {
    opts = opts || {};
    return new Promise(res => {
      const m = modal(`<h2>${esc(title)}</h2><label class="f">${esc(label)}</label>
        ${opts.textarea ? `<textarea class="in" id="pb" maxlength="${opts.max || 200}">${esc(value || "")}</textarea>` : `<input class="in" id="pb" maxlength="${opts.max || 200}" value="${esc(value || "")}">`}
        <div class="row end" style="margin-top:14px"><button class="btn ghost" data-v="0">やめる</button><button class="btn primary" data-v="1">${esc(okLabel || "OK")}</button></div>`,
        { onClose: v => res(v) });
      const inp = m.el.querySelector("#pb");
      inp.addEventListener("keydown", e => { if (e.key === "Enter" && !opts.textarea && !e.isComposing) m.close(inp.value); });
      m.el.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) m.close(b.dataset.v === "1" ? inp.value : null); });
    });
  }

  const pad2 = n => String(n).padStart(2, "0");
  function mmss(sec) { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${pad2(sec % 60)}`; }
  function hm(d) { d = new Date(d); return `${d.getHours()}:${pad2(d.getMinutes())}`; }
  function md(d) { d = new Date(d); return `${d.getMonth() + 1}/${d.getDate()}`; }
  function ymd(d) { d = new Date(d); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
  function ago(d, now) {
    const s = Math.round(((now || Date.now()) - new Date(d).getTime()) / 1000);
    if (s < 60) return `${Math.max(s, 0)}秒前`;
    if (s < 3600) return `${Math.floor(s / 60)}分前`;
    if (s < 86400) return `${Math.floor(s / 3600)}時間前`;
    return md(d);
  }

  // サーバー時計との差（タイマーをクラス全員でそろえる）
  const Clock = { off: 0, sync(serverNow) { if (serverNow) this.off = new Date(serverNow).getTime() - Date.now(); }, now() { return Date.now() + this.off; } };

  function qrSVG(text) {
    if (!root.qrcode) return "";
    const qr = root.qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ scalable: true, margin: 1 });
  }

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      ta.remove(); return ok;
    }
  }

  // Excel で文字化けしない CSV（BOM つき）。数式として解釈されうる先頭文字は無害化する
  function downloadCSV(name, rows) {
    const cell = v => {
      let s = String(v == null ? "" : v);
      if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = "﻿" + rows.map(r => r.map(cell).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function on(rootEl, ev, sel, fn) {
    rootEl.addEventListener(ev, e => { const t = e.target.closest(sel); if (t && rootEl.contains(t)) fn(e, t); });
  }

  // 入力のゆれをそろえる（日本語入力のままの全角英数字でもログインできるように）
  const pw = v => String(v == null ? "" : v).normalize("NFKC").trim();
  const idNorm = v => String(v == null ? "" : v).normalize("NFKC").replace(/[ー−–—―‐ｰ]/g, "-").replace(/\s+/g, "").toUpperCase();
  const isLocal = () => !!(root.API && root.API.config && root.API.config.name === "ローカル検証");

  const isCoarse = () => { try { return matchMedia("(pointer: coarse)").matches; } catch (e) { return false; } };

  root.UI = { $, $$, esc, Store, toast, modal, confirmBox, promptBox, mmss, hm, md, ymd, ago, Clock, qrSVG, copyText, downloadCSV, on, isCoarse, pw, idNorm, isLocal };
})(window);
