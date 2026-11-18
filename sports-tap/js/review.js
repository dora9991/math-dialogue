/* スポーツ タップ記録 — 動画で場面を見返す（このアプリの中だけで。ほかのアプリはいらない）
   記録した場面（シュート・あとでチェック・フリーキック など）を、試合の動画から「前◯秒〜後◯秒」で切り出して再生する。

   ■ 動画
     ・この端末のカメラで撮影しながら記録した動画（livecam.js。IndexedDB にある）：録画を始めた時刻が分かるので、時刻あわせはいらない
         動画の時刻 ＝ 記録の t ＋（記録のスタート − 録画の始まり）秒
     ・あとで選んだ試合の動画のファイル：1か所だけ合わせる（動画の中で、記録のどれか（ふつうはキックオフ）の瞬間で止めて「ここ」）。
         合わせたずれは、ファイルの名前と大きさで覚えておく（game.syncs）。ファイルそのものは保存しない（開くたびに選ぶ）
   ■ 場面の長さ（前・後の秒数）：まとまりごとに選べる（種目の win。サッカーは シュート・ゴール 30 秒前〜5 秒後、あとでチェック 10 秒前〜10 秒後）
       shot：シュート・得点 / mark：あとでチェック（★） / other：そのほか（フリーキック・コーナーキック など）
     設定は種目ごとに S.prefs.sp[種目].win、再生の速さは S.prefs.rvSpeed */
