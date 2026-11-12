/* 「今週の これ1つ」（BC.focus）：きのうの自分を こえるための しくみ。DOM は使わない（tools/focus-test.cjs で検査）。
   1週間（月〜日）に1周する：①のびしろを3つ出す → 1つえらぶ → 30秒チャレンジで「いまの自分」を測る（きじゅん）＋目標
                              ②きょうのメニューが「これ1つ」中心になる → 練習のあとに ふり返り（できたこと・つぎに意識すること）
                              ③もう一度 測って、きじゅんから どれだけ のびたか（自己ベストも）を見る
   測るテストは data/focus.js（BC.FOCUS_TESTS）。
   この端末に残すもの（localStorage 'bc.focus'）：
     { v: 1, items: [ {
         id, week（その週の月曜の日づけ 'YYYY-MM-DD'）, test（テストの id）, skill, goal（目標の数）, at（きめた時刻）,
         tries: [ { at, v（測った数）, k: 'base'（きじゅん）| 'try'（測りなおし） } ],
         notes: [ { at, good（できたこと）, next（つぎに意識すること） } ],
         changed: true（その週のうちに べつの これ1つ に かえた）, closed: true（その週をおえた）
     } ] }
   「いまの自分」は ほかの人とくらべない。くらべる相手は、前の自分だけ。 */
