/* スポーツ タップ記録 — （バスケ タップ記録と同じしくみ）撮影した動画の保存（このブラウザの IndexedDB。どこにも送らない）
   録画は数秒ごとの切れはし（chunk）で届くので、届くたびに保存する（途中でページが閉じても、そこまでは残る）。
   録画を止めたら、細切れの MP4 をふつうの MP4 に組み直す「組み立て図」（fmp4.flatten の header と ranges）も保存する。
   動画の中身は、切れはしのまま1回だけ保存する（組み直した動画を、もう1つ保存しない。容量を2倍にしないため）。

   ■ データの形（バスケ得点クリップ basket-clips/js/tapvideo.js も、同じ形で読む。DB の名前だけ違う）
   DB 'stap-media'（版 1。バスケ タップ記録の 'btap-media' とは別）
     videos：{ vid, gameId, n（その試合の何本目か）, startedAt（録画を始めた時刻・エポックミリ秒）, endedAt,
               mime, ext, w, h, bytes, chunks（切れはしの数）, status（'recording' | 'done'）,
               plan（{ header: Uint8Array, ranges: [[始め, 終わり)…], duration, truncated } | null）, duration（秒）, name（保存するときのファイル名） }
     chunks：{ vid, i, blob }（キー [vid, i]。i の順につなぐと、録画した動画そのもの） */
(function (root) {
  'use strict';
  const ST = root.ST = root.ST || {};
  const DB = 'stap-media', VER = 1;      // （バスケ タップ記録の 'btap-media' とは別）
  let dbp = null;

  const supported = () => { try { return !!root.indexedDB; } catch (e) { return false; } };
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      let req;
      try { req = root.indexedDB.open(DB, VER); } catch (e) { reject(e); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos', { keyPath: 'vid' }).createIndex('gameId', 'gameId');
        if (!db.objectStoreNames.contains('chunks')) db.createObjectStore('chunks', { keyPath: ['vid', 'i'] });
      };
      req.onsuccess = () => { const db = req.result; db.onversionchange = () => { db.close(); dbp = null; }; resolve(db); };
      req.onerror = () => reject(req.error || new Error('IndexedDB を開けませんでした'));
      req.onblocked = () => reject(new Error('IndexedDB がほかのタブで使われています'));
    });
    dbp.catch(() => { dbp = null; });
    return dbp;
  }
  /* 1回のやりとり。fn(stores) の戻り値（IDBRequest なら、その結果）を返す */
  async function tx(names, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(names, mode);
      const stores = {};
      [].concat(names).forEach((n) => { stores[n] = t.objectStore(n); });
      let out;
      try { out = fn(stores); } catch (e) { reject(e); return; }
      t.oncomplete = () => resolve(out && typeof out === 'object' && 'result' in out && 'readyState' in out ? out.result : out);
      t.onerror = () => reject(t.error || new Error('保存できませんでした'));
      t.onabort = () => reject(t.error || new Error('保存できませんでした（空きが足りない など）'));
    });
  }
  const range = (vid) => IDBKeyRange.bound([vid, 0], [vid, Infinity]);

  const putChunk = (vid, i, blob) => tx('chunks', 'readwrite', (s) => { s.chunks.put({ vid, i, blob }); });
  const putVideo = (v) => tx('videos', 'readwrite', (s) => { s.videos.put(v); });
  const getVideo = (vid) => tx('videos', 'readonly', (s) => s.videos.get(vid));
  const videosOf = (gameId) => tx('videos', 'readonly', (s) => s.videos.index('gameId').getAll(gameId)).then((list) => (list || []).sort((a, b) => a.startedAt - b.startedAt));
  const allVideos = () => tx('videos', 'readonly', (s) => s.videos.getAll()).then((list) => list || []);
  const chunks = (vid) => tx('chunks', 'readonly', (s) => s.chunks.getAll(range(vid))).then((list) => (list || []).sort((a, b) => a.i - b.i).map((c) => c.blob));
  /* 録画した動画そのもの（切れはしをつないだもの） */
  async function raw(vid, mime) { return new Blob(await chunks(vid), { type: mime || 'video/mp4' }); }
  /* 保存・再生に使う動画（組み直した MP4。組み立て図がなければ、録画したまま） */
  async function file(vid) {
    const v = await getVideo(vid);
    if (!v) return null;
    const blob = await raw(vid, v.mime);
    const out = v.plan && ST.fmp4 ? ST.fmp4.compose(blob, Object.assign({ flat: true }, v.plan), 'video/mp4') : blob;
    try { return new File([out], v.name || ('video.' + (v.ext || 'mp4')), { type: v.plan ? 'video/mp4' : (v.mime || 'video/mp4'), lastModified: v.startedAt }); } catch (e) { return out; }
  }
  const remove = (vid) => tx(['videos', 'chunks'], 'readwrite', (s) => { s.videos.delete(vid); s.chunks.delete(range(vid)); });
  async function removeGame(gameId) { const list = await videosOf(gameId); for (const v of list) await remove(v.vid); return list.length; }
  async function estimate() {
    try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); return { usage: e.usage || 0, quota: e.quota || 0 }; } } catch (e) { /* 分からない */ }
    return null;
  }

  ST.vstore = { supported, open, putChunk, putVideo, getVideo, videosOf, allVideos, chunks, raw, file, remove, removeGame, estimate, DB };
})(typeof window !== 'undefined' ? window : globalThis);