(function (root) {
  'use strict';
  const ST = root.ST;
  const { h } = ST.ui;
  const SPEEDS = [0.5, 1, 1.5, 2, 4];
  const BEFORE = [5, 10, 15, 20, 30, 45, 60];
  const AFTER = [3, 5, 10, 15, 20, 30];
  const DEF_WIN = { shot: [10, 3], mark: [10, 10], other: [8, 3] };
  const GROUP_LABEL = { shot: 'シュート・得点', mark: 'あとでチェック（★）', other: 'そのほか' };

  function create(api) {
    const S = api.S;
    const R = { game: null, src: null, url: '', offset: null, filter: { types: null, teams: [true, true, true], players: [] }, playing: null, reel: null, ri: 0, raf: 0, el: null, winOpen: null };
    const narrow = () => !!(root.matchMedia && root.matchMedia('(max-width: 899px)').matches);

    const sport = () => ST.sportOf(R.game);
    const winOf = () => { const sp = sport(), pr = api.sprefs(sp.id); return Object.assign({}, DEF_WIN, sp.win || {}, pr.win || {}); };
    const groupOf = (d) => (d.kind === 'mark' ? 'mark' : d.shot || d.pts || d.so ? 'shot' : 'other');
    const groupLabel = (k) => (k === 'shot' && sport().id === 'soccer' ? 'シュート・ゴール' : GROUP_LABEL[k]);
    const speed = () => (SPEEDS.includes(S.prefs.rvSpeed) ? S.prefs.rvSpeed : 1);
    const camVideos = () => (R.game.videos || []).filter((v) => !v.gone && v.status !== 'recording');
    const fileKey = (f) => `${f.name}|${f.size}`;
    const isCard = (e, d) => d.kind === 'card' || e.card === 'y' || e.card === 'r';

    /* 場面の一覧（いまの動画・絞り込み・長さで）。[{ e, d, grp, v（動画の時刻）, t0, t1, label, when }] */
    function scenes(all) {
      if (R.offset == null) return [];
      const sp = sport(), W = winOf();
      const dur = R.el && R.el.video.duration > 0 ? R.el.video.duration : Infinity;
      const f = R.filter;
      const out = [];
      ST.sorted(R.game).forEach((e) => {
        const d = sp.TYPE[e.type];
        if (!d || d.meta || d.kind === 'adj') return;
        const v = e.t + R.offset;
        if (v < 0 || v > dur) return;
        if (!all) {
          if (f.types && !f.types.includes(e.type) && !(f.types.includes('*card') && isCard(e, d))) return;
          const tk = e.team === 0 || e.team === 1 ? e.team : 2;
          if (f.teams[tk] === false) return;
          if (f.players.length && !(e.team != null && e.no != null && f.players.includes(e.team + ':' + e.no))) return;
        }
        const grp = groupOf(d), w = W[grp] || W.other;
        out.push({ e, d, grp, v, t0: Math.max(0, v - w[0]), t1: Math.min(dur, v + w[1]), label: ST.eventText(R.game, e, true), when: api.timeText(e) });
      });
      return out;
    }
    /* 続けて再生の区間：重なる場面は1つにつなぐ（同じところを2回見せない） */
    function reelOf(list) {
      const out = [];
      list.slice().sort((a, b) => a.t0 - b.t0).forEach((c) => {
        const prev = out[out.length - 1];
        if (prev && c.t0 <= prev.t1 + 0.3) { prev.t1 = Math.max(prev.t1, c.t1); prev.items.push(c); return; }
        out.push({ t0: c.t0, t1: c.t1, items: [c] });
      });
      return out;
    }

    /* ---------- 動画 ---------- */
    async function useCam(v) {
      stop();
      let f = null;
      try { f = await ST.vstore.file(v.vid); } catch (e) { f = null; }
      if (!f) { ST.ui.toast('この動画は、この端末にはもうありません', 'err', 5000); return; }
      setSrc({ kind: 'cam', vid: v.vid, n: v.n, name: v.name }, f, (R.game.startedAt - v.startedAt) / 1000);
    }
    function useFile(f) {
      stop();
      const key = fileKey(f);
      const off = R.game.syncs && isFinite(R.game.syncs[key]) ? R.game.syncs[key] : null;
      setSrc({ kind: 'file', key, name: f.name }, f, off);
    }
    function setSrc(src, blob, offset) {
      if (R.url) URL.revokeObjectURL(R.url);
      R.url = URL.createObjectURL(blob);
      R.src = src;
      R.offset = offset;
      R.el.video.src = R.url;
      R.el.video.playbackRate = speed();
      R.el.video.addEventListener('loadedmetadata', () => { R.el.video.playbackRate = speed(); draw(); }, { once: true });
      draw();
    }
    function pickFile() {
      const inp = h('input', { type: 'file', accept: 'video/*,.mp4,.mov,.m4v,.webm', style: { display: 'none' } });
      inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) useFile(f); });
      document.body.appendChild(inp);
      inp.click();
    }
    /* いまの映像の位置を、記録 e の瞬間にする（あとで選んだ動画の時刻あわせ） */
    function syncAt(e) {
      const v = R.el.video.currentTime || 0;
      R.offset = Math.round((v - e.t) * 100) / 100;
      if (R.src && R.src.kind === 'file') { R.game.syncs = R.game.syncs || {}; R.game.syncs[R.src.key] = R.offset; api.save(); }
      ST.ui.toast(`合わせました：記録の ${ST.fmtTime(e.t)}（${ST.eventText(R.game, e, true)}）＝ 動画の ${ST.fmtTime(v, 1)}`, 'ok', 4000);
      draw();
    }
    function nudge(d) {
      if (R.offset == null) return;
      R.offset = Math.round((R.offset + d) * 100) / 100;
      if (R.src && R.src.kind === 'file') { R.game.syncs = R.game.syncs || {}; R.game.syncs[R.src.key] = R.offset; api.save(); }
      draw();
    }

    /* ---------- 再生 ---------- */
    function stop() {
      cancelAnimationFrame(R.raf);
      R.playing = null; R.reel = null;
      if (R.el && R.el.video && !R.el.video.paused) R.el.video.pause();
    }
    function watch() {
      cancelAnimationFrame(R.raf);
      const loop = () => {
        const vd = R.el && R.el.video;
        if (!vd || !R.playing) return;
        if (vd.currentTime >= R.playing.t1 - 0.02 || vd.ended) {
          if (R.reel && R.ri + 1 < R.reel.length) { R.ri++; go(R.reel[R.ri]); return; }
          vd.pause();
          R.playing = null; R.reel = null;
          drawNow();
          return;
        }
        drawNow();
        R.raf = requestAnimationFrame(loop);
      };
      R.raf = requestAnimationFrame(loop);
    }
    function go(seg) {
      const vd = R.el.video;
      R.playing = seg;
      vd.currentTime = seg.t0;
      vd.playbackRate = speed();
      const p = vd.play();
      if (p && p.catch) p.catch(() => {});
      watch();
      draw();
      // スマホ縦：一覧を下に見ていたら、映像が見えるところまで戻す
      const r = vd.getBoundingClientRect(), top = (document.querySelector('.hbar') || { offsetHeight: 0 }).offsetHeight;
      if (r.top < top || r.bottom > root.innerHeight) root.scrollTo({ top: Math.max(0, root.scrollY + r.top - top - 8), behavior: 'smooth' });
    }
    function playOne(c) { R.reel = null; go({ t0: c.t0, t1: c.t1, items: [c] }); }
    function playAll() {
      const list = reelOf(scenes());
      if (!list.length) { ST.ui.toast('場面がありません（絞り込み・動画を確かめてください）', 'warn'); return; }
      R.reel = list; R.ri = 0;
      go(list[0]);
    }
    function step(d) {
      if (R.reel) { const i = ST.clamp(R.ri + d, 0, R.reel.length - 1); if (i !== R.ri) { R.ri = i; go(R.reel[i]); } return; }
      const list = scenes();
      if (!list.length) return;
      const cur = R.playing ? R.playing.items[0] : null;
      let i = cur ? list.findIndex((c) => c.e.id === cur.e.id) : -1;
      i = ST.clamp(i + d, 0, list.length - 1);
      playOne(list[i]);
    }
    function setSpeed(x) { S.prefs.rvSpeed = x; api.savePrefs(); if (R.el) R.el.video.playbackRate = x; draw(); }
    function setWin(grp, k, v) { const sp = sport(), pr = api.sprefs(sp.id); const W = winOf(); pr.win = Object.assign({}, pr.win || {}, { [grp]: k === 0 ? [v, W[grp][1]] : [W[grp][0], v] }); api.savePrefs(); draw(); }

    /* ---------- 画面 ---------- */
    function render(game, vid) {
      R.game = game;
      R.src = null; R.offset = null;
      R.filter = { types: null, teams: [true, true, true], players: [] };
      R.winOpen = null;
      document.body.dataset.view = 'review';
      const V = document.querySelector('#view');
      V.innerHTML = '';
      const video = h('video', { class: 'rv-video', playsinline: true, preload: 'auto', controls: true });
      video.playsInline = true;
      const label = h('div', { class: 'rv-label', id: 'rvLabel' });
      const ctl = h('div', { class: 'rv-ctl', id: 'rvCtl' });
      const srcBox = h('div', { class: 'rv-src', id: 'rvSrc' });
      const side = h('div', { class: 'rv-side', id: 'rvSide' });
      const back = h('button', { class: 'btn', id: 'btnRvBack', onclick: () => { close(); api.back(); } }, '← 記録へ戻る');
      V.append(
        h('header', { class: 'hbar' }, back, h('b', { class: 'htitle' }, `${sport().icon} 場面を見返す`), h('span', { class: 'spacer' })),
        h('main', { class: 'rv' },
          h('section', { class: 'rv-player' }, h('div', { class: 'rv-vwrap' }, video, label), ctl, srcBox),
          side));
      R.el = { video, label, ctl, srcBox, side };
      video.addEventListener('pause', () => drawNow());
      video.addEventListener('play', () => drawNow());
      video.addEventListener('ratechange', () => { if (Math.abs(video.playbackRate - speed()) > 0.01 && R.playing) video.playbackRate = speed(); });
      const cams = camVideos();
      const first = vid ? cams.find((v) => v.vid === vid) : cams[0];
      if (first) useCam(first); else draw();
    }
    function close() { stop(); if (R.url) { URL.revokeObjectURL(R.url); R.url = ''; } if (R.el) { R.el.video.removeAttribute('src'); R.el.video.load(); } R.el = null; }
    /* 再生中に変わるところだけ（場面の名前・ボタンの印） */
    function drawNow() {
      if (!R.el) return;
      const p = R.playing;
      const it = p ? p.items[0] : null;
      R.el.label.hidden = !it;
      if (it) {
        const n = R.reel ? `${R.ri + 1}/${R.reel.length}` : '';
        const t = p.items.length > 1 ? `${it.label} ほか${p.items.length - 1}` : it.label;
        const s = `${n ? '▶ ' + n + '　' : '▶ '}${t}（${it.when}）`;
        if (R.el.label.textContent !== s) R.el.label.textContent = s;
      }
      const pb = R.el.ctl.querySelector('#btnRvPlay');
      if (pb) pb.textContent = R.el.video.paused ? '▶' : '⏸';
      R.el.side.querySelectorAll('.rvrow').forEach((row) => row.classList.toggle('playing', !!(p && p.items.some((c) => c.e.id === row.dataset.id))));
    }
    function draw() {
      if (!R.el) return;
      const g = R.game, sp = sport(), E = R.el;
      // 操作
      const seek = (d) => { const vd = E.video; vd.currentTime = Math.max(0, (vd.currentTime || 0) + d); };
      E.ctl.innerHTML = '';
      E.ctl.append(
        h('div', { class: 'row rvbtns' },
          h('button', { class: 'btn', id: 'btnRvPrev', title: '前の場面', onclick: () => step(-1) }, '⏮'),
          h('button', { class: 'btn', onclick: () => seek(-10) }, '−10秒'),
          h('button', { class: 'btn', onclick: () => seek(-5) }, '−5秒'),
          h('button', { class: 'btn primary rvplay', id: 'btnRvPlay', onclick: () => { const vd = E.video; if (vd.paused) { vd.playbackRate = speed(); vd.play().catch(() => {}); } else { vd.pause(); stop(); } } }, '▶'),
          h('button', { class: 'btn', onclick: () => seek(5) }, '+5秒'),
          h('button', { class: 'btn', onclick: () => seek(10) }, '+10秒'),
          h('button', { class: 'btn', id: 'btnRvNext', title: '次の場面', onclick: () => step(1) }, '⏭')),
        h('div', { class: 'row rvspeed', id: 'rvSpeed' }, h('b', null, '速さ'),
          SPEEDS.map((x) => h('button', { class: 'btn small' + (speed() === x ? ' on' : ''), dataset: { speed: String(x) }, 'aria-pressed': String(speed() === x), onclick: () => setSpeed(x) }, x + '倍'))));
      // 動画
      const cams = camVideos();
      E.srcBox.innerHTML = '';
      E.srcBox.append(h('div', { class: 'row' }, h('b', null, '動画'),
        cams.map((v) => h('button', { class: 'btn small' + (R.src && R.src.vid === v.vid ? ' on' : ''), dataset: { rvvid: v.vid }, onclick: () => useCam(v) }, `📹 動画${v.n}（${ST.fmtTime(v.duration || 0)}）`)),
        h('button', { class: 'btn small' + (R.src && R.src.kind === 'file' ? ' on' : ''), id: 'btnRvFile', onclick: pickFile }, R.src && R.src.kind === 'file' ? `📂 ${R.src.name}` : '📂 試合の動画を選ぶ')));
      if (!R.src) E.srcBox.append(h('p', { class: 'note' }, cams.length ? '' : 'この試合は撮影しながら記録していません。スマホ・ビデオカメラで撮った試合の動画を選ぶと、1か所だけ時刻を合わせて見返せます。'));
      else if (R.src.kind === 'cam') E.srcBox.append(h('p', { class: 'note ok', id: 'rvSyncOk' }, `✓ 撮影しながら記録した動画なので、時刻はぴったり合っています（記録の 0:00 ＝ 動画の ${ST.fmtTime(Math.max(0, R.offset), 1)}）`));
      else if (R.offset != null) E.srcBox.append(h('div', { class: 'rv-sync ok', id: 'rvSyncOk' }, h('p', { class: 'note' }, `✓ 時刻を合わせています（記録の 0:00 ＝ 動画の ${ST.fmtTime(Math.max(0, R.offset), 1)}）。ずれていたら：`),
        h('div', { class: 'row' }, [-1, -0.5, 0.5, 1].map((d) => h('button', { class: 'btn small', dataset: { nudge: String(d) }, onclick: () => nudge(d) }, (d > 0 ? '+' : '−') + Math.abs(d) + '秒')),
          h('button', { class: 'btn small', onclick: () => { R.offset = null; draw(); } }, '合わせ直す'))));
      else E.srcBox.append(syncCard());
      // 右側：絞り込み・長さ・一覧
      E.side.innerHTML = '';
      if (R.offset == null) { E.side.append(h('p', { class: 'note' }, R.src ? '時刻を合わせると、記録した場面が並びます。' : '動画を選ぶと、記録した場面が並びます。')); drawNow(); return; }
      const all = scenes(true);
      const list = scenes();
      E.side.append(filters(all), winBox(), h('button', { class: 'btn primary huge', id: 'btnRvAll', disabled: !list.length, onclick: playAll }, `▶ 続けて再生（${list.length}場面）`));
      E.side.append(list.length ? h('div', { class: 'rvlist' }, list.map((c, i) => h('button', { class: 'rvrow', dataset: { id: c.e.id }, style: { '--tc': c.e.team === 0 || c.e.team === 1 ? g.teams[c.e.team].color : 'var(--line2)' }, onclick: () => playOne(c) },
        h('span', { class: 'ix' }, String(i + 1)), h('span', { class: 'rvt' }, h('b', null, c.label), h('small', null, `${c.when}・動画 ${ST.fmtTime(c.v)}（${ST.fmtTime(c.t0)}〜${ST.fmtTime(c.t1)}）`)), h('i', { class: 'rvgo' }, '▶'))))
        : h('p', { class: 'note' }, all.length ? 'この絞り込みの場面はありません。' : 'この動画の中に、記録した場面がありません（動画と記録の時刻を確かめてください）。'));
      drawNow();
    }
    /* あとで選んだ動画の時刻あわせ */
    function syncCard() {
      const g = R.game;
      const cand = ST.sorted(g).filter((e) => { const d = ST.typeOf(g, e.type) || {}; return d.kind !== 'adj'; });
      const startEv = cand.find((e) => e.t === 0) || cand[0];
      const sel = h('select', { class: 'rvsel', id: 'rvSyncSel' }, cand.slice(0, 300).map((e) => h('option', { value: e.id, selected: e === startEv }, `${ST.fmtTime(e.t)}　${ST.eventText(g, e, true)}${e.t === 0 ? '（スタート）' : ''}`)));
      return h('div', { class: 'rv-sync', id: 'rvSync' },
        h('b', null, '時刻を合わせる（1か所だけ）'),
        h('p', { class: 'note' }, `動画を、記録のどれかの瞬間（ふつうは${sport().start || 'スタート'}）で止めてから、その記録を選んで「ここに合わせる」。ほかの場面は全部、同じだけずらして並べます。`),
        h('div', { class: 'row' }, sel, h('button', { class: 'btn primary', id: 'btnRvSync', onclick: () => { const e = ST.findEvent(g, sel.value); if (e) syncAt(e); } }, 'いまの位置に合わせる')));
    }
    function filters(all) {
      const g = R.game, sp = sport(), f = R.filter;
      const count = (fn) => all.filter(fn).length;
      const types = [];
      all.forEach((c) => { if (!types.includes(c.e.type)) types.push(c.e.type); });
      const anyCard = all.some((c) => isCard(c.e, c.d));
      const tchip = (id, lab, n) => h('button', { class: 'fchip' + ((f.types == null ? id === 'all' : f.types.includes(id)) ? ' on' : ''), dataset: { rvtype: id }, onclick: () => {
        if (id === 'all') f.types = null;
        else { const cur = f.types || []; f.types = cur.includes(id) ? cur.filter((x) => x !== id) : cur.concat([id]); if (!f.types.length) f.types = null; }
        stop(); draw();
      } }, lab, n != null ? h('small', null, String(n)) : null);
      const box = h('div', { class: 'rv-filter' });
      box.append(h('div', { class: 'frow' }, h('span', { class: 'flab' }, '場面'),
        tchip('all', 'すべて', all.length),
        types.map((t) => { const d = sp.TYPE[t]; return tchip(t, d.short || d.label.replace(/（.*$/, ''), count((c) => c.e.type === t)); }),
        anyCard ? tchip('*card', 'カード', count((c) => isCard(c.e, c.d))) : null));
      if (sp.hasTeams) {
        box.append(h('div', { class: 'frow' }, h('span', { class: 'flab' }, 'チーム'),
          [0, 1].map((tm) => h('button', { class: 'fchip' + (f.teams[tm] !== false ? ' on' : ''), dataset: { rvteam: String(tm) }, onclick: () => { f.teams[tm] = f.teams[tm] === false; stop(); draw(); } }, h('i', { class: 'chip', style: { background: g.teams[tm].color } }), ST.teamName(g, tm))),
          all.some((c) => c.e.team == null) ? h('button', { class: 'fchip' + (f.teams[2] !== false ? ' on' : ''), dataset: { rvteam: '2' }, onclick: () => { f.teams[2] = f.teams[2] === false; stop(); draw(); } }, 'チームなし') : null));
        const ps = [];
        all.forEach((c) => { if (c.e.team != null && c.e.no != null) { const k = c.e.team + ':' + c.e.no; if (!ps.includes(k)) ps.push(k); } });
        ps.sort((a, b) => (Number(a.split(':')[0]) - Number(b.split(':')[0])) || ST.cmpNo(a.split(':')[1], b.split(':')[1]));
        if (ps.length) box.append(h('div', { class: 'frow' }, h('span', { class: 'flab' }, '選手'),
          h('button', { class: 'fchip' + (!f.players.length ? ' on' : ''), dataset: { rvplayer: 'all' }, onclick: () => { f.players = []; stop(); draw(); } }, '全員'),
          ps.map((k) => { const [tm, no] = k.split(':'); const nm = ST.playerName(g, Number(tm), no); return h('button', { class: 'fchip' + (f.players.includes(k) ? ' on' : ''), dataset: { rvplayer: k }, onclick: () => { f.players = f.players.includes(k) ? f.players.filter((x) => x !== k) : f.players.concat([k]); stop(); draw(); } },
            h('i', { class: 'chip', style: { background: g.teams[Number(tm)].color } }), '#' + no + (nm ? ' ' + nm : ''), h('small', null, String(count((c) => c.e.team === Number(tm) && c.e.no === no)))); })));
      }
      return box;
    }
    /* 場面の長さ（前・後の秒数） */
    function winBox() {
      const W = winOf();
      const groups = ['shot', 'mark', 'other'].filter((k) => scenes(true).some((c) => c.grp === k));
      // スマホ縦では、はじめはたたむ（いまの秒数は見出しに出す）。開け閉めは、選び直しても覚えておく
      if (R.winOpen == null) R.winOpen = !narrow();
      const now = groups.map((k) => `${groupLabel(k).replace(/（.*$/, '')} ${W[k][0]}秒前〜${W[k][1]}秒後`).join('・');
      const box = h('details', { class: 'rv-win', id: 'rvWin', open: R.winOpen }, h('summary', null, h('b', null, '場面の長さ（前と後の秒数）'), h('small', { class: 'winnow' }, now)));
      box.addEventListener('toggle', () => { R.winOpen = box.open; });
      groups.forEach((k) => {
        box.append(h('div', { class: 'winrow', dataset: { grp: k } }, h('b', null, groupLabel(k)),
          h('div', { class: 'row' }, h('span', { class: 'note' }, '前'), BEFORE.map((x) => h('button', { class: 'btn small' + (W[k][0] === x ? ' on' : ''), dataset: { wb: k + ':' + x }, onclick: () => setWin(k, 0, x) }, x + '秒'))),
          h('div', { class: 'row' }, h('span', { class: 'note' }, '後'), AFTER.map((x) => h('button', { class: 'btn small' + (W[k][1] === x ? ' on' : ''), dataset: { wa: k + ':' + x }, onclick: () => setWin(k, 1, x) }, x + '秒')))));
      });
      return box;
    }

    return { render, close, scenes, reelOf, winOf, setSpeed, setWin, playAll, playOne, syncAt, nudge, useFile, R };
  }

  ST.review = { create, SPEEDS, DEF_WIN };
})(typeof window !== 'undefined' ? window : globalThis);
