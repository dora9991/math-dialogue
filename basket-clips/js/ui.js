/* バスケ得点クリップ — 画面の部品（要素づくり・お知らせ・小窓・ダウンロード） */
(function (root) {
  'use strict';
  const BS = root.BS;

  /* h('div', { class: 'x', onclick: fn }, 子要素…) */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const $ = (sel, rootEl) => (rootEl || document).querySelector(sel);

  function toast(text, kind, ms) {
    const box = $('#toasts');
    if (!box) return;
    const el = h('div', { class: 'toast ' + (kind || '') }, text);
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), ms || 3200);
  }

  let modalClose = null;
  function modal(opts) {
    const m = $('#modal');
    m.innerHTML = '';
    const card = h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true' });
    const close = () => { m.hidden = true; m.innerHTML = ''; modalClose = null; if (opts.onClose) opts.onClose(); };
    card.appendChild(h('header', null, h('b', null, opts.title || ''), h('button', { class: 'x', 'aria-label': '閉じる', onclick: close }, '×')));
    const body = h('div', { class: 'modal-body' });
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    card.appendChild(body);
    if (opts.buttons && opts.buttons.length) {
      const foot = h('div', { class: 'modal-foot' });
      opts.buttons.forEach((b) => foot.appendChild(h('button', { class: 'btn ' + (b.cls || ''), onclick: () => { const r = b.onClick ? b.onClick(body) : true; if (r !== false) close(); } }, b.label)));
      card.appendChild(foot);
    }
    m.appendChild(card);
    m.hidden = false;
    m.onclick = (e) => { if (e.target === m) close(); };
    modalClose = close;
    return { close, body };
  }
  function closeModal() { if (modalClose) modalClose(); }
  function modalOpen() { const m = $('#modal'); return !!m && !m.hidden; }

  function download(name, blobOrUrl) {
    const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    const a = h('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { if (typeof blobOrUrl !== 'string') URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  BS.ui = { h, $, toast, modal, closeModal, modalOpen, download };
})(typeof window !== 'undefined' ? window : globalThis);
