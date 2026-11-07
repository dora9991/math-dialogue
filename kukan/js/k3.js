/* 空間図形の黒板教材（kukan/）の土台。1ページ＝1時間。
   ・ステップは「問い → つぎへ ▶ で答え」の2段（答えのないステップは1段）。右の板書に、答えが1行ずつたまる。
   ・図は canvas 2D に、自前で透視投影して描く（外部ライブラリなし。file:// で開いても動く）。
   ・授業のページは K3.run({...}) を呼ぶだけ。ステップごとに draw(D) で図を描く（D の道具は下の makeD を見る）。
   ・直方体の頂点は A(0,0,0) B(w,0,0) C(w,d,0) D(0,d,0)、E〜H はその真上（ikkan の空間図形と同じ）。 */
(function () {
'use strict';
var TAU = Math.PI * 2, DEG = Math.PI / 180, FOV = 30 * DEG;
var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ================= 数学の道具 ================= */
function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function len(a) { return Math.sqrt(dot(a, a)); }
function nrm(a) { var l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function lerp(a, b, t) { return a + (b - a) * t; }
function lerp3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function centroid(P) { var c = [0, 0, 0]; P.forEach(function (p) { c = add(c, p); }); return mul(c, 1 / P.length); }
function wrapPI(a) { while (a > Math.PI) a -= TAU; while (a <= -Math.PI) a += TAU; return a; }
/* 長さ1の 2つのベクトル u, v（垂直）でつくる平面の上の、角 a の向き */
function inPlane(u, v, a) { return add(mul(u, Math.cos(a)), mul(v, Math.sin(a))); }

var COL = { chalk: '#f2f0e6', yel: '#ffe27a', pink: '#ff9db2', blue: '#9ad8ff', lav: '#c9b0ff', orange: '#ffc078', green: '#a9f0b0' };
var VEIL = 'rgba(23,56,41,.85)';
var CHALK_FONT = '"Klee One","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif';
function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }

/* ================= 直方体と、位置関係の計算 ================= */
function cuboid(w, d, h, L) {
  L = L || 'ABCDEFGH';
  var c = [[0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0], [0, 0, h], [w, 0, h], [w, d, h], [0, d, h]], P = {};
  c.forEach(function (p, i) { P[L[i]] = p; });
  var edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].map(function (e) { return L[e[0]] + L[e[1]]; });
  var ctr = [w / 2, d / 2, h / 2];
  var faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [3, 2, 6, 7], [0, 3, 7, 4]].map(function (f) {
    var v = f.map(function (i) { return L[i]; }), pts = v.map(function (k) { return P[k]; }), cc = centroid(pts);
    var n = nrm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]))); if (dot(n, sub(cc, ctr)) < 0) n = mul(n, -1);
    return { name: v.join(''), v: v, c: cc, n: n };
  });
  return { P: P, edges: edges, faces: faces, ctr: ctr, R: len([w, d, h]) / 2, w: w, d: d, h: h };
}
function ekey(e) { return e.split('').sort().join(''); }
function dirOf(M, e) { return sub(M.P[e[1]], M.P[e[0]]); }
/* 2本の辺（直線）：'cross' 交わる・'par' 平行・'skew' ねじれの位置 */
function rel(M, a, b) {
  var n = cross(dirOf(M, a), dirOf(M, b));
  if (len(n) < 1e-9) return 'par';
  return Math.abs(dot(sub(M.P[b[0]], M.P[a[0]]), n)) < 1e-9 ? 'cross' : 'skew';
}
function isPerp(M, a, b) { return rel(M, a, b) === 'cross' && Math.abs(dot(dirOf(M, a), dirOf(M, b))) < 1e-9; }
function group(M, base, r) {
  return M.edges.filter(function (e) { return ekey(e) !== ekey(base) && (r === 'perp' ? isPerp(M, base, e) : rel(M, base, e) === r); });
}
function face(M, name) { var k = ekey(name); return M.faces.filter(function (f) { return ekey(f.name) === k; })[0]; }
/* 辺と面：'in' 面の上にある・'par' 平行・'cross' 1点で交わる（そのうち 'perp' は垂直） */
function lp(M, e, fname) {
  var f = face(M, fname), dv = nrm(dirOf(M, e));
  if (Math.abs(dot(dv, f.n)) < 1e-9) return Math.abs(dot(sub(M.P[e[0]], f.c), f.n)) < 1e-9 ? 'in' : 'par';
  return len(cross(dv, f.n)) < 1e-9 ? 'perp' : 'cross';
}
function edgesBy(M, fname, r) {
  return M.edges.filter(function (e) { var x = lp(M, e, fname); return r === 'cross' ? x === 'cross' || x === 'perp' : x === r; });
}
/* 面と面：'par' 平行・'perp' 垂直・'cross' 交わる */
function pp(M, f1, f2) {
  var a = face(M, f1).n, b = face(M, f2).n;
  if (len(cross(a, b)) < 1e-9) return 'par';
  return Math.abs(dot(a, b)) < 1e-9 ? 'perp' : 'cross';
}
function facesBy(M, fname, r) { return M.faces.filter(function (f) { return ekey(f.name) !== ekey(fname) && pp(M, fname, f.name) === r; }).map(function (f) { return f.name; }); }
function dist(M, p, fname) { var f = face(M, fname); return Math.abs(dot(sub(M.P[p], f.c), f.n)); }
function jp(list) { return list.join('、'); }

