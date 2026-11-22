#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""h3c（数学Ⅲ 積分法 m3c-01〜m3c-09）の検算スクリプト。

使い方:  cd h3 && python3 out/h3c.verify.py [授業id ...]
  out/h3c/<授業id>.json を読み、各問題について
    「問題 → sympy で計算した答え」と「正解（k:1）の選択肢」を突き合わせる。
  選択肢の TeX 文字列は、このファイルの小さな TeX パーサ（LP）で sympy の式にして比べる。
    - 不定積分の問題：各選択肢（+C を除く）を微分して、被積分関数と一致するかを見る。
    - 値・式の問題：各選択肢の値が、計算した答えと一致するかを見る。
    - 正誤の問題：各選択肢の真偽を、このファイルの中で計算して、正解が1つだけかを見る。
  どれか1つでも「正解が1つだけ・それが k:1」にならなければ NG とする。
"""
import json, re, os, sys, glob, random, math
import numpy as _np
import mpmath as _mp
import sympy as sp
from sympy import Rational as R, pi, E, sqrt, log, sin, cos, tan, exp, Abs, integrate, diff, oo, Integral, simplify, N

HERE = os.path.dirname(os.path.abspath(__file__))
x, t, u, th, y, a, b, n, k = [sp.Symbol(c, real=True) for c in ('x', 't', 'u', 'theta', 'y', 'a', 'b', 'n', 'k')]
SYMS = {'x': x, 't': t, 'u': u, 'y': y, 'a': a, 'b': b, 'n': n, 'k': k}


# ---------------------------------------------------------------- TeX -> sympy
class LP:
    FUNCS = {'\\sin': sp.sin, '\\cos': sp.cos, '\\tan': sp.tan, '\\log': sp.log, '\\ln': sp.log, '\\exp': sp.exp}

    def __init__(self, s):
        s = s.replace('$', '')
        s = re.sub(r'\\(?:left|right|displaystyle)', '', s)
        s = re.sub(r'\\[,;! ]', ' ', s)
        s = s.replace('\\dfrac', '\\frac')
        self.toks = re.findall(r'\\[a-zA-Z]+|\d+\.\d+|\d+|[a-zA-Z]|[-+*/^(){}\[\]|]', s)
        self.i = 0
        self.absdepth = 0

    def peek(self):
        return self.toks[self.i] if self.i < len(self.toks) else None

    def nxt(self):
        p = self.peek()
        self.i += 1
        return p

    def expect(self, tok):
        p = self.nxt()
        if p != tok:
            raise ValueError(f'expected {tok} got {p} in {self.toks}')

    def parse(self):
        v = self.expr()
        if self.peek() is not None:
            raise ValueError(f'trailing {self.toks[self.i:]} in {self.toks}')
        return v

    def expr(self):
        v = self.term()
        while self.peek() in ('+', '-'):
            op = self.nxt()
            w = self.term()
            v = v + w if op == '+' else v - w
        return v

    def starts(self, p):
        if p is None:
            return False
        if p == '|':
            return self.absdepth == 0
        if p in ('(', '{', '\\frac', '\\sqrt', '\\pi', '\\theta') or p in self.FUNCS:
            return True
        return bool(re.fullmatch(r'\d+(\.\d+)?|[a-zA-Z]', p))

    def term(self):
        v = self.unary()
        while True:
            p = self.peek()
            if p in ('*', '\\cdot', '\\times'):
                self.nxt(); v = v * self.unary()
            elif p in ('/', '\\div'):
                self.nxt(); v = v / self.unary()
            elif self.starts(p):
                v = v * self.power()
            else:
                break
        return v

    def unary(self):
        if self.peek() == '-':
            self.nxt(); return -self.unary()
        if self.peek() == '+':
            self.nxt(); return self.unary()
        return self.power()

    def power(self):
        base = self.atom()
        if self.peek() == '^':
            self.nxt()
            base = base ** self.exponent()
        return base

    def exponent(self):
        if self.peek() == '{':
            self.nxt(); v = self.expr(); self.expect('}'); return v
        if self.peek() == '-':
            self.nxt(); return -self.exponent()
        return self.atom()

    def group(self):
        self.expect('{'); v = self.expr(); self.expect('}'); return v

    def funcarg(self):
        p = self.peek()
        if p is not None and re.fullmatch(r'\d+(\.\d+)?', p):
            v = sp.Rational(self.nxt())
            q = self.peek()
            if q is not None and (re.fullmatch(r'[a-zA-Z]', q) or q in ('\\pi', '\\theta')):
                v = v * self.power()
            return v
        if p is not None and (re.fullmatch(r'[a-zA-Z]', p) or p in ('\\pi', '\\theta')):
            return self.power()
        return self.atom()

    def atom(self):
        p = self.nxt()
        if p is None:
            raise ValueError('unexpected end')
        if re.fullmatch(r'\d+(\.\d+)?', p):
            return sp.Rational(p)
        if p == '\\pi':
            return pi
        if p == '\\theta':
            return th
        if p == 'e':
            return E
        if re.fullmatch(r'[a-zA-Z]', p):
            return SYMS.get(p) or sp.Symbol(p, real=True)
        if p == '\\frac':
            p1 = self.group(); p2 = self.group(); return p1 / p2
        if p == '\\sqrt':
            if self.peek() == '[':
                self.nxt(); nn = self.expr(); self.expect(']'); return sp.root(self.group(), nn)
            return sp.sqrt(self.group())
        if p == '(':
            v = self.expr(); self.expect(')'); return v
        if p == '{':
            v = self.expr(); self.expect('}'); return v
        if p == '|':
            self.absdepth += 1
            v = self.expr()
            self.expect('|')
            self.absdepth -= 1
            return Abs(v)
        if p in self.FUNCS:
            ex = None
            if self.peek() == '^':
                self.nxt(); ex = self.exponent()
            arg = self.funcarg()
            v = self.FUNCS[p](arg)
            return v ** ex if ex is not None else v
        raise ValueError(f'unknown token {p} in {self.toks}')


def tex(s):
    """TeX 文字列（$ つき可）→ sympy の式。"""
    return LP(s).parse()


def strip_C(s):
    s = s.replace('$', '').strip()
    return re.sub(r'\+\s*C\s*$', '', s)


def eq(p, q, tol=1e-9):
    """p と q が（サンプル点で）等しいか。"""
    p = sp.sympify(p); q = sp.sympify(q)
    free = sorted((p.free_symbols | q.free_symbols), key=str)
    rnd = random.Random(12345)
    for _ in range(1 if not free else 7):
        sub = {s: rnd.uniform(0.35, 1.45) for s in free}
        try:
            val = complex(sp.N((p - q).subs(sub), 25))
        except Exception:
            return False
        if abs(val) > tol:
            return False
    return True


def numeq(p, q, tol=1e-9):
    return abs(complex(sp.N(sp.sympify(p) - sp.sympify(q), 25))) < tol


# ---------------------------------------------------------------- 検算の種類
def ctexts(prob):
    return [c['t'] for c in prob['c']]


def correct_index(prob):
    return [i for i, c in enumerate(prob['c']) if c.get('k') == 1][0]


def indef(f, var=None):
    """不定積分：選択肢（+C を除く）を微分して f と一致するもの。"""
    var = var or x
    def run(prob):
        ok = []
        for tx in ctexts(prob):
            F = tex(strip_C(tx))
            ok.append(eq(diff(F, var), f))
        return f'∫ ({f}) dx  ←  選択肢の微分が一致', ok
    return run


def val(v):
    """値・式：選択肢の値が v と一致するもの。"""
    def run(prob):
        ok = [eq(tex(tx), v) if sp.sympify(v).free_symbols else numeq(tex(tx), v) for tx in ctexts(prob)]
        vv = sp.sympify(v)
        try:
            shown = f'{sp.simplify(vv)} ≈ {sp.N(vv, 8)}'
        except Exception:
            shown = str(vv)
        return shown, ok
    return run


def numval(v, tol=1e-6):
    """未評価の Integral など：数値で一致するもの。"""
    def run(prob):
        vn = complex(sp.N(v, 20)).real
        ok = []
        for tx in ctexts(prob):
            ok.append(abs(complex(sp.N(tex(tx), 20)) - vn) < tol)
        return f'≈ {vn:.10f}', ok
    return run


def truth(lst, note=''):
    """正誤：選択肢ごとの真偽（このファイル内の計算で出したもの）。"""
    def run(prob):
        return (note or '各選択肢の真偽を計算') + ' → ' + ''.join('○' if v else '×' for v in lst), [bool(v) for v in lst]
    return run


def at(idx, note=''):
    """計算で得た正解の選択肢の番号（0〜3）。"""
    def run(prob):
        return (note or '') + f' → 選択肢 {idx}', [i == idx for i in range(4)]
    return run


def subst(f, g, var_new=None):
    """置換積分：x=g(t) とおいたときの被積分関数 f(g(t))g'(t)。選択肢は \\int ... dt の形。"""
    var_new = var_new or t
    def run(prob):
        target = f.subs(x, g) * diff(g, var_new)
        ok = []
        for tx in ctexts(prob):
            s = tx.replace('$', '').strip()
            s = re.sub(r'^\\int\s*', '', s)
            s = re.sub(r'\\,\s*d[a-z]\s*$', '', s)
            s = re.sub(r'\s*d[a-z]\s*$', '', s) if not re.search(r'\\,', tx) else s
            ok.append(eq(tex(s), target))
        return f'f(g(t))g\'(t) = {sp.simplify(target)}', ok
    return run


