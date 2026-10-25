/* 動きのデータ（基本の14）：低いドリブル・クロスオーバー・2ボール・スピードドリブル・スライド・クローズアウト・シュート・レイアップ・
   チェストパス・ジャンプストップ・ボックスアウト・着地・ランジ・トリプルスレット。書き方は js/motion.js の先頭。 */
(function () {
  // 腰を落とした構え（横から・右向き）
  const LOW = BC.mo.LOW;

  BC.motion({ id: 'pound',
    name: '低いドリブル（ポンド）', view: 'side', box: [-0.9, 1.1, -0.05, 1.85], dur: 0.6, guides: ['head'],
    phases: [{ at: 0, label: '押す' }, { at: 0.22, label: '床へ' }, { at: 0.55, label: '手にもどる' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.17 } }, { id: 'look', label: 'ボールを見る', mods: { nod: 38 } }],
    still: 0.2,
    actors: [{ keys: [
      Object.assign({ at: 0 }, LOW),
      { at: 0.22, hip: [0, 0.70], rh: [0.46, 0.50] },
      { at: 0.55, hip: [0, 0.72], rh: [0.43, 0.6] },
      { at: 1, rh: [0.42, 0.64] },
    ] }],
    balls: [{ keys: [{ at: 0, h: 'r', o: [0.03, -0.13] }, { at: 0.22, h: 'r', o: [0.03, -0.13] }, { at: 0.55, p: [0.5, 0.12] }, { at: 1, h: 'r', o: [0.03, -0.13] }] }],
    points: ['腰を落とす（おしりを少しうしろへ）', '頭の高さを変えない・顔を上げる', '指の腹で、床へ強く押しこむ'],
  });

  // 前から：腰を落とした構え
  const FLOW = BC.mo.FLOW;
  BC.motion({ id: 'crossover',
    name: 'クロスオーバー', view: 'front', box: [-1.0, 1.0, -0.05, 1.85], dur: 1.4, guides: ['head'],
    phases: [{ at: 0, label: '右手でつく' }, { at: 0.12, label: '低く前を通す' }, { at: 0.4, label: '左手でうける' }, { at: 0.62, label: '低く前を通す' }, { at: 0.9, label: '右手でうける' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.17 } }],
    still: 0.3,
    actors: [{ keys: [
      Object.assign({ at: 0 }, FLOW, { hip: [0.04, 0.7], lean: 4 }),
      { at: 0.15, rh: [0.18, 0.46] },
      { at: 0.3, rh: [0.36, 0.72], lh: [-0.3, 0.6] },
      { at: 0.45, hip: [-0.05, 0.7], lean: -4, lh: [-0.42, 0.62], rh: [0.36, 0.82] },
      { at: 0.5 },
      { at: 0.65, lh: [-0.18, 0.46] },
      { at: 0.8, lh: [-0.36, 0.72], rh: [0.3, 0.6] },
      { at: 0.95, hip: [0.04, 0.7], lean: 4, rh: [0.42, 0.62], lh: [-0.36, 0.82] },
      { at: 1 },
    ] }],
    balls: [{ keys: [
      { at: 0, h: 'r', o: [0, -0.13] }, { at: 0.15, h: 'r', o: [0, -0.13] }, { at: 0.3, p: [0, 0.12] },
      { at: 0.45, h: 'l', o: [0, -0.13] }, { at: 0.5, h: 'l', o: [0, -0.13] }, { at: 0.65, h: 'l', o: [0, -0.13] }, { at: 0.8, p: [0, 0.12] },
      { at: 0.95, h: 'r', o: [0, -0.13] }, { at: 1, h: 'r', o: [0, -0.13] },
    ] }],
    points: ['ひざより下の低さで、体の前を速く通す', '顔は上げたまま（ボールを見ない）', '受けた手の反対の腕で、ボールを守る'],
  });

  BC.motion({ id: 'twoball',
    name: '2ボール・ドリブル', view: 'front', box: [-1.0, 1.0, -0.05, 1.85], dur: 0.6, guides: ['head'],
    phases: [{ at: 0, label: '同時に押す' }, { at: 0.22, label: '床へ' }, { at: 0.55, label: '手にもどる' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.17 } }],
    still: 0.2,
    actors: [{ keys: [
      Object.assign({ at: 0 }, FLOW, { rh: [0.42, 0.64], lh: [-0.42, 0.64] }),
      { at: 0.22, hip: [0, 0.68], rh: [0.45, 0.5], lh: [-0.45, 0.5] },
      { at: 0.55, hip: [0, 0.7], rh: [0.43, 0.6], lh: [-0.43, 0.6] },
      { at: 1, rh: [0.42, 0.64], lh: [-0.42, 0.64] },
    ] }],
    balls: [
      { keys: [{ at: 0, h: 'r', o: [0, -0.13] }, { at: 0.22, h: 'r', o: [0, -0.13] }, { at: 0.55, p: [0.47, 0.12] }, { at: 1, h: 'r', o: [0, -0.13] }] },
      { keys: [{ at: 0, h: 'l', o: [0, -0.13] }, { at: 0.22, h: 'l', o: [0, -0.13] }, { at: 0.55, p: [-0.47, 0.12] }, { at: 1, h: 'l', o: [0, -0.13] }] },
    ],
    points: ['左右を同じ高さ・同じ強さで', '弱い手のリズムに合わせる', '顔を上げて、前を見る'],
  });



  BC.motion({ id: 'speed',
    name: 'スピードドリブル', view: 'side', box: [-1.0, 1.4, -0.05, 1.9], dur: 0.9,
    phases: [{ at: 0, label: '前へ押し出す' }, { at: 0.5, label: '走って追いつく' }],
    mistakes: [{ id: 'look', label: 'ボールを見る', mods: { nod: 40 } }],
    still: 0.25,
    scroll: [{ at: 0, v: 0 }, { at: 1, v: 1.6 }],
    actors: [{ keys: BC.mo.runKeys(0, 1, { h: 0.88, lean: 18, arms: (u) => ({ rh: [0.52, 0.98 - 0.16 * Math.sin(u * Math.PI * 2)], lh: u < 0.5 ? [-0.1 + 0.4 * u, 0.9] : [0.3 - 0.4 * (u - 0.5), 1.05] }) }) }],
    balls: [{ keys: [{ at: 0, h: 'r', o: [0.05, -0.12] }, { at: 0.12, h: 'r', o: [0.08, -0.12] }, { at: 0.5, p: [0.95, 0.12] }, { at: 1, h: 'r', o: [0.05, -0.12] }] }],
    points: ['ボールを前へ押し出して、走りながら追いつく', 'つく回数を少なく（3〜4歩で1回）', '顔を上げて、前の空いている所を見る'],
  });

  // ディフェンスのスライド（前から・守り）。右へ3回・左へ3回
  function slideKeys() {
    const k = [];
    const H = 0.66, W = 0.3, step = 0.26;
    let x = -0.39;
    const pose = (x, at, wide, dir) => ({
      at, hip: [x + (wide ? dir * 0.1 : 0), H], lean: 0, nod: 0,
      rf: [x + W + (wide && dir > 0 ? 0.22 : 0), wide && dir > 0 ? 0.04 : 0],
      lf: [x - W - (wide && dir < 0 ? 0.22 : 0), wide && dir < 0 ? 0.04 : 0],
      rh: [x + 0.55 + (wide ? dir * 0.1 : 0), dir > 0 ? 1.05 : 0.7], lh: [x - 0.55 + (wide ? dir * 0.1 : 0), dir > 0 ? 0.7 : 1.05],
    });
    let t = 0;
    const dt = 1 / 12;
    for (const dir of [1, -1]) {
      for (let i = 0; i < 3; i++) {
        k.push(pose(x, t, false, dir));
        k.push(pose(x, t + dt * 0.55, true, dir));
        x += dir * step;
        t += dt * 2;
      }
    }
    k.push(pose(x, 1, false, 1));
    return k;
  }
  BC.motion({ id: 'defslide',
    name: 'ディフェンスのスライド', view: 'front', box: [-1.4, 1.4, -0.05, 1.85], dur: 3.0, guides: ['head'],
    phases: [{ at: 0, label: '右へスライド' }, { at: 0.5, label: '左へスライド' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.18, hands: true } }, { id: 'bob', label: '頭が上下にはねる', mods: { bob: 0.11, freq: 6 } }],
    still: 0.1,
    actors: [{ role: 'x', keys: slideKeys() }],
    balls: [],
    points: ['足を交差させない（出す足→寄せる足）', '頭の高さを変えない（上下にはねない）', '手を広げて、パスとドリブルのコースを消す'],
  });



  // クローズアウト（横から・守りは右向き、シューターは左向き）
  (function () {
    const run = BC.mo.steps(0.08, 0.42, { r: -1.75, l: -1.95 }, [['r', -1.35], ['l', -0.95], ['r', -0.6]], { h: 0.9, lean: 16, ahead: 0.1,
      arms: (f, i) => (i % 2 < 1 ? { rh: [f.r - 0.05, 0.9], lh: [f.l + 0.45, 1.1] } : { rh: [f.r + 0.4, 1.1], lh: [f.l - 0.05, 0.9] }) });
    const chop = BC.mo.steps(0.42, 0.66, run.feet, [['l', -0.55], ['r', -0.42], ['l', -0.44], ['r', -0.32]], { h: 0.74, lean: 22, ahead: 0.06, lift: 0.05,
      arms: (f) => ({ rh: [f.r + 0.25, 1.75], lh: [f.l + 0.5, 0.7] }) });
    const last = { at: 0.72, hip: [-0.36, 0.7], lean: 18, rf: [-0.24, 0], lf: [-0.52, 0], rh: [-0.06, 2.0], lh: [-0.02, 0.72] };
    BC.motion({ id: 'closeout',
      name: 'クローズアウト', view: 'side', box: [-2.3, 1.1, -0.05, 2.2], dur: 2.4, fade: true,
      phases: [{ at: 0, label: 'まつ' }, { at: 0.08, label: '全力で走る' }, { at: 0.42, label: '小さく速いステップ' }, { at: 0.68, label: '手を上げて止まる' }],
        still: 0.72,
      actors: [
        { role: 'x', keys: [{ at: 0, hip: [-1.77, 0.78], lean: 22, nod: -15, rf: [-1.65, 0], lf: [-1.95, 0], rh: [-1.5, 1.0], lh: [-1.55, 0.95] }, ...run.keys.slice(1), ...chop.keys.slice(1), last, { at: 1 }] },
        { role: 'o', face: -1, keys: [{ at: 0, hip: [0.62, 0.86], lean: 6, nod: 0, rf: [0.52, 0], lf: [0.72, 0], rh: [0.36, 1.2], lh: [0.42, 1.18] }, { at: 0.5, hip: [0.62, 0.84] }, { at: 1, hip: [0.62, 0.86] }] },
      ],
      balls: [{ keys: [{ at: 0, a: 1, h: 'both', o: [-0.06, 0] }, { at: 1, a: 1, h: 'both', o: [-0.06, 0] }] }],
      points: ['最初は全力で走り、最後の数歩は小さく速く（チョップステップ）', '腰を落として止まり、シューターに手を上げる', '近づきすぎない（腕1本の間合い）'],
    });
  })();

  // シュート（横から・右にゴール）
  const HOOP = 2.15; // リングの中心の x（近くからのフォームシューティングの距離）
  BC.motion({ id: 'shoot',
    name: 'シュート（ジャンプシュート）', view: 'side', box: [-1.35, 2.75, -0.05, 4.05], dur: 2.6, fade: true, hoop: HOOP,
    phases: [{ at: 0, label: 'かまえ' }, { at: 0.12, label: 'しずむ' }, { at: 0.26, label: 'セット' }, { at: 0.36, label: 'のびて放す' }, { at: 0.48, label: 'フォロースルー' }],
    mistakes: [{ id: 'stiff', label: 'ひざを使わない', mods: { stiff: true } }],
    still: 0.42,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.9], lean: 6, nod: -6, rf: [0.1, 0], lf: [-0.1, 0], rh: [0.3, 1.08], lh: [0.24, 1.12] },
      { at: 0.18, hip: [0, 0.76], lean: 14, rh: [0.34, 1.0], lh: [0.27, 1.04] },
      { at: 0.25, hip: [0, 0.84], lean: 9, rh: [0.44, 1.42], lh: [0.37, 1.44] }, // ボールを体の前で持ち上げる（ひじは L字のまま）
      { at: 0.32, hip: [0, 0.92], lean: 4, rh: [0.2, 1.78], lh: [0.12, 1.74] },
      { at: 0.42, hip: [0, 1.0], lean: 2, rf: [0.1, 0.08], lf: [-0.1, 0.08], rh: [0.32, 2.14], lh: [0.16, 1.82] },
      { at: 0.55, hip: [0, 0.94], rf: [0.1, 0], lf: [-0.1, 0], rh: [0.36, 2.1], lh: [0.18, 1.75] },
      { at: 0.86, hip: [0, 0.9] },
      { at: 1, hip: [0, 0.9], lean: 6, rh: [0.3, 1.08], lh: [0.24, 1.12] },
    ] }],
    balls: [{ keys: [
      { at: 0, h: 'both', o: [0.06, 0.02] }, { at: 0.18, h: 'both', o: [0.06, 0.02] },
      { at: 0.25, h: 'r', o: [-0.02, 0.12] }, { at: 0.32, h: 'r', o: [0.02, 0.13] }, { at: 0.42, h: 'r', o: [0.04, 0.13] },
      { at: 0.78, p: [HOOP, 3.18], arc: 0.75 }, { at: 0.86, p: [HOOP, 2.62] }, { at: 0.96, p: [HOOP - 0.1, 0.12] }, { at: 1, p: [HOOP - 0.1, 0.12] },
    ] }],
    points: ['ひざを曲げて、のばす力で打つ（腕だけで打たない）', '肘はリングへ、足・ひざ・肘・手首が1本の線', 'リリースのあと、手首をたおしたまま（フォロースルー）'],
  });

  // レイアップ（横から・右にゴール）
  (function () {
    const R = 1.0; // 右のゴールに近づく（リングの中心は R + 0.15）
    BC.motion({ id: 'layup',
      name: 'レイアップ（ランニングシュート）', view: 'side', box: [-2.9, 1.55, -0.05, 4.2], dur: 2.6, fade: true, hoop: R + 0.15,
      phases: [{ at: 0, label: 'ドリブル' }, { at: 0.14, label: '1歩目（右）' }, { at: 0.3, label: '2歩目（左）' }, { at: 0.42, label: '上へとぶ' }, { at: 0.6, label: 'ボードへ' }, { at: 0.74, label: '着地' }],
        still: 0.56,
      actors: [{ keys: [
        { at: 0, hip: [-2.15, 0.86], lean: 14, nod: -8, rf: [-2.05, 0], lf: [-2.35, 0], rh: [-1.85, 0.95], lh: [-1.9, 1.0] },
        { at: 0.1, hip: [-1.85, 0.9], lf: [-1.95, 0.16], rf: [-2.0, 0] },
        { at: 0.2, hip: [-1.55, 0.86], rf: [-1.45, 0], lf: [-1.8, 0.12], rh: [-1.3, 1.12], lh: [-1.35, 1.14] },
        { at: 0.28, hip: [-1.22, 0.88], lf: [-1.15, 0.14], rf: [-1.4, 0] },
        { at: 0.36, hip: [-0.95, 0.8], lean: 10, lf: [-0.85, 0], rf: [-1.2, 0.18], rh: [-0.75, 1.25], lh: [-0.8, 1.22] },
        { at: 0.46, hip: [-0.62, 1.12], lean: 4, lf: [-0.7, 0.06], rf: [-0.42, 0.62], rh: [-0.38, 2.05], lh: [-0.5, 1.6] },
        { at: 0.56, hip: [-0.3, 1.48], lean: 2, nod: -2, lf: [-0.4, 0.46], rf: [-0.12, 0.92], rh: [0.0, 2.55], lh: [-0.22, 1.85] },
        { at: 0.66, hip: [-0.05, 1.3], lf: [-0.1, 0.3], rf: [0.05, 0.42], rh: [0.18, 2.4], lh: [-0.02, 1.7] },
        { at: 0.78, hip: [0.1, 0.72], lean: 22, lf: [-0.02, 0], rf: [0.22, 0], rh: [0.42, 1.1], lh: [0.3, 1.05] },
        { at: 1 },
      ] }],
      balls: [{ keys: [
        { at: 0, h: 'both', o: [0.06, 0] }, { at: 0.36, h: 'both', o: [0.06, 0] },
        { at: 0.46, h: 'r', o: [0.03, 0.13] }, { at: 0.58, h: 'r', o: [0.03, 0.13] },
        { at: 0.68, p: [R + 0.52, 3.45], arc: 0.25 }, { at: 0.76, p: [R + 0.15, 3.12] }, { at: 0.84, p: [R + 0.15, 2.6] },
        { at: 0.96, p: [R + 0.05, 0.12] }, { at: 1, p: [R + 0.05, 0.12] },
      ] }],
      points: ['右手で打つときは「右・左」で踏み切り（左足でジャンプ）', '右ひざを高く上げて、上へ跳ぶ（前へ流れない）', 'ボードの四角の上の角をねらう'],
    });
  })();

  // チェストパス（横から・パスの人は右向き、受け手は左向き）
  BC.motion({ id: 'chestpass',
    name: 'チェストパス', view: 'side', box: [-0.8, 3.6, -0.05, 2.0], dur: 1.8, fade: true,
    phases: [{ at: 0, label: 'かまえ' }, { at: 0.12, label: 'ふみ出す' }, { at: 0.28, label: '押し出す' }, { at: 0.45, label: 'とどく' }],
    still: 0.32,
    actors: [
      { keys: [
        { at: 0, hip: [0, 0.82], lean: 12, nod: -8, rf: [0.12, 0], lf: [-0.18, 0], rh: [0.32, 1.12], lh: [0.26, 1.14] },
        { at: 0.18, hip: [0.12, 0.8], rf: [0.45, 0.06], rh: [0.36, 1.12], lh: [0.3, 1.14] },
        { at: 0.32, hip: [0.2, 0.8], lean: 16, rf: [0.5, 0], rh: [0.82, 1.08], lh: [0.78, 1.1] },
        { at: 0.6 },
        { at: 0.9, hip: [0, 0.82], lean: 12, rf: [0.12, 0], rh: [0.32, 1.12], lh: [0.26, 1.14] },
        { at: 1 },
      ] },
      { role: 'o', face: -1, keys: [
        { at: 0, hip: [2.95, 0.84], lean: 10, nod: -6, rf: [2.85, 0], lf: [3.1, 0], rh: [2.62, 1.18], lh: [2.66, 1.2] },
        { at: 0.5, hip: [2.98, 0.82], rh: [2.66, 1.16], lh: [2.7, 1.18] },
        { at: 1 },
      ] },
    ],
    balls: [{ keys: [
      { at: 0, h: 'both', o: [0.08, 0] }, { at: 0.2, h: 'both', o: [0.08, 0] }, { at: 0.32, h: 'both', o: [0.1, 0] },
      { at: 0.5, a: 1, h: 'both', o: [-0.08, 0] }, { at: 1, a: 1, h: 'both', o: [-0.08, 0] },
    ] }],
    points: ['受け手の胸（手を出している所）をねらう', '一歩ふみ出して、体重をボールにのせる', '親指を下に返して、手のひらを外へ'],
  });

  // ジャンプストップ（その場で走って、両足で止まる）
  BC.motion({ id: 'jumpstop',
    name: 'ジャンプストップ', view: 'side', box: [-1.1, 1.3, -0.05, 1.9], dur: 2.2, fade: true,
    phases: [{ at: 0, label: '走る' }, { at: 0.44, label: '小さくとぶ' }, { at: 0.56, label: '両足で止まる' }],
    mistakes: [{ id: 'tall', label: '止まるとき腰が高い', mods: { stiffAfter: 0.54 } }],
    still: 0.62,
    scroll: [{ at: 0, v: 0 }, { at: 0.44, v: 1.6 }, { at: 0.56, v: 2.1 }, { at: 1, v: 2.1 }],
    actors: [{ keys: [
      ...BC.mo.runKeys(0, 0.44, { h: 0.9, lean: 12, arms: () => ({ rh: [0.3, 1.05], lh: [0.24, 1.08] }) }),
      { at: 0.5, hip: [0, 1.04], lean: 8, rf: [0.12, 0.2], lf: [-0.12, 0.22], lin: false },
      { at: 0.58, hip: [0, 0.7], lean: 26, nod: -20, rf: [0.16, 0], lf: [-0.16, 0] },
      { at: 0.9 },
      { at: 1 },
    ] }],
    balls: [{ keys: [{ at: 0, h: 'both', o: [0.06, 0] }, { at: 1, h: 'both', o: [0.06, 0] }] }],
    points: ['両足で同時に着地する（どちらの足も軸足にできる）', '着地はひざを曲げて、低く止まる', 'ボールはあごの前で、ひじを張って守る'],
  });

  // ボックスアウト（横から・守りは右のゴールを向いて、うしろの相手に当たる）
  BC.motion({ id: 'boxout',
    name: 'ボックスアウト', view: 'side', box: [-1.0, 3.3, -0.05, 4.2], dur: 2.8, fade: true, hoop: 2.75,
    phases: [{ at: 0, label: 'シュートを見る' }, { at: 0.1, label: '相手に当たる' }, { at: 0.6, label: 'とぶ' }, { at: 0.74, label: '両手でとる' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.2, hands: true } }],
    still: 0.4,
    actors: [
      { role: 'x', keys: [
        { at: 0, hip: [0.75, 0.9], lean: 6, nod: 0, rf: [0.85, 0], lf: [0.62, 0], rh: [0.95, 1.05], lh: [0.9, 1.0] },
        { at: 0.2, hip: [0.55, 0.66], lean: 22, nod: -26, rf: [0.88, 0], lf: [0.2, 0], rh: [0.95, 1.5], lh: [0.78, 1.46] },
        { at: 0.55, hip: [0.52, 0.64] },
        { at: 0.64, hip: [0.6, 0.6], lean: 18 },
        { at: 0.72, hip: [0.72, 1.22], lean: 4, nod: -10, rf: [0.82, 0.34], lf: [0.6, 0.36], rh: [0.98, 2.35], lh: [0.88, 2.32] },
        { at: 0.84, hip: [0.7, 0.68], lean: 20, nod: -10, rf: [0.9, 0], lf: [0.45, 0], rh: [0.98, 1.24], lh: [0.9, 1.22] },
        { at: 1 },
      ] },
      { role: 'o', keys: [
        { at: 0, hip: [0.12, 0.88], lean: 10, nod: -10, rf: [0.22, 0], lf: [-0.02, 0], rh: [0.4, 1.0], lh: [0.35, 1.02] },
        { at: 0.2, hip: [0.0, 0.84], lean: 24, rf: [0.12, 0], lf: [-0.2, 0], rh: [0.32, 1.25], lh: [0.28, 1.2] },
        { at: 0.6, hip: [-0.04, 0.84] },
        { at: 0.75, hip: [-0.04, 0.95], lean: 10, rh: [0.22, 1.7], lh: [0.18, 1.65] },
        { at: 1 },
      ] },
    ],
    balls: [{ keys: [
      { at: 0, p: [1.4, 4.05] }, { at: 0.4, p: [2.62, 3.15], arc: 0.25 }, { at: 0.64, p: [1.25, 2.55], arc: 0.35 },
      { at: 0.72, a: 0, h: 'both', o: [0.06, 0.06] }, { at: 0.84, a: 0, h: 'both', o: [0.08, 0] }, { at: 1, a: 0, h: 'both', o: [0.08, 0] },
    ] }],
    points: ['シュートが打たれたら、まず相手を見て体を当てる', '腰を落とし、足は広く・おしりで相手を押さえる', 'ボールは両手で、いちばん高いところで取る'],
  });

  // 着地（ケガ予防）
  BC.motion({ id: 'landing',
    name: '着地（やわらかく止まる）', view: 'side', box: [-0.9, 1.1, -0.05, 2.6], dur: 2.0,
    phases: [{ at: 0, label: '立つ' }, { at: 0.1, label: 'しずむ' }, { at: 0.26, label: 'とぶ' }, { at: 0.48, label: 'ひざで吸収' }],
    mistakes: [{ id: 'stiff', label: 'ひざで吸収しない', mods: { stiffAfter: 0.5 } }],
    still: 0.6,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.9], lean: 6, nod: 0, rf: [0.08, 0], lf: [-0.08, 0], rh: [0.1, 0.9], lh: [0.06, 0.92] },
      { at: 0.16, hip: [-0.02, 0.68], lean: 30, nod: -20, rh: [-0.3, 0.82], lh: [-0.34, 0.84] },
      { at: 0.3, hip: [0, 1.22], lean: 2, nod: 0, rf: [0.06, 0.32], lf: [-0.08, 0.32], rh: [0.22, 2.15], lh: [0.18, 2.12] },
      { at: 0.42, hip: [0, 1.28], rf: [0.06, 0.36], lf: [-0.08, 0.36] },
      { at: 0.56, hip: [-0.04, 0.64], lean: 32, nod: -22, rf: [0.08, 0], lf: [-0.08, 0], rh: [0.42, 1.0], lh: [0.38, 1.02] },
      { at: 0.82 },
      { at: 1, hip: [0, 0.9], lean: 6, nod: 0, rh: [0.1, 0.9], lh: [0.06, 0.92] },
    ] }],
    balls: [],
    points: ['つま先から着地して、ひざと股関節で吸収する', 'ひざはつま先と同じ向き（内側に入れない）', '着地の音を小さく'],
  });

  // 着地（前から）：ひざがつま先と同じ向きか（ニーイン）を見せる
  BC.motion({ id: 'landing-front',
    name: '着地（前から：ひざの向き）', view: 'front', box: [-1.0, 1.0, -0.05, 2.6], dur: 2.0,
    phases: [{ at: 0, label: '立つ' }, { at: 0.1, label: 'しずむ' }, { at: 0.26, label: 'とぶ' }, { at: 0.48, label: 'ひざで吸収' }],
    mistakes: [{ id: 'kneein', label: 'ひざが内に入る', mods: { kneeIn: 0.48 } }, { id: 'stiff', label: 'ひざで吸収しない', mods: { stiffAfter: 0.5 } }],
    still: 0.6,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.9], lean: 0, nod: 0, rf: [0.15, 0], lf: [-0.15, 0], rh: [0.3, 0.86], lh: [-0.3, 0.86] },
      { at: 0.16, hip: [0, 0.7], rh: [0.34, 0.66], lh: [-0.34, 0.66] },
      { at: 0.3, hip: [0, 1.22], rf: [0.13, 0.32], lf: [-0.13, 0.32], rh: [0.28, 2.12], lh: [-0.28, 2.12] },
      { at: 0.42, hip: [0, 1.28], rf: [0.13, 0.36], lf: [-0.13, 0.36] },
      { at: 0.56, hip: [0, 0.66], rf: [0.16, 0], lf: [-0.16, 0], rh: [0.4, 0.98], lh: [-0.4, 0.98] },
      { at: 0.82 },
      { at: 1, hip: [0, 0.9], rh: [0.3, 0.86], lh: [-0.3, 0.86] },
    ] }],
    balls: [],
    points: ['ひざは つま先と同じ向き（内側に入れない）', '両足に 同じように体重をのせる', 'つま先から着地して、ひざと股関節で吸収する'],
  });

  // ランジ（ダイナミック・ウォームアップ）
  BC.motion({ id: 'lunge',
    name: 'ランジ（動きながらのストレッチ）', view: 'side', box: [-1.0, 1.3, -0.05, 2.3], dur: 3.6,
    phases: [{ at: 0, label: '立つ' }, { at: 0.08, label: '右足を前へ' }, { at: 0.4, label: 'もどる' }, { at: 0.58, label: '左足を前へ' }, { at: 0.9, label: 'もどる' }],
    still: 0.3,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.9], lean: 0, nod: 0, rf: [0.06, 0], lf: [-0.06, 0], rh: [0.04, 0.9], lh: [0, 0.9] },
      { at: 0.2, hip: [0.18, 0.55], lean: 2, rf: [0.62, 0], lf: [-0.42, 0], rh: [0.22, 2.05], lh: [0.18, 2.05] },
      { at: 0.36 },
      { at: 0.5, hip: [0, 0.9], lean: 0, rf: [0.06, 0], lf: [-0.06, 0], rh: [0.04, 0.9], lh: [0, 0.9] },
      { at: 0.7, hip: [0.18, 0.55], lean: 2, lf: [0.62, 0], rf: [-0.42, 0], rh: [0.22, 2.05], lh: [0.18, 2.05] },
      { at: 0.86 },
      { at: 1, hip: [0, 0.9], lean: 0, rf: [0.06, 0], lf: [-0.06, 0], rh: [0.04, 0.9], lh: [0, 0.9] },
    ] }],
    balls: [],
    points: ['前のひざは、つま先より前に出しすぎない', 'うしろのひざは床の近くまで下げる', '反動をつけず、ゆっくり大きく'],
  });

  // トリプルスレット（構え → ジャブステップ → ショットフェイク）
  BC.motion({ id: 'stance',
    name: 'トリプルスレット（ジャブ・ショットフェイク）', view: 'side', box: [-0.9, 1.3, -0.05, 2.0], dur: 2.0,
    phases: [{ at: 0, label: 'かまえ' }, { at: 0.08, label: 'ジャブステップ' }, { at: 0.3, label: 'もどる' }, { at: 0.58, label: 'ショットフェイク' }, { at: 0.8, label: 'もどる' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.18, hands: true } }],
    still: 0.04,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.76], lean: 24, nod: -20, rf: [0.12, 0], lf: [-0.2, 0], rh: [0.32, 0.86], lh: [0.24, 0.92] },
      { at: 0.2, hip: [0.1, 0.72], lean: 30, rf: [0.45, 0], rh: [0.36, 0.84], lh: [0.28, 0.9] },
      { at: 0.38, hip: [0, 0.76], lean: 24, rf: [0.12, 0], rh: [0.32, 0.86], lh: [0.24, 0.92] },
      { at: 0.55 },
      { at: 0.7, hip: [0, 0.76], lean: 16, nod: -10, rh: [0.26, 1.58], lh: [0.18, 1.6] },
      { at: 0.85, hip: [0, 0.76], lean: 24, nod: -20, rh: [0.32, 0.86], lh: [0.24, 0.92] },
      { at: 1 },
    ] }],
    balls: [{ keys: [{ at: 0, h: 'both', o: [0.06, 0] }, { at: 1, h: 'both', o: [0.06, 0] }] }],
    points: ['ボールは腰の横で持つ（シュート・パス・ドリブルのどれでもできる）', 'ジャブステップは小さく速く、軸足は動かさない', 'ショットフェイクは、ひざを伸ばさない（すぐ抜ける）'],
  });


  BC.motionLink({
    // ドリブル
    'd-pound': 'pound', 'd-headup': 'pound', 'd-protect': 'pound', 'd-tennisball': 'pound', 'd-handling': 'pound',
    'd-2ball': 'twoball', 'd-zigzag': 'crossover', 'd-moves': 'crossover', 'd-1v2-dribble': 'crossover',
    'd-speed-dribble': 'speed', 'd-dribble-tag': 'speed',
    // シュート
    'd-formshoot': 'shoot', 'd-around': 'shoot', 'd-catchshoot': 'shoot', 'd-pullup': 'shoot', 'd-ft': 'shoot', 'd-ftpressure': 'shoot',
    'd-partner': 'shoot', 'd-beatpro': 'shoot', 'd-knockout': 'shoot', 'd-curlshoot': 'shoot', 'd-contested': 'shoot', 'd-fatigue-shoot': 'shoot',
    // フィニッシュ
    'd-mikan': 'layup', 'd-layup-lines': 'layup', 'd-layup-step': 'layup', 'd-weakhand-layup': 'layup', 'd-contact-finish': 'layup', 'd-chase': 'layup',
    // パス
    'd-partner-pass': 'chestpass', 'd-3man-weave': 'chestpass', 'd-starpass': 'chestpass', 'd-2ball-pass': 'chestpass', 'd-pivot-pass': 'chestpass', 'd-meet': 'chestpass', 'd-keepaway': 'chestpass',
    // フットワーク・1対1
    'd-jumpstop': 'jumpstop', 'd-triple': 'stance', 'd-shotfake': 'stance', 'd-1v1-wing': 'stance', 'd-attack-closeout': 'stance',
    // 守り
    'd-stance': 'defslide', 'd-zigzag-d': 'defslide', 'd-mirror': 'defslide', 'd-ballpressure': 'defslide', 'd-reaction': 'defslide',
    'd-closeout': 'closeout',
    // リバウンド
    'd-boxout': 'boxout', 'd-circle-boxout': 'boxout', 'd-rebound-war': 'boxout',
    // からだ
    'd-landing': 'landing', 'd-dynamic': 'lunge',
    // 改善の視点
    'v-drb-low': 'pound', 'v-drb-eyes': 'pound', 'v-drb-protect': 'pound', 'v-drb-change': 'crossover', 'v-drb-weak': 'twoball',
    'v-shoot-base': 'shoot', 'v-shoot-hold': 'shoot', 'v-shoot-release': 'shoot', 'v-shoot-arc': 'shoot', 'v-shoot-rhythm': 'shoot', 'v-shoot-ready': 'shoot', 'v-shoot-range': 'shoot',
    'v-fin-step': 'layup', 'v-fin-board': 'layup', 'v-fin-hand': 'layup',
    'v-pass-target': 'chestpass', 'v-pass-catch': 'chestpass',
    'v-foot-stop': 'jumpstop', 'v-foot-triple': 'stance', 'v-atk-fake': 'stance',
    'v-def-stance': 'defslide', 'v-def-feet': 'defslide', 'v-def-closeout': 'closeout',
    'v-reb-contact': 'boxout', 'v-reb-hands': 'boxout',
    'v-body-injury': 'landing-front',
  });
})();
