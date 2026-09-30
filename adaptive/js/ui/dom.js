// ============================================================
// dom.js — DOM を作る小道具と、「文章＋$TeX$」の表示
// ============================================================
import { parseMarkup } from "../core/markup.js";

/**
 * 要素を作る。  h("div", { class: "card", onclick: fn }, "文字", 子要素, [配列も可])
 *  ・class / dataset / style(文字列 or オブジェクト) / on～(イベント) / aria-* / 真偽属性を扱う
 *  ・html: "<svg…>" は innerHTML に入れる（図の表示用。テンプレ由来の自作文字列だけを渡すこと）
 */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs && typeof attrs === "object" && !(attrs instanceof Node) && !Array.isArray(attrs)) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "dataset") Object.assign(el.dataset, v);
      else if (k === "style") {
        if (typeof v === "string") el.setAttribute("style", v);
        else
          for (const [prop, val] of Object.entries(v)) {
            // CSS 変数（--xxx）は setProperty でないと設定できない
            if (prop.startsWith("--")) el.style.setProperty(prop, String(val));
            else el.style[prop] = val;
          }
      } else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, String(v));
    }
  } else if (attrs !== undefined && attrs !== null) {
    children.unshift(attrs);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/** 中身を入れかえる */
export function mount(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

/** TeX を HTML に。KaTeX が読み込めていなければ、TeX のまま表示する */
export function texHtml(tex, display = false) {
  const k = globalThis.katex;
  if (!k) return escapeHtml(tex);
  try {
    return k.renderToString(tex, { throwOnError: false, strict: "ignore", displayMode: display, output: "htmlAndMathml" });
  } catch {
    return escapeHtml(tex);
  }
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/**
 * 「文章＋$TeX$」を DocumentFragment にする。改行(\n)は <br>。
 * 壊れた文字列（$ の不一致）でも画面が崩れないよう、そのまま文字として出す。
 */
export function markup(str) {
  const frag = document.createDocumentFragment();
  let parts;
  try {
    parts = parseMarkup(str ?? "");
  } catch {
    frag.append(document.createTextNode(String(str ?? "")));
    return frag;
  }
  for (const p of parts) {
    if (p.math) {
      const span = document.createElement("span");
      span.className = "m";
      span.innerHTML = texHtml(p.s);
      frag.append(span);
    } else {
      p.s.split("\n").forEach((line, i) => {
        if (i > 0) frag.append(document.createElement("br"));
        if (line) frag.append(document.createTextNode(line));
      });
    }
  }
  return frag;
}

/** markup を包んだ要素 */
export function mk(str, tag = "span", cls = "") {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  el.append(markup(str));
  return el;
}

/** ボタン */
export function button(label, onclick, cls = "btn", extra = {}) {
  return h("button", { type: "button", class: cls, onclick, ...extra }, label);
}

/** 日時の表示 */
export function fmtDate(t) {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** ファイルとしてダウンロード */
export function download(filename, text, type = "application/json") {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** クリップボードにコピー（失敗したら false） */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h("textarea", { style: "position:fixed;opacity:0" });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}
