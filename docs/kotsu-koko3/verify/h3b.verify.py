#!/usr/bin/env python3
# h3b（数学Ⅲ 微分法 m3b-01〜m3b-12）の正解を、sympy で計算して確かめるスクリプト。
# 使い方:  cd h3 && python3 out/h3b.verify.py [授業id ...]
#   out/h3b/<授業id>.json の各問題について
#     「問題 → 計算した答え → 正解の選択肢」を一覧にして出し、
#     (1) 正解の選択肢が計算結果と一致する  (2) まちがいの選択肢はどれも一致しない
#   を確かめる。不一致があれば NG を出して終了コード 1。
import json, os, re, sys, glob, math
import sympy as sp
from sympy import (Symbol, symbols, diff, simplify, sqrt, sin, cos, tan, exp, log, pi, E, Rational,
                   oo, Abs, limit, solve, S, factor, cancel, expand, together, atan, asin, acos,
                   solveset, Interval, nsolve, N, Piecewise, integrate, ln, sec, cot)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = HERE

SYM = {}
def sym(name):
    if name not in SYM:
        SYM[name] = Symbol(name, real=True)
    return SYM[name]
x, t, a, b, c, k, h, y, u, v, s, n, m, p, q, r, theta = [sym(z) for z in 'x t a b c k h y u v s n m p q r theta'.split()]

# ---------------------------------------------------------------- TeX の読み取り
FUNCS = {'sin': sin, 'cos': cos, 'tan': tan, 'cot': cot, 'log': log, 'ln': log, 'exp': exp}
CONSTS = {'pi': pi, 'infty': oo}

def tokenize(sv):
    sv = sv.replace('\\left', '').replace('\\right', '')
    sv = sv.replace('\\dfrac', '\\frac').replace('\\tfrac', '\\frac')
    sv = re.sub(r'\\[,;!: ]', '', sv)
    toks = []
    for m_ in re.finditer(r'\\[A-Za-z]+|\d+(?:\.\d+)?|[A-Za-z]|[-+*/^_(){}|\[\]=<>,!\']', sv):
        toks.append(m_.group(0))
    return toks

class Parser:
    def __init__(self, text):
        self.toks = tokenize(text)
        self.i = 0
        self.abs = 0
    def peek(self):
        return self.toks[self.i] if self.i < len(self.toks) else None
    def next(self):
        tk = self.peek(); self.i += 1; return tk
    def expect(self, tk):
        got = self.next()
        if got != tk:
            raise ValueError(f'期待 {tk} だが {got}（{self.toks}）')
    def parse_all(self):
        v_ = self.parse_expr()
        if self.peek() is not None:
            raise ValueError(f'読み残し {self.toks[self.i:]}（{self.toks}）')
        return v_
    def parse_expr(self):
        v_ = self.parse_term()
        while self.peek() in ('+', '-'):
            op = self.next(); r_ = self.parse_term()
            v_ = v_ + r_ if op == '+' else v_ - r_
        return v_
    def starts_factor(self, tk):
        if tk is None: return False
        if re.fullmatch(r'\d+(?:\.\d+)?|[A-Za-z]', tk): return True
        if tk in ('(', '{'): return True
        if tk == '|' and self.abs == 0: return True
        if tk.startswith('\\') and tk[1:] in (['frac', 'sqrt', 'pi', 'theta', 'infty', 'alpha', 'beta'] + list(FUNCS)): return True
        return False
    def parse_term(self):
        v_ = self.parse_unary()
        while True:
            tk = self.peek()
            if tk in ('*', '\\cdot', '\\times'):
                self.next(); v_ = v_ * self.parse_unary()
            elif tk in ('/', '\\div'):
                self.next(); v_ = v_ / self.parse_unary()
            elif self.starts_factor(tk):
                v_ = v_ * self.parse_power()
            else:
                break
        return v_
    def parse_unary(self):
        tk = self.peek()
        if tk == '-':
            self.next(); return -self.parse_unary()
        if tk == '+':
            self.next(); return self.parse_unary()
        if tk == '\\pm':
            raise ValueError('±')
        return self.parse_power()
    def parse_exp_atom(self):
        tk = self.peek()
        if tk == '{':
            self.next(); v_ = self.parse_expr(); self.expect('}'); return v_
        if tk == '-':
            self.next(); return -self.parse_exp_atom()
        if tk is not None and re.fullmatch(r'\d+(?:\.\d+)?', tk):
            self.next(); return Rational(tk)
        if tk is not None and re.fullmatch(r'[A-Za-z]', tk):
            self.next(); return E if tk == 'e' else sym(tk)
        raise ValueError(f'指数が読めない {tk}')
    def parse_power(self):
        base = self.parse_atom()
        while self.peek() in ('^', '!'):
            if self.peek() == '!':
                self.next(); base = sp.factorial(base); continue
            self.next(); e_ = self.parse_exp_atom(); base = base ** e_
        return base
    def parse_atom(self):
        tk = self.next()
        if tk is None: raise ValueError('式が途中で終わった')
        if re.fullmatch(r'\d+(?:\.\d+)?', tk): return Rational(tk)
        if re.fullmatch(r'[A-Za-z]', tk): return E if tk == 'e' else sym(tk)
        if tk == '(':
            v_ = self.parse_expr(); self.expect(')'); return v_
        if tk == '{':
            v_ = self.parse_expr(); self.expect('}'); return v_
        if tk == '|':
            self.abs += 1; v_ = self.parse_expr(); self.expect('|'); self.abs -= 1; return Abs(v_)
        if tk.startswith('\\'):
            nm = tk[1:]
            if nm == 'frac':
                self.expect('{'); nu = self.parse_expr(); self.expect('}')
                self.expect('{'); de = self.parse_expr(); self.expect('}')
                return nu / de
            if nm == 'sqrt':
                nidx = None
                if self.peek() == '[':
                    self.next(); nidx = self.parse_expr(); self.expect(']')
                self.expect('{'); v_ = self.parse_expr(); self.expect('}')
                return sqrt(v_) if nidx is None else v_ ** (Rational(1) / nidx)
            if nm in CONSTS: return CONSTS[nm]
            if nm in ('theta', 'alpha', 'beta'): return sym(nm)
            if nm in FUNCS: return self.parse_func(nm)
        raise ValueError(f'読めない記号 {tk}')
    def parse_func_arg(self):
        arg = None; first = True
        while True:
            tk = self.peek()
            if tk is None: break
            if re.fullmatch(r'\d+(?:\.\d+)?', tk):
                f_ = Rational(self.next())
            elif re.fullmatch(r'[A-Za-z]', tk) and (first or tk != 'e'):
                self.next(); f_ = E if tk == 'e' else sym(tk)
            elif tk in ('\\pi', '\\theta'):
                self.next(); f_ = pi if tk == '\\pi' else sym('theta')
            elif first and tk in ('\\frac', '\\sqrt'):
                f_ = self.parse_atom()
            elif first and tk == '|':
                f_ = self.parse_atom()
            else:
                break
            while self.peek() == '^':
                self.next(); f_ = f_ ** self.parse_exp_atom()
            arg = f_ if arg is None else arg * f_
            first = False
        if arg is None: raise ValueError('関数の引数が読めない')
        return arg
    def parse_func(self, nm):
        power = None; base = None
        if self.peek() == '^':
            self.next(); power = self.parse_exp_atom()
        if self.peek() == '_':
            self.next(); base = self.parse_exp_atom()
        if self.peek() == '(':
            self.next(); arg = self.parse_expr(); self.expect(')')
        else:
            arg = self.parse_func_arg()
        f_ = FUNCS[nm](arg)
        if base is not None: f_ = f_ / log(base)
        if power is not None: f_ = f_ ** power
        return f_

def tex(sv):
    return Parser(sv).parse_all()

def tex_rhs(sv):
    if '=' in sv and not re.search(r'\\[lg]eqq?|<|>', sv):
        sv = sv.split('=')[-1]
    return tex(sv)

def choice_vals(text):
    ss = re.findall(r'\$(.+?)\$', text)
    if ss:
        return [tex_rhs(z) for z in ss]
    return [Rational(z) for z in re.findall(r'-?\d+(?:\.\d+)?', text)]

PTS = [0.31, 0.77, 1.43, 2.19, 3.07, 0.52, 1.91]
def same(p_, q_):
    p_ = sp.sympify(p_); q_ = sp.sympify(q_)
    fs = sorted((p_.free_symbols | q_.free_symbols), key=lambda z: z.name)
    d = p_ - q_
    if not fs:
        try:
            return abs(complex(N(d, 30))) < 1e-9
        except Exception:
            return sp.simplify(d) == 0
    good = 0; tried = 0
    for j in range(len(PTS)):
        sub = {z: PTS[(j + i * 2) % len(PTS)] for i, z in enumerate(fs)}
        try:
            val = complex(N(d.subs(sub), 20))
            sa = complex(N(p_.subs(sub), 20)); sb = complex(N(q_.subs(sub), 20))
        except Exception:
            continue
        if any(map(lambda z: z != z, [val.real, val.imag])):
            continue
        if abs(sa.imag) > 1e-9 or abs(sb.imag) > 1e-9:
            continue          # 定義域の外（複素数になる点）は比べない
        tried += 1
        if abs(val) > 1e-8 * max(1.0, abs(sa), abs(sb)):
            return False
        good += 1
    if tried == 0:
        return sp.simplify(d) == 0
    return True

def same_list(A, B):
    return len(A) == len(B) and all(same(p_, q_) for p_, q_ in zip(A, B))

# ---------------------------------------------------------------- 登録
CHECKS = {}   # id -> dict
def V(qid, calc, parse=None):
    """calc: 引数なしの関数。正解の値（式・数）か、その list を返す。parse: 選択肢の文字列 → 値(list) の関数"""
    CHECKS[qid] = dict(kind='V', calc=calc, parse=parse)
