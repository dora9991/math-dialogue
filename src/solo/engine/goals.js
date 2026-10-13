// ============================================================
// goals.js — 目標（志望校・目標レベル）と「どこまで習ったか」から、
//            「どの単元を、どのレベルまで」を決める
//
//  【レベル】各単元の問題は 1〜4 の4段階。
//     小学校・中学校の単元：1 基礎 / 2 標準 / 3 応用 / 4 入試レベル
//     高校の単元　　　　　：1 簡単 / 2 標準 / 3 応用 / 4 難関
//  【目標レベル（tier）】
//     小学生・中学生 … 基礎・標準・応用・入試レベル（＝上の1〜4のどこまで目指すか）
//     高校生・既卒　 … 基礎をかためる／共通テスト・中堅大／国公立・上位私大／難関大／最難関（5段階）
//  【志望校】高校も大学も選べる。名前を選ぶと、目標レベルが自動で入る（目安。変えてよい）。
//  単元にそのレベルの問題がなければ、その単元の最高レベルまでで「達成」とみなす。
//
//  高校・大学の分類は、あくまで目安。学校や先生の判断で自由に書き換えてよい（このファイルだけ直せばOK）。
// ============================================================
import { UNITS, GRADE_ORDER, gradeIndex, STAGE_OF, chaptersOfGrade } from "../content/index.js";

// ── 目標レベル ───────────────────────────────────────
// 小学生・中学生
export const TIERS_LOW = [
  {
    id: "base", T: 1, label: "基礎", short: "基礎",
    desc: "教科書の例題・基本問題を、確実に。定期テストで平均点をめざす",
    descE: "教科書の例題・基本問題を、確実に",
    examples: "基礎をかためたい人／推薦入試",
    color: "#22c55e",
  },
  {
    id: "std", T: 2, label: "標準", short: "標準",
    desc: "教科書の練習問題まで。定期テストで8割をめざす",
    descE: "教科書の練習問題まで",
    examples: "公立高校の標準的な入試",
    color: "#3b82f6",
  },
  {
    id: "adv", T: 3, label: "応用", short: "応用",
    desc: "章末の応用問題・やや難しい問題まで。上位校をめざす",
    descE: "応用問題・文章題・ひとひねりある問題まで",
    examples: "県立の上位校／私立の進学コース",
    color: "#f97316",
  },
  {
    id: "exam", T: 4, label: "入試レベル", short: "入試",
    desc: "高校入試の難しい問題・過去問の水準まで。難関校をめざす",
    descE: "中学入試・算数オリンピック入門レベルの問題まで",
    examples: "難関校・国立附属／全国の進学校",
    color: "#a855f7",
  },
];

