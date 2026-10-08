/* 中3 6章 円　入試レベル2「【入試】円と相似の証明」。自作問題。証明の授業。
   円Oの周上に AB＝AC となる A、B、C。弧BC上に D、AD と BC の交点を E。(1) △ABE∽△ADB を証明。(2) AB＝6cm、AD＝9cm のとき AE を求める。
   証明：△ABE と △ADB において ①共通な角 ∠BAE＝∠DAB ②AB＝AC より ∠ABE＝∠ABC＝∠ACB ③同じ弧ABの円周角 ∠ACB＝∠ADB ④②③より ∠ABE＝∠ADB → 2組の角がそれぞれ等しい → △ABE∽△ADB。
   AB：AD＝AE：AB → 6：9＝x：6 → x＝4（AB²＝AE×AD の形だが、方べきの定理とは言わず、比例式で解く）。
   図：円O（中心 (5.9,3.25)、半径2.2）に A(5.9,5.45) B(3.788,3.866) C(8.012,3.866) D(7.626,1.886)、E(6.667,3.866)（python で、AB＝AC、AB：AD＝2：3、AE：AB＝2：3、△ABE∽△ADB、∠ABE＝∠ACB＝∠ADB＝36.87° を確認）。
   誤答：底角の根拠を円周角と言う、同じ弧の円周角の根拠を AB＝AC と言う、合同条件と相似条件の取りちがい、差（9−6）で求める、対応を取りちがえる。ポンタは見た目で相似と決めつける。 */
