/* hibi/js/core.js
   画面を持たない計算だけ：日付、その日に出すもの（予定・リマインダー・メモ・写真・まとめ）、
   カレンダーの印、絞りこみ、ショートカットに渡す URL、接続リンクの読みとり。
   ブラウザでも Node でも動く（Node では module.exports、ブラウザでは window.HB に載る）。

   ── アプリが持つデータ（裏側の bootstrap が返す形）──────────────────────
   { rev, today, settings:{categories:[{name,hint}], rules:[], briefing:{…}, shortcuts:{sync,send,add}, appUrl},
     memos:[{id,text,title,important,dates:['YYYY-MM-DD'],category,categorySource,tags,archived,createdAt,updatedAt}],
     items:[{id,fileId,name,mime,kind:'photo'|'pdf'|'file',title,summary,text,note,category,status:'inbox'|'pending'|'organized'|'archived',
             dates:[],dateNotes:{},important,thumbFileId,createdAt}],
     proposals:[{id,kind,question,context,target:{type,itemId|id|threadId},options:[{label,patch,ios}],rule}],
     briefings:{'YYYY-MM-DD':{summary,gmail:[],ai:[],news:[],runAt}},
     ios:{syncedAt, events:[{title,d0,d1,t0,t1,allDay,cal,loc}], reminders:[{title,due,dueTime,list,prio,flag}]},
     lastRun:{at,files,memos,proposals} }
   ──────────────────────────────────────────────────────────────────── */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HB = Object.assign(root.HB || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TZ = 'Asia/Tokyo';
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  const p2 = n => String(n).padStart(2, '0');
  const isYmd = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

  /* ───── 日付 ───── */

  function partsIn(date, tz) {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz || TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const o = {};
    f.formatToParts(date).forEach(p => { o[p.type] = p.value; });
    return o;
  }
  /** その時刻の、日本時間の 'YYYY-MM-DD' */
  function ymdOf(date, tz) { const o = partsIn(date || new Date(), tz); return `${o.year}-${o.month}-${o.day}`; }
  /** その時刻の、日本時間の 'HH:MM' */
  function hmOf(date, tz) { const o = partsIn(date || new Date(), tz); return `${o.hour === '24' ? '00' : o.hour}:${o.minute}`; }
  const today = () => ymdOf(new Date());

  function toUTC(ymd) { const [y, m, d] = ymd.split('-').map(Number); return Date.UTC(y, m - 1, d); }
  function fromUTC(t) { const d = new Date(t); return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`; }
  function addDays(ymd, n) { return fromUTC(toUTC(ymd) + n * 86400000); }
  function diffDays(a, b) { return Math.round((toUTC(b) - toUTC(a)) / 86400000); }
  function weekday(ymd) { return new Date(toUTC(ymd)).getUTCDay(); }
  function addMonths(ym, n) { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}`; }

  /** '10月15日（木）' */
  function labelDay(ymd) { const [, m, d] = ymd.split('-').map(Number); return `${m}月${d}日（${WD[weekday(ymd)]}）`; }
  /** '10/15(木)' */
  function labelShort(ymd) { const [, m, d] = ymd.split('-').map(Number); return `${m}/${d}(${WD[weekday(ymd)]})`; }
  /** 今日からみた言い方：きょう・あした・きのう・あさって・3日後 … */
  function relDay(ymd, base) {
    const n = diffDays(base || today(), ymd);
    return { '-1': 'きのう', 0: 'きょう', 1: 'あした', 2: 'あさって' }[n] || (n > 0 ? `${n}日後` : `${-n}日前`);
  }
  /** ISO の時刻を「きょう 5:30」「きのう 18:02」「10/12 7:00」に */
  function labelWhen(iso, base) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const ymd = ymdOf(d), hm = hmOf(d).replace(/^0/, '');
    const n = diffDays(ymd, base || today());
    if (n === 0) return `きょう ${hm}`;
    if (n === 1) return `きのう ${hm}`;
    const [, m, dd] = ymd.split('-').map(Number);
    return `${m}/${dd} ${hm}`;
  }

  /** 日曜はじまりの月のカレンダー：[[{ymd, inMonth}, … 7日], …] */
  function monthGrid(ym) {
    const first = ym + '-01';
    const start = addDays(first, -weekday(first));
    const weeks = [];
    let d = start;
    do {
      const w = [];
      for (let i = 0; i < 7; i++) { w.push({ ymd: d, inMonth: d.slice(0, 7) === ym }); d = addDays(d, 1); }
      weeks.push(w);
    } while (d.slice(0, 7) === ym);
    return weeks;
  }

  /* ───── その日に出すもの ───── */

  const byImportantThenNew = (a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0) || String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));

  function eventsOn(st, ymd) {
    const ev = (st && st.ios && st.ios.events) || [];
    return ev.filter(e => e.d0 <= ymd && ymd <= e.d1)
      .sort((a, b) => (a.allDay === b.allDay ? 0 : a.allDay ? -1 : 1) || String(a.t0).localeCompare(String(b.t0)) || a.title.localeCompare(b.title));
  }

  /** その日のリマインダー。今日を見ているときは、期限切れもいっしょに（overdue:true） */
  function remindersFor(st, ymd, base) {
    const list = (st && st.ios && st.ios.reminders) || [];
    const t = base || today();
    return list.filter(r => r.due && (r.due === ymd || (ymd === t && r.due < t)))
      .map(r => Object.assign({}, r, { overdue: r.due < t }))
      .sort((a, b) => (b.overdue ? 1 : 0) - (a.overdue ? 1 : 0) || a.due.localeCompare(b.due) || String(a.dueTime).localeCompare(String(b.dueTime)) || (b.prio || 0) - (a.prio || 0));
  }
  function undatedReminders(st) { return ((st && st.ios && st.ios.reminders) || []).filter(r => !r.due); }

  function memosOn(st, ymd) { return ((st && st.memos) || []).filter(m => !m.archived && (m.dates || []).includes(ymd)).sort(byImportantThenNew); }
  /** 日付をつけていない重要メモ（今日の画面にピン留め） */
  function pinnedMemos(st) { return ((st && st.memos) || []).filter(m => !m.archived && m.important && !(m.dates || []).length).sort(byImportantThenNew); }
  function itemsOn(st, ymd) { return ((st && st.items) || []).filter(i => i.status !== 'archived' && (i.dates || []).includes(ymd)).sort(byImportantThenNew); }
  function briefingFor(st, ymd) { return (st && st.briefings && st.briefings[ymd]) || null; }

  /** その日の画面に出すもの全部 */
  function dayView(st, ymd, base) {
    const t = base || today();
    return {
      ymd, isToday: ymd === t,
      events: eventsOn(st, ymd),
      reminders: remindersFor(st, ymd, t),
      memos: memosOn(st, ymd),
      pinned: ymd === t ? pinnedMemos(st) : [],
      items: itemsOn(st, ymd),
      briefing: briefingFor(st, ymd),
      proposals: ymd === t ? ((st && st.proposals) || []) : []
    };
  }

  /** 月のカレンダーの印：{ 'YYYY-MM-DD': {ev, memo, item, star} } */
  function monthMarks(st, ym) {
    const marks = {};
    const mark = (ymd, k) => {
      if (!isYmd(ymd) || ymd.slice(0, 7) !== ym) return;
      const m = marks[ymd] || (marks[ymd] = { ev: 0, memo: 0, item: 0, star: false });
      if (k === 'star') m.star = true; else m[k]++;
    };
    ((st && st.ios && st.ios.events) || []).forEach(e => {
      for (let d = e.d0, i = 0; d <= e.d1 && i < 62; d = addDays(d, 1), i++) mark(d, 'ev');
    });
    ((st && st.memos) || []).forEach(m => { if (!m.archived) (m.dates || []).forEach(d => { mark(d, 'memo'); if (m.important) mark(d, 'star'); }); });
    ((st && st.items) || []).forEach(i => { if (i.status !== 'archived') (i.dates || []).forEach(d => { mark(d, 'item'); if (i.important) mark(d, 'star'); }); });
    return marks;
  }

  /* ───── 絞りこみ ───── */

  const norm = s => String(s || '').toLowerCase().normalize('NFKC');
  function matchQ(q, fields) { const n = norm(q).trim(); return !n || n.split(/\s+/).every(w => fields.some(f => norm(f).includes(w))); }

  /** メモの一覧。filter：all / star / dated / uncat（分類なし）/ cat（category で指定）/ archived */
  function filterMemos(memos, o) {
    o = o || {};
    return (memos || []).filter(m => {
      if (o.filter === 'archived') { if (!m.archived) return false; }
      else if (m.archived) return false;
      if (o.filter === 'star' && !m.important) return false;
      if (o.filter === 'dated' && !(m.dates || []).length) return false;
      if (o.filter === 'uncat' && m.category) return false;
      if (o.filter === 'cat' && m.category !== o.category) return false;
      return matchQ(o.q, [m.text, m.title, m.category, (m.tags || []).join(' ')]);
    }).sort(byImportantThenNew);
  }

  /** 資料の一覧。status：all / inbox / pending / archived / cat */
  function filterItems(items, o) {
    o = o || {};
    return (items || []).filter(i => {
      if (o.status === 'archived') { if (i.status !== 'archived') return false; }
      else if (i.status === 'archived') return false;
      if (o.status === 'inbox' && i.status !== 'inbox') return false;
      if (o.status === 'pending' && i.status !== 'pending') return false;
      if (o.status === 'cat' && i.category !== o.category) return false;
      if (o.status === 'star' && !i.important) return false;
      return matchQ(o.q, [i.title, i.name, i.summary, i.text, i.ocr, i.note, i.category, (i.tags || []).join(' ')]);
    }).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  /* ───── いろいろ ───── */

  function memoTitle(m) {
    const first = String((m && m.text) || '').split('\n').map(s => s.trim()).find(Boolean) || '';
    return (m && m.title) || first.slice(0, 40) || 'メモ';
  }
  /** メモの本文のうち、題名の行を除いた残り */
  function memoBody(m) {
    const lines = String((m && m.text) || '').split('\n');
    if (m && m.title) return lines.join('\n').trim();
    const i = lines.findIndex(s => s.trim());
    return lines.slice(i + 1).join('\n').trim();
  }

  const PALETTE = 10;
  /** 分類の色の番号（設定の並び順。なければ名前から） */
  function catIndex(name, categories) {
    if (!name) return -1;
    const i = (categories || []).findIndex(c => c.name === name);
    if (i >= 0) return i % PALETTE;
    let h = 0; for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return h % PALETTE;
  }

  /** ショートカットを動かす URL。payload は文字列か、JSON にするもの */
  function shortcutUrl(name, payload) {
    let u = 'shortcuts://run-shortcut?name=' + encodeURIComponent(name);
    if (payload != null) u += '&input=text&text=' + encodeURIComponent(typeof payload === 'string' ? payload : JSON.stringify(payload));
    return u;
  }

  /** メモから、iPhone に登録するもの（リマインダーか予定）をつくる */
  function memoToIos(m, type, ymd) {
    const day = ymd || ((m.dates || [])[0]) || '';
    const title = memoTitle(m);
    const notes = memoBody(m);
    if (type === 'event') return { type: 'event', title, start: day || today(), end: day || today(), allDay: '1', notes, location: '' };
    return { type: 'reminder', title, due: day ? day + ' 09:00' : '', notes };
  }
  /** 提案の ios（裏側の形）を、ショートカットに渡す形に（allDay は '1' / '0'） */
  function iosForShortcut(x) {
    if (!x) return null;
    if (x.type === 'event') return { type: 'event', title: x.title, start: x.start, end: x.end || x.start, allDay: x.allDay ? '1' : '0', notes: x.notes || '', location: x.location || '' };
    return { type: 'reminder', title: x.title, due: x.due || '', notes: x.notes || '' };
  }

  /** iPhone のカレンダーApp を、その日で開く URL（calshow: は 2001-01-01 からの秒） */
  function calshowUrl(ymd) { return 'calshow:' + Math.floor((toUTC(ymd) - Date.UTC(2001, 0, 1)) / 1000); }

  /** '#connect=…'（裏側の showSetupInfo が出す接続リンク）を {url, token} に */
  function parseConnect(hash) {
    const m = /[#&]connect=([A-Za-z0-9_-]+)/.exec(String(hash || ''));
    if (!m) return null;
    try {
      const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
      const bin = typeof atob === 'function' ? atob(b64 + '==='.slice((b64.length + 3) % 4)) : Buffer.from(b64, 'base64').toString('binary');
      const json = decodeURIComponent(Array.from(bin, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
      const o = JSON.parse(json);
      return o && o.u && o.t ? { url: String(o.u), token: String(o.t) } : null;
    } catch (e) { return null; }
  }

  /** 裏側の URL として正しそうか（/exec で終わる Apps Script。手元の確かめ用に localhost も） */
  function checkGasUrl(u) {
    u = String(u || '').trim();
    if (/^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[\w-]+\/exec$/.test(u)) return { ok: true, url: u };
    if (/^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[\w-]+\/dev$/.test(u)) return { ok: false, why: '/dev ではなく /exec で終わる URL を入れてください（デプロイの画面に出ます）' };
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u)) return { ok: true, url: u };
    return { ok: false, why: 'https://script.google.com/macros/s/…/exec の形の URL を入れてください' };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  /** http(s) の URL だけ通す（ほかは空） */
  function safeUrl(u) { u = String(u || '').trim(); return /^https?:\/\/[^\s<>"']+$/i.test(u) ? u : ''; }

  function uid(prefix) {
    const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    const rnd = typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(12)) : Array.from({ length: 12 }, () => Math.floor(Math.random() * 256));
    for (let i = 0; i < 12; i++) s += a[rnd[i] % a.length];
    return (prefix || '') + s;
  }

  /** 一覧の中の同じ id を置きかえる（なければ足す） */
  function upsert(list, rec) {
    const i = list.findIndex(x => x.id === rec.id);
    if (i >= 0) list[i] = rec; else list.push(rec);
    return list;
  }

  /** 提案の相手（ファイル・メモ・メール）を、表示用に */
  function proposalTarget(st, p) {
    const t = (p && p.target) || {};
    if (t.type === 'file') return { kind: 'item', item: ((st && st.items) || []).find(i => i.id === t.itemId) || null };
    if (t.type === 'memo') return { kind: 'memo', memo: ((st && st.memos) || []).find(m => m.id === t.id) || null };
    if (t.type === 'mail') return { kind: 'mail', url: safeUrl(t.url), subject: t.subject || '' };
    return { kind: 'none' };
  }

  /** 日付の一覧に足す・ぬく（YYYY-MM-DD・重複なし・昇順） */
  function withDate(dates, ymd) { return Array.from(new Set((dates || []).concat(isYmd(ymd) ? [ymd] : []))).sort(); }
  function withoutDate(dates, ymd) { return (dates || []).filter(d => d !== ymd); }

  return {
    TZ, WD, isYmd, ymdOf, hmOf, today, addDays, diffDays, weekday, addMonths, labelDay, labelShort, relDay, labelWhen, monthGrid,
    eventsOn, remindersFor, undatedReminders, memosOn, pinnedMemos, itemsOn, briefingFor, dayView, monthMarks,
    filterMemos, filterItems, memoTitle, memoBody, catIndex, shortcutUrl, memoToIos, iosForShortcut, calshowUrl,
    parseConnect, checkGasUrl, esc, safeUrl, uid, upsert, proposalTarget, withDate, withoutDate
  };
});