def sum_limit(term, exact, nbig=200000, tol=2e-4):
    """区分求積：n=nbig のときの和の値と、積分で出した極限値 exact を比べる。選択肢は極限値。"""
    def run(prob):
        import numpy as np
        nn = nbig
        kk = np.arange(1, nn + 1, dtype=float)
        s = float(np.sum(term(kk, float(nn))))
        ex = float(sp.N(exact, 15))
        ok = [abs(float(sp.N(tex(tx), 15)) - ex) < 1e-9 for tx in ctexts(prob)]
        note = f'和(n={nn}) = {s:.6f}, 積分 = {sp.simplify(exact)} ≈ {ex:.6f}'
        if abs(s - ex) > tol:
            note += '  【和と積分が合わない！】'
            ok = [False] * 4
        return note, ok
    return run


def dup_pairs(prob):
    """選択肢どうしが（値・導関数まで）同じになっていないかを、TeX を読める範囲で調べる。"""
    vals = []
    for c in prob['c']:
        try:
            vals.append(tex(strip_C(c['t'])))
        except Exception:
            return []
    out = []
    for i in range(4):
        for j in range(i + 1, 4):
            a_, b_ = vals[i], vals[j]
            fs = a_.free_symbols | b_.free_symbols
            try:
                if not fs:
                    same = numeq(a_, b_)
                elif fs <= {x}:
                    same = eq(diff(a_, x), diff(b_, x))
                else:
                    continue
            except Exception:
                continue
            if same:
                out.append((i, j))
    return out


SPECS = {}


def lesson_specs(lesson, lst):
    """lst は、段階1〜4 の順に5問ずつ（計20個）の検算。"""
    assert len(lst) == 20, (lesson, len(lst))
    for i, s in enumerate(lst):
        SPECS[f'{lesson}-L{i // 5 + 1}-{i % 5 + 1:02d}'] = s


# ---------------------------------------------------------------- 実行
def main(argv):
    want = argv[1:]
    files = sorted(glob.glob(os.path.join(os.environ.get('H3C_DIR', os.path.join(HERE, 'h3c')), 'm3c-0?.json')))
    bad = 0; total = 0
    for fp in files:
        les = os.path.basename(fp)[:-5]
        if want and les not in want:
            continue
        probs = json.load(open(fp, encoding='utf-8'))
        print(f'===== {les} ({len(probs)} 問) =====')
        for p in probs:
            total += 1
            sp_ = SPECS.get(p['id'])
            ci = correct_index(p)
            qs = re.sub(r'\s+', ' ', p['q'])[:58]
            if sp_ is None:
                print(f"  ?? {p['id']}  検算なし  {qs}"); bad += 1; continue
            try:
                desc, ok = sp_(p)
            except Exception as ex:
                print(f"  NG {p['id']}  検算で例外 {type(ex).__name__}: {ex}"); bad += 1; continue
            good = (sum(ok) == 1 and ok[ci])
            dups = dup_pairs(p)
            if dups:
                good = False
            mark = 'OK' if good else 'NG'
            if not good:
                bad += 1
            print(f"  {mark} {p['id']}  {qs}\n       計算: {desc}\n       正解[{ci}] {p['c'][ci]['t']}" + ('' if good else f"   一致した選択肢 = {[i for i, v in enumerate(ok) if v]}   同じ値の選択肢の組 = {dups}"))
    print(f'\n合計 {total} 問・NG {bad} 問')
    return 1 if bad else 0


