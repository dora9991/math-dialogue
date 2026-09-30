/* 授業ライブ — 数式の入力欄
   ・入力すると「読み取り」に分数や累乗をきれいに表示（打ちまちがいにその場で気づける）
   ・答えの種類に合わせた記号キー（− / π ≦ など）
   ・タブレット（指で操作）では数字パッドを出す。「ABC」でふつうのキーボードに切りかえ */
(function (root) {
  "use strict";
  const LM = root.LM, UI = root.UI;

  const KEYS = {
    num: ["−", "/", "π", "."],
    lin: ["x", "y", "a", "b", "n", "−", "+", "/", "(", ")", "²", "π"],
    expr: ["x", "y", "a", "b", "n", "−", "+", "/", "(", ")", "²"],
    form: ["a", "b", "x", "y", "×", "÷", "/", "(", ")", "−", "+", "²", "³"],
    rel: ["x", "y", "a", "b", "=", "<", ">", "≦", "≧", "−", "+", "/", "(", ")"],
    ineq: ["x", "<", ">", "≦", "≧", "−", "/"],
    coord: ["(", ",", ")", "−", "/"],
    list: [",", "−", "/", "."],
    set: [",", "−", "/", "."],
    factor: ["×", "²", "³", "^"],
    text: [],
  };
  const INSERT = { "−": "-", "²": "^2", "³": "^3" };
  const PH = {
    num: "答えの数", lin: "式", expr: "式", form: "式", rel: "例: 3a+2b=500", ineq: "例: -2<x≦5",
    coord: "例: (3, -2)", list: "例: -2, 0, 1", set: "例: 3, -3", factor: "例: 2^2×3", text: "ことばで",
  };

  let active = null;         // いま入力中の欄
  const PAD_KEYS = ["7", "8", "9", "⌫", "←", "→", "4", "5", "6", "−", "/", ".", "1", "2", "3", "(", ")", ",", "0", "ABC", "とじる"];
  let padNative = false;     // 「ABC」でふつうのキーボードにしたか

  function insertAt(input, txt) {
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s;
    input.value = input.value.slice(0, s) + txt + input.value.slice(e);
    const p = s + txt.length;
    try { input.setSelectionRange(p, p); } catch (err) { /* なにもしない */ }
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function backspace(input) {
    let s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s;
    if (s === e) { if (!s) return; s--; }
    input.value = input.value.slice(0, s) + input.value.slice(e);
    try { input.setSelectionRange(s, s); } catch (err) { /* なにもしない */ }
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function move(input, d) {
    const p = Math.max(0, Math.min(input.value.length, (input.selectionStart ?? input.value.length) + d));
    try { input.setSelectionRange(p, p); } catch (err) { /* なにもしない */ }
  }

  /* opts: { mode, value, ph, unit, label, onInput(value), onEnter() } */
  function create(opts) {
    const mode = opts.mode || "num";
    const coarse = UI.isCoarse() && mode !== "text";
    // 指で操作する端末では、数字パッドにあるキーは記号キーの列から省く
    const keyList = (KEYS[mode] || []).filter(k => !(coarse && PAD_KEYS.includes(k)));
    const el = document.createElement("div");
    el.className = "mf";
    const id = "mf" + Math.random().toString(36).slice(2, 8);
    el.innerHTML = `
      <div class="box">
        <input class="in" id="${id}" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
          enterkeyhint="next" ${coarse ? 'inputmode="none"' : ""} aria-label="${UI.esc(opts.label || "答え")}" placeholder="${UI.esc(opts.ph || PH[mode] || "")}" maxlength="80">
        ${opts.unit ? `<span class="u">${UI.esc(opts.unit)}</span>` : ""}
      </div>
      ${mode === "text" ? "" : `<div class="pv" aria-live="polite"></div>`}
      ${keyList.length ? `<div class="keys" hidden>${keyList.map(k => `<button type="button" tabindex="-1" data-k="${UI.esc(k)}">${UI.esc(k)}</button>`).join("")}</div>` : ""}
      ${coarse ? `<div class="pad" hidden>
        ${PAD_KEYS
          .map(k => `<button type="button" tabindex="-1" data-p="${k}" class="${/[0-9]/.test(k) ? "" : k === "とじる" ? "ok" : "fn"}" ${k === "0" ? 'style="grid-column: span 2"' : ""} ${k === "とじる" ? 'style="grid-column: span 2"' : ""}>${k}</button>`).join("")}
      </div>` : ""}`;
    const input = el.querySelector("input");
    const pv = el.querySelector(".pv");
    const keys = el.querySelector(".keys");
    const pad = el.querySelector(".pad");
    input.value = opts.value == null ? "" : String(opts.value);

    function refresh() {
      if (!pv) return;
      const r = LM.preview(input.value, mode);
      if (!input.value.trim()) { pv.innerHTML = ""; pv.classList.remove("err"); return; }
      if (r.err) { pv.classList.add("err"); pv.textContent = "⚠ " + r.err; }
      else { pv.classList.remove("err"); pv.innerHTML = `<span class="lbl">読み取り</span>${r.html}`; }
    }
    function activate() {
      if (active && active !== api) active.deactivate();
      active = api;
      if (keys) keys.hidden = false;
      if (pad && !padNative) {
        pad.hidden = false;
        document.body.classList.add("padopen");
        setTimeout(() => { try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { /* なにもしない */ } }, 60);
      }
    }
    function deactivate() {
      if (keys) keys.hidden = true;
      if (pad) pad.hidden = true;
      document.body.classList.remove("padopen");
    }
    input.addEventListener("focus", activate);
    // ほかの場所をタップしたらパッドを閉じる（パッドのボタンはフォーカスを奪わない）
    input.addEventListener("blur", () => setTimeout(() => {
      if (active === api && !el.contains(document.activeElement) && pad && !pad.hidden) deactivate();
    }, 200));
    input.addEventListener("input", () => { refresh(); if (opts.onInput) opts.onInput(input.value); });
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); if (opts.onEnter) opts.onEnter(); }
    });
    const keep = e => e.preventDefault(); // ボタンを押しても入力欄のフォーカスを外さない
    if (keys) {
      keys.addEventListener("pointerdown", keep);
      keys.addEventListener("click", e => {
        const b = e.target.closest("[data-k]"); if (!b) return;
        const k = b.dataset.k;
        insertAt(input, INSERT[k] || k);
        if (!coarse) input.focus();
      });
    }
    if (pad) {
      pad.addEventListener("pointerdown", keep);
      pad.addEventListener("click", e => {
        const b = e.target.closest("[data-p]"); if (!b) return;
        const k = b.dataset.p;
        if (k === "⌫") backspace(input);
        else if (k === "←") move(input, -1);
        else if (k === "→") move(input, 1);
        else if (k === "ABC") { padNative = true; input.removeAttribute("inputmode"); pad.hidden = true; document.body.classList.remove("padopen"); input.blur(); setTimeout(() => input.focus(), 50); }
        else if (k === "とじる") { deactivate(); input.blur(); }
        else insertAt(input, INSERT[k] || k);
      });
    }
    refresh();
    const api = {
      el, input, deactivate,
      focus() { input.focus(); },
      get value() { return input.value; },
      set value(v) { input.value = v; refresh(); },
    };
    return api;
  }

  root.MI = { create, KEYS };
})(window);
