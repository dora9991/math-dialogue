/* minibasket/js/charts.js
   グラフ（SVG）を文字列で作る。幅(W)を受け取るので、画面幅が変わるたびに描き直せる（スマホでも文字が潰れない）。
   決まり：棒は太さ24px以内・データ側の先端だけ4px丸め／隣り合う塗りの間は2pxの隙間／線は2px／丸い印は直径8px以上で2pxの縁／
          格子は実線の細線／数字は先端にだけ／文字は文字色トークン（データの色は印にだけ）／全部の印に tooltip（data-tip）と表の写し。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MB = Object.assign(root.MB || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sgn = n => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '±0');
  const f1 = n => (Math.round(n * 10) / 10).toString();
  /** 文字の幅のおおよそ（全角=1、半角=0.56） */
  const tw = (s, size) => [...String(s)].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? 1 : 0.56), 0) * (size || 12);
  const niceMax = m => { if (m <= 5) return 5; const p = Math.pow(10, Math.floor(Math.log10(m))); const b = [1, 2, 2.5, 5, 10].find(x => x * p >= m); return b * p; };
  const ticks = max => { const s = max / 2; return [0, s, max].map(v => Math.round(v * 10) / 10); };
  const tip = lines => ` data-tip="${esc(lines.join('\n'))}" tabindex="0" role="img" aria-label="${esc(lines.join('、'))}"`;

  /** 縦棒（先端だけ丸め） */
  const vbar = (x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h)); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; };
  /** 横棒：x=基準線、右へ伸びる（右端だけ丸め） */
  const hbarR = (x, y, w, h, r) => { r = Math.max(0, Math.min(r, h / 2, w)); return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`; };
  /** 横棒：x=基準線、左へ伸びる（左端だけ丸め） */
  const hbarL = (x, y, w, h, r) => { r = Math.max(0, Math.min(r, h / 2, w)); return `M${x},${y}H${x - w + r}Q${x - w},${y} ${x - w},${y + r}V${y + h - r}Q${x - w},${y + h} ${x - w + r},${y + h}H${x}Z`; };

  const legend = items => `<div class="legend">${items.map(i => `<span><i class="${i.cls || ''}" style="background:${i.color}"></i>${esc(i.label)}</span>`).join('')}</div>`;

  /** 2系列の縦棒グラフ（ピリオドごとの得点／ファウルなど）。値に幅(lo〜hi)があるときは薄い延長で示す */
  function groupedBars(o) {
    const W = Math.max(280, o.W || 640), H = 226, ml = 30, mr = 6, mt = 26, mb = 50;
    const n = o.groups.length;
    const top = Math.max(1, ...o.groups.flatMap(g => [g.a.hi != null ? g.a.hi : g.a.v, g.b.hi != null ? g.b.hi : g.b.v]));
    const maxV = niceMax(top);
    const y = v => mt + (H - mt - mb) * (1 - v / maxV);
    const gw = (W - ml - mr) / n, bw = Math.min(24, gw * 0.3), gap = 2;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.title || '')}">`;
    ticks(maxV).forEach(t => { s += `<line class="${t === 0 ? 'axis' : 'grid'}" x1="${ml}" x2="${W - mr}" y1="${y(t)}" y2="${y(t)}"/><text class="mute" x="${ml - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`; });
    o.groups.forEach((g, i) => {
      const cx = ml + gw * i + gw / 2;
      [[g.a, 'var(--me)', cx - bw - gap / 2, o.aName], [g.b, 'var(--opp)', cx + gap / 2, o.bName]].forEach(([d, color, x, nm]) => {
        const h = Math.max(0, y(0) - y(d.v));
        const ranged = d.hi != null && d.hi > d.v;
        if (ranged) s += `<path d="${vbar(x, y(d.hi), bw, y(0) - y(d.hi), 4)}" fill="${color}" opacity=".28"/>`;
        s += `<path d="${vbar(x, y(d.v), bw, h, 4)}" fill="${color}"${tip([`${d.text != null ? d.text : d.v}${o.unit || ''}`, `${g.label}　${nm}`, ...(d.extra || [])])}/>`;
        const lab = d.text != null ? d.text : d.v;
        s += `<text class="v" x="${x + bw / 2}" y="${y(ranged ? d.hi : d.v) - 6}" text-anchor="middle">${esc(lab)}</text>`;
      });
      s += `<text class="lbl" x="${cx}" y="${H - mb + 18}" text-anchor="middle">${esc(g.label)}</text>`;
      if (g.sub != null) s += `<text class="v" x="${cx}" y="${H - mb + 36}" text-anchor="middle">${esc(g.sub)}</text>`;
    });
    if (o.subLabel) s += `<text class="mute" x="${ml - 6}" y="${H - mb + 36}" text-anchor="end">${esc(o.subLabel)}</text>`;
    s += '</svg>';
    return legend([{ label: o.aName, color: 'var(--me)' }, { label: o.bName, color: 'var(--opp)' }]) + s;
  }

  /** ピリオド終了ごとの点差（自チーム目線）の折れ線。点は5つだけ（ピリオド内の前後関係は記録がない）。縦軸は 0 を含む範囲だけ */
  function marginLine(o) {
    const W = Math.max(280, o.W || 640), H = 200, ml = 34, mr = 30, mt = 24, mb = 36;
    const pts = o.points; // [{label, v, tip:[...]}]
    const mx = Math.max(0, ...pts.map(p => p.v)), mn = Math.min(0, ...pts.map(p => p.v));
    let hi = mx > 0 ? niceMax(mx) : 0, lo = mn < 0 ? -niceMax(-mn) : 0;
    if (hi === 0 && lo === 0) { hi = 5; lo = -5; }
    const x = i => ml + (W - ml - mr) * (i / (pts.length - 1));
    const y = v => mt + (H - mt - mb) * (1 - (v - lo) / (hi - lo));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.title || '')}">`;
    [...new Set([lo, ...(lo < 0 && hi > 0 ? [0] : []), hi, 0])].sort((a, b) => a - b).forEach(t => { s += `<line class="${t === 0 ? 'axis' : 'grid'}" x1="${ml}" x2="${W - mr}" y1="${y(t)}" y2="${y(t)}"/><text class="mute" x="${ml - 6}" y="${y(t) + 4}" text-anchor="end">${sgn(t)}</text>`; });
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.v)}`).join('');
    s += `<path d="${path}L${x(pts.length - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="var(--me)" opacity=".10"/>`;
    s += `<path d="${path}" fill="none" stroke="var(--me)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach((p, i) => {
      s += `<text class="lbl" x="${x(i)}" y="${H - mb + 20}" text-anchor="${i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}">${esc(p.label)}</text>`;
      s += `<circle cx="${x(i)}" cy="${y(p.v)}" r="4.5" fill="var(--me)" stroke="var(--surface)" stroke-width="2"/><circle cx="${x(i)}" cy="${y(p.v)}" r="14" fill="transparent"${tip(p.tip)}/>`;
      if (i > 0) s += `<text class="v" x="${x(i)}" y="${y(p.v) + (p.v >= 0 ? -11 : 19)}" text-anchor="middle">${sgn(p.v)}</text>`;
    });
    s += '</svg>';
    return s;
  }

  /** 選手ごとの得点を、フリースロー・2点・3点の積み上げ横棒で（点が大きいほど濃い青） */
  function kindsBar(o) {
    const rows = o.rows; // [{label, ft, fg, tp, ftN, fgN, tpN, total}]
    const W = Math.max(280, o.W || 640), rh = 28, mt = 6, mb = 8;
    const labW = Math.min(150, Math.max(70, Math.max(...rows.map(r => tw(r.label, 13))) + 12)), mr = 34;
    const H = mt + rows.length * rh + mb;
    const max = Math.max(1, ...rows.map(r => r.total));
    const sc = v => (W - labW - mr) * (v / max);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.title || '')}">`;
    s += `<line class="axis" x1="${labW}" x2="${labW}" y1="${mt}" y2="${H - mb}"/>`;
    rows.forEach((r, i) => {
      const y0 = mt + i * rh + 5, h = 18;
      s += `<text class="lbl" x="${labW - 8}" y="${y0 + 13}" text-anchor="end">${esc(r.label)}</text>`;
      let x = labW;
      const segs = [['ft', r.ft, 'var(--k-ft)', 'フリースロー', r.ftN, '1点'], ['fg', r.fg, 'var(--k-fg)', '2点シュート', r.fgN, '2点'], ['tp', r.tp, 'var(--k-3p)', '3点シュート', r.tpN, '3点']].filter(sg => sg[1] > 0);
      segs.forEach((sg, k) => {
        const w = sc(sg[1]), last = k === segs.length - 1;
        const dw = Math.max(1, w - (last ? 0 : 2));
        s += `<path d="${last ? hbarR(x, y0, dw, h, 4) : `M${x},${y0}h${dw}v${h}h${-dw}Z`}" fill="${sg[2]}"${tip([`${sg[1]}点`, `${r.label}　${sg[3]} ${sg[4]}本(各${sg[5]})`, `合計 ${r.total}点`])}/>`;
        x += w;
      });
      s += `<text class="v" x="${x + 6}" y="${y0 + 13}">${r.total}</text>`;
    });
    s += '</svg>';
    return legend([{ label: 'フリースロー（●）', color: 'var(--k-ft)' }, { label: '2点シュート（／）', color: 'var(--k-fg)' }, { label: '3点シュート（○）', color: 'var(--k-3p)' }]) + s;
  }

  /** プラスマイナス（出場したピリオドの得失点差の合計）の左右に伸びる横棒。青=プラス、赤=マイナス */
  function plusMinus(o) {
    const rows = o.rows; // [{label, v, approx, q}]
    const W = Math.max(280, o.W || 640), rh = 28, mt = 6, mb = 8;
    const labW = Math.min(150, Math.max(70, Math.max(...rows.map(r => tw(r.label, 13))) + 12));
    const H = mt + rows.length * rh + mb;
    const ext = niceMax(Math.max(5, ...rows.map(r => Math.abs(r.v))));
    const cx0 = labW + (W - labW - 8) / 2, half = (W - labW - 8) / 2 - 34;
    const sc = v => half * (Math.abs(v) / ext);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.title || '')}">`;
    s += `<line class="axis" x1="${cx0}" x2="${cx0}" y1="${mt}" y2="${H - mb}"/>`;
    rows.forEach((r, i) => {
      const y0 = mt + i * rh + 5, h = 18;
      s += `<text class="lbl" x="${labW - 8}" y="${y0 + 13}" text-anchor="end">${esc(r.label)}</text>`;
      const w = Math.max(r.v === 0 ? 0 : 1, sc(r.v));
      const t = tip([`${sgn(r.v)}`, `${r.label}　出場${r.q}ピリオドの得失点差の合計`, ...(r.approx ? ['交代の印があるため参考値'] : [])]);
      if (r.v > 0) s += `<path d="${hbarR(cx0, y0, w, h, 4)}" fill="var(--pos)"${r.approx ? ' opacity=".55"' : ''}${t}/>`;
      else if (r.v < 0) s += `<path d="${hbarL(cx0, y0, w, h, 4)}" fill="var(--neg)"${r.approx ? ' opacity=".55"' : ''}${t}/>`;
      else s += `<rect x="${cx0 - 1}" y="${y0}" width="2" height="${h}" fill="var(--axis)"${t}/>`;
      const lx = r.v >= 0 ? cx0 + w + 6 : cx0 - w - 6;
      s += `<text class="v" x="${lx}" y="${y0 + 13}" text-anchor="${r.v >= 0 ? 'start' : 'end'}">${sgn(r.v)}${r.approx ? '＊' : ''}</text>`;
    });
    s += '</svg>';
    return s;
  }

  /** ピリオドごとの「試合ごとの差」を点で、平均を横線で（通算用） */
  function quarterDots(o) {
    const W = Math.max(280, o.W || 640), H = 230, ml = 34, mr = 10, mt = 22, mb = 40;
    const ext = niceMax(Math.max(5, ...o.groups.flatMap(g => g.dots.map(d => Math.abs(d.v)))));
    const n = o.groups.length, gw = (W - ml - mr) / n;
    const y = v => mt + (H - mt - mb) * (1 - (v + ext) / (2 * ext));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.title || '')}">`;
    [-ext, 0, ext].forEach(t => { s += `<line class="${t === 0 ? 'axis' : 'grid'}" x1="${ml}" x2="${W - mr}" y1="${y(t)}" y2="${y(t)}"/><text class="mute" x="${ml - 6}" y="${y(t) + 4}" text-anchor="end">${sgn(t)}</text>`; });
    o.groups.forEach((g, i) => {
      const cx = ml + gw * i + gw / 2;
      const mean = g.dots.reduce((a, d) => a + d.v, 0) / (g.dots.length || 1);
      s += `<line x1="${cx - 22}" x2="${cx + 22}" y1="${y(mean)}" y2="${y(mean)}" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"${tip([`平均 ${sgn(Math.round(mean * 10) / 10)}`, `${g.label}の得失点差の平均`])}/>`;
      g.dots.forEach((d, k) => {
        const dx = cx + (k - (g.dots.length - 1) / 2) * 16;
        s += `<circle cx="${dx}" cy="${y(d.v)}" r="5" fill="var(--me)" stroke="var(--surface)" stroke-width="2"/><circle cx="${dx}" cy="${y(d.v)}" r="13" fill="transparent"${tip([sgn(d.v), `${g.label}　${d.name}`])}/>`;
      });
      s += `<text class="lbl" x="${cx}" y="${H - mb + 20}" text-anchor="middle">${esc(g.label)}</text>`;
      s += `<text class="v" x="${cx}" y="${H - mb + 36}" text-anchor="middle">平均 ${sgn(Math.round(mean * 10) / 10)}</text>`;
    });
    s += '</svg>';
    return legend([{ label: '試合ごとの得失点差', color: 'var(--me)', cls: 'dot' }, { label: '平均', color: 'var(--ink)', cls: 'ln' }]) + s;
  }

  return { esc, sgn, f1, tw, groupedBars, marginLine, kindsBar, plusMinus, quarterDots, legend };
});
