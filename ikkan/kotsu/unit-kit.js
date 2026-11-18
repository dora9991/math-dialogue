// ============================================================
// unit-kit.js — ikkan の単元（空間図形・データの活用・式の計算・連立方程式）の問題データ（content/）を書くための、小さな補助
//   kit.js（コツコツくんの本物と同じ道具）に、ないものだけをここに足す。
//   content/<単元>-<授業の番号2けた>.js（例 data-03.js）で、unitFor('data')("03", { name, desc, prereqs, points, levels }) のように使う。
// ============================================================
import { t } from "./kit.js";

/** いつも同じ問題になるテンプレート（バリエーションの検査を、外すしるし） */
export const fixed = (id, build) => ({ ...t(id, build), fixed: true });

/** 単元ごとの決まり：単元 id の接頭字・学年・分野（コツコツくんの area）・章の名前 */
export const UNITS_CFG = {
  kukan: { prefix: "kk", grade: "J1", area: "geo", chapterName: "空間図形（ikkan の授業）", ikkanName: "空間図形" },
  data: { prefix: "dk", grade: "J1", area: "data", chapterName: "データの活用（ikkan の授業）", ikkanName: "データの活用" },
  shiki: { prefix: "sk", grade: "J2", area: "num", chapterName: "式の計算（ikkan の授業）", ikkanName: "式の計算" },
  renritsu: { prefix: "rk", grade: "J2", area: "num", chapterName: "連立方程式（ikkan の授業）", ikkanName: "連立方程式" },
  ichiji: { prefix: "ik", grade: "J2", area: "func", chapterName: "一次関数（ikkan の授業）", ikkanName: "一次関数" },
  heikou: { prefix: "hk", grade: "J2", area: "geo", chapterName: "平行と合同（ikkan の授業）", ikkanName: "平行と合同" },
};

/**
 * ikkan の 1 授業ぶんの単元をつくる。
 *   unitFor("data")("03", { name, desc, prereqs, points, levels })
 *   単元 id は、学年-接頭字＋番号（空間図形 J1-kk03、データ J1-dk03、式の計算 J2-sk03、連立方程式 J2-rk03）。
 *   コツコツくんの既存の単元（J1-k1〜k4、J1-d1〜d4 など）と、ぶつからない。
 *   levels：1＝基礎、2＝標準、3＝応用、4＝入試レベル（ikkan の演習プリントの見出しと同じ）
 */
export const unitFor = (key) => {
  const c = UNITS_CFG[key];
  return (no, o) => ({
    id: `${c.grade}-${c.prefix}${no}`,
    grade: c.grade,
    area: c.area,
    chapterId: `ikkan-${key}`,
    chapterName: c.chapterName,
    ikkan: { lesson: `${key}-${no}` },
    ...o,
  });
};
