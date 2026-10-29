/* 練習用サンプルの仕上げ：
   ① 何も保存されていないときだけ、サンプルの内容を下書きに入れる（編集画面より先に動く）
   ② 「最初の状態に戻す」ボタン：このブラウザに保存した練習の内容を消して、最初の内容に戻す */
(function () {
  "use strict";
  var S = window.ConfSchema;
  var D = window.CONF_SAMPLE_DATA || {};
  var resetting = false;

  function seed() {
    var all = {};
    var now = new Date().toISOString();
    S.KEYS.forEach(function (key) {
      all[key] = { draft: S.normalize(key, D[key], false), published: [], published_at: null, version: 1, updated_at: now, updated_by: "サンプル" };
    });
    try { window.localStorage.setItem(S.LOCAL_KEY, JSON.stringify(all)); } catch (e) { /* 保存できない環境では、空の画面から始まる */ }
  }

  try { if (!window.localStorage.getItem(S.LOCAL_KEY)) seed(); } catch (e) { /* 同上 */ }

  // 編集画面の「変更が保存されていません」の確認は、リセットのあとには出さない（編集画面より先に登録して止める）
  window.addEventListener("beforeunload", function (e) { if (resetting) e.stopImmediatePropagation(); });

  var btn = document.getElementById("sm-reset");
  if (btn) btn.addEventListener("click", function () {
    if (!window.confirm("このブラウザに保存した練習の内容を消して、最初の状態に戻します。よろしいですか？")) return;
    resetting = true;
    seed();
    window.location.reload();
  });
})();
