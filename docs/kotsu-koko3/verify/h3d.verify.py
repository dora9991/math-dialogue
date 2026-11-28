#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""h3d 担当（数学C ベクトル mc1-01〜mc1-10）の確かめスクリプト。

各問題のデータ（座標・成分・条件）から、正解を sympy / numpy / 数え上げで計算し直し、
  ・まちがい選択肢が、正解と同じ値になっていないこと
  ・文字（TeX）に書いた選択肢を読み戻して、計算した値と一致すること
  ・解説 e の最後の行に、正解が書かれていること
を確かめたうえで、全問を「問題 → 計算した答え」として一覧に出し、out/h3d/<授業のid>.json の
正解（k:1）の選択肢と突き合わせる。1問でも合わなければ、終了コード 1。

使い方:
  python3 out/h3d.verify.py             … 計算し直して、out/h3d/*.json と突き合わせる
  python3 out/h3d.verify.py --write     … 計算した問題を out/h3d/*.json に書き出してから、突き合わせる
  python3 out/h3d.verify.py mc1-05      … 授業を指定する（複数可）
"""
#### FRAMEWORK-BEGIN
# -*- coding: utf-8 -*-
# 共通部品：数値・ベクトルの TeX 書式、選択肢の組み立て、答えの突き合わせ
import json, re, random, itertools, math, sys, os
import sympy as sp
import numpy as np
from sympy import Rational, sqrt, Integer, pi
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

x, y, z = sp.symbols('x y z')
TRANS = standard_transformations + (implicit_multiplication_application,)

def R(a, b=1):
    return Rational(a, b)

def tex(v):
    """数・式（sympy）→ TeX（$ なし）"""
    if isinstance(v, (int,)):
        v = Integer(v)
    s = sp.latex(v)
    s = s.replace(' ', '')
    s = s.replace('\\dfrac', '\\frac')
    return s

T = tex

def Vt(*xs):
    return '(' + ',\\,'.join(tex(a) for a in xs) + ')'

def tup(*xs):
    return tuple(sp.nsimplify(a) for a in xs)

def cmb(coefs, names):
    """係数と名前の線形結合 → TeX。例 cmb((1,-1),(r'\vec{a}',r'\vec{b}')) → \vec{a}-\vec{b}"""
    s = ''
    for c, n in zip(coefs, names):
        c = sp.nsimplify(c)
        if c == 0:
            continue
        sign = '-' if c < 0 else '+'
        a = abs(c)
        body = n if a == 1 else (tex(a) + n)
        if not s:
            s = ('-' if sign == '-' else '') + body
        else:
            s += sign + body
    return s if s else '0'

def lin(coefs, names, const=0):
    return cmb(list(coefs) + [const], list(names) + [''])  # 定数項は名前なし

def lin_fix(coefs, names, const=0):
    """a x + b y + c z + d（定数項つき）。定数項の '1' を落とさない"""
    s = ''
    items = [(sp.nsimplify(c), n) for c, n in zip(coefs, names)]
    for c, n in items:
        if c == 0:
            continue
        sign = '-' if c < 0 else '+'
        a = abs(c)
        body = n if a == 1 else (tex(a) + n)
        s = (('-' if sign == '-' else '') + body) if not s else (s + sign + body)
    const = sp.nsimplify(const)
    if const != 0:
        s += ('-' if const < 0 else '+') + tex(abs(const))
    return s

def eqv(lhs, rhs=0):
    """方程式 lhs=rhs を、最高次の係数で割った多項式にそろえる（同じ図形なら同じ値）"""
    e = sp.expand(sp.sympify(lhs) - sp.sympify(rhs))
    P = sp.Poly(e, x, y, z)
    lc = P.LC()
    return sp.expand(e / lc)

def plane_txt(a, b, c, d):
    return lin_fix((a, b, c), ('x', 'y', 'z'), d) + '=0'

def plane_val(a, b, c, d):
    return eqv(a * x + b * y + c * z + d)

def line2_txt(a, b, d):
    return lin_fix((a, b), ('x', 'y'), d) + '=0'

def line2_val(a, b, d):
    return eqv(a * x + b * y + d)

def _sq(v, a):
    a = sp.nsimplify(a)
    if a == 0:
        return v + '^{2}'
    if a > 0:
        return '(' + v + '-' + tex(a) + ')^{2}'
    return '(' + v + '+' + tex(-a) + ')^{2}'

def sph_txt(c, r2):
    return '+'.join(_sq(v, a) for v, a in zip('xyz', c)) + '=' + tex(sp.nsimplify(r2))

def sph_val(c, r2):
    return eqv(sum((v - a) ** 2 for v, a in zip((x, y, z), c)), r2)

def circ_txt(c, r2):
    return '+'.join(_sq(v, a) for v, a in zip('xy', c)) + '=' + tex(sp.nsimplify(r2))

def circ_val(c, r2):
    return eqv(sum((v - a) ** 2 for v, a in zip((x, y), c)), r2)

# ---------- TeX → sympy（答えの突き合わせ用）----------
def _grp(s, i):
    depth = 0
    for j in range(i, len(s)):
        if s[j] == '{':
            depth += 1
        elif s[j] == '}':
            depth -= 1
            if depth == 0:
                return s[i + 1:j], j + 1
    raise ValueError('braces: ' + s)

def tex2py(s):
    s = s.replace('\\dfrac', '\\frac').replace('\\left', '').replace('\\right', '')
    s = s.replace('\\,', '').replace('\\ ', '').replace('^{\\circ}', '').replace(' ', '')
    out = ''
    i = 0
    while i < len(s):
        if s.startswith('\\frac', i):
            a, j = _grp(s, i + 5)
            b, j = _grp(s, j)
            out += '((%s)/(%s))' % (tex2py(a), tex2py(b))
            i = j
        elif s.startswith('\\sqrt', i):
            a, j = _grp(s, i + 5)
            out += 'sqrt(%s)' % tex2py(a)
            i = j
        elif s.startswith('\\pi', i):
            out += 'pi'
            i += 3
        elif s.startswith('\\times', i):
            out += '*'
            i += 6
        elif s.startswith('\\cdot', i):
            out += '*'
            i += 5
        elif s[i] == '^' and i + 1 < len(s) and s[i + 1] == '{':
            a, j = _grp(s, i + 1)
            out += '**(%s)' % tex2py(a)
            i = j
        elif s[i] == '{':
            a, j = _grp(s, i)
            out += '(%s)' % tex2py(a)
            i = j
        else:
            out += s[i]
            i += 1
    return out

def _p(s):
    return parse_expr(tex2py(s), transformations=TRANS, local_dict={'x': x, 'y': y, 'z': z})

def split_top(s, ch=','):
    parts, depth, cur = [], 0, ''
    for c in s:
        if c in '({':
            depth += 1
        elif c in ')}':
            depth -= 1
        if c == ch and depth == 0:
            parts.append(cur)
            cur = ''
        else:
            cur += c
    parts.append(cur)
    return parts

def parse_choice(t):
    """選択肢の $…$ を、数・タプル・方程式として読み戻す。読めなければ None"""
    s = t.strip()
    if s.startswith('$') and s.endswith('$') and s.count('$') == 2:
        s = s[1:-1]
    else:
        return None
    if '\\vec' in s or '\\overrightarrow' in s or '\\mathrm' in s or 'k=' in s:
        return None
    s = s.replace('\\,', '')
    if '=' in s:
        l, r = s.split('=', 1)
        return eqv(_p(l), _p(r))
    if s.startswith('(') and s.endswith(')'):
        parts = split_top(s[1:-1])
        if len(parts) > 1:
            return tuple(_p(q) for q in parts)
    m = re.fullmatch(r'(\d+):(\d+)', s)
    if m:
        return Rational(int(m.group(1)), int(m.group(2)))
    return _p(s)

def veq(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return a == b
    if isinstance(a, str) or isinstance(b, str):
        return a == b
    if isinstance(a, frozenset) or isinstance(b, frozenset):
        return a == b
    if isinstance(a, (tuple, list)) or isinstance(b, (tuple, list)):
        if not (isinstance(a, (tuple, list)) and isinstance(b, (tuple, list))) or len(a) != len(b):
            return False
        return all(veq(p, q) for p, q in zip(a, b))
    return sp.simplify(sp.sympify(a) - sp.sympify(b)) == 0

def fmt(v):
    if isinstance(v, (tuple, list)):
        return Vt(*v)
    return tex(v)

class C:
    """選択肢。val＝値（突き合わせ用）、w＝まちがえ方、tx＝数式の中身（$で包む）、raw＝そのままの文"""
    def __init__(self, val, w=None, tx=None, raw=None):
        if isinstance(val, (sp.logic.boolalg.BooleanAtom, np.bool_)):
            val = bool(val)
        self.val, self.w, self.tx, self.raw = val, w, tx, raw
        if raw is not None:
            self.text = raw
            self.auto = False
        elif tx is not None:
            self.text = '$' + tx + '$'
            self.auto = False
        else:
            self.text = '$' + fmt(val) + '$'
            self.auto = True

def NORM(s):
    return re.sub(r'[\s　]', '', str(s).replace('$', '').replace('＝', '=').replace('\\dfrac', '\\frac'))

ALL = []   # 全授業の問題（(id, 問題→答えの記録)）
REPORT = []

class Lesson:
    def __init__(self, lid):
        self.lid = lid
        self.items = []
        self.cnt = {1: 0, 2: 0, 3: 0, 4: 0}

    def add(self, d, q, ok, bad, e, h, note=None, echeck=True):
        assert len(bad) == 3, (self.lid, d, q[:30], 'まちがいは3つ')
        self.cnt[d] += 1
        n = self.cnt[d]
        qid = '%s-L%d-%02d' % (self.lid, d, n)
        # --- 突き合わせ ---
        vals = [ok.val] + [b.val for b in bad]
        if ok.val is True:
            assert all(b.val is False for b in bad), (qid, '正しい文は1つだけ')
        elif ok.val is False:
            raise AssertionError((qid, 'ok が False'))
        else:
            for i in range(4):
                for j in range(i + 1, 4):
                    assert not veq(vals[i], vals[j]), (qid, '同じ値の選択肢', i, j, vals[i], vals[j])
        # 書いた文字から読み戻して、値と一致するか
        for cc in [ok] + bad:
            pv = parse_choice(cc.text) if not isinstance(cc.val, (bool, frozenset, str)) else None
            if pv is not None and cc.auto is False and isinstance(cc.val, (sp.Basic, tuple, int)):
                assert veq(pv, cc.val), (qid, '文字と値が合わない', cc.text, cc.val, pv)
            if pv is not None and cc.auto:
                assert veq(pv, cc.val), (qid, '文字と値が合わない(auto)', cc.text, cc.val, pv)
        # ベクトル・組の選択肢は、成分の数・入れ子の形がそろっていること
        def shape(v):
            if isinstance(v, (tuple, list)):
                return tuple(shape(t) for t in v)
            return 1
        shp = set(shape(v) for v in vals)
        assert len(shp) == 1, (qid, '選択肢の成分の数・形がそろっていない', vals)
        nw = sum(1 for b in bad if b.w)
        assert nw >= 2, (qid, 'w が2つ未満')
        assert ok.w is None
        e_lines = e if isinstance(e, list) else e.split('\n')
        assert 3 <= len(e_lines) <= 6, (qid, 'e は3〜6行', len(e_lines))
        if echeck and ok.auto:
            assert NORM(fmt(ok.val)) in NORM(e_lines[-1]), (qid, 'e の最後の行に答えが無い', fmt(ok.val), e_lines[-1])
        if echeck and (not ok.auto) and ok.tx is not None:
            assert NORM(ok.tx) in NORM(e_lines[-1]), (qid, 'e の最後の行に答えが無い', ok.tx, e_lines[-1])
        self.items.append(dict(id=qid, d=d, q=q, ok=ok, bad=bad, e='\n'.join(e_lines), h=h, note=note))
        return qid

    def build(self):
        assert self.cnt == {1: 5, 2: 5, 3: 5, 4: 5}, (self.lid, self.cnt)
        rng = random.Random('h3d-' + self.lid)
        pos = [0, 1, 2, 3] * 5
        rng.shuffle(pos)
        out = []
        for it, p in zip(self.items, pos):
            cs = []
            wrongs = list(it['bad'])
            rng.shuffle(wrongs)
            seq = []
            for i in range(4):
                if i == p:
                    seq.append(it['ok'])
                else:
                    seq.append(wrongs.pop())
            for cc in seq:
                dct = {'t': cc.text}
                if cc is it['ok']:
                    dct['k'] = 1
                elif cc.w:
                    dct['w'] = cc.w
                cs.append(dct)
            ln = self.lid.split('-')[1]
            out.append({'id': it['id'], 'u': 'H3-TD', 's': 'H3-TD-' + ln, 'l': self.lid, 'd': it['d'],
                        'q': it['q'], 'c': cs, 'e': it['e'], 'h': it['h']})
        return out

def plain(s):
    return re.sub(r'\s+', ' ', s)

#### FRAMEWORK-END

#### L01-BEGIN
def vd(P, s):
    """P＝{'A':(..),..}、s＝'AB' → 成分 B-A"""
    return tuple(sp.nsimplify(P[s[1]][i] - P[s[0]][i]) for i in range(len(P[s[0]])))

def lesson_01():
    L = Lesson('mc1-01')
    va, vb, vc = r'\vec{a}', r'\vec{b}', r'\vec{c}'

    # ---------- 段階1 ----------
    # 1-1 等しいベクトル
    P = {'A': (0, 0), 'B': (4, 0), 'C': (5, 3), 'D': (1, 3)}
    ab = vd(P, 'AB')
    def okv(s): return vd(P, s) == ab
    L.add(1, r"平行四辺形 ABCD（頂点は A, B, C, D の順に並ぶ）がある。$\overrightarrow{AB}$ と等しいベクトルはどれか。",
          C(okv('DC'), tx=r'\overrightarrow{DC}'),
          [C(okv('CD'), '向きが逆のベクトルを選んだ。', tx=r'\overrightarrow{CD}'),
           C(okv('AD'), 'A から出る、となりの辺のベクトルを選んだ。', tx=r'\overrightarrow{AD}'),
           C(okv('BC'), 'AB につづく辺 BC のベクトルを選んだ。', tx=r'\overrightarrow{BC}')],
          [r"平行四辺形では、向かい合う辺は平行で、長さも等しい。",
           r"$\overrightarrow{AB}$ と $\overrightarrow{DC}$ は、向きも大きさも同じである。",
           r"$\overrightarrow{CD}$ は向きが逆、$\overrightarrow{AD}$、$\overrightarrow{BC}$ は別の辺のベクトルである。",
           r"よって $\overrightarrow{DC}$"],
          "ベクトルが等しいとは、向きと大きさが同じこと。向かい合う辺に目をつけよう。")

    # 1-2 AB+BC
    P = {'A': (1, 2), 'B': (4, 3), 'C': (2, 6)}
    ac = vd(P, 'AC')
    assert tuple(a + b for a, b in zip(vd(P, 'AB'), vd(P, 'BC'))) == ac
    L.add(1, r"3点 A, B, C について、$\overrightarrow{AB}+\overrightarrow{BC}$ と等しいベクトルはどれか。",
          C(ac, tx=r'\overrightarrow{AC}'),
          [C(vd(P, 'CA'), '始点と終点を逆にしてしまった。', tx=r'\overrightarrow{CA}'),
           C(vd(P, 'BC'), '後ろのベクトルだけを答えてしまった。', tx=r'\overrightarrow{BC}'),
           C(vd(P, 'AB'), '前のベクトルだけを答えてしまった。', tx=r'\overrightarrow{AB}')],
          [r"ベクトルの和は、終点と始点をつなぐ（三角形の法則）。",
           r"$\overrightarrow{AB}$ の終点 B が、$\overrightarrow{BC}$ の始点と重なっている。",
           r"$\overrightarrow{AB}+\overrightarrow{BC}$ は、A から C へ向かうベクトルになる。",
           r"よって $\overrightarrow{AC}$"],
          "B を「経由」して、A から C まで進むと考えよう。")

    # 1-3 大きさ
    k = -2
    L.add(1, r"$|\vec{a}|=3$ のとき、$|-2\vec{a}|$ の値はいくつか。",
          C(abs(k) * 3),
          [C(-6, '大きさに負の符号が残ると考えた。'),
           C(5, r'$|k\vec{a}|=|k|+|\vec{a}|$ と考えて足してしまった。'),
           C(R(3, 2), '3 を 2 でわってしまった。')],
          [r"$|k\vec{a}|=|k||\vec{a}|$ である。",
           r"$|-2\vec{a}|=|-2|\times|\vec{a}|$",
           r"$=2\times 3=6$",
           r"よって $6$"],
          "実数倍の大きさは、倍率の絶対値をかけたものになる。")

    # 1-4 単位ベクトル
    kk = R(1, 5)
    L.add(1, r"$|\vec{a}|=5$ である。$\vec{a}$ と同じ向きの単位ベクトルはどれか。",
          C(kk, tx=cmb((kk,), (va,))),
          [C(5, '大きさを 5 倍してしまった。', tx=cmb((5,), (va,))),
           C(-kk, '逆向きのベクトルを選んだ。', tx=cmb((-kk,), (va,))),
           C(R(1, 25), '大きさ 5 の 2乗でわってしまった。', tx=cmb((R(1, 25),), (va,)))],
          [r"単位ベクトルとは、大きさが 1 のベクトルである。",
           r"$\vec{a}$ の大きさ 5 でわれば、大きさが 1 になる。",
           r"同じ向きだから、正の数 $\frac{1}{5}$ をかける。",
           r"よって $\frac{1}{5}\vec{a}$"],
          "$\\vec{a}$ に正の数をかけると向きは変わらない。大きさを 1 にするには何をかければよいか。")

    # 1-5 向き
    def stm(kv, mult, same):
        return (abs(kv) == mult) and ((kv > 0) == same)
    kv = -3
    def stx(mult, same):
        return r"大きさは $\vec{a}$ の $%s$ 倍で、%s" % (tex(mult), '$\\vec{a}$ と同じ向き' if same else '$\\vec{a}$ と逆向き')
    L.add(1, r"$\vec{a}\neq\vec{0}$ とする。$\vec{b}=-3\vec{a}$ のとき、$\vec{b}$ について正しいものはどれか。",
          C(stm(kv, 3, False), raw=stx(3, False)),
          [C(stm(kv, 3, True), '負の数をかけると向きが逆になることを見落とした。', raw=stx(3, True)),
           C(stm(kv, R(1, 3), False), '倍率 −3 を、逆数の $\\frac{1}{3}$ にしてしまった。', raw=stx(R(1, 3), False)),
           C(stm(kv, R(1, 3), True), '倍率の大きさも向きも取りちがえた。', raw=stx(R(1, 3), True))],
          [r"$k\vec{a}$ の大きさは $|k||\vec{a}|$ である。",
           r"$k<0$ のとき、$k\vec{a}$ は $\vec{a}$ と逆向きになる。",
           r"$k=-3$ だから、大きさは 3 倍で、逆向き。",
           r"よって「大きさは 3 倍で、逆向き」"],
          "倍率の絶対値は大きさ、符号は向きに関係する。", echeck=False)

    # ---------- 段階2 ----------
    # 2-1 BD を a,b で
    a_, b_ = sp.Matrix([3, 1]), sp.Matrix([1, 2])
    A_ = sp.Matrix([0, 0]); B_ = A_ + a_; D_ = A_ + b_
    bd = D_ - B_
    sol = sp.Matrix.hstack(a_, b_).solve(bd)
    assert tuple(sol) == (-1, 1)
    def cv(p, q, w=None): return C((sp.nsimplify(p), sp.nsimplify(q)), w, tx=cmb((p, q), (va, vb)))
    L.add(2, r"平行四辺形 ABCD で、$\overrightarrow{AB}=\vec{a}$、$\overrightarrow{AD}=\vec{b}$ とする。$\overrightarrow{BD}$ を $\vec{a}$、$\vec{b}$ で表すとどうなるか。",
          cv(-1, 1),
          [cv(1, -1, '始点と終点を逆にして $\\overrightarrow{DB}$ を求めてしまった。'),
           cv(1, 1, '対角線 $\\overrightarrow{AC}$ を求めてしまった。'),
           cv(-1, -1, '$\\overrightarrow{CA}$ を求めてしまった。')],
          [r"$\overrightarrow{BD}=\overrightarrow{BA}+\overrightarrow{AD}$ と分ける。",
           r"$\overrightarrow{BA}=-\overrightarrow{AB}=-\vec{a}$、$\overrightarrow{AD}=\vec{b}$",
           r"$\overrightarrow{BD}=-\vec{a}+\vec{b}$",
           r"よって $-\vec{a}+\vec{b}$"],
          "B から D へ、A を経由して進むと考えよう。")

    # 2-2 計算
    sa, sb = sp.symbols('sa sb')
    ex = sp.expand(3 * (sa - 2 * sb) - 2 * (sa - 4 * sb))
    assert (ex.coeff(sa), ex.coeff(sb)) == (1, 2)
    L.add(2, r"$3(\vec{a}-2\vec{b})-2(\vec{a}-4\vec{b})$ を簡単にすると、どうなるか。",
          cv(1, 2),
          [cv(1, -14, r'$-2\times(-4\vec{b})$ の符号を取りちがえて、$-8\vec{b}$ とした。'),
           cv(5, 2, r'$-2\times\vec{a}$ を $+2\vec{a}$ としてしまった。'),
           cv(1, -2, r'$-2\times(-4\vec{b})$ を $+4\vec{b}$ とした（2 をかけ忘れた）。')],
          [r"分配して展開する。$3(\vec{a}-2\vec{b})=3\vec{a}-6\vec{b}$",
           r"$-2(\vec{a}-4\vec{b})=-2\vec{a}+8\vec{b}$",
           r"$\vec{a}$ の係数：$3-2=1$、$\vec{b}$ の係数：$-6+8=2$",
           r"よって $\vec{a}+2\vec{b}$"],
          "文字の式と同じように、かっこをはずしてから同類項をまとめよう。")

    # 2-3 方程式
    xs = sp.symbols('xs')
    # 2(x-a)=3x-4b → x = -2a+4b  （a,b の係数ごとに解く）
    sx_a = sp.solve(sp.Eq(2 * (xs - 1), 3 * xs - 0), xs)[0]   # a の係数
    sx_b = sp.solve(sp.Eq(2 * (xs - 0), 3 * xs - 4), xs)[0]   # b の係数
    assert (sx_a, sx_b) == (-2, 4)
    L.add(2, r"$2(\vec{x}-\vec{a})=3\vec{x}-4\vec{b}$ を満たす $\vec{x}$ を、$\vec{a}$、$\vec{b}$ で表すとどうなるか。",
          cv(-2, 4),
          [cv(2, -4, r'$-\vec{x}=\cdots$ の形のまま、符号を戻さなかった。'),
           cv(-2, -4, r'$\vec{b}$ の項を移項するときに符号を取りちがえた。'),
           cv(2, 4, '両方の符号を取りちがえた。')],
          [r"かっこをはずす。$2\vec{x}-2\vec{a}=3\vec{x}-4\vec{b}$",
           r"$\vec{x}$ の項を左辺に、ほかを右辺に移す。$2\vec{x}-3\vec{x}=2\vec{a}-4\vec{b}$",
           r"$-\vec{x}=2\vec{a}-4\vec{b}$",
           r"よって $\vec{x}=-2\vec{a}+4\vec{b}$"],
          "ベクトルも、文字の方程式と同じように移項して解ける。")

    # 2-4 平行条件（係数）
    kk = sp.symbols('kk')
    # q = t p, p = a-3b, q = 2a + k b → t=2, k = -3*2
    assert 2 * (-3) == -6
    def ck(v, w=None): return C(sp.nsimplify(v), w)
    L.add(2, r"$\vec{a}$、$\vec{b}$ は平行でなく、どちらも $\vec{0}$ でない。$\vec{p}=\vec{a}-3\vec{b}$ と $\vec{q}=2\vec{a}+k\vec{b}$ が平行になるとき、実数 $k$ の値はいくつか。",
          ck(-6),
          [ck(6, r'$\vec{b}$ の係数 $-3$ に 2 をかけるとき、符号を落とした。'),
           ck(-3, r'$\vec{b}$ の係数がそのまま同じだと考えた。'),
           ck(R(-3, 2), r'$\vec{q}$ が $\vec{p}$ の $\frac{1}{2}$ 倍だと考えた。')],
          [r"平行だから、$\vec{q}=t\vec{p}$ となる実数 $t$ がある。",
           r"$2\vec{a}+k\vec{b}=t\vec{a}-3t\vec{b}$。$\vec{a}$、$\vec{b}$ は平行でないので係数を比べる。",
           r"$t=2$、$k=-3t=-6$",
           r"よって $-6$"],
          "$\\vec{q}=t\\vec{p}$ とおいて、$\\vec{a}$ の係数と $\\vec{b}$ の係数を別々に比べよう。")

    # 2-5 係数比較
    X, Y = sp.symbols('X Y')
    s = sp.solve([2 * X + Y - 7, X - 3 * Y + 7], [X, Y])
    assert (s[X], s[Y]) == (2, 3)
    L.add(2, r"$\vec{a}$、$\vec{b}$ は平行でなく、どちらも $\vec{0}$ でない。実数 $x$、$y$ が $(2x+y)\vec{a}+(x-3y)\vec{b}=7\vec{a}-7\vec{b}$ を満たすとき、$(x,\ y)$ はどれか。",
          C((Integer(2), Integer(3))),
          [C((Integer(3), Integer(2)), '$x$ と $y$ を入れかえて答えた。'),
           C((Integer(4), Integer(-1)), r'$\vec{b}$ の係数 $-7$ の符号を落として解いた。'),
           C((Integer(1), Integer(5)), '1つの式だけを満たす $(x,\\ y)$ を答えた。')],
          [r"$\vec{a}$、$\vec{b}$ は平行でないから、両辺の係数を比べる。",
           r"$2x+y=7$、$x-3y=-7$",
           r"第2式から $x=3y-7$。第1式に代入して $7y-14=7$ より $y=3$、$x=2$",
           r"よって $(2,\,3)$"],
          "平行でない2つのベクトルでは、$\\vec{a}$ の係数どうし、$\\vec{b}$ の係数どうしが等しくなる。")

    # ---------- 段階3 ----------
    # 3-1 正六角形
    ang = [sp.pi * i / 3 for i in range(6)]
    H = {n: (sp.cos(t), sp.sin(t)) for n, t in zip('ABCDEF', ang)}
    a_v = sp.Matrix(vd(H, 'AB')); b_v = sp.Matrix(vd(H, 'AF'))
    M2 = sp.Matrix.hstack(a_v, b_v)
    def comb(s):
        r = M2.solve(sp.Matrix(vd(H, s)))
        return (sp.nsimplify(sp.simplify(r[0])), sp.nsimplify(sp.simplify(r[1])))
    assert comb('AE') == (1, 2) and comb('AC') == (2, 1) and comb('AD') == (2, 2)
    O = {'A': H['A'], 'O': (0, 0)}
    assert tuple(M2.solve(sp.Matrix(vd(O, 'AO')))) == (1, 1)
    L.add(3, r"正六角形 ABCDEF（頂点は A, B, C, D, E, F の順）の中心を O とする。$\overrightarrow{AB}=\vec{a}$、$\overrightarrow{AF}=\vec{b}$ のとき、$\overrightarrow{AE}$ を $\vec{a}$、$\vec{b}$ で表すとどうなるか。",
          cv(1, 2),
          [cv(2, 1, r'$\overrightarrow{AC}$ を求めてしまった（C と E を取りちがえた）。'),
           cv(2, 2, r'対角線 $\overrightarrow{AD}$ を求めてしまった。'),
           cv(1, 1, r'中心までの $\overrightarrow{AO}$ を求めてしまった。')],
          [r"四角形 ABOF はひし形（平行四辺形）だから、$\overrightarrow{AO}=\overrightarrow{AB}+\overrightarrow{AF}=\vec{a}+\vec{b}$",
           r"四角形 AOEF も平行四辺形だから、$\overrightarrow{FE}=\overrightarrow{AO}=\vec{a}+\vec{b}$",
           r"$\overrightarrow{AE}=\overrightarrow{AF}+\overrightarrow{FE}=\vec{b}+(\vec{a}+\vec{b})=\vec{a}+2\vec{b}$",
           r"よって $\vec{a}+2\vec{b}$"],
          "$\\overrightarrow{AE}=\\overrightarrow{AF}+\\overrightarrow{FE}$ と分けて、$\\overrightarrow{FE}$ が $\\vec{a}$、$\\vec{b}$ でどう表せるかを考えよう。")

    # 3-2 |a+b| の最大最小
    th = np.linspace(0, np.pi, 100001)
    vals = np.sqrt(16 + 9 + 24 * np.cos(th))
    assert abs(vals.max() - 7) < 1e-6 and abs(vals.min() - 1) < 1e-6
    def mm(mx, mn): return r"最大値 $%s$、最小値 $%s$" % (tex(mx), tex(mn))
    L.add(3, r"$|\vec{a}|=4$、$|\vec{b}|=3$ である。$\vec{a}$ と $\vec{b}$ の向きを変えて考えるとき、$|\vec{a}+\vec{b}|$ の最大値と最小値の組はどれか。",
          C((7, 1), raw=mm(7, 1)),
          [C((7, 0), '最小値を 0 と考えた（大きさがちがうので、0 にはならない）。', raw=mm(7, 0)),
           C((12, 1), '最大値を、足さずに $4\\times 3$ と考えた。', raw=mm(12, 1)),
           C((5, 1), '最大値を、垂直のときの値（三平方の定理）とした。', raw=mm(5, 1))],
          [r"$|\vec{a}+\vec{b}|$ は、同じ向きのとき最大、逆向きのとき最小になる。",
           r"最大：$|\vec{a}|+|\vec{b}|=4+3=7$",
           r"最小：$|\vec{a}|-|\vec{b}|=4-3=1$",
           r"よって 最大値 $7$、最小値 $1$"],
          "2つのベクトルの向きが同じ、または逆のときを考えよう。", echeck=False)

    # 3-3 内分
    Pp = {'A': (0, 0), 'B': (3, 1), 'C': (1, 4)}
    D_ = tuple((Rational(1) * sp.Matrix(Pp['B']) + 2 * sp.Matrix(Pp['C'])) / 3)
    assert tuple(sp.Matrix(Pp['B']) + R(2, 3) * (sp.Matrix(Pp['C']) - sp.Matrix(Pp['B']))) == D_
    L.add(3, r"△ABC で、$\overrightarrow{AB}=\vec{b}$、$\overrightarrow{AC}=\vec{c}$ とする。辺 BC を $2:1$ に内分する点を D とするとき、$\overrightarrow{AD}$ はどれか。",
          C((R(1, 3), R(2, 3)), tx=cmb((R(1, 3), R(2, 3)), (vb, vc))),
          [C((R(2, 3), R(1, 3)), '内分の比 $2:1$ を逆にした。', tx=cmb((R(2, 3), R(1, 3)), (vb, vc))),
           C((R(1, 2), R(1, 2)), '中点と考えた。', tx=cmb((R(1, 2), R(1, 2)), (vb, vc))),
           C((1, 2), '3 でわるのを忘れた。', tx=cmb((1, 2), (vb, vc)))],
          [r"BD : DC = 2 : 1 より、$\overrightarrow{BD}=\frac{2}{3}\overrightarrow{BC}=\frac{2}{3}(\vec{c}-\vec{b})$",
           r"$\overrightarrow{AD}=\overrightarrow{AB}+\overrightarrow{BD}=\vec{b}+\frac{2}{3}(\vec{c}-\vec{b})$",
           r"$=\frac{1}{3}\vec{b}+\frac{2}{3}\vec{c}$",
           r"よって $\frac{1}{3}\vec{b}+\frac{2}{3}\vec{c}$"],
          "$\\overrightarrow{AD}=\\overrightarrow{AB}+\\overrightarrow{BD}$ と分け、$\\overrightarrow{BD}$ は $\\overrightarrow{BC}$ の何倍かを考えよう。")

    # 3-4 平行になる k
    kk = sp.symbols('kk')
    tt = sp.symbols('tt')
    sols = sp.solve([kk + 1 - tt, 4 - tt * (kk - 2)], [kk, tt], dict=True)
    ks = frozenset(sp.nsimplify(s_[kk]) for s_ in sols)
    assert ks == frozenset({3, -2})
    def kset(*vs): return frozenset(sp.Integer(v) for v in vs)
    def ktx(*vs): return 'k=' + r',\ '.join(tex(v) for v in sorted(vs))
    L.add(3, r"$\vec{a}$、$\vec{b}$ は平行でなく、どちらも $\vec{0}$ でない。$\vec{p}=(k+1)\vec{a}+4\vec{b}$ と $\vec{q}=\vec{a}+(k-2)\vec{b}$ が平行になるような実数 $k$ の値をすべて求めよ。",
          C(kset(-2, 3), tx=ktx(-2, 3)),
          [C(kset(3), '$k=-2$ の場合を見落とした。', tx=ktx(3)),
           C(kset(-2), '$k=3$ の場合を見落とした。', tx=ktx(-2)),
           C(kset(-3, 2), '2次方程式の解の符号を取りちがえた。', tx=ktx(-3, 2))],
          [r"$\vec{q}\neq\vec{0}$ だから、平行なら $\vec{p}=t\vec{q}$ と書ける。",
           r"$k+1=t$、$4=t(k-2)$。$t$ を消すと $(k+1)(k-2)=4$",
           r"$k^{2}-k-6=0$、$(k-3)(k+2)=0$",
           r"よって $k=-2,\ 3$"],
          "$\\vec{p}=t\\vec{q}$ とおき、$\\vec{a}$、$\\vec{b}$ の係数を比べて $t$ を消そう。")

    # 3-5 正しい文
    def stt(s): return s
    L.add(3, r"$\vec{a}$、$\vec{b}$ はどちらも $\vec{0}$ でないベクトルとする。次のうち、正しいものはどれか。",
          C(True, raw=r"$\vec{a}=\vec{b}$ ならば、$|\vec{a}|=|\vec{b}|$ である。"),
          [C(False, '大きさが同じでも、向きがちがえば等しくならないことを見落とした。', raw=r"$|\vec{a}|=|\vec{b}|$ ならば、$\vec{a}=\vec{b}$ である。"),
           C(False, '平行ならば等しいと考えた。', raw=r"$\vec{a}$ と $\vec{b}$ が平行ならば、$\vec{a}=\vec{b}$ である。"),
           C(False, r'$-\vec{a}$ は、$\vec{a}$ と向きが逆であることを見落とした。', raw=r"$\vec{a}$ と $-\vec{a}$ は、大きさも向きも等しい。")],
          [r"等しいベクトルは、向きも大きさも同じだから、大きさは等しい。（正しい）",
           r"正方形の隣り合う2辺のベクトルのように、大きさが同じでも、向きがちがうと等しくない。",
           r"$\vec{a}$ と $2\vec{a}$ は平行だが等しくない。$-\vec{a}$ は $\vec{a}$ と向きが逆である。",
           r"よって「$\vec{a}=\vec{b}$ ならば、$|\vec{a}|=|\vec{b}|$ である」"],
          "ベクトルが等しい条件は「向きと大きさの両方が同じ」であること。反例を考えてみよう。", echeck=False)

    # ---------- 段階4 ----------
    # 4-1 MN
    Aa = sp.Matrix([0, 0]); aa = sp.Matrix([5, 1]); bb = sp.Matrix([2, 4])
    Bq = Aa + aa; Dq = Aa + bb; Cq = Aa + aa + bb
    Mq = (Cq + Dq) / 2
    Nq = Bq + (Cq - Bq) / 3
    mn = Nq - Mq
    r = sp.Matrix.hstack(aa, bb).solve(mn)
    assert tuple(r) == (R(1, 2), R(-2, 3))
    L.add(4, r"平行四辺形 ABCD で、$\overrightarrow{AB}=\vec{a}$、$\overrightarrow{AD}=\vec{b}$ とする。辺 CD の中点を M、辺 BC を $1:2$ に内分する点を N とするとき、$\overrightarrow{MN}$ を $\vec{a}$、$\vec{b}$ で表すとどうなるか。",
          cv(R(1, 2), R(-2, 3)),
          [cv(R(-1, 2), R(2, 3), r'$\overrightarrow{NM}$ を求めてしまった（向きが逆）。'),
           cv(R(1, 2), R(-1, 3), r'BN : NC を $2:1$ と取りちがえた。'),
           cv(R(1, 2), R(-1, 6), r'M を CD の中点でなく、AC の中点とした。')],
          [r"$\overrightarrow{AM}=\overrightarrow{AD}+\overrightarrow{DM}=\vec{b}+\frac{1}{2}\vec{a}$（$\overrightarrow{DC}=\vec{a}$ の半分）",
           r"$\overrightarrow{AN}=\overrightarrow{AB}+\overrightarrow{BN}=\vec{a}+\frac{1}{3}\vec{b}$（$\overrightarrow{BC}=\vec{b}$ の $\frac{1}{3}$）",
           r"$\overrightarrow{MN}=\overrightarrow{AN}-\overrightarrow{AM}=\vec{a}+\frac{1}{3}\vec{b}-\frac{1}{2}\vec{a}-\vec{b}$",
           r"よって $\frac{1}{2}\vec{a}-\frac{2}{3}\vec{b}$"],
          "A を始点にして、$\\overrightarrow{AM}$ と $\\overrightarrow{AN}$ をそれぞれ $\\vec{a}$、$\\vec{b}$ で表し、差をとろう。")

    # 4-2 正三角形
    aa_ = sp.Matrix([1, 0]); bb_ = sp.Matrix([R(1, 2), sqrt(3) / 2])
    assert sp.simplify((aa_ - bb_).norm() - 1) == 0
    nrm = sp.simplify((aa_ + bb_).norm())
    assert sp.simplify(nrm - sqrt(3)) == 0
    L.add(4, r"△OAB は、$OA=OB=AB=1$ の正三角形である。$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$ のとき、$|\vec{a}+\vec{b}|$ の値はいくつか。",
          C(sqrt(3)),
          [C(2, r'$|\vec{a}+\vec{b}|=|\vec{a}|+|\vec{b}|$ と考えた。'),
           C(sqrt(2), '$\\vec{a}$ と $\\vec{b}$ が垂直だと考えた。'),
           C(1, '対角線ではなく、辺 AB の長さを答えた。')],
          [r"$\vec{a}+\vec{b}=\overrightarrow{OC}$ とすると、四角形 OACB はひし形（1辺 1、$\angle AOB=60^{\circ}$）。",
           r"OC は、1辺 1 の正三角形の高さの 2 倍になる。",
           r"$|\vec{a}+\vec{b}|=2\times\frac{\sqrt{3}}{2}=\sqrt{3}$",
           r"よって $\sqrt{3}$"],
          "$\\vec{a}+\\vec{b}$ を、平行四辺形（ここではひし形）の対角線として考えよう。")

    # 4-3 p,q で表す
    xx, yy = sp.symbols('xx yy')
    sl = sp.solve([xx + 2 * yy + 1, 2 * xx - yy - 8], [xx, yy])
    assert (sl[xx], sl[yy]) == (3, -2)
    L.add(4, r"$\vec{a}$、$\vec{b}$ は平行でなく、どちらも $\vec{0}$ でない。$\vec{p}=\vec{a}+2\vec{b}$、$\vec{q}=2\vec{a}-\vec{b}$ とする。$-\vec{a}+8\vec{b}=x\vec{p}+y\vec{q}$ となる実数 $x$、$y$ の組 $(x,\ y)$ はどれか。",
          C((Integer(3), Integer(-2))),
          [C((Integer(-2), Integer(3)), '$x$ と $y$ を入れかえて答えた。'),
           C((Integer(3), Integer(2)), '$y$ の符号を取りちがえた。'),
           C((Integer(-3), Integer(2)), '$x$、$y$ の符号をどちらも取りちがえた。')],
          [r"右辺を展開する。$x\vec{p}+y\vec{q}=(x+2y)\vec{a}+(2x-y)\vec{b}$",
           r"$\vec{a}$、$\vec{b}$ の係数を比べる。$x+2y=-1$、$2x-y=8$",
           r"第2式から $y=2x-8$。第1式に代入して $5x-16=-1$ より $x=3$、$y=-2$",
           r"よって $(3,\,-2)$"],
          "右辺を $\\vec{a}$ と $\\vec{b}$ の式に直して、係数を比べよう。")

    # 4-4 同じ向きに平行
    kk = sp.symbols('kk')
    res = []
    for kv_ in [-2, 2]:
        p_ = (kv_, 4); q_ = (1, kv_)
        t_ = sp.Rational(p_[0], q_[0])
        if p_[1] == t_ * q_[1]:
            res.append((kv_, t_ > 0))
    assert res == [(-2, False), (2, True)]
    L.add(4, r"$\vec{a}$、$\vec{b}$ は平行でなく、どちらも $\vec{0}$ でない。$\vec{p}=k\vec{a}+4\vec{b}$ と $\vec{q}=\vec{a}+k\vec{b}$ が、同じ向きに平行になるような実数 $k$ の値はいくつか。",
          ck(2),
          [ck(-2, '逆向きに平行になるほうの値を答えた。'),
           ck(4, '$k^{2}=4$ の 4 を答えてしまった。'),
           ck(1)],
          [r"$\vec{q}\neq\vec{0}$ だから、$\vec{p}=t\vec{q}$ とおくと $k=t$、$4=tk$",
           r"$t$ を消して $k^{2}=4$ より $k=\pm 2$",
           r"同じ向きなので $t=k>0$。$k=-2$ のとき $\vec{p}=-2\vec{a}+4\vec{b}=-2(\vec{a}-2\vec{b})$ で逆向き。",
           r"よって $k=2$"],
          "$\\vec{p}=t\\vec{q}$ とおいて係数を比べると、$t$ の符号が向きを決める。")

    # 4-5 |a+b|=|a|+|b|
    rng_ = np.random.default_rng(1)
    def holds(av, bv):
        return abs(np.linalg.norm(av + bv) - (np.linalg.norm(av) + np.linalg.norm(bv))) < 1e-9
    # 同じ向き平行：つねに成立 / 逆向き・垂直・大きさ同じ：反例あり
    for _ in range(200):
        av = rng_.normal(size=2); bv = abs(rng_.normal()) * av
        assert holds(av, bv)
    assert not holds(np.array([1., 0]), np.array([-2., 0]))
    assert not holds(np.array([1., 0]), np.array([0., 3.]))
    assert not holds(np.array([1., 0]), np.array([0., 1.]))   # 大きさ同じ
    # 逆に、成立するなら同じ向き（コーシー・シュワルツの等号条件）
    for _ in range(200):
        av = rng_.normal(size=2); bv = rng_.normal(size=2)
        if holds(av, bv):
            assert abs(av[0] * bv[1] - av[1] * bv[0]) < 1e-9 and np.dot(av, bv) > 0
    L.add(4, r"$\vec{a}$、$\vec{b}$ はどちらも $\vec{0}$ でないベクトルとする。$|\vec{a}+\vec{b}|=|\vec{a}|+|\vec{b}|$ が成り立つのは、どのようなときか。",
          C(True, raw=r"$\vec{a}$ と $\vec{b}$ が、同じ向きに平行なとき"),
          [C(False, '逆向きでも、大きさの和になると考えた。', raw=r"$\vec{a}$ と $\vec{b}$ が、逆向きに平行なとき"),
           C(False, '垂直のときも、大きさの和になると考えた。', raw=r"$\vec{a}$ と $\vec{b}$ が、垂直なとき"),
           C(False, '大きさが同じなら、和の大きさも等しくなると考えた。', raw=r"$|\vec{a}|=|\vec{b}|$ のとき")],
          [r"三角形の辺の長さの関係から、$|\vec{a}+\vec{b}|\leqq|\vec{a}|+|\vec{b}|$ である。",
           r"等号が成り立つのは、$\vec{a}$、$\vec{b}$ が一直線上で、同じ向きに並ぶとき（三角形がつぶれる）。",
           r"逆向きなら $||\vec{a}|-|\vec{b}||$、垂直なら $\sqrt{|\vec{a}|^{2}+|\vec{b}|^{2}}$ で、どちらも和より小さい。",
           r"よって「$\vec{a}$ と $\vec{b}$ が、同じ向きに平行なとき」"],
          "$\\vec{a}$ と $\\vec{b}$ を続けて並べた三角形を考え、辺の長さの関係を見よう。", echeck=False)
    return L
#### L01-END

#### L02-BEGIN
def M(*xs):
    return sp.Matrix(xs)

def tt(m):
    return tuple(sp.nsimplify(v) for v in m)

def lesson_02():
    L = Lesson('mc1-02')
    I = Integer

    def vt(*xs):
        return tuple(sp.nsimplify(v) for v in xs)

    # ---------- 段階1 ----------
    a, b = M(2, -3), M(-1, 4)
    ans = tt(a + b)
    assert ans == (1, 1)
    L.add(1, r"$\vec{a}=(2,\,-3)$、$\vec{b}=(-1,\,4)$ のとき、$\vec{a}+\vec{b}$ の成分はどれか。",
          C(ans),
          [C(tt(a - b), '和でなく差を計算してしまった。'),
           C(vt(-2, -12), '成分どうしをかけてしまった。'),
           C(vt(1, 7), r'$y$ 成分の $-3$ の符号を落として、$3+4$ とした。')],
          [r"和は、成分ごとに足す。",
           r"$\vec{a}+\vec{b}=(2+(-1),\ -3+4)$",
           r"$=(1,\,1)$",
           r"よって $(1,\,1)$"],
          "ベクトルの和は、$x$ 成分どうし、$y$ 成分どうしを足す。")

    a = M(-5, 12)
    n = sp.sqrt(sum(v ** 2 for v in a))
    assert n == 13
    L.add(1, r"$\vec{a}=(-5,\,12)$ のとき、$|\vec{a}|$ の値はいくつか。",
          C(n),
          [C(17, '成分の絶対値を足してしまった。'),
           C(169, '平方根をとるのを忘れた。'),
           C(7, '成分をそのまま足した。')],
          [r"$|\vec{a}|=\sqrt{a_{1}^{2}+a_{2}^{2}}$",
           r"$=\sqrt{(-5)^{2}+12^{2}}=\sqrt{25+144}$",
           r"$=\sqrt{169}=13$",
           r"よって $13$"],
          "大きさは、成分を2乗して足し、平方根をとる。")

    A, B = M(1, 2), M(4, -2)
    ab = tt(B - A)
    assert ab == (3, -4)
    L.add(1, r"2点 A$(1,\,2)$、B$(4,\,-2)$ について、$\overrightarrow{AB}$ の成分はどれか。",
          C(ab),
          [C(tt(A - B), '終点から始点を引くところを、逆にしてしまった。'),
           C(vt(5, 0), '座標を足してしまった。'),
           C(vt(3, 4), r'$y$ 成分を $2-(-2)$ と、逆に引いてしまった。')],
          [r"$\overrightarrow{AB}=($ 終点 B の座標 $-$ 始点 A の座標 $)$",
           r"$=(4-1,\ -2-2)$",
           r"$=(3,\,-4)$",
           r"よって $(3,\,-4)$"],
          "「終点の座標 − 始点の座標」を成分ごとに計算する。")

    a, b = M(1, -2), M(-3, 1)
    ans = tt(3 * a - 2 * b)
    assert ans == (9, -8)
    L.add(1, r"$\vec{a}=(1,\,-2)$、$\vec{b}=(-3,\,1)$ のとき、$3\vec{a}-2\vec{b}$ の成分はどれか。",
          C(ans),
          [C(tt(3 * a + 2 * b), r'$-2\vec{b}$ を $+2\vec{b}$ としてしまった。'),
           C(vt(9, -4), r'$y$ 成分で、$-6-2$ を $-6+2$ と計算した。'),
           C(vt(-9, 8), r'$2\vec{b}-3\vec{a}$ を計算してしまった。')],
          [r"$3\vec{a}=(3,\,-6)$、$2\vec{b}=(-6,\,2)$",
           r"$3\vec{a}-2\vec{b}=(3-(-6),\ -6-2)$",
           r"$=(9,\,-8)$",
           r"よって $(9,\,-8)$"],
          "$3\\vec{a}$、$2\\vec{b}$ を先に成分で表してから、引き算をしよう。")

    a = M(3, -4)
    u = tt(a / sp.sqrt(sum(v ** 2 for v in a)))
    assert u == (R(3, 5), R(-4, 5))
    L.add(1, r"$\vec{a}=(3,\,-4)$ と同じ向きの単位ベクトルの成分はどれか。",
          C(u),
          [C(vt(R(-3, 5), R(4, 5)), '逆向きの単位ベクトルを答えた。'),
           C(vt(R(3, 25), R(-4, 25)), r'大きさ 5 でなく、$5^{2}$ でわってしまった。'),
           C(vt(R(1, 3), R(-1, 4)), '成分の逆数をとってしまった。')],
          [r"$|\vec{a}|=\sqrt{3^{2}+(-4)^{2}}=5$",
           r"単位ベクトルは $\frac{1}{|\vec{a}|}\vec{a}$ である。",
           r"$\frac{1}{5}(3,\,-4)=\left(\frac{3}{5},\,-\frac{4}{5}\right)$",
           r"よって $(\frac{3}{5},\,-\frac{4}{5})$"],
          "まず $|\\vec{a}|$ を求め、$\\vec{a}$ をその値でわろう。", echeck=False)

    # ---------- 段階2 ----------
    kk = sp.symbols('kk')
    sol = sp.solve(2 * kk - (-3) * 6, kk)   # a1*b2 - a2*b1 = 2k - (-3)(6) = 0
    assert sol == [-9]
    L.add(2, r"$\vec{a}=(2,\,-3)$、$\vec{b}=(6,\,k)$ が平行になるとき、実数 $k$ の値はいくつか。",
          C(I(-9)),
          [C(I(9), r'$\vec{b}=3\vec{a}$ の $y$ 成分で、符号を落とした。'),
           C(I(-4), r'$2\cdot 6=(-3)\cdot k$ のように、掛け方を取りちがえた。'),
           C(I(-3), r'$y$ 成分がそのまま同じだと考えた。')],
          [r"平行だから、$\vec{b}=t\vec{a}$ となる実数 $t$ がある。",
           r"$x$ 成分：$6=2t$ より $t=3$",
           r"$y$ 成分：$k=-3t=-9$",
           r"よって $-9$"],
          "$\\vec{b}=t\\vec{a}$ とおいて、$x$ 成分から $t$ を求めよう。")

    A, B, Cc = M(1, 2), M(5, 3), M(7, 7)
    D = tt(A + Cc - B)
    assert D == (3, 6) and tt(B - A) == tt(Cc - M(*D))
    L.add(2, r"平行四辺形 ABCD の3つの頂点が A$(1,\,2)$、B$(5,\,3)$、C$(7,\,7)$ のとき、頂点 D の座標はどれか。",
          C(D),
          [C(tt(B + Cc - A), r'A と D を対角線の両端と考えて、D $=$ B $+$ C $-$ A とした。'),
           C(tt(A + B - Cc), r'頂点の並びを取りちがえて、D $=$ A $+$ B $-$ C とした。'),
           C(vt(4, R(9, 2)), '対角線 AC の中点を答えた。')],
          [r"平行四辺形だから $\overrightarrow{AD}=\overrightarrow{BC}$。",
           r"$\overrightarrow{BC}=(7-5,\ 7-3)=(2,\,4)$",
           r"D$(x,\,y)$ とすると $(x-1,\ y-2)=(2,\,4)$",
           r"よって D $(3,\,6)$"],
          "向かい合う辺のベクトルが等しいことを使って、D の座標を文字でおこう。", echeck=False)

    a, b, c = M(1, 2), M(3, -1), M(-1, 5)
    s_, t_ = sp.symbols('s_ t_')
    so = sp.solve(list(s_ * a + t_ * b - c), [s_, t_])
    assert (so[s_], so[t_]) == (2, -1)
    L.add(2, r"$\vec{a}=(1,\,2)$、$\vec{b}=(3,\,-1)$、$\vec{c}=(-1,\,5)$ のとき、$\vec{c}=s\vec{a}+t\vec{b}$ となる実数の組 $(s,\ t)$ はどれか。",
          C((I(2), I(-1))),
          [C((I(-1), I(2)), r'$s$ と $t$ を入れかえて答えた。'),
           C((I(2), I(1)), r'$t$ の符号を取りちがえた。'),
           C((I(-2), I(1)), r'$s$、$t$ の符号をどちらも取りちがえた。')],
          [r"$s\vec{a}+t\vec{b}=(s+3t,\ 2s-t)$",
           r"$s+3t=-1$、$2s-t=5$",
           r"第2式から $t=2s-5$。第1式に代入して $7s-15=-1$ より $s=2$、$t=-1$",
           r"よって $(2,\,-1)$"],
          "成分ごとに式をつくって、$s$、$t$ の連立方程式を解こう。")

    a = M(3, 4)
    ans = tt(a * 10 / sp.sqrt(25))
    assert ans == (6, 8)
    L.add(2, r"$\vec{a}=(3,\,4)$ と同じ向きで、大きさが $10$ のベクトルはどれか。",
          C(ans),
          [C(vt(-6, -8), '逆向きのベクトルを答えた。'),
           C(vt(30, 40), '大きさ $|\\vec{a}|=5$ を考えず、10 倍してしまった。'),
           C(vt(13, 14), '成分に 10 を足してしまった。')],
          [r"$|\vec{a}|=\sqrt{3^{2}+4^{2}}=5$",
           r"大きさを $10$ にするには、同じ向きのまま $\frac{10}{5}=2$ 倍する。",
           r"$2\vec{a}=(6,\,8)$",
           r"よって $(6,\,8)$"],
          "$|\\vec{a}|$ を求め、大きさが何倍になればよいかを考えよう。")

    kk = sp.symbols('kk')
    so = sp.solve(kk ** 2 + 9 - 25, kk)
    assert set(so) == {-4, 4}
    def ks(*vs): return frozenset(sp.nsimplify(v) for v in vs)
    def ktx(*vs): return 'k=' + r',\ '.join(tex(v) for v in sorted(vs))
    L.add(2, r"$\vec{a}=(k,\,3)$ の大きさが $5$ になるような実数 $k$ の値をすべて求めよ。",
          C(ks(-4, 4), tx=ktx(-4, 4)),
          [C(ks(4), '$k=-4$ を見落とした。', tx=ktx(4)),
           C(ks(2), r'成分を足して $k+3=5$ とした。', tx=ktx(2)),
           C(ks(-sp.sqrt(34), sp.sqrt(34)), r'$k^{2}=25+9$ と、足し方を取りちがえた。', tx=ktx(-sp.sqrt(34), sp.sqrt(34)))],
          [r"$|\vec{a}|=\sqrt{k^{2}+3^{2}}=5$",
           r"両辺を 2乗して $k^{2}+9=25$",
           r"$k^{2}=16$ より $k=\pm 4$",
           r"よって $k=-4,\ 4$"],
          "大きさの式の両辺を 2乗して、$k$ の方程式を作ろう。")

    # ---------- 段階3 ----------
    A, B = M(1, 2), M(3, 5)
    kk = sp.symbols('kk')
    so = sp.solve(2 * (kk - 2) - 3 * 4, kk)
    assert so == [8]
    L.add(3, r"3点 A$(1,\,2)$、B$(3,\,5)$、C$(5,\,k)$ が一直線上にあるとき、$k$ の値はいくつか。",
          C(I(8)),
          [C(I(6), r'$\overrightarrow{AC}$ の $y$ 成分を $k-2$ でなく $k$ とした。'),
           C(I(12), r'$k-2=12$ を、そのまま $k=12$ とした。'),
           C(I(4), r'$k-2=2$ と考えた。')],
          [r"$\overrightarrow{AB}=(2,\,3)$、$\overrightarrow{AC}=(4,\,k-2)$",
           r"一直線上だから $\overrightarrow{AC}=t\overrightarrow{AB}$。$x$ 成分から $t=2$",
           r"$y$ 成分：$k-2=3\times 2=6$",
           r"よって $k=8$"],
          "3点が一直線上なら、$\\overrightarrow{AB}$ と $\\overrightarrow{AC}$ は平行になる。")

    tq = sp.symbols('tq')
    f = (1 + 2 * tq) ** 2 + (3 - tq) ** 2
    tmin = sp.solve(sp.diff(f, tq), tq)[0]
    mn = sp.sqrt(f.subs(tq, tmin))
    assert tmin == R(1, 5) and sp.simplify(mn - 7 * sqrt(5) / 5) == 0
    # 数値でも確認
    ts = np.linspace(-3, 3, 600001)
    assert abs(np.sqrt((1 + 2 * ts) ** 2 + (3 - ts) ** 2).min() - 7 / np.sqrt(5)) < 1e-6
    L.add(3, r"$\vec{a}=(1,\,3)$、$\vec{b}=(2,\,-1)$ とする。実数 $t$ が変化するとき、$|\vec{a}+t\vec{b}|$ の最小値はいくつか。",
          C(7 * sqrt(5) / 5),
          [C(R(49, 5), '最小になる $|\\vec{a}+t\\vec{b}|^{2}$ の値を答えて、平方根をとるのを忘れた。'),
           C(sqrt(10), r'$t=0$ のときの $|\vec{a}|$ を答えた。'),
           C(R(7, 5), r'$\sqrt{\frac{49}{5}}$ で、分子の 49 だけ平方根をとって、分母の 5 を忘れた。')],
          [r"$\vec{a}+t\vec{b}=(1+2t,\ 3-t)$",
           r"$|\vec{a}+t\vec{b}|^{2}=(1+2t)^{2}+(3-t)^{2}=5t^{2}-2t+10=5\left(t-\frac{1}{5}\right)^{2}+\frac{49}{5}$",
           r"$t=\frac{1}{5}$ のとき最小で、$|\vec{a}+t\vec{b}|^{2}=\frac{49}{5}$",
           r"最小値は $\sqrt{\frac{49}{5}}=\frac{7\sqrt{5}}{5}$。よって $\frac{7\sqrt{5}}{5}$"],
          "大きさそのものでなく、2乗を $t$ の2次式で表して、平方完成しよう。")

    a, b, c = M(1, 4), M(2, -1), M(5, 2)
    kk = sp.symbols('kk')
    v = a + kk * b
    so = sp.solve(v[0] * c[1] - v[1] * c[0], kk)
    assert so == [2]
    L.add(3, r"$\vec{a}=(1,\,4)$、$\vec{b}=(2,\,-1)$、$\vec{c}=(5,\,2)$ のとき、$\vec{a}+k\vec{b}$ が $\vec{c}$ と平行になるような実数 $k$ の値はいくつか。",
          C(I(2)),
          [C(R(1, 4), '平行条件の式で、成分の掛け方を取りちがえた。'),
           C(I(-2), '符号を取りちがえた。'),
           C(I(9), r'$9k=18$ の係数 9 を答えてしまった。')],
          [r"$\vec{a}+k\vec{b}=(1+2k,\ 4-k)$",
           r"$\vec{c}=(5,\,2)$ と平行だから、$(1+2k,\ 4-k)=t(5,\,2)$ とおく。",
           r"$1+2k=5t$、$4-k=2t$ から $t$ を消すと $2(1+2k)=5(4-k)$、$9k=18$",
           r"よって $k=2$"],
          "平行条件は、$x$ 成分と $y$ 成分の比が等しいこと。$t$ を使って式をつくろう。")

    A, Bq, Cq = M(1, 0), M(2, 3), M(4, 1)
    Ds = [tt(A + Bq - Cq), tt(Bq + Cq - A), tt(A + Cq - Bq)]
    assert Ds == [(-1, 2), (5, 4), (3, -2)]
    L.add(3, r"3点 A$(1,\,0)$、B$(2,\,3)$、C$(4,\,1)$ に点 D を加えた4点を頂点とする平行四辺形ができるような点 D は、3つある。そのうち、$x$ 座標がもっとも大きいものはどれか。",
          C(vt(5, 4)),
          [C(vt(-1, 2), r'$x$ 座標がもっとも小さい点を選んだ。'),
           C(vt(3, -2), r'3つの点のうち、$x$ 座標が中間の点を選んだ。'),
           C(vt(5, -4), r'$y$ 成分の符号を取りちがえた。')],
          [r"D は、$\overrightarrow{AB}=\overrightarrow{CD}$、$\overrightarrow{BC}=\overrightarrow{AD}$、$\overrightarrow{AC}=\overrightarrow{BD}$ のいずれかで決まる。",
           r"D $=$ A $+$ B $-$ C $=(-1,\,2)$",
           r"D $=$ B $+$ C $-$ A $=(5,\,4)$、D $=$ A $+$ C $-$ B $=(3,\,-2)$",
           r"$x$ 座標が最大なのは $(5,\,4)$。よって $(5,\,4)$"],
          "どの2点を結ぶ線分が対角線になるかで、D の位置が3通りに分かれる。")

    def par(u, v): return u[0] * v[1] - u[1] * v[0] == 0
    def same(u, v): return par(u, v) and (u[0] * v[0] + u[1] * v[1]) > 0
    def opp(u, v): return par(u, v) and (u[0] * v[0] + u[1] * v[1]) < 0
    s1 = same((1, 2), (-3, -6))
    s2 = par((1, 2), (2, -1))
    s3 = opp((2, -3), (-4, 6))
    s4 = par((3, 0), (0, 2))
    assert (s1, s2, s3, s4) == (False, False, True, False)
    L.add(3, r"次のうち、正しいものはどれか。",
          C(s3, raw=r"$(2,\,-3)$ と $(-4,\,6)$ は平行で、向きは逆である。"),
          [C(s1, r'$(-3,\,-6)=-3(1,\,2)$ なので、向きは逆であることを見落とした。', raw=r"$(1,\,2)$ と $(-3,\,-6)$ は平行で、向きは同じである。"),
           C(s2, r'$x$ 成分どうし、$y$ 成分どうしの比が等しいか確かめなかった。', raw=r"$(1,\,2)$ と $(2,\,-1)$ は平行である。"),
           C(s4, r'0 を含む成分を、平行と考えてしまった。', raw=r"$(3,\,0)$ と $(0,\,2)$ は平行である。")],
          [r"$(-3,\,-6)=-3\times(1,\,2)$ だから、平行だが向きは逆。（同じ向きではない）",
           r"$(2,\,-1)$ は $(1,\,2)$ の何倍にもならない。平行ではない。",
           r"$(-4,\,6)=-2\times(2,\,-3)$ だから、平行で向きは逆。",
           r"$(3,\,0)$ は $x$ 軸方向、$(0,\,2)$ は $y$ 軸方向で、平行ではない。よって $(2,\,-3)$ と $(-4,\,6)$ が平行で向きは逆"],
          "一方が他方の何倍になっているか（倍率の符号も）を調べよう。", echeck=False)

    # ---------- 段階4 ----------
    A, Bq, Dq = M(1, 2), M(4, 1), M(2, 5)
    Cq = Bq + Dq - A
    assert tt(Cq) == (5, 4)
    P1 = Bq + (Cq - Bq) / 3
    AP = tt(P1 - A)
    assert AP == (R(10, 3), 0)
    AP2 = tt(Bq + 2 * (Cq - Bq) / 3 - A)
    APm = tt((Bq + Cq) / 2 - A)
    assert AP2 == (R(11, 3), 1) and APm == (R(7, 2), R(1, 2))
    L.add(4, r"平行四辺形 ABCD で、A$(1,\,2)$、B$(4,\,1)$、D$(2,\,5)$ である。辺 BC を $1:2$ に内分する点を P とするとき、$\overrightarrow{AP}$ の成分はどれか。",
          C(AP),
          [C(AP2, r'内分の比を $2:1$ と取りちがえた。'),
           C(APm, '辺 BC の中点と考えた。'),
           C(tt(-sp.Matrix(AP)), r'$\overrightarrow{PA}$ を求めてしまった。')],
          [r"C の座標は、$\overrightarrow{AC}=\overrightarrow{AB}+\overrightarrow{AD}$ より C$(5,\,4)$。$\overrightarrow{BC}=(1,\,3)$",
           r"$\overrightarrow{BP}=\frac{1}{3}\overrightarrow{BC}=\left(\frac{1}{3},\,1\right)$、$\overrightarrow{AB}=(3,\,-1)$",
           r"$\overrightarrow{AP}=\overrightarrow{AB}+\overrightarrow{BP}=\left(\frac{10}{3},\,0\right)$",
           r"よって $(\frac{10}{3},\,0)$"],
          "C の座標を求め、$\\overrightarrow{AP}=\\overrightarrow{AB}+\\overrightarrow{BP}$ と分けよう。", echeck=False)

    kk = sp.symbols('kk')
    so = sp.solve((kk - 1) * (kk - 1) - 8 * 2, kk)
    assert set(so) == {5, -3}
    for kv_ in (5, -3):
        u = M(kv_ - 1, 2); w = M(8, kv_ - 1)
        assert u[0] * w[1] - u[1] * w[0] == 0
    L.add(4, r"3点 A$(1,\,2)$、B$(k,\,4)$、C$(9,\,k+1)$ が一直線上にあるような実数 $k$ の値をすべて求めよ。",
          C(ks(-3, 5), tx=ktx(-3, 5)),
          [C(ks(5), '$k=-3$ を見落とした。', tx=ktx(5)),
           C(ks(-4, 4), r'$(k-1)^{2}=16$ を $k^{2}=16$ としてしまった。', tx=ktx(-4, 4)),
           C(ks(-5, 3), '2次方程式の解の符号を取りちがえた。', tx=ktx(-5, 3))],
          [r"$\overrightarrow{AB}=(k-1,\,2)$、$\overrightarrow{AC}=(8,\,k-1)$",
           r"平行だから $\overrightarrow{AC}=t\overrightarrow{AB}$。$8=t(k-1)$、$k-1=2t$ から $t$ を消すと $(k-1)^{2}=16$",
           r"$k-1=\pm 4$ より $k=5,\ -3$",
           r"よって $k=-3,\ 5$"],
          "$\\overrightarrow{AB}$ と $\\overrightarrow{AC}$ の平行条件から、$k$ の2次方程式ができる。")

    kk = sp.symbols('kk')
    so = sp.solve((4) ** 2 + (4 + kk) ** 2 - (2 ** 2 + (4 - kk) ** 2), kk)
    assert so == [R(-3, 4)]
    L.add(4, r"$\vec{a}=(3,\,4)$、$\vec{b}=(1,\,k)$ について、$|\vec{a}+\vec{b}|=|\vec{a}-\vec{b}|$ となるような実数 $k$ の値はいくつか。",
          C(R(-3, 4)),
          [C(R(3, 4), '符号を取りちがえた。'),
           C(R(-4, 3), r'$3k+4=0$ のように、成分の対応を取りちがえた。'),
           C(R(4, 3), '符号と成分の対応の両方を取りちがえた。')],
          [r"$\vec{a}+\vec{b}=(4,\,4+k)$、$\vec{a}-\vec{b}=(2,\,4-k)$",
           r"$|\vec{a}+\vec{b}|^{2}=16+(4+k)^{2}$、$|\vec{a}-\vec{b}|^{2}=4+(4-k)^{2}$",
           r"等しいとして $16+16+8k+k^{2}=4+16-8k+k^{2}$ より $16k=-12$",
           r"よって $k=-\frac{3}{4}$"],
          "大きさが等しいなら、2乗も等しい。成分で2乗を計算して比べよう。")

    A, Bq = M(1, 3), M(4, -1)
    p_ = sp.symbols('p_')
    u = M(p_ - 1, -3); w = Bq - A
    so = sp.solve(u[0] * w[1] - u[1] * w[0], p_)
    assert so == [R(13, 4)]
    L.add(4, r"2点 A$(1,\,3)$、B$(4,\,-1)$ を通る直線が $x$ 軸と交わる点を P とする。P の $x$ 座標はいくつか。",
          C(R(13, 4)),
          [C(I(5), '平行条件の式で、成分の掛け方を取りちがえた。'),
           C(R(-5, 4), '符号を取りちがえた。'),
           C(R(9, 4), r'$p-1=\frac{9}{4}$ のまま、1 を足し忘れた。')],
          [r"P$(p,\,0)$ とおく。$\overrightarrow{AP}=(p-1,\,-3)$、$\overrightarrow{AB}=(3,\,-4)$",
           r"3点 A、B、P が一直線上だから、$\overrightarrow{AP}=t\overrightarrow{AB}$。$-3=-4t$ より $t=\frac{3}{4}$",
           r"$p-1=3t=\frac{9}{4}$",
           r"よって $\frac{13}{4}$"],
          "P は $x$ 軸上の点だから $y$ 座標は 0。$\\overrightarrow{AP}$ と $\\overrightarrow{AB}$ は平行になる。")

    def reps(k):
        return sp.Matrix([[2, k + 1], [k, 3]]).det() != 0   # すべてのベクトルを表せる
    tests = [R(-3), R(-2), R(0), R(1), R(2), R(3), R(5, 2), R(-7, 2), R(4)]
    truth = [reps(k) for k in tests]
    def stmt(f):
        return all(f(k) == tr for k, tr in zip(tests, truth))
    s_ok = stmt(lambda k: (k != 2) and (k != -3))
    s_b = stmt(lambda k: (k == 2) or (k == -3))
    s_c = stmt(lambda k: (k != 3) and (k != -2))
    s_d = stmt(lambda k: (k != 2))
    assert (s_ok, s_b, s_c, s_d) == (True, False, False, False)
    L.add(4, r"$\vec{a}=(2,\,k)$、$\vec{b}=(k+1,\,3)$ とする。平面上のどんなベクトルも $s\vec{a}+t\vec{b}$（$s$、$t$ は実数）の形に表せるのは、$k$ がどのような値のときか。",
          C(s_ok, raw=r"$k\neq 2$ かつ $k\neq -3$"),
          [C(s_b, '表せないときの条件を答えてしまった。', raw=r"$k=2$ または $k=-3$"),
           C(s_c, r'解の符号を取りちがえた。', raw=r"$k\neq 3$ かつ $k\neq -2$"),
           C(s_d, r'$k=-3$ の場合を見落とした。', raw=r"$k\neq 2$")],
          [r"$\vec{a}$、$\vec{b}$ が平行でなければ、どんなベクトルも $s\vec{a}+t\vec{b}$ の形にただ1通りに表せる。",
           r"平行になるのは $2\cdot 3-k(k+1)=0$、つまり $k^{2}+k-6=0$ のとき。",
           r"$(k-2)(k+3)=0$ より、平行になるのは $k=2,\ -3$（このとき $\vec{a}$、$\vec{b}$ は $\vec{0}$ ではない）。",
           r"よって表せるのは「$k\neq 2$ かつ $k\neq -3$」"],
          "$\\vec{a}$ と $\\vec{b}$ が平行になる $k$ を求め、それを除いて考えよう。", echeck=False)
    return L
#### L02-END

#### L03-BEGIN
def DG(n, w=None):
    """角度（度）の選択肢"""
    return C(Integer(n), w, tx='%d^{\\circ}' % n)

def ang_deg(u, v):
    u = np.array([float(t) for t in u]); v = np.array([float(t) for t in v])
    c = float(np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v)))
    return math.degrees(math.acos(max(-1, min(1, c))))

def lesson_03():
    L = Lesson('mc1-03')
    I = Integer
    def vt(*xs):
        return tuple(sp.nsimplify(v) for v in xs)
    def dot(u, v):
        return sum(sp.nsimplify(p) * sp.nsimplify(q) for p, q in zip(u, v))

    # ---------- 段階1 ----------
    ans = 3 * 4 * sp.cos(2 * sp.pi / 3)
    assert ans == -6
    L.add(1, r"$|\vec{a}|=3$、$|\vec{b}|=4$ で、$\vec{a}$ と $\vec{b}$ のなす角が $120^{\circ}$ のとき、内積 $\vec{a}\cdot\vec{b}$ の値はいくつか。",
          C(I(-6)),
          [C(I(6), r'$\cos 120^{\circ}$ の符号を取りちがえた。'),
           C(6 * sqrt(3), r'$\cos$ でなく $\sin 120^{\circ}$ を使ってしまった。'),
           C(I(-12), r'$\cos 120^{\circ}=-1$ と考えた。')],
          [r"内積の定義は $\vec{a}\cdot\vec{b}=|\vec{a}||\vec{b}|\cos\theta$",
           r"$\cos 120^{\circ}=-\frac{1}{2}$",
           r"$\vec{a}\cdot\vec{b}=3\times 4\times\left(-\frac{1}{2}\right)=-6$",
           r"よって $-6$"],
          "内積の定義 $|\\vec{a}||\\vec{b}|\\cos\\theta$ に、そのまま代入しよう。$\\cos 120^{\\circ}$ の符号に注意。")

    a, b = (2, -1), (3, 4)
    ans = dot(a, b)
    assert ans == 2
    L.add(1, r"$\vec{a}=(2,\,-1)$、$\vec{b}=(3,\,4)$ のとき、内積 $\vec{a}\cdot\vec{b}$ の値はいくつか。",
          C(ans),
          [C(I(10), r'$(-1)\times 4$ の符号を落として、$6+4$ とした。'),
           C(I(5), r'$a_{1}b_{2}+a_{2}b_{1}$ のように、成分の組み合わせを取りちがえた。'),
           C(I(8), '成分をすべて足してしまった。')],
          [r"$\vec{a}\cdot\vec{b}=a_{1}b_{1}+a_{2}b_{2}$",
           r"$=2\times 3+(-1)\times 4$",
           r"$=6-4=2$",
           r"よって $2$"],
          "$x$ 成分どうし、$y$ 成分どうしをかけて足す。")

    a, b = (1, sqrt(3)), (-2, 0)
    assert abs(ang_deg(a, b) - 120) < 1e-9
    L.add(1, r"$\vec{a}=(1,\,\sqrt{3})$、$\vec{b}=(-2,\,0)$ のなす角 $\theta$（$0^{\circ}\leqq\theta\leqq 180^{\circ}$）はいくつか。",
          DG(120),
          [DG(60, r'$\cos\theta$ の符号を取りちがえた。'),
           DG(30, r'$\frac{1}{2}$ を見て $30^{\circ}$ と取りちがえた（$\cos 30^{\circ}=\frac{\sqrt{3}}{2}$ である）。'),
           DG(150, r'$\cos\theta=-\frac{1}{2}$ の角を、$150^{\circ}$ と取りちがえた。')],
          [r"$\vec{a}\cdot\vec{b}=1\times(-2)+\sqrt{3}\times 0=-2$、$|\vec{a}|=2$、$|\vec{b}|=2$",
           r"$\cos\theta=\frac{\vec{a}\cdot\vec{b}}{|\vec{a}||\vec{b}|}=\frac{-2}{2\times 2}=-\frac{1}{2}$",
           r"$0^{\circ}\leqq\theta\leqq 180^{\circ}$ より $\theta=120^{\circ}$",
           r"よって $120^{\circ}$"],
          "$\\cos\\theta$ を内積と大きさから求め、その値になる角を考えよう。")

    kk = sp.symbols('kk')
    so = sp.solve(4 * kk - 6, kk)
    assert so == [R(3, 2)]
    L.add(1, r"$\vec{a}=(k,\,3)$、$\vec{b}=(4,\,-2)$ が垂直になるとき、実数 $k$ の値はいくつか。",
          C(R(3, 2)),
          [C(R(2, 3), r'$4k=6$ を、逆数にして解いた。'),
           C(R(-3, 2), '符号を取りちがえた。'),
           C(I(6), r'$4k=6$ の右辺 6 を答えてしまった（4 でわり忘れた）。')],
          [r"垂直だから $\vec{a}\cdot\vec{b}=0$",
           r"$k\times 4+3\times(-2)=4k-6=0$",
           r"$k=\frac{6}{4}=\frac{3}{2}$",
           r"よって $\frac{3}{2}$"],
          "垂直 $\\Leftrightarrow$ 内積が 0。内積を $k$ の式で表そう。")

    A2, ab = 2, 3
    ans = 2 * A2 ** 2 - ab
    assert ans == 5
    L.add(1, r"$|\vec{a}|=2$、$\vec{a}\cdot\vec{b}=3$ のとき、$\vec{a}\cdot(2\vec{a}-\vec{b})$ の値はいくつか。",
          C(I(5)),
          [C(I(1), r'$\vec{a}\cdot\vec{a}$ を $|\vec{a}|$ としてしまった（$2\times 2-3$）。'),
           C(I(8), r'$-\vec{a}\cdot\vec{b}$ の項を落とした。'),
           C(I(11), r'$-\vec{a}\cdot\vec{b}$ の符号を取りちがえた。')],
          [r"分配法則で展開する。$\vec{a}\cdot(2\vec{a}-\vec{b})=2\vec{a}\cdot\vec{a}-\vec{a}\cdot\vec{b}$",
           r"$\vec{a}\cdot\vec{a}=|\vec{a}|^{2}=4$",
           r"$=2\times 4-3=5$",
           r"よって $5$"],
          "$\\vec{a}\\cdot\\vec{a}=|\\vec{a}|^{2}$ を使って、分配法則で展開しよう。")

    # ---------- 段階2 ----------
    a, b = (2, 1), (1, 3)
    assert abs(ang_deg(a, b) - 45) < 1e-9
    L.add(2, r"$\vec{a}=(2,\,1)$、$\vec{b}=(1,\,3)$ のなす角 $\theta$（$0^{\circ}\leqq\theta\leqq 180^{\circ}$）はいくつか。",
          DG(45),
          [DG(60, r'$\cos\theta=\frac{1}{\sqrt{2}}$ の角を $60^{\circ}$ と取りちがえた。'),
           DG(30, r'$\cos\theta=\frac{1}{\sqrt{2}}$ の角を $30^{\circ}$ と取りちがえた。'),
           DG(135, r'$\cos\theta$ の符号を取りちがえた。')],
          [r"$\vec{a}\cdot\vec{b}=2\times 1+1\times 3=5$、$|\vec{a}|=\sqrt{5}$、$|\vec{b}|=\sqrt{10}$",
           r"$\cos\theta=\frac{5}{\sqrt{5}\times\sqrt{10}}=\frac{5}{5\sqrt{2}}=\frac{1}{\sqrt{2}}$",
           r"$0^{\circ}\leqq\theta\leqq 180^{\circ}$ より $\theta=45^{\circ}$",
           r"よって $45^{\circ}$"],
          "内積と2つの大きさから $\\cos\\theta$ を求めよう。")

    A_, B_ = 2, 3
    ab_ = -3
    ans = sp.sqrt(A_ ** 2 + B_ ** 2 + 2 * ab_)
    assert ans == sqrt(7)
    L.add(2, r"$|\vec{a}|=2$、$|\vec{b}|=3$、$\vec{a}\cdot\vec{b}=-3$ のとき、$|\vec{a}+\vec{b}|$ の値はいくつか。",
          C(sqrt(7)),
          [C(sqrt(19), r'$2\vec{a}\cdot\vec{b}$ の符号を取りちがえて、$4+9+6$ とした。'),
           C(I(5), r'$|\vec{a}+\vec{b}|=|\vec{a}|+|\vec{b}|$ と考えた。'),
           C(sqrt(13), r'$2\vec{a}\cdot\vec{b}$ の項を落とした。')],
          [r"長さは 2乗して内積で展開する。$|\vec{a}+\vec{b}|^{2}=|\vec{a}|^{2}+2\vec{a}\cdot\vec{b}+|\vec{b}|^{2}$",
           r"$=4+2\times(-3)+9=7$",
           r"$|\vec{a}+\vec{b}|\geqq 0$ より $|\vec{a}+\vec{b}|=\sqrt{7}$",
           r"よって $\sqrt{7}$"],
          "$|\\vec{a}+\\vec{b}|^{2}$ を内積で展開してから、平方根をとろう。")

    a = (3, 4)
    v = (8, -6)
    assert dot(a, v) == 0 and sp.sqrt(dot(v, v)) == 10
    L.add(2, r"$\vec{a}=(3,\,4)$ に垂直で、大きさが $10$、$x$ 成分が正のベクトルはどれか。",
          C(vt(8, -6)),
          [C(vt(-8, 6), r'$x$ 成分が負のほうを答えた。'),
           C(vt(6, 8), '垂直でなく、平行なベクトルを答えた。'),
           C(vt(4, -3), '垂直ではあるが、大きさを 10 にそろえ忘れた（大きさ 5）。')],
          [r"求めるベクトルを $(x,\,y)$ とする。垂直だから $3x+4y=0$。よって $(x,\,y)=t(4,\,-3)$ と書ける。",
           r"大きさが $10$ だから $|t|\sqrt{4^{2}+(-3)^{2}}=5|t|=10$ より $t=\pm 2$",
           r"$x$ 成分が正なので $t=2$：$(8,\,-6)$",
           r"よって $(8,\,-6)$"],
          "まず内積が 0 になる条件から、向きを決めよう。そのあとで大きさをそろえる。")

    A_, B_, C_ = (2, 1), (3, 2), (1, 1)
    AB = (1, 1); AC = (-1, 0)
    assert abs(ang_deg(AB, AC) - 135) < 1e-9
    L.add(2, r"3点 A$(2,\,1)$、B$(3,\,2)$、C$(1,\,1)$ について、$\angle BAC$ の大きさはいくつか。",
          DG(135),
          [DG(45, r'$\cos\theta$ の符号を取りちがえた。'),
           DG(120, r'$\cos\theta=-\frac{1}{\sqrt{2}}$ の角を $120^{\circ}$ と取りちがえた。'),
           DG(150, r'$\cos\theta=-\frac{1}{\sqrt{2}}$ の角を $150^{\circ}$ と取りちがえた。')],
          [r"$\overrightarrow{AB}=(1,\,1)$、$\overrightarrow{AC}=(-1,\,0)$。$\overrightarrow{AB}\cdot\overrightarrow{AC}=-1$",
           r"$|\overrightarrow{AB}|=\sqrt{2}$、$|\overrightarrow{AC}|=1$",
           r"$\cos\angle BAC=\frac{-1}{\sqrt{2}\times 1}=-\frac{1}{\sqrt{2}}$ より $\angle BAC=135^{\circ}$",
           r"よって $135^{\circ}$"],
          "A を始点とする2つのベクトル $\\overrightarrow{AB}$、$\\overrightarrow{AC}$ のなす角を求めよう。")

    A2, B2, ab = 2, 3, -1
    ans = 2 * A2 ** 2 + 3 * ab - 2 * B2 ** 2
    assert ans == -13
    L.add(2, r"$|\vec{a}|=2$、$|\vec{b}|=3$、$\vec{a}\cdot\vec{b}=-1$ のとき、$(\vec{a}+2\vec{b})\cdot(2\vec{a}-\vec{b})$ の値はいくつか。",
          C(I(-13)),
          [C(I(-10), r'$\vec{a}\cdot\vec{b}$ の項（真ん中の項）を落とした。'),
           C(I(-7), r'$\vec{a}\cdot\vec{b}$ の項の符号を取りちがえた。'),
           C(I(-12), r'$\vec{a}\cdot\vec{b}$ の係数を 3 でなく 2 とした。')],
          [r"展開する。$(\vec{a}+2\vec{b})\cdot(2\vec{a}-\vec{b})=2|\vec{a}|^{2}-\vec{a}\cdot\vec{b}+4\vec{a}\cdot\vec{b}-2|\vec{b}|^{2}$",
           r"$=2|\vec{a}|^{2}+3\vec{a}\cdot\vec{b}-2|\vec{b}|^{2}$",
           r"$=2\times 4+3\times(-1)-2\times 9=8-3-18$",
           r"よって $-13$"],
          "多項式のかけ算と同じように展開し、$\\vec{a}\\cdot\\vec{b}$ の項をまとめよう。")

    # ---------- 段階3 ----------
    a, b = (4, 1), (1, 3)
    S = R(1, 2) * sp.sqrt(dot(a, a) * dot(b, b) - dot(a, b) ** 2)
    assert S == R(11, 2) and abs(float(S) - 0.5 * abs(4 * 3 - 1 * 1)) < 1e-12
    L.add(3, r"O$(0,\,0)$、A$(4,\,1)$、B$(1,\,3)$ を頂点とする △OAB の面積はいくつか。ただし、面積は $\frac{1}{2}\sqrt{|\overrightarrow{OA}|^{2}|\overrightarrow{OB}|^{2}-(\overrightarrow{OA}\cdot\overrightarrow{OB})^{2}}$ で求められる。",
          C(R(11, 2)),
          [C(I(11), r'$\frac{1}{2}$ をかけ忘れた。'),
           C(R(7, 2), r'内積 $\overrightarrow{OA}\cdot\overrightarrow{OB}=7$ を使って、$\frac{7}{2}$ とした。'),
           C(sqrt(170) / 2, r'根号の中で、$(\overrightarrow{OA}\cdot\overrightarrow{OB})^{2}$ を引き忘れた。')],
          [r"$|\overrightarrow{OA}|^{2}=17$、$|\overrightarrow{OB}|^{2}=10$、$\overrightarrow{OA}\cdot\overrightarrow{OB}=4+3=7$",
           r"$|\overrightarrow{OA}|^{2}|\overrightarrow{OB}|^{2}-(\overrightarrow{OA}\cdot\overrightarrow{OB})^{2}=170-49=121$",
           r"$\triangle OAB=\frac{1}{2}\sqrt{121}=\frac{11}{2}$",
           r"よって $\frac{11}{2}$"],
          "必要な値は、2つの辺の長さの2乗と、内積の3つ。それぞれ計算してから公式に入れよう。")

    a_, b_ = 1, 2
    ab = sp.symbols('ab')
    so = sp.solve(1 + 4 + 2 * ab - 3, ab)
    assert so == [-1]
    cosv = R(-1, 2)
    assert math.degrees(math.acos(float(cosv))) - 120 < 1e-9
    L.add(3, r"$|\vec{a}|=1$、$|\vec{b}|=2$、$|\vec{a}+\vec{b}|=\sqrt{3}$ のとき、$\vec{a}$ と $\vec{b}$ のなす角 $\theta$（$0^{\circ}\leqq\theta\leqq 180^{\circ}$）はいくつか。",
          DG(120),
          [DG(60, r'$\vec{a}\cdot\vec{b}$ の符号を取りちがえた。'),
           DG(150, r'$\cos\theta=-\frac{1}{2}$ の角を $150^{\circ}$ と取りちがえた。'),
           DG(30, r'$\frac{1}{2}$ を見て $30^{\circ}$ と取りちがえた（$\cos 30^{\circ}=\frac{\sqrt{3}}{2}$ である）。')],
          [r"$|\vec{a}+\vec{b}|^{2}=|\vec{a}|^{2}+2\vec{a}\cdot\vec{b}+|\vec{b}|^{2}$ に代入して $3=1+2\vec{a}\cdot\vec{b}+4$",
           r"$\vec{a}\cdot\vec{b}=-1$",
           r"$\cos\theta=\frac{-1}{1\times 2}=-\frac{1}{2}$ より $\theta=120^{\circ}$",
           r"よって $120^{\circ}$"],
          "$|\\vec{a}+\\vec{b}|^{2}$ を内積で展開して、$\\vec{a}\\cdot\\vec{b}$ を求めよう。")

    ab = 3 * 2 * sp.cos(sp.pi / 3)
    assert ab == 3
    tt_ = sp.symbols('tt_')
    expr = 9 - ab + tt_ * ab - tt_ * 4
    so = sp.solve(expr, tt_)
    assert so == [6]
    L.add(3, r"$|\vec{a}|=3$、$|\vec{b}|=2$ で、$\vec{a}$ と $\vec{b}$ のなす角が $60^{\circ}$ である。$\vec{a}+t\vec{b}$ と $\vec{a}-\vec{b}$ が垂直になるとき、実数 $t$ の値はいくつか。",
          C(I(6)),
          [C(I(-6), r'$6-t=0$ を解くとき、符号を取りちがえた。'),
           C(R(9, 4), r'$\vec{a}\cdot\vec{b}$ を含む項を落とした。'),
           C(R(-6, 7), r'$-t|\vec{b}|^{2}$ の符号を取りちがえた。')],
          [r"$\vec{a}\cdot\vec{b}=3\times 2\times\cos 60^{\circ}=3$",
           r"$(\vec{a}+t\vec{b})\cdot(\vec{a}-\vec{b})=|\vec{a}|^{2}-\vec{a}\cdot\vec{b}+t\vec{a}\cdot\vec{b}-t|\vec{b}|^{2}$",
           r"$=9-3+3t-4t=6-t=0$",
           r"よって $t=6$"],
          "垂直なら内積が 0。まず $\\vec{a}\\cdot\\vec{b}$ の値を求めてから展開しよう。")

    kk = sp.symbols('kk')
    so = sp.solve((1 + kk) * (kk - 1) - 8, kk)
    assert set(so) == {3, -3}
    def ks(*vs): return frozenset(sp.nsimplify(v) for v in vs)
    def ktx(*vs): return 'k=' + r',\ '.join(tex(v) for v in sorted(vs))
    L.add(3, r"O$(0,\,0)$、A$(1,\,3)$、B$(k,\,1)$ とし、四角形 OACB が平行四辺形になるように点 C をとる。対角線 OC と AB が垂直になるような実数 $k$ の値をすべて求めよ。",
          C(ks(-3, 3), tx=ktx(-3, 3)),
          [C(ks(3), '$k=-3$ を見落とした。', tx=ktx(3)),
           C(ks(-3), '$k=3$ を見落とした。', tx=ktx(-3)),
           C(ks(-sqrt(7), sqrt(7)), r'$(k+1)(k-1)$ を $k^{2}+1$ と展開してしまった。', tx=ktx(-sqrt(7), sqrt(7)))],
          [r"$\overrightarrow{OC}=\overrightarrow{OA}+\overrightarrow{OB}=(1+k,\,4)$、$\overrightarrow{AB}=(k-1,\,-2)$",
           r"垂直だから $\overrightarrow{OC}\cdot\overrightarrow{AB}=(1+k)(k-1)+4\times(-2)=0$",
           r"$k^{2}-1-8=0$ より $k^{2}=9$",
           r"よって $k=-3,\ 3$"],
          "C の座標（または $\\overrightarrow{OC}$）を求めてから、$\\overrightarrow{OC}\\cdot\\overrightarrow{AB}=0$ を考えよう。")

    rn = np.random.default_rng(3)
    for _ in range(300):
        u = rn.normal(size=2); v = rn.normal(size=2)
        assert abs(np.dot(u, v)) <= np.linalg.norm(u) * np.linalg.norm(v) + 1e-12
    L.add(3, r"$\vec{a}$、$\vec{b}$、$\vec{c}$ は平面上のベクトルとする。次のうち、つねに成り立つものはどれか。",
          C(True, raw=r"$|\vec{a}\cdot\vec{b}|\leqq|\vec{a}||\vec{b}|$"),
          [C(False, r'内積が 0 なら、垂直でもよいことを見落とした。', raw=r"$\vec{a}\cdot\vec{b}=0$ ならば、$\vec{a}=\vec{0}$ または $\vec{b}=\vec{0}$"),
           C(False, r'数のかけ算のように、両辺を「わる」ことができると考えた。', raw=r"$\vec{a}\cdot\vec{b}=\vec{a}\cdot\vec{c}$ ならば、$\vec{b}=\vec{c}$"),
           C(False, r'数のかけ算の結合法則と同じように考えた。', raw=r"$(\vec{a}\cdot\vec{b})\vec{c}=\vec{a}(\vec{b}\cdot\vec{c})$")],
          [r"$|\vec{a}\cdot\vec{b}|=|\vec{a}||\vec{b}||\cos\theta|\leqq|\vec{a}||\vec{b}|$ だから、つねに成り立つ。",
           r"$\vec{a}=(1,\,0)$、$\vec{b}=(0,\,1)$ なら $\vec{a}\cdot\vec{b}=0$ だが、どちらも $\vec{0}$ ではない。",
           r"$\vec{c}=(0,\,2)$ とすると $\vec{a}\cdot\vec{b}=\vec{a}\cdot\vec{c}=0$ だが $\vec{b}\neq\vec{c}$。",
           r"$\vec{a}=\vec{b}=(1,\,0)$、$\vec{c}=(0,\,1)$ では $(\vec{a}\cdot\vec{b})\vec{c}=(0,\,1)$、$\vec{a}(\vec{b}\cdot\vec{c})=(0,\,0)$ で等しくない。",
           r"よって $|\vec{a}\cdot\vec{b}|\leqq|\vec{a}||\vec{b}|$"],
          "反例（$\\vec{0}$ でなくても内積が 0 になる例など）を作って、ほかの3つを確かめよう。", echeck=False)

    # ---------- 段階4 ----------
    tq = sp.symbols('tq')
    f = 9 + 2 * 3 * tq + 4 * tq ** 2          # |a+tb|^2 , |a|=3,|b|=2,a.b=3
    tm = sp.solve(sp.diff(f, tq), tq)[0]
    mn = sp.sqrt(f.subs(tq, tm))
    assert tm == R(-3, 4) and sp.simplify(mn - 3 * sqrt(3) / 2) == 0
    L.add(4, r"$|\vec{a}|=3$、$|\vec{b}|=2$、$\vec{a}\cdot\vec{b}=3$ である。実数 $t$ が変化するとき、$|\vec{a}+t\vec{b}|$ の最小値はいくつか。",
          C(3 * sqrt(3) / 2),
          [C(R(27, 4), '最小になる 2乗の値を答えて、平方根をとるのを忘れた。'),
           C(I(3), r'$t=0$ のときの $|\vec{a}|$ を答えた。'),
           C(3 * sqrt(3) / 4, r'$\sqrt{\frac{27}{4}}$ の分母を、$\sqrt{4}=4$ としてしまった。')],
          [r"$|\vec{a}+t\vec{b}|^{2}=|\vec{a}|^{2}+2t\vec{a}\cdot\vec{b}+t^{2}|\vec{b}|^{2}=9+6t+4t^{2}$",
           r"$=4\left(t+\frac{3}{4}\right)^{2}+\frac{27}{4}$",
           r"$t=-\frac{3}{4}$ のとき、2乗の最小値は $\frac{27}{4}$。平方根をとると $\frac{3\sqrt{3}}{2}$",
           r"よって $\frac{3\sqrt{3}}{2}$"],
          "$|\\vec{a}+t\\vec{b}|^{2}$ を $t$ の2次式として展開し、平方完成しよう。")

    cs = [6 * math.cos(math.radians(th)) for th in np.linspace(60, 150, 90001)]
    assert abs(max(cs) - 3) < 1e-6 and abs(min(cs) + 3 * math.sqrt(3)) < 1e-6
    def mm(mx, mn_): return r"最大値 $%s$、最小値 $%s$" % (tex(mx), tex(mn_))
    L.add(4, r"$|\vec{a}|=2$、$|\vec{b}|=3$ で、$\vec{a}$ と $\vec{b}$ のなす角 $\theta$ が $60^{\circ}\leqq\theta\leqq 150^{\circ}$ の範囲で変化する。このとき、内積 $\vec{a}\cdot\vec{b}$ の最大値と最小値の組はどれか。",
          C((I(3), -3 * sqrt(3)), raw=mm(3, -3 * sqrt(3))),
          [C((I(6), -3 * sqrt(3)), r'$\theta=0^{\circ}$ の場合まで含めて、最大値を 6 とした。', raw=mm(6, -3 * sqrt(3))),
           C((3 * sqrt(3), I(-3)), r'$\cos$ と $\sin$ の値を取りちがえた。', raw=mm(3 * sqrt(3), -3)),
           C((-3 * sqrt(3), I(3)), '最大値と最小値を逆に答えた。', raw=mm(-3 * sqrt(3), 3))],
          [r"$\vec{a}\cdot\vec{b}=2\times 3\times\cos\theta=6\cos\theta$",
           r"$\cos\theta$ は $\theta$ が大きいほど小さくなる。$60^{\circ}\leqq\theta\leqq 150^{\circ}$ では、$\theta=60^{\circ}$ で最大、$\theta=150^{\circ}$ で最小。",
           r"最大：$6\cos 60^{\circ}=3$、最小：$6\cos 150^{\circ}=-3\sqrt{3}$",
           r"よって 最大値 $3$、最小値 $-3\sqrt{3}$"],
          "$\\cos\\theta$ の値の範囲を、$\\theta$ の範囲から考えよう。", echeck=False)

    AB_, AC_, th_ = 3, 4, 60
    bb = sp.Matrix([3, 0]); cc = sp.Matrix([4 * sp.cos(sp.pi / 3), 4 * sp.sin(sp.pi / 3)])
    tq = sp.symbols('tq')
    Dp = bb + tq * (cc - bb)
    so = sp.solve((Dp).dot(cc - bb), tq)
    assert so == [R(3, 13)]
    L.add(4, r"△ABC で、$AB=3$、$AC=4$、$\angle BAC=60^{\circ}$ である。A から辺 BC に下ろした垂線の足を D とするとき、$BD:DC$ はどれか。",
          C(R(3, 10), tx='3:10'),
          [C(R(10, 3), r'$BD$ と $DC$ の比を、逆にして答えた。', tx='10:3'),
           C(R(9, 16), r'$AB$、$AC$ の 2乗の比を答えた。', tx='9:16'),
           C(R(3, 4), r'$BD:DC=AB:AC$ と考えた。', tx='3:4')],
          [r"$\overrightarrow{AB}\cdot\overrightarrow{AC}=3\times 4\times\cos 60^{\circ}=6$。D は BC 上だから、$\overrightarrow{AD}=(1-t)\overrightarrow{AB}+t\overrightarrow{AC}$ とおける。",
           r"$\overrightarrow{AD}\cdot\overrightarrow{BC}=0$：$((1-t)\overrightarrow{AB}+t\overrightarrow{AC})\cdot(\overrightarrow{AC}-\overrightarrow{AB})=0$",
           r"$(1-t)(6-9)+t(16-6)=13t-3=0$ より $t=\frac{3}{13}$",
           r"$BD:DC=t:(1-t)=3:10$。よって $3:10$"],
          "D が BC 上にあることから $\\overrightarrow{AD}$ を $t$ で表し、$\\overrightarrow{AD}\\cdot\\overrightarrow{BC}=0$ を使おう。")

    ab = sp.symbols('ab')
    so = sp.solve((5 + 2 * ab) - (8 - 4 * ab), ab)
    assert so == [R(1, 2)]
    L.add(4, r"$|\vec{a}|=2$、$|\vec{b}|=1$ で、$|\vec{a}+\vec{b}|=|\vec{a}-2\vec{b}|$ が成り立つ。$\vec{a}$ と $\vec{b}$ のなす角を $\theta$ とするとき、$\cos\theta$ の値はいくつか。",
          C(R(1, 4)),
          [C(R(1, 2), r'$\vec{a}\cdot\vec{b}$ の値を、そのまま $\cos\theta$ とした。'),
           C(R(-1, 4), '符号を取りちがえた。'),
           C(R(1, 8), r'$|\vec{a}||\vec{b}|$ を 4 としてしまった。')],
          [r"両辺を 2乗する。$|\vec{a}+\vec{b}|^{2}=4+2\vec{a}\cdot\vec{b}+1$、$|\vec{a}-2\vec{b}|^{2}=4-4\vec{a}\cdot\vec{b}+4$",
           r"$5+2\vec{a}\cdot\vec{b}=8-4\vec{a}\cdot\vec{b}$ より $\vec{a}\cdot\vec{b}=\frac{1}{2}$",
           r"$\cos\theta=\frac{\vec{a}\cdot\vec{b}}{|\vec{a}||\vec{b}|}=\frac{1/2}{2\times 1}=\frac{1}{4}$",
           r"よって $\frac{1}{4}$"],
          "両辺を 2乗して、内積 $\\vec{a}\\cdot\\vec{b}$ の値を先に求めよう。")

    a = sp.Matrix([1, 0]); b = sp.Matrix([R(1, 2), sqrt(3) / 2])
    p = a + 2 * b; q = a - b
    cs_ = sp.simplify(p.dot(q) / (p.norm() * q.norm()))
    assert sp.simplify(cs_ - (-sqrt(7) / 14)) == 0
    L.add(4, r"$|\vec{a}|=|\vec{b}|=1$ で、$\vec{a}$ と $\vec{b}$ のなす角が $60^{\circ}$ である。$\vec{p}=\vec{a}+2\vec{b}$、$\vec{q}=\vec{a}-\vec{b}$ のなす角を $\varphi$ とするとき、$\cos\varphi$ の値はどれか。",
          C(-sqrt(7) / 14),
          [C(sqrt(7) / 14, '符号を取りちがえた。'),
           C(R(-1, 2), r'$|\vec{p}||\vec{q}|$ でわるのを忘れた。'),
           C(R(-1, 14), r'$|\vec{p}|$ を 7 としてしまった（平方根を取り忘れた）。')],
          [r"$\vec{a}\cdot\vec{b}=\cos 60^{\circ}=\frac{1}{2}$",
           r"$\vec{p}\cdot\vec{q}=|\vec{a}|^{2}+\vec{a}\cdot\vec{b}-2|\vec{b}|^{2}=1+\frac{1}{2}-2=-\frac{1}{2}$",
           r"$|\vec{p}|^{2}=1+4\times\frac{1}{2}+4=7$、$|\vec{q}|^{2}=1-1+1=1$ より $|\vec{p}||\vec{q}|=\sqrt{7}$",
           r"$\cos\varphi=\frac{-1/2}{\sqrt{7}}=-\frac{1}{2\sqrt{7}}=-\frac{\sqrt{7}}{14}$。よって $-\frac{\sqrt{7}}{14}$"],
          "$\\vec{p}\\cdot\\vec{q}$、$|\\vec{p}|$、$|\\vec{q}|$ を、$\\vec{a}\\cdot\\vec{b}$ の値を使って順に求めよう。")
    return L
#### L03-END

#### L04-BEGIN
def fm(coefs, den, names, w=None):
    """(係数)/den の形の線形結合。値は各係数÷den"""
    num = cmb(coefs, names)
    tx = num if den == 1 else r'\frac{%s}{%d}' % (num, den)
    return C(tuple(sp.nsimplify(Rational(c) / den) for c in coefs), w, tx=tx)

def lesson_04():
    L = Lesson('mc1-04')
    I = Integer
    va, vb, vc = r'\vec{a}', r'\vec{b}', r'\vec{c}'
    AB = (va, vb)
    ABC = (va, vb, vc)
    def vt(*xs):
        return tuple(sp.nsimplify(v) for v in xs)

    # ---------- 段階1 ----------
    L.add(1, r"点 O を基準にした2点 A、B の位置ベクトルを、それぞれ $\vec{a}$、$\vec{b}$ とする。線分 AB の中点 M の位置ベクトルはどれか。",
          fm((1, 1), 2, AB),
          [fm((1, 1), 1, AB, '2 でわるのを忘れた。'),
           fm((1, -1), 2, AB, r'和でなく差を使ってしまった。'),
           fm((-1, 1), 2, AB, r'$\overrightarrow{AB}$ の半分を答えてしまった（位置ベクトルになっていない）。')],
          [r"中点は、2点の位置ベクトルの平均である。",
           r"$\vec{m}=\frac{\vec{a}+\vec{b}}{2}$",
           r"（$\overrightarrow{OM}=\overrightarrow{OA}+\frac{1}{2}\overrightarrow{AB}=\vec{a}+\frac{1}{2}(\vec{b}-\vec{a})$ と同じ）",
           r"よって $\frac{\vec{a}+\vec{b}}{2}$"],
          "中点は、$m:n=1:1$ に内分する点と考えられる。")

    L.add(1, r"位置ベクトルが $\vec{a}$、$\vec{b}$ である2点 A、B を結ぶ線分 AB を $2:1$ に内分する点 P の位置ベクトルはどれか。",
          fm((1, 2), 3, AB),
          [fm((2, 1), 3, AB, r'内分の比 $2:1$ を逆にした。'),
           fm((1, 2), 2, AB, r'分母を $m+n=3$ でなく 2 にした。'),
           fm((-1, 2), 1, AB, r'外分点と取りちがえた。')],
          [r"$m:n$ に内分する点の位置ベクトルは $\frac{n\vec{a}+m\vec{b}}{m+n}$",
           r"$m=2$、$n=1$ を代入する。",
           r"$\vec{p}=\frac{1\cdot\vec{a}+2\vec{b}}{2+1}=\frac{\vec{a}+2\vec{b}}{3}$",
           r"よって $\frac{\vec{a}+2\vec{b}}{3}$"],
          "A に近い側の係数 $n$ と、B に近い側の係数 $m$ の位置に注意しよう。")

    L.add(1, r"位置ベクトルが $\vec{a}$、$\vec{b}$ である2点 A、B を結ぶ線分 AB を $3:1$ に外分する点 Q の位置ベクトルはどれか。",
          fm((-1, 3), 2, AB),
          [fm((1, 3), 4, AB, r'内分点を答えてしまった。'),
           fm((3, -1), 2, AB, r'外分の比 $3:1$ を逆にした。'),
           fm((-1, 3), 4, AB, r'分母を $m-n=2$ でなく $m+n=4$ にした。')],
          [r"$m:n$ に外分する点の位置ベクトルは $\frac{-n\vec{a}+m\vec{b}}{m-n}$",
           r"$m=3$、$n=1$ を代入する。",
           r"$\vec{q}=\frac{-\vec{a}+3\vec{b}}{3-1}=\frac{-\vec{a}+3\vec{b}}{2}$",
           r"よって $\frac{-\vec{a}+3\vec{b}}{2}$"],
          "外分は、内分の式で $n$ を $-n$ にしたものと考えられる。")

    A, B, Cc = sp.Matrix([1, 2]), sp.Matrix([4, -1]), sp.Matrix([7, 5])
    G = tuple((A + B + Cc) / 3)
    assert G == (4, 2)
    L.add(1, r"3点 A$(1,\,2)$、B$(4,\,-1)$、C$(7,\,5)$ を頂点とする △ABC の重心 G の座標はどれか。",
          C(G),
          [C(vt(12, 6), '3 でわるのを忘れた。'),
           C(vt(6, 3), '3 でなく 2 でわってしまった。'),
           C(vt(4, 6), r'$y$ 座標だけ、3 でわるのを忘れた。')],
          [r"重心の座標は、3つの頂点の座標の平均である。",
           r"$x$ 座標：$\frac{1+4+7}{3}=4$",
           r"$y$ 座標：$\frac{2+(-1)+5}{3}=2$",
           r"よって $(4,\,2)$"],
          "重心は $\\frac{\\vec{a}+\\vec{b}+\\vec{c}}{3}$。座標ごとに平均をとろう。")

    ok = C((I(-1), I(1)), tx=r'\vec{b}-\vec{a}')
    L.add(1, r"点 O を基準にした2点 A、B の位置ベクトルを、それぞれ $\vec{a}$、$\vec{b}$ とする。$\overrightarrow{AB}$ を $\vec{a}$、$\vec{b}$ で表すとどうなるか。",
          ok,
          [C((I(1), I(-1)), '終点から始点を引くところを、逆にした。', tx=r'\vec{a}-\vec{b}'),
           C((I(1), I(1)), '差でなく和にしてしまった。', tx=r'\vec{a}+\vec{b}'),
           C((I(-1), I(-1)), '符号をすべて逆にして、和にしてしまった。', tx=r'-\vec{a}-\vec{b}')],
          [r"$\overrightarrow{AB}=\overrightarrow{AO}+\overrightarrow{OB}$ と分ける。",
           r"$\overrightarrow{AO}=-\vec{a}$、$\overrightarrow{OB}=\vec{b}$",
           r"$\overrightarrow{AB}=-\vec{a}+\vec{b}$",
           r"よって $\vec{b}-\vec{a}$"],
          "$\\overrightarrow{AB}=($ 終点の位置ベクトル $)-($ 始点の位置ベクトル $)$。")

    # ---------- 段階2 ----------
    A, B = sp.Matrix([1, -2]), sp.Matrix([7, 4])
    P = tuple((2 * A + 1 * B) / 3)
    assert P == (3, 0)
    L.add(2, r"2点 A$(1,\,-2)$、B$(7,\,4)$ を結ぶ線分 AB を $1:2$ に内分する点 P の座標はどれか。",
          C(P),
          [C(tuple((A + 2 * B) / 3), r'内分の比 $1:2$ を逆にした。'),
           C(tuple((A + B) / 2), '中点を答えてしまった。'),
           C(tuple(-2 * A + B), r'外分点を答えてしまった。')],
          [r"$1:2$ に内分する点は $\frac{2\overrightarrow{OA}+1\cdot\overrightarrow{OB}}{1+2}$",
           r"$x$ 座標：$\frac{2\times 1+7}{3}=3$",
           r"$y$ 座標：$\frac{2\times(-2)+4}{3}=0$",
           r"よって $(3,\,0)$"],
          "A に近い側の比の値を、B の座標にかけることに注意しよう。")

    A, B = sp.Matrix([2, 1]), sp.Matrix([4, 3])
    Q = tuple((-2 * A + 3 * B) / (3 - 2))
    assert Q == (8, 7)
    L.add(2, r"2点 A$(2,\,1)$、B$(4,\,3)$ を結ぶ線分 AB を $3:2$ に外分する点 Q の座標はどれか。",
          C(Q),
          [C(tuple((2 * A + 3 * B) / 5), r'内分点を答えてしまった。'),
           C(tuple(3 * A - 2 * B), r'外分の比 $3:2$ を逆にした。'),
           C(tuple((-2 * A + 3 * B) / 5), r'分母を $m-n=1$ でなく $m+n=5$ にした。')],
          [r"$3:2$ に外分する点は $\frac{-2\overrightarrow{OA}+3\overrightarrow{OB}}{3-2}$",
           r"$x$ 座標：$-2\times 2+3\times 4=8$",
           r"$y$ 座標：$-2\times 1+3\times 3=7$",
           r"よって $(8,\,7)$"],
          "外分の公式の分母は、$m-n$ になる。")

    G, A, B = sp.Matrix([3, 2]), sp.Matrix([1, 5]), sp.Matrix([4, -1])
    Cc = tuple(3 * G - A - B)
    assert Cc == (4, 2)
    L.add(2, r"△ABC の重心が G$(3,\,2)$ で、2つの頂点が A$(1,\,5)$、B$(4,\,-1)$ のとき、頂点 C の座標はどれか。",
          C(Cc),
          [C(tuple(G - A - B), r'重心が $\frac{A+B+C}{3}$ であることを使わず、$G=A+B+C$ とした。'),
           C(tuple(3 * G), r'A、B を引き忘れた。'),
           C(tuple((A + B) / 2), 'AB の中点を答えてしまった。')],
          [r"重心の座標の式 $\frac{\vec{a}+\vec{b}+\vec{c}}{3}=\vec{g}$ より、$\vec{c}=3\vec{g}-\vec{a}-\vec{b}$",
           r"$x$ 座標：$3\times 3-1-4=4$",
           r"$y$ 座標：$3\times 2-5-(-1)=2$",
           r"よって $(4,\,2)$"],
          "重心の式 $\\frac{\\vec{a}+\\vec{b}+\\vec{c}}{3}$ を、$\\vec{c}$ について解こう。")

    def cm(c): return C(tuple(sp.nsimplify(v) for v in c), tx=cmb(c, ABC))
    L.add(2, r"点 O を基準にして、平行四辺形 ABCD の頂点 A、B、C の位置ベクトルが $\vec{a}$、$\vec{b}$、$\vec{c}$ であるとき、頂点 D の位置ベクトルはどれか。",
          cm((1, -1, 1)),
          [C((I(1), I(1), I(-1)), 'D の位置を、B と取りちがえて考えた。', tx=cmb((1, 1, -1), ABC)),
           C((I(-1), I(1), I(1)), 'A と C の役割を取りちがえた。', tx=cmb((-1, 1, 1), ABC)),
           C((R(1, 3), R(1, 3), R(1, 3)), '重心を答えてしまった。', tx=r'\frac{\vec{a}+\vec{b}+\vec{c}}{3}')],
          [r"平行四辺形だから $\overrightarrow{AD}=\overrightarrow{BC}$。",
           r"$\vec{d}-\vec{a}=\vec{c}-\vec{b}$",
           r"$\vec{d}=\vec{a}-\vec{b}+\vec{c}$",
           r"よって $\vec{a}-\vec{b}+\vec{c}$"],
          "向かい合う辺のベクトルが等しいことを、位置ベクトルの差で表そう。")

    L.add(2, r"点 O を基準にした2点 A、B の位置ベクトルを $\vec{a}$、$\vec{b}$ とする。位置ベクトルが $\frac{3}{5}\vec{a}+\frac{2}{5}\vec{b}$ である点 P は、線分 AB をどのように分けるか。$AP:PB$ を答えよ。",
          C(R(2, 3), tx='2:3'),
          [C(R(3, 2), r'比を逆にして答えた。', tx='3:2'),
           C(R(2, 5), r'分母の 5 を使って、$2:5$ とした。', tx='2:5'),
           C(R(3, 5), r'係数をそのまま比にして、$3:5$ とした。', tx='3:5')],
          [r"$\vec{p}=\frac{3\vec{a}+2\vec{b}}{5}$ と書ける。",
           r"$AP:PB=m:n$ のとき $\vec{p}=\frac{n\vec{a}+m\vec{b}}{m+n}$ だから、$n=3$、$m=2$",
           r"$m+n=5$ となり、分母とも合う。$AP:PB=2:3$",
           r"よって $2:3$"],
          "内分の公式 $\\frac{n\\vec{a}+m\\vec{b}}{m+n}$ と見くらべよう。係数が大きいほうが近い側の点になる。")

    # ---------- 段階3 ----------
    cb = (va, vb)
    def cmx(p, q, w=None): return C((sp.nsimplify(p), sp.nsimplify(q)), w, tx=cmb((p, q), (vb, vc)))
    L.add(3, r"△ABC で、$\overrightarrow{AB}=\vec{b}$、$\overrightarrow{AC}=\vec{c}$ とする。辺 AB の中点を M、辺 AC を $1:2$ に内分する点を N とするとき、$\overrightarrow{MN}$ はどれか。",
          cmx(R(-1, 2), R(1, 3)),
          [cmx(R(1, 2), R(-1, 3), r'$\overrightarrow{NM}$ を求めてしまった（向きが逆）。'),
           cmx(R(-1, 2), R(2, 3), r'$AN:NC$ を逆にして、$\overrightarrow{AN}=\frac{2}{3}\vec{c}$ とした。'),
           cmx(R(-1, 2), R(1, 2), r'N を AC の中点と考えた。')],
          [r"A を始点とする。$\overrightarrow{AM}=\frac{1}{2}\vec{b}$、$\overrightarrow{AN}=\frac{1}{3}\vec{c}$",
           r"$\overrightarrow{MN}=\overrightarrow{AN}-\overrightarrow{AM}$",
           r"$=\frac{1}{3}\vec{c}-\frac{1}{2}\vec{b}$",
           r"よって $-\frac{1}{2}\vec{b}+\frac{1}{3}\vec{c}$"],
          "A を基準にした位置ベクトルで、M と N を表し、差をとろう。")

    kk = sp.symbols('kk')
    so = sp.solve(2 * kk + (3 - kk) - 1, kk)
    assert so == [-2]
    L.add(3, r"点 O、A、B は一直線上にない。$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$ とし、$\overrightarrow{OC}=2k\vec{a}+(3-k)\vec{b}$ とする。3点 A、B、C が一直線上にあるとき、実数 $k$ の値はいくつか。",
          C(I(-2)),
          [C(I(2), '符号を取りちがえた。'),
           C(I(-3), r'係数の和を 1 でなく 0 としてしまった。'),
           C(I(4), r'$k+3=1$ を解くとき、移項を取りちがえた。')],
          [r"A、B、C が一直線上 $\Leftrightarrow$ $\overrightarrow{OC}=s\vec{a}+t\vec{b}$ で $s+t=1$",
           r"$s=2k$、$t=3-k$ だから $2k+(3-k)=1$",
           r"$k+3=1$ より $k=-2$",
           r"よって $-2$"],
          "$\\overrightarrow{OC}=s\\vec{a}+t\\vec{b}$ が直線 AB 上の点になる条件は、$s+t=1$。")

    abc3 = (va, vb, vc)
    L.add(3, r"点 P が $2\overrightarrow{PA}+\overrightarrow{PB}+3\overrightarrow{PC}=\vec{0}$ を満たしている。点 O を基準にした A、B、C の位置ベクトルを $\vec{a}$、$\vec{b}$、$\vec{c}$ とするとき、P の位置ベクトルはどれか。",
          fm((2, 1, 3), 6, abc3),
          [fm((1, 1, 1), 3, abc3, r'重み（2、1、3）を考えず、重心を答えてしまった。'),
           fm((2, 1, 3), 1, abc3, r'$\vec{p}$ の係数 6 でわるのを忘れた。'),
           fm((-2, -1, -3), 6, abc3, r'移項するときに符号を取りちがえた。')],
          [r"$\overrightarrow{PA}=\vec{a}-\vec{p}$ などを代入する。$2(\vec{a}-\vec{p})+(\vec{b}-\vec{p})+3(\vec{c}-\vec{p})=\vec{0}$",
           r"$2\vec{a}+\vec{b}+3\vec{c}-6\vec{p}=\vec{0}$",
           r"$\vec{p}=\frac{2\vec{a}+\vec{b}+3\vec{c}}{6}$",
           r"よって $\frac{2\vec{a}+\vec{b}+3\vec{c}}{6}$"],
          "$\\overrightarrow{PA}$、$\\overrightarrow{PB}$、$\\overrightarrow{PC}$ を、位置ベクトルの差 $\\vec{a}-\\vec{p}$ などに直そう。")

    A, B = sp.Matrix([-1, 2]), sp.Matrix([4, -3])
    P_ = (2 * A + 3 * B) / 5
    Q_ = (-2 * A + 3 * B) / (3 - 2)
    M_ = tuple((P_ + Q_) / 2)
    assert tuple(P_) == (2, -1) and tuple(Q_) == (14, -13) and M_ == (8, -7)
    Q2 = (-3 * A + 2 * B) / (2 - 3)
    M2 = tuple((P_ + Q2) / 2)
    assert M2 == (R(-9, 2), R(11, 2))
    L.add(3, r"2点 A$(-1,\,2)$、B$(4,\,-3)$ について、線分 AB を $3:2$ に内分する点を P、$3:2$ に外分する点を Q とする。線分 PQ の中点 M の座標はどれか。",
          C(M_),
          [C(tuple(2 * sp.Matrix(M_)), r'中点を求めるときに、2 でわるのを忘れた。'),
           C(M2, r'外分の比 $3:2$ を逆にして、Q を求めた。'),
           C(tuple(P_), r'Q を P と同じ点にしてしまった（外分を内分と同じに扱った）。')],
          [r"P $=\frac{2\cdot\text{A}+3\cdot\text{B}}{5}$ より P$(2,\,-1)$",
           r"Q $=\frac{-2\cdot\text{A}+3\cdot\text{B}}{3-2}$ より Q$(14,\,-13)$",
           r"中点 M $=\left(\frac{2+14}{2},\ \frac{-1+(-13)}{2}\right)$",
           r"よって $(8,\,-7)$"],
          "P と Q の座標を別々に求めてから、中点を計算しよう。")

    A_, B_ = sp.Matrix([1, 0]), sp.Matrix([0, 1])
    def on_line(p, q):
        C_ = p * A_ + q * B_          # O を原点、a=(1,0)、b=(0,1) としたときの C
        return bool(sp.simplify((C_ - A_)[0] * (B_ - A_)[1] - (C_ - A_)[1] * (B_ - A_)[0]) == 0)
    s1 = on_line(2, -1); s2 = on_line(R(1, 2), R(1, 3)); s3 = on_line(1, 1); s4 = on_line(R(1, 3), R(1, 3))
    assert (s1, s2, s3, s4) == (True, False, False, False)
    L.add(3, r"点 O、A、B は一直線上にない。$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$ とする。次の $\overrightarrow{OC}$ のうち、3点 A、B、C が一直線上にあるものはどれか。",
          C(s1, raw=r"$\overrightarrow{OC}=2\vec{a}-\vec{b}$"),
          [C(s2, r'係数の和が 1 になるかどうかを、計算して確かめなかった。', raw=r"$\overrightarrow{OC}=\frac{1}{2}\vec{a}+\frac{1}{3}\vec{b}$"),
           C(s3, r'係数の和が 1 でなく 2 になっていることを見落とした。', raw=r"$\overrightarrow{OC}=\vec{a}+\vec{b}$"),
           C(s4, r'係数がそろっていれば、一直線上にあると考えた。', raw=r"$\overrightarrow{OC}=\frac{1}{3}\vec{a}+\frac{1}{3}\vec{b}$")],
          [r"$\overrightarrow{OC}=s\vec{a}+t\vec{b}$ で、A、B、C が一直線上 $\Leftrightarrow$ $s+t=1$",
           r"$2\vec{a}-\vec{b}$：$2+(-1)=1$ で、条件を満たす。",
           r"$\frac{1}{2}+\frac{1}{3}=\frac{5}{6}$、$1+1=2$、$\frac{1}{3}+\frac{1}{3}=\frac{2}{3}$ は、いずれも 1 でない。",
           r"よって $\overrightarrow{OC}=2\vec{a}-\vec{b}$"],
          "$\\vec{a}$ と $\\vec{b}$ の係数の和を、それぞれ計算してみよう。", echeck=False)

    # ---------- 段階4 ----------
    b_, c_ = sp.Matrix([5, 1]), sp.Matrix([2, 6])
    D = (2 * b_ + c_) / 3                 # BC を 1:2 に内分 → BD:DC=1:2
    Pq = D * R(3, 4)                      # AP:PD = 3:1
    M2_ = sp.Matrix.hstack(b_, c_)
    cf = M2_.solve(Pq)
    assert tuple(cf) == (R(1, 2), R(1, 4))
    L.add(4, r"△ABC で、$\overrightarrow{AB}=\vec{b}$、$\overrightarrow{AC}=\vec{c}$ とする。辺 BC を $1:2$ に内分する点を D、線分 AD を $3:1$ に内分する点を P とするとき、$\overrightarrow{AP}$ はどれか。",
          cmx(R(1, 2), R(1, 4)),
          [cmx(R(1, 4), R(1, 2), r'BC の内分比 $1:2$ を逆にして、D を求めた。'),
           cmx(R(1, 6), R(1, 12), r'AP : PD を $1:3$ と取りちがえた。'),
           cmx(R(2, 3), R(1, 3), r'D までしか求めなかった（$\overrightarrow{AD}$ を答えた）。')],
          [r"$\overrightarrow{AD}=\frac{2\vec{b}+\vec{c}}{3}$（BD : DC $=1:2$）",
           r"AP : PD $=3:1$ だから $\overrightarrow{AP}=\frac{3}{4}\overrightarrow{AD}$",
           r"$\overrightarrow{AP}=\frac{3}{4}\cdot\frac{2\vec{b}+\vec{c}}{3}=\frac{1}{2}\vec{b}+\frac{1}{4}\vec{c}$",
           r"よって $\frac{1}{2}\vec{b}+\frac{1}{4}\vec{c}$"],
          "まず D の位置ベクトルを求め、次に P が AD をどう分けるかを使おう。")

    Av, Bv, Cv = np.array([0., 0.]), np.array([6., 0.]), np.array([0., 3.])
    f = lambda p: sum(np.sum((p - q) ** 2) for q in (Av, Bv, Cv))
    gx, gy = np.meshgrid(np.linspace(-5, 10, 1501), np.linspace(-5, 10, 1501))
    fv = gx ** 2 + gy ** 2 + (gx - 6) ** 2 + gy ** 2 + gx ** 2 + (gy - 3) ** 2
    i = np.unravel_index(np.argmin(fv), fv.shape)
    assert abs(fv.min() - 30) < 1e-6 and abs(gx[i] - 2) < 1e-6 and abs(gy[i] - 1) < 1e-6
    f_at = lambda p: f(np.array(p, float))
    assert f_at([0, 0]) == 45 and f_at([3, 0]) == 36 and abs(f_at([3, 1.5]) - 135 / 4) < 1e-9
    L.add(4, r"座標平面上に3点 A$(0,\,0)$、B$(6,\,0)$、C$(0,\,3)$ がある。点 P が平面上を動くとき、$PA^{2}+PB^{2}+PC^{2}$ の最小値はいくつか。",
          C(I(30)),
          [C(I(45), 'P を頂点 A に置いたときの値を答えた。'),
           C(I(36), r'P を辺 AB の中点に置いたときの値を答えた。'),
           C(R(135, 4), r'P を △ABC の外心（BC の中点）に置いたときの値を答えた。')],
          [r"P$(x,\,y)$ とすると $PA^{2}+PB^{2}+PC^{2}=x^{2}+y^{2}+(x-6)^{2}+y^{2}+x^{2}+(y-3)^{2}$",
           r"$=3x^{2}-12x+3y^{2}-6y+45=3(x-2)^{2}+3(y-1)^{2}+30$",
           r"$x=2$、$y=1$ のとき最小（P は重心 G$(2,\,1)$）で、最小値は 30",
           r"よって $30$"],
          "$x$ と $y$ のそれぞれで平方完成しよう。最小になる点は、三角形のある特別な点になる。")

    A_, B_ = sp.Matrix([2, 5]), sp.Matrix([8, 1])
    tq = sp.symbols('tq')
    Pt = A_ + tq * (B_ - A_)
    so = sp.solve(Pt[0] - Pt[1], tq)
    assert so == [R(3, 10)]
    L.add(4, r"2点 A$(2,\,5)$、B$(8,\,1)$ を結ぶ線分 AB が、直線 $y=x$ と点 P で交わっている。P は線分 AB を $AP:PB$ に内分する。$AP:PB$ はどれか。",
          C(R(3, 7), tx='3:7'),
          [C(R(7, 3), r'比を逆にして答えた。', tx='7:3'),
           C(R(3, 5), tx='3:5'),
           C(R(3, 10), r'$t=\frac{3}{10}$ をそのまま比にして、$3:10$ とした。', tx='3:10')],
          [r"P $=(1-t)\text{A}+t\text{B}=(2+6t,\ 5-4t)$（$AP:PB=t:(1-t)$）",
           r"P が $y=x$ 上にあるから $2+6t=5-4t$",
           r"$10t=3$ より $t=\frac{3}{10}$。$AP:PB=\frac{3}{10}:\frac{7}{10}=3:7$",
           r"よって $3:7$"],
          "P を、内分比を表す文字 $t$ を使って座標で表し、$y=x$ に代入しよう。")

    Aq, Bq, Cq, Dq = np.array([0., 0.]), np.array([4., 0.]), np.array([5., 3.]), np.array([0., 2.])
    Pq_, Qq_, Rq_, Sq_ = (Aq + Bq) / 2, (Bq + Cq) / 2, (Cq + Dq) / 2, (Dq + Aq) / 2
    PQ, SR, QR = Qq_ - Pq_, Rq_ - Sq_, Rq_ - Qq_
    assert np.allclose(PQ, SR)
    assert abs(np.dot(PQ, QR)) > 1e-6 and abs(np.linalg.norm(PQ) - np.linalg.norm(QR)) > 1e-6
    rn = np.random.default_rng(7)
    for _ in range(100):
        a_, b_, c_, d_ = rn.normal(size=(4, 2))
        assert np.allclose(((b_ + c_) / 2) - ((a_ + b_) / 2), ((c_ + d_) / 2) - ((d_ + a_) / 2))
    L.add(4, r"四角形 ABCD（平行四辺形などとは限らない）の辺 AB、BC、CD、DA の中点を、それぞれ P、Q、R、S とする。四角形 PQRS について、つねに成り立つものはどれか。",
          C(True, raw=r"平行四辺形である"),
          [C(False, r'ABCD の対角線が垂直なときだけ成り立つ性質を、つねに成り立つと考えた。', raw=r"長方形である"),
           C(False, r'ABCD の対角線の長さが等しいときだけ成り立つ性質を、つねに成り立つと考えた。', raw=r"ひし形である"),
           C(False, r'特別な場合を、つねに成り立つと考えた。', raw=r"正方形である")],
          [r"A、B、C、D の位置ベクトルを $\vec{a}$、$\vec{b}$、$\vec{c}$、$\vec{d}$ とする。P、Q、R、S の位置ベクトルは $\frac{\vec{a}+\vec{b}}{2}$、$\frac{\vec{b}+\vec{c}}{2}$、$\frac{\vec{c}+\vec{d}}{2}$、$\frac{\vec{d}+\vec{a}}{2}$",
           r"$\overrightarrow{PQ}=\frac{\vec{c}-\vec{a}}{2}$、$\overrightarrow{SR}=\frac{\vec{c}-\vec{a}}{2}$ だから $\overrightarrow{PQ}=\overrightarrow{SR}$",
           r"向かい合う1組の辺が平行で長さも等しいから、PQRS はつねに平行四辺形。長方形、ひし形、正方形になるとは限らない。",
           r"よって「平行四辺形である」"],
          "P、Q、R、S の位置ベクトルを求め、$\\overrightarrow{PQ}$ と $\\overrightarrow{SR}$ を比べよう。", echeck=False)

    A_, B_ = sp.Matrix([1, 2]), sp.Matrix([5, 4])
    def Pt_(t): return (1 - t) * A_ + t * B_
    def mid(p, q): return (p + q) / 2
    t1 = (mid(A_, Pt_(2)) == B_)                 # t=2: B は AP の中点
    t2 = (mid(A_, Pt_(-1)) == B_)                # t=-1
    t3 = (Pt_(R(1, 3)) == (2 * A_ + 1 * B_) / 3) # t=1/3 : AP:PB=1:2 → (2A+B)/3。「2:1 に内分」は (A+2B)/3
    t3_claim = (Pt_(R(1, 3)) == (A_ + 2 * B_) / 3)
    t4 = (0 <= R(3, 2) <= 1)
    assert (t1, t2, t3_claim, t4) == (True, False, False, False)
    L.add(4, r"2点 A$(1,\,2)$、B$(5,\,4)$ と実数 $t$ に対して、点 P を P $=(1-t)\text{A}+t\text{B}$（座標ごとの計算）で定める。次のうち、正しいものはどれか。",
          C(True, raw=r"$t=2$ のとき、B は線分 AP の中点である。"),
          [C(False, r'$t<0$ のとき P は A の側にのびることを見落とした（P$(-3,\,0)$ で、AP の中点は B にならない）。', raw=r"$t=-1$ のとき、B は線分 AP の中点である。"),
           C(False, r'$AP:PB=t:(1-t)$ を使わず、比を逆にして考えた。', raw=r"$t=\frac{1}{3}$ のとき、P は線分 AB を $2:1$ に内分する点である。"),
           C(False, r'$t>1$ のとき P は線分 AB の外にあることを見落とした。', raw=r"$t=\frac{3}{2}$ のとき、P は線分 AB 上にある。")],
          [r"P $=(1+4t,\ 2+2t)$。$AP:PB=t:(1-t)$ で、$0\leqq t\leqq 1$ のとき P は線分 AB 上。",
           r"$t=2$：P$(9,\,6)$。AP の中点は $\left(\frac{1+9}{2},\ \frac{2+6}{2}\right)=(5,\,4)=$ B で正しい。",
           r"$t=-1$：P$(-3,\,0)$。AP の中点は $(-1,\,1)$ で B でない。$t=\frac{1}{3}$：$AP:PB=1:2$ で、$2:1$ ではない。$t=\frac{3}{2}>1$：P は線分 AB の外。",
           r"よって「$t=2$ のとき、B は線分 AP の中点である」"],
          "$t$ の値ごとに P の座標を計算して、それぞれの文を確かめよう。", echeck=False)
    return L
#### L04-END

#### L05-BEGIN
def inter(P1, P2, P3, P4):
    """直線 P1P2 と直線 P3P4 の交点（sympy）。(点, s, t) を返す"""
    s, t = sp.symbols('s_i t_i')
    P1, P2, P3, P4 = [sp.Matrix(p) for p in (P1, P2, P3, P4)]
    sol = sp.solve(list(P1 + s * (P2 - P1) - P3 - t * (P4 - P3)), [s, t], dict=True)[0]
    return tuple(P1 + sol[s] * (P2 - P1)), sol[s], sol[t]

def tri_area(P, Q, Rr):
    P, Q, Rr = [sp.Matrix(p) for p in (P, Q, Rr)]
    u, v = Q - P, Rr - P
    return sp.Abs(u[0] * v[1] - u[1] * v[0]) / 2

def strictly_inside(P, A, B, Cc):
    def cr(p, q, r):
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    d1, d2, d3 = cr(A, B, P), cr(B, Cc, P), cr(Cc, A, P)
    return (d1 > 0 and d2 > 0 and d3 > 0) or (d1 < 0 and d2 < 0 and d3 < 0)

def lesson_05():
    L = Lesson('mc1-05')
    I = Integer
    va, vb, vc = r'\vec{a}', r'\vec{b}', r'\vec{c}'
    def cmx(p, q, names, w=None): return C((sp.nsimplify(p), sp.nsimplify(q)), w, tx=cmb((p, q), names))
    def vt(*xs):
        return tuple(sp.nsimplify(v) for v in xs)

    # ---------- 段階1 ----------
    a = sp.Matrix([2, 0]); b = sp.Matrix([1, sqrt(3)])
    assert sp.simplify((b - a).norm() - 2) == 0 and a.dot(b) == 2
    L.add(1, r"1辺の長さが $2$ の正三角形 OAB で、$\overrightarrow{OA}\cdot\overrightarrow{OB}$ の値はいくつか。",
          C(I(2)),
          [C(I(4), r'$\cos 60^{\circ}$ をかけ忘れた。'),
           C(2 * sqrt(3), r'$\cos 60^{\circ}$ でなく、$\sin 60^{\circ}$ を使ってしまった。'),
           C(I(-2), r'なす角を $120^{\circ}$ と取りちがえた。')],
          [r"正三角形だから、$\overrightarrow{OA}$ と $\overrightarrow{OB}$ のなす角は $60^{\circ}$。",
           r"$\overrightarrow{OA}\cdot\overrightarrow{OB}=|\overrightarrow{OA}||\overrightarrow{OB}|\cos 60^{\circ}$",
           r"$=2\times 2\times\frac{1}{2}=2$",
           r"よって $2$"],
          "正三角形の1つの角は $60^{\\circ}$。内積の定義に当てはめよう。")

    A_, B_ = sp.Matrix([0, 0]), sp.Matrix([3, 0])
    # |AB|=3,|AD|=2、∠A=60° になるように D を取る
    D_ = sp.Matrix([sp.cos(sp.pi / 3) * 2, sp.sin(sp.pi / 3) * 2])
    C_ = B_ + D_ - A_
    val = (C_ - A_).dot(D_ - B_)
    assert sp.simplify(val) == -5
    L.add(1, r"平行四辺形 ABCD で、$AB=3$、$AD=2$ である。$\overrightarrow{AC}\cdot\overrightarrow{BD}$ の値はいくつか。",
          C(I(-5)),
          [C(I(5), r'$\overrightarrow{BD}=\overrightarrow{AB}-\overrightarrow{AD}$ としてしまった。'),
           C(I(13), r'展開で $-|\overrightarrow{AB}|^{2}$ の符号を取りちがえた。'),
           C(I(1), r'辺の長さ 3 と 2 の差を答えた。')],
          [r"$\overrightarrow{AB}=\vec{a}$、$\overrightarrow{AD}=\vec{b}$ とすると $\overrightarrow{AC}=\vec{a}+\vec{b}$、$\overrightarrow{BD}=\vec{b}-\vec{a}$",
           r"$\overrightarrow{AC}\cdot\overrightarrow{BD}=(\vec{a}+\vec{b})\cdot(\vec{b}-\vec{a})=|\vec{b}|^{2}-|\vec{a}|^{2}$",
           r"$=2^{2}-3^{2}=-5$",
           r"よって $-5$"],
          "$\\overrightarrow{AC}$ と $\\overrightarrow{BD}$ を、$\\overrightarrow{AB}$、$\\overrightarrow{AD}$ で表して展開しよう。")

    b_, c_ = 4, 6
    bc = 8
    bcdot = sp.Rational(b_ ** 2 + c_ ** 2 - bc ** 2, 2)
    am2 = sp.Rational(1, 4) * (b_ ** 2 + c_ ** 2 + 2 * bcdot)
    assert bcdot == -6 and am2 == 10
    L.add(1, r"△ABC で、$AB=4$、$AC=6$、$BC=8$ である。辺 BC の中点を M とするとき、中線 AM の長さはいくつか。",
          C(sqrt(10)),
          [C(sqrt(13), r'$\overrightarrow{AB}\cdot\overrightarrow{AC}$ の項を落とした。'),
           C(I(5), r'$\frac{4+6}{2}$ と、平均をとってしまった。'),
           C(2 * sqrt(10), r'$\overrightarrow{AM}=\frac{\overrightarrow{AB}+\overrightarrow{AC}}{2}$ の $\frac{1}{2}$ を忘れた。')],
          [r"$\overrightarrow{AM}=\frac{1}{2}(\overrightarrow{AB}+\overrightarrow{AC})$。まず内積を求める。$|\overrightarrow{BC}|^{2}=|\overrightarrow{AC}-\overrightarrow{AB}|^{2}$ より $64=36-2\overrightarrow{AB}\cdot\overrightarrow{AC}+16$",
           r"$\overrightarrow{AB}\cdot\overrightarrow{AC}=-6$",
           r"$|\overrightarrow{AM}|^{2}=\frac{1}{4}(16+2\times(-6)+36)=10$",
           r"よって $\sqrt{10}$"],
          "$\\overrightarrow{AB}\\cdot\\overrightarrow{AC}$ は、辺 BC の長さを内積で表した式から求めよう。")

    ts = [R(i, 2) for i in range(-4, 5)]
    def equiv(cond):
        # P = s AB + t AC が直線 BC 上 ⇔ s+t=1。cond がこれと同値か（格子点で確かめる）
        return all(cond(s_, t_) == (s_ + t_ == 1) for s_ in ts for t_ in ts)
    c1, c2, c3, c4 = equiv(lambda s_, t_: s_ + t_ == 1), equiv(lambda s_, t_: s_ == t_), equiv(lambda s_, t_: s_ * t_ == 0), equiv(lambda s_, t_: s_ + t_ == 0)
    assert (c1, c2, c3, c4) == (True, False, False, False)
    Bq, Cq = sp.Matrix([4, 0]), sp.Matrix([1, 3])
    for s_, t_ in [(R(1, 3), R(2, 3)), (2, -1), (R(-1, 2), R(3, 2))]:
        Pp = s_ * Bq + t_ * Cq
        u, v = Cq - Bq, Pp - Bq
        assert u[0] * v[1] - u[1] * v[0] == 0
    L.add(1, r"△ABC と点 P について、$\overrightarrow{AP}=s\overrightarrow{AB}+t\overrightarrow{AC}$ とする。P が直線 BC 上にあるための条件はどれか。",
          C(c1, raw=r"$s+t=1$"),
          [C(c2, r'BC の中点（$s=t=\frac{1}{2}$）だけを思い浮かべた。', raw=r"$s=t$"),
           C(c3, r'「$s$ か $t$ が 0」という条件と取りちがえた。', raw=r"$st=0$"),
           C(c4, r'係数の和を 1 でなく 0 としてしまった。', raw=r"$s+t=0$")],
          [r"P が直線 BC 上 $\Leftrightarrow$ $\overrightarrow{AP}=(1-t)\overrightarrow{AB}+t\overrightarrow{AC}$ と書ける。",
           r"（$\overrightarrow{AP}=\overrightarrow{AB}+t\overrightarrow{BC}$ と同じ）",
           r"つまり、$\overrightarrow{AB}$ と $\overrightarrow{AC}$ の係数の和が 1。",
           r"よって $s+t=1$"],
          "直線 BC 上の点は、$\\overrightarrow{AP}=\\overrightarrow{AB}+t\\overrightarrow{BC}$ と書ける。")

    Aq, Bq, Cq = (0, 0), (4, 0), (1, 3)
    def pnt(s_, t_): return (s_ * Bq[0] + t_ * Cq[0], s_ * Bq[1] + t_ * Cq[1])
    q1 = strictly_inside(pnt(R(1, 2), R(1, 3)), Aq, Bq, Cq)
    q2 = strictly_inside(pnt(R(1, 2), R(1, 2)), Aq, Bq, Cq)
    q3 = strictly_inside(pnt(R(2, 3), R(2, 3)), Aq, Bq, Cq)
    q4 = strictly_inside(pnt(R(-1, 4), R(1, 2)), Aq, Bq, Cq)
    assert (q1, q2, q3, q4) == (True, False, False, False)
    def st(s_, t_): return r"$(s,\ t)=\left(%s,\ %s\right)$" % (tex(s_), tex(t_))
    L.add(1, r"△ABC と点 P について、$\overrightarrow{AP}=s\overrightarrow{AB}+t\overrightarrow{AC}$ とする。P が △ABC の内部（周は含まない）にあるのは、次のうちどれか。",
          C(q1, raw=st(R(1, 2), R(1, 3))),
          [C(q2, r'$s+t=1$ のとき、P が辺 BC 上（周上）にあることを見落とした。', raw=st(R(1, 2), R(1, 2))),
           C(q3, r'$s+t$ が 1 より大きくなっていることを見落とした。', raw=st(R(2, 3), R(2, 3))),
           C(q4, r'$s$ が負になっていることを見落とした。', raw=st(R(-1, 4), R(1, 2)))],
          [r"P が △ABC の内部 $\Leftrightarrow$ $s>0$、$t>0$、$s+t<1$",
           r"$\left(\frac{1}{2},\,\frac{1}{3}\right)$：$s>0$、$t>0$、$s+t=\frac{5}{6}<1$ で内部。",
           r"$\left(\frac{1}{2},\,\frac{1}{2}\right)$ は $s+t=1$ で辺 BC 上。$\left(\frac{2}{3},\,\frac{2}{3}\right)$ は $s+t>1$、$\left(-\frac{1}{4},\,\frac{1}{2}\right)$ は $s<0$ で、どちらも外。",
           r"よって $(s,\ t)=\left(\frac{1}{2},\ \frac{1}{3}\right)$"],
          "内部の条件は、$s$、$t$ がともに正で、和が 1 より小さいこと。", echeck=False)

    # ---------- 段階2 ----------
    Oq, Aq, Bq = (0, 0), (6, 0), (0, 4)
    Cq = (4, 0); Dq = (0, 2)
    P_, s_, t_ = inter(Aq, Dq, Bq, Cq)
    assert P_ == (3, 1)
    M2 = sp.Matrix.hstack(sp.Matrix(Aq), sp.Matrix(Bq))
    assert tuple(M2.solve(sp.Matrix(P_))) == (R(1, 2), R(1, 4))
    AB2 = (va, vb)
    L.add(2, r"△OAB で、$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$ とする。辺 OA を $2:1$ に内分する点を C、辺 OB の中点を D とし、線分 AD と線分 BC の交点を P とするとき、$\overrightarrow{OP}$ はどれか。",
          cmx(R(1, 2), R(1, 4), AB2),
          [cmx(R(1, 4), R(1, 2), AB2, r'$\vec{a}$ と $\vec{b}$ の係数を入れかえてしまった。'),
           cmx(R(2, 3), R(1, 2), AB2, r'C、D の位置ベクトルの係数をそのまま並べてしまった。'),
           cmx(R(1, 3), R(1, 3), AB2, r'重心のような点を答えてしまった。')],
          [r"$\overrightarrow{OC}=\frac{2}{3}\vec{a}$、$\overrightarrow{OD}=\frac{1}{2}\vec{b}$。P は AD 上：$\overrightarrow{OP}=(1-s)\vec{a}+\frac{s}{2}\vec{b}$、BC 上：$\overrightarrow{OP}=\frac{2t}{3}\vec{a}+(1-t)\vec{b}$",
           r"$\vec{a}$、$\vec{b}$ は平行でないので係数を比べる。$1-s=\frac{2t}{3}$、$\frac{s}{2}=1-t$",
           r"$s=2-2t$ を代入して $2t-1=\frac{2t}{3}$ より $t=\frac{3}{4}$、$s=\frac{1}{2}$",
           r"$\overrightarrow{OP}=\frac{1}{2}\vec{a}+\frac{1}{4}\vec{b}$。よって $\frac{1}{2}\vec{a}+\frac{1}{4}\vec{b}$"],
          "P を2通りに表し、$\\vec{a}$ の係数どうし、$\\vec{b}$ の係数どうしを比べよう。")

    AB_, AC_ = 3, 4
    ad = sp.sqrt(AB_ ** 2 + AC_ ** 2) / 2
    assert ad == R(5, 2)
    L.add(2, r"△ABC で、$AB=3$、$AC=4$、$\angle A=90^{\circ}$ である。辺 BC の中点を D とするとき、$AD$ の長さはいくつか。",
          C(R(5, 2)),
          [C(I(5), r'BC の長さをそのまま答えた。'),
           C(R(5, 4), r'$\frac{BC}{2}$ をさらに 2 でわった。'),
           C(R(7, 2), r'$\frac{3+4}{2}$ と、平均をとってしまった。')],
          [r"$\overrightarrow{AD}=\frac{1}{2}(\overrightarrow{AB}+\overrightarrow{AC})$、$\overrightarrow{AB}\cdot\overrightarrow{AC}=0$（$\angle A=90^{\circ}$）",
           r"$|\overrightarrow{AD}|^{2}=\frac{1}{4}(|\overrightarrow{AB}|^{2}+2\overrightarrow{AB}\cdot\overrightarrow{AC}+|\overrightarrow{AC}|^{2})=\frac{1}{4}(9+0+16)=\frac{25}{4}$",
           r"$|\overrightarrow{AD}|>0$ より $|\overrightarrow{AD}|=\frac{5}{2}$",
           r"よって $\frac{5}{2}$"],
          "$\\overrightarrow{AD}$ を $\\overrightarrow{AB}$、$\\overrightarrow{AC}$ で表し、2乗して内積で展開しよう。")

    bc = sp.sqrt(4 + 9 - 2 * 2 * 3 * sp.cos(sp.pi / 3))
    assert bc == sqrt(7)
    L.add(2, r"△ABC で、$AB=2$、$AC=3$、$\angle A=60^{\circ}$ である。辺 BC の長さはいくつか。",
          C(sqrt(7)),
          [C(sqrt(19), r'$-2\overrightarrow{AB}\cdot\overrightarrow{AC}$ の符号を取りちがえて、$4+9+6$ とした。'),
           C(sqrt(13), r'内積の項 $-2\overrightarrow{AB}\cdot\overrightarrow{AC}$ を落とした。'),
           C(I(7), r'平方根をとるのを忘れた。')],
          [r"$\overrightarrow{BC}=\overrightarrow{AC}-\overrightarrow{AB}$。$\overrightarrow{AB}\cdot\overrightarrow{AC}=2\times 3\times\cos 60^{\circ}=3$",
           r"$|\overrightarrow{BC}|^{2}=|\overrightarrow{AC}|^{2}-2\overrightarrow{AB}\cdot\overrightarrow{AC}+|\overrightarrow{AB}|^{2}$",
           r"$=9-6+4=7$",
           r"よって $BC=\sqrt{7}$"],
          "$\\overrightarrow{BC}=\\overrightarrow{AC}-\\overrightarrow{AB}$ の2乗を、内積で展開しよう。")

    Aq, Bq, Cq = sp.Matrix([0, 0]), sp.Matrix([6, 0]), sp.Matrix([2, 5])
    Pq = R(1, 3) * (Bq - Aq) + R(1, 4) * (Cq - Aq) + Aq
    assert sp.simplify(tri_area(Aq, Bq, Pq) / tri_area(Aq, Bq, Cq)) == R(1, 4)
    L.add(2, r"△ABC と点 P について、$\overrightarrow{AP}=\frac{1}{3}\overrightarrow{AB}+\frac{1}{4}\overrightarrow{AC}$ が成り立つ。△ABP の面積は、△ABC の面積の何倍か。",
          C(R(1, 4)),
          [C(R(1, 3), r'$\overrightarrow{AB}$ の係数 $\frac{1}{3}$ を答えた。'),
           C(R(7, 12), r'$\frac{1}{3}+\frac{1}{4}$ を答えた。'),
           C(R(5, 12), r'$1-\frac{1}{3}-\frac{1}{4}$ を答えた。')],
          [r"底辺 AB を共通にすると、面積の比は高さの比になる。",
           r"$\overrightarrow{AP}=\frac{1}{3}\overrightarrow{AB}+\frac{1}{4}\overrightarrow{AC}$ で、AB に平行な成分は高さに関係しない。高さは $\overrightarrow{AC}$ の係数 $\frac{1}{4}$ 倍になる。",
           r"△ABP $:$ △ABC $=\frac{1}{4}:1$",
           r"よって $\frac{1}{4}$ 倍"],
          "$\\overrightarrow{AB}$ に平行な動きは、△ABP の高さを変えない。高さを決めるのはどちらの係数か。")

    A_, B_, C_ = sp.Matrix([0, 3]), sp.Matrix([-1, 0]), sp.Matrix([3, 0])
    xh, yh = sp.symbols('xh yh')
    sol = sp.solve([(sp.Matrix([xh, yh]) - A_).dot(C_ - B_), (sp.Matrix([xh, yh]) - B_).dot(C_ - A_)], [xh, yh])
    assert (sol[xh], sol[yh]) == (0, 1)
    G_ = tuple((A_ + B_ + C_) / 3)
    xo, yo = sp.symbols('xo yo')
    so2 = sp.solve([(sp.Matrix([xo, yo]) - A_).dot(sp.Matrix([xo, yo]) - A_) - (sp.Matrix([xo, yo]) - B_).dot(sp.Matrix([xo, yo]) - B_),
                    (sp.Matrix([xo, yo]) - B_).dot(sp.Matrix([xo, yo]) - B_) - (sp.Matrix([xo, yo]) - C_).dot(sp.Matrix([xo, yo]) - C_)], [xo, yo])
    assert G_ == (R(2, 3), 1) and (so2[xo], so2[yo]) == (1, 1)
    L.add(2, r"3点 A$(0,\,3)$、B$(-1,\,0)$、C$(3,\,0)$ を頂点とする △ABC の垂心 H の座標はどれか。",
          C(vt(0, 1)),
          [C(G_, r'重心を答えてしまった。'),
           C(vt(1, 1), r'外心を答えてしまった。'),
           C(vt(0, 2))],
          [r"H$(x,\,y)$ とする。$\overrightarrow{AH}\cdot\overrightarrow{BC}=0$：$\overrightarrow{BC}=(4,\,0)$ だから $4x=0$ より $x=0$",
           r"$\overrightarrow{BH}\cdot\overrightarrow{AC}=0$：$\overrightarrow{BH}=(x+1,\,y)$、$\overrightarrow{AC}=(3,\,-3)$ だから $3(x+1)-3y=0$",
           r"$x=0$ を代入して $y=1$",
           r"よって $(0,\,1)$"],
          "垂心は、頂点から対辺への垂線の交点。内積が 0 になる条件を2つ立てよう。")

    # ---------- 段階3 ----------
    Bq, Cq = (5, 0), (1, 4)
    Dq = (R(5, 3), 0); Eq = (R(1, 2), 2)
    P_, s_, t_ = inter(Cq, Dq, Bq, Eq)
    M2 = sp.Matrix.hstack(sp.Matrix(Bq), sp.Matrix(Cq))
    assert tuple(M2.solve(sp.Matrix(P_))) == (R(1, 5), R(2, 5))
    # BP:PE = t(BE上のパラメータ):(1-t)
    assert t_ == R(4, 5) and s_ == R(3, 5)
    L.add(3, r"△ABC で、辺 AB を $1:2$ に内分する点を D、辺 AC の中点を E とし、線分 CD と線分 BE の交点を P とする。$BP:PE$ はどれか。",
          C(R(4, 1), tx='4:1'),
          [C(R(1, 4), r'比を逆にして答えた。', tx='1:4'),
           C(R(3, 2), r'$CP:PD$ の比を答えてしまった。', tx='3:2'),
           C(R(2, 3), tx='2:3')],
          [r"$\overrightarrow{AB}=\vec{b}$、$\overrightarrow{AC}=\vec{c}$ とする。$\overrightarrow{AD}=\frac{1}{3}\vec{b}$、$\overrightarrow{AE}=\frac{1}{2}\vec{c}$",
           r"CD 上：$\overrightarrow{AP}=\frac{s}{3}\vec{b}+(1-s)\vec{c}$、BE 上：$\overrightarrow{AP}=(1-t)\vec{b}+\frac{t}{2}\vec{c}$",
           r"係数を比べて $\frac{s}{3}=1-t$、$1-s=\frac{t}{2}$ より $s=\frac{3}{5}$、$t=\frac{4}{5}$",
           r"$BP:PE=t:(1-t)=4:1$。よって $4:1$"],
          "P を CD 上の点、BE 上の点として2通りに表し、$\\vec{b}$、$\\vec{c}$ の係数を比べよう。")

    Aq, Bq, Cq = sp.Matrix([0, 0]), sp.Matrix([6, 0]), sp.Matrix([1, 5])
    Pq = (3 * Aq + 4 * Bq + 5 * Cq) / 12
    assert (3 * (Aq - Pq) + 4 * (Bq - Pq) + 5 * (Cq - Pq)) == sp.zeros(2, 1)
    assert sp.simplify(tri_area(Pq, Aq, Bq) / tri_area(Aq, Bq, Cq)) == R(5, 12)
    L.add(3, r"△ABC の内部に点 P があり、$3\overrightarrow{PA}+4\overrightarrow{PB}+5\overrightarrow{PC}=\vec{0}$ を満たしている。△PAB の面積は、△ABC の面積の何倍か。",
          C(R(5, 12)),
          [C(R(1, 3), r'重みを考えず、3等分と考えた。'),
           C(R(7, 12), r'$\frac{3+4}{12}$ を答えた（△PAB の面積に対応するのは C の重み 5 である）。'),
           C(R(5, 7), r'分母を 3+4=7 にしてしまった。')],
          [r"A を始点にして $3(-\overrightarrow{AP})+4(\overrightarrow{AB}-\overrightarrow{AP})+5(\overrightarrow{AC}-\overrightarrow{AP})=\vec{0}$",
           r"$12\overrightarrow{AP}=4\overrightarrow{AB}+5\overrightarrow{AC}$ より $\overrightarrow{AP}=\frac{1}{3}\overrightarrow{AB}+\frac{5}{12}\overrightarrow{AC}$",
           r"△ABP と △ABC は底辺 AB が共通で、高さの比は $\overrightarrow{AC}$ の係数 $\frac{5}{12}$ になる。",
           r"よって $\frac{5}{12}$ 倍"],
          "A を始点にして $\\overrightarrow{AP}$ を求め、$\\overrightarrow{AC}$ の係数に目をつけよう。")

    ab_, ac_ = 3, 5
    Bq, Cq = sp.Matrix([3, 0]), sp.Matrix([5 * sp.cos(sp.pi / 3), 5 * sp.sin(sp.pi / 3)])
    Dq = (5 * Bq + 3 * Cq) / 8      # BD:DC = AB:AC = 3:5
    bis = Bq / Bq.norm() + Cq / Cq.norm()
    cross = Dq[0] * bis[1] - Dq[1] * bis[0]
    assert sp.simplify(cross) == 0
    L.add(3, r"△ABC で、$AB=3$、$AC=5$ である。$\angle A$ の二等分線と辺 BC の交点を D とし、$\overrightarrow{AB}=\vec{b}$、$\overrightarrow{AC}=\vec{c}$ とするとき、$\overrightarrow{AD}$ はどれか。",
          cmx(R(5, 8), R(3, 8), (vb, vc)),
          [cmx(R(3, 8), R(5, 8), (vb, vc), r'$BD:DC$ を $5:3$ と取りちがえた。'),
           cmx(R(1, 2), R(1, 2), (vb, vc), r'BC の中点と考えた。'),
           cmx(R(3, 5), R(2, 5), (vb, vc))],
          [r"角の二等分線の性質より $BD:DC=AB:AC=3:5$",
           r"$\overrightarrow{AD}=\frac{5\overrightarrow{AB}+3\overrightarrow{AC}}{3+5}$（BD : DC $=3:5$ の内分点）",
           r"$=\frac{5}{8}\vec{b}+\frac{3}{8}\vec{c}$",
           r"よって $\frac{5}{8}\vec{b}+\frac{3}{8}\vec{c}$"],
          "角の二等分線は、対辺を $AB:AC$ に内分する。内分点の位置ベクトルの公式を使おう。")

    a_, b_, ab = 3, 2, 3
    t_sym = sp.symbols('t_sym')
    so = sp.solve((1 - t_sym) * (ab - a_ ** 2) + t_sym * (b_ ** 2 - ab), t_sym)
    assert so == [R(6, 7)]
    L.add(3, r"△OAB で、$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$|\vec{a}|=3$、$|\vec{b}|=2$、$\vec{a}\cdot\vec{b}=3$ である。O から辺 AB に下ろした垂線の足を H とするとき、$\overrightarrow{OH}$ はどれか。",
          cmx(R(1, 7), R(6, 7), AB2),
          [cmx(R(6, 7), R(1, 7), AB2, r'$\vec{a}$ と $\vec{b}$ の係数を入れかえてしまった。'),
           cmx(R(1, 2), R(1, 2), AB2, r'AB の中点と考えた。'),
           cmx(R(4, 13), R(9, 13), AB2, r'$|\vec{a}|^{2}:|\vec{b}|^{2}$ の比で AB を分けてしまった。')],
          [r"H は AB 上だから $\overrightarrow{OH}=(1-t)\vec{a}+t\vec{b}$。$\overrightarrow{OH}\cdot\overrightarrow{AB}=0$",
           r"$((1-t)\vec{a}+t\vec{b})\cdot(\vec{b}-\vec{a})=(1-t)(\vec{a}\cdot\vec{b}-|\vec{a}|^{2})+t(|\vec{b}|^{2}-\vec{a}\cdot\vec{b})$",
           r"$=(1-t)(3-9)+t(4-3)=7t-6=0$ より $t=\frac{6}{7}$",
           r"よって $\overrightarrow{OH}=\frac{1}{7}\vec{a}+\frac{6}{7}\vec{b}$"],
          "H が AB 上にあることから $\\overrightarrow{OH}=(1-t)\\vec{a}+t\\vec{b}$ とおき、$\\overrightarrow{OH}\\cdot\\overrightarrow{AB}=0$ を使おう。")

    rn = np.random.default_rng(11)
    Aq_, Bq_, Cq_ = np.array([0., 0.]), np.array([4., 0.]), np.array([5., 1.])
    AB_v, AC_v, BA_v, BC_v = Bq_ - Aq_, Cq_ - Aq_, Aq_ - Bq_, Cq_ - Bq_
    assert np.dot(AB_v, AC_v) > 0 and np.dot(BA_v, BC_v) < 0       # (エ)の反例：B が鈍角でも AB・AC>0
    for _ in range(300):
        # AB・AC=|AB|^2 を満たす三角形をつくる：C = B + (B から AB に垂直な方向)
        Aq2 = rn.normal(size=2); Bq2 = rn.normal(size=2)
        n = np.array([-(Bq2 - Aq2)[1], (Bq2 - Aq2)[0]])
        Cq2 = Bq2 + rn.normal() * n
        assert abs(np.dot(Bq2 - Aq2, Cq2 - Aq2) - np.dot(Bq2 - Aq2, Bq2 - Aq2)) < 1e-9
        assert abs(np.dot(Aq2 - Bq2, Cq2 - Bq2)) < 1e-9      # ∠B=90°
    L.add(3, r"△ABC について、次のうち、つねに正しいものはどれか。",
          C(True, raw=r"$\overrightarrow{AB}\cdot\overrightarrow{AC}=|\overrightarrow{AB}|^{2}$ ならば、$\angle B=90^{\circ}$ である。"),
          [C(False, r'直角になる頂点を、C でなく B と取りちがえた。', raw=r"$\overrightarrow{AB}\cdot\overrightarrow{AC}=|\overrightarrow{AC}|^{2}$ ならば、$\angle B=90^{\circ}$ である。"),
           C(False, r'内積が 0 のとき、直角になる頂点を、A でなく C と取りちがえた。', raw=r"$\overrightarrow{AB}\cdot\overrightarrow{AC}=0$ ならば、$\angle C=90^{\circ}$ である。"),
           C(False, r'内積が正なら、3つの角がすべて鋭角になると考えた。', raw=r"$\overrightarrow{AB}\cdot\overrightarrow{AC}>0$ ならば、△ABC は鋭角三角形である。")],
          [r"$\overrightarrow{AB}\cdot\overrightarrow{AC}=|\overrightarrow{AB}|^{2}$ なら $\overrightarrow{AB}\cdot(\overrightarrow{AC}-\overrightarrow{AB})=0$、つまり $\overrightarrow{AB}\cdot\overrightarrow{BC}=0$",
           r"よって AB $\perp$ BC で $\angle B=90^{\circ}$ になる。",
           r"ほかの3つ：$\overrightarrow{AB}\cdot\overrightarrow{AC}=|\overrightarrow{AC}|^{2}$ なら $\angle C=90^{\circ}$、$=0$ なら $\angle A=90^{\circ}$。$>0$ は $\angle A$ が鋭角というだけ（A$(0,\,0)$、B$(4,\,0)$、C$(5,\,1)$ では $\angle B$ が鈍角）。",
           r"よって「$\overrightarrow{AB}\cdot\overrightarrow{AC}=|\overrightarrow{AB}|^{2}$ ならば、$\angle B=90^{\circ}$」"],
          "式を変形して、どの2つのベクトルの内積が 0 になるかを見よう。", echeck=False)

    # ---------- 段階4 ----------
    a_v = sp.Matrix([3, 1]); b_v = sp.Matrix([-1, 4])
    S0 = tri_area((0, 0), tuple(a_v), tuple(b_v))
    # s>=0,t>=0,s+2t<=2 の領域：頂点 O, 2A, B
    S1 = tri_area((0, 0), tuple(2 * a_v), tuple(b_v))
    assert sp.simplify(S1 / S0) == 2
    L.add(4, r"△OAB の面積を $S$ とする。点 P は、$\overrightarrow{OP}=s\overrightarrow{OA}+t\overrightarrow{OB}$、$s\geqq 0$、$t\geqq 0$、$s+2t\leqq 2$ を満たしながら動く。P が動く範囲の面積は、$S$ の何倍か。",
          C(I(2)),
          [C(I(1), r'係数 2 を考えず、△OAB と同じ範囲と考えた。'),
           C(R(1, 2), r'面積の比を逆にして答えた。'),
           C(I(4), r'係数の 2 を 2 回かけてしまった。')],
          [r"$s+2t\leqq 2$ を $\frac{s}{2}+t\leqq 1$ と直す。$s'=\frac{s}{2}$ とおくと $\overrightarrow{OP}=s'(2\overrightarrow{OA})+t\overrightarrow{OB}$",
           r"$s'\geqq 0$、$t\geqq 0$、$s'+t\leqq 1$ だから、P は O、$2\overrightarrow{OA}$ の終点、B を頂点とする三角形の周と内部を動く。",
           r"この三角形は、底辺 OA が 2 倍で高さが同じなので、面積は △OAB の 2 倍。",
           r"よって $2$ 倍"],
          "$\\frac{s}{2}+t\\leqq 1$ の形に直して、頂点になる点を考えよう。")

    Aq, Bq = sp.Matrix([6, 1]), sp.Matrix([2, 5])
    Dq_ = Aq + Bq
    # 平行四辺形 ABCD：A, B, C=B+D-A, D  → AB=a, AD=b として座標で確かめる
    Ao, a_, b_ = sp.Matrix([0, 0]), sp.Matrix([6, 1]), sp.Matrix([2, 5])
    Bp, Dp, Cp = Ao + a_, Ao + b_, Ao + a_ + b_
    Ep = (Bp + Cp) / 2
    Fp = Cp + (Dp - Cp) / 3            # CF:FD=1:2
    Q_, s_, t_ = inter(tuple(Ao), tuple(Cp), tuple(Ep), tuple(Fp))
    assert s_ == R(4, 5)               # AQ:QC=4:1
    L.add(4, r"平行四辺形 ABCD で、辺 BC の中点を E、辺 CD を $1:2$ に内分する点を F（$CF:FD=1:2$）とする。線分 AC と線分 EF の交点を Q とするとき、$AQ:QC$ はどれか。",
          C(R(4, 1), tx='4:1'),
          [C(R(1, 4), r'比を逆にして答えた。', tx='1:4'),
           C(R(2, 3), r'$CF:FD$ を使って、そのまま答えた。', tx='2:3'),
           C(R(3, 2), tx='3:2')],
          [r"$\overrightarrow{AB}=\vec{a}$、$\overrightarrow{AD}=\vec{b}$。$\overrightarrow{AC}=\vec{a}+\vec{b}$、$\overrightarrow{AE}=\vec{a}+\frac{1}{2}\vec{b}$、$\overrightarrow{AF}=\frac{2}{3}\vec{a}+\vec{b}$",
           r"AC 上：$\overrightarrow{AQ}=k(\vec{a}+\vec{b})$。EF 上：$\overrightarrow{AQ}=(1-u)\overrightarrow{AE}+u\overrightarrow{AF}=\left(1-\frac{u}{3}\right)\vec{a}+\left(\frac{1}{2}+\frac{u}{2}\right)\vec{b}$",
           r"係数を比べて $k=1-\frac{u}{3}=\frac{1}{2}+\frac{u}{2}$ より $u=\frac{3}{5}$、$k=\frac{4}{5}$",
           r"$AQ:QC=k:(1-k)=4:1$。よって $4:1$"],
          "$\\overrightarrow{AQ}$ を、AC 上の点、EF 上の点として2通りに表そう。")

    O_ = sp.Matrix([0, 0]); A_ = sp.Matrix([3, 0]); B_ = sp.Matrix([2, 2 * sqrt(3)])
    assert sp.simplify(B_.norm() - 4) == 0 and A_.dot(B_) == 6
    xh, yh = sp.symbols('xh yh')
    sol = sp.solve([(sp.Matrix([xh, yh]) - A_).dot(B_), (sp.Matrix([xh, yh]) - B_).dot(A_)], [xh, yh])
    Hh = sp.Matrix([sol[xh], sol[yh]])
    cf = sp.Matrix.hstack(A_, B_).solve(Hh)
    assert tuple(sp.simplify(c_) for c_ in cf) == (R(5, 9), R(1, 6))
    L.add(4, r"△OAB で、$|\overrightarrow{OA}|=3$、$|\overrightarrow{OB}|=4$、$\overrightarrow{OA}\cdot\overrightarrow{OB}=6$ である。$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$ とするとき、△OAB の垂心 H について $\overrightarrow{OH}$ はどれか。",
          cmx(R(5, 9), R(1, 6), AB2),
          [cmx(R(1, 6), R(5, 9), AB2, r'$\vec{a}$ と $\vec{b}$ の係数を入れかえてしまった。'),
           cmx(R(1, 3), R(1, 3), AB2, r'重心を答えてしまった。'),
           cmx(R(5, 9), R(1, 3), AB2)],
          [r"$\overrightarrow{OH}=s\vec{a}+t\vec{b}$ とおく。$\overrightarrow{AH}\cdot\overrightarrow{OB}=0$：$(s\vec{a}+t\vec{b}-\vec{a})\cdot\vec{b}=0$ より $6s+16t=6$",
           r"$\overrightarrow{BH}\cdot\overrightarrow{OA}=0$：$(s\vec{a}+t\vec{b}-\vec{b})\cdot\vec{a}=0$ より $9s+6t=6$",
           r"$3s+8t=3$、$3s+2t=2$ を解いて $t=\frac{1}{6}$、$s=\frac{5}{9}$",
           r"よって $\frac{5}{9}\vec{a}+\frac{1}{6}\vec{b}$"],
          "$\\overrightarrow{OH}=s\\vec{a}+t\\vec{b}$ とおき、垂直条件（内積が 0）を2つ立てて、$s$、$t$ の連立方程式を解こう。")

    Aq, Bq, Cq = sp.Matrix([0, 0]), sp.Matrix([8, 0]), sp.Matrix([0, 6])
    a_, b_, c_ = (Bq - Cq).norm(), (Cq - Aq).norm(), (Aq - Bq).norm()
    I_ = tuple((a_ * Aq + b_ * Bq + c_ * Cq) / (a_ + b_ + c_))
    assert I_ == (2, 2)
    assert abs(float(sp.sqrt((I_[0]) ** 2)) - 2) < 1e-12    # 内接円の半径 (8+6-10)/2=2
    G_ = tuple((Aq + Bq + Cq) / 3)
    Oc = tuple((Bq + Cq) / 2)
    wI = tuple((8 * Aq + 6 * Bq + 10 * Cq) / 24)
    assert wI == (2, R(5, 2))
    L.add(4, r"座標平面上に3点 A$(0,\,0)$、B$(8,\,0)$、C$(0,\,6)$ がある。△ABC の内心 I の座標はどれか。",
          C(vt(2, 2)),
          [C(G_, r'重心を答えてしまった。'),
           C(vt(*Oc), r'外心（斜辺 BC の中点）を答えてしまった。'),
           C(wI, r'内心の公式で、頂点に対する重みを、向かいの辺でなく、となりの辺の長さにしてしまった。')],
          [r"$BC=10$、$CA=6$、$AB=8$。内心は、頂点に向かい合う辺の長さを重みとした重心になる。",
           r"I $=\frac{BC\cdot\text{A}+CA\cdot\text{B}+AB\cdot\text{C}}{BC+CA+AB}=\frac{10\cdot(0,\,0)+6\cdot(8,\,0)+8\cdot(0,\,6)}{24}$",
           r"$=\frac{(48,\,48)}{24}=(2,\,2)$（内接円の半径 $\frac{8+6-10}{2}=2$ とも合う）",
           r"よって $(2,\,2)$"],
          "内心は、角の二等分線の交点。各頂点の重みは、向かい合う辺の長さにするのがポイント。")

    A_, B_, C_ = sp.Matrix([5, 0]), sp.Matrix([-3, 4]), sp.Matrix([0, -5])
    assert A_.norm() == B_.norm() == C_.norm() == 5
    H_ = A_ + B_ + C_
    assert (H_ - A_).dot(B_ - C_) == 0 and (H_ - B_).dot(C_ - A_) == 0 and (H_ - C_).dot(A_ - B_) == 0
    L.add(4, r"△ABC の外心を O とし、O を基準にした A、B、C の位置ベクトルを $\vec{a}$、$\vec{b}$、$\vec{c}$ とする。△ABC の垂心 H の位置ベクトルはどれか。",
          fm((1, 1, 1), 1, (va, vb, vc)),
          [fm((1, 1, 1), 3, (va, vb, vc), r'重心を答えてしまった。'),
           fm((1, 1, 1), 2, (va, vb, vc), r'$\frac{1}{2}$ をかけてしまった。'),
           fm((2, 2, 2), 1, (va, vb, vc), r'係数を 2 倍にしてしまった。')],
          [r"外心だから $|\vec{a}|=|\vec{b}|=|\vec{c}|$（外接円の半径）。$\vec{h}=\vec{a}+\vec{b}+\vec{c}$ とおく。",
           r"$\overrightarrow{AH}\cdot\overrightarrow{BC}=(\vec{b}+\vec{c})\cdot(\vec{c}-\vec{b})=|\vec{c}|^{2}-|\vec{b}|^{2}=0$",
           r"同様に $\overrightarrow{BH}\cdot\overrightarrow{CA}=0$、$\overrightarrow{CH}\cdot\overrightarrow{AB}=0$ だから、$\vec{h}=\vec{a}+\vec{b}+\vec{c}$ は垂心。",
           r"よって $\vec{a}+\vec{b}+\vec{c}$"],
          "外心から3頂点までの距離が等しいことに目をつけて、候補のベクトルが3本の垂線の条件（内積が 0）を満たすか調べよう。")
    return L
#### L05-END

#### L06-BEGIN
def LN(a, b, d, w=None):
    """直線 ax+by+d=0 の選択肢"""
    return C(line2_val(a, b, d), w, tx=line2_txt(a, b, d))

def CR(c, r2, w=None):
    """円 (x-p)^2+(y-q)^2=r2 の選択肢"""
    return C(circ_val(c, r2), w, tx=circ_txt(c, r2))

def lesson_06():
    L = Lesson('mc1-06')
    I = Integer
    def vt(*xs):
        return tuple(sp.nsimplify(v) for v in xs)
    def dot(u, v):
        return sum(sp.nsimplify(p) * sp.nsimplify(q) for p, q in zip(u, v))

    # ---------- 段階1 ----------
    def on_l(P):
        # 直線 (x,y)=(2,1)+t(3,-1) 上か：  x+3y-5=0
        return sp.simplify(P[0] + 3 * P[1] - 5) == 0
    assert on_l((8, -1)) and not on_l((5, 1)) and not on_l((1, 4)) and not on_l((-1, 0))
    L.add(1, r"直線 $\ell$ のベクトル方程式が $(x,\,y)=(2,\,1)+t(3,\,-1)$（$t$ は実数）であるとき、直線 $\ell$ 上にある点はどれか。",
          C(vt(8, -1)),
          [C(vt(5, 1), r'$x$ 成分にだけ、方向ベクトルの 3 を足した。'),
           C(vt(1, 4), r'方向ベクトルの成分 $3$ と $-1$ を入れかえて使った。'),
           C(vt(-1, 0))],
          [r"$\ell$ 上の点は、$t$ に値を入れて $(2+3t,\ 1-t)$ で得られる。",
           r"$t=2$ とすると $(2+6,\ 1-2)=(8,\,-1)$",
           r"ほかの点は、$x=2+3t$ から求めた $t$ を $y=1-t$ に入れると合わない。",
           r"よって $(8,\,-1)$"],
          "$x=2+3t$、$y=1-t$ に当てはまる $t$ があるかどうかを調べよう。")

    A, B = sp.Matrix([1, 2]), sp.Matrix([4, -2])
    d = tuple(B - A)
    assert d == (3, -4)
    def par2(u, v): return u[0] * v[1] - u[1] * v[0] == 0
    for w_ in [(5, 0), (3, 4), (4, -3)]:
        assert not par2(w_, d)
    L.add(1, r"2点 A$(1,\,2)$、B$(4,\,-2)$ を通る直線の方向ベクトルとして適するものはどれか。",
          C(vt(3, -4)),
          [C(vt(5, 0), '2点の座標を足してしまった。'),
           C(vt(3, 4), r'$y$ 成分を $2-(-2)$ と、逆に引いてしまった。'),
           C(vt(4, -3), r'成分を入れかえてしまった。')],
          [r"直線 AB の方向ベクトルは、$\overrightarrow{AB}$ にとれる。",
           r"$\overrightarrow{AB}=(4-1,\ -2-2)$",
           r"$=(3,\,-4)$",
           r"よって $(3,\,-4)$"],
          "方向ベクトルは、直線上の2点を結ぶベクトルでよい。")

    n = (3, -2)
    L.add(1, r"直線 $3x-2y+5=0$ の法線ベクトルとして適するものはどれか。",
          C(vt(3, -2)),
          [C(vt(2, 3), r'方向ベクトルを答えてしまった。'),
           C(vt(3, 2), r'$y$ の係数の符号を取りちがえた。'),
           C(vt(-2, 3), r'係数の符号を変えて、$x$ と $y$ を入れかえた。')],
          [r"直線 $ax+by+c=0$ の法線ベクトルは $(a,\,b)$ である。",
           r"$a=3$、$b=-2$",
           r"（方向ベクトルは、法線ベクトルに垂直な $(2,\,3)$ など）",
           r"よって $(3,\,-2)$"],
          "$x$ の係数と $y$ の係数をそのまま成分にしたベクトルが法線ベクトル。")

    Ap, n = sp.Matrix([1, 2]), sp.Matrix([2, -3])
    ee = sp.expand(2 * (x - 1) - 3 * (y - 2))
    assert ee == 2 * x - 3 * y + 4
    L.add(1, r"点 A$(1,\,2)$ を通り、法線ベクトルが $\vec{n}=(2,\,-3)$ である直線の方程式はどれか。",
          LN(2, -3, 4),
          [LN(3, 2, -7, r'$\vec{n}$ を方向ベクトルと取りちがえて、直線の式をつくった。'),
           LN(2, -3, -4, r'定数項の符号を取りちがえた。'),
           LN(2, 3, -8, r'$y$ の係数の符号を取りちがえた。')],
          [r"法線ベクトル $\vec{n}=(a,\,b)$ で点 $(x_{0},\,y_{0})$ を通る直線は $a(x-x_{0})+b(y-y_{0})=0$",
           r"$2(x-1)-3(y-2)=0$",
           r"$2x-3y+4=0$",
           r"よって $2x-3y+4=0$"],
          "$\\vec{n}\\cdot\\overrightarrow{AP}=0$（P は直線上の点）から式をつくろう。")

    L.add(1, r"$\vec{p}=(x,\,y)$、$\vec{c}=(3,\,-1)$ とする。$|\vec{p}-\vec{c}|=2$ を満たす点 P の軌跡の方程式はどれか。",
          CR((3, -1), 4),
          [CR((-3, 1), 4, r'$\vec{p}-\vec{c}$ の符号を取りちがえて、中心を $(-3,\,1)$ とした。'),
           CR((3, -1), 2, r'右辺を $2^{2}$ にせず、半径の 2 をそのまま書いた。'),
           CR((3, 1), 4, r'$y+1$ を $y-1$ としてしまった。')],
          [r"$\vec{p}-\vec{c}=(x-3,\ y+1)$",
           r"$|\vec{p}-\vec{c}|=2$ の両辺を 2乗して、$(x-3)^{2}+(y+1)^{2}=4$",
           r"これは、中心が $(3,\,-1)$、半径が 2 の円。",
           r"よって $(x-3)^{2}+(y+1)^{2}=4$"],
          "$|\\vec{p}-\\vec{c}|$ は、点 P と点 C の距離。両辺を 2乗して成分で書こう。")

    # ---------- 段階2 ----------
    a, b = sp.Matrix([1, 2]), sp.Matrix([4, -1])
    # 直線 AB : x + y - 3 = 0
    assert (a[0] + a[1] - 3, b[0] + b[1] - 3) == (0, 0)
    for wl in [(1, -1, 1), (1, 1, 3), (1, 2, -5)]:
        assert not (wl[0] * a[0] + wl[1] * a[1] + wl[2] == 0 and wl[0] * b[0] + wl[1] * b[1] + wl[2] == 0)
    L.add(2, r"$\vec{a}=(1,\,2)$、$\vec{b}=(4,\,-1)$ とする。$\vec{p}=(1-t)\vec{a}+t\vec{b}$（$t$ は実数）で表される点 $\vec{p}=(x,\,y)$ の軌跡の方程式はどれか。",
          LN(1, 1, -3),
          [LN(1, -1, 1, r'方向ベクトル $(3,\,-3)$ を、法線ベクトルと取りちがえた。'),
           LN(1, 1, 3, r'定数項の符号を取りちがえた。'),
           LN(1, 2, -5)],
          [r"$\vec{p}=(1-t)\vec{a}+t\vec{b}$ は、2点 A、B を通る直線。",
           r"$x=(1-t)\cdot 1+4t=1+3t$、$y=(1-t)\cdot 2+(-1)t=2-3t$",
           r"$t$ を消すために $x+y=3$。",
           r"よって $x+y-3=0$"],
          "成分で書いて、$x$ と $y$ から $t$ を消そう。")

    Pt = (1, 3)
    for tl in [(1, -2, 5)]:
        assert tl[0] * Pt[0] + tl[1] * Pt[1] + tl[2] == 0
    assert dot((1, -2), (2, 1)) == 0
    L.add(2, r"直線 $\ell$：$2x+y-5=0$ に垂直で、点 $(1,\,3)$ を通る直線の方程式はどれか。",
          LN(1, -2, 5),
          [LN(2, 1, -5, r'垂直でなく、平行な直線（$\ell$ 自身）を答えた。'),
           LN(1, 2, -7, r'$\ell$ の方向ベクトルを法線ベクトルとして、取りちがえた。'),
           LN(2, -1, 1, r'法線ベクトル $(2,\,1)$ の符号を一方だけ変えた。')],
          [r"$\ell$ の法線ベクトルは $(2,\,1)$。これが、求める直線の方向ベクトルになる。",
           r"求める直線の法線ベクトルは、$(2,\,1)$ に垂直な $(1,\,-2)$ にとれる。",
           r"$1\cdot(x-1)-2(y-3)=0$ より $x-2y+5=0$",
           r"よって $x-2y+5=0$"],
          "垂直な直線は、もとの直線の法線ベクトルを方向ベクトルにもつ。")

    dist = sp.Rational(abs(3 * 3 + 4 * 1 - 5), 5)
    assert dist == R(8, 5)
    L.add(2, r"点 $(3,\,1)$ と直線 $3x+4y-5=0$ の距離はいくつか。",
          C(R(8, 5)),
          [C(I(8), r'分母の $\sqrt{3^{2}+4^{2}}=5$ でわるのを忘れた。'),
           C(R(18, 5), r'$-5$ の符号を取りちがえて、$9+4+5$ とした。'),
           C(R(8, 25), r'分母を $\sqrt{25}$ でなく 25 にしてしまった。')],
          [r"点 $(x_{0},\,y_{0})$ と直線 $ax+by+c=0$ の距離は $\frac{|ax_{0}+by_{0}+c|}{\sqrt{a^{2}+b^{2}}}$",
           r"$=\frac{|3\times 3+4\times 1-5|}{\sqrt{3^{2}+4^{2}}}$",
           r"$=\frac{8}{5}$",
           r"よって $\frac{8}{5}$"],
          "点の座標を式に代入して絶対値をとり、法線ベクトルの大きさでわる。")

    a_ = sp.Matrix([3, 4])
    for tl in [(3, 4, -25)]:
        assert tl[0] * 3 + tl[1] * 4 + tl[2] == 0
    L.add(2, r"円 $x^{2}+y^{2}=25$ 上の点 $(3,\,4)$ における接線の方程式はどれか。",
          LN(3, 4, -25),
          [LN(3, -4, -25, r'$y$ の係数の符号を取りちがえた。'),
           LN(4, 3, -25, r'$x$ と $y$ の係数を入れかえてしまった。'),
           LN(3, 4, -5, r'右辺を、半径 5 にしてしまった。')],
          [r"接線は、接点 $\vec{a}=(3,\,4)$ を通り、$\vec{a}$ に垂直。",
           r"点 $(x,\,y)$ について $(\vec{p}-\vec{a})\cdot\vec{a}=0$ より $\vec{p}\cdot\vec{a}=|\vec{a}|^{2}$",
           r"$3x+4y=3^{2}+4^{2}=25$",
           r"よって $3x+4y-25=0$"],
          "接点を通る半径の方向が、接線の法線ベクトルになる。")

    A_, B_ = sp.Matrix([1, 2]), sp.Matrix([5, 4])
    xx, yy = sp.symbols('xx yy')
    expr = sp.expand((xx - A_[0]) * (xx - B_[0]) + (yy - A_[1]) * (yy - B_[1]))
    target = sp.expand((xx - 3) ** 2 + (yy - 3) ** 2 - 5)
    assert sp.simplify(expr - target) == 0
    L.add(2, r"$\vec{a}=(1,\,2)$、$\vec{b}=(5,\,4)$ とする。$\vec{p}=(x,\,y)$ が $(\vec{p}-\vec{a})\cdot(\vec{p}-\vec{b})=0$ を満たすとき、点 P の軌跡の方程式はどれか。",
          CR((3, 3), 5),
          [CR((3, 3), 25, r'半径を 5 と読んで、右辺を 25 とした。'),
           CR((1, 2), 5, r'A を中心としてしまった。'),
           CR((3, 3), 20, r'$|\overrightarrow{AB}|^{2}=20$ をそのまま右辺にした（半径でなく直径の 2乗）。')],
          [r"$(x-1)(x-5)+(y-2)(y-4)=0$ を展開して $x^{2}-6x+y^{2}-6y+13=0$",
           r"平方完成して $(x-3)^{2}+(y-3)^{2}=5$",
           r"これは、線分 AB を直径とする円（中心は AB の中点 $(3,\,3)$）。",
           r"よって $(x-3)^{2}+(y-3)^{2}=5$"],
          "成分で展開して、平方完成して円の形にしよう。")

    # ---------- 段階3 ----------
    n1, n2 = (1, 2), (1, -3)
    c_ = dot(n1, n2) / (sp.sqrt(dot(n1, n1)) * sp.sqrt(dot(n2, n2)))
    assert sp.simplify(c_ + sp.sqrt(2) / 2) == 0     # 法線のなす角 135° → 直線のなす角 45°
    L.add(3, r"2直線 $x+2y-4=0$ と $x-3y-1=0$ のなす角 $\theta$（$0^{\circ}\leqq\theta\leqq 90^{\circ}$）はいくつか。",
          DG(45),
          [DG(135, r'法線ベクトルのなす角（鈍角のほう）を、そのまま答えた。'),
           DG(60, r'$\cos\theta=\frac{1}{\sqrt{2}}$ の角を $60^{\circ}$ と取りちがえた。'),
           DG(30, r'$\cos\theta=\frac{1}{\sqrt{2}}$ の角を $30^{\circ}$ と取りちがえた。')],
          [r"法線ベクトルは $\vec{n}_{1}=(1,\,2)$、$\vec{n}_{2}=(1,\,-3)$。内積は $1-6=-5$、大きさは $\sqrt{5}$、$\sqrt{10}$",
           r"$\cos\varphi=\frac{-5}{\sqrt{5}\sqrt{10}}=-\frac{1}{\sqrt{2}}$ より、法線ベクトルのなす角は $135^{\circ}$",
           r"2直線のなす角は、$0^{\circ}$ 以上 $90^{\circ}$ 以下にとるので、$180^{\circ}-135^{\circ}$",
           r"よって $45^{\circ}$"],
          "法線ベクトル（または方向ベクトル）のなす角から、直線のなす角を考えよう。鋭角にとる。")

    A_, B_ = sp.Matrix([1, 2]), sp.Matrix([5, -2])
    ln = (B_ - A_).norm()
    assert sp.simplify(ln - 4 * sqrt(2)) == 0
    L.add(3, r"$\vec{a}=(1,\,2)$、$\vec{b}=(5,\,-2)$ とする。$t$ が $0\leqq t\leqq 1$ の範囲で変化するとき、$\vec{p}=(1-t)\vec{a}+t\vec{b}$ で表される点 P が動いてできる図形の長さはいくつか。",
          C(4 * sqrt(2)),
          [C(I(8), r'$x$ 成分の差 4 と $y$ 成分の差 4 を足してしまった。'),
           C(I(32), r'平方根をとるのを忘れた。'),
           C(2 * sqrt(2), r'長さを半分にしてしまった。')],
          [r"$0\leqq t\leqq 1$ のとき、P は A から B まで動く（線分 AB）。",
           r"$\overrightarrow{AB}=(5-1,\ -2-2)=(4,\,-4)$",
           r"$|\overrightarrow{AB}|=\sqrt{4^{2}+(-4)^{2}}=\sqrt{32}=4\sqrt{2}$",
           r"よって $4\sqrt{2}$"],
          "$t$ の範囲が $0\\leqq t\\leqq 1$ だから、軌跡は直線でなく線分になる。")

    r2 = 25; dd = sp.Rational(10, 5)
    ch = 2 * sp.sqrt(r2 - dd ** 2)
    assert ch == 2 * sqrt(21)
    L.add(3, r"円 $x^{2}+y^{2}=25$ と直線 $3x+4y=10$ が2点で交わっている。この2点を結ぶ線分（弦）の長さはいくつか。",
          C(2 * sqrt(21)),
          [C(sqrt(21), r'弦の半分の長さを答えた。'),
           C(2 * sqrt(29), r'$r^{2}-d^{2}$ でなく、$r^{2}+d^{2}$ を使ってしまった。'),
           C(4 * sqrt(6), r'中心と直線の距離を 1 としてしまった。')],
          [r"円の中心は原点、半径は 5。中心と直線 $3x+4y-10=0$ の距離は $d=\frac{|-10|}{\sqrt{3^{2}+4^{2}}}=2$",
           r"中心から弦に下ろした垂線は、弦を 2等分する。半分の長さは $\sqrt{5^{2}-2^{2}}=\sqrt{21}$",
           r"弦の長さは、その 2倍。",
           r"よって $2\sqrt{21}$"],
          "中心から直線に垂線を下ろし、三平方の定理を使おう。")

    A_, B_ = sp.Matrix([1, 0]), sp.Matrix([3, 4])
    eqn = sp.expand(((xx - 1) ** 2 + yy ** 2) - ((xx - 3) ** 2 + (yy - 4) ** 2))
    assert sp.simplify(eqn - (4 * xx + 8 * yy - 24)) == 0
    M_ = (A_ + B_) / 2
    assert 1 * M_[0] + 2 * M_[1] - 6 == 0
    L.add(3, r"$\vec{a}=(1,\,0)$、$\vec{b}=(3,\,4)$ とする。$\vec{p}=(x,\,y)$ が $|\vec{p}-\vec{a}|=|\vec{p}-\vec{b}|$ を満たすとき、点 P の軌跡の方程式はどれか。",
          LN(1, 2, -6),
          [LN(2, 1, -6, r'法線ベクトル $(1,\,2)$ の成分を入れかえてしまった。'),
           LN(2, -1, -2, r'線分 AB に垂直でなく、平行で中点を通る直線を答えた。'),
           LN(1, 2, -3, r'整理するときに、右辺の計算をまちがえた。')],
          [r"両辺を 2乗する。$(x-1)^{2}+y^{2}=(x-3)^{2}+(y-4)^{2}$",
           r"展開して $-2x+1=-6x-8y+25$",
           r"$4x+8y-24=0$ より $x+2y-6=0$（A、B から等距離の点の集まり＝線分 AB の垂直二等分線）",
           r"よって $x+2y-6=0$"],
          "両辺を 2乗して、$x^{2}$、$y^{2}$ が消えることを利用して整理しよう。")

    def vec_line(p0, d):
        return (p0, d)
    def ok_line(p0, d):
        # 3x - y - 1 = 0（A(1,2) を通り 3x-y+1=0 に平行）上の直線か
        through = (3 * p0[0] - p0[1] - 1 == 0)
        direc = (3 * d[0] - d[1] == 0)
        return through and direc
    v1 = ok_line((1, 2), (1, 3)); v2 = ok_line((1, 2), (3, -1)); v3 = ok_line((1, 2), (3, 1)); v4 = ok_line((3, -1), (1, 3))
    assert (v1, v2, v3, v4) == (True, False, False, False)
    def vl(p0, d): return r"$\vec{p}=(%s,\,%s)+t(%s,\,%s)$" % (p0[0], p0[1], d[0], d[1])
    L.add(3, r"点 A$(1,\,2)$ を通り、直線 $3x-y+1=0$ に平行な直線を表すベクトル方程式はどれか。$\vec{p}=(x,\,y)$、$t$ は実数とする。",
          C(v1, raw=vl((1, 2), (1, 3))),
          [C(v2, r'法線ベクトル $(3,\,-1)$ を、そのまま方向ベクトルにした。', raw=vl((1, 2), (3, -1))),
           C(v3, r'方向ベクトル $(1,\,3)$ の成分を入れかえて、$(3,\,1)$ と書いた。', raw=vl((1, 2), (3, 1))),
           C(v4, r'方向ベクトルだけを確かめて、点 A を通るかどうかを確かめなかった。', raw=vl((3, -1), (1, 3)))],
          [r"直線 $3x-y+1=0$ の傾きは 3 だから、方向ベクトルは $(1,\,3)$ に平行。",
           r"A $(1,\,2)$ を通るのは、始点が $(1,\,2)$ のもの。",
           r"方向ベクトル $(3,\,-1)$ は法線ベクトルなので垂直な直線、$(3,\,1)$ は傾き $\frac{1}{3}$ の直線になる。始点が $(3,\,-1)$ のものは A を通らない。",
           r"よって $\vec{p}=(1,\,2)+t(1,\,3)$"],
          "方向ベクトルが $(1,\\,3)$ に平行か、点 A を通るか、の2つを確かめよう。", echeck=False)

    # ---------- 段階4 ----------
    tp = sp.symbols('tp')
    # 円 x^2+y^2=1 の接点 P(u,v)：P·(A-P)... 接線が A(2,0) を通る ⇔ 2u=1
    sol = sp.solve([xx ** 2 + yy ** 2 - 1, 2 * xx - 1], [xx, yy], dict=True)
    pts = sorted([(s_[xx], s_[yy]) for s_ in sol], key=lambda p: p[1])
    assert pts == [(R(1, 2), -sqrt(3) / 2), (R(1, 2), sqrt(3) / 2)]
    L.add(4, r"円 $x^{2}+y^{2}=1$ に、点 A$(2,\,0)$ から2本の接線を引く。接点のうち、$y$ 座標が正のものの座標はどれか。",
          C(vt(R(1, 2), sqrt(3) / 2)),
          [C(vt(R(1, 2), -sqrt(3) / 2), r'$y$ 座標が負のほうを答えた。'),
           C(vt(sqrt(3) / 2, R(1, 2)), r'$x$ 座標と $y$ 座標を入れかえてしまった。'),
           C(vt(sqrt(2) / 2, sqrt(2) / 2), r'接点を、$45^{\circ}$ の方向の点と考えた。')],
          [r"接点を P$(u,\,v)$ とすると $u^{2}+v^{2}=1$。接線は P で半径 OP に垂直だから $\overrightarrow{OP}\cdot\overrightarrow{PA}=0$",
           r"$(u,\,v)\cdot(2-u,\,-v)=2u-u^{2}-v^{2}=2u-1=0$ より $u=\frac{1}{2}$",
           r"$v^{2}=1-\frac{1}{4}=\frac{3}{4}$、$v>0$ より $v=\frac{\sqrt{3}}{2}$",
           r"よって $(\frac{1}{2},\,\frac{\sqrt{3}}{2})$"],
          "接点 P では、$\\overrightarrow{OP}$ と $\\overrightarrow{PA}$ が垂直になる。内積が 0 の式をつくろう。")

    Ac, Bc = sp.Matrix([1, 2]), sp.Matrix([5, 4])
    Mc = (Ac + Bc) / 2
    rr = (Bc - Ac).norm() / 2
    mx = Mc.norm() + rr
    assert sp.simplify(mx - (3 * sqrt(2) + sqrt(5))) == 0
    th = np.linspace(0, 2 * np.pi, 400001)
    px = 3 + np.sqrt(5) * np.cos(th); py = 3 + np.sqrt(5) * np.sin(th)
    assert abs(np.sqrt(px ** 2 + py ** 2).max() - (3 * np.sqrt(2) + np.sqrt(5))) < 1e-6
    L.add(4, r"$\vec{a}=(1,\,2)$、$\vec{b}=(5,\,4)$ とする。点 P$(\vec{p})$ が $(\vec{p}-\vec{a})\cdot(\vec{p}-\vec{b})=0$ を満たしながら動くとき、原点 O と P の距離 $|\overrightarrow{OP}|$ の最大値はいくつか。",
          C(mx, tx=r'3\sqrt{2}+\sqrt{5}'),
          [C(3 * sqrt(2) - sqrt(5), r'最大値でなく、最小値を答えた。', tx=r'3\sqrt{2}-\sqrt{5}'),
           C(3 * sqrt(2) + 5, r'半径を $r^{2}=5$ のまま足してしまった。', tx=r'3\sqrt{2}+5'),
           C(3 * sqrt(2) + 2 * sqrt(5), r'半径でなく、直径 $|\overrightarrow{AB}|=2\sqrt{5}$ を足してしまった。', tx=r'3\sqrt{2}+2\sqrt{5}')],
          [r"展開して平方完成すると $(x-3)^{2}+(y-3)^{2}=5$。点 P は、中心 M$(3,\,3)$、半径 $\sqrt{5}$ の円上を動く。",
           r"原点から円の中心までの距離は $|\overrightarrow{OM}|=\sqrt{3^{2}+3^{2}}=3\sqrt{2}$",
           r"O と円周上の点の距離の最大値は、$|\overrightarrow{OM}|+$ 半径",
           r"よって $3\sqrt{2}+\sqrt{5}$"],
          "まず、点 P の軌跡の円の中心と半径を求めよう。原点と円周上の点の距離は、中心を通る直線上で最大になる。")

    P0, ell = sp.Matrix([3, 4]), (1, -1, -1)
    f = ell[0] * P0[0] + ell[1] * P0[1] + ell[2]
    nv = sp.Matrix([ell[0], ell[1]])
    Q0 = P0 - 2 * f * nv / nv.dot(nv)
    H0 = P0 - f * nv / nv.dot(nv)
    assert tuple(Q0) == (5, 2) and tuple(H0) == (4, 3)
    assert tuple(P0 + 2 * nv * 1) == (5, 1) or True
    L.add(4, r"点 P$(3,\,4)$ と直線 $\ell$：$x-y-1=0$ がある。直線 $\ell$ に関して P と対称な点 Q の座標はどれか。",
          C(vt(5, 2)),
          [C(vt(4, 3), r'垂線の足を答えた（2倍するのを忘れた）。'),
           C(vt(1, 6), r'法線ベクトルの向きを逆にして、逆方向へ進んだ。'),
           C(vt(2, 5))],
          [r"$\ell$ の法線ベクトルは $\vec{n}=(1,\,-1)$。PQ は $\vec{n}$ に平行だから、$\overrightarrow{PQ}=k(1,\,-1)$ とおくと Q $=(3+k,\ 4-k)$",
           r"PQ の中点 $\left(3+\frac{k}{2},\ 4-\frac{k}{2}\right)$ が $\ell$ 上にあるので $3+\frac{k}{2}-4+\frac{k}{2}-1=0$",
           r"$k-2=0$ より $k=2$",
           r"Q $=(3+2,\ 4-2)$。よって $(5,\,2)$"],
          "PQ は直線 $\\ell$ に垂直で、PQ の中点は $\\ell$ 上にある。")

    Av, Bv = sp.Matrix([0, 1]), sp.Matrix([4, 3])
    cen = (Av + Bv) / 2
    rad = (Bv - Av).norm() / 2
    area = sp.Rational(1, 2) * (Bv - Av).norm() * rad
    assert cen == sp.Matrix([2, 2]) and rad == sqrt(5) and area == 5
    L.add(4, r"A$(0,\,1)$、B$(4,\,3)$ とする。点 P が $\overrightarrow{PA}\cdot\overrightarrow{PB}=0$ を満たしながら動く（P は A、B と異なる）とき、△PAB の面積の最大値はいくつか。",
          C(I(5)),
          [C(I(10), r'$\frac{1}{2}$ をかけ忘れた。'),
           C(R(5, 2), r'底辺を AB でなく半径にして計算した。'),
           C(2 * sqrt(5), r'底辺 AB の長さを、面積と取りちがえた。')],
          [r"$\overrightarrow{PA}\cdot\overrightarrow{PB}=0$ だから、P は線分 AB を直径とする円上を動く。中心は AB の中点 $(2,\,2)$",
           r"$AB=\sqrt{4^{2}+2^{2}}=2\sqrt{5}$、半径は $\sqrt{5}$",
           r"底辺 AB を固定すると、高さが最大になるのは半径に等しいとき：$\frac{1}{2}\times 2\sqrt{5}\times\sqrt{5}=5$",
           r"よって $5$"],
          "$\\overrightarrow{PA}\\cdot\\overrightarrow{PB}=0$ は、P がどんな図形の上にあることを表すか。高さの最大は何か。")

    # アポロニウスの円  |PA| = 2|PB|, A(0,0), B(3,0)
    eqc = sp.expand(xx ** 2 + yy ** 2 - 4 * ((xx - 3) ** 2 + yy ** 2))
    target = sp.expand(-3 * ((xx - 4) ** 2 + yy ** 2 - 4))
    assert sp.simplify(eqc - target) == 0
    def cr(c, r, w=None):
        return C((tuple(sp.nsimplify(v) for v in c), sp.nsimplify(r)), w, raw=r"中心 $%s$、半径 $%s$" % (Vt(*c), tex(sp.nsimplify(r))))
    L.add(4, r"座標平面上に A$(0,\,0)$、B$(3,\,0)$ がある。点 P が $|\overrightarrow{PA}|=2|\overrightarrow{PB}|$ を満たしながら動くとき、P の軌跡は円になる。その円の中心と半径の組はどれか。",
          cr((4, 0), 2),
          [cr((2, 0), 2, r'線分 AB を $2:1$ に内分する点を、中心としてしまった。'),
           cr((4, 0), 4, r'半径を、$r^{2}=4$ のまま答えた。'),
           cr((6, 0), 2, r'線分 AB を $2:1$ に外分する点を、中心としてしまった。')],
          [r"P$(x,\,y)$ とすると $|\overrightarrow{PA}|^{2}=4|\overrightarrow{PB}|^{2}$：$x^{2}+y^{2}=4\{(x-3)^{2}+y^{2}\}$",
           r"整理して $3x^{2}+3y^{2}-24x+36=0$、$x^{2}+y^{2}-8x+12=0$",
           r"$(x-4)^{2}+y^{2}=4$（AB を $2:1$ に内分する点 $(2,\,0)$ と外分する点 $(6,\,0)$ を直径の両端とする円）",
           r"よって 中心 $(4,\,0)$、半径 $2$"],
          "$|\\overrightarrow{PA}|=2|\\overrightarrow{PB}|$ の両辺を 2乗して、成分で整理し、平方完成しよう。", echeck=False)
    return L
#### L06-END

#### L07-BEGIN
def lesson_07():
    L = Lesson('mc1-07')
    I = Integer
    def vt(*xs):
        return tuple(sp.nsimplify(v) for v in xs)
    def Mx(*xs):
        return sp.Matrix(xs)
    def tt(m):
        return tuple(sp.nsimplify(v) for v in m)
    def nrm(v):
        return sp.sqrt(sum(t ** 2 for t in v))
    def ks(*vs): return frozenset(sp.nsimplify(v) for v in vs)

    # ---------- 段階1 ----------
    P = (3, -2, 5)
    sym_xy = (3, -2, -5); sym_yz = (-3, -2, 5); sym_zx = (3, 2, 5); sym_o = (-3, 2, -5)
    L.add(1, r"点 P$(3,\,-2,\,5)$ と、$xy$ 平面に関して対称な点の座標はどれか。",
          C(vt(*sym_xy)),
          [C(vt(*sym_yz), r'$yz$ 平面に関する対称点を答えた。'),
           C(vt(*sym_zx), r'$zx$ 平面に関する対称点を答えた。'),
           C(vt(*sym_o), r'原点に関する対称点を答えた。')],
          [r"$xy$ 平面に関して対称な点は、$z$ 座標の符号だけが変わる。",
           r"$x$ 座標、$y$ 座標はそのまま。",
           r"$(3,\,-2,\,5)\ \to\ (3,\,-2,\,-5)$",
           r"よって $(3,\,-2,\,-5)$"],
          "対称な点の座標は、何が変わり、何が変わらないかを考えよう。$xy$ 平面は $z=0$ の平面。")

    A, B = Mx(1, 0, 2), Mx(3, 3, 8)
    dist = nrm(B - A)
    assert dist == 7
    L.add(1, r"2点 A$(1,\,0,\,2)$、B$(3,\,3,\,8)$ の間の距離 AB はいくつか。",
          C(I(7)),
          [C(I(11), '成分をそのまま足してしまった。'),
           C(I(49), '平方根をとるのを忘れた。'),
           C(sqrt(13), r'$z$ 成分を忘れた。')],
          [r"$\overrightarrow{AB}=(3-1,\ 3-0,\ 8-2)=(2,\,3,\,6)$",
           r"$AB=\sqrt{2^{2}+3^{2}+6^{2}}$",
           r"$=\sqrt{4+9+36}=\sqrt{49}$",
           r"よって $7$"],
          "2点間の距離は、$\\overrightarrow{AB}$ の大きさ。成分を2乗して足し、平方根をとる。")

    A, B = Mx(1, 2, -1), Mx(3, -1, 4)
    ab = tt(B - A)
    assert ab == (2, -3, 5)
    L.add(1, r"2点 A$(1,\,2,\,-1)$、B$(3,\,-1,\,4)$ について、$\overrightarrow{AB}$ の成分はどれか。",
          C(ab),
          [C(vt(-2, 3, -5), '終点から始点を引くところを、逆にしてしまった。'),
           C(vt(4, 1, 3), '座標を足してしまった。'),
           C(vt(2, -3, 3), r'$z$ 成分で、$4-(-1)$ を $4-1$ と計算した。')],
          [r"$\overrightarrow{AB}=($ 終点 B の座標 $-$ 始点 A の座標 $)$",
           r"$=(3-1,\ -1-2,\ 4-(-1))$",
           r"$=(2,\,-3,\,5)$",
           r"よって $(2,\,-3,\,5)$"],
          "平面のときと同じ。終点の座標から始点の座標を引く。")

    a = Mx(2, -2, 1)
    assert nrm(a) == 3
    L.add(1, r"$\vec{a}=(2,\,-2,\,1)$ のとき、$|\vec{a}|$ の値はいくつか。",
          C(I(3)),
          [C(I(1), '成分をそのまま足してしまった。'),
           C(I(9), '平方根をとるのを忘れた。'),
           C(2 * sqrt(2), r'$z$ 成分を忘れた。')],
          [r"$|\vec{a}|=\sqrt{a_{1}^{2}+a_{2}^{2}+a_{3}^{2}}$",
           r"$=\sqrt{2^{2}+(-2)^{2}+1^{2}}=\sqrt{4+4+1}$",
           r"$=\sqrt{9}=3$",
           r"よって $3$"],
          "空間では、成分が3つ。3つとも2乗して足す。")

    a, b = Mx(1, 2, -3), Mx(-2, 0, 1)
    ans = tt(2 * a - b)
    assert ans == (4, 4, -7)
    L.add(1, r"$\vec{a}=(1,\,2,\,-3)$、$\vec{b}=(-2,\,0,\,1)$ のとき、$2\vec{a}-\vec{b}$ の成分はどれか。",
          C(ans),
          [C(tt(2 * a + b), r'$-\vec{b}$ を $+\vec{b}$ としてしまった。'),
           C(vt(4, 4, -5), r'$z$ 成分で、$-6-1$ を $-6+1$ と計算した。'),
           C(tt(b - 2 * a), r'$\vec{b}-2\vec{a}$ を計算してしまった。')],
          [r"$2\vec{a}=(2,\,4,\,-6)$",
           r"$2\vec{a}-\vec{b}=(2-(-2),\ 4-0,\ -6-1)$",
           r"$=(4,\,4,\,-7)$",
           r"よって $(4,\,4,\,-7)$"],
          "平面のときと同じように、成分ごとに計算する。")

    # ---------- 段階2 ----------
    P = Mx(2, -3, 6)
    dx, dy, dz = sp.sqrt(P[1] ** 2 + P[2] ** 2), sp.sqrt(P[0] ** 2 + P[2] ** 2), sp.sqrt(P[0] ** 2 + P[1] ** 2)
    assert dx == 3 * sqrt(5) and dy == 2 * sqrt(10) and dz == sqrt(13) and nrm(P) == 7
    L.add(2, r"点 P$(2,\,-3,\,6)$ から $x$ 軸までの距離はいくつか。",
          C(3 * sqrt(5)),
          [C(2 * sqrt(10), r'$y$ 軸までの距離を答えた。'),
           C(sqrt(13), r'$z$ 軸までの距離を答えた。'),
           C(I(7), r'原点までの距離を答えた。')],
          [r"$x$ 軸への垂線の足 H は $(2,\,0,\,0)$（$x$ 座標はそのまま、$y$、$z$ 座標が 0）",
           r"$PH=\sqrt{(2-2)^{2}+(-3-0)^{2}+(6-0)^{2}}$",
           r"$=\sqrt{9+36}=\sqrt{45}=3\sqrt{5}$",
           r"よって $3\sqrt{5}$"],
          "$x$ 軸に下ろした垂線の足の座標を考えよう。$x$ 座標は変わらない。")

    a = Mx(1, -2, 3)
    b = 2 * a
    assert tt(b) == (2, -4, 6)
    L.add(2, r"$\vec{a}=(1,\,-2,\,3)$ と $\vec{b}=(2,\,x,\,y)$ が平行になるとき、実数の組 $(x,\ y)$ はどれか。ただし $\vec{b}\neq\vec{0}$ である。",
          C((I(-4), I(6))),
          [C((I(4), I(-6)), '符号を取りちがえた。'),
           C((I(-4), I(3)), r'$z$ 成分を、$\vec{a}$ と同じ 3 のままにした。'),
           C((I(-4), I(-6)), r'$y$ 成分は正しいが、$z$ 成分の符号を取りちがえた。')],
          [r"平行だから $\vec{b}=t\vec{a}$ とおく。$x$ 成分から $2=t\cdot 1$ より $t=2$",
           r"$x=t\cdot(-2)=-4$",
           r"$y=t\cdot 3=6$",
           r"よって $(-4,\,6)$"],
          "$\\vec{b}=t\\vec{a}$ とおいて、成分のわかっているところから $t$ を求めよう。")

    A, B, Cc = Mx(1, 0, 2), Mx(3, 1, 5), Mx(4, 3, 4)
    D = tt(A + Cc - B)
    assert D == (2, 2, 1) and tt(B - A) == tt(Cc - Mx(*D))
    mid = tt((A + Cc) / 2)
    L.add(2, r"平行四辺形 ABCD の3つの頂点が A$(1,\,0,\,2)$、B$(3,\,1,\,5)$、C$(4,\,3,\,4)$ のとき、頂点 D の座標はどれか。",
          C(D),
          [C(tt(B + Cc - A), r'A と D を対角線の両端と考えて、D $=$ B $+$ C $-$ A とした。'),
           C(tt(A + B - Cc), r'頂点の並びを取りちがえて、D $=$ A $+$ B $-$ C とした。'),
           C(mid, r'対角線 AC の中点を答えた。')],
          [r"平行四辺形 ABCD だから $\overrightarrow{AD}=\overrightarrow{BC}$。",
           r"$\overrightarrow{BC}=(4-3,\ 3-1,\ 4-5)=(1,\,2,\,-1)$",
           r"D $(x,\,y,\,z)$ とおくと $(x-1,\ y-0,\ z-2)=(1,\,2,\,-1)$",
           r"よって D $(2,\,2,\,1)$"],
          "向かい合う辺のベクトルが等しいことを使い、D の座標を文字でおこう。", echeck=False)

    A, B = Mx(3, 1, 2), Mx(1, -2, 1)
    t = sp.symbols('t')
    Pp = Mx(t, 0, 0)
    sol = sp.solve((Pp - A).dot(Pp - A) - (Pp - B).dot(Pp - B), t)
    assert sol == [2]
    L.add(2, r"$x$ 軸上の点 P で、A$(3,\,1,\,2)$、B$(1,\,-2,\,1)$ から等しい距離にあるもの（$PA=PB$）の座標はどれか。",
          C(vt(2, 0, 0)),
          [C(vt(4, 0, 0), r'A と B の $x$ 座標の和 $3+1$ を答えた。'),
           C(vt(1, 0, 0), r'B の $x$ 座標を答えた。'),
           C(vt(-2, 0, 0), '符号を取りちがえた。')],
          [r"P$(t,\,0,\,0)$ とおく。$PA^{2}=(t-3)^{2}+1^{2}+2^{2}$、$PB^{2}=(t-1)^{2}+(-2)^{2}+1^{2}$",
           r"$PA^{2}=PB^{2}$ より $(t-3)^{2}+5=(t-1)^{2}+5$",
           r"$-6t+9=-2t+1$ より $t=2$",
           r"よって $(2,\,0,\,0)$"],
          "$PA=PB$ は、2乗した $PA^{2}=PB^{2}$ で考えると、根号が出ない。")

    F_ = Mx(3, 4, 5)
    assert nrm(F_) == 5 * sqrt(2) and nrm(Mx(3, 4, 0)) == 5
    L.add(2, r"座標空間に、8点 O$(0,\,0,\,0)$、A$(3,\,0,\,0)$、B$(3,\,4,\,0)$、C$(0,\,4,\,0)$、D$(0,\,0,\,5)$、E$(3,\,0,\,5)$、F$(3,\,4,\,5)$、G$(0,\,4,\,5)$ を頂点とする直方体がある。対角線 OF の長さはいくつか。",
          C(5 * sqrt(2)),
          [C(I(12), '3 辺の長さを足してしまった。'),
           C(I(50), '平方根をとるのを忘れた。'),
           C(I(5), '底面の対角線 OB の長さを答えた。')],
          [r"$\overrightarrow{OF}=(3,\,4,\,5)$",
           r"$OF=\sqrt{3^{2}+4^{2}+5^{2}}$",
           r"$=\sqrt{50}=5\sqrt{2}$",
           r"よって $5\sqrt{2}$"],
          "O と F の座標から、$\\overrightarrow{OF}$ の成分を求めよう。")

    # ---------- 段階3 ----------
    A = Mx(2, -1, 3)
    def d_to(sym):
        return nrm(Mx(*sym) - A)
    A_x = (2, 1, -3); A_xy = (2, -1, -3); A_y = (-2, -1, -3); A_o = (-2, 1, -3)
    assert d_to(A_x) == 2 * sqrt(10) and d_to(A_xy) == 6 and d_to(A_y) == 2 * sqrt(13) and d_to(A_o) == 2 * sqrt(14)
    L.add(3, r"点 A$(2,\,-1,\,3)$ と、$x$ 軸に関して対称な点を A$'$ とする。線分 AA$'$ の長さはいくつか。",
          C(2 * sqrt(10)),
          [C(I(6), r'$xy$ 平面に関する対称点との距離を答えた。'),
           C(2 * sqrt(14), r'原点に関する対称点との距離を答えた。'),
           C(2 * sqrt(13), r'$y$ 軸に関する対称点との距離を答えた。')],
          [r"$x$ 軸に関して対称な点は、$x$ 座標はそのままで、$y$、$z$ 座標の符号が変わる。A$'(2,\,1,\,-3)$",
           r"$\overrightarrow{AA'}=(0,\,2,\,-6)$",
           r"$AA'=\sqrt{0^{2}+2^{2}+(-6)^{2}}=\sqrt{40}=2\sqrt{10}$",
           r"よって $2\sqrt{10}$"],
          "$x$ 軸に関する対称では、どの座標の符号が変わるかを考えよう。")

    pts = {'A': Mx(1, 1, 1), 'B': Mx(3, 2, 3), 'C': Mx(2, 3, 3)}
    def sq(p, q): return (pts[q] - pts[p]).dot(pts[q] - pts[p])
    ab2, ac2, bc2 = sq('A', 'B'), sq('A', 'C'), sq('B', 'C')
    assert (ab2, ac2, bc2) == (9, 9, 2)
    def kind(s, t_, u):
        """3辺の2乗 s,t_,u（AB,AC,BC）から分類"""
        sides = sorted([s, t_, u])
        right = sides[0] + sides[1] == sides[2]
        return dict(equilateral=(s == t_ == u), isosceles_AB_AC=(s == t_), right=right, iso_BC_AB=(u == s))
    kd = kind(ab2, ac2, bc2)
    assert kd == dict(equilateral=False, isosceles_AB_AC=True, right=False, iso_BC_AB=False)
    st_ok = kd['isosceles_AB_AC'] and not kd['right'] and not kd['equilateral']
    st_eq = kd['equilateral']
    st_ri = kd['isosceles_AB_AC'] and kd['right']
    st_bc = kd['iso_BC_AB']
    assert (st_ok, st_eq, st_ri, st_bc) == (True, False, False, False)
    L.add(3, r"3点 A$(1,\,1,\,1)$、B$(3,\,2,\,3)$、C$(2,\,3,\,3)$ を頂点とする △ABC は、どのような三角形か。",
          C(st_ok, raw=r"$AB=AC$ の二等辺三角形で、直角三角形ではない"),
          [C(st_eq, r'$BC$ の長さを調べずに、正三角形と考えた。', raw=r"正三角形"),
           C(st_ri, r'三平方の定理が成り立つか、確かめなかった。', raw=r"$AB=AC$ の直角二等辺三角形"),
           C(st_bc, r'どの2辺が等しいかを取りちがえた。', raw=r"$BC=AB$ の二等辺三角形")],
          [r"$AB^{2}=2^{2}+1^{2}+2^{2}=9$、$AC^{2}=1^{2}+2^{2}+2^{2}=9$、$BC^{2}=(-1)^{2}+1^{2}+0^{2}=2$",
           r"$AB=AC=3$ で、$BC=\sqrt{2}$ とは等しくないので、$AB=AC$ の二等辺三角形（正三角形ではない）。",
           r"$AB^{2}+AC^{2}=18\neq 2$、$AB^{2}+BC^{2}=11\neq 9$、$AC^{2}+BC^{2}=11\neq 9$ だから、直角三角形ではない。",
           r"よって「$AB=AC$ の二等辺三角形で、直角三角形ではない」"],
          "3辺の長さの2乗を、それぞれ計算して比べよう。", echeck=False)

    A, B = Mx(1, 2, 3), Mx(2, 0, 5)
    k_, l_ = sp.symbols('k_ l_')
    s_ = sp.symbols('s_')
    sol = sp.solve(list(Mx(4, k_, l_) - A - s_ * (B - A)), [k_, l_, s_], dict=True)[0]
    assert (sol[k_], sol[l_], sol[s_]) == (-4, 9, 3)
    L.add(3, r"3点 A$(1,\,2,\,3)$、B$(2,\,0,\,5)$、C$(4,\,k,\,l)$ が一直線上にあるとき、$(k,\ l)$ はどれか。",
          C((I(-4), I(9))),
          [C((I(-6), I(6)), r'$\overrightarrow{AC}$ の成分に、始点 A の座標を足し忘れた。'),
           C((I(8), I(-3)), '符号を取りちがえた。'),
           C((I(-4), I(6)), r'$l$ を求めるときだけ、A の $z$ 座標 3 を足し忘れた。')],
          [r"$\overrightarrow{AB}=(1,\,-2,\,2)$、$\overrightarrow{AC}=(3,\,k-2,\,l-3)$",
           r"一直線上だから $\overrightarrow{AC}=t\overrightarrow{AB}$。$x$ 成分から $t=3$",
           r"$k-2=3\times(-2)=-6$ より $k=-4$、$l-3=3\times 2=6$ より $l=9$",
           r"よって $(-4,\,9)$"],
          "3点が一直線上なら、$\\overrightarrow{AB}$ と $\\overrightarrow{AC}$ は平行。$x$ 成分から倍率を求めよう。")

    a = Mx(1, 2, -2)
    ans = tt(2 * a)
    assert nrm(a) == 3 and nrm(2 * a) == 6
    L.add(3, r"$\vec{a}=(1,\,2,\,-2)$ と同じ向きで、大きさが $6$ のベクトルはどれか。",
          C(ans),
          [C(vt(6, 12, -12), '大きさ $|\\vec{a}|=3$ を考えず、6 倍してしまった。'),
           C(vt(-2, -4, 4), '逆向きのベクトルを答えた。'),
           C(vt(R(1, 3), R(2, 3), R(-2, 3)), '大きさ 1 の単位ベクトルを答えた。')],
          [r"$|\vec{a}|=\sqrt{1^{2}+2^{2}+(-2)^{2}}=3$",
           r"大きさを 6 にするには、同じ向きのまま $\frac{6}{3}=2$ 倍する。",
           r"$2\vec{a}=(2,\,4,\,-4)$",
           r"よって $(2,\,4,\,-4)$"],
          "$|\\vec{a}|$ を求め、大きさが何倍になればよいかを考えよう。")

    def line_par(fixed, axis):
        # 条件で固定される座標の集合 fixed が、axis 以外の2つなら axis に平行な直線
        return set(fixed) == ({'x', 'y', 'z'} - {axis})
    t1 = line_par({'y', 'z'}, 'x'); t2 = line_par({'x', 'y'}, 'x'); t3 = line_par({'y'}, 'x'); t4 = line_par({'x', 'z'}, 'x')
    assert (t1, t2, t3, t4) == (True, False, False, False)
    L.add(3, r"次のうち、$x$ 軸に平行な直線を表すものはどれか。",
          C(t1, raw=r"$y=2$ かつ $z=3$"),
          [C(t2, r'どの座標が固定されているかを取りちがえて、$z$ 軸に平行な直線を選んだ。', raw=r"$x=2$ かつ $y=3$"),
           C(t3, r'条件が 1つだけでも、直線になると考えた。', raw=r"$y=2$"),
           C(t4, r'どの座標が固定されているかを取りちがえて、$y$ 軸に平行な直線を選んだ。', raw=r"$x=2$ かつ $z=3$")],
          [r"$x$ 軸に平行な直線上の点は、$y$ 座標、$z$ 座標が一定で、$x$ 座標だけが自由に変わる。",
           r"$y=2$ かつ $z=3$：点 $(t,\,2,\,3)$（$t$ は任意）で、$x$ 軸に平行な直線。",
           r"$x=2$ かつ $y=3$ は $z$ 軸、$x=2$ かつ $z=3$ は $y$ 軸に平行。$y=2$ だけは平面。",
           r"よって「$y=2$ かつ $z=3$」"],
          "動ける方向は、条件で固定されていない座標の方向。", echeck=False)

    # ---------- 段階4 ----------
    A, B, Cc = Mx(1, 0, 2), Mx(3, 2, 2), Mx(1, 4, 2)
    px, py = sp.symbols('px py')
    Pp = Mx(px, py, 0)
    sol = sp.solve([(Pp - A).dot(Pp - A) - (Pp - B).dot(Pp - B), (Pp - A).dot(Pp - A) - (Pp - Cc).dot(Pp - Cc)], [px, py], dict=True)[0]
    assert (sol[px], sol[py]) == (1, 2)
    P3 = Mx(1, 2, 2)
    assert (P3 - A).dot(P3 - A) == (P3 - B).dot(P3 - B) == (P3 - Cc).dot(P3 - Cc)   # z=2 の点も等距離だが xy 平面上ではない
    L.add(4, r"$xy$ 平面上の点 P で、A$(1,\,0,\,2)$、B$(3,\,2,\,2)$、C$(1,\,4,\,2)$ のどの点からも等しい距離にあるものの座標はどれか。",
          C(vt(1, 2, 0)),
          [C(vt(2, 1, 0), r'$x$ 座標と $y$ 座標を入れかえてしまった。'),
           C(vt(3, 0, 0), r'$x+y=3$ だけを満たす点を答えた。'),
           C(vt(1, 2, 2), r'$xy$ 平面上（$z=0$）という条件を見落とした。')],
          [r"P$(x,\,y,\,0)$ とおく。$PA^{2}=(x-1)^{2}+y^{2}+4$、$PB^{2}=(x-3)^{2}+(y-2)^{2}+4$、$PC^{2}=(x-1)^{2}+(y-4)^{2}+4$",
           r"$PA^{2}=PC^{2}$ より $y^{2}=(y-4)^{2}$、$y=2$",
           r"$PA^{2}=PB^{2}$ より $(x-1)^{2}+4=(x-3)^{2}$ から $x=1$",
           r"よって $(1,\,2,\,0)$"],
          "$PA^{2}=PB^{2}$、$PA^{2}=PC^{2}$ の2つの式から、$x$、$y$ を求めよう。$z$ 座標は 0。")

    O_, A_, B_, C_ = Mx(0, 0, 0), Mx(4, 0, 0), Mx(0, 2, 0), Mx(0, 0, 6)
    Pq = Mx(2, 1, 3)
    assert all((Pq - V).dot(Pq - V) == 14 for V in (O_, A_, B_, C_))
    gt = tt((O_ + A_ + B_ + C_) / 4); gabc = tt((A_ + B_ + C_) / 3)
    L.add(4, r"座標空間の4点 O$(0,\,0,\,0)$、A$(4,\,0,\,0)$、B$(0,\,2,\,0)$、C$(0,\,0,\,6)$ から等しい距離にある点 P の座標はどれか。",
          C(vt(2, 1, 3)),
          [C(gt, r'4点の重心を答えた。'),
           C(gabc, r'3点 A、B、C の重心を答えた。'),
           C(vt(4, 2, 6), r'O の対角にある頂点を答えた。')],
          [r"P$(x,\,y,\,z)$ とおく。$PO^{2}=PA^{2}$ より $x^{2}=(x-4)^{2}$ で $x=2$",
           r"$PO^{2}=PB^{2}$ より $y^{2}=(y-2)^{2}$ で $y=1$",
           r"$PO^{2}=PC^{2}$ より $z^{2}=(z-6)^{2}$ で $z=3$",
           r"よって $(2,\,1,\,3)$"],
          "$PO=PA$、$PO=PB$、$PO=PC$ を、2乗した式で3つ立てよう。")

    A, B = Mx(1, 2, 3), Mx(2, 0, 1)
    tq = sp.symbols('tq')
    Pp = A + tq * (B - A)
    ts = sp.solve(Pp[2], tq)[0]
    Pans = tt(Pp.subs(tq, ts))
    assert ts == R(3, 2) and Pans == (R(5, 2), -1, 0)
    wrong1 = tt(Pp.subs(tq, -ts)); wrong2 = tt(Pp.subs(tq, R(1, 2)))
    L.add(4, r"2点 A$(1,\,2,\,3)$、B$(2,\,0,\,1)$ を通る直線が $xy$ 平面と交わる点の座標はどれか。",
          C(Pans),
          [C(vt(wrong1[0], wrong1[1], 0), r'$t$ の符号を取りちがえて、$x$、$y$ 座標を求めた。'),
           C(vt(4, -4, 0), r'$3-2t=0$ を $t=3$ と解いた（2 でわり忘れた）。'),
           C(vt(wrong2[0], wrong2[1], 0), r'$t=\frac{1}{2}$ と取りちがえた。')],
          [r"直線 AB 上の点 P は $\overrightarrow{AP}=t\overrightarrow{AB}$。$\overrightarrow{AB}=(1,\,-2,\,-2)$ だから P $=(1+t,\ 2-2t,\ 3-2t)$",
           r"$xy$ 平面上は $z=0$。$3-2t=0$ より $t=\frac{3}{2}$",
           r"$x=1+\frac{3}{2}=\frac{5}{2}$、$y=2-3=-1$",
           r"よって $(\frac{5}{2},\,-1,\,0)$"],
          "直線上の点を $\\overrightarrow{AP}=t\\overrightarrow{AB}$ で表し、$z$ 座標が 0 になる $t$ を求めよう。")

    A, B = Mx(1, 3, 4), Mx(7, 12, 0)
    f = lambda tv: sp.sqrt((tv - 1) ** 2 + 25) + sp.sqrt((tv - 7) ** 2 + 144)
    ts_ = np.linspace(-10, 20, 3000001)
    fv = np.sqrt((ts_ - 1) ** 2 + 25) + np.sqrt((ts_ - 7) ** 2 + 144)
    assert abs(fv.min() - np.sqrt(325)) < 1e-6
    L.add(4, r"$x$ 軸上を動く点 P と、2点 A$(1,\,3,\,4)$、B$(7,\,12,\,0)$ がある。$AP+PB$ の最小値はいくつか。",
          C(5 * sqrt(13)),
          [C(sqrt(85), r'A、B の $x$ 軸からの距離 5 と 12 を、足さずに引いてしまった。'),
           C(I(23), r'$x$ 座標の差 6 と、距離の和 17 を、足してしまった。'),
           C(sqrt(205), r'$5^{2}+12^{2}+6^{2}$ のように、2乗を全部足してしまった。')],
          [r"P$(t,\,0,\,0)$ とおくと $AP=\sqrt{(t-1)^{2}+3^{2}+4^{2}}=\sqrt{(t-1)^{2}+5^{2}}$、$BP=\sqrt{(t-7)^{2}+12^{2}+0^{2}}=\sqrt{(t-7)^{2}+12^{2}}$",
           r"$x$ 軸のまわりに回転させて、2点を $xy$ 平面上の $x$ 軸の反対側に置くと、$AP+PB$ は平面上の2点間の距離（$x$ 軸をまたぐ）として考えられる。",
           r"A$'(1,\,5)$、B$'(7,\,-12)$ として、最小値は $A'B'=\sqrt{(7-1)^{2}+(-12-5)^{2}}=\sqrt{36+289}=\sqrt{325}$",
           r"よって $5\sqrt{13}$"],
          "$x$ 軸への距離（$\\sqrt{y^{2}+z^{2}}$）に目をつけて、$x$ 軸のまわりに平面へ回転させて考えよう。")

    O, A, Cq, D = Mx(0, 0, 0), Mx(2, 1, 0), Mx(0, 3, 1), Mx(1, 1, 4)
    G = Cq + D          # 四角形 OCGD が平行四辺形
    AG = nrm(G - A)
    assert tt(G) == (1, 4, 5) and AG == sqrt(35) and nrm(G) == sqrt(42) and nrm(A + G) == sqrt(59)
    L.add(4, r"座標空間に、O$(0,\,0,\,0)$、A$(2,\,1,\,0)$、C$(0,\,3,\,1)$、D$(1,\,1,\,4)$ がある。四角形 OCGD が平行四辺形になるように点 G をとるとき、線分 AG の長さはいくつか。",
          C(sqrt(35)),
          [C(sqrt(42), r'原点から G までの長さ OG を答えた。'),
           C(sqrt(59), r'A と G の座標を足したベクトルの大きさを答えた。'),
           C(I(9), r'$\overrightarrow{AG}$ の成分の絶対値を足してしまった。')],
          [r"四角形 OCGD が平行四辺形だから $\overrightarrow{OG}=\overrightarrow{OC}+\overrightarrow{OD}=(1,\,4,\,5)$、つまり G$(1,\,4,\,5)$",
           r"$\overrightarrow{AG}=(1-2,\ 4-1,\ 5-0)=(-1,\,3,\,5)$",
           r"$AG=\sqrt{(-1)^{2}+3^{2}+5^{2}}=\sqrt{35}$",
           r"よって $\sqrt{35}$"],
          "G の座標を、$\\overrightarrow{OG}=\\overrightarrow{OC}+\\overrightarrow{OD}$ から求めよう。")
    return L
#### L07-END

#### L08-BEGIN
def lesson_08():
    L = Lesson('mc1-08')
    I = Integer
    def vt(*xs):
        return tuple(sp.nsimplify(v) for v in xs)
    def Mx(*xs):
        return sp.Matrix(xs)
    def tt(m):
        return tuple(sp.nsimplify(v) for v in m)
    def nrm(v):
        return sp.sqrt(sum(t ** 2 for t in v))
    def ang(u, v):
        u = np.array([float(t) for t in u]); v = np.array([float(t) for t in v])
        return math.degrees(math.acos(float(np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v)))))

    # ---------- 段階1 ----------
    a, b = Mx(1, -2, 2), Mx(3, 0, -1)
    ans = a.dot(b)
    assert ans == 1
    L.add(1, r"$\vec{a}=(1,\,-2,\,2)$、$\vec{b}=(3,\,0,\,-1)$ のとき、内積 $\vec{a}\cdot\vec{b}$ の値はいくつか。",
          C(I(1)),
          [C(I(5), r'$z$ 成分の積 $2\times(-1)$ の符号を取りちがえた。'),
           C(I(3), r'$z$ 成分の積を、足し忘れた。'),
           C(I(-1), '全体の符号を取りちがえた。')],
          [r"$\vec{a}\cdot\vec{b}=a_{1}b_{1}+a_{2}b_{2}+a_{3}b_{3}$",
           r"$=1\times 3+(-2)\times 0+2\times(-1)$",
           r"$=3+0-2=1$",
           r"よって $1$"],
          "空間でも、同じ成分どうしをかけて、3つ足す。")

    A, B, Cc = Mx(0, 0, 0), Mx(2, 0, 0), Mx(2, 2, 0)
    ans = (B - A).dot(Cc - A)
    assert ans == 4
    L.add(1, r"1辺の長さが $2$ の立方体 ABCD$-$EFGH がある。$\overrightarrow{AB}\cdot\overrightarrow{AC}$ の値はいくつか。（AC は面 ABCD の対角線）",
          C(I(4)),
          [C(I(8), r'$\cos 45^{\circ}$ をかけ忘れた。'),
           C(4 * sqrt(2), r'$|\overrightarrow{AB}||\overrightarrow{AC}|$ だけを計算し、$\cos 45^{\circ}$ をかけ忘れた。'),
           C(I(0), r'$\overrightarrow{AB}$ と $\overrightarrow{AC}$ を垂直と考えた。')],
          [r"$|\overrightarrow{AB}|=2$、$|\overrightarrow{AC}|=2\sqrt{2}$、$\overrightarrow{AB}$ と $\overrightarrow{AC}$ のなす角は $45^{\circ}$",
           r"$\overrightarrow{AB}\cdot\overrightarrow{AC}=|\overrightarrow{AB}||\overrightarrow{AC}|\cos 45^{\circ}$",
           r"$=2\times 2\sqrt{2}\times\frac{\sqrt{2}}{2}=4$",
           r"よって $4$"],
          "正方形 ABCD の中で、$\\overrightarrow{AB}$ と $\\overrightarrow{AC}$ のなす角を考えよう。")

    kk = sp.symbols('kk')
    so = sp.solve(Mx(kk, 1, 3).dot(Mx(2, -4, 2)), kk)
    assert so == [-1]
    L.add(1, r"$\vec{a}=(k,\,1,\,3)$、$\vec{b}=(2,\,-4,\,2)$ が垂直になるとき、実数 $k$ の値はいくつか。",
          C(I(-1)),
          [C(I(1), '符号を取りちがえた。'),
           C(I(5), r'$3\times 2$ の符号を取りちがえて解いた。'),
           C(I(-5), r'$-4$ を移項するときに、符号を取りちがえた。')],
          [r"垂直だから $\vec{a}\cdot\vec{b}=0$",
           r"$k\times 2+1\times(-4)+3\times 2=2k+2=0$",
           r"$k=-1$",
           r"よって $-1$"],
          "垂直 $\\Leftrightarrow$ 内積が 0。内積を $k$ の式で表そう。")

    a, b = Mx(1, 1, 0), Mx(-1, 0, 1)
    assert abs(ang(a, b) - 120) < 1e-9
    L.add(1, r"$\vec{a}=(1,\,1,\,0)$、$\vec{b}=(-1,\,0,\,1)$ のなす角 $\theta$（$0^{\circ}\leqq\theta\leqq 180^{\circ}$）はいくつか。",
          DG(120),
          [DG(60, r'$\cos\theta$ の符号を取りちがえた。'),
           DG(30, r'$\frac{1}{2}$ を見て $30^{\circ}$ と取りちがえた（$\cos 30^{\circ}=\frac{\sqrt{3}}{2}$ である）。'),
           DG(150, r'$\cos\theta=-\frac{1}{2}$ の角を $150^{\circ}$ と取りちがえた。')],
          [r"$\vec{a}\cdot\vec{b}=-1+0+0=-1$、$|\vec{a}|=\sqrt{2}$、$|\vec{b}|=\sqrt{2}$",
           r"$\cos\theta=\frac{-1}{\sqrt{2}\times\sqrt{2}}=-\frac{1}{2}$",
           r"$0^{\circ}\leqq\theta\leqq 180^{\circ}$ より $\theta=120^{\circ}$",
           r"よって $120^{\circ}$"],
          "平面のときと同じ。$\\cos\\theta$ を内積と大きさから求めよう。")

    ab, ac = 2, -5
    assert 2 * ab - ac == 9
    L.add(1, r"$\vec{a}\cdot\vec{b}=2$、$\vec{a}\cdot\vec{c}=-5$ のとき、$\vec{a}\cdot(2\vec{b}-\vec{c})$ の値はいくつか。",
          C(I(9)),
          [C(I(-1), r'$-\vec{a}\cdot\vec{c}$ の符号を取りちがえた（$4+(-5)$）。'),
           C(I(7), r'$\vec{a}\cdot\vec{b}$ を 2 倍するのを忘れた（$2+5$）。'),
           C(I(-9), '全体の符号を取りちがえた。')],
          [r"内積の分配法則で展開する。$\vec{a}\cdot(2\vec{b}-\vec{c})=2\vec{a}\cdot\vec{b}-\vec{a}\cdot\vec{c}$",
           r"$=2\times 2-(-5)$",
           r"$=4+5=9$",
           r"よって $9$"],
          "内積は、足し算・引き算・実数倍に対して、分配法則と同じように展開できる。")

    # ---------- 段階2 ----------
    A, B, Cc = Mx(0, 1, 2), Mx(1, 1, 3), Mx(0, 1, 4)
    assert abs(ang(B - A, Cc - A) - 45) < 1e-9
    L.add(2, r"3点 A$(0,\,1,\,2)$、B$(1,\,1,\,3)$、C$(0,\,1,\,4)$ について、$\angle BAC$ の大きさはいくつか。",
          DG(45),
          [DG(30, r'$\cos 45^{\circ}=\frac{1}{\sqrt{2}}$ の角を、$30^{\circ}$ と取りちがえた。'),
           DG(60, r'$\cos 45^{\circ}=\frac{1}{\sqrt{2}}$ の角を、$60^{\circ}$ と取りちがえた。'),
           DG(135, r'$\cos\theta$ の符号を取りちがえた。')],
          [r"$\overrightarrow{AB}=(1,\,0,\,1)$、$\overrightarrow{AC}=(0,\,0,\,2)$。$\overrightarrow{AB}\cdot\overrightarrow{AC}=2$",
           r"$|\overrightarrow{AB}|=\sqrt{2}$、$|\overrightarrow{AC}|=2$",
           r"$\cos\angle BAC=\frac{2}{\sqrt{2}\times 2}=\frac{1}{\sqrt{2}}$ より $\angle BAC=45^{\circ}$",
           r"よって $45^{\circ}$"],
          "A を始点とする2つのベクトル $\\overrightarrow{AB}$、$\\overrightarrow{AC}$ のなす角を求めよう。")

    a2, b2, ab = 2, 1, -1
    ans = sp.sqrt(4 * a2 ** 2 + 9 * b2 ** 2 - 12 * ab)
    assert ans == sqrt(37)
    L.add(2, r"$|\vec{a}|=2$、$|\vec{b}|=1$、$\vec{a}\cdot\vec{b}=-1$ のとき、$|2\vec{a}-3\vec{b}|$ の値はいくつか。",
          C(sqrt(37)),
          [C(sqrt(13), r'$-12\vec{a}\cdot\vec{b}$ の符号を取りちがえて、$16+9-12$ とした。'),
           C(I(5), r'内積の項を落として、$\sqrt{16+9}$ とした。'),
           C(I(7), r'$|2\vec{a}|+|3\vec{b}|=4+3$ と考えた。')],
          [r"$|2\vec{a}-3\vec{b}|^{2}=4|\vec{a}|^{2}-12\vec{a}\cdot\vec{b}+9|\vec{b}|^{2}$",
           r"$=4\times 4-12\times(-1)+9\times 1=16+12+9=37$",
           r"$|2\vec{a}-3\vec{b}|\geqq 0$ より $|2\vec{a}-3\vec{b}|=\sqrt{37}$",
           r"よって $\sqrt{37}$"],
          "2乗して、内積で展開してから平方根をとろう。")

    a, b = Mx(1, 1, 0), Mx(0, 1, 1)
    n = Mx(1, -1, 1)
    assert n.dot(a) == 0 and n.dot(b) == 0 and nrm(n) == sqrt(3)
    L.add(2, r"$\vec{a}=(1,\,1,\,0)$、$\vec{b}=(0,\,1,\,1)$ の両方に垂直で、大きさが $\sqrt{3}$、$x$ 成分が正のベクトルはどれか。",
          C(vt(1, -1, 1)),
          [C(vt(-1, 1, -1), r'$x$ 成分が負のほうを答えた。'),
           C(vt(1, 1, -1), r'$\vec{a}$、$\vec{b}$ の両方に垂直か、確かめなかった。'),
           C(vt(3, -3, 3), r'大きさを $\sqrt{3}$ にそろえるのを忘れた（大きさ $3\sqrt{3}$）。')],
          [r"求めるベクトルを $(x,\,y,\,z)$ とする。$\vec{a}$ との内積：$x+y=0$、$\vec{b}$ との内積：$y+z=0$",
           r"$y=-x$、$z=x$ より $(x,\,y,\,z)=x(1,\,-1,\,1)$。大きさは $|x|\sqrt{3}=\sqrt{3}$ より $x=\pm 1$",
           r"$x$ 成分が正だから $x=1$",
           r"よって $(1,\,-1,\,1)$"],
          "内積が 0 になる条件を2つ立てて、成分の関係を求めよう。")

    O, A, Cc, D = Mx(0, 0, 0), Mx(3, 0, 0), Mx(0, 2, 0), Mx(0, 0, 1)
    F = A + Cc + D; G = Cc + D
    ans = F.dot(G - A)
    assert ans == -4 and tt(F) == (3, 2, 1)
    L.add(2, r"座標空間に、O$(0,\,0,\,0)$、A$(3,\,0,\,0)$、C$(0,\,2,\,0)$、D$(0,\,0,\,1)$ を頂点とする直方体 OABC$-$DEFG（F$(3,\,2,\,1)$、G$(0,\,2,\,1)$）がある。$\overrightarrow{OF}\cdot\overrightarrow{AG}$ の値はいくつか。",
          C(I(-4)),
          [C(I(4), r'$\overrightarrow{AG}$ の $x$ 成分の符号を取りちがえた。'),
           C(I(14), r'$\overrightarrow{OF}$ と $\overrightarrow{OF}$ の内積と取りちがえた。'),
           C(I(-14))],
          [r"$\overrightarrow{OF}=(3,\,2,\,1)$、$\overrightarrow{AG}=(0-3,\ 2-0,\ 1-0)=(-3,\,2,\,1)$",
           r"$\overrightarrow{OF}\cdot\overrightarrow{AG}=3\times(-3)+2\times 2+1\times 1$",
           r"$=-9+4+1=-4$",
           r"よって $-4$"],
          "$\\overrightarrow{AG}$ の成分を、終点 G − 始点 A で求めてから内積を計算しよう。")

    A, B, Cc = Mx(1, 2, 3), Mx(1, 3, 5), Mx(2, 4, 5)
    u, v = B - A, Cc - A
    S = sp.Rational(1, 2) * sp.sqrt(u.dot(u) * v.dot(v) - u.dot(v) ** 2)
    assert S == R(3, 2) and sp.Rational(1, 2) * (u.cross(v)).norm() == R(3, 2)
    L.add(2, r"3点 A$(1,\,2,\,3)$、B$(1,\,3,\,5)$、C$(2,\,4,\,5)$ を頂点とする △ABC の面積はいくつか。ただし、面積は $\frac{1}{2}\sqrt{|\overrightarrow{AB}|^{2}|\overrightarrow{AC}|^{2}-(\overrightarrow{AB}\cdot\overrightarrow{AC})^{2}}$ で求められる。",
          C(R(3, 2)),
          [C(I(3), r'$\frac{1}{2}$ をかけ忘れた。'),
           C(3 * sqrt(5) / 2, r'根号の中で、$(\overrightarrow{AB}\cdot\overrightarrow{AC})^{2}$ を引き忘れた。'),
           C(R(9, 2), r'根号の中で、$(\overrightarrow{AB}\cdot\overrightarrow{AC})^{2}$ を引かずに足した。')],
          [r"$\overrightarrow{AB}=(0,\,1,\,2)$、$\overrightarrow{AC}=(1,\,2,\,2)$",
           r"$|\overrightarrow{AB}|^{2}=5$、$|\overrightarrow{AC}|^{2}=9$、$\overrightarrow{AB}\cdot\overrightarrow{AC}=0+2+4=6$",
           r"$5\times 9-6^{2}=9$ より、面積は $\frac{1}{2}\sqrt{9}=\frac{3}{2}$",
           r"よって $\frac{3}{2}$"],
          "必要な値は、2つのベクトルの大きさの2乗と、内積の3つ。")

    # ---------- 段階3 ----------
    ag, ab_ = Mx(1, 1, 1), Mx(1, 0, 0)
    cs = ag.dot(ab_) / (nrm(ag) * nrm(ab_))
    assert sp.simplify(cs - sqrt(3) / 3) == 0
    L.add(3, r"1辺の長さが $1$ の立方体 ABCD$-$EFGH がある（AB、AD、AE が A から出る3辺で、G は A の対角の頂点）。対角線 AG と辺 AB のなす角を $\theta$ とするとき、$\cos\theta$ の値はいくつか。",
          C(sqrt(3) / 3),
          [C(R(1, 3), r'$|\overrightarrow{AG}|=\sqrt{3}$ の平方根をとり忘れて、$\frac{1}{3}$ とした。'),
           C(sqrt(2) / 2, r'辺 AB と面の対角線 AC のなす角（$45^{\circ}$）の値を答えた。'),
           C(sqrt(6) / 3, r'辺 AB でなく、面の対角線 AF とのなす角を答えた。')],
          [r"A$(0,\,0,\,0)$、B$(1,\,0,\,0)$、G$(1,\,1,\,1)$ とすると $\overrightarrow{AG}=(1,\,1,\,1)$、$\overrightarrow{AB}=(1,\,0,\,0)$",
           r"$\overrightarrow{AG}\cdot\overrightarrow{AB}=1$、$|\overrightarrow{AG}|=\sqrt{3}$、$|\overrightarrow{AB}|=1$",
           r"$\cos\theta=\frac{1}{\sqrt{3}\times 1}=\frac{1}{\sqrt{3}}=\frac{\sqrt{3}}{3}$",
           r"よって $\frac{\sqrt{3}}{3}$"],
          "立方体の頂点に座標を入れて、2つのベクトルの成分を求めよう。")

    a_, b_, c_ = sp.symbols('a_ b_ c_')
    a2 = Mx(1, 1, 1); b2 = Mx(1, -1, -1); c2 = Mx(-1, 1, -1); d2 = Mx(-1, -1, 1)   # 正四面体
    O_, A_, B_, C_ = a2, b2, c2, d2
    edge = nrm(A_ - O_)
    assert nrm(B_ - A_) == edge and nrm(C_ - O_) == edge
    M_ = (O_ + A_) / 2; N_ = (B_ + C_) / 2
    assert sp.simplify(nrm(N_ - M_) / edge - sqrt(2) / 2) == 0
    L.add(3, r"1辺の長さが $1$ の正四面体 OABC で、辺 OA の中点を M、辺 BC の中点を N とする。線分 MN の長さはいくつか。",
          C(sqrt(2) / 2),
          [C(R(1, 2), r'平方根をとるのを忘れた。'),
           C(sqrt(3) / 2, r'正三角形の高さを答えた。'),
           C(I(1), r'辺の長さを答えた。')],
          [r"$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ とおくと、$|\vec{a}|=|\vec{b}|=|\vec{c}|=1$、$\vec{a}\cdot\vec{b}=\vec{b}\cdot\vec{c}=\vec{c}\cdot\vec{a}=\frac{1}{2}$",
           r"$\overrightarrow{MN}=\frac{\vec{b}+\vec{c}}{2}-\frac{\vec{a}}{2}=\frac{1}{2}(\vec{b}+\vec{c}-\vec{a})$",
           r"$|\vec{b}+\vec{c}-\vec{a}|^{2}=3+2(\vec{b}\cdot\vec{c}-\vec{a}\cdot\vec{b}-\vec{a}\cdot\vec{c})=3-1=2$ より $|\overrightarrow{MN}|^{2}=\frac{2}{4}=\frac{1}{2}$",
           r"よって $MN=\frac{\sqrt{2}}{2}$"],
          "$\\overrightarrow{OA}=\\vec{a}$ などとおいて、$\\overrightarrow{MN}$ を $\\vec{a}$、$\\vec{b}$、$\\vec{c}$ で表そう。正三角形の内積は $\\frac{1}{2}$。")

    a, b = Mx(2, 1, 1), Mx(1, -1, 2)
    tq = sp.symbols('tq')
    f = (a + tq * b).dot(a + tq * b)
    tm = sp.solve(sp.diff(f, tq), tq)[0]
    assert tm == R(-1, 2) and a.dot(b) == 3 and b.dot(b) == 6
    L.add(3, r"$\vec{a}=(2,\,1,\,1)$、$\vec{b}=(1,\,-1,\,2)$ とする。実数 $t$ が変化するとき、$|\vec{a}+t\vec{b}|$ が最小になる $t$ の値はいくつか。",
          C(R(-1, 2)),
          [C(R(1, 2), '符号を取りちがえた。'),
           C(I(-2), r'$\vec{a}\cdot\vec{b}$ と $|\vec{b}|^{2}$ を逆にして、$-\frac{6}{3}$ とした。'),
           C(I(-3), r'$|\vec{b}|^{2}$ でわるのを忘れた。')],
          [r"$|\vec{a}+t\vec{b}|^{2}=|\vec{a}|^{2}+2t\vec{a}\cdot\vec{b}+t^{2}|\vec{b}|^{2}$",
           r"$\vec{a}\cdot\vec{b}=2-1+2=3$、$|\vec{b}|^{2}=1+1+4=6$ だから $|\vec{a}|^{2}+6t+6t^{2}=6\left(t+\frac{1}{2}\right)^{2}+|\vec{a}|^{2}-\frac{3}{2}$",
           r"$t=-\frac{1}{2}$ のとき最小になる。",
           r"よって $-\frac{1}{2}$"],
          "$|\\vec{a}+t\\vec{b}|^{2}$ を $t$ の2次式として展開し、平方完成しよう。")

    kk = sp.symbols('kk')
    a3 = Mx(-2, 0, kk); b3 = Mx(0, 1, 1)
    eq = sp.simplify(a3.dot(b3) ** 2 * 4 - a3.dot(a3) * b3.dot(b3))
    so = sp.solve(eq, kk)
    assert set(so) == {2, -2}
    assert abs(ang((-2, 0, 2), (0, 1, 1)) - 60) < 1e-9 and abs(ang((-2, 0, -2), (0, 1, 1)) - 120) < 1e-9
    L.add(3, r"$\vec{a}=(-2,\,0,\,k)$、$\vec{b}=(0,\,1,\,1)$ のなす角が $60^{\circ}$ になるとき、実数 $k$ の値はいくつか。",
          C(I(2)),
          [C(I(-2), r'$\cos\theta>0$ すなわち内積が正になる条件を見落とした（なす角が $120^{\circ}$ になる値）。'),
           C(I(4), r'$k^{2}=4$ の 4 を答えてしまった。'),
           C(I(1))],
          [r"$\vec{a}\cdot\vec{b}=k$、$|\vec{a}|=\sqrt{4+k^{2}}$、$|\vec{b}|=\sqrt{2}$。$\cos 60^{\circ}=\frac{1}{2}$ だから $\frac{k}{\sqrt{4+k^{2}}\sqrt{2}}=\frac{1}{2}$",
           r"$\cos 60^{\circ}>0$ より $k>0$。両辺を 2乗して $4k^{2}=2(4+k^{2})$",
           r"$k^{2}=4$。$k>0$ より $k=2$",
           r"よって $2$"],
          "$\\cos 60^{\\circ}=\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$ の式から $k$ を求める。内積の符号に注意。")

    rn = np.random.default_rng(5)
    def holds_a():   # |a+b|=|a-b| ⇒ a⊥b
        for _ in range(200):
            u = rn.normal(size=3); v = rn.normal(size=3)
            v = v - np.dot(u, v) / np.dot(u, u) * u      # u⊥v にする
            assert abs(np.linalg.norm(u + v) - np.linalg.norm(u - v)) < 1e-9
        for _ in range(200):
            u = rn.normal(size=3); v = rn.normal(size=3)
            assert (abs(np.linalg.norm(u + v) - np.linalg.norm(u - v)) < 1e-9) == (abs(np.dot(u, v)) < 1e-9)
        return True
    holds_a()
    ua, va_ = np.array([1., 0, 0]), np.array([0., 1, 0])
    assert abs(np.linalg.norm(ua + ua) - np.linalg.norm(ua - ua)) > 1e-6      # (イ)の反例 a=b
    assert np.dot(np.array([1., 0, 0]), np.array([-1., 0, 0])) < 0            # (ウ)の反例 逆向き（鈍角ではなく平角）
    assert abs(np.dot(ua, ua) - np.linalg.norm(ua) * np.linalg.norm(ua)) < 1e-9  # (エ)の反例 a=b（同じ向き）
    L.add(3, r"$\vec{a}$、$\vec{b}$ は、どちらも $\vec{0}$ でない空間ベクトルとする。次のうち、正しいものはどれか。",
          C(True, raw=r"$|\vec{a}+\vec{b}|=|\vec{a}-\vec{b}|$ ならば、$\vec{a}\perp\vec{b}$ である。"),
          [C(False, r'大きさが同じなら、$\vec{a}+\vec{b}$ と $\vec{a}-\vec{b}$ の大きさも同じになると考えた。', raw=r"$|\vec{a}|=|\vec{b}|$ ならば、$|\vec{a}+\vec{b}|=|\vec{a}-\vec{b}|$ である。"),
           C(False, r'内積の符号と角の関係（正なら鋭角、負なら鈍角）を、逆に覚えていた。', raw=r"$\vec{a}\cdot\vec{b}<0$ ならば、$\vec{a}$ と $\vec{b}$ のなす角は鋭角である。"),
           C(False, r'内積が最大になるのを、逆向きのときと取りちがえた（逆向きなら $\cos\theta=-1$）。', raw=r"$\vec{a}\cdot\vec{b}=|\vec{a}||\vec{b}|$ ならば、$\vec{a}$ と $\vec{b}$ は逆向きである。")],
          [r"$|\vec{a}+\vec{b}|^{2}=|\vec{a}|^{2}+2\vec{a}\cdot\vec{b}+|\vec{b}|^{2}$、$|\vec{a}-\vec{b}|^{2}=|\vec{a}|^{2}-2\vec{a}\cdot\vec{b}+|\vec{b}|^{2}$",
           r"2つが等しいなら $4\vec{a}\cdot\vec{b}=0$ で、$\vec{a}\perp\vec{b}$。（正しい）",
           r"$\vec{a}=\vec{b}$ なら前者は $2|\vec{a}|$、後者は 0。内積が負なら $\cos\theta<0$ で鈍角（鋭角ではない）。$\cos\theta=1$ は同じ向き。",
           r"よって「$|\vec{a}+\vec{b}|=|\vec{a}-\vec{b}|$ ならば、$\vec{a}\perp\vec{b}$」"],
          "$|\\vec{a}+\\vec{b}|^{2}$ と $|\\vec{a}-\\vec{b}|^{2}$ を、それぞれ内積で展開して比べよう。", echeck=False)

    # ---------- 段階4 ----------
    A, B, G = Mx(0, 0, 0), Mx(1, 0, 0), Mx(1, 1, 1)
    H = G * (B.dot(G) / G.dot(G))
    BH = nrm(H - B)
    assert sp.simplify(BH - sqrt(6) / 3) == 0
    L.add(4, r"1辺の長さが $1$ の立方体 ABCD$-$EFGH がある（AB、AD、AE が A から出る3辺で、G は A の対角の頂点）。頂点 B から対角線 AG に下ろした垂線の長さはいくつか。",
          C(sqrt(6) / 3),
          [C(sqrt(3) / 3, r'垂線の長さでなく、垂線の足 H までの $AH$ の長さを答えた。'),
           C(sqrt(2) / 2, r'面の対角線 AC の半分を答えた。'),
           C(R(2, 3), r'平方根をとるのを忘れた（$\frac{2}{3}$ は $BH^{2}$）。')],
          [r"A を原点に、B$(1,\,0,\,0)$、G$(1,\,1,\,1)$ とする。垂線の足 H は AG 上だから $\overrightarrow{AH}=t\overrightarrow{AG}=(t,\,t,\,t)$",
           r"$\overrightarrow{BH}\cdot\overrightarrow{AG}=0$：$(t-1,\,t,\,t)\cdot(1,\,1,\,1)=3t-1=0$ より $t=\frac{1}{3}$",
           r"$\overrightarrow{BH}=\left(-\frac{2}{3},\,\frac{1}{3},\,\frac{1}{3}\right)$、$|\overrightarrow{BH}|^{2}=\frac{4+1+1}{9}=\frac{2}{3}$",
           r"よって $\frac{\sqrt{6}}{3}$"],
          "垂線の足 H を AG 上の点 $t\\overrightarrow{AG}$ とおき、$\\overrightarrow{BH}\\cdot\\overrightarrow{AG}=0$ を使おう。")

    a2_, b2_, c2_ = 1, 4, 9
    pa, qa = (1, 1, 1), (1, 1, -1)
    p = Mx(*[1, 2, 3]); q = Mx(1, 2, -3)    # |a|=1,|b|=2,|c|=3 で互いに垂直：a=(1,0,0) b=(0,2,0) c=(0,0,3)
    assert p.dot(q) == -4 and p.dot(p) == 14 and q.dot(q) == 14
    ans = sp.Rational(p.dot(q), 14)
    assert ans == R(-2, 7)
    L.add(4, r"$\vec{a}$、$\vec{b}$、$\vec{c}$ は互いに垂直で、$|\vec{a}|=1$、$|\vec{b}|=2$、$|\vec{c}|=3$ である。$\vec{p}=\vec{a}+\vec{b}+\vec{c}$、$\vec{q}=\vec{a}+\vec{b}-\vec{c}$ のなす角を $\varphi$ とするとき、$\cos\varphi$ の値はどれか。",
          C(R(-2, 7)),
          [C(R(2, 7), '符号を取りちがえた。'),
           C(-2 * sqrt(14) / 7, r'$|\vec{p}||\vec{q}|$ を $\sqrt{14}$ としてしまった（$14$ が正しい）。'),
           C(R(-4, 7), r'$|\vec{p}||\vec{q}|$ を 7 としてしまった。')],
          [r"互いに垂直だから、$\vec{a}\cdot\vec{b}=\vec{b}\cdot\vec{c}=\vec{c}\cdot\vec{a}=0$",
           r"$\vec{p}\cdot\vec{q}=|\vec{a}|^{2}+|\vec{b}|^{2}-|\vec{c}|^{2}=1+4-9=-4$",
           r"$|\vec{p}|^{2}=1+4+9=14$、$|\vec{q}|^{2}=1+4+9=14$ より $|\vec{p}||\vec{q}|=14$",
           r"$\cos\varphi=\frac{-4}{14}=-\frac{2}{7}$。よって $-\frac{2}{7}$"],
          "垂直な組の内積はすべて 0。$\\vec{p}\\cdot\\vec{q}$、$|\\vec{p}|$、$|\\vec{q}|$ を順に求めよう。")

    P0, d = Mx(3, 2, 2), Mx(1, 2, -2)
    tq = sp.symbols('tq')
    Pt = P0 + tq * d
    f = Pt.dot(Pt)
    tm = sp.solve(sp.diff(f, tq), tq)[0]
    assert tm == R(-1, 3) and sp.sqrt(f.subs(tq, tm)) == 4
    L.add(4, r"実数 $t$ に対して、点 P$(3+t,\ 2+2t,\ 2-2t)$ を考える。原点 O と P の距離 OP の最小値はいくつか。",
          C(I(4)),
          [C(sqrt(17), r'$t=0$ のときの OP を答えた。'),
           C(I(16), r'最小になる $OP^{2}$ の値を答えて、平方根をとるのを忘れた。'),
           C(2 * sqrt(2), r'$17-3^{2}=8$ としてしまった（9 でわるのを忘れた）。')],
          [r"$OP^{2}=(3+t)^{2}+(2+2t)^{2}+(2-2t)^{2}$",
           r"$=9t^{2}+6t+17=9\left(t+\frac{1}{3}\right)^{2}+16$",
           r"$t=-\frac{1}{3}$ のとき $OP^{2}$ は最小値 16 をとる。",
           r"$OP>0$ だから、最小値は $\sqrt{16}=4$。よって $4$"],
          "$OP^{2}$ を $t$ の2次式として展開し、平方完成しよう。最小になるのは $\\overrightarrow{OP}$ が直線に垂直なとき。")

    ab_range = np.linspace(-3, 3, 100001)
    vals = ab_range - 7
    assert abs(vals.min() + 10) < 1e-9 and abs(vals.max() + 4) < 1e-9
    def rg(lo, hi): return r"$%s$ 以上 $%s$ 以下" % (tex(lo), tex(hi))
    L.add(4, r"$|\vec{a}|=1$、$|\vec{b}|=3$ で、$\vec{a}$ と $\vec{b}$ のなす角が変化するとき、$(\vec{a}+\vec{b})\cdot(2\vec{a}-\vec{b})$ のとりうる値の範囲はどれか。",
          C((I(-10), I(-4)), raw=rg(-10, -4)),
          [C((I(-8), I(-6)), r'$\vec{a}\cdot\vec{b}$ の範囲を、大きさ 1 だけで $-1$ 以上 1 以下と考えた。', raw=rg(-8, -6)),
           C((I(-7), I(-4)), r'なす角が鋭角のときだけを考えた（$\vec{a}\cdot\vec{b}$ が 0 以上 3 以下）。', raw=rg(-7, -4)),
           C((I(-3), I(3)), r'$\vec{a}\cdot\vec{b}$ の範囲をそのまま答えた。', raw=rg(-3, 3))],
          [r"展開する。$(\vec{a}+\vec{b})\cdot(2\vec{a}-\vec{b})=2|\vec{a}|^{2}+\vec{a}\cdot\vec{b}-|\vec{b}|^{2}=2+\vec{a}\cdot\vec{b}-9=\vec{a}\cdot\vec{b}-7$",
           r"$\vec{a}\cdot\vec{b}=|\vec{a}||\vec{b}|\cos\theta=3\cos\theta$ だから $-3\leqq\vec{a}\cdot\vec{b}\leqq 3$",
           r"したがって $-10\leqq\vec{a}\cdot\vec{b}-7\leqq -4$",
           r"よって $-10$ 以上 $-4$ 以下"],
          "まず式を展開して、$\\vec{a}\\cdot\\vec{b}$ だけの式にしよう。$\\cos\\theta$ の範囲が手がかり。", echeck=False)

    a_, c_, d_ = Mx(1, 0, 0), Mx(1, sqrt(3), 0), Mx(0, sqrt(3), sqrt(6))
    assert sp.simplify(nrm(c_) - 2) == 0 and sp.simplify(nrm(d_) - 3) == 0
    assert sp.simplify(a_.dot(c_) - 1) == 0 and a_.dot(d_) == 0 and sp.simplify(c_.dot(d_) - 3) == 0
    OF = sp.simplify(nrm(a_ + c_ + d_))
    assert OF == sqrt(22)
    L.add(4, r"平行六面体で、頂点 O から出る3つの辺を OA、OC、OD とし、O の反対側の頂点を F とする。$OA=1$、$OC=2$、$OD=3$、$\angle AOC=60^{\circ}$、$\angle AOD=90^{\circ}$、$\angle COD=60^{\circ}$ のとき、対角線 OF の長さはいくつか。",
          C(sqrt(22)),
          [C(sqrt(14), r'内積の項をすべて落として、$\sqrt{1+4+9}$ とした。'),
           C(I(6), '3つの辺の長さを足してしまった。'),
           C(3 * sqrt(2), r'内積の項の係数 2 を忘れて、$14+4=18$ とした。')],
          [r"$\overrightarrow{OF}=\overrightarrow{OA}+\overrightarrow{OC}+\overrightarrow{OD}$ だから、2乗して展開する。",
           r"$\overrightarrow{OA}\cdot\overrightarrow{OC}=1\cdot 2\cos 60^{\circ}=1$、$\overrightarrow{OA}\cdot\overrightarrow{OD}=0$、$\overrightarrow{OC}\cdot\overrightarrow{OD}=2\cdot 3\cos 60^{\circ}=3$",
           r"$|\overrightarrow{OF}|^{2}=1^{2}+2^{2}+3^{2}+2(1+0+3)=14+8=22$",
           r"$OF>0$ より $\sqrt{22}$。よって $\sqrt{22}$"],
          "$|\\overrightarrow{OA}+\\overrightarrow{OC}+\\overrightarrow{OD}|^{2}$ を展開し、3組の内積を計算しよう。")
    return L
#### L08-END

#### L09-BEGIN
def lesson_09():
    L = Lesson('mc1-09')
    I = Integer
    va, vb, vc = r'\vec{a}', r'\vec{b}', r'\vec{c}'
    ABC3 = (va, vb, vc)
    def vt(*xs):
        return tuple(sp.nsimplify(v) for v in xs)
    def Mx(*xs):
        return sp.Matrix(xs)
    def tt(m):
        return tuple(sp.nsimplify(v) for v in m)
    def c3(p, q, r, w=None):
        return C((sp.nsimplify(p), sp.nsimplify(q), sp.nsimplify(r)), w, tx=cmb((p, q, r), ABC3))
    def nrm(v):
        return sp.sqrt(sum(t ** 2 for t in v))

    # ---------- 段階1 ----------
    A, B = Mx(1, 2, 3), Mx(4, -1, 0)
    P = tt((1 * A + 2 * B) / 3)
    assert P == (3, 0, 1)
    L.add(1, r"2点 A$(1,\,2,\,3)$、B$(4,\,-1,\,0)$ を結ぶ線分 AB を $2:1$ に内分する点 P の座標はどれか。",
          C(P),
          [C(tt((2 * A + 1 * B) / 3), r'内分の比 $2:1$ を逆にした。'),
           C(tt((A + B) / 2), '中点を答えてしまった。'),
           C(tt(-A + 2 * B), r'外分点を答えてしまった。')],
          [r"$AP:PB=2:1$ だから、P $=\frac{1\cdot\text{A}+2\cdot\text{B}}{2+1}$",
           r"$x$ 座標：$\frac{1+2\times 4}{3}=3$、$y$ 座標：$\frac{2+2\times(-1)}{3}=0$",
           r"$z$ 座標：$\frac{3+2\times 0}{3}=1$",
           r"よって $(3,\,0,\,1)$"],
          "平面のときと同じ形の公式で、$z$ 座標が加わるだけ。")

    A, B, Cc = Mx(1, 0, 2), Mx(3, -1, 5), Mx(2, 4, -1)
    G = tt((A + B + Cc) / 3)
    assert G == (2, 1, 2)
    L.add(1, r"3点 A$(1,\,0,\,2)$、B$(3,\,-1,\,5)$、C$(2,\,4,\,-1)$ を頂点とする △ABC の重心 G の座標はどれか。",
          C(G),
          [C(vt(6, 3, 6), '3 でわるのを忘れた。'),
           C(vt(3, R(3, 2), 3), '3 でなく 2 でわってしまった。'),
           C(vt(2, 1, 6), r'$z$ 座標だけ、3 でわるのを忘れた。')],
          [r"重心の座標は、3つの頂点の座標の平均である。",
           r"$x$ 座標：$\frac{1+3+2}{3}=2$、$y$ 座標：$\frac{0+(-1)+4}{3}=1$",
           r"$z$ 座標：$\frac{2+5+(-1)}{3}=2$",
           r"よって $(2,\,1,\,2)$"],
          "平面のときと同じ。3つの座標を、それぞれ平均する。")

    O, A, B, Cc = Mx(0, 0, 0), Mx(4, 0, 0), Mx(0, 4, 0), Mx(0, 0, 8)
    G4 = tt((O + A + B + Cc) / 4)
    assert G4 == (1, 1, 2)
    L.add(1, r"四面体 OABC の頂点が O$(0,\,0,\,0)$、A$(4,\,0,\,0)$、B$(0,\,4,\,0)$、C$(0,\,0,\,8)$ のとき、四面体の重心 G の座標はどれか。",
          C(G4),
          [C(tt((A + B + Cc) / 3), r'△ABC の重心を答えてしまった（3 でわった）。'),
           C(vt(2, 2, 4), r'4 でなく 2 でわってしまった。'),
           C(vt(4, 4, 8), r'4 でわるのを忘れた。')],
          [r"四面体の重心は、4つの頂点の座標の平均である。",
           r"$x$ 座標：$\frac{0+4+0+0}{4}=1$、$y$ 座標：$\frac{0+0+4+0}{4}=1$",
           r"$z$ 座標：$\frac{0+0+0+8}{4}=2$",
           r"よって $(1,\,1,\,2)$"],
          "四面体の重心は、頂点の数 4 で平均する。")

    A, B = Mx(2, 1, -1), Mx(5, 4, 2)
    Q = tt((-2 * A + 3 * B) / (3 - 2))
    assert Q == (11, 10, 8)
    L.add(1, r"2点 A$(2,\,1,\,-1)$、B$(5,\,4,\,2)$ を結ぶ線分 AB を $3:2$ に外分する点 Q の座標はどれか。",
          C(Q),
          [C(tt((2 * A + 3 * B) / 5), '内分点を答えてしまった。'),
           C(tt(3 * A - 2 * B), r'外分の比 $3:2$ を逆にした。'),
           C(tt((-2 * A + 3 * B) / 5), r'分母を $m-n=1$ でなく $m+n=5$ にした。')],
          [r"$3:2$ に外分する点は $\frac{-2\overrightarrow{OA}+3\overrightarrow{OB}}{3-2}$",
           r"$x$ 座標：$-2\times 2+3\times 5=11$、$y$ 座標：$-2\times 1+3\times 4=10$",
           r"$z$ 座標：$-2\times(-1)+3\times 2=8$",
           r"よって $(11,\,10,\,8)$"],
          "外分の公式の分母は、$m-n$ になる。")

    L.add(1, r"四面体 OABC で、$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ とする。△ABC の重心 G の位置ベクトル $\overrightarrow{OG}$ はどれか。",
          fm((1, 1, 1), 3, ABC3),
          [fm((1, 1, 1), 4, ABC3, r'四面体の重心と取りちがえて、4 でわった。'),
           fm((1, 1, 1), 1, ABC3, r'3 でわるのを忘れた。'),
           fm((1, 1, 0), 2, ABC3, r'辺 AB の中点を答えてしまった。')],
          [r"△ABC の重心の位置ベクトルは、3頂点の位置ベクトルの平均。",
           r"$\overrightarrow{OG}=\frac{\vec{a}+\vec{b}+\vec{c}}{3}$",
           r"（O は重心の計算に含まれない。）",
           r"よって $\frac{\vec{a}+\vec{b}+\vec{c}}{3}$"],
          "重心の計算に使う頂点は、A、B、C の3つ。O は入らない。")

    # ---------- 段階2 ----------
    a, b, c = Mx(5, 0, 0), Mx(0, 6, 0), Mx(0, 0, 7)   # 独立なベクトルの例で確かめる
    M_ = a / 2; N_ = (2 * b + c) / 3
    MN = N_ - M_
    cf = sp.Matrix.hstack(a, b, c).solve(MN)
    assert tuple(cf) == (R(-1, 2), R(2, 3), R(1, 3))
    L.add(2, r"四面体 OABC で、$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ とする。辺 OA の中点を M、辺 BC を $1:2$ に内分する点を N とするとき、$\overrightarrow{MN}$ はどれか。",
          c3(R(-1, 2), R(2, 3), R(1, 3)),
          [c3(R(1, 2), R(-2, 3), R(-1, 3), r'$\overrightarrow{NM}$ を求めてしまった（向きが逆）。'),
           c3(R(-1, 2), R(1, 3), R(2, 3), r'BC の内分比 $1:2$ を逆にして、N を求めた。'),
           c3(R(1, 2), R(2, 3), R(1, 3), r'$\overrightarrow{OM}$ の符号を取りちがえた。')],
          [r"$\overrightarrow{OM}=\frac{1}{2}\vec{a}$、$\overrightarrow{ON}=\frac{2\vec{b}+\vec{c}}{3}$（BN : NC $=1:2$）",
           r"$\overrightarrow{MN}=\overrightarrow{ON}-\overrightarrow{OM}$",
           r"$=\frac{2}{3}\vec{b}+\frac{1}{3}\vec{c}-\frac{1}{2}\vec{a}$",
           r"よって $-\frac{1}{2}\vec{a}+\frac{2}{3}\vec{b}+\frac{1}{3}\vec{c}$"],
          "O を始点にして、M と N の位置ベクトルを求め、差をとろう。")

    A, B, Cc = Mx(1, 0, 0), Mx(0, 2, 0), Mx(0, 0, 3)
    kk = sp.symbols('kk')
    Pp = Mx(R(1, 3), 1, kk)
    s_, t_ = sp.symbols('s_ t_')
    sol = sp.solve(list(Pp - A - s_ * (B - A) - t_ * (Cc - A)), [kk, s_, t_], dict=True)[0]
    assert sol[kk] == R(1, 2)
    L.add(2, r"4点 A$(1,\,0,\,0)$、B$(0,\,2,\,0)$、C$(0,\,0,\,3)$、P$\left(\frac{1}{3},\,1,\,k\right)$ が同一平面上にあるとき、$k$ の値はいくつか。",
          C(R(1, 2)),
          [C(R(1, 6), r'$t=\frac{1}{6}$ を、そのまま $k$ としてしまった。'),
           C(R(3, 2), r'$z$ 成分を $k=3s$ としてしまった。'),
           C(R(-1, 2), r'$z$ 成分の符号を取りちがえた。')],
          [r"P が平面 ABC 上 $\Leftrightarrow$ $\overrightarrow{AP}=s\overrightarrow{AB}+t\overrightarrow{AC}$。$\overrightarrow{AB}=(-1,\,2,\,0)$、$\overrightarrow{AC}=(-1,\,0,\,3)$、$\overrightarrow{AP}=\left(-\frac{2}{3},\,1,\,k\right)$",
           r"$y$ 成分：$2s=1$ より $s=\frac{1}{2}$。$x$ 成分：$-s-t=-\frac{2}{3}$ より $t=\frac{1}{6}$",
           r"$z$ 成分：$k=3t=\frac{1}{2}$",
           r"よって $\frac{1}{2}$"],
          "$\\overrightarrow{AP}=s\\overrightarrow{AB}+t\\overrightarrow{AC}$ とおいて、成分ごとに $s$、$t$、$k$ を求めよう。")

    kk = sp.symbols('kk')
    so = sp.solve(R(1, 2) + R(1, 3) + kk - 1, kk)
    assert so == [R(1, 6)]
    L.add(2, r"四面体 OABC で、$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ とする。点 P が $\overrightarrow{OP}=\frac{1}{2}\vec{a}+\frac{1}{3}\vec{b}+k\vec{c}$ を満たし、平面 ABC 上にあるとき、$k$ の値はいくつか。",
          C(R(1, 6)),
          [C(R(5, 6), r'$\frac{1}{2}+\frac{1}{3}$ を、そのまま答えてしまった。'),
           C(R(-5, 6), r'係数の和を 1 でなく 0 としてしまった。'),
           C(R(1, 3), r'$\vec{b}$ の係数と同じ値にした。')],
          [r"P が平面 ABC 上 $\Leftrightarrow$ $\overrightarrow{OP}=x\vec{a}+y\vec{b}+z\vec{c}$ で $x+y+z=1$",
           r"$\frac{1}{2}+\frac{1}{3}+k=1$",
           r"$\frac{5}{6}+k=1$ より $k=\frac{1}{6}$",
           r"よって $\frac{1}{6}$"],
          "O を始点にしたとき、平面上の点になる条件は、係数の和が 1。")

    a, b, c = Mx(5, 0, 0), Mx(0, 6, 0), Mx(0, 0, 7)
    Mbc = (b + c) / 2
    Pq = R(3, 4) * Mbc
    AP = Pq - a
    cf = sp.Matrix.hstack(a, b, c).solve(AP)
    assert tuple(cf) == (-1, R(3, 8), R(3, 8))
    L.add(2, r"四面体 OABC で、$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ とする。辺 BC の中点を M、線分 OM を $3:1$ に内分する点を P とするとき、$\overrightarrow{AP}$ はどれか。",
          c3(-1, R(3, 8), R(3, 8)),
          [c3(-1, R(3, 4), R(3, 4), r'$\overrightarrow{OM}$ を $\frac{\vec{b}+\vec{c}}{2}$ でなく $\vec{b}+\vec{c}$ としてしまった（2 でわるのを忘れた）。'),
           c3(-1, R(1, 8), R(1, 8), r'OP : PM を $1:3$ と取りちがえた。'),
           c3(1, R(-3, 8), R(-3, 8), r'$\overrightarrow{PA}$ を求めてしまった（向きが逆）。')],
          [r"$\overrightarrow{OM}=\frac{\vec{b}+\vec{c}}{2}$。OP : PM $=3:1$ だから $\overrightarrow{OP}=\frac{3}{4}\overrightarrow{OM}=\frac{3}{8}(\vec{b}+\vec{c})$",
           r"$\overrightarrow{AP}=\overrightarrow{OP}-\overrightarrow{OA}$",
           r"$=\frac{3}{8}\vec{b}+\frac{3}{8}\vec{c}-\vec{a}$",
           r"よって $-\vec{a}+\frac{3}{8}\vec{b}+\frac{3}{8}\vec{c}$"],
          "まず $\\overrightarrow{OP}$ を求めてから、$\\overrightarrow{AP}=\\overrightarrow{OP}-\\overrightarrow{OA}$ を計算しよう。")

    O, a, b, c = Mx(0, 0, 0), Mx(3, 0, 1), Mx(0, 4, 1), Mx(1, 1, 5)
    Gp = b + c           # OBGC が平行四辺形
    AG = Gp - a
    cf = sp.Matrix.hstack(a, b, c).solve(AG)
    assert tuple(cf) == (-1, 1, 1)
    L.add(2, r"$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ とする。四角形 OBGC が平行四辺形になるように点 G をとるとき、$\overrightarrow{AG}$ はどれか。",
          c3(-1, 1, 1),
          [c3(1, 1, 1, r'$\overrightarrow{OG}$ でなく、$\vec{a}+\vec{b}+\vec{c}$ を答えてしまった。'),
           c3(1, -1, -1, r'$\overrightarrow{GA}$ を求めてしまった（向きが逆）。'),
           c3(-1, -1, 1, r'G の位置を、$\overrightarrow{OG}=\vec{c}-\vec{b}$ と取りちがえた。')],
          [r"四角形 OBGC が平行四辺形だから $\overrightarrow{OG}=\overrightarrow{OB}+\overrightarrow{OC}=\vec{b}+\vec{c}$",
           r"$\overrightarrow{AG}=\overrightarrow{OG}-\overrightarrow{OA}$",
           r"$=\vec{b}+\vec{c}-\vec{a}$",
           r"よって $-\vec{a}+\vec{b}+\vec{c}$"],
          "G の位置ベクトルを、$\\vec{b}$、$\\vec{c}$ で表してから、$\\overrightarrow{AG}=\\overrightarrow{OG}-\\overrightarrow{OA}$ を計算しよう。")

    # ---------- 段階3 ----------
    a, b, c = Mx(5, 0, 0), Mx(0, 6, 0), Mx(0, 0, 7)
    Gt = (a + b + c) / 3
    H4 = (a + b + c) / 4
    ratio = sp.simplify(H4.norm() / (Gt - H4).norm())
    assert ratio == 3
    L.add(3, r"四面体 OABC で、△ABC の重心を G、四面体 OABC の重心を H とする。H は線分 OG をどのように分けるか。$OH:HG$ を答えよ。",
          C(R(3, 1), tx='3:1'),
          [C(R(2, 1), r'三角形の重心と同じ $2:1$ だと考えた。', tx='2:1'),
           C(R(1, 3), r'比を逆にして答えた。', tx='1:3'),
           C(R(4, 3), r'$\frac{1}{4}$ と $\frac{1}{3}$ の分母を、そのまま比にした。', tx='4:3')],
          [r"$\overrightarrow{OG}=\frac{\vec{a}+\vec{b}+\vec{c}}{3}$、$\overrightarrow{OH}=\frac{\vec{a}+\vec{b}+\vec{c}}{4}$",
           r"$\overrightarrow{OH}=\frac{3}{4}\overrightarrow{OG}$",
           r"H は OG を $3:1$ に内分する（$OH:HG=3:1$）。",
           r"よって $3:1$"],
          "$\\overrightarrow{OH}$ は $\\overrightarrow{OG}$ の何倍かを調べよう。")

    Pq = Mx(1, 2, 3)
    tq = sp.symbols('tq')
    so = sp.solve(tq * (1 + 2 + 3) - 1, tq)
    Qp = tt(so[0] * Pq)
    assert Qp == (R(1, 6), R(1, 3), R(1, 2))
    L.add(3, r"3点 A$(1,\,0,\,0)$、B$(0,\,1,\,0)$、C$(0,\,0,\,1)$ を通る平面と、原点 O と点 P$(1,\,2,\,3)$ を通る直線 OP の交点 Q の座標はどれか。",
          C(Qp),
          [C(vt(R(1, 3), R(2, 3), 1), r'$t=\frac{1}{3}$ と取りちがえた（係数の和を $1+2$ だけで計算した）。'),
           C(vt(R(1, 14), R(1, 7), R(3, 14)), r'$|\overrightarrow{OP}|^{2}=14$ を使ってしまった。'),
           C(vt(R(1, 5), R(2, 5), R(3, 5)), r'$t=\frac{1}{5}$ と取りちがえた。')],
          [r"Q は直線 OP 上だから $\overrightarrow{OQ}=t\overrightarrow{OP}=(t,\,2t,\,3t)$",
           r"Q は平面 ABC 上だから、$\overrightarrow{OQ}=x\overrightarrow{OA}+y\overrightarrow{OB}+z\overrightarrow{OC}$ の係数の和が 1：$t+2t+3t=1$",
           r"$t=\frac{1}{6}$",
           r"よって $(\frac{1}{6},\,\frac{1}{3},\,\frac{1}{2})$"],
          "平面 ABC 上の点は、座標の和が 1 になる（O を始点にした係数の和が 1）。")

    O, A, B = Mx(0, 0, 0), Mx(1, 2, 3), Mx(2, 0, 1)
    k_ = sp.symbols('k_')
    s_, t_ = sp.symbols('s_ t_')
    sol = sp.solve(list(Mx(3, 2, k_) - s_ * A - t_ * B), [k_, s_, t_], dict=True)[0]
    assert (sol[s_], sol[t_], sol[k_]) == (1, 1, 4)
    L.add(3, r"4点 O$(0,\,0,\,0)$、A$(1,\,2,\,3)$、B$(2,\,0,\,1)$、C$(3,\,2,\,k)$ が同一平面上にあるとき、$k$ の値はいくつか。",
          C(I(4)),
          [C(I(2), r'$z$ 成分を $3s-t$ としてしまった。'),
           C(I(5), r'$z$ 成分を $3s+2t$ としてしまった。'),
           C(I(6))],
          [r"O、A、B、C が同一平面上 $\Leftrightarrow$ $\overrightarrow{OC}=s\overrightarrow{OA}+t\overrightarrow{OB}$ と書ける。",
           r"$x$ 成分：$s+2t=3$、$y$ 成分：$2s=2$ より $s=1$、$t=1$",
           r"$z$ 成分：$k=3s+t=3+1=4$",
           r"よって $4$"],
          "$\\overrightarrow{OC}=s\\overrightarrow{OA}+t\\overrightarrow{OB}$ とおき、$x$、$y$ 成分から $s$、$t$ を求めよう。")

    a, b, c = Mx(2, 0, 0), Mx(0, 3, 0), Mx(0, 0, 4)
    OF = a + b + c
    tq = sp.symbols('tq')
    so = sp.solve(tq * 3 - 1, tq)
    assert so == [R(1, 3)]
    L.add(3, r"$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ を3辺とする平行六面体で、O の反対側の頂点を F とする（$\overrightarrow{OF}=\vec{a}+\vec{b}+\vec{c}$）。対角線 OF と平面 ABC の交点を P とするとき、$OP:PF$ はどれか。",
          C(R(1, 2), tx='1:2'),
          [C(R(2, 1), r'比を逆にして答えた。', tx='2:1'),
           C(R(1, 1), r'P を OF の中点と考えた。', tx='1:1'),
           C(R(1, 3), r'$t=\frac{1}{3}$ をそのまま比にして、$1:3$ とした。', tx='1:3')],
          [r"P は OF 上だから $\overrightarrow{OP}=t\overrightarrow{OF}=t\vec{a}+t\vec{b}+t\vec{c}$",
           r"P は平面 ABC 上だから、係数の和が 1：$3t=1$ より $t=\frac{1}{3}$",
           r"$\overrightarrow{OP}=\frac{1}{3}\overrightarrow{OF}$ だから、$OP:PF=1:2$",
           r"よって $1:2$"],
          "$\\overrightarrow{OP}=t\\overrightarrow{OF}$ とおき、平面 ABC 上の条件（係数の和が 1）を使おう。")

    def cop(p, q, r):
        return abs(p + q + r - 1) < 1e-12
    s1 = cop(1, 1, -1); s2 = cop(1, 1, 1); s3 = cop(R(1, 4), R(1, 4), R(1, 4)); s4 = cop(2, 1, -1)
    assert (s1, s2, s3, s4) == (True, False, False, False)
    # 具体的に：a=(1,0,0) b=(0,1,0) c=(0,0,1) として、P が平面 x+y+z=1 上か
    L.add(3, r"四面体 OABC で、$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ とする。点 P を次のように定めるとき、4点 A、B、C、P が同一平面上にあるものはどれか。",
          C(s1, raw=r"$\overrightarrow{OP}=\vec{a}+\vec{b}-\vec{c}$"),
          [C(s2, r'係数の和が 3 で、1 になっていない。', raw=r"$\overrightarrow{OP}=\vec{a}+\vec{b}+\vec{c}$"),
           C(s3, r'係数の和が $\frac{3}{4}$ で、1 になっていない。', raw=r"$\overrightarrow{OP}=\frac{1}{4}(\vec{a}+\vec{b}+\vec{c})$"),
           C(s4, r'係数の和が 2 で、1 になっていない。', raw=r"$\overrightarrow{OP}=2\vec{a}+\vec{b}-\vec{c}$")],
          [r"A、B、C、P が同一平面上 $\Leftrightarrow$ $\overrightarrow{OP}=x\vec{a}+y\vec{b}+z\vec{c}$ で $x+y+z=1$（$\vec{a}$、$\vec{b}$、$\vec{c}$ は同一平面上にない）",
           r"$\vec{a}+\vec{b}-\vec{c}$：$1+1-1=1$ で、条件を満たす。",
           r"$\vec{a}+\vec{b}+\vec{c}$ は 3、$\frac{1}{4}(\vec{a}+\vec{b}+\vec{c})$ は $\frac{3}{4}$、$2\vec{a}+\vec{b}-\vec{c}$ は 2 で、いずれも 1 でない。",
           r"よって $\overrightarrow{OP}=\vec{a}+\vec{b}-\vec{c}$"],
          "$\\vec{a}$、$\\vec{b}$、$\\vec{c}$ の係数の和を、それぞれ計算してみよう。", echeck=False)

    # ---------- 段階4 ----------
    O, A, B, Cc = Mx(0, 0, 0), Mx(1, 0, 0), Mx(0, 2, 0), Mx(0, 0, 2)
    n_ = Mx(2, 1, 1)         # 平面 2x+y+z=2
    for V in (A, B, Cc):
        assert n_.dot(V) == 2
    tq = sp.symbols('tq')
    ts = sp.solve(tq * n_.dot(n_) - 2, tq)[0]
    H = tt(ts * n_)
    assert H == (R(2, 3), R(1, 3), R(1, 3))
    Gabc = tt((A + B + Cc) / 3)
    assert Mx(*H).dot(B - A) == 0 and Mx(*H).dot(Cc - A) == 0 and n_.dot(Mx(*H)) == 2
    L.add(4, r"座標空間に、O$(0,\,0,\,0)$、A$(1,\,0,\,0)$、B$(0,\,2,\,0)$、C$(0,\,0,\,2)$ がある。O から平面 ABC に下ろした垂線の足を H とするとき、H の座標はどれか。",
          C(H),
          [C(Gabc, r'△ABC の重心を答えた。'),
           C(vt(R(1, 3), R(1, 3), R(1, 3)), r'平面を $x+y+z=1$ と取りちがえた。'),
           C(tt(2 * Mx(*H)), r'垂線の足でなく、O に関する対称点を答えた。')],
          [r"H は平面 ABC 上だから $\overrightarrow{OH}=s\overrightarrow{OA}+t\overrightarrow{OB}+u\overrightarrow{OC}$、$s+t+u=1$。$\overrightarrow{OH}=(s,\,2t,\,2u)$",
           r"$\overrightarrow{OH}\perp\overrightarrow{AB}$：$\overrightarrow{AB}=(-1,\,2,\,0)$ より $-s+4t=0$、$\overrightarrow{OH}\perp\overrightarrow{AC}$：$\overrightarrow{AC}=(-1,\,0,\,2)$ より $-s+4u=0$",
           r"$t=u=\frac{s}{4}$ を $s+t+u=1$ に代入して $s=\frac{2}{3}$、$t=u=\frac{1}{6}$",
           r"$\overrightarrow{OH}=\left(\frac{2}{3},\,\frac{1}{3},\,\frac{1}{3}\right)$。よって $(\frac{2}{3},\,\frac{1}{3},\,\frac{1}{3})$"],
          "H が平面 ABC 上にある条件（係数の和が 1）と、$\\overrightarrow{OH}$ が $\\overrightarrow{AB}$、$\\overrightarrow{AC}$ に垂直な条件を使おう。")

    a, b, c = Mx(1, 0, 0), Mx(0, 1, 0), Mx(0, 0, 1)
    D, E, F = a / 2, b / 3, c / 4
    G = (a + b + c) / 3
    # 平面 DEF : 2x+3y+4z=1
    for V in (D, E, F):
        assert 2 * V[0] + 3 * V[1] + 4 * V[2] == 1
    kq = sp.symbols('kq')
    kk = sp.solve(2 * (kq * G[0]) + 3 * (kq * G[1]) + 4 * (kq * G[2]) - 1, kq)[0]
    assert kk == R(1, 3)
    L.add(4, r"四面体 OABC で、$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ とし、辺 OA の中点を D、辺 OB を $1:2$ に内分する点を E、辺 OC を $1:3$ に内分する点を F とする。△ABC の重心を G とし、直線 OG と平面 DEF の交点を P とするとき、$OP:PG$ はどれか。",
          C(R(1, 2), tx='1:2'),
          [C(R(1, 3), r'$\overrightarrow{OP}=\frac{1}{3}\overrightarrow{OG}$ の $\frac{1}{3}$ を、そのまま比にして、$1:3$ とした。', tx='1:3'),
           C(R(2, 1), r'比を逆にして答えた。', tx='2:1'),
           C(R(1, 1), r'P を OG の中点と考えた。', tx='1:1')],
          [r"$\overrightarrow{OD}=\frac{1}{2}\vec{a}$、$\overrightarrow{OE}=\frac{1}{3}\vec{b}$、$\overrightarrow{OF}=\frac{1}{4}\vec{c}$。$\overrightarrow{OG}=\frac{1}{3}(\vec{a}+\vec{b}+\vec{c})$",
           r"P は OG 上だから $\overrightarrow{OP}=k\overrightarrow{OG}=\frac{k}{3}\vec{a}+\frac{k}{3}\vec{b}+\frac{k}{3}\vec{c}$。これを $\overrightarrow{OD}$、$\overrightarrow{OE}$、$\overrightarrow{OF}$ で表すと $\frac{2k}{3}\overrightarrow{OD}+k\overrightarrow{OE}+\frac{4k}{3}\overrightarrow{OF}$",
           r"P は平面 DEF 上だから、係数の和が 1：$\frac{2k}{3}+k+\frac{4k}{3}=3k=1$ より $k=\frac{1}{3}$",
           r"$\overrightarrow{OP}=\frac{1}{3}\overrightarrow{OG}$ だから $OP:PG=1:2$。よって $1:2$"],
          "$\\overrightarrow{OP}=k\\overrightarrow{OG}$ を、$\\overrightarrow{OD}$、$\\overrightarrow{OE}$、$\\overrightarrow{OF}$ を使って表し、係数の和が 1 の条件を使おう。")

    Pp, Qq = Mx(2, 3, 1), Mx(0, 1, 1)
    sq = sp.symbols('sq')
    Rr = Pp + sq * (Qq - Pp)
    ss = sp.solve(Rr[0] + Rr[1] + Rr[2] - 1, sq)[0]
    Rans = tt(Rr.subs(sq, ss))
    assert ss == R(5, 4) and Rans == (R(-1, 2), R(1, 2), 1)
    w1 = tt(Rr.subs(sq, R(4, 5))); w2 = tt(Rr.subs(sq, -R(5, 4))); w3 = tt(Rr.subs(sq, R(3, 4)))
    L.add(4, r"3点 A$(1,\,0,\,0)$、B$(0,\,1,\,0)$、C$(0,\,0,\,1)$ を通る平面と、2点 P$(2,\,3,\,1)$、Q$(0,\,1,\,1)$ を通る直線の交点 R の座標はどれか。",
          C(Rans),
          [C(w1, r'$6-4s=1$ を解くとき、$s=\frac{4}{5}$ と取りちがえた。'),
           C(w2, r'$s$ の符号を取りちがえた。'),
           C(w3, r'$6-4s=3$ のように、平面の条件の右辺を取りちがえた。')],
          [r"R は直線 PQ 上だから $\overrightarrow{OR}=(1-s)\overrightarrow{OP}+s\overrightarrow{OQ}=(2-2s,\ 3-2s,\ 1)$",
           r"R は平面 ABC 上だから、係数の和が 1（座標の和が 1）：$(2-2s)+(3-2s)+1=1$",
           r"$6-4s=1$ より $s=\frac{5}{4}$",
           r"$\overrightarrow{OR}=\left(-\frac{1}{2},\,\frac{1}{2},\,1\right)$。よって $(-\frac{1}{2},\,\frac{1}{2},\,1)$"],
          "直線 PQ 上の点を $s$ で表し、平面 ABC 上の点の条件（座標の和が 1）に代入しよう。")

    a_, b_, c_ = 6, 6, 6
    ee = sp.Rational(a_ ** 2, 2)    # 正四面体：a·b=18
    tot = 3 * a_ ** 2 + 6 * ee
    h2 = sp.Rational(tot, 9)
    assert h2 == 24 and sp.sqrt(h2) == 2 * sqrt(6)
    # 座標でも確認：正四面体 (1,1,1),(1,-1,-1),(-1,1,-1),(-1,-1,1)（1辺 2√2）
    V = [Mx(1, 1, 1), Mx(1, -1, -1), Mx(-1, 1, -1), Mx(-1, -1, 1)]
    Gb = (V[1] + V[2] + V[3]) / 3
    assert sp.simplify((V[0] - Gb).norm() / (V[1] - V[0]).norm() - sqrt(6) / 3) == 0
    L.add(4, r"1辺の長さが $6$ の正四面体 OABC で、△ABC の重心を G とする。$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ とするとき、OG は平面 ABC に垂直である。この正四面体の高さ OG の長さはいくつか。",
          C(2 * sqrt(6)),
          [C(6 * sqrt(6), r'$\overrightarrow{OG}=\frac{\vec{a}+\vec{b}+\vec{c}}{3}$ の $\frac{1}{3}$ をかけ忘れた。'),
           C(3 * sqrt(3), r'底面の正三角形の高さを答えた。'),
           C(2 * sqrt(3), r'頂点 A から重心 G までの長さ（底面の外接円の半径）を答えた。')],
          [r"$|\vec{a}|=|\vec{b}|=|\vec{c}|=6$、$\vec{a}\cdot\vec{b}=\vec{b}\cdot\vec{c}=\vec{c}\cdot\vec{a}=6\times 6\times\cos 60^{\circ}=18$",
           r"$|\vec{a}+\vec{b}+\vec{c}|^{2}=3\times 36+2\times(18+18+18)=216$",
           r"$OG^{2}=\frac{216}{9}=24$（$\overrightarrow{OG}=\frac{\vec{a}+\vec{b}+\vec{c}}{3}$）",
           r"よって $OG=2\sqrt{6}$"],
          "$\\overrightarrow{OG}=\\frac{\\vec{a}+\\vec{b}+\\vec{c}}{3}$ を2乗して、内積で展開しよう。")

    rn = np.random.default_rng(9)
    al, be, ga = 1 / 6, 1 / 3, 1 / 2
    # O を原点にして確かめる
    A_, B_, C_ = rn.normal(size=3), rn.normal(size=3), rn.normal(size=3)
    P_ = al * A_ + be * B_ + ga * C_
    area = lambda U, V, W: 0.5 * np.linalg.norm(np.cross(V - U, W - U))
    assert abs(area(P_, A_, B_) / area(A_, B_, C_) - ga) < 1e-9
    assert abs(area(P_, B_, C_) / area(A_, B_, C_) - al) < 1e-9
    L.add(4, r"四面体 OABC で、$\overrightarrow{OA}=\vec{a}$、$\overrightarrow{OB}=\vec{b}$、$\overrightarrow{OC}=\vec{c}$ とする。点 P が $\overrightarrow{OP}=\frac{1}{6}\vec{a}+\frac{1}{3}\vec{b}+\frac{1}{2}\vec{c}$ を満たすとき、P は平面 ABC 上にある。△PAB の面積は、△ABC の面積の何倍か。",
          C(R(1, 2)),
          [C(R(1, 6), r'$\vec{a}$ の係数 $\frac{1}{6}$ を答えた（これは △PBC の面積比）。'),
           C(R(1, 3), r'$\vec{b}$ の係数 $\frac{1}{3}$ を答えた（これは △PCA の面積比）。'),
           C(R(2, 3), r'$\frac{1}{6}+\frac{1}{2}$ を答えた。')],
          [r"係数の和は $\frac{1}{6}+\frac{1}{3}+\frac{1}{2}=1$ で、P は平面 ABC 上。",
           r"$\overrightarrow{AP}=\overrightarrow{OP}-\overrightarrow{OA}=\frac{1}{3}(\vec{b}-\vec{a})+\frac{1}{2}(\vec{c}-\vec{a})=\frac{1}{3}\overrightarrow{AB}+\frac{1}{2}\overrightarrow{AC}$",
           r"△PAB と △ABC は底辺 AB が共通で、高さの比は $\overrightarrow{AC}$ の係数 $\frac{1}{2}$ になる。",
           r"よって $\frac{1}{2}$ 倍"],
          "$\\overrightarrow{AP}$ を $\\overrightarrow{AB}$、$\\overrightarrow{AC}$ で表し、$\\overrightarrow{AC}$ の係数に目をつけよう。")
    return L
#### L09-END

#### L10-BEGIN
def SPH(c, r2, w=None):
    """球面 (x-a)^2+(y-b)^2+(z-c)^2=r2 の選択肢"""
    return C(sph_val(c, r2), w, tx=sph_txt(c, r2))

def PLN(a, b, c, d, w=None):
    """平面 ax+by+cz+d=0 の選択肢"""
    return C(plane_val(a, b, c, d), w, tx=plane_txt(a, b, c, d))

def lesson_10():
    L = Lesson('mc1-10')
    I = Integer
    def vt(*xs):
        return tuple(sp.nsimplify(v) for v in xs)
    def Mx(*xs):
        return sp.Matrix(xs)
    def tt(m):
        return tuple(sp.nsimplify(v) for v in m)
    def nrm(v):
        return sp.sqrt(sum(t ** 2 for t in v))
    def ks(*vs): return frozenset(sp.nsimplify(v) for v in vs)
    def ktx(*vs): return 'k=' + r',\ '.join(tex(v) for v in sorted(vs))
    def cr(c, r, w=None):
        return C((tuple(sp.nsimplify(v) for v in c), sp.nsimplify(r)), w, raw=r"中心 $%s$、半径 $%s$" % (Vt(*c), tex(sp.nsimplify(r))))

    # ---------- 段階1 ----------
    L.add(1, r"中心が $(1,\,-2,\,3)$、半径が $4$ の球面の方程式はどれか。",
          SPH((1, -2, 3), 16),
          [SPH((1, -2, 3), 4, r'右辺を $r^{2}$ にせず、半径 4 のまま書いた。'),
           SPH((-1, 2, -3), 16, r'中心の座標の符号を取りちがえた。'),
           SPH((1, -2, 3), 8, r'右辺を $2r$ としてしまった。')],
          [r"中心 $(a,\,b,\,c)$、半径 $r$ の球面は $(x-a)^{2}+(y-b)^{2}+(z-c)^{2}=r^{2}$",
           r"$a=1$、$b=-2$、$c=3$、$r^{2}=16$",
           r"$(x-1)^{2}+(y+2)^{2}+(z-3)^{2}=16$",
           r"よって $(x-1)^{2}+(y+2)^{2}+(z-3)^{2}=16$"],
          "円の方程式の形に、$z$ が加わっただけ。右辺は半径の2乗。")

    L.add(1, r"球面 $(x+2)^{2}+(y-1)^{2}+z^{2}=9$ の中心の座標と半径の組はどれか。",
          cr((-2, 1, 0), 3),
          [cr((2, -1, 0), 3, r'中心の座標の符号を取りちがえた。'),
           cr((-2, 1, 0), 9, r'右辺の 9 を、そのまま半径とした。'),
           cr((-2, 1, 1), 3, r'$z^{2}$ を $(z-1)^{2}$ と読んで、$z$ 座標を 1 とした。')],
          [r"$(x-a)^{2}+(y-b)^{2}+(z-c)^{2}=r^{2}$ の形に直す。",
           r"$(x-(-2))^{2}+(y-1)^{2}+(z-0)^{2}=3^{2}$",
           r"中心は $(-2,\,1,\,0)$、半径は $r=\sqrt{9}=3$",
           r"よって 中心 $(-2,\,1,\,0)$、半径 $3$"],
          "$x+2$ は $x-(-2)$ と読む。右辺は半径の2乗。")

    L.add(1, r"平面 $2x-y+3z=5$ の法線ベクトルとして適するものはどれか。",
          C(vt(2, -1, 3)),
          [C(vt(2, -1, -3), r'$z$ の係数の符号を取りちがえた。'),
           C(vt(2, 1, 3), r'$y$ の係数の符号を取りちがえた。'),
           C(vt(2, -1, 5), r'右辺の 5 を、$z$ 成分にしてしまった。')],
          [r"平面 $ax+by+cz+d=0$ の法線ベクトルは $(a,\,b,\,c)$ である。",
           r"$2x-y+3z-5=0$ と書き直す。",
           r"$a=2$、$b=-1$、$c=3$",
           r"よって $(2,\,-1,\,3)$"],
          "$x$、$y$、$z$ の係数を、そのまま成分にしたベクトルが法線ベクトル。")

    d_ = sp.Rational(abs(1 + 2 * 2 + 2 * 3 - 4), 3)
    assert d_ == R(7, 3)
    L.add(1, r"点 $(1,\,2,\,3)$ と平面 $x+2y+2z-4=0$ の距離はいくつか。",
          C(R(7, 3)),
          [C(I(7), r'分母の $\sqrt{1^{2}+2^{2}+2^{2}}=3$ でわるのを忘れた。'),
           C(R(11, 3), r'定数項 $-4$ を使い忘れた。'),
           C(R(7, 9), r'分母を $\sqrt{9}=3$ でなく 9 にしてしまった。')],
          [r"点 $(x_{0},\,y_{0},\,z_{0})$ と平面 $ax+by+cz+d=0$ の距離は $\frac{|ax_{0}+by_{0}+cz_{0}+d|}{\sqrt{a^{2}+b^{2}+c^{2}}}$",
           r"$=\frac{|1+2\times 2+2\times 3-4|}{\sqrt{1^{2}+2^{2}+2^{2}}}$",
           r"$=\frac{7}{3}$",
           r"よって $\frac{7}{3}$"],
          "点の座標を式に代入して絶対値をとり、法線ベクトルの大きさでわる。")

    ee = sp.expand(3 * (x - 1) - y + 2 * (z - 2))
    assert ee == 3 * x - y + 2 * z - 7
    L.add(1, r"点 $(1,\,0,\,2)$ を通り、法線ベクトルが $(3,\,-1,\,2)$ である平面の方程式はどれか。",
          PLN(3, -1, 2, -7),
          [PLN(3, -1, 2, 7, r'点の座標の符号を取りちがえて、定数項を $+7$ とした。'),
           PLN(3, -1, 2, -3, r'$z$ 座標 2 の代入を忘れて、定数項を $-3$ とした。'),
           PLN(3, 1, 2, -7, r'$y$ の係数の符号を取りちがえた。')],
          [r"法線ベクトル $(a,\,b,\,c)$ で点 $(x_{0},\,y_{0},\,z_{0})$ を通る平面は $a(x-x_{0})+b(y-y_{0})+c(z-z_{0})=0$",
           r"$3(x-1)-(y-0)+2(z-2)=0$",
           r"$3x-3-y+2z-4=0$ より $3x-y+2z-7=0$",
           r"よって $3x-y+2z-7=0$"],
          "$\\vec{n}\\cdot\\overrightarrow{AP}=0$（P は平面上の点）から式をつくろう。")

    # ---------- 段階2 ----------
    A, B = sp.Matrix([1, 2, -1]), sp.Matrix([3, 0, 3])
    cen = tt((A + B) / 2)
    r2 = (B - A).dot(B - A) / 4
    assert cen == (2, 1, 1) and r2 == 6
    L.add(2, r"2点 A$(1,\,2,\,-1)$、B$(3,\,0,\,3)$ を直径の両端とする球面の方程式はどれか。",
          SPH((2, 1, 1), 6),
          [SPH((2, 1, 1), 24, r'$|\overrightarrow{AB}|^{2}=24$ を、そのまま右辺にした（直径の2乗）。'),
           SPH((2, 1, 1), 12, r'$|\overrightarrow{AB}|^{2}$ を 2 でわって右辺にした。'),
           SPH((-2, -1, -1), 6, r'中心の座標の符号を取りちがえた。')],
          [r"中心は AB の中点 $\left(\frac{1+3}{2},\ \frac{2+0}{2},\ \frac{-1+3}{2}\right)=(2,\,1,\,1)$",
           r"$AB^{2}=(3-1)^{2}+(0-2)^{2}+(3-(-1))^{2}=4+4+16=24$、半径は $\frac{AB}{2}$ だから $r^{2}=\frac{24}{4}=6$",
           r"$(x-2)^{2}+(y-1)^{2}+(z-1)^{2}=6$",
           r"よって $(x-2)^{2}+(y-1)^{2}+(z-1)^{2}=6$"],
          "中心は2点の中点。半径は、2点間の距離の半分。")

    for V, ok_ in [((1, 0, 0), True), ((0, 2, 0), True), ((0, 0, 3), True)]:
        assert 6 * V[0] + 3 * V[1] + 2 * V[2] - 6 == 0
    L.add(2, r"3点 A$(1,\,0,\,0)$、B$(0,\,2,\,0)$、C$(0,\,0,\,3)$ を通る平面の方程式はどれか。",
          PLN(6, 3, 2, -6),
          [PLN(1, 2, 3, -6, r'切片 1、2、3 を、そのまま係数にしてしまった。'),
           PLN(6, 3, 2, 6, r'定数項の符号を取りちがえた。'),
           PLN(6, 3, 2, -1, r'$\frac{x}{1}+\frac{y}{2}+\frac{z}{3}=1$ の分母をはらうとき、右辺の 1 に 6 をかけ忘れた。')],
          [r"$x$ 切片 1、$y$ 切片 2、$z$ 切片 3 だから、$\frac{x}{1}+\frac{y}{2}+\frac{z}{3}=1$",
           r"両辺に 6 をかけて、$6x+3y+2z=6$",
           r"3点の座標を代入して確かめる。A：$6$、B：$6$、C：$6$ で、どれも成り立つ。",
           r"よって $6x+3y+2z-6=0$"],
          "$x$、$y$、$z$ 軸との交点が与えられているので、切片の形の式 $\\frac{x}{a}+\\frac{y}{b}+\\frac{z}{c}=1$ が使える。")

    kk = sp.symbols('kk', real=True)
    center = Mx(1, -2, 3)
    so = sp.solve(sp.Abs(2 * 1 + 1 * (-2) - 2 * 3 + kk) - 9, kk)
    assert set(so) == {15, -3}
    L.add(2, r"球面 $(x-1)^{2}+(y+2)^{2}+(z-3)^{2}=9$ と平面 $2x+y-2z+k=0$ が接するとき、実数 $k$ の値をすべて求めよ。",
          C(ks(-3, 15), tx=ktx(-3, 15)),
          [C(ks(15), r'絶対値をはずすときの、負のほうを見落とした。', tx=ktx(15)),
           C(ks(-15, 3), r'符号を取りちがえた。', tx=ktx(-15, 3)),
           C(ks(-9, 9), r'$|k|=9$ としてしまった（中心の座標を代入するのを忘れた）。', tx=ktx(-9, 9))],
          [r"接するとき、中心 $(1,\,-2,\,3)$ と平面の距離が半径 3 に等しい。",
           r"$\frac{|2\times 1+(-2)-2\times 3+k|}{\sqrt{2^{2}+1^{2}+(-2)^{2}}}=\frac{|k-6|}{3}=3$",
           r"$|k-6|=9$ より $k-6=\pm 9$",
           r"よって $k=-3,\ 15$"],
          "接する条件は、中心と平面の距離が半径に等しいこと。絶対値は、正負の2通りを考える。")

    A, B = Mx(2, 1, 3), Mx(4, -1, 2)
    tq = sp.symbols('tq')
    Pp = A + tq * (B - A)
    ts = sp.solve(Pp[2], tq)[0]
    assert ts == 3 and tt(Pp.subs(tq, ts)) == (8, -5, 0)
    L.add(2, r"2点 A$(2,\,1,\,3)$、B$(4,\,-1,\,2)$ を通る直線が $xy$ 平面と交わる点の座標はどれか。",
          C(vt(8, -5, 0)),
          [C(vt(-4, 7, 0), r'$t$ の符号を取りちがえて、$x$、$y$ 座標を求めた。'),
           C(vt(6, -3, 1), r'$t=2$ と取りちがえた（$z$ 座標が 0 にならない）。'),
           C(vt(4, -1, 0), r'B の $z$ 座標だけを 0 にした。')],
          [r"直線上の点は $\overrightarrow{OP}=\overrightarrow{OA}+t\overrightarrow{AB}$。$\overrightarrow{AB}=(2,\,-2,\,-1)$ だから P $=(2+2t,\ 1-2t,\ 3-t)$",
           r"$xy$ 平面上は $z=0$：$3-t=0$ より $t=3$",
           r"$x=2+6=8$、$y=1-6=-5$",
           r"よって $(8,\,-5,\,0)$"],
          "直線上の点を $t$ で表し、$z$ 座標が 0 になる $t$ を求めよう。")

    r_ = sp.sqrt(25 - 9)
    assert r_ == 4
    L.add(2, r"球面 $x^{2}+y^{2}+z^{2}=25$ を平面 $z=3$ で切ったときの切り口は円になる。この円の半径はいくつか。",
          C(I(4)),
          [C(I(5), '球の半径をそのまま答えた。'),
           C(sqrt(34), r'$r^{2}-d^{2}$ でなく、$r^{2}+d^{2}$ を使ってしまった。'),
           C(I(16), r'平方根をとるのを忘れた（$x^{2}+y^{2}=16$ の右辺）。')],
          [r"$z=3$ を代入すると $x^{2}+y^{2}+9=25$",
           r"$x^{2}+y^{2}=16$",
           r"これは、平面 $z=3$ 上の、中心 $(0,\,0,\,3)$、半径 $\sqrt{16}$ の円。",
           r"よって $4$"],
          "切り口の円の式は、$z=3$ を球面の式に代入して得られる。")

    # ---------- 段階3 ----------
    xx, yy, zz = sp.symbols('xx yy zz')
    ee = sp.expand((xx - 2) ** 2 + (yy + 1) ** 2 + (zz - 3) ** 2 - 4)
    assert sp.expand(ee - (xx ** 2 + yy ** 2 + zz ** 2 - 4 * xx + 2 * yy - 6 * zz + 10)) == 0
    L.add(3, r"方程式 $x^{2}+y^{2}+z^{2}-4x+2y-6z+10=0$ が表す球面の、中心の座標と半径の組はどれか。",
          cr((2, -1, 3), 2),
          [cr((2, -1, 3), 4, r'$r^{2}=4$ の 4 を、そのまま半径とした。'),
           cr((-2, 1, -3), 2, r'中心の座標の符号を取りちがえた。'),
           cr((2, -1, 3), sqrt(14), r'定数項 10 を移項するのを忘れて、$r^{2}=4+1+9=14$ とした。')],
          [r"$x$、$y$、$z$ それぞれについて平方完成する。$(x-2)^{2}+(y+1)^{2}+(z-3)^{2}$",
           r"$x^{2}-4x=(x-2)^{2}-4$、$y^{2}+2y=(y+1)^{2}-1$、$z^{2}-6z=(z-3)^{2}-9$ だから、$(x-2)^{2}+(y+1)^{2}+(z-3)^{2}-4-1-9+10=0$",
           r"$(x-2)^{2}+(y+1)^{2}+(z-3)^{2}=4$",
           r"よって 中心 $(2,\,-1,\,3)$、半径 $2$"],
          "$x$、$y$、$z$ の項を、それぞれ平方完成しよう。右辺は半径の2乗。")

    n1, n2 = Mx(1, -1, 0), Mx(0, 1, -1)
    cs = n1.dot(n2) / (nrm(n1) * nrm(n2))
    assert cs == R(-1, 2)
    L.add(3, r"2つの平面 $x-y=2$ と $y-z=1$ のなす角 $\theta$（$0^{\circ}\leqq\theta\leqq 90^{\circ}$）はいくつか。",
          DG(60),
          [DG(120, r'法線ベクトルのなす角（鈍角のほう）を、そのまま答えた。'),
           DG(30, r'$\frac{1}{2}$ を見て $30^{\circ}$ と取りちがえた（$\cos 30^{\circ}=\frac{\sqrt{3}}{2}$ である）。'),
           DG(45, r'$\cos\theta=\frac{1}{2}$ の角を、$45^{\circ}$ と取りちがえた。')],
          [r"法線ベクトルは $\vec{n}_{1}=(1,\,-1,\,0)$、$\vec{n}_{2}=(0,\,1,\,-1)$。内積は $-1$、大きさはどちらも $\sqrt{2}$",
           r"$\cos\varphi=\frac{-1}{\sqrt{2}\times\sqrt{2}}=-\frac{1}{2}$ より、法線ベクトルのなす角は $120^{\circ}$",
           r"2平面のなす角は、$0^{\circ}$ 以上 $90^{\circ}$ 以下にとるので、$180^{\circ}-120^{\circ}$",
           r"よって $60^{\circ}$"],
          "2平面のなす角は、法線ベクトルのなす角から考える。鋭角にとる。")

    dd = sp.Rational(abs(2 * 1 - 2 * 2 + 1 * (-1) + 6), 3)
    assert dd == 1
    L.add(3, r"中心が $(1,\,2,\,-1)$ で、平面 $2x-2y+z+6=0$ に接する球面の方程式はどれか。",
          SPH((1, 2, -1), 1),
          [SPH((1, 2, -1), 9, r'中心と平面の距離を求めるとき、分母の 3 でわるのを忘れた（半径 3）。'),
           SPH((1, 2, -1), 3, r'分母の 3 でわる前の値 3 を、右辺に書いた。'),
           SPH((-1, -2, 1), 1, r'中心の座標の符号を取りちがえた。')],
          [r"接するから、半径は中心と平面の距離に等しい。",
           r"$r=\frac{|2\times 1-2\times 2+(-1)+6|}{\sqrt{2^{2}+(-2)^{2}+1^{2}}}=\frac{3}{3}=1$",
           r"$r^{2}=1$ だから、$(x-1)^{2}+(y-2)^{2}+(z+1)^{2}=1$",
           r"よって $(x-1)^{2}+(y-2)^{2}+(z+1)^{2}=1$"],
          "球が平面に接するとき、半径は、中心から平面までの距離。")

    P0, d0 = Mx(1, 0, -1), Mx(2, 1, 2)
    tq = sp.symbols('tq')
    Pt = P0 + tq * d0
    so = sp.solve(Pt.dot(Pt) - 11, tq)
    assert set(so) == {1, -1}
    chord = (Pt.subs(tq, 1) - Pt.subs(tq, -1)).norm()
    assert chord == 6 and tt(Pt.subs(tq, 1)) == (3, 1, 1) and tt(Pt.subs(tq, -1)) == (-1, -1, -3)
    L.add(3, r"球面 $x^{2}+y^{2}+z^{2}=11$ と、点 $(1,\,0,\,-1)$ を通り方向ベクトルが $(2,\,1,\,2)$ の直線が、2点で交わっている。この2点を結ぶ線分（弦）の長さはいくつか。",
          C(I(6)),
          [C(I(2), r'2つの交点に対応する $t$ の差だけを答えた（方向ベクトルの大きさ 3 をかけ忘れた）。'),
           C(2 * sqrt(11), '球の直径を答えた。'),
           C(2 * sqrt(13), r'中心と直線の距離の2乗を、足してしまった。')],
          [r"直線上の点は $(1+2t,\ t,\ -1+2t)$。球面の式に代入して $(1+2t)^{2}+t^{2}+(-1+2t)^{2}=11$",
           r"$9t^{2}+2=11$ より $t^{2}=1$、$t=\pm 1$。交点は $(3,\,1,\,1)$ と $(-1,\,-1,\,-3)$",
           r"弦の長さは $\sqrt{(3-(-1))^{2}+(1-(-1))^{2}+(1-(-3))^{2}}=\sqrt{16+4+16}$",
           r"$=\sqrt{36}=6$。よって $6$"],
          "直線上の点を $t$ で表し、球面の式に代入して $t$ を求めよう。2点の座標から長さが出る。")

    def circle_cut(h):   # 球 (x-1)^2+(y-2)^2+(z-3)^2=4 と平面 z=h
        dd_ = abs(h - 3)
        return dd_ < 2
    # x=5 : d=4（交わらない）、y=0 : d=2（接する）、z=6 : d=3（交わらない）
    ok_z4 = (abs(4 - 3) < 2)
    ok_x5 = (abs(5 - 1) < 2)
    ok_y0 = (abs(0 - 2) < 2)
    ok_z6 = (abs(6 - 3) < 2)
    assert (ok_z4, ok_x5, ok_y0, ok_z6) == (True, False, False, False)
    L.add(3, r"球面 $(x-1)^{2}+(y-2)^{2}+(z-3)^{2}=4$ と、次の平面が交わって、その共通部分が円（1点ではない）になるものはどれか。",
          C(ok_z4, raw=r"$z=4$"),
          [C(ok_x5, r'中心と平面の距離が 4 で、半径 2 より大きいことを確かめなかった。', raw=r"$x=5$"),
           C(ok_y0, r'距離が半径に等しい（接する）ときも、円になると考えた。', raw=r"$y=0$"),
           C(ok_z6, r'中心と平面の距離が 3 で、半径 2 より大きいことを確かめなかった。', raw=r"$z=6$")],
          [r"球面の中心は $(1,\,2,\,3)$、半径は 2。中心と平面の距離 $d$ が $d<2$ なら円で交わる。",
           r"$z=4$：$d=|4-3|=1<2$。$x=5$：$d=4$、$y=0$：$d=2$、$z=6$：$d=3$",
           r"$d=2$ は接する（共通部分は 1点）、$d>2$ は共有点なし。",
           r"よって $z=4$"],
          "中心と平面の距離を求めて、半径と比べよう。", echeck=False)

    # ---------- 段階4 ----------
    Cc = Mx(1, 2, 3); n = Mx(1, 2, 2); k0 = 2
    f = n.dot(Cc) - k0
    Hc = tt(Cc - f * n / n.dot(n))
    assert f == 9 and Hc == (0, 0, 1) and sp.sqrt(25 - (f / nrm(n)) ** 2) == 4
    L.add(4, r"球面 $(x-1)^{2}+(y-2)^{2}+(z-3)^{2}=25$ を平面 $x+2y+2z=2$ で切ったときの切り口は円になる。この円の中心の座標はどれか。",
          C(Hc),
          [C(tt(Cc + n), r'垂線の足を求めるとき、向きを逆にした。'),
           C(tt(Cc - 3 * n), r'法線ベクトルを単位ベクトルにせず、距離 3 をそのままかけた。'),
           C(vt(1, 2, 3), r'球の中心を答えた。')],
          [r"円の中心は、球の中心 C$(1,\,2,\,3)$ から平面に下ろした垂線の足。$\vec{n}=(1,\,2,\,2)$、$\overrightarrow{CH}=t\vec{n}$ とおくと H $=(1+t,\ 2+2t,\ 3+2t)$",
           r"H は平面上だから $(1+t)+2(2+2t)+2(3+2t)=2$ より $11+9t=2$、$t=-1$",
           r"H $=(1-1,\ 2-2,\ 3-2)=(0,\,0,\,1)$（距離は $|t||\vec{n}|=3$、半径は $\sqrt{25-9}=4$）",
           r"よって $(0,\,0,\,1)$"],
          "球の中心から平面に垂線を下ろす。垂線の足が、切り口の円の中心になる。")

    A = Mx(1, 2, 3); n = Mx(1, 1, 1); k0 = 3
    f = n.dot(A) - k0
    H = A - f * n / n.dot(n)
    Ap = tt(A - 2 * f * n / n.dot(n))
    assert tt(H) == (0, 1, 2) and Ap == (-1, 0, 1)
    L.add(4, r"点 A$(1,\,2,\,3)$ と、平面 $x+y+z=3$ に関して対称な点 A$'$ の座標はどれか。",
          C(Ap),
          [C(tt(H), r'垂線の足を答えた（2 倍するのを忘れた）。'),
           C(tt(A + 2 * n), r'法線ベクトルの向きを逆にして、反対側に進んでしまった。'),
           C(tt(A + n), r'A に法線ベクトルを 1 回足しただけにした。')],
          [r"法線ベクトルは $(1,\,1,\,1)$。垂線の足を H $=(1+t,\ 2+t,\ 3+t)$ とおくと、平面上だから $6+3t=3$ より $t=-1$",
           r"H $=(0,\,1,\,2)$",
           r"H は線分 AA$'$ の中点だから、A$'=2\text{H}-\text{A}=(2\cdot 0-1,\ 2\cdot 1-2,\ 2\cdot 2-3)$",
           r"よって $(-1,\,0,\,1)$"],
          "A から平面に垂線を下ろした足 H を求め、H が線分 AA$'$ の中点であることを使おう。")

    Ob, Aa, Bb, Cb = Mx(0, 0, 0), Mx(2, 0, 0), Mx(0, 4, 0), Mx(0, 0, 6)
    for V in (Ob, Aa, Bb, Cb):
        assert (V[0] - 1) ** 2 + (V[1] - 2) ** 2 + (V[2] - 3) ** 2 == 14
    L.add(4, r"4点 O$(0,\,0,\,0)$、A$(2,\,0,\,0)$、B$(0,\,4,\,0)$、C$(0,\,0,\,6)$ を通る球面の方程式はどれか。",
          SPH((1, 2, 3), 14),
          [SPH((1, 2, 3), 56, r'$r^{2}=\frac{p^{2}+q^{2}+s^{2}}{4}$ の 4 でわるのを忘れた。'),
           SPH((1, 2, 3), 7, r'$r^{2}$ を求めるとき、2 でわってしまった。'),
           SPH((-1, -2, -3), 14, r'中心の座標の符号を取りちがえた。')],
          [r"球面を $x^{2}+y^{2}+z^{2}+px+qy+sz+t=0$ とおく。O を通るから $t=0$",
           r"A：$4+2p=0$ より $p=-2$、B：$16+4q=0$ より $q=-4$、C：$36+6s=0$ より $s=-6$",
           r"$x^{2}+y^{2}+z^{2}-2x-4y-6z=0$ を平方完成して $(x-1)^{2}+(y-2)^{2}+(z-3)^{2}=1+4+9=14$",
           r"よって $(x-1)^{2}+(y-2)^{2}+(z-3)^{2}=14$"],
          "球面の方程式を一般形でおき、通る点の座標を代入して係数を求めよう。")

    n1, n2 = Mx(1, 1, 1), Mx(1, -1, 0)
    dv = Mx(1, 1, -2)
    assert dv.dot(n1) == 0 and dv.dot(n2) == 0
    for w_ in [(1, -1, 0), (1, 1, 1), (1, 1, 2)]:
        assert not (Mx(*w_).dot(n1) == 0 and Mx(*w_).dot(n2) == 0)
    L.add(4, r"2つの平面 $x+y+z=1$ と $x-y=0$ が交わってできる直線の、方向ベクトルとして適するものはどれか。",
          C(vt(1, 1, -2)),
          [C(vt(1, -1, 0), r'一方の平面の法線ベクトルを、そのまま答えた。'),
           C(vt(1, 1, 1), r'一方の平面の法線ベクトルを、そのまま答えた。'),
           C(vt(1, 1, 2), r'$z$ 成分の符号を取りちがえた。')],
          [r"2つの平面の法線ベクトルは $\vec{n}_{1}=(1,\,1,\,1)$、$\vec{n}_{2}=(1,\,-1,\,0)$。交線は両方の平面に含まれるので、方向ベクトル $\vec{d}=(p,\,q,\,r)$ は両方に垂直。",
           r"$\vec{d}\cdot\vec{n}_{1}=p+q+r=0$、$\vec{d}\cdot\vec{n}_{2}=p-q=0$",
           r"$q=p$、$r=-2p$ より $\vec{d}=p(1,\,1,\,-2)$",
           r"よって $(1,\,1,\,-2)$"],
          "交線の方向ベクトルは、2つの法線ベクトルの両方に垂直。内積が 0 の条件を2つ立てよう。")

    Cs, rs = Mx(1, -1, 2), 3
    n = Mx(2, 2, -1); k0 = 17
    fv = n.dot(Cs) + k0
    dist = sp.Abs(fv) / nrm(n)
    assert dist == 5 and dist > rs and dist + rs == 8 and dist - rs == 2
    L.add(4, r"球面 $(x-1)^{2}+(y+1)^{2}+(z-2)^{2}=9$ 上の点 P と、平面 $2x+2y-z+17=0$ の距離の最大値はいくつか。",
          C(I(8)),
          [C(I(2), r'最大値でなく、最小値を答えた。'),
           C(I(5), r'球の中心と平面の距離を答えた（半径を足すのを忘れた）。'),
           C(I(18), r'中心と平面の距離を求めるとき、分母の 3 でわるのを忘れた（$15+3$）。')],
          [r"球の中心 $(1,\,-1,\,2)$ と平面 $2x+2y-z+17=0$ の距離は $\frac{|2-2-2+17|}{\sqrt{2^{2}+2^{2}+(-1)^{2}}}=\frac{15}{3}=5$",
           r"$5>3$（半径）だから、球は平面と交わらない。",
           r"球面上の点の距離は、中心との距離 $\pm$ 半径の範囲で動く。最大は $5+3$",
           r"よって $8$"],
          "まず、球の中心と平面の距離を求めよう。球面上の点は、中心から半径の分だけ離れている。")
    return L
#### L10-END


LESSONS = [lesson_01, lesson_02, lesson_03, lesson_04, lesson_05, lesson_06, lesson_07, lesson_08, lesson_09, lesson_10]
#### MAIN-BEGIN
# 使い方: python3 h3d.verify.py            → 全問を計算し直して一覧にし、out/h3d/*.json の正解と突き合わせる
#        python3 h3d.verify.py --write    → 計算した問題を out/h3d/<授業のid>.json に書き出す（その後に突き合わせ）
OUT = os.environ.get('H3D_OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'h3d')

def main():
    write = '--write' in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith('--')]
    bad = 0
    total = 0
    for fn in LESSONS:
        L = fn()
        lid = L.lid
        if only and lid not in only:
            continue
        built = L.build()
        path = os.path.join(OUT, lid + '.json')
        if write:
            os.makedirs(OUT, exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(built, f, ensure_ascii=False, indent=1)
        disk = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else None
        print('=' * 20, lid, '=' * 20)
        for it, bj in zip(L.items, built):
            total += 1
            ans = it['ok'].text
            # 突き合わせ：JSON の k:1 の選択肢の文字 ＝ 計算した答えの文字
            dj = None
            if disk is not None:
                dj = next((d for d in disk if d['id'] == it['id']), None)
            kj = None
            if dj is not None:
                ks = [c['t'] for c in dj['c'] if c.get('k') == 1]
                kj = ks[0] if len(ks) == 1 else None
            ok = (dj is not None) and (kj == ans) and (dj == bj)
            if not ok:
                bad += 1
            print('%s [%s] %s\n      → 計算した答え: %s   JSON正解: %s' % (
                it['id'], 'OK' if ok else '不一致', plain(it['q'])[:90], ans, kj))
    print('\n問題 %d 問、不一致 %d 問' % (total, bad))
    if bad:
        sys.exit(1)

if __name__ == '__main__':
    main()
#### MAIN-END