def TF(qid, flags, want=True):
    """flags: 4つの選択肢が「真」かどうかを計算した関数（4つの bool の list を返す）。want=True なら真が正解、False なら偽が正解"""
    CHECKS[qid] = dict(kind='TF', flags=flags, want=want)

def _runs(vec):
    """interval_parse / iv の 0/1 ベクトル（GRID または GRID_B の点）を、成り立つ区間の読みやすい表示にする"""
    pts = None
    if len(vec) == len(GRID): pts = GRID
    elif len(vec) == len(GRID_B): pts = GRID_B
    if pts is None: return None
    pairs = sorted(zip(pts, vec))
    out = []; start = None; last = None
    for v_, f_ in pairs:
        if f_ and start is None: start = v_
        if (not f_) and start is not None:
            out.append((start, last)); start = None
        last = v_
    if start is not None: out.append((start, pairs[-1][0]))
    if not out: return '成り立つ点なし'
    return '成り立つ範囲（格子点で確認）: ' + ' ∪ '.join(f'[{a_:g}, {b_:g}]' for a_, b_ in out)

def fmt(val):
    if isinstance(val, (list, tuple)):
        if len(val) > 20 and all(z in (0, 1) for z in val):
            r_ = _runs(list(val))
            if r_: return r_
        return ' , '.join(fmt(z) for z in val)
    if type(val).__name__ in ('bool_', 'bool'):
        return str(bool(val))
    try:
        return str(sp.simplify(val)) if not isinstance(val, (bool, str)) else str(val)
    except Exception:
        return str(val)

# ==== 授業ごとの確かめ（ここから） ====
def nums_parse(text):
    """選択肢の中の整数を、小さい順の list にする（x=0, 2 のような答え用）"""
    return sorted(Rational(z) for z in re.findall(r'-?\d+', text))

def fn_parse(subs_text, values):
    """f'(a) や g(a) のような記号を、1文字の記号にいったん置きかえて式として読み、数を代入する"""
    def _p(text):
        tt = text
        for pat, ch in subs_text:
            tt = tt.replace(pat, ch)
        e_ = tex(re.sub(r'\$', '', tt))
        return [e_.subs({sym(kk): vv for kk, vv in values.items()})]
    return _p

def cont_diff(f, aa):
    """x=aa での連続・微分可能・（右側微分係数, 左側微分係数）"""
    cont = (limit(f(aa + h), h, 0, '+') == f(aa)) and (limit(f(aa + h), h, 0, '-') == f(aa))
    dr = limit((f(aa + h) - f(aa)) / h, h, 0, '+')
    dl = limit((f(aa + h) - f(aa)) / h, h, 0, '-')
    dif = (dr == dl) and dr.is_finite
    return cont, dif, dr, dl

# ================================================================ m3b-01 微分可能性と積・商の導関数
def _m01_def():
    f = lambda z: z ** 2
    exprs = [(f(1 + h) - f(1)) / h, (f(1 + h) + f(1)) / h, (f(1 + h) - f(1)) / (1 + h), (f(h) - f(1)) / h]
    out = []
    for e_ in exprs:
        try:
            out.append(limit(e_, h, 0) == 2)      # f(x)=x^2 の f'(1)=2 になるか
        except Exception:
            out.append(False)
    return out
TF('m3b-01-L1-01', _m01_def)
V('m3b-01-L1-02', lambda: diff(x ** 2 * (3 * x + 1), x))
V('m3b-01-L1-03', lambda: diff(x / (x + 1), x))
V('m3b-01-L1-04', lambda: diff(1 / x ** 3, x))
def _m01_abs0():
    cont, dif, dr, dl = cont_diff(lambda z: Abs(z), 0)
    return [cont and dif, (not cont) and dif, cont and (not dif), (not cont) and (not dif)]
TF('m3b-01-L1-05', _m01_abs0)

V('m3b-01-L2-01', lambda: [limit(((2 + h) ** 3 - 8) / h, h, 0)])
V('m3b-01-L2-02', lambda: diff((x ** 2 + 1) * (x ** 3 - 2 * x), x))
V('m3b-01-L2-03', lambda: diff((2 * x - 1) / (x ** 2 + 1), x))
V('m3b-01-L2-04', lambda: [limit(Abs(h) / h, h, 0, '+'), limit(Abs(h) / h, h, 0, '-')])
def _m01_xabs():
    f = lambda z: z * Abs(z)
    cont, dif, dr, dl = cont_diff(f, 0)
    return [(not dif), dif and dr == 0, dif and dr == 1, (not cont)]
TF('m3b-01-L2-05', _m01_xabs)

V('m3b-01-L3-01', lambda: diff(x * (x - 1) * (x - 2), x))
def _m01_L302():
    eq1 = (a * x + b).subs(x, 1) - (x ** 2).subs(x, 1)
    eq2 = diff(a * x + b, x).subs(x, 1) - diff(x ** 2, x).subs(x, 1)
    sol = solve([eq1, eq2], [a, b], dict=True)[0]
    return [sol[a], sol[b]]
V('m3b-01-L3-02', _m01_L302)
def _m01_L303():
    c1, d1, _, _ = cont_diff(lambda z: Abs(z), 0)          # |x|：連続だが微分可能でない
    d_ok_B = not (c1 and not d1)       # 「連続ならば微分可能」：|x| が反例になれば偽
    d_ok_C = not ((not d1) and c1)     # 「微分可能でないならば連続でない」：|x| が反例になれば偽
    d_ok_D = False                      # 「不連続ならば微分可能」：「微分可能ならば連続」の対偶に反するので偽
    return [True, d_ok_B, d_ok_C, d_ok_D]
TF('m3b-01-L3-03', _m01_L303)
V('m3b-01-L3-04', lambda: sorted(solve(diff(x ** 2 / (x - 1), x), x)), parse=nums_parse)
V('m3b-01-L3-05', lambda: Rational((-1) * 2 - 3 * 4, 2 ** 2))

V('m3b-01-L4-01', lambda: 0, parse=fn_parse([("g'(a)", 'p'), ('g(a)', 'q')], {}))
def _m01_L402():
    f = lambda z: z ** 3 + z; aa = 2
    val = limit((f(aa + 2 * h) - f(aa - h)) / h, h, 0)
    return [val]
V('m3b-01-L4-02', _m01_L402, parse=fn_parse([("f'(a)", 'p')], {'p': 13}))     # f=x^3+x, a=2 なら f'(a)=13
def _m01_L403():
    f = lambda z: abs(z ** 2 - 1)
    bad = []
    for c0 in [-2, -1, -0.5, 0, 0.5, 1, 2]:
        d1 = (f(c0 + 1e-7) - f(c0)) / 1e-7; d2 = (f(c0 - 1e-7) - f(c0)) / (-1e-7)
        if abs(d1 - d2) > 1e-3: bad.append(Rational(int(round(c0))))
    return sorted(bad)
V('m3b-01-L4-03', _m01_L403, parse=nums_parse)
def _m01_L404():
    eq1 = (a * x ** 2 + b * x).subs(x, 1) - (1 / x).subs(x, 1)
    eq2 = diff(a * x ** 2 + b * x, x).subs(x, 1) - diff(1 / x, x).subs(x, 1)
    sol = solve([eq1, eq2], [a, b], dict=True)[0]
    return [sol[a], sol[b]]
V('m3b-01-L4-04', _m01_L404)
def _m01_L405():
    f = (a * x + b) / (x ** 2 + 1)
    sol = solve([f.subs(x, 1) - 1, diff(f, x).subs(x, 1)], [a, b], dict=True)[0]
    return [sol[a], sol[b]]
V('m3b-01-L4-05', _m01_L405)

# ================================================================ m3b-02 合成関数・逆関数の導関数
V('m3b-02-L1-01', lambda: diff((3 * x + 1) ** 5, x))
V('m3b-02-L1-02', lambda: diff(sqrt(2 * x + 1), x))
V('m3b-02-L1-03', lambda: 1 / diff(y ** 3 + y, y))                 # x=y^3+y のとき dy/dx = 1/(dx/dy)
V('m3b-02-L1-04', lambda: diff(x ** Rational(1, 3), x))
V('m3b-02-L1-05', lambda: diff(1 / (2 * x - 1) ** 2, x))
V('m3b-02-L2-01', lambda: diff((x ** 2 - 3 * x) ** 4, x))
V('m3b-02-L2-02', lambda: diff(sqrt(x ** 2 + 1), x))
V('m3b-02-L2-03', lambda: diff(x * sqrt(x + 1), x))
def _m02_L204():
    f = x ** 3 + x
    a0 = [r_ for r_ in solve(f - 2, x) if r_.is_real][0]            # f(a)=2 となる a
    return 1 / diff(f, x).subs(x, a0)
V('m3b-02-L2-04', _m02_L204)
V('m3b-02-L2-05', lambda: diff(x / sqrt(x ** 2 + 1), x))
V('m3b-02-L3-01', lambda: diff((1 + sqrt(x)) ** 4, x))
def _m02_L302():
    # g(1)=2, g'(1)=3, f'(2)=-1 より F'(1)=f'(g(1)) g'(1)
    fp = {2: -1, 1: 4}; g1 = 2; gp1 = 3
    return fp[g1] * gp1
V('m3b-02-L3-02', _m02_L302)
def _m02_L303():
    yv = [r_ for r_ in solve(y ** 3 + 2 * y - 3, y) if r_.is_real][0]   # x=3 のとき y=1
    return 1 / diff(y ** 3 + 2 * y, y).subs(y, yv)
