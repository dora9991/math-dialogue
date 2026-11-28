# -*- coding: utf-8 -*-
# h3a 検算スクリプト：全問「問題 → 計算した答え」を一覧にして出し、正解の選択肢（k:1）と突き合わせる。
# 使い方:  python3 out/h3a.verify.py          （h3 フォルダで実行。out/h3a/<授業>.json を読む）
#          python3 out/h3a.verify.py m3a-03   （授業を指定）
# 各問の検算は chk(id, 説明, 計算した答え, 判定関数) で登録する。判定関数は「選択肢4つ(の t)」を受け取り、
# 各選択肢が「計算で確かめた正解」と一致するかの真偽 4 つを返す。真が 1 つだけで、それが k:1 の位置にあれば OK。
import json, os, re, sys, itertools, math
from fractions import Fraction
import sympy as sp
from sympy import (symbols, sqrt, Rational as R, limit, oo, solve, simplify, S, sin, cos, tan, pi, log,
                   exp, floor, Abs, Eq, nsimplify, factor, together, cancel, Matrix, Symbol, Integer)
from sympy.parsing.sympy_parser import (parse_expr, standard_transformations,
                                        implicit_multiplication_application, convert_xor)

HERE = os.path.dirname(os.path.abspath(__file__))
x, y, z, k, n, t, a, b, c, d, r, m = symbols('x y z k n t a b c d r m')
LOC = {'x': x, 'y': y, 'z': z, 'k': k, 'n': n, 't': t, 'a': a, 'b': b, 'c': c, 'd': d, 'r': r, 'm': m, 'pi': pi, 'oo': oo}
TRANS = standard_transformations + (implicit_multiplication_application, convert_xor)

CHK = {}      # id -> (desc, shown, fn)


def chk(i, desc, shown, fn):
    assert i not in CHK, 'chk が重複: ' + i
    CHK[i] = (desc, str(shown), fn)


# ---------- TeX 風の文字列を sympy の式にする ----------
def _grab(s, i):
    depth = 0
    for j in range(i, len(s)):
        if s[j] == '{':
            depth += 1
        elif s[j] == '}':
            depth -= 1
            if depth == 0:
                return s[i + 1:j], j + 1
    raise ValueError('かっこが閉じていない: ' + s)


def tex2py(s):
    s = s.replace('$', '')
    for p, q in [('\\dfrac', '\\frac'), ('\\left', ''), ('\\right', ''), ('\\times', '*'), ('\\cdot', '*'),
                 ('\\,', ''), ('\\ ', ''), ('\\!', ''), ('\\quad', ''), ('\\pi', 'pi'), ('\\infty', 'oo'),
                 ('\\log', 'log'), ('\\sin', 'sin'), ('\\cos', 'cos'), ('\\tan', 'tan'), ('\\circ', ''), ('\\mathrm', '')]:
        s = s.replace(p, q)
    while True:
        mm = re.search(r'\\frac\s*\{', s)
        if not mm:
            break
        A, j = _grab(s, mm.end() - 1)
        B, k2 = _grab(s, j)
        s = s[:mm.start()] + '((' + A + ')/(' + B + '))' + s[k2:]
    while True:
        mm = re.search(r'\\sqrt\s*\{', s)
        if not mm:
            break
        A, j = _grab(s, mm.end() - 1)
        s = s[:mm.start()] + 'sqrt(' + A + ')' + s[j:]
    while True:
        mm = re.search(r'\^\s*\{', s)
        if not mm:
            break
        A, j = _grab(s, mm.end() - 1)
        s = s[:mm.start()] + '**(' + A + ')' + s[j:]
    s = s.replace('{', '(').replace('}', ')').replace('^', '**')
    s = s.replace('−', '-').replace('＋', '+').replace('，', ',')
    return s.strip()


def T(text):
    """TeX の式 → sympy（変数は x,y,k,n,t,a,b,... の記号）"""
    return parse_expr(tex2py(text), local_dict=LOC, transformations=TRANS)


def rhs(text):
    """'y=...' のように = があれば、最後の = の右側"""
    s = text.replace('$', '')
    return s.split('=')[-1] if '=' in s else s


def same(e1, e2):
    e1, e2 = sp.sympify(e1), sp.sympify(e2)
    if e1 == e2:
        return True
    try:
        return sp.simplify(e1 - e2) == 0
    except Exception:
        return False


def chunks(text):
    """$...$ の中身のリスト"""
    return re.findall(r'\$([^$]*)\$', text)


def numchunks(text):
    """$...$ のうち、数だけのもの（記号を含まないもの）を sympy の数にして並べる"""
    out = []
    for c in chunks(text):
        try:
            e = T(c)
            if not e.free_symbols:
                out.append(e)
        except Exception:
            pass
    return out


def norm(t):
    return re.sub(r'[\s　$]|\\,|\\ |\\quad', '', t).replace('\\dfrac', '\\frac')


# ---------- 判定関数の部品 ----------
def per(f):
    """選択肢ごとに f(t) -> bool"""
    return lambda cs: [bool(f(c)) for c in cs]


def fixed(lst):
    return lambda cs: [bool(v) for v in lst]


def eqv(v):
    """選択肢の式（右辺）が v に等しい"""
    return per(lambda c: same(T(rhs(c)), v))


def txt(s):
    """選択肢の文字列が s（正規化して）と一致"""
    return per(lambda c: norm(c) == norm(s))


def numset(vals):
    """'x=3,\\ 7' のような選択肢が、集合 vals と一致"""
    vals = set(sp.sympify(v) for v in vals)

    def f(c):
        body = rhs(c.replace('$', '')).replace('、', ',')
        parts = [p for p in re.split(r',', body) if p.strip()]
        got = set()
        for p in parts:
            p = p.strip()
            if p.startswith('\\pm'):
                v = sp.nsimplify(T(p[4:]))
                got.add(v)
                got.add(-v)
            else:
                got.add(sp.nsimplify(T(p)))
        return got == vals
    return per(f)


def parse_kv(c):
    s = c.replace('$', '').replace('\\ ', ' ').replace('、', ',')
    got = {}
    for mm in re.finditer(r'([a-z])\s*=\s*(.+?)(?=,|$|\s*(?:かつ|、|［|\())', s):
        got[mm.group(1)] = T(mm.group(2).strip())
    return got


def kv(dct):
    """'a=1,\\ b=-6' のような選択肢が dct と一致"""
    def f(c):
        s = c.replace('$', '').replace('\\ ', ' ').replace('、', ',')
        got = {}
        for mm in re.finditer(r'([a-z])\s*=\s*(.+?)(?=,|$|\s*(?:かつ|、|［|\())', s):
            got[mm.group(1)] = T(mm.group(2).strip())
        return set(got) == set(dct) and all(same(got[kk], dct[kk]) for kk in dct)
    return per(f)


def pt(p, q):
    """'(a, b)' の形の座標"""
    def f(c):
        body = c.replace('$', '').replace('\\ ', ' ').replace('\\left', '').replace('\\right', '').strip()
        mm = re.fullmatch(r'\((.*)\)', body)
        if not mm:
            return False
        parts = mm.group(1).split(',')
        return len(parts) == 2 and same(T(parts[0]), p) and same(T(parts[1]), q)
    return per(f)


GRID = sorted(set([sp.Rational(i, 4) for i in range(-60, 61)] + [sp.Rational(i, 7) for i in range(-40, 41)] +
                 [sp.sqrt(2), -sp.sqrt(2), sp.sqrt(3), -sp.sqrt(3), 1 + sp.sqrt(3), 1 - sp.sqrt(3), 2 + 2 * sp.sqrt(2),
                  2 - 2 * sp.sqrt(2), sp.sqrt(5), 3 + sp.sqrt(2), 3 - sp.sqrt(2), sp.pi]), key=lambda v: float(v))


def region(truefn, var='x', grid=None):
    """選択肢が「不等式・範囲」の形。truefn(v)->bool が真の集合と、選択肢の表す集合が同じ（格子点で比べる）。
    選択肢の書き方: x\\geqq 2 / -1\\leqq x<8 / x<-1,\\ 0<x<4（カンマは「または」）/ x\\neq -2"""
    G = grid or GRID
    sym = LOC[var]
    REL = {'<=': sp.Le, '>=': sp.Ge, '<': sp.Lt, '>': sp.Gt, '!=': sp.Ne}

    def parse_part(part):
        part = (part.replace('\\geqq', '>=').replace('\\leqq', '<=').replace('\\geq', '>=')
                .replace('\\leq', '<=').replace('\\neq', '!='))
        toks = re.split(r'(<=|>=|!=|<|>)', part)
        return [T(tk) for tk in toks[0::2]], toks[1::2]

    def f(c):
        body = c.replace('$', '').replace('\\ ', ' ')
        parts = [p for p in re.split(r',|、', body) if p.strip()]
        parsed = [parse_part(p) for p in parts]

        def member(v):
            for operands, ops in parsed:
                vals = [o.subs(sym, v) for o in operands]
                if all(bool(REL[op](vals[ii], vals[ii + 1])) for ii, op in enumerate(ops)):
                    return True
            return False
        for v in G:
            if bool(member(v)) != bool(truefn(v)):
                return False
        return True
    return per(f)


def seqlim(expr, var=n):
    return limit(expr, var, oo)


# ---------- 読み込みと実行 ----------
def run(only=None):
    base = os.path.join(HERE, 'h3a')
    files = sorted(fn for fn in os.listdir(base) if fn.endswith('.json') and (only is None or fn[:-5] in only))
    total = bad = 0
    for fn in files:
        items = json.load(open(os.path.join(base, fn), encoding='utf-8'))
        print('=' * 8, fn[:-5], '=' * 8)
        for it in items:
            total += 1
            i = it['id']
            ks = [j for j, cc in enumerate(it['c']) if cc.get('k') == 1]
            if i not in CHK:
                print(f'NG  {i}  検算が登録されていない')
                bad += 1
                continue
            desc, shown, fn_ = CHK[i]
            try:
                truth = [bool(v) for v in fn_([cc['t'] for cc in it['c']])]
            except Exception as ex:
                print(f'NG  {i}  {desc}  → 計算中にエラー: {type(ex).__name__}: {ex}')
                bad += 1
                continue
            ok = (len(truth) == 4 and sum(truth) == 1 and ks == [truth.index(True)])
            mark = 'OK ' if ok else 'NG '
            if not ok:
                bad += 1
            tm = ''.join('T' if v else '.' for v in truth)
            print(f'{mark} {i}  {desc}  →  {shown}   [計算 {tm} / 正解の位置 {"ABCD"[ks[0]] if ks else "?"}]')
    extra = [i for i in CHK if only is None and not any(i.startswith(f[:-5]) for f in files)]
    print(f'\n{total} 問を検算。不一致 {bad} 問。')
    return bad


# ===================== m3a-01 分数関数とそのグラフ =====================
from sympy import Interval
from sympy.calculus.util import function_range, minimum


def _():  # L1-01 漸近線
    f = 2 / (x - 3) + 1
    va = solve(sp.denom(sp.together(f)), x)[0]
    ha = limit(f, x, oo)

    def asym(c):
        s = c.replace('$', '')
        mx = re.search(r'x=(-?\d+)', s)
        my = re.search(r'y=(-?\d+)', s)
        return int(mx.group(1)) == va and int(my.group(1)) == ha
    chk('m3a-01-L1-01', '漸近線 y=2/(x-3)+1', f'x={va}, y={ha}', per(asym))
_()


def _():  # L1-02 値域：x について解いて、解けない y を探す
    Y = symbols('Y')
    sol = solve(Eq(4 / (x - 1) - 2, Y), x)[0]
    ex = solve(sp.denom(sp.together(sol)), Y)[0]
    chk('m3a-01-L1-02', '値域（とれない y）', f'y≠{ex}',
        per(lambda c: same(T(re.search(r'\\neq\s*(.*)', c.replace('$', '')).group(1)), ex)))
_()


def _():  # L1-03 平行移動
    chk('m3a-01-L1-03', '2/x を x 軸の向きに -3、y 軸の向きに 4', '2/(x+3)+4', eqv(2 / (x - (-3)) + 4))
_()


def _():  # L1-04 対称の中心
    g = 3 / (x + 1) - 2

    def sym(c):
        body = c.replace('$', '').replace('\\ ', ' ').strip()
        mm = re.fullmatch(r'\((.*),(.*)\)', body)
        p, q = T(mm.group(1)), T(mm.group(2))
        return sp.simplify(g.subs(x, 2 * p - x) + g - 2 * q) == 0
    chk('m3a-01-L1-04', '3/(x+1)-2 の対称の中心（f(2p-x)+f(x)=2q を各選択肢で確認）', '(-1,-2)', per(sym))
_()


def _():  # L1-05
    e = sp.apart((3 * x + 5) / (x + 1))
    chk('m3a-01-L1-05', '(3x+5)/(x+1) を k/(x-p)+q に', e, eqv(e))
_()


def _():  # L2-01 平行移動の量
    def shift(c):
        nums = numchunks(c)
        p, q = nums[0], nums[1]
        return same(1 / (x - p) + q, (2 * x - 1) / (x - 1))
    chk('m3a-01-L2-01', '(2x-1)/(x-1) = 1/(x-p)+q の (p,q)', '(1,2)', per(shift))
_()


def _():  # L2-02 定義域つきの値域
    rng = function_range(4 / (x - 1), x, Interval(2, 5))
    chk('m3a-01-L2-02', 'y=4/(x-1), 2≤x≤5 の値域', rng, region(lambda v: v in rng, var='y'))
_()


def _():  # L2-03
    s = solve(sp.Eq(6 / x, x + 1), x)
    chk('m3a-01-L2-03', '6/x = x+1', s, numset(s))
_()


def _():  # L2-04
    kk = solve(2 + k / (0 + 1) - 5, k)[0]
    g = 2 + kk / (x + 1)
    chk('m3a-01-L2-04', '漸近線 x=-1,y=2、点(0,5)', sp.together(g), eqv(g))
_()


def _():  # L2-05
    rng = function_range((2 * x + 1) / (x - 1), x, Interval.open(1, oo))
    chk('m3a-01-L2-05', 'x>1 での (2x+1)/(x-1) の範囲', rng, region(lambda v: v in rng, var='y'))
_()


def _():  # L3-01 正しい記述（A 点対称 / B x→∞で∞ / C f(0)=1 / D 値域 y≠1）
    f = (2 * x + 1) / (x - 1)
    A = sp.simplify(f.subs(x, 2 - x) + f - 4) == 0
    B = (limit(f, x, oo) == oo)
    C = (f.subs(x, 0) == 1)
    D = (solve(Eq(f, 1), x) == [])      # y=1 がとれないなら「値域は y≠1」
    chk('m3a-01-L3-01', '(2x+1)/(x-1) の性質', f'対称{A}, ∞{B}, f(0)={f.subs(x, 0)}, y=1がとれない{D}', fixed([A, B, C, D]))
