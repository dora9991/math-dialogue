/* 週行事（週案）の画面：Excel と同じ形のシートの上で、コマを選んで 変更・入れ替え・まとめる。
   右の欄に「選んだコマ」「この週の変更の記録」「週の設定」、下に「この週の時数」。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const ops = K.ops;
  const V = (K.views = K.views || {});

  const ui = {
    mon: null,
    sel: [], // [{d,s,c}]
    swapFrom: null,
    zoom: Number(localStorage.getItem('kyomu-zoom') || 1.15),
    cand: true,
    why: 'auto',
    whySrc: '',
    whyText: '',
    cntMode: 'week',
    hl: null,
  };
  const same = (a, b) => a && b && a.d === b.d && a.s === b.s && a.c === b.c;
  const isSel = (d, s, c) => ui.sel.some((x) => x.d === d && x.s === s && x.c === c);
  const slotMark = (s) => (s === 'am' ? '朝' : s === 'pm' ? '帰' : u.circled(s));

  V.week = {
    title: '週行事',
    open(params) {
      if (params && params[0]) ui.mon = u.monday(params[0]);
      if (!ui.mon) {
        const t = u.today();
        ui.mon = u.monday(t >= m.fyStart() && t <= m.fyEnd() ? t : m.st.terms[0].start || m.fyStart());
      }
    },
    render(el) {
      V.week.el = el;
      draw(el);
    },
    key(e) {
      if (e.target.closest('input,textarea,select')) return;
      if (e.key === 'Escape') {
        ui.swapFrom = null;
        ui.sel = [];
        redraw();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && ui.sel.length) {
        e.preventDefault();
        setSel('');
      } else if (e.key === 's' && ui.sel.length === 1) {
        startSwap();
      } else if (e.key.startsWith('Arrow') && ui.sel.length === 1) {
        e.preventDefault();
        moveSel(e.key);
      }
    },
  };
  const redraw = () => V.week.el && draw(V.week.el);
  V.week.redraw = redraw;
  V.week.go = (d) => {
    ui.mon = u.monday(d);
    ui.sel = [];
    ui.swapFrom = null;
    K.app.go('week', ui.mon);
  };
  V.week.mon = () => ui.mon;

  /* ---------- 入れ替えの候補（先生がその時間あいているか） ---------- */
  function busyMap(mon) {
    const map = {};
    for (let i = 0; i < 7; i++) {
      const d = u.add(mon, i);
      const day = m.day(d);
      if (!day.school) continue;
      day.layout.forEach((s) => {
        const b = (map[d + '|' + s] = {});
        m.st.classes.forEach((c) => {
          const r = m.cell(d, s, c.id);
          m.teachersOf(c.id, r.t).forEach((n) => (b[n] = b[n] || []).push(c.id));
        });
      });
    }
    return map;
  }
  function candidates() {
    const from = ui.swapFrom || (ui.cand && ui.sel.length === 1 ? ui.sel[0] : null);
    if (!from) return null;
    const out = {};
    const busy = busyMap(ui.mon);
    const ra = m.cell(from.d, from.s, from.c);
    const ta = m.teachersOf(from.c, ra.t);
    for (let i = 0; i < 7; i++) {
      const d = u.add(ui.mon, i);
      const day = m.day(d);
      if (!day.school) continue;
      day.layout.forEach((s) => {
        const sl = m.slot(s);
        if (!sl || !sl.counted) return;
        if (d === from.d && s === from.s) return;
        const rb = m.cell(d, s, from.c);
        if (rb.src === 'off') return;
        const tb = m.teachersOf(from.c, rb.t);
        if (!ta.length && !tb.length) return;
        const why = [];
        const check = (names, dd, ss, otherCell) => {
          const b = busy[dd + '|' + ss] || {};
          const abs = m.absent(dd, ss);
          names.forEach((n) => {
            const where = (b[n] || []).filter((c) => !(c === from.c && otherCell));
            if (where.length) why.push(`${n}先生は ${u.mdw(dd)}${slotMark(ss)} に ${where.join('・')}`);
            if (abs.has(n)) why.push(`${n}先生は ${u.mdw(dd)}${slotMark(ss)} 不在`);
          });
        };
        check(ta, d, s, true);
        check(tb, from.d, from.s, true);
        out[`${d}|${s}|${from.c}`] = why.length ? { ok: false, why } : { ok: true, why: [] };
      });
    }
    return out;
  }

  /* ---------- 描く ---------- */
  function draw(el) {
    const mon = ui.mon;
    const no = m.weekNo(mon);
    const term = [0, 1, 2, 3, 4].map((i) => m.termOf(u.add(mon, i))).find(Boolean);
    const cand = candidates();
    const issues = {};
    for (let i = 0; i < 7; i++) {
      const d = u.add(mon, i);
      const day = m.day(d);
      if (day.school) day.layout.forEach((s) => Object.entries(m.issues(d, s)).forEach(([c, msgs]) => (issues[`${d}|${s}|${c}`] = msgs)));
    }
    const hooks = {
      cellAttr: (d, s, cs) => `data-d="${d}" data-s="${s}" data-c="${cs.map((c) => c.id).join(',')}" draggable="true"`,
      cellClass: (d, s, cs) => {
        let k = '';
        if (cs.some((c) => isSel(d, s, c.id))) k += ' sel';
        if (cand) {
          const x = cs.map((c) => cand[`${d}|${s}|${c.id}`]).find(Boolean);
          if (x) k += x.ok ? ' cand-ok' : ' cand-ng';
        }
        if (cs.some((c) => issues[`${d}|${s}|${c.id}`])) k += ' issue';
        if (ui.hl && ui.hl.some((x) => x.d === d && x.s === s && cs.some((c) => c.id === x.c))) k += ' flash';
        return k;
      },
      lineAttr: (kind, d, r) => `data-line="${kind}" data-d="${d}" data-r="${r}"`,
      slotAttr: (d, s) => `data-sd="${d}" data-ss="${s}" title="クリック：色・この校時を授業なしに"`,
    };
    const sheet = K.sheet.week(mon, { hooks });
    const termName = term ? term.name : '授業なし';
    const wl = weekLog(mon);
    el.innerHTML = `
      <div class="wk ${ui.swapFrom ? 'swapping' : ''}">
        <div class="wk-bar">
          <button class="btn" data-act="prev" title="前の週">◀</button>
          <div class="wkno">${no ? `第${no}週` : '（授業のない週）'}　<span class="small muted">${u.md(mon)}〜${u.md(u.add(mon, 6))}</span></div>
          <button class="btn" data-act="next" title="次の週">▶</button>
          <input type="date" value="${mon}" data-act="jump" title="日付から開く">
          <button class="btn" data-act="today">今週</button>
          <span class="chip">${u.esc(termName)}</span>
          ${ui.swapFrom ? `<span class="chip warn">入れ替え：相手のコマをクリック（Esc でやめる）</span>` : ''}
          <span class="sp"></span>
          <button class="btn" data-act="addev">＋行事</button>
          <button class="btn" data-act="addstaff">＋職員の予定</button>
          <label class="chk small"><input type="checkbox" data-opt="showStaff" ${m.st.opt.showStaff ? 'checked' : ''}>出張等</label>
          <label class="chk small"><input type="checkbox" data-opt="mark" ${m.st.opt.mark ? 'checked' : ''}>変更の色</label>
          <button class="btn small" data-act="zout">－</button><span class="small">${Math.round(ui.zoom * 100)}%</span><button class="btn small" data-act="zin">＋</button>
          <button class="btn primary" data-act="print">印刷・PDF</button>
        </div>
        <div>
          <div class="paper-wrap"><div class="zoomer" style="zoom:${ui.zoom}">${K.sheet.page(sheet)}</div></div>
          ${countCard(mon)}
        </div>
        <div class="side">
          ${inspector(issues, cand)}
          ${logCard(wl)}
          ${weekCard(mon)}
        </div>
      </div>`;
    K.sheet.fitPages(el);
    bind(el);
  }

  function weekLog(mon) {
    return m.st.log.filter((en) => ops.touches(en, mon)).sort((a, b) => a.ts - b.ts);
  }

  /* ---------- 右：選んだコマ ---------- */
  function inspector(issues, cand) {
    if (!ui.sel.length)
      return `<div class="card insp"><h3>コマを選ぶ</h3><p class="help">
        ・シートのコマをクリックで選ぶ（Shift で横に広げる、Ctrl/⌘ で追加）<br>
        ・コマを<b>ドラッグして別のコマに落とす</b>と入れ替え。記録が右と「出張等」の欄に残ります<br>
        ・ダブルクリックで文字を直接入力<br>
        ・行事・出張等の欄をクリックすると、書きこみ・行事の追加ができます</p></div>`;
    const x = ui.sel[0];
    const r = m.cell(x.d, x.s, x.c);
    const multi = ui.sel.length > 1;
    const sameRow = ui.sel.every((y) => y.d === x.d && y.s === x.s);
    const subs = m.st.subjects.filter((s) => s.counted && s.code !== '行事');
    const extra = ['自習', '学活', '読書', '学年取扱', ''];
    const teachers = multi ? [] : m.teachersOf(x.c, r.t);
    const iss = multi ? [] : issues[`${x.d}|${x.s}|${x.c}`] || [];
    const under = r.under || r;
    const cw = cand && !multi ? Object.values(cand).filter((v) => v.ok).length : null;
    return `<div class="card insp">
      <div class="where">${multi ? `${ui.sel.length}コマを選択中` : `${u.mdw(x.d)} ${m.slotName(x.s)}　${x.c}`}</div>
      ${multi ? `<div class="small muted">${u.esc([...new Set(ui.sel.map((y) => y.c))].join('・'))}</div>` : `<div class="now">${u.esc(r.t || '（空き）')}</div>
      <div class="small muted">${r.src === 'ovr' ? `元：${u.esc(under.t || '空き')}（${under.src === 'ev' ? '行事' : '基本'}）` : r.src === 'ev' ? `行事「${u.esc(r.ev.title)}」で埋まっています` : r.src === 'off' ? '授業のない日' : '基本時間割のまま'}${teachers.length ? `　担当：${u.esc(teachers.join('・'))}` : ''}</div>`}
      ${iss.length ? `<ul class="warns">${iss.map((w) => `<li>⚠ ${u.esc(w)}</li>`).join('')}</ul>` : ''}
      <div class="sec">
        <div class="row small"><b>変える</b>
          <select data-ui="why" title="出張等の欄に残す記録の書き方">
            <option value="auto" ${ui.why === 'auto' ? 'selected' : ''}>記録：○→○</option>
            <option value="adjust" ${ui.why === 'adjust' ? 'selected' : ''}>記録：時間数調整</option>
            <option value="makeup" ${ui.why === 'makeup' ? 'selected' : ''}>記録：○日分（補充）</option>
            <option value="text" ${ui.why === 'text' ? 'selected' : ''}>記録：自由に書く</option>
            <option value="none" ${ui.why === 'none' ? 'selected' : ''}>記録の文は出さない</option>
          </select>
          ${ui.why === 'makeup' ? `<input type="date" data-ui="whySrc" value="${ui.whySrc}" title="どの日の分か">` : ''}
          ${ui.why === 'text' ? `<input type="text" data-ui="whyText" value="${u.esc(ui.whyText)}" placeholder="出張等に出す文" style="width:100%">` : ''}
        </div>
        <div class="grid-btn">${subs.map((s) => `<button data-set="${u.esc(s.code)}" class="${!multi && r.t === s.code ? 'cur' : ''}" title="${u.esc(s.name)}">${u.esc(s.code)}</button>`).join('')}</div>
        <div class="grid-btn">${extra.map((t) => `<button data-set="${u.esc(t)}">${t ? u.esc(t) : '空き'}</button>`).join('')}</div>
        <div class="row"><input type="text" data-ui="free" placeholder="ほかの文字（例：学年集会）" style="flex:1"><button class="btn small" data-act="free">入れる</button></div>
      </div>
      <div class="sec row">
        ${!multi ? `<button class="btn small ${ui.swapFrom ? 'on' : ''}" data-act="swap" title="キーの S でも">⇄ 入れ替え</button>` : ''}
        <button class="btn small" data-act="reset">基本に戻す</button>
        ${!multi ? `<label class="chk small"><input type="checkbox" data-ui="cand" ${ui.cand ? 'checked' : ''}>入れ替えられるコマを光らせる${cw != null && Object.keys(cand || {}).length ? `（${cw}）` : ''}</label>` : ''}
      </div>
      <div class="sec row">
        <b class="small">1くくり</b>
        ${sameRow ? `<button class="btn small" data-merge="grade">${m.cls(x.c).g}年でまとめる</button><button class="btn small" data-merge="all">全校でまとめる</button>` : ''}
        ${sameRow && multi ? `<button class="btn small" data-merge="sel">選んだクラスで</button>` : ''}
        ${r.m ? `<button class="btn small" data-act="unmerge">まとめを解除</button>` : ''}
      </div>
      <div class="sec row marks"><b class="small">色</b>
        <button data-mark="y" style="background:#ffff00" title="黄"></button>
        <button data-mark="o" style="background:#ffc000" title="橙"></button>
        <button data-mark="b" style="background:#b4c6e7" title="青"></button>
        <button data-mark="g" style="background:#e2efda" title="緑"></button>
        <button data-mark="p" style="background:#f8cbad" title="桃"></button>
        <button data-mark="" style="background:#fff" title="色なし">×</button>
      </div>
    </div>`;
  }

  /* ---------- 右：変更の記録 ---------- */
  function logCard(list) {
    return `<div class="card"><div class="row"><h3 style="margin:0">この週の変更の記録</h3><span class="sp" style="flex:1"></span>
      ${list.length ? `<button class="btn small" data-act="copy">お知らせ文をコピー</button>` : ''}</div>
      ${list.length ? `<ol class="logs">${list
        .map((en, i) => {
          const notes = ops.entryNotes(en).filter((n) => n.text);
          return `<li data-log="${en.id}"><span class="no">${i + 1}</span>${u.esc(ops.describe(en))}
            ${notes.length ? `<div class="note">出張等の欄：${notes.map((n) => u.esc(n.text)).join('／')}</div>` : ''}
            <div class="acts"><button class="btn small" data-logact="revert">取り消す</button><button class="btn small" data-logact="note">文を直す</button><button class="btn small" data-logact="drop" title="変更はそのまま、記録だけ消す">記録だけ消す</button></div></li>`;
        })
        .join('')}</ol>` : `<p class="help">入れ替え・変更をすると、ここに記録が残ります（Excel の「出張等」の欄にも同じ文が入ります）。</p>`}
    </div>`;
  }

  /* ---------- 右：週の設定 ---------- */
  function weekCard(mon) {
    const meta = m.st.weekMeta[mon] || {};
    const memos = [0, 1, 2, 3, 4, 5, 6].map((i) => u.add(mon, i)).filter((d) => m.st.memo[d]);
    return `<div class="card"><h3>この週の表示</h3>
      <div class="form" style="grid-template-columns:90px 1fr">
        <label>題のあと</label><input type="text" data-meta="label" value="${u.esc(meta.label || '')}" placeholder="（週案②）">
        <label>四角の印</label><input type="text" data-meta="stamp" value="${u.esc(meta.stamp || '')}" placeholder="確定版②">
      </div>
      <div class="sec"><b class="small">吹き出し・四角（シートの上に重ねる文）</b>
        ${(meta.boxes || []).map((b, i) => `<div style="margin:6px 0"><textarea data-box="${i}" style="min-height:44px">${u.esc(b.text)}</textarea><div class="row small"><span class="muted">${b.shape === 'round' ? '角丸' : '四角'}・${b.fill && b.fill !== 'transparent' ? `<span style="display:inline-block;width:10px;height:10px;background:${b.fill};border:1px solid #999"></span>` : '色なし'}</span><span style="flex:1"></span><button class="btn small danger" data-boxdel="${i}">消す</button></div></div>`).join('')}
        <div class="row"><select data-boxday>${[0, 1, 2, 3, 4].map((i) => `<option value="${i}">${u.mdw(u.add(mon, i))}</option>`).join('')}</select><button class="btn small" data-act="boxadd">＋お知らせの吹き出し（行事欄）</button></div>
      </div>
      ${memos.length ? `<div class="sec"><b class="small">教務メモ（印刷しない）</b>${memos.map((d) => `<div class="small"><b>${u.mdw(d)}</b> ${u.esc(m.st.memo[d]).replace(/\n/g, '／')}</div>`).join('')}</div>` : ''}
    </div>`;
  }

  /* ---------- 下：この週の時数 ---------- */
  function countCard(mon) {
    const end = u.add(mon, 6);
    const week = m.countRange(mon, end);
    const cum = ui.cntMode === 'cum' ? m.countRange(m.fyStart(), end) : null;
    const data = cum || week;
    const used = new Set();
    Object.values(data).forEach((row) => Object.keys(row).forEach((k) => used.add(k)));
    const order = m.st.subjects.filter((s) => s.counted).map((s) => s.code).filter((c) => used.has(c));
    const cls = m.st.classes;
    const gsep = (i) => (i > 0 && cls[i - 1].g !== cls[i].g ? ' gsep' : '');
    let html = `<div class="card"><div class="row"><h3 style="margin:0">${cum ? `この週までの累計（${u.md(m.fyStart())}〜${u.md(end)}）` : 'この週の時数'}</h3><span style="flex:1"></span>
      <button class="btn small ${!cum ? 'on' : ''}" data-cnt="week">この週</button><button class="btn small ${cum ? 'on' : ''}" data-cnt="cum">累計</button></div>
      <div style="overflow:auto;margin-top:8px"><table class="cnt"><tr><th class="l">教科</th>${cls.map((c, i) => `<th class="${gsep(i)}">${c.id}</th>`).join('')}</tr>`;
    order.forEach((code) => {
      html += `<tr><td class="l">${u.esc(code)}</td>${cls
        .map((c, i) => {
          const n = (data[c.id] || {})[code] || 0;
          const grade = cls.filter((x) => x.g === c.g).map((x) => (data[x.id] || {})[code] || 0);
          const gap = Math.max(...grade) - n;
          return `<td class="${n ? '' : 'zero'}${gsep(i)}${cum && gap >= 2 ? ' gap2' : cum && gap === 1 ? ' gap1' : ''}">${n}</td>`;
        })
        .join('')}</tr>`;
    });
    html += `<tr class="sum"><td class="l">計</td>${cls.map((c, i) => `<td class="${gsep(i)}">${Object.values(data[c.id] || {}).reduce((a, b) => a + b, 0)}</td>`).join('')}</tr></table></div>
      ${cum ? '<p class="help">色つき：同じ学年のいちばん多いクラスより少ない（薄い橙＝1時間、濃い橙＝2時間以上）。くわしくは「時数」の画面へ。</p>' : ''}</div>`;
    return html;
  }

  /* ---------- 操作 ---------- */
  function cellsFrom(td) {
    return { d: td.dataset.d, s: td.dataset.s, cs: td.dataset.c.split(',') };
  }
  function pick(td, ev) {
    const { d, s, cs } = cellsFrom(td);
    if (ui.swapFrom) {
      const c = cs.includes(ui.swapFrom.c) ? ui.swapFrom.c : cs[0];
      const to = { d, s, c };
      if (same(to, ui.swapFrom)) return;
      doSwap(ui.swapFrom, to);
      return;
    }
    const cells = cs.map((c) => ({ d, s, c }));
    if (ev.shiftKey && ui.sel.length && ui.sel[0].d === d && ui.sel[0].s === s) {
      const ids = m.st.classes.map((c) => c.id);
      const a = ids.indexOf(ui.sel[0].c);
      const b = ids.indexOf(cs[cs.length - 1]);
      ui.sel = ids.slice(Math.min(a, b), Math.max(a, b) + 1).map((c) => ({ d, s, c }));
    } else if (ev.ctrlKey || ev.metaKey) {
      cells.forEach((x) => {
        const i = ui.sel.findIndex((y) => same(x, y));
        if (i >= 0) ui.sel.splice(i, 1);
        else ui.sel.push(x);
      });
    } else ui.sel = cells.length > 1 ? cells : cells;
    redraw();
  }
  async function doSwap(a, b) {
    if (a.c !== b.c && !(await u.confirm(`${a.c} と ${b.c} は別のクラスです。入れ替えますか？`, '入れ替える'))) return;
    const ra = m.cell(a.d, a.s, a.c);
    const rb = m.cell(b.d, b.s, b.c);
    if (ra.src === 'off' || rb.src === 'off') return u.toast('授業のない日のコマとは入れ替えられません');
    ui.swapFrom = null;
    ops.swap(a, b);
    ui.sel = [b];
    ui.hl = [a, b];
    u.toast(`入れ替えました：${u.mdw(a.d)}${slotMark(a.s)} ${a.c} ${ra.t || '空き'} ⇄ ${u.mdw(b.d)}${slotMark(b.s)} ${b.c} ${rb.t || '空き'}`);
    setTimeout(() => (ui.hl = null), 2500);
  }
  function startSwap() {
    if (ui.sel.length !== 1) return;
    ui.swapFrom = ui.swapFrom ? null : ui.sel[0];
    redraw();
  }
  function setSel(t) {
    const cells = ui.sel.filter((x) => m.day(x.d).school);
    if (!cells.length) return;
    let src = '';
    if (ui.why === 'makeup') src = ui.whySrc;
    ops.set(cells, t, { why: ui.why === 'auto' ? '' : ui.why, src, text: ui.whyText, mk: 'o' });
  }
  function moveSel(key) {
    const x = ui.sel[0];
    const ids = m.st.classes.map((c) => c.id);
    const day = m.day(x.d);
    const lay = day.layout;
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const i = ids.indexOf(x.c) + (key === 'ArrowLeft' ? -1 : 1);
      if (i >= 0 && i < ids.length) ui.sel = [{ d: x.d, s: x.s, c: ids[i] }];
    } else {
      const i = lay.indexOf(x.s) + (key === 'ArrowUp' ? -1 : 1);
      if (i >= 0 && i < lay.length) ui.sel = [{ d: x.d, s: lay[i], c: x.c }];
      else {
        const step = key === 'ArrowUp' ? -1 : 1;
        let d = u.add(x.d, step);
        for (let k = 0; k < 7 && !m.day(d).school; k++) d = u.add(d, step);
        if (d >= ui.mon && d <= u.add(ui.mon, 6) && m.day(d).school) {
          const l2 = m.day(d).layout;
          ui.sel = [{ d, s: step > 0 ? l2[0] : l2[l2.length - 1], c: x.c }];
        }
      }
    }
    redraw();
  }

  // 行事・出張等の欄をクリックしたとき
  function lineMenu(td) {
    const kind = td.dataset.line;
    const d = td.dataset.d;
    const r = Number(td.dataset.r);
    const info = (K.sheet.lastSrc[d] || {})[kind] || [];
    const here = info[r] || [];
    const ownV = ((m.st.lines[d] || {})[kind] || {})[r] || '';
    const own = typeof ownV === 'object' ? ownV.t : ownV;
    const rect = td.getBoundingClientRect();
    const items = [];
    here.forEach((it) => {
      if (it.ev) items.push(`<button class="item" data-pop="edit" data-id="${it.ev}">✎ 「${u.esc(it.text)}」を直す（年間・月にも反映）</button>`);
      if (it.log) items.push(`<button class="item" data-pop="log" data-id="${it.log}">✎ 記録の文「${u.esc(it.text)}」を直す</button>`);
      if (it.base) items.push(`<div class="small muted" style="padding:4px 8px">「${u.esc(it.text)}」は定例（基本時間割の出張等）。基本時間割の画面で直せます</div>`);
      if (it.hol) items.push(`<div class="small muted" style="padding:4px 8px">${u.esc(it.text)}（祝日）</div>`);
    });
    const pop = u.h(`<div class="pop" style="left:${Math.min(window.innerWidth - 320, rect.left + window.scrollX)}px;top:${rect.bottom + window.scrollY + 4}px">
      <div class="small muted" style="padding:0 4px 6px">${u.mdw(d)}　${kind === 'ev' ? '行事' : '出張等'}の欄 ${r + 1}行目</div>
      ${items.join('')}
      <div style="padding:4px"><input type="text" data-pop="own" value="${u.esc(own)}" placeholder="この行に書く（この週だけ）"></div>
      <button class="item" data-pop="add">＋ この日に${kind === 'ev' ? '行事' : '職員の予定（会議・出張）'}を追加（年間・月にも出る）</button>
    </div>`);
    document.body.appendChild(pop);
    const input = pop.querySelector('input');
    input.focus();
    input.select();
    const close = () => {
      pop.remove();
      document.removeEventListener('mousedown', outside, true);
    };
    const save = () => {
      const v = input.value.trim();
      if (v === own) return close();
      K.store.commit('行の書きこみ', (st) => {
        const L = (st.lines[d] = st.lines[d] || {});
        const k = (L[kind] = L[kind] || {});
        if (v) k[r] = typeof ownV === 'object' ? Object.assign({}, ownV, { t: v }) : v;
        else delete k[r];
        if (!Object.keys(k).length) delete L[kind];
        if (!Object.keys(L).length) delete st.lines[d];
      });
      close();
    };
    const outside = (e) => {
      if (!pop.contains(e.target)) save();
    };
    setTimeout(() => document.addEventListener('mousedown', outside, true), 0);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') close();
    });
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pop]');
      if (!b || b.tagName === 'INPUT') return;
      close();
      if (b.dataset.pop === 'edit') K.ev.edit(b.dataset.id);
      if (b.dataset.pop === 'log') editNote(b.dataset.id);
      if (b.dataset.pop === 'add') {
        const day = m.day(d);
        const s = kind === 'ev' || r === 0 ? null : day.layout[r - 1];
        K.ev.open({ date: d, kind: kind === 'ev' ? 'event' : 'staff', from: s && kind === 'st' ? s : '' });
      }
    });
  }

  function editNote(id) {
    const en = m.st.log.find((x) => x.id === id);
    if (!en) return;
    const notes = ops.entryNotes(en);
    const md = u.modal(`<h3>記録の文を直す</h3><p class="help">${u.esc(ops.describe(en))}</p>
      ${notes.map((n, i) => `<div class="row" style="margin:6px 0"><span class="small muted" style="width:120px">${u.mdw(n.d)} ${m.slotName(n.s)}</span><input type="text" data-n="${i}" value="${u.esc(n.text)}" style="flex:1"></div>`).join('')}
      <div class="btns"><button class="btn" data-close>やめる</button><button class="btn primary" data-ok>保存</button></div>`);
    md.el.querySelector('[data-ok]').addEventListener('click', () => {
      const next = notes.map((n, i) => Object.assign({}, n, { text: md.el.querySelector(`[data-n="${i}"]`).value.trim() }));
      ops.editNote(id, next);
      md.close();
    });
  }

  function freeEdit(td) {
    const { d, s, cs } = cellsFrom(td);
    const r = m.cell(d, s, cs[0]);
    const rect = td.getBoundingClientRect();
    const pop = u.h(`<div class="pop" style="left:${rect.left + window.scrollX}px;top:${rect.bottom + window.scrollY + 2}px;min-width:200px"><input type="text" value="${u.esc(r.t)}"><div class="small muted" style="margin-top:4px">Enter で決定・Esc でやめる</div></div>`);
    document.body.appendChild(pop);
    const input = pop.querySelector('input');
    input.focus();
    input.select();
    const done = (ok) => {
      if (ok && input.value.trim() !== r.t) {
        ui.sel = cs.map((c) => ({ d, s, c }));
        setSel(input.value.trim());
      }
      pop.remove();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') done(true);
      if (e.key === 'Escape') done(false);
    });
    input.addEventListener('blur', () => setTimeout(() => pop.isConnected && done(true), 100));
  }

  function copyNotice() {
    const mon = ui.mon;
    const list = weekLog(mon);
    const no = m.weekNo(mon);
    const lines = list.map((en) => {
      if (en.kind === 'swap') return `・${u.mdw(en.a.d)}${slotMark(en.a.s)} ${en.a.c} ${en.a.from || '空き'} ⇄ ${u.mdw(en.b.d)}${slotMark(en.b.s)} ${en.b.c} ${en.b.from || '空き'}`;
      if (en.kind === 'set') return en.cells.map((x) => `・${u.mdw(x.d)}${slotMark(x.s)} ${x.c} ${x.from || '空き'} → ${x.to || '空き'}`).join('\n');
      return '・' + ops.describe(en);
    });
    const text = `【第${no}週（${u.md(mon)}〜${u.md(u.add(mon, 4))}）時間割の変更】\n${lines.join('\n')}`;
    const fallback = () => {
      const ta = u.h(`<textarea style="position:fixed;left:-9999px">${u.esc(text)}</textarea>`);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(fallback);
    else fallback();
    u.toast('お知らせ文をコピーしました（メールや日報に貼りつけできます）');
  }

  // 校時の数字：色・その日の授業なし（短縮）
  function slotMenu(td) {
    const d = td.dataset.sd;
    const s = td.dataset.ss;
    const L = m.st.lines[d] || {};
    const cur = (L.sl || {})[s] || '';
    const off = (L.off || []).includes(s);
    const rect = td.getBoundingClientRect();
    const colors = ['', '#E2EFDA', '#FFF2CC', '#DDEBF7', '#FFFF00', '#FFC000', '#F8CBAD'];
    const pop = u.h(`<div class="pop" style="left:${rect.left + window.scrollX}px;top:${rect.bottom + window.scrollY + 4}px">
      <div class="small muted" style="padding:0 4px 6px">${u.mdw(d)} ${m.slotName(s)}</div>
      <div class="row marks" style="padding:0 4px 6px">${colors.map((c) => `<button data-col="${c}" style="width:26px;height:22px;border:1px solid #999;border-radius:4px;background:${c || '#fff'}">${c ? '' : '×'}</button>`).join('')}</div>
      <button class="item" data-off>${off ? '✓ ' : ''}この日の${m.slotName(s)}は授業なし（短縮日課など）</button></div>`);
    document.body.appendChild(pop);
    const close = () => {
      pop.remove();
      document.removeEventListener('mousedown', outside, true);
    };
    const outside = (e) => !pop.contains(e.target) && close();
    setTimeout(() => document.addEventListener('mousedown', outside, true), 0);
    pop.addEventListener('click', (e) => {
      const c = e.target.closest('[data-col]');
      if (c)
        K.store.commit('校時の色', (st) => {
          const X = (st.lines[d] = st.lines[d] || {});
          X.sl = X.sl || {};
          if (c.dataset.col) X.sl[s] = c.dataset.col;
          else delete X.sl[s];
        });
      if (e.target.closest('[data-off]'))
        K.store.commit('校時を授業なしに', (st) => {
          const X = (st.lines[d] = st.lines[d] || {});
          const set = new Set(X.off || []);
          if (off) set.delete(s);
          else set.add(s);
          X.off = [...set];
          if (!X.off.length) delete X.off;
        });
      close();
    });
  }

  // お知らせの吹き出し（その日の行事欄の2行目から6行ぶん）
  function addBox(i) {
    const d = u.add(ui.mon, i);
    let row = 2;
    for (let k = 0; k < i; k++) row += m.day(u.add(ui.mon, k)).layout.length + 1;
    const text = prompt('吹き出しに書く文（印刷にも出ます）', '');
    if (!text) return;
    K.store.commit('吹き出しを足す', (st) => {
      const w = (st.weekMeta[ui.mon] = st.weekMeta[ui.mon] || {});
      w.boxes = w.boxes || [];
      const R = m.day(d).layout.length + 1;
      w.boxes.push({ text, c0: 1, co0: 60000, r0: row + 2, ro0: 0, c1: 2, co1: 1900000, r1: row + R - 1, ro1: 60000, shape: 'round', fill: '#DAE3F3', line: '#000000', lw: 1, color: '#000000', size: 10.5, anchor: 't', align: 'left' });
    });
    u.toast(`${u.mdw(d)} の行事欄に吹き出しを置きました`);
  }

  function bind(el) {
    const bar = el.querySelector('.wk-bar');
    bar.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'prev') V.week.go(u.add(ui.mon, -7));
      if (act === 'next') V.week.go(u.add(ui.mon, 7));
      if (act === 'today') V.week.go(u.today());
      if (act === 'zin' || act === 'zout') {
        ui.zoom = Math.max(0.6, Math.min(2, Math.round((ui.zoom + (act === 'zin' ? 0.1 : -0.1)) * 10) / 10));
        localStorage.setItem('kyomu-zoom', ui.zoom);
        redraw();
      }
      if (act === 'print') K.print.dialog({ kind: 'week', mon: ui.mon });
      if (act === 'addev') K.ev.open({ date: ui.sel[0] ? ui.sel[0].d : ui.mon, kind: 'event' });
      if (act === 'addstaff') K.ev.open({ date: ui.sel[0] ? ui.sel[0].d : ui.mon, kind: 'staff' });
    });
    bar.querySelector('[data-act="jump"]').addEventListener('change', (e) => e.target.value && V.week.go(e.target.value));
    bar.querySelectorAll('[data-opt]').forEach((cb) =>
      cb.addEventListener('change', () => K.store.commit('表示の設定', (st) => (st.opt[cb.dataset.opt] = cb.checked)))
    );

    const sheet = el.querySelector('.xs');
    sheet.addEventListener('click', (e) => {
      const td = e.target.closest('td');
      if (!td) return;
      if (td.classList.contains('c') && td.dataset.d) pick(td, e);
      else if (td.dataset.line) lineMenu(td);
      else if (td.dataset.sd) slotMenu(td);
    });
    sheet.addEventListener('dblclick', (e) => {
      const td = e.target.closest('td.c');
      if (td && td.dataset.d) freeEdit(td);
    });
    // ドラッグで入れ替え
    let dragFrom = null;
    sheet.addEventListener('dragstart', (e) => {
      const td = e.target.closest('td.c');
      if (!td || !td.dataset.d) return;
      const { d, s, cs } = cellsFrom(td);
      dragFrom = { d, s, c: cs.length > 1 && ui.sel[0] && cs.includes(ui.sel[0].c) ? ui.sel[0].c : cs[0] };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'swap');
      ui.sel = [dragFrom];
      td.classList.add('sel');
    });
    sheet.addEventListener('dragover', (e) => {
      const td = e.target.closest('td.c');
      if (!dragFrom || !td || !td.dataset.d) return;
      e.preventDefault();
      sheet.querySelectorAll('td.drop').forEach((x) => x !== td && x.classList.remove('drop'));
      td.classList.add('drop');
    });
    sheet.addEventListener('dragleave', (e) => {
      const td = e.target.closest('td.c');
      if (td) td.classList.remove('drop');
    });
    sheet.addEventListener('drop', (e) => {
      const td = e.target.closest('td.c');
      if (!dragFrom || !td || !td.dataset.d) return;
      e.preventDefault();
      const { d, s, cs } = cellsFrom(td);
      const to = { d, s, c: cs.includes(dragFrom.c) ? dragFrom.c : cs[0] };
      const from = dragFrom;
      dragFrom = null;
      if (!same(from, to)) doSwap(from, to);
    });
    sheet.addEventListener('dragend', () => {
      dragFrom = null;
      sheet.querySelectorAll('td.drop').forEach((x) => x.classList.remove('drop'));
    });

    const side = el.querySelector('.side');
    side.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.set != null) setSel(b.dataset.set);
      if (b.dataset.act === 'free') {
        const v = side.querySelector('[data-ui="free"]').value.trim();
        setSel(v);
      }
      if (b.dataset.act === 'swap') startSwap();
      if (b.dataset.act === 'reset') ops.reset(ui.sel);
      if (b.dataset.act === 'unmerge') {
        const x = ui.sel[0];
        const r = m.cell(x.d, x.s, x.c);
        const cls = m.st.classes.map((c) => c.id).filter((c) => m.cell(x.d, x.s, c).m === r.m);
        ops.unmerge(x.d, x.s, cls);
      }
      if (b.dataset.merge) {
        const x = ui.sel[0];
        const g = m.cls(x.c).g;
        const cls = b.dataset.merge === 'grade' ? m.st.classes.filter((c) => c.g === g).map((c) => c.id) : b.dataset.merge === 'all' ? m.st.classes.map((c) => c.id) : ui.sel.map((y) => y.c);
        const cur = m.cell(x.d, x.s, x.c).t;
        const t = prompt('まとめた枠に入れる文字（例：学年集会・自習・総）', cur || '');
        if (t == null) return;
        ops.merge(x.d, x.s, cls, t.trim());
        ui.sel = cls.map((c) => ({ d: x.d, s: x.s, c }));
      }
      if (b.dataset.mark != null) ops.mark(ui.sel, b.dataset.mark);
      if (b.dataset.act === 'copy') copyNotice();
      if (b.dataset.act === 'boxadd') addBox(Number(side.querySelector('[data-boxday]').value));
      if (b.dataset.boxdel != null)
        K.store.commit('吹き出しを消す', (st) => {
          const w = st.weekMeta[ui.mon];
          if (w && w.boxes) w.boxes.splice(Number(b.dataset.boxdel), 1);
        });
      if (b.dataset.logact) {
        const id = b.closest('[data-log]').dataset.log;
        if (b.dataset.logact === 'revert') ops.revert(id);
        if (b.dataset.logact === 'drop' && (await u.confirm('変更はそのままにして、記録（と出張等の欄の文）だけ消します。', '記録だけ消す'))) ops.dropLog(id);
        if (b.dataset.logact === 'note') editNote(id);
      }
      if (b.dataset.cnt) {
        ui.cntMode = b.dataset.cnt;
        redraw();
      }
    });
    el.querySelectorAll('[data-cnt]').forEach((b) =>
      b.addEventListener('click', () => {
        ui.cntMode = b.dataset.cnt;
        redraw();
      })
    );
    side.addEventListener('mouseover', (e) => {
      const li = e.target.closest('[data-log]');
      if (!li || li._hl) return;
      li._hl = true;
      const en = m.st.log.find((x) => x.id === li.dataset.log);
      const cells = en ? (en.kind === 'swap' ? [en.a, en.b] : en.kind === 'set' ? en.cells : en.cls.map((c) => ({ d: en.d, s: en.s, c }))) : [];
      cells.forEach((x) => {
        const td = sheet.querySelector(`td.c[data-d="${x.d}"][data-s="${x.s}"]`);
        sheet.querySelectorAll(`td.c[data-d="${x.d}"][data-s="${x.s}"]`).forEach((t) => t.dataset.c.split(',').includes(x.c) && t.classList.add('flash'));
        return td;
      });
      li.addEventListener('mouseleave', () => {
        li._hl = false;
        sheet.querySelectorAll('td.flash').forEach((t) => t.classList.remove('flash'));
      }, { once: true });
    });
    side.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.ui === 'why') {
        ui.why = t.value;
        redraw();
      }
      if (t.dataset.ui === 'whySrc') ui.whySrc = t.value;
      if (t.dataset.ui === 'cand') {
        ui.cand = t.checked;
        redraw();
      }
      if (t.dataset.box != null) {
        K.store.commit('吹き出しの文', (st) => {
          const w = st.weekMeta[ui.mon];
          if (w && w.boxes && w.boxes[Number(t.dataset.box)]) w.boxes[Number(t.dataset.box)].text = t.value;
        });
      }
      if (t.dataset.meta) {
        K.store.commit('週の表示', (st) => {
          const w = (st.weekMeta[ui.mon] = st.weekMeta[ui.mon] || {});
          w[t.dataset.meta] = t.value.trim();
        });
      }
    });
    side.addEventListener('input', (e) => {
      if (e.target.dataset.ui === 'whyText') ui.whyText = e.target.value;
    });
    const free = side.querySelector('[data-ui="free"]');
    if (free) free.addEventListener('keydown', (e) => e.key === 'Enter' && setSel(free.value.trim()));
  }
})();
