/* アドリブ・ラボ：ソロの自動作成（画面を持たない）。
   解析（analysis.js）が決めた「かたまり」ごとに、リック辞典（licks*.js）から合うリックを選び、
   直前の音に近いオクターブで置いて、1コーラスぶんのソロ（音の並び）にする。
   ・決めたことは decisions（どのリックを、どこに）として持つ。差し替えは decisions を直して realize しなおす。
   ・コードが長いときは、リックを何本かつなぐか、間（休符）をとる。 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const T = AL.T, A = AL.A, L = AL.L;
  const S = (AL.S = AL.S || {});
  const mod = T.mod;
  const EPS = 1e-6;

  function rng(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  // 楽器ごとの実音の音域（コンサート・ピッチ）
  S.RANGES = {
    piano: [48, 84], altosax: [55, 80], tenorsax: [50, 77], trumpet: [58, 82], guitar: [52, 79], flute: [60, 88], vibes: [53, 84],
    clarinet: [55, 84], trombone: [46, 72], bass: [36, 60], default: [55, 84],
  };

  const ctxOfMatch = m => m.pattern.ctxAlias || m.id;
  const DEF = { seed: 1, level: 2, density: 1, lo: 55, hi: 84, bpb: 4, tags: null, avoidTags: null };

  /* ---------------- 1本のリックを置く（音にする） ---------------- */
  function realizeOne(hs, d, st, o) {
    const lick = L.byId[d.id];
    const chords = hs.slice(d.i0, d.i0 + lick.segs.length).map(h => h.chord);
    const r = L.realize(lick, chords, { t0: d.t, lo: o.lo, hi: o.hi, prev: st.prev, limit: d.cut || undefined, center: o.lo + (o.hi - o.lo) * 0.55 });
    return { lick, chords, r };
  }
  function pushEvents(out, d, lick, r, rand) {
    const notes = r.events.filter(e => !e.rest);
    const lastIdx = notes.length - 1;
    // 音の強さ：拍の頭はやや強く、アクセントは+、最後の音は少しひかえめ。ゆらぎは小さく
    notes.forEach((e, k) => {
      const onBeat = Math.abs(e.t - Math.round(e.t)) < 1e-6;
      let vel = 82 + (onBeat ? 4 : -2) + (e.accent ? 14 : 0) + (e.stac ? -4 : 0) + Math.round((rand() - 0.5) * 8);
      if (k === lastIdx) vel -= 6;
      if (k === 0) vel += 3;
      out.push({ t: e.t, dur: e.dur, p: e.p, midi: e.midi, vel: Math.max(40, Math.min(120, vel)), tie: !!e.tie, accent: !!e.accent, stac: !!e.stac, lick: lick.id, dec: d.idx, seg: e.seg, rel: e.rel, deg: e.deg });
    });
    return notes.length ? notes[lastIdx].midi : null;
  }

  /* ---------------- 選ぶ ---------------- */
  function pickWeighted(list, rand, k) {
    list = list.slice().sort((a, b) => a.cost - b.cost).slice(0, k || 4);
    const best = list[0].cost;
    const w = list.map(x => Math.exp(-(x.cost - best) / 2.5));
    const sum = w.reduce((a, b) => a + b, 0);
    let r = rand() * sum;
    for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
    return list[0];
  }
  function scoreLick(l, st, o, extra) {
    const fitInfo = extra.fit;
    const chords = extra.chords;
    const r = L.realize(l, chords, { t0: 0, lo: o.lo, hi: o.hi, prev: st.prev, limit: fitInfo && fitInfo.cut || undefined, center: o.lo + (o.hi - o.lo) * 0.55 });
    let cost = 0;
    if (st.prev != null) cost += Math.abs(r.first - st.prev) * 0.7;
    cost += (Math.max(0, o.lo - r.lo) + Math.max(0, r.hi - o.hi)) * 6;
    cost += Math.abs(r.last - (o.lo + (o.hi - o.lo) * 0.55)) * 0.12;   // 終わりの音が音域の端に寄りすぎないように
    if (st.used.has(l.id)) cost += 14;
    if (st.usedName.has(l.name)) cost += 4;
    if (st.lastCtxLick && st.lastCtxLick.src === l.src) cost += 30;
    cost += Math.abs(l.lvl - o.level) * 0.7;
    if (o.tags && o.tags.length) cost += o.tags.some(t => l.tags.indexOf(t) >= 0) ? -2.5 : 0.8;
    if (o.avoidTags && o.avoidTags.some(t => l.tags.indexOf(t) >= 0)) cost += 6;
    if (extra.want != null) cost += Math.abs(fitInfo.len - extra.want) * 1.3;
    cost += st.rand() * 3.2;
    return { lick: l, cost, fit: fitInfo };
  }

  /* ---------------- 単独のコード（pools）に、from〜to のあいだをリックで埋める ---------------- */
  function fillSingle(st, o, hs, hi, from, to) {
    const h = hs[hi], chord = h.chord;
    if (chord.nc || chord.bad) return;
    const pools = st.an.chords[hi].pools || [{ ctx: 'maj7', w: 1 }];
    let t = from, guard = 0;
    const dens = Math.min(2, Math.max(0, o.density | 0));
    const runMax = [5, 10, 24][dens];           // これだけ弾き続けたら、息継ぎ（間）をとる
    // 疎のときは、しばらく弾いたあとのコードを丸ごと休むこともある
    if (st.run >= [4, 8, 99][dens] && to - from >= 2 && st.rand() < [0.4, 0.12, 0][dens]) { st.run = 0; return; }
    while (to - t >= 1.5 - EPS && guard++ < 8) {
      const remaining = to - t;
      // 休みどころ：コードが長いとき、確率で次のリックの前に間をとる
      if (guard > 1 && st.rand() < [0.7, 0.35, 0.12][dens]) { st.run = 0; break; }
      const breathe = st.run >= runMax && remaining >= 2.5;
      // プールを重みで選ぶ
      const pool = (() => {
        const tot = pools.reduce((a, p) => a + p.w, 0); let r = st.rand() * tot;
        for (const p of pools) { r -= p.w; if (r <= 0) return p.ctx; }
        return pools[0].ctx;
      })();
      let cands = [];
      for (const ctx of [pool].concat(pools.map(p => p.ctx).filter(c => c !== pool))) {
        cands = L.find(ctx, { durs: [remaining], chords: [chord], lvlMax: Math.min(3, o.level + 1), bpb: o.bpb });
        if (cands.length) break;
      }
      if (!cands.length) break;
      let want = remaining <= 4.5 ? remaining : 4;
      if (dens === 0) want *= 0.6;
      if (breathe) want = Math.max(1.5, Math.min(want, remaining - 1.5));
      const scored = cands.map(l => scoreLick(l, st, o, { fit: L.fit(l, [remaining]), chords: [chord], want }));
      const pick = pickWeighted(scored, st.rand, 5);
      const len = pick.fit.len;
      // 短いリックは、後ろ寄せ（前に間をおく）で置くこともある。息継ぎのときは必ず間をおく
      let offset = 0;
      const slack = remaining - len;
      if (slack >= 1 - EPS && (breathe || st.rand() < [0.45, 0.3, 0.15][dens])) offset = Math.min(slack, slack >= 2 ? 2 : 1);
      commit(st, o, hs, { id: pick.lick.id, ctx: pick.lick.ctx, i0: hi, n: 1, t: t + offset, cut: pick.fit.cut, kind: 'single' });
      t = t + offset + len;
    }
  }

  function commit(st, o, hs, d) {
    d.idx = st.decisions.length;
    const { lick, r } = realizeOne(hs, d, st, o);
    const prevLen = st.events.length;
    const last = pushEvents(st.events, d, lick, r, st.rand);
    if (last != null) st.prev = last;
    const sounding = r.events.filter(e => !e.rest);
    if (sounding.length) {
      const first = sounding[0].t, end = Math.max.apply(null, sounding.map(e => e.t + e.dur));
      if (first - st.soundEnd >= 0.99) st.run = 0;
      st.run += end - Math.max(first, st.soundEnd);
      st.soundEnd = end;
    }
    st.used.add(lick.id); st.usedName.add(lick.name); st.lastCtxLick = lick;
    st.decisions.push(d);
    return st.events.length - prevLen;
  }

  /* ---------------- 本体 ---------------- */
  // hs：和声の区間（C.harmonicSlots）　an：解析結果（A.analyze）
  function generate(hs, an, opts) {
    const o = Object.assign({}, DEF, opts || {});
    const rand = rng(o.seed * 2654435761 >>> 0);
    const st = { an, rand, prev: null, used: new Set(), usedName: new Set(), decisions: [], events: [], lastCtxLick: null, run: 0, soundEnd: -99 };
    const lvlMax = Math.min(3, o.level + 1);
    // いま使えるパターンだけでフレーズを区切る
    const canUse = m => {
      const ctx = ctxOfMatch(m), durs = hs.slice(m.at, m.at + m.n).map(h => h.dur);
      const chords = hs.slice(m.at, m.at + m.n).map(h => h.chord);
      return L.find(ctx, { durs, chords, lvlMax, bpb: o.bpb, anyTonic: !!m.pattern.anyTonic }).length > 0;
    };
    const phrases = A.segment(hs, an.matches, { canUse, preferShort: o.preferShort });
    for (const ph of phrases) {
      if (!ph.match) { fillSingle(st, o, hs, ph.from, hs[ph.from].t0, hs[ph.from].t0 + hs[ph.from].dur); continue; }
      const m = ph.match, ctx = ctxOfMatch(m);
      const slice = hs.slice(m.at, m.at + m.n), durs = slice.map(h => h.dur), chords = slice.map(h => h.chord);
      const cands = L.find(ctx, { durs, chords, lvlMax, bpb: o.bpb, anyTonic: !!m.pattern.anyTonic });
      const scored = cands.map(l => scoreLick(l, st, o, { fit: L.fit(l, durs), chords }));
      const pick = pickWeighted(scored, rand, 6);
      const f = pick.fit, t0 = slice[0].t0;
      if (f.lead > EPS) fillSingle(st, o, hs, m.at, t0, t0 + f.lead);
      const end = t0 + f.lead + f.len;
      commit(st, o, hs, { id: pick.lick.id, ctx, i0: m.at, n: m.n, t: t0 + f.lead, kind: 'pattern', pat: m.id });
      const lastH = slice[slice.length - 1];
      if (f.tail > EPS) fillSingle(st, o, hs, m.at + m.n - 1, lastH.t0 + lastH.dur - f.tail, lastH.t0 + lastH.dur);
    }
    // 音は realize で作りなおす（差し替えのときと同じ道を通すので、結果がそろう）
    return realize(hs, an, { decisions: st.decisions, phrases, opts: o });
  }

  // decisions から音を作りなおす（差し替えのあと）
  function realize(hs, an, solo) {
    const o = solo.opts;
    const rand = rng(o.seed * 2654435761 >>> 0 ^ 0x9e3779b9);
    const st = { prev: null };
    const events = [];
    solo.decisions.forEach((d, i) => {
      d.idx = i;
      const { lick, r } = realizeOne(hs, d, st, o);
      const last = pushEvents(events, d, lick, r, rand);
      if (last != null) st.prev = last;
    });
    events.sort((a, b) => a.t - b.t);
    return Object.assign({}, solo, { events });
  }

  /* ---------------- 差し替え ---------------- */
  // d 番目の決定に置き換えられるリックの候補（同じ長さに収まるもの）
  function candidates(hs, an, solo, di, extraOpts) {
    const d = solo.decisions[di], cur = L.byId[d.id], o = solo.opts;
    const lvlMax = 3;
    if (d.kind === 'pattern') {
      const slice = hs.slice(d.i0, d.i0 + d.n), chords = slice.map(h => h.chord);
      const m = an.matches.find(x => x.id === d.pat && x.at === d.i0);
      const list = L.find(d.ctx, { durs: slice.map(h => h.dur), chords, lvlMax, bpb: o.bpb, anyTonic: !!(m && m.pattern.anyTonic) });
      return list.filter(l => l.segs.join() === cur.segs.join());
    }
    const h = hs[d.i0];
    const avail = h.t0 + h.dur - d.t;
    const pools = (an.chords[d.i0].pools || []).map(p => p.ctx);
    const all = Array.from(new Set([d.ctx].concat(pools)));
    let list = [];
    all.forEach(c => { list = list.concat(L.find(c, { durs: [avail], chords: [h.chord], lvlMax, bpb: o.bpb })); });
    // 今のリックと同じくらいの長さのものを優先
    return list.filter(l => L.fit(l, [avail]) && Math.abs(L.fit(l, [avail]).len - (d.cut || cur.total)) < 2.01);
  }
  function swap(hs, an, solo, di, lickId) {
    const lick = L.byId[lickId];
    if (!lick) return solo;
    const decisions = solo.decisions.map(d => Object.assign({}, d));
    const d = decisions[di];
    const f = lick.segs.length === 1 ? L.fit(lick, [hs[d.i0].t0 + hs[d.i0].dur - d.t]) : null;
    d.id = lickId; d.ctx = lick.ctx;
    d.cut = f ? f.cut : null;
    return realize(hs, an, Object.assign({}, solo, { decisions }));
  }
  // d 番目を、別のリックにランダムに入れ替える
  function reroll(hs, an, solo, di, seed) {
    const c = candidates(hs, an, solo, di).filter(l => l.id !== solo.decisions[di].id);
    if (!c.length) return solo;
    const rand = rng((seed || Date.now()) >>> 0);
    return swap(hs, an, solo, di, c[Math.floor(rand() * c.length)].id);
  }

  Object.assign(S, { generate, realize, candidates, swap, reroll, rng, ctxOfMatch });
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