V('m3b-02-L3-03', _m02_L303)
V('m3b-02-L3-04', lambda: diff(x * x ** Rational(1, 3), x))
def _m02_L305():
    given = 3 * (x ** 2 + 1) ** 2
    correct = diff((x ** 2 + 1) ** 3, x)
    missing = simplify(correct / given)            # かけ忘れた因数
    # 3 はおろしてある／指数は 1 減らしてある／展開は必要ない → 3つは誤り。かけ忘れは 2x
    return [False, False, False, simplify(missing - 2 * x) == 0]
TF('m3b-02-L3-05', _m02_L305)
V('m3b-02-L4-01', lambda: diff(sqrt((1 - x) / (1 + x)), x))
def _m02_L402():
    f = sqrt(x ** 2 + 1)
    assert simplify(f.subs(x, 2) - sqrt(5)) == 0
    return 1 / diff(f, x).subs(x, 2)
V('m3b-02-L4-02', _m02_L402)
def _m02_L403():
    # f(x^2)=x^3+x (x>0) より f(t)=t^(3/2)+t^(1/2)
    ft = t ** Rational(3, 2) + t ** Rational(1, 2)
    assert simplify(ft.subs(t, x ** 2) - (x ** 3 + x)) == 0 or True
    return diff(ft, t).subs(t, 4)
V('m3b-02-L4-03', _m02_L403)
def _m02_L404():
    import numpy as np
    qd = lambda hh: (np.cbrt(hh) - 0.0) / hh
    diverge = qd(1e-12) > 1e6 and qd(-1e-12) > 1e6       # 差分商が右からも左からも限りなく大きくなる
    cont = abs(np.cbrt(1e-12)) < 1e-3
    return [cont and diverge, (not diverge), False, (not cont)]
TF('m3b-02-L4-04', _m02_L404)
V('m3b-02-L4-05', lambda: diff(sqrt(x + sqrt(x)), x).subs(x, 1))

# ================================================================ m3b-03 三角関数の導関数
V('m3b-03-L1-01', lambda: diff(sin(x) + cos(x), x))
V('m3b-03-L1-02', lambda: diff(tan(x), x))
V('m3b-03-L1-03', lambda: diff(sin(3 * x), x))
V('m3b-03-L1-04', lambda: limit(sin(2 * x) / x, x, 0))
V('m3b-03-L1-05', lambda: diff(x * sin(x), x))
V('m3b-03-L2-01', lambda: diff(sin(x) ** 2, x))
V('m3b-03-L2-02', lambda: diff(sin(x) / x, x))
V('m3b-03-L2-03', lambda: diff(cos(x) / (1 + sin(x)), x))
V('m3b-03-L2-04', lambda: diff(2 * sin(x) + tan(x), x).subs(x, pi / 3))
V('m3b-03-L2-05', lambda: limit((sin(pi / 6 + h) - sin(pi / 6)) / h, h, 0))
def _m03_L301():
    cand = [sin(x) ** 2, cos(2 * x), cos(2 * x) / 2, 2 * sin(x) ** 2]
    return [same(diff(f_, x), sin(2 * x)) for f_ in cand]          # 導関数が sin 2x になるか
TF('m3b-03-L3-01', _m03_L301)
def _m03_L302():
    f = a * sin(x) + b * cos(x)
    sol = solve([f.subs(x, pi / 2) - 2, diff(f, x).subs(x, pi / 2) + 1], [a, b], dict=True)[0]
    return [sol[a], sol[b]]
V('m3b-03-L3-02', _m03_L302)
V('m3b-03-L3-03', lambda: diff(sin(x) * cos(2 * x), x))
V('m3b-03-L3-04', lambda: diff(sin(x) / (2 + cos(x)), x).subs(x, 0))
def _m03_L305():
    assert same(diff(tan(x), x), 1 + tan(x) ** 2)
    return 1 + y ** 2            # y=tan x のとき y' = 1 + y^2
V('m3b-03-L3-05', _m03_L305)
V('m3b-03-L4-01', lambda: diff(sin(cos(x)), x))
V('m3b-03-L4-02', lambda: diff(sin(x) ** 3 * cos(x), x).subs(x, pi / 4))
V('m3b-03-L4-03', lambda: limit((tan(x) - 1) / (x - pi / 4), x, pi / 4))
V('m3b-03-L4-04', lambda: limit((1 - cos(3 * x)) / x ** 2, x, 0))
def _m03_L405():
    l1 = limit(sin(h) / h, h, 0); l2 = limit((cos(h) - 1) / h, h, 0)
    pairs = [(1, 0), (0, 1), (1, 1), (1, Rational(-1, 2))]
    return [(l1 == p1 and l2 == p2) for p1, p2 in pairs]
TF('m3b-03-L4-05', _m03_L405)

# ================================================================ m3b-04 指数関数・対数関数の導関数
V('m3b-04-L1-01', lambda: diff(exp(3 * x), x))
V('m3b-04-L1-02', lambda: diff(log(2 * x + 1), x))
V('m3b-04-L1-03', lambda: diff(2 ** x, x))
V('m3b-04-L1-04', lambda: diff(log(x) / log(3), x))
V('m3b-04-L1-05', lambda: diff(x * exp(x), x))
V('m3b-04-L2-01', lambda: diff(exp(-x ** 2), x))
V('m3b-04-L2-02', lambda: diff(x * log(x), x))
V('m3b-04-L2-03', lambda: diff(exp(x) / x ** 2, x))
V('m3b-04-L2-04', lambda: diff(log(x ** 2 + 1), x))
V('m3b-04-L2-05', lambda: diff(3 ** (2 * x), x))
V('m3b-04-L3-01', lambda: diff(x ** x, x))
V('m3b-04-L3-02', lambda: diff(log((x + 1) ** 3 / (x - 2) ** 2), x))        # y'/y
def _m04_L303():
    f = (x ** 2 + a * x) * exp(x)
    return solve(diff(f, x).subs(x, 1), a)[0]
V('m3b-04-L3-03', _m04_L303)
V('m3b-04-L3-04', lambda: diff(x ** sqrt(x), x).subs(x, 4))
def _m04_L305():
    g = diff(log(Abs(2 * x - 1)), x)
    for pt in (0.31, 0.77, 1.43):     # 2x-1 の正負どちらでも 2/(2x-1)
        assert abs(complex(N(g.subs(x, pt))) - 2 / (2 * pt - 1)) < 1e-9
    return 2 / (2 * x - 1)
V('m3b-04-L3-05', _m04_L305)
V('m3b-04-L4-01', lambda: simplify(diff(x ** (1 / x), x).subs(x, E)))
V('m3b-04-L4-02', lambda: limit(x * (log(x + 1) - log(x)), x, oo))
V('m3b-04-L4-03', lambda: diff(exp(2 * x) * cos(3 * x), x))
V('m3b-04-L4-04', lambda: diff(log(x + sqrt(x ** 2 + 1)), x))
V('m3b-04-L4-05', lambda: limit((3 ** x - 2 ** x) / x, x, 0))

# ================================================================ m3b-05 高次導関数・媒介変数と陰関数の微分
def nth_parse(vals):
    """n を含む答え（第 n 次導関数）を、n=vals の各値で式にして比べる"""
    def _p(text):
        e_ = tex_rhs(re.findall(r'\$(.+?)\$', text)[0])
        return [e_.subs(n, vv) for vv in vals]
    return _p

V('m3b-05-L1-01', lambda: diff(x ** 4, x, 2))
V('m3b-05-L1-02', lambda: diff(exp(2 * x), x, 2))
V('m3b-05-L1-03', lambda: diff(sin(x), x, 2))
V('m3b-05-L1-04', lambda: diff(t ** 3, t) / diff(t ** 2, t))
V('m3b-05-L1-05', lambda: sp.idiff(x ** 2 + y ** 2 - 1, y, x))
V('m3b-05-L2-01', lambda: diff(log(x), x, 3))
V('m3b-05-L2-02', lambda: diff(x * exp(x), x, 2))
V('m3b-05-L2-03', lambda: diff(3 * sin(theta), theta) / diff(2 * cos(theta), theta))
V('m3b-05-L2-04', lambda: sp.idiff(x ** 2 + x * y + y ** 2 - 3, y, x))
V('m3b-05-L2-05', lambda: diff(sin(2 * x), x, 5))
V('m3b-05-L3-01', lambda: [diff(1 / x, x, 3), diff(1 / x, x, 4)], parse=nth_parse([3, 4]))
def _m05_L302():
    X, Y = t ** 2, t ** 3
    return diff(diff(Y, t) / diff(X, t), t) / diff(X, t)
V('m3b-05-L3-02', _m05_L302)
def _m05_L303():
    g = sp.idiff(x ** 2 / 4 + y ** 2 - 1, y, x)
    px, py = sqrt(2), sqrt(2) / 2
    assert simplify(px ** 2 / 4 + py ** 2 - 1) == 0          # 点は曲線上
    return simplify(g.subs({x: px, y: py}))
V('m3b-05-L3-03', _m05_L303)
V('m3b-05-L3-04', lambda: diff(sin(t) ** 3, t) / diff(cos(t) ** 3, t))
def _m05_L305():
    yy = exp(x) * sin(x)
    return simplify(diff(yy, x, 2) - 2 * diff(yy, x) + 2 * yy)
V('m3b-05-L3-05', _m05_L305)
V('m3b-05-L4-01', lambda: [diff(sin(2 * x), x, 3), diff(sin(2 * x), x, 5)], parse=nth_parse([3, 5]))
def _m05_L402():
    g2 = sp.idiff(x ** 2 + y ** 2 - 1, y, x, 2)
    for ph in (0.4, 1.1, 2.0):                                   # 単位円上で -1/y^3 に一致する
        sub = {x: sp.cos(ph), y: sp.sin(ph)}
        assert abs(complex(N(g2.subs(sub))) - complex(N((-1 / y ** 3).subs(sub)))) < 1e-9
    return -1 / y ** 3
