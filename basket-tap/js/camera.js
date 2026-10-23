/* バスケ タップ記録 — この端末のカメラで撮影しながら記録する
   カメラ（getUserMedia）の映像を、ブラウザの録画（MediaRecorder）で録る。
   録画を始めた時刻（startedAt）を記録と同じ時計（Date.now）で持つので、あとで動画と記録の時刻を合わせる必要がない
   （記録の t 秒 ＝ 動画の t ＋（記録のスタート − 録画の始まり）秒）。
   録画は数秒ごとに IndexedDB へ保存し（vstore）、止めたら、ふつうの MP4 に組み直す図を作る（fmp4.flatten）。
   1回の録画（録画を始めてから止めるまで）＝ 動画1本。途中で止めて、また始めると、別の動画になる（それぞれに始まりの時刻がある）。 */
(function (root) {
  'use strict';
  const BT = root.BT = root.BT || {};

  const QUALITY = {
    '720': { w: 1280, h: 720, bps: 3000000, label: '720p（ふつう）', perHour: 1.4 },
    '1080': { w: 1920, h: 1080, bps: 6000000, label: '1080p（きれい・容量 2 倍）', perHour: 2.8 }
  };
  const SLICE = 1000;          // 何ミリ秒ごとに受け取って保存するか
  // （Chrome は、キーフレームで区切った「ひとまとまり」がそろってから渡すので、区切りも 1 秒ごとにする。
  //   途中でページが閉じたとき失うのは、最後の数秒）

  function supported() {
    try { return !!(root.navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && root.MediaRecorder); } catch (e) { return false; }
  }
  /* 録画の形式：MP4 を優先（iPhone・iPad の Safari は H.264、Chrome は H.264 か VP9）。だめなら WebM */
  function pickMime(audio) {
    const list = audio
      ? ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4;codecs=vp9,opus', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4;codecs=vp9', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    for (const m of list) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) { /* 次 */ } }
    return '';
  }
  const extOf = (mime) => (/webm/.test(mime || '') ? 'webm' : 'mp4');

  function create() {
    const bus = {};
    const emit = (ev, a) => (bus[ev] || []).forEach((fn) => { try { fn(a); } catch (e) { /* 表示の失敗で止めない */ } });
    const C = {
      stream: null, rec: null, seg: null, state: 'off', opts: null, error: null,
      on(ev, fn) { (bus[ev] = bus[ev] || []).push(fn); },
      /* カメラを開く。opts: { quality: '720' | '1080', audio: true | false } */
      async open(opts) {
        C.opts = Object.assign({ quality: '720', audio: true }, opts || {});
        if (C.stream && C.stream.getVideoTracks().some((t) => t.readyState === 'live')) return C.stream;
        const q = QUALITY[C.opts.quality] || QUALITY['720'];
        const video = { facingMode: { ideal: 'environment' }, width: { ideal: q.w }, height: { ideal: q.h }, frameRate: { ideal: 30, max: 30 } };
        const audio = C.opts.audio ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false } : false;
        let st;
        try { st = await navigator.mediaDevices.getUserMedia({ video, audio }); } catch (e) {
          // 音（マイク）を断られたときは、映像だけで
          if (audio && e && (e.name === 'NotAllowedError' || e.name === 'NotFoundError')) { st = await navigator.mediaDevices.getUserMedia({ video, audio: false }); C.opts.audio = false; emit('notice', 'マイクが使えないので、音なしで撮ります'); } else throw e;
        }
        C.stream = st;
        st.getVideoTracks().forEach((t) => t.addEventListener('ended', () => emit('trackended')));
        C.setState(C.rec ? C.state : 'ready');
        return st;
      },
      setState(s) { C.state = s; emit('state', s); },
      settings() { const t = C.stream && C.stream.getVideoTracks()[0]; return t && t.getSettings ? t.getSettings() : {}; },
      live() { return !!(C.stream && C.stream.getVideoTracks().some((t) => t.readyState === 'live')); },
      /* 録画を始める。meta: { gameId, n, base（ファイル名のもと） }。戻り値：動画の情報（vstore の videos の形） */
      async start(meta) {
        if (C.rec) return C.seg;
        if (!C.live()) await C.open(C.opts);
        const q = QUALITY[C.opts.quality] || QUALITY['720'];
        const mime = pickMime(C.opts.audio && C.stream.getAudioTracks().length > 0);
        const ro = { videoBitsPerSecond: q.bps, audioBitsPerSecond: 96000, videoKeyFrameIntervalDuration: 1000 };      // （知らない設定は、ブラウザが無視する）
        if (mime) ro.mimeType = mime;
        let rec;
        try { rec = new MediaRecorder(C.stream, ro); } catch (e) { delete ro.videoKeyFrameIntervalDuration; rec = new MediaRecorder(C.stream, ro); }
        const s = C.stream.getVideoTracks()[0].getSettings ? C.stream.getVideoTracks()[0].getSettings() : {};
        const vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        const seg = C.seg = {
          vid, gameId: meta.gameId, n: meta.n || 1, startedAt: null, endedAt: null, mime: rec.mimeType || mime || 'video/webm', ext: '', w: s.width || q.w, h: s.height || q.h,
          bytes: 0, chunks: 0, status: 'recording', plan: null, duration: null, name: ''
        };
        seg.ext = extOf(seg.mime);
        seg.name = `${meta.base || 'バスケ動画'}_動画${seg.n}.${seg.ext}`;
        let chain = Promise.resolve();
        let i = 0;
        const stopped = new Promise((resolve) => { rec.addEventListener('stop', () => resolve()); });
        rec.addEventListener('dataavailable', (e) => {
          if (!e.data || !e.data.size) return;
          const k = i++, blob = e.data;
          seg.bytes += blob.size; seg.chunks = i;
          // 保存は届いた順に1つずつ（順番が入れかわらないように）
          chain = chain.then(() => BT.vstore.putChunk(vid, k, blob)).then(() => BT.vstore.putVideo(Object.assign({}, seg, { plan: null }))).catch((err) => { C.error = err; emit('error', err); });
          emit('progress', seg);
        });
        rec.addEventListener('error', (e) => { C.error = (e && e.error) || new Error('録画でエラーが起きました'); emit('error', C.error); });
        const started = new Promise((resolve) => { rec.addEventListener('start', () => { seg.startEvt = Date.now(); resolve(); }); });
        C.rec = rec;
        C.flush = () => chain;
        C.stopped = stopped;
        seg.startCall = Date.now();
        rec.start(SLICE);
        await Promise.race([started, new Promise((r) => setTimeout(r, 1500))]);
        // 録画を始めた時刻は「start() を呼ぶ直前」。録画が始まった知らせ（start）は、実際の始まりより 0.05〜0.1 秒おそい
        // （Chromium で、映像に映した時刻と比べて確かめた。直前の時刻なら、ずれは 0.03 秒以内）
        seg.startedAt = seg.startCall;
        await BT.vstore.putVideo(Object.assign({}, seg));
        C.setState('recording');
        emit('start', seg);
        return seg;
      },
      elapsed() { return C.seg && C.seg.startedAt && C.rec ? (Date.now() - C.seg.startedAt) / 1000 : 0; },
      /* 録画を止めて、仕上げる（ふつうの MP4 に組み直す図を作る）。戻り値：動画の情報 */
      async stop() {
        const rec = C.rec, seg = C.seg;
        if (!rec || !seg) return null;
        C.setState('finishing');
        try { if (rec.state !== 'inactive') rec.stop(); } catch (e) { /* もう止まっている */ }
        await Promise.race([C.stopped, new Promise((r) => setTimeout(r, 4000))]);
        await C.flush();
        seg.endedAt = Date.now();
        C.rec = null; C.seg = null;
        const done = await finish(seg);
        C.setState(C.live() ? 'ready' : 'off');
        emit('done', done);
        return done;
      },
      /* カメラを閉じる（録画中なら、止めて仕上げてから） */
      async close() {
        let done = null;
        if (C.rec) done = await C.stop();
        if (C.stream) C.stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) { /* 無視 */ } });
        C.stream = null;
        C.setState('off');
        return done;
      }
    };
    return C;
  }

  /* 録画を仕上げる：切れはしをつないで、MP4 なら組み直す図を作り、長さを決めて保存する。
     録画の途中でページが閉じた動画（status: 'recording' のまま残ったもの）にも使う */
  async function finish(seg) {
    const v = Object.assign({}, seg);
    try {
      const blob = await BT.vstore.raw(v.vid, v.mime);
      v.bytes = blob.size;
      if (v.ext === 'mp4' && blob.size && BT.fmp4) {
        let plan = null;
        try { plan = await BT.fmp4.flatten(blob); } catch (e) { plan = null; }
        if (plan && plan.flat) { v.plan = { header: plan.header, ranges: plan.ranges, duration: plan.duration, truncated: plan.truncated }; v.duration = plan.duration; } else {
          // 中身（映像のデータ）が1つもない：始めてすぐ閉じた・止めた
          const top = await BT.fmp4.scan(blob).catch(() => []);
          if (!top.some((b) => b.type === 'moof' || b.type === 'mdat')) v.empty = true;
        }
      } else if (!blob.size) v.empty = true;
    } catch (e) { /* 読めなくても、記録の時刻だけで */ }
    // 長さが分からない（WebM で、途中で閉じた）ときは、保存した切れはしの数からの目安
    if (!v.endedAt && !v.duration && v.chunks) v.duration = v.chunks * SLICE / 1000;
    if (!v.endedAt) v.endedAt = v.startedAt + Math.round((v.duration || 0) * 1000);
    if (!v.duration) v.duration = Math.max(0, (v.endedAt - v.startedAt) / 1000);
    v.status = 'done';
    if (v.empty) { await BT.vstore.remove(v.vid); v.gone = true; return v; }       // 何も録れていない動画は残さない
    await BT.vstore.putVideo(v);
    return v;
  }
  /* 前回、録画の途中で閉じた動画を仕上げる（その試合の 'recording' のまま残ったもの） */
  async function recover(gameId) {
    const list = await BT.vstore.videosOf(gameId);
    const out = [];
    for (const v of list) {
      if (v.status !== 'recording') continue;
      if (!v.chunks) { await BT.vstore.remove(v.vid); continue; }
      out.push(await finish(Object.assign({}, v, { endedAt: null, duration: null })));
    }
    return out;
  }

  BT.camera = { supported, create, finish, recover, pickMime, QUALITY, SLICE };
})(typeof window !== 'undefined' ? window : globalThis);
