import json, sys, os
sys.path.insert(0, '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5')
import figs
OUT = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5/out/e5b'
def n(x):
    x = round(x, 4)
    return str(int(x)) if x == int(x) else str(x)
class L:
    def __init__(self, lid, code, no):
        self.lid, self.code, self.no = lid, code, no; self.qs = []; self.expect = []
    def Q(self, d, q, ans, wr, e, h, f=None, v=None):
        i = len(self.qs)
        if v is not None: assert n(v) in ans, (self.lid, i, v, ans)
        assert d == i // 5 + 1, (self.lid, i, d)
        assert len(wr) == 3
        ts = [ans] + [t for t, _ in wr]
        assert len(set(ts)) == 4, (self.lid, i, ts)
        assert sum(1 for _, w in wr if w) >= 2, (self.lid, i)
        import random
        perm = random.Random(self.lid + str(i // 4)).sample(range(4), 4); pos = perm[i % 4]
        cs = [{"t": t, "w": w} if w else {"t": t} for t, w in wr]
        cs.insert(pos, {"t": ans, "k": 1})
        o = {"id": f"{self.lid}-L{d}-{(i % 5) + 1:02d}", "u": "E5-T" + self.code, "s": f"E5-T{self.code}-{self.no:02d}",
             "l": self.lid, "d": d, "q": q, "c": cs, "e": e, "h": h}
        if f: o["f"] = f
        self.qs.append(o); self.expect.append({"id": o["id"], "ans": ans, "v": v})
    def save(self):
        assert len(self.qs) == 20, (self.lid, len(self.qs))
        os.makedirs(OUT, exist_ok=True)
        json.dump(self.qs, open(f"{OUT}/{self.lid}.json", 'w'), ensure_ascii=False, indent=1)
        ex = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5b_work/expect.json'
        d = json.load(open(ex)) if os.path.exists(ex) else {}
        d[self.lid] = self.expect
        json.dump(d, open(ex, 'w'), ensure_ascii=False, indent=1)
        print(self.lid, 'ok')
