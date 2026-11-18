/* バスケ指導ナビ：記録の保存。
   ブラウザの localStorage に入れる（この端末のこのブラウザの中だけ。どこにも送らない）。
   入れるもの：お気に入り・視聴済み・メモ・自分でつけた印・練習計画・実践の回数・再生位置。
   動画やライブラリ（library.js）の中身は、ここには入れない（取り込みを使ったときだけ別の枠に入る）。
   ブラウザの掃除や別の端末では消える／移らないので、設定の「バックアップ」で書き出しておく。 */
(function () {
  'use strict';
  const KEY = 'basketNavi.v1', LIBKEY = 'basketNavi.library.v1';
  const blank = () => ({ v: 1, fav: {}, seen: {}, notes: {}, marks: {}, pos: {}, done: {}, plans: [], cur: null, run: null, base: '', pickMode: '', backedUp: 0 });
  let d = blank(), usable = true, timer = 0;

  const read = key => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch (e) { usable = false; return null; } };
  const write = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { usable = false; return false; } };

  const first = read(KEY);
  if (first && typeof first === 'object') d = Object.assign(blank(), first);

  const S = {
    get d() { return d; },
    usable: () => usable,
    save() { clearTimeout(timer); timer = 0; return write(KEY, d); },
    saveSoon() { clearTimeout(timer); timer = setTimeout(S.save, 400); },
    flush() { if (timer) S.save(); },
    exportAll() { return { kind: 'basket-navi-backup', v: 1, savedAt: new Date().toISOString(), data: d }; },
    importAll(o) {
      if (!o || o.kind !== 'basket-navi-backup' || !o.data || typeof o.data !== 'object') throw new Error('このアプリのバックアップではありません');
      d = Object.assign(blank(), o.data);
      S.save();
    },
    mergeAll(o) {   // いまの記録を消さずに足しあわせる（同じ id のものは、いまの記録を優先）。別の端末の記録を持ちこむとき用
      if (!o || o.kind !== 'basket-navi-backup' || !o.data || typeof o.data !== 'object') throw new Error('このアプリのバックアップではありません');
      const b = Object.assign(blank(), o.data), r = { plans: 0, marks: 0 };
      ['fav', 'seen'].forEach(k => Object.keys(b[k] || {}).forEach(id => { d[k][id] = 1; }));
      Object.keys(b.notes || {}).forEach(id => {
        const x = String(b.notes[id] || '');
        if (!x) return;
        if (!d.notes[id]) d.notes[id] = x; else if (d.notes[id].indexOf(x) < 0) d.notes[id] += '\n――\n' + x;
      });
      Object.keys(b.marks || {}).forEach(vid => {
        const have = d.marks[vid] || (d.marks[vid] = []);
        (b.marks[vid] || []).forEach(m => { if (m && m.id && !have.some(h => h.id === m.id)) { have.push(m); r.marks++; } });
        if (!have.length) delete d.marks[vid];
      });
      Object.keys(b.pos || {}).forEach(id => { if (!d.pos[id]) d.pos[id] = b.pos[id]; });
      Object.keys(b.done || {}).forEach(k => {
        const x = b.done[k] || {}, y = d.done[k] || (d.done[k] = { n: 0, last: '' });
        y.n = Math.max(y.n || 0, x.n || 0);
        y.last = (y.last || '') > (x.last || '') ? y.last : (x.last || '');
      });
      (b.plans || []).forEach(p => { if (p && p.id && Array.isArray(p.items) && !d.plans.some(q => q.id === p.id)) { d.plans.push(p); r.plans++; } });
      if (!d.cur && d.plans[0]) d.cur = d.plans[0].id;
      S.save();
      return r;
    },
    wipe() { d = blank(); S.save(); },
    libGet: () => read(LIBKEY),
    libSet: o => write(LIBKEY, o),
    libClear() { try { localStorage.removeItem(LIBKEY); } catch (e) { /* 何もしない */ } }
  };
  window.BN = window.BN || {};
  window.BN.store = S;
  window.addEventListener('pagehide', S.flush);
})();
