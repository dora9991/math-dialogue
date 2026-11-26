# 使い方: python3 e4b.verify.py   （e4b_work/ の L1.py〜S3.py を先に 動かして、out/e4b/*.json と calc.json を作る）
# 全問「問題 → 計算した答え」を 出し、正解の選択肢と 突き合わせる。まちがいの選択肢が 正解と 一致しないことも 確かめる。
# 折れ線グラフの 図は、SVG から 点の 高さを 読みなおして、めもりの 数に なおして 表示する。
import json, glob, re, os, sys
E4 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e4b_work'
calc = json.load(open(WORK + '/calc.json'))
norm = lambda s: re.sub(r'[\s　]', '', s)
def fig_values(svg):
    m = re.search(r'<polyline points="([^"]+)"', svg)
    if not m: return None
    ys = [float(p.split(',')[1]) for p in m.group(1).split()]
    ticks = re.findall(r'<text x="34" y="([\d.]+)"[^>]*>([\d.]+)</text>', svg)
    ticks = [(float(y), float(v)) for y, v in ticks]
    (y0, v0), (y1, v1) = ticks[0], ticks[-1]   # 上から 下の じゅん ではなく 順序は 下から
    out = []
    for y in ys:
        v = v0 + (y - y0) * (v1 - v0) / (y1 - y0)
        out.append(round(v, 1))
    return out
bad = 0; n = 0
for f in sorted(glob.glob(E4 + '/out/e4b/*.json')):
    for it in json.load(open(f)):
        n += 1; id = it['id']
        ans = [c['t'] for c in it['c'] if c.get('k')]
        c = calc.get(id)
        extra = ''
        if it.get('f'):
            v = fig_values(it['f'])
            if v: extra = '  図の 点: ' + str(v)
        ok = c is not None and len(ans) == 1 and norm(ans[0]) == norm(c['calc']) and all(norm(x['t']) != norm(c['calc']) for x in it['c'] if not x.get('k'))
        if not ok: bad += 1
        print(('OK ' if ok else 'NG ') + id + ' | ' + it['q'][:60] + ' → 計算: ' + (c['calc'] if c else '?') + ' / 正解: ' + (ans[0] if ans else '?') + extra)
print(f'\n{n} 問、不一致 {bad}')
sys.exit(1 if bad else 0)
