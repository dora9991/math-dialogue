/* バスケ分析スタジオ — サンプル試合のシミュレーション
   シード固定で「映像用の動き（選手・ボールの軌跡）」と「正解のタグ（イベント）」を同時に作る。
   座標はコート全体（x: 0〜28m 長手方向、y: 0〜15m 奥のサイドライン=0）。 */
(function (root) {
  'use strict';
  const BS = root.BS;
  const C = BS.COURT;

  /* ---------- サンプルの2チーム（架空） ---------- */
  const HOME = {
    name: 'ブルーウィングス', short: 'BLU', color: '#2f6fed', text: '#ffffff', trim: '#bcd3ff',
    style: { pnr: 1.45, iso: 0.75, post: 0.75, spot: 0.95, cut: 0.65, offscreen: 0.6 },
    quality: { pnr: 1.14, iso: 0.9, post: 0.95, spot: 1.0, cut: 1.05, offscreen: 1.0, transition: 1.0, putback: 1.0 },
    toRate: 1.3, passTO: 0.62, orb: 0.92, drb: 0.82, transition: 0.95, foulRate: 1.05,
    players: [
      { no: 4, name: '佐藤', pos: 'PG', role: 0, starter: true, h: 1.70, fg2: 0.45, fg3: 0.33, ft: 0.80, use: 1.0, pass: 1.7, to: 1.55, reb: 0.5, stl: 1.3, blk: 0.2, foul: 0.9 },
      { no: 5, name: '鈴木', pos: 'SG', role: 1, starter: true, h: 1.74, fg2: 0.46, fg3: 0.39, ft: 0.82, use: 1.15, pass: 0.9, to: 0.8, reb: 0.6, stl: 1.0, blk: 0.3, foul: 0.9 },
      { no: 7, name: '高橋', pos: 'SF', role: 2, starter: true, h: 1.80, fg2: 0.50, fg3: 0.33, ft: 0.76, use: 1.6, pass: 1.0, to: 1.0, reb: 1.0, stl: 1.0, blk: 0.6, foul: 3.0 },
      { no: 8, name: '田中', pos: 'PF', role: 3, starter: true, h: 1.84, fg2: 0.48, fg3: 0.27, ft: 0.66, use: 0.9, pass: 0.7, to: 0.8, reb: 1.2, stl: 0.6, blk: 0.9, foul: 1.1 },
      { no: 15, name: '伊藤', pos: 'C', role: 4, starter: true, h: 1.90, fg2: 0.56, fg3: 0, ft: 0.42, use: 1.05, pass: 0.5, to: 0.9, reb: 1.4, stl: 0.4, blk: 1.6, foul: 1.2 },
      { no: 10, name: '中村', pos: 'PG', role: 0, starter: false, h: 1.68, fg2: 0.41, fg3: 0.30, ft: 0.72, use: 0.85, pass: 1.3, to: 1.3, reb: 0.4, stl: 1.1, blk: 0.1, foul: 1.0 },
      { no: 6, name: '渡辺', pos: 'SG', role: 1, starter: false, h: 1.72, fg2: 0.42, fg3: 0.35, ft: 0.75, use: 0.9, pass: 0.8, to: 1.0, reb: 0.5, stl: 0.9, blk: 0.2, foul: 1.0 },
      { no: 9, name: '山本', pos: 'SF', role: 2, starter: false, h: 1.78, fg2: 0.44, fg3: 0.30, ft: 0.70, use: 0.9, pass: 0.8, to: 1.0, reb: 0.9, stl: 0.9, blk: 0.5, foul: 1.1 },
      { no: 12, name: '加藤', pos: 'PF', role: 3, starter: false, h: 1.82, fg2: 0.45, fg3: 0.22, ft: 0.62, use: 0.8, pass: 0.6, to: 0.9, reb: 1.1, stl: 0.5, blk: 0.8, foul: 1.2 },
      { no: 11, name: '小林', pos: 'C', role: 4, starter: false, h: 1.86, fg2: 0.50, fg3: 0, ft: 0.55, use: 0.8, pass: 0.5, to: 1.0, reb: 1.2, stl: 0.4, blk: 1.1, foul: 1.3 }
    ]
  };
  const AWAY = {
    name: 'レッドホークス', short: 'RED', color: '#e0413a', text: '#ffffff', trim: '#ffc9c5',
    style: { pnr: 0.9, iso: 1.0, post: 1.15, spot: 1.05, cut: 0.9, offscreen: 0.8 },
    quality: { pnr: 0.98, iso: 0.95, post: 1.0, spot: 1.02, cut: 1.0, offscreen: 1.0, transition: 1.08, putback: 1.05 },
    toRate: 0.9, passTO: 0.45, orb: 1.2, drb: 1.05, transition: 1.25, foulRate: 1.0,
    players: [
      { no: 3, name: '井上', pos: 'PG', role: 0, starter: true, h: 1.71, fg2: 0.45, fg3: 0.34, ft: 0.78, use: 1.1, pass: 1.5, to: 1.0, reb: 0.5, stl: 1.6, blk: 0.2, foul: 1.0 },
      { no: 6, name: '木村', pos: 'SG', role: 1, starter: true, h: 1.75, fg2: 0.45, fg3: 0.36, ft: 0.80, use: 1.1, pass: 0.9, to: 0.9, reb: 0.6, stl: 1.1, blk: 0.3, foul: 1.0 },
      { no: 9, name: '林', pos: 'SF', role: 2, starter: true, h: 1.79, fg2: 0.49, fg3: 0.32, ft: 0.74, use: 1.35, pass: 1.0, to: 1.0, reb: 1.0, stl: 1.0, blk: 0.6, foul: 1.0 },
      { no: 14, name: '山口', pos: 'PF', role: 3, starter: true, h: 1.85, fg2: 0.47, fg3: 0.25, ft: 0.68, use: 0.9, pass: 0.7, to: 0.9, reb: 1.3, stl: 0.6, blk: 0.9, foul: 1.1 },
      { no: 11, name: '清水', pos: 'C', role: 4, starter: true, h: 1.92, fg2: 0.54, fg3: 0, ft: 0.62, use: 1.2, pass: 0.6, to: 0.9, reb: 1.9, stl: 0.4, blk: 1.4, foul: 1.2 },
      { no: 1, name: '森', pos: 'PG', role: 0, starter: false, h: 1.67, fg2: 0.41, fg3: 0.31, ft: 0.74, use: 0.85, pass: 1.2, to: 1.1, reb: 0.4, stl: 1.1, blk: 0.1, foul: 1.0 },
      { no: 8, name: '池田', pos: 'SG', role: 1, starter: false, h: 1.73, fg2: 0.42, fg3: 0.33, ft: 0.74, use: 0.9, pass: 0.8, to: 1.0, reb: 0.5, stl: 0.9, blk: 0.2, foul: 1.0 },
      { no: 10, name: '橋本', pos: 'SF', role: 2, starter: false, h: 1.77, fg2: 0.43, fg3: 0.30, ft: 0.70, use: 0.9, pass: 0.8, to: 1.0, reb: 0.9, stl: 0.9, blk: 0.5, foul: 1.1 },
      { no: 13, name: '阿部', pos: 'PF', role: 3, starter: false, h: 1.83, fg2: 0.45, fg3: 0.2, ft: 0.62, use: 0.8, pass: 0.6, to: 0.9, reb: 1.2, stl: 0.5, blk: 0.8, foul: 1.2 },
      { no: 15, name: '石川', pos: 'C', role: 4, starter: false, h: 1.88, fg2: 0.49, fg3: 0, ft: 0.58, use: 0.8, pass: 0.5, to: 1.0, reb: 1.4, stl: 0.4, blk: 1.1, foul: 1.3 }
    ]
  };

  const ZONE_BASE = { rim: 0.56, paint: 0.42, mid: 0.355, c3: 0.37, ab3: 0.33 };
  const r2 = (v) => Math.round(v * 100) / 100;

  function generate(opts) {
    opts = opts || {};
    const seed = opts.seed || BS.sim.DEFAULT_SEED;
    const PERIOD_LEN = opts.periodLen || 390;   // 1クォーターの映像の長さ（秒）
    const R = BS.rng(seed);

    /* ---- チームと選手 ---- */
    const TEAMS = [HOME, AWAY].map((src, ti) => {
      const t = Object.assign({}, src);
      t.id = ti;
      t.players = src.players.map((p) => Object.assign({}, p, { id: (ti === 0 ? 'A' : 'B') + p.no, team: ti }));
      return t;
    });
    const P = {};
    TEAMS.forEach((t) => t.players.forEach((p) => { P[p.id] = p; }));

    /* ---- 状態 ---- */
    const G = {
      T: 0, period: 1, periodStart: 0,
      score: [0, 0], tf: [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
      pf: {}, slotMap: [], run: { team: -1, pts: 0 },
      toLeft: [[2, 3], [2, 3]], rotated: {}, lastDeadBall: 0
    };
    TEAMS.forEach((t, ti) => {
      for (let r = 0; r < 5; r++) G.slotMap[ti * 5 + r] = t.players.find((p) => p.starter && p.role === r).id;
    });

    const events = [];
    const tr = { frames: [], ball: [], slots: [], jumps: [], poses: [], overlays: [], scores: [{ t: 0, s: [0, 0] }], periods: [] };
    const cur = new Array(20).fill(0);

    /* ---- 幾何ヘルパー ---- */
    function attackDir(team) { return ((team === 0) === (G.period <= 2)) ? 1 : -1; }
    function A(team, u, v) { return attackDir(team) > 0 ? { x: C.L - u, y: 7.5 + v } : { x: u, y: 7.5 - v }; }
    function toHalf(team, x, y) {
      if (attackDir(team) > 0) return { sx: r2(7.5 + (y - 7.5)), sy: r2(C.L - x) };
      return { sx: r2(7.5 + (7.5 - y)), sy: r2(x) };
    }
    function rim3(team) { const r = A(team, C.rimFromBaseline, 0); return [r.x, r.y, C.rimH]; }
    function pos(s) { return { x: cur[2 * s], y: cur[2 * s + 1] }; }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function dist3(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
    function toward(a, b, d) { const L = Math.max(1e-6, dist(a, b)); const k = Math.min(1, d / L); return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }
    function mix(a, b, k) { return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }
    function jit(p, r) { return { x: p.x + R.range(-r, r), y: p.y + R.range(-r, r) }; }
    const slotOf = (team, role) => team * 5 + role;
    const pidAt = (s) => G.slotMap[s];
    const plAt = (s) => P[G.slotMap[s]];
    const offSlots = (team) => [0, 1, 2, 3, 4].map((r) => team * 5 + r);

    /* ---- フレーム・ボール ---- */
    function pushFrame() { tr.frames.push({ t: r2(G.T), p: cur.map(r2) }); }
    function hand(arr, s, z) { return [arr[2 * s], arr[2 * s + 1] + 0.2, z]; }
    function beat(dt, moves, bs) {
      const t0 = G.T;
      const before = cur.slice();
      if (moves) {
        for (const k in moves) {
          const q = moves[k];
          if (!q) continue;
          cur[2 * k] = BS.clamp(q.x, -1.8, C.L + 1.8);
          cur[2 * k + 1] = BS.clamp(q.y, -1.6, C.W + 1.4);
        }
      }
      G.T = t0 + dt;
      pushFrame();
      ballSeg(t0, G.T, bs, before);
    }
    function lastBall() { return tr.ball[tr.ball.length - 1]; }
    function ballSeg(t0, t1, bs, before) {
      let seg;
      const last = lastBall();
      if (!bs) {
        if (!last) seg = { k: 'rest', a: [14, 7.5, 0.12] };
        else if (last.k === 'hold') seg = { k: 'hold', s: last.s, dr: last.dr };
        else if (last.k === 'rest') seg = { k: 'rest', a: last.a };
        else seg = { k: 'rest', a: last.b };
      } else if (bs.hold !== undefined) seg = { k: 'hold', s: bs.hold, dr: !!bs.dr };
      else if (bs.pass) {
        const a = hand(before, bs.pass[0], 1.35), b = hand(cur, bs.pass[1], 1.35);
        seg = { k: 'air', a, b, h: Math.max(a[2], b[2]) + 0.2 + 0.035 * dist3(a, b) };
      } else if (bs.passTo) {
        const a = hand(before, bs.passTo[0], 1.35), b = bs.passTo[1];
        seg = { k: 'air', a, b, h: Math.max(a[2], b[2]) + 0.25 + 0.03 * dist3(a, b) };
      } else if (bs.air) seg = { k: 'air', a: bs.air.a, b: bs.air.b, h: bs.air.h };
      else if (bs.free) seg = { k: 'free', a: bs.free.a, b: bs.free.b, n: bs.free.n || 2, h: bs.free.h || 0.9 };
      else if (bs.rest) seg = { k: 'rest', a: bs.rest };
      seg.t0 = r2(t0); seg.t1 = r2(t1);
      ['a', 'b'].forEach((k) => { if (seg[k]) seg[k] = seg[k].map(r2); });
      if (seg.h !== undefined) seg.h = r2(seg.h);
      tr.ball.push(seg);
      return seg;
    }
    function ballPoint() {
      const last = lastBall();
      if (!last) return [14, 7.5, 0.12];
      if (last.k === 'hold') return hand(cur, last.s, 1.1);
      if (last.k === 'rest') return last.a;
      return last.b;
    }
    function jump(s, t0, dur, h) { tr.jumps.push({ s, t0: r2(t0), t1: r2(t0 + dur), h }); }
    function pose(s, t0, dur, k) { tr.poses.push({ s, t0: r2(t0), t1: r2(t0 + dur), k }); }
    function overlay(t0, t1, kind, text) { tr.overlays.push({ t0: r2(t0), t1: r2(t1), kind, text }); }

    /* ---- イベント ---- */
    function ev(t, type, fields) {
      const e = Object.assign({ id: 'g' + (events.length + 1), t: r2(t), type }, fields);
      events.push(e);
      return e;
    }
    function addScore(team, pts, tVisual) {
      G.score[team] += pts;
      tr.scores.push({ t: r2(tVisual), s: G.score.slice() });
      if (G.run.team === team) G.run.pts += pts; else G.run = { team, pts };
    }

    /* ---- 守備位置（マークマンとゴールの間、ボール側に寄る） ---- */
    function defendMoves(O, offTargets, ballSlot, opts) {
      opts = opts || {};
      const D = 1 - O;
      const basket = A(O, C.rimFromBaseline, 0);
      const ballP = offTargets[ballSlot] || pos(ballSlot);
      const mv = {};
      for (let r = 0; r < 5; r++) {
        const os = slotOf(O, r), ds = slotOf(D, r);
        if (opts.skip && opts.skip.includes(ds)) continue;
        const op = offTargets[os] || pos(os);
        const onBall = os === ballSlot;
        const k = onBall ? 0.17 : 0.33;
        let p = mix(op, basket, k);
        if (!onBall) p = mix(p, ballP, 0.16 + (opts.sag || 0));
        mv[ds] = p;
      }
      return mv;
    }
    function withDef(O, offMoves, ballSlot, opts) {
      return Object.assign(defendMoves(O, offMoves, ballSlot, opts), offMoves);
    }

    /* ---- 位置取り（攻撃方向基準の u=ベースラインからの距離, v=左右） ---- */
    const SP = {
      top: [8.0, 0], lslot: [7.2, -3.2], rslot: [7.2, 3.2],
      lwing: [5.9, -5.6], rwing: [5.9, 5.6], lcorner: [0.7, -6.8], rcorner: [0.7, 6.8],
      lelbow: [5.6, -2.4], relbow: [5.6, 2.4], lblock: [1.9, -2.6], rblock: [1.9, 2.6],
      lshort: [1.6, -4.8], rshort: [1.6, 4.8]
    };
    function formation(O, m) {
      const S = (k) => A(O, SP[k][0], SP[k][1] * m);
      const f = R.chance(0.65)
        ? { 0: S('top'), 1: S('rwing'), 2: S('lwing'), 3: S('rcorner'), 4: S('lblock') }
        : { 0: S('top'), 1: S('rcorner'), 2: S('lcorner'), 3: S('relbow'), 4: S('lelbow') };
      const out = {};
      for (let r = 0; r < 5; r++) out[slotOf(O, r)] = jit(f[r], 0.35);
      return out;
    }

    /* ---- シュート位置（ゾーン別） ---- */
    function spotFor(zone) {
      for (let i = 0; i < 12; i++) {
        let u, v;
        if (zone === 'rim') { const r = R.range(0.35, 1.5), th = R.range(-1.2, 1.2); u = C.rimFromBaseline + r * Math.cos(th); v = r * Math.sin(th); }
        else if (zone === 'paint') { u = R.range(2.6, 5.3); v = R.range(-2.1, 2.1); }
        else if (zone === 'mid') { const r = R.range(3.9, 5.9), th = R.range(-1.35, 1.35); u = C.rimFromBaseline + r * Math.cos(th); v = r * Math.sin(th); }
        else if (zone === 'c3') { u = R.range(0.4, 2.2); v = (R.chance(0.5) ? 1 : -1) * R.range(6.85, 7.15); }
        else { const r = R.range(7.05, 7.7), th = R.range(-1.1, 1.1); u = C.rimFromBaseline + r * Math.cos(th); v = r * Math.sin(th); }
        const z = BS.shotZone(7.5 + v, u);
        if (z.zone === zone || (i > 9 && (z.three === (zone === 'c3' || zone === 'ab3')))) return { u, v };
      }
      return zone === 'ab3' ? { u: 8.5, v: 0 } : { u: 1.6, v: 0.3 };
    }

    /* ---- 交代（デッドボール時） ---- */
    function mustSit(pid) {
      const f = G.pf[pid] || 0;
      if (f >= 5) return true;
      if (G.period === 1 && f >= 2) return true;
      if (G.period === 2 && f >= 3) return true;
      if (G.period === 3 && f >= 4) return true;
      return false;
    }
    const ROT = { 1: [1, 3], 2: [0, 4], 3: [2, 3], 4: [1, 4] };
    function desired(team) {
      const frac = (G.T - G.periodStart) / PERIOD_LEN;
      const benchRoles = (frac >= 0.45 && frac < (G.period === 4 ? 0.72 : 0.9)) ? ROT[G.period] : [];
      const T = TEAMS[team];
      const used = new Set();
      const lineup = [];
      for (let r = 0; r < 5; r++) {
        const starter = T.players.find((p) => p.starter && p.role === r);
        const bench = T.players.find((p) => !p.starter && p.role === r);
        let pick = benchRoles.includes(r) ? bench : starter;
        if (mustSit(pick.id)) pick = pick === starter ? bench : starter;
        if (mustSit(pick.id) || used.has(pick.id)) {
          pick = T.players.find((p) => !used.has(p.id) && !mustSit(p.id) && !lineup.includes(p) && p !== starter && p !== bench && (G.pf[p.id] || 0) < 5) || pick;
        }
        used.add(pick.id);
        lineup.push(pick);
      }
      return lineup.map((p) => p.id);
    }
    function applySubs(keep) {
      let changed = false;
      for (let team = 0; team < 2; team++) {
        const want = desired(team);
        for (let r = 0; r < 5; r++) {
          const s = slotOf(team, r);
          if (keep && keep.includes(s)) continue;
          const now = G.slotMap[s];
          if (now !== want[r] && !G.slotMap.includes(want[r])) {
            G.slotMap[s] = want[r];
            ev(G.T, 'sub', { team, out: now, in: want[r] });
            changed = true;
          }
        }
      }
      if (changed) tr.slots.push({ t: r2(G.T), map: G.slotMap.slice() });
    }

    /* ---- タイムアウト ---- */
    function maybeTimeout(team) {
      const half = G.period <= 2 ? 0 : 1;
      if (G.run.team === 1 - team && G.run.pts >= 8 && G.toLeft[team][half] > 0) {
        G.toLeft[team][half]--;
        G.run = { team: -1, pts: 0 };
        ev(G.T, 'timeout', { team });
        const t0 = G.T;
        const benchX = [10.5, 17.5];
        const mv = {};
        for (let s = 0; s < 10; s++) {
          const tm = s < 5 ? 0 : 1;
          const bx = benchX[attackDir(tm) > 0 ? 0 : 1];
          mv[s] = { x: bx + ((s % 5) - 2) * 0.7, y: R.range(-0.9, -0.4) };
        }
        beat(2.4, mv, null);
        beat(4.6, null, null);
        overlay(t0, G.T + 0.8, 'timeout', 'タイムアウト ' + TEAMS[team].short);
        applySubs();
        return true;
      }
      return false;
    }

    /* =========================================================
       ポゼッション
       entry: { type: 'inbound'|'dreb'|'steal'|'sideline'|'front'|'jump'|'period'|'oreb', team, holder }
       ========================================================= */
    function bringUp(O, entry, m) {
      const D = 1 - O;
      const pg = slotOf(O, 0);
      const S = (u, v) => A(O, u, v * m);
      let holder = entry.holder;
      if (entry.type === 'inbound') {
        const inb = slotOf(O, R.chance(0.6) ? 4 : 3);
        const bp = ballPoint();
        const mv = {};
        mv[inb] = { x: bp[0], y: bp[1] - 0.15 };
        mv[pg] = S(23.2, 2.8);
        offSlots(O).forEach((s) => { if (s !== inb && s !== pg) mv[s] = jit(S(R.range(16, 20), R.range(-5, 5)), 0.5); });
        // 守備側（得点したチーム）は自陣へ戻る
        offSlots(D).forEach((s) => { mv[s] = mix(pos(s), A(O, R.range(4, 10), R.range(-5, 5)), 0.6); });
        beat(1.1, mv, { free: { a: bp, b: [mv[inb].x, mv[inb].y + 0.2, 1.0], n: 1, h: 0.6 } });
        const oob = S(28.7, R.range(-1.5, 1.5));
        beat(0.7, { [inb]: oob }, { hold: inb });
        beat(0.6, { [pg]: S(22.8, 3.2) }, { pass: [inb, pg] });
        holder = pg;
        // インバウンドした選手もコートへ
        beat(0.3, { [inb]: S(26, 1.5) }, { hold: pg, dr: true });
      } else if (entry.type === 'sideline' || entry.type === 'period' || entry.type === 'front') {
        const front = entry.type === 'front';
        const inb = slotOf(O, 2);
        const side = m;
        const mv = {};
        const u0 = front ? 6.5 : 14;
        mv[inb] = S(u0, 7.95 * side);
        mv[pg] = front ? S(7.8, 3.5 * side) : S(12.5, 3.8 * side);
        offSlots(O).forEach((s) => { if (s !== inb && s !== pg) mv[s] = jit(front ? S(R.range(1.5, 6), R.range(-5, 5)) : S(R.range(6, 12), R.range(-5, 5)), 0.5); });
        Object.assign(mv, defendMoves(O, mv, pg, { sag: 0.05 }));
        beat(entry.type === 'period' ? 2.2 : 1.8, mv, { free: { a: ballPoint(), b: [mv[inb].x, mv[inb].y + 0.2, 1.1], n: 2, h: 0.5 } });
        beat(0.55, null, { pass: [inb, pg] });
        holder = pg;
        beat(0.35, { [inb]: S(front ? 5.5 : 12, 5.5 * side) }, { hold: pg, dr: true });
        if (front) return pg;
      } else if (entry.type === 'dreb' || entry.type === 'steal') {
        if (holder !== pg) {
          const outlet = S(R.range(19, 22), R.range(4, 6) * (R.chance(0.5) ? 1 : -1));
          const mv = { [pg]: outlet };
          offSlots(O).forEach((s) => { if (s !== pg && s !== holder) mv[s] = jit(S(R.range(12, 18), R.range(-5, 5)), 0.5); });
          offSlots(D).forEach((s) => { mv[s] = mix(pos(s), A(O, R.range(3, 9), R.range(-5, 5)), 0.55); });
          beat(0.9, mv, { hold: holder });
          beat(0.6, null, { pass: [holder, pg] });
          holder = pg;
        }
      } else if (entry.type === 'jump') {
        holder = pg;
      }
      // ハーフコートへ運ぶ
      const f = formation(O, m);
      const start = pos(holder);
      const topP = A(O, 8.6, R.range(-1.5, 1.5));
      const d = dist(start, topP);
      const dur = BS.clamp(d / 4.4, 1.2, 4.2);
      const mid = mix(start, topP, 0.55);
      const half1 = {};
      const half2 = {};
      offSlots(O).forEach((s) => {
        if (s === holder) return;
        half1[s] = mix(pos(s), f[s], 0.6);
        half2[s] = f[s];
      });
      half1[holder] = mid; half2[holder] = topP;
      beat(dur * 0.5, withDef(O, half1, holder, { sag: 0.1 }), { hold: holder, dr: true });
      beat(dur * 0.5, withDef(O, half2, holder), { hold: holder, dr: true });
      return holder;
    }

    function pickShooter(O, roles, zone) {
      const items = roles.map((r) => {
        const s = slotOf(O, r);
        const p = plAt(s);
        let w = p.use;
        if ((zone === 'c3' || zone === 'ab3') && p.fg3 <= 0.05) w = 0;
        return [s, w];
      });
      if (!items.some((it) => it[1] > 0)) return slotOf(O, roles[0]);
      return R.weighted(items);
    }
    function makeProb(O, s, zone, play) {
      const p = plAt(s);
      let base = ZONE_BASE[zone];
      const three = zone === 'c3' || zone === 'ab3';
      base *= three ? p.fg3 / 0.33 : p.fg2 / 0.47;
      base *= (TEAMS[O].quality[play] || 1);
      if (play === 'transition' && zone === 'rim') base *= 1.12;
      if (play === 'putback') base *= 0.95;
      return BS.clamp(base, 0.05, 0.86);
    }

    /* 攻撃側の終わり方を決める（TO / ファウル / シュート） */
    function decideOutcome(O, handlerSlot, play) {
      const T = TEAMS[O], D = 1 - O;
      const h = plAt(handlerSlot);
      const pTO = 0.15 * T.toRate * (0.65 + 0.35 * h.to);
      const pFoul = 0.095 * TEAMS[D].foulRate;
      const r = R.next();
      if (r < pTO) return 'to';
      if (r < pTO + pFoul) return 'foul';
      return 'shot';
    }

    /* シュートを打って結果まで（成功/失敗/ブロック/シューティングファウル） */
    function shoot(O, s, zone, play, passer, opts) {
      opts = opts || {};
      const D = 1 - O;
      const tRel = G.T;
      const p = pos(s);
      const half = toHalf(O, p.x, p.y);
      const three = BS.shotZone(half.sx, half.sy).three;
      const pts = three ? 3 : 2;
      let pMake = makeProb(O, s, zone, play);
      const foulP = zone === 'rim' ? 0.14 : zone === 'paint' ? 0.11 : zone === 'mid' ? 0.045 : 0.018;
      const fouled = R.chance(foulP * TEAMS[D].foulRate);
      if (fouled) pMake *= 0.55;
      let made = R.chance(pMake);
      // ブロック（ゴール下・ペイントの失敗の一部）
      let blocker = null;
      if (!made && !fouled && (zone === 'rim' || zone === 'paint')) {
        const cand = [slotOf(D, 4), slotOf(D, 3), slotOf(D, s % 5)];
        const bs = R.weighted(cand.map((c) => [c, plAt(c).blk]));
        if (R.chance(0.1 * plAt(bs).blk + 0.02)) blocker = bs;
      }
      const assisted = passer != null && made && R.chance(opts.astP != null ? opts.astP : 0.9);
      const shooterPid = pidAt(s);
      pose(s, tRel - 0.25, 0.75, 'shoot');
      jump(s, tRel - 0.2, 0.55, zone === 'rim' ? 0.45 : 0.3);

      let shotEv = null;
      if (!fouled || made) {
        shotEv = ev(tRel, 'shot', {
          team: O, pid: shooterPid, made, pts, sx: half.sx, sy: half.sy,
          ast: assisted ? pidAt(passer) : null, blk: blocker != null ? pidAt(blocker) : null, play
        });
      }
      const rim = rim3(O);
      const rel = hand(cur, s, 2.45);
      const d = dist({ x: rel[0], y: rel[1] }, { x: rim[0], y: rim[1] });

      if (blocker != null) {
        // ブロック：守備者が跳んで叩く
        const bp = pos(blocker);
        const near = toward(p, bp, 0.7);
        beat(0.05, { [blocker]: toward(bp, p, Math.max(0, dist(bp, p) - 0.75)) }, null);
        jump(blocker, G.T - 0.1, 0.6, 0.55);
        pose(blocker, G.T - 0.1, 0.6, 'block');
        beat(0.2, null, { air: { a: rel, b: [near.x, near.y + 0.2, 2.95], h: 3.05 } });
        const loose = toward(near, A(O, R.range(4, 8), R.range(-5, 5)), R.range(2.5, 4.2));
        return reboundPhase(O, s, { x: loose.x, y: loose.y }, { from: [near.x, near.y + 0.2, 2.95], blocked: true, shotEv });
      }

      const flight = 0.72 + d * 0.052;
      const apex = C.rimH + 0.8 + d * 0.13;
      const crash = crashMoves(O, s, null, 0.25);
      beat(flight, crash, { air: { a: rel, b: rim, h: apex } });

      if (made) {
        const tIn = G.T;
        addScore(O, pts, tIn);
        const drop = [rim[0], rim[1], 1.55];
        beat(0.3, null, { air: { a: rim, b: drop, h: rim[2] } });
        const land = A(O, R.range(0.6, 2.2), R.range(-1.2, 1.2));
        beat(0.8, null, { free: { a: drop, b: [land.x, land.y, 0.12], n: 2, h: 0.7 } });
        if (fouled) {
          const fouler = pickFouler(D, s, true);
          foul(fouler, 'S', shooterPid, tRel + 0.05);
          const r = freeThrows(O, s, 1);
          return r;
        }
        return { end: 'made', next: { type: 'inbound', team: D } };
      }
      if (fouled) {
        const fouler = pickFouler(D, s, true);
        foul(fouler, 'S', shooterPid, tRel + 0.05);
        // ボールはリングに当たって落ちる
        const land = A(O, R.range(1.2, 2.6), R.range(-1.5, 1.5));
        beat(0.8, null, { free: { a: rim, b: [land.x, land.y, 0.12], n: 2, h: 1.2 } });
        return freeThrows(O, s, pts === 3 ? 3 : 2);
      }
      // 外れ → リバウンド
      const long = pts === 3 ? R.range(2.8, 4.8) : R.range(1.2, 3.2);
      const ang = R.range(-1.4, 1.4);
      const rimP = A(O, C.rimFromBaseline, 0);
      const outP = A(O, C.rimFromBaseline + long * Math.cos(ang), long * Math.sin(ang));
      void rimP;
      return reboundPhase(O, s, outP, { from: [rim[0] + R.range(-0.15, 0.15), rim[1], rim[2] + 0.05], shotEv });
    }

    /* シュート中のリバウンド争い（ビッグはゴールへ、ガードは戻る） */
    function crashMoves(O, shooter, target, k) {
      const D = 1 - O;
      const mv = {};
      const basket = A(O, C.rimFromBaseline + 1.2, 0);
      [3, 4].forEach((r) => {
        const so = slotOf(O, r), sd = slotOf(D, r);
        if (so !== shooter) mv[so] = mix(pos(so), jit(basket, 1.4), k);
        mv[sd] = mix(pos(sd), jit(basket, 1.0), k + 0.1);
      });
      [0, 1].forEach((r) => {
        const so = slotOf(O, r);
        if (so !== shooter) mv[so] = mix(pos(so), A(O, 10, (r ? 3 : -3)), k * 0.8);
      });
      void target;
      return mv;
    }

    function reboundPhase(O, shooter, spot, info) {
      const D = 1 - O;
      const pOR = BS.clamp(0.265 * TEAMS[O].orb / TEAMS[D].drb, 0.1, 0.5) * (info.ft ? 0.4 : 1) * (info.blocked ? 0.7 : 1);
      const off = R.chance(pOR);
      const team = off ? O : D;
      const roleW = [0.4, 0.55, 0.9, 1.3, 1.65];
      const items = [0, 1, 2, 3, 4].map((r) => {
        const s = slotOf(team, r);
        return [s, plAt(s).reb * roleW[r] * (s === shooter ? 0.5 : 1)];
      });
      const rs = R.weighted(items);
      const mv = crashMoves(O, shooter, spot, 0.55);
      mv[rs] = { x: spot.x, y: spot.y - 0.15 };
      const carom = info.blocked ? 0.75 : R.range(0.6, 0.85);
      // リングに当たって弾むボール：頂点の高さは、落ち方が本物の重力（9.8 m/s²）と同じになるように決める（映像の見た目だけに効く）
      beat(carom, mv, { air: { a: info.from, b: [spot.x, spot.y + 0.05, 2.1], h: info.blocked ? 3.2 : Math.max(info.from[2], 2.1) + 9.8 * carom * carom / 8 } });
      jump(rs, G.T - 0.3, 0.55, 0.45);
      pose(rs, G.T - 0.3, 0.6, 'reb');
      ev(G.T, 'reb', { team, pid: pidAt(rs), off });
      beat(0.45, null, { hold: rs });
      if (off) return { cont: true, entry: { type: 'oreb', team: O, holder: rs } };
      return { end: 'dreb', next: { type: 'dreb', team: D, holder: rs } };
    }

    /* ファウル */
    function pickFouler(D, againstSlot, shooting) {
      const r = againstSlot % 5;
      const cand = [[slotOf(D, r), 0.6]];
      if (shooting) { cand.push([slotOf(D, 4), 0.25], [slotOf(D, 3), 0.15]); }
      else { cand.push([slotOf(D, (r + 1) % 5), 0.2], [slotOf(D, (r + 4) % 5), 0.2]); }
      return R.weighted(cand.map(([s, w]) => [s, w * plAt(s).foul]));
    }
    function foul(foulerSlot, kind, drawnPid, t) {
      const pid = pidAt(foulerSlot);
      const team = P[pid].team;
      G.pf[pid] = (G.pf[pid] || 0) + 1;
      G.tf[team][Math.min(G.period, 5)]++;
      ev(t, 'foul', { team, pid, kind, drawn: drawnPid || null });
    }

    /* フリースロー */
    function freeThrows(O, shooterSlot, n) {
      const D = 1 - O;
      applySubs([shooterSlot]);
      const shooterPid = pidAt(shooterSlot);
      const mv = {};
      mv[shooterSlot] = A(O, 6.0, 0);
      const lane = [[2.7, 2.95], [2.7, -2.95], [3.6, 2.95], [3.6, -2.95], [4.5, 2.95], [4.5, -2.95]];
      const dSl = [slotOf(D, 4), slotOf(D, 3), slotOf(D, 2)];
      const oSl = [slotOf(O, 4), slotOf(O, 3)].filter((s) => s !== shooterSlot);
      mv[dSl[0]] = A(O, lane[0][0], lane[0][1]);
      mv[dSl[1]] = A(O, lane[1][0], lane[1][1]);
      if (oSl[0] != null) mv[oSl[0]] = A(O, lane[2][0], lane[2][1]);
      if (oSl[1] != null) mv[oSl[1]] = A(O, lane[3][0], lane[3][1]);
      mv[dSl[2]] = A(O, lane[4][0], lane[4][1]);
      const rest = [0, 1, 2, 3, 4].map((r) => slotOf(O, r)).concat([slotOf(D, 0), slotOf(D, 1)]).filter((s) => mv[s] === undefined);
      rest.forEach((s, i) => { mv[s] = A(O, R.range(7.5, 9.5), (i - rest.length / 2) * 2.2); });
      const land = ballPoint();
      beat(2.0, mv, { free: { a: land, b: [mv[shooterSlot].x, mv[shooterSlot].y + 0.2, 1.1], n: 3, h: 0.5 } });
      const p = plAt(shooterSlot);
      let last = null;
      for (let i = 1; i <= n; i++) {
        beat(1.1, null, { hold: shooterSlot, dr: true });
        beat(0.35, null, { hold: shooterSlot });
        const tRel = G.T;
        const made = R.chance(p.ft);
        pose(shooterSlot, tRel - 0.2, 0.6, 'shoot');
        ev(tRel, 'ft', { team: O, pid: shooterPid, made, n: i, of: n });
        const rim = rim3(O);
        const rel = hand(cur, shooterSlot, 2.35);
        beat(0.95, null, { air: { a: rel, b: rim, h: 4.35 } });
        if (made) {
          addScore(O, 1, G.T);
          const drop = [rim[0], rim[1], 1.55];
          beat(0.3, null, { air: { a: rim, b: drop, h: rim[2] } });
          const ld = A(O, R.range(0.8, 1.8), R.range(-0.8, 0.8));
          beat(0.7, null, { free: { a: drop, b: [ld.x, ld.y, 0.12], n: 2, h: 0.6 } });
          if (i < n) beat(0.9, null, { air: { a: [ld.x, ld.y, 0.3], b: hand(cur, shooterSlot, 1.1), h: 1.6 } });
          last = true;
        } else {
          last = false;
          if (i < n) {
            const ld = A(O, R.range(0.8, 2.2), R.range(-1.2, 1.2));
            beat(0.7, null, { free: { a: rim, b: [ld.x, ld.y, 0.12], n: 2, h: 1.0 } });
            beat(0.9, null, { air: { a: [ld.x, ld.y, 0.3], b: hand(cur, shooterSlot, 1.1), h: 1.6 } });
          }
        }
      }
      if (last) return { end: 'made', next: { type: 'inbound', team: D } };
      const long = R.range(1.2, 2.8), ang = R.range(-1.3, 1.3);
      const spot = A(O, C.rimFromBaseline + long * Math.cos(ang), long * Math.sin(ang));
      const rim = rim3(O);
      return reboundPhase(O, shooterSlot, spot, { from: [rim[0], rim[1], rim[2] + 0.05], ft: true });
    }

    /* ターンオーバー */
    function turnover(O, handlerSlot, play, m) {
      const D = 1 - O;
      const T = TEAMS[O];
      const S = (u, v) => A(O, u, v * m);
      const kind = R.weighted([['pass', T.passTO], ['lost', 0.26], ['travel', 0.09], ['offfoul', 0.1], ['oob', 0.05], ['viol', 0.05]]);
      const hp = pidAt(handlerSlot);
      if (kind === 'pass') {
        const targets = offSlots(O).filter((s) => s !== handlerSlot);
        const tgt = R.pick(targets);
        const thief = slotOf(D, tgt % 5);
        const a = pos(handlerSlot), b = pos(tgt);
        const cut = mix(a, b, R.range(0.45, 0.7));
        const steal = R.chance(0.82);
        if (steal) {
          beat(0.45, { [thief]: cut }, { passTo: [handlerSlot, [cut.x, cut.y + 0.2, 1.3]] });
          ev(G.T, 'to', { team: O, pid: hp, kind, stl: pidAt(thief), play });
          beat(0.25, null, { hold: thief, dr: true });
          return { end: 'to', next: { type: 'steal', team: D, holder: thief } };
        }
        const outP = { x: b.x + (b.x - a.x) * 0.6, y: m > 0 ? C.W + 1.2 : -1.2 };
        beat(0.6, null, { passTo: [handlerSlot, [outP.x, BS.clamp(outP.y, -1.2, C.W + 1.2), 0.5]] });
        ev(G.T - 0.3, 'to', { team: O, pid: hp, kind, stl: null, play });
        beat(1.2, null, null);
        return { end: 'to', next: { type: 'sideline', team: D } };
      }
      if (kind === 'lost') {
        const thief = R.chance(0.75) ? slotOf(D, handlerSlot % 5) : slotOf(D, R.int(0, 4));
        const hpnt = pos(handlerSlot);
        const loose = toward(hpnt, A(O, R.range(8, 14), R.range(-4, 4)), R.range(1.5, 2.6));
        const tPoke = G.T;
        beat(0.55, { [thief]: loose }, { free: { a: hand(cur, handlerSlot, 0.9), b: [loose.x, loose.y + 0.2, 0.12], n: 2, h: 0.5 } });
        const steal = R.chance(0.85);
        ev(tPoke + 0.1, 'to', { team: O, pid: hp, kind, stl: steal ? pidAt(thief) : null, play });
        if (steal) {
          beat(0.25, null, { hold: thief, dr: true });
          return { end: 'to', next: { type: 'steal', team: D, holder: thief } };
        }
        beat(1.0, null, null);
        return { end: 'to', next: { type: 'sideline', team: D } };
      }
      if (kind === 'offfoul') {
        const def = slotOf(D, R.chance(0.5) ? 4 : handlerSlot % 5);
        const hpnt = pos(handlerSlot);
        const drive = toward(hpnt, A(O, 2.5, 0), 2.6);
        const meet = toward(drive, hpnt, -0.1);
        beat(0.9, { [handlerSlot]: drive, [def]: toward(meet, A(O, 1.2, 0), -0.55) }, { hold: handlerSlot, dr: true });
        pose(def, G.T, 1.0, 'fall');
        foul(handlerSlot, 'O', pidAt(def), G.T);
        beat(1.4, null, { hold: handlerSlot });
        return { end: 'to', next: { type: 'sideline', team: D } };
      }
      // トラベリング / アウトオブバウンズ / その他の違反
      const hpnt = pos(handlerSlot);
      const move = toward(hpnt, A(O, 3, 0), 1.6);
      beat(0.8, { [handlerSlot]: move }, { hold: handlerSlot, dr: kind !== 'travel' });
      if (kind === 'oob') {
        const outP = { x: move.x + R.range(-1, 1), y: m > 0 ? C.W + 0.8 : -0.8 };
        beat(0.5, null, { passTo: [handlerSlot, [outP.x, outP.y, 0.3]] });
      }
      ev(G.T - 0.2, 'to', { team: O, pid: hp, kind, stl: null, play });
      beat(1.3, null, null);
      void S;
      return { end: 'to', next: { type: 'sideline', team: D } };
    }

    /* 守備のファウル（シュート以外）→ ボーナスならFT、でなければサイドから再開 */
    function defensiveFoul(O, handlerSlot) {
      const D = 1 - O;
      const fouler = pickFouler(D, handlerSlot, false);
      const hpnt = pos(handlerSlot);
      beat(0.7, { [handlerSlot]: toward(hpnt, A(O, 3, 0), 1.3), [fouler]: toward(pos(fouler), hpnt, dist(pos(fouler), hpnt) - 0.5) }, { hold: handlerSlot, dr: true });
      foul(fouler, 'P', pidAt(handlerSlot), G.T);
      beat(1.2, null, { hold: handlerSlot });
      if (G.tf[D][Math.min(G.period, 5)] >= 5) return freeThrows(O, handlerSlot, 2);
      applySubs();
      return { cont: true, entry: { type: 'front', team: O } };
    }

    /* ---------- プレータイプ別の動き ---------- */
    function halfCourt(O, holder, m, opts) {
      opts = opts || {};
      const D = 1 - O;
      const T = TEAMS[O];
      const S = (u, v) => A(O, u, v * m);
      const pg = holder;
      // ボール回し（0〜2回）
      const nRev = opts.quick ? 0 : R.weighted([[0, 0.3], [1, 0.45], [2, 0.25]]);
      let ball = pg;
      for (let i = 0; i < nRev; i++) {
        const recv = R.pick(offSlots(O).filter((s) => s !== ball && s % 5 !== 4));
        const mv = {};
        offSlots(O).forEach((s) => { if (s !== ball && s !== recv) mv[s] = jit(pos(s), 0.6); });
        beat(R.range(0.8, 1.3), withDef(O, mv, ball), { hold: ball, dr: true });
        beat(0.5, withDef(O, {}, recv), { pass: [ball, recv] });
        ball = recv;
      }
      // ボールを持った選手からPGに戻してプレー開始（PnR等はPGがハンドラー）
      const play = R.weighted(Object.keys(T.style).map((k) => [k, T.style[k]]));
      const outcome = decideOutcome(O, ball, play);
      const beatHold = (dt, mv, s) => beat(dt, withDef(O, mv || {}, s), { hold: s, dr: true });

      if (outcome === 'to') {
        beatHold(R.range(0.6, 1.2), {}, ball);
        return turnover(O, ball, play, m);
      }
      if (outcome === 'foul') {
        beatHold(R.range(0.6, 1.0), {}, ball);
        return defensiveFoul(O, ball);
      }

      if (play === 'pnr') {
        let h = ball;
        if (h % 5 !== 0) { beat(0.5, withDef(O, { [slotOf(O, 0)]: S(8.2, 1) }, slotOf(O, 0)), { pass: [h, slotOf(O, 0)] }); h = slotOf(O, 0); }
        const scr = slotOf(O, R.chance(0.6) ? 4 : 3);
        const side = R.chance(0.5) ? 1 : -1;
        const hp = pos(h);
        beatHold(1.0, { [scr]: { x: hp.x + (A(O, 9, 0).x - A(O, 8, 0).x) * 0.1, y: hp.y + side * 0.9 } }, h);
        const drive = S(4.4, -1.8 * side);
        const roll = S(2.1, 0.9 * side);
        const mv = { [h]: drive, [scr]: roll };
        const def = defendMoves(O, mv, h, { sag: 0.12 });
        def[slotOf(D, h % 5)] = toward(drive, pos(h), 1.1);
        beat(1.2, Object.assign(def, mv), { hold: h, dr: true });
        const branch = R.weighted([['handler', 0.44], ['roll', 0.3], ['kick', 0.26]]);
        if (branch === 'handler') {
          const zone = R.weighted([['rim', 0.34], ['paint', 0.26], ['mid', 0.4]]);
          const sp = spotFor(zone);
          beatHold(0.5, { [h]: S(sp.u, sp.v) }, h);
          return shoot(O, h, zone, play, null);
        }
        if (branch === 'roll') {
          const zone = R.weighted([['rim', 0.78], ['paint', 0.22]]);
          const sp = spotFor(zone);
          beat(0.45, withDef(O, { [scr]: S(sp.u, sp.v) }, scr, { sag: 0.1 }), { pass: [h, scr] });
          beat(0.2, null, { hold: scr });
          return shoot(O, scr, zone, play, h);
        }
        const zone = R.weighted([['c3', 0.38], ['ab3', 0.44], ['mid', 0.18]]);
        const sh = pickShooter(O, [1, 2, 3].filter((r) => slotOf(O, r) !== scr), zone);
        const sp = spotFor(zone);
        const spot = S(sp.u, sp.v);
        beat(0.55, withDef(O, { [sh]: spot }, sh, { sag: 0.25 }), { pass: [h, sh] });
        beat(0.3, { [slotOf(D, sh % 5)]: toward(pos(slotOf(D, sh % 5)), spot, dist(pos(slotOf(D, sh % 5)), spot) - 1.4) }, { hold: sh });
        return shoot(O, sh, zone, play, h);
      }
      if (play === 'iso') {
        const iso = pickShooter(O, [0, 1, 2], 'mid');
        const side = R.chance(0.5) ? 1 : -1;
        const isoP = S(6.2, 4.6 * side);
        const mv = { [iso]: isoP };
        offSlots(O).forEach((s) => { if (s !== iso && s !== ball) mv[s] = jit(S(R.chance(0.5) ? 0.8 : 6.5, -6 * side + R.range(-1, 1)), 0.4); });
        if (ball !== iso) { beat(0.9, withDef(O, mv, ball), { hold: ball, dr: true }); beat(0.5, null, { pass: [ball, iso] }); }
        else beatHold(0.9, mv, iso);
        beatHold(0.9, {}, iso);
        const zone = R.weighted([['rim', 0.34], ['paint', 0.14], ['mid', 0.37], ['ab3', 0.15]]);
        const sp = spotFor(zone);
        beatHold(0.9, { [iso]: S(sp.u, sp.v) }, iso);
        return shoot(O, iso, zone, play, null);
      }
      if (play === 'post') {
        const big = slotOf(O, R.chance(0.65) ? 4 : 3);
        const side = R.chance(0.5) ? 1 : -1;
        const wing = slotOf(O, R.chance(0.5) ? 1 : 2);
        const mv = { [big]: S(2.1, 2.5 * side), [wing]: S(5.9, 5.3 * side) };
        const def = defendMoves(O, mv, ball);
        def[slotOf(D, big % 5)] = S(1.4, 2.2 * side);
        if (ball !== wing) {
          beat(1.0, Object.assign(def, mv), { hold: ball, dr: true });
          beat(0.5, null, { pass: [ball, wing] });
        } else beat(1.0, Object.assign(def, mv), { hold: wing, dr: true });
        beat(0.5, null, { pass: [wing, big] });
        const kick = R.chance(0.18);
        if (kick) {
          beatHold(1.0, { [big]: S(1.8, 1.8 * side) }, big);
          const zone = R.chance(0.6) ? 'ab3' : 'c3';
          const sh = pickShooter(O, [0, 1, 2].filter((r) => slotOf(O, r) !== big), zone);
          const sp = spotFor(zone);
          beat(0.55, withDef(O, { [sh]: S(sp.u, sp.v) }, sh, { sag: 0.25 }), { pass: [big, sh] });
          beat(0.25, null, { hold: sh });
          return shoot(O, sh, zone, play, big);
        }
        const zone = R.weighted([['paint', 0.56], ['rim', 0.34], ['mid', 0.1]]);
        const sp = spotFor(zone);
        beatHold(1.3, { [big]: S(sp.u, sp.v * (sp.v * side > 0 ? 1 : 1)) }, big);
        return shoot(O, big, zone, play, wing, { astP: 0.25 });
      }
      if (play === 'spot') {
        const h = ball;
        const drive = S(3.4, R.range(-1, 1));
        const mv = { [h]: drive };
        const def = defendMoves(O, mv, h, { sag: 0.3 });
        beat(1.1, Object.assign(def, mv), { hold: h, dr: true });
        const zone = R.weighted([['c3', 0.36], ['ab3', 0.44], ['mid', 0.2]]);
        const sh = pickShooter(O, [0, 1, 2, 3].filter((r) => slotOf(O, r) !== h), zone);
        const sp = spotFor(zone);
        const spot = S(sp.u, sp.v);
        beat(0.55, { [sh]: spot }, { pass: [h, sh] });
        beat(0.3, { [slotOf(D, sh % 5)]: toward(pos(slotOf(D, sh % 5)), spot, dist(pos(slotOf(D, sh % 5)), spot) - 1.3) }, { hold: sh });
        return shoot(O, sh, zone, play, h);
      }
      if (play === 'cut') {
        const cutter = R.pick(offSlots(O).filter((s) => s !== ball));
        beatHold(0.8, {}, ball);
        const zone = R.chance(0.85) ? 'rim' : 'paint';
        const sp = spotFor(zone);
        const tgt = S(sp.u, sp.v);
        beat(0.9, withDef(O, { [cutter]: mix(pos(cutter), tgt, 0.7) }, ball), { hold: ball, dr: true });
        beat(0.45, { [cutter]: tgt, [slotOf(D, cutter % 5)]: toward(pos(slotOf(D, cutter % 5)), tgt, dist(pos(slotOf(D, cutter % 5)), tgt) - 1.0) }, { pass: [ball, cutter] });
        beat(0.2, null, { hold: cutter });
        return shoot(O, cutter, zone, play, ball);
      }
      // offscreen
      const shooterR = R.chance(0.6) ? 1 : 2;
      const sh = slotOf(O, shooterR) === ball ? slotOf(O, shooterR === 1 ? 2 : 1) : slotOf(O, shooterR);
      const side = R.chance(0.5) ? 1 : -1;
      const screener = slotOf(O, 3) === ball ? slotOf(O, 4) : slotOf(O, 3);
      beat(1.0, withDef(O, { [sh]: S(1.8, 3.1 * side), [screener]: S(2.8, 4.1 * side) }, ball), { hold: ball, dr: true });
      const zone = R.weighted([['ab3', 0.5], ['mid', 0.4], ['c3', 0.1]]);
      const sp = spotFor(zone);
      const spot = S(sp.u, sp.v);
      const dsh = slotOf(D, sh % 5);
      beat(1.1, { [sh]: spot, [dsh]: toward(spot, pos(sh), 1.3) }, { hold: ball, dr: true });
      beat(0.5, null, { pass: [ball, sh] });
      beat(0.25, null, { hold: sh });
      return shoot(O, sh, zone, 'offscreen', ball);
    }

    function transitionPlay(O, entry, m) {
      const D = 1 - O;
      const S = (u, v) => A(O, u, v * m);
      let h = entry.holder;
      const lanes = offSlots(O).filter((s) => s !== h);
      const runners = lanes.slice(0, 2);
      const mv = {};
      const dash = S(4.2, R.range(-1, 1));
      mv[h] = mix(pos(h), dash, 0.5);
      runners.forEach((s, i) => { mv[s] = mix(pos(s), S(5.5, i ? 5.5 : -5.5), 0.5); });
      lanes.slice(2).forEach((s) => { mv[s] = mix(pos(s), S(12, R.range(-3, 3)), 0.5); });
      offSlots(D).forEach((s) => { mv[s] = mix(pos(s), A(O, R.range(2, 7), R.range(-3, 3)), 0.4); });
      const d = dist(pos(h), dash);
      const dur = BS.clamp(d / 6.0, 0.8, 3.2);
      beat(dur / 2, mv, { hold: h, dr: true });
      const mv2 = {};
      mv2[h] = dash;
      runners.forEach((s, i) => { mv2[s] = S(3.0, i ? 4.8 : -4.8); });
      lanes.slice(2).forEach((s) => { mv2[s] = S(8.5, R.range(-3, 3)); });
      offSlots(D).forEach((s) => { mv2[s] = mix(pos(s), A(O, R.range(1.5, 5), R.range(-2.5, 2.5)), 0.6); });
      beat(dur / 2, mv2, { hold: h, dr: true });
      if (R.chance(0.08 * TEAMS[O].toRate)) return turnover(O, h, 'transition', m);
      const branch = R.weighted([['self', 0.58], ['lane', 0.27], ['trail', 0.15]]);
      if (branch === 'self') {
        const zone = R.chance(0.85) ? 'rim' : 'paint';
        const sp = spotFor(zone);
        beat(0.5, { [h]: S(sp.u, sp.v) }, { hold: h, dr: true });
        return shoot(O, h, zone, 'transition', null);
      }
      if (branch === 'lane') {
        const r = runners[R.int(0, 1)];
        const sp = spotFor('rim');
        beat(0.45, { [r]: S(sp.u, sp.v) }, { pass: [h, r] });
        beat(0.15, null, { hold: r });
        return shoot(O, r, 'rim', 'transition', h);
      }
      const tr3 = pickShooter(O, [0, 1, 2, 3].filter((r) => slotOf(O, r) !== h), 'ab3');
      const sp = spotFor('ab3');
      beat(0.6, { [tr3]: S(sp.u, sp.v) }, { pass: [h, tr3] });
      beat(0.25, null, { hold: tr3 });
      return shoot(O, tr3, 'ab3', 'transition', h);
    }

    function putback(O, entry) {
      const s = entry.holder;
      const basketSide = A(O, C.rimFromBaseline + 0.9, R.range(-0.8, 0.8));
      beat(0.45, { [s]: toward(pos(s), basketSide, 1.2) }, { hold: s });
      const p = pos(s);
      const half = toHalf(O, p.x, p.y);
      const zone = BS.shotZone(half.sx, half.sy).zone;
      return shoot(O, s, zone === 'rim' ? 'rim' : 'paint', 'putback', null);
    }

    function possession(O, entry) {
      const T = TEAMS[O];
      let m = R.chance(0.5) ? 1 : -1;
      let trans = false;
      if (entry.type === 'steal') trans = R.chance(0.52 * T.transition);
      else if (entry.type === 'dreb') trans = R.chance(0.19 * T.transition);
      for (let guard = 0; guard < 8; guard++) {
        let res;
        if (entry.type === 'oreb') {
          const pl = plAt(entry.holder);
          const pPut = pl.role >= 3 ? 0.55 : 0.25;
          if (R.chance(pPut)) res = putback(O, entry);
          else {
            const pg = slotOf(O, 0);
            if (entry.holder !== pg) {
              beat(0.7, withDef(O, { [pg]: A(O, 7.5, 1.5 * m) }, entry.holder), { hold: entry.holder, dr: true });
              beat(0.5, null, { pass: [entry.holder, pg] });
            }
            const f = formation(O, m);
            beat(1.4, withDef(O, f, pg), { hold: pg, dr: true });
            res = halfCourt(O, pg, m, { quick: true });
          }
        } else if (trans) {
          res = transitionPlay(O, entry, m);
        } else {
          const h = bringUp(O, entry, m);
          res = halfCourt(O, h, m);
        }
        trans = false;
        if (res.cont) { entry = res.entry; m = R.chance(0.5) ? 1 : -1; continue; }
        return res.next;
      }
      return { type: 'inbound', team: 1 - O };
    }

    /* ---------- ピリオド ---------- */
    function startPeriod(n, arrowTeam) {
      G.period = n;
      G.periodStart = G.T;
      tr.periods.push({ n, t0: r2(G.T), t1: null, dir0: attackDir(0) });
      ev(G.T, 'period', { n });
      applySubs();
      if (n === 1) {
        // ジャンプボール
        const mv = {};
        const c0 = slotOf(0, 4), c1 = slotOf(1, 4);
        mv[c0] = { x: 14 - 0.45 * attackDir(0), y: 7.5 };
        mv[c1] = { x: 14 - 0.45 * attackDir(1), y: 7.5 };
        [0, 1].forEach((tm) => {
          [0, 1, 2, 3].forEach((r, i) => {
            const ang = (i / 4) * Math.PI * 2 + (tm ? Math.PI / 4 : 0);
            mv[slotOf(tm, r)] = { x: 14 + Math.cos(ang) * 2.6 - 0.9 * attackDir(tm), y: 7.5 + Math.sin(ang) * 2.4 };
          });
        });
        for (const k in mv) { cur[2 * k] = mv[k].x; cur[2 * k + 1] = mv[k].y; }
        pushFrame();
        tr.slots.push({ t: 0, map: G.slotMap.slice() });
        beat(1.3, null, { rest: [14, 7.5, 1.3] });
        const winner = R.chance(0.5) ? 0 : 1;
        const toss = [14, 7.6, 1.3];
        beat(0.8, null, { air: { a: toss, b: [14, 7.6, 3.0], h: 3.8 } });
        jump(c0, G.T - 0.45, 0.6, 0.55); jump(c1, G.T - 0.45, 0.6, 0.5);
        const pg = slotOf(winner, 0);
        beat(0.6, null, { air: { a: [14, 7.6, 3.0], b: hand(cur, pg, 1.3), h: 3.1 } });
        beat(0.2, null, { hold: pg, dr: true });
        return { type: 'jump', team: winner, holder: pg, winner };
      }
      return { type: 'period', team: arrowTeam };
    }
    function endPeriod(n) {
      const pr = tr.periods[tr.periods.length - 1];
      const t0 = G.T;
      beat(0.8, null, null);
      const benchX = [10.5, 17.5];
      const mv = {};
      for (let s = 0; s < 10; s++) {
        const tm = s < 5 ? 0 : 1;
        mv[s] = { x: benchX[attackDir(tm) > 0 ? 0 : 1] + ((s % 5) - 2) * 0.75, y: R.range(-0.9, -0.3) };
      }
      const bp = ballPoint();
      beat(n === 4 ? 3.5 : 3.0, mv, { free: { a: bp, b: [14, 7.5, 0.12], n: 3, h: 0.6 } });
      beat(n === 2 ? 3.2 : n === 4 ? 3.0 : 2.0, null, { rest: [14, 7.5, 0.12] });
      pr.t1 = r2(G.T);
      const label = n === 4 ? '試合終了' : n === 2 ? '前半終了' : `第${n}Q 終了`;
      overlay(t0 + 0.8, G.T, n === 4 ? 'final' : 'period', label);
    }

    /* ---------- 試合を回す ---------- */
    let arrow = 0;
    let next = null;
    for (let n = 1; n <= 4; n++) {
      if (n === 1) {
        next = startPeriod(1);
        arrow = 1 - next.winner;
      } else {
        next = startPeriod(n, arrow);
        arrow = 1 - arrow;
      }
      while (G.T - G.periodStart < PERIOD_LEN) {
        const O = next.team;
        if (next.type === 'inbound') maybeTimeout(O);
        if (next.type === 'sideline' || next.type === 'period') applySubs();
        next = possession(O, next);
        // 念のため、次の攻撃の持ち主を正す
        if (next.holder != null && Math.floor(next.holder / 5) !== next.team) next.holder = slotOf(next.team, 0);
      }
      endPeriod(n);
      if (next.type !== 'inbound') { /* 次のピリオドは交互のスローイン */ }
    }

    const duration = r2(G.T);
    const periods = tr.periods.map((p) => ({ n: p.n, t0: p.t0, t1: p.t1, dir0: p.dir0 }));
    return {
      seed, duration, periodLen: PERIOD_LEN,
      teams: TEAMS.map((t) => ({
        id: t.id, name: t.name, short: t.short, color: t.color, text: t.text, trim: t.trim,
        players: t.players.map((p) => ({ id: p.id, no: String(p.no), name: p.name, pos: p.pos, starter: p.starter }))
      })),
      events, track: tr, periods, final: G.score.slice(),
    };
  }

  BS.sim = { generate, DEFAULT_SEED: 204, HOME, AWAY };
})(typeof window !== 'undefined' ? window : globalThis);