# ================================================================ m3c-01 不定積分の基本公式
def _stmt(F, f):
    return eq(diff(F, x), f)

def _s01_l3_4_run(prob):
    truth_by_text = {
        r'$\int e^{2x}\,dx=e^{2x}+C$': _stmt(exp(2*x), exp(2*x)),
        r'$\int \cos 2x\,dx=\sin 2x+C$': _stmt(sin(2*x), cos(2*x)),
        r'$\int \frac{1}{2x+1}\,dx=\frac{1}{2}\log|2x+1|+C$': _stmt(log(Abs(2*x + 1))/2, 1/(2*x + 1)),
        r'$\int \frac{1}{x^{2}}\,dx=\log x^{2}+C$': _stmt(log(x**2), 1/x**2),
    }
    ok = [truth_by_text[c['t']] for c in prob['c']]
    return '右辺を微分して被積分関数になるか → ' + ''.join('○' if v else '×' for v in ok), ok


def _s01_l3_1():
    # f'(x)=3x^2-2x, f(2)=5 → f(3)
    C = sp.Symbol('C')
    F = x**3 - x**2 + C
    Cv = sp.solve(F.subs(x, 2) - 5, C)[0]
    return val(F.subs(C, Cv).subs(x, 3))

def _s01_l4_3():
    C1, C2 = sp.symbols('C1 C2')
    f1 = integrate(6*x - 2, x) + C1
    c1 = sp.solve(f1.subs(x, 0) - 1, C1)[0]
    f1 = f1.subs(C1, c1)
    f0 = integrate(f1, x) + C2
    c2 = sp.solve(f0.subs(x, 0) + 1, C2)[0]
    f0 = f0.subs(C2, c2)
    return val(f0.subs(x, 2))

def _s01_l4_5():
    # x<0 で F'(x)=1/x, F(-1)=2 → F(-e^3)
    # F(x)=log|x|+C を微分して 1/x になることを確かめてから値を出す
    C = sp.Symbol('C')
    Fx = log(Abs(x)) + C
    assert eq(diff(Fx.subs(C, 0), x), 1/x)
    Cv = sp.solve(Fx.subs(x, -1) - 2, C)[0]
    return val(Fx.subs(C, Cv).subs(x, -E**3))

lesson_specs('m3c-01', [
    indef(x**6), indef(1/x**2), indef(sqrt(x)), indef(sin(x)), indef(3**x),
    indef(3*x**2 - 4*x + 5), indef((x**2 + 1)/x), indef(2*sin(x) - 3*exp(x)), indef((3*x - 1)**4), indef(1/(3*x - 2)),
    _s01_l3_1(), indef(tan(x)**2), (lambda prob: ('F=x sin x を微分: ' + str(diff(x*sin(x), x)), [eq(tex(tx), diff(x*sin(x), x)) for tx in ctexts(prob)])), _s01_l3_4_run, indef((x + 1)/sqrt(x)),
    indef((exp(x) + exp(-x))**2), indef(1/(sin(x)**2*cos(x)**2)), _s01_l4_3(), indef((4**x - 1)/2**x), _s01_l4_5(),
])


# ================================================================ m3c-02 置換積分法
def _s02_l4_1(prob):
    f = sin(x)*cos(x)
    okA = eq(diff(sin(x)**2/2, x), f)
    okB = eq(diff(-cos(x)**2/2, x), f)
    okC = eq(diff(-cos(2*x)/4, x), f)
    nwrong = 3 - sum([okA, okB, okC])
    # 差が定数か（微分して 0）
    const_AB = eq(diff(sin(x)**2/2 + cos(x)**2/2, x), 0)
    const_BC = eq(diff(-cos(x)**2/2 + cos(2*x)/4, x), 0)
    truth_by_head = {
        'ア、イ、ウのどれも正しい': okA and okB and okC and const_AB and const_BC,
        'アだけが正しく': okA and not okB and not okC,
        'アとイは正しいが、ウは': okA and okB and not okC,
        '同じ関数を積分したのだから': nwrong >= 2,
    }
    ok = []
    for c in prob['c']:
        hits = [v for kk, v in truth_by_head.items() if c['t'].startswith(kk)]
        assert len(hits) == 1, c['t']
        ok.append(hits[0])
    return 'A,B,C の微分がすべて sin x cos x、差は定数 → ' + ''.join('○' if v else '×' for v in ok), ok

def _s02_l3_4():
    C = sp.Symbol('C')
    F = log(x**2 + 1) + C
    assert eq(diff(F, x), 2*x/(x**2 + 1))
    Cv = sp.solve(F.subs(x, 0) - 1, C)[0]
    return val(F.subs(C, Cv).subs(x, 1))

lesson_specs('m3c-02', [
    indef(2*x*(x**2 + 1)**3), indef(2*x/(x**2 + 1)), indef(sin(x)**3*cos(x)), indef(x*exp(x**2)), indef(log(x)/x),
    indef(x*sqrt(x + 1)), indef(tan(x)), indef(exp(x)/(exp(x) + 1)), indef(x/sqrt(x**2 + 1)), indef(cos(x)**3),
    subst(1/(exp(x) + 1), log(t)), indef(1/(x*log(x))), indef((x + 1)/(x**2 + 2*x + 3)), _s02_l3_4(), indef(x/(x - 1)**2),
    _s02_l4_1, indef(x**3/sqrt(x**2 + 1)), indef(x/sqrt(2*x + 1)), indef(exp(2*x)/(exp(x) + 1)), indef(sin(2*x)/(1 + sin(x)**2)),
])


