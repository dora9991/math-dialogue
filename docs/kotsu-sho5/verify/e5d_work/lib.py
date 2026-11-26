import sys, json, re, random
from fractions import Fraction as F
from math import gcd, lcm
sys.path.insert(0, '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5')
import figs
OUT = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5/out/e5d'
CALC = {}
META = {'baiyaku': ('F', {1:1,2:2,3:3,4:4,5:5}), 'bunsu': ('G', {1:1,2:2,3:3,4:4,5:5})}

def fs(x, mixed=False):
    x = F(x)
    if x.denominator == 1: return str(x.numerator)
    if mixed and x > 1:
        w = x.numerator // x.denominator; r = x - w
        return f'{w}と{r.numerator}/{r.denominator}'
    return f'{x.numerator}/{x.denominator}'
def raw(n, d): return f'{n}/{d}'
def mx(w, n, d): return f'{w}と{n}/{d}'
def val(t):
    m = re.fullmatch(r'(?:(\d+)と)?(\d+)(?:/(\d+))?', t)
    if not m: return None
    w, n, d = m.groups()
    v = F(int(n), int(d)) if d else F(int(n))
    return v + (int(w) if w else 0)

class Lesson:
    def __init__(self, lid):
        self.id = lid; self.items = []; self.cnt = {1:0,2:0,3:0,4:0}
        r = random.Random(lid); self.pos = []
        for _ in range(5):
            p = [0,1,2,3]; r.shuffle(p); self.pos += p
        code, nos = META[lid.split('-')[0]]
        self.code = code; self.no = int(lid.split('-')[1])
    def add(self, d, q, ans, wrongs, e, h, f=None):
        assert len(wrongs) == 3, q
        self.cnt[d] += 1; n = self.cnt[d]; assert n <= 5
        idx = len(self.items)
        p = self.pos[idx]
        ws = list(wrongs)
        c = [{'t': t, **({'w': w} if w else {})} for t, w in ws]
        c.insert(p, {'t': ans, 'k': 1})
        texts = [re.sub(r'\s', '', x['t']) for x in c]
        assert len(set(texts)) == 4, (q, texts)
        av = val(ans)
        if av is not None:
            for t, _ in ws:
                v = val(t)
                assert v is None or v != av, (q, t, ans)
        assert sum(1 for t, w in ws if w) >= 2, q
        assert len(q) <= 150, (len(q), q)
        it = {'id': f'{self.id}-L{d}-{n:02d}', 'u': f'E5-T{self.code}', 's': f'E5-T{self.code}-{self.no:02d}',
              'l': self.id, 'd': d, 'q': q, 'c': c, 'e': e, 'h': h}
        if f: it['f'] = f
        self.items.append(it)
        CALC[it['id']] = ans
    def save(self):
        assert len(self.items) == 20 and all(v == 5 for v in self.cnt.values()), self.cnt
        json.dump(self.items, open(f'{OUT}/{self.id}.json', 'w'), ensure_ascii=False, indent=1)
def dump_calc():
    json.dump(CALC, open('/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5d_work/calc_%s.json' % sys.argv[0].split('/')[-1][:-3], 'w'), ensure_ascii=False, indent=1)
