#!/usr/bin/env node
/* 検算と形の検査（ブラウザなしで動く）。  使い方：node tools/verify.cjs [セットの数=40]
   すべての単元・STEP・セット番号 1〜N について：
   ① 1セットの問題数（単元・STEP ごとに決めた20〜50問。前半と後半で半分ずつ）がそろっているか・同じ問題がかぶらないか・同じ番号で同じ問題になるか
   ② 答えが正しいか。作るときの計算とは別の道すじで確かめる
      （式は文字から読み直して分数で計算／割合・単位・時間は文字から読み直す／面積・体積は meta の寸法から計算し、図に寸法の字があるかも見る）
   ③ STEP の条件を守っているか。前半と後半で別々の条件（くり上がり・くり下がり・約分の有無・答えの大きさ など）
   ④ 分数の答えが約分ずみか、小数の答えに余分な 0 がないか */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['core', 'units-basic', 'units-frac', 'units-misc', 'figs', 'units-geo', 'units-vocab']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
}
const TG = ctx.TG;
const SETS = Math.max(1, parseInt(process.argv[2], 10) || 40);

/* ---------------- 分数で計算する小さな道具 ---------------- */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const R = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };
const add = (x, y) => R(x.n * y.d + y.n * x.d, x.d * y.d);
const sub = (x, y) => R(x.n * y.d - y.n * x.d, x.d * y.d);
const mul = (x, y) => R(x.n * y.n, x.d * y.d);
const div = (x, y) => R(x.n * y.d, x.d * y.n);
const same = (x, y) => x.n === y.n && x.d === y.d;
const show = x => (x.d === 1 ? String(x.n) : `${x.n}/${x.d}`);
// 数の字 → 分数。  "{3/4}"・"2.35"・"12"
function num(s) {
  s = s.trim();
  let m;
  if ((m = s.match(/^\{(\d+)\/(\d+)\}$/))) return R(+m[1], +m[2]);
  if ((m = s.match(/^(\d+)\.(\d+)$/))) return R(+(m[1] + m[2]), 10 ** m[2].length);
  if ((m = s.match(/^\d+$/))) return R(+s);
  throw new Error(`数として読めない：「${s}」`);
}
// 式（+ − × ÷ をふくむ）を、かけ算・わり算を先にして計算する
function evalExpr(s) {
  const tk = s.split(/\s+/).filter(Boolean);
  const vals = [num(tk[0])], ops = [];
  for (let i = 1; i < tk.length; i += 2) {
    const op = tk[i], v = num(tk[i + 1]);
    if (op === '×') vals.push(mul(vals.pop(), v));
    else if (op === '÷') vals.push(div(vals.pop(), v));
    else { ops.push(op); vals.push(v); }
  }
  return vals.slice(1).reduce((acc, v, i) => (ops[i] === '+' ? add(acc, v) : sub(acc, v)), vals[0]);
}
const nums = s => (s.match(/\{\d+\/\d+\}|\d+\.\d+|\d+/g) || []).map(num);
// 答えの字を、数として読めるなら分数の形にそろえる（0.5 と 1/2 を同じに見る）。読めなければそのまま
const norm = a => { try { return show(num(String(a))); } catch (e) { return String(a); } };

let ng = 0, total = 0;
const fails = new Map();
const bad = (where, msg) => { ng++; const k = where + '：' + msg; fails.set(k, (fails.get(k) || 0) + 1); };

/* ---------------- 単元ごとの検算 ---------------- */
const PRE_ARITH = new Set(['add1', 'sub1', 'mul1', 'div1', 'add2', 'sub2', 'mul2', 'div2', 'fmul', 'fdiv', 'dadd', 'dsub']);

// 単位の変換：すべてを 1つの基準の単位にそろえて比べる（cm・g・mL・cm²・cm³）
const BASE = { mm: ['len', 0.1], cm: ['len', 1], m: ['len', 100], km: ['len', 100000], g: ['mass', 1], kg: ['mass', 1000], t: ['mass', 1000000],
  'cm²': ['area', 1], 'm²': ['area', 10000], a: ['area', 1000000], ha: ['area', 100000000],
  mL: ['cap', 1], dL: ['cap', 100], L: ['cap', 1000], 'cm³': ['cap', 1], 'm³': ['cap', 1000000] };
const ratioOf = (u1, u2) => { const [c1, k1] = BASE[u1], [c2, k2] = BASE[u2]; return c1 !== c2 ? null : R(Math.round(k1 * 10), Math.round(k2 * 10)); };
function convert(it) {
  let m = it.pre.match(/^(\d+(?:\.\d+)?) (\S+)$/);
  if (m && BASE[m[2]] && BASE[it.post]) { const k = ratioOf(m[2], it.post); return k ? show(mul(num(m[1]), k)) : 'class'; }
  // 2つの単位をあわせる（2 m 30 cm ＝ □ cm）
  m = it.pre.match(/^(\d+) (\S+) (\d+) (\S+)$/);
  if (m && BASE[m[2]] && BASE[m[4]] && m[4] === it.post) {
    const k = ratioOf(m[2], m[4]);
    return k ? show(add(mul(num(m[1]), k), num(m[3]))) : 'class';
  }
  return null;
}

