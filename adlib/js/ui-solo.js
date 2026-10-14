/* アドリブ・ラボ：②ソロタブ（自動ソロ・楽譜・再生カーソル・フレーズの差しかえ） */
(function () {
  'use strict';
  const AL = window.AL;
  const { T, C, A, L, S, B, Au, N, U } = AL;
  const { h, $, $$ } = U;
  const App = AL.App;
  const st = () => App.st;
  const el = {};
  let dirty = true, displayChorus = 0, layout = null, curCursor = null, lastNoteEls = [], lastScrollSys = -1;
  let candOpen = false, candLimit = 18;

  const TRANS_NOTE = { 9: '（E♭管）', 14: '（B♭管）', 2: '（B♭管）', 12: '（1オクターブ上に記譜）' };
  const LEVELS = [[1, 'やさしい'], [2, 'ふつう'], [3, 'むずかしい']];
  const DENS = [[0, 'まばら'], [1, 'ふつう'], [2, 'びっしり']];

  /* ---------------- 譜面データ ---------------- */
  // 実音のソロ → 楽器の譜面（移調・音部記号つき）。App.buildScore は MusicXML の書き出しからも使う
  App.writtenInst = function () {
    const inst = App.soloInstDef();
    return st().concert ? { id: inst.id, jp: inst.jp, transpose: 0, clef: inst.clef } : { id: inst.id, jp: inst.jp, transpose: inst.transpose || 0, clef: inst.clef };
  };
  App.soloMarks = function (solo) {
    return solo.decisions.map((d, i) => {
      const l = L.byId[d.id];
      return { t0: d.t, t1: d.t + (d.cut || l.total), label: d.kind === 'pattern' ? App.patLabel(d.pat) : '', tone: i, idx: i };
    });
  };
  App.buildScore = function (solo) {
    const inst = App.writtenInst(), an = App.an, chart = App.chart;
    const sections = chart.order.map(bi => chart.bars[bi].section || null);
    const feel = (App.FEEL[st().style] || '') + '  ♩=' + st().tempo;
    const score = N.scoreFromEvents({
      events: solo.events.map((e, i) => Object.assign({}, e, { id: i })), slots: App.slots, bpb: App.bpb, bars: chart.chorusBars,
      keySpell: an.key.spell, keyMode: an.key.mode, inst: { transpose: inst.transpose, clef: inst.clef }, sections, marks: App.soloMarks(solo), feel,
    });
    return { score, inst, mode: an.key.mode };
  };

  // 部品の組み合わせで作ったリックの説明（'部品の組み合わせ：a1 + g2'）は、見せない
  const lickDesc = l => (l.desc && l.desc.indexOf('部品の組み合わせ') !== 0 ? l.desc : '');
  App.lickDesc = lickDesc;
  // リックの名前・説明のなかの音名（C 基準で書いてある）を、実際に弾くキー（移調譜なら楽器の書き音）にあわせて書きかえる。
  // chord0：そのリックの最初のコード（実音のもの）
  App.lickText = function (text, lick, chord0) {
    if (!text || !chord0 || chord0.nc || !chord0.root) return text;
    const inst = App.writtenInst(), it = inst.transpose || 0;
    const semis = T.mod(chord0.rootPc - lick.ref[0].rootPc + it, 12);
    // 楽譜の音と同じ綴り方（文字のずれ＋半音）で書きかえる。移調譜のときは、楽器の書き音のぶんもずらす
    const steps = it ? (N.STEPS_OF_SEMIS[it] != null ? N.STEPS_OF_SEMIS[it] : 0) : 0;
    const dl = T.mod(chord0.root.l - lick.ref[0].root.l + steps, 7);
    if (!semis && !dl) return text;
    // 書く音での最初のコードの根音（綴り）から、♭系か♯系か（二重の♯♭になるときの綴りなおし用）を決める
    let root = chord0.root;
    if (it) { const q = T.shiftPitch({ l: root.l, a: root.a, oct: 4 }, steps, it); root = q ? { l: q.l, a: q.a } : T.spellFromPc(T.mod(chord0.rootPc + it, 12), true); }
    const minorish = chord0.cls === 'min' || chord0.cls === 'hdim' || chord0.cls === 'minmaj';
    const flat = root.a < 0 ? true : root.a > 0 ? false : T.keyPrefersFlat(root, minorish ? 'minor' : 'major');
    return T.transposeNotesInText(text, semis, { tonicPc: T.spellPc(root), fifths: flat ? -1 : 1 }, dl);
  };

  /* ---------------- 組み立て ---------------- */
  function instOptions() {
    return Au.INSTRUMENTS.solo.map(i => [i.id, i.jp + (st().concert ? '' : TRANS_NOTE[i.transpose] || '')]);
  }
  function build() {
    const root = $('#tab-solo');
    U.clear(root);

    el.inst = U.select(instOptions(), st().soloInst, v => App.setSoloParams({ soloInst: v }), { id: 'soloInst', 'aria-label': 'ソロの楽器' });
    el.level = U.seg(LEVELS, st().level, v => App.setSoloParams({ level: v }), '難しさ');
    el.density = U.seg(DENS, st().density, v => App.setSoloParams({ density: v }), '音の多さ');
    el.concert = U.seg([[true, '実音', '鳴っている音のまま（コンサートピッチ）'], [false, '移調譜', 'その楽器の人が読む楽譜（アルトは長6度上、トランペット・テナーは長2度・長9度上、ギターは1オクターブ上）']], st().concert, v => { App.set({ concert: v }, 'solo'); refreshInstOptions(); }, '譜面の書き方');
    const newBtn = h('button', { type: 'button', class: 'btn primary', onclick: () => App.newSolo(), title: '同じコード進行で、別のソロを作る' }, '🎲 新しいソロ');
    const listenBtn = h('button', { type: 'button', class: 'btn', onclick: () => { if (st().soloMode === 'off') { st().soloMode = 'same'; App.ui.soloSel.value = 'same'; } App.play(); } }, '▶ 伴奏とソロを聴く');
    el.seed = h('span', { class: 'muted small', id: 'soloSeed' });
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'card-h' }, h('h2', null, 'ソロをつくる'), h('div', { class: 'row gap' }, newBtn, listenBtn)),
      h('p', { class: 'muted' }, 'コードの役割（ii–V–I など）を読みとって、辞典のリックをつなげたソロを作ります。気に入らないフレーズは、下で1つずつ差しかえられます。'),
      h('div', { class: 'fields' },
        U.field('楽器', el.inst),
        U.field('難しさ', el.level, 'むずかしいほど、ビバップ風・オルタード・16分音符が混ざります'),
        U.field('音の多さ', el.density, 'まばらなほど、間（休符）が多くなります'),
        U.field('譜面の書き方', el.concert, '実音＝鳴っている音のまま。移調譜＝その楽器の人が読む楽譜')),
      el.seed));

    el.scoreWrap = h('div', { class: 'score-wrap', id: 'scoreWrap' });
    el.scoreTitle = h('div', { class: 'score-title' });
    el.chorusNote = h('span', { class: 'muted small' });
    const printBtn = h('button', { type: 'button', class: 'btn sm', onclick: () => App.printScore && App.printScore() }, '🖨 印刷');
    const xmlBtn = h('button', { type: 'button', class: 'btn sm', onclick: () => App.exportXml && App.exportXml() }, 'MusicXML');
    const midiBtn = h('button', { type: 'button', class: 'btn sm', onclick: () => App.exportMidi && App.exportMidi() }, 'MIDI');
    root.appendChild(h('div', { class: 'card', id: 'scoreCard' },
      h('div', { class: 'card-h' }, h('h2', null, 'ソロの楽譜'), h('div', { class: 'row gap wrap' }, el.chorusNote, printBtn, xmlBtn, midiBtn)),
      el.scoreTitle, el.scoreWrap,
      h('p', { class: 'hint' }, '下の灰色の括弧が「1本のリック」の範囲です。括弧か音符をタップすると、そのフレーズの中身と別の候補が下に出ます。')));

    el.phrase = h('div', { class: 'card', id: 'phraseCard' });
    root.appendChild(el.phrase);

    el.scoreWrap.addEventListener('click', onScoreClick);
  }
  function refreshInstOptions() {
    const v = st().soloInst; U.clear(el.inst);
    instOptions().forEach(([id, l]) => el.inst.appendChild(h('option', { value: id }, l)));
    el.inst.value = v;
  }

  /* ---------------- 楽譜の描画 ---------------- */
  function displayedSolo() { return App.soloFor(st().soloMode === 'fresh' ? displayChorus : 0); }
  function renderScore() {
    if (!el.scoreWrap) return;
    dirty = false;
    const solo = displayedSolo();
    if (!App.hasChords || !App.chart.chorusBars) {
      el.scoreWrap.innerHTML = '';
      el.scoreWrap.appendChild(h('p', { class: 'empty' }, 'コード譜にコードを入力すると、ここにソロの楽譜が出ます。'));
      layout = null; return;
    }
    const w = Math.max(300, (el.scoreWrap.clientWidth || (window.innerWidth - 40)));
    const sb = App.buildScore(solo);
    const ss = w < 520 ? 6 : w < 760 ? 7 : 8;
    const r = N.render(sb.score, { width: w, ss, barsPerSystem: w < 700 ? 2 : 4 });
    layout = r.layout;
    el.scoreWrap.innerHTML = r.svg;
    const svg = el.scoreWrap.firstChild;
    curCursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    curCursor.setAttribute('class', 'cursor'); curCursor.setAttribute('visibility', 'hidden');
    svg.appendChild(curCursor);
    lastNoteEls = [];
    el.scoreTitle.textContent = (st().title || '') + '　' + App.an.key.name + '　' + sb.inst.jp + (st().concert ? '（実音）' : (sb.inst.transpose ? '（移調譜）' : ''));
    el.chorusNote.textContent = st().soloMode === 'fresh' && displayChorus > 0 ? displayChorus + 1 + ' コーラス目のソロ（再生中に自動で作ったもの）' : '';
    el.seed.textContent = 'ソロの番号：' + st().soloSeed + '　／　' + solo.decisions.length + ' 本のリックをつなぎました';
    markSel();
  }

  function onScoreClick(e) {
    let dec = null;
    const m = e.target.closest('[data-mark]'), n = e.target.closest('[data-ev]');
    if (m) dec = +m.dataset.mark;
    else if (n) { const ev = displayedSolo().events[+n.dataset.ev]; if (ev) dec = ev.dec; }
    if (dec != null) { candOpen = false; candLimit = 18; App.select({ dec }); }
  }
  function markSel() {
    if (!el.scoreWrap) return;
    $$('.mark.sel', el.scoreWrap).forEach(g => g.classList.remove('sel'));
    $$('.note.sel', el.scoreWrap).forEach(g => g.classList.remove('sel'));
    const di = App.sel.dec;
    if (di == null) return;
    const g = el.scoreWrap.querySelector('.mark[data-mark="' + di + '"]');
    if (g) g.classList.add('sel');
    const solo = displayedSolo();
    solo.events.forEach((ev, i) => { if (ev.dec === di) { const ne = el.scoreWrap.querySelector('.note[data-ev="' + i + '"]'); if (ne) ne.classList.add('sel'); } });
  }

  /* ---------------- 再生カーソル ---------------- */
  function onPos(pos) {
    if (!curCursor) return;
    lastNoteEls.forEach(n => n.classList.remove('on')); lastNoteEls = [];
    if (!pos || pos.countIn || App.playKind !== 'main' || !layout) { curCursor.setAttribute('visibility', 'hidden'); lastScrollSys = -1; return; }
    const lb = layout.bars[pos.bar];
    if (!lb) return;
    const x = lb.timeToX(pos.beatInBar), ss = layout.ss;
    curCursor.setAttribute('x1', x); curCursor.setAttribute('x2', x);
    curCursor.setAttribute('y1', lb.top - 1.2 * ss); curCursor.setAttribute('y2', lb.bottom + 1.2 * ss);
    curCursor.setAttribute('visibility', 'visible');
    // 鳴っている音を光らせる
    const evs = displayedSolo().events, u = pos.beat;
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      if (e.t > u) break;
      if (u < e.t + e.dur - 1e-6) { const ne = el.scoreWrap.querySelector('.note[data-ev="' + i + '"]'); if (ne) { ne.classList.add('on'); lastNoteEls.push(ne); } }
    }
    if (App.tab === 'solo' && lastScrollSys !== lb.sys) {
      lastScrollSys = lb.sys;
      const r = curCursor.getBoundingClientRect(), vh = window.innerHeight || 700;
      if (r.top < 80 || r.bottom > vh - 100) curCursor.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  /* ---------------- フレーズのパネル ---------------- */
  // d（{ i0, t }：どのコードの、どの拍から）に lick を置いたときの音（実音）と、そのための和音。solo は直前の音を知るために使う
  function placeLickAt(solo, d, lick) {
    const o = solo.opts;
    const chords = App.hs.slice(d.i0, d.i0 + lick.segs.length).map(x => x.chord);
    const lead = d.t - App.hs[d.i0].t0;
    let prev = null;
    for (let i = solo.events.length - 1; i >= 0; i--) { if (solo.events[i].t < d.t - 1e-6) { prev = solo.events[i].midi; break; } }
    const f = lick.segs.length === 1 ? L.fit(lick, [App.hs[d.i0].t0 + App.hs[d.i0].dur - d.t]) : null;
    const cut = f && f.cut ? f.cut : null;
    const r = L.realize(lick, chords, { t0: lead, lo: o.lo, hi: o.hi, prev, limit: cut || undefined, center: o.lo + (o.hi - o.lo) * 0.55 });
    const evs = r.events.filter(e => !e.rest);
    const beats = lick.segs.slice(); beats[0] += lead;
    if (cut) beats[0] = lead + cut;
    return { evs, chords, srcs: App.hs.slice(d.i0, d.i0 + lick.segs.length).map(x => x.src), beats, lead };
  }
  const placeLick = (solo, di, lick) => placeLickAt(solo, solo.decisions[di], lick);

  function miniNotation(pl, width) {
    const inst = App.writtenInst();
    const events = pl.evs.map((e, i) => ({ t: e.t, dur: e.dur, p: e.p, tie: e.tie, accent: e.accent, stac: e.stac, id: i }));
    const bars = Math.ceil(pl.beats.reduce((a, b) => a + b, 0) / App.bpb - 1e-6);
    const r = N.preview(events, pl.srcs, pl.beats, { bpb: App.bpb, keySpell: App.an.key.spell, keyMode: App.an.key.mode, inst: { transpose: inst.transpose, clef: inst.clef }, width, ss: bars >= 3 ? 5.3 : 6, barsPerSystem: 4 });
    return r.svg;
  }
  function degreeLine(solo, di) {
    const evs = solo.events.filter(e => e.dec === di);
    if (!evs.length) return null;
    const d = solo.decisions[di], bySeg = {};
    evs.forEach(e => { (bySeg[e.seg] = bySeg[e.seg] || []).push(e); });
    const box = h('div', { class: 'degs' });
    Object.keys(bySeg).sort((a, b) => a - b).forEach(k => {
      const hsx = App.hs[d.i0 + (+k)];
      const row = h('div', { class: 'deg-row' }, h('span', { class: 'deg-ch' }, U.chordHtml(hsx.chord, hsx.src)));
      bySeg[k].forEach(e => {
        const t = String(e.deg), strong = /^(1|b3|3|5|b7|7|b5|bb7|6)$/.test(t);
        row.appendChild(h('span', { class: 'deg' + (strong ? ' ct' : ' tn') + (/^(3|b3|7|b7|bb7)$/.test(t) ? ' gt' : '') }, t.replace(/b/g, '♭').replace(/#/g, '♯')));
      });
      box.appendChild(row);
    });
    return box;
  }

  function renderPhrase() {
    if (!el.phrase) return;
    const box = U.clear(el.phrase), solo = displayedSolo(), di = App.sel.dec;
    const d = di != null ? solo.decisions[di] : null;
    if (!d) {
      box.appendChild(h('div', { class: 'card-h' }, h('h2', null, 'フレーズを見る・差しかえる')));
      box.appendChild(h('p', { class: 'muted' }, App.hasChords ? '楽譜の括弧か音符をタップすると、そのフレーズに使ったリックの中身（コードに対する度数）と、差しかえ候補が出ます。' : ''));
      if (solo.decisions.length) {
        const list = h('div', { class: 'phrase-list' });
        solo.decisions.forEach((dd, i) => {
          const lk = L.byId[dd.id], hsx = App.hs[dd.i0];
          list.appendChild(h('button', { type: 'button', class: 'phrase-item', onclick: () => { candOpen = false; candLimit = 18; App.select({ dec: i }); } },
            h('span', { class: 'pi-n' }, String(i + 1)),
            h('span', { class: 'pi-b' }, h('b', null, dd.kind === 'pattern' ? App.patLabel(dd.pat) : (L.CTX[dd.ctx] ? L.CTX[dd.ctx].jp.replace(/（.*$/, '') : dd.ctx)), h('span', { class: 'muted' }, '　' + (hsx.bar + 1) + '小節目〜　' + App.lickText(lk.name, lk, hsx.chord)))));
        });
        box.appendChild(list);
      }
      return;
    }
    const lick = L.byId[d.id], n = solo.decisions.length;
    const hsx = App.hs[d.i0];
    const txt = (t, lk) => App.lickText(t, lk || lick, hsx.chord);
    const pl = placeLick(solo, di, lick);
    const ctxJp = L.CTX[d.ctx] ? L.CTX[d.ctx].jp : d.ctx;
    const prevBtn = h('button', { type: 'button', class: 'btn sm', disabled: di <= 0 ? true : null, onclick: () => App.select({ dec: di - 1 }) }, '◀ 前');
    const nextBtn = h('button', { type: 'button', class: 'btn sm', disabled: di >= n - 1 ? true : null, onclick: () => App.select({ dec: di + 1 }) }, '次 ▶');
    box.appendChild(h('div', { class: 'card-h' },
      h('h2', null, 'フレーズ ' + (di + 1) + ' / ' + n),
      h('div', { class: 'row gap' }, prevBtn, nextBtn, h('button', { type: 'button', class: 'btn sm ghost', onclick: () => App.select({ dec: null }) }, '閉じる'))));
    const tags = h('div', { class: 'tags' }, h('span', { class: 'chip lvl' + lick.lvl }, 'Lv.' + lick.lvl));
    lick.tags.forEach(t => tags.appendChild(h('span', { class: 'chip tag' }, t)));
    const mini = h('div', { class: 'mini-score', html: miniNotation(pl, Math.min(620, (el.phrase.clientWidth || 600) - 40)) });
    const roles = (App.an.chords[d.i0].chips || []).map(c => h('span', { class: 'chip tone-' + (c.tone || 'x') }, c.label));
    box.appendChild(h('div', { class: 'phrase-main' },
      h('div', { class: 'ph-title' }, h('b', { class: 'lick-name' }, txt(lick.name)), tags),
      h('p', { class: 'muted' }, ctxJp + '　／　' + hsx.src + (d.n > 1 ? ' から ' + d.n + ' コード' : '') + '　' + (hsx.bar + 1) + '小節目'),
      lickDesc(lick) ? h('p', null, txt(lickDesc(lick))) : null,
      mini,
      degreeLine(solo, di),
      h('div', { class: 'row gap wrap mt' },
        h('button', { type: 'button', class: 'btn primary', onclick: () => playPhraseInContext(di) }, '▶ 伴奏つきで聴く'),
        h('button', { type: 'button', class: 'btn', onclick: () => previewLick(solo, di, lick) }, '▶ このリックだけ'),
        h('button', { type: 'button', class: 'btn', onclick: () => App.rerollDecision(di) }, '🎲 ほかのリックにかえる'),
        h('button', { type: 'button', class: 'btn', 'aria-pressed': String(candOpen), onclick: () => { candOpen = !candOpen; renderPhrase(); } }, candOpen ? '候補をとじる' : '候補から選ぶ'))));
    if (candOpen) renderCandidates(box, solo, di);
  }

  function playPhraseInContext(di) {
    const solo = displayedSolo(), d = solo.decisions[di], lick = L.byId[d.id];
    const from = Math.floor(d.t / App.bpb + 1e-9), to = Math.ceil((d.t + (d.cut || lick.total)) / App.bpb - 1e-9);
    if (st().soloMode === 'off') { st().soloMode = 'same'; App.ui.soloSel.value = 'same'; }
    App.play({ fromBar: from, toBar: Math.max(to, from + 1), loops: 2, countIn: 1 });
  }
  function previewLickAt(solo, d, lick) {
    const pl = placeLickAt(solo, d, lick);
    const chords = pl.srcs.map((s, i) => ({ src: s, dur: pl.beats[i] }));
    const events = pl.evs.map(e => ({ t: e.t, dur: e.dur, midi: e.midi, vel: 84, tie: e.tie, stac: e.stac, accent: e.accent }));
    App.playPreview({ id: 'lick:' + lick.id, chords, solo: Au.mergeTies(events), bpb: App.bpb === 3 ? 4 : App.bpb, tempo: Math.max(80, Math.min(160, st().tempo)) });
  }
  const previewLick = (solo, di, lick) => previewLickAt(solo, solo.decisions[di], lick);

  function renderCandidates(box, solo, di) {
    const d = solo.decisions[di];
    let list = S.candidates(App.hs, App.an, solo, di);
    const cur = L.byId[d.id];
    list = list.slice().sort((a, b) => (a.id === d.id ? -1 : b.id === d.id ? 1 : 0) || Math.abs(a.lvl - st().level) - Math.abs(b.lvl - st().level) || a.name.localeCompare(b.name, 'ja'));
    box.appendChild(h('h3', null, '差しかえ候補（' + list.length + '本）'));
    if (!list.length) { box.appendChild(h('p', { class: 'muted' }, 'このフレーズには、ほかの候補がありません。')); return; }
    const wrap = h('div', { class: 'cands' });
    const cw = el.phrase.clientWidth || 640, candCols = cw >= 760 ? 2 : 1, candW = Math.max(260, Math.floor((cw - 36 - (candCols - 1) * 10) / candCols - 28));
    list.slice(0, candLimit).forEach(l => {
      const pl = placeLick(solo, di, l);
      const isCur = l.id === d.id;
      const tags = h('div', { class: 'tags' }, h('span', { class: 'chip lvl' + l.lvl }, 'Lv.' + l.lvl));
      l.tags.slice(0, 4).forEach(t => tags.appendChild(h('span', { class: 'chip tag' }, t)));
      const shown = App.lickText(l.name, l, App.hs[d.i0].chord);
      wrap.appendChild(h('div', { class: 'cand' + (isCur ? ' cur' : '') },
        h('div', { class: 'cand-h' },
          h('button', { type: 'button', class: 'mini-play', 'aria-label': shown + 'を聴く', onclick: () => previewLick(solo, di, l) }, '▶'),
          h('b', { class: 'cand-name' }, shown),
          h('div', { class: 'grow' }),
          isCur ? h('span', { class: 'badge' }, '今のリック') : h('button', { type: 'button', class: 'btn sm primary', onclick: () => { App.swapLick(di, l.id); } }, 'これにする')),
        tags,
        h('div', { class: 'mini-score', html: miniNotation(pl, candW) }),
        lickDesc(l) ? h('p', { class: 'muted small' }, App.lickText(lickDesc(l), l, App.hs[d.i0].chord)) : null));
    });
    box.appendChild(wrap);
    if (list.length > candLimit) box.appendChild(h('div', { class: 'row center mt' }, h('button', { type: 'button', class: 'btn', onclick: () => { candLimit += 18; renderPhrase(); } }, 'もっと見る（残り ' + (list.length - candLimit) + '本）')));
  }

  /* ---------------- ほかの画面から使う（コード譜タブの「リックの提案」） ---------------- */
  // hsIdx のコードに合うリックを、いまのレベルに近い順に。{ di（ソロの何番目のフレーズか。なければ -1）, d, list, total, ctxJp }
  App.suggest = function (hsIdx, n) {
    const solo = App.solo, hsx = App.hs[hsIdx];
    if (!hsx || hsx.chord.nc || hsx.chord.bad) return null;
    const di = solo.decisions.findIndex(d => d.i0 <= hsIdx && hsIdx < d.i0 + d.n);
    let list, d, ctxJp = '';
    if (di >= 0) {
      d = solo.decisions[di];
      list = S.candidates(App.hs, App.an, solo, di);
      ctxJp = d.kind === 'pattern' ? (AL.A.PAT_BY_ID[d.pat] ? AL.A.PAT_BY_ID[d.pat].jp : App.patLabel(d.pat)) : (L.CTX[d.ctx] ? L.CTX[d.ctx].jp : d.ctx);
    } else {
      d = { i0: hsIdx, t: hsx.t0, n: 1, cut: null };
      const pools = (App.an.chords[hsIdx].pools || []).map(p => p.ctx);
      list = [];
      pools.forEach(c => { list = list.concat(L.find(c, { durs: [hsx.dur], chords: [hsx.chord], lvlMax: 3, bpb: App.bpb })); });
      ctxJp = pools.length && L.CTX[pools[0]] ? L.CTX[pools[0]].jp : '';
    }
    const order = new Map(L.all.map((l, i) => [l.id, i]));
    const cur = di >= 0 ? solo.decisions[di].id : null;
    list = list.slice().sort((a, b) => (a.id === cur ? -1 : b.id === cur ? 1 : 0) || Math.abs(a.lvl - st().level) - Math.abs(b.lvl - st().level) || order.get(a.id) - order.get(b.id));
    return { di, d, list: list.slice(0, n || 6), total: list.length, ctxJp, current: cur };
  };
  App.lickView = { placeLickAt, miniNotation, previewLickAt, degreeLine };

  /* ---------------- 受けとり ---------------- */
  function refreshControls() {
    if (!el.inst) return;
    el.inst.value = st().soloInst;
    el.level.set(st().level); el.density.set(st().density); el.concert.set(st().concert);
  }
  function refresh() {
    if (App.tab !== 'solo') { dirty = true; return; }
    refreshControls(); renderScore(); renderPhrase();
  }
  App.on('init', build);
  App.on('chart', () => { displayChorus = 0; candOpen = false; });
  App.on('solo', () => { displayChorus = 0; refresh(); });
  App.on('sel', () => { if (App.tab === 'solo' || dirty === false) { markSel(); if (App.tab === 'solo') renderPhrase(); } });
  App.on('tab', name => { if (name === 'solo') { refreshControls(); if (dirty) { renderScore(); } else { markSel(); } renderPhrase(); } });
  App.on('pos', onPos);
  App.on('chorus', k => { if (st().soloMode === 'fresh') { displayChorus = k; if (App.tab === 'solo') renderScore(); else dirty = true; } });
  App.on('playstate', kind => { if (!kind && displayChorus !== 0) { displayChorus = 0; if (App.tab === 'solo') renderScore(); else dirty = true; } });
  App.on('settings', () => { if (el.inst) { refreshControls(); dirty = true; if (App.tab === 'solo') refresh(); } });
  App.on('solo-mode', () => { displayChorus = 0; dirty = true; if (App.tab === 'solo') refresh(); });
  window.addEventListener('resize', U.debounce(() => { if (App.tab === 'solo' && layout) { renderScore(); } else dirty = true; }, 250));
})();
