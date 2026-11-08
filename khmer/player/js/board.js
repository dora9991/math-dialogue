/* ノート（黒板）：図（SVG）と、書きこみ（ふりがなの付く HTML のカード・ラベル）。
   台本のステップの fig / do / note / unnote / clear を「操作」として順に当てる。
   「もどる」「つづきから」では、操作を最初から“一瞬で”当て直して、その場面を作り直す（BOARD.instant）。
   図は授業ファイルの figs:{ 名前: (F, ...引数) => ({ メソッド… }) } に書く。F が道具（下の F）。 */
(function () {
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const ease = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const f2 = v => Math.round(v * 100) / 100;
  const back = u => { const c = 1.7, c3 = c + 1; return 1 + c3 * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  let lesson = null, cur = null, instant = false;
  const active = new Set(), pending = new Set();
  let rafOn = false;
  function loop(now) {
    for (const tw of [...active]) {
      const u = Math.min(1, (now - tw.t0) / tw.dur); tw.fn(tw.ease(u));
      if (u >= 1) { active.delete(tw); tw.res(); }
    }
    if (active.size) requestAnimationFrame(loop); else rafOn = false;
  }
  function tween(dur, fn, ez) {
    if (instant || !(dur > 0)) { fn(1); return Promise.resolve(); }
    return new Promise(res => {
      active.add({ fn, res, t0: performance.now(), dur: dur * 1000, ease: ez || ease });
      if (!rafOn) { rafOn = true; requestAnimationFrame(loop); }
    });
  }
  const svg = () => $('#bsvg'), html = () => $('#bhtml');

  /* ---------- 図の道具 F ---------- */
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    (parent || F.root).appendChild(e); return e;
  }
  const F = {
    root: null,
    get instant() { return instant; },
    el, ease, back, tween,
    g: (a, p) => el('g', a, p),
    circle: (cx, cy, r, a, p) => el('circle', Object.assign({ cx, cy, r }, a), p),
    line: (x1, y1, x2, y2, a, p) => el('line', Object.assign({ x1, y1, x2, y2, 'stroke-linecap': 'round' }, a), p),
    path: (d, a, p) => el('path', Object.assign({ d, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, a), p),
    rect: (x, y, w, h, a, p) => el('rect', Object.assign({ x, y, width: w, height: h }, a), p),
    poly: (pts, a, p) => el('polygon', Object.assign({ points: pts.map(q => q.join(',')).join(' '), 'stroke-linejoin': 'round' }, a), p),
    text: (x, y, t, a, p) => { const e = el('text', Object.assign({ x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-weight': 900, 'font-family': 'Hiragino Maru Gothic ProN, Zen Maru Gothic, sans-serif' }, a), p); e.textContent = t; return e; },
    /* ふりがなの付くラベル（HTML）。opt: { cls:'s'|'l'|'xl', color, align:'left'|'right', hide:true（あとで show する）, note:true（図を替えても消えない） } */
    label(x, y, text, opt) {
      const o = opt || {}, d = document.createElement('div');
      d.className = 'lbl ' + (o.cls || '') + (o.align ? ' ' + o.align : '') + (o.note ? '' : ' figl');
      d.style.left = x + 'px'; d.style.top = y + 'px'; if (o.color) d.style.color = o.color; if (o.bg) { d.style.background = o.bg; d.style.padding = '0 10px'; d.style.borderRadius = '10px'; }
      d.dataset.raw = text; d.innerHTML = RUBY.html(text); html().appendChild(d);
      if (o.hide) d.style.opacity = 0; else if (!instant) d.classList.add('pop-in');
      return d;
    },
    setText(d, text) { d.dataset.raw = text; d.innerHTML = RUBY.html(text); },
    hideNow(e) { e.style.opacity = 0; return e; },
    /* 出す・消す（SVG 要素もラベルも） */
    show(e, how, dur) {
      if (!e) return Promise.resolve();
      if (!instant && !(e instanceof HTMLElement) && e.style) e.style.opacity = 0;   // 出す前に いちど見えない状態に（最初の1コマだけ見えてしまわないように）
      if (e instanceof HTMLElement) { e.style.opacity = 1; if (!instant) { e.classList.remove('pop-in'); void e.offsetWidth; e.classList.add('pop-in'); } return F.wait(0.3); }
      if (how === 'pop') {   // もとの transform（位置・大きさ）はそのままにして、その上で中心から ぽんと大きくする
        const bb = e.getBBox ? (() => { try { return e.getBBox(); } catch (er) { return null; } })() : null;
        const cx = bb ? bb.x + bb.width / 2 : 0, cy = bb ? bb.y + bb.height / 2 : 0, orig = e.dataset.t0 !== undefined ? e.dataset.t0 : (e.getAttribute('transform') || '');
        e.dataset.t0 = orig;
        return tween(dur || 0.45, u => { const s = back(u); e.style.opacity = Math.min(1, u * 3); if (u >= 1) { if (orig) e.setAttribute('transform', orig); else e.removeAttribute('transform'); delete e.dataset.t0; } else e.setAttribute('transform', `${orig} translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`); }, x => x);
      }
      return tween(dur || 0.4, u => { e.style.opacity = u; });
    },
    hide(e, dur) { if (!e) return Promise.resolve(); return tween(dur || 0.3, u => { e.style.opacity = 1 - u; }); },
    /* 線をかく（pathLength=1 にして、dashoffset を動かす） */
    draw(e, dur) {
      e.setAttribute('pathLength', 1); e.style.strokeDasharray = '1 1'; e.style.opacity = 1;
      return tween(dur || 0.6, u => { e.style.strokeDashoffset = 1 - u; if (u >= 1) { e.style.strokeDasharray = ''; e.style.strokeDashoffset = ''; e.removeAttribute('pathLength'); } });
    },
    wait: sec => tween(sec, () => {}, x => x),
    sfx: name => { if (!instant && window.FX) FX.sfx(name); },
    /* ---- 子どもがさわる図（ACT のステップで使う） ----
       F.interact(終わりの形にする関数) … 子どもの操作が終わるまで待つ「約束」。「つぎへ」「もどる」や検査では、終わりの形にして先へ進む。
         const it = F.interact(() => 最後の形); …操作が終わったら it.done(); await it.promise;
       F.pt(event) … 画面の点を、ノートの座標に（ノートは拡大・縮小されている）
       F.draggable(要素, { x, y, onMove(x, y), onDrop(x, y) → true なら置けた／false ならもとの場所へ }) … 要素は transform で動かす
       F.countTap(要素の配列, { done(n) }) … 1つずつタップして数える（番号のバッジが出る）。全部さわると終わる */
    interact(onFinish) {
      let res, fin = false;
      const p = new Promise(r => { res = r; });
      const tw = { fn: u => { if (u >= 1 && !fin) { fin = true; onFinish && onFinish(); } }, res: () => res(), t0: performance.now(), dur: Infinity, ease: x => 0 };
      if (instant) { tw.fn(1); res(); return { done() {}, promise: p, get over() { return true; } }; }
      active.add(tw);
      return { done() { if (fin) return; fin = true; active.delete(tw); res(); }, promise: p, get over() { return fin; } };
    },
    pt(ev) { const r = svg().getBoundingClientRect(), k = r.width / 1240; const t = ev.touches ? ev.touches[0] : ev; return [(t.clientX - r.left) / k, (t.clientY - r.top) / k]; },
    draggable(e, o) {
      let x = o.x, y = o.y, sx = 0, sy = 0, ox = 0, oy = 0, on = false, off = false;
      const place = () => e.setAttribute('transform', `translate(${f2(x)} ${f2(y)})`); place();
      e.classList.add('tapme'); e.style.touchAction = 'none';
      const down = ev => { if (off) return; ev.preventDefault(); on = true; [sx, sy] = F.pt(ev); ox = x; oy = y; e.classList.add('dragging'); try { e.setPointerCapture(ev.pointerId); } catch (er) { /* なくてよい */ } F.sfx('tap'); };
      const move = ev => { if (!on) return; const [px, py] = F.pt(ev); x = ox + px - sx; y = oy + py - sy; place(); o.onMove && o.onMove(x, y); };
      const up = () => { if (!on) return; on = false; e.classList.remove('dragging'); const ok = o.onDrop ? o.onDrop(x, y) : true; if (ok === false) { const fx = x, fy = y; tween(0.3, u => { x = fx + (o.x - fx) * u; y = fy + (o.y - fy) * u; place(); }); } };
      e.addEventListener('pointerdown', down); e.addEventListener('pointermove', move); e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up);
      return { set(nx, ny) { x = nx; y = ny; place(); }, home(nx, ny) { o.x = nx; o.y = ny; }, lock() { off = true; e.classList.remove('tapme'); }, get x() { return x; }, get y() { return y; } };
    },
    clearBadges() { html().querySelectorAll('.cntbadge').forEach(e => e.remove()); svg().querySelectorAll('[data-counted]').forEach(e => { delete e.dataset.counted; e.style.filter = ''; e.classList.add('tapme'); }); },   // 数えた印も消す（同じ絵を もう一度 数えさせられる）   // 数えた番号のバッジを ぜんぶ消す（つづけて別の数え方をするとき）
    countTap(els, o) {
      o = o || {}; let n = 0; const badges = [];
      const mark = (e) => {
        if (e.dataset.counted) return; e.dataset.counted = '1'; n++;
        const sr = svg().getBoundingClientRect(), k = sr.width / 1240, r = e.getBoundingClientRect();   // 図の中の位置（transform をふくめて）
        const d = document.createElement('div'); d.className = 'cntbadge figl'; d.textContent = n;
        d.style.left = ((r.left - sr.left) / k + r.width / k / 2) + 'px'; d.style.top = ((r.top - sr.top) / k + (o.badgeDy !== undefined ? o.badgeDy : r.height / k / 2)) + 'px'; html().appendChild(d); badges.push(d);
        e.style.filter = 'brightness(1.12) drop-shadow(0 0 6px #fff36b)'; e.classList.remove('tapme');
        if (!instant) { F.sfx('count'); e.animate([{ filter: 'brightness(1.7) drop-shadow(0 0 10px #fff36b)' }, { filter: 'brightness(1.12) drop-shadow(0 0 6px #fff36b)' }], { duration: 350 }); }
        o.onCount && o.onCount(n, e);
      };
      const it = F.interact(() => els.forEach(mark));
      els.forEach(e => { e.classList.add('tapme'); e.addEventListener('pointerdown', ev => { ev.preventDefault(); if (it.over) return; mark(e); if (n >= els.length) { F.sfx('ok'); setTimeout(() => it.done(), 500); } }); });
      return it.promise.then(() => n);
    },
    confetti: (x, y, n) => { if (!instant && window.FX) { const b = $('#board'); FX.confetti(b.offsetLeft + x, b.offsetTop + y, n || 40, 1.6); } }
  };

  /* ---------- 書きこみのカード ---------- */
  function note(n) {
    const old = n.id ? html().querySelector(`.note[data-id="${n.id}"]`) : null; if (old) old.remove();
    const d = document.createElement('div');
    d.className = 'note ' + (n.kind || 'plain'); if (n.id) d.dataset.id = n.id;
    d.style.left = n.x + 'px'; d.style.top = n.y + 'px';
    if (n.w) { d.style.width = n.w + 'px'; d.style.whiteSpace = 'normal'; }
    else if (!n.center) { d.style.maxWidth = Math.max(200, 1226 - n.x) + 'px'; d.style.whiteSpace = 'normal'; }   // 右はしを こえたら、折りかえす（切れないように）
    if (n.size) d.style.fontSize = n.size + 'px';
    if (n.color) d.style.color = n.color;
    if (n.center) { d.style.transform = 'translateX(-50%)'; d.style.textAlign = 'center'; }
    const tag = n.tag ? `<span class="tag" data-raw="${n.tag.replace(/"/g, '&quot;')}">${RUBY.html(n.tag)}</span>` : '';
    d.dataset.rawNote = n.text; d.dataset.tag = n.tag || '';
    d.innerHTML = tag + `<span class="nt">${RUBY.html(n.text)}</span>`;
    html().appendChild(d);
    if (!instant && !n.center) { d.classList.add('pop-in'); F.sfx('pop'); }
    else if (!instant) { d.animate([{ opacity: 0, transform: 'translateX(-50%) scale(.4)' }, { opacity: 1, transform: 'translateX(-50%) scale(1)' }], { duration: 400, easing: 'cubic-bezier(.3,1.6,.5,1)' }); F.sfx('pop'); }
    return d;
  }
  function unnote(id) {
    (Array.isArray(id) ? id : [id]).forEach(k => { const d = html().querySelector(`.note[data-id="${k}"]`); if (!d) return; if (instant) d.remove(); else { d.classList.add('fade-out'); setTimeout(() => d.remove(), 320); } });
  }

  /* ---------- 操作を当てる ---------- */
  function clearFig() { svg().innerHTML = ''; html().querySelectorAll('.figl').forEach(e => e.remove()); cur = null; F.root = el('g', {}, svg()); }
  function reset() { active.clear(); svg().innerHTML = ''; html().innerHTML = ''; cur = null; F.root = el('g', {}, svg()); }
  async function runOne(op) {
    if (op.clear) reset();
    if (op.clearNotes) html().querySelectorAll('.note').forEach(e => e.remove());
    if (op.fig) {
      const [name, ...args] = Array.isArray(op.fig) ? op.fig : [op.fig];
      const mk = lesson && lesson.figs && lesson.figs[name]; if (!mk) throw new Error('図がありません: ' + name);
      clearFig(); cur = mk(F, ...args) || {}; cur._name = name;
      if (cur.init) await cur.init();
    }
    if (op.unnote) unnote(op.unnote);
    if (op.note) (Array.isArray(op.note) ? op.note : [op.note]).forEach(note);
    if (op.do) {
      const list = Array.isArray(op.do) && Array.isArray(op.do[0]) ? op.do : [op.do];
      for (const d of list) {
        const [m, ...args] = Array.isArray(d) ? d : [d];
        if (!cur || typeof cur[m] !== 'function') throw new Error(`図 ${cur && cur._name} に ${m} がありません`);
        await cur[m](...args);
      }
    }
  }
  function apply(op, inst) {
    if (inst) { const was = instant; instant = true; let p; try { p = runOne(op); } finally { /* 同期で終わる部分は一瞬 */ } return p.finally(() => { instant = was; }); }
    const p = runOne(op).catch(e => { console.error(e); }); pending.add(p); p.finally(() => pending.delete(p)); return p;
  }
  /* 動いている途中の図を、最後の形まで一瞬で進める（次のステップへ進むとき） */
  async function finish() {
    if (!active.size && !pending.size) return;
    instant = true;
    for (const tw of [...active]) { tw.fn(1); active.delete(tw); tw.res(); }
    for (let k = 0; k < 20 && pending.size; k++) { await Promise.all([...pending]); for (const tw of [...active]) { tw.fn(1); active.delete(tw); tw.res(); } }
    instant = false;
  }
  /* 「もどる」などで、操作の列を一瞬で当て直す */
  async function replay(ops) {
    instant = true; reset();
    try { for (const op of ops) await runOne(op); } catch (e) { console.error(e); }
    instant = false;
  }
  /* 設定（学年・ふりがな）を変えたら、書いてある字を作り直す */
  function rerender() {
    html().querySelectorAll('.lbl[data-raw]').forEach(d => { d.innerHTML = RUBY.html(d.dataset.raw); });
    html().querySelectorAll('.note').forEach(d => {
      const tag = d.dataset.tag ? `<span class="tag">${RUBY.html(d.dataset.tag)}</span>` : '';
      d.innerHTML = tag + `<span class="nt">${RUBY.html(d.dataset.rawNote)}</span>`;
    });
  }
  window.BOARD = { setLesson(l) { lesson = l; reset(); }, apply, finish, replay, reset, rerender, F, get busy() { return active.size > 0 || pending.size > 0; }, get cur() { return cur; } };
})();
