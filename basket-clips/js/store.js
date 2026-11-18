/* バスケ得点クリップ — 保存（このブラウザの中だけ。動画そのものは保存しない）
   動画ごとに「チームの色・ゴールの指定・解析の結果・手直し」と「読み込んだ記録（バスケ タップ記録）・時刻あわせ・絞り込み」を覚えておき、
   同じ動画を開き直すと続きから使える。
   動画の見分けは「ファイル名・大きさ・更新日時」。 */
(function (root) {
  'use strict';
  const BS = root.BS;
  const PREFIX = 'bclip:v1:';
  const INDEX = 'bclip:index';
  const PREFS = 'bclip:prefs';
  const BOOK = 'bclip:notebook';      // コメント帳（動画ごとのコメント・スタンプ。動画の結果を消しても残す）
  const KEEP = 30;          // 覚えておく動画の数（古いものから消す）

  function ls() { try { return root.localStorage || null; } catch (e) { return null; } }
  function readJSON(k) { const s = ls(); if (!s) return null; try { const v = s.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeJSON(k, v) { const s = ls(); if (!s) return false; try { s.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  function videoKey(file) {
    if (!file) return null;
    if (typeof file === 'string') return 'url:' + file;
    return [file.name, file.size, file.lastModified || 0].join('|');
  }

  /* タップ記録の1場面の長さ（はじめ）：ふつう 前 10・後 2、リバウンド・★ は前 5（by：プレーのまとまりごと） */
  function logWinDefault() {
    const T = BS.taplog;
    return T ? { lead: T.WIN.lead, lag: T.WIN.lag, by: JSON.parse(JSON.stringify(T.WIN_BY)) } : { lead: 10, lag: 2, by: {} };
  }
  /* 保存してあった長さをそろえる。前の版（プレーごとの by がない）で、はじめのまま（前 6・後 2）なら、新しいはじめに。
     変えていたら、それを「ふつう」にして、プレーごとのはじめ（リバウンド・★）を足す */
  function fixLogWin(w) {
    const d = logWinDefault();
    if (!w || typeof w !== 'object') return d;
    const num = (v, def) => (isFinite(v) && v >= 0 ? +v : def);
    if (!w.by || typeof w.by !== 'object') {
      if (+w.lead === 6 && +w.lag === 2) return d;
      return { lead: num(w.lead, d.lead), lag: num(w.lag, d.lag), by: d.by };
    }
    const by = {};
    Object.keys(w.by).forEach((g) => { const b = w.by[g]; if (b && isFinite(b.lead) && isFinite(b.lag)) by[g] = { lead: num(b.lead, d.lead), lag: num(b.lag, d.lag) }; });
    return { lead: num(w.lead, d.lead), lag: num(w.lag, d.lag), by };
  }
  /* 前回のチームの色・クリップの長さ（次の動画でも同じにする） */
  function prefs() {
    const p = Object.assign({
      teams: [{ color: '#f4f4f4', colorName: '白', name: '' }, { color: '#2f6fed', colorName: '青', name: '' }],
      win: { lead: BS.clips.WIN.lead, lag: BS.clips.WIN.lag }, captions: true
    }, readJSON(PREFS) || {});
    p.logWin = fixLogWin(p.logWin);
    return p;
  }
  function savePrefs(st) { writeJSON(PREFS, { teams: st.teams, win: st.win, captions: st.captions, logWin: st.logWin }); }

  function fresh() {
    const p = prefs();
    return {
      v: 1, teams: JSON.parse(JSON.stringify(p.teams)), hoops: [null, null], hoopTeam: [0, 1], fixed: false,
      halfT: null, halfNo: null, result: null, edits: BS.clips.emptyEdits(), win: Object.assign({}, p.win), captions: p.captions !== false,
      // 記録（バスケ タップ記録）：log＝読み込んだ記録、sync＝時刻あわせ { anchors: [{ t, v }], how }、logView＝絞り込み、logWin＝1場面の長さ、logOff＝外した場面
      log: null, sync: null, logView: { teams: [true, true], groups: {}, players: [] }, logWin: JSON.parse(JSON.stringify(p.logWin)), logOff: {},
      logAdds: [],         // 自分で足した場面（動画の秒で持つ。時刻あわせを変えても動かない）
      notes: [], noteBurn: true, name: ''      // コメント・スタンプ（notes.js）・書き出す動画に入れるか・動画のファイル名（コメント帳に出す）
    };
  }

  function load(key) {
    if (!key) return null;
    const st = readJSON(PREFIX + key);
    if (!st || st.v !== 1) return null;
    const base = fresh();
    const out = Object.assign(base, st);
    out.edits = Object.assign(BS.clips.emptyEdits(), st.edits || {});
    out.logWin = st.logWin ? fixLogWin(st.logWin) : base.logWin;
    out.logView = Object.assign({ teams: [true, true], groups: {}, players: [] }, st.logView || {});
    out.logOff = st.logOff || {};
    out.logAdds = Array.isArray(st.logAdds) ? st.logAdds : [];
    out.notes = Array.isArray(st.notes) ? st.notes : [];
    return out;
  }

  function save(key, st) {
    if (!key || !st) return false;
    st.savedAt = Date.now();
    const idx = readJSON(INDEX) || {};
    idx[key] = st.savedAt;
    // 古いものを消す（数が多すぎる・入りきらないとき）
    const prune = (n) => {
      const keys = Object.keys(idx).filter((k) => k !== key).sort((a, b) => idx[a] - idx[b]);
      for (let i = 0; i < n && i < keys.length; i++) { try { ls().removeItem(PREFIX + keys[i]); } catch (e) { /* 無視 */ } delete idx[keys[i]]; }
    };
    if (Object.keys(idx).length > KEEP) prune(Object.keys(idx).length - KEEP);
    let ok = writeJSON(PREFIX + key, st);
    if (!ok) { prune(10); ok = writeJSON(PREFIX + key, st); }
    writeJSON(INDEX, idx);
    savePrefs(st);
    bookPut(key, st.name, st.notes);
    return ok;
  }

  /* コメント帳：動画ごとのコメントを、ためておく（動画の結果を古いものから消しても、コメントは残す） */
  function book() { const b = readJSON(BOOK); return b && typeof b === 'object' ? b : {}; }
  function bookPut(key, name, notes) {
    if (!key) return;
    const b = book();
    const list = Array.isArray(notes) ? notes : [];
    const had = !!b[key];
    if (!list.length && !had) return;
    if (list.length) b[key] = { name: String(name || (b[key] && b[key].name) || '').slice(0, 120), at: Date.now(), notes: list };
    else delete b[key];
    writeJSON(BOOK, b);
  }

  BS.store = { videoKey, prefs, fresh, load, save, fixLogWin, logWinDefault, book, bookPut };
})(typeof window !== 'undefined' ? window : globalThis);
