/* バスケ シーン — 保存（このブラウザの中だけ）
   キーは「bscene:」で始まる（もとの「バスケ タップ記録」＝ btap: とは別。記録の形は同じ format: 'basket-tap' なので、ファイルで行き来できる）。
   ・試合：1つ記録するたびに、すぐ保存する
   ・チーム：自分のチームの名前・色・名簿を覚えておく（次の試合で、そのまま使える）
   ・設定：下の DEFAULTS（はじめから、記録するものは全部オン。いらないものを設定で外す） */
(function (root) {
  'use strict';
  const BT = root.BT;
  const SC = root.SC = root.SC || {};
  const K = { games: 'bscene:games', game: 'bscene:game:', team: 'bscene:team', prefs: 'bscene:prefs' };
  const KEEP = 80;

  function ls() { try { return root.localStorage || null; } catch (e) { return null; } }
  function readJSON(k) { const s = ls(); if (!s) return null; try { const v = s.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeJSON(k, v) { const s = ls(); if (!s) return false; try { s.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function remove(k) { const s = ls(); if (s) { try { s.removeItem(k); } catch (e) { /* 無視 */ } } }

  /* ---------- 設定 ----------
     rec：自分のチームで記録するもの（どれも、はじめはオン）
       miss：シュートの失敗（2P×・3P×・FT×。成功率が出せる）/ rebSplit：リバウンドを Oリバ・Dリバ に分ける（false なら「リバ」1つ）
       reb：リバウンド / ast：アシスト / stl：スティール / blk：ブロック / tov：ターンオーバー / foul：ファウル / mark：★ あとで見る
     shotLoc：2P・3P のあとに、コートの図で場所も聞く（はじめはオフ）/ courtType：'std' | 'mini'
     autoPause：プレーか背番号を押したら、動画を止める（選び終わると、また動かす）
     win：場面の長さ { lead：前の秒, lag：後の秒, by：{ まとまり: { lead, lag } } }（js/lib/taplog.js の WIN・WIN_BY と同じ形）
     reelMax：続けて再生・書き出しで、重なる場面をつなぐ長さの上限（秒）
     captions：書き出す動画に、左上の札（だれの・何のプレーか）を入れる / cards：はじめと終わりの札を入れる
     sceneDetail：場面の一覧に、細かい手直し（はじめ・終わりを動かす）を出す
     theme：'auto' | 'light' | 'dark' / hints：{ 出した案内: true } */
  const DEFAULTS = {
    theme: 'auto',
    rec: { miss: true, reb: true, rebSplit: true, ast: true, stl: true, blk: true, tov: true, foul: true, mark: true },
    shotLoc: false, courtType: 'std',
    autoPause: false,
    win: { lead: 10, lag: 2, by: { reb: { lead: 5, lag: 2 }, mark: { lead: 5, lag: 2 } } },
    reelMax: 24,
    captions: true, cards: true,
    sceneDetail: false,
    hints: {}
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function merge(base, over) {
    const out = clone(base);
    Object.keys(over || {}).forEach((k) => {
      const v = over[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = merge(out[k], v);
      else if (v !== undefined) out[k] = v;
    });
    return out;
  }
  function prefs() { return merge(DEFAULTS, readJSON(K.prefs) || {}); }
  function savePrefs(p) { return writeJSON(K.prefs, p); }

  /* ---------- 試合 ---------- */
  function games() { return (readJSON(K.games) || []).filter((g) => g && g.id).sort((a, b) => (b.startedAt || b.at || 0) - (a.startedAt || a.at || 0)); }
  function loadGame(id) {
    const g = readJSON(K.game + id);
    if (!g || g.format !== BT.FORMAT || !Array.isArray(g.events)) return null;
    if (!g.seq) g.seq = g.events.reduce((m, e) => Math.max(m, Number(String(e.id).slice(1)) || 0), 0);
    return g;
  }
  /* 保存できたら true（入りきらないときは、古い試合から消して、もう一度） */
  function saveGame(game) {
    if (!game || !game.id) return false;
    const list = games().filter((x) => x.id !== game.id);
    const sum = BT.summary(game);
    sum.src = game.src ? { name: game.src.name, size: game.src.size, duration: game.src.duration } : null;
    list.unshift(sum);
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
  function deleteGame(id) { remove(K.game + id); writeJSON(K.games, games().filter((x) => x.id !== id)); }
  /* 同じ動画で記録した試合（ファイル名と大きさが同じ。新しいものから） */
  function findBySrc(file) {
    if (!file || !file.name) return null;
    const hit = games().find((g) => g.src && g.src.name === file.name && (!g.src.size || !file.size || g.src.size === file.size));
    return hit ? hit.id : null;
  }

  /* ---------- 自分のチーム（前の試合の名前・色・名簿） ---------- */
  function team() { const t = readJSON(K.team); return t && typeof t === 'object' ? BT.cleanTeam(t, 0) : null; }
  function saveTeam(t) { return writeJSON(K.team, { name: t.name, color: t.color, colorName: t.colorName, players: BT.cleanPlayers(t.players) }); }

  SC.store = { DEFAULTS, prefs, savePrefs, games, loadGame, saveGame, deleteGame, findBySrc, team, saveTeam, merge, KEYS: K };
})(typeof window !== 'undefined' ? window : globalThis);