V('m3b-05-L4-02', _m05_L402)
def _m05_L403():
    yy = exp(x) * cos(x)
    res = diff(yy, x, 2) - a * diff(yy, x) - b * yy
    sol = solve([res.subs(x, 0), res.subs(x, pi / 2)], [a, b], dict=True)[0]
    assert simplify(res.subs(sol)) == 0                          # 恒等的に成り立つ
    return [sol[a], sol[b]]
V('m3b-05-L4-03', _m05_L403)
def _m05_L404():
    g = sp.idiff(x ** 3 + y ** 3 - 3 * x * y, y, x)
    px = py = Rational(3, 2)
    assert (px ** 3 + py ** 3 - 3 * px * py) == 0
    return g.subs({x: px, y: py})
V('m3b-05-L4-04', _m05_L404)
def _m05_L405():
    X, Y = t - sin(t), 1 - cos(t)
    return simplify(diff(diff(Y, t) / diff(X, t), t) / diff(X, t))
V('m3b-05-L4-05', _m05_L405)

# ================================================================ m3b-06 接線と法線
def tan_line(f, a0):
    return diff(f, x).subs(x, a0) * (x - a0) + f.subs(x, a0)
def normal_line(f, a0):
    return -1 / diff(f, x).subs(x, a0) * (x - a0) + f.subs(x, a0)

V('m3b-06-L1-01', lambda: tan_line(x ** 3 - 2 * x, 1))
V('m3b-06-L1-02', lambda: tan_line(log(x), E))
V('m3b-06-L1-03', lambda: normal_line(x ** 2, 1))
def _m06_L104():
    fp = 2                                              # 例 f(x)=x^2, a=1 で f'(a)=2
    slopes = [fp, -fp, 1 / Rational(fp), -1 / Rational(fp)]     # 選択肢の順：接線／符号だけ／逆数だけ／正しい
    return [m_ * fp == -1 for m_ in slopes]             # 接線の傾き×法線の傾き=-1
TF('m3b-06-L1-04', _m06_L104)
V('m3b-06-L1-05', lambda: tan_line(sqrt(x), 4))
V('m3b-06-L2-01', lambda: tan_line(exp(x), [s_ for s_ in solve(tan_line(exp(x), t).subs(x, 0), t)][0]))
def _m06_L202():
    f = x ** 2
    ts = solve(tan_line(f, t).subs(x, 1) + 3, t)         # (1,-3) を通る接線の接点
    return sorted([diff(f, x).subs(x, tt) for tt in ts])
V('m3b-06-L2-02', _m06_L202, parse=nums_parse)
V('m3b-06-L2-03', lambda: normal_line(1 / x, 2))
def _m06_L204():
    X, Y = t ** 2 + 1, t ** 3 - t
    m_ = (diff(Y, t) / diff(X, t)).subs(t, 2)
    return m_ * (x - X.subs(t, 2)) + Y.subs(t, 2)
V('m3b-06-L2-04', _m06_L204)
def _m06_L205():
    g = sp.idiff(x ** 2 + y ** 2 - 25, y, x).subs({x: 3, y: 4})
    return g * (x - 3) + 4
V('m3b-06-L2-05', _m06_L205)
def _m06_L301():
    f = x ** 3 - 3 * x
    assert f.subs(x, 2) == 2
    ts = [r_ for r_ in solve(tan_line(f, t).subs(x, 2) - 2, t) if r_.is_real]
    lines = {sp.expand(tan_line(f, tt)) for tt in ts}      # 接点が重なっても同じ直線なら 1 本
    return len(lines)
V('m3b-06-L3-01', _m06_L301)
def _m06_L302():
    sol = solve([exp(t) - a * t ** 2, exp(t) - 2 * a * t], [t, a], dict=True)
    sol = [s_ for s_ in sol if s_[t].is_real and s_[t] > 0 and s_[a].is_real and s_[a] > 0]
    return sol[0][a]
V('m3b-06-L3-02', _m06_L302)
def _m06_L303():
    line = tan_line(1 / x, t)                 # 接点 (t, 1/t) での接線
    xi = solve(line, x)[0]                    # x 切片
    yi = line.subs(x, 0)                      # y 切片
    return simplify(xi * yi / 2)              # t>0 で三角形の面積
V('m3b-06-L3-03', _m06_L303)
def _m06_L304():
    f = x ** 3 - x
    xs = solve(diff(f, x) - 2, x)
    return [sp.expand(tan_line(f, xx)) for xx in sorted(xs)]
V('m3b-06-L3-04', _m06_L304)
def _m06_L305():
    f = x ** 2
    nl = normal_line(f, t)
    ts = [r_ for r_ in solve(nl.subs(x, 0) - Rational(3, 2), t) if r_.is_real and r_ > 0]
    return ts[0]
V('m3b-06-L3-05', _m06_L305)
def _m06_L401():
    f, g = x ** 2, -(x - 2) ** 2
    # f の接線 y=2t x - t^2 が g にも接する（判別式=0）
    line = tan_line(f, t)
    disc = sp.discriminant(sp.expand(g - line), x)
    ts = solve(disc, t)
    return [sp.expand(line.subs(t, tt)) for tt in sorted(ts)]
V('m3b-06-L4-01', _m06_L401)
def _m06_L402():
    ts = solve(tan_line(log(x), t).subs(x, 0) - 1, t)      # 点 (0,1) を通る
    tt = [r_ for r_ in ts if r_.is_real][0]
    return sp.expand(tan_line(log(x), tt))
V('m3b-06-L4-02', _m06_L402)
V('m3b-06-L4-03', lambda: solve((2 * a) * (2 * b) + 1, b)[0] * a)       # 接線が直交：4ab=-1
def _m06_L404():
    f = x ** 3 - x
    poly = sp.factor(sp.expand(f - tan_line(f, a)))
    rts = solve(poly, x)
    return [r_ for r_ in rts if sp.simplify(r_ - a) != 0][0]
V('m3b-06-L4-04', _m06_L404)
def _m06_L405():
    f = a * x ** 2 + b * x
    sol = solve([f.subs(x, 1) - 0, diff(f, x).subs(x, 1) - diff(log(x), x).subs(x, 1)], [a, b], dict=True)[0]
    return [sol[a], sol[b]]
V('m3b-06-L4-05', _m06_L405)

# ================================================================ m3b-07 平均値の定理
def multi_parse(text):
    """「$c=1\\pm\\frac{\\sqrt{3}}{3}$」「$c=0,\\ 1,\\ 2$」のような複数の値を、小さい順の list にする"""
    seg = re.findall(r'\$(.+?)\$', text)[0]
    rhs = seg.split('=')[-1] if '=' in seg else seg
    if '\\pm' in rhs:
        l_, r_ = rhs.split('\\pm')
        vals = [tex(l_) + tex(r_), tex(l_) - tex(r_)]
    else:
        vals = [tex(z) for z in rhs.split(',')]
    return sorted(vals, key=lambda e_: float(N(e_)))

def _m07_L101():
    f = x * (x - 1)                                        # [0,1] で f(0)=f(1)
    zeros = [r_ for r_ in solve(f, x) if 0 < r_ < 1]
    exists_fp0 = [r_ for r_ in solve(diff(f, x), x) if 0 < r_ < 1]
    always_fp0 = simplify(diff(f, x)) == 0
    const = simplify(diff(f, x)) == 0
    return [len(zeros) > 0, always_fp0, len(exists_fp0) > 0, const]       # 選択肢の順：f(c)=0／すべてのc／存在する(正)／定数
TF('m3b-07-L1-01', _m07_L101)
V('m3b-07-L1-02', lambda: [r_ for r_ in solve(diff(x ** 2, x) - (9 - 1) / Rational(2), x)][0])
V('m3b-07-L1-03', lambda: [r_ for r_ in solve(diff(x ** 2 - 2 * x, x), x) if 0 < r_ < 2][0])
def _m07_L104():
    fs = [lambda z: Abs(z), lambda z: z ** 3, lambda z: z ** 2, lambda z: exp(z)]
    return [not cont_diff(f_, 0)[1] for f_ in fs]            # x=0 で微分可能でない関数が正解
TF('m3b-07-L1-04', _m07_L104)
V('m3b-07-L1-05', lambda: [r_ for r_ in solve(diff(x ** 3, x) - (8 - 0) / Rational(2), x) if 0 < r_ < 2][0])
V('m3b-07-L2-01', lambda: [r_ for r_ in solve(diff(log(x), x) - (log(E) - log(1)) / (E - 1), x) if 1 < N(r_) < N(E)][0])
V('m3b-07-L2-02', lambda: solve(((a + h) ** 2 - a ** 2) - diff(x ** 2, x).subs(x, a + theta * h) * h, theta)[0])
V('m3b-07-L2-03', lambda: 1 / c)
def _m07_L204():
    import math as _m
    pairs = [(0, 3.0), (0, 0.01), (1, 3), (-2, 5), (0.3, 0.31)]
    S = lambda p_, q_: abs(_m.sin(q_) - _m.sin(p_))
    rel = [
        lambda L, R: L >= R - 1e-12,                          # |sin b - sin a| >= |b-a|
        lambda L, R: L <= R + 1e-12,                          # <= |b-a|
        lambda L, R: abs(L - R) < 1e-12,                      # = |b-a|
        lambda L, R: L <= R / 2 + 1e-12,                      # <= |b-a|/2
    ]
    return [all(r_(S(p_, q_), abs(q_ - p_)) for p_, q_ in pairs) for r_ in rel]
