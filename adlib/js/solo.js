/* アドリブ・ラボ：ソロの自動作成（画面を持たない）。
   解析（analysis.js）が決めた「かたまり」ごとに、リック辞典（licks*.js）から合うリックを選び、
   直前の音に近いオクターブで置いて、1コーラスぶんのソロ（音の並び）にする。
   ・決めたことは decisions（どのリックを、どこに）として持つ。差し替えは decisions を直して realize しなおす。
   ・ひとフレーズぶん弾いたら、息継ぎ（休み）をとる。フレーズの長さと休みの長さは、rest（ブレイクの多さ）で決まる。
   ・音の動きの形（階段・跳ぶ・ジグザグ）を見て、階段のように順に上がり下がりするだけのリックが続かないように選ぶ。 */
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

  // 楽器ごとの実音の音域（コンサート・ピッチ）。移調楽器でも、譜面に書いたとき五線から出すぎないように選んである
  //   アルト（書く音は +9）E♭管 / テナー（+14）B♭管 / トランペット・クラリネット（+2）/ ギター（書く音は1オクターブ上）
  S.RANGES = {
    piano: [55, 84], ep: [55, 84], vibes: [57, 84], altosax: [52, 77], tenorsax: [46, 72], trumpet: [57, 82], guitar: [52, 74], flute: [60, 86],
    clarinet: [57, 82], trombone: [43, 67], bass: [36, 60], default: [55, 84],
  };

  const ctxOfMatch = m => m.pattern.ctxAlias || m.id;
  // tags／avoidTags：選びやすくする／選びにくくする特徴タグ（伴奏のスタイルに合わせる）。fast：1拍が速いスタイルなので、16分音符のリックを使わない
  // rest：ブレイク（間）の多さ。0 少なめ／1 ふつう／2 たっぷり
  const DEF = { seed: 1, level: 2, density: 1, rest: 1, lo: 55, hi: 84, bpb: 4, tags: null, avoidTags: null, fast: false };

  /* ---------------- 息継ぎ（ブレイク） ---------------- */
  // phrase：ひとフレーズを弾きつづける長さ（拍）の幅。rest：そのあとの休み（拍）の候補。
  // long：あえて作る大きなブレイク（1小節ぶん〜）にする確率。more：そのとき、1小節に足す拍数の上限
  const BREATH = [
    { phrase: [9, 16], rest: [1, 1, 2], long: 0.05, more: 0 },
    { phrase: [5, 9], rest: [1, 2, 2, 3], long: 0.15, more: 1 },
    { phrase: [3.5, 6.5], rest: [2, 2, 3, 4], long: 0.3, more: 2 },
  ];
  const restLevel = o => Math.min(2, Math.max(0, o.rest == null ? 1 : o.rest | 0));
  // 次のフレーズの長さを決める（音の数が少なめなら短く、多めなら長く）
  function newPhrase(st, o) {
    const b = BREATH[restLevel(o)], dens = Math.min(2, Math.max(0, o.density | 0));
    st.phraseMax = (b.phrase[0] + st.rand() * (b.phrase[1] - b.phrase[0])) * [0.8, 1, 1.25][dens];
  }
  // 息継ぎ：いま鳴っている音が終わってから、何拍か休む。長く弾いたあとは、休みも1拍長く。
  // 最後の音が長い（2拍以上）ときは、1拍ぶん短く切って、そのぶんも休みにする（フレーズの終わりを、小節の終わりまでのばしきらない）
  function takeBreath(st, o) {
    const lv = restLevel(o), b = BREATH[lv];
    let r = b.rest[Math.floor(st.rand() * b.rest.length)];
    if (st.run >= 10 && lv > 0) r += 1;
    const big = st.rand() < b.long, extra = Math.floor(st.rand() * (b.more + 1));
    if (big) r = o.bpb + extra;
    const d = st.decisions[st.decisions.length - 1];
    if (d && !d.trim && st.lastDur >= 2 - EPS) { d.trim = 1; st.soundEnd -= 1; st.lastDur -= 1; }
    st.restUntil = st.soundEnd + r;
    st.run = 0;
    newPhrase(st, o);
  }

  /* ---------------- 1本のリックを置く（音にする） ---------------- */
  function realizeOne(hs, d, st, o) {
    const lick = L.byId[d.id];
    const chords = hs.slice(d.i0, d.i0 + lick.segs.length).map(h => h.chord);
    const r = L.realize(lick, chords, { t0: d.t, lo: o.lo, hi: o.hi, prev: st.prev, limit: d.cut || undefined, center: o.lo + (o.hi - o.lo) * 0.55 });
    // 息継ぎ：最後の音を trim 拍ぶん短く切る（1拍は残す。差し替えで最後の音が短くなったら、切らない）
    if (d.trim) { const last = lastNote(r.events); if (last && last.dur - d.trim >= 1 - EPS) last.dur -= d.trim; }
    return { lick, chords, r };
  }
  const lastNote = evs => { let last = null; for (const e of evs) if (!e.rest && (!last || e.t + e.dur >= last.t + last.dur)) last = e; return last; };
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

  /* ---------------- リズムの種類 ---------------- */
  // 16分音符（s）・3連符（t）・シンコペーション（y：付点、裏拍からのびる音、休符のあとの入り）を含むか。
  // 8分音符と4分音符だけのリックは、n = 0（「ふつうの8分」）
  function rhythmOf(l) {
    if (l._rh) return l._rh;
    const ev = l.events.filter(e => !e.rest);
    const s = ev.some(e => e.d12 === 3), t = ev.some(e => e.d12 === 4 || e.d12 === 8);
    const y = ev.some(e => e.d12 === 9 || (e.t12 % 12 === 6 && e.d12 >= 12)) || (l.events.length > 0 && !!l.events[0].rest && l.events[0].d12 <= 6);
    return (l._rh = { s, t, y, n: (s ? 1 : 0) + (t ? 1 : 0) + (y ? 1 : 0), kind: (s ? 's' : '') + (t ? 't' : '') + (y ? 'y' : '') });
  }

  /* ---------------- 音の動きの形 ---------------- */
  // leaps：とび（5半音以上＝4度より広い音程）の数。big：大きなとび（7半音以上＝5度より広い）の数。zig：向きの変わり目の割合。
  // stair：同じ向きの順次進行が5音以上つづく「階段」にふくまれる音の数。
  // kind：'stairs'（半分以上が階段で、とびは1つまで）／'leap'（とびが2つ以上。音の少ないリックなら、大きなとびが1つでも）／'zig'（向きがよく変わる）／'line'（そのほか）
  function shapeOf(l) {
    if (l._sh) return l._sh;
    const ev = l.events.filter(e => !e.rest);
    let leaps = 0, big = 0, turns = 0, moves = 0, run = 1, stair = 0, prevDir = 0;
    for (let i = 1; i < ev.length; i++) {
      const d = ev[i].midi - ev[i - 1].midi, a = Math.abs(d), dir = Math.sign(d);
      if (a >= 5) leaps++;
      if (a >= 7) big++;
      if (dir && prevDir) { moves++; if (dir !== prevDir) turns++; }
      if (a >= 1 && a <= 2 && dir === prevDir) run++;
      else { if (run >= 5) stair += run; run = a >= 1 && a <= 2 ? 2 : 1; }
      if (dir) prevDir = dir;
    }
    if (run >= 5) stair += run;
    const n = ev.length, zig = moves ? turns / moves : 0;
    const kind = stair >= 5 && stair >= n * 0.5 && leaps < 2 ? 'stairs' : leaps >= 2 || (leaps >= 1 && n <= 4) || (big >= 1 && n <= 6) ? 'leap' : zig >= 0.6 && n >= 5 ? 'zig' : 'line';
    return (l._sh = { n, leaps, big, zig, stair, kind });
  }

  // 同じ型（リズムと、音の上がり下がりの並びが同じ）かどうかを見るための目印。
  // 音程は「順次・3度・とび・大きなとび」の4つに丸める（コードがちがっても、同じ動きなら同じ目印になる）
  function sigOf(l) {
    if (l._sig) return l._sig;
    const parts = [];
    let prev = null;
    for (const e of l.events) {
      if (e.rest) { parts.push('r' + e.d12); continue; }
      let c = '';
      if (prev != null) { const d = e.midi - prev, a = Math.abs(d); c = (d > 0 ? '+' : d < 0 ? '-' : '=') + (a === 0 ? 0 : a <= 2 ? 1 : a <= 4 ? 2 : a <= 9 ? 3 : 4); }
      parts.push(e.d12 + c); prev = e.midi;
    }
    return (l._sig = parts.join(' '));
  }
  // 1拍あたりの音の数（8分音符のラインで 2）
  function notesPerBeat(l, len) {
    const end = (len || l.total) * 12 - EPS;
    return l.events.filter(e => !e.rest && e.t12 < end).length / (len || l.total);
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
  // 形の重み（scoreLick のコストに足し引きする）
  const SHAPE = { stair: 5, stairTwice: 4, leap: 2.2, zig: 1.8, same: 2.0 };
  function scoreLick(l, st, o, extra) {
    const fitInfo = extra.fit;
    const chords = extra.chords;
    const r = L.realize(l, chords, { t0: 0, lo: o.lo, hi: o.hi, prev: st.prev, limit: fitInfo && fitInfo.cut || undefined, center: o.lo + (o.hi - o.lo) * 0.55 });
    let cost = 0;
    if (st.prev != null) cost += Math.abs(r.first - st.prev) * (extra.fresh ? 0.3 : 0.7);   // 休んだあとの入りは、前の音から離れてもよい
    cost += (Math.max(0, o.lo - r.lo) + Math.max(0, r.hi - o.hi)) * 6;
    cost += Math.abs(r.last - (o.lo + (o.hi - o.lo) * 0.55)) * 0.12;   // 終わりの音が音域の端に寄りすぎないように
    if (st.used.has(l.id)) cost += 14;
    if (st.usedName.has(l.name)) cost += 4;
    if (st.usedSig.has(sigOf(l))) cost += 9;   // 同じ型（同じリズムで同じ動き）を、1コーラスのなかでくり返さない
    if (st.lastCtxLick && st.lastCtxLick.src === l.src) cost += 30;
    cost += Math.abs(l.lvl - o.level) * 0.7;
    // リズムの濃いリック（16分・3連・シンコペーション）は、難しさが上がるほど選びやすく。8分だけが続くと、単調になるので選びにくく
    {
      const rh = rhythmOf(l), li = Math.max(0, Math.min(2, (o.level | 0) - 1)), dens = Math.min(2, Math.max(0, o.density | 0));
      if (rh.n) {
        cost -= [0.2, 1.8, 3.0][li] + (rh.n > 1 ? 0.3 : 0);
        if (rh.s) cost += [0.7, 0, -0.7][dens];          // 音が少なめなら16分は控えめ、多めなら出やすく
        if (rh.s && o.fast) cost += 12;                  // 速い2拍子（サンバ・サルサ）では、16分は弾けないので選ばない
        if (st.lastRh && rh.kind === st.lastRh) cost += 1.2;   // 同じリズムの型が続かないように
      } else {
        cost += [0, 0.4, 1.0][li] * (st.plainRun >= 1 ? 1.8 : 1);
      }
    }
    // 音の動きの形：階段（順に上がり下がりするだけ）は選びにくく、続けては使わない。跳ぶ・ジグザグは選びやすく。同じ形が続かないように
    {
      const sh = shapeOf(l);
      cost += SHAPE.stair * (sh.stair / Math.max(1, sh.n));
      if (sh.kind === 'stairs' && st.lastShape === 'stairs') cost += SHAPE.stairTwice;
      if (sh.kind === 'leap') cost -= SHAPE.leap;
      else if (sh.kind === 'zig') cost -= SHAPE.zig;
      if (sh.kind !== 'line' && sh.kind !== 'stairs' && sh.kind === st.lastShape) cost += SHAPE.same;
    }
    // 音の数：少なめなら音のまばらなリック、多めなら音のつまったリックを選びやすく
    {
      const dens = Math.min(2, Math.max(0, o.density | 0));
      if (dens !== 1) cost += [0.9, 0, -0.9][dens] * (notesPerBeat(l, fitInfo && fitInfo.len) - 2);
    }
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
    while (guard++ < 12) {
      // 前の音から1拍以上あいていれば、そこでフレーズは切れている（新しいフレーズ）
      if (st.run > 0 && t - st.soundEnd >= 1 - EPS) { st.run = 0; newPhrase(st, o); }
      // 息継ぎ：ひとフレーズぶん弾いたら、休む
      if (st.run >= st.phraseMax - 1 - EPS) takeBreath(st, o);
      if (st.restUntil > t + EPS) t = Math.ceil(st.restUntil - EPS);
      const remaining = to - t;
      if (remaining < 1.5 - EPS) break;
      const fresh = st.run <= EPS;   // フレーズの頭か
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
      // ほしい長さ：このフレーズで、あとどれだけ弾くか（2拍より短くはしない）
      let want = Math.min(remaining <= 4.5 ? remaining : 4, Math.max(2, st.phraseMax - st.run));
      if (dens === 0) want = Math.max(2, want * 0.6);
      const scored = cands.map(l => scoreLick(l, st, o, { fit: L.fit(l, [remaining]), chords: [chord], want, fresh }));
      const pick = pickWeighted(scored, st.rand, 5);
      const len = pick.fit.len;
      // フレーズの頭では、短いリックを後ろ寄せ（前に間をおく）で置くこともある。フレーズの途中では、つなげて置く
      let offset = 0;
      const slack = remaining - len;
      if (fresh && slack >= 1 - EPS && st.rand() < [0.5, 0.35, 0.2][dens]) offset = Math.min(slack, slack >= 2 ? 2 : 1);
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
      st.lastDur = lastNote(sounding).dur;
    }
    st.used.add(lick.id); st.usedName.add(lick.name); st.usedSig.add(sigOf(lick)); st.lastCtxLick = lick;
    { const rh = rhythmOf(lick); st.lastRh = rh.n ? rh.kind : ''; st.plainRun = rh.n ? 0 : (st.plainRun || 0) + 1; }
    st.lastShape = shapeOf(lick).kind;
    st.decisions.push(d);
    return st.events.length - prevLen;
  }

  /* ---------------- 本体 ---------------- */
  // かたまり（ii–V–I など）を、コードごとに分ける確率（難しさごと。base〜hi）。
  // pickup：フレーズの頭から、これだけ弾いたあとなら「入り」とみなして、かたまりのリックにつなげてよい（拍）。over：フレーズの長さを、これだけ超えてよい（拍）
  const SPLIT = { base: [0, 0.25, 0.45], hi: [0, 0.75, 0.95], pickup: 2.5, over: 3 };
  // hs：和声の区間（C.harmonicSlots）　an：解析結果（A.analyze）
  function generate(hs, an, opts) {
    const o = Object.assign({}, DEF, opts || {});
    const rand = rng(o.seed * 2654435761 >>> 0);
    const st = { an, rand, prev: null, used: new Set(), usedName: new Set(), usedSig: new Set(), decisions: [], events: [], lastCtxLick: null, lastRh: '', lastShape: '', plainRun: 0, run: 0, soundEnd: -99, lastDur: 0, restUntil: 0, phraseMax: 8 };
    newPhrase(st, o);
    const lvlMax = Math.min(3, o.level + 1);
    const sliceOf = m => hs.slice(m.at, m.at + m.n);
    const candsFor = m => { const sl = sliceOf(m); return L.find(ctxOfMatch(m), { durs: sl.map(h => h.dur), chords: sl.map(h => h.chord), lvlMax, bpb: o.bpb, anyTonic: !!m.pattern.anyTonic }); };
    // いま使えるパターンだけでフレーズを区切る
    const canUse = m => candsFor(m).length > 0;
    const phrases = A.segment(hs, an.matches, { canUse, preferShort: o.preferShort });
    const single = k => { const h = hs[k]; fillSingle(st, o, hs, k, h.t0, h.t0 + h.dur); };
    // かたまり（ii–V–I など）のリックを置く
    const placePattern = (m, cands) => {
      const ctx = ctxOfMatch(m), slice = sliceOf(m), durs = slice.map(h => h.dur), chords = slice.map(h => h.chord);
      const scored = (cands || candsFor(m)).map(l => scoreLick(l, st, o, { fit: L.fit(l, durs), chords, fresh: st.run <= EPS }));
      const pick = pickWeighted(scored, rand, 6);
      const f = pick.fit, t0 = slice[0].t0;
      if (f.lead > EPS) {
        fillSingle(st, o, hs, m.at, t0, t0 + f.lead);
        if (st.restUntil > t0 + f.lead) st.restUntil = t0 + f.lead;   // かたまりのリックを弾くと決めたので、休みはここまで
      }
      commit(st, o, hs, { id: pick.lick.id, ctx, i0: m.at, n: m.n, t: t0 + f.lead, kind: 'pattern', pat: m.id });
      const lastH = slice[slice.length - 1];
      if (f.tail > EPS) fillSingle(st, o, hs, m.at + m.n - 1, lastH.t0 + lastH.dur - f.tail, lastH.t0 + lastH.dur);
    };
    // いま、このかたまりを弾きはじめてよいか：休みが残っていない。そして、フレーズの頭か、入りの数拍のあとか、弾ききる余裕がある
    const ready = m => {
      const t0 = hs[m.at].t0, total = sliceOf(m).reduce((a, h) => a + h.dur, 0);
      if (st.run > 0 && t0 - st.soundEnd >= 1 - EPS) { st.run = 0; newPhrase(st, o); }
      if (st.run > SPLIT.pickup + EPS) {
        // 息継ぎの番：ここで休みを決める（最後の長い音を短く切れれば、かたまりの頭に間に合うこともある）
        if (st.run >= st.phraseMax - 1 - EPS) takeBreath(st, o);
        // まだフレーズの途中で、かたまりを弾ききる余裕がない：1コードのリックでつないで、息継ぎのあとに入りなおす
        else if (st.run + total > st.phraseMax + SPLIT.over + EPS) return false;
      }
      return st.restUntil <= t0 + EPS;
    };
    // k 番目のコードから始まって end までにおさまる、短いかたまり（V–I など）。いちばん得点の高いもの
    const byStart = {};
    an.matches.forEach(m => { (byStart[m.at] = byStart[m.at] || []).push(m); });
    const subMatch = (k, end) => (byStart[k] || []).filter(m => m.n >= 2 && m.at + m.n <= end && canUse(m)).sort((a, b) => b.pattern.score - a.pattern.score)[0] || null;
    for (const ph of phrases) {
      if (!ph.match) { single(ph.from); continue; }
      const m = ph.match, cands = candsFor(m);
      // 難しさが上がるほど、ii–V–I などのかたまりをコードごとに分けて、リズムの濃いリック（16分・3連・シンコペーション）も使う。
      // かたまりのリックに、リズムの濃いものが少ない（ターンアラウンドなど）ときは、分ける確率を上げる。
      // 抽選は、かたまりの位置だけで決まる独立の乱数で行う（キーや音域がちがっても、コーラスの組み立てが変わらないように）
      if (m.n >= 2) {
        const li = Math.max(0, Math.min(2, (o.level | 0) - 1));
        const rs = cands.length ? cands.filter(l => rhythmOf(l).n > 0).length / cands.length : 0;
        const base = SPLIT.base[li], hi = SPLIT.hi[li];
        const p = base + (hi - base) * Math.max(0, 1 - 2 * rs);
        if (rng(((o.seed * 2654435761) >>> 0) ^ Math.imul(m.at + 1, 0x9e3779b1))() < p) {
          for (let k = m.at; k < m.at + m.n; k++) single(k);
          continue;
        }
      }
      if (m.n < 2 || ready(m)) { placePattern(m, cands); continue; }
      // 息継ぎ：コードごとに進んで休み、休みが済んだところから、短いかたまり（V–I など）があれば、それで入りなおす
      for (let k = m.at, end = m.at + m.n; k < end;) {
        const m2 = k > m.at ? subMatch(k, end) : null;
        if (m2 && ready(m2)) { placePattern(m2); k += m2.n; }
        else { single(k); k++; }
      }
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
  // di 番目の（1コードの）リックが使える長さ（拍）：同じコードのなかで次のリックが始まるところまで。なければ、コードの終わりまで
  function availOf(hs, decisions, di) {
    const d = decisions[di], h = hs[d.i0], end = h.t0 + h.dur, next = decisions[di + 1];
    return (next && next.t > d.t + EPS && next.t < end - EPS ? next.t : end) - d.t;
  }
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
    const avail = availOf(hs, solo.decisions, di);   // 同じコードのあとのリックに重ならない長さまで
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
    if (!d) return solo;
    const f = lick.segs.length === 1 ? L.fit(lick, [availOf(hs, decisions, di)]) : null;
    if (lick.segs.length === 1 && !f) return solo;   // この場所には入らない長さ
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

  Object.assign(S, { generate, realize, candidates, swap, reroll, rng, ctxOfMatch, rhythmOf, shapeOf, sigOf, availOf, BREATH });
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
