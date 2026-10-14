/* バスケ分析スタジオ — サンプル試合の「合成映像」描画
   シミュレーションの軌跡から、任意の時刻 t の1コマを Canvas に描く（純粋関数的なのでシーク自由）。
   カメラは観客席の高い位置から、ボールを追ってゆっくりパンする。
   opts.wide: 全景カメラ（360°・広角）のつもりの映像。カメラは動かず、コート全体（両方のゴール）が映りっぱなしになる。 */
(function (root) {
  'use strict';
  const BS = root.BS;
  const CT = BS.COURT;

  function bsearch(arr, t, key) {
    let lo = 0, hi = arr.length - 1;
    if (hi < 0) return -1;
    if (t < arr[0][key]) return -1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (arr[mid][key] <= t) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  function Renderer(game, canvas, opts) {
    const WIDE = !!(opts && opts.wide);
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const tr = game.track;
    const frames = tr.frames;
    const pmap = {};
    game.teams.forEach((t) => t.players.forEach((p) => { pmap[p.id] = { no: p.no, team: t.id, name: p.name }; }));
    const teamCol = game.teams.map((t) => ({ main: t.color, text: t.text || '#fff', trim: t.trim || '#fff' }));
    const jumps = tr.jumps.slice().sort((a, b) => a.t0 - b.t0);
    const poses = tr.poses.slice().sort((a, b) => a.t0 - b.t0);

    /* ---------- 観客席テクスチャ（1回だけ作る） ---------- */
    const crowd = document.createElement('canvas');
    crowd.width = 2400; crowd.height = 260;
    (function paintCrowd() {
      const c = crowd.getContext('2d');
      const R = BS.rng(77);
      const g = c.createLinearGradient(0, 0, 0, 260);
      g.addColorStop(0, '#20242e'); g.addColorStop(1, '#2d3240');
      c.fillStyle = g; c.fillRect(0, 0, 2400, 260);
      // 2階ギャラリーの手すり
      c.fillStyle = '#3b4252'; c.fillRect(0, 150, 2400, 10);
      const shirt = ['#c94f4f', '#3f6fd8', '#e0e0e0', '#2c2c2c', '#d9a441', '#5aa36b', '#8a5cc2', '#f07b3f', '#6b7a8f'];
      for (let row = 0; row < 5; row++) {
        const y = 40 + row * 24;
        for (let x = 6; x < 2400; x += 15 + R.int(0, 7)) {
          if (R.chance(0.18)) continue;
          c.fillStyle = R.pick(shirt);
          c.fillRect(x - 5, y + 4, 11, 12);
          c.fillStyle = R.pick(['#f1c9a5', '#e0b48f', '#c99a74', '#f5d7bb']);
          c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#1d1a18';
          c.beginPath(); c.arc(x, y - 2, 5, Math.PI, Math.PI * 2); c.fill();
        }
      }
      // 横断幕
      [[180, '#2f6fed', 'GO BLUE WINGS'], [900, '#e0413a', 'RED HAWKS'], [1600, '#2f6fed', 'ONE TEAM'], [2150, '#e0413a', 'FIGHT!']].forEach(([x, col, txt]) => {
        c.fillStyle = col; c.fillRect(x, 164, 260, 44);
        c.fillStyle = '#fff'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(txt, x + 130, 187);
      });
      c.fillStyle = '#1a1d25'; c.fillRect(0, 215, 2400, 45);
    })();

    /* ---------- カメラ ---------- */
    const F = WIDE ? Math.round(W * 0.5) : 1330;      // 全景：横幅の半分（コート全体が入る広さ）
    let cam = null;
    function setCam(camX) {
      const C = [camX, CT.W + 13.0, 8.4];
      const T = [camX, 5.6, 0];
      let f = [T[0] - C[0], T[1] - C[1], T[2] - C[2]];
      const fl = Math.hypot(f[0], f[1], f[2]);
      f = f.map((v) => v / fl);
      const r = [1, 0, 0];
      const u = [0, f[2], -f[1]];
      cam = { C, f, r, u, x: camX };
    }
    function proj(x, y, z) {
      const dx = x - cam.C[0], dy = y - cam.C[1], dz = z - cam.C[2];
      const depth = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
      const px = dx;
      const py = dy * cam.u[1] + dz * cam.u[2];
      const d = Math.max(0.5, depth);
      return [W / 2 + F * px / d, H / 2 - F * py / d, d];
    }

    /* ---------- 選手・ボールの位置 ---------- */
    function slotPos(s, t) {
      let i = bsearch(frames, t, 't');
      if (i < 0) i = 0;
      const a = frames[i], b = frames[Math.min(i + 1, frames.length - 1)];
      let k = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0;
      k = BS.clamp(k, 0, 1);
      const e = 0.5 * k + 0.5 * BS.smooth(k);
      const x = a.p[2 * s] + (b.p[2 * s] - a.p[2 * s]) * e;
      const y = a.p[2 * s + 1] + (b.p[2 * s + 1] - a.p[2 * s + 1]) * e;
      const dt = Math.max(0.05, b.t - a.t);
      const speed = Math.hypot(b.p[2 * s] - a.p[2 * s], b.p[2 * s + 1] - a.p[2 * s + 1]) / dt;
      const sway = speed < 0.4 ? 0.06 : 0;
      return {
        x: x + sway * Math.sin(t * 1.7 + s * 1.3),
        y: y + sway * Math.cos(t * 1.3 + s * 0.7),
        speed, dirx: Math.sign(b.p[2 * s] - a.p[2 * s]) || 1
      };
    }
    function activeIn(list, s, t) {
      let i = bsearch(list, t, 't0');
      for (; i >= 0 && list[i].t0 > t - 2; i--) {
        const it = list[i];
        if (it.s === s && t >= it.t0 && t <= it.t1) return it;
      }
      return null;
    }
    function jumpZ(s, t) {
      const j = activeIn(jumps, s, t);
      if (!j) return 0;
      return j.h * Math.sin(Math.PI * BS.clamp((t - j.t0) / (j.t1 - j.t0), 0, 1));
    }
    /* 得点の直後（ボールがネットを通る間）は、見た目だけ現実に近づける：
       ネットがボールを減速させてからストンと落ち、ネットが揺れる。試合の時刻やタグは変えない（描き方だけ）。 */
    const scoreTimes = tr.scores.slice(1).map((s) => s.t);
    function scoreAt(t) {
      let lo = 0, hi = scoreTimes.length - 1, k = -1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; if (scoreTimes[mid] <= t) { k = mid; lo = mid + 1; } else hi = mid - 1; }
      if (k < 0) return null;
      const tau = t - scoreTimes[k];
      return tau <= 0.9 ? { tau, ts: scoreTimes[k] } : null;
    }
    function ballAt(t) {
      const p = ballRaw(t);
      const sc = scoreAt(t);
      if (!sc || sc.tau >= 0.75 || p.holder !== undefined) return p;
      // ネットの中は約 1.9 m/秒で通り、抜けてから重力で加速する。0.5〜0.75 秒で元の軌道に戻す
      const tau = sc.tau;
      const d = tau <= 0.25 ? 1.9 * tau : 0.475 + 1.9 * (tau - 0.25) + 4.9 * (tau - 0.25) * (tau - 0.25);
      const zv = Math.max(0.12, CT.rimH - d);
      const k = BS.smooth(BS.clamp((tau - 0.5) / 0.25, 0, 1));
      return Object.assign({}, p, { z: zv + (p.z - zv) * k });
    }
    function ballRaw(t) {
      let i = bsearch(tr.ball, t, 't0');
      if (i < 0) i = 0;
      const seg = tr.ball[i];
      const k = seg.t1 > seg.t0 ? BS.clamp((t - seg.t0) / (seg.t1 - seg.t0), 0, 1) : 1;
      if (seg.k === 'hold') {
        const p = slotPos(seg.s, t);
        const jz = jumpZ(seg.s, t);
        const z = seg.dr ? 0.14 + 0.92 * Math.abs(Math.sin(Math.PI * (t - seg.t0) * 2.3)) : 1.12 + jz;
        return { x: p.x + 0.22 * p.dirx, y: p.y + 0.22, z, holder: seg.s, dribble: seg.dr };
      }
      if (seg.k === 'rest') return { x: seg.a[0], y: seg.a[1], z: seg.a[2] };
      const a = seg.a, b = seg.b;
      const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
      if (seg.k === 'air') {
        const Hh = Math.max(0, seg.h - Math.max(a[2], b[2]));
        const z = a[2] + (b[2] - a[2]) * k + 4 * Hh * k * (1 - k);
        return { x, y, z, flying: true };
      }
      // free（弾む）
      const z = a[2] + (b[2] - a[2]) * k + seg.h * (1 - k) * Math.abs(Math.sin(Math.PI * seg.n * k));
      return { x, y, z: Math.max(0.12, z) };
    }
    function camX(t) {
      let s = 0;
      for (let i = 0; i < 6; i++) s += ballAt(Math.max(0, t - i * 0.3)).x;
      return BS.clamp(s / 6, 9.2, CT.L - 9.2);
    }
    function slotMapAt(t) {
      const i = bsearch(tr.slots, t, 't');
      return tr.slots[Math.max(0, i)].map;
    }

    /* ---------- 描画パーツ ---------- */
    function poly(pts, fill, stroke, lw) {
      ctx.beginPath();
      pts.forEach((p, i) => { const q = proj(p[0], p[1], p[2] || 0); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
    }
    function line3(pts, stroke, lw) {
      ctx.beginPath();
      pts.forEach((p, i) => { const q = proj(p[0], p[1], p[2] || 0); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke();
    }
    function arcPts(cx, cy, r, a0, a1, n, z) {
      const out = [];
      for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z || 0]); }
      return out;
    }

    function drawEnvironment() {
      // 壁・観客席（奥のサイドラインより向こう）
      const wl = proj(-12, -4.5, 0), wr = proj(CT.L + 12, -4.5, 0), wt = proj(cam.x, -4.5, 9.5);
      ctx.fillStyle = '#171a21';
      ctx.fillRect(0, 0, W, H);
      const top = Math.min(wt[1], wl[1] - 10);
      const floorY = wl[1];
      const par = (cam.x - 14) * 38;
      const scale = (floorY - top) / 260;
      const cw = 2400 * scale;
      const x0 = W / 2 - cw / 2 - par;
      ctx.drawImage(crowd, x0, top, cw, floorY - top);
      if (x0 > 0) ctx.drawImage(crowd, x0 - cw, top, cw, floorY - top);
      if (x0 + cw < W) ctx.drawImage(crowd, x0 + cw, top, cw, floorY - top);
      void wr;
      // 床（コート外）
      poly([[-12, -4.5], [CT.L + 12, -4.5], [CT.L + 12, 22], [-12, 22]], '#9c6b3f');
      const g = ctx.createLinearGradient(0, floorY, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, floorY, W, H - floorY);
      // コート面
      poly([[0, 0], [CT.L, 0], [CT.L, CT.W], [0, CT.W]], '#d6a466');
      // 板目
      ctx.globalAlpha = 0.12;
      for (let y = 0.5; y < CT.W; y += 0.75) line3([[0, y], [CT.L, y]], '#7a4b22', 1);
      ctx.globalAlpha = 1;
      // 制限区域（ペイント）とセンターサークル
      const kw = CT.keyW / 2;
      [[0, 1], [CT.L, -1]].forEach(([bx, d], i) => {
        const col = i === 0 ? 'rgba(47,111,237,0.55)' : 'rgba(224,65,58,0.55)';
        poly([[bx, 7.5 - kw], [bx + d * CT.keyL, 7.5 - kw], [bx + d * CT.keyL, 7.5 + kw], [bx, 7.5 + kw]], col);
      });
      poly(arcPts(14, 7.5, CT.centerR, 0, Math.PI * 2, 36), 'rgba(90,60,140,0.35)');
      // ライン
      const L = 'rgba(255,255,255,0.92)';
      poly([[0, 0], [CT.L, 0], [CT.L, CT.W], [0, CT.W]], null, L, 2.4);
      line3([[14, 0], [14, CT.W]], L, 2);
      poly(arcPts(14, 7.5, CT.centerR, 0, Math.PI * 2, 36), null, L, 2);
      [[0, 1], [CT.L, -1]].forEach(([bx, d]) => {
        const rx = bx + d * CT.rimFromBaseline;
        poly([[bx, 7.5 - kw], [bx + d * CT.keyL, 7.5 - kw], [bx + d * CT.keyL, 7.5 + kw], [bx, 7.5 + kw]], null, L, 2);
        line3(arcPts(bx + d * CT.keyL, 7.5, CT.ftR, -Math.PI / 2, Math.PI / 2, 18).map((p) => [bx + d * CT.keyL + (p[0] - (bx + d * CT.keyL)) * d, p[1]]), L, 2);
        // 3ポイントライン
        const yc = CT.cornerLine, yc2 = CT.W - CT.cornerLine;
        const ang = Math.asin((7.5 - yc) / CT.three);
        const arc = arcPts(0, 0, CT.three, -ang, ang, 40).map((p) => [rx + d * p[0], 7.5 + p[1]]);
        const xj = rx + d * CT.three * Math.cos(ang);
        line3([[bx, yc], [xj, yc]].concat(arc).concat([[xj, yc2], [bx, yc2]]), L, 2);
        // 制限区域の半円
        line3(arcPts(0, 0, CT.raR, -Math.PI / 2, Math.PI / 2, 14).map((p) => [rx + d * p[0], 7.5 + p[1]]), L, 1.6);
      });
      // ベンチ（奥）
      [[8.5, 12.5], [15.5, 19.5]].forEach(([a, b]) => poly([[a, -1.6], [b, -1.6], [b, -1.1], [a, -1.1]], '#3a3f4b'));
    }

    /* swish: 得点からの経過秒（そのゴールでネットが揺れている間だけ。それ以外は -1） */
    const rimHits = tr.rimHits || [];
    function rimHitAt(side, t) { let best = null; for (const hh of rimHits) { if (hh.side === side && hh.t <= t && t - hh.t <= 0.6) best = hh; } return best; }
    function drawHoop(side, list, swish, amp) {
      if (amp == null) amp = 1;
      const d = side === 0 ? 1 : -1;
      const bx = side === 0 ? 0 : CT.L;
      const rimX = bx + d * CT.rimFromBaseline;
      const boardX = bx + d * CT.boardFromBaseline;
      list.push({
        y: 7.5, draw() {
          // 支柱
          const poleX = bx - d * 1.1;
          line3([[poleX, 7.5, 0], [poleX, 7.5, 3.35]], '#3b4150', 7);
          line3([[poleX, 7.5, 3.35], [boardX - d * 0.05, 7.5, 3.45]], '#3b4150', 5);
          poly([[poleX - 0.5, 6.9, 0], [poleX + 0.5, 6.9, 0], [poleX + 0.5, 8.1, 0], [poleX - 0.5, 8.1, 0]], '#2a2f3a');
          // ボード
          poly([[boardX, 6.6, 2.9], [boardX, 8.4, 2.9], [boardX, 8.4, 3.95], [boardX, 6.6, 3.95]], 'rgba(235,242,255,0.55)', '#ffffff', 2);
          poly([[boardX, 7.2, 3.05], [boardX, 7.8, 3.05], [boardX, 7.8, 3.5], [boardX, 7.2, 3.5]], null, '#e2553f', 2);
          // ネット（得点の直後は、ふくらんで揺れる）
          let e = 0, wob = 0;
          if (swish >= 0) {
            if (swish <= 0.6) { e = Math.sin(Math.PI * swish / 0.6); wob = e; }
            else { wob = 0.35 * (1 - (swish - 0.6) / 0.3); e = wob * Math.sin((swish - 0.6) * 38); }
            e *= amp; wob *= amp;
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2;
          for (let i = 0; i < 12; i++) {
            const a = i / 12 * Math.PI * 2;
            const tw = wob ? 0.22 * wob * Math.sin(swish * 40 + i * 1.7) : 0;
            const rm = 0.1775 + 0.085 * e, rb = 0.13 + 0.1 * e;
            const p1 = proj(rimX + CT.rimR * Math.cos(a), 7.5 + CT.rimR * Math.sin(a), CT.rimH);
            const pm = proj(rimX + rm * Math.cos(a + 0.15 + tw * 0.5), 7.5 + rm * Math.sin(a + 0.15 + tw * 0.5), CT.rimH - 0.21);
            const p2 = proj(rimX + rb * Math.cos(a + 0.3 + tw), 7.5 + rb * Math.sin(a + 0.3 + tw), CT.rimH - 0.42 - 0.06 * e);
            ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(pm[0], pm[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
          }
          // リング
          poly(arcPts(rimX, 7.5, CT.rimR, 0, Math.PI * 2, 20, CT.rimH), null, '#ff6a1a', 3);
        }
      });
    }

    function drawPerson(o) {
      const foot = proj(o.x, o.y, 0);
      const s = F / foot[2];
      const up = proj(o.x, o.y, o.z)[1] - foot[1];
      const fx = foot[0], fy = foot[1] + up;
      const h = (o.h || 1.8) * s;
      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(foot[0], foot[1], 0.34 * s, 0.1 * s, 0, 0, Math.PI * 2); ctx.fill();
      const hip = fy - h * 0.47, sh = fy - h * 0.8, headY = fy - h * 0.9;
      const run = Math.min(1, o.speed / 4.5);
      const ph = o.t * 9;
      const sw = 0.16 * s * run;
      // 脚
      ctx.strokeStyle = o.skin; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, 0.1 * s);
      ctx.beginPath();
      ctx.moveTo(fx - 0.07 * s, hip); ctx.lineTo(fx - 0.08 * s + Math.sin(ph) * sw, fy);
      ctx.moveTo(fx + 0.07 * s, hip); ctx.lineTo(fx + 0.08 * s - Math.sin(ph) * sw, fy);
      ctx.stroke();
      // シューズ
      ctx.fillStyle = o.shoe;
      ctx.fillRect(fx - 0.14 * s + Math.sin(ph) * sw, fy - 0.04 * s, 0.13 * s, 0.06 * s);
      ctx.fillRect(fx + 0.02 * s - Math.sin(ph) * sw, fy - 0.04 * s, 0.13 * s, 0.06 * s);
      // パンツ
      ctx.fillStyle = o.main;
      ctx.fillRect(fx - 0.2 * s, hip - 0.02 * s, 0.4 * s, 0.26 * s);
      // 胴体（ユニフォーム）
      ctx.beginPath();
      const tw = 0.21 * s;
      ctx.moveTo(fx - tw, hip); ctx.lineTo(fx - tw * 1.05, sh); ctx.lineTo(fx + tw * 1.05, sh); ctx.lineTo(fx + tw, hip); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = o.trim; ctx.lineWidth = Math.max(1, 0.025 * s); ctx.stroke();
      // 腕
      ctx.strokeStyle = o.skin; ctx.lineWidth = Math.max(2, 0.085 * s);
      ctx.beginPath();
      if (o.pose === 'shoot' || o.pose === 'block' || o.pose === 'reb') {
        ctx.moveTo(fx - tw, sh + 0.03 * s); ctx.lineTo(fx - 0.12 * s, sh - 0.45 * s);
        ctx.moveTo(fx + tw, sh + 0.03 * s); ctx.lineTo(fx + 0.12 * s, sh - 0.45 * s);
      } else if (o.ball) {
        ctx.moveTo(fx - tw, sh + 0.03 * s); ctx.lineTo(fx - tw - 0.06 * s, hip + 0.02 * s);
        ctx.moveTo(fx + tw, sh + 0.03 * s); ctx.lineTo(o.ball[0], Math.max(o.ball[1], sh));
      } else {
        const a = Math.sin(ph) * sw * 0.8;
        ctx.moveTo(fx - tw, sh + 0.03 * s); ctx.lineTo(fx - tw - 0.08 * s - a, hip + 0.05 * s);
        ctx.moveTo(fx + tw, sh + 0.03 * s); ctx.lineTo(fx + tw + 0.08 * s + a, hip + 0.05 * s);
      }
      ctx.stroke();
      // 頭
      ctx.fillStyle = o.skin;
      ctx.beginPath(); ctx.arc(fx, headY, 0.115 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.hair;
      ctx.beginPath(); ctx.arc(fx, headY - 0.02 * s, 0.118 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
      // 背番号
      if (o.no) {
        const fs = Math.max(8, 0.2 * s);
        ctx.fillStyle = o.text;
        ctx.font = `bold ${fs}px "Helvetica Neue", Arial, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.no, fx, (hip + sh) / 2 + 0.01 * s);
      }
      if (o.fall) {
        // 倒れ込み（チャージング）表現：小さく
      }
    }

    const SKINS = ['#f1c9a5', '#e8b98f', '#d9a57d', '#f3d2b3', '#e0ad86'];
    const HAIRS = ['#1d1a18', '#2b2119', '#161412', '#3a2a1c'];

    function drawScoreBug(t) {
      const i = bsearch(tr.scores, t, 't');
      const sc = tr.scores[Math.max(0, i)].s;
      const pi = bsearch(game.periods, t, 't0');
      const per = game.periods[Math.max(0, pi)];
      const t1 = per.t1 || game.duration;
      const clock = Math.max(0, 480 * (1 - (t - per.t0) / Math.max(1, t1 - per.t0 - 6)));
      const x = 22, y = 20;
      ctx.fillStyle = 'rgba(12,15,22,0.86)';
      roundRect(x, y, 330, 44, 8); ctx.fill();
      game.teams.forEach((tm, k) => {
        const bx = x + 10 + k * 120;
        ctx.fillStyle = tm.color; ctx.fillRect(bx, y + 10, 8, 24);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 17px "Helvetica Neue", Arial, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(tm.short, bx + 14, y + 22);
        ctx.font = 'bold 22px "Helvetica Neue", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(sc[k]), bx + 104, y + 23);
      });
      ctx.fillStyle = '#ffd24a'; ctx.font = 'bold 16px "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(per.n + 'Q', x + 268, y + 14);
      ctx.fillStyle = '#fff'; ctx.font = '15px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(BS.fmtTime(clock), x + 268, y + 31);
      // 合成映像の表示
      ctx.fillStyle = 'rgba(12,15,22,0.6)';
      roundRect(W - 238, 22, 216, 28, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('SAMPLE GAME（合成映像）', W - 130, 37);
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }
    function drawOverlays(t) {
      for (const o of tr.overlays) {
        if (t < o.t0 || t > o.t1) continue;
        const a = Math.min(1, (t - o.t0) / 0.3, (o.t1 - t) / 0.3);
        ctx.globalAlpha = BS.clamp(a, 0, 1);
        ctx.fillStyle = 'rgba(10,12,18,0.82)';
        roundRect(W / 2 - 230, H / 2 - 50, 460, 100, 14); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.text, W / 2, H / 2 - (o.kind === 'final' ? 14 : 0));
        if (o.kind === 'final') {
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText(`${game.teams[0].short} ${game.final[0]} - ${game.final[1]} ${game.teams[1].short}`, W / 2, H / 2 + 24);
        }
        ctx.globalAlpha = 1;
      }
    }

    /* ---------- 1コマ描画 ---------- */
    function draw(t) {
      t = BS.clamp(t, 0, game.duration);
      const panX = camX(t);                 // ボールを追う位置（全景カメラは動かないが、審判はこの位置を追う）
      setCam(WIDE ? CT.L / 2 : panX);
      drawEnvironment();
      const map = slotMapAt(t);
      const ball = ballAt(t);
      const list = [];
      const sc = scoreAt(t);
      const scSide = sc ? (ballRaw(sc.ts).x < CT.L / 2 ? 0 : 1) : -1;
      // （テスト用に足したもの：rimplay.js がリングに当てたシュートでは、当たった直後にネットを少し揺らす）
      const hk = (side) => { if (scSide === side) return [sc.tau, 1]; const hh = rimHitAt(side, t); return hh ? [t - hh.t, hh.amp] : [-1, 1]; };
      drawHoop(0, list, ...hk(0));
      drawHoop(1, list, ...hk(1));
      // 審判（ボールを追う）
      const refX1 = BS.clamp(panX + 3.5, 2, CT.L - 2), refX2 = BS.clamp(panX - 5.5, 1.5, CT.L - 1.5);
      [[refX1, -0.55, 0], [refX2, -0.35, 1]].forEach(([x, y, k]) => {
        list.push({ y, draw: () => drawPerson({ x: x + Math.sin(t * 0.8 + k) * 0.4, y, z: 0, h: 1.76, speed: 1.2, t, main: '#2a2a2a', trim: '#cccccc', text: '#fff', skin: SKINS[k], hair: HAIRS[0], shoe: '#111', no: '' }) });
      });
      for (let s = 0; s < 10; s++) {
        const pid = map[s];
        const info = pmap[pid] || { no: '?', team: s < 5 ? 0 : 1 };
        const p = slotPos(s, t);
        const z = jumpZ(s, t);
        const ps = activeIn(poses, s, t);
        const col = teamCol[info.team];
        const holding = ball.holder === s && !ball.dribble;
        let bscr = null;
        if (ball.holder === s) { const q = proj(ball.x, ball.y, ball.z); bscr = [q[0], q[1]]; }
        list.push({
          y: p.y, draw: () => drawPerson({
            x: p.x, y: p.y, z, h: 1.72 + (s % 5) * 0.045, speed: p.speed, t: t + s * 0.37,
            main: col.main, trim: col.trim, text: col.text, skin: SKINS[(s * 7 + info.no.length) % SKINS.length], hair: HAIRS[s % HAIRS.length], shoe: s < 5 ? '#f4f4f4' : '#1b1b1b',
            no: info.no, pose: ps ? ps.k : (holding ? null : null), ball: bscr
          })
        });
      }
      list.push({
        y: ball.y + 0.001, draw: () => {
          const sh = proj(ball.x, ball.y, 0);
          const s = F / sh[2];
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath(); ctx.ellipse(sh[0], sh[1], 0.14 * s, 0.05 * s, 0, 0, Math.PI * 2); ctx.fill();
          const q = proj(ball.x, ball.y, ball.z);
          const r = Math.max(3, 0.125 * F / q[2]);
          const g = ctx.createRadialGradient(q[0] - r * 0.3, q[1] - r * 0.3, r * 0.2, q[0], q[1], r);
          g.addColorStop(0, '#ffa04d'); g.addColorStop(1, '#c4520f');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(40,20,10,0.7)'; ctx.lineWidth = Math.max(1, r * 0.12);
          ctx.beginPath(); ctx.moveTo(q[0] - r, q[1]); ctx.lineTo(q[0] + r, q[1]); ctx.stroke();
          ctx.beginPath(); ctx.arc(q[0], q[1], r * 0.95, -1.1, 1.1); ctx.stroke();
        }
      });
      list.sort((a, b) => a.y - b.y);
      list.forEach((it) => it.draw());
      drawScoreBug(t);
      drawOverlays(t);
    }

    /* サンプル映像のゴール位置（自動解析の「ゴールを指定」を、サンプルでは最初から入れておくため）。
       そのゴールがよく映っている時刻を探し、バックボードの枠とリングの両端を画面の座標で返す。 */
    function hoopMark(side) {
      const d = side === 0 ? 1 : -1, bx = side === 0 ? 0 : CT.L;
      const rimX = bx + d * CT.rimFromBaseline, boardX = bx + d * CT.boardFromBaseline;
      const edge = side === 0 ? 9.2 : CT.L - 9.2;
      // カメラがそのゴール側の端まで寄っていて、ボールがゴールから離れている時刻（枠の中に選手やボールが入りにくい）
      let t = -1;
      for (let x = 5; x < game.duration - 5; x += 0.5) {
        if (!WIDE && (Math.abs(camX(x) - edge) > 0.02 || Math.abs(camX(x + 0.5) - edge) > 0.02)) continue;
        const b = ballAt(x);
        if (Math.abs(b.x - rimX) < 4 || b.z > 2.2) continue;
        if (WIDE) {
          // 全景カメラ：どの時刻でもゴールは映っている。板やリングに選手が重なっていないコマを選ぶ
          let busy = false;
          for (let k = 0; k < 10 && !busy; k++) { const q = slotPos(k, x); if (Math.hypot(q.x - rimX, q.y - 7.5) < 3.2) busy = true; }
          if (busy) continue;
        }
        t = x; break;
      }
      if (t < 0) return null;
      setCam(WIDE ? CT.L / 2 : camX(t));
      const pts = [[boardX, 6.6, 2.9], [boardX, 8.4, 2.9], [boardX, 8.4, 3.95], [boardX, 6.6, 3.95]].map((p) => proj(p[0], p[1], p[2]));
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const box = { x: Math.min.apply(null, xs) - 4, y: Math.min.apply(null, ys) - 4, w: Math.max.apply(null, xs) - Math.min.apply(null, xs) + 8, h: Math.max.apply(null, ys) - Math.min.apply(null, ys) + 8 };
      let l = null, r = null;
      for (let i = 0; i < 48; i++) {
        const a = i / 48 * Math.PI * 2;
        const q = proj(rimX + CT.rimR * Math.cos(a), 7.5 + CT.rimR * Math.sin(a), CT.rimH);
        if (!l || q[0] < l[0]) l = q;
        if (!r || q[0] > r[0]) r = q;
      }
      return { t, box, rim: { cx: (l[0] + r[0]) / 2, cy: (l[1] + r[1]) / 2, w: Math.hypot(r[0] - l[0], r[1] - l[1]) } };
    }

    return { draw, canvas, ballAt, slotPos, camX, game, hoopMark };
  }

  BS.Renderer = Renderer;
})(typeof window !== 'undefined' ? window : globalThis);
