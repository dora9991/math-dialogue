// 動画エディター（準備中の仮置き。本体ができたらこのファイルごと置きかえる）
Kit.app({
  id: 'video', title: '動画エディター', group: 'make', icon: 'film', order: 12,
  desc: '切る・つなぐ・テロップ・BGM。縦動画にも',
  mount(root) {
    root.append(Kit.appHead({ title: '動画エディター', desc: '切る・つなぐ・テロップ・BGM。縦動画にも' }), Kit.empty({ title: '準備中です', body: 'もうすぐ使えるようになります。' }));
  },
});
