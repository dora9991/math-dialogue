/* みせびらき — 迷わないための案内（登録と検索）
   ・Guide.help(アプリid, {...}) … そのツールの「使い方」（できること・まずはこの3つ・迷いやすいところ・ツアー）
   ・Guide.tasks([...])           … 「やりたいことから探す」の項目（押すと、その画面へ行って押す場所を光らせる）
   画面に出す部分（光らせる・パネル・検索窓）は guide-ui.js。ここはデータと検索だけ。

   help の形：
   { lead: 'ひとことで',
     can:   ['できること', …],                       // 3〜5
     first: [{ text: 'まずやること', task: 'タスクid' }], // 3つ。task は省略可
     faq:   [{ q: '迷いやすいところ', a: '答え' }],    // 3〜5
     tour:  [{ target: 'CSSセレクタ', title, body,    // 3〜6。画面の要素を順に光らせる
               targetPhone?: 'スマホでのセレクタ', skipOnPhone?: true, params?: {Kit.go に渡す} }],
     related: ['つながるアプリid', …] }
   task の形：
   { id, title: 'やりたいこと（〜する）', words: '言いかえ・検索語（空白区切り）', app, params?, target?, targetPhone?, tip: '光らせたときの一言',
     pin?: true（検索の「よく使うこと」に出す）, hidden?: true（検索には出さない。入口のページなどから呼ぶだけ）, run?: () => {}（光らせる代わりに動かす） } */
(function () {
  'use strict';
  const helps = new Map();
  const tasks = new Map();

  // 検索用に、全角半角・カタカナひらがな・大文字小文字をそろえる
  function norm(s) {
    return String(s || '').normalize('NFKC').toLowerCase()
      .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
      .replace(/[\s・、。,.!?！？「」『』（）()［］\[\]〜~ー－\-_/／:：]+/g, '');
  }

  window.Guide = {
    norm,
    help(id, def) { helps.set(id, Object.assign({ can: [], first: [], faq: [], tour: [], related: [] }, def)); },
    getHelp(id) { return helps.get(id) || null; },
    allHelp() { return [...helps.entries()]; },
    tasks(list) { for (const t of [].concat(list || [])) { if (!t || !t.id || !t.app) throw new Error('Guide.tasks: id と app が必要です'); tasks.set(t.id, t); } },
    getTask(id) { return tasks.get(id) || null; },
    allTasks() { return [...tasks.values()]; },

    // 「やりたいこと」を探す。言葉ごとに分けて、どれもが含まれるものを、タイトルに近い順に
    search(q, limit = 8) {
      const raw = String(q || '').trim();
      if (!raw) return [];
      const words = raw.split(/[\s　]+/).map(norm).filter(Boolean);
      const out = [];
      for (const t of tasks.values()) {
        if (t.hidden) continue;
        const def = window.Kit && Kit.appDef ? Kit.appDef(t.app) : null;
        const title = norm(t.title), hay = title + ' ' + norm(t.words) + ' ' + norm(def ? def.title : '');
        let score = 0, ok = true;
        for (const w of words) {
          if (!hay.includes(w)) { ok = false; break; }
          score += title.startsWith(w) ? 6 : title.includes(w) ? 4 : 1;
        }
        if (ok) out.push({ t, score: score + (t.pin ? 1 : 0) });
      }
      out.sort((a, b) => b.score - a.score || a.t.title.length - b.t.title.length);
      return out.slice(0, limit).map((x) => x.t);
    },
  };
})();
