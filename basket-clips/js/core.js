/* バスケ得点クリップ — 共通の小さな道具（名前空間・数値・時刻の書式・イベント）
   DOM に依存しないので node のテストからも読み込める。
   名前空間は「バスケ分析スタジオ」と同じ BS（解析エンジンのファイルを、そのまま共有するため）。 */
(function (root) {
  'use strict';
  const BS = root.BS = root.BS || {};
  BS.APP = 'バスケ得点クリップ';

  BS.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  /* 秒 → 「m:ss」（1時間以上は「h:mm:ss」）。withTenths で 0.1 秒まで */
  BS.fmtTime = function (sec, withTenths) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const pad = (n) => String(n).padStart(2, '0');
    let out = (h ? h + ':' + pad(m) : String(m)) + ':' + pad(s);
    if (withTenths) out += '.' + Math.floor((sec * 10) % 10);
    return out;
  };

  /* 小さなイベントの仕組み（on で登録、emit で通知） */
  BS.emitter = function () {
    const map = new Map();
    return {
      on(name, fn) { if (!map.has(name)) map.set(name, new Set()); map.get(name).add(fn); return () => map.get(name).delete(fn); },
      off(name, fn) { if (map.has(name)) map.get(name).delete(fn); },
      emit(name, payload) {
        if (!map.has(name)) return;
        for (const fn of Array.from(map.get(name))) {
          try { fn(payload); } catch (err) { if (typeof console !== 'undefined') console.error('[BS] handler error', name, err); }
        }
      }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
