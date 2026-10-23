/* バスケ タップ記録 — 保存（このブラウザの中だけ。どこにも送らない）
   ・試合：1つ記録するたびに、すぐ保存する（途中で画面を閉じても、開き直せば続きから）
   ・チーム：名前・色・名簿を覚えておき、次の試合で選べる（自分のチームは毎回同じことが多いので）
   ・設定：名前の表示・「？」の行・音・画面の明るさ
   キーは「btap:」で始まる。バスケ得点クリップ（同じサイトの別のページ）からも、この試合を読み込める。 */
(function (root) {
  'use strict';
  const BT = root.BT;
  const K = { games: 'btap:games', game: 'btap:game:', current: 'btap:current', teams: 'btap:teams', prefs: 'btap:prefs' };
  const KEEP = 60;          // 覚えておく試合の数（古いものから消す。書き出したファイルは残る）

  function ls() { try { return root.localStorage || null; } catch (e) { return null; } }
  function readJSON(k) { const s = ls(); if (!s) return null; try { const v = s.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeJSON(k, v) { const s = ls(); if (!s) return false; try { s.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function remove(k) { const s = ls(); if (s) { try { s.removeItem(k); } catch (e) { /* 無視 */ } } }

  /* ---------- 試合 ---------- */
  function games() { return (readJSON(K.games) || []).filter((g) => g && g.id).sort((a, b) => (b.startedAt || b.at || 0) - (a.startedAt || a.at || 0)); }
  function loadGame(id) {
    const g = readJSON(K.game + id);
    if (!g || g.format !== BT.FORMAT || !Array.isArray(g.events)) return null;
    if (!g.seq) g.seq = g.events.reduce((m, e) => Math.max(m, Number(String(e.id).slice(1)) || 0), 0);
    return g;
  }
  /* 保存できたら true（入りきらないときは、古い試合を消してもう一度） */
  function saveGame(game) {
    if (!game || !game.id) return false;
    const list = games().filter((x) => x.id !== game.id);
    list.unshift(BT.summary(game));
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

  /* ---------- チーム（名簿） ---------- */
  function teams() { return (readJSON(K.teams) || []).filter((t) => t && t.id).sort((a, b) => (b.usedAt || 0) - (a.usedAt || 0)); }
  /* 同じ名前のチームは上書き。名前のないチームは保存しない */
  function saveTeam(team, mine) {
    const name = (team.name || '').trim();
    if (!name) return null;
    const list = teams();
    let t = list.find((x) => x.name === name);
    if (!t) { t = { id: BT.uid('t') }; list.push(t); }
    Object.assign(t, { name, color: team.color, colorName: team.colorName, players: BT.cleanPlayers(team.players), usedAt: Date.now() });
    if (mine) { list.forEach((x) => { delete x.mine; }); t.mine = true; }
    writeJSON(K.teams, list.slice(0, 40));
    return t;
  }
  function deleteTeam(id) { writeJSON(K.teams, teams().filter((t) => t.id !== id)); }
  function myTeam() { return teams().find((t) => t.mine) || null; }

  /* ---------- 設定 ---------- */
  /* names：選手の名前も出す / unknown：「？」（だれか分からないとき）の行を出す / sound：タップ音 / theme：画面の色
     camQuality：撮影の画質（'720' | '1080'）/ camAudio：録画に音も入れる */
  function prefs() {
    const p = Object.assign({ sound: false, theme: 'auto', names: true, unknown: true, camQuality: '720', camAudio: true }, readJSON(K.prefs) || {});
    delete p.actions;        // 前の版の「ボタンの組み合わせ」（いまは、選手ごとのボタンに決まっている）
    return p;
  }
  function savePrefs(p) { return writeJSON(K.prefs, p); }

  /* 消されにくくする（Safari などは、しばらく開かないサイトの保存を消すことがある。できる環境だけ） */
  function persist() {
    try { if (root.navigator && navigator.storage && navigator.storage.persist) return navigator.storage.persist().catch(() => false); } catch (e) { /* 無視 */ }
    return Promise.resolve(false);
  }

  BT.store = { games, loadGame, saveGame, deleteGame, current, setCurrent, teams, saveTeam, deleteTeam, myTeam, prefs, savePrefs, persist, KEYS: K };
})(typeof window !== 'undefined' ? window : globalThis);
