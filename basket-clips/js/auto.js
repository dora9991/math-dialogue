/* バスケ分析スタジオ — 自動解析（映像からゴール・ボール・得点を検出）
   1) ゴール追跡：人が1回だけ指定したゴール（バックボード）を、テンプレート照合で毎コマ追う。
      手持ちカメラのパン・ズームに対応（全体の動き推定で位置を予測、倍率も少しずつ追従）。
   2) ゴールを中心に切り出した小さな画像（パッチ）で背景差分 → ボール候補。
   3) ボールがリングの内側を上から下へ抜け、ネットが動いたら「得点」。近づいて抜けなければ「失敗」。
   DOM 非依存（ブラウザでも node でも同じコードが動く）。 */
(function (root) {
  function mod(root) {
    'use strict';
    const BS = root.BS;
    const V = BS.vision;

    const AW = 640;            // 追跡用の解析幅（px）
    const TH_KEEP = 0.5;       // 追跡を続ける NCC のしきい値
    const TH_ACQ = 0.62;       // 見失った後に、画面全体から探して再び捉える NCC
    const TH_NEAR = 0.55;      // 見失った後に、「いるはずの場所」の近くで再び捉える NCC（場所の手がかりがあるぶん低くてよい）
    const TH_COARSE = 0.45;    // 1/4 の解像度で探すときの候補しきい値
    const GLOBAL_SCALES = [1, 0.9, 1.1, 0.8, 1.22, 0.7, 1.4];   // 画面全体から探すときに順に試す倍率（指定したときの大きさ＝1 から。前後 8% は詰めるときに試すので、0.65〜1.5 倍を切れ目なく覆う）
    const SC_STEP = 1.03;      // 追跡中に試す倍率の刻み
    const PRIOR_FRAMES = 150;  // 見失ってから「いるはずの場所」を信じるコマ数（約10秒。長く信じると、似た模様の床などに誤って張り付く）
    const clampN = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

    /* ---------- ゴール追跡 ---------- */
    function createHoopTracker(mark, srcW, srcH, phase) {
      // mark: { id, box:{x,y,w,h}, rim:{cx,cy,w} }  … 元画像（srcW×srcH）の座標
      const k = srcW / AW;
      const AH = Math.round(srcH / k);
      const st = {
        id: mark.id, k, AH,
        bw: Math.max(8, Math.round(mark.box.w / k)), bh: Math.max(8, Math.round(mark.box.h / k)),
        rimOff: { x: (mark.rim.cx - mark.box.x) / k, y: (mark.rim.cy - mark.box.y) / k },
        rimW0: mark.rim.w / k,
        tpl0: null, T: null, Tq: {}, Tc: {}, TcN: 0, scale: 1,
        x: mark.box.x / k, y: mark.box.y / k,
        fx: 0, fy: 0, fine: 0,          // 1画素より細かい位置のずれ、倍率の端数（SC_STEP の何乗ぶんか）
        drift: 0,                       // 見失ってからの全体の動きの合計（推定位置のあやしさ）
        tracked: false, score: 0, lost: 1e6, frame: 0, everSeen: false
      };
      function buildTemplate(scale) {
        // 同じ倍率のテンプレートは作り直さない（作るのが重い）
        const key = scale.toFixed(3);
        let T = st.Tc[key];
        if (T) return T;
        const tw = Math.max(8, Math.round(st.bw * scale)), th = Math.max(8, Math.round(st.bh * scale));
        const data = V.sampleGray(st.tpl0, st.bw, st.bh, 0, 0, st.bw, st.bh, tw, th);
        if (++st.TcN > 120) { st.Tc = {}; st.TcN = 1; }
        T = st.Tc[key] = V.makeTemplate(data, tw, th, tw * th > 6000 ? 3 : tw * th > 1200 ? 2 : 1);
        return T;
      }
      function quarterTemplate(sc) {
        const key = sc.toFixed(2);
        let T = st.Tq[key];
        if (!T) {
          const tw = Math.max(5, Math.round(st.bw * sc / 4)), th = Math.max(5, Math.round(st.bh * sc / 4));
          const data = V.sampleGray(st.tpl0, st.bw, st.bh, 0, 0, st.bw, st.bh, tw, th);
          const step = tw * th > 320 ? 2 : 1;
          T = st.Tq[key] = V.makeTemplate(data, tw, th, step);
          T.sparse = V.makeTemplate(data, tw, th, step + 1);     // 下見用（点を減らしたもの）。見込みのある位置だけ T で測り直す
        }
        return T;
      }
      function setScale(scale) { st.scale = scale; st.T = buildTemplate(scale); }
      /* 指定した時刻のコマ（解析幅のグレースケール）からテンプレートを作る */
      function init(gray, w, h) {
        const x0 = Math.round(mark.box.x / k), y0 = Math.round(mark.box.y / k);
        st.tpl0 = V.sampleGray(gray, w, h, x0, y0, st.bw, st.bh, st.bw, st.bh);
        setScale(1);
      }
      function tryScales(gray, w, h, cx, cy, scales, radius, step) {
        let best = null;
        for (const sc of scales) {
          const T = sc === st.scale ? st.T : buildTemplate(sc);
          const r = V.nccSearch(gray, w, h, T, Math.round(cx - T.tw / 2), Math.round(cy - T.th / 2), radius, step);
          if (!best || r.score > best.score) best = { x: r.x, y: r.y, score: r.score, scale: sc, T };
        }
        return best;
      }
      function accept(b) {
        st.x = b.x; st.y = b.y; st.score = b.score;
        if (b.scale !== st.scale) {
          // 倍率を切り替えても、見かけの倍率（端数込み）がなめらかにつながるようにする
          const stepN = Math.log(b.scale / st.scale) / Math.log(SC_STEP);
          st.fine = Math.abs(stepN) < 1.5 ? clampN(st.fine - stepN, -1, 1) : 0;
          st.scale = b.scale; st.T = b.T;
        }
        if (!st.tracked) { st.fx = 0; st.fy = 0; }
        st.tracked = true; st.lost = 0; st.drift = 0; st.everSeen = true;
      }
      /* 1画素より細かい位置：最もよく合った位置の上下左右の合い具合から、山の頂上を放物線で求める */
      function subpixel(gray, w, h) {
        const T = st.T, s0 = st.score;
        const peak = (a, b) => { const den = a - 2 * s0 + b; return den < -1e-5 ? clampN(0.5 * (a - b) / den, -0.5, 0.5) : 0; };
        st.fx = peak(V.nccAt(gray, w, h, T, st.x - 1, st.y), V.nccAt(gray, w, h, T, st.x + 1, st.y));
        st.fy = peak(V.nccAt(gray, w, h, T, st.x, st.y - 1), V.nccAt(gray, w, h, T, st.x, st.y + 1));
      }
      function centerOf() { return { cx: st.x + st.T.tw / 2, cy: st.y + st.T.th / 2 }; }

      /* 1コマ進める。gray: 解析幅のグレースケール、quarter: その 1/4 の解像度、shift: 全体の動き（解析幅の画素） */
      function update(gray, w, h, quarter, shift) {
        st.frame++;
        const c0 = centerOf();
        const sdx = shift ? shift.dx : 0, sdy = shift ? shift.dy : 0;
        const cx = c0.cx + sdx, cy = c0.cy + sdy;
        // 「捉えた」と判断したあとで取り消せるように、直前の状態を覚えておく（リングの色での確認に落ちたとき用）
        st.snap = { tracked: st.tracked, scale: st.scale, T: st.T, lost: st.lost, drift: st.drift + Math.abs(sdx) + Math.abs(sdy), fine: st.fine, px: cx - st.T.tw / 2, py: cy - st.T.th / 2 };
        if (st.tracked || st.lost < 6) {
          const cur = tryScales(gray, w, h, cx, cy, [st.scale], st.tracked ? 7 : 12, 1);
          let b = cur;
          if (st.frame % 2 === 0) {
            // 倍率（ズーム）への追従：いまの倍率より 0.02 以上よく合うときだけ切り替える（行ったり来たりすると背景差分が荒れる）
            const ccx = cur.x + cur.T.tw / 2, ccy = cur.y + cur.T.th / 2;
            const up = st.scale * SC_STEP < 2.4 ? tryScales(gray, w, h, ccx, ccy, [st.scale * SC_STEP], 2, 1) : null;
            const dn = st.scale / SC_STEP > 0.45 ? tryScales(gray, w, h, ccx, ccy, [st.scale / SC_STEP], 2, 1) : null;
            const alt = up && (!dn || up.score >= dn.score) ? up : dn;
            if (alt && alt.score > cur.score + 0.02) b = alt;
            else if (up && dn && cur.score >= TH_KEEP) {
              // 倍率の端数：3つの倍率での合い具合から、山の頂上を放物線で求めてゆっくり寄せる
              const den = dn.score - 2 * cur.score + up.score;
              const d = den < -1e-5 ? clampN(0.5 * (dn.score - up.score) / den, -1, 1) : (up.score > cur.score ? 1 : dn.score > cur.score ? -1 : 0);
              st.fine += (d - st.fine) * 0.5;
            }
          }
          // ときどき、離れた倍率も試す。少しずつ倍率を動かすだけだと、まちがった大きさのまま抜け出せないことがある
          // （バックボードの枠と内側の四角が似ているので、小さめの大きさでもそこそこ合ってしまう）
          if (b.score >= TH_KEEP && (st.frame + (phase || 0) * 2) % 5 === 0) {
            const ccx = b.x + b.T.tw / 2, ccy = b.y + b.T.th / 2;
            const far = tryScales(gray, w, h, ccx, ccy, [0.8, 0.88, 1.14, 1.25].map((f) => b.scale * f).filter((sc) => sc > 0.45 && sc < 2.4), 6, 2);
            if (far && far.score > b.score + 0.15) { b = far; st.fine = 0; }
          }
          if (b.score >= TH_KEEP) { accept(b); subpixel(gray, w, h); return status(); }
          st.tracked = false; st.lost++; st.score = b.score;
          st.x = cx - st.T.tw / 2; st.y = cy - st.T.th / 2;
          st.drift += Math.abs(sdx) + Math.abs(sdy);
          return status();
        }
        // 見失っている：全体の動きで位置を推定し続ける
        st.lost++;
        st.x = cx - st.T.tw / 2; st.y = cy - st.T.th / 2;
        st.drift += Math.abs(sdx) + Math.abs(sdy);
        // (a) 推定した場所の近くを毎コマ探す。画面の端で一部しか映っていなくてもよい
        if (st.everSeen && st.lost < PRIOR_FRAMES) {
          const R = Math.min(60, 16 + 0.1 * st.drift);
          const sc = [st.scale, st.scale * 1.08, st.scale / 1.08][st.frame % 3];
          if (sc > 0.45 && sc < 2.4) {
            const b = nearSearch(gray, w, h, quarter, sc, cx, cy, R);
            if (b && b.score >= TH_NEAR) { accept(b); subpixel(gray, w, h); return status(); }
          }
        }
        // (b) 画面全体から探す（1/4 の解像度で粗く → 候補だけ解析幅で詰める）。1コマにつき倍率を1つ。
        //     偶数コマ：決まった倍率を順番に。奇数コマ：最後に見えていたときの倍率（同じ大きさで戻ってくることが多い。画面の端で一部だけ映っていてもよい）
        const turn = (st.frame + (phase || 0)) % 2 === 0;
        if (turn || st.everSeen) {
          const sc = turn ? GLOBAL_SCALES[(st.frame >> 1) % GLOBAL_SCALES.length] : st.scale;
          const cands = globalSearch(quarter, sc, !turn);
          let bestB = null;
          for (const g of cands) {
            // まず同じ倍率で詰め、見込みがあるときだけ前後の倍率も試す
            let b = tryScales(gray, w, h, g.cx * 4, g.cy * 4, [sc], 8, 2);
            if (b.score >= TH_ACQ - 0.12) {
              const b2 = tryScales(gray, w, h, b.x + b.T.tw / 2, b.y + b.T.th / 2, [sc * 1.08, sc / 1.08], 4, 2);
              if (b2.score > b.score) b = b2;
            }
            if (!bestB || b.score > bestB.score) bestB = b;
          }
          if (bestB && bestB.score >= TH_ACQ) { accept(bestB); subpixel(gray, w, h); return status(); }
        }
        return status();
      }
      /* 推定位置 (cx,cy)（解析幅の画素）のまわり ±R を、1/4 の解像度で粗く探してから解析幅で詰める */
      function nearSearch(gray, w, h, q, sc, cx, cy, R) {
        const T = quarterTemplate(sc);
        const r = Math.ceil(R / 4);
        const x0 = Math.round(cx / 4 - T.tw / 2), y0 = Math.round(cy / 4 - T.th / 2);
        let best = -2, bx = 0, by = 0;
        const xMax = q.w - T.tw, yMax = q.h - T.th;
        for (let y = y0 - r; y <= y0 + r; y++) {
          for (let x = x0 - r; x <= x0 + r; x++) {
            const sco = (x >= 0 && y >= 0 && x <= xMax && y <= yMax) ? V.nccFast(q.data, q.w, T, x, y) : V.nccAt(q.data, q.w, q.h, T, x, y);
            if (sco > best) { best = sco; bx = x; by = y; }
          }
        }
        if (best < TH_COARSE) return null;
        return tryScales(gray, w, h, (bx + T.tw / 2) * 4, (by + T.th / 2) * 4, [sc], 6, 2);
      }
      /* 1/4 の解像度で、ある倍率のテンプレートを全体に当てて、上位の候補を返す。partial: 画面の端からはみ出した位置（4割まで）も調べる */
      function globalSearch(q, sc, partial) {
        const T = quarterTemplate(sc);
        const top = [];
        const xMax = q.w - T.tw, yMax = q.h - T.th;
        const data = q.data, qw = q.w;
        const mx = partial ? Math.floor(T.tw * 0.4) : 0, my = partial ? Math.floor(T.th * 0.4) : 0;
        for (let y = -my; y <= yMax + my; y++) {
          for (let x = -mx; x <= xMax + mx; x++) {
            const inside = x >= 0 && y >= 0 && x <= xMax && y <= yMax;
            if (!inside && ((x & 1) || (y & 1))) continue;      // はみ出した位置は1つおき（遅い計算なので）
            if (inside && V.nccFast(data, qw, T.sparse, x, y) < TH_COARSE - 0.1) continue;   // 下見
            const sco = inside ? V.nccFast(data, qw, T, x, y) : V.nccAt(data, qw, q.h, T, x, y);
            if (sco < TH_COARSE + 0.03) continue;
            const cx = x + T.tw / 2, cy = y + T.th / 2;
            let merged = false;
            for (const c of top) {
              if (Math.abs(c.cx - cx) < T.tw * 0.6 && Math.abs(c.cy - cy) < T.th * 0.6) { if (sco > c.score) { c.score = sco; c.cx = cx; c.cy = cy; } merged = true; break; }
            }
            if (!merged) top.push({ score: sco, cx, cy });
          }
        }
        top.sort((p, r) => r.score - p.score);
        return top.slice(0, 2);
      }
      /* いまのコマで「捉えた」のを取り消して、見失った状態に戻す */
      function revert() {
        const p = st.snap;
        if (!p) return;
        st.scale = p.scale; st.T = p.T; st.fine = p.fine;
        st.tracked = false; st.lost = p.lost + 1; st.drift = p.drift; st.score = 0;
        st.x = p.px; st.y = p.py;
      }
      /* 追跡をやめる（別のものに張り付いていると分かったとき）。場所の手がかりも捨てる */
      function drop() { st.tracked = false; st.lost = PRIOR_FRAMES; st.score = 0; }
      function status() {
        // 見かけの倍率（端数込み）と、1画素より細かい位置で、リングの位置と幅を出す
        const es = st.scale * Math.pow(SC_STEP, st.tracked ? st.fine : 0);
        const fx = st.tracked ? st.fx : 0, fy = st.tracked ? st.fy : 0;
        const ccx = st.x + fx + st.T.tw / 2, ccy = st.y + fy + st.T.th / 2;
        const rimCx = (ccx + (st.rimOff.x - st.bw / 2) * es) * k, rimCy = (ccy + (st.rimOff.y - st.bh / 2) * es) * k;
        return {
          id: st.id, tracked: st.tracked, acquired: st.tracked && !!st.snap && !st.snap.tracked, score: st.score, scale: es,
          box: { x: (ccx - st.bw * es / 2) * k, y: (ccy - st.bh * es / 2) * k, w: st.bw * es * k, h: st.bh * es * k },
          rim: { cx: rimCx, cy: rimCy, w: st.rimW0 * es * k },
          inFrame: rimCx > 0 && rimCx < srcW && rimCy > 0 && rimCy < srcH
        };
      }
      return { init, update, status, revert, drop, state: st };
    }

    /* ---------- 固定カメラ用のゴール ----------
       360°カメラ・広角カメラなど、コート全体が映りっぱなしでカメラが動かない映像では、ゴールは動かない。
       追いかけずに、指定した場所をそのまま見張る（バックボードの模様が小さくて追跡が不安定になることもない）。
       リングの色での確認（verifyRim）は、そのまま使う。リングが選手に隠れたコマは、そのコマだけ使わない。 */
    function createFixedTracker(mark, srcW, srcH) {
      const st = { id: mark.id, frame: 0, tracked: true, score: 1, lost: 0, everSeen: true, fixed: true };
      let first = true;
      function status() {
        const rim = { cx: mark.rim.cx, cy: mark.rim.cy, w: mark.rim.w };
        return {
          id: mark.id, tracked: true, acquired: first, score: 1, scale: 1, fixed: true,
          box: { x: mark.box.x, y: mark.box.y, w: mark.box.w, h: mark.box.h }, rim,
          inFrame: rim.cx > 0 && rim.cx < srcW && rim.cy > 0 && rim.cy < srcH
        };
      }
      function update() { st.frame++; const s = status(); first = false; return s; }
      return { init() {}, update, status, revert() {}, drop() {}, state: st };
    }

    /* ---------- リングの色での確認と、位置の微調整 ----------
       バックボードの模様（白黒）だけでは、床の反射などに誤って張り付くことがある。
       リングは赤〜オレンジの輪なので、「リングのまわりの赤みの模様」を、指定したときのものと照合する。
       本物なら 0.7 以上、床などの偽物なら 0.3 以下になる（実動画で確認）。合った位置のずれは、リング位置の微調整に使う。 */
    const RV = 64;                  // リングを中心に、リング幅の2倍の範囲を RV×RV に切り出す（リング幅 = WC 画素）
    const RCW = 48, RCH = 28;       // 照合に使う中心部分（横 ±0.75w・縦 ±0.44w）
    const RSH = 5;                  // ずれを探す範囲（画素）
    const TH_RIM_ACQ = 0.45;        // 捉えた瞬間、これ未満なら取り消す
    const TH_RIM_OK = 0.6;          // これ以上なら位置の微調整に使う
    const TH_RIM_LOW = 0.25, RIM_LOW_FRAMES = 15;   // これ未満が約1秒続いたら、別のものに張り付いているとみなして追跡をやめる
    // （バスケ得点クリップで足したもの）リングが「隠れているだけ」とみなす条件：直前にリングを確かめられてから OCCL_MAX 秒以内で、
    // バックボードの模様はよく合っている（OCCL_NCC 以上）。ボールがリングの上で弾む・転がる間は、オレンジのボールが輪に重なって
    // 赤みの模様が崩れるため、そのコマを捨てると、ネットから出てくるボールを見逃す（背景の学び直しで数コマ何も見えなくなる）
    const OCCL_MAX = 1.5, OCCL_NCC = 0.7;
    function redness(rgb, out) {
      const n = RV * RV, raw = new Float32Array(n);
      for (let i = 0, p = 0; i < n; i++, p += 3) raw[i] = rgb[p] / (rgb[p] + rgb[p + 1] + rgb[p + 2] + 1);
      const o = out || new Float32Array(n);
      for (let y = 0; y < RV; y++) {
        const y0 = y > 0 ? y - 1 : 0, y1 = y < RV - 1 ? y + 1 : RV - 1;
        for (let x = 0; x < RV; x++) {
          const x0 = x > 0 ? x - 1 : 0, x1 = x < RV - 1 ? x + 1 : RV - 1;
          o[y * RV + x] = (raw[y0 * RV + x0] + raw[y0 * RV + x] + raw[y0 * RV + x1] + raw[y * RV + x0] + raw[y * RV + x] + raw[y * RV + x1] + raw[y1 * RV + x0] + raw[y1 * RV + x] + raw[y1 * RV + x1]) / 9;
        }
      }
      return o;
    }
    function createRimChecker() {
      let ref = null, usable = false;
      const cur = new Float32Array(RV * RV);
      const cx0 = (RV - RCW) / 2, cy0 = (RV - RCH) / 2;
      /* 指定したコマのリング周辺（RGB, RV×RV）を見本にする */
      function init(rgb) {
        ref = redness(rgb);
        let s = 0, s2 = 0;
        for (let y = 0; y < RCH; y++) for (let x = 0; x < RCW; x++) { const v = ref[(cy0 + y) * RV + cx0 + x]; s += v; s2 += v * v; }
        const n = RCW * RCH;
        usable = s2 / n - (s / n) * (s / n) > 1e-4;      // 赤みの模様がほとんど無いリング（色あせ・白黒映像）では確認しない
      }
      /* (dx,dy) だけずらしたときの照合。valid: 画面内にある範囲（切り出し上の座標） */
      function nccShift(dx, dy, v) {
        let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
        for (let y = 0; y < RCH; y++) {
          const yy = cy0 + y + dy;
          if (yy < v.y0 || yy > v.y1) continue;
          const ra = (cy0 + y) * RV + cx0, rb = yy * RV + cx0 + dx;
          for (let x = 0; x < RCW; x++) {
            const xx = cx0 + x + dx;
            if (xx < v.x0 || xx > v.x1) continue;
            const a = ref[ra + x], b = cur[rb + x];
            sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; n++;
          }
        }
        if (n < RCW * RCH * 0.4) return null;
        const va = saa / n - (sa / n) * (sa / n), vb = sbb / n - (sb / n) * (sb / n);
        if (va < 1e-7 || vb < 1e-7) return 0;
        return (sab / n - (sa / n) * (sb / n)) / Math.sqrt(va * vb);
      }
      /* いまのコマのリング周辺と見本を照合。戻り値: { score（確認できないときは null）, dx, dy（切り出し上の画素。1画素より細かい） } */
      function check(rgb, valid) {
        if (!usable) return { score: null, dx: 0, dy: 0 };
        redness(rgb, cur);
        let best = -2, bx = 0, by = 0;
        for (let dy = -RSH; dy <= RSH; dy++) for (let dx = -RSH; dx <= RSH; dx++) {
          const sc = nccShift(dx, dy, valid);
          if (sc != null && sc > best) { best = sc; bx = dx; by = dy; }
        }
        if (best < -1) return { score: null, dx: 0, dy: 0 };
        const peak = (a, b) => { if (a == null || b == null) return 0; const den = a - 2 * best + b; return den < -1e-6 ? clampN(0.5 * (a - b) / den, -0.5, 0.5) : 0; };
        const fx = Math.abs(bx) < RSH ? peak(nccShift(bx - 1, by, valid), nccShift(bx + 1, by, valid)) : 0;
        const fy = Math.abs(by) < RSH ? peak(nccShift(bx, by - 1, valid), nccShift(bx, by + 1, valid)) : 0;
        return { score: best, dx: bx + fx, dy: by + fy };
      }
      return { init, check };
    }

    /* ---------- ゴール周辺の監視（ボール候補を見つける） ----------
       ゴール（リング）を中心に、リング幅が WC 画素になるよう拡大縮小した正方形（パッチ）を切り出す。
       カメラが動いてもパッチの中ではゴールが動かないので、背景との差分で「動いているもの」だけが残る。 */
    const WC = 32;                 // パッチ上でのリング幅（画素）
    const PS = 208;                // パッチの1辺（= 6.5 × リング幅）
    const PCY = 0.25;              // パッチ中心はリング中心より 0.25w 下（リングの下も広く見る）
    const STILL_DIFF = 30;         // 1コマ前との差（RGB の合計）がこれ未満なら「変わっていない」
    const STILL_FRAMES = 5;        // これだけ続けて変わっていない画素は「止まっている」
    const GHOST_FRAMES = 10;       // 前景のままこれだけ止まっていたら、背景に取り込み始める
    const BALL_D = 0.53 * WC;      // ボールの直径（リング幅の 0.53 倍）
    const BALL_A = Math.PI * (BALL_D / 2) * (BALL_D / 2);

    function createHoopWatcher(id) {
      const n = PS * PS;
      const bg = new Float32Array(n * 3);
      const mask = new Uint8Array(n);
      const patch = new Uint8Array(n * 3);
      const prev = new Uint8Array(n * 3);      // 1コマ前の画像
      const still = new Uint8Array(n);         // その画素が何コマ続けて変わっていないか
      const st = { id, warm: 0, valid: false, lastT: -1 };
      function reset() { st.warm = 0; st.valid = false; still.fill(0); }

      /* 1コマ処理。戻り値: ボール候補の配列（リング基準の座標、単位 = リング幅） */
      /* patchIn: ゴール中心で切り出した RGB（PS×PS）。省略時は src から切り出す */
      function step(src, srcW, srcH, order, rim, t, patchIn) {
        if (st.lastT >= 0 && t - st.lastT > 0.5) reset();
        st.lastT = t;
        if (patchIn) patch.set(patchIn);
        else V.extractPatch(src, srcW, srcH, rim.cx, rim.cy + PCY * rim.w, PS / WC * rim.w, PS, order, patch);
        if (!st.valid) {
          for (let i = 0; i < n * 3; i++) bg[i] = patch[i];
          prev.set(patch);
          st.valid = true; st.warm = 1;
          return { cands: [], fg: 0, netFg: 0, netOnly: 0, patch, mask };
        }
        st.warm++;
        // 背景との差（上下左右1画素のずれは許す）
        const TH = 54;
        let fgCount = 0;
        for (let y = 1; y < PS - 1; y++) {
          for (let x = 1; x < PS - 1; x++) {
            const i = y * PS + x, p = i * 3;
            const r = patch[p], g = patch[p + 1], b = patch[p + 2];
            let d = Math.abs(r - bg[p]) + Math.abs(g - bg[p + 1]) + Math.abs(b - bg[p + 2]);
            if (d > TH) {
              // 近傍の背景とも比べて、最小の差をとる（位置合わせの誤差に強くする）
              for (let k = 0; k < 4 && d > TH; k++) {
                const q = p + (k === 0 ? -3 : k === 1 ? 3 : k === 2 ? -PS * 3 : PS * 3);
                const d2 = Math.abs(r - bg[q]) + Math.abs(g - bg[q + 1]) + Math.abs(b - bg[q + 2]);
                if (d2 < d) d = d2;
              }
            }
            const f = d > TH ? 1 : 0;
            mask[i] = f; fgCount += f;
          }
        }
        // 背景の更新（動いていない所は速く、動いている所はゆっくり）。
        // 「前景なのにずっと変わらない」画素は、立ち去った人の跡（床が前景に見える）なので、早めに背景に取り込む
        const aB = st.warm < 5 ? 0.5 : 0.07, aF = st.warm < 5 ? 0.5 : 0.012;
        for (let i = 0, p = 0; i < n; i++, p += 3) {
          const dp = Math.abs(patch[p] - prev[p]) + Math.abs(patch[p + 1] - prev[p + 1]) + Math.abs(patch[p + 2] - prev[p + 2]);
          still[i] = dp < STILL_DIFF ? (still[i] < 250 ? still[i] + 1 : 250) : 0;
          const a = mask[i] ? (still[i] >= GHOST_FRAMES ? 0.2 : aF) : aB;
          bg[p] += (patch[p] - bg[p]) * a; bg[p + 1] += (patch[p + 1] - bg[p + 1]) * a; bg[p + 2] += (patch[p + 2] - bg[p + 2]) * a;
        }
        prev.set(patch);
        if (st.warm < 5) return { cands: [], fg: fgCount / n, netFg: 0, netOnly: 0, patch, mask };
        const cc = V.components(mask, PS, PS, 30);
        const cands = [];
        const isCand = new Uint8Array(cc.count + 1);     // ボールらしい形のかたまり（ネットの動きから除くため）
        const ox = PS / 2, oy = PS / 2 - PCY * WC;   // パッチ上のリング中心
        for (const b of cc.blobs) {
          const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
          if (b.area < BALL_A * 0.32 || b.area > BALL_A * 2.3) continue;
          const asp = bw / bh;
          if (asp < 0.55 || asp > 1.8) continue;
          const fill = b.area / (bw * bh);
          if (fill < 0.5) continue;
          if (Math.max(bw, bh) > BALL_D * 1.9) continue;
          // 色（ボールらしさ）：成分の平均色
          let sr = 0, sg = 0, sb = 0, cnt = 0, nStill = 0;
          for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
            const i = y * PS + x;
            if (cc.label[i] !== b.id) continue;
            sr += patch[i * 3]; sg += patch[i * 3 + 1]; sb += patch[i * 3 + 2]; cnt++;
            if (still[i] >= STILL_FRAMES) nStill++;
          }
          const r = sr / cnt, g = sg / cnt, bl = sb / cnt;
          cands.push({ x: (b.cx - ox) / WC, y: (b.cy - oy) / WC, area: b.area / BALL_A, asp, fill, r, g, b: bl, still: nStill / cnt, px: b.cx, py: b.cy });
          isCand[b.id] = 1;
        }
        // ネット付近（リングの真下）の動き。netFg: 動いている画素の割合／netOnly: そのうち、ボールらしい形のかたまりを除いた分
        // （ボールがネットの「手前」を素通りしただけなら netOnly はほぼ 0。ネットを通ると、ネットそのものが動くので大きくなる）
        let netFg = 0, netOnly = 0, netN = 0;
        const nx0 = Math.round(ox - 0.5 * WC), nx1 = Math.round(ox + 0.5 * WC), ny0 = Math.round(oy + 0.12 * WC), ny1 = Math.round(oy + 1.05 * WC);
        for (let y = ny0; y <= ny1; y++) for (let x = nx0; x <= nx1; x++) {
          const i = y * PS + x;
          netN++;
          if (!mask[i]) continue;
          netFg++;
          if (!isCand[cc.label[i]]) netOnly++;
        }
        return { cands, fg: fgCount / n, netFg: netFg / netN, netOnly: netOnly / netN, patch, mask };
      }
      return { step, reset, state: st };
    }

    /* ---------- シュートの判定（ゴールごと） ----------
       座標はリング中心が原点、単位はリング幅（w）、下が＋。
       成功：ネットが大きく動いた直後に、ボールがリングの真下（|x|≤0.5w）へゆっくり出てくる。
       失敗：ボールがリングの高さ・近く（|x|≤0.95w, y≤0.25w）まで来たのに、成功の形にならない。 */
    function ballLike(c, maxBright) {
      if (c.area < 0.4 || c.area > 2.0 || c.fill < 0.48) return false;
      if (c.still > 0.7) return false;                 // 止まっているもの（立ち去った人の跡など）
      const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
      if (mx > (maxBright || 235)) return false;       // 白っぽいもの（白い服・床の照り返し）。明るいオレンジのボールは通す
      if (c.b > c.r + 6) return false;                 // 青っぽい（ビブスなど）
      if (mx - mn < 10 && mx > 70) return false;       // 灰色
      return true;
    }
    const BORN_SPEED_MIN = 2.8;  // ネットの中から現れたボールの、落ちる速さの下限（実測 4.5〜6.0。歩く人の頭は 1〜2）
    const NET_SPEED_MAX = 7.6;   // ネットを通るときの落下の速さの上限（リング幅/秒）。素通りは 8 以上になる
    const NET_HIDE_MAX = 0.65;   // ボールがネットの中に隠れていられる最長の時間（秒）。リングの上で転がって入るときは 0.5 秒ほど見えなくなる
    function createShotDetector(id, opts) {
      // opts は検証・調整用（しきい値の上書き）。ふだんは省略
      // bornYMax・bornGap はバスケ得点クリップで広げたもの（もとは 1.7・0.14）：リングの上で弾んでから入ったボールは、
      // 揺れるネットや下の選手に重なって、ネットを出てすぐには見えないことがある（少し下で初めて見える・1コマ見えない）。
      // ネットの手前を落ちただけのボールは、その高さでは速すぎる（リングの高さからの自由落下で 9 前後）ので、速さの上限で外れる。
      // 2つ目の点は 2.7 より上でないといけないので、最初の点は 2.0 まで
      const P = Object.assign({ colorGate: 100, areaGate: 2.6, bornSpeedMin: BORN_SPEED_MIN, netSpeedMax: NET_SPEED_MAX, xinMax: 0.45, freeFallMin: 6.2, bornYMax: 2.0, bornGap: 0.21 }, opts || {});
      let tracks = [];       // 動くもの（ボール候補）の軌跡
      const nets = [];       // ネットの動き {t,v}
      const seen = [];       // リングの口〜ネットの下に、ボール候補が見えた時刻
      let netBase = null;
      let pending = null;    // リングに近づいた（まだ成功/失敗を決めていない）{ t0: 気づいた時刻, t: 最も近づいた時刻, d: そのときの距離 }
      let held = null;       // 「失敗」と決めたが、まだ出していないもの（直後に成功と分かったら取り消す）{ t, conf, at: 出す時刻, below }
      let cool = -1;         // 成功の直後：この時刻までは新しい出来事を出さない（ネットの下で弾むボールを数えない）
      let lastMiss = -10;    // 直前に記録した失敗の時刻
      let lastBelow = false; // その失敗のボールが、リングの下まで落ちたのを見届けたか
      const out = [];
      function netPeak(t0, t1) { let m = 0; for (const n of nets) if (n.t >= t0 && n.t <= t1 && n.v > m) m = n.v; return m; }
      function netOnlyPeak(t0, t1) { let m = 0; for (const n of nets) if (n.t >= t0 && n.t <= t1 && n.o > m) m = n.o; return m; }
      /* t0〜t1 の間、ネットが動き続けていたコマの割合 */
      function netBusy(t0, t1) { let n = 0, k = 0; for (const e of nets) if (e.t > t0 && e.t < t1) { n++; if (e.v >= netBase + 0.07) k++; } return n ? k / n : 0; }
      function isStatic(tr) {
        if (tr.pts.length < 5) return false;
        let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
        for (const p of tr.pts) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
        return (x1 - x0) + (y1 - y0) < 0.4;
      }
      /* リングの口（ここで見えなくなったら、ネットの中にいるかもしれない） */
      const atMouth = (p) => Math.abs(p.x) <= 0.7 && p.y >= -0.4 && p.y <= 0.9;
      /* リングの口へ向かっているか：口にいる、または、すぐ上（リング幅 1.3 個ぶんまで）から口の内側へ落ちてくる途中 */
      function mouthBound(p, prev) {
        if (atMouth(p)) return true;
        if (!prev || p.t - prev.t > 0.2 || p.y < -1.3 || p.y >= -0.4 || Math.abs(p.x) > 0.9) return false;
        const vy = (p.y - prev.y) / (p.t - prev.t), vx = (p.x - prev.x) / (p.t - prev.t);
        if (vy < 2) return false;
        return Math.abs(p.x + vx * (-p.y / vy)) <= 0.6;       // このまま進むと、リングの高さでどこを通るか
      }
      /* 2点の間が空いていてもよいか：ふつうは 0.34 秒まで。リングの口で消えてネットの下に現れたときだけ NET_HIDE_MAX まで */
      const gapOK = (a, b) => b.t - a.t <= 0.34 || (b.t - a.t <= NET_HIDE_MAX && a.m && b.y >= 0.8);
      /* 成功かどうか：軌跡の最後が「リングの内側を、ゆっくり、下へ抜けた」形か */
      function checkMade(tr) {
        const pts = tr.pts, n = pts.length;
        if (n < 2) return null;
        const b = pts[n - 1];
        if (b.y < 1.1 || b.y > 2.7 || Math.abs(b.x) > 0.62) return null;
        // 最後から遡って、リングの内側（|x|≤0.62）を下向きに動いている区間
        let i = n - 1;
        // （リングの少し上から斜めに落ちてくる途中の点は、内側でなくても「リングの口へ向かっている」なら続きとみなす）
        while (i > 0 && (Math.abs(pts[i - 1].x) <= 0.62 || pts[i - 1].m) && pts[i - 1].y <= pts[i].y + 0.08 && gapOK(pts[i - 1], pts[i])) i--;
        const first = pts[i];
        if (i === n - 1) return null;
        let p0 = null, p1 = null;
        for (let k = i; k < n; k++) { if (pts[k].y <= 0.6) p0 = pts[k]; if (!p1 && pts[k].y >= 1.0) p1 = pts[k]; }
        let speed, tRef, born = false;
        if (p0 && p1 && p1.t > p0.t) {
          speed = (p1.y - p0.y) / (p1.t - p0.t); tRef = p0.t;
          // リングの上（p0）からネットの下（p1）まで、途中が見えなかった場合：
          // その間ネットが動き続けていたこと（半分以上のコマで）を求める。リングの横をかすめて落ちたボールは、ネットが一瞬しか動かない。
          // 長く見えなかったときは、遅すぎないことも求める（外れた後、たまたま下に別の物が現れただけ、を成功にしない）
          if (p1.t - p0.t > 0.18 && netBusy(p0.t, p1.t) < 0.5) return null;
          if (p1.t - p0.t > 0.34 && speed < 1.5) return null;
        } else if (!p0 && i === 0 && first.y >= 0.6 && first.y <= P.bornYMax) {
          // ネットの中から現れた（カメラが遅れて向いた・ネットに隠れていた）。
          // ネットの向こうを歩く人の頭などと区別するため、「続けて2コマ・落ちる速さが十分」を求める
          const q = pts[i + 1];
          if (q.t - first.t > P.bornGap) return null;
          speed = (q.y - first.y) / Math.max(0.03, q.t - first.t); tRef = first.t - 0.15; born = true;
          if (b.y < first.y + 0.25 || speed < P.bornSpeedMin) return null;
        } else return null;
        // ネットを通る速さの上限。ネットから現れた場合は、抜けたあと（また加速している所）を測っているので少し速くてよい
        if (speed > (born ? P.netSpeedMax + 1.4 : P.netSpeedMax) || speed <= 0) return null;
        const peak = netPeak(tRef - (born ? 0.4 : 0.1), b.t);
        const need = Math.max(born ? 0.15 : 0.13, netBase + (born ? 0.1 : 0.07));
        if (peak < need) return null;
        // ネットそのものが動いた証拠（ボールの形を除いた動き）があるか。ボールがずっと丸く見えたまま落ちたときは、
        // 「ネットの中を通った」のか「リングの手前を落ちただけ」なのか映像からは区別しにくいので、自信を下げて「要確認」にする
        const only = netOnlyPeak(tRef - (born ? 0.4 : 0.1), b.t);
        const sure = only >= Math.max(0.1, netBase + 0.07);
        let conf = Math.min(0.99, 0.5 + (peak - netBase) * 1.1 + (P.netSpeedMax - speed) * 0.04 + (born ? -0.08 : 0.08));
        if (!sure) conf = Math.min(conf, 0.6);
        // リングの高さ〜ネットの上半分で、リングの中心にいちばん近づいたときの横ずれ。
        // ボールが輪の中を通るには、中心がリング幅の 0.24 倍以内に入らないといけない。ずっと離れたまま落ちたのなら輪の外（リングの横を落ちた）。
        // ・最大ではなく最小で見る（ネットと重なって形がくずれた1コマに引きずられないため）
        // ・ネットを抜けたあと（下半分）は横に流れるので見ない。その高さで一度も見えなかった（ネットに隠れていた）ときは調べない
        let xin = Infinity;
        for (let k = i; k < n; k++) if (pts[k].y >= -0.1 && pts[k].y <= 0.7 && Math.abs(pts[k].x) < xin) xin = Math.abs(pts[k].x);
        if (xin === Infinity) xin = 0;
        if (xin > P.xinMax) return null;
        // ネットが動いた証拠がなく、落ちる速さが「何にも当たらず落ちた」ときと同じ（リングの高さから落ちても 6.5 以上になる）なら、
        // リングの手前を落ちただけ。ネットを通ったボールは減速する（実測 1.9〜6.1）
        if (!sure && !born && speed > P.freeFallMin) return null;
        return { t: tRef, made: true, conf: +Math.max(0.5, conf).toFixed(2), speed: +speed.toFixed(1), net: +peak.toFixed(2), netOnly: +only.toFixed(2), sure, born, xin: +xin.toFixed(2) };
      }
      /* netOnly: ネットの動きのうち、ボールらしい形のかたまりを除いた分（省略時は netFg と同じ扱い） */
      function push(t, cands, netFg, netOnly) {
        while (nets.length && t - nets[0].t > 2.5) nets.shift();
        nets.push({ t, v: netFg, o: netOnly == null ? netFg : netOnly });
        const balls = cands.filter((c) => ballLike(c, P.maxBright) && Math.abs(c.x) <= 3.05 && c.y <= 3.0 && c.y >= -3.0);
        // 既存の軌跡に割り当て（予測位置に最も近い候補）。リングの口で消えた軌跡は、ネットを抜けてくるのを少し長く待つ
        tracks = tracks.filter((tr) => { const L = tr.pts[tr.pts.length - 1], dt = t - L.t; return dt <= 0.34 || (dt <= NET_HIDE_MAX && L.m); });
        const used = new Set();
        const updated = [];
        // すべての（軌跡, 候補）の組を距離の近い順に割り当てる（近い軌跡が優先）
        const pairs = [];
        tracks.forEach((tr, ti) => {
          const n = tr.pts.length, last = tr.pts[n - 1];
          const dt = t - last.t;
          const waiting = dt > 0.34;      // ネットの中に隠れているかもしれない
          let px = last.x, py = last.y;
          if (!waiting && n >= 2 && last.t - tr.pts[n - 2].t <= 0.2) {
            const pv = tr.pts[n - 2], d0 = last.t - pv.t;
            px += (last.x - pv.x) / d0 * dt; py += (last.y - pv.y) / d0 * dt;
          }
          const gate = (n >= 2 ? 0.7 : 1.4) + 6 * dt;
          for (let k = 0; k < balls.length; k++) {
            const c = balls[k];
            let d;
            if (waiting) {
              // ネットの真下（リングの内側）に出てきたものだけをつなぐ
              if (Math.abs(c.x) > 0.62 || c.y < 0.8 || c.y > 2.4) continue;
              d = Math.abs(c.x) + 0.5;
            } else {
              // 予測した位置（速さを延長）か、直前の位置の近く。リングに当たると向きが変わるので、予測だけでは見失う
              d = Math.min(Math.hypot(c.x - px, c.y - py), Math.hypot(c.x - last.x, c.y - last.y) + 0.15);
              if (d >= gate) continue;
            }
            // 見た目（色・大きさ）が大きく違うものは、同じボールではない（別の物どうしをつないで「動いた」と誤解しない）
            if (Math.abs(c.r - last.r) + Math.abs(c.g - last.g) + Math.abs(c.b - last.b) > P.colorGate) continue;
            if (c.area > last.a * P.areaGate || last.a > c.area * P.areaGate) continue;
            pairs.push({ ti, k, d });
          }
        });
        pairs.sort((p, q) => p.d - q.d);
        const usedTr = new Set();
        for (const pr of pairs) {
          if (usedTr.has(pr.ti) || used.has(pr.k)) continue;
          usedTr.add(pr.ti); used.add(pr.k);
          const tr = tracks[pr.ti], c = balls[pr.k];
          const pt = { t, x: c.x, y: c.y, r: c.r, g: c.g, b: c.b, a: c.area };
          pt.m = mouthBound(pt, tr.pts[tr.pts.length - 1]);
          tr.pts.push(pt);
          if (tr.pts.length > 60) tr.pts.shift();
          updated.push(tr);
        }
        for (let k = 0; k < balls.length; k++) if (!used.has(k)) { const c = balls[k]; const pt = { t, x: c.x, y: c.y, r: c.r, g: c.g, b: c.b, a: c.area }; pt.m = mouthBound(pt, null); tracks.push({ pts: [pt] }); }
        // ネットの動きの基準値（ボールがネット付近にないときにゆっくり更新）
        const nearNet = balls.some((c) => Math.abs(c.x) < 1.2 && c.y > -0.6 && c.y < 1.6);
        if (netBase == null) netBase = Math.min(netFg, 0.08);
        else if (!nearNet && netFg < netBase + 0.06) netBase += (netFg - netBase) * 0.05;
        while (seen.length && t - seen[0] > 1) seen.shift();
        if (balls.some((c) => Math.abs(c.x) <= 0.75 && c.y >= -0.4 && c.y <= 2.4)) seen.push(t);
        if (t < cool) { pending = null; return; }
        // --- 成功 ---
        for (const tr of updated) {
          if (isStatic(tr)) continue;
          const m = checkMade(tr);
          if (m) {
            // 直前に「失敗かも」と見ていたものがあれば、同じシュート（リングの上で弾んでから入った）か、
            // 別のシュート（外れ → リバウンド → すぐ打ち直して成功）かを見分ける
            const prior = held || (pending ? { t: pending.t, conf: +(0.5 + Math.max(0, 0.9 - pending.d) * 0.4).toFixed(2) } : null);
            if (prior && !sameShot(tr, prior.t, m.t)) pushMiss(prior.t, prior.conf, prior.below);
            held = null; pending = null;
            out.push({ t: m.t, hoop: id, made: true, conf: m.conf, speed: m.speed, net: m.net, netOnly: m.netOnly, sure: m.sure, born: m.born, xin: m.xin });
            cool = t + 1.6;
            return;
          }
        }
        // --- リングに近づいた（失敗の候補） ---
        for (const tr of updated) {
          if (isStatic(tr)) continue;
          const n = tr.pts.length, p = tr.pts[n - 1];
          // この 0.35 秒の間に、リングの近く（|x|≤0.95w, −1.1w≤y≤0.25w）を通ったか。いちばん近づいた所を覚える
          let dmin = Infinity, tNear = 0;
          for (let i = n - 1; i >= 0 && t - tr.pts[i].t <= 0.35; i--) {
            const q = tr.pts[i];
            if (Math.abs(q.x) > 0.95 || q.y > 0.25 || q.y < -1.1) continue;
            // 勢いよく上がっていく途中（打ち上げたボールがリングの前を通るだけ）は数えない。前の点（なければ次の点）との差で見る
            const o = i > 0 && q.t - tr.pts[i - 1].t <= 0.2 ? tr.pts[i - 1] : (i < n - 1 && tr.pts[i + 1].t - q.t <= 0.2 ? tr.pts[i + 1] : null);
            if (o && (q.y - o.y) / (q.t - o.t) < -2.5) continue;
            const d = Math.hypot(q.x, q.y);
            if (d < dmin) { dmin = d; tNear = q.t; }
          }
          if (dmin === Infinity) continue;
          // その前後で十分に動いているか（その場に留まっているものは数えない）
          let moved = false;
          for (let i = n - 2; i >= 0 && t - tr.pts[i].t <= 0.6; i--) {
            if (Math.hypot(tr.pts[i].x - p.x, tr.pts[i].y - p.y) >= 0.7) { moved = true; break; }
          }
          if (!moved) continue;
          if (!pending) pending = { t0: t, t: tNear, d: dmin, tr };
          else if (dmin < pending.d) { pending.t = tNear; pending.d = dmin; pending.tr = tr; }
        }
        if (pending) {
          // 「失敗」と決めるのは、(a) そのボールがリングのそばを離れた（下に落ちた・遠くへ弾んだ）とき、または
          // (b) 近づいてから 1.1 秒たっても成功にならないとき。ただし (b) は、まだリングの口〜ネットにボールがいる間
          // （ネットが動いている・ボール候補が見えている）は待つ。最長 2.6 秒
          const L = updated.indexOf(pending.tr) >= 0 ? pending.tr.pts[pending.tr.pts.length - 1] : null;
          const below = !!L && L.y > 1.1;       // リングの下まで落ちた（もう一度リングに来るには、誰かが打ち直すしかない）
          const left = L && (Math.hypot(L.x, L.y) > 1.5 || below);
          const busy = (seen.length && t - seen[seen.length - 1] <= 0.25) || netPeak(t - 0.25, t) >= netBase + 0.07;
          if (left || (t - pending.t0 > 1.1 && (!busy || t - pending.t0 > 2.6))) {
            hold(pending.t, +(0.5 + Math.max(0, 0.9 - pending.d) * 0.4).toFixed(2), t, below);
            pending = null;
          }
        }
        if (held && t >= held.at) { pushMiss(held.t, held.conf, held.below); held = null; }
      }
      /* 「失敗」と決めたものを、少しの間だけ手元に置く（直後に入ったら取り消すため）。
         リングの上で何度か弾むと続けて来るので、2秒以内なら1本にまとめ、いちばんリングに近づいた瞬間を採る。
         ただし、前のボールがリングの下まで落ちたのを見届けていたら、次に来たのは打ち直し（タップ・リバウンドシュート）なので別の1本 */
      function hold(tm, conf, t, below) {
        if (held) {
          if (tm - held.t < 2.0 && !held.below) { if (conf > held.conf) { held.t = tm; held.conf = conf; } held.at = t + 1.3; held.below = below; return; }
          pushMiss(held.t, held.conf, held.below);
        }
        held = { t: tm, conf, at: t + 1.3, below };
      }
      /* tA（リングに最も近づいた時刻）から tB（ネットに入り始めた時刻）まで、ボールがリングのそばに居続けたか。
         居続けた＝同じシュートがリングの上で弾んでいただけ。いったん離れた（下に落ちた・遠くへ行った）＝別のシュート */
      function sameShot(tr, tA, tB) {
        const pts = tr.pts.filter((p) => p.t >= tA - 0.01 && p.t <= tB + 0.01);
        if (!pts.length || pts[0].t > tA + 0.15) return tB - tA < 0.9;      // 軌跡が途切れている：間が短ければ同じシュート
        return pts.every((p) => Math.hypot(p.x, p.y) <= 1.4 && p.y <= 1.0);
      }
      /* 失敗を記録。リングの上で弾んでいる間に2回数えないよう、直前の失敗から2秒以内は同じシュートとみなす
         （直前のボールがリングの下まで落ちたのを見届けていた場合を除く。1秒以内は、その場合でも同じとみなす） */
      function pushMiss(tm, conf, below) {
        if (tm - lastMiss < (lastBelow ? 1.0 : 2.0)) return;
        lastMiss = tm; lastBelow = !!below;
        out.push({ t: tm, hoop: id, made: false, conf });
      }
      function flush() {
        if (held) { pushMiss(held.t, held.conf, held.below); held = null; }
        if (pending) { pushMiss(pending.t, 0.5, false); pending = null; }
        tracks = [];
      }
      function take() { return out.splice(0, out.length); }
      return { push, flush, take, events: out };
    }

    /* ---------- 1コマぶんの前処理（解析幅・半分・1/4 のグレースケール） ---------- */
    function prepFrame(src, srcW, srcH, order) {
      const k = srcW / AW;
      const ki = Math.round(k);
      let g;
      if (Math.abs(k - ki) < 1e-6 && ki >= 1) g = ki === 1 ? { data: V.toGray(src, srcW, srcH, order), w: srcW, h: srcH } : V.grayShrink(src, srcW, srcH, ki, order);
      else {
        const full = V.toGray(src, srcW, srcH, order);
        const h = Math.round(srcH / k);
        g = { data: V.sampleGray(full, srcW, srcH, 0, 0, srcW, srcH, AW, h), w: AW, h };
      }
      const half = V.shrinkGray(g.data, g.w, g.h, 2);
      const quarter = V.shrinkGray(half.data, half.w, half.h, 2);
      return { gray: g, half, quarter };
    }

    /* ---------- 解析のまとめ役 ----------
       使い方：
         const an = createAnalyzer({ srcW, srcH, hoops: [{ id, box, rim }] });
         an.initHoop(i, gray640)                      // ゴールを指定したコマで呼ぶ（テンプレートを作る）
         const live = an.process({ t, gray, quarter, getPatch(cx, cy, size) → RGB(PS×PS) })
         const result = an.finish()
       フレームの作り方は環境ごとに違う（node: 全画面から切り出し／ブラウザ: 小さな canvas に描いて読む）ので、ここでは受け取るだけ。 */
    function createAnalyzer(cfg) {
      const fixed = !!cfg.fixed;       // true: カメラが動かない（全景カメラ）。ゴールを追わず、指定した場所を見張る
      const trackers = cfg.hoops.map((m, i) => (fixed ? createFixedTracker(m, cfg.srcW, cfg.srcH) : createHoopTracker(m, cfg.srcW, cfg.srcH, i)));
      const rims = cfg.hoops.map(() => createRimChecker());
      const rimState = cfg.hoops.map(() => ({ dx: 0, dy: 0, low: 0, score: null, okT: null }));
      const occlusion = cfg.rimOcclusion !== false;      // 検証用に false で、もとの動き（隠れたコマは使わない）
      const watchers = cfg.hoops.map((m) => createHoopWatcher(m.id));
      const detectors = cfg.hoops.map((m, i) => createShotDetector(i));
      const lastSeen = cfg.hoops.map(() => -1);
      const shots = [];
      const vis = [];          // どのゴールが映っていたか {t, on:[bool...]}（攻守の行き来の推定に使う）
      let prevQ = null, frames = 0;
      /* ゴールを指定したコマで呼ぶ。getPatch(cx, cy, size, outSize) → RGB（outSize×outSize） */
      function initHoop(i, gray, w, h, getPatch) {
        trackers[i].init(gray, w, h);
        const m = cfg.hoops[i];
        if (getPatch) rims[i].init(getPatch(m.rim.cx, m.rim.cy, RV / WC * m.rim.w, RV));
      }
      /* リングの色で確認して、位置を微調整する。偽物なら追跡を取り消す。戻り値: 使ってよい status
         （リングの輪の一致で「大きさ」まで直す方法も試したが、ボールがリングに重なった瞬間や、捉えた直後に
           別の大きさのほうが合って見えることがあり、かえって見失った。大きさはバックボードの照合に任せる） */
      function verifyRim(i, s, f) {
        const tr = trackers[i], rs = rimState[i];
        if (s.acquired) { rs.dx = 0; rs.dy = 0; rs.low = 0; }
        const k = WC / s.rim.w;      // 元の画素 → 切り出し上の画素
        const valid = { x0: Math.ceil(RV / 2 - s.rim.cx * k), x1: Math.floor(RV / 2 + (cfg.srcW - 1 - s.rim.cx) * k), y0: Math.ceil(RV / 2 - s.rim.cy * k), y1: Math.floor(RV / 2 + (cfg.srcH - 1 - s.rim.cy) * k) };
        const c = rims[i].check(f.getPatch(s.rim.cx, s.rim.cy, RV / WC * s.rim.w, RV), valid);
        rs.score = c.score;
        if (c.score == null) return s;                       // 画面の端などで確認できない：そのまま使う
        if (s.acquired && c.score < TH_RIM_ACQ) { tr.revert(); return tr.status(); }
        if (c.score < TH_RIM_LOW) {
          // リングが一時的に隠れているだけ（ボールや手が輪に重なった）なら、直前のずれのまま、このコマも使う
          if (occlusion && !s.acquired && rs.okT != null && f.t - rs.okT <= OCCL_MAX && (fixed || s.score >= OCCL_NCC)) {
            rs.low++;
            s.rim.cx += rs.dx / k; s.rim.cy += rs.dy / k;
            s.rimScore = c.score; s.occluded = true;
            s.inFrame = s.rim.cx > 0 && s.rim.cx < cfg.srcW && s.rim.cy > 0 && s.rim.cy < cfg.srcH;
            return s;
          }
          // リングが見当たらないコマは使わない（追跡そのものは続ける。約1秒続いたら追跡をやめる。固定カメラは追跡しないので、やめない：
          // やめると、そのコマだけ「見えている」扱いになってしまう）
          if (!fixed && ++rs.low >= RIM_LOW_FRAMES) { tr.drop(); rs.low = 0; return tr.status(); }
          s.tracked = false; s.rimScore = c.score;
          return s;
        }
        rs.low = 0; rs.okT = f.t;
        if (c.score >= TH_RIM_OK) { rs.dx += (c.dx - rs.dx) * 0.5; rs.dy += (c.dy - rs.dy) * 0.5; }
        s.rim.cx += rs.dx / k; s.rim.cy += rs.dy / k;
        s.rimScore = c.score;
        s.inFrame = s.rim.cx > 0 && s.rim.cx < cfg.srcW && s.rim.cy > 0 && s.rim.cy < cfg.srcH;
        return s;
      }
      function process(f) {
        frames++;
        let shift = null;
        if (!fixed && prevQ && prevQ.w === f.quarter.w) {
          // 画面全体が前のコマからどれだけ動いたか（＝ゴールも同じだけ動いて見える）。1/4 の解像度で測るので 4 倍する
          const s = V.globalShift(prevQ.data, f.quarter.data, f.quarter.w, f.quarter.h, 12);
          shift = { dx: s.dx * 4, dy: s.dy * 4, err: s.err };
        }
        if (!fixed) prevQ = f.quarter;
        const status = [];
        const fresh = [];
        trackers.forEach((tr, i) => {
          let s = fixed ? tr.update() : tr.update(f.gray.data, f.gray.w, f.gray.h, f.quarter, shift);
          if (s.tracked && s.inFrame) s = verifyRim(i, s, f);
          status.push(s);
          if (!s.tracked || !s.inFrame) return;
          if (lastSeen[i] >= 0 && f.t - lastSeen[i] > 0.6) detectors[i].flush();
          lastSeen[i] = f.t;
          const patch = f.getPatch(s.rim.cx, s.rim.cy + PCY * s.rim.w, PS / WC * s.rim.w, PS);
          const r = watchers[i].step(null, 0, 0, null, s.rim, f.t, patch);
          detectors[i].push(f.t, r.cands, r.netFg, r.netOnly);
          for (const ev of detectors[i].take()) { ev.hoop = i; shots.push(ev); fresh.push(ev); }
          s.cands = r.cands; s.net = r.netFg; s.netOnly = r.netOnly; s.fg = r.fg;
        });
        vis.push({ t: f.t, on: status.map((s) => s.tracked && s.inFrame) });
        return { status, events: fresh, motion: shift ? shift.err : 0 };
      }
      function finish() {
        detectors.forEach((d, i) => { d.flush(); for (const ev of d.take()) { ev.hoop = i; shots.push(ev); } });
        shots.sort((a, b) => a.t - b.t);
        // ゴールが映っていた区間（[開始, 終了, ビット：ゴール i が映っていれば 1<<i]）と、映っていたコマ数
        const spans = [], seen = cfg.hoops.map(() => 0);
        for (const v of vis) {
          let mask = 0;
          v.on.forEach((on, i) => { if (on) { mask |= 1 << i; seen[i]++; } });
          const last = spans[spans.length - 1];
          if (last && last[2] === mask && v.t - last[1] <= 0.5) last[1] = v.t;
          else spans.push([v.t, v.t, mask]);
        }
        return { shots, frames, spans, seen };
      }
      return { initHoop, process, finish, trackers, shots, vis };
    }

    /* ---------- 検出結果 → タグ（イベント） ----------
       opts: { hoopTeam: [team for hoop0, team for hoop1] (前半), periods: [{n,t0}], halfSwitch: true }
       - ゴール → 攻めているチーム（後半は入れ替え）
       - 成功は 2点として仮に記録（3P・FT は確認モードで直す）
       - 外れの後：同じゴールで 12秒以内に次のシュート → オフェンスリバウンド（推定）、そうでなければディフェンスリバウンド（推定） */
    function toEvents(result, opts) {
      const evs = [];
      const perAt = (t) => { let n = 1; (opts.periods || []).forEach((p) => { if (t >= p.t0) n = p.n; }); return n; };
      const teamOf = (hoop, t) => {
        const base = opts.hoopTeam[hoop];
        const second = opts.halfSwitch !== false && perAt(t) >= 3;
        return second ? 1 - base : base;
      };
      const shots = result.shots;
      shots.forEach((s, i) => {
        const team = teamOf(s.hoop, s.t);
        const tShot = Math.max(0, s.t - 0.9);     // リング到達の約0.9秒前を「シュートの時刻」とする
        const id = 'a' + Math.round(s.t * 100) + (s.made ? 'm' : 'x') + s.hoop;
        const ev = { id, t: +tShot.toFixed(2), type: 'shot', team, pid: null, made: s.made, pts: 2, sx: null, sy: null, ast: null, blk: null, auto: true, conf: s.conf, tDet: +s.t.toFixed(2), hoop: s.hoop };
        if (s.made && s.sure === false) ev.unsure = true;      // ネットの動きを確認できなかった得点（要確認）
        evs.push(ev);
        if (!s.made) {
          const next = shots[i + 1];
          const again = next && next.hoop === s.hoop && next.t - s.t <= 12;
          evs.push({ id: id + 'r', t: +(s.t + 1.0).toFixed(2), type: 'reb', team: again ? team : 1 - team, pid: null, off: !!again, auto: true, est: true, conf: again ? 0.6 : 0.55, hoop: s.hoop });
        }
      });
      return evs;
    }

    /* ---------- 画像（canvas に描けるもの）をそのまま渡して解析する ----------
       ブラウザ／Worker 用。source は VideoFrame・ImageBitmap・canvas・video のどれでもよい。
       makeCanvas(w, h) は canvas（Worker では OffscreenCanvas）を作る関数。
       作業用の画像は幅 FW_MAX 以下に縮める。そこから先は node での検証（real-run.cjs）と同じ計算。 */
    const FW_MAX = 1280;
    const FW_MAX_PIXELS = 40e6;        // 固定カメラで元の大きさのまま持つ作業画像の上限（8K の 7680×4320 まで）
    const RIM_WORK = 40;               // 固定カメラ：作業画像の上でリングがこの幅（画素）以上になる範囲で、できるだけ縮める
    function createFrameAnalyzer(cfg, makeCanvas) {
      const an = createAnalyzer(cfg);
      const fixed = !!cfg.fixed;                                // カメラが動かない映像（全景カメラ）：ゴールを追わないので、全体のグレー画像などは作らない
      /* 元の画素 → 作業用の画素（kf）。ふつうは横 1280 に縮める。
         全景カメラでは、ゴールが小さく映る（リング幅 30 画素ほど）ので、縮めるとリングやボールがつぶれる。
         リングが作業画像の上で RIM_WORK 画素になる範囲までしか縮めない（小さいゴールなら、元の大きさのまま）。
         Safari のエンジンは、復号した VideoFrame の「一部だけ切り出して描く」指定を無視するので、
         切り出しではなく「全体を1回描いて、必要な領域だけ getImageData で読む」方法にしてある（Chrome でも、これが速い）。 */
      let kf = Math.max(1, cfg.srcW / FW_MAX);
      if (fixed) {
        const minRim = Math.min.apply(null, cfg.hoops.map((m) => m.rim.w));
        kf = Math.min(kf, Math.max(1, minRim / RIM_WORK));
        kf = Math.max(kf, Math.sqrt(cfg.srcW * cfg.srcH / FW_MAX_PIXELS));
        kf = Math.max(1, kf);
      }
      const fw = Math.round(cfg.srcW / kf), fh = Math.round(cfg.srcH / kf);
      const ah = Math.round(AW * cfg.srcH / cfg.srcW);
      /* 作業画像の canvas。固定カメラで大きな映像のときは、GPU の canvas のほうが速い（描くのが GPU の中で済み、読むのは必要な領域だけ）。
         Worker の中で、新しい復号フレームごとにかかる時間：4K Chrome 38→11 ミリ秒・5.7K 70→16、Safari 系 4K 45→29・5.7K 88→54（実測）。
         ふつうのカメラ（縮めた作業画像の全体を毎コマ読む）は、CPU の canvas のまま。 */
      const gpu = cfg.gpu != null ? !!cfg.gpu : fixed && fw * fh > 1.5e6;      // cfg.gpu: 検証用（true/false で強制）。2560×1440 でも Chrome 40→21 秒・Safari 系 46→32 秒（120 秒の映像）
      const cF = makeCanvas(fw, fh), gF = cF.getContext('2d', gpu ? {} : { willReadFrequently: true });
      const cA = fixed ? null : makeCanvas(AW, ah), gA = cA ? cA.getContext('2d', { willReadFrequently: true }) : null;
      if (kf > 2) gF.imageSmoothingQuality = 'medium';
      const bufs = {};          // 切り出しの出力先（大きさごとに使い回す）
      let gray = null;
      /* rot: 映像トラックの回転（0/90/180/270）。<video> は自動で回して表示するので、同じ向きにそろえる */
      function load(source, rot) {
        if (rot) {
          gF.save(); gF.translate(fw / 2, fh / 2); gF.rotate(rot * Math.PI / 180);
          if (rot === 180) gF.drawImage(source, -fw / 2, -fh / 2, fw, fh); else gF.drawImage(source, -fh / 2, -fw / 2, fh, fw);
          gF.restore();
        } else gF.drawImage(source, 0, 0, fw, fh);
        if (fixed) return null;
        gA.drawImage(cF, 0, 0, AW, ah);
        gray = { data: V.toGray(gA.getImageData(0, 0, AW, ah).data, AW, ah, 'rgba'), w: AW, h: ah };
        return gray;
      }
      /* 中心 (cx,cy)・1辺 size（元の画素）の正方形を outSize×outSize の RGB で返す。必要な範囲だけ読んで、node と同じ extractPatch に渡す */
      function getPatch(cx, cy, size, outSize) {
        const patch = bufs[outSize] || (bufs[outSize] = new Uint8Array(outSize * outSize * 3));
        const s = size / kf, px = cx / kf, py = cy / kf;
        const x0 = Math.max(0, Math.floor(px - s / 2) - 2), y0 = Math.max(0, Math.floor(py - s / 2) - 2);
        const x1 = Math.min(fw, Math.ceil(px + s / 2) + 3), y1 = Math.min(fh, Math.ceil(py + s / 2) + 3);
        if (x1 - x0 < 2 || y1 - y0 < 2) { patch.fill(0); return patch; }
        const d = gF.getImageData(x0, y0, x1 - x0, y1 - y0).data;
        return V.extractPatch(d, x1 - x0, y1 - y0, px - x0, py - y0, s, outSize, 'rgba', patch);
      }
      /* いま読み込んである画像（load 済み）からゴールのテンプレートを作る */
      function initHoop(i) { an.initHoop(i, gray ? gray.data : null, gray ? gray.w : 0, gray ? gray.h : 0, getPatch); }
      function frame(t, source, rot) {
        const g = load(source, rot);
        if (fixed) return an.process({ t, gray: null, quarter: null, getPatch });
        const half = V.shrinkGray(g.data, g.w, g.h, 2), quarter = V.shrinkGray(half.data, half.w, half.h, 2);
        return an.process({ t, gray: g, quarter, getPatch });
      }
      return { load, initHoop, frame, finish: an.finish, analyzer: an, canvas: cF, width: fw, height: fh, fixed, kf };
    }

    BS.auto = { AW, WC, PS, PCY, RV, createHoopTracker, createFixedTracker, createRimChecker, createHoopWatcher, createShotDetector, createAnalyzer, createFrameAnalyzer, toEvents, ballLike, prepFrame };
  }
  mod(root);
  (root.BS.src = root.BS.src || {}).auto = mod;   // Worker に同じコードを渡すため
})(typeof window !== 'undefined' ? window : globalThis);
