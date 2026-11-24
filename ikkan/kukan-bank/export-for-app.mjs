// export-for-app.mjs — bank.json を、コツコツくんに取りこむ人（別セッション）が、そのまま使える形にして import/ に書き出す。
//
//   node ikkan/kukan-bank/export-for-app.mjs                 → import/problems.json, import/video-map.json
//   node ikkan/kukan-bank/export-for-app.mjs --fold-level4   → 入試レベル（d=4）を、d=3 にまとめて書き出す（アプリが d=1〜3 しか受けつけないとき）
//   node ikkan/kukan-bank/export-for-app.mjs --fill-m=SLIP-calc-02   → 「まちがいの種類 m」が無い誤答に、この ID を入れる（アプリが m を必須にしているとき）
//
// import/problems.json … 300問。コツコツくんの固定問題（J1 の DB 問題）と同じ項目：{ id, u, s, l, d, q, c:[{t, k|m|w}], e, h }
//                         l（解説の番号）は、コツコツくんの既存の項目には無い。取りこむ側が、解説との紐づけに使う
// import/video-map.json … 解説ごとの一覧：どの小単元（J1-k1〜k4）の解説か、段階ごとの問題ID（pool に相当）、dir 形式の並び、復習に付ける既存問題
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "import");
const args = process.argv.slice(2);
const FOLD = args.includes("--fold-level4");
const FILL_M = (args.find((a) => a.startsWith("--fill-m=")) || "").slice("--fill-m=".length) || null;

const bank = JSON.parse(fs.readFileSync(path.join(HERE, "bank.json"), "utf8"));
const meta = JSON.parse(fs.readFileSync(path.join(HERE, "meta.json"), "utf8"));
const redis = JSON.parse(fs.readFileSync(path.join(HERE, "existing-redistribution.json"), "utf8"));

// 公開版（2026-11-10 時点）で、各解説が属している小単元。解説13は、2つの小単元にまたがっている
const PARENT = { "kukan-01": ["J1-k1"], "kukan-02": ["J1-k1"], "kukan-03": ["J1-k1"], "kukan-04": ["J1-k1"], "kukan-05": ["J1-k1"], "kukan-06": ["J1-k1"],
  "kukan-07": ["J1-k1"], "kukan-08": ["J1-k1"], "kukan-09": ["J1-k3"], "kukan-10": ["J1-k3"], "kukan-11": ["J1-k2"], "kukan-12": ["J1-k4"],
  "kukan-13": ["J1-k3", "J1-k2"], "kukan-14": ["J1-k2"], "kukan-15": ["J1-k2"] };
const LEVEL_NAME = { 1: "簡単", 2: "普通", 3: "難しい", 4: "入試レベル" };

const dOf = (p) => (FOLD && p.d === 4 ? 3 : p.d);
const problems = bank.map((p) => ({
  id: p.id, u: p.u, s: p.s, l: p.l, d: dOf(p), q: p.q,
  c: p.c.map((x) => (x.k ? { t: x.t, k: 1 } : { t: x.t, ...(x.m ? { m: x.m } : FILL_M ? { m: FILL_M } : {}), ...(x.w ? { w: x.w } : {}) })),
  e: p.e, h: p.h,
}));

const videos = [];
for (let n = 1; n <= 15; n++) {
  const id = `kukan-${String(n).padStart(2, "0")}`;
  const mine = problems.filter((p) => p.l === id);
  const levels = {};
  for (const p of mine) (levels[p.d] ||= []).push(p.id);
  videos.push({
    id, no: n, name: meta[mine[0].id].lessonName, parentUnits: PARENT[id], section: mine[0].s,
    levelNames: Object.fromEntries(Object.keys(levels).map((d) => [d, FOLD && +d === 3 ? "難しい・入試レベル" : LEVEL_NAME[d]])),
    pool: levels,
    dir: mine.map((p) => [p.id, p.s, p.d]),
    review: Object.entries(redis.map).filter(([, l]) => l === id).map(([pid]) => pid),
  });
}
const out = {
  _about: "解説（動画）ごとの演習の一覧。pool＝段階→問題ID（コツコツくんの pool と同じ形）、dir＝[問題ID, 章, 段階]（同じく dir）、review＝その解説の復習に付ける既存の演習（消さずに残す）",
  foldLevel4: FOLD, fillM: FILL_M, videos,
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "problems.json"), JSON.stringify(problems, null, 1) + "\n");
fs.writeFileSync(path.join(OUT, "video-map.json"), JSON.stringify(out, null, 1) + "\n");

// 自己点検：300問・15解説・各段階 5問（fold のときは d=3 が 10問）
const per = videos.map((v) => Object.values(v.pool).map((a) => a.length).join("/"));
console.log(`import/problems.json: ${problems.length}問 / video-map.json: ${videos.length}解説（段階ごとの問題数 ${[...new Set(per)].join(", ")}）${FOLD ? "  ※d=4 を d=3 にまとめた" : ""}${FILL_M ? `  ※m の無い誤答に ${FILL_M} を入れた` : ""}`);
console.log(`既存の演習の復習への振り分け: ${videos.reduce((n, v) => n + v.review.length, 0)}問`);
