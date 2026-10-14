/* バスケ得点クリップ — 動画ファイル（<video>）の操作
   「バスケ分析スタジオ」の media.js から、実動画の部分だけを持ってきたもの（Safari で見つかった癖への対策もそのまま）。 */
(function (root) {
  'use strict';
  const BS = root.BS;

  function createVideoMedia(file) {
    const video = document.createElement('video');
    video.className = 'media-el';
    video.playsInline = true;
    video.preload = 'auto';
    // file は File（通常）か、URL 文字列（開発時の確認用）
    const isUrl = typeof file === 'string';
    const url = isUrl ? file : URL.createObjectURL(file);
    video.src = url;
    const bus = BS.emitter();
    let raf = 0;
    function loop() {
      bus.emit('time', video.currentTime);
      if (!video.paused && !video.ended) raf = requestAnimationFrame(loop);
    }
    // （play / pause の通知は、届いた時点の実際の状態と合うものだけを伝える）
    let kick = false;          // 止めた後、まだ1回もシークしていない（次のシークは2回に分ける）
    let wantPlay = false;      // 再生を頼んだ（まだ止めていない）
    video.addEventListener('play', () => { if (video.paused) return; bus.emit('play'); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); });
    video.addEventListener('pause', () => { kick = true; if (!video.paused) return; cancelAnimationFrame(raf); bus.emit('pause'); bus.emit('time', video.currentTime); });
    video.addEventListener('seeked', () => { bus.emit('time', video.currentTime); bus.emit('seeked', video.currentTime); });
    video.addEventListener('timeupdate', () => { if (video.paused) bus.emit('time', video.currentTime); });
    video.addEventListener('loadedmetadata', () => bus.emit('ready', { duration: video.duration, width: video.videoWidth, height: video.videoHeight }));
    video.addEventListener('loadeddata', () => bus.emit('time', video.currentTime));
    video.addEventListener('ended', () => { wantPlay = false; bus.emit('ended'); });
    video.addEventListener('error', () => bus.emit('error', video.error));
    /* 自動再生の制限への対応。Safari などは「操作（クリック・キー）の直後」でないと、音つきの動画をプログラムから再生させない。
       ただし、操作（ファイル選択・ドロップ）の処理の中で作った <video> には、この制限がそもそもかからないので、ふつうの使い方では困らない。
       万一断られたときだけ、音を消して再生し、次の操作で音を戻す。
       （「最初の操作で play() → すぐ pause()」で一律に解除する方法は使わない。下の Safari の癖を自分で踏むことになる）

       Safari（WebKit）の癖：再生が実際に始まる前に pause() すると（すばやい再生→停止）、
         ・その次のシークで、絵が変わらない（時刻だけ進む）。もう一度シークすると直る
         ・その直後の play() が効かないことがある
       → 止めた後の最初のシークは「わずかにずらして2回」行い、play() は少し後に本当に再生が始まったかを確かめて、だめならやり直す。 */
    let mutedByPolicy = false;
    const onGesture = (e) => {
      if (e && e.isTrusted === false) return;
      if (mutedByPolicy) { mutedByPolicy = false; video.muted = false; }
    };
    const GESTURES = ['pointerdown', 'keydown'];
    GESTURES.forEach((ty) => document.addEventListener(ty, onGesture, true));
    const api = {
      kind: 'video', el: video, file, url,
      get duration() { return isFinite(video.duration) ? video.duration : 0; },
      get time() { return video.currentTime; },
      get paused() { return video.paused; },
      get rate() { return video.playbackRate; },
      set rate(r) { video.playbackRate = r; bus.emit('rate', r); },
      get width() { return video.videoWidth || 1280; },
      get height() { return video.videoHeight || 720; },
      get ready() { return video.readyState >= 1 && video.videoWidth > 0; },
      seek(x) {
        return new Promise((resolve) => {
          const target = BS.clamp(x, 0, api.duration || x);
          // 1回ぶんのシーク：seeked を待つ（来なければ 3 秒であきらめる）
          const go = (t, then) => {
            let fired = false;
            const done = () => { if (fired) return; fired = true; video.removeEventListener('seeked', done); then(); };
            video.addEventListener('seeked', done);
            video.currentTime = t;
            setTimeout(done, 3000);
          };
          if (kick && video.paused) {
            // 止めた後の最初のシーク：いったん「わずかにずらした時刻」へ行ってから、目的の時刻へ（Safari で絵が変わらないことへの対策）
            kick = false;
            const near = target + 0.01 <= (api.duration || target + 1) ? target + 0.01 : Math.max(0, target - 0.01);      // 1コマ（1/30〜1/60 秒）より小さいずれ
            go(near, () => go(target, resolve));
            return;
          }
          if (Math.abs(video.currentTime - target) < 0.01) { bus.emit('time', target); resolve(); return; }
          go(target, resolve);
        });
      },
      play() {
        wantPlay = true;
        let p = null;
        try { p = video.play(); } catch (err) { p = null; }
        // 少し後に、本当に再生が始まったかを確かめる（すばやい 再生→停止→再生 の3つ目が、Safari では効かないことがある）
        setTimeout(() => { if (wantPlay && video.paused && !video.ended && !video.error) { const q = video.play(); if (q && q.catch) q.catch(() => {}); } }, 350);
        if (!p || !p.then) return Promise.resolve();
        return p.catch((err) => {
          if (!err || err.name !== 'NotAllowedError' || video.muted) return undefined;
          video.muted = true; mutedByPolicy = true;
          bus.emit('notice', 'ブラウザの制限で、音を消して再生しています（画面をクリックすると音が出ます）');
          return video.play().catch(() => {});
        });
      },
      pause() { if (!video.paused || wantPlay) kick = true; wantPlay = false; video.pause(); },
      frameTo(ctx, w, h) { try { ctx.drawImage(video, 0, 0, w, h); } catch (e) { /* 未読み込み */ } },
      on: bus.on,
      destroy() { wantPlay = false; GESTURES.forEach((ty) => document.removeEventListener(ty, onGesture, true)); video.pause(); cancelAnimationFrame(raf); if (!isUrl) URL.revokeObjectURL(url); video.removeAttribute('src'); video.load(); }
    };
    return api;
  }

  BS.createVideoMedia = createVideoMedia;
})(typeof window !== 'undefined' ? window : globalThis);
