'use strict';
/* ============================================================
   scenes.js — 画面（タイトル / あそびかた / キャラ選択 / 対戦 / 結果 / エンディング）
   ============================================================ */
const LEVEL_NAMES = ['やさしい', 'ふつう', 'つよい', 'ごうけつ'];
const Game = {
  c: null, cv: null, fr: 0, scene: null, level: 1, last: [0, 3], mode: 'arcade',
  go(name, p) { Net.listener = null; this.scene = SCENES[name]; this.sceneName = name; this.scene.enter(p || {}); },
};

/* ---------- 画面部品 ---------- */
function panel(c, x, y, w, h, fill, line) {
  R(c, x, y, w, h, '#000'); R(c, x + 1, y + 1, w - 2, h - 2, line || '#fcfcfc'); R(c, x + 2, y + 2, w - 4, h - 4, '#000'); R(c, x + 3, y + 3, w - 6, h - 6, fill || '#14143c');
}
function cursorMark(c, x, y, fr) {
  const dx = (fr >> 3) & 1;
  Tri(c, x - 1 + dx, y - 1, x - 1 + dx, y + 9, x + 7 + dx, y + 4, '#000');
  Tri(c, x + dx, y, x + dx, y + 8, x + 6 + dx, y + 4, '#fc3c3c');
}
function bannerText(c, str, y, scale, col, ocol, pop) {
  const s = pop ? scale + 1 : scale;
  text5(c, str, 128, y - (pop ? 3 : 0), col, s, { align: 'c', ocol });
}
/* 明るい空と流れる雲（タイトル・選択・結果の背景） */
function starBg(c, fr) {
  sky(c, '#3c8cfc', '#e4f6ff', SCREEN_H, 16);
  [[30, 44, 1.1, 0.10], [140, 70, 0.9, 0.07], [214, 36, 1.2, 0.12], [90, 118, 0.8, 0.05], [230, 124, 0.7, 0.06]].forEach(([x, y, sc, v]) => cloud(c, ((x + fr * v) % 300) - 22, y, sc));
}
function grassStrip(c, y) {
  R(c, 0, y, SCREEN_W, SCREEN_H - y, '#58c848'); R(c, 0, y, SCREEN_W, 2, '#9cf078'); R(c, 0, y + 2, SCREEN_W, 1, '#2c8c24');
  for (let i = 0; i < 40; i++) R(c, (i * 47) % 252, y + 5 + ((i * 13) % 18), 2, 1, '#3ca830');
}
const NAVY = '#14325a';
const jpO = (c, str, x, y, col, o) => jp(c, str, x, y, col, Object.assign({ outline: true, ocol: NAVY }, o || {}));   // 明るい背景の上の文字（紺のふちどり）

/* 小さなロボ表示（タイトルやキャラ選択のための仮の対戦状態） */
const FAKE = { phase: 'view', projs: [] };
function viewFighter(ch, x, face, st, mvKey, ph, t) {
  const f = newFighter(0, ch);
  f.x = S(x); f.face = face; f.t = t || 0;
  if (st) f.st = st;
  if (mvKey) { f.st = 'atk'; f.mv = mvKey; f.ph = ph || 0; f.pt = 0; }
  return f;
}
function drawMoveList(c, ch, x, y) {
  const C = CHARS[ch];
  const rows = [['A', C.moves.jab], ['B', C.moves.kick], ['→A', C.moves.s1], ['→B', C.moves.s2], ['↓A', C.moves.s3], ['↓B', C.moves.s4], ['空A', C.moves.jA], ['空B', C.moves.jB]];
  rows.forEach(([k, mv], i) => {
    const col = i < 2 || i > 5 ? '#bcbcbc' : '#fcd838';
    jp(c, k, x, y + i * 10, '#a4e4fc');
    jp(c, mv.name, x + 26, y + i * 10, col);
  });
}

/* ============================================================
   タイトル
   ============================================================ */
const SceneTitle = {
  enter() {
    this.t = 0; this.state = Game.skipPress ? 'menu' : 'press'; this.sel = 0; this.msg = ''; this.msgT = 0;
    this.pair = [0, 1]; this.pairT = 0; this.act = [null, null];
    Input.mode = 'solo'; Sound.bgm('title');
  },
  items() {
    return [
      { k: 'arcade', label: 'アーケード', sub: 'ひとりで 7にんぬき' },
      { k: 'vs', label: 'VS CPU', sub: 'すきな あいてと たいせん' },
      { k: 'versus', label: '2P たいせん', sub: 'ふたりで ひとつの キーボード' },
      { k: 'online', label: 'オンライン', sub: 'ともだち・きょうだいと ネットで たいせん' },
      { k: 'help', label: 'あそびかた', sub: 'そうさと わざの ヒント' },
      { k: 'level', label: 'CPUのつよさ ' + LEVEL_NAMES[Game.level], sub: 'ひだり・みぎ で かえられる' },
    ];
  },
  choose(it) {
    if (it.disabled) { this.msg = 'オンラインは いま つくっているところ！'; this.msgT = 120; Sound.sfx('cancel'); return; }
    Sound.sfx('confirm');
    if (it.k === 'arcade') { Game.mode = 'arcade'; Game.go('select', { mode: 'arcade' }); }
    else if (it.k === 'vs') { Game.mode = 'vs'; Game.go('select', { mode: 'vs' }); }
    else if (it.k === 'versus') { Game.mode = 'versus'; Game.go('select', { mode: 'versus' }); }
    else if (it.k === 'online') Game.go('online');
    else if (it.k === 'help') Game.go('help');
    else if (it.k === 'level') { Game.level = (Game.level + 1) % 4; }
  },
  update() {
    this.t++;
    if (this.msgT > 0) this.msgT--;
    // 背景の2体が時々わざを出す
    this.pairT++;
    if (this.pairT > 420) { this.pairT = 0; const a = rngInt({ s: (this.t * 2654435761) | 0 }, 8); this.pair = [a, (a + 1 + ((this.t >> 3) % 7)) % 8]; }
    if (this.t % 70 === 30) this.act[0] = { k: ['jab', 'kick', 's1', 's2'][(this.t / 70 | 0) % 4], t: 0 };
    if (this.t % 70 === 60) this.act[1] = { k: ['kick', 'jab', 's2', 's1'][(this.t / 70 | 0) % 4], t: 0 };
    this.act.forEach((a) => { if (a) a.t++; });
    if (this.state === 'press') {
      if (Input.any || Input.tap) {
        this.state = 'menu'; Sound.unlock(); Sound.bgm('title'); Sound.sfx('confirm');
        if (Game.pendingJoin) { const c = Game.pendingJoin; Game.pendingJoin = null; Game.go('online', { join: c }); }
      }
      return;
    }
    const items = this.items();
    const n = Input.nav();
    if (n.y) { this.sel = (this.sel + n.y + items.length) % items.length; Sound.sfx('select'); }
    if (n.x && items[this.sel].k === 'level') { Game.level = (Game.level + n.x + 4) % 4; Sound.sfx('select'); }
    if (Input.confirm()) this.choose(items[this.sel]);
    if (Input.tap) {
      const t = Input.tap;
      items.forEach((it, i) => { const y = 90 + i * 16; if (t.y >= y - 3 && t.y < y + 13 && t.x > 60 && t.x < 196) { this.sel = i; this.choose(it); } });
    }
  },
  render(c) {
    const fr = this.t;
    starBg(c, fr, '#0c0c2c', '#101040');
    // ロゴ
    jpO(c, 'きょうだい', 128, 14, '#ffffff', { size: 12, align: 'c' });
    jp(c, 'メカバトル', 128, 30, NAVY, { size: 24, align: 'c', outline: true, ocol: NAVY });
    jp(c, 'メカバトル', 128, 30, '#fc5c3c', { size: 24, align: 'c', shadow: false });
    c.save(); c.beginPath(); c.rect(0, 30, 256, 9); c.clip(); jp(c, 'メカバトル', 128, 30, '#ffc890', { size: 24, align: 'c', shadow: false }); c.restore();
    text5(c, 'BROTHERS MECH BATTLE', 128, 62, '#ffffff', 1, { align: 'c', ocol: NAVY });
    // 左右に2体
    grassStrip(c, FLOOR_Y + 8);
    const mk = (i, x, face) => {
      const a = this.act[i];
      let f;
      if (a && a.t < 24) { f = viewFighter(this.pair[i], x, face, null, a.k, a.t < 6 ? 0 : a.t < 14 ? 1 : 2, fr); }
      else f = viewFighter(this.pair[i], x, face, 'idle', null, 0, fr);
      return f;
    };
    const lx = this.state === 'press' ? 62 : 30, rx = this.state === 'press' ? 194 : 226;
    c.save(); c.translate(0, 18);
    drawFighter(c, mk(0, lx, 1), FAKE, fr); drawFighter(c, mk(1, rx, -1), FAKE, fr + 7);
    c.restore();
    if (this.state === 'press') {
      if ((fr >> 5) & 1) text5(c, 'PUSH START', 128, 112, '#fcfcfc', 2, { align: 'c' });
      jpO(c, 'キーをおす か タップ', 128, 134, '#ffffff', { align: 'c' });
      if (Game.pendingJoin) jpO(c, 'ともだちから しょうたいが とどいています！', 128, 150, '#fff2a8', { align: 'c' });
      text5(c, '2026 KAZU AND BRO', 128, 212, '#ffffff', 1, { align: 'c', ocol: NAVY });
      return;
    }
    // メニュー
    panel(c, 60, 82, 136, 110, '#101040');
    const items = this.items();
    items.forEach((it, i) => {
      const y = 90 + i * 16, sel = i === this.sel;
      if (sel) cursorMark(c, 68, y + 2, fr);
      jp(c, it.label, 80, y, it.disabled ? '#6c6c8c' : sel ? '#fcd838' : '#fcfcfc');
    });
    const it = items[this.sel];
    jpO(c, this.msgT > 0 ? this.msg : it.sub, 128, 202, this.msgT > 0 ? '#ffd0c0' : '#ffffff', { align: 'c', size: 8 });
    text5(c, Sound.on ? 'M:SOUND ON' : 'M:SOUND OFF', 252, 214, '#ffffff', 1, { align: 'r', ocol: NAVY });
  },
};

