import lib, gen_bkake1, gen_bkake2, gen_bwari1
gen_bkake1.b01(); gen_bkake1.b02(); gen_bkake2.b03(); gen_bkake2.b04(); gen_bkake2.b05()
gen_bwari1.w01(); gen_bwari1.w02(); gen_bwari1.w03(); gen_bwari1.w04(); gen_bwari1.w05()
tbl = '\n'.join(f'    {i!r}: ({c!r}, {s!r}),' for i, c, s in lib.CALCS)
src = '''# e6b 検算スクリプト：全問「問題 → 計算した答え」を出し、正解の選択肢と突き合わせる。
# 使い方: cd e6 && python3 out/e6b.verify.py
import json, re, os, sys
from fractions import Fraction as F
from math import gcd

def val(t):
    m = re.fullmatch(r'(?:(\\d+)と)?(\\d+)(?:/(\\d+))?[^\\d/]*', t.strip())
    if not m: return None
    w, a, b = m.groups()
    v = F(int(a), int(b)) if b else F(int(a))
    return v + (int(w) if w else 0)

CALC = {
%s
}
here = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(os.path.join(here, 'e6b.json'), encoding='utf-8'))
bad = 0
for it in items:
    expr, same_ok = CALC[it['id']]
    r = eval(expr)
    ks = [c for c in it['c'] if c.get('k') == 1]
    ok = len(ks) == 1 and len(it['c']) == 4
    ans = ks[0]['t']
    if r is True:
        shown = 'True'
    else:
        shown = str(F(r))
        ok = ok and val(ans) == F(r)
    for c in it['c']:
        if c.get('k') == 1: continue
        if val(c['t']) is not None and val(ans) is not None and val(c['t']) == val(ans):
            # 値が 同じ 選択肢は、約分しわすれ など 形の ちがいだけ（問題文で 指定ずみ）のとき だけ 許す
            ok = ok and same_ok
    print(('OK ' if ok else 'NG ') + it['id'], '|', it['q'][:50], '|', 'calc=' + shown, '|', 'key=' + ans)
    if not ok: bad += 1
print('問題数', len(items), ' NG', bad)
sys.exit(1 if bad else 0)
''' % tbl
open('/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6/out/e6b.verify.py', 'w', encoding='utf-8').write(src)
