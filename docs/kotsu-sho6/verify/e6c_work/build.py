import sys
sys.path.insert(0, '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6c_work')
from lib import *
import hi_a, hi_b, shuku_a, shuku_b
GENS = [('hi-01', hi_a.hi01), ('hi-02', hi_a.hi02), ('hi-03', hi_a.hi03), ('hi-04', hi_b.hi04), ('hi-05', hi_b.hi05),
        ('shuku-01', shuku_a.shuku01), ('shuku-02', shuku_a.shuku02), ('shuku-03', shuku_a.shuku03),
        ('shuku-04', shuku_b.shuku04), ('shuku-05', shuku_b.shuku05)]
def build(write_files=True):
    res = {}
    for lid, g in GENS:
        out = g()
        res[lid] = out
        if write_files:
            write(out, lid)
    return res
if __name__ == '__main__':
    r = build()
    print({k: len(v) for k, v in r.items()})
