/* バスケ分析スタジオ — 画像処理の部品（DOM 非依存・node でも動く）
   グレースケール化、縮小、テンプレート照合（NCC）、全体の動き推定、連結成分、パッチ切り出し。 */
(function (root) {
  function mod(root) {
    'use strict';
    const BS = root.BS = root.BS || {};

    /* RGBA / BGRA → グレースケール（Uint8） */
    function toGray(src, w, h, order, out) {
      const n = w * h;
      const g = out || new Uint8Array(n);
      const ri = order === 'bgra' ? 2 : 0, bi = order === 'bgra' ? 0 : 2;
      for (let i = 0, p = 0; i < n; i++, p += 4) {
        g[i] = (src[p + ri] * 77 + src[p + 1] * 150 + src[p + bi] * 29) >> 8;
      }
      return g;
    }

    /* グレースケールを整数倍で縮小（平均） */
    function shrinkGray(src, w, h, k) {
      const dw = Math.floor(w / k), dh = Math.floor(h / k);
      const out = new Uint8Array(dw * dh);
      const kk = k * k;
      for (let y = 0; y < dh; y++) {
        for (let x = 0; x < dw; x++) {
          let s = 0;
          for (let j = 0; j < k; j++) {
            const row = (y * k + j) * w + x * k;
            for (let i = 0; i < k; i++) s += src[row + i];
          }
          out[y * dw + x] = (s / kk) | 0;
        }
      }
      return { data: out, w: dw, h: dh };
    }

    /* カラー画像（RGBA/BGRA）を整数倍で縮小してグレースケールにする（速い） */
    function grayShrink(src, w, h, k, order) {
      const dw = Math.floor(w / k), dh = Math.floor(h / k);
      const out = new Uint8Array(dw * dh);
      const ri = order === 'bgra' ? 2 : 0, bi = order === 'bgra' ? 0 : 2;
      const kk = k * k;
      for (let y = 0; y < dh; y++) {
        for (let x = 0; x < dw; x++) {
          let s = 0;
          for (let j = 0; j < k; j++) {
            let p = ((y * k + j) * w + x * k) * 4;
            for (let i = 0; i < k; i++, p += 4) s += src[p + ri] * 77 + src[p + 1] * 150 + src[p + bi] * 29;
          }
          out[y * dw + x] = (s / kk) >> 8;
        }
      }
      return { data: out, w: dw, h: dh };
    }

    /* グレースケールの一部を任意倍率で取り出す（双線形）: (x0,y0) から sw×sh を dw×dh に */
    function sampleGray(src, w, h, x0, y0, sw, sh, dw, dh) {
      const out = new Uint8Array(dw * dh);
      const fx = sw / dw, fy = sh / dh;
      for (let y = 0; y < dh; y++) {
        const sy = y0 + (y + 0.5) * fy - 0.5;
        let iy = Math.floor(sy); const ty = sy - iy;
        if (iy < 0) iy = 0; if (iy > h - 2) iy = h - 2;
        for (let x = 0; x < dw; x++) {
          const sx = x0 + (x + 0.5) * fx - 0.5;
          let ix = Math.floor(sx); const tx = sx - ix;
          if (ix < 0) ix = 0; if (ix > w - 2) ix = w - 2;
          const p = iy * w + ix;
          const a = src[p] + (src[p + 1] - src[p]) * tx;
          const b = src[p + w] + (src[p + w + 1] - src[p + w]) * tx;
          out[y * dw + x] = (a + (b - a) * ty) | 0;
        }
      }
      return out;
    }

    /* テンプレート（グレースケールの小片）。照合は間引いた点だけで行う */
    function makeTemplate(data, tw, th, step) {
      step = step || 1;
      const xs = [], ys = [], vals = [];
      let sum = 0, sum2 = 0;
      for (let y = 0; y < th; y += step) {
        for (let x = 0; x < tw; x += step) {
          const v = data[y * tw + x];
          xs.push(x); ys.push(y); vals.push(v);
          sum += v; sum2 += v * v;
        }
      }
      const n = vals.length;
      const mean = sum / n;
      const sd = Math.sqrt(Math.max(1e-6, sum2 / n - mean * mean));
      return { tw, th, n, xs: Int16Array.from(xs), ys: Int16Array.from(ys), vals: Float32Array.from(vals.map((v) => v - mean)), sd, data };
    }

    /* 位置 (x,y) にテンプレートの左上を置いたときの NCC（−1〜1）。画面外の点は無視（6割以上が画面内のときだけ） */
    function nccAt(img, w, h, T, x, y) {
      let s = 0, s2 = 0, st = 0, cnt = 0, sv = 0, sv2 = 0;
      const xs = T.xs, ys = T.ys, vals = T.vals, n = T.n;
      const inside = x >= 0 && y >= 0 && x + T.tw <= w && y + T.th <= h;
      if (inside) {
        for (let i = 0; i < n; i++) {
          const v = img[(y + ys[i]) * w + x + xs[i]];
          s += v; s2 += v * v; st += v * vals[i];
        }
        const mean = s / n;
        const sd = Math.sqrt(Math.max(1e-6, s2 / n - mean * mean));
        if (sd < 3) return 0;
        return st / (n * sd * T.sd);
      }
      for (let i = 0; i < n; i++) {
        const px = x + xs[i], py = y + ys[i];
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const v = img[py * w + px];
        const tv = vals[i];
        s += v; s2 += v * v; st += v * tv; sv += tv; sv2 += tv * tv; cnt++;
      }
      if (cnt < n * 0.6) return -1;
      const mean = s / cnt, tm = sv / cnt;
      const sd = Math.sqrt(Math.max(1e-6, s2 / cnt - mean * mean));
      const tsd = Math.sqrt(Math.max(1e-6, sv2 / cnt - tm * tm));
      if (sd < 3 || tsd < 3) return 0;
      return (st / cnt - mean * tm) / (sd * tsd);
    }

    /* 速い版：テンプレート全体が画面内にあるときだけ使う（画素の位置を先に計算しておく） */
    function nccFast(img, w, T, x, y) {
      if (T._w !== w) {
        T._w = w;
        T.offs = new Int32Array(T.n);
        for (let i = 0; i < T.n; i++) T.offs[i] = T.ys[i] * w + T.xs[i];
      }
      const offs = T.offs, vals = T.vals, n = T.n;
      const base = y * w + x;
      let s = 0, s2 = 0, st = 0;
      for (let i = 0; i < n; i++) {
        const v = img[base + offs[i]];
        s += v; s2 += v * v; st += v * vals[i];
      }
      const mean = s / n;
      const va = s2 / n - mean * mean;
      if (va < 9) return 0;
      return st / (n * Math.sqrt(va) * T.sd);
    }

    /* (cx,cy) を中心に ±radius の範囲で最も合う位置を探す */
    function nccSearch(img, w, h, T, cx, cy, radius, step) {
      step = step || 1;
      let best = -2, bx = cx, by = cy;
      const allInside = cx - radius >= 0 && cy - radius >= 0 && cx + radius + T.tw <= w && cy + radius + T.th <= h;
      for (let y = cy - radius; y <= cy + radius; y += step) {
        for (let x = cx - radius; x <= cx + radius; x += step) {
          const s = allInside ? nccFast(img, w, T, x, y) : nccAt(img, w, h, T, x, y);
          if (s > best) { best = s; bx = x; by = y; }
        }
      }
      if (step > 1) {
        const c = nccSearch(img, w, h, T, bx, by, step - 1, 1);
        if (c.score > best) return c;
      }
      return { x: bx, y: by, score: best };
    }

    /* 画面全体の動き（カメラのパン）を、小さな画像どうしのずれ（SAD 最小）で推定 */
    function globalShift(prev, cur, w, h, maxShift) {
      let best = Infinity, bdx = 0, bdy = 0;
      const m = maxShift;
      const x0 = m, x1 = w - m, y0 = m, y1 = h - m;
      const eval_ = (dx, dy) => {
        let s = 0;
        for (let y = y0; y < y1; y += 2) {
          const a = y * w, b = (y + dy) * w + dx;
          for (let x = x0; x < x1; x += 2) {
            const d = prev[a + x] - cur[b + x];
            s += d < 0 ? -d : d;
          }
        }
        return s;
      };
      // 粗く（2px 刻み）→ 細かく
      for (let dy = -m; dy <= m; dy += 2) {
        for (let dx = -m; dx <= m; dx += 2) {
          const s = eval_(dx, dy);
          if (s < best) { best = s; bdx = dx; bdy = dy; }
        }
      }
      const cx = bdx, cy = bdy;
      for (let dy = cy - 1; dy <= cy + 1; dy++) {
        for (let dx = cx - 1; dx <= cx + 1; dx++) {
          if (dx < -m || dx > m || dy < -m || dy > m) continue;
          const s = eval_(dx, dy);
          if (s < best) { best = s; bdx = dx; bdy = dy; }
        }
      }
      const n = ((x1 - x0) / 2) * ((y1 - y0) / 2);
      return { dx: bdx, dy: bdy, err: best / n };
    }

    /* カラー画像から、中心 (cx,cy)・1辺 size（元画像の画素）の正方形を out×out に取り出す（RGB, 双線形） */
    function extractPatch(src, w, h, cx, cy, size, outSize, order, out) {
      const o = out || new Uint8Array(outSize * outSize * 3);
      const ri = order === 'bgra' ? 2 : 0, bi = order === 'bgra' ? 0 : 2;
      const f = size / outSize;
      const x0 = cx - size / 2, y0 = cy - size / 2;
      let q = 0;
      for (let y = 0; y < outSize; y++) {
        const sy = y0 + (y + 0.5) * f - 0.5;
        let iy = Math.floor(sy); let ty = sy - iy;
        if (iy < 0) { iy = 0; ty = 0; } else if (iy > h - 2) { iy = h - 2; ty = 1; }
        for (let x = 0; x < outSize; x++) {
          const sx = x0 + (x + 0.5) * f - 0.5;
          let ix = Math.floor(sx); let tx = sx - ix;
          if (ix < 0) { ix = 0; tx = 0; } else if (ix > w - 2) { ix = w - 2; tx = 1; }
          const p = (iy * w + ix) * 4, p2 = p + w * 4;
          const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
          o[q++] = src[p + ri] * w00 + src[p + 4 + ri] * w10 + src[p2 + ri] * w01 + src[p2 + 4 + ri] * w11;
          o[q++] = src[p + 1] * w00 + src[p + 5] * w10 + src[p2 + 1] * w01 + src[p2 + 5] * w11;
          o[q++] = src[p + bi] * w00 + src[p + 4 + bi] * w10 + src[p2 + bi] * w01 + src[p2 + 4 + bi] * w11;
        }
      }
      return o;
    }

    /* 2値マスクの連結成分（8近傍）。小さすぎるものは捨てる */
    function components(mask, w, h, minArea) {
      const label = new Int32Array(w * h);
      const out = [];
      const stack = new Int32Array(w * h);
      let cur = 0;
      for (let i = 0; i < w * h; i++) {
        if (!mask[i] || label[i]) continue;
        cur++;
        let sp = 0;
        stack[sp++] = i; label[i] = cur;
        let area = 0, sx = 0, sy = 0, x0 = w, x1 = 0, y0 = h, y1 = 0;
        while (sp > 0) {
          const p = stack[--sp];
          const px = p % w, py = (p / w) | 0;
          area++; sx += px; sy += py;
          if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
          for (let dy = -1; dy <= 1; dy++) {
            const ny = py + dy;
            if (ny < 0 || ny >= h) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const nx = px + dx;
              if (nx < 0 || nx >= w) continue;
              const q = ny * w + nx;
              if (mask[q] && !label[q]) { label[q] = cur; stack[sp++] = q; }
            }
          }
        }
        if (area >= (minArea || 1)) out.push({ id: cur, area, cx: sx / area, cy: sy / area, x0, x1, y0, y1 });
      }
      return { blobs: out, label, count: cur };
    }

    BS.vision = { toGray, shrinkGray, grayShrink, sampleGray, makeTemplate, nccAt, nccFast, nccSearch, globalShift, extractPatch, components };
  }
  mod(root);
  (root.BS.src = root.BS.src || {}).vision = mod;   // Worker に同じコードを渡すため
})(typeof window !== 'undefined' ? window : globalThis);
