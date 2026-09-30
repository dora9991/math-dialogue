/* 授業ライブ — 方眼への入力（点をかき入れる／グラフが通る点を選ぶ） */
(function (root) {
  "use strict";
  const LF = root.LF, UI = root.UI, LM = root.LM;

  function mount(R) {
    const G = LF.grid(R);
    const wrap = document.createElement("div");
    wrap.className = "gridin";
    wrap.innerHTML = `<svg class="fig sq" viewBox="0 0 ${G.S} ${G.S}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="座標平面">${G.defs}${G.body}<g class="dyn"></g><rect x="0" y="0" width="${G.S}" height="${G.S}" fill="transparent" class="hit"/></svg>`;
    const svg = wrap.querySelector("svg");
    const dyn = wrap.querySelector(".dyn");
    function toGrid(e) {
      const p = svg.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      const m = svg.getScreenCTM();
      if (!m) return null;
      const q = p.matrixTransform(m.inverse());
      const gx = Math.round((q.x - G.C) / G.U), gy = Math.round((G.C - q.y) / G.U);
      if (Math.abs(gx) > R || Math.abs(gy) > R) return null;
      // 格子点から離れすぎたタップは無視（押しまちがい防止）
      const dx = q.x - G.X(gx), dy = q.y - G.Y(gy);
      if (Math.hypot(dx, dy) > G.U * 0.48) return null;
      return [gx, gy];
    }
    return { wrap, svg, dyn, G, toGrid };
  }

  /* 点をかき入れる: q.points = [[ラベル,x,y],...]  value = {P:[x,y],...} */
  function plot(q, value, onChange) {
    const labels = q.points.map(p => p[0]);
    let placed = Object.assign({}, value || {});
    let cur = labels.find(l => !placed[l]) || labels[0];
    const m = mount(q.R);
    const el = document.createElement("div");
    el.innerHTML = `<div class="plotlabels" role="group" aria-label="かき入れる点"></div>`;
    const bar = el.firstElementChild;
    el.appendChild(m.wrap);
    const foot = document.createElement("div");
    foot.className = "row center small muted";
    foot.style.justifyContent = "center";
    foot.innerHTML = `<span>点をもう一度タップすると消えます</span><button type="button" class="btn small ghost" data-clear>ぜんぶ消す</button>`;
    el.appendChild(foot);
    function draw() {
      bar.innerHTML = labels.map(l => `<button type="button" class="btn small ${l === cur ? "primary" : placed[l] ? "on" : ""}" data-l="${UI.esc(l)}">${UI.esc(l)}${placed[l] ? " ✓" : ""}</button>`).join("");
      const G = m.G;
      m.dyn.innerHTML = Object.keys(placed).map(l => {
        const [x, y] = placed[l];
        return `<circle class="fg-pick" cx="${G.X(x)}" cy="${G.Y(y)}" r="6"/><text class="fg-lab" x="${G.X(x) + 8}" y="${G.Y(y) - 8}">${UI.esc(l)}</text>`;
      }).join("");
    }
    bar.addEventListener("click", e => { const b = e.target.closest("[data-l]"); if (b) { cur = b.dataset.l; draw(); } });
    foot.querySelector("[data-clear]").addEventListener("click", () => { placed = {}; cur = labels[0]; draw(); onChange(placed); });
    m.svg.addEventListener("click", e => {
      const p = m.toGrid(e);
      if (!p) return;
      const hit = Object.keys(placed).find(l => placed[l][0] === p[0] && placed[l][1] === p[1]);
      if (hit) { delete placed[hit]; cur = hit; }
      else { placed[cur] = p; cur = labels.find(l => !placed[l]) || cur; }
      draw(); onChange(Object.assign({}, placed));
    });
    draw();
    return el;
  }

  /* グラフが通る点を選ぶ: q.fn = {kind:"line"|"hyper", a}  value = [[x,y],...] */
  function graph(q, value, onChange) {
    let pts = Array.isArray(value) ? value.slice() : [];
    const m = mount(q.R);
    const el = document.createElement("div");
    el.appendChild(m.wrap);
    const info = document.createElement("div");
    info.className = "row small";
    info.style.justifyContent = "center";
    el.appendChild(info);
    function draw() {
      const G = m.G, R = q.R;
      let s = "";
      if (q.fn.kind === "line") {
        const p = pts.find(([x, y]) => x !== 0);
        if (p) s += LF.linePath(p[1] / p[0], R, G.X, G.Y, "fg-acc");
        else if (pts.some(([x, y]) => x === 0 && y !== 0)) s += `<line class="fg-acc" x1="${G.X(0)}" y1="${G.Y(-R)}" x2="${G.X(0)}" y2="${G.Y(R)}"/>`;
      } else {
        const p = pts.find(([x, y]) => x !== 0 && y !== 0);
        if (p) s += LF.hyperPath(p[0] * p[1], R, G.X, G.Y, "fg-acc");
      }
      s += pts.map(([x, y]) => `<circle class="fg-pick" cx="${G.X(x)}" cy="${G.Y(y)}" r="6"/>`).join("");
      m.dyn.innerHTML = s;
      info.innerHTML = pts.length
        ? `選んだ点：${pts.map(p => `(${p[0]}, ${p[1]})`).join(" ")} <button type="button" class="btn small ghost" data-clear>消す</button>`
        : `<span class="muted">方眼の交点をタップして、グラフが通る点を選びます</span>`;
    }
    info.addEventListener("click", e => { if (e.target.closest("[data-clear]")) { pts = []; draw(); onChange(pts); } });
    m.svg.addEventListener("click", e => {
      const p = m.toGrid(e);
      if (!p) return;
      const i = pts.findIndex(q2 => q2[0] === p[0] && q2[1] === p[1]);
      if (i >= 0) pts.splice(i, 1);
      else { pts.push(p); if (pts.length > 4) pts.shift(); }
      draw(); onChange(pts.slice());
    });
    draw();
    return el;
  }

  // 結果画面用：正解のグラフと生徒の点を重ねた図
  function resultFig(q, a) {
    const G = LF.grid(q.R);
    let s = G.body;
    if (q.type === "graph") {
      const v = LF.num(q.fn.a);
      s += q.fn.kind === "line" ? LF.linePath(v, q.R, G.X, G.Y, "fg-acc") : LF.hyperPath(v, q.R, G.X, G.Y, "fg-acc");
      (Array.isArray(a) ? a : []).forEach(([x, y]) => {
        const ok = q.fn.kind === "line" ? Math.abs(y - v * x) < 1e-9 : x !== 0 && Math.abs(x * y - v) < 1e-9;
        s += ok ? `<circle class="fg-good" cx="${G.X(x)}" cy="${G.Y(y)}" r="6"/>` : `<circle class="fg-bad" cx="${G.X(x)}" cy="${G.Y(y)}" r="7"/>`;
      });
    } else {
      q.points.forEach(([l, x, y]) => { s += `<circle class="fg-ghost" cx="${G.X(x)}" cy="${G.Y(y)}" r="7"/><text class="fg-num" x="${G.X(x) + 8}" y="${G.Y(y) + 14}">${UI.esc(l)}</text>`; });
      const placed = a && typeof a === "object" ? a : {};
      Object.keys(placed).forEach(l => {
        const [x, y] = placed[l];
        const ok = q.points.some(p => p[0] === l && p[1] === x && p[2] === y);
        s += ok ? `<circle class="fg-good" cx="${G.X(x)}" cy="${G.Y(y)}" r="6"/>` : `<circle class="fg-bad" cx="${G.X(x)}" cy="${G.Y(y)}" r="7"/>`;
        s += `<text class="fg-lab" x="${G.X(x) + 8}" y="${G.Y(y) - 8}">${UI.esc(l)}</text>`;
      });
    }
    return LF.wrap(G.S, G.S, s, "sq", G.defs);
  }

  root.GI = { plot, graph, resultFig };
})(window);
