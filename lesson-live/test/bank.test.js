// 問題バンクの自己検査: node lesson-live/test/bank.test.js
//  ・模範解答が自分の採点で正解になるか
//  ・計算問題は問題文の式を実際に計算して答えと一致するか（v:1 / v:"eq" / chk）
//  ・「よくある間違い（miss）」がちゃんと不正解になるか
//  ・問題文中の $...$ が数式として読めるか
const path = require("path");
global.window = global;
const LM = require("../js/math.js");
require("../js/curriculum.js");
for (let u = 1; u <= 7; u++) require(`../js/bank/u${u}.js`);
const LL = global.LL;

let pass = 0, fail = 0;
const errs = [];
function check(cond, msg) { if (cond) pass++; else { fail++; errs.push(msg); } }

function rawOf(sub, mode) {
  const a = sub.a;
  switch (mode) {
    case "coord": return `(${a[0]},${a[1]})`;
    case "list": case "set": return a.join(",");
    case "text": case "form": return Array.isArray(a) ? a[0] : a;
    case "factor": return sub.show;
    default: return String(a);
  }
}
function mathsIn(text) {
  const out = []; const re = /\$([^$]+)\$/g; let m;
  while ((m = re.exec(String(text || "")))) out.push(m[1]);
  return out;
}
function checkMathText(text, where) {
  for (const m of mathsIn(text)) {
    let ok = true;
    try { LM.parseRelation(m); } catch (e) { ok = false; }
    check(ok, `${where}: 数式が読めない $${m}$`);
  }
}
function numVal(a) { return typeof a === "number" ? a : LM.evalAST(LM.parse(String(a)), {}); }

function checkSub(sub, q, where) {
  const mode = sub.mode || q.mode;
  check(!!mode, `${where}: mode がない`);
  if (!mode) return;
  const g = LM.gradeSub({ ...q, ...sub, mode }, rawOf(sub, mode));
  check(g.ok, `${where}: 模範解答が不正解になる (${mode} ${JSON.stringify(sub.a)} why=${g.why})`);
  // 計算の検算
  if (sub.v === 1) {
    const exprs = mathsIn(sub.p || q.lead).filter(t => { try { LM.parse(t); return true; } catch (e) { return false; } });
    const m = exprs[exprs.length - 1];
    if (mode === "num") {
      const v = LM.evalAST(LM.parse(m), q.env || {});
      check(Math.abs(v - numVal(sub.a)) < 1e-9, `${where}: 検算ちがい ${m} = ${v} なのに答え ${sub.a}`);
    } else {
      check(LM.equivalent(LM.parse(m), LM.parse(String(sub.a).replace(/^y=/, ""))), `${where}: 式の検算ちがい ${m} ≠ ${sub.a}`);
    }
  }
  if (sub.v === "eq") {
    const m = LM.mathIn(sub.p || q.lead);
    const r = LM.parseRelation(m);
    const x = numVal(sub.a);
    const L = LM.evalAST(r.sides[0], { x }), Rr = LM.evalAST(r.sides[1], { x });
    check(Math.abs(L - Rr) < 1e-9, `${where}: 方程式の解ちがい ${m} に x=${sub.a} → ${L} vs ${Rr}`);
  }
  if (sub.chk) {
    const f = new Function("x", "return " + sub.chk);
    check(f(numVal(sub.a)) === true, `${where}: chk ちがい ${sub.chk} x=${sub.a}`);
  }
  if (sub.miss) {
    for (const k of Object.keys(sub.miss)) {
      const gw = LM.gradeSub({ ...q, ...sub, mode }, k);
      check(!gw.ok, `${where}: よくある間違い「${k}」が正解になってしまう`);
    }
  }
  checkMathText(sub.p, where);
}

