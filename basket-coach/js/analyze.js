/* 動画分析のしくみ（BC.analyze）。画面は js/check.js。動画は、この端末の中だけで調べる（どこにも送らない）。
   AI の部品（MediaPipe Tasks Vision）は、はじめの1回だけインターネットから読みこむ（約 10〜20MB。ブラウザにのこる）。

   ■ じぶんの動き（1人）
     1. 動画のコマを順に取り出し（BA.sample）、骨格（33か所の点）を読む（PoseLandmarker）
     2. 調べる人を決め、コマからコマへ追いかける（BA.track）
     3. 角度・高さなどを計算（BA.features）→ 動きの種類ごとに、場面（しずむ・はなす・着地 など）を見つけて、
        よい・もう少し・直そう を決める（BA.analyzeSelf）
   ■ チームの動き（全員）
     1. コートの4つの点をタップ → 画面の位置とコートの位置（m）の対応（BA.homography）
     2. コマごとに人を見つけ（ObjectDetector）、足もと → コートの位置。ユニフォームの色でチームを分ける
     3. 広がり・ペイントの人数・コーナーの使い方・集まりすぎ などを計算（BA.teamAnalyze）
   計算の関数（features・analyzeSelf・homography・teamAnalyze など）は DOM を使わない（tools/analyze-test.cjs で検査）。 */
