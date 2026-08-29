// 宿泊研修「感想ひろば」のデータ（波戸岬少年自然の家）。
// window.EVENT_DATA は感想文字列の配列。1件＝1人分。
// 差し替え方は taiikusai-data.js / README.md と同じ（make-data.mjs が使える）。
//
// 以下はレイアウト確認用のダミー文です。公開前に必ず実データに差し替えてください。
window.EVENT_DATA = Array.from({ length: 105 }, (_, i) =>
  `サンプル感想 ${String(i + 1).padStart(3, "0")}：ここに実際の宿泊研修の感想文が入ります。`
);
