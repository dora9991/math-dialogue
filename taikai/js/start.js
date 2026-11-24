/* 起動：保存データを読む（なければサンプル）→ 画面を描く → サンプルの PDF をファイルの保存場所に入れる */
(function () {
  'use strict';
  T.load();
  T.render();
  T.loadSamplePdfs(T.db).catch((e) => console.warn('サンプルの PDF を入れられませんでした', e));
})();
