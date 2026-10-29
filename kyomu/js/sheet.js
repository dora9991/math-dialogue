/* Excel の「週行事」シートと同じ見た目の表をつくる（画面でも印刷でも同じものを使う）。
   列：日｜行事｜校時｜クラス×9｜出張等。1週＝A4縦1枚。
   列幅・行の高さは、もとの Excel（列幅 3.75 / 29.625 / 2.5 / 3.5×9 / 25.875、行 15.75pt など）から写した。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const sh = (K.sheet = {});
  sh.lastSrc = {};

  // 列幅（px・96dpi で Excel と同じ）
  sh.W = { date: 30, ev: 237, slot: 20, cls: 28, staff: 207 };
  // 行の高さ（pt）
  const H = { title: 18.75, head: 18, chead: 10.5, slot: 15.75, gap: 10.5, we: 15, weSmall: 11.25 };
  const MARK = { y: 'mk-y', o: 'mk-o', b: 'mk-b', g: 'mk-g', p: 'mk-p' };
  const GRADE_BG = ['', 'g-green', 'g-yellow', 'g-green', 'g-yellow', 'g-green', 'g-yellow'];

  const esc = u.esc;
  const fcls = (col, r) => {
    const f = (col.fmt && col.fmt[r]) || {};
    return (f.b ? ' b' : '') + (f.red ? ' red' : '') + (f.big ? ' big' : '');
  };
  const fit = (t, cls) => `<span class="fit${cls ? ' ' + cls : ''}">${esc(t).replace(/\n/g, '<br>')}</span>`;

  /* ---------- 行事・出張等の欄に、文を行ごとに並べる ---------- */
  // fixed：{行番号: 文}（手で書いた行）、items：[{row, text}]（自動で入れる文。row は入れたい行）
  sh.place = (R, fixed, items, start) => {
    const out = new Array(R).fill('');
    const own = new Array(R).fill(false);
    const fmt = Array.from({ length: R }, () => ({}));
    const src = Array.from({ length: R }, () => []);
    Object.entries(fixed || {}).forEach(([r, v]) => {
      const i = Number(r);
      const t = v && typeof v === 'object' ? v.t : v;
      if (i < R && t) {
        out[i] = t;
        own[i] = true;
        if (v && typeof v === 'object') fmt[i] = { b: !!v.b, red: !!v.red, big: !!v.big };
        src[i].push({ own: true, text: t });
      }
    });
    const first = start == null ? 1 : start;
    (items || []).forEach((it) => {
      if (!it.text) return;
      // 同じ文をすでに手で書いた行があれば、二重に出さない
      const same = out.findIndex((x, k) => own[k] && u.norm(x) === u.norm(it.text));
      if (same >= 0) {
        src[same].push(it);
        return;
      }
      // 改行のある文は、次の行へ続けて書く（Excel でセルの中で改行していたもの）
      const parts = String(it.text).split('\n').filter(Boolean);
      let want = it.row == null ? first : Math.max(0, Math.min(R - 1, it.row));
      let i = want;
      while (i < R && out[i]) i++;
      if (i >= R) {
        i = want;
        while (i >= 0 && out[i]) i--;
      }
      if (i < 0) {
        i = Math.max(0, Math.min(R - 1, want));
        out[i] = out[i] ? `${out[i]}、${parts.join(' ')}` : parts.join(' ');
        src[i].push(it);
        return;
      }
      out[i] = parts[0];
      fmt[i] = { b: !!it.b, red: !!it.red, big: !!it.big };
      src[i].push(it);
      let k = i;
      for (let p = 1; p < parts.length; p++) {
        if (k + 1 < R && !out[k + 1]) {
          k++;
          out[k] = parts[p];
          fmt[k] = fmt[i];
          src[k].push(it);
        } else out[k] += ' ' + parts[p];
      }
    });
    return { lines: out, own, src, fmt };
  };

  const rowOfSlot = (layout, s) => {
    const i = layout.indexOf(s);
    return i < 0 ? null : i + 1;
  };

  // その日の「行事」欄の文
  sh.evItems = (d, layout) => {
    const day = m.day(d);
    const items = [];
    if (day.hol) items.push({ row: null, text: day.hol, hol: true });
    day.events.forEach((e) => {
      if (e.kind === 'staff' || e.inWeek === false) return;
      let text = e.title;
      if (e.place) text += `（${e.place}）`;
      if (e.end && e.end > e.date && d === e.date) text += `～${m.dateWord(e.end, d)}`;
      const row = e.row != null ? e.row : e.from && e.from !== 'all' ? rowOfSlot(layout, e.from) : null;
      items.push({ row, text, ev: e.id, b: e.bold, red: e.red, big: e.big });
    });
    return items;
  };
  // その日の「出張等」欄の文（定例の会議・職員の予定・時間割の変更の記録）
  sh.stItems = (d, layout) => {
    const day = m.day(d);
    const items = [];
    if (day.school && day.term && day.weekday) {
      const bs = m.st.bases[day.term.id];
      if (bs)
        Object.entries(bs.staff).forEach(([k, t]) => {
          const [wd, r] = k.split('|');
          if (Number(wd) === day.wd && t) items.push({ row: Number(r), text: t, base: true });
        });
    }
    day.events.forEach((e) => {
      if (e.kind !== 'staff') return;
      const text = e.who && !e.title.includes(e.who) ? `${e.title} ${e.who}` : e.title;
      const row = e.row != null ? e.row : e.from && e.from !== 'all' ? rowOfSlot(layout, e.from) : null;
      items.push({ row, text, ev: e.id, b: e.bold, red: e.red });
    });
    m.st.log.forEach((en) => {
      K.ops.entryNotes(en).forEach((n) => {
        if (n.d === d && n.text) items.push({ row: rowOfSlot(layout, n.s), text: n.text, log: en.id });
      });
    });
    return items;
  };

  /* ---------- 罫線 ---------- */
  // 辺ごとに T（細線）か h（極細線）か無し
  const B = (l, r, t, b) => `${l ? 'l' + l : ''} ${r ? 'r' + r : ''} ${t ? 't' + t : ''} ${b ? 'b' + b : ''}`.trim();

  /* ---------- 1日ぶん（平日の形） ---------- */
  // ctx: {d, wd, layout, first, dateParts[], ev{lines,own}, st{lines,own}, get(s,c) → 表示用, key(s,c), lineKey(kind,row)}
  function dayBlock(ctx, o) {
    const cls = m.st.classes;
    const n = cls.length;
    const R = ctx.layout.length + 1;
    // コマのまとまり：横（同じ結合・同じ文字）と、縦（下の行が同じ結合で文字が空＝続き）
    const groups = ctx.layout.map((s) => {
      const row = cls.map((c) => ctx.get(s, c.id));
      const out = [];
      let i = 0;
      while (i < n) {
        const v = row[i];
        let j = i + 1;
        if (v.m)
          while (j < n && row[j].m === v.m && row[j].t === v.t) j++;
        out.push({ i, j, v, rs: 1, covered: false });
        i = j;
      }
      return out;
    });
    groups.forEach((gs, r) =>
      gs.forEach((g) => {
        if (!g.v.m || g.covered) return;
        for (let k = r + 1; k < groups.length; k++) {
          const h = groups[k].find((x) => x.i === g.i && x.j === g.j && x.v.m === g.v.m && !x.v.t && !x.covered);
          if (!h) break;
          h.covered = true;
          g.rs++;
        }
      })
    );
    let html = '';
    for (let r = 0; r < R; r++) {
      const last = r === R - 1;
      const top = r === 0;
      const s = top ? null : ctx.layout[r - 1];
      const ht = top ? H.chead : H.slot;
      const lunch = s && s === m.st.lunchAfter;
      const rowB = last || lunch ? 'T' : 'h';
      html += `<tr style="height:${ht}pt">`;
      // 日付
      const dp = ctx.dateParts[r] || '';
      html += `<td class="dt ${B('T', 'T', top ? 'T' : '', last ? 'T' : '')}">${dp ? fit(dp) : ''}</td>`;
      // 行事
      const evT = ctx.ev.lines[r] || '';
      html += `<td class="ev ${B('T', 'T', top ? 'T' : '', last ? 'T' : '')}${ctx.ev.own[r] ? ' own' : ''}${fcls(ctx.ev, r)}" ${ctx.lineAttr('ev', r)}>${evT ? fit(evT) : ''}</td>`;
      // 校時
      if (top) html += `<td class="sl ${B('h', 'T', 'T', 'h')}"></td>`;
      else {
        const sl = m.slot(s);
        const smk = ctx.slotMark ? ctx.slotMark(s) : '';
        const sbg = smk && o.mark ? (smk[0] === '#' ? ` style="background:${smk}"` : '') : '';
        const offS = ctx.slotOff ? ctx.slotOff(s) : false;
        html += `<td class="sl ${B('h', 'T', '', rowB)}${smk && o.mark && smk[0] !== '#' ? ' sk-' + smk : ''}"${sbg} ${ctx.slotAttr ? ctx.slotAttr(s) : ''}>${offS ? '' : fit(sl ? sl.label : s)}</td>`;
      }
      // クラス
      if (top) {
        cls.forEach((c, i) => {
          const edge = i === cls.length - 1 || cls[i + 1].g !== c.g;
          const bg = ctx.first && o.firstHeaderColor ? GRADE_BG[c.g] || '' : '';
          html += `<td class="ch ${bg} ${B(i === 0 ? 'T' : '', edge ? 'T' : 'h', 'T', 'h')}">${fit(c.label)}</td>`;
        });
      } else {
        groups[r - 1].forEach((g) => {
          if (g.covered) return;
          const { i, j, v } = g;
          const span = j - i;
          const lastC = cls[j - 1];
          const edge = j === n || cls[j].g !== lastC.g;
          const endS = ctx.layout[r - 2 + g.rs];
          const endB = r - 1 + g.rs === R - 1 || endS === m.st.lunchAfter ? 'T' : 'h';
          // 色：アプリでつけた印（mk）か、Excel から取りこんだ色（bg・太字・赤字）
          const mk = v.mk && o.mark ? MARK[v.mk] || '' : '';
          const look = o.mark && !mk ? `${v.b ? ' b' : ''}${v.red ? ' red' : ''}` : '';
          const bg = o.mark && !mk && v.bg ? ` style="background:${v.bg}"` : '';
          const extra = ctx.cellClass ? ctx.cellClass(s, cls.slice(i, j), v) : '';
          html += `<td class="c ${B(i === 0 ? 'T' : '', edge ? 'T' : 'h', '', endB)} ${mk}${look} ${extra}"${bg}${span > 1 ? ` colspan="${span}"` : ''}${g.rs > 1 ? ` rowspan="${g.rs}"` : ''} ${ctx.cellAttr(s, cls.slice(i, j))}>${v.t ? fit(v.t) : ''}</td>`;
        });
      }
      // 出張等
      if (o.staff) {
        const stT = ctx.st.lines[r] || '';
        html += `<td class="st ${B('T', 'T', top ? 'T' : '', last ? 'T' : '')}${ctx.st.own[r] ? ' own' : ''}${fcls(ctx.st, r)}" ${ctx.lineAttr('st', r)}>${stT ? fit(stT) : ''}</td>`;
      }
      html += '</tr>';
    }
    return html;
  }

  /* ---------- 土日（授業なしの形） ---------- */
  function weekendBlock(ctx, o) {
    const n = m.st.classes.length;
    const heights = ctx.wd === 6 ? [H.we, H.we, H.we, H.we, H.weSmall, H.weSmall] : [H.we, H.we, H.we, H.we];
    const R = heights.length;
    let html = `<tr style="height:${H.gap}pt"><td colspan="${n + 3 + (o.staff ? 1 : 0)}" class="gap"></td></tr>`;
    for (let r = 0; r < R; r++) {
      const top = r === 0;
      const last = r === R - 1;
      html += `<tr style="height:${heights[r]}pt">`;
      const dp = ctx.dateParts[r] || '';
      html += `<td class="dt ${B('T', 'T', top ? 'T' : '', last ? 'T' : '')}">${dp ? fit(dp) : ''}</td>`;
      const evT = ctx.ev.lines[r] || '';
      html += `<td class="ev ${B('T', 'T', top ? 'T' : '', last ? 'T' : '')}${ctx.ev.own[r] ? ' own' : ''}${fcls(ctx.ev, r)}" ${ctx.lineAttr('ev', r)}>${evT ? fit(evT) : ''}</td>`;
      if (top) html += `<td class="we ${B('T', 'T', 'T', 'T')}" colspan="${n + 1}" rowspan="${R}"></td>`;
      if (o.staff) {
        const stT = ctx.st.lines[r] || '';
        html += `<td class="st ${B('T', 'T', top ? 'T' : '', last ? 'T' : '')}${ctx.st.own[r] ? ' own' : ''}${fcls(ctx.st, r)}" ${ctx.lineAttr('st', r)}>${stT ? fit(stT) : ''}</td>`;
      }
      html += '</tr>';
    }
    return html;
  }

  /* ---------- 見出し（第○週 週行事／学校名／日・行事・時間割・出張等） ---------- */
  function headRows(t, o) {
    const n = m.st.classes.length;
    let html = `<tr class="ttl" style="height:${H.title}pt">`;
    html += `<td class="t-dai">${t.no != null ? '第' : ''}</td>`;
    html += `<td class="t-main" colspan="1"><span class="t-no">${esc(t.no == null ? '' : t.no || '')}</span><span class="t-txt">${esc(t.text)}</span>${t.label ? `<span class="t-label">${esc(t.label)}</span>` : ''}${t.stamp ? `<span class="t-stamp">${esc(t.stamp)}</span>` : ''}</td>`;
    html += `<td class="t-school bT" colspan="${n + 1}">${fit(t.school || '')}</td>`;
    if (o.staff) html += `<td class="t-date">${o.printDate && t.date ? fit(t.date) : ''}</td>`;
    html += '</tr>';
    html += `<tr class="hd" style="height:${H.head}pt">`;
    html += `<td class="${B('T', 'T', 'T', 'T')} hc">日</td>`;
    html += `<td class="${B('T', '', 'T', 'T')} hc">行　　　　事</td>`;
    html += `<td class="${B('T', 'T', 'T', 'T')} hc" colspan="${n + 1}">時　　間　　割</td>`;
    if (o.staff) html += `<td class="${B('T', 'T', 'T', 'T')} hc">出　　　張　　　等</td>`;
    html += '</tr>';
    return html;
  }

  function colgroup(o) {
    const W = sh.W;
    let html = `<colgroup><col style="width:${W.date}px"><col style="width:${W.ev}px"><col style="width:${W.slot}px">`;
    m.st.classes.forEach(() => (html += `<col style="width:${W.cls}px">`));
    if (o.staff) html += `<col style="width:${W.staff}px">`;
    return html + '</colgroup>';
  }
  sh.tableWidth = (o) => sh.W.date + sh.W.ev + sh.W.slot + sh.W.cls * m.st.classes.length + (o.staff ? sh.W.staff : 0);

  // 日付を縦に（月・／・日・曜）
  function dateParts(d, R, weekend) {
    const p = new Array(R).fill('');
    if (!d) return p;
    if (weekend) {
      p[0] = String(u.month(d));
      p[1] = '／';
      p[2] = String(u.day(d));
      p[3] = u.WD[u.dow(d)];
    } else {
      p[Math.min(2, R - 1)] = String(u.month(d));
      p[Math.min(3, R - 1)] = '／';
      p[Math.min(4, R - 1)] = String(u.day(d));
      p[Math.min(6, R - 1)] = u.WD[u.dow(d)];
    }
    return p;
  }

  /* ---------- 週のシート ---------- */
  // o: {staff, mark, firstHeaderColor, printDate, hooks:{cellClass, cellAttr, lineAttr}}
  sh.week = (mon, opts) => {
    const o = Object.assign({ staff: true, mark: true, firstHeaderColor: true, printDate: true }, m.st.opt, opts || {});
    const hk = o.hooks || {};
    const meta = m.st.weekMeta[mon] || {};
    const no = m.weekNo(mon);
    const now = new Date();
    const t = {
      no: no || '',
      text: m.st.school.title || '週　　　週　行　事',
      label: meta.label || '',
      stamp: o.noStamp ? '' : meta.stamp || '',
      school: m.st.school.name,
      date: `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${u.pad(now.getMinutes())}`,
    };
    let body = headRows(t, o);
    let first = true;
    sh.lastSrc = {};
    for (let i = 0; i < 7; i++) {
      const d = u.add(mon, i);
      const day = m.day(d);
      const full = i < 5 || day.school;
      const layout = full ? day.layout : [];
      const R = full ? layout.length + 1 : i === 5 ? 6 : 4;
      const lines = m.st.lines[d] || {};
      const ev = sh.place(R, lines.ev, sh.evItems(d, layout));
      const st = sh.place(R, lines.st, sh.stItems(d, layout));
      sh.lastSrc[d] = { ev: ev.src, st: st.src };
      const ctx = {
        d,
        wd: day.wd,
        layout,
        first,
        dateParts: dateParts(d, R, !full),
        ev,
        st,
        get: (s, c) => {
          const r = m.cell(d, s, c);
          return r;
        },
        cellClass: hk.cellClass ? (s, cs, v) => hk.cellClass(d, s, cs, v) : null,
        cellAttr: (s, cs) => (hk.cellAttr ? hk.cellAttr(d, s, cs) : ''),
        lineAttr: (kind, r) => (hk.lineAttr ? hk.lineAttr(kind, d, r) : ''),
        slotMark: (s) => (lines.sl || {})[s] || '',
        slotOff: (s) => day.offSlots.has(s),
        slotAttr: (s) => (hk.slotAttr ? hk.slotAttr(d, s) : ''),
      };
      body += full ? dayBlock(ctx, o) : weekendBlock(ctx, o);
      if (full) first = false;
    }
    const table = `<table class="xs" style="width:${sh.tableWidth(o)}px">${colgroup(o)}<tbody>${body}</tbody></table>`;
    return `<div class="sheetwrap" style="width:${sh.tableWidth(o)}px">${table}${sh.boxes(meta.boxes || [], body, o)}</div>`;
  };

  /* ---------- 図形（確定版の四角・お知らせの吹き出し）：Excel の行・列の位置に置く ---------- */
  sh.boxes = (boxes, body, o) => {
    if (!boxes.length) return '';
    const rowsPx = [...body.matchAll(/<tr[^>]*style="height:([\d.]+)pt"/g)].map((x) => (Number(x[1]) * 4) / 3);
    const Y = (r, off) => {
      let y = 0;
      for (let i = 0; i < r && i < rowsPx.length; i++) y += rowsPx[i];
      return y + off / 9525;
    };
    const widths = [sh.W.date, 26, sh.W.ev - 26, sh.W.slot].concat(m.st.classes.map(() => sh.W.cls)).concat(o.staff ? [sh.W.staff] : []);
    const X = (c, off) => {
      let x = 0;
      for (let i = 0; i < c; i++) x += widths[i] != null ? widths[i] : 64;
      return x + off / 9525;
    };
    const maxX = widths.reduce((a, b) => a + b, 0);
    return boxes
      .filter((b) => X(b.c0, b.co0) < maxX - 4)
      .map((b) => {
        const left = X(b.c0, b.co0);
        const top = Y(b.r0, b.ro0);
        const w = Math.max(20, Math.min(maxX, X(b.c1, b.co1)) - left);
        const h = Math.max(12, Y(b.r1, b.ro1) - top);
        const jc = b.anchor === 'ctr' ? 'center' : b.anchor === 'b' ? 'flex-end' : 'flex-start';
        return `<div class="bx${b.shape === 'round' ? ' round' : ''}" style="left:${left.toFixed(1)}px;top:${top.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;background:${b.fill || 'transparent'};border:${b.lw || 1}px solid ${b.line || 'transparent'};color:${b.color || '#000'};font-size:${b.size || 10.5}pt;${b.bold ? 'font-weight:bold;' : ''}justify-content:${jc};text-align:${b.align || 'left'}"><div>${esc(b.text).replace(/\n/g, '<br>')}</div></div>`;
      })
      .join('');
  };

  /* ---------- 基本時間割のシート（日付なし） ---------- */
  sh.base = (termId, opts) => {
    const o = Object.assign({ staff: true, mark: false, firstHeaderColor: true, printDate: false }, opts || {});
    const hk = o.hooks || {};
    const term = m.st.terms.find((x) => x.id === termId);
    const bs = m.base(termId);
    const t = { no: null, text: `基本時間割　${term ? term.name : ''}`, label: term && term.start ? `（${u.md(term.start)}～${u.md(term.end)}）` : '', school: m.st.school.name };
    let body = headRows(t, o);
    for (let wd = 1; wd <= 5; wd++) {
      const layout = m.st.daySlots[wd] || [];
      const R = layout.length + 1;
      const fixed = {};
      Object.entries(bs.staff).forEach(([k, v]) => {
        const [w, r] = k.split('|');
        if (Number(w) === wd) fixed[r] = v;
      });
      const parts = new Array(R).fill('');
      parts[Math.min(4, R - 1)] = u.WD[wd];
      const ctx = {
        d: null,
        wd,
        layout,
        first: wd === 1,
        dateParts: parts,
        ev: { lines: new Array(R).fill(''), own: [] },
        st: sh.place(R, fixed, []),
        get: (s, c) => {
          const x = bs.cells[`${wd}|${s}|${c}`];
          return { t: (x && x.t) || '', m: (x && x.m) || '' };
        },
        cellClass: hk.cellClass ? (s, cs, v) => hk.cellClass(wd, s, cs, v) : null,
        cellAttr: (s, cs) => (hk.cellAttr ? hk.cellAttr(wd, s, cs) : ''),
        lineAttr: (kind, r) => (hk.lineAttr ? hk.lineAttr(kind, wd, r) : ''),
      };
      body += dayBlock(ctx, o);
    }
    return `<table class="xs" style="width:${sh.tableWidth(o)}px">${colgroup(o)}<tbody>${body}</tbody></table>`;
  };

  /* ---------- A4 の紙にのせて、はみ出さないように縮める ---------- */
  sh.page = (tableHtml, cls) => `<div class="page ${cls || ''}"><div class="fitbox">${tableHtml}</div></div>`;
  sh.fitPages = (root) => {
    u.$$('.page', root).forEach((pg) => {
      const box = pg.querySelector('.fitbox');
      const tb = box && box.firstElementChild;
      if (!tb) return;
      box.style.zoom = '';
      u.fit(box);
      const cs = getComputedStyle(pg);
      const aw = pg.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const ah = pg.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const z = Math.min(1, aw / tb.offsetWidth, ah / tb.offsetHeight);
      box.style.zoom = String(Math.floor(z * 1000) / 1000);
    });
  };
})();
