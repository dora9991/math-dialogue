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