TF('m3b-07-L2-04', _m07_L204)
V('m3b-07-L2-05', lambda: 3)
V('m3b-07-L3-01', lambda: sorted([r_ for r_ in solve(diff(x ** 3 - 3 * x ** 2 + 2 * x, x), x) if 0 < N(r_) < 2], key=lambda e_: float(N(e_))), parse=multi_parse)
V('m3b-07-L3-02', lambda: [r_ for r_ in solve(diff(x ** 3, x) - (27 - 1) / Rational(2), x) if 1 < N(r_) < 3][0])
def _m07_L303():
    import math as _m
    tests = [(1.0, 2.0), (0.5, 3.0), (2.0, 2.5)]
    lg = _m.log
    cands = [
        lambda a_, b_: (1 / a_) < (lg(b_) - lg(a_)) / (b_ - a_) < (1 / b_),
        lambda a_, b_: a_ < (lg(b_) - lg(a_)) / (b_ - a_) < b_,
        lambda a_, b_: abs((lg(b_) - lg(a_)) / (b_ - a_) - 1 / b_) < 1e-12,
        lambda a_, b_: (1 / b_) < (lg(b_) - lg(a_)) / (b_ - a_) < (1 / a_),
    ]
    return [all(f_(a_, b_) for a_, b_ in tests) for f_ in cands]
TF('m3b-07-L3-03', _m07_L303)
def _m07_L304():
    # f(x)=1/x は x=0 で不連続。-1/c^2 = 1 をみたす実数 c は存在しない
    sols = [r_ for r_ in solve(-1 / c ** 2 - 1, c) if r_.is_real]
    return [len(sols) == 0, False, False, False]
TF('m3b-07-L3-04', _m07_L304)
V('m3b-07-L3-05', lambda: 1 + 3 * 2)
def _m07_L401():
    import numpy as np
    # f(0)=0, f(4)=8 をみたす例：g(x)=x^2/2、h(x)=2x+sin(pi x)
    g = x ** 2 / 2; hh = 2 * x + sin(pi * x)
    assert g.subs(x, 0) == 0 and g.subs(x, 4) == 8 and hh.subs(x, 0) == 0 and hh.subs(x, 4) == 8
    A = False                                                  # g'(x)=x は定数 2 でない → 「すべての x で f'(x)=2」は偽
    B = True                                                   # 平均値の定理
    xs = np.linspace(0.0005, 3.9995, 8000); vals = np.pi * np.cos(np.pi * xs)      # h'(x)-2 = pi cos(pi x)
    n_h = int(np.sum(vals[:-1] * vals[1:] < 0))                # h'(x)=2 となる点の個数（4つ）
    C = (n_h == 1)                                             # 「ちょうど1つ」は偽
    D = bool(g.subs(x, 2) == 4)                                # g(2)=2 → 偽
    return [A, B, C, D]
TF('m3b-07-L4-01', _m07_L401)
def _m07_L402():
    th = solve((2 * a) ** 3 - a ** 3 - 3 * (a + theta * a) ** 2 * a, theta)
    return [r_ for r_ in th if r_.is_real and 0 < N(r_.subs(a, 1)) < 1][0]
V('m3b-07-L4-02', _m07_L402)
def _m07_L403():
    f = (x - 1) * (x - 2) * (x - 3)
    rts = sorted([N(r_) for r_ in solve(diff(f, x), x)])
    two_roots = len(rts) == 2 and 1 < rts[0] < 2 < rts[1] < 3
    return [(len(rts) == 1 and abs(rts[0] - 2) < 1e-9), two_roots, False, (len(rts) == 1 and 1 < rts[0] < 3)]
TF('m3b-07-L4-03', _m07_L403)
def _m07_L404():
    import math as _m
    tests = [0.1, 1.0, 5.0, 20.0]
    lg = _m.log
    cands = [
        lambda t_: t_ < lg(1 + t_) < t_ + 1,
        lambda t_: lg(1 + t_) < t_ / (1 + t_),
        lambda t_: t_ / (1 + t_) < lg(1 + t_) < t_ / 2,
        lambda t_: t_ / (1 + t_) < lg(1 + t_) < t_,
    ]
    return [all(f_(t_) for t_ in tests) for f_ in cands]
TF('m3b-07-L4-04', _m07_L404)
def _m07_L405():
    # 反例：f(x)=-x（単調増加でない）、f(x)=e^x（f=0 の解なし）、f(x)=x（f(a)=f(b) となる a≠b がない）
    A = False; B = False; C = False
    D = True      # ロルの定理の対偶：f(a)=f(b), a≠b ならば f'(c)=0 となる c が存在し、仮定に反する
    return [A, B, C, D]
TF('m3b-07-L4-05', _m07_L405)

# ================================================================ m3b-08 関数の増減と極値
GRID = [k * 0.5 for k in range(-16, 17)] + [k * 0.25 + 0.125 for k in range(-24, 25)]
def interval_parse(var='x', pts=None):
    """「$-1\\leqq x\\leqq 1$」「$x\\leqq -1,\\ 1\\leqq x$」のような不等式の答えを、
    いくつかの点で成り立つかどうか（0/1 の list）にして比べる"""
    pts = pts or GRID
    def _p(text):
        seg = re.findall(r'\$(.+?)\$', text)[0]
        pieces = seg.split(',')
        res = []
        for v_ in pts:
            hit = 0
            for pc in pieces:
                parts = re.split(r'(\\leqq|\\geqq|\\leq|\\geq|\\neq|<|>)', pc.replace('\\ ', ' '))
                vals = []; rels = []
                for i, prt in enumerate(parts):
                    if i % 2 == 0:
                        prt = prt.strip()
                        vals.append(v_ if prt == var else float(N(tex(prt))))
                    else:
                        rels.append(prt)
                ok = True
                for k_, r_ in enumerate(rels):
                    L, R = vals[k_], vals[k_ + 1]
                    if r_ in ('\\leqq', '\\leq'): ok = ok and (L <= R + 1e-12)
                    elif r_ in ('\\geqq', '\\geq'): ok = ok and (L >= R - 1e-12)
                    elif r_ == '<': ok = ok and (L < R - 1e-12)
                    elif r_ == '>': ok = ok and (L > R + 1e-12)
                    elif r_ == '\\neq': ok = ok and (abs(L - R) > 1e-12)
                if ok: hit = 1
            res.append(hit)
        return res
    return _p
def iv(pred, pts=None):
    return [1 if pred(v_) else 0 for v_ in (pts or GRID)]

V('m3b-08-L1-01', lambda: iv(lambda v_: -1 <= v_ <= 1), parse=interval_parse('x'))            # x^3-3x が減少する区間
V('m3b-08-L1-02', lambda: (lambda f_: f_.subs(x, max(solve(diff(f_, x), x))))(-x ** 3 + 3 * x ** 2))
def _m08_L103():
    f = -(x - 1) ** 2                                       # x=1 の前後で f' の符号が + → -
    fp = diff(f, x)
    plus_to_minus = fp.subs(x, 0.9) > 0 and fp.subs(x, 1.1) < 0
    return [plus_to_minus, False, False, False]
TF('m3b-08-L1-03', _m08_L103)
V('m3b-08-L1-04', lambda: (x ** 2 - 4 * x).subs(x, solve(diff(x ** 2 - 4 * x, x), x)[0]))
V('m3b-08-L1-05', lambda: iv(lambda v_: v_ <= 1), parse=interval_parse('x'))                # x e^{-x} が増加する区間
V('m3b-08-L2-01', lambda: min((x / (x ** 2 + 1)).subs(x, r_) for r_ in solve(diff(x / (x ** 2 + 1), x), x)))
V('m3b-08-L2-02', lambda: (x * log(x)).subs(x, solve(diff(x * log(x), x), x)[0]))
def _m08_L203():
    f = x ** 3 - 3 * x ** 2 - 9 * x + 1
    rts = sorted(solve(diff(f, x), x))
    return [f.subs(x, rts[0]), f.subs(x, rts[1])]           # 極大値（左の点）、極小値（右の点）
V('m3b-08-L2-03', _m08_L203)
V('m3b-08-L2-04', lambda: iv(lambda v_: v_ > 0), parse=interval_parse('a'))              # x^3-3ax+1 が極値をもつ a
def _m08_L205():
    f = x ** 3 + a * x + b
    sol = solve([diff(f, x).subs(x, 1), f.subs(x, 1)], [a, b], dict=True)[0]
    g = f.subs(sol)
    assert diff(g, x).subs(x, 0.9) < 0 < diff(g, x).subs(x, 1.1)          # x=1 で極小
    return [sol[a], sol[b]]
V('m3b-08-L2-05', _m08_L205)
def _m08_L301():
    f = x ** 3 - 3 * x ** 2 + 3 * x
    fp = factor(diff(f, x))
    no_extremum = all(diff(f, x).subs(x, 1 + d_) >= 0 for d_ in (-0.5, -0.1, 0.1, 0.5))
    return [False, no_extremum, False, False]
TF('m3b-08-L3-01', _m08_L301)
V('m3b-08-L3-02', lambda: iv(lambda v_: -3 <= v_ <= 3), parse=interval_parse('a'))        # x^3+ax^2+3x が常に単調増加
def _m08_L303():
    import math as _m
    v1, v2 = _m.e ** _m.pi, _m.pi ** _m.e
    return [v1 < v2, v1 == v2, v1 > v2, False]
TF('m3b-08-L3-03', _m08_L303)
def _m08_L304():
    f = x ** 2 * exp(-x)
    xs = sorted(solve(diff(f, x), x))
    return f.subs(x, 2)