_()


def _():  # L3-02 食塩水
    xs = solve(Eq((10 + x) / (100 + x), R(1, 4)), x)[0]
    chk('m3a-01-L3-02', '(10+x)/(100+x)=1/4', f'{xs}g', per(lambda c: int(re.search(r'(\d+)g', c).group(1)) == xs))
_()


def _():  # L3-03
    chk('m3a-01-L3-03', '4/x > x-3', 'x<-1, 0<x<4', region(lambda v: v != 0 and bool(4 / v > v - 3)))
_()


def _():  # L3-04 4/x = -x+k の共有点が 1 個
    def ncommon(kk):
        p = sp.Poly(sp.expand(4 - x * (-x + kk)), x)
        return len(set(rt for rt in sp.real_roots(p) if rt != 0))
    ks = [kk for kk in range(-10, 11) if ncommon(kk) == 1]
    chk('m3a-01-L3-04', '共有点が 1 個になる k（整数 -10..10 を総当たり）', ks, numset(ks))
_()


def _():  # L3-05 最大・最小
    rng = function_range((x + 3) / (x + 1), x, Interval(0, 3))
    chk('m3a-01-L3-05', '(x+3)/(x+1), 0≤x≤3 の最大・最小', f'max {rng.sup} min {rng.inf}',
        per(lambda c: numchunks(c) == [rng.sup, rng.inf]))
_()


def _():  # L4-01 対称の中心が (2,3)
    def f401(c):
        d_ = parse_kv(c)
        g = (d_['a'] * x + 1) / (x + d_['b'])
        return sp.simplify(g.subs(x, 4 - x) + g - 6) == 0 and d_['a'] * d_['b'] != 1
    chk('m3a-01-L4-01', '(ax+1)/(x+b) が (2,3) に関して点対称（各選択肢で確認）', 'a=3,b=-2', per(f401))
_()


