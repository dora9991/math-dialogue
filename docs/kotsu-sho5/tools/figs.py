"""小1の問題の図（SVG）を、公開中の問題と同じ書き方で作る道具。問題の "f" に、そのまま入れる。
使い方（python3）:  import sys; sys.path.insert(0, '<e1 フォルダ>'); import figs
  figs.clock(4, 30)                      とけい（4じ30ぷん。みじかい はりは、ぷんに あわせて すすむ）
  figs.numberline(0, 20, arrow=14)       かずの せん（0〜20。5ごとに ながい めもりと かず。arrow の ところに ▼）
  figs.numberline(60, 100, step=1, major=10, arrow=73)
  figs.blocks(3, 4)                      10の ぼう 3本 と ばらの ブロック 4こ（34）
  figs.dots([3, 2], kinds=['●', '○'])    ● 3こ と ○ 2こ を ならべる（かぞえる・あわせる・のこり）
  figs.grid({'あ': [(0,0),(1,0),(0,1)], 'い': [(0,0),(1,0),(2,0),(0,1)]})   ひろさ くらべ（マスの かず）
どの図も、こたえが 図から 1とおりに よめることを、自分で たしかめる。"""
import math

HEAD = '<svg class="fig" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{label}" xmlns="http://www.w3.org/2000/svg">'
def _t(x, y, s, size=14, weight=None):
    w = f' font-weight="{weight}"' if weight else ''
    return f'<text x="{x:g}" y="{y:g}" text-anchor="middle" dominant-baseline="central" font-size="{size}" class="fg-t"{w}>{s}</text>'
def _r(v): return round(v, 1)

def clock(h, m=0):
    assert 1 <= h <= 12 and 0 <= m < 60
    o = [HEAD.format(w=180, h=180, label='時計'), '<circle cx="90" cy="90" r="76" class="fg-l fg-bg" stroke-width="2.5"/>']
    for i in range(60):
        a = math.radians(i * 6); big = i % 5 == 0
        r1, r2 = (67, 75) if big else (72, 75)
        o.append(f'<line x1="{_r(90 + r1 * math.sin(a))}" y1="{_r(90 - r1 * math.cos(a))}" x2="{_r(90 + r2 * math.sin(a))}" y2="{_r(90 - r2 * math.cos(a))}" class="fg-l" stroke-width="{2 if big else 1}"/>')
    for n in range(1, 13):
        a = math.radians(n * 30)
        o.append(_t(_r(90 + 56 * math.sin(a)), _r(90 - 56 * math.cos(a)), n, 14, 600))
    ah = math.radians((h % 12 + m / 60) * 30); am = math.radians(m * 6)
    o.append(f'<line x1="90" y1="90" x2="{_r(90 + 38 * math.sin(ah))}" y2="{_r(90 - 38 * math.cos(ah))}" class="fg-l fg-hand" stroke-width="6"/>')
    o.append(f'<line x1="90" y1="90" x2="{_r(90 + 60 * math.sin(am))}" y2="{_r(90 - 60 * math.cos(am))}" class="fg-l fg-hand" stroke-width="3"/>')
    o.append('<circle cx="90" cy="90" r="4" class="fg-dot"/></svg>')
    return ''.join(o)

