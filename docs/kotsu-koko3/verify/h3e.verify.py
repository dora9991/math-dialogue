# -*- coding: utf-8 -*-
"""h3e（数学C 平面上の曲線と複素数平面 mc2-01〜mc2-10）の正解の確かめ。
使い方: cd h3 && python3 out/h3e.verify.py [mc2-03 ...]
out/h3e/<授業>.json を読み、各問題について「問題 → 計算した答え」を一覧にし、正解の選択肢と突き合わせる。
- 数値・式の選択肢は、TeX を sympy に変換して、計算した答えと一致するか（正解）／一致しないか（まちがい）を確かめる。
- 方程式の選択肢は、曲線上の点を代入して成り立つか（正解）／成り立たない点があるか（まちがい）を確かめる。
- 文章・複合の選択肢は、計算した答えを「正解の選択肢に入るはずの語句」と突き合わせる（text=...）。
"""
import json, re, sys, os, cmath, math, itertools
from fractions import Fraction
import sympy as sp
from sympy import I, sqrt, pi, Rational, cos, sin, tan, symbols, simplify, N, expand, conjugate, Abs, exp, solve, Eq
from sympy.parsing.sympy_parser import (parse_expr, standard_transformations,
                                         implicit_multiplication_application, convert_xor)

HERE = os.path.dirname(os.path.abspath(__file__))
x, y, t, th = symbols('x y t theta', real=True)
TR = standard_transformations + (implicit_multiplication_application, convert_xor)

# ---------- TeX → sympy ----------
def _grp(s, i):
    while s[i] == ' ':
        i += 1
    if s[i] != '{':
        return s[i], i + 1
    d = 0
    for j in range(i, len(s)):
        if s[j] == '{': d += 1
        elif s[j] == '}':
            d -= 1
            if d == 0:
                return s[i + 1:j], j + 1
    raise ValueError('brace: ' + s)

def _conv(s):
    out = ''; i = 0
    while i < len(s):
        if s.startswith('\\frac', i):
            i += 5; a, i = _grp(s, i); b, i = _grp(s, i); out += '((%s)/(%s))' % (_conv(a), _conv(b))
        elif s.startswith('\\sqrt', i):
            i += 5; a, i = _grp(s, i); out += 'sqrt(%s)' % _conv(a)
        elif s.startswith('\\overline', i):
            i += 9; a, i = _grp(s, i); out += 'conjugate(%s)' % _conv(a)
        elif s.startswith('\\pi', i): out += ' pi '; i += 3
        elif s.startswith('\\cos', i): out += ' cos '; i += 4
        elif s.startswith('\\sin', i): out += ' sin '; i += 4
        elif s.startswith('\\tan', i): out += ' tan '; i += 4
        elif s.startswith('\\theta', i): out += ' theta '; i += 6
        elif s.startswith('\\times', i) or s.startswith('\\cdot', i):
            out += '*'; i += 6 if s.startswith('\\times', i) else 5
        elif s[i] == '^':
            i += 1; a, i = _grp(s, i); out += '**(%s)' % _conv(a)
        elif s[i] == '{':
            a, i = _grp(s, i); out += '(%s)' % _conv(a)
        elif s[i] == '\\':
            raise ValueError('未対応のTeX: ' + s[i:i + 12])
        else:
            out += s[i]; i += 1
    return out

def tex2expr(s):
    s = s.replace('$', '').replace('\\left', '').replace('\\right', '').replace('\\,', '').replace('\\ ', ' ').replace('\\dfrac', '\\frac')
    s = re.sub(r'\\(sin|cos|tan)\^\{(\d+)\}\\theta', r'(\\\1\\theta)^{\2}', s)
    s = s.replace('^{\\circ}', '*pi/180').replace('個', '').replace('cm', '').replace('本', '').replace('点', '')
    s = re.sub(r'^\s*[A-Za-z]\s*=\s*', '', s) if re.match(r'^\s*[a-z]\s*=\s*[-+0-9\\\\(]', s) else s
    py = _conv(s)
    py = re.sub(r'(?<![A-Za-z])i(?![A-Za-z])', 'I', py)
    return parse_expr(py, local_dict={'x': x, 'y': y, 't': t, 'theta': th, 'I': I, 'pi': pi, 'conjugate': conjugate}, transformations=TR)

def tex_num(s):
    return complex(N(tex2expr(s), 30))

def same(a, b, tol=1e-9):
    return abs(complex(N(a, 30)) - complex(N(b, 30))) < tol

def split_top(s, sep=','):
    parts = []; d = 0; cur = ''
    for ch in s:
        if ch in '({[': d += 1
        if ch in ')}]': d -= 1
        if ch == sep and d == 0:
            parts.append(cur); cur = ''
        else:
            cur += ch
    parts.append(cur)
    return parts

def tex_tuple(s):
    s = s.replace('$', '').strip().replace('\\left', '').replace('\\right', '')
    assert s[0] == '(' and s[-1] == ')', s
    return tuple(tex2expr(p) for p in split_top(s[1:-1]))

def tex_eq(s):
    """'y^{2}=4x' → sympy 式 (左辺-右辺)"""
    s = s.replace('$', '')
    l, r = s.split('=')
    return tex2expr(l) - tex2expr(r)

# ---------- 問題の読み込み ----------
ITEMS = {}
def load(lessons):
    for lid in lessons:
        p = os.path.join(HERE, 'h3e', lid + '.json')
        if os.path.exists(p):
            for it in json.load(open(p, encoding='utf-8')):
                ITEMS[it['id']] = it

def correct(it):
    return [c for c in it['c'] if c.get('k') == 1][0]['t']

LOG = []
FAIL = []
def rec(pid, computed, ok, note=''):
    it = ITEMS[pid]
    LOG.append((pid, computed, correct(it), ok, note))
    if not ok:
        FAIL.append((pid, computed, correct(it), note))

# ---------- 検査の型 ----------
def V(pid, value, show=None):
    """選択肢を数として読み、正解の選択肢だけが value に一致する"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        try:
            v = tex_num(c['t'])
        except Exception as ex:
            ok = False; note += ' 読めない選択肢:%s(%s)' % (c['t'], ex); continue
        eq = same(v, value)
        if (c.get('k') == 1) != eq:
            ok = False; note += ' 不一致:%s' % c['t']
    rec(pid, show if show is not None else str(value), ok, note)

def VT(pid, value, show=None):
    """選択肢を座標（タプル）として読み、正解だけが value（タプル）に一致する"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        try:
            tv = tex_tuple(c['t'])
        except Exception as ex:
            ok = False; note += ' 読めない:%s(%s)' % (c['t'], ex); continue
        eq = len(tv) == len(value) and all(same(a, b) for a, b in zip(tv, value))
        if (c.get('k') == 1) != eq:
            ok = False; note += ' 不一致:%s' % c['t']
    rec(pid, show if show is not None else str(value), ok, note)

def VE(pid, points, show='', extra=None):
    """選択肢を方程式として読み、points（正しい曲線上の点 (x,y) の列）を代入して、正解だけが全点で成り立つ"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        try:
            ex = tex_eq(c['t'].split('\\ (')[0].split('\\quad')[0]) if True else None
        except Exception as e:
            ok = False; note += ' 読めない:%s(%s)' % (c['t'], e); continue
        allzero = all(abs(complex(N(ex.subs({x: px, y: py}), 30))) < 1e-9 for px, py in points)
        if (c.get('k') == 1) != allzero:
            ok = False; note += ' 不一致:%s' % c['t']
    rec(pid, show, ok, note)

def TXT(pid, computed, text):
    """文章の選択肢：正解の選択肢の本文に text が含まれ、(まちがいの選択肢には含まれない)"""
    it = ITEMS[pid]
    norm = lambda s: re.sub(r'[\s$]', '', s)
    ok = norm(text) in norm(correct(it))
    note = '' if ok else ' 正解の選択肢に「%s」が無い' % text
    for c in it['c']:
        if c.get('k') != 1 and norm(text) == norm(c['t']):
            ok = False; note += ' まちがいの選択肢が同じ'
    rec(pid, computed, ok, note)

def ANS(pid, computed, text):
    """正解の選択肢の本文が text と（空白・$を除いて）一致する"""
    norm = lambda s: re.sub(r'[\s$]', '', s)
    it = ITEMS[pid]
    ok = norm(text) == norm(correct(it))
    rec(pid, computed, ok, '' if ok else ' 期待:%s' % text)

def pm_values(tex):
    """'\\pm' を含む選択肢を、+ と - の2通りの値の集合にする（無ければ1つ）"""
    t_ = tex.replace('$', '')
    if '\\pm' in t_:
        return [tex_num(t_.replace('\\pm', '+', 1)), tex_num(t_.replace('\\pm', '-', 1))]
    return [tex_num(t_)]

def same_set(a, b, tol=1e-9):
    a = [complex(N(v, 30)) for v in a]; b = [complex(N(v, 30)) for v in b]
    return all(any(abs(u - v) < tol for v in b) for u in a) and all(any(abs(u - v) < tol for v in a) for u in b)

def VS(pid, values, show=None):
    """選択肢（±つき可）を値の集合として読み、正解だけが values と一致する"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        try:
            vs = pm_values(c['t'])
        except Exception as ex:
            ok = False; note += ' 読めない:%s(%s)' % (c['t'], ex); continue
        eq = same_set(vs, values)
        if (c.get('k') == 1) != eq:
            ok = False; note += ' 不一致:%s' % c['t']
    rec(pid, show if show is not None else str(values), ok, note)

def STM(pid, preds, samples, show=''):
    """記述の正誤：preds[i](s) が選択肢 i の記述。全 samples で成り立つのは正解の選択肢だけ"""
    it = ITEMS[pid]; ok = True; note = ''
    for i, (c, pr) in enumerate(zip(it['c'], preds)):
        always = all(pr(s) for s in samples)
        if (c.get('k') == 1) != always:
            ok = False; note += ' 不一致(%s):%s' % ('ABCD'[i], c['t'])
    rec(pid, show, ok, note)

