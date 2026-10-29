/* スポーツ タップ記録 — テニスの画面（試合の準備・記録の画面・集計）
   上の帯：時計・いまのセットと呼び名（デュース・アドバンテージ・タイブレーク …）・メニュー
   スコア：側ごとに、セットごとのゲーム数と、いまのゲームのポイント（大きく）。● がサーブする側
   2つの側：選手の行（エース・ウィナー・ミス・DF。設定でフォルト）と、側の「ポイント」（理由なし）。選手の行は少ない（1〜2行）ので、ボタンは大きく
   下の帯：★ あとで見る・いま記録したもの（そのあとのポイント）・取り消す */
(function (root) {
  'use strict';
  const ST = root.ST;
  const { h } = ST.ui;
  const SP = () => ST.SPORTS.tennis;

  /* ========== 試合の準備 ========== */
  /* 選手の人数をそろえる（シングルス 1人・ダブルス 2人。no は '1'・'2'） */
  function normalize(T) {
    const n = (T.opts || {}).fmt === 'double' ? 2 : 1;
    T.teams.forEach((t) => {
      const old = t.players || [];
      t.players = Array.from({ length: n }, (_, i) => ({ no: String(i + 1), name: ((old.find((p) => p.no === String(i + 1)) || old[i] || {}).name || '').trim().slice(0, 12) }));
    });
    T.serve = SP().cleanServe(T.serve);
    if (n === 1) T.serve.p = ['1', '1'];
  }
  function setup(ctx, T, o) {
    const sp = ctx.sport;
    normalize(T);
    const box = h('div', { class: 'tn-setup' });
    const changed = () => { if (o && o.changed) o.changed(); };
    function render() {
      box.innerHTML = '';
      box.append(
        h('p', { class: 'lead' }, '選手の名前（なくても大丈夫）と、最初にサーブする人を選びます。下の「試合の形式」で、硬式・ソフトテニス、シングルス・ダブルスを選べます。'),
        h('div', { class: 'teams2' }, [0, 1].map(sideCard)),
        serveCard());
    }
    function sideCard(i) {
      const t = T.teams[i];
      const dbl = T.opts.fmt === 'double', soft = T.opts.kind === 'soft';
      const card = h('section', { class: 'card teamcard tn-side', id: 'tside' + i, style: { '--tc': t.color, '--tink': ST.inkOn(t.color) } });
      const head = h('b', null, '');
      const label = () => { head.textContent = sp.sideName({ teams: T.teams, opts: T.opts }, i); };
      label();
      card.append(h('div', { class: 'tc-head' }, h('span', { class: 'tc-band' }, i ? '相手の側' : '自分の側'), head));
      const saved = ST.store.teams('tennis').filter((x) => (x.players || []).length && x.name !== t.name);
      if (saved.length) {
        card.append(h('div', { class: 'savedrow' }, h('span', { class: 'note' }, '前の選手から：'),
          saved.slice(0, 8).map((x) => h('button', { class: 'btn small chipbtn', onclick: () => {
            Object.assign(t, { name: x.name, color: x.color, colorName: x.colorName, players: (x.players || []).map((p) => ({ no: p.no, name: p.name })) });
            normalize(T); changed(); render();
          } }, h('i', { class: 'chip', style: { background: x.color } }), x.name, h('small', null, ' ' + (x.players || []).map((p) => p.name).filter(Boolean).join('・'))))));
      }
      t.players.forEach((p, k) => {
        card.append(h('label', { class: 'field' }, h('span', null, dbl ? `${k + 1}人目の名前${soft ? (k ? '（後衛 など）' : '（前衛 など）') : ''}` : '選手の名前'),
          h('input', { type: 'text', class: 'tpname', dataset: { side: i, no: p.no }, maxlength: 12, placeholder: '名前・ニックネーム（なくてもOK）', value: p.name || '',
            onchange: (e) => { p.name = e.target.value.trim().slice(0, 12); changed(); label(); refreshServe(); } })));
      });
      card.append(h('label', { class: 'field' }, h('span', null, '学校・チーム名（なくてもOK）'),
        h('input', { type: 'text', class: 'tname', maxlength: 20, placeholder: i ? '例：○○中' : '例：致遠館', value: t.name || '',
          onchange: (e) => { t.name = e.target.value.trim(); changed(); label(); refreshServe(); } })));
      const sw = h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': '色' });
      ST.COLORS.forEach((c) => {
        const on = t.color.toLowerCase() === c.hex.toLowerCase();
        sw.append(h('button', { class: 'sw' + (on ? ' on' : ''), style: { background: c.hex }, title: c.name, 'aria-label': c.name, role: 'radio', 'aria-checked': on ? 'true' : 'false', dataset: { color: c.name },
          onclick: () => { t.color = c.hex; t.colorName = c.name; changed(); render(); } }));
      });
      card.append(h('div', { class: 'field' }, h('span', null, `色（画面での見分け）：${t.colorName}`), sw));
      if (T.teams[0].color.toLowerCase() === T.teams[1].color.toLowerCase()) card.append(h('p', { class: 'note warn' }, '⚠ 自分と相手が同じ色です。見分けやすいように、どちらかを変えてください。'));
      return card;
    }
    let serveBox = null;
    function serveCard() {
      serveBox = h('section', { class: 'card tn-serve', id: 'serveCard' });
      fillServe();
      return serveBox;
    }
    /* 名前を変えたとき：最初のサーブのボタンを作り直さず、名前の文字だけを書き換える
       （名前の欄からボタンへ指を動かした瞬間に作り直すと、そのボタンのタップが消えてしまうため） */
    function refreshServe() {
      if (!serveBox) return;
      const g = { teams: T.teams, opts: T.opts };
      serveBox.querySelectorAll('[data-lab]').forEach((el) => {
        const [s, no] = el.dataset.lab.split(':');
        el.textContent = no ? sp.pName(g, Number(s), no) : sp.sideName(g, Number(s));
      });
    }
    function fillServe() {
      const g = { teams: T.teams, opts: T.opts };
      const dbl = T.opts.fmt === 'double', soft = T.opts.kind === 'soft';
      serveBox.innerHTML = '';
      serveBox.append(h('h2', null, '最初のサーブ'));
      const pick = (side, no) => { T.serve.side = side; if (no) T.serve.p[side] = no; changed(); fillServe(); };
      const btn = (side, no, label) => h('button', { class: 'btn' + (T.serve.side === side && (!no || T.serve.p[side] === no) ? ' on' : ''), dataset: { serve: side + ':' + (no || '') }, onclick: () => pick(side, no) },
        h('i', { class: 'chip', style: { background: T.teams[side].color } }), h('span', { dataset: { lab: side + ':' + (no || '') } }, label));
      if (dbl && !soft) {
        serveBox.append(h('div', { class: 'row' }, [0, 1].map((s) => T.teams[s].players.map((p) => btn(s, p.no, sp.pName(g, s, p.no))))));
        const other = 1 - T.serve.side;
        serveBox.append(h('div', { class: 'field' }, h('span', null, h('span', { dataset: { lab: other + ':' } }, sp.sideName(g, other)), 'の側で、最初にサーブする人'),
          h('div', { class: 'row' }, T.teams[other].players.map((p) => h('button', { class: 'btn small' + (T.serve.p[other] === p.no ? ' on' : ''), dataset: { serve2: p.no }, onclick: () => { T.serve.p[other] = p.no; changed(); fillServe(); } }, h('span', { dataset: { lab: other + ':' + p.no } }, sp.pName(g, other, p.no)))))));
        serveBox.append(h('p', { class: 'note' }, 'サーブする人は、その側のサービスゲームごとに交代する目安で出します（セットの途中で順番を変えたときは、目安と違うことがあります）。'));
      } else {
        serveBox.append(h('div', { class: 'row' }, [0, 1].map((s) => btn(s, null, sp.sideName(g, s)))));
        serveBox.append(h('p', { class: 'note' }, '最初のゲームでサーブする側。そのあとは、ゲームごとに自動で交代します。'));
      }
    }
    render();
    // 形式（シングルス・ダブルス・硬式・ソフトテニス）を変えたら、選手の欄を作り直す
    sp.onOpts = (T2, key) => { if (T2 !== T) return; if (key === 'fmt' || key === 'kind') { normalize(T); changed(); render(); } };
    // 「試合の形式」の欄を、選手の欄より上へ（シングルス・ダブルスを先に選べるように）
    Promise.resolve().then(() => { const oc = document.getElementById('optsCard'); if (oc && box.parentNode && oc.parentNode === box.parentNode) box.parentNode.insertBefore(oc, box); });
    return box;
  }

  /* ========== 記録の画面 ========== */
  function build(ctx) {
    const g = ctx.game, sp = ctx.sport;
    const L = { btns: [], sides: [] };
    const clock = ctx.ui.clockBtn();
    const startB = ctx.ui.startBtn();
    L.phase = h('small', { class: 'tphase' }, '');
    L.call = h('b', { class: 'tcallv', id: 'tCall' }, '');
    const bar = h('header', { class: 'lbar' }, clock.el, startB.el, h('div', { class: 'tcall', 'aria-live': 'polite' }, L.phase, L.call), ctx.ui.menuBtn());
    // スコア（側ごとの行：サーブの印・名前・セットごとのゲーム・いまのポイント）
    L.board = h('div', { class: 'tboard', id: 'tBoard', role: 'group', 'aria-label': 'スコア' });
    L.brows = [0, 1].map((s) => {
      const dot = h('i', { class: 'tbdot', 'aria-hidden': 'true' });
      const name = h('span', { class: 'tbname' }, h('i', { class: 'chip', style: { background: g.teams[s].color } }), h('span', { class: 'tbn' }, sp.sideName(g, s)));
      const sets = h('span', { class: 'tbsets' });
      const pt = h('b', { class: 'tbpt', id: 'tPt' + s, style: { '--tc': g.teams[s].color, '--tink': ST.inkOn(g.teams[s].color) } }, '0');
      const row = h('div', { class: 'tbrow', dataset: { side: s } }, dot, name, sets, pt);
      L.board.append(row);
      return { row, dot, sets, pt };
    });
    const types = () => sp.base.concat(isOn(ctx.sprefs, 'flt') ? ['flt'] : []);
    const panels = L.panelsEl = h('main', { class: 'tpanels' }, [0, 1].map(buildSide));
    function buildSide(s) {
      const t = g.teams[s];
      const tsv = h('span', { class: 'tsv' }, '🎾 サーブ');
      const tw = h('span', { class: 'tsw' }, '');
      const body = h('div', { class: 'tsbody' });
      const sec = h('section', { class: 'tside', id: 'tside' + s, dataset: { side: s }, style: { '--tc': t.color, '--tink': ST.inkOn(t.color) } },
        h('div', { class: 'tshead' }, h('b', { class: 'tsname' }, sp.sideName(g, s)), tsv, tw), body);
      const ts = types();
      t.players.forEach((p) => {
        const row = h('div', { class: 'tprow', dataset: { no: p.no }, style: { '--tk': ts.length } }, h('div', { class: 'tpn' }, h('b', null, sp.pName(g, s, p.no))));
        ts.forEach((type) => row.append(btn(s, p.no, type)));
        body.append(row);
      });
      const prow = h('div', { class: 'tprow tptrow' }, btn(s, null, 'pt'));
      body.append(prow);
      L.sides[s] = { sec, tsv, tw };
      return sec;
    }
    function btn(s, no, type) {
      const d = sp.TYPE[type];
      const cnt = h('i', { class: 'cnt', hidden: true });
      const label = type === 'pt' ? `${sp.sideName(g, s)} のポイント（理由なし）` : `${sp.pName(g, s, no)} ${d.label}`;
      const el = h('button', { class: 'tb k-' + d.kind + (d.kind === 'miss' ? ' miss' : '') + (type === 'pt' ? ' ptb' : ''), dataset: { type, no: no || '' }, style: { '--bc': d.col }, 'aria-label': label },
        h('b', null, type === 'pt' ? 'ポイント' : d.btn), h('small', null, type === 'pt' ? `${sp.sideName(g, s)}（理由なし）` : d.sub), cnt);
      L.btns.push({ side: s, type, key: s + ':' + (no || '') + ':' + type, el, cnt, serve: !!d.serve });
      return el;
    }
    const mark = (() => {
      const cnt = h('i', { class: 'cnt', hidden: true });
      const el = h('button', { class: 'gb k-mark', id: 'btn_mark', 'aria-label': '★ あとで見る（ポイントにはしない）', onclick: (e) => ctx.record({ type: 'mark', team: null, no: null }, e.currentTarget) }, h('b', null, '★'), h('small', null, 'あとで見る'), cnt);
      L.markCnt = cnt;
      return el;
    })();
    const rootEl = h('div', { class: 'live fam-tennis' }, bar, L.board, h('div', { class: 'stagewrap' }, panels, ctx.ui.cover()), ctx.ui.footer([mark]));
    rootEl.addEventListener('click', (e) => onClick(e));
    L.root = rootEl;

    function onClick(e) {
      const b = e.target.closest('button.tb');
      if (!b) return;
      const sec = b.closest('.tside');
      if (!sec) return;
      const s = Number(sec.dataset.side), type = b.dataset.type, no = b.dataset.no || null;
      const d = sp.TYPE[type];
      if (!ctx.canRecord()) return;
      const before = sp.replay(g);
      if (before.over && d.to) { ctx.say(`試合は決まっています（${sp.sideName(g, before.winner)}の勝ち）`, 'warn', 6000, { label: '試合を終える', onClick: ctx.endGame }); return; }
      if (d.serve && before.server !== s) { ctx.say(`サーブする側のボタンです（いまのサーブは ${sp.sideName(g, before.server)}）`, 'warn', 3500); return; }
      const nBefore = { k: before.k, sets: before.sets.length, over: before.over, tb: before.tb };
      if (ctx.S.msg && ctx.S.msg.kind === 'warn') ctx.S.msg = null;      // 前の注意（受ける側のエース など）は消して、いま記録したものを見せる
      const ev = ctx.record({ type, team: s, no }, b);
      if (!ev || !d.to) return;
      const st = sp.replay(g), sn = st.snap[ev.id];
      if (!sn || !sn.res) return;
      const names = [sp.sideName(g, 0), sp.sideName(g, 1)];
      const change = st.R.soft ? 'サイドチェンジ' : 'チェンジコート';
      if (sn.res.match) {
        ctx.feel('made');
        ctx.say(`試合終了：${names[sn.winner]}の勝ち（${st.R.soft ? `${st.g[0]}−${st.g[1]}` : sp.setsText(st)}）`, 'ok', 12000, { label: '試合を終える', onClick: ctx.endGame });
      } else if (sn.res.set) {
        const last = st.sets[st.sets.length - 1];
        const odd = (last.g[0] + last.g[1]) % 2 === 1 && !last.mtb;
        ctx.say(`第${st.sets.length}セット：${names[sn.winner]}（${sp.setText(last)}）${odd ? '・' + change : ''}${st.tb === 'mtb' ? '・次はマッチタイブレーク' : ''}`, 'ok', 6000);
      } else if (sn.res.game) {
        const odd = (st.g[0] + st.g[1]) % 2 === 1;
        ctx.say(`ゲーム：${names[sn.winner]}（${st.g[0]}−${st.g[1]}）${odd ? '・' + change : ''}${st.tb && !nBefore.tb ? '・' + sp.callText(st.R, [0, 0], st.tb, names) : ''}`, 'ok', 4000);
      } else if (st.tb && (st.p[0] + st.p[1]) % 6 === 0) {
        ctx.say(`${sp.pointText(st.R, st.p, st.tb)}・${change}`, 'ok', 3500);
      }
    }

    function layout() {
      if (!rootEl.isConnected) return;
      rootEl.classList.toggle('short', (rootEl.clientHeight || root.innerHeight) < 430);
      const W = panels.clientWidth, H = panels.clientHeight;
      const wide = W > H * 1.05;
      panels.classList.toggle('wide', wide);
      const rows = g.teams[0].players.length + 0.75;
      const sideW = wide ? (W - 14) / 2 : W - 8;
      const sideH = wide ? H - 4 : (H - 10) / 2;
      const head = 26;
      const rowH = Math.min(190, (sideH - head - 8 - (rows - 1) * 4) / rows);
      const k = types().length;
      const nw = Math.round(ST.clamp(sideW * 0.17, 56, 130));
      const bw = (sideW - 8 - nw - k * 4) / k;
      const tf = Math.round(ST.clamp(Math.min(rowH * 0.34, (bw - 8) / 4.3), 13, 30));
      panels.style.setProperty('--tf', tf + 'px');
      panels.style.setProperty('--tnw', nw + 'px');
      panels.classList.toggle('lowrow', rowH < 52);
    }
    function isOn(pr, key) { const r = (pr && pr.rows) || {}; return !!r[key]; }

    let lastClock = '';
    function tick() {
      const s = ST.fmtTime(ctx.elapsed());
      if (s !== lastClock) { lastClock = s; clock.set(s); }
    }
    function update() {
      startB.update();
      lastClock = '';
      tick();
      const st = sp.replay(g);
      const names = [sp.sideName(g, 0), sp.sideName(g, 1)];
      const started = !!g.startedAt;
      // 上の帯：いまのセット・呼び名（なければ、サーブする人）
      L.phase.textContent = st.over ? '試合終了' : st.R.soft ? `${st.R.matchGames}ゲームマッチ` : `第${st.sets.length + 1}セット${st.R.sets > 1 ? `（${st.R.sets}セットマッチ）` : ''}`;
      const call = st.over ? `${names[st.winner]}の勝ち` : sp.callText(st.R, st.p, st.tb, names) || (st.serverNo ? `サーブ：${sp.pName(g, st.server, st.serverNo)}` : `サーブ：${names[st.server]}`);
      L.call.textContent = call;
      L.call.classList.toggle('hot', !st.over && /デュース|アドバンテージ|デサイディング/.test(call));
      // スコア
      const cells = sp.pointCells(st.R, st.p, st.tb);
      [0, 1].forEach((s) => {
        const B = L.brows[s];
        B.row.classList.toggle('serving', !st.over && st.server === s);
        B.row.classList.toggle('winner', st.over && st.winner === s);
        B.sets.innerHTML = '';
        if (st.R.soft) B.sets.append(h('span', { class: 'tbset cur' }, String(st.g[s])));
        else {
          st.sets.forEach((x) => {
            const won = x.g[s] > x.g[1 - s];
            B.sets.append(h('span', { class: 'tbset' + (won ? ' won' : '') }, x.mtb ? String(x.tb[s]) : String(x.g[s]), x.tb && !x.mtb && !won ? h('sup', null, String(x.tb[s])) : null));
          });
          if (!st.over) B.sets.append(h('span', { class: 'tbset cur' }, String(st.g[s])));
        }
        B.pt.textContent = st.over ? (st.winner === s ? '勝ち' : '') : cells[s];
        B.pt.classList.toggle('adv', cells[s] === 'AD');
        B.pt.classList.toggle('tbn', !!st.tb);
        const S = L.sides[s];
        S.sec.classList.toggle('serving', started && !st.over && st.server === s);
        S.tw.textContent = st.R.soft ? `ゲーム ${st.g[s]}` : `セット ${st.sw[s]}・ゲーム ${st.over ? '' : st.g[s]}`;
      });
      // ボタン：回数・サーブする側だけのボタン（エース・DF・フォルト）
      const tl = ST.tally(g);
      L.btns.forEach((b) => {
        setCnt(b.cnt, tl[b.key] || 0);
        if (b.serve) b.el.classList.toggle('off', !st.over && st.server !== b.side);
        b.el.classList.toggle('done', st.over && !!sp.TYPE[b.type].to);
      });
      setCnt(L.markCnt, tl['*:mark'] || 0);
    }
    L.update = update;
    L.layout = layout;
    L.tick = tick;
    L.refresh = () => update();
    return L;
  }
  function setCnt(el, n) {
    const s = n ? String(n) : '';
    if (el.textContent !== s) el.textContent = s;
    el.hidden = !n;
  }

  /* スタート前の札：最初のサーブ */
  function coverExtra(ctx) {
    const g = ctx.game, sp = ctx.sport;
    const st = sp.replay(g);
    const who = st.serverNo ? sp.pName(g, st.server, st.serverNo) : sp.sideName(g, st.server);
    return h('p', { class: 'note' }, `最初のサーブ：${who}（変えるときは ≡ メニュー →「選手・形式を直す」）`);
  }
  /* 試合のあとの札 */
  function endSummary(ctx) {
    const g = ctx.game, sp = ctx.sport;
    const st = sp.replay(g);
    return h('div', { class: 'endscore tn-end' },
      h('span', null, sp.sideName(g, 0)), h('b', null, st.R.soft ? `${st.g[0]} − ${st.g[1]}` : sp.setsText(st) || `${st.g[0]} − ${st.g[1]}`), h('span', null, sp.sideName(g, 1)));
  }

  /* 記録を直す：側と選手（名前で選ぶ） */
  function editExtra(ctx, e, body, changed) {
    const g = ctx.game, sp = ctx.sport;
    const d = sp.TYPE[e.type];
    if (!d || d.global) return;
    body.append(h('div', { class: 'field' }, h('span', null, '側'), h('div', { class: 'row' }, [0, 1].map((s) => h('button', { class: 'btn' + (e.team === s ? ' on' : ''), dataset: { eteam: String(s) }, onclick: () => { if (e.team !== s) { e.team = s; changed(); } } },
      h('i', { class: 'chip', style: { background: g.teams[s].color } }), sp.sideName(g, s))))));
    if (e.team === 0 || e.team === 1) {
      const ps = g.teams[e.team].players || [];
      body.append(h('div', { class: 'field' }, h('span', null, '選手'), h('div', { class: 'row' },
        e.type === 'pt' ? h('button', { class: 'btn small' + (e.no == null ? ' on' : ''), onclick: () => { e.no = null; changed(); } }, 'だれか決めない') : null,
        ps.map((p) => h('button', { class: 'btn small' + (e.no === p.no ? ' on' : ''), dataset: { eno: p.no }, onclick: () => { e.no = p.no; changed(); } }, sp.pName(g, e.team, p.no))))));
    }
  }

  /* ========== 集計 ========== */
  function stats(ctx, g) {
    const sp = ST.sportOf(g);
    const st = sp.replay(g);
    const S = sp.stats(g);
    const chip = (s) => h('i', { class: 'chip', style: { background: g.teams[s].color } });
    // セットごとのゲーム数
    const heads = st.R.soft ? ['ゲーム'] : st.sets.map((x, i) => (x.mtb ? 'マッチTB' : `第${i + 1}セット`)).concat(st.over ? [] : [`第${st.sets.length + 1}セット（途中）`]);
    const cell = (s) => (st.R.soft ? [String(st.g[s])] : st.sets.map((x) => (x.mtb ? String(x.tb[s]) : String(x.g[s]) + (x.tb && x.g[s] < x.g[1 - s] ? `(${x.tb[s]})` : ''))).concat(st.over ? [] : [String(st.g[s])]));
    const board = h('div', { class: 'boxwrap' }, h('table', { class: 'per', id: 'tnSets' },
      h('thead', null, h('tr', null, h('th', null, ''), heads.map((x) => h('th', null, x)), st.R.soft ? null : h('th', null, 'セット'))),
      h('tbody', null, [0, 1].map((s) => h('tr', null, h('th', null, chip(s), sp.sideName(g, s), st.over && st.winner === s ? ' 🏆' : ''), cell(s).map((x) => h('td', null, x)), st.R.soft ? null : h('td', { class: 'sum' }, String(st.sw[s])))))));
    const fault = st.stats.anyFault;
    const cols = [['ace', 'エース'], ['win', 'ウィナー'], ['err', 'ミス'], ['df', 'DF']].concat(fault ? [['flt', 'フォルト']] : []);
    const side = (x) => {
      const rows = x.rows.map((r) => h('tr', null, h('td', { class: 'nm' }, r.name), cols.map(([k]) => h('td', null, r.c[k] ? String(r.c[k]) : '')), x.sideOnly.c.pt ? h('td', null, '') : null));
      if (x.sideOnly.c.pt) rows.push(h('tr', { class: 'unk' }, h('td', { class: 'nm' }, 'ポイント（理由なし）'), cols.map(() => h('td', null, '')), h('td', null, String(x.sideOnly.c.pt))));
      const line = [`取ったポイント ${x.won}`, `サーブのポイント ${x.serveWon}/${x.servePts}（${ST.pct(x.serveWon, x.servePts)}）`]
        .concat(fault ? [`1stサーブ ${x.firstIn}/${x.firstSv}（${ST.pct(x.firstIn, x.firstSv)}）`] : [])
        .concat([`サービスゲームのキープ ${x.held}/${x.svcGames}`, `ブレイク ${x.breaks}`]).join('・');
      return h('section', { class: 'teamstat' },
        h('h3', null, chip(x.side), x.name, h('small', null, ' ' + line)),
        h('div', { class: 'boxwrap' }, h('table', { class: 'box' },
          h('thead', null, h('tr', null, h('th', { class: 'nm' }, '選手'), cols.map(([, l]) => h('th', null, l)), x.sideOnly.c.pt ? h('th', null, 'ポイント') : null)),
          h('tbody', null, rows,
            h('tr', { class: 'tot' }, h('td', { class: 'nm' }, '合計'), cols.map(([k]) => h('td', null, x.total.c[k] ? String(x.total.c[k]) : '')), x.sideOnly.c.pt ? h('td', null, String(x.sideOnly.c.pt)) : null)))));
    };
    return h('div', null, board, S.map(side),
      h('p', { class: 'note' }, 'エース・ウィナーはその側のポイント、ミス・DF（ダブルフォルト）は相手の側のポイントです。' + (fault ? '1stサーブは「フォルト」のボタンを押さなかったポイント（DF は 1stサーブもフォルト）を、入ったものとして数えます。' : '1stサーブの入った割合は、設定で「フォルト」のボタンを出すと出ます。') + 'キープ＝自分のサービスゲームを取った数、ブレイク＝相手のサービスゲームを取った数（タイブレーク・ファイナルゲームは入れません）。'));
  }

  ST.addView('tennis', { setup, build, stats, editExtra, coverExtra, endSummary });
})(typeof window !== 'undefined' ? window : globalThis);
