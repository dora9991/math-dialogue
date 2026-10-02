/* 電子黒板用スライド — ノート型ワークシート（data/ws_*.js、編集して保存したものがあればそちら）から、授業ごとのスライドを組み立てて映す。
   2つの使い方：
     full＝スライドだけで授業（表紙 → 問題 → 発問と答え → 図・表 → 練習 → まとめ）
     core＝板書と使う（黒板に書きにくいものだけ：問題文・図・グラフ・表・数直線と、その答え）
   答え・空欄は、→キー（または ▶）で1つずつ、または画面のその場所をさわると出る。
   画面：#/sl/<時間のID>[/core][/スライド番号] */
(function () {
  'use strict';
  const D = window.LDB || { lessons: [], units: [] };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lessonById = Object.fromEntries((D.lessons || []).map(l => [l.id, l]));
  const unitByKey = Object.fromEntries((D.units || []).map(u => [u.key, u]));
  const num = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
  const SW = 1600, SH = 900;
  const FS_PACK = 0.9;   // 1枚に入れる量を決めるときの文字の倍率（36px）。入れたあと、入りきる中でいちばん大きくする
  const FS_MAX = 1.5, FS_MIN = 0.5;
  const KFIG = 0.8;      // 図は、ワークシートの0.8倍の大きさで作図してから引きのばす（図の中の字が大きくなる）
  const MODES = { full: 'スライドだけで授業', core: '板書と使う（図・問題だけ）' };
  const modeOf = m => m === 'core' ? 'core' : 'full';
  const inl = s => window.WSX.inl(s);

  /* ---------------- 文字 ---------------- */
  // 「（1）…　　（2）…」「…とすると　V＝…」のように空白で区切られたところは、まとまりごとに折り返す
  function rich(text) {
    return String(text == null ? '' : text).split('\n').map(line => {
      // 〔　　〕（　　）のように、かっこの中を空けて書いた空らんは、そこで区切らない
      line = line.replace(/([〔（(［\[「])([ 　]+)([〕）)］\]」])/g, (m, a, sp, b) => a + '\u2003'.repeat(sp.length) + b);
      const parts = line.split(/　+| {2,}/).filter(p => p !== '');
      return parts.length < 2 ? inl(line.replace(/^[ 　]+/, '')) : parts.map(p => `<span class="ck">${inl(p)}</span>`).join('');
    }).join('<br>');
  }
  const strip = t => String(t || '').replace(/\{\{|\}\}|\*\*|\\(?=[A-Za-z])|\{\||\|\}/g, '').replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '$1');
  const emOf = t => { let n = 0; for (const ch of strip(t)) n += /[\x20-\x7e]/.test(ch) ? 0.58 : 1; return n; };
  const maxLineEm = t => Math.max(0, ...String(t || '').split('\n').map(emOf));
  const PROB_RE = /^(問題|練習|課題|例題|問|確認|チャレンジ|活動|やってみよう)/;
  const NUM_RE = /^[（(]?[0-9０-９①-⑳]/, NUMT_RE = /^\s*(?:[（(][0-9０-９]+[）)]|[①-⑳])/;
  const chip = (label, cls) => label ? `<span class="chip${cls ? ' ' + cls : ''}">${esc(label)}</span>` : '';

  /* ---------------- ワークシートのブロック → スライドの部品 ----------------
     部品＝{ html, head（場面のはじまり）, keep（次の部品と同じスライドに置く）, rc（つづきのスライドに小さく出す文）, parts（入りきらないときに分ける部品） } */
  const U = (html, o) => Object.assign({ html, head: false, keep: false, rc: null, parts: null }, o || {});
  const rcHTML = (label, text) => `<div class="su su-rc">${label ? `<b>${esc(label)}</b>` : ''}${inl(String(text || '').replace(/\n/g, '　'))}</div>`;

  function kadaiU(b) {
    const label = b.label == null ? '課題' : b.label;
    const body = b.blank ? `<span class="a rv"><span class="ansx">${rich(b.text)}</span></span>` : rich(b.text);
    return U(`<div class="su su-k${b.box === false ? ' nobox' : ''}">${chip(label, 'c-k')}<div class="tx">${body}</div></div>`, { head: true, keep: true, rc: rcHTML(label, b.text) });
  }
  function textU(b, kind) {   // kind：'prob'＝問題文、'num'＝小問、'def'＝用語・まとめ、''＝説明
    const label = b.label || '';
    const body = b.blank ? `<span class="a rv"><span class="ansx">${rich(b.text)}</span></span>` : rich(b.text);
    const cls = kind === 'prob' ? 'c-k' : kind === 'num' ? 'c-n' : kind === 'def' ? 'c-d' : 'c-w';
    return U(`<div class="su su-t">${chip(label, cls)}<div class="tx">${body}</div></div>`,
      { head: kind === 'prob', keep: kind === 'prob' || (kind !== 'def' && !/\{\{/.test(b.text || '') && !b.blank), rc: kind === 'prob' ? rcHTML(label, b.text) : null });
  }
  function writeU(b) {
    const q = b.prompt ? `<div class="q">${rich(b.prompt)}</div>` : '';
    const a = b.answer ? `<div class="a rv"><span class="ansx">${rich(b.answer)}</span></div>` : '';
    return U(`<div class="su su-w">${chip(b.label, 'c-w')}<div class="tx">${q}${a}</div></div>`);
  }
  const cellsOf = r => { const t = String(r.cells || '').trim(); return !t ? [] : t.indexOf('|') >= 0 ? t.split('|').map(x => x.trim()) : t.split(/[ 　]+/); };
  function tableU(b, wem) {
    const rs = b.rows || [], ncol = Math.max(1, ...rs.map(r => cellsOf(r).length));
    // 横に入りきるように、列の多い表は字を小さくする（wem＝使える幅を字の数で）
    const hw = Math.max(1.5, ...rs.map(r => emOf(r.h))) + 1.2;
    const cw = Math.max(2.3, ...rs.map(r => Math.max(0, ...cellsOf(r).map(c => emOf(c)))).map(v => v + 1.15));
    const need = hw + ncol * cw, tf = Math.max(0.42, Math.min(1, wem / need));
    const body = rs.map(r => {
      const cs = cellsOf(r), cell = r.head ? 'th' : 'td';
      const tds = Array.from({ length: ncol }, (_, i) => {
        const v = cs[i]; if (v == null) return `<${cell}></${cell}>`;
        if (/^\{\{[\s\S]*\}\}$/.test(v)) return `<${cell}${r.blank ? '' : ' class="rv"'}><span class="ansx">${inl(v.slice(2, -2))}</span></${cell}>`;
        return `<${cell}>${r.blank ? `<span class="ansx">${inl(v)}</span>` : inl(v)}</${cell}>`;
      }).join('');
      return `<tr class="${r.head ? 'hd' : ''}${r.blank ? ' rv' : ''}"><th>${inl(r.h)}</th>${tds}</tr>`;
    }).join('');
    return U(`<div class="su su-tab" style="--tf:${tf.toFixed(3)}em"><table class="st">${body}</table></div>`);
  }
  // 図の中の字が、わくの外に出たり重なったりしている数（小さく作図したせいで崩れていないかを見る）
  let fbox = null;
  function figBad(svg) {
    if (!document.body) return 0;
    if (!fbox) { fbox = document.createElement('div'); fbox.setAttribute('aria-hidden', 'true'); fbox.style.cssText = 'position:absolute;left:-30000px;top:0;width:400px;visibility:hidden;pointer-events:none'; document.body.appendChild(fbox); }
    fbox.innerHTML = svg;
    const el = fbox.firstChild, vb = el && el.viewBox && el.viewBox.baseVal; if (!vb || !vb.width) return 0;
    // 字の外わく（上下は字面より広いので、少しけずって見る）。答えの字かどうかも覚えておく
    const ts = $$('text', el).map(t => { try { const b = t.getBBox(); return { x: b.x, y: b.y + b.height * 0.12, width: b.width, height: b.height * 0.76, fy: b.y, fh: b.height, ans: !!t.closest('.ansx') }; } catch (e) { return null; } }).filter(b => b && b.width > 0);
    let n = 0;
    ts.forEach(b => { if (Math.max(vb.x - b.x, b.x + b.width - vb.x - vb.width) > 0.4 || Math.max(vb.y - b.y, b.y + b.height - vb.y - vb.height) > 0.4) n++; });
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) {
      const a = ts[i], c = ts[j], ox = Math.min(a.x + a.width, c.x + c.width) - Math.max(a.x, c.x), oy = Math.min(a.y + a.height, c.y + c.height) - Math.max(a.y, c.y);
      // 問題の字どうし・答えの字どうしは、少しでも重なったらだめ（字面で見る）
      if (a.ans === c.ans && ox > 0.15 && oy > 0.15) { n++; continue; }
      // そのほか（問題の字と答えの印など）は、外わくどうしが大きく重なったときだけ
      const fo = Math.min(a.fy + a.fh, c.fy + c.fh) - Math.max(a.fy, c.fy);
      if (ox > 0.5 && fo > 0.9 && ox * fo > Math.min(a.width * a.fh, c.width * c.fh) * 0.2) n++;
    }
    fbox.innerHTML = '';
    return n;
  }
  /* 図のまわりの余白を切りつめる（ワークシートでは横長のわくの中に小さくかいてある図を、スライドでは大きく映すため）。
     数直線・グラフは、わくいっぱいにかいてあるのでそのまま。直線・半直線のある図は、わくの端まで線がのびるので切りつめない */
  function figTrim(svg, kind) {
    const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg), W = m ? +m[1] : 0, H = m ? +m[2] : 0, same = { svg, w: W, h: H };
    if (!m || !fbox || !['geo', 'solid', 'coord'].includes(kind)) return same;
    fbox.innerHTML = svg;
    const el = fbox.firstChild, bg = el && el.querySelector(':scope > rect'), cap = el && el.querySelector(':scope > text.cap');
    let b = null, cw = 0;
    if (bg) {
      bg.remove();
      if (cap) { try { cw = cap.getBBox().width; } catch (e) { cw = 0; } cap.remove(); }   // 図の名前（①など）は左上のすみにあるので、はずして測り、あとで図のすぐ上に置き直す
      try { b = el.getBBox(); } catch (e) { b = null; }
    }
    fbox.innerHTML = '';
    if (!b || !(b.width > 0) || !(b.height > 0)) return same;
    const pad = 2.4, n2 = v => Math.round(v * 100) / 100;
    let x0 = Math.max(0, b.x - pad), y0 = Math.max(0, b.y - pad), x1 = Math.min(W, b.x + b.width + pad), y1 = Math.min(H, b.y + b.height + pad);
    if (cap) { y0 -= 4.6; if (x1 - x0 < cw + 1.6) x1 = x0 + cw + 1.6; }
    x0 = n2(x0); y0 = n2(y0);
    const w = n2(x1 - x0), h = n2(y1 - y0);
    if (w < 8 || h < 8 || (w > W * 0.97 && h > H * 0.97)) return same;
    let out = svg.replace(/viewBox="[^"]*" width="[^"]*" height="[^"]*"/, `viewBox="${x0} ${y0} ${w} ${h}"`)
      .replace(/<rect x="0" y="0" width="[\d.]+" height="[\d.]+" fill="#fff"\/>/, `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#fff"/>`);
    if (cap) out = out.replace(/<text x="[\d.]+" y="[\d.]+"([^>]*class="cap")/, `<text x="${n2(x0 + 0.6)}" y="${n2(y0 + 3.5)}"$1`);
    return { svg: out, w, h };
  }
  // 図を k 倍の大きさで作図する。縮尺（1目もり何mm）を決めてある図は、スライドでは実寸にする意味がないので、わくに合わせてかく
  function figAt(f, w, h, k) {
    const fk = f.kind === 'geo' && /^\s*(縮尺|scale)\s/m.test(f.src || '') ? Object.assign({}, f, { src: f.src.replace(/^\s*(?:縮尺|scale)\s.*$/m, '') }) : f;
    return window.WSX.figSVG(fk, w * k, h * k);
  }
  /* 1つの図ブロックの図を、同じ倍率で作図する。小さく作図するほど、スライドでは図の中の字が大きくなる。
     列の中の図（幅がせまい）は 0.64 倍から、横いっぱいの図は 0.8 倍から試し、字がわくの外に出たり重なったりしたら、1段大きい倍率にする */
  function figSet(figs, widths, h) {
    // 小さく作図しすぎると角度や長さの字が入らなくなるので、作図の幅が50mmより小さくなる倍率は使わない
    const ladder = (Math.max(...widths) < 125 ? [0.64, KFIG] : [KFIG]).filter(k => Math.min(...widths) * k >= 50).concat(1);
    let best = null;
    for (const k of ladder) {
      const svgs = figs.map((f, i) => figAt(f, widths[i], h, k)), bad = svgs.reduce((a, v) => a + figBad(v), 0);
      if (!best || bad < best.bad) best = { svgs, bad };
      if (!bad) break;
    }
    return best.svgs.map((v, i) => figTrim(v, figs[i].kind || 'coord'));
  }
  const MM_EM = 0.4;   // 図は、作図の1mmが字の高さの0.4倍になるところまで大きくできる（図の中の字が本文より大きくなりすぎないように）
  function figU(b, Wmm, pitch) {
    const figs = b.figs && b.figs.length ? b.figs : [{ kind: 'coord' }], H = Math.max(1, Math.round(num(b.rows, 1))) * pitch;
    const ws = figs.map(f => Math.max(0.2, num(f.w, 1))), sum = ws.reduce((a, c) => a + c, 0), avail = Wmm - 4 * (figs.length - 1);
    const fs = figSet(figs, ws.map(v => avail * v / sum), H);
    // 高さがそろうように、横：縦の比で幅を分ける
    const hmax = Math.max(...fs.map(x => x.h)), ars = fs.map(x => x.w / hmax), gap = 1 + 0.016 * (fs.length - 1);
    const inner = fs.map((x, i) => `<div class="fg${/class="ansx"/.test(x.svg) ? ' rv' : ''}" style="flex:${ars[i].toFixed(3)}">${x.svg}</div>`).join('');
    const ar = ars.reduce((a, c) => a + c, 0) * gap, mw = fs.reduce((a, x) => a + x.w, 0) * gap * MM_EM;
    return U(`<div class="su su-fig${figs.some(f => f.caption) ? ' cap' : ''}" style="--ar:${ar.toFixed(3)};--mw:${mw.toFixed(2)}em">${inner}</div>`, { fig: true });
  }

  // st.zone＝いま「問題の中」か（発問や用語のまとめが出たら外に出る）。板書と使うときは、問題の中の文と答えだけを残す
  function conv(blocks, mode, Wmm, pitch, st, wem) {
    const core = mode === 'core', out = [];
    (blocks || []).forEach(b => {
      if (b.type === 'break') return;
      if (b.type === 'meate') {
        if (b.label) { st.zone = true; out.push(U(`<div class="su su-sec">${esc(b.label)}${b.text ? '　' + inl(b.text) : ''}</div>`, { head: true, keep: true })); }
        return;
      }
      if (b.type === 'kadai') { st.zone = true; out.push(kadaiU(b)); return; }
      if (b.type === 'text') {
        if (!String(b.text || '').trim() && !b.label) return;
        const lab = b.label || '', kind = PROB_RE.test(lab) ? 'prob' : (NUM_RE.test(lab) || (!lab && NUMT_RE.test(b.text || ''))) ? 'num' : lab ? 'def' : '';
        if (kind === 'prob' || kind === 'num') st.zone = true;
        if (core && (kind === 'def' || (kind === '' && !st.zone))) return;
        out.push(textU(b, kind));
        return;
      }
      if (b.type === 'write') {
        if (!b.prompt && !b.answer) return;            // 書くだけの欄はスライドにしない
        if (b.prompt || b.label) { st.zone = false; if (core) return; }   // 発問・見通し・気づいたこと などは、黒板で
        else if (core && !st.zone) return;
        out.push(writeU(b));
        return;
      }
      if (b.type === 'table') { out.push(Object.assign(tableU(b, wem), { tab: true })); return; }
      if (b.type === 'figure') { out.push(figU(b, Wmm, pitch)); return; }
      if (b.type === 'cols') out.push(...colsU(b, mode, Wmm, pitch, st, wem));
    });
    return out;
  }
  function colsU(b, mode, Wmm, pitch, st, wem) {
    const cols = (b.cols || []).filter(c => c && c.blocks && c.blocks.length); if (!cols.length) return [];
    const r = String(b.ratio || '1:1').split(':').map(x => Math.max(1, num(x, 1)));
    const idx = (b.cols || []).map((c, i) => i).filter(i => b.cols[i] && b.cols[i].blocks && b.cols[i].blocks.length);
    const sum = idx.reduce((a, i) => a + (r[i] || 1), 0), n = cols.length;
    const wOf = k => (Wmm - 6 * (n - 1)) * (r[idx[k]] || 1) / sum, emW = k => (wem - 1.1 * (n - 1)) * (r[idx[k]] || 1) / sum;
    // 2つ以上の列に学習課題がある → 列ごとに別の場面にする
    if (cols.filter(c => c.blocks.some(x => x.type === 'kadai')).length >= 2) return cols.flatMap(c => conv(c.blocks, mode, Wmm, pitch, st, wem));
    const allText = cols.every(c => c.blocks[0].type === 'text'), allWrite = cols.every(c => c.blocks.every(x => x.type === 'write'));
    if ((allText || allWrite) && !cols.some(c => c.blocks.some(x => x.type === 'kadai'))) {
      // 小問のならび：番号の順に、横に n 個ずつならべ直す（1行ごとにスライドを分けられる）
      const items = [], tail = [];
      cols.forEach((c, k) => {
        let cur = null;
        c.blocks.forEach(x => {
          const filled = x.type === 'write' && (x.prompt || x.answer);
          if (allWrite) { if (filled) items.push({ k, blocks: [x] }); return; }
          if (x.type === 'text') {
            if (!cur || x.label || NUMT_RE.test(x.text || '') || cur.hasW) { cur = { k, blocks: [], hasW: false }; items.push(cur); }
            cur.blocks.push(x); return;
          }
          if (x.type === 'write' && x.label && cur) { if (filled) tail.push(x); return; }   // 「気づいたこと」などは、ならびの後ろに横いっぱいで
          if (!cur) { cur = { k, blocks: [], hasW: false }; items.push(cur); }
          cur.blocks.push(x); if (filled) cur.hasW = true;
        });
      });
      let per = n;
      const wide = Math.max(0, ...items.flatMap(it => it.blocks.map(x => x.type === 'text' ? maxLineEm(x.text) + emOf(x.label) : x.type === 'write' ? Math.max(maxLineEm(x.answer), maxLineEm(x.prompt)) : 0)));
      if (per >= 3 && wide > (wem - 2.6) / 3) per = 2;
      const iw = (wem - 1.3 * (per - 1)) / per, mmw = (Wmm - 6 * (per - 1)) / per;
      const us = items.map(it => conv(it.blocks, mode, mmw, pitch, st, iw)).filter(u => u.length);
      const out = [];
      for (let i = 0; i < us.length; i += per) {
        const grp = us.slice(i, i + per);
        out.push(U(`<div class="su su-row" style="grid-template-columns:repeat(${per},minmax(0,1fr))">${grp.map(u => `<div class="si">${u.map(x => x.html).join('')}</div>`).join('')}</div>`,
          { parts: grp.length > 1 ? grp.flat() : null, multi: true }));
      }
      return out.concat(conv(tail, mode, Wmm, pitch, st, wem));
    }
    // 片方の列の途中に次の学習課題があり、もう片方の列に同じ数の図がならんでいる → 課題ごとの2段組に分ける（図①は問題1、図②は問題2）
    if (n === 2) {
      const ki = cols.findIndex(c => c.blocks.slice(1).some(x => x.type === 'kadai')), other = cols[1 - ki];
      if (ki >= 0 && other) {
        const segs = [[]];
        cols[ki].blocks.forEach((x, i) => { if (i && x.type === 'kadai') segs.push([]); segs[segs.length - 1].push(x); });
        if (segs.length === other.blocks.length && other.blocks.every(x => x.type === 'figure'))
          return segs.flatMap((sg, i) => { const pair = []; pair[ki] = { blocks: sg }; pair[1 - ki] = { blocks: [other.blocks[i]] }; return colsU({ type: 'cols', ratio: idx.map(j => r[j] || 1).join(':'), cols: pair }, mode, Wmm, pitch, st, wem); });
      }
    }
    // 図と発問を左右に置く、などの2段組
    const cu = cols.map((c, k) => ({ k, u: conv(c.blocks, mode, wOf(k), pitch, st, emW(k)) })).filter(x => x.u.length);
    if (!cu.length) return [];
    if (cu.length === 1) return cu[0].u;
    // 列のはじめの学習課題は、横いっぱいにして上に出す（せまい列で折り返さないように）
    const lead = [];
    cu.forEach(x => { while (x.u.length && x.u[0].head) lead.push(x.u.shift()); });
    const rest = cu.filter(x => x.u.length);
    if (rest.length <= 1) return lead.concat(rest.length ? rest[0].u : []);
    return lead.concat([U(`<div class="su su-cols" style="grid-template-columns:${rest.map(x => `minmax(0,${r[idx[x.k]] || 1}fr)`).join(' ')}">${rest.map(x => `<div class="sc">${x.u.map(u => u.html).join('')}</div>`).join('')}</div>`,
      { parts: rest.flatMap(x => x.u), multi: true })]);
  }
  // 場面に分ける：学習課題・問題・練習ごとに新しいスライドから始める（見出しだけが続くときは同じスライド）
  function scenesOf(units) {
    const sc = []; let cur = null;
    units.forEach(u => {
      // 問題文のすぐ前に図や表だけが置いてあるときは、同じ場面にして、問題文を上に出す（あいだに発問などがあったものは別の場面）
      if (u.head && cur && cur.units.length && cur.units.every(x => x.fig || x.tab) && u.bi === cur.units[cur.units.length - 1].bi + 1) { if (u.rc) cur.rc = u.rc; cur.units.unshift(u); return; }
      if (!cur || (u.head && cur.units.some(x => !x.head))) { cur = { units: [], rc: null }; sc.push(cur); }
      if (u.head && u.rc) cur.rc = u.rc;
      cur.units.push(u);
    });
    return sc;
  }

  /* ---------------- スライドに分ける（実際にならべて高さを測る） ---------------- */
  let mEl = null, mBody = null;
  function measurer() {
    if (!mEl) {
      mEl = document.createElement('div'); mEl.setAttribute('aria-hidden', 'true');
      mEl.style.cssText = 'position:absolute;left:-30000px;top:0;visibility:hidden;pointer-events:none';
      mEl.innerHTML = `<section class="sl-slide"><header class="sl-hd"></header><div class="sl-body"></div></section>`;
      document.body.appendChild(mEl); mBody = $('.sl-body', mEl);
    }
    return mEl.firstChild;
  }
  const FH = 15, FH_MIN = 9, FH_MAX = 44;   // 図の高さの上限（字の高さの何倍か）。ふつう15、図が主役のスライドでは入りきるところまで大きくする
  function fits(htmls, fs, fh) {
    const s = measurer(); s.style.setProperty('--fs', fs); s.style.setProperty('--fh', (fh || FH) + 'em');
    mBody.innerHTML = htmls.join('');
    if (mBody.scrollHeight > mBody.clientHeight + 1) return false;
    // 横にはみ出す表・小問もだめ
    return !$$('.su', mBody).some(e => e.scrollWidth > e.clientWidth + 2 || e.getBoundingClientRect().right > mBody.getBoundingClientRect().right + 1);
  }
  function bestFs(htmls, fh) {   // 入りきる中でいちばん大きい倍率（0.05きざみ）。入らなければ null
    const N = Math.round((FS_MAX - FS_MIN) / 0.05);
    if (!fits(htmls, FS_MIN, fh)) return null;
    let lo = 0, hi = N;   // lo は入る
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (fits(htmls, FS_MIN + mid * 0.05, fh)) lo = mid; else hi = mid - 1; }
    return Math.round((FS_MIN + lo * 0.05) * 100) / 100;
  }
  function bestFh(htmls, fs, from) {   // 図を、入りきるところまで大きくする
    let lo = from, hi = FH_MAX;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (fits(htmls, fs, mid)) lo = mid; else hi = mid - 1; }
    return lo;
  }
  // ならべたときの高さ（スライドの高さを1として）
  function heightOf(htmls, fs) {
    const s = measurer(); s.style.setProperty('--fs', fs); s.style.setProperty('--fh', FH + 'em');
    mBody.innerHTML = htmls.join('');
    const a = mBody.firstElementChild, b = mBody.lastElementChild;
    return a ? (b.getBoundingClientRect().bottom - a.getBoundingClientRect().top) / mBody.clientHeight : 0;
  }
  // 1つで1枚に入らない2段組・小問の行は、ばらして縦にならべる
  function expand(units) {
    const out = [];
    units.forEach(u => { if (u.parts && !fits([u.html], 0.75)) out.push(...expand(u.parts)); else out.push(u); });
    return out;
  }
  function paginate(sc) {
    const units = sc.units, pages = [];
    const rcU = sc.rc ? U(sc.rc, { isRc: true }) : null;
    const H = us => us.map(u => u.html), real = us => us.filter(u => !u.isRc);
    // つづきのスライドは、問題文を小さくもう一度出してから始める（それで入らなくなるなら出さない）
    const start = items => {
      if (!rcU || !pages.length || items.some(x => x.head)) return items;
      const withRc = [rcU].concat(items);
      return fits(H(withRc), FS_PACK) || (!fits(H(items), FS_PACK) && fits(H(withRc), 0.75)) ? withRc : items;
    };
    let cur = [];
    units.forEach(u => {
      if (!cur.length) { cur = start([u]); return; }
      const trial = cur.concat(u);
      if (fits(H(trial), FS_PACK)) { cur = trial; return; }
      // 見出しや説明だけのスライドにしない：字を少し小さくすれば入るなら、同じスライドに入れる
      if (real(cur).every(x => x.keep)) { const f = bestFs(H(trial), FH); if (f != null && f >= 0.7) { cur = trial; return; } }
      // あふれた：見出しや説明だけが最後に残らないよう、次のスライドへ送る
      const carry = [];
      while (real(cur).length > 1 && cur[cur.length - 1].keep) carry.unshift(cur.pop());
      pages.push(cur);
      cur = start(carry.concat(u));
    });
    if (real(cur).length) pages.push(cur);
    let pg = pages.filter(p => real(p).length);
    // 最後に少しだけあふれた分（発問1つなど）は、字を少し小さくして前のスライドに入れる（図は小さくしない）
    for (let i = pg.length - 1; i > 0; i--) {
      const tail = real(pg[i]);
      if (tail.some(x => x.head) || heightOf(H(tail), FS_PACK) > 0.3) continue;
      const merged = pg[i - 1].concat(tail);
      if (fits(H(merged), 0.85, FH)) pg.splice(i - 1, 2, merged);
    }
    return pg.map(p => {
      const htmls = H(p), hasFig = p.some(x => x.fig);
      let fh = FH, fs = bestFs(htmls, fh);
      if (fs == null && hasFig) { fh = FH_MIN; fs = bestFs(htmls, fh); }
      if (fs == null) return { html: htmls.join(''), fs: FS_MIN, fh, over: true };
      if (hasFig || p.some(x => x.multi)) fs = Math.min(fs, 1.15);   // 図や段組のあるスライドは、字を大きくしすぎない（せまい列で折り返しがふえるため）
      if (hasFig) fh = bestFh(htmls, fs, fh);                        // そのぶん、図を入りきるところまで大きく
      return { html: htmls.join(''), fs, fh, over: false };
    });
  }

  function build(l, sheet, mode) {
    const u = unitByKey[l.unit] || {}, color = u.color || '#2d3748';
    const hd = `中${u.grade || 1}　${u.name || ''}　第${l.no}時`;
    const Wmm = sheet.paper === 'B5' ? 160 : 186, pitch = num(sheet.pitch, 7);
    const me = (sheet.blocks.find(b => b.type === 'meate' && !b.label) || {}).text || l.title || '';
    const head = `<header class="sl-hd"><span class="u" style="background:${esc(color)}">${esc(hd)}</span><span class="m">${mode === 'full' ? `<b>めあて</b>${inl(me)}` : ''}</span><span class="pg"></span></header>`;
    const wrap = (key, body, fs, fh) => `<section class="sl-slide" data-key="${key}" style="--fs:${fs}${fh ? `;--fh:${fh}em` : ''}">${head}<div class="sl-body">${body}</div></section>`;
    const slides = [];
    if (mode === 'full') {
      const tfs = emOf(me) > 34 ? 0.72 : emOf(me) > 17 ? 0.86 : 1;
      slides.push({ key: 't', kind: 'title', fs: tfs, html: `<section class="sl-slide sl-title" data-key="t" style="--fs:${tfs}"><div class="sl-body">
        <div class="tt-u"><span style="background:${esc(color)}">中${u.grade || 1}　${esc(u.name || '')}</span>第${l.no}時</div>
        ${l.sub ? `<div class="tt-s">${esc(l.sub)}</div>` : ''}<div class="tt-l">めあて</div><div class="tt-m">${inl(me)}</div></div></section>` });
    }
    // bi＝ワークシートの何番目のブロックから来たか（となりどうしかを見るため）
    const cst = { zone: true }, wem = (SW - 100) / (40 * FS_PACK);
    const units = sheet.blocks.flatMap((b, bi) => conv([b], mode, Wmm, pitch, cst, wem).map(u => { u.bi = bi; (u.parts || []).forEach(x => { x.bi = bi; }); return u; }));
    scenesOf(expand(units)).forEach((sc, si) => paginate(sc).forEach((p, pi) => slides.push({ key: si + '-' + pi, kind: 'body', fs: p.fs, fh: p.fh, over: p.over, html: wrap(si + '-' + pi, p.html, p.fs, p.fh) })));
    if (mode === 'full' && l.matome) {
      const li = String(l.matome).split(/(?<=。)/).map(s => s.trim()).filter(Boolean).map(s => `<li class="a rv"><span class="ansx">${inl(s)}</span></li>`).join('');
      const body = `<div class="su su-m"><span class="mh">まとめ</span><ul>${li}</ul></div>`, fs = bestFs([body]);
      slides.push({ key: 'm', kind: 'matome', fs: fs == null ? FS_MIN : fs, over: fs == null, html: wrap('m', body, fs == null ? FS_MIN : fs) });
    }
    return { id: l.id, mode, slides, title: l.title || '', hd, color };
  }

  const cache = new Map();
  async function deck(id, mode) {
    const l = lessonById[id]; if (!l || !window.WSX) return null;
    mode = modeOf(mode);
    const r = await window.WSX.load(id), sig = JSON.stringify(r.sheet.blocks), key = id + '|' + mode, c = cache.get(key);
    if (c && c.sig === sig) return c.deck;
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* フォントが読めなくても続ける */ } }
    const d = build(l, r.sheet, mode);
    cache.set(key, { sig, deck: d });
    if (cache.size > 40) cache.delete(cache.keys().next().value);
    return d;
  }

  /* ---------------- 使わないスライド・見た目の設定（このブラウザに保存） ---------------- */
  const LS = 'hyojunNavi.sl.';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(LS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) { /* 保存できなくても表示は続ける */ } }
  };
  const hiddenOf = (id, mode) => new Set(store.get(`hide.${id}.${mode}`, []));
  const setHidden = (id, mode, set) => store.set(`hide.${id}.${mode}`, [...set]);

  // スライドの小さい見本（.sl-th の幅に合わせて縮める）
  const thumbHTML = (s, i, cls) => `<button type="button" class="sl-th${cls ? ' ' + cls : ''}" data-i="${i}" title="このスライドを開く">${s.html}<span class="n">${i + 1}</span></button>`;
  function fitThumbs(root) {
    const set = () => $$('.sl-th', root).forEach(t => { if (t.clientWidth) t.style.setProperty('--k', (t.clientWidth / SW).toFixed(4)); });
    set();
    if (window.ResizeObserver) { const ro = new ResizeObserver(set); ro.observe(root); }
  }
  const markPages = (root) => $$('.sl-slide', root).forEach(el => { const p = $('.pg', el); if (p) p.textContent = ''; });

  /* ---------------- 授業ナビの「スライド」タブ ---------------- */
  const paneHTML = l => `<div class="sl-tab" data-sl="${esc(l.id)}"><p class="muted small">読み込み中…</p></div>`;
  function fillPane(el, l) {
    if (!el) return;
    if (!window.WSX || !window.WSX.inl) { el.innerHTML = '<div class="soon">スライドを読み込めませんでした。</div>'; return; }
    let mode = 'full', done = false;
    const draw = async () => {
      const [df, dc] = [await deck(l.id, 'full'), await deck(l.id, 'core')];
      if (!el.isConnected || !df) return;
      const d = mode === 'core' ? dc : df, hid = hiddenOf(l.id, mode);
      el.innerHTML = `<div class="sl-tbar">
          <a class="nbtn pri" href="#/sl/${esc(l.id)}">▶ スライドだけで授業（${df.slides.length - hiddenOf(l.id, 'full').size}枚）</a>
          <a class="nbtn pri" href="#/sl/${esc(l.id)}/core" style="background:#0e7a6b;border-color:#0e7a6b">▶ 板書と使う：図・問題だけ（${dc.slides.length - hiddenOf(l.id, 'core').size}枚）</a>
          <span class="sp"></span>
          <a class="nbtn" href="${esc(location.pathname)}#/sl/${esc(l.id)}${mode === 'core' ? '/core' : ''}" target="_blank" rel="noopener" title="電子黒板の画面へ動かせる別のウィンドウで開きます">別のウィンドウで開く</a>
        </div>
        <div class="sl-tbar"><span class="sl-seg"><button type="button" data-m="full" class="${mode === 'full' ? 'on' : ''}">スライドだけで授業</button><button type="button" data-m="core" class="${mode === 'core' ? 'on' : ''}">板書と使う</button></span>
          <label class="ck"><input type="checkbox" data-slans>答えを表示</label></div>
        <div class="sl-grid">${d.slides.map((s, i) => thumbHTML(s, i, hid.has(s.key) ? 'off' : '')).join('')}</div>
        <p class="sl-note">${mode === 'core' ? '黒板に書きにくいもの（問題文・図・グラフ・表・数直線）だけを大きく映します。めあて・発問・まとめは黒板に書く想定です。' : 'ノート型ワークシートと同じ問題・同じ空らんを、順に映します。発問の答えと空らんは、▶（→キー）か、その場所をさわると1つずつ出ます。'}
          スライドは、この時間のノート型ワークシートから自動で組み立てています（ワークシートを編集して保存すると、スライドにも反映されます）。うすいスライドは「使わない」にしたものです（一覧で切りかえ）。</p>`;
      markPages(el); fitThumbs($('.sl-grid', el));
      $$('.sl-seg button', el).forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; draw(); }));
      $('[data-slans]', el).addEventListener('change', e => $('.sl-grid', el).classList.toggle('sl-all', e.target.checked));
      $$('.sl-th', el).forEach(t => t.addEventListener('click', () => { location.hash = `#/sl/${l.id}/${mode}/${+t.dataset.i + 1}`; }));
    };
    // タブを開いたとき（幅が決まったとき）に組み立てる
    const go = () => { if (done || !el.isConnected || !el.clientWidth) return; done = true; draw(); };
    go();
    if (!done && window.ResizeObserver) { const ro = new ResizeObserver(() => { go(); if (done) ro.disconnect(); }); ro.observe(el); }
  }

  /* ---------------- スライドの画面 ---------------- */
  const st = { id: null, mode: 'full', deck: null, i: 0, rev: {}, ink: {}, pen: false, tool: 'pen', color: '#e11d48', black: false, blank: false, timer: null };
  let wrap = null, stage, slot, canvas, ctx, bar, over, area;
  const PEN_COLORS = [['#e11d48', '赤'], ['#2563eb', '青'], ['#111827', '黒'], ['#f59e0b', '黄']];

  function ensureUI() {
    if (wrap) return;
    wrap = document.createElement('div');
    wrap.id = 'slWrap'; wrap.className = 'sl-wrap'; wrap.hidden = true;
    wrap.innerHTML = `
      <div class="sl-area" id="slArea">
        <div class="sl-stage" id="slStage"><div id="slSlot"></div><canvas class="sl-ink" id="slInk" width="${SW * 2}" height="${SH * 2}"></canvas>
          <div class="sl-timer" id="slTimer" hidden title="さわると止まります"></div><div class="sl-black" id="slBlack" hidden></div></div>
        <div class="sl-msg" id="slMsg" hidden></div>
        <div class="sl-over" id="slOver" hidden></div>
      </div>
      <div class="sl-bar" id="slBar">
        <button type="button" data-a="close" title="授業ナビにもどる（Esc）">✕ とじる</button>
        <button type="button" data-a="over" title="スライドの一覧（G）">☰ 一覧</button>
        <span class="sep"></span>
        <button type="button" class="nav" data-a="prev" title="もどる（←）">◀</button>
        <span class="pos" id="slPos"></span>
        <button type="button" class="nav" data-a="next" title="すすむ（→・スペース）">▶</button>
        <span class="sep"></span>
        <button type="button" data-a="all" title="このスライドの答えをぜんぶ出す／かくす（A）">答え ぜんぶ</button>
        <button type="button" data-a="pen" title="画面に書きこむ（P）">✎ ペン</button>
        <span class="sl-pens">${PEN_COLORS.map(([c, n]) => `<button type="button" class="c" data-c="${c}" title="${n}"><i style="--c:${c}"></i></button>`).join('')}
          <button type="button" data-a="erase" title="なぞった線を消す">消しゴム</button><button type="button" data-a="clear" title="このスライドの書きこみを全部消す">全部消す</button></span>
        <button type="button" data-a="blank" title="白紙を出して、ペンで自由に書く（W）。もう一度おすとスライドにもどる">白紙</button>
        <button type="button" data-a="timer" title="タイマー（T）">⏱</button>
        <span class="sp"></span>
        <button type="button" data-a="mode" title="スライドだけで授業 ⇄ 板書と使う（M）"></button>
        <button type="button" data-a="theme" title="白い画面 ⇄ 黒板の色">黒板色</button>
        <button type="button" data-a="full" title="全画面（F）">⛶ 全画面</button>
      </div>`;
    document.body.appendChild(wrap);
    area = $('#slArea', wrap); stage = $('#slStage', wrap); slot = $('#slSlot', wrap); canvas = $('#slInk', wrap); bar = $('#slBar', wrap); over = $('#slOver', wrap);
    ctx = canvas.getContext('2d'); ctx.scale(2, 2); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    bind();
  }
  const fit = () => { if (wrap && !wrap.hidden) stage.style.setProperty('--s', Math.min(area.clientWidth / SW, area.clientHeight / SH).toFixed(4)); };
  const visible = () => { const h = hiddenOf(st.id, st.mode); return st.deck ? st.deck.slides.map((s, i) => i).filter(i => !h.has(st.deck.slides[i].key)) : []; };
  // 白紙のときは、スライドごとの「白紙」を1枚ずつ持つ（書きこみは、そのスライドの白紙に残る）
  const curSlide = () => { const s = st.deck && st.deck.slides[st.i]; return s && st.blank ? { key: s.key + '#w', kind: 'blank', html: `<section class="sl-slide" data-key="w" style="--fs:1"><header class="sl-hd"><span class="u" style="background:${esc(st.deck.color)}">${esc(st.deck.hd)}</span><span class="m"></span><span class="pg"></span></header><div class="sl-body"></div></section>` } : s; };
  const steps = () => $$('.rv', slot);
  const revSet = () => { const s = curSlide(); if (!s) return new Set(); return st.rev[s.key] || (st.rev[s.key] = new Set()); };

  function open(id, mode, n) {
    const l = lessonById[id];
    if (!l || !window.WSX || !window.WSX.inl) { location.hash = '#/plan'; return; }
    ensureUI();
    mode = modeOf(mode);
    const same = st.id === id && st.mode === mode && st.deck;
    wrap.hidden = false; document.body.classList.add('sl-open'); document.body.style.overflow = 'hidden';
    wrap.classList.toggle('sl-dark', !!store.get('dark', false));
    $('[data-a="theme"]', bar).classList.toggle('on', !!store.get('dark', false));
    fit();
    const at = d => { const v = visible(), want = Math.max(1, parseInt(n, 10) || 0); return n && d.slides[want - 1] ? want - 1 : (same ? st.i : (v[0] || 0)); };
    if (same) { st.i = at(st.deck); show(); return; }
    if (st.id !== id) { st.rev = {}; st.ink = {}; }
    Object.assign(st, { id, mode, deck: null, i: 0, blank: false });
    slot.innerHTML = ''; $('#slMsg', wrap).hidden = false; $('#slMsg', wrap).textContent = 'スライドを組み立てています…';
    deck(id, mode).then(d => {
      if (st.id !== id || st.mode !== mode || wrap.hidden) return;
      st.deck = d; $('#slMsg', wrap).hidden = true;
      st.i = at(d); show();
      if (/^printa?$/.test(String(n))) preparePrint(n === 'printa');   // #/sl/<ID>/<使い方>/print：印刷の形にして開く（そのまま ⌘P でPDFにできる）
    });
  }
  function close() {
    if (!wrap || wrap.hidden) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    stopTimer(); closePop();
    wrap.hidden = true; over.hidden = true;
    document.body.classList.remove('sl-open'); document.body.style.overflow = '';
  }
  function show() {
    const s = curSlide(); if (!s) { slot.innerHTML = ''; $('#slMsg', wrap).hidden = false; $('#slMsg', wrap).textContent = 'この時間のスライドはありません。'; paintBar(); return; }
    $('#slMsg', wrap).hidden = true;
    slot.innerHTML = s.html;
    $$('.bl', slot).forEach(b => { if (!b.parentElement.closest('.rv')) b.classList.add('rv'); });
    const v = visible(), k = v.indexOf(st.i), pg = $('.pg', slot);
    if (pg) pg.textContent = st.blank ? '白紙' : `${k >= 0 ? k + 1 : '–'} / ${v.length}`;
    const set = revSet();
    steps().forEach((e, j) => e.classList.toggle('on', set.has(j)));
    redraw(); paintBar();
    try { history.replaceState(null, '', `#/sl/${st.id}/${st.mode}/${st.i + 1}`); } catch (e) { /* 書きかえられない環境では何もしない */ }
  }
  function paintBar() {
    const v = visible(), k = v.indexOf(st.i), n = steps().length, done = revSet().size;
    $('#slPos', wrap).innerHTML = `${k >= 0 ? k + 1 : '–'} / ${v.length}<small>${n ? `答え ${Math.min(done, n)}／${n}` : '　'}</small>`;
    $('[data-a="mode"]', bar).textContent = st.mode === 'core' ? '板書と使う ⇄' : 'スライドだけ ⇄';
    $('[data-a="pen"]', bar).classList.toggle('on', st.pen);
    $('[data-a="blank"]', bar).classList.toggle('on', st.blank);
    $('[data-a="erase"]', bar).classList.toggle('on', st.tool === 'erase');
    $$('.sl-pens .c', bar).forEach(b => b.classList.toggle('on', st.tool === 'pen' && b.dataset.c === st.color));
    wrap.classList.toggle('pen', st.pen);
    $('[data-a="prev"]', bar).disabled = !st.deck || (k <= 0 && !done);
    $('[data-a="next"]', bar).disabled = !st.deck || (k >= v.length - 1 && done >= n);
    fit();   // ペンの道具が出てバーが2段になったときも、スライドの大きさを合わせ直す
  }
  function go(i, allRev) {
    if (!st.deck || !st.deck.slides[i]) return;
    st.i = i; st.blank = false;
    if (allRev) { const s = curSlide(); slot.innerHTML = s.html; $$('.bl', slot).forEach(b => { if (!b.parentElement.closest('.rv')) b.classList.add('rv'); }); st.rev[s.key] = new Set(steps().map((e, j) => j)); }
    show();
  }
  function next(skip) {
    if (!st.deck) return;
    if (st.blank) { st.blank = false; show(); return; }
    const els = steps(), set = revSet();
    if (!skip) { const j = els.findIndex((e, k) => !set.has(k)); if (j >= 0) { set.add(j); els[j].classList.add('on'); paintBar(); return; } }
    const v = visible(), k = v.indexOf(st.i), t = k < 0 ? v.find(x => x > st.i) : v[k + 1];
    if (t != null) go(t);
  }
  function prev(skip) {
    if (!st.deck) return;
    if (st.blank) { st.blank = false; show(); return; }
    const els = steps(), set = revSet();
    if (!skip && set.size) { const j = Math.max(...set); set.delete(j); if (els[j]) els[j].classList.remove('on'); paintBar(); return; }
    const v = visible(), k = v.indexOf(st.i), t = k < 0 ? [...v].reverse().find(x => x < st.i) : v[k - 1];
    if (t != null) go(t, !skip);
  }
  function toggleAll() {
    const els = steps(), set = revSet(), on = set.size < els.length;
    set.clear(); if (on) els.forEach((e, j) => set.add(j));
    els.forEach(e => e.classList.toggle('on', on)); paintBar();
  }

  /* ---- ペン（スライドごとに覚えておく。別の時間を開くと消える） ---- */
  const inkOf = () => { const s = curSlide(); if (!s) return []; return st.ink[s.key] || (st.ink[s.key] = []); };
  function drawStroke(k) {
    if (!k.pts.length) return;
    ctx.strokeStyle = k.c; ctx.lineWidth = k.w; ctx.beginPath(); ctx.moveTo(k.pts[0][0], k.pts[0][1]);
    if (k.pts.length === 1) ctx.lineTo(k.pts[0][0] + 0.1, k.pts[0][1]);
    for (let i = 1; i < k.pts.length; i++) ctx.lineTo(k.pts[i][0], k.pts[i][1]);
    ctx.stroke();
  }
  function redraw() { if (!ctx) return; ctx.clearRect(0, 0, SW, SH); inkOf().forEach(drawStroke); }
  function bindInk() {
    let cur = null;
    const pos = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * SW / r.width, (e.clientY - r.top) * SH / r.height]; };
    const erase = p => { const a = inkOf(), n = a.length; for (let i = a.length - 1; i >= 0; i--) if (a[i].pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 18)) a.splice(i, 1); if (a.length !== n) redraw(); };
    canvas.addEventListener('pointerdown', e => {
      if (!st.pen) return; e.preventDefault(); canvas.setPointerCapture(e.pointerId);
      const p = pos(e);
      if (st.tool === 'erase') { cur = { erase: true }; erase(p); return; }
      cur = { c: st.color, w: 5, pts: [p] }; inkOf().push(cur); drawStroke(cur);
    });
    canvas.addEventListener('pointermove', e => {
      if (!cur) return; const p = pos(e);
      if (cur.erase) { erase(p); return; }
      const q = cur.pts[cur.pts.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5) return;
      cur.pts.push(p);
      ctx.strokeStyle = cur.c; ctx.lineWidth = cur.w; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
    });
    const end = () => { cur = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  }

  /* ---- タイマー ---- */
  let pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function timerMenu(btn) {
    if (pop) { closePop(); return; }
    pop = document.createElement('div'); pop.className = 'sl-pop';
    pop.innerHTML = [1, 2, 3, 5, 10].map(m => `<button type="button" data-min="${m}">${m}分</button>`).join('') + '<button type="button" data-min="0">止める</button>';
    const r = btn.getBoundingClientRect(), a = area.getBoundingClientRect();
    area.appendChild(pop);
    pop.style.left = Math.max(8, Math.min(a.width - pop.offsetWidth - 8, r.left - a.left - pop.offsetWidth / 2 + r.width / 2)) + 'px'; pop.style.bottom = '10px';
    pop.addEventListener('click', e => { const b = e.target.closest('[data-min]'); if (!b) return; const m = +b.dataset.min; closePop(); if (m) startTimer(m * 60); else stopTimer(); });
  }
  function beep() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      [0, 0.28, 0.56].forEach(t => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(0.15, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.22); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.24); });
      setTimeout(() => ac.close(), 1500);
    } catch (e) { /* 音が出せない環境では表示だけ */ }
  }
  function startTimer(sec) {
    stopTimer();
    const el = $('#slTimer', wrap), end = Date.now() + sec * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      if (left <= 0 && !el.classList.contains('end')) { el.classList.add('end'); beep(); clearInterval(st.timer); st.timer = null; }
    };
    el.hidden = false; el.classList.remove('end'); tick(); st.timer = setInterval(tick, 250);
  }
  function stopTimer() { if (st.timer) clearInterval(st.timer); st.timer = null; if (wrap) { const el = $('#slTimer', wrap); el.hidden = true; el.classList.remove('end'); } }

  /* ---- 一覧 ---- */
  function showOver() {
    if (!st.deck) return;
    const l = lessonById[st.id], hid = hiddenOf(st.id, st.mode);
    const seq = (D.lessons || []).filter(x => (unitByKey[x.unit] || {}).grade === (unitByKey[l.unit] || {}).grade || (!(unitByKey[x.unit] || {}).grade && !(unitByKey[l.unit] || {}).grade));
    const order = (D.units || []).map(u => u.key);
    seq.sort((a, b) => order.indexOf(a.unit) - order.indexOf(b.unit) || a.no - b.no);
    const gi = seq.indexOf(l), pv = seq[gi - 1], nx = seq[gi + 1];
    over.innerHTML = `<div class="oh"><h2>${esc(st.deck.hd)}「${esc(st.deck.title)}」</h2><span class="sp"></span>
        ${pv ? `<a class="nbtn" href="#/sl/${pv.id}/${st.mode}">◀ 前の時間</a>` : ''}${nx ? `<a class="nbtn" href="#/sl/${nx.id}/${st.mode}">次の時間 ▶</a>` : ''}
        <button type="button" class="nbtn pri" data-o="back">スライドにもどる</button></div>
      <div class="oh"><span class="sl-seg"><button type="button" data-om="full" class="${st.mode === 'full' ? 'on' : ''}">スライドだけで授業</button><button type="button" data-om="core" class="${st.mode === 'core' ? 'on' : ''}">板書と使う（図・問題だけ）</button></span>
        <span class="sp"></span><button type="button" class="nbtn" data-o="print">PDF・印刷（答えなし）</button><button type="button" class="nbtn" data-o="printa">PDF・印刷（答えつき）</button></div>
      <p>スライドをおすと、そのスライドを映します。授業で使わないスライドは、下の「✓ 授業で使う」をおして外せます（このブラウザに覚えます）。</p>
      <div class="sl-ogrid">${st.deck.slides.map((s, i) => `<div class="sl-oc${hid.has(s.key) ? ' off' : ''}" data-k="${esc(s.key)}">${thumbHTML(s, i, (hid.has(s.key) ? 'off' : '') + (i === st.i ? ' cur' : ''))}<button type="button" class="use" title="おすと、授業で使う／使わないを切りかえます">${hid.has(s.key) ? '✕ 使わない' : '✓ 授業で使う'}</button></div>`).join('')}</div>`;
    over.hidden = false; markPages(over); fitThumbs($('.sl-ogrid', over));
  }
  function bindOver() {
    over.addEventListener('click', e => {
      const use = e.target.closest('.use');
      if (use) {
        const oc = use.closest('.sl-oc'), hid = hiddenOf(st.id, st.mode), k = oc.dataset.k;
        if (hid.has(k)) hid.delete(k); else if (st.deck.slides.length - hid.size > 1) hid.add(k);
        setHidden(st.id, st.mode, hid); showOver();
        if (hid.has((curSlide() || {}).key)) { const v = visible(); st.i = v.find(x => x > st.i) != null ? v.find(x => x > st.i) : v[v.length - 1]; }
        show(); return;
      }
      const th = e.target.closest('.sl-th'); if (th) { over.hidden = true; go(+th.dataset.i); return; }
      const om = e.target.closest('[data-om]'); if (om) { over.hidden = true; location.hash = `#/sl/${st.id}/${om.dataset.om}`; return; }
      const o = e.target.closest('[data-o]'); if (!o) return;
      if (o.dataset.o === 'back') over.hidden = true;
      if (o.dataset.o === 'print' || o.dataset.o === 'printa') print(o.dataset.o === 'printa');
    });
  }

  /* ---- PDF・印刷（1枚＝1ページ） ---- */
  function preparePrint(withAns) {
    if (!st.deck) return null;
    let box = document.getElementById('slPrint'); if (!box) { box = document.createElement('div'); box.id = 'slPrint'; document.body.appendChild(box); }
    let css = document.getElementById('slPageCSS'); if (!css) { css = document.createElement('style'); css.id = 'slPageCSS'; document.head.appendChild(css); }
    css.textContent = `@page{size:${SW}px ${SH}px;margin:0}`;
    const v = visible();
    box.className = withAns ? 'sl-all' : '';
    box.innerHTML = v.map(i => st.deck.slides[i].html).join('');
    $$('.sl-slide', box).forEach((el, k) => { const p = $('.pg', el); if (p) p.textContent = `${k + 1} / ${v.length}`; });
    document.body.classList.add('sl-print');
    return () => { document.body.classList.remove('sl-print'); box.innerHTML = ''; css.remove(); };
  }
  function print(withAns) {
    const undo = preparePrint(withAns); if (!undo) return;
    const done = () => { undo(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 60);
  }

  function bind() {
    bindInk(); bindOver();
    bar.addEventListener('click', e => {
      const c = e.target.closest('.sl-pens .c'); if (c) { st.tool = 'pen'; st.color = c.dataset.c; paintBar(); return; }
      const b = e.target.closest('[data-a]'); if (!b) return;
      act(b.dataset.a, b);
    });
    // 答え・空らんは、その場所をさわっても出せる
    slot.addEventListener('click', e => {
      const t = e.target.closest('.rv'); if (!t || !slot.contains(t)) return;
      const j = steps().indexOf(t), set = revSet(); if (j < 0) return;
      if (set.has(j)) set.delete(j); else set.add(j);
      t.classList.toggle('on', set.has(j)); paintBar();
    });
    $('#slTimer', wrap).addEventListener('click', stopTimer);
    $('#slBlack', wrap).addEventListener('click', () => act('black'));
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', () => { fit(); if (wrap) $('[data-a="full"]', bar).classList.toggle('on', !!document.fullscreenElement); });
    document.addEventListener('keydown', e => {
      if (!wrap || wrap.hidden) return;
      if (e.target.matches && e.target.matches('input,textarea,select')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      const map = { ArrowRight: 'next', ' ': 'next', Enter: 'next', PageDown: 'next', ArrowLeft: 'prev', PageUp: 'prev', Backspace: 'prev', ArrowDown: 'nexts', ArrowUp: 'prevs',
        a: 'all', A: 'all', w: 'blank', W: 'blank', g: 'over', G: 'over', f: 'full', F: 'full', p: 'pen', P: 'pen', b: 'black', B: 'black', '.': 'black', m: 'mode', M: 'mode', t: 'timer', T: 'timer', Escape: 'esc', Home: 'home', End: 'end' };
      const a = map[k]; if (!a) return;
      e.preventDefault(); e.stopPropagation();
      act(a);
    }, true);
  }
  function act(a, btn) {
    if (a !== 'timer') closePop();
    if (a === 'esc') { if (!over.hidden) over.hidden = true; else if (st.black) act('black'); else if (st.pen) act('pen'); else if (document.fullscreenElement) document.exitFullscreen(); else act('close'); return; }
    if (a === 'close') { location.hash = `#/lesson/${st.id}/sl`; return; }
    if (a === 'over') { if (over.hidden) showOver(); else over.hidden = true; return; }
    if (!over.hidden && a !== 'full' && a !== 'theme') return;
    if (a === 'next') next(); else if (a === 'prev') prev();
    else if (a === 'nexts') next(true); else if (a === 'prevs') prev(true);
    else if (a === 'home') { const v = visible(); if (v.length) go(v[0]); }
    else if (a === 'end') { const v = visible(); if (v.length) go(v[v.length - 1]); }
    else if (a === 'all') toggleAll();
    else if (a === 'pen') { st.pen = !st.pen; if (st.pen) st.tool = 'pen'; paintBar(); }
    else if (a === 'erase') { st.tool = st.tool === 'erase' ? 'pen' : 'erase'; paintBar(); }
    else if (a === 'clear') { const s = curSlide(); if (s) st.ink[s.key] = []; redraw(); }
    else if (a === 'black') { st.black = !st.black; $('#slBlack', wrap).hidden = !st.black; }
    else if (a === 'blank') { st.blank = !st.blank; if (st.blank) { st.pen = true; st.tool = 'pen'; } show(); }
    else if (a === 'timer') timerMenu(btn || $('[data-a="timer"]', bar));
    else if (a === 'mode') location.hash = `#/sl/${st.id}/${st.mode === 'core' ? 'full' : 'core'}`;
    else if (a === 'theme') { const d = !store.get('dark', false); store.set('dark', d); wrap.classList.toggle('sl-dark', d); $('[data-a="theme"]', bar).classList.toggle('on', d); }
    else if (a === 'full') { if (document.fullscreenElement) document.exitFullscreen(); else if (wrap.requestFullscreen) wrap.requestFullscreen().catch(() => {}); }
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => cache.clear());
  window.SLX = { open, close, isOpen: () => !!(wrap && !wrap.hidden), paneHTML, fillPane, deck, MODES, _t: { figBad, figAt, figSet, figTrim },
    state: () => ({ id: st.id, mode: st.mode, i: st.i, n: st.deck ? st.deck.slides.length : 0 }) };
})();
