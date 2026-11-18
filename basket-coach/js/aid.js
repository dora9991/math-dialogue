/* ケガをしたときの対処と、テーピング（図つき）。BC に足す（ふつうの script。import/export なし）。
   DOM を使うのは BC.drawTape だけ（読みこむだけなら node でも動く。検査は BC.validateAid）。
   データ（data/aid.js）は BC.aid({...})・BC.tape({...}) で自分を登録する（1つずつでも、配列でまとめてでもよい）。
     一覧    BC.aids・BC.tapes（配列。書いた順）　id 引き BC.aidById[id]・BC.tapeById[id]
     検査    BC.validateAid() → { errors: [], warns: [] }
     図      BC.drawTape(el, tapeId, stepIndex, opt) … el の中に SVG を入れる（下の「図」）
     そのほか BC.findAids(文) … ことばから探す（[{ aid, score }] よく当たる順）
             BC.aidsForTape(tapeId) … そのテーピングを挙げているケガ
             BC.tapeViews(tape) … そのテーピングの図に出る土台の絵（view の名前の配列）
             BC.aidCommon … どのケガにも共通の決まりと電話番号（data/aid.js で書く。{ rules: ['…'], phones: [{ num, name, text }] }）

   ■ ケガの対処  BC.aid({ id:'a-…', name, words, urgent, call, doctor, steps, dont, back, taping, note })
     id      'a-' ＋ 英小文字・数字・-
     name    子どもが分かる言葉の名前（例：'足首をひねった（ねんざ）'）
     words   探すための言葉（10前後。動詞は「ひねっ」「頭を打」のように語尾を落とすと、活用がちがっても当たる）
     urgent  命にかかわる・すぐ救急車の可能性が高いものは true
     call    すぐ 119（救急車）を呼ぶサイン（ないなら []）。urgent のときは必ず書く
     doctor  その日のうちに病院（整形外科など）へ行くサイン
     steps   その場でやること（順番に）　dont やってはいけないこと（理由も短く）
     back    練習にもどるまでの目安（日数の断定はしない）
     taping  関係するテーピングの id（ないなら []）　note 補足（なくてもよい）
     文は子どもに向けて「です・ます」。箇条は短い文。電話番号は 119・#8000・#7119 だけ。

   ■ テーピング  BC.tape({ id:'tp-…', name, purpose, who, materials, before, steps, after, cautions })
     purpose 何のため（予防・再発予防）　who だれがやるか　materials 用意するもの　before 巻く前に
     steps   [{ name: 'アンカー', text: '…', fig }]（順番に）
     after   巻いたあとに確かめること（指先の色・しびれ・きつさ）　cautions 注意

   ■ 図（fig）
     fig     { view, strips } … 土台の絵（view）と、このステップで新しく巻くテープ（strips）。
             [{ view, strips }, { view, strips }] と配列にすると、ちがう向きの絵を横にならべる（同じテーピングの中では、どのステップも同じ並び）。
             前のステップのテープは、自動で重ねて描く（白）。いまのステップのテープは目立つ色で、巻く向きに線が伸びる。
     strips  テープ1本 = { pts: [[x, y], …], w }
             pts  帯のまん中の線（なめらかにつなぐ）。巻く向きの順に書く。null をはさむと、そこで体の裏側へ回る（見えない）。
             w    帯の幅（土台の絵と同じ単位）
             帯は、体（肌）の形の内側だけに描く（はみ出たところは切る）。体を一周する帯は、はしを体の外まで書けばよい。
     view（土台の絵）と座標。x は右へ、y は下へ。
       'ankle-side'  右足を外側（小指側）から見た図。つま先が右。x 0〜160・y 0〜154。床 y=147。1 ≒ 2mm（38mm のテープは w 19）
                     目安：外くるぶし (58, 109)、かかとのうしろ x≈23、アキレス腱 x≈37、足首の前（すねと足の甲の境）(87, 102)、
                     すねの前 x≈85、足の甲（土踏まずのあたり）x≈100〜108、つま先 x≈146
       'ankle-back'  右足をうしろから見た図。左が内側（親指側）、右が外側。x 0〜100・y 0〜154。床 y=147。1 ≒ 2mm
                     目安：アキレス腱 x 46〜54、内くるぶし (31, 100)、外くるぶし (70, 107)、かかと x 36〜64・y 112〜146
       'hand-palm'   右手を手のひら側から見た図（自分の右手のひらを見たときと同じ向き。親指が右）。x 0〜152・y 16〜222。1 ≒ 1mm
                     目安：手首のしわ y≈171〜177（その下が手首・うで）、親指と人さし指の間（水かき）≈ (97, 105)
                     親指の軸は (100, 140) から (126.7, 73.1) へ。BC.TAPE_HAND.along(TA, TB, s, k) が、つけ根から s 進んで横に k の点
                     （k が＋で親指の外側。親指の幅は k ±10 くらい。つけ根の関節 MP ≈ s 36〜40、第1関節 ≈ s 59、指先 s 81.5）
       'hand-back'   右手を手の甲側から見た図（親指が左）。'hand-palm' を左右反対にした絵で、座標は x を 152 − x にする（y は同じ）
       'fingers'     'hand-palm' と同じ絵の、指のところだけ（x 13〜95・y 22〜122）。1 ≒ 1mm
                     指（中心の x・つけ根のしわ y・第2関節 y・第1関節 y・指先 y）：小指 28・113・94・78・63／薬指 45・100・77・56・37／
                     中指 63・96・72・50・30／人さし指 81.5・101・78・58・39（指の幅：小指 16・薬指 18・中指 19・人さし指 18。指どうしはくっついている）
       'wrist'       'hand-palm' と同じ絵の、手首のまわり（x 0〜152・y 64〜222）。1 ≒ 1mm

   ■ BC.drawTape(el, tapeId, stepIndex, opt)
     stepIndex  0 から。steps.length 以上（または null）なら、できあがり（全部白）。−1 なら土台の絵だけ
     opt.anim   false で動かさない（prefers-reduced-motion のときも動かさない）
     opt.labels false で、絵の下の「右足・外側から」などを出さない
     opt.maxHeight  図の高さの上限（CSS の値。初期値 '62vh'）
     返り値   { svg, step, total, replay() } … replay() でいまのテープのアニメーションをもう一度 */