def _():  # L4-02 格子点の数
    pts = [(xx, xx // (xx - 2)) for xx in range(-2000, 2001) if xx != 2 and (xx % (xx - 2) == 0)]
    chk('m3a-01-L4-02', 'y=x/(x-2) 上の格子点を総当たり', f'{len(pts)}個 {pts}',
        per(lambda c: int(re.search(r'(\d+)個', c).group(1)) == len(pts)))
_()


def _():  # L4-03 最小値
    mn = minimum(x**2 / (x - 1), x, Interval.open(1, oo))
    chk('m3a-01-L4-03', 'x>1 での x²/(x-1) の最小値', mn, eqv(mn))
_()


def _():  # L4-04 異なる 2 実数解をもつ k（解の個数を直接数える）
    def nsol(kk):
        p = sp.Poly(sp.expand((x + 1) - (-x + kk) * (x - 1)), x)
        disc = sp.discriminant(p.as_expr(), x)
        nr = 2 if disc > 0 else (1 if disc == 0 else 0)
        return nr - (1 if p.as_expr().subs(x, 1) == 0 else 0)
    chk('m3a-01-L4-04', '(x+1)/(x-1) = -x+k の実数解が 2 個になる k', 'k<2-2√2 または 2+2√2<k',
        region(lambda v: nsol(v) == 2, var='k'))
_()


def _():  # L4-05 距離の積
    t_ = symbols('t', real=True)
    prod = sp.Abs(t_ + 2) * sp.Abs(6 / (t_ + 2) - 1 + 1)
    vals = set(sp.simplify(prod.subs(t_, vv)) for vv in [1, 2, 3, -5, R(1, 2), -R(7, 3)])
    chk('m3a-01-L4-05', '漸近線までの距離の積（t を変えて確認）', vals, per(lambda c: len(vals) == 1 and same(T(c), list(vals)[0])))
_()


# ===================== m3a-02 無理関数とそのグラフ =====================
def _():  # L1-01 定義域
    chk('m3a-02-L1-01', 'y=√(3x-6) の定義域（3x-6≥0）', 'x≥2', region(lambda v: 3 * v - 6 >= 0))
_()


def _():  # L1-02 値域
    rng = function_range(sqrt(x - 1) + 2, x, Interval(1, oo))
    chk('m3a-02-L1-02', 'y=√(x-1)+2 の値域', rng, region(lambda v: v in rng, var='y'))
_()


def _():  # L1-03
    chk('m3a-02-L1-03', '√x を x 軸の向きに -2、y 軸の向きに 3', '√(x+2)+3', eqv(sqrt(x - (-2)) + 3))
_()


def _():  # L1-04 変換のあとの曲線が y=√(-x) になるか
    def f(c):
        c = c.replace('$', '')
        s_vals = [R(0), R(1), R(2), R(3), R(9, 4), R(11, 2)]
        if 'x 軸' in c:
            tr = lambda s: (s, -sqrt(s))
        elif 'y 軸' in c:
            tr = lambda s: (-s, sqrt(s))
        elif '原点' in c:
            tr = lambda s: (-s, -sqrt(s))
        elif '直線' in c:
            tr = lambda s: (sqrt(s), s)
        else:
            raise ValueError(c)
        for s_ in s_vals:
            X, Y = tr(s_)
            if X > 0 or sp.simplify(Y - sqrt(-X)) != 0:
                return False
        return True
    chk('m3a-02-L1-04', 'y=√x の点を各変換で移して y=√(-x) 上にのるか', 'y 軸に関して対称', per(f))
_()


def _():  # L1-05
    sols = [s_ for s_ in solve(sqrt(x + 1) - 3, x)]
    chk('m3a-02-L1-05', '√(x+1)=3', sols, numset(sols))
_()


def _():  # L2-01
    rng = function_range(-sqrt(2 * x - 4) + 1, x, Interval(2, oo))
    chk('m3a-02-L2-01', 'y=-√(2x-4)+1 の値域', rng, region(lambda v: v in rng, var='y'))
_()


def _():  # L2-02
    rng = function_range(sqrt(x + 3), x, Interval(1, 6))
    chk('m3a-02-L2-02', 'y=√(x+3), 1≤x≤6 の値域', rng, region(lambda v: v in rng, var='y'))
_()


def _():  # L2-03 2乗して出した候補を、もとの式に代入して確かめる
    cands = solve(x + 6 - x**2, x)
    sols = [c_ for c_ in cands if sp.simplify(sqrt(c_ + 6) - c_) == 0]
    chk('m3a-02-L2-03', '√(x+6)=x（候補 %s → 確かめて）' % cands, sols, numset(sols))
_()


def _():  # L2-04
    sols = [a_ for a_ in solve(sqrt(a * 4) + 1 - 5, a)]
    chk('m3a-02-L2-04', '点(6,5)を通る√(a(x-2))+1 の a', sols, numset(sols))
_()


def _():  # L2-05
    chk('m3a-02-L2-05', '√(x+1)<3', '-1≤x<8', region(lambda v: v >= -1 and bool(sqrt(v + 1) < 3)))
_()


def _():  # L3-01 y=√(4-x) の性質（A 定義域 x≥4 / B 値域 y≤0 / C 増加 / D 対称移動＋平行移動）
    f = sqrt(4 - x)
    A = sp.solveset(4 - x >= 0, x, S.Reals) == Interval(4, oo)
    B = function_range(f, x, Interval(-oo, 4)) == Interval(-oo, 0)
    C = bool(f.subs(x, 0) < f.subs(x, 1))          # 増加なら f(0)<f(1)
    g = sqrt(-x)                                    # y 軸に関して対称
    D = sp.simplify(g.subs(x, x - 4) - f) == 0      # さらに x 軸の向きに 4 平行移動
    chk('m3a-02-L3-01', '√(4-x) の性質', f'定義域x≥4:{A} 値域y≤0:{B} 増加:{C} 対称+移動:{D}', fixed([A, B, C, D]))
_()


def _():  # L3-02 √(x-1) = -x+k の共有点
    def ncommon(k0):
        cands = solve(x - 1 - (k0 - x) ** 2, x)
        ok = set()
        for c_ in cands:
            xv = complex(sp.N(c_, 30))
            if abs(xv.imag) > 1e-12:
                continue
            xv = xv.real
            if xv >= 1 - 1e-12 and (float(k0) - xv) >= -1e-12 and abs(math.sqrt(max(xv - 1, 0)) - (float(k0) - xv)) < 1e-9:
                ok.add(round(xv, 8))
        return len(ok)
    chk('m3a-02-L3-02', '√(x-1)=-x+k が共有点をもつ k', 'k≥1', region(lambda v: ncommon(v) >= 1, var='k'))
_()


def _():  # L3-03
    chk('m3a-02-L3-03', '√(x+2)>x', '-2≤x<2', region(lambda v: v >= -2 and bool(sqrt(v + 2) > v)))
_()


def _():  # L3-04
    l_ = solve(2 * sqrt(symbols('l', positive=True)) - 3, symbols('l', positive=True))
    chk('m3a-02-L3-04', '2√l=3', l_, per(lambda c: numchunks(c)[0] == l_[0]))
_()


def _():  # L3-05
    rng = function_range(-sqrt(x + 1) + 3, x, Interval(0, 8))
    chk('m3a-02-L3-05', '-√(x+1)+3, 0≤x≤8 の最大・最小', f'max {rng.sup} min {rng.inf}',
        per(lambda c: numchunks(c) == [rng.sup, rng.inf]))
_()


def _():  # L4-01
    mx = sp.maximum(sqrt(2 * x + 1) - x, x, Interval(-R(1, 2), oo))
    xs = [R(i, 100) for i in range(-50, 400)]
    num = max(sqrt(2 * v + 1) - v for v in xs)          # 数値でも確認
    assert abs(float(num) - float(mx)) < 1e-3, (num, mx)
    chk('m3a-02-L4-01', '√(2x+1)-x の最大値', mx, eqv(mx))
_()


def _():  # L4-02 √(x+1)=x+k が異なる 2 点
    def ncommon(k0):
        cands = solve(x + 1 - (x + k0) ** 2, x)
        ok = set()
        for c_ in cands:
            xv = complex(sp.N(c_, 30))
            if abs(xv.imag) > 1e-12:
                continue
            xv = xv.real
            if xv >= -1 - 1e-12 and (xv + float(k0)) >= -1e-12 and abs(math.sqrt(max(xv + 1, 0)) - (xv + float(k0))) < 1e-9:
                ok.add(round(xv, 7))
        return len(ok)
    chk('m3a-02-L4-02', '√(x+1)=x+k が異なる 2 点で交わる k', '1≤k<5/4', region(lambda v: ncommon(v) == 2, var='k'))
_()


def _():  # L4-03
    cands = solve(sqrt(x) + sqrt(x + 3) - 3, x)
    cands = [c_ for c_ in cands if abs(sp.N(sqrt(c_) + sqrt(c_ + 3) - 3)) < 1e-12]
    # 参考：x を細かく動かして総当たり
    xs = [R(i, 100) for i in range(0, 1000)]
    brute = [v for v in xs if abs(float(sqrt(v) + sqrt(v + 3)) - 3) < 1e-9]

    def f(c):
        if '解なし' in c:
            return cands == []
        return numset(cands)([c])[0] if cands else False
    chk('m3a-02-L4-03', '√x+√(x+3)=3', f'{cands} 総当たり{brute}', per(f))
_()


def _():  # L4-04 a>0 で、値域が [1,3] になる (a,b)
    def f(c):
        d_ = parse_kv(c)
        a_, b_ = d_['a'], d_['b']
        if a_ <= 0 or 5 * a_ + b_ < 0 or a_ + b_ < 0:
            return False
        return sp.simplify(sqrt(a_ + b_) - 1) == 0 and sp.simplify(sqrt(5 * a_ + b_) - 3) == 0
    chk('m3a-02-L4-04', 'a>0, √(ax+b) (1≤x≤5) の値域が [1,3]', 'a=2,b=-1', per(f))
_()


def _():  # L4-05 接線の傾き（微分で接点を求めて確かめる）
    x0 = symbols('x0', positive=True)
    slope = sp.diff(sqrt(2 * x), x).subs(x, x0)
    s0 = solve(sqrt(2 * x0) - slope * (x0 + 1), x0)
    m_ = sp.simplify(slope.subs(x0, s0[0]))
    chk('m3a-02-L4-05', '(-1,0) から y=√(2x) に引いた接線の傾き（接点 x0=%s）' % s0, m_, eqv(m_))
_()


# ===================== m3a-03 逆関数と合成関数 =====================
def _inverse(f_expr):
    """y=f(x) を x について解いて、x と y を入れかえた式（x の式）"""
    sol = solve(Eq(y, f_expr), x)
    assert len(sol) == 1, sol
    return sp.simplify(sol[0].subs(y, x))


def _():  # L1-01
    inv = _inverse(2 * x - 3)
    chk('m3a-03-L1-01', 'f(x)=2x-3 の逆関数', inv, eqv(inv))
_()


def _():  # L1-02
    v = solve(3 * x + 1 - 7, x)[0]
    chk('m3a-03-L1-02', 'f(x)=3x+1, f^{-1}(7)', v, eqv(v))
_()


def _():  # L1-03 点 (a, b) が f 上のとき、(b,a) が f^{-1} 上。各直線に関して反転した点が逆関数上にのるかを調べる
    f = 2 * x + 1
    inv = _inverse(f)

    def check(c):
        c = c.replace('$', '')
        a_ = symbols('a_')
        P = (a_, f.subs(x, a_))
        if '直線y=x' in c.replace(' ', ''):
            Q = (P[1], P[0])
        elif '直線y=-x' in c.replace(' ', ''):
            Q = (-P[1], -P[0])
        elif 'x軸' in c.replace(' ', ''):
            Q = (P[0], -P[1])
        elif 'y軸' in c.replace(' ', ''):
            Q = (-P[0], P[1])
        else:
            raise ValueError(c)
        return sp.simplify(inv.subs(x, Q[0]) - Q[1]) == 0
    chk('m3a-03-L1-03', 'f と f^{-1} は y=x に関して対称（f=2x+1 の例で各直線を確認）', 'y=x', per(check))
_()


def _():  # L1-04
    f, g = x + 2, 3 * x
    e = sp.expand(g.subs(x, f))
    chk('m3a-03-L1-04', 'g(f(x))', e, eqv(e))
_()


def _():  # L1-05
    f = lambda t: t**2
    g = lambda t: t - 1
    v = f(g(3))
    chk('m3a-03-L1-05', 'f(g(3))', v, eqv(v))
_()


def _():  # L2-01
    inv = _inverse(2 * x / (x + 1))
    chk('m3a-03-L2-01', 'f=2x/(x+1) の逆関数', inv, eqv(inv))
_()


def _():  # L2-02 逆関数の式と定義域（定義域＝もとの値域）
    f = sqrt(x - 1)
    rng = function_range(f, x, Interval(1, oo))
    inv = x**2 + 1
    # もとの関数の式を逆関数に通して x に戻るか（定義域上で）
    assert all(sp.simplify(inv.subs(x, f.subs(x, v)) - v) == 0 for v in [1, 2, 5, R(7, 3)])

    def f_(c):
        s = c.replace('$', '')
        m = re.match(r'f\^\{-1\}\(x\)=(.*?)\\ \((.*)\)$', s)
        expr = T(m.group(1))
        dom = m.group(2)
        return same(expr, inv) and region(lambda v: v in rng)(['$' + dom + '$'])[0]
    chk('m3a-03-L2-02', 'f=√(x-1) の逆関数と定義域（値域=%s）' % rng, 'x^2+1 (x≥0)', per(f_))
_()


def _():  # L2-03
    v = solve(Eq((2 * x + 1) / (x - 1), 3), x)[0]
    chk('m3a-03-L2-03', 'f(x)=3 を解く（f^{-1}(3)）', v, eqv(v))
_()


def _():  # L2-04
    e = sp.expand((2 * x + 1) ** 2)
    chk('m3a-03-L2-04', 'g(f(x)) = (2x+1)^2', e, eqv(e))
_()


def _():  # L2-05
    sols = solve(((x - 3) ** 2 - 4 * (x - 3)), x)
    chk('m3a-03-L2-05', 'g(f(x))=0', sols, numset(sols))
_()


def _():  # L3-01 f=x^2-2x (x>=1)
    f = x**2 - 2 * x
    rng = function_range(f, x, Interval(1, oo))
    inv = 1 + sqrt(x + 1)
    assert all(sp.simplify(f.subs(x, inv.subs(x, v)) - v) == 0 for v in [-1, 0, 3, R(5, 4)])  # f(f^{-1}(v)) = v
    assert all(inv.subs(x, v) >= 1 for v in [-1, 0, 3])
    A = (rng == Interval(-1, oo))
    alt = 1 - sqrt(x + 1)
    B = all(alt.subs(x, v) >= 1 for v in [-1, 0, 3])      # もし逆関数なら値が 1 以上のはず
    C = (rng == Interval(1, oo))
    D = (inv.subs(x, 0) == 0)
    chk('m3a-03-L3-01', 'f=x²-2x (x≥1) の逆関数', f'逆関数 1+√(x+1)、値域 {rng}。A:{A} B:{B} C:{C} D:{D}', fixed([A, B, C, D]))
_()


def _():  # L3-02
    chk('m3a-03-L3-02', 'f(g(x))=√(3-2x) の定義域', 'x≤3/2', region(lambda v: 3 - 2 * v >= 0))
_()


def _():  # L3-03
    def f_(c):
        d_ = parse_kv(c)
        h = lambda t: d_['a'] * t + d_['b']
        # f^{-1}(5)=1 ⇔ f(1)=5、f^{-1}(-1)=-2 ⇔ f(-2)=-1
        return sp.simplify(h(1) - 5) == 0 and sp.simplify(h(-2) + 1) == 0
    chk('m3a-03-L3-03', 'f^{-1}(5)=1, f^{-1}(-1)=-2 → f(1)=5, f(-2)=-1', 'a=2,b=3', per(f_))
_()


def _():  # L3-04
    f = lambda t: t / (t + 1)
    e = sp.simplify(f(f(x)))
    chk('m3a-03-L3-04', 'f(f(x))', e, eqv(e))
_()


def _():  # L3-05 g(f(x)) = 4x²-2x, f=2x-1
    f = 2 * x - 1
    inv = _inverse(f)
    g = sp.expand((4 * x**2 - 2 * x).subs(x, inv))
    assert sp.simplify(g.subs(x, f) - (4 * x**2 - 2 * x)) == 0
    chk('m3a-03-L3-05', 'g(2x-1)=4x²-2x となる g', g, eqv(g))
_()


def _():  # L4-01 f の逆関数が f 自身になる a
    def f_(c):
        a_ = sp.nsimplify(T(rhs(c)))
        f = (a_ * x + 2) / (x - 3)
        if sp.simplify(f.diff(x)) == 0:
            return False
        inv = _inverse(f)
        return sp.simplify(inv - f) == 0
    chk('m3a-03-L4-01', 'f=(ax+2)/(x-3) の逆関数が f 自身', 'a=3', per(f_))
_()


def _():  # L4-02 √(x+2) とその逆関数 x²-2 (x≥0) の共有点
    inv = x**2 - 2
    cands = solve(sqrt(x + 2) - x, x)
    pts = [(c_, sqrt(c_ + 2)) for c_ in cands if c_ >= 0]
    # 参考：f と f^{-1} の共有点を直接（x≥0 の範囲で）確かめる
    chk_pts = [(v, sqrt(v + 2)) for v in [R(i, 8) for i in range(0, 80)] if sp.simplify(sqrt(v + 2) - inv.subs(x, v)) == 0]

    def f_(c):
        s = c.replace('$', '').replace('\\ ', ' ')
        found = re.findall(r'\(([^()]*),([^()]*)\)', s)
        got = set((sp.nsimplify(T(p)), sp.nsimplify(T(q))) for p, q in found)
        # 各点が f と f^{-1} の両方のグラフ上にあるか（逆関数は x≥0 が定義域）
        okset = all((q == sqrt(p + 2)) and (p >= 0) and (q == inv.subs(x, p)) for p, q in got)
        return okset and got == set((sp.nsimplify(p), sp.nsimplify(q)) for p, q in pts)
    chk('m3a-03-L4-02', '√(x+2) と x²-2 (x≥0) の共有点', f'{pts} 総当たり{chk_pts}', per(f_))
_()


def _():  # L4-03
    f = lambda t: t**2 - 3 * t
    poly = sp.Poly(sp.expand(f(f(x)) - x), x)
    nreal = len(set(sp.real_roots(poly)))
    chk('m3a-03-L4-03', 'f(f(x))=x の実数解の個数', f'{nreal}個 {sp.factor(poly.as_expr())}',
        per(lambda c: int(re.search(r'(\d+)個', c).group(1)) == nreal))
_()


def _():  # L4-04 x≥a で f(x)=x²-4x が 1 対 1 になる a（細かい格子で総当たり）
    f = lambda t: t**2 - 4 * t

    def injective(a_):
        a_ = sp.nsimplify(a_)
        pts = [a_ + R(i, 64) for i in range(0, 64 * 8)]
        seen = {}
        for v in pts:
            val = f(v)
            if val in seen:
                return False
            seen[val] = v
        return True
    chk('m3a-03-L4-04', 'x≥a で f=x²-4x が 1 対 1', 'a≥2',
        region(lambda v: injective(v), var='a', grid=[R(i, 4) for i in range(-8, 17)]))
_()


def _():  # L4-05 g(f(x))=f(g(x)) がすべての x で成り立つ (a,b)
    f = x + 2
    g = a * x + b
    diff = sp.expand(g.subs(x, f) - f.subs(x, g))
    eqs = sp.Poly(diff, x).coeffs()
    sol = solve(eqs, [a, b], dict=True)        # [{a: 1}]（b は自由）
    A = (sol == [{a: 1}])
    B = False   # a=1,b=0 だけ：b が自由なので、解全体ではない
    C = (sol == [{a: 2}])
    D = (sol == [{b: 0}])
    chk('m3a-03-L4-05', 'g∘f=f∘g の解全体', f'{sol}（b は自由）', fixed([A, B, C, D]))
_()


# ===================== m3a-04 数列の極限 =====================
N_ = symbols('n', integer=True, positive=True)   # 数列の n（正の整数）


def _lim(expr):
    return limit(expr, N_, oo)


def _():
    L = _lim(3 + 2 / N_)
    chk('m3a-04-L1-01', 'lim (3+2/n)', L, eqv(L))
_()


def _():
    L = _lim((2 * N_ + 1) / (N_ + 3))
    chk('m3a-04-L1-02', 'lim (2n+1)/(n+3)', L, eqv(L))
_()


def _():  # L1-03 lim (n²-3n) = ∞（選択肢は言葉）
    L = _lim(N_**2 - 3 * N_)

    def f(c):
        s = c.replace('$', '').replace(' ', '')
        if s.startswith('正の無限大'):
            return L == oo
        if s.startswith('負の無限大'):
            return L == -oo
        m_ = re.match(r'(-?\d+)に収束', s)
        if m_:
            return L == int(m_.group(1))
        raise ValueError(c)
    chk('m3a-04-L1-03', 'lim (n²-3n)', L, per(f))
_()


def _():  # L1-04 (-1)^n：偶数番目と奇数番目で極限がちがう → 極限なし
    mm = symbols('m', integer=True, positive=True)
    ev = limit((-1) ** (2 * mm), mm, oo)
    od = limit((-1) ** (2 * mm + 1), mm, oo)
    exists = (ev == od)

    def f(c):
        s = c.replace('$', '').replace(' ', '')
        if s.startswith('収束しない'):
            return not exists
        m_ = re.match(r'(-?\d+)に収束', s)
        if m_:
            return exists and ev == int(m_.group(1))
        raise ValueError(c)
    chk('m3a-04-L1-04', '(-1)^n の極限（偶数番目 %s、奇数番目 %s）' % (ev, od), '収束しない', per(f))
_()


def _():  # L1-05
    a_, b_ = 3, -2
    v = R(a_ + 2 * b_, a_ * b_)
    chk('m3a-04-L1-05', '(a+2b)/(ab) の極限', v, eqv(v))
_()


def _():
    L = _lim((3 * N_**2 - N_ + 1) / (2 * N_**2 + 5))
    chk('m3a-04-L2-01', 'lim (3n²-n+1)/(2n²+5)', L, eqv(L))
_()


def _():
    L = _lim((2 * N_ + 1) * (N_ - 3) / (N_**2 + 4))
    chk('m3a-04-L2-02', 'lim (2n+1)(n-3)/(n²+4)', L, eqv(L))
_()


def _():
    L = _lim(sqrt(N_**2 + N_) - N_)
    chk('m3a-04-L2-03', 'lim (√(n²+n)-n)', L, eqv(L))
_()


def _():
    kk = symbols('k', integer=True, positive=True)
    S_ = sp.summation(kk, (kk, 1, N_))
    L = _lim(S_ / N_**2)
    chk('m3a-04-L2-04', 'lim (1+2+…+n)/n²', L, eqv(L))
_()


def _():  # L2-05 sin n / n：数値でも確認（n=10^5, 10^6）
    L = _lim(sin(N_) / N_)
    num = [abs(math.sin(nn) / nn) for nn in (10**3, 10**5, 10**6)]
    chk('m3a-04-L2-05', 'lim sin n / n（数値 %s）' % [f'{v:.1e}' for v in num], L, eqv(L))
_()


def _():  # L3-01 正しい記述
    a_n = 2 * N_
    b_n = N_
    A = (_lim(a_n - b_n) == 0)                 # 反例 a=2n, b=n で ∞（0 ではない）→ 「いつでも 0」は偽
    # B：a_n=(-1)^n/n → 0、1/a_n=(-1)^n n は ∞ に発散しない（偶数番目 ∞、奇数番目 -∞）
    mm = symbols('m', integer=True, positive=True)
    ev = limit(1 / ((-1) ** (2 * mm) / (2 * mm)), mm, oo)
    od = limit(1 / ((-1) ** (2 * mm + 1) / (2 * mm + 1)), mm, oo)
    B = (ev == oo and od == oo)                # 本当に「いつでも ∞」なら真だが、od=-∞ なので偽
    # C：a=1, b=1/n：積→0 だが a→1
    C = (_lim(1 * (1 / N_)) == 0 and _lim(sp.Integer(1)) == 0)
    # D：極限の性質（積の極限）。例で確認：a_n=2+1/n、√n/(n+√n)+5 など
    ex = [2 + 1 / N_, 5 - 3 / N_**2, -1 + sqrt(N_) / (N_ + sqrt(N_))]
    D = all(sp.simplify(_lim(e_**2) - _lim(e_) ** 2) == 0 for e_ in ex)
    chk('m3a-04-L3-01', '極限の性質（A:%s B:%s C:%s D:%s）' % (A, B, C, D), 'a_n→α ⇒ a_n²→α²', fixed([A, B, C, D]))
_()


def _():
    L = _lim(sqrt(N_**2 + 3 * N_) - sqrt(N_**2 + N_))
    chk('m3a-04-L3-02', 'lim (√(n²+3n)-√(n²+n))', L, eqv(L))
_()


def _():
    aa = symbols('a', positive=True)
    Lg = limit(sqrt(N_**2 + aa * N_) - N_, N_, oo)    # = a/2
    sol = solve(Eq(Lg, 3), aa)
    chk('m3a-04-L3-03', 'lim (√(n²+an)-n)=3（極限 %s）' % Lg, sol, numset(sol))
_()


def _():
    L = _lim((sqrt(4 * N_**2 + 1) + N_) / (3 * N_ - 2))
    chk('m3a-04-L3-04', 'lim (√(4n²+1)+n)/(3n-2)', L, eqv(L))
_()


def _():  # L3-05 a_n/n→2 となる数列をいくつか使って確かめる
    outs = set()
    for an in [2 * N_ + 7, 2 * N_ + sqrt(N_), 2 * N_ - 1 / N_, 2 * N_ + sp.log(N_)]:
        assert _lim(an / N_) == 2
        outs.add(_lim((an + 3 * N_) / (2 * an - N_)))
    assert len(outs) == 1, outs
    v = list(outs)[0]
    chk('m3a-04-L3-05', 'a_n/n→2 のとき lim (a_n+3n)/(2a_n-n)', v, eqv(v))
_()


def _():
    kk = symbols('k', integer=True, positive=True)
    L = _lim(sp.summation(kk**2, (kk, 1, N_)) / N_**3)
    chk('m3a-04-L4-01', 'lim (1²+…+n²)/n³', L, eqv(L))
_()


def _():  # L4-02 数値で確認（和を直接足す）。はさみうちの上下の評価も確認
    def S(nn):
        return sum(Fraction(k_, nn * nn + k_) for k_ in range(1, nn + 1))
    vals = [float(S(nn)) for nn in (100, 1000, 5000)]
    for nn in (100, 1000):
        lo = Fraction(nn * (nn + 1), 2 * (nn * nn + nn))
        hi = Fraction(nn * (nn + 1), 2 * (nn * nn + 1))
        assert lo <= S(nn) <= hi
    assert abs(vals[-1] - 0.5) < 2e-3, vals
    chk('m3a-04-L4-02', '和の極限（n=100,1000,5000 で %s）' % [round(v, 5) for v in vals], R(1, 2), eqv(R(1, 2)))
_()


def _():
    L = _lim((sqrt(N_**2 + N_) - N_) / (sqrt(N_**2 + 2 * N_) - N_))
    chk('m3a-04-L4-03', 'lim (√(n²+n)-n)/(√(n²+2n)-n)', L, eqv(L))
_()


def _():
    outs = set()
    for an in [2 * N_ + 3, 2 * N_ + 3 + 1 / N_, 2 * N_ + 3 - sqrt(N_) / N_]:
        assert _lim(an - 2 * N_) == 3
        outs.add(_lim(an / N_))
    assert len(outs) == 1
    v = list(outs)[0]
    chk('m3a-04-L4-04', 'a_n-2n→3 のとき lim a_n/n', v, eqv(v))
_()


def _():  # L4-05 各選択肢の (a,b) で極限が 1 になるか
    def f(c):
        d_ = parse_kv(c)
        a_, b_ = d_['a'], d_['b']
        if a_ <= 0 or b_ <= 0:
            return False
        Lm = limit(sqrt(N_**2 + a_ * N_ + 1) - b_ * N_, N_, oo)
        return Lm == 1
    chk('m3a-04-L4-05', 'lim (√(n²+an+1)-bn)=1', 'a=2,b=1', per(f))
_()


# ===================== m3a-05 無限等比数列 r^n の極限 =====================
M_ = symbols('m', integer=True, positive=True)


def _words_lim(L_exists, ev=None, od=None, L=None):
    """'正の無限大に発散する' '負の無限大に発散する' '収束しない（振動する）' 'c に収束する' の言葉の選択肢を判定する関数をつくる"""
    def f(c):
        s = c.replace('$', '').replace(' ', '')
        if s.startswith('正の無限大'):
            return L_exists and L == oo
        if s.startswith('負の無限大'):
            return L_exists and L == -oo
        if s.startswith('収束しない') and '振動' in s:       # 「振動する」は、極限が存在しない場合だけ
            return not L_exists
        if s.startswith('収束しない'):
            return not (L_exists and L not in (oo, -oo))
        mm = re.match(r'(.+?)に収束', s)
        if mm:
            return L_exists and L not in (oo, -oo) and same(T(mm.group(1)), L)
        raise ValueError(c)
    return f


def _seqlim_r(rv, shift=0):
    """r^n の極限（偶数番目・奇数番目の極限が一致するか）→ (存在するか, 極限)"""
    ev = limit(rv ** (2 * M_), M_, oo)
    od = limit(rv ** (2 * M_ + 1), M_, oo)
    return (ev == od), ev


def _():  # L1-01
    L = limit(R(1, 3) ** N_, N_, oo)
    chk('m3a-05-L1-01', 'lim (1/3)^n', L, eqv(L))
_()


def _():  # L1-02 (-3)^n
    ex, L = _seqlim_r(-3)
    chk('m3a-05-L1-02', 'lim (-3)^n（偶数番目 %s・奇数番目 %s）' % (limit((-3) ** (2 * M_), M_, oo), limit((-3) ** (2 * M_ + 1), M_, oo)),
        '収束しない', per(_words_lim(ex, L=L)))
_()


def _():  # L1-03 r^n が収束する r の範囲（格子点で、偶数番目・奇数番目の極限が一致する有限値かを調べる）
    def conv(rv):
        ex, L = _seqlim_r(rv)
        return ex and L not in (oo, -oo)
    G = [R(i, 4) for i in range(-12, 13)]
    chk('m3a-05-L1-03', '{r^n} が収束する r', '-1<r≤1', region(conv, var='r', grid=G))
_()


def _():  # L1-04 (3/2)^n
    L = limit(R(3, 2) ** N_, N_, oo)
    chk('m3a-05-L1-04', 'lim (3/2)^n', L, per(_words_lim(True, L=L)))
_()


def _():  # L1-05 初項 3、公比 -1/2
    an = 3 * R(-1, 2) ** (N_ - 1)
    ev_ = limit(an.subs(N_, 2 * M_), M_, oo)        # 偶数番目の項の極限
    od_ = limit(an.subs(N_, 2 * M_ + 1), M_, oo)    # 奇数番目の項の極限
    ex = (ev_ == od_)
    L = ev_

    def f(c):
        if '収束しない' in c:
            return not ex
        return ex and same(T(c), L)
    chk('m3a-05-L1-05', '3(-1/2)^{n-1} の極限', L, per(f))
_()


def _():
    L = limit((3**N_ + 1) / (2 * 3**N_ - 1), N_, oo)
    chk('m3a-05-L2-01', 'lim (3^n+1)/(2·3^n-1)', L, eqv(L))
_()


def _():
    L = limit((2 ** (N_ + 1) - 3**N_) / (3 ** (N_ + 1) + 2**N_), N_, oo)
    chk('m3a-05-L2-02', 'lim (2^{n+1}-3^n)/(3^{n+1}+2^n)', L, eqv(L))
_()


def _():  # L2-03：発散する（収束しない）か、-1 に収束するかを区別する
    L = limit((2**N_ - 3**N_) / (2**N_ + 3**N_), N_, oo)

    def f(c):
        if '収束しない' in c:
            return False
        return same(T(c), L)
    chk('m3a-05-L2-03', 'lim (2^n-3^n)/(2^n+3^n)', L, per(f))
_()


def _():
    L = limit(3**N_ - 2**N_, N_, oo)
    chk('m3a-05-L2-04', 'lim (3^n-2^n)', L, per(_words_lim(True, L=L)))
_()


def _():  # L2-05 {(x-1)^n} が収束する x
    def conv(xv):
        rv = xv - 1
        ex, L = _seqlim_r(rv)
        return ex and L not in (oo, -oo)
    G = [R(i, 4) for i in range(-8, 17)]
    chk('m3a-05-L2-05', '{(x-1)^n} が収束する x', '0<x≤2', region(conv, var='x', grid=G))
_()


def _():  # L3-01 正しい記述（A:3^n/2^n→0 B:(-0.9)^n は収束しない C:(-1)^n/n→0 D:(2/3)^n·3^n→0）
    A = (limit(3**N_ / 2**N_, N_, oo) == 0)
    ex, L = _seqlim_r(R(-9, 10))
    B = not (ex and L not in (oo, -oo))
    ev = limit(((-1) ** (2 * M_)) / (2 * M_), M_, oo)
    od = limit(((-1) ** (2 * M_ + 1)) / (2 * M_ + 1), M_, oo)
    C = (ev == 0 and od == 0)
    D = (limit(R(2, 3) ** N_ * 3**N_, N_, oo) == 0)
    chk('m3a-05-L3-01', '極限の記述（A:%s B:%s C:%s D:%s）' % (A, B, C, D), '(-1)^n/n → 0', fixed([A, B, C, D]))
_()


def _():  # L3-02 a_1=3, a_{n+1}=3a_n-4
    a = [3]
    for _i in range(40):
        a.append(3 * a[-1] - 4)
    assert all(a[i] == 2 + 3**i for i in range(len(a)))
    L = limit(2 + 3 ** (N_ - 1), N_, oo)
    chk('m3a-05-L3-02', 'a_n=2+3^{n-1}（項を並べて確認 %s…）' % a[:5], L, per(_words_lim(True, L=L)))
_()


def _():
    L = limit((2 ** (N_ + 1) + 3 ** (N_ - 1)) / (3**N_ - 2**N_), N_, oo)
    chk('m3a-05-L3-03', 'lim (2^{n+1}+3^{n-1})/(3^n-2^n)', L, eqv(L))
_()


def _():  # L3-04 r^n/(1+r^n) （A: r>1 → 0 / B: 0<r<1 → 1 / C: r=1 で収束しない / D: r=1 → 1/2）
    f = lambda rv: limit(rv**N_ / (1 + rv**N_), N_, oo)
    vals = {rv: f(rv) for rv in [R(3, 2), 2, 5, R(1, 3), R(1, 2), R(9, 10), 1]}
    A = all(vals[rv] == 0 for rv in [R(3, 2), 2, 5])
    B = all(vals[rv] == 1 for rv in [R(1, 3), R(1, 2), R(9, 10)])
    C = (vals[1] in (oo, -oo)) or (vals[1] is S.NaN)
    D = (vals[1] == R(1, 2))
    chk('m3a-05-L3-04', 'r^n/(1+r^n)：%s' % {str(k_): str(v_) for k_, v_ in vals.items()}, 'r=1 で 1/2', fixed([A, B, C, D]))
_()


def _():  # L3-05 a_{n+1}=0.8a_n+10, a_0=100 を Fraction で十分先まで
    a = Fraction(100)
    for _i in range(300):
        a = Fraction(4, 5) * a + 10
    assert abs(a - 50) < Fraction(1, 10**20)
    chk('m3a-05-L3-05', '漸化式を 300 回くり返した値 ≒ %s' % float(a), 50, per(lambda c: int(re.search(r'(\d+)L', c).group(1)) == 50))
_()


def _():  # L4-01
    f = lambda rv: limit((rv ** (N_ + 1) + 1) / (rv**N_ + 1), N_, oo)
    v = f(2) + f(R(1, 2))
    chk('m3a-05-L4-01', 'f(2)+f(1/2)（f(2)=%s, f(1/2)=%s）' % (f(2), f(R(1, 2))), v, eqv(v))
_()


def _():  # L4-02 f(x)=-1 となる x の範囲
    def fx(xv):
        return limit((xv ** (2 * N_) - 1) / (xv ** (2 * N_) + 1), N_, oo)
    G = [R(i, 4) for i in range(-12, 13)]
    chk('m3a-05-L4-02', 'lim (x^{2n}-1)/(x^{2n}+1) = -1', '-1<x<1', region(lambda v: fx(v) == -1, grid=G))
_()


def _():
    L = limit(sqrt(4**N_ + 2**N_) - 2**N_, N_, oo)
    chk('m3a-05-L4-03', 'lim (√(4^n+2^n)-2^n)', L, eqv(L))
_()


def _():
    assert all(2**nn >= nn * (nn - 1) * (nn - 2) // 6 for nn in range(3, 200))   # 与えられた不等式
    L = limit(N_**2 / 2**N_, N_, oo)
    chk('m3a-05-L4-04', 'lim n²/2^n（不等式を n=3..199 で確認）', L, eqv(L))
_()


def _():  # L4-05 a_{n+1}=r a_n+2, a_1=1 が収束する r（実際に項を計算して確かめる）
    def conv(rv):
        a = Fraction(1)
        rf = Fraction(int(rv.p), int(rv.q))
        seq = []
        for _i in range(500):
            a = rf * a + 2
            seq.append(a)
        return abs(seq[-1] - seq[-2]) < Fraction(1, 10**6) and abs(seq[-2] - seq[-3]) < Fraction(1, 10**6)
    G = [R(i, 4) for i in range(-12, 13)]
    chk('m3a-05-L4-05', 'a_{n+1}=r·a_n+2, a_1=1 が収束する r（項を 500 個計算）', '-1≤r<1', region(conv, var='r', grid=G))
_()


# ===================== m3a-06 無限級数・無限等比級数 =====================
KK = symbols('k', integer=True, positive=True)


def _converges(term, nmax=2000, tol=1e-9):
    """項 term(k)（k=1,2,…）を足した部分和 S_N が収束するか。S_nmax, S_{nmax-1}, S_{nmax-2} がほぼ同じなら収束とみなす"""
    s = 0.0
    seq = []
    try:
        for kk_ in range(1, nmax + 1):
            s += term(kk_)
            seq.append(s)
    except OverflowError:       # 項が大きくなりすぎる＝発散
        return False
    return abs(seq[-1] - seq[-2]) < tol and abs(seq[-1] - seq[-3]) < tol and abs(seq[-1]) < 1e12


def _():  # L1-01
    S = sp.summation(3 * R(1, 2) ** (KK - 1), (KK, 1, oo))
    chk('m3a-06-L1-01', '3+3/2+3/4+…', S, eqv(S))
_()


def _():  # L1-02
    S = sp.summation(2 * R(-1, 3) ** (KK - 1), (KK, 1, oo))
    chk('m3a-06-L1-02', '2-2/3+2/9-…', S, eqv(S))
_()


def _():  # L1-03 初項 2 で、各公比のとき部分和が収束するか
    def f(c):
        rv = float(numchunks(c)[0])
        return _converges(lambda kk_: 2 * rv ** (kk_ - 1))
    chk('m3a-06-L1-03', '初項 2・公比 r の級数が収束するか（部分和 2000 項）', '公比 1/2', per(f))
_()


def _():  # L1-04
    S = sp.summation(4 * R(1, 10) ** KK, (KK, 1, oo))
    chk('m3a-06-L1-04', '0.4+0.04+…', S, eqv(S))
_()


def _():  # L1-05 S_n = 1-1/(n+1) の極限
    L = limit(1 - 1 / (N_ + 1), N_, oo)

    def f(c):
        if '発散' in c:
            return False
        return same(T(c), L)
    chk('m3a-06-L1-05', 'lim (1-1/(n+1))', L, per(f))
_()


def _():  # L2-01 Σ2(x/3)^{n-1} が収束する x
    def conv(xv):
        r_ = float(xv) / 3
        return _converges(lambda kk_: 2 * r_ ** (kk_ - 1))
    G = [R(i, 4) for i in range(-16, 17)]
    chk('m3a-06-L2-01', 'Σ2(x/3)^{n-1} が収束する x（部分和で確認）', '-3<x<3', region(conv, grid=G))
_()


def _():  # L2-02 初項 4、第 2 項 -2
    r_ = R(-2, 4)
    S = sp.summation(4 * r_ ** (KK - 1), (KK, 1, oo))
    chk('m3a-06-L2-02', '初項4・公比 -1/2', S, eqv(S))
_()


def _():  # L2-03
    S = sp.summation(1 / (KK * (KK + 2)), (KK, 1, oo))
    chk('m3a-06-L2-03', 'Σ 1/(n(n+2))', S, eqv(S))
_()


def _():  # L2-04
    S = sp.summation(27 * R(1, 100) ** KK, (KK, 1, oo))
    chk('m3a-06-L2-04', '0.27+0.0027+…', S, eqv(S))
_()


def _():  # L2-05 正方形の中点を結ぶと面積は 1/2 倍（座標で確かめる）
    sq = [(R(0), R(0)), (R(1), R(0)), (R(1), R(1)), (R(0), R(1))]
    area = lambda P: abs(sum(P[i][0] * P[(i + 1) % 4][1] - P[(i + 1) % 4][0] * P[i][1] for i in range(4))) / 2
    areas = [area(sq)]
    for _i in range(5):
        sq = [((sq[i][0] + sq[(i + 1) % 4][0]) / 2, (sq[i][1] + sq[(i + 1) % 4][1]) / 2) for i in range(4)]
        areas.append(area(sq))
    assert all(areas[i + 1] == areas[i] / 2 for i in range(5)), areas
    S = sp.summation(R(1, 2) ** (KK - 1), (KK, 1, oo))
    chk('m3a-06-L2-05', '正方形の面積の総和（面積 %s…）' % areas[:4], S, eqv(S))
_()


def _():  # L3-01 項と和の関係（A 収束⇒項→0 / B 項→0⇒収束 / C 項→0でない⇒収束 / D 発散⇒項→0でない）
    # 反例 a_n=1/√n：項→0 だが S_N ≥ √N → ∞（発散）。これで B と D が偽。
    ok_ex = all(sum(1 / math.sqrt(i) for i in range(1, nn + 1)) >= math.sqrt(nn) for nn in (1, 10, 100, 1000, 10000))
    B = not ok_ex            # 反例があるので「いつでも収束」は偽
    D = not ok_ex            # 同じ反例で、発散するのに項→0 なので偽
    # C：a_n=1（項→0でない）は発散する → 「収束する」は偽
    C = _converges(lambda kk_: 1.0)
    # A：収束する級数（例 1/2^n, 1/n², (-1/2)^n）で項→0 を確かめる（定理：S_n-S_{n-1}=a_n）
    exs = [lambda kk_: 0.5 ** kk_, lambda kk_: 0.9 ** kk_, lambda kk_: (-0.5) ** kk_]      # 収束する級数の例
    A = all(_converges(t_) and abs(t_(2000)) < 1e-9 for t_ in exs)
    chk('m3a-06-L3-01', '項と和の関係（反例 1/√n：S_N≥√N）。A:%s B:%s C:%s D:%s' % (A, B, C, D), '収束⇒項→0', fixed([A, B, C, D]))
_()


def _():  # L3-02
    sol = solve(Eq(2 / (1 - r), 4), r)
    chk('m3a-06-L3-02', '2/(1-r)=4', sol, per(lambda c: same(T(rhs(c)), sol[0])))
_()


def _():  # L3-03
    S = sp.summation(R(1, 2) ** KK + R(1, 3) ** KK, (KK, 1, oo))
    chk('m3a-06-L3-03', 'Σ((1/2)^n+(1/3)^n)', S, eqv(S))
_()


def _():  # L3-04 ボールの距離の総和を、400 回はね返るまで足して確かめる
    total = Fraction(1)
    h = Fraction(1)
    for _i in range(400):
        h = h * Fraction(2, 3)
        total += 2 * h
    assert abs(total - 5) < Fraction(1, 10**20)
    chk('m3a-06-L3-04', '1+2Σ(2/3)^k（400 回はね返るまで %s）' % float(total), 5, per(lambda c: numchunks(c)[0] == 5))
_()


def _():  # L3-05 x+x(1-x)+x(1-x)^2+… が収束する x
    def conv(xv):
        xf = float(xv)
        return _converges(lambda kk_: xf * (1 - xf) ** (kk_ - 1))
    G = [R(i, 4) for i in range(-8, 17)]
    chk('m3a-06-L3-05', '級数が収束する x（部分和で確認）', '0≤x<2', region(conv, grid=G))
_()


def _():  # L4-01
    S = sp.summation(1 / (KK * (KK + 1) * (KK + 2)), (KK, 1, oo))
    chk('m3a-06-L4-01', 'Σ 1/(n(n+1)(n+2))', S, eqv(S))
_()


def _():  # L4-02
    S = sp.summation(R(2, 5) ** KK + R(-3, 5) ** KK, (KK, 1, oo))
    S2 = sum(Fraction(2**k_ + (-3) ** k_, 5**k_) for k_ in range(1, 120))
    assert abs(float(S2) - float(S)) < 1e-9
    chk('m3a-06-L4-02', 'Σ(2^n+(-3)^n)/5^n', S, eqv(S))
_()


def _():  # L4-03 部分和 S_N=√(N+1)-1 を確かめて、発散
    for NN in (1, 2, 5, 20, 500):
        SN = sum(1 / (math.sqrt(i) + math.sqrt(i + 1)) for i in range(1, NN + 1))
        assert abs(SN - (math.sqrt(NN + 1) - 1)) < 1e-9
    L = limit(sqrt(N_ + 1) - 1, N_, oo)

    def f(c):
        if c.startswith('正の無限大'):
            return L == oo
        mm = re.match(r'(.+?)に収束', c.replace('$', '').replace(' ', ''))
        return mm is not None and L not in (oo, -oo) and same(T(mm.group(1)), L)
    chk('m3a-06-L4-03', 'Σ 1/(√n+√(n+1))、S_N=√(N+1)-1', L, per(f))
_()


def _():  # L4-04 点 P の位置を 600 回の移動でシミュレーション
    px, py = Fraction(0), Fraction(0)
    dirs = [(1, 0), (0, 1), (-1, 0), (0, -1)]
    step = Fraction(1)
    for i in range(600):
        dx, dy = dirs[i % 4]
        px += dx * step
        py += dy * step
        step /= 2
    assert abs(px - Fraction(4, 5)) < 1e-12 and abs(py - Fraction(2, 5)) < 1e-12, (float(px), float(py))
    chk('m3a-06-L4-04', '左に 90° ずつ向きを変えて半分ずつ進む点の極限位置（600 回移動 (%.6f, %.6f)）' % (float(px), float(py)), '(4/5, 2/5)', pt(R(4, 5), R(2, 5)))
_()


def _():  # L4-05 和 3、第 2 項 2/3、初項 > 1
    a_, r_ = symbols('a_ r_')
    sols = solve([Eq(a_ / (1 - r_), 3), Eq(a_ * r_, R(2, 3))], [a_, r_], dict=True)
    good = [s_[r_] for s_ in sols if s_[a_] > 1 and abs(s_[r_]) < 1]
    chk('m3a-06-L4-05', 'a/(1-r)=3, ar=2/3, a>1 の解 %s → r' % sols, good, numset(good))
_()


# ===================== m3a-07 関数の極限 =====================
def _lim_words(L):
    """'正の無限大に発散する' '負の無限大に発散する' '極限は存在しない' 'c に収束する' の選択肢の判定（L は極限値または 'none'）"""
    def f(c):
        s = c.replace('$', '').replace(' ', '')
        if s.startswith('正の無限大'):
            return L == oo
        if s.startswith('負の無限大'):
            return L == -oo
        if s.startswith('極限は存在しない') or s.startswith('存在しない') or s.startswith('収束しない'):
            return L == 'none'
        mm = re.match(r'(.+?)に収束', s)
        if mm:
            return L != 'none' and L not in (oo, -oo) and same(T(mm.group(1)), L)
        # 数値だけの選択肢
        return L != 'none' and L not in (oo, -oo) and same(T(s), L)
    return f


def _():  # L1-01
    L = limit(x**2 - 3 * x + 1, x, 2)
    chk('m3a-07-L1-01', 'lim_{x→2}(x²-3x+1)', L, per(_lim_words(L)))
_()


def _():  # L1-02
    L = limit((x**2 - 1) / (x - 1), x, 1)
    chk('m3a-07-L1-02', 'lim_{x→1}(x²-1)/(x-1)', L, per(_lim_words(L)))
_()


def _():  # L1-03
    L = limit(1 / x, x, 0, '+')
    chk('m3a-07-L1-03', 'lim_{x→+0} 1/x', L, per(_lim_words(L)))
_()


def _():
    L = limit((3 * x + 1) / (x - 2), x, oo)
    chk('m3a-07-L1-04', 'lim_{x→∞}(3x+1)/(x-2)', L, per(_lim_words(L)))
_()


def _():
    t_ = symbols('t', positive=True)
    L = limit(2 ** (-t_), t_, oo)        # x=-t とおいて t→∞（sympy は 2**x の x→-∞ を正しく扱えないため）
    chk('m3a-07-L1-05', 'lim_{x→-∞}2^x（x=-t, t→∞ で %s、数値 2^-50=%.1e）' % (L, 2.0 ** -50), L, per(_lim_words(L)))
_()


def _():
    L = limit((x**2 - 9) / (x**2 - 2 * x - 3), x, 3)
    chk('m3a-07-L2-01', 'lim_{x→3}(x²-9)/(x²-2x-3)', L, per(_lim_words(L)))
_()


def _():
    L = limit((sqrt(x) - 2) / (x - 4), x, 4)
    chk('m3a-07-L2-02', 'lim_{x→4}(√x-2)/(x-4)', L, per(_lim_words(L)))
_()


def _():
    L = limit(sqrt(x**2 + 4 * x) - x, x, oo)
    chk('m3a-07-L2-03', 'lim_{x→∞}(√(x²+4x)-x)', L, per(_lim_words(L)))
_()


def _():  # L2-04 |x|/x：右側 1、左側 -1 → 存在しない
    Lr = limit(Abs(x) / x, x, 0, '+')
    Ll = limit(Abs(x) / x, x, 0, '-')
    L = Lr if Lr == Ll else 'none'
    chk('m3a-07-L2-04', 'lim_{x→0}|x|/x（右 %s、左 %s）' % (Lr, Ll), '極限は存在しない', per(_lim_words(L)))
_()


def _():
    L = limit((1 / (x - 2)) * (1 / x - R(1, 2)), x, 2)
    chk('m3a-07-L2-05', 'lim_{x→2} (1/(x-2))(1/x-1/2)', L, per(_lim_words(L)))
_()


def _():  # L3-01
    A = (limit(1 / x, x, 0, '+') == limit(1 / x, x, 0, '-') == oo)
    B = (limit(x / (x**2 + 1), x, oo) == 1)
    t_ = symbols('t', positive=True)
    C = (limit(2 ** t_, t_, oo) == 0)          # x=-t とおくと 2^{-x}=2^t, t→∞
    D = (limit(1 / x**2, x, 0) == oo)
    chk('m3a-07-L3-01', '極限の正誤 A:%s B:%s C:%s D:%s' % (A, B, C, D), 'lim 1/x² = ∞', fixed([A, B, C, D]))
_()


def _():  # L3-02 (a,b) で極限が 5
    def f(c):
        d_ = parse_kv(c)
        L = limit((x**2 + d_['a'] * x + d_['b']) / (x - 2), x, 2)
        return L == 5
    chk('m3a-07-L3-02', 'lim_{x→2}(x²+ax+b)/(x-2)=5', 'a=1,b=-6', per(f))
_()


def _():
    t_ = symbols('t', positive=True)
    L = limit(sqrt(t_**2 - t_) - t_, t_, oo)       # x=-t
    num = float(math.sqrt(1e12 + 1e6) - 1e6)       # 数値でも確認（x=-10^6 のとき x²+x = 10^12-10^6）
    assert abs(float(-math.sqrt(1e12 - 1e6) + 1e6) - 0.5) < 1e-3
    chk('m3a-07-L3-03', 'lim_{x→-∞}(√(x²+x)+x)（x=-t, t→∞ で %s）' % L, L, per(_lim_words(L)))
_()


def _():  # L3-04 右側・左側
    g = (x**2 - 4) / Abs(x - 2)
    Rr = limit(g, x, 2, '+')
    Ll = limit(g, x, 2, '-')

    def f(c):
        if 'どちらも' in c:
            vals = numchunks(c)
            return len(vals) == 1 and vals[0] == Rr == Ll
        vals = numchunks(c)
        return vals == [Rr, Ll]
    chk('m3a-07-L3-04', '(x²-4)/|x-2| の右側・左側極限', f'右 {Rr}、左 {Ll}', per(f))
_()


def _():  # L3-05 [x]/x → 1（数値でも確認：x=10^k+0.5 で [x]/x が 1 に近づく）
    vals = [float(sp.floor(R(10**k_) + R(1, 2)) / (R(10**k_) + R(1, 2))) for k_ in (2, 4, 6)]
    for xx in [R(37, 10), R(1001, 10), R(10**5) + R(99, 100)]:
        assert xx - 1 < sp.floor(xx) <= xx                 # はさみうちの不等式
    assert abs(vals[-1] - 1) < 1e-5, vals
    chk('m3a-07-L3-05', '[x]/x（x=10^2,10^4,10^6 付近で %s）' % [round(v, 6) for v in vals], 1, per(_lim_words(S.One)))
_()


def _():  # L4-01 (a,b), b>0
    def f(c):
        d_ = parse_kv(c)
        if d_['b'] <= 0:
            return False
        L = limit((sqrt(x + d_['a']) - d_['b']) / (x - 1), x, 1)
        return L == R(1, 4)
    chk('m3a-07-L4-01', 'lim_{x→1}(√(x+a)-b)/(x-1)=1/4', 'a=3,b=2', per(f))
_()


def _():  # L4-02
    def f(c):
        d_ = parse_kv(c)
        L = limit(sqrt(x**2 + x) - d_['a'] * x - d_['b'], x, oo)
        return L == 0
    chk('m3a-07-L4-02', 'lim_{x→∞}(√(x²+x)-ax-b)=0', 'a=1,b=1/2', per(f))
_()


def _():
    L = limit((sqrt(1 + x) - sqrt(1 - x)) / x, x, 0)
    chk('m3a-07-L4-03', 'lim_{x→0}(√(1+x)-√(1-x))/x', L, per(_lim_words(L)))
_()


def _():
    # x→-∞：t=-x とおいて t→∞ にしてから極限をとる（sympy が x→-∞ を直接扱えない場合に備える）
    t_ = symbols('t', positive=True)
    L = limit((3 ** (-t_) - 2 ** (-t_)) / (3 ** (-t_) + 2 ** (-t_)), t_, oo)
    vals = [float((3.0**xx - 2.0**xx) / (3.0**xx + 2.0**xx)) for xx in (-5, -20, -60)]
    chk('m3a-07-L4-04', 'lim_{x→-∞}(3^x-2^x)/(3^x+2^x)（x=-5,-20,-60 で %s）' % [round(v, 6) for v in vals], L, per(_lim_words(L)))
_()


def _():
    L = limit((sp.log(4 * x + 1) - sp.log(x + 3)) / sp.log(2), x, oo)
    chk('m3a-07-L4-05', 'lim_{x→∞}(log2(4x+1)-log2(x+3))', L, per(_lim_words(sp.simplify(L))))
_()


# ===================== m3a-08 三角関数の極限 =====================
def _():
    L = limit(sin(2 * x) / x, x, 0)
    chk('m3a-08-L1-01', 'lim sin2x/x', L, per(_lim_words(L)))
_()


def _():
    L = limit(tan(x) / x, x, 0)
    chk('m3a-08-L1-02', 'lim tan x/x', L, per(_lim_words(L)))
_()


def _():
    L = limit(sin(4 * x) / (3 * x), x, 0)
    chk('m3a-08-L1-03', 'lim sin4x/(3x)', L, per(_lim_words(L)))
_()


def _():  # L1-04 角を度で表すと sin(x°)/x → π/180 ≠ 1、ラジアンなら 1
    Ldeg = limit(sin(pi * x / 180) / x, x, 0)
    Lrad = limit(sin(x) / x, x, 0)
    A = (Ldeg == 1)
    B = (Lrad == 1 and Ldeg != 1)
    C = (Lrad == 1 and Ldeg == 1)
    D = (Lrad != 1 and Ldeg != 1)      # 「どちらでも成り立たない」：ラジアンなら 1 になるので偽
    chk('m3a-08-L1-04', '度なら sin(x°)/x→%s、ラジアンなら →%s' % (Ldeg, Lrad), '弧度法', fixed([A, B, C, D]))
_()


def _():  # L1-05 sin x / x (x→∞)：数値でも確認
    L = limit(sin(x) / x, x, oo)
    vals = [abs(math.sin(v) / v) for v in (1e3, 1e5, 1e7)]
    assert max(vals) < 1.1e-3
    chk('m3a-08-L1-05', 'lim_{x→∞} sin x/x（数値 %s）' % [f'{v:.1e}' for v in vals], L, per(_lim_words(L)))
_()


def _():
    L = limit(sin(5 * x) / sin(2 * x), x, 0)
    chk('m3a-08-L2-01', 'lim sin5x/sin2x', L, per(_lim_words(L)))
_()


def _():
    L = limit((1 - cos(x)) / x**2, x, 0)
    chk('m3a-08-L2-02', 'lim (1-cos x)/x²', L, per(_lim_words(L)))
_()


def _():
    L = limit(x * tan(x) / (1 - cos(x)), x, 0)
    chk('m3a-08-L2-03', 'lim x tan x/(1-cos x)', L, per(_lim_words(L)))
_()


def _():
    L = limit(sin(x) / (x - pi), x, pi)
    chk('m3a-08-L2-04', 'lim_{x→π} sin x/(x-π)', L, per(_lim_words(L)))
_()


def _():
    t_ = symbols('t', positive=True)
    L = limit(sin(t_) / t_, t_, 0, '+')           # x=1/t, x→∞ は t→+0
    vals = [float(v * math.sin(1 / v)) for v in (1e3, 1e5)]
    assert abs(vals[-1] - 1) < 1e-6
    chk('m3a-08-L2-05', 'lim_{x→∞} x sin(1/x)（数値 %s）' % vals, L, per(_lim_words(L)))
_()


def _():  # L3-01
    A = (limit(sin(pi * x / 180) / x, x, 0) == 1)
    B = (limit((1 - cos(x)) / x, x, 0) == R(1, 2))
    C = (limit(sin(x), x, oo) == 0)
    D = (limit(x * sin(1 / x), x, 0) == 0)
    chk('m3a-08-L3-01', '極限の正誤 A:%s B:%s C:%s D:%s' % (A, B, C, D), 'x sin(1/x)→0', fixed([A, B, C, D]))
_()


def _():  # L3-02
    sols = [v for v in solve(Eq(a**2 / 2, 8), a)]
    for v in sols:
        assert limit((1 - cos(v * x)) / x**2, x, 0) == 8
    chk('m3a-08-L3-02', 'lim (1-cos ax)/x²=8', sols, numset(sols))
_()


def _():
    t_ = symbols('t', positive=True)
    L = limit((1 / (2 * t_)) * sin(2 * pi * t_), t_, 0, '+')          # n=1/t（sympy は n→∞ の形だと誤るため）
    num = 10**5 / 2 * math.sin(2 * math.pi / 10**5)
    assert abs(num - math.pi) < 1e-6
    chk('m3a-08-L3-03', 'lim (n/2) sin(2π/n)（n=10^5 で %.6f）' % num, L, per(lambda c: same(T(c), L)))
_()


def _():
    L = limit((cos(x) - cos(2 * x)) / x**2, x, 0)
    chk('m3a-08-L3-04', 'lim (cos x-cos2x)/x²', L, per(_lim_words(L)))
_()


def _():  # L3-05 弦の長さ = 2 sin(θ/2) を座標で確かめてから極限
    th = symbols('th', positive=True)
    for v in (R(1, 3), R(1, 2), 1, 2):
        chord = sqrt((1 - cos(v)) ** 2 + sin(v) ** 2)
        assert abs(sp.N(chord - 2 * sin(v / 2))) < 1e-12
    L = limit(th / (2 * sin(th / 2)), th, 0, '+')
    chk('m3a-08-L3-05', '弧/弦=θ/(2sin(θ/2))、θ→+0', L, per(_lim_words(L)))
_()


def _():
    L = limit((1 - cos(2 * x)) / (x * tan(x)), x, 0)
    chk('m3a-08-L4-01', 'lim (1-cos2x)/(x tan x)', L, per(_lim_words(L)))
_()


def _():
    L = limit((sqrt(1 + sin(2 * x)) - 1) / x, x, 0)
    chk('m3a-08-L4-02', 'lim (√(1+sin2x)-1)/x', L, per(_lim_words(L)))
_()


def _():
    t_ = symbols('t')
    L = limit((sin(t_ + pi / 3) - sqrt(3) / 2) / t_, t_, 0)       # x=t+π/3
    chk('m3a-08-L4-03', 'lim_{x→π/3}(sin x-√3/2)/(x-π/3)', L, per(_lim_words(L)))
_()


def _():
    t_ = symbols('t', positive=True)
    L = limit((pi / t_) ** 2 * (1 - cos(t_)), t_, 0, '+')           # t=π/n
    n_val = 10**4
    num = n_val**2 * (1 - math.cos(math.pi / n_val))
    assert abs(num - math.pi**2 / 2) < 1e-3
    chk('m3a-08-L4-04', 'lim n²(1-cos(π/n))（n=10^4 で %.5f）' % num, L, per(lambda c: same(T(c), L)))
_()


def _():  # L4-05 (a, 極限値)
    def f(c):
        a_ = sp.Integer(int(re.search(r'a=(-?\d+)', c.replace('$', '')).group(1)))
        val = numchunks(c)[-1]
        Lm = limit((cos(x) - a_) / x**2, x, 0)
        return Lm == val
    chk('m3a-08-L4-05', 'lim (cos x-a)/x² が存在する a と極限値', 'a=1, -1/2', per(f))
_()


# ===================== m3a-09 関数の連続性と中間値の定理 =====================
from sympy.calculus.util import continuous_domain


def _():  # L1-01 連続の定義：x=a で連続 ⇔ lim が存在して f(a) に等しい。反例で他の選択肢が定義でないことを確かめる
    # f(x)=x² は x=1 で連続だが f(1)=1≠0、lim=1≠0 → 「f(a)=0」「lim=0」は連続の定義ではない。
    f = x**2
    cont = (limit(f, x, 1) == f.subs(x, 1))
    not_zero = (f.subs(x, 1) != 0 and limit(f, x, 1) != 0)
    # 「右側極限が ∞」は発散で、連続とは逆（f(a) が有限な値と等しくなれない）
    d_ok = cont
    chk('m3a-09-L1-01', '連続の定義（x² は x=1 で連続だが f(1)=1≠0：%s）' % not_zero, 'lim が存在して f(a) に等しい',
        fixed([not (cont and not_zero), not (cont and not_zero), False, d_ok]))
_()


def _():  # L1-02
    sols = solve(sp.denom(sp.together((x + 1) / (x - 2))), x)
    chk('m3a-09-L1-02', '(x+1)/(x-2) の不連続点', sols, numset(sols))
_()


def _():  # L1-03 各関数の連続な定義域が実数全体か
    def f(c):
        e = T(rhs(c))
        return continuous_domain(e, x, S.Reals) == S.Reals
    chk('m3a-09-L1-03', 'すべての実数で連続な関数', 'x²-3x', per(f))
_()


def _():  # L1-04 中間値の定理（A:5 をとる / B:0 をただ 1 つ / C:1 を少なくとも 1 つ / D:増加）
    # 例 f(x)=-1+4x（[0,1]）：最大値 3 なので f=5 はとらない（A は「必ず」ではない）
    f1 = -1 + 4 * x
    A = (max(f1.subs(x, 0), f1.subs(x, 1)) >= 5)          # 5 をとらない → 偽
    # 例 f(x)=-1+4x+k·x(1-x)(1-2x)：f(0)=-1, f(1)=3、k が大きいと f=0 の解が複数ある（B は偽）、増加でもない（D は偽）
    for k_ in (10, 20, 40, 80):
        f2 = -1 + 4 * x + k_ * x * (1 - x) * (1 - 2 * x)
        roots = [r_ for r_ in sp.Poly(f2, x).real_roots() if 0 < r_ < 1]
        dec = any(sp.diff(f2, x).subs(x, v) < 0 for v in [R(i, 20) for i in range(1, 20)])
        if len(roots) >= 2 and dec:
            break
    B = (len(roots) == 1)
    D = (not dec)
    # C：f(x)=-1+4x では f(c)=1 となる c=1/2 が存在、f2 でも存在（解が (0,1) にある）
    sol_c = [r_ for r_ in sp.Poly(f2 - 1, x).real_roots() if 0 < r_ < 1]
    C = (len(sol_c) >= 1 and solve(f1 - 1, x)[0] == R(1, 2))
    chk('m3a-09-L1-04', '中間値の定理：反例 k=%s の f の (0,1) の f=0 の解 %d 個、減少区間あり' % (k_, len(roots)), 'f(c)=1 が存在', fixed([A, B, C, D]))
_()


def _():  # L1-05 f(x)=x²-5 の符号が変わる区間
    def f(c):
        lo, hi = [int(v) for v in re.findall(r'-?\d+', c.replace('$', ''))[:2]]
        g = lambda t: t**2 - 5
        return g(lo) * g(hi) < 0 and lo < sqrt(5) < hi
    chk('m3a-09-L1-05', 'x²-5=0 の解（√5≈2.236）を含む整数区間', '2<x<3', per(f))
_()


def _():  # L2-01
    L = limit((x**2 - 4) / (x - 2), x, 2)

    def f(c):
        if '存在しない' in c:
            return False
        return same(T(c), L)
    chk('m3a-09-L2-01', 'x=2 で連続になる a', L, per(f))
_()


def _():  # L2-02
    left = limit(2 * x + 1, x, 1, '-')
    sol = solve(Eq(left, 1 + a), a)
    chk('m3a-09-L2-02', '2x+1 と x²+a が x=1 でつながる a', sol, numset(sol))
_()


def _():  # L2-03
    sols = solve(sp.denom(sp.together(x / (x**2 - 3 * x + 2))), x)
    chk('m3a-09-L2-03', 'x/(x²-3x+2) の不連続点', sols, numset(sols))
_()


def _():  # L2-04 [x] の x=2 での右側・左側極限
    eps = R(1, 10**9)
    Rr = sp.floor(2 + eps)
    Ll = sp.floor(2 - eps)

    def f(c):
        vals = numchunks(c)
        if 'どちらも' in c:
            return len(vals) == 1 and vals[0] == Rr == Ll
        return vals == [Rr, Ll]
    chk('m3a-09-L2-04', '[x] の x=2 での右側極限 %s・左側極限 %s' % (Rr, Ll), '右 2、左 1', per(f))
_()


def _():  # L2-05 符号が変わる区間のうちいちばん狭いもの：f(1)=2,f(2)=1,f(3)=-4
    vals = {1: 2, 2: 1, 3: -4}

    def f(c):
        lo, hi = [int(v) for v in re.findall(r'-?\d+', c.replace('$', ''))[:2]]
        if lo not in vals or hi not in vals:
            return False
        # 両端の符号が変わり、しかも内側に符号が変わる区間がもっと狭くある（lo,hi の間に値が分かっている点があり、そこで符号変化）なら「いちばん狭い」ではない
        inner = [t for t in vals if lo < t < hi]
        pts = [lo] + inner + [hi]
        narrow = [(pts[i], pts[i + 1]) for i in range(len(pts) - 1) if vals[pts[i]] * vals[pts[i + 1]] < 0]
        return vals[lo] * vals[hi] < 0 and (lo, hi) in narrow
    chk('m3a-09-L2-05', '符号が変わるいちばん狭い区間', '2<x<3', per(f))
_()


def _():  # L3-01 連続性の命題（A 不連続+不連続 / B 連続+不連続 / C f² が連続 / D |f| が連続）
    # A の反例：f=[x]、g=-[x] は x=1 で不連続、f+g=0 は連続
    right1, left1 = sp.floor(1 + R(1, 10**9)), sp.floor(1 - R(1, 10**9))
    f_disc = (right1 != left1)
    A = not (f_disc and True)                 # 反例があるので「必ず不連続」は偽
    # B は「連続 f と不連続 g の和 f+g が連続だと g=(f+g)-f も連続」で矛盾 → 真
    B = True
    # C・D の反例：f=1 (x≥0), -1 (x<0)。f²=1、|f|=1 は連続だが f は x=0 で不連続
    fr, fl = 1, -1
    C = not (fr != fl)
    D = not (fr != fl)
    chk('m3a-09-L3-01', '連続性の命題 A:%s B:%s C:%s D:%s' % (A, B, C, D), '連続+不連続 → 不連続', fixed([A, B, C, D]))
_()


def _():  # L3-02 x=1 で連続になる (a,b)
    def f(c):
        d_ = parse_kv(c)
        L = limit((x**2 + d_['a'] * x + d_['b']) / (x - 1), x, 1)
        return L == 3
    chk('m3a-09-L3-02', 'lim_{x→1}(x²+ax+b)/(x-1)=3', 'a=1,b=-2', per(f))
_()


def _():  # L3-03 x=3 で連続になる (a,b)
    def f(c):
        d_ = parse_kv(c)
        L = limit((sqrt(x + d_['a']) - 2) / (x - 3), x, 3)
        return L == d_['b']
    chk('m3a-09-L3-03', 'x=3 で連続（極限 = b）', 'a=1,b=1/4', per(f))
_()


def _():
    L = limit((1 - cos(x)) / x**2, x, 0)
    chk('m3a-09-L3-04', '(1-cos x)/x² の x→0 の極限', L, eqv(L))
_()


def _():  # L3-05 f(0)=-1, f(1)=2, f(2)=-3：符号が変わる区間の数
    vals = [-1, 2, -3]
    cnt = sum(1 for i in range(2) if vals[i] * vals[i + 1] < 0)
    chk('m3a-09-L3-05', '符号が変わる区間の数', cnt, per(lambda c: int(re.search(r'(\d+)個', c).group(1)) == cnt))
_()


def _():  # L4-01 f(x)=lim (x^{2n}-1)/(x^{2n}+1) の不連続点：格子点で左右の値を比べる
    def fx(xv):      # n=10^5 のときの値（桁あふれしないよう、大きいほうでわってから計算）で極限を確かめる
        q = float(xv) ** 2
        nn = 10**5
        if q == 1:
            return 0.0
        if q < 1:
            tt = q ** nn
            return round((tt - 1) / (tt + 1), 6)
        tt = (1 / q) ** nn
        return round((1 - tt) / (1 + tt), 6)
    pts = [R(i, 2) for i in range(-4, 5)]
    d = R(1, 1000)
    disc = []
    for x0 in pts:
        v0, vl, vr = fx(x0), fx(x0 - d), fx(x0 + d)
        if not (v0 == vl == vr):
            disc.append(x0)

    def f(c):
        s = c.replace('のみ', '')
        return numset(disc)([s])[0]
    chk('m3a-09-L4-01', 'lim (x^{2n}-1)/(x^{2n}+1) の不連続点（x=±1/2,… で左右を比較）', disc, per(f))
_()


def _():  # L4-02 a+b=1 が連続の必要十分条件：f(1) = (1+a+b)/2、左側 a+b、右側 1
    left_, right_, f1 = a + b, S.One, (1 + a + b) / 2
    sol = solve([Eq(left_, right_), Eq(f1, right_)], [a, b], dict=True)     # 条件は a+b=1 の 1 本だけ
    # a+b=1 という 1 本の式に帰着するか
    cond = sp.simplify(left_ - right_)
    ok2 = (sp.simplify(f1 - right_ - (cond / 2)) == 0)        # f(1)-1 = (a+b-1)/2 なので 2 つの条件は同じ
    def f(c):
        s = c.replace('$', '').replace(' ', '')
        if s == 'a+b=1':
            return ok2
        return False         # a+b=2, a+b=0, a=1 かつ b=1（a+b=2 になり満たさない）
    chk('m3a-09-L4-02', '連続の条件：左側 a+b、右側 1、f(1)=(1+a+b)/2 → a+b=1（%s）' % ok2, 'a+b=1', per(f))
_()


def _():  # L4-03 g(0)=f(0)≥0, g(1)=f(1)-1≤0（例で確かめる）
    # f=x² → g(0)=0, g(1)=0 → 「g(0)>0」は必ずは成り立たない。f=1 → g(0)=1>0, g(1)=0 → 「g(0)≤0」「g(0)=0」は偽
    g = lambda f_, t: f_.subs(x, t) - t
    exs = [x**2, S.One, x, 1 - x, sqrt(x)]
    A = all(g(f_, 0) <= 0 and g(f_, 1) >= 0 for f_ in exs)
    B = all(g(f_, 0) >= 0 and g(f_, 1) <= 0 for f_ in exs)
    C = all(g(f_, 0) > 0 and g(f_, 1) < 0 for f_ in exs)
    D = all(g(f_, 0) == 0 and g(f_, 1) == 0 for f_ in exs)
    chk('m3a-09-L4-03', 'g=f-x の端点の符号（例 f=x²,1,x,1-x,√x）A:%s B:%s C:%s D:%s' % (A, B, C, D), 'g(0)≥0, g(1)≤0', fixed([A, B, C, D]))
_()


def _():  # L4-04 x³-3x+1=0 の実数解の個数
    p = sp.Poly(x**3 - 3 * x + 1, x)
    n_roots = len(p.real_roots())
    vals = [p.eval(v) for v in (-2, -1, 0, 1, 2)]
    chk('m3a-09-L4-04', 'f(-2..2)=%s、実数解の個数' % vals, n_roots, per(lambda c: int(re.search(r'(\d+)個', c).group(1)) == n_roots))
_()


def _():  # L4-05 f(x)=[x]+[-x] の不連続点
    d = R(1, 1000)
    F = lambda t: sp.floor(t) + sp.floor(-t)
    ints_disc = all(not (F(n_) == F(n_ - d) == F(n_ + d)) for n_ in range(-3, 4))
    nonint_cont = all(F(t) == F(t - d) == F(t + d) for t in [R(1, 2), R(3, 2), R(-5, 2), R(7, 3)])
    A = ints_disc and nonint_cont                  # すべての整数で不連続（かつ整数でない点は連続）
    B = (F(1) == F(1 - d) == F(1 + d)) and not (F(0) == F(-d) == F(d))   # x=0 のみ不連続 → x=1 も不連続なので偽
    C = ints_disc and not nonint_cont              # すべての実数で不連続 → 整数でない点が連続なので偽
    D = nonint_cont and not ints_disc              # 不連続な点がない
    chk('m3a-09-L4-05', '[x]+[-x] の不連続点（整数で不連続 %s・整数でない点で連続 %s）' % (ints_disc, nonint_cont), 'すべての整数', fixed([A, B, C, D]))
_()


# ===================== mc3-01 データの表現の工夫 =====================
import random


def _median(v):
    v = sorted(v)
    m_ = len(v)
    return Fraction(v[m_ // 2]) if m_ % 2 else Fraction(v[m_ // 2 - 1] + v[m_ // 2], 2)


def _quartiles(v):
    """教科書の定義：中央値で前半・後半に分け（個数が奇数なら中央値を除く）、それぞれの中央値"""
    v = sorted(v)
    m_ = len(v)
    lower = v[: m_ // 2]
    upper = v[(m_ + 1) // 2:]
    return _median(lower), _median(v), _median(upper)


def _mean(v):
    return sum(Fraction(t_) for t_ in v) / len(v)


def _var(v):            # 母集団の分散（偏差の 2乗の平均）
    mu = _mean(v)
    return sum((Fraction(t_) - mu) ** 2 for t_ in v) / len(v)


def _cov(xs, ys):
    mx, my = _mean(xs), _mean(ys)
    return sum((Fraction(a_) - mx) * (Fraction(b_) - my) for a_, b_ in zip(xs, ys)) / len(xs)


def _corr(xs, ys):
    return float(_cov(xs, ys)) / math.sqrt(float(_var(xs)) * float(_var(ys)))


def _fl(c):
    """選択肢の数（小数・分数）を float にして並べる。「(4, 8, 11.5)」のような組も、成分ごとに並べる"""
    out = []
    for ch in chunks(c):
        body = ch.replace('\\ ', ' ').strip()
        if body.startswith('(') and body.endswith(')'):
            body = body[1:-1]
        for part in body.split(','):
            try:
                e = T(part)
                if not e.free_symbols:
                    out.append(float(e))
            except Exception:
                pass
    return out


def _close(a_, b_):
    return len(a_) == len(b_) and all(abs(p - q) < 1e-9 for p, q in zip(a_, b_))


def _():  # L1-01
    q1 = _quartiles([3, 5, 7, 8, 10, 12, 15])[0]
    chk('mc3-01-L1-01', '[3,5,7,8,10,12,15] の Q1', q1, per(lambda c: _close(_fl(c), [float(q1)])))
_()


def _():  # L1-02
    q1, _, q3 = _quartiles([1, 3, 4, 6, 8, 9])
    iqr = q3 - q1
    chk('mc3-01-L1-02', '[1,3,4,6,8,9] の四分位範囲（Q1=%s,Q3=%s）' % (q1, q3), iqr, per(lambda c: _close(_fl(c), [float(iqr)])))
_()


def _():  # L1-03
    v = 20 - 3
    chk('mc3-01-L1-03', '範囲 = 最大値 - 最小値', v, per(lambda c: _close(_fl(c), [v])))
_()


def _():  # L1-04
    vr = _var([1, 3, 5, 7])
    chk('mc3-01-L1-04', '[1,3,5,7] の分散', vr, per(lambda c: abs(float(T(c)) - float(vr)) < 1e-9 if 'sqrt' not in str(T(c)) else False))
_()


def _():  # L1-05 相関係数 -0.9 → 右下がりで直線に近い（データで確かめる）
    random.seed(1)
    xs = list(range(1, 21))
    ys = [-v + random.uniform(-2.5, 2.5) for v in xs]
    rr = _corr(xs, ys)
    slope = float(_cov(xs, ys) / _var(xs))
    assert -0.99 < rr < -0.85 and slope < 0
    chk('mc3-01-L1-05', '例データ（右下がり）の r=%.3f、傾き %.2f' % (rr, slope), '右下がりの直線に近く並ぶ', fixed([False, False, True, False]))
_()


def _():  # L2-01
    sd = math.sqrt(float(_var([2, 4, 4, 4, 5, 5, 7, 9])))
    chk('mc3-01-L2-01', '標準偏差', sd, per(lambda c: abs(float(T(c)) - sd) < 1e-9))
_()


def _():  # L2-02 平均 20、分散 9 のデータ（17, 23）で y=3x-5 を計算
    xs = [17, 23]
    assert _mean(xs) == 20 and _var(xs) == 9
    ys = [3 * v - 5 for v in xs]
    exp_ = [float(_mean(ys)), math.sqrt(float(_var(ys)))]
    chk('mc3-01-L2-02', 'y=3x-5 の平均と標準偏差', exp_, per(lambda c: _close(_fl(c), exp_)))
_()


def _():  # L2-03
    qs = _quartiles([2, 3, 5, 6, 8, 9, 11, 12, 14])
    chk('mc3-01-L2-03', '9 個のデータの (Q1,Q2,Q3)', qs, per(lambda c: _close(_fl(c), [float(v) for v in qs])))
_()


def _():  # L2-04
    r_ = Fraction(-9, 2) / (2 * 3)
    chk('mc3-01-L2-04', 'r = -4.5/(2·3)', r_, per(lambda c: abs(float(T(c)) - float(r_)) < 1e-9))
_()


def _():  # L2-05 箱ひげ図の比較（A:IQR は B が大きい / B:中央値は A が大きい / C:最大値は B が大きい / D:範囲は A が大きい）
    A_ = dict(mn=20, q1=40, md=50, q3=60, mx=80)
    B_ = dict(mn=30, q1=45, md=55, q3=65, mx=70)
    iqrA, iqrB = A_['q3'] - A_['q1'], B_['q3'] - B_['q1']
    ans = [iqrB > iqrA, A_['md'] > B_['md'], B_['mx'] > A_['mx'], (A_['mx'] - A_['mn']) > (B_['mx'] - B_['mn'])]
    chk('mc3-01-L2-05', '箱ひげ図の比較（IQR %d,%d）' % (iqrA, iqrB), '範囲は A のほうが大きい', fixed(ans))
_()


def _():  # L3-01 データの変換（乱数データで確かめる）
    random.seed(7)
    xs = [random.randint(0, 40) for _i in range(11)]
    q = lambda v: _quartiles(v)
    iqr = lambda v: q(v)[2] - q(v)[0]
    c_ = 5
    A = abs(math.sqrt(float(_var([2 * v for v in xs]))) - 2 * math.sqrt(float(_var(xs)))) < 1e-9
    B = (_var([v + c_ for v in xs]) == _var(xs) + c_)
    C = (iqr([v + c_ for v in xs]) != iqr(xs))
    D = (_var([2 * v for v in xs]) == 2 * _var(xs))
    chk('mc3-01-L3-01', '変換の性質 A:%s B:%s C:%s D:%s' % (A, B, C, D), '2 倍で標準偏差も 2 倍', fixed([A, B, C, D]))
_()


def _():  # L3-02
    d0, d1 = [4, 5, 6, 7, 8], [4, 5, 6, 7, 38]
    m0, m1, md0, md1 = _mean(d0), _mean(d1), _median(d0), _median(d1)
    A = (m1 == m0 and md1 == md0)
    B = (m1 == m0 and md1 != md0)
    C = (m1 != m0 and md1 == md0)
    D = (m1 != m0 and md1 != md0)
    chk('mc3-01-L3-02', '平均 %s→%s、中央値 %s→%s' % (m0, m1, md0, md1), '平均 6→12、中央値 6 のまま', fixed([A, B, C, D]))
_()


def _():  # L3-03
    sd = math.sqrt(34 - 5**2)
    chk('mc3-01-L3-03', '標準偏差 √(34-25)', sd, per(lambda c: abs(float(T(c)) - sd) < 1e-9))
_()


def _():  # L3-04 5 個で平均 8、分散 6 のデータ（5,6,8,9,12）に 8 を加える
    d5 = [5, 6, 8, 9, 12]
    assert _mean(d5) == 8 and _var(d5) == 6
    v6 = _var(d5 + [8])
    chk('mc3-01-L3-04', '8 を加えた 6 個の分散', v6, per(lambda c: abs(float(T(c)) - float(v6)) < 1e-9))
_()


def _():  # L3-05 相関係数の性質
    xs = [1, 2, 3, 4, 5]
    ys = [-2 * v + 1 for v in xs]
    A = abs(_corr(xs, ys) + 1) < 1e-12                     # y=-2x+1 なら r=-1
    xs2, ys2 = [-1, 0, 1], [1, 0, 1]                       # y=x² なのに r=0
    B = (_corr(xs2, ys2) == 0) and False                   # 「r=0 ⇒ どんな関係もない」は、y=x² の反例で偽
    C = False                                              # 相関は因果を意味しない
    D = (abs(_corr(xs, ys) + 2) < 1e-12)                   # r=-2 にはならない
    chk('mc3-01-L3-05', 'r の性質（y=-2x+1 で r=%.1f、y=x² で r=%.1f）' % (_corr(xs, ys), _corr(xs2, ys2)), 'y=-2x+1 なら r=-1', fixed([A, B, C, D]))
_()


def _():  # L4-01 グループの合併（A:[1,3]、B:[7-√3,7,7+√3]）
    A_ = [1, 3]
    B_ = [7 - sqrt(3), 7, 7 + sqrt(3)]
    allv = A_ + B_
    mu = sum(allv) / 5
    vr = sp.simplify(sum((v - mu) ** 2 for v in allv) / 5)
    assert _var(A_) == 1 and _mean(A_) == 2
    assert sp.simplify(sum((v - 7) ** 2 for v in B_) / 3) == 2
    chk('mc3-01-L4-01', '合併した分散', vr, per(lambda c: sp.simplify(T(c) - vr) == 0))
_()


def _():  # L4-02
    r_ = _corr([1, 2, 3, 4], [1, 3, 2, 4])
    chk('mc3-01-L4-02', '相関係数', r_, per(lambda c: abs(float(T(c)) - r_) < 1e-9))
_()


def _():  # L4-03 20 人・五数要約から、必ずいえること（制約を満たすデータをランダムに多数つくって調べる）
    random.seed(3)
    samples = []
    tries = 0
    while len(samples) < 4000 and tries < 400000:
        tries += 1
        u, v, w = random.randint(0, 20), random.randint(0, 10), random.randint(0, 20)
        x5, x6 = 50 - u, 50 + u
        x10, x11 = 60 - v, 60 + v
        x15, x16 = 70 - w, 70 + w
        if not (30 <= x5 and x6 <= x10 and x11 <= x15 and x16 <= 90):
            continue
        d = [30]
        d += sorted(random.randint(30, x5) for _i in range(3))            # x2..x4
        d += [x5, x6]
        d += sorted(random.randint(x6, x10) for _i in range(3))           # x7..x9
        d += [x10, x11]
        d += sorted(random.randint(x11, x15) for _i in range(3))          # x12..x14
        d += [x15, x16]
        d += sorted(random.randint(x16, 90) for _i in range(3))           # x17..x19
        d += [90]
        d = sorted(d)
        if len(d) != 20:
            continue
        q = _quartiles(d)
        if (q[0], q[1], q[2], d[0], d[-1]) != (50, 60, 70, 30, 90):
            continue
        samples.append(d)
    assert len(samples) > 200, len(samples)
    A = all(sum(1 for t_ in d if t_ >= 60) == 10 for d in samples)
    B = all(sum(1 for t_ in d if t_ == 90) == 1 for d in samples)
    C = all(sum(1 for t_ in d if 50 <= t_ <= 70) >= 10 for d in samples)
    D = all(_mean(d) == 60 for d in samples)
    chk('mc3-01-L4-03', '制約を満たす %d 通りのデータで 必ず成り立つか A:%s B:%s C:%s D:%s' % (len(samples), A, B, C, D),
        '50 以上 70 以下が 10 人以上', fixed([A, B, C, D]))
_()


def _():  # L4-04
    v = 50 + 10 * R(75 - 60, 15)
    chk('mc3-01-L4-04', '偏差値', v, per(lambda c: abs(float(T(c)) - float(v)) < 1e-9))
_()


def _():  # L4-05 sd 2,5、r=0.6 のデータをつくって u=3x+1, v=-y+4 を計算
    z1, z2 = [1, 1, -1, -1], [1, -1, 1, -1]
    zx = z1
    zy = [Fraction(3, 5) * a_ + Fraction(4, 5) * b_ for a_, b_ in zip(z1, z2)]
    xs = [2 * t_ for t_ in zx]
    ys = [5 * t_ for t_ in zy]
    assert _var(xs) == 4 and _var(ys) == 25 and abs(_corr(xs, ys) - 0.6) < 1e-12
    us = [3 * t_ + 1 for t_ in xs]
    vs = [-t_ + 4 for t_ in ys]
    exp_ = [_corr(us, vs), float(_cov(us, vs))]
    chk('mc3-01-L4-05', 'u=3x+1, v=-y+4 の相関係数と共分散', exp_, per(lambda c: _close(_fl(c), exp_)))
_()


# ===================== mc3-02 離散グラフと行列による表現 =====================
def _adj(n_, edges, loops=()):
    """頂点 1..n_ の隣接行列（edges：向きなしの辺のリスト、loops：ループのある頂点）"""
    M_ = [[0] * n_ for _i in range(n_)]
    for (u_, v_) in edges:
        M_[u_ - 1][v_ - 1] = 1
        M_[v_ - 1][u_ - 1] = 1
    for u_ in loops:
        M_[u_ - 1][u_ - 1] = 1
    return sp.Matrix(M_)


def _walks(M_, start, end, k_):
    """隣接行列 M_ のグラフで、start から end へ辺をちょうど k_ 本たどる道（歩道）を、実際に全部数え上げる"""
    n_ = M_.shape[0]
    cnt = 0
    for mid in itertools.product(range(n_), repeat=k_ - 1):
        seq = [start - 1] + list(mid) + [end - 1]
        ways = 1
        for i_ in range(k_):
            ways *= M_[seq[i_], seq[i_ + 1]]
        cnt += ways
    return cnt


def _pm(c):
    """'\\begin{pmatrix}5&4\\\\1&2\\end{pmatrix}' → 行列（sympy）"""
    s = c.replace('$', '')
    mm = re.search(r'\\begin\{pmatrix\}(.*)\\end\{pmatrix\}', s)
    rows = [r_.strip() for r_ in mm.group(1).split('\\\\')]
    return sp.Matrix([[T(v_) for v_ in r_.split('&')] for r_ in rows])


def _intc(c):
    """選択肢の中の整数（「通り」「円」「個」などの前の数）"""
    return int(re.search(r'-?\d+', c.replace('$', '')).group(0))


def _():  # L1-01 頂点 A の次数
    edges = ['AB', 'BC', 'CD', 'DA', 'AC']
    deg = sum(1 for e_ in edges if 'A' in e_)
    chk('mc3-02-L1-01', '頂点 A の次数', deg, per(lambda c: _intc(c) == deg))
_()


def _():  # L1-02 辺の数
    E = sum([2, 2, 3, 3]) // 2
    chk('mc3-02-L1-02', '次数 2,2,3,3 のグラフの辺の数', E, per(lambda c: _intc(c) == E))
_()


def _():  # L1-03 隣接行列から辺を読み取る
    M_ = sp.Matrix([[0, 1, 1], [1, 0, 0], [1, 0, 0]])
    assert M_ == M_.T
    edges = {(i_, j_) for i_ in range(1, 4) for j_ in range(i_ + 1, 4) if M_[i_ - 1, j_ - 1] == 1}

    def f(c):
        pairs = re.findall(r'(\d)-(\d)', c)
        got = {(min(int(p), int(q)), max(int(p), int(q))) for p, q in pairs}
        return got == edges
    chk('mc3-02-L1-03', '隣接行列の辺', sorted(edges), per(f))
_()


def _():  # L1-04
    A_ = sp.Matrix([[1, 2], [3, 4]])
    B_ = sp.Matrix([[0, 1], [2, -1]])
    v = (2 * A_ - B_)[1, 1]
    chk('mc3-02-L1-04', '2A-B の (2,2) 成分', v, per(lambda c: _intc(c) == v))
_()


def _():  # L1-05
    v = (sp.Matrix([[3, 2]]) * sp.Matrix([[100], [50]]))[0, 0]
    chk('mc3-02-L1-05', '(3 2)(100,50)^T', v, per(lambda c: _intc(c) == v))
_()


def _():  # L2-01
    A_ = sp.Matrix([[1, 2], [0, 1]])
    B_ = sp.Matrix([[3, 0], [1, 2]])
    P_ = A_ * B_
    chk('mc3-02-L2-01', 'AB（BA=%s、A+B=%s）' % (list(B_ * A_), list(A_ + B_)), list(P_), per(lambda c: _pm(c) == P_))
_()


def _():  # L2-02 三角形グラフで、頂点 1 から辺 2 本で 1 にもどる道（数え上げ）
    M_ = _adj(3, [(1, 2), (2, 3), (1, 3)])
    n2 = _walks(M_, 1, 1, 2)
    assert n2 == (M_ ** 2)[0, 0]
    chk('mc3-02-L2-02', '三角形で 1→…→1（辺 2 本）の道（数え上げ）', n2, per(lambda c: _intc(c) == n2))
_()


def _():  # L2-03 1-2-3 のグラフで、1 から 3 へ辺 2 本
    M_ = sp.Matrix([[0, 1, 0], [1, 0, 1], [0, 1, 0]])
    n2 = _walks(M_, 1, 3, 2)
    assert n2 == (M_ ** 2)[0, 2]
    chk('mc3-02-L2-03', '1→…→3（辺 2 本）の道（数え上げ）', n2, per(lambda c: _intc(c) == n2))
_()


def _():  # L2-04
    X = sp.Matrix([[4, 3], [2, 5]])
    p = sp.Matrix([[300], [200]])
    res = X * p
    chk('mc3-02-L2-04', '売上 %s の第 2 成分（B 店）' % list(res), res[1], per(lambda c: _intc(c) == res[1]))
_()


def _():  # L2-05 連立方程式
    sol = solve([2 * x + y - 5, x + y - 3], [x, y], dict=True)[0]
    chk('mc3-02-L2-05', '2x+y=5, x+y=3', sol, pt(sol[x], sol[y]))
_()


def _():  # L3-01
    M_ = sp.Matrix([[0, 1, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 1, 0]])
    assert M_ == M_.T and all(M_[i_, i_] == 0 for i_ in range(4))
    E = sum(M_) // 2
    chk('mc3-02-L3-01', '辺の数 = 成分の和 ÷ 2', E, per(lambda c: _intc(c) == E))
_()


def _():  # L3-02 正方形のグラフで 1 から 2 へ辺 3 本（数え上げ）
    M_ = _adj(4, [(1, 2), (2, 3), (3, 4), (4, 1)])
    n3 = _walks(M_, 1, 2, 3)
    assert n3 == (M_ ** 3)[0, 1]
    chk('mc3-02-L3-02', '正方形で 1→…→2（辺 3 本）の道（数え上げ）', n3, per(lambda c: _intc(c) == n3))
_()


def _():  # L3-03 隣接行列の性質（ランダムな単純グラフ 300 個で確かめる）
    random.seed(11)
    A = B = C = D = True
    for _t in range(300):
        n_ = random.randint(4, 7)
        edges = [(i_, j_) for i_ in range(1, n_ + 1) for j_ in range(i_ + 1, n_ + 1) if random.random() < 0.5]
        M_ = _adj(n_, edges)
        deg = [sum(1 for e_ in edges if i_ in e_) for i_ in range(1, n_ + 1)]
        A &= all(sum(M_.row(i_)) == deg[i_] for i_ in range(n_))
        B &= (sum(M_) == len(edges))
        M2 = M_ ** 2
        C &= all(M2[i_, i_] == len(edges) for i_ in range(n_))
        D &= any(M_[i_, i_] == 1 for i_ in range(n_))
    # A は常に成り立つ。B・C・D は「常には成り立たない」ので、「必ず成り立つ」主張としては偽
    chk('mc3-02-L3-03', '300 個のグラフで 常に成り立つか A:%s B:%s C:%s D:%s' % (A, B, C, D), '各行の和＝次数', fixed([A, B, C, D]))
_()


def _():  # L3-04
    X = sp.Matrix([[2, 1, 3], [0, 4, 1]])
    p = sp.Matrix([[100], [50], [200]])
    res = X * p
    tot = sum(res)
    chk('mc3-02-L3-04', '売上 %s の合計' % list(res), tot, per(lambda c: _intc(c) == tot))
_()


def _():  # L3-05 K3 の A² の成分の和（辺 2 本の道の総数を数え上げ）
    M_ = _adj(3, [(1, 2), (2, 3), (1, 3)])
    tot = sum(_walks(M_, i_, j_, 2) for i_ in range(1, 4) for j_ in range(1, 4))
    assert tot == sum(M_ ** 2)
    chk('mc3-02-L3-05', 'K3 の辺 2 本の道の総数', tot, per(lambda c: _intc(c) == tot))
_()


def _():  # L4-01 ループつき 2 頂点：a から a へ辺 5 本
    M_ = sp.Matrix([[1, 1], [1, 0]])
    n5 = _walks(M_, 1, 1, 5)
    assert n5 == (M_ ** 5)[0, 0]
    chk('mc3-02-L4-01', 'a→…→a（辺 5 本）の道（数え上げ）A^5=%s' % list(M_ ** 5), n5, per(lambda c: _intc(c) == n5))
_()


def _():  # L4-02 S→{X,Y}→{U,V}→T の道の数を、全部の道を並べて数える
    sx = {'X': 2, 'Y': 3}
    xu = {('X', 'U'): 1, ('X', 'V'): 2, ('Y', 'U'): 2, ('Y', 'V'): 1}
    ut = {'U': 3, 'V': 2}
    tot = 0
    for a_ in 'XY':
        for b_ in 'UV':
            tot += sx[a_] * xu[(a_, b_)] * ut[b_]
    mat = (sp.Matrix([[2, 3]]) * sp.Matrix([[1, 2], [2, 1]]) * sp.Matrix([[3], [2]]))[0, 0]
    assert tot == mat
    chk('mc3-02-L4-02', 'S→T の道の総数', tot, per(lambda c: _intc(c) == tot))
_()


def _():  # L4-03 P² の (1,1) 成分
    P_ = sp.Matrix([[R(8, 10), R(2, 10)], [R(4, 10), R(6, 10)]])
    v = (P_ ** 2)[0, 0]
    chk('mc3-02-L4-03', '今日晴れ → 2 日後に晴れ', v, per(lambda c: sp.nsimplify(T(c)) == v))
_()


def _():  # L4-04 A² の対角成分の和 = 次数の和 = 2×辺の数（ランダムな 5 頂点グラフで確かめる）
    random.seed(5)
    for _t in range(200):
        edges = [(i_, j_) for i_ in range(1, 6) for j_ in range(i_ + 1, 6) if random.random() < 0.5]
        M_ = _adj(5, edges)
        assert (M_ ** 2).trace() == 2 * len(edges)
    E = 14 // 2
    chk('mc3-02-L4-04', 'tr(A²)=2×辺の数 → 辺の数', E, per(lambda c: _intc(c) == E))
_()


def _():  # L4-05 K4 で 1 から 1 へ辺 3 本
    M_ = _adj(4, [(i_, j_) for i_ in range(1, 5) for j_ in range(i_ + 1, 5)])
    n3 = _walks(M_, 1, 1, 3)
    assert n3 == (M_ ** 3)[0, 0]
    chk('mc3-02-L4-05', 'K4 で 1→…→1（辺 3 本）の道（数え上げ）', n3, per(lambda c: _intc(c) == n3))
_()


if __name__ == '__main__':
    only = sys.argv[1:] or None
    sys.exit(1 if run(only) else 0)
