/* バスケ得点クリップ — 動画のコメント・スタンプ（その場面から数秒、動画の中に出す。書き出す動画にも入れる）
   DOM に依存しない部分（データの形・タグ・さがす・リンク）と、Canvas に描く部分（画面の上にも、書き出す動画にも同じ絵を描く）。

   コメント：{ id: 'n1', t: 動画の秒, dur: 出す長さ（秒。ふつう 5）, text: '文', stamps: ['👍', …], tags: ['ヘルプ', …], at: 書いた時刻 }
   コメント帳（このブラウザの中に、動画ごとにためておく）：{ [動画の見分け]: { name: 動画のファイル名, at, notes: [コメント…] } } */
(function (root) {
  'use strict';
  const BS = root.BS = root.BS || {};

  /* スタンプ（押すと、そのコメントに付く。いくつでも） */
  const STAMPS = [
    { s: '👍', l: 'いいね' }, { s: '👏', l: 'ナイス' }, { s: '🔥', l: 'すごい' }, { s: '💯', l: '満点' },
    { s: '💪', l: 'がんばった' }, { s: '⭐', l: 'お手本' }, { s: '❗', l: 'ここ大事' }, { s: '❓', l: 'しつもん' },
    { s: '😮', l: 'おどろき' }, { s: '🙆', l: 'OK' }, { s: '🙅', l: 'NG' }, { s: '🏀', l: 'バスケ' }
  ];
  /* よく使うタグ（ほかのことばも、文の中に「#ことば」と書けばタグになる） */
  const TAGS = ['ヘルプ', 'リバウンド', 'ボックスアウト', 'スクリーン', 'ドライブ', 'パス', 'シュート', 'ディフェンス', '速攻', '声かけ', 'ポジション', 'ナイスプレー'];
  const DUR = 5;                 // 動画の中に出す長さ（秒。ふつう）
  const DURS = [3, 5, 8];
  const MAX_TEXT = 60;

  /* 文の中の「#ことば」「＃ことば」をタグにする（記号・空白まで） */
  function parseTags(text) {
    const out = [];
    String(text || '').replace(/[#＃]([^\s#＃、。，．,.!！?？「」『』()（）\[\]]{1,20})/g, (m, w) => { if (!out.includes(w)) out.push(w); return m; });
    return out;
  }
  const cleanTag = (w) => String(w || '').replace(/^[#＃]+/, '').trim().slice(0, 20);
  /* 形をそろえる（形の合わないものは null） */
  function clean(n) {
    if (!n || typeof n !== 'object' || !isFinite(n.t) || n.t < 0) return null;
    const text = String(n.text || '').trim().slice(0, MAX_TEXT);
    const stamps = (Array.isArray(n.stamps) ? n.stamps : []).filter((s) => STAMPS.some((x) => x.s === s)).slice(0, 6);
    const tags = [];
    (Array.isArray(n.tags) ? n.tags : []).concat(parseTags(text)).map(cleanTag).forEach((w) => { if (w && !tags.includes(w)) tags.push(w); });
    if (!text.trim() && !stamps.length) return null;
    const dur = isFinite(n.dur) && n.dur > 0 ? Math.min(30, +n.dur) : DUR;
    return { id: String(n.id || '').slice(0, 20) || 'n' + Math.round(n.t * 100), t: Math.round(n.t * 100) / 100, dur, text, stamps, tags: tags.slice(0, 8), at: isFinite(n.at) ? +n.at : 0 };
  }
  const cleanAll = (list) => (Array.isArray(list) ? list : []).map(clean).filter(Boolean).sort((a, b) => a.t - b.t);
  /* いま（動画の t 秒）出ているコメント（古い順） */
  const activeAt = (notes, t) => (notes || []).filter((n) => n.t <= t + 1e-6 && t < n.t + n.dur);
  const nextId = (notes) => 'n' + ((notes || []).reduce((m, n) => Math.max(m, Number(String(n.id).slice(1)) || 0), 0) + 1);
  const stampLabel = (s) => (STAMPS.find((x) => x.s === s) || {}).l || '';

  /* さがすための形（全角・半角、カタカナ・ひらがな、大文字・小文字をそろえる） */
  function norm(s) {
    return String(s || '').normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/\s+/g, ' ').trim();
  }
  /* コメント帳からさがす：q（ことば。文・タグ・スタンプの呼び名にふくまれる）・tag（そのタグが付いたもの）。新しい動画 → 時刻の順 */
  function search(book, q, tag) {
    const nq = norm(q), out = [];
    Object.keys(book || {}).forEach((key) => {
      const v = book[key] || {};
      cleanAll(v.notes).forEach((n) => {
        if (tag && !n.tags.includes(tag)) return;
        if (nq) {
          const hay = norm([n.text, n.tags.join(' '), n.stamps.map(stampLabel).join(' ')].join(' '));
          if (!nq.split(' ').every((w) => hay.includes(w))) return;
        }
        out.push(Object.assign({ key, name: v.name || '', vat: v.at || 0 }, n));
      });
    });
    return out.sort((a, b) => (b.vat - a.vat) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0) || (a.t - b.t));
  }
  /* コメント帳のタグと数（多い順） */
  function tagCounts(book) {
    const m = {};
    Object.keys(book || {}).forEach((k) => cleanAll((book[k] || {}).notes).forEach((n) => n.tags.forEach((w) => { m[w] = (m[w] || 0) + 1; })));
    return Object.keys(m).map((w) => ({ tag: w, n: m[w] })).sort((a, b) => b.n - a.n || (a.tag < b.tag ? -1 : 1));
  }
  /* 調べるリンク：YouTube の検索・バスケ・グロウ（バスケ育成アプリ）のずかん */
  const GROW = 'https://dora9991.github.io/math-dialogue/basket-coach/';
  const youtubeUrl = (w) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent('バスケ ' + String(w || '').trim());
  const growUrl = (w) => GROW + '#q/' + encodeURIComponent(String(w || '').trim());
  /* 文字で書き出す（LINE などに貼る）：「1:23 👍 ヘルプが遅い #ヘルプ」 */
  function toText(notes, fmt, title) {
    const lines = cleanAll(notes).map((n) => `${fmt(n.t)} ${n.stamps.join('')}${n.stamps.length && n.text ? ' ' : ''}${n.text}${n.tags.length ? '  ' + n.tags.map((w) => '#' + w).join(' ') : ''}`);
    return (title ? title + '\n' : '') + lines.join('\n');
  }
  /* コメントの場面（書き出し・続けて見る）：コメントの 3 秒前から、出し終わって 1 秒後まで。重なるものは1つに */
  function segments(notes, duration) {
    const end = duration > 0 ? duration : Infinity, out = [];
    cleanAll(notes).forEach((n) => {
      const s = { t0: Math.max(0, n.t - 3), t1: Math.min(end, n.t + n.dur + 1), ids: [n.id], at: n.t };
      const prev = out[out.length - 1];
      if (prev && s.t0 <= prev.t1) { prev.t1 = Math.max(prev.t1, s.t1); prev.ids.push(n.id); } else out.push(s);
    });
    return out;
  }

  /* ---------- 描く（Canvas）----------
     画面の下のまん中に、スタンプ（大きく。出たときにポンと大きくなる）と、コメントの吹き出し（タグは小さく下に）。
     W×H：描く絵の大きさ（書き出す動画・画面の映像の大きさ）。x0・y0：映像の左上（画面では、映像のまわりの黒い帯をのぞく）。t：動画の秒 */
  const FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif';
  const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", ' + FONT;
  function wrap(ctx, text, maxW) {
    const lines = [];
    let cur = '';
    Array.from(text).forEach((ch) => {
      if (ch === '\n') { lines.push(cur); cur = ''; return; }
      if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch;
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function draw(ctx, W, H, notes, t, x0, y0) {
    const act = activeAt(notes, t).slice(-3);
    if (!act.length) return 0;
    x0 = x0 || 0; y0 = y0 || 0;
    const s = Math.min(W / 1280, H / 720) * 1.0;
    let bottom = y0 + H - 34 * s;
    // 新しいものほど下に（下から順に積む）
    for (let i = act.length - 1; i >= 0; i--) {
      const n = act[i];
      const k = t - n.t, left = n.t + n.dur - t;
      const alpha = Math.max(0, Math.min(1, k / 0.25, left / 0.3));
      const pop = k < 0.3 ? 0.6 + 0.4 * Math.sin((k / 0.3) * Math.PI / 2) * 1.08 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      let boxH = 0, lines = [];
      const fs = 30 * s, ts = 19 * s, pad = 16 * s, maxW = W * 0.78;
      if (n.text) {
        ctx.font = `bold ${fs}px ${FONT}`;
        lines = wrap(ctx, n.text, maxW - 2 * pad);
      }
      const tagText = n.tags.length ? n.tags.map((w) => '#' + w).join('  ') : '';
      if (lines.length || tagText) {
        ctx.font = `bold ${fs}px ${FONT}`;
        let bw = Math.max(0, ...lines.map((ln) => ctx.measureText(ln).width));
        ctx.font = `${ts}px ${FONT}`;
        if (tagText) bw = Math.max(bw, ctx.measureText(tagText).width);
        bw = Math.min(maxW, bw + 2 * pad + 10 * s);
        boxH = lines.length * fs * 1.25 + (tagText ? ts * 1.5 : 0) + pad * 1.4;
        const bx = x0 + (W - bw) / 2, by = bottom - boxH;
        ctx.fillStyle = 'rgba(8,12,20,0.80)';
        roundRect(ctx, bx, by, bw, boxH, 12 * s); ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.fillRect(bx, by + 8 * s, 6 * s, boxH - 16 * s);
        let y = by + pad * 0.7 + fs * 0.62;
        ctx.font = `bold ${fs}px ${FONT}`; ctx.fillStyle = '#ffffff';
        lines.forEach((ln) => { ctx.fillText(ln, x0 + W / 2 + 3 * s, y); y += fs * 1.25; });
        if (tagText) { ctx.font = `${ts}px ${FONT}`; ctx.fillStyle = '#93c5fd'; ctx.fillText(tagText, x0 + W / 2 + 3 * s, y - fs * 0.25 + ts * 0.5); }
      }
      if (n.stamps.length) {
        const es = 58 * s * pop;
        ctx.font = `${es}px ${EMOJI}`;
        const sy = bottom - boxH - (boxH ? 10 * s : 0) - 58 * s / 2;
        ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 8 * s;
        ctx.fillText(n.stamps.join(' '), x0 + W / 2, sy);
        boxH += 58 * s + (boxH ? 10 * s : 0);
      }
      ctx.restore();
      bottom -= boxH + 12 * s;
    }
    return act.length;
  }

  BS.notes = { STAMPS, TAGS, DUR, DURS, MAX_TEXT, parseTags, cleanTag, clean, cleanAll, activeAt, nextId, stampLabel, norm, search, tagCounts, youtubeUrl, growUrl, GROW, toText, segments, draw };
})(typeof window !== 'undefined' ? window : globalThis);
