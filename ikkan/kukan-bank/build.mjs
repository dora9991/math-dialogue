// build.mjs — 中1「空間図形」の解説（動画）15本それぞれに、簡単・普通・難しい・鬼 の4段階 × 5問 の演習をつくる。
//
//   元：ikkan/kotsu/content/kukan-01〜15.js（解説の授業ごとの、答えを計算で出す問題。全313テンプレート、4段階）
//   先：コツコツくんの固定問題（J1 の DB 問題）と同じ形  { id, u, s, d, q, c:[{t, k|m|w}], e, h } ＋ 解説の番号 l
//
//   使い方：node ikkan/kukan-bank/build.mjs   → bank.json, meta.json を書く
//
//   段階（d）：1＝簡単（基礎）／2＝普通（標準）／3＝難しい（応用）／4＝鬼（入試レベル）。ikkan の 4段階（基礎・標準・応用・入試レベル）に対応。
//   正解は、元のテンプレートが計算で出したもの（手で書いていない）。誤答は distractors.mjs で作る。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UNITS } from "../kotsu/index.js";
import { plain, leftover } from "./texplain.mjs";
import { makeDistractors, parseAns, fmtRat } from "./distractors.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PER_LEVEL = 5;
const LEVEL_NAME = { 1: "簡単", 2: "普通", 3: "難しい", 4: "鬼" };
const NAME_OF = { "J1-kk01": "立体を仲間分けしよう", "J1-kk02": "正多面体をしらべよう", "J1-kk03": "2つの直線の位置関係", "J1-kk04": "直線と平面、平面と平面",
  "J1-kk05": "線や面を動かして立体をつくろう", "J1-kk06": "立体を正面と真上から見よう", "J1-kk07": "立体を切り開こう", "J1-kk08": "立体当てクイズ",
  "J1-kk09": "角柱・円柱の表面積", "J1-kk10": "角錐・円錐の表面積", "J1-kk11": "錐体の体積は柱体の何分のいくつ？", "J1-kk12": "球の表面積と体積",
  "J1-kk13": "表面積と体積を求める練習", "J1-kk14": "身のまわりの立体の量を見積もろう", "J1-kk15": "空間図形のまとめ" };

