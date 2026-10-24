/* ikkan：記録ページ（コツコツくんにつなぐ第一段階）のデータの部分。画面を持たない（core.js のあとに読む。node の検査でも読める）。
   演習プリント・小テストの問題を、番号つきの一覧（問題ID・レベル・配点・問題文・答え）として取り出し、
   生徒が自己採点した結果を「結果コード」にして先生に送り、先生がまとめて集計できるようにする。
   問題ID：<授業のID>.<dr|qz>.<問題の番号>（例：kukan-03.dr.4）。コツコツくん側の問題と、この ID で対応づける。
   結果コード：IKR1.＋（JSON を UTF-8 にして base64url にしたもの）。中身 { v:1, l:授業のID, k:'dr'|'qz', g:組, n:番号, t:送った時刻（分）, m:'1o2t3x…', a:{番号:自分の答え}, r:ふり返り } */
(function () {
  'use strict';
  const IK = window.IK;
  const rec = (IK.rec = IK.rec || {});

  rec.KINDS = { dr: '演習', qz: '小テスト' };
  rec.MARKS = { o: '○', t: '△', x: '×' };                   // 自己採点：○できた　△あやしい　×できなかった
  rec.LOCK = { dr: false, qz: true };                         // 答えを「ひらく番号」で隠すか（小テストは、テスト中に見られないよう隠す）
  rec.LEVELS = ['基礎', '標準', '応用', '入試レベル'];         // 演習プリントのレベル（コツコツくんの 4 段階に対応）

  /* ---------------- 問題の取り出し ---------------- */
  const flat = (blocks, out) => { blocks.forEach(b => { if (b.type === 'cols') b.cols.forEach(c => flat(c.blocks, out)); else out.push(b); }); return out; };
  const STOP = new Set(['meate', 'manabi', 'words', 'break', 'kadai']);

  // 演習プリント（dr）・小テスト（qz）の「（1）」「（2）」…の問題を、順に取り出す。答えは、そのすぐ下の板書（B）から
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);   // 結果コードは生徒が作るので、__proto__ などの名前をはじく
  rec.items = (id, kind) => {
    const reg = kind === 'dr' ? IK.drills : kind === 'qz' ? IK.quizzes : null, sh = reg && own(reg, id) ? reg[id] : null;
    if (!sh) return [];
    const fl = flat(sh.blocks, []), out = [];
    let level = '';
    fl.forEach((b, i) => {
      if (b.type === 'meate' && b.label) { level = b.label === '演習' ? '' : b.label; return; }
      if (b.type !== 'text') return;
      const m = /^（(\d+)）([①-⑩])?$/.exec(b.label || '');
      if (!m) return;
      const ans = [];
      for (let j = i + 1; j < fl.length; j++) {
        const x = fl[j];
        if (STOP.has(x.type) || (x.type === 'text' && x.label)) break;
        if (x.type === 'board' && x.answer) ans.push(x.answer);
      }
      const pt = /（(\d+)点）/.exec(b.text);
      const text = String(b.text).replace(/\s*（\d+点）/, '');
      // 「（1）①」「（1）②」のように、2つ（以上）が並んだ問題は、「（1）」の 1 つの問題にまとめる（自己採点は、組ごとに 1 つ）
      const sub = m[2] ? `${'①②③④⑤⑥⑦⑧⑨⑩'.indexOf(m[2]) + 1}つ目　` : '';   // 式の ①② と、まぎらわしくないように
      const prev = m[2] && out.find(o => o.no === +m[1]);
      if (prev) {
        prev.text += '\n' + sub + text;
        if (ans.length) prev.ans += (prev.ans ? '\n' : '') + sub + ans.join('\n');
        return;
      }
      out.push({
        id: `${id}.${kind}.${m[1]}`, no: +m[1], label: m[2] ? `（${m[1]}）` : b.label, kind, level,
        challenge: level === 'チャレンジ',
        pts: pt ? +pt[1] : null,
        text: sub + text,
        ans: sub && ans.length ? sub + ans.join('\n') : ans.join('\n')
      });
    });
    return out;
  };

  // 単元の、すべての問題（コツコツくんに渡す一覧）
  rec.catalog = unit => {
    const out = [];
    IK.order.forEach(id => {
      const l = IK.lessons[id];
      if (l.unit !== unit) return;
      ['dr', 'qz'].forEach(k => rec.items(id, k).forEach(it => out.push(Object.assign({ unit, lesson: id, lessonNo: l.no || '', lessonTitle: l.title }, it))));
    });
    return out;
  };

  // 記録ページを使う授業（IK.qrUnits の単元で、演習か小テストがある授業）
  rec.lessons = unit => IK.order.map(id => IK.lessons[id]).filter(l => l.unit === unit && (IK.drills[l.id] || IK.quizzes[l.id]));

  // 小テストの答えをひらく番号（授業ごとに 4 けた。先生が、テストのあとで伝える。ふつうの生徒には、すぐには推測できない）
  rec.openCode = id => {
    let h = 2166136261;
    const s = 'ikkan:open:' + id;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return String(1000 + (h % 9000));
  };

  // 小テストの得点の目安：チャレンジが○なら 10点（別枠）。それ以外は、○の問題の配点の合計（△は 0点。正式な得点は、先生の採点）
  rec.score = (items, marks) => {
    const ch = items.find(it => it.challenge);
    if (ch && marks[ch.no] === 'o') return 10;
    return items.filter(it => !it.challenge && marks[it.no] === 'o').reduce((a, it) => a + (it.pts || 0), 0);
  };

  /* ---------------- 結果コード ---------------- */
  const b64e = s => { const u = new TextEncoder().encode(s); let bin = ''; u.forEach(c => { bin += String.fromCharCode(c); }); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const b64d = t => { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; const bin = atob(t); return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))); };

  const clip = (s, n) => Array.from(String(s == null ? '' : s)).slice(0, n).join('');
  // { l, k, g, n, marks:{番号:o|t|x}, ans:{番号:文字}, refl, sendAns } → 結果コード
  rec.encode = r => {
    const m = Object.keys(r.marks || {}).map(Number).sort((a, b) => a - b).filter(no => rec.MARKS[r.marks[no]]).map(no => no + r.marks[no]).join('');
    const o = { v: 1, l: r.l, k: r.k, g: clip(r.g, 6), n: clip(r.n, 3), t: Math.floor((r.t || Date.now()) / 60000), m };
    if (r.sendAns) {
      const a = {};
      Object.keys(r.ans || {}).forEach(no => { const t = clip(String(r.ans[no]).trim(), 80); if (t) a[no] = t; });
      if (Object.keys(a).length) o.a = a;
    }
    if (r.refl && String(r.refl).trim()) o.r = clip(String(r.refl).trim(), 100);
    return 'IKR1.' + b64e(JSON.stringify(o));
  };
  // 結果コード → { l, k, g, n, t(ミリ秒), marks, ans, refl }。読めなければ null
  rec.decode = code => {
    try {
      const m = /^IKR1\.([A-Za-z0-9_-]+)$/.exec(String(code).trim());
      if (!m) return null;
      const o = JSON.parse(b64d(m[1]));
      if (!o || o.v !== 1 || typeof o.l !== 'string' || !own(rec.KINDS, o.k) || !own(IK.lessons, o.l) || !rec.items(o.l, o.k).length) return null;
      const marks = {}, ans = {};
      String(o.m || '').replace(/(\d+)([otx])/g, (_, no, ch) => { marks[+no] = ch; return ''; });
      if (o.a && typeof o.a === 'object') Object.keys(o.a).forEach(no => { if (/^\d+$/.test(no)) ans[no] = clip(String(o.a[no]), 80); });
      return { l: o.l, k: o.k, g: clip(o.g, 6), n: clip(o.n, 3), t: (+o.t || 0) * 60000, marks, ans, refl: clip(o.r, 100), code: String(code).trim() };
    } catch (e) { return null; }
  };
  // 貼りつけた文章の中から、結果コードをすべて探す。読めたものと、読めなかった数を返す。
  // 同じ人（組・番号）の同じ授業・同じ種類は、いちばん新しいものだけ残す（組・番号がないものは、すべて別の人として数える）
  rec.parse = text => {
    const found = String(text || '').match(/IKR1\.[A-Za-z0-9_-]+/g) || [];
    const all = [], seen = new Set();
    let bad = 0;
    found.forEach(c => {
      if (seen.has(c)) return;
      seen.add(c);
      const r = rec.decode(c);
      if (r) all.push(r); else bad++;
    });
    const latest = new Map(), anon = [];
    all.forEach(r => {
      if (!r.g && !r.n) { anon.push(r); return; }
      const key = [r.l, r.k, r.g, r.n].join('|'), old = latest.get(key);
      if (!old || r.t >= old.t) latest.set(key, r);
    });
    return { recs: [...latest.values(), ...anon], bad, dup: all.length - latest.size - anon.length };
  };

  // 授業・種類ごとに、問題ごとの ○△×の人数と、答えのちがいを数える
  rec.summarize = recs => {
    const groups = new Map();
    recs.forEach(r => {
      const key = r.l + '.' + r.k;
      if (!groups.has(key)) groups.set(key, { l: r.l, k: r.k, items: rec.items(r.l, r.k), rows: [] });
      groups.get(key).rows.push(r);
    });
    const order = id => IK.order.indexOf(id);
    return [...groups.values()].sort((a, b) => order(a.l) - order(b.l) || (a.k < b.k ? -1 : a.k > b.k ? 1 : 0)).map(g => {
      const nos = g.items.map(it => it.no);
      g.rows.forEach(r => Object.keys(r.marks).forEach(no => { if (nos.indexOf(+no) < 0) nos.push(+no); }));
      g.per = nos.map(no => {
        const it = g.items.find(x => x.no === no) || { no, label: `（${no}）`, level: '', text: '（いまの問題一覧にない問題）', ans: '', pts: null };
        const c = { o: 0, t: 0, x: 0, none: 0 }, ans = new Map();
        g.rows.forEach(r => {
          const m = r.marks[no];
          if (m) c[m]++; else c.none++;
          const a = r.ans[no];
          if (a) { const e = ans.get(a) || { a, n: 0, o: 0 }; e.n++; if (m === 'o') e.o++; ans.set(a, e); }
        });
        const done = c.o + c.t + c.x;
        return { it, c, done, rate: done ? c.o / done : null, answers: [...ans.values()].sort((a, b) => b.n - a.n) };
      });
      return g;
    });
  };

  // 結果の CSV（1 行＝1 人の 1 問）。表計算ソフトや、コツコツくんに取りこむとき用
  rec.csv = recs => {
    const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const rows = [['組', '番号', '授業', '種類', '問題ID', '問題', '自己採点', '自分の答え', '送った時刻', 'ふり返り'].map(q).join(',')];
    recs.forEach(r => {
      const its = rec.items(r.l, r.k), nos = its.map(i => i.no);
      Object.keys(r.marks).map(Number).sort((a, b) => nos.indexOf(a) - nos.indexOf(b)).forEach(no => {
        const t = r.t ? new Date(r.t) : null, ts = t ? `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` : '';
        rows.push([r.g, r.n, r.l, rec.KINDS[r.k], `${r.l}.${r.k}.${no}`, `（${no}）`, rec.MARKS[r.marks[no]], r.ans[no] || '', ts, r.refl].map(q).join(','));
      });
    });
    return '﻿' + rows.join('\r\n') + '\r\n';
  };
})();
