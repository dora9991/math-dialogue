// ============================================================
// videos.js — ホー先生の解説動画の登録表（単元ID → 動画）
//
//  ここに1行足すと、その単元の「講義」タブに「ホー先生の解説動画」が出る。
//  中学校の各単元（J1-… J2-… J3-…）から順に足していく想定。小学校・高校の単元にも使える。
//
//    "単元ID": [ { title: "動画のタイトル", yt: "YouTubeの動画ID" }, ... ],
//
//  yt は YouTube の URL の v= の後ろ（https://www.youtube.com/watch?v=ABCDEFGHIJK → "ABCDEFGHIJK"）。
//  限定公開の動画でも埋め込める。1単元に複数本あれば、配列に並べる。
//  単元IDの調べ方は docs/solo-講義データの書き方.md。登録後は `node scripts/solo-verify.mjs` で確認。
// ============================================================
export const VIDEOS = {
  // 例（本物のIDを入れるまでコメントのまま）：
  // "J1-u2": [{ title: "正の数・負の数のたし算", yt: "XXXXXXXXXXX" }],
};

export const getVideos = (unitId) => VIDEOS[unitId] || [];
