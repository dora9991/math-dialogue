/* 人のアニメーション：練習メニュー・改善の視点の「動き」を、体のある人の絵で見せる。
   動きのデータは data/motions-*.js（BC.motion({...}) で登録）。ここは、動かすしくみ・描くしくみ・再生の部品。

   ■ 動きのデータ（BC.motion に渡すもの）
     id        英小文字・数字・-（例：'pound'）
     name      名前（例：'低いドリブル（ポンド）'）
     view      'side'（横から。face=1 で右向き）| 'front'（前から。r は画面の右、l は画面の左の手足）
     box       見せる範囲 [x の左, x の右, 高さの下, 高さの上]（m。床が 0）
     dur       1回の秒数
     actors    人 [{ role: ''|'o'|'x', face: 1|-1, keys: [...] }]（role：''＝自分（オレンジ）・'o'＝攻め（青）・'x'＝守り（赤））
     balls     ボール [{ keys: [...] }]
     phases    場面の名前 [{ at: 0〜1, label: 'しずむ' }]（ボタンで、その場面へ行ける）
     mistakes  よくない形 [{ id, label: '腰が高い', mods: { … } }]（下の「よくない形の作り方」）
     points    ポイント（3つ前後。子どもにも分かる言葉）
     hoop      ゴールのリングの x（あるときだけ。高さは 3.05m）
     scroll    床の目印を流す [{ at, v: 流れた m }]（その場で走るとき）
     fade      true：くり返しのつなぎ目を、ふっと消す
     guides    ['head']：はじめの頭の高さに点線（「頭の高さを変えない」）
     cones     コーンの x の並び（床の上）

   ■ キー（人）：at（0〜1）と、変える項目だけ。書かない項目は前のキーと同じ。lin: true で直線的に（イーズなし）
       hip [x, 高さ]・lean 体の傾き（度。side は前へ、front は右へ）・nod 頭の傾き（＋で下を向く）
       rf・lf 足首の下（足の位置）[x, 高さ]・rh・lh 手 [x, 高さ]
     位置は m（床が y=0、上がプラス）。ひざ・ひじは自動で曲げる（2関節の IK）。
   ■ キー（ボール）：p [x, 高さ]（その場所）| h 'r'・'l'・'both'（手につける。a で人の番号、o でずらす）。arc：このキーまでを山なりに。
   ■ よくない形の作り方（mods。人 0 だけにかかる）
       hipUp: 0.17    腰を高く（体も起きる）。hands: true なら手も一緒に上がる
       nod: 35        頭を下げる（下を見る）
       stiff: true    ひざを使わない（腰の高さを 0.92 より下げない・とばない）
       bob: 0.1, freq: 6   頭・腰が上下にはねる（freq 回）
       stiffAfter: 0.5     この時刻のあと、ひざを曲げない（着地で吸収しない）
       elbowOut: 0.18      前から見たとき、右ひじが外へ開く（右手が外へずれる）
       kneeIn: 0.5         前から見たとき、この時刻のあと、ひざが内に入る（ニーイン）
       lateRelease: true   ボールを放すのが遅い（未使用なら書かない） */