/* ================= カメラ ================= */
function makeCam(c, cx, cy, half, q) {
  var th = c.theta, ps = c.psi, cp = Math.cos(ps), sp = Math.sin(ps);
  var f = [-cp * Math.cos(th), -cp * Math.sin(th), -sp], r = [-Math.sin(th), Math.cos(th), 0], u = cross(r, f);
  var t = Math.tan(FOV / 2), d = c.rho / (t * q), F = half / t, pos = sub(c.target, mul(f, d));
  return {
    f: f, r: r, u: u, pos: pos, d: d, F: F, sc: F / d,
    P: function (p) { var v = sub(p, pos), z = Math.max(dot(v, f), 1e-3); return [cx + dot(v, r) / z * F, cy - dot(v, u) / z * F, z]; }
  };
}

/* ================= 描く道具（ステップの draw(D) で使う） ================= */
var ctx = null, DPR = 1;
function text(txt, x, y, fs, color, outline, align) {
  ctx.font = '600 ' + fs + 'px ' + CHALK_FONT; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  if (outline) { ctx.lineJoin = 'round'; ctx.lineWidth = fs * .26; ctx.strokeStyle = outline; ctx.strokeText(txt, x, y); }
  ctx.fillStyle = color; ctx.fillText(txt, x, y);
}
function makeD(C, M, info) {
  var lw = clamp(C.sc * .02, 1.6, 3.4), fs = clamp(C.sc * .21, 14, 30);
  var D = {
    C: C, M: M, lw: lw, fs: fs, t: info.t, ph: info.ph, V: info.V, now: info.now, done: info.done,
    COL: COL, v: V3, W: info.W, H: info.H,
    /* 点：'A' のような頂点の名前でも、[x, y, z] でもよい */
    pt: function (p) { return typeof p === 'string' ? D.M.P[p] : p; },
    p2: function (p) { return C.P(D.pt(p)); },
    use: function (M2) { D.M = M2; return D; },
    seg: function (a, b, o) {
      o = o || {}; a = D.pt(a); b = D.pt(b);
      var A = C.P(a), B = C.P(b), w = o.w || lw;
      ctx.save(); ctx.globalAlpha = o.a == null ? 1 : o.a; ctx.lineCap = 'round';
      if (o.glow) { ctx.shadowColor = hexA(o.col || COL.chalk, .65); ctx.shadowBlur = 9 * DPR; }
      if (o.dash) ctx.setLineDash([w * 2.4 + 2, w * 2.2 + 2]);
      ctx.strokeStyle = o.col || COL.chalk; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      ctx.restore();
      if (o.ext) {
        var dv = nrm(sub(b, a));
        D.seg(sub(a, mul(dv, o.ext)), a, { col: o.col, w: Math.max(1, w * .55), a: (o.a == null ? 1 : o.a) * .7, dash: true });
        D.seg(b, add(b, mul(dv, o.ext)), { col: o.col, w: Math.max(1, w * .55), a: (o.a == null ? 1 : o.a) * .7, dash: true });
      }
    },
    poly: function (pts, o) {
      o = o || {}; var P = pts.map(function (p) { return C.P(D.pt(p)); });
      ctx.save(); ctx.globalAlpha = 1;
      ctx.beginPath(); P.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath();
      if (o.col) { ctx.fillStyle = hexA(o.col, o.a == null ? .25 : o.a); ctx.fill(); }
      if (o.stroke) { ctx.strokeStyle = hexA(o.stroke, o.sa == null ? .8 : o.sa); ctx.lineWidth = o.sw || lw; if (o.dash) ctx.setLineDash([lw * 3, lw * 3]); ctx.stroke(); }
      ctx.restore();
    },
    dot: function (p, o) {
      o = o || {}; var P = C.P(D.pt(p)), r = (o.r || 2.4) * lw;
      ctx.save(); ctx.globalAlpha = o.a == null ? 1 : o.a;
      ctx.beginPath(); ctx.arc(P[0], P[1], r, 0, TAU); ctx.fillStyle = o.col || COL.chalk; ctx.fill();
      ctx.lineWidth = Math.max(1, r * .35); ctx.strokeStyle = 'rgba(20,30,24,.85)'; ctx.stroke(); ctx.restore();
    },
    label: function (p, txt, o) {
      o = o || {}; var P = C.P(D.pt(p));
      ctx.save(); ctx.globalAlpha = o.a == null ? 1 : o.a;
      text(txt, P[0] + (o.dx || 0) * fs, P[1] + (o.dy || 0) * fs, fs * (o.size || 1), o.col || COL.chalk, o.plain ? null : VEIL, o.align);
      ctx.restore();
    },
    /* 直角のしるし：点 o で、向き u と v が直角 */
    right: function (o3, u, v, o) {
      o = o || {}; o3 = D.pt(o3); var s = o.s || .32;
      var a = add(o3, mul(nrm(u), s)), b = add(a, mul(nrm(v), s)), c = add(o3, mul(nrm(v), s));
      var A = C.P(a), B = C.P(b), Cc = C.P(c);
      ctx.save(); ctx.globalAlpha = o.a == null ? 1 : o.a; ctx.strokeStyle = o.col || COL.yel; ctx.lineWidth = lw * 1.3; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(Cc[0], Cc[1]); ctx.stroke(); ctx.restore();
    },
    text: function (x, y, txt, o) { o = o || {}; ctx.save(); ctx.globalAlpha = o.a == null ? 1 : o.a; text(txt, x, y, fs * (o.size || 1), o.col || COL.chalk, o.plain ? null : VEIL, o.align); ctx.restore(); },
    /* 直方体（見取図）。見えない辺は点線。
       o.edges: { AB: {col, w, a, hide} }（名前の順はどちらでもよい）、o.faces: { ABCD: {col, a} }、o.labels（false で頂点の字を出さない）、o.dim（ふつうの辺の濃さ） */
    box: function (M2, o) {
      var M = M2 || D.M; o = o || {};
      var front = {}; M.faces.forEach(function (f) { front[f.name] = dot(f.n, sub(C.pos, f.c)) > 0; });
      var fo = o.faces || {};
      Object.keys(fo).forEach(function (k) {
        var f = face(M, k), s = fo[k]; if (!f || s.a === 0) return;
        D.poly(f.v.map(function (v) { return M.P[v]; }), { col: s.col || COL.blue, a: (s.a == null ? .3 : s.a) * (front[f.name] ? 1 : .8) });
      });
      var es = {}; Object.keys(o.edges || {}).forEach(function (k) { es[ekey(k)] = o.edges[k]; });
      var list = M.edges.map(function (e) {
        var vis = M.faces.some(function (f) { return f.v.indexOf(e[0]) >= 0 && f.v.indexOf(e[1]) >= 0 && front[f.name]; });
        return { e: e, vis: vis, s: es[ekey(e)] };
      });
      list.sort(function (a, b) { return ((a.vis ? 2 : 0) + (a.s ? 1 : 0)) - ((b.vis ? 2 : 0) + (b.s ? 1 : 0)); });
      list.forEach(function (it) {
        var s = it.s || {}; if (s.hide) return;
        var a = s.a != null ? s.a : it.s ? 1 : (o.dim != null ? o.dim : .85);
        D.seg(M.P[it.e[0]], M.P[it.e[1]], { col: s.col || COL.chalk, w: lw * (s.w || (it.s ? 2.5 : 1)), a: it.vis ? a : a * .85, dash: !it.vis, glow: !!it.s && it.vis && !s.noglow, ext: s.ext });
      });
      if (o.labels !== false) {
        var cc = C.P(M.ctr);
        Object.keys(M.P).forEach(function (k) {
          var p = C.P(M.P[k]), dx = p[0] - cc[0], dy = p[1] - cc[1], l = Math.hypot(dx, dy) || 1;
          var col = (o.labelCol && o.labelCol[k]) || COL.chalk;
          text(k, p[0] + dx / l * fs * .8, p[1] + dy / l * fs * .8, fs * .95, col, VEIL);
        });
      }
    },
    /* 面を広げた平面（面 fname を、まわりに ext だけ広げる） */
    bigPlane: function (fname, o) {
      o = o || {}; var f = face(D.M, fname), P = f.v.map(function (v) { return D.M.P[v]; }), e = o.ext == null ? 1.2 : o.ext;
      var u = nrm(sub(P[1], P[0])), v = nrm(sub(P[3], P[0])), lu = len(sub(P[1], P[0])), lv = len(sub(P[3], P[0]));
      var q = [add(add(P[0], mul(u, -e)), mul(v, -e)), add(add(P[0], mul(u, lu + e)), mul(v, -e)), add(add(P[0], mul(u, lu + e)), mul(v, lv + e)), add(add(P[0], mul(u, -e)), mul(v, lv + e))];
      D.poly(q, { col: o.col || COL.blue, a: o.a == null ? .14 : o.a, stroke: o.col || COL.blue, sa: .5, sw: lw, dash: true });
      return q;
    }
  };
  return D;
}
var V3 = { add: add, sub: sub, mul: mul, dot: dot, cross: cross, len: len, nrm: nrm, lerp: lerp, lerp3: lerp3, clamp: clamp, ease: ease, easeOut: easeOut, smooth: smooth, centroid: centroid, inPlane: inPlane, DEG: DEG, TAU: TAU };

