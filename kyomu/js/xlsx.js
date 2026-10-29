/* Excel（.xlsx）を、ブラウザの中だけで読む小さな読み取り器。
   外の部品は使わない（ZIP をほどくのはブラウザに入っている DecompressionStream）。
   読むのは「文字・数字」「結合セル」「塗りの色」だけ。数式は計算結果（保存されている値）を使う。 */
(function () {
  const K = (window.K = window.K || {});
  const X = (K.xlsx = {});

  /* ---------- ZIP ---------- */
  async function inflateRaw(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  function readZip(buf) {
    const dv = new DataView(buf);
    const u8 = new Uint8Array(buf);
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65600); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) throw new Error('Excel のファイルとして読めませんでした（.xlsx ですか？）');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const entries = {};
    const dec = new TextDecoder();
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true);
      const csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true);
      const elen = dv.getUint16(p + 30, true);
      const clen = dv.getUint16(p + 32, true);
      const off = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      entries[name] = { method, csize, off };
      p += 46 + nlen + elen + clen;
    }
    return {
      names: Object.keys(entries),
      has: (n) => !!entries[n],
      async text(n) {
        const e = entries[n];
        if (!e) return '';
        const ln = dv.getUint16(e.off + 26, true);
        const le = dv.getUint16(e.off + 28, true);
        const start = e.off + 30 + ln + le;
        const raw = u8.subarray(start, start + e.csize);
        const out = e.method === 0 ? raw : await inflateRaw(raw);
        return dec.decode(out);
      },
    };
  }

  /* ---------- XML の小道具 ---------- */
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  const unxml = (s) =>
    s.replace(/&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g, (_, e) =>
      e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e]
    );
  const attrs = (s) => {
    const o = {};
    s.replace(/([\w:]+)="([^"]*)"/g, (_, k, v) => (o[k] = unxml(v)));
    return o;
  };
  X.colNum = (letters) => {
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n;
  };
  X.colName = (n) => {
    let s = '';
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };
  const ref = (a) => {
    const mm = /^([A-Z]+)(\d+)$/.exec(a);
    return mm ? { c: X.colNum(mm[1]), r: Number(mm[2]) } : null;
  };

  /* ---------- 色（塗り） ---------- */
  const THEME_DEFAULT = ['FFFFFF', '000000', 'E7E6E6', '44546A', '5B9BD5', 'ED7D31', 'A5A5A5', 'FFC000', '4472C4', '70AD47'];
  const INDEXED = { 5: 'FFFF00', 13: 'FFFF00', 6: 'FF00FF', 7: '00FFFF', 22: 'C0C0C0', 26: 'FFFFCC', 27: 'CCFFFF', 41: 'CCFFFF', 42: 'CCFFCC', 43: 'FFFF99', 44: '99CCFF', 45: 'FF99CC', 46: 'CC99FF', 47: 'FFCC99', 51: 'FFCC00', 52: 'FF9900', 50: '99CC00' };
  function tint(hex, t) {
    const v = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const out = v.map((x) => Math.round(t < 0 ? x * (1 + t) : x + (255 - x) * t));
    return out.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  async function readStyles(zip) {
    const xml = await zip.text('xl/styles.xml');
    const theme = THEME_DEFAULT.slice();
    const th = await zip.text('xl/theme/theme1.xml');
    if (th) {
      const order = ['lt1', 'dk1', 'lt2', 'dk2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'];
      order.forEach((nm, i) => {
        const mm = new RegExp(`<a:${nm}>[\\s\\S]*?(?:srgbClr val="([0-9A-Fa-f]{6})"|lastClr="([0-9A-Fa-f]{6})")`).exec(th);
        if (mm) theme[i] = (mm[1] || mm[2]).toUpperCase();
      });
    }
    const fills = [];
    const fs = /<fills[^>]*>([\s\S]*?)<\/fills>/.exec(xml);
    if (fs)
      (fs[1].match(/<fill>[\s\S]*?<\/fill>|<fill\/>/g) || []).forEach((f) => {
        const pt = /patternType="(\w+)"/.exec(f);
        const fg = /<fgColor ([^>]*)\/?>/.exec(f);
        let color = '';
        if (pt && pt[1] === 'solid' && fg) {
          const a = attrs(fg[1]);
          if (a.rgb) color = a.rgb.slice(-6).toUpperCase();
          else if (a.theme != null) color = theme[Number(a.theme)] || '';
          else if (a.indexed != null) color = INDEXED[a.indexed] || '';
          if (color && a.tint) color = tint(color, Number(a.tint));
        }
        fills.push(color);
      });
    // 文字：太字・色
    const fonts = [];
    const fo = /<fonts[^>]*>([\s\S]*?)<\/fonts>/.exec(xml);
    if (fo)
      (fo[1].match(/<font>[\s\S]*?<\/font>|<font\/>/g) || []).forEach((f) => {
        const b = /<b\/>|<b val="1"\/>|<b val="true"\/>/.test(f);
        const cm = /<color ([^>]*)\/>/.exec(f);
        let color = '';
        if (cm) {
          const a = attrs(cm[1]);
          if (a.rgb) color = a.rgb.slice(-6).toUpperCase();
          else if (a.theme != null && Number(a.theme) > 1) color = theme[Number(a.theme)] || '';
          else if (a.indexed === '10') color = 'FF0000';
        }
        const szm = /<sz val="([\d.]+)"\/>/.exec(f);
        fonts.push({ b, color: color === '000000' ? '' : color, sz: szm ? Number(szm[1]) : 11 });
      });
    const xfFill = [];
    const xfFont = [];
    const xs = /<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml);
    if (xs)
      (xs[1].match(/<xf [^>]*>/g) || []).forEach((x) => {
        const a = attrs(x);
        xfFill.push(fills[Number(a.fillId || 0)] || '');
        xfFont.push(fonts[Number(a.fontId || 0)] || { b: false, color: '' });
      });
    return { xfFill, xfFont, theme };
  }

  /* ---------- 本を開く ---------- */
  X.open = async (file) => {
    const buf = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
    const zip = readZip(buf);
    const wb = await zip.text('xl/workbook.xml');
    const rels = await zip.text('xl/_rels/workbook.xml.rels');
    const relMap = {};
    (rels.match(/<Relationship [^>]*>/g) || []).forEach((r) => {
      const a = attrs(r);
      let t = a.Target || '';
      t = t.startsWith('/') ? t.slice(1) : 'xl/' + t;
      relMap[a.Id] = t;
    });
    const sheets = (wb.match(/<sheet [^>]*>/g) || []).map((s) => {
      const a = attrs(s);
      return { name: a.name, path: relMap[a['r:id']], hidden: a.state === 'hidden' || a.state === 'veryHidden' };
    });
    const sst = [];
    const sx = await zip.text('xl/sharedStrings.xml');
    (sx.match(/<si>[\s\S]*?<\/si>/g) || []).forEach((si) => {
      const body = si.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').replace(/<phoneticPr[^>]*\/>/g, '');
      let t = '';
      body.replace(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g, (_, x) => (t += x));
      sst.push(unxml(t));
    });
    const sty = await readStyles(zip);
    const xfFill = sty.xfFill;
    return {
      sheets,
      // 1 枚のシートを読む（maxRow 行まで）
      async sheet(name, maxRow) {
        const sh = sheets.find((x) => x.name === name);
        if (!sh) throw new Error('シートがありません：' + name);
        const xml = await zip.text(sh.path);
        const cells = new Map();
        const fill = new Map();
        const font = new Map();
        const lim = maxRow || 100;
        const rowRe = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;
        let mm;
        const sdStart = xml.indexOf('<sheetData');
        rowRe.lastIndex = sdStart < 0 ? 0 : sdStart;
        while ((mm = rowRe.exec(xml))) {
          const ra = attrs(mm[1]);
          const r = Number(ra.r);
          if (r > lim) break;
          if (!mm[2]) continue;
          const cRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
          let cm;
          while ((cm = cRe.exec(mm[2]))) {
            const a = attrs(cm[1]);
            const p = ref(a.r);
            if (!p) continue;
            const key = p.r + ',' + p.c;
            const f = xfFill[Number(a.s || 0)];
            if (f) fill.set(key, f);
            const ft = sty.xfFont[Number(a.s || 0)];
            if (ft && (ft.b || ft.color || ft.sz >= 11.5)) font.set(key, ft);
            const inner = cm[2] || '';
            let v = null;
            if (a.t === 'inlineStr') {
              let t = '';
              inner.replace(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g, (_, x) => (t += x));
              v = unxml(t);
            } else {
              const vm = /<v>([\s\S]*?)<\/v>/.exec(inner);
              if (vm) {
                const raw = unxml(vm[1]);
                if (a.t === 's') v = sst[Number(raw)];
                else if (a.t === 'str' || a.t === 'e') v = raw;
                else if (a.t === 'b') v = raw === '1';
                else v = Number(raw);
              }
            }
            if (v !== null && v !== '') cells.set(key, v);
          }
        }
        const merges = [];
        const mi = xml.indexOf('<mergeCells');
        if (mi >= 0) {
          const part = xml.slice(mi, xml.indexOf('</mergeCells>', mi));
          (part.match(/<mergeCell ref="[^"]+"/g) || []).forEach((x) => {
            const [a, b] = x.slice(16, -1).split(':');
            const p = ref(a);
            const q = ref(b || a);
            if (p && q) merges.push({ r1: p.r, c1: p.c, r2: q.r, c2: q.c });
          });
        }
        let shapes = [];
        try {
          shapes = await readShapes(zip, sh.path, sty.theme);
        } catch (e) {
          shapes = [];
        }
        return {
          name,
          get: (r, c) => (cells.has(r + ',' + c) ? cells.get(r + ',' + c) : null),
          fill: (r, c) => fill.get(r + ',' + c) || '',
          font: (r, c) => font.get(r + ',' + c) || null,
          merges,
          shapes,
          maxRow: lim,
        };
      },
    };
  };

  /* ---------- 図形（四角・角丸の吹き出し）：位置・色・文字 ---------- */
  function rgb2hsl(hex) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hsl2rgb([h, s, l]) {
    const f = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let r, g, b;
    if (s === 0) r = g = b = l;
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = f(p, q, h + 1 / 3);
      g = f(p, q, h);
      b = f(p, q, h - 1 / 3);
    }
    return [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  const SCHEME = { lt1: 0, bg1: 0, dk1: 1, tx1: 1, lt2: 2, bg2: 2, dk2: 3, tx2: 3, accent1: 4, accent2: 5, accent3: 6, accent4: 7, accent5: 8, accent6: 9 };
  function colorOf(xml, theme) {
    if (!xml) return null;
    let mm = /<a:srgbClr val="([0-9A-Fa-f]{6})"/.exec(xml);
    let hex = mm ? mm[1].toUpperCase() : null;
    if (!hex && (mm = /<a:sysClr [^>]*lastClr="([0-9A-Fa-f]{6})"/.exec(xml))) hex = mm[1].toUpperCase();
    if (!hex && (mm = /<a:schemeClr val="(\w+)"/.exec(xml))) hex = theme[SCHEME[mm[1]]] || null;
    if (!hex) return null;
    const mod = /<a:lumMod val="(\d+)"/.exec(xml);
    const off = /<a:lumOff val="(\d+)"/.exec(xml);
    const shade = /<a:shade val="(\d+)"/.exec(xml);
    if (mod || off) {
      const hsl = rgb2hsl(hex);
      hsl[2] = Math.min(1, hsl[2] * (mod ? Number(mod[1]) / 100000 : 1) + (off ? Number(off[1]) / 100000 : 0));
      hex = hsl2rgb(hsl);
    }
    if (shade) {
      const k = Number(shade[1]) / 100000;
      hex = [0, 2, 4].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    return '#' + hex;
  }
  async function readShapes(zip, sheetPath, th) {
    const dir = sheetPath.slice(0, sheetPath.lastIndexOf('/'));
    const relPath = `${dir}/_rels/${sheetPath.slice(sheetPath.lastIndexOf('/') + 1)}.rels`;
    const rels = await zip.text(relPath);
    const mm = /Target="([^"]*drawings\/drawing\d+\.xml)"/.exec(rels || '');
    if (!mm) return [];
    const target = mm[1].startsWith('/') ? mm[1].slice(1) : `${dir}/${mm[1]}`.replace(/[^/]+\/\.\.\//g, '');
    const xml = await zip.text(target);
    const out = [];
    (xml.match(/<xdr:twoCellAnchor[\s\S]*?<\/xdr:twoCellAnchor>/g) || []).forEach((a) => {
      if (!/<xdr:sp>/.test(a) && !/<xdr:sp /.test(a)) return;
      const num = (tag, part) => {
        const x = new RegExp(`<xdr:${part}>[\\s\\S]*?<xdr:${tag}>(-?\\d+)</xdr:${tag}>`).exec(a);
        return x ? Number(x[1]) : 0;
      };
      const paras = (a.match(/<a:p>[\s\S]*?<\/a:p>|<a:p\/>/g) || []).map((p) => {
        let t = '';
        p.replace(/<a:t>([\s\S]*?)<\/a:t>/g, (_, x) => (t += x));
        return unxml(t);
      });
      const text = paras.join('\n').replace(/\n+$/, '');
      if (!text.trim()) return;
      const sp = (/<xdr:spPr>([\s\S]*?)<\/xdr:spPr>/.exec(a) || [])[1] || '';
      const style = (/<xdr:style>([\s\S]*?)<\/xdr:style>/.exec(a) || [])[1] || '';
      const geom = (/prstGeom prst="(\w+)"/.exec(sp) || [])[1] || 'rect';
      const lnXml = (/<a:ln\b[^>]*>([\s\S]*?)<\/a:ln>/.exec(sp) || [])[1];
      const lnW = (/<a:ln w="(\d+)"/.exec(sp) || [])[1];
      const spNoLn = /<a:ln[^>]*>\s*<a:noFill\/>/.test(sp);
      const fillXml = /<a:noFill\/>\s*<a:ln/.test(sp) || /^[\s\S]*?<\/a:prstGeom>\s*<a:noFill\/>/.test(sp) ? 'none' : (/<\/a:prstGeom>\s*(<a:solidFill>[\s\S]*?<\/a:solidFill>)/.exec(sp) || [])[1];
      let fill = fillXml === 'none' ? 'transparent' : colorOf(fillXml, th);
      if (!fill && fillXml !== 'none') fill = colorOf((/<a:fillRef[^>]*>([\s\S]*?)<\/a:fillRef>/.exec(style) || [])[1], th) || '#ffffff';
      let line = spNoLn ? 'transparent' : colorOf(lnXml, th);
      if (!line && !spNoLn) line = colorOf((/<a:lnRef[^>]*>([\s\S]*?)<\/a:lnRef>/.exec(style) || [])[1], th) || '#000000';
      const runColor = colorOf((/<a:rPr[^>]*>\s*<a:solidFill>([\s\S]*?)<\/a:solidFill>/.exec(a) || [])[1], th);
      const fontRef = colorOf((/<a:fontRef[^>]*>([\s\S]*?)<\/a:fontRef>/.exec(style) || [])[1], th);
      const sz = (/<a:(?:rPr|defRPr|endParaRPr)[^>]*\bsz="(\d+)"/.exec(a) || [])[1];
      const body = (/<a:bodyPr([^>]*)>/.exec(a) || [])[1] || '';
      const algn = (/<a:pPr[^>]*algn="(\w+)"/.exec(a) || [])[1] || 'l';
      out.push({
        text,
        c0: num('col', 'from'),
        co0: num('colOff', 'from'),
        r0: num('row', 'from'),
        ro0: num('rowOff', 'from'),
        c1: num('col', 'to'),
        co1: num('colOff', 'to'),
        r1: num('row', 'to'),
        ro1: num('rowOff', 'to'),
        shape: geom === 'roundRect' ? 'round' : 'rect',
        fill,
        line,
        lw: lnW ? Math.max(1, Math.round(Number(lnW) / 9525)) : 1,
        color: runColor || fontRef || '#000000',
        size: sz ? Number(sz) / 100 : 11,
        anchor: /anchor="ctr"/.test(body) ? 'ctr' : /anchor="b"/.test(body) ? 'b' : 't',
        align: algn === 'ctr' ? 'center' : algn === 'r' ? 'right' : 'left',
      });
    });
    return out;
  }
})();
