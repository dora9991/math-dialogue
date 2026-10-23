/* 印刷の画面（#/print/<id>）：上に「印刷する」「もどる」の帯、その下に紙の見本。印刷すると帯は消える。
   印刷の画面の足し方：
     T.page('print', 'badges', { title: '名札', paper: 'A4', render(r) { return T.html`<section class="sheet">…</section>`; } });
   1枚＝ <section class="sheet">（A4 縦。横は class="sheet land"）。印刷では1枚ずつ改ページされる。
   管理画面からだけ開く印刷は admin: true をつける（ログインしていないと開けない）。 */
(function () {
  'use strict';
  const { html, icon } = T;
  const app = () => document.getElementById('app');

  T.shells.print = (r) => {
    document.body.className = 'is-print';
    const pg = T.pages.print[r.id];
    if (!pg) { app().innerHTML = '<p style="padding:24px">印刷するものが見つかりません。</p>'; return; }
    let authed = false; try { authed = !!JSON.parse(sessionStorage.getItem('taikai.admin') || '{}').ok; } catch (e) { /* なにもしない */ }
    if (pg.admin && !authed) { T.go('admin'); return; }
    const ev = T.ev();
    T.applyTheme(ev);
    T.activePage = pg;
    document.title = pg.title + '｜' + T.eventTitle(ev);
    let body;
    try { body = pg.render(r); } catch (e) { console.error(e); body = html`<div class="note bad">作れませんでした：${e.message}</div>`; }
    const back = r.q.back || (pg.admin ? 'admin' : '');
    app().innerHTML = String(html`<div class="print-bar">
        <a class="btn sm ghost" href="#/${back}">${icon('back')} もどる</a>
        <b>${pg.title}</b><span class="muted small only-pc">${pg.hint || '「印刷する」→ 送信先で「PDFに保存」を選ぶと PDF になります。'}</span>
        <span class="spacer"></span>
        ${pg.tools ? pg.tools(r) : ''}
        <button class="btn primary" data-act="print">${icon('print')} 印刷する</button>
      </div>
      <div class="print-root ${pg.cls || ''}">${body}</div>`);
    if (pg.mount) pg.mount(app().querySelector('.print-root'), r);
  };
})();
