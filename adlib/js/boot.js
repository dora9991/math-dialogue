/* アドリブ・ラボ：起動（すべての部品を読みこんだあとに呼ぶ） */
(function () {
  'use strict';
  function start() {
    try { window.AL.App.init(); }
    catch (e) {
      console.error(e);
      const m = document.createElement('pre');
      m.style.cssText = 'padding:1rem;margin:1rem;border:1px solid #c00;border-radius:8px;white-space:pre-wrap;font:13px/1.5 monospace;color:#c00';
      m.textContent = '起動に失敗しました：' + (e && e.message ? e.message : e) + '\n' + (e && e.stack ? e.stack : '');
      document.body.insertBefore(m, document.body.firstChild);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
