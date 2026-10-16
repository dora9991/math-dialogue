/* バスケ得点クリップ — 動画の書き出し
   区間（クリップ）を順に再生しながら Canvas に描き、MediaRecorder で録画して1本の動画にする。
   実時間で録るので、書き出しにかかる時間 ≒ できる動画の長さ（5秒 × 本数 ＋ 最初と最後の数秒）。
   「バスケ分析スタジオ」の export.js をもとに、表示を小さくしたもの（音声の扱い・再生が始まらないときの失敗の出し方は同じ）。 */
(function (root) {
  'use strict';
  const BS = root.BS;

  function pickMime() {
    if (typeof MediaRecorder === 'undefined') return null;
    const list = [
      ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'mp4'],
      ['video/mp4;codecs=avc1', 'mp4'],
      ['video/mp4', 'mp4'],
      ['video/webm;codecs=vp9,opus', 'webm'],
      ['video/webm;codecs=vp8,opus', 'webm'],
      ['video/webm', 'webm']
    ];
    for (const [m, ext] of list) { try { if (MediaRecorder.isTypeSupported(m)) return { mime: m, ext }; } catch (e) { /* 次 */ } }
    return null;
  }

  function sizeFor(media) {
    let w = media.width || 1280, h = media.height || 720;
    if (w > 1280) { h = Math.round(h * 1280 / w); w = 1280; }
    return { w: w - (w % 2), h: h - (h % 2) };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif';

  /* 左上の小さな札：「入れた 3 / 12」と時刻（チームの色の帯つき） */
  function drawCaption(ctx, W, H, clip, opts) {
    const s = W / 1280;
    const title = clip.label || '', sub = clip.sub || '';
    ctx.save();
    ctx.font = `bold ${26 * s}px ${FONT}`;
    const w1 = ctx.measureText(title).width;
    ctx.font = `${19 * s}px ${FONT}`;
    const w2 = ctx.measureText(sub).width;
    const bw = Math.max(w1, w2) + 52 * s, bh = sub ? 74 * s : 48 * s, bx = 24 * s, by = 22 * s;
    ctx.fillStyle = 'rgba(8,12,20,0.74)';
    roundRect(ctx, bx, by, bw, bh, 10 * s); ctx.fill();
    ctx.fillStyle = clip.color || opts.accent || '#3b82f6';
    ctx.fillRect(bx, by, 9 * s, bh);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${26 * s}px ${FONT}`;
    ctx.fillText(title, bx + 26 * s, by + (sub ? 25 : 24) * s);
    if (sub) { ctx.font = `${19 * s}px ${FONT}`; ctx.fillStyle = '#c9d4e6'; ctx.fillText(sub, bx + 26 * s, by + 53 * s); }
    ctx.restore();
  }

  function drawCard(ctx, W, H, lines, opts) {
    const s = W / 1280;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0e1422'); g.addColorStop(1, '#1b2944');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = opts.accent || '#3b82f6';
    ctx.fillRect(W / 2 - 60 * s, H / 2 - 112 * s, 120 * s, 7 * s);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((ln, i) => {
      ctx.fillStyle = i === 0 ? '#ffffff' : '#c9d4e6';
      ctx.font = `${i === 0 ? 'bold ' : ''}${(i === 0 ? 54 : 30) * s}px ${FONT}`;
      ctx.fillText(ln, W / 2, H / 2 - 50 * s + i * 60 * s);
    });
    ctx.font = `${18 * s}px ${FONT}`; ctx.fillStyle = '#7f8ba3';
    ctx.fillText(BS.APP, W / 2, H - 40 * s);
  }
  function drawFade(ctx, W, H, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = BS.clamp(a, 0, 1); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  /* media: BS.createVideoMedia、clips: [{ t0, t1, label, sub, color }]
     opts: { title: [行…], end: [行…], accent, captions（false で札なし）, cards（false で最初と最後の画面なし）, audio（false で音なし） }
     onProgress(0〜1, 文字) / 戻り値 { blob, url, mime, ext, seconds, audio }（中止したら null） */
  async function exportReel(media, clips, opts, onProgress, signal) {
    opts = opts || {};
    const fmt = pickMime();
    if (!fmt) throw new Error('このブラウザは動画の書き出しに対応していません。Chrome・Edge・Safari の新しい版をお使いください。');
    if (!clips.length) throw new Error('書き出す場面がありません');
    const { w: W, h: H } = sizeFor(media);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(30);
    const cards = opts.cards !== false;
    // （音声の準備は、ボタンを押した直後＝最初の await より前に始める。Safari などは、操作の直後でないと音を扱わせない）
    let audioDest = null;
    if (opts.audio !== false) {
      try {
        const AC = root.AudioContext || root.webkitAudioContext;
        const wake = (actx) => (actx.state === 'running' ? Promise.resolve() : Promise.race([actx.resume(), new Promise((r) => setTimeout(r, 700))]));
        if (!media._actx) {
          // 音声は Web Audio を通して録る。ブラウザが音を出すことを許していない（ボタンを押した直後でない等）ときは、音声なしで書き出す。
          // 許されていないまま動画の音声をつなぎ替えると、そのあと普通に再生しても音が出なくなるので、つなぐ前に確かめる
          const actx = new AC();
          await wake(actx);
          if (actx.state !== 'running') { try { actx.close(); } catch (e) { /* 無視 */ } throw new Error('audio is not allowed'); }
          media._actx = actx;
          media._src = actx.createMediaElementSource(media.el);
          media._src.connect(actx.destination);
        } else await wake(media._actx);
        audioDest = media._actx.createMediaStreamDestination();
        media._src.connect(audioDest);
        audioDest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
      } catch (e) { audioDest = null; }
    }
    const rec = new MediaRecorder(stream, { mimeType: fmt.mime, videoBitsPerSecond: 5000000 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((res) => { rec.onstop = res; });
    const TITLE = cards ? 2.5 : 0, END = cards ? 2.2 : 0;
    const total = clips.reduce((s, c) => s + (c.t1 - c.t0), 0) + TITLE + END;
    let done = 0;
    const frame = () => new Promise((res) => requestAnimationFrame(res));
    const aborted = () => signal && signal.aborted;
    const report = (label) => onProgress && onProgress(Math.min(1, done / Math.max(0.1, total)), label);

    media.pause();
    rec.start(250);
    try {
      let t0 = performance.now();
      if (cards) {
        while (performance.now() - t0 < TITLE * 1000 && !aborted()) {
          drawCard(ctx, W, H, opts.title || ['得点シーン'], opts);
          await frame();
          done = (performance.now() - t0) / 1000; report('はじめの画面');
        }
      }
      let acc = 0;
      for (let i = 0; i < clips.length && !aborted(); i++) {
        const c = clips[i];
        const len = c.t1 - c.t0;
        // 暗転中にシーク
        drawFade(ctx, W, H, 1);
        await media.seek(c.t0);
        await media.play();
        t0 = performance.now();
        while (!aborted()) {
          const el = (performance.now() - t0) / 1000;
          const vt = media.time;
          if (vt >= c.t1 || el > len + 3 || media.el.ended) break;
          // 再生が始まらない（ブラウザに止められた等）まま録ると、止まった絵の動画になってしまう → はっきり失敗にする
          if (el > 2.5 && vt - c.t0 < 0.05) throw new Error('動画の再生が始まりませんでした。映像の ▶ で再生できることを確かめてから、もう一度書き出してください');
          ctx.drawImage(media.el, 0, 0, W, H);
          const k = vt - c.t0, left = c.t1 - vt;
          if (k < 0.25) drawFade(ctx, W, H, 1 - k / 0.25);
          if (left < 0.25) drawFade(ctx, W, H, 1 - left / 0.25);
          if (opts.captions !== false) drawCaption(ctx, W, H, c, opts);
          done = TITLE + acc + Math.min(Math.max(0, k), len);
          report(`${i + 1} / ${clips.length}`);
          await frame();
        }
        media.pause();
        acc += len;
      }
      if (cards) {
        t0 = performance.now();
        while (performance.now() - t0 < END * 1000 && !aborted()) {
          drawCard(ctx, W, H, opts.end || ['おわり'], opts);
          await frame();
          done = TITLE + acc + (performance.now() - t0) / 1000; report('おわりの画面');
        }
      }
    } finally {
      rec.stop();
      await stopped;
      stream.getTracks().forEach((tr) => tr.stop());
      if (audioDest && media._src) { try { media._src.disconnect(audioDest); } catch (e) { /* 無視 */ } }
    }
    if (aborted()) return null;
    const blob = new Blob(chunks, { type: fmt.mime.split(';')[0] });
    return { blob, url: URL.createObjectURL(blob), mime: fmt.mime, ext: fmt.ext, seconds: total, audio: !!audioDest };
  }

  BS.exportReel = exportReel;
  BS.exportSupport = pickMime;
})(typeof window !== 'undefined' ? window : globalThis);