# ================================================================ m3c-03 部分積分法
def _s03_l1_5(prob):
    # 各選択肢 (f, g') について、右辺の積分 ∫ f' g dx の x の次数を調べる。f'=0 のもの（f=1）は g を求めるのに元の積分が要るので不適。
    S, Cc = sp.symbols('S Cc')
    opts = {
        r"$f(x)=x,\ g'(x)=\sin x$": (x, sin(x)),
        r"$f(x)=\sin x,\ g'(x)=x$": (sin(x), x),
        r"$f(x)=x\sin x,\ g'(x)=1$": (x*sin(x), sp.Integer(1)),
        r"$f(x)=1,\ g'(x)=x\sin x$": (sp.Integer(1), x*sin(x)),
    }
    degs = {}
    for tx, (f, gp) in opts.items():
        if f == 1:
            degs[tx] = 99          # g を求めるのに元の積分が必要
            continue
        g = integrate(gp, x)
        integrand = sp.expand(diff(f, x)*g)
        poly = integrand.subs({sin(x): S, cos(x): Cc})
        degs[tx] = sp.degree(poly, x) if poly != 0 else 0
    best = min(degs.values())
    ok = [degs[c['t']] == best and list(degs.values()).count(best) == 1 for c in prob['c']]
    return '右辺 ∫f\'g の x の次数: ' + ', '.join(f'{v}' for v in degs.values()) + ' → 最小は1つだけ', ok

def _s03_l3_3():
    C = sp.Symbol('C')
    F = integrate(x*cos(2*x), x) + C
    Cv = sp.solve(F.subs(x, 0), C)[0]
    return val(F.subs(C, Cv).subs(x, pi/4))

def _s03_l3_4(prob):
    # (1) g=cos x は g'=sin x の原始関数か？  (2),(3) は g=cos x をもとにした公式どおりの計算か？
    row1_ok = eq(diff(cos(x), x), sin(x))
    row2_ok = True   # x*cos x - ∫ 1*cos x dx は fg - ∫ f'g dx の形
    row3_ok = eq(integrate(cos(x), x), sin(x))   # ∫cos x dx = sin x なので x cos x - sin x
    first = 1 if not row1_ok else (2 if not row2_ok else (3 if not row3_ok else None))
    by = {'(1) の行': first == 1, '(2) の行': first == 2, '(3) の行': first == 3, 'まちがいはない': first is None}
    ok = [by[c['t']] for c in prob['c']]
    return f'g=cos x は sin x の原始関数でない（微分すると -sin x）→ 最初の誤りは第 {first} 行', ok

def _s03_l4_4(prob):
    fn = sp.Function('f')
    cands = {
        r"$xf'(x)-f(x)+C$": x*diff(fn(x), x) - fn(x),
        r"$xf'(x)+f(x)+C$": x*diff(fn(x), x) + fn(x),
        r"$\frac{x^{2}}{2}f'(x)+C$": x**2/2*diff(fn(x), x),
        r"$xf'(x)+C$": x*diff(fn(x), x),
    }
    target = x*diff(fn(x), x, 2)
    ok = [sp.simplify(diff(cands[c['t']], x) - target) == 0 for c in prob['c']]
    return '右辺を微分して x f\'\'(x) になるか', ok

lesson_specs('m3c-03', [
    indef(x*exp(x)), indef(x*cos(x)), indef(log(x)), indef(x*log(x)), _s03_l1_5,
    indef(x*sin(2*x)), indef(x**2*exp(x)), indef(x**2*log(x)), indef(log(x)/x**2), indef((x + 1)*exp(2*x)),
    indef(exp(x)*sin(x)), indef(log(x)**2), _s03_l3_3(), _s03_l3_4, indef(x/cos(x)**2),
    indef(x*log(x)**2), indef(exp(2*x)*cos(3*x)), indef(x*exp(x)/(x + 1)**2), _s03_l4_4, indef(sin(log(x))),
])


# ================================================================ m3c-04 いろいろな関数の不定積分
lesson_specs('m3c-04', [
    indef(sin(x)**2), indef(1/((x + 1)*(x + 2))), indef(x/(x + 1)), indef(sin(3*x)*cos(x)), indef(1/(sqrt(x + 1) + sqrt(x))),
    indef((x + 5)/((x - 1)*(x + 2))), indef(sin(x)**3), indef(x**2/(x + 1)), indef(1/(x**2 - 1)), indef(1/(sqrt(x) + 1)),
    indef(sin(x)**4), indef(1/(x*(x + 1)**2)), indef(1/(1 + cos(x))), indef(1/(sin(x)*cos(x))), indef(x**3/(x**2 + 1)),
    indef(1/(x**3 + x)), indef(exp(x)/((exp(x) + 1)*(exp(x) + 2))), indef(1/sin(x)), indef(1/(x*sqrt(x + 1))), indef(sin(x)**3/cos(x)**2),
])


# ================================================================ m3c-05 定積分の置換積分法・部分積分法
def D(f, a, b):
    return integrate(f, (x, a, b))

def _s05_l4_5(prob):
    In = {k: D(sin(x)**k, 0, pi/2) for k in range(0, 10)}
    forms = {
        r'$I_{n}=\frac{n-1}{n}I_{n-2}$': lambda k: R(k - 1, k),
        r'$I_{n}=\frac{n}{n-1}I_{n-2}$': lambda k: R(k, k - 1),
        r'$I_{n}=(n-1)I_{n-2}$': lambda k: k - 1,
        r'$I_{n}=\frac{n-1}{n+1}I_{n-2}$': lambda k: R(k - 1, k + 1),
    }
    ok = []
    for c in prob['c']:
        fn = forms[c['t']]
        ok.append(all(sp.simplify(In[k] - fn(k)*In[k - 2]) == 0 for k in range(2, 10)))
    return 'I_n（n=2..9）を計算して、各関係式を確かめる', ok

lesson_specs('m3c-05', [
    val(D(2*x*(x**2 + 1)**3, 0, 1)), val(D(sin(x)**2*cos(x), 0, pi/2)), val(D(log(x)/x, 1, E)), val(D(x*exp(x), 0, 1)), val(D(x*cos(x), 0, pi)),
    val(D(x/sqrt(x + 1), 0, 3)), val(D(tan(x), 0, pi/4)), val(D(1/(1 + x**2), 0, 1)), val(D(x*sin(x), 0, pi)), val(D(x*log(x), 1, E)),
    val(D(sqrt(1 - x**2), 0, 1)), val(D(1/(x**2 + 3), 0, 3)), val(D(x**2*sin(x) + cos(x), -pi/3, pi/3)), val(D(x**2*exp(x), 0, 1)), val(D(exp(x)*cos(x), 0, pi/2)),
    val(D(sin(x)/(sin(x) + cos(x)), 0, pi/2)), numval(Integral(x*sin(x)/(1 + cos(x)**2), (x, 0, pi))), val(D(x*(1 - x)**5, 0, 1)), val(D(x**3*sqrt(1 - x**2), 0, 1)), _s05_l4_5,
])


