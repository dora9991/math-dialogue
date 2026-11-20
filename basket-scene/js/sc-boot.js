/* バスケ シーン — はじめ（全部のファイルを読んだあと） */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;
  const go = () => root.SC.app.init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})(typeof window !== 'undefined' ? window : globalThis);