def main_report(lessons):
    for (pid, comp, cor, ok, note) in LOG:
        q = re.sub(r'\s+', ' ', ITEMS[pid]['q'])[:60]
        print('%s %s | %s => 計算:%s | 正解の選択肢:%s%s' % ('OK ' if ok else 'NG ', pid, q, comp, cor, note))
    print('\n検査した問題 %d 問、不一致 %d 問' % (len(LOG), len(FAIL)))
    for f in FAIL:
        print('  NG', f)
    # 全問が検査されたか
    miss = [k for k in ITEMS if k not in {l[0] for l in LOG}]
    if miss:
        print('  未検査:', miss)
    # 正解の位置
    from collections import Counter
    for lid in lessons:
        pos = Counter()
        for k, it in ITEMS.items():
            if it['l'] == lid:
                pos['ABCD'[[c.get('k') for c in it['c']].index(1)]] += 1
        if pos:
            print(lid, dict(sorted(pos.items())))
    return len(FAIL) == 0 and not miss

# ===== ここから授業ごとの確かめ =====

import random
random.seed(1)
def rc(): return complex(random.uniform(-3, 3), random.uniform(-3, 3))

def lesson01():
    P = 'mc2-01-'
    VT(P+'L1-01', (-3, 4), '(-3,4)')
    V(P+'L1-02', abs(3-4*I))
    V(P+'L1-03', conjugate(2-5*I))
    V(P+'L1-04', Abs((4+6*I)-(1+2*I)))
    V(P+'L1-05', expand((3+4*I)*(3-4*I)))
    V(P+'L2-01', conjugate(simplify((1+2*I)/(1-I))))
    V(P+'L2-02', simplify(Abs(expand((1+sqrt(3)*I)*(1-I)))))
    a = symbols('a', real=True)
    V(P+'L2-03', solve(sp.im(expand((a+3*I)*(2-I))), a)[0])
    # (a+i)^2 が純虚数: 実部=0 かつ 虚部≠0
    sol = [s_ for s_ in solve(sp.re(expand((a+I)**2)), a) if sp.im(expand((a+I)**2)).subs(a, s_) != 0]
    VS(P+'L2-04', sol)
    V(P+'L2-05', (2+3*I + 6-I)/2)
    # L3-01: 記述の正誤を乱数で確かめる
    S = [rc() for _ in range(50)]
    STM(P+'L3-01', [lambda z: abs((z-z.conjugate()).imag) < 1e-9,   # z - z̄ は実数
                    lambda z: abs((z*z.conjugate()).imag) < 1e-9,                            # z z̄ は実数
                    lambda z: abs((z+z.conjugate()).real) < 1e-9 and abs((z+z.conjugate()).imag) > 1e-12,  # z+z̄ は純虚数
                    lambda z: abs(z*z.conjugate() - abs(z)) < 1e-9], S, 'z z̄ は実数（つねに成立）')
    zz = symbols('zz')
    a_, b_ = symbols('a_ b_', real=True)
    sols = solve([sp.re(expand((a_+b_*I)**2 - (-5+12*I))), sp.im(expand((a_+b_*I)**2 - (-5+12*I)))], [a_, b_], dict=True)
    VS(P+'L3-02', [s_[a_] + s_[b_]*I for s_ in sols], str([s_[a_] + s_[b_]*I for s_ in sols]))
    b = symbols('b', real=True)
    VS(P+'L3-03', [3+s_*I for s_ in solve(3**2+b**2-25, b)])
    # L3-04: 三角形の辺の長さ
    O, A, B = 0, 4, 2+2*sqrt(3)*I
    sides = [simplify(Abs(O-A)), simplify(Abs(O-B)), simplify(Abs(A-B))]
    assert sides == [4, 4, 4], sides
    ANS(P+'L3-04', '3辺 %s → 正三角形' % sides, '正三角形である。')
    xs, ys = symbols('xs ys', real=True)
    sol = solve([xs+ys-7, xs**2+ys**2-25], [xs, ys], dict=True)
    zs = [s_[xs] + s_[ys]*I for s_ in sol]
    zbig = max(zs, key=lambda w: sp.im(w))
    V(P+'L3-05', zbig, str(zs))
    # L4-01: |α|=2,|β|=3 の乱数で
    vals = []
    for _ in range(5):
        al = 2*cmath.exp(1j*random.uniform(0, 6.28)); be = 3*cmath.exp(1j*random.uniform(0, 6.28))
        vals.append(abs(al+be)**2 + abs(al-be)**2)
    assert all(abs(v-26) < 1e-9 for v in vals)
    V(P+'L4-01', 26)
    zr = solve(zz+1/zz-sqrt(2), zz)
    vv = {simplify(r**2+1/r**2) for r in zr}
    assert vv == {0}
    V(P+'L4-02', 0, 'z=%s → 0' % zr)
    cnt = len([(i, j) for i in range(-5, 6) for j in range(-5, 6) if i*i+j*j == 25])
    V(P+'L4-03', cnt)
    al, be = symbols('al be')
    # |α|=|β|=1 かつ α+β=1：α=a+bi とおくと |1-α|=1, |α|=1 → a=1/2, b=±√3/2
    a1, b1 = symbols('a1 b1', real=True)
    sol2 = solve([a1**2+b1**2-1, (1-a1)**2+b1**2-1], [a1, b1], dict=True)
    cand = [s_[a1]+s_[b1]*I for s_ in sol2]
    print('  [L4-04] α の候補', cand)
    prods = {simplify(c*(1-c)) for c in cand}
    assert all(abs(complex(N(Abs(c)))-1) < 1e-12 and abs(complex(N(Abs(1-c)))-1) < 1e-12 for c in cand)
    assert prods == {1}
    V(P+'L4-04', 1, 'α,β=(1±√3i)/2 → αβ=1')
    xx = symbols('xx', real=True)
    V(P+'L4-05', solve((xx-1)**2+4-((xx-5)**2+16), xx)[0])

def ang(z):
    """0 <= θ < 2π の偏角（実数）"""
    a = cmath.phase(complex(N(z, 30)))
    return a + 2*math.pi if a < -1e-12 else a

