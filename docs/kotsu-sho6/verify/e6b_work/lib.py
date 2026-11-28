import sys, json, random, re
from math import gcd
from fractions import Fraction as F
sys.path.insert(0, '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6')
import figs

OUT = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6/out/e6b/'
CODE = {'bkake': ('C', 0), 'bwari': ('D', 0)}
NO = {'bkake-01': ('C', 1), 'bkake-02': ('C', 2), 'bkake-03': ('C', 3), 'bkake-04': ('C', 4), 'bkake-05': ('C', 5),
      'bwari-01': ('D', 1), 'bwari-02': ('D', 2), 'bwari-03': ('D', 3), 'bwari-04': ('D', 4), 'bwari-05': ('D', 5)}


def fr(x):
    x = F(x)
    return str(x.numerator) if x.denominator == 1 else f'{x.numerator}/{x.denominator}'


def mx(x):
    x = F(x)
    if x.denominator == 1: return str(x.numerator)
    w, r = divmod(x.numerator, x.denominator)
    return f'{r}/{x.denominator}' if w == 0 else f'{w}と{r}/{x.denominator}'


def val(t):
    m = re.fullmatch(r'(?:(\d+)と)?(\d+)(?:/(\d+))?[^\d/]*', t.strip())
    if not m: return None
    w, a, b = m.groups()
    v = F(int(a), int(b)) if b else F(int(a))
    return v + (int(w) if w else 0)


CALCS = []


class Lesson:
    def __init__(self, lid, seed):
        self.lid = lid
        self.items = []
        self.rng = random.Random(seed)

    def add(self, d, q, ans, wrongs, e, h, calc, f=None, same_ok=False, unit=''):
        """wrongs: [(text, why), ...] 3つ以上（先頭から 使う）。same_ok: 約分しわすれ など 値が 同じ 選択肢を 許す"""
        a = ans + unit
        r = eval(calc)
        if r is True: pass
        else:
            assert val(a) == F(r), (self.lid, q, a, r)
        ws = []
        seen = {a}
        for t, w in wrongs:
            t = t + unit
            if t in seen: continue
            if val(t) is not None and val(a) is not None and val(t) == val(a) and not same_ok:
                continue
            seen.add(t)
            ws.append((t, w))
        assert len(ws) >= 3, (self.lid, q, ws)
        self.items.append(dict(d=d, q=q, a=a, ws=ws[:3], e=e, h=h, f=f, calc=calc, same_ok=same_ok))

    def write(self):
        assert len(self.items) == 20, (self.lid, len(self.items))
        ds = [it['d'] for it in self.items]
        assert all(ds.count(k) == 5 for k in (1, 2, 3, 4)), ds
        # 正解の位置：A〜Dを 5回ずつ ならべて 乱数で まぜる（規則的に ならない まで ふりなおす）
        while True:
            pos = [0] * 5 + [1] * 5 + [2] * 5 + [3] * 5
            self.rng.shuffle(pos)
            reg = any(all(pos[i + k] == (pos[i] + k) % 4 for k in range(4)) for i in range(17))
            run = any(pos[i] == pos[i + 1] == pos[i + 2] for i in range(18))
            if not reg and not run: break
        out = []
        cnt = {1: 0, 2: 0, 3: 0, 4: 0}
        grp, num = NO[self.lid]
        for it, p in zip(self.items, pos):
            cnt[it['d']] += 1
            ws = list(it['ws'])
            self.rng.shuffle(ws)
            c = [({'t': t, 'w': w} if w else {'t': t}) for t, w in ws]
            c.insert(p, {'t': it['a'], 'k': 1})
            o = {'id': f"{self.lid}-L{it['d']}-{cnt[it['d']]:02d}", 'u': f'E6-T{grp}', 's': f'E6-T{grp}-{num:02d}',
                 'l': self.lid, 'd': it['d'], 'q': it['q'], 'c': c, 'e': it['e'], 'h': it['h']}
            if it['f']: o['f'] = it['f']
            out.append(o)
            CALCS.append((o['id'], it['calc'], it['same_ok']))
        out.sort(key=lambda o: o['id'])
        json.dump(out, open(OUT + self.lid + '.json', 'w'), ensure_ascii=False, indent=1)
        print(self.lid, len(out), 'positions', [pos.count(k) for k in range(4)])
        return out