// 高校生・既卒
export const TIERS_HIGH = [
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

export const TIERS = [...TIERS_LOW, ...TIERS_HIGH];
export const TIER_BY_ID = Object.fromEntries(TIERS.map((t) => [t.id, t]));

const LOW_IDS = TIERS_LOW.map((t) => t.id);   // 基礎・標準・応用・入試レベル（T=1〜4）
const HIGH_IDS = TIERS_HIGH.map((t) => t.id);

/** "E"（小学生）| "J"（中学生）| "H"（高校生・既卒） */
export const stageOfGrade = (g) => (g === "R" ? "H" : g ? STAGE_OF(g) : "J");
/** その学年の人が選べる目標レベル */
export const tiersFor = (stage) => (stage === "H" ? TIERS_HIGH : TIERS_LOW);

/** 目標レベルの id を、その学年の人向けの id に直す（学年を変えたときや、古い記録の読みこみ用） */
export function tierForStage(id, stage) {
  const high = stage === "H";
  const li = LOW_IDS.indexOf(id);
  if (li >= 0) return high ? HIGH_IDS[li] : id;
  const hi = HIGH_IDS.indexOf(id);
  if (hi >= 0) return high ? id : LOW_IDS[Math.min(hi, 3)];
  return high ? "kyotsu" : "std";
}

export const tierOf = (profile) => TIER_BY_ID[tierForStage(profile?.goal?.tier, stageOfGrade(profile?.grade))];

// ── 志望校 ───────────────────────────────────────────
//  高校：level … 1 基礎／2 標準／3 応用／4 入試レベル（そこに入るのに必要な目安）
//  大学：tier  … 高校生向けの目標レベル（TIERS_HIGH の id）
//  どちらも目安。名前を選ぶと目標レベルが自動で入るだけで、あとから変えられる。
const HS = (names, level) => names.map((name) => ({ name, kind: "high", level }));
const UV = (names, tier) => names.map((name) => ({ name, kind: "univ", tier }));

export const SCHOOLS = [
  // ── 高校 ──
  ...HS(["灘高校", "開成高校", "筑波大学附属駒場高校", "東大寺学園高校", "ラ・サール高校", "久留米大学附設高校", "青雲高校（長崎）"], 4),
  ...HS(["難関私立・国立附属高校"], 4),
  ...HS([
    "致遠館高校", "佐賀西高校", "唐津東高校", "武雄高校", "鳥栖高校", "佐賀東高校", "龍谷高校",
    "修猷館高校（福岡）", "福岡高校（福岡）", "筑紫丘高校（福岡）", "明善高校（福岡）", "西南学院高校（福岡）", "福岡大学附属大濠高校（福岡）",
    "県立の上位校",
  ], 3),
  ...HS([
    "佐賀北高校", "小城高校", "伊万里高校", "鹿島高校", "唐津西高校", "多久高校", "神埼高校", "白石高校", "嬉野高校",
    "佐賀学園高校", "東明館高校", "佐賀清和高校", "弘学館高校",
    "公立高校（標準的な入試）",
  ], 2),
  ...HS(["佐賀商業高校", "佐賀工業高校", "鳥栖工業高校", "唐津商業高校", "推薦入試で進学（基礎をかためる）"], 1),
  // ── 大学 ──
  ...UV(["東京大学", "京都大学", "国公立大学 医学部", "九州大学 医学部", "佐賀大学 医学部", "長崎大学 医学部", "熊本大学 医学部"], "saini"),
  ...UV(["九州大学", "大阪大学", "名古屋大学", "東北大学", "北海道大学", "東京科学大学", "一橋大学", "神戸大学", "早稲田大学", "慶應義塾大学", "東京理科大学"], "nankan"),
  ...UV([
    "佐賀大学", "長崎大学", "熊本大学", "大分大学", "宮崎大学", "鹿児島大学", "九州工業大学", "福岡教育大学", "北九州市立大学",
    "広島大学", "岡山大学", "筑波大学", "千葉大学", "横浜国立大学", "金沢大学",
    "明治大学", "青山学院大学", "立教大学", "中央大学", "法政大学", "同志社大学", "立命館大学", "関西大学", "関西学院大学", "西南学院大学",
  ], "chiho"),
  ...UV([
    "福岡大学", "久留米大学", "九州産業大学", "西日本工業大学", "日本大学", "東洋大学", "駒澤大学", "専修大学",
    "京都産業大学", "近畿大学", "甲南大学", "龍谷大学",
  ], "kyotsu"),
  ...UV(["推薦・総合型選抜で進学", "専門学校", "就職"], "kiso"),
];
export const findSchool = (name) => SCHOOLS.find((s) => s.name === (name || "").trim()) || null;

/** その学年の人に見せる志望校の候補：高校生・既卒は大学だけ。小学生・中学生は、高校を先に、大学もあとに */
export function schoolsFor(stage) {
  if (stage === "H") return SCHOOLS.filter((s) => s.kind === "univ");
  return [...SCHOOLS.filter((s) => s.kind === "high"), ...SCHOOLS.filter((s) => s.kind === "univ")];
}

/** 志望校 → その学年の人の目標レベル id（大学を選んだ中学生は、「共通テスト・中堅大」なら標準…のように読みかえる） */
export function tierOfSchool(school, stage) {
  if (!school) return null;
  if (school.kind === "univ" && stage === "H") return school.tier;   // 高校生は、大学の5段階をそのまま
  const T = school.kind === "high" ? school.level : { kiso: 1, kyotsu: 2, chiho: 3, nankan: 4, saini: 4 }[school.tier];
  return tierForStage(LOW_IDS[T - 1], stage);
}

export const TRACKS = [
  { id: "bunkei", label: "文系", desc: "数学I・A・II・B・C（ベクトル）まで" },
  { id: "rikei", label: "理系", desc: "数学IIIと数学Cの全範囲も" },
  { id: "mitei", label: "まだ決めていない", desc: "ひとまず文系の範囲で進める" },
];

// ── 目標レベル → 各学校段階で、どのレベルまで必要か ─────────────
/** { E, J, H } … 小・中・高の単元に必要なレベル（0 = 目標の範囲外。範囲外でも、単元一覧から自由に学べる） */
export function targetLevels(profile) {
  const stage = stageOfGrade(profile?.grade);
  const tier = tierOf(profile);
  if (stage === "H") return tier.levels;
  if (stage === "E") return { E: tier.T, J: 0, H: 0 };      // 小学生：小学校の単元を目標レベルまで
  return { E: Math.min(tier.T, 2), J: tier.T, H: 0 };       // 中学生：中学校の単元を目標レベルまで（小学校は標準まで）
}

/** この単元に必要なレベル（0 = 目標の範囲外） */
export function requiredLevel(unit, profile) {
  if (!unit) return 0;
  const stage = STAGE_OF(unit.grade);
  if (stage === "H" && unit.rikei && profile?.goal?.track !== "rikei") return 0;
  const want = targetLevels(profile)[stage] || 0;
  if (!want) return 0;
  return Math.max(1, Math.min(want, unit.maxLevel || want));
}

/** 学年の通し番号（小1=0 … 高3=11）。既卒は高3あつかい */
export function profileGradeIndex(profile) {
  const g = profile?.grade === "R" ? "H3" : profile?.grade;
  const i = gradeIndex(g);
  return i < 0 ? 0 : i;
}

// ── どこまで習ったか ─────────────────────────────────
//  profile.learned … 学校で習った小単元の id の一覧（全学年ぶん。learnedV: 2）。
//  ここに入っていない単元は「未修」。前の学年でも、先の学年でも、自由にチェックできる。
//  （古い記録は、前の学年はすべて・今の学年はチェックしたものだけ、として読みかえる）
function legacyLearned(profile) {
  const gi = profileGradeIndex(profile);
  const old = profile?.learned || [];
  const out = [];
  for (const u of UNITS) {
    if (u.gi < gi) out.push(u.id);
    else if (u.gi === gi && (profile?.grade === "R" || old.includes(u.id))) out.push(u.id);
  }
  return out;
}

const learnedCache = new WeakMap();
export function learnedSet(profile) {
  if (!profile) return new Set();
  let s = learnedCache.get(profile);
  if (!s) {
    s = new Set(profile.learnedV === 2 ? profile.learned || [] : legacyLearned(profile));
    learnedCache.set(profile, s);
  }
  return s;
}

/** 「もう習った」単元か */
export const isLearned = (unit, profile) => learnedSet(profile).has(unit.id);

/** 学年・目標レベルの id・習った範囲を、いまの形（learnedV: 2）にそろえる。古い記録を開いたときに使う */
export function migrateProfile(p) {
  if (!p) return p;
  const stage = stageOfGrade(p.grade);
  const goal = { ...(p.goal || {}), tier: tierForStage(p.goal?.tier, stage) };
  const next = { ...p, goal };
  if (p.learnedV !== 2) { next.learned = legacyLearned(p); next.learnedV = 2; }
  delete next.dailyGoal; // 1日の目標は、いまは使わない
  return next;
}

/** 習った範囲の初めの案：前の学年はすべて、今の学年は月から見た進み具合の分の章 */
export function defaultLearned(profile, now = new Date()) {
  const gi = profileGradeIndex(profile);
  const ids = UNITS.filter((u) => u.gi < gi).map((u) => u.id);
  const chs = chaptersOfGrade(GRADE_ORDER[gi]);
  // 4月=0 … 3月=11。学年の進み具合 ≒ 月/11。既卒は全部
  const m = (now.getMonth() + 12 - 3) % 12;
  const ratio = profile?.grade === "R" ? 1 : Math.min(1, Math.max(0, m / 11));
  const k = Math.round(chs.length * ratio);
  for (const c of chs.slice(0, k)) for (const u of c.units) ids.push(u.id);
  return ids;
}

// ── 試験の日 ─────────────────────────────────────────
/** 目標の試験：高校生・既卒は共通テスト（高3の1月中旬）、小・中学生は高校入試（中3の3月上旬）。どちらも目安 */
export function examInfo(profile, now = new Date()) {
  const gi = profileGradeIndex(profile);
  const sy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // 学校の年度（4月はじまり）
  if (stageOfGrade(profile?.grade) === "H") {
    const years = profile?.grade === "R" ? 0 : GRADE_ORDER.length - 1 - gi;
    return { label: "共通テスト", date: new Date(sy + years + 1, 0, 17) };
  }
  const years = Math.max(0, gradeIndex("J3") - gi);
  return { label: "高校入試", date: new Date(sy + years + 1, 2, 8) };
}
export const examDate = (profile, now) => examInfo(profile, now).date;

export function daysUntil(date, now = new Date()) {
  return Math.max(0, Math.ceil((date - now) / 86400000));
}

/** 「あと◯日」の見せ方：400日をこえたら「約◯年」 */
export function remainText(days) {
  if (days >= 400) return `約${Math.round(days / 365)}年`;
  return `${days}日`;
}
