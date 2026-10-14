// ホームページの描画：保存した site（JSON）から、そのまま公開できる1枚のHTMLを作る。
// プレビュー・エディター・書き出しは、すべてここを通る（見た目がずれないように）。
(function () {
  'use strict';

  /* ───────── 小物 ───────── */
  const str = (v) => (v == null ? '' : String(v));
  const has = (v) => str(v).trim() !== '';
  const arr = (v) => (Array.isArray(v) ? v : []);
  const clone = (v) => JSON.parse(JSON.stringify(v == null ? null : v));
  const esc = (s) => str(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 改行は <br>、空行は段落の区切り
  const lines = (s) => esc(str(s).trim()).replace(/\r?\n/g, '<br>');
  const paras = (s) => str(s).trim().split(/\r?\n[ \t\u3000]*\r?\n/).filter((p) => p.trim()).map((p) => '<p>' + lines(p) + '</p>').join('');
  // スクリプトの中に JSON を埋めても </script> で切れないように
  const jsonIn = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const pad2 = (n) => String(n).padStart(2, '0');
  // リンク先は http(s)・mailto・tel・ページ内・相対パスだけ（javascript: などは捨てる）
  const safeHref = (u) => {
    u = str(u).trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:)/i.test(u) || /^[#/.?]/.test(u)) return u;
    if (/^www\./i.test(u)) return 'https://' + u;
    if (/^[a-z][\w+.-]*:/i.test(u)) return '';
    return u;
  };
  const isExternal = (u) => /^https?:/i.test(u);
  const rel = (n) => (window.Kit ? Kit.rel(n) : new Date(Date.now() + n * 864e5).toISOString().slice(0, 10));

  /* ───────── 色 ───────── */
  const hex = (c) => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(str(c).trim());
    if (!m) return '';
    const x = m[1].length === 3 ? m[1].replace(/./g, (k) => k + k) : m[1];
    return '#' + x.toLowerCase();
  };
  const rgb = (c) => { const x = hex(c).slice(1) || '000000'; return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)); };
  const toHex = (a) => '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const rgba = (c, a) => 'rgba(' + rgb(c).join(',') + ',' + a + ')';
  const lum = (c) => { const v = rgb(c).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // 文字色を、どの背景でも読める濃さ（4.5:1）まで寄せる
  const readable = (fg, bgs, min = 4.5) => {
    const to = lum(bgs[0]) > 0.35 ? '#000000' : '#ffffff';
    let c = fg;
    for (let i = 0; i < 24 && bgs.some((b) => contrast(c, b) < min); i++) c = mix(c, to, 0.07);
    return c;
  };
  // 色の上に載せる文字：白で読めるなら白、だめなら黒
  const onColor = (c) => (contrast(c, '#ffffff') >= 4.5 || contrast(c, '#ffffff') >= contrast(c, '#151515') ? '#ffffff' : '#151515');

  /* ───────── テーマ・字体 ───────── */
  const THEMES = [
    { id: 'sometsuke', name: '染付', desc: '藍と白磁。落ち着いて、信頼される', shape: 'soft',
      c: { bg: '#f8fafc', surface: '#ffffff', alt: '#edf2f8', ink: '#15233d', muted: '#4e5c72', accent: '#1f4a8f', accentInk: '#ffffff', line: '#d9e1ec', pop: '#e5ab2e', footBg: '#0f203d', footInk: '#d3ddec' } },
    { id: 'wakatake', name: '若竹', desc: '若竹の緑。さわやかで、すこやか', shape: 'round',
      c: { bg: '#f8faf5', surface: '#ffffff', alt: '#ecf2e7', ink: '#17261b', muted: '#4b5d4f', accent: '#2b6b47', accentInk: '#ffffff', line: '#d8e3d3', pop: '#e6a92d', footBg: '#132219', footInk: '#d3e2d6' } },
    { id: 'kaki', name: '柿', desc: '柿色。あたたかく、親しみやすい', shape: 'round',
      c: { bg: '#fffaf3', surface: '#ffffff', alt: '#fbefe2', ink: '#2e2018', muted: '#67524a', accent: '#b4441a', accentInk: '#ffffff', line: '#eedcc9', pop: '#2f7d8c', footBg: '#2b1b12', footInk: '#efe0d1' } },
    { id: 'sumi', name: '墨', desc: '白と黒だけ。すっきり上品', shape: 'square',
      c: { bg: '#ffffff', surface: '#ffffff', alt: '#f3f3f1', ink: '#161616', muted: '#555555', accent: '#161616', accentInk: '#ffffff', line: '#e0e0dc', pop: '#a8a8a3', footBg: '#161616', footInk: '#e2e2de' } },
    { id: 'sakuranezu', name: '桜鼠', desc: '灰がかった桜色。やわらかく、やさしい', shape: 'round',
      c: { bg: '#fcf8f8', surface: '#ffffff', alt: '#f6edf0', ink: '#3a2e33', muted: '#6b5c62', accent: '#994c66', accentInk: '#ffffff', line: '#ecdde2', pop: '#8ea897', footBg: '#3a2d33', footInk: '#f1e5e9' } },
    { id: 'yoru', name: '夜', desc: '夜の藍に灯り。印象に残る', shape: 'soft', dark: true,
      c: { bg: '#0f141d', surface: '#171e2b', alt: '#131a26', ink: '#e8ecf2', muted: '#a6b0c0', accent: '#e6b65c', accentInk: '#1b1407', line: '#283346', pop: '#7ea6e6', footBg: '#0a0e15', footInk: '#aab4c4' } },
  ];
  const SHAPES = {
    soft: { r: '14px', rl: '22px', btn: '10px', mark: '10px' },
    round: { r: '18px', rl: '28px', btn: '999px', mark: '50%' },
    square: { r: '3px', rl: '4px', btn: '2px', mark: '2px' },
  };
  const GOTHIC = '"Zen Kaku Gothic New", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", YuGothic, Meiryo, "Noto Sans JP", sans-serif';
  const MINCHO = '"Shippori Mincho B1", "Hiragino Mincho ProN", "Yu Mincho", YuMincho, "Noto Serif JP", serif';
  const MARU = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", YuGothic, Meiryo, "Noto Sans JP", sans-serif';
  const FONTS = [
    { id: 'gothic', name: 'ゴシック', desc: 'すっきり読みやすい', head: GOTHIC, body: GOTHIC, w: 700, q: 'family=Zen+Kaku+Gothic+New:wght@400;500;700' },
    { id: 'mincho', name: '明朝', desc: '見出しが明朝。落ち着いた印象', head: MINCHO, body: GOTHIC, w: 700, q: 'family=Shippori+Mincho+B1:wght@700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700' },
    { id: 'maru', name: '丸ゴシック', desc: 'やわらかく、親しみやすい', head: MARU, body: MARU, w: 700, q: 'family=Zen+Maru+Gothic:wght@400;500;700' },
  ];
  const themeOf = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
  const fontOf = (id) => FONTS.find((f) => f.id === id) || FONTS[0];

  // テーマ＋アクセント色の上書きから、ページで使う色をそろえる
  function palette(site) {
    const t = themeOf(site && site.theme);
    const c = Object.assign({}, t.c);
    const ov = hex(site && site.accent);
    if (ov) { c.accent = ov; c.accentInk = onColor(ov); }
    c.dark = !!t.dark;
    c.link = readable(c.accent, [c.bg, c.alt, c.surface]);
    c.soft = mix(c.bg, c.accent, t.dark ? 0.14 : 0.075);
    c.lineStrong = mix(c.line, c.ink, t.dark ? 0.22 : 0.2);
    c.muted = readable(c.muted, [c.bg, c.alt, c.surface]);
    c.hdBg = rgba(c.bg, 0.9);
    c.shadow = rgba(t.dark ? '#000000' : c.accent, t.dark ? 0.6 : 0.45);
    c.ring = rgba(c.link, 0.28);
    c.err = t.dark ? '#ff9a90' : '#b3261e';
    c.errWash = t.dark ? '#3d1d1b' : '#fbe6e4';
    c.warnWash = t.dark ? '#3a2f14' : '#fdf3dc';
    c.warnLine = t.dark ? '#6b5626' : '#ecd29a';
    c.field = t.dark ? mix(c.surface, '#000000', 0.18) : '#ffffff';
    c.footLine = rgba(c.footInk, 0.18);
    c.footSoft = rgba(c.footInk, 0.72);
    c.heroBg = t.dark ? mix(c.bg, c.surface, 0.75) : mix(c.bg, c.accent, 0.045);
    return c;
  }

  /* ───────── イラスト（写真がなくても形になるように。テーマの色で描く） ───────── */
  const svgUrl = (svg) => {
    let u = svg.replace(/\s{2,}/g, ' ').replace(/[\r\n%#()<>?[\\\]^`{|}]/g, encodeURIComponent).replace(/[^\x20-\x7e]/gu, encodeURIComponent);
    u = u.includes("'") ? u.replace(/"/g, '%22') : u.replace(/"/g, "'");
    return 'data:image/svg+xml,' + u;
  };
  const artColors = (c) => ({
    soft: c.dark ? mix(c.surface, c.pop, 0.1) : mix('#ffffff', c.accent, 0.1),
    paper: c.dark ? mix(c.surface, '#ffffff', 0.04) : '#ffffff',
    accent: c.accent, ink: c.dark ? mix(c.ink, c.bg, 0.15) : c.ink, pop: c.pop, line: c.line,
    face: mix('#f2dccb', c.accent, 0.08),
  });
  const wrapSvg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  const gridDef = (id, step, color, op) => `<pattern id="${id}" width="${step}" height="${step}" patternUnits="userSpaceOnUse"><path d="M${step} 0H0V${step}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="1.2"/></pattern>`;
  const ART = {
    hero: { name: '電球と図形（ひらめき）', w: 640, h: 512, draw: (k) => `
<defs><clipPath id="c"><rect width="640" height="512" rx="36"/></clipPath>${gridDef('g', 32, k.accent, 0.12)}</defs>
<g clip-path="url(#c)"><rect width="640" height="512" fill="${k.soft}"/><rect width="640" height="512" fill="url(#g)"/>
<circle cx="372" cy="262" r="178" fill="none" stroke="${k.ink}" stroke-opacity=".3" stroke-width="3" stroke-dasharray="1 12" stroke-linecap="round"/>
<path d="M150 92Q360 652 570 92" fill="none" stroke="${k.accent}" stroke-width="7" stroke-linecap="round"/>
<path d="M62 456h172L62 326z" fill="${k.accent}" fill-opacity=".14" stroke="${k.accent}" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 432h24v24" fill="none" stroke="${k.accent}" stroke-width="3.5"/>
<circle cx="360" cy="206" r="96" fill="${k.pop}" fill-opacity=".26"/>
<g stroke="${k.pop}" stroke-width="8" stroke-linecap="round"><path d="M360 86V62M424 108l15-19M296 108l-15-19M458 156l22-8M262 156l-22-8"/></g>
<path d="M360 136a58 58 0 0 0-34 105c7 5 11 12 11 19v10h46v-10c0-7 4-14 11-19A58 58 0 0 0 360 136z" fill="${k.paper}" stroke="${k.ink}" stroke-width="6" stroke-linejoin="round"/>
<path d="M330 200h13l13 28 21-58h15" fill="none" stroke="${k.accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="337" y="279" width="46" height="11" rx="5.5" fill="${k.ink}"/><rect x="342" y="296" width="36" height="11" rx="5.5" fill="${k.ink}"/>
<g stroke="${k.ink}" stroke-width="6" stroke-linecap="round"><path d="M548 304l-36 136M548 304l38 128"/></g>
<circle cx="548" cy="300" r="11" fill="${k.ink}"/><path d="M586 432l7 22" stroke="${k.pop}" stroke-width="9" stroke-linecap="round"/>
<circle cx="254" cy="300" r="8" fill="${k.accent}"/><circle cx="466" cy="300" r="8" fill="${k.accent}"/>
<circle cx="360" cy="372" r="10" fill="${k.paper}" stroke="${k.accent}" stroke-width="5"/></g>` },
    about: { name: '三平方の定理のノート', w: 640, h: 480, draw: (k) => `
<defs>${gridDef('g', 24, k.accent, 0.13)}</defs>
<rect width="640" height="480" rx="36" fill="${k.soft}"/>
<g transform="rotate(-3 320 240)"><rect x="96" y="34" width="448" height="412" rx="18" fill="${k.ink}" fill-opacity=".08" transform="translate(8 10)"/>
<rect x="96" y="34" width="448" height="412" rx="18" fill="${k.paper}"/><rect x="96" y="34" width="448" height="412" rx="18" fill="url(#g)"/>
<path d="M172 196h96v96h-96z" fill="${k.pop}" fill-opacity=".42" stroke="${k.ink}" stroke-width="3"/>
<path d="M268 292h128v128H268z" fill="${k.pop}" fill-opacity=".42" stroke="${k.ink}" stroke-width="3"/>
<path d="M396 292L268 196l96-128 128 96z" fill="${k.accent}" fill-opacity=".16" stroke="${k.accent}" stroke-width="4" stroke-linejoin="round"/>
<path d="M268 292V196l128 96z" fill="${k.paper}" stroke="${k.ink}" stroke-width="5" stroke-linejoin="round"/>
<path d="M268 274h18v18" fill="none" stroke="${k.ink}" stroke-width="3"/>
<g font-family="Georgia, Times New Roman, serif" font-style="italic" font-size="38" fill="${k.ink}" fill-opacity=".8" text-anchor="middle"><text x="220" y="257">a²</text><text x="332" y="369">b²</text><text x="380" y="193">c²</text></g></g>
<g transform="rotate(-36 512 404)"><rect x="436" y="392" width="136" height="24" rx="4" fill="${k.pop}"/><rect x="560" y="392" width="20" height="24" rx="4" fill="${k.ink}" fill-opacity=".75"/><path d="M436 392l-26 12 26 12z" fill="${k.paper}" stroke="${k.ink}" stroke-width="2"/><path d="M418 400l-8 4 8 4z" fill="${k.ink}"/></g>` },
    profile: { name: '人物（メガネ）', w: 480, h: 480, draw: (k) => `
<defs><clipPath id="c"><rect width="480" height="480" rx="40"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="480" height="480" fill="${k.soft}"/>
<circle cx="240" cy="262" r="168" fill="${k.paper}" fill-opacity=".7"/>
<path d="M92 480c6-96 66-152 148-152s142 56 148 152z" fill="${k.accent}"/>
<path d="M204 330l36 42 36-42z" fill="${k.paper}"/>
<rect x="214" y="262" width="52" height="76" rx="22" fill="${k.face}"/>
<circle cx="240" cy="214" r="80" fill="${k.face}"/>
<path d="M160 216c-6-64 34-104 84-104 52 0 86 38 78 102-12-32-42-52-82-52-36 0-64 22-80 54z" fill="${k.ink}"/>
<g fill="none" stroke="${k.ink}" stroke-width="5"><circle cx="210" cy="226" r="21"/><circle cx="270" cy="226" r="21"/><path d="M231 225h18"/></g>
<path d="M224 270q16 12 32 0" fill="none" stroke="${k.ink}" stroke-width="5" stroke-linecap="round"/>
<circle cx="384" cy="104" r="42" fill="${k.pop}"/><path d="M356 134l-16 24 32-13z" fill="${k.pop}"/>
<path d="M384 82v28" stroke="${k.paper}" stroke-width="10" stroke-linecap="round"/><circle cx="384" cy="126" r="6" fill="${k.paper}"/></g>` },
    graph: { name: '関数のグラフ', w: 640, h: 480, draw: (k) => {
      const pts = [];
      for (let i = 0; i <= 48; i++) { const x = 104 + i * 10; pts.push(x + ' ' + (250 - 110 * Math.sin((x - 104) / 76)).toFixed(1)); }
      return `<defs><clipPath id="c"><rect width="640" height="480" rx="32"/></clipPath>${gridDef('g', 40, k.accent, 0.12)}</defs>
<g clip-path="url(#c)"><rect width="640" height="480" fill="${k.soft}"/><rect width="640" height="480" fill="url(#g)"/>
<path d="M104 250L${pts.slice(0, 25).join('L')}L344 250z" fill="${k.accent}" fill-opacity=".16"/>
<g stroke="${k.ink}" stroke-width="4" stroke-linecap="round" fill="none"><path d="M64 250h520M572 238l14 12-14 12"/><path d="M104 420V72M92 86l12-14 12 14"/></g>
<path d="M${pts.join('L')}" fill="none" stroke="${k.accent}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M150 46l250 180" stroke="${k.pop}" stroke-width="5" stroke-dasharray="14 10" stroke-linecap="round"/>
<circle cx="223" cy="140" r="11" fill="${k.paper}" stroke="${k.accent}" stroke-width="5"/><circle cx="462" cy="360" r="11" fill="${k.paper}" stroke="${k.accent}" stroke-width="5"/></g>`;
    } },
    tiles: { name: '三角形のタイル', w: 640, h: 480, draw: (k) => {
      const s = 80, hh = 69.28, cols = [k.accent, k.soft, k.pop, k.paper, k.accent], ops = [0.9, 1, 0.75, 1, 0.35];
      const d = ['', '', '', '', ''];
      const r1 = (v) => Math.round(v * 10) / 10;
      for (let r = 0; r < 7; r++) {
        for (let i = -1; i < 17; i++) {
          const x0 = i * (s / 2) - (r % 2 ? s / 2 : 0), y0 = r1(r * hh), y1 = r1((r + 1) * hh), up = (i + r) % 2 === 0;
          const n = (r * 7 + i * 3 + (up ? 1 : 0) + 50) % 5;
          d[n] += up ? `M${x0} ${y1}L${x0 + s / 2} ${y0}L${x0 + s} ${y1}Z` : `M${x0} ${y0}L${x0 + s} ${y0}L${x0 + s / 2} ${y1}Z`;
        }
      }
      return `<defs><clipPath id="c"><rect width="640" height="480" rx="32"/></clipPath></defs><g clip-path="url(#c)" stroke="${k.paper}" stroke-width="3" stroke-linejoin="round"><rect width="640" height="480" fill="${k.soft}" stroke="none"/>${d.map((p, n) => (p ? `<path d="${p}" fill="${cols[n]}" fill-opacity="${ops[n]}"/>` : '')).join('')}</g>`;
    } },
    circles: { name: 'コンパスの作図', w: 640, h: 480, draw: (k) => `
<defs><clipPath id="c"><rect width="640" height="480" rx="32"/></clipPath>${gridDef('g', 32, k.accent, 0.1)}</defs>
<g clip-path="url(#c)"><rect width="640" height="480" fill="${k.soft}"/><rect width="640" height="480" fill="url(#g)"/>
<g fill="${k.accent}" fill-opacity=".07" stroke="${k.ink}" stroke-opacity=".6" stroke-width="3.5"><circle cx="245" cy="262" r="150"/><circle cx="395" cy="262" r="150"/></g>
<path d="M245 262H395L320 132.1z" fill="${k.pop}" fill-opacity=".5" stroke="${k.accent}" stroke-width="6" stroke-linejoin="round"/>
<path d="M320 132.1V391.9" stroke="${k.ink}" stroke-opacity=".35" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
<g fill="${k.accent}"><circle cx="245" cy="262" r="9"/><circle cx="395" cy="262" r="9"/><circle cx="320" cy="132.1" r="9"/></g>
<circle cx="320" cy="391.9" r="9" fill="${k.paper}" stroke="${k.accent}" stroke-width="4"/></g>` },
    shapes: { name: '丸・三角・四角', w: 640, h: 480, draw: (k) => `
<defs><clipPath id="c"><rect width="640" height="480" rx="32"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="640" height="480" fill="${k.soft}"/>
<circle cx="238" cy="236" r="132" fill="${k.accent}"/>
<rect x="318" y="182" width="170" height="170" rx="10" fill="${k.paper}" stroke="${k.ink}" stroke-width="5" transform="rotate(12 403 267)"/>
<path d="M330 392l92-164 92 164z" fill="${k.pop}" fill-opacity=".9"/>
<circle cx="520" cy="110" r="22" fill="none" stroke="${k.accent}" stroke-width="6"/><path d="M96 400h120" stroke="${k.ink}" stroke-width="6" stroke-linecap="round"/></g>` },
    noren: { name: 'のれん（お店）', w: 640, h: 480, draw: (k) => `
<defs><clipPath id="c"><rect width="640" height="480" rx="32"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="640" height="480" fill="${k.soft}"/>
<rect x="120" y="128" width="400" height="300" fill="${k.paper}" stroke="${k.ink}" stroke-opacity=".2" stroke-width="3"/>
<path d="M92 136L320 70l228 66z" fill="${k.ink}" fill-opacity=".86"/>
<rect x="196" y="300" width="248" height="128" fill="${k.soft}" stroke="${k.ink}" stroke-opacity=".2" stroke-width="3"/>
<path d="M176 178h288" stroke="${k.ink}" stroke-width="7" stroke-linecap="round"/>
<g fill="${k.accent}"><path d="M188 182h84v128l-42-14-42 14z"/><path d="M278 182h84v128l-42-14-42 14z"/><path d="M368 182h84v128l-42-14-42 14z"/></g>
<circle cx="320" cy="238" r="26" fill="none" stroke="${k.paper}" stroke-width="6"/>
<circle cx="560" cy="392" r="34" fill="${k.pop}" fill-opacity=".9"/><rect x="540" y="398" width="40" height="34" rx="6" fill="${k.ink}" fill-opacity=".8"/>
<path d="M60 428h520" stroke="${k.ink}" stroke-opacity=".35" stroke-width="4"/></g>` },
  };
  const artCache = new Map();
  const artUrl = (name, c) => {
    const a = ART[name];
    if (!a) return '';
    const key = name + c.accent + c.pop + c.ink + c.surface + c.bg;
    if (!artCache.has(key)) artCache.set(key, svgUrl(wrapSvg(a.w, a.h, a.draw(artColors(c)))));
    return artCache.get(key);
  };
  // 'img:<id>' → 保存した画像、'svg:<名前>' → 組み込みのイラスト
  function imageInfo(ref, images, c) {
    ref = str(ref);
    if (!ref) return null;
    if (ref.startsWith('img:')) {
      const v = (images || {})[ref.slice(4)];
      if (!v) return null;
      return typeof v === 'string' ? { src: v } : v.dataUrl ? { src: v.dataUrl, w: v.w, h: v.h } : null;
    }
    if (ref.startsWith('svg:')) { const a = ART[ref.slice(4)]; return a ? { src: artUrl(ref.slice(4), c), w: a.w, h: a.h, art: true } : null; }
    if (/^data:image\//.test(ref)) return { src: ref };
    return null;
  }

  /* ───────── アイコン（公開ページ用の線画） ───────── */
  const IC = {
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/>',
    x: '<path d="M4.5 4h4.3l10.7 16h-4.3z" fill="currentColor" stroke="none"/><path d="M19.2 4l-6.3 7.1M11 12.9L4.8 20"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" stroke="none"/>',
    note: '<path d="M6 19V9.5A4.5 4.5 0 0 1 10.5 5h3A4.5 4.5 0 0 1 18 9.5V19"/>',
    line: '<path d="M12 4C7 4 3 7.2 3 11.1c0 3.5 3.2 6.4 7.5 7l-.5 2.4 3.4-2.3C18 17.8 21 14.8 21 11.1 21 7.2 17 4 12 4z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3.8 7.2 12 13l8.2-5.8"/>',
    phone: '<path d="M7 3.5h2.8l1.5 4.1-2 1.3a11 11 0 0 0 5.8 5.8l1.3-2 4.1 1.5V17a2.5 2.5 0 0 1-2.7 2.5A16 16 0 0 1 4.5 6.2 2.5 2.5 0 0 1 7 3.5z"/>',
    pin: '<path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    done: '<circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5l3 3 6-6.5"/>',
  };
  const icon = (k, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${IC[k] || ''}</svg>`;

  /* ───────── 問い合わせフォームの既定（集客窓口がまだ保存していないとき用） ───────── */
  // 集客窓口のサンプル・ひな形と同じ中身（集客窓口が登録したものがあれば、そちらが使われる）
  const FORM_BLANK = {
    title: 'お問い合わせ', lead: 'ご質問・ご相談など、お気軽にお送りください。内容を確かめて、メールでお返事します。',
    kinds: ['ご相談・お問い合わせ', 'ご予約', 'その他'],
    fields: { phone: false, date: false, source: true }, sources: ['Instagram', 'X', '検索', 'ご紹介', 'チラシ', 'その他'],
    thanks: '送信しました。お問い合わせありがとうございます。内容を確かめて、ご連絡します。',
    privacy: 'いただいたお名前・連絡先は、お問い合わせへのお返事のためだけに使います。',
    sourceParam: 'from', delivery: { type: 'demo', to: '', url: '' },
  };
  const FORM_SAMPLE = {
    title: 'お問い合わせ・ご予約',
    lead: '無料体験レッスンのご予約、講座や出張ワークショップのご相談など、お気軽にどうぞ。2日以内にメールでお返事します。',
    kinds: ['無料体験レッスンの予約', 'ご相談・お問い合わせ', '出張ワークショップの依頼', 'その他'],
    fields: { phone: false, date: true, source: true }, sources: ['Instagram', 'X', '検索', 'ご紹介', 'チラシ・掲示', 'その他'],
    thanks: '送信しました。お問い合わせありがとうございます。内容を確かめて、2日以内にメールでお返事します。',
    privacy: 'いただいたお名前・連絡先は、お問い合わせへのお返事のためだけに使い、ほかの目的には使いません。',
    sourceParam: 'from', delivery: { type: 'demo', to: '', url: '' },
  };
  const DELIVERY = ['demo', 'mailto', 'url', 'gas', 'google'];
  // 足りない項目を埋める。送信先がそろっていない設定は、つながっていない（demo）として扱う
  function normForm(f0) {
    const f = Object.assign({}, FORM_BLANK, f0 && typeof f0 === 'object' ? f0 : {});
    f.kinds = arr(f.kinds).map((x) => str(x).trim()).filter(Boolean).slice(0, 20);
    f.sources = arr(f.sources).map((x) => str(x).trim()).filter(Boolean).slice(0, 20);
    f.fields = Object.assign({ phone: false, date: false, source: false }, f.fields);
    const d = Object.assign({ type: 'demo', to: '', url: '' }, f.delivery);
    d.to = str(d.to).trim(); d.url = str(d.url).trim();
    if (!DELIVERY.includes(d.type)) d.type = 'demo';
    d.ready = d.type === 'mailto' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.to) : d.type === 'demo' ? false : /^https:\/\/\S+$/i.test(d.url);
    f.delivery = d;
    f.sourceParam = /^[\w-]{1,20}$/.test(str(f.sourceParam)) ? f.sourceParam : 'from';
    return f;
  }
  const PROFILE_BLANK = { name: '', kana: '', owner: '', tagline: '', about: '', offer: '', audience: '', area: '', email: '', phone: '', url: '', sns: { instagram: '', x: '', youtube: '', note: '', line: '' } };
  const normProfile = (p) => Object.assign({}, PROFILE_BLANK, p || {}, { sns: Object.assign({}, PROFILE_BLANK.sns, p && p.sns) });

  // SNS のアカウント名や URL を、開けるリンクにする（入っているものだけ）
  function snsList(p) {
    const s = p.sns || {}, out = [];
    const hd = (v) => str(v).trim().replace(/^@/, '');
    const url = (v, f) => (/^https?:\/\//i.test(str(v).trim()) ? str(v).trim() : f(encodeURIComponent(hd(v))));
    if (has(s.instagram)) out.push({ k: 'instagram', label: 'Instagram', url: url(s.instagram, (x) => 'https://www.instagram.com/' + x + '/') });
    if (has(s.x)) out.push({ k: 'x', label: 'X', url: url(s.x, (x) => 'https://x.com/' + x) });
    if (has(s.youtube)) out.push({ k: 'youtube', label: 'YouTube', url: url(s.youtube, (x) => 'https://www.youtube.com/@' + x) });
    if (has(s.note)) { const u = url(s.note, (x) => 'https://note.com/' + x); out.push({ k: /note\.com/.test(u) ? 'note' : 'link', label: /note\.com/.test(u) ? 'note' : 'ブログ', url: u }); }
    if (has(s.line)) out.push({ k: 'line', label: 'LINE', url: url(s.line, (x) => 'https://line.me/R/ti/p/' + (str(s.line).trim().startsWith('@') ? '%40' : '') + x) });
    return out.filter((x) => safeHref(x.url));
  }

  /* ───────── セクションの種類 ───────── */
  const F = (k, label, type, o) => Object.assign({ k, label, type: type || 'text' }, o || {});
  const IMG_SIDES = [{ value: 'right', label: '右' }, { value: 'left', label: '左' }];
  const TYPES = [
    { type: 'hero', name: 'トップ', icon: 'flag', desc: '最初に目に入る、大きな見出しとボタン', eyebrow: '', nav: '',
      make: (p) => ({ kicker: has(p.tagline) ? p.name : '', heading: p.tagline || p.name || 'ひとことで伝わる、キャッチコピー', sub: p.about || 'だれに、何を、どのように届けるのかを、2〜3行で書きます。', ctaLabel: 'お問い合わせ', ctaHref: '#contact', secondaryLabel: '', secondaryHref: '', image: '', imageAlt: '', layout: 'center' }),
      fields: [F('kicker', '見出しの上の一言', 'text', { ph: '例：佐賀発・オンラインの数学教室', hint: '屋号や地域など、何の事業かがすぐ分かる言葉を' }), F('heading', 'キャッチコピー', 'textarea', { rows: 2, hint: 'ページでいちばん大きく出る見出しです。改行もそのまま出ます' }), F('sub', '説明', 'textarea', { rows: 4 }),
        F('ctaLabel', 'ボタンの文字', 'text', { ph: '例：無料体験を申し込む' }), F('ctaHref', 'ボタンの行き先', 'link'), F('secondaryLabel', '2つめのボタンの文字（任意）'), F('secondaryHref', '2つめのボタンの行き先', 'link'),
        F('image', '画像', 'image'), F('imageAlt', '画像の説明（読み上げ用・任意）', 'text', { hint: 'イラストや飾りの画像なら空欄で大丈夫です' }),
        F('layout', '並べ方', 'choice', { options: [{ value: 'split', label: '左右に並べる' }, { value: 'center', label: '中央にそろえる' }, { value: 'cover', label: '画像を背景に' }] })] },
    { type: 'about', name: '紹介', icon: 'home', desc: 'どんな事業か、大切にしていること', eyebrow: 'ABOUT', nav: '私たちについて',
      make: (p) => ({ heading: p.name ? p.name + 'について' : '私たちについて', body: p.about || 'どんな思いで始めたのか、何を大切にしているのかを書きます。', image: '', imageAlt: '', imageSide: 'right' }),
      fields: [F('heading', '見出し', 'textarea', { rows: 2 }), F('body', '本文', 'textarea', { rows: 9, hint: '空行で段落が分かれます' }), F('image', '画像', 'image'), F('imageAlt', '画像の説明（読み上げ用・任意）'), F('imageSide', '画像の位置', 'choice', { options: IMG_SIDES })] },
    { type: 'services', name: 'サービス', icon: 'store', desc: '商品・サービスをカードで並べる', eyebrow: 'SERVICE', nav: 'サービス',
      make: (p) => {
        const items = str(p.offer).split(/[／/、,\n]+/).map((x) => x.trim()).filter(Boolean).slice(0, 6).map((t) => ({ title: t, body: '', price: '', note: '' }));
        return { heading: 'サービス', lead: p.audience ? p.audience + 'に向けて、次のサービスをご用意しています。' : '', items: items.length ? items : [{ title: 'サービスの名前', body: 'どんな人に、何を、どのように。時間や回数の目安も。', price: '', note: '' }] };
      },
      fields: [F('heading', '見出し'), F('lead', 'リード文（任意）', 'textarea', { rows: 2 }),
        F('items', 'サービス', 'list', { itemName: 'サービス', add: () => ({ title: '', body: '', price: '', note: '' }), title: 'title',
          fields: [F('title', '名前'), F('body', '説明', 'textarea', { rows: 3 }), F('price', '料金（任意）', 'text', { ph: '例：60分 ¥4,000' }), F('note', 'ひとこと（任意）', 'text', { ph: '例：オンライン対応' })] })] },
    { type: 'pricing', name: '料金プラン', icon: 'yen', desc: '料金を比べやすく。おすすめを目立たせる', eyebrow: 'PRICE', nav: '料金',
      make: () => ({ heading: '料金', lead: '表示はすべて税込です。', badge: 'おすすめ', plans: [
        { name: 'おためし', price: '¥0', unit: '／30分', features: ['内容を1つめに', '内容を2つめに'], featured: false, ctaLabel: '申し込む' },
        { name: 'ベーシック', price: '¥0,000', unit: '／回', features: ['内容を1つめに', '内容を2つめに', '内容を3つめに'], featured: true, ctaLabel: '申し込む' }], note: '' }),
      fields: [F('heading', '見出し'), F('lead', 'リード文（任意）', 'textarea', { rows: 2 }), F('badge', 'おすすめの札の文字', 'text', { ph: 'おすすめ' }),
        F('plans', 'プラン', 'list', { itemName: 'プラン', add: () => ({ name: '', price: '', unit: '', features: [], featured: false, ctaLabel: '申し込む' }), title: 'name',
          fields: [F('name', 'プラン名'), F('price', '料金', 'text', { ph: '例：¥4,000' }), F('unit', '単位（任意）', 'text', { ph: '例：／60分' }), F('features', '含まれるもの（1行に1つ）', 'lines', { rows: 4 }), F('featured', 'おすすめとして目立たせる', 'bool'), F('ctaLabel', 'ボタンの文字（空欄でボタンなし）')] }),
        F('note', '注記（任意）', 'textarea', { rows: 2 })] },
    { type: 'flow', name: 'ご利用の流れ', icon: 'layers', desc: '申し込みから始まるまでの手順', eyebrow: 'FLOW', nav: 'ご利用の流れ',
      make: () => ({ heading: 'ご利用の流れ', lead: '', steps: [{ title: 'お問い合わせ', body: 'フォームから、ご希望をお送りください。' }, { title: 'ご相談', body: '内容や日程を、一緒に決めます。' }, { title: 'お申し込み', body: '内容が決まったら、お申し込みです。' }, { title: 'ご利用開始', body: '当日を楽しみにお待ちください。' }] }),
      fields: [F('heading', '見出し'), F('lead', 'リード文（任意）', 'textarea', { rows: 2 }),
        F('steps', '手順', 'list', { itemName: '手順', add: () => ({ title: '', body: '' }), title: 'title', fields: [F('title', '名前'), F('body', '説明', 'textarea', { rows: 2 })] })] },
    { type: 'voices', name: 'お客さまの声', icon: 'star', desc: '利用した人の感想', eyebrow: 'VOICE', nav: 'お客さまの声',
      make: () => ({ heading: 'お客さまの声', lead: '', items: [{ text: 'いただいた感想を、ここに書きます（載せてよいか、ご本人に確かめてから）。', name: 'A.Bさん', role: '〇〇をご利用' }] }),
      fields: [F('heading', '見出し'), F('lead', 'リード文（任意）', 'textarea', { rows: 2 }),
        F('items', '声', 'list', { itemName: '声', add: () => ({ text: '', name: '', role: '' }), title: 'name', fields: [F('text', '感想', 'textarea', { rows: 4 }), F('name', 'お名前（イニシャルなど）'), F('role', 'どんな方か（任意）', 'text', { ph: '例：中学2年生の保護者' })] })] },
    { type: 'profile', name: 'プロフィール', icon: 'user', desc: '代表者・講師の紹介と写真', eyebrow: 'PROFILE', nav: 'プロフィール',
      make: (p) => ({ heading: 'プロフィール', name: p.owner || '', role: p.name ? p.name + ' 代表' : '代表', body: '経歴や、この仕事を始めたきっかけを書きます。', image: '', imageAlt: '' }),
      fields: [F('heading', '見出し'), F('name', '名前'), F('role', '肩書き（任意）'), F('body', '本文', 'textarea', { rows: 8 }), F('image', '写真', 'image'), F('imageAlt', '写真の説明（読み上げ用・任意）', 'text', { hint: '空欄なら「（名前）の写真」になります' })] },
    { type: 'faq', name: 'よくある質問', icon: 'info', desc: '質問と答え。開いて読める形', eyebrow: 'FAQ', nav: 'よくある質問',
      make: () => ({ heading: 'よくある質問', items: [{ q: 'よくいただく質問を、ここに書きます', a: '答えを、短く具体的に書きます。' }] }),
      fields: [F('heading', '見出し'), F('items', '質問', 'list', { itemName: '質問', add: () => ({ q: '', a: '' }), title: 'q', fields: [F('q', '質問'), F('a', '答え', 'textarea', { rows: 3 })] })] },
    { type: 'news', name: 'お知らせ', icon: 'megaphone', desc: '日付つきのお知らせ', eyebrow: 'NEWS', nav: 'お知らせ',
      make: () => ({ heading: 'お知らせ', items: [{ date: rel(0), text: 'ホームページを公開しました。' }] }),
      fields: [F('heading', '見出し'), F('items', 'お知らせ', 'list', { itemName: 'お知らせ', add: () => ({ date: rel(0), text: '' }), title: 'text', fields: [F('date', '日付', 'date'), F('text', '内容', 'textarea', { rows: 2 })] })] },
    { type: 'gallery', name: 'ギャラリー', icon: 'image', desc: '写真を並べて見せる', eyebrow: 'GALLERY', nav: 'ギャラリー',
      make: () => ({ heading: 'ギャラリー', lead: '', images: [] }),
      fields: [F('heading', '見出し'), F('lead', 'リード文（任意）', 'textarea', { rows: 2 }),
        F('images', '写真', 'list', { itemName: '写真', add: () => ({ src: '', caption: '' }), title: 'caption', fields: [F('src', '写真', 'image'), F('caption', '説明（任意・読み上げにも使います）')] })] },
    { type: 'cta', name: '申し込みの呼びかけ', icon: 'send', desc: '色の帯で、申し込みや問い合わせを促す', eyebrow: '', nav: '',
      make: () => ({ heading: 'まずは、お気軽にご相談ください', body: '', buttonLabel: 'お問い合わせ', buttonHref: '#contact' }),
      fields: [F('heading', '見出し', 'textarea', { rows: 2 }), F('body', '本文（任意）', 'textarea', { rows: 3 }), F('buttonLabel', 'ボタンの文字'), F('buttonHref', 'ボタンの行き先', 'link')] },
    { type: 'contact', name: 'お問い合わせ', icon: 'mail', desc: '問い合わせフォーム（集客窓口の設定を使う）', eyebrow: 'CONTACT', nav: 'お問い合わせ',
      make: () => ({ heading: 'お問い合わせ', lead: '', showInfo: true }),
      fields: [F('heading', '見出し'), F('lead', 'リード文（空欄ならフォーム設定の文）', 'textarea', { rows: 3 }), F('showInfo', 'メール・電話・SNSも載せる（事業プロフィールから）', 'bool')] },
  ];
  const typeOf = (t) => TYPES.find((x) => x.type === t);

  // ページ内で重ならない id（アンカーに使うので読みやすい英字）
  function uniqueId(site, type) {
    const ids = new Set(arr(site && site.sections).map((s) => s.id));
    if (!ids.has(type)) return type;
    for (let i = 2; ; i++) if (!ids.has(type + '-' + i)) return type + '-' + i;
  }
  function makeSection(type, profile, site) {
    const t = typeOf(type);
    if (!t) return null;
    const s = Object.assign({ id: uniqueId(site, type), type, hidden: false }, t.make(normProfile(profile)));
    if (t.eyebrow) s.eyebrow = t.eyebrow;
    if (t.nav) { s.navLabel = t.nav; s.inNav = ['about', 'services', 'pricing', 'profile', 'faq', 'contact'].includes(type); }
    return s;
  }

  // 古いデータや欠けた値でも描けるように整える（元の値は変えない）
  function normalize(site0) {
    const s = clone(site0 && typeof site0 === 'object' ? site0 : {});
    s.theme = themeOf(s.theme).id;
    s.font = fontOf(s.font).id;
    s.accent = hex(s.accent);
    s.meta = Object.assign({ title: '', description: '', ogImage: '' }, s.meta);
    s.nav = s.nav !== false;
    s.footer = Object.assign({ note: '' }, s.footer);
    s.publishedUrl = str(s.publishedUrl).trim();
    const seen = new Set();
    s.sections = arr(s.sections).filter((x) => x && typeOf(x.type)).map((x) => {
      if (!/^[a-z][\w-]{0,40}$/i.test(str(x.id)) || seen.has(x.id)) x.id = uniqueId({ sections: [...seen].map((id) => ({ id })) }, x.type);
      seen.add(x.id);
      return x;
    });
    return s;
  }

  function blank(profile) {
    const p = normProfile(profile);
    const site = { theme: 'sometsuke', font: 'gothic', accent: '', meta: { title: '', description: '', ogImage: '' }, nav: true, sections: [], footer: { note: '' }, publishedUrl: '' };
    for (const t of ['hero', 'about', 'services', 'contact']) site.sections.push(makeSection(t, p, site));
    return site;
  }

  function imageRefs(site) {
    const out = new Set();
    const add = (r) => { if (str(r).startsWith('img:')) out.add(str(r)); };
    const s = site || {};
    add(s.meta && s.meta.ogImage);
    for (const sec of arr(s.sections)) {
      add(sec.image);
      for (const g of arr(sec.images)) add(g && typeof g === 'object' ? g.src : g);
      for (const it of arr(sec.items)) if (it && typeof it === 'object') add(it.image);
    }
    return [...out];
  }

  /* ───────── サンプル：ひらめき数学舎 ───────── */
  function makeSample() {
    return {
      theme: 'sometsuke', font: 'mincho', accent: '', nav: true, publishedUrl: '',
      meta: {
        title: 'ひらめき数学舎｜佐賀発・発見から学ぶオンライン数学教室',
        description: '暗記ではなく発見から学ぶ、佐賀のオンライン数学教室。中高生の個別レッスン、大人の学び直し講座、先生向けの授業ツール、学校・公民館への出張ワークショップ。30分の無料体験を受付中です。',
        ogImage: '',
      },
      sections: [
        { id: 'hero', type: 'hero', hidden: false, kicker: '佐賀発・オンラインの数学教室', heading: 'わかった！を、\n自分の手で。',
          sub: '暗記ではなく、発見から。図やゲームで手を動かしながら、公式の「なぜ」に自分でたどり着く、小さな数学教室です。中高生の苦手克服から大人の学び直し、先生向けの授業ツールまで。',
          ctaLabel: '無料体験を申し込む', ctaHref: '#contact', secondaryLabel: 'サービスを見る', secondaryHref: '#services', image: 'svg:hero', imageAlt: '', layout: 'split' },
        { id: 'about', type: 'about', hidden: false, eyebrow: 'ABOUT', navLabel: '教室について', inNav: true, heading: '公式は、覚えるより\n見つけるほうが忘れない。',
          body: '数学が苦手になるきっかけの多くは、意味がわからないまま覚えることです。ひらめき数学舎では、図をかいたり数を動かしたりしながら、公式やきまりを自分の手で見つけていきます。\n\n一度「わかった！」を味わうと、数学はぐっと身近になります。中学・高校で12年間数学を教えてきた経験をもとに、一人ひとりのつまずきに合わせて進めます。',
          image: 'svg:about', imageAlt: '', imageSide: 'right' },
        { id: 'services', type: 'services', hidden: false, eyebrow: 'SERVICE', navLabel: 'サービス', inNav: true, heading: 'できること', lead: '中高生から大人、先生まで。目的に合わせて選べます。',
          items: [
            { title: 'オンライン個別レッスン', body: 'つまずいた単元の出発点を一緒に探し、自分で解ける手順をつくります。中学数学から数学III・Cまで、定期テストや受験の対策も。', price: '60分 ¥4,000', note: 'Zoom または Google Meet で受講' },
            { title: '大人の学び直し講座', body: '中学数学を、図と対話でもう一度。仕事や子育ての合間に、週1回・少人数で無理なく続けられます。', price: '全6回 ¥18,000', note: '平日の夜と土曜の午前にクラスがあります' },
            { title: '出張ワークショップ', body: '学校・公民館・子ども会へうかがいます。紙とはさみで図形の性質を見つけるなど、体を動かして楽しむ90分です。', price: '¥30,000〜', note: '佐賀県内は交通費込み' },
            { title: '授業ツール・教材', body: '授業ですぐ使えるワークシートとスライドのセット。Kindle本『公式は、発見できる』も出版しています。', price: '¥500〜', note: 'テンプレート集 ¥1,500／Kindle本 ¥500' },
          ] },
        { id: 'gallery', type: 'gallery', hidden: false, eyebrow: 'MATERIALS', navLabel: '教材', inNav: false, heading: '手を動かして見つける教材', lead: 'レッスンやワークショップで使う教材を、少しずつ増やしています。',
          images: [{ src: 'svg:graph', caption: '関数のグラフを動かして、変化のきまりを調べる' }, { src: 'svg:tiles', caption: '三角形のタイルで、角の和が180°になるわけを見つける' }, { src: 'svg:circles', caption: 'コンパスだけで、正三角形をかいてみる' }] },
        { id: 'pricing', type: 'pricing', hidden: false, eyebrow: 'PRICE', navLabel: '料金', inNav: true, heading: '料金', lead: 'はじめての方は、30分の無料体験からどうぞ。表示はすべて税込です。', badge: 'いちばん人気',
          plans: [
            { name: '無料体験', price: '¥0', unit: '／30分', features: ['いまの悩みや目標をうかがいます', 'おためしで1問、一緒に考えます', '無理な勧誘はしません'], featured: false, ctaLabel: '体験を申し込む' },
            { name: '個別レッスン', price: '¥4,000', unit: '／60分', features: ['一人ひとりに合わせた進め方', '毎回の授業ノートをお渡し', '日程はその都度えらべます'], featured: true, ctaLabel: 'レッスンを相談する' },
            { name: 'ひらめき部', price: '¥980', unit: '／月', features: ['授業ツールが使い放題', '月1回のオンライン会', 'いつでも退会できます'], featured: false, ctaLabel: '入部を申し込む' },
          ], note: '' },
        { id: 'flow', type: 'flow', hidden: false, eyebrow: 'FLOW', navLabel: '流れ', inNav: false, heading: 'はじめるまでの流れ', lead: '',
          steps: [
            { title: 'お問い合わせ', body: '下のフォームから、ご希望と都合のよい日時をお送りください。' },
            { title: '無料体験（30分）', body: 'オンラインで今の様子をうかがい、おためしで1問考えてみます。' },
            { title: '学び方を決める', body: '目標と予算に合わせて、回数や進め方を一緒に決めます。' },
            { title: 'レッスン開始', body: '毎回のノートで、わかったことを積み重ねていきます。' },
          ] },
        { id: 'voices', type: 'voices', hidden: false, eyebrow: 'VOICE', navLabel: '受講した方の声', inNav: false, heading: '受講した方の声', lead: '',
          items: [
            { text: '「どうしてこうなるの？」に毎回つきあってもらえて、関数が怖くなくなりました。点数より、考えるのが楽しくなったのがうれしいです。', name: 'S.Yさん', role: '中学3年生' },
            { text: '子どもが自分から「今日こんなこと見つけた」と話してくれるようになりました。家での声かけのヒントももらえて助かっています。', name: 'K.Mさん', role: '中学1年生の保護者' },
            { text: '40代で学び直しを始めました。図で説明してもらうと、学生のころ丸暗記した公式の意味がやっとわかりました。', name: 'T.Sさん', role: '学び直し講座を受講' },
          ] },
        { id: 'profile', type: 'profile', hidden: false, eyebrow: 'PROFILE', navLabel: '講師紹介', inNav: true, heading: '講師紹介', name: '数野 ひかる', role: 'ひらめき数学舎 代表',
          body: '佐賀県出身。中学・高校で12年間、数学を教えてきました。公式を覚えさせる授業から、公式を見つける授業に切りかえてから、生徒の表情が変わったことが今の活動の原点です。\n\nICTを使った教材づくりが得意で、先生向けの研修や教材の提供もしています。三人の子の親として、家庭での学びにも寄りそいます。',
          image: 'svg:profile', imageAlt: '' },
        { id: 'faq', type: 'faq', hidden: false, eyebrow: 'FAQ', navLabel: 'よくある質問', inNav: true, heading: 'よくある質問',
          items: [
            { q: '数学がかなり苦手ですが、ついていけますか？', a: '大丈夫です。どこでつまずいたのかを一緒に探して、小学校の内容までさかのぼることもあります。わからないと言えることが、いちばんの近道です。' },
            { q: 'オンラインのレッスンには何が必要ですか？', a: 'パソコンかタブレット（スマホでも受けられます）と、インターネットの環境があれば大丈夫です。Zoom または Google Meet を使います。紙とえんぴつもご用意ください。' },
            { q: '学校の教科書や定期テストに合わせてもらえますか？', a: 'はい。お使いの教科書やテストの範囲に合わせて進めます。テスト前は対策中心に切りかえることもできます。' },
            { q: '支払い方法を教えてください。', a: '銀行振込か、クレジットカード（オンライン決済）をお選びいただけます。講座は初回までのお支払いです。' },
          ] },
        { id: 'news', type: 'news', hidden: false, eyebrow: 'NEWS', navLabel: 'お知らせ', inNav: false, heading: 'お知らせ',
          items: [
            { date: rel(-4), text: '大人の学び直し講座（全6回）の、次のクラスの受付を始めました。' },
            { date: rel(-19), text: 'みどり台公民館で、親子で楽しむ「紙で見つける図形」ワークショップを開きました。' },
            { date: rel(-41), text: 'Kindle本『公式は、発見できる』を出版しました。' },
          ] },
        { id: 'cta', type: 'cta', hidden: false, heading: 'まずは、30分の無料体験から。', body: 'いまの悩みを聞かせてください。無理な勧誘はしません。オンラインなので、全国どこからでも受けられます。', buttonLabel: '無料体験を申し込む', buttonHref: '#contact' },
        { id: 'contact', type: 'contact', hidden: false, eyebrow: 'CONTACT', navLabel: 'お問い合わせ', inNav: true, heading: 'お問い合わせ・お申し込み',
          lead: 'ご質問、無料体験のお申し込み、出張ワークショップのご相談など、お気軽にどうぞ。2日以内にメールでお返事します。', showInfo: true },
      ],
      footer: { note: 'オンラインのレッスンは全国どこからでも受けられます。' },
    };
  }
  const SAMPLE = makeSample();

  /* ───────── 公開ページの見た目 ───────── */
  const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;scroll-padding-top:84px}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font-body);font-size:16px;line-height:1.9;letter-spacing:.03em;overflow-wrap:anywhere;line-break:strict;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
@media (min-width:960px){body{font-size:16.5px}}
img,svg{max-width:100%;height:auto}
img{display:block}
h1,h2,h3,p,ul,ol,figure,blockquote{margin:0}
ul,ol{padding:0;list-style:none}
h1,h2,h3{font-family:var(--font-head);font-weight:var(--head-w);line-height:1.45;letter-spacing:.05em;font-feature-settings:"palt";text-wrap:balance;word-break:auto-phrase}
a{color:var(--link);text-underline-offset:.22em;text-decoration-thickness:1px}
a:hover{text-decoration-thickness:2px}
:focus-visible{outline:3px solid var(--link);outline-offset:3px}
[tabindex="-1"]:focus{outline:none}
::selection{background:var(--soft)}
.skip{position:absolute;left:12px;top:-120px;z-index:200;padding:10px 18px;border-radius:8px;background:var(--ink);color:var(--bg);font-weight:700;text-decoration:none}
.skip:focus{top:12px}
.sr-only{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.wrap{width:min(100% - var(--gut) * 2, var(--w));margin-inline:auto}
.ic{flex:none;width:1.25em;height:1.25em}

/* ヘッダー */
.hd{position:sticky;top:0;z-index:50;background:var(--hd-bg);border-bottom:1px solid transparent;transition:border-color .2s,box-shadow .2s}
@supports ((-webkit-backdrop-filter:blur(8px)) or (backdrop-filter:blur(8px))){.hd{-webkit-backdrop-filter:saturate(1.5) blur(12px);backdrop-filter:saturate(1.5) blur(12px)}}
.hd.is-scrolled,.hd.is-open{border-bottom-color:var(--line);box-shadow:0 8px 28px -22px rgba(0,0,0,.45)}
.hd-in{display:flex;align-items:center;gap:clamp(10px,2vw,24px);min-height:68px}
.brand{display:flex;align-items:center;gap:12px;min-width:0;margin-right:auto;color:var(--ink);text-decoration:none}
.brand-mark{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:var(--r-mark);background:var(--accent);color:var(--accent-ink);font-family:var(--font-head);font-weight:700;font-size:19px;line-height:1;letter-spacing:0}
.brand-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--font-head);font-weight:var(--head-w);font-size:clamp(16px,2vw,19px);letter-spacing:.08em}
.gnav ul{display:flex;align-items:center;gap:2px}
.gnav a{display:block;padding:8px 12px;border-radius:8px;color:var(--ink);font-size:14.5px;font-weight:500;letter-spacing:.06em;text-decoration:none;white-space:nowrap}
.gnav a:hover{background:var(--soft)}
.hd-cta{flex:none}
.gnav .is-contact{display:none}
.menu-btn{display:none;flex:none;place-items:center;width:46px;height:46px;padding:0;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);cursor:pointer}
.menu-btn .bars,.menu-btn .bars::before,.menu-btn .bars::after{display:block;width:20px;height:2px;border-radius:2px;background:currentColor;transition:transform .2s,opacity .2s}
.menu-btn .bars{position:relative}
.menu-btn .bars::before,.menu-btn .bars::after{content:"";position:absolute;left:0}
.menu-btn .bars::before{top:-6px}
.menu-btn .bars::after{top:6px}
.hd.is-open .menu-btn .bars{background:transparent}
.hd.is-open .menu-btn .bars::before{transform:translateY(6px) rotate(45deg)}
.hd.is-open .menu-btn .bars::after{transform:translateY(-6px) rotate(-45deg)}
@media (max-width:899px){.gnav{display:none}}
.hd.is-m .menu-btn{display:grid}
.hd.is-m .gnav{display:none;position:absolute;left:0;right:0;top:100%;max-height:calc(100vh - 68px);overflow-y:auto;background:var(--bg);border-bottom:1px solid var(--line);box-shadow:0 24px 40px -28px rgba(0,0,0,.45)}
.hd.is-m.is-open .gnav{display:block}
.hd.is-m .gnav ul{display:block;width:min(100% - var(--gut) * 2, var(--w));margin:0 auto;padding:6px 0 18px}
.hd.is-m .gnav li+li{border-top:1px solid var(--line)}
.hd.is-m .gnav a{padding:15px 4px;border-radius:0;font-size:16px}
.hd.is-m .gnav .is-contact{display:block}
.hd.is-m .gnav .is-contact a{margin-top:12px;border-radius:var(--r-btn);background:var(--accent);color:var(--accent-ink);text-align:center;font-weight:700}
@media (max-width:520px){.hd.is-m .hd-cta{display:none}}

/* ボタン */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:12px 28px;border:1.5px solid transparent;border-radius:var(--r-btn);font:inherit;font-size:15.5px;font-weight:700;letter-spacing:.08em;line-height:1.45;text-align:center;text-decoration:none;cursor:pointer;transition:transform .15s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease,color .2s ease}
.btn .ic{width:18px;height:18px;transition:transform .2s ease}
.btn:hover .ic.arr{transform:translateX(3px)}
.btn-primary{background:var(--accent);color:var(--accent-ink);box-shadow:0 12px 26px -16px var(--shadow)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 30px -16px var(--shadow)}
.btn-ghost{background:transparent;color:var(--ink);border-color:var(--line-strong)}
.btn-ghost:hover{background:var(--soft);border-color:var(--link)}
.btn-sm{min-height:44px;padding:9px 20px;font-size:14.5px}
.btn-block{display:flex;width:100%}
.btn:disabled{opacity:.6;cursor:progress;transform:none}

/* セクション共通 */
.sec{padding-block:var(--sec)}
.sec.alt{background:var(--alt)}
.sec-h{max-width:760px;margin-bottom:clamp(36px,5vw,60px)}
.sec-h.center{margin-inline:auto;text-align:center}
.eyebrow{display:flex;align-items:center;gap:12px;margin-bottom:14px;color:var(--link);font-family:var(--font-body);font-size:12.5px;font-weight:700;letter-spacing:.26em;line-height:1.6}
.eyebrow::before{content:"";flex:none;width:28px;height:2px;border-radius:2px;background:currentColor}
.sec-h.center .eyebrow{justify-content:center}
.sec-h.center .eyebrow::before{display:none}
.sec-h h2{font-size:clamp(25px,3.4vw,38px);line-height:1.5}
.sec-lead{margin-top:18px;color:var(--muted);font-size:clamp(15.5px,1.4vw,17px)}
.sec-lead p+p,.prose p+p{margin-top:1.15em}
.prose{max-width:40em}
.empty-note{padding:28px;border:2px dashed var(--line-strong);border-radius:var(--r);color:var(--muted);text-align:center;font-size:14px}

/* トップ */
.hero{position:relative;overflow:hidden;background:var(--hero-bg);padding-block:clamp(36px,7vw,96px) clamp(56px,9vw,120px)}
.hero-in{position:relative;display:grid;gap:clamp(36px,5vw,64px);align-items:center}
@media (min-width:900px){.hero-split.has-img .hero-in{grid-template-columns:minmax(0,1.06fr) minmax(0,.94fr)}}
.kicker{display:flex;align-items:center;gap:12px;margin-bottom:22px;color:var(--link);font-size:clamp(13px,1.3vw,14.5px);font-weight:700;letter-spacing:.16em;line-height:1.6}
.kicker::before{content:"";flex:none;width:32px;height:2px;border-radius:2px;background:currentColor}
.hero-title{font-size:clamp(34px,5.2vw,60px);line-height:1.34;letter-spacing:.07em}
.hero-lead{margin-top:clamp(18px,2.4vw,28px);max-width:34em;color:var(--muted);font-size:clamp(15.5px,1.4vw,17.5px);line-height:2}
.hero-lead p+p{margin-top:.8em}
.actions{display:flex;flex-wrap:wrap;gap:12px 14px;margin-top:clamp(28px,3.4vw,40px)}
@media (max-width:560px){.hero .actions .btn{flex:1 1 100%}}
.hero-media{position:relative;isolation:isolate}
.hero-media img{width:100%;aspect-ratio:5/4;object-fit:cover;border-radius:var(--r-lg)}
@media (min-width:900px){.hero-split .hero-media::after{content:"";position:absolute;z-index:-1;inset:26px -26px -26px 26px;border-radius:var(--r-lg);background:var(--accent);opacity:.1}}
.hero-center .hero-text{max-width:860px;margin-inline:auto;text-align:center}
.hero-center .kicker{justify-content:center}
.hero-center .kicker::before{display:none}
.hero-center .hero-lead{margin-inline:auto}
.hero-center .actions{justify-content:center}
.hero-center .hero-media{max-width:960px;margin-inline:auto;width:100%}
.hero-center .hero-media img{aspect-ratio:16/7}
.hero-center .hero-media.is-art{max-width:600px}
.hero-center .hero-media.is-art img{aspect-ratio:auto}
.hero-deco{position:absolute;inset:0;pointer-events:none}
.hero-deco::before,.hero-deco::after{content:"";position:absolute;border:1.5px solid var(--accent);border-radius:50%;opacity:.14}
.hero-deco::before{width:420px;height:420px;right:-140px;top:-160px}
.hero-deco::after{width:260px;height:260px;left:-120px;bottom:-110px}
.hero-cover{display:grid;align-items:end;min-height:min(86vh,760px);padding-block:clamp(120px,16vw,200px) clamp(56px,8vw,96px);background:var(--accent);color:var(--accent-ink)}
.hero-cover .hero-in{z-index:1}
.hero-cover .hero-text{max-width:820px}
.hero-cover .kicker,.hero-cover .hero-lead{color:inherit;opacity:.9}
.hero-cover .btn-primary{background:var(--accent-ink);color:var(--accent);box-shadow:none}
.hero-cover .btn-ghost{color:inherit;border-color:currentColor}
.hero-cover .btn-ghost:hover{background:rgba(255,255,255,.12)}
.hero-cover.has-img{color:#fff}
.hero-cover.has-img .btn-primary{background:var(--accent);color:var(--accent-ink)}
.hero-bgimg{position:absolute;inset:0;z-index:0}
.hero-bgimg img{width:100%;height:100%;object-fit:cover}
.hero-bgimg::after{content:"";position:absolute;inset:0;background:rgba(8,10,16,.5)}

/* 紹介 */
.about{display:grid;gap:clamp(32px,5vw,72px);align-items:center}
@media (min-width:900px){.about.has-img{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr)}.about.img-left .about-media{order:-1}}
.about .sec-h{margin-bottom:28px}
.about-media img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--r-lg)}

/* カード */
.cards{display:grid;gap:clamp(16px,2.4vw,24px)}
@media (min-width:680px){.cards.cols-2,.cards.cols-3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:980px){.cards.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}
.cards.cols-1{max-width:640px}
.card{display:flex;flex-direction:column;gap:12px;padding:clamp(24px,3vw,34px);background:var(--surface);border:1px solid var(--line);border-radius:var(--r)}
.card-no{color:var(--link);font-family:var(--font-head);font-size:15px;font-weight:700;letter-spacing:.12em;line-height:1}
.card h3{font-size:clamp(18.5px,2vw,21px)}
.card-body{color:var(--muted);font-size:15.5px}
.card-foot{margin-top:auto;padding-top:16px;border-top:1px dashed var(--line-strong)}
.price{color:var(--ink);font-family:var(--font-head);font-size:19px;font-weight:var(--head-w);letter-spacing:.04em}
.note{margin-top:2px;color:var(--muted);font-size:13.5px}

/* 料金 */
.plans{display:grid;gap:clamp(20px,2.4vw,24px);align-items:stretch}
@media (min-width:760px){.plans.cols-2,.plans.cols-4{grid-template-columns:repeat(2,minmax(0,1fr))}.plans.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (min-width:1100px){.plans.cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}}
.plan{position:relative;display:flex;flex-direction:column;gap:18px;padding:clamp(28px,3vw,36px);background:var(--surface);border:1px solid var(--line);border-radius:var(--r)}
.plan.is-featured{border:2px solid var(--accent);box-shadow:0 28px 56px -38px var(--shadow)}
.plan-badge{position:absolute;top:0;left:50%;transform:translate(-50%,-50%);padding:3px 16px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-size:12.5px;font-weight:700;letter-spacing:.12em;white-space:nowrap}
.plan-name{font-size:19px}
.plan-price{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;padding-bottom:18px;border-bottom:1px solid var(--line)}
.plan-price .amount{font-family:var(--font-head);font-size:clamp(32px,3.4vw,40px);font-weight:var(--head-w);letter-spacing:.02em;line-height:1.2}
.plan-price .unit{color:var(--muted);font-size:14.5px}
.feat{display:grid;gap:10px;font-size:15px}
.feat li{display:flex;align-items:flex-start;gap:10px}
.feat .ic{width:18px;height:18px;margin-top:.32em;color:var(--link)}
.plan .btn{margin-top:auto}
.plans-note{margin-top:24px;color:var(--muted);font-size:14px}

/* 流れ */
.flow{display:grid;gap:32px}
@media (min-width:900px){.flow{grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:28px}}
.step{position:relative;display:flex;flex-direction:column;gap:10px;padding:26px 24px 28px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r)}
.step-no{display:flex;align-items:baseline;gap:8px;color:var(--link);font-size:12px;font-weight:700;letter-spacing:.2em}
.step-no b{font-family:var(--font-head);font-size:34px;font-weight:var(--head-w);letter-spacing:0;line-height:1}
.step h3{font-size:18.5px}
.step p{color:var(--muted);font-size:15px}
.step:not(:last-child)::after{content:"";position:absolute;left:50%;bottom:-23px;width:12px;height:12px;border-right:2.5px solid var(--link);border-bottom:2.5px solid var(--link);transform:translateX(-50%) rotate(45deg);opacity:.7}
@media (min-width:900px){.step:not(:last-child)::after{left:auto;right:-22px;bottom:auto;top:50%;transform:translateY(-50%) rotate(-45deg)}}

/* 声 */
.voices{display:grid;gap:clamp(16px,2.4vw,24px)}
@media (min-width:760px){.voices.cols-2,.voices.cols-3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:1000px){.voices.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}
.voice figure{display:flex;flex-direction:column;gap:18px;height:100%;padding:clamp(26px,3vw,34px);background:var(--surface);border:1px solid var(--line);border-radius:var(--r)}
.voice blockquote{position:relative;padding-top:30px;font-size:15.5px;line-height:2}
.voice blockquote::before{content:"\\201C";position:absolute;top:-16px;left:-4px;color:var(--link);font-family:Georgia,"Times New Roman",serif;font-size:66px;line-height:1;opacity:.45}
.voice figcaption{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;margin-top:auto;padding-top:16px;border-top:1px solid var(--line)}
.v-name{font-weight:700}
.v-role{color:var(--muted);font-size:13.5px}

/* プロフィール */
.prof{display:grid;gap:clamp(28px,4vw,64px);align-items:center}
@media (min-width:820px){.prof.has-img{grid-template-columns:minmax(0,.78fr) minmax(0,1.22fr)}}
.prof-media{width:100%;max-width:300px}
@media (min-width:820px){.prof-media{max-width:none}}
.prof-media img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--r-lg)}
.prof .sec-h{margin-bottom:24px}
.prof-name{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 16px;margin-bottom:18px;font-family:var(--font-head);font-size:clamp(22px,2.6vw,28px);font-weight:var(--head-w);letter-spacing:.12em;line-height:1.5}
.prof-role{color:var(--muted);font-family:var(--font-body);font-size:14px;font-weight:500;letter-spacing:.06em}

/* よくある質問 */
.faq{display:grid;gap:12px;max-width:880px}
.qa{background:var(--surface);border:1px solid var(--line);border-radius:var(--r)}
.qa summary{display:flex;align-items:flex-start;gap:14px;padding:20px 22px;cursor:pointer;list-style:none;font-weight:700;line-height:1.75}
.qa summary::-webkit-details-marker{display:none}
.qa summary:hover .q-text{color:var(--link)}
.q-mark,.a-mark{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;font-family:var(--font-head);font-size:15px;font-weight:700;line-height:1;letter-spacing:0}
.q-mark{background:var(--accent);color:var(--accent-ink)}
.a-mark{background:var(--soft);color:var(--link)}
.q-text{flex:1;min-width:0;padding-top:1px}
.q-icon{flex:none;width:11px;height:11px;margin:9px 4px 0 4px;border-right:2px solid var(--muted);border-bottom:2px solid var(--muted);transform:rotate(45deg);transition:transform .2s}
.qa[open] .q-icon{transform:translateY(4px) rotate(225deg)}
.qa-a{display:flex;align-items:flex-start;gap:14px;padding:0 22px 22px}
.a-text{flex:1;min-width:0;padding-top:1px}
.a-text p+p{margin-top:.8em}

/* お知らせ */
.news{max-width:880px;border-top:1px solid var(--line)}
.news li{display:grid;gap:2px 32px;padding:20px 4px;border-bottom:1px solid var(--line)}
@media (min-width:640px){.news li{grid-template-columns:8.5em minmax(0,1fr)}}
.news time{color:var(--muted);font-size:14px;letter-spacing:.08em;font-variant-numeric:tabular-nums}

/* ギャラリー */
.gallery{display:grid;gap:clamp(14px,2vw,24px)}
@media (min-width:640px){.gallery.cols-2,.gallery.cols-3,.gallery.cols-4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:980px){.gallery.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.gallery.cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}}
.gallery img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--r)}
.gallery figcaption{margin-top:12px;color:var(--muted);font-size:14px;line-height:1.7}

/* 呼びかけ */
.sec-cta{position:relative;overflow:hidden;background:var(--accent);color:var(--accent-ink);padding-block:clamp(64px,9vw,108px)}
.cta-in{position:relative;max-width:780px;text-align:center}
.cta-in h2{color:inherit;font-size:clamp(26px,3.6vw,40px)}
.cta-body{margin-top:18px;opacity:.92}
.cta-body p+p{margin-top:.8em}
.cta-in .actions{justify-content:center}
.btn-invert{background:var(--accent-ink);color:var(--accent);box-shadow:0 14px 30px -18px rgba(0,0,0,.55)}
.btn-invert:hover{transform:translateY(-2px)}
.sec-cta :focus-visible{outline-color:var(--accent-ink)}
.cta-deco{position:absolute;inset:0;pointer-events:none}
.cta-deco::before,.cta-deco::after{content:"";position:absolute;border:1.5px solid currentColor;border-radius:50%;opacity:.16}
.cta-deco::before{width:360px;height:360px;left:-120px;top:-180px}
.cta-deco::after{width:520px;height:520px;right:-220px;bottom:-320px}

/* お問い合わせ */
.contact{display:grid;gap:clamp(32px,5vw,64px);align-items:start}
@media (min-width:960px){.contact{grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr)}}
.contact .sec-h{margin-bottom:30px}
.cinfo{display:grid;gap:16px;font-size:15px}
.cinfo li{display:flex;align-items:flex-start;gap:14px}
.cinfo .ic{width:20px;height:20px;margin-top:4px;color:var(--link)}
.ci-label{display:block;color:var(--muted);font-size:12.5px;letter-spacing:.1em;line-height:1.6}
.ci-sns{display:flex;flex-wrap:wrap;gap:4px 16px}
.form-card{padding:clamp(22px,4vw,44px);background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:0 36px 70px -56px var(--shadow)}
.f-row{display:grid;gap:8px;margin-bottom:22px}
.f-row>label{display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:15px;font-weight:700;line-height:1.6}
.f-tag{padding:1px 8px;border-radius:4px;font-size:11.5px;font-weight:700;letter-spacing:.08em;line-height:1.6}
.f-tag.req{background:var(--accent);color:var(--accent-ink)}
.f-tag.opt{background:var(--alt);color:var(--muted);border:1px solid var(--line)}
.mise-form input,.mise-form select,.mise-form textarea{display:block;width:100%;min-width:0;min-height:52px;margin:0;padding:12px 16px;border:1.5px solid var(--line-strong);border-radius:var(--r-field);background-color:var(--field);color:var(--ink);font:inherit;font-size:16px;line-height:1.6;letter-spacing:.02em}
.mise-form select{-webkit-appearance:none;appearance:none;padding-right:44px;background-image:var(--chev);background-repeat:no-repeat;background-position:right 16px center;background-size:14px 14px}
.mise-form textarea{min-height:180px;resize:vertical}
.mise-form input:focus,.mise-form select:focus,.mise-form textarea:focus{outline:3px solid var(--ring);outline-offset:0;border-color:var(--link)}
.mise-form [aria-invalid="true"]{border-color:var(--err)}
.f-hint{color:var(--muted);font-size:13px;line-height:1.6}
.f-err{color:var(--err);font-size:13.5px;font-weight:700;line-height:1.6}
.f-alert{margin-bottom:22px;padding:12px 16px;border-radius:10px;background:var(--err-wash);color:var(--err);font-size:14.5px;font-weight:700}
.f-privacy{margin:4px 0 22px;color:var(--muted);font-size:13px;line-height:1.7}
.f-after{margin-top:12px;text-align:center}
.hp{position:absolute!important;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden}
.f-done{padding:8px 0;text-align:center}
.f-done .ic{width:52px;height:52px;margin:0 auto 14px;color:var(--link);display:block}
.f-done-b{font-size:16.5px;line-height:1.9}
.f-done-b p:first-child{font-family:var(--font-head);font-weight:var(--head-w);font-size:clamp(18px,2vw,21px);letter-spacing:.04em}
.f-done-b p+p{margin-top:.6em;color:var(--muted)}
.f-note{display:grid;gap:12px;justify-items:center;margin:20px 0 0;padding:16px 18px;border-radius:12px;background:var(--soft);font-size:14.5px;text-align:left}
.f-note.warn{background:var(--warn-wash);border:1px solid var(--warn-line)}
.f-note p{justify-self:stretch}
.f-done .f-again{margin-top:20px}
.f-google{display:grid;gap:18px;justify-items:start}

/* フッター */
.ft{background:var(--foot-bg);color:var(--foot-ink);padding-block:clamp(52px,7vw,84px) 28px;font-size:14.5px}
.ft a{color:inherit;text-decoration-color:var(--foot-line)}
.ft a:hover{text-decoration-color:currentColor}
.ft :focus-visible{outline-color:var(--foot-ink)}
.ft-in{display:grid;gap:36px}
@media (min-width:860px){.ft-in{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) auto;align-items:start}}
.ft-name{display:flex;align-items:center;gap:12px;font-family:var(--font-head);font-size:19px;font-weight:var(--head-w);letter-spacing:.08em}
.ft-name .brand-mark{width:34px;height:34px;font-size:17px;background:var(--foot-ink);color:var(--foot-bg)}
.ft-copy{display:flex;flex-wrap:wrap;align-items:center;gap:6px 20px}
.ft-top{text-decoration:none;white-space:nowrap}
.ft-top:hover{text-decoration:underline}
.ft-tag{margin-top:14px;color:var(--foot-soft)}
.ft-meta{margin-top:6px;color:var(--foot-soft);font-size:13.5px}
.ft-nav ul{display:grid;grid-template-columns:repeat(2,minmax(0,max-content));gap:8px 32px}
.ft-nav a{text-decoration:none;color:var(--foot-soft)}
.ft-nav a:hover{color:var(--foot-ink);text-decoration:underline}
.sns{display:flex;flex-wrap:wrap;gap:10px}
.sns a{display:grid;place-items:center;width:44px;height:44px;border:1px solid var(--foot-line);border-radius:50%;color:var(--foot-ink);transition:background-color .2s}
.sns a:hover{background:var(--foot-line)}
.sns .ic{width:20px;height:20px}
.ft-bottom{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 24px;margin-top:clamp(36px,5vw,56px);padding-top:22px;border-top:1px solid var(--foot-line);color:var(--foot-soft);font-size:13px}
.ft-note{max-width:44em}

/* 問い合わせだけのページ */
.formpage main{min-height:70vh}
.formpage .sec-h h1{font-size:clamp(26px,3.6vw,36px)}

@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}.btn:hover,.btn-primary:hover,.btn-invert:hover{transform:none}}
@media print{.hd,.skip,.menu-btn,.mise-form,.f-done{display:none!important}.sec{padding-block:28px}body{background:#fff}}
`;
  const EDIT_CSS = `
.mise-edit [data-sid]{cursor:pointer}
.mise-edit section[data-sid]{position:relative}
.mise-edit [data-sid]:hover{box-shadow:inset 0 0 0 2px #2563eb}
.mise-edit section[data-sid]::before{content:attr(data-label);position:absolute;z-index:6;top:10px;left:10px;padding:2px 10px;border-radius:6px;background:#2563eb;color:#fff;font:700 12px/1.8 system-ui,sans-serif;letter-spacing:.04em;opacity:0;pointer-events:none;transition:opacity .12s}
.mise-edit section[data-sid]:hover::before{opacity:1}
`;

  // テーマの色・字体・角の丸みを CSS 変数に
  function varsCss(site, c) {
    const t = themeOf(site.theme), f = fontOf(site.font), sh = SHAPES[t.shape] || SHAPES.soft;
    const chev = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M3 6l5 5 5-5" fill="none" stroke="${c.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    return `:root{--bg:${c.bg};--surface:${c.surface};--alt:${c.alt};--ink:${c.ink};--muted:${c.muted};--accent:${c.accent};--accent-ink:${c.accentInk};--link:${c.link};--line:${c.line};--line-strong:${c.lineStrong};--soft:${c.soft};--hero-bg:${c.heroBg};--hd-bg:${c.hdBg};--shadow:${c.shadow};--ring:${c.ring};--err:${c.err};--err-wash:${c.errWash};--warn-wash:${c.warnWash};--warn-line:${c.warnLine};--field:${c.field};--foot-bg:${c.footBg};--foot-ink:${c.footInk};--foot-soft:${c.footSoft};--foot-line:${c.footLine};--font-head:${f.head};--font-body:${f.body};--head-w:${f.w};--r:${sh.r};--r-lg:${sh.rl};--r-btn:${sh.btn};--r-mark:${sh.mark};--r-field:${t.shape === 'square' ? '2px' : '10px'};--w:1080px;--gut:clamp(20px,5vw,48px);--sec:clamp(72px,10vw,124px);--chev:url("${chev}");color-scheme:${c.dark ? 'dark' : 'light'}}`;
  }

  /* ───────── 部品 ───────── */
  const firstChar = (s) => Array.from(str(s).trim())[0] || '・';
  const mark = (name) => `<span class="brand-mark" aria-hidden="true">${esc(firstChar(name))}</span>`;
  const fmtDate = (d) => { const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(str(d)); return m ? m[1] + '.' + pad2(m[2]) + '.' + pad2(m[3]) : esc(d); };
  function imgTag(info, alt, o = {}) {
    if (!info) return '';
    const dims = info.w && info.h ? ` width="${Math.round(info.w)}" height="${Math.round(info.h)}"` : '';
    return `<img src="${esc(info.src)}" alt="${esc(alt)}"${dims} decoding="async"${o.eager ? ' fetchpriority="high"' : ''}>`;
  }
  function linkAttrs(href, e) {
    const u = safeHref(href);
    if (!u) return null;
    if (u.charAt(0) === '#') {
      const id = u.slice(1);
      if (id && id !== 'top' && !e.ids.has(id)) return null; // ないセクションへのボタンは出さない
      return ` href="${esc(u)}"`;
    }
    return ` href="${esc(u)}"` + (isExternal(u) ? ' target="_blank" rel="noopener"' : '');
  }
  function btn(label, href, cls, e, extra) {
    if (!has(label)) return '';
    const a = linkAttrs(href, e);
    if (!a) return '';
    return `<a class="btn ${cls}"${a}${extra || ''}>${esc(label)}${cls.includes('btn-primary') || cls.includes('btn-invert') ? icon('arrow', 'arr') : ''}</a>`;
  }
  // セクションの見出し
  function secHead(s, o = {}) {
    const t = typeOf(s.type);
    const eb = s.eyebrow !== undefined ? s.eyebrow : t.eyebrow;
    const lead = o.lead;
    if (!has(s.heading) && !has(lead)) return '';
    return `<header class="sec-h${o.center ? ' center' : ''}">${has(eb) ? `<p class="eyebrow">${esc(eb)}</p>` : ''}${has(s.heading) ? `<${o.tag || 'h2'} id="${esc(s.id)}-h">${lines(s.heading)}</${o.tag || 'h2'}>` : ''}${has(lead) ? `<div class="sec-lead">${paras(lead)}</div>` : ''}</header>`;
  }
  // セクションの外枠。edit では、クリックで選べるように印をつける
  function section(s, e, cls, inner) {
    const t = typeOf(s.type);
    const label = has(s.heading) ? ` aria-labelledby="${esc(s.id)}-h"` : '';
    const ed = e.mode === 'edit' ? ` data-label="${esc(t.name)}"` : '';
    return `<section id="${esc(s.id)}" class="sec-${s.type}${cls ? ' ' + cls : ''}" data-sid="${esc(s.id)}" data-k="s:${esc(s.id)}"${label}${ed}>${inner}</section>`;
  }
  const emptyNote = (e, text) => (e.mode === 'export' ? '' : `<p class="empty-note">${esc(text)}</p>`);
  const colsFor = (n, max = 3) => (n <= 1 ? 1 : n === 2 ? 2 : n === 4 && max >= 4 ? 4 : n === 4 ? 2 : Math.min(3, max));

  /* ───────── セクションごとの描画 ───────── */
  const R = {
    hero(s, e) {
      const layout = ['split', 'center', 'cover'].includes(s.layout) ? s.layout : 'split';
      const img = e.img(s.image);
      const tag = e.h1Used ? 'h2' : 'h1';
      e.h1Used = true;
      const heading = has(s.heading) ? s.heading : e.name;
      const actions = btn(s.ctaLabel, s.ctaHref || '#contact', 'btn-primary', e) + btn(s.secondaryLabel, s.secondaryHref, 'btn-ghost', e);
      const text = `<div class="hero-text">${has(s.kicker) ? `<p class="kicker">${esc(s.kicker)}</p>` : ''}<${tag} id="${esc(s.id)}-h" class="hero-title">${lines(heading)}</${tag}>${has(s.sub) ? `<div class="hero-lead">${paras(s.sub)}</div>` : ''}${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
      const alt = img && !img.art ? s.imageAlt || '' : '';
      let inner;
      if (layout === 'cover') inner = `${img ? `<div class="hero-bgimg">${imgTag(img, alt, { eager: true })}</div>` : '<div class="hero-deco" aria-hidden="true"></div>'}<div class="wrap hero-in">${text}</div>`;
      else if (layout === 'center') inner = `${img ? '' : '<div class="hero-deco" aria-hidden="true"></div>'}<div class="wrap hero-in">${text}${img ? `<figure class="hero-media${img.art ? ' is-art' : ''}">${imgTag(img, alt, { eager: true })}</figure>` : ''}</div>`;
      else inner = `${img ? '' : '<div class="hero-deco" aria-hidden="true"></div>'}<div class="wrap hero-in">${text}${img ? `<figure class="hero-media">${imgTag(img, alt, { eager: true })}</figure>` : ''}</div>`;
      return section(s, e, `hero hero-${layout}${img ? ' has-img' : ''}`, inner);
    },
    about(s, e, cls) {
      const img = e.img(s.image);
      const body = has(s.body) ? `<div class="prose">${paras(s.body)}</div>` : '';
      if (!img && !body && !has(s.heading)) return e.mode === 'export' ? '' : section(s, e, 'sec ' + cls, `<div class="wrap">${emptyNote(e, '紹介の本文を書いてください')}</div>`);
      const side = s.imageSide === 'left' ? 'left' : 'right';
      return section(s, e, 'sec ' + cls, `<div class="wrap about${img ? ' has-img img-' + side : ''}"><div class="about-text">${secHead(s)}${body}</div>${img ? `<figure class="about-media">${imgTag(img, img.art ? '' : s.imageAlt || '')}</figure>` : ''}</div>`);
    },
    services(s, e, cls) {
      const items = arr(s.items).filter((it) => it && (has(it.title) || has(it.body)));
      if (!items.length && e.mode === 'export' && !has(s.heading)) return '';
      const list = items.length ? `<ul class="cards cols-${colsFor(items.length)}" role="list">${items.map((it, i) => `<li class="card"><p class="card-no" aria-hidden="true">${pad2(i + 1)}</p>${has(it.title) ? `<h3>${lines(it.title)}</h3>` : ''}${has(it.body) ? `<div class="card-body">${paras(it.body)}</div>` : ''}${has(it.price) || has(it.note) ? `<div class="card-foot">${has(it.price) ? `<p class="price">${esc(it.price)}</p>` : ''}${has(it.note) ? `<p class="note">${lines(it.note)}</p>` : ''}</div>` : ''}</li>`).join('')}</ul>` : emptyNote(e, 'サービスを追加してください');
      return section(s, e, 'sec ' + cls, `<div class="wrap">${secHead(s, { lead: s.lead })}${list}</div>`);
    },
    pricing(s, e, cls) {
      const plans = arr(s.plans).filter((p) => p && (has(p.name) || has(p.price)));
      if (!plans.length && e.mode === 'export' && !has(s.heading)) return '';
      const list = plans.length ? `<ul class="plans cols-${colsFor(plans.length, 4)}" role="list">${plans.map((p) => {
        const feats = arr(p.features).map(str).filter((x) => x.trim());
        const cta = e.contactId && has(p.ctaLabel) ? `<a class="btn ${p.featured ? 'btn-primary' : 'btn-ghost'} btn-block" href="#${esc(e.contactId)}" data-kind="${esc(p.name)}">${esc(p.ctaLabel)}</a>` : '';
        return `<li class="plan${p.featured ? ' is-featured' : ''}">${p.featured ? `<p class="plan-badge">${esc(has(s.badge) ? s.badge : 'おすすめ')}</p>` : ''}<h3 class="plan-name">${lines(p.name)}</h3><p class="plan-price"><span class="amount">${esc(p.price)}</span>${has(p.unit) ? `<span class="unit">${esc(p.unit)}</span>` : ''}</p>${feats.length ? `<ul class="feat" role="list">${feats.map((x) => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('')}</ul>` : ''}${cta}</li>`;
      }).join('')}</ul>` : emptyNote(e, 'プランを追加してください');
      return section(s, e, 'sec ' + cls, `<div class="wrap">${secHead(s, { lead: s.lead, center: true })}${list}${has(s.note) ? `<div class="plans-note">${paras(s.note)}</div>` : ''}</div>`);
    },
    flow(s, e, cls) {
      const steps = arr(s.steps).filter((x) => x && (has(x.title) || has(x.body)));
      if (!steps.length && e.mode === 'export' && !has(s.heading)) return '';
      const list = steps.length ? `<ol class="flow" style="--n:${Math.min(steps.length, 5)}" role="list">${steps.map((x, i) => `<li class="step"><p class="step-no">STEP<b>${i + 1}</b></p>${has(x.title) ? `<h3>${lines(x.title)}</h3>` : ''}${has(x.body) ? paras(x.body) : ''}</li>`).join('')}</ol>` : emptyNote(e, '手順を追加してください');
      return section(s, e, 'sec ' + cls, `<div class="wrap">${secHead(s, { lead: s.lead })}${list}</div>`);
    },
    voices(s, e, cls) {
      const items = arr(s.items).filter((x) => x && has(x.text));
      if (!items.length && e.mode === 'export' && !has(s.heading)) return '';
      const list = items.length ? `<ul class="voices cols-${colsFor(items.length)}" role="list">${items.map((v) => `<li class="voice"><figure><blockquote>${paras(v.text)}</blockquote>${has(v.name) || has(v.role) ? `<figcaption>${has(v.name) ? `<span class="v-name">${esc(v.name)}</span>` : ''}${has(v.role) ? `<span class="v-role">${esc(v.role)}</span>` : ''}</figcaption>` : ''}</figure></li>`).join('')}</ul>` : emptyNote(e, '声を追加してください');
      return section(s, e, 'sec ' + cls, `<div class="wrap">${secHead(s, { lead: s.lead })}${list}</div>`);
    },
    profile(s, e, cls) {
      const img = e.img(s.image);
      const alt = img && !img.art ? s.imageAlt || (has(s.name) ? s.name + 'の写真' : '') : '';
      const nm = has(s.name) || has(s.role) ? `<p class="prof-name">${esc(s.name)}${has(s.role) ? `<span class="prof-role">${esc(s.role)}</span>` : ''}</p>` : '';
      return section(s, e, 'sec ' + cls, `<div class="wrap prof${img ? ' has-img' : ''}">${img ? `<figure class="prof-media">${imgTag(img, alt)}</figure>` : ''}<div class="prof-text">${secHead(s)}${nm}${has(s.body) ? `<div class="prose">${paras(s.body)}</div>` : ''}</div></div>`);
    },
    faq(s, e, cls) {
      const items = arr(s.items).filter((x) => x && has(x.q));
      if (!items.length && e.mode === 'export' && !has(s.heading)) return '';
      const list = items.length ? `<div class="faq">${items.map((x, i) => `<details class="qa"${i === 0 ? ' open' : ''}><summary><span class="q-mark" aria-hidden="true">Q</span><span class="q-text">${esc(x.q)}</span><span class="q-icon" aria-hidden="true"></span></summary><div class="qa-a"><span class="a-mark" aria-hidden="true">A</span><div class="a-text">${paras(x.a)}</div></div></details>`).join('')}</div>` : emptyNote(e, '質問を追加してください');
      return section(s, e, 'sec ' + cls, `<div class="wrap">${secHead(s)}${list}</div>`);
    },
    news(s, e, cls) {
      const items = arr(s.items).filter((x) => x && has(x.text)).slice().sort((a, b) => str(b.date).localeCompare(str(a.date)));
      if (!items.length && e.mode === 'export' && !has(s.heading)) return '';
      const list = items.length ? `<ul class="news" role="list">${items.map((x) => `<li>${has(x.date) ? `<time datetime="${esc(x.date)}">${fmtDate(x.date)}</time>` : '<span></span>'}<p>${lines(x.text)}</p></li>`).join('')}</ul>` : emptyNote(e, 'お知らせを追加してください');
      return section(s, e, 'sec ' + cls, `<div class="wrap">${secHead(s)}${list}</div>`);
    },
    gallery(s, e, cls) {
      const imgs = arr(s.images).map((g) => (typeof g === 'string' ? { src: g, caption: '' } : g || {})).map((g) => ({ info: e.img(g.src), caption: str(g.caption) })).filter((g) => g.info);
      if (!imgs.length && e.mode === 'export') return '';
      const list = imgs.length ? `<ul class="gallery cols-${colsFor(imgs.length, 4)}" role="list">${imgs.map((g) => `<li><figure>${imgTag(g.info, g.caption)}${has(g.caption) ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}</figure></li>`).join('')}</ul>` : emptyNote(e, '写真を追加してください');
      return section(s, e, 'sec ' + cls, `<div class="wrap">${secHead(s, { lead: s.lead })}${list}</div>`);
    },
    cta(s, e) {
      const b = btn(s.buttonLabel, s.buttonHref || '#contact', 'btn-invert', e);
      if (!has(s.heading) && !has(s.body) && !b) return e.mode === 'export' ? '' : section(s, e, 'sec-cta', `<div class="wrap cta-in">${emptyNote(e, '見出しを書いてください')}</div>`);
      return section(s, e, 'sec-cta', `<div class="cta-deco" aria-hidden="true"></div><div class="wrap cta-in">${has(s.heading) ? `<h2 id="${esc(s.id)}-h">${lines(s.heading)}</h2>` : ''}${has(s.body) ? `<div class="cta-body">${paras(s.body)}</div>` : ''}${b ? `<div class="actions">${b}</div>` : ''}</div>`);
    },
    contact(s, e, cls) {
      const info = s.showInfo !== false ? contactInfo(e.profile) : '';
      return section(s, e, 'sec ' + cls, `<div class="wrap contact"><div class="contact-text">${secHead(s, { lead: has(s.lead) ? s.lead : e.form.lead })}${info}</div><div class="form-card">${formBlock(e.form, e, 'f-' + s.id)}</div></div>`);
    },
  };

  function contactInfo(p) {
    const rows = [];
    if (has(p.email)) rows.push(`<li>${icon('mail')}<div><span class="ci-label">メール</span><a href="mailto:${esc(p.email.trim())}">${esc(p.email.trim())}</a></div></li>`);
    if (has(p.phone)) rows.push(`<li>${icon('phone')}<div><span class="ci-label">電話</span><a href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}">${esc(p.phone)}</a></div></li>`);
    if (has(p.area)) rows.push(`<li>${icon('pin')}<div><span class="ci-label">地域</span>${esc(p.area)}</div></li>`);
    const sns = snsList(p);
    if (sns.length) rows.push(`<li>${icon('link')}<div><span class="ci-label">SNS</span><span class="ci-sns">${sns.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join('')}</span></div></li>`);
    return rows.length ? `<ul class="cinfo" role="list">${rows.join('')}</ul>` : '';
  }

  // 問い合わせフォーム（form doc から）。送り方はページのスクリプトが決める
  function formBlock(form, e, idp) {
    const F = form, d = F.delivery;
    if (d.type === 'google' && d.ready) {
      return `<div class="f-google"><p>お問い合わせは、Googleフォームで受け付けています。下のボタンから開いてください。</p><a class="btn btn-primary" href="${esc(d.url)}" target="_blank" rel="noopener">お問い合わせフォームを開く${icon('external')}</a></div>`;
    }
    const tag = (r) => (r ? '<span class="f-tag req">必須</span>' : '<span class="f-tag opt">任意</span>');
    const row = (k, label, r, control, hint) => {
      const id = idp + '-' + k;
      return `<div class="f-row"><label for="${id}">${esc(label)}${tag(r)}</label>${hint ? `<p class="f-hint" id="${id}-hint">${esc(hint)}</p>` : ''}${control(id, ` aria-describedby="${hint ? id + '-hint ' : ''}${id}-err"`)}<p class="f-err" id="${id}-err" hidden></p></div>`;
    };
    const req = (msg) => ` required data-req="${esc(msg)}"`;
    const parts = [];
    if (F.kinds.length) parts.push(row('kind', 'ご用件', true, (id, db) => `<select id="${id}" name="kind"${req('ご用件を選んでください')}${db}><option value="">選んでください</option>${F.kinds.map((k) => `<option>${esc(k)}</option>`).join('')}</select>`));
    parts.push(row('name', 'お名前', true, (id, db) => `<input id="${id}" type="text" name="name" autocomplete="name" maxlength="80"${req('お名前を入れてください')}${db}>`));
    parts.push(row('email', 'メールアドレス', true, (id, db) => `<input id="${id}" type="email" name="email" autocomplete="email" inputmode="email" maxlength="120"${req('メールアドレスを入れてください')}${db}>`));
    if (F.fields.phone) parts.push(row('phone', '電話番号', false, (id, db) => `<input id="${id}" type="tel" name="phone" autocomplete="tel" inputmode="tel" maxlength="30"${db}>`));
    if (F.fields.date) parts.push(row('date', 'ご希望の日時', false, (id, db) => `<input id="${id}" type="datetime-local" name="date" step="900"${db}>`, 'だいたいで大丈夫です。ほかの候補は、お問い合わせ内容へどうぞ。'));
    if (F.fields.source) parts.push(row('source', 'どこで知りましたか', false, (id, db) => `<select id="${id}" name="source"${db}><option value="">選んでください</option>${F.sources.map((x) => `<option>${esc(x)}</option>`).join('')}</select>`));
    parts.push(row('message', 'お問い合わせ内容', true, (id, db) => `<textarea id="${id}" name="message" rows="6" maxlength="4000"${req('お問い合わせ内容を書いてください')}${db}></textarea>`));
    const hidden = F.fields.source ? '' : '<input type="hidden" name="source" value="">';
    const hp = `<div class="hp" aria-hidden="true"><label for="${idp}-website">ウェブサイト（空欄のままにしてください）</label><input id="${idp}-website" type="text" name="website" tabindex="-1" autocomplete="off"></div>`;
    let action = '';
    if (e.mode === 'export' && d.ready && d.type === 'url') action = ` action="${esc(d.url)}" method="post"`;
    if (e.mode === 'export' && d.ready && d.type === 'mailto') action = ` action="mailto:${esc(d.to)}" method="post" enctype="text/plain"`;
    const after = e.mode === 'export' && d.ready && d.type === 'mailto' ? '<p class="f-hint f-after">送信すると、メールアプリが開きます。</p>' : '';
    const formHtml = `<form class="mise-form" data-delivery="${esc(d.type)}"${action}><p class="f-alert" role="alert" hidden></p>${parts.join('')}${hidden}${hp}${has(F.privacy) ? `<p class="f-privacy">${lines(F.privacy)}</p>` : ''}<button class="btn btn-primary btn-block" type="submit">送信する</button>${after}</form>`;
    const doneHtml = `<div class="f-done" tabindex="-1" role="status" hidden>${icon('done')}<div class="f-done-b">${paras(has(F.thanks) ? F.thanks : '送信しました。お問い合わせありがとうございます。')}</div><div class="f-note" hidden></div><button type="button" class="btn btn-ghost btn-sm f-again">もうひとつ送る</button></div>`;
    return `<div class="f-wrap">${formHtml}${doneHtml}</div>`;
  }

  /* ───────── 公開ページの中で動くスクリプト（文字列にして埋めこむ。外の変数は使えない） ───────── */
  function PAGE() {
    var d = document, w = window, C = {}, sel = '';
    var inFrame = false;
    try { inFrame = w.parent && w.parent !== w; } catch (e) { inFrame = false; }
    var reduce = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function $(s, r) { return (r || d).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
    function readCfg() { try { C = JSON.parse(d.getElementById('mise-config').textContent) || {}; } catch (e) { C = {}; } }
    function send(m) { if (inFrame) { try { w.parent.postMessage(m, '*'); } catch (e) { /* 親に届かなくても続ける */ } } }
    function scrollY() { return w.pageYOffset || d.documentElement.scrollTop || 0; }
    function scrollToY(y) { try { w.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { w.scrollTo(0, Math.max(0, y)); } }
    function headH() { var hd = $('.hd'); return hd ? hd.getBoundingClientRect().height : 0; }

    // ヘッダー：狭い画面や項目が入りきらないときはメニューボタンに
    function setMenu(open) {
      var hd = $('.hd'), b = $('.menu-btn');
      if (!hd || !b) return;
      hd.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      var t = $('.sr-only', b);
      if (t) t.textContent = open ? 'メニューを閉じる' : 'メニューを開く';
    }
    function fit() {
      var hd = $('.hd');
      if (!hd) return;
      var nav = $('.gnav', hd), inner = $('.hd-in', hd), name = $('.brand-name', hd);
      hd.classList.remove('is-m');
      var m = !!nav && (w.innerWidth < 900 || inner.scrollWidth > inner.clientWidth + 1 || (name && name.scrollWidth > name.clientWidth + 1));
      hd.classList.toggle('is-m', m);
      if (!m) setMenu(false);
    }
    function onScroll() { var hd = $('.hd'); if (hd) hd.classList.toggle('is-scrolled', scrollY() > 4); }
    function goTo(id, focus) {
      var t = id && id !== 'top' ? d.getElementById(id) : null;
      if (id && id !== 'top' && !t) return false;
      scrollToY(t ? t.getBoundingClientRect().top + scrollY() - headH() : 0);
      if (t && focus) {
        if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
        try { t.focus({ preventScroll: true }); } catch (e) { /* 古いブラウザ */ }
      }
      return true;
    }

    d.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      if (t.closest('.menu-btn')) { var hd = $('.hd'); setMenu(!(hd && hd.classList.contains('is-open'))); return; }
      if (t.closest('.f-again')) { again(t.closest('.f-wrap')); return; }
      var s = C.mode === 'edit' ? t.closest('[data-sid]') : null;
      if (s) send({ type: 'mise:select', id: s.getAttribute('data-sid') });
      var a = t.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') {
        ev.preventDefault();
        if (s && s.tagName === 'SECTION') return; // 編集中：セクションの中のボタンは「選ぶ」だけ
        setMenu(false);
        var id = '';
        try { id = decodeURIComponent(href.slice(1)); } catch (e) { id = href.slice(1); }
        if (goTo(id, true) && C.mode === 'export' && id !== 'top') { try { history.pushState(null, '', href); } catch (e) { /* 無視 */ } }
        var k = a.getAttribute('data-kind');
        if (k) presetKind(k);
        return;
      }
      if (C.mode !== 'export') { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
    });
    d.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      var hd = $('.hd');
      if (hd && hd.classList.contains('is-open')) { setMenu(false); var b = $('.menu-btn'); if (b) b.focus(); }
    });

    // フォーム
    function val(f, n) { var el = f.elements[n]; return el && typeof el.value === 'string' ? el.value.trim() : ''; }
    function check(el) {
      if (!el.id || el.type === 'hidden' || el.name === 'website') return true;
      var v = String(el.value || '').trim(), msg = '';
      if (el.hasAttribute('data-req') && !v) msg = el.getAttribute('data-req');
      else if (v && el.type === 'email' && !EMAIL.test(v)) msg = 'メールアドレスの形を確かめてください（例：name@example.com）';
      var e = d.getElementById(el.id + '-err');
      if (e) { e.textContent = msg; e.hidden = !msg; }
      if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      return !msg;
    }
    function alertBox(f, msg) { var a = $('.f-alert', f); if (a) { a.textContent = msg; a.hidden = !msg; } }
    function validate(f) {
      var bad = null;
      $$('input, select, textarea', f).forEach(function (el) { if (!check(el) && !bad) bad = el; });
      if (bad) { alertBox(f, '入力が足りない所があります。赤い文字の所を確かめてください。'); bad.focus(); return false; }
      alertBox(f, '');
      return true;
    }
    function recheck(ev) { var el = ev.target; if (el && el.getAttribute && el.getAttribute('aria-invalid') === 'true') check(el); }
    d.addEventListener('input', recheck, true);
    d.addEventListener('change', recheck, true);
    function subject(x) { return '【お問い合わせ】' + (x.kind || 'ご相談') + '（' + (x.name || '') + '様）'; }
    function when(v) {
      var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v || '');
      return m ? (+m[1]) + '年' + (+m[2]) + '月' + (+m[3]) + '日' + (m[4] ? ' ' + m[4] + ':' + m[5] : '') : v;
    }
    function mailto(to, x) {
      var L = [];
      if (x.kind) L.push('ご用件：' + x.kind);
      L.push('お名前：' + x.name, 'メール：' + x.email);
      if (x.phone) L.push('電話：' + x.phone);
      if (x.date) L.push('ご希望の日時：' + when(x.date));
      if (x.source) L.push('どこで知ったか：' + x.source);
      L.push('', '【お問い合わせ内容】', x.message);
      var addr = /^[^\s@?&#]+@[^\s@?&#]+$/.test(to || '') ? to : encodeURIComponent(to || '');
      return 'mailto:' + addr + '?subject=' + encodeURIComponent(subject(x)) + '&body=' + encodeURIComponent(L.join('\r\n'));
    }
    function busy(f, on) {
      var b = $('button[type="submit"]', f);
      if (on) { f.setAttribute('data-busy', '1'); if (b) { b.disabled = true; b.setAttribute('data-label', b.textContent); b.textContent = '送信中…'; } }
      else { f.removeAttribute('data-busy'); if (b) { b.disabled = false; b.textContent = b.getAttribute('data-label') || '送信する'; } }
    }
    function done(f, x) {
      var wrap = f.closest('.f-wrap'), box = wrap && $('.f-done', wrap);
      if (!box) return;
      var n = $('.f-note', box);
      n.textContent = '';
      n.className = 'f-note' + (x.warn ? ' warn' : '');
      if (x.note) { var p = d.createElement('p'); p.textContent = x.note; n.appendChild(p); }
      if (x.mail) {
        var a = d.createElement('a');
        a.className = 'btn btn-primary btn-sm';
        a.href = x.mail;
        a.textContent = x.mailLabel || 'メールで送る';
        if (C.mode !== 'export') { a.target = '_blank'; a.rel = 'noopener'; }
        n.appendChild(a);
      }
      n.hidden = !n.firstChild;
      f.hidden = true;
      box.hidden = false;
      try { box.focus({ preventScroll: true }); } catch (e) { box.focus(); }
      var r = box.getBoundingClientRect();
      if (r.top < headH() || r.bottom > w.innerHeight) scrollToY(r.top + scrollY() - headH() - 24);
    }
    function again(wrap) {
      if (!wrap) return;
      var f = $('form', wrap), box = $('.f-done', wrap);
      f.reset();
      presetSource();
      f.hidden = false;
      box.hidden = true;
      var first = $('select, input:not([type="hidden"]), textarea', f);
      if (first) first.focus();
    }
    d.addEventListener('submit', function (ev) {
      var f = ev.target;
      if (!f || !f.classList || !f.classList.contains('mise-form')) return;
      ev.preventDefault();
      readCfg();
      if (f.getAttribute('data-busy') || !validate(f)) return;
      var data = { kind: val(f, 'kind'), name: val(f, 'name'), email: val(f, 'email'), phone: val(f, 'phone'), date: val(f, 'date'), source: val(f, 'source'), message: val(f, 'message'), page: C.mode === 'export' ? location.href : 'preview', at: new Date().toISOString() };
      if (val(f, 'website')) { done(f, {}); return; } // ロボットらしい送信は、送ったふりだけ
      var dl = C.delivery || {};
      if (C.mode !== 'export') {
        send({ type: 'mise:inquiry', data: data });
        done(f, { note: 'これはプレビューでの試し送信です。内容は受付箱に入りました。' });
        return;
      }
      if (dl.ready && dl.type === 'mailto') {
        var url = mailto(dl.to, data);
        done(f, { note: 'メールアプリに内容を入れました。そのまま送信してください。メールアプリが開かない場合は、' + dl.to + ' までご連絡ください。', mail: url, mailLabel: 'メールアプリを開く' });
        try { location.href = url; } catch (e) { /* 開けない環境 */ }
        return;
      }
      if (dl.ready && (dl.type === 'url' || dl.type === 'gas')) {
        busy(f, true);
        var p;
        try {
          if (dl.type === 'url') {
            var fd = new FormData();
            Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
            fd.append('_subject', subject(data));
            p = fetch(dl.url, { method: 'POST', body: fd, headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
          } else {
            p = fetch(dl.url, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) });
          }
        } catch (e) { p = Promise.reject(e); }
        p.then(function () { busy(f, false); done(f, {}); }, function () {
          busy(f, false);
          alertBox(f, '送信できませんでした。通信の状態を確かめて、もう一度お試しください。' + (C.email ? 'お急ぎの場合は ' + C.email + ' までメールでご連絡ください。' : ''));
        });
        return;
      }
      // 送信先がまだ決まっていないフォーム：内容が消えないよう、メールで送る道を出す
      done(f, {
        warn: true,
        note: 'ただし、このフォームはまだ送信先につながっていないため、内容は届いていません。' + (C.email ? 'お手数ですが、下のボタンからメールでお送りください（入力した内容が入ります）。' : 'お手数ですが、別の方法でご連絡ください。'),
        mail: C.email ? mailto(C.email, data) : '',
        mailLabel: 'メールで送る',
      });
    });
    function presetSource() {
      var v = '';
      try { v = new URLSearchParams(location.search).get(C.sourceParam || 'from') || ''; } catch (e) { v = ''; }
      v = v.trim().slice(0, 60);
      if (!v) return;
      $$('form.mise-form').forEach(function (f) {
        var el = f.elements.source;
        if (!el) return;
        if (el.tagName === 'SELECT') {
          var hit = null, lv = v.toLowerCase();
          Array.prototype.forEach.call(el.options, function (o) { if (!hit && o.value && o.value.toLowerCase() === lv) hit = o; });
          if (!hit) { hit = new Option(v, v); el.appendChild(hit); }
          el.value = hit.value;
        } else el.value = v;
      });
    }
    function presetKind(name) {
      $$('form.mise-form').forEach(function (f) {
        var el = f.elements.kind, msg = f.elements.message, hit = null;
        if (el && el.tagName === 'SELECT') Array.prototype.forEach.call(el.options, function (o) { if (!hit && o.value && (o.value.indexOf(name) >= 0 || name.indexOf(o.value) >= 0)) hit = o; });
        if (hit) el.value = hit.value;
        else if (msg && !msg.value.trim()) msg.value = name + 'について\n';
      });
    }
    function years() { $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); }); }

    // エディターから：差分だけ入れかえる（スクロール位置を保つ）・選んだセクションに印
    function sync(oldP, newP) {
      var olds = {}, next = [], i;
      Array.prototype.forEach.call(oldP.children, function (c) { var k = c.getAttribute('data-k'); if (k) olds[k] = c; });
      Array.prototype.forEach.call(newP.children, function (n) {
        var k = n.getAttribute('data-k'), o = k ? olds[k] : null;
        if (o && k === 'main') { sync(o, n); next.push(o); return; }
        if (o && o.outerHTML === n.outerHTML) { next.push(o); return; }
        next.push(d.importNode(n, true));
      });
      for (i = 0; i < next.length; i++) if (oldP.children[i] !== next[i]) oldP.insertBefore(next[i], oldP.children[i] || null);
      while (oldP.children.length > next.length) oldP.removeChild(oldP.lastElementChild);
    }
    function patch(html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      ['mise-style', 'mise-font'].forEach(function (id) {
        var a = d.getElementById(id), b = doc.getElementById(id);
        if (!a || !b) return;
        if (a.tagName === 'LINK') { if (a.getAttribute('href') !== b.getAttribute('href')) a.setAttribute('href', b.getAttribute('href')); }
        else if (a.textContent !== b.textContent) a.textContent = b.textContent;
      });
      d.title = doc.title;
      d.documentElement.className = doc.documentElement.className;
      sync(d.body, doc.body);
      after();
    }
    function applySel() {
      var st = d.getElementById('mise-sel');
      if (st) st.textContent = sel ? '[data-sid="' + sel.replace(/["\\]/g, '') + '"]{box-shadow:inset 0 0 0 3px #2563eb!important}' : '';
    }
    function select(id, scroll) {
      sel = String(id || '');
      applySel();
      if (!scroll || !sel || sel === '__site') return;
      var el = d.querySelector('[data-sid="' + sel.replace(/["\\]/g, '') + '"]');
      if (el) scrollToY(el.getBoundingClientRect().top + scrollY() - headH());
    }
    function after() { readCfg(); fit(); onScroll(); presetSource(); years(); applySel(); $$('form.mise-form').forEach(function (f) { f.noValidate = true; }); }
    function onMsg(ev) {
      if (ev.source !== w.parent) return;
      var m = ev.data;
      if (!m || typeof m !== 'object') return;
      if (m.type === 'mise:update' && typeof m.html === 'string') patch(m.html);
      else if (m.type === 'mise:focus') select(m.id, !!m.scroll);
    }

    after();
    w.addEventListener('resize', fit);
    w.addEventListener('scroll', onScroll, { passive: true });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(fit, function () { /* 字体が読めなくても続ける */ });
    if (inFrame && C.mode !== 'export') { w.addEventListener('message', onMsg); send({ type: 'mise:ready' }); }
  }
  const PAGE_JS = '(' + PAGE.toString() + ')();';

  /* ───────── ページの組み立て ───────── */
  function envFor(site, ctx) {
    const mode = ['export', 'preview', 'edit'].includes(ctx && ctx.mode) ? ctx.mode : 'export';
    const profile = normProfile(ctx && ctx.profile);
    const form = normForm(ctx && ctx.form);
    const images = (ctx && ctx.images) || {};
    const c = palette(site);
    const name = has(profile.name) ? profile.name.trim() : has(site.meta.title) ? site.meta.title.split(/[｜|]/)[0].trim() : 'ホームページ';
    return { mode, profile, form, images, c, name, site, ids: new Set(), h1Used: false, contactId: '', img: (ref) => imageInfo(ref, images, c) };
  }
  function absUrl(u) { return /^https?:\/\/[^\s]+$/i.test(str(u).trim()) ? str(u).trim() : ''; }
  function ogImageUrl(site, e) {
    const info = imageInfo(site.meta.ogImage, e.images, e.c);
    const base = absUrl(site.publishedUrl);
    if (!info || info.art || !base) return '';
    try {
      const b = new URL(base);
      if (!/\.[a-z0-9]+$/i.test(b.pathname)) b.pathname = b.pathname.replace(/\/?$/, '/');
      return new URL('ogp.' + ogExt(info.src), b).href;
    } catch (err) { return ''; }
  }
  const ogExt = (src) => { const m = /^data:image\/(png|jpe?g|webp|gif)/i.exec(str(src)); return m ? (m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase()) : 'jpg'; };
  function favicon(name, c) {
    return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${c.accent}"/><text x="32" y="45" text-anchor="middle" font-size="36" font-weight="700" font-family="Hiragino Sans, Yu Gothic, Meiryo, sans-serif" fill="${c.accentInk}">${esc(firstChar(name))}</text></svg>`);
  }
  function headHtml(site, e, o) {
    const f = fontOf(site.font), url = absUrl(site.publishedUrl), og = ogImageUrl(site, e);
    const p = e.profile;
    const ld = { '@context': 'https://schema.org', '@type': 'Organization', name: e.name };
    if (url) ld.url = url;
    if (has(o.desc)) ld.description = o.desc;
    if (has(p.email)) ld.email = p.email.trim();
    if (has(p.phone)) ld.telephone = p.phone.trim();
    if (has(p.area)) ld.areaServed = p.area.trim();
    const same = snsList(p).map((x) => x.url);
    if (same.length) ld.sameAs = same;
    if (has(p.owner)) ld.founder = { '@type': 'Person', name: p.owner.trim() };
    return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
${url && !o.noCanonical ? `<link rel="canonical" href="${esc(o.canonical || url)}">\n` : ''}<meta name="theme-color" content="${esc(e.c.bg)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ja_JP">
<meta property="og:site_name" content="${esc(e.name)}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
${url ? `<meta property="og:url" content="${esc(o.canonical || url)}">\n` : ''}${og ? `<meta property="og:image" content="${esc(og)}">\n` : ''}<meta name="twitter:card" content="${og ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.desc)}">
${og ? `<meta name="twitter:image" content="${esc(og)}">\n` : ''}<link rel="icon" href="${esc(favicon(e.name, e.c))}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link id="mise-font" rel="stylesheet" href="https://fonts.googleapis.com/css2?${f.q}&amp;display=swap">
<style id="mise-style">${varsCss(site, e.c)}${BASE_CSS}${e.mode === 'edit' ? EDIT_CSS : ''}</style>
${e.mode === 'edit' ? '<style id="mise-sel"></style>\n' : ''}${e.mode === 'export' ? `<script type="application/ld+json">${jsonIn(ld)}</script>\n` : ''}</head>`;
  }
  function headerHtml(e, nav, o = {}) {
    const ed = e.mode === 'edit' ? ' data-sid="__site"' : '';
    const contact = e.contactId ? nav.find((n) => n.contact) : null;
    const navHtml = nav.length ? `<nav class="gnav" id="gnav" aria-label="ページ内のメニュー"><ul role="list">${nav.map((n) => `<li${n.contact ? ' class="is-contact"' : ''}><a href="#${esc(n.id)}">${esc(n.label)}</a></li>`).join('')}</ul></nav>` : '';
    const cta = e.contactId ? `<a class="btn btn-primary btn-sm hd-cta" href="#${esc(e.contactId)}">${esc(contact ? contact.label : 'お問い合わせ')}</a>` : '';
    const menu = nav.length ? '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="gnav"><span class="sr-only">メニューを開く</span><span class="bars" aria-hidden="true"></span></button>' : '';
    const home = o.home ? ` href="${esc(o.home)}"` : ' href="#top"';
    return `<header class="hd" id="top" data-k="hd"${ed}><div class="wrap hd-in"><a class="brand"${home}>${mark(e.name)}<span class="brand-name">${esc(e.name)}</span></a>${navHtml}${cta}${menu}</div></header>`;
  }
  function footerHtml(site, e, nav) {
    const p = e.profile, sns = snsList(p);
    const ed = e.mode === 'edit' ? ' data-sid="__site"' : '';
    const meta = [p.area, p.email].filter(has).map((x) => esc(x.trim())).join('　');
    return `<footer class="ft" data-k="ft"${ed}><div class="wrap ft-in"><div><p class="ft-name">${mark(e.name)}<span>${esc(e.name)}</span></p>${has(p.tagline) ? `<p class="ft-tag">${esc(p.tagline)}</p>` : ''}${meta ? `<p class="ft-meta">${meta}</p>` : ''}</div>${nav.length ? `<nav class="ft-nav" aria-label="フッターのメニュー"><ul role="list">${nav.map((n) => `<li><a href="#${esc(n.id)}">${esc(n.label)}</a></li>`).join('')}</ul></nav>` : '<div></div>'}${sns.length ? `<ul class="sns" role="list">${sns.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener" aria-label="${esc(x.label)}（新しいタブで開きます）" title="${esc(x.label)}">${icon(x.k)}</a></li>`).join('')}</ul>` : ''}</div><div class="wrap ft-bottom">${has(site.footer.note) ? `<p class="ft-note">${lines(site.footer.note)}</p>` : '<span></span>'}<p class="ft-copy"><small>© <span data-year>${new Date().getFullYear()}</span> ${esc(e.name)}</small><a class="ft-top" href="#top">ページの先頭へ ↑</a></p></div></footer>`;
  }
  function scriptsHtml(e) {
    const cfg = { mode: e.mode, delivery: { type: e.form.delivery.type, to: e.form.delivery.to, url: e.form.delivery.url, ready: e.form.delivery.ready }, sourceParam: e.form.sourceParam, email: has(e.profile.email) ? e.profile.email.trim() : '' };
    return `<script type="application/json" id="mise-config" data-k="cfg">${jsonIn(cfg)}</script>\n<script data-k="js">${PAGE_JS}</script>`;
  }

  // 中身がなくて、公開しても意味のないセクション（書き出しでは出さない。編集中は「追加してください」と出す）
  function isEmpty(s, e) {
    const some = (list, f) => arr(list).some((x) => x && f(x));
    switch (s.type) {
      case 'services': return !some(s.items, (x) => has(x.title) || has(x.body));
      case 'pricing': return !some(s.plans, (x) => has(x.name) || has(x.price));
      case 'flow': return !some(s.steps, (x) => has(x.title) || has(x.body));
      case 'voices': return !some(s.items, (x) => has(x.text));
      case 'faq': return !some(s.items, (x) => has(x.q));
      case 'news': return !some(s.items, (x) => has(x.text));
      case 'gallery': return !arr(s.images).some((g) => e.img(typeof g === 'string' ? g : g && g.src));
      case 'about': return !has(s.heading) && !has(s.body) && !e.img(s.image);
      case 'profile': return !has(s.heading) && !has(s.name) && !has(s.body) && !e.img(s.image);
      case 'cta': return !has(s.heading) && !has(s.body) && !has(s.buttonLabel);
      default: return false;
    }
  }

  // 完全な1枚のHTML。ctx = { profile, form, images: {id: dataUrl}, mode: 'export'|'preview'|'edit' }
  function html(site0, ctx) {
    const site = normalize(site0);
    const e = envFor(site, ctx || {});
    const visible = site.sections.filter((s) => !s.hidden && !(e.mode === 'export' && isEmpty(s, e)));
    for (const s of visible) e.ids.add(s.id);
    const contact = visible.find((s) => s.type === 'contact');
    e.contactId = contact ? contact.id : '';
    const nav = site.nav ? visible.filter((s) => s.type !== 'hero' && s.type !== 'cta' && s.inNav !== false && has(s.heading)).map((s) => ({ id: s.id, label: has(s.navLabel) ? s.navLabel.trim() : typeOf(s.type).nav || s.heading, contact: s.type === 'contact' })) : [];
    let alt = false;
    const body = [];
    for (const s of visible) {
      const r = R[s.type];
      if (!r) continue;
      let cls = '';
      if (s.type !== 'hero' && s.type !== 'cta') { cls = alt ? 'alt' : ''; alt = !alt; }
      else if (s.type === 'cta') alt = false;
      body.push(r(s, e, cls));
    }
    const p = e.profile;
    const title = has(site.meta.title) ? site.meta.title.trim() : [e.name, p.tagline].filter(has).join('｜');
    const desc = (has(site.meta.description) ? site.meta.description : has(p.about) ? p.about : p.tagline).replace(/\s+/g, ' ').trim().slice(0, 160);
    const h1 = e.h1Used ? '' : `<h1 class="sr-only" data-k="h1">${esc(e.name)}</h1>`;
    const empty = !body.join('').trim() && e.mode !== 'export' ? '<div class="wrap sec" data-k="empty"><p class="empty-note">表示するセクションがありません。エディターで追加してください。</p></div>' : '';
    return `<!doctype html>
<html lang="ja"${e.mode === 'edit' ? ' class="mise-edit"' : ''}>
${headHtml(site, e, { title, desc })}
<body>
<a class="skip" href="#main" data-k="skip">本文へ移動</a>
${headerHtml(e, nav)}
<main id="main" data-k="main">${h1}${body.join('\n')}${empty}</main>
${footerHtml(site, e, nav)}
${scriptsHtml(e)}
</body>
</html>
`;
  }

  // 問い合わせフォームだけのページ（Instagram のプロフィール欄などに載せる）
  function formPage(form, profile, site0, ctx) {
    const site = normalize(site0 || SAMPLE);
    const e = envFor(site, Object.assign({}, ctx || {}, { profile, form }));
    const F = e.form;
    const home = absUrl(site.publishedUrl) || absUrl(e.profile.url) || './';
    const title = (has(F.title) ? F.title.trim() : 'お問い合わせ') + '｜' + e.name;
    const desc = (has(F.lead) ? F.lead : e.name + 'へのお問い合わせはこちらから。').replace(/\s+/g, ' ').trim().slice(0, 160);
    const canonical = absUrl(site.publishedUrl) ? (() => { try { const b = new URL(site.publishedUrl); if (!/\.[a-z0-9]+$/i.test(b.pathname)) b.pathname = b.pathname.replace(/\/?$/, '/'); return new URL('form.html', b).href; } catch (err) { return ''; } })() : '';
    const sec = { id: 'contact', type: 'contact', heading: has(F.title) ? F.title : 'お問い合わせ', eyebrow: 'CONTACT' };
    return `<!doctype html>
<html lang="ja">
${headHtml(site, e, { title, desc, canonical, noCanonical: !canonical })}
<body class="formpage">
<a class="skip" href="#main" data-k="skip">本文へ移動</a>
${headerHtml(e, [], { home })}
<main id="main" data-k="main"><section class="sec" aria-labelledby="contact-h"><div class="wrap" style="--w:760px">${secHead(sec, { lead: F.lead, tag: 'h1' })}<div class="form-card">${formBlock(F, e, 'f-contact')}</div>${e.mode === 'export' && home !== './' ? `<p class="f-after"><a href="${esc(home)}">ホームページを見る</a></p>` : ''}</div></section></main>
${footerHtml(site, e, [])}
${scriptsHtml(e)}
</body>
</html>
`;
  }

  /* ───────── ホームページとエディターで共通の小物（Kit を使う） ───────── */
  const PREVIEW_CSS = `
.sr-stage{position:relative;overflow:hidden;min-height:0;background:var(--surface-2)}
.sr-box{position:absolute;top:0;left:0;overflow:hidden;background:var(--surface)}
.sr-stage[data-device="phone"] .sr-box{border:1px solid var(--line-strong);border-radius:28px;box-shadow:var(--shadow-2)}
.sr-stage.is-full .sr-box{border:0;border-radius:0;box-shadow:none}
.sr-frame{display:block;border:0;transform-origin:0 0;background:var(--surface)}
`;
  const tools = {
    // 見た目どおりのプレビュー（iframe srcdoc）。PC は狭い所では縮めて、スマホは 390px の枠で
    preview(o = {}) {
      Kit.css('site-preview', PREVIEW_CSS);
      const frame = Kit.h('iframe', { class: 'sr-frame', title: o.title || 'ホームページのプレビュー', sandbox: 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox' });
      const box = Kit.h('div', { class: 'sr-box' }, frame);
      const stage = Kit.h('div', { class: 'sr-stage', 'data-device': o.device === 'phone' ? 'phone' : 'pc' }, box);
      let device = o.device === 'phone' ? 'phone' : 'pc', ready = false, pending = null;
      const fit = () => {
        const W = stage.clientWidth, H = stage.clientHeight;
        if (!W || !H) return;
        let L, sc, bw, bh, left = 0, top = 0;
        if (device === 'phone') {
          const pad = W > 440 ? 16 : 0;
          L = 390; sc = Math.min(1, (W - pad * 2) / 390); bw = Math.round(390 * sc); bh = H - pad * 2; left = Math.round((W - bw) / 2); top = pad;
          stage.classList.toggle('is-full', !pad);
        } else { L = Math.max(W, 1024); sc = W / L; bw = W; bh = H; stage.classList.remove('is-full'); }
        Object.assign(box.style, { left: left + 'px', top: top + 'px', width: bw + 'px', height: bh + 'px' });
        Object.assign(frame.style, { width: L + 'px', height: Math.ceil(bh / sc) + 'px', transform: sc < 1 ? 'scale(' + sc + ')' : '' });
      };
      const ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
      if (ro) ro.observe(stage); else window.addEventListener('resize', fit);
      const post = (m) => { if (frame.contentWindow) frame.contentWindow.postMessage(m, '*'); };
      // ページのスクリプトが動かない環境（CSP など）では、差分の入れかえをやめて丸ごと読み直す
      let scriptless = false, loads = 0;
      frame.addEventListener('load', () => {
        const n = ++loads;
        setTimeout(() => {
          if (ready || n !== loads) return;
          scriptless = true;
          if (pending != null) { const p = pending; pending = null; frame.srcdoc = p; }
        }, 1500);
      });
      const onMsg = (e) => {
        if (e.source !== frame.contentWindow) return;
        const m = e.data;
        if (!m || typeof m !== 'object') return;
        if (m.type === 'mise:ready') {
          ready = true;
          if (pending != null) { post({ type: 'mise:update', html: pending }); pending = null; }
          if (o.onReady) o.onReady();
        } else if (o.onMessage) o.onMessage(m);
      };
      window.addEventListener('message', onMsg);
      return {
        el: stage, frame, fit,
        get ready() { return ready; },
        load(html) { ready = false; pending = null; frame.srcdoc = html; setTimeout(fit, 0); },
        update(html) { if (ready) post({ type: 'mise:update', html }); else if (scriptless) frame.srcdoc = html; else pending = html; },
        post(m) { if (ready) post(m); },
        setDevice(d) { device = d === 'phone' ? 'phone' : 'pc'; stage.dataset.device = device; fit(); },
        destroy() { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit); window.removeEventListener('message', onMsg); },
      };
    },
    // 画像の一覧 → {id: {dataUrl, w, h}}
    imagesMap(list) { const m = {}; for (const it of list || []) if (it && it.id && it.dataUrl) m[it.id] = { dataUrl: it.dataUrl, w: it.w, h: it.h }; return m; },
    // 描くのに必要なものをまとめて読む。保存がなくサンプルも片付け済みなら、プロフィールから作った下書き
    async load() {
      const [profile, site, form, images] = await Promise.all([
        Kit.profile.get(),
        Kit.store.get('site', { sample: SAMPLE }),
        Kit.store.get('form'),
        Kit.store.list('images'),
      ]);
      const out = { profile, form: form || (Kit.store.samplesShown() ? FORM_SAMPLE : FORM_BLANK), imagesList: images, images: tools.imagesMap(images) };
      if (site) { out.site = normalize(site); out.isSample = !!site._sample; out.draft = false; }
      else { out.site = blank(profile); out.isSample = false; out.draft = true; }
      return out;
    },
    // プレビューの試し送信 → 受付箱（leads）に入れる
    async receiveInquiry(raw) {
      const d = raw && typeof raw === 'object' ? raw : {};
      const s = (v, n) => str(v).trim().slice(0, n);
      const date = s(d.date, 16);
      const lead = await Kit.store.put('leads', {
        name: s(d.name, 80) || '（お名前なし）', email: s(d.email, 120), phone: s(d.phone, 40), kind: s(d.kind, 80), message: s(d.message, 5000),
        preferredAt: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(date) ? date : '', source: s(d.source, 60),
        status: 'new', value: 0, tags: [], notes: [], nextAt: '', meetingAt: '', channel: 'site-demo',
      });
      Kit.toast('受付箱に届きました（試し送信）', { action: { label: '見る', onClick: () => Kit.go('inbox', { lead: lead.id }) } });
      return lead;
    },
    // フォームの送信先のようす（ホームページの上に出す一行）
    formStatus(form) {
      const f = normForm(form), d = f.delivery;
      if (!d.ready) {
        const why = d.type === 'mailto' ? '（メールの宛先が入っていません）' : d.type === 'demo' ? '' : '（URLが入っていません）';
        return { ok: false, text: '問い合わせフォーム：まだ送信先が未設定です' + why + '。公開する前に、集客窓口で設定してください。' };
      }
      if (d.type === 'mailto') return { ok: true, text: '問い合わせフォーム：送信するとメールアプリが開き、' + d.to + ' あてに届きます。' };
      if (d.type === 'gas') return { ok: true, text: '問い合わせフォーム：Googleスプレッドシート（GAS）に送ります。' };
      if (d.type === 'google') return { ok: true, text: '問い合わせフォーム：Googleフォームへのボタンを出しています。' };
      let host = d.url;
      try { host = new URL(d.url).host; } catch (e) { /* そのまま */ }
      return { ok: true, text: '問い合わせフォーム：' + host + ' に送ります。' };
    },
    // 公開用の index.html を書き出す（送信先が未設定なら、先に知らせる）
    async exportSite(data) {
      const f = normForm(data.form);
      if (!f.delivery.ready && !(f.delivery.type === 'google')) {
        const go = await new Promise((resolve) => {
          Kit.modal({
            title: '問い合わせフォームの送信先が未設定です',
            body: Kit.h('div', { class: 'stack' },
              Kit.h('p', null, 'このまま公開すると、フォームから送られた内容はどこにも届きません。訪問した人には「まだつながっていない」と表示され、メールで送るボタンが出ます。'),
              Kit.h('p', { class: 'small muted' }, '送信先（メール・Googleスプレッドシートなど）は、集客窓口のフォーム設定で決められます。')),
            onClose: (v) => resolve(v || 'cancel'),
            actions: [{ label: 'やめる', kind: 'ghost', value: 'cancel' }, { label: '送信先を設定する', value: 'setup' }, { label: 'このまま書き出す', kind: 'primary', value: 'go' }],
          });
        });
        if (go === 'setup') { Kit.go('inbox', { tab: 'form' }); return false; }
        if (go !== 'go') return false;
      }
      const page = html(data.site, { profile: data.profile, form: data.form, images: data.images, mode: 'export' });
      const ok = await Kit.download('index.html', page);
      if (ok) Kit.toast('index.html を書き出しました。公開のしかたは、ホームページの画面にあります');
      return ok;
    },
  };

  window.SiteRender = {
    html, formPage, blank, imageRefs,
    themes: THEMES.map((t) => Object.assign({}, t, { colors: t.c })),
    fonts: FONTS,
    // make(profile, site?) → id・type・hidden までそろった新しいセクション
    sectionTypes: TYPES.map((t) => Object.assign({}, t, { make: (profile, site) => makeSection(t.type, profile, site) })),
    SAMPLE, FORM_SAMPLE, FORM_BLANK,
    normalize, normForm, typeOf, themeOf, fontOf, palette, uniqueId, makeSection,
    illustrations: Object.keys(ART).map((k) => ({ ref: 'svg:' + k, name: ART[k].name, w: ART[k].w, h: ART[k].h })),
    imageSrc: (ref, images, site) => { const i = imageInfo(ref, images, palette(site || {})); return i ? i.src : ''; },
    ogExt, tools,
  };
  // どのアプリから読んでも同じサンプルが見えるように登録しておく
  if (window.Kit && Kit.store && typeof Kit.store.sample === 'function') Kit.store.sample('site', SAMPLE);
})();