const wari = p => `${Math.floor(p / 10)}割${p % 10 ? p % 10 + '分' : ''}`;
function expectedRatio(it) {
  let m;
  const { pre, post } = it;
  if ((m = pre.match(/^(\d+(?:\.\d+)?)$/)) && post === '%') return show(mul(num(m[1]), R(100)));
  if ((m = pre.match(/^(\d+(?:\.\d+)?)$/)) && post === '' && /割/.test(it.ans)) return wari(Math.round(+m[1] * 100));
  if ((m = pre.match(/^(\d+) %$/))) {
    const p = +m[1];
    if (post === '割') return show(R(p, 10));
    if (/割/.test(it.ans)) return wari(p);
    return show(R(p, 100));
  }
  if ((m = pre.match(/^(\d)割(?:(\d)分)?$/)) && post === '%') return String(+m[1] * 10 + +(m[2] || 0));
  if ((m = pre.match(/^(\d)割(?:(\d)分)?$/)) && post === '') return show(R(+m[1] * 10 + +(m[2] || 0), 100));
  if ((m = pre.match(/^\{(\d+)\/(\d+)\}$/)) && post === '%') return show(mul(R(+m[1], +m[2]), R(100)));
  if ((m = pre.match(/^(\d+) の (\d+) %$/))) return show(R(+m[1] * +m[2], 100));
  if ((m = pre.match(/^(\d+) の (\d)割$/))) return show(R(+m[1] * +m[2], 10));
  if ((m = pre.match(/^(\d+) は (\d+) の$/))) return show(R(+m[1] * 100, +m[2]));
  if (pre === '' && (m = post.match(/^の (\d+) % は (\d+)$/))) return show(R(+m[2] * 100, +m[1]));
  if (pre === '' && (m = post.match(/^円の (?:(\d+) %|(\d)割)引きが (\d+)円$/))) { const p = m[1] ? +m[1] : +m[2] * 10; return show(R(+m[3] * 100, 100 - p)); }
  if ((m = pre.match(/^(\d+)円の (\d)割引き$/))) return String(+m[1] - +m[1] * +m[2] / 10);
  if ((m = pre.match(/^(\d+)円の (\d+) %引き$/))) return String(+m[1] - +m[1] * +m[2] / 100);
  if ((m = pre.match(/^(\d+)人の (\d+) %増し$/))) return String(+m[1] + +m[1] * +m[2] / 100);
  if ((m = pre.match(/^(\d+)円 → (\d+)円は$/)) && post === '%引き') return show(R((+m[1] - +m[2]) * 100, +m[1]));
  if ((m = pre.match(/^(\d+)人 → (\d+)人は$/)) && post === '%増し') return show(R((+m[2] - +m[1]) * 100, +m[1]));
  return null;
}

const hm = s => { const m = s.match(/^(\d+)時(?:(\d+)分)?$/); return m ? +m[1] * 60 + +(m[2] || 0) : null; };
const dur = s => { const m = s.match(/^(?:(\d+)時間)?(?:(\d+)分)?$/); return m && s ? +(m[1] || 0) * 60 + +(m[2] || 0) : null; };
const fmtD = min => (min >= 60 ? `${Math.floor(min / 60)}時間` : '') + (min % 60 ? `${min % 60}分` : '');
const fmtT = min => `${Math.floor(min / 60)}時` + (min % 60 ? `${min % 60}分` : '');

function expectedTime(it, step) {
  let m;
  const { pre, post } = it;
  if (step === 1 && (m = pre.match(/^(.+)の (.+)(後|前)$/))) {
    const t = hm(m[1]), d = dur(m[2]);
    return t == null || d == null ? null : fmtT(t + (m[3] === '後' ? d : -d));
  }
  if (step === 3 && (m = pre.match(/^(.+)〜(.+)$/))) return fmtD(hm(m[2]) - hm(m[1]));
  if (step === 2) {
    if ((m = pre.match(/^(\d+)分$/))) return post === '時間' ? show(R(+m[1], 60)) : fmtD(+m[1]);
    if ((m = pre.match(/^(\d+)時間(\d+)分$/))) return post === '分' ? String(+m[1] * 60 + +m[2]) : post === '時間' ? show(R(+m[1] * 60 + +m[2], 60)) : null;
    if ((m = pre.match(/^(\d+)秒$/))) return post === '分' ? show(R(+m[1], 60)) : `${Math.floor(+m[1] / 60)}分${+m[1] % 60 ? +m[1] % 60 + '秒' : ''}`;
    if ((m = pre.match(/^(\d+)分(\d+)秒$/)) && post === '秒') return String(+m[1] * 60 + +m[2]);
    if ((m = pre.match(/^(\d+(?:\.\d+)?)時間$/)) && post === '分') return show(mul(num(m[1]), R(60)));
  }
  return null;
}

