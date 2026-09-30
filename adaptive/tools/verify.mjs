// ============================================================
// verify.mjs — 知識グラフと問題テンプレの一括検査
//
//   node adaptive/tools/verify.mjs [--seeds 40] [--skill ID] [--sample 3] [--strict]
//
//  グラフ：重複・未知の前提・循環・学年の逆転・ポイント文の TeX
//  各テンプレ×難易度×seed で、次を機械的に確かめる：
//   ・例外が出ない／同じ uid で同じ問題になる
//   ・TeX が KaTeX で正しく描画できる（未対応コマンドや $ の不整合を検出）
//   ・NaN / undefined / Infinity などの文字が出ていない
//   ・正解が正解として採点される／誤答の値・選択肢が正解と混ざらず、まちがいパターンが返る
//   ・宣言した kind と実際の kind が一致する
//   ・問題文のバリエーション（同じ問題ばかりになっていない）
//   ・まちがいパターン(MC)が辞書にあり、責任単元が実在する
// ============================================================
import { createRequire } from "node:module";
import { SKILLS, ALL_IDS, validateGraph, STRANDS, stageLabel } from "../js/data/graph.js";
import { MISCONCEPTIONS } from "../js/data/misconceptions.js";
import { makeItem, judge, correctResponse, LEVEL_LABEL } from "../js/core/items.js";
import { parseMarkup, mathParts, plainText } from "../js/core/markup.js";

const require = createRequire(import.meta.url);
const katex = require("../vendor/katex/katex.min.js");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const SEEDS = Number(opt("seeds", 40));
const ONLY = opt("skill", null);
const SAMPLE = Number(opt("sample", 0));
const BRIEF = args.includes("--brief");
const GROUPED = args.includes("--grouped"); // 種の違いをまとめて、原因ごとの件数で表示する

let errors = 0;
const errList = [];
const allErrs = [];
const err = (where, msg) => {
  errors++;
  allErrs.push([where, msg]);
  if (errList.length < 60) errList.push(`  ✗ ${where}: ${msg}`);
};

