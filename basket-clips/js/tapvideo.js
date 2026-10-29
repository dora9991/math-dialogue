/* バスケ得点クリップ — 「バスケ タップ記録」で撮影しながら記録した動画を、この端末（このブラウザ）から読む
   タップ記録は、撮影した動画を IndexedDB 'btap-media' に保存している（同じサイトなので、ここからも読める）。
   スポーツ タップ記録（8種目）は 'stap-media'（name に DB_STAP を渡す）。
   データの形は basket-tap/js/vstore.js の先頭（ここは読むだけ。書きかえない）：
     videos：{ vid, gameId, n, startedAt, endedAt, mime, plan（{ header, ranges } | null）, duration, name, … }
     chunks：{ vid, i, blob }（i の順につなぐと、録画した動画そのもの）
   plan があれば、録画した細切れの MP4 を、ふつうの MP4 に組み直して渡す（中身は写さず、範囲を並べるだけ）。 */
(function (root) {
  'use strict';
  const BS = root.BS = root.BS || {};
  const DB = 'btap-media';
  const DB_STAP = 'stap-media';        // 「スポーツ タップ記録」（8種目）の動画。形は同じ（sports-tap/js/vstore.js）

  /* DB を開く（まだないときは作らない：作ってしまうと、タップ記録の側で入れ物が作れなくなるため） */
  function open(name) {
    return new Promise((resolve) => {
      let req;
      try { req = root.indexedDB.open(name || DB); } catch (e) { resolve(null); return; }
      let fresh = false;
      req.onupgradeneeded = () => { fresh = true; try { req.transaction.abort(); } catch (e) { /* 無視 */ } };
      req.onsuccess = () => { const db = req.result; if (fresh || !db.objectStoreNames.contains('videos') || !db.objectStoreNames.contains('chunks')) { db.close(); resolve(null); return; } resolve(db); };
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    });
  }
  function get(db, store, fn) {
    return new Promise((resolve) => {
      try {
        const t = db.transaction(store, 'readonly');
        const r = fn(t.objectStore(store));
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }
  /* その試合の動画の一覧（古い順） */
  async function videos(gameId, name) {
    const db = await open(name);
    if (!db) return [];
    const list = await get(db, 'videos', (s) => s.index('gameId').getAll(gameId));
    db.close();
    return (list || []).filter((v) => v.status === 'done').sort((a, b) => a.startedAt - b.startedAt);
  }
  async function meta(vid, name) {
    const db = await open(name);
    if (!db) return null;
    const v = await get(db, 'videos', (s) => s.get(vid));
    db.close();
    return v || null;
  }
  /* 再生できる動画のファイル（File）。なければ null */
  async function file(vid, name) {
    const db = await open(name);
    if (!db) return null;
    const v = await get(db, 'videos', (s) => s.get(vid));
    const list = v ? await get(db, 'chunks', (s) => s.getAll(IDBKeyRange.bound([vid, 0], [vid, Infinity]))) : null;
    db.close();
    if (!v || !list || !list.length) return null;
    const blob = new Blob(list.sort((a, b) => a.i - b.i).map((c) => c.blob), { type: v.mime || 'video/mp4' });
    const out = v.plan && v.plan.header && v.plan.ranges
      ? new Blob([v.plan.header].concat(v.plan.ranges.map(([s, e]) => blob.slice(s, e))), { type: 'video/mp4' })
      : blob;
    const type = v.plan ? 'video/mp4' : (v.mime || 'video/mp4').split(';')[0];
    try { return new File([out], v.name || 'video.mp4', { type, lastModified: v.startedAt || Date.now() }); } catch (e) { out.name = v.name; return out; }
  }

  BS.tapvideo = { open, videos, meta, file, DB, DB_STAP };
})(typeof window !== 'undefined' ? window : globalThis);
