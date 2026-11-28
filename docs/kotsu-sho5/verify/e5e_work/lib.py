import sys, json, os
from fractions import Fraction as F
SP = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad'
sys.path.insert(0, SP + '/e5')
import figs
OUT = SP + '/e5/out/e5e'
WORK = SP + '/e5e_work'
META = {l['id']: l for l in json.load(open(SP + '/e5/in/e5e.json'))}

def term(v):
    d = F(v).denominator
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d == 1
def N(v, u=''):
    """整数・小数の文字（わり切れる数だけ）"""
    v = F(v); assert term(v), v
    if v.denominator == 1: s = str(v.numerator)
    else:
        k = 0
        while (v * 10 ** k).denominator != 1: k += 1
        s = f'{float(v):.{k}f}'
    return s + u
def Fr(v, u='', mixed=False):
    v = F(v)
    if v.denominator == 1: return str(v.numerator) + u
    if mixed and v > 1:
        w = v.numerator // v.denominator; r = v - w
        return f'{w}と{r.numerator}/{r.denominator}' + u
    return f'{v.numerator}/{v.denominator}' + u
def n(v, u=''): return (F(v), N(v, u))      # 数と文字の組
def fr(v, u='', mixed=False): return (F(v), Fr(v, u, mixed))
def raw(val, text): return (val, text)

class Lesson:
    def __init__(self, lid):
        self.lid = lid; self.items = []; self.calc = {}
    def add(self, d, q, ans, wrongs, e, h, f=None):
        """ans=(値,文字)  wrongs=[(値,文字,なぜ)×3]"""
        i = len(self.items)
        idx = i % 5 + 1; dd = i // 5 + 1
        assert dd == d, (self.lid, i, d)
        pos = (i * 3 + i // 4) % 4
        assert len(wrongs) == 3
        vals = [w[0] for w in wrongs]
        for v in vals: assert v != ans[0], (self.lid, i, 'まちがいが正解と同じ値', v)
        texts = [ans[1]] + [w[1] for w in wrongs]
        assert len(set(texts)) == 4, (self.lid, i, texts)
        ch = [dict(t=w[1], w=w[2]) for w in wrongs]
        ch.insert(pos, dict(t=ans[1], k=1))
        m = META[self.lid]
        it = {'id': f'{self.lid}-L{d}-{idx:02d}', 'u': f"E5-T{m['code']}", 's': f"E5-T{m['code']}-{m['no']:02d}",
              'l': self.lid, 'd': d, 'q': q, 'c': ch, 'e': e, 'h': h}
        if f: it['f'] = f
        self.items.append(it)
        self.calc[it['id']] = {'q': q, 'calc': str(ans[0]), 'key': ans[1], 'wrong': [(str(w[0]), w[1]) for w in wrongs]}
    def save(self):
        assert len(self.items) == 20, (self.lid, len(self.items))
        json.dump(self.items, open(f'{OUT}/{self.lid}.json', 'w'), ensure_ascii=False, indent=1)
        return self.calc
