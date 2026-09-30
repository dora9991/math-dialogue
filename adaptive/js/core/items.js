// ============================================================
// items.js — 問題（item）の作り方と採点
//
//  テンプレ側は  make(r, level) => num({...}) / choice({...}) / fields({...})
//  を返すだけ。ここで seed・選択肢のシャッフル・検証・採点をまとめて面倒を見る。
//
//  問題の同一性 uid = "スキルID/テンプレID/難易度/seed"
//    → 同じ uid なら必ず同じ問題が出る（「気になる」報告の再現に使う）。
//
//  採点は厳密（有理数）。誤答が既知の「まちがいパターン(mc)」と一致したら
//  その ID を返す。診断ではこれが「なぜ間違えたか」の手がかりになる。
// ============================================================
import { makeRng, hashSeed } from "./rng.js";
import { Q, toQ, eq, parseInput, looksLikeFraction, isReducedText } from "./rational.js";

/** 難易度（1=基本 2=標準 3=発展）の目盛り。Rasch モデルの b（ロジット）として使う */
export const LEVEL_B = { 1: -1.25, 2: 0, 3: 1.25 };
export const LEVEL_LABEL = { 1: "やさしい", 2: "ふつう", 3: "むずかしい" };

// ------------------------------------------------------------
// 問題の部品（spec）を作る関数
// ------------------------------------------------------------

/**
 * 数値を入力する問題。
 *  ans     … 正解（数 or Q）
 *  wrongs  … [[誤答の値, "MC-ID"], …] 入力がこれと一致したら まちがいパターンを記録
 *  reduced … true なら「約分した形」で答える必要がある
 *  mixed   … true なら 帯分数（"2 1/3"）の入力も受け付ける
 *  pre/post… 入力欄の前後に出す文字（マークアップ）。post は単位など
 */
export function num(o) {
  return { kind: "num", ...o };
}

/**
 * 選択式。correct は正解ラベル、wrongs は [[ラベル, "MC-ID"(省略可)], …]。
 * ラベルはマークアップ文字列（$…$ で TeX）。
 */
export function choice(o) {
  return { kind: "choice", ...o };
}

/**
 * 複数の欄に入力する問題（連立方程式の x, y／座標／根号の形 など）。
 *  fields  … [{ id, value, pre?, post? }]
 *  layout  … "inline"(既定) | "lines" | "frac" | "mixed" | "sqrt" | "sqrtfrac"
 *  orderFree … true なら欄の順序は問わない（2つの解など）
 *  wrongs  … [{ values: {id: 値}, mc }]
 */
export function fields(o) {
  return { kind: "fields", layout: "inline", ...o };
}

// ------------------------------------------------------------
// 仕上げ（検証・シャッフル）
// ------------------------------------------------------------

function fail(uid, msg) {
  throw new Error(`[${uid}] ${msg}`);
}

const isNumLike = (x) => typeof x === "number" || (x && typeof x.n === "number" && typeof x.d === "number");

/** 複数欄の答えが同じか（orderFree なら欄の順序を問わない） */
function sameFieldValues(item, a, b) {
  const ids = item.fields.map((f) => f.id);
  if (!item.orderFree) return ids.every((id) => eq(a[id], b[id]));
  const sa = ids.map((id) => a[id]).sort((p, q) => p.n * q.d - q.n * p.d);
  const sb = ids.map((id) => b[id]).sort((p, q) => p.n * q.d - q.n * p.d);
  return sa.every((x, i) => eq(x, sb[i]));
}

function finalize(spec, r, uid) {
  const it = { ...spec };
  if (typeof it.q !== "string" || !it.q) fail(uid, "q(問題文)がない");
  if (typeof it.explain !== "string" || !it.explain) fail(uid, "explain(解説)がない");

  if (it.kind === "num") {
    if (!isNumLike(it.ans)) fail(uid, "ans が数でない");
    it.ans = toQ(it.ans);
    const seen = [it.ans];
    it.wrongs = (it.wrongs || [])
      .filter(([v]) => isNumLike(v))
      .map(([v, mc]) => [toQ(v), mc])
      .filter(([v]) => {
        if (seen.some((s) => eq(s, v))) return false; // 正解や重複と同じ値は捨てる
        seen.push(v);
        return true;
      });
  } else if (it.kind === "choice") {
    if (typeof it.correct !== "string") fail(uid, "correct(正解ラベル)がない");
    const labels = new Set([it.correct]);
    const wr = [];
    for (const [label, mc] of it.wrongs || []) {
      if (typeof label !== "string" || labels.has(label)) continue; // 正解や重複と同じ選択肢は捨てる
      labels.add(label);
      wr.push({ label, mc: mc || null });
    }
    const want = it.count || 4;
    if (wr.length < want - 1) fail(uid, `誤りの選択肢が足りない(${wr.length}個)`);
    // まちがいパターン付きを優先して残す
    const withMc = r.shuffle(wr.filter((w) => w.mc));
    const noMc = r.shuffle(wr.filter((w) => !w.mc));
    const picked = [...withMc, ...noMc].slice(0, want - 1);
    const all = r.shuffle([{ label: it.correct, correct: true, mc: null }, ...picked.map((w) => ({ ...w, correct: false }))]);
    it.choices = all;
    delete it.wrongs;
  } else if (it.kind === "fields") {
    if (!Array.isArray(it.fields) || it.fields.length === 0) fail(uid, "fields がない");
    for (const f of it.fields) {
      if (!f.id || !isNumLike(f.value)) fail(uid, `欄 ${f.id} の値が数でない`);
      f.value = toQ(f.value);
    }
    const expected = Object.fromEntries(it.fields.map((f) => [f.id, f.value]));
    const seenW = [expected];
    it.wrongs = (it.wrongs || [])
      .map((w) => ({
        mc: w.mc,
        values: Object.fromEntries(Object.entries(w.values).map(([k, v]) => [k, toQ(v)])),
      }))
      // 正解と同じ（欄の順序を問わない場合は並べ替えても同じ）誤答や、重複は捨てる
      .filter((w) => {
        if (seenW.some((s) => sameFieldValues(it, s, w.values))) return false;
        seenW.push(w.values);
        return true;
      });
  } else {
    fail(uid, `未知の kind: ${it.kind}`);
  }
  return it;
}

