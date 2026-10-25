/* 成長のしくみ（BC.grow）：やったこと（acts）から、経験値（XP）・レベル・つづけた日数・バッジを計算する。DOM は使わない（tools/grow-test.cjs で検査）。
   acts（この端末の localStorage 'bc.acts'。古い順）：
     [{ at（ms）, type, id, skill, min（分）, rate（1 むずかしかった・2 まあまあ・3 できた）, xp, note }]
     type：'drill'（練習メニューをやった）| 'menu'（きょうのメニューをやりきった）| 'check'（動画チェック）| 'view'（見るポイントを読んだ・チェックした）| 'aid'（ケガの手当てを読んだ）
   今日のメニュー（BC.grow.today）も、ここで作る（ひとりで・短い時間・苦手をまんべんなく）。 */
(function (root) {
  const BC = (root.BC = root.BC || {});
  const G = (BC.grow = BC.grow || {});

  /* ---------- 経験値とレベル ----------
     レベル n になるのに必要な合計：0, 50, 150, 300, 500, 750 …（25 × n × (n − 1)） */
  G.need = (n) => 25 * n * (n - 1);
  G.level = (xp) => { let n = 1; while (G.need(n + 1) <= xp) n++; return n; };
  G.progress = (xp) => {
    const n = G.level(xp), a = G.need(n), b = G.need(n + 1);
    return { level: n, cur: xp - a, span: b - a, toNext: b - xp, ratio: (xp - a) / (b - a) };
  };
  // レベルの呼び名
  G.rank = (n) => (n >= 15 ? 'レジェンド' : n >= 11 ? 'キャプテン' : n >= 8 ? 'エース' : n >= 5 ? 'レギュラー' : n >= 3 ? 'ジュニア' : 'ルーキー');
  // 技能ごとの星（0〜5）
  const STAR = [0, 30, 80, 160, 300, 500];
  G.stars = (xp) => { let s = 0; while (s < 5 && xp >= STAR[s + 1]) s++; return s; };
  G.starNext = (xp) => { const s = G.stars(xp); return s >= 5 ? null : STAR[s + 1] - xp; };

  // ふつうにもらえる経験値
  G.XP = { drill: 10, menu: 20, check: 15, view: 5, aid: 2 };
  // 練習メニューの経験値：時間とできた度合い（むずかしくても、やったら もらえる）
  G.drillXP = (min, rate) => Math.round(Math.max(5, Math.min(30, 6 + (min || 5) * 1.2)) + (rate === 3 ? 4 : rate === 1 ? 2 : 0));

  /* ---------- 日づけ ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  G.day = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const prevDay = (key) => { const [y, m, d] = key.split('-').map(Number); return G.day(new Date(y, m - 1, d - 1).getTime()); };

  /* ---------- まとめ ----------
     返す：{ xp, level, rank, prog, skills: {技能 id: xp}, days: Set（練習した日）, streak（今日か昨日までつづいた日数）, best（いちばん長くつづいた日数）,
             count: {type: 回数}, drills（やったメニューの数）, uniq（ちがうメニューの数）, minutes, checks, goods（動画チェックの ◎ の数）, today（今日の xp）, todayMin } */
  G.summary = function (acts, now = Date.now(), checks = []) {
    const S = { xp: 0, skills: {}, days: new Set(), count: {}, drills: 0, uniq: 0, minutes: 0, checks: 0, goods: 0, today: 0, todayMin: 0, early: false, late: false, rated3: 0 };
    const ids = new Set();
    const todayKey = G.day(now);
    for (const a of acts || []) {
      const xp = a.xp || 0;
      S.xp += xp;
      if (a.skill) S.skills[a.skill] = (S.skills[a.skill] || 0) + xp;
      S.count[a.type] = (S.count[a.type] || 0) + 1;
      const k = G.day(a.at);
      if (a.type === 'drill' || a.type === 'menu' || a.type === 'check') S.days.add(k);
      if (a.type === 'drill') { S.drills++; ids.add(a.id); S.minutes += a.min || 0; if (a.rate === 3) S.rated3++; }
      if (a.type === 'check') S.checks++;
      if (k === todayKey) { S.today += xp; if (a.type === 'drill') S.todayMin += a.min || 0; }
      const h = new Date(a.at).getHours();
      if (a.type === 'drill' && h < 8) S.early = true;
    }
    for (const c of checks || []) S.goods += (c.metrics || []).filter((m) => m.status === 'good').length;
    S.uniq = ids.size;
    // つづけた日数：今日（なければ昨日）から さかのぼる
    let streak = 0;
    let k = S.days.has(todayKey) ? todayKey : prevDay(todayKey);
    while (S.days.has(k)) { streak++; k = prevDay(k); }
    S.streak = streak;
    // いちばん長くつづいた日数
    let best = 0;
    for (const d of S.days) {
      if (S.days.has(prevDay(d))) continue;
      let n = 0, x = d;
      const next = (key) => { const [y, m, dd] = key.split('-').map(Number); return G.day(new Date(y, m - 1, dd + 1).getTime()); };
      while (S.days.has(x)) { n++; x = next(x); }
      best = Math.max(best, n);
    }
    S.best = best;
    S.prog = G.progress(S.xp);
    S.level = S.prog.level;
    S.rank = G.rank(S.level);
    S.allround = Object.values(S.skills).filter((x) => x >= 50).length;
    return S;
  };

  /* ---------- バッジ ---------- */
  G.BADGES = [
    { id: 'first', name: 'はじめの一歩', text: '練習メニューを はじめてやった', icon: 'shoe', test: (s) => s.drills >= 1 },
    { id: 'menu1', name: 'きょうのメニュー', text: 'きょうのメニューを さいごまでやった', icon: 'list', test: (s) => (s.count.menu || 0) >= 1 },
    { id: 'streak3', name: '3日れんぞく', text: '3日つづけて練習した', icon: 'fire', test: (s) => s.best >= 3 },
    { id: 'streak7', name: '1週間れんぞく', text: '7日つづけて練習した', icon: 'fire', test: (s) => s.best >= 7 },
    { id: 'streak30', name: '30日れんぞく', text: '30日つづけて練習した', icon: 'crown', test: (s) => s.best >= 30 },
    { id: 'drill10', name: '10回れんしゅう', text: '練習メニューを 10回やった', icon: 'medal', test: (s) => s.drills >= 10 },
    { id: 'drill50', name: '50回れんしゅう', text: '練習メニューを 50回やった', icon: 'medal', test: (s) => s.drills >= 50 },
    { id: 'uniq10', name: 'いろいろ 10しゅるい', text: 'ちがう練習メニューを 10しゅるい やった', icon: 'grid', test: (s) => s.uniq >= 10 },
    { id: 'min300', name: '300分', text: '練習の時間が あわせて 300分（5時間）', icon: 'clock', test: (s) => s.minutes >= 300 },
    { id: 'check1', name: 'ビデオ・アナリスト', text: '動画で 自分の動きをチェックした', icon: 'camera', test: (s) => s.checks >= 1 },
    { id: 'good5', name: '◎ 5こ', text: '動画チェックで ◎ を あわせて 5こ', icon: 'star', test: (s) => s.goods >= 5 },
    { id: 'shooter', name: 'シューター', text: 'シュートの経験値 100', icon: 'ball', test: (s) => (s.skills.shoot || 0) >= 100 },
    { id: 'handler', name: 'ドリブラー', text: 'ドリブルの経験値 100', icon: 'ball', test: (s) => (s.skills.dribble || 0) >= 100 },
    { id: 'defender', name: 'ディフェンダー', text: '守りの経験値 100', icon: 'shield', test: (s) => (s.skills.defball || 0) + (s.skills.defteam || 0) >= 100 },
    { id: 'allround', name: 'オールラウンダー', text: '5つの技能で 経験値 50 以上', icon: 'grid', test: (s) => s.allround >= 5 },
    { id: 'early', name: '朝れん', text: '朝 8時より前に練習した', icon: 'sun', test: (s) => s.early },
    { id: 'lv5', name: 'レギュラー', text: 'レベル 5 になった', icon: 'crown', test: (s) => s.level >= 5 },
    { id: 'lv10', name: 'エース', text: 'レベル 10 になった', icon: 'crown', test: (s) => s.level >= 10 },
  ];
  G.badges = (s) => G.BADGES.map((b) => Object.assign({}, b, { got: !!b.test(s) }));
  // 前のまとめ → 後のまとめ で、新しくとれたバッジ
  G.newBadges = (before, after) => G.BADGES.filter((b) => !b.test(before) && b.test(after));

  /* ---------- きょうのメニュー ----------
     me：{ level, goals: [技能 id], place: 'any'|'hoop'|'', n }、min：だいたいの分（10・15・20・30）、seed：べつのメニューにするとき 1, 2, …
     返す：{ skill（きょうの中心）, min, items: [{ id, min, role: 'warm'|'main'|'game'|'cool' }], note } */
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9) >>> 0; return seed / 4294967296; };
  const shuffle = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  G.SOLO_SKILLS = ['dribble', 'shoot', 'finish', 'foot', 'body', 'defball', 'attack', 'rebound', 'mind'];
  G.today = function (me = {}, min = 15, seed = 0, now = Date.now()) {
    const n = me.n || 1;
    const opt = { n, level: me.level || null, place: me.place || null, strict: true };
    const fit = (d) => BC.fits(d, opt);
    const goals = (me.goals || []).filter((s) => BC.skillMap[s]);
    const pool = (goals.length ? goals : ['dribble', 'shoot', 'finish', 'defball']);
    const r = rng(hash(G.day(now) + ':' + seed));
    // きょうの中心：目標を日がわりで（その技能で、条件に合う練習がないときは次へ）
    const dayN = Math.floor(new Date(now).setHours(0, 0, 0, 0) / 86400000);
    const order = pool.map((_, i) => pool[(dayN + seed + i) % pool.length]).concat(G.SOLO_SKILLS);
    const by = (s, phases) => BC.lists.drill.filter((d) => (d.skills || [])[0] === s && phases.includes(d.phase) && fit(d));
    let skill = order.find((s) => by(s, ['skill', 'warmup']).length) || 'dribble';
    const note = goals.length && !goals.includes(skill) ? `「${goals.map((g) => BC.skillMap[g].name).join('・')}」は、${n === 1 ? 'ひとりでできる' : '条件に合う'}練習が少ないので、きょうは「${BC.skillMap[skill].name}」にしました。` : '';
    const used = new Set();
    const items = [];
    const per = min <= 10 ? 3 : min <= 20 ? 5 : 6;
    const add = (d, role, m) => { if (!d || used.has(d.id)) return false; used.add(d.id); items.push({ id: d.id, min: m, role }); return true; };
    const warm = shuffle(BC.lists.drill.filter((d) => d.phase === 'warmup' && fit(d) && (d.intensity || 1) <= 2), r)
      .sort((a, b) => ((b.skills || []).includes(skill) ? 1 : 0) - ((a.skills || []).includes(skill) ? 1 : 0));
    add(warm[0], 'warm', min <= 10 ? 2 : 3);
    const main = shuffle(by(skill, ['skill']), r).concat(shuffle(by(skill, ['warmup']), r));
    let left = min - items.reduce((t, x) => t + x.min, 0) - (min >= 20 ? 3 : 0);
    for (const d of main) { if (left < 3) break; const m = Math.min(per, left); if (add(d, 'main', m)) left -= m; if (items.filter((x) => x.role === 'main').length >= 3) break; }
    // ひとりでできるゲーム（あれば）
    const game = shuffle(BC.lists.drill.filter((d) => d.phase === 'game' && fit(d) && (d.skills || []).includes(skill)), r)[0];
    if (game && left >= 3) { const m = Math.min(per, left); if (add(game, 'game', m)) left -= m; }
    // 時間があまれば、ほかの目標の練習
    for (const s of order) {
      if (left < 3) break;
      if (s === skill) continue;
      const d = shuffle(by(s, ['skill']), r).find((x) => !used.has(x.id));
      if (d) { const m = Math.min(per, left); add(d, 'main', m); left -= m; }
    }
    if (min >= 20) { const cool = BC.get('d-cooldown') && fit(BC.get('d-cooldown')) ? BC.get('d-cooldown') : BC.lists.drill.find((d) => d.phase === 'cooldown' && fit(d)); add(cool, 'cool', 3); }
    // 合計を min にそろえる（メインに足す）
    const total = items.reduce((t, x) => t + x.min, 0);
    const mainItem = items.find((x) => x.role === 'main');
    if (mainItem && total < min) mainItem.min += min - total;
    return { skill, min: items.reduce((t, x) => t + x.min, 0), items, note };
  };
})(typeof window !== 'undefined' ? window : globalThis);