// ── 乱数（再現できるように、種を決める）──
const mulberry = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const ri = (rnd) => (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const shuffle = (rnd, arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// ── 誤答の「誤りの種類」ID（コツコツくんの既存の ID に合わせる）──
function misconceptionOf(w) {
  if (!w) return undefined;
  if (/直径/.test(w)) return "SHP-radius-01";
  if (/1\/3|1\/2|角柱の体積|円錐の体積の公式|角錐の体積/.test(w)) return "SP-volume-01";
  if (/母線|高さのかわり/.test(w)) return "SP-volume-02";
  if (/底面.*(足し忘れ|1つ分しか)|側面積だけ|上下で2つ|曲面だけ|底面の円だけ/.test(w)) return "SP-surface-02";
  if (/途中の計算結果/.test(w)) return "SLIP-calc-02";
  return undefined;
}

// ── テンプレート1回ぶん → 固定問題 ──
const FAILS = {};
const fail = (tpl, why) => { const k = `${tpl.id}: ${why}`; FAILS[k] = (FAILS[k] || 0) + 1; return null; };
function convert(o, tpl, rnd) {
  const q = plain(o.q).trim();
  const steps = (o.steps || []).map((s) => plain(s).trim());
  const hint = plain(o.hint || "").trim();
  const unit = o.unit || "";
  const coef = /□/.test(q);                                   // 「□π cm²。□は？」の型：答えの数だけを選ぶ
  const withUnit = (v) => {
    if (coef || !unit) return String(v);
    const m = /^(\d+)\/(\d+)$/.exec(String(v));
    if (m) {                                                   // 分数＋単位：割り切れる小数にできるなら小数に、できなければ「n/d cm³」
      let d = +m[2]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
      if (d === 1) return `${+m[1] / +m[2]}${unit}`;
      return `${v} ${unit}`;
    }
    return `${v}${unit}`;
  };
  let correctText, wrong;                                      // wrong: [{ t, w, kind }]
  if (o.choices) {
    let texts = o.choices.map((c) => plain(typeof c === "number" ? withUnit(c) : String(c)).trim());
    if (texts.length === 3 && texts.every((t) => /あふれ|いっぱい|すきま/.test(t))) texts = [...texts, "この条件だけでは、決められない"];
    correctText = plain(typeof o.ans === "number" ? withUnit(o.ans) : String(o.ans)).trim();
    if (texts.filter((t) => t === correctText).length !== 1 || new Set(texts).size !== texts.length || texts.length !== 4) return fail(tpl, "選択肢が4つにならない／正解が1つに決まらない");
    wrong = texts.filter((t) => t !== correctText).map((t) => ({ t, w: null, kind: "template" }));
  } else {
    const A = parseAns(o.ans);
    if (!A) return fail(tpl, "答えが小数");                      // 小数の答えは、この版では扱わない
    const ds = makeDistractors({ q, ans: o.ans, steps }, 3, rnd);
    if (!ds) return fail(tpl, "誤答が3つ作れない");
    correctText = withUnit(fmtRat(A));
    wrong = ds.map((d) => ({ t: withUnit(fmtRat(d.v)), w: d.w, kind: d.kind }));
  }
  const bad = [q, hint, correctText, ...steps, ...wrong.map((x) => x.t)].map(leftover).find(Boolean);
  if (bad) return fail(tpl, "数式の記号が残った: " + bad);
  const e = steps.length ? steps.join("\n") : hint;
  return { q, correctText, wrong, e, h: hint, src: tpl.id };
}

// ── 1つの解説・1つの段階から、5問を選ぶ ──
function pickProblems(unit, level, lessonNo, seedBase, taken) {
  const tpls = unit.levels[level] || [];
  if (!tpls.length) return [];
  const rnd0 = mulberry(hash(`${unit.id}:${level}:${seedBase}`));
  const order = shuffle(rnd0, tpls);
  const picked = [], seenQ = new Set(taken);
  for (let round = 0; round < 30 && picked.length < PER_LEVEL; round++) {
    for (const tpl of order) {
      if (picked.length >= PER_LEVEL) break;
      for (let attempt = 0; attempt < 25; attempt++) {
        const seed = hash(`${tpl.id}:${round}:${attempt}:${seedBase}`);
        const rnd = mulberry(seed);
        let o = null; try { o = tpl.build(ri(rnd)); } catch (e) { o = null; }
        if (!o || o.skip) continue;
        const p = convert(o, tpl, rnd);
        if (!p || seenQ.has(p.q)) continue;
        seenQ.add(p.q); picked.push(p); break;
      }
    }
  }
  return picked;
}

const UNIT_SEED = "kukan-bank-v1";
const bank = [], meta = {}, shortage = [];
const lessons = UNITS.filter((u) => u.id.startsWith("J1-kk"));
for (const unit of lessons) {
  const no = unit.id.slice(-2);
  const lessonId = `kukan-${no}`;
  const seenAll = new Set();
  for (const level of [1, 2, 3, 4]) {
    const picked = pickProblems(unit, level, no, UNIT_SEED, seenAll);
    picked.slice(0, PER_LEVEL).forEach((p, i) => {
      seenAll.add(p.q);
      const id = `J1-SP-K${no}-L${level}-${String(i + 1).padStart(2, "0")}`;
      const rnd = mulberry(hash(id));
      const opts = shuffle(rnd, [{ t: p.correctText, correct: true }, ...p.wrong.map((x) => ({ t: x.t, w: x.w, kind: x.kind }))]);
      const c = opts.map((x) => {
        if (x.correct) return { t: x.t, k: 1 };
        const o = { t: x.t }; const m = misconceptionOf(x.w); if (m) o.m = m; if (x.w) o.w = x.w; return o;
      });
      bank.push({ id, u: "J1-SP", s: `J1-SP-K${no}`, l: lessonId, d: level, q: p.q, c, e: p.e, h: p.h });
      meta[id] = { lesson: lessonId, lessonName: NAME_OF[unit.id], level, levelName: LEVEL_NAME[level], from: `ikkan/kotsu/content/kukan-${no}.js ${p.src}`,
        distractors: opts.filter((x) => !x.correct).map((x) => x.kind) };
    });
    if (picked.length < PER_LEVEL) shortage.push({ lesson: lessonId, level, got: Math.min(picked.length, PER_LEVEL) });
  }
}
fs.writeFileSync(path.join(HERE, "bank.json"), JSON.stringify(bank, null, 1) + "\n");
fs.writeFileSync(path.join(HERE, "meta.json"), JSON.stringify(meta, null, 1) + "\n");
const kinds = { family: 0, step: 0, near: 0, template: 0 };
Object.values(meta).forEach((m) => m.distractors.forEach((k) => { kinds[k]++; }));
if (process.env.DEBUG_FAILS) console.log(FAILS);
console.log(`問題 ${bank.length}問（解説 ${lessons.length}本 × 4段階 × ${PER_LEVEL}問 = ${lessons.length * 4 * PER_LEVEL} が目標）`);
console.log("足りない（解説・段階）:", shortage.length ? JSON.stringify(shortage) : "なし");
const total = Object.values(kinds).reduce((a, b) => a + b, 0);
console.log("誤答の出どころ:", kinds, `（理由つき ${bank.reduce((n, p) => n + p.c.filter((x) => x.w).length, 0)} / 誤答 ${total}）`);
