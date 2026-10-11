// ============================================================
// talk.js — ホー先生とポンタの「会話授業」を、単元から開けるようにする登録表
//
//  会話授業 … 黒板の前でホー先生とポンタが掛け合い、4択に答えながら進む授業。
//  公開サイト（math-talk）に、授業ごとのページがある。ここでは「どの単元に、どの授業を出すか」だけ決める。
//
//  ・授業のIDと題名は talk-data.js（自動生成）。授業のIDは、中1 u1-01…／kukan-01…、中2 g2u1-01…、中3 g3u1-01…
//  ・UNIT_LESSONS … 単元ID → 授業IDの並び（その単元の「会話授業」に出る）。同じ授業を複数の単元に書いてもよい。
//  ・同じ章の、上に書かなかった授業は、「同じ章のほかの授業」にまとめて出る。
//  ・応用問題10本・入試レベル3本は、章ごとに「応用・入試レベル」として出る。
//  ・公開していない学年は PUBLISHED を false にしておく（何も出ない）。中3は、公開できたら true にする。
//
//  授業を開くアドレス … {サイト}play.html?l={授業ID}
// ============================================================
import { TALK_LESSONS, TALK_CHAPTERS } from "./talk-data.js";

// 公開サイト。中3は容量の上限のため、別のサイトで公開する予定（作ったら、ここのアドレスを確かめる）。
export const TALK_SITE = {
  J1: "https://math-talk.pages.dev/",
  J2: "https://math-talk.pages.dev/",
  J3: "https://math-talk-g3.pages.dev/",
};

// 公開ずみの学年（false の学年は、リンクを出さない）
export const PUBLISHED = { J1: true, J2: true, J3: false };

export const talkUrl = (grade, id) => `${TALK_SITE[grade]}play.html?l=${encodeURIComponent(id)}`;

