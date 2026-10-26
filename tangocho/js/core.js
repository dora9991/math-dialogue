/* tangocho：計算単語帳（1分トレーニング）の土台。画面を持たない（ブラウザでも node の検査でも読める）。
   問題は「単元・STEP・セット番号」から作る。同じ番号なら、いつ・どの端末で開いても同じ問題になる（紙と画面が一致する）。
   1セット＝20問。前半10問（その STEP のふつうの問題）＋ 後半10問（同じ STEP の中で、少しだけむずかしい問題）。
     計算の早い子が前半をすぐ解き終わっても、そのまま後半へ進める。
   問題の形：{ pre, eq, ans, post, fig, meta }
     「pre ＝ ［ans］ post」の形で出る（eq:false なら「＝」なし）。文字の中の {3/4} は分数。
     fig＝図（SVG）、meta＝図の寸法など（tools/verify.cjs が別の道すじで検算するための材料）。 */
(function () {
  'use strict';
  const TG = (window.TG = window.TG || {});
  TG.units = [];
  TG.cats = [
    { id: 'basic', name: '1けたの計算', sub: 'たす・ひく・かける・わる' },
    { id: 'two', name: '2けたの計算', sub: '暗算で、ひっ算なしで' },
    { id: 'frac', name: '分数・小数', sub: '約分までやって答える' },
    { id: 'other', name: '割合・単位・図形・時間', sub: '身のまわりの数のあつかい' },
    { id: 'vocab', name: '語彙カード（暗記して反射に）', sub: 'ハンドブック 小3〜中3。前半は出す向き、後半は逆向き' },
  ];

  /* ---------------- 乱数（同じ種なら同じ並び） ---------------- */
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  TG.rng = function (seed) {
    const f = mulberry32(hash(String(seed)));
    return {
      next: f,
      int: (a, b) => a + Math.floor(f() * (b - a + 1)),
      pick: arr => arr[Math.floor(f() * arr.length)],
      chance: p => f() < p,
      shuffle: arr => { const x = arr.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; },
    };
  };

  /* ---------------- 数の小道具 ---------------- */
  TG.gcd = function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  // 約分した分数（整数になるなら整数）。問題の中の分数は {n/d}
  TG.frac = (n, d) => { const g = TG.gcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : `{${n}/${d}}`; };
  TG.fracRaw = (n, d) => `{${n}/${d}}`;
  // 100倍した整数 → 小数の文字（250→2.5、5→0.05、100→1）。小数の計算は整数でやって、誤差を出さない
  TG.dec = h => { const i = Math.floor(h / 100), f = h % 100; return f ? i + '.' + String(f).padStart(2, '0').replace(/0$/, '') : String(i); };

  /* ---------------- 表示用の文字 ---------------- */
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  TG.esc = esc;
  // 文字の中：{3/4}＝分数、^{10}＝上つき（2の10乗）。² ³ はふつうの文字（どのフォントにもある）
  TG.html = s => esc(s).replace(/\{(\d+)\/(\d+)\}/g, '<span class="fr"><span>$1</span><span>$2</span></span>').replace(/\^\{(\d+)\}/g, '<sup>$1</sup>');

  /* ---------------- 単元 ---------------- */
  // 単元：{ id, cat, name, note, n（1セットの問題数。前半と後半で半分ずつ）, goal（1分の目標。STEPごとの配列）, layout:'text'|'fig',
  //         steps:[{ name, gen(r) または mix（前半）, name2, gen2 または mix2（後半・少しむずかしい） }] }
  // gen(r) は問題を1つ返す。条件に合わないときは null を返して、作りなおす。
  // mix：[[重み, 関数], …]。重みの割合で「問題の種類」をえらび、その種類のなかで条件に合う問題ができるまで作りなおす
  //      （種類をえらびなおさないので、通りにくい種類が少なくなりすぎない。割引・三角形・円すい…のように、種類がまざる STEP で使う）
  TG.addUnit = function (u) { u.layout = u.layout || 'text'; TG.units.push(u); return u; };
  TG.unit = id => TG.units.find(u => u.id === id);

  const produce = (st, r, hard) => {
    const mix = hard ? st.mix2 : st.mix, gen = hard ? st.gen2 : st.gen;
    if (!mix) return gen(r);
    let x = r.next() * mix.reduce((s, m) => s + m[0], 0), fn = mix[mix.length - 1][1];
    for (const m of mix) { if ((x -= m[0]) < 0) { fn = m[1]; break; } }
    for (let k = 0; k < 500; k++) { const it = fn(r); if (it) return it; }
    return null;
  };

  // 1セット分の問題。setNo は 1 以上の整数（どんな大きな数でも、その番号ごとに決まった問題になる）。
  // 候補の少ない後半（少しむずかしい問題）を先に作り、前半はその残りから選ぶ（同じ問題がかぶらない）
  TG.makeSet = function (unitId, step, setNo) {
    const u = TG.unit(unitId);
    const st = u && u.steps[step - 1];
    if (!st) return null;
    const r = TG.rng(`${u.id}/${step}/${setNo}`);
    const n = st.n || u.n, half = n / 2, seen = new Set();   // st.n：その STEP だけ問題数がちがうとき（候補の少ない語彙カード）
    const make = (hard, count) => {
      const out = [];
      for (let tries = 0; out.length < count && tries < 30000; tries++) {
        const it = produce(st, r, hard);
        if (!it) continue;
        it.post = it.post || '';
        if (it.eq === undefined) it.eq = true;
        const key = it.key || it.pre + '|' + it.post + '|' + (it.meta ? JSON.stringify(it.meta) : '');   // key：順番を入れかえただけの式（31×8 と 8×31）を同じ問題として数える
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(it);
      }
      return out;
    };
    const back = make(true, half), front = make(false, n - half);
    return { unit: u, step, stepInfo: st, setNo, goal: TG.goalOf(u, step), half, items: [...front, ...back] };
  };
  TG.goalOf = (u, step) => (Array.isArray(u.goal) ? u.goal[step - 1] : u.goal);
})();