def VRT(pid, r, theta, show=None):
    """『絶対値 $r$、偏角 $θ$』の形の選択肢"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        m = re.match(r'絶対値 \$(.+?)\$、偏角 \$(.+)\$$', c['t'])
        if not m:
            ok = False; note += ' 形がちがう:' + c['t']; continue
        rv, tv = tex_num(m.group(1)), tex_num(m.group(2))
        eq = same(rv, r) and same(tv, theta)
        if (c.get('k') == 1) != eq:
            ok = False; note += ' 不一致:' + c['t']
    rec(pid, show if show is not None else '(%s, %s)' % (r, theta), ok, note)

def lesson02():
    P = 'mc2-02-'
    V(P+'L1-01', 1+I)
    V(P+'L1-02', expand(2*(cos(pi/3)+I*sin(pi/3))))
    V(P+'L1-03', ang(-1+1j), '偏角 %.6f = 3π/4' % ang(-1+1j))
    V(P+'L1-04', ang(-2j), '偏角 %.6f = 3π/2' % ang(-2j))
    z1 = 2*(cos(pi/6)+I*sin(pi/6)); z2 = 3*(cos(pi/3)+I*sin(pi/3))
    pr = simplify(z1*z2)
    VRT(P+'L1-05', abs(complex(N(pr))), ang(pr), '積 %s → 絶対値 %s 偏角/π=%s' % (simplify(pr), round(abs(complex(N(pr))), 9), round(ang(pr)/math.pi, 9)))
    V(P+'L2-01', -sqrt(3)+I)
    V(P+'L2-02', 1-sqrt(3)*I)
    V(P+'L2-03', ang((1+1j)*(1+math.sqrt(3)*1j)), '偏角/π=%.6f (7/12=%.6f)' % (ang((1+1j)*(1+math.sqrt(3)*1j))/math.pi, 7/12))
    w1 = 4*(cos(5*pi/6)+I*sin(5*pi/6)); w2 = 2*(cos(pi/3)+I*sin(pi/3))
    V(P+'L2-04', simplify(expand(w1/w2)))
    V(P+'L2-05', expand((1+sqrt(3)*I)*(cos(pi/3)+I*sin(pi/3))))
    V(P+'L3-01', (math.pi/4 - 2*math.pi/3) % (2*math.pi), '偏角の差 mod 2π /π = %.6f' % (((math.pi/4 - 2*math.pi/3) % (2*math.pi))/math.pi))
    zw = (-1+1j)*(math.sqrt(3)+1j)
    V(P+'L3-02', zw, 'zw=%s |zw|=%.6f arg/π=%.6f' % (zw, abs(zw), ang(zw)/math.pi))
    # L3-03: 記述の正誤
    S = []
    for _ in range(40):
        r = random.uniform(0.5, 4); th_ = random.uniform(0, 2*math.pi)
        S.append((r, th_, r*cmath.exp(1j*th_)))
    def modeq(a, b): return abs(math.remainder(a-b, 2*math.pi)) < 1e-9
    preds = [
        lambda s: abs(abs(s[2].conjugate())-s[0]) < 1e-9 and modeq(cmath.phase(s[2].conjugate()), s[1]),
        lambda s: abs(abs(-s[2])-(-s[0])) < 1e-9 and modeq(cmath.phase(-s[2]), s[1]+math.pi),
        lambda s: abs(abs(1/s[2])-1/s[0]) < 1e-9 and modeq(cmath.phase(1/s[2]), -s[1]),
        lambda s: abs(abs(s[2]**2)-2*s[0]) < 1e-9 and modeq(cmath.phase(s[2]**2), 2*s[1]),
    ]
    STM(P+'L3-03', preds, S, '1/z の絶対値 1/r、偏角 -θ のみつねに成立')
    V(P+'L3-04', expand((1+sqrt(3)*I)*(cos(-pi/6)+I*sin(-pi/6))))
    zz = (1+1j)/(math.sqrt(3)-1j)
    V(P+'L3-05', ang(zz), '偏角/π=%.6f' % (ang(zz)/math.pi))
    V(P+'L4-01', simplify((1+sqrt(3)*I)/(-sqrt(3)+I)))
    # cos(5π/12): 実部の比較
    pr = expand((1+I)*(sqrt(3)+I)); rr = Abs(pr)
    V(P+'L4-02', simplify(sp.re(pr)/rr), '実部/絶対値 = %s = cos(5π/12)=%.9f' % (simplify(sp.re(pr)/rr), math.cos(5*math.pi/12)))
    assert abs(float(N(sp.re(pr)/rr)) - math.cos(5*math.pi/12)) < 1e-12
    al = 1+sqrt(3)*I
    b = 3*conjugate(al)/Abs(al)
    assert abs(complex(N(al*b)).imag) < 1e-12 and complex(N(al*b)).real > 0 and abs(complex(N(Abs(b)))-3) < 1e-12
    V(P+'L4-03', simplify(b), 'β=%s, αβ=%s' % (simplify(b), simplify(expand(al*b))))
    sm = ang(2+1j) + ang(3+1j)
    V(P+'L4-04', sm, '偏角の和/π=%.9f' % (sm/math.pi))
    zq = (1+math.sqrt(3)*1j)/(1-math.sqrt(3)*1j)
    V(P+'L4-05', ang(zq), 'z/z̄=%s 偏角/π=%.6f' % (zq, ang(zq)/math.pi))

def VF(pid, f, show=''):
    """選択肢を θ の式として読み、いくつかの θ で f(θ) と一致するのが正解だけであることを確かめる"""
    it = ITEMS[pid]; ok = True; note = ''
    ths = [0.3, 0.7, 1.1, 2.0, 2.9]
    for c in it['c']:
        try:
            e_ = tex2expr(c['t'])
        except Exception as ex:
            ok = False; note += ' 読めない:%s(%s)' % (c['t'], ex); continue
        eq = all(abs(complex(N(e_.subs({th: v}), 30)) - f(v)) < 1e-9 for v in ths)
        if (c.get('k') == 1) != eq:
            ok = False; note += ' 不一致:%s' % c['t']
    rec(pid, show, ok, note)

def lesson03():
    P = 'mc2-03-'
    cs = lambda a: cos(a) + I*sin(a)
    V(P+'L1-01', simplify(cs(pi/6)**3))
    V(P+'L1-02', complex(N(cs(20*pi/180)**3)))
    V(P+'L1-03', expand((1+I)**4))
    V(P+'L1-04', complex(N(cs(pi/4)**6)))
    V(P+'L1-05', expand((sqrt(3)+I)**3))
    V(P+'L2-01', expand((1-I)**10))
    V(P+'L2-02', expand((-1+sqrt(3)*I)**6))
    z = (1+sqrt(3)*I)/2
    V(P+'L2-03', complex(N(z**100, 30)), str(simplify(expand(z**100))))
    V(P+'L2-04', expand((sqrt(3)-I)**5))
    n = 1
    while abs(complex(N(cs(n*pi/5))) - 1) > 1e-9:
        n += 1
    V(P+'L2-05', n, '最小の n=%d' % n)
    zz = symbols('zz')
    r3 = [s_ for s_ in solve(zz**3-8, zz) if sp.im(s_) > 0]
    V(P+'L3-01', r3[0], str(r3))
    r4 = [s_ for s_ in solve(zz**4+4, zz) if sp.re(s_) > 0 and sp.im(s_) > 0]
    assert len(r4) == 1
    V(P+'L3-02', r4[0], str(r4))
    n = 1
    while sp.im(expand((1+I)**n)) != 0:
        n += 1
    V(P+'L3-03', n, '最小の n=%d, (1+i)^n=%s' % (n, expand((1+I)**n)))
    cnt = 0
    for k in range(1, 101):
        w = expand((1+I)**k)
        if sp.re(w) == 0 and sp.im(w) != 0:
            cnt += 1
    V(P+'L3-04', cnt, '純虚数となる n の個数=%d' % cnt)
    n = 1
    while True:
        w = expand((sqrt(3)+I)**n)
        if sp.im(w) == 0 and sp.re(w) > 0:
            break
        n += 1
    V(P+'L3-05', n, '最小の n=%d, 値=%s' % (n, w))
    VF(P+'L4-01', lambda v: complex(math.sin(3*v)), 'sin3θ = 3sinθ-4sin^3θ（数値で確認）')
    ss = solve(zz+1/zz-1, zz)
    vals = [simplify(expand(s_**100 + 1/s_**100)) for s_ in ss]
    V(P+'L4-02', vals[0], 'z=%s → %s' % (ss, vals))
    pts = [cmath.exp(2j*math.pi*k/6) for k in range(6)]
    area = abs(sum((pts[i].real*pts[(i+1) % 6].imag - pts[(i+1) % 6].real*pts[i].imag) for i in range(6)))/2
    assert all(abs(p_**6 - 1) < 1e-12 for p_ in pts)
    V(P+'L4-03', area, '面積=%.9f (3√3/2=%.9f)' % (area, 3*math.sqrt(3)/2))
    w7 = cmath.exp(2j*math.pi/7)
    sm = sum(w7**k for k in range(1, 7))
    V(P+'L4-04', sm, '和=%s' % sm)
    w5 = cmath.exp(2j*math.pi/5)
    assert abs(sum(w5**k for k in range(5))) < 1e-12
    V(P+'L4-05', math.cos(2*math.pi/5), 'cos(2π/5)=%.9f, (√5-1)/4=%.9f' % (math.cos(2*math.pi/5), (math.sqrt(5)-1)/4))

def desc_points(text):
    """『中心 $c$、半径 $r$』『直線 $式$』の記述から、その図形上の点（複素数）を何点か作る"""
    m = re.search(r'中心 \$(.+?)\$、半径 \$(.+?)\$', text)
    if m:
        c = tex_num(m.group(1)); r = tex_num(m.group(2)).real
        return [c + r*cmath.exp(1j*(0.3 + k*2*math.pi/9)) for k in range(9)]
    m = re.search(r'直線 \$(.+?)\$', text)
    if m:
        ex = tex_eq(m.group(1)); pts = []
        if ex.has(y):
            for v in [-2, -1, 0.5, 1, 2.5]:
                for s_ in solve(ex.subs(x, v), y):
                    pts.append(complex(v, float(s_)))
        else:
            for v in [-2, -1, 0.5, 1, 2.5]:
                for s_ in solve(ex, x):
                    pts.append(complex(float(s_), v))
        return pts
    raise ValueError('図形の記述が読めない: ' + text)

def VG(pid, cond, show=''):
    """各選択肢の図形上の点が、すべて条件 cond(z)=0 を満たすのは、正解の選択肢だけ"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        try:
            pts = desc_points(c['t'])
        except Exception as ex:
            ok = False; note += ' 読めない:%s(%s)' % (c['t'], ex); continue
        holds = all(abs(cond(p_)) < 1e-9 for p_ in pts)
        if (c.get('k') == 1) != holds:
            ok = False; note += ' 不一致:%s' % c['t']
    rec(pid, show, ok, note)

