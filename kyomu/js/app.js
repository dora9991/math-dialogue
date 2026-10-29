/* アプリの外枠：上のタブ、画面の切りかえ、元に戻す（Ctrl+Z）、はじめて開いたときの案内。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const V = K.views;
  const app = (K.app = {});

  const TABS = [
    ['week', '週行事'],
    ['month', '月行事'],
    ['year', '年間行事'],
    ['hours', '時数'],
    ['base', '基本時間割'],
    ['teachers', '先生'],
    ['settings', '設定・取り込み'],
  ];
  let cur = 'week';
  let params = [];

  function shell() {
    const y = m.st.school.year;
    u.$('#app').innerHTML = `
      <header class="top">
        <div class="brand">教務・時間割<small>R${y - 2018}（${y}年度）</small></div>
        <nav class="tabs">${TABS.map(([k, t]) => `<button data-tab="${k}">${t}</button>`).join('')}</nav>
        <div class="right">
          <span id="save-state"></span>
          <span id="backup-chip"></span>
          <button class="icon" data-top="undo" title="元に戻す（Ctrl+Z）">↶ 戻す</button>
          <button class="icon" data-top="redo" title="やり直す（Ctrl+Y）">↷</button>
          <button class="icon" data-top="backup" title="データを JSON ファイルに書き出す">バックアップ</button>
        </div>
      </header>
      <main id="main"></main>`;
    u.$('.top').addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]');
      if (t) app.go(t.dataset.tab);
      const b = e.target.closest('[data-top]');
      if (!b) return;
      if (b.dataset.top === 'undo') K.store.undo();
      if (b.dataset.top === 'redo') K.store.redo();
      if (b.dataset.top === 'backup') {
        K.store.exportJson();
        backupChip();
      }
    });
  }

  function backupChip() {
    const el = u.$('#backup-chip');
    if (!el) return;
    const n = K.store.daysSinceBackup();
    const hasData = Object.keys(m.st.ovr).length || m.st.events.length;
    el.innerHTML = hasData && (n == null || n >= 7) ? `<span class="chip warn" title="ブラウザのデータが消えると戻せません">${n == null ? 'まだバックアップしていません' : `バックアップ：${n}日前`}</span>` : '';
  }

  function render() {
    u.$$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === cur));
    const v = V[cur];
    const main = u.$('#main');
    if (!v) {
      main.innerHTML = '<div class="view">準備中</div>';
      return;
    }
    const y = window.scrollY;
    if (v.open && !render.same) v.open(params);
    v.render(main, params);
    if (render.same) window.scrollTo(0, y);
    document.title = `${v.title}｜教務・時間割`;
    backupChip();
  }

  app.go = (view, ...p) => {
    const h = '#' + [view, ...p].filter(Boolean).join('/');
    if (location.hash !== h) location.hash = h;
    else route();
  };
  function route() {
    const [v, ...p] = location.hash.replace(/^#/, '').split('/');
    cur = V[v] ? v : 'week';
    params = p.map(decodeURIComponent);
    render.same = false;
    render();
  }
  app.refresh = () => {
    render.same = true;
    render();
    render.same = false;
  };

  function welcome() {
    const md = u.modal(
      `<h2>教務・時間割へようこそ</h2>
      <p>このページは、<b>このパソコンのブラウザの中だけ</b>で動きます。入力した内容はどこにも送られません（インターネットにつながっていなくても使えます）。</p>
      <p class="help">ブラウザの「閲覧データの削除」をすると消えるので、上の「バックアップ」でときどき JSON ファイルに書き出してください。</p>
      <div class="card" style="margin-top:12px">
        <h3>はじめ方</h3>
        <div class="row" style="gap:10px">
          <button class="btn primary" data-w="import">今の Excel（週行事）から取り込む</button>
          <button class="btn" data-w="restore">バックアップ（JSON）から戻す</button>
          <button class="btn" data-w="blank">空の状態から始める</button>
        </div>
      </div>`,
      { wide: false }
    );
    md.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-w]');
      if (!b) return;
      md.close();
      if (b.dataset.w === 'import') app.go('settings', 'import');
      if (b.dataset.w === 'restore') app.go('settings');
      if (b.dataset.w === 'blank') {
        K.store.commit('はじめる', (st) => (st.savedAt = new Date().toISOString()));
        app.go('base', 't1');
      }
    });
  }

  app.start = () => {
    const had = K.store.load();
    shell();
    K.store.on(() => {
      if (render.lock) return;
      app.refresh();
    });
    window.addEventListener('hashchange', route);
    document.addEventListener('keydown', (e) => {
      const mod = e.ctrlKey || e.metaKey;
      const inField = e.target.closest && e.target.closest('input,textarea,select');
      if (mod && !inField && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) K.store.redo();
        else K.store.undo();
        return;
      }
      if (mod && !inField && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        K.store.redo();
        return;
      }
      if (u.$('.modal-back')) return;
      const v = V[cur];
      if (v && v.key) v.key(e);
    });
    window.addEventListener('beforeunload', () => K.store.status(''));
    route();
    K.store.status(had ? '保存済み' : '');
    if (!had) welcome();
  };

  document.addEventListener('DOMContentLoaded', app.start);
})();