const AREA_OF = {
  rect: ([w, h]) => `${w * h}`, square: ([a]) => `${a * a}`, triangle: ([b, h]) => show(R(b * h, 2)), parallelogram: ([b, h]) => `${b * h}`,
  trapezoid: ([a, b, h]) => show(R((a + b) * h, 2)), circle: ([r]) => `${r * r}π`, semicircle: ([r]) => `${show(R(r * r, 2))}π`,
};
const VOL_OF = {
  cuboid: ([a, b, c]) => `${a * b * c}`, cube: ([a]) => `${a * a * a}`, triPrism: ([b, h, L]) => show(R(b * h * L, 2)), prismBase: ([S, H]) => `${S * H}`,
  trapPrism: ([a, b, h, L]) => show(R((a + b) * h * L, 2)),
  cylinder: ([r, h]) => `${r * r * h}π`, cylinderD: ([d, h]) => `${show(R(d * d * h, 4))}π`,
  cone: ([r, h]) => `${show(R(r * r * h, 3))}π`, coneD: ([d, h]) => `${show(R(d * d * h, 12))}π`,
  pyramid: ([a, b, h]) => show(R(a * b * h, 3)),
};

/* ---------------- STEP の条件（作る側の条件とは別に、式の数から確かめる）。各 STEP は [前半, 後半] ---------------- */
const tn = n => Math.floor(n / 10);   // 十の位
const un = n => n % 10;               // 一の位
const mulParts = v => (v[0] >= 10 || v[1] < 10 ? v : [v[1], v[0]]);   // 2けた×1けた → [2けた, 1けた]
const sum = v => v.reduce((s, x) => s + x, 0);
const hasTen = v => v.some((x, i) => v.some((y, j) => i < j && x + y === 10));
const COND = {
  add1: [
    [([a, b]) => a + b <= 10, v => v.length === 3 && sum(v) >= 6 && sum(v) <= 10],
    [([a, b]) => a + b >= 11 && a >= 2 && b >= 2 && a <= 9 && b <= 9, ([x, y]) => { const [a, b] = x >= 10 ? [x, y] : [y, x]; return a >= 12 && a <= 89 && b >= 2 && b <= 9 && un(a) + b >= 10 && b < 10; }],
    [v => v.length === 3 && hasTen(v) && sum(v) <= 19, v => v.length === 3 && v.every(x => x >= 3) && sum(v) >= 18 && sum(v) <= 26 && !hasTen(v)],
  ],
  sub1: [
    [([a, b]) => a <= 10 && b < a, ([a, b, c]) => c !== undefined && a <= 10 && a - b - c >= 1],
    [([a, b]) => a >= 11 && a <= 18 && b > a % 10 && a - b >= 1, ([a, b]) => a >= 21 && a <= 98 && b >= 2 && b <= 9 && b > un(a)],
    [([a, b]) => a >= 10 && a <= 19 && a - b >= 1, ([a, b, c]) => c !== undefined && a >= 12 && a <= 19 && a - b - c >= 1 && tn(a) !== tn(a - b - c)],
  ],
  mul1: [
    [v => v.some(x => x <= 5) && v.every(x => x >= 2), v => Math.min(...v) >= 2 && Math.min(...v) <= 5 && Math.max(...v) >= 6 && Math.max(...v) <= 9],
    [v => v.some(x => x >= 6) && v.every(x => x >= 2), v => v.every(x => x >= 6 && x <= 9)],
    [v => v.every(x => x >= 2 && x <= 9), v => { const big = Math.max(...v), small = Math.min(...v); return big % 10 === 0 && big >= 20 && small >= 2 && small <= 9; }],
  ],
  div1: [
    [([a, d]) => d <= 5 && a / d >= 2 && a % d === 0, ([a, d]) => d <= 5 && a % d === 0 && a / d >= 6 && a / d <= 9],
    [([a, d]) => d >= 6 && a / d >= 2 && a % d === 0, ([a, d]) => d >= 6 && a % d === 0 && a / d >= 6 && a / d <= 9],
    [([a, d]) => d >= 2 && a / d >= 2 && a % d === 0 && a / d <= 9, ([a, d]) => d >= 2 && d <= 9 && a % d === 0 && (a / d) % 10 === 0 && a / d >= 20],
  ],
  add2: [
    [([a, b]) => un(a) + un(b) <= 9 && tn(a) + tn(b) <= 9, ([a, b]) => un(a) + un(b) <= 9 && tn(a) + tn(b) >= 10],
    [([a, b]) => un(a) + un(b) >= 10 && a + b < 100, ([a, b]) => un(a) + un(b) >= 10 && a + b >= 80 && a + b <= 99],
    [([a, b]) => a + b >= 100 && a + b <= 198, ([a, b]) => un(a) + un(b) >= 10 && a >= 55 && b >= 55 && a + b >= 120],
  ],
  sub2: [
    [([a, b]) => b >= 10 && un(a) >= un(b) && a > b, ([a, b, c]) => c !== undefined && a >= 60 && un(a) >= un(b) + un(c) && tn(a) >= tn(b) + tn(c) + 1],
    [([a, b]) => b >= 10 && un(a) < un(b) && a > b, ([a, b]) => b >= 11 && un(a) < un(b) && a > b && (un(a) === 0 || a - b <= 19)],
    [([a, b]) => (a === 100 && un(b) !== 0 && b > 10) || (b >= 10 && a < 100 && un(a) < un(b) && a > b), ([a, b]) => a >= 110 && a <= 199 && b >= 11 && b <= 99 && un(a) < un(b) && a - b >= 10],
  ],
  mul2: [
    [v => { const [a, m] = mulParts(v); return m <= 4 && a >= 10 && un(a) * m <= 9 && tn(a) * m <= 9; }, v => { const [a, m] = mulParts(v); return m >= 2 && m <= 5 && un(a) * m >= 10 && un(a) * m <= 19 && a * m < 100; }],
    [v => { const [a, m] = mulParts(v); return un(a) * m >= 10 && a * m < 100; }, v => { const [a, m] = mulParts(v); return a >= 11 && a <= 19 && m >= 5 && un(a) * m >= 10 && a * m < 100; }],
    [v => { const [a, m] = mulParts(v); return a * m >= 100 && a * m <= 300 && un(a) !== 0; }, v => { const [a, m] = mulParts(v); return a * m >= 300 && a * m <= 600 && un(a) !== 0 && m >= 4; }],
  ],
  div2: [
    [([x, d]) => d <= 4 && x % d === 0 && x / d >= 10 && tn(x) % d === 0 && un(x / d) * d <= 9, ([x, d]) => d <= 4 && x % d === 0 && x / d >= 10 && tn(x) % d !== 0],
    [([x, d]) => x % d === 0 && x / d >= 10 && tn(x) % d !== 0, ([x, d]) => d >= 5 && x % d === 0 && x / d >= 10 && tn(x) % d !== 0],
    [([x, d]) => x % d === 0 && x / d >= 2 && x >= 10 && x <= 99, ([x, d]) => x % d === 0 && x >= 100 && x <= 250 && x / d >= 11],
  ],
};

