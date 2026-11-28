import re, json, os, sys
E5 = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5'
sys.path.insert(0, E5)
import figs
OUT = E5 + '/out/e5g'
CHK = []
def n(x):
    x = round(x, 6)
    return str(int(x)) if x == int(x) else str(x)
def num(s):
    m = re.findall(r'\d+(?:\.\d+)?', s)
    return float(m[-1]) if m else None
def shoelace(pts):
    s = 0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2
CODE = {'menseki': ('M', 1), 'kakuwa': ('N', 1)}
class Lesson:
    def __init__(self, lid, code, no, off=0):
        self.lid, self.code, self.no, self.off, self.items = lid, code, no, off, []
    def add(self, d, q, ok, wr, e, h, f=None, calc=None, at=None):
        assert len(wr) == 3, (self.lid, q)
        i = len(self.items)
        assert d == i // 5 + 1, (self.lid, i, d)
        pos = at if at is not None else (i * 3 + self.off) % 4
        ch = [{'t': t, **({'w': w} if w else {})} for t, w in wr]
        ch.insert(pos, {'t': ok, 'k': 1})
        texts = [c['t'] for c in ch]
        assert len(set(texts)) == 4, (self.lid, q, texts)
        if calc is not None:
            assert abs(num(ok) - calc) < 1e-9, (self.lid, q, ok, calc)
            for t, _ in wr:
                v = num(t)
                assert v is None or abs(v - calc) > 1e-9, (self.lid, q, t, calc)
        assert sum(1 for t, w in wr if w) >= 2, (self.lid, q)
        it = {'id': f'{self.lid}-L{d}-{i % 5 + 1:02d}', 'u': f'E5-T{self.code}', 's': f'E5-T{self.code}-{self.no:02d}',
              'l': self.lid, 'd': d, 'q': q, 'c': ch, 'e': e, 'h': h}
        if f: it['f'] = f
        self.items.append(it)
        CHK.append({'id': it['id'], 'q': q, 'ok': ok, 'calc': calc, 'pos': pos})
    def save(self):
        assert len(self.items) == 20, (self.lid, len(self.items))
        os.makedirs(OUT, exist_ok=True)
        json.dump(self.items, open(f'{OUT}/{self.lid}.json', 'w'), ensure_ascii=False, indent=1)