def lesson04():
    P = 'mc2-04-'
    V(P+'L1-01', (1+2*I) + (Rational(1, 3))*((7+8*I)-(1+2*I)), 'A+(1/3)(B-A)')
    V(P+'L1-02', ((1+I)+(4+2*I)+(-2+6*I))/3)
    VG(P+'L1-03', lambda z: abs(z-1)-2, '|z-1|=2 → 中心1 半径2')
    VG(P+'L1-04', lambda z: abs(z-1)-abs(z-3), '|z-1|=|z-3| → 直線 x=2')
    al, be = 1+1j, 3+1j
    V(P+'L1-05', al + 1j*(be-al), 'α+i(β-α)')
    al, be = 2+1j, 5+4j
    V(P+'L2-01', 2*(5+4*I)-(2+I), '外分 2:1 = 2β-α')
    VG(P+'L2-02', lambda z: abs(z+1-2j)-3, '|z+1-2i|=3')
    pts = [(tt, -tt) for tt in [-2, -1, 0.5, 1, 3]]
    for px, py in pts:
        assert abs(abs(complex(px, py)-1) - abs(complex(px, py)+1j)) < 1e-12
    VE(P+'L2-03', pts, 'y=-x')
    k = symbols('k', real=True)
    # (γ-α)/(β-α) = (6+(k-1)i)/(2+i) が実数 ⇔ (6+(k-1)i)(2-i) の虚部が 0
    VT_k = solve(sp.im(sp.expand((6+(k-1)*I)*(2-I))), k)
    V(P+'L2-04', VT_k[0], 'k=%s' % VT_k)
    a = symbols('a', real=True)
    # ∠A=90° ⇔ (γ-α)/(β-α) が純虚数：分子 ((a-1)+6i)(3-i) の実部が 0（かつ虚部が 0 でない）
    rn = sp.expand(((a-1)+6*I)*(3-I))
    sol = solve(sp.re(rn), a)
    assert sp.im(rn).subs(a, sol[0]) != 0
    V(P+'L2-05', sol[0], 'a=%s' % sol)
    # L3-01 三角形の形
    A_, B_, C_ = 1+1j, 3+3j, 5+1j
    sides = (abs(A_-B_), abs(B_-C_), abs(A_-C_)); rr = (A_-B_)/(C_-B_)
    assert abs(rr - (-1j)) < 1e-12 and abs(sides[0]-sides[1]) < 1e-12
    ANS(P+'L3-01', '(α-β)/(γ-β)=%s, 辺 %s → ∠B=90° の直角二等辺三角形' % (rr, [round(s_, 4) for s_ in sides]), '$\\angle\\mathrm{B}=90^{\\circ}$ の直角二等辺三角形')
    al, be = 1+1j, 4+2j
    V(P+'L3-02', be + 1j*(be-al), 'C=B+i(B-A)')
    xs, ys = symbols('xs ys', real=True)
    sol = solve([(xs-2)**2+ys**2-(xs**2+(ys-2)**2), xs**2+ys**2-4], [xs, ys], dict=True)
    cand = [s_[xs]+s_[ys]*I for s_ in sol if s_[xs] > 0]
    V(P+'L3-03', cand[0], str(cand))
    ang_ = cmath.phase((-1-1)/((2+math.sqrt(3)*1j)-1))
    V(P+'L3-04', abs(ang_), '∠BAC=%.9f=2π/3' % abs(ang_))
    V(P+'L3-05', 3*(1+I)-(2+I)-(-3+2*I))
    VG(P+'L4-01', lambda z: abs(z)-2*abs(z-3), '|z|=2|z-3| → 中心4 半径2')
    VG(P+'L4-02', lambda w: abs(w/(1+1j)-2)-1, 'w=(1+i)z, |z-2|=1')
    ws = [(lambda zz_: zz_+1/zz_)(cmath.exp(1j*v)) for v in [0.1*q for q in range(63)]]
    assert all(abs(w_.imag) < 1e-12 for w_ in ws) and abs(max(w_.real for w_ in ws)-2) < 0.01 and abs(min(w_.real for w_ in ws)+2) < 0.01
    ANS(P+'L4-03', 'w=z+1/z は実数で -2≦w≦2', '実軸上の、$-2$ から $2$ までの線分')
    Aa = 4+2j
    r1 = Aa*cmath.exp(1j*math.pi/3); r2 = Aa*cmath.exp(-1j*math.pi/3)
    assert abs(abs(r1-Aa)-abs(Aa)) < 1e-12 and abs(abs(r2-Aa)-abs(Aa)) < 1e-12
    big = max([r1, r2], key=lambda q: q.real)
    V(P+'L4-04', big, 'B=%s' % big)
    VG(P+'L4-05', lambda w: (1/w).real-1, 'w=1/z, Re z=1 → |w-1/2|=1/2')

def VPF(pid, p, focus, show=''):
    """『p=…、焦点 (…)』の形の選択肢"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        m = re.match(r'\$p=(.+?)\$、焦点 \$(.+)\$$', c['t'])
        if not m:
            ok = False; note += ' 形がちがう:' + c['t']; continue
        pv = tex_num(m.group(1)); fv = tex_tuple('$' + m.group(2) + '$')
        eq = same(pv, p) and all(same(a, b) for a, b in zip(fv, focus))
        if (c.get('k') == 1) != eq:
            ok = False; note += ' 不一致:' + c['t']
    rec(pid, show, ok, note)

def para_pts(p, n=6):
    """y^2=4px 上の点（x を決めて y を出す）"""
    pts = []
    for xv in [0, 0.5, 1, 2, 3, 5]:
        xv = xv if p > 0 else -xv
        yv = math.sqrt(4*p*xv)
        pts += [(xv, yv), (xv, -yv)]
    return pts

def lesson05():
    P = 'mc2-05-'
    # L1-01  y^2=8x
    pp = Rational(8, 4)
    VT(P+'L1-01', (pp, 0), '焦点 (%s,0)' % pp)
    # L1-02  y^2=-12x → p=-3, 準線 x=-p=3
    pp = Rational(-12, 4)
    VE(P+'L1-02', [(-pp, yy) for yy in [0, 1, -2, 5]], '準線 x=%s' % (-pp))
    # L1-03  焦点(3,0)、準線 x=-3 → y^2=12x（点が「焦点までの距離＝準線までの距離」を満たすことも確認）
    pts = para_pts(3)
    for (px, py) in pts:
        assert abs(math.hypot(px-3, py) - abs(px+3)) < 1e-9
    VE(P+'L1-03', pts, 'y^2=12x')
    # L1-04  x^2=4y → p=1
    VT(P+'L1-04', (0, Rational(4, 4)), '焦点 (0,1)')
    # L1-05  y^2=8x, x=4
    xv = 4; yv = math.sqrt(8*xv); d = math.hypot(xv-2, yv)
    V(P+'L1-05', d, 'PF=%.9f' % d)
    # L2-01  焦点 (0,-2), 頂点 原点
    pts = []
    for xv in [0, 2, 4, -4, 6]:
        yv = -xv**2/8
        assert abs(math.hypot(xv-0, yv+2) - abs(yv-2)) < 1e-9
        pts.append((xv, yv))
    VE(P+'L2-01', pts, 'x^2=-8y')
    pp = Rational(-6, 4)
    VT(P+'L2-02', (pp, 0), '焦点 (%s,0)' % pp)
    xs, ys = symbols('xs ys', real=True)
    sol = solve([ys**2-12*xs, (xs-3)**2+ys**2-64], [xs, ys], dict=True)
    cand = [(s_[xs], s_[ys]) for s_ in sol if s_[ys] > 0]
    VT(P+'L2-03', cand[0], 'P=%s' % (cand,))
    pts = []
    for xv in [0, 1, 2, 5, 7]:
        yv = math.sqrt(8*xv)
        for sg in (1, -1):
            assert abs(math.hypot(xv-2, sg*yv) - abs(xv+2)) < 1e-9
            pts.append((xv, sg*yv))
    VE(P+'L2-04', pts, 'y^2=8x')
    pp = symbols('pp')
    psol = solve(Eq(16, 4*pp*4), pp)[0]
    VPF(P+'L2-05', psol, (psol, 0), 'p=%s' % psol)
    # L3-01
    sol = solve([ys**2-4*xs, (xs-1)**2+ys**2-25], [xs, ys], dict=True)
    cand = [(s_[xs], s_[ys]) for s_ in sol if s_[xs] > 0 and s_[ys] > 0]
    VT(P+'L3-01', cand[0], 'P=%s' % (cand,))
    # L3-02  x^2=-12y → p=-3 : 焦点 (0,p)、準線 y=-p
    pp = Rational(-12, 4)
    exp_txt = '焦点は $(0,\\ %s)$、準線は $y=%s$ である。' % (pp, -pp)
    ANS(P+'L3-02', '焦点(0,%s) 準線 y=%s' % (pp, -pp), exp_txt)
    # L3-03  (-3,6) を通る
    pp = solve(Eq(36, 4*symbols('qq')*(-3)), symbols('qq'))[0]
    VE(P+'L3-03', [(-pp, yy) for yy in [0, 1, -3, 4]], '準線 x=%s (p=%s)' % (-pp, pp))
    ya, yb = 2, -4
    xa, xb = Rational(ya**2, 4), Rational(yb**2, 4)
    V(P+'L3-04', (xa+xb)/2, '(%s+%s)/2' % (xa, xb))
    sol = solve([ys**2-8*xs, (xs-2)**2+ys**2-36], [xs, ys], dict=True)
    cand = [(s_[xs], s_[ys]) for s_ in sol if s_[ys] > 0]
    area = Rational(1, 2)*2*cand[0][1]
    V(P+'L3-05', area, 'P=%s 面積=%s' % (cand, area))
    # L4-01 PA+PF 最小（y を動かして数値で最小化）
    import numpy as np
    yy_ = np.linspace(-30, 30, 2000001)
    xx_ = yy_**2/8
    val = np.hypot(xx_-4, yy_-3) + np.hypot(xx_-2, yy_)
    mn = float(val.min())
    assert abs(mn-6) < 1e-6, mn
    V(P+'L4-01', 6, 'min(PA+PF)=%.7f' % mn)
    # L4-02 PB 最小
    yy_ = np.linspace(-20, 20, 2000001); xx_ = yy_**2/4
    mn = float(np.hypot(xx_-3, yy_).min())
    assert abs(mn-2*math.sqrt(2)) < 1e-6, mn
    V(P+'L4-02', 2*sqrt(2), 'min PB=%.7f' % mn)
    # L4-03 PF=x+1: A,B,C の x 座標
    xa, xc = 2-1, 6-1
    xb = ((xa+1)+(xc+1))/2 - 1
    V(P+'L4-03', xb, 'x_B=%s' % xb)
    # L4-04 PA/PF の最大
    yy_ = np.linspace(-50, 50, 4000001); xx_ = yy_**2/4
    ratio = np.hypot(xx_+1, yy_)/(xx_+1)
    mx = float(ratio.max())
    assert abs(mx-math.sqrt(2)) < 1e-6, mx
    V(P+'L4-04', sqrt(2), 'max PA/PF=%.7f' % mx)
    # L4-05 中点の軌跡
    pts = [((s_**2+1)/2, s_) for s_ in [0, 0.5, 1, 2, -1.5, 3]]
    VE(P+'L4-05', pts, 'y^2=2x-1')

def expand_pm(tex):
    t_ = tex.replace('$', '')
    n = t_.count('\\pm')
    out = []
    for signs in itertools.product('+-', repeat=n):
        s2 = t_
        for sg in signs:
            s2 = s2.replace('\\pm', sg, 1)
        out.append(s2)
    return out

def VTP(pid, tuples, show=''):
    """座標（\\pm つき可）を点の集合として読み、正解だけが tuples と一致する"""
    it = ITEMS[pid]; ok = True; note = ''
    exp = [tuple(complex(N(v, 30)) for v in tp) for tp in tuples]
    for c in it['c']:
        try:
            got = [tuple(complex(N(v, 30)) for v in tex_tuple(s_)) for s_ in expand_pm(c['t'])]
        except Exception as ex:
            ok = False; note += ' 読めない:%s(%s)' % (c['t'], ex); continue
        m1 = all(any(all(abs(a-b) < 1e-9 for a, b in zip(g, e)) for e in exp) for g in got)
        m2 = all(any(all(abs(a-b) < 1e-9 for a, b in zip(g, e)) for g in got) for e in exp)
        if (c.get('k') == 1) != (m1 and m2):
            ok = False; note += ' 不一致:%s' % c['t']
    rec(pid, show, ok, note)

def ell_pts(a, b, ts=(0.3, 0.9, 1.7, 2.5, 3.6, 5.0)):
    return [(a*math.cos(t_), b*math.sin(t_)) for t_ in ts]

def lesson06():
    P = 'mc2-06-'
    c_ = sqrt(25-9)
    VTP(P+'L1-01', [(c_, 0), (-c_, 0)], '焦点 (±%s,0)' % c_)
    V(P+'L1-02', 2*sqrt(16), '2a=%s' % (2*sqrt(16)))
    # 距離の和は 2a
    pts = ell_pts(5, 4); fs = [(3, 0), (-3, 0)]
    for (px, py) in pts:
        assert abs(sum(math.hypot(px-f[0], py-f[1]) for f in fs) - 10) < 1e-9
    V(P+'L1-03', 10)
    VTP(P+'L1-04', [(0, 2), (0, -2)], 'x=0 → y=±2')
    pts = ell_pts(3, 2)
    for (px, py) in pts:
        assert abs(math.hypot(px-math.sqrt(5), py) + math.hypot(px+math.sqrt(5), py) - 6) < 1e-9
    VE(P+'L1-05', pts, 'x²/9+y²/4=1')
    VTP(P+'L2-01', [(sqrt(5), 0), (-sqrt(5), 0)], '4x²+9y²=36 → 焦点 (±√5,0)')
    VTP(P+'L2-02', [(0, sqrt(5)), (0, -sqrt(5))], 'x²/4+y²/9=1 → 焦点 (0,±√5)')
    pts = ell_pts(2, 1)
    for (px, py) in pts:
        assert abs(math.hypot(px-math.sqrt(3), py) + math.hypot(px+math.sqrt(3), py) - 4) < 1e-9
    VE(P+'L2-03', pts, 'x²/4+y²=1')
    pts = ell_pts(5, 4)
    VE(P+'L2-04', pts, 'x²/25+y²/16=1')
    pts = [(3*math.cos(t_), 2*math.sin(t_)) for t_ in (0.3, 0.9, 1.7, 2.5, 3.6, 5.0)]   # 円上の (3cos t, 3 sin t) → (x, 2y/3)
    VE(P+'L2-05', pts, 'x²/9+y²/4=1')
    # L3-01 周の長さ
    pts = ell_pts(4, math.sqrt(7)); F1, F2 = (3, 0), (-3, 0)
    for (px, py) in pts:
        per = math.hypot(px-3, py) + math.hypot(px+3, py) + 6
        assert abs(per - 14) < 1e-9
    V(P+'L3-01', 14)
    # L3-02 焦点 (±4,0)、(0,3) を通る
    pts = ell_pts(5, 3)
    for (px, py) in pts:
        assert abs(math.hypot(px-4, py) + math.hypot(px+4, py) - 10) < 1e-9
    VE(P+'L3-02', pts, 'x²/25+y²/9=1')
    # L3-03 x²/9+y²/16=1
    cc = sqrt(16-9)
    ANS(P+'L3-03', '焦点(0,±%s)、長軸 %s' % (cc, 2*sqrt(16)), '焦点は $(0,\\ \\pm\\sqrt{7})$ で、長軸の長さは $8$ である。')
    # L3-04
    pts = [(2*math.cos(t_), math.sin(t_)) for t_ in (0.3, 0.9, 1.7, 2.5, 3.6, 5.0)]   # P=(2cos t, 2 sin t) の PH の中点
    VE(P+'L3-04', pts, 'x²/4+y²=1')
    # L3-05
    A2, B2 = symbols('A2 B2', positive=True)
    sol = solve([A2-B2-9, Rational(9)/A2 + Rational(256, 25)/B2 - 1], [A2, B2], dict=True)
    assert sol and sol[0][A2] == 25 and sol[0][B2] == 16, sol
    pts = ell_pts(5, 4)
    assert abs((3/5)**2 + (16/5/4)**2 - 1) < 1e-12
    VE(P+'L3-05', pts, 'a²=%s b²=%s' % (sol[0][A2], sol[0][B2]))
    # L4-01 ∠FPF'=90° の三角形の面積
    xs, ys = symbols('xs ys', real=True)
    sol = solve([xs**2+ys**2-16, xs**2/25+ys**2/9-1], [xs, ys], dict=True)
    pt = [(s_[xs], s_[ys]) for s_ in sol if s_[ys] > 0][0]
    area = Rational(1, 2)*8*pt[1]
    V(P+'L4-01', area, 'P=%s 面積=%s' % (pt, area))
    # L4-02
    import numpy as np
    tt = np.linspace(0, 2*math.pi, 2000001)
    px_, py_ = 5*np.cos(tt), 3*np.sin(tt)
    val = np.hypot(px_-2, py_-2) + np.hypot(px_-4, py_)
    mn = float(val.min()); assert abs(mn - (10-2*math.sqrt(10))) < 1e-6, mn
    V(P+'L4-02', 10-2*sqrt(10), 'min(PA+PF)=%.7f' % mn)
    # L4-03 円 C の内側で内接する円の中心 P の軌跡
    pts = ell_pts(4, math.sqrt(7))
    for (px, py) in pts:
        r = math.hypot(px-3, py)            # 点 B を通る → 半径 = PB
        assert abs(math.hypot(px+3, py) - (8 - r)) < 1e-9     # 内接：PA = 8 - r
    VE(P+'L4-03', pts, 'x²/16+y²/7=1')
    # L4-04
    tt = np.linspace(0, 2*math.pi, 2000001)
    d = np.hypot(2*np.cos(tt)-1, np.sin(tt))
    mn = float(d.min()); assert abs(mn - math.sqrt(6)/3) < 1e-6, mn
    V(P+'L4-04', sqrt(6)/3, 'min AP=%.7f' % mn)
    # L4-05
    tt = np.linspace(0, math.pi/2, 2000001)
    ar = 4*(3*np.cos(tt))*(2*np.sin(tt))
    mx = float(ar.max()); assert abs(mx-12) < 1e-6
    V(P+'L4-05', 12, 'max 4xy=%.7f' % mx)

def VAS(pid, slope, show=''):
    """『y=\\pm(傾き)x』の形の選択肢（漸近線）。傾きの絶対値が一致するのは正解だけ"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        m = re.match(r'\$y=\\pm(.+)\$$', c['t'])
        if not m:
            ok = False; note += ' 形がちがう:' + c['t']; continue
        sl = sp.simplify(tex2expr(m.group(1))/x)
        eq = same(sl, slope)
        if (c.get('k') == 1) != eq:
            ok = False; note += ' 不一致:' + c['t']
    rec(pid, show, ok, note)