def numberline(start, end, step=1, major=5, arrow=None, labels=None, hide=()):
    """labels: かずを かく めもり（なければ major ごと）。hide: かずを かかない めもり（□に する ため）"""
    n = (end - start) // step; W = 528; x0, x1 = 24, 504; dx = (x1 - x0) / n
    o = [HEAD.format(w=W, h=96, label='数直線'), f'<line x1="16" y1="58" x2="516" y2="58" class="fg-l" stroke-width="2"/>', '<path d="M516 58 l-7 -4 v8 z" class="fg-dot"/>']
    lab = set(labels) if labels is not None else {v for v in range(start, end + 1, step) if (v - start) % major == 0}
    for i in range(n + 1):
        v = start + i * step; x = _r(x0 + i * dx); big = (v - start) % major == 0
        o.append(f'<line x1="{x:g}" y1="{47 if big else 52}" x2="{x:g}" y2="{69 if big else 64}" class="fg-l" stroke-width="{1.8 if big else 1}"/>')
        if v in lab and v not in hide: o.append(_t(x, 86, v, 12))
    if arrow is not None:
        assert start <= arrow <= end and (arrow - start) % step == 0
        x = _r(x0 + (arrow - start) / step * dx); o.append(f'<path d="M{x:g} 45 l-7 -14 h14 z" class="fg-acc"/>')
    o.append('</svg>'); return ''.join(o)

def blocks(tens, ones):
    assert 0 <= tens <= 10 and 0 <= ones <= 9
    w = 8 + tens * 15 + (21 if ones else 0); o = [HEAD.format(w=max(w, 30), h=76, label='ブロック')]
    for t in range(tens):
        x = 8 + t * 15; o.append(f'<rect x="{x}" y="8" width="8" height="60" class="fg-l fg-soft" stroke-width="1.5"/>')
        for k in range(1, 10): o.append(f'<line x1="{x}" y1="{8 + 6 * k}" x2="{x + 8}" y2="{8 + 6 * k}" class="fg-l" stroke-width="0.6"/>')
    bx = 8 + tens * 15 + 6
    for k in range(ones): o.append(f'<rect x="{bx}" y="{62 - 11 * (k % 5)}" width="7" height="7" class="fg-l fg-soft" stroke-width="1.2"/>' if k < 5 else f'<rect x="{bx + 10}" y="{62 - 11 * (k % 5)}" width="7" height="7" class="fg-l fg-soft" stroke-width="1.2"/>')
    if ones > 5: o[0] = HEAD.format(w=max(w + 10, 30), h=76, label='ブロック')
    o.append('</svg>'); return ''.join(o)

def dots(counts, kinds=('●', '○', '▲', '■'), per_row=10):
    """counts のじゅんに、kinds の しるしを ならべる（5こごとに すこし あける）"""
    cells = [k for c, k in zip(counts, kinds) for _ in range(c)]
    rows = [cells[i:i + per_row] for i in range(0, len(cells), per_row)] or [[]]
    W = 16 + per_row * 26 + 10; H = 16 + len(rows) * 30
    o = [HEAD.format(w=W, h=H, label='ならんだ しるし')]
    for r, row in enumerate(rows):
        for i, k in enumerate(row):
            x = 22 + i * 26 + (8 if i >= 5 else 0); y = 22 + r * 30
            if k == '●': o.append(f'<circle cx="{x}" cy="{y}" r="10" class="fg-dot"/>')
            elif k == '○': o.append(f'<circle cx="{x}" cy="{y}" r="10" class="fg-l fg-bg" stroke-width="2"/>')
            elif k == '▲': o.append(f'<path d="M{x} {y - 10} l10 18 h-20 z" class="fg-acc"/>')
            else: o.append(f'<rect x="{x - 9}" y="{y - 9}" width="18" height="18" class="fg-l fg-soft" stroke-width="2"/>')
    o.append('</svg>'); return ''.join(o)

def grid(shapes, cell=22):
    """shapes: {'あ': [(x,y),…], 'い': […]}（マスの いち。x は よこ、y は たて）"""
    xs = 10; parts = []; H = 0
    for name, cells in shapes.items():
        mx = max(c[0] for c in cells) + 1; my = max(c[1] for c in cells) + 1; H = max(H, 26 + my * cell + 8)
        parts.append(_t(xs + mx * cell / 2, 12, name, 15, 700))
        for (cx, cy) in cells: parts.append(f'<rect x="{xs + cx * cell}" y="{26 + cy * cell}" width="{cell}" height="{cell}" class="fg-l fg-soft" stroke-width="1"/>')
        xs += mx * cell + 36
    return HEAD.format(w=xs, h=H, label='マス目') + ''.join(parts) + '</svg>'