(function (root) {
  const BC = (root.BC = root.BC || {});
  BC.aids = [];
  BC.tapes = [];
  BC.aidById = {};
  BC.tapeById = {};
  BC.aidLoadErrors = [];
  BC.AID_FIELDS = ['id', 'name', 'words', 'urgent', 'call', 'doctor', 'steps', 'dont', 'back', 'taping', 'note'];
  BC.TAPE_FIELDS = ['id', 'name', 'purpose', 'who', 'materials', 'before', 'steps', 'after', 'cautions'];
  BC.AID_PHONES = ['119', '#8000', '#7119'];

  const file = () => BC.currentFile || '';
  function reg(kind, def) {
    if (Array.isArray(def)) { def.forEach((d) => reg(kind, d)); return; }
    const name = kind === 'aid' ? 'ケガの対処' : 'テーピング';
    if (!def || typeof def.id !== 'string' || !def.id) { BC.aidLoadErrors.push(`${name}：id のないものがある（${file()}）`); return; }
    const byId = kind === 'aid' ? BC.aidById : BC.tapeById;
    if (byId[def.id]) { BC.aidLoadErrors.push(`id が重複している：${def.id}（${file()}）`); return; }
    byId[def.id] = def;
    (kind === 'aid' ? BC.aids : BC.tapes).push(def);
  }
  BC.aid = (d) => reg('aid', d);
  BC.tape = (d) => reg('tape', d);
  // data/aid.js のほうが先に読まれていたら、預けてあった登録を受け取る
  if (Array.isArray(BC.aidQueue)) { const q = BC.aidQueue; delete BC.aidQueue; q.forEach(([k, d]) => reg(k, d)); }

  // ステップの図（fig）を、いつも配列で
  BC.tapeFigs = (step) => (!step || !step.fig ? [] : Array.isArray(step.fig) ? step.fig : [step.fig]);
  BC.tapeViews = function (tape) {
    const out = [];
    for (const st of (tape && tape.steps) || []) for (const fg of BC.tapeFigs(st)) if (fg && fg.view && !out.includes(fg.view)) out.push(fg.view);
    return out;
  };
  BC.aidsForTape = (id) => BC.aids.filter((a) => (a.taping || []).includes(id));

  /* ---------- ことばから探す ---------- */
  const norm = (s) => {
    s = String(s == null ? '' : s).normalize('NFKC').toLowerCase();
    s = s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
    return s.replace(/[\s・、。,.!！?？「」（）()〜~ー-]/g, '');
  };
  BC.findAids = function (text) {
    const q = norm(text);
    if (!q) return [];
    const out = [];
    for (const a of BC.aids) {
      // 長い言葉ほど決め手になる（長さの1.5乗）。1字（'歯'・'目' など）は弱く。名前そのものが入っていれば少し足す
      let score = 0;
      const nm = norm(String(a.name).replace(/[（(][^）)]*[）)]/g, ''));
      if (nm.length >= 3 && q.includes(nm)) score += Math.pow(nm.length, 1.5) * 0.5;
      for (const w of a.words || []) {
        const k = norm(w);
        if (k && q.includes(k)) score += k.length === 1 ? 1 : Math.pow(k.length, 1.5);
      }
      if (score) out.push({ aid: a, score });
    }
    // 同じ点なら、命にかかわるものを先に
    return out.sort((x, y) => y.score - x.score || (y.aid.urgent ? 1 : 0) - (x.aid.urgent ? 1 : 0));
  };

  /* ---------- 線をなめらかにつなぐ（Catmull-Rom → 3次ベジエ） ---------- */
  const r1 = (n) => Math.round(n * 10) / 10;
  function beziers(pts, closed) {
    const n = pts.length;
    const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    const out = [];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      out.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
    }
    return out;
  }
  function curve(pts, closed) {
    if (pts.length < 2) return '';
    const bz = beziers(pts, closed);
    return `M${r1(pts[0][0])} ${r1(pts[0][1])}` + bz.map((b) => ` C${r1(b[1][0])} ${r1(b[1][1])} ${r1(b[2][0])} ${r1(b[2][1])} ${r1(b[3][0])} ${r1(b[3][1])}`).join('') + (closed ? 'Z' : '');
  }
  // 線にそった点（長さつき）
  function sample(pts, per = 16) {
    const out = [];
    let s = 0, prev = null;
    for (const b of beziers(pts, false)) {
      for (let k = prev ? 1 : 0; k <= per; k++) {
        const t = k / per, u = 1 - t;
        const p = [0, 1].map((j) => u * u * u * b[0][j] + 3 * u * u * t * b[1][j] + 3 * u * t * t * b[2][j] + t * t * t * b[3][j]);
        if (prev) s += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
        out.push({ p, s });
        prev = p;
      }
    }
    return out;
  }
  const at = (smp, s) => {
    for (let i = 1; i < smp.length; i++) {
      if (smp[i].s >= s) {
        const a = smp[i - 1], b = smp[i], t = (s - a.s) / ((b.s - a.s) || 1);
        const dx = b.p[0] - a.p[0], dy = b.p[1] - a.p[1], l = Math.hypot(dx, dy) || 1;
        return { p: [a.p[0] + dx * t, a.p[1] + dy * t], d: [dx / l, dy / l] };
      }
    }
    return null;
  };
  // pts を null で区切った、見えるところの並び
  function runs(pts) {
    const out = [];
    let cur = [];
    for (const p of pts || []) {
      if (p === null) { if (cur.length) out.push(cur); cur = []; } else cur.push(p);
    }
    if (cur.length) out.push(cur);
    return out.filter((r) => r.length >= 2);
  }

  /* ---------- 土台の絵 ---------- */
  const SKIN = 'var(--skin, #e3b48f)';
  const SKIN_LINE = 'var(--skin-line, #95654a)';
  const SKIN_SHADE = 'var(--skin-shade, #cf9a74)';
  const line = (d, op = 0.5, w = 0.9, extra = '') => `<path d="${d}" style="fill:none;stroke:${SKIN_LINE};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round;opacity:${op}${extra}"/>`;
  const shade = (d, op = 0.5) => `<path d="${d}" style="fill:${SKIN_SHADE};opacity:${op}"/>`;
  const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
  // 縦の指（下が a、指先が上）
  const finger = (cx, tip, bottom, hw) => `M${cx - hw} ${bottom} L${cx - hw} ${tip + hw} A${hw} ${hw} 0 0 1 ${cx + hw} ${tip + hw} L${cx + hw} ${bottom}Z`;
  // a から b への軸の上で、a から s 進んで、横に k ずれた点（k は進む向きの右が＋。y が下向きの座標）
  const along = (a, b, s, k = 0) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [-u[1], u[0]];
    return [a[0] + u[0] * s + n[0] * k, a[1] + u[1] * s + n[1] * k];
  };

  // 右足を外側から（つま先が右）
  const ankleSide = (() => {
    const sil = curve([
      [21, -16], [22, 18], [27, 46], [33, 70], [36.5, 90], [36, 104], [32, 116], [25.5, 126], [23, 134], [25.5, 142], [33, 146.6],
      [60, 147.2], [100, 147.2], [128, 147.2], [141, 146.6], [146, 143.2], [146.2, 138.4], [141.5, 134.4], [127, 129.5],
      [111, 121.5], [97, 111.5], [89, 103.5], [85.6, 92], [84.4, 62], [85.6, 24], [87, -16],
    ], true);
    const under =
      shade(ell(58.5, 109, 8.6, 10.6), 0.55) + // 外くるぶし
      line('M53 101.5 C55.5 99.2 61 99 64.6 102.6', 0.55, 0.9) +
      shade('M37.5 84 C41.5 92 42.5 101 40 111 C44.5 106 47 97 46 86 Z', 0.35) + // アキレス腱の前のくぼみ
      line('M39 60 C40.5 74 41.3 90 39.8 108', 0.28, 0.9) + // アキレス腱
      line('M33 144.2 C55 145.4 95 145.6 124 145', 0.32, 0.9) + // 足のうらのふち
      line('M86.6 98.8 C83 101.5 80.6 104.6 79.6 108.6', 0.32, 0.9) + // 足首の前のしわ
      line('M104 145.6 C103 139 104.5 134.5 108 132', 0.18, 0.9) + // 小指のつけ根のふくらみ
      line('M127.2 146.8 C125.8 141 126.8 136.4 130.4 133.6', 0.5, 0.9) + // 小指
      line('M137.4 146.6 C138 142 137.6 138 135.6 134.6', 0.45, 0.9) +
      line('M131.6 137.2 C133.4 136.2 135.4 136.4 136.6 137.6', 0.45, 0.8); // 小指のつめ
    const over = line(ell(58.5, 109, 8.6, 10.6), 0.42, 0.8, ';stroke-dasharray:1.6 1.8');
    return { name: '右足・外側から', box: [0, 0, 160, 154], mm: 2, floor: 147.2, shapes: [sil], under, over };
  })();

  // 右足をうしろから（左が内側）
  const ankleBack = (() => {
    const sil = curve([
      [23, -16], [23.5, 12], [25.5, 40], [30, 63], [33.6, 80], [33, 89], [29.2, 95.5], [28.2, 103], [31.2, 110], [33.4, 116],
      [27.6, 124], [21.6, 133], [20.4, 141], [25.6, 146.4], [50, 147.6], [75.4, 146.4], [80.6, 141.2], [79, 133], [72.6, 124.4],
      [68.4, 117.4], [71.6, 112.6], [73, 105], [70, 97.2], [66.6, 88.4], [67.2, 72], [72, 48], [75.6, 20], [77, -16],
    ], true);
    const heel = 'M36 113 C34.4 124 35.4 136 41 142.6 C45 146 55 146 59 142.6 C64.6 136 65.6 124 64 113';
    const under =
      shade('M33.4 116 C30 121 25 126.5 21.6 133 C20.2 138 21.4 144 25.6 146.4 C31 146.9 36 147 41 146.6 C36.4 140 34.6 128 36 113 Z', 0.5) +
      shade('M66.6 116.4 C70 121 74.6 126.6 79 133 C81 137.4 80.4 143 75.4 146.4 C70 146.9 64.6 147 59 146.6 C63.6 140 65.4 128 64 113 Z', 0.5) +
      line(heel, 0.5, 0.9) +
      shade(ell(31.6, 100.4, 3.6, 7.2), 0.55) + shade(ell(69.4, 107, 3.8, 7.6), 0.55) + // くるぶし
      line('M44.6 54 C45.8 76 46.4 96 46.6 113', 0.3, 0.9) + line('M55.4 54 C54.2 76 53.6 96 53.4 113', 0.3, 0.9) + // アキレス腱
      line('M27.5 6 C33 26 39.6 44 44.6 54', 0.22, 0.9) + line('M72.5 6 C67 26 60.4 44 55.4 54', 0.22, 0.9); // ふくらはぎ
    const over = line(ell(31.6, 100.4, 3.6, 7.2), 0.4, 0.8, ';stroke-dasharray:1.4 1.6') + line(ell(69.4, 107, 3.8, 7.6), 0.4, 0.8, ';stroke-dasharray:1.4 1.6');
    return { name: '右足・うしろから', box: [0, 0, 100, 154], mm: 2, floor: 147.6, shapes: [sil], under, over };
  })();

  // 右手。手のひら側（親指が右）と、手の甲側（左右が反対。親指が左）。座標は手のひら側で決めて、甲側は x を 152 − x にする
  const hand = (() => {
    const HW = 152;
    const F = [ // [中心 x, 指先 y, つけ根のしわ y, 第2関節 y, 第1関節 y, 半分の幅]（手のひら側の座標）
      [28, 63, 113, 94.5, 78, 8],
      [45, 37, 100, 76.7, 55.9, 9],
      [63, 30, 96, 71.6, 49.8, 9.5],
      [81.5, 39, 101, 78.1, 57.6, 9],
    ];
    const TA = [100, 140], TB = [126.72, 73.14]; // 親指の軸（つけ根のふくらみの中 → 指先の丸みの中心）
    const al = (s, k = 0) => along(TA, TB, s, k); // 手のひら側：k が＋で親指の外側（人さし指と反対）
    const outline = [
      [20.6, 111], [30, 104], [44, 99], [62, 96], [80, 98], [90.2, 100.6], [95.5, 104.4], [99.8, 104.4],
      al(36, -10.6), al(50, -10.2), al(64, -9.8), al(72, -9.5), al(78.7, -6.7), al(81.5, 0), al(78.7, 6.7), al(72, 9.5), al(64, 9.8),
      al(50, 10.2), al(35, 10.7), al(20, 11.3),
      [114.5, 139], [108.5, 152.5], [99.5, 163.5], [88, 171.2], [57, 173.6], [29, 170.6], [21.4, 160], [17.6, 140], [18.4, 122],
    ];
    const armPts = [[29.4, 166], [86.4, 166], [89.6, 252], [25.6, 252]];
    const P = (p) => `${r1(p[0])} ${r1(p[1])}`;
    function build(back, lw = 1) {
      const line2 = (d, op, w, extra) => line(d, op, w * lw, extra);
      const X = (p) => (back ? [HW - p[0], p[1]] : p);
      const L = (pts) => 'M' + pts.map((p) => P(X(p))).join(' L');
      const Q = (a, c, b) => `M${P(X(a))} Q${P(X(c))} ${P(X(b))}`;
      const shapes = [L(armPts) + 'Z', curve(outline.map(X), true), ...F.map((f) => finger(X([f[0], 0])[0], f[1], f[2] + 10, f[5]))];
      let under = '';
      // 指と指の境め（指先側のくぼみから、つけ根まで）
      for (let i = 0; i < 3; i++) {
        const a = F[i], b = F[i + 1];
        const x = (a[0] + a[5] + b[0] - b[5]) / 2;
        const top = Math.max(a[1], b[1]) + Math.min(a[5], b[5]) * 0.95;
        under += line2(L([[x, top], [x, Math.max(a[2], b[2]) - 1.5]]), 0.62, 0.9);
      }
      const across = (cx, y, hw, k, bend) => Q([cx - hw * k, y + bend], [cx, y - bend * 1.5], [cx + hw * k, y + bend]);
      const tAcross = (s, k, bend = 1.2) => Q(al(s, -10 * k), al(s - bend), al(s, 10 * k));
      if (!back) {
        for (const f of F) {
          under += line2(across(f[0], f[2], f[5], 0.78, 0.6), 0.5, 0.9); // つけ根のしわ
          under += line2(across(f[0], f[3] - 1.1, f[5], 0.7, 0.6), 0.5, 0.8) + line2(across(f[0], f[3] + 1.1, f[5], 0.7, 0.6), 0.5, 0.8); // 第2関節
          under += line2(across(f[0], f[4], f[5], 0.66, 0.6), 0.5, 0.8); // 第1関節
          under += line2(Q([f[0] - f[5] * 0.45, f[1] + f[5] * 0.75], [f[0], f[1] + f[5] * 1.15], [f[0] + f[5] * 0.45, f[1] + f[5] * 0.75]), 0.2, 0.8); // 指の腹
        }
        under += line2(tAcross(37.5, 0.82), 0.55, 0.9) + line2(tAcross(59, 0.74), 0.5, 0.8) + line2(tAcross(61.2, 0.7), 0.4, 0.8); // 親指のしわ
        under +=
          line2('M18.6 127 C34 124 52 117.6 69.6 106.6', 0.45, 0.9) + // 手のひらのしわ
          line2('M95 111 C80 117 58 128.4 33.4 142', 0.42, 0.9) +
          line2('M95.8 111.6 C87 124 81 145 79.6 167', 0.45, 0.9) +
          line2('M31.6 172 C48 174 68 174 84.6 171.6', 0.42, 0.9) + line2('M31 177.4 C48 179.2 68 179.2 85.4 177', 0.3, 0.8) + // 手首のしわ
          shade('M100 113 C107 122 110 138 105 152 C100 161 93 167 87.6 171 C95 160 101 146 101.6 130 C101.6 123 101 117 100 113 Z', 0.3); // 親指のつけ根のふくらみ
      } else {
        const NAIL = 'var(--skin-nail, #f0cdb4)';
        for (const f of F) {
          const [cx, tip, base, pip, dip, hw] = f;
          const x0 = cx - hw * 0.62, x1 = cx + hw * 0.62, y0 = tip + 2.6, y1 = y0 + (base - tip) * 0.19, r = (x1 - x0) * 0.42;
          const nail = `M${P(X([x0, y1]))} L${P(X([x0, y0 + r]))} Q${P(X([x0, y0]))} ${P(X([x0 + r, y0]))} L${P(X([x1 - r, y0]))} Q${P(X([x1, y0]))} ${P(X([x1, y0 + r]))} L${P(X([x1, y1]))} Q${P(X([cx, y1 + 1.6]))} ${P(X([x0, y1]))}Z`;
          under += `<path d="${nail}" style="fill:${NAIL};stroke:${SKIN_LINE};stroke-width:${r1(0.7 * lw)};opacity:0.85"/>`;
          for (const dy of [-2, 0, 2]) under += line2(across(cx, pip + dy, hw, 0.42, -0.7), 0.4, 0.7); // 第2関節のしわ
          for (const dy of [-1, 1]) under += line2(across(cx, dip + dy, hw, 0.34, -0.6), 0.35, 0.7); // 第1関節のしわ
          under += line2(across(cx, base + 15, hw, 0.5, -1.4), 0.38, 0.8); // げんこつの骨（指のつけ根）
          under += line2(L([[cx + (cx < 55 ? 1 : cx > 70 ? -1 : 0), base + 19], [57 + (cx - 57) * 0.45, 166]]), 0.13, 0.9); // 手の甲のすじ
        }
        const nl = [al(62.5, -5.6), al(74.5, -5.2), al(77.6, 0), al(74.5, 5.2), al(62.5, 5.6), al(61, 0)];
        under += `<path d="M${P(X(nl[0]))} L${P(X(nl[1]))} Q${P(X(nl[2]))} ${P(X(nl[3]))} L${P(X(nl[4]))} Q${P(X(nl[5]))} ${P(X(nl[0]))}Z" style="fill:${NAIL};stroke:${SKIN_LINE};stroke-width:${r1(0.7 * lw)};opacity:0.85"/>`; // 親指のつめ
        for (const ds of [-1.6, 0.4]) under += line2(tAcross(52 + ds, 0.5, -0.8), 0.38, 0.7); // 親指の関節のしわ
        under += line2(L([[101, 134], [92, 158]]), 0.12, 0.9); // 親指のすじ
        under += shade(ell(HW - 33.5, 177, 4.2, 3.6), 0.45); // 手首の小指側の骨
      }
      return { shapes, under };
    }
    return { HW, F, TA, TB, palm: build(false), back: build(true), palmZoom: build(false, 0.45), palmWrist: build(false, 0.55) };
  })();
  const handView = (name, side, box) => ({ name, box, mm: 1, shapes: hand[side].shapes, under: hand[side].under, over: '' });

  BC.TAPE_VIEWS = {
    'ankle-side': ankleSide,
    'ankle-back': ankleBack,
    'hand-palm': handView('右手・手のひら側', 'palm', [0, 16, 152, 206]),
    'hand-back': handView('右手・手の甲側', 'back', [0, 16, 152, 206]),
    fingers: handView('右手の指・手のひら側', 'palmZoom', [13, 22, 82, 100]),
    wrist: handView('右手・手のひら側', 'palmWrist', [0, 64, 152, 158]),
  };
  // 図の座標を決めるときの目安：指（F）・親指の軸（TA → TB）。BC.TAPE_HAND.along(TA, TB, s, k) で、親指のつけ根から s、横に k の点
  BC.TAPE_HAND = { F: hand.F, TA: hand.TA, TB: hand.TB, along };

  /* ---------- 検査 ---------- */
  BC.validateAid = function () {
    const errors = BC.aidLoadErrors.slice();
    const warns = [];
    const isStr = (v) => typeof v === 'string' && v.trim() !== '';
    const texts = []; // [どこ, 文]
    const strList = (where, v, opt = {}) => {
      if (v == null) { if (opt.need) errors.push(`${where}：ない`); return; }
      if (!Array.isArray(v)) { errors.push(`${where}：配列にする`); return; }
      if (opt.need && !v.length) errors.push(`${where}：空（1つ以上書く）`);
      v.forEach((s, i) => {
        if (!isStr(s)) errors.push(`${where}[${i}]：文字でない・空`);
        else {
          texts.push([`${where}[${i}]`, s]);
          if (((s.match(/\*\*/g) || []).length) % 2) errors.push(`${where}[${i}]：** の閉じ忘れ`);
          if (opt.max && s.length > opt.max) warns.push(`${where}[${i}]：長い（${s.length}字。${opt.max}字くらいまでに）`);
        }
      });
    };
    const str = (where, v, need, max) => {
      if (v == null || v === '') { if (need) errors.push(`${where}：ない`); return; }
      if (!isStr(v)) { errors.push(`${where}：文字にする`); return; }
      texts.push([where, v]);
      if (max && v.length > max) warns.push(`${where}：長い（${v.length}字。${max}字くらいまでに）`);
    };
    const unknown = (where, obj, fields) => { for (const k of Object.keys(obj)) if (!fields.includes(k)) errors.push(`${where}：知らない項目名（${k}）`); };

    // ケガの対処
    const aidRe = /^a-[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const a of BC.aids) {
      const w = a.id;
      if (!aidRe.test(a.id)) errors.push(`${w}：id の形（a- ＋ 英小文字・数字・-）`);
      unknown(w, a, BC.AID_FIELDS);
      str(`${w}.name`, a.name, true, 30);
      if (typeof a.urgent !== 'boolean') errors.push(`${w}.urgent：true か false`);
      strList(`${w}.words`, a.words, { need: true });
      if (Array.isArray(a.words)) {
        if (a.words.length < 6 || a.words.length > 16) warns.push(`${w}.words：${a.words.length}個（10前後に）`);
        const seen = new Set();
        for (const x of a.words) { const k = norm(x); if (seen.has(k)) warns.push(`${w}.words：同じ言葉がある（${x}）`); seen.add(k); }
      }
      strList(`${w}.call`, a.call, { need: false, max: 70 });
      if (a.call == null) errors.push(`${w}.call：ない（なければ []）`);
      strList(`${w}.doctor`, a.doctor, { max: 70 });
      if (a.doctor == null) errors.push(`${w}.doctor：ない（なければ []）`);
      strList(`${w}.steps`, a.steps, { need: true, max: 90 });
      strList(`${w}.dont`, a.dont, { need: true, max: 70 });
      strList(`${w}.back`, a.back, { max: 80 });
      if (a.back == null) errors.push(`${w}.back：ない（なければ []）`);
      str(`${w}.note`, a.note, false, 160);
      if (a.urgent === true && !(a.call || []).length) errors.push(`${w}：urgent なのに call（119 のサイン）がない`);
      if (a.taping == null) errors.push(`${w}.taping：ない（なければ []）`);
      else if (!Array.isArray(a.taping)) errors.push(`${w}.taping：配列にする`);
      else for (const t of a.taping) {
        if (typeof t !== 'string' || !/^tp-/.test(t)) errors.push(`${w}.taping：テーピングの id でない（${JSON.stringify(t)}）`);
        else if (!BC.tapeById[t]) errors.push(`${w}.taping：ない id（${t}）`);
      }
      if (Array.isArray(a.steps) && a.steps.length && !a.steps.concat(a.call || []).some((s) => /大人/.test(s))) warns.push(`${w}：steps に「大人に知らせる」がない`);
    }

    // テーピング
    const tapeRe = /^tp-[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const isPt = (p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && isFinite(n));
    for (const t of BC.tapes) {
      const w = t.id;
      if (!tapeRe.test(t.id)) errors.push(`${w}：id の形（tp- ＋ 英小文字・数字・-）`);
      unknown(w, t, BC.TAPE_FIELDS);
      str(`${w}.name`, t.name, true, 30); str(`${w}.purpose`, t.purpose, true, 140); str(`${w}.who`, t.who, true, 120);
      for (const f of ['materials', 'before', 'after', 'cautions']) strList(`${w}.${f}`, t[f], { need: true, max: 90 });
      if (!Array.isArray(t.steps) || !t.steps.length) { errors.push(`${w}.steps：ない`); continue; }
      const views = BC.tapeViews(t);
      const mm = new Set(views.filter((v) => BC.TAPE_VIEWS[v]).map((v) => BC.TAPE_VIEWS[v].mm));
      if (mm.size > 1) warns.push(`${w}：大きさ（1 が何 mm か）のちがう絵がならぶ（${views.join('・')}）`);
      t.steps.forEach((st, i) => {
        const ws = `${w}.steps[${i}]`;
        if (!st || typeof st !== 'object') { errors.push(`${ws}：{ name, text, fig } の形`); return; }
        unknown(ws, st, ['name', 'text', 'fig']);
        str(`${ws}.name`, st.name, true, 24); str(`${ws}.text`, st.text, true, 180);
        if (!st.fig) { errors.push(`${ws}.fig：ない`); return; }
        const figs = BC.tapeFigs(st);
        if (!figs.length) errors.push(`${ws}.fig：空`);
        let n = 0;
        const fv = new Set();
        figs.forEach((fg, j) => {
          const wf = `${ws}.fig${Array.isArray(st.fig) ? `[${j}]` : ''}`;
          if (!fg || typeof fg !== 'object') { errors.push(`${wf}：{ view, strips } の形`); return; }
          unknown(wf, fg, ['view', 'strips']);
          const V = BC.TAPE_VIEWS[fg.view];
          if (!V) { errors.push(`${wf}.view：知らない絵（${fg.view}。${Object.keys(BC.TAPE_VIEWS).join('・')}）`); return; }
          if (fv.has(fg.view)) errors.push(`${wf}.view：同じ絵が2つある（${fg.view}）`);
          fv.add(fg.view);
          if (!Array.isArray(fg.strips)) { errors.push(`${wf}.strips：配列にする`); return; }
          const [bx, by, bw, bh] = V.box, mx = bw * 0.3, my = bh * 0.3;
          fg.strips.forEach((sp, k) => {
            const wk = `${wf}.strips[${k}]`;
            if (!sp || typeof sp !== 'object') { errors.push(`${wk}：{ pts, w } の形`); return; }
            unknown(wk, sp, ['pts', 'w']);
            if (!(typeof sp.w === 'number' && sp.w > 0)) errors.push(`${wk}.w：幅（0 より大きい数）`);
            else if (sp.w > Math.min(bw, bh) * 0.3) warns.push(`${wk}.w：太すぎる（${sp.w}）`);
            if (!Array.isArray(sp.pts)) { errors.push(`${wk}.pts：配列にする`); return; }
            sp.pts.forEach((p, m) => {
              if (p === null) {
                if (m === 0 || m === sp.pts.length - 1) errors.push(`${wk}.pts：null がはしにある`);
                else if (sp.pts[m - 1] === null) errors.push(`${wk}.pts：null が続いている`);
              } else if (!isPt(p)) errors.push(`${wk}.pts[${m}]：[x, y] の数でない（${JSON.stringify(p)}）`);
              else if (p[0] < bx - mx || p[0] > bx + bw + mx || p[1] < by - my || p[1] > by + bh + my) warns.push(`${wk}.pts[${m}]：絵からはなれすぎ（${p.join(', ')}）`);
            });
            const rs = runs(sp.pts.filter((p) => p === null || isPt(p)));
            if (!rs.length) errors.push(`${wk}.pts：2点以上の並びがない`);
            for (const r of rs) for (let m = 1; m < r.length; m++) if (Math.hypot(r[m][0] - r[m - 1][0], r[m][1] - r[m - 1][1]) < 0.01) warns.push(`${wk}.pts：同じ点が続いている（${r[m].join(', ')}）`);
            n++;
          });
        });
        if (!n) warns.push(`${ws}：新しく巻くテープ（strips）がない`);
      });
      // 安全の注意が入っているか
      const all = [].concat(t.after || [], t.cautions || []).join('\n');
      if (!/しびれ/.test(all)) errors.push(`${w}：after・cautions に「しびれ」を確かめることがない`);
      if (!/色/.test(all)) errors.push(`${w}：after・cautions に「指先（つま先）の色」を確かめることがない`);
      if (!/きつ/.test(all)) errors.push(`${w}：after・cautions に「きつく巻きすぎない」がない`);
      if (!/(病院|医師|診て)/.test((t.cautions || []).join('\n'))) errors.push(`${w}.cautions：「ケガをしたら、まず病院で診てもらう」がない`);
      if (!/(つけっぱなし|はがし)/.test((t.cautions || []).join('\n'))) errors.push(`${w}.cautions：「長い時間つけっぱなしにしない・はがす」がない`);
      if (!BC.aidsForTape(t.id).length) warns.push(`${w}（${t.name}）：どのケガの taping からも挙げられていない`);
    }

    // 共通（電話番号など）
    const C = BC.aidCommon;
    if (C != null) {
      if (typeof C !== 'object') errors.push('BC.aidCommon：{ rules, phones } の形');
      else {
        unknown('BC.aidCommon', C, ['rules', 'phones']);
        strList('BC.aidCommon.rules', C.rules, { need: true, max: 90 });
        if (!Array.isArray(C.phones)) errors.push('BC.aidCommon.phones：配列にする');
        else C.phones.forEach((p, i) => {
          const wp = `BC.aidCommon.phones[${i}]`;
          if (!p || typeof p !== 'object') { errors.push(`${wp}：{ num, name, text } の形`); return; }
          unknown(wp, p, ['num', 'name', 'text']);
          if (!BC.AID_PHONES.includes(p.num)) errors.push(`${wp}.num：書いてよい番号は ${BC.AID_PHONES.join('・')} だけ（${p.num}）`);
          str(`${wp}.name`, p.name, true); str(`${wp}.text`, p.text, true, 120);
        });
      }
    }

    // 電話番号は 119・#8000・#7119 だけ。URL・出典は書かない
    for (const [where, s] of texts) {
      const t = s.normalize('NFKC');
      for (const m of t.matchAll(/#\s*(\d{3,5})/g)) if (!BC.AID_PHONES.includes('#' + m[1])) errors.push(`${where}：書いてよくない番号（#${m[1]}）`);
      for (const m of t.matchAll(/(?<![\d#])(1\d\d)\s*番/g)) if (m[1] !== '119') errors.push(`${where}：書いてよくない番号（${m[1]}番）`);
      if (/\d{2,4}-\d{2,4}-\d{3,4}/.test(t) || /\b0120\b/.test(t)) errors.push(`${where}：電話番号のようなものがある`);
      if (/https?:|www\.|\.(com|jp|org)\b/i.test(t)) errors.push(`${where}：URL を書かない`);
    }
    return { errors, warns };
  };

  /* ---------- 図 ---------- */
  const TAPE = 'var(--tape, #fbfaf6)';
  const TAPE_EDGE = 'var(--tape-edge, #9a8676)';
  const NOW = 'var(--tape-now, var(--ball, #c9541a))';
  const NOW_EDGE = 'var(--tape-now-edge, #5c2509)';
  const NOW_INK = 'var(--tape-now-ink, #ffffff)';
  let uid = 0;

  const segDist = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  // 帯（1本）を、見える並びごとに。いまのステップの帯には、長さと、巻く向きの印（＞）の位置もつける
  const prep = (sp, now) => ({ sp, runs: runs(sp.pts).map((r) => (now ? (() => { const smp = sample(r); return { r, smp, L: smp[smp.length - 1].s }; })() : { r })) });
  // 印は帯のまん中に。同じステップであとから巻く帯にかくれるときは、見えている半分へずらす（少し小さく）
  function placeMarks(list) {
    const covered = (q, from) => {
      for (let k = from; k < list.length; k++) {
        const half = list[k].sp.w / 2 - 0.3;
        for (const ru of list[k].runs) for (let i = 1; i < ru.smp.length; i++) if (segDist(q, ru.smp[i - 1].p, ru.smp[i].p) < half) return true;
      }
      return false;
    };
    list.forEach((it, k) => {
      const w = it.sp.w, gap = w * 1.55;
      for (const ru of it.runs) {
        ru.marks = [];
        const n = Math.max(1, Math.floor((ru.L - w * 0.5) / gap));
        const start = (ru.L - (n - 1) * gap) / 2;
        for (let i = 0; i < n; i++) {
          const q = at(ru.smp, start + i * gap);
          if (!q) continue;
          const off = w * 0.25, nv = [-q.d[1] * off, q.d[0] * off];
          const pa = [q.p[0] + nv[0], q.p[1] + nv[1]], pb = [q.p[0] - nv[0], q.p[1] - nv[1]];
          const ca = covered(pa, k + 1), cb = covered(pb, k + 1);
          if (ca && cb) continue;
          ru.marks.push(!ca && !cb ? { p: q.p, d: q.d, k: 1 } : { p: ca ? pb : pa, d: q.d, k: 0.7 });
        }
      }
    });
  }
  function stripSVG(it, now, k, e) {
    const sp = it.sp;
    return it.runs.map((ru, j) => {
      const d = curve(ru.r, false);
      let s = `<g data-ta="${now ? 'now' : 'done'}" data-k="${k}" data-j="${j}"${now ? ` data-len="${r1(ru.L)}"` : ''}>` +
        `<path d="${d}" pathLength="100" style="fill:none;stroke:${now ? NOW_EDGE : TAPE_EDGE};stroke-width:${r1(sp.w + 2 * e)};stroke-linejoin:round"/>` +
        `<path d="${d}" pathLength="100" style="fill:none;stroke:${now ? NOW : TAPE};stroke-width:${sp.w};stroke-linejoin:round"/>`;
      if (now && ru.marks && ru.marks.length) {
        let ch = '';
        for (const m of ru.marks) {
          const [x, y] = m.p, [dx, dy] = m.d, a = sp.w * 0.2 * m.k, b = sp.w * 0.24 * m.k;
          ch += `M${r1(x - dx * a - dy * b)} ${r1(y - dy * a + dx * b)} L${r1(x + dx * a * 0.6)} ${r1(y + dy * a * 0.6)} L${r1(x - dx * a + dy * b)} ${r1(y - dy * a - dx * b)}`;
        }
        s += `<path data-ta="mark" d="${ch}" style="fill:none;stroke:${NOW_INK};stroke-width:${r1(sp.w * 0.09)};stroke-linecap:round;stroke-linejoin:round;opacity:0.9"/>`;
      }
      return s + '</g>';
    }).join('');
  }

  BC.drawTape = function (el, tapeId, stepIndex, opt = {}) {
    const tape = BC.tapeById[tapeId];
    if (!el || !tape) return null;
    const steps = tape.steps || [];
    const total = steps.length;
    const cur = stepIndex == null || !isFinite(stepIndex) ? total : Math.max(-1, Math.min(total, Math.round(stepIndex)));
    const views = BC.tapeViews(tape).filter((v) => BC.TAPE_VIEWS[v]);
    if (!views.length) return null;
    const id = 'ta' + ++uid;
    const H = Math.max(...views.map((v) => BC.TAPE_VIEWS[v].box[3]));
    const gap = H * 0.045;
    let x = 0;
    const panels = views.map((vid, i) => {
      const V = BC.TAPE_VIEWS[vid];
      const p = { vid, V, x, i };
      x += V.box[2] + gap;
      return p;
    });
    const W = x - gap;
    // 線の太さ・字の大きさは、図全体の幅に合わせる（画面の上で、どの図も同じくらいに見える）
    const fs = Math.min(W * 0.042, H * 0.075);
    const labH = opt.labels === false ? 0 : fs * 1.75;
    const ow = W * 0.0085, e = W * 0.0048;
    const stripsOf = (st, vid) => { for (const fg of BC.tapeFigs(st)) if (fg && fg.view === vid) return fg.strips || []; return []; };
    let body = '';
    for (const p of panels) {
      const [bx, by, bw, bh] = p.V.box;
      const done = [], now = [];
      for (let i = 0; i < Math.min(cur, total); i++) done.push(...stripsOf(steps[i], p.vid).map((sp) => prep(sp, false)));
      if (cur >= 0 && cur < total) now.push(...stripsOf(steps[cur], p.vid).map((sp) => prep(sp, true)));
      placeMarks(now);
      const clip = `${id}-c${p.i}`;
      body += `<svg x="${r1(p.x)}" y="0" width="${bw}" height="${bh}" viewBox="${bx} ${by} ${bw} ${bh}" overflow="hidden">` +
        `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${r1(W * 0.022)}" style="fill:var(--sheet-2, #f7f8f5)"/>` +
        (p.V.floor != null ? `<line x1="${bx}" x2="${bx + bw}" y1="${p.V.floor + 0.6}" y2="${p.V.floor + 0.6}" style="stroke:var(--line-2, #c3c9c1);stroke-width:${r1(W * 0.005)}"/>` : '') +
        `<defs><clipPath id="${clip}">${p.V.shapes.map((d) => `<path d="${d}"/>`).join('')}</clipPath></defs>` +
        p.V.shapes.map((d) => `<path d="${d}" style="fill:${SKIN_LINE};stroke:${SKIN_LINE};stroke-width:${r1(ow)};stroke-linejoin:round"/>`).join('') +
        p.V.shapes.map((d) => `<path d="${d}" style="fill:${SKIN}"/>`).join('') +
        p.V.under +
        `<g clip-path="url(#${clip})">${done.map((it, k) => stripSVG(it, false, k, e)).join('')}${now.map((it, k) => stripSVG(it, true, k, e)).join('')}</g>` +
        (p.V.over || '') +
        `</svg>`;
      if (labH) body += `<text x="${r1(p.x + bw / 2)}" y="${r1(H + labH * 0.7)}" style="fill:var(--ink-3, #6f7a76);font-family:var(--font-body, sans-serif);font-size:${r1(fs)}px;text-anchor:middle">${p.V.name}</text>`;
    }
    const st = cur >= 0 && cur < total ? steps[cur] : null;
    const label = `${tape.name}${st ? `：${cur + 1}. ${st.name}` : cur < 0 ? '（巻く前）' : '（できあがり）'}の図`.replace(/"/g, '');
    el.innerHTML = `<svg viewBox="0 0 ${r1(W)} ${r1(H + labH)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" style="display:block;width:100%;height:auto;max-height:${opt.maxHeight || '62vh'}">${body}</svg>`;
    const svg = el.querySelector('svg');

    // いまのテープ：巻いていくように線が伸びる（1本ずつ順に。ちがう向きの絵では、同じ本を同時に）
    let anims = [];
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function play() {
      anims.forEach((a) => a.cancel());
      anims = [];
      if (reduce || opt.anim === false || !svg || typeof svg.animate !== 'function') return;
      const PER = 950, PAUSE = 160, HID = 140; // 1本の時間・本と本の間・裏に回るところ
      const groups = [...svg.querySelectorAll('g[data-ta="now"]')];
      const byK = {};
      for (const g of groups) (byK[g.dataset.k] = byK[g.dataset.k] || []).push(g);
      let t0 = 120;
      for (const k of Object.keys(byK).sort((a, b) => a - b)) {
        // この本の、絵ごとの見える並び
        const perPanel = {};
        for (const g of byK[k]) {
          const pan = g.closest('svg');
          (perPanel[pan.getAttribute('x')] = perPanel[pan.getAttribute('x')] || []).push(g);
        }
        for (const list of Object.values(perPanel)) {
          const lens = list.map((g) => parseFloat(g.dataset.len) || 1);
          const sum = lens.reduce((a, b) => a + b, 0);
          const draw = PER - HID * (list.length - 1);
          let t = t0;
          list.forEach((g, j) => {
            const dur = Math.max(160, (draw * lens[j]) / sum);
            for (const pth of g.querySelectorAll('path[pathLength]')) {
              anims.push(pth.animate([{ strokeDasharray: '102 102', strokeDashoffset: 102 }, { strokeDasharray: '102 102', strokeDashoffset: 0 }], { duration: dur, delay: t, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'both' }));
            }
            const mk = g.querySelector('[data-ta="mark"]');
            if (mk) anims.push(mk.animate([{ opacity: 0 }, { opacity: 0.9 }], { duration: 220, delay: t + dur * 0.85, fill: 'both' }));
            t += dur + HID;
          });
        }
        t0 += PER + PAUSE;
      }
    }
    play();
    return { svg, step: cur, total, replay: play };
  };
})(typeof window !== 'undefined' ? window : globalThis);