// 分数の条件（式の文字から）
function checkFrac(u, step, half, it, ans, where) {
  const fr = (it.pre.match(/\{\d+\/\d+\}/g) || []).map(num);
  if (fr.some(x => x.d === 1 || x.n >= x.d)) return bad(where, `約分されていない／真分数でない：${it.pre}`);
  const [a, b, c, d] = fr.length === 2 ? [fr[0].n, fr[0].d, fr[1].n, fr[1].d] : [fr[0].n, fr[0].d, 0, 0];
  const k = it.pre.replace(/\{\d+\/\d+\}/g, '').match(/\d+/);   // 整数の項
  const ok = (cond, msg) => { if (!cond) bad(where, `${msg}：${it.pre}`); };
  if (u.id === 'fmul') {
    const cancel = fr.length === 2 ? gcd(a * c, b * d) > 1 : gcd(b, +k[0]) > 1;
    if (step === 1) { ok(fr.length === 1 && ans.d === 1, '答えが整数でない'); if (half) ok(b >= 6, '分母が6〜9でない'); }
    if (step === 2) { ok(fr.length === 2 && !cancel, '約分が出る'); if (half) ok(a >= 2 && c >= 2 && b >= 5 && d >= 5, '分子・分母の条件'); else ok(b * d <= 45, '分母の積が大きい'); }
    if (step === 3) { if (half) ok(fr.length === 2 && gcd(a, d) > 1 && gcd(c, b) > 1, '約分が2回でない'); else ok(cancel, '約分がない'); }
  }
  if (u.id === 'fdiv') {
    if (step === 1) { ok(fr.length === 1 && !/\//.test(it.pre.split('÷')[1] || ''), '分数÷整数でない'); if (half) ok(gcd(a, +k[0]) > 1, '分子が約分できない'); }
    if (step === 2) { ok(fr.length === 2 && gcd(a * d, b * c) === 1, '約分が出る'); if (half) ok(a >= 2 && c >= 2, '分子が1'); }
    if (step === 3) {
      if (half) ok(fr.length === 2 && gcd(a * d, b * c) >= 3, '大きく約分できない');
      else ok(fr.length === 1 || gcd(a * d, b * c) > 1, '約分がない');
    }
  }
}
// 小数の条件
function checkDec(u, step, half, it, where) {
  const raw = it.pre.match(/\d+(?:\.\d+)?/g), v = raw.map(x => Math.round(parseFloat(x) * 100));
  const places = Math.max(...raw.map(s => (s.includes('.') ? s.split('.')[1].length : 0)));
  const ok = (cond, msg) => { if (!cond) bad(where, `${msg}：${it.pre}`); };
  const [A, B] = v, ia = Math.floor(A / 100), ib = Math.floor(B / 100), ta = Math.floor(A / 10) % 10, tb = Math.floor(B / 10) % 10, ha = A % 10, hb = B % 10;
  if (step < 3) ok(places <= 1, '小数第2位が出ている');
  if (step === 3) ok(places === 2, '小数第2位がない');
  if (u.id === 'dadd') {
    if (step === 1) { ok(ta + tb <= 9, 'くり上がりがある'); if (half) ok(ia >= 10 && ib >= 10, '整数が2けたでない'); }
    if (step === 2) { ok(ta + tb >= 10, 'くり上がりがない'); if (half) ok(ia >= 5 && ib >= 5 && (ia >= 10 || ib >= 10), '整数が小さい'); }
    if (step === 3 && half) ok(ha + hb <= 9 && ta + tb >= 10 && ha >= 1 && hb >= 1, '10分の1の位だけくり上がる形でない');
  } else {
    if (step === 1) { ok(ta >= tb && A > B, 'くり下がりがある'); if (half) ok(ia >= 12 && ib >= 10, '整数が2けたでない'); }
    if (step === 2) { ok(ta < tb && A > B, 'くり下がりがない'); if (half) ok(ia >= 11 && ib >= 5, '整数が小さい'); }
    if (step === 3 && half) ok(ha >= hb && hb >= 1 && ta < tb && ia > ib, '10分の1の位だけくり下がる形でない');
  }
}


/* ---------------- 語彙カード：meta から「問題の文字と答え」をもう一度つくって見比べる（作る側とは別の書き方） ---------------- */
const sup = e => (e === 2 ? '²' : e === 3 ? '³' : `^{${e}}`);   // 上つき（2乗・3乗は ² ³、4乗以上は ^{4}）
const FR = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `{${n / g}/${d / g}}`; };   // 約分した分数の字
const primeQ = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
// n/d を小数の字に（割りきれるものだけ。割りきれなければ null）
function decStr(n, d) {
  let rem = n % d, out = String(Math.floor(n / d));
  if (rem) out += '.';
  for (let i = 0; rem && i < 12; i++) { rem *= 10; out += Math.floor(rem / d); rem %= d; }
  return rem ? null : out;
}
const digitsOf = (n, d, k) => { let rem = n % d, s = ''; for (let i = 0; i < k; i++) { rem *= 10; s += Math.floor(rem / d); rem %= d; } return s; };
const roundTo = (x, p) => (Math.round(x * 10 ** p) / 10 ** p).toFixed(p);
const truncTo = (x, p) => (Math.floor(x * 10 ** p + 1e-9) / 10 ** p).toFixed(p);
const X = (pre, eq, ans, post) => ({ pre, eq, ans: String(ans), post: post || '' });
const HANDBOOK = {   // ハンドブックに載っている表（これと合うか）
  facts: [[6, 7], [7, 8], [6, 8], [4, 7], [7, 9], [25, 4], [125, 8], [15, 4], [75, 4]].map(p => p.slice().sort((a, b) => a - b).join('x')),
  fake: { 51: [3, 17], 57: [3, 19], 87: [3, 29], 91: [7, 13], 119: [7, 17], 133: [7, 19], 143: [11, 13], 187: [11, 17], 209: [11, 19], 221: [13, 17] },
  pi: [2, 3, 4, 5, 6, 8, 9, 16, 25, 10],
};
const SUBX = { 'x²': x => x * x, '−x²': x => -(x * x), '(−x)²': x => x * x, '2x²': x => 2 * x * x, '−2x²': x => -2 * x * x, 'x³': x => x ** 3, '−x³': x => -(x ** 3) };
const sg = n => (n < 0 ? `−${-n}` : String(n));
const VEXP = {
  mulfact: m => { const p = m.a * m.b; if (!HANDBOOK.facts.includes([m.a, m.b].sort((a, b) => a - b).join('x'))) throw new Error('表にない九九・ペア');
    return m.hide === 0 ? X(`${m.a} × ${m.b}`, true, p) : m.hide === 1 ? X('', false, m.a, `× ${m.b} ＝ ${p}`) : X(`${m.a} ×`, false, m.b, `＝ ${p}`); },
  comp: m => X(`${m.n} +`, false, m.N - m.n, `＝ ${m.N}`),
  xmul: m => { const five = [5, 50].includes(m.m) && m.a % 2 === 0 && m.a >= 12 && m.a <= 98, nine = [98, 99].includes(m.a) && m.m >= 3 && m.m <= 9; if (!five && !nine) throw new Error('×5・×50（偶数の2けた）か ×99・×98 でない'); return X(`${m.a} × ${m.m}`, true, m.a * m.m); },
  reord: m => { if (!((m.a === 25 && m.b === 4) || (m.a === 125 && m.b === 8))) throw new Error('キリ番ペアでない'); return X(m.pre, true, m.a * m.b * m.kk); },
  f2d: m => { if (decStr(m.n, m.d) !== m.s || gcd(m.n, m.d) !== 1) throw new Error('小数と分数が合わない'); return m.rev ? X(m.s, true, `{${m.n}/${m.d}}`) : X(`{${m.n}/${m.d}}`, true, m.s); },
  rec: m => { const k = m.s.replace(/^0\./, '').replace('…', '').length; if (m.s !== '0.' + digitsOf(m.n, m.d, k) + '…') throw new Error('循環小数がちがう'); return m.rev ? X(m.s, true, `{${m.n}/${m.d}}`) : X(`{${m.n}/${m.d}}`, true, m.s); },
  dprod: m => { const a = num(m.x), b = num(m.y), p = mul(a, b); return X(`${m.x} × ${m.y}`, true, FR(p.n, p.d)); },
  dfrac: m => { const p = mul(num(m.x), R(m.n, m.d)); return X(`${m.x} × {${m.n}/${m.d}}`, true, FR(p.n, p.d)); },
  deg: m => m.rev ? X(`360° の ${FR(m.a, 360)} は`, false, m.a, '°') : X(`${m.a}° は 360° の`, false, FR(m.a, 360)),
  degp: m => { if ((m.a * 10) % 36) throw new Error('％が整数にならない'); const p = m.a * 10 / 36; return m.rev ? X(`360° の ${p} % は`, false, m.a, '°') : X(`${m.a}° は 360° の`, false, p, '%'); },
  tm: m => { const hs = m.m === 6 ? '0.1' : FR(m.m, 60); if (!same(num(hs), R(m.m, 60))) throw new Error('時間と分がちがう'); return m.rev ? X(`${hs}時間`, true, m.m, '分') : X(`${m.m}分`, true, hs, '時間'); },
  spd: m => { if ((m.kmh * 5) % 18) throw new Error('秒速が整数にならない'); const v = m.kmh * 5 / 18; return m.rev ? X(`秒速 ${v} m ＝ 時速`, false, m.kmh, 'km') : X(`時速 ${m.kmh} km ＝ 秒速`, false, v, 'm'); },
  unf: m => { const k = ratioOf(m.a, m.b); if (!k || k.d !== 1 || k.n !== m.fac) throw new Error('単位の倍率がちがう'); return m.rev ? X(`${m.fac} ${m.b}`, true, 1, m.a) : X(`1 ${m.a}`, true, m.fac, m.b); },
  pi: m => { if (!HANDBOOK.pi.includes(m.n)) throw new Error('3.14の段にない'); const v = show(R(314 * m.n, 100)); return m.rev ? X('3.14 ×', false, m.n, `＝ ${decOut(314 * m.n)}`) : X(`3.14 × ${m.n}`, true, decOut(314 * m.n)); },
  pi2: m => { const k = m.op === '+' ? m.a + m.b : m.a - m.b; if (!HANDBOOK.pi.includes(k) || k < 2) throw new Error('くくった数が段にない'); return X(`3.14 × ${m.a} ${m.op} 3.14 × ${m.b}`, true, decOut(314 * k)); },
  sq: m => { if (m.n < 11 || m.n > 25) throw new Error('11〜25でない'); return m.rev ? X(`√${m.n * m.n}`, true, m.n) : X(`${m.n}²`, true, m.n * m.n); },
  pw: m => { const v = m.b ** m.e; return !m.rev ? X(`${m.b}${sup(m.e)}`, true, v) : m.e === 3 ? X('', false, m.b, `³ ＝ ${v}`) : X(`${m.b} の`, false, m.e, `乗 ＝ ${v}`); },
  rt: m => { const p = (m.s.split('.')[1] || '').length, x = Math.sqrt(m.n); if (m.s !== roundTo(x, p) && m.s !== truncTo(x, p)) throw new Error('近似値がちがう'); return m.rev ? X('√', false, m.n, `≒ ${m.s}`) : X(`√${m.n} ≒`, false, m.s); },
  rts: m => { if (![2, 3, 5, 6, 7].includes(m.b)) throw new Error('√の中が平方数をふくむ'); return m.rev ? X(`${m.a}√${m.b}`, true, `√${m.a * m.a * m.b}`) : X(`√${m.a * m.a * m.b}`, true, `${m.a}√${m.b}`); },
  fake: m => { const f = HANDBOOK.fake[m.n]; if (!f || f[0] !== m.p || f[1] !== m.q || m.p * m.q !== m.n) throw new Error('表の合成数とちがう'); return m.rev ? X(`${m.p} × ${m.q}`, true, m.n) : X(`${m.n}`, true, `${m.p} × ${m.q}`); },
  isprime: m => X(`${m.n} は素数？`, false, primeQ(m.n) ? '○' : '×'),
  mult: m => {   // 倍数判定法（各位の和→3・9、下2桁→4、下3桁→8）で別に判定する
    const s = String(m.N), ds = s.split('').reduce((t, c) => t + +c, 0);
    const ok = m.d === 3 ? ds % 3 === 0 : m.d === 9 ? ds % 9 === 0 : m.d === 4 ? +s.slice(-2) % 4 === 0 : +s.slice(-3) % 8 === 0;
    return X(`${m.N} は ${m.d} の倍数？`, false, ok ? '○' : '×');
  },
  tri: m => { if (m.a * m.a + m.b * m.b !== m.c * m.c) throw new Error('三平方の定理が成り立たない'); return m.ask === 'hyp' ? X(`直角をはさむ辺 ${m.a}・${m.b} の斜辺`, true, m.c) : X(`斜辺 ${m.c}・一辺 ${m.a} のもう一辺`, true, m.b); },
  jogi: m => m.t === 'iso' ? (m.ask === 'hyp' ? X(`45°定規 等辺 ${m.a} の斜辺`, true, `${m.a}√2`) : X(`45°定規 斜辺 ${m.a}√2 の等辺`, true, m.a))
    : (m.ask === 'hyp' ? X(`30°定規 短辺 ${m.a} の斜辺`, true, 2 * m.a) : X(`30°定規 短辺 ${m.a} の長辺`, true, `${m.a}√3`)),
  divd: m => X(`${m.n} ÷ ${m.d}`, true, show(div(R(m.n), num(m.d)))),
  divf: m => X(`${m.a} ÷ {${m.n}/${m.d}}`, true, show(div(R(m.a), R(m.n, m.d)))),
  subx: m => { const f = SUBX[m.ex]; if (!f) throw new Error('式がわからない'); return X(`x ＝ −${-m.x} のとき、${m.ex}`, true, sg(f(m.x))); },
  dist: m => { const k = m.c * m.d; return X(`${m.c < 0 ? '−' : ''}${Math.abs(m.c)}(x ${m.d < 0 ? '−' : '+'} ${Math.abs(m.d)})`, true, `${sg(m.c)}x ${k < 0 ? '−' : '+'} ${Math.abs(k)}`); },
  recinv: m => { const e = div(R(1), R(m.a, m.b)); return X(`1 ÷ {${m.a}/${m.b}}`, true, FR(e.n, e.d)); },
};
function decOut(h) { const i = Math.floor(h / 100), f = h % 100; return f ? i + '.' + String(f).padStart(2, '0').replace(/0$/, '') : String(i); }

/* ---------------- 本体 ---------------- */
let sets = 0;
for (const u of TG.units) {
  if (!(u.n >= 20 && u.n <= 50 && u.n % 2 === 0)) bad(u.id, `1セットの問題数が20〜50の偶数でない（${u.n}）`);
  for (let step = 1; step <= u.steps.length; step++) {
    const st = u.steps[step - 1], need = TG.nOf(u, step);
    if (need % 2 || need < 12 || need > 50) bad(`${u.id} STEP${step}`, `問題数が前半・後半に分けられない（${need}）`);
    if (st.n && st.n === u.n) bad(`${u.id} STEP${step}`, 'STEP の n が単元の n と同じ（書かなくてよい）');
    if (!st.name2 || !(st.gen2 || st.mix2)) bad(`${u.id} STEP${step}`, '後半（name2・gen2/mix2）が決まっていない');
    for (let no = 1; no <= SETS; no++) {
      const s = TG.makeSet(u.id, step, no);
      sets++;
      const where0 = `${u.id} STEP${step}`;
      if (s.items.length !== need) bad(where0, `問題が ${s.items.length} 問しかできない（${need} 問必要）`);
      if (JSON.stringify(s.items) !== JSON.stringify(TG.makeSet(u.id, step, no).items)) bad(where0, '同じ番号で問題がちがう');
      if (!(s.goal >= 1 && s.goal <= need)) bad(where0, `目標が問題数に合わない：${s.goal}`);
      s.items.forEach((it, idx) => {
        total++;
        const half = idx >= s.half ? 1 : 0;
        const where = `${where0} ${half ? '後半' : '前半'}`;
        try {
          let expect = null;
          if (PRE_ARITH.has(u.id)) {
            const e = evalExpr(it.pre);
            expect = show(e);
            const ans = num(it.ans);
            if (it.ans.startsWith('{')) {
              if (ans.d === 1) bad(where, `分数で書かれた整数：${it.ans}`);
              const fm = it.ans.match(/^\{(\d+)\/(\d+)\}$/);
              if (!fm || gcd(+fm[1], +fm[2]) !== 1) bad(where, `約分されていない答え：${it.ans}`);
            }
            if (!same(ans, e)) bad(where, `答えがちがう：${it.pre} ＝ ${it.ans}（検算は ${expect}）`);
            if (/\.\d*0$/.test(it.ans)) bad(where, `小数の答えに余分な0：${it.ans}`);
            if (e.n < 0) bad(where, `答えが負：${it.pre}`);
            const c = COND[u.id] && COND[u.id][step - 1][half];
            if (c && !c(nums(it.pre).map(x => x.n))) bad(where, `条件に合わない：${it.pre}`);
            if (u.id === 'fmul' || u.id === 'fdiv') checkFrac(u, step, half, it, e, where);
            if (u.id === 'dadd' || u.id === 'dsub') checkDec(u, step, half, it, where);
          } else if (u.id === 'ratio') {
            expect = expectedRatio(it);
            if (expect === null) bad(where, `形を読めない：${it.pre}/${it.post}`);
            else if (expect !== norm(it.ans)) bad(where, `答えがちがう：${it.pre} ${it.post} ＝ ${it.ans}（検算は ${expect}）`);
            if (/\.\d*0$/.test(String(it.ans))) bad(where, `小数の答えに余分な0：${it.ans}`);
          } else if (u.id === 'unit') {
            expect = convert(it);
            if (expect === null) bad(where, `形を読めない：${it.pre} ${it.post}`);
            else if (expect === 'class') bad(where, `ちがう種類の単位：${it.pre} → ${it.post}`);
            else if (expect !== norm(it.ans)) bad(where, `答えがちがう：${it.pre} ＝ ${it.ans} ${it.post}（検算は ${expect}）`);
            if (step === 2 && !/\./.test(it.pre + it.ans)) bad(where, `小数が出ていない：${it.pre}`);
            if (step === 2 && half && !/\.\d\d/.test(it.pre + it.ans)) bad(where, `小数第2位が出ていない：${it.pre}`);
            if (step === 1 && half && !/^\d+ \S+ \d+ \S+$/.test(it.pre)) bad(where, `2つの単位の形でない：${it.pre}`);
            if (step === 3 && half && !/\./.test(it.pre + it.ans)) bad(where, `小数が出ていない：${it.pre}`);
          } else if (u.id === 'time') {
            expect = expectedTime(it, step);
            if (expect === null) bad(where, `形を読めない：${it.pre}/${it.post}`);
            else if (expect !== norm(it.ans)) bad(where, `答えがちがう：${it.pre} ＝ ${it.ans}（検算は ${expect}）`);
            if (step === 3 && half) { const m = it.pre.match(/^(.+)〜(.+)$/); if (!(hm(m[2]) % 60 < hm(m[1]) % 60)) bad(where, `くり下がりがない：${it.pre}`); }
            if (step === 1 && half) { const m = it.pre.match(/^.+の (.+)(?:後|前)$/); if (dur(m[1]) < 85) bad(where, `長い時間でない：${it.pre}`); }
          } else if (u.cat === 'vocab') {
            const m = it.meta;
            if (!m || !VEXP[m.k]) { bad(where, `種類がわからない：${it.pre}`); return; }
            const e = VEXP[m.k](m);
            if (it.pre !== e.pre || it.eq !== e.eq || String(it.ans) !== e.ans || it.post !== e.post) bad(where, `問題か答えがちがう：${m.k} ［${it.pre}｜${it.eq}｜${it.ans}｜${it.post}］ ← 検算は ［${e.pre}｜${e.eq}｜${e.ans}｜${e.post}］`);
            if ('rev' in m && m.rev !== half) bad(where, `前半は出す向き・後半は逆向きになっていない：${m.k}`);
            // 素数かどうか・倍数判定：前半は小さい数、後半は大きい数／別のきまり
            if (m.k === 'isprime' && (half ? m.n < 101 : m.n > 100)) bad(where, `数の範囲がちがう：${m.n}`);
            if (m.k === 'mult') { if (step === 3 && (half ? ![4, 8].includes(m.d) : ![3, 9].includes(m.d))) bad(where, `わる数がちがう：${m.d}`); if (!(m.N >= 100)) bad(where, `小さすぎる：${m.N}`); }
          } else if (u.id === 'area' || u.id === 'volume') {
            const { shape, dims, u: lu } = it.meta;
            expect = (u.id === 'area' ? AREA_OF : VOL_OF)[shape](dims);
            if (expect !== String(it.ans)) bad(where, `答えがちがう：${shape} ${dims} ＝ ${it.ans}（検算は ${expect}）`);
            // 図に寸法の字があるか（円・柱などの向きのちがいは、字が見つかればよい）
            for (const d of dims) if (!new RegExp(`[> ]${d}${lu}[²<]`).test(it.fig)) bad(where, `図に ${d}${lu} が書かれていない：${shape}`);
            if (it.post !== lu + (u.id === 'area' ? '²' : '³')) bad(where, `答えの単位がちがう：${it.post}`);
            if (!/^<svg[\s\S]*<\/svg>$/.test(it.fig) || /NaN|undefined/.test(it.fig)) bad(where, `図がこわれている：${shape}`);
            if (parseInt(it.ans, 10) > (u.id === 'area' ? 160 : 1000) && !/π/.test(it.ans)) bad(where, `答えが大きすぎる：${it.ans}`);
            if (/D$/.test(shape) && !/直径/.test(it.fig)) bad(where, `直径で出す図に「直径」がない：${shape}`);
          }
        } catch (e) {
          bad(where, `${e.message}（${it.pre}）`);
        }
      });
    }
  }
}

console.log(`単元 ${TG.units.length} ・ セット ${sets} ・ 問題 ${total} 問を検査`);
if (ng) {
  console.log(`✗ 問題が ${ng} か所`);
  [...fails.entries()].slice(0, 70).forEach(([k, n]) => console.log(`  ✗ ${k}${n > 1 ? `（×${n}）` : ''}`));
  process.exit(1);
}
console.log('✓ すべて合格（答え・前半と後半の条件・約分・重複・再現性）');
