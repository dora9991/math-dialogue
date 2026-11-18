/* 「← 数学ポータル」へ戻るリンク。
   公開スクリプト（tools/deploy.cjs）が、同じサイトに並べた小テスト・応用チャレンジ・家庭学習ノートの
   生徒画面にだけ読み込ませる（各ツールのソース自体には手を入れない）。
   ツールの画面は #app の中身を描き直すので、その外（body の先頭）に置けば消えない。 */
(function () {
  if (!/\/(quiz|applied|home)\/[^/]*$/.test(location.pathname)) return;
  const a = document.createElement("a");
  a.href = "../portal/";
  a.textContent = "← 数学ポータル";
  a.style.cssText = [
    "display:block", "max-width:720px", "margin:0 auto", "padding:10px 16px 0",
    "font-size:13px", "color:#24467d", "text-decoration:none",
    'font-family:"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",system-ui,sans-serif',
  ].join(";");
  document.body.insertBefore(a, document.body.firstChild);
})();