(function () {
  const BC = window.BC;
  const L = { T: 0.5, N: 0.06, R: 0.115, UA: 0.29, FA: 0.31, TH: 0.44, SH: 0.43, ANK: 0.07, TOE: 0.17, HEEL: 0.06, SW: 0.19, HW: 0.1, BALL: 0.12 };
  // 体の太さ（m）
  const W = { thigh: 0.16, shin: 0.115, ua: 0.1, fa: 0.085, neck: 0.085, ol: 0.022, hand: 0.05, shoe: 0.085, sock: 0.12, shorts: 0.175 };
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  const rad = (d) => (d * Math.PI) / 180;
  const f3 = (n) => (Math.round(n * 1000) / 1000).toString();
  const POSE = ['hip', 'lean', 'nod', 'rf', 'lf', 'rh', 'lh'];
  BC.motions = BC.motions || {};
  BC.motion = function (def) {
    if (Array.isArray(def)) return def.forEach(BC.motion);
    if (!def || !def.id) throw new Error('BC.motion：id がない');
    if (BC.motions[def.id]) throw new Error('BC.motion：id が重複：' + def.id);
    def._b = null;
    BC.motions[def.id] = def;
  };

  /* ---------- 2関節の IK ---------- */
  function ik(a, t, l1, l2, bend) {
    const dx = t[0] - a[0], dy = t[1] - a[1];
    const d = Math.hypot(dx, dy) || 1e-6;
    const dmax = l1 + l2 - 1e-4, dmin = Math.abs(l1 - l2) + 1e-4;
    const dc = Math.max(dmin, Math.min(dmax, d));
    const base = Math.atan2(dy, dx);
    const ang = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc))));
    const c1 = [a[0] + l1 * Math.cos(base + ang), a[1] + l1 * Math.sin(base + ang)];
    const c2 = [a[0] + l1 * Math.cos(base - ang), a[1] + l1 * Math.sin(base - ang)];
    let mid;
    if (typeof bend === 'number') {
      // 横から：a→関節→t の回る向き（左回り +1・右回り -1）で決める（ひざは前、ひじは自然な側）
      const turn = (c) => (c[0] - a[0]) * (t[1] - c[1]) - (c[1] - a[1]) * (t[0] - c[0]);
      mid = turn(c1) * bend >= turn(c2) * bend ? c1 : c2;
    } else {
      const mx = (a[0] + t[0]) / 2, my = (a[1] + t[1]) / 2;
      mid = (c1[0] - mx) * bend[0] + (c1[1] - my) * bend[1] >= (c2[0] - mx) * bend[0] + (c2[1] - my) * bend[1] ? c1 : c2;
    }
    const end = d > dmax ? [mid[0] + l2 * Math.cos(Math.atan2(t[1] - mid[1], t[0] - mid[0])), mid[1] + l2 * Math.sin(Math.atan2(t[1] - mid[1], t[0] - mid[0]))] : t;
    return { mid, end };
  }

  /* ---------- 姿勢 → 関節 ---------- */
  function skeleton(p, view, face) {
    const side = view !== 'front';
    const lean = rad(p.lean || 0);
    const hip = p.hip;
    const ax = side ? face * Math.sin(lean) : Math.sin(lean);
    const ay = Math.cos(lean);
    const sh = [hip[0] + ax * L.T, hip[1] + ay * L.T];
    const nod = rad(p.nod || 0);
    const hx = side ? face * Math.sin(lean + nod) : Math.sin(lean + nod);
    const hy = Math.cos(lean + nod);
    const neck = [sh[0] + hx * L.N, sh[1] + hy * L.N];
    const head = [sh[0] + hx * (L.N + L.R), sh[1] + hy * (L.N + L.R)];
    const px = ay, py = -ax;
    const shR = side ? sh : [sh[0] + px * L.SW, sh[1] + py * L.SW];
    const shL = side ? [sh[0] - face * 0.02, sh[1]] : [sh[0] - px * L.SW, sh[1] - py * L.SW];
    const hpR = side ? hip : [hip[0] + px * L.HW, hip[1] + py * L.HW];
    const hpL = side ? [hip[0] - face * 0.02, hip[1]] : [hip[0] - px * L.HW, hip[1] - py * L.HW];
    // 前から：ひざは外向きに曲げる。kneeIn（よくない形）のときは内向き（ニーイン）
    const kin = p.kneeIn ? -1 : 1;
    const kneeR = side ? -face : [kin, 0], kneeL = side ? -face : [-kin, 0];
    const elbR = side ? face : [1, -0.4], elbL = side ? face : [-1, -0.4];
    const leg = (hp, f, bend) => {
      const r = ik(hp, [f[0], f[1] + L.ANK], L.TH, L.SH, bend);
      if (side) return { knee: r.mid, ank: r.end };
      // 前から：曲げたひざは手前（カメラの方）へ出るので、横へのずれは小さく見える（ニーインのときは内へ大きめに）
      const k = L.TH / (L.TH + L.SH), lx = hp[0] + (r.end[0] - hp[0]) * k, ly = hp[1] + (r.end[1] - hp[1]) * k;
      const sc = p.kneeIn ? 0.55 : 0.4;
      return { knee: [lx + (r.mid[0] - lx) * sc, ly + (r.mid[1] - ly) * sc], ank: r.end };
    };
    const arm = (s, h, bend) => { const r = ik(s, h, L.UA, L.FA, bend); return { elb: r.mid, hand: r.end }; };
    const legR = leg(hpR, p.rf, kneeR), legL = leg(hpL, p.lf, kneeL);
    const armR = arm(shR, p.rh, elbR), armL = arm(shL, p.lh, elbL);
    const foot = (ank, f, which) => {
      if (side) {
        const lift = Math.max(0, Math.min(0.7, (f[1] - 0.02) * 3));
        const c = Math.cos(lift), s = Math.sin(lift);
        const fy = ank[1] - L.ANK;
        return [[ank[0] - face * L.HEEL, fy + 0.035], [ank[0] + face * L.TOE * c, fy - L.TOE * s + 0.035]];
      }
      const o = which === 'r' ? 1 : -1;
      return [[ank[0] - o * 0.02, ank[1] - L.ANK + 0.035], [ank[0] + o * 0.06, ank[1] - L.ANK + 0.03]];
    };
    return {
      view: side ? 'side' : 'front', face, axis: [ax, ay], headAxis: [hx, hy],
      hip, sh, neck, head, shR, shL, hpR, hpL,
      r: { knee: legR.knee, ank: legR.ank, foot: foot(legR.ank, p.rf, 'r'), elb: armR.elb, hand: armR.hand },
      l: { knee: legL.knee, ank: legL.ank, foot: foot(legL.ank, p.lf, 'l'), elb: armL.elb, hand: armL.hand },
    };
  }
  BC.skeleton = skeleton;

  // 3点の角度（度。b が頂点）
  const angle3 = (a, b, c) => {
    const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
    const d = Math.hypot(...v1) * Math.hypot(...v2) || 1;
    return (Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))) * 180) / Math.PI;
  };
  BC.angle3 = angle3;

  /* ---------- キーとフレーム ---------- */
  function fill(keys) {
    const out = [];
    let prev = {};
    for (const k of keys) { const c = Object.assign({}, prev, k); out.push(c); prev = c; }
    return out;
  }
  function seg(keys, t) {
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].at <= t) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const span = b.at - a.at;
    return { a, b, u: span > 0 ? Math.max(0, Math.min(1, (t - a.at) / span)) : 0 };
  }
  function poseAt(keys, t) {
    const { a, b, u } = seg(keys, t);
    const e = b.lin ? u : ease(u);
    const p = {};
    for (const f of POSE) {
      const va = a[f], vb = b[f];
      if (Array.isArray(va)) p[f] = [lerp(va[0], vb[0], e), lerp(va[1], vb[1], e)];
      else p[f] = lerp(va || 0, vb || 0, e);
    }
    return p;
  }
  // よくない形（mods）を姿勢にかける
  function applyMods(p, m, t) {
    if (!m) return p;
    const q = { hip: p.hip.slice(), lean: p.lean, nod: p.nod, rf: p.rf.slice(), lf: p.lf.slice(), rh: p.rh.slice(), lh: p.lh.slice(), kneeIn: p.kneeIn };
    if (m.hipUp) {
      q.hip[1] += m.hipUp;
      q.lean *= 0.45;
      if (m.hands) { q.rh[1] += m.hipUp * 0.8; q.lh[1] += m.hipUp * 0.8; }
    }
    if (m.nod) q.nod += m.nod;
    if (m.stiff) { q.hip[1] = Math.max(q.hip[1], 0.92); q.rf[1] = 0; q.lf[1] = 0; q.lean = Math.min(q.lean, 6); }
    if (m.bob) q.hip[1] += m.bob * Math.abs(Math.sin(t * Math.PI * (m.freq || 6)));
    if (m.stiffAfter != null && t > m.stiffAfter - 0.06) {
      // 足がつく少し前から、ひざをのばす（低い方の足の高さ ＋ 0.86 より腰を下げない。片足で着地しても、着いた足が浮かない）
      const w = Math.min(1, (t - (m.stiffAfter - 0.06)) / 0.06);
      const lowest = Math.min(q.rf[1], q.lf[1]) + 0.86;
      if (q.hip[1] < lowest) q.hip[1] = lerp(q.hip[1], lowest, w);
      q.lean = lerp(q.lean, Math.min(q.lean, 8), w);
    }
    if (m.elbowOut) q.rh[0] += m.elbowOut;
    if (m.kneeIn != null && t >= (m.kneeIn || 0)) q.kneeIn = true;
    return q;
  }
  function build(clip) {
    return {
      actors: clip.actors.map((a) => ({ face: a.face || 1, role: a.role || '', keys: fill(a.keys) })),
      balls: (clip.balls || []).map((b) => ({ keys: b.keys.map((k) => Object.assign({}, k)) })),
    };
  }
  function ballPos(k, sk) {
    if (k.p) return k.p;
    const s = sk[k.a || 0];
    const o = k.o || [0, 0];
    const hnd = k.h === 'both' ? [(s.r.hand[0] + s.l.hand[0]) / 2, (s.r.hand[1] + s.l.hand[1]) / 2] : s[k.h || 'r'].hand;
    return [hnd[0] + o[0], hnd[1] + o[1]];
  }
  // 時刻 t（0〜1）の、人の関節とボールの位置
  BC.motionFrame = function (clip, t, mods) {
    const B = clip._b || (clip._b = build(clip));
    const skAt = (tt) => B.actors.map((ac, i) => skeleton(applyMods(poseAt(ac.keys, tt), i === 0 ? mods : null, tt), clip.view, ac.face));
    const sk = skAt(t);
    const balls = B.balls.map((b) => {
      const { a, b: k, u } = seg(b.keys, t);
      const same = a.h && k.h && a.h === k.h && (a.a || 0) === (k.a || 0) && !a.p && !k.p;
      if (same) {
        const p = ballPos(a, sk), oa = a.o || [0, 0], ob = k.o || [0, 0];
        return [p[0] - oa[0] + lerp(oa[0], ob[0], u), p[1] - oa[1] + lerp(oa[1], ob[1], u)];
      }
      const pa = ballPos(a, skAt(a.at)), pb = ballPos(k, skAt(k.at));
      let y = lerp(pa[1], pb[1], u);
      if (k.arc) y += k.arc * 4 * u * (1 - u);
      return [lerp(pa[0], pb[0], u), y];
    });
    let scroll = 0;
    if (clip.scroll) { const { a, b, u } = seg(clip.scroll, t); scroll = lerp(a.v, b.v, u); }
    const fade = clip.fade ? Math.max(0, Math.min(1, t / 0.05, (1 - t) / 0.05)) : 1;
    return { sk, balls, scroll, fade, roles: B.actors.map((a) => a.role) };
  };

  /* ---------- 描く（SVG の文字列） ----------
     座標：世界の y（上が +）を、SVG の y（下が +）にするので -y。 */
  const P = (p) => `${f3(p[0])} ${f3(-p[1])}`;
  const cap = (a, b, w, cls) => `<line class="${cls}" x1="${f3(a[0])}" y1="${f3(-a[1])}" x2="${f3(b[0])}" y2="${f3(-b[1])}" stroke-width="${f3(w)}"/>`;
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  // 手足1本：輪郭 → 中身（ひざ・ひじのつなぎ目をきれいに）
  function limb(segs, cls) {
    return segs.map(([a, b, w]) => cap(a, b, w + W.ol * 2, 'fg-ol')).join('') + segs.map(([a, b, w, c]) => cap(a, b, w, c || cls)).join('');
  }
  function legParts(s, side, far) {
    const g = s[side];
    const hp = side === 'r' ? s.hpR : s.hpL;
    const skin = far ? 'fg-skin2' : 'fg-skin';
    const sockTop = mix(g.ank, g.knee, 0.18);
    return limb([[hp, g.knee, W.thigh], [g.knee, g.ank, W.shin]], skin) +
      cap(g.ank, sockTop, W.sock, 'fg-sock') +
      cap(g.foot[0], g.foot[1], W.shoe + W.ol * 2, 'fg-ol') + cap(g.foot[0], g.foot[1], W.shoe, 'fg-shoe') +
      cap(hp, mix(hp, g.knee, 0.3), W.shorts, 'fg-shorts');
  }
  function armParts(s, side, far) {
    const g = s[side];
    const shp = side === 'r' ? s.shR : s.shL;
    const skin = far ? 'fg-skin2' : 'fg-skin';
    return limb([[shp, g.elb, W.ua], [g.elb, g.hand, W.fa]], skin) +
      cap(shp, mix(shp, g.elb, 0.38), W.ua + 0.035, 'fg-sleeve') +
      `<circle class="fg-hand ${far ? 'far' : ''}" cx="${f3(g.hand[0])}" cy="${f3(-g.hand[1])}" r="${W.hand}"/>`;
  }
  function torsoParts(s) {
    if (s.view === 'side') {
      const [ax, ay] = s.axis;
      const fw = [s.face * ay, -s.face * ax]; // 体の前の向き
      const at = (base, f, u) => [base[0] + fw[0] * f + ax * u, base[1] + fw[1] * f + ay * u];
      const pts = [at(s.hip, -0.105, -0.02), at(s.hip, 0.095, -0.02), at(s.hip, 0.11, 0.2), at(s.sh, 0.115, -0.08), at(s.sh, 0.07, 0.035), at(s.sh, -0.075, 0.035), at(s.sh, -0.11, -0.12)];
      return `<path class="fg-jersey" d="M${pts.map(P).join(' L')} Z"/>`;
    }
    const out = (p, d) => [p[0] + d, p[1]];
    const pts = [out(s.shL, -0.03), out(s.shR, 0.03), out(s.hpR, 0.07), out(s.hpL, -0.07)];
    const shorts = [out(s.hpL, -0.085), out(s.hpR, 0.085), mix(s.hpR, s.r.knee, 0.4), [s.hip[0], s.hip[1] - 0.16], mix(s.hpL, s.l.knee, 0.4)];
    return `<path class="fg-shortsf" d="M${shorts.map(P).join(' L')} Z"/><path class="fg-jersey" d="M${pts.map(P).join(' L')} Z"/>`;
  }
  function headParts(s) {
    const c = s.head, r = L.R;
    const [hx, hy] = s.headAxis;
    let fw, up = [hx, hy];
    if (s.view === 'side') fw = [s.face * hy, -s.face * hx]; else fw = [hy, -hx];
    const at = (deg, rr) => { const a = rad(deg); return [c[0] + rr * (Math.cos(a) * fw[0] + Math.sin(a) * up[0]), c[1] + rr * (Math.cos(a) * fw[1] + Math.sin(a) * up[1])]; };
    let hair = '';
    if (s.view === 'side') {
      const arc = []; for (let d = 40; d <= 215; d += 15) arc.push(at(d, r + 0.012));
      hair = `<path class="fg-hair" d="M${arc.map(P).join(' L')} L${P(at(150, r * 0.35))} Z"/>`;
      const eye = at(8, r * 0.62);
      hair += `<circle class="fg-eye" cx="${f3(eye[0])}" cy="${f3(-eye[1])}" r="0.017"/>`;
    } else {
      const arc = []; for (let d = 5; d <= 175; d += 10) arc.push(at(d, r + 0.012));
      hair = `<path class="fg-hair" d="M${arc.map(P).join(' L')} L${P(at(160, r * 0.45))} L${P(at(20, r * 0.45))} Z"/>`;
      for (const d of [-0.042, 0.042]) { const e = [c[0] + fw[0] * d - up[0] * 0.005, c[1] + fw[1] * d - up[1] * 0.005]; hair += `<circle class="fg-eye" cx="${f3(e[0])}" cy="${f3(-e[1])}" r="0.016"/>`; }
    }
    return cap(s.sh, s.neck, W.neck + W.ol * 2, 'fg-ol') + cap(s.sh, s.neck, W.neck, 'fg-skin') +
      `<circle class="fg-head" cx="${f3(c[0])}" cy="${f3(-c[1])}" r="${r}"/>` + hair;
  }
  // 人1人を、うしろの層（体）と前の層（手前の腕）に分けて
  function figure(s) {
    if (s.view === 'side') {
      return {
        back: armParts(s, 'l', true) + legParts(s, 'l', true) + torsoParts(s) + headParts(s) + legParts(s, 'r', false),
        front: armParts(s, 'r', false),
      };
    }
    return { back: legParts(s, 'l', false) + legParts(s, 'r', false) + torsoParts(s) + headParts(s), front: armParts(s, 'l', false) + armParts(s, 'r', false) };
  }
  const ROLE = { '': 'var(--me)', o: 'var(--o)', x: 'var(--x)' };
  const ballSVG = (b, op = 1) => `<g class="mo-ball" transform="translate(${f3(b[0])} ${f3(-b[1])})" opacity="${f3(op)}"><circle r="${L.BALL}"/><path d="M${-L.BALL} 0 H${L.BALL} M0 ${-L.BALL} V${L.BALL} M${-L.BALL * 0.7} ${-L.BALL * 0.7} Q0 0 ${-L.BALL * 0.7} ${L.BALL * 0.7} M${L.BALL * 0.7} ${-L.BALL * 0.7} Q0 0 ${L.BALL * 0.7} ${L.BALL * 0.7}"/></g>`;
  // 細い線だけの人（動きのあと）
  function ghost(s) {
    const segs = [[s.hip, s.sh], [s.hpR, s.r.knee], [s.r.knee, s.r.ank], [s.hpL, s.l.knee], [s.l.knee, s.l.ank], [s.shR, s.r.elb], [s.r.elb, s.r.hand], [s.shL, s.l.elb], [s.l.elb, s.l.hand]];
    return segs.map(([a, b]) => cap(a, b, 0.05, 'fg-ghost')).join('') + `<circle class="fg-ghosth" cx="${f3(s.head[0])}" cy="${f3(-s.head[1])}" r="${L.R}"/>`;
  }
  // 角度の目印（ひざ・ひじ）。ラベルは体の外（at）に、引き出し線つきで
  function angleMark(center, a, b, label, at, k = 1) {
    const r = 0.17 * k;
    const va = Math.atan2(a[1] - center[1], a[0] - center[0]), vb = Math.atan2(b[1] - center[1], b[0] - center[0]);
    let d = vb - va;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const pts = [];
    for (let i = 0; i <= 12; i++) { const t = va + (d * i) / 12; pts.push([center[0] + r * Math.cos(t), center[1] + r * Math.sin(t)]); }
    const lp = at;
    const w = (0.075 * label.length + 0.06) * k, h = 0.18 * k;
    return `<path class="fg-arc" d="M${pts.map(P).join(' L')}" stroke-width="${f3(0.03 * k)}"/><line class="fg-lead" x1="${f3(center[0])}" y1="${f3(-center[1])}" x2="${f3(lp[0])}" y2="${f3(-lp[1])}" stroke-width="${f3(0.015 * k)}"/>` +
      `<rect class="fg-angbg" x="${f3(lp[0] - w / 2)}" y="${f3(-lp[1] - h / 2)}" width="${f3(w)}" height="${f3(h)}" rx="${f3(0.05 * k)}" stroke-width="${f3(0.015 * k)}"/><text class="fg-ang" x="${f3(lp[0])}" y="${f3(-lp[1])}" style="font-size:${f3(0.11 * k)}px;stroke-width:${f3(0.04 * k)}px">${label}</text>`;
  }
  function angles(s, box) {
    let out = '';
    const k = Math.max(1, (box[3] - box[2]) / 1.9);
    // ラベルは絵の中に（はみ出さない）
    const clampX = (x, label) => { const w = (0.075 * label.length + 0.06) * k / 2 + 0.03; return Math.max(box[0] + w, Math.min(box[1] - w, x)); };
    const sides = s.view === 'side' ? ['r'] : ['l', 'r'];
    for (const side of sides) {
      const g = s[side], hp = side === 'r' ? s.hpR : s.hpL, sp = side === 'r' ? s.shR : s.shL;
      const out1 = s.view === 'side' ? s.face : side === 'r' ? 1 : -1;
      const kl = `ひざ ${Math.round(angle3(hp, g.knee, g.ank))}°`, el = `ひじ ${Math.round(angle3(sp, g.elb, g.hand))}°`;
      out += angleMark(g.knee, hp, g.ank, kl, [clampX(g.knee[0] + out1 * 0.42 * k, kl), g.knee[1] + 0.05 * k], k);
      if (s.view === 'side') out += angleMark(g.elb, sp, g.hand, el, [clampX(g.elb[0] - s.face * 0.5 * k, el), g.elb[1] + 0.12 * k], k);
    }
    return out;
  }
  function scene(clip) {
    const [x0, x1] = clip.box;
    let s = `<rect class="mo-floor" x="${x0}" y="0" width="${x1 - x0}" height="0.25"/><line class="mo-floorline" x1="${x0}" y1="0" x2="${x1}" y2="0"/>`;
    if (clip.hoop != null) {
      const hx = clip.hoop, bx = hx + 0.38;
      s += `<g class="mo-hoop"><line x1="${bx + 0.45}" y1="0" x2="${bx + 0.45}" y2="${-3.3}"/><line x1="${bx + 0.45}" y1="${-3.3}" x2="${bx}" y2="${-3.3}"/>
        <line class="mo-board" x1="${bx}" y1="${-2.9}" x2="${bx}" y2="${-3.95}"/><line x1="${bx}" y1="${-3.05}" x2="${hx + 0.23}" y2="${-3.05}"/>
        <ellipse class="mo-rim" cx="${hx}" cy="${-3.05}" rx="0.23" ry="0.045"/><path class="mo-net" d="M${hx - 0.22} ${-3.04} L${hx - 0.13} ${-2.62} L${hx + 0.13} ${-2.62} L${hx + 0.22} ${-3.04}"/></g>`;
    }
    for (const cx of clip.cones || []) s += `<path class="mo-cone" d="M${cx - 0.12} 0 L${cx} -0.32 L${cx + 0.12} 0 Z"/>`;
    return s;
  }
  // 1コマを SVG の中身（文字列）に
  BC.motionDraw = function (clip, t, opt = {}) {
    const fr = BC.motionFrame(clip, t, opt.mods);
    let out = '';
    if (clip.scroll) {
      const off = fr.scroll % 0.5;
      const [x0, x1] = clip.box;
      for (let x = Math.ceil(x0 / 0.5) * 0.5 - off; x < x1 + 0.5; x += 0.5) out += `<line class="mo-mark" x1="${f3(x)}" y1="0.05" x2="${f3(x + 0.18)}" y2="0.05"/>`;
    }
    if (opt.trail) {
      for (const k of [3, 2, 1]) {
        const tt = (t - k * 0.06 + 1) % 1;
        const g = BC.motionFrame(clip, tt, opt.mods);
        out += `<g opacity="${f3(0.1 + (3 - k) * 0.07)}">${ghost(g.sk[0])}${g.balls.map((b) => ballSVG(b, 0.6)).join('')}</g>`;
      }
    }
    const figs = fr.sk.map(figure);
    // 影
    out += fr.sk.map((s) => { const air = Math.min(s.r.ank[1], s.l.ank[1]) - L.ANK; return `<ellipse class="mo-shadow" cx="${f3(s.hip[0])}" cy="0.02" rx="${f3(0.34 * Math.max(0.4, 1 - air))}" ry="0.04" opacity="${f3(fr.fade)}"/>`; }).join('');
    out += figs.map((f, i) => `<g class="mo-actor" style="--c:${ROLE[fr.roles[i]] || ROLE['']}" opacity="${f3(fr.fade)}">${f.back}</g>`).join('');
    out += fr.balls.map((b) => ballSVG(b, fr.fade)).join('');
    out += figs.map((f, i) => `<g class="mo-actor" style="--c:${ROLE[fr.roles[i]] || ROLE['']}" opacity="${f3(fr.fade)}">${f.front}</g>`).join('');
    if (opt.angles) out += `<g class="mo-angles">${angles(fr.sk[0], clip.box)}</g>`;
    return { svg: out, frame: fr };
  };
  // 動かない1枚（一覧の絵・ホームのタイルなど）
  BC.motionSVG = function (id, t, opt = {}) {
    const clip = BC.motions[id];
    if (!clip) return '';
    const [x0, x1, y0, y1] = opt.box || clip.box;
    const { svg } = BC.motionDraw(clip, t == null ? (clip.still != null ? clip.still : 0.3) : t, opt);
    return `<svg class="mo-svg${opt.cls ? ' ' + opt.cls : ''}" viewBox="${x0} ${-y1} ${x1 - x0} ${y1 - y0}" aria-hidden="true">${opt.noScene ? '' : scene(clip)}${svg}</svg>`;
  };

  /* ---------- 再生の部品 ----------
     BC.anim(el, id, { points: true, autoplay: true, compact: false })
     ▶ ⏸・場面のボタン・時間のバー・速さ・よい形／よくない形・角度・動きのあと・ポイント */
  BC.anim = function (el, id, opt = {}) {
    const clip = BC.motions[id];
    if (!clip) return null;
    const [x0, x1, y0, y1] = clip.box;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phases = clip.phases || [];
    const mistakes = clip.mistakes || [];
    const still = reduce || opt.autoplay === false;
    // 止めて見せるときは、いちばん形が分かる時刻（still）から。動かすときは 0 から
    const S = { t: opt.at != null ? opt.at : still && clip.still != null ? clip.still : 0, playing: !still, speed: 1, mode: '', angles: false, trail: false, visible: true, last: 0, raf: 0 };
    el.classList.add('mo');
    el.innerHTML = `
      <div class="mo-stage"><svg viewBox="${x0} ${-y1} ${x1 - x0} ${y1 - y0}" role="img" aria-label="${clip.name}の動き">
        ${scene(clip)}
        ${(clip.guides || []).includes('head') ? '<line class="mo-guide" data-g="head"/>' : ''}
        <g class="mo-layer"></g>
      </svg><span class="mo-tag" hidden></span></div>
      ${phases.length && !opt.compact ? `<div class="mo-phases">${phases.map((p, i) => `<button type="button" class="mo-ph" data-ph="${i}"><b class="num">${i + 1}</b>${p.label}</button>`).join('')}</div>` : ''}
      <div class="mo-ctl">
        <button type="button" class="mo-play" aria-label="止める"></button>
        ${opt.compact ? '' : '<input type="range" class="mo-scrub" min="0" max="1000" value="0" aria-label="時間">'}
        <button type="button" class="mo-speed" aria-label="速さ">1×</button>
      </div>
      ${opt.compact ? '' : `<div class="mo-opts">
        ${mistakes.length ? `<div class="seg mo-modes" role="group" aria-label="形"><button type="button" data-mode="" aria-pressed="true">よい形</button>${mistakes.map((m) => `<button type="button" data-mode="${m.id}" aria-pressed="false">× ${m.label}</button>`).join('')}</div>` : ''}
        <button type="button" class="chip" data-opt="angles" aria-pressed="false">角度</button>
        <button type="button" class="chip" data-opt="trail" aria-pressed="false">動きのあと</button>
      </div>`}
      ${opt.points === false || !(clip.points || []).length ? '' : `<ul class="mo-points">${clip.points.map((p) => `<li>${p}</li>`).join('')}</ul>`}`;
    const layer = el.querySelector('.mo-layer');
    const tag = el.querySelector('.mo-tag');
    const playBtn = el.querySelector('.mo-play');
    const scrub = el.querySelector('.mo-scrub');
    const phBtns = [...el.querySelectorAll('.mo-ph')];
    const guide = el.querySelector('[data-g="head"]');
    const mods = () => { const m = mistakes.find((x) => x.id === S.mode); return m ? m.mods : null; };
    if (guide) {
      const f0 = BC.motionFrame(clip, 0);
      const y = -(f0.sk[0].head[1] + L.R + 0.03);
      guide.setAttribute('x1', x0); guide.setAttribute('x2', x1); guide.setAttribute('y1', y); guide.setAttribute('y2', y);
    }
    function draw() {
      layer.innerHTML = BC.motionDraw(clip, S.t, { mods: mods(), angles: S.angles, trail: S.trail }).svg;
      if (scrub && document.activeElement !== scrub) scrub.value = Math.round(S.t * 1000);
      let cur = -1;
      phases.forEach((p, i) => { if (S.t >= p.at) cur = i; });
      phBtns.forEach((b, i) => b.setAttribute('aria-current', i === cur ? 'step' : 'false'));
    }
    const setPlay = () => { playBtn.textContent = S.playing ? '⏸' : '▶'; playBtn.setAttribute('aria-label', S.playing ? '止める' : '動かす'); };
    function loop(now) {
      S.raf = 0;
      if (!el.isConnected) return;
      if (S.playing && S.visible) {
        if (S.last) S.t = (S.t + ((now - S.last) / 1000 / clip.dur) * S.speed) % 1;
        S.last = now;
        draw();
      } else S.last = 0;
      if (S.playing) S.raf = requestAnimationFrame(loop);
    }
    const start = () => { if (!S.raf) S.raf = requestAnimationFrame(loop); };
    const pause = () => { S.playing = false; setPlay(); };
    playBtn.addEventListener('click', () => { S.playing = !S.playing; S.last = 0; setPlay(); if (S.playing) start(); });
    el.querySelector('.mo-speed').addEventListener('click', (e) => {
      S.speed = S.speed === 1 ? 0.5 : S.speed === 0.5 ? 0.25 : 1;
      e.currentTarget.textContent = S.speed === 1 ? '1×' : S.speed === 0.5 ? '½×' : '¼×';
    });
    if (scrub) scrub.addEventListener('input', () => { pause(); S.t = scrub.value / 1000; draw(); });
    phBtns.forEach((b, i) => b.addEventListener('click', () => { pause(); S.t = phases[i].at + 0.001; draw(); }));
    el.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
      S.mode = b.dataset.mode;
      el.querySelectorAll('[data-mode]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const m = mistakes.find((x) => x.id === S.mode);
      tag.hidden = !m;
      if (m) tag.textContent = '× よくない形：' + m.label;
      el.classList.toggle('mo-bad', !!m);
      draw();
    }));
    el.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => {
      S[b.dataset.opt] = !S[b.dataset.opt];
      b.setAttribute('aria-pressed', String(S[b.dataset.opt]));
      draw();
    }));
    if (typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver((es) => { S.visible = es[0].isIntersecting; if (S.visible && S.playing) start(); });
      io.observe(el);
    }
    if (!S.playing) S.t = opt.at != null ? opt.at : clip.still != null ? clip.still : 0.3;
    draw();
    setPlay();
    if (S.playing) start();
    return { draw: (t) => { S.t = t; draw(); }, pause, state: S };
  };

  /* ---------- 動きを書くときの道具（data/motions-*.js から使う） ---------- */
  // その場で走る（床の目印を流す）。1回で2歩、床は 1.6m 流れる
  function runKeys(t0, t1, opt = {}) {
    const h = opt.h || 0.9, lean = opt.lean == null ? 14 : opt.lean;
    const k = [];
    const n = opt.cycles || 1;
    const arms = opt.arms;
    for (let c = 0; c < n; c++) {
      const b = t0 + ((t1 - t0) * c) / n, w = (t1 - t0) / n;
      k.push({ at: b, hip: [0, h], lean, rf: [0.18, 0], lf: [-0.42, 0.2], ...(arms ? arms(0) : { rh: [-0.18, 0.85], lh: [0.3, 1.08] }) });
      k.push({ at: b + w * 0.25, hip: [0, h + 0.04], rf: [-0.22, 0], lf: [0.12, 0.34], ...(arms ? arms(0.25) : {}) });
      k.push({ at: b + w * 0.5, hip: [0, h], lf: [0.18, 0], rf: [-0.42, 0.2], ...(arms ? arms(0.5) : { lh: [-0.18, 0.85], rh: [0.3, 1.08] }) });
      k.push({ at: b + w * 0.75, hip: [0, h + 0.04], lf: [-0.22, 0], rf: [0.12, 0.34], ...(arms ? arms(0.75) : {}) });
    }
    k.push({ at: t1, hip: [0, h], rf: [0.18, 0], lf: [-0.42, 0.2], ...(arms ? arms(1) : { rh: [-0.18, 0.85], lh: [0.3, 1.08] }) });
    for (const x of k) x.lin = true;
    return k;
  }
  // 足を置く場所を順に（歩く・走る・ステップ）
  function steps(t0, t1, start, plants, opt = {}) {
    const k = [];
    const h = opt.h || 0.88, lean = opt.lean == null ? 12 : opt.lean;
    let feet = { r: start.r, l: start.l };
    const n = plants.length;
    const hipOf = (f) => [(f.r + f.l) / 2 + (opt.ahead || 0.08), h];
    k.push({ at: t0, hip: hipOf(feet), lean, rf: [feet.r, 0], lf: [feet.l, 0], ...(opt.arms ? opt.arms(feet, 0) : {}) });
    plants.forEach(([foot, x], i) => {
      const ta = t0 + ((t1 - t0) * i) / n, tb = t0 + ((t1 - t0) * (i + 1)) / n;
      const midX = (feet[foot] + x) / 2;
      const m = { at: (ta + tb) / 2, hip: [(midX + feet[foot === 'r' ? 'l' : 'r']) / 2 + (opt.ahead || 0.08), h + 0.03] };
      m[foot + 'f'] = [midX, opt.lift == null ? 0.16 : opt.lift];
      k.push(Object.assign(m, opt.arms ? opt.arms(Object.assign({}, feet), i + 0.5) : {}));
      feet = Object.assign({}, feet, { [foot]: x });
      const e = { at: tb, hip: hipOf(feet) };
      e[foot + 'f'] = [x, 0];
      k.push(Object.assign(e, opt.arms ? opt.arms(feet, i + 1) : {}));
    });
    return { keys: k, feet };
  }
  BC.mo = {
    runKeys, steps,
    LOW: { hip: [0, 0.72], lean: 28, nod: -22, rf: [0.12, 0], lf: [-0.16, 0], rh: [0.42, 0.64], lh: [0.36, 0.98] }, // 腰を落とした構え（横・右向き）
    FLOW: { hip: [0, 0.7], lean: 0, nod: 0, rf: [0.33, 0], lf: [-0.33, 0], rh: [0.42, 0.62], lh: [-0.36, 0.8] },  // 腰を落とした構え（前から）
    STAND: { hip: [0, 0.9], lean: 4, nod: 0, rf: [0.08, 0], lf: [-0.08, 0], rh: [0.08, 0.86], lh: [0.02, 0.88] }, // 立つ（横）
    HOOP: 3.35,
  };

  // 練習メニュー・改善の視点 → 見せる動き（data/motions-*.js でも足せる：BC.motionLink({ 'd-…': '動きの id' })）
  BC.MOTION_OF = BC.MOTION_OF || {};
  BC.motionLink = (map) => Object.assign(BC.MOTION_OF, map);
  BC.motionFor = (id) => (BC.MOTION_OF[id] && BC.motions[BC.MOTION_OF[id]] ? BC.MOTION_OF[id] : null);

  // 検査：動きのデータの形
  BC.validateMotions = function () {
    const errors = [], warns = [];
    for (const [id, c] of Object.entries(BC.motions)) {
      if (!/^[a-z0-9-]+$/.test(id)) errors.push(`${id}：id の形`);
      if (!c.name) errors.push(`${id}：name がない`);
      if (!['side', 'front'].includes(c.view)) errors.push(`${id}：view は side・front`);
      if (!Array.isArray(c.box) || c.box.length !== 4) errors.push(`${id}：box は [左, 右, 下, 上]`);
      if (!(c.dur > 0)) errors.push(`${id}：dur`);
      if (!(c.actors || []).length) errors.push(`${id}：actors がない`);
      (c.actors || []).forEach((a, i) => {
        const k0 = (a.keys || [])[0] || {};
        for (const f of POSE) if (k0[f] == null && f !== 'nod') errors.push(`${id}.actors[${i}]：最初のキーに ${f} がない`);
        let prev = -1;
        for (const k of a.keys || []) { if (!(k.at >= prev) || k.at > 1) errors.push(`${id}.actors[${i}]：at の順`); prev = k.at; }
      });
      (c.phases || []).forEach((p) => { if (typeof p.label !== 'string' || !(p.at >= 0 && p.at < 1)) errors.push(`${id}.phases：{ at, label }`); });
      (c.mistakes || []).forEach((m) => { if (!m.id || !m.label || !m.mods) errors.push(`${id}.mistakes：{ id, label, mods }`); });
      if (!(c.points || []).length) warns.push(`${id}：points がない`);
      if (!(c.phases || []).length) warns.push(`${id}：phases がない`);
      try { BC.motionDraw(c, 0.37); } catch (e) { errors.push(`${id}：描けない（${e.message}）`); }
    }
    for (const [k, v] of Object.entries(BC.MOTION_OF)) {
      if (!BC.motions[v]) errors.push(`MOTION_OF：${k} → ない動き ${v}`);
      if (BC.get && !BC.get(k)) warns.push(`MOTION_OF：${k} はデータにない`);
    }
    return { errors, warns };
  };
})();
