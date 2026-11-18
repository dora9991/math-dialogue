// ============================================================
// lectures/index.js — 講義（解説）の登録所
//
//  単元ごとの解説を1ファイルずつ書いて、ここに1行足すと、その単元の「講義」に出る。
//  解説が無い単元は、要点（points）＋例題 が代わりに出る。解説動画は videos.js に登録する。
//  書き方は docs/solo-講義データの書き方.md
// ============================================================
import E5bunsu from "./E5-bunsu.js";
import J1u2 from "./J1-u2.js";
import HIniji from "./HI-niji.js";

// 解説の先生（名前とアイコンはここで変えられる）
export const TEACHER = { name: "ホー先生", icon: "🦉" };

const LIST = [E5bunsu, J1u2, HIniji];

export const LECTURES = Object.fromEntries(LIST.map((l) => [l.unitId, l]));
export const getLecture = (unitId) => LECTURES[unitId] || null;
