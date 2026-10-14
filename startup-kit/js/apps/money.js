// マネタイズ計画（準備中の仮置き。本体ができたらこのファイルごと置きかえる）
Kit.app({
  id: 'money', title: 'マネタイズ計画', group: 'earn', icon: 'yen', order: 30,
  desc: '売上のしくみを組み立てて、12か月を試算する',
  mount(root) {
    root.append(Kit.appHead({ title: 'マネタイズ計画', desc: '売上のしくみを組み立てて、12か月を試算する' }), Kit.empty({ title: '準備中です', body: 'もうすぐ使えるようになります。' }));
  },
});
