/* 大会運営キット — 共通の土台（公開サイトも管理画面もこれを使う）
   ・保存     T.db / T.ev() / T.save() … いまはブラウザの中（localStorage）。PDF は IndexedDB（T.files）
              サーバー（Googleスプレッドシート・Supabase など）に切りかえるときは、下の「保存先」だけを差しかえる
   ・画面     T.page(場所, id, {title, render, mount, acts, forms}) と、#/… のハッシュで切りかえる
   ・部品     T.html（字を自動でエスケープする書き方）/ T.toast / T.modal / T.confirm / T.editRecord / T.icon
   ・道具     T.qrSvg / T.csv / T.download / T.merge（{{氏名}} の差しこみ）/ T.fee（参加費）/ T.ytId
   画面の書き方は README.md の「画面を足す・直すときの約束」を参照。 */
(function () {
  'use strict';

  const T = (window.T = window.T || {});

  /* ───────── 小物 ───────── */
  T.uid = (p) => (p ? p + '_' : '') + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 7);
  T.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  T.clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  T.sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);
  T.debounce = (fn, ms = 250) => { let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  T.yen = (n) => (Number.isFinite(+n) ? '¥' + Math.round(+n).toLocaleString('ja-JP') : '—');
  T.num = (n) => (Number.isFinite(+n) ? (+n).toLocaleString('ja-JP') : '—');
  T.pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
  T.by = (k, dir = 1) => (a, b) => { const x = typeof k === 'function' ? k(a) : a[k], y = typeof k === 'function' ? k(b) : b[k]; return (x > y ? 1 : x < y ? -1 : 0) * dir; };
  T.groupCount = (arr, f) => { const m = new Map(); for (const x of arr) { const ks = [].concat(f(x)); for (const k of ks) if (k !== undefined && k !== null && k !== '') m.set(k, (m.get(k) || 0) + 1); } return m; };

  // 字を自動でエスケープするテンプレート。配列はつなげる。T.raw() で包んだものはそのまま
  class Raw { constructor(s) { this.s = String(s); } toString() { return this.s; } }
  T.raw = (s) => new Raw(s == null ? '' : s);
  const out = (v) => (v == null || v === false ? '' : v instanceof Raw ? v.s : Array.isArray(v) ? v.map(out).join('') : T.esc(v));
  T.html = (strs, ...vals) => {
    let s = strs[0];
    for (let i = 0; i < vals.length; i++) s += out(vals[i]) + strs[i + 1];
    return new Raw(s);
  };
  // 改行と **太字** と URL だけを生かした文章
  T.text = (s) => T.raw(T.esc(s || '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>'));

  /* ───────── 日付 ───────── */
  const DOW = ['日', '月', '火', '水', '木', '金', '土'];
  const toDate = (v) => (v instanceof Date ? v : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T00:00:00') : new Date(v));
  const pad = (n) => String(n).padStart(2, '0');
  T.today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  T.now = () => new Date().toISOString();
  T.ymd = (v) => { const d = toDate(v); return isNaN(d) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  T.dow = (v) => DOW[toDate(v).getDay()];
  // 2027年8月5日（木）
  T.dateJa = (v, o = {}) => { const d = toDate(v); if (isNaN(d)) return ''; return (o.year === false ? '' : d.getFullYear() + '年') + (d.getMonth() + 1) + '月' + d.getDate() + '日' + (o.dow === false ? '' : '（' + DOW[d.getDay()] + '）'); };
  // 8/5（木）
  T.md = (v) => { const d = toDate(v); return isNaN(d) ? '' : `${d.getMonth() + 1}/${d.getDate()}（${DOW[d.getDay()]}）`; };
  // 2026.10.20
  T.dot = (v) => { const d = toDate(v); return isNaN(d) ? '' : `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
  T.dt = (v) => { const d = toDate(v); return isNaN(d) ? '' : `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  T.time = (v) => { const d = toDate(v); return isNaN(d) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  T.daysUntil = (v) => Math.ceil((toDate(v) - toDate(T.today())) / 86400000);
  T.ago = (v) => {
    const s = (Date.now() - toDate(v)) / 1000;
    if (s < 60) return 'いま';
    if (s < 3600) return Math.floor(s / 60) + '分前';
    if (s < 86400) return Math.floor(s / 3600) + '時間前';
    if (s < 86400 * 7) return Math.floor(s / 86400) + '日前';
    return T.md(v);
  };
  T.isNew = (v, days = 7) => (Date.now() - toDate(v)) / 86400000 <= days;

  /* ───────── 保存先 ─────────
     いまは「このブラウザの中」。開いた人ごとに別々（同じ端末・同じブラウザなら、公開サイトと管理画面で同じデータ）。
     本番でみんなの申込を1か所に集めるには、ここを サーバー（スプレッドシート・Supabase など）に差しかえる。 */
  const KEY = 'taikai.v1';
  const local = {
    load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } },
    save(db) { try { localStorage.setItem(KEY, JSON.stringify(db)); return true; } catch (e) { return false; } },
    clear() { try { localStorage.removeItem(KEY); } catch (e) { /* なにもしない */ } },
  };
  T.store = local;

  T.db = null;
  T.load = () => {
    T.db = T.store.load();
    if (!T.db || !T.db.events || !Object.keys(T.db.events).length) {
      T.db = T.sample ? T.sample() : { v: 1, current: null, events: {} };
      T.db.fresh = true;
    }
    for (const ev of Object.values(T.db.events)) T.fill(ev);
    if (!T.db.events[T.db.current]) T.db.current = Object.keys(T.db.events)[0] || null;
    return T.db;
  };
  // 古いデータに足りない項目をおぎなう（項目を足したときに、前のデータでも動くように）
  T.fill = (ev) => {
    const lists = ['news', 'faq', 'docs', 'videos', 'surveys', 'templates', 'mails', 'threads', 'board', 'tasks', 'staff', 'sections', 'people', 'log'];
    for (const k of lists) if (!Array.isArray(ev[k])) ev[k] = [];
    ev.info = Object.assign({ no: '', name: '新しい大会', venues: [], hosts: [], links: [], color: 'ai', pin: '1234' }, ev.info || {});
    ev.program = ev.program || { days: [] };
    ev.form = ev.form || { fields: [] };
    ev.booklet = ev.booklet || { greetings: [], notes: '' };
    ev.seq = ev.seq || ev.people.length;
    return ev;
  };
  let saveTimer = 0;
  T.save = (now) => {
    clearTimeout(saveTimer);
    const run = () => { delete T.db.fresh; if (!T.store.save(T.db)) T.toast('保存できませんでした（ブラウザの保存場所がいっぱいかもしれません）', 'bad'); };
    if (now) run(); else saveTimer = setTimeout(run, 150);
  };
  // いま開いている大会
  T.ev = () => T.db.events[T.db.current];
  T.find = (list, id) => (list || []).find((x) => x.id === id);
  T.removeFrom = (list, id) => { const i = list.findIndex((x) => x.id === id); if (i >= 0) list.splice(i, 1); return i >= 0; };
  // 変更の記録（だれが・いつ・何を）。ダッシュボードの「最近のうごき」に出る
  T.logIt = (text, who = '運営') => { const ev = T.ev(); ev.log.unshift({ at: T.now(), text, who }); if (ev.log.length > 300) ev.log.length = 300; };

  // ほかのタブで保存されたら読みなおす（公開サイトで申し込む → 管理画面にすぐ出る）
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    const scroll = window.scrollY;
    T.load();
    T.render({ keepScroll: true, scroll });
  });

  /* ───────── PDF などのファイル（IndexedDB） ───────── */
  const FDB = 'taikai-files';
  let dbp = null;
  const idb = () => dbp || (dbp = new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('IndexedDB が使えません'));
    const r = indexedDB.open(FDB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const memFiles = new Map(); // IndexedDB が使えないときの逃げ道（ページを閉じると消える）
  T.files = {
    async put(key, blob) {
      try { const d = await idb(); await new Promise((res, rej) => { const tx = d.transaction('files', 'readwrite'); tx.objectStore('files').put(blob, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
      catch (e) { memFiles.set(key, blob); }
    },
    async get(key) {
      if (memFiles.has(key)) return memFiles.get(key);
      try { const d = await idb(); return await new Promise((res, rej) => { const r = d.transaction('files').objectStore('files').get(key); r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error); }); }
      catch (e) { return null; }
    },
    async del(key) {
      memFiles.delete(key);
      try { const d = await idb(); await new Promise((res) => { const tx = d.transaction('files', 'readwrite'); tx.objectStore('files').delete(key); tx.oncomplete = res; tx.onerror = res; }); } catch (e) { /* なにもしない */ }
    },
    async clear() {
      memFiles.clear();
      try { const d = await idb(); await new Promise((res) => { const tx = d.transaction('files', 'readwrite'); tx.objectStore('files').clear(); tx.oncomplete = res; tx.onerror = res; }); } catch (e) { /* なにもしない */ }
    },
  };
  T.fileKey = (evId, docId) => evId + '/' + docId;
  T.b64ToBlob = (b64, type) => { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type }); };
  T.blobToB64 = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.readAsDataURL(blob); });
  T.size = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
  // PDF を新しいタブで開く（ブラウザの PDF ビューア）
  T.openFile = async (evId, doc) => {
    const blob = await T.files.get(T.fileKey(evId, doc.id));
    if (!blob) return T.toast('このブラウザにはファイルがありません（別の端末で入れたファイルは、サーバーにつなぐまで見えません）', 'bad');
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) T.download(doc.fileName || doc.title + '.pdf', blob);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  /* ───────── 参加者・申込フォーム ───────── */
  // 申込フォームの項目のうち、システムが使うもの（消せない。ラベルは直せる）
  T.CORE = ['name', 'kana', 'email', 'org', 'pref', 'kind', 'bu'];
  T.pv = (p, k) => (p && p.a ? p.a[k] : undefined);
  T.pname = (p) => (p && p.a && p.a.name) || '（名前なし）';
  // 選んだ答えの参加費を足す（選択肢に fee があるものだけ）
  T.fee = (p, ev = T.ev()) => {
    let total = 0;
    for (const f of ev.form.fields) {
      if (!f.options) continue;
      const v = p.a ? p.a[f.id] : undefined;
      const picked = Array.isArray(v) ? v : v != null && v !== '' ? [v] : [];
      for (const o of f.options) if (picked.includes(o.v) && o.fee) total += Number(o.fee) || 0;
    }
    return total;
  };
  T.feeLines = (a, ev = T.ev()) => {
    const lines = [];
    for (const f of ev.form.fields) {
      if (!f.options) continue;
      const v = a[f.id];
      const picked = Array.isArray(v) ? v : v != null && v !== '' ? [v] : [];
      for (const o of f.options) if (picked.includes(o.v) && o.fee) lines.push({ label: (f.short || f.label) + '：' + o.v, fee: Number(o.fee) || 0 });
    }
    return lines;
  };
  T.answerText = (f, v) => (Array.isArray(v) ? v.join('、') : v === true ? 'はい' : v == null ? '' : String(v));
  T.newCode = (ev) => { ev.seq = (ev.seq || 0) + 1; return (ev.info.codePrefix || 'A') + '-' + String(ev.seq).padStart(4, '0'); };
  T.newToken = () => { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const r = crypto.getRandomValues(new Uint8Array(6)); for (const x of r) s += c[x % c.length]; return s; };
  // 受付で読むQRの中身。TAIKAI:受付番号:合言葉
  T.qrText = (p) => `TAIKAI:${p.code}:${p.token}`;
  T.parseQr = (s) => {
    s = String(s || '').trim();
    let m = s.match(/TAIKAI:([A-Z0-9-]+):([A-Z0-9]+)/i);
    if (m) return { code: m[1].toUpperCase(), token: m[2].toUpperCase() };
    m = s.match(/[?&]c=([A-Z0-9-]+).*?[?&]t=([A-Z0-9]+)/i);
    if (m) return { code: m[1].toUpperCase(), token: m[2].toUpperCase() };
    m = s.match(/^([A-Z]{1,4}-\d{3,5})$/i);
    if (m) return { code: m[1].toUpperCase(), token: null };
    return null;
  };
  T.paid = (p, ev) => p.paid || T.fee(p, ev) === 0;
  T.active = (ev = T.ev()) => ev.people.filter((p) => p.status !== 'cancel');

  /* ───────── {{氏名}} の差しこみ ───────── */
  T.VARS = [
    ['氏名', '申込者の名前'], ['所属', '学校・所属'], ['受付番号', 'A-0001 など'], ['参加区分', '会員・一般など'], ['部会', '参加する部会'],
    ['参加費', '¥4,000 など'], ['入金状況', '入金済み／未入金'], ['マイページ', 'マイページの入り方'], ['大会名', '第◯回 …大会'], ['会期', '開催日'],
    ['会場', '主な会場'], ['申込締切', '申込の締切日'], ['事務局', '問い合わせ先'], ['サイト', '公開サイトのURL'],
  ];
  T.eventTitle = (ev = T.ev()) => (ev.info.no ? `第${ev.info.no}回 ` : '') + (ev.info.name || '');
  T.period = (ev = T.ev()) => {
    const i = ev.info;
    if (!i.start) return '';
    if (!i.end || i.end === i.start) return T.dateJa(i.start);
    const a = new Date(i.start + 'T00:00:00'), b = new Date(i.end + 'T00:00:00');
    return T.dateJa(i.start) + '〜' + (a.getFullYear() === b.getFullYear() ? T.dateJa(i.end, { year: false }) : T.dateJa(i.end));
  };
  T.siteUrl = (ev = T.ev()) => ev.info.siteUrl || (location.href.split('#')[0]);
  T.mypageUrl = (p, ev = T.ev()) => T.siteUrl(ev) + `#/mypage?c=${encodeURIComponent(p.code)}&t=${encodeURIComponent(p.token)}`;
  T.vars = (p, ev = T.ev()) => {
    const i = ev.info;
    const v = {
      大会名: T.eventTitle(ev), 会期: T.period(ev), 会場: (i.venues[0] && i.venues[0].name) || '',
      申込締切: i.applyClose ? T.dateJa(i.applyClose) : '', 事務局: [i.office && i.office.name, i.office && i.office.email, i.office && i.office.tel].filter(Boolean).join('　'),
      サイト: T.siteUrl(ev),
    };
    if (p) Object.assign(v, {
      氏名: T.pname(p), 所属: T.pv(p, 'org') || '', 受付番号: p.code, 参加区分: T.pv(p, 'kind') || '', 部会: T.pv(p, 'bu') || '',
      参加費: T.yen(T.fee(p, ev)), 入金状況: T.fee(p, ev) === 0 ? 'お支払いはありません' : p.paid ? '入金済み' : '未入金',
      マイページ: `${T.mypageUrl(p, ev)}\n（受付番号 ${p.code} と、申込のメールアドレスでも入れます）`,
    });
    return v;
  };
  T.merge = (tpl, vars) => String(tpl || '').replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (m, k) => (vars[k] != null ? vars[k] : m));

  /* ───────── YouTube ───────── */
  T.ytId = (url) => {
    const s = String(url || '').trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    const m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/|v\/))([\w-]{11})/);
    return m ? m[1] : null;
  };
  T.ytEmbed = (id) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  T.ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  /* ───────── QR コード（vendor/qrcode.js を使い、SVG で描く） ───────── */
  T.qrSvg = (text, o = {}) => {
    if (!window.qrcode) return '<span class="muted">QR の部品が読み込まれていません</span>';
    if (window.qrcode.stringToBytesFuncs && window.qrcode.stringToBytesFuncs['UTF-8']) window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];
    const q = window.qrcode(0, o.level || 'M');
    q.addData(String(text || ' '), 'Byte');
    q.make();
    const n = q.getModuleCount(), m = o.margin == null ? 3 : o.margin, size = n + m * 2;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg class="qr" viewBox="0 0 ${size} ${size}" role="img" aria-label="${T.esc(o.label || 'QRコード')}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  };

  /* ───────── 書き出し ───────── */
  T.download = (name, data, type) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  // Excel で文字化けしないよう、先頭に BOM をつける
  T.csv = (rows) => '﻿' + rows.map((r) => r.map((c) => { const s = c == null ? '' : String(c); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n');
  T.parseCsv = (text) => {
    text = String(text).replace(/^﻿/, '');
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c !== ''));
  };
  T.copy = async (text, msg = 'コピーしました') => {
    try { await navigator.clipboard.writeText(text); T.toast(msg); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); T.toast(msg); } catch (e2) { T.toast('コピーできませんでした', 'bad'); }
      ta.remove();
    }
  };
  T.readFile = (file, as = 'text') => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; if (as === 'text') r.readAsText(file); else if (as === 'url') r.readAsDataURL(file); else r.readAsArrayBuffer(file); });
  T.pickFile = (accept) => new Promise((res) => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept || ''; i.onchange = () => res(i.files[0] || null); i.click(); });

  /* ───────── アイコン（線の絵。24×24） ───────── */
  const IC = {
    home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    megaphone: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    form: 'M9 3h6v3H9zM8 4.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-2M8.5 11h7M8.5 14.5h7M8.5 18h4',
    scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10',
    qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2M16 16h2v2',
    mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3.5 6.5 12 13l8.5-6.5',
    template: 'M4 4h16v5H4zM4 13h7v7H4zM15 13h5M15 17h5',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12zM8.5 10.5h7M8.5 13.5h4',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.4-2.5 2.4M12 16.5h.01',
    file: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    video: 'M3 6h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM16 10l6-3.5v11L16 14',
    calendar: 'M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 10h18M8 3v4M16 3v4',
    book: 'M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20M8 7h8',
    board: 'M4 4h5v16H4zM10 4h5v10h-5zM16 4h4v7h-4z',
    database: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3',
    external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    plus: 'M12 5v14M5 12h14',
    trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3',
    edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4',
    download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
    upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
    print: 'M7 9V3h10v6M7 18H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z',
    check: 'M5 12.5l4.5 4.5L19 7',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
    x: 'M6 6l12 12M18 6 6 18',
    menu: 'M4 7h16M4 12h16M4 17h16',
    bell: 'M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9zM10 20.5a2 2 0 0 0 4 0',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    pushpin: 'M9 3h6M10 3v6l-3 4h10l-3-4V3M12 13v8',
    send: 'M21 3 10 14M21 3l-6.5 18-3.5-7-7-3.5z',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    back: 'M19 12H5M11 6l-6 6 6 6',
    lock: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4',
    user: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
    star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z',
    list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
    yen: 'M6 4l6 8 6-8M12 12v8M7.5 13h9M7.5 16.5h9',
    swap: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
    play: 'M7 4.5v15l12-7.5z',
    flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
    spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
    camera: 'M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    tag: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01',
  };
  T.icon = (name, cls = '') => T.raw(`<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[name] || IC.spark}"/></svg>`);

  /* ───────── 知らせ・確認・入力の窓 ───────── */
  let toastBox = null;
  T.toast = (msg, kind = 'ok') => {
    if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'toasts'; toastBox.setAttribute('role', 'status'); document.body.append(toastBox); }
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = msg;
    toastBox.append(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3000);
  };
  // T.modal({title, body, wide, actions:[{label, kind, value}], onOpen(el)}) → Promise（押したボタンの value。閉じたら null）
  T.modal = (o) => new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = String(T.html`<div class="modal ${o.wide ? 'wide' : ''} ${o.cls || ''}" role="dialog" aria-modal="true" aria-label="${o.title || ''}">
      <header class="modal-head"><h2>${o.title || ''}</h2><button class="icon-btn" data-close aria-label="閉じる">${T.icon('x')}</button></header>
      <div class="modal-body">${T.raw(o.body || '')}</div>
      ${o.actions && o.actions.length ? T.html`<footer class="modal-foot">${o.actions.map((a) => T.html`<button class="btn ${a.kind || ''}" data-value="${a.value}">${a.label}</button>`)}</footer>` : ''}
    </div>`);
    const prevFocus = document.activeElement;
    const close = (v) => { wrap.classList.add('out'); setTimeout(() => wrap.remove(), 160); document.removeEventListener('keydown', onKey); if (prevFocus && prevFocus.focus) prevFocus.focus(); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target.closest('[data-close]')) return close(null);
      const b = e.target.closest('[data-value]');
      if (b && b.closest('.modal-foot')) {
        const v = b.dataset.value;
        if (o.validate && v !== 'cancel') { const ok = o.validate(v, wrap); if (ok === false) return; }
        close(v === 'cancel' ? null : v);
      }
    });
    document.addEventListener('keydown', onKey);
    document.body.append(wrap);
    wrap.closeWith = close;
    if (o.onOpen) o.onOpen(wrap);
    const first = wrap.querySelector('input,textarea,select');
    (first || wrap.querySelector('.modal-head button')).focus();
  });
  T.confirm = (msg, o = {}) => T.modal({ title: o.title || '確認', body: `<p>${T.esc(msg)}</p>`, actions: [{ label: 'やめる', value: 'cancel' }, { label: o.ok || 'はい', kind: o.danger ? 'danger' : 'primary', value: 'ok' }] }).then((v) => v === 'ok');

  /* ───────── 入力の部品 ───────── */
  // fields: [{k, label, type:text|textarea|date|time|datetime|number|url|email|select|check|color|radio, options, rows, help, placeholder, required, full}]
  T.fieldsHtml = (fields, v = {}) => T.html`<div class="fgrid">${fields.map((f) => {
    const val = v[f.k] == null ? (f.default == null ? '' : f.default) : v[f.k];
    const id = 'f_' + f.k;
    const req = f.required ? T.raw(' required') : '';
    let input;
    if (f.type === 'textarea') input = T.html`<textarea id="${id}" name="${f.k}" rows="${f.rows || 4}" placeholder="${f.placeholder || ''}"${req}>${val}</textarea>`;
    else if (f.type === 'select') input = T.html`<select id="${id}" name="${f.k}"${req}>${(f.options || []).map((o) => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return T.html`<option value="${ov}" ${String(ov) === String(val) ? T.raw('selected') : ''}>${ol}</option>`; })}</select>`;
    else if (f.type === 'check') input = T.html`<label class="check"><input type="checkbox" id="${id}" name="${f.k}" ${val ? T.raw('checked') : ''}> <span>${f.text || 'はい'}</span></label>`;
    else if (f.type === 'radio') input = T.html`<div class="radios">${(f.options || []).map((o) => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return T.html`<label class="radio"><input type="radio" name="${f.k}" value="${ov}" ${String(ov) === String(val) ? T.raw('checked') : ''}> <span>${ol}</span></label>`; })}</div>`;
    else input = T.html`<input id="${id}" name="${f.k}" type="${f.type === 'datetime' ? 'datetime-local' : f.type || 'text'}" value="${val}" placeholder="${f.placeholder || ''}"${f.step ? T.raw(` step="${f.step}"`) : ''}${req}>`;
    return T.html`<div class="field ${f.full || f.type === 'textarea' ? 'full' : ''}">${f.type === 'check' && !f.label ? '' : T.html`<label class="flabel" for="${id}">${f.label}${f.required ? T.html`<span class="req">必須</span>` : ''}</label>`}${input}${f.help ? T.html`<p class="help">${f.help}</p>` : ''}</div>`;
  })}</div>`;
  T.readFields = (root, fields) => {
    const v = {};
    for (const f of fields) {
      if (f.type === 'check') { const el = root.querySelector(`[name="${f.k}"]`); v[f.k] = !!(el && el.checked); continue; }
      if (f.type === 'radio') { const el = root.querySelector(`[name="${f.k}"]:checked`); v[f.k] = el ? el.value : ''; continue; }
      const el = root.querySelector(`[name="${f.k}"]`);
      if (!el) continue;
      v[f.k] = f.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value.trim();
    }
    return v;
  };
  // 1件を窓で直す。保存を押したら onSave(値) を呼ぶ（false を返すと閉じない）
  T.editRecord = async (o) => {
    let result = null;
    const v = await T.modal({
      title: o.title, wide: o.wide, cls: 'edit-modal',
      body: String(T.html`<form class="edit-form" onsubmit="return false">${o.lead ? T.html`<p class="lead">${o.lead}</p>` : ''}${T.fieldsHtml(o.fields, o.value || {})}${T.raw(o.extra || '')}</form>`),
      actions: [...(o.onDelete ? [{ label: '削除', kind: 'danger ghost left', value: 'delete' }] : []), { label: 'やめる', value: 'cancel' }, { label: o.saveLabel || '保存する', kind: 'primary', value: 'save' }],
      onOpen: o.onOpen,
      validate(val, el) {
        if (val !== 'save') return true;
        const form = el.querySelector('form');
        if (!form.reportValidity()) return false;
        result = T.readFields(form, o.fields);
        if (o.read) Object.assign(result, o.read(form));
        return o.check ? o.check(result, form) !== false : true;
      },
    });
    if (v === 'delete' && o.onDelete) { if (await T.confirm('削除します。元に戻せません。よろしいですか？', { danger: true, ok: '削除する' })) o.onDelete(); return null; }
    if (v === 'save' && result) { o.onSave && o.onSave(result); return result; }
    return null;
  };

  /* ───────── 画面の切りかえ ───────── */
  T.pages = { site: {}, admin: {}, print: {} };
  T.page = (where, id, def) => { def.id = id; def.where = where; T.pages[where][id] = def; return def; };
  T.route = () => {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const [path, query = ''] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = Object.fromEntries(new URLSearchParams(query));
    if (parts[0] === 'admin') return { where: 'admin', id: parts[1] || 'dash', arg: parts.slice(2).join('/'), q };
    if (parts[0] === 'print') return { where: 'print', id: parts[1] || '', arg: parts.slice(2).join('/'), q };
    return { where: 'site', id: parts[0] || 'home', arg: parts.slice(1).join('/'), q };
  };
  T.go = (path) => { const h = '#/' + String(path).replace(/^#?\/?/, ''); if (location.hash === h) T.render(); else location.hash = h; };
  T.current = null;
  T.shells = {}; // site / admin / print の外枠（それぞれのファイルが登録する）
  T.render = (o = {}) => {
    if (!T.db) T.load();
    const r = T.route();
    T.current = r;
    const shell = T.shells[r.where];
    if (!shell) return;
    shell(r, o);
    if (o.keepScroll) window.scrollTo(0, o.scroll || 0);
  };
  // 今の画面を描きなおす（スクロールの位置はそのまま）
  T.refresh = () => T.render({ keepScroll: true, scroll: window.scrollY });

  // 画面の中のボタン：data-act="名前" → いまの画面の acts[名前](el, event)
  //               フォーム：data-form="名前" → forms[名前](値, form, event)
  T.activePage = null;
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const name = el.dataset.act;
    const pg = T.activePage;
    const fn = (pg && pg.acts && pg.acts[name]) || (T.globalActs && T.globalActs[name]);
    if (!fn) return;
    e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-form]');
    if (!f) return;
    e.preventDefault();
    const pg = T.activePage;
    const fn = pg && pg.forms && pg.forms[f.dataset.form];
    if (fn) fn(Object.fromEntries(new FormData(f)), f, e);
  });
  T.globalActs = {
    go(el) { T.go(el.dataset.to); },
    copy(el) { T.copy(el.dataset.text, el.dataset.msg || 'コピーしました'); },
    print() { window.print(); },
  };
  window.addEventListener('hashchange', () => { T.render(); });

  // 色の組み合わせ（大会ごとに選べる）
  T.THEMES = {
    ai: { name: '有田藍と金', ink: '#0a1530', deep: '#13265a', primary: '#1f3f9a', accent: '#d4ad57', accent2: '#f1dca2', soft: '#e9eefb' },
    ariake: { name: '有明の海', ink: '#06232b', deep: '#0d3b47', primary: '#0f6b7a', accent: '#f0a868', accent2: '#ffd9b5', soft: '#e3f3f4' },
    balloon: { name: '夕空のバルーン', ink: '#1a1033', deep: '#2f1d5c', primary: '#5b3fb4', accent: '#ff8a4c', accent2: '#ffd2a8', soft: '#efeaff' },
    ume: { name: '梅と墨', ink: '#1b1418', deep: '#3a2430', primary: '#8c2f4c', accent: '#e7b75f', accent2: '#f6e1b0', soft: '#f8ecf0' },
    matsu: { name: '松の緑', ink: '#0c1f17', deep: '#173a2b', primary: '#226447', accent: '#d9b450', accent2: '#f2e2a8', soft: '#e7f3ec' },
  };
  T.applyTheme = (ev = T.ev()) => {
    const th = T.THEMES[(ev && ev.info.color) || 'ai'] || T.THEMES.ai;
    const s = document.documentElement.style;
    s.setProperty('--ev-ink', th.ink); s.setProperty('--ev-deep', th.deep); s.setProperty('--ev-primary', th.primary);
    s.setProperty('--ev-accent', th.accent); s.setProperty('--ev-accent2', th.accent2); s.setProperty('--ev-soft', th.soft);
  };
})();
