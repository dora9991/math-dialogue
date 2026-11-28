import json, random, re, secrets, sys, os
from decimal import Decimal as D
E6 = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6'
sys.path.insert(0, E6)
import figs
OUT = E6 + '/out/e6d'
WORK = os.path.dirname(os.path.abspath(__file__))
PI = D('3.14')
NUM = re.compile(r"(?<![\w.'])\d+(\.\d+)?")
def ev(x):
    if isinstance(x, D): return x
    s = NUM.sub(lambda m: "D('%s')" % m.group(), str(x))
    r = eval(s, {'D': D, 'PI': PI})
    return D(r)
def n(x):
    return format(D(x).normalize(), 'f')

ANS = {}
class L:
    def __init__(s, lid, code, no):
        s.lid, s.code, s.no = lid, code, no
        s.qs = []
    def num(s, d, q, expr, unit, bads, e, h, f=None, pre='', chk=None):
        for c in (chk or []):
            assert eval(NUM.sub(lambda m: "D('%s')" % m.group(), c), {'D': D, 'PI': PI}), (s.lid, c)
        ok = ev(expr)
        vals = [ok]
        bl = []
        for ex, why in bads:
            v = ev(ex)
            assert v not in vals, (s.lid, q, ex, v)
            vals.append(v)
            bl.append((pre + n(v) + unit, why, ex))
        assert len(bl) == 3
        s.qs.append(dict(d=d, q=q, ok=pre + n(ok) + unit, okexpr=expr, bads=bl, e=e, h=h, f=f, chk=chk))
    def txt(s, d, q, ok, bads, e, h, f=None, chk=None):
        assert len(bads) == 3 and len({ok, *[b[0] for b in bads]}) == 4, (s.lid, q)
        for c in (chk or []):
            assert eval(NUM.sub(lambda m: "D('%s')" % m.group(), c), {'D': D, 'PI': PI}), (s.lid, c)
        s.qs.append(dict(d=d, q=q, ok=ok, okexpr=None, bads=[(b[0], b[1], None) for b in bads], e=e, h=h, f=f, chk=chk))
    def build(s):
        assert len(s.qs) == 20, (s.lid, len(s.qs))
        seed = secrets.randbits(32)
        rng = random.Random(seed)
        pos = [0, 1, 2, 3] * 5
        while True:
            rng.shuffle(pos)
            if any(pos[i] == pos[i+1] == pos[i+2] for i in range(18)): continue
            if any(max(pos[k:k+5].count(v) for v in range(4)) > 2 for k in (0, 5, 10, 15)): continue
            break
        items = []; rec = []
        cnt = {1: 0, 2: 0, 3: 0, 4: 0}
        s.qs.sort(key=lambda x: x['d'])
        for i, qq in enumerate(s.qs):
            d = qq['d']; cnt[d] += 1
            assert cnt[d] <= 5
            idx = pos[i]
            ch = [{'t': b[0], 'w': b[1]} if b[1] else {'t': b[0]} for b in qq['bads']]
            ch.insert(idx, {'t': qq['ok'], 'k': 1})
            e = qq['e'].replace('{A}', qq['ok'])
            lines = e.split('\n'); assert lines[-1].startswith('こたえ'), (s.lid, e)
            it = {'id': f"{s.lid}-L{d}-{cnt[d]:02d}", 'u': f'E6-T{s.code}', 's': f'E6-T{s.code}-{s.no:02d}', 'l': s.lid, 'd': d,
                  'q': qq['q'], 'c': ch, 'e': e, 'h': qq['h']}
            if qq['f']: it['f'] = qq['f']
            items.append(it)
            rec.append(dict(id=it['id'], q=qq['q'], ok=qq['ok'], okexpr=qq['okexpr'], bads=[(b[0], b[2]) for b in qq['bads']], chk=qq.get('chk')))
        assert all(v == 5 for v in cnt.values()), cnt
        os.makedirs(OUT, exist_ok=True)
        with open(f'{OUT}/{s.lid}.json', 'w') as fh: json.dump(items, fh, ensure_ascii=False, indent=1)
        ANS[s.lid] = rec
        allrec = {}
        p = WORK + '/answers.json'
        if os.path.exists(p): allrec = json.load(open(p))
        allrec[s.lid] = rec
        json.dump(allrec, open(p, 'w'), ensure_ascii=False, indent=1)
        print(s.lid, 'ok seed', seed, 'pos', [c['c'].index(next(x for x in c['c'] if x.get('k'))) for c in [{'c': i['c']} for i in items]])
