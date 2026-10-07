// ============================================================
// goals.js — 目標（志望校）から「どの単元を、どのレベルまで」を決める
//
//  目標レベル（tier）ごとに、小学校・中学校・高校の単元に必要なレベルを決める。
//    1 簡単 / 2 標準 / 3 応用 / 4 難関
//  単元にそのレベルの問題がなければ、その単元の最高レベルまでで「達成」とみなす。
//  大学の分類はあくまで目安。学校や先生の判断で自由に書き換えてよい（このファイルだけ直せばOK）。
// ============================================================
import { GRADE_ORDER, gradeIndex, STAGE_OF } from "../content/index.js";

export const TIERS = [
  {
    id: "kiso", label: "基礎をかためる", short: "基礎",
    desc: "教科書の基本を確実に。推薦・総合型選抜、数学を受験で使わない人も",
    examples: "推薦・総合型選抜／専門学校／就職",
    levels: { E: 2, J: 2, H: 1 }, color: "#22c55e",
  },
  {
    id: "kyotsu", label: "共通テスト・中堅大", short: "標準",
    desc: "共通テストで平均点以上。中堅私大の入試に対応",
    examples: "共通テスト中心／日東駒専・産近甲龍／福岡大 など",
    levels: { E: 2, J: 2, H: 2 }, color: "#3b82f6",
  },
  {
    id: "chiho", label: "国公立・上位私大", short: "応用",
    desc: "国公立の二次試験、上位私大の標準〜やや難の問題",
    examples: "佐賀大・長崎大・熊本大などの国公立／MARCH・関関同立・西南学院 など",
    levels: { E: 2, J: 3, H: 3 }, color: "#f97316",
  },
  {
    id: "nankan", label: "難関大", short: "難関",
    desc: "旧帝大・難関私大の二次試験レベル",
    examples: "九州大・大阪大などの旧帝大／東京科学大・一橋／早稲田・慶應 など",
    levels: { E: 2, J: 3, H: 4 }, color: "#a855f7",
  },
  {
    id: "saini", label: "最難関", short: "最難関",
    desc: "東大・京大・国公立医学部。中学範囲も発展レベルまで",
    examples: "東京大・京都大／国公立大学 医学部",
    levels: { E: 2, J: 4, H: 4 }, color: "#7c3aed",
  },
];
export const TIER_BY_ID = Object.fromEntries(TIERS.map((t) => [t.id, t]));

// 志望校の候補（検索用の目安）。tier は上の id。名前で選ぶと tier が自動で入る。
export const UNIVERSITIES = [
  ["東京大学", "saini"], ["京都大学", "saini"], ["国公立大学 医学部", "saini"], ["九州大学 医学部", "saini"],
  ["佐賀大学 医学部", "saini"], ["長崎大学 医学部", "saini"], ["熊本大学 医学部", "saini"],
  ["九州大学", "nankan"], ["大阪大学", "nankan"], ["名古屋大学", "nankan"], ["東北大学", "nankan"],
  ["北海道大学", "nankan"], ["東京科学大学", "nankan"], ["一橋大学", "nankan"], ["神戸大学", "nankan"],
  ["早稲田大学", "nankan"], ["慶應義塾大学", "nankan"], ["東京理科大学", "nankan"],
  ["佐賀大学", "chiho"], ["長崎大学", "chiho"], ["熊本大学", "chiho"], ["大分大学", "chiho"],
  ["宮崎大学", "chiho"], ["鹿児島大学", "chiho"], ["九州工業大学", "chiho"], ["福岡教育大学", "chiho"],
  ["北九州市立大学", "chiho"], ["広島大学", "chiho"], ["岡山大学", "chiho"], ["筑波大学", "chiho"],
  ["千葉大学", "chiho"], ["横浜国立大学", "chiho"], ["金沢大学", "chiho"],
  ["明治大学", "chiho"], ["青山学院大学", "chiho"], ["立教大学", "chiho"], ["中央大学", "chiho"], ["法政大学", "chiho"],
  ["同志社大学", "chiho"], ["立命館大学", "chiho"], ["関西大学", "chiho"], ["関西学院大学", "chiho"],
  ["西南学院大学", "chiho"],
  ["福岡大学", "kyotsu"], ["久留米大学", "kyotsu"], ["九州産業大学", "kyotsu"], ["西日本工業大学", "kyotsu"],
  ["日本大学", "kyotsu"], ["東洋大学", "kyotsu"], ["駒澤大学", "kyotsu"], ["専修大学", "kyotsu"],
  ["京都産業大学", "kyotsu"], ["近畿大学", "kyotsu"], ["甲南大学", "kyotsu"], ["龍谷大学", "kyotsu"],
  ["推薦・総合型選抜で進学", "kiso"], ["専門学校", "kiso"], ["就職", "kiso"],
].map(([name, tier]) => ({ name, tier }));

export const TRACKS = [
  { id: "bunkei", label: "文系", desc: "数学I・A・II・B・C（ベクトル）まで" },
  { id: "rikei", label: "理系", desc: "数学IIIと数学Cの全範囲も" },
  { id: "mitei", label: "まだ決めていない", desc: "ひとまず文系の範囲で進める" },
];

/** この単元に必要なレベル（0 = 目標の範囲外） */
export function requiredLevel(unit, profile) {
  if (!unit) return 0;
  const tier = TIER_BY_ID[profile?.goal?.tier] || TIER_BY_ID.kyotsu;
  const stage = STAGE_OF(unit.grade);
  if (stage === "H" && unit.rikei && profile?.goal?.track !== "rikei") return 0;
  const want = tier.levels[stage] || 2;
  return Math.max(1, Math.min(want, unit.maxLevel || want));
}

/** 学年の通し番号（小1=0 … 高3=11）。既卒は高3あつかい */
export function profileGradeIndex(profile) {
  const g = profile?.grade === "R" ? "H3" : profile?.grade;
  const i = gradeIndex(g);
  return i < 0 ? 0 : i;
}

/** 「もう習った」単元か（前の学年はすべて、今の学年はチェックしたもの） */
export function isLearned(unit, profile) {
  const gi = profileGradeIndex(profile);
  if (unit.gi < gi) return true;
  if (unit.gi > gi) return false;
  if (profile?.grade === "R") return true;
  return (profile?.learned || []).includes(unit.id);
}

/** 今の学年の単元のうち、月から見て「たぶん習った」ものを推定（オンボーディングの初期値） */
export function guessLearnedThisYear(units, profile, now = new Date()) {
  const gi = profileGradeIndex(profile);
  const mine = units.filter((u) => u.gi === gi);
  // 4月=0 … 3月=11。学年の進み具合 ≒ (月-4)/12
  const m = (now.getMonth() + 12 - 3) % 12; // 4月→0
  const ratio = Math.min(1, Math.max(0, m / 11));
  const n = Math.round(mine.length * ratio);
  return mine.slice(0, n).map((u) => u.id);
}

/** 共通テストの日（目安：高3の1月中旬）。小・中学生も高3の1月を目標日にする */
export function examDate(profile, now = new Date()) {
  const gi = profileGradeIndex(profile); // 0..11
  // 学校の年度（4月はじまり）
  const sy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const yearsToH3 = profile?.grade === "R" ? 0 : GRADE_ORDER.length - 1 - gi;
  return new Date(sy + yearsToH3 + 1, 0, 17);
}

export function daysUntil(date, now = new Date()) {
  return Math.max(0, Math.ceil((date - now) / 86400000));
}

export const tierOf = (profile) => TIER_BY_ID[profile?.goal?.tier] || TIER_BY_ID.kyotsu;
