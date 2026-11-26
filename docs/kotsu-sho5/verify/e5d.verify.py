# 確かめ：全問「問題 → 計算した答え」を一覧にし、正解の選択肢と突き合わせる。
# 1) 正解（k:1）が、作った ときに 計算 した 答え（e5d_work/calc_*.json）と 一致する
# 2) まちがいの 選択肢が、正解と 同じ 値に ならない（分数は 値で くらべる）
# 3) 問題文の 形から、別に 計算し直せる もの（最小公倍数・最大公約数・分数の たし算 ひき算 約分）は 計算し直して 突き合わせる
import json, re, glob
from fractions import Fraction as F
from math import gcd, lcm
W = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/'
items = json.load(open(W + 'e5/out/e5d.json'))
calc = {}
for p in glob.glob(W + 'e5d_work/calc_*.json'): calc.update(json.load(open(p)))
def val(t):
    t = t.replace('L', '').replace('km', '').replace('こ分', '').replace('ばい', '')
    m = re.fullmatch(r'(?:(\d+)と)?(\d+)(?:/(\d+))?', t.strip())
    if not m: return None
    w, n, d = m.groups(); v = F(int(n), int(d)) if d else F(int(n)); return v + (int(w) if w else 0)
def num(s):  # '1と3/4' or '3/4' or '5' -> Fraction
    m = re.fullmatch(r'(?:(\d+)と)?(\d+)(?:/(\d+))?', s)
    w, n, d = m.groups(); v = F(int(n), int(d)) if d else F(int(n)); return v + (int(w) if w else 0)
FR = r'((?:\d+と)?\d+(?:/\d+)?)'
bad = 0; auto = 0
def indep(q):
    m = re.fullmatch(r'(\d+) と (\d+) の 最小公倍数は いくつですか。', q)
    if m: return str(lcm(int(m[1]), int(m[2])))
    m = re.fullmatch(r'(\d+) と (\d+) の 最大公約数は いくつですか。', q)
    if m: return str(gcd(int(m[1]), int(m[2])))
    m = re.fullmatch(FR + r' ([+−]) ' + FR + r' を 計算 して、約分 した 形で 答えます。', q) or re.fullmatch(FR + r' ([+−]) ' + FR + r' を 計算 します。答えは どれですか。', q)
    if m:
        a, op, b = num(m[1]), m[2], num(m[3]); r = a + b if op == '+' else a - b
        return f'{r.numerator}/{r.denominator}' if r.denominator > 1 else str(r.numerator)
    m = re.fullmatch(r'(\d+)/(\d+) を 約分すると どれですか。', q) or re.fullmatch(r'(\d+)/(\d+) を 約分 しきると どれですか。', q)
    if m:
        n, d = int(m[1]), int(m[2]); g = gcd(n, d); return f'{n//g}/{d//g}'
    return None
for it in items:
    ks = [c for c in it['c'] if c.get('k') == 1]; assert len(ks) == 1, it['id']
    ans = ks[0]['t']
    ok = calc.get(it['id']) == ans
    av = val(ans)
    for c in it['c']:
        if c.get('k') != 1 and av is not None and val(c['t']) is not None and val(c['t']) == av: ok = False; print('  まちがいが 正解と 同じ:', it['id'], c['t'])
    r = indep(it['q'])
    note = ''
    if r is not None:
        auto += 1
        if val(r) != val(ans) and r != ans: ok = False; note = f'  ← 計算し直し {r}'
    if not ok: bad += 1
    print(('OK ' if ok else 'NG '), it['id'], '|', it['q'][:60], '→', ans, note)
print(f'\n全 {len(items)} 問、計算し直しで 突き合わせた もの {auto} 問、不一致 {bad} 問')
