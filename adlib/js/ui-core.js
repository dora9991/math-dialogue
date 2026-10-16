/* アドリブ・ラボ：画面まわりの小道具（DOM の組み立て・保存・通知・ダウンロード）。 */
(function () {
  'use strict';
  const AL = (window.AL = window.AL || {});
  const U = (AL.U = AL.U || {});

  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // h('div', {class:'a', onclick: fn}, '文字', h('b', null, '太字'), [配列もOK])
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(x => append(el, x)); return; }
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  U.h = function h(tag, attrs) {
    const el = document.createElement(tag);
    let i = 2;
    if (attrs && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) { i = 1; attrs = null; }
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'data') { for (const d in v) el.dataset[d] = v[d]; }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    for (; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  };
  U.clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  U.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  U.debounce = (fn, ms) => { let t = null; const f = function () { const a = arguments, self = this; clearTimeout(t); t = setTimeout(() => fn.apply(self, a), ms); }; f.flush = () => { clearTimeout(t); }; return f; };

  /* ---- 保存（localStorage。使えない環境でも落ちない） ---- */
  const PREFIX = 'adlib.';
  U.store = {
    get(key, def) {
      try { const s = window.localStorage.getItem(PREFIX + key); return s == null ? def : JSON.parse(s); } catch (e) { return def; }
    },
    set(key, val) { try { window.localStorage.setItem(PREFIX + key, JSON.stringify(val)); return true; } catch (e) { return false; } },
    remove(key) { try { window.localStorage.removeItem(PREFIX + key); } catch (e) { /* 何もしない */ } },
  };

  /* ---- 小さな通知 ---- */
  let toastTimer = null;
  U.toast = function (msg, ms) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg; el.hidden = false; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.hidden = true; }, 250); }, ms || 2600);
  };

  /* ---- ファイルとして保存 ---- */
  U.download = function (filename, data, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  };
  U.safeName = s => String(s || 'adlib').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'adlib';

  /* ---- 部品：分割ボタン・スライダー・スイッチ ---- */
  // seg([[value,label],…], value, onchange)
  U.seg = function (items, value, onchange, label) {
    const root = U.h('div', { class: 'seg', role: 'group', 'aria-label': label || null });
    const btns = items.map(([v, l, title]) => U.h('button', { type: 'button', class: 'seg-b', 'aria-pressed': String(v === value), title: title || null, data: { v: String(v) }, onclick: () => { set(v); onchange(v); } }, l));
    btns.forEach(b => root.appendChild(b));
    function set(v) { btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v)))); }
    root.set = set;
    return root;
  };
  U.switchEl = function (label, on, onchange, title) {
    const input = U.h('input', { type: 'checkbox', class: 'sw-in', checked: on ? true : null, onchange: () => onchange(input.checked) });
    const el = U.h('label', { class: 'sw', title: title || null }, input, U.h('span', { class: 'sw-track' }, U.h('span', { class: 'sw-dot' })), U.h('span', { class: 'sw-label' }, label));
    el.input = input;
    return el;
  };
  U.field = function (label, control, hint) {
    return U.h('div', { class: 'field' }, U.h('label', { class: 'f-label' }, label), control, hint ? U.h('p', { class: 'f-hint' }, hint) : null);
  };
  U.select = function (options, value, onchange, attrs) {
    const sel = U.h('select', Object.assign({ onchange: () => onchange(sel.value) }, attrs || {}));
    const add = (parent, [v, l]) => { const o = U.h('option', { value: v }, l); if (String(v) === String(value)) o.selected = true; parent.appendChild(o); };
    options.forEach(o => {
      if (o.group) { const g = U.h('optgroup', { label: o.group }); o.items.forEach(it => add(g, it)); sel.appendChild(g); } else add(sel, o);
    });
    return sel;
  };

  /* ---- コード記号を HTML に（B♭ m7♭5 /E） ---- */
  U.chordHtml = function (chord, src) {
    const T = AL.T;
    if (!chord || chord.nc) return U.h('span', { class: 'cs nc' }, chord && chord.bad ? src || '?' : 'N.C.');
    const p = T.chordParts(chord);
    const el = U.h('span', { class: 'cs' });
    const m = /^([A-G])(.*)$/.exec(p.root);
    el.appendChild(U.h('span', { class: 'r' }, m[1]));
    if (m[2]) el.appendChild(U.h('span', { class: 'a' }, m[2]));
    if (p.suffix) el.appendChild(U.h('sup', { class: 'q' }, p.suffix));
    if (p.bass) el.appendChild(U.h('span', { class: 'sl' }, '/' + p.bass));
    return el;
  };

  U.tonePlain = { t: 'トニック', sd: 'サブドミナント', d: 'ドミナント', x: 'そのほか' };

  /* ---- リックの特徴タグ：データでは短い英語のキーで持ち、画面では日本語で出す（絞りこみ・検索はキーのまま） ---- */
  U.tagJp = {
    arp: 'アルペジオ', scale: 'スケール', alt: 'オルタード', rhythm: 'リズム', waltz: 'ワルツ', lydian: 'リディアン', dim: 'ディミニッシュ',
    sixteenth: '16分音符', triplet: '3連符', syncopation: 'シンコペーション', pent: 'ペンタ', bebop: 'ビバップ', blues: 'ブルース',
    upper: 'アッパー・ストラクチャー', chromatic: '半音階', modern: 'モダン', digital: 'デジタル・パターン', enclosure: 'エンクロージャー',
    guide: 'ガイドトーン', quartal: '4度堆積'
  };
  U.tagName = t => U.tagJp[t] || t;
})();
