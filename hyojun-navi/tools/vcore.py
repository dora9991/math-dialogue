#!/usr/bin/env python3
"""検算の本体（tools/verify.py が読みこんで使う。これだけでは動かさない）。
ワークシートなどの書き方の式を sympy が読める形に直し、記入欄（W）につけた v（検算の種類）と vp（問題の式）から、解答例の最後の答えを確かめる。
       calc … 式の計算・式の展開など（問題の式と答えが等しい）      fact … 因数分解（等しい＋積の形）
       eq   … 1つの文字の方程式（答えの「x＝…」が解）               sys  … 連立方程式（{|式|式|} と「x＝…、y＝…」）
       quad … 二次方程式（答えの「x＝…、x＝…」「x＝…±…」が解の全部）  val  … 式の値（vp は「式 ; a＝2 ; b＝−3」）
       pts  … 関数の式（答えの最後の「y＝…」が、vp の点「(1, 5) (2, 7)」をぜんぶ通る）
       roc  … 変化の割合（vp は「式 ; はじめの x ; おわりの x」）
図の検査（geo_check）：図形（GE）の「長さ」「角」「直角」「印」が、点の座標と合っているか。わざと縮尺どおりにかかない図は、図に ns: true をつける。
"""
import json, os, re, subprocess, sys
import sympy as sp

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------- 書き方 → sympy ----------
NAMES = {'π': 'pi'}
def to_py(s):
    """ワークシートの書き方の式を、sympy が読める形にする"""
    s = str(s)
    s = s.replace('\\', '').replace('　', ' ')
    for a, b in (('−', '-'), ('－', '-'), ('–', '-'), ('＋', '+'), ('×', '*'), ('÷', '/'), ('＝', '='), ('（', '('), ('）', ')'), ('｛', '('), ('｝', ')'), ('〔', '('), ('〕', ')'), ('，', ','), ('{{', ''), ('}}', '')):
        s = s.replace(a, b)
    # 分数 [[a/b]]（内側から）
    for _ in range(20):
        m = re.search(r'\[\[([^\[\]]*?)/([^\[\]]*?)\]\]', s)
        if not m: break
        s = s[:m.start()] + '((' + m.group(1) + ')/(' + m.group(2) + '))' + s[m.end():]
    # 根号 √{…}／√数／√文字
    for _ in range(20):
        m = re.search(r'√\{([^{}]*)\}', s)
        if not m: break
        s = s[:m.start()] + 'sqrt(' + m.group(1) + ')' + s[m.end():]
    s = re.sub(r'√(\d+(?:\.\d+)?|[a-z])', r'sqrt(\1)', s)
    # 累乗 ^{…}／^2
    s = re.sub(r'\^\{([^{}]*)\}', r'**(\1)', s)
    s = s.replace('^', '**')
    s = s.replace('²', '**2').replace('³', '**3')
    for a, b in NAMES.items(): s = s.replace(a, ' ' + b + ' ')
    toks = re.findall(r'sqrt|pi|\d+\.\d+|\d+|[A-Za-z]|\*\*|[-+*/()=,]', s)
    rest = re.sub(r'sqrt|pi|\d+\.\d+|\d+|[A-Za-z]|\*\*|[-+*/()=,]|\s', '', s)
    if rest: raise ValueError('読めない字: ' + rest + '  ← ' + s)
    # ＝ や , で分けて、それぞれを組み立て直す
    out, cur = [], []
    for t in toks + ['=']:
        if t in ('=', ','):
            out.append(_build(cur) if cur else ''); out.append(t); cur = []
        else: cur.append(t)
    return ''.join(out[:-1])