(function (root) {
  const BC = (root.BC = root.BC || {});
  const BA = (BC.analyze = BC.analyze || {});

  BA.cfg = {
    base: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21',
    pose: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    person: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
  };

  /* ---------- AI の部品を読みこむ ---------- */
  let visionP = null, filesetP = null;
  const tasks = {};
  async function vision() {
    if (!visionP) visionP = import(/* @vite-ignore */ BA.cfg.base + '/vision_bundle.mjs');
    return visionP;
  }
  async function fileset() {
    const v = await vision();
    if (!filesetP) filesetP = v.FilesetResolver.forVisionTasks(BA.cfg.base + '/wasm');
    return filesetP;
  }
  // AI のモデル（重さのデータ）を、進み具合を知らせながら読みこむ
  const buffers = {};
  async function fetchModel(url, onProgress) {
    if (buffers[url]) return buffers[url];
    const res = await fetch(url);
    if (!res.ok) throw new Error('モデルを読みこめませんでした（' + res.status + '）');
    const total = +res.headers.get('content-length') || 0;
    if (!res.body || !res.body.getReader) { buffers[url] = new Uint8Array(await res.arrayBuffer()); return buffers[url]; }
    const reader = res.body.getReader();
    const parts = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value); got += value.length;
      if (onProgress && total) onProgress(Math.min(1, got / total));
    }
    const out = new Uint8Array(got);
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    buffers[url] = out;
    return out;
  }
  // kind：'pose'（1人の骨格・動画用）| 'person'（人を見つける・動画用）。onProgress(0〜1)：モデルの読みこみ
  BA.load = async function (kind, onProgress) {
    if (tasks[kind]) return tasks[kind];
    const v = await vision();
    const fs = await fileset();
    const buf = await fetchModel(kind === 'pose' ? BA.cfg.pose : BA.cfg.person, onProgress);
    const make = async (delegate) => {
      if (kind === 'pose') {
        return v.PoseLandmarker.createFromOptions(fs, {
          baseOptions: { modelAssetBuffer: buf, delegate },
          runningMode: 'VIDEO', numPoses: 3, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
        });
      }
      return v.ObjectDetector.createFromOptions(fs, {
        baseOptions: { modelAssetBuffer: buf, delegate },
        runningMode: 'VIDEO', scoreThreshold: 0.3, maxResults: 20, categoryAllowlist: ['person'],
      });
    };
    // GPU が使えればはやい。使えなければ CPU
    try { tasks[kind] = await make(BA.cfg.delegate || 'GPU'); }
    catch (e) { tasks[kind] = await make('CPU'); }
    return tasks[kind];
  };
  BA.reset = function (kind) { if (tasks[kind]) { try { tasks[kind].close(); } catch (e) { /* なし */ } delete tasks[kind]; } };

  /* ---------- 動画のコマを順に（シークして取り出す） ----------
     onFrame(t, i) を、t 秒のコマが表示された状態で呼ぶ。signal.aborted で止める。 */
  BA.sample = async function (video, opt) {
    const { from = 0, to = video.duration, fps = 12, onFrame, onProgress, signal } = opt;
    const end = Math.min(to, video.duration || to);
    const n = Math.max(1, Math.floor((end - from) * fps));
    for (let i = 0; i <= n; i++) {
      if (signal && signal.aborted) throw new Error('中止しました');
      const t = Math.min(end - 0.001, from + i / fps);
      await seek(video, t);
      await onFrame(t, i);
      if (onProgress) onProgress((i + 1) / (n + 1));
    }
    return n + 1;
  };
  // シークして、そのコマが本当に描ける状態になるまで待つ。
  // 'seeked' のすぐあとは、前のコマのままのことがある（ブラウザによる）ので、次に画面に出たコマ（requestVideoFrameCallback）か、2回の描きかえを待つ。
  function seek(video, t) {
    return new Promise((res) => {
      let done = false;
      const fin = () => {
        if (done) return;
        done = true;
        video.removeEventListener('seeked', onSeeked);
        clearTimeout(tm);
        res();
      };
      const settle = () => {
        let ok = false;
        const go = () => { if (!ok) { ok = true; fin(); } };
        // requestVideoFrameCallback は、画面に出ている動画でだけ呼ばれる
        if (typeof video.requestVideoFrameCallback === 'function' && video.isConnected && video.offsetWidth > 0) {
          video.requestVideoFrameCallback(() => go());
          setTimeout(go, 120); // 同じコマのときは呼ばれないので、少し待って進む
        } else if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(go));
        else setTimeout(go, 30);
      };
      const onSeeked = () => settle();
      const tm = setTimeout(fin, 4000);
      if (Math.abs(video.currentTime - t) < 1e-4 && video.readyState >= 2) { settle(); return; }
      video.addEventListener('seeked', onSeeked);
      video.currentTime = t;
    });
  }
  BA.seek = seek;

  /* ---------- 骨格の点（MediaPipe の33点のうち、使うもの） ---------- */
  const K = BA.K = { nose: 0, lEye: 2, rEye: 5, lEar: 7, rEar: 8, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28, lHeel: 29, rHeel: 30, lToe: 31, rToe: 32 };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const ang3 = (a, b, c) => {
    const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
    const d = Math.hypot(...v1) * Math.hypot(...v2) || 1;
    return (Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))) * 180) / Math.PI;
  };
  BA.ang3 = ang3;
  const median = (xs) => { const a = xs.filter((x) => x != null && isFinite(x)).sort((p, q) => p - q); return a.length ? a[Math.floor(a.length / 2)] : null; };
  const pct = (xs, p) => { const a = xs.filter((x) => x != null && isFinite(x)).sort((u, v) => u - v); return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : null; };
  const std = (xs) => { const a = xs.filter((x) => x != null && isFinite(x)); if (a.length < 2) return 0; const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length); };
  BA.stats = { median, pct, std };

  // 骨格の点（正規化 0〜1）→ 画素の点 [x, y, 見えている度合い]
  BA.toPx = (lms, W, H) => lms.map((p) => [p.x * W, p.y * H, p.visibility == null ? 1 : p.visibility]);
  // 人の大きさ（点のひろがり）と、腰のまん中
  const boxOf = (lm) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of lm) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } return [x0, y0, x1, y1]; };
  BA.boxOf = boxOf;

  /* ---------- 追いかける ----------
     poses：コマごとの [人ごとの点（画素）] の並び。pick：はじめのコマで調べる人（人の番号）。なければいちばん大きい人
     返す：コマごとの点（その人がいなければ null） */
  BA.track = function (poses, pick) {
    const out = [];
    let prev = null, prevSize = 0, miss = 0;
    const first = firstIndex(poses);
    for (let i = 0; i < poses.length; i++) {
      const ps = poses[i] || [];
      let best = null;
      if (!prev) {
        if (ps.length) {
          if (i === first && pick != null && ps[pick]) best = ps[pick];
          else best = ps.slice().sort((a, b) => area(b) - area(a))[0];
        }
      } else {
        let bd = Infinity;
        const pc = hipCenter(prev);
        for (const p of ps) {
          const d = dist(hipCenter(p), pc);
          if (d < bd) { bd = d; best = p; }
        }
        // 大きく飛んだら、ちがう人（見失った）。大きさが急に変わったときも、ちがう人
        if (best && bd > prevSize * (0.6 + miss * 0.3)) best = null;
        if (best) { const h = height(best); if (h < prevSize * 0.55 || h > prevSize * 1.8) best = null; }
      }
      if (best) { prev = best; prevSize = Math.max(40, height(best)); miss = 0; } else miss++;
      out.push(best);
    }
    return out;
  };
  // いちばん近い人の番号（pt：腰のまん中の位置）
  BA.nearest = function (ps, pt) {
    let bi = -1, bd = Infinity;
    (ps || []).forEach((p, i) => { const d = dist(hipCenter(p), pt); if (d < bd) { bd = d; bi = i; } });
    return bi;
  };
  // MediaPipe の「動画」モードの時刻（ms）。前より大きくなければいけないので、ずっと増やしていく
  let tsNow = 0;
  BA.tick = (ms) => (tsNow += Math.max(1, Math.round(ms || 1)));
  const firstIndex = (poses) => poses.findIndex((p) => p && p.length);
  const area = (lm) => { const b = boxOf(lm); return (b[2] - b[0]) * (b[3] - b[1]); };
  const height = (lm) => { const b = boxOf(lm); return b[3] - b[1]; };
  const hipCenter = (lm) => mid(lm[K.lHip], lm[K.rHip]);
  BA.hipCenter = hipCenter;

  // 3コマのなめらかにする（点ごとに、となりとの平均。いないコマはそのまま）
  BA.smooth = function (series) {
    return series.map((lm, i) => {
      if (!lm) return null;
      const a = series[i - 1], b = series[i + 1];
      return lm.map((p, k) => {
        let x = p[0], y = p[1], n = 1;
        if (a) { x += a[k][0]; y += a[k][1]; n++; }
        if (b) { x += b[k][0]; y += b[k][1]; n++; }
        return [x / n, y / n, p[2]];
      });
    });
  };

  /* ---------- 1コマの量 ----------
     高さは「床（足首）からの高さ ÷ 脚の長さ」（まっすぐ立つと 1 くらい）。角度は度。
     返す：{ legLen, torso, floor, view（'side'|'front'。肩幅から推測）, frames: [{ t, hipH, shH, headH, ankH: {l, r}, kneeL, kneeR,
             elbowL, elbowR, lean, wrist: {l, r}, pitch（下を向く角度の目安）, face, front, stanceW（足の幅 ÷ 肩幅）, ankOrder,
             fppaL, fppaR（前から：ひざが内に入る角度。内が＋）, hipX, ankX }] } */
  BA.features = function (series, times) {
    const legs = [], torsos = [];
    for (const lm of series) {
      if (!lm) continue;
      for (const s of ['l', 'r']) {
        const h = lm[K[s + 'Hip']], k = lm[K[s + 'Kn']], a = lm[K[s + 'An']];
        legs.push(dist(h, k) + dist(k, a));
      }
      torsos.push(dist(mid(lm[K.lHip], lm[K.rHip]), mid(lm[K.lSh], lm[K.rSh])));
    }
    const torso = pct(torsos, 0.9) || 1;
    // 脚の長さ：画面の上の 太もも＋すね。前からだと、ひざを曲げたままの人は短く写るので、
    // 肩幅（生）の 2.1倍・胴の 1.5倍 とくらべて大きい方（どれも「縮んで写っても、伸びては写らない」目安）
    const shs = series.filter(Boolean).map((lm) => dist(lm[K.lSh], lm[K.rSh]));
    const legLen = Math.max(pct(legs, 0.9) || 0, 2.1 * (median(shs) || 0), 1.5 * torso) || 1;
    // 床（足首のいちばん下）
    const ankYs = series.filter(Boolean).map((lm) => Math.max(lm[K.lAn][1], lm[K.rAn][1]));
    const floor = pct(ankYs, 0.85) || 0;
    const frames = series.map((lm, i) => {
      if (!lm) return null;
      const hip = mid(lm[K.lHip], lm[K.rHip]), sh = mid(lm[K.lSh], lm[K.rSh]);
      const ank = mid(lm[K.lAn], lm[K.rAn]);
      const up = (p) => (floor - p[1]) / legLen; // 床からの高さ（脚の長さが 1）
      const shRaw = dist(lm[K.lSh], lm[K.rSh]);
      const front = shRaw / torso > 0.45; // 前（うしろ）から：肩幅が広く見える
      const nose = lm[K.nose];
      let pitch, face;
      if (front) {
        // 前から：鼻が、両耳のまん中より どれだけ下か（下を向くほど大きい）
        const em = mid(lm[K.lEar], lm[K.rEar]);
        const ed = Math.max(dist(lm[K.lEar], lm[K.rEar]), 1e-6);
        pitch = (Math.asin(Math.max(-1, Math.min(1, (nose[1] - em[1]) / (0.73 * ed)))) * 180) / Math.PI;
        face = 0;
      } else {
        // 横から：見えている方の耳 → 鼻 の向き
        const ear = lm[K.lEar][2] >= lm[K.rEar][2] ? lm[K.lEar] : lm[K.rEar];
        pitch = (Math.atan2(nose[1] - ear[1], Math.abs(nose[0] - ear[0]) + 1e-6) * 180) / Math.PI;
        face = nose[0] >= ear[0] ? 1 : -1;
      }
      const shW = Math.max(shRaw, legLen * 0.15);
      // 前から：ひざの角度のずれ（FPPA）。ひざが、腰と足首を結ぶ線より内側なら＋
      const fppa = (s) => {
        const h = lm[K[s + 'Hip']], k = lm[K[s + 'Kn']], a = lm[K[s + 'An']];
        const dy = a[1] - h[1] || 1e-6;
        const xl = h[0] + (a[0] - h[0]) * ((k[1] - h[1]) / dy);
        const inward = Math.sign(hip[0] - h[0]) || 1;
        const sign = Math.sign((k[0] - xl) * inward) || 1;
        return sign * (180 - ang3(h, k, a));
      };
      return {
        t: times ? times[i] : i,
        hipH: up(hip), shH: up(sh), headH: up(nose), ankH: { l: up(lm[K.lAn]), r: up(lm[K.rAn]) },
        kneeL: ang3(lm[K.lHip], lm[K.lKn], lm[K.lAn]), kneeR: ang3(lm[K.rHip], lm[K.rKn], lm[K.rAn]),
        elbowL: ang3(lm[K.lSh], lm[K.lEl], lm[K.lWr]), elbowR: ang3(lm[K.rSh], lm[K.rEl], lm[K.rWr]),
        lean: (Math.atan2(sh[0] - hip[0], hip[1] - sh[1]) * 180) / Math.PI,
        wrist: { l: up(lm[K.lWr]), r: up(lm[K.rWr]) },
        pitch, face, front,
        stanceW: Math.abs(lm[K.lAn][0] - lm[K.rAn][0]) / shW,
        ankOrder: Math.sign(lm[K.lAn][0] - lm[K.rAn][0]),
        fppaL: fppa('l'), fppaR: fppa('r'),
        hipX: hip[0] / legLen, ankX: ank[0] / legLen,
        vis: Math.min(lm[K.lAn][2], lm[K.rAn][2]),
        size: (boxOf(lm)[3] - boxOf(lm)[1]),
      };
    });
    const fr = frames.filter(Boolean);
    const view = fr.filter((f) => f.front).length > fr.length / 2 ? 'front' : 'side';
    return { legLen, torso, floor, view, frames };
  };

  /* ---------- じぶんの動き：種類ごとの分析 ----------
     返す：{ ok, msg, view, notes: [文], metrics: [{ key, label, value, status, msg, links, at }], keys: [{ label, i }], series（グラフ用）, hand }
     status：'good'（◎ よくできている）| 'ok'（○ もう少し）| 'bad'（△ ここを直そう）| 'na'（はかれなかった・目安） */
  const M = (key, label, value, status, msg, extra = {}) => Object.assign({ key, label, value, status, msg }, extra);
  const range = (n, a, b) => { const out = []; for (let i = Math.max(0, a); i <= Math.min(n - 1, b); i++) out.push(i); return out; };
  const argBy = (idx, F, fn, better) => { let bi = -1, bv = null; for (const i of idx) { if (!F[i]) continue; const v = fn(F[i]); if (v == null || !isFinite(v)) continue; if (bi < 0 || better(v, bv)) { bi = i; bv = v; } } return bi; };
  const kneeOf = (f) => (f.kneeL + f.kneeR) / 2;
  const lv = (v, good, ok) => (v <= good ? 'good' : v <= ok ? 'ok' : 'bad'); // 小さいほどよい
  const hv = (v, good, ok) => (v >= good ? 'good' : v >= ok ? 'ok' : 'bad'); // 大きいほどよい

  // fps：コマの数（1秒に）。速い動きは多めに
  const MODES = BA.MODES = {
    shoot: { name: 'シュート', view: 'side', viewText: '横から（シュートする手の側から）', motion: 'shoot', fps: 15, secs: 6, tip: 'シュート1本（かまえ → 着地まで）。体ぜんぶが映るように' },
    dribble: { name: 'ドリブル', view: 'side', viewText: '横から', motion: 'pound', fps: 15, secs: 8, tip: 'その場で低いドリブルを 5秒くらい' },
    defense: { name: 'ディフェンス（スライド）', view: 'front', viewText: '前から', motion: 'defslide', fps: 10, secs: 10, tip: '左右にスライド 2〜3往復' },
    landing: { name: 'ジャンプの着地', view: 'front', viewText: '前から（ひざが見えるように）', motion: 'landing-front', fps: 15, secs: 6, tip: 'その場でジャンプして、着地して止まる（1回）' },
    free: { name: 'じゆう（角度を見る）', view: null, viewText: '横か前から', motion: null, fps: 12, secs: 10, tip: 'どんな動きでも。ひざ・ひじの角度と腰の高さを見られます' },
  };

  BA.analyzeSelf = function (series, opt) {
    const mode = opt.mode || 'free';
    const fps = opt.fps || (MODES[mode] || MODES.free).fps;
    const times = opt.times || series.map((_, i) => i / fps);
    const seen = series.filter(Boolean).length;
    if (seen < Math.max(6, series.length * 0.3)) return { ok: false, msg: '人の体を、あまり見つけられませんでした。体ぜんぶ（頭から足まで）が映るように、明るい所でとってみてください。' };
    const sm = BA.smooth(series);
    const FT = BA.features(sm, times);
    const F = FT.frames;
    const n = F.length;
    const view = opt.view || FT.view;
    const s = (sec) => Math.max(1, Math.round(sec * fps));
    const notes = [];
    const want = (MODES[mode] || {}).view;
    if (want && want !== FT.view) notes.push(`この動きは「${MODES[mode].viewText}」とると、くわしく見られます（今の動画は${FT.view === 'side' ? '横' : '前'}から とったように見えます）。`);
    const vis = median(F.map((f) => f && f.vis));
    if (vis != null && vis < 0.5) notes.push('足もとが よく映っていないかもしれません。足の先まで映るように とると、正しく はかれます。');
    if (seen < series.length * 0.7) notes.push('とちゅうで 体を見失ったところがあります（ほかの人と重なった・画面の外に出た など）。');
    const base = { ok: true, view, legLen: FT.legLen, notes, metrics: [], keys: [], series: F };
    const fn = { shoot: shoot, dribble: dribble, defense: defense, landing: landing }[mode];
    return fn ? fn() : base;

    // 打つ手の腕（左右がコマで入れかわって見えたときは、高い方の手に直す）
    function arm(f, hand) {
      const o = hand === 'r' ? 'l' : 'r';
      const h = f.wrist[hand] + 0.08 < f.wrist[o] ? o : hand;
      return { w: f.wrist[h], e: h === 'r' ? f.elbowR : f.elbowL };
    }

    function shoot() {
      const vv = F.filter(Boolean);
      const hand = Math.max(...vv.map((f) => f.wrist.r)) >= Math.max(...vv.map((f) => f.wrist.l)) ? 'r' : 'l';
      const W = (i) => arm(F[i], hand).w, E = (i) => arm(F[i], hand).e;
      const all = range(n, 0, n - 1);
      const iTop = argBy(all, F, (f) => arm(f, hand).w, (a, b) => a > b);
      if (iTop < 0 || !(W(iTop) > F[iTop].headH)) return Object.assign(base, { ok: false, msg: 'シュートの動き（手が頭より上に上がる）が見つかりませんでした。シュート1本が入るように、体ぜんぶが映る動画にしてください。' });
      // はなす：手首がいちばん上の少し手前
      let R = iTop;
      for (const i of range(n, iTop - s(0.3), iTop)) if (F[i] && W(i) >= W(iTop) - 0.04) { R = i; break; }
      // セット：はなす前 0.8 秒で、手首が肩より上・ひじがいちばん曲がっている
      const setIdx = range(n, R - s(0.8), R - 1).filter((i) => F[i] && W(i) > F[i].shH + 0.05);
      const S = setIdx.length ? argBy(setIdx, F, (f) => arm(f, hand).e, (a, b) => a < b) : -1;
      // しずむ：はなす前 1.5 秒の、腰がいちばん低いところ
      const D = argBy(range(n, R - s(1.5), (S >= 0 ? S : R) - 1), F, (f) => f.hipH, (a, b) => a < b);
      // 腰がいちばん高い（ジャンプのてっぺん）。てっぺんは平らなことが多いので、いちばん高い所から 0.02 以内の コマの まん中の時刻
      const P = argBy(range(n, R - s(0.5), R + s(0.5)), F, (f) => f.hipH, (a, b) => a > b);
      let topT = null;
      if (P >= 0) {
        const near = range(n, R - s(0.5), R + s(0.5)).filter((i) => F[i] && F[i].hipH >= F[P].hipH - 0.02);
        topT = near.reduce((t, i) => t + F[i].t, 0) / near.length;
      }
      // まわりの3コマの まん中の値（AI の点のぶれに強く）
      const med3 = (i, fn) => median(range(n, i - 1, i + 1).filter((j) => F[j]).map((j) => fn(j)));
      // はじめの立った高さ（しずむ前）
      const startH = pct(range(n, 0, Math.max(2, (D >= 0 ? D : R) - 1)).map((i) => F[i] && F[i].hipH), 0.75) || (D >= 0 ? F[D].hipH : F[R].hipH);
      // 着地：てっぺんのあと、足首が床にもどる（とばないシュートは、腰がもとの高さにもどる）
      let Ld = -1;
      if (P >= 0) {
        const flew = range(n, P - s(0.3), P + s(0.3)).some((i) => F[i] && Math.min(F[i].ankH.l, F[i].ankH.r) > 0.05);
        for (const i of range(n, P + 1, n - 1)) {
          if (!F[i]) continue;
          if (flew ? Math.min(F[i].ankH.l, F[i].ankH.r) <= 0.03 : F[i].hipH <= startH + 0.02) { Ld = i; break; }
        }
      }
      const mets = [];
      if (D >= 0) {
        if (view === 'side') {
          const k = med3(D, (j) => kneeOf(F[j]));
          const st = k >= 95 && k <= 145 ? 'good' : k < 95 || k <= 155 ? 'ok' : 'bad';
          mets.push(M('dip', 'ひざの曲げ（しずむとき）', Math.round(k) + '°', st,
            st === 'good' ? 'ひざをしっかり曲げて、足の力を使えています。' : k < 95 ? '深く曲げすぎかもしれません。深すぎると、打つまでがおそくなります。' : 'ひざの曲げが浅めです。腕だけで打っているかも。ひざを曲げて、のばす力で打ちましょう。',
            { at: D, links: ['v-shoot-base', 'v-shoot-rhythm', 'd-formshoot'] }));
        } else {
          const drop = startH - F[D].hipH;
          const st = hv(drop, 0.07, 0.035);
          mets.push(M('dip', 'しずみこみ（腰が下がる量）', Math.round(drop * 100) + '%', st,
            st === 'good' ? 'ひざを曲げて しずみ、足の力を使えています。' : 'しずみこみが小さめです。ひざを曲げて、のばす力で打ちましょう。',
            { at: D, links: ['v-shoot-base', 'v-shoot-rhythm', 'd-formshoot'] }));
        }
      }
      if (S >= 0 && view === 'side') {
        const e = med3(S, E);
        const st = e >= 55 && e <= 115 ? 'good' : e < 55 || e <= 135 ? 'ok' : 'bad';
        mets.push(M('set', 'セットのひじ（L字）', Math.round(e) + '°', st,
          st === 'good' ? 'ひじが L字（90°くらい）で、きれいに構えられています。' : e < 55 ? 'ひじを曲げすぎかも。ボールを頭のうしろに引きすぎないように。' : 'ひじがのびぎみです。L字に曲げて、ボールをおでこの前に。',
          { at: S, links: ['v-shoot-hold', 'd-formshoot', 'd-lyingshoot'] }));
      }
      {
        const e = med3(R, E);
        const st = hv(e, 150, 135);
        mets.push(M('release', 'はなすときの腕', Math.round(e) + '°', st,
          st === 'good' ? '腕をまっすぐのばしきって、はなせています。' : '腕がのびきる前にはなしています。リングに向かって、腕をのばしきりましょう。',
          { at: R, links: ['v-shoot-release', 'd-formshoot'] }));
      }
      {
        // フォロースルー：はなしたあと、手首が頭より上にのこっている時間
        let k = 0;
        for (const i of range(n, R, R + s(1))) { if (F[i] && W(i) > F[i].headH) k++; else if (F[i]) break; }
        const sec = k / fps;
        const st = hv(sec, 0.35, 0.2);
        mets.push(M('follow', 'フォロースルー', sec.toFixed(1) + '秒', st,
          st === 'good' ? 'はなしたあとも手をのこせています（フォロースルー）。' : '手をすぐに下ろしています。入るまで、手首をたおしたまま止めておきましょう。',
          { at: Math.min(n - 1, R + Math.max(1, k)), links: ['v-shoot-release'] }));
      }
      if (view === 'side' && D >= 0 && Ld > D) {
        const drift = (F[Ld].hipX - F[D].hipX) * (F[D].face || 1);
        const st = lv(Math.abs(drift), 0.25, 0.4);
        mets.push(M('drift', 'まっすぐ跳べているか', (drift >= 0 ? '前へ ' : 'うしろへ ') + Math.abs(drift * 100).toFixed(0) + '%', st,
          st === 'good' ? 'とんだ場所と同じあたりに着地できています。' : drift > 0 ? '前へ流れています。真上にとぶと、ねらいが安定します。' : 'うしろへ下がっています。まずは真上にとぶ形で。',
          { at: Ld, links: ['v-shoot-base', 'd-formshoot'], note: '脚の長さを 100% としたときの、ずれ' }));
      }
      if (P >= 0 && D >= 0 && F[P].hipH - startH > 0.05) {
        // てっぺんの少し前〜すぐあと（-0.2〜+0.1秒）なら よい。0.2秒より あとは「落ちながら」
        const dt = F[R].t - topT;
        const st = dt >= -0.2 && dt <= 0.1 ? 'good' : dt > 0.2 ? 'bad' : 'ok';
        mets.push(M('timing', 'はなすタイミング', dt >= 0 ? `てっぺんの ${dt.toFixed(2)}秒あと` : `てっぺんの ${(-dt).toFixed(2)}秒まえ`, st,
          st === 'good' ? 'ジャンプのいちばん高いところで、はなせています。' : dt > 0 ? '落ちながらはなしています。もう少し早く、てっぺんではなしましょう。' : '上がりながらはなしています（近い距離なら OK）。遠いときは、てっぺんで。',
          { at: R, links: ['v-shoot-rhythm'] }));
      }
      base.metrics = mets;
      base.keys = [D >= 0 && { label: 'しずむ', i: D }, S >= 0 && { label: 'セット', i: S }, { label: 'はなす', i: R }, Ld >= 0 && { label: '着地', i: Ld }].filter(Boolean);
      base.hand = hand;
      return base;
    }

    function dribble() {
      const sr = std(F.map((f) => f && f.wrist.r)), sl = std(F.map((f) => f && f.wrist.l));
      const hand = sr >= sl ? 'r' : 'l';
      const w = F.map((f) => f && f.wrist[hand]);
      // ドリブルの回数：手首の上下（いちばん下を数える）
      const mins = [];
      for (let i = 1; i < n - 1; i++) {
        if (w[i] == null || w[i - 1] == null || w[i + 1] == null) continue;
        if (w[i] <= w[i - 1] && w[i] < w[i + 1]) {
          const lo = Math.max(...range(n, i - s(0.25), i + s(0.25)).map((j) => w[j]).filter((x) => x != null));
          if (lo - w[i] > 0.05 && (!mins.length || i - mins[mins.length - 1] >= s(0.18))) mins.push(i);
        }
      }
      const hip = median(F.map((f) => f && f.hipH));
      const mets = [];
      {
        const st = lv(hip, 0.86, 0.92);
        mets.push(M('low', '腰の低さ', Math.round(hip * 100) + '%', st,
          st === 'good' ? '腰を落として、低い姿勢でつけています。' : st === 'ok' ? 'もう少し腰を落とすと、取られにくくなります。' : '腰が高く、立ったままついています。ひざを曲げて、おしりを少しうしろへ。',
          { links: ['v-drb-low', 'd-pound', 'd-protect'], note: '脚の長さを 100% としたときの腰の高さ（まっすぐ立つと 100% くらい）' }));
      }
      {
        const down = F.filter((f) => f && f.pitch > 42).length / Math.max(1, F.filter(Boolean).length);
        const st = lv(down, 0.2, 0.5);
        mets.push(M('eyes', '顔が上がっているか', `下を見ている時間 ${Math.round(down * 100)}%`, st,
          st === 'good' ? '顔を上げて、前を見られています。' : 'ボール（下）を見ている時間が長めです。手の感覚でつけるように、前を見る練習を。',
          { links: ['v-drb-eyes', 'd-headup', 'd-tennisball'] }));
      }
      {
        const bob = std(F.map((f) => f && f.headH));
        const st = lv(bob, 0.02, 0.035);
        mets.push(M('head', '頭の高さ', st === 'good' ? '変わらない' : st === 'ok' ? '少し上下' : '上下に動く', st,
          st === 'good' ? '頭の高さが変わらず、安定しています。' : '頭が上下に動いています。ひざで高さを保つと、次の動きにすぐ移れます。',
          { links: ['v-drb-low', 'd-pound'] }));
      }
      if (mins.length >= 2) {
        const tops = [];
        for (let k = 0; k < mins.length - 1; k++) { const j = argBy(range(n, mins[k], mins[k + 1]), F, (f) => f.wrist[hand], (a, b) => a > b); if (j >= 0) tops.push(F[j].wrist[hand] - F[j].hipH); }
        const top = median(tops);
        const st = lv(top, -0.02, 0.08);
        mets.push(M('height', 'ドリブルの高さ', top <= 0 ? '腰より低い' : '腰より高い', st,
          st === 'good' ? 'ボールを腰より低いところでつけています。' : 'ボールが高めです。腰より低いところで、強くつきましょう。',
          { links: ['v-drb-low', 'd-pound'] }));
        const dur = (mins[mins.length - 1] - mins[0]) / fps;
        if (dur > 0) mets.push(M('tempo', 'ドリブルの速さ', ((mins.length - 1) / dur).toFixed(1) + '回/秒', 'na', `調べた間に ${mins.length} 回つきました（目安）。`, { links: ['d-pound'] }));
      }
      base.metrics = mets;
      base.keys = mins.slice(0, 6).map((i, k) => ({ label: `${k + 1}回目`, i }));
      base.hand = hand;
      return base;
    }

    function defense() {
      const hip = median(F.map((f) => f && f.hipH));
      const mets = [];
      {
        const st = lv(hip, 0.84, 0.9);
        mets.push(M('low', '腰の低さ', Math.round(hip * 100) + '%', st,
          st === 'good' ? '腰を落とした、低い構えができています。' : st === 'ok' ? 'もう少し腰を落とすと、横の動きが速くなります。' : '腰が高いです。ひざを曲げて、いすにすわるように腰を落としましょう。',
          { links: ['v-def-stance', 'd-stance'], note: '脚の長さを 100% としたときの腰の高さ（まっすぐ立つと 100% くらい）' }));
      }
      if (view === 'front') {
        const wid = median(F.map((f) => f && f.stanceW));
        const st = hv(wid, 1.35, 1.1);
        mets.push(M('wide', '足の幅', `肩幅の ${wid.toFixed(1)}倍`, st,
          st === 'good' ? '足を広く開いて、安定しています。' : '足の幅がせまめです。肩幅より広く開くと、バランスがよくなります。',
          { links: ['v-def-stance', 'v-def-feet', 'd-stance'] }));
        // 足の交差（左右の足首の順番が入れかわる。2コマ以上つづいたら1回）
        const ord = F.map((f) => f && f.ankOrder);
        const base0 = median(ord);
        let cross = 0, run = 0;
        for (const o of ord) { if (o != null && o !== base0 && o !== 0) { run++; if (run === 2) cross++; } else run = 0; }
        const st2 = cross === 0 ? 'good' : cross <= 1 ? 'ok' : 'bad';
        mets.push(M('cross', '足が交差していないか', `${cross}回`, st2,
          st2 === 'good' ? '足を交差させずに、スライドできています。' : '足が交差した場面があります。「出す足 → 寄せる足」で、交差させずに動きましょう。',
          { links: ['v-def-feet', 'd-zigzag-d'] }));
      }
      {
        const bob = std(F.map((f) => f && f.headH));
        const st = lv(bob, 0.02, 0.035);
        mets.push(M('head', '頭の高さ（上下にはねない）', st === 'good' ? '変わらない' : st === 'ok' ? '少し上下' : '上下に動く', st,
          st === 'good' ? '頭の高さが変わらず、低いまま動けています。' : '動くたびに頭が上下しています。ひざを曲げたまま、すべるように動きましょう。',
          { links: ['v-def-feet', 'd-stance'] }));
      }
      base.metrics = mets;
      const lowI = argBy(range(n, 0, n - 1), F, (f) => f.hipH, (a, b) => a < b);
      const highI = argBy(range(n, 0, n - 1), F, (f) => f.headH, (a, b) => a > b);
      base.keys = [lowI >= 0 && { label: 'いちばん低い', i: lowI }, highI >= 0 && { label: 'いちばん高い', i: highI }].filter(Boolean);
      return base;
    }

    function landing() {
      // 空中：両方の足首が床から上がっている（2コマ以上）
      const air = F.map((f) => !!f && Math.min(f.ankH.l, f.ankH.r) > 0.08);
      let seg0 = -1, seg1 = -1;
      for (let i = 0; i < n; i++) {
        if (air[i] && seg0 < 0) seg0 = i;
        if (seg0 >= 0 && !air[i]) { if (i - seg0 >= 2) { seg1 = i; break; } seg0 = -1; }
      }
      if (seg0 < 0 || seg1 < 0) return Object.assign(base, { ok: false, msg: 'ジャンプ（両足が床からはなれる）が見つかりませんでした。ジャンプして着地するところまで、体ぜんぶが映る動画にしてください。' });
      const Ld = seg1;
      const after = range(n, Ld, Ld + s(0.6));
      const lowI = argBy(after, F, (f) => f.hipH, (a, b) => a < b);
      const ground = F.filter((f, i) => f && !air[i] && i < seg0);
      const standH = pct((ground.length >= 3 ? ground : F.filter((f, i) => f && !air[i])).map((f) => f.hipH), 0.8);
      const mets = [];
      if (view === 'side') {
        const flexI = argBy(after, F, kneeOf, (a, b) => a < b);
        if (flexI >= 0) {
          const k = kneeOf(F[flexI]);
          const st = lv(k, 125, 145);
          mets.push(M('flex', 'ひざで吸収', Math.round(k) + '°', st,
            st === 'good' ? '着地でひざをしっかり曲げて、衝撃を吸収できています。' : 'ひざがのびたまま着地しています。つま先から着地して、ひざと股関節を曲げましょう。',
            { at: flexI, links: ['v-body-injury', 'd-landing'] }));
        }
      } else if (lowI >= 0) {
        const drop = standH - F[lowI].hipH;
        const st = hv(drop, 0.18, 0.1);
        mets.push(M('flex', 'ひざで吸収（腰が下がる量）', Math.round(drop * 100) + '%', st,
          st === 'good' ? '着地でひざを曲げて、しっかり しずめています。' : 'ひざがのびたまま着地しています。つま先から着地して、ひざと股関節を曲げましょう。',
          { at: lowI, links: ['v-body-injury', 'd-landing'], note: '脚の長さを 100% としたときの、腰が下がった量' }));
      }
      if (view === 'front') {
        const win = range(n, Ld, Ld + s(0.4));
        const vi = argBy(win, F, (f) => Math.max(f.fppaL, f.fppaR), (a, b) => a > b);
        if (vi >= 0) {
          const v = Math.max(F[vi].fppaL, F[vi].fppaR);
          const st = lv(v, 10, 18);
          mets.push(M('knee-in', 'ひざが内に入らないか', st === 'good' ? '入っていない' : `内へ ${Math.round(v)}°`, st,
            st === 'good' ? 'ひざとつま先が同じ向きで、着地できています。' : '着地のとき、ひざが内側に入っています（ケガをしやすい形）。ひざをつま先と同じ向きに。',
            { at: vi, links: ['v-body-injury', 'd-landing'] }));
        }
        if (lowI >= 0) {
          const tilt = Math.abs(F[lowI].lean);
          const st = lv(tilt, 8, 15);
          mets.push(M('sym', '体が横にかたむかないか', `${Math.round(tilt)}°`, st,
            st === 'good' ? '左右の足で、まっすぐ着地できています。' : '着地で体が横にかたむいています。両足に同じように体重をのせましょう。',
            { at: lowI, links: ['v-body-injury', 'd-landing'] }));
        }
      }
      base.metrics = mets;
      base.keys = [{ label: 'とぶ', i: Math.max(0, seg0 - 1) }, { label: '着地', i: Ld }, lowI >= 0 && { label: 'いちばん低い', i: lowI }].filter(Boolean);
      return base;
    }
  };
  // 点数（◎ を 2、○ を 1 で、100 点に）
  BA.score = (metrics) => {
    const ms = metrics.filter((m) => m.status !== 'na');
    if (!ms.length) return null;
    return Math.round((100 * ms.reduce((t, m) => t + (m.status === 'good' ? 2 : m.status === 'ok' ? 1 : 0), 0)) / (ms.length * 2));
  };

  /* ---------- コートの位置（ホモグラフィー） ----------
     src：画面の4点 [[x,y]…]、dst：コートの4点（m）。返す：3×3 の行列（9つの数） */
  BA.homography = function (src, dst) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    const h = solve(A, b);
    return h ? [...h, 1] : null;
  };
  BA.applyH = (H, p) => {
    const w = H[6] * p[0] + H[7] * p[1] + H[8];
    return [(H[0] * p[0] + H[1] * p[1] + H[2]) / w, (H[3] * p[0] + H[4] * p[1] + H[5]) / w];
  };
  BA.invertH = (H) => {
    const [a, b, c, d, e, f, g, h, i] = H;
    const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
    const det = a * A + b * B + c * C;
    if (!det) return null;
    const r = [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((x) => x / det);
    return r.map((x) => x / r[8]);
  };
  function solve(A, b) {
    const n = b.length;
    const M2 = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M2[r][c]) > Math.abs(M2[p][c])) p = r;
      if (Math.abs(M2[p][c]) < 1e-12) return null;
      [M2[c], M2[p]] = [M2[p], M2[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M2[r][c] / M2[c][c];
        for (let k = c; k <= n; k++) M2[r][k] -= f * M2[c][k];
      }
    }
    return M2.map((r, i) => r[n] / r[i]);
  }
  // タップする4点のえらび方（コートの位置。ゴールが上、エンドラインが y=0）
  BA.CALIB = {
    paint: { name: 'ペイント（制限区域）の4つの角', pts: [[-2.45, 0], [2.45, 0], [2.45, 5.8], [-2.45, 5.8]], labels: ['エンドラインとペイントの角（左）', 'エンドラインとペイントの角（右）', 'フリースローラインの右はし', 'フリースローラインの左はし'] },
    half: { name: 'ハーフコートの4つの角', pts: [[-7.5, 0], [7.5, 0], [7.5, 14], [-7.5, 14]], labels: ['エンドラインの左はし（コーナー）', 'エンドラインの右はし（コーナー）', 'センターラインの右はし', 'センターラインの左はし'] },
  };

  /* ---------- 色 ---------- */
  const lab = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const R = f(r), G = f(g), B = f(b);
    let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, y = R * 0.2126 + G * 0.7152 + B * 0.0722, z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const g3 = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    x = g3(x); y = g3(y); z = g3(z);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };
  BA.lab = lab;
  BA.colorDist = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  // 色を、近いチームに（どちらからも遠ければ -1）
  BA.classify = (rgb, teams, max = 40) => {
    let bi = -1, bd = Infinity;
    teams.forEach((c, i) => { if (!c) return; const d = BA.colorDist(rgb, c); if (d < bd) { bd = d; bi = i; } });
    return bd <= max ? bi : -1;
  };
  // 2つの色に分ける（k 平均）。teams を決めないとき
  BA.cluster2 = (cols) => {
    if (cols.length < 2) return null;
    const L = cols.map(lab);
    let c = [L[0], L.reduce((best, p) => (Math.hypot(...p.map((v, k) => v - L[0][k])) > Math.hypot(...best.map((v, k) => v - L[0][k])) ? p : best), L[0])];
    for (let it = 0; it < 12; it++) {
      const sum = [[0, 0, 0, 0], [0, 0, 0, 0]];
      for (const p of L) {
        const k = Math.hypot(...p.map((v, j) => v - c[0][j])) <= Math.hypot(...p.map((v, j) => v - c[1][j])) ? 0 : 1;
        sum[k][0] += p[0]; sum[k][1] += p[1]; sum[k][2] += p[2]; sum[k][3]++;
      }
      c = sum.map((s, k) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : c[k]));
    }
    // 代表の色（rgb）：それぞれのグループで、中心にいちばん近い色
    return c.map((cc) => cols.reduce((best, col) => { const p = lab(col); const d = Math.hypot(p[0] - cc[0], p[1] - cc[1], p[2] - cc[2]); return d < best.d ? { d, col } : best; }, { d: Infinity, col: null }).col);
  };

  /* ---------- チームの動き ----------
     frames：[{ t, people: [{ x, y（コートの m）, team（0・1・-1）}] }]
     返す：{ teams: [{ spacing, paint3, corners, crowd, n }], perFrame, heat, findings } */
  const PAINT = (p) => Math.abs(p.x) <= 2.45 && p.y >= 0 && p.y <= 5.8;
  const CORNER = (p) => Math.abs(p.x) >= 5.2 && p.y <= 3.2;
  const WING = (p) => Math.abs(p.x) >= 4.2 && p.y > 3.2 && p.y <= 9;
  BA.zones = { PAINT, CORNER, WING };
  BA.teamAnalyze = function (frames, opt = {}) {
    const teamsN = opt.teams || 2;
    const per = frames.map((fr) => {
      const out = { t: fr.t, team: [] };
      for (let k = 0; k < teamsN; k++) {
        const ps = fr.people.filter((p) => p.team === k);
        const near = ps.map((p) => Math.min(...ps.filter((q) => q !== p).map((q) => Math.hypot(p.x - q.x, p.y - q.y))));
        const cx = ps.reduce((s, p) => s + p.x, 0) / (ps.length || 1), cy = ps.reduce((s, p) => s + p.y, 0) / (ps.length || 1);
        // 2.5m の中に3人以上（だんご）
        let crowd = false;
        for (const p of ps) if (ps.filter((q) => Math.hypot(p.x - q.x, p.y - q.y) <= 2.5).length >= 3) crowd = true;
        out.team.push({
          n: ps.length,
          spacing: ps.length >= 3 ? median(near) : null,
          spread: ps.length >= 3 ? ps.reduce((s, p) => s + Math.hypot(p.x - cx, p.y - cy), 0) / ps.length : null,
          paint: ps.filter(PAINT).length,
          corner: ps.some(CORNER),
          crowd: ps.length >= 3 && crowd,
          cy: ps.length ? cy : null,
        });
      }
      return out;
    });
    // ヒートマップ（1m のマス。x -7.5〜7.5、y 0〜14）
    const heat = [];
    for (let k = 0; k < teamsN; k++) {
      const g = Array.from({ length: 14 }, () => new Array(15).fill(0));
      for (const fr of frames) for (const p of fr.people) if (p.team === k && p.x >= -7.5 && p.x < 7.5 && p.y >= 0 && p.y < 14) g[Math.floor(p.y)][Math.floor(p.x + 7.5)]++;
      heat.push(g);
    }
    const teams = [];
    for (let k = 0; k < teamsN; k++) {
      const use = per.filter((f) => f.team[k].n >= 3);
      const m = use.length || 1;
      teams.push({
        frames: use.length,
        n: median(per.map((f) => f.team[k].n)),
        spacing: median(use.map((f) => f.team[k].spacing)),
        spread: median(use.map((f) => f.team[k].spread)),
        paint3: use.filter((f) => f.team[k].paint >= 3).length / m,
        corners: use.filter((f) => f.team[k].corner).length / m,
        crowd: use.filter((f) => f.team[k].crowd).length / m,
        depth: median(use.map((f) => f.team[k].cy)),
      });
    }
    return { teams, perFrame: per, heat };
  };
  /* コートの点を、コマからコマへ つなぐ（動きのあと用）。同じチームで近い人どうし（maxJump m まで）。
     見失っても 2コマまでは待つ。frames の people に id を書きこんで返す */
  BA.courtTrack = function (frames, maxJump = 2.4) {
    let next = 1;
    let active = []; // { id, x, y, team, age }
    for (const fr of frames) {
      const pairs = [];
      fr.people.forEach((p, j) => active.forEach((q, i) => {
        if (p.team !== q.team) return;
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d <= maxJump * (1 + q.age * 0.5)) pairs.push([d, i, j]);
      }));
      pairs.sort((a, b) => a[0] - b[0]);
      const ua = new Set(), uc = new Set();
      for (const [, i, j] of pairs) {
        if (ua.has(i) || uc.has(j)) continue;
        ua.add(i); uc.add(j);
        fr.people[j].id = active[i].id;
      }
      const keep = active.filter((q, i) => !ua.has(i) && q.age < 2).map((q) => Object.assign({}, q, { age: q.age + 1 }));
      fr.people.forEach((p) => { if (p.id == null) p.id = next++; });
      active = fr.people.map((p) => ({ id: p.id, x: p.x, y: p.y, team: p.team, age: 0 })).concat(keep);
    }
    return frames;
  };

  // チームの「見つけたこと」（攻めのとき・守りのとき）
  BA.teamFindings = function (tm, side = 'offense') {
    const out = [];
    if (!tm || tm.frames < 3) return [{ status: 'na', label: 'しらべる量', msg: '3人以上が映っているコマが少なく、はかれませんでした。コートの半分が映るように、高い所から固定してとってみてください。' }];
    if (side === 'offense') {
      const sp = tm.spacing;
      out.push(sp >= 3.6 ? { key: 'spacing', status: 'good', label: '広がり（となりの味方との間）', value: sp.toFixed(1) + 'm', msg: '味方どうしの間が広く、スペースを使えています。', links: ['v-off-space', 't-5out'] }
        : sp >= 2.8 ? { key: 'spacing', status: 'ok', label: '広がり（となりの味方との間）', value: sp.toFixed(1) + 'm', msg: 'もう少し広がると、ドライブやパスのコースができます（目安 4m くらい）。', links: ['v-off-space', 'i-spacing', 'd-drive-spacing'] }
          : { key: 'spacing', status: 'bad', label: '広がり（となりの味方との間）', value: sp.toFixed(1) + 'm', msg: '味方どうしが近く、混みやすい形です。3P ラインの外のコーナー・ウイングに広がりましょう。', links: ['i-spacing', 'v-off-space', 'd-drive-spacing', 't-5out'] });
      const p3 = tm.paint3;
      out.push(p3 <= 0.1 ? { key: 'paint', status: 'good', label: 'ペイントの人数', value: `3人以上の時間 ${Math.round(p3 * 100)}%`, msg: 'ペイント（ゴール下）に人が集まりすぎず、ドライブのスペースがあります。', links: ['v-to-space'] }
        : p3 <= 0.3 ? { key: 'paint', status: 'ok', label: 'ペイントの人数', value: `3人以上の時間 ${Math.round(p3 * 100)}%`, msg: 'ときどきペイントに人が集まっています。ゴール下は2人までを目安に。', links: ['i-spacing', 'v-to-space'] }
          : { key: 'paint', status: 'bad', label: 'ペイントの人数', value: `3人以上の時間 ${Math.round(p3 * 100)}%`, msg: 'ペイントに人が集まりすぎています。ボールを持っていない人は外へ広がりましょう。', links: ['i-spacing', 'v-to-space', 'd-drive-spacing'] });
      const c = tm.corners;
      out.push(c >= 0.5 ? { key: 'corner', status: 'good', label: 'コーナーを使えているか', value: `${Math.round(c * 100)}%`, msg: 'コーナーに人がいて、コートの幅を使えています。', links: ['t-5out'] }
        : c >= 0.25 ? { key: 'corner', status: 'ok', label: 'コーナーを使えているか', value: `${Math.round(c * 100)}%`, msg: 'コーナーが空いている時間があります。コーナーに1人いると、守りが広がります。', links: ['t-5out', 'v-off-space'] }
          : { key: 'corner', status: 'bad', label: 'コーナーを使えているか', value: `${Math.round(c * 100)}%`, msg: 'コーナーがほとんど空いています。コーナーに立つと、ドライブとキックアウトが生まれます。', links: ['t-5out', 'v-off-space', 'd-kickout'] });
      if (tm.crowd > 0.25) out.push({ key: 'crowd', status: tm.crowd > 0.45 ? 'bad' : 'ok', label: '集まりすぎ（だんご）', value: `${Math.round(tm.crowd * 100)}%`, msg: '2.5m の中に3人以上いる場面があります。ボールに寄りすぎていないか見てみましょう。', links: ['i-spacing'] });
    } else {
      const sp = tm.spread;
      out.push(sp <= 3.2 ? { key: 'compact', status: 'good', label: 'まとまり（真ん中からの近さ）', value: sp.toFixed(1) + 'm', msg: '守りがまとまっていて、ヘルプに行きやすい形です。', links: ['v-dt-position', 't-help'] }
        : sp <= 4.2 ? { key: 'compact', status: 'ok', label: 'まとまり（真ん中からの近さ）', value: sp.toFixed(1) + 'm', msg: 'ボールと反対側の人は、もう少しペイント寄りに立つと、ヘルプが間に合います。', links: ['v-dt-position', 'v-dt-help'] }
          : { key: 'compact', status: 'bad', label: 'まとまり（真ん中からの近さ）', value: sp.toFixed(1) + 'm', msg: '守りが広がりすぎています。自分のマークだけでなく、ボールも見てペイントを守りましょう。', links: ['v-dt-position', 'v-dt-help', 'i-help'] });
      const p = tm.paint3;
      out.push({ key: 'paintd', status: p >= 0.15 ? 'good' : 'ok', label: 'ペイントを守る人数', value: `3人以上の時間 ${Math.round(p * 100)}%`, msg: p >= 0.15 ? 'ゴール下（ペイント）を守る人がいます。' : 'ゴール下（ペイント）が空きやすいかもしれません。ボールと反対側の人がペイントへ。', links: ['v-dt-help'] });
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
