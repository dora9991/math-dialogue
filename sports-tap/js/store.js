/* スポーツ タップ記録 — 保存（このブラウザの中だけ。どこにも送らない）
   ・試合：1つ記録するたびに、すぐ保存する（途中で画面を閉じても、開き直せば続きから）
   ・チーム：種目ごとに、名前・色・名簿を覚えておき、次の試合で選べる
   ・設定：音・画面の色・最後に使った種目・種目ごとの設定（ボタンの組み合わせ・前の試合の形式）
   キーは「stap:」で始まる（バスケ タップ記録の「btap:」とは別）。 */
(function (root) {
  'use strict';
  const ST = root.ST;
  const K = { games: 'stap:games', game: 'stap:game:', current: 'stap:current', teams: 'stap:teams', prefs: 'stap:prefs' };
  const KEEP = 80;          // 覚えておく試合の数（古いものから消す。書き出したファイルは残る）

  function ls() { try { return root.localStorage || null; } catch (e) { return null; } }
  function readJSON(k) { const s = ls(); if (!s) return null; try { const v = s.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeJSON(k, v) { const s = ls(); if (!s) return false; try { s.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function remove(k) { const s = ls(); if (s) { try { s.removeItem(k); } catch (e) { /* 無視 */ } } }

  /* ---------- 試合 ---------- */
  function games(sport) { return (readJSON(K.games) || []).filter((g) => g && g.id && (!sport || g.sport === sport)).sort((a, b) => (b.startedAt || b.at || 0) - (a.startedAt || a.at || 0)); }
  function loadGame(id) {
    const g = readJSON(K.game + id);
    if (!g || g.format !== ST.FORMAT || !Array.isArray(g.events) || !ST.SPORTS[g.sport]) return null;
    if (!g.seq) g.seq = g.events.reduce((m, e) => Math.max(m, Number(String(e.id).slice(1)) || 0), 0);
    g.opts = ST.cleanOpts(ST.SPORTS[g.sport], g.opts);
    return g;
  }
  function saveGame(game) {
    if (!game || !game.id) return false;
    const list = games().filter((x) => x.id !== game.id);
    list.unshift(ST.summary(game));
    let ok = writeJSON(K.game + game.id, game);
    if (!ok || list.length > KEEP) {
      const old = list.slice().sort((a, b) => (a.startedAt || a.at || 0) - (b.startedAt || b.at || 0)).filter((x) => x.id !== game.id);
      const n = ok ? list.length - KEEP : Math.max(5, list.length - KEEP);
      old.slice(0, n).forEach((x) => { remove(K.game + x.id); const i = list.findIndex((y) => y.id === x.id); if (i >= 0) list.splice(i, 1); });
      if (!ok) ok = writeJSON(K.game + game.id, game);
    }
    writeJSON(K.games, list);
    return ok;
  }
  function deleteGame(id) {
    remove(K.game + id);
    writeJSON(K.games, games().filter((x) => x.id !== id));
    if (current() === id) setCurrent(null);
  }
  function current() { const s = ls(); try { return s ? s.getItem(K.current) : null; } catch (e) { return null; } }
  function setCurrent(id) { const s = ls(); if (!s) return; try { if (id) s.setItem(K.current, id); else s.removeItem(K.current); } catch (e) { /* 無視 */ } }

  /* ---------- チーム（名簿。種目ごと） ---------- */
  function teams(sport) { return (readJSON(K.teams) || []).filter((t) => t && t.id && (!sport || t.sport === sport)).sort((a, b) => (b.usedAt || 0) - (a.usedAt || 0)); }
  /* 同じ種目・同じ名前のチームは上書き。名前のないチームは保存しない */
  function saveTeam(sport, team, mine) {
    const name = (team.name || '').trim();
    if (!name) return null;
    const all = teams();
    let t = all.find((x) => x.sport === sport && x.name === name);
    if (!t) { t = { id: ST.uid('t'), sport }; all.push(t); }
    const keep = !!(ST.SPORTS[sport] && ST.SPORTS[sport].orderedRoster);
    Object.assign(t, { name, color: team.color, colorName: team.colorName, players: ST.cleanPlayers(team.players, keep), usedAt: Date.now() });
    if (mine) { all.forEach((x) => { if (x.sport === sport) delete x.mine; }); t.mine = true; }
    const keepList = all.sort((a, b) => (b.usedAt || 0) - (a.usedAt || 0)).slice(0, 120);
    writeJSON(K.teams, keepList);
    return t;
  }
  function deleteTeam(id) { writeJSON(K.teams, teams().filter((t) => t.id !== id)); }
  function myTeam(sport) { return teams(sport).find((t) => t.mine) || null; }

  /* ---------- 設定 ----------
     sound：タップ音 / theme：画面の色 / last：最後に使った種目
     sp[種目]：{ opts（前の試合の形式）, rows（行のボタンの組み合わせ）, names, unknown, … 種目の設定 } */
  function prefs() {
    const p = Object.assign({ sound: false, theme: 'auto', last: '', sp: {} }, readJSON(K.prefs) || {});
    if (!p.sp || typeof p.sp !== 'object') p.sp = {};
    return p;
  }
  function savePrefs(p) { return writeJSON(K.prefs, p); }
  /* 種目の設定（なければ、その種目のはじめの値で作る） */
  function sportPrefs(p, sport) {
    const sp = ST.SPORTS[sport];
    const base = Object.assign({ names: true, unknown: true, opts: null, rows: {} }, sp && sp.defaultPrefs ? sp.defaultPrefs() : {});
    // いまある物に、足りない値だけを足す（作り直さない：先に受け取った物を書きかえても、保存される）
    if (!p.sp[sport] || typeof p.sp[sport] !== 'object') p.sp[sport] = {};
    const cur = p.sp[sport];
    Object.keys(base).forEach((k) => { if (cur[k] === undefined) cur[k] = base[k]; });
    if (!cur.rows || typeof cur.rows !== 'object') cur.rows = {};
    return cur;
  }

  function persist() {
    try { if (root.navigator && navigator.storage && navigator.storage.persist) return navigator.storage.persist().catch(() => false); } catch (e) { /* 無視 */ }
    return Promise.resolve(false);
  }

  ST.store = { games, loadGame, saveGame, deleteGame, current, setCurrent, teams, saveTeam, deleteTeam, myTeam, prefs, savePrefs, sportPrefs, persist, KEYS: K };
})(typeof window !== 'undefined' ? window : globalThis);