# ================================================================ m3c-06 定積分と和の極限・定積分と不等式
import math
import numpy as _np

def _by_text(prob, table):
    """選択肢の文字列 → 真偽（このファイルで計算したもの）の表から、ok のリストを作る。"""
    ok = []
    for c in prob['c']:
        assert c['t'] in table, c['t']
        ok.append(bool(table[c['t']]))
    return ok

def _s06_l1_2(prob):
    nn = 1000
    S = float(_np.sum(_np.exp(_np.arange(1, nn + 1)/nn))/nn)
    table = {
        r'$\int_0^{1}e^{x}\,dx$': abs(float(D(exp(x), 0, 1)) - S) < 1e-2,
        r'$\int_0^{n}e^{x}\,dx$': abs(float(D(exp(x), 0, nn)) - S) < 1e-2,
        r'$\int_0^{1}\frac{1}{n}e^{x}\,dx$': abs(float(D(exp(x), 0, 1))/nn - S) < 1e-2,
        r'$\int_1^{2}e^{x}\,dx$': abs(float(D(exp(x), 1, 2)) - S) < 1e-2,
    }
    return f'n={nn} の和 S={S:.5f} と各定積分の値を比べる', _by_text(prob, table)

def _s06_l3_1(prob):
    F = lambda f, a, b: float(sp.N(D(f, a, b)))
    table = {
        r'$\int_0^{\frac{\pi}{2}}\sin x\,dx>\int_0^{\frac{\pi}{2}}\sin^{2}x\,dx$': F(sin(x), 0, pi/2) > F(sin(x)**2, 0, pi/2),
        r'$\int_0^1 x^{2}\,dx<\int_0^1 x^{3}\,dx$': F(x**2, 0, 1) < F(x**3, 0, 1),
        r'$\int_0^1 e^{-x^{2}}\,dx<\int_0^1 e^{-x}\,dx$': float(sp.N(Integral(exp(-x**2), (x, 0, 1)))) < F(exp(-x), 0, 1),
        r'$\int_0^1\sqrt{x}\,dx<\int_0^1 x\,dx$': F(sqrt(x), 0, 1) < F(x, 0, 1),
    }
    return '各辺の定積分を計算して大小を比べる', _by_text(prob, table)

def _s06_l3_2(prob):
    I = float(sp.N(Integral(1/sqrt(1 + x**4), (x, 0, 1)), 15))
    r2 = math.sqrt(2)
    table = {
        r'$\frac{1}{\sqrt{2}}\leqq I\leqq 1$': 1/r2 <= I <= 1,
        r'$1\leqq I\leqq\sqrt{2}$': 1 <= I <= r2,
        r'$0\leqq I\leqq\frac{1}{\sqrt{2}}$': 0 <= I <= 1/r2,
        r'$\frac{1}{2}\leqq I\leqq\frac{1}{\sqrt{2}}$': 0.5 <= I <= 1/r2,
    }
    return f'I={I:.6f} が各範囲に入るか', _by_text(prob, table)

def _s06_l3_3(prob):
    def holds(cmp):
        return all(cmp(sum(1.0/k for k in range(2, n + 1)), n) for n in range(2, 400))
    table = {
        r'$\sum_{k=2}^{n}\frac{1}{k}<\log n$': holds(lambda s, n: s < math.log(n)),
        r'$\sum_{k=2}^{n}\frac{1}{k}>\log n$': holds(lambda s, n: s > math.log(n)),
        r'$\sum_{k=2}^{n}\frac{1}{k}<\log(n-1)$': holds(lambda s, n: s < (math.log(n - 1) if n > 1 else 0)),
        r'$\sum_{k=2}^{n}\frac{1}{k}<\frac{1}{2}\log n$': holds(lambda s, n: s < 0.5*math.log(n)),
    }
    return 'n=2..399 のすべてで成り立つか（面積比較の不等式は 1/k < ∫_{k-1}^{k} dx/x）', _by_text(prob, table)

def _s06_l3_4(prob):
    # a_n + a_{n-1} = 1/n,  a_0 = log 2
    a = float(math.log(2))
    for m in range(1, 2001):
        a = 1.0/m - a
    ok = [abs(float(sp.N(tex(c['t']))) - a) < 1e-2 for c in prob['c']]
    return f'a_2000 = {a:.6f}（1/(2n) 程度）→ 0', ok

def _s06_l4_1(prob):
    n = 10**6
    la = -math.log(n) + (math.lgamma(2*n + 1) - math.lgamma(n + 1))/n
    an = math.exp(la)
    ok = [abs(float(sp.N(tex(c['t']))) - an) < 2e-3 for c in prob['c']]
    return f'n=10^6 で a_n = {an:.5f}，4/e = {4/math.e:.5f}', ok

def _s06_l4_3(prob):
    g = 0.5772156649015329
    n = 10**9
    Sn = math.log(n) + g + 1/(2*n)
    ratio = Sn/math.log(n)
    table = {r'$1$': abs(ratio - 1) < 0.05, r'$0$': abs(ratio) < 0.05, r'$\infty$': False, r'$\frac{1}{2}$': abs(ratio - 0.5) < 0.05}
    return f'n=10^9 で S_n/log n = {ratio:.4f}（→1）', _by_text(prob, table)

def _s06_l4_4(prob):
    # 反例の計算
    # (2) 「つねに >」：f=g=x で等号
    c2 = not (D(x, 0, 1) > D(x, 0, 1))
    # (3) 「すべての x で f>g」：f=x, g=0, [-1,2]：積分は 3/2>0 だが x=-1/2 で f<g
    c3 = (D(x, -1, 2) > 0) and (-sp.Rational(1, 2) < 0)
    # (4) 絶対値：f=sin x, [0,2π]：左辺 0、右辺 4
    c4 = (D(sin(x), 0, 2*pi) != D(Abs(sin(x)), 0, 2*pi)) if False else (abs(float(D(sin(x), 0, 2*pi))) != float(sp.N(Integral(Abs(sin(x)), (x, 0, pi)) + Integral(Abs(sin(x)), (x, pi, 2*pi)))))
    # (1) 成り立つ命題の例での確認（f=1, g=1-x, [0,1]）
    a1 = D(1, 0, 1) > D(1 - x, 0, 1)
    table = {
        r'$[a,\ b]$ で $f(x)\geqq g(x)$ であり、$f(c)>g(c)$ となる $c$ が $[a,\ b]$ にあるならば、$\int_a^b f(x)\,dx>\int_a^b g(x)\,dx$ である。': a1,
        r'$[a,\ b]$ で $f(x)\geqq g(x)$ ならば、つねに $\int_a^b f(x)\,dx>\int_a^b g(x)\,dx$ である。': not c2,
        r'$\int_a^b f(x)\,dx>\int_a^b g(x)\,dx$ ならば、$[a,\ b]$ のすべての $x$ で $f(x)>g(x)$ である。': not c3,
        r'$\left|\int_a^b f(x)\,dx\right|=\int_a^b|f(x)|\,dx$ が、つねに成り立つ。': not c4,
    }
    return '反例を計算：f=g（等号）、f=x,g=0 on [-1,2]、sin x on [0,2π] → 3つは偽、残りは定理（連続・非負・1点で正→積分>0）', _by_text(prob, table)

