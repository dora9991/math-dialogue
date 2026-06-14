// ============================================================
// gear.js — ガチャで手に入る装備（武器＝攻撃力アップ／防具＝最大HPアップ）
//
//  ・武器・防具とも 10段階（レアリティ）。
//  ・出やすさ（％）は 共通 → レア の順に
//      18 / 14 / 12 / 10 / 9 / 9 / 8 / 8 / 8 / 4   （合計100％。最高レアは4％）
//  ・手に入れた装備はコレクション図鑑に記録。1つずつ装備してバトルを強化。
// ============================================================

/** ガチャ1回のねだん（コイン） */
export const GACHA_COST = 500;

// レアリティ（tier1=共通 〜 tier10=最高）。weight=出やすさ%／pct=ステータス上昇率
// 上昇率は最大40%（武器が強すぎないように）。
const TIER_DEF = [
  { key: "t1",  label: "ノーマル",       color: "#94a3b8", weight: 18, pct: 0.03 },
  { key: "t2",  label: "ブロンズ",       color: "#b08d57", weight: 14, pct: 0.05 },
  { key: "t3",  label: "シルバー",       color: "#cbd5e1", weight: 12, pct: 0.07 },
  { key: "t4",  label: "ゴールド",       color: "#fbbf24", weight: 10, pct: 0.10 },
  { key: "t5",  label: "プラチナ",       color: "#67e8f9", weight: 9,  pct: 0.13 },
  { key: "t6",  label: "レア",           color: "#38bdf8", weight: 9,  pct: 0.16 },
  { key: "t7",  label: "スーパーレア",   color: "#a78bfa", weight: 8,  pct: 0.20 },
  { key: "t8",  label: "エピック",       color: "#f472b6", weight: 8,  pct: 0.26 },
  { key: "t9",  label: "レジェンド",     color: "#fb923c", weight: 8,  pct: 0.33 },
  { key: "t10", label: "ミシック",       color: "#fde047", weight: 4,  pct: 0.40 },
];

export const GEAR_RARITY = Object.fromEntries(TIER_DEF.map((t) => [t.key, t]));
export const RARITY_ORDER = TIER_DEF.map((t) => t.key);

// 各段階の名前・アイコン（tier1→tier10）
const WEAPONS = [
  { name: "木のぼう",     icon: "🪵" },
  { name: "銅のつるぎ",   icon: "🗡️" },
  { name: "鉄のつるぎ",   icon: "⚔️" },
  { name: "鋼のつるぎ",   icon: "🔪" },
  { name: "騎士の剣",     icon: "🛡️" },
  { name: "炎のつるぎ",   icon: "🔥" },
  { name: "雷鳴の剣",     icon: "⚡" },
  { name: "氷結の剣",     icon: "❄️" },
  { name: "竜殺しの剣",   icon: "🐲" },
  { name: "神話の剣",     icon: "🌟" },
];
const ARMORS = [
  { name: "ぬののふく",   icon: "👕" },
  { name: "革のよろい",   icon: "🧥" },
  { name: "銅のよろい",   icon: "🦺" },
  { name: "鉄のよろい",   icon: "🛡️" },
  { name: "鋼の鎧",       icon: "⛓️" },
  { name: "騎士の鎧",     icon: "🏵️" },
  { name: "聖騎士の鎧",   icon: "✨" },
  { name: "竜鱗の鎧",     icon: "🐉" },
  { name: "不滅の鎧",     icon: "💠" },
  { name: "神話の鎧",     icon: "👑" },
];

/** 装備一覧（武器10種・防具10種＝計20種） */
export const GEAR = TIER_DEF.flatMap((t, i) => [
  { id: `w${i + 1}`, type: "weapon", rarity: t.key, name: WEAPONS[i].name, icon: WEAPONS[i].icon, pct: t.pct, color: t.color },
  { id: `a${i + 1}`, type: "armor",  rarity: t.key, name: ARMORS[i].name,  icon: ARMORS[i].icon,  pct: t.pct, color: t.color },
]);

/** id から装備定義を引く */
export function findGear(id) {
  return GEAR.find((g) => g.id === id) || null;
}

/** 種類（weapon/armor）の装備一覧を返す（図鑑表示用。レア順） */
export function gearOfType(type) {
  return GEAR.filter((g) => g.type === type);
}

/**
 * ガチャを1回引く → 当たった装備id。
 *  レアリティを重みで抽選 → 武器/防具を50%ずつ → その段階の装備を返す。
 */
export function rollGacha(rand = Math.random) {
  const total = TIER_DEF.reduce((s, t) => s + t.weight, 0);
  let t = rand() * total;
  let chosen = TIER_DEF[0];
  for (const tier of TIER_DEF) {
    if ((t -= tier.weight) < 0) { chosen = tier; break; }
  }
  const type = rand() < 0.5 ? "weapon" : "armor";
  const pool = GEAR.filter((g) => g.rarity === chosen.key && g.type === type);
  return (pool[Math.floor(rand() * pool.length)] || GEAR[0]).id;
}

/** gacha フィールドの既定形（後方互換の補完に使う） */
export function defaultGacha(g) {
  return { owned: (g && g.owned) || {}, weapon: (g && g.weapon) || null, armor: (g && g.armor) || null };
}

/** 装備中の武器・防具からステータス上昇率を返す（バトルで使う） */
export function gearBonuses(player) {
  const g = player?.gacha || {};
  const w = findGear(g.weapon);
  const a = findGear(g.armor);
  return { atkPct: w ? w.pct : 0, hpPct: a ? a.pct : 0 };
}
