// ホームページエディター（準備中の仮置き。本体ができたらこのファイルごと置きかえる）
Kit.app({
  id: 'editor', title: 'ホームページエディター', group: 'make', icon: 'layout', order: 11,
  desc: '文章・写真・色を、見ながら直す',
  mount(root) {
    root.append(Kit.appHead({ title: 'ホームページエディター', desc: '文章・写真・色を、見ながら直す' }), Kit.empty({ title: '準備中です', body: 'もうすぐ使えるようになります。' }));
  },
});