def hyp_pts(a, b, ts=(-2.0, -1.1, -0.4, 0.3, 0.9, 1.7)):
    return [(a*math.cosh(t_), b*math.sinh(t_)) for t_ in ts]

def VBR(pid, pts, show=''):
    """『式（x>0 の部分）』の形：式が pts で成り立ち、かつ枝の向き（x>0 / x<0）が pts と合うのは正解だけ"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        m = re.match(r'\$(.+?)\$（\$x([<>])0\$ の部分）$', c['t'])
        if not m:
            ok = False; note += ' 形がちがう:' + c['t']; continue
        ex = tex_eq(m.group(1)); sg = m.group(2)
        holds = all(abs(complex(N(ex.subs({x: px, y: py}), 30))) < 1e-9 for px, py in pts)
        br = all((px > 0) if sg == '>' else (px < 0) for px, py in pts)
        if (c.get('k') == 1) != (holds and br):
            ok = False; note += ' 不一致:' + c['t']
    rec(pid, show, ok, note)

def lesson07():
    P = 'mc2-07-'
    import numpy as np
    VTP(P+'L1-01', [(5, 0), (-5, 0)], '焦点 (±5,0)')
    VAS(P+'L1-02', Rational(3, 2), '漸近線 y=±(3/2)x')
    VTP(P+'L1-03', [(4, 0), (-4, 0)], 'y=0 → x=±4')
    pts = hyp_pts(4, 3)
    for (px, py) in pts:
        assert abs(abs(math.hypot(px-5, py) - math.hypot(px+5, py)) - 8) < 1e-9
    V(P+'L1-04', 8)
    pts = hyp_pts(3, 4)
    for (px, py) in pts:
        assert abs(abs(math.hypot(px-5, py) - math.hypot(px+5, py)) - 6) < 1e-9
    VE(P+'L1-05', pts, 'x²/9-y²/16=1')
    VTP(P+'L2-01', [(sqrt(13), 0), (-sqrt(13), 0)], '4x²-9y²=36 → x²/9-y²/4=1 → 焦点 (±√13,0)')
    VAS(P+'L2-02', Rational(1, 2), 'x²/4-y²=1 → y=±x/2')
    VTP(P+'L2-03', [(0, 5), (0, -5)], 'y²/9-x²/16=1 → 焦点 (0,±5)')
    pts = hyp_pts(4, 3)
    for (px, py) in pts:
        assert abs(abs(math.hypot(px-5, py) - math.hypot(px+5, py)) - 8) < 1e-9
    VE(P+'L2-04', pts, 'x²/16-y²/9=1')
    pts = hyp_pts(3, 2)
    VE(P+'L2-05', pts, 'x²/9-y²/4=1')
    # L3-01
    a2, b2 = 16, 9
    ANS(P+'L3-01', '焦点(0,±%s)、漸近線 y=±(%s/%s)x' % (int(math.sqrt(a2+b2)), 4, 3), '焦点は $(0,\\ \\pm5)$、漸近線は $y=\\pm\\frac{4}{3}x$ である。')
    # L3-02: PF=10 の点を実際に求める
    xs, ys = symbols('xs ys', real=True)
    res = set()
    for sg in (1, -1):
        pass
    sol = solve([xs**2/9-ys**2/16-1, (xs-5)**2+ys**2-100], [xs, ys], dict=True)
    for s_ in sol:
        px, py = float(s_[xs]), float(s_[ys])
        res.add(round(math.hypot(px+5, py), 9))
    assert res == {4.0, 16.0}, res
    ANS(P+'L3-02', 'PF\'∈%s' % sorted(res), '$4$ または $16$')
    VTP(P+'L3-03', [(4, 0), (-4, 0)], 'x²/8-y²/8=1 → c²=16')
    # L3-04: k の範囲（双曲線になる k）
    def kind(k):
        d1, d2 = k-1, k-5
        if d1 > 0 and d2 > 0: return 'ellipse'
        if d1 < 0 and d2 < 0: return 'empty'
        return 'hyperbola'
    grid = [-3, 0, 0.5, 1.5, 2, 3, 4.5, 5.5, 6, 10]
    regions = {'$k>5$': lambda k: k > 5, '$1<k<5$': lambda k: 1 < k < 5,
               '$k<1$ または $k>5$': lambda k: k < 1 or k > 5, '$k<1$': lambda k: k < 1}
    it = ITEMS[P+'L3-04']; ok = True; note = ''
    for c in it['c']:
        pr = regions[c['t']]
        eq = all((kind(k) == 'hyperbola') == pr(k) for k in grid)
        if (c.get('k') == 1) != eq:
            ok = False; note += ' 不一致:' + c['t']
    rec(P+'L3-04', '双曲線になる k は 1<k<5', ok, note)
    pts = hyp_pts(3, 2)
    assert abs(36/9 - 12/4 - 1) < 1e-12
    VE(P+'L3-05', pts, 'x²/9-y²/4=1 (a²+b²=13)')
    # L4-01
    sol = solve([xs**2+ys**2-25, xs**2/9-ys**2/16-1], [xs, ys], dict=True)
    py_ = [float(s_[ys]) for s_ in sol if float(s_[ys]) > 0][0]
    V(P+'L4-01', 0.5*10*py_, '面積=%.9f' % (0.5*10*py_))
    # L4-02: 右の枝上の PA+PF の最小
    tt = np.linspace(-6, 6, 2400001)
    px_, py_ = 3*np.cosh(tt), 4*np.sinh(tt)
    mn = float((np.hypot(px_-5, py_-4) + np.hypot(px_-5, py_)).min())
    assert abs(mn - (2*math.sqrt(29)-6)) < 1e-6, mn
    V(P+'L4-02', 2*sqrt(29)-6, 'min(PA+PF)=%.7f' % mn)
    # L4-03
    px, py = 5.0, 16/3
    assert abs(px**2/9 - py**2/16 - 1) < 1e-12
    d1 = abs(4*px-3*py)/5; d2 = abs(4*px+3*py)/5
    V(P+'L4-03', Rational(144, 25), 'd1=%.4f d2=%.4f 積=%.9f' % (d1, d2, d1*d2))
    assert abs(d1*d2 - 144/25) < 1e-12
    # L4-04: 外接円の中心の軌跡
    pts = hyp_pts(1, math.sqrt(24), ts=(0.0, 0.4, 0.9, 1.3, -0.7, -1.2))
    for (px, py) in pts:
        r = math.hypot(px-5, py)                        # B を通る → 半径 = PB
        assert abs(math.hypot(px+5, py) - (r+2)) < 1e-9   # 外接：PA = r + 2
        assert px > 0
    VBR(P+'L4-04', pts, 'x²-y²/24=1 (x>0)')
    # L4-05: 共有点
    sol = solve([xs**2/9+ys**2/4-1, xs**2/4-ys**2-1], [xs, ys], dict=True)
    s0 = sol[0]
    pxx, pyy = float(s0[xs]), float(s0[ys])
    prod = math.hypot(pxx-math.sqrt(5), pyy)*math.hypot(pxx+math.sqrt(5), pyy)
    V(P+'L4-05', 5, 'P=(%.4f,%.4f) PF·PF\'=%.9f' % (pxx, pyy, prod))
    assert abs(prod-5) < 1e-9

def VTS(pid, tuples, show=''):
    """『(a, b), (c, d)』のように並べた座標の組を点の集合として読み、正解だけが一致する"""
    it = ITEMS[pid]; ok = True; note = ''
    exp = [tuple(complex(N(v, 30)) for v in tp) for tp in tuples]
    for c in it['c']:
        try:
            parts = re.findall(r'\([^()]*\)', c['t'].replace('$', '').replace('\\ ', ' '))
            got = [tuple(complex(N(v, 30)) for v in tex_tuple(p_)) for p_ in parts]
        except Exception as ex:
            ok = False; note += ' 読めない:%s(%s)' % (c['t'], ex); continue
        m1 = all(any(all(abs(a-b) < 1e-9 for a, b in zip(g, e)) for e in exp) for g in got)
        m2 = all(any(all(abs(a-b) < 1e-9 for a, b in zip(g, e)) for g in got) for e in exp)
        if (c.get('k') == 1) != (m1 and m2):
            ok = False; note += ' 不一致:%s' % c['t']
    rec(pid, show, ok, note)

def line_of(tex):
    """'y=x+2' → (傾き, 切片)"""
    ex = tex_eq(tex.replace('$', ''))
    yy = solve(ex, y)[0]
    return sp.Poly(yy, x).all_coeffs()

def lesson08():
    P = 'mc2-08-'
    import numpy as np
    # L1-01  y^2=4x を (2,3) だけ平行移動：(s^2,2s) → (s^2+2, 2s+3)
    pts = [(s_**2+2, 2*s_+3) for s_ in (0, 0.5, 1, -1, 2, -1.7)]
    VE(P+'L1-01', pts, '(y-3)^2=4(x-2)')
    VT(P+'L1-02', (1, -2), '中心 (1,-2)')
    VT(P+'L1-03', (-2, 1), '頂点 (-2,1)')
    xs, ys = symbols('xs ys', real=True)
    sol = solve([ys**2-4*xs, ys-xs], [xs, ys], dict=True)
    pr = sorted([(s_[xs], s_[ys]) for s_ in sol])
    assert pr == [(0, 0), (4, 4)], pr
    ANS(P+'L1-04', '共有点 %s' % pr, '$(0,\\ 0)$ と $(4,\\ 4)$')
    # L1-05 接線 x=3（楕円との共有点が (3,0) だけ）
    sol = solve([xs**2/9+ys**2/4-1, xs-3], [xs, ys], dict=True)
    assert len(sol) == 1, sol
    VE(P+'L1-05', [(3, 0), (3, 1), (3, -2), (3, 5)], 'x=3 は (3,0) で接する')
    # L2-01
    cx = solve(sp.diff(xs**2+4*ys**2-2*xs+8*ys+1, xs), xs)[0]; cy = solve(sp.diff(xs**2+4*ys**2-2*xs+8*ys+1, ys), ys)[0]
    VT(P+'L2-01', (cx, cy), '中心 (%s,%s)' % (cx, cy))
    # L2-02 焦点 (4,2)：曲線上の点で 焦点までの距離 = 準線 x=0 までの距離
    for yy in (-3, 0, 2, 3.5, 7):
        xx = (yy**2-4*yy+20)/8
        assert abs(math.hypot(xx-4, yy-2) - abs(xx-0)) < 1e-9
    VT(P+'L2-02', (4, 2), '焦点 (4,2)')
    # L2-03
    for (px, py) in [(1+2*math.cosh(t_), -2+math.sqrt(5)*math.sinh(t_)) for t_ in (0.3, 1.1, -0.8)]:
        assert abs(abs(math.hypot(px-4, py+2) - math.hypot(px+2, py+2)) - 4) < 1e-9
    VTS(P+'L2-03', [(4, -2), (-2, -2)], '焦点 (4,-2),(-2,-2)')
    # L2-04  y^2=4x と y=x+k が異なる2点で交わる k
    def n_inter(k):
        D = (2*k-4)**2 - 4*k**2
        return 2 if D > 1e-12 else (1 if abs(D) <= 1e-12 else 0)
    grid = [-5, -1.5, -1, 0, 0.5, 1, 1.5, 3]
    preds = {'$k<1$': lambda k: k < 1, '$k>1$': lambda k: k > 1, '$k\\leqq1$': lambda k: k <= 1, '$k<-1$': lambda k: k < -1}
    it = ITEMS[P+'L2-04']; ok = True; note = ''
    for c in it['c']:
        eq = all((n_inter(k) == 2) == preds[c['t']](k) for k in grid)
        if (c.get('k') == 1) != eq:
            ok = False; note += ' 不一致:' + c['t']
    rec(P+'L2-04', 'D=16-16k>0 → k<1', ok, note)
    # L2-05 接線 (2,4)
    it = ITEMS[P+'L2-05']; ok = True; note = ''
    for c in it['c']:
        m_, c0 = [sp.nsimplify(v) for v in line_of(c['t'])]
        passes = (m_*2 + c0 == 4)
        D = (2*m_*c0 - 8)**2 - 4*m_**2*c0**2          # (mx+c)^2 = 8x → m²x²+(2mc-8)x+c²=0
        tang = passes and D == 0
        if (c.get('k') == 1) != tang:
            ok = False; note += ' 不一致:' + c['t']
    rec(P+'L2-05', '接線 y=x+2（重解）', ok, note)
    # L3-01
    sol = solve([ys**2-4*xs, ys-(xs-1)], [xs, ys], dict=True)
    A_, B_ = [(s_[xs], s_[ys]) for s_ in sol]
    ab = sp.sqrt((A_[0]-B_[0])**2 + (A_[1]-B_[1])**2)
    V(P+'L3-01', simplify(ab), 'AB=%s' % simplify(ab))
    sol = solve([xs**2/4+ys**2-1, ys-(xs+1)], [xs, ys], dict=True)
    pts_ = [(s_[xs], s_[ys]) for s_ in sol]
    mid = (sum(p_[0] for p_ in pts_)/2, sum(p_[1] for p_ in pts_)/2)
    VT(P+'L3-02', mid, '共有点 %s 中点 %s' % (pts_, mid))
    kk = symbols('kk', real=True)
    Dk = sp.expand(sp.discriminant(sp.expand((xs**2/4+(xs+kk)**2-1)*4), xs))
    VS(P+'L3-03', solve(Dk, kk), 'D=%s → k=%s' % (Dk, solve(Dk, kk)))
    mm = symbols('mm', real=True)
    Dm = sp.discriminant(sp.expand((mm*(xs+1))**2-4*xs), xs)
    VS(P+'L3-04', solve(Dm, mm), '接線の傾き %s' % solve(Dm, mm))
    def has_sol(m_):
        return (1/4 - m_**2/9) > 1e-12
    grid = [-3, -1.6, -1.5, -1.2, 0, 1.2, 1.5, 1.6, 3, 0.5, -0.6, 0.7]
    preds = {'$m<-\\frac{3}{2},\\ \\frac{3}{2}<m$': lambda m_: m_ < -1.5 or m_ > 1.5,
             '$-\\frac{2}{3}<m<\\frac{2}{3}$': lambda m_: -2/3 < m_ < 2/3,
             '$-\\frac{3}{2}<m<\\frac{3}{2}$': lambda m_: -1.5 < m_ < 1.5,
             '$-\\frac{3}{2}\\leqq m\\leqq\\frac{3}{2}$': lambda m_: -1.5 <= m_ <= 1.5}
    it = ITEMS[P+'L3-05']; ok = True; note = ''
    for c in it['c']:
        eq = all(has_sol(m_) == preds[c['t']](m_) for m_ in grid)
        if (c.get('k') == 1) != eq:
            ok = False; note += ' 不一致:' + c['t']
    rec(P+'L3-05', '共有点をもつ m: |m|<3/2', ok, note)
    # L4-01 平行弦の中点
    pts = []
    for k_ in (-3, -1.5, 0.5, 2, 3):
        a_, b_, c_ = 13, 18*k_, 9*k_**2-36
        xm = -b_/(2*a_); ym = xm + k_
        assert b_**2 - 4*a_*c_ > 0
        pts.append((xm, ym))
    VE(P+'L4-01', pts, 'y=-(4/9)x')
    Dm = sp.discriminant(sp.expand(((mm*xs+3)**2 + xs**2/4 - 1)*4), xs)
    VS(P+'L4-02', solve(Dm, mm), '接線の傾き %s' % solve(Dm, mm))
    tt = np.linspace(-30, 30, 4000001)
    dist = np.abs(tt**2/4 - tt + 3)/math.sqrt(2)
    mn = float(dist.min()); assert abs(mn - math.sqrt(2)) < 1e-6
    V(P+'L4-03', sqrt(2), '最小距離=%.7f' % mn)
    # L4-04 AB 最小
    th_ = np.linspace(0.001, math.pi/2-0.001, 4000001)
    x0, y0 = 3*np.cos(th_), 2*np.sin(th_)
    AB = np.hypot(9/x0, 4/y0)
    mn = float(AB.min()); assert abs(mn-5) < 1e-6, mn
    V(P+'L4-04', 5, '最小 AB=%.7f' % mn)
    # L4-05 焦点を通る弦の最小
    best = 1e9
    for t_ in np.linspace(-3, 3, 60001):
        # x = t y + 1 を y^2 = 4x に代入 → y^2 - 4 t y - 4 = 0
        d_ = math.sqrt(16*t_**2 + 16)
        y1, y2 = (4*t_ + d_)/2, (4*t_ - d_)/2
        x1, x2 = t_*y1+1, t_*y2+1
        best = min(best, math.hypot(x1-x2, y1-y2))
    assert abs(best-4) < 1e-6
    V(P+'L4-05', 4, '最小弦長=%.7f' % best)

def eval_cond(cond, xv, yv):
    c_ = cond.replace('$', '').replace(' の部分', '').strip()
    if c_ == '全体' or '全ての実数' in c_:
        return True
    c_ = c_.replace('\\leqq', '<=').replace('\\geqq', '>=')
    s_ = _conv(c_)
    return bool(eval(s_, {'sqrt': math.sqrt, 'x': xv, 'y': yv}))

def VREG(pid, img, out, show=''):
    """『$式$（範囲）』の形。式が img（パラメータで描いた点）で成り立ち、範囲が img をすべてふくみ、
       曲線上の点 out（描かれない点）をすべて除くのは、正解だけ"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        m = re.match(r'^\$(.+?)\$（(.*)）$', c['t'])
        if not m:
            ok = False; note += ' 形がちがう:' + c['t']; continue
        ex = tex_eq(m.group(1)); cond = m.group(2)
        holds = all(abs(complex(N(ex.subs({x: px, y: py}), 30))) < 1e-9 for px, py in img)
        inside = all(eval_cond(cond, px, py) for px, py in img)
        excl = all(not eval_cond(cond, px, py) for px, py in out)
        if (c.get('k') == 1) != (holds and inside and excl):
            ok = False; note += ' 不一致:' + c['t']
    rec(pid, show, ok, note)