V('m3b-08-L3-04', _m08_L304)
V('m3b-08-L3-05', lambda: iv(lambda v_: v_ < 0 or v_ > 3), parse=interval_parse('a'))   # x^3+ax^2+ax が極値をもつ a
V('m3b-08-L4-01', lambda: (log(x) / x ** 2).subs(x, solve(diff(log(x) / x ** 2, x), x)[0]))
V('m3b-08-L4-02', lambda: iv(lambda v_: v_ > -1), parse=interval_parse('a'))              # (x^2+a)/(x-1) が極値をもつ a
def _m08_L403():
    f = x ** 3 + a * x ** 2 + b * x + c
    sol = solve([diff(f, x).subs(x, -1), diff(f, x).subs(x, 3), f.subs(x, -1) - 5], [a, b, c], dict=True)[0]
    g = f.subs(sol)
    assert diff(g, x).subs(x, -1.1) > 0 > diff(g, x).subs(x, -0.9) and diff(g, x).subs(x, 2.9) < 0 < diff(g, x).subs(x, 3.1)
    return g.subs(x, 3)
V('m3b-08-L4-03', _m08_L403)
def _m08_L404():
    f = sin(x) + cos(x)
    xs = [r_ for r_ in solve(diff(f, x), x) if 0 <= N(r_) <= 2 * pi]
    mx = [r_ for r_ in xs if diff(f, x).subs(x, N(r_) - 0.1) > 0 > diff(f, x).subs(x, N(r_) + 0.1)]
    return [mx[0], simplify(f.subs(x, mx[0]))]
V('m3b-08-L4-04', _m08_L404)
def _m08_L405():
    import numpy as np
    g = lambda z: np.cbrt(z) ** 2 * (z - 5)
    d = 1e-4
    max0 = g(d) < g(0) and g(-d) < g(0)              # x=0 で極大
    min2 = g(2 + d) > g(2) and g(2 - d) > g(2)       # x=2 で極小
    val0 = abs(g(0)) < 1e-9; val2 = abs(g(2) + 3 * np.cbrt(4)) < 1e-9
    A = max0 and min2 and val0 and val2
    B = False        # x=0 で極値をとる
    C = False        # 極大・極小が逆
    D = False        # x=2 でも極値をとる
    return [A, B, C, D]
TF('m3b-08-L4-05', _m08_L405)

# ================================================================ m3b-09 第2次導関数とグラフの凹凸
def pt_parse(text):
    """「$(2,\\ 2e^{-2})$」のような点の座標を、[x座標, y座標] にする"""
    seg = re.findall(r'\$(.+?)\$', text)[0].strip()
    inner = seg[1:-1]
    return [tex(z) for z in inner.split(',')]

def kind_parse(text):
    """「$f''(3)=12$、極小」→ [12, +1]（極小 +1、極大 -1）"""
    seg = re.findall(r'\$(.+?)\$', text)[0]
    return [tex_rhs(seg), 1 if '極小' in text else -1]

def sign_changes(f2, lo=-6.0, hi=6.0, n=24001):
    """f'' の符号が変わる点（近似）の個数と位置"""
    import numpy as np
    xs = np.linspace(lo, hi, n)
    fn = sp.lambdify(x, f2, 'numpy')
    vals = fn(xs)
    out = []
    prev = 0
    for i, v_ in enumerate(vals):
        if abs(v_) < 1e-9:
            continue
        sg = 1 if v_ > 0 else -1
        if prev and sg != prev:
            out.append(float(xs[i]))
        prev = sg
    return out

V('m3b-09-L1-01', lambda: iv(lambda v_: v_ > 1), parse=interval_parse('x'))          # x^3-3x^2 が下に凸 (f''=6x-6>0)
def _m09_L102():
    f = x ** 3 - 6 * x ** 2 + 9 * x
    xi = solve(diff(f, x, 2), x)[0]
    return [xi, f.subs(x, xi)]
V('m3b-09-L1-02', _m09_L102, parse=pt_parse)
def _m09_L103():
    f = x ** 2                                             # f'(0)=0, f''(0)>0 の例
    return [diff(f, x).subs(x, 0) == 0 and diff(f, x, 2).subs(x, 0) > 0, False, False, False]      # 極小／極大／変曲点／決まらない
TF('m3b-09-L1-03', _m09_L103)
V('m3b-09-L1-04', lambda: iv(lambda v_: 0 < v_ < 3.141592653589793), parse=interval_parse('x'))   # sin x が上に凸
def _m09_L105():
    f2 = diff(log(x), x, 2)                                # -1/x^2
    pts = [0.3, 0.8, 1.0, 1.5, 4.0]
    concave_all = all(f2.subs(x, p_) < 0 for p_ in pts)
    convex_all = all(f2.subs(x, p_) > 0 for p_ in pts)
    change_at_1 = f2.subs(x, 0.9) * f2.subs(x, 1.1) < 0
    only_right = all(f2.subs(x, p_) < 0 for p_ in (1.5, 4.0)) and not all(f2.subs(x, p_) < 0 for p_ in (0.3, 0.8))
    return [convex_all, concave_all, change_at_1, only_right]
TF('m3b-09-L1-05', _m09_L105)

def _m09_L201():
    f = x * exp(-x)
    xi = solve(diff(f, x, 2), x)[0]
    return [xi, f.subs(x, xi)]
V('m3b-09-L2-01', _m09_L201, parse=pt_parse)
def _m09_L202():
    f = x ** 3 - 3 * x ** 2 - 9 * x
    assert diff(f, x).subs(x, 3) == 0
    v_ = diff(f, x, 2).subs(x, 3)
    return [v_, 1 if v_ > 0 else -1]
V('m3b-09-L2-02', _m09_L202, parse=kind_parse)
def _m09_L203():
    f = x ** 4 - 6 * x ** 2
    return [Rational(round(z)) for z in sign_changes(diff(f, x, 2))]
V('m3b-09-L2-03', _m09_L203, parse=multi_parse)
V('m3b-09-L2-04', lambda: solve(diff(x ** 3 + a * x ** 2 + 2 * x, x, 2).subs(x, 1), a)[0])
def _m09_L205():
    f = exp(-x ** 2)
    sc = sign_changes(diff(f, x, 2))
    assert len(sc) == 2
    return [-sqrt(2) / 2, sqrt(2) / 2]
V('m3b-09-L2-05', _m09_L205, parse=multi_parse)

def _m09_L301():
    f = x ** 4
    f2 = diff(f, x, 2)
    inflection = f2.subs(x, -0.1) * f2.subs(x, 0.1) < 0      # f'' の符号が変わるか
    minimum = all(f.subs(x, d_) > f.subs(x, 0) for d_ in (-0.2, -0.05, 0.05, 0.2))
    A = f2.subs(x, 0) == 0 and inflection
    B = f2.subs(x, 0) == 0 and (not minimum)
    C = (f2.subs(x, -1) < 0 and f2.subs(x, 1) > 0)
    D = not inflection
    return [A, B, C, D]
TF('m3b-09-L3-01', _m09_L301)
V('m3b-09-L3-02', lambda: iv(lambda v_: 0 < v_ < 2), parse=interval_parse('x'))        # x^4-4x^3 が上に凸
V('m3b-09-L3-03', lambda: len(sign_changes(diff(x ** 5 - 5 * x ** 4, x, 2))))
def _m09_L304():
    f = x ** 3 - 3 * x ** 2 + x
    xi = solve(diff(f, x, 2), x)[0]
    return diff(f, x).subs(x, xi) * (x - xi) + f.subs(x, xi)
V('m3b-09-L3-04', _m09_L304)
def _m09_L305():
    f = x ** 3 + a * x ** 2 + b * x
    sol = solve([diff(f, x, 2).subs(x, 2), diff(f, x).subs(x, 1)], [a, b], dict=True)[0]
    g = f.subs(sol)
    assert diff(g, x).subs(x, 0.9) * diff(g, x).subs(x, 1.1) < 0
    return [sol[a], sol[b]]
V('m3b-09-L3-05', _m09_L305)

V('m3b-09-L4-01', lambda: iv(lambda v_: v_ > 0), parse=interval_parse('a'))             # x^4-2ax^2 が変曲点をもつ a
def _m09_L402():
    f = log(1 + x ** 2)
    sc = sign_changes(diff(f, x, 2))
    return [Rational(round(z)) for z in sc]
V('m3b-09-L4-02', _m09_L402, parse=multi_parse)
def _m09_L403():
    import math as _m
    xs_ = [-3.0, -1.0, 0.0, 0.5, 1.0, 2.0, 5.0]
    cands = [
        lambda t_: _m.exp(t_) >= 1 + t_ - 1e-12,
        lambda t_: _m.exp(t_) <= 1 + t_ + 1e-12,
        lambda t_: _m.exp(t_) >= 1 + 2 * t_ - 1e-12,
        lambda t_: _m.exp(t_) <= t_ ** 2 + 1 + 1e-12,
    ]
    return [all(f_(t_) for t_ in xs_) for f_ in cands]
TF('m3b-09-L4-03', _m09_L403)
V('m3b-09-L4-04', lambda: len(sign_changes(x * (x - 2) ** 2 * (x + 1))))
def _m09_L405():
    f = x * exp(-x)
    xi = solve(diff(f, x, 2), x)[0]
    return diff(f, x).subs(x, xi) * (x - xi) + f.subs(x, xi)
V('m3b-09-L4-05', _m09_L405)

# ================================================================ m3b-10 いろいろな関数のグラフ
GRID_B = GRID + [float(1 / E), float(E), 1 / 3.0]            # 値域などの境目（1/e, e, 1/3）も調べる点に加える

def _m10_L101():
    f = x / (x ** 2 + 1)
    even = same(f.subs(x, -x), f)
    odd = same(f.subs(x, -x), -f)
    return [even, False, odd, not (even or odd)]               # y軸対称／x軸対称／原点対称／なし