// ------------------------------------------------------------
// 出題
// ------------------------------------------------------------

/** uid を分解する */
export function parseUid(uid) {
  const [skillId, tplId, level, seed] = uid.split("/");
  return { skillId, tplId, level: Number(level), seed: Number(seed) };
}

/** 難易度 level のとき、その問題の b（ロジット） */
export function itemB(level, tpl) {
  return LEVEL_B[level] + (tpl?.db || 0);
}

/**
 * 問題を1つ作る。
 * @param skill  graph の1スキル（tpl: [{id, make, db?}]）
 * @param level  1〜3
 * @param seed   整数
 * @param tplId  省略すると seed から自動で選ぶ
 */
export function makeItem(skill, level, seed, tplId) {
  const tpls = skill.tpl;
  if (!tpls || tpls.length === 0) throw new Error(`${skill.id}: テンプレがない`);
  const tpl = tplId ? tpls.find((t) => t.id === tplId) : tpls[hashSeed(`tpl|${skill.id}|${seed}`) % tpls.length];
  if (!tpl) throw new Error(`${skill.id}: テンプレ ${tplId} がない`);
  const uid = `${skill.id}/${tpl.id}/${level}/${seed}`;
  const r = makeRng(hashSeed(uid));
  const spec = tpl.make(r, level);
  const it = finalize(spec, r, uid);
  return { uid, skillId: skill.id, tplId: tpl.id, level, seed, b: itemB(level, tpl), ...it };
}

// ------------------------------------------------------------
// 採点
// ------------------------------------------------------------

/** 入力欄が空か */
export function isBlank(text) {
  return !String(text ?? "").trim();
}

/**
 * 採点する。
 * @param item makeItem の結果
 * @param resp { type:"skip" } | { type:"num", text } | { type:"choice", index } | { type:"fields", values:{id:text} }
 * @returns { ok, skipped?, invalid?, mc?, note? }
 *   invalid=true のときは「まだ答えとして成立していない」ので回数に数えない
 */
export function judge(item, resp) {
  if (resp?.type === "skip") return { ok: false, skipped: true, mc: null };

  if (item.kind === "choice") {
    const c = item.choices[resp.index];
    if (!c) return { ok: false, invalid: true };
    return { ok: !!c.correct, mc: c.correct ? null : c.mc };
  }

  if (item.kind === "num") {
    const v = parseInput(resp.text, { mixed: !!item.mixed });
    if (!v) return { ok: false, invalid: true, note: "数の形で入力してください（例: 12, 0.5, 3/4）" };
    if (eq(v, item.ans)) {
      if (item.reduced && looksLikeFraction(resp.text) && !isReducedText(resp.text)) {
        return { ok: false, mc: "MC-NOT-REDUCED", note: "値は合っています。約分できます。" };
      }
      return { ok: true, mc: null };
    }
    const w = item.wrongs.find(([wv]) => eq(wv, v));
    return { ok: false, mc: w ? w[1] : null };
  }

  if (item.kind === "fields") {
    const got = {};
    for (const f of item.fields) {
      const v = parseInput(resp.values?.[f.id], { mixed: false });
      if (!v) return { ok: false, invalid: true, note: "すべての欄に数を入力してください" };
      got[f.id] = v;
    }
    const same = (a, b) => sameFieldValues(item, a, b);
    const expected = Object.fromEntries(item.fields.map((f) => [f.id, f.value]));
    if (same(got, expected)) return { ok: true, mc: null };
    const w = item.wrongs.find((x) => same(got, x.values));
    return { ok: false, mc: w ? w.mc : null };
  }
  return { ok: false, invalid: true };
}

/** 正解を文字列で（「こたえ」の表示や、テストでの入力用） */
export function answerText(item) {
  if (item.kind === "choice") {
    const i = item.choices.findIndex((c) => c.correct);
    return `${"ABCDE"[i]}`;
  }
  if (item.kind === "num") {
    const a = item.ans;
    return a.d === 1 ? String(a.n) : `${a.n}/${a.d}`;
  }
  return item.fields.map((f) => (f.value.d === 1 ? String(f.value.n) : `${f.value.n}/${f.value.d}`)).join(", ");
}

/** テスト用：正解の response を作る */
export function correctResponse(item) {
  if (item.kind === "choice") return { type: "choice", index: item.choices.findIndex((c) => c.correct) };
  if (item.kind === "num") {
    const a = item.ans;
    return { type: "num", text: a.d === 1 ? String(a.n) : `${a.n}/${a.d}` };
  }
  const values = {};
  for (const f of item.fields) values[f.id] = f.value.d === 1 ? String(f.value.n) : `${f.value.n}/${f.value.d}`;
  return { type: "fields", values };
}

export { Q };
