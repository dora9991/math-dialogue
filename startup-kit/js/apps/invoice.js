// 見積書・請求書（準備中の仮置き。本体ができたらこのファイルごと置きかえる）
Kit.app({
  id: 'invoice', title: '見積書・請求書', group: 'earn', icon: 'receipt', order: 31,
  desc: 'インボイス対応の見積・請求・領収をつくる',
  mount(root) {
    root.append(Kit.appHead({ title: '見積書・請求書', desc: 'インボイス対応の見積・請求・領収をつくる' }), Kit.empty({ title: '準備中です', body: 'もうすぐ使えるようになります。' }));
  },
});
