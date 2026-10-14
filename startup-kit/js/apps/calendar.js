// カレンダー（準備中の仮置き。本体ができたらこのファイルごと置きかえる）
Kit.app({
  id: 'calendar', title: 'カレンダー', group: 'plan', icon: 'calendar', order: 40,
  desc: '予定・予約・投稿日・支払期限をひとつに',
  mount(root) {
    root.append(Kit.appHead({ title: 'カレンダー', desc: '予定・予約・投稿日・支払期限をひとつに' }), Kit.empty({ title: '準備中です', body: 'もうすぐ使えるようになります。' }));
  },
});
