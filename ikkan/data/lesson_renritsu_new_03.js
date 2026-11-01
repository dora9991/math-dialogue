/* 連立方程式（新しい形） 第3時：式を何倍かして係数をそろえ、加減法で連立方程式を解こう。 元：data/lesson_renritsu_03.js（前の形）を、次のように組みかえた。
   ・ワークシートは A4 1枚：問いは1つ（⟦2x+3y＝12 ; x+2y＝7⟧ は、①+②・①−② をしても文字が消えない。どうすれば消せるか）。個人3分 → ペア3分 → ことば → 例題（4x+3y＝−1、3x−2y＝12。y を消去。空欄あり。確かめつき）。
     元の「学習課題」を今日の問い、「例題」はそのまま、「考えよう」（どちらの文字を消すほうが楽か）は演習プリント（7）へ（答えなし）。元の「発展」は使わない。
   ・演習プリントは表裏：表＝確かめる 2問（一方を何倍か・両方を何倍か）・使ってみる 4問／裏＝ひろげる（考えよう：例題を x を消去する方法で解いてくらべる。答えなし）・チャレンジ★★（解から a、b を求める。ヒントカードつき）。
   ・数値：元は解が整数だけだったので、分数の解（（3）x＝[[5/2]]、小テスト（2）x＝[[1/2]]）と、負の解（（4）x＝−2、（6）y＝−2、チャレンジ y＝−3）をまぜた。
     （1）は元の基礎（1）①、（2）（3）（4）は新しい数、（5）おにぎりは元の標準（3）、（6）は元の入試（6）②。小テスト（1）（3）・チャレンジは元のまま、（2）は分数の解の新しい数。
     チャレンジ（8）は元の入試（7）の型（ax+by、bx−ay）。ただし第1時（8）と同じ x＝2、y＝−1 を避けて、x＝1、y＝−2 の新しい数（a＝3、b＝2）にした。
     元の応用（4）まちがいさがし・（5）2つの消し方は、使わない（（5）の「x を消す・y を消す」は、考えよう（7）とかさなるため）。
   ・どの連立方程式も、画面に出す式の文字列から解き直し（クラメルの公式）、解をもとの2つの式に代入して、両方が成り立つことを checks で確かめた。何倍した式・たしひきした式・代入した式も、もとの式から計算し直した。
     かける数は、消す文字の係数の最小公倍数になっているかも確かめた。
   ・元の checks の道具（EV・cf・hold・sol2・okSys・lcf・eqv・lcm・scan・arith）は、定義ごと移した。
   検算：node tools/verify.cjs renritsu_new-03　／　見た目：node tools/check.cjs <出力先> renritsu_new-03 */