/* ============================================================
   あそびかた
   ============================================================ */
const SceneHelp = {
  enter() { this.t = 0; this.page = 0; },
  update() {
    this.t++;
    const n = Input.nav();
    if (n.x) { this.page = (this.page + n.x + 4) % 4; Sound.sfx('select'); }
    if (Input.confirm() || Input.tap) { this.page = (this.page + 1) % 4; Sound.sfx('select'); }
    if (Input.cancel()) { Sound.sfx('cancel'); Game.skipPress = true; Game.go('title'); }
  },
  render(c) {
    starBg(c, this.t, '#0c0c2c', '#101040');
    panel(c, 8, 8, 240, 190, '#101040');
    const L = (s, y, col) => jp(c, s, 20, y, col || '#fcfcfc');
    if (this.page === 0) {
      jp(c, 'そうさ（キーボード）', 128, 16, '#fcd838', { align: 'c' });
      [['いどう', 'WASD  /  やじるし'], ['パンチ', 'Z  J  F'], ['キック', 'X  K  G'], ['ジャンプ', 'うえ'], ['しゃがむ', 'した（たかい こうげきを よける）'], ['ガード', 'うしろ を おしつづける']]
        .forEach(([a, b], i) => { jp(c, a, 20, 36 + i * 16, '#a4e4fc'); jp(c, b, 84, 36 + i * 16, '#fcfcfc'); });
      jp(c, 'ひっさつわざ', 20, 134, '#fcd838');
      jp(c, '→ + A / B    ↓ + A / B', 20, 150, '#fcfcfc');
      jp(c, 'キャラごとに 4つ。キャラ選択で見られるよ', 20, 166, '#bcbcbc');
    } else if (this.page === 1) {
      jp(c, '2P たいせん / スマホ', 128, 16, '#fcd838', { align: 'c' });
      L('1P: WASD ＋ F G', 40, '#fc7460'); L('2P: やじるし ＋ , .（カンマ ピリオド）', 56, '#3cbcfc');
      L('ゲームパッドも つかえるよ', 76, '#bcbcbc');
      L('スマホ: がめんの 十字 と A・B', 100); L('ポーズ: Enter / P / 右上の ||', 116); L('おと: M で ON/OFF', 132);
      L('ジャンプ中に A / B で ジャンプこうげき', 156, '#bcbcbc');
    } else if (this.page === 3) {
      jp(c, 'オンライン たいせん', 128, 16, '#fcd838', { align: 'c' });
      L('1. ひとりが「へやを つくる」', 38, '#fc7460'); L('   → 4もじの コードが でるよ', 52);
      L('2. もうひとりが「コードで はいる」', 74, '#3cbcfc'); L('   → コードを いれて「つなぐ」', 88);
      L('3. おたがい キャラを えらんで スタート', 110);
      L('ひとりが 作った「しょうたいリンク」を', 134, '#bcbcbc'); L('LINEなどで おくると ワンタッチで はいれる', 148, '#bcbcbc');
      L('どうしても つながらない時は ページを', 170, '#bcbcbc'); L('ひらきなおして もういちど！', 184, '#bcbcbc');
    } else {
      jp(c, 'ルール', 128, 16, '#fcd838', { align: 'c' });
      L('2本先取。60秒で 決着しなければ', 40); L('体力が多い ほうの かち。', 56);
      L('こうげき中は ガードできないよ。', 80); L('うしろ入力で ガード（ダメージ 少）', 96);
      L('とびどうぐは 画面に 1つずつ。', 120); L('おなじ とびどうぐ どうしは 相殺。', 136);
      L('5ヒットすると 相手は ふっとぶよ。', 160, '#bcbcbc');
    }
    text5(c, (this.page + 1) + '/4', 128, 200, '#6c6cac', 1, { align: 'c' });
    jp(c, 'A:つぎ  B:もどる', 128, 208, '#a4e4fc', { align: 'c', shadow: true });
  },
};

/* ============================================================
   オンライン：へやを つくる / コードで はいる
   ============================================================ */
