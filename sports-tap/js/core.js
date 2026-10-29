/* スポーツ タップ記録 — 画面を持たない共通の部分（時刻・記録・名簿・集計の道具・CSV・書き出しと読み込み・種目の登録）
   「バスケ タップ記録」（basket-tap）の核を、どの種目でも使えるように切り出したもの。DOM に依存しないので node のテストからも読める。

   ■ 記録のデータ（1試合＝1つ。書き出す JSON もこの形）
   {
     format: 'sports-tap', version: 1, sport: 'soccer' など（種目の id）,
     id, title（なくてよい）, date: 'YYYY-MM-DD', createdAt,
     startedAt: スタートを押した時刻（エポックミリ秒。押す前は null）, endedAt: 終えた時刻 | null,
     tz: 記録した端末の時差（分。日本は 540）, prec: 時刻の細かさ（10 ＝ 0.1 秒・100 ＝ 0.01 秒（水泳））,
     opts: 種目ごとの試合の形式（前半の長さ・セット数・距離 など。種目の defaultOpts）,
     teams: [ 自分, 相手 ]  … { name, color, colorName, players: [{ no: '7', name: '' }] }（水泳はレーン。種目が決める）
     events: [ { id, t, type, team, no, …種目ごとの項目 } ]  … 追加した順
     videos: [ { vid, n, startedAt, endedAt, duration, name, mime, w, h, bytes } ]（この端末のカメラで撮影しながら記録したとき。なくてよい。livecam.js）
       startedAt：録画を始めた時刻（エポックミリ秒。記録の startedAt と同じ時計）→ 記録の t 秒 ＝ 動画の t ＋（startedAt(記録) − startedAt(動画)）/1000 秒
       動画の中身は、この端末のブラウザ（IndexedDB 'stap-media'。vstore.js）にだけある。書き出す JSON には、ファイル名・時刻・長さだけが入る
   }
   書き出す JSON には、記録ごとに text（呼び名）と when（場面の呼び名「前半 23:41」など）、types に scene（場面として切り出すか）も付ける。
     t   : スタートからの秒（prec の細かさ）。ストップウォッチと同じで、止まらずに進む（あとで動画と合わせられる）
     type: 種目の TYPES の id
     team: 0 = 自分・1 = 相手・null = チームなし（「★ あとで見る」など）
     no  : 背番号（文字列。'0' と '00' は別）| null（だれか分からない・チームの記録）
   ピリオド・セット・イニングなどは、記録から計算して決める（記録を直す・取り消すと、自動で正しくなる）。 */