def _build(toks):
    """字をならべたかけ算（4a・2(x+1)・ab）を、× ÷ より先にまとめる（12ab÷4a×b ＝ (12ab)÷(4a)×b）"""
    pos = [0]
    def peek(): return toks[pos[0]] if pos[0] < len(toks) else None
    def take(): pos[0] += 1; return toks[pos[0] - 1]
    def atom():
        t = peek()
        if t is None: raise ValueError('式がとちゅうで終わっている')
        if t == 'sqrt':
            take()
            if peek() != '(': raise ValueError('√ のあとに ( がない')
            take(); e = expr()
            if take() != ')': raise ValueError(') がない')
            return 'sqrt(' + e + ')'
        if t == '(':
            take(); e = expr()
            if take() != ')': raise ValueError(') がない')
            return '(' + e + ')'
        if re.match(r'\d|[A-Za-z]$|pi$', t): return take()
        raise ValueError('読めないならび: ' + ' '.join(toks))
    def power():
        a = atom()
        if peek() == '**': take(); a = a + '**' + unary()
        return a
    def unary():
        if peek() in ('-', '+'): return take() + unary()
        return power()
    def starts_value(t): return t is not None and (t in ('(', 'sqrt') or bool(re.match(r'\d|[A-Za-z]$|pi$', t)))
    def juxt():
        fs = [unary()]
        while starts_value(peek()): fs.append(power())
        return fs[0] if len(fs) == 1 else '(' + '*'.join(fs) + ')'
    def term():
        e = juxt()
        while peek() in ('*', '/'): e += take() + juxt()
        return e
    def expr():
        e = term()
        while peek() in ('+', '-'): e += take() + term()
        return e
    e = expr()
    if pos[0] != len(toks): raise ValueError('読めないならび: ' + ' '.join(toks))
    return e

def S(s):
    py = to_py(s)
    letters = set(re.findall(r'(?<![A-Za-z])[A-Za-z](?![A-Za-z])', re.sub(r'sqrt|pi', '', py)))
    loc = {c: sp.Symbol(c) for c in letters}
    loc.update(sqrt=sp.sqrt, pi=sp.pi)
    return sp.sympify(py, locals=loc, rational=True)

def last_line(ans):
    ls = [l for l in str(ans).replace('　　', '\n').split('\n') if l.strip()]
    return ls[-1].strip() if ls else ''

UNITS = re.compile(r'(?:\\m|\\g|cm|mm|km|kg|mL|dL)(?:\^[23])?')
MATHCH = re.compile(r'^[0-9A-Za-z.+\-−－×÷*/()\[\]{}^√π± ]+')
def clean_expr(t):
    """式のうしろについた単位やことば（13cm・2x^2（比例）など）を取る"""
    t = UNITS.sub('', str(t)).strip()
    m = MATHCH.match(t)
    return m.group(0).strip() if m else ''

def final_value(ans):
    """解答例の最後の答え：下の行から見て、最後の＝のあとの式（単位・「答え」・「約」などは取る）"""
    ls = [l.strip() for l in str(ans).replace('　　', '\n').split('\n') if l.strip()]
    for t in reversed(ls):
        if '答え' in t: t = t.split('答え')[-1].strip()
        if re.match(r'^(約|およそ)', t) and '＝' not in t: continue   # 「約6.3cm」のような概数の行は使わず、その上の行の値で確かめる
        cands = [t.split('＝')[-1]] if '＝' in t else [t]
        for c in cands:
            c = re.sub(r'^(約|およそ|秒速|時速|分速)', '', c.strip())
            e = clean_expr(c)
            if e and re.search(r'[0-9A-Za-z]', e):
                try: S(e); return e
                except Exception: pass
    return ''

def assigns(ans, flat=False):
    """解答例の中の「x＝値」を、文字ごとに最後のものだけ集める"""
    t = str(ans).replace('\n', '　')
    out = {}
    for m in re.finditer(r'(?<![A-Za-z])([a-z])＝([^＝、。　\s]+(?:\s*)?)', t):
        v = clean_expr(m.group(2)) if '±' not in m.group(2) else m.group(2).strip()
        if v: out[m.group(1)] = v
    return out

def eq_zero(e):
    e = sp.simplify(e)
    if e == 0: return True
    try: return abs(complex(sp.N(e))) < 1e-9 if not e.free_symbols else sp.expand(e) == 0
    except Exception: return False

