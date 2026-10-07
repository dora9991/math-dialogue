// ============================================================
// jhs/index.js — 中学1〜3年の単元（既存の数学ラボの問題データをそのまま包む）
//
//  src/data/grade1〜3 の章・単元（easy/standard/advanced/oni）を、
//  ソロの単元の形（levels 1〜4）に変換する。問題を直すときは元データを直せばよい。
//    easy → 1 簡単 / standard → 2 標準 / advanced → 3 応用 / oni → 4 難関
//  単元ID は「J学年-元の単元ID」（例 J1-u2、J3-g3c1u4）。
//  ここで決めているのは「分野」と「前提単元（さかのぼりの道）」と「要点」だけ。
// ============================================================
import { GRADES } from "../../../data/index.js";
import { JHS_POINTS } from "./_points.js";

// 章 → 分野
const AREA = {
  c1: "num", c2: "num", c3: "num", c4: "func", c5: "geo", c6: "geo", c7: "data",
  g2c1: "num", g2c2: "num", g2c3: "func", g2c4: "geo", g2c5: "geo", g2c6: "data",
  g3c1: "num", g3c2: "num", g3c3: "num", g3c4: "func", g3c5: "geo", g3c6: "geo", g3c7: "geo", g3c8: "data",
};

// 前提単元。ここに無い単元は「同じ章の1つ前の単元」が前提になる（章の最初なら前提なし）。
//  小学校の単元（E…）・他の章の単元（J…）へのつながりをここで書く。
const PREREQS = {
  // 中1 正の数と負の数
  "J1-u1": ["E4-keisan", "E3-shosu"],
  "J1-u4": ["J1-u3", "E6-bunsukake"],
  "J1-u6": ["E5-baisu"],
  // 中1 文字の式
  "J1-v1": ["E6-moji", "J1-u5"],
  "J1-v2": ["J1-v1", "J1-u5"],
  "J1-v3": ["J1-v1"],
  "J1-v4": ["J1-v3", "J1-u5"],
  // 中1 方程式
  "J1-e1": ["J1-v3", "E6-moji"],
  "J1-e2": ["J1-e1", "J1-v4"],
  "J1-e4": ["J1-e2", "E6-hi"],
  "J1-e5": ["J1-e3"],
  // 中1 比例と反比例
  "J1-h1": ["E6-hirei", "J1-v2"],
  "J1-h3": ["J1-u1"],
  "J1-h4": ["J1-h1"],
  "J1-h5": ["J1-h2", "J1-h3"],
  // 中1 平面図形
  "J1-z1": ["E5-kakudo"],
  "J1-z2": ["J1-z1", "E6-taisho"],
  "J1-z3": ["E6-enmenseki", "J1-v4"],
  // 中1 空間図形
  "J1-k1": ["E6-kakuchu"],
  "J1-k2": ["J1-k1", "J1-z3"],
  "J1-k4": ["J1-k2"],
  // 中1 データの活用
  "J1-d1": ["E6-data"],
  // 中2 式の計算
  "J2-g2c1u1": ["J1-v5"],
  "J2-g2c1u2": ["J1-v4", "J1-u4"],
  "J2-g2c1u4": ["J2-g2c1u2"],
  "J2-g2c1u5": ["J2-g2c1u3", "J2-g2c1u4"],
  "J2-g2c1u6": ["J2-g2c1u1", "J1-e2"],
  // 中2 連立方程式
  "J2-g2c2u1": ["J1-e3", "J2-g2c1u1"],
  // 中2 一次関数
  "J2-g2c3u1": ["J1-h1", "J1-e2"],
  "J2-g2c3u2": ["J2-g2c3u1", "J1-h3"],
  "J2-g2c3u3": ["J2-g2c3u2", "J2-g2c2u1"],
  // 中2 平行と合同 / 三角形と四角形
  "J2-g2c4u1": ["J1-z1"],
  "J2-g2c5u1": ["J2-g2c4u1"],
  "J2-g2c5u3": ["J2-g2c5u2", "E5-menseki"],
  // 中2 確率
  "J2-g2c6u1": ["E6-baai"],
  "J2-g2c6u2": ["J2-g2c6u1", "J1-d3"],
  // 中3 式の展開と因数分解
  "J3-g3c1u1": ["J2-g2c1u2", "J2-g2c1u1"],
  "J3-g3c1u2": ["J2-g2c1u4"],
  "J3-g3c1u3": ["J3-g3c1u1"],
  "J3-g3c1u5": ["J3-g3c1u1"],
  "J3-g3c1u6": ["J3-g3c1u3", "J3-g3c1u5"],
  "J3-g3c1u7": ["J3-g3c1u4", "J3-g3c1u6"],
  // 中3 平方根
  "J3-g3c2u1": ["J1-u4", "J1-u6"],
  "J3-g3c2u5": ["J3-g3c2u4", "J3-g3c1u3"],
  // 中3 2次方程式
  "J3-g3c3u1": ["J3-g3c2u2", "J1-e2"],
  "J3-g3c3u2": ["J3-g3c3u1", "J3-g3c1u4"],
  "J3-g3c3u4": ["J3-g3c1u6", "J3-g3c3u1"],
  "J3-g3c3u5": ["J3-g3c3u3", "J3-g3c3u4"],
  // 中3 関数 y=ax²
  "J3-g3c4u1": ["J1-h1"],
  "J3-g3c4u2": ["J3-g3c4u1", "J1-h4"],
  "J3-g3c4u3": ["J3-g3c4u1", "J2-g2c3u1"],
  "J3-g3c4u4": ["J3-g3c4u2", "J3-g3c4u3"],
  // 中3 相似・円・三平方
  "J3-g3c5u1": ["J1-e4", "J2-g2c5u1"],
  "J3-g3c5u3": ["J3-g3c5u1"],
  "J3-g3c6u1": ["J1-z1", "J2-g2c5u1"],
  "J3-g3c6u3": ["J3-g3c6u1"],
  "J3-g3c7u1": ["J3-g3c2u2"],
  "J3-g3c7u4": ["J3-g3c7u3", "J1-h3"],
  // 中3 標本調査
  "J3-g3c8u1": ["J1-d2"],
  "J3-g3c8u3": ["J3-g3c8u2", "J1-e4"],
};