(function (root) {
  'use strict';
  const ST = root.ST = root.ST || {};
  /* 1つの種目だけのアプリ（サッカー タップ記録 など）は、index.html で先に ST.CONFIG を置く：
     { app: 'サッカー タップ記録', only: 'soccer', key: 'ssoc'（保存のキーの頭）, db: 'ssoc-media'（撮影した動画の保存場所） } */
  ST.CONFIG = Object.assign({ app: 'スポーツ タップ記録', only: null, key: 'stap', db: 'stap-media' }, ST.CONFIG || {});
  ST.APP = ST.CONFIG.app;
  ST.FORMAT = 'sports-tap';
  ST.VERSION = 1;

  ST.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const clone = ST.clone = (o) => JSON.parse(JSON.stringify(o));

  /* 秒 → 「m:ss」（1時間以上は「h:mm:ss」）。digits：小数の桁（1 ＝ 0.1 秒・2 ＝ 0.01 秒） */
  ST.fmtTime = function (sec, digits) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const d = digits === true ? 1 : digits || 0;
    const f = Math.pow(10, d);
    if (d) sec = Math.round(sec * f) / f;
    const whole = Math.floor(sec + 1e-9);
    const h = Math.floor(whole / 3600), m = Math.floor((whole % 3600) / 60), s = whole % 60;
    const pad = (n) => String(n).padStart(2, '0');
    let out = (h ? h + ':' + pad(m) : String(m)) + ':' + pad(s);
    if (d) out += '.' + String(Math.round((sec - whole) * f)).padStart(d, '0').slice(0, d);
    return out;
  };
  /* 水泳などの記録：1:02.35（1分未満は 35.12） */
  ST.fmtRace = function (sec) {
    if (!isFinite(sec) || sec < 0) return '—';
    const c = Math.round(sec * 100);
    const m = Math.floor(c / 6000), s = Math.floor((c % 6000) / 100), cs = c % 100;
    return (m ? m + ':' + String(s).padStart(2, '0') : String(s)) + '.' + String(cs).padStart(2, '0');
  };

  /* ---------- 種目の登録 ----------
     sp/*.js が ST.addSport({ id, name, icon, family, … }) で登録し、v/*.js が ST.addView(family, { build, stats, … }) で画面を足す */
  ST.SPORTS = {};
  ST.SPORT_ORDER = [];
  const PREFERRED = ['soccer', 'volley', 'futsal', 'handball', 'tennis', 'baseball', 'rugby', 'swim'];     // 種目を選ぶ画面の並び
  const order = (id) => { const i = PREFERRED.indexOf(id); return i < 0 ? 99 : i; };
  ST.addSport = function (def) {
    if (!def || !def.id) throw new Error('種目の id がありません');
    if (!ST.SPORTS[def.id]) ST.SPORT_ORDER.push(def.id);
    ST.SPORT_ORDER.sort((a, b) => order(a) - order(b));
    def.TYPE = def.TYPE || {};
    (def.TYPES || []).forEach((d) => { def.TYPE[d.id] = d; });
    ST.SPORTS[def.id] = def;
    return def;
  };
  ST.VIEWS = {};
  ST.addView = function (family, view) { ST.VIEWS[family] = Object.assign(ST.VIEWS[family] || {}, view); return ST.VIEWS[family]; };
  ST.sportOf = (game) => ST.SPORTS[game && game.sport] || null;
  ST.typeOf = (game, type) => { const sp = ST.sportOf(game); return (sp && sp.TYPE[type]) || null; };
  /* 種目の試合の形式：そろえる（知らない値は、はじめの値に） */
  ST.cleanOpts = function (sp, o) {
    const base = sp.defaultOpts ? sp.defaultOpts() : {};
    const out = Object.assign({}, base);
    if (o && typeof o === 'object') {
      Object.keys(base).forEach((k) => {
        const v = o[k];
        if (v == null) return;
        const f = (sp.optFields || []).find((x) => x.key === k);
        if (f && f.choices && !f.choices.some(([cv]) => String(cv) === String(v))) return;
        out[k] = typeof base[k] === 'number' ? Number(v) : typeof base[k] === 'boolean' ? !!v : v;
      });
    }
    return out;
  };

  /* ユニフォームの色（よくある色） */
  ST.COLORS = [
    { name: '白', hex: '#f4f4f4' }, { name: '黒', hex: '#222222' }, { name: '赤', hex: '#d93636' }, { name: '青', hex: '#2f6fed' },
    { name: '紺', hex: '#1f2f6e' }, { name: '水色', hex: '#45b0e6' }, { name: '緑', hex: '#2e9e5b' }, { name: '黄', hex: '#f2c230' },
    { name: 'オレンジ', hex: '#f08a24' }, { name: '紫', hex: '#7d4cc9' }, { name: 'ピンク', hex: '#e86aa6' }, { name: 'グレー', hex: '#8a8f98' }
  ];
  function hexRGB(hex) { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ''); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128]; }
  ST.hexRGB = hexRGB;
  /* その色の上に載せる文字の色（黒か白の、読みやすいほう） */
  ST.inkOn = function (hex) {
    const [r, g, b] = hexRGB(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return L > 0.36 ? '#111111' : '#ffffff';
  };
  ST.nearestColorName = function (hex) {
    const [r, g, b] = hexRGB(hex);
    let best = null;
    ST.COLORS.forEach((c) => { const [r2, g2, b2] = hexRGB(c.hex); const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2; if (!best || d < best.d) best = { d, name: c.name }; });
    return best.name;
  };

  /* ---------- 背番号 ---------- */
  function toHalf(s) {
    return String(s || '').replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
      .replace(/[〜～~－ー−‐―]/g, '-').replace(/[、，,・／/\s]+/g, ' ');
  }
  ST.toHalf = toHalf;
  /* 背番号として使えるか（0〜99 と 00。'07' は 7 にそろえる） */
  ST.normNo = function (v) {
    const s = toHalf(v).trim();
    if (s === '00') return '00';
    if (!/^\d{1,2}$/.test(s)) return null;
    return String(Number(s));
  };
  ST.cmpNo = (a, b) => (Number(a) - Number(b)) || (String(a).length - String(b).length);
  ST.sortNos = (list) => list.slice().sort(ST.cmpNo);
  /* 「4-15, 23 33」「４〜１５」などを、背番号の並びにする（重なりは1つに。範囲は 0〜99） */
  ST.parseNumbers = function (text) {
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
      const n = ST.normNo(tok);
      if (n != null) out.add(n);
    });
    return ST.sortNos(Array.from(out));
  };
  /* 背番号の並びを、短い文字にする（4,5,6,7,9 → 「4-7, 9」） */
  ST.formatNumbers = function (nos) {
    const list = ST.sortNos(nos || []);
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
  /* 名簿をそろえる（番号の重なりは1つに・番号の順。keepOrder：並びを変えない（野球の打順など）） */
  function cleanPlayers(list, keepOrder) {
    const seen = new Set(), out = [];
    (list || []).forEach((p) => {
      const no = ST.normNo(p && p.no != null ? p.no : p);
      if (no == null || seen.has(no)) return;
      seen.add(no);
      const o = { no, name: String((p && p.name) || '').trim().slice(0, 12) };
      if (p && p.pos) o.pos = String(p.pos).slice(0, 6);
      out.push(o);
    });
    return keepOrder ? out : out.sort((a, b) => ST.cmpNo(a.no, b.no));
  }
  ST.cleanPlayers = cleanPlayers;
  ST.playersFromNos = function (nos, old) {
    const names = {};
    (old || []).forEach((p) => { names[p.no] = p.name; });
    return cleanPlayers(nos.map((no) => ({ no, name: names[no] || '' })));
  };

  /* ---------- 時刻 ---------- */
  ST.uid = (p) => (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function pad2(n) { return String(n).padStart(2, '0'); }
  ST.ymdAt = function (ms, tz) { const d = new Date(ms + (tz || 0) * 60000); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`; };
  ST.hmsAt = function (ms, tz) { const d = new Date(ms + (tz || 0) * 60000); return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`; };
  ST.tzText = function (tz) { const s = tz < 0 ? '-' : '+', a = Math.abs(tz || 0); return s + pad2(Math.floor(a / 60)) + ':' + pad2(a % 60); };
  ST.localTz = () => -new Date().getTimezoneOffset();

  /* ---------- 試合 ---------- */
  function blankTeam(i) { return { name: '', color: i ? '#2f6fed' : '#f4f4f4', colorName: i ? '青' : '白', players: [] }; }
  ST.blankTeam = blankTeam;
  ST.newGame = function (opts) {
    opts = opts || {};
    const sp = ST.SPORTS[opts.sport];
    if (!sp) throw new Error('種目が分かりません：' + opts.sport);
    const now = opts.now || Date.now();
    const tz = opts.tz != null ? opts.tz : ST.localTz();
    const keep = !!sp.orderedRoster;
    const teams = [0, 1].map((i) => Object.assign(blankTeam(i), clone((opts.teams || [])[i] || {})));
    teams.forEach((t) => { t.players = cleanPlayers(t.players, keep); });
    const g = { format: ST.FORMAT, version: ST.VERSION, sport: sp.id, id: opts.id || ST.uid('g'), title: opts.title || '', date: ST.ymdAt(now, tz), createdAt: now, startedAt: null, endedAt: null, tz, prec: sp.prec || 10, opts: ST.cleanOpts(sp, opts.opts), teams, events: [], seq: 0 };
    if (sp.initGame) sp.initGame(g, opts);
    return g;
  };
  /* スタートからの秒（prec の細かさ） */
  ST.round = (game, t) => { const p = (game && game.prec) || 10; return Math.round((t || 0) * p) / p; };
  ST.elapsed = function (game, now) {
    if (!game || !game.startedAt) return 0;
    const end = game.endedAt || now || Date.now();
    const p = game.prec || 10;
    return Math.max(0, Math.round((end - game.startedAt) * p / 1000) / p);
  };
  /* 時刻の順（同じ時刻なら追加した順） */
  ST.sorted = function (game) {
    return (game.events || []).map((e, i) => ({ e, i })).sort((a, b) => (a.e.t - b.e.t) || (a.i - b.i)).map((x) => x.e);
  };
  /* 記録を足す。ev：{ t, type, team, no, …種目の項目 }。戻り値：足した記録
     team が 0・1 でなければ「チームなし」（null）。ただし得点のある記録は、チームなしにできないので 0（自分） */
  ST.addEvent = function (game, ev) {
    game.seq = (game.seq || 0) + 1;
    const e = Object.assign({}, ev, { id: 'e' + game.seq, t: ST.round(game, ev.t || 0), type: ev.type });
    const d = ST.typeOf(game, ev.type);
    if (!d || !d.noTeam) {
      e.team = ev.team === 0 || ev.team === 1 ? ev.team : d && d.pts ? 0 : null;
      e.no = e.team != null && ev.no != null ? String(ev.no) : null;
    }
    game.events.push(e);
    return e;
  };
  ST.findEvent = (game, id) => (game.events || []).find((e) => e.id === id) || null;
  ST.removeEvent = function (game, id) {
    const i = (game.events || []).findIndex((e) => e.id === id);
    if (i < 0) return null;
    return game.events.splice(i, 1)[0];
  };
  /* 種目の記録の数え方：「チーム:背番号:種類」→ 回数（チームなしは「-」、番号なしは空）。「*:種類」は、その種類の全部・「T:チーム:種類」はチームごと */
  ST.tally = function (game, filter) {
    const m = {};
    (game.events || []).forEach((e) => {
      if (filter && !filter(e)) return;
      const k = (e.team == null ? '-' : e.team) + ':' + (e.no == null ? '' : e.no) + ':' + e.type;
      m[k] = (m[k] || 0) + 1;
      m['*:' + e.type] = (m['*:' + e.type] || 0) + 1;
      if (e.team != null) m['T:' + e.team + ':' + e.type] = (m['T:' + e.team + ':' + e.type] || 0) + 1;
    });
    return m;
  };

  /* ---------- 名前 ---------- */
  ST.teamName = (game, tm) => { if (tm !== 0 && tm !== 1) return ''; const t = game.teams[tm] || {}; return (t.name || '').trim() || (tm ? '相手' : '自分'); };
  ST.playerName = function (game, tm, no) {
    const p = ((game.teams[tm] || {}).players || []).find((x) => x.no === no);
    return p ? p.name : '';
  };
  ST.typeLabel = (game, e) => { const sp = ST.sportOf(game); if (sp && sp.typeLabel) return sp.typeLabel(game, e); const d = ST.typeOf(game, e.type); return d ? d.label : e.type; };
  /* 一覧・書き出しの呼び名：「#7 たけし ゴール」 */
  ST.eventText = function (game, e, withTeam) {
    const sp = ST.sportOf(game);
    if (sp && sp.eventText) { const s = sp.eventText(game, e, withTeam); if (s != null) return s; }
    const who = e.team != null && e.no != null ? `#${e.no}${ST.playerName(game, e.team, e.no) ? ' ' + ST.playerName(game, e.team, e.no) : ''}` : '';
    return [withTeam ? ST.teamName(game, e.team) : '', who, ST.typeLabel(game, e)].filter(Boolean).join(' ');
  };

  /* ---------- 得点・試合の一覧の情報 ---------- */
  ST.score = function (game) { const sp = ST.sportOf(game); return sp && sp.score ? sp.score(game) : [0, 0]; };
  ST.scoreText = function (game) {
    const sp = ST.sportOf(game);
    if (sp && sp.scoreText) return sp.scoreText(game);
    const s = ST.score(game);
    return `${s[0]} − ${s[1]}`;
  };
  ST.summary = function (game) {
    const sp = ST.sportOf(game);
    const names = sp && sp.sideNames ? sp.sideNames(game) : [ST.teamName(game, 0), ST.teamName(game, 1)];
    return { id: game.id, sport: game.sport, title: game.title || '', date: game.date, startedAt: game.startedAt, endedAt: game.endedAt, names, colors: [game.teams[0].color, game.teams[1].color], score: ST.score(game), scoreText: ST.scoreText(game), n: (game.events || []).filter((e) => !(ST.typeOf(game, e.type) || {}).meta).length, videos: (game.videos || []).filter((v) => !v.gone).length, at: Date.now() };
  };

  /* ---------- 記録の画面の並べ方（チームの行。バスケ タップ記録の planLayout と同じ考え方） ----------
     選手1人＝1行（背番号＋プレーのボタン）。画面の大きさと人数から、
       arr：2チームを左右に並べる（side）か、上下に重ねる（stack）か ／ c：チームの中を何列にするか
     を決める。ボタンの「幅」と「高さ」の小さいほうが、いちばん大きくなるもの。
     spec：行のボタンの数と幅の割合（rowSpec）。数字は css/app.css の記録の画面と合わせている */
  ST.LAYOUT = { pad: 4, gap: 6, border: 2, rpad: 4, rgap: 3, cgap: 8, bgap: 3, rmin: 30, rmax: 76, minBw: 30 };
  ST.rowSpec = function (weights) {
    const w = weights && weights.length ? weights : [1, 1, 1, 1];
    return { weights: w, k: w.length, units: w.reduce((a, b) => a + b, 0), minW: Math.min.apply(null, w) };
  };
  function rowWidths(cellW, spec) {
    const K = ST.LAYOUT, sp = spec || ST.rowSpec();
    // 背番号の欄：行の幅の 18%（ボタンが多いときは、ボタン1つ分くらいまで細くして、ボタンに幅を回す）
    const nw = Math.round(ST.clamp(Math.min(cellW * 0.18, cellW / (sp.units + 1.1) * 1.1), 34, 64));
    const bw = (cellW - nw - sp.k * K.bgap) / sp.units;
    return { nw, bw, bwMin: bw * sp.minW };
  }
  ST.planLayout = function (W, H, n, headH, spec) {
    const K = ST.LAYOUT;
    const fixed = 2 * K.border + headH + 2 * K.rpad;
    const cand = [];
    ['side', 'stack'].forEach((arr) => {
      for (let c0 = 1; c0 <= 3; c0++) {
        for (let c1 = 1; c1 <= 3; c1++) {
          const c = [c0, c1];
          if (c0 > n[0] || c1 > n[1]) continue;
          const r = [Math.ceil(n[0] / c0), Math.ceil(n[1] / c1)];
          let teamW, rowH;
          if (arr === 'side') {
            teamW = (W - 2 * K.pad - K.gap) / 2;
            rowH = r.map((ri) => (H - fixed - (ri - 1) * K.rgap) / ri);
          } else {
            teamW = W - 2 * K.pad;
            const one = (H - K.gap - 2 * fixed - (r[0] - 1 + r[1] - 1) * K.rgap) / (r[0] + r[1]);
            rowH = [one, one];
          }
          const teams = [0, 1].map((i) => {
            const cellW = (teamW - 2 * K.border - 2 * K.rpad - (c[i] - 1) * K.cgap) / c[i];
            const rw = rowWidths(cellW, spec);
            return { c: c[i], r: r[i], cellW, nw: rw.nw, bw: rw.bw, bwMin: rw.bwMin, rowH: Math.min(rowH[i], K.rmax), base: fixed + (r[i] - 1) * K.rgap };
          });
          const ease = (x) => Math.min(x.bwMin, x.rowH) + 0.15 * Math.min(Math.abs(x.bwMin - x.rowH), 30);
          const size = Math.min(...teams.map(ease));
          const wide = Math.min(...teams.map((x) => x.bwMin));
          const colCost = (size >= 34 ? 5 : 1) * (c0 - 1 + c1 - 1);
          const score = Math.min(size, 44) + 0.1 * Math.max(0, Math.min(size, 64) - 44) - colCost - (arr === 'stack' ? 1.5 : 0);
          cand.push({ arr, teams, size, wide, score, scroll: teams.some((x) => x.rowH < K.rmin) });
        }
      }
    });
    const okW = cand.filter((x) => x.wide >= K.minBw);
    const pool = okW.length ? okW : [cand.slice().sort((a, b) => b.wide - a.wide)[0]];
    return pool.sort((a, b) => b.score - a.score)[0];
  };

  /* ---------- 書き出し ---------- */
  ST.exportData = function (game) {
    const g = clone(game);
    g.format = ST.FORMAT; g.version = ST.VERSION;
    g.events = ST.sorted(game).map((e) => Object.assign({}, e));
    g.startedAtText = game.startedAt ? `${ST.ymdAt(game.startedAt, game.tz)} ${ST.hmsAt(game.startedAt, game.tz)} (UTC${ST.tzText(game.tz)})` : null;
    g.score = ST.score(game);
    g.scoreText = ST.scoreText(game);
    const sp = ST.sportOf(game);
    g.sportName = sp ? sp.name : '';
    g.types = {};
    // scene：動画の場面として切り出すもの（ピリオドの始まり・走者の手直しなどは入れない）
    if (sp) (sp.TYPES || []).forEach((d) => { g.types[d.id] = { label: d.label, short: d.short || '', pts: d.pts || 0, kind: d.kind || '', meta: !!d.meta, scene: !d.meta && d.kind !== 'adj' }; });
    if (sp && sp.exportExtra) sp.exportExtra(game, g);
    g.sideNames = sp && sp.sideNames ? sp.sideNames(game) : [ST.teamName(game, 0), ST.teamName(game, 1)];
    // 記録ごとの呼び名（text：「致遠館 #10 たけし ゴール」）と、場面の呼び名（when：「前半 23:41」「3回表」「第2セット」）。
    // ほかのアプリ（動画の編集など）が、種目のルールを知らなくても、場面に名前を付けられるように
    const byId = new Map((game.events || []).map((e) => [e.id, e]));
    g.events.forEach((e) => {
      const src = byId.get(e.id) || e;
      try { e.text = ST.eventText(game, src, true); } catch (err) { e.text = e.type; }
      let when = '';
      try { when = sp && sp.sceneText ? sp.sceneText(game, src) : sp && sp.timeText ? sp.timeText(game, src) : ''; } catch (err) { when = ''; }
      if (!when && e.set) when = `第${e.set}セット`;
      e.when = String(when || '');
    });
    g.app = ST.APP;
    delete g.seq;
    return g;
  };
  ST.safeName = (s) => String(s || '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
  ST.fileBase = function (game) {
    const sp = ST.sportOf(game);
    const hm = game.startedAt ? ST.hmsAt(game.startedAt, game.tz).slice(0, 5).replace(':', '') : '';
    const names = sp && sp.sideNames ? sp.sideNames(game) : [ST.teamName(game, 0), ST.teamName(game, 1)];
    const who = sp && sp.fileWho ? sp.fileWho(game) : ST.safeName(names[0]) + 'vs' + ST.safeName(names[1]);
    return [(sp ? sp.name : 'スポーツ') + '記録', game.date, hm, who].filter(Boolean).join('_');
  };
  function csvCell(v) { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  ST.csv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

  /* ---------- 読み込み（書き出した JSON を開き直す） ---------- */
  ST.importData = function (obj) {
    if (typeof obj === 'string') { try { obj = JSON.parse(obj); } catch (e) { throw new Error('JSON として読めませんでした'); } }
    if (!obj || typeof obj !== 'object') throw new Error('記録のファイルではないようです');
    if (obj.format !== ST.FORMAT) throw new Error(obj.format === 'basket-tap' ? 'バスケの記録です。「バスケ タップ記録」で開いてください' : '「スポーツ タップ記録」で書き出したファイルではないようです');
    const sp = ST.SPORTS[obj.sport];
    if (!sp) throw new Error('この種目は開けません：' + obj.sport);
    if (!Array.isArray(obj.events) || !Array.isArray(obj.teams)) throw new Error('記録の中身（events・teams）がありません');
    const g = ST.newGame({ sport: sp.id, id: typeof obj.id === 'string' ? obj.id.slice(0, 40) : undefined, title: String(obj.title || '').slice(0, 40), now: obj.createdAt || obj.startedAt || Date.now(), tz: isFinite(obj.tz) ? obj.tz : 540, opts: obj.opts, teams: obj.teams.slice(0, 2).map((t, i) => cleanTeam(t, i, !!sp.orderedRoster)) });
    g.date = /^\d{4}-\d{2}-\d{2}$/.test(obj.date || '') ? obj.date : g.date;
    g.startedAt = isFinite(obj.startedAt) && obj.startedAt > 0 ? obj.startedAt : null;
    g.endedAt = isFinite(obj.endedAt) && obj.endedAt > 0 ? obj.endedAt : null;
    const vids = ST.cleanVideos(obj.videos);
    if (vids.length) g.videos = vids;
    if (sp.importExtra) sp.importExtra(obj, g);
    const okId = (id) => typeof id === 'string' && /^e\d{1,7}$/.test(id);
    const used = new Set();
    let maxN = 0;
    obj.events.forEach((e) => {
      if (!e || !isFinite(e.t) || e.t < 0 || !sp.TYPE[e.type]) return;
      const clean = sp.cleanEvent ? sp.cleanEvent(e) : {};
      if (clean === null) return;
      const ev = ST.addEvent(g, Object.assign({}, clean, { t: +e.t, type: e.type, team: e.team, no: e.no != null ? ST.normNo(e.no) : null }));
      if (okId(e.id) && !used.has(e.id)) ev.id = e.id;
      while (used.has(ev.id)) ev.id = 'e' + (g.seq + used.size + 1);
      used.add(ev.id);
      maxN = Math.max(maxN, Number(ev.id.slice(1)) || 0);
    });
    g.seq = Math.max(g.seq, maxN);
    return g;
  };
  function cleanTeam(t, i, keepOrder) {
    const b = blankTeam(i);
    if (!t || typeof t !== 'object') return b;
    const color = /^#[0-9a-f]{6}$/i.test(t.color || '') ? t.color : b.color;
    return { name: String(t.name || '').trim().slice(0, 20), color, colorName: String(t.colorName || ST.nearestColorName(color)).slice(0, 8), players: cleanPlayers(t.players, keepOrder) };
  }
  ST.cleanTeam = cleanTeam;
  /* 撮影しながら記録した動画の情報をそろえる（読み込んだファイル用。形の合わないものは捨てる） */
  ST.cleanVideos = function (list) {
    return (Array.isArray(list) ? list : []).filter((v) => v && isFinite(v.startedAt) && v.startedAt > 0).slice(0, 50).map((v, i) => ({
      vid: String(v.vid || 'v' + i).slice(0, 40), n: isFinite(v.n) ? Math.round(v.n) : i + 1, startedAt: +v.startedAt,
      endedAt: isFinite(v.endedAt) ? +v.endedAt : null, duration: isFinite(v.duration) ? +v.duration : null,
      name: String(v.name || '').slice(0, 120), mime: String(v.mime || '').slice(0, 60), w: +v.w || null, h: +v.h || null, bytes: +v.bytes || null,
      status: 'done', gone: true        // 読み込んだ記録の動画は、この端末にはない（ファイル名・時刻だけ）
    }));
  };
  /* 0〜1 の割合 → 「67%」（打った数が 0 なら「—」） */
  ST.pct = (m, a) => (a ? Math.round(100 * m / a) + '%' : '—');
})(typeof window !== 'undefined' ? window : globalThis);
