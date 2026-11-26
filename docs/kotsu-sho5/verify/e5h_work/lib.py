import sys, json
from decimal import Decimal as D
sys.path.insert(0, '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5')
import figs
P = D('3.14')
OUT = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5/out/e5h/'
CALC = {}   # id -> (答えの文字, 式の説明)
META = {'enshu': ('O',), 'kakuchu5': ('P',)}
def s(x):
    return format(D(x).normalize(), 'f')
class Lesson:
    def __init__(self, lid, code, no):
        self.lid, self.code, self.no, self.items = lid, code, no, []
    def q(self, q, ans, wrongs, e, h, f=None, calc=None):
        fx = lambda z: __import__('re').sub(r'(展開図|見取図)(の|に|で|を)', r'\1 \2', z)
        q, e, h = fx(q), fx(e), fx(h); wrongs = [(fx(a), fx(b)) for a, b in wrongs]; ans = fx(ans)
        i = len(self.items); d = i // 5 + 1; n = i % 5 + 1
        pos = (n + d) % 4
        assert len(wrongs) == 3
        c = [{'t': t, 'w': w} for t, w in wrongs]
        c.insert(pos, {'t': ans, 'k': 1})
        id_ = f'{self.lid}-L{d}-0{n}'
        it = {'id': id_, 'u': f'E5-T{self.code}', 's': f'E5-T{self.code}-{self.no:02d}', 'l': self.lid, 'd': d,
              'q': q, 'c': c, 'e': e, 'h': h}
        if f: it['f'] = f
        self.items.append(it)
        CALC[id_] = (ans if calc is None else calc, q)
    def save(self):
        assert len(self.items) == 20, (self.lid, len(self.items))
        json.dump(self.items, open(OUT + self.lid + '.json', 'w'), ensure_ascii=False, indent=1)
