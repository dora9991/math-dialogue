/* Excel（今使っている週行事のファイル）から取り込む画面。
   ファイルはブラウザの中で読むだけ。どこにも送らない。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const V = (K.views = K.views || {});
  let found = []; // scan の結果
  let busy = '';
  let scanning = false;
  const opt = { events: true, marks: true, mode: 'merge' };

  V.importer = {
    title: '取り込み',
    render(el) {
      const bases = found.filter((x) => x.kind === 'base');
      const weeks = found.filter((x) => x.kind === 'week');
      const byMon = {};
      weeks.forEach((x) => (byMon[x.mon] = byMon[x.mon] || []).push(x));
      el.innerHTML = `<div class="view" style="max-width:1100px">
        <div class="card">
          <h2>今の Excel から取り込む</h2>
          <p class="help">週行事のファイル（.xlsx）を選んでください。<b>複数まとめて選べます</b>（1学期のファイルと2学期のファイルなど）。ファイルはこのブラウザの中で読むだけで、どこにも送りません。<br>
          読み取るもの：基本時間割のシート（「R8の前期」「R8の後期」など）、週のシート（「R8の16週」など）の時間割・行事欄・出張等・結合（1くくり）・セルの色・図形（確定版の四角・お知らせ）。</p>
          <div class="row"><label class="btn primary">Excel ファイルを選ぶ<input type="file" accept=".xlsx,.xlsm" multiple data-files hidden></label>
            <span class="small">日付は <b>${m.st.school.year}年度</b> として読みます（ちがうときは「設定」で年度を変えてから）。</span></div>
          ${busy ? `<p class="chip warn" style="margin-top:10px">${u.esc(busy)}</p>` : ''}
        </div>
        ${found.length && !scanning ? `
        <div class="card"><h3>基本時間割（どの期間に使うか）</h3>
          ${bases.length ? `<table class="cnt"><tr><th class="l">シート</th><th class="l">ファイル</th>${m.st.terms.map((t) => `<th>${u.esc(t.name)}</th>`).join('')}</tr>
          ${bases.map((x, i) => `<tr><td class="l">${u.esc(x.sheet)}</td><td class="l small">${u.esc(x.file)}</td>${m.st.terms.map((t) => `<td><input type="checkbox" data-bt="${i}|${t.id}" ${(x.terms || []).includes(t.id) ? 'checked' : ''}></td>`).join('')}</tr>`).join('')}</table>` : '<p class="help">基本時間割らしいシートは見つかりませんでした。</p>'}
          <p class="help">ふつうは「前期」→ 1学期・2学期前期、「後期」→ 2学期後期・3学期後期。期間の日付は、週のシートの日付から自動で合わせます。</p>
        </div>
        <div class="card"><h3>週のシート（${Object.keys(byMon).length}週）</h3>
          <div style="max-height:360px;overflow:auto"><table class="cnt"><tr><th>使う</th><th>月曜日</th><th>Excel の週</th><th class="l">シート（ファイル）</th></tr>
          ${Object.keys(byMon).sort().map((mon) => {
            const list = byMon[mon];
            return list.map((x, j) => `<tr><td><input type="${list.length > 1 ? 'radio' : 'checkbox'}" name="w-${mon}" data-w="${found.indexOf(x)}" ${x.use ? 'checked' : ''}></td>${j === 0 ? `<td rowspan="${list.length}">${u.mdw(mon)}</td>` : ''}<td>${x.weekNo ? '第' + x.weekNo + '週' : ''}</td><td class="l">${u.esc(x.sheet)} <span class="small muted">（${u.esc(x.file)}）</span></td></tr>`).join('') + (list.length > 1 ? `<tr><td><input type="radio" name="w-${mon}" data-wnone="${mon}" ${list.every((x) => !x.use) ? 'checked' : ''}></td><td colspan="3" class="l small muted">この週は取り込まない</td></tr>` : '');
          }).join('')}</table></div>
          <p class="help">同じ週が何枚かあるときは、あとに選んだファイルのものを先に選んでいます。年度の書いていないシート（去年の残りなど）は外してあります。</p>
        </div>
        <div class="card"><h3>取り込み方</h3>
          <label class="chk"><input type="checkbox" data-o="events" ${opt.events ? 'checked' : ''}>行事欄の文字を、年間行事・月行事にも入れる（時刻や注意書きの行は、その週だけの書きこみにする）</label><br>
          <label class="chk"><input type="checkbox" data-o="marks" ${opt.marks ? 'checked' : ''}>セルの色・太字も取り込む</label><br>
          <label class="chk"><input type="radio" name="mode" value="merge" ${opt.mode === 'merge' ? 'checked' : ''}>今のデータに入れる（取り込む週・期間だけ入れかえ。自分で入れた行事は残す）</label><br>
          <label class="chk"><input type="radio" name="mode" value="fresh" ${opt.mode === 'fresh' ? 'checked' : ''}>まっさらにしてから取り込む</label>
          <div class="btns"><button class="btn" data-act="clear">選びなおす</button><button class="btn primary" data-act="go">取り込む</button></div>
        </div>` : ''}
      </div>`;
      const root = el.firstElementChild;
      root.querySelector('[data-files]').addEventListener('change', async (e) => {
        const files = [...e.target.files];
        if (!files.length) return;
        found = [];
        scanning = true;
        for (const f of files) {
          busy = `読みこみ中…　${f.name}（大きいファイルは数秒かかります）`;
          V.importer.render(el);
          try {
            const book = await K.xlsx.open(f);
            const items = await K.imp.scan(book, f.name, m.st.school.year);
            found.push(...items);
          } catch (err) {
            u.toast(`${f.name} を読めませんでした：${err.message}`, 6000);
          }
        }
        // 同じ週は、あとのファイルを使う
        const last = {};
        found.forEach((x) => x.kind === 'week' && x.use && (last[x.mon] = x));
        found.forEach((x) => x.kind === 'week' && (x.use = last[x.mon] === x));
        // 基本：名前から期間をあてる（同じ名前なら、あとのファイル）
        const seen = {};
        found.filter((x) => x.kind === 'base').forEach((x) => (seen[x.sheet.trim()] = x));
        found.filter((x) => x.kind === 'base').forEach((x) => (x.terms = seen[x.sheet.trim()] === x && (x.era == null || x.era === m.st.school.year) ? K.imp.guessTerms(x.sheet) : []));
        scanning = false;
        busy = `${files.length}ファイルから、基本時間割 ${found.filter((x) => x.kind === 'base').length}枚・週 ${found.filter((x) => x.kind === 'week').length}枚 を見つけました。`;
        V.importer.render(el);
      });
      root.addEventListener('change', (e) => {
        const t = e.target;
        const bases2 = found.filter((x) => x.kind === 'base');
        if (t.dataset.bt) {
          const [i, tid] = t.dataset.bt.split('|');
          const x = bases2[Number(i)];
          x.terms = (x.terms || []).filter((y) => y !== tid);
          if (t.checked) {
            bases2.forEach((y) => (y.terms = (y.terms || []).filter((z) => z !== tid)));
            x.terms.push(tid);
            root.querySelectorAll(`[data-bt$="|${tid}"]`).forEach((cb) => cb !== t && (cb.checked = false));
          }
        }
        if (t.dataset.w != null) {
          const x = found[Number(t.dataset.w)];
          if (t.type === 'radio') found.filter((y) => y.kind === 'week' && y.mon === x.mon).forEach((y) => (y.use = y === x));
          else x.use = t.checked;
        }
        if (t.dataset.wnone) found.filter((y) => y.kind === 'week' && y.mon === t.dataset.wnone).forEach((y) => (y.use = false));
        if (t.dataset.o) opt[t.dataset.o] = t.checked;
        if (t.name === 'mode') opt.mode = t.value;
      });
      root.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'clear') {
          found = [];
          busy = '';
          return V.importer.render(el);
        }
        if (a.dataset.act === 'go') run(el);
      });
    },
  };

  function run(el) {
    const bases = found.filter((x) => x.kind === 'base' && x.terms && x.terms.length).map((item) => ({ item, terms: item.terms }));
    const weeks = found.filter((x) => x.kind === 'week' && x.use).sort((a, b) => (a.mon < b.mon ? -1 : 1)).map((item) => ({ item }));
    if (!bases.length && !weeks.length) return u.toast('取り込むシートを選んでください');
    const orig = m.st;
    const st = opt.mode === 'fresh' ? m.blank(orig.school.year) : u.clone(orig);
    if (opt.mode === 'fresh') st.school = Object.assign({}, st.school, { name: orig.school.name });
    // 取り込む週の、前に取り込んだ分を消す（自分で入れた行事は残す）
    weeks.forEach(({ item }) => {
      const days = u.range(item.mon, u.add(item.mon, 6));
      days.forEach((d) => {
        Object.keys(st.ovr).forEach((k) => k.startsWith(d + '|') && delete st.ovr[k]);
        delete st.lines[d];
        delete st.memo[d];
      });
      st.events = st.events.filter((e) => !(e.imported && days.includes(e.date)));
      delete st.weekMeta[item.mon];
    });
    let rep;
    try {
      rep = K.imp.apply(st, bases, weeks, { events: opt.events, marks: opt.marks });
    } catch (err) {
      m.st = orig;
      m.touch();
      console.error(err);
      return u.toast('取り込みの途中でうまくいきませんでした：' + err.message, 6000);
    }
    m.st = orig;
    K.store.replace(st, 'Excel から取り込み');
    found = [];
    busy = '';
    const lastMon = weeks.length ? weeks[weeks.length - 1].item.mon : null;
    const md = u.modal(`<h3>取り込みました</h3>
      <ul><li>基本時間割：${rep.bases}期間ぶん</li><li>週：${rep.weeks}週（基本と違うコマ ${rep.overrides}こ）</li><li>行事：${rep.events}件・休業日：${rep.holidays}日</li><li>行事欄・出張等の書きこみ：${rep.lines}行</li></ul>
      <p class="help">期間の日付：${m.st.terms.map((t) => `${u.esc(t.name)} ${t.start ? u.md(t.start) + '〜' + u.md(t.end) : '—'}`).join('　')}<br>ちがっていたら「設定」の「期間」で直してください。<br>担当の先生（担当表）は Excel に無いので、「先生」の画面で入れると、入れ替えのときに空いている先生がわかるようになります。</p>
      <div class="btns"><button class="btn" data-close>閉じる</button>${lastMon ? '<button class="btn primary" data-open>週行事を開く</button>' : ''}</div>`);
    const ob = md.el.querySelector('[data-open]');
    if (ob)
      ob.addEventListener('click', () => {
        md.close();
        K.views.week.go(lastMon);
      });
  }
})();
