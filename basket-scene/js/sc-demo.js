/* バスケ シーン — 見本の試合（ホームの「▶ 見本の試合で試す」）
   はじめて見る人に、すぐ見せられるように：見本の動画（demo/demo.mp4・約1分）と、もう記録してある試合を開く。
   記録が入っているので、「② 場面」「③ スタッツ」を押すだけで、場面とスタッツが見られる。自分でタップして足すこともできる。
   見本の試合は、ホームの「これまでの試合」には出さない（開くたびに、はじめの状態に作り直す）。 */
(function (root) {
  'use strict';
  const BT = root.BT, SC = root.SC;
  const { h } = BT.ui;
  const ID = 'gDemo';
  let busy = false;

  /* demo.json（起きたこと：v は動画の時刻）から、この試合の記録を作る。
     自分のチーム（teams[0]）のプレーは、そのまま。相手（teams[1]）は、得点だけ（1・2・3点）。人がタップするのは、プレーの約1秒あと */
  function build(meta, file) {
    const mine = meta.teams[0], opp = meta.teams[1];
    const g = SC.app.createGame(file, { name: mine.name, color: mine.color, colorName: BT.nearestColorName(mine.color), players: BT.cleanPlayers(mine.players), opp: opp.name });
    g.id = ID;
    g.demo = true;
    g.teams[1].color = opp.color; g.teams[1].colorName = BT.nearestColorName(opp.color);
    (meta.events || []).forEach((e) => {
      const d = BT.TYPE[e.kind];
      if (!d || e.kind === 'period') return;
      const t = Math.round((e.v + 1) * 10) / 10;
      if (e.team === 0) BT.addEvent(g, { t, type: e.kind, team: 0, no: e.no });
      else if (e.team === 1 && d.pts) BT.addEvent(g, { t, type: e.kind, team: 1, no: null });
    });
    return g;
  }
  async function open() {
    if (busy) return;
    busy = true;
    BT.ui.toast('見本の試合を読み込んでいます…', '', 4000);
    try {
      const meta = await (await fetch('demo/demo.json', { cache: 'force-cache' })).json();
      const blob = await (await fetch('demo/' + (meta.file || 'demo.mp4'), { cache: 'force-cache' })).blob();
      if (!blob.size) throw new Error('empty');
      const file = new File([blob], '見本の試合.mp4', { type: blob.type || 'video/mp4' });
      SC.store.deleteGame(ID);
      SC.app.openGame(build(meta, file), file);
      BT.ui.toast('見本の試合です（記録が入っています）。「② 場面」「③ スタッツ」を押してみてください。自分でタップして足すこともできます', 'ok', 9000);
    } catch (e) {
      BT.ui.toast('見本の試合を読み込めませんでした（インターネットにつながる所で、もう一度）', 'err', 6000);
    }
    busy = false;
  }
  SC.app.on('home', () => {
    const box = document.getElementById('scHomeExtra');
    if (!box || root.location.protocol === 'file:') return;
    box.innerHTML = '';
    box.append(h('button', { class: 'sc-demo', id: 'scDemo', onclick: open },
      h('span', { class: 'mi', 'aria-hidden': 'true' }, '▶'),
      h('span', { class: 'mt' }, h('b', null, '見本の試合で試す'), h('small', null, '約1分の見本の動画と、記録ずみの試合が開きます（はじめての人に見せるときにも）'))));
  });
  SC.demo = { ID, open, build };
})(typeof window !== 'undefined' ? window : globalThis);