// ── 単元 → 授業 ───────────────────────────────────────────
export const UNIT_LESSONS = {
  // 中1 正の数・負の数（u1-01〜23）
  "J1-u1": ["u1-01", "u1-02", "u1-03"],
  "J1-u2": ["u1-04", "u1-05", "u1-06"],
  "J1-u3": ["u1-07", "u1-08", "u1-09", "u1-21", "u1-22"],
  "J1-u4": ["u1-10", "u1-11", "u1-12", "u1-13"],
  "J1-u5": ["u1-14", "u1-15", "u1-16", "u1-17", "u1-18"],
  "J1-u6": ["u1-19", "u1-20", "u1-23"],
  // 中1 文字と式（u2-01〜16）
  "J1-v1": ["u2-01", "u2-02", "u2-03", "u2-04", "u2-05"],
  "J1-v2": ["u2-06"],
  "J1-v3": ["u2-07", "u2-08"],
  "J1-v4": ["u2-09", "u2-10"],
  "J1-v5": ["u2-11", "u2-12", "u2-13", "u2-14", "u2-15", "u2-16"],
  // 中1 方程式（u3-01〜14）
  "J1-e1": ["u3-01", "u3-02", "u3-03"],
  "J1-e2": ["u3-04", "u3-05", "u3-06"],
  "J1-e3": ["u3-03"],
  "J1-e4": ["u3-11", "u3-12"],
  "J1-e5": ["u3-07", "u3-08", "u3-09", "u3-10", "u3-13", "u3-14"],
  // 中1 比例と反比例（u4-01〜16）
  "J1-h1": ["u4-01", "u4-03", "u4-04"],
  "J1-h2": ["u4-08", "u4-09", "u4-10", "u4-11"],
  "J1-h3": ["u4-05", "u4-06", "u4-07"],
  "J1-h4": ["u4-02"],
  "J1-h5": ["u4-12", "u4-13", "u4-14", "u4-15", "u4-16"],
  // 中1 平面図形（u5-01〜15）
  "J1-z1": ["u5-01", "u5-05", "u5-06", "u5-07", "u5-08", "u5-09"],
  "J1-z2": ["u5-02", "u5-03", "u5-04"],
  "J1-z3": ["u5-10", "u5-11", "u5-12"],
  "J1-z4": ["u5-13", "u5-14", "u5-15"],
  // 中1 空間図形（kukan-01〜15）
  "J1-k1": ["kukan-01", "kukan-02", "kukan-03", "kukan-04", "kukan-05", "kukan-06", "kukan-07", "kukan-08"],
  "J1-k2": ["kukan-11", "kukan-13"],
  "J1-k3": ["kukan-09", "kukan-10"],
  "J1-k4": ["kukan-12", "kukan-14", "kukan-15"],
  // 中1 データの活用（u7-01〜11）
  "J1-d1": ["u7-01", "u7-02", "u7-03"],
  "J1-d2": ["u7-01", "u7-02", "u7-04", "u7-05", "u7-06", "u7-07"],
  "J1-d3": ["u7-08", "u7-09", "u7-10", "u7-11"],

  // 中2 式の計算
  "J2-g2c1u1": ["g2u1-01", "g2u1-02", "g2u1-03"],
  "J2-g2c1u2": ["g2u1-04"],
  "J2-g2c1u3": ["g2u1-04"],
  "J2-g2c1u4": ["g2u1-03", "g2u1-04"],
  "J2-g2c1u5": ["g2u1-05", "g2u1-06"],
  "J2-g2c1u6": ["g2u1-07", "g2u1-08", "g2u1-09", "g2u1-10", "g2u1-11"],
  // 中2 連立方程式
  "J2-g2c2u1": ["g2u2-01", "g2u2-02", "g2u2-03", "g2u2-04"],
  "J2-g2c2u2": ["g2u2-03", "g2u2-07"],
  "J2-g2c2u3": ["g2u2-04", "g2u2-05", "g2u2-06", "g2u2-08", "g2u2-09", "g2u2-10", "g2u2-11", "g2u2-12", "g2u2-13"],
  // 中2 一次関数
  "J2-g2c3u1": ["g2u3-01", "g2u3-02", "g2u3-03", "g2u3-05"],
  "J2-g2c3u2": ["g2u3-06", "g2u3-07", "g2u3-09", "g2u3-10"],
  "J2-g2c3u3": ["g2u3-04", "g2u3-08", "g2u3-11", "g2u3-12", "g2u3-13", "g2u3-14", "g2u3-15", "g2u3-16", "g2u3-17"],
  // 中2 平行と合同
  "J2-g2c4u1": ["g2u4-01", "g2u4-02", "g2u4-03", "g2u4-04", "g2u4-05"],
  "J2-g2c4u2": ["g2u4-06", "g2u4-07"],
  // 中2 三角形と四角形
  "J2-g2c5u1": ["g2u5-01", "g2u5-02", "g2u5-03", "g2u5-04", "g2u5-05", "g2u5-06", "g2u5-07"],
  "J2-g2c5u2": ["g2u5-08", "g2u5-09", "g2u5-10", "g2u5-11"],
  "J2-g2c5u3": ["g2u5-12", "g2u5-13", "g2u5-14", "g2u5-15", "g2u5-16", "g2u5-17"],
  // 中2 確率
  "J2-g2c6u1": ["g2u6-02", "g2u6-03"],
  "J2-g2c6u2": ["g2u6-01", "g2u6-02", "g2u6-04"],
  "J2-g2c6u3": ["g2u6-05", "g2u6-06", "g2u6-07", "g2u6-08"],

  // 中3 式の展開と因数分解
  "J3-g3c1u1": ["g3u1-01", "g3u1-02"],
  "J3-g3c1u2": ["g3u1-01"],
  "J3-g3c1u3": ["g3u1-03"],
  "J3-g3c1u4": ["g3u1-04", "g3u1-05", "g3u1-06"],
  "J3-g3c1u5": ["g3u1-07", "g3u1-10"],
  "J3-g3c1u6": ["g3u1-08", "g3u1-11", "g3u1-12"],
  "J3-g3c1u7": ["g3u1-09"],
  "J3-g3c1u8": ["g3u1-13", "g3u1-14", "g3u1-15", "g3u1-16", "g3u1-17"],
  // 中3 平方根
  "J3-g3c2u1": ["g3u2-01", "g3u2-02", "g3u2-04"],
  "J3-g3c2u2": ["g3u2-03", "g3u2-05", "g3u2-07"],
  "J3-g3c2u3": ["g3u2-06", "g3u2-08"],
  "J3-g3c2u4": ["g3u2-09", "g3u2-10"],
  "J3-g3c2u5": ["g3u2-11", "g3u2-12", "g3u2-13", "g3u2-14"],
  // 中3 二次方程式
  "J3-g3c3u1": ["g3u3-01"],
  "J3-g3c3u2": ["g3u3-04", "g3u3-05"],
  "J3-g3c3u3": ["g3u3-06"],
  "J3-g3c3u4": ["g3u3-02", "g3u3-03"],
  "J3-g3c3u5": ["g3u3-07", "g3u3-08", "g3u3-09", "g3u3-10", "g3u3-11", "g3u3-12"],
  // 中3 関数 y＝ax²
  "J3-g3c4u1": ["g3u4-01", "g3u4-02"],
  "J3-g3c4u2": ["g3u4-03", "g3u4-04", "g3u4-05", "g3u4-06", "g3u4-07"],
  "J3-g3c4u3": ["g3u4-08", "g3u4-09"],
  "J3-g3c4u4": ["g3u4-10", "g3u4-11", "g3u4-12", "g3u4-13", "g3u4-14"],
  // 中3 相似な図形
  "J3-g3c5u1": ["g3u5-01", "g3u5-02", "g3u5-03", "g3u5-04", "g3u5-05", "g3u5-07", "g3u5-08", "g3u5-09", "g3u5-10", "g3u5-11", "g3u5-12", "g3u5-13"],
  "J3-g3c5u2": ["g3u5-14", "g3u5-15", "g3u5-16", "g3u5-17"],
  "J3-g3c5u3": ["g3u5-06", "g3u5-18", "g3u5-19", "g3u5-20"],
  // 中3 円
  "J3-g3c6u1": ["g3u6-01", "g3u6-02", "g3u6-03", "g3u6-04"],
  "J3-g3c6u2": ["g3u6-03", "g3u6-05"],
  "J3-g3c6u3": ["g3u6-06", "g3u6-07", "g3u6-08"],
  // 中3 三平方の定理
  "J3-g3c7u1": ["g3u7-01", "g3u7-02", "g3u7-03"],
  "J3-g3c7u2": ["g3u7-04"],
  "J3-g3c7u3": ["g3u7-05", "g3u7-07"],
  "J3-g3c7u4": ["g3u7-06", "g3u7-08", "g3u7-09", "g3u7-10", "g3u7-11", "g3u7-12"],
  // 中3 標本調査
  "J3-g3c8u1": ["g3u8-01"],
  "J3-g3c8u2": ["g3u8-01", "g3u8-04"],
  "J3-g3c8u3": ["g3u8-02", "g3u8-03", "g3u8-05"],
};