def VCIR(pid, img, show=''):
    """『中心 $(a,b)$、半径 $r$』の形。img の点が、その円周上にあるのは正解だけ"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        m = re.match(r'中心 \$(\(.+?\))\$、半径 \$(.+?)\$$', c['t'])
        if not m:
            ok = False; note += ' 形がちがう:' + c['t']; continue
        cx_, cy_ = [complex(N(v, 30)).real for v in tex_tuple('$' + m.group(1) + '$')]
        r_ = tex_num(m.group(2)).real
        holds = all(abs(math.hypot(px-cx_, py-cy_) - r_) < 1e-9 for px, py in img)
        if (c.get('k') == 1) != holds:
            ok = False; note += ' 不一致:' + c['t']
    rec(pid, show, ok, note)

def lesson09():
    P = 'mc2-09-'
    import numpy as np
    ts = (-2, -0.5, 0, 1, 2.5)
    VE(P+'L1-01', [(2*t_+1, t_-3) for t_ in ts], 'x-2y=7')
    ths = (0.3, 1.2, 2.0, 3.5, 5.1)
    VE(P+'L1-02', [(3*math.cos(a), 3*math.sin(a)) for a in ths], 'x²+y²=9')
    VE(P+'L1-03', [(2*math.cos(a), 3*math.sin(a)) for a in ths], 'x²/4+y²/9=1')
    VT(P+'L1-04', (2**2-1, 2*2), 't=2 → (3,4)')
    VE(P+'L1-05', [(2*t_, t_**2) for t_ in ts], 'y=x²/4')
    VE(P+'L2-01', [(t_+1, t_**2-2*t_) for t_ in ts], 'y=x²-4x+3')
    VCIR(P+'L2-02', [(2+3*math.cos(a), -1+3*math.sin(a)) for a in ths], '中心(2,-1) 半径3')
    img = [(math.sin(a), math.cos(2*a)) for a in ths + (0.0, math.pi/2, -math.pi/2)]
    out = [(1.5, 1-2*1.5**2), (-2.0, 1-2*4.0), (1.2, 1-2*1.44)]
    VREG(P+'L2-03', img, out, 'y=1-2x² (-1≦x≦1)')
    VT(P+'L2-04', (math.pi - math.sin(math.pi), 1-math.cos(math.pi)), 'θ=π → (π,2)')
    VE(P+'L2-05', [(1+3*t_, 2-t_) for t_ in ts], 'x+3y=7')
    # L3-01
    img = [(t_+1/t_, t_-1/t_) for t_ in (0.2, 0.5, 1, 1.7, 3, 8)]
    out = [(-2.0, 0.0), (-2.5, 1.5), (-3.0, math.sqrt(5)), (-4.0, math.sqrt(12))]
    for px, py in out:
        assert abs(px**2-py**2-4) < 1e-9
    VREG(P+'L3-01', img, out, 'x²-y²=4 (x≧2)')
    # L3-02
    img = [(2*math.cos(a), math.sin(a)) for a in (0, 0.5, 1.2, math.pi/2, 2.0, 2.8, math.pi)]
    out = [(1.0, -math.sqrt(3)/2), (-1.5, -math.sqrt(1-0.5625)), (0.0, -1.0)]
    for px, py in out:
        assert abs(px**2/4+py**2-1) < 1e-9
    VREG(P+'L3-02', img, out, 'x²/4+y²=1 (y≧0)')
    tt = np.linspace(0, 2*math.pi, 2000001)
    mx = float((2*np.cos(tt)+np.sin(tt)).max()); assert abs(mx-math.sqrt(5)) < 1e-6
    V(P+'L3-03', sqrt(5), '最大 x+y=%.7f' % mx)
    VE(P+'L3-04', [(3+math.cos(a), math.sin(a)) for a in ths], '(x-3)²+y²=1')
    # L3-05: x=t²-2t, y=t+1 の頂点（x の最小点）
    tt = np.linspace(-5, 7, 1200001)
    xx_ = tt**2-2*tt; i_ = int(xx_.argmin())
    vx, vy = float(xx_[i_]), float(tt[i_]+1)
    VT(P+'L3-05', (round(vx, 6), round(vy, 6)), '頂点 (%.4f,%.4f)' % (vx, vy))
    # L4-01
    img = [(math.cos(a)+math.sin(a), math.sin(a)*math.cos(a)) for a in np.linspace(0, 2*math.pi, 25)]
    out = [(1.5, (1.5**2-1)/2), (-1.6, (1.6**2-1)/2), (2.0, 1.5)]
    VREG(P+'L4-01', img, out, 'y=(x²-1)/2 (|x|≦√2)')
    # L4-02 x=-1 になる t が無く、他の点はすべて表される
    tt = np.linspace(-1000, 1000, 2000001)
    X = (1-tt**2)/(1+tt**2)
    assert float(X.min()) > -1
    for phi in (0.5, 1.5, 2.5, -1.0, -2.8, math.pi/2, 0.0):
        x0, y0 = math.cos(phi), math.sin(phi)
        t0 = y0/(1+x0)
        assert abs((1-t0**2)/(1+t0**2) - x0) < 1e-9 and abs(2*t0/(1+t0**2) - y0) < 1e-9
    VT(P+'L4-02', (-1, 0), '除かれる点 (-1,0)')
    tt = np.linspace(0, 2*math.pi, 2000001)
    mx = float((np.cos(tt)**2 + np.cos(tt)*np.sin(tt) + np.sin(tt)**2).max()); assert abs(mx-1.5) < 1e-9
    V(P+'L4-03', Rational(3, 2), '最大 %.9f' % mx)
    th1, th2 = math.pi/2, 3*math.pi/2
    x1, x2 = 2*(th1-math.sin(th1)), 2*(th2-math.sin(th2))
    assert abs(2*(1-math.cos(th1))-2) < 1e-12 and abs(2*(1-math.cos(th2))-2) < 1e-12
    V(P+'L4-04', 2*pi+4, '距離=%.9f' % (x2-x1))
    assert abs((x2-x1)-(2*math.pi+4)) < 1e-9
    # L4-05 t1 t2 = -4：t1=1,t2=-4 で OA ⊥ OB
    t1, t2 = 1.0, -4.0
    assert abs((t1**2)*(t2**2) + 4*t1*t2) < 1e-12
    t1, t2 = 2.0, -2.0
    assert abs((t1**2)*(t2**2) + 4*t1*t2) < 1e-12
    V(P+'L4-05', -4, 't1*t2=-4 のとき内積 0')

R_ = sp.Symbol('r')

def VPOL(pid, pts, show=''):
    """極方程式の選択肢（r と θ の式）。曲線上の点（直交座標、原点以外）を極座標に直して代入し、成り立つのは正解だけ"""
    it = ITEMS[pid]; ok = True; note = ''
    for c in it['c']:
        try:
            s_ = c['t'].replace('$', '').replace('r(', 'r\\cdot(')
            ex = tex_eq(s_)
        except Exception as e_:
            ok = False; note += ' 読めない:%s(%s)' % (c['t'], e_); continue
        holds = True
        for (px, py) in pts:
            rr_ = math.hypot(px, py); tt_ = math.atan2(py, px)
            if abs(complex(N(ex.subs({R_: rr_, th: tt_}), 30))) > 1e-9:
                holds = False; break
        if (c.get('k') == 1) != holds:
            ok = False; note += ' 不一致:%s' % c['t']
    rec(pid, show, ok, note)

def pol2xy(rv, tv):
    return (rv*math.cos(tv), rv*math.sin(tv))

def lesson10():
    P = 'mc2-10-'
    import numpy as np
    VT(P+'L1-01', (2*cos(pi/3), 2*sin(pi/3)), '(2,π/3) → (1,√3)')
    VT(P+'L1-02', (sqrt(2), pi/4), '(1,1) → (√2,π/4)')
    VE(P+'L1-03', [pol2xy(3, a) for a in (0.2, 1.1, 2.5, 4.0, 5.5)], 'r=3 → x²+y²=9')
    VE(P+'L1-04', [pol2xy(rv, math.pi/4) for rv in (-3, -1, 0.5, 2, 7)], 'θ=π/4 (r は実数全体) → y=x')
    VE(P+'L1-05', [pol2xy(2/math.cos(a), a) for a in (-1.0, -0.3, 0.0, 0.6, 1.2)], 'r cosθ=2 → x=2')
    VT(P+'L2-01', (2, 5*pi/6), '(-√3,1) → r=2, θ=%.6f=5π/6' % cmath.phase(complex(-math.sqrt(3), 1)))
    assert abs(cmath.phase(complex(-math.sqrt(3), 1)) - 5*math.pi/6) < 1e-12
    VCIR(P+'L2-02', [pol2xy(4*math.cos(a), a) for a in (0.2, 0.7, 1.2, -0.5, -1.1, 0.0)], 'r=4cosθ → 中心(2,0) 半径2')
    pts = [(1.0, 1.0), (0.0, 2.0), (2.0, 0.0), (3.0, -1.0), (-1.0, 3.0)]
    for (px, py) in pts:
        assert abs(px+py-2) < 1e-12
    VPOL(P+'L2-03', pts, 'x+y=2 → r(cosθ+sinθ)=2')
    A_ = pol2xy(3, math.pi/6); B_ = pol2xy(4, 2*math.pi/3)
    ab = math.hypot(A_[0]-B_[0], A_[1]-B_[1])
    V(P+'L2-04', ab, 'AB=%.9f' % ab)
    pts = []
    for a in (0.1, 0.3, 0.5, 0.7, -0.4):
        rv = 1/math.sqrt(math.cos(2*a)); pts.append(pol2xy(rv, a))
    VE(P+'L2-05', pts, 'r²cos2θ=1 → x²-y²=1')
    pts = [pol2xy(2*math.cos(a)+2*math.sin(a), a) for a in (-0.5, 0.0, 0.5, 1.0, 1.5, 2.0, 2.3)]
    VCIR(P+'L3-01', pts, 'r=2cosθ+2sinθ → 中心(1,1) 半径√2')
    pts = []
    for a in (-0.6, -0.2, 0.2, 0.7, 1.0, 1.3):
        den = math.sqrt(3)*math.cos(a)+math.sin(a)
        rv = 4/den; pts.append(pol2xy(rv, a))
    VE(P+'L3-02', pts, '√3x+y=4')
    A_ = pol2xy(2, math.pi/3); B_ = pol2xy(2, 4*math.pi/3)
    near = lambda p, q: abs(p[0]-q[0]) < 1e-9 and abs(p[1]-q[1]) < 1e-9
    sym = {'x軸': near(B_, (A_[0], -A_[1])), 'y軸': near(B_, (-A_[0], A_[1])), '原点': near(B_, (-A_[0], -A_[1])), 'y=x': near(B_, (A_[1], A_[0]))}
    assert sym == {'x軸': False, 'y軸': False, '原点': True, 'y=x': False}, sym
    ANS(P+'L3-03', '対称の判定 %s' % sym, '原点に関して対称')
    A_ = pol2xy(4, math.pi/6); B_ = pol2xy(3, 5*math.pi/6)
    area = abs(A_[0]*B_[1]-A_[1]*B_[0])/2
    V(P+'L3-04', area, '面積=%.9f' % area)
    pts = [(1+math.cos(t_), math.sin(t_)) for t_ in (0.4, 1.0, 1.9, 2.7, -0.8, -2.0, 3.0)]
    VPOL(P+'L3-05', pts, '(x-1)²+y²=1 → r=2cosθ')
    # L4-01 r(1-cosθ)=2
    pts = [pol2xy(2/(1-math.cos(a)), a) for a in (0.8, 1.5, 2.2, 3.0, -1.2, -2.5)]
    VE(P+'L4-01', pts, 'y²=4(x+1)')
    pts = [pol2xy(2/(2-math.cos(a)), a) for a in (0.0, 0.8, 1.5, 2.2, 3.0, -1.2, -2.5)]
    VE(P+'L4-02', pts, '3x²+4y²-4x-4=0')
    # L4-03 共有点
    xs, ys = symbols('xs ys', real=True)
    sol = solve([xs**2+ys**2-4*xs, xs**2+ys**2-4*ys], [xs, ys], dict=True)
    cand = [(s_[xs], s_[ys]) for s_ in sol if (s_[xs], s_[ys]) != (0, 0)]
    rv = sp.sqrt(cand[0][0]**2+cand[0][1]**2); tv = sp.atan2(cand[0][1], cand[0][0])
    VT(P+'L4-03', (simplify(rv), simplify(tv)), '共有点 %s → 極座標 (%s,%s)' % (cand, simplify(rv), simplify(tv)))
    A_ = pol2xy(4, math.pi/3); B_ = pol2xy(4, 2*math.pi/3)
    M_ = ((A_[0]+B_[0])/2, (A_[1]+B_[1])/2)
    rv, tv = math.hypot(*M_), math.atan2(M_[1], M_[0])
    VT(P+'L4-04', (rv, tv), 'M=%s → (r,θ)=(%.6f,%.6f)' % (M_, rv, tv))
    pts = [pol2xy(4*math.cos(a-math.pi/3), a) for a in (-0.5, 0.0, 0.6, 1.3, 2.0, 2.4)]
    cen = (1, math.sqrt(3))
    for (px, py) in pts:
        assert abs(math.hypot(px-cen[0], py-cen[1]) - 2) < 1e-9
    VT(P+'L4-05', (1, sqrt(3)), '中心 (1,√3) 半径2')

#@@INSERT@@
# ---- 授業ごとの関数を自動で登録する ----
def _register():
    return {'mc2-%02d' % n: globals()['lesson%02d' % n] for n in range(1, 11) if 'lesson%02d' % n in globals()}
LESSONS = _register()

if __name__ == '__main__':
    want = sys.argv[1:] or sorted(LESSONS)
    load(want)
    for l in want:
        LESSONS[l]()
    ok = main_report(want)
    sys.exit(0 if ok else 1)
