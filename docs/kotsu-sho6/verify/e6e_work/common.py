import sys, random, json, itertools
sys.path.insert(0, '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6')
import figs

class P:
    def __init__(s, d, q, a, ws, e, h, f=None):
        # a: (text, val)  val = python-computed value (str) / ws: [(text, w)]
        s.d, s.q, s.a, s.ws, s.e, s.h, s.f = d, q, a, ws, e, h, f

def positions(rng):
    while True:
        p = [0]*5 + [1]*5 + [2]*5 + [3]*5
        rng.shuffle(p)
        run = max(len(list(g)) for _, g in itertools.groupby(p))
        if run >= 3: continue
        if p[:4] == p[4:8] == p[8:12] == p[12:16]: continue
        if all(p[i] != p[i+1] for i in range(19)): continue   # 交互すぎ
        if all(p[i] == p[i % 4] for i in range(20)): continue
        # 各段階(5問)で 同じ 位置が 3つ以上 に ならない
        ok = True
        for k in range(4):
            seg = p[k*5:(k+1)*5]
            if max(seg.count(x) for x in range(4)) >= 3: ok = False
        if ok: return p

def build(lid, code, no, probs, seed):
    rng = random.Random(seed)
    assert len(probs) == 20, (lid, len(probs))
    pos = positions(rng)
    out, ans = [], []
    for i, pr in enumerate(probs):
        d = i // 5 + 1; assert pr.d == d, (lid, i, pr.d)
        assert len(pr.ws) == 3
        ws = pr.ws[:]; rng.shuffle(ws)
        c = [{'t': t, 'w': w} for t, w in ws]
        c.insert(pos[i], {'t': pr.a[0], 'k': 1})
        iid = f'{lid}-L{d}-{i%5+1:02d}'
        o = {'id': iid, 'u': f'E6-T{code}', 's': f'E6-T{code}-{no:02d}', 'l': lid, 'd': d,
             'q': pr.q, 'c': c, 'e': pr.e, 'h': pr.h}
        if pr.f: o['f'] = pr.f
        out.append(o)
        ans.append({'id': iid, 'val': pr.a[1], 'text': pr.a[0]})
    return out, ans