# ---- 小2で つかう 図 ----
def ruler(cm, tape_mm=None, arrow_mm=None):
    """ものさし（0〜cm センチ、1mm ごとの めもり）。tape_mm：0から その長さまでの テープ。arrow_mm：▼の いち（mm）"""
    assert 1 <= cm <= 15
    U = 32; x0 = 16; W = x0 * 2 + cm * U; o = [HEAD.format(w=W, h=96, label='ものさし')]
    o.append(f'<rect x="{x0 - 6}" y="40" width="{cm * U + 12}" height="44" class="fg-l fg-bg" stroke-width="1.5"/>')
    for mm in range(cm * 10 + 1):
        x = _r(x0 + mm * U / 10); L = 16 if mm % 10 == 0 else (11 if mm % 5 == 0 else 6)
        o.append(f'<line x1="{x:g}" y1="40" x2="{x:g}" y2="{40 + L}" class="fg-l" stroke-width="{1.4 if mm % 10 == 0 else 0.8}"/>')
        if mm % 10 == 0: o.append(_t(x, 70, mm // 10, 11))
    if tape_mm is not None:
        assert 0 < tape_mm <= cm * 10
        o.append(f'<rect x="{x0}" y="14" width="{_r(tape_mm * U / 10)}" height="14" class="fg-l fg-soft" stroke-width="1.5"/>')
    if arrow_mm is not None:
        x = _r(x0 + arrow_mm * U / 10); o.append(f'<path d="M{x:g} 36 l-6 -12 h12 z" class="fg-acc"/>')
    o.append('</svg>'); return ''.join(o)

def graph(labels, counts, mark='○'):
    """○の グラフ（たてに ○を つむ）。labels と counts は おなじ ながさ"""
    assert len(labels) == len(counts) and max(counts) <= 12
    cw = 44; H = 28 + max(counts) * 22 + 30; W = 16 + len(labels) * cw + 8
    o = [HEAD.format(w=W, h=H, label='グラフ')]
    base = H - 30
    o.append(f'<line x1="10" y1="{base}" x2="{W - 6}" y2="{base}" class="fg-l" stroke-width="1.5"/>')
    for i, (lab, n) in enumerate(zip(labels, counts)):
        cx = 16 + i * cw + cw / 2
        for k in range(n):
            cy = base - 12 - k * 22
            o.append(f'<circle cx="{cx:g}" cy="{cy}" r="9" class="fg-l fg-bg" stroke-width="2"/>' if mark == '○' else f'<circle cx="{cx:g}" cy="{cy}" r="9" class="fg-dot"/>')
        o.append(_t(cx, base + 15, lab, 12))
    o.append('</svg>'); return ''.join(o)

def array(rows, cols):
    """かけ算の ●の ならび（rows だん × cols こ）"""
    assert 1 <= rows <= 10 and 1 <= cols <= 10
    W = 20 + cols * 26; H = 20 + rows * 26; o = [HEAD.format(w=W, h=H, label='ならんだ ●')]
    for r in range(rows):
        for c in range(cols): o.append(f'<circle cx="{23 + c * 26}" cy="{23 + r * 26}" r="9" class="fg-dot"/>')
    o.append('</svg>'); return ''.join(o)

def blocks3(hundreds, tens, ones):
    """100の かたまり（しかく）・10の ぼう・ばら"""
    assert 0 <= hundreds <= 9 and 0 <= tens <= 9 and 0 <= ones <= 9
    o = []; x = 8
    for _ in range(hundreds):
        o.append(f'<rect x="{x}" y="8" width="60" height="60" class="fg-l fg-soft" stroke-width="1.5"/>')
        for k in range(1, 10):
            o.append(f'<line x1="{x + 6 * k}" y1="8" x2="{x + 6 * k}" y2="68" class="fg-l" stroke-width="0.5"/>'); o.append(f'<line x1="{x}" y1="{8 + 6 * k}" x2="{x + 60}" y2="{8 + 6 * k}" class="fg-l" stroke-width="0.5"/>')
        x += 68
    for _ in range(tens):
        o.append(f'<rect x="{x}" y="8" width="8" height="60" class="fg-l fg-soft" stroke-width="1.5"/>')
        for k in range(1, 10): o.append(f'<line x1="{x}" y1="{8 + 6 * k}" x2="{x + 8}" y2="{8 + 6 * k}" class="fg-l" stroke-width="0.6"/>')
        x += 15
    if ones: x += 4
    for k in range(ones):
        o.append(f'<rect x="{x + (k // 5) * 10}" y="{62 - 11 * (k % 5)}" width="7" height="7" class="fg-l fg-soft" stroke-width="1.2"/>')
    x += (10 if ones > 5 else 0) + (12 if ones else 0)
    return HEAD.format(w=max(x, 30), h=76, label='ブロック') + ''.join(o) + '</svg>'

def tape(n, k):
    """1本の テープを n こに おなじ 大きさに わけて、k こ ぶんに いろを ぬる（分数）"""
    assert 1 <= k <= n <= 12
    W = 336; o = [HEAD.format(w=W + 16, h=52, label='テープ')]
    w = W / n
    for i in range(n):
        cls = 'fg-l fg-acc-fill' if i < k else 'fg-l fg-bg'
        o.append(f'<rect x="{_r(8 + i * w)}" y="12" width="{_r(w)}" height="28" class="{cls}" stroke-width="1.5"/>')
    o.append('</svg>'); return ''.join(o)

def poly(shapes, cols=12, rows=6):
    """ほうがん紙（1マス＝1cm）に かいた かたち。shapes：{'あ': [(x,y),…]}（ちょう点の いち。x は よこ、y は たて。0〜cols, 0〜rows）"""
    S = 26; W = cols * S + 20; H = rows * S + 20; o = [HEAD.format(w=W, h=H, label='ほうがん紙')]
    for i in range(cols + 1): o.append(f'<line x1="{10 + i * S}" y1="10" x2="{10 + i * S}" y2="{10 + rows * S}" class="fg-l" stroke-width="0.5" stroke-opacity="0.45"/>')
    for j in range(rows + 1): o.append(f'<line x1="10" y1="{10 + j * S}" x2="{10 + cols * S}" y2="{10 + j * S}" class="fg-l" stroke-width="0.5" stroke-opacity="0.45"/>')
    for name, pts in shapes.items():
        assert all(0 <= x <= cols and 0 <= y <= rows for x, y in pts)
        d = ' '.join(f'{10 + x * S},{10 + y * S}' for x, y in pts)
        o.append(f'<polygon points="{d}" class="fg-l fg-soft" fill-opacity="0.5" stroke-width="2.5"/>')
        cx = sum(x for x, _ in pts) / len(pts); cy = sum(y for _, y in pts) / len(pts)
        o.append(_t(_r(10 + cx * S), _r(10 + cy * S), name, 15, 700))
    o.append('</svg>'); return ''.join(o)

# ---- 小3・小4で つかう 図 ----
from fractions import Fraction as _F
def numline(start, end, step, major, arrow=None, labels=None, hide=()):
    """小数・分数も つかえる 数直線。start/end/step/major は 数（0.1 や '1/10' でも よい）。labels：数を かく めもり"""
    s, e, st, mj = (_F(str(v)) for v in (start, end, step, major))
    n = int((e - s) / st); assert s + n * st == e and n <= 60
    x0, x1 = 24, 504; dx = (x1 - x0) / n
    o = [HEAD.format(w=528, h=96, label='数直線'), '<line x1="16" y1="58" x2="516" y2="58" class="fg-l" stroke-width="2"/>', '<path d="M516 58 l-7 -4 v8 z" class="fg-dot"/>']
    fmt = lambda v: (str(v.numerator) if v.denominator == 1 else (f'{float(v):g}' if (10 ** 6 * v).denominator == 1 else f'{v.numerator}/{v.denominator}'))
    lab = {_F(str(v)) for v in labels} if labels is not None else None
    for i in range(n + 1):
        v = s + i * st; x = _r(x0 + i * dx); big = ((v - s) / mj).denominator == 1
        o.append(f'<line x1="{x:g}" y1="{47 if big else 52}" x2="{x:g}" y2="{69 if big else 64}" class="fg-l" stroke-width="{1.8 if big else 1}"/>')
        show = (v in lab) if lab is not None else big
        if show and fmt(v) not in [str(h) for h in hide]: o.append(_t(x, 86, fmt(v), 12))
    if arrow is not None:
        a = _F(str(arrow)); k = (a - s) / st; assert k.denominator == 1 and 0 <= k <= n
        x = _r(x0 + float(k) * dx); o.append(f'<path d="M{x:g} 45 l-7 -14 h14 z" class="fg-acc"/>')
    o.append('</svg>'); return ''.join(o)

def bar(labels, values, step=1, vmax=None, unit=''):
    """ぼうグラフ（たて）。step：めもり 1つ分、vmax：いちばん 上の めもり。unit：じくの たんい（例 '人'）"""
    vmax = vmax or (max(values) // step + 1) * step
    assert all(0 <= v <= vmax for v in values) and vmax / step <= 20
    H = 220; base = 180; top = 20; cw = 52; W = 60 + len(labels) * cw
    o = [HEAD.format(w=W, h=H, label='ぼうグラフ')]
    nt = int(vmax / step)
    for k in range(nt + 1):
        y = _r(base - (base - top) * k / nt); big = (k * step) % (step * 5) == 0
        o.append(f'<line x1="44" y1="{y:g}" x2="{W - 6}" y2="{y:g}" class="fg-l" stroke-width="{0.8 if big else 0.4}" stroke-opacity="0.5"/>')
        if big or nt <= 10: o.append(_t(30, y, f'{k * step:g}', 11))
    if unit: o.append(_t(30, 8, f'（{unit}）', 10))
    o.append(f'<line x1="44" y1="{top}" x2="44" y2="{base}" class="fg-l" stroke-width="1.5"/>')
    o.append(f'<line x1="44" y1="{base}" x2="{W - 6}" y2="{base}" class="fg-l" stroke-width="1.5"/>')
    for i, (lab, v) in enumerate(zip(labels, values)):
        x = 52 + i * cw; h = _r((base - top) * v / vmax)
        if v: o.append(f'<rect x="{x}" y="{_r(base - h):g}" width="{cw - 16}" height="{h:g}" class="fg-l fg-soft" stroke-width="1.5"/>')
        o.append(_t(x + (cw - 16) / 2, base + 16, lab, 11))
    o.append('</svg>'); return ''.join(o)

def linegraph(labels, values, vmin, vmax, step, unit=''):
    """折れ線グラフ。labels：よこじく（月・時こく など）、values：数。vmin〜vmax を step ごとの めもり"""
    assert all(vmin <= v <= vmax for v in values) and (vmax - vmin) / step <= 20
    H = 230; base = 190; top = 20; cw = 40; W = 70 + len(labels) * cw
    o = [HEAD.format(w=W, h=H, label='折れ線グラフ')]
    nt = int(round((vmax - vmin) / step))
    for k in range(nt + 1):
        y = _r(base - (base - top) * k / nt)
        o.append(f'<line x1="50" y1="{y:g}" x2="{W - 6}" y2="{y:g}" class="fg-l" stroke-width="0.5" stroke-opacity="0.5"/>')
        o.append(_t(34, y, f'{vmin + k * step:g}', 11))
    if unit: o.append(_t(34, 8, f'（{unit}）', 10))
    o.append(f'<line x1="50" y1="{top}" x2="50" y2="{base}" class="fg-l" stroke-width="1.5"/><line x1="50" y1="{base}" x2="{W - 6}" y2="{base}" class="fg-l" stroke-width="1.5"/>')
    pts = []
    for i, (lab, v) in enumerate(zip(labels, values)):
        x = 70 + i * cw; y = _r(base - (base - top) * (v - vmin) / (vmax - vmin)); pts.append((x, y))
        o.append(_t(x, base + 16, lab, 11))
    o.append('<polyline points="' + ' '.join(f'{x},{y:g}' for x, y in pts) + '" class="fg-l fg-acc-l" stroke-width="2.5"/>')
    for x, y in pts: o.append(f'<circle cx="{x}" cy="{y:g}" r="4" class="fg-dot"/>')
    o.append('</svg>'); return ''.join(o)

def protractor(deg, label=None):
    """分度器を あてた 角（0°の 線と、deg° の 線）。10°ごとの めもり、30°ごとに 数"""
    assert 0 < deg <= 180
    cx, cy, R = 170, 170, 140; o = [HEAD.format(w=340, h=190, label='分度器')]
    o.append(f'<path d="M{cx - R} {cy} A{R} {R} 0 0 1 {cx + R} {cy} Z" class="fg-l fg-bg" stroke-width="1.5"/>')
    for a in range(0, 181, 5):
        t = math.radians(a); r1 = R - (14 if a % 10 == 0 else 7)
        o.append(f'<line x1="{_r(cx + R * math.cos(t))}" y1="{_r(cy - R * math.sin(t))}" x2="{_r(cx + r1 * math.cos(t))}" y2="{_r(cy - r1 * math.sin(t))}" class="fg-l" stroke-width="{1 if a % 10 == 0 else 0.6}"/>')
        if a % 30 == 0: o.append(_t(_r(cx + (R - 28) * math.cos(t)), _r(cy - (R - 28) * math.sin(t)), a, 11))
    t = math.radians(deg)
    o.append(f'<line x1="{cx}" y1="{cy}" x2="{cx + R + 10}" y2="{cy}" class="fg-l fg-acc-l" stroke-width="2.5"/>')
    o.append(f'<line x1="{cx}" y1="{cy}" x2="{_r(cx + (R + 10) * math.cos(t))}" y2="{_r(cy - (R + 10) * math.sin(t))}" class="fg-l fg-acc-l" stroke-width="2.5"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="3" class="fg-dot"/>')
    if label: o.append(_t(_r(cx + 40 * math.cos(t / 2)), _r(cy - 40 * math.sin(t / 2)), label, 13, 700))
    o.append('</svg>'); return ''.join(o)

def angle(deg, label='あ'):
    """角（分度器なし）。deg°の 角を かき、角の ところに 弧と 記号"""
    assert 0 < deg < 360
    cx, cy, R = 150, 110, 100; o = [HEAD.format(w=300, h=220, label='角')]
    t = math.radians(deg)
    o.append(f'<line x1="{cx}" y1="{cy}" x2="{cx + R}" y2="{cy}" class="fg-l" stroke-width="2.5"/>')
    o.append(f'<line x1="{cx}" y1="{cy}" x2="{_r(cx + R * math.cos(t))}" y2="{_r(cy - R * math.sin(t))}" class="fg-l" stroke-width="2.5"/>')
    large = 1 if deg > 180 else 0; r = 26
    o.append(f'<path d="M{cx + r} {cy} A{r} {r} 0 {large} 0 {_r(cx + r * math.cos(t))} {_r(cy - r * math.sin(t))}" class="fg-l fg-acc-l" stroke-width="2"/>')
    o.append(_t(_r(cx + 44 * math.cos(t / 2)), _r(cy - 44 * math.sin(t / 2)), label, 14, 700))
    o.append('</svg>'); return ''.join(o)

def circle(r_cm, show='radius', label=None):
    """円（1cm＝16px）。show：'radius'（半径に 線）・'diameter'（直径に 線）・'none'。label：線の よこに かく 文字"""
    assert 0.5 <= r_cm <= 6
    R = r_cm * 16; W = int(2 * R + 40); cx = cy = W / 2; o = [HEAD.format(w=W, h=W, label='円')]
    o.append(f'<circle cx="{cx:g}" cy="{cy:g}" r="{R:g}" class="fg-l fg-bg" stroke-width="2"/><circle cx="{cx:g}" cy="{cy:g}" r="3" class="fg-dot"/>')
    if show == 'radius': o.append(f'<line x1="{cx:g}" y1="{cy:g}" x2="{cx + R:g}" y2="{cy:g}" class="fg-l fg-acc-l" stroke-width="2"/>')
    if show == 'diameter': o.append(f'<line x1="{cx - R:g}" y1="{cy:g}" x2="{cx + R:g}" y2="{cy:g}" class="fg-l fg-acc-l" stroke-width="2"/>')
    if label: o.append(_t(_r(cx + R / 2), _r(cy - 10), label, 12, 700))
    o.append('</svg>'); return ''.join(o)

# ---- 小5で つかう 図 ----
def band(labels, percents):
    """帯グラフ（よこ 1本、ぜんたい 100％）。percents は 合計 100 の 整数。10％ ごとの めもり"""
    assert sum(percents) == 100 and len(labels) == len(percents)
    W = 520; x0 = 20; L = 480; o = [HEAD.format(w=W, h=96, label='帯グラフ')]
    for k in range(11):
        x = x0 + L * k / 10; o.append(f'<line x1="{x:g}" y1="20" x2="{x:g}" y2="{26 if k % 5 else 30}" class="fg-l" stroke-width="1"/>')
        if k % 5 == 0 or True: o.append(_t(x, 12, f'{k * 10}', 9))
    x = x0
    for lab, p in zip(labels, percents):
        w = L * p / 100
        o.append(f'<rect x="{_r(x):g}" y="30" width="{_r(w):g}" height="34" class="fg-l fg-bg" stroke-width="1.5"/>')
        if p >= 8: o.append(_t(_r(x + w / 2), 47, lab, 11))
        x += w
    o.append(_t(W / 2, 82, '（％）', 10)); o.append('</svg>'); return ''.join(o)

def pie(labels, percents):
    """円グラフ（真上から 右まわり、ぜんたい 100％）。percents は 合計 100 の 整数。まわりに 5％ ごとの めもり"""
    assert sum(percents) == 100 and len(labels) == len(percents)
    cx, cy, R = 120, 120, 92; o = [HEAD.format(w=240, h=240, label='円グラフ')]
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" class="fg-l fg-bg" stroke-width="1.5"/>')
    for k in range(20):
        a = math.radians(k * 18); r1 = R + (7 if k % 2 == 0 else 4)
        o.append(f'<line x1="{_r(cx + R * math.sin(a))}" y1="{_r(cy - R * math.cos(a))}" x2="{_r(cx + r1 * math.sin(a))}" y2="{_r(cy - r1 * math.cos(a))}" class="fg-l" stroke-width="1"/>')
    acc = 0
    for lab, p in zip(labels, percents):
        a = math.radians(acc * 3.6)
        o.append(f'<line x1="{cx}" y1="{cy}" x2="{_r(cx + R * math.sin(a))}" y2="{_r(cy - R * math.cos(a))}" class="fg-l" stroke-width="1.5"/>')
        m = math.radians((acc + p / 2) * 3.6)
        if p >= 6: o.append(_t(_r(cx + R * 0.6 * math.sin(m)), _r(cy - R * 0.6 * math.cos(m)), lab, 11))
        acc += p
    o.append('</svg>'); return ''.join(o)
