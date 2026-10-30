/* ikkan：単元の学習予定表（A4 表裏。生徒が持つ。単元のはじめに配る）。画面を持たない（core.js・rec.js のあとに読む）。
   授業ごとに 4 行：①第○時・題・予定日・実施日　②できたものに ✔（ワーク・基礎・標準・応用・入試・考えよう・小テストの点）
                   ③ふり返りの自己評価（◎○△）　④ひとこと（つまずき・次にやること）
   はじめに「この単元で身につけたい力」と「自分の目標」、おわりに「単元のふり返り」をおく。
   ふり返りは、予定表の中に組みこんである。右上の QR は、単元の「自分の記録」ページ（#/r/<単元>）に行く。
   IK.plansheet(単元のキー) → 紙面（pagesHTML に渡せる形）。演習・小テストのある授業がない単元は null */
(function () {
  'use strict';
  const IK = window.IK, R = IK.render;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  IK.unitGoals = IK.unitGoals || {};   // 単元のねらい（生徒に見せる文）。data/lessons.js に書く

  const U = n => `<u style="width:${n}mm"></u>`;
  const box = '<span class="ps-bx"></span>';
  const row = (cls, html) => `<div class="ps-r ${cls}">${html}</div>`;

  // compact：授業が多い単元（A4 表裏 2 ページに、4行ずつでは入らないとき）は、ふり返りの行に「ひとこと」を入れて、3行にする
  const CHK_OLD = ['ワーク', '基礎', '標準', '応用', '入試', '考えよう'], CHK_NEW = ['ワーク', '確かめる', '使ってみる', 'ひろげる', 'チャレンジ'];   // できたら ✔ の欄（新しい形は、演習プリントの見出しにそろえる）
  // tight：授業が 20時以上の単元は、2行ずつ（ふり返りを、できたら✔の行に入れる。ひとことの行はなし）
  const lessonBlock = (l, compact, checks, tight) => tight ? ({
    type: 'raw', rows: 2, cls: 'ps-lesson',
    html: row('r1', `<span class="ps-no">${esc(l.no || '')}</span><b class="ps-ttl">${esc(l.title)}</b><span class="ps-dt">予定 ${U(5)}／${U(5)}　実施 ${U(5)}／${U(5)}</span>`)
      + row('r2', `<span class="ps-lb">できたら✔</span>${checks.map(t => `<span class="ps-ck">${box}${t}</span>`).join('')}<span class="ps-ev ps-ev2">ふり返り ◎ ○ △</span><span class="ps-sc">小テスト ${U(6)}／10点</span>`)
  }) : ({
    type: 'raw', rows: compact ? 3 : 4, cls: 'ps-lesson',
    html: row('r1', `<span class="ps-no">${esc(l.no || '')}</span><b class="ps-ttl">${esc(l.title)}</b><span class="ps-dt">予定 ${U(6)}／${U(6)}　実施 ${U(6)}／${U(6)}</span>`)
      + row('r2', `<span class="ps-lb">できたら✔</span>${checks.map(t => `<span class="ps-ck">${box}${t}</span>`).join('')}<span class="ps-sc">小テスト ${U(7)}／10点</span>`)
      + row('r3', `<span class="ps-lb">ふり返り</span><span class="ps-ev">◎ よくわかった</span><span class="ps-ev">○ だいたいわかった</span><span class="ps-ev">△ まだあやしい</span><span class="ps-hint">${compact ? 'ひとこと：' : '（あてはまるものを ○でかこむ）'}</span>`)
      + (compact ? '' : row('r4', `<span class="ps-lb">ひとこと</span><span class="ps-hint">つまずいたこと・次にやること</span>`))
  });

  const headBlock = (u, goals) => {
    const gs = goals.slice(0, 3);
    return {
      type: 'raw', rows: gs.length + 2, cls: 'ps-top',
      html: gs.map((g, i) => row('r2 ps-goal', `<b class="ps-lb ps-h">${i ? '' : 'ねらい'}</b><span class="ps-n">${'①②③'[i]}</span><span>${esc(g)}</span>`)).join('')
        + row('r4', `<b class="ps-lb ps-h">自分の目標</b><span class="ps-hint">この単元で、できるようになりたいこと（下の行にも書く）</span>`)
        + row('r5', '')
    };
  };

  const endBlock = () => ({
    type: 'raw', rows: 9, cls: 'ps-end',
    html: row('r1', '<b class="ps-h ps-h2">単元のふり返り</b>')
      + row('r2', '<span class="ps-lb2">わかるようになったこと</span>') + row('r3', '')
      + row('r2', '<span class="ps-lb2">まだあやしいこと・もう一度やりたいこと</span>') + row('r3', '')
      + row('r2', '<span class="ps-lb2">次の学習に生かしたいこと</span>') + row('r3', '')
      + row('r3', '<span class="ps-lb">自己評価</span><span class="ps-ev">知識・技能　◎ ○ △</span><span class="ps-ev">考える力　◎ ○ △</span><span class="ps-ev">学びに向かう力　◎ ○ △</span>')
      + row('r4', '<span class="ps-lb">先生より</span>')
  });

  IK.plansheet = key => {
    const u = IK.units.find(x => x.key === key), ls = u ? IK.rec.lessons(key) : [];
    if (!u || !ls.length) return null;
    const sheet = { id: 'plan-' + key, paper: 'A4', pitch: 7, dots: true, head: `${u.name}　学習予定表`, blocks: [], qr: 'r/' + key, qrCap: '← 自分の記録（演習・小テスト）' };
    const rows = R.geo(sheet).rows;
    let used = 0;
    const put = b => { if (used + b.rows > rows) { sheet.blocks.push({ type: 'break' }); used = 0; } sheet.blocks.push(b); used += b.rows; };
    put(headBlock(u, IK.unitGoals[key] || []));
    const compact = ls.length > 15;   // 4行×15時 ＋ 上 5行 ＋ 下 9行 ＝ 74行（2ページ）。16時以上は、3行にする
    const checks = u.form === 'new' ? CHK_NEW : CHK_OLD, tight = ls.length > 19;   // 3行ずつは、19時まで（1ページ目に 10時、2ページ目に 9時＋おわりの 9行）。20時以上は 2行ずつ
    ls.forEach(l => put(lessonBlock(l, compact, checks, tight)));
    put(endBlock());
    return sheet;
  };
})();