// ── TeX の検査 ──────────────────────────────────────
function checkMarkup(where, str) {
  if (typeof str !== "string") return err(where, "文字列でない");
  let parts;
  try {
    parts = parseMarkup(str);
  } catch (e) {
    return err(where, e.message);
  }
  if (/undefined|NaN|Infinity|\[object|null/.test(str)) err(where, `異常な文字列: ${str.slice(0, 80)}`);
  for (const p of parts) {
    if (!p.math) continue;
    try {
      katex.renderToString(p.s, { throwOnError: true, strict: "error", output: "html" });
    } catch (e) {
      err(where, `TeX エラー「${p.s.slice(0, 60)}」 ${e.message.slice(0, 80)}`);
    }
  }
}

// ── グラフ ──────────────────────────────────────────
console.log("■ 知識グラフ");
for (const e of validateGraph()) err("graph", e);
for (const s of Object.values(SKILLS)) {
  checkMarkup(`point:${s.id}`, s.point);
  checkMarkup(`name:${s.id}`, s.name);
}
for (const [id, m] of Object.entries(MISCONCEPTIONS)) {
  if (m.blame && !SKILLS[m.blame]) err(`MC ${id}`, `責任単元 ${m.blame} が存在しない`);
  if (!m.name) err(`MC ${id}`, "name がない");
}
console.log(`  単元 ${ALL_IDS.length}、まちがいパターン ${Object.keys(MISCONCEPTIONS).length}`);

// ── テンプレ ────────────────────────────────────────
console.log("\n■ 問題テンプレ");
const missing = [];
const usedMc = new Set();
const stats = { items: 0, byKind: {}, templates: 0 };
const variety = [];

const targets = ALL_IDS.filter((id) => !ONLY || id === ONLY);
for (const id of targets) {
  const sk = SKILLS[id];
  if (!sk.tpl.length) {
    missing.push(id);
    continue;
  }
  for (const tpl of sk.tpl) {
    stats.templates++;
    for (const level of [1, 2, 3]) {
      const texts = new Set();
      for (let seed = 1; seed <= SEEDS; seed++) {
        const where = `${id}/${tpl.id}/L${level}/s${seed}`;
        let it;
        try {
          it = makeItem(sk, level, seed, tpl.id);
        } catch (e) {
          err(where, `生成で例外: ${e.message}`);
          continue;
        }
        stats.items++;
        stats.byKind[it.kind] = (stats.byKind[it.kind] || 0) + 1;
        if (it.kind !== tpl.kind) err(where, `kind の宣言(${tpl.kind})と実際(${it.kind})が違う`);
        // 再現性
        try {
          const again = makeItem(sk, level, seed, tpl.id);
          if (JSON.stringify(again) !== JSON.stringify(it)) err(where, "同じ uid で違う問題になる");
        } catch (e) {
          err(where, `再生成で例外: ${e.message}`);
        }
        texts.add(it.q + "|" + (it.fig || "") + "|" + (it.choices ? it.choices.map((c) => c.label).sort().join(",") : "") + "|" + (it.fields ? it.fields.map((f) => f.value.n + "/" + f.value.d).join(",") : ""));
        // マークアップ
        checkMarkup(`${where} q`, it.q);
        checkMarkup(`${where} explain`, it.explain);
        for (const k of ["pre", "post", "unit"]) if (it[k]) checkMarkup(`${where} ${k}`, it[k]);
        if (it.hint) checkMarkup(`${where} hint`, it.hint);
        if (it.fig && !(it.fig.startsWith("<svg") && it.fig.endsWith("</svg>") && !/NaN|undefined|Infinity/.test(it.fig))) err(where, "図(SVG)が不正");
        if (it.kind === "choice") {
          it.choices.forEach((c, i) => checkMarkup(`${where} choice${i}`, c.label));
          if (it.choices.filter((c) => c.correct).length !== 1) err(where, "正解が1つでない");
          if (new Set(it.choices.map((c) => c.label)).size !== it.choices.length) err(where, "選択肢が重複");
        }
        if (it.kind === "fields") {
          for (const f of it.fields) {
            if (f.pre) checkMarkup(`${where} field.pre`, f.pre);
            if (f.post) checkMarkup(`${where} field.post`, f.post);
          }
        }
        // 採点
        try {
          const good = judge(it, correctResponse(it));
          if (!good.ok) err(where, `正解が不正解と採点された（${JSON.stringify(correctResponse(it))}）`);
          if (it.kind === "choice") {
            it.choices.forEach((c, i) => {
              if (c.correct) return;
              const j = judge(it, { type: "choice", index: i });
              if (j.ok) err(where, `誤りの選択肢 ${i} が正解と採点された`);
              if (c.mc) {
                usedMc.add(c.mc);
                if (j.mc !== c.mc) err(where, `選択肢の MC ${c.mc} が返らない`);
              }
            });
          } else if (it.kind === "num") {
            for (const [v, mc] of it.wrongs) {
              const text = v.d === 1 ? String(v.n) : `${v.n}/${v.d}`;
              const j = judge(it, { type: "num", text });
              if (j.ok) err(where, `誤答値 ${text} が正解と採点された`);
              if (mc) usedMc.add(mc);
              if (mc && j.mc !== mc) err(where, `誤答値 ${text} の MC ${mc} が返らない(${j.mc})`);
            }
            if (Math.abs(it.ans.n) > 1e9 || it.ans.d > 1e9) err(where, "答えが大きすぎる");
          } else if (it.kind === "fields") {
            for (const w of it.wrongs) {
              const values = Object.fromEntries(Object.entries(w.values).map(([k, v]) => [k, v.d === 1 ? String(v.n) : `${v.n}/${v.d}`]));
              const j = judge(it, { type: "fields", values });
              if (j.ok) err(where, `誤答 ${JSON.stringify(values)} が正解と採点された`);
              if (w.mc) usedMc.add(w.mc);
              if (w.mc && j.mc !== w.mc) err(where, `複数欄の MC ${w.mc} が返らない`);
            }
          }
        } catch (e) {
          err(where, `採点で例外: ${e.message}`);
        }
        if (BRIEF && SAMPLE && seed <= SAMPLE) {
          const ans = it.kind === "num" ? `${it.ans.d === 1 ? it.ans.n : `${it.ans.n}/${it.ans.d}`}${it.post || ""}` : it.kind === "fields" ? it.fields.map((f) => `${f.id}=${f.value.d === 1 ? f.value.n : `${f.value.n}/${f.value.d}`}`).join(",") : `[${it.choices.findIndex((c) => c.correct)}]${it.choices.find((c) => c.correct).label}`;
          console.log(`${id}/${tpl.id} L${level}: ${it.q.replace(/\n/g, " ")} ⇒ ${ans}${it.kind === "choice" ? "  | " + it.choices.map((c) => c.label).join(" / ") : ""}`);
        } else if (SAMPLE && seed <= SAMPLE) {
          console.log(`--- ${id}/${tpl.id} L${level} (${LEVEL_LABEL[level]}) seed=${seed}`);
          console.log("  Q:", it.q.replace(/\n/g, "\n     "));
          if (it.kind === "choice") it.choices.forEach((c, i) => console.log(`    ${"ABCDE"[i]}. ${c.label}${c.correct ? "  ← 正解" : c.mc ? `  [${c.mc}]` : ""}`));
          if (it.kind === "num") console.log(`  答え: ${it.ans.d === 1 ? it.ans.n : `${it.ans.n}/${it.ans.d}`} ${it.post || it.unit || ""}`, it.wrongs.map(([v, mc]) => `${v.d === 1 ? v.n : `${v.n}/${v.d}`}${mc ? `[${mc}]` : ""}`).join(" "));
          if (it.kind === "fields") console.log("  答え:", it.fields.map((f) => `${f.id}=${f.value.d === 1 ? f.value.n : `${f.value.n}/${f.value.d}`}`).join(", "));
          console.log("  解説:", it.explain.replace(/\n/g, "\n       "));
        }
      }
      variety.push({ id, tpl: tpl.id, level, distinct: texts.size, finite: !!tpl.finite });
    }
  }
}

// 変化の乏しいテンプレ（同じ問題ばかり）
const lowVariety = variety.filter((v) => !v.finite && v.distinct < Math.min(SEEDS, 12) * 0.5); // finite（型の数が少ないのが仕様）は除く
for (const v of lowVariety) err(`${v.id}/${v.tpl}/L${v.level}`, `問題のバリエーションが少ない(${v.distinct}/${SEEDS}種類)`);

// MC の実在
for (const mc of usedMc) if (!MISCONCEPTIONS[mc]) err(`MC ${mc}`, "辞書にない");
const unusedMc = Object.keys(MISCONCEPTIONS).filter((m) => !usedMc.has(m));

console.log(`  テンプレ ${stats.templates} 個、検査した問題 ${stats.items} 問 (${JSON.stringify(stats.byKind)})`);
const withTpl = targets.length - missing.length;
console.log(`  テンプレのある単元 ${withTpl}/${targets.length}`);
if (missing.length && !ONLY) {
  const byStrand = {};
  for (const id of missing) (byStrand[SKILLS[id].strand] ||= []).push(`${id}(${stageLabel(SKILLS[id].stage)})`);
  console.log("  テンプレ未作成:");
  for (const [k, v] of Object.entries(byStrand)) console.log(`    ${STRANDS[k].name}: ${v.join(", ")}`);
}
if (unusedMc.length) console.log(`  （辞書にあるが未使用のまちがいパターン: ${unusedMc.length} 個）`);

console.log("");
if (errors) {
  if (GROUPED) {
    // 「単元/テンプレ/難易度」と、数字をならしたメッセージごとに件数を数える
    const groups = new Map();
    for (const [where, msg] of allErrs) {
      const key = `${where.replace(/\/s\d+/, "")}: ${msg.replace(/[-\d.]+/g, "#").slice(0, 90)}`;
      const g = groups.get(key) || { n: 0, first: `${where}: ${msg}` };
      g.n++;
      groups.set(key, g);
    }
    for (const [k, g] of [...groups].sort((a, b) => b[1].n - a[1].n)) console.log(`  ${String(g.n).padStart(4)} 件  ${k}\n         例) ${g.first.slice(0, 200)}`);
  } else {
    console.log(errList.join("\n"));
    if (errors > errList.length) console.log(`  … ほか ${errors - errList.length} 件（--grouped で原因ごとの件数を表示）`);
  }
  console.log(`\n✗ 問題あり: ${errors} 件`);
  process.exit(1);
} else {
  console.log("✓ 検査 OK");
}
