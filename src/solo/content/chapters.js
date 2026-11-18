// ============================================================
// chapters.js — 小学校・高校の単元を「単元（章）」にまとめる
//
//  アプリの階層は 「学年 → 単元（章）→ 小単元」。
//    ・単元（章）… 教科書の章にあたる。「どこまで習ったか」を選ぶときや、単元一覧で使う
//    ・小単元   … 問題・講義・確認テストがある、いちばん小さい単位（content/ の unit）
//  中学校は、既存データ（src/data/grade1〜3）の「章」をそのまま使う（jhs/index.js）。
//  小学校・高校は、ここで決める。教科書によって章の分け方は少しちがうので、あくまで目安。
//  書きかえてよい（小単元の id を並べるだけ）。solo-verify が「全部の小単元が、ちょうど1つの章に入っているか」を検査する。
//
//   [学年, 単元（章）の名前, 科目（高校のみ）, [小単元の id…]]
// ============================================================
export const CHAPTER_DEFS = [
  // ── 小学校 ──
  ["E1", "かずと けいさん", null, ["E1-kazu", "E1-tashi", "E1-hiki", "E1-100", "E1-kuri"]],
  ["E1", "とけいと かたち", null, ["E1-tokei", "E1-katachi"]],

  ["E2", "数と筆算", null, ["E2-hissan", "E2-1000"]],
  ["E2", "かけ算・分数", null, ["E2-kuku", "E2-bunsu"]],
  ["E2", "長さ・かさ・時間", null, ["E2-nagasa", "E2-jikan"]],
  ["E2", "図形と表・グラフ", null, ["E2-zukei", "E2-hyo"]],

  ["E3", "かけ算・わり算", null, ["E3-warizan", "E3-amari", "E3-kakezan"]],
  ["E3", "数（万・小数・分数）", null, ["E3-ookina", "E3-shosu", "E3-bunsu"]],
  ["E3", "図形", null, ["E3-en", "E3-sankaku"]],
  ["E3", "量とグラフ", null, ["E3-omosa", "E3-graph"]],

  ["E4", "大きな数と計算", null, ["E4-ookina", "E4-warihissan", "E4-gaisu", "E4-keisan"]],
  ["E4", "小数・分数", null, ["E4-shosu", "E4-bunsu"]],
  ["E4", "図形", null, ["E4-kakudo", "E4-menseki"]],
  ["E4", "変わり方とグラフ", null, ["E4-henka", "E4-oresen"]],

  ["E5", "小数・倍数と約数・分数", null, ["E5-shosukake", "E5-baisu", "E5-bunsu"]],
  ["E5", "平均・速さ・割合", null, ["E5-heikin", "E5-tani", "E5-wariai"]],
  ["E5", "図形", null, ["E5-menseki", "E5-taiseki", "E5-kakudo", "E5-enshu"]],

  ["E6", "分数・文字と式", null, ["E6-bunsukake", "E6-moji"]],
  ["E6", "比と比例", null, ["E6-hi", "E6-hirei"]],
  ["E6", "図形", null, ["E6-enmenseki", "E6-kakuchu", "E6-kakudai", "E6-taisho"]],
  ["E6", "場合の数・データ", null, ["E6-baai", "E6-data"]],

  // ── 高校 ──
  ["H1", "数と式", "数学I", ["HI-tenkai", "HI-inbun", "HI-jissu", "HI-futoshiki"]],
  ["H1", "集合と命題", "数学I", ["HI-shugo"]],
  ["H1", "2次関数", "数学I", ["HI-niji", "HI-saidai", "HI-nijifuto"]],
  ["H1", "図形と計量", "数学I", ["HI-sankakuhi", "HI-seigen"]],
  ["H1", "データの分析", "数学I", ["HI-data"]],
  ["H1", "場合の数と確率", "数学A", ["HA-baai", "HA-kakuritsu", "HA-joken"]],
  ["H1", "図形の性質", "数学A", ["HA-zukei"]],
  ["H1", "整数の性質", "数学A", ["HA-seisu"]],

  ["H2", "式と証明・複素数・高次方程式", "数学II", ["HII-shiki", "HII-fukuso", "HII-kouji"]],
  ["H2", "図形と方程式", "数学II", ["HII-zuhou"]],
  ["H2", "三角関数", "数学II", ["HII-sankaku"]],
  ["H2", "指数・対数関数", "数学II", ["HII-shisu", "HII-taisu"]],
  ["H2", "微分・積分", "数学II", ["HII-bibun", "HII-sekibun"]],
  ["H2", "数列", "数学B", ["HB-suretsu", "HB-sigma", "HB-zenka"]],
  ["H2", "統計的な推測", "数学B", ["HB-toukei"]],
  ["H2", "ベクトル", "数学C", ["HC-vector", "HC-kukan"]],

  ["H3", "複素数平面・2次曲線", "数学C", ["HC-fukuso", "HC-kyokusen"]],
  ["H3", "極限", "数学III", ["HIII-kyokugen"]],
  ["H3", "微分法とその応用", "数学III", ["HIII-bibun", "HIII-bibunouyo"]],
  ["H3", "積分法とその応用", "数学III", ["HIII-sekibun", "HIII-sekibunouyo"]],
];
