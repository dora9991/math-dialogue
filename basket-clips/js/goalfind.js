/* バスケ得点クリップ — ゴールの自動検出
   動画から間をあけて取り出した数十コマの中から、ゴール（リング＋ネット）を探して、
   人が指定するのと同じ「ゴールの指定」（バックボードのあたりの枠・リングの両端）を作る。
   手がかりは、どの向きから撮っても変わらないものだけにしてある（ゴールの裏から撮っても使える）：
   1) リング：オレンジ〜赤の、細い輪（横長の楕円）。中まで塗りつぶされた物（ボール・ユニフォーム・得点板の数字）や、
      大きな面（ステージの幕）は、形で外れる
   2) ネット：リングの真下に、白い網目（明るく色のない細い線が、まわりより多い）
   3) 同じゴールは、何コマにも同じ見た目で映る。見た目（リングのまわりの模様）が似たものを1つにまとめ、
      よく映るもの2つを「ゴール」とする
   DOM に依存しない（node のテストからも同じコードを使う）。画像は RGBA（canvas の getImageData と同じ並び）。 */
(function (root) {
  'use strict';
  const BS = root.BS;
  const V = BS.vision;

  const NS = 40;                                   // 楕円の上に取る点の数
  const COS = [], SIN = [];
  for (let i = 0; i < NS; i++) { COS.push(Math.cos(2 * Math.PI * i / NS)); SIN.push(Math.sin(2 * Math.PI * i / NS)); }
  const W_MIN = 16;                                // 見つけるリングの幅（画素）の下限（これより小さいと、そもそも得点を見分けにくい）
  const W_MAX_FR = 0.3;                            // 上限（画面の幅に対する割合）
  const TH_FRAME = 0.8;                            // 1コマの中で「リングらしい」とする点数の下限
  const DESC = 24;                                 // 見た目の比較に使う小さな画像（DESC×DESC）
  const TH_SAME = 0.55;                            // 見た目の一致がこれ以上なら同じゴール

  /* リングらしい色の画素を 1 にする。
     オレンジの強さ o = r −（g+b）/2 が十分あり（塗装のリングは 150〜190。木の床・肌は 60〜80）、色相がオレンジ（赤すぎない：
     ユニフォーム・ステージの幕・得点板の数字の赤は外す）で、しかも、まわり（15 画素四方）の平均より、はっきりオレンジが強い所だけ。
     まわりより強いことを求めるのは、オレンジがかった木の床や、赤茶色の床の前にリングがあるとき、床ごと1つの塊にならないようにするため */
  function rimColorMask(rgba, w, h, out) {
    const n = w * h;
    const o = new Float32Array(n);
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const r = rgba[p], g = rgba[p + 1], b = rgba[p + 2];
      let v = r - (g + b) / 2;
      if (v > 0 && r >= g && r >= b) {
        const mn = g < b ? g : b, c = r - mn;
        const hq = c > 0 ? (g - b) / c : 0;      // 0＝赤、1＝黄（色相 60°）
        if (hq < 0.15 || hq > 0.62) v *= 0.3;
      } else v = 0;
      o[i] = v;
    }
    // 15×15 の平均（積分画像）
    const R = 7, ii = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) { row += o[y * w + x]; ii[(y + 1) * (w + 1) + x + 1] = ii[y * (w + 1) + x + 1] + row; }
    }
    const m = out || new Uint8Array(n);
    for (let y = 0; y < h; y++) {
      const y0 = y - R < 0 ? 0 : y - R, y1 = y + R + 1 > h ? h : y + R + 1;
      for (let x = 0; x < w; x++) {
        const i = y * w + x, v = o[i];
        if (v < 85) { m[i] = 0; continue; }
        const x0 = x - R < 0 ? 0 : x - R, x1 = x + R + 1 > w ? w : x + R + 1;
        const sum = ii[y1 * (w + 1) + x1] - ii[y0 * (w + 1) + x1] - ii[y1 * (w + 1) + x0] + ii[y0 * (w + 1) + x0];
        m[i] = v - sum / ((x1 - x0) * (y1 - y0)) >= 25 ? 1 : 0;
      }
    }
    return m;
  }
  /* 1画素ふくらませる（細い輪の切れ目をつなぐ。楕円の上の点の判定に少しゆとりを持たせる） */
  function dilate(m, w, h, out) {
    const o = out || new Uint8Array(w * h);
    o.fill(0);
    for (let y = 0; y < h; y++) {
      const y0 = y > 0 ? y - 1 : 0, y1 = y < h - 1 ? y + 1 : h - 1;
      for (let x = 0; x < w; x++) {
        if (!m[y * w + x]) continue;
        const x0 = x > 0 ? x - 1 : 0, x1 = x < w - 1 ? x + 1 : w - 1;
        for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) o[yy * w + xx] = 1;
      }
    }
    return o;
  }
  /* 楕円（中心 cx,cy・横の半径 a・縦の半径 b）の上の点のうち、マスクが 1 の割合。画面の外の点が多いと 0 */
  function onFrac(mask, w, h, cx, cy, a, b) {
    let n = 0, on = 0;
    for (let i = 0; i < NS; i++) {
      const x = Math.round(cx + a * COS[i]), y = Math.round(cy + b * SIN[i]);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      n++; on += mask[y * w + x];
    }
    return n >= NS * 0.6 ? on / n : 0;
  }
  /* 輪らしさ：楕円の上は細いリングの色（ゆとりあり）、内側と外側はリングの色でない */
  function ringScore(O, D, w, h, cx, cy, a, b) {
    const on = onFrac(D, w, h, cx, cy, a, b);
    if (on < 0.4) return { score: on - 1, on, inside: 0, outside: 0 };
    const out = onFrac(O, w, h, cx, cy, a * 1.3 + 2, b * 1.4 + 3);
    // 内側：つぶれた楕円（縦の半径が小さい）では、内側の点がすぐ輪にかかるので、縦に余裕があるときだけ調べる
    const inside = b >= 4 ? onFrac(O, w, h, cx, cy, Math.max(1, a * 0.55 - 1), Math.max(1, b * 0.5 - 1.5)) : 0;
    return { score: on - 0.8 * inside - 0.8 * out, on, inside, outside: out };
  }
  const lum = (d, p) => (d[p] * 2 + d[p + 1] * 5 + d[p + 2]) >> 3;
  /* ネットらしさ：楕円の下端から、リング幅の 0.8 倍の高さ（下ほど細い）に、白っぽい画素と、左右より明るい細い線が、
     その左右の同じ高さ（リングの外側）より多いか */
  function netScore(rgba, w, h, cx, cy, a, b) {
    const y0 = Math.round(cy + b + 1), y1 = Math.round(cy + b + 1 + 1.6 * a);
    let nIn = 0, whIn = 0, lnIn = 0, nOut = 0, whOut = 0, lnOut = 0;
    const step = a > 30 ? 2 : 1;
    for (let y = y0; y <= y1; y += step) {
      if (y < 1 || y >= h - 1) continue;
      const f = (y - y0) / Math.max(1, y1 - y0);
      const half = a * (0.85 - 0.3 * f);
      const xa = Math.max(1, Math.round(cx - 2.2 * a)), xb = Math.min(w - 2, Math.round(cx + 2.2 * a));
      for (let x = xa; x <= xb; x += step) {
        const dx = Math.abs(x - cx);
        const inNet = dx <= half, side = dx >= a * 1.15;
        if (!inNet && !side) continue;
        const p = (y * w + x) * 4;
        const r = rgba[p], g = rgba[p + 1], bb = rgba[p + 2];
        const mx = r > g ? (r > bb ? r : bb) : (g > bb ? g : bb), mn = r < g ? (r < bb ? r : bb) : (g < bb ? g : bb);
        const white = mn >= 150 && mx - mn <= 45 ? 1 : 0;
        const c = lum(rgba, p), l = lum(rgba, p - 4), rr = lum(rgba, p + 4);
        const line = c - (l + rr) / 2 >= 10 && mx - mn <= 60 ? 1 : 0;
        if (inNet) { nIn++; whIn += white; lnIn += line; } else { nOut++; whOut += white; lnOut += line; }
      }
    }
    if (nIn < 6 || nOut < 6) return 0;
    return (whIn / nIn - whOut / nOut) + 1.5 * (lnIn / nIn - lnOut / nOut);
  }

  /* 4点を通る、傾いていない楕円（A x² + B y² + C x + D y = 1）。中心・半径に直して返す（作れないときは null） */
  function ellipse4(px, py) {
    // 数値を安定させるため、1点目を原点にずらしてから解く
    const ox = px[0], oy = py[0];
    const M = [];
    for (let i = 0; i < 4; i++) { const x = px[i] - ox + 0.5, y = py[i] - oy + 0.5; M.push([x * x, y * y, x, y, 1]); }
    for (let c = 0; c < 4; c++) {
      let piv = c;
      for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (Math.abs(M[piv][c]) < 1e-9) return null;
      const t = M[c]; M[c] = M[piv]; M[piv] = t;
      for (let r = 0; r < 4; r++) {
        if (r === c) continue;
        const f = M[r][c] / M[c][c];
        for (let k = c; k < 5; k++) M[r][k] -= f * M[c][k];
      }
    }
    const A = M[0][4] / M[0][0], B = M[1][4] / M[1][1], C = M[2][4] / M[2][2], D = M[3][4] / M[3][3];
    if (!(A > 0 && B > 0)) return null;
    const cx = -C / (2 * A), cy = -D / (2 * B);
    const k = 1 + A * cx * cx + B * cy * cy;
    if (k <= 0) return null;
    return { cx: cx + ox - 0.5, cy: cy + oy - 0.5, a: Math.sqrt(k / A), b: Math.sqrt(k / B) };
  }
  /* 当てはめの良さ：輪らしさが同じくらいなら、大きい楕円を選ぶ（輪の一部が金具や人に隠れていると、見えている短い弧だけの
     小さな楕円のほうが輪らしく見えてしまう。大きい楕円は、隠れていない弧のすべてを通るときだけ、点数が上がる） */
  const fitKey = (ring, a) => ring * Math.pow(a, 0.5);
  /* 小さな乱数（毎回同じ結果になるように、決まった種から） */
  function lcg(seed) { let x = seed >>> 0 || 1; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; }

  /* 1コマの中のリングの候補。rgba: w×h。opts.region: {x0,y0,x1,y1}（その範囲だけ探す・タップした所のまわりなど）。
     戻り値: [{ cx, cy, a, b, ring, net, score }]（score の高い順）
     リングの色の塊は、バックボードの赤い四角の線・金具・ボールなどとつながっていることがあるので、塊の外形ではなく、
     塊の中の「横に長く続くリングの色の並び」（輪の手前の弧・奥の弧）から楕円を当てはめる */
  function findRims(rgba, w, h, opts) {
    opts = opts || {};
    const O = rimColorMask(rgba, w, h);
    const D = dilate(O, w, h);
    const R = opts.region;      // 範囲の外へつながる物を、範囲で切って小さく見せないよう、成分は全体で作ってから範囲で選ぶ
    const wMax = Math.max(W_MIN + 4, w * W_MAX_FR);
    const out = [];
    const cc = V.components(D, w, h, 8);
    for (const bl of cc.blobs) {
      const bw = bl.x1 - bl.x0 + 1;
      if (bw < W_MIN || bw > wMax * 1.5 || bl.y1 - bl.y0 + 1 > wMax) continue;
      if (R && (bl.x1 < R.x0 || bl.x0 > R.x1 || bl.y1 < R.y0 || bl.y0 > R.y1)) continue;
      // 横の並び（1画素の切れ目は許す）。同じ位置・長さのものは1つに
      const runs = [], seenRun = new Set();
      for (let y = bl.y0; y <= bl.y1; y++) {
        let x = bl.x0;
        while (x <= bl.x1) {
          while (x <= bl.x1 && !O[y * w + x]) x++;
          if (x > bl.x1) break;
          const xs = x;
          let gap = 0;
          while (x <= bl.x1 && (O[y * w + x] || (gap === 0 && x + 1 <= bl.x1 && O[y * w + x + 1]))) { if (!O[y * w + x]) gap = 1; else gap = 0; x++; }
          const len = x - xs;
          if (len >= Math.max(8, W_MIN * 0.5)) {
            const key = (Math.round((xs + x - 1) / 4)) + ',' + Math.round(len / 3) + ',' + Math.round(y / 2);
            if (!seenRun.has(key)) { seenRun.add(key); runs.push({ x0: xs, x1: x - 1, y }); }
          }
        }
      }
      let best = null;
      for (const r of runs) {
        const L = r.x1 - r.x0 + 1, cx = (r.x0 + r.x1) / 2;
        // 並びは、楕円の上端・下端の弧（ほぼ横幅いっぱい）か、少し内側の弦
        for (const fa of [1, 1.12, 1.3]) {
          const a = Math.max(4, L * fa / 2 - 1);
          if (2 * a < W_MIN - 2 || 2 * a > wMax) continue;
          for (let b = 1; b <= 0.75 * a; b += b < 6 ? 0.75 : 1.5) {
            for (const sgn of [1, -1]) for (let dy = -1; dy <= 1; dy++) {
              const cy = r.y + sgn * b + dy;
              const rs = ringScore(O, D, w, h, cx, cy, a, b);
              if (!best || rs.score > best.ring) best = { cx, cy, a, b, ring: rs.score, on: rs.on };
            }
          }
        }
      }
      // 良い当てはめを上から数個とっておき、最後にネットも見て選ぶ（輪らしさと大きさだけで選ぶと、ボードの線などを含んだ
      // 大きすぎる楕円を選ぶことがある。本物のリングの真下には、ネットがはっきり見える）
      const top = [];
      const keep = (c) => {
        if (top.some((u) => Math.abs(u.cx - c.cx) < 1.5 && Math.abs(u.cy - c.cy) < 1.5 && Math.abs(u.a - c.a) < 1.5)) return;
        top.push(c); top.sort((p, q) => q.key - p.key); if (top.length > 6) top.pop();
      };
      if (best) { best.key = fitKey(best.ring, best.a); keep(best); }
      // 輪の一部が隠れているときのため：まわりのリングの色の点から4点ずつ選んで楕円を作り、いちばん良いものを探す（RANSAC）
      {
        const m = Math.max(bw, 20);
        const X0 = Math.max(0, bl.x0 - m), X1 = Math.min(w - 1, bl.x1 + m), Y0 = Math.max(0, bl.y0 - m), Y1 = Math.min(h - 1, bl.y1 + m);
        const ptsX = [], ptsY = [];
        for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) if (O[y * w + x]) { ptsX.push(x); ptsY.push(y); }
        const n = ptsX.length;
        if (n >= 12 && n <= 20000) {
          const rnd = lcg(bl.x0 * 7919 + bl.y0 * 104729 + n);
          const qx = [0, 0, 0, 0], qy = [0, 0, 0, 0];
          for (let it = 0; it < 500; it++) {
            for (let j = 0; j < 4; j++) { const k = Math.floor(rnd() * n); qx[j] = ptsX[k]; qy[j] = ptsY[k]; }
            const e = ellipse4(qx, qy);
            if (!e || 2 * e.a < W_MIN || 2 * e.a > wMax || e.b > 0.75 * e.a || e.b < 1) continue;
            const rs = ringScore(O, D, w, h, e.cx, e.cy, e.a, e.b);
            if (rs.score < 0.45) continue;
            const key = fitKey(rs.score, e.a);
            keep({ cx: e.cx, cy: e.cy, a: e.a, b: e.b, ring: rs.score, on: rs.on, key });
          }
        }
      }
      if (!top.length) continue;
      for (const c of top) { c.net = netScore(rgba, w, h, c.cx, c.cy, c.a, c.b); c.key2 = (c.ring + 1.5 * Math.max(0, Math.min(0.6, c.net))) * Math.sqrt(c.a); }
      top.sort((p, q) => q.key2 - p.key2);
      best = top[0];
      if (best.ring < 0.45) continue;
      // 仕上げ：中心・半径を少しずつ動かして、良くなる方へ
      for (let pass = 0; pass < 2; pass++) {
        for (const [dx, dy, da, db] of [[1, 0, 0, 0], [-1, 0, 0, 0], [0, 1, 0, 0], [0, -1, 0, 0], [0, 0, 1, 0], [0, 0, -1, 0], [0, 0, 0, 0.75], [0, 0, 0, -0.75], [0, 0, 2, 0], [0, 0, -2, 0]]) {
          const c2 = { cx: best.cx + dx, cy: best.cy + dy, a: best.a + da, b: best.b + db };
          if (c2.b < 1 || c2.b > 0.75 * c2.a || 2 * c2.a < W_MIN) continue;
          const rs = ringScore(O, D, w, h, c2.cx, c2.cy, c2.a, c2.b);
          const key = fitKey(rs.score, c2.a);
          if (rs.score >= 0.45 && key > best.key) best = Object.assign(c2, { ring: rs.score, on: rs.on, key });
        }
      }
      best.net = netScore(rgba, w, h, best.cx, best.cy, best.a, best.b);
      // ネット（白い網目）が見えないものは、リングとみなさない（ボールの縁・服・床の線などを外す）
      if (best.net < 0.15) continue;
      best.score = best.ring + 1.5 * Math.min(0.6, best.net);
      out.push(best);
    }
    out.sort((p, q) => q.score - p.score);
    // 同じリングを別の塊から2回見つけたもの（中心が近く、大きさも近い）は1つに
    const uniq = [];
    for (const c of out) if (!uniq.some((u) => Math.hypot(u.cx - c.cx, u.cy - c.cy) < 0.4 * Math.max(u.a, c.a) && Math.abs(u.a - c.a) < 0.3 * Math.max(u.a, c.a))) uniq.push(c);
    return uniq;
  }

  /* 見た目の比較用の小さな画像：リングを中心に、横 ±1.6w・上 2.2w〜下 1.0w（w＝リング幅）を DESC×DESC のグレーに */
  function descriptor(gray, w, h, c) {
    const rw = 2 * c.a;
    const x0 = c.cx - 1.6 * rw, y0 = c.cy - 2.2 * rw;
    // 2倍の細かさで取り出してから 2×2 で平均（細かい模様のずれに強くする）
    const d2 = V.sampleGray(gray, w, h, x0, y0, 3.2 * rw, 3.2 * rw, DESC * 2, DESC * 2);
    const d = new Float32Array(DESC * DESC);
    for (let y = 0; y < DESC; y++) for (let x = 0; x < DESC; x++) {
      const q = 2 * y * DESC * 2 + 2 * x;
      d[y * DESC + x] = (d2[q] + d2[q + 1] + d2[q + DESC * 2] + d2[q + DESC * 2 + 1]) / 4;
    }
    let s = 0, s2 = 0;
    for (let i = 0; i < d.length; i++) { s += d[i]; s2 += d[i] * d[i]; }
    const n = d.length, m = s / n, sd = Math.sqrt(Math.max(1e-6, s2 / n - m * m));
    const z = new Float32Array(n);
    for (let i = 0; i < n; i++) z[i] = (d[i] - m) / sd;
    return z;
  }
  /* 見た目の一致：少しのずれ（上下左右 2 画素まで。リングの位置・大きさの当てはめは数画素ずれる）を許して、いちばん合うところ */
  function descNcc(p, q) {
    let best = -1;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      let s = 0, n = 0;
      for (let y = 0; y < DESC; y++) {
        const yy = y + dy;
        if (yy < 0 || yy >= DESC) continue;
        for (let x = 0; x < DESC; x++) {
          const xx = x + dx;
          if (xx < 0 || xx >= DESC) continue;
          s += p[y * DESC + x] * q[yy * DESC + xx]; n++;
        }
      }
      if (n && s / n > best) best = s / n;
    }
    return best;
  }

  /* 1コマを調べて、候補（見た目の比較用の画像つき）を返す。t: 時刻（秒） */
  function scanFrame(rgba, w, h, t, opts) {
    const cands = findRims(rgba, w, h, opts).filter((c) => c.score >= ((opts && opts.th) || TH_FRAME)).slice(0, 4);
    if (!cands.length) return [];
    const gray = V.toGray(rgba, w, h, 'rgba');
    return cands.map((c) => Object.assign(c, { t, desc: descriptor(gray, w, h, c), fw: w, fh: h }));
  }

  /* 候補から、ゴールの指定を作る（元の動画の画素に直す。k＝元の画素 / 調べた画像の画素）。
     枠：リングを中心に、横 ±1.6w・上 2.2w〜下 0.3w（バックボードのあたり。選手が動くリングの下は入れない）。画面の内側に収める */
  function markOf(c, k, srcW, srcH) {
    const rim = { cx: c.cx * k, cy: c.cy * k, w: 2 * c.a * k, b: +(c.b * k).toFixed(1) };      // b（楕円の縦の半径）は絵に描くときだけ使う
    return { t: c.t, box: boxFromRim(rim, srcW, srcH), rim, auto: true, score: +c.score.toFixed(2) };
  }
  /* リング（中心・幅）から、追跡に使う枠を決める：横 ±1.6w・上 2.2w〜下 0.3w（バックボードのあたり。選手が動くリングの下は入れない）。
     リングをなぞるだけで指定したとき・自動で見つけたときに使う。画面の内側に収める */
  function boxFromRim(rim, srcW, srcH) {
    const rw = rim.w;
    const x0 = Math.max(0, rim.cx - 1.6 * rw), x1 = Math.min(srcW, rim.cx + 1.6 * rw);
    const y0 = Math.max(0, rim.cy - 2.2 * rw), y1 = Math.min(srcH, rim.cy + 0.3 * rw);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* 追跡に使う枠を、リングのまわりで「縦と横の両方の模様がいちばんはっきりしている所」に決める（バックボードの枠・内側の四角など）。
     リングから決まった形で枠を取ると、床と壁の境・ギャラリーの手すりのような横の線ばかりの所が入り、横にずれても大きさが変わっても
     見分けにくい（合成映像で、追跡の倍率が少しずつ縮んで得点を落とした）。gray: w×h のグレー。rim と戻り値は、同じ画素の単位 */
  function boardBox(gray, w, h, rim) {
    const rw = rim.w;
    let best = null;
    for (const fx of [0, -0.6, 0.6, -1.1, 1.1]) for (const fw of [2.6, 3.4]) for (const fh of [2.0, 2.6]) {
      const bw = fw * rw, bh = fh * rw;
      let x0 = rim.cx + fx * rw - bw / 2, y0 = rim.cy + 0.3 * rw - bh, x1 = x0 + bw, y1 = rim.cy + 0.3 * rw;
      // リングの横の範囲に少しでもかかること（枠がリングと一緒に動くように）
      if (x0 > rim.cx + 0.3 * rw || x1 < rim.cx - 0.3 * rw) continue;
      x0 = Math.max(1, x0); y0 = Math.max(1, y0); x1 = Math.min(w - 2, x1); y1 = Math.min(h - 2, y1);
      if ((x1 - x0) * (y1 - y0) < 0.6 * bw * bh) continue;
      const step = Math.max(1, Math.round(rw / 24));
      let gx = 0, gy = 0, n = 0;
      for (let y = Math.round(y0); y <= y1; y += step) {
        for (let x = Math.round(x0); x <= x1; x += step) {
          const i = y * w + x;
          gx += Math.abs(gray[i + 1] - gray[i - 1]); gy += Math.abs(gray[i + w] - gray[i - w]); n++;
        }
      }
      if (!n) continue;
      const score = Math.min(gx, gy) / n;
      if (!best || score > best.score) best = { x: x0, y: y0, w: x1 - x0, h: y1 - y0, score };
    }
    return best ? { x: best.x, y: best.y, w: best.w, h: best.h } : boxFromRim(rim, w, h);
  }

  /* たくさんのコマの候補を、見た目でまとめて、ゴールを最大2つ選ぶ。
     同じコマの別の場所にある候補どうしは、同じゴールにしない。
     戻り値: [{ rep: 代表の候補（いちばんリングらしいもの）, n: 映っていたコマ数, score }]（よく映っている順） */
  function cluster(all) {
    const cands = all.slice().sort((p, q) => q.score - p.score);
    const groups = [];
    for (const c of cands) {
      let best = null, bs = TH_SAME;
      for (const g of groups) {
        if (g.frames.has(c.t)) continue;
        const s = descNcc(c.desc, g.rep.desc);
        if (s > bs) { bs = s; best = g; }
      }
      if (best) { best.n++; best.score += c.score; best.frames.add(c.t); best.members.push(c); }
      else groups.push({ rep: c, n: 1, score: c.score, frames: new Set([c.t]), members: [c] });
    }
    groups.sort((p, q) => q.score - p.score);
    return groups;
  }
  /* 代表（追跡の見本にするコマ）を選び直す：リングらしさが高く、枠が画面に収まり、画面の真ん中に近いもの。
     広い画角では、画面の端のゴールは引き伸ばされてゆがんで見えるので、端のコマを見本にすると、ほかの位置に映ったときに合わない
     （合成映像のゴール裏で、手前のゴールを映っていた時間の 4 割しか追えなかった）。大きく映っているほど少しだけ良い */
  function pickRep(g) {
    let best = null, bv = -1;
    for (const c of g.members) {
      if (c.known) continue;
      const rw = 2 * c.a;
      const inside = c.cx - 1.6 * rw >= 0 && c.cx + 1.6 * rw <= c.fw && c.cy - 2.2 * rw >= 0 && c.cy + 0.3 * rw <= c.fh;
      const dx = (c.cx - c.fw / 2) / (c.fw / 2), dy = (c.cy - c.fh / 2) / (c.fh / 2);
      const center = 1 - 0.45 * Math.min(1, dx * dx + dy * dy);
      const v = c.score * (inside ? 1 : 0.6) * center * Math.min(1.15, 0.85 + rw / 200);
      if (v > bv) { bv = v; best = c; }
    }
    return best || g.rep;
  }
  /* 手で指定したゴールの見た目（rim：元の動画の画素。k：元の画素 / 調べた画像の画素）。
     自動で探し直すとき、同じゴールを「もう1つのゴール」として選ばないために使う */
  function known(rgba, w, h, rim, k, t) {
    const gray = V.toGray(rgba, w, h, 'rgba');
    const c = { cx: rim.cx / k, cy: rim.cy / k, a: rim.w / k / 2, b: rim.w / k * 0.15, t, known: true, score: 99, fw: w, fh: h };
    c.desc = descriptor(gray, w, h, c);
    return c;
  }
  /* 全体：frames の候補（scanFrame の結果をつないだもの）から、ゴールの指定を最大2つ（手で指定したゴールがあれば、その分だけ少なく）。
     k: 元の画素 / 調べた画像の画素。srcW,srcH: 元の動画の大きさ。knownList: 手で指定したゴール（known() の結果） */
  function pickGoals(all, k, srcW, srcH, knownList) {
    const kn = knownList || [];
    const groups = cluster(kn.concat(all)).filter((g) => g.members.some((m) => m.known) || g.n >= 2 || g.score >= 1.6);
    const taken = groups.filter((g) => g.members.some((m) => m.known));
    const out = [];
    for (const g of groups) {
      if (out.length + kn.length >= 2) break;
      if (taken.includes(g)) continue;
      // 見た目で別のまとまりになっていても、同じゴールのことがある（ズームや向きで見え方が変わる）。
      // 2 秒以内に、ほぼ同じ場所（リング幅の 2 倍以内）に見えていたら、同じゴールとみなして使わない
      const same = taken.some((c) => c.members.some((p) => g.members.some((q) => Math.abs(p.t - q.t) <= 2 && p.t !== q.t && Math.hypot(p.cx - q.cx, p.cy - q.cy) <= 4 * Math.max(p.a, q.a))));
      if (same) continue;
      taken.push(g); out.push(g);
    }
    return out.map((g) => Object.assign(markOf(pickRep(g), k, srcW, srcH), { seen: g.n }));
  }

  /* タップした所（tx,ty：調べた画像の画素）のまわりのリング。いちばん近くの、リングらしいもの */
  function fitAt(rgba, w, h, tx, ty, opts) {
    const r = Math.max(80, (opts && opts.radius) || w * 0.12);
    const cands = findRims(rgba, w, h, { region: { x0: tx - r, y0: ty - r, x1: tx + r, y1: ty + r } });
    let best = null, bv = -Infinity;
    for (const c of cands) {
      const d = Math.hypot(c.cx - tx, c.cy - ty) / Math.max(10, 2 * c.a);
      const v = c.score - 0.25 * d;
      if (c.score >= 0.35 && d <= 3 && v > bv) { bv = v; best = c; }
    }
    return best;
  }

  BS.goalfind = { findRims, scanFrame, pickGoals, known, cluster, markOf, boxFromRim, boardBox, fitAt, rimColorMask, netScore, descriptor, descNcc, _ringScore: ringScore };
})(typeof window !== 'undefined' ? window : globalThis);