/* ================= 画面 ================= */
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function buildDom(cfg) {
  var links = (cfg.links || []).map(function (l) { return '<a class="btn" href="' + l.href + '">' + esc(l.label) + '</a>'; }).join('');
  document.body.innerHTML =
    '<div class="app" lang="ja"><div class="board">' +
    '<header class="bar"><h1><small>' + esc(cfg.no || '') + '</small>' + esc(cfg.title) + '</h1>' +
    '<div class="prog"><span id="pn">1</span> / <span id="pt">1</span></div>' +
    '<div class="ctl">' + links +
    '<button class="btn" id="prev" type="button" aria-label="もどる（←キー）">◀ もどる</button>' +
    '<button class="btn primary" id="next" type="button" aria-label="つぎへ（→キー）">つぎへ ▶</button>' +
    '<button class="btn" id="fs" type="button" aria-label="全画面にする（Fキー）">全画面</button></div></header>' +
    '<div class="track" aria-hidden="true"><i id="pbar"></i></div>' +
    '<div class="main"><div class="stage" id="stage"><canvas id="cv" role="img" aria-label="立体の図"></canvas>' +
    '<div class="banner" id="banner" hidden></div>' +
    '<div class="scrub"><div class="sls" id="sls"></div><button class="btn" id="replay" type="button" aria-label="もう一度動かす（Rキー）">↻ もう一度</button>' +
    '<span class="hint">ドラッグで回せます（ダブルクリックでもどす）</span></div></div>' +
    '<section class="panel" id="panel" aria-live="polite"><span class="tag" id="tag"></span><h2 class="q" id="q"></h2>' +
    '<div class="ansbox" id="ansbox"><p class="ans later" id="ans"></p><p class="sub later" id="sub"></p><p class="wait" id="wait">考えてから、つぎへ ▶ で答え</p></div>' +
    '<div class="notes" id="notes"></div><div class="blist" id="blist"></div></section></div></div></div>';
}