const SceneOnline = {
  enter(p) {
    this.t = 0; this.sel = 0; this.state = 'menu'; this.msg = ''; this.code = '';
    Input.mode = 'solo'; Sound.bgm('title');
    Net.reset(); Net.setListener((m) => this.onNet(m));
    this.showLobby(false, false);
    if (p && p.join) this.startJoin(p.join);
  },
  showLobby(input, copy) {
    const L = document.getElementById('lobby'); if (!L) return;
    L.hidden = !(input || copy);
    document.getElementById('roomInputRow').hidden = !input;
    document.getElementById('roomCopy').hidden = !copy;
    if (window.fitScreen) window.fitScreen();
    if (input) { const el = document.getElementById('roomCode'); el.value = ''; setTimeout(() => { try { el.focus(); } catch (e) { /* 無視 */ } }, 60); }
  },
  leave() { this.showLobby(false, false); Net.reset(); Game.skipPress = true; Game.go('title'); },
  back() { this.showLobby(false, false); Net.reset(); this.state = 'menu'; this.msg = ''; },
  fail(msg) { this.state = 'error'; this.msg = msg; this.showLobby(false, false); Net.reset(); Sound.sfx('cancel'); },
  startHost() {
    this.state = 'opening';
    Net.host({ onCode: (c) => { this.code = c; this.state = 'hosting'; this.showLobby(false, true); }, onConnect: () => {}, onError: (m) => this.fail(m) });
  },
  startJoin(code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!Net.validCode(code)) { this.msg = 'コードは 4もじ（英数字）です'; return; }
    this.code = code; this.state = 'connecting'; this.msg = ''; this.showLobby(false, false);
    Net.join(code, { onConnect: () => {}, onError: (m) => this.fail(m) });
  },
  submit() { if (this.state === 'joinInput') this.startJoin(document.getElementById('roomCode').value); },
  copyLink() {
    const link = Net.inviteLink(this.code), btn = document.getElementById('roomCopy');
    const done = () => { btn.textContent = 'コピーしました'; setTimeout(() => { btn.textContent = 'しょうたいリンクを コピー'; }, 1800); };
    try { navigator.clipboard.writeText(link).then(done, () => { btn.textContent = link; }); } catch (e) { btn.textContent = link; }
  },
  onNet(m) {
    if (m.t === 'hello') {
      if (m.v !== NET_PROTOCOL) { this.fail(Net.errText('version')); return; }
      this.showLobby(false, false); Sound.sfx('confirm'); Game.go('select', { mode: 'online' });
    } else if (m.t === '_lost' && this.state !== 'error') this.fail('せつだん されました');   // すでにエラー（バージョンちがい等）なら、その文のまま
  },
  update() {
    this.t++;
    if (this.state === 'menu') {
      const items = 3, n = Input.nav();
      if (n.y) { this.sel = (this.sel + n.y + items) % items; Sound.sfx('select'); }
      let pick = -1;
      if (Input.confirm()) pick = this.sel;
      if (Input.tap) { const tp = Input.tap; for (let i = 0; i < items; i++) { const y = 86 + i * 20; if (tp.y >= y - 3 && tp.y < y + 16 && tp.x > 50 && tp.x < 206) { this.sel = i; pick = i; } } }
      if (pick === 0) { Sound.sfx('confirm'); this.startHost(); }
      else if (pick === 1) { Sound.sfx('confirm'); this.state = 'joinInput'; this.msg = ''; this.showLobby(true, false); }
      else if (pick === 2 || Input.cancel()) { Sound.sfx('cancel'); this.leave(); }
    } else if (this.state === 'error') {
      if (Input.any || Input.tap) { this.back(); Sound.sfx('select'); }
    } else if (this.state === 'hosting' || this.state === 'opening' || this.state === 'connecting') {
      if (Input.cancel()) { Sound.sfx('cancel'); this.back(); }
    } else if (this.state === 'joinInput') {
      if (Input.cancel()) { Sound.sfx('cancel'); this.back(); }     // Esc / Bボタン（入力欄にいる間のキーは無視される）
    }
  },
  render(c) {
    const fr = this.t;
    starBg(c, fr);
    R(c, 0, 0, SCREEN_W, 14, NAVY); jp(c, 'オンライン たいせん', 128, 3, '#ffffff', { align: 'c', shadow: false });
    const dots = '.'.repeat(1 + ((fr >> 4) % 3));
    if (this.state === 'menu' || this.state === 'hosting') panel(c, 28, 40, 200, 140, '#101040'); else panel(c, 28, 52, 200, 104, '#101040');
    if (this.state === 'menu') {
      ['へやを つくる（ホスト）', 'コードで はいる（ゲスト）', 'もどる'].forEach((s, i) => {
        const y = 86 + i * 20;
        if (i === this.sel) cursorMark(c, 40, y + 2, fr);
        jp(c, s, 54, y, i === this.sel ? '#fcd838' : '#fcfcfc');
      });
      jp(c, 'ともだち・きょうだいと', 128, 50, '#a4e4fc', { align: 'c' });
      jp(c, 'ネットで たたかおう！', 128, 62, '#a4e4fc', { align: 'c' });
      jpO(c, '2人とも この ページを ひらいてね', 128, 196, '#ffffff', { align: 'c' });
    } else if (this.state === 'opening') {
      jp(c, 'じゅんびちゅう' + dots, 128, 96, '#fcfcfc', { align: 'c' });
    } else if (this.state === 'hosting') {
      jp(c, 'へやの コード', 128, 52, '#a4e4fc', { align: 'c' });
      text5(c, this.code, 128, 76, '#fcd838', 5, { align: 'c', ocol: '#000' });
      jp(c, 'ともだちに この コードを', 128, 124, '#fcfcfc', { align: 'c' });
      jp(c, 'つたえてね', 128, 136, '#fcfcfc', { align: 'c' });
      jp(c, 'まっています' + dots, 128, 156, '#fcd838', { align: 'c' });
      jpO(c, 'B:やめる   下の ボタンで リンクを おくれるよ', 128, 196, '#ffffff', { align: 'c' });
    } else if (this.state === 'joinInput') {
      jp(c, 'コードを いれてね', 128, 68, '#fcfcfc', { align: 'c' });
      jp(c, '下の ボックスに 4もじ', 128, 92, '#a4e4fc', { align: 'c' });
      jp(c, '入れたら「つなぐ」', 128, 108, '#a4e4fc', { align: 'c' });
      if (this.msg) jp(c, this.msg, 128, 134, '#fc7460', { align: 'c' });
      jpO(c, 'もどる：Esc / Bボタン', 128, 196, '#ffffff', { align: 'c' });
    } else if (this.state === 'connecting') {
      jp(c, 'つないでいます' + dots, 128, 78, '#fcfcfc', { align: 'c' });
      text5(c, this.code, 128, 104, '#fcd838', 3, { align: 'c', ocol: '#000' });
      jpO(c, 'B:やめる', 128, 196, '#ffffff', { align: 'c' });
    } else if (this.state === 'error') {
      jp(c, 'つながりません', 128, 76, '#fc7460', { align: 'c' });
      String(this.msg).split('\n').forEach((s, i) => jp(c, s, 128, 104 + i * 14, '#fcfcfc', { align: 'c' }));
      jpO(c, 'なにかキーを おす', 128, 196, '#ffffff', { align: 'c' });
    }
  },
};

/* ============================================================
   キャラ選択
   ============================================================ */
