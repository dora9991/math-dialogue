/* 授業ライブ — 小テストの採点（生徒の画面と、先生の画面の「採点し直し」で共通） */
(function (root) {
  "use strict";
  const LM = root.LM;

  function items(lesson) {
    const out = [];
    lesson.qs.forEach((q, qi) => {
      if (q.type === "input" || q.type === "choice") q.subs.forEach((sub, si) => out.push({ k: `${qi}.${si}`, qi, si, q, sub, type: q.type, max: 1 }));
      else if (q.type === "plot") out.push({ k: `${qi}`, qi, q, type: "plot", max: q.points.length });
      else out.push({ k: `${qi}`, qi, q, type: q.type, max: 1 });
    });
    return out;
  }
  function bonusItem(lesson) {
    const b = lesson.bonus;
    if (!b) return null;
    const sub = b.subs ? b.subs[0] : null;
    return { k: "b", qi: "b", si: 0, q: b, sub, type: b.type, max: 0, bonus: true };
  }
  const modeOf = it => (it.sub && it.sub.mode) || it.q.mode;
  function subSpec(it) {
    const q = it.q, s = it.sub || {};
    return Object.assign({}, { scale: q.scale, notSolved: q.notSolved, allowUnreduced: q.allowUnreduced }, s, { mode: modeOf(it) });
  }

  function num(a) { return typeof a === "number" ? a : LM.evalAST(LM.parse(String(a)), {}); }

  function gradeGraph(fn, pts) {
    if (!Array.isArray(pts) || !pts.length) return { ok: false, why: "empty" };
    const a = num(fn.a);
    const on = ([x, y]) => (fn.kind === "line" ? Math.abs(y - a * x) < 1e-9 : x !== 0 && Math.abs(x * y - a) < 1e-9);
    if (fn.kind === "line") {
      const p = pts.filter(([x, y]) => !(x === 0 && y === 0));
      if (!p.length) return { ok: false, why: "graphNeed" };
      return { ok: p.every(on) };
    }
    const ok = pts.every(on) && pts.some(p => p[0] > 0) && pts.some(p => p[0] < 0);
    if (!ok && pts.every(on)) return { ok: false, why: "graphBoth" };
    return { ok };
  }

  // よくある間違い（miss）に当てはまるか
  function missOf(it, raw) {
    const s = it.sub;
    if (!s || !s.miss || raw == null || raw === "") return null;
    const mode = modeOf(it);
    for (const key of Object.keys(s.miss)) {
      let a = key;
      if (mode === "coord") { const m = key.replace(/[()\s]/g, "").split(","); a = m.map(Number); }
      else if (mode === "list" || mode === "set") a = key.split(",").map(x => x.trim());
      else if (mode === "form" || mode === "text") a = [key];
      try {
        const g = LM.gradeSub(Object.assign({}, subSpec(it), { a, scale: true, lenient: true, allowUnreduced: true }), raw);
        if (g.ok) return s.miss[key];
      } catch (e) { /* 比べられない形 */ }
    }
    return null;
  }

  function gradeItem(it, a) {
    let g;
    if (it.type === "input") {
      g = LM.gradeSub(subSpec(it), a);
      if (!g.ok) g.miss = missOf(it, a);
    } else if (it.type === "choice") {
      g = { ok: a !== undefined && a !== null && a !== "" && +a === it.sub.a, why: a == null || a === "" ? "empty" : null };
    } else if (it.type === "multi") {
      const sel = Array.isArray(a) ? [...a].map(Number).sort((x, y) => x - y) : [];
      const right = [...it.q.a].sort((x, y) => x - y);
      g = { ok: sel.length === right.length && sel.every((v, i) => v === right[i]), why: sel.length ? null : "empty" };
    } else if (it.type === "graph") {
      g = gradeGraph(it.q.fn, a);
    } else if (it.type === "plot") {
      const placed = a && typeof a === "object" ? a : {};
      const n = it.q.points.filter(([lab, x, y]) => placed[lab] && placed[lab][0] === x && placed[lab][1] === y).length;
      return { ok: n === it.q.points.length, pts: n, why: Object.keys(placed).length ? null : "empty" };
    } else {
      g = { ok: false };
    }
    g.pts = g.ok ? 1 : 0;
    return g;
  }

  // answers: { "0.1": "-3", "2": [0,2], "b": ... } → 採点結果
  function grade(lesson, answers) {
    answers = answers || {};
    const res = [];
    let score = 0, max = 0;
    for (const it of items(lesson)) {
      const g = gradeItem(it, answers[it.k]);
      res.push({ k: it.k, a: answers[it.k] === undefined ? null : answers[it.k], ok: g.ok, pts: g.pts, max: it.max, why: g.why || null, miss: g.miss || null });
      score += g.pts; max += it.max;
    }
    const perfect = max > 0 && score === max;
    let bonus = null;
    const bi = bonusItem(lesson);
    if (bi) {
      const g = gradeItem(bi, answers.b);
      bonus = { a: answers.b === undefined ? null : answers.b, ok: g.ok, why: g.why || null, miss: g.miss || null, awarded: g.ok && perfect };
      if (bonus.awarded) score += 1;
    }
    return { items: res, score, max, bonus, perfect };
  }

  // サーバーへ送る形（小さく）
  function payload(g) {
    return {
      v: 1,
      items: g.items.map(r => ({ k: r.k, a: r.a, ok: r.ok, pts: r.pts })),
      bonus: g.bonus ? { a: g.bonus.a, ok: g.bonus.ok, awarded: g.bonus.awarded } : null,
    };
  }
  // 送られてきた形 → answers
  function answersFrom(p) {
    const a = {};
    ((p && p.items) || []).forEach(r => { if (r.a !== null && r.a !== undefined) a[r.k] = r.a; });
    if (p && p.bonus && p.bonus.a !== null && p.bonus.a !== undefined) a.b = p.bonus.a;
    return a;
  }

  function findItem(lesson, k) {
    if (k === "b") return bonusItem(lesson);
    return items(lesson).find(it => it.k === k) || null;
  }

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pt = p => `(${p[0]}, ${p[1]})`;

  function rightHTML(it) {
    if (it.type === "input") return LM.answerHTML(subSpec(it));
    if (it.type === "choice") return LM.richText(it.q.choices[it.sub.a]);
    if (it.type === "multi") return it.q.a.map(i => LM.richText(it.q.choices[i])).join("、");
    if (it.type === "graph") return it.q.fn.kind === "line" ? `原点と ${LM.toHTML(`y=${it.q.fn.a}x`)} 上の格子点` : `${LM.toHTML(`y=${it.q.fn.a}/x`)} 上の格子点（x＞0 と x＜0 に 1 つずつ）`;
    if (it.type === "plot") return it.q.points.map(([l, x, y]) => `${esc(l)}${pt([x, y])}`).join("　");
    return "";
  }
  function userHTML(it, a) {
    if (a === null || a === undefined || a === "" || (Array.isArray(a) && !a.length)) return `<span class="muted">（未回答）</span>`;
    if (it.type === "input") { const pv = LM.preview(a, modeOf(it)); return pv.html || esc(a); }
    if (it.type === "choice") return LM.richText(it.q.choices[+a] || "");
    if (it.type === "multi") return (a || []).map(i => LM.richText(it.q.choices[i] || "")).join("、");
    if (it.type === "graph") return (a || []).map(pt).join(" ");
    if (it.type === "plot") return Object.keys(a).map(l => `${esc(l)}${pt(a[l])}`).join("　");
    return esc(JSON.stringify(a));
  }
  function whyText(g) {
    if (!g) return "";
    if (g.miss) return g.miss;
    if (g.why === "graphNeed") return "原点以外の点を選ぼう";
    if (g.why === "graphBoth") return "x が正の側と負の側に 1 点ずつ選ぼう";
    if (g.why && g.why !== "empty" && LM.WHY[g.why]) return LM.WHY[g.why];
    return "";
  }
  function label(it) {
    if (it.bonus) return "★チャレンジ";
    const qn = `問${it.qi + 1}`;
    return it.sub && it.sub.lb ? `${qn} ${it.sub.lb}` : qn;
  }

  root.QC = { items, bonusItem, gradeItem, grade, payload, answersFrom, findItem, rightHTML, userHTML, whyText, label, modeOf, gradeGraph };
})(typeof window !== "undefined" ? window : globalThis);
