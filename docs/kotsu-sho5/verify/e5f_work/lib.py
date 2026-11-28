import sys, json, random, re, os
from decimal import Decimal as D
E5 = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5'
sys.path.insert(0, E5)
import figs
OUT = E5 + '/out/e5f'
CODE = {'wariai': ('K', {'01':1,'02':2,'03':3,'04':4,'05':5}), 'graph5': ('L', {'01':1,'02':2,'03':3,'04':4})}

def fm(x):
    x = D(x)
    if x == x.to_integral(): return str(int(x))
    return format(x.normalize(), 'f')
def pc(x): return fm(D(x) * 100) + '%'
def u(x, unit): return fm(x) + unit

class Lesson:
    def __init__(self, lid):
        self.lid = lid; self.items = []; self.calc = []
        r = random.Random(lid); pos = [0,1,2,3]*5; r.shuffle(pos)
        # 同じ 位置が つづかない ように 軽く 整える
        self.pos = pos; self.r = random.Random(lid + 'x')
    def Q(self, d, q, ans, wr, e, h, f=None, val=None):
        n = len([i for i in self.items if i['d'] == d]) + 1
        idx = len(self.items)
        assert len(wr) == 3, (self.lid, d, n)
        assert len({t for t,w in wr}|{ans}) == 4, (self.lid, d, n, ans)
        assert sum(1 for t,w in wr if w) >= 2, (self.lid, d, n)
        ch = [{'t': t} for t, w in wr]
        for c, (t, w) in zip(ch, wr):
            if w: c['w'] = w
        p = self.pos[idx]; ch.insert(p, {'t': ans, 'k': 1})
        code, nos = CODE[self.lid.split('-')[0]]
        no = self.lid.split('-')[1]
        it = {'id': f'{self.lid}-L{d}-0{n}', 'u': f'E5-T{code}', 's': f'E5-T{code}-{no}', 'l': self.lid, 'd': d, 'q': q, 'c': ch, 'e': e, 'h': h}
        if f: it['f'] = f
        self.items.append(it)
        self.calc.append({'id': it['id'], 'val': (fm(val) if isinstance(val, (int, D)) else (val if val is not None else ans)), 'ans': ans})
    def save(self):
        assert len(self.items) == 20, len(self.items)
        for d in (1,2,3,4): assert len([i for i in self.items if i['d'] == d]) == 5, d
        json.dump(self.items, open(f'{OUT}/{self.lid}.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(self.calc, open(f'{E5}/../e5f_work/{self.lid}.calc.json', 'w'), ensure_ascii=False, indent=1)
        print(self.lid, 'saved')