(function () {
  const { M, K, B, G, C2, T, HD, BR, WD, MA, TB } = IK.b;
  const J = JSON.stringify;
  const S2 = (a, b) => '⟦' + a + ' ; ' + b + '⟧';   // 連立方程式（左に { がつく。式1行が罫の1行ぶん）
  const mn = n => String(n).replace('-', '−');        // 負の数の符号は「−」
  // fr：整数はそのまま、分数は [[p/q]]（負は先に −）で書く
  const fr = n => { if (Number.isInteger(n)) return mn(n); for (let d = 2; d <= 12; d++) { const p = Math.round(n * d); if (Math.abs(n * d - p) < 1e-9) return (p < 0 ? '−' : '') + '[[' + Math.abs(p) + '/' + d + ']]'; } return String(n); };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     EV：画面に出す式の書き方（×・÷・−・[[A/B]]）のまま、x、y に数を入れて計算する　cf：「ax+by＝c」の式から [a, b, c] を取り出す
     hold：式が、x、y の値で成り立つか　sol2：2つの式から、解をクラメルの公式で求める　okSys：2つの式の解が (x, y) か（解を、もとの2つの式に代入して両方成り立つことも確かめる）
     lcf：p×（式1）+ q×（式2）の [a, b, c]　eqv：式が [a, b, c] と同じか　lcm：最小公倍数
     subOK：代入した式 sub が、もとの式 eq の、文字 v に値 val を入れた式と同じか
     scan：答えの文の中の「…＝…」を、すべて取り出して、解（x, y）で成り立つか調べる（日本語やかっこの外の文字は、読みとばす）
     arith：答えの文の中の、文字のない「…＝…」（たとえば 4×2+3×(−3)＝−1）が、計算として正しいか */
  const EV = (s, v) => {
    let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))');
    t = t.replace(/([a-z])\^(\d)/g, '($1**$2)').replace(/([0-9a-z)])(?=[a-z(])/g, '$1*');
    const ks = [...new Set(t.match(/[a-z]/g) || [])];
    return new Function(...ks, 'return ' + t)(...ks.map(k => (v && k in v ? v[k] : 1)));
  };
  const cf = s => { const [l, r] = String(s).split('＝'); const f = (x, y) => EV(l, { x, y }) - EV(r, { x, y }); const c0 = f(0, 0); return [f(1, 0) - c0, f(0, 1) - c0, -c0]; };
  const hold = (s, x, y) => { const p = String(s).split('＝').map(u => EV(u, { x, y })); return p.length > 1 && p.every(v => near(v, p[0])); };
  const sol2 = (A, B) => { const [a1, b1, c1] = cf(A), [a2, b2, c2] = cf(B), d = a1 * b2 - a2 * b1; return Math.abs(d) < 1e-12 ? null : [(c1 * b2 - c2 * b1) / d, (a1 * c2 - a2 * c1) / d]; };
  const okSys = (A, B, x, y) => { const s = sol2(A, B); return !!s && near(s[0], x) && near(s[1], y) && hold(A, x, y) && hold(B, x, y); };
  const lcf = (p, A, q, B) => { const a = cf(A), b = cf(B); return [0, 1, 2].map(i => p * a[i] + q * b[i]); };
  const eqv = (s, v) => { const c = cf(s); return v.every((t, i) => near(c[i], t)); };
  const lcm = (a, b) => { a = Math.abs(a); b = Math.abs(b); let g = a, h = b; while (h) [g, h] = [h, g % h]; return a * b / g; };
  const subOK = (sub, eq, v, val) => { const [a, b, c] = cf(eq); return eqv(sub, v === 'x' ? [0, b, c - a * val] : [a, 0, c - b * val]); };
  const WIPE = /[^0-9a-z+\-−×÷＝().\[\]\/^]+/g;
  const scan = (t, x, y) => String(t).replace(/…[①-⑥]/g, ' ').replace(WIPE, ' ').split(' ').filter(u => u.includes('＝')).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || hold(p.join('＝'), x, y); });
  const arith = t => String(t).replace(/…[①-⑥]/g, ' ').replace(WIPE, ' ').split(' ').filter(u => u.includes('＝') && !/[a-z]/.test(u)).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || p.map(s => EV(s, {})).every(v => near(v, EV(p[0], {}))); });
  const LIB = 'const EV = ' + EV + '; const cf = ' + cf + '; const hold = ' + hold + '; const sol2 = ' + sol2 + '; const okSys = ' + okSys + '; const lcf = ' + lcf + '; const eqv = ' + eqv + '; const lcm = ' + lcm + '; const subOK = ' + subOK + '; const WIPE = ' + WIPE + '; const scan = ' + scan + '; const arith = ' + arith + ';'
    // okR：解が正しい／何倍した式（③・④）が、もとの式から計算した式と同じで、解で成り立つ／たしひきした式が、解で成り立ち、文字が1つだけ消えている／
    //      消す文字の係数の絶対値が、最小公倍数にそろっている／代入した式が、もとの式に値を入れた式／途中の式が解で成り立つ
    + ' const SG = { "+": [1, 1], "−": [1, -1], "r": [-1, 1] }; const okR = r => { const p = SG[r.sg], k = cf(r.key), Pc = cf(r.P), Qc = cf(r.Q), e = near(k[0], 0) ? 0 : 1, f = e === 0 ? "y" : "x";'
    + ' return okSys(r.A, r.B, r.x, r.y) && (!r.C || (eqv(r.C, lcf(r.kA, r.A, 0, r.B)) && hold(r.C, r.x, r.y))) && (!r.D || (eqv(r.D, lcf(0, r.A, r.kB, r.B)) && hold(r.D, r.x, r.y)))'
    + ' && eqv(r.key, lcf(p[0], r.P, p[1], r.Q)) && hold(r.key, r.x, r.y) && (near(k[0], 0) !== near(k[1], 0)) && near(Math.abs(Pc[e]), Math.abs(Qc[e])) && near(Math.abs(Pc[e]), lcm(cf(r.A)[e], cf(r.B)[e]))'
    + ' && subOK(r.sub, r.on === "①" ? r.A : r.B, f, f === "x" ? r.x : r.y) && hold(r.sub, r.x, r.y) && (!r.mid || hold(r.mid, r.x, r.y)); };';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  /* ---------------- 解き方をつくる ----------------
     R3(式1, 式2, ①を何倍か, ②を何倍か, 記号, 代入する式, 代入した式, 途中の式, x, y)：記号 '+'＝（式1側）+（式2側）、'−'＝（式1側）−（式2側）、'r'＝（式2側）−（式1側）
     ①×2 などの式と、たしひきした式は、式1・式2から計算してつくる。sol3：板書の行（full＝全幅。1行目に「y を消去」をつける） */
  const SGN = { '+': [1, 1], '−': [1, -1], 'r': [-1, 1] };
  const fmt = (a, b, c) => { let s = ''; [[a, 'x'], [b, 'y']].forEach(([k, v]) => { if (!k) return; s += (k < 0 ? '−' : (s ? '+' : '')) + (Math.abs(k) === 1 ? '' : String(Math.abs(k))) + v; }); return s + '＝' + mn(c); };
  const R3 = (A, B, kA, kB, sg, on, sub, mid, x, y) => {
    const C = kA !== 1 ? fmt(...lcf(kA, A, 0, B)) : null, D = kB !== 1 ? fmt(...lcf(0, A, kB, B)) : null;
    const nD = C ? '④' : '③', P = C || A, Q = D || B, nP = C ? '③' : '①', nQ = D ? nD : '②', [p, q] = SGN[sg];
    return { A, B, kA, kB, C, D, nD, P, Q, nP, nQ, sg, on, sub, mid, x, y, key: fmt(...lcf(p, P, q, Q)), label: sg === 'r' ? nQ + '−' + nP : nP + (sg === '+' ? '+' : '−') + nQ };
  };
  const sol3 = (r, full) => {
    const left = r.key.includes('x'), v1 = left ? 'x＝' + fr(r.x) : 'y＝' + fr(r.y), v2 = left ? 'y＝' + fr(r.y) : 'x＝' + fr(r.x), fin = '→ x＝' + fr(r.x) + '、y＝' + fr(r.y);
    const sc = [];
    if (r.C) sc.push('① × ' + r.kA + '　' + r.C + ' …③');
    if (r.D) sc.push('② × ' + r.kB + '　' + r.D + ' …' + r.nD);
    if (full) sc[0] = (left ? 'y' : 'x') + ' を消去　' + sc[0];
    const l = sc.concat([r.label + '　' + r.key + (r.key === v1 ? '' : '　' + v1)]);
    if (full) { if (r.mid) { l.push(r.on + ' に代入　' + r.sub + '　' + r.mid + '　' + v2); l.push(fin); } else l.push(r.on + ' に代入　' + r.sub + '　' + v2 + '　' + fin); }
    else { l.push(r.on + ' に代入　' + r.sub); if (r.mid) { l.push(r.mid + '　' + v2); l.push(fin); } else l.push(v2 + '　' + fin); }
    return l;
  };
  const solT3 = (r, full) => sol3(r, full).join('\n');
  const SY = (...e) => '⟦' + e.join(' ; ') + '⟧';
  const SN = (a, b) => S2(a + ' …①', b + ' …②');                               // 式の番号つきの連立方程式
  const blank = n => Array.from({ length: n }, () => '');

  /* ---------------- 問題のデータ（画面の式・答えの文は、ここから作る） ---------------- */
  const L1 = ['2x+3y＝12', 'x+2y＝7'];                    // 今日の問い：x＝3、y＝2（②×2 → ③−①）
  const EX = R3('4x+3y＝−1', '3x−2y＝12', 2, 3, '+', '①', '8+3y＝−1', '3y＝−9', 2, -3);   // 例題：y を消去。①×2、②×3、③+④
  const TH = ['12x+9y＝−3', '12x−8y＝48'];                // 考えよう：例題を x を消去（①×3・②×4）。③−④ で 17y＝−51
  const TH3 = ['3x+2y＝7', '6x−5y＝23'];                  // 考えよう：x＝3、y＝−1（①×2 だけで、x が消える）
  // 確かめる（1）一方を何倍か・（2）両方を何倍か／使ってみる（3）（4）（6）
  const D1 = R3('x+y＝6', '3x+5y＝22', 3, 1, 'r', '①', 'x+2＝6', null, 4, 2);
  const D2 = R3('2x+3y＝13', '3x+2y＝12', 2, 3, 'r', '①', '4+3y＝13', null, 2, 3);
  const D3 = R3('2x+3y＝8', '4x−5y＝5', 2, 1, '−', '①', '2x+3＝8', '2x＝5', 2.5, 1);          // 分数の解（x＝5/2）
  const D4 = R3('3x+2y＝2', '5x−3y＝−22', 3, 2, '+', '①', '−6+2y＝2', null, -2, 4);           // 負の解
  const D6 = R3('7x+4y＝−1', '5x+6y＝−7', 3, 2, '−', '①', '7+4y＝−1', null, 1, -2);           // 最小公倍数 12
  const D5 = R3('4x+3y＝850', '3x+2y＝610', 2, 3, 'r', '②', '390+2y＝610', null, 130, 110);    // （5）おにぎり x円＝130、お茶 y円＝110
  const D5L = sol3(D5).slice(0, 3).concat(['② に代入　y＝110', 'おにぎり130円　お茶110円']);
  // チャレンジ（8）：x＝1、y＝−2 が ax+by＝−1、bx−ay＝8 の解 → a−2b＝−1、2a+b＝8 → a＝3、b＝2
  const D8 = ['ax+by＝−1', 'bx−ay＝8'];
  const D8L = ['x＝1、y＝−2 を代入して', 'a−2b＝−1 …①', '2a+b＝8 …②', '② × 2　4a+2b＝16 …③', '①+③　5a＝15　a＝3', '② に代入　6+b＝8', 'b＝2　→ a＝3、b＝2'];
  // 小テスト
  const Q1 = R3('x+y＝7', '4x+3y＝24', 3, 1, 'r', '①', '3+y＝7', null, 3, 4);
  const Q2 = R3('2x+y＝3', '4x−3y＝−4', 2, 1, '−', '①', '2x+2＝3', '2x＝1', 0.5, 2);          // 分数の解（x＝1/2）
  const Q3 = R3('3x+4y＝2', '5x−6y＝16', 3, 2, '+', '①', '6+4y＝2', null, 2, -1);
  const QC = R3('5x+7y＝−1', '3x+4y＝0', 3, 5, '−', '②', '3x−12＝0', null, 4, -3);            // チャレンジ：x を消去（①×3・②×5）。y＝−3、x＝4
  const ALL = [EX, D1, D2, D3, D4, D5, D6, Q1, Q2, Q3, QC];

  // 手で書いた答え（画面にも checks にも、同じ文字列を使う）
  const T_L1 = '（例）② の両辺を 2倍して、x の係数を ① とそろえる。\n② × 2　2x+4y＝14 …③\n③−①　y＝2\n② に代入　x+4＝7　x＝3　→ x＝3、y＝2';
  const T_EX = 'y を消去する。y の係数 3 と −2 の最小公倍数 6 に、そろえる。\n① × 2　8x+6y＝−2 …③\n② × 3　9x−6y＝36 …④\n③+④　17x＝34　x＝2\n① に代入　8+3y＝−1　3y＝−9　y＝−3　→ x＝2、y＝−3';
  const T_EXC = '① 左辺＝4×2+3×(−3)＝−1　右辺＝−1　○\n② 左辺＝3×2−2×(−3)＝12　右辺＝12　○';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };

  const DEF = {
    unit: 'renritsu_new', unitName: '連立方程式（新しい形）', form: 'new', no: '第3時', title: '式を何倍かして係数をそろえ、加減法で連立方程式を解こう',
    summary: 'そのままではたしてもひいても文字が消えない連立方程式を、式の両辺を何倍かして係数をそろえ、加減法で解く。考えようは、どちらの文字を消すほうが楽か、式のどこを見て決めるか。',
    head: '連立方程式　第3時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：①+② 3x+5y＝19、①−② x+y＝5（文字は消えない）。②×2 → 2x+4y＝14（③）、③−① y＝2。x＝3、y＝2（全部の組を調べて出し直す）
      chk('第3時 今日の問い', `const A = ${J(L1[0])}, B = ${J(L1[1])}, C = '2x+4y＝14'; const s = lcf(1, A, 1, B), d = lcf(1, A, -1, B); let n = 0, w = ''; for (let x = 0; x <= 12; x++) for (let y = 0; y <= 12; y++) if (2 * x + 3 * y === 12 && x + 2 * y === 7) { n++; w = x + ',' + y; }`
        + ` return n === 1 && w === '3,2' && okSys(A, B, 3, 2) && eqv('3x+5y＝19', s) && eqv('x+y＝5', d) && eqv(C, lcf(0, A, 2, B)) && eqv('y＝2', lcf(1, C, -1, A)) && !(near(s[0], 0) || near(s[1], 0)) && !(near(d[0], 0) || near(d[1], 0)) && scan(${J(T_L1)}, 3, 2);`),
      // 例題：y を消去。係数 3 と −2 の最小公倍数 6。①×2 8x+6y＝−2、②×3 9x−6y＝36、③+④ 17x＝34、x＝2、y＝−3。確かめ ① 4×2+3×(−3)＝−1 ② 3×2−2×(−3)＝12
      chk('第3時 例題', `const r = ${J(EX)}; return okR(r) && lcm(3, 2) === 6 && r.kA === 2 && r.kB === 3 && r.key === '17x＝34' && hold('4×2+3×(−3)＝−1', 2, -3) && hold('3×2−2×(−3)＝12', 2, -3) && scan(${J(T_EX)}, 2, -3) && scan(${J(T_EXC)}, 2, -3);`),
      // 考えよう（7）（答えは載せない。ここで確かめるだけ）：例題を x を消去：①×3 12x+9y＝−3、②×4 12x−8y＝48、③−④ 17y＝−51、y＝−3、x＝2（解は同じ）。かける数は 3・4（y を消すと 2・3）。最小公倍数は x が 12、y が 6
      //   ほかの連立方程式 3x+2y＝7、6x−5y＝23：x＝3、y＝−1。①×2 だけで x が消える（x の最小公倍数 6、y の最小公倍数 10）
      chk('第3時 考えよう', `const A = ${J(EX.A)}, B = ${J(EX.B)}, C = ${J(TH[0])}, D = ${J(TH[1])}; return okSys(A, B, 2, -3) && eqv(C, lcf(3, A, 0, B)) && eqv(D, lcf(0, A, 4, B)) && eqv('17y＝−51', lcf(1, C, -1, D)) && near(-51 / 17, -3) && hold('4x−9＝−1', 2, -3)`
        + ` && lcm(4, 3) === 12 && lcm(3, 2) === 6 && lcm(4, 3) > lcm(3, 2)`
        + ` && (() => { const P = ${J(TH3[0])}, Q = ${J(TH3[1])}, E = '6x+4y＝14'; return okSys(P, Q, 3, -1) && eqv(E, lcf(2, P, 0, Q)) && eqv('−9y＝9', lcf(-1, E, 1, Q)) && hold('3x−2＝7', 3, -1) && lcm(3, 6) === 6 && lcm(2, 5) === 10 && lcm(3, 6) < lcm(2, 5); })();`),
      // 確かめる（1）（2）、使ってみる（3）（4）（6）：解（もとの2つの式に代入して成り立つ）・何倍した式・たしひきした式・代入した式・途中の式・答えの文
      chk('第3時 （1）（2）', `const D = ${J([D1, D2])}, L = ${J([sol3(D1), sol3(D2)])}; return D.every((r, i) => okR(r) && L[i].every(t => scan(t, r.x, r.y))) && D[0].kA !== 1 && D[0].kB === 1 && D[1].kA !== 1 && D[1].kB !== 1;`),
      chk('第3時 （3）（4）（6）', `const D = ${J([D3, D4, D6])}, L = ${J([sol3(D3), sol3(D4), sol3(D6)])}; return D.every((r, i) => okR(r) && L[i].every(t => scan(t, r.x, r.y))) && near(D[0].x, 5 / 2) && near(D[1].x, -2) && near(D[2].y, -2) && lcm(4, 6) === 12;`),
      // （5）おにぎり：4x+3y＝850、3x+2y＝610。①×2 8x+6y＝1700、②×3 9x+6y＝1830、④−③ x＝130、y＝110。おにぎり 130円、お茶 110円（正の数）
      chk('第3時 （5）', `const r = ${J(D5)}, L = ${J(D5L)}; return okR(r) && r.key === 'x＝130' && near(4 * 130 + 3 * 110, 850) && near(3 * 130 + 2 * 110, 610) && 130 > 0 && 110 > 0 && L.every(t => scan(t, 130, 110));`),
      // （8）x＝1、y＝−2 が ax+by＝−1、bx−ay＝8 の解 → a−2b＝−1、2a+b＝8。②×2 4a+2b＝16、①+③ 5a＝15、a＝3、b＝2（a、b を x、y とみて解く。a、b を入れて、もとの式が成り立つ）
      chk('第3時 （8）', `const x0 = 1, y0 = -2, c1 = -1, c2 = 8; const E1 = 'x−2y＝−1', E2 = '2x+y＝8'; const L = ${J(D8L)};`
        + ` return eqv(E1, [x0, y0, c1]) && eqv(E2, [-y0, x0, c2]) && okSys(E1, E2, 3, 2) && eqv('4x+2y＝16', lcf(2, E2, 0, E1)) && eqv('5x＝15', lcf(1, E1, 1, '4x+2y＝16')) && hold('6+y＝8', 3, 2)`
        + ` && near(3 * x0 + 2 * y0, -1) && near(2 * x0 - 3 * y0, 8) && hold('3x+2y＝−1', 1, -2) === false && hold('3x+2y＝5', 1, -2) === false`
        + ` && scan(L[0], 1, -2) && L.slice(1).every(t => scan(t.replace(/a/g, 'x').replace(/b/g, 'y'), 3, 2));`),
      // 小テスト（1）〜（3）、チャレンジ（x を消去：①×3 15x+21y＝−3、②×5 15x+20y＝0、③−④ y＝−3。x の最小公倍数 15、y は 28）
      chk('第3時 小テスト', `const D = ${J([Q1, Q2, Q3, QC])}, L = ${J([sol3(Q1, true), sol3(Q2, true), sol3(Q3, true), sol3(QC, true)])}; return D.every((r, i) => okR(r) && L[i].every(t => scan(t, r.x, r.y))) && D[3].key === 'y＝−3' && lcm(5, 3) < lcm(7, 4) && near(D[1].x, 1 / 2) && eqv('15x+21y＝−3', lcf(3, ${J(QC.A)}, 0, ${J(QC.B)})) && eqv('15x+20y＝0', lcf(0, ${J(QC.A)}, 5, ${J(QC.B)}));`),
      // どの問題も、解をもとの2つの式の左辺・右辺に代入して、両方が成り立つ。（1）〜（6）の解は、すべてちがう組・x も y もすべてちがう（答えの種類がかたよらない）。分数の解・負の解がある
      chk('第3時 全問：解をもとの式に代入して、両方の式が成り立つ', `const A = ${J(ALL.map(r => [r.A, r.B, r.x, r.y]).concat([[L1[0], L1[1], 3, 2], [TH3[0], TH3[1], 3, -1]]))}, P = ${J([D1, D2, D3, D4, D5, D6].map(r => [r.x, r.y]))}, Q = ${J([Q1, Q2, Q3, QC].map(r => [r.x, r.y]))};`
        + ` return A.every(([p, q, x, y]) => [p, q].every(e => { const s = e.split('＝'); return near(EV(s[0], { x, y }), EV(s[1], { x, y })); })) && new Set(P.map(r => r[0])).size === 6 && new Set(P.map(r => r[1])).size === 6 && new Set(Q.map(r => r[0])).size === 4 && new Set(Q.map(r => r[1])).size === 4`
        + ` && P.some(r => !Number.isInteger(r[0]) || !Number.isInteger(r[1])) && P.some(r => r[0] < 0 || r[1] < 0) && P.filter(r => Number.isInteger(r[0]) && Number.isInteger(r[1])).length >= 4;`),
      'near(1, 1)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('式を何倍かして係数をそろえ、加減法で連立方程式を解こう'),
      K('今日の問い', '連立方程式 ' + SN(L1[0], L1[1]) + ' を、加減法で解きたい。\n①+②、①−② をしても、文字は消えない。文字を1つ消すには、どうすればよいだろう。', 4),
      T('①', '自分の考え（3分）　どうすれば文字を1つ消せるか、書こう。', 1),
      B(4, T_L1),
      T('②', 'ペアの考え（3分）　自分とちがう考えを書こう。', 1),
      B(3, ''),
      G(1),
      WD('両辺に同じ数をかけても成り立つ。（等式の{{性質}}）\n式を{{何倍}}かして、係数の{{絶対値}}をそろえる。\nそろえたら、{{加減法}}で文字を1つ消す。\n新しい式に番号をつける。（② × 2 …③）', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '連立方程式 ' + S2('4x+3y＝{{−1}}　…①', '3x−2y＝{{12}}　…②') + ' を、y を消去して、加減法で解こう。', 3),
      B(5, T_EX),
      T('', '【確かめ】x＝2、y＝−3 を、もとの ①、② に代入して、成り立つか確かめよう。', 1),
      B(2, T_EXC)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 係数がそろっていないときは、式の両辺を{{何倍}}かして、{{絶対値}}をそろえる。\n② 絶対値をそろえたあと、符号が同じなら{{ひき}}、反対なら{{たし}}て消す。\n③ 式を何倍かしたら、新しい式に{{番号}}をつけて、「② × 2 …③」と書く。\n④ 式を何倍かするときは、{{右辺}}にも同じ数をかけることをわすれない。', 4, { label: 'ことば' }),
      C2([
        T('（1）', SN(D1.A, D1.B), 2),
        B(5, solT3(D1))
      ], [
        T('（2）', SN(D2.A, D2.B), 2),
        B(5, solT3(D2))
      ], '1:1'),
      MA('【説明】（2）で、消す文字と、何倍するかを、解く前に隣の人に伝えよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '式を何倍かして、加減法で解こう。'),
      C2([
        T('（3）', SN(D3.A, D3.B), 2),
        B(5, solT3(D3))
      ], [
        T('（4）', SN(D4.A, D4.B), 2),
        B(5, solT3(D4))
      ], '1:1'),
      C2([
        T('（5）', 'おにぎり4個とお茶3本で 850円、おにぎり3個とお茶2本で 610円。おにぎり x円、お茶 y円を求めよう。', 3),
        B(5, D5L.join('\n'))
      ], [
        T('（6）', SN(D6.A, D6.B), 2),
        B(5, solT3(D6))
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：どちらの文字を消すと楽か、見つけよう。'),
      T('（7）', '例題の連立方程式 ' + SN(EX.A, EX.B) + ' を、x を消去する方法で解いて、y を消去した例題とくらべよう。どちらの文字を消すほうが楽か、式のどこを見て決めればよいだろう。', 4),
      C2([
        T('①', 'x を消去して、例題を解こう。（何倍したかも書く）', 2),
        B(5, '')
      ], [
        T('②', '気づいたこと', 1),
        B(6, '')
      ], '1:1'),
      T('③', 'ほかの連立方程式でも、どちらを消すと楽か決めて、解こう。' + SN(TH3[0], TH3[1]), 3),
      B(4, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', 'x＝1、y＝−2 が、連立方程式 ' + S2(D8[0], D8[1]) + ' の解のとき、a、b の値を求めよう。', 4),
        B(7, D8L.join('\n'))
      ], [
        MA('① x＝1、y＝−2 を、2つの式に入れると、a、b の式はどうなるかな。\n② できた2つの式を、a、b の連立方程式として見ると、どう解けるかな。', 7, { label: 'ヒントカード' })
      ], '3:2')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '連立方程式 ' + SN(Q1.A, Q1.B) + ' を、加減法で解こう。（3点）', 2),
      B(4, solT3(Q1, true)),
      T('（2）', '連立方程式 ' + SN(Q2.A, Q2.B) + ' を、加減法で解こう。（3点）', 2),
      B(5, solT3(Q2, true)),
      T('（3）', '連立方程式 ' + SN(Q3.A, Q3.B) + ' を、加減法で解こう。（4点）', 2),
      B(5, solT3(Q3, true)),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '連立方程式 ' + SN(QC.A, QC.B) + ' を解こう。', 2),
      B(5, solT3(QC, true))
    ]
  };
  // 教卓の解答（B の答え）のすべてについて、文字のない式（4×2+3×(−3)＝−1 など）が計算として正しいか確かめる
  DEF.checks[DEF.checks.length - 1] = chk('第3時 答えの文の計算', `const T = ${J(ANS(DEF.ws).concat(ANS(DEF.dr), ANS(DEF.qz)))}; return T.length > 8 && T.every(arith);`);
  IK.lesson('renritsu_new-03', DEF);
})();
