/* 指導案メーカー：指導案を文書（HTML）とテキストにする。印刷イメージ・印刷・書式つきコピーで同じものを使う。 */
(function () {
  const SD = window.SD;
  const U = SD.U;
  const esc = U.esc;

  // 2文字の見出しは「日　時」のようにあける
  SD.spacedLabel = (s) => { const t = String(s || ''); return t.length === 2 ? `${t[0]}　${t[1]}` : t; };

  function tx(s, mode) {
    let h = esc(s);
    if (mode === 'preview') h = h.replace(/〇〇|○○/g, '<mark class="d-ph">$&</mark>');
    return h;
  }
  const empty = (mode) => (mode === 'preview' ? '<span class="d-empty">（未記入）</span>' : '');

  function lineHtml(l, mode) {
    if (!l.trim()) return '<div class="ln">&nbsp;</div>';
    const w = SD.hangOf(l);
    return `<div class="ln${w ? ` hg${w}` : ''}">${tx(l, mode)}</div>`;
  }
  function linesHtml(ls, mode) { return ls.map((l) => lineHtml(l, mode)).join(''); }

  function heading(plan, s, num, mode, inline) {
    const t = SD.headTitle(plan, s);
    return `<div class="d-h lv${s.level}"><span class="d-n">${esc(num)}</span>${tx(t, mode)}${inline != null ? `<span class="d-inl">　${inline}</span>` : ''}</div>`;
  }

  function wrap(s, inner, mode) {
    const cls = ['d-sec', `k-${s.kind}`, `lv${s.level}`];
    if (s.pb) cls.push('pb-before');
    return `<section class="${cls.join(' ')}" data-sid="${s.id}">${inner}</section>`;
  }

  function renderHeader(plan, s, mode) {
    const lines = s.lines.filter((l) => l.on);
    const rows = lines.map((l) => {
      const v = SD.headerValue(plan, l);
      return `<tr><th>${esc(SD.spacedLabel(l.label))}</th><td>${v ? tx(v, mode) : empty(mode)}</td></tr>`;
    }).join('');
    const maxLab = Math.max(3, ...lines.map((l) => SD.spacedLabel(l.label).length));
    return `<h1 class="d-title">${tx(SD.docTitle(plan), mode)}</h1>${rows ? `<table class="d-info ${s.align === 'left' ? 'al-left' : 'al-right'}" style="--lab:${maxLab + 0.6}em"><tbody>${rows}</tbody></table>` : ''}`;
  }

  function renderText(plan, s, num, mode) {
    const val = s.bind === 'unit' || s.key === 'unit_name' ? plan.meta.unit : s.text;
    const def = SD.sectionDefs[s.key] || {};
    const ls = U.lines(val).filter((l, i, a) => l.trim() || (i > 0 && i < a.length - 1));
    const joined = def.sep ? ls.filter((l) => l.trim()).join(def.sep) : ls.join('');
    if (s.inline && (ls.length <= 1 || def.sep) && joined.length <= 60) {
      return heading(plan, s, num, mode, joined.trim() ? tx(joined, mode) : empty(mode));
    }
    const body = ls.some((l) => l.trim()) ? ls.map((l) => (l.trim() ? `<p>${tx(l, mode)}</p>` : '<p>&nbsp;</p>')).join('') : `<p>${empty(mode)}</p>`;
    return heading(plan, s, num, mode) + `<div class="d-b prose">${body}</div>`;
  }

  function listMark(style, i) {
    return { bullet: '・', paren: `（${U.zen(i + 1)}）`, circle: U.circled(i + 1), num: `${U.zen(i + 1)}　`, none: '' }[style] ?? '';
  }
  function renderList(plan, s, num, mode) {
    const items = s.items.filter(U.nonEmpty);
    let body;
    if (!items.length) body = `<p>${empty(mode)}</p>`;
    else {
      body = items.map((it, i) => {
        const mk = listMark(s.style, i);
        const ls = U.lines(it);
        const first = `${mk ? `<span class="mk">${esc(mk)}</span>` : ''}${tx(ls[0], mode)}`;
        const rest = ls.slice(1).map((l) => `<br>${tx(l, mode)}`).join('');
        return `<div class="li ${s.style === 'none' ? 'plain' : 'st-' + s.style}">${first}${rest}</div>`;
      }).join('');
    }
    return heading(plan, s, num, mode) + `<div class="d-b list">${body}</div>`;
  }

  function kantenLines(v, mode) {
    const ls = U.lines(v).filter((l) => l.trim());
    if (!ls.length) return empty(mode);
    if (ls.length === 1) return linesHtml(ls, mode);
    return linesHtml(ls.map((l, i) => SD.markLine(l, U.circled(i + 1))), mode);
  }
  function renderKanten(plan, s, num, mode) {
    const ks = ['chi', 'shi', 'tai'];
    let tbl;
    if (s.layout === 'v') {
      tbl = `<table class="d-tbl kv"><colgroup><col style="width:22%"><col></colgroup><tbody>${ks.map((k) => `<tr><th>${esc(SD.KNAME[k])}</th><td>${kantenLines(s.f[k], mode)}</td></tr>`).join('')}</tbody></table>`;
    } else {
      tbl = `<table class="d-tbl kh"><colgroup><col style="width:33.3%"><col style="width:33.3%"><col style="width:33.4%"></colgroup><thead><tr>${ks.map((k) => `<th>${esc(SD.KNAME[k])}</th>`).join('')}</tr></thead><tbody><tr>${ks.map((k) => `<td>${kantenLines(s.f[k], mode)}</td>`).join('')}</tr></tbody></table>`;
    }
    return heading(plan, s, num, mode) + `<div class="d-b tbl">${tbl}</div>`;
  }

  // 表：段階が同じ行はつなげる
  SD.tableModel = (plan, s) => {
    const cols = s.cols.filter((c) => c.on).map((c) => SD.colInfo(s, c));
    const sumW = cols.reduce((a, c) => a + (+c.w || 10), 0) || 1;
    const acts = s.role === 'tenkai' ? SD.activityNumbers(s) : {};
    const ranges = s.role === 'plan' ? SD.planRanges(s) : [];
    const lessonNo = U.num(plan.meta.lessonNo, 0);
    const rows = s.rows.map((r, i) => ({ r, i, range: ranges[i] }));
    // 段階・時間の結合
    const span = (key) => {
      const out = {};
      let i = 0;
      while (i < rows.length) {
        let j = i + 1;
        const v = (rows[i].r.phase || '').trim();
        while (j < rows.length && (rows[j].r.phase || '').trim() === v && v !== '') j += 1;
        out[i] = j - i;
        for (let k = i + 1; k < j; k += 1) out[k] = 0;
        i = j;
      }
      return out;
    };
    const phaseSpan = span('phase');
    const timeMerge = !!(s.opts && s.opts.timeMerge);
    return { cols, sumW, acts, rows, lessonNo, phaseSpan, timeMerge };
  };

  SD.phaseMinutes = (s, startIndex, n) => s.rows.slice(startIndex, startIndex + n).reduce((a, r) => a + U.num(r.min, 0), 0);

  function renderTable(plan, s, num, mode) {
    const M = SD.tableModel(plan, s);
    if (!M.cols.length) return heading(plan, s, num, mode) + `<div class="d-b"><p>${empty(mode)}</p></div>`;
    const colg = M.cols.map((c) => `<col style="width:${(((+c.w || 10) / M.sumW) * 100).toFixed(2)}%">`).join('');
    const head = `<tr>${M.cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}</tr>`;
    const body = M.rows.map(({ r, i, range }) => {
      const hon = s.role === 'plan' && range && M.lessonNo >= range.from && M.lessonNo <= range.to && range.h > 0;
      const tds = M.cols.map((c) => {
        switch (c.type) {
          case 'phase': {
            const n = M.phaseSpan[i];
            if (n === 0) return '';
            const mins = SD.phaseMinutes(s, i, n);
            const showT = s.opts && s.opts.phaseTime && mins;
            return `<td class="c-phase"${n > 1 ? ` rowspan="${n}"` : ''}>${tx(r.phase || '', mode)}${showT ? `<div class="sub">（${mins}分）</div>` : ''}</td>`;
          }
          case 'min': {
            if (M.timeMerge) {
              const n = M.phaseSpan[i];
              if (n === 0) return '';
              const mins = SD.phaseMinutes(s, i, n);
              return `<td class="c-min"${n > 1 ? ` rowspan="${n}"` : ''}>${mins ? `${mins}分` : ''}</td>`;
            }
            return `<td class="c-min">${U.nonEmpty(r.min) ? `${esc(U.han(r.min))}分` : ''}</td>`;
          }
          case 'range': return `<td class="c-range">${range && range.h > 0 ? esc(range.from === range.to ? `${range.from}` : `${range.from}〜${range.to}`) : ''}${hon ? `<div class="hon-mark">本時${range.h > 1 ? `(${M.lessonNo})` : ''}</div>` : ''}</td>`;
          case 'hours': return `<td class="c-min">${esc(U.han(r.hours))}</td>`;
          case 'mark': return `<td class="c-mark">${esc(r.f[c.key] || '')}</td>`;
          default: {
            const ls = SD.cellLines(plan, s, c, r, M.acts[r.id]);
            return `<td>${ls.length ? linesHtml(ls, mode) : ''}</td>`;
          }
        }
      }).join('');
      return `<tr class="${hon ? 'hon' : ''}">${tds}</tr>`;
    }).join('');
    const tbl = `<table class="d-tbl role-${s.role}"><colgroup>${colg}</colgroup><thead>${head}</thead><tbody>${body || `<tr>${M.cols.map(() => '<td>&nbsp;</td>').join('')}</tr>`}</tbody></table>`;
    return heading(plan, s, num, mode) + `<div class="d-b tbl">${tbl}</div>`;
  }

  function renderBoard(plan, s, num, mode) {
    const n = s.parts.length || 1;
    const tds = s.parts.map((p) => `<td style="width:${(100 / n).toFixed(2)}%">${s.showLabels && p.label ? `<div class="bl">${esc(p.label)}</div>` : ''}${linesHtml(U.lines(p.text), mode)}</td>`).join('');
    return heading(plan, s, num, mode) + `<div class="d-b tbl"><table class="d-board"><tbody><tr>${tds}</tr></tbody></table></div>`;
  }

  SD.renderSection = (plan, s, num, mode) => {
    switch (s.kind) {
      case 'header': return wrap(s, renderHeader(plan, s, mode), mode);
      case 'heading': return wrap(s, heading(plan, s, num, mode), mode);
      case 'text': return wrap(s, renderText(plan, s, num, mode), mode);
      case 'list': return wrap(s, renderList(plan, s, num, mode), mode);
      case 'kanten': return wrap(s, renderKanten(plan, s, num, mode), mode);
      case 'table': return wrap(s, renderTable(plan, s, num, mode), mode);
      case 'board': return wrap(s, renderBoard(plan, s, num, mode), mode);
      case 'pagebreak': return `<div class="d-pagebreak" data-sid="${s.id}">${mode === 'preview' ? '<span>改ページ</span>' : ''}</div>`;
      default: return '';
    }
  };

  SD.docVars = (plan) => {
    const st = plan.style;
    return `--fs:${st.fs}pt;--tfs:${st.tfs}pt;--tblfs:${st.tblfs ? st.tblfs + 'pt' : `${Math.max(8, st.fs - 0.5)}pt`}`;
  };

  SD.renderDoc = (plan, mode = 'preview') => {
    const nums = SD.numbering(plan);
    const inner = plan.sections.filter((s) => s.on).map((s) => SD.renderSection(plan, s, nums[s.id] || '', mode)).join('');
    return `<div class="sd-doc" style="${SD.docVars(plan)}">${inner}</div>`;
  };

  // 印刷やWordに貼るときに使う、style を直接書きこんだHTML
  SD.docCss = () => `
.sd-doc{font-family:"Yu Mincho","YuMincho","Hiragino Mincho ProN","MS Mincho","Noto Serif JP",serif;font-size:var(--fs,10.5pt);line-height:1.6;color:#000}
.sd-doc .d-title{font-size:var(--tfs,14pt);text-align:center;font-weight:bold;margin:0 0 6pt;letter-spacing:.05em}
.sd-doc .d-info{border-collapse:collapse;margin:0 0 8pt}
.sd-doc .d-info.al-right{margin-left:auto}
.sd-doc .d-info th{font-weight:normal;text-align:left;padding:0 .8em 0 0;white-space:nowrap;vertical-align:top}
.sd-doc .d-info td{padding:0;vertical-align:top}
.sd-doc .d-sec{margin:0 0 5pt}
.sd-doc .d-h{font-weight:bold;margin:6pt 0 2pt;break-after:avoid;page-break-after:avoid}
.sd-doc .d-h.lv2{font-weight:bold;margin:3pt 0 2pt .5em}
.sd-doc .d-inl{font-weight:normal}
.sd-doc .d-b{margin-left:1em}
.sd-doc .lv2 .d-b{margin-left:1.5em}
.sd-doc .d-b.tbl{margin-left:.5em}
.sd-doc .lv2 .d-b.tbl{margin-left:1em}
.sd-doc .prose p{margin:0;text-indent:1em}
.sd-doc .list .li{padding-left:0}
.sd-doc .list .li.st-bullet{padding-left:1em;text-indent:-1em}
.sd-doc .list .li.st-paren{padding-left:3em;text-indent:-3em}
.sd-doc .list .li.st-circle,.sd-doc .list .li.st-num{padding-left:1.6em;text-indent:-1.6em}
.sd-doc .list .li.plain{text-indent:1em}
.sd-doc .d-tbl{width:100%;border-collapse:collapse;table-layout:fixed;font-size:var(--tblfs,10pt);line-height:1.45}
.sd-doc .d-tbl th,.sd-doc .d-tbl td{border:.75pt solid #000;padding:2pt 4pt;vertical-align:top;word-break:break-all;overflow-wrap:anywhere}
.sd-doc .d-tbl th{background:#e8e8e8;font-weight:bold;text-align:center;vertical-align:middle;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sd-doc .d-tbl.kv th{text-align:left;vertical-align:top}
.sd-doc .d-tbl thead{display:table-header-group}
.sd-doc .d-tbl tr{break-inside:avoid;page-break-inside:avoid}
.sd-doc .d-tbl .c-phase{text-align:center;vertical-align:middle;font-weight:bold}
.sd-doc .d-tbl .c-phase .sub{font-weight:normal;font-size:.9em}
.sd-doc .d-tbl .c-min,.sd-doc .d-tbl .c-mark,.sd-doc .d-tbl .c-range{text-align:center}
.sd-doc .d-tbl .c-min,.sd-doc .d-tbl .c-range{white-space:nowrap;padding-left:1pt;padding-right:1pt;word-break:keep-all}
.sd-doc .d-tbl .c-phase{padding-left:1pt;padding-right:1pt}
.sd-doc .d-tbl .c-mark{vertical-align:middle}
.sd-doc .d-tbl tr.hon td{background:#f0f0f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sd-doc .d-tbl .hon-mark{font-size:.85em;font-weight:bold}
.sd-doc .ln.hg1{padding-left:1em;text-indent:-1em}
.sd-doc .ln.hg2{padding-left:2em;text-indent:-2em}
.sd-doc .ln.hg3{padding-left:3em;text-indent:-3em}
.sd-doc .d-board{width:100%;border-collapse:collapse;table-layout:fixed;border:1.5pt solid #000;font-size:var(--tblfs,10pt);line-height:1.45}
.sd-doc .d-board td{border-left:.75pt dashed #000;padding:4pt 6pt;height:44mm;vertical-align:top}
.sd-doc .d-board td:first-child{border-left:none}
.sd-doc .d-board .bl{font-weight:bold;margin-bottom:2pt}
.sd-doc .pb-before{break-before:page;page-break-before:always}
.sd-doc .d-pagebreak{break-after:page;page-break-after:always;height:0}
.sd-doc .d-empty{color:#999}
.sd-doc mark.d-ph{background:#ffe58a;color:inherit}
`;

  // ───────── テキスト ─────────
  SD.renderPlain = (plan) => {
    const nums = SD.numbering(plan);
    const out = [];
    const ind = (lv) => (lv === 2 ? '　　' : '　');
    for (const s of plan.sections) {
      if (!s.on) continue;
      const n = nums[s.id] || '';
      const h = `${n}${SD.headTitle(plan, s)}`;
      switch (s.kind) {
        case 'header': {
          out.push(SD.docTitle(plan));
          for (const l of s.lines.filter((x) => x.on)) out.push(`　　　　　　　　　　${SD.spacedLabel(l.label)}　${SD.headerValue(plan, l)}`);
          out.push('');
          break;
        }
        case 'heading': out.push(h); break;
        case 'pagebreak': out.push('', '――――――――（改ページ）――――――――', ''); break;
        case 'text': {
          const val = s.key === 'unit_name' || s.bind === 'unit' ? plan.meta.unit : s.text;
          const def = SD.sectionDefs[s.key] || {};
          const ls = U.lines(val).filter((l) => l.trim());
          if (s.inline && (ls.length <= 1 || def.sep)) out.push(`${h}　${def.sep ? ls.join(def.sep) : ls.join('')}`);
          else { out.push(h); ls.forEach((l) => out.push(ind(s.level) + l)); }
          break;
        }
        case 'list': {
          out.push(h);
          s.items.filter(U.nonEmpty).forEach((it, i) => out.push(ind(s.level) + listMark(s.style, i) + U.lines(it).join('\n' + ind(s.level) + '　')));
          break;
        }
        case 'kanten': {
          out.push(h);
          for (const k of ['chi', 'shi', 'tai']) {
            out.push(`${ind(s.level)}【${SD.KNAME[k]}】`);
            U.lines(s.f[k]).filter((l) => l.trim()).forEach((l) => out.push(`${ind(s.level)}　${l}`));
          }
          break;
        }
        case 'board': {
          out.push(h);
          s.parts.forEach((p) => { out.push(`${ind(s.level)}［${p.label}］`); U.lines(p.text).filter((l) => l.trim()).forEach((l) => out.push(`${ind(s.level)}　${l}`)); });
          break;
        }
        case 'table': {
          out.push(h);
          const M = SD.tableModel(plan, s);
          const textCols = M.cols.filter((c) => !c.type);
          if (s.role === 'tenkai') {
            let i = 0;
            while (i < M.rows.length) {
              const n2 = M.phaseSpan[i] || 1;
              const ph = M.rows[i].r.phase;
              const mins = SD.phaseMinutes(s, i, n2);
              if (ph) out.push(`${ind(s.level)}■${ph}${mins ? `（${mins}分）` : ''}`);
              for (let k = i; k < i + n2; k += 1) {
                const r = M.rows[k].r;
                for (const c of textCols) {
                  const ls = SD.cellLines(plan, s, c, r, M.acts[r.id]);
                  if (!ls.length) continue;
                  out.push(`${ind(s.level)}　［${c.label}］`);
                  ls.forEach((l) => out.push(`${ind(s.level)}　　${l}`));
                }
              }
              i += n2;
            }
          } else if (s.role === 'plan') {
            M.rows.forEach(({ r, range }) => {
              const ks = ['chi', 'shi', 'tai'].filter((k) => r.f[k]).map((k) => SD.KSHORT[k]).join('・');
              out.push(`${ind(s.level)}第${range.from === range.to ? range.from : `${range.from}〜${range.to}`}時　${U.lines(r.f.p_naiyo).join(' ')}${ks ? `（${ks}）` : ''}`);
              for (const c of textCols.filter((x) => x.key !== 'naiyo')) {
                const ls = SD.cellLines(plan, s, c, r, 0);
                if (ls.length) out.push(`${ind(s.level)}　${c.label}：${ls.join(' ')}`);
              }
            });
          } else {
            M.rows.forEach(({ r }) => {
              const cells = textCols.map((c) => ({ c, ls: SD.cellLines(plan, s, c, r, 0) })).filter((x) => x.ls.length);
              if (!cells.length) return;
              out.push(`${ind(s.level)}・${cells.map((x) => `${x.c.label}：${x.ls.join(' ')}`).join('／')}`);
            });
          }
          break;
        }
        default: break;
      }
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n');
  };

  SD.aiPrompt = (plan) => {
    const m = plan.meta;
    return [
      `あなたは中学校${m.subject}科の学習指導案づくりを手伝う経験豊かな教員です。`,
      `次の下書き（第${m.grade}学年「${m.unit || '（単元名）'}」${m.lessonNo ? `第${m.lessonNo}時` : ''}${m.topic ? `・${m.topic}` : ''}、${m.minutes}分）を、提出できる学習指導案に清書してください。`,
      '',
      '【清書の条件】',
      '1. 項目の順番・見出し・表の列の構成は変えないこと。',
      '2. 「〇〇」や空欄は、本時の内容に合わせて具体的に書くこと。',
      '3. 本時の展開では、主な発問・予想される生徒の反応・教師の手立て（評価）が同じ行で対応するように書くこと。',
      '4. 目標・評価規準・展開中の評価が互いにずれないようにすること（学習指導要領〔平成29年告示〕の3観点で）。',
      '5. 教科書のページや数値など、確かめられない事実は作らず【要確認】と書くこと。',
      '6. 文体は常体（〜する。〜させる。）で統一すること。',
      '',
      '【下書き】',
      SD.renderPlain(plan),
    ].join('\n');
  };
})();
