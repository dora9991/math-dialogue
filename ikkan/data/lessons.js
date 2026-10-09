/* 単元の一覧（表示の順）。ワークシートは data/ws_<単元>.js に書き、index.html で読みこむ。 */
(function () {
  [['seifu', '正の数・負の数'], ['moji', '文字と式'], ['hotei', '方程式'], ['hirei', '比例と反比例'], ['heimen', '平面図形'], ['kukan', '空間図形'], ['data', 'データの活用']]
    .forEach(([key, name]) => IK.unit({ key, grade: 1, name }));
})();
