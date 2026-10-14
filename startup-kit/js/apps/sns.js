// SNS投稿プランナー（準備中の仮置き。本体ができたらこのファイルごと置きかえる）
Kit.app({
  id: 'sns', title: 'SNS投稿プランナー', group: 'gather', icon: 'megaphone', order: 21,
  desc: '投稿の下書き・文字数・予定をまとめて',
  mount(root) {
    root.append(Kit.appHead({ title: 'SNS投稿プランナー', desc: '投稿の下書き・文字数・予定をまとめて' }), Kit.empty({ title: '準備中です', body: 'もうすぐ使えるようになります。' }));
  },
});