function run(cfg) {
  buildDom(cfg);
  var $ = function (id) { return document.getElementById(id); };
  var cv = $('cv'), stage = $('stage'), panel = $('panel'); ctx = cv.getContext('2d');
  var W = 0, H = 0, steps = cfg.steps, M0 = cfg.model;
  var VIEW0 = cfg.view || { th: -60, ps: 24 };
  var state = { idx: 0, phase: 0, t: 1, playing: false, done: true, t0: 0, V: {} };
  var cam = null, dragT = 0, dragP = 0, drag = null, fadeT = 0, spinT = 0;
  function cur() { return steps[state.idx]; }
  function hasAns(st) { return !!st.a; }

  function initSliders(st) {
    var box = $('sls'); box.innerHTML = ''; state.V = {};
    (st.sliders || []).forEach(function (s) {
      state.V[s.key] = s.val == null ? s.min : s.val;
      var id = 'sl-' + s.key, wrap = document.createElement('div');
      wrap.className = 'sl';
      wrap.innerHTML = '<label for="' + id + '">' + esc(s.label) + '</label><input type="range" id="' + id + '" min="' + s.min + '" max="' + s.max + '" step="' + (s.step || 'any') + '" value="' + state.V[s.key] + '"><output id="' + id + '-o"></output>';
      box.appendChild(wrap);
      var inp = wrap.querySelector('input');
      inp.addEventListener('input', function () {
        state.V[s.key] = +inp.value;
        if (state.playing) { state.playing = false; state.t = 1; setDone(true); }
        syncSliders();
      });
    });
    syncSliders();
  }
  function syncSliders() {
    var st = cur();
    (st.sliders || []).forEach(function (s) {
      var inp = $('sl-' + s.key), out = $('sl-' + s.key + '-o'); if (!inp) return;
      if (document.activeElement !== inp) inp.value = state.V[s.key];
      out.textContent = s.fmt ? s.fmt(state.V[s.key]) : '';
    });
  }
  function animSliders() {
    var st = cur();
    (st.sliders || []).forEach(function (s) {
      if (!s.anim) return;
      var on = state.phase === 1 || !hasAns(st);
      if (on) state.V[s.key] = lerp(s.anim[0], s.anim[1], ease(state.t));
    });
    syncSliders();
  }

  function enter(i, phase, animate) {
    var old = steps[state.idx], now = performance.now();
    state.idx = i; state.phase = phase; var st = cur();
    if ((old.scene || 'box') !== (st.scene || 'box') || (old.model || M0) !== (st.model || M0)) fadeT = now;
    var animOK = animate && st.dur && !RM && (phase === 1 || !hasAns(st));
    if (animOK) { state.t = 0; state.playing = true; state.done = false; state.t0 = now; }
    else { state.t = (phase === 1 || !hasAns(st)) ? 1 : 0; state.playing = false; state.done = true; }
    if (!animate || phase === 0) { dragT = 0; dragP = 0; spinT = 0; }
    initSliders(st); animSliders();
    render();
    try { history.replaceState(null, '', '#step-' + (i + 1)); } catch (e) { }
  }
  function next() {
    var st = cur();
    if (state.playing) { state.playing = false; state.t = 1; animSliders(); setDone(true); return; }
    if (state.phase === 0 && hasAns(st)) { enter(state.idx, 1, true); return; }
    if (state.idx < steps.length - 1) { var n = steps[state.idx + 1]; enter(state.idx + 1, 0, !hasAns(n)); }
  }
  function prev() {
    var st = cur();
    if (state.phase === 1 && hasAns(st)) { enter(state.idx, 0, false); return; }
    if (state.idx > 0) { var p = steps[state.idx - 1]; enter(state.idx - 1, hasAns(p) ? 1 : 0, false); }
  }
  function replay() { var st = cur(); enter(state.idx, hasAns(st) ? 1 : 0, true); }
  function setDone(b) { state.done = b; panel.classList.toggle('done', b && (state.phase === 1)); renderBanner(); }

  /* 板書：これまでのステップの b を、上から順に（同じ key は書きかえる） */
  function boardItems() {
    var items = [];
    for (var i = 0; i <= state.idx; i++) {
      var s = steps[i];
      if (s.bh) items.push({ h: s.bh });
      var answered = i < state.idx || (state.phase === 1 && state.done) || (!hasAns(s) && i === state.idx);
      if (!s.b || !answered) continue;
      (Array.isArray(s.b) ? s.b : [s.b]).forEach(function (b) {
        var j = b.key ? items.map(function (x) { return x.key; }).indexOf(b.key) : -1;
        if (j >= 0) items[j] = b; else items.push(b);
      });
    }
    return items;
  }
  function renderBoard() {
    var items = boardItems();
    $('blist').hidden = !items.length;
    panel.classList.toggle('long', items.length > 7);
    $('blist').innerHTML = (cfg.boardTitle ? '<h3>' + esc(cfg.boardTitle) + '</h3>' : '') + items.map(function (b) {
      if (b.h) return '<h3>' + b.h + '</h3>';
      return '<div class="bi"><i style="--c:' + (b.col || 'var(--chalk-3)') + '"></i><span>' + b.t + '</span></div>';
    }).join('');
    var bl = $('blist'); bl.scrollTop = bl.scrollHeight;
  }
  function render() {
    var st = cur(), a = hasAns(st);
    var tag = $('tag'); tag.textContent = st.tag || ''; tag.hidden = !st.tag;
    tag.className = 'tag' + (st.tag === '考えよう' || st.tag === 'チャレンジ' ? ' kangae' : st.tag === 'ことば' ? ' kotoba' : '');
    $('q').innerHTML = st.q;
    $('ansbox').hidden = !a;
    $('ans').innerHTML = a && state.phase === 1 ? st.a : '';
    $('sub').innerHTML = a && state.phase === 1 && st.sub ? st.sub : '';
    $('wait').hidden = !(a && state.phase === 0);
    $('notes').innerHTML = (st.notes || []).map(function (t) { return '<p' + (t.key ? ' class="key"' : '') + '>' + (t.t || t) + '</p>'; }).join('');
    panel.classList.toggle('done', state.done && state.phase === 1);
    renderBoard();
    $('pn').textContent = state.idx + 1; $('pt').textContent = steps.length;
    $('pbar').style.width = ((state.idx + (state.phase && a ? 1 : .5)) / steps.length * 100) + '%';
    $('prev').disabled = state.idx === 0 && state.phase === 0;
    $('next').disabled = state.idx === steps.length - 1 && (!a || state.phase === 1);
    $('replay').hidden = !st.dur;
    cv.setAttribute('aria-label', st.q.replace(/<[^>]+>/g, ''));
    bannerTxt = null; renderBanner();
  }
  var bannerTxt = null;
  function renderBanner() {
    var st = cur(), t = '';
    if (typeof st.banner === 'function') t = st.banner({ t: state.t, ph: state.phase, V: state.V, done: state.done }) || '';
    else if (st.banner && state.done && (state.phase === 1 || !hasAns(st))) t = st.banner;
    if (t === bannerTxt) return; bannerTxt = t;
    var b = $('banner'); b.hidden = !t; b.textContent = t;
  }

  function resize() {
    var r = stage.getBoundingClientRect(); DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = r.width; H = r.height; cv.width = Math.max(1, Math.round(W * DPR)); cv.height = Math.max(1, Math.round(H * DPR));
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  resize();

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var st = cur();
    if (state.playing) {
      state.t = clamp((now - state.t0) / 1000 / st.dur, 0, 1); animSliders();
      if (state.t >= 1) { state.playing = false; setDone(true); }
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    if (W > 0 && H > 0) {
      var M = st.model || M0, v = st.view || VIEW0;
      if (typeof v === 'function') v = v({ t: state.t, ph: state.phase, V: state.V });
      var tg = { th: v.th * DEG, ps: v.ps * DEG, rho: (v.rho || 1.05) * M.R, target: v.target || M.ctr };
      if (!cam) cam = { th: tg.th, ps: tg.ps, rho: tg.rho, target: tg.target.slice() };
      var k = RM ? 1 : 1 - Math.exp(-dt * 4.5);
      cam.th += wrapPI(tg.th - cam.th) * k; cam.ps += (tg.ps - cam.ps) * k; cam.rho += (tg.rho - cam.rho) * k; cam.target = lerp3(cam.target, tg.target, k);
      if (st.spin && !drag && !RM) spinT += dt * .22;
      var top = Math.min(56, H * .09), bot = (st.sliders && st.sliders.length ? 56 * st.sliders.length : 40);
      var C = makeCam({ target: cam.target, rho: cam.rho, theta: cam.th + dragT + spinT, psi: clamp(cam.ps + dragP, -1.45, 1.45) }, W / 2, top + (H - top - bot) / 2, Math.min(W, H - top - bot) / 2, .82);
      var ga = RM ? 1 : clamp((now - fadeT) / 320, 0, 1);
      ctx.globalAlpha = 1;
      var D = makeD(C, M, { t: state.phase === 1 || !hasAns(st) ? state.t : 0, ph: state.phase, V: state.V, now: now / 1000, done: state.done, W: W, H: H });
      ctx.save(); ctx.globalAlpha = ga;
      try { st.draw(D); } catch (e) { if (window.console) console.error(e); }
      ctx.restore();
    }
    renderBanner();
    requestAnimationFrame(frame);
  }

  cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (_) { } });
  cv.addEventListener('pointermove', function (e) { if (!drag) return; dragT -= (e.clientX - drag.x) * .009; dragP += (e.clientY - drag.y) * .009; drag.x = e.clientX; drag.y = e.clientY; });
  function endDrag() { drag = null; }
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('dblclick', function () { dragT = 0; dragP = 0; spinT = 0; });
  $('next').addEventListener('click', next);
  $('prev').addEventListener('click', prev);
  $('replay').addEventListener('click', replay);
  function toggleFS() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) { var p = document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(function () { }); }
    } catch (e) { }
  }
  $('fs').addEventListener('click', toggleFS);
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tg = e.target || {}, isBtn = tg.tagName === 'BUTTON' || tg.tagName === 'A', isRange = tg.type === 'range', k = e.key;
    if ((k === 'ArrowRight' || k === 'ArrowLeft') && isRange) return;
    if ((k === 'Enter' || k === ' ') && (isBtn || isRange)) return;
    if (k === 'ArrowRight' || k === 'PageDown' || k === 'Enter' || k === ' ') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'r' || k === 'R') replay();
    else if (k === 'f' || k === 'F') toggleFS();
  });
  var m = /^#step-(\d+)$/.exec(location.hash || ''), start = m ? clamp(+m[1] - 1, 0, steps.length - 1) : 0;
  enter(start, m && hasAns(steps[start]) ? 1 : 0, false);
  requestAnimationFrame(frame);
}

window.K3 = {
  run: run, cuboid: cuboid, ekey: ekey, rel: rel, isPerp: isPerp, group: group, face: face, lp: lp, edgesBy: edgesBy,
  pp: pp, facesBy: facesBy, dist: dist, jp: jp, COL: COL, v: V3, inPlane: inPlane
};
})();