lesson_specs('m3c-06', [
    sum_limit(lambda k, n: (k/n)**2/n, R(1, 3)), _s06_l1_2, sum_limit(lambda k, n: _np.sin(k*_np.pi/n)/n, 2/pi),
    sum_limit(lambda k, n: 1/(n + k), log(2)), sum_limit(lambda k, n: (2/n)*(1 + 2*k/n)**2, R(26, 3)),
    sum_limit(lambda k, n: n/(n**2 + k**2), pi/4), sum_limit(lambda k, n: _np.sqrt(k)/(n*_np.sqrt(n)), R(2, 3)),
    sum_limit(lambda k, n: 1/_np.sqrt(4*n**2 - k**2), pi/6), sum_limit(lambda k, n: (k/n)*_np.exp(k/n)/n, sp.Integer(1)),
    sum_limit(lambda k, n: k/(n**2 + k**2), log(2)/2),
    _s06_l3_1, _s06_l3_2, _s06_l3_3, _s06_l3_4, sum_limit(lambda k, n: _np.log(1 + k/n)/n, 2*log(2) - 1),
    _s06_l4_1, sum_limit(lambda k, n: (k/n)*_np.sin(k*_np.pi/n)/n, 1/pi), _s06_l4_3, _s06_l4_4,
    sum_limit(lambda k, n: _np.sqrt(n**2 - k**2)/n**2, pi/4),
])


# ================================================================ m3c-07 面積
import mpmath as _mp

def numarea(top, bottom, a, b, var=None, parts=600):
    """∫_a^b |top - bottom| d var を数値で（区間を細かく分けて）計算する。折れ曲がり（符号変化）があっても精度が出る。"""
    var = var or x
    h = sp.lambdify(var, sp.sympify(top) - sp.sympify(bottom), 'mpmath')
    a_, b_ = float(sp.N(a)), float(sp.N(b))
    pts = [a_ + (b_ - a_)*i/parts for i in range(parts + 1)]
    return float(_mp.quad(lambda s: abs(h(s)), pts))

def area_check(exact, top, bottom, a, b, var=None):
    """exact：手計算の式（区間を分けて符号をそろえたもの）。numarea（絶対値の数値積分）と一致し、かつ選択肢のうち 1 つだけが一致するか。"""
    def run(prob):
        num = numarea(top, bottom, a, b, var)
        ex = float(sp.N(exact, 20))
        good = abs(num - ex) < 1e-6
        ok = [good and abs(float(sp.N(tex(c['t']), 20)) - ex) < 1e-7 for c in prob['c']]
        return f'面積 ≈ {num:.8f}（絶対値の数値積分）, 厳密値 {sp.simplify(exact)} ≈ {ex:.8f}' + ('' if good else '  【数値積分と合わない！】'), ok
    return run

def _s07_l3_4():
    # x=t^2, y=t^3, 0<=t<=1 → ∫ y dx
    ex = integrate(t**3*diff(t**2, t), (t, 0, 1))
    def run(prob):
        num = float(_mp.quad(lambda s: abs(s**3*2*s), [i/200 for i in range(201)]))
        ok = [abs(float(sp.N(tex(c['t']), 20)) - num) < 1e-7 for c in prob['c']]
        return f'∫y dx = {ex} ≈ {num:.8f}', ok
    return run

def _s07_l4_1():
    # サイクロイド：x=t-sin t, y=1-cos t
    def run(prob):
        num = float(_mp.quad(lambda s: abs((1 - _mp.cos(s))*(1 - _mp.cos(s))), [2*float(_mp.pi)*i/400 for i in range(401)]))
        ok = [abs(float(sp.N(tex(c['t']), 20)) - num) < 1e-6 for c in prob['c']]
        return f'∫y dx = ∫(1-cos t)^2 dt ≈ {num:.8f} (3π={3*math.pi:.8f})', ok
    return run

def _s07_l4_2():
    m = sp.Symbol('m')
    # 放物線 y=x-x^2 と x 軸の面積 1/6、直線 y=mx より上側（放物線との間）の面積 = 1/12 を満たす m
    A_all = integrate(x - x**2, (x, 0, 1))
    A_up = integrate(x - x**2 - m*x, (x, 0, 1 - m))
    sol = sp.nsolve(sp.Eq(A_up, A_all/2), m, 0.2)
    def run(prob):
        ok = [abs(float(sp.N(tex(c['t']), 20)) - float(sol)) < 1e-9 for c in prob['c']]
        return f'全体 {A_all}、上側 = (1-m)^3/6 = 1/12 → m ≈ {float(sol):.10f}', ok
    return run

def _s07_l4_3():
    # 原点から y=log x への接線：接点 (t, log t)、傾き 1/t、原点を通る → log t = 1
    tt = sp.Symbol('tt', positive=True)
    t0 = sp.solve(sp.Eq(log(tt), 1), tt)[0]
    slope = 1/t0
    def run(prob):
        ex = float(sp.N(t0/2 - integrate(log(x), (x, 1, t0)), 20))
        num = float(_mp.quad(lambda s: float(slope)*s - (max(_mp.log(s), 0) if s > 0 else 0), [0, 1, float(t0)]))
        good = abs(num - ex) < 1e-8
        ok = [good and abs(float(sp.N(tex(c['t']), 20)) - ex) < 1e-8 for c in prob['c']]
        return f'接点 x={t0}、傾き {slope}。面積 ≈ {num:.8f}（= e/2-1 = {math.e/2-1:.8f}）', ok
    return run

