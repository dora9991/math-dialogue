// 動画エディター：切る・つなぐ・テロップ・BGM。ブラウザの中だけで短い宣伝動画を作って書き出す
(function () {
  'use strict';
  const { h } = Kit;

  /* ───────── 決まりごと ───────── */
  const FORMATS = {
    v: { id: 'v', label: '縦 9:16', ar: 9 / 16, css: '9 / 16', hint: 'リール・ショート・TikTok' },
    h: { id: 'h', label: '横 16:9', ar: 16 / 9, css: '16 / 9', hint: 'YouTube・ホームページ' },
    s: { id: 's', label: '正方形 1:1', ar: 1, css: '1 / 1', hint: 'Instagram の投稿' },
  };
  const XF = 0.5; // クロスフェードの長さ（秒）
  const HIST_MAX = 50;
  const POSTER_T = 1.6; // サンプルを開いたとき最初に見せる場面
  const FONT_G = '"Zen Kaku Gothic New", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "YuGothic", Meiryo, "Noto Sans JP", "Noto Sans CJK JP", "IPAGothic", sans-serif';
  const FONT_M = '"Shippori Mincho B1", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", "Noto Serif CJK JP", "IPAMincho", serif';
  const ACCEPT = 'video/*,image/*,audio/*,.mov,.mp4,.m4v,.webm,.mp3,.m4a,.aac,.wav,.ogg';
  const KIND_LABEL = { video: '動画', image: '写真', title: 'タイトル', gen: '動く図', slot: '空き枠' };
  const TYPE_LABEL = { video: '動画', image: '写真', audio: '音楽' };
  const TYPE_ICON = { video: 'film', image: 'image', audio: 'music' };
  const GENS = { compass: 'コンパス', wave: 'サインカーブ', triangle: '三角形' };
  const TSIZE = { s: 0.045, m: 0.06, l: 0.08, xl: 0.11 };
  const TSTYLES = [
    { value: 'outline', label: '白文字＋黒ふち', color: '#ffffff' },
    { value: 'band-dark', label: '黒帯に白文字', color: '#ffffff' },
    { value: 'band-light', label: '白帯に黒文字', color: '#111111' },
    { value: 'headline', label: '大見出し', color: '#ffffff' },
  ];
  // 書き出す映像の色（中身なので固定。藍と白磁に合わせる）
  const PAINT = { ink: '#1f4a8f', paper: '#f5f7fb', text: '#142139', shu: '#c93c24', steel: '#3b4a63' };
  const BG_PRESETS = [
    { name: '藍', bg1: '#2c5fae', bg2: '#0f2346', color: '#ffffff' },
    { name: '白磁', bg1: '#f7f9fc', bg2: '#d6e2f3', color: '#142139' },
    { name: '朱', bg1: '#d2553a', bg2: '#8f2414', color: '#ffffff' },
    { name: '夜', bg1: '#222b3d', bg2: '#0b0f18', color: '#ffffff' },
    { name: '浅葱', bg1: '#2f8aa8', bg2: '#12465c', color: '#ffffff' },
    { name: '生成り', bg1: '#fbf7ef', bg2: '#ebe0cb', color: '#3a2f1f' },
  ];

  /* ───────── 小物 ───────── */
  const clamp = Kit.clamp;
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
  const round2 = (x) => Math.round(x * 100) / 100;
  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isHex = (c) => /^#[0-9a-f]{3,8}$/i.test(String(c || ''));
  const hex = (c, d) => (isHex(c) ? c : d);
  const pad2 = (n) => String(n).padStart(2, '0');
  // 0:03.4 のような時刻
  function fmtT(t) {
    const d = Math.round(Math.max(0, t || 0) * 10);
    const m = Math.floor(d / 600), s = (d % 600) / 10;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  }
  const fmtSec = (t) => (Math.round((t || 0) * 10) / 10).toFixed(1) + '秒';
  function stamp() { const d = new Date(); return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + pad2(d.getHours()) + pad2(d.getMinutes()); }

  /* ───────── 状態（モジュールに置く：ほかの画面に移っても、このセッションの間は残る） ───────── */
  const S = {
    project: null,
    media: new Map(), // id → {id, type, name, size, url, file, dur, w, h, thumb, img, peaks, els:[]}
    sel: null, // {kind:'clip'|'text'|'audio', id}
    saved: false, // いまの中身を保存したことがあるか
    t: 0,
    poster: false,
    zoom: 0, // 1秒あたりの px（0 = 次に描くとき全体が入るように決める）
    zoomAuto: true,
    ver: 1,
    hist: { undo: [], redo: [], last: '' },
    loop: !!Kit.pref.get('vid:loop', false),
    guide: !!Kit.pref.get('vid:guide', false),
    panel: Kit.pref.get('vid:panel', 'timeline'),
    autoPlace: Kit.pref.get('vid:autoPlace', true) !== false,
  };
  let V = null; // 開いている間の画面の部品
  let EXP = null; // 書き出し中の状態

  /* ───────── プロジェクトの形 ───────── */
  function blankProject(format) { return { v: 1, title: '新しい動画', format: FORMATS[format] ? format : 'v', clips: [], texts: [], audio: [], media: {} }; }
  function mkClip(kind, o) {
    const c = { id: Kit.uid('c'), kind, fadeIn: 0, fadeOut: 0, xfade: false };
    if (kind === 'video') Object.assign(c, { media: '', in: 0, out: 3, vol: 1, mute: false, fit: 'cover', bgMode: 'blur', bgColor: '#000000' });
    if (kind === 'image') Object.assign(c, { media: '', dur: 3, zoom: true, fit: 'cover', bgMode: 'blur', bgColor: '#000000', off: 0, span: 0 });
    if (kind === 'title') Object.assign(c, { dur: 3, text: 'タイトル', sub: '', align: 'center', size: 'm', font: 'mincho', color: '#ffffff', bg1: '#2c5fae', bg2: '#0f2346', grad: true, rise: true });
    if (kind === 'gen') Object.assign(c, { gen: 'compass', dur: 3, off: 0, span: 0 });
    if (kind === 'slot') Object.assign(c, { dur: 3 });
    return Object.assign(c, o || {});
  }
  function mkText(o) { return Object.assign({ id: Kit.uid('t'), start: 0, end: 3, text: 'テロップ', pos: 'bottom', dy: 0, size: 'm', style: 'band-dark', font: 'gothic', color: '#ffffff', anim: 'fade' }, o || {}); }
  function mkAudio(o) { return Object.assign({ id: Kit.uid('a'), media: '', start: 0, in: 0, len: 0, vol: 0.8, fadeIn: 0.5, fadeOut: 1.5, loop: true }, o || {}); }

  // 読みこんだデータを、欠けやおかしな値のない形にそろえる
  function normalize(src) {
    const p = Object.assign(blankProject('v'), src && typeof src === 'object' ? src : {});
    if (!FORMATS[p.format]) p.format = 'v';
    p.title = String(p.title || '新しい動画').slice(0, 80);
    const kinds = ['video', 'image', 'title', 'gen', 'slot'];
    p.clips = (Array.isArray(p.clips) ? p.clips : []).filter((c) => c && kinds.includes(c.kind)).map((c0) => {
      const c = mkClip(c0.kind, Object.assign({}, c0, { id: String(c0.id || Kit.uid('c')) }));
      if (c.kind === 'video') { c.in = Math.max(0, num(c.in)); c.out = Math.max(c.in + 0.1, num(c.out, c.in + 3)); c.vol = clamp(num(c.vol, 1), 0, 2); c.mute = !!c.mute; }
      else c.dur = clamp(num(c.dur, 3), 0.1, 600);
      if (c.kind === 'title') { c.bg1 = hex(c.bg1, '#2c5fae'); c.bg2 = hex(c.bg2, '#0f2346'); c.color = hex(c.color, '#ffffff'); c.text = String(c.text || ''); c.sub = String(c.sub || ''); }
      if (c.kind === 'gen' && !GENS[c.gen]) c.gen = 'compass';
      if (c.bgColor !== undefined) c.bgColor = hex(c.bgColor, '#000000');
      c.fadeIn = clamp(num(c.fadeIn), 0, 5); c.fadeOut = clamp(num(c.fadeOut), 0, 5); c.xfade = !!c.xfade;
      return c;
    });
    p.texts = (Array.isArray(p.texts) ? p.texts : []).filter((x) => x && typeof x === 'object').map((x0) => {
      const x = mkText(Object.assign({}, x0, { id: String(x0.id || Kit.uid('t')) }));
      x.start = Math.max(0, num(x.start)); x.end = Math.max(x.start + 0.2, num(x.end, x.start + 3));
      x.text = String(x.text == null ? '' : x.text); x.color = hex(x.color, '#ffffff'); x.dy = clamp(num(x.dy), -30, 30);
      if (!TSIZE[x.size]) x.size = 'm';
      if (!TSTYLES.some((s) => s.value === x.style)) x.style = 'band-dark';
      return x;
    });
    p.audio = (Array.isArray(p.audio) ? p.audio : []).filter((a) => a && a.media).map((a0) => {
      const a = mkAudio(Object.assign({}, a0, { id: String(a0.id || Kit.uid('a')) }));
      a.start = Math.max(0, num(a.start)); a.in = Math.max(0, num(a.in)); a.len = Math.max(0, num(a.len));
      a.vol = clamp(num(a.vol, 0.8), 0, 2); a.fadeIn = clamp(num(a.fadeIn), 0, 10); a.fadeOut = clamp(num(a.fadeOut), 0, 10); a.loop = !!a.loop;
      return a;
    });
    p.media = p.media && typeof p.media === 'object' ? Object.assign({}, p.media) : {};
    return p;
  }

  const metaOf = (id) => S.media.get(id) || (S.project && S.project.media[id]) || null;
  function usedMediaIds() {
    const ids = new Set();
    for (const c of S.project.clips) if (c.media && (c.kind === 'video' || c.kind === 'image')) ids.add(c.media);
    for (const a of S.project.audio) if (a.media) ids.add(a.media);
    return ids;
  }
  const isMissing = (c) => (c.kind === 'video' || c.kind === 'image') && !S.media.has(c.media);

  // 保存する形（素材そのものは入れない。名前と長さだけ）
  function serialize() {
    const p = S.project, media = {};
    for (const id of usedMediaIds()) {
      const m = metaOf(id);
      if (m) media[id] = { name: String(m.name || ''), type: m.type, dur: round2(m.dur || 0), w: m.w || 0, h: m.h || 0, size: m.size || 0 };
    }
    return { v: 1, title: p.title, format: p.format, clips: p.clips, texts: p.texts, audio: p.audio, media };
  }

  /* ───────── サンプル（ひらめき数学舎の無料体験会のお知らせ・約15秒・音なし） ───────── */
  function nextSaturday() { let n = 7; while (Kit.addDays(Kit.today(), n).getDay() !== 6 && n < 14) n++; return Kit.fmtDate(Kit.rel(n), 'M月D日(W)'); }
  function makeSample() {
    return {
      v: 1, title: '無料体験会のお知らせ', format: 'v', media: {}, audio: [],
      clips: [
        mkClip('title', { id: 'sv-c1', dur: 3, text: '無料体験会、\nひらきます', sub: 'ひらめき数学舎', bg1: '#2c5fae', bg2: '#0f2346', color: '#ffffff', fadeIn: 0.4 }),
        mkClip('gen', { id: 'sv-c2', gen: 'compass', dur: 3.2, xfade: true }),
        mkClip('gen', { id: 'sv-c3', gen: 'wave', dur: 3.2, xfade: true }),
        mkClip('gen', { id: 'sv-c4', gen: 'triangle', dur: 3.2, xfade: true }),
        mkClip('title', { id: 'sv-c5', dur: 4.4, text: nextSaturday() + '\n10:00〜11:00', sub: 'オンライン・参加無料\nお申し込みはプロフィールのリンクから', font: 'gothic', bg1: '#f7f9fc', bg2: '#d6e2f3', color: '#142139', xfade: true, fadeOut: 0.6 }),
      ],
      texts: [
        mkText({ id: 'sv-t1', start: 2.8, end: 5.3, text: '公式は、覚えるより\n見つけるもの', anim: 'up' }),
        mkText({ id: 'sv-t2', start: 5.5, end: 8.0, text: '動く図で、\nなぜ？が見えてくる', anim: 'up' }),
        mkText({ id: 'sv-t3', start: 8.2, end: 10.6, text: '中高生も、\n大人の学び直しも', anim: 'up' }),
        mkText({ id: 'sv-t4', start: 2.6, end: 10.6, text: 'ひらめき数学舎', pos: 'top', size: 's', style: 'band-light', color: '#1f4a8f', anim: 'fade' }),
      ],
    };
  }
  const SAMPLE = makeSample();
  if (Kit.store && Kit.store.sample) Kit.store.sample('video', SAMPLE);

  /* ───────── ひな形 ───────── */
  const T_INDIGO = { bg1: '#2c5fae', bg2: '#0f2346', color: '#ffffff' };
  const T_PAPER = { bg1: '#f7f9fc', bg2: '#d6e2f3', color: '#142139' };
  const TEMPLATES = [
    {
      id: 'notice', name: 'お知らせ（縦・15秒）', desc: 'イベントや新しいメニューの告知に', format: 'v',
      build: (pf) => ({
        title: 'お知らせ', format: 'v',
        clips: [
          mkClip('title', Object.assign({ dur: 3, text: 'お知らせ', sub: pf.name || 'お店の名前', fadeIn: 0.3 }, T_INDIGO)),
          mkClip('slot', { dur: 4 }),
          mkClip('slot', { dur: 4, xfade: true }),
          mkClip('title', Object.assign({ dur: 5, text: '詳しくは\nプロフィールのリンクから', sub: pf.name || '', font: 'gothic', xfade: true, fadeOut: 0.6 }, T_PAPER)),
        ],
        texts: [
          mkText({ start: 3.2, end: 6.4, text: 'ここに伝えたいことを\nひとこと', anim: 'up' }),
          mkText({ start: 6.8, end: 10.0, text: '日時や場所など', anim: 'up' }),
        ],
      }),
    },
    {
      id: 'service', name: 'サービス紹介（横・30秒）', desc: 'YouTube やホームページに置く紹介動画', format: 'h',
      build: (pf) => ({
        title: 'サービス紹介', format: 'h',
        clips: [
          mkClip('title', Object.assign({ dur: 4, text: pf.name || 'サービスの名前', sub: pf.tagline || 'ひとことで、どんなサービスか', fadeIn: 0.4 }, T_INDIGO)),
          mkClip('slot', { dur: 7 }),
          mkClip('slot', { dur: 6, xfade: true }),
          mkClip('slot', { dur: 6, xfade: true }),
          mkClip('title', Object.assign({ dur: 5, text: '料金・お問い合わせ', sub: pf.url && !/example\.com/.test(pf.url) ? pf.url : 'くわしくはホームページへ', font: 'gothic', xfade: true }, T_PAPER)),
          mkClip('title', Object.assign({ dur: 4, text: pf.name || 'お店の名前', sub: pf.area || '', xfade: true, fadeOut: 0.8 }, T_INDIGO)),
        ],
        texts: [
          mkText({ start: 4.4, end: 10.6, text: 'こんなことで困っていませんか', anim: 'up' }),
          mkText({ start: 11.2, end: 16.4, text: 'ここでサービスを紹介します', anim: 'up' }),
          mkText({ start: 17.0, end: 21.4, text: 'お客さまの声や実績', anim: 'up' }),
        ],
      }),
    },
    {
      id: 'before', name: 'ビフォー・アフター（縦）', desc: '変化をくらべて見せる短い動画', format: 'v',
      build: (pf) => ({
        title: 'ビフォー・アフター', format: 'v',
        clips: [
          mkClip('title', Object.assign({ dur: 2.5, text: 'ビフォー・アフター', sub: pf.name || '', fadeIn: 0.3 }, T_INDIGO)),
          mkClip('slot', { dur: 4 }),
          mkClip('slot', { dur: 4 }),
          mkClip('title', Object.assign({ dur: 3.5, text: 'ご予約・ご相談は\nプロフィールのリンクから', sub: pf.name || '', font: 'gothic', xfade: true, fadeOut: 0.6 }, T_PAPER)),
        ],
        texts: [
          mkText({ start: 2.5, end: 6.5, text: 'BEFORE', pos: 'top', size: 'xl', style: 'headline', anim: 'fade' }),
          mkText({ start: 6.5, end: 10.5, text: 'AFTER', pos: 'top', size: 'xl', style: 'headline', anim: 'up' }),
        ],
      }),
    },
  ];

  /* ───────── 時間の並び ───────── */
  const clipDur = (c) => (c.kind === 'video' ? Math.max(0.1, c.out - c.in) : Math.max(0.1, c.dur));
  let LC = null;
  function getLayout() {
    if (LC && LC.ver === S.ver && LC.p === S.project) return LC;
    const items = [], cnt = {};
    let t = 0;
    S.project.clips.forEach((c, i) => {
      const dur = clipDur(c);
      const ov = i > 0 && c.xfade ? Math.min(XF, items[i - 1].dur / 2, dur / 2) : 0;
      const start = Math.max(0, t - ov);
      let slot = 0;
      // 同じ動画が続くときは、2つの要素を交互に使う（先読み・クロスフェードのため）
      if (c.kind === 'video') { slot = (cnt[c.media] || 0) % 2; cnt[c.media] = (cnt[c.media] || 0) + 1; }
      items.push({ clip: c, i, start, end: start + dur, dur, ov, slot });
      t = start + dur;
    });
    let total = t;
    for (const x of S.project.texts) total = Math.max(total, x.end);
    LC = { ver: S.ver, p: S.project, items, total, mainEnd: t, byId: new Map(items.map((x) => [x.clip.id, x])) };
    return LC;
  }
  const touch = () => { S.ver++; };
  function activeAt(L, t) {
    const out = [];
    for (const it of L.items) {
      if (t >= it.start && t < it.end) out.push({ it, lt: t - it.start, mix: it.ov > 0 && t < it.start + it.ov ? clamp01((t - it.start) / it.ov) : 1 });
    }
    // 最後の瞬間は最後の場面を見せる
    if (!out.length && L.items.length && Math.abs(t - L.mainEnd) < 1e-3) { const it = L.items[L.items.length - 1]; out.push({ it, lt: Math.max(0, it.dur - 0.001), mix: 1 }); }
    return out;
  }
  function fadeAlpha(it, lt) {
    const c = it.clip;
    let a = 1;
    if (c.fadeIn > 0) a *= clamp01(lt / c.fadeIn);
    if (c.fadeOut > 0) a *= clamp01((it.dur - lt) / c.fadeOut);
    return a;
  }
  function bgmLen(a) {
    const m = metaOf(a.media);
    const fileLen = Math.max(0.1, ((m && m.dur) || 0) - a.in);
    if (a.len > 0) return a.loop ? a.len : Math.min(a.len, fileLen);
    return a.loop ? Infinity : fileLen;
  }
  const bgmEnd = (a, total) => Math.max(a.start, Math.min(total, a.start + bgmLen(a)));

  /* ───────── 描画（プレビューと書き出しで同じものを使う） ───────── */
  function drawFrame(ctx, t, size, o = {}) {
    const W = size.w, H = size.h;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const L = getLayout();
    for (const a of activeAt(L, t)) {
      const al = a.mix * fadeAlpha(a.it, a.lt);
      if (al > 0.002) drawItem(ctx, a.it, a.lt, W, H, al);
    }
    for (const x of S.project.texts) if (t >= x.start && t < x.end) drawTelop(ctx, x, t - x.start, W, H, S.project.format);
    if (o.guide) drawGuide(ctx, W, H, S.project.format);
    ctx.restore();
  }

  function drawItem(ctx, it, lt, W, H, alpha) {
    const c = it.clip;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (c.kind === 'title') drawTitle(ctx, c, lt, W, H, alpha);
    else if (c.kind === 'gen') drawGen(ctx, c, lt, it.dur, W, H);
    else if (c.kind === 'slot') drawSlot(ctx, W, H);
    else {
      const m = S.media.get(c.media);
      if (!m) drawMissing(ctx, W, H, metaOf(c.media));
      else if (c.kind === 'video') {
        const el = videoEl(c, it.slot);
        if (el && el.readyState >= 2 && el.videoWidth) drawMedia(ctx, el, el.videoWidth, el.videoHeight, c, W, H, 1);
      } else if (m.img) {
        const span = c.span || it.dur;
        const z = c.zoom ? 1 + 0.1 * clamp01(((c.off || 0) + lt) / span) : 1;
        drawMedia(ctx, m.img, m.w, m.h, c, W, H, z);
      }
    }
    ctx.restore();
  }

  function drawMedia(ctx, src, sw, sh, c, W, H, zoom) {
    if (!sw || !sh) return;
    const contain = c.fit === 'contain';
    if (contain) {
      if (c.bgMode === 'color') { ctx.fillStyle = c.bgColor || '#000'; ctx.fillRect(0, 0, W, H); }
      else drawBlur(ctx, src, sw, sh, W, H);
    }
    const s = (contain ? Math.min(W / sw, H / sh) : Math.max(W / sw, H / sh)) * zoom;
    const dw = sw * s, dh = sh * s;
    ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  // 余白のぼかし：小さく縮めてから引きのばす（どのブラウザでも軽い）
  let blurCv = null;
  function drawBlur(ctx, src, sw, sh, W, H) {
    if (!blurCv) blurCv = document.createElement('canvas');
    const bw = 40, bh = Math.max(10, Math.round((40 * H) / W));
    if (blurCv.width !== bw || blurCv.height !== bh) { blurCv.width = bw; blurCv.height = bh; }
    const b = blurCv.getContext('2d');
    const s = Math.max(bw / sw, bh / sh) * 1.1;
    b.clearRect(0, 0, bw, bh);
    if ('filter' in b) b.filter = 'blur(1.5px)';
    b.drawImage(src, (bw - sw * s) / 2, (bh - sh * s) / 2, sw * s, sh * s);
    if ('filter' in b) b.filter = 'none';
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(blurCv, -W * 0.06, -H * 0.06, W * 1.12, H * 1.12);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function rr(ctx, x, y, w, hh, r) {
    r = Math.max(0, Math.min(r, w / 2, hh / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + hh, r);
    ctx.arcTo(x + w, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function dot(ctx, x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
  function seg(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

  // 日本語の行分け（句読点を行頭に置かない・英単語は切らない）
  const NO_START = '、。，．,.・：；？！?!ー〜～…‥」』）】〕〉》｝］’”ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ%)]}';
  const NO_END = '「『（【〔〈《｛［‘“([{';
  function wrapPara(ctx, para, maxW) {
    const toks = para.match(/[A-Za-z0-9@#&'’_.:/%+-]+|\s+|[\s\S]/gu) || [];
    const out = [];
    let line = '';
    for (const tk of toks) {
      const test = line + tk;
      if (!line || ctx.measureText(test).width <= maxW) { line = test; continue; }
      if (NO_START.includes(tk[0])) { line = test; continue; }
      let carry = '';
      if (line.length > 1 && NO_END.includes(line[line.length - 1])) { carry = line[line.length - 1]; line = line.slice(0, -1); }
      out.push(line.replace(/\s+$/, ''));
      line = (carry + tk).replace(/^\s+/, '');
    }
    out.push(line);
    return out;
  }
  function wrapText(ctx, text, maxW) {
    const out = [];
    for (const para of String(text || '').split('\n')) {
      let lines = wrapPara(ctx, para, maxW);
      // 行の長さをそろえる（最後の行に1文字だけ残る、をなくす）
      if (lines.length >= 2) {
        const avg = ctx.measureText(para).width / lines.length;
        for (let k = 0; k < 8; k++) {
          const w = Math.min(maxW, avg * (1.02 + k * 0.04));
          const alt = wrapPara(ctx, para, w);
          if (alt.length <= lines.length) { lines = alt; break; }
          if (w >= maxW) break;
        }
      }
      out.push(...lines);
    }
    while (out.length > 1 && out[out.length - 1] === '') out.pop();
    return out;
  }
  // 入りきらない語があれば字を小さくして入れる
  function fitLines(ctx, text, maxW, fs, fontOf) {
    ctx.font = fontOf(fs);
    let lines = wrapText(ctx, text, maxW);
    const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
    if (widest > maxW * 1.01) {
      fs = Math.max(fs * 0.45, (fs * maxW) / widest);
      ctx.font = fontOf(fs);
      lines = wrapText(ctx, text, maxW);
    }
    return { lines, fs, font: fontOf(fs) };
  }

  function drawTitle(ctx, c, lt, W, H, alpha) {
    const u = Math.min(W, H);
    if (c.grad && c.bg2) {
      const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
      g.addColorStop(0, c.bg1); g.addColorStop(1, c.bg2);
      ctx.fillStyle = g;
    } else ctx.fillStyle = c.bg1 || '#000';
    ctx.fillRect(0, 0, W, H);
    const k = c.rise ? easeOut(clamp01(lt / 0.8)) : 1;
    if (k <= 0.001) return;
    const mul = { s: 0.78, m: 1, l: 1.25 }[c.size] || 1;
    const gothic = c.font === 'gothic';
    const maxW = W * 0.84;
    const big = fitLines(ctx, c.text, maxW, u * 0.1 * mul, (fs) => (gothic ? 700 : 800) + ' ' + fs + 'px ' + (gothic ? FONT_G : FONT_M));
    const small = fitLines(ctx, c.sub, maxW, u * 0.042 * Math.max(0.9, mul), (fs) => '500 ' + fs + 'px ' + FONT_G);
    const hasB = big.lines.some((l) => l.trim()), hasS = small.lines.some((l) => l.trim());
    const bLH = big.fs * 1.3, sLH = small.fs * 1.65;
    const gap = hasB && hasS ? u * 0.07 : 0;
    const blockH = (hasB ? big.lines.length * bLH : 0) + gap + (hasS ? small.lines.length * sLH : 0);
    let y = H / 2 - blockH / 2 + (1 - k) * u * 0.035;
    const align = ['left', 'right'].includes(c.align) ? c.align : 'center';
    const x = align === 'left' ? W * 0.08 : align === 'right' ? W * 0.92 : W / 2;
    ctx.save();
    ctx.globalAlpha = alpha * k;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.color || '#fff';
    if (hasB) { ctx.font = big.font; for (const ln of big.lines) { ctx.fillText(ln, x, y + bLH / 2); y += bLH; } }
    if (gap) {
      const lw = u * 0.07, lh = Math.max(2, u * 0.006);
      const lx = align === 'left' ? x : align === 'right' ? x - lw : x - lw / 2;
      ctx.fillStyle = '#e0644a';
      ctx.fillRect(lx, y + gap / 2 - lh / 2, lw, lh);
      ctx.fillStyle = c.color || '#fff';
      y += gap;
    }
    if (hasS) { ctx.font = small.font; ctx.globalAlpha = alpha * k * 0.9; for (const ln of small.lines) { ctx.fillText(ln, x, y + sLH / 2); y += sLH; } }
    ctx.restore();
  }

  function telopY(pos, H, format) {
    if (pos === 'top') return { y: H * (format === 'v' ? 0.13 : 0.08), mode: 'top' };
    if (pos === 'mid') return { y: H * 0.5, mode: 'mid' };
    return { y: H * (format === 'v' ? 0.78 : 0.9), mode: 'bottom' };
  }
  function drawTelop(ctx, x, lt, W, H, format) {
    if (!String(x.text || '').trim()) return;
    const dur = x.end - x.start, u = Math.min(W, H);
    let a = 1, dy = 0;
    if (x.anim === 'fade' || x.anim === 'up') {
      const din = Math.min(0.35, dur / 3), dout = Math.min(0.3, dur / 3);
      a = clamp01(lt / din) * clamp01((dur - lt) / dout);
    }
    if (x.anim === 'up') dy = (1 - easeOut(clamp01(lt / 0.45))) * u * 0.05;
    if (a <= 0.003) return;
    const head = x.style === 'headline', band = x.style === 'band-dark' || x.style === 'band-light';
    const mincho = x.font === 'mincho';
    const fs0 = u * (TSIZE[x.size] || TSIZE.m) * (head ? 1.3 : 1);
    const padX = band ? fs0 * 0.45 : fs0 * 0.1;
    const f = fitLines(ctx, x.text, W * 0.88 - padX * 2, fs0, (fs) => (head || mincho ? 800 : 700) + ' ' + fs + 'px ' + (mincho ? FONT_M : FONT_G));
    const fs = f.fs, lh = fs * (band ? 1.5 : 1.3), bh = f.lines.length * lh;
    const an = telopY(x.pos, H, format);
    let y = an.mode === 'top' ? an.y : an.mode === 'mid' ? an.y - bh / 2 : an.y - bh;
    y += (x.dy / 100) * H + dy;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = f.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    f.lines.forEach((ln, i) => {
      const cy = y + lh * (i + 0.5);
      if (!ln.trim()) return;
      if (band) {
        const tw = ctx.measureText(ln).width;
        ctx.save();
        if (x.style === 'band-light') { ctx.shadowColor = 'rgba(20,33,57,0.18)'; ctx.shadowBlur = fs * 0.3; ctx.shadowOffsetY = fs * 0.04; }
        ctx.fillStyle = x.style === 'band-dark' ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.93)';
        rr(ctx, W / 2 - tw / 2 - padX, cy - lh / 2, tw + padX * 2, lh, fs * 0.16);
        ctx.fill();
        ctx.restore();
      }
      if (x.style === 'outline') {
        ctx.lineJoin = 'round';
        ctx.lineWidth = fs * 0.2;
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeText(ln, W / 2, cy);
      }
      if (head) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = fs * 0.25; ctx.shadowOffsetY = fs * 0.05; }
      ctx.fillStyle = x.color || '#fff';
      ctx.fillText(ln, W / 2, cy);
      ctx.shadowColor = 'transparent';
    });
    ctx.restore();
  }

  function drawSlot(ctx, W, H) {
    const u = Math.min(W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2b3448'); g.addColorStop(1, '#1a2030');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = Math.max(1.5, u * 0.004);
    ctx.setLineDash([u * 0.02, u * 0.014]);
    rr(ctx, W * 0.07, H * 0.07, W * 0.86, H * 0.86, u * 0.03);
    ctx.stroke();
    ctx.setLineDash([]);
    const s = u * 0.16, x = W / 2 - s / 2, y = H / 2 - s * 0.95;
    ctx.lineJoin = 'round';
    rr(ctx, x, y, s, s * 0.78, s * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.12, y + s * 0.64); ctx.lineTo(x + s * 0.4, y + s * 0.36); ctx.lineTo(x + s * 0.6, y + s * 0.54); ctx.lineTo(x + s * 0.72, y + s * 0.44); ctx.lineTo(x + s * 0.88, y + s * 0.6);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x + s * 0.72, y + s * 0.22, s * 0.07, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const f = fitLines(ctx, 'ここに動画や写真を入れる', W * 0.74, u * 0.05, (fs) => '700 ' + fs + 'px ' + FONT_G);
    ctx.font = f.font;
    f.lines.forEach((ln, i) => ctx.fillText(ln, W / 2, H / 2 + u * 0.06 + i * f.fs * 1.4));
    ctx.restore();
  }

  function drawMissing(ctx, W, H, meta) {
    const u = Math.min(W, H);
    ctx.fillStyle = '#2a2622';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f0c35a';
    const f = fitLines(ctx, '素材を入れ直してください', W * 0.8, u * 0.055, (fs) => '700 ' + fs + 'px ' + FONT_G);
    ctx.font = f.font;
    f.lines.forEach((ln, i) => ctx.fillText(ln, W / 2, H / 2 - u * 0.03 + i * f.fs * 1.4));
    if (meta && meta.name) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      const g = fitLines(ctx, meta.name, W * 0.8, u * 0.035, (fs) => '500 ' + fs + 'px ' + FONT_G);
      ctx.font = g.font;
      ctx.fillText(g.lines[0], W / 2, H / 2 + u * 0.06 + (f.lines.length - 1) * f.fs * 1.4);
    }
    ctx.restore();
  }

  // SNS の画面で隠れやすい所（プレビューだけ。書き出しには入らない）
  function drawGuide(ctx, W, H, format) {
    const u = Math.min(W, H);
    ctx.save();
    ctx.lineWidth = Math.max(1, u * 0.003);
    ctx.setLineDash([u * 0.015, u * 0.01]);
    ctx.strokeStyle = 'rgba(255,150,120,0.95)';
    ctx.fillStyle = 'rgba(201,60,36,0.18)';
    ctx.font = '700 ' + u * 0.032 + 'px ' + FONT_G;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const zone = (x, y, w, hh, label) => {
      ctx.fillStyle = 'rgba(201,60,36,0.18)';
      ctx.fillRect(x, y, w, hh);
      ctx.strokeRect(x, y, w, hh);
      if (label) { ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4; ctx.fillText(label, x + w / 2, y + hh / 2); ctx.shadowBlur = 0; }
    };
    if (format === 'v') {
      zone(0, 0, W, H * 0.1, '名前などで隠れやすい');
      zone(0, H * 0.8, W, H * 0.2, '説明文やボタンで隠れやすい');
      zone(W * 0.84, H * 0.42, W * 0.16, H * 0.38, '');
    } else ctx.strokeRect(W * 0.05, H * 0.05, W * 0.9, H * 0.9);
    ctx.restore();
  }

  /* 動く図（サンプル用）：p は 0〜1 の進み具合 */
  function drawGen(ctx, c, lt, dur, W, H) {
    const p = clamp01(((c.off || 0) + lt) / (c.span || dur || 1));
    const u = Math.min(W, H);
    ctx.fillStyle = PAINT.paper;
    ctx.fillRect(0, 0, W, H);
    const g = u / 12;
    ctx.save();
    ctx.strokeStyle = 'rgba(31,74,143,0.09)';
    ctx.lineWidth = Math.max(1, u / 600);
    ctx.beginPath();
    for (let x = (W / 2) % g; x < W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = (H / 2) % g; y < H; y += g) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (c.gen === 'wave') genWave(ctx, p, W, H, u);
    else if (c.gen === 'triangle') genTriangle(ctx, p, W, H, u);
    else genCompass(ctx, p, W, H, u);
    ctx.restore();
  }

  function genCompass(ctx, p, W, H, u) {
    const cx = W / 2, cy = H * (H > W ? 0.42 : 0.5), R = u * 0.26;
    const k = ease(clamp01((p - 0.05) / 0.7));
    const a0 = -Math.PI / 2 - 0.5, a = a0 + k * Math.PI * 2;
    if (k > 0) { ctx.strokeStyle = PAINT.ink; ctx.lineWidth = u * 0.009; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a); ctx.stroke(); }
    const k2 = ease(clamp01((p - 0.78) / 0.14));
    if (k2 > 0) {
      ctx.save();
      ctx.globalAlpha *= k2;
      ctx.strokeStyle = PAINT.shu;
      ctx.lineWidth = u * 0.006;
      ctx.setLineDash([u * 0.018, u * 0.012]);
      seg(ctx, cx, cy, cx + R * Math.cos(0.5), cy + R * Math.sin(0.5));
      ctx.setLineDash([]);
      ctx.fillStyle = PAINT.shu;
      ctx.font = 'italic 700 ' + u * 0.06 + 'px ' + FONT_M;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('r', cx + R * 0.5 * Math.cos(0.5) + u * 0.02, cy + R * 0.5 * Math.sin(0.5) - u * 0.045);
      ctx.restore();
    }
    dot(ctx, cx, cy, u * 0.012, PAINT.shu);
    const fade = 1 - clamp01((p - 0.86) / 0.1);
    if (fade <= 0) return;
    const px = cx + R * Math.cos(a), py = cy + R * Math.sin(a);
    const hx = (cx + px) / 2 + (py - cy) * 0.12, hy = (cy + py) / 2 - R * 0.95;
    ctx.save();
    ctx.globalAlpha *= fade;
    ctx.strokeStyle = PAINT.steel;
    ctx.lineWidth = u * 0.016;
    seg(ctx, hx, hy, cx, cy);
    seg(ctx, hx, hy, px, py);
    const len = Math.hypot(px - hx, py - hy) || 1, nx = (px - hx) / len, ny = (py - hy) / len;
    ctx.strokeStyle = '#e2b45a';
    ctx.lineWidth = u * 0.022;
    seg(ctx, px - nx * u * 0.09, py - ny * u * 0.09, px - nx * u * 0.025, py - ny * u * 0.025);
    dot(ctx, px, py, u * 0.008, '#30343b');
    dot(ctx, hx, hy, u * 0.024, PAINT.ink);
    ctx.fillStyle = PAINT.ink;
    rr(ctx, hx - u * 0.013, hy - u * 0.075, u * 0.026, u * 0.055, u * 0.01);
    ctx.fill();
    ctx.restore();
  }

  function genWave(ctx, p, W, H, u) {
    const tall = H > W;
    const r = u * (tall ? 0.15 : 0.17);
    const cy = H * (tall ? 0.42 : 0.48);
    const cx = Math.max(W * 0.07 + r, W * 0.2);
    const x0 = cx + r + W * 0.06, x1 = W * 0.93, L = x1 - x0;
    const k = clamp01(p / 0.88), th = k * Math.PI * 2;
    ctx.strokeStyle = 'rgba(20,33,57,0.35)';
    ctx.lineWidth = Math.max(1, u * 0.003);
    seg(ctx, cx - r * 1.3, cy, x1 + u * 0.02, cy);
    seg(ctx, cx, cy - r * 1.35, cx, cy + r * 1.35);
    seg(ctx, x0, cy - r * 1.35, x0, cy + r * 1.35);
    ctx.strokeStyle = PAINT.ink;
    ctx.lineWidth = u * 0.006;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    const px = cx + r * Math.cos(th), py = cy - r * Math.sin(th);
    if (th > 0.01) { ctx.strokeStyle = 'rgba(31,74,143,0.55)'; ctx.lineWidth = u * 0.004; ctx.beginPath(); ctx.arc(cx, cy, r * 0.28, 0, -th, true); ctx.stroke(); }
    ctx.strokeStyle = PAINT.ink;
    ctx.lineWidth = u * 0.006;
    seg(ctx, cx, cy, px, py);
    ctx.lineWidth = u * 0.009;
    ctx.beginPath();
    const n = Math.max(2, Math.ceil(90 * k));
    for (let i = 0; i <= n; i++) {
      const an = (th * i) / n, x = x0 + (L * an) / (Math.PI * 2), y = cy - r * Math.sin(an);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    const wx = x0 + (L * th) / (Math.PI * 2);
    ctx.strokeStyle = 'rgba(201,60,36,0.65)';
    ctx.lineWidth = u * 0.004;
    ctx.setLineDash([u * 0.012, u * 0.01]);
    seg(ctx, px, py, wx, py);
    ctx.setLineDash([]);
    dot(ctx, px, py, u * 0.014, PAINT.shu);
    dot(ctx, wx, py, u * 0.014, PAINT.shu);
    ctx.fillStyle = PAINT.text;
    ctx.font = 'italic 700 ' + u * 0.045 + 'px ' + FONT_M;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('θ', cx + r * 0.34, cy - r * 0.15);
    ctx.fillText('y = sin θ', x0 + u * 0.02, cy - r * 1.2);
  }

  function genTriangle(ctx, p, W, H, u) {
    const tall = H > W;
    const cx = W / 2, cy = H * (tall ? 0.38 : 0.42);
    const A = [cx - u * 0.33, cy + u * 0.16], B = [cx + u * 0.33, cy + u * 0.16], C = [cx + u * 0.1, cy - u * 0.25];
    const P = [A, B, C], COLS = ['#2f6fd0', '#c93c24', '#e0a100'];
    // 1) 辺を描く
    const k1 = ease(clamp01(p / 0.3));
    const sides = [[A, B], [B, C], [C, A]];
    const lens = sides.map(([s, e]) => Math.hypot(e[0] - s[0], e[1] - s[1]));
    let left = k1 * (lens[0] + lens[1] + lens[2]);
    ctx.strokeStyle = PAINT.ink;
    ctx.lineWidth = u * 0.009;
    ctx.beginPath();
    ctx.moveTo(A[0], A[1]);
    for (let i = 0; i < 3 && left > 0; i++) {
      const [s, e] = sides[i], f = Math.min(1, left / lens[i]);
      ctx.lineTo(s[0] + (e[0] - s[0]) * f, s[1] + (e[1] - s[1]) * f);
      left -= lens[i];
    }
    ctx.stroke();
    // 2) 角に色をつけ、3) 一か所に集めると一直線（180°）
    const k2 = ease(clamp01((p - 0.28) / 0.2));
    const k3 = ease(clamp01((p - 0.52) / 0.3));
    const rW = u * 0.075;
    const M = [cx, cy + u * (tall ? 0.42 : 0.36)];
    if (k3 > 0) { ctx.save(); ctx.globalAlpha *= k3; ctx.strokeStyle = 'rgba(20,33,57,0.45)'; ctx.lineWidth = u * 0.004; seg(ctx, M[0] - u * 0.22, M[1], M[0] + u * 0.22, M[1]); ctx.restore(); }
    let acc = Math.PI;
    P.forEach((Vx, i) => {
      const P1 = P[(i + 1) % 3], P2 = P[(i + 2) % 3];
      let s = Math.atan2(P1[1] - Vx[1], P1[0] - Vx[0]);
      const e = Math.atan2(P2[1] - Vx[1], P2[0] - Vx[0]);
      let d = e - s;
      while (d < 0) d += Math.PI * 2;
      if (d > Math.PI) { s = e; d = Math.PI * 2 - d; }
      if (k2 > 0) {
        ctx.save();
        ctx.globalAlpha *= 0.85 * k2;
        ctx.fillStyle = COLS[i];
        ctx.beginPath(); ctx.moveTo(Vx[0], Vx[1]); ctx.arc(Vx[0], Vx[1], rW * k2, s, s + d); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      if (k3 > 0) {
        const tx = Vx[0] + (M[0] - Vx[0]) * k3, ty = Vx[1] + (M[1] - Vx[1]) * k3;
        let diff = acc - s;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const st = s + diff * k3;
        ctx.save();
        ctx.globalAlpha *= 0.92;
        ctx.fillStyle = COLS[i];
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.arc(tx, ty, rW * 1.25, st, st + d); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      acc += d;
    });
    ctx.fillStyle = PAINT.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (k1 > 0.2) {
      ctx.save();
      ctx.globalAlpha *= clamp01((k1 - 0.2) / 0.3);
      ctx.font = 'italic 700 ' + u * 0.045 + 'px ' + FONT_M;
      ctx.fillText('A', A[0] - u * 0.04, A[1] + u * 0.035);
      ctx.fillText('B', B[0] + u * 0.04, B[1] + u * 0.035);
      ctx.fillText('C', C[0] + u * 0.01, C[1] - u * 0.05);
      ctx.restore();
    }
    const k4 = ease(clamp01((p - 0.84) / 0.12));
    if (k4 > 0) {
      ctx.save();
      ctx.globalAlpha *= k4;
      ctx.font = '800 ' + u * 0.075 + 'px ' + FONT_M;
      ctx.fillStyle = PAINT.ink;
      ctx.fillText('180°', M[0], M[1] - u * 0.16);
      ctx.restore();
    }
  }

  /* ───────── 素材（ファイルはメモリの中だけ。object URL で使う） ───────── */
  let holder = null;
  // video/audio 要素の置き場（見えないが「画面の中」にあるので、どのブラウザでも絵が取れる）
  function mediaHolder() {
    if (!holder || !holder.isConnected) {
      holder = h('div', { 'aria-hidden': 'true', class: 'vid-holder', style: { position: 'fixed', left: '0', top: '0', width: '2px', height: '2px', overflow: 'hidden', opacity: '0.01', pointerEvents: 'none', zIndex: '-1' } });
      document.body.append(holder);
    }
    return holder;
  }
  function mediaType(f) {
    const t = String(f.type || '').toLowerCase();
    const ext = (String(f.name || '').split('.').pop() || '').toLowerCase();
    if (/heic|heif/.test(t) || ext === 'heic' || ext === 'heif') return 'heic';
    if (t.startsWith('video/')) return 'video';
    if (t.startsWith('image/')) return 'image';
    if (t.startsWith('audio/')) return 'audio';
    if (['mp4', 'mov', 'm4v', 'webm', 'mkv', '3gp'].includes(ext)) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp'].includes(ext)) return 'image';
    if (['mp3', 'm4a', 'aac', 'wav', 'ogg', 'oga', 'opus', 'flac'].includes(ext)) return 'audio';
    return '';
  }
  function waitFor(el, ok, bad, ms) {
    return new Promise((res, rej) => {
      let tm = 0;
      const done = (fn, v) => { clearTimeout(tm); el.removeEventListener(ok, onOk); if (bad) el.removeEventListener(bad, onBad); fn(v); };
      const onOk = () => done(res, true);
      const onBad = () => done(rej, new Error('load'));
      el.addEventListener(ok, onOk);
      if (bad) el.addEventListener(bad, onBad);
      if (ms) tm = setTimeout(() => done(rej, new Error('timeout')), ms);
    });
  }
  function thumbOf(src, w, hh) {
    if (!w || !hh) return '';
    const s = Math.min(1, 160 / Math.max(w, hh));
    const c = h('canvas', { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(hh * s)) });
    try { c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.72); } catch (e) { return ''; }
  }
  // 録画した WebM などは長さが入っていないので、いちど最後まで飛んで長さを知る
  async function fixDuration(el) {
    if (Number.isFinite(el.duration) && el.duration > 0) return el.duration;
    try { el.currentTime = 1e7; } catch (e) { return 0; }
    const until = performance.now() + 8000;
    while (performance.now() < until && !(Number.isFinite(el.duration) && el.duration > 0)) await sleep(60);
    return Number.isFinite(el.duration) ? el.duration : 0;
  }
  async function probeVideo(url) {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    try {
      await waitFor(v, 'loadedmetadata', 'error', 20000);
      const dur = await fixDuration(v);
      const out = { dur, w: v.videoWidth, h: v.videoHeight, thumb: '' };
      if (out.w) {
        try {
          v.currentTime = Math.min(dur * 0.3, 1);
          await waitFor(v, 'seeked', 'error', 6000);
          if (v.readyState < 2) await waitFor(v, 'loadeddata', 'error', 3000).catch(() => {});
          out.thumb = thumbOf(v, v.videoWidth, v.videoHeight);
        } catch (e) { /* サムネイルがなくても使える */ }
      }
      return out;
    } finally { v.removeAttribute('src'); try { v.load(); } catch (e) { /* noop */ } }
  }
  async function probeImage(url) {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    if (img.decode) await img.decode(); else await waitFor(img, 'load', 'error', 20000);
    const w = img.naturalWidth, hh = img.naturalHeight;
    if (!w || !hh) throw new Error('image');
    // 大きな写真は一度だけ縮めておく（毎コマ描くので、スマホでも軽く）
    let src = img;
    const k = 2048 / Math.max(w, hh);
    if (k < 1) {
      src = h('canvas', { width: Math.round(w * k), height: Math.round(hh * k) });
      const x = src.getContext('2d');
      x.imageSmoothingQuality = 'high';
      x.drawImage(img, 0, 0, src.width, src.height);
    }
    return { img: src, w: src.width || w, h: src.height || hh, thumb: thumbOf(img, w, hh) };
  }
  async function probeAudio(url) {
    const a = document.createElement('audio');
    a.preload = 'metadata'; a.src = url;
    try {
      await waitFor(a, 'loadedmetadata', 'error', 20000);
      return { dur: await fixDuration(a) };
    } finally { a.removeAttribute('src'); try { a.load(); } catch (e) { /* noop */ } }
  }
  // BGM の波形（タイムラインに出すだけ。大きすぎるファイルは省く）
  async function peaksOf(file) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC || file.size > 60e6) return null;
    const buf = await file.arrayBuffer();
    const ac = new OAC(1, 2, 44100);
    const ab = await new Promise((res, rej) => { const pr = ac.decodeAudioData(buf, res, rej); if (pr && pr.catch) pr.catch(rej); });
    const ch = ab.getChannelData(0), N = 300, step = Math.max(1, Math.floor(ch.length / N)), out = [];
    for (let i = 0; i < N; i++) {
      let mx = 0;
      for (let j = 0; j < step; j += 8) { const v = Math.abs(ch[i * step + j] || 0); if (v > mx) mx = v; }
      out.push(mx);
    }
    const top = Math.max(0.01, ...out);
    return out.map((v) => Math.round((v / top) * 100) / 100);
  }

  async function loadMedia(file, type, id) {
    const url = URL.createObjectURL(file);
    const m = { id: id || Kit.uid('m'), type, name: file.name || '素材', size: file.size || 0, url, file, dur: 0, w: 0, h: 0, thumb: '', img: null, peaks: null, els: [] };
    try {
      if (type === 'video') {
        const r = await probeVideo(url);
        if (!r.w) { m.type = 'audio'; m.dur = r.dur; } else Object.assign(m, r);
      } else if (type === 'image') Object.assign(m, await probeImage(url));
      else Object.assign(m, await probeAudio(url));
    } catch (e) { URL.revokeObjectURL(url); throw e; }
    const old = S.media.get(m.id);
    if (old) dropMedia(old);
    S.media.set(m.id, m);
    S.project.media[m.id] = { name: m.name, type: m.type, dur: round2(m.dur), w: m.w, h: m.h, size: m.size };
    if (m.type === 'audio') peaksOf(file).then((pk) => { m.peaks = pk; if (V) renderTimeline(); }).catch(() => {});
    return m;
  }
  function unloadEl(el) {
    try { el.pause(); } catch (e) { /* noop */ }
    const n = AU.nodes.get(el);
    if (n && n.g) { try { n.g.disconnect(); } catch (e) { /* noop */ } }
    AU.nodes.delete(el);
    el.removeAttribute('src');
    try { el.load(); } catch (e) { /* noop */ }
    el.remove();
  }
  function dropMedia(m) {
    for (const el of m.els || []) if (el) unloadEl(el);
    m.els = [];
    for (const [k, el] of audEls) if (el._media === m.id) { unloadEl(el); audEls.delete(k); }
    if (m.url) URL.revokeObjectURL(m.url);
    m.url = '';
  }

  function videoEl(c, slot) {
    const m = S.media.get(c.media);
    if (!m || m.type !== 'video' || !m.url) return null;
    slot = slot || 0;
    if (!m.els[slot]) {
      const v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
      v.preload = 'auto';
      v.src = m.url;
      v.addEventListener('seeked', () => onSeeked(v));
      v.addEventListener('loadeddata', requestDraw);
      v.addEventListener('canplay', requestDraw);
      mediaHolder().append(v);
      m.els[slot] = v;
    }
    return m.els[slot];
  }
  const audEls = new Map();
  function bgmEl(a) {
    const m = S.media.get(a.media);
    if (!m || m.type !== 'audio' || !m.url) return null;
    let el = audEls.get(a.id);
    if (el && el._url === m.url) return el;
    if (el) unloadEl(el);
    el = document.createElement('audio');
    el.preload = 'auto';
    el.src = m.url;
    el._media = m.id; el._url = m.url;
    mediaHolder().append(el);
    audEls.set(a.id, el);
    return el;
  }
  function allMediaEls() {
    const out = [];
    for (const m of S.media.values()) for (const el of m.els || []) if (el) out.push(el);
    for (const el of audEls.values()) out.push(el);
    return out;
  }

  /* ───────── 音（WebAudio。再生・書き出しのときだけ通す） ───────── */
  const AU = { ctx: null, master: null, nodes: new Map() };
  function audioCtx() {
    if (AU.ctx) return AU.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { AU.ctx = new AC(); } catch (e) { return null; }
    AU.master = AU.ctx.createGain();
    AU.master.connect(AU.ctx.destination);
    return AU.ctx;
  }
  // 再生ボタンなど、ユーザーの操作の中で呼ぶ（そうしないと音が出ない）
  function wakeAudio() {
    const ac = audioCtx();
    if (ac && ac.state !== 'running') { try { const pr = ac.resume(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) { /* noop */ } }
    return ac;
  }
  // createMediaElementSource は1つの要素に1回だけ。作ったら覚えておく
  function setGain(el, g) {
    const ac = AU.ctx;
    let n = AU.nodes.get(el);
    if (!n && ac && ac.state === 'running') {
      try {
        const src = ac.createMediaElementSource(el);
        const gn = ac.createGain();
        gn.gain.value = 0;
        src.connect(gn);
        gn.connect(AU.master);
        n = { src, g: gn };
      } catch (e) { n = { fail: true }; }
      AU.nodes.set(el, n);
    }
    if (n && n.g) {
      // 要素側の音量・消音も WebAudio に効くので、ここでは常に「そのまま」にしておく
      if (el.muted) el.muted = false;
      if (el.volume !== 1) el.volume = 1;
      if (ac.state === 'running') n.g.gain.setTargetAtTime(g, ac.currentTime, 0.02);
      else n.g.gain.value = g;
      return;
    }
    // WebAudio が使えないとき：要素の音量で（0 にはせず、消音で止める）
    el.muted = g <= 0.001;
    if (g > 0.001) el.volume = clamp(g, 0, 1);
  }
  function projectHasSound() {
    return S.project.audio.some((a) => S.media.has(a.media)) || S.project.clips.some((c) => c.kind === 'video' && !c.mute && c.vol > 0 && S.media.has(c.media));
  }

  /* ───────── 再生（時計と素材の同期。プレビューと書き出しで共通） ───────── */
  const PB = { playing: false, mode: 'preview', t: 0, base: 0, at: 0, raf: 0, timer: 0, stallAt: 0, holdAt: 0, held: false, sink: null, hooks: null };

  function seekEl(el, time) {
    el._want = time;
    if (el.seeking) return;
    try { el.currentTime = time; } catch (e) { /* noop */ }
  }
  function onSeeked(el) {
    if (!PB.playing && el._want != null && Math.abs(el.currentTime - el._want) > 0.03) { try { el.currentTime = el._want; } catch (e) { /* noop */ } return; }
    el._want = null;
    requestDraw();
  }
  let soundWarned = false;
  function playEl(el) {
    let pr;
    try { pr = el.play(); } catch (e) { return; }
    if (pr && pr.catch) {
      pr.catch((e) => {
        if (e && e.name === 'NotAllowedError' && !el.muted) {
          el.muted = true;
          el.play().catch(() => {});
          if (!soundWarned) { soundWarned = true; Kit.toast('音を出すには、もう一度再生ボタンを押してください'); }
        }
      });
    }
  }
  // いまの時刻に合わせて、動画・BGM の位置・再生・音量をそろえる。先頭の動画要素を返す
  function syncMedia(t, playing, held) {
    const L = getLayout();
    // 消した BGM の要素は片付ける
    if (audEls.size) { const ids = new Set(S.project.audio.map((a) => a.id)); for (const [id, el] of audEls) if (!ids.has(id)) { unloadEl(el); audEls.delete(id); } }
    const want = new Map();
    const put = (el, w) => { const cur = want.get(el); if (!cur || w.prio > cur.prio) want.set(el, w); };
    let lead = null;
    L.items.forEach((it, i) => {
      const c = it.clip;
      if (c.kind !== 'video') return;
      const el = videoEl(c, it.slot);
      if (!el) return;
      if (t >= it.start && t < it.end) {
        const lt = t - it.start;
        let g = c.mute ? 0 : c.vol * fadeAlpha(it, lt);
        if (it.ov > 0 && lt < it.ov) g *= clamp01(lt / it.ov);
        const nx = L.items[i + 1];
        if (nx && nx.ov > 0 && t >= nx.start) g *= 1 - clamp01((t - nx.start) / nx.ov);
        put(el, { prio: 3, time: Math.min(c.in + lt, c.out), play: playing, gain: g });
        if (!lead) lead = el;
      } else if (playing && it.start > t && it.start - t < 1.5) put(el, { prio: 2, time: c.in, play: false, gain: 0 });
      else put(el, { prio: 1, time: null, play: false, gain: 0 });
    });
    for (const a of S.project.audio) {
      const el = bgmEl(a);
      if (!el) continue;
      const m = S.media.get(a.media);
      const fileLen = Math.max(0.1, (m.dur || 0) - a.in);
      const end = bgmEnd(a, L.total);
      if (t >= a.start && t < end) {
        const lt = t - a.start;
        let g = a.vol;
        if (a.fadeIn > 0) g *= clamp01(lt / a.fadeIn);
        if (a.fadeOut > 0) g *= clamp01((end - t) / a.fadeOut);
        put(el, { prio: 3, time: a.in + (a.loop ? lt % fileLen : Math.min(lt, fileLen)), play: playing && !held, gain: g, loose: true });
      } else put(el, { prio: 1, time: null, play: false, gain: 0 });
    }
    for (const [el, w] of want) applyEl(el, w, playing && !held);
    return lead;
  }
  function applyEl(el, w, audible) {
    setGain(el, audible ? w.gain : 0);
    if (w.play) {
      const drift = el.currentTime - w.time;
      if (el.paused || el.ended) { if (Math.abs(drift) > 0.05) seekEl(el, w.time); playEl(el); }
      else if (Math.abs(drift) > (w.loose ? 0.35 : 0.3)) seekEl(el, w.time);
    } else {
      if (!el.paused) el.pause();
      if (w.time != null && Math.abs(el.currentTime - w.time) > 0.04 && !(el.seeking && el._want === w.time)) seekEl(el, w.time);
    }
  }
  function pauseAllMedia() { for (const el of allMediaEls()) { try { if (!el.paused) el.pause(); } catch (e) { /* noop */ } setGain(el, 0); } }

  function schedule() {
    if (!PB.playing) return;
    if (PB.mode === 'export' && document.hidden) PB.timer = setTimeout(() => frame(performance.now()), 33);
    else PB.raf = requestAnimationFrame(frame);
  }
  function stopEngine() {
    PB.playing = false;
    if (PB.raf) cancelAnimationFrame(PB.raf);
    if (PB.timer) clearTimeout(PB.timer);
    PB.raf = PB.timer = 0;
    PB.held = false;
    pauseAllMedia();
  }
  function startEngine(t0, mode, sink, hooks) {
    PB.mode = mode; PB.sink = sink; PB.hooks = hooks || {};
    PB.playing = true; PB.held = false; PB.stallAt = 0; PB.holdAt = 0;
    PB.base = t0; PB.at = performance.now(); PB.t = t0;
    syncMedia(t0, true, false);
    schedule();
  }
  function setHeld(on, now) {
    PB.held = on;
    PB.holdAt = on ? now : 0;
    if (!on) { PB.base = PB.t; PB.at = now; PB.stallAt = 0; }
    syncMedia(PB.t, true, on);
    if (PB.hooks.onHold) PB.hooks.onHold(on);
  }
  function frame(now) {
    PB.raf = 0; PB.timer = 0;
    if (!PB.playing) return;
    const L = getLayout();
    let t = PB.held ? PB.t : PB.base + (now - PB.at) / 1000;
    if (t >= L.total) {
      if (PB.mode === 'preview' && S.loop && L.total > 0.3) { t = 0; PB.base = 0; PB.at = now; }
      else {
        PB.t = L.total;
        drawFrame(PB.sink.ctx, L.total, PB.sink.size, { guide: PB.mode === 'preview' && S.guide });
        if (PB.hooks.onFrame) PB.hooks.onFrame(L.total);
        if (PB.hooks.onEnd) PB.hooks.onEnd();
        return;
      }
    }
    PB.t = t;
    const lead = syncMedia(t, true, PB.held);
    // 動画が読みこみ待ちのときは時計を止めて待つ（書き出しでは録画も一時停止）。4秒待ってもだめなら先へ進む
    const nearEnd = lead && lead.duration && lead.currentTime >= lead.duration - 0.25;
    const waiting = lead && !lead.ended && !nearEnd && (lead.seeking || lead.readyState < 3);
    if (waiting) {
      if (!PB.stallAt) PB.stallAt = now;
      if (!PB.held && now - PB.stallAt > 250) setHeld(true, now);
      else if (PB.held && now - PB.holdAt > 4000) setHeld(false, now);
    } else {
      PB.stallAt = 0;
      if (PB.held) setHeld(false, now);
    }
    drawFrame(PB.sink.ctx, t, PB.sink.size, { guide: PB.mode === 'preview' && S.guide });
    if (PB.hooks.onFrame) PB.hooks.onFrame(t);
    schedule();
  }

  let starting = false;
  function play() {
    if (PB.playing || EXP || !V || starting) return;
    const L = getLayout();
    if (L.total <= 0.05) return;
    if (S.poster) { S.poster = false; S.t = 0; }
    if (S.t >= L.total - 0.05) S.t = 0;
    const go = () => {
      starting = false;
      if (PB.playing || EXP || !V) return;
      startEngine(S.t, 'preview', V, {
        onFrame: (t) => { S.t = t; updateTransport(); },
        onEnd: () => pause(),
      });
      updateTransport();
    };
    // 初めての再生は、音の準備（AudioContext）がととのってから。素材が途中で切りかわらないように
    const ac = wakeAudio();
    if (ac && ac.state !== 'running' && projectHasSound()) { starting = true; Promise.race([ac.resume().catch(() => {}), sleep(400)]).then(go); }
    else go();
  }
  function pause() {
    if (!PB.playing || PB.mode !== 'preview') return;
    stopEngine();
    S.t = Math.min(PB.t, getLayout().total);
    syncMedia(S.t, false);
    requestDraw();
    updateTransport();
  }
  const togglePlay = () => (PB.playing ? pause() : play());
  function seek(t) {
    const L = getLayout();
    S.t = clamp(num(t), 0, L.total);
    S.poster = false;
    if (PB.playing && PB.mode === 'preview') {
      PB.base = S.t; PB.at = performance.now(); PB.t = S.t; PB.stallAt = 0;
      if (PB.held) setHeld(false, PB.at); else syncMedia(S.t, true);
    } else { syncMedia(S.t, false); requestDraw(); }
    updateTransport();
    reveal();
  }
  // 再生位置がタイムラインの外にあれば、見える所までずらす（操作で位置を変えたときだけ）
  function reveal() {
    if (!V || !V.ph) return;
    const sc = V.tlScroll, x = xOf(S.t);
    if (sc.clientWidth && (x > sc.scrollLeft + sc.clientWidth - 24 || x < sc.scrollLeft + 8)) sc.scrollLeft = Math.max(0, x - sc.clientWidth * 0.3);
  }
  const stepBy = (d) => { if (PB.playing) pause(); seek(S.t + d); };

  let drawRaf = 0;
  function requestDraw() {
    if (!V || PB.playing || drawRaf) return;
    drawRaf = requestAnimationFrame(() => {
      drawRaf = 0;
      if (!V || PB.playing) return;
      syncMedia(S.t, false);
      drawFrame(V.ctx, S.t, V.size, { guide: S.guide });
    });
  }
  // いまの場面の動画が表示できるまで待つ（画像保存・書き出しの前）
  async function settle(t, ms) {
    const until = performance.now() + ms;
    while (performance.now() < until) {
      let ok = true;
      for (const a of activeAt(getLayout(), t)) {
        if (a.it.clip.kind !== 'video') continue;
        const el = videoEl(a.it.clip, a.it.slot);
        if (el && (el.seeking || el.readyState < 2)) ok = false;
      }
      if (ok) return true;
      await sleep(50);
    }
    return false;
  }
  function fontsReady(ms) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const loads = ['700 40px "Zen Kaku Gothic New"', '500 40px "Zen Kaku Gothic New"', '800 40px "Shippori Mincho B1"'].map((f) => document.fonts.load(f, 'あA').catch(() => {}));
    return Promise.race([Promise.all(loads), sleep(ms)]);
  }

  /* ───────── 書き出し ───────── */
  function exportSize(format, hq) {
    const s = hq ? 1080 : 720, l = Math.round((s * 16) / 9);
    return format === 'v' ? [s, l] : format === 'h' ? [l, s] : [s, s];
  }
  function pickMime(withAudio) {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    const list = withAudio
      ? ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    return list.find((t) => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || '';
  }
  const canRecord = () => !!(window.MediaRecorder && window.HTMLCanvasElement && HTMLCanvasElement.prototype.captureStream);

  function openExport() {
    if (EXP || !V) return;
    pause();
    if (!canRecord()) {
      Kit.modal({
        title: 'このブラウザでは書き出せません',
        body: h('div', { class: 'stack' },
          h('p', null, '動画の書き出しには、ブラウザの録画の機能を使います。このブラウザには、その機能がありませんでした。'),
          h('p', null, 'パソコンの Chrome・Edge、または新しい Safari（iPhone は iOS 14.5 以降）で開くと書き出せます。編集の中身は保存されているので、開き直しても続きから作れます。')),
        actions: [{ label: '閉じる', kind: 'primary' }],
      });
      return;
    }
    const p = S.project, L = getLayout();
    if (L.total < 0.3) { Kit.toast('書き出す場面がありません。素材やタイトルを入れてください'); return; }
    let hq = !!Kit.pref.get('vid:hq', false);
    const ext = /mp4/.test(pickMime(true)) ? 'MP4' : 'WebM';
    const slots = p.clips.filter((c) => c.kind === 'slot').length;
    const missing = p.clips.filter(isMissing).length + p.audio.filter((a) => !S.media.has(a.media)).length;
    const sizeEl = h('span', { class: 'num' }, exportSize(p.format, hq).join('×'));
    const body = h('div', { class: 'stack' },
      h('p', null, FORMATS[p.format].label + '・長さ ' + fmtSec(L.total) + '・' + ext + ' で保存します。'),
      h('div', { class: 'field' },
        h('span', { class: 'vid-label' }, '画質'),
        Kit.seg([{ value: '720', label: '標準（720p）' }, { value: '1080', label: '高画質（1080p）' }], hq ? '1080' : '720', (v) => { hq = v === '1080'; sizeEl.textContent = exportSize(p.format, hq).join('×'); }, { label: '画質' }),
        h('div', { class: 'hint' }, '大きさ ', sizeEl, '。古いスマホでは標準のほうがなめらかに書き出せます。')),
      ext === 'WebM' ? h('p', { class: 'vid-note small' }, 'このブラウザでは WebM 形式になります。YouTube・TikTok にはそのまま載せられます。Instagram に載せるときは、パソコンの Chrome や Safari で書き出すと MP4 になります。') : null,
      slots ? h('p', { class: 'vid-note is-warn small' }, 'まだ素材を入れていない枠が ' + slots + ' つあります（「ここに動画や写真を入れる」と映ります）。') : null,
      missing ? h('p', { class: 'vid-note is-warn small' }, '入れ直していない素材が ' + missing + ' つあります（「素材を入れ直してください」と映り、音も入りません）。') : null,
      h('p', { class: 'small' }, '書き出しには、動画と同じ時間（約' + Math.ceil(L.total) + '秒）がかかります。終わるまで、この画面を開いたままにしてください。'));
    Kit.modal({
      title: '動画を書き出す', body,
      actions: [{ label: 'やめる', kind: 'ghost' }, {
        label: '書き出しを始める', kind: 'accent',
        onClick: () => { wakeAudio(); Kit.pref.set('vid:hq', hq); setTimeout(() => runExport(hq), 0); },
      }],
    });
  }

  function exportModal(cv) {
    const bar = h('i', { style: { width: '0%' } });
    const pct = h('strong', { class: 'num' }, '0%');
    const rest = h('span', { class: 'num muted' }, '準備しています…');
    const warn = h('p', { class: 'vid-exp-warn small', hidden: true });
    const body = h('div', { class: 'vid-exp' },
      h('div', { class: 'vid-exp-view' }, cv),
      h('div', { class: 'stack tight' },
        h('div', { class: 'row' }, pct, rest),
        h('div', { class: 'meter', role: 'progressbar', 'aria-label': '書き出しの進み具合' }, bar),
        h('p', { class: 'small' }, '終わるまで、この画面を開いたままにしてください。ほかのタブやアプリに切り替えると、映像が止まったりカクついたりします。'),
        warn,
        h('div', { class: 'btn-row' }, Kit.btn('やめる', () => cancelExport(), { kind: 'danger', class: 'vid-exp-stop' }))));
    const m = Kit.modal({ title: '動画を書き出しています', body, dismissable: false });
    return {
      close: m.close,
      progress(f, left) { const pc = Math.round(clamp01(f) * 100); bar.style.width = pc + '%'; pct.textContent = pc + '%'; rest.textContent = 'のこり ' + Math.max(0, Math.ceil(left)) + '秒'; },
      warn(msg) { warn.hidden = false; warn.textContent = msg; },
    };
  }
  function cancelExport() {
    if (!EXP) return;
    EXP.cancel = true;
    if (PB.mode === 'export') stopEngine();
    if (EXP.resolve) EXP.resolve();
  }

  async function runExport(hq) {
    if (EXP || !V) return;
    const p = S.project, total = getLayout().total;
    const [W, H] = exportSize(p.format, hq);
    const backT = S.t;
    const ac = AU.ctx;
    if (ac && ac.state !== 'running') { try { await Promise.race([ac.resume(), sleep(1500)]); } catch (e) { /* noop */ } }
    const audioOK = !!(ac && ac.state === 'running');
    if (!audioOK && projectHasSound()) { Kit.toast('音の準備ができませんでした。もう一度「動画を書き出す」から始めてください', { type: 'bad', ms: 7000 }); return; }
    const cv = h('canvas', { class: 'vid-exp-cv', width: W, height: H, 'aria-label': '書き出し中の映像' });
    const ctx = cv.getContext('2d');
    const ui = exportModal(cv);
    EXP = { cancel: false, hidden: false, ui, resolve: null };
    let dest = null, vtracks = [];
    try {
      syncMedia(0, false);
      await settle(0, 4000);
      await fontsReady(1500);
      if (EXP.cancel) throw { quiet: true };
      drawFrame(ctx, 0, { w: W, h: H });
      const vs = cv.captureStream(30);
      vtracks = vs.getVideoTracks();
      let tracks = vtracks.slice();
      if (audioOK) {
        dest = ac.createMediaStreamDestination();
        try { AU.master.disconnect(ac.destination); } catch (e) { /* noop */ }
        AU.master.connect(dest);
        tracks = tracks.concat(dest.stream.getAudioTracks());
      }
      const mime = pickMime(audioOK);
      const opts = { videoBitsPerSecond: hq ? 12e6 : 6e6 };
      if (mime) opts.mimeType = mime;
      if (audioOK) opts.audioBitsPerSecond = 160000;
      const rec = new MediaRecorder(new MediaStream(tracks), opts);
      const chunks = [];
      let recErr = null;
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((r) => { rec.onstop = r; });
      rec.onerror = (e) => { recErr = (e && e.error) || e; cancelExport(); };
      rec.start(1000);
      await new Promise((resolve) => {
        EXP.resolve = resolve;
        let lastUi = 0;
        startEngine(0, 'export', { ctx, size: { w: W, h: H } }, {
          onFrame: (t) => { const now = performance.now(); if (now - lastUi > 200) { lastUi = now; ui.progress(t / total, total - t); } },
          onHold: (held) => { try { if (held && rec.state === 'recording') rec.pause(); else if (!held && rec.state === 'paused') rec.resume(); } catch (e) { /* noop */ } },
          onEnd: () => { ui.progress(1, 0); stopEngine(); resolve(); },
        });
      });
      await sleep(180); // 最後のコマが入るのを少し待つ
      if (rec.state !== 'inactive') rec.stop();
      await stopped;
      if (recErr) throw recErr;
      if (EXP.cancel) throw { quiet: true };
      let blob = new Blob(chunks, { type: String(rec.mimeType || mime || 'video/webm').split(';')[0] });
      const ext = /mp4/.test(blob.type) ? 'mp4' : 'webm';
      if (ext === 'webm') blob = await fixWebmDuration(blob, total * 1000).catch(() => blob);
      ui.close();
      const name = Kit.safeName(p.title || '動画') + '_' + stamp() + '.' + ext;
      const ok = await Kit.download(name, blob);
      if (ok) Kit.toast('動画を保存しました（' + (blob.size / 1e6).toFixed(1) + 'MB・' + ext.toUpperCase() + '）', { ms: 5000 });
      if (EXP.hidden) Kit.toast('書き出しの途中で画面が切りかわりました。映像が止まっている所があれば、画面を開いたまま書き出し直してください', { ms: 9000 });
    } catch (e) {
      if (e && e.quiet) Kit.toast('書き出しをやめました');
      else { console.error(e); Kit.toast('書き出しの途中で問題が起きました。画質を「標準」にするか、ほかのブラウザで試してください', { type: 'bad', ms: 8000 }); }
    } finally {
      if (PB.mode === 'export') stopEngine();
      if (dest) {
        try { AU.master.disconnect(dest); } catch (e) { /* noop */ }
        try { AU.master.connect(ac.destination); } catch (e) { /* noop */ }
        for (const tr of dest.stream.getTracks()) tr.stop();
      }
      for (const tr of vtracks) tr.stop();
      ui.close();
      EXP = null;
      PB.mode = 'preview';
      if (V) { S.t = backT; syncMedia(S.t, false); requestDraw(); updateTransport(); }
    }
  }

  // 録画した WebM には長さが入っていないので、頭の Info に Duration を足す（できないときはそのまま）
  async function fixWebmDuration(blob, ms) {
    const head = new Uint8Array(await blob.slice(0, Math.min(blob.size, 1 << 16)).arrayBuffer());
    const id = (pos) => {
      const b = head[pos];
      const len = b & 0x80 ? 1 : b & 0x40 ? 2 : b & 0x20 ? 3 : b & 0x10 ? 4 : 0;
      if (!len || pos + len > head.length) return null;
      let v = 0;
      for (let i = 0; i < len; i++) v = v * 256 + head[pos + i];
      return { v, len };
    };
    const size = (pos) => {
      const b = head[pos];
      let len = 1, mask = 0x80;
      while (len <= 8 && !(b & mask)) { len++; mask >>= 1; }
      if (len > 8 || pos + len > head.length) return null;
      let v = b & (mask - 1), ones = v === mask - 1;
      for (let i = 1; i < len; i++) { v = v * 256 + head[pos + i]; if (head[pos + i] !== 0xff) ones = false; }
      return { v, len, unknown: ones };
    };
    const enc = (v, len) => { const o = new Uint8Array(len); for (let i = len - 1; i >= 0; i--) { o[i] = v % 256; v = Math.floor(v / 256); } o[0] |= 0x80 >> (len - 1); return o; };
    let e = id(0);
    if (!e || e.v !== 0x1a45dfa3) return blob;
    let s = size(e.len);
    let pos = e.len + s.len + s.v;
    e = id(pos);
    if (!e || e.v !== 0x18538067) return blob;
    const segSizePos = pos + e.len;
    const seg0 = size(segSizePos);
    if (!seg0) return blob;
    pos = segSizePos + seg0.len;
    while (pos < head.length - 12) {
      e = id(pos); if (!e) return blob;
      s = size(pos + e.len); if (!s) return blob;
      if (e.v === 0x114d9b74 || e.v === 0x1f43b675) return blob; // SeekHead（位置がずれる）/ Cluster が先
      if (e.v === 0x1549a966) {
        const dStart = pos + e.len + s.len, dEnd = dStart + s.v;
        if (s.unknown || dEnd > head.length) return blob;
        let scale = 1e6;
        for (let q = dStart; q < dEnd;) {
          const ce = id(q); if (!ce) return blob;
          const cs = size(q + ce.len); if (!cs) return blob;
          if (ce.v === 0x4489) return blob; // もう入っている
          if (ce.v === 0x2ad7b1) { let v = 0; for (let i = 0; i < cs.v; i++) v = v * 256 + head[q + ce.len + cs.len + i]; if (v) scale = v; }
          q += ce.len + cs.len + cs.v;
        }
        const du = new Uint8Array(11);
        du[0] = 0x44; du[1] = 0x89; du[2] = 0x88;
        new DataView(du.buffer).setFloat64(3, (ms * 1e6) / scale);
        if (s.v + du.length >= Math.pow(2, 7 * s.len) - 1) return blob;
        const parts = [];
        if (seg0.unknown) parts.push(blob.slice(0, pos + e.len));
        else {
          if (seg0.v + du.length >= Math.pow(2, 7 * seg0.len) - 1) return blob;
          parts.push(blob.slice(0, segSizePos), enc(seg0.v + du.length, seg0.len), blob.slice(segSizePos + seg0.len, pos + e.len));
        }
        parts.push(enc(s.v + du.length, s.len), blob.slice(dStart, dEnd), du, blob.slice(dEnd));
        return new Blob(parts, { type: blob.type });
      }
      if (s.unknown) return blob;
      pos += e.len + s.len + s.v;
    }
    return blob;
  }

  // この場面を画像で（YouTube のサムネイルなどに）
  async function savePicture() {
    if (EXP) return;
    pause();
    const p = S.project;
    if (getLayout().total <= 0) { Kit.toast('まだ場面がありません'); return; }
    const [W, H] = exportSize(p.format, !!Kit.pref.get('vid:hq', false));
    syncMedia(S.t, false);
    await settle(S.t, 2500);
    await fontsReady(800);
    const cv = h('canvas', { width: W, height: H });
    drawFrame(cv.getContext('2d'), S.t, { w: W, h: H });
    const blob = await Kit.img.toBlob(cv, 'image/png');
    if (!blob) { Kit.toast('画像を作れませんでした', { type: 'bad' }); return; }
    const ok = await Kit.download(Kit.safeName(p.title || '動画') + '_' + fmtT(S.t).replace(':', 'm').replace('.', 's') + '.png', blob);
    if (ok) Kit.toast('この場面を画像で保存しました');
  }

  /* ───────── 編集の操作と「元に戻す」 ───────── */
  let commitTimer = 0;
  function commitSoon() { clearTimeout(commitTimer); commitTimer = setTimeout(commit, 700); }
  function flushCommit() { if (commitTimer) commit(); }
  function commit() {
    clearTimeout(commitTimer);
    commitTimer = 0;
    if (!S.project) return;
    const doc = serialize();
    const now = JSON.stringify(doc);
    if (now === S.hist.last) return;
    S.hist.undo.push(S.hist.last);
    if (S.hist.undo.length > HIST_MAX) S.hist.undo.shift();
    S.hist.redo = [];
    S.hist.last = now;
    persist(doc);
  }
  function persist(doc) {
    Kit.store.set('video', doc || serialize());
    S.saved = true;
    if (S.project._sample) { delete S.project._sample; renderSampleBar(); }
    updateUndo();
  }
  function restore(json) {
    const doc = JSON.parse(json);
    doc.media = Object.assign({}, S.project.media, doc.media);
    S.project = normalize(doc);
    touch();
    if (!selected()) S.sel = null;
    const d2 = serialize();
    S.hist.last = JSON.stringify(d2);
    persist(d2);
    seek(Math.min(S.t, getLayout().total));
    renderAll();
  }
  function undo() {
    flushCommit();
    if (!S.hist.undo.length || EXP) return;
    pause();
    S.hist.redo.push(S.hist.last);
    S.hist.last = S.hist.undo.pop();
    restore(S.hist.last);
  }
  function redo() {
    flushCommit();
    if (!S.hist.redo.length || EXP) return;
    pause();
    S.hist.undo.push(S.hist.last);
    S.hist.last = S.hist.redo.pop();
    restore(S.hist.last);
  }
  function listOf(kind) { return kind === 'clip' ? S.project.clips : kind === 'text' ? S.project.texts : S.project.audio; }
  const findItem = (kind, id) => listOf(kind).find((x) => x.id === id) || null;
  function selected() { return S.sel ? findItem(S.sel.kind, S.sel.id) : null; }
  function select(kind, id, o = {}) {
    flushCommit();
    S.sel = kind && id ? { kind, id } : null;
    renderTimeline();
    renderInspector();
    renderSelInfo();
    if (o.edit && isNarrow()) setPanel('edit');
  }
  // 編集のあとにまとめて描き直す
  function edited(o = {}) {
    touch();
    commit();
    if (!V) return;
    if (o.bin) renderBin();
    renderTimeline();
    renderInspector();
    renderSelInfo();
    updateTransport();
    requestDraw();
  }

  function splitAtPlayhead() {
    if (EXP) return;
    pause();
    const t = S.t, sel = selected();
    if (sel && S.sel.kind === 'audio') { Kit.toast('BGM は分けられません。右の端をドラッグすると、途中で止められます'); return; }
    if (sel && S.sel.kind === 'text' && t > sel.start + 0.1 && t < sel.end - 0.1) {
      const b = Object.assign(Kit.clone(sel), { id: Kit.uid('t'), start: round2(t) });
      sel.end = round2(t);
      S.project.texts.splice(S.project.texts.indexOf(sel) + 1, 0, b);
      S.sel = { kind: 'text', id: b.id };
      edited();
      return;
    }
    const L = getLayout();
    const inside = (x) => t > x.start + 0.1 && t < x.end - 0.1;
    const it = (sel && S.sel.kind === 'clip' && L.byId.get(sel.id) && inside(L.byId.get(sel.id)) ? L.byId.get(sel.id) : null) || L.items.slice().reverse().find(inside);
    if (!it) { Kit.toast('分けたい場面の上に、再生位置を合わせてください'); return; }
    const c = it.clip, lt = round2(t - it.start);
    const b = Object.assign(Kit.clone(c), { id: Kit.uid('c'), xfade: false, fadeIn: 0 });
    c.fadeOut = 0;
    if (c.kind === 'video') { c.out = round2(c.in + lt); b.in = c.out; }
    else {
      const full = c.dur;
      c.dur = lt;
      b.dur = round2(full - lt);
      if (c.kind === 'image' || c.kind === 'gen') { const span = c.span || full, off = c.off || 0; c.span = span; b.span = span; c.off = off; b.off = round2(off + lt); }
      if (c.kind === 'title') b.rise = false;
    }
    S.project.clips.splice(S.project.clips.indexOf(c) + 1, 0, b);
    S.sel = { kind: 'clip', id: b.id };
    edited();
  }
  async function deleteSelected() {
    if (EXP) return;
    const s = S.sel, obj = selected();
    if (!obj) return;
    pause();
    const list = listOf(s.kind);
    list.splice(list.indexOf(obj), 1);
    S.sel = null;
    edited();
    Kit.toast(s.kind === 'clip' ? '場面を消しました' : s.kind === 'text' ? 'テロップを消しました' : 'BGM を外しました', { action: { label: '元に戻す', onClick: undo } });
  }
  function duplicateSelected() {
    if (EXP) return;
    const s = S.sel, obj = selected();
    if (!obj) return;
    pause();
    const list = listOf(s.kind);
    const b = Object.assign(Kit.clone(obj), { id: Kit.uid(s.kind === 'clip' ? 'c' : s.kind === 'text' ? 't' : 'a') });
    if (s.kind === 'clip') b.xfade = false;
    if (s.kind === 'text') { const len = obj.end - obj.start; b.start = round2(obj.end); b.end = round2(obj.end + len); }
    if (s.kind === 'audio') b.start = round2(S.t);
    list.splice(list.indexOf(obj) + 1, 0, b);
    S.sel = { kind: s.kind, id: b.id };
    edited();
  }
  function moveSelected(d) {
    if (EXP || !S.sel || S.sel.kind !== 'clip') return;
    const arr = S.project.clips, i = arr.findIndex((c) => c.id === S.sel.id), j = i + d;
    if (i < 0 || j < 0 || j >= arr.length) return;
    pause();
    [arr[i], arr[j]] = [arr[j], arr[i]];
    edited();
    const it = getLayout().byId.get(S.sel.id);
    if (it) seek(it.start + Math.min(0.5, it.dur / 2));
  }
  function addTelop() {
    if (EXP) return;
    pause();
    // 再生位置から3秒。映像の終わりを越えないように収める（越えると黒い画面が足されるため）
    const L = getLayout(), endMax = L.mainEnd > 0 ? L.mainEnd : Infinity;
    let start = Math.max(0, Math.min(S.t, L.total));
    let end = Math.min(start + 3, endMax);
    if (end - start < 1) { end = Math.min(endMax, Math.max(end, 3)); start = Math.max(0, end - 3); }
    const x = mkText({ start: round2(start), end: round2(end) });
    S.project.texts.push(x);
    S.sel = { kind: 'text', id: x.id };
    edited();
    if (isNarrow()) setPanel('edit');
    focusSoon('#vid-f-ttext');
  }
  function addTitle() {
    if (EXP) return;
    pause();
    const L = getLayout();
    const cur = S.sel && S.sel.kind === 'clip' ? L.byId.get(S.sel.id) : L.items.find((it) => S.t >= it.start && S.t < it.end);
    const c = mkClip('title', Object.assign({ text: 'タイトル', sub: '' }, BG_PRESETS[0]));
    const at = cur ? cur.i + 1 : S.project.clips.length;
    S.project.clips.splice(at, 0, c);
    S.sel = { kind: 'clip', id: c.id };
    edited();
    const it = getLayout().byId.get(c.id);
    if (it) seek(it.start + Math.min(1, it.dur / 2));
    if (isNarrow()) setPanel('edit');
    focusSoon('#vid-f-text');
  }
  function focusSoon(sel) { if (isNarrow()) return; setTimeout(() => { const el = V && V.insp.querySelector(sel); if (el) { el.focus(); if (el.select) el.select(); } }, 30); }
  function setFormat(f) {
    if (!FORMATS[f] || f === S.project.format || EXP) return;
    S.project.format = f;
    S.zoom = S.zoomAuto ? 0 : S.zoom;
    edited();
    applyFormat();
    fitPreview();
  }

  /* 素材を入れる */
  function pickFiles(o = {}) {
    if (!V || EXP) return;
    V.fileTarget = o;
    const meta = o.relink ? metaOf(o.relink) : null;
    V.file.accept = o.accept || (meta ? (meta.type === 'audio' ? 'audio/*,.mp3,.m4a,.wav,.aac' : meta.type === 'image' ? 'image/*' : 'video/*,.mov,.mp4,.webm') : ACCEPT);
    V.file.multiple = !o.relink && !o.slot;
    V.file.click();
  }
  function findMissing(f, type) {
    for (const id of usedMediaIds()) {
      if (S.media.has(id)) continue;
      const m = metaOf(id);
      if (m && m.name === f.name && m.type === type && (!m.size || m.size === f.size)) return id;
    }
    return null;
  }
  async function addFiles(files, target) {
    if (!V || EXP) return;
    target = target || {};
    pause();
    const fresh = [], relinked = [];
    let i = 0, blocked = false;
    // 画面の設定（CSP）でファイルの再生が止められたときは、そう伝える
    const onCsp = (e) => { if (/^blob/.test(String(e.blockedURI || ''))) blocked = true; };
    document.addEventListener('securitypolicyviolation', onCsp);
    for (const f of files) {
      i++;
      const type = mediaType(f);
      if (type === 'heic') { Kit.toast('「' + f.name + '」（HEIC）はブラウザで開けません。JPEG で保存し直してから入れてください', { type: 'bad', ms: 7000 }); continue; }
      if (!type) { Kit.toast('「' + f.name + '」は使えないファイルです。動画・写真・音楽のファイルを選んでください', { type: 'bad', ms: 6000 }); continue; }
      let id = null;
      if (target.relink) {
        const meta = metaOf(target.relink);
        if (meta && meta.type !== type && !(meta.type === 'audio' && type === 'video')) { Kit.toast('前と同じ種類（' + TYPE_LABEL[meta.type] + '）のファイルを選んでください', { type: 'bad' }); continue; }
        id = target.relink;
      } else id = findMissing(f, type);
      setBusy('読み込み中… ' + f.name + (files.length > 1 ? '（' + i + '/' + files.length + '）' : ''));
      try {
        const m = await loadMedia(f, type, id);
        (id ? relinked : fresh).push(m);
      } catch (e) {
        if (blocked) Kit.toast('この画面では、動画や音楽のファイルを開けないようになっています。手元のブラウザでみせびらきを開くと使えます', { type: 'bad', ms: 9000 });
        else Kit.toast('「' + f.name + '」を開けませんでした。' + (type === 'video' ? 'この形式の動画は、このブラウザでは再生できないようです。MP4（H.264）で保存したものを試してください。' : 'ファイルが壊れていないか確かめてください。'), { type: 'bad', ms: 8000 });
      }
      if (target.relink || blocked) break;
    }
    document.removeEventListener('securitypolicyviolation', onCsp);
    setBusy('');
    if (!V) return;
    // つなぎ直した動画が前より短いときは、使う範囲を合わせる
    for (const m of relinked) {
      for (const c of S.project.clips) if (c.media === m.id && c.kind === 'video' && m.dur) { c.out = Math.min(c.out, round2(m.dur)); c.in = Math.min(c.in, Math.max(0, c.out - 0.2)); }
    }
    let last = null;
    if (fresh.length && (target.slot || target.place || S.autoPlace)) {
      fresh.forEach((m, k) => { last = placeMedia(m, { slot: k === 0 ? target.slot : null }); });
    }
    if (last) S.sel = last;
    touch();
    if (fresh.length || relinked.length) commit();
    renderAll();
    if (last && last.kind === 'clip') { const it = getLayout().byId.get(last.id); if (it) seek(it.start + Math.min(0.5, it.dur / 2)); }
    if (relinked.length) Kit.toast(relinked.length === 1 ? '「' + relinked[0].name + '」をつなぎ直しました' : relinked.length + 'つの素材をつなぎ直しました');
    else if (fresh.length) Kit.toast(fresh.length + 'つの素材を入れました' + (last ? '。タイムラインにも並べました' : ''));
  }
  // 素材をタイムラインに置く（空き枠があれば、そこに入れる）。置いたものを返す
  function placeMedia(m, o = {}) {
    const p = S.project, L = getLayout();
    if (m.type === 'audio') {
      const start = p.audio.length ? round2(Math.min(S.t, Math.max(0, L.total - 1))) : 0;
      const a = mkAudio({ media: m.id, start, loop: (m.dur || 0) < L.total - start });
      p.audio.push(a);
      touch();
      return { kind: 'audio', id: a.id };
    }
    const c = m.type === 'video' ? mkClip('video', { media: m.id, in: 0, out: round2(m.dur || 3) }) : mkClip('image', { media: m.id, dur: 3 });
    let si = -1;
    if (o.slot) si = p.clips.findIndex((x) => x.id === o.slot && x.kind === 'slot');
    else if (o.fill !== false) {
      const sel = S.sel && S.sel.kind === 'clip' ? p.clips.find((x) => x.id === S.sel.id) : null;
      si = sel && sel.kind === 'slot' ? p.clips.indexOf(sel) : p.clips.findIndex((x) => x.kind === 'slot');
    }
    if (si >= 0) {
      const s = p.clips[si];
      Object.assign(c, { fadeIn: s.fadeIn, fadeOut: s.fadeOut, xfade: s.xfade });
      if (c.kind === 'image') c.dur = s.dur; else c.out = round2(Math.min(m.dur || s.dur, s.dur));
      p.clips.splice(si, 1, c);
    } else {
      const at = o.afterSel && S.sel && S.sel.kind === 'clip' ? p.clips.findIndex((x) => x.id === S.sel.id) + 1 : p.clips.length;
      p.clips.splice(at > 0 ? at : p.clips.length, 0, c);
    }
    touch();
    return { kind: 'clip', id: c.id };
  }
  function placeFromBin(m) {
    if (EXP) return;
    pause();
    const r = placeMedia(m, { afterSel: true });
    S.sel = r;
    edited();
    if (r.kind === 'clip') { const it = getLayout().byId.get(r.id); if (it) seek(it.start + Math.min(0.5, it.dur / 2)); }
    Kit.toast(m.type === 'audio' ? 'BGM に入れました' : 'タイムラインに入れました');
  }
  function dropMediaAt(m, t, slotId) {
    if (EXP) return;
    pause();
    if (m.type === 'audio') {
      const a = mkAudio({ media: m.id, start: round2(Math.max(0, t)) });
      a.loop = (m.dur || 0) < getLayout().total - a.start;
      S.project.audio.push(a);
      S.sel = { kind: 'audio', id: a.id };
    } else if (slotId) S.sel = placeMedia(m, { slot: slotId });
    else {
      const L = getLayout();
      let idx = 0;
      for (const it of L.items) if ((it.start + it.end) / 2 < t) idx++;
      const c = m.type === 'video' ? mkClip('video', { media: m.id, in: 0, out: round2(m.dur || 3) }) : mkClip('image', { media: m.id, dur: 3 });
      S.project.clips.splice(idx, 0, c);
      S.sel = { kind: 'clip', id: c.id };
    }
    edited();
  }
  function fillSlot(slotId, m) { if (EXP) return; pause(); S.sel = placeMedia(m, { slot: slotId }); edited(); }
  async function removeMedia(m) {
    if (EXP) return;
    const uses = S.project.clips.filter((c) => c.media === m.id).length + S.project.audio.filter((a) => a.media === m.id).length;
    if (uses && !(await Kit.confirm({ title: '素材から外しますか', body: 'この素材を使っている場面・BGM（' + uses + 'つ）も消えます。', ok: '外す', danger: true }))) return;
    pause();
    S.project.clips = S.project.clips.filter((c) => c.media !== m.id);
    S.project.audio = S.project.audio.filter((a) => a.media !== m.id);
    dropMedia(m);
    S.media.delete(m.id);
    delete S.project.media[m.id];
    if (!selected()) S.sel = null;
    edited({ bin: true });
  }
  // 新しいプロジェクトにする（入れてある素材はそのまま使える）
  function startProject(proj) {
    if (EXP) return;
    pause();
    S.project = normalize(Object.assign(proj, { media: Object.assign({}, S.project ? S.project.media : {}) }));
    S.sel = null;
    S.t = 0;
    S.poster = false;
    S.zoom = 0;
    S.zoomAuto = true;
    touch();
    commit();
    renderAll();
    seek(0);
  }
  // 素材も外して空にする
  function clearAll(format) {
    pause();
    for (const m of S.media.values()) dropMedia(m);
    S.media.clear();
    startProject(blankProject(format || S.project.format));
  }

  /* ───────── 画面 ───────── */
  const isNarrow = () => !!V && V.root.clientWidth < 980;
  function setPanel(p) {
    S.panel = p;
    Kit.pref.set('vid:panel', p);
    if (!V) return;
    V.work.dataset.panel = p;
    V.switchSeg.setValue(p);
    if (p === 'timeline') { if (S.zoomAuto) S.zoom = 0; renderTimeline(); reveal(); }
  }
  function setBusy(msg) { if (!V) return; V.busy.textContent = msg; V.busy.hidden = !msg; }

  function buildView(root) {
    const v = { root, size: { w: 405, h: 720 }, playState: null, fileTarget: null };
    v.wrap = h('div', { class: 'vid-root' });
    v.exportBtn = Kit.btn('動画を書き出す', () => openExport(), { kind: 'accent', icon: 'download' });
    v.newBtn = Kit.btn('新しく作る', () => openNew(), { icon: 'plus' });
    v.head = Kit.appHead({ title: '動画エディター', desc: '切る・つなぐ・テロップ・BGM。縦動画にも。', actions: [v.newBtn, v.exportBtn] });
    v.sampleBox = h('div', { class: 'vid-sample' });
    v.file = h('input', { type: 'file', multiple: true, accept: ACCEPT, class: 'vid-file', id: 'vid-file', tabindex: '-1', 'aria-label': '素材のファイルを選ぶ' });
    v.file.addEventListener('change', () => {
      const fs = Array.from(v.file.files || []);
      const target = v.fileTarget;
      v.fileTarget = null;
      v.file.value = '';
      if (fs.length) addFiles(fs, target);
    });
    v.bin = h('section', { class: 'vid-bin vid-panel', 'aria-label': '素材' });
    v.busy = h('div', { class: 'vid-busy small', hidden: true, role: 'status' });

    v.cv = h('canvas', { class: 'vid-cv', width: 405, height: 720, role: 'img', 'aria-label': 'プレビュー（クリックで再生・一時停止）' });
    v.cv.addEventListener('click', () => togglePlay());
    v.ctx = v.cv.getContext('2d');
    v.empty = h('div', { class: 'vid-screen-empty', hidden: true },
      h('strong', null, 'まだ場面がありません'),
      h('p', { class: 'small' }, '素材を入れるか、ひな形から始めましょう。'),
      h('div', { class: 'btn-row' }, Kit.btn('素材を入れる', () => pickFiles({ place: true }), { kind: 'primary', icon: 'plus', sm: true }), Kit.btn('ひな形から作る', () => openNew(), { icon: 'layers', sm: true })));
    v.screen = h('div', { class: 'vid-screen' }, v.cv, v.empty);
    v.fmtSeg = Kit.seg(Object.values(FORMATS).map((f) => ({ value: f.id, label: f.label })), S.project.format, (val) => setFormat(val), { label: '画面の形' });
    v.picBtn = Kit.btn('画像で保存', () => savePicture(), { icon: 'image', sm: true, kind: 'ghost', title: 'この場面を画像で保存（サムネイルなどに）', class: 'vid-pic' });
    buildTransport(v);
    v.stage = h('section', { class: 'vid-stage', 'aria-label': 'プレビュー' }, h('div', { class: 'vid-stage-bar' }, v.fmtSeg, h('span', { class: 'vid-grow' }), v.picBtn), v.screen, v.transport);

    v.switchSeg = Kit.seg([{ value: 'bin', label: '素材' }, { value: 'timeline', label: 'タイムライン' }, { value: 'edit', label: '編集' }], S.panel, (val) => setPanel(val), { label: '作業を切り替える' });
    v.switch = h('div', { class: 'vid-switch' }, v.switchSeg);
    v.tl = h('section', { class: 'vid-tl vid-panel', 'aria-label': 'タイムライン' });
    v.insp = h('section', { class: 'vid-insp vid-panel', 'aria-label': '編集' });
    v.work = h('div', { class: 'vid-work', 'data-panel': S.panel }, v.bin, v.stage, v.switch, v.tl, v.insp);
    v.drop = h('div', { class: 'vid-drop', hidden: true }, h('div', null, Kit.icon('upload', 28), h('strong', null, 'ここに放すと素材に入ります'), h('span', { class: 'small muted' }, '動画・写真・音楽のファイル')));
    v.wrap.append(v.head, v.sampleBox, v.work, v.file, v.drop);
    root.append(v.wrap);
    buildTimelineShell(v);
    return v;
  }

  function buildTransport(v) {
    v.playBtn = Kit.btn('', () => togglePlay(), { icon: 'play', title: '再生（Space）', kind: 'primary', class: 'vid-play' });
    v.timeEl = h('span', { class: 'vid-time num', 'aria-live': 'off' }, '0:00.0 / 0:00.0');
    v.seekEl = h('input', { type: 'range', min: '0', max: '1', step: '0.01', value: '0', class: 'vid-seek', id: 'vid-seek', 'aria-label': '再生位置' });
    v.seekEl.addEventListener('input', () => seek(+v.seekEl.value));
    const tog = (label, icon, title, on, fn) => {
      const b = h('button', { type: 'button', class: 'btn sm ghost vid-toggle', 'aria-pressed': String(!!on), title, onclick: () => { const nv = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(nv)); fn(nv); } }, Kit.icon(icon), h('span', null, label));
      return b;
    };
    v.loopBtn = tog('くり返し', 'refresh', 'くり返し再生', S.loop, (nv) => { S.loop = nv; Kit.pref.set('vid:loop', nv); });
    v.guideBtn = tog('SNSの枠', 'eye', 'SNS の画面で隠れやすい所を表示（書き出しには入りません）', S.guide, (nv) => { S.guide = nv; Kit.pref.set('vid:guide', nv); requestDraw(); });
    v.transport = h('div', { class: 'vid-transport' },
      v.seekEl,
      h('div', { class: 'vid-transport-row' },
        v.playBtn, v.timeEl, h('span', { class: 'vid-grow' }),
        Kit.btn('', () => stepBy(-0.1), { icon: 'left', title: '0.1秒もどる（←）', sm: true, kind: 'ghost' }),
        Kit.btn('', () => stepBy(0.1), { icon: 'right', title: '0.1秒すすむ（→）', sm: true, kind: 'ghost' }),
        v.loopBtn, v.guideBtn));
  }

  function applyFormat() {
    if (!V) return;
    V.screen.style.setProperty('--ar', FORMATS[S.project.format].css);
    V.fmtSeg.setValue(S.project.format);
    V.screen.dataset.format = S.project.format;
  }
  function fitPreview() {
    if (!V) return;
    const f = FORMATS[S.project.format];
    const bw = V.screen.clientWidth, bh = V.screen.clientHeight;
    if (!bw || !bh) return;
    let cw = bw, ch = bw / f.ar;
    if (ch > bh) { ch = bh; cw = bh * f.ar; }
    V.cv.style.width = Math.floor(cw) + 'px';
    V.cv.style.height = Math.floor(ch) + 'px';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const long = clamp(Math.round(Math.max(cw, ch) * dpr), 320, 720);
    const W = f.ar >= 1 ? long : Math.round(long * f.ar), H = f.ar >= 1 ? Math.round(long / f.ar) : long;
    if (V.cv.width !== W || V.cv.height !== H) { V.cv.width = W; V.cv.height = H; }
    V.size.w = W;
    V.size.h = H;
    requestDraw();
  }

  function updateTransport() {
    if (!V) return;
    const L = getLayout(), t = S.t;
    const txt = fmtT(t) + ' / ' + fmtT(L.total);
    if (V.timeEl.textContent !== txt) V.timeEl.textContent = txt;
    V.seekEl.max = String(Math.max(0.01, round2(L.total)));
    if (document.activeElement !== V.seekEl || PB.playing) V.seekEl.value = String(t);
    const playing = PB.playing && PB.mode === 'preview';
    if (V.playState !== playing) {
      V.playState = playing;
      Kit.clear(V.playBtn).append(Kit.icon(playing ? 'pause' : 'play'));
      V.playBtn.title = playing ? '一時停止（Space）' : '再生（Space）';
      V.playBtn.setAttribute('aria-label', V.playBtn.title);
    }
    V.empty.hidden = L.total > 0;
    V.cv.style.visibility = L.total > 0 ? '' : 'hidden';
    updatePlayhead();
  }
  function updateUndo() {
    if (!V || !V.undoBtn) return;
    V.undoBtn.disabled = !S.hist.undo.length;
    V.redoBtn.disabled = !S.hist.redo.length;
  }
  function renderSampleBar() {
    if (!V) return;
    Kit.clear(V.sampleBox);
    if (!S.project._sample) return;
    V.sampleBox.append(Kit.sampleBar('これは例の動画です。素材を入れて自分の動画にできます。', async () => {
      const ok = await Kit.confirm({ title: 'サンプルを片付けますか', body: '例の動画を消して、空のプロジェクトから始めます。ほかのツールのサンプルも片付きます。', ok: '片付ける' });
      if (!ok) return;
      pause();
      await Kit.store.samplesOff();
      S.project = normalize(blankProject('v'));
      S.saved = false;
      S.hist = { undo: [], redo: [], last: JSON.stringify(serialize()) };
      S.sel = null; S.t = 0; S.poster = false; S.zoom = 0; S.zoomAuto = true;
      touch();
      renderAll();
      seek(0);
      Kit.toast('サンプルを片付けました');
    }));
  }
  function renderAll() {
    if (!V) return;
    renderSampleBar();
    applyFormat();
    renderBin();
    renderTimeline();
    renderInspector();
    renderSelInfo();
    updateUndo();
    updateTransport();
    fitPreview();
    requestDraw();
  }

  /* 素材の一覧 */
  function binItems() {
    const out = [...S.media.values()];
    for (const id of usedMediaIds()) if (!S.media.has(id)) out.push({ id, missing: true, meta: metaOf(id) || { name: '（名前なし）', type: 'video' } });
    return out;
  }
  function renderBin() {
    if (!V) return;
    const box = V.bin;
    Kit.clear(box);
    const items = binItems();
    const auto = h('input', { type: 'checkbox', id: 'vid-autoplace', checked: S.autoPlace });
    auto.addEventListener('change', () => { S.autoPlace = auto.checked; Kit.pref.set('vid:autoPlace', auto.checked); });
    box.append(
      h('div', { class: 'vid-panel-h' }, h('h2', null, '素材'), Kit.btn('素材を入れる', () => pickFiles(), { icon: 'plus', sm: true, kind: 'primary' })),
      h('p', { class: 'small muted' }, '動画・写真・音楽（BGM）のファイルを選ぶか、この画面にドラッグしてください。'),
      h('label', { class: 'check vid-auto', for: 'vid-autoplace' }, auto, h('span', null, '入れた素材をタイムラインにも並べる')),
      V.busy);
    if (!items.length) box.append(h('div', { class: 'vid-bin-empty small' }, 'まだ素材はありません。'));
    else box.append(h('div', { class: 'vid-media-list' }, items.map(mediaRow)));
    box.append(h('p', { class: 'tiny muted vid-bin-note' }, '素材のファイルはこの端末の中だけで使い、どこにも送りません。ページを開き直したときは、同じファイルを入れ直してください（編集の中身は残っています）。'));
  }
  function mediaRow(x) {
    const meta = x.missing ? x.meta : x;
    const th = h('div', { class: 'vid-media-th' + (x.missing ? ' is-missing' : '') }, !x.thumb ? Kit.icon(x.missing ? 'warn' : TYPE_ICON[meta.type] || 'film', 18) : null);
    if (x.thumb) th.style.backgroundImage = 'url("' + x.thumb + '")';
    const sub = x.missing ? '入れ直してください' : TYPE_LABEL[meta.type] + (meta.dur ? '・' + fmtT(meta.dur) : '');
    const acts = x.missing
      ? [Kit.btn('入れ直す', () => pickFiles({ relink: x.id }), { sm: true, title: '「' + meta.name + '」を選び直す' })]
      : [Kit.btn('', () => placeFromBin(x), { icon: 'plus', sm: true, title: meta.type === 'audio' ? 'BGM にする' : 'タイムラインに入れる' }), Kit.btn('', () => removeMedia(x), { icon: 'trash', sm: true, kind: 'ghost', title: '素材から外す' })];
    const row = h('div', { class: 'vid-media' + (x.missing ? ' is-missing' : ''), draggable: x.missing ? null : 'true', dataset: { media: x.id } },
      th, h('div', { class: 'vid-media-name ellipsis', title: meta.name }, meta.name), h('div', { class: 'vid-media-sub tiny' + (x.missing ? ' vid-warn-text' : ' muted') }, sub), h('div', { class: 'vid-media-act' }, acts));
    if (!x.missing) row.addEventListener('dragstart', (e) => { e.dataTransfer.setData('application/x-vid-media', x.id); e.dataTransfer.effectAllowed = 'copy'; });
    return row;
  }

  /* タイムライン */
  const TL = { padL: 14, padR: 160, ruler: 26, main: 58, lane: 30, aLane: 36 };
  const xOf = (t) => TL.padL + t * S.zoom;
  const tOf = (x) => (x - TL.padL) / S.zoom;
  function fitZoom(w) { return clamp((w - TL.padL - 48) / Math.max(5, getLayout().total), isNarrow() ? 20 : 8, 160); }

  function buildTimelineShell(v) {
    const b = (label, fn, icon, title, o = {}) => Kit.btn(label, fn, Object.assign({ icon, title, sm: true }, o));
    v.undoBtn = b('', undo, 'undo', '元に戻す（Ctrl+Z）', { kind: 'ghost' });
    v.redoBtn = b('', redo, 'redo', 'やり直す（Shift+Ctrl+Z）', { kind: 'ghost' });
    v.splitBtn = b('分ける', splitAtPlayhead, 'scissors', '再生位置で分ける（S）');
    v.dupBtn = b('', duplicateSelected, 'copy', '複製する');
    v.leftBtn = b('', () => moveSelected(-1), 'left', '前へ動かす');
    v.rightBtn = b('', () => moveSelected(1), 'right', '後ろへ動かす');
    v.delBtn = b('', deleteSelected, 'trash', '削除（Delete）', { kind: 'danger' });
    v.addTextBtn = b('テロップ', addTelop, 'text', 'テロップを足す');
    v.addTitleBtn = b('タイトル', addTitle, 'layers', 'タイトルの場面を足す');
    v.addMediaBtn = b('素材', () => pickFiles({ place: true }), 'plus', '素材を入れる', { class: 'vid-add-media' });
    v.tlBar = h('div', { class: 'vid-tl-bar', role: 'toolbar', 'aria-label': 'タイムラインの操作' },
      h('div', { class: 'vid-tl-group' }, v.undoBtn, v.redoBtn),
      h('div', { class: 'vid-tl-group vid-tl-edit' }, v.splitBtn, v.dupBtn, v.leftBtn, v.rightBtn, v.delBtn),
      h('div', { class: 'vid-tl-group' }, v.addTextBtn, v.addTitleBtn, v.addMediaBtn),
      h('span', { class: 'vid-grow' }),
      h('div', { class: 'vid-tl-group' },
        b('', () => zoomBy(1 / 1.5), 'minus', '縮めて表示', { kind: 'ghost' }),
        b('全体', () => { S.zoomAuto = true; S.zoom = 0; renderTimeline(); V.tlScroll.scrollLeft = 0; }, null, '全体が見えるように', { kind: 'ghost' }),
        b('', () => zoomBy(1.5), 'plus', '広げて表示', { kind: 'ghost' })));
    v.selInfo = h('div', { class: 'vid-selinfo small' });
    v.tlHeads = h('div', { class: 'vid-tl-heads', 'aria-hidden': 'true' });
    v.tlInner = h('div', { class: 'vid-tl-inner' });
    v.tlScroll = h('div', { class: 'vid-tl-scroll' }, v.tlInner);
    v.tl.append(v.tlBar, v.selInfo, h('div', { class: 'vid-tl-box' }, v.tlHeads, v.tlScroll),
      h('p', { class: 'vid-tl-hint tiny muted' }, '場面を選んで端をドラッグすると長さが変わります。上の目盛りをドラッグして再生位置を動かせます。'));
    bindTimeline(v);
  }

  function lanes(items, range) {
    const sorted = items.map((x) => ({ x, r: range(x) })).sort((a, b) => a.r[0] - b.r[0]);
    const ends = [], of = new Map();
    for (const s of sorted) {
      let k = ends.findIndex((e) => e <= s.r[0] + 1e-3);
      if (k < 0) { k = ends.length; ends.push(0); }
      ends[k] = s.r[1];
      of.set(s.x.id, k);
    }
    return { count: ends.length, of };
  }
  const isSel = (kind, id) => !!S.sel && S.sel.kind === kind && S.sel.id === id;
  function handles() { return [h('span', { class: 'vid-h vid-h-l', dataset: { edge: 'l' }, title: '長さを変える' }), h('span', { class: 'vid-h vid-h-r', dataset: { edge: 'r' }, title: '長さを変える' })]; }
  const firstLine = (s) => String(s || '').split('\n').find((l) => l.trim()) || '';
  function clipLabel(c) {
    if (c.kind === 'title') return firstLine(c.text) || 'タイトル';
    if (c.kind === 'gen') return '動く図：' + (GENS[c.gen] || '');
    if (c.kind === 'slot') return 'ここに動画や写真を入れる';
    if (isMissing(c)) return '素材を入れ直してください';
    const m = metaOf(c.media);
    return m ? String(m.name).replace(/\.[^.]+$/, '') : KIND_LABEL[c.kind];
  }
  const genThumbs = new Map();
  function genThumb(kind, format) {
    const key = kind + format;
    if (genThumbs.has(key)) return genThumbs.get(key);
    const f = FORMATS[format];
    const W = f.ar >= 1 ? 96 : Math.round(96 * f.ar), H = f.ar >= 1 ? Math.round(96 / f.ar) : 96;
    const c = h('canvas', { width: W, height: H });
    drawGen(c.getContext('2d'), { gen: kind }, 0.7, 1, W, H);
    const url = c.toDataURL('image/png');
    genThumbs.set(key, url);
    return url;
  }
  function bowtie() { return Kit.svg('svg', { viewBox: '0 0 24 24', width: 12, height: 12, 'aria-hidden': 'true' }, Kit.svg('path', { d: 'M4 6l8 6-8 6zM20 6l-8 6 8 6z', fill: 'currentColor' })); }
  function waveSvg(peaks, a, blockDur, widthPx) {
    const m = metaOf(a.media), dur = (m && m.dur) || 1, fileLen = Math.max(0.1, dur - a.in);
    const n = Math.max(2, Math.min(400, Math.round(widthPx / 3)));
    let d = '';
    for (let i = 0; i < n; i++) {
      const tt = (i / (n - 1)) * blockDur;
      const pos = a.in + (a.loop ? tt % fileLen : Math.min(tt, fileLen));
      const v = peaks[Math.min(peaks.length - 1, Math.floor((pos / dur) * peaks.length))] || 0;
      const x = ((i / (n - 1)) * 100).toFixed(2);
      d += 'M' + x + ' ' + (50 - v * 42).toFixed(1) + 'V' + (50 + v * 42).toFixed(1);
    }
    return Kit.svg('svg', { class: 'vid-wave', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, Kit.svg('path', { d, stroke: 'currentColor', 'stroke-width': '1.4', 'vector-effect': 'non-scaling-stroke' }));
  }

  function renderTimeline() {
    if (!V) return;
    const v = V, L = getLayout(), p = S.project;
    const visW = v.tlScroll.clientWidth;
    if (!S.zoom || !Number.isFinite(S.zoom)) S.zoom = visW ? fitZoom(visW) : 40;
    const span = Math.max(L.total + 4, ((visW || 600) - TL.padL - 40) / S.zoom);
    v.tlInner.style.width = Math.ceil(xOf(span) + TL.padR) + 'px';
    const tL = lanes(p.texts, (x) => [x.start, x.end]);
    const aL = lanes(p.audio, (a) => [a.start, bgmEnd(a, L.total)]);
    const hT = Math.max(1, tL.count) * TL.lane, hA = Math.max(1, aL.count) * TL.aLane;
    Kit.clear(v.tlInner);

    // 目盛り
    const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
    const major = steps.find((s) => s * S.zoom >= 70) || 300;
    const minor = { 0.5: 0.1, 1: 0.25, 2: 0.5, 5: 1, 10: 2, 15: 5, 30: 10, 60: 15, 120: 30, 300: 60 }[major];
    const ruler = h('div', { class: 'vid-ruler', style: { height: TL.ruler + 'px', backgroundSize: (minor * S.zoom).toFixed(2) + 'px 6px', backgroundPosition: TL.padL + 'px 100%' }, title: 'ドラッグで再生位置を動かす' });
    for (let k = 0; k * major <= span + 1e-6; k++) {
      const t = k * major;
      ruler.append(h('span', { class: 'vid-tick', style: { left: xOf(t) + 'px' } }, major < 1 ? fmtT(t) : Math.floor(t / 60) + ':' + pad2(Math.round(t % 60))));
    }

    // 映像のトラック
    const main = h('div', { class: 'vid-track vid-track-main', style: { height: TL.main + 'px' }, dataset: { track: 'main' } });
    L.items.forEach((it, i) => {
      const c = it.clip, nx = L.items[i + 1];
      const x0 = xOf(it.start + it.ov / 2), x1 = xOf(it.end - (nx ? nx.ov / 2 : 0));
      const miss = isMissing(c);
      const el = h('div', {
        class: 'vid-blk vid-blk-' + c.kind + (isSel('clip', c.id) ? ' is-sel' : '') + (miss ? ' is-missing' : ''),
        role: 'button', tabindex: '0', 'aria-pressed': String(isSel('clip', c.id)),
        'aria-label': KIND_LABEL[c.kind] + '：' + clipLabel(c) + '（' + fmtSec(it.dur) + '）',
        dataset: { kind: 'clip', id: c.id },
        style: { left: x0 + 1 + 'px', width: Math.max(8, x1 - x0 - 2) + 'px' },
      });
      const m = c.media ? S.media.get(c.media) : null;
      if (m && m.thumb) el.style.backgroundImage = 'url("' + m.thumb + '")';
      else if (c.kind === 'title') el.style.backgroundImage = 'linear-gradient(135deg, ' + hex(c.bg1, '#2c5fae') + ', ' + hex(c.grad ? c.bg2 : c.bg1, '#0f2346') + ')';
      else if (c.kind === 'gen') el.style.backgroundImage = 'url("' + genThumb(c.gen, p.format) + '")';
      el.append(h('span', { class: 'vid-blk-label' }, miss ? Kit.icon('warn', 12) : null, clipLabel(c)), h('span', { class: 'vid-blk-dur num' }, fmtSec(it.dur)), ...handles());
      main.append(el);
      if (it.ov > 0) main.append(h('span', { class: 'vid-xf', title: 'クロスフェード', style: { left: xOf(it.start + it.ov / 2) + 'px' } }, bowtie()));
    });
    if (!L.items.length) main.append(h('span', { class: 'vid-track-empty' }, '映像（動画・写真・タイトル）はここに並びます'));

    // テロップのトラック
    const text = h('div', { class: 'vid-track vid-track-text', style: { height: hT + 'px' }, dataset: { track: 'text' } });
    for (const x of p.texts) {
      const lane = tL.of.get(x.id) || 0;
      text.append(h('div', {
        class: 'vid-blk vid-blk-text' + (isSel('text', x.id) ? ' is-sel' : ''),
        role: 'button', tabindex: '0', 'aria-pressed': String(isSel('text', x.id)), 'aria-label': 'テロップ：' + firstLine(x.text),
        dataset: { kind: 'text', id: x.id },
        style: { left: xOf(x.start) + 1 + 'px', width: Math.max(8, (x.end - x.start) * S.zoom - 2) + 'px', top: lane * TL.lane + 3 + 'px', height: TL.lane - 6 + 'px' },
      }, h('span', { class: 'vid-blk-label' }, firstLine(x.text) || '（文字なし）'), handles()));
    }
    if (!p.texts.length) text.append(h('button', { type: 'button', class: 'vid-track-add', onclick: addTelop }, Kit.icon('plus', 14), 'テロップを足す'));

    // BGM のトラック
    const audio = h('div', { class: 'vid-track vid-track-audio', style: { height: hA + 'px' }, dataset: { track: 'audio' } });
    for (const a of p.audio) {
      const lane = aL.of.get(a.id) || 0, end = bgmEnd(a, L.total);
      const w = Math.max(8, (end - a.start) * S.zoom - 2);
      const m = S.media.get(a.media), meta = metaOf(a.media);
      const el = h('div', {
        class: 'vid-blk vid-blk-audio' + (isSel('audio', a.id) ? ' is-sel' : '') + (!m ? ' is-missing' : ''),
        role: 'button', tabindex: '0', 'aria-pressed': String(isSel('audio', a.id)), 'aria-label': 'BGM：' + ((meta && meta.name) || ''),
        dataset: { kind: 'audio', id: a.id },
        style: { left: xOf(a.start) + 1 + 'px', width: w + 'px', top: lane * TL.aLane + 3 + 'px', height: TL.aLane - 6 + 'px' },
      });
      if (m && m.peaks) el.append(waveSvg(m.peaks, a, end - a.start, w));
      el.append(h('span', { class: 'vid-blk-label' }, !m ? Kit.icon('warn', 12) : Kit.icon('music', 12), !m ? '素材を入れ直してください' : String((meta && meta.name) || 'BGM').replace(/\.[^.]+$/, '') + (a.loop ? '（くり返し）' : '')), ...handles());
      audio.append(el);
    }
    if (!p.audio.length) audio.append(h('button', { type: 'button', class: 'vid-track-add', onclick: () => pickFiles({ accept: 'audio/*,.mp3,.m4a,.wav,.aac', place: true }) }, Kit.icon('plus', 14), 'BGM を入れる'));

    v.ph = h('div', { class: 'vid-ph' });
    v.tlInner.append(ruler, main, text, audio, v.ph);
    Kit.clear(v.tlHeads).append(
      h('div', { class: 'vid-tl-head', style: { height: TL.ruler + 'px' } }),
      h('div', { class: 'vid-tl-head', style: { height: TL.main + 'px' }, title: '映像' }, Kit.icon('film', 16)),
      h('div', { class: 'vid-tl-head', style: { height: hT + 'px' }, title: 'テロップ' }, Kit.icon('text', 16)),
      h('div', { class: 'vid-tl-head', style: { height: hA + 'px' }, title: 'BGM' }, Kit.icon('music', 16)));
    updatePlayhead();
    const s = S.sel, isClip = s && s.kind === 'clip';
    const idx = isClip ? p.clips.findIndex((c) => c.id === s.id) : -1;
    v.dupBtn.disabled = !s;
    v.delBtn.disabled = !s;
    v.leftBtn.disabled = !isClip || idx <= 0;
    v.rightBtn.disabled = !isClip || idx < 0 || idx >= p.clips.length - 1;
    updateUndo();
  }
  function updatePlayhead() {
    if (!V || !V.ph) return;
    const x = xOf(S.t);
    V.ph.style.transform = 'translateX(' + x + 'px)';
    if (PB.playing && PB.mode === 'preview') {
      const sc = V.tlScroll;
      if (sc.clientWidth && (x > sc.scrollLeft + sc.clientWidth - 30 || x < sc.scrollLeft)) sc.scrollLeft = Math.max(0, x - sc.clientWidth * 0.25);
    }
  }
  function zoomBy(f, clientX) {
    if (!V) return;
    const sc = V.tlScroll, r = sc.getBoundingClientRect();
    const ax = clientX != null ? clientX - r.left : clamp(xOf(S.t) - sc.scrollLeft, 0, sc.clientWidth);
    const at = tOf(sc.scrollLeft + ax);
    S.zoom = clamp((S.zoom || 40) * f, 6, 320);
    S.zoomAuto = false;
    renderTimeline();
    sc.scrollLeft = Math.max(0, xOf(at) - ax);
  }
  function renderSelInfo() {
    if (!V) return;
    const obj = selected();
    Kit.clear(V.selInfo);
    V.selInfo.hidden = !obj;
    if (!obj) return;
    const k = S.sel.kind;
    const label = k === 'clip' ? KIND_LABEL[obj.kind] + '：' + clipLabel(obj) : k === 'text' ? 'テロップ：' + (firstLine(obj.text) || '（文字なし）') : 'BGM';
    V.selInfo.append(h('span', { class: 'ellipsis' }, '選んでいるもの　', h('strong', null, label)), Kit.btn('編集する', () => setPanel('edit'), { sm: true, icon: 'edit' }));
  }

  // スナップ：場面の切れ目・再生位置・ほかのテロップの端に吸いつく
  function snapT(t, exceptId) {
    const L = getLayout(), pts = [0, S.t, L.mainEnd];
    for (const it of L.items) pts.push(it.start, it.end);
    for (const x of S.project.texts) if (x.id !== exceptId) pts.push(x.start, x.end);
    const thr = 8 / S.zoom;
    let best = t, bd = thr;
    for (const q of pts) { const d = Math.abs(q - t); if (d < bd) { bd = d; best = q; } }
    return round2(best);
  }
  function applyTrim(d, dt) {
    const o = d.orig;
    if (d.kind === 'clip') {
      const c = findItem('clip', d.id);
      if (!c) return;
      if (c.kind === 'video') {
        const meta = metaOf(c.media), maxD = meta && meta.dur ? meta.dur : 36000;
        if (d.edge === 'r') c.out = round2(clamp(o.out + dt, o.in + 0.2, maxD));
        else c.in = round2(clamp(o.in + dt, 0, o.out - 0.2));
      } else c.dur = round2(clamp(o.dur + (d.edge === 'r' ? dt : -dt), 0.3, 600));
      touch();
      const it = getLayout().byId.get(c.id);
      if (it) seek(d.edge === 'r' ? Math.max(it.start, it.end - 0.04) : it.start + 0.01);
    } else if (d.kind === 'text') {
      const x = findItem('text', d.id);
      if (!x) return;
      if (d.edge === 'l') x.start = clamp(snapT(o.start + dt, x.id), 0, round2(o.end - 0.2));
      else x.end = Math.max(round2(o.start + 0.2), snapT(o.end + dt, x.id));
      touch();
      seek(d.edge === 'l' ? x.start : Math.max(x.start, x.end - 0.04));
    } else {
      const a = findItem('audio', d.id);
      if (!a) return;
      if (d.edge === 'l') {
        const curLen = bgmEnd(o, getLayout().total) - o.start;
        const delta = clamp(dt, Math.max(-o.in, -o.start), Math.max(0, curLen - 0.3));
        a.start = round2(o.start + delta);
        a.in = round2(o.in + delta);
        if (o.len > 0) a.len = round2(Math.max(0.3, o.len - delta));
      } else {
        const curLen = (o.len > 0 ? o.len : bgmEnd(o, getLayout().total) - o.start);
        a.len = round2(Math.max(0.3, curLen + dt));
      }
      touch();
    }
    renderTimeline();
  }

  function bindTimeline(v) {
    const sc = v.tlScroll;
    let drag = null, ins = null;
    const timeAt = (cx) => tOf(cx - v.tlInner.getBoundingClientRect().left);
    const edgeScroll = (e) => { const r = sc.getBoundingClientRect(); if (e.clientX > r.right - 28) sc.scrollLeft += 14; else if (e.clientX < r.left + 28) sc.scrollLeft -= 14; };
    const capture = (e) => { try { sc.setPointerCapture(e.pointerId); } catch (er) { /* noop */ } };
    const insMark = (x) => {
      if (!ins) { ins = h('span', { class: 'vid-ins' }); const tr = v.tlInner.querySelector('.vid-track-main'); if (tr) tr.append(ins); }
      ins.style.left = x + 'px';
    };
    const clearIns = () => { if (ins) ins.remove(); ins = null; };

    sc.addEventListener('pointerdown', (e) => {
      if (EXP) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('button')) return;
      const handle = e.target.closest('.vid-h'), blk = e.target.closest('.vid-blk');
      if (e.target.closest('.vid-ruler')) {
        e.preventDefault();
        pause();
        drag = { type: 'scrub', pid: e.pointerId };
        capture(e);
        seek(timeAt(e.clientX));
        return;
      }
      if (handle && blk) {
        e.preventDefault();
        pause();
        const kind = blk.dataset.kind, id = blk.dataset.id;
        if (!isSel(kind, id)) select(kind, id);
        const obj = findItem(kind, id);
        if (!obj) return;
        drag = { type: 'trim', pid: e.pointerId, kind, id, edge: handle.dataset.edge, x0: e.clientX, orig: Kit.clone(obj), moved: false };
        capture(e);
        return;
      }
      if (blk) {
        const kind = blk.dataset.kind, id = blk.dataset.id;
        if (e.pointerType === 'touch') { drag = { type: 'tapblk', pid: e.pointerId, kind, id, x0: e.clientX, y0: e.clientY }; return; }
        e.preventDefault();
        if (!isSel(kind, id)) select(kind, id);
        const obj = findItem(kind, id);
        if (!obj) return;
        drag = { type: 'press', pid: e.pointerId, kind, id, x0: e.clientX, y0: e.clientY, orig: Kit.clone(obj), moved: false };
        capture(e);
        return;
      }
      drag = { type: 'tap', pid: e.pointerId, x0: e.clientX, y0: e.clientY };
    });
    sc.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      if (drag.type === 'scrub') { seek(timeAt(e.clientX)); return; }
      const dx = e.clientX - drag.x0;
      if (drag.type === 'trim') {
        if (!drag.moved && Math.abs(dx) < 2) return;
        drag.moved = true;
        applyTrim(drag, dx / S.zoom);
        edgeScroll(e);
        return;
      }
      if (drag.type === 'press') { if (Math.abs(dx) < 5) return; drag.type = 'move'; pause(); }
      if (drag.type !== 'move') return;
      drag.moved = true;
      const o = drag.orig, dt = dx / S.zoom;
      if (drag.kind === 'clip') {
        const el = v.tlInner.querySelector('.vid-blk[data-id="' + drag.id + '"]');
        if (el) { el.classList.add('is-drag'); el.style.transform = 'translateX(' + dx + 'px)'; }
        const L = getLayout(), t = timeAt(e.clientX);
        const others = L.items.filter((it) => it.clip.id !== drag.id);
        let idx = 0;
        for (const it of others) if ((it.start + it.end) / 2 < t) idx++;
        drag.target = idx;
        insMark(idx === 0 ? xOf(others.length ? others[0].start : 0) : xOf(others[idx - 1].end));
      } else if (drag.kind === 'text') {
        const x = findItem('text', drag.id);
        if (!x) return;
        const len = o.end - o.start;
        let s = Math.max(0, o.start + dt);
        const s1 = snapT(s, x.id), s2 = snapT(s + len, x.id) - len;
        s = Math.max(0, round2(Math.abs(s1 - s) <= Math.abs(s2 - s) ? s1 : s2));
        x.start = s;
        x.end = round2(s + len);
        touch();
        renderTimeline();
        requestDraw();
      } else {
        const a = findItem('audio', drag.id);
        if (!a) return;
        a.start = Math.max(0, snapT(Math.max(0, o.start + dt), a.id));
        touch();
        renderTimeline();
      }
      edgeScroll(e);
    });
    const end = (e, cancel) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag;
      drag = null;
      try { sc.releasePointerCapture(e.pointerId); } catch (er) { /* noop */ }
      if (d.type === 'move' && d.kind === 'clip') {
        clearIns();
        const arr = S.project.clips, from = arr.findIndex((c) => c.id === d.id);
        d.moved = false;
        if (!cancel && from >= 0 && d.target != null && d.target !== from) { const [c] = arr.splice(from, 1); arr.splice(d.target, 0, c); d.moved = true; }
      }
      if (d.type === 'trim' || d.type === 'move') {
        if (d.moved) edited(); else { renderTimeline(); renderInspector(); }
        return;
      }
      if (cancel) return;
      const moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 10;
      if (d.type === 'tapblk' && !moved) select(d.kind, d.id);
      else if (d.type === 'tap' && !moved) { if (S.sel) select(null); seek(timeAt(e.clientX)); }
    };
    sc.addEventListener('pointerup', (e) => end(e, false));
    sc.addEventListener('pointercancel', (e) => end(e, true));
    sc.addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX); } }, { passive: false });
    sc.addEventListener('keydown', (e) => {
      const blk = e.target.closest && e.target.closest('.vid-blk');
      if (blk && e.key === 'Enter') { e.preventDefault(); select(blk.dataset.kind, blk.dataset.id, { edit: true }); }
    });
    // 素材の一覧からドラッグして置く
    sc.addEventListener('dragover', (e) => { if (Array.from(e.dataTransfer.types || []).includes('application/x-vid-media')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
    sc.addEventListener('drop', (e) => {
      const id = e.dataTransfer.getData('application/x-vid-media');
      if (!id) return;
      e.preventDefault();
      e.stopPropagation();
      const m = S.media.get(id);
      if (!m) return;
      const slot = e.target.closest && e.target.closest('.vid-blk-slot');
      dropMediaAt(m, timeAt(e.clientX), slot ? slot.dataset.id : null);
    });
  }

  /* 編集（インスペクター） */
  function live() { touch(); requestDraw(); scheduleTl(); commitSoon(); }
  let tlRaf = 0;
  function scheduleTl() { if (tlRaf) return; tlRaf = requestAnimationFrame(() => { tlRaf = 0; renderTimeline(); renderSelInfo(); }); }
  function numInput(id, value, o, onSet) {
    const inp = h('input', { type: 'number', id, step: String(o.step || 0.1), min: o.min != null ? String(o.min) : null, max: o.max != null ? String(o.max) : null, inputmode: 'decimal', value: String(round2(value)) });
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); if (Number.isFinite(v)) { onSet(v); live(); } });
    inp.addEventListener('change', () => {
      const v = parseFloat(inp.value);
      if (Number.isFinite(v)) onSet(v);
      touch();
      commit();
      renderTimeline();
      updateTransport();
      requestDraw();
      if (o.get) inp.value = String(round2(o.get()));
    });
    return inp;
  }
  function rangeField(id, label, value, o, onSet) {
    const out = h('span', { class: 'vid-range-val num' }, o.fmt(value));
    const inp = h('input', { type: 'range', id, min: String(o.min), max: String(o.max), step: String(o.step), value: String(value) });
    inp.addEventListener('input', () => { const v = +inp.value; onSet(v); out.textContent = o.fmt(v); live(); });
    inp.addEventListener('change', () => commit());
    return h('div', { class: 'field' }, h('label', { for: id, class: 'vid-range-label' }, h('span', null, label), out), inp);
  }
  function segField(label, opts, value, onSet) {
    const sg = Kit.seg(opts, value, (v) => { onSet(v); touch(); requestDraw(); renderTimeline(); commit(); }, { label });
    return h('div', { class: 'field' }, h('span', { class: 'vid-label' }, label), sg);
  }
  function checkField(id, label, checked, onSet) {
    const inp = h('input', { type: 'checkbox', id, checked: !!checked });
    inp.addEventListener('change', () => { onSet(inp.checked); touch(); requestDraw(); renderTimeline(); commit(); });
    return h('label', { class: 'check', for: id }, inp, h('span', null, label));
  }
  function colorField(id, label, value, onSet) {
    const inp = h('input', { type: 'color', id, value: hex(value, '#000000') });
    inp.addEventListener('input', () => { onSet(inp.value); live(); });
    inp.addEventListener('change', () => commit());
    return h('div', { class: 'field vid-color' }, h('label', { for: id }, label), inp);
  }
  function textField(id, label, value, onSet, o = {}) {
    const inp = o.rows ? h('textarea', { id, rows: o.rows }) : h('input', { type: 'text', id, maxlength: o.max || null });
    inp.value = value || '';
    inp.addEventListener('input', () => { onSet(inp.value); live(); });
    inp.addEventListener('change', () => commit());
    return Kit.field({ label, input: inp, hint: o.hint });
  }
  function inspHead(title, sub, extra) {
    return h('div', { class: 'vid-panel-h' }, h('h2', null, title), extra || null, sub ? h('span', { class: 'small muted num' }, sub) : null);
  }

  function renderInspector() {
    if (!V) return;
    const box = V.insp;
    const focusId = document.activeElement && box.contains(document.activeElement) ? document.activeElement.id : '';
    Kit.clear(box);
    const obj = selected();
    if (!obj) box.append(projectInspector());
    else if (S.sel.kind === 'clip') box.append(clipInspector(obj));
    else if (S.sel.kind === 'text') box.append(textInspector(obj));
    else box.append(audioInspector(obj));
    if (focusId) { const el = box.querySelector('#' + CSS.escape(focusId)); if (el && el.tagName !== 'TEXTAREA' && el.type !== 'text') el.focus(); }
  }

  function projectInspector() {
    const p = S.project, L = getLayout();
    const fact = (k, val) => [h('dt', null, k), h('dd', null, val)];
    const kbd = (k, label) => h('li', null, h('kbd', null, k), ' ', label);
    return h('div', { class: 'stack' },
      inspHead('この動画', '', p._sample ? h('span', { class: 'chip sample' }, 'サンプル') : null),
      textField('vid-f-title', '動画の名前', p.title, (val) => { p.title = val.slice(0, 80); }, { hint: '書き出すファイルの名前になります。', max: 80 }),
      h('dl', { class: 'vid-facts' },
        fact('画面の形', FORMATS[p.format].label + '（' + FORMATS[p.format].hint + '）'),
        fact('長さ', fmtSec(L.total)),
        fact('場面', p.clips.length + 'つ'),
        fact('テロップ', p.texts.length + 'つ'),
        fact('BGM', p.audio.length ? p.audio.length + 'つ' : 'なし')),
      h('p', { class: 'small muted' }, 'タイムラインの場面・テロップ・BGM を選ぶと、ここで細かく直せます。'),
      h('details', { class: 'help' }, h('summary', null, '使い方'),
        h('ol', null,
          h('li', null, '素材（動画・写真・音楽）を入れます。ファイルはこの端末の中だけで使います。'),
          h('li', null, 'タイムラインで場面を選び、端をドラッグして長さを変えます。はさみのボタンで分けられます。'),
          h('li', null, 'テロップやタイトルを足し、右の欄で文字や色を直します。'),
          h('li', null, '「動画を書き出す」で保存します。書き出しには動画と同じ時間がかかります。')),
        h('ul', { class: 'vid-keys' }, kbd('Space', '再生・一時停止'), kbd('← →', '0.1秒ずつ動かす'), kbd('S', '再生位置で分ける'), kbd('Delete', '選んだものを消す'), kbd('Ctrl+Z', '元に戻す'))));
  }

  function clipInspector(c) {
    const L = getLayout(), it = L.byId.get(c.id), idx = S.project.clips.indexOf(c);
    const meta = c.media ? metaOf(c.media) : null, miss = isMissing(c);
    const wrap = h('div', { class: 'stack' }, inspHead(KIND_LABEL[c.kind], it ? fmtT(it.start) + '〜' + fmtT(it.end) : ''));
    if (c.kind === 'slot') {
      const loaded = [...S.media.values()].filter((m) => m.type === 'video' || m.type === 'image');
      wrap.append(h('div', { class: 'vid-note' },
        h('p', null, 'ここに動画や写真を入れる枠です。'),
        h('div', { class: 'btn-row' }, Kit.btn('ファイルを選ぶ', () => pickFiles({ slot: c.id, place: true }), { kind: 'primary', icon: 'plus', sm: true })),
        loaded.length ? h('div', { class: 'vid-pick' }, h('div', { class: 'tiny muted' }, '入れてある素材から選ぶ'), loaded.map((m) => h('button', { type: 'button', class: 'vid-pick-item', onclick: () => fillSlot(c.id, m), title: m.name }, h('span', { class: 'vid-media-th', style: m.thumb ? { backgroundImage: 'url("' + m.thumb + '")' } : null }), h('span', { class: 'ellipsis' }, m.name)))) : null));
    }
    if (miss) {
      wrap.append(h('div', { class: 'vid-note is-warn' },
        h('p', null, h('strong', null, '素材を入れ直してください')),
        h('p', { class: 'small' }, '前に使った「' + ((meta && meta.name) || 'ファイル') + '」をもう一度選ぶと、元どおりにつながります。'),
        h('div', { class: 'btn-row' }, Kit.btn('ファイルを選び直す', () => pickFiles({ relink: c.media }), { kind: 'primary', sm: true }))));
    }
    if (c.kind === 'video') {
      if (meta) wrap.append(h('p', { class: 'small muted ellipsis', title: meta.name }, meta.name + (meta.dur ? '・もとの長さ ' + fmtSec(meta.dur) : '')));
      const maxD = meta && meta.dur ? meta.dur : 36000;
      wrap.append(h('div', { class: 'vid-2col' },
        Kit.field({ label: '使う範囲の始め（秒）', input: numInput('vid-f-in', c.in, { min: 0, get: () => c.in }, (v) => { c.in = round2(clamp(v, 0, c.out - 0.2)); }) }),
        Kit.field({ label: '終わり（秒）', input: numInput('vid-f-out', c.out, { min: 0.2, max: round2(maxD), get: () => c.out }, (v) => { c.out = round2(clamp(v, c.in + 0.2, maxD)); }) })),
        h('p', { class: 'hint vid-hint' }, 'タイムラインで場面の端をドラッグしても変えられます。'),
        rangeField('vid-f-vol', 'この動画の音量', c.vol, { min: 0, max: 2, step: 0.05, fmt: (v) => Math.round(v * 100) + '%' }, (v) => { c.vol = v; }),
        checkField('vid-f-mute', 'この動画の音を消す', c.mute, (v) => { c.mute = v; }));
    } else wrap.append(Kit.field({ label: '表示する長さ（秒）', input: numInput('vid-f-dur', c.dur, { min: 0.3, max: 600, get: () => c.dur }, (v) => { c.dur = round2(clamp(v, 0.3, 600)); }) }));
    if (c.kind === 'image') wrap.append(checkField('vid-f-zoom', 'ゆっくりズーム', c.zoom, (v) => { c.zoom = v; }));
    if (c.kind === 'video' || c.kind === 'image') wrap.append(fitControls(c));
    if (c.kind === 'title') wrap.append(...titleControls(c));
    if (c.kind === 'gen') {
      const kinds = Object.keys(GENS).map((k) => ({ value: k, label: GENS[k] }));
      wrap.append(segField('動く図', kinds, c.gen, (v) => { c.gen = v; }), h('p', { class: 'hint vid-hint' }, '例の動画のために描いた、動く図です。'));
    }
    wrap.append(h('div', { class: 'vid-2col' },
      rangeField('vid-f-fin', '始まりのフェード', c.fadeIn, { min: 0, max: 2, step: 0.1, fmt: fmtSec }, (v) => { c.fadeIn = v; }),
      rangeField('vid-f-fout', '終わりのフェード', c.fadeOut, { min: 0, max: 2, step: 0.1, fmt: fmtSec }, (v) => { c.fadeOut = v; })),
      h('p', { class: 'hint vid-hint' }, 'フェードは、黒い画面からふわっと出る・黒い画面へ消える動きです。'));
    if (idx > 0) wrap.append(checkField('vid-f-xf', '前の場面となめらかにつなぐ（クロスフェード 0.5秒）', c.xfade, (v) => { c.xfade = v; }));
    wrap.append(h('div', { class: 'btn-row vid-actions' },
      Kit.btn('分ける', splitAtPlayhead, { icon: 'scissors', sm: true, title: '再生位置で分ける（S）' }),
      Kit.btn('複製', duplicateSelected, { icon: 'copy', sm: true }),
      Kit.btn('', () => moveSelected(-1), { icon: 'left', sm: true, title: '前へ動かす', disabled: idx <= 0 }),
      Kit.btn('', () => moveSelected(1), { icon: 'right', sm: true, title: '後ろへ動かす', disabled: idx >= S.project.clips.length - 1 }),
      Kit.btn('削除', deleteSelected, { icon: 'trash', sm: true, kind: 'danger' })));
    return wrap;
  }
  function fitControls(c) {
    const box = h('div', { class: 'stack tight' });
    const draw = () => {
      Kit.clear(box);
      box.append(segField('画面への合わせ方', [{ value: 'cover', label: '画面いっぱい' }, { value: 'contain', label: '全体を表示（余白あり）' }], c.fit, (v) => { c.fit = v; draw(); }));
      if (c.fit === 'contain') {
        box.append(segField('余白', [{ value: 'blur', label: 'ぼかし' }, { value: 'color', label: '色' }], c.bgMode, (v) => { c.bgMode = v; draw(); }));
        if (c.bgMode === 'color') box.append(colorField('vid-f-bgc', '余白の色', c.bgColor, (v) => { c.bgColor = v; }));
      }
    };
    draw();
    return box;
  }
  function titleControls(c) {
    const sw = h('div', { class: 'vid-swatches', role: 'group', 'aria-label': '色の組み合わせ' }, BG_PRESETS.map((pr) => h('button', {
      type: 'button', class: 'vid-swatch', title: pr.name, 'aria-label': '色：' + pr.name,
      style: { backgroundImage: 'linear-gradient(135deg, ' + pr.bg1 + ', ' + pr.bg2 + ')' },
      onclick: () => { Object.assign(c, { bg1: pr.bg1, bg2: pr.bg2, color: pr.color, grad: true }); touch(); requestDraw(); renderTimeline(); commit(); renderInspector(); },
    })));
    return [
      textField('vid-f-text', '大きい文字', c.text, (v) => { c.text = v; }, { rows: 2 }),
      textField('vid-f-sub', '小さい文字', c.sub, (v) => { c.sub = v; }, { rows: 2 }),
      segField('文字の位置', [{ value: 'left', label: '左' }, { value: 'center', label: '中央' }, { value: 'right', label: '右' }], c.align, (v) => { c.align = v; }),
      h('div', { class: 'vid-2col' },
        segField('文字の大きさ', [{ value: 's', label: '小' }, { value: 'm', label: '中' }, { value: 'l', label: '大' }], c.size, (v) => { c.size = v; }),
        segField('書体', [{ value: 'mincho', label: '明朝' }, { value: 'gothic', label: 'ゴシック' }], c.font, (v) => { c.font = v; })),
      h('div', { class: 'field' }, h('span', { class: 'vid-label' }, '色の組み合わせ'), sw),
      h('div', { class: 'vid-3col' },
        colorField('vid-f-bg1', '背景の色', c.bg1, (v) => { c.bg1 = v; }),
        colorField('vid-f-bg2', '2色目', c.bg2, (v) => { c.bg2 = v; }),
        colorField('vid-f-color', '文字の色', c.color, (v) => { c.color = v; })),
      checkField('vid-f-grad', '2色のグラデーションにする', c.grad, (v) => { c.grad = v; }),
      checkField('vid-f-rise', '文字をふわっと出す', c.rise, (v) => { c.rise = v; }),
    ];
  }
  function textInspector(x) {
    const styleSel = h('select', { id: 'vid-f-style' }, TSTYLES.map((s) => h('option', { value: s.value, selected: s.value === x.style }, s.label)));
    styleSel.addEventListener('change', () => {
      const old = TSTYLES.find((s) => s.value === x.style), nu = TSTYLES.find((s) => s.value === styleSel.value);
      if (old && nu && String(x.color).toLowerCase() === old.color) x.color = nu.color;
      x.style = styleSel.value;
      touch(); requestDraw(); renderTimeline(); commit(); renderInspector();
    });
    const dyFmt = (v) => (v < 0 ? '上へ ' + -v + '%' : v > 0 ? '下へ ' + v + '%' : 'そのまま');
    return h('div', { class: 'stack' },
      inspHead('テロップ', fmtT(x.start) + '〜' + fmtT(x.end)),
      textField('vid-f-ttext', '文字', x.text, (v) => { x.text = v; }, { rows: 3, hint: '改行もそのまま映ります。' }),
      h('div', { class: 'vid-2col' },
        Kit.field({ label: '出る時間（秒）', input: numInput('vid-f-ts', x.start, { min: 0, get: () => x.start }, (v) => { x.start = round2(clamp(v, 0, x.end - 0.2)); }) }),
        Kit.field({ label: '消える時間（秒）', input: numInput('vid-f-te', x.end, { min: 0.2, get: () => x.end }, (v) => { x.end = round2(Math.max(v, x.start + 0.2)); }) })),
      h('div', { class: 'btn-row' },
        Kit.btn('いまの位置から出す', () => { const len = x.end - x.start; x.start = round2(S.t); x.end = round2(S.t + len); edited(); }, { sm: true }),
        Kit.btn('いまの位置で消す', () => { if (S.t > x.start + 0.2) { x.end = round2(S.t); edited(); } else Kit.toast('出る時間より後ろに再生位置を合わせてください'); }, { sm: true })),
      segField('位置', [{ value: 'top', label: '上' }, { value: 'mid', label: '中央' }, { value: 'bottom', label: '下' }], x.pos, (v) => { x.pos = v; }),
      rangeField('vid-f-dy', '細かい位置（上下）', x.dy, { min: -20, max: 20, step: 1, fmt: dyFmt }, (v) => { x.dy = v; }),
      segField('大きさ', [{ value: 's', label: '小' }, { value: 'm', label: '中' }, { value: 'l', label: '大' }, { value: 'xl', label: '特大' }], x.size, (v) => { x.size = v; }),
      Kit.field({ label: 'スタイル', input: styleSel }),
      h('div', { class: 'vid-2col' },
        segField('書体', [{ value: 'gothic', label: 'ゴシック' }, { value: 'mincho', label: '明朝' }], x.font, (v) => { x.font = v; }),
        colorField('vid-f-tcolor', '文字の色', x.color, (v) => { x.color = v; })),
      segField('出かた', [{ value: 'none', label: 'なし' }, { value: 'fade', label: 'フェード' }, { value: 'up', label: '下から' }], x.anim, (v) => { x.anim = v; }),
      h('div', { class: 'btn-row vid-actions' },
        Kit.btn('分ける', splitAtPlayhead, { icon: 'scissors', sm: true, title: '再生位置で分ける（S）' }),
        Kit.btn('複製', duplicateSelected, { icon: 'copy', sm: true }),
        Kit.btn('削除', deleteSelected, { icon: 'trash', sm: true, kind: 'danger' })));
  }
  function audioInspector(a) {
    const meta = metaOf(a.media), m = S.media.get(a.media), L = getLayout();
    const lenOut = h('span', { class: 'small muted' }, a.len > 0 ? fmtSec(a.len) : a.loop ? '最後まで（' + fmtSec(Math.max(0, L.total - a.start)) + '）' : '曲の終わりまで');
    return h('div', { class: 'stack' },
      inspHead('BGM', fmtT(a.start) + '〜' + fmtT(bgmEnd(a, L.total))),
      meta ? h('p', { class: 'small muted ellipsis', title: meta.name }, meta.name + (meta.dur ? '・' + fmtT(meta.dur) : '')) : null,
      !m ? h('div', { class: 'vid-note is-warn' }, h('p', null, h('strong', null, '素材を入れ直してください')), h('p', { class: 'small' }, '前に使った音楽のファイルをもう一度選ぶと、元どおりにつながります。'), h('div', { class: 'btn-row' }, Kit.btn('ファイルを選び直す', () => pickFiles({ relink: a.media }), { kind: 'primary', sm: true }))) : null,
      h('div', { class: 'vid-2col' },
        Kit.field({ label: '流し始める時間（秒）', input: numInput('vid-f-as', a.start, { min: 0, get: () => a.start }, (v) => { a.start = round2(Math.max(0, v)); }) }),
        Kit.field({ label: '曲の頭をとばす（秒）', input: numInput('vid-f-ain', a.in, { min: 0, get: () => a.in }, (v) => { a.in = round2(clamp(v, 0, Math.max(0, ((meta && meta.dur) || 600) - 0.5))); }) })),
      rangeField('vid-f-avol', '音量', a.vol, { min: 0, max: 1.5, step: 0.05, fmt: (v) => Math.round(v * 100) + '%' }, (v) => { a.vol = v; }),
      h('div', { class: 'vid-2col' },
        rangeField('vid-f-afi', 'フェードイン', a.fadeIn, { min: 0, max: 5, step: 0.1, fmt: fmtSec }, (v) => { a.fadeIn = v; }),
        rangeField('vid-f-afo', 'フェードアウト', a.fadeOut, { min: 0, max: 5, step: 0.1, fmt: fmtSec }, (v) => { a.fadeOut = v; })),
      checkField('vid-f-aloop', '短い曲はくり返して、動画の最後まで流す', a.loop, (v) => { a.loop = v; renderInspector(); }),
      h('div', { class: 'field' }, h('span', { class: 'vid-label' }, '長さ'), h('div', { class: 'row' }, lenOut, a.len > 0 ? Kit.btn('自動にもどす', () => { a.len = 0; edited(); }, { sm: true, kind: 'ghost' }) : null), h('div', { class: 'hint' }, 'タイムラインで右の端をドラッグすると、途中で止められます。')),
      h('div', { class: 'btn-row vid-actions' },
        Kit.btn('複製', duplicateSelected, { icon: 'copy', sm: true }),
        Kit.btn('外す', deleteSelected, { icon: 'trash', sm: true, kind: 'danger' })));
  }

  /* 新しく作る（空・ひな形・例） */
  function coverCanvas(clip, format) {
    const f = FORMATS[format];
    const W = f.ar >= 1 ? 128 : Math.round(84 * f.ar), H = f.ar >= 1 ? Math.round(128 / f.ar) : 84;
    const cv = h('canvas', { width: W * 2, height: H * 2, class: 'vid-new-cv', style: { width: W + 'px', height: H + 'px' } });
    drawTitle(cv.getContext('2d'), Object.assign({}, clip, { rise: false }), 1, cv.width, cv.height, 1);
    return cv;
  }
  async function openNew() {
    if (EXP) return;
    pause();
    const pf = await Kit.profile.get();
    let m = null;
    const pick = (fn) => () => { if (m) m.close(); fn(); };
    const card = (title, desc, cover, fn) => h('button', { type: 'button', class: 'vid-new-card', onclick: pick(fn) }, h('span', { class: 'vid-new-cover' }, cover), h('span', { class: 'vid-new-title' }, title), h('span', { class: 'tiny muted' }, desc));
    const shape = (f) => h('span', { class: 'vid-new-shape', style: { aspectRatio: FORMATS[f].css } });
    const sample = makeSample();
    const body = h('div', { class: 'stack' },
      h('h3', { class: 'vid-new-h' }, '空から作る'),
      h('div', { class: 'vid-new-grid' }, Object.values(FORMATS).map((f) => card(f.label, f.hint, shape(f.id), () => startProject(blankProject(f.id))))),
      h('h3', { class: 'vid-new-h' }, 'ひな形から作る'),
      h('div', { class: 'vid-new-grid' },
        TEMPLATES.map((tp) => { const proj = tp.build(pf); return card(tp.name, tp.desc, coverCanvas(proj.clips[0], tp.format), () => startProject(tp.build(pf))); }),
        card('例：無料体験会のお知らせ', 'ひらめき数学舎の例（縦・15秒）', coverCanvas(sample.clips[0], 'v'), () => startProject(makeSample()))),
      h('p', { class: 'small muted' }, 'いまの編集は置きかわります（「元に戻す」で戻せます）。入れてある素材はそのまま使えます。'),
      S.media.size ? h('div', { class: 'btn-row' }, Kit.btn('素材も外して、空から始める', pick(() => clearAll()), { sm: true, kind: 'danger', icon: 'trash' })) : null);
    m = Kit.modal({ title: '新しく作る', body, wide: true });
  }

  /* ───────── キーボード・見えなくなったとき ───────── */
  let spaceDown = false;
  function onKey(e) {
    if (!V || EXP || e.defaultPrevented) return;
    if (document.querySelector('.modal-back')) return;
    if (e.isComposing || e.keyCode === 229) return;
    const tg = e.target, tag = (tg && tg.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (tg && tg.isContentEditable)) return;
    const mod = e.ctrlKey || e.metaKey, k = e.key;
    if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return; }
    if (mod || e.altKey) return;
    if (k === ' ' || k === 'Spacebar') { e.preventDefault(); spaceDown = true; togglePlay(); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); stepBy(e.shiftKey ? -1 : -0.1); return; }
    if (k === 'ArrowRight') { e.preventDefault(); stepBy(e.shiftKey ? 1 : 0.1); return; }
    if (k === 's' || k === 'S') { e.preventDefault(); splitAtPlayhead(); return; }
    if ((k === 'Delete' || k === 'Backspace') && S.sel) { e.preventDefault(); deleteSelected(); return; }
    if (k === 'Home') { e.preventDefault(); seek(0); return; }
    if (k === 'End') { e.preventDefault(); seek(getLayout().total); return; }
    if (k === 'Escape' && S.sel) select(null);
  }
  function onKeyUp(e) { if ((e.key === ' ' || e.key === 'Spacebar') && spaceDown) { e.preventDefault(); spaceDown = false; } }
  function onVis() {
    if (document.hidden) {
      if (PB.playing && PB.mode === 'preview') pause();
      if (EXP && PB.playing) {
        EXP.hidden = true;
        EXP.ui.warn('画面が隠れていました。映像がなめらかでない所があるかもしれません。気になるときは、画面を開いたまま書き出し直してください。');
      }
    }
    // 書き出し中は、見えている間は描画のたびに、隠れている間はタイマーで進める
    if (EXP && PB.playing) { if (PB.raf) cancelAnimationFrame(PB.raf); if (PB.timer) clearTimeout(PB.timer); PB.raf = PB.timer = 0; schedule(); }
  }

  // ほかの画面（バックアップの読みこみ・全部消す・別のタブ）で中身が変わったら、次に開くときに読み直す
  let stale = false;
  Kit.store.on('doc:video', () => {
    Kit.store.get('video').then((d) => {
      if (!S.project) return;
      const nothing = d === undefined || !!(d && d._sample);
      if (nothing ? S.saved || (S.project._sample && !Kit.store.samplesShown()) : JSON.stringify(d) !== S.hist.last) stale = true;
    }).catch(() => {});
  });
  async function loadProject() {
    stale = false;
    const doc = await Kit.store.get('video', { sample: SAMPLE, blank: Object.assign(blankProject('v'), { _blank: true }) });
    S.saved = !doc._sample && !doc._blank;
    delete doc._blank;
    S.project = normalize(doc);
    S.hist = { undo: [], redo: [], last: JSON.stringify(serialize()) };
    S.sel = null;
    S.t = S.project._sample ? POSTER_T : 0;
    S.poster = !!S.project._sample;
    S.zoom = 0;
    S.zoomAuto = true;
    touch();
  }

  /* ───────── 見た目 ───────── */
  Kit.css('video', `
.app-video { container: vidapp / inline-size; }
.vid-root { padding: 14px var(--gutter-r) 28px var(--gutter-l); display: flex; flex-direction: column; min-width: 0; }
.vid-root .app-head { margin-bottom: 12px; }
.vid-sample:empty { display: none; }
.vid-sample .sample-bar { margin-bottom: 12px; }
.vid-file { display: none; }
.vid-grow { flex: 1 1 auto; }
.vid-work { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr); grid-template-areas: "stage" "switch" "panel"; min-width: 0; }
.vid-bin, .vid-tl, .vid-insp { grid-area: panel; min-width: 0; }
.vid-stage { grid-area: stage; min-width: 0; display: flex; flex-direction: column; gap: 8px; container: vidstage / inline-size; }
@container vidstage (max-width: 460px) {
  .vid-transport-row .vid-toggle span { display: none; }
  .vid-transport-row .btn.vid-toggle { width: 34px; min-width: 34px; padding: 0; }
}
.vid-switch { grid-area: switch; }
.vid-switch .seg { display: flex; width: 100%; }
.vid-switch .seg > button { flex: 1 1 0; min-height: 40px; font-size: 14px; }
.vid-work[data-panel="bin"] .vid-tl, .vid-work[data-panel="bin"] .vid-insp,
.vid-work[data-panel="timeline"] .vid-bin, .vid-work[data-panel="timeline"] .vid-insp,
.vid-work[data-panel="edit"] .vid-bin, .vid-work[data-panel="edit"] .vid-tl { display: none; }
.vid-panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 12px; }
.vid-panel-h { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
.vid-panel-h h2 { font-size: 15px; font-weight: 700; margin-right: auto; }
.vid-label { font-size: 13px; color: var(--ink-2); font-weight: 500; }

/* プレビュー */
.vid-stage-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.vid-screen { position: relative; width: 100%; aspect-ratio: var(--ar, 9 / 16); max-height: min(46vh, 520px); min-height: 180px; display: grid; place-items: center; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r); overflow: hidden; }
.vid-cv { display: block; border-radius: 4px; box-shadow: var(--shadow-1); cursor: pointer; max-width: 100%; max-height: 100%; }
.vid-screen-empty { position: absolute; inset: 12px; display: grid; place-content: center; justify-items: center; gap: 6px; text-align: center; background: var(--surface); border: 1px dashed var(--line-strong); border-radius: var(--r); padding: 16px; color: var(--ink-2); }
.vid-screen-empty strong { color: var(--ink); }
.vid-screen-empty .btn-row { justify-content: center; margin-top: 6px; }
.vid-transport { display: grid; gap: 4px; }
.vid-transport-row { display: flex; flex-wrap: wrap; gap: 4px 6px; align-items: center; min-width: 0; }
.vid-root .vid-transport .btn.vid-play { width: 44px; min-width: 44px; height: 44px; border-radius: 50%; }
.vid-time { font-size: 13px; color: var(--ink-2); white-space: nowrap; }
.vid-seek { min-width: 0; width: 100%; margin: 0; }
.vid-toggle[aria-pressed="true"] { --btn-bg: var(--gosu-wash); color: var(--gosu); }
.vid-toggle[aria-pressed="true"]:hover { --btn-bg: var(--gosu-wash); color: var(--gosu); }

/* 素材 */
.vid-auto { margin: 8px 0 2px; font-size: 13.5px; }
.vid-busy { margin-top: 8px; padding: 6px 10px; border-radius: 8px; background: var(--gosu-wash); color: var(--ink); }
.vid-bin-empty { margin: 10px 0; padding: 14px; text-align: center; border: 1px dashed var(--line-strong); border-radius: 8px; color: var(--ink-3); }
.vid-media-list { display: grid; gap: 6px; margin: 10px 0; }
.vid-media { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; grid-template-areas: "th name name" "th sub act"; gap: 0 8px; align-items: center; padding: 6px 6px 6px 8px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.vid-media > .vid-media-th { grid-area: th; }
.vid-media-sub { grid-area: sub; min-width: 0; line-height: 1.4; }
.vid-media[draggable="true"] { cursor: grab; }
.vid-media.is-missing { border-style: dashed; border-color: color-mix(in srgb, var(--warn) 50%, var(--line)); }
.vid-media-th { width: 56px; height: 40px; border-radius: 5px; background-color: var(--surface-3); background-size: cover; background-position: center; display: grid; place-items: center; color: var(--ink-3); flex: none; }
.vid-media-th.is-missing { background-color: var(--warn-wash); color: var(--warn); }
.vid-media-name { grid-area: name; font-size: 13px; font-weight: 700; line-height: 1.5; }
.vid-media-act { grid-area: act; display: flex; gap: 2px; }
.vid-warn-text { color: var(--warn); font-weight: 700; }
.vid-bin-note { margin-top: 8px; line-height: 1.6; }

/* タイムライン */
.vid-tl { padding: 8px 10px 10px; }
.vid-tl-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 8px; }
.vid-tl-group { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
.vid-tl-group + .vid-tl-group { padding-left: 6px; border-left: 1px solid var(--line); }
.vid-selinfo { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 6px 10px; border-radius: 8px; background: var(--gosu-wash); color: var(--ink-2); }
.vid-selinfo > span { flex: 1 1 auto; }
.vid-selinfo strong { color: var(--ink); }
.vid-tl-box { display: flex; border: 1px solid var(--line); border-radius: var(--r-sm); overflow: hidden; background: var(--surface-2); }
.vid-tl-heads { flex: none; width: 34px; background: var(--surface); border-right: 1px solid var(--line); }
.vid-tl-head { display: grid; place-items: center; border-bottom: 1px solid var(--line); color: var(--ink-3); box-sizing: border-box; }
.vid-tl-head:last-child { border-bottom: 0; }
.vid-tl-scroll { flex: 1 1 auto; min-width: 0; overflow-x: auto; overflow-y: hidden; position: relative; overscroll-behavior-x: contain; }
.vid-tl-inner { position: relative; }
.vid-ruler { position: relative; box-sizing: border-box; border-bottom: 1px solid var(--line); background-color: var(--surface); background-image: repeating-linear-gradient(to right, var(--line-strong) 0 1px, transparent 1px 100%); background-repeat: repeat-x; cursor: ew-resize; touch-action: none; user-select: none; -webkit-user-select: none; }
.vid-tick { position: absolute; top: 0; bottom: 0; border-left: 1px solid var(--line-strong); padding: 3px 0 0 4px; font-size: 10.5px; line-height: 1; color: var(--ink-3); white-space: nowrap; pointer-events: none; font-variant-numeric: tabular-nums; }
.vid-track { position: relative; box-sizing: border-box; border-bottom: 1px solid var(--line); }
.vid-track-audio { border-bottom: 0; }
.vid-blk { position: absolute; top: 4px; bottom: 4px; box-sizing: border-box; border-radius: 6px; border: 1px solid var(--line-strong); background-color: var(--surface-3); background-size: auto 100%; background-repeat: repeat-x; overflow: hidden; cursor: grab; user-select: none; -webkit-user-select: none; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; padding: 3px 5px; color: var(--ink); font-size: 11.5px; line-height: 1.3; }
.vid-blk:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }
.vid-blk-label, .vid-blk-dur { position: relative; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px; border-radius: 4px; background: color-mix(in srgb, var(--surface) 84%, transparent); display: inline-flex; align-items: center; gap: 3px; }
.vid-blk-label { font-weight: 700; }
.vid-blk-dur { font-size: 10.5px; color: var(--ink-2); }
.vid-blk-text, .vid-blk-audio { justify-content: center; }
.vid-blk-text { background: var(--gosu-wash); border-color: color-mix(in srgb, var(--gosu) 45%, var(--line)); }
.vid-blk-text .vid-blk-label { background: transparent; }
.vid-blk-audio { background: color-mix(in srgb, var(--series-3) 14%, var(--surface)); border-color: color-mix(in srgb, var(--series-3) 50%, var(--line)); }
.vid-blk-audio .vid-blk-label { background: color-mix(in srgb, var(--surface) 70%, transparent); }
.vid-wave { position: absolute; inset: 2px 0; width: 100%; height: calc(100% - 4px); color: color-mix(in srgb, var(--series-3) 55%, transparent); pointer-events: none; }
.vid-blk-slot { background-color: var(--surface); border-style: dashed; color: var(--ink-2); }
.vid-blk.is-missing { border: 1px dashed var(--warn); background-color: var(--warn-wash); background-image: none !important; }
.vid-blk.is-missing .vid-blk-label { color: var(--warn); background: transparent; }
.vid-blk.is-sel { border-color: var(--gosu); box-shadow: 0 0 0 2px var(--gosu); z-index: 2; }
.vid-blk.is-drag { opacity: .8; z-index: 7; box-shadow: var(--shadow-2); cursor: grabbing; }
.vid-h { position: absolute; top: 0; bottom: 0; width: 10px; cursor: ew-resize; touch-action: none; display: none; background: var(--gosu); z-index: 3; }
.vid-h::after { content: ""; position: absolute; top: 50%; left: 50%; width: 2px; height: 12px; margin: -6px 0 0 -1px; border-radius: 1px; background: var(--on-gosu); opacity: .9; }
.vid-h-l { left: 0; }
.vid-h-r { right: 0; }
.vid-blk.is-sel .vid-h { display: block; }
@media (hover: hover) { .vid-blk:hover .vid-h { display: block; opacity: .6; } .vid-blk.is-sel .vid-h, .vid-blk.is-sel:hover .vid-h { opacity: 1; } }
@media (pointer: coarse) { .vid-h { width: 20px; } }
.vid-xf { position: absolute; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; background: var(--surface); border: 1px solid var(--line-strong); display: grid; place-items: center; color: var(--gosu); z-index: 4; pointer-events: none; }
.vid-ins { position: absolute; top: 2px; bottom: 2px; width: 3px; margin-left: -1.5px; background: var(--gosu); border-radius: 2px; z-index: 8; pointer-events: none; }
.vid-ph { position: absolute; top: 0; bottom: 0; left: 0; width: 2px; margin-left: -1px; background: var(--shu); pointer-events: none; z-index: 6; will-change: transform; }
.vid-ph::before { content: ""; position: absolute; top: 0; left: -5px; width: 12px; height: 10px; background: var(--shu); border-radius: 0 0 6px 6px; }
.vid-track-add { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); display: inline-flex; align-items: center; gap: 4px; min-height: 26px; padding: 2px 10px; border: 1px dashed var(--line-strong); border-radius: 999px; background: var(--surface); color: var(--ink-2); font: inherit; font-size: 12.5px; cursor: pointer; white-space: nowrap; }
.vid-track-add:hover { color: var(--ink); border-color: var(--gosu); }
.vid-track-empty { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-3); font-size: 12.5px; white-space: nowrap; }
.vid-tl-hint { margin-top: 6px; }

/* 編集 */
.vid-insp .stack { gap: 12px; }
.vid-2col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-items: end; }
.vid-3col { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.vid-range-label { display: flex; justify-content: space-between; gap: 8px; }
.vid-range-val { color: var(--ink-3); font-size: 12px; white-space: nowrap; }
.vid-hint { font-size: 12px; color: var(--ink-3); margin-top: -6px; line-height: 1.5; }
.vid-color input[type="color"] { width: 100%; }
.vid-swatches { display: flex; flex-wrap: wrap; gap: 6px; }
.vid-swatch { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--line-strong); cursor: pointer; padding: 0; }
.vid-swatch:hover { outline: 2px solid var(--gosu); outline-offset: 1px; }
.vid-note { padding: 10px 12px; border-radius: 8px; background: var(--surface-2); font-size: 13.5px; display: grid; gap: 6px; }
.vid-note.is-warn { background: var(--warn-wash); border: 1px solid color-mix(in srgb, var(--warn) 40%, var(--line)); }
.vid-note.is-warn strong { color: var(--warn); }
.vid-pick { display: grid; gap: 4px; }
.vid-pick-item { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 8px; align-items: center; padding: 4px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); font: inherit; font-size: 13px; color: inherit; cursor: pointer; text-align: left; }
.vid-pick-item:hover { border-color: var(--gosu); }
.vid-facts { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 12px; margin: 0; font-size: 13.5px; }
.vid-facts dt { color: var(--ink-3); }
.vid-facts dd { margin: 0; }
.vid-keys { list-style: none; padding-left: 0 !important; display: grid; gap: 4px; font-size: 13px; }
.vid-actions { padding-top: 4px; border-top: 1px solid var(--line); }

/* ファイルを落とすとき */
.vid-drop { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; background: color-mix(in srgb, var(--gosu) 16%, transparent); pointer-events: none; }
.vid-drop > div { background: var(--surface); border: 2px dashed var(--gosu); border-radius: var(--r-lg); padding: 26px 34px; display: grid; justify-items: center; gap: 6px; color: var(--ink); box-shadow: var(--shadow-2); }
.vid-drop svg { color: var(--gosu); }

/* 書き出し・新しく作る（ダイアログ） */
.vid-exp { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 16px; align-items: center; }
.vid-exp-view { display: grid; place-items: center; min-width: 90px; }
.vid-exp-cv { display: block; width: auto; height: auto; max-width: min(220px, 40vw); max-height: 220px; border-radius: 6px; background: var(--surface-3); }
.vid-exp-warn { color: var(--warn); font-weight: 700; }
@media (max-width: 480px) { .vid-exp { grid-template-columns: minmax(0, 1fr); } }
.vid-new-h { font-size: 14px; font-weight: 700; color: var(--ink-2); }
.vid-new-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap: 10px; }
.vid-new-card { display: grid; gap: 4px; align-content: start; justify-items: start; text-align: left; padding: 10px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); cursor: pointer; font: inherit; color: inherit; min-width: 0; }
.vid-new-card:hover { border-color: var(--gosu); background: var(--surface-2); }
.vid-new-cover { width: 100%; height: 96px; display: grid; place-items: center; background: var(--surface-2); border-radius: 6px; margin-bottom: 4px; }
.vid-new-cv { display: block; max-height: 84px; max-width: 100%; border-radius: 3px; }
.vid-new-shape { display: block; height: 64px; max-width: 110px; border: 2px solid var(--ink-3); border-radius: 4px; background: var(--surface); }
.vid-new-title { font-weight: 700; font-size: 14px; }

/* スマホ・タブレット：ボタンを大きく */
@container vidapp (max-width: 979px) {
  .vid-root .btn { min-height: 40px; }
  .vid-root .btn.sm { min-height: 40px; padding: 6px 12px; font-size: 13.5px; }
  .vid-root .btn.icon, .vid-root .btn.icon.sm { width: 40px; min-width: 40px; }
  .vid-root .seg > button { min-height: 36px; }
  .vid-root .vid-track-add { min-height: 30px; }
  .vid-swatch { width: 40px; height: 40px; }
}
@container vidapp (max-width: 520px) {
  .vid-root .app-head .app-desc { display: none; }
  .vid-tl-edit .btn span { display: none; }
  .vid-tl-edit .btn { padding: 0; width: 40px; min-width: 40px; }
  .vid-tl-group + .vid-tl-group { padding-left: 4px; }
  .vid-pic span, .vid-toggle span { display: none; }
  .vid-root .btn.vid-toggle { width: 40px; min-width: 40px; padding: 0; }
  .vid-root .btn.vid-pic { width: 40px; min-width: 40px; padding: 0; }
}
/* 広い画面：素材｜プレビュー｜編集、下にタイムライン */
@container vidapp (min-width: 980px) {
  .vid-root { height: calc(100dvh - var(--vid-top, 0px)); min-height: 660px; padding: 16px 20px; }
  .vid-work { flex: 1 1 auto; min-height: 0; grid-template-columns: minmax(200px, 240px) minmax(0, 1fr) minmax(270px, 330px); grid-template-rows: minmax(0, 1fr) auto; grid-template-areas: "bin stage insp" "tl tl tl"; }
  .vid-bin { grid-area: bin; }
  .vid-insp { grid-area: insp; }
  .vid-tl { grid-area: tl; }
  .vid-switch, .vid-selinfo { display: none !important; }
  .vid-work[data-panel] .vid-bin, .vid-work[data-panel] .vid-tl, .vid-work[data-panel] .vid-insp { display: block; }
  .vid-bin, .vid-insp { overflow-y: auto; min-height: 0; }
  .vid-stage { min-height: 0; }
  .vid-screen { flex: 1 1 auto; aspect-ratio: auto; max-height: none; min-height: 200px; }
}
@media (max-width: 999px) { .vid-root { --vid-top: var(--top-h); } }
`);

  /* ───────── アプリ ───────── */
  Kit.app({
    id: 'video', title: '動画エディター', group: 'make', icon: 'film', order: 12,
    desc: '切る・つなぐ・テロップ・BGM。縦動画にも',
    wide: true,
    docs: ['video'],
    debug: () => ({ S, PB, getLayout, drawFrame, fixWebmDuration }),
    async mount(root, params) {
      if (!S.project || stale || (S.project._sample && !Kit.store.samplesShown())) await loadProject();
      // 案内などから開くとき：Kit.go('video', { tab: 'bin' | 'timeline' | 'edit' })。狭い画面で見せる作業（素材・タイムライン・編集）を選んでおく
      if (params && ['bin', 'timeline', 'edit'].includes(params.tab)) setPanel(params.tab);
      const v = buildView(root);
      V = v;
      // ファイルを画面に落とす
      let depth = 0;
      const hasFiles = (e) => Array.from((e.dataTransfer && e.dataTransfer.types) || []).includes('Files');
      v.wrap.addEventListener('dragenter', (e) => { if (!hasFiles(e) || EXP) return; e.preventDefault(); depth++; v.drop.hidden = false; });
      v.wrap.addEventListener('dragover', (e) => { if (!hasFiles(e) || EXP) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
      v.wrap.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) v.drop.hidden = true; });
      v.wrap.addEventListener('drop', (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth = 0;
        v.drop.hidden = true;
        const files = Array.from(e.dataTransfer.files || []);
        const slot = e.target.closest && e.target.closest('.vid-blk-slot');
        if (files.length) addFiles(files, slot ? { slot: slot.dataset.id, place: true } : null);
      });
      document.addEventListener('keydown', onKey);
      document.addEventListener('keyup', onKeyUp);
      document.addEventListener('visibilitychange', onVis);
      let roRaf = 0, lastTlW = 0;
      const ro = window.ResizeObserver ? new ResizeObserver(() => {
        if (roRaf) return;
        roRaf = requestAnimationFrame(() => {
          roRaf = 0;
          if (!V) return;
          fitPreview();
          const w = V.tlScroll.clientWidth;
          if (w && Math.abs(w - lastTlW) > 4) { lastTlW = w; if (S.zoomAuto) S.zoom = 0; renderTimeline(); }
        });
      }) : null;
      if (ro) { ro.observe(v.screen); ro.observe(v.tlScroll); }
      renderAll();
      seek(S.t);
      S.poster = !!S.project._sample && S.t === POSTER_T;
      fontsReady(3000).then(() => { genThumbs.clear(); requestDraw(); if (V) renderTimeline(); });
      return () => {
        if (EXP) cancelExport();
        if (PB.playing) stopEngine();
        pauseAllMedia();
        if (drawRaf) cancelAnimationFrame(drawRaf);
        if (tlRaf) cancelAnimationFrame(tlRaf);
        if (roRaf) cancelAnimationFrame(roRaf);
        drawRaf = tlRaf = 0;
        flushCommit();
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('visibilitychange', onVis);
        if (ro) ro.disconnect();
        if (AU.ctx && AU.ctx.state === 'running') AU.ctx.suspend().catch(() => {});
        V = null;
      };
    },
  });
})();
