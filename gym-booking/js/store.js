/* 体育館よやく：保存。ブラウザの localStorage に入れる（使えないときは、開いているあいだだけ覚える）。
   この試作では、データはその人のブラウザの中だけにある（ほかの人とは共有されない）。 */
(function (G) {
  'use strict';
  const GB = G.GB = G.GB || {};
  const KEY = 'gym-booking-v1', UI = 'gym-booking-ui-v1';
  const get = k => { try { return JSON.parse(G.localStorage.getItem(k)); } catch (e) { return null; } };
  const put = (k, v) => { try { G.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  GB.store = {
    load() { const s = get(KEY); return s && s.v === 1 && s.settings && Array.isArray(s.orgs) ? s : null; },
    save: st => put(KEY, st),
    loadUi: () => get(UI),
    saveUi: ui => put(UI, ui),
    clear() { try { G.localStorage.removeItem(KEY); G.localStorage.removeItem(UI); } catch (e) { /* 使えないときは何もしない */ } },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GB;
})(typeof window !== 'undefined' ? window : globalThis);
