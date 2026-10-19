/* バスケ タップ記録 — 画面を持たない部分（データの形・時刻・集計・CSV・読み込み）
   DOM に依存しないので、node のテストからも、バスケ得点クリップの確かめからも読み込める。

   ■ 記録のデータ（1試合＝1つ。書き出す JSON もこの形。バスケ得点クリップが読み込む）
   {
     format: 'basket-tap', version: 1,
     id, title（なくてよい）, date: 'YYYY-MM-DD',
     startedAt: スタートを押した時刻（エポックミリ秒。押す前は null）, endedAt: 終えた時刻 | null,
     tz: 記録した端末の時差（分。日本は 540）,
     teams: [ 自分, 相手 ]  … { name, color, colorName, players: [{ no: '7', name: '' }] }
     events: [ { id, t, type, team, no } ]  … 追加した順
       t   : スタートからの秒（0.1 秒まで）。ストップウォッチと同じで、止まらずに進む
       type: 下の TYPES の id。'period' はピリオドの始まり（period: 番号。team・no はなし）
       team: 0 = 自分・1 = 相手 / no: 背番号（文字列。'0' と '00' は別）| null（だれか分からない）
   }
   ピリオドは、イベントには持たせず「その時刻より前の、いちばん新しい 'period'」で決める（periodAt）。
   ピリオドを進め忘れても、あとで 'period' の時刻を直すだけで、全部の記録のピリオドが正しくなる。 */