const CELL = { x0: 8, y0: 16, w: 59, h: 60, gap: 2 };
const SceneSelect = {
  enter(p) {
    this.p = p; this.t = 0; this.cur = [Game.last[0], Game.last[1]]; this.step = 0; this.pick = [-1, -1]; this.go = 0;
    Input.mode = p.mode === 'versus' ? 'versus' : 'solo';
    Sound.bgm('title');
    if (p.mode === 'online') {
      this.me = Net.role === 'host' ? 0 : 1; this.started = false; this.lost = false;
      this.cur[this.me] = Game.last[0]; this.cur[1 - this.me] = this.me === 0 ? 3 : 0;
      Net.setListener((m) => this.onNet(m)); this.sendPick();
    }
  },
  /* ---- オンライン ---- */
  sendPick() { Net.send({ t: 'pick', ch: this.cur[this.me], ok: this.pick[this.me] >= 0 }); },
  onNet(m) {
    const o = 1 - this.me;
    if (m.t === 'pick') { this.cur[o] = clamp(m.ch | 0, 0, 7); this.pick[o] = m.ok ? this.cur[o] : -1; }
    else if (m.t === 'start' && this.me === 1 && !this.started) {
      this.started = true;
      const cfg = sanitizeCfg(m.cfg);
      Net.begin(cfg, 1); Game.last = [cfg.ch[1], cfg.ch[0]];
      Game.go('fight', { online: true, me: 1, chars: cfg.ch, cfg, mode: 'online', versus: true });
    } else if (m.t === 'bye' || m.t === '_lost') { this.lost = true; Sound.sfx('cancel'); }
  },
  startMatch() {
    this.started = true;
    const cfg = { ch: [this.pick[0], this.pick[1]], seed: ((Math.random() * 1e9) | 0) + 1, rounds: 2, time: 60 };
    Net.begin(cfg, 0); Net.send({ t: 'start', cfg }); Game.last = [cfg.ch[0], cfg.ch[1]];
    Game.go('fight', { online: true, me: 0, chars: cfg.ch, cfg, mode: 'online', versus: true });
  },
  updateOnline() {
    if (this.lost) { if (Input.any || Input.tap) { Net.reset(); Game.skipPress = true; Game.go('title'); } return; }
    Net.watchdog();
    const me = this.me;
    if (Input.key('Escape')) { Net.send({ t: 'bye' }); Net.reset(); Game.skipPress = true; Game.go('title'); return; }
    if (this.pick[me] >= 0) {
      if (Input.edge(0, IN.B)) { this.pick[me] = -1; Sound.sfx('cancel'); this.sendPick(); }
    } else {
      const n = Input.nav();
      if (n.x || n.y) { this.move(me, n); Sound.sfx('select'); this.sendPick(); }
      let ok = Input.confirm();
      if (Input.tap) {
        const t = Input.tap;
        for (let i = 0; i < 8; i++) { const q = this.cellPos(i); if (t.x >= q.x && t.x < q.x + CELL.w && t.y >= q.y && t.y < q.y + CELL.h) { if (this.cur[me] === i) ok = true; else { this.cur[me] = i; Sound.sfx('select'); this.sendPick(); } } }
      }
      if (ok) { this.pick[me] = this.cur[me]; Sound.sfx('confirm'); this.sendPick(); }
    }
    if (!this.started && this.me === 0 && this.pick[0] >= 0 && this.pick[1] >= 0) this.startMatch();
  },
  cellPos(i) { return { x: CELL.x0 + (i % 4) * (CELL.w + CELL.gap), y: CELL.y0 + ((i / 4) | 0) * (CELL.h + CELL.gap) }; },
  move(k, n) {
    let i = this.cur[k], col = i % 4, row = (i / 4) | 0;
    if (n.x) col = (col + n.x + 4) % 4;
    if (n.y) row = 1 - row;
    this.cur[k] = row * 4 + col;
  },
  start(a, b, lvl, extra) {
    Game.last = [a, b];
    Game.go('fight', Object.assign({ chars: [a, b], versus: this.p.mode === 'versus', lvl, mode: this.p.mode }, extra || {}));
  },
  update() {
    this.t++;
    const mode = this.p.mode;
    if (mode === 'online') { this.updateOnline(); return; }
    if (Input.cancel() && mode !== 'versus' || (mode === 'versus' && Input.key('Escape'))) {
      if (this.step === 1 && mode === 'vs') { this.step = 0; Sound.sfx('cancel'); return; }
      Sound.sfx('cancel'); Game.skipPress = true; Game.go('title'); return;
    }
    if (this.go > 0) { this.go--; if (this.go === 0) this.launch(); return; }
    if (mode === 'versus') {
      for (let k = 0; k < 2; k++) {
        if (this.pick[k] >= 0) { if (Input.edge(k, IN.B)) { this.pick[k] = -1; Sound.sfx('cancel'); } continue; }
        const e = (b) => Input.edge(k, b);
        const n = { x: (e(IN.RIGHT) ? 1 : 0) - (e(IN.LEFT) ? 1 : 0), y: (e(IN.DOWN) ? 1 : 0) - (e(IN.UP) ? 1 : 0) };
        if (n.x || n.y) { this.move(k, n); Sound.sfx('select'); }
        if (e(IN.A) || (k === 0 && Input.key('Enter'))) { this.pick[k] = this.cur[k]; Sound.sfx('confirm'); }
      }
      if (this.pick[0] >= 0 && this.pick[1] >= 0) this.go = 40;
      return;
    }
    const k = this.step;               // 0: 自分  1: 相手（VS CPU）
    const n = Input.nav();
    if (n.x || n.y) { this.move(k, n); Sound.sfx('select'); }
    if (Input.tap) {
      const t = Input.tap;
      for (let i = 0; i < 8; i++) { const p = this.cellPos(i); if (t.x >= p.x && t.x < p.x + CELL.w && t.y >= p.y && t.y < p.y + CELL.h) { if (this.cur[k] === i) this.decide(); else { this.cur[k] = i; Sound.sfx('select'); } } }
    }
    if (Input.confirm()) this.decide();
  },
  decide() {
    Sound.sfx('confirm');
    if (this.p.mode === 'vs' && this.step === 0) { this.step = 1; return; }
    this.pick[0] = this.cur[0]; this.pick[1] = this.cur[1]; this.go = 30;
  },
  launch() {
    const mode = this.p.mode;
    if (mode === 'arcade') {
      const me = this.cur[0], others = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => i !== me);
      for (let i = others.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = others[i]; others[i] = others[j]; others[j] = t; }
      const ladder = others.map((ch, i) => ({ ch, lvl: [0, 0, 1, 1, 2, 2, 3][i] }));
      Game.arcade = { me, ladder, idx: 0 };
      Game.last = [me, ladder[0].ch];
      Game.go('fight', { chars: [me, ladder[0].ch], lvl: ladder[0].lvl, mode: 'arcade', versus: false, stageNo: 1 });
    } else if (mode === 'vs') this.start(this.pick[0], this.pick[1], Game.level);
    else this.start(this.pick[0], this.pick[1], 0, { versus: true });
  },
  drawCell(c, i) {
    const p = this.cellPos(i), C = CHARS[i], fr = this.t;
    const stCol = { factory: '#ffc888', castle: '#9cd0fc', aso: '#a8e090', balloon: '#8cc4fc', mathlab: '#b8e8d0', ariake: '#fce0a0', storm: '#c8e0fc', live: '#fcd0e0' }[C.stage];
    R(c, p.x, p.y, CELL.w, CELL.h, '#000'); R(c, p.x + 1, p.y + 1, CELL.w - 2, CELL.h - 2, stCol);
    Dither(c, p.x + 1, p.y + 1, CELL.w - 2, CELL.h - 2, 'rgba(255,255,255,0.28)', 0);
    const sel = this.cur.includes(i);
    c.save(); c.beginPath(); c.rect(p.x + 1, p.y + 1, CELL.w - 2, CELL.h - 2); c.clip();
    const f = viewFighter(i, p.x + CELL.w / 2, 1, 'idle', null, 0, fr);
    const top = rigOf(C.key).top;                       // 頭のてっぺんの高さ
    const ground = Math.min(p.y + 3 + top, p.y + CELL.h + 4);   // 頭がセルに収まるよう足元の位置を決める
    c.translate(0, ground - FLOOR_Y);
    drawFighter(c, f, { phase: sel ? 'intro' : 'view', projs: [] }, fr + i * 5);
    c.restore();
    R(c, p.x + 1, p.y + CELL.h - 11, CELL.w - 2, 10, 'rgba(0,0,0,0.78)');
    text5(c, C.en, p.x + CELL.w / 2, p.y + CELL.h - 9, '#fcfcfc', 1, { align: 'c', outline: false });
  },
  drawPanel(c, ch, x, y, w, full, col) {
    const C = CHARS[ch];
    panel(c, x, y, w, full ? 70 : 52, '#101040', col || '#fcfcfc');
    jp(c, C.name, x + 8, y + 7, '#fcd838', { size: 8 });
    text5(c, C.en, x + w - 8, y + 9, '#a4e4fc', 1, { align: 'r' });
    jp(c, C.desc[0], x + 8, y + 20, '#fcfcfc'); jp(c, C.desc[1], x + 8, y + 30, '#fcfcfc');
    if (full) {
      const sp = [['s1', 0], ['s3', 1], ['s2', 2], ['s4', 3]];
      [C.moves.s1, C.moves.s2, C.moves.s3, C.moves.s4].forEach((mv, i) => {
        const cx = x + 8 + (i % 2) * 118, cy = y + 45 + ((i / 2) | 0) * 11;
        jp(c, mv.cmd, cx, cy, '#a4e4fc', { shadow: false }); jp(c, mv.name, cx + 17, cy, '#fcfcfc', { shadow: false });
      });
    }
  },
  render(c) {
    const mode = this.p.mode;
    starBg(c, this.t, '#0c0c2c', '#101040');
    const dual = mode === 'versus' || mode === 'online';
    const title = mode === 'online' ? 'キャラクターを えらべ（オンライン）' : mode === 'versus' ? 'キャラクターを えらべ（1P / 2P）' : this.step === 1 ? 'あいてを えらべ' : 'キャラクターを えらべ';
    R(c, 0, 0, SCREEN_W, 14, NAVY); jp(c, title, 128, 3, '#ffffff', { align: 'c', shadow: false });
    for (let i = 0; i < 8; i++) this.drawCell(c, i);
    // カーソル
    const marks = mode === 'online' ? [[0, '#fc3c3c', this.me === 0 ? 'YOU' : '1P'], [1, '#3c9cfc', this.me === 1 ? 'YOU' : '2P']] : mode === 'versus' ? [[0, '#fc3c3c', '1P'], [1, '#3c9cfc', '2P']] : this.step === 1 ? [[0, '#fc3c3c', '1P'], [1, '#3c9cfc', 'CPU']] : [[0, '#fc3c3c', '1P']];
    marks.forEach(([k, col, label]) => {
      const idx = this.cur[k], p = this.cellPos(idx), on = (this.t >> 3) & 1, fixed = this.pick[k] >= 0;
      const inset = fixed || on ? 0 : 1;
      R(c, p.x - 1 + inset, p.y - 1 + inset, CELL.w + 2 - inset * 2, 2, col); R(c, p.x - 1 + inset, p.y + CELL.h - 1 - inset, CELL.w + 2 - inset * 2, 2, col);
      R(c, p.x - 1 + inset, p.y - 1 + inset, 2, CELL.h + 2 - inset * 2, col); R(c, p.x + CELL.w - 1 - inset, p.y - 1 + inset, 2, CELL.h + 2 - inset * 2, col);
      R(c, k === 0 ? p.x : p.x + CELL.w - 17, p.y, 17, 9, col);
      text5(c, label, k === 0 ? p.x + 2 : p.x + CELL.w - 15, p.y + 1, '#fcfcfc', 1, { outline: false });
    });
    if (dual) {
      this.drawPanel(c, this.cur[0], 4, 144, 124, false, '#fc7460');
      this.drawPanel(c, this.cur[1], 128, 144, 124, false, '#3c9cfc');
      const tag = (k) => (this.pick[k] >= 0 ? 'OK!' : mode === 'online' && k !== this.me ? 'えらんでいます…' : 'A:きめる');
      jpO(c, tag(0), 8, 200, this.pick[0] >= 0 ? '#fcd838' : '#ffffff'); jpO(c, tag(1), 248, 200, this.pick[1] >= 0 ? '#fcd838' : '#ffffff', { align: 'r' });
      text5(c, mode === 'online' ? 'A:OK  B:CANCEL  ESC:LEAVE' : '1P:WASD+F/G   2P:ARROWS+,/.', 128, 214, '#ffffff', 1, { align: 'c', ocol: NAVY });
      if (mode === 'online' && this.lost) { R(c, 0, 0, SCREEN_W, SCREEN_H, 'rgba(0,0,30,0.6)'); panel(c, 40, 80, 176, 56, '#101040'); jp(c, 'あいてが いなくなりました', 128, 94, '#fcfcfc', { align: 'c' }); jp(c, 'なにかキーで タイトルへ', 128, 112, '#a4e4fc', { align: 'c' }); }
    } else {
      this.drawPanel(c, this.cur[this.step], 4, 141, 248, true, this.step === 0 ? '#fc7460' : '#3c9cfc');
      text5(c, 'A:OK  B:BACK  (TAP:SELECT)', 128, 214, '#ffffff', 1, { align: 'c', ocol: NAVY });
    }
    if (this.go > 0) { const s = this.go > 20 ? 0 : 1; if (s) R(c, 0, 0, SCREEN_W, SCREEN_H, 'rgba(255,255,255,0.35)'); }
  },
};

