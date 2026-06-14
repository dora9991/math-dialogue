// ============================================================
// lessonMedia.js — 単元ごとの「動画＋ワークシート」素材の対応表
//  ・youtubeId  : 単独動画のID（埋め込み再生の開始動画）。
//  ・playlistId : 章まるごとの再生リストID。あると Lesson 画面の埋め込みプレイヤー内で
//      章内の動画を選んで再生できる（ワークシートを見ながら関連動画を流せる）。
//  ・pdf        : public/worksheets/ に置いたワークシートPDFのファイル名。
//      ※著作物（葉一さんのプリント等）は、許可を得たうえで配置すること。
//
//  動画は「とある男が授業をしてみた／葉一」さんのもの。YouTube埋め込みは公式が
//  許可した正規の方法。各単元のIDを足せば、その単元の動画を埋め込み再生できる。
// ============================================================
import { videoUrlFor } from "./videoLinks.js";

// 中2「式の計算」章の再生リスト（式の計算①〜：単項式と多項式／加法・減法／乗法・除法 ほか）
const G2C1_PLAYLIST = "PLKRhhk0lEyzPfFN5LF8JNRXhzt8kF7iKc";

const MEDIA = {
  // 中1サンプル（差し替え用ダミーPDF）
  u1: { youtubeId: "", pdf: "u1.pdf" },

  // 中2「式の計算」(g2c1)：章全体のワークシート(g2c1.pdf)＋章の再生リストを埋め込み。
  //  プレイヤー内で関連動画を選べる。先頭の単元は開始動画も指定。
  g2c1u1: { youtubeId: "7W71Q4nwX2U", playlistId: G2C1_PLAYLIST, pdf: "g2c1.pdf" }, // 多項式の加法・減法
  g2c1u2: { playlistId: G2C1_PLAYLIST, pdf: "g2c1.pdf" }, // 単項式の乗法
  g2c1u3: { playlistId: G2C1_PLAYLIST, pdf: "g2c1.pdf" }, // 累乗を含む単項式の計算
  g2c1u4: { playlistId: G2C1_PLAYLIST, pdf: "g2c1.pdf" }, // 単項式の除法
  g2c1u5: { playlistId: G2C1_PLAYLIST, pdf: "g2c1.pdf" }, // 乗除の混じった計算
  g2c1u6: { playlistId: G2C1_PLAYLIST, pdf: "g2c1.pdf" }, // 等式の変形
};

export function hasLessonMedia(unitId) {
  return !!MEDIA[unitId];
}

export function lessonMediaFor(unitId) {
  const m = MEDIA[unitId];
  if (!m) return null;
  return {
    youtubeId: m.youtubeId || "",
    playlistId: m.playlistId || "",
    pdfUrl: m.pdf ? import.meta.env.BASE_URL + "worksheets/" + m.pdf : null,
    videoPage: videoUrlFor(unitId), // 埋め込みが無いときのフォールバック（別タブで19ch）
  };
}
