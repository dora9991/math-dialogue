/* 設定：学校名・年度・期間（基本時間割の切りかえ日）・クラス・校時・教科、データの保存と取り込み。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const V = (K.views = K.views || {});

  V.settings = {
    title: '設定・取り込み',
    render(el, params) {
      if (params && params[0] === 'import') return K.views.importer.render(el);
      const st = m.st;
      const sec = (t, body, help) => `<div class="card"><h3>${t}</h3>${help ? `<p class="help">${help}</p>` : ''}${body}</div>`;
      el.innerHTML = `<div class="view" style="max-width:1100px">
        ${sec(
          'データ（このブラウザの中だけに保存）',
          `<div class="row">
            <button class="btn primary" data-act="import">今の Excel（週行事）から取り込む</button>
            <button class="btn" data-act="export">バックアップを書き出す（JSON）</button>
            <label class="btn">バックアップから戻す<input type="file" accept=".json,application/json" data-restore hidden></label>
            <span style="flex:1"></span>
            <button class="btn danger" data-act="wipe">全部消して最初から</button>
          </div>
          <p class="small muted" style="margin-top:8px">最後の保存：${st.savedAt ? new Date(st.savedAt).toLocaleString('ja-JP') : 'まだ'}　／　最後のバックアップ：${st.backupAt ? new Date(st.backupAt).toLocaleString('ja-JP') : 'まだ'}</p>`,
          'インターネットには何も送りません。ブラウザの「閲覧データを削除」をすると消えるので、週に1回くらいバックアップを書き出してください（別のパソコンへ移すときも、このファイルを「戻す」で読みこみます）。'
        )}
        ${sec(
          '学校・年度',
          `<div class="form"><label>学校名</label><input type="text" data-s="name" value="${u.esc(st.school.name)}" placeholder="（週行事の右上に出ます）">
          <label>年度</label><div class="row"><input type="number" data-s="year" value="${st.school.year}" style="width:100px"><span class="small muted">（令和${st.school.year - 2018}年度）</span></div>
          <label>週行事の題</label><input type="text" data-s="title" value="${u.esc(st.school.title)}"></div>`
        )}
        ${sec(
          '期間（基本時間割が変わる区切り）',
          `<table class="cnt"><tr><th class="l">名前</th><th>はじまり</th><th>おわり</th><th>授業日数</th><th></th></tr>
          ${st.terms.map((t, i) => `<tr><td class="l"><input type="text" data-t="${i}|name" value="${u.esc(t.name)}" style="width:140px"></td><td><input type="date" data-t="${i}|start" value="${t.start}"></td><td><input type="date" data-t="${i}|end" value="${t.end}"></td><td>${t.start && t.end ? m.schoolDays(t.start, t.end) : ''}</td><td><button class="btn small" data-go-base="${t.id}">基本時間割</button> ${st.terms.length > 1 ? `<button class="btn small danger" data-del-term="${i}">消す</button>` : ''}</td></tr>`).join('')}
          </table><div class="row" style="margin-top:8px"><button class="btn small" data-act="add-term">＋期間を足す</button></div>`,
          '期間に入っていない日（夏休みなど）は授業のない日になります。週の番号は、授業のある週だけに 1 から順にふります。祝日は自動で入ります（振替休日・国民の休日も）。'
        )}
        ${sec(
          'クラス',
          `<div class="row">${st.classes.map((c, i) => `<span class="chip">${u.esc(c.id)} <button class="btn small" data-del-cls="${i}" title="消す" style="padding:0 4px">×</button></span>`).join(' ')}</div>
          <div class="row" style="margin-top:8px"><input type="text" data-new-cls placeholder="例：3-4" style="width:90px"><button class="btn small" data-act="add-cls">＋クラスを足す</button></div>`
        )}
        ${sec(
          '校時と曜日',
          `<table class="cnt"><tr><th>校時</th><th>表示</th><th>時数に数える</th>${[1, 2, 3, 4, 5].map((w) => `<th>${u.WD[w]}</th>`).join('')}<th>昼休みの線</th></tr>
          ${st.slots.map((s) => `<tr><td>${u.esc(m.slotName(s.id))}</td><td><input type="text" data-sl="${s.id}|label" value="${u.esc(s.label)}" style="width:44px"></td><td><input type="checkbox" data-sl="${s.id}|counted" ${s.counted ? 'checked' : ''}></td>
            ${[1, 2, 3, 4, 5].map((w) => `<td><input type="checkbox" data-ds="${w}|${s.id}" ${(st.daySlots[w] || []).includes(s.id) ? 'checked' : ''}></td>`).join('')}
            <td><input type="radio" name="lunch" data-lunch="${s.id}" ${st.lunchAfter === s.id ? 'checked' : ''}></td></tr>`).join('')}</table>`,
          '曜日ごとに、時間割に並ぶ校時を選びます（例：木曜だけ7限まで）。「昼休みの線」の校時の下に太い線が入ります。'
        )}
        ${sec(
          '教科（時間割に書く記号）',
          `<table class="cnt"><tr><th>記号</th><th>名前</th><th>まとめる先</th><th>時数に数える</th><th title="体育のように、同じ先生が複数クラスを同時に持ってよい">合同可</th><th></th></tr>
          ${st.subjects.map((s, i) => `<tr><td><input type="text" data-sj="${i}|code" value="${u.esc(s.code)}" style="width:70px"></td><td><input type="text" data-sj="${i}|name" value="${u.esc(s.name)}" style="width:120px"></td>
            <td><input type="text" data-sj="${i}|group" value="${u.esc(s.group)}" style="width:70px"></td><td><input type="checkbox" data-sj="${i}|counted" ${s.counted ? 'checked' : ''}></td><td><input type="checkbox" data-sj="${i}|joint" ${s.joint ? 'checked' : ''}></td>
            <td><button class="btn small danger" data-del-sj="${i}">×</button></td></tr>`).join('')}</table>
          <div class="row" style="margin-top:8px"><button class="btn small" data-act="add-sj">＋教科を足す</button></div>`,
          '「まとめる先」は時数で教科ごとに足すときの名前（理a・理b・理c → 理）。時数に数えないもの（読書・C など）はチェックを外します。'
        )}
        ${sec(
          '表示',
          `<label class="chk"><input type="checkbox" data-o="firstHeaderColor" ${st.opt.firstHeaderColor ? 'checked' : ''}>月曜のクラス名の行に学年の色</label>
           <label class="chk"><input type="checkbox" data-o="printDate" ${st.opt.printDate ? 'checked' : ''}>右上に印刷日時</label>`
        )}
      </div>`;
      const root = el.firstElementChild;
      const commit = (label, fn) => K.store.commit(label, fn);
      root.addEventListener('change', (e) => {
        const t = e.target;
        if (t.dataset.s) commit('学校の設定', (s) => (s.school[t.dataset.s] = t.dataset.s === 'year' ? Number(t.value) : t.value));
        if (t.dataset.t) {
          const [i, k] = t.dataset.t.split('|');
          commit('期間', (s) => (s.terms[i][k] = t.value));
        }
        if (t.dataset.sl) {
          const [id, k] = t.dataset.sl.split('|');
          commit('校時', (s) => (s.slots.find((x) => x.id === id)[k] = k === 'counted' ? t.checked : t.value));
        }
        if (t.dataset.ds) {
          const [w, id] = t.dataset.ds.split('|');
          commit('曜日の校時', (s) => {
            const set = new Set(s.daySlots[w] || []);
            if (t.checked) set.add(id);
            else set.delete(id);
            s.daySlots[w] = s.slots.map((x) => x.id).filter((x) => set.has(x));
          });
        }
        if (t.dataset.lunch) commit('昼休みの線', (s) => (s.lunchAfter = t.dataset.lunch));
        if (t.dataset.sj) {
          const [i, k] = t.dataset.sj.split('|');
          commit('教科', (s) => (s.subjects[i][k] = k === 'counted' || k === 'joint' ? t.checked : t.value.trim()));
        }
        if (t.dataset.o) commit('表示', (s) => (s.opt[t.dataset.o] = t.checked));
        if (t.dataset.restore != null && t.files[0])
          K.store
            .importJson(t.files[0])
            .then(() => u.toast('バックアップから戻しました'))
            .catch((err) => u.toast('読みこめませんでした：' + err.message, 5000));
      });
      root.addEventListener('click', async (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'import') K.app.go('settings', 'import');
        if (act === 'export') K.store.exportJson();
        if (act === 'wipe' && (await u.confirm('すべてのデータを消して、最初の状態にします。\n（念のため、先にバックアップを書き出してください）', '全部消す'))) K.store.replace(m.blank(m.st.school.year), '全部消す');
        if (act === 'add-term') commit('期間を足す', (s) => {
          const id = 't' + u.uid();
          s.terms.push({ id, name: '新しい期間', start: '', end: '' });
          s.bases[id] = { cells: {}, staff: {} };
        });
        if (b.dataset.delTerm != null && (await u.confirm('この期間と、その基本時間割を消します。', '消す'))) commit('期間を消す', (s) => {
          const t = s.terms.splice(Number(b.dataset.delTerm), 1)[0];
          delete s.bases[t.id];
        });
        if (b.dataset.goBase) K.app.go('base', b.dataset.goBase);
        if (act === 'add-cls') {
          const v = u.norm(root.querySelector('[data-new-cls]').value).replace(/[・]/g, '-');
          const mm = /^([1-9])-([1-9])$/.exec(v);
          if (!mm) return u.toast('「3-4」のように 学年-組 で入れてください');
          if (m.cls(v)) return u.toast('すでにあります');
          commit('クラスを足す', (s) => {
            s.classes.push({ id: v, g: Number(mm[1]), label: `${u.toZen(mm[1])}・${u.toZen(mm[2])}` });
            s.classes.sort((a, c) => (a.id < c.id ? -1 : 1));
          });
        }
        if (b.dataset.delCls != null && (await u.confirm('このクラスを消します（時間割の中身は残りますが表示されなくなります）。', '消す'))) commit('クラスを消す', (s) => s.classes.splice(Number(b.dataset.delCls), 1));
        if (act === 'add-sj') commit('教科を足す', (s) => s.subjects.push({ code: '新', name: '新しい教科', group: '新', counted: true, joint: false }));
        if (b.dataset.delSj != null) commit('教科を消す', (s) => s.subjects.splice(Number(b.dataset.delSj), 1));
      });
    },
  };
})();