(function () {
  const { T, B, Q, FIG } = KL;
  // ---- 図の小さな部品（この台本の中で定義。座標は数学の座標で、y が上） ----
  const R2D = 180 / Math.PI, D2R = Math.PI / 180;
  const dirOf = (V, P) => Math.atan2(P[1] - V[1], P[0] - V[0]) * R2D;
  const sweep = (V, P, Q) => { let a1 = dirOf(V, P), a2 = dirOf(V, Q); let d = ((a2 - a1) % 360 + 360) % 360; if (d > 180) { const t = a1; a1 = a2; a2 = t; d = 360 - d; } return [a1, a1 + d]; };
  const mark = (V, P, Q, r, c, o) => { const s = sweep(V, P, Q); return Object.assign({ k: 'ell', o: V, rx: r, ry: r, a1: s[0], a2: s[1], c, wd: 3.4, d: 0.3 }, o || {}); };
  const num = (V, P, Q, r, text, c, o) => { const s = sweep(V, P, Q), m = (s[0] + s[1]) / 2 * D2R; return Object.assign({ k: 'label', at: [V[0] + r * Math.cos(m), V[1] + r * Math.sin(m)], text, c, size: 27, d: 0.2 }, o || {}); };
  const lab = (x, y, text, c, o) => Object.assign({ k: 'label', at: [x, y], text, c, size: 28, d: 0.2 }, o || {});
  const ln = (a, b, c, o) => Object.assign({ k: 'seg', a, b, c, wd: 3.6, d: 0.6 }, o || {});
  const dot = (at, name, dir, c, o) => Object.assign({ k: 'pt', at, name, dir, off: 26, c, r: 6, d: 0.15 }, o || {});
  const circ = (o, r, c, ex) => Object.assign({ k: 'ell', o, rx: r, ry: r, c: c || 'w', wd: 3.6, d: 1.0 }, ex || {});
  const arcAt = (o, r, a1, a2, c, ex) => Object.assign({ k: 'ell', o, rx: r, ry: r, a1, a2, c, wd: 7, d: 0.6 }, ex || {});
  const away = (p, c) => { const d = [p[0] - c[0], p[1] - c[1]], l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l]; };
  const unit = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const rt = (p, u, v, c) => ({ k: 'right', at: p, u, v, s: 16, c: c || 'w' });
  const tri = (A, B, C, c, o) => Object.assign({ k: 'poly', pts: [A, B, C], close: true, c, wd: 3.2, fill: c, alpha: 0.16, d: 0.6 }, o || {});
  const tick = (a, b, n, c) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, h = 0.17, g = 0.13, out = []; for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * g, cx = mx + ux * o, cy = my + uy * o; out.push({ k: 'seg', a: [cx - uy * h, cy + ux * h], b: [cx + uy * h, cy - ux * h], c, wd: 3, d: 0.1 }); } return out; };
  const view = [0, 0, 11.8, 6.0];
  const f1 = FIG('f1', view, 1180, 600, [], { col: 1 });
  const f2 = FIG('f2', view, 1180, 600, [], { col: 1 });
  const f3 = FIG('f3', view, 1180, 600, [], { col: 1 });
  const f4 = FIG('f4', view, 1180, 600, [], { col: 1 });
  const f5 = FIG('f5', view, 1180, 600, [], { col: 1 });
  const G1 = (...i) => ({ fig: 'f1', items: i.flat(3) });
  const G2 = (...i) => ({ fig: 'f2', items: i.flat(3) });
  const G3 = (...i) => ({ fig: 'f3', items: i.flat(3) });
  const G4 = (...i) => ({ fig: 'f4', items: i.flat(3) });
  const G5 = (...i) => ({ fig: 'f5', items: i.flat(3) });
  const O = [5.9, 3.25];
  const Ap = [5.9, 5.45], Bp = [3.788, 3.866], Cp = [8.012, 3.866], Dp = [7.626, 1.886], Ep = [6.667, 3.866];
  const base = [circ(O, 2.2, 'w'), ln(Ap, Bp, 'w'), ln(Ap, Cp, 'w'), ln(Bp, Cp, 'w'), ln(Ap, Dp, 'w'), ln(Bp, Dp, 'w'),
    dot(Ap, 'A', [0, 1], 'y'), dot(Bp, 'B', [-1, 0.2], 'y'), dot(Cp, 'C', [1, 0.2], 'y'), dot(Dp, 'D', [0.8, -0.6], 'y'), dot(Ep, 'E', [0.7, 0.8], 'y', { r: 5 }),
    tick(Ap, Bp, 1, 'g'), tick(Ap, Cp, 1, 'g')];
  const tris = [tri(Ap, Bp, Ep, 'y', { alpha: 0.2 }), tri(Ap, Dp, Bp, 'g', { alpha: 0.2 })];
  const common = [mark(Ap, Bp, Dp, 0.55, 'p'), mark(Ap, Bp, Dp, 0.7, 'p')];
  const abe = [mark(Bp, Ap, Cp, 0.6, 'y'), mark(Cp, Ap, Bp, 0.6, 'y')];
  const adb = [mark(Dp, Ap, Bp, 0.6, 'y')];
  const lens = [lab(4.65, 4.95, '6cm', 'y', { size: 26 }), lab(7.55, 3.15, '9cm', 'g', { size: 26 }), lab(6.1, 4.4, 'x', 'p', { size: 30 })];

  KL.lesson({ id: 'g3ch6-n02', unit: '中3　円', kick: '3年6章　入試レベル2', title: '【入試】円と相似の証明', card: '【入試】円と相似の証明', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、入試レベルの問題です。円周角の定理を根拠に、相似を証明して、長さを求めます。', { title: true, point: false, ft: 'happy' }),
    B('この2つの三角形、形が似てるよ！ 見た目が似てれば、相似でしょ？ 証明は、いらないよね？', { title: true, fb: 'proud', up: true }),
    T('見た目が似ているだけでは、根拠になりません。円周角の定理を使って、きちんと示しましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。円Oの周上に、AB＝ACとなる3点A、B、Cがあります。弧BC上に点Dをとり、ADとBCの交点をEとします。', { say: '問題です。円オーのしゅうじょうに、エービー イコール エーシーとなる3点エー、ビー、シーがあります。こ ビーシー上に点ディーをとり、エーディーとビーシーのこうてんをイーとします。', part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: 'AB＝AC\nDは弧BC上\nEはADとBCの交点', t: 4.0 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: '△ABE∽△ADB', t: 3.0 }, Object.assign(f1, { prims: [] })],
      draw: [G1(base)] }),
    T('この問題は、2つの問いです。1つめは、△ABE∽△ADBの証明。2つめは、AB＝6cm、AD＝9cmのときの、AEの長さです。', { say: 'この問題は、2つの問いです。1つめは、さんかく エービーイー そうじ さんかく エーディービーの証明。2つめは、エービー イコール 6センチメートル、エーディー イコール 9センチメートルのときの、エーイーの長さです。', ft: 'normal', point: false }),

    /* ---------- 2ページ目：証明 ---------- */
    T('まず、証明を書きます。△ABEと△ADBを、取り出します。2つの三角形は、点Aの角を共有しています。', { say: 'まず、証明を書きます。さんかく エービーイーとさんかく エーディービーを、取り出します。2つの三角形は、点エーの角を共有しています。', clear: true, cols: [0.34, 0.66], part: '証明を組み立てる', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '△ABE と △ADB において\n共通な角だから\n∠BAE＝∠DAB …①', t: 5.0 }, Object.assign(f2, { prims: [] })], draw: [G2(base, tris, common)] }),
    T('つぎは、∠ABEです。EはBC上にあるので、∠ABE＝∠ABCです。AB＝ACの二等辺三角形で、底角が等しくなります。', { say: 'つぎは、かく エービーイーです。イーはビーシー上にあるので、かく エービーイー イコール かく エービーシーです。エービー イコール エーシーのにとうへん三角形で、ていかくが等しくなります。', ft: 'normal', point: false, draw: [G2(abe)] }),

    /* ---------- 問1：底角の根拠 ---------- */
    Q('q1', T('問題です。∠ABE＝∠ACBと言える、根拠は、どれでしょう。', { say: '問題です。かく エービーイー イコール かく エーシービーと言える、根拠は、どれでしょう。', ft: 'normal' }),
      [{ t: 'AB＝ACだから、底角が等しい', ok: true }, { t: '同じ弧に対する円周角だから' }, { t: '対頂角は等しいから' }, { t: '共通な角だから' }],
      { 1: [B('どっちも円周角だから、同じ弧に対する円周角でしょ？', { fb: 'happy', up: true }), T('∠ABCは弧ACの円周角、∠ACBは弧ABの円周角で、別々の弧です。等しい理由は、AB＝ACの二等辺三角形の、底角だからです。', { say: 'かく エービーシーはこ エーシーのえんしゅうかく、かく エーシービーはこ エービーのえんしゅうかくで、別々のこです。等しい理由は、エービー イコール エーシーのにとうへん三角形の、ていかくだからです。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('対頂角は、2直線が交わってできる、向かい合った角です。∠ABEと∠ACBは、そうではありません。', { say: 'たいちょうかくは、2直線が交わってできる、向かい合った角です。かく エービーイーとかく エーシービーは、そうではありません。', ft: 'normal' })],
        ok: [T('正解！ AB＝ACなので、△ABCは二等辺三角形です。底角が等しく、∠ABE＝∠ABC＝∠ACBです。', { say: '正解！エービー イコール エーシーなので、さんかく エービーシーはにとうへん三角形です。ていかくが等しく、かく エービーイー イコール かく エービーシー イコール かく エーシービーです。', ft: 'happy' }), B('二等辺三角形の底角を、使うんだね！', { fb: 'star', up: true })],
        wrong: [T('共通な角は、∠BAEと∠DABのような、2つの三角形がともに持つ角です。∠ABEと∠ACBは、別々の角です。', { say: '共通な角は、かく ビーエーイーとかく ディーエービーのような、2つの三角形がともに持つ角です。かく エービーイーとかく エーシービーは、別々の角です。', ft: 'normal' })] }),
    T('これが、②です。つぎは、∠ACBと∠ADBです。どちらも、点C、Dから、弧ABを見た角です。', { say: 'これが、にです。つぎは、かく エーシービーとかく エーディービーです。どちらも、点シー、ディーから、こ エービーを見た角です。', ft: 'normal', point: false, draw: [G2(adb)],
      add: [{ col: 0, type: 'text', size: 'xs', text: 'AB＝ACより\n∠ABE＝∠ACB …②', t: 3.5 }] }),

    /* ---------- 問2：円周角の定理 ---------- */
    Q('q2', T('問題です。∠ACB＝∠ADBと言える、根拠は、どれでしょう。', { say: '問題です。かく エーシービー イコール かく エーディービーと言える、根拠は、どれでしょう。', ft: 'normal' }),
      [{ t: 'AB＝ACだから' }, { t: '共通な角だから' }, { t: '仮定より' }, { t: '同じ弧ABの円周角は等しいから', ok: true }],
      { 0: [B('さっきと同じ、AB＝ACでしょ？', { say: 'さっきと同じ、エービー イコール エーシーでしょ？', fb: 'happy', up: true }), T('AB＝ACは、△ABCの底角のときに使いました。∠ACBと∠ADBは、点C、Dから、同じ弧ABを見た角なので、円周角の定理です。', { say: 'エービー イコール エーシーは、さんかく エービーシーのていかくのときに使いました。かく エーシービーとかく エーディービーは、点シー、ディーから、同じこ エービーを見た角なので、えんしゅうかくの定理です。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('∠ACBと∠ADBは、2つの三角形が共有する角ではありません。C、Dという別の点から、弧ABを見た角です。', { say: 'かく エーシービーとかく エーディービーは、2つの三角形が共有する角ではありません。シー、ディーという別の点から、こ エービーを見た角です。', ft: 'normal' })],
        ok: [T('正解！ ∠ACBも∠ADBも、弧ABに対する円周角です。同じ弧の円周角は等しいので、∠ACB＝∠ADBです。', { say: '正解！かく エーシービーもかく エーディービーも、こ エービーに対するえんしゅうかくです。同じこのえんしゅうかくは等しいので、かく エーシービー イコール かく エーディービーです。', ft: 'happy' }), B('円周角の定理が、証明の根拠になるんだね！', { fb: 'star', up: true })],
        wrong: [T('∠ACB＝∠ADBは、問題文には書かれていません。仮定ではなく、円周角の定理から、言えることです。', { say: 'かく エーシービー イコール かく エーディービーは、問題文には書かれていません。かていではなく、えんしゅうかくの定理から、言えることです。', ft: 'normal' })] }),
    T('これが、③です。②と③を合わせると、∠ABE＝∠ADBが言えます。これが、④です。', { say: 'これが、さんです。にとさんを合わせると、かく エービーイー イコール かく エーディービーが言えます。これが、よんです。', ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '同じ弧ABの円周角は\n等しいから\n∠ACB＝∠ADB …③', t: 4.0 }, { col: 0, type: 'text', size: 'xs', text: '②③より\n∠ABE＝∠ADB …④', t: 3.5 }] }),

    /* ---------- 3ページ目：相似条件 ---------- */
    T('①と④で、2組の角が、それぞれ等しいと分かりました。いよいよ、相似条件を選びます。', { say: 'いちとよんで、2組の角が、それぞれ等しいと分かりました。いよいよ、そうじ条件を選びます。', clear: true, cols: [0.34, 0.66], part: '相似条件と結論', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', text: '①∠BAE＝∠DAB\n④∠ABE＝∠ADB', t: 3.5 }, Object.assign(f3, { prims: [] })], draw: [G3(base, tris, common, abe, adb)] }),

    /* ---------- 問3：相似条件 ---------- */
    Q('q3', T('問題です。△ABE∽△ADBの根拠になる、相似条件は、どれでしょう。', { say: '問題です。さんかく エービーイー そうじ さんかく エーディービーの根拠になる、そうじ条件は、どれでしょう。', ft: 'normal' }),
      [{ t: '3組の辺の比がすべて等しい' }, { t: '2組の辺の比とその間の角' }, { t: '2組の角がそれぞれ等しい', ok: true }, { t: '1組の辺と両端の角が等しい' }],
      { 0: [T('辺の長さは、まだ分かっていません。分かっているのは、角が等しいことです。角に注目した条件を選びます。', { ft: 'normal' })],
        1: [B('辺の比と、角が出てくるから、これでしょ？', { fb: 'happy', up: true }), T('辺の比は、まだ分かっていません。①と④で、等しいと分かったのは、角です。2組の角を使う条件を、選びます。', { say: '辺の比は、まだ分かっていません。いちとよんで、等しいと分かったのは、角です。2組の角を使う条件を、選びます。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ ①と④より、2組の角がそれぞれ等しいので、△ABE∽△ADBです。', { say: '正解！いちとよんより、2組の角がそれぞれ等しいので、さんかく エービーイー そうじ さんかく エーディービーです。', ft: 'happy' }), B('証明が、完成したね！', { fb: 'star', up: true })],
        wrong: [T('これは、合同条件の言い方です。相似条件では、2組の角がそれぞれ等しい、といいます。', { ft: 'normal' })] }),
    T('これで、1つめの証明が終わりました。つぎは、2つめ。相似な三角形の、対応する辺の比を使います。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '①④より、2組の角が\nそれぞれ等しいから\n△ABE∽△ADB', t: 5.0 }] }),

    /* ---------- 4ページ目：長さ ---------- */
    T('AB＝6cm、AD＝9cmです。対応は、AがA、BがD、EがBです。ABに対応するのは、ADです。AEに対応するのは、ABです。', { say: 'エービー イコール 6センチメートル、エーディー イコール 9センチメートルです。対応は、エーがエー、ビーがディー、イーがビーです。エービーに対応するのは、エーディーです。エーイーに対応するのは、エービーです。', clear: true, cols: [0.34, 0.66], part: '長さを求める', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '対応', text: 'A → A\nB → D\nE → B', t: 4.0 }, { col: 0, type: 'text', size: 'xs', label: '比', text: 'AB：AD＝AE：AB', t: 3.5 }, Object.assign(f4, { prims: [] })],
      draw: [G4(base, tris, lens)] }),

    /* ---------- 問4：AE ---------- */
    Q('q4', T('最後の問題です。AB：AD＝AE：ABに、AB＝6、AD＝9を入れて、AEの長さを求めます。何cmでしょう。', { say: '最後の問題です。エービー たい エーディー イコール エーイー たい エービーに、エービー イコール 6、エーディー イコール 9を入れて、エーイーの長さを求めます。何センチメートルでしょう。', ft: 'happy' }),
      [{ t: '3cm' }, { t: '4cm', ok: true }, { t: '6cm' }, { t: '9cm' }],
      { 0: [B('9−6で、3cmじゃない？', { say: '9 ひく 6で、3センチメートルじゃない？', fb: 'happy', up: true }), T('3cmは、AD−ABの差です。相似な図形では、差ではなく、比が等しくなります。6：9＝x：6を解いて、x＝4です。', { say: '3センチメートルは、エーディー ひく エービーの差です。そうじな図形では、差ではなく、比が等しくなります。6 たい 9 イコール エックス たい 6を解いて、エックス イコール 4です。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('6cmは、AB：AD＝AE：ADとしたときの答えです。AEに対応するのは、ABです。6：9＝x：6から、x＝4です。', { say: '6センチメートルは、エービー たい エーディー イコール エーイー たい エーディーとしたときの答えです。エーイーに対応するのは、エービーです。6 たい 9 イコール エックス たい 6から、エックス イコール 4です。', ft: 'normal' })],
        ok: [T('正解！ 6：9＝x：6。9x＝36。x＝4。AE＝4cmです。', { say: '正解！6 たい 9 イコール エックス たい 6。9エックス イコール 36。エックス イコール 4。エーイー イコール 4センチメートルです。', ft: 'happy' }), B('6×6＝36と、4×9＝36が、同じになるんだね！', { say: '6 かける 6 イコール 36と、4 かける 9 イコール 36が、同じになるんだね！', fb: 'star', up: true })],
        wrong: [T('9cmは、ADの長さです。AEは、ADの一部なので、ADより短くなります。6：9＝x：6から、x＝4です。', { say: '9センチメートルは、エーディーの長さです。エーイーは、エーディーの一部なので、エーディーより短くなります。6 たい 9 イコール エックス たい 6から、エックス イコール 4です。', ft: 'normal' })] }),
    T('確かめます。EDの長さは、AD−AEで、9−4＝5cmです。AEは、ADの中に、ちゃんと収まっています。', { say: '確かめます。イーディーの長さは、エーディー ひく エーイーで、9 ひく 4 イコール 5センチメートルです。エーイーは、エーディーの中に、ちゃんと収まっています。', ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '答え', text: 'AE＝{{4}}cm', t: 3.0 }] }),

    /* ---------- 5ページ目：まとめ ---------- */
    T('まとめです。共通な角、二等辺三角形の底角、同じ弧の円周角。この3つで、2組の角が等しくなり、相似が言えました。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '共通な角\n底角は等しい\n同じ弧の円周角\n→ 2組の角で相似\n→ 比で長さを求める', t: 6.5 }, Object.assign(f5, { prims: [] })],
      draw: [G5(base, tris, common, abe, adb)] }),
    B('見た目じゃなくて、根拠を3つ並べたら、相似になったよ！ もう、決めつけないよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
