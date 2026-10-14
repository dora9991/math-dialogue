// リーンキャンバス（準備中の仮置き。本体ができたらこのファイルごと置きかえる）
Kit.app({
  id: 'canvas', title: 'リーンキャンバス', group: 'plan', icon: 'canvas', order: 41,
  desc: '事業の骨組みを1枚にまとめる',
  mount(root) {
    root.append(Kit.appHead({ title: 'リーンキャンバス', desc: '事業の骨組みを1枚にまとめる' }), Kit.empty({ title: '準備中です', body: 'もうすぐ使えるようになります。' }));
  },
});
