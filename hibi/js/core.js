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

  /** 月のカレンダー：[[{ymd, inMonth}, … 7日], …]。weekStart：0 は日曜はじまり、1 は月曜はじまり */
  function monthGrid(ym, weekStart) {
    const ws = weekStart === 1 ? 1 : 0;
    const first = ym + '-01';
    const start = addDays(first, -((weekday(first) - ws + 7) % 7));
    const weeks = [];
    let d = start;
    do {
      const w = [];
      for (let i = 0; i < 7; i++) { w.push({ ymd: d, inMonth: d.slice(0, 7) === ym }); d = addDays(d, 1); }
      weeks.push(w);
    } while (d.slice(0, 7) === ym);
    return weeks;
  }

  /* ───── 日本の祝日（いまの祝日法。春分・秋分は 2099 年まで使える近似式） ───── */

  const HOLI = {};
  /** その月の n 回目の月曜 */
  function nthMonday(y, m, n) {
    const first = `${y}-${p2(m)}-01`;
    return `${y}-${p2(m)}-${p2(1 + (8 - weekday(first)) % 7 + (n - 1) * 7)}`;
  }
  /** その年の祝日：{ 'YYYY-MM-DD': '文化の日', … }（振替休日・国民の休日も入る） */
  function holidaysOf(y) {
    if (HOLI[y]) return HOLI[y];
    const h = {};
    const md = (s, name) => { h[`${y}-${s}`] = name; };
    const eq = base => Math.floor(base + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    md('01-01', '元日'); h[nthMonday(y, 1, 2)] = '成人の日';
    md('02-11', '建国記念の日'); md('02-23', '天皇誕生日'); md(`03-${p2(eq(20.8431))}`, '春分の日');
    md('04-29', '昭和の日'); md('05-03', '憲法記念日'); md('05-04', 'みどりの日'); md('05-05', 'こどもの日');
    h[nthMonday(y, 7, 3)] = '海の日'; md('08-11', '山の日');
    h[nthMonday(y, 9, 3)] = '敬老の日'; md(`09-${p2(eq(23.2488))}`, '秋分の日'); h[nthMonday(y, 10, 2)] = 'スポーツの日';
    md('11-03', '文化の日'); md('11-23', '勤労感謝の日');
    const base = Object.keys(h).sort();
    // 国民の休日：前の日と次の日が祝日にはさまれた日
    base.forEach(d => { const n1 = addDays(d, 1); if (!h[n1] && h[addDays(d, 2)] && weekday(n1) !== 0) h[n1] = '国民の休日'; });
    // 振替休日：祝日が日曜なら、そのあとの最初の祝日でない日
    base.forEach(d => { if (weekday(d) !== 0) return; let n = addDays(d, 1); while (h[n]) n = addDays(n, 1); h[n] = '振替休日'; });
    return (HOLI[y] = h);
  }
  /** 祝日の名前（祝日でなければ空） */
  function holidayName(ymd) { return isYmd(ymd) ? holidaysOf(Number(ymd.slice(0, 4)))[ymd] || '' : ''; }

  /** ISO の週番号（月曜はじまり。その週の木曜がある年で数える） */
  function isoWeek(ymd) {
    const thu = addDays(ymd, 3 - (weekday(ymd) + 6) % 7);
    return 1 + Math.floor(diffDays(thu.slice(0, 4) + '-01-01', thu) / 7);
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

  /* ───── 月のカレンダーの帯 ───── */

  /** d0〜d1 の日にかかる、カレンダーに帯で出すもの。
      { kind:'ev'|'rem'|'memo'|'item', title, d0, d1, t0, allDay, cal（色を決める名前）, important, id, sub（資料は photo/pdf/file） } */
  function calEntries(st, d0, d1) {
    const out = [];
    const ios = (st && st.ios) || {};
    (ios.events || []).forEach(e => {
      if (!isYmd(e.d0) || !(e.d0 <= d1 && (e.d1 || e.d0) >= d0)) return;
      out.push({ kind: 'ev', title: e.title || '', d0: e.d0, d1: e.d1 && e.d1 >= e.d0 ? e.d1 : e.d0, t0: e.allDay ? '' : e.t0 || '', allDay: !!e.allDay, cal: e.cal || '' });
    });
    (ios.reminders || []).forEach(r => {
      if (isYmd(r.due) && r.due >= d0 && r.due <= d1) out.push({ kind: 'rem', title: r.title || '', d0: r.due, d1: r.due, t0: r.dueTime || '', cal: r.list || '' });
    });
    ((st && st.memos) || []).forEach(m => {
      if (m.archived) return;
      (m.dates || []).forEach(d => { if (d >= d0 && d <= d1) out.push({ kind: 'memo', id: m.id, title: memoTitle(m), d0: d, d1: d, t0: '', important: !!m.important }); });
    });
    ((st && st.items) || []).forEach(i => {
      if (i.status === 'archived') return;
      (i.dates || []).forEach(d => { if (d >= d0 && d <= d1) out.push({ kind: 'item', id: i.id, sub: i.kind || 'file', title: i.title || i.name || '', d0: d, d1: d, t0: '', important: !!i.important }); });
    });
    return out;
  }

  /** 帯の並ぶ順：何日もつづく予定・終日 → 重要なメモ → 重要な資料 → 時刻のある予定とリマインダー（時刻の順）→ 時刻のないリマインダー → メモ → 資料 */
  function entryRank(e) {
    if (e.kind === 'ev') return e.allDay || e.d0 !== e.d1 ? 0 : 3;
    if (e.kind === 'rem') return e.t0 ? 3 : 4;
    if (e.kind === 'memo') return e.important ? 1 : 5;
    return e.important ? 2 : 6;
  }

  /** 1週間（7日）の帯の置き場所。maxLanes 段まで出し、入りきらない日は最後の段を「+n」にする。
      返す：{ bars:[{e, c0, c1, lane}]（c0〜c1 は 0〜6 の列）, more:[7日ぶんの、出せなかった数] } */
  function weekLayout(days, entries, maxLanes) {
    const w0 = days[0], w6 = days[6], L = Math.max(1, Math.floor(maxLanes) || 1);
    const segs = (entries || []).filter(e => e.d0 <= w6 && e.d1 >= w0)
      .map(e => ({ e, c0: e.d0 < w0 ? 0 : diffDays(w0, e.d0), c1: e.d1 > w6 ? 6 : diffDays(w0, e.d1) }));
    segs.sort((a, b) => (b.c1 - b.c0) - (a.c1 - a.c0) || entryRank(a.e) - entryRank(b.e) || a.c0 - b.c0 ||
      String(a.e.t0).localeCompare(String(b.e.t0)) || String(a.e.title).localeCompare(String(b.e.title)));
    const occ = [];
    segs.forEach(s => {
      let l = 0;
      for (;; l++) {
        if (!occ[l]) occ[l] = [false, false, false, false, false, false, false];
        let free = true;
        for (let c = s.c0; c <= s.c1; c++) if (occ[l][c]) { free = false; break; }
        if (free) break;
      }
      for (let c = s.c0; c <= s.c1; c++) occ[l][c] = true;
      s.lane = l;
    });
    // 入りきらない日（L 段目より下がある日）は、最後の段を「+n」に使う
    const over = [false, false, false, false, false, false, false];
    segs.forEach(s => { if (s.lane >= L) for (let c = s.c0; c <= s.c1; c++) over[c] = true; });
    const touches = (s, flags) => { for (let c = s.c0; c <= s.c1; c++) if (flags[c]) return true; return false; };
    segs.forEach(s => { s.hidden = s.lane >= L || (s.lane === L - 1 && touches(s, over)); });
    const more = [0, 0, 0, 0, 0, 0, 0];
    segs.forEach(s => { if (s.hidden) for (let c = s.c0; c <= s.c1; c++) more[c]++; });
    return { bars: segs.filter(s => !s.hidden).map(s => ({ e: s.e, c0: s.c0, c1: s.c1, lane: s.lane })), more };
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
  /** 名前から決まる色の番号（0〜9。同じ名前なら、いつも同じ色） */
  function colorIndex(name) {
    let h = 0; for (const ch of String(name || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return h % PALETTE;
  }
  /** 分類の色の番号（設定の並び順。なければ名前から） */
  function catIndex(name, categories) {
    if (!name) return -1;
    const i = (categories || []).findIndex(c => c.name === name);
    if (i >= 0) return i % PALETTE;
    return colorIndex(name);
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
    TZ, WD, isYmd, ymdOf, hmOf, today, addDays, diffDays, weekday, addMonths, labelDay, labelShort, relDay, labelWhen, monthGrid, isoWeek, holidayName, holidaysOf,
    eventsOn, remindersFor, undatedReminders, memosOn, pinnedMemos, itemsOn, briefingFor, dayView, monthMarks, calEntries, weekLayout,
    filterMemos, filterItems, memoTitle, memoBody, colorIndex, catIndex, shortcutUrl, memoToIos, iosForShortcut, calshowUrl,
    parseConnect, checkGasUrl, esc, safeUrl, uid, upsert, proposalTarget, withDate, withoutDate
  };
});
