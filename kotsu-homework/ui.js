// ui.js — 小さな部品：トースト・ダイアログ（モーダル）・確認
import { esc } from "./util.js";

let toastTimer = 0;
export function toast(msg, ms = 2800) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "k-toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

// モーダル：{title, html, foot:[{label, kind, value}], onClose} → {el, close(value), done: Promise}
export function modal({ title, html = "", foot = [], wide = false, sheet = false }) {
  const prevFocus = document.activeElement;
  const bg = document.createElement("div");
  bg.className = "k-modal-bg" + (sheet ? " sheet" : "");
  bg.innerHTML = `<div class="k-modal${wide ? " wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="k-modal-head"><h2>${esc(title)}</h2><button class="k-x" type="button" aria-label="とじる" data-m-close>×</button></div>
    <div class="k-modal-body">${html}</div>
    ${foot.length ? `<div class="k-modal-foot">${foot.map((b, i) => `<button type="button" class="k-btn ${esc(b.kind || "")}" data-m-btn="${i}">${esc(b.label)}</button>`).join("")}</div>` : ""}
  </div>`;
  document.body.appendChild(bg);
  document.body.classList.add("modal-open");
  let resolve; const done = new Promise((r) => { resolve = r; });
  let closed = false;
  const close = (value = null) => {
    if (closed) return; closed = true;
    document.removeEventListener("keydown", onKey, true);
    bg.remove();
    if (!document.querySelector(".k-modal-bg")) document.body.classList.remove("modal-open");
    try { prevFocus && prevFocus.focus && prevFocus.focus(); } catch { /* 無視 */ }
    resolve(value);
  };
  const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(null); } };
  document.addEventListener("keydown", onKey, true);
  bg.addEventListener("mousedown", (e) => { if (e.target === bg) close(null); });
  bg.addEventListener("click", (e) => {
    const t = e.target.closest("[data-m-close],[data-m-btn]");
    if (!t) return;
    if (t.hasAttribute("data-m-close")) close(null);
    else { const b = foot[Number(t.dataset.mBtn)]; close(b && "value" in b ? b.value : true); }
  });
  const first = bg.querySelector("[data-m-btn]:last-child, .k-x");
  if (first) first.focus();
  return { el: bg, body: bg.querySelector(".k-modal-body"), close, done };
}

export async function confirmDialog({ title, html, ok = "OK", cancel = "やめる", danger = false }) {
  const m = modal({ title, html, foot: [{ label: cancel, kind: "ghost", value: false }, { label: ok, kind: danger ? "danger-solid" : "", value: true }] });
  return (await m.done) === true;
}