/* ============================================================
   対戦
   ============================================================ */
const SceneFight = {
  enter(p) {
    this.p = p; this.online = !!p.online; Input.mode = p.versus && !p.online ? 'versus' : 'solo';
    if (this.online) {
      this.m = Net.session.m; this.ai = [null, null]; this.me = p.me;
      this.stage = CHARS[p.cfg.ch[p.cfg.seed % 2]].stage;
      this.leave = false; this.lost = ''; this.stallT = 0; this.sfxFlags = {};
      Net.setListener((m) => { if (m.t === 'bye' || m.t === '_lost') this.lost = this.lost || 'bye'; else Net.pending.push(m); });
    } else {
      this.m = createMatch({ ch: p.chars, seed: (Math.random() * 1e9) | 0, rounds: 2, time: 60 });
      this.ai = [p.cpu0 ? newAI(p.lvl, (Math.random() * 1e6) | 0) : null, p.versus ? null : newAI(p.lvl, (Math.random() * 1e6) | 0)];
      this.stage = CHARS[p.chars[1]].stage;
      if (p.versus) this.stage = CHARS[p.chars[(Math.random() * 2) | 0]].stage;
    }
    this.pause = null; this.fr = 0; this.shake = 0; this.flash = 0; this.slow = 0;
    this.hud = [CHARS[p.chars[0]].stats.hp, CHARS[p.chars[1]].stats.hp];
    this.combo = { n: 0, t: 0, side: 0 }; this.round = 1; this.debrisDone = false; this.fightBanner = 0;
    FXS.length = 0; DEBRIS.length = 0;
    Sound.bgm(['fightA', 'fightB'][Object.keys(STAGES).indexOf(this.stage) % 2]);
  },
  handle(evs) {
    const m = this.m;
    for (const e of evs) {
      const x = (e.x || 0) / SP, y = FLOOR_Y - (e.y || 0) / SP;
      switch (e.t) {
        case 'snd': Sound.sfx(e.n); break;
        case 'hit':
          Sound.sfx('hit' + e.p); fxAdd('hit', x, y, { p: e.p, life: 11 });
          this.shake = Math.max(this.shake, e.p === 2 ? 5 : e.p === 1 ? 3 : 1);
          if (m.f[e.n].comboN >= 2) this.combo = { n: m.f[e.n].comboN, t: 70, side: 1 - e.n };
          break;
        case 'block': Sound.sfx('block'); fxAdd('block', x, y, { life: 8 }); break;
        case 'counter': Sound.sfx('counter'); fxAdd('counter', x, y, { life: 26 }); this.shake = 5; this.flash = 4; break;
        case 'land': fxAdd('dust', x, FLOOR_Y, { life: 10 }); Sound.sfx('land'); break;
        case 'down': fxAdd('dust', x, FLOOR_Y, { life: 12 }); Sound.sfx('down'); break;
        case 'puff': fxAdd('puff', x, FLOOR_Y, { life: 14 }); break;
        case 'burst': fxAdd('burst', x, y, { life: 10 }); Sound.sfx('burst'); this.shake = Math.max(this.shake, 2); break;
        case 'pop': fxAdd('pop', x, y, { life: 8 }); Sound.sfx('pop'); break;
        case 'clash': fxAdd('clash', x, y, { life: 9 }); Sound.sfx('clash'); break;
        case 'reflect': fxAdd('reflect', x, y, { life: 9 }); Sound.sfx('reflect'); break;
        case 'fight': this.fightBanner = 34; break;
        case 'end': if (e.why === 'ko') { Sound.sfx('ko'); this.flash = 6; this.shake = 8; } break;
        default: break;
      }
    }
  },
  openPause() { this.pause = { sel: 0, view: 'menu' }; Sound.sfx('pause'); },
  updatePause() {
    const ps = this.pause, items = ['つづける', 'わざひょう', 'キャラせんたくへ', 'タイトルへ'];
    if (ps.view === 'moves') { if (Input.confirm() || Input.cancel() || Input.tap) { ps.view = 'menu'; Sound.sfx('cancel'); } return; }
    const n = Input.nav();
    if (n.y) { ps.sel = (ps.sel + n.y + items.length) % items.length; Sound.sfx('select'); }
    if (Input.tap) { const t = Input.tap; items.forEach((s, i) => { const y = 84 + i * 18; if (t.y >= y - 3 && t.y < y + 15 && t.x > 56 && t.x < 200) { ps.sel = i; Input.hit.add('Enter'); } }); }
    if (Input.cancel() || Input.key('KeyP') || (Input.key('Enter') && ps.sel === 0)) { this.pause = null; Sound.sfx('pause'); return; }
    if (Input.confirm() || Input.key('Enter')) {
      Sound.sfx('confirm');
      if (ps.sel === 0) this.pause = null;
      else if (ps.sel === 1) ps.view = 'moves';
      else if (ps.sel === 2) { Sound.stopBgm(); Game.go('select', { mode: this.p.mode || 'vs' }); }
      else { Sound.stopBgm(); Game.skipPress = true; Game.go('title'); }
    }
  },
  update() {
    if (this.online) { this.updateOnline(); return; }
    const m = this.m;
    if (this.pause) { this.updatePause(); return; }
    this.fr++;
    if (m.phase !== 'over' && Input.pause()) { this.openPause(); return; }
    let in0 = Input.masks[0], in1 = Input.masks[1];
    if (this.ai[0]) in0 = aiInput(this.ai[0], m, 0);
    if (this.ai[1]) in1 = aiInput(this.ai[1], m, 1);
    let step = true;
    if (m.phase === 'end' && m.endWhy === 'ko' && m.pt < 54) { this.slow = (this.slow + 1) % 3; step = this.slow === 0; }
    m.events.length = 0;
    if (step) stepMatch(m, in0, in1);
    if (m.phase === 'intro') { if (m.pt === 12 && step) Sound.sfx('round'); if (m.pt === 100 && step) Sound.sfx('fight'); }
    this.handle(m.events);
    if (m.phase === 'over' && m.matchWinner >= 0 && m.pt === 1) Sound.sfx(this.ai[1] && m.matchWinner === 1 ? 'lose' : 'win');
    this.post();
  },
  /* オンライン：入力を送り合い、ロールバック同期で1フレーム進める */
  updateOnline() {
    const rb = Net.session;
    Net.watchdog();
    if (rb && rb.desync >= 0 && !this.lost) this.lost = 'desync';
    if (this.lost) { if (Input.confirm() || Input.tap) { Net.reset(); Sound.stopBgm(); Game.skipPress = true; Game.go('title'); } fxUpdate(); debrisUpdate(); return; }
    if (this.leave) {
      if (Input.confirm()) { Net.send({ t: 'bye' }); Net.reset(); Sound.stopBgm(); Game.skipPress = true; Game.go('title'); return; }
      if (Input.cancel()) { this.leave = false; Sound.sfx('cancel'); }
    } else if (Input.pause()) { this.leave = true; Sound.sfx('pause'); }
    this.fr++;
    const r = rb.tick(this.leave ? 0 : Input.masks[0]);
    Net.pump();
    this.m = rb.m;
    const m = this.m;
    this.stallT = r.stalled ? 12 : Math.max(0, this.stallT - 1);
    this.handle(r.events);
    const fl = this.sfxFlags;
    if (m.phase === 'intro') {
      if (m.pt >= 12 && !fl['r' + m.round]) { fl['r' + m.round] = 1; Sound.sfx('round'); }
      if (m.pt >= 100 && !fl['f' + m.round]) { fl['f' + m.round] = 1; Sound.sfx('fight'); }
    }
    if (m.phase === 'over' && m.matchWinner >= 0 && !fl.end) { fl.end = 1; Sound.sfx(m.matchWinner === this.me ? 'win' : 'lose'); }
    this.post();
  },
  /* オフライン・オンライン共通の後処理（演出・ゲージ・ラウンド切り替え・終了判定） */
  post() {
    const m = this.m;
    if (m.phase === 'end' && m.endWhy === 'ko' && m.pt >= 1 && !this.debrisDone) {
      this.debrisDone = true;
      m.f.forEach((f) => { if (f.st === 'ko') debrisSpawn(f, m, this.fr); });
    } else if (this.debrisDone && m.phase !== 'end' && m.phase !== 'over') { DEBRIS.length = 0; this.debrisDone = false; }   // 巻き戻しでKOが取り消された時
    fxUpdate(); debrisUpdate();
    if (this.shake > 0) this.shake--;
    if (this.flash > 0) this.flash--;
    if (this.fightBanner > 0) this.fightBanner--;
    if (this.combo.t > 0) this.combo.t--;
    for (let i = 0; i < 2; i++) { const hp = m.f[i].hp; if (this.hud[i] > hp) this.hud[i] = Math.max(hp, this.hud[i] - 0.35); else this.hud[i] = hp; }
    if (m.round !== this.round) {            // 新しいラウンドに入ったので演出をリセット
      this.round = m.round; this.debrisDone = false; FXS.length = 0; DEBRIS.length = 0; this.combo.t = 0; this.hud = [m.f[0].hp, m.f[1].hp];
    }
    if (m.phase === 'over' && m.matchWinner >= 0 && m.pt > 190) this.finish();
  },
  finish() {
    const w = this.m.matchWinner;
    if (this.online) Net.session = null;     // 以後の通信は、次の試合まで受け取らない
    Sound.stopBgm();
    Game.go('result', { p: this.p, winner: w, wins: this.m.wins.slice() });
  },
  /* ---- 描画 ---- */
  render(c) {
    const m = this.m, fr = this.fr;
    c.save();
    if (this.shake > 0) c.translate(((this.shake * 7) % 5) - 2, ((this.shake * 3) % 3) - 1);
    drawStage(c, this.stage, fr);
    // ロボ（攻撃中・やられ中を手前に）
    const order = [0, 1].sort((a, b) => (m.f[a].st === 'atk' || m.f[a].st === 'knock' ? 1 : 0) - (m.f[b].st === 'atk' || m.f[b].st === 'knock' ? 1 : 0) || a - b);
    for (const i of order) { const f = m.f[i]; if (f.st === 'ko' && this.debrisDone) continue; drawFighter(c, f, m, fr); }
    debrisDraw(c);
    for (const pr of m.projs) drawProj(c, pr, m, fr);
    drawFxList(c);
    c.restore();
    if (this.flash > 0 && this.flash % 2 === 0) R(c, 0, 0, SCREEN_W, SCREEN_H, 'rgba(255,255,255,0.55)');
    this.drawHUD(c);
    this.drawBanners(c);
    if (this.pause) this.drawPause(c);
    if (this.online) this.drawOnlineOverlay(c);
  },
  drawOnlineOverlay(c) {
    const rtt = Math.round(Net.rtt), col = !rtt ? '#ffffff' : rtt < 80 ? '#a8ffb0' : rtt < 160 ? '#fff2a8' : '#ffb0a0';
    text5(c, 'PING ' + (rtt || '--') + 'MS' + (this.stallT > 0 ? '  WAIT' : ''), 6, 214, col, 1, { ocol: NAVY });
    if (this.leave) { panel(c, 36, 84, 184, 50, '#101040'); jp(c, 'せつだん して タイトルへ？', 128, 94, '#fcfcfc', { align: 'c' }); jp(c, 'A:はい    B:いいえ', 128, 114, '#fcd838', { align: 'c' }); }
    if (this.lost) {
      R(c, 0, 0, SCREEN_W, SCREEN_H, 'rgba(0,0,30,0.6)'); panel(c, 24, 76, 208, 62, '#101040');
      jp(c, this.lost === 'desync' ? 'ずれが はっせいしました' : 'あいてとの つながりが きれました', 128, 88, '#fc7460', { align: 'c' });
      jp(c, 'なにかキーで タイトルへ', 128, 112, '#a4e4fc', { align: 'c' });
    }
  },
  drawHUD(c) {
    const m = this.m, p = this.p;
    const labels = this.online ? (this.me === 0 ? ['YOU', 'FRIEND'] : ['FRIEND', 'YOU']) : p.versus ? ['1P', '2P'] : ['1P', 'CPU'];
    for (let i = 0; i < 2; i++) {
      const f = m.f[i], C = CHARS[f.ch], max = C.stats.hp, w = 100, x0 = i === 0 ? 12 : SCREEN_W - 12 - w;
      text5(c, labels[i] + ' ' + C.en, i === 0 ? x0 : x0 + w, 5, '#fcfcfc', 1, { align: i === 0 ? 'l' : 'r' });
      R(c, x0 - 2, 14, w + 4, 11, '#000'); R(c, x0 - 1, 15, w + 2, 9, '#fcfcfc'); R(c, x0, 16, w, 7, '#601008');
      const cur = Math.round(w * f.hp / max), lag = Math.round(w * this.hud[i] / max);
      const place = (len) => (i === 0 ? x0 : x0 + w - len);
      R(c, place(lag), 16, lag, 7, '#fc7460');
      const col = f.hp / max < 0.25 ? ['#fc5c3c', '#fcb0a0', '#a81000'] : ['#fcd838', '#fcfcc0', '#c89800'];
      R(c, place(cur), 16, cur, 7, col[0]); R(c, place(cur), 16, cur, 2, col[1]); R(c, place(cur), 21, cur, 2, col[2]);
      for (let k = 0; k < m.cfg.rounds; k++) {
        const px = i === 0 ? x0 + 4 + k * 10 : x0 + w - 4 - k * 10, won = m.wins[i] > k;
        E(c, px, 33, 4, 4, '#000'); E(c, px, 33, 3, 3, won ? '#fcd838' : '#3c3c5c'); if (won) R(c, px - 1, 31, 2, 1, '#fcfcc0');
      }
    }
    const sec = Math.max(0, Math.ceil(m.timer / FPS));
    R(c, 111, 4, 34, 22, '#000'); R(c, 112, 5, 32, 20, '#fcfcfc'); R(c, 113, 6, 30, 18, '#101040');
    text5(c, String(sec).padStart(2, '0'), 128, 10, sec <= 10 && (this.fr >> 3) & 1 ? '#fc5c3c' : '#fcfcfc', 2, { align: 'c', outline: false });
    if (this.combo.t > 0) {
      const sd = this.combo.side;
      text5(c, this.combo.n + ' HIT', sd === 0 ? 10 : 246, 44, '#fcd838', 2, { align: sd === 0 ? 'l' : 'r' });
    }
  },
  drawBanners(c) {
    const m = this.m;
    if (m.phase === 'intro') {
      if (m.pt >= 10 && m.pt < 90) bannerText(c, 'ROUND ' + m.round, 80, 3, '#fcfcfc', '#000', m.pt < 16);
      if (m.pt >= 100) bannerText(c, 'FIGHT!', 78, 5, (m.pt >> 2) & 1 ? '#fc5c3c' : '#fcd838', '#000', m.pt < 108);
    } else if (m.phase === 'fight' && this.fightBanner > 0) {
      bannerText(c, 'FIGHT!', 78, 5, '#fcd838', '#000', false);
    } else if (m.phase === 'end') {
      if (m.endWhy === 'ko') { if (m.pt > 2) bannerText(c, 'K.O.', 70, 8, '#fc3c3c', '#fcfcfc', m.pt < 8); }
      else bannerText(c, m.roundWinner < 0 ? 'DRAW' : 'TIME UP', 76, 5, '#fcd838', '#000', false);
    } else if (m.phase === 'over' && m.pt > 20) {
      const w = m.roundWinner;
      if (m.matchWinner < 0) bannerText(c, w < 0 ? 'DRAW GAME' : CHARS[m.f[w].ch].en + ' WINS', 76, w < 0 ? 3 : 2, '#fcfcfc', '#000', false);
      else bannerText(c, CHARS[m.f[w].ch].en + ' WINS!', 70, 3, '#fcd838', '#000', false);
    }
  },
  drawPause(c) {
    const ps = this.pause;
    R(c, 0, 0, SCREEN_W, SCREEN_H, 'rgba(0,0,20,0.7)');
    if (ps.view === 'moves') {
      panel(c, 6, 14, 244, 196, '#101040');
      [0, 1].forEach((k) => {
        const ch = this.m.f[k].ch, x = 14 + k * 122;
        jp(c, (k === 0 ? '1P ' : this.p.versus ? '2P ' : 'CPU ') + CHARS[ch].name, x, 22, k === 0 ? '#fc7460' : '#3c9cfc');
        drawMoveList(c, ch, x, 40);
      });
      jp(c, '↑ほうこうキー ・ A/B=パンチ/キック', 128, 150, '#bcbcbc', { align: 'c', size: 8 });
      jp(c, '→A →B ↓A ↓B が ひっさつわざ', 128, 164, '#fcd838', { align: 'c', size: 8 });
      jp(c, 'A:もどる', 128, 192, '#a4e4fc', { align: 'c' });
      return;
    }
    panel(c, 52, 56, 152, 96, '#101040');
    jp(c, 'ポーズ', 128, 62, '#fcd838', { align: 'c' });
    ['つづける', 'わざひょう', 'キャラせんたくへ', 'タイトルへ'].forEach((s, i) => {
      const y = 82 + i * 16;
      if (i === ps.sel) cursorMark(c, 60, y + 2, this.fr);
      jp(c, s, 72, y, i === ps.sel ? '#fcd838' : '#fcfcfc');
    });
  },
};

