/* バスケ得点クリップ — 「バスケ タップ記録」の記録を読み込んで、動画の場面（クリップ）にする
   DOM 非依存（node のテストからも読み込める）。

   記録のファイル（format: 'basket-tap'）：
     startedAt（スタートを押した時刻・エポックミリ秒）、teams（自分・相手の名前・色・名簿）、
     events: [{ id, t（スタートからの秒）, type（fg2・reb・pass など／'period' はピリオドの始まり）, team（0 自分・1 相手・null チームなし）, no（背番号）}]
     チームなし：記録の画面の下の「パスミス」「★ あとで見る」（だれのかは決めずに、時刻だけ）。チームの絞り込みでは外さない。
   くわしくは basket-tap/js/core.js の先頭。

   時刻あわせ（sync）：記録の時刻 t と、動画の時刻 v の対応を「合わせた点」anchors: [{ t, v }] で持つ。
     ふつうは1点（記録のスタート ＝ 動画の 0:42 など）。全部の記録が同じだけずれる（v = t + ずれ）。
     撮影を途中で止めた動画・つないだ動画では、止めた後の場面でもう1点合わせる。その点より後ろの記録は、その点のずれを使う。 */
(function (root) {
  'use strict';
  const BS = root.BS = root.BS || {};

  /* プレーの種類（記録のファイルに呼び名が入っていれば、そちらを使う） */
  const TYPES = {
    fg2: { label: '2P成功', short: '2P', pts: 2, made: true, grp: 'score' },
    fg3: { label: '3P成功', short: '3P', pts: 3, made: true, grp: 'score' },
    ft: { label: 'フリースロー成功', short: 'FT', pts: 1, made: true, grp: 'score' },
    fg2x: { label: '2P失敗', short: '2P×', pts: 0, grp: 'miss' },
    fg3x: { label: '3P失敗', short: '3P×', pts: 0, grp: 'miss' },
    ftx: { label: 'フリースロー失敗', short: 'FT×', pts: 0, grp: 'miss' },
    reb: { label: 'リバウンド', pts: 0, grp: 'reb' },
    ast: { label: 'アシスト', pts: 0, grp: 'ast' },
    stl: { label: 'スティール', pts: 0, grp: 'stl' },
    blk: { label: 'ブロック', pts: 0, grp: 'blk' },
    pass: { label: 'パスミス', pts: 0, grp: 'pass' },
    tov: { label: 'ミス（その他）', pts: 0, grp: 'tov' },
    foul: { label: 'ファウル', pts: 0, grp: 'foul' },
    mark: { label: '★ あとで見る', pts: 0, grp: 'mark' }
  };
  /* 絞り込みのまとまり（並び順も） */
  const GROUPS = [
    { id: 'score', label: '得点' }, { id: 'miss', label: 'シュート失敗' }, { id: 'reb', label: 'リバウンド' }, { id: 'pass', label: 'パスミス' },
    { id: 'tov', label: 'ミス（その他）' }, { id: 'stl', label: 'スティール' }, { id: 'ast', label: 'アシスト' }, { id: 'blk', label: 'ブロック' },
    { id: 'foul', label: 'ファウル' }, { id: 'mark', label: '★ あとで見る' }
  ];
  const WIN = { lead: 6, lag: 2 };      // タップした瞬間の「前 6 秒・後 2 秒」（人がタップするのは、プレーの 1〜2 秒あと）

  const periodLabel = (p) => (p <= 4 ? p + 'Q' : 'OT' + (p - 4));
  const isHex = (c) => /^#[0-9a-f]{6}$/i.test(c || '');
  function normNo(v) {
    const s = String(v == null ? '' : v).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).trim();
    if (s === '00') return '00';
    return /^\d{1,2}$/.test(s) ? String(Number(s)) : null;
  }

  /* 記録（JSON の文字・オブジェクト）→ そろえた形。合わないものは、分かる言葉の Error */
  function parse(obj, fileName) {
    if (typeof obj === 'string') { try { obj = JSON.parse(obj); } catch (e) { throw new Error('JSON として読めませんでした'); } }
    if (!obj || typeof obj !== 'object') throw new Error('記録のファイルではないようです');
    if (obj.format !== 'basket-tap') throw new Error('「バスケ タップ記録」の記録のファイルではないようです');
    if (!Array.isArray(obj.events) || !Array.isArray(obj.teams)) throw new Error('記録の中身（events・teams）がありません');
    const names = obj.types && typeof obj.types === 'object' ? obj.types : {};
    const teams = [0, 1].map((i) => {
      const t = obj.teams[i] || {};
      const color = isHex(t.color) ? t.color : i ? '#2f6fed' : '#f4f4f4';
      const players = (Array.isArray(t.players) ? t.players : []).map((p) => ({ no: normNo(p && p.no), name: String((p && p.name) || '').slice(0, 12) })).filter((p) => p.no != null);
      return { name: String(t.name || '').trim().slice(0, 20), color, colorName: String(t.colorName || '').slice(0, 8), players };
    });
    const raw = obj.events.filter((e) => e && isFinite(e.t) && e.t >= 0 && (e.type === 'period' || TYPES[e.type]));
    const periods = raw.filter((e) => e.type === 'period' && isFinite(e.period)).map((e) => ({ t: +e.t, period: Math.max(1, Math.round(e.period)) })).sort((a, b) => a.t - b.t);
    const periodAt = (t) => { let p = 1; periods.forEach((x) => { if (x.t <= t + 1e-9) p = x.period; }); return p; };
    const events = [];
    raw.forEach((e, i) => {
      const id = typeof e.id === 'string' && e.id ? e.id.slice(0, 20) : 'x' + i;
      if (e.type === 'period') { events.push({ id, t: +e.t, type: 'period', period: Math.max(1, Math.round(e.period || 1)) }); return; }
      const d = TYPES[e.type];
      const label = names[e.type] && typeof names[e.type].label === 'string' ? names[e.type].label.slice(0, 20) : d.label;
      // チームは 0・1。それ以外はチームなし（null）。ただし得点はチームなしにできないので 0（前の版の記録は、いつも 0・1）
      const team = e.team === 0 || e.team === 1 ? e.team : d.pts ? 0 : null;
      events.push({ id, t: Math.round(e.t * 10) / 10, type: e.type, team, no: team != null && e.no != null ? normNo(e.no) : null, period: isFinite(e.period) ? e.period : periodAt(e.t), label, grp: d.grp, pts: d.pts });
    });
    // id がかぶっていたら付け直す
    const seen = new Set();
    events.forEach((e, i) => { if (seen.has(e.id)) e.id = 'x' + i + '_' + e.id; seen.add(e.id); });
    events.sort((a, b) => a.t - b.t);
    if (!events.some((e) => e.type !== 'period')) throw new Error('この記録には、プレーの記録がありません');
    return {
      format: 'basket-tap', id: String(obj.id || '').slice(0, 40), title: String(obj.title || '').slice(0, 40), date: /^\d{4}-\d{2}-\d{2}$/.test(obj.date || '') ? obj.date : '',
      startedAt: isFinite(obj.startedAt) && obj.startedAt > 0 ? +obj.startedAt : null, tz: isFinite(obj.tz) ? +obj.tz : 540,
      teams, events, file: fileName ? String(fileName).slice(0, 80) : '', loadedAt: Date.now()
    };
  }

  const plays = (log) => ((log && log.events) || []).filter((e) => e.type !== 'period');
  const teamName = (log, tm) => (tm !== 0 && tm !== 1 ? '' : (log.teams[tm] && log.teams[tm].name) || (tm ? '相手' : '自分'));
  const playerName = (log, tm, no) => { const p = ((log.teams[tm] || {}).players || []).find((x) => x.no === no); return p ? p.name : ''; };
  /* 「#7 たけし 2P成功」 */
  function eventLabel(log, e, withTeam) {
    if (e.type === 'period') return `${periodLabel(e.period)} 開始`;
    const nm = e.no != null ? playerName(log, e.team, e.no) : '';
    return [withTeam && e.team != null ? teamName(log, e.team) : '', e.no != null ? '#' + e.no + (nm ? ' ' + nm : '') : '', e.label].filter(Boolean).join(' ');
  }
  function score(log, until) {
    const s = [0, 0];
    plays(log).forEach((e) => { if (e.team != null && (until == null || e.t <= until)) s[e.team] += e.pts || 0; });
    return s;
  }

  /* ---------- 時刻あわせ ---------- */
  function cleanAnchors(anchors) {
    return (anchors || []).filter((a) => a && isFinite(a.t) && isFinite(a.v)).map((a) => ({ t: +a.t, v: +a.v })).sort((a, b) => a.t - b.t);
  }
  /* 記録の時刻 t → 動画の時刻。合わせた点がなければ null */
  function toVideo(t, anchors) {
    const A = cleanAnchors(anchors);
    if (!A.length) return null;
    let a = A[0];
    for (const x of A) if (x.t <= t + 1e-9) a = x;
    return t + (a.v - a.t);
  }
  /* 合わせた点を、全部 d 秒ずらす（動画の時刻を後ろへ＝プラス） */
  const shift = (anchors, d) => cleanAnchors(anchors).map((a) => ({ t: a.t, v: Math.round((a.v + d) * 100) / 100 }));
  /* いちばん近くで効いている点を、(t, v) に置きかえる（ほかの点はそのまま。点がなければ足す） */
  function setAnchor(anchors, t, v, add) {
    const A = cleanAnchors(anchors);
    const p = { t: Math.round(t * 10) / 10, v: Math.round(v * 100) / 100 };
    if (add || !A.length) {
      const out = A.filter((a) => Math.abs(a.t - p.t) > 0.05);
      out.push(p);
      return out.sort((a, b) => a.t - b.t);
    }
    let k = 0;
    A.forEach((x, i) => { if (x.t <= t + 1e-9) k = i; });
    A[k] = p;
    return cleanAnchors(A);
  }

  /* ---------- 場面（クリップ） ----------
     filter: { teams: [自分を出すか, 相手を出すか]（チームなしの記録には効かない）, groups: { score: true, … }（なし＝全部）, players: ['0:7', …]（空＝全員） }
     win: { lead, lag } / duration：動画の長さ / off：{ id: true }（外した場面）
     戻り値 { clips: [{ id, t, at, team, no, type, label, period, t0, t1, on, n, total }], outside: 動画の外の数 } */
  function clips(log, anchors, filter, win, duration, off) {
    const out = [];
    let outside = 0;
    if (!log || !cleanAnchors(anchors).length) return { clips: out, outside };
    const f = filter || {};
    const w = Object.assign({}, WIN, win || {});
    const end = duration > 0 ? duration : Infinity;
    const ps = new Set(f.players || []);
    plays(log).forEach((e) => {
      if (f.teams && e.team != null && f.teams[e.team] === false) return;
      if (f.groups && Object.keys(f.groups).length && !f.groups[e.grp]) return;
      if (ps.size && !(e.no != null && ps.has(e.team + ':' + e.no))) return;
      const at = toVideo(e.t, anchors);
      if (at == null || at < 0 || at > end) { outside++; return; }
      out.push({ id: e.id, t: e.t, at: Math.round(at * 100) / 100, team: e.team, no: e.no, type: e.type, grp: e.grp, label: eventLabel(log, e), period: e.period, on: !(off && off[e.id]),
        t0: Math.max(0, at - w.lead), t1: Math.min(end, at + w.lag) });
    });
    out.sort((a, b) => a.at - b.at);
    out.forEach((c, i) => { c.n = i + 1; c.total = out.length; });
    return { clips: out, outside };
  }
  /* 続けて再生・書き出しの区間。外したものは入れない。
     記録の場面は、続けて起きたプレー（シュート失敗 → リバウンド など）が重なりやすいので、重なる場面は1つにつなぐ（同じところを2回見せない）。
     ただし、つないだ長さが maxLen 秒を超えるときは、つながずに、重なった分を後ろの場面から削る（1 秒より短くなるなら、つなぐ） */
  function reel(clipList, maxLen) {
    const max = maxLen || 24;
    const out = [];
    (clipList || []).filter((c) => c.on !== false).slice().sort((a, b) => a.t0 - b.t0).forEach((c) => {
      const seg = Object.assign({}, c, { ids: [c.id] });
      const prev = out[out.length - 1];
      if (prev && seg.t0 < prev.t1) {
        if (Math.max(prev.t1, seg.t1) - prev.t0 <= max || seg.t1 - prev.t1 < 1) { prev.t1 = Math.max(prev.t1, seg.t1); prev.ids.push(c.id); return; }
        seg.t0 = prev.t1;
      }
      out.push(seg);
    });
    return out;
  }

  /* 絞り込みの数（まとまりごと・選手ごと）。チームの絞り込みは効かせる */
  function counts(log, filter) {
    const f = filter || {};
    const grp = {}, players = {};
    plays(log).forEach((e) => {
      if (f.teams && e.team != null && f.teams[e.team] === false) return;
      grp[e.grp] = (grp[e.grp] || 0) + 1;
      if (e.team != null && e.no != null) { const k = e.team + ':' + e.no; players[k] = (players[k] || 0) + 1; }
    });
    return { grp, players };
  }

  /* ---------- 自動で合わせる（目安） ---------- */
  /* 自動解析で見つけた得点（動画の時刻）と、記録の得点（記録の時刻）を見比べて、いちばん多く重なるずれを探す。
     tol：何秒まで同じ得点とみなすか（人がタップするまでの遅れは、まちまちなので広め）。
     戻り値 { offset（動画の時刻 − 記録の時刻）, matched, nLog, nShots } か null（見比べられるほどの数がないとき） */
  function matchShots(log, shotTimes, tol) {
    tol = tol || 2.5;
    const A = plays(log).filter((e) => TYPES[e.type] && TYPES[e.type].made).map((e) => e.t).sort((a, b) => a - b);
    const B = (shotTimes || []).filter(isFinite).slice().sort((a, b) => a - b);
    if (A.length < 3 || B.length < 3) return null;
    // ずれ d のときに重なる数（どちらも時刻順なので、前から順に組にする）
    const score = (d) => {
      let i = 0, j = 0, m = 0, err = 0;
      while (i < A.length && j < B.length) {
        const diff = B[j] - (A[i] + d);
        if (Math.abs(diff) <= tol) { m++; err += Math.abs(diff); i++; j++; } else if (diff < 0) j++; else i++;
      }
      return { m, err };
    };
    let best = null;
    for (const a of A) for (const b of B) {
      const d = b - a;
      const s = score(d);
      if (!best || s.m > best.m || (s.m === best.m && s.err < best.err)) best = { d, m: s.m, err: s.err };
    }
    if (!best || best.m < 3 || best.m < 0.4 * Math.min(A.length, B.length)) return null;
    // 重なった組のずれの、まん中の値に寄せる
    const ds = [];
    { let i = 0, j = 0; while (i < A.length && j < B.length) { const diff = B[j] - (A[i] + best.d); if (Math.abs(diff) <= tol) { ds.push(B[j] - A[i]); i++; j++; } else if (diff < 0) j++; else i++; } }
    ds.sort((a, b) => a - b);
    const med = ds.length ? ds[ds.length >> 1] : best.d;
    const fin = score(med);
    const use = fin.m >= best.m ? { d: med, m: fin.m } : { d: best.d, m: best.m };
    return { offset: Math.round(use.d * 10) / 10, matched: use.m, nLog: A.length, nShots: B.length };
  }

  /* 動画の撮影の始まり（エポックミリ秒）を、MP4 / MOV の目次（moov の中身）から読む。
       ・iPhone などの「com.apple.quicktime.creationdate」：撮影を始めた時刻（時差つき）
       ・mvhd の作成時刻：多くのスマホは、撮影を終えた時刻（ファイルを書き終えた時刻）なので、動画の長さを引く
     戻り値 { start, how: 'apple' | 'mvhd', raw } か null */
  const EPOCH1904 = 2082844800;
  function creationTime(moov, mp4) {
    const M = mp4 || (BS.mp4);
    if (!moov || !M) return null;
    const u32 = (p) => ((moov[p] << 24) | (moov[p + 1] << 16) | (moov[p + 2] << 8) | moov[p + 3]) >>> 0;
    const four = (p) => String.fromCharCode(moov[p], moov[p + 1], moov[p + 2], moov[p + 3]);
    const top = M.boxes(moov, 0, moov.length);
    let duration = null, created = null;
    const mvhd = top.find((b) => b.type === 'mvhd');
    if (mvhd) {
      const v1 = moov[mvhd.start] === 1;
      const c = v1 ? u32(mvhd.start + 4) * 4294967296 + u32(mvhd.start + 8) : u32(mvhd.start + 4);
      const scale = v1 ? u32(mvhd.start + 20) : u32(mvhd.start + 12);
      const dur = v1 ? u32(mvhd.start + 24) * 4294967296 + u32(mvhd.start + 28) : u32(mvhd.start + 16);
      if (scale) duration = dur / scale;
      if (c > 0) created = (c - EPOCH1904) * 1000;
    }
    // Apple のメタデータ（keys と ilst。iPhone は moov/meta、ほかの道具は moov/udta/meta に置くことがある）
    let apple = null;
    const udta = top.find((b) => b.type === 'udta');
    const metas = top.filter((b) => b.type === 'meta').concat(udta ? M.boxes(moov, udta.start, udta.end).filter((b) => b.type === 'meta') : []);
    for (const meta of metas) {
      if (apple != null) break;
      // QuickTime の meta は版・フラグなし、MP4 の meta は 4 バイトの版・フラグがある
      const off = four(meta.start + 4) === 'hdlr' ? 0 : 4;
      const kids = M.boxes(moov, meta.start + off, meta.end);
      const keys = kids.find((b) => b.type === 'keys'), ilst = kids.find((b) => b.type === 'ilst');
      if (keys && ilst) {
        const n = u32(keys.start + 4);
        let p = keys.start + 8, idx = -1;
        for (let i = 1; i <= n && p + 8 <= keys.end; i++) {
          const sz = u32(p);
          if (sz < 8) break;
          let name = '';
          for (let k = p + 8; k < p + sz && k < keys.end; k++) name += String.fromCharCode(moov[k]);
          if (name === 'com.apple.quicktime.creationdate') { idx = i; break; }
          p += sz;
        }
        if (idx > 0) {
          const want = String.fromCharCode((idx >>> 24) & 255, (idx >>> 16) & 255, (idx >>> 8) & 255, idx & 255);     // ilst の中の箱の名前は、keys の何番目か（数）
          for (const item of M.boxes(moov, ilst.start, ilst.end)) {
            if (item.type !== want) continue;
            const data = M.boxes(moov, item.start, item.end).find((b) => b.type === 'data');
            if (!data) continue;
            let s = '';
            for (let k = data.start + 8; k < data.end; k++) s += String.fromCharCode(moov[k]);
            try { s = decodeURIComponent(escape(s)); } catch (e) { /* ASCII のまま */ }
            apple = parseISO(s.trim());
            if (apple != null) break;
          }
        }
      }
    }
    if (apple != null) return { start: apple, how: 'apple', duration };
    if (created != null && duration != null && created > Date.UTC(2010, 0, 1)) return { start: Math.round(created - duration * 1000), how: 'mvhd', duration };
    return null;
  }
  /* 「2026-10-19T15:30:12+0900」「…+09:00」「…Z」→ エポックミリ秒 */
  function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:[.,](\d+))?\s*(Z|[+-]\d{2}:?\d{2})?$/.exec(s || '');
    if (!m) return null;
    let ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6], m[7] ? Math.round(Number('0.' + m[7]) * 1000) : 0);
    if (m[8] && m[8] !== 'Z') {
      const sign = m[8][0] === '-' ? -1 : 1, hh = +m[8].slice(1, 3), mm = +m[8].slice(-2);
      ms -= sign * (hh * 60 + mm) * 60000;
    }
    return ms;
  }
  /* 撮影の始まりと記録のスタートから、合わせた点を作る。動画の中に入る記録がなければ null（時刻がずれている・別の試合） */
  function fromCreation(log, videoStart, duration) {
    if (!log || !log.startedAt || !isFinite(videoStart)) return null;
    const v0 = (log.startedAt - videoStart) / 1000;      // 記録の 0:00 が、動画の何秒か
    const inside = plays(log).filter((e) => { const v = e.t + v0; return v >= 0 && (!(duration > 0) || v <= duration); }).length;
    if (!inside) return null;
    return { anchors: [{ t: 0, v: Math.round(v0 * 10) / 10 }], inside, total: plays(log).length };
  }

  /* 同じブラウザの「バスケ タップ記録」が保存した試合の一覧（同じサイトなら読める） */
  function localGames(storage) {
    const ls = storage || (function () { try { return root.localStorage; } catch (e) { return null; } })();
    if (!ls) return [];
    try {
      const list = JSON.parse(ls.getItem('btap:games') || '[]');
      return (Array.isArray(list) ? list : []).filter((g) => g && g.id && g.n > 0).sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
    } catch (e) { return []; }
  }
  function localGame(id, storage) {
    const ls = storage || (function () { try { return root.localStorage; } catch (e) { return null; } })();
    if (!ls) return null;
    try { return JSON.parse(ls.getItem('btap:game:' + id) || 'null'); } catch (e) { return null; }
  }

  BS.taplog = { TYPES, GROUPS, WIN, periodLabel, parse, plays, teamName, playerName, eventLabel, score, cleanAnchors, toVideo, shift, setAnchor, clips, reel, counts, matchShots, creationTime, parseISO, fromCreation, localGames, localGame };
})(typeof window !== 'undefined' ? window : globalThis);