def check(kind, vp, ans):
    kind = kind.strip()
    if kind in ('calc', 'fact'):
        a = final_value(ans)
        if not eq_zero(S(vp) - S(a)): return f'式 {vp} ≠ 答え {a}'
        if kind == 'fact':   # 答えが「積の形」になっているか（かっこをひらいた形のままは×）
            st = sp.sympify(to_py(a), locals={c: sp.Symbol(c) for c in re.findall(r'[A-Za-z]', re.sub(r'sqrt|pi', '', to_py(a)))}, rational=True, evaluate=False)
            if st.func not in (sp.Mul, sp.Pow): return f'因数分解の形でない: {a}'
        return None
    if kind == 'eq':
        l, r = to_py(vp).split('=')
        e = S(l) - S(r); syms = sorted(e.free_symbols, key=str)
        if len(syms) != 1: return f'文字が1つでない: {vp}'
        x = syms[0]; sol = sp.solve(sp.Eq(e, 0), x)
        got = assigns(ans).get(str(x))
        if got is None: return f'答えに {x}＝ がない'
        if len(sol) != 1 or not eq_zero(sol[0] - S(got)): return f'{vp} の解は {sol}、答えは {got}'
        return None
    if kind == 'sys':
        m = re.search(r'\{\|(.+?)\|\}', vp); eqs = [t for t in (m.group(1) if m else vp).split('|') if t.strip()]
        got = assigns(ans); es = []
        for q in eqs:
            parts = to_py(q).split('=')
            for i in range(len(parts) - 1): es.append(S(parts[i]) - S(parts[i + 1]))   # A＝B＝C の形もよい
        syms = sorted(set().union(*[e.free_symbols for e in es]), key=str)
        sub = {}
        for x in syms:
            if str(x) not in got: return f'答えに {x}＝ がない'
            sub[x] = S(got[str(x)])
        bad = [str(e) for e in es if not eq_zero(e.subs(sub))]
        return f'{sub} が式に合わない: {bad}' if bad else None
    if kind == 'quad':
        l, r = to_py(vp).split('=')
        e = S(l) - S(r); x = sorted(e.free_symbols, key=str)[0]
        sol = set(sp.nsimplify(v) for v in sp.solve(sp.Eq(e, 0), x))
        t = str(ans).replace('\n', '　')
        vals = [m.group(1) for m in re.finditer(r'(?<![A-Za-z])' + str(x) + r'＝([^＝、。　\s]+)', t)]
        # 答えの行（最後の行）にあるものだけを使う
        ll = last_line(ans); lv = [m.group(1) for m in re.finditer(r'(?<![A-Za-z])' + str(x) + r'＝([^＝、。　\s]+)', ll)]
        vals = lv or vals[-2:]
        got = set()
        for v in vals:
            if '±' in v:
                got.add(sp.nsimplify(sp.simplify(S(v.replace('±', '+'))))); got.add(sp.nsimplify(sp.simplify(S(v.replace('±', '-')))))
            else: got.add(sp.nsimplify(sp.simplify(S(v))))
        ok = len(sol) == len(got) and all(any(eq_zero(a - b) for b in got) for a in sol)
        return None if ok else f'{vp} の解は {sol}、答えは {got}'
    if kind == 'pts':   # 関数の式：答えの最後の「y＝…」のグラフが、vp に書いた点をぜんぶ通るか。vp は「(1, 5) (2, 7)」
        t = str(ans).replace('\n', '　')
        eqs = re.findall(r'(?<![A-Za-z])y＝([^＝、。　\s]+)', t)
        if not eqs: return '答えに y＝ がない'
        rhs = clean_expr(eqs[-1]); f = S(rhs); x = sp.Symbol('x')
        pts = re.findall(r'[(（]\s*([^()（），,]+?)\s*[,，]\s*([^()（），,]+?)\s*[)）]', str(vp))
        if not pts: return f'点が読めない: {vp}'
        bad = [f'({a},{b})' for a, b in pts if not eq_zero(f.subs(x, S(a)) - S(b))]
        return f'y＝{eqs[-1]} は {bad} を通らない' if bad else None
    if kind == 'roc':   # 変化の割合：vp は「式 ; はじめの x ; おわりの x」
        parts = [t.strip() for t in vp.split(';')]
        f = S(parts[0]); x = sp.Symbol('x'); x1, x2 = S(parts[1]), S(parts[2])
        r = (f.subs(x, x2) - f.subs(x, x1)) / (x2 - x1); a = final_value(ans)
        return None if eq_zero(r - S(a)) else f'{vp} の変化の割合は {r}、答えは {a}'
    if kind == 'val':
        parts = [t.strip() for t in vp.split(';')]
        e = S(parts[0]); sub = {}
        for t in parts[1:]:
            k, v = to_py(t).split('='); sub[sp.Symbol(k.strip())] = S(v)
        a = final_value(ans)
        return None if eq_zero(e.subs(sub) - S(a)) else f'{vp} の値は {e.subs(sub)}、答えは {a}'
    return f'知らない種類: {kind}'