/* ============================================================
   結果 / エンディング
   ============================================================ */
const SceneResult = {
  enter(p) {
    this.p = p; this.t = 0; this.sel = 0;
    const w = p.winner, mode = p.p.mode, cpuWon = !p.p.versus && w === 1;
    this.online = !!p.p.online; this.meR = false; this.themR = false; this.lost = false;
    this.win = this.online ? w === p.p.me : !cpuWon;
    this.arcade = mode === 'arcade';
    const A = Game.arcade;
    this.final = this.arcade && this.win && A && A.idx >= A.ladder.length - 1;
    if (this.arcade) {
      if (this.win) this.items = this.final ? [] : ['つぎの あいてへ'];
      else this.items = ['コンティニュー', 'あきらめる'];
    } else this.items = this.online ? ['もういちど', 'キャラせんたく', 'やめる'] : ['もういちど', 'キャラせんたく', 'タイトルへ'];
    if (this.final) { Game.go('ending', {}); return; }
    Input.mode = p.p.versus && !this.online ? 'versus' : 'solo';
    Sound.bgm(null);
    if (this.online) Net.setListener((m) => this.onNet(m));
  },
  onNet(m) {
    if (m.t === 'rematch') { this.themR = true; this.tryRematch(); }
    else if (m.t === 'toSelect') { Game.go('select', { mode: 'online' }); }
    else if (m.t === 'start' && Net.role === 'guest') {
      const cfg = sanitizeCfg(m.cfg);
      Net.begin(cfg, 1);
      Game.go('fight', { online: true, me: 1, chars: cfg.ch, cfg, mode: 'online', versus: true });
    } else if (m.t === 'bye' || m.t === '_lost') { this.lost = true; Sound.sfx('cancel'); }
  },
  tryRematch() {
    if (!(this.meR && this.themR) || Net.role !== 'host') return;
    const cfg = { ch: this.p.p.chars.slice(), seed: ((Math.random() * 1e9) | 0) + 1, rounds: 2, time: 60 };
    Net.begin(cfg, 0); Net.send({ t: 'start', cfg });
    Game.go('fight', { online: true, me: 0, chars: cfg.ch, cfg, mode: 'online', versus: true });
  },
  update() {
    this.t++;
    if (this.online) Net.watchdog();
    if (this.lost) { if (this.t >= 30 && (Input.confirm() || Input.tap)) { Net.reset(); Game.skipPress = true; Game.go('title'); } return; }
    if (this.t < 30) return;
    const n = Input.nav();
    if (n.y) { this.sel = (this.sel + n.y + this.items.length) % this.items.length; Sound.sfx('select'); }
    if (Input.tap) { const t = Input.tap; this.items.forEach((s, i) => { const y = 104 + i * 18; if (t.y >= y - 3 && t.y < y + 15 && t.x > 118) { this.sel = i; Input.hit.add('Enter'); } }); }
    if (Input.confirm()) this.choose(this.items[this.sel]);
  },
  choose(label) {
    Sound.sfx('confirm');
    const A = Game.arcade, p = this.p.p;
    if (this.online) {
      if (label === 'もういちど') { if (!this.meR) { this.meR = true; Net.send({ t: 'rematch' }); this.tryRematch(); } }
      else if (label === 'キャラせんたく') { Net.send({ t: 'toSelect' }); Game.go('select', { mode: 'online' }); }
      else { Net.send({ t: 'bye' }); Net.reset(); Game.skipPress = true; Game.go('title'); }
      return;
    }
    if (label === 'つぎの あいてへ') {
      A.idx++; const o = A.ladder[A.idx];
      Game.go('fight', { chars: [A.me, o.ch], lvl: o.lvl, mode: 'arcade', versus: false, stageNo: A.idx + 1 });
    } else if (label === 'コンティニュー') {
      const o = A.ladder[A.idx];
      Game.go('fight', { chars: [A.me, o.ch], lvl: o.lvl, mode: 'arcade', versus: false, stageNo: A.idx + 1 });
    } else if (label === 'もういちど') Game.go('fight', p);
    else if (label === 'キャラせんたく') Game.go('select', { mode: p.mode });
    else { Game.skipPress = true; Game.go('title'); }
  },
  render(c) {
    const p = this.p, m = p.p, w = p.winner;
    const fr = this.t;
    starBg(c, fr);
    grassStrip(c, FLOOR_Y);
    const wc = m.chars[w];
    const f = viewFighter(wc, 62, 1, 'win', null, 0, fr); f.i = 0;
    drawFighter(c, f, { phase: 'view', projs: [] }, fr);
    let head;
    if (this.arcade) head = this.win ? 'YOU WIN!' : 'YOU LOSE...';
    else if (this.online) head = this.win ? 'YOU WIN!' : 'YOU LOSE...';
    else head = m.versus ? (w === 0 ? '1P WIN!' : '2P WIN!') : (w === 0 ? 'YOU WIN!' : 'YOU LOSE...');
    text5(c, head, 128, 20, this.win ? '#fcd838' : '#fc7460', 3, { align: 'c' });
    jpO(c, CHARS[wc].name + ' の かち！', 128, 50, '#ffffff', { align: 'c' });
    if (this.arcade && this.win) { const A = Game.arcade; jpO(c, 'つぎは ' + CHARS[A.ladder[A.idx + 1].ch].name + ' だ！（のこり ' + (A.ladder.length - A.idx - 1) + 'にん）', 128, 66, '#fff2a8', { align: 'c' }); }
    if (this.arcade && !this.win) jpO(c, 'あきらめずに もういちど！', 128, 66, '#fff2a8', { align: 'c' });
    if (this.t >= 30) {
      const px = 118, ph = 14 + this.items.length * 18;
      panel(c, px, 96, 128, ph, '#101040');
      this.items.forEach((s, i) => { const y = 104 + i * 18; if (i === this.sel) cursorMark(c, px + 8, y + 2, fr); jp(c, s, px + 22, y, i === this.sel ? '#fcd838' : '#fcfcfc'); });
      if (this.online) {
        const msg = this.meR && !this.themR ? 'あいての へんじを まっています…' : this.themR && !this.meR ? 'あいては もういちど したいって！' : '';
        if (msg) jpO(c, msg, 128, 170, '#fff2a8', { align: 'c' });
        text5(c, 'PING ' + (Math.round(Net.rtt) || '--') + 'MS', 6, 214, '#ffffff', 1, { ocol: NAVY });
      }
      if (this.lost) { R(c, 0, 0, SCREEN_W, SCREEN_H, 'rgba(0,0,30,0.6)'); panel(c, 24, 80, 208, 54, '#101040'); jp(c, 'あいてが いなくなりました', 128, 92, '#fc7460', { align: 'c' }); jp(c, 'なにかキーで タイトルへ', 128, 112, '#a4e4fc', { align: 'c' }); }
    }
  },
};
const SceneEnding = {
  enter() { this.t = 0; Sound.bgm('title'); Input.mode = 'solo'; this.me = Game.arcade ? Game.arcade.me : 0; },
  update() { this.t++; if (this.t > 120 && (Input.confirm() || Input.tap)) { Sound.sfx('confirm'); Game.skipPress = true; Game.go('title'); } },
  render(c) {
    const fr = this.t;
    starBg(c, fr, '#0c0c2c', '#18184c');
    text5(c, 'ALL CLEAR!', 128, 14, '#fcd838', 3, { align: 'c' });
    jpO(c, 'ぜんいん たおした！おめでとう！', 128, 42, '#ffffff', { align: 'c' });
    jpO(c, CHARS[this.me].name + ' は さいきょうの ロボだ', 128, 58, '#fff2a8', { align: 'c' });
    ['きょうだいで また あそぼう！', 'こんどは オンラインで…'].forEach((s, i) => jpO(c, s, 128, 80 + i * 14, '#ffffff', { align: 'c' }));
    // 後列4体と前列4体
    grassStrip(c, FLOOR_Y + 6);
    for (let row = 0; row < 2; row++) {
      for (let k = 0; k < 4; k++) {
        const i = row * 4 + k, x = (row === 0 ? 30 : 58) + k * 56;
        const f = viewFighter(i, x, 1, 'win', null, 0, fr + i * 5);
        c.save(); c.translate(0, row === 0 ? -14 : 6); drawFighter(c, f, { phase: 'view', projs: [] }, fr + i * 7); c.restore();
      }
    }
    if (this.t > 120 && (fr >> 5) & 1) jpO(c, 'A:タイトルへ', 128, 210, '#ffffff', { align: 'c' });
  },
};

/* 相手から届いた設定を、安全な範囲に直す（ふつうは変わらない） */
function sanitizeCfg(c) {
  c = c || {};
  const ch = Array.isArray(c.ch) ? c.ch : [0, 1];
  return { ch: [clamp(ch[0] | 0, 0, CHARS.length - 1), clamp(ch[1] | 0, 0, CHARS.length - 1)], seed: (c.seed | 0) || 1, rounds: 2, time: 60 };
}
const SCENES = { title: SceneTitle, help: SceneHelp, online: SceneOnline, select: SceneSelect, fight: SceneFight, result: SceneResult, ending: SceneEnding };
