/* 指導案メーカー：画面づくりの小道具（要素づくり・ダイアログ・メニュー・お知らせ・並べかえ） */
(function () {
  const SD = window.SD;
  const UI = SD.ui = {};

  // h('div', {class:'x', onClick:fn}, 子...)
  const h = UI.h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    if (props) {
      for (const k of Object.keys(props)) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'style') el.setAttribute('style', v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'value' || k === 'checked' || k === 'selected' || k === 'disabled' || k === 'indeterminate') el[k] = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  };
  UI.icon = (id, cls = '') => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', `ic ${cls}`);
    s.setAttribute('aria-hidden', 'true');
    const u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', `#i-${id}`);
    s.append(u);
    return s;
  };
  UI.btn = (label, onClick, o = {}) => h('button', { type: 'button', class: `btn ${o.cls || ''}`, onClick, title: o.title || null, disabled: o.disabled, 'aria-label': o.aria || null }, o.icon ? UI.icon(o.icon) : null, label ? h('span', null, label) : null);

  // 文字数に合わせて高さをのばす
  UI.autosize = (ta) => {
    if (!ta || !ta.isConnected) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(ta.scrollHeight + 2, 34)}px`;
  };
  UI.autosizeAll = (root) => requestAnimationFrame(() => root.querySelectorAll('textarea').forEach(UI.autosize));

  // ───────── お知らせ ─────────
  let toastTimer;
  UI.toast = (msg, o = {}) => {
    const t = document.getElementById('toast');
    t.innerHTML = '';
    t.append(h('span', null, msg));
    if (o.action) t.append(h('button', { type: 'button', class: 'toast-act', onClick: () => { o.action.onClick(); t.classList.remove('show'); } }, o.action.label));
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), o.ms || (o.action ? 6000 : 2600));
  };

  // ───────── ダイアログ ─────────
  const stack = [];
  UI.modal = (o) => {
    const root = document.getElementById('modalRoot');
    const box = h('div', { class: `modal ${o.cls || ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title || '' });
    const close = (why) => {
      wrap.remove();
      const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
      document.removeEventListener('keydown', onKey, true);
      if (o.onClose) o.onClose(why);
      if (api.prevFocus && api.prevFocus.isConnected) api.prevFocus.focus({ preventScroll: true });
    };
    const onKey = (e) => { if (e.key === 'Escape' && stack[stack.length - 1] === api) { e.preventDefault(); e.stopPropagation(); close('esc'); } };
    const head = h('div', { class: 'modal-h' }, h('h2', null, o.title || ''), o.sub ? h('div', { class: 'modal-sub' }, o.sub) : null, h('button', { type: 'button', class: 'iconbtn modal-x', 'aria-label': '閉じる', onClick: () => close('x') }, UI.icon('x')));
    const body = h('div', { class: 'modal-b' }, o.body);
    box.append(head, body);
    if (o.actions && o.actions.length) {
      box.append(h('div', { class: 'modal-f' }, o.footLeft || h('span'), h('div', { class: 'modal-acts' }, o.actions.map((a) => {
        const b = UI.btn(a.label, () => { if (a.onClick && a.onClick(api) === false) return; if (!a.keep) close('act'); }, { cls: a.cls || (a.primary ? 'primary' : ''), icon: a.icon, disabled: a.disabled });
        if (a.id) b.id = a.id;
        return b;
      }))));
    }
    const wrap = h('div', { class: 'modal-wrap' }, h('div', { class: 'scrim', onClick: () => { if (!o.sticky) close('scrim'); } }), box);
    root.append(wrap);
    const api = { close, box, body, prevFocus: document.activeElement };
    stack.push(api);
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => { const f = box.querySelector('[autofocus]') || box.querySelector('.modal-f .btn.primary'); if (f) f.focus({ preventScroll: true }); }, 30);
    return api;
  };
  UI.confirm = (title, msg, o = {}) => new Promise((res) => {
    UI.modal({
      title, cls: 'sm', body: h('p', { class: 'confirm-msg' }, msg),
      actions: [{ label: o.cancel || 'やめる', onClick: () => res(false) }, { label: o.ok || 'OK', primary: !o.danger, cls: o.danger ? 'danger' : 'primary', onClick: () => res(true) }],
      onClose: (why) => { if (why !== 'act') res(false); },
    });
  });
  // 3択など
  UI.choose = (title, msg, choices) => new Promise((res) => {
    UI.modal({
      title, cls: 'sm', body: h('p', { class: 'confirm-msg' }, msg),
      actions: choices.map((c) => ({ label: c.label, cls: c.cls || '', primary: c.primary, onClick: () => res(c.value) })),
      onClose: (why) => { if (why !== 'act') res(null); },
    });
  });
  UI.prompt = (title, value, o = {}) => new Promise((res) => {
    const inp = o.multiline ? h('textarea', { class: 'inp', rows: 4, value, autofocus: true }) : h('input', { class: 'inp', value, autofocus: true });
    const m = UI.modal({
      title, cls: 'sm', body: h('div', null, o.msg ? h('p', { class: 'confirm-msg' }, o.msg) : null, inp),
      actions: [{ label: 'やめる', onClick: () => res(null) }, { label: o.ok || 'OK', primary: true, onClick: () => res(inp.value) }],
      onClose: (why) => { if (why !== 'act') res(null); },
    });
    if (!o.multiline) inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); res(inp.value); m.close('act'); } });
    setTimeout(() => { inp.focus(); inp.select(); }, 40);
  });

  // ───────── メニュー ─────────
  let openMenu = null;
  UI.closeMenu = () => { if (openMenu) { openMenu.remove(); openMenu = null; } };
  UI.menu = (anchor, items, o = {}) => {
    UI.closeMenu();
    const m = h('div', { class: `menu ${o.cls || ''}`, role: 'menu' });
    for (const it of items) {
      if (!it) continue;
      if (it.sep) { m.append(h('div', { class: 'menu-sep' })); continue; }
      if (it.head) { m.append(h('div', { class: 'menu-head' }, it.head)); continue; }
      m.append(h('button', {
        type: 'button', role: 'menuitem', class: `menu-item ${it.danger ? 'danger' : ''} ${it.on ? 'on' : ''}`, disabled: it.disabled,
        onClick: (e) => { e.stopPropagation(); UI.closeMenu(); it.onClick && it.onClick(); },
      }, it.icon ? UI.icon(it.icon) : h('span', { class: 'ic-sp' }), h('span', { class: 'menu-l' }, it.label, it.sub ? h('small', null, it.sub) : null), it.key ? h('kbd', null, it.key) : null));
    }
    document.body.append(m);
    const r = anchor.getBoundingClientRect();
    const mw = m.offsetWidth; const mh = m.offsetHeight;
    let left = o.alignRight ? r.right - mw : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
    let top = r.bottom + 4;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    Object.assign(m.style, { left: `${left}px`, top: `${top}px` });
    openMenu = m;
    setTimeout(() => {
      const off = (e) => { if (!m.contains(e.target)) { UI.closeMenu(); document.removeEventListener('pointerdown', off, true); } };
      document.addEventListener('pointerdown', off, true);
    }, 0);
    const first = m.querySelector('.menu-item:not([disabled])');
    if (first) first.focus({ preventScroll: true });
    m.addEventListener('keydown', (e) => {
      const its = [...m.querySelectorAll('.menu-item:not([disabled])')];
      const i = its.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); its[(i + 1) % its.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); its[(i - 1 + its.length) % its.length].focus(); }
      if (e.key === 'Escape') { e.preventDefault(); UI.closeMenu(); anchor.focus(); }
    });
    return m;
  };

  // ───────── 並べかえ（マウスでもタッチでも）─────────
  // list: 並ぶ要素の親、itemSel: 並ぶ要素、handleSel: つかむ所、onMove(from, to)
  UI.sortable = (list, itemSel, handleSel, onMove) => {
    list.addEventListener('pointerdown', (e) => {
      const handle = e.target.closest(handleSel);
      if (!handle || !list.contains(handle) || e.button > 0) return;
      const item = handle.closest(itemSel);
      if (!item) return;
      e.preventDefault();
      const items = () => [...list.querySelectorAll(`:scope > ${itemSel}`)].length ? [...list.querySelectorAll(`:scope > ${itemSel}`)] : [...list.querySelectorAll(itemSel)];
      const all = items();
      const from = all.indexOf(item);
      const line = h('div', { class: 'drop-line' });
      document.body.append(line);
      item.classList.add('dragging');
      let to = from;
      const move = (ev) => {
        const y = ev.clientY;
        const els = items();
        let idx = els.length;
        for (let i = 0; i < els.length; i += 1) {
          const r = els[i].getBoundingClientRect();
          if (y < r.top + r.height / 2) { idx = i; break; }
        }
        to = idx;
        const ref = els[Math.min(idx, els.length - 1)].getBoundingClientRect();
        const lr = list.getBoundingClientRect();
        const ly = idx >= els.length ? ref.bottom : ref.top;
        Object.assign(line.style, { left: `${lr.left}px`, width: `${lr.width}px`, top: `${ly - 1}px`, display: 'block' });
        // 端まで来たらスクロール
        const sc = list.closest('.scroll-y');
        if (sc) { const sr = sc.getBoundingClientRect(); if (y < sr.top + 40) sc.scrollTop -= 12; else if (y > sr.bottom - 40) sc.scrollTop += 12; }
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        line.remove();
        item.classList.remove('dragging');
        let t = to > from ? to - 1 : to;
        if (t !== from && t >= 0) onMove(from, t);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    });
  };

  // ───────── ファイル・コピー ─────────
  UI.download = (blob, name) => {
    const a = h('a', { href: URL.createObjectURL(blob), download: name });
    document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  UI.copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = h('textarea', { style: 'position:fixed;left:-9999px;top:0' }); ta.value = text; document.body.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove(); return ok;
    }
  };
  UI.copyHtml = async (html, text) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
      return true;
    } catch (e) {
      const div = h('div', { contenteditable: 'true', style: 'position:fixed;left:-9999px;top:0', html });
      document.body.append(div);
      const r = document.createRange(); r.selectNodeContents(div);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      sel.removeAllRanges(); div.remove(); return ok;
    }
  };
  UI.pickFile = (accept) => new Promise((res) => {
    const inp = h('input', { type: 'file', accept, style: 'display:none' });
    inp.addEventListener('change', () => { res(inp.files[0] || null); inp.remove(); });
    document.body.append(inp); inp.click();
  });
  UI.safeName = (s) => String(s || '指導案').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80);
})();
