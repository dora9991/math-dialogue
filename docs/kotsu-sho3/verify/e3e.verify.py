"""e3e の 確かめ：全問「問題 → 計算した 答え」を 出し、正解の 選択肢と 突き合わせる。
計算式は e3e_work/answers.json（作る ときに 書いた Fraction の 式）。ここで もう一度 計算しなおす。"""
import json, re, glob, os
from fractions import Fraction as F
base = os.path.dirname(os.path.abspath(__file__))
side = json.load(open(os.path.join(base, '..', '..', 'e3e_work', 'answers.json')))
items = json.load(open(os.path.join(base, 'e3e.json')))
def parse(t):
    m = re.match(r'^(\d+(?:\.\d+)?)(?:/(\d+))?', t.strip())
    return None if not m else F(m.group(1)) / (F(m.group(2)) if m.group(2) else 1)
def suf(t): return re.sub(r'^[\d./]+', '', t.strip())
bad = 0; nocalc = []
for it in items:
    ok = [c for c in it['c'] if c.get('k') == 1]
    assert len(ok) == 1
    ok = ok[0]['t']; s = side[it['id']]; assert s['ok'] == ok, it['id']
    if s['calc'] is None:
        nocalc.append(it['id']); print(f"{it['id']}  (ことばの 問題・目で 確認) -> {ok}"); continue
    v = eval(s['calc'], {'F': F, 'max': max, 'min': min, 'sorted': sorted, 'range': range, 'len': len, '__import__': __import__})
    good = parse(ok) == v
    for c in it['c']:
        if c.get('k') != 1:
            p = parse(c['t'])
            if p is not None and p == v and suf(c['t']) == suf(ok): good = False
    print(f"{it['id']}  {s['calc']} = {v}  -> {ok}  {'OK' if good else 'NG'}")
    bad += (not good)
print('ことばの 問題', len(nocalc), '件：', ' '.join(nocalc))
print('NG', bad); raise SystemExit(1 if bad else 0)