const LEVEL_OF = { easy: 1, standard: 2, advanced: 3, oni: 4 };
const MINUS = /[−－]/g;

/** 既存の問題 {q, ans, h1, h2, choices} → ソロの形 {q, ans, choices, hint, steps} */
export function adapt(made) {
  if (!made || made.skip) return made;
  let ans = made.ans;
  let choices = made.choices;
  // 入力式で答えが文字列のとき：分数（"−8/3"）なら "-8/3" に、数字なら数値に、それ以外は4択にする
  if (!choices && typeof ans === "string") {
    const s = ans.replace(MINUS, "-").replace(/\s/g, "");
    if (/^-?\d+(\.\d+)?$/.test(s)) ans = Number(s);
    else if (/^-?\d+\/\d+$/.test(s)) ans = s;
    else choices = null; // まれ：呼び出し側で4択を作れないので、そのまま表示用に残す
  }
  return {
    q: made.q,
    ans,
    ...(choices ? { choices } : {}),
    hint: made.h1 || "ヒント：途中式を書いて、ひとつずつ考えよう",
    steps: [made.h2 || made.h1 || "答えを確かめよう"].filter(Boolean),
  };
}

function buildUnits() {
  const out = [];
  for (const [g, chapters] of Object.entries(GRADES)) {
    for (const ch of chapters) {
      ch.units.forEach((u, i) => {
        const id = `J${g}-${u.id}`;
        const prev = i > 0 ? [`J${g}-${ch.units[i - 1].id}`] : [];
        const levels = {};
        for (const [key, L] of Object.entries(LEVEL_OF)) {
          const list = u.problems?.[key];
          if (!list || list.length === 0) continue;
          levels[L] = list.map((tpl) => ({
            id: `${id}-${tpl.id}`,
            src: tpl.id,
            build: (r) => adapt(tpl.build(r)),
          }));
        }
        out.push({
          id,
          srcUnitId: u.id, // 元の単元ID（葉一さんの動画・DB実問題の対応に使う）
          chapterId: ch.id,
          chapterName: ch.name,
          grade: `J${g}`,
          area: AREA[ch.id] || "num",
          name: u.name,
          desc: u.desc || ch.name,
          prereqs: PREREQS[id] || prev,
          points: JHS_POINTS[u.id] || [`${ch.name}「${u.name}」の基本を確かめよう。`, "ヒントと解説を見ながら、1問ずつ確実に。"],
          levels,
        });
      });
    }
  }
  return out;
}

export const UNITS = buildUnits();
