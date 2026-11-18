// player.js — 音声なしの解説動画を再生する（図をかいていく SVG ＋ 字幕 ＋ 式）
import { polar, dirDeg, norm, rad } from "./geo.js";

const NS = "http://www.w3.org/2000/svg";
export const PAL = { g: "#22302c", b: "#0b8f73", a: "#e0383e", k: "#8b979e", n: "#ff7a1a", y: "#d99a00", p: "#6b4bd8" };
const f = (n) => Math.round(n * 100) / 100;
const S = (tag, attrs = {}, kids = []) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  for (const c of kids) e.appendChild(c);
  return e;
};
const H = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};

// ── 文字の飾り（字幕・式用）────────────────────────────
//  [[a|b]] 分数   **強調**   ^{上つき}  _{下つき}   {{答えのしるし}}
export function fmt(s) {
  let t = String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  t = t.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '<span class="fr"><span>$1</span><span>$2</span></span>');
  t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  t = t.replace(/\^\{(.+?)\}/g, "<sup>$1</sup>").replace(/_\{(.+?)\}/g, "<sub>$1</sub>");
  t = t.replace(/\{\{(.+?)\}\}/g, "<mark>$1</mark>");
  return t.replace(/\n/g, "<br>");
}

// ── 図形 ──────────────────────────────────────────
function resolver(pts) {
  return (p) => {
    if (Array.isArray(p)) return p;
    const v = pts.get(p);
    if (!v) throw new Error(`点 ${p} がまだありません`);
    return v;
  };
}
function arcD(c, r, from, to) {
  let sw = to - from;
  if (sw >= 360 - 1e-6) {
    const a = polar(c, r, from), b = polar(c, r, from + 180);
    return `M${f(a[0])} ${f(a[1])}A${r} ${r} 0 1 0 ${f(b[0])} ${f(b[1])}A${r} ${r} 0 1 0 ${f(a[0])} ${f(a[1])}`;
  }
  sw = sw < 0 ? norm(sw) : sw;
  const a = polar(c, r, from), b = polar(c, r, from + sw);
  return `M${f(a[0])} ${f(a[1])}A${r} ${r} 0 ${sw > 180 ? 1 : 0} 0 ${f(b[0])} ${f(b[1])}`;
}
function clipLine(a, b, v, pad = 0) {
  const [x0, y0, w, h] = v, xl = x0 - pad, xr = x0 + w + pad, yt = y0 - pad, yb = y0 + h + pad;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let t0 = -1e9, t1 = 1e9;
  const clip = (p, q) => {
    if (Math.abs(p) < 1e-9) return q >= 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  if (clip(-dx, a[0] - xl) && clip(dx, xr - a[0]) && clip(-dy, a[1] - yt) && clip(dy, yb - a[1])) {
    return [[a[0] + t0 * dx, a[1] + t0 * dy], [a[0] + t1 * dx, a[1] + t1 * dy]];
  }
  return [a, b];
}
const LP = { n: [0, -9, "middle"], ne: [8, -7, "start"], e: [10, 5, "start"], se: [8, 17, "start"], s: [0, 19, "middle"], sw: [-8, 17, "end"], w: [-10, 5, "end"], nw: [-8, -7, "end"] };

// 1つの要素 → SVG の <g>
export function makeEl(el, ctx, o) {
  const R = ctx.R;
  const g = S("g", { class: `el t-${el.t}${o.isNew ? " new" : ""}${o.anim ? " anim" : ""}`, "data-id": el.id || null });
  const col = el.c ? PAL[el.c] || el.c : PAL[o.base ? "g" : "b"];
  g.style.setProperty("--c0", col);
  if (el.c === "a" || o.base) g.classList.add("keepc");
  g.style.setProperty("--d", `${o.delay || 0}ms`);
  const sw = el.w || (el.t === "txt" ? 0 : 2);
  const draw = (d, extra = {}, cls = "draw") => {
    const dashed = el.dash;
    const p = S("path", { d, class: `s ${dashed ? "fade" : cls}`, "stroke-width": sw, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": dashed ? (el.dash === true ? "6 5" : el.dash) : null, pathLength: dashed ? null : 1, ...extra });
    if (el.o != null) p.setAttribute("opacity", el.o);
    g.appendChild(p);
    return p;
  };
  switch (el.t) {
    case "pt": {
      const p = [el.x, el.y];
      ctx.pts.set(el.id, p);
      if (el.dot !== false) g.appendChild(S("circle", { cx: p[0], cy: p[1], r: el.r || 3.4, class: "fill fade", fill: "var(--c)" }));
      if (el.l) {
        const [dx, dy, an] = LP[el.p || "ne"] || LP.ne;
        const t = S("text", { x: p[0] + (el.dx ?? dx), y: p[1] + (el.dy ?? dy), "text-anchor": an, class: "lab fade", "font-size": el.size || 16 });
        t.textContent = el.l;
        g.appendChild(t);
      }
      break;
    }
    case "dot": g.appendChild(S("circle", { cx: el.x, cy: el.y, r: el.r || 3.4, class: "fill fade", fill: "var(--c)" })); break;
    case "seg": {
      const a = R(el.a), b = R(el.b);
      draw(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`);
      if (el.tick) {
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy, ny = ux;
        for (let i = 0; i < el.tick; i++) {
          const k = (i - (el.tick - 1) / 2) * 5, cx = m[0] + ux * k, cy = m[1] + uy * k;
          g.appendChild(S("path", { d: `M${f(cx + nx * 6)} ${f(cy + ny * 6)}L${f(cx - nx * 6)} ${f(cy - ny * 6)}`, class: "s fade", "stroke-width": 2, fill: "none" }));
        }
      }
      break;
    }
    case "line": {
      const [a, b] = clipLine(R(el.a), R(el.b), ctx.view, 0);
      draw(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`);
      break;
    }
    case "arrow": {
      const a = R(el.a), b = R(el.b), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      draw(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`);
      const hx = b[0] - ux * 11, hy = b[1] - uy * 11;
      g.appendChild(S("path", { d: `M${f(b[0])} ${f(b[1])}L${f(hx - uy * 5)} ${f(hy + ux * 5)}L${f(hx + uy * 5)} ${f(hy - ux * 5)}Z`, class: "fill fade", fill: "var(--c)" }));
      break;
    }
    case "poly": {
      const pts = el.pts.map(R), d = "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + (el.close === false ? "" : "Z");
      if (el.fill) g.appendChild(S("path", { d: d + (el.close === false ? "Z" : ""), class: "fade", fill: el.fill === "hatch" ? "url(#hatch)" : PAL[el.fill] || el.fill, "fill-opacity": el.fo ?? (el.fill === "hatch" ? 1 : 0.28), stroke: "none" }));
      if (el.w !== 0) draw(d);
      break;
    }
    case "path": {
      if (el.fill) g.appendChild(S("path", { d: el.d, class: "fade", fill: el.fill === "hatch" ? "url(#hatch)" : PAL[el.fill] || el.fill, "fill-opacity": el.fo ?? (el.fill === "hatch" ? 1 : 0.28), "fill-rule": "evenodd", stroke: "none" }));
      if (el.w !== 0) draw(el.d);
      break;
    }
    case "arc": {
      const c = R(el.ctr);
      draw(arcD(c, el.r, el.from, el.to));
      if (el.fill) g.insertBefore(S("path", { d: `M${f(c[0])} ${f(c[1])}L${arcD(c, el.r, el.from, el.to).slice(1)}Z`, class: "fade", fill: el.fill === "hatch" ? "url(#hatch)" : PAL[el.fill] || el.fill, "fill-opacity": el.fo ?? 0.25, stroke: "none" }), g.firstChild);
      break;
    }
    case "ell": {
      const c = R(el.ctr);
      let to = el.to; if (to <= el.from) to += 360;
      const n = Math.max(8, Math.round((to - el.from) / 4)), pts = [];
      for (let i = 0; i <= n; i++) { const a = rad(el.from + ((to - el.from) * i) / n); pts.push([c[0] + el.rx * Math.cos(a), c[1] - el.ry * Math.sin(a)]); }
      const d = "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L");
      if (el.fill) g.appendChild(S("path", { d: d + "Z", class: "fade", fill: el.fill === "hatch" ? "url(#hatch)" : PAL[el.fill] || el.fill, "fill-opacity": el.fo ?? 0.25, stroke: "none" }));
      draw(d);
      break;
    }
    case "ang": {
      const at = R(el.at), p1 = R(el.from), p2 = R(el.to);
      let d1 = dirDeg(at, p1), d2 = dirDeg(at, p2), diff = norm(d2 - d1);
      const big = !!el.big;
      if ((diff > 180) !== big) { [d1, d2] = [d2, d1]; diff = norm(d2 - d1); }
      const r = el.r || 20, d = arcD(at, r, d1, d1 + diff);
      if (el.fill) g.appendChild(S("path", { d: `M${f(at[0])} ${f(at[1])}L${d.slice(1)}Z`, class: "fade", fill: el.fill === true ? "var(--c)" : PAL[el.fill] || el.fill, "fill-opacity": el.fo ?? 0.22, stroke: "none" }));
      draw(d, {}, "draw");
      if (el.l) {
        const mid = d1 + diff / 2, lp = polar(at, el.lr || r + 15, mid);
        const t = S("text", { x: f(lp[0]), y: f(lp[1] + 5), "text-anchor": "middle", class: "lab fade", "font-size": el.size || 14 });
        t.textContent = el.l; g.appendChild(t);
      }
      if (el.m) { // 等しい角の印（弧を重ねる）
        for (let k = 1; k <= el.m; k++) g.appendChild(S("path", { d: arcD(at, r + 4 * k, d1 + 3, d1 + diff - 3), class: "s fade", "stroke-width": 1.8, fill: "none" }));
      }
      break;
    }
    case "rt": {
      const at = R(el.at), s = el.s || 11, d1 = rad(dirDeg(at, R(el.from))), d2 = rad(dirDeg(at, R(el.to)));
      const a = [at[0] + s * Math.cos(d1), at[1] - s * Math.sin(d1)], b = [at[0] + s * Math.cos(d2), at[1] - s * Math.sin(d2)], c = [a[0] + b[0] - at[0], a[1] + b[1] - at[1]];
      draw(`M${f(a[0])} ${f(a[1])}L${f(c[0])} ${f(c[1])}L${f(b[0])} ${f(b[1])}`, { "stroke-width": el.w || 1.8 });
      break;
    }
    case "txt": {
      const lines = String(el.s).split("\n");
      const t = S("text", { x: el.x, y: el.y, "text-anchor": el.anchor || "middle", class: `lab fade${el.bold === false ? " nb" : ""}`, "font-size": el.size || 16 });
      lines.forEach((ln, i) => { const ts = S("tspan", { x: el.x, dy: i ? (el.size || 16) * 1.25 : 0 }); ts.textContent = ln; t.appendChild(ts); });
      if (el.rot) t.setAttribute("transform", `rotate(${-el.rot} ${el.x} ${el.y})`);
      g.appendChild(t);
      break;
    }
    default: throw new Error(`知らない要素 ${el.t}`);
  }
  return g;
}

// 方眼
function gridEl(gr) {
  const g = S("g", { class: "grid" }), { x = 0, y = 0, nx, ny, s } = gr;
  for (let i = 0; i <= nx; i++) g.appendChild(S("line", { x1: x + i * s, y1: y, x2: x + i * s, y2: y + ny * s, stroke: "#cdd8d3", "stroke-width": 1 }));
  for (let j = 0; j <= ny; j++) g.appendChild(S("line", { x1: x, y1: y + j * s, x2: x + nx * s, y2: y + j * s, stroke: "#cdd8d3", "stroke-width": 1 }));
  return g;
}

// ── 再生 ──────────────────────────────────────────
export function stepDur(st) {
  if (st.dur) return st.dur;
  const n = (st.add || []).length, eq = (st.eq || []).length, cap = (st.cap || "").length;
  return Math.min(14000, 1700 + cap * 105 + eq * 650 + Math.min(n, 7) * 330);
}

export function createPlayer(root, scene, opt = {}) {
  const steps = scene.steps, last = steps.length - 1;
  root.innerHTML = "";
  root.classList.add("pl-root");
  const svg = S("svg", { viewBox: scene.view.join(" "), class: "fig", role: "img", "aria-label": scene.title, preserveAspectRatio: "xMidYMid meet" });
  svg.appendChild(S("defs", {}, [S("pattern", { id: "hatch", width: 7, height: 7, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, [S("line", { x1: 0, y1: 0, x2: 0, y2: 7, stroke: "#e0383e", "stroke-width": 1.6, opacity: ".75" })])]));
  const layer = S("g", {});
  svg.appendChild(layer);
  const figWrap = H("div", "fig-wrap");
  figWrap.appendChild(svg);
  const cap = H("div", "cap");
  const board = H("div", "board");
  const ans = H("div", "ans", "");
  ans.hidden = true;
  const bar = H("div", "bar");
  const btn = (cls, label, title) => { const b = H("button", `cbtn ${cls}`, label); b.type = "button"; b.title = title; b.setAttribute("aria-label", title); return b; };
  const bFirst = btn("first", "⏮", "はじめから"), bPrev = btn("prev", "◀", "ひとつ前"), bPlay = btn("play", "⏸", "一時停止"), bNext = btn("next", "▶", "ひとつ先へ"), bSpeed = btn("speed", "×1", "はやさ");
  const dots = H("div", "dots");
  const dotEls = steps.map((_, i) => { const d = H("button", "dt"); d.type = "button"; d.setAttribute("aria-label", `${i + 1}つめ`); d.onclick = () => { pause(); show(i, true); }; dots.appendChild(d); return d; });
  const ctrl = H("div", "ctrl");
  [bFirst, bPrev, bPlay, bNext, bSpeed].forEach((b) => ctrl.appendChild(b));
  bar.appendChild(dots); bar.appendChild(ctrl);
  const left = H("div", "pl-left"), right = H("div", "pl-right");
  left.appendChild(figWrap); left.appendChild(bar);
  right.appendChild(cap); right.appendChild(board); right.appendChild(ans);
  root.appendChild(left); root.appendChild(right);

  let cur = -1, playing = false, timer = null, speed = 1;
  const speeds = [1, 1.5, 0.7];
  const view = scene.view;

  function renderFigure(upto, animate) {
    layer.innerHTML = "";
    if (scene.grid) layer.appendChild(gridEl(scene.grid));
    const pts = new Map(), ctx = { pts, R: resolver(pts), view };
    let live = [];
    const hidden = new Set();
    for (let j = 0; j <= upto; j++) {
      const st = steps[j];
      if (st.clear) live = live.filter((x) => x.base);
      (st.hide || []).forEach((id) => hidden.add(id));
      (st.add || []).forEach((el) => { live.push({ el, j, base: j === 0 || el.base }); if (el.id) hidden.delete(el.id); });
    }
    // 点を先に登録（あとの要素が、すこし先の点を参照してもよいように）
    live.forEach(({ el }) => { if (el.t === "pt") pts.set(el.id, [el.x, el.y]); });
    const fresh = live.filter((x) => x.j === upto && !(x.el.id && hidden.has(x.el.id)));
    const nNew = fresh.length, gap = Math.min(380, nNew > 1 ? 2600 / (nNew - 1) : 380);
    let k = 0;
    const hl = new Set(steps[upto].hl || []);
    for (const x of live) {
      if (x.el.id && hidden.has(x.el.id)) continue;
      const isNew = x.j === upto;
      const delay = isNew ? (x.el.d != null ? x.el.d : steps[upto].together ? 0 : k++ * gap) : 0;
      const node = makeEl(x.el, ctx, { isNew, anim: animate && isNew, delay, base: x.base || x.j === 0 });
      if (x.el.id && hl.has(x.el.id)) node.classList.add("pulse");
      layer.appendChild(node);
    }
  }
  function renderBoard(upto, animate) {
    board.innerHTML = "";
    let from = 0;
    for (let j = 0; j <= upto; j++) if (steps[j].eqClear) from = j;
    let n = 0;
    for (let j = from; j <= upto; j++) {
      for (const raw of steps[j].eq || []) {
        const line = typeof raw === "string" ? raw : raw.s;
        let cls = "ln", html;
        if (line.startsWith("## ")) { cls += " hd"; html = fmt(line.slice(3)); }
        else if (line.startsWith("=> ")) { cls += " fin"; html = fmt(line.slice(3)); }
        else if (line.startsWith("// ")) { cls += " note"; html = fmt(line.slice(3)); }
        else html = fmt(line);
        const e = H("div", cls, html);
        if (animate && j === upto) { e.classList.add("in"); e.style.animationDelay = `${300 + n++ * 450}ms`; }
        board.appendChild(e);
      }
    }
    board.hidden = !board.childNodes.length;
  }
  function renderCap(i, animate) {
    const st = steps[i];
    cap.innerHTML = "";
    const e = H("div", `cap-in${animate ? " in" : ""}`, fmt(st.cap || ""));
    cap.appendChild(e);
  }
  function show(i, animate = true) {
    i = Math.max(0, Math.min(last, i));
    cur = i;
    try { renderFigure(i, animate); } catch (err) { layer.innerHTML = ""; cap.textContent = "（図の表示でエラー）" + err.message; throw err; }
    renderBoard(i, animate);
    renderCap(i, animate);
    const finAt = steps.findIndex((s) => s.fin);
    const showAns = i >= (finAt >= 0 ? finAt : last);
    ans.hidden = !showAns;
    if (showAns) ans.innerHTML = `<span class="lbl">答え</span><span class="tx">${fmt(scene.answer)}</span>`;
    dotEls.forEach((d, j) => { d.classList.toggle("on", j === i); d.classList.toggle("done", j < i); });
    bPrev.disabled = i === 0; bNext.disabled = i === last;
    bPlay.textContent = playing ? "⏸" : i === last ? "↻" : "▶";
    bPlay.title = playing ? "一時停止" : i === last ? "もういちど" : "再生";
    opt.onStep && opt.onStep(i, last);
    return i;
  }
  function schedule() {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(() => {
      if (cur >= last) { playing = false; bPlay.textContent = "↻"; opt.onEnd && opt.onEnd(); return; }
      show(cur + 1, true);
      schedule();
    }, stepDur(steps[cur]) / speed);
  }
  function play() {
    if (cur >= last) show(0, true);
    playing = true; bPlay.textContent = "⏸"; schedule();
  }
  function pause() { playing = false; clearTimeout(timer); bPlay.textContent = cur >= last ? "↻" : "▶"; }
  bPlay.onclick = () => (playing ? pause() : play());
  bNext.onclick = () => { pause(); show(cur + 1, true); };
  bPrev.onclick = () => { pause(); show(cur - 1, true); };
  bFirst.onclick = () => { pause(); show(0, true); };
  bSpeed.onclick = () => { speed = speeds[(speeds.indexOf(speed) + 1) % speeds.length]; bSpeed.textContent = `×${speed}`; if (playing) schedule(); };

  show(0, !opt.still);
  if (opt.autoplay !== false && !opt.still) { playing = true; schedule(); }
  return {
    show, play, pause, next: () => bNext.onclick(), prev: () => bPrev.onclick(),
    get index() { return cur; }, get count() { return steps.length; }, get playing() { return playing; },
    destroy() { clearTimeout(timer); root.innerHTML = ""; },
  };
}
