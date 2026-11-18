/* minibasket/js/store.js
   確認ずみの試合データの保存。写真そのものは保存しない（端末のメモリ上だけ）。
   ・アーティファクトの中では db 機能（自分だけが読める data/users/<id>/ 以下）
   ・db に書けないとき（共有リンクで「閲覧のみ」の権限など）と、普通のブラウザでは localStorage
   ・どちらも使えなければメモリだけ（閉じると消える。JSONの書き出しで残せる）
   読み込みは、db とこのブラウザの両方をまとめて見る（同じ試合は新しいほうを採る）。
   試合は「日付・時刻・Game No.」から作ったキーで上書き保存する。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MB = Object.assign(root.MB || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LS_GAMES = 'mb.games.v1', LS_SET = 'mb.settings.v1';
  // db が「この閲覧者には書けない」と答えたときのコード。一時的な不調（unavailable など）は含めない
  const NO_WRITE = ['invalid_argument', 'not_granted', 'capability_disabled', 'capability_removed', 'revoked', 'transform_error'];
  let coll = null;      // db の、自分だけの置き場（使えるときだけ）
  let dbOk = true;      // db に書けないと分かったら false。以後の保存はこのブラウザへ
  let lsOk = false;
  const mem = { games: {}, settings: {} };

  const clone = x => JSON.parse(JSON.stringify(x));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const blocks = e => !e || !e.code || NO_WRITE.includes(e.code);
  /** 一時的な不調（unavailable）なら、少し待って1回だけやり直す */
  async function withRetry(fn) {
    try { return await fn(); }
    catch (e) { if (e && e.code === 'unavailable') { await sleep(300 + Math.random() * 500); return fn(); } throw e; }
  }

  /** 試合のキー（同じ試合を読み直したら上書きになる） */
  function makeKey(raw) {
    const m = (raw && raw.meta) || {};
    const part = s => String(s == null ? '' : s).replace(/[^0-9A-Za-z]/g, '');
    const k = ['g', part(m.date) || 'nodate', part(m.time) || 'notime', part(m.gameNo) || '0'].join('_');
    return k;
  }

  /** いま保存に使う場所：db に書けるなら 'db'、だめなら 'local'（このブラウザ）、それもだめなら 'memory' */
  const backend = () => (coll && dbOk ? 'db' : lsOk ? 'local' : 'memory');
  /** 画面に出す保存先。dbBlocked＝db は使えるはずなのに書けない（共有で閲覧のみの権限など） */
  const info = () => ({ where: backend(), dbBlocked: !!coll && !dbOk });

  async function init() {
    coll = null; dbOk = true;
    try {
      if (globalThis.claude && typeof globalThis.claude.use === 'function') {
        const db = await globalThis.claude.use('db');
        const user = await globalThis.claude.use('user');
        const uid = db && user ? await user.id() : null;
        if (uid) {
          coll = db.collection('data/users/' + uid);
          // 共有の db に書けない人（閲覧・コメントのみ）は、最初からこのブラウザに保存する。分からない(null)ときは、書いてみて決める
          try { if (typeof user.can === 'function' && (await user.can('data.write')) === false) dbOk = false; } catch (e) { /* noop */ }
        }
      }
    } catch (e) { coll = null; }
    try { localStorage.setItem('mb.probe', '1'); localStorage.removeItem('mb.probe'); lsOk = true; } catch (e) { lsOk = false; }
    return backend();
  }

  async function list() {
    const by = {};
    const add = (key, rec) => {
      if (!rec || !rec.raw) return;
      const at = rec.savedAt || 0;
      if (!by[key] || at >= by[key].savedAt) by[key] = { key, raw: clone(rec.raw), savedAt: at };
    };
    if (coll) {
      try { (await coll.get()).docs.forEach(d => { if (d.id.indexOf('g_') === 0) add(d.id, d.data()); }); } catch (e) { /* db が読めなくても、このブラウザの分は出す */ }
    }
    const all = lsOk ? lsGet(LS_GAMES, {}) : {};
    Object.keys(all).forEach(k => add(k, all[k]));
    Object.keys(mem.games).forEach(k => add(k, mem.games[k]));
    return Object.values(by);
  }

  /** 保存する。書けた場所を { where: 'db' | 'local' | 'memory', fellBack } で返す（fellBack＝db のはずがほかへ回った） */
  async function put(key, raw) {
    const rec = { v: 1, savedAt: Date.now(), raw: clone(raw) };
    const wantedDb = !!coll;
    if (coll && dbOk) {
      try { await withRetry(() => coll.doc(key).set(rec)); return { where: 'db', fellBack: false }; }
      catch (e) { if (blocks(e)) dbOk = false; }
    }
    if (lsOk) {
      const all = lsGet(LS_GAMES, {}); all[key] = rec;
      if (lsSet(LS_GAMES, all)) return { where: 'local', fellBack: wantedDb };
    }
    mem.games[key] = rec;
    return { where: 'memory', fellBack: wantedDb };
  }

  async function remove(key) {
    if (coll) { try { await coll.doc(key).delete(); } catch (e) { /* 書けない権限なら、もともと db には無い */ } }
    if (lsOk) { const all = lsGet(LS_GAMES, {}); if (key in all) { delete all[key]; lsSet(LS_GAMES, all); } }
    delete mem.games[key];
  }

  /** 設定（自チームの言葉など）。このブラウザの値を優先し、なければ db の値 */
  async function getSettings() {
    const local = lsOk ? lsGet(LS_SET, null) : null;
    if (local) return local;
    if (coll) { try { const d = await coll.doc('settings').get(); if (d.exists) return clone(d.data()); } catch (e) { /* 次へ */ } }
    return clone(mem.settings);
  }
  async function putSettings(v) {
    mem.settings = clone(v);
    if (lsOk) lsSet(LS_SET, v);
    if (coll && dbOk) { try { await withRetry(() => coll.doc('settings').set(clone(v))); } catch (e) { if (blocks(e)) dbOk = false; } }
  }

  /** 書き出し用のJSON文字列 */
  function exportJson(raws) {
    return JSON.stringify({ format: 'minibasket-games/1', exportedAt: new Date().toISOString(), games: raws }, null, 1);
  }

  /** 取り込み：1試合・試合の配列・書き出しファイル、どれでも受け取って試合の配列にする */
  function parseImport(obj) {
    if (Array.isArray(obj)) return obj.filter(x => x && x.teams);
    if (obj && Array.isArray(obj.games)) return obj.games.filter(x => x && x.teams);
    if (obj && obj.teams) return [obj];
    return [];
  }

  return { init, list, put, remove, getSettings, putSettings, makeKey, exportJson, parseImport, backend, storeInfo: info };
});
