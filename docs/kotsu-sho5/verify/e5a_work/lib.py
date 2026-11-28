import sys, json, os
from decimal import Decimal
sys.path.insert(0, '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5')
import figs
D = Decimal
OUT = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5/out/e5a'
WORK = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5a_work'
LESSONS = {'seishosu-01':('A','01'),'seishosu-02':('A','02'),'seishosu-03':('A','03'),'seishosu-04':('A','04'),
           'tai-01':('B','01'),'tai-02':('B','02'),'tai-03':('B','03'),'tai-04':('B','04'),'tai-05':('B','05')}
ORDER = list(LESSONS)
def fmt(x):
    if isinstance(x, str): return x
    if isinstance(x, int): return str(x)
    return format(x.normalize(), 'f')
class Lesson:
    def __init__(self, lid):
        self.lid = lid; self.items = []; self.cnt = {1:0,2:0,3:0,4:0}; self.calc = []
        self.idx = ORDER.index(lid)
    def q(self, d, q, ok, wrongs, e, h, expr, tmpl='{}', f=None):
        self.cnt[d] += 1; n = self.cnt[d]; assert n <= 5
        val = eval(expr, {'D': D, 'fmt': fmt}); text = tmpl.format(fmt(val))
        if text != ok: raise SystemExit(f'{self.lid} d{d} n{n}: computed {text!r} != ok {ok!r}')
        assert len(wrongs) == 3
        pos = (n + d + self.idx) % 4
        ch = [{'t': t, **({'w': w} if w else {})} for t, w in wrongs]
        ch.insert(pos, {'t': ok, 'k': 1})
        c, no = LESSONS[self.lid]
        it = {'id': f'{self.lid}-L{d}-0{n}', 'u': f'E5-T{c}', 's': f'E5-T{c}-{no}', 'l': self.lid, 'd': d, 'q': q, 'c': ch, 'e': e, 'h': h}
        if f: it['f'] = f
        self.items.append(it)
        self.calc.append({'id': it['id'], 'expr': expr, 'tmpl': tmpl})
    def save(self):
        assert len(self.items) == 20, (self.lid, len(self.items))
        os.makedirs(OUT, exist_ok=True)
        json.dump(self.items, open(f'{OUT}/{self.lid}.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(self.calc, open(f'{WORK}/calc-{self.lid}.json', 'w'), ensure_ascii=False)
        print(self.lid, 'ok')
