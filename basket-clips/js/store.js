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
  const KEEP = 30;          // 覚えておく動画の数（古いものから消す）

  function ls() { try { return root.localStorage || null; } catch (e) { return null; } }
  function readJSON(k) { const s = ls(); if (!s) return null; try { const v = s.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeJSON(k, v) { const s = ls(); if (!s) return false; try { s.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  function videoKey(file) {
    if (!file) return null;
    if (typeof file === 'string') return 'url:' + file;
    return [file.name, file.size, file.lastModified || 0].join('|');
  }

  /* 前回のチームの色・クリップの長さ（次の動画でも同じにする） */
  function prefs() {
    return Object.assign({
      teams: [{ color: '#f4f4f4', colorName: '白', name: '' }, { color: '#2f6fed', colorName: '青', name: '' }],
      win: { lead: BS.clips.WIN.lead, lag: BS.clips.WIN.lag }, captions: true,
      logWin: BS.taplog ? { lead: BS.taplog.WIN.lead, lag: BS.taplog.WIN.lag } : { lead: 6, lag: 2 }
    }, readJSON(PREFS) || {});
  }
  function savePrefs(st) { writeJSON(PREFS, { teams: st.teams, win: st.win, captions: st.captions, logWin: st.logWin }); }

  function fresh() {
    const p = prefs();
    return {
      v: 1, teams: JSON.parse(JSON.stringify(p.teams)), hoops: [null, null], hoopTeam: [0, 1], fixed: false,
      halfT: null, halfNo: null, result: null, edits: BS.clips.emptyEdits(), win: Object.assign({}, p.win), captions: p.captions !== false,
      // 記録（バスケ タップ記録）：log＝読み込んだ記録、sync＝時刻あわせ { anchors: [{ t, v }], how }、logView＝絞り込み、logWin＝1場面の長さ、logOff＝外した場面
      log: null, sync: null, logView: { teams: [true, true], groups: {}, players: [] }, logWin: Object.assign({}, p.logWin), logOff: {}
    };
  }

  function load(key) {
    if (!key) return null;
    const st = readJSON(PREFIX + key);
    if (!st || st.v !== 1) return null;
    const base = fresh();
    const out = Object.assign(base, st);
    out.edits = Object.assign(BS.clips.emptyEdits(), st.edits || {});
    out.logWin = Object.assign({}, base.logWin, st.logWin || {});
    out.logView = Object.assign({ teams: [true, true], groups: {}, players: [] }, st.logView || {});
    out.logOff = st.logOff || {};
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
    return ok;
  }

  BS.store = { videoKey, prefs, fresh, load, save };
})(typeof window !== 'undefined' ? window : globalThis);
