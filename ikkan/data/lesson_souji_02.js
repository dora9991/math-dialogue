/* 相似な図形 第2時：相似比を使って、辺の長さを求めよう。
   元：授業ナビ標準版 souji-02（例）。例題1（相似比を求めて、比例式で辺 EF・DF を求める）を「今日の問い」（辺 EF を求める式を考える）と「例題」（辺 BC・CA を、対応する辺をさがして求める）に分け、
   「相似比が 1：1 の図形はどんな関係か」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（△ABC∽△DEF で、辺 EF の長さを求める式を考える）。個人3分 → ペア3分 → ことば（比例式・ad＝bc）→ 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（比例式・四角形・模型の縮尺・写真の拡大）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（和が 35cm の 2辺。ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で、図の頂点の座標から長さ・比を計算し直して確かめた（図に書いた長さは、座標から出した値）。
   ・記号 ∽ は第1時で読み方をことわってある。対応する頂点の順は、答え（B）の比例式（AB：DE＝BC：EF の順）で示した。
   検算：node tools/verify.cjs souji-02　／　見た目：node tools/check.cjs <出力先> souji-02 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const R = Math.PI / 180, J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  // 図に見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）。o＝{ w: 横の幅の割合 }
  const cap = (fig, text, o) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`, o);
  // 三角形：nm＝'ABC'。AB＝l1、BC＝l2、CA＝l3（A が左下、B が右下）
  const tri3 = (nm, l1, l2, l3) => { const x = (l1 * l1 + l3 * l3 - l2 * l2) / (2 * l1); return { [nm[0]]: [0, 0], [nm[1]]: [l1, 0], [nm[2]]: [x, Math.sqrt(l3 * l3 - x * x)] }; };
  // 移す：s＝倍率、rot＝回す角（度。反時計まわり）、dx・dy＝平行移動、names＝名前の置きかえ
  const mv = (P, o) => { const a = (o.rot || 0) * R, s = o.s || 1, out = {}; Object.keys(P).forEach(k => { const x = P[k][0] * s, y = P[k][1] * s; out[(o.names && o.names[k]) || k] = [x * Math.cos(a) - y * Math.sin(a) + (o.dx || 0), x * Math.sin(a) + y * Math.cos(a) + (o.dy || 0)]; }); return out; };
  const cenOf = P => { const ks = Object.keys(P); return [ks.reduce((s, k) => s + P[k][0], 0) / ks.length, ks.reduce((s, k) => s + P[k][1], 0) / ks.length]; };
  // 頂点の字：図形の中心から外へむけて置く
  const vlOut = (P, k) => { const c = cenOf(P), o = {}; Object.keys(P).forEach(n => { o[n] = [n, Math.atan2(P[n][1] - c[1], P[n][0] - c[0]) / R, k || 3.4]; }); return o; };
  // 辺 a-b の外がわに、長さの字 t を置く（字の大きさをみて、辺からはなす）
  const side = (P, a, b, t) => {
    const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], c = cenOf(P), vx = m[0] - c[0], vy = m[1] - c[1], L = Math.hypot(vx, vy) || 1, ux = vx / L, uy = vy / L;
    const w = String(t).length * 1.7 + 1, off = Math.abs(ux) * w / 2 + Math.abs(uy) * 1.6 + 1.6;
    return { p: m, t, dx: ux * off, dy: -uy * off };
  };
  // 図形 1つぶんの、辺の長さの字（lens＝{ AB: '8cm', … }）
  const sides = (P, lens) => Object.keys(lens).map(k => side(P, k[0], k[1], lens[k]));
  // 2つの図形をならべた図（P1・P2＝点の座標、l1・l2＝辺の長さの字）
  const twoFig = (P1, P2, l1, l2, pad) => GEO({
    pts: Object.assign({}, P1, P2), poly: [Object.keys(P1).join(''), Object.keys(P2).join('')], pad: pad || 5,
    vl: Object.assign(vlOut(P1), vlOut(P2)), txt: sides(P1, l1).concat(sides(P2, l2))
  });

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い：△ABC（AB＝4、BC＝6、CA＝5）と、これを 2.5倍した △DEF（DE＝10、EF＝15、FD＝12.5）
  const W_ABC = tri3('BCA', 6, 5, 4), W_DEF = mv(W_ABC, { s: 2.5, dx: 11, names: { A: 'D', B: 'E', C: 'F' } });
  // 例題：△ABC（AB＝6、BC＝9、CA＝12）と、これを 5/3倍した △DEF（DE＝10、EF＝15、FD＝20）
  const E_ABC = tri3('ACB', 12, 9, 6), E_DEF = mv(E_ABC, { s: 5 / 3, dx: 19, names: { A: 'D', B: 'E', C: 'F' } });
  // 演習プリント 図1：△ABC（AB＝6、BC＝7、CA＝5）と、これを 1.5倍して 180°回した △DEF（DE＝9、EF＝10.5、FD＝7.5）
  const D_ABC = tri3('BCA', 7, 5, 6), D_DEF = mv(D_ABC, { s: 1.5, rot: 180, dx: 24, dy: 7.5, names: { A: 'D', B: 'E', C: 'F' } });
  // 図2：等脚台形 ABCD（AB＝10、CD＝15、高さ 6）と、これを 0.6倍して 180°回した EFGH（EF＝6、GH＝9）
  const Q_ABCD = { A: [2.5, 6], B: [12.5, 6], C: [15, 0], D: [0, 0] };
  const Q_EFGH = mv(Q_ABCD, { s: 0.6, rot: 180, dx: 28, dy: 3.6, names: { A: 'E', B: 'F', C: 'G', D: 'H' } });
  // 小テストでは、図は使わない

  /* ---------------- 図 ---------------- */
  const figW = twoFig(W_ABC, W_DEF, { AB: '4cm', BC: '6cm' }, { DE: '10cm', EF: 'x cm' }, 6);
  const figE = twoFig(E_ABC, E_DEF, { AB: '6cm', BC: 'x cm', CA: 'y cm' }, { DE: '10cm', EF: '15cm', FD: '20cm' }, 6);
  const fig1 = cap(twoFig(D_ABC, D_DEF, { AB: '6cm', BC: '7cm', CA: '5cm' }, { DE: '9cm' }, 5), '図1', { w: 1 });
  const fig2 = cap(twoFig(Q_ABCD, Q_EFGH, { AB: '10cm' }, { GH: '9cm' }, 5), '図2', { w: 1.2 });

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ---------------- */
  const d = (P, s) => Math.hypot(P[s[0]][0] - P[s[1]][0], P[s[0]][1] - P[s[1]][1]);
  const ang = (P, v, a, b) => { const ux = P[a][0] - P[v][0], uy = P[a][1] - P[v][1], wx = P[b][0] - P[v][0], wy = P[b][1] - P[v][1]; return Math.abs(Math.atan2(ux * wy - uy * wx, ux * wx + uy * wy)) * 180 / Math.PI; };
  // 対応する順の三角形 s、t が相似か（3つの辺の比がすべて等しく、対応する角がすべて等しい）。比（t の辺 ÷ s の辺）も返す
  const simR = (P, Q, s, t) => { const r = [0, 1, 2].map(i => d(Q, t[i] + t[(i + 1) % 3]) / d(P, s[i] + s[(i + 1) % 3])); const okA = [0, 1, 2].every(i => near(ang(P, s[i], s[(i + 1) % 3], s[(i + 2) % 3]), ang(Q, t[i], t[(i + 1) % 3], t[(i + 2) % 3]))); return (near(r[0], r[1]) && near(r[1], r[2]) && okA) ? r[0] : null; };
  const LIB = 'const d = ' + d + '; const ang = ' + ang + '; const simR = ' + simR + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  IK.lesson('souji-02', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第2時', title: '相似比を使って、辺の長さを求めよう',
    summary: '△ABC∽△DEF で、対応する辺の比が等しいことから比例式をつくり、辺 EF の長さを求める。比例式の性質（a：b＝c：d ならば ad＝bc）を使って、辺の長さ・縮尺・拡大の長さを求める。',
    head: '相似な図形　第2時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：△ABC∽△DEF（座標から）。AB＝4、BC＝6、DE＝10、相似比 4：10＝2：5、EF＝x → 4：10＝6：x を解くと x＝15（座標から出した EF と同じ）
      chk('第2時 今日の問い', `const P = ${J(W_ABC)}, Q = ${J(W_DEF)}; const r = simR(P, Q, 'ABC', 'DEF'); const x = 6 * 10 / 4; return r !== null && near(r, 2.5) && near(d(P, 'AB'), 4) && near(d(P, 'BC'), 6) && near(d(Q, 'DE'), 10) && near(d(Q, 'EF'), x) && near(x, 15) && near(d(P, 'AB') / d(Q, 'DE'), 2 / 5) && near(d(P, 'BC') / d(Q, 'EF'), 2 / 5);`),
      // 例題：△ABC∽△DEF（AB＝6、BC＝9、CA＝12、DE＝10、EF＝15、FD＝20）。相似比 6：10＝3：5。BC：EF＝x：15＝3：5 → x＝9、CA：FD＝y：20＝3：5 → y＝12
      chk('第2時 例題', `const P = ${J(E_ABC)}, Q = ${J(E_DEF)}; const r = simR(P, Q, 'ABC', 'DEF'); return r !== null && near(r, 5 / 3) && near(d(P, 'AB'), 6) && near(d(Q, 'DE'), 10) && near(d(Q, 'EF'), 15) && near(d(Q, 'FD'), 20) && near(d(P, 'BC'), 15 * 3 / 5) && near(d(P, 'BC'), 9) && near(d(P, 'CA'), 20 * 3 / 5) && near(d(P, 'CA'), 12) && near(6 / 10, 3 / 5);`),
      // （1）比例式：① 5：x＝10：12 → x＝6（5×12＝10×6）　② (x+1)：4＝9：6 → x＝5（(5+1)×6＝4×9）
      'near(5 * 12, 10 * 6) && near((5 + 1) * 6, 4 * 9) && near(5 / 6, 10 / 12) && near((5 + 1) / 4, 9 / 6)',
      // （2）図1：△ABC∽△DEF（AB＝6、BC＝7、CA＝5、DE＝9）。座標から EF＝10.5、FD＝7.5。比例式 6：9＝7：EF、6：9＝5：FD を解いた値とくらべる
      chk('第2時 図1', `const P = ${J(D_ABC)}, Q = ${J(D_DEF)}; const r = simR(P, Q, 'ABC', 'DEF'); return r !== null && near(r, 1.5) && near(d(P, 'AB'), 6) && near(d(P, 'BC'), 7) && near(d(P, 'CA'), 5) && near(d(Q, 'DE'), 9) && near(d(Q, 'EF'), 7 * 9 / 6) && near(d(Q, 'EF'), 10.5) && near(d(Q, 'FD'), 5 * 9 / 6) && near(d(Q, 'FD'), 7.5);`),
      // （3）かっこのある比例式：① (x−3)：4＝9：6 → x＝9　② (2x−1)：3＝15：9 → x＝3
      'near((9 - 3) / 4, 9 / 6) && near((2 * 3 - 1) / 3, 15 / 9) && near(6 * (9 - 3), 4 * 9) && near(9 * (2 * 3 - 1), 3 * 15)',
      // （4）図2：四角形 ABCD∽四角形 EFGH（相似比 5：3）。座標から AB＝10、GH＝9、EF＝6、CD＝15。10：EF＝5：3、CD：9＝5：3。4つの辺の比がすべて 5：3、4つの角も等しい
      chk('第2時 図2', `const P = ${J(Q_ABCD)}, Q = ${J(Q_EFGH)}; const sd = (X, n) => [...n].map((c, i) => d(X, c + n[(i + 1) % n.length])); const a = sd(P, 'ABCD'), b = sd(Q, 'EFGH'); const an = (X, n) => [...n].map((c, i) => ang(X, c, n[(i + n.length - 1) % n.length], n[(i + 1) % n.length])); const x = an(P, 'ABCD'), y = an(Q, 'EFGH'); return a.every((v, k) => near(v / b[k], 5 / 3)) && x.every((v, k) => near(v, y[k])) && near(a[0], 10) && near(b[2], 9) && near(b[0], 10 * 3 / 5) && near(b[0], 6) && near(a[2], 9 * 5 / 3) && near(a[2], 15);`),
      // （5）縮尺 1/40：模型 25cm → 実物 25×40＝1000cm＝10m　実物 6m＝600cm → 模型 600÷40＝15cm
      'near(25 * 40, 1000) && near(1000 / 100, 10) && near(6 * 100 / 40, 15) && near(15 * 40, 600)',
      // （6）縦 8、横 14 の写真を縦 12 に拡大：8：12＝14：x → x＝21（14×12÷8）。もとの縦横の比 8：14＝12：21
      'near(14 * 12 / 8, 21) && near(8 / 14, 12 / 21)',
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：相似比 1：1 のとき、辺の長さも角の大きさもすべて同じ（4・6・5 の三角形で、座標から）
      chk('第2時 （7）', `const P = ${J(tri3('ABC', 4, 6, 5))}; const Q = {}; Object.keys(P).forEach(k => { Q[{ A: 'D', B: 'E', C: 'F' }[k]] = P[k].slice(); }); const r = simR(P, Q, 'ABC', 'DEF'); return r !== null && near(r, 1) && near(d(Q, 'DE'), 4) && near(d(Q, 'EF'), 6) && near(ang(P, 'A', 'B', 'C'), ang(Q, 'D', 'E', 'F'));`),
      // （8）AB：DE＝2：5、AC＋DF＝35 → AC：DF＝2：5。AC＝x として、x：(35−x)＝2：5 を 0.01 きざみでしらべる → x＝10（DF＝25）だけ
      'Array.from({ length: 3499 }, (_, i) => (i + 1) / 100).filter(x => Math.abs(x / (35 - x) - 2 / 5) < 1e-9).join() === "10" && near(35 * 2 / 7, 10) && near(35 * 5 / 7, 25)',
      // 小テスト（1）比例式：ア x：4＝6：8 → 3　イ 3：x＝9：12 → 4　ウ 5：2＝x：8 → 20　エ 4：10＝6：x → 15
      'near(3 / 4, 6 / 8) && near(3 / 4, 9 / 12) && near(5 / 2, 20 / 8) && near(4 / 10, 6 / 15)',
      // 小テスト（2）AB＝6、DE＝8、BC＝9 → 6：8＝9：EF → EF＝12　（3）(x+3)：4＝9：6 → x＝3
      'near(6 / 8, 9 / 12) && near((3 + 3) / 4, 9 / 6)',
      // 小テスト（4）チャレンジ：x：(x＋4)＝3：5 を 0.01 きざみでしらべる → x＝6（DE＝10）だけ
      'Array.from({ length: 5000 }, (_, i) => (i + 1) / 100).filter(x => Math.abs(x / (x + 4) - 3 / 5) < 1e-9).join() === "6" && near(6 + 4, 10)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('相似比を使って、辺の長さを求めよう'),
      K('今日の問い', '△ABC∽△DEF で、辺 EF の長さは何 cm だろう。式をつくって、求めよう。', 1),
      F(5, figW),
      T('①', '自分の考え（3分）　式をつくって、求めよう。', 1),
      B(3, '（例）相似比は AB：DE＝4：10＝2：5\nBC：EF＝2：5 だから　6：x＝2：5\n2x＝30　　x＝15　　15cm'),
      T('②', 'ペアの考え（3分）　自分とちがう式の立て方を書こう。', 1),
      B(3, ''),
      G(1),
      WD('2つの比が等しいことを表した式を{{比例式}}という。\na：b＝c：d ならば　{{ad＝bc}}\n相似な図形では、対応する辺の長さの{{比}}は等しい。\nx：3＝8：6 のとき、6x＝{{24}}　より　x＝{{4}}', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '△ABC∽△DEF で、辺 BC、CA の長さを求めよう。表を完成させよう。', 1),
      F(4, figE),
      TB('', null, [
        ['(1) 相似比 AB：DE', ['6：10＝{{3：5}}']],
        ['(2) BC＝x cm のとき', ['x：{{15}}＝3：5　より　x＝{{9}}']],
        ['(3) CA＝y cm のとき', ['y：{{20}}＝3：5　より　y＝{{12}}']]
      ], { hw: 60 }),
      T('', '【比のくふう】比例式をつくるとき、気をつけることは何だろう。', 1),
      B(2, '対応する辺を見つけて、同じ順にならべる。\n（例）AB：DE＝BC：EF（△ABC の辺を左、△DEF の辺を右）')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 対応する辺の長さの比を{{相似比}}という。\n② 相似な図形では、対応する辺の比は、すべて{{等しい}}。\n③ a：b＝c：d ならば、{{ad＝bc}}　（比例式の性質）\n④ 相似比が 2：3 のとき、△ABC の辺 4cm に対応する △DEF の辺は{{6}}cm。', 4, { label: 'ことば' }),
      F(5, fig1, fig2),
      C2([
        T('（1）', '次の比例式で、x の値を求めよう。\n① 5：x＝10：12\n② (x+1)：4＝9：6', 3),
        B(2, '① 10x＝60　x＝6\n② 6(x+1)＝36　x＝5')
      ], [
        T('（2）', '図1で、△ABC∽△DEF のとき、辺 EF、FD の長さを求めよう。', 3),
        B(2, '6：9＝7：EF　EF＝10.5cm\n6：9＝5：FD　FD＝7.5cm')
      ], '1:1'),
      MA('【説明】比例式をつくるとき、どの辺と比べたか、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '比例式を使って、長さを求めよう。'),
      C2([
        T('（3）', '次の比例式で、x の値を求めよう。\n① (x−3)：4＝9：6\n② (2x−1)：3＝15：9', 3),
        B(3, '① 6(x−3)＝36　x＝9\n② 9(2x−1)＝45　x＝3')
      ], [
        T('（4）', '図2で、四角形 ABCD∽四角形 EFGH である。相似比は 5：3。辺 EF、CD の長さを求めよう。', 4),
        B(2, '10：EF＝5：3　EF＝6cm\nCD：9＝5：3　CD＝15cm')
      ], '1:1'),
      C2([
        T('（5）', '縮尺が [[1/40]] の模型がある。① 模型の高さが 25cm のとき、実物の高さは何 \\m か。② 実物の幅が 6\\m のとき、模型の幅は何 cm か。', 4),
        B(3, '① 25×40＝1000（cm）\n　 ＝10\\m\n② 600÷40＝15（cm）')
      ], [
        T('（6）', '縦 8cm、横 14cm の長方形の写真を、形を変えずに拡大して、縦を 12cm にした。横の長さを求めよう。', 3),
        B(3, '8：12＝14：x\n8x＝168\nx＝21　　21cm')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：相似比が 1：1 のときを、調べよう。'),
      T('（7）', '△ABC∽△DEF で、相似比が 1：2 のときと 1：1 のときを、表にまとめよう。1：1 のとき、2つの三角形は、どんな関係になるだろう。', 2),
      TB('△ABC → △DEF', ['相似比 1：2', '相似比 1：1'], [
        ['AB＝4cm のとき DE', ['', '']],
        ['BC＝6cm のとき EF', ['', '']],
        ['∠A＝50° のとき ∠D', ['', '']]
      ], { hw: 56 }),
      C2([
        T('', '1：1 のとき、2つの三角形は、どんな関係か', 2),
        B(9, '')
      ], [
        T('', 'そう考えたわけを、表を使って書こう', 2),
        B(9, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '△ABC∽△DEF で、AB：DE＝2：5 である。辺 AC と辺 DF の長さの和が 35cm のとき、AC、DF の長さを、それぞれ求めよう。', 4),
        B(7, 'AC：DF＝AB：DE＝2：5\nAC＝x cm とすると\nDF＝(35−x)cm\nx：(35−x)＝2：5\n5x＝2(35−x)　7x＝70　x＝10\nAC＝10cm、DF＝25cm')
      ], [
        MA('① AC：DF は、どんな比になるかな。\n② AC を x cm とすると、DF は何 cm と表せるかな。', 13, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次の比例式で、x の値を求めよう。（4点）\nア x：4＝6：8　　　イ 3：x＝9：12\nウ 5：2＝x：8　　　エ 4：10＝6：x', 3),
      B(2, 'ア x＝3　　イ x＝4　　ウ x＝20　　エ x＝15'),
      T('（2）', '△ABC∽△DEF で、AB＝6cm、DE＝8cm、BC＝9cm のとき、辺 EF の長さを求めよう。（3点）', 2),
      B(3, '6：8＝9：EF\n6EF＝72　　EF＝12（cm）'),
      T('（3）', '比例式 (x+3)：4＝9：6 で、x の値を求めよう。（3点）', 1),
      B(3, '6(x+3)＝36　　x+3＝6\nx＝3'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '△ABC∽△DEF で、相似比は 3：5 である。辺 AB の長さを x cm とすると、辺 DE の長さは (x+4)cm になった。x の値を求めよう。', 3),
      B(4, 'AB：DE＝3：5 だから　x：(x+4)＝3：5\n5x＝3(x+4)　　2x＝12　　x＝6')
    ]
  });
})();