(function (root) {
  'use strict';
  const BT = root.BT = root.BT || {};
  BT.APP = 'バスケ タップ記録';
  BT.FORMAT = 'basket-tap';
  BT.VERSION = 1;

  BT.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  /* 秒 → 「m:ss」（1時間以上は「h:mm:ss」）。tenths で 0.1 秒まで */
  BT.fmtTime = function (sec, tenths) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    if (tenths) sec = Math.round(sec * 10) / 10;
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
    const pad = (n) => String(n).padStart(2, '0');
    let out = (h ? h + ':' + pad(m) : String(m)) + ':' + pad(s);
    if (tenths) out += '.' + Math.round((sec * 10) % 10) % 10;
    return out;
  };

  /* ---------- プレーの種類 ----------
     key：ボタンの大きな文字 / sub：小さな文字 / label：記録の一覧・書き出しでの呼び名
     kind：ボタンの色分け（made 成功・miss 失敗・reb リバウンド・good よいプレー・bad ミス・foul・mark） */
  BT.TYPES = [
    { id: 'fg2', key: '2P', sub: '○ 成功', label: '2P成功', pts: 2, made: true, shot: 'fg2', kind: 'made', row: 'made' },
    { id: 'fg3', key: '3P', sub: '○ 成功', label: '3P成功', pts: 3, made: true, shot: 'fg3', kind: 'made', row: 'made' },
    { id: 'ft', key: 'FT', sub: '○ 成功', label: 'フリースロー成功', pts: 1, made: true, shot: 'ft', kind: 'made', row: 'made' },
    { id: 'fg2x', key: '2P', sub: '× 失敗', label: '2P失敗', pts: 0, made: false, shot: 'fg2', kind: 'miss', row: 'miss' },
    { id: 'fg3x', key: '3P', sub: '× 失敗', label: '3P失敗', pts: 0, made: false, shot: 'fg3', kind: 'miss', row: 'miss' },
    { id: 'ftx', key: 'FT', sub: '× 失敗', label: 'フリースロー失敗', pts: 0, made: false, shot: 'ft', kind: 'miss', row: 'miss' },
    { id: 'reb', key: 'リバウンド', sub: '', label: 'リバウンド', pts: 0, kind: 'reb', row: 'other' },
    { id: 'ast', key: 'アシスト', sub: '', label: 'アシスト', pts: 0, kind: 'good', row: 'other' },
    { id: 'stl', key: 'スティール', sub: '', label: 'スティール', pts: 0, kind: 'good', row: 'other' },
    { id: 'blk', key: 'ブロック', sub: '', label: 'ブロック', pts: 0, kind: 'good', row: 'other' },
    { id: 'pass', key: 'パスミス', sub: '', label: 'パスミス', pts: 0, kind: 'bad', row: 'other' },
    { id: 'tov', key: 'ミス', sub: 'その他', label: 'ミス（その他）', pts: 0, kind: 'bad', row: 'other' },
    { id: 'foul', key: 'ファウル', sub: '', label: 'ファウル', pts: 0, kind: 'foul', row: 'other' },
    { id: 'mark', key: '★', sub: 'あとで見る', label: '★ あとで見る', pts: 0, kind: 'mark', row: 'other' }
  ];
  BT.TYPE = {};
  BT.TYPES.forEach((d) => { BT.TYPE[d.id] = d; });
  BT.TYPE.period = { id: 'period', key: '', sub: '', label: 'ピリオド開始', pts: 0, kind: 'period', row: null };

  /* ボタンの組み合わせ（設定で、チームごとに選べる。自由に選ぶこともできる） */
  BT.PRESETS = {
    std: { name: 'ふつう', ids: ['fg2', 'fg3', 'ft', 'fg2x', 'fg3x', 'ftx', 'reb', 'pass', 'mark'] },
    full: { name: 'くわしく', ids: ['fg2', 'fg3', 'ft', 'fg2x', 'fg3x', 'ftx', 'reb', 'ast', 'stl', 'blk', 'pass', 'tov', 'foul', 'mark'] },
    score: { name: '得点だけ', ids: ['fg2', 'fg3', 'ft', 'mark'] }
  };
  /* ids をボタンの並び（成功の段・失敗の段・そのほか）に分ける。並びは TYPES の順 */
  BT.actionRows = function (ids) {
    const on = new Set(ids || []);
    const rows = { made: [], miss: [], other: [] };
    BT.TYPES.forEach((d) => { if (on.has(d.id)) rows[d.row].push(d.id); });
    return [rows.made, rows.miss, rows.other].filter((r) => r.length);
  };
  BT.presetOf = function (ids) {
    const key = (ids || []).slice().sort().join(',');
    return Object.keys(BT.PRESETS).find((k) => BT.PRESETS[k].ids.slice().sort().join(',') === key) || null;
  };

  /* ユニフォームの色（よくある色） */
  BT.COLORS = [
    { name: '白', hex: '#f4f4f4' }, { name: '黒', hex: '#222222' }, { name: '赤', hex: '#d93636' }, { name: '青', hex: '#2f6fed' },
    { name: '紺', hex: '#1f2f6e' }, { name: '水色', hex: '#45b0e6' }, { name: '緑', hex: '#2e9e5b' }, { name: '黄', hex: '#f2c230' },
    { name: 'オレンジ', hex: '#f08a24' }, { name: '紫', hex: '#7d4cc9' }, { name: 'ピンク', hex: '#e86aa6' }, { name: 'グレー', hex: '#8a8f98' }
  ];
  function hexRGB(hex) { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ''); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128]; }
  BT.hexRGB = hexRGB;
  /* その色の上に載せる文字の色（黒か白の、読みやすいほう） */
  BT.inkOn = function (hex) {
    const [r, g, b] = hexRGB(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return L > 0.36 ? '#111111' : '#ffffff';
  };
  /* 自由に選んだ色の呼び名：いちばん近い見本の色の名前 */
  BT.nearestColorName = function (hex) {
    const [r, g, b] = hexRGB(hex);
    let best = null;
    BT.COLORS.forEach((c) => { const [r2, g2, b2] = hexRGB(c.hex); const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2; if (!best || d < best.d) best = { d, name: c.name }; });
    return best.name;
  };

  /* ---------- 背番号 ---------- */
  /* 全角の数字・記号を半角に */
  function toHalf(s) {
    return String(s || '').replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
      .replace(/[〜～~－ー−‐―]/g, '-').replace(/[、，,・／/\s]+/g, ' ');
  }
  /* 背番号として使えるか（0〜99 と 00。前に 0 が付いたもの '07' は 7 にそろえる） */
  BT.normNo = function (v) {
    const s = toHalf(v).trim();
    if (s === '00') return '00';
    if (!/^\d{1,2}$/.test(s)) return null;
    return String(Number(s));
  };
  /* 並べる順：数の小さい順（'0' の次に '00'） */
  BT.cmpNo = (a, b) => (Number(a) - Number(b)) || (String(a).length - String(b).length);
  BT.sortNos = (list) => list.slice().sort(BT.cmpNo);
  /* 「4-15, 23 33」「４〜１５」などを、背番号の並びにする（重なりは1つに。範囲は 0〜99） */
  BT.parseNumbers = function (text) {
    const out = new Set();
    toHalf(text).split(' ').forEach((tok) => {
      if (!tok) return;
      const m = /^(\d{1,2})-(\d{1,2})$/.exec(tok);
      if (m) {
        let a = Number(m[1]), b = Number(m[2]);
        if (a > b) [a, b] = [b, a];
        for (let i = a; i <= b && i <= 99; i++) out.add(String(i));
        return;
      }
      const n = BT.normNo(tok);
      if (n != null) out.add(n);
    });
    return BT.sortNos(Array.from(out));
  };
  /* 背番号の並びを、短い文字にする（4,5,6,7,9 → 「4-7, 9」） */
  BT.formatNumbers = function (nos) {
    const list = BT.sortNos(nos || []);
    const out = [];
    let i = 0;
    while (i < list.length) {
      if (list[i] === '00') { out.push('00'); i++; continue; }
      let j = i;
      while (j + 1 < list.length && list[j + 1] !== '00' && Number(list[j + 1]) === Number(list[j]) + 1) j++;
      out.push(j - i >= 2 ? `${list[i]}-${list[j]}` : list.slice(i, j + 1).join(', '));
      i = j + 1;
    }
    return out.join(', ');
  };

  /* ---------- 試合 ---------- */
  BT.uid = (p) => (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function pad2(n) { return String(n).padStart(2, '0'); }
  /* エポックミリ秒 → その時差での「YYYY-MM-DD」「HH:MM:SS」（端末の時差に頼らない） */
  BT.ymdAt = function (ms, tz) { const d = new Date(ms + (tz || 0) * 60000); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`; };
  BT.hmsAt = function (ms, tz) { const d = new Date(ms + (tz || 0) * 60000); return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`; };
  BT.tzText = function (tz) { const s = tz < 0 ? '-' : '+', a = Math.abs(tz || 0); return s + pad2(Math.floor(a / 60)) + ':' + pad2(a % 60); };
  BT.localTz = () => -new Date().getTimezoneOffset();

  function blankTeam(i) { return { name: '', color: i ? '#2f6fed' : '#f4f4f4', colorName: i ? '青' : '白', players: [] }; }
  BT.blankTeam = blankTeam;

  BT.newGame = function (opts) {
    opts = opts || {};
    const now = opts.now || Date.now();
    const tz = opts.tz != null ? opts.tz : BT.localTz();
    const teams = [0, 1].map((i) => Object.assign(blankTeam(i), clone((opts.teams || [])[i] || {})));
    teams.forEach((t) => { t.players = cleanPlayers(t.players); });
    return { format: BT.FORMAT, version: BT.VERSION, id: opts.id || BT.uid('g'), title: opts.title || '', date: BT.ymdAt(now, tz), createdAt: now, startedAt: null, endedAt: null, tz, teams, events: [], seq: 0 };
  };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function cleanPlayers(list) {
    const seen = new Set(), out = [];
    (list || []).forEach((p) => {
      const no = BT.normNo(p && p.no != null ? p.no : p);
      if (no == null || seen.has(no)) return;
      seen.add(no);
      out.push({ no, name: String((p && p.name) || '').trim().slice(0, 12) });
    });
    return out.sort((a, b) => BT.cmpNo(a.no, b.no));
  }
  BT.cleanPlayers = cleanPlayers;
  /* 背番号の並びを、名簿にする（名前は、前の名簿に同じ番号があれば引き継ぐ） */
  BT.playersFromNos = function (nos, old) {
    const names = {};
    (old || []).forEach((p) => { names[p.no] = p.name; });
    return cleanPlayers(nos.map((no) => ({ no, name: names[no] || '' })));
  };

  /* スタートからの秒（0.1 秒まで） */
  BT.elapsed = function (game, now) {
    if (!game || !game.startedAt) return 0;
    const end = game.endedAt || now || Date.now();
    return Math.max(0, Math.round((end - game.startedAt) / 100) / 10);
  };

  /* 時刻の順（同じ時刻なら追加した順） */
  BT.sorted = function (game) {
    return (game.events || []).map((e, i) => ({ e, i })).sort((a, b) => (a.e.t - b.e.t) || (a.i - b.i)).map((x) => x.e);
  };
  /* その時刻のピリオド（1〜）。'period' が無ければ 1 */
  BT.periodAt = function (game, t) {
    let p = 1, best = -Infinity;
    (game.events || []).forEach((e) => { if (e.type === 'period' && e.t <= t + 1e-9 && e.t >= best) { best = e.t; p = e.period; } });
    return p;
  };
  BT.currentPeriod = (game, now) => BT.periodAt(game, BT.elapsed(game, now));
  BT.periodLabel = (p) => (p <= 4 ? p + 'Q' : 'OT' + (p - 4));

  /* イベントを足す（時刻 t は呼び出し側が決める）。戻り値：足したイベント */
  BT.addEvent = function (game, ev) {
    game.seq = (game.seq || 0) + 1;
    const e = { id: 'e' + game.seq, t: Math.round((ev.t || 0) * 10) / 10, type: ev.type };
    if (ev.type === 'period') e.period = ev.period;
    else { e.team = ev.team === 1 ? 1 : 0; e.no = ev.no != null ? String(ev.no) : null; }
    game.events.push(e);
    return e;
  };
  BT.findEvent = (game, id) => (game.events || []).find((e) => e.id === id) || null;
  BT.removeEvent = function (game, id) {
    const i = (game.events || []).findIndex((e) => e.id === id);
    if (i < 0) return null;
    return game.events.splice(i, 1)[0];
  };

  /* ---------- 「だれが」と「何を」のタップ ----------
     どちらの順でも記録できる：
       ・番号 → プレー：番号を選んでおいて、プレーを押した瞬間に記録（選んだ番号はそこで外れる）
       ・プレー → 番号：プレーを押した瞬間に記録（番号なし）。そのあと WAIT 秒以内に番号を押すと、その記録の番号になる
       ・プレーだけ  ：番号なしで記録（チームの記録になる。あとで一覧から番号を付けられる）
     記録の時刻は、いつも「プレーを押した瞬間」。選んだ番号は SEL 秒たつと外れる（選んだまま忘れて、別の人の記録に付かないように） */
  BT.WAIT = 7;
  BT.SEL = 12;
  BT.tapper = function (game) {
    const T = {
      sel: [null, null], selAt: [0, 0],          // 選んでいる番号（チームごと）と、選んだ時刻（ミリ秒）
      wait: [null, null], waitAt: [0, 0],        // 番号を待っている記録の id と、その記録の時刻（ミリ秒）
      game,
      expire(now) {
        let changed = false;
        [0, 1].forEach((tm) => {
          if (T.sel[tm] != null && now - T.selAt[tm] > BT.SEL * 1000) { T.sel[tm] = null; changed = true; }
          if (T.wait[tm] != null && (now - T.waitAt[tm] > BT.WAIT * 1000 || !BT.findEvent(T.game, T.wait[tm]))) { T.wait[tm] = null; changed = true; }
        });
        return changed;
      },
      /* 番号を押した。戻り値 { kind: 'assign'（待っていた記録に付けた）| 'select' | 'deselect', ev } */
      number(team, no, now) {
        T.expire(now);
        const wid = T.wait[team];
        if (wid != null) {
          const ev = BT.findEvent(T.game, wid);
          T.wait[team] = null;
          if (ev) { ev.no = String(no); T.sel[team] = null; return { kind: 'assign', ev }; }
        }
        if (T.sel[team] === String(no)) { T.sel[team] = null; return { kind: 'deselect' }; }
        T.sel[team] = String(no); T.selAt[team] = now;
        return { kind: 'select' };
      },
      /* プレーを押した。t：スタートからの秒。戻り値 { kind: 'record', ev, waiting（番号を待つか） } */
      action(team, type, t, now) {
        T.expire(now);
        const no = T.sel[team];
        const ev = BT.addEvent(T.game, { t, type, team, no });
        T.sel[team] = null;
        if (no == null) { T.wait[team] = ev.id; T.waitAt[team] = now; } else T.wait[team] = null;
        return { kind: 'record', ev, waiting: no == null };
      },
      clearWait(team) { T.wait[team] = null; },
      clearSel(team) { T.sel[team] = null; },
      reset() { T.sel = [null, null]; T.wait = [null, null]; }
    };
    return T;
  };

  /* ---------- 集計 ---------- */
  BT.score = function (game, until) {
    const s = [0, 0];
    (game.events || []).forEach((e) => {
      const d = BT.TYPE[e.type];
      if (d && d.pts && (until == null || e.t <= until)) s[e.team] += d.pts;
    });
    return s;
  };
  /* ピリオドごとの得点 [{ period, label, pts: [自分, 相手] }]（記録のあるピリオドと、始めたピリオド） */
  BT.periodScores = function (game) {
    const map = new Map();
    const get = (p) => { if (!map.has(p)) map.set(p, { period: p, label: BT.periodLabel(p), pts: [0, 0] }); return map.get(p); };
    (game.events || []).forEach((e) => {
      if (e.type === 'period') { get(e.period); return; }
      const d = BT.TYPE[e.type];
      const row = get(BT.periodAt(game, e.t));
      if (d && d.pts) row.pts[e.team] += d.pts;
    });
    if (!map.size) get(1);
    return Array.from(map.values()).sort((a, b) => a.period - b.period);
  };
  /* オフェンスリバウンドか：その少し前（10 秒以内・間にリバウンドがない）の外れたシュートが、同じチームのもの */
  BT.offensiveRebounds = function (game) {
    const set = new Set();
    let lastMiss = null;
    BT.sorted(game).forEach((e) => {
      const d = BT.TYPE[e.type];
      if (!d || e.type === 'period') return;
      if (d.shot && !d.made) { lastMiss = e; return; }
      if (e.type === 'reb') {
        if (lastMiss && e.t - lastMiss.t <= 10 && lastMiss.team === e.team) set.add(e.id);
        lastMiss = null;
        return;
      }
      if (d.shot && d.made) lastMiss = null;
    });
    return set;
  };
  const STAT_KEYS = ['pts', 'fg2m', 'fg2a', 'fg3m', 'fg3a', 'ftm', 'fta', 'reb', 'oreb', 'ast', 'stl', 'blk', 'pass', 'tov', 'foul', 'mark'];
  BT.STAT_KEYS = STAT_KEYS;
  function zero() { const o = {}; STAT_KEYS.forEach((k) => { o[k] = 0; }); return o; }
  /* 選手ごとの集計：[{ team, rows: [{ no, name, s }], unknown: s（番号なし）, total: s }]（rows は名簿の番号＋記録にある番号） */
  BT.stats = function (game) {
    const oreb = BT.offensiveRebounds(game);
    return [0, 1].map((tm) => {
      const team = game.teams[tm] || blankTeam(tm);
      const byNo = new Map();
      team.players.forEach((p) => byNo.set(p.no, { no: p.no, name: p.name, s: zero() }));
      const unknown = zero(), total = zero();
      (game.events || []).forEach((e) => {
        if (e.type === 'period' || e.team !== tm) return;
        let s = unknown;
        if (e.no != null) {
          if (!byNo.has(e.no)) byNo.set(e.no, { no: e.no, name: '', s: zero(), extra: true });
          s = byNo.get(e.no).s;
        }
        [s, total].forEach((x) => add(x, e, oreb));
      });
      const rows = Array.from(byNo.values()).sort((a, b) => BT.cmpNo(a.no, b.no));
      return { team: tm, rows, unknown, total };
    });
  };
  function add(s, e, oreb) {
    const d = BT.TYPE[e.type];
    if (!d) return;
    s.pts += d.pts || 0;
    if (d.shot === 'fg2') { s.fg2a++; if (d.made) s.fg2m++; }
    else if (d.shot === 'fg3') { s.fg3a++; if (d.made) s.fg3m++; }
    else if (d.shot === 'ft') { s.fta++; if (d.made) s.ftm++; }
    else if (e.type === 'reb') { s.reb++; if (oreb.has(e.id)) s.oreb++; }
    else if (s[e.type] != null) s[e.type]++;
  }
  BT.pct = (m, a) => (a ? Math.round(100 * m / a) + '%' : '—');
  BT.isEmpty = (s) => STAT_KEYS.every((k) => !s[k]);

  /* ---------- 名前 ---------- */
  BT.teamName = (game, tm) => { const t = game.teams[tm] || {}; return (t.name || '').trim() || (tm ? '相手' : '自分'); };
  BT.playerName = function (game, tm, no) {
    const p = ((game.teams[tm] || {}).players || []).find((x) => x.no === no);
    return p ? p.name : '';
  };
  /* 一覧・書き出しの呼び名：「#7 たけし 2P成功」「1Q 開始」 */
  BT.eventText = function (game, e, withTeam) {
    if (e.type === 'period') return `${BT.periodLabel(e.period)} 開始`;
    const d = BT.TYPE[e.type] || { label: e.type };
    const who = e.no != null ? `#${e.no}${BT.playerName(game, e.team, e.no) ? ' ' + BT.playerName(game, e.team, e.no) : ''}` : '';
    return [withTeam ? BT.teamName(game, e.team) : '', who, d.label].filter(Boolean).join(' ');
  };

  /* ---------- 書き出し ---------- */
  /* JSON（ほかのアプリが読めるよう、ピリオドと種類の呼び名も付ける） */
  BT.exportData = function (game) {
    const g = clone(game);
    g.format = BT.FORMAT; g.version = BT.VERSION;
    g.events = BT.sorted(game).map((e) => {
      const o = Object.assign({}, e);
      if (e.type !== 'period') o.period = BT.periodAt(game, e.t);
      return o;
    });
    g.startedAtText = game.startedAt ? `${BT.ymdAt(game.startedAt, game.tz)} ${BT.hmsAt(game.startedAt, game.tz)} (UTC${BT.tzText(game.tz)})` : null;
    g.score = BT.score(game);
    g.types = {};
    BT.TYPES.forEach((d) => { g.types[d.id] = { label: d.label, pts: d.pts }; });
    g.app = BT.APP;
    delete g.seq;
    return g;
  };
  /* ファイル名に使える文字だけに */
  BT.safeName = (s) => String(s || '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
  BT.fileBase = function (game) {
    const hm = game.startedAt ? BT.hmsAt(game.startedAt, game.tz).slice(0, 5).replace(':', '') : '';
    return ['バスケ記録', game.date, hm, BT.safeName(BT.teamName(game, 0)) + 'vs' + BT.safeName(BT.teamName(game, 1))].filter(Boolean).join('_');
  };
  function csvCell(v) { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function csv(rows) { return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'; }
  /* 記録の一覧（CSV）。Excel で文字化けしないよう、先頭の BOM は呼び出し側で付ける */
  BT.eventsCSV = function (game) {
    const rows = [['No', '時刻', 'スタートからの秒', 'ピリオド', 'チーム', '背番号', '名前', 'プレー', '得点', `${BT.teamName(game, 0)}の得点`, `${BT.teamName(game, 1)}の得点`]];
    const s = [0, 0];
    let n = 0;
    BT.sorted(game).forEach((e) => {
      if (e.type === 'period') { rows.push(['', BT.fmtTime(e.t), e.t, BT.periodLabel(e.period), '', '', '', `${BT.periodLabel(e.period)} 開始`, '', s[0], s[1]]); return; }
      const d = BT.TYPE[e.type] || { label: e.type, pts: 0 };
      s[e.team] += d.pts || 0;
      rows.push([++n, BT.fmtTime(e.t), e.t, BT.periodLabel(BT.periodAt(game, e.t)), BT.teamName(game, e.team), e.no != null ? e.no : '', e.no != null ? BT.playerName(game, e.team, e.no) : '', d.label, d.pts || '', s[0], s[1]]);
    });
    return csv(rows);
  };
  /* 選手ごとの集計（CSV） */
  BT.boxCSV = function (game) {
    const head = ['チーム', '背番号', '名前', '得点', '2P成功', '2P試投', '3P成功', '3P試投', 'FT成功', 'FT試投', 'リバウンド', 'うちオフェンス', 'アシスト', 'スティール', 'ブロック', 'パスミス', 'ミス（その他）', 'ファウル', '★'];
    const keys = ['pts', 'fg2m', 'fg2a', 'fg3m', 'fg3a', 'ftm', 'fta', 'reb', 'oreb', 'ast', 'stl', 'blk', 'pass', 'tov', 'foul', 'mark'];
    const rows = [head];
    BT.stats(game).forEach((st) => {
      const name = BT.teamName(game, st.team);
      st.rows.forEach((r) => rows.push([name, r.no, r.name, ...keys.map((k) => r.s[k])]));
      if (!BT.isEmpty(st.unknown)) rows.push([name, '番号なし', '', ...keys.map((k) => st.unknown[k])]);
      rows.push([name, '合計', '', ...keys.map((k) => st.total[k])]);
    });
    return csv(rows);
  };

  /* ---------- 読み込み（書き出した JSON を開き直す） ----------
     形が合わないものは、分かる言葉の Error にする */
  BT.importData = function (obj) {
    if (typeof obj === 'string') { try { obj = JSON.parse(obj); } catch (e) { throw new Error('JSON として読めませんでした'); } }
    if (!obj || typeof obj !== 'object') throw new Error('記録のファイルではないようです');
    if (obj.format !== BT.FORMAT) throw new Error('「バスケ タップ記録」で書き出したファイルではないようです');
    if (!Array.isArray(obj.events) || !Array.isArray(obj.teams)) throw new Error('記録の中身（events・teams）がありません');
    const g = BT.newGame({ id: typeof obj.id === 'string' ? obj.id.slice(0, 40) : undefined, title: String(obj.title || '').slice(0, 40), now: obj.createdAt || obj.startedAt || Date.now(), tz: isFinite(obj.tz) ? obj.tz : 540, teams: obj.teams.slice(0, 2).map(cleanTeam) });
    g.date = /^\d{4}-\d{2}-\d{2}$/.test(obj.date || '') ? obj.date : g.date;
    g.startedAt = isFinite(obj.startedAt) && obj.startedAt > 0 ? obj.startedAt : null;
    g.endedAt = isFinite(obj.endedAt) && obj.endedAt > 0 ? obj.endedAt : null;
    // 記録の id は、そのまま使えるもの（e＋数・重ならない）は残し、そうでないものに新しい番号を付ける
    const okId = (id) => typeof id === 'string' && /^e\d{1,7}$/.test(id);
    g.seq = obj.events.reduce((m, e) => Math.max(m, e && okId(e.id) ? Number(e.id.slice(1)) : 0), 0);
    const used = new Set();
    obj.events.forEach((e) => {
      if (!e || !isFinite(e.t) || e.t < 0) return;
      let ev = null;
      if (e.type === 'period') { if (isFinite(e.period) && e.period >= 1) ev = BT.addEvent(g, { t: e.t, type: 'period', period: Math.min(20, Math.round(e.period)) }); }
      else if (BT.TYPE[e.type]) ev = BT.addEvent(g, { t: e.t, type: e.type, team: e.team, no: e.no != null ? BT.normNo(e.no) : null });
      if (!ev) return;
      if (okId(e.id) && !used.has(e.id)) { g.seq--; ev.id = e.id; }      // addEvent が進めた番号を戻す
      while (used.has(ev.id)) ev.id = 'e' + (++g.seq);
      used.add(ev.id);
    });
    g.seq = g.events.reduce((m, e) => Math.max(m, Number(e.id.slice(1)) || 0), g.seq);
    return g;
  };
  /* 読み込んだチームの形をそろえる（名前・色・名簿） */
  function cleanTeam(t, i) {
    const b = blankTeam(i);
    if (!t || typeof t !== 'object') return b;
    const color = /^#[0-9a-f]{6}$/i.test(t.color || '') ? t.color : b.color;
    return { name: String(t.name || '').trim().slice(0, 20), color, colorName: String(t.colorName || BT.nearestColorName(color)).slice(0, 8), players: cleanPlayers(t.players) };
  }
  BT.cleanTeam = cleanTeam;

  /* 試合の一覧に出す短い情報 */
  BT.summary = function (game) {
    return { id: game.id, title: game.title || '', date: game.date, startedAt: game.startedAt, endedAt: game.endedAt, names: [BT.teamName(game, 0), BT.teamName(game, 1)], colors: [game.teams[0].color, game.teams[1].color], score: BT.score(game), n: (game.events || []).filter((e) => e.type !== 'period').length, at: Date.now() };
  };
})(typeof window !== 'undefined' ? window : globalThis);
