// ============================================================
// videos.js — ホー先生の解説動画・会話授業の登録表（単元ID → 動画／ページ）
//
//  登録した単元の「講義」タブに「ホー先生の解説動画」が出る（スライドの解説がある単元でも出る）。
//  登録のしかたは3通り。同じ単元に混ぜてもよい（上から順に並ぶ）。
//
//  ① 規則で自動：会話授業のURLに規則があるときは、TALK に書くだけ（下）。
//  ② 1本ずつ URL：   "単元ID": [ { title: "タイトル", url: "https://…" } ]
//  ③ YouTube：       "単元ID": [ { title: "タイトル", yt: "YouTubeの動画ID" } ]
//      yt は YouTube の URL の v= の後ろ。限定公開でも埋め込める。1単元に複数本あれば配列に並べる。
//
//  url は https:// から始まるものだけ（会話授業サイト＝Cloudflare Pages など）。
//  単元IDの調べ方は docs/solo-講義データの書き方.md。登録後は `node scripts/solo-verify.mjs` で確認。
// ============================================================

// ── ① 会話授業（math-talk.pages.dev）を、URLの規則で単元につなぐ ──────────
//   units   … 会話授業がある単元（IDの配列、または (単元ID) => true/false の関数）。ここに書いた単元にだけ出る
//   pattern … その単元のページのURL。文字列なら {id}=単元ID（例 J1-u2）、{lc}=小文字の単元ID（例 j1-u2）を置きかえる。
//             規則が複雑なときは関数 (単元ID) => URL でもよい
//   例）units: (id) => id.startsWith("J1-"),  pattern: "https://math-talk.pages.dev/{id}/"
//   units か pattern が空のあいだは、何も出ない。
export const TALK = {
  title: "ホー先生の会話授業",
  units: [],
  pattern: null,
};

// ── ②③ 1本ずつ ──────────────────────────────────────────
export const VIDEOS = {
  // 例（本物のURL・IDを入れるまでコメントのまま）：
  // "J1-u2": [{ title: "正の数・負の数のたし算", url: "https://math-talk.pages.dev/…" }],
  // "J1-u3": [{ title: "正の数・負の数のひき算", yt: "XXXXXXXXXXX" }],
};

/** https:// だけを通す（登録表の書きまちがい・javascript: などの防止） */
export const isHttps = (u) => typeof u === "string" && /^https:\/\/[^\s/]+/i.test(u);

const fill = (pat, id) =>
  typeof pat === "function" ? pat(id) : String(pat).replace(/\{id\}/g, id).replace(/\{lc\}/g, id.toLowerCase());

const hasTalk = (id) =>
  !!TALK.pattern && (Array.isArray(TALK.units) ? TALK.units.includes(id) : typeof TALK.units === "function" && !!TALK.units(id));

/** 規則で作る会話授業のページ（無ければ null） */
export function talkOf(unitId) {
  if (!hasTalk(unitId)) return null;
  const url = fill(TALK.pattern, unitId);
  return isHttps(url) ? { title: TALK.title || "ホー先生の会話授業", url } : null;
}

/** その単元の動画の一覧：[{ title, url } | { title, yt }]。規則で作ったもの → 1本ずつ登録したもの の順 */
export const getVideos = (unitId) => {
  const talk = talkOf(unitId);
  const own = (VIDEOS[unitId] || []).filter((v) => (v.yt && /^[A-Za-z0-9_-]{11}$/.test(v.yt)) || isHttps(v.url));
  return talk ? [talk, ...own.filter((v) => v.url !== talk.url)] : own;
};
