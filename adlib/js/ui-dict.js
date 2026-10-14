/* アドリブ・ラボ：③リック辞典タブ（種類ごとに、楽譜つきでリックをながめる・聴く） */
(function () {
  'use strict';
  const AL = window.AL;
  const { T, L, S, B, Au, N, U } = AL;
  const { h, $, $$ } = U;
  const App = AL.App;
  const st = () => App.st;
  const el = {};
  const D = { ctx: 'ii-V-I', q: '', level: 0, tag: '', limit: 24, degrees: false };
  let built = false, dirty = true, renderToken = 0;

  const short = s => String(s).replace(/（.*$/, '');
  const KEY_NAMES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(pc => T.spellStr(T.keySpell(pc, 'major'), true));

  /* ---------------- 部品 ---------------- */
  // ctx の「主役のコード」の調：最後のコードがマイナー系なら minor
  function modeOf(lick) {
    const last = lick.ref[lick.ref.length - 1];
    return last.cls === 'min' || last.cls === 'minmaj' || last.cls === 'hdim' ? 'minor' : 'major';
  }
  function instRange() { return Au && S.RANGES[st().soloInst] ? S.RANGES[st().soloInst] : S.RANGES.default; }
  // lick を、キー K（C から K 半音上）に移調して置く
  function place(lick, K) {
    const mode = modeOf(lick), tonic = T.keySpell(K, mode);
    const ctx = { tonicPc: K, fifths: T.keyFifths(tonic, mode) };
    const srcs = lick.refSrc.map(s => (K ? T.transposeChordStr(s, K, ctx) : s));
    const chords = srcs.map(s => T.parseChord(s));
    const rg = instRange();
    const r = L.realize(lick, chords, { t0: 0, lo: rg[0], hi: rg[1], center: (rg[0] + rg[1]) / 2 });
    return { srcs, chords, evs: r.events.filter(e => !e.rest), mode, tonic };
  }
  function notation(lick, pl, width) {
    const inst = App.writtenInst();
    const events = pl.evs.map((e, i) => ({ t: e.t, dur: e.dur, p: e.p, tie: e.tie, accent: e.accent, stac: e.stac, id: i }));
    return N.preview(events, pl.srcs, lick.segs, { bpb: lick.bpb || 4, keySpell: pl.tonic, keyMode: pl.mode, inst: { transpose: inst.transpose, clef: inst.clef }, width, ss: 6.4 }).svg;
  }
  function playLick(lick, K) {
    const pl = place(lick, K);
    const events = Au.mergeTies(pl.evs.map(e => ({ t: e.t, dur: e.dur, midi: e.midi, vel: 84, tie: e.tie, stac: e.stac })));
    App.playPreview({ id: 'dict:' + lick.id, chords: pl.srcs.map((s, i) => ({ src: s, dur: lick.segs[i] })), solo: events, bpb: 4, tempo: Math.max(80, Math.min(150, st().tempo)) });
  }
  function degreeRows(lick, pl) {
    const box = h('div', { class: 'degs' });
    const bySeg = {};
    lick.events.forEach(e => { if (!e.rest) (bySeg[e.seg] = bySeg[e.seg] || []).push(e); });
    Object.keys(bySeg).sort((a, b) => a - b).forEach(k => {
      const row = h('div', { class: 'deg-row' }, h('span', { class: 'deg-ch' }, U.chordHtml(pl.chords[k], pl.srcs[k])));
      bySeg[k].forEach(e => {
        const t = String(e.deg), strong = /^(1|b3|3|5|b7|7|b5|bb7|6)$/.test(t);
        row.appendChild(h('span', { class: 'deg' + (strong ? ' ct' : ' tn') + (/^(3|b3|7|b7|bb7)$/.test(t) ? ' gt' : '') }, t.replace(/b/g, '♭').replace(/#/g, '♯')));
      });
      box.appendChild(row);
    });
    return box;
  }

  /* ---------------- 組み立て ---------------- */
  function build() {
    const root = $('#tab-dict');
    U.clear(root);
    built = true;
    const total = L.all.length;
    el.q = h('input', { type: 'search', class: 'ttl', placeholder: 'リックを探す（名前・特徴・タグ：エンクロージャー、ペンタ、ブルース…）', 'aria-label': 'リックを検索', oninput: U.debounce(() => { D.q = el.q.value.trim(); D.limit = 24; renderList(); }, 200) });
    el.key = U.select(KEY_NAMES.map((n, i) => [i, n]), st().dictKey, v => { App.set({ dictKey: +v }, 'dict-key'); D.limit = 24; renderList(); }, { id: 'dictKey', 'aria-label': 'リックを書くキー（実音）' });
    el.level = U.seg([[0, 'すべて'], [1, 'Lv.1 やさしい'], [2, 'Lv.2'], [3, 'Lv.3 むずかしい']], D.level, v => { D.level = v; D.limit = 24; renderList(); }, '難しさ');
    el.degrees = U.switchEl('コードに対する度数を表示', D.degrees, v => { D.degrees = v; renderList(); }, '各音が、コードのルートから見て何度かを示します');
    el.concert = U.seg([[true, '実音'], [false, '楽器の楽譜']], st().concert, v => { App.set({ concert: v }, 'solo'); renderList(); }, '譜面の書き方');
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'card-h' }, h('h2', null, 'リック辞典'), h('span', { class: 'muted' }, '全 ' + total + ' 本')),
      h('p', { class: 'muted' }, 'コードの種類・進行ごとに、そのまま使えるリックを集めました。「▶」で伴奏つきで聴けます。ソロの自動作成も、ここから選んでいます。'),
      h('div', { class: 'row gap wrap' }, el.q),
      h('div', { class: 'fields mt' },
        U.field('書くキー（実音）', el.key, 'ここで選んだキーの ii–V–I などとして、楽譜と音が出ます'),
        U.field('難しさ', el.level), U.field('譜面の書き方', el.concert, '「楽器の楽譜」は、ソロの楽器（' + App.soloInstDef().jp + '）の移調譜です'), h('div', { class: 'field' }, el.degrees))));

    // 分類ボタン
    el.nav = h('div', { class: 'card dict-nav' });
    root.appendChild(el.nav);
    el.head = h('div', { class: 'card dict-head' });
    el.tags = h('div', { class: 'tagbar' });
    el.list = h('div', { class: 'licks', id: 'lickList' });
    el.more = h('div', { class: 'row center mt' });
    root.appendChild(h('div', { class: 'card' }, el.head, el.tags, el.list, el.more));
    renderNav();
  }
  function renderNav() {
    const nav = U.clear(el.nav);
    L.GROUPS.forEach(g => {
      const ids = Object.keys(L.CTX).filter(id => L.CTX[id].group === g.id && (L.byCtx[id] || []).length);
      if (!ids.length) return;
      const box = h('div', { class: 'ctx-group' }, h('h3', null, g.jp));
      const row = h('div', { class: 'ctx-row' });
      ids.forEach(id => {
        const n = L.byCtx[id].length;
        row.appendChild(h('button', { type: 'button', class: 'ctx-b', 'aria-pressed': String(D.ctx === id), data: { ctx: id }, onclick: () => { D.ctx = id; D.tag = ''; D.limit = 24; refreshNav(); renderList(); } }, short(L.CTX[id].jp), h('span', { class: 'n' }, String(n))));
      });
      box.appendChild(row); nav.appendChild(box);
    });
    nav.appendChild(h('div', { class: 'ctx-group' }, h('div', { class: 'ctx-row' }, h('button', { type: 'button', class: 'ctx-b all', 'aria-pressed': String(D.ctx === '*'), data: { ctx: '*' }, onclick: () => { D.ctx = '*'; D.tag = ''; D.limit = 24; refreshNav(); renderList(); } }, 'ぜんぶ（検索・タグで絞る）', h('span', { class: 'n' }, String(L.all.length))))));
  }
  function refreshNav() { $$('.ctx-b', el.nav).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ctx === D.ctx))); }

  /* ---------------- 一覧 ---------------- */
  function matches(l) {
    if (D.level && l.lvl !== D.level) return false;
    if (D.tag && l.tags.indexOf(D.tag) < 0) return false;
    if (D.q) {
      const hay = (l.name + ' ' + l.desc + ' ' + l.tags.join(' ') + ' ' + (L.CTX[l.ctx] ? L.CTX[l.ctx].jp : '')).toLowerCase();
      if (!D.q.toLowerCase().split(/\s+/).every(w => hay.indexOf(w) >= 0)) return false;
    }
    return true;
  }
  function renderList() {
    if (!built) return;
    dirty = false;
    const token = ++renderToken;
    const base = D.ctx === '*' ? L.all : (L.byCtx[D.ctx] || []);
    const ctxInfo = D.ctx === '*' ? null : L.CTX[D.ctx];
    // 見出し
    const head = U.clear(el.head);
    if (ctxInfo) {
      const refs = (L.byCtx[D.ctx][0] || { refSrc: [] }).refSrc;
      head.appendChild(h('div', { class: 'card-h' }, h('h2', null, short(ctxInfo.jp)), h('span', { class: 'muted' }, base.length + '本')));
      head.appendChild(h('p', { class: 'muted' }, ctxInfo.note));
    } else head.appendChild(h('div', { class: 'card-h' }, h('h2', null, 'ぜんぶのリック'), h('span', { class: 'muted' }, base.length + '本')));
    // タグ
    const counts = {};
    base.forEach(l => l.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    const tags = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, 'ja'));
    const tb = U.clear(el.tags);
    if (tags.length) {
      tb.appendChild(h('span', { class: 'muted small' }, '特徴で絞る：'));
      tags.slice(0, 24).forEach(t => tb.appendChild(h('button', { type: 'button', class: 'chip btnchip', 'aria-pressed': String(D.tag === t), onclick: () => { D.tag = D.tag === t ? '' : t; D.limit = 24; renderList(); } }, t + ' ' + counts[t])));
    }
    const list = base.filter(matches);
    const box = U.clear(el.list), more = U.clear(el.more);
    if (!list.length) { box.appendChild(h('p', { class: 'empty' }, 'あてはまるリックがありません。条件をゆるめてみてください。')); return; }
    const K = st().dictKey, shown = list.slice(0, D.limit);
    const width = Math.max(280, Math.min(640, (el.list.clientWidth || 600) - 4));
    // 重くならないよう、少しずつ描く
    let i = 0;
    const step = () => {
      if (token !== renderToken) return;
      const end = Math.min(shown.length, i + 8);
      for (; i < end; i++) box.appendChild(card(shown[i], K, width));
      if (i < shown.length) setTimeout(step, 0);
    };
    step();
    if (list.length > shown.length) more.appendChild(h('button', { type: 'button', class: 'btn', onclick: () => { D.limit += 24; renderList(); } }, 'もっと見る（残り ' + (list.length - shown.length) + '本）'));
  }
  function card(l, K, width) {
    const pl = place(l, K);
    const tags = h('div', { class: 'tags' }, h('span', { class: 'chip lvl' + l.lvl }, 'Lv.' + l.lvl));
    l.tags.forEach(t => tags.appendChild(h('button', { type: 'button', class: 'chip tag btnchip', 'aria-pressed': String(D.tag === t), title: 'この特徴で絞る', onclick: () => { D.tag = D.tag === t ? '' : t; D.limit = 24; renderList(); } }, t)));
    const playing = App.playKind === 'preview' && App.previewId === 'dict:' + l.id;
    return h('div', { class: 'lick', data: { id: l.id } },
      h('div', { class: 'lick-h' },
        h('button', { type: 'button', class: 'mini-play' + (playing ? ' on' : ''), 'aria-label': l.name + 'を聴く', onclick: () => playLick(l, K) }, '▶'),
        h('b', { class: 'lick-name' }, l.name),
        D.ctx === '*' ? h('span', { class: 'muted small' }, short(L.CTX[l.ctx].jp)) : null),
      tags,
      h('div', { class: 'mini-score', html: notation(l, pl, width) }),
      D.degrees ? degreeRows(l, pl) : null,
      App.lickDesc(l) ? h('p', { class: 'muted small' }, App.lickDesc(l)) : null);
  }

  /* ---------------- 外から開く ---------------- */
  App.openDict = function (ctx) {
    if (ctx && (L.CTX[ctx] || ctx === '*')) { D.ctx = ctx; D.tag = ''; D.q = ''; D.level = 0; D.limit = 24; if (el.q) el.q.value = ''; if (el.level) el.level.set(0); refreshNav(); }
    App.showTab('dict');
  };
  App.on('init', () => { build(); });
  App.on('tab', name => { if (name === 'dict') { if (el.key) el.key.value = String(st().dictKey); if (el.concert) el.concert.set(st().concert); refreshNav(); renderList(); } });
  App.on('settings', () => { dirty = true; });
  App.on('solo', () => { dirty = true; });
  App.on('playstate', () => { if (App.tab === 'dict') { $$('.lick', el.list).forEach(c => { const b = c.querySelector('.mini-play'); if (b) b.classList.toggle('on', App.playKind === 'preview' && App.previewId === 'dict:' + c.dataset.id); }); } });
})();