function checkQuestion(q, where) {
  checkMathText(q.lead, where + " lead");
  if (q.hint) checkMathText(q.hint, where + " hint");
  if (q.type === "input") {
    check(Array.isArray(q.subs) && q.subs.length, `${where}: subs がない`);
    q.subs.forEach((s, i) => checkSub(s, q, `${where}[${i}]`));
  } else if (q.type === "choice") {
    check(Array.isArray(q.choices) && q.choices.length >= 2, `${where}: choices`);
    q.choices.forEach(c => checkMathText(c, where + " choice"));
    q.subs.forEach((s, i) => {
      check(Number.isInteger(s.a) && s.a >= 0 && s.a < q.choices.length, `${where}[${i}]: 選択肢の番号が範囲外`);
      checkMathText(s.p, `${where}[${i}]`);
    });
  } else if (q.type === "multi") {
    check(Array.isArray(q.a) && q.a.length && q.a.every(i => i >= 0 && i < q.choices.length), `${where}: multi の答え`);
    q.choices.forEach(c => checkMathText(c, where + " choice"));
  } else if (q.type === "graph") {
    check(q.fn && (q.fn.kind === "line" || q.fn.kind === "hyper") && q.R > 0, `${where}: graph`);
    // 格子点があるか
    const a = numVal(q.fn.a);
    let found = 0;
    for (let x = -q.R; x <= q.R; x++) for (let y = -q.R; y <= q.R; y++) {
      if (x === 0) continue;
      if (q.fn.kind === "line" ? Math.abs(y - a * x) < 1e-9 : Math.abs(x * y - a) < 1e-9) found++;
    }
    check(found >= 2, `${where}: グラフ上の格子点が少ない`);
  } else if (q.type === "plot") {
    check(q.points.every(([, x, y]) => Math.abs(x) <= q.R && Math.abs(y) <= q.R), `${where}: plot の点が範囲外`);
  } else {
    check(false, `${where}: 未知の type ${q.type}`);
  }
}

const ids = new Set();
let subCount = 0;
for (const l of LL.LESSONS) {
  check(!ids.has(l.id), `重複 id ${l.id}`); ids.add(l.id);
  check(l.title && l.goal && l.limit > 0, `${l.id}: title/goal/limit`);
  l.qs.forEach((q, i) => { checkQuestion(q, `${l.id} Q${i + 1}`); subCount += q.subs ? q.subs.length : 1; });
  if (l.bonus) checkQuestion(l.bonus, `${l.id} ★`);
  if (l.gen) {
    for (let k = 0; k < 30; k++) {
      const subs = l.gen();
      check(subs.length >= 3, `${l.id} gen: 問題数が少ない`);
      subs.forEach((s, i) => {
        const g = LM.gradeSub(s, rawOf(s, s.mode));
        check(g.ok, `${l.id} gen[${i}]: 模範解答が不正解 ${s.p} → ${s.a} (${g.why})`);
        const m = LM.mathIn(s.p);
        if (m && s.mode === "num" && !/のとき/.test(s.p)) {
          let v = NaN; try { v = LM.evalAST(LM.parse(m), {}); } catch (e) { /* 方程式など */ }
          if (isFinite(v)) check(Math.abs(v - numVal(s.a)) < 1e-9, `${l.id} gen[${i}]: 検算ちがい ${m}=${v} vs ${s.a}`);
        }
        if (m && s.mode === "num" && /=/.test(m)) {
          const r = LM.parseRelation(m), x = numVal(s.a);
          check(Math.abs(LM.evalAST(r.sides[0], { x }) - LM.evalAST(r.sides[1], { x })) < 1e-9, `${l.id} gen[${i}]: 方程式の解ちがい ${m} x=${s.a}`);
        }
      });
    }
  }
}
const perUnit = LL.UNITS.map(u => `${u.short}:${LL.lessonsOf(u.no).length}`).join(" ");
console.log(`bank: ${LL.LESSONS.length} 回 / 小問 ${subCount} （${perUnit}）`);
errs.slice(0, 60).forEach(e => console.log("NG:", e));
console.log(`bank: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
