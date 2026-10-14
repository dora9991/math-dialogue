// ホームページ（準備中の仮置き。本体ができたらこのファイルごと置きかえる）
Kit.app({
  id: 'site', title: 'ホームページ', group: 'make', icon: 'globe', order: 10,
  desc: 'お客さんが見るページ。スマホでの見え方も確かめて、公開用に書き出す',
  mount(root) {
    root.append(Kit.appHead({ title: 'ホームページ', desc: 'お客さんが見るページ。スマホでの見え方も確かめて、公開用に書き出す' }), Kit.empty({ title: '準備中です', body: 'もうすぐ使えるようになります。' }));
  },
});
