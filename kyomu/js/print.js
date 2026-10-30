/* 印刷・PDF。ブラウザの印刷を使う（送り先で「PDF に保存」を選ぶと PDF になる）。
   週行事は 1 週＝A4 縦 1 枚（Excel と同じ）。年間行事は A4 横（A3 にも拡大印刷できる）。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const P = (K.print = {});

  // pages: ページの HTML の並び、land: 横向き
  P.run = (pages, land) => {
    const area = u.$('#print-area');
    area.innerHTML = pages.join('');
    let style = u.$('#page-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'page-style';
      document.head.appendChild(style);
    }
    style.textContent = `@page { size: A4 ${land ? 'landscape' : 'portrait'}; margin: 0; }`;
    // 縮める計算のため、いったん画面の外に出して大きさを測る
    area.style.cssText = 'display:block;position:absolute;left:-30000px;top:0';
    K.sheet.fitPages(area);
    area.style.cssText = '';
    const clear = () => {
      area.innerHTML = '';
      window.removeEventListener('afterprint', clear);
    };
    window.addEventListener('afterprint', clear);
    setTimeout(() => window.print(), 50);
  };

  P.weekPages = (mons, o) => mons.map((mon) => K.sheet.page(K.sheet.week(mon, o)));

  // ボタンを使わずに Ctrl+P で印刷したときも、いま開いている画面の印刷用ページを出す
  window.addEventListener('beforeprint', () => {
    const area = u.$('#print-area');
    if (!area || area.innerHTML.trim()) return;
    const h = location.hash.replace(/^#/, '').split('/')[0] || 'week';
    let pages = [];
    let land = false;
    if (h === 'week') pages = P.weekPages([K.views.week.mon()], {});
    else if (K.views[h] && K.views[h].printPages) {
      const r = K.views[h].printPages({ kind: h });
      pages = r.pages;
      land = r.land;
    }
    if (!pages.length) return;
    area.innerHTML = pages.join('');
    let style = u.$('#page-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'page-style';
      document.head.appendChild(style);
    }
    style.textContent = `@page { size: A4 ${land ? 'landscape' : 'portrait'}; margin: 0; }`;
    area.style.cssText = 'display:block;position:absolute;left:-30000px;top:0';
    K.sheet.fitPages(area);
    area.style.cssText = '';
    const clear = () => {
      area.innerHTML = '';
      window.removeEventListener('afterprint', clear);
    };
    window.addEventListener('afterprint', clear);
  });

  P.dialog = (job) => {
    if (job.kind !== 'week') return P.direct(job);
    const weeks = m.weeks().filter((w) => w.no);
    const curNo = m.weekNo(job.mon);
    const opt = m.st.opt;
    const md = u.modal(
      `<h3>週行事を印刷・PDF</h3>
      <p class="help">Excel と同じ形で、1週を A4 縦 1 枚にします。PDF にするときは、印刷の画面の「送信先（プリンター）」で<b>「PDF に保存」</b>を選んでください。</p>
      <div class="form">
        <label>どの週</label>
        <div class="row">
          <label class="chk"><input type="radio" name="rng" value="one" checked>この週（${curNo ? `第${curNo}週` : u.md(job.mon)}）</label>
          <label class="chk"><input type="radio" name="rng" value="many">第<select data-p="from">${weeks.map((w) => `<option value="${w.mon}" ${w.mon === job.mon ? 'selected' : ''}>${w.no}</option>`).join('')}</select>週 〜 第<select data-p="to">${weeks.map((w) => `<option value="${w.mon}" ${w.mon === job.mon ? 'selected' : ''}>${w.no}</option>`).join('')}</select>週</label>
        </div>
        <label>入れるもの</label>
        <div class="row">
          <label class="chk"><input type="checkbox" data-p="staff" ${opt.showStaff ? 'checked' : ''}>出張等の欄</label>
          <label class="chk"><input type="checkbox" data-p="mark" ${opt.mark ? 'checked' : ''}>変更したコマの色</label>
          <label class="chk"><input type="checkbox" data-p="printDate" ${opt.printDate ? 'checked' : ''}>印刷した日時</label>
          <label class="chk"><input type="checkbox" data-p="stamp" checked>四角の印（確定版など）</label>
        </div>
      </div>
      <div class="btns"><button class="btn" data-close>やめる</button><button class="btn primary" data-go>印刷する</button></div>`
    );
    md.el.querySelector('[data-go]').addEventListener('click', () => {
      const q = (k) => md.el.querySelector(`[data-p="${k}"]`);
      const many = md.el.querySelector('input[name="rng"]:checked').value === 'many';
      let mons = [job.mon];
      if (many) {
        const a = q('from').value;
        const b = q('to').value;
        mons = weeks.map((w) => w.mon).filter((x) => x >= (a < b ? a : b) && x <= (a < b ? b : a));
      }
      const o = { staff: q('staff').checked, mark: q('mark').checked, printDate: q('printDate').checked, noStamp: !q('stamp').checked };
      md.close();
      P.run(P.weekPages(mons, o), false);
    });
  };

  // 週以外：その画面が用意したページをそのまま印刷
  P.direct = (job) => {
    const v = K.views[job.kind];
    if (!v || !v.printPages) return;
    const r = v.printPages(job);
    P.run(r.pages, r.land);
  };
})();
