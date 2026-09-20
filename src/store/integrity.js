// ============================================================
// integrity.js — 保存データの改ざん検知（軽量チェックサム方式）
//
// ★何をするか★
//  保存(コイン・クリスタル・レベル計算のもとになるworldXp・所持スキル/装備等)
//  のスナップショットから、バンドルに埋め込んだ合言葉(SALT)付きの
//  チェックサムを作り、player と一緒に保存する。読み込み時に再計算して
//  食い違えば「保存後にこれらの値が直接書き換えられた」と判定する。
//
// ★できること・できないこと★
//  ・localStorage の値をDevToolsなどで直接書き換える改ざん（今回の実被害）は検知できる。
//  ・ただし SALT はJSバンドルの中にそのまま入っている＝本気で読解して
//    正しいチェックサムまで計算し直す相手までは防げない（そこまでは
//    サーバー側で採点・進捗を持つ設計にしないと塞げない。Obsidian
//    「設計_サーバ移行とチート対策」参照）。
//  ・この機能を入れる前からの改ざん（chkが無い古いセーブ）は、下のisImplausible()で
//    「遊んだ量に対して明らかにあり得ない」ものだけを後付けで止める（ゆるい網）。
// ============================================================

const SALT = "ml5-integrity-v1-8f2c6a91";

// cyrb53: 高速・十分に散らばる非暗号学的ハッシュ（改ざん"検知"用途には十分）
function cyrb53(str) {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// チェックサム対象＝直接書き換えると「得」をしてしまうフィールドだけに絞る
// （records/mistakes等の学習履歴は対象外＝改ざん報酬に無関係なので誤検知の的にしない）
function criticalSnapshot(p) {
  if (!p || typeof p !== "object") return null;
  return [
    p.worldXp,       // レベル(=atk/HP)のもとになる累計XP
    p.coins,
    p.crystals,
    p.skillOwned,    // スキルガチャの所持数
    p.ownedSkills,   // 所持バトルスキルid
    p.gacha,         // 武器・防具ガチャ
    p.partners,      // なかまモンスターの育成状況
    p.ownedHeroes,   // 購入解放したヒーロー
    p.prestige,      // 周回数
  ];
}

/** player の現在値から期待チェックサムを計算する */
export function computeChecksum(player) {
  const snap = criticalSnapshot(player);
  if (snap === null) return null;
  let json;
  try { json = JSON.stringify(snap); } catch { return null; }
  return cyrb53(SALT + json);
}

/** 保存されていた chk と、今のplayerから再計算した値を比較する。
 *  chk が無い（この機能を入れる前の古い保存データ）場合は isImplausible() 側に判定を委ねる。 */
export function isTampered(player, savedChk) {
  if (typeof savedChk !== "string") return false;
  const expected = computeChecksum(player);
  return expected !== null && expected !== savedChk;
}

// ── ここから：chk が無い古いセーブ（=導入前からの保存データ）向けの"ゆるい"後付けチェック ──
//  目的は「今回すでに改ざんされてしまった分」のうち、遊んだ量(records件数・ログイン日数)に対して
//  明らかにあり得ない値だけを止めること。多少のズルの上乗せ("少し伸ばす"程度)は狙って見逃す
//  ＝実際の学習量よりだいぶ甘めの上限にして、まじめに遊んだ生徒を誤って巻き込まない。
const PLAUSIBILITY = {
  coinsPerRecord: 200,   // 実際の相場は1問10〜15G程度。桁違いに甘い上限にしてある
  coinsPerLoginDay: 200, // 実際のログインボーナスは100G/日
  coinsFloor: 3000,      // recordsがまだ少ない新規プレイヤーでも誤検知しないための下駄
  crystalsPerRecord: 3,
  crystalsPerLoginDay: 1,
  crystalsFloor: 100,
  xpMultiplier: 3,       // ゴールデンタイム等の倍率ぶんを見込んでrecords記録xpの3倍まで許容
  xpFloor: 5000,
};

/** records（学習履歴）に対して、coins/crystals/worldXpが明らかにあり得ないほど多くないかを見る。
 *  chk付きの厳密チェックと違い、誤検知を避けるため"ゆるい"上限しか使わない＝
 *  桁が違うレベルの改ざんだけを狙って止める。 */
export function isImplausible(player, records) {
  if (!player || typeof player !== "object") return false;
  const n = Array.isArray(records) ? records.length : 0;
  const loginDays = Number.isFinite(player.loginStreak) ? player.loginStreak : 0;

  const coinsCeil = n * PLAUSIBILITY.coinsPerRecord + loginDays * PLAUSIBILITY.coinsPerLoginDay + PLAUSIBILITY.coinsFloor;
  if ((player.coins || 0) > coinsCeil) return true;

  const crystalsCeil = n * PLAUSIBILITY.crystalsPerRecord + loginDays * PLAUSIBILITY.crystalsPerLoginDay + PLAUSIBILITY.crystalsFloor;
  if ((player.crystals || 0) > crystalsCeil) return true;

  const recordedXp = Array.isArray(records) ? records.reduce((s, r) => s + (Number(r?.xp) || 0), 0) : 0;
  const totalWorldXp = ["1", "2", "3"].reduce((s, k) => s + (Number(player.worldXp?.[k]) || 0), 0);
  const xpCeil = recordedXp * PLAUSIBILITY.xpMultiplier + PLAUSIBILITY.xpFloor;
  if (totalWorldXp > xpCeil) return true;

  return false;
}
