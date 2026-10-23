/* 単元の一覧（表示の順）。ワークシートは data/ws_<単元>.js に書き、index.html で読みこむ。 */
(function () {
  [['seifu', '正の数・負の数'], ['moji', '文字と式'], ['hotei', '方程式'], ['hirei', '比例と反比例'], ['heimen', '平面図形'], ['kukan', '空間図形'], ['data', 'データの活用']]
    .forEach(([key, name]) => IK.unit({ key, grade: 1, name }));
  // 中2（第1章から、つくった授業のある単元だけ）
  [['shiki', '式の計算'], ['renritsu', '連立方程式']]
    .forEach(([key, name]) => IK.unit({ key, grade: 2, name }));
})();

/* 単元のねらい（学習予定表のいちばん上に出す。生徒に見せる文）。学習予定表・記録ページをつくる単元（IK.qrUnits）に書く */
(function () {
  IK.unitGoals = IK.unitGoals || {};
  IK.unitGoals.kukan = [
    '立体の特徴や、空間における直線・平面の位置関係がわかり、表面積と体積を求めることができる',
    '立体を、展開図・投影図・面の動きなど、いろいろな見方でとらえて説明する',
    '立体を平面の図に表して考えるよさに気づき、身のまわりの立体に使おうとする'
  ];
})();