def walk(blocks):
    for b in blocks:
        if b.get('type') == 'cols':
            for c in b.get('cols', []): yield from walk(c.get('blocks', []))
        else: yield b

# ---------- 図（GE）が、書いてある長さ・角度のとおりにかけているか ----------
GEO_FLAGS = {'点線', '太', '太線', '細', '細線', '塗り', '非表示', '名前なし', '二重', '灰', '大', '●'}
GEO_DIRS = {'上', '下', '左', '右', '左上', '右上', '左下', '右下'}
def geo_check(src, tol_len=0.04, tol_ang=1.5):
    """1つの図の中で、「長さ」の数÷座標の距離がそろっているか、「角」「直角」の大きさが座標と合っているか、「印」が同じ辺は同じ長さか"""
    import math
    P, lens, msgs, ticks = {}, [], [], {}
    rows = []
    for raw in str(src).split('\n'):
        t = raw.strip()
        if not t or t[0] == '#': continue
        if t[0] in '*＊': t = t[1:].strip()
        tok = re.split(r'[\s　]+', t)
        args = [x for x in tok[1:] if x not in GEO_FLAGS and x not in GEO_DIRS]
        rows.append((tok[0], args))
        if tok[0] in ('点', '頂点') and args:
            try:
                if len(args) >= 4 and args[1] == '中点' and args[2] in P and args[3] in P:
                    a, b = P[args[2]], P[args[3]]; P[args[0]] = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
                elif len(args) >= 5 and args[1] == '極' and args[2] in P:
                    o = P[args[2]]; r = float(args[3]); an = math.radians(float(args[4])); P[args[0]] = (o[0] + r * math.cos(an), o[1] + r * math.sin(an))
                else: P[args[0]] = (float(args[1]), float(args[2]))
            except Exception: pass
    dist = lambda a, b: math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1])
    def ang(b, a, c):
        v1 = (P[b][0] - P[a][0], P[b][1] - P[a][1]); v2 = (P[c][0] - P[a][0], P[c][1] - P[a][1])
        d = math.degrees(math.atan2(v2[1], v2[0]) - math.atan2(v1[1], v1[0])) % 360
        return min(d, 360 - d)
    for cmd, a in rows:
        if cmd in ('長さ', '線分') and len(a) >= 3 and a[0] in P and a[1] in P:
            lab = UNITS.sub('', ''.join(a[2:]).replace('\\', '')).strip()
            try:
                v = S(lab)
                if not v.free_symbols and float(v) > 0 and dist(a[0], a[1]) > 1e-9: lens.append((float(v) / dist(a[0], a[1]), a[0] + a[1], ''.join(a[2:])))
            except Exception: pass
        elif cmd == '角' and len(a) >= 4 and all(k in P for k in a[:3]):
            m = re.match(r'^(\d+(?:\.\d+)?)°$', ''.join(a[3:]))
            if m and abs(ang(a[0], a[1], a[2]) - float(m.group(1))) > tol_ang: msgs.append(f'角{a[0]}{a[1]}{a[2]} は {m.group(1)}° と書いてあるが、図では {ang(a[0], a[1], a[2]):.1f}°')
        elif cmd == '直角' and len(a) >= 3 and all(k in P for k in a[:3]):
            if abs(ang(a[0], a[1], a[2]) - 90) > 1.0: msgs.append(f'直角{a[0]}{a[1]}{a[2]} が、図では {ang(a[0], a[1], a[2]):.1f}°')
        elif cmd == '印' and len(a) >= 2 and a[0] in P and a[1] in P:
            ticks.setdefault(a[2] if len(a) > 2 else '1', []).append((dist(a[0], a[1]), a[0] + a[1]))
    if len(lens) >= 2:
        rs = sorted(r for r, _, _ in lens); mid = rs[len(rs) // 2]
        for r, nm, lab in lens:
            if abs(r / mid - 1) > tol_len: msgs.append(f'長さ {nm}＝{lab} が、ほかの長さと縮尺が合わない（{r / mid:.2f}倍）')
    for k, lst in ticks.items():
        ds = [d for d, _ in lst]
        if max(ds) > 1e-9 and (max(ds) - min(ds)) / max(ds) > 0.03: msgs.append(f'印{k} の辺の長さがそろっていない: ' + '、'.join(f'{nm}={d:.2f}' for d, nm in lst))
    return msgs
