// ============================================================
// partners.js — 「なかま（仲間モンスター）」のルール（純関数のみ）
//
//  ・バトルで「魔物のエサ」を使った敵をたおすと、一定確率で仲間になる
//    （ザコ50%／ボス25%・その敵の単元を簡単/普通/難しい全て★1以上が条件）。
//  ・仲間はコイン/クリスタルで「餐やり」してレベルを上げると強くなる。
//  ・「ストック」最大4体まで編成でき、そのうち1体を「アクティブ」にすると、
//    バトルに主人公とともに参戦して一緒に戦う（残り3体は控え＝参戦しない）。
//
//  ※ ここは monsters.js / battle.js を import しない（循環参照を避ける）。
//    モンスター定義が要る処理は monster オブジェクトを引数で受け取る。
// ============================================================

// ストック（編成）に入れられる最大数。うち1体だけがバトルに参戦する。
export const PARTY_MAX = 4;

// 魔物のエサの値段（items.js の bait と一致させる）
export const BAIT_COST = 500;

// 仲間になる確率（エサ使用済みの敵をたおしたとき）
export const RECRUIT_CHANCE = { zako: 0.5, boss: 0.25 };

// なかまレベルの上限（ティアが高いほど高くまで育つ＝ボスは強い仲間になる）
export const PARTNER_MAX_LEVEL = { unit: 25, boss: 40, final: 50 };

/** モンスターのティア（"unit" | "boss" | "final"）。monster.kind から判定。 */
export function partnerTierOf(monster) {
  if (!monster) return "unit";
  if (monster.kind === "finalBoss") return "final";
  if (monster.kind === "chapterBoss") return "boss";
  return "unit";
}

/** そのモンスターを仲間にできる確率（ボス/魔王=25%・それ以外=50%） */
export function recruitChance(monster) {
  const t = partnerTierOf(monster);
  return t === "unit" ? RECRUIT_CHANCE.zako : RECRUIT_CHANCE.boss;
}

/** そのモンスターのなかまレベル上限 */
export function partnerMaxLevel(monster) {
  return PARTNER_MAX_LEVEL[partnerTierOf(monster)] || PARTNER_MAX_LEVEL.unit;
}

// プレイヤーの成長式（battle.js の playerHpForLevel/playerAtkForLevel と同じ式）。
//  ここは battle.js を import しない方針なので複製している。battle.js側のカーブを
//  変えたときはここも合わせて直すこと。
function refPlayerHp(lv) {
  return Math.round(40 + 13 * lv + 0.18 * lv * lv);
}
function refPlayerAtk(lv) {
  return Math.round(8 + 6 * lv + 0.09 * lv * lv);
}

/**
 * 仲間モンスターのバトル用ステータス（HP・攻撃力）。
 *  ★2026-09調整：以前は「敵としての強さ(monster.atk)」をそのまま基準にしていたが、
 *   裏ボス（高レベル帯ほど、戦う相手のプレイヤーを追い詰めるために意図的にatkが
 *   大きく作られている）を仲間にすると、プレイヤー本人の何倍もの化け物になってしまう
 *   問題があった（例：Lv1000の裏ボスを仲間にすると、育成後ATKが本人の約5倍・HPが約17倍）。
 *   → 「倒す相手として強い」と「連れ歩く仲間としてちょうどよい」は別物、という反省を踏まえ、
 *   その敵の推奨レベル(monster.minLv)にいる"同格のプレイヤー"を基準にするよう変更。
 *   仲間は同格プレイヤーよりやや強い程度（ティアが上がるほど伸びしろも大きい）に留める。
 *    攻撃 = 推奨レベル同格プレイヤーのATK × (0.4 + (atkLv-1)*0.03)  ← クリスタルで強化
 *    最大HP = 推奨レベル同格プレイヤーのHP × (0.5 + (hpLv-1)*0.045) ← お金で強化（仲間は"盾役"なので比率はATKよりやや高め）
 * @returns {{maxHp:number, atk:number}}
 */
export function allyStats(monster, hpLv = 1, atkLv = 1) {
  const refLv = Math.max(1, Math.round(monster?.minLv || 1));
  const refAtk = refPlayerAtk(refLv);
  const refHp = refPlayerHp(refLv);
  const hL = Math.max(1, hpLv);
  const aL = Math.max(1, atkLv);
  const atk = Math.max(1, Math.round(refAtk * (0.4 + (aL - 1) * 0.03)));
  const maxHp = Math.max(12, Math.round(refHp * (0.5 + (hL - 1) * 0.045)));
  return { maxHp, atk };
}

// なかま育成は「HPレベル(hpLv)」「攻撃レベル(atkLv)」を別々に持つ。
//  ・HPレベル   … お金(コイン)で上げる
//  ・攻撃レベル … クリスタルで上げる
//  旧データ（単一の lv だけ）も動くよう、未設定なら lv → 両方にフォールバックする。
/** なかま記録 e の HPレベル（旧 lv 互換） */
export function partnerHpLv(e) {
  return Math.max(1, e?.hpLv ?? e?.lv ?? 1);
}
/** なかま記録 e の 攻撃レベル（旧 lv 互換） */
export function partnerAtkLv(e) {
  return Math.max(1, e?.atkLv ?? e?.lv ?? 1);
}

// 育成の種類：HP=お金で +1Lv／攻撃=クリスタルで +1Lv
export const FEED_KINDS = {
  hp:  { id: "hp",  label: "HPアップ",  icon: "❤️", stat: "hpLv",  levels: 1 },
  atk: { id: "atk", label: "攻撃アップ", icon: "⚔️", stat: "atkLv", levels: 1 },
};

/**
 * 現在レベル lv のステータスを1段階上げるコスト。
 *  HP（お金）        ：40 + lv*30 コイン
 *  攻撃（クリスタル）：2 + floor(lv/4) クリスタル
 * @returns {{coins:number, crystals:number, levels:number}}
 */
export function feedCost(lv = 1, kind = "hp") {
  const L = Math.max(1, lv);
  if (kind === "atk") {
    return { coins: 0, crystals: 2 + Math.floor(L / 4), levels: FEED_KINDS.atk.levels };
  }
  return { coins: 40 + L * 30, crystals: 0, levels: FEED_KINDS.hp.levels };
}
