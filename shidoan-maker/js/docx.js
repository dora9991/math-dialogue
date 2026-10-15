/* 指導案メーカー：Word（.docx）を作る。外部のライブラリは使わず、ZIP（無圧縮）とWordのXMLを直接書く。 */
(function () {
  const SD = window.SD;
  const U = SD.U;

  // ───────── ZIP（無圧縮） ─────────
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (buf) => { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i += 1) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder();
    const chunks = []; const central = []; let offset = 0;
    const d = new Date();
    const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
    const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const f of files) {
      const name = enc.encode(f.name);
      const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      chunks.push(new Uint8Array(lh.buffer), name, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
      ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + data.length;
    }
    const cdSize = central.reduce((a, c) => a + c.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  SD.zip = zip;

  // ───────── Word のXML ─────────
  const x = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const MM = 56.6929;

  function run(t, o = {}) {
    const rpr = [o.b ? '<w:b/><w:bCs/>' : '', o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : '', o.hl ? '<w:shd w:val="clear" w:color="auto" w:fill="FFF2A8"/>' : ''].join('');
    return `<w:r>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ''}<w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  }
  function para(runs, o = {}) {
    const ppr = [];
    if (o.keepNext) ppr.push('<w:keepNext/>');
    if (o.pageBreakBefore) ppr.push('<w:pageBreakBefore/>');
    ppr.push(`<w:spacing w:before="${o.before || 0}" w:after="${o.after || 0}" w:line="${o.line || 264}" w:lineRule="auto"/>`);
    if (o.ind) ppr.push(`<w:ind w:left="${Math.round(o.ind.left || 0)}"${o.ind.hanging ? ` w:hanging="${Math.round(o.ind.hanging)}"` : ''}${o.ind.firstLine ? ` w:firstLine="${Math.round(o.ind.firstLine)}"` : ''}/>`);
    if (o.jc) ppr.push(`<w:jc w:val="${o.jc}"/>`);
    if (o.sz) ppr.push(`<w:rPr><w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/></w:rPr>`);
    return `<w:p><w:pPr>${ppr.join('')}</w:pPr>${Array.isArray(runs) ? runs.join('') : runs}</w:p>`;
  }

  function build(plan) {
    const st = plan.style;
    const fs = Math.round(st.fs * 2); // 半ポイント
    const tfs = Math.round(st.tblfs ? st.tblfs * 2 : Math.max(16, st.fs * 2 - 1));
    const em = st.fs * 20; // 1字（twip）
    const temEm = (tfs / 2) * 20;
    const pageW = 11906; const pageH = 16838;
    const mt = Math.round(st.mt * MM); const mb = Math.round(st.mb * MM); const ml = Math.round(st.ml * MM); const mr = Math.round(st.mr * MM);
    const contentW = pageW - ml - mr;
    const nums = SD.numbering(plan);
    const body = [];

    const cellParas = (lines, o = {}) => {
      const ls = lines.length ? lines : [''];
      return ls.map((l) => {
        const hang = SD.hangOf(l) * temEm;
        return para(run(l, { b: o.b }), { ind: hang ? { left: hang, hanging: hang } : null, jc: o.jc, line: 252, sz: tfs });
      }).join('');
    };
    const tcell = (w, inner, o = {}) => {
      const pr = [`<w:tcW w:w="${Math.round(w)}" w:type="dxa"/>`];
      if (o.span) pr.push(`<w:gridSpan w:val="${o.span}"/>`);
      if (o.vMerge) pr.push(o.vMerge === 'restart' ? '<w:vMerge w:val="restart"/>' : '<w:vMerge/>');
      if (o.borders) pr.push(`<w:tcBorders>${o.borders}</w:tcBorders>`);
      if (o.fill) pr.push(`<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>`);
      if (o.vAlign) pr.push(`<w:vAlign w:val="${o.vAlign}"/>`);
      return `<w:tc><w:tcPr>${pr.join('')}</w:tcPr>${inner || para('', { sz: tfs })}</w:tc>`;
    };
    const table = (widths, rowsXml, o = {}) => {
      const indent = o.indent || 0;
      const total = widths.reduce((a, b) => a + b, 0);
      const bd = (sz, val = 'single') => `w:val="${val}" w:sz="${sz}" w:space="0" w:color="000000"`;
      const borders = o.noBorders
        ? '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>'
        : `<w:tblBorders><w:top ${bd(o.outer || 4)}/><w:left ${bd(o.outer || 4)}/><w:bottom ${bd(o.outer || 4)}/><w:right ${bd(o.outer || 4)}/><w:insideH ${bd(4)}/><w:insideV ${bd(4, o.insideV || 'single')}/></w:tblBorders>`;
      return `<w:tbl><w:tblPr><w:tblW w:w="${Math.round(total)}" w:type="dxa"/>${o.jc ? `<w:jc w:val="${o.jc}"/>` : ''}${indent ? `<w:tblInd w:w="${Math.round(indent)}" w:type="dxa"/>` : ''}${borders}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="28" w:type="dxa"/><w:left w:w="68" w:type="dxa"/><w:bottom w:w="28" w:type="dxa"/><w:right w:w="68" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="0000"/></w:tblPr><w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${Math.round(w)}"/>`).join('')}</w:tblGrid>${rowsXml}</w:tbl>${para('', { line: 120, sz: 8 })}`;
    };
    const trow = (cells, o = {}) => `<w:tr><w:trPr>${o.header ? '<w:tblHeader/>' : ''}<w:cantSplit/>${o.h ? `<w:trHeight w:val="${o.h}" w:hRule="atLeast"/>` : ''}</w:trPr>${cells.join('')}</w:tr>`;

    const headPara = (s, num, inlineRuns, pb) => {
      const lv = s.level;
      const t = SD.headTitle(plan, s);
      return para([run(num + t, { b: true, sz: fs }), ...(inlineRuns || [])], { keepNext: !inlineRuns, pageBreakBefore: pb, before: lv === 1 ? 100 : 40, after: 20, ind: lv === 2 ? { left: em * 0.5 } : null, sz: fs });
    };
    const bodyInd = (s) => (s.level === 2 ? em * 1.5 : em);
    const tblInd = (s) => (s.level === 2 ? em : em * 0.5);

    for (const s of plan.sections) {
      if (!s.on) continue;
      const num = nums[s.id] || '';
      const pb = !!s.pb;
      switch (s.kind) {
        case 'header': {
          body.push(para(run(SD.docTitle(plan), { b: true, sz: Math.round(st.tfs * 2) }), { jc: 'center', after: 120, pageBreakBefore: pb }));
          const lines = s.lines.filter((l) => l.on);
          if (lines.length) {
            const labs = lines.map((l) => SD.spacedLabel(l.label));
            const lw = (Math.max(3, ...labs.map((l) => l.length)) + 1) * em;
            const vals = lines.map((l) => SD.headerValue(plan, l));
            const vw = Math.min(contentW * 0.62, Math.max(em * 12, (Math.max(...vals.map((v) => v.length)) + 1) * em));
            const rows = lines.map((l, i) => trow([tcell(lw, para(run(labs[i]), { sz: fs })), tcell(vw, para(run(vals[i]), { sz: fs }))])).join('');
            // 右寄せは表の左の余白で寄せる（Word 以外のソフトでも同じ位置になるように）
            body.push(table([lw, vw], rows, { noBorders: true, indent: s.align === 'left' ? 0 : Math.max(0, contentW - lw - vw) }));
          }
          break;
        }
        case 'heading': body.push(headPara(s, num, null, pb)); break;
        case 'pagebreak': body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>'); break;
        case 'text': {
          const val = s.key === 'unit_name' || s.bind === 'unit' ? plan.meta.unit : s.text;
          const def = SD.sectionDefs[s.key] || {};
          const ls = U.lines(val).filter((l) => l.trim());
          const joined = def.sep ? ls.join(def.sep) : ls.join('');
          if (s.inline && (ls.length <= 1 || def.sep) && joined.length <= 60) {
            body.push(headPara(s, num, [run(`　${joined}`, { sz: fs })], pb));
          } else {
            body.push(headPara(s, num, null, pb));
            (ls.length ? ls : ['']).forEach((l) => body.push(para(run(l), { ind: { left: bodyInd(s), firstLine: em }, sz: fs })));
          }
          break;
        }
        case 'list': {
          body.push(headPara(s, num, null, pb));
          const items = s.items.filter(U.nonEmpty);
          items.forEach((it, i) => {
            const mk = { bullet: '・', paren: `（${U.zen(i + 1)}）`, circle: U.circled(i + 1), num: `${U.zen(i + 1)}　`, none: '' }[s.style] || '';
            const hang = mk ? mk.length * em : 0;
            U.lines(it).forEach((l, j) => body.push(para(run((j === 0 ? mk : '') + l), { ind: s.style === 'none' ? { left: bodyInd(s), firstLine: j === 0 ? em : 0 } : { left: bodyInd(s) + hang, hanging: j === 0 ? hang : 0 }, sz: fs })));
          });
          if (!items.length) body.push(para('', { sz: fs }));
          break;
        }
        case 'kanten': {
          body.push(headPara(s, num, null, pb));
          const ks = ['chi', 'shi', 'tai'];
          const cl = (k) => { const ls = U.lines(s.f[k]).filter((l) => l.trim()); return ls.length > 1 ? ls.map((l, i) => SD.markLine(l, U.circled(i + 1))) : ls; };
          const W = contentW - tblInd(s);
          if (s.layout === 'v') {
            const ws = [W * 0.22, W * 0.78];
            const rows = ks.map((k) => trow([tcell(ws[0], cellParas([SD.KNAME[k]], { b: true }), { fill: 'E8E8E8' }), tcell(ws[1], cellParas(cl(k)))])).join('');
            body.push(table(ws, rows, { indent: tblInd(s) }));
          } else {
            const ws = [W / 3, W / 3, W / 3];
            const head = trow(ks.map((k, i) => tcell(ws[i], cellParas([SD.KNAME[k]], { b: true, jc: 'center' }), { fill: 'E8E8E8', vAlign: 'center' })), { header: true });
            const row = trow(ks.map((k, i) => tcell(ws[i], cellParas(cl(k)))));
            body.push(table(ws, head + row, { indent: tblInd(s) }));
          }
          break;
        }
        case 'board': {
          body.push(headPara(s, num, null, pb));
          const W = contentW - tblInd(s);
          const n = s.parts.length || 1;
          const ws = Array(n).fill(W / n);
          const cells = s.parts.map((p, i) => {
            const ls = (s.showLabels && p.label ? [p.label] : []).concat(U.lines(p.text));
            return tcell(ws[i], cellParas(ls), {});
          });
          body.push(table(ws, trow(cells, { h: Math.round(44 * MM) }), { indent: tblInd(s), outer: 12, insideV: 'dashed' }));
          break;
        }
        case 'table': {
          body.push(headPara(s, num, null, pb));
          const M = SD.tableModel(plan, s);
          if (!M.cols.length) break;
          const W = contentW - tblInd(s);
          const ws = M.cols.map((c) => ((+c.w || 10) / M.sumW) * W);
          const head = trow(M.cols.map((c, i) => tcell(ws[i], cellParas([c.label], { b: true, jc: 'center' }), { fill: 'E8E8E8', vAlign: 'center' })), { header: true });
          const rows = M.rows.map(({ r, i, range }) => {
            const hon = s.role === 'plan' && range && M.lessonNo >= range.from && M.lessonNo <= range.to && range.h > 0;
            const fill = hon ? 'F0F0F0' : null;
            const cells = M.cols.map((c, ci) => {
              const w = ws[ci];
              switch (c.type) {
                case 'phase': {
                  const n = M.phaseSpan[i];
                  if (n === 0) return tcell(w, null, { vMerge: 'cont', fill });
                  const mins = SD.phaseMinutes(s, i, n);
                  const ls = [r.phase || ''];
                  if (s.opts && s.opts.phaseTime && mins) ls.push(`（${mins}分）`);
                  return tcell(w, cellParas(ls, { b: true, jc: 'center' }), { vMerge: n > 1 ? 'restart' : null, vAlign: 'center', fill });
                }
                case 'min': {
                  if (M.timeMerge) {
                    const n = M.phaseSpan[i];
                    if (n === 0) return tcell(w, null, { vMerge: 'cont', fill });
                    const mins = SD.phaseMinutes(s, i, n);
                    return tcell(w, cellParas([mins ? `${mins}分` : ''], { jc: 'center' }), { vMerge: n > 1 ? 'restart' : null, vAlign: 'center', fill });
                  }
                  return tcell(w, cellParas([U.nonEmpty(r.min) ? `${U.han(r.min)}分` : ''], { jc: 'center' }), { fill });
                }
                case 'range': {
                  const ls = [range && range.h > 0 ? (range.from === range.to ? `${range.from}` : `${range.from}〜${range.to}`) : ''];
                  if (hon) ls.push(`本時${range.h > 1 ? `(${M.lessonNo})` : ''}`);
                  return tcell(w, cellParas(ls, { jc: 'center' }), { fill });
                }
                case 'hours': return tcell(w, cellParas([U.han(r.hours)], { jc: 'center' }), { fill });
                case 'mark': return tcell(w, cellParas([r.f[c.key] || ''], { jc: 'center' }), { fill, vAlign: 'center' });
                default: return tcell(w, cellParas(SD.cellLines(plan, s, c, r, M.acts[r.id])), { fill });
              }
            });
            return trow(cells);
          }).join('');
          body.push(table(ws, head + (rows || trow(M.cols.map((c, i) => tcell(ws[i], null)))), { indent: tblInd(s) }));
          break;
        }
        default: break;
      }
    }

    const sect = `<w:sectPr><w:pgSz w:w="${pageW}" w:h="${pageH}"/><w:pgMar w:top="${mt}" w:right="${mr}" w:bottom="${mb}" w:left="${ml}" w:header="567" w:footer="567" w:gutter="0"/><w:cols w:space="425"/><w:docGrid w:linePitch="360"/></w:sectPr>`;
    const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${NS}><w:body>${body.join('')}${sect}</w:body></w:document>`;
    const font = '<w:rFonts w:ascii="Century" w:eastAsia="ＭＳ 明朝" w:hAnsi="Century" w:cs="Times New Roman" w:hint="eastAsia"/>';
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr>${font}<w:kern w:val="2"/><w:sz w:val="${fs}"/><w:szCs w:val="${fs}"/><w:lang w:val="en-US" w:eastAsia="ja-JP" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:widowControl w:val="0"/><w:jc w:val="both"/><w:spacing w:after="0" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="a"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="table" w:default="1" w:styleId="a1"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;
    const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="840"/><w:characterSpacingControl w:val="compressPunctuation"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(SD.planName(plan))}</dc:title><dc:creator>${x(plan.meta.teacher || '')}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
    const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>指導案メーカー</Application></Properties>`;
    return zip([
      { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>` },
      { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>` },
      { name: 'word/_rels/document.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>` },
      { name: 'word/document.xml', data: documentXml },
      { name: 'word/styles.xml', data: stylesXml },
      { name: 'word/settings.xml', data: settingsXml },
      { name: 'docProps/core.xml', data: coreXml },
      { name: 'docProps/app.xml', data: appXml },
    ]);
  }
  SD.buildDocx = build;
})();