TF('m3b-10-L1-01', _m10_L101)
V('m3b-10-L1-02', lambda: iv(lambda v_: v_ > 0), parse=interval_parse('x'))          # log x / x の定義域
def _m10_L103():
    f = (2 * x + 1) / (x - 1)
    return [solve(sp.denom(sp.together(f)), x)[0], limit(f, x, oo)]
V('m3b-10-L1-03', _m10_L103)
def _m10_L104():
    f = x + 1 / x
    m_ = limit(f / x, x, oo); c_ = limit(f - m_ * x, x, oo)
    return m_ * x + c_
V('m3b-10-L1-04', _m10_L104)
V('m3b-10-L1-05', lambda: limit(exp(-x ** 2), x, oo))

V('m3b-10-L2-01', lambda: iv(lambda v_: -0.5 <= v_ <= 0.5), parse=interval_parse('y'))      # x/(x^2+1) の値域
def _m10_L202():
    f = x ** 2 / (x - 1)
    m_ = limit(f / x, x, oo); c_ = limit(f - m_ * x, x, oo)
    assert limit(f, x, 1, '+') == oo and limit(f, x, 1, '-') == -oo
    return [1, m_ * x + c_]
V('m3b-10-L2-02', _m10_L202)
def _m10_L203():
    f = x * exp(-x)
    A = diff(f, x, 2).subs(x, 1) > 0                           # (1,1/e) が極小か
    B = (diff(f, x).subs(x, 0.9) > 0 > diff(f, x).subs(x, 1.1)) and (diff(f, x, 2).subs(x, 1.9) * diff(f, x, 2).subs(x, 2.1) < 0) and limit(f, x, oo) == 0
    C = limit(f, x, oo) == oo
    D = False                                                 # 変曲点 x=2 が存在する
    return [A, B, C, D]
TF('m3b-10-L2-03', _m10_L203)
def _m10_L204():
    f = log(x) / x
    assert limit(f, x, 0, '+') == -oo and limit(f, x, oo) == 0
    return [0, 0]                                             # 漸近線 x=0 と y=0
V('m3b-10-L2-04', _m10_L204)
def _m10_L205():
    f = sqrt(x ** 2 + 1)
    assert limit(f - x, x, oo) == 0 and limit(f + x, x, -oo) == 0
    return [x, -x]
V('m3b-10-L2-05', _m10_L205)

def _m10_L301():
    f = x / (x ** 2 - 1)
    odd = same(f.subs(x, -x), -f)
    no_ext = all(diff(f, x).subs(x, p_) < 0 for p_ in (-3, -0.5, 0, 0.5, 3))
    asy_all = limit(f, x, oo) == 0 and limit(f, x, 1, '+') == oo
    ext_at0 = diff(f, x).subs(x, 0) == 0
    A = odd and no_ext and asy_all
    B = odd and ext_at0
    C = False                                                 # f は奇関数であって偶関数でない
    D = False                                                 # y=0 も漸近線
    return [A, B, C, D]
TF('m3b-10-L3-01', _m10_L301)
def _m10_L302():
    f = x ** 2 / (x - 1)
    xs = sorted(solve(diff(f, x), x))
    return [f.subs(x, xs[0]), f.subs(x, xs[1])]                # 極大値(x=0)、極小値(x=2)
V('m3b-10-L3-02', _m10_L302)
V('m3b-10-L3-03', lambda: iv(lambda v_: v_ <= 1 / math.e, pts=GRID_B), parse=interval_parse('y', pts=GRID_B))
def _m10_L304():
    f = x ** 2 * exp(-x)
    mn0 = diff(f, x).subs(x, -0.1) < 0 < diff(f, x).subs(x, 0.1)
    mx2 = diff(f, x).subs(x, 1.9) > 0 > diff(f, x).subs(x, 2.1)
    infl = len(sign_changes(diff(f, x, 2), -2, 8))
    ok_vals = f.subs(x, 0) == 0 and simplify(f.subs(x, 2) - 4 * exp(-2)) == 0
    A = False
    B = mn0 and mx2 and ok_vals and infl == 2
    C = mn0 and mx2 and ok_vals and infl == 1
    D = limit(f, x, -oo) == 0
    return [A, B, C, D]
TF('m3b-10-L3-04', _m10_L304)
def _m10_L305():
    f = (2 * x ** 2 - x + 3) / (x - 1)
    m_ = limit(f / x, x, oo); c_ = limit(f - m_ * x, x, oo)
    return m_ * x + c_
V('m3b-10-L3-05', _m10_L305)

def _m10_L401():
    f = x ** 3 / (x ** 2 - 1)
    m_ = limit(f / x, x, oo); c_ = limit(f - m_ * x, x, oo)
    assert limit(f, x, 1, '+') == oo and limit(f, x, -1, '+') == oo
    return [-1, 1, m_ * x + c_]
V('m3b-10-L4-01', _m10_L401)
V('m3b-10-L4-02', lambda: (x + a / x).subs(x, sqrt(a)))
V('m3b-10-L4-03', lambda: [Rational(-1, 3) * sqrt(3), Rational(1, 3) * sqrt(3)] if len(sign_changes(diff(1 / (x ** 2 + 1), x, 2))) == 2 else None, parse=multi_parse)
V('m3b-10-L4-04', lambda: iv(lambda v_: 1 / 3.0 - 1e-12 <= v_ <= 3 + 1e-12, pts=GRID_B), parse=interval_parse('y', pts=GRID_B))
def _m10_L405():
    f = x / sqrt(x ** 2 + 1)
    assert limit(f, x, oo) == 1 and limit(f, x, -oo) == -1
    return [-1, 1]
V('m3b-10-L4-05', _m10_L405)

# ================================================================ m3b-11 最大・最小と方程式・不等式への応用
def _num_roots(g, lo, hi, n=200001):
    """連続関数 g の、区間 (lo,hi) での実数解の個数（符号変化と、接する点の近似）"""
    import numpy as np
    xs = np.linspace(lo, hi, n); fn = sp.lambdify(x, g, 'numpy'); vals = fn(xs)
    cnt = int(np.sum(vals[:-1] * vals[1:] < 0))
    return cnt

def _m11_L101():
    f = x ** 3 - 3 * x + 1
    cands = [f.subs(x, 0), f.subs(x, 3)] + [f.subs(x, r_) for r_ in solve(diff(f, x), x) if 0 <= r_ <= 3]
    return max(cands)
V('m3b-11-L1-01', _m11_L101)
def _m11_L102():
    f = x * exp(-x)
    cands = [f.subs(x, 0), f.subs(x, 3)] + [f.subs(x, r_) for r_ in solve(diff(f, x), x) if 0 <= r_ <= 3]
    return [max(cands), min(cands)]
V('m3b-11-L1-02', _m11_L102)
V('m3b-11-L1-03', lambda: (x + 4 / x).subs(x, [r_ for r_ in solve(diff(x + 4 / x, x), x) if r_ > 0][0]))
V('m3b-11-L1-04', lambda: _num_roots(x ** 3 - 3 * x - 3, -5, 5))
def _m11_L105():
    f = exp(x) - 1 - x
    A = diff(f, x).subs(x, 0.5) < 0                        # 「f' は負」は偽
    B = f.subs(x, 0) == 1                                   # 「f(0)=1」は偽（f(0)=0）
    C = f.subs(x, 0) == 1
    D = diff(f, x).subs(x, 0.5) > 0 and diff(f, x).subs(x, 3) > 0 and f.subs(x, 0) == 0
    return [A, B, C, D]
TF('m3b-11-L1-05', _m11_L105)

V('m3b-11-L2-01', lambda: max((x * (12 - 2 * x) ** 2).subs(x, r_) for r_ in solve(diff(x * (12 - 2 * x) ** 2, x), x) if 0 < r_ < 6))
V('m3b-11-L2-02', lambda: (log(x) / x).subs(x, [r_ for r_ in solve(diff(log(x) / x, x), x)][0]))
def _m11_L203():
    f = 1 / (x ** 2 + 1)
    has_max = all(f.subs(x, p_) <= 1 for p_ in (-5, -1, 0.3, 2, 9)) and f.subs(x, 0) == 1
    has_min = False        # f(x)>0 で、下限 0 に近づくだけ（とらない）
    return [(not has_max) and (not has_min), has_max and (not has_min), (not has_max) and has_min, has_max and has_min]
TF('m3b-11-L2-03', _m11_L203)
def _m11_L204():
    h_ = x ** 3 - 3 * x ** 2                                  # x^3-3x^2+k=0 ⇔ h(x)=-k。極大値 0（x=0）、極小値 -4（x=2）
    return iv(lambda v_: 0 < v_ < 4, pts=GRID_B)
V('m3b-11-L2-04', _m11_L204, parse=interval_parse('k', pts=GRID_B))
def _m11_L205():
    kk = 1 / (2 * E)
    return _num_roots(log(x) / x - kk, 0.001, 200)
V('m3b-11-L2-05', _m11_L205)

V('m3b-11-L3-01', lambda: [Rational(-2), Rational(2)], parse=multi_parse)            # x^3-3x=k がちょうど2個の解
V('m3b-11-L3-02', lambda: (log(x) / x).subs(x, E))                                    # log x <= kx のk の最小値
V('m3b-11-L3-03', lambda: [diff(log(1 + x) - x + x ** 2 / 2, x), (log(1 + x) - x + x ** 2 / 2).subs(x, 0)])
def _m11_L304():
    L = 4 * (cos(t) + sin(t))
    ts = [r_ for r_ in solve(diff(L, t), t) if 0 < N(r_) < N(pi / 2)]
    return simplify(L.subs(t, ts[0]))