// 中1 の単元IDの文字 → 章の番号
const J1_CHAPTER = { u: "1", v: "2", e: "3", h: "4", z: "5", k: "6", d: "7" };

// 単元ID → { grade: "J1"|"J2"|"J3", chapter: "1"〜"8" }。中学校の単元でなければ null
export function chapterOf(unitId) {
  let m = /^J1-([uvehzkd])\d+$/.exec(unitId);
  if (m) return { grade: "J1", chapter: J1_CHAPTER[m[1]] };
  m = /^J([23])-g\1c(\d)u\d+$/.exec(unitId);
  if (m) return { grade: `J${m[1]}`, chapter: m[2] };
  return null;
}

// 章の応用問題10本・入試レベル3本（中1の6章 空間図形 には無い）
const PROBLEM_PREFIX = { J1: "ch", J2: "g2ch", J3: "g3ch" };
const J1_NO_PROBLEMS = new Set(["6"]);
export function problemIds(grade, chapter) {
  if (grade === "J1" && J1_NO_PROBLEMS.has(chapter)) return [];
  const p = `${PROBLEM_PREFIX[grade]}${chapter}`;
  return [
    ...Array.from({ length: 10 }, (_, i) => ({ id: `${p}-o${String(i + 1).padStart(2, "0")}`, label: `応用${i + 1}`, kind: "応用" })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `${p}-n${String(i + 1).padStart(2, "0")}`, label: `入試${i + 1}`, kind: "入試" })),
  ];
}

const KIND_ICON = { 探: "🔍", 例: "✏️", 遊: "🎮", 練: "🤝", 活: "🌱", 確: "✅" };
const row = (grade, id) => {
  const [kind, title] = TALK_LESSONS[id];
  return { id, kind, icon: KIND_ICON[kind] || "💬", title, url: talkUrl(grade, id) };
};

// 単元の「会話授業」。出すものが無ければ null。
//   main … この単元の授業／more … 同じ章のほかの授業／problems … 章の応用・入試レベル
export function getTalk(unitId) {
  const ch = chapterOf(unitId);
  if (!ch || !PUBLISHED[ch.grade]) return null;
  const mainIds = (UNIT_LESSONS[unitId] || []).filter((id) => TALK_LESSONS[id]);
  const chapterIds = (TALK_CHAPTERS[ch.grade] || {})[ch.chapter] || [];
  const main = mainIds.map((id) => row(ch.grade, id));
  const more = chapterIds.filter((id) => !mainIds.includes(id)).map((id) => row(ch.grade, id));
  const problems = problemIds(ch.grade, ch.chapter).map((p) => ({ ...p, url: talkUrl(ch.grade, p.id) }));
  if (!main.length && !more.length && !problems.length) return null;
  return { grade: ch.grade, chapter: ch.chapter, main, more, problems };
}
