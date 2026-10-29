/* スポーツ タップ記録 — 野球の画面（試合の準備・記録の画面・集計）
   記録の画面：
     上の帯：時計・いまのイニング（押すとチェンジ・打順を直す など）・カウント（B・S・O）・得点（▲ が攻撃中）・メニュー
     状況：いまの打者（押すと代打・打順を直す）・走者のダイヤモンド（塁を押すと置く・消す）・投手と投球数（押すと交代）
     1球：ボール・ストライク・ファウル（設定で消せる）
     打席の結果：単打〜併殺（押すと次の打者へ）
     下の帯：＋1点・アウト＋1・いま記録したもの・取り消す
   表示は、記録から計算した「いまの状況」（sp.situation）を書き換えるだけ（ボタンは作り直さない）。 */
(function (root) {
  'use strict';
  const ST = root.ST;
  const { h } = ST.ui;
  const SP = () => ST.SPORTS.baseball;

  /* ========== 試合の準備：チーム名・色・打順・先発投手・先攻 ========== */
  const ROWS = new WeakMap();        // チーム → 打順の欄（空の欄も残す。名簿 players は、背番号の入った欄だけ）
  function rowsOf(t) {
    if (!ROWS.has(t)) {
      const r = (t.players || []).map((p) => ({ no: p.no, name: p.name || '' }));
      const want = t.order != null ? t.order : Math.max(9, r.length);
      while (r.length < want) r.push({ no: '', name: '' });
      ROWS.set(t, r);
    }
    return ROWS.get(t);
  }
  function setup(ctx, T, o) {
    const sp = SP();
    const wrap = h('div', { class: 'bb-setup' });
    const draw = () => {
      wrap.innerHTML = '';
      wrap.append(
        h('p', { class: 'lead' }, '打順は 1番から順に、背番号を入れます（名前はなくても大丈夫です）。相手の打順は入れなくても記録できます（「1番」「2番」…のまま）。'),
        h('div', { class: 'teams2' }, [0, 1].map((i) => teamCard(i))),
        topCard());
    };
    /* 先攻のボタン。チーム名を変えたときは、作り直さずに文字だけ書き換える
       （名前の欄から、このボタンへ指を動かした瞬間に作り直すと、そのタップが消えてしまうため） */
    const topLabel = [h('span'), h('span')];
    const topBtn = [0, 1].map((i) => h('button', { class: 'btn', dataset: { top: String(i) },
      onclick: () => { T.opts.top = i; if (!o.edit) { const pr = ST.store.sportPrefs(ctx.prefs, sp.id); pr.opts = Object.assign({}, T.opts); ctx.savePrefs(); } o.changed(); refreshTop(); } },
      h('i', { class: 'chip' }), topLabel[i]));
    function refreshTop() {
      const cur = T.opts.top === 1 ? 1 : 0;
      [0, 1].forEach((i) => {
        topBtn[i].classList.toggle('on', cur === i);
        topBtn[i].setAttribute('aria-pressed', String(cur === i));
        topBtn[i].firstChild.style.background = T.teams[i].color;
        topLabel[i].textContent = `${T.teams[i].name || (i ? '相手' : '自分')}が先攻`;
      });
    }
    function topCard() {
      refreshTop();
      return h('section', { class: 'card', id: 'bbTop' }, h('h2', null, '先攻（1回表に攻撃するチーム）'),
        h('div', { class: 'row optrow' }, topBtn),
        o.edit ? h('p', { class: 'note warn' }, '試合の途中で先攻を変えると、それまでの記録の表・裏が入れかわります。') : null);
    }
    function teamCard(i) {
      const t = T.teams[i];
      const rows = rowsOf(t);
      const card = h('section', { class: 'card teamcard bb-team', id: 'team' + i, style: { '--tc': t.color, '--tink': ST.inkOn(t.color) } });
      const label = () => (t.name || '').trim() || (i ? '相手のチーム' : '自分のチーム');
      const headName = h('b', null, label());
      const sync = () => {
        t.players = ST.cleanPlayers(rows.map((r) => ({ no: r.no, name: r.name })), true);
        t.order = rows.length;
        o.changed();
        const dup = rows.filter((r) => ST.normNo(r.no) != null).length !== t.players.length;
        warn.hidden = !dup;
        count.textContent = countText();
        fillPitcher();
      };
      const countText = () => `打順：${rows.length}人${t.players.length < rows.length ? `（背番号を入れたのは ${t.players.length}人）` : ''}`;
      card.append(h('div', { class: 'tc-head' }, h('span', { class: 'tc-band' }, i ? '相手' : '自分'), headName));
      const saved = ST.store.teams(sp.id).filter((x) => x.name !== t.name || JSON.stringify(x.players.map((p) => p.no)) !== JSON.stringify(t.players.map((p) => p.no)));
      if (saved.length) {
        card.append(h('div', { class: 'savedrow' }, h('span', { class: 'note' }, '前のチームから：'),
          saved.slice(0, 8).map((x) => h('button', { class: 'btn small chipbtn', onclick: () => { Object.assign(t, { name: x.name, color: x.color, colorName: x.colorName, players: ST.cleanPlayers(x.players, true) }); ROWS.delete(t); o.changed(); draw(); } },
            h('i', { class: 'chip', style: { background: x.color } }), x.name, h('small', null, ` ${x.players.length}人`)))));
      }
      card.append(h('label', { class: 'field' }, h('span', null, 'チーム名'),
        h('input', { type: 'text', class: 'tname', maxlength: 20, placeholder: i ? '例：○○中（なくてもOK）' : '例：致遠館（なくてもOK）', value: t.name || '',
          onchange: (e) => { t.name = e.target.value.trim(); o.changed(); headName.textContent = label(); refreshTop(); } })));
      const sw = h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'ユニフォームの色' });
      ST.COLORS.forEach((c) => {
        const on = t.color.toLowerCase() === c.hex.toLowerCase();
        sw.append(h('button', { class: 'sw' + (on ? ' on' : ''), style: { background: c.hex }, title: c.name, 'aria-label': c.name, role: 'radio', 'aria-checked': on ? 'true' : 'false', dataset: { color: c.name },
          onclick: () => { t.color = c.hex; t.colorName = c.name; o.changed(); draw(); } }));
      });
      card.append(h('div', { class: 'field' }, h('span', null, `ユニフォームの色：${t.colorName}`), sw));
      if (T.teams[0].color.toLowerCase() === T.teams[1].color.toLowerCase()) card.append(h('p', { class: 'note warn' }, '⚠ 自分と相手が同じ色です。見分けやすいように、どちらかを変えてください。'));
      // 打順
      const count = h('span', { class: 'bb-count' }, '');
      const warn = h('p', { class: 'note warn', hidden: true }, '⚠ 同じ背番号が2つあります（あとのほうは打順に入りません）');
      const list = h('div', { class: 'bb-order', role: 'group', 'aria-label': '打順' });
      rows.forEach((r, k) => {
        list.append(h('div', { class: 'bb-orow', dataset: { slot: String(k) } },
          h('b', { class: 'bb-slot' }, `${k + 1}番`),
          h('input', { type: 'text', class: 'bb-no', inputmode: 'numeric', maxlength: 2, placeholder: '背番号', value: r.no || '', 'aria-label': `${k + 1}番の背番号`,
            onchange: (e) => { const v = ST.normNo(e.target.value); r.no = v || ''; e.target.value = r.no; sync(); } }),
          h('input', { type: 'text', class: 'bb-nm', maxlength: 12, placeholder: '名前（なくてもOK）', value: r.name || '', 'aria-label': `${k + 1}番の名前`,
            onchange: (e) => { r.name = e.target.value.trim().slice(0, 12); sync(); } })));
      });
      card.append(h('div', { class: 'field' }, count,
        h('div', { class: 'row presets' },
          h('button', { class: 'btn small', dataset: { fill: 'seq' }, onclick: () => { rows.forEach((r, k) => { r.no = String(k + 1); }); sync(); draw(); } }, `背番号 1〜${rows.length} を順に`),
          h('button', { class: 'btn small', id: 'bbAdd' + i, onclick: () => { if (rows.length < 20) rows.push({ no: '', name: '' }); sync(); draw(); } }, '打順を1人足す'),
          rows.length > 1 ? h('button', { class: 'btn small', onclick: () => { rows.pop(); sync(); draw(); } }, '最後の打順を消す') : null,
          h('button', { class: 'btn small', onclick: () => { rows.forEach((r) => { r.no = ''; r.name = ''; }); sync(); draw(); } }, '全部消す')),
        list, warn));
      // 先発投手
      const pIn = h('input', { type: 'text', class: 'bb-pno', id: 'bbPitcher' + i, inputmode: 'numeric', maxlength: 2, placeholder: '背番号', value: t.pitcher || '',
        onchange: (e) => { t.pitcher = ST.normNo(e.target.value); e.target.value = t.pitcher || ''; o.changed(); fillPitcher(); } });
      const pBtns = h('div', { class: 'row bb-pbtns' });
      /* 打順の背番号のボタン。作り直さずに、あるボタンを書き換える（打順の欄から指を動かした瞬間に、欄の「変わった」で
         ここが書き換わっても、押しているボタンが消えないように） */
      function fillPitcher() {
        const nos = t.players.map((p) => p.no);
        while (pBtns.children.length > nos.length) pBtns.lastChild.remove();
        nos.forEach((no, k) => {
          let b = pBtns.children[k];
          if (!b) {
            b = h('button', { class: 'btn small', onclick: (e) => { const v = e.currentTarget.dataset.pno; t.pitcher = v; pIn.value = v; o.changed(); fillPitcher(); } });
            pBtns.append(b);
          }
          b.dataset.pno = no;
          if (b.textContent !== '#' + no) b.textContent = '#' + no;
          b.classList.toggle('on', t.pitcher === no);
        });
      }
      card.append(h('div', { class: 'field' }, h('span', null, '先発投手の背番号（なくてもOK）'), h('div', { class: 'row' }, pIn), pBtns));
      count.textContent = countText();
      fillPitcher();
      warn.hidden = rows.filter((r) => ST.normNo(r.no) != null).length === t.players.length;
      return card;
    }
    draw();
    return wrap;
  }

  /* ========== 記録の画面 ========== */
  function build(ctx) {
    const g = ctx.game, sp = ctx.sport;
    const L = {};
    const pitchMode = () => { const r = (ctx.sprefs.rows || {}); return r.pitch != null ? !!r.pitch : true; };
    const clock = ctx.ui.clockBtn();
    const startB = ctx.ui.startBtn();
    L.inning = h('button', { class: 'period bb-inn', id: 'btnInning', 'aria-label': 'イニング', onclick: () => openInning(ctx) }, '1回表');
    const dots = (n, cls) => Array.from({ length: n }, () => h('i', { class: 'dot ' + cls }));
    L.dB = dots(3, 'db'); L.dS = dots(2, 'ds'); L.dO = dots(2, 'do');
    L.bso = h('div', { class: 'bso', id: 'bso', 'aria-label': 'カウント' },
      h('div', null, h('b', null, 'B'), L.dB), h('div', null, h('b', null, 'S'), L.dS), h('div', null, h('b', null, 'O'), L.dO));
    L.score = [0, 1].map((tm) => h('span', { class: 'sc', id: 'score' + tm, style: { '--tc': g.teams[tm].color, '--tink': ST.inkOn(g.teams[tm].color) } }, '0'));
    const bar = h('header', { class: 'lbar' }, clock.el, startB.el, L.inning, L.bso,
      h('div', { class: 'score', 'aria-label': '得点' }, L.score[0], h('span', { class: 'dash' }, '−'), L.score[1]),
      ctx.ui.menuBtn());

    // 状況：打者・ダイヤモンド・投手
    L.bOrder = h('b', { class: 'bb-border' }, '1番');
    L.bNo = h('b', { class: 'bb-bno' }, '');
    L.bName = h('small', { class: 'bb-bname' }, '');
    L.bNext = h('small', { class: 'bb-next' }, '');
    L.bTeam = h('small', { class: 'bb-bteam' }, '');
    L.batter = h('button', { class: 'bb-card bb-batter', id: 'bbBatter', 'aria-label': 'いまの打者（押すと代打・打順を直す）', onclick: () => openBatter(ctx) },
      L.bTeam, h('div', { class: 'bb-bmain' }, L.bOrder, L.bNo), L.bName, L.bNext);
    L.bases = [0, 1, 2].map((i) => h('button', { class: 'bb-base', id: 'base' + i, dataset: { base: String(i) }, 'aria-label': `${sp.BASE[i]}（押すと走者を置く・消す）`, onclick: (e) => tapBase(i, e.currentTarget) }, h('span', null, '')));
    L.diamond = h('div', { class: 'bb-diamond', id: 'bbDiamond' }, h('div', { class: 'bb-field' }), L.bases[1], L.bases[2], L.bases[0], h('i', { class: 'bb-home' }), L.outsTxt = h('small', { class: 'bb-outs' }, ''));
    L.pNo = h('b', { class: 'bb-pnum' }, '');
    L.pCount = h('b', { class: 'bb-pc' }, '0');
    L.pLim = h('small', { class: 'bb-plim' }, '');
    L.pTeam = h('small', { class: 'bb-pteam' }, '');
    L.pitcher = h('button', { class: 'bb-card bb-pitcher', id: 'bbPitcher', 'aria-label': '投手と投球数（押すと投手の交代）', onclick: () => openPitcher(ctx) },
      L.pTeam, h('div', { class: 'bb-pmain' }, h('small', null, '投手'), L.pNo), h('div', { class: 'bb-pcount' }, L.pCount, h('small', null, '球')), L.pLim);
    const situ = h('section', { class: 'bb-situ' }, L.batter, L.diamond, L.pitcher);

    // 1球・打席の結果
    const resBtn = (type, extra) => {
      const d = sp.TYPE[type];
      return h('button', { class: 'bb-b k-' + d.kind + (extra ? ' ' + extra : ''), id: 'bb_' + type, dataset: { type }, 'aria-label': d.label, onclick: (e) => tapType(type, e.currentTarget) }, h('b', null, d.btn));
    };
    L.pitchRow = h('section', { class: 'bb-pitch', hidden: !pitchMode() }, sp.PITCHES.map((x) => resBtn(x)));
    const res = h('section', { class: 'bb-res' },
      ['1b', '2b', '3b', 'hr', 'bb', 'hbp', 'e', 'fc', 'k', 'go', 'fo', 'lo', 'sh', 'sf'].map((x) => resBtn(x)), resBtn('dp', 'wide2'));
    const stage = h('main', { class: 'bb-stage' + (pitchMode() ? '' : ' nopitch') }, situ, L.pitchRow, res);
    L.run = h('button', { class: 'gb bb-run', id: 'btnRun', 'aria-label': '得点（いちばん先の走者を消して1点）', onclick: (e) => tapType('run', e.currentTarget) }, h('b', null, '＋1点'), h('small', null, '得点'));
    L.out = h('button', { class: 'gb bb-out', id: 'btnOut', 'aria-label': 'アウト（走者）', onclick: (e) => tapType('out', e.currentTarget) }, h('b', null, 'アウト'), h('small', null, '＋1'));
    const rootEl = h('div', { class: 'live fam-baseball' }, bar, h('div', { class: 'stagewrap' }, stage, ctx.ui.cover()), ctx.ui.footer([L.run, L.out]));
    L.root = rootEl;

    function tapType(type, btn) {
      const s = sp.situation(g);
      const isBat = sp.PITCHES.includes(type) || sp.RESULTS.includes(type);
      const ev = isBat ? { type, team: s.bat, no: s.batter, slot: s.slot } : { type, team: s.bat };
      ctx.record(ev, btn, { key: [type, s.half, s.bat, s.slot, s.b, s.s, s.outs].join(':') });
    }
    function tapBase(i, btn) {
      const s = sp.situation(g);
      const on = !s.bases[i];
      ctx.record({ type: 'base', team: s.bat, base: i, on, no: null }, btn, { key: `base:${i}:${on}` });
    }

    let lastHalf = null, lastBatterKey = '';
    function update(bump) {
      startB.update();
      clock.set(g.startedAt ? ST.fmtTime(ctx.elapsed()) : '0:00');
      const s = sp.situation(g);
      L.inning.textContent = s.halfText;
      L.dB.forEach((d, i) => d.classList.toggle('on', i < s.b));
      L.dS.forEach((d, i) => d.classList.toggle('on', i < s.s));
      L.dO.forEach((d, i) => d.classList.toggle('on', i < s.outs));
      [0, 1].forEach((tm) => {
        const el = L.score[tm];
        const prev = el.textContent;
        el.textContent = String(s.score[tm]);
        el.classList.toggle('atbat', tm === s.bat && !!g.startedAt);
        if (prev !== el.textContent && g.startedAt) ctx.flash(el);
      });
      // 打者
      const nm = s.batter != null ? ST.playerName(g, s.bat, s.batter) : '';
      L.bTeam.textContent = `${ST.teamName(g, s.bat)}の攻撃`;
      L.batter.style.setProperty('--tc', g.teams[s.bat].color);
      L.batter.style.setProperty('--tink', ST.inkOn(g.teams[s.bat].color));
      L.bOrder.textContent = `${s.slot + 1}番`;
      L.bNo.textContent = s.batter != null ? '#' + s.batter : '';
      L.bName.textContent = nm;
      L.bName.hidden = !nm;
      const nnm = s.nextBatter != null ? ST.playerName(g, s.bat, s.nextBatter) : '';
      L.bNext.textContent = `次：${s.nextSlot + 1}番${s.nextBatter != null ? ' #' + s.nextBatter : ''}${nnm ? ' ' + nnm : ''}`;
      const bk = s.half + ':' + s.slot;
      if (lastBatterKey && bk !== lastBatterKey) ctx.flash(L.batter);
      lastBatterKey = bk;
      // 走者
      s.bases.forEach((r, i) => {
        const el = L.bases[i];
        el.classList.toggle('on', !!r);
        el.firstChild.textContent = r ? (r.no != null ? r.no : '●') : '';
        el.style.setProperty('--tc', g.teams[s.bat].color);
        el.style.setProperty('--tink', ST.inkOn(g.teams[s.bat].color));
      });
      L.outsTxt.textContent = `${s.outs}アウト`;
      // 投手
      L.pTeam.textContent = `${ST.teamName(g, s.fld)}の守り`;
      L.pNo.textContent = s.pitcherNo != null ? '#' + s.pitcherNo : '—';
      L.pCount.textContent = String(s.pitchCount);
      const lim = Number(g.opts.plim) || 0;
      L.pitcher.classList.toggle('lim-w', !!lim && s.pitchCount >= lim - 10 && s.pitchCount < lim);
      L.pitcher.classList.toggle('lim-x', !!lim && s.pitchCount >= lim);
      L.pLim.textContent = lim ? (s.pitchCount >= lim ? `⚠ 目安${lim}球` : `目安${lim}・あと${lim - s.pitchCount}`) : '';
      L.pLim.title = lim ? `投球数の目安 ${lim}球（試合の形式で決めたもの）` : '';
      L.pLim.hidden = !lim;
      // 3アウトで攻守交代
      if (lastHalf != null && s.half > lastHalf && g.startedAt) ctx.say(`3アウト チェンジ → ${s.halfText}（${ST.teamName(g, s.bat)}の攻撃）`, 'ok', 3500);
      lastHalf = s.half;
      layout();
    }
    function layout() {
      if (!rootEl.isConnected) return;
      const H = rootEl.clientHeight || root.innerHeight;
      rootEl.classList.toggle('short', H < 430);
      // 2列にするかは、記録のボタンの入れ物の大きさで決める（撮影のワイプを出すと、その分せまくなる）
      const sw = rootEl.querySelector('.stagewrap');
      const W2 = (sw && sw.clientWidth) || rootEl.clientWidth || root.innerWidth, H2 = (sw && sw.clientHeight) || H;
      rootEl.classList.toggle('bb-wide', W2 > H2 * 1.15 && W2 >= 600);
    }
    function tick() { if (g.startedAt) clock.set(ST.fmtTime(ctx.elapsed())); }
    L.update = update;
    L.layout = layout;
    L.tick = tick;
    L.refresh = () => update();
    return L;
  }

  /* ---------- 小窓：イニング（チェンジ・打順を直す・投手の交代・代打） ---------- */
  function openInning(ctx) {
    const sp = ctx.sport, g = ctx.game;
    const s = sp.situation(g);
    const sheet = ST.ui.sheet({
      title: `${s.halfText}・${s.outs}アウト（${ST.teamName(g, s.bat)}の攻撃）`,
      body: h('div', { class: 'periodbox' },
        h('button', { class: 'btn primary huge', id: 'btnChange', onclick: () => { sheet.close(); ctx.record({ type: 'chg', team: s.bat }, null, { key: 'chg:' + s.half }); } }, 'チェンジ（3アウトにする）'),
        h('div', { class: 'row pgrid' },
          h('button', { class: 'btn', onclick: () => { sheet.close(); openBatter(ctx); } }, '代打・打順を直す'),
          h('button', { class: 'btn', onclick: () => { sheet.close(); openPitcher(ctx); } }, '投手の交代')),
        h('p', { class: 'note' }, 'アウトは打席の結果から自動で数え、3アウトで自動でチェンジします。アウトを記録しそこねたときは「チェンジ」で次の半イニングへ（まちがえたら「↶ 取り消す」）。'))
    });
  }
  function keypad(title, onOk) {
    let val = '';
    const disp = h('div', { class: 'kdisp' }, '　');
    const show = () => { disp.textContent = val ? '#' + val : '番号を入れる'; disp.classList.toggle('empty', !val); };
    const press = (k) => {
      if (k === '⌫') val = val.slice(0, -1);
      else if (k === '00') val = '00';
      else if (val === '00' || val.length >= 2) val = k;
      else val = val === '0' ? k : val + k;
      show();
    };
    const s = ST.ui.sheet({
      title, cls: 'keypad',
      body: h('div', null, disp, h('div', { class: 'keys' }, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'].map((k) => h('button', { class: 'key', dataset: { key: k }, onclick: () => press(k) }, k)))),
      foot: [h('button', { class: 'btn', onclick: () => s.close() }, 'やめる'), h('button', { class: 'btn primary', id: 'btnKeyOk', onclick: () => {
        const no = ST.normNo(val);
        if (no == null) { ST.ui.toast('0〜99 の番号を入れてください', 'warn'); return; }
        s.close();
        onOk(no);
      } }, '決める')]
    });
    show();
  }
  /* 打者：打順を直す（次の打者を選ぶ）・代打 */
  function openBatter(ctx) {
    const sp = ctx.sport, g = ctx.game;
    const s = sp.situation(g);
    const lineup = s.lineup[s.bat];
    const sheet = ST.ui.sheet({
      title: `${ST.teamName(g, s.bat)}の打順（いまは ${s.slot + 1}番）`,
      body: h('div', { class: 'bb-sheet' },
        h('button', { class: 'btn primary huge', id: 'btnPinch', onclick: () => { sheet.close(); keypad(`代打（${s.slot + 1}番に入る人の背番号）`, (no) => ctx.record({ type: 'sub', team: s.bat, slot: s.slot, no }, null, { key: 'sub:' + s.slot + ':' + no })); } }, `代打を出す（${s.slot + 1}番）`),
        h('p', { class: 'note' }, '打順を直す：次に打つ人を選びます（打席の記録を飛ばした・まちがえたとき）。'),
        h('div', { class: 'bb-slots' }, Array.from({ length: s.nSlots }, (_, k) => {
          const no = lineup[k] || null;
          const nm = no != null ? ST.playerName(g, s.bat, no) : '';
          return h('button', { class: 'btn' + (k === s.slot ? ' on' : ''), dataset: { slot: String(k) }, onclick: () => { sheet.close(); if (k !== s.slot) ctx.record({ type: 'bat', team: s.bat, slot: k }, null, { key: 'bat:' + k }); } },
            h('b', null, `${k + 1}番`), no != null ? ` #${no}` : '', nm ? h('small', null, ' ' + nm) : null);
        })))
    });
  }
  /* 投手の交代（守りのチーム） */
  function openPitcher(ctx) {
    const sp = ctx.sport, g = ctx.game;
    const s = sp.situation(g);
    const nos = (g.teams[s.fld].players || []).map((p) => p.no);
    const used = s.pitchers[s.fld].filter((P) => P.pitches || P.bf);
    const pick = (no) => { sheet.close(); if (no !== s.pitcherNo) ctx.record({ type: 'pch', team: s.fld, no }, null, { key: 'pch:' + no }); };
    const sheet = ST.ui.sheet({
      title: `${ST.teamName(g, s.fld)}の投手（いまは ${s.pitcherNo != null ? '#' + s.pitcherNo : '—'}・${s.pitchCount}球）`,
      body: h('div', { class: 'bb-sheet' },
        used.length ? h('p', { class: 'note' }, 'この試合の投球数：' + used.map((P) => `#${P.no != null ? P.no : '?'} ${P.pitches}球`).join('・')) : null,
        h('p', { class: 'note' }, '新しい投手を選ぶと、そこから投球数を 0 から数えます。'),
        h('div', { class: 'bb-slots' }, nos.map((no) => h('button', { class: 'btn' + (no === s.pitcherNo ? ' on' : ''), dataset: { pno: no }, onclick: () => pick(no) }, '#' + no, ST.playerName(g, s.fld, no) ? h('small', null, ' ' + ST.playerName(g, s.fld, no)) : null))),
        h('button', { class: 'btn', id: 'btnPitcherKey', onclick: () => { sheet.close(); keypad('新しい投手の背番号', (no) => ctx.record({ type: 'pch', team: s.fld, no }, null, { key: 'pch:' + no })); } }, 'ほかの番号を入れる'))
    });
  }

  /* ---------- 一覧で直す（打者・投手・塁） ---------- */
  function editExtra(ctx, e, body, changed) {
    const sp = ctx.sport, g = ctx.game;
    const isBat = sp.PITCHES.includes(e.type) || sp.RESULTS.includes(e.type);
    if ((isBat || e.type === 'sub' || e.type === 'bat') && (e.team === 0 || e.team === 1)) {
      const lineup = (g.teams[e.team].players || []).map((p) => p.no);
      const n = sp.slotsOf(lineup, g.teams[e.team].order);
      body.append(h('div', { class: 'field' }, h('span', null, `${ST.teamName(g, e.team)}の打順`), h('div', { class: 'row nopick' },
        Array.from({ length: n }, (_, k) => h('button', { class: 'btn small' + (e.slot === k ? ' on' : ''), dataset: { eslot: String(k) }, onclick: () => {
          e.slot = k;
          if (isBat) e.no = lineup[k] || null;
          changed();
        } }, `${k + 1}番${isBat && lineup[k] ? ' #' + lineup[k] : ''}`)))));
    }
    if (e.type === 'pch' || e.type === 'sub') {
      const nos = (g.teams[e.team].players || []).map((p) => p.no);
      if (e.no != null && !nos.includes(e.no)) nos.push(e.no);
      body.append(h('div', { class: 'field' }, h('span', null, e.type === 'pch' ? '投手' : '代打の人'), h('div', { class: 'row nopick' },
        nos.map((no) => h('button', { class: 'btn small' + (e.no === no ? ' on' : ''), onclick: () => { e.no = no; changed(); } }, '#' + no)))));
    }
    if (e.type === 'base') {
      body.append(h('div', { class: 'field' }, h('span', null, '塁'), h('div', { class: 'row' },
        sp.BASE.map((b, i) => h('button', { class: 'btn small' + (e.base === i ? ' on' : ''), onclick: () => { e.base = i; changed(); } }, b)),
        h('button', { class: 'btn small' + (e.on ? ' on' : ''), onclick: () => { e.on = true; changed(); } }, '走者を置く'),
        h('button', { class: 'btn small' + (!e.on ? ' on' : ''), onclick: () => { e.on = false; changed(); } }, '走者を消す'))));
    }
  }

  /* ---------- メニュー・札 ---------- */
  function menuItems(ctx) {
    return [
      { icon: '⚾', label: '投手の交代', sub: '守りのチームの投手を代える（投球数は 0 から）', fn: () => openPitcher(ctx) },
      { icon: '🔁', label: '代打・打順を直す', sub: 'いまの打順に代打・次に打つ人を選ぶ', fn: () => openBatter(ctx) },
      { icon: '⏭', label: 'チェンジ（3アウトにする）', sub: 'アウトを記録しそこねたとき', fn: () => openInning(ctx) }
    ];
  }
  function coverExtra(ctx) {
    const g = ctx.game, sp = ctx.sport;
    const s = sp.situation(g);
    return h('p', { class: 'note' }, `1回表：${ST.teamName(g, s.bat)}の攻撃（${s.batter != null ? '1番 #' + s.batter : '1番'}）・${ST.teamName(g, s.fld)}の投手 ${s.pitcherNo != null ? '#' + s.pitcherNo : '（未定）'}`);
  }
  function endSummary(ctx) { return h('div', null, h('div', { class: 'endscore' }, h('span', null, ST.teamName(ctx.game, 0)), h('b', null, ST.scoreText(ctx.game)), h('span', null, ST.teamName(ctx.game, 1))), scoreboard(ctx.game)); }

  /* ---------- 集計 ---------- */
  function scoreboard(g) {
    const sp = SP();
    const st = sp.derive(g);
    const top = g.opts.top === 1 ? 1 : 0;
    const order = [top, 1 - top];
    const played = Math.max(st.line[0].length, st.line[1].length);
    const N = Math.max(Number(g.opts.inn) || 9, played);
    const chip = (tm) => h('i', { class: 'chip', style: { background: g.teams[tm].color } });
    return h('div', { class: 'boxwrap' }, h('table', { class: 'per bb-board', id: 'bbBoard' },
      h('thead', null, h('tr', null, h('th', null, ''), Array.from({ length: N }, (_, i) => h('th', null, String(i + 1))), h('th', null, 'R'), h('th', null, 'H'), h('th', null, 'E'))),
      h('tbody', null, order.map((tm) => h('tr', null, h('th', null, chip(tm), ST.teamName(g, tm)),
        Array.from({ length: N }, (_, i) => h('td', null, st.line[tm][i] != null ? String(st.line[tm][i]) : '')),
        h('td', { class: 'sum' }, String(st.score[tm])), h('td', null, String(st.hits[tm])), h('td', null, String(st.errs[tm])))))));
  }
  function stats(ctx, g) {
    const sp = SP();
    const st = sp.derive(g);
    const bat = sp.batting(g, st);
    const chip = (tm) => h('i', { class: 'chip', style: { background: g.teams[tm].color } });
    const cols = [['pa', '打席'], ['ab', '打数'], ['h', '安打'], ['d2', '二塁打'], ['d3', '三塁打'], ['hr', '本塁打'], ['bb', '四死球'], ['k', '三振'], ['sac', '犠打飛']];
    const batTable = (x) => h('div', { class: 'boxwrap' }, h('table', { class: 'box' },
      h('thead', null, h('tr', null, h('th', null, '打順'), h('th', null, '#'), h('th', { class: 'nm' }, '名前'), cols.map(([, l]) => h('th', null, l)), h('th', null, '打率'))),
      h('tbody', null,
        x.rows.filter((r) => r.s.pa || r.slot >= 0).map((r) => h('tr', null, h('td', null, r.slot >= 0 ? String(r.slot + 1) : '代'), h('td', { class: 'no' }, r.no != null ? r.no : '—'), h('td', { class: 'nm' }, r.name || ''),
          cols.map(([k]) => h('td', null, r.s[k] ? String(r.s[k]) : '')), h('td', null, sp.avg(r.s.h, r.s.ab)))),
        h('tr', { class: 'tot' }, h('td', null), h('td', { class: 'no' }), h('td', { class: 'nm' }, '合計'), cols.map(([k]) => h('td', null, String(x.total[k]))), h('td', null, sp.avg(x.total.h, x.total.ab))))));
    const pitTable = (tm) => {
      const list = st.pitchers[tm].filter((P) => P.pitches || P.bf || P.outs);
      if (!list.length) return h('p', { class: 'note' }, 'まだ投球の記録はありません。');
      const lim = Number(g.opts.plim) || 0;
      return h('div', { class: 'boxwrap' }, h('table', { class: 'box' },
        h('thead', null, h('tr', null, h('th', null, '投手'), h('th', { class: 'nm' }, '名前'), ['投球数', '投球回', '打者', '被安打', '奪三振', '与四死球', '失点'].map((l) => h('th', null, l)))),
        h('tbody', null, list.map((P) => h('tr', null, h('td', { class: 'no' }, P.no != null ? '#' + P.no : '—'), h('td', { class: 'nm' }, P.no != null ? ST.playerName(g, tm, P.no) : ''),
          h('td', { class: lim && P.pitches >= lim ? 'bb-over' : null }, String(P.pitches)), h('td', null, sp.ipText(P.outs)), h('td', null, String(P.bf)), h('td', null, String(P.h)), h('td', null, String(P.k)), h('td', null, String(P.bb)), h('td', null, String(P.r)))))));
    };
    return h('div', null,
      scoreboard(g),
      [0, 1].map((tm) => h('section', { class: 'teamstat' },
        h('h3', null, chip(tm), ST.teamName(g, tm), h('small', null, ` ${st.score[tm]}点・安打 ${st.hits[tm]}・打率 ${sp.avg(bat[tm].total.h, bat[tm].total.ab)}`)),
        h('h4', { class: 'bb-h4' }, '打者'), batTable(bat[tm]),
        h('h4', { class: 'bb-h4' }, '投手'), pitTable(tm))),
      h('p', { class: 'note' }, '打数＝打席から四死球・犠打・犠飛を引いたもの。失点は「その投手が投げている間に入った点」です。自責点・打点は数えていません。' + (Number(g.opts.plim) ? `投球数が目安（${g.opts.plim}球）に届いた投手は赤で出しています。` : '')));
  }

  ST.addView('baseball', { setup, build, stats, editExtra, menuItems, coverExtra, endSummary });
})(typeof window !== 'undefined' ? window : globalThis);
