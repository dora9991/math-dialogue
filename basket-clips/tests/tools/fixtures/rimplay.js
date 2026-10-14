/* テスト用：サンプル試合のシュートの一部を「リングに当たってから入る／当たって外れる」形にする（映像の見た目だけ。試合の流れ・正解のタグは同じ）
   サンプル試合（sim.js）の得点は、どれもリングの真ん中へきれいに落ちる形なので、リングで弾む得点の見落としを確かめられない。
   シュートのボールの軌道（track.ball）の「リングに届いてから」の部分を、弾む軌道に差し替える。時間の長さは変えない（選手の動きとずれない）。
   BS.rimPlay(game, { seed, makes: 0〜1, misses: 0〜1 }) → 変えたシュートの一覧 [{ t（放った時刻）, made, kind, tIn（ボールがネットに入る時刻）, hits: [リングに当たった時刻] }]
   描画（render.js）は track.rimHits を見て、リングに当たったときにネットを少し揺らす（本物でも、リングに当たるとネットが揺れる）。 */
(function (root) {
  'use strict';
  const BS = root.BS;
  const CT = BS.COURT;
  const r2 = (v) => Math.round(v * 100) / 100;
  const near = (a, b, tol) => Math.abs(a - b) <= tol;

  /* 入る形：リングのどこに当たって、どう弾んで入るか（u＝コートの内側へ・v＝カメラ側へ、の向きで書く。z はボールの中心の高さ） */
  const IN_KINDS = {
    // 手前のリング（コート側）に当たって、上に弾んでから入る
    front: [{ u: 0.21, v: 0, z: 3.17 }, { u: -0.1, v: 0, z: 3.13, h: 3.48, d: 0.36 }],
    // 奥のリング（ボード側）に当たって前へ弾み、もう一度小さく弾んでから入る
    back: [{ u: -0.21, v: 0, z: 3.17 }, { u: 0.12, v: 0, z: 3.16, h: 3.58, d: 0.42 }, { u: -0.04, v: 0, z: 3.11, h: 3.24, d: 0.18 }],
    // カメラ側のリングに当たり、リングの上を転がるように回ってから入る
    roll: [{ u: 0, v: 0.21, z: 3.17 }, { u: 0.2, v: 0.05, z: 3.17, h: 3.23, d: 0.24 }, { u: 0.05, v: -0.16, z: 3.15, h: 3.21, d: 0.24 }, { u: 0, v: 0, z: 3.1, h: 3.15, d: 0.12 }],
    // ボードに当たってから、リングの上で弾んで入る
    board: [{ u: CT.boardFromBaseline - CT.rimFromBaseline + 0.13, v: 0.05, z: 3.36 }, { u: 0.16, v: 0, z: 3.16, h: 3.4, d: 0.3 }, { u: 0, v: 0, z: 3.1, h: 3.26, d: 0.2 }]
  };
  /* 外れる形：最後の点から、リバウンドへ（元のリバウンドの着地点へ向かう） */
  const OUT_KINDS = {
    // 手前のリングに当たり、奥のリングでも弾んで外へ
    frontback: [{ u: 0.21, v: 0, z: 3.17 }, { u: -0.2, v: 0, z: 3.2, h: 3.5, d: 0.3 }],
    // カメラ側のリングに当たって、ネットの手前（カメラ側）へ落ちる。映像ではネットの前を落ちるので、入ったように見えやすい
    nearfall: [{ u: 0.05, v: 0.21, z: 3.17 }, { u: 0.12, v: 0.62, z: 2.25, h: 3.3, d: 0.36 }],
    // リングの上を回ってから、こぼれる（イン・アンド・アウト）
    around: [{ u: -0.2, v: 0, z: 3.17 }, { u: 0, v: 0.2, z: 3.18, h: 3.26, d: 0.2 }, { u: 0.2, v: 0.02, z: 3.18, h: 3.25, d: 0.2 }]
  };

  function rimPlay(game, opts) {
    opts = opts || {};
    const R = BS.rng(opts.seed || 11);
    const tr = game.track;
    const segs = tr.ball;
    tr.rimHits = tr.rimHits || [];
    const per = (t) => game.periods.filter((p) => t >= p.t0).length;
    const out = [];
    let nIn = 0, nOut = 0;
    const inKinds = Object.keys(IN_KINDS), outKinds = Object.keys(OUT_KINDS);
    game.events.filter((e) => e.type === 'shot' && !e.blk).forEach((e) => {
      const side = ((e.team === 0) === (per(e.t) <= 2)) ? 1 : 0;
      const d = side === 0 ? 1 : -1;
      const rimX = (side === 0 ? 0 : CT.L) + d * CT.rimFromBaseline;
      const P = (q) => [r2(rimX + d * q.u), r2(7.5 + q.v), r2(q.z)];
      // シュートの飛行（放った時刻に始まり、リングの真ん中で終わる air）
      const k = segs.findIndex((s) => s.k === 'air' && near(s.t0, e.t, 0.011) && near(s.b[0], rimX, 0.02) && near(s.b[1], 7.5, 0.02) && near(s.b[2], CT.rimH, 0.02));
      if (k < 0 || k + 2 >= segs.length) return;
      const T = segs[k].t1;
      if (e.made) {
        if (R.next() >= (opts.makes != null ? opts.makes : 0.6)) return;
        const drop = segs[k + 1], land = segs[k + 2];
        if (drop.k !== 'air' || land.k !== 'free' || !near(drop.t0, T, 0.011)) return;
        const kind = inKinds[nIn++ % inKinds.length];
        const path = IN_KINDS[kind];
        const pts = path.map(P);
        const repl = [];
        let t = T;
        const hits = [r2(T)];
        for (let i = 1; i < path.length; i++) {
          repl.push({ k: 'air', a: pts[i - 1], b: pts[i], h: path[i].h, t0: r2(t), t1: r2(t + path[i].d) });
          t += path[i].d;
          if (i < path.length - 1 || path[i].z > CT.rimH + 0.06) hits.push(r2(t));
        }
        const tIn = t;
        const dropEnd = tIn + (drop.t1 - drop.t0);
        if (land.t1 - dropEnd < 0.12) return;
        segs[k].b = pts[0];
        repl.push({ k: 'air', a: pts[pts.length - 1], b: drop.b, h: pts[pts.length - 1][2], t0: r2(tIn), t1: r2(dropEnd) });
        repl.push(Object.assign({}, land, { t0: r2(dropEnd) }));
        segs.splice(k + 1, 2, ...repl);
        // 得点（ネットが揺れて、ボールがネットの中で減速する見た目）は、ボールがネットに入る時刻から
        const sc = tr.scores.find((s) => near(s.t, T, 0.011));
        if (sc) sc.t = r2(tIn);
        hits.forEach((h) => tr.rimHits.push({ t: h, side, amp: 0.3 }));
        out.push({ t: e.t, made: true, kind, tIn: r2(tIn), hits, side });
      } else {
        if (R.next() >= (opts.misses != null ? opts.misses : 0.6)) return;
        const reb = segs[k + 1];
        if (reb.k !== 'air' || !near(reb.t0, T, 0.011)) return;
        const kind = outKinds[nOut++ % outKinds.length];
        const path = OUT_KINDS[kind];
        const pts = path.map(P);
        const repl = [];
        let t = T;
        const hits = [r2(T)];
        for (let i = 1; i < path.length; i++) {
          repl.push({ k: 'air', a: pts[i - 1], b: pts[i], h: path[i].h, t0: r2(t), t1: r2(t + path[i].d) });
          t += path[i].d;
          if (path[i].z > CT.rimH) hits.push(r2(t));
        }
        if (reb.t1 - t < 0.22) return;
        segs[k].b = pts[0];
        const last = pts[pts.length - 1];
        repl.push(Object.assign({}, reb, { a: last, t0: r2(t), h: Math.max(reb.h, last[2] + 0.2) }));
        segs.splice(k + 1, 1, ...repl);
        hits.forEach((h) => tr.rimHits.push({ t: h, side, amp: 0.3 }));
        out.push({ t: e.t, made: false, kind, hits, side });
      }
    });
    tr.rimHits.sort((a, b) => a.t - b.t);
    return out;
  }

  BS.rimPlay = rimPlay;
})(typeof window !== 'undefined' ? window : globalThis);