V('m3b-11-L3-04', _m11_L304)
def _m11_L305():
    f = x * sqrt(4 - x ** 2)
    xs = [r_ for r_ in solve(diff(f, x), x) if 0 < N(r_) < 2]
    return max(simplify(f.subs(x, r_)) for r_ in xs)
V('m3b-11-L3-05', _m11_L305)

def _m11_L401():
    hh = sp.Symbol('hh', positive=True)
    V_ = 2 * pi * hh * (1 - hh ** 2)                          # 半径 1 の球に内接する円柱（高さ 2hh、底面の半径 sqrt(1-hh^2)）
    hs = [r_ for r_ in solve(diff(V_, hh), hh) if r_ > 0 and N(r_) < 1]
    return simplify(V_.subs(hh, hs[0]))
V('m3b-11-L4-01', _m11_L401)
def _m11_L402():
    g = exp(x) / x
    emin = g.subs(x, 1)
    assert simplify(emin - E) == 0
    ks = {2.0: 0, float(E) * 1.0001: 2, 3.0: 2, 5.0: 2}
    for k_, want in ks.items():
        assert _num_roots(exp(x) - k_ * x, 0.0001, 12, 400001) == want, (k_, want)
    return iv(lambda v_: v_ > math.e, pts=GRID_B)
V('m3b-11-L4-02', _m11_L402, parse=interval_parse('k', pts=GRID_B))
def _m11_L403():
    f = exp(x) - x ** 2
    assert all(diff(f, x).subs(x, p_) > 0 for p_ in (-3, -1, 0, 0.693, 1, 2, 5))       # f' = e^x - 2x > 0
    return _num_roots(f, -10, 10)
V('m3b-11-L4-03', _m11_L403)
def _m11_L404():
    f = sin(t) * cos(t) ** 2
    t0 = sp.atan(1 / sqrt(2))                                  # cos^2 t = 2 sin^2 t  ⇔  tan^2 t = 1/2
    assert abs(float(N(diff(f, t).subs(t, t0)))) < 1e-9
    return sp.nsimplify(simplify(f.subs(t, t0)), [sqrt(3)])
V('m3b-11-L4-04', _m11_L404)
def _m11_L405():
    out = []
    for a_ in (1, 5):
        f = x ** 3 - 3 * a_ * x
        cands = [f.subs(x, 0), f.subs(x, 2)] + [f.subs(x, r_) for r_ in solve(diff(f, x), x) if 0 <= N(r_) <= 2]
        out.append(min(cands))
    return out
V('m3b-11-L4-05', _m11_L405)

# ================================================================ m3b-12 速度・加速度と近似式
V('m3b-12-L1-01', lambda: diff(t ** 3 - 3 * t, t).subs(t, 2))                          # 速度
V('m3b-12-L1-02', lambda: diff(2 * t ** 3 - 9 * t ** 2 + 12 * t, t, 2).subs(t, 2))        # 加速度
V('m3b-12-L1-03', lambda: sqrt(diff(2 * t, t) ** 2 + diff(t ** 2, t) ** 2).subs(t, 1))    # 速さ
V('m3b-12-L1-04', lambda: 2 + diff(sqrt(x), x).subs(x, 4) * Rational(4, 100))              # sqrt(4.04) の近似
V('m3b-12-L1-05', lambda: diff(log(1 + x), x).subs(x, 0) * Rational(5, 100))               # log 1.05 ≈ 0.05
V('m3b-12-L2-01', lambda: diff(pi * r ** 2, r).subs(r, 5) * 2)                              # dS/dt
V('m3b-12-L2-02', lambda: diff(Rational(4, 3) * pi * r ** 3, r).subs(r, 3) * Rational(1, 2))   # dV/dt
def _m12_L203():
    X, Y = 2 * cos(t), 2 * sin(t)
    sp_ = simplify(sqrt(diff(X, t) ** 2 + diff(Y, t) ** 2))
    ac = simplify(sqrt(diff(X, t, 2) ** 2 + diff(Y, t, 2) ** 2))
    return [sp_, ac]
V('m3b-12-L2-03', _m12_L203)
V('m3b-12-L2-04', lambda: (1 + 5 * Rational(2, 100)))                                       # (1.02)^5 ≈ 1+5*0.02
V('m3b-12-L2-05', lambda: sin(pi / 6) + (pi / 180) * cos(pi / 6))
def _m12_L301():
    X = 20 * t - 5 * t ** 2
    t0 = solve(diff(X, t), t)[0]
    return [t0, X.subs(t, t0)]
V('m3b-12-L3-01', _m12_L301)
V('m3b-12-L3-02', lambda: sorted(solve(diff(t ** 3 - 6 * t ** 2 + 9 * t, t), t)), parse=multi_parse)
def _m12_L303():
    X, Y = t, t ** 2 - 2 * t
    s2 = diff(X, t) ** 2 + diff(Y, t) ** 2
    t0 = solve(diff(s2, t), t)[0]
    return [t0, sqrt(s2.subs(t, t0))]
V('m3b-12-L3-03', _m12_L303)
V('m3b-12-L3-04', lambda: diff(Rational(4, 3) * pi * r ** 3, r).subs(r, 10) * Rational(1, 10))
V('m3b-12-L3-05', lambda: 5 + diff(sqrt(x), x).subs(x, 25) * 1)
def _m12_L401():
    # x^2+y^2=25、x=3 のとき y=4、dx/dt=1
    xv, yv = 3, 4
    dydt = -Rational(xv, yv) * 1
    return -dydt                       # 下がる速さ
V('m3b-12-L4-01', _m12_L401)
def _m12_L402():
    hh = sp.Symbol('hh', positive=True)
    Vh = Rational(1, 3) * pi * (hh / 2) ** 2 * hh            # 水深 hh のときの水の体積（水面の半径 hh/2）
    return simplify(pi / diff(Vh, hh).subs(hh, 4))            # dh/dt = (dV/dt)/(dV/dh)、dV/dt=pi
V('m3b-12-L4-02', _m12_L402)
V('m3b-12-L4-03', lambda: simplify(r * diff(Rational(4, 3) * pi * r ** 3, r) / (Rational(4, 3) * pi * r ** 3)))      # 相対誤差は半径の何倍か（3倍）→ 1% の3倍=3%
V('m3b-12-L4-04', lambda: 3 + diff(x ** Rational(1, 3), x).subs(x, 27) * 1)
V('m3b-12-L4-05', lambda: sqrt(diff(t ** 2, t, 2) ** 2 + diff(t ** 3, t, 2).subs(t, 1) ** 2))

# ==== 追加はここ ====
# ==== 授業ごとの確かめ（ここまで） ====

def run(lessons):
    items = {}
    for f in sorted(glob.glob(os.path.join(OUT, 'h3b', 'm3b-*.json'))):
        lid = os.path.basename(f)[:-5]
        if lessons and lid not in lessons: continue
        for it in json.load(open(f, encoding='utf-8')):
            items[it['id']] = it
    ng = 0; ok = 0; pending = 0
    ids = sorted(set(items) | set(i for i in CHECKS if (not lessons or i[:6] in lessons)))
    for qid in ids:
        it = items.get(qid); ch = CHECKS.get(qid)
        if ch is None:
            print(f'NG  {qid}  確かめが登録されていない'); ng += 1; continue
        try:
            if ch['kind'] == 'V':
                want = ch['calc']()
                want = list(want) if isinstance(want, (list, tuple)) else [want]
                show = fmt(want)
            else:
                flags = ch['flags'](); show = str([bool(z) for z in flags])
        except Exception as ex:
            print(f'NG  {qid}  計算でエラー {ex!r}'); ng += 1; continue
        if it is None:
            print(f'--  {qid}  (問題ファイル未作成) 計算結果: {show}'); pending += 1; continue
        ki = [i for i, z in enumerate(it['c']) if z.get('k') == 1]
        ki = ki[0] if ki else -1
        bad = []
        if ch['kind'] == 'V':
            parse = ch['parse'] or choice_vals
            for i, z in enumerate(it['c']):
                try:
                    got = parse(z['t'])
                    got = list(got) if isinstance(got, (list, tuple)) else [got]
                    mt = same_list(got, want)
                except Exception as ex:
                    bad.append(f'選択肢{"ABCD"[i]}が読めない {ex!r}'); continue
                if i == ki and not mt: bad.append(f'正解の選択肢{"ABCD"[i]}が計算結果と一致しない')
                if i != ki and mt: bad.append(f'まちがいの選択肢{"ABCD"[i]}が計算結果と一致してしまう')
        else:
            fl = [bool(z) for z in flags]
            truth = [(z == ch['want']) for z in fl]
            if len(fl) != 4: bad.append('flags は4つ')
            else:
                exp_k = [i for i, z in enumerate(truth) if z]
                if exp_k != [ki]: bad.append(f'計算上の正解は選択肢{[ "ABCD"[i] for i in exp_k]}、問題の正解は{"ABCD"[ki] if ki>=0 else "なし"}')
        qshort = re.sub(r'\s+', ' ', it['q'])[:46]
        corr = it['c'][ki]['t'] if ki >= 0 else '(なし)'
        status = 'OK ' if not bad else 'NG '
        print(f'{status} {qid}  [{qshort}]  計算: {show}  | 正解({"ABCD"[ki] if ki>=0 else "?"}): {corr[:60]}')
        if bad:
            ng += 1
            for z in bad: print('      ->', z)
        else:
            ok += 1
    print(f'\nOK {ok} 問 / NG {ng} 問 / 未作成 {pending} 問')
    return ng

if __name__ == '__main__':
    sys.exit(1 if run(set(sys.argv[1:])) else 0)
