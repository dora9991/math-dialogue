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

  const lessonBlock = l => ({
    type: 'raw', rows: 4, cls: 'ps-lesson',
    html: row('r1', `<span class="ps-no">${esc(l.no || '')}</span><b class="ps-ttl">${esc(l.title)}</b><span class="ps-dt">予定 ${U(6)}／${U(6)}　実施 ${U(6)}／${U(6)}</span>`)
      + row('r2', `<span class="ps-lb">できたら✔</span>${['ワーク', '基礎', '標準', '応用', '入試', '考えよう'].map(t => `<span class="ps-ck">${box}${t}</span>`).join('')}<span class="ps-sc">小テスト ${U(7)}／10点</span>`)
      + row('r3', `<span class="ps-lb">ふり返り</span><span class="ps-ev">◎ よくわかった</span><span class="ps-ev">○ だいたいわかった</span><span class="ps-ev">△ まだあやしい</span><span class="ps-hint">（あてはまるものを ○でかこむ）</span>`)
      + row('r4', `<span class="ps-lb">ひとこと</span><span class="ps-hint">つまずいたこと・次にやること</span>`)
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
    ls.forEach(l => put(lessonBlock(l)));
    put(endBlock());
    return sheet;
  };
})();
