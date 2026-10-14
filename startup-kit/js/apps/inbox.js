// 集客窓口（準備中の仮置き。本体ができたらこのファイルごと置きかえる）
Kit.app({
  id: 'inbox', title: '集客窓口', group: 'gather', icon: 'inbox', order: 20,
  desc: '問い合わせフォームと、受付箱（返信・商談の管理）',
  mount(root) {
    root.append(Kit.appHead({ title: '集客窓口', desc: '問い合わせフォームと、受付箱（返信・商談の管理）' }), Kit.empty({ title: '準備中です', body: 'もうすぐ使えるようになります。' }));
  },
});