(function (root) {
  const BC = (root.BC = root.BC || {});
  const G = BC.grow;
  const F = (BC.focus = {});

  /* ---------- 週（月〜日）---------- */
  F.addDays = G.addDays;
  F.weekKey = G.weekKey;
  F.weekDays = (ms) => { const k = G.weekKey(ms); return [0, 1, 2, 3, 4, 5, 6].map((i) => G.addDays(k, i)); };

  /* ---------- 測るテスト ---------- */
  F.tests = () => BC.FOCUS_TESTS || [];
  F.test = (id) => F.tests().find((t) => t.id === id) || null;
  // そのひとの 場所・人数・レベルで できるテスト（ゴールがいる/練習メニューが条件に合わない ものは はずす）
  F.available = (t, me = {}) => {
    if (!t) return false;
    if (me.place === 'any' && t.place === 'hoop') return false;
    const d = BC.get && BC.get((t.drills || [])[0]);
    return !!d && BC.fits(d, { n: me.n || 1, level: me.level || null, place: me.place || null });
  };
  F.testsFor = (skill, me) => F.tests().filter((t) => t.skill === skill && F.available(t, me));

  /* ---------- 数のあつかい ---------- */
  const round1 = (x) => Math.round(x * 10) / 10;
  // 差・のこりの言い方：「4回」「1.3秒」「2本」（「7/10本」の形にはしない）
  const amount = (t, n) => `${round1(Math.abs(n))}${t.unit}`;
  // 画面に出す形：「38回」「16.9秒」「7/10本」
  F.fmt = (t, v) => {
    if (v == null || !isFinite(v)) return '—';
    if (t.kind === 'make') return `${v}/${t.of}${t.unit}`;
    if (t.kind === 'time') return `${round1(v)}${t.unit}`;
    return `${Math.round(v)}${t.unit}`;
  };
  F.step = (t) => (t.kind === 'time' ? 0.1 : 1);
  F.clamp = (t, v) => {
    let x = Number(v);
    if (!isFinite(x)) x = 0;
    x = Math.max(0, x);
    if (t.kind === 'make') x = Math.min(t.of, Math.round(x));
    else if (t.kind === 'time') x = round1(Math.min(x, 9999));
    else x = Math.min(Math.round(x), 99999);
    return x;
  };
  // 目標にとどいたか
  F.meets = (t, goal, v) => v != null && goal != null && (t.better === 'less' ? v <= goal : v >= goal);
  // 「のびた」の向きの差（正 ＝ のびた）
  F.gain = (t, from, to) => (t.better === 'less' ? from - to : to - from);
  // いまの数から、むりのない目標（だいたい +10%。少なくとも ひと目で わかる分）
  F.suggestGoal = (t, base) => {
    const b = Number(base) || 0;
    if (t.kind === 'make') return Math.min(t.of, b + (b <= t.of / 2 ? 2 : 1));
    if (t.kind === 'time') return b > 0 ? Math.max(0.5, round1(Math.min(b - 0.5, b * 0.95))) : 0.5;
    const min = t.kind === 'hold' ? 5 : 2;
    return Math.round(b + Math.max(min, Math.ceil(b * 0.1)));
  };

  /* ---------- きろく（state）---------- */
  F.empty = () => ({ v: 1, items: [] });
  // 読みこんだものを たしかめて、形をそろえる（ほかの端末から読みこんだものも）
  F.load = (raw) => {
    const out = F.empty();
    const list = raw && Array.isArray(raw.items) ? raw.items : [];
    for (const it of list.slice(-300)) {
      const t = it && F.test(it.test);
      if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(it.week || '')) continue;
      const tries = (Array.isArray(it.tries) ? it.tries : []).filter((x) => x && isFinite(x.v) && isFinite(x.at)).slice(-60)
        .map((x) => ({ at: +x.at, v: F.clamp(t, x.v), k: x.k === 'base' ? 'base' : 'try' }));
      if (!tries.length) continue;
      const notes = (Array.isArray(it.notes) ? it.notes : []).filter((n) => n && isFinite(n.at)).slice(-60)
        .map((n) => ({ at: +n.at, good: String(n.good || '').slice(0, 40), next: String(n.next || '').slice(0, 40) }));
      out.items.push({ id: String(it.id || '').slice(0, 40) || 'fc' + out.items.length, week: it.week, test: t.id, skill: t.skill,
        goal: F.clamp(t, it.goal), at: isFinite(it.at) ? +it.at : tries[0].at, tries, notes, changed: !!it.changed, closed: !!it.closed || !!it.changed });
    }
    return out;
  };
  const clone = (s) => ({ v: 1, items: s.items.map((x) => Object.assign({}, x, { tries: x.tries.slice(), notes: x.notes.slice() })) });
  let seq = 0;
  const newId = (now) => 'fc' + Math.floor(now).toString(36) + (seq++).toString(36);

  F.item = (state, id) => state.items.find((x) => x.id === id) || null;
  // この週の「これ1つ」（かえたものは のぞく）
  F.current = (state, now = Date.now()) => {
    const wk = F.weekKey(now);
    for (let i = state.items.length - 1; i >= 0; i--) { const x = state.items[i]; if (x.week === wk && !x.changed) return x; }
    return null;
  };
  // 前の週までで、測りなおしていない「これ1つ」（いちばん新しい1つ）
  F.pending = (state, now = Date.now()) => {
    const wk = F.weekKey(now);
    for (let i = state.items.length - 1; i >= 0; i--) { const x = state.items[i]; if (x.week < wk && !x.changed && !x.closed && x.tries.length === 1) return x; }
    return null;
  };
  F.history = (state) => state.items.slice().sort((a, b) => b.at - a.at);
  // 前の「これ1つ」（そのテストの、いちばん新しい きろく）
  F.lastFor = (state, testId, exceptId) => { for (let i = state.items.length - 1; i >= 0; i--) { const x = state.items[i]; if (x.test === testId && x.id !== exceptId && !x.changed) return x; } return null; };

  // きじゅん（はじめの測定）と目標をきめて、今週の「これ1つ」を はじめる。この週に すでにあれば、かえた ことにして のこす
  F.start = (state, o) => {
    const t = F.test(o.test);
    if (!t) return { state, item: null };
    const now = o.now == null ? Date.now() : o.now;
    const s = clone(state);
    const wk = F.weekKey(now);
    for (const x of s.items) if (x.week === wk && !x.changed) { x.changed = true; x.closed = true; }
    const v = F.clamp(t, o.value);
    const goal = F.clamp(t, o.goal == null ? F.suggestGoal(t, v) : o.goal);
    const item = { id: o.id || newId(now), week: wk, test: t.id, skill: t.skill, goal, at: now, tries: [{ at: now, v, k: 'base' }], notes: [], changed: false, closed: false };
    s.items.push(item);
    s.items = s.items.slice(-300);
    return { state: s, item };
  };
  // 測りなおす。自己ベスト（そのテストで、これまでで いちばんよい）なら pb。1回めの測定は pb にしない
  F.addTry = (state, id, value, now = Date.now()) => {
    const s = clone(state);
    const item = F.item(s, id);
    const t = item && F.test(item.test);
    if (!item || !t) return { state, item: null };
    const v = F.clamp(t, value);
    const before = F.bestOf(s, t.id);
    const had = s.items.some((x) => x.test === t.id && x.tries.length > 0);
    item.tries.push({ at: now, v, k: item.tries.length ? 'try' : 'base' });
    item.tries = item.tries.slice(-60);
    const pb = had && before != null && F.gain(t, before, v) > 0;
    return { state: s, item, pb, reached: F.meets(t, item.goal, v), gain: F.gain(t, item.tries[0].v, v) };
  };
  // 目標を直す
  F.setGoal = (state, id, goal) => {
    const s = clone(state);
    const item = F.item(s, id);
    const t = item && F.test(item.test);
    if (item && t) item.goal = F.clamp(t, goal);
    return s;
  };
  // ふり返り（1日1つ。同じ日は書きかえる）
  F.addNote = (state, id, note, now = Date.now()) => {
    const s = clone(state);
    const item = F.item(s, id);
    if (!item) return state;
    const good = String(note.good || '').trim().slice(0, 40), next = String(note.next || '').trim().slice(0, 40);
    if (!good && !next) return state;
    const day = G.day(now);
    item.notes = item.notes.filter((n) => G.day(n.at) !== day);
    item.notes.push({ at: now, good, next });
    item.notes = item.notes.slice(-60);
    return s;
  };
  F.close = (state, id) => { const s = clone(state); const x = F.item(s, id); if (x) x.closed = true; return s; };
  F.remove = (state, id) => { const s = clone(state); s.items = s.items.filter((x) => x.id !== id); return s; };

  /* ---------- 見る ---------- */
  // そのテストの 自己ベスト（いちばんよい数。まだなければ null）
  F.bestOf = (state, testId) => {
    const t = F.test(testId);
    let best = null;
    for (const x of state.items) if (x.test === testId) for (const y of x.tries) if (best == null || F.gain(t, best, y.v) > 0) best = y.v;
    return best;
  };
  F.bests = (state) => {
    const out = {};
    for (const x of state.items) { const b = F.bestOf(state, x.test); if (b != null) out[x.test] = b; }
    return out;
  };
  F.amount = amount;
  F.summary = (item) => {
    const t = F.test(item.test);
    const base = item.tries[0].v, last = item.tries[item.tries.length - 1].v;
    const gain = F.gain(t, base, last);
    const span = F.gain(t, base, item.goal);
    const ratio = item.tries.length < 2 ? 0 : span <= 0 ? (gain > 0 ? 1 : 0) : Math.max(0, Math.min(1, gain / span));
    return { test: t, base, last, goal: item.goal, gain, ratio, reached: item.tries.length > 1 && F.meets(t, item.goal, last), tried: item.tries.length > 1, n: item.tries.length };
  };
  // 結果のひとこと（はげます。へっても、せめない）
  F.verdict = (item, pb) => {
    const m = F.summary(item);
    if (!m.tried) return { key: 'base', text: 'ここが スタート。1週間で どれだけ のびるか、たのしみだね。' };
    if (pb) return { key: 'pb', text: '自己ベスト！ 今までで いちばん いい きろくだよ。' };
    if (m.reached) return { key: 'up', text: '目標に とどいた！ やったね。' };
    if (m.gain > 0) return { key: 'up', text: 'のびたよ！ 前の自分を こえた。' };
    if (m.gain === 0) return { key: 'same', text: 'おなじだった。きょうの体の調子や 場所でも かわるよ。つぎは どこを 意識する？' };
    return { key: 'down', text: 'きょうは ちょっと へったね。でも だいじょうぶ。つかれや 場所でも かわるよ。' };
  };
  // おうちの人・コーチに見せる文
  F.shareText = (item, pb) => {
    const m = F.summary(item);
    const t = m.test;
    if (!m.tried) return `今週の「これ1つ」は「${t.name}」。いまは ${F.fmt(t, m.base)}（${t.what}）。目標は ${F.fmt(t, m.goal)}！`;
    const diff = m.gain > 0 ? `（${m.last > m.base ? '+' : '−'}${amount(t, m.last - m.base)}）` : '';
    return `今週の「これ1つ」：${t.name}（${t.what}）\n${F.fmt(t, m.base)} → ${F.fmt(t, m.last)}${diff}${pb ? ' 自己ベスト！' : m.reached ? ' 目標クリア！' : ''}`;
  };
  // ひろば（クラブ）に のせる ひとこと（60字まで）
  F.clubLabel = (item, pb) => {
    const m = F.summary(item);
    const t = m.test;
    const tail = pb ? '（自己ベスト！）' : m.reached ? '（目標クリア！）' : m.gain > 0 ? '（のびた！）' : '';
    const body = m.tried ? `${F.fmt(t, m.base)} → ${F.fmt(t, m.last)}` : `${F.fmt(t, m.base)} から スタート`;
    let name = t.name;
    const max = 60 - body.length - tail.length - 4;
    if (name.length > max) name = name.slice(0, Math.max(3, max - 1)) + '…';
    return `「${name}」${body}${tail}`;
  };
  // 1週ぶんの 練習した日（その「これ1つ」と同じ技能の練習をした日）
  F.practiceDays = (item, acts) => {
    const days = new Set();
    const wk = item.week, end = F.addDays(wk, 6);
    for (const a of acts || []) {
      if (a.skill !== item.skill || (a.type !== 'drill' && a.type !== 'try' && a.type !== 'focus')) continue;
      const k = G.day(a.at);
      if (k >= wk && k <= end) days.add(k);
    }
    return days;
  };

  /* ---------- のびしろを3つ出す ----------
     ctx：{ me, acts, checks（動画チェックの きろく）, log（そうだんの会話）, state, now }
     返す：[ { skill, test（テストの id）, reason（いちばん大きな理由）, reasons（理由の一覧）, score } ] 3つまで
     見るもの：動画チェックの △・「むずかしかった」・そうだんした なやみ・ともくひょう・ごぶさた・先週の あと少し */
  const CHECK_SKILL = { shoot: 'shoot', dribble: 'dribble', defense: 'defball', landing: 'body', free: 'body' };
  const DAY = 86400000;
  F.candidates = (ctx, max = 3) => {
    const me = ctx.me || {}, acts = ctx.acts || [], now = ctx.now == null ? Date.now() : ctx.now, state = ctx.state || F.empty();
    const pool = [];
    for (const g of me.goals || []) if (!pool.includes(g)) pool.push(g);
    for (const s of G.SOLO_SKILLS.concat(['pass'])) if (!pool.includes(s)) pool.push(s);
    const skills = pool.filter((s) => F.testsFor(s, me).length);
    const score = {}, why = {}, hint = {};
    const add = (s, w, text, tag, h) => {
      if (!skills.includes(s)) return;
      score[s] = (score[s] || 0) + w;
      (why[s] = why[s] || []).push({ w, text, tag });
      if (h && !hint[s]) hint[s] = h;
    };
    // ① 動画チェックで △（30日いない・種類ごとに いちばん新しい1つ）
    const seen = new Set();
    for (const c of ctx.checks || []) {
      if (!c || seen.has(c.mode) || !(now - c.at <= 30 * DAY)) continue;
      seen.add(c.mode);
      const sk = CHECK_SKILL[c.mode];
      const bad = (c.metrics || []).filter((m) => m.status === 'bad');
      if (!sk || !bad.length) continue;
      const link = ((bad[0].links || []).find((x) => /^d-/.test(x))) || null;
      add(sk, 5 + Math.min(2, bad.length - 1), `動画チェックで「${String(bad[0].label || '').replace(/^(攻め|守り)：/, '')}」が △ だったよ`, 'check', link);
    }
    // ② 「むずかしかった」（2週間）
    const hard = {};
    for (const a of acts) if (a.type === 'drill' && a.rate === 1 && now - a.at <= 14 * DAY && a.skill) hard[a.skill] = (hard[a.skill] || 0) + 1;
    for (const [s, n] of Object.entries(hard)) if (n >= 2) add(s, 4 + Math.min(2, n - 2), `「むずかしかった」が ${n}回 あったよ`, 'hard');
    // ③ そうだんした なやみ（さいごの3つ）
    let k = 0;
    for (let i = (ctx.log || []).length - 1; i >= 0 && k < 3; i--) {
      const b = ctx.log[i].bot;
      if (!b || b.type !== 'issue') continue;
      k++;
      const it = BC.get(b.id);
      if (it && it.skill) add(it.skill, k === 1 ? 3 : 2, `「${it.title}」を そうだん したよ`, 'worry');
    }
    // ④ 目標・ごぶさた
    const xp = (G.summary(acts, now, []) || {}).skills || {};
    const lastAt = {};
    for (const a of acts) if (a.type === 'drill' && a.skill) lastAt[a.skill] = Math.max(lastAt[a.skill] || 0, a.at);
    for (const s of skills) {
      const goal = (me.goals || []).includes(s);
      if (goal && !(xp[s] > 0)) add(s, 3, 'ともくひょうに えらんだけど、まだ やっていないよ', 'idle');
      else if (goal) add(s, 2, 'ともくひょうに えらんだよ', 'goal');
      if (xp[s] > 0 && lastAt[s] && now - lastAt[s] >= 10 * DAY) add(s, 2, `${Math.floor((now - lastAt[s]) / DAY)}日 やっていないよ`, 'idle');
    }
    // ⑤ 先週の あと少し／もう たっせいした ものは しばらく休み
    const prev = F.history(state).find((x) => !x.changed && x.week < F.weekKey(now));
    if (prev && skills.includes(prev.skill)) {
      const m = F.summary(prev);
      if (m.tried && !m.reached && m.gain > 0) add(prev.skill, 3, `前の「${m.test.name}」は あと ${amount(m.test, m.goal - m.last)} で 目標だったよ`, 'again');
      else if (m.reached) score[prev.skill] = (score[prev.skill] || 0) - 3;
    }
    // ⑥ まだ ためしていない技能（すこしだけ）
    const tried = new Set(state.items.map((x) => x.skill));
    for (const s of skills) if (!tried.has(s)) add(s, 1, 'まだ ためしていないよ', 'new');
    // ⑦ なにも ないとき：はじめは ここから
    const order = skills.slice().sort((a, b) => (score[b] || 0) - (score[a] || 0) || skills.indexOf(a) - skills.indexOf(b));
    const out = [];
    for (const s of order) {
      if (out.length >= max) break;
      const reasons = (why[s] || []).slice().sort((a, b) => b.w - a.w).map((x) => x.text);
      out.push({ skill: s, test: F.pickTest(s, { me, state, hint: hint[s] }).id, reason: reasons[0] || 'まずは ここから', reasons: reasons.slice(0, 2), tag: ((why[s] || []).slice().sort((a, b) => b.w - a.w)[0] || {}).tag || 'start', score: score[s] || 0 });
    }
    return out;
  };
  // その技能で どのテストにするか：動画チェックの練習メニューに つながるもの → 前に測ったもの（まんてんなら つぎ）→ まだ測っていないもの
  F.pickTest = (skill, o = {}) => {
    const list = F.testsFor(skill, o.me);
    if (!list.length) return null;
    const state = o.state || F.empty();
    if (o.hint) { const t = list.find((x) => x.drills.includes(o.hint)); if (t) return t; }
    const last = F.history(state).find((x) => x.skill === skill && !x.changed);
    if (last) {
      const t = F.test(last.test);
      const m = F.summary(last);
      const maxed = t.kind === 'make' && m.last >= t.of;
      if (!maxed && list.some((x) => x.id === t.id)) return t;
    }
    const used = new Set(state.items.filter((x) => x.skill === skill).map((x) => x.test));
    return list.find((x) => !used.has(x.id)) || list[0];
  };

  /* ---------- きょうのメニューへ ----------
     これ1つ中心の きょうのメニューに必要なもの。{ skill, test, drills（条件に合うもの）, easy（「むずかしかった」が つづいた）, cue（前の ふり返りの「つぎに 意識すること」） } */
  F.forMenu = (state, acts, me = {}, now = Date.now()) => {
    const item = F.current(state, now);
    if (!item || item.closed) return null;
    const t = F.test(item.test);
    if (!t) return null;
    const fit = (d) => BC.fits(d, { n: me.n || 1, level: me.level || null, place: me.place || null, strict: true });
    const drills = t.drills.filter((id) => { const d = BC.get(id); return d && fit(d); });
    if (!drills.length) return null;
    const rated = (acts || []).filter((a) => a.type === 'drill' && a.skill === item.skill && now - a.at <= 7 * DAY).slice(-2);
    const easy = rated.length >= 2 && rated.every((a) => a.rate === 1);
    const lastNote = item.notes.slice().reverse().find((n) => n.next);
    return { skill: item.skill, test: t.id, drills, easy, cue: lastNote ? lastNote.next : null, itemId: item.id };
  };
})(typeof window !== 'undefined' ? window : globalThis);
