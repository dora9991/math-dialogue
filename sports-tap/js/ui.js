/* スポーツ タップ記録 — 画面の部品（バスケ タップ記録と同じもの）（要素づくり・お知らせ・下から出る小窓・振動と音・保存と共有） */
(function (root) {
  'use strict';
  const ST = root.ST;

  /* h('div', { class: 'x', onclick: fn }, 子要素…) */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') { for (const p in v) { if (p.startsWith('--')) el.style.setProperty(p, v[p]); else el.style[p] = v[p]; } }
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
  const $$ = (sel, rootEl) => Array.from((rootEl || document).querySelectorAll(sel));

  /* お知らせ（画面の下に数秒）。action：{ label, onClick } でボタンを1つ付けられる */
  function toast(text, kind, ms, action) {
    const box = $('#toasts');
    if (!box) return null;
    const el = h('div', { class: 'toast ' + (kind || ''), role: 'status' }, h('span', null, text));
    if (action) el.appendChild(h('button', { class: 'tbtn', onclick: () => { el.remove(); action.onClick(); } }, action.label));
    box.appendChild(el);
    while (box.children.length > 2) box.firstChild.remove();
    setTimeout(() => el.remove(), ms || 2600);
    return el;
  }

  /* 下から出る小窓（タブレットでは真ん中）。同時に1つだけ。
     opts: { title, body（要素）, foot（要素の配列）, onClose, wide, cls } → { close, body, el } */
  let current = null;
  function sheet(opts) {
    closeSheet(true);
    const wrap = $('#sheet');
    const card = h('div', { class: 'sheet-card' + (opts.wide ? ' wide' : '') + (opts.cls ? ' ' + opts.cls : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || '' });
    const close = () => { if (current && current.card === card) closeSheet(); };
    card.appendChild(h('header', null, h('b', null, opts.title || ''), h('button', { class: 'x', 'aria-label': '閉じる', onclick: close }, '×')));
    const body = h('div', { class: 'sheet-body' });
    if (opts.body) body.appendChild(opts.body);
    card.appendChild(body);
    if (opts.foot && opts.foot.length) card.appendChild(h('div', { class: 'sheet-foot' }, opts.foot));
    wrap.innerHTML = '';
    wrap.appendChild(card);
    wrap.hidden = false;
    wrap.onclick = (e) => { if (e.target === wrap) close(); };
    current = { card, onClose: opts.onClose };
    return { close, body, el: card };
  }
  function closeSheet(silent) {
    const wrap = $('#sheet');
    if (!current || !wrap) return;
    const c = current;
    current = null;
    wrap.hidden = true; wrap.innerHTML = '';
    if (!silent && c.onClose) c.onClose();
    else if (silent && c.onClose) c.onClose(true);
  }
  const sheetOpen = () => !!current;

  /* 確かめる小窓：ok を押したら onOk */
  function confirm(title, text, okLabel, onOk, danger) {
    const s = sheet({
      title, body: h('p', { class: 'confirm-text' }, text),
      foot: [h('button', { class: 'btn', onclick: () => s.close() }, 'やめる'), h('button', { class: 'btn ' + (danger ? 'danger-fill' : 'primary'), onclick: () => { s.close(); onOk(); } }, okLabel)]
    });
    return s;
  }

  /* ---------- 手ごたえ（振動・音） ---------- */
  /* 振動：Android は vibrate。iPhone（iOS 18 から）は、スイッチ（<input type="checkbox" switch>）を押したときの軽い振動を使う */
  let coarse = null;
  function haptic() {
    try { if (root.navigator && typeof navigator.vibrate === 'function') { navigator.vibrate(12); return; } } catch (e) { /* 次へ */ }
    try {
      if (coarse == null) coarse = !!(root.matchMedia && matchMedia('(pointer: coarse)').matches);
      if (!coarse) return;
      const lab = document.createElement('label');
      lab.setAttribute('aria-hidden', 'true');
      lab.style.display = 'none';
      const inp = document.createElement('input');
      inp.type = 'checkbox'; inp.setAttribute('switch', '');
      lab.appendChild(inp);
      document.head.appendChild(lab);
      lab.click();
      lab.remove();
    } catch (e) { /* 振動がなくても使える */ }
  }
  let actx = null;
  function beep(freq, ms) {
    try {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      if (!actx) actx = new AC();
      if (actx.state === 'suspended') actx.resume();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = freq || 880;
      const t = actx.currentTime, d = (ms || 60) / 1000;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + d + 0.02);
    } catch (e) { /* 音がなくても使える */ }
  }

  /* ---------- 画面を消さない（記録の途中で、自動ロックで画面が消えないように） ---------- */
  let lock = null, want = false;
  const wakeSupported = () => !!(root.navigator && navigator.wakeLock && navigator.wakeLock.request);
  async function keepAwake(on) {
    want = !!on;
    if (!wakeSupported()) return false;
    if (on && !lock && !document.hidden) {
      try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch (e) { lock = null; }
    } else if (!on && lock) { try { await lock.release(); } catch (e) { /* 無視 */ } lock = null; }
    return !!lock;
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!document.hidden && want && !lock) keepAwake(true); });
  const awake = () => !!lock;

  /* ---------- 保存（ダウンロード）・共有 ---------- */
  function download(name, blob) {
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  }
  /* スマホでは「共有」（AirDrop・ファイルに保存・LINE など）、できなければダウンロード。戻り値 'shared' | 'downloaded' | 'cancelled' */
  async function shareOrDownload(name, blob, preferShare) {
    try {
      if (preferShare && root.navigator && navigator.canShare && typeof File !== 'undefined') {
        const file = new File([blob], name, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: name });
          return 'shared';
        }
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      /* 共有できないときはダウンロードへ */
    }
    download(name, blob);
    return 'downloaded';
  }
  const canShareFiles = () => { try { return !!(root.navigator && navigator.canShare && typeof File !== 'undefined' && navigator.canShare({ files: [new File(['x'], 'x.json', { type: 'application/json' })] })); } catch (e) { return false; } };
  /* ファイルを1つ選んでもらって、文字として読む */
  function pickText(accept) {
    return new Promise((resolve) => {
      const inp = h('input', { type: 'file', accept: accept || '.json,application/json', style: { display: 'none' } });
      inp.addEventListener('change', () => {
        const f = inp.files && inp.files[0];
        inp.remove();
        if (!f) { resolve(null); return; }
        const r = new FileReader();
        r.onload = () => resolve({ name: f.name, text: String(r.result || '') });
        r.onerror = () => resolve(null);
        r.readAsText(f);
      });
      document.body.appendChild(inp);
      inp.click();
    });
  }

  ST.ui = { h, $, $$, toast, sheet, closeSheet, sheetOpen, confirm, haptic, beep, keepAwake, awake, wakeSupported, download, shareOrDownload, canShareFiles, pickText };
})(typeof window !== 'undefined' ? window : globalThis);
