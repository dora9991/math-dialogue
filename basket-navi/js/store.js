/* バスケ指導ナビ：記録の保存。
   ブラウザの localStorage に入れる（この端末のこのブラウザの中だけ。どこにも送らない）。
   入れるもの：お気に入り・視聴済み・メモ・自分でつけた印・練習計画・実践の回数・再生位置。
   動画やライブラリ（library.js）の中身は、ここには入れない（取り込みを使ったときだけ別の枠に入る）。
   ブラウザの掃除や別の端末では消える／移らないので、設定の「バックアップ」で書き出しておく。 */
(function () {
  'use strict';
  const KEY = 'basketNavi.v1', LIBKEY = 'basketNavi.library.v1';
  const blank = () => ({ v: 1, fav: {}, seen: {}, notes: {}, marks: {}, pos: {}, done: {}, plans: [], cur: null, run: null, base: '', backedUp: 0 });
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
    wipe() { d = blank(); S.save(); },
    libGet: () => read(LIBKEY),
    libSet: o => write(LIBKEY, o),
    libClear() { try { localStorage.removeItem(LIBKEY); } catch (e) { /* 何もしない */ } }
  };
  window.BN = window.BN || {};
  window.BN.store = S;
  window.addEventListener('pagehide', S.flush);
})();