lesson_specs('m3c-07', [
    area_check(D(4 - x**2, -2, 2), 0, x**2 - 4, -2, 2),
    area_check(D(exp(x), 0, 1), exp(x), 0, 0, 1),
    area_check(D(1/x, 1, E**2), 1/x, 0, 1, E**2),
    area_check(D(x - x**2, 0, 1), x, x**2, 0, 1),
    area_check(D(sqrt(x), 0, 4), sqrt(x), 0, 0, 4),
    area_check(D(cos(x) - sin(x), 0, pi/4) + D(sin(x) - cos(x), pi/4, pi/2), sin(x), cos(x), 0, pi/2),
    area_check(D(x**3 - x, -1, 0) + D(x - x**3, 0, 1), x**3 - x, 0, -1, 1),
    area_check(D(log(x), 1, E), log(x), 0, 1, E),
    area_check(integrate(2*y - y**2, (y, 0, 2)), 0, y**2 - 2*y, 0, 2, y),
    area_check(D(3 - exp(x), 0, log(3)), 3, exp(x), 0, log(3)),
    area_check(D((-x**2 + 4*x) - (x**2 - 2*x), 0, 3), -x**2 + 4*x, x**2 - 2*x, 0, 3),
    area_check(D(sin(2*x), 0, pi/2) - D(sin(2*x), pi/2, pi), sin(2*x), 0, 0, pi),
    area_check(D(exp(x) - x - 1, 0, 1), exp(x), x + 1, 0, 1),
    _s07_l3_4(),
    area_check(2*(D(3, 0, 2) - D(1 - x**2, 0, 1) - D(x**2 - 1, 1, 2)), 3, Abs(x**2 - 1), -2, 2),
    _s07_l4_1(), _s07_l4_2(), _s07_l4_3(),
    area_check(D(sin(2*x) - sin(x), 0, pi/3) + D(sin(x) - sin(2*x), pi/3, pi), sin(x), sin(2*x), 0, pi),
    area_check(D(exp(-x)*sin(x), 0, pi), exp(-x)*sin(x), 0, 0, pi),
])


# ================================================================ m3c-08 体積
import numpy as _np

def mc_vol(indicator, lo, hi, n=4_000_000, seed=2024):
    """モンテカルロ：立体の定義（不等式）そのものから体積を見積もる。箱 [lo,hi]（3次元）に一様に点を打つ。"""
    rng = _np.random.default_rng(seed)
    lo = _np.array(lo, float); hi = _np.array(hi, float)
    pts = rng.uniform(lo, hi, size=(n, 3))
    inside = indicator(pts[:, 0], pts[:, 1], pts[:, 2])
    return float(_np.prod(hi - lo)*_np.mean(inside))

def vol_check(exact, indep_fn, rel=0.015, label='MC'):
    """exact：解答で使った厳密値。indep_fn()：立体の定義から別の方法で出した体積（MC など）。"""
    def run(prob):
        ex = float(sp.N(exact, 20))
        iv = indep_fn()
        good = abs(iv - ex) <= rel*ex
        ok = [good and abs(float(sp.N(tex(c['t']), 20)) - ex) < 1e-8 for c in prob['c']]
        return f'体積 ≈ {iv:.5f}（{label}）、厳密値 {sp.simplify(exact)} ≈ {ex:.5f}' + ('' if good else '  【独立計算と合わない！】'), ok
    return run

# x 軸まわり：点 (x,y,z) が立体に入る ⇔ 区間内の x で、半径 √(y²+z²) が [r_in(x), r_out(x)]
def rot_x(r_in, r_out, a, b, M):
    def f():
        def ind(X, Y, Z):
            r = _np.sqrt(Y**2 + Z**2)
            return (X >= a) & (X <= b) & (r >= r_in(X)) & (r <= r_out(X))
        return mc_vol(ind, (a, -M, -M), (b, M, M))
    return f

# y 軸まわり：点が立体に入る ⇔ 区間内の y で、半径 √(x²+z²) が [r_in(y), r_out(y)]
def rot_y(r_in, r_out, c, d, M):
    def f():
        def ind(X, Y, Z):
            r = _np.sqrt(X**2 + Z**2)
            return (Y >= c) & (Y <= d) & (r >= r_in(Y)) & (r <= r_out(Y))
        return mc_vol(ind, (-M, c, -M), (M, d, M))
    return f

Z0 = lambda v: 0*v

def _s08_l2_5():
    def f():
        def ind(X, Y, Z):
            return (X >= 0) & (X <= _np.pi) & (Y >= 0) & (Y <= _np.sin(X)) & (Z >= 0) & (Z <= _np.sin(X))
        return mc_vol(ind, (0, 0, 0), (_np.pi, 1, 1))
    return vol_check(pi/2, f)

def _s08_l3_2():
    def f():
        def ind(X, Y, Z):
            return X**2 + (_np.sqrt(Y**2 + Z**2) - 2)**2 <= 1
        return mc_vol(ind, (-1, -3, -3), (1, 3, 3))
    return vol_check(4*pi**2, f)

def _s08_l4_2():
    def f():
        def ind(X, Y, Z):
            rho = _np.sqrt((Y + 1)**2 + Z**2)
            return (X >= 0) & (X <= _np.pi) & (rho >= 1) & (rho <= 1 + _np.sin(X))
        return mc_vol(ind, (0, -3, -2), (_np.pi, 1, 2))
    return vol_check(pi**2/2 + 4*pi, f)

def _s08_l4_4():
    def f():
        return mc_vol(lambda X, Y, Z: (X**2 + Y**2 <= 1) & (X**2 + Z**2 <= 1), (-1, -1, -1), (1, 1, 1))
    return vol_check(R(16, 3), f)

def _s08_l4_5():
    def f():
        return mc_vol(lambda X, Y, Z: (X**2 + Y**2 + Z**2 <= 4) & (Z >= 1), (-2, -2, 1), (2, 2, 2))
    return vol_check(5*pi/3, f)

