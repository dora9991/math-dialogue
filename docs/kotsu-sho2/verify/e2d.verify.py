#!/usr/bin/env python3
"""e2d の全問を 計算で 確かめる。
 - 問題ごとの「計算の しかた」（式・□の しき・図）は、作る スクリプトが e2d_work/calc.json に 書き出したもの。
 - とけいの 図は SVG の はりの 角度から 時・分を、三角形・四角形の 図は SVG の ちょう点から へん・直角・同じ長さ を 読みとって、答えを 計算しなおす。
 - 正解の 選択肢と 突き合わせる。□の しきは、まちがいの 選択肢が しきを みたさない ことも 確かめる。
使い方: python3 -I e2d.verify.py   （問題 → 計算した答え → 正解 の 一覧を 出し、1つでも ちがえば 終了コード 1）"""
import json, re, math, glob, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e2d_work'
calc = json.load(open(WORK + '/calc.json'))
LES = ['jikan-01','jikan-02','jikan-03','jikan-04','kufu-01','kufu-02','kufu-03','kufu-04','sankaku-01','sankaku-02','sankaku-03','sankaku-04']

def tf(h, m=0):
    h2 = (h - 1) % 12 + 1 if h > 12 else h
    return f'{h}時' if m == 0 else f'{h}時{m}分'

def read_clock(svg):
    hs = {}
    for m_ in re.finditer(r'<line x1="90" y1="90" x2="([\d.\-]+)" y2="([\d.\-]+)" class="fg-l fg-hand" stroke-width="(\d)"', svg):
        dx = float(m_.group(1)) - 90; dy = float(m_.group(2)) - 90
        hs[int(m_.group(3))] = math.degrees(math.atan2(dx, -dy)) % 360
    if 6 not in hs or 3 not in hs: return None
    m = round(hs[3] / 6) % 60
    h = round((hs[6] - m * 0.5) / 30) % 12 or 12
    return h, m

class Sh:
    pass
def read_poly(svg):
    polys = re.findall(r'<polygon points="([^"]+)"', svg)
    names = re.findall(r'class="fg-t"[^>]*>([^<]+)</text>', svg)
    if not polys: return None
    out = {}
    for nm, p in zip(names, polys):
        pts = [tuple((float(v) - 10) / 26 for v in q.split(',')) for q in p.split()]
        s = Sh(); s.n = len(pts)
        d2 = lambda a, b: round((a[0]-b[0])**2 + (a[1]-b[1])**2, 6)
        s.sides = [d2(pts[i], pts[(i+1) % s.n]) for i in range(s.n)]
        s.eq = len(set(s.sides)) == 1
        r = 0
        for i in range(s.n):
            a, b, c = pts[i-1], pts[i], pts[(i+1) % s.n]
            if abs((a[0]-b[0])*(c[0]-b[0]) + (a[1]-b[1])*(c[1]-b[1])) < 1e-6: r += 1
        s.rights = r
        out[nm] = s
    return out

def solve_eq(eq):
    ans = []
    for x in range(0, 400):
        e = eq.replace('□', f'({x})').replace('−', '-')
        l, r = e.split('=')
        if eval(l) == eval(r): ans.append(x)
    return ans
def eq_ok(eq, x):
    e = eq.replace('□', f'({x})').replace('−', '-'); l, r = e.split('='); return eval(l) == eval(r)

bad = 0; n = 0; manual = 0
for lid in LES:
    qs = json.load(open(f'{HERE}/e2d/{lid}.json'))
    assert len(qs) == 20
    for q in qs:
        n += 1
        c = calc[q['id']]
        ans = [x['t'] for x in q['c'] if x.get('k') == 1]; assert len(ans) == 1
        ans = ans[0]
        env = {'tf': tf}
        if 'f' in q:
            ck = read_clock(q['f'])
            if ck: env['h'], env['m'] = ck
            sh = read_poly(q['f'])
            if sh:
                env['shapes'] = sh
                env['names'] = lambda pr, sh=sh: '・'.join(k for k, v in sh.items() if pr(v))
                env['count'] = lambda pr, sh=sh: sum(1 for v in sh.values() if pr(v))
        got = None; status = ''
        try:
            if c.get('eq'):
                sol = solve_eq(c['eq']); assert len(sol) == 1, sol
                got = c['fmt'].format(sol[0])
                for x in q['c']:
                    if x.get('k') == 1: continue
                    mm = re.match(r'^(\d+)', x['t'])
                    if mm and re.fullmatch(r'\d+[^\d]*', x['t']) and eq_ok(c['eq'], int(mm.group(1))):
                        status += f' 【まちがい選択肢 {x["t"]} が しきを みたす】'; bad += 1
            elif c.get('expr'):
                got = c['fmt'].format(eval(c['expr'], env))
        except Exception as ex:
            status += f' 【計算エラー {ex}】'; bad += 1
        compare = got is not None and c.get('kind') != 'text' and not c.get('note')
        if compare:
            if got != ans:
                status += ' 【ふいっち】'; bad += 1
            else:
                status += ' OK'
        else:
            status += ' (文章・ことばの 問題: 手で 確認)'; manual += 1
        q1 = re.sub(r'\s+', ' ', q['q'])[:60]
        extra = ''
        if 'f' in q:
            if env.get('h'): extra = f' [図: {env["h"]}時{env["m"]}分]'
            elif env.get('shapes'): extra = ' [図: ' + ', '.join(f'{k}:n={v.n},直角={v.rights},同長={v.eq}' for k, v in env['shapes'].items()) + ']'
        print(f'{q["id"]} {q1} → 計算:{got} / 正解:{ans}{extra}{status}')
print(f'\n全 {n} 問。ふいっち・エラー {bad} 件。手で 確認する 問題 {manual} 問。')
sys.exit(1 if bad else 0)
