import sys, json, random, re, os
from fractions import Fraction as Fr
from math import gcd
E6 = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6'
sys.path.insert(0, E6)
import figs

REG = []  # 検証用の記録: dict(id, q, calc, ans)


def fr(x):
    x = Fr(x)
    return str(x.numerator) if x.denominator == 1 else f"{x.numerator}/{x.denominator}"


def num(x):
    """小数・整数の表記（8.0 -> 8、7.5 -> 7.5）"""
    x = Fr(x)
    if x.denominator == 1:
        return str(x.numerator)
    f = float(x)
    s = ('%.4f' % f).rstrip('0').rstrip('.')
    assert abs(float(s) - f) < 1e-9, x
    return s


def norm(s):
    return re.sub(r'\s', '', str(s))


class Lesson:
    def __init__(self, lid, code, no, seed):
        self.lid, self.code, self.no, self.seed = lid, code, no, seed
        self.items = []
        self.cnt = {1: 0, 2: 0, 3: 0, 4: 0}

    def add(self, d, q, ans, wrongs, e, h, f=None, calc=None):
        assert len(wrongs) == 3, (self.lid, q)
        self.cnt[d] += 1
        n = self.cnt[d]
        assert n <= 5
        if calc is not None:
            assert str(calc) == str(ans), (self.lid, d, n, calc, ans)
        texts = [norm(ans)] + [norm(t) for t, _ in wrongs]
        assert len(set(texts)) == 4, (self.lid, d, n, texts)
        qid = f"{self.lid}-L{d}-0{n}"
        self.items.append(dict(id=qid, d=d, q=q, ans=ans, wrongs=wrongs, e=e + f"\nこたえ {ans}", h=h, f=f, calc=calc))

    def finish(self):
        assert all(v == 5 for v in self.cnt.values()), (self.lid, self.cnt)
        rng = random.Random(self.seed)
        while True:
            pos = [0, 1, 2, 3] * 5
            rng.shuffle(pos)
            # くり返しや 同じ 位置の れんぞくを さける
            if any(pos[i] == pos[i + 1] == pos[i + 2] for i in range(18)):
                continue
            if all(pos[i] == pos[i + 4] for i in range(16)):
                continue
            if all((pos[i + 1] - pos[i]) % 4 == (pos[1] - pos[0]) % 4 for i in range(19)):
                continue
            break
        out = []
        for it, p in zip(self.items, pos):
            ws = list(it['wrongs'])
            rng.shuffle(ws)
            c = []
            wi = iter(ws)
            for k in range(4):
                if k == p:
                    c.append({"t": it['ans'], "k": 1})
                else:
                    t, w = next(wi)
                    o = {"t": t}
                    if w:
                        o["w"] = w
                    c.append(o)
            no = f"{self.no:02d}"
            o = {"id": it['id'], "u": f"E6-T{self.code}", "s": f"E6-T{self.code}-{no}", "l": self.lid, "d": it['d'],
                 "q": it['q'], "c": c, "e": it['e'], "h": it['h']}
            if it['f']:
                o["f"] = it['f']
            out.append(o)
            REG.append(dict(id=it['id'], q=it['q'], calc=it['calc'], ans=it['ans'], pos=p,
                            wrongs=[t for t, _ in it['wrongs']]))
        return out


def write(lesson_out, lid):
    d = f'{E6}/out/e6c'
    os.makedirs(d, exist_ok=True)
    with open(f'{d}/{lid}.json', 'w', encoding='utf-8') as fp:
        json.dump(lesson_out, fp, ensure_ascii=False, indent=1)


# 図形の ヘルパー（ほうがん紙は 下向きが y の プラス）
def rect(x0, y0, w, h):
    return [(x0, y0), (x0 + w, y0), (x0 + w, y0 + h), (x0, y0 + h)]


def rtri(x0, base, w, h):
    """直角が 左下の 直角三角形"""
    return [(x0, base), (x0 + w, base), (x0, base - h)]


def span(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return max(xs) - min(xs), max(ys) - min(ys)
