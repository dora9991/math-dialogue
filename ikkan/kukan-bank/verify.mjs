// verify.mjs — bank.json（解説ごとの演習 300問）の機械検査
//
//   node ikkan/kukan-bank/verify.mjs
//
// 見ること：
//   ① 形：15解説 × 4段階（d=1〜4）× 5問。id が重ならない。選択肢は4つ、正解（k:1）はちょうど1つ、文面が重ならない
//   ② 文字：TeX の記号（$ \ ^ { }）が残っていない。空の文字列がない
//   ③ 正解と誤答が「数として同じ」になっていない（例 0.5 と 1/2、12 と 12.0）
//   ④ 解説(e)の中に、正解の数が出てくる（数値の問題のみ。目安）
//   ⑤ 同じ解説の中で、同じ問題文が重なっていない（段階をまたいでも）
//   ⑥ 正解の位置のかたより（4つの位置にまんべんなく散っているか）
//   ⑦ 誤答のうち、「まちがえ方の理由」(w) が付いているものの割合
// 答えの正しさ（解き直し）は、この検査ではできない。bank-blind.json（正解を伏せた版）を別の目で解き直して突き合わせる（README 参照）。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bank = JSON.parse(fs.readFileSync(path.join(HERE, "bank.json"), "utf8"));
const errors = [], warns = [];
const err = (id, m) => errors.push(`✗ ${id}: ${m}`);
const warn = (id, m) => warns.push(`△ ${id}: ${m}`);

const numOf = (t) => {                                  // 「135cm³」「32/3」「12π」→ 数。数でなければ null
  const s = String(t).replace(/\s/g, "").replace(/(cm|m|mm)[²³]?$/, "").replace(/(本|個|面|つ|枚|回|倍)$/, "");
  let m = /^(-?\d+(?:\.\d+)?)$/.exec(s); if (m) return Number(m[1]);
  m = /^(\d+)\/(\d+)$/.exec(s); if (m) return Number(m[1]) / Number(m[2]);
  return null;
};

const ids = new Set(), cell = {}, qSeen = {};
let reasons = 0, wrongs = 0; const posCount = [0, 0, 0, 0];
for (const p of bank) {
  if (ids.has(p.id)) err(p.id, "id が重なっている"); ids.add(p.id);
  if (p.u !== "J1-SP") err(p.id, `u が J1-SP でない: ${p.u}`);
  if (![1, 2, 3, 4].includes(p.d)) err(p.id, `d が 1〜4 でない: ${p.d}`);
  if (!/^kukan-(0[1-9]|1[0-5])$/.test(p.l)) err(p.id, `l が kukan-01〜15 でない: ${p.l}`);
  if (p.s !== `J1-SP-K${p.l.slice(-2)}`) err(p.id, `s と l が合わない: ${p.s} / ${p.l}`);
  if (!new RegExp(`^J1-SP-K${p.l.slice(-2)}-L${p.d}-0[1-5]$`).test(p.id)) err(p.id, "id が l・d と合わない");
  (cell[`${p.l}/${p.d}`] ||= []).push(p.id);

  // 形
  if (!Array.isArray(p.c) || p.c.length !== 4) { err(p.id, `選択肢が ${p.c?.length} 個`); continue; }
  const ks = p.c.filter((x) => x.k === 1);
  if (ks.length !== 1) err(p.id, `正解が ${ks.length} 個`);
  const texts = p.c.map((x) => x.t);
  if (new Set(texts).size !== texts.length) err(p.id, "選択肢の文面が重なっている");
  if (texts.some((t) => !String(t).trim())) err(p.id, "空の選択肢");
  p.c.forEach((x, i) => { if (x.k === 1) posCount[i]++; });

  // 文字
  for (const [k, v] of Object.entries({ q: p.q, e: p.e, h: p.h, ...Object.fromEntries(texts.map((t, i) => ["c" + i, t])) })) {
    if (!String(v ?? "").trim() && (k === "q" || k === "e")) err(p.id, `${k} が空`);
    if (/[$\\^{}]/.test(String(v ?? ""))) err(p.id, `${k} に TeX の記号が残っている: ${String(v).slice(0, 60)}`);
  }

  // 数として同じ誤答
  const right = ks[0] && numOf(ks[0].t);
  if (right != null) {
    p.c.filter((x) => x.k !== 1).forEach((x) => { const n = numOf(x.t); if (n != null && Math.abs(n - right) < 1e-9) err(p.id, `誤答「${x.t}」が正解と同じ数`); });
    // 解説に、正解の数が出てくるか（目安）
    const shown = String(ks[0].t).replace(/\s/g, "").replace(/(cm|m|mm)[²³]?$/, "");
    const flat = String(p.e).replace(/\s/g, "");
    if (!flat.includes(shown) && !flat.includes(String(right))) warn(p.id, `解説に正解「${ks[0].t}」が出てこない`);
  }
  // 問題文の重なり
  const qk = `${p.l}|${p.q}`;
  if (qSeen[qk]) err(p.id, `${qSeen[qk]} と同じ問題文`); else qSeen[qk] = p.id;

  p.c.filter((x) => x.k !== 1).forEach((x) => { wrongs++; if (x.w) reasons++; });
}

// ① 個数
for (let l = 1; l <= 15; l++) for (const d of [1, 2, 3, 4]) {
  const key = `kukan-${String(l).padStart(2, "0")}/${d}`;
  const n = (cell[key] || []).length;
  if (n !== 5) err(key, `${n}問（5問のはず）`);
}
if (bank.length !== 300) err("全体", `${bank.length}問（300問のはず）`);

console.log(`検査した問題: ${bank.length}`);
console.log(`正解の位置（1〜4番目）: ${posCount.join(" / ")}`);
console.log(`誤答 ${wrongs} のうち、まちがえ方の理由つき ${reasons}（${Math.round((reasons / wrongs) * 100)}%）`);
if (warns.length) { console.log(`\n警告 ${warns.length} 件:`); warns.slice(0, 30).forEach((w) => console.log(w)); if (warns.length > 30) console.log(`…ほか ${warns.length - 30} 件`); }
if (errors.length) { console.log(`\nエラー ${errors.length} 件:`); errors.forEach((e) => console.log(e)); process.exit(1); }
console.log("\nエラーなし");