lesson_specs('m3c-08', [
    vol_check(8*pi, rot_x(Z0, lambda X: _np.sqrt(X), 0, 4, 2)),
    vol_check(pi*(E**2 - 1)/2, rot_x(Z0, lambda X: _np.exp(X), 0, 1, float(E))),
    vol_check(9*pi, rot_x(Z0, lambda X: X, 0, 3, 3)),
    vol_check(2*pi, rot_y(Z0, lambda Y: _np.sqrt(Y), 0, 2, 1.5)),
    vol_check(4*pi/3, rot_x(Z0, lambda X: _np.sqrt(1 - X**2), -1, 1, 1)),
    vol_check(pi**2/2, rot_x(Z0, lambda X: _np.sin(X), 0, float(pi), 1)),
    vol_check(2*pi/15, rot_x(lambda X: X**2, lambda X: X, 0, 1, 1)),
    vol_check(pi*(1 - 1/E), rot_x(Z0, lambda X: 1/X, 1, float(E), 1)),
    vol_check(2*pi/5, rot_y(lambda Y: Y**(1/3), lambda Y: 1 + 0*Y, 0, 1, 1)),
    _s08_l2_5(),
    vol_check(pi*(E**2 + E**-2 - 2)/2, rot_x(lambda X: _np.exp(-X), lambda X: _np.exp(X), 0, 1, float(E))),
    _s08_l3_2(),
    vol_check(pi*(E - 2), rot_x(Z0, lambda X: _np.log(X), 1, float(E), 1)),
    vol_check(pi*(E**2 + 1)/2, rot_y(lambda Y: _np.exp(Y), lambda Y: float(E) + 0*Y, 0, 1, float(E))),
    vol_check(8*pi/3, rot_x(Z0, lambda X: _np.sqrt(1 - X**2/4), -2, 2, 1)),
    vol_check(pi*(1 - 5*E**-2)/4, rot_x(Z0, lambda X: X*_np.exp(-X), 0, 1, 0.37)),
    _s08_l4_2(),
    vol_check(8*pi/3, rot_y(lambda Y: Y/2, lambda Y: _np.sqrt(Y), 0, 4, 2)),
    _s08_l4_4(), _s08_l4_5(),
])


# ================================================================ m3c-09 曲線の長さと道のり
def _lam(expr, var):
    return sp.lambdify(var, expr, 'mpmath')

def _quad_abs(h, a, b, parts=800):
    a_, b_ = float(sp.N(a)), float(sp.N(b))
    pts = [a_ + (b_ - a_)*i/parts for i in range(parts + 1)]
    return float(_mp.quad(lambda s: abs(h(s)), pts))

def num_check(exact, num_fn, label, tol=1e-6):
    def run(prob):
        num = num_fn()
        ex = float(sp.N(exact, 20))
        good = abs(num - ex) < tol
        ok = [good and abs(float(sp.N(tex(c['t']), 20)) - ex) < 1e-8 for c in prob['c']]
        return f'{label} ≈ {num:.8f}、厳密値 {sp.simplify(exact)} ≈ {ex:.8f}' + ('' if good else '  【数値計算と合わない！】'), ok
    return run

def path_v(v, a, b, label='道のり ∫|v|dt'):
    """数直線上の運動：速度 v(t) → 道のり"""
    return lambda exact: num_check(exact, lambda: _quad_abs(_lam(v, t), a, b), label)

def path_x(xt, a, b):
    """数直線上の運動：位置 x(t) → v=x'(t) → 道のり"""
    return lambda exact: num_check(exact, lambda: _quad_abs(_lam(diff(xt, t), t), a, b), '道のり ∫|x\'(t)|dt')

def path_xy(xt, yt, a, b):
    """平面上の運動・媒介変数表示：∫ sqrt(x'^2+y'^2) dt"""
    h = _lam(sp.sqrt(diff(xt, t)**2 + diff(yt, t)**2), t)
    return lambda exact: num_check(exact, lambda: _quad_abs(h, a, b), '長さ ∫√(x\'²+y\'²)dt')

def graph_len(fx, a, b):
    """y=f(x)：∫ sqrt(1+f'^2) dx"""
    h = _lam(sp.sqrt(1 + diff(fx, x)**2), x)
    return lambda exact: num_check(exact, lambda: _quad_abs(h, a, b), '長さ ∫√(1+y\'²)dx')

def _s09_l4_5():
    # 長さ L(a) = ∫_0^a sqrt(1+y'^2) dx = 3/4 となる a を、数値積分と求根で出す
    y_ = (exp(x) + exp(-x))/2
    h = _lam(sp.sqrt(1 + diff(y_, x)**2), x)
    root = _mp.findroot(lambda a_: _mp.quad(h, [0, a_]) - _mp.mpf(3)/4, 0.5)
    def run(prob):
        r = float(root)
        ok = [abs(float(sp.N(tex(c['t']), 20)) - r) < 1e-9 for c in prob['c']]
        return f'L(a)=3/4 の解 a ≈ {r:.10f}（log 2 = {math.log(2):.10f}）', ok
    return run

lesson_specs('m3c-09', [
    path_v(3*t**2, 0, 2)(8), graph_len(2*x + 1, 0, 3)(3*sqrt(5)), graph_len(R(2, 3)*x**R(3, 2), 0, 3)(R(14, 3)),
    path_xy(3*cos(t), 3*sin(t), 0, pi)(3*pi), path_v(cos(t), 0, pi)(2),
    path_v(t**2 - 4*t + 3, 0, 4)(4), path_xy(3*t**2, 2*t**3, 0, 1)(4*sqrt(2) - 2), graph_len((exp(x) + exp(-x))/2, 0, 1)((E - 1/E)/2),
    path_xy(cos(t)**3, sin(t)**3, 0, pi/2)(R(3, 2)), path_xy(cos(t) + t*sin(t), sin(t) - t*cos(t), 0, pi)(pi**2/2),
    path_x(t**3 - 6*t**2 + 9*t, 0, 5)(28), path_xy(t - sin(t), 1 - cos(t), 0, 2*pi)(8), graph_len(x**2/4 - log(x)/2, 1, E)((E**2 + 1)/4),
    path_xy(t**2/2, t**3/3, 0, sqrt(3))(R(7, 3)), path_v(20 - 4*t, 0, 5)(50),
    path_xy(exp(t)*cos(t), exp(t)*sin(t), 0, pi)(sqrt(2)*(exp(pi) - 1)), graph_len(x**2/2, 0, 1)((sqrt(2) + log(1 + sqrt(2)))/2),
    graph_len(log(cos(x)), 0, pi/4)(log(1 + sqrt(2))), path_xy(cos(t)**3, sin(t)**3, 0, 2*pi)(6), _s09_l4_5(),
])



if __name__ == '__main__':
    sys.exit(main(sys.argv))
