// ============================================================
// names.js — 単元名の表示（名前に $…$ の TeX が入っている単元がある）
// ============================================================
import { SKILLS } from "../data/graph.js";
import { mk } from "./dom.js";
import { plainText } from "../core/markup.js";

/** 末尾のかっこ書きを省いた短い名前（マップの四角用） */
export function shortName(id) {
  const n = SKILLS[id].name;
  const s = n.replace(/（[^）]*）$/, "");
  return s || n;
}
/** 表示用の要素（TeX は数式として描く） */
export const nameEl = (id, short = false) => mk(short ? shortName(id) : SKILLS[id].name);
/** 文字だけの名前（ツールチップ・ARIA・コピー用） */
export const namePlain = (id) => plainText(SKILLS[id].name);
