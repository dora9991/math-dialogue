/* 図形と証明（三角形と四角形） 第7時：三角形の証明を、教え合って書けるようになろう。
   元：授業ナビ標準版 sankaku-07（練。教え合い）。「進め方（A は1人で、B・C は選ぶ）」の考え方を、まちがい探しと証明の完成の2つにした。
   ・ワークシートは A4 1枚：今日の問い＝まちがった証明（結論 AD＝AE を、根拠に使っている）を読んで、まちがいを見つけ、直し方を考える（まちがいは1か所）。個人3分 → ペア3分 → ことば → 例題（直した証明の穴うめ）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（まちがい探し・証明の穴うめ）／裏＝ひろげる（考えよう・答えなし：別の合同を使った証明）・チャレンジ★★（証明。ヒントカードつき）。学び合い（MA）は説明。
   ・原案の A（二等辺三角形の中点から2辺へ垂線 DE＝DF）は演習プリント（3）（4）に、B（BD＝CE のとき AD＝AE）は今日の問いと例題に、C（∠B＝∠C のとき BH＝CH）は（6）に、応用（角の二等分線 AE＝AF）は（8）にした。
   ・証明は「△〜 と △〜 において」の形。答え（B）は「（仮定）…／（結論）…／（証明）…」。
   ・数値・図は新しく作り、座標から、等しい辺・角・合同・結論が成り立つことを checks で確かめた。（5）のまちがい（間にない角）は、反例（2つの三角形）で確かめた。
   検算：node tools/verify.cjs sankaku-07　／　見た目：node tools/check.cjs <出力先> sankaku-07 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify, R = Math.PI / 180;

  /* ---------------- 図の道具 ---------------- */
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const foot = (P, Q, S) => { const u = [S[0] - Q[0], S[1] - Q[1]], t = ((P[0] - Q[0]) * u[0] + (P[1] - Q[1]) * u[1]) / (u[0] * u[0] + u[1] * u[1]); return [Q[0] + t * u[0], Q[1] + t * u[1]]; };
  const unit = (p, q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / d, (q[1] - p[1]) / d]; };
  const bisDir = (V, P, Q) => { const a = unit(V, P), b = unit(V, Q), s = [a[0] + b[0], a[1] + b[1]], L = Math.hypot(...s); return [s[0] / L, s[1] / L]; };
  const meet = (P1, d1, P2, d2) => { const det = d1[0] * (-d2[1]) - d1[1] * (-d2[0]); const s = ((P2[0] - P1[0]) * (-d2[1]) - (P2[1] - P1[1]) * (-d2[0])) / det; return [P1[0] + s * d1[0], P1[1] + s * d1[1]]; };

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い・例題・（7）：AB＝AC の二等辺三角形。BC 上に BD＝CE となる点 D、E（B、D、E、C の順）
  const DE7 = { A: [0, 5], B: [-4, 0], C: [4, 0], D: [-1.6, 0], E: [1.6, 0] };
  const figDE = GEO({
    pts: DE7, poly: 'ABC', segs: ['AD', 'AE'], tick: [['A', 'B', 1], ['A', 'C', 1], ['B', 'D', 2], ['C', 'E', 2]],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 270], E: ['E', 270] }, pad: 6
  });
  // 演習プリント 図1：AB＝AC。D は BC の中点。D から AB、AC への垂線 DE、DF
  const MD = { A: [0, 5], B: [-4, 0], C: [4, 0], D: [0, 0] };
  MD.E = foot(MD.D, MD.A, MD.B); MD.F = foot(MD.D, MD.A, MD.C);
  const figMD = GEO({
    pts: MD, poly: 'ABC', segs: ['DE', 'DF'], dots: ['D'], tick: [['A', 'B', 1], ['A', 'C', 1], ['B', 'D', 2], ['D', 'C', 2]],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 270], E: ['E', 150], F: ['F', 30] },
    ang: [{ at: 'E', a: 'D', b: 'B', right: true, r: 2.6 }, { at: 'F', a: 'D', b: 'C', right: true, r: 2.6 }], pad: 6
  });
  // 演習プリント 図2：∠B＝∠C の △ABC。A から BC への垂線 AH
  const AH = { A: [0, 5], B: [-3.5, 0], C: [3.5, 0], H: [0, 0] };
  const figAH = GEO({
    pts: AH, poly: 'ABC', segs: ['AH'], dots: [],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], H: ['H', 270] },
    ang: [{ at: 'B', a: 'C', b: 'A', n: 1, r: 6 }, { at: 'C', a: 'A', b: 'B', n: 1, r: 6 }, { at: 'H', a: 'A', b: 'C', right: true, r: 2.6 }], pad: 6
  });
  // （8）：△ABC の ∠A の二等分線と辺 BC の交点 D。D から AB、AC への垂線 DE、DF
  const BS = { A: [0.5, 5], B: [-3, 0], C: [5, 0] };
  BS.D = meet(BS.A, bisDir(BS.A, BS.B, BS.C), BS.B, [1, 0]);
  BS.E = foot(BS.D, BS.A, BS.B); BS.F = foot(BS.D, BS.A, BS.C);
  const figBS = GEO({
    pts: BS, poly: 'ABC', segs: ['AD', 'DE', 'DF'], dots: [],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 270], E: ['E', 150], F: ['F', 30] },
    ang: [{ at: 'A', a: 'B', b: 'D', n: 1, r: 8 }, { at: 'A', a: 'D', b: 'C', n: 1, r: 8 }, { at: 'E', a: 'D', b: 'A', right: true, r: 2.6 }, { at: 'F', a: 'D', b: 'A', right: true, r: 2.6 }], pad: 6
  });
  const dFig1 = cap(figMD, '図1'), dFig2 = cap(figAH, '図2');

  /* ---------------- 検算の道具 ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), an=(V,P,Q)=>{const u=[P[0]-V[0],P[1]-V[1]],w=[Q[0]-V[0],Q[1]-V[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}, '
    + 'srt=a=>a.slice().sort((x,y)=>x-y), same=(a,b)=>a.every((x,i)=>near(x,b[i])), tri=(S,s)=>[S[s[0]],S[s[1]],S[s[2]]], sides=t=>srt([dd(t[0],t[1]),dd(t[1],t[2]),dd(t[2],t[0])]), angs=t=>srt([an(t[0],t[1],t[2]),an(t[1],t[2],t[0]),an(t[2],t[0],t[1])]), '
    + 'cong=(S,a,b)=>same(sides(tri(S,a)),sides(tri(S,b)))&&same(angs(tri(S,a)),angs(tri(S,b))), len=(S,s)=>dd(S[s[0]],S[s[1]]), deg=(S,s)=>an(S[s[1]],S[s[0]],S[s[2]]);';
  const chk = body => `(() => { ${LIB} ${body} })()`;

  IK.lesson('sankaku-07', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第7時', title: '三角形の証明を、教え合って書けるようになろう',
    summary: 'まちがった証明（結論を根拠に使っている）を見つけて直し、二等辺三角形の性質と直角三角形の合同条件を使った証明を、根拠をつけて完成させる。まちがい探しと証明の完成を、教え合いながら進める。',
    head: '図形と証明　第7時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い・例題：AB＝AC、BD＝CE（D、E は BC 上、B・D・E・C の順）。AD＝AE は成り立つ（結論）が、これを ③ の根拠に使うのはまちがい。正しくは ∠ABD＝∠ACE（底角）と、2組の辺とその間の角で △ABD≡△ACE
      chk(`const S=${J(DE7)}; return near(len(S,'AB'),len(S,'AC')) && near(len(S,'BD'),len(S,'CE')) && len(S,'BD')<len(S,'BE') && len(S,'BE')<len(S,'BC') && near(deg(S,'ABD'),deg(S,'ACE')) && near(deg(S,'ABD'),deg(S,'ABC')) && near(deg(S,'ACE'),deg(S,'ACB')) && cong(S,'ABD','ACE') && near(len(S,'AD'),len(S,'AE'));`),
      // 今日の問い：まちがった証明の ①、② は仮定のとおり（AB＝AC、BD＝CE）、③（AD＝AE）は結論と同じ。3組の辺（AB＝AC、BD＝CE、AD＝AE）がそろえば合同は正しいが、③ の根拠がない。座標でも、AD＝AE は結論として成り立つ
      chk(`const S=${J(DE7)}; return near(len(S,'AB'),len(S,'AC')) && near(len(S,'BD'),len(S,'CE')) && near(len(S,'AD'),len(S,'AE')) && cong(S,'ABD','ACE');`),
      // （3）（4）図1：AB＝AC、D は BC の中点、DE⊥AB、DF⊥AC。△BDE≡△CDF（∠BED＝∠CFD＝90°、斜辺 BD＝CD、∠EBD＝∠FCD＝底角）。DE＝DF、∠BDE＝∠CDF
      chk(`const S=${J(MD)}; return near(len(S,'AB'),len(S,'AC')) && near(len(S,'BD'),len(S,'DC')) && near(deg(S,'BED'),90) && near(deg(S,'CFD'),90) && near(deg(S,'EBD'),deg(S,'FCD')) && near(deg(S,'EBD'),deg(S,'ABC')) && len(S,'BD')>len(S,'DE') && len(S,'DC')>len(S,'DF') && cong(S,'BDE','CDF') && near(len(S,'DE'),len(S,'DF')) && near(deg(S,'BDE'),deg(S,'CDF')) && near(len(S,'BE'),len(S,'CF'));`),
      // （5）まちがい：AB＝DE、BC＝EF、∠A＝∠D は「間にない角」。AB＝5、∠A＝30°、BC＝3 の三角形は 2通りある（AC＝5.99 と 2.67）。合同とはいえない。∠B＝∠E なら 2組の辺とその間の角（AB、BC の間の角 ∠B）
      '(() => { const AB=5, a=30*Math.PI/180, BC=3, q=2*AB*Math.cos(a), disc=q*q-4*(AB*AB-BC*BC), x1=(q+Math.sqrt(disc))/2, x2=(q-Math.sqrt(disc))/2; const chk2=x=>near(AB*AB+x*x-2*AB*x*Math.cos(a),BC*BC); return disc>0 && x1>0 && x2>0 && chk2(x1) && chk2(x2) && Math.abs(x1-x2)>1 && Math.abs(x1-5.9884)<1e-3 && Math.abs(x2-2.6718)<1e-3; })()',
      // （6）図2：∠B＝∠C（A(0,5)・B(−3.5,0)・C(3.5,0)）の △ABC。AH⊥BC。∠B＝∠C → AB＝AC。△ABH≡△ACH（∠AHB＝∠AHC＝90°、斜辺 AB＝AC、AH 共通）→ BH＝CH
      chk(`const S=${J(AH)}; return near(deg(S,'ABC'),deg(S,'ACB')) && near(len(S,'AB'),len(S,'AC')) && near(deg(S,'AHB'),90) && near(deg(S,'AHC'),90) && len(S,'AB')>len(S,'AH') && cong(S,'ABH','ACH') && near(len(S,'BH'),len(S,'CH'));`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：B・D・E・C の順で BD＝CE → BE＝BD＋DE＝CE＋ED＝CD。△ABE≡△ACD（AB＝AC、∠B＝∠C、BE＝CD）→ AE＝AD
      chk(`const S=${J(DE7)}; return near(len(S,'BE'),len(S,'BD')+len(S,'DE')) && near(len(S,'CD'),len(S,'CE')+len(S,'ED')) && near(len(S,'BE'),len(S,'CD')) && near(len(S,'AB'),len(S,'AC')) && near(deg(S,'ABE'),deg(S,'ACD')) && cong(S,'ABE','ACD') && near(len(S,'AE'),len(S,'AD'));`),
      // （8）△ABC（A(0.5,5)・B(−3,0)・C(5,0)）。AD は ∠A の二等分線。DE⊥AB、DF⊥AC。△AED≡△AFD（∠AED＝∠AFD＝90°、∠EAD＝∠FAD、AD 共通）→ AE＝AF（DE＝DF も）
      chk(`const S=${J(BS)}; return near(deg(S,'BAD'),deg(S,'DAC')) && near(deg(S,'AED'),90) && near(deg(S,'AFD'),90) && near(deg(S,'EAD'),deg(S,'BAD')) && near(deg(S,'FAD'),deg(S,'DAC')) && len(S,'AD')>len(S,'DE') && len(S,'AD')>len(S,'DF') && cong(S,'AED','AFD') && near(len(S,'AE'),len(S,'AF')) && near(len(S,'DE'),len(S,'DF')) && len(S,'AB')!==len(S,'AC') && Math.abs(len(S,'AB')-len(S,'AC'))>0.3;`),
      // 小テスト（3）AB＝AC、M は BC の中点：△ABM≡△ACM（3組の辺：AB＝AC、BM＝CM、AM 共通）→ ∠BAM＝∠CAM
      chk(`const S={A:[0,6],B:[-3,0],C:[3,0],M:[0,0]}; return near(len(S,'AB'),len(S,'AC')) && near(len(S,'BM'),len(S,'CM')) && cong(S,'ABM','ACM') && near(deg(S,'BAM'),deg(S,'MAC'));`),
      // 小テスト（4）チャレンジ：正三角形 ABC（1辺 9）。AD＝BE＝CF＝3。△ADF≡△BED≡△CFE（AF＝BD＝CE＝6、間の角 60°）→ DF＝ED＝FE。△DEF は正三角形
      chk(`const A=[0,0], B=[9,0], C=[4.5,9*Math.sqrt(3)/2]; const on=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t]; const D=on(A,B,3/9), E=on(B,C,3/9), F=on(C,A,3/9); const S={A,B,C,D,E,F}; return near(len(S,'AB'),len(S,'BC')) && near(len(S,'BC'),len(S,'CA')) && near(len(S,'AD'),len(S,'BE')) && near(len(S,'BE'),len(S,'CF')) && near(len(S,'AF'),len(S,'BD')) && near(len(S,'BD'),len(S,'CE')) && near(len(S,'AF'),6) && near(deg(S,'DAF'),60) && near(deg(S,'EBD'),60) && near(deg(S,'FCE'),60) && cong(S,'ADF','BED') && cong(S,'BED','CFE') && near(len(S,'DE'),len(S,'EF')) && near(len(S,'EF'),len(S,'FD')) && near(deg(S,'EDF'),60);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('三角形の証明を、教え合って、たしかに書こう'),
      K('今日の問い', '△ABC は AB＝AC の二等辺三角形で、辺 BC 上に BD＝CE となる点 D、E がある。AD＝AE の証明が、下のように書かれている。まちがいを見つけよう。', 3),
      F(4, figDE),
      T('証明', '△ABD と △ACE において\n仮定より　AB＝AC …①　　BD＝CE …②\nAD＝AE …③\n①、②、③ より、3組の辺が、それぞれ等しいから　△ABD≡△ACE\nしたがって　AD＝AE', 5),
      T('①', '自分の考え（3分）　まちがいと、直し方を書こう。', 1),
      B(4, '（例）③ の AD＝AE は、これから証明すること（結論）。\n　　　結論を、根拠に使ってはいけない。\n　　直し方　③ を ∠ABD＝∠ACE（二等辺三角形の底角）にして、\n　　　2組の辺とその間の角が等しいから、合同とする。'),
      T('②', 'ペアの考え（3分）　自分とちがう考えを書こう。', 1),
      B(2, ''),
      WD('証明の書き方\n① 結論から、どの三角形の{{合同}}を示すかを決める。\n② 等しいものを{{3つ}}、{{根拠}}をつけて書く。\n③ 合同がいえたら、{{対応}}する辺や角は等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      K('例題', 'まちがいを直した、正しい証明を完成させよう。\n△ABD と △ACE において\n仮定より　AB＝{{AC}} …①　　BD＝{{CE}} …②\n二等辺三角形の{{底角}}は等しいから　∠ABD＝∠{{ACE}} …③\n①、②、③ より、{{2組の辺とその間の角}}が、それぞれ等しいから　△ABD≡△ACE\n合同な図形の、対応する辺は等しいから　AD＝AE', 8)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 二等辺三角形の2つの{{底角}}は等しい。\n② 2つの角が等しい三角形は、{{二等辺三角形}}である。\n③ これから示す{{結論}}を、根拠にしてはいけない。', 3, { label: 'ことば' }),
      F(4, dFig1, dFig2),
      C2([
        T('（1）', 'AB＝AC ならば ∠B＝∠C である。この根拠を答えよう。', 2),
        B(1, '二等辺三角形の底角は等しい。')
      ], [
        T('（2）', '∠B＝∠C ならば AB＝AC である。この根拠を答えよう。', 2),
        B(2, '2つの角が等しい三角形は、二等辺三角形である。')
      ], '1:1'),
      MA('【説明】今日の「まちがった証明」のどこがまちがいか、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', 'まちがいを見つけたり、証明を完成させたりしよう。'),
      C2([
        T('（3）', '図1で、DE＝DF を示す。合同を示す2つの三角形と、その合同条件を答えよう。', 3),
        B(2, '△BDE と △CDF\n斜辺と1つの鋭角')
      ], [
        T('（4）', '図1で、△BDE≡△CDF のとき、∠BDE と等しい角と、その根拠を答えよう。', 3),
        B(2, '∠CDF\n合同な図形の、対応する角は等しい。')
      ], '1:1'),
      T('（5）', '「△ABC と △DEF で、AB＝DE、BC＝EF、∠A＝∠D だから、2組の辺とその間の角が等しく、合同」と書いた。まちがいを直そう。', 2),
      B(1, '∠A は AB、BC の間の角ではない。∠B＝∠E がいえれば、よい。'),
      T('（6）', '図2で、∠B＝∠C、AH⊥BC のとき、BH＝CH を証明する。□ をうめよう。\n△ABH と △ACH において　∠AHB＝∠AHC＝{{90°}} …①\n∠B＝∠C だから、2つの角が等しい三角形は二等辺三角形で　AB＝{{AC}} …②\nAH は{{共通}} …③\n①、②、③ より、直角三角形の{{斜辺と他の1辺}}が、それぞれ等しいから　△ABH≡△ACH\nしたがって　BH＝{{CH}}', 8),
      B(1, '90°　AC　共通　斜辺と他の1辺　CH'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：同じことを、ほかの合同で証明しよう。'),
      T('（7）', '今日の証明は、△ABD≡△ACE を使った。△ABE と △ACD の合同を使っても、AD＝AE を証明できるだろうか。使う合同条件を考えて、証明を書こう。', 3),
      F(4, figDE),
      C2([
        T('', '合同を使った証明を書こう', 1),
        B(7, '')
      ], [
        T('', '気づいたこと（今日の証明とくらべて）', 2),
        B(6, '')
      ], '1:1'),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図の △ABC で、∠A の二等分線と辺 BC との交点を D とする。D から辺 AB、AC に垂線 DE、DF をひく。AE＝AF を証明しよう。', 5)
      ], [
        F(5, figBS)
      ], '1:1'),
      B(9, '（仮定）∠BAD＝∠CAD、DE⊥AB、DF⊥AC\n（結論）AE＝AF\n（証明）△AED と △AFD において\n仮定より　∠AED＝∠AFD＝90° …①\nAD は ∠A の二等分線だから　∠EAD＝∠FAD …②\nAD は共通 …③\n①、②、③ より、直角三角形の斜辺と1つの鋭角が、\nそれぞれ等しいから　△AED≡△AFD\nしたがって　AE＝AF'),
      MA('① AE、AF をふくむ直角三角形は、どれとどれかな。\n② AD は、その2つの三角形の、どんな辺かな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '△ABC で、AB＝AC ならば ∠B＝∠C、∠B＝∠C ならば AB＝AC である。それぞれの根拠を答えよう。（3点）', 2),
      B(2, '二等辺三角形の底角は等しい。\n2つの角が等しい三角形は、二等辺三角形である。'),
      T('（2）', 'AB＝AC の △ABC で、BC 上に BD＝CE となる点 D、E をとり、AD＝AE を証明する。「AD＝AE …③」を、証明の根拠として書いてよいか。わけも答えよう。（3点）', 3),
      B(2, 'よくない。AD＝AE は、これから証明する結論だから。'),
      T('（3）', 'AB＝AC の △ABC で、辺 BC の中点を M とする。∠BAM＝∠CAM であることを証明する。□ をうめよう。（4点）\n△ABM と △ACM において\n仮定より　AB＝{{AC}} …①\nM は BC の中点だから　BM＝{{CM}} …②\nAM は{{共通}} …③\n①、②、③ より、{{3組の辺}}が、それぞれ等しいから　△ABM≡△ACM\nしたがって　∠BAM＝∠CAM', 8),
      B(1, 'AC　CM　共通　3組の辺'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '正三角形 ABC の辺 AB、BC、CA 上に、AD＝BE＝CF となる点 D、E、F をとる。△DEF は、どんな三角形か。わけも書こう。', 3),
      B(5, '正三角形\n△ADF、△BED、△CFE で、AD＝BE＝CF、AF＝BD＝CE（AB＝BC＝CA より）、\n間の角は、どれも 60°。2組の辺とその間の角が等しいから合同。\nよって DF＝ED＝FE')
    ]
  });
})();
