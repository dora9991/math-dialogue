/* バスケ分析スタジオ — 自動解析の実行部
   同じコードが Worker（別スレッド）でも画面側でも動く。入力のしかたは2つ：
   A) decode … 動画ファイル（MP4 / MOV）を自分で読み、WebCodecs で全コマを順にデコードして調べる。
               コマの取りこぼしがなく、毎回同じ結果になり、タブが裏に回っても止まらない。
   B) push   … 画面側が1コマずつ画像を送る（合成サンプル、WebCodecs が使えない動画）。
   どちらも、調べるコマは約15コマ/秒（判定のしきい値はこの間隔で合わせてある）。 */
(function (root) {
  function mod(root) {
    'use strict';
    const BS = root.BS;
    const A = BS.auto, MP4 = BS.mp4;
    const MIN_STEP = 0.06;          // これより近いコマは飛ばす（30fps の動画なら1コマおき）

    /* env: { makeCanvas(w,h), preview(canvas) → 画面に送れる画像（なければ null） } */
    function create(env) {
      let fa = null, cfg = null, cancelled = false;
      const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

      let dbg = null;               // 検証用：コマごとのボール候補（tests/real-shots.cjs で読む形）。init の cfg.debug か decode の debug で有効
      function init(c) { cfg = c; cancelled = false; dbg = c.debug ? [] : null; fa = A.createFrameAnalyzer(c, env.makeCanvas); }
      function record(t, live) {
        if (!dbg) return;
        live.status.forEach((s, i) => {
          if (!s.tracked || !s.inFrame) return;
          dbg.push({ t: +t.toFixed(3), h: i, sc: +s.score.toFixed(2), rs: s.rimScore == null ? null : +s.rimScore.toFixed(2), rim: [Math.round(s.rim.cx), Math.round(s.rim.cy), +s.rim.w.toFixed(1)], fg: +(s.fg || 0).toFixed(3), net: +(s.net || 0).toFixed(3), no: +(s.netOnly || 0).toFixed(3),
            c: (s.cands || []).map((c) => [+c.x.toFixed(2), +c.y.toFixed(2), +c.area.toFixed(2), Math.round(c.r), Math.round(c.g), Math.round(c.b), +c.fill.toFixed(2), +(c.still || 0).toFixed(2)]) });
        });
      }
      /* 画面に返す分だけに絞る（枠・リング・ボール候補） */
      function slim(live) {
        return {
          status: live.status.map((s) => ({
            tracked: s.tracked && s.inFrame, score: +s.score.toFixed(2), box: s.box, rim: s.rim,
            balls: (s.cands || []).filter(A.ballLike).map((c) => ({ x: +c.x.toFixed(2), y: +c.y.toFixed(2) }))
          })),
          events: live.events
        };
      }
      function closeImage(img) { if (img && typeof img.close === 'function') { try { img.close(); } catch (e) { /* すでに閉じている */ } } }

      /* ファイルを自分で読めないとき（Safari でローカルの HTML から開くと、Worker の中からは選んだファイルを読めない）は、
         画面側に「ここからここまで読んで」と頼む。post({ ev:'read', rid, a, b }) → 画面側が { cmd:'data', rid, buf } を返す */
      let rseq = 0;
      const reads = new Map();
      function proxyReader(size, post) {
        return { size, proxy: true, read: (a, b) => new Promise((resolve, reject) => { const rid = ++rseq; reads.set(rid, { resolve, reject }); post({ ev: 'read', rid, a, b }); }) };
      }
      function onData(m) {
        const p = reads.get(m.rid);
        if (!p) return;
        reads.delete(m.rid);
        if (m.error || !m.buf) p.reject(new Error(m.error || '読み込めませんでした')); else p.resolve(new Uint8Array(m.buf));
      }

      /* ---- B) push ---- */
      function tpl(i, image) { fa.load(image); fa.initHoop(i); closeImage(image); }
      function frame(t, image, wantPreview) {
        const raw = fa.frame(t, image);
        record(t, raw);
        const live = slim(raw);
        closeImage(image);
        if (wantPreview && env.preview) live.preview = env.preview(fa.canvas);
        return live;
      }

      /* ---- A) decode ---- */
      /* start 番目のサンプル（キーフレーム）から順にデコードして onFrame(frame, 秒) を呼ぶ。false を返すと打ち切り */
      async function decodeFrom(track, reader, config, start, onFrame) {
        let stop = false, error = null, fed = 0, handled = 0, wake = null;
        const dec = new VideoDecoder({
          output: (f) => {
            handled++;
            try { if (!stop && !cancelled && onFrame(f, f.timestamp / 1e6) === false) stop = true; }
            catch (e) { error = e; stop = true; }
            finally { f.close(); if (wake) wake(); }
          },
          error: (e) => { error = error || e; stop = true; if (wake) wake(); }
        });
        dec.configure(config);
        const BLOCK = 8 * 1024 * 1024;
        let buf = null, b0 = 0, b1 = 0;
        const keyT = track.time[start];
        for (let i = start; i < track.count && !stop && !cancelled; i++) {
          const off = track.offset[i], sz = track.size[i];
          if (!sz) continue;
          // 始めのキーフレームより「前に表示される」コマは渡さない。iPhone の HEVC などは、キーフレームの直後に
          // 「それより前のコマを参照する」コマが続く（open GOP）。途中から始めるとそれらはデコードできず、Safari では全体が失敗になる。
          if (i > start && track.time[i] < keyT - 1e-6) continue;
          if (!buf || off < b0 || off + sz > b1) {
            b0 = off; b1 = Math.min(reader.size, Math.max(off + sz, off + BLOCK));
            buf = await reader.read(b0, b1);
          }
          // デコーダーに渡しすぎない（出てきたコマを処理し終えるのを待つ）
          while (!stop && !cancelled && (fed - handled > 24 || dec.decodeQueueSize > 12)) await new Promise((r) => { wake = r; setTimeout(r, 30); });
          if (stop || cancelled) break;
          dec.decode(new EncodedVideoChunk({ type: track.sync[i] ? 'key' : 'delta', timestamp: Math.round(track.time[i] * 1e6), data: buf.subarray(off - b0, off - b0 + sz) }));
          fed++;
        }
        if (!stop && !cancelled && !error) { try { await dec.flush(); } catch (e) { error = error || e; } }
        try { dec.close(); } catch (e) { /* すでに閉じている */ }
        if (error) throw error;
      }

      /* opts: { file | url, marks: [{ i, t }], t0, t1 }。途中経過は post({ ev:'progress', ... }) */
      async function decode(opts, post) {
        if (typeof VideoDecoder === 'undefined') throw Object.assign(new Error('このブラウザは WebCodecs に対応していません'), { code: 'unsupported' });
        let reader, track;
        try {
          if (opts.file) {
            reader = MP4.blobReader(opts.file);
            try { await reader.read(0, Math.min(16, reader.size)); }
            catch (e) { reader = proxyReader(opts.file.size, post); }       // ここからは読めない → 画面側に読んでもらう
          } else reader = await MP4.urlReader(opts.url);
          track = await MP4.open(reader);
        } catch (e) { throw Object.assign(new Error(e.message || String(e)), { code: 'unsupported' }); }
        const config = { codec: track.codec, codedWidth: track.width, codedHeight: track.height, description: track.description };
        let ok = false;
        try { ok = (await VideoDecoder.isConfigSupported(config)).supported; } catch (e) { ok = false; }
        if (!ok) throw Object.assign(new Error('このブラウザでは ' + track.codec + ' をデコードできません'), { code: 'unsupported' });
        const rot = track.rotation || 0;
        post({ ev: 'info', codec: track.codec, fps: +track.fps.toFixed(2), frames: track.count, duration: track.duration, rotation: rot, reader: reader.proxy ? 'proxy' : 'direct' });

        // ゴールのテンプレート：指定したコマ（画面に出ていたコマ＝時刻 t 以前で最後のコマ）から作る
        for (const m of opts.marks) {
          let loaded = false;
          await decodeFrom(track, reader, config, MP4.keyBefore(track, m.t), (f, t) => {
            if (t > m.t + 1e-4 && loaded) return false;
            if (t >= m.t - 0.12) { fa.load(f, rot); loaded = true; }
            return true;
          });
          if (!loaded) throw new Error('ゴールを指定したコマを読めませんでした');
          fa.initHoop(m.i);
        }

        // 本番：頭から順に
        const t0 = opts.t0 || 0, t1 = opts.t1 != null ? opts.t1 : Infinity;
        let lastT = -1, n = 0, lastPost = 0, skip = opts.phase || 0, spent = 0;      // spent: 1コマの解析（fa.frame）にかかった時間の合計（ミリ秒）。デコードにかかった時間との切り分け用
        if (opts.debug && !dbg) dbg = [];
        const started = now();
        await decodeFrom(track, reader, config, MP4.keyBefore(track, t0), (f, t) => {
          if (t < t0 - 1e-6) return true;
          if (t > t1) return false;
          if (skip > 0) { skip--; return true; }
          if (t - lastT < MIN_STEP) return true;
          lastT = t; n++;
          const tf = now();
          const live = fa.frame(t, f, rot);
          spent += now() - tf;
          record(t, live);
          const w = now();
          if (live.events.length || w - lastPost > 200) {
            const msg = { ev: 'progress', t, frames: n, elapsed: (w - started) / 1000, live: slim(live) };
            let tr = [];
            if (w - lastPost > 200 && env.preview) { msg.preview = env.preview(fa.canvas); if (msg.preview && env.transferable) tr = [msg.preview]; }
            lastPost = w;
            post(msg, tr);
          }
          return true;
        });
        if (cancelled) throw Object.assign(new Error('中止しました'), { code: 'cancelled' });
        const res = fa.finish();
        res.elapsed = (now() - started) / 1000;
        res.analyseSec = spent / 1000;
        res.mode = 'decode';
        if (dbg) res.log = dbg;
        return res;
      }

      function finish() { const res = fa.finish(); res.mode = 'push'; if (dbg) res.log = dbg; return res; }
      function cancel() { cancelled = true; }

      /* メッセージ1つを処理する（Worker でも画面側でも共通） */
      async function handle(m, post) {
        try {
          let out = null;
          if (m.cmd === 'init') init(m.cfg);
          else if (m.cmd === 'tpl') tpl(m.i, m.image);
          else if (m.cmd === 'frame') out = { live: frame(m.t, m.image, m.preview) };
          else if (m.cmd === 'decode') out = { result: await decode(m, post) };
          else if (m.cmd === 'finish') out = { result: finish() };
          else if (m.cmd === 'cancel') { cancel(); return; }
          else if (m.cmd === 'data') { onData(m); return; }
          else throw new Error('unknown cmd ' + m.cmd);
          const tr = out && out.live && out.live.preview && env.transferable ? [out.live.preview] : [];
          post(Object.assign({ id: m.id, ok: true }, out), tr);
        } catch (e) {
          post({ id: m.id, ok: false, error: (e && e.message) || String(e), code: (e && e.code) || null });
        }
      }
      return { handle, cancel };
    }

    /* Worker の中で呼ぶ：メッセージを受けて処理する */
    function serve(scope) {
      let pv = null, pg = null;
      const core = create({
        makeCanvas: (w, h) => new OffscreenCanvas(w, h),
        transferable: true,
        preview(canvas) {
          const w = 640, h = Math.round(640 * canvas.height / canvas.width);
          if (!pv || pv.height !== h) { pv = new OffscreenCanvas(w, h); pg = pv.getContext('2d'); }
          pg.drawImage(canvas, 0, 0, w, h);
          return pv.transferToImageBitmap();
        }
      });
      scope.onmessage = (e) => { core.handle(e.data, (msg, tr) => scope.postMessage(msg, tr || [])); };
    }

    BS.autoEngine = { create, serve, MIN_STEP };
  }
  mod(root);
  (root.BS.src = root.BS.src || {}).autoEngine = mod;   // Worker に同じコードを渡すため
})(typeof window !== 'undefined' ? window : globalThis);
