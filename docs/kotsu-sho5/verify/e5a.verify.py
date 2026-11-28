# 確かめ: 全問「問題 → 計算した答え」を出し、正解の選択肢と突き合わせる。まちがいの選択肢が正解と一致しないことも確かめる。
import json, re, glob, os
from decimal import Decimal as D
WORK = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5a_work'
HERE = os.path.dirname(os.path.abspath(__file__))
def fmt(x):
    if isinstance(x, str): return x
    if isinstance(x, int): return str(x)
    return format(x.normalize(), 'f')
items = {it['id']: it for it in json.load(open(f'{HERE}/e5a.json'))}
calc = {}
for f in sorted(glob.glob(f'{WORK}/calc-*.json')):
    for c in json.load(open(f)): calc[c['id']] = c
bad = 0
def num(s, pre, suf):
    if not (s.startswith(pre) and s.endswith(suf)): return None
    core = s[len(pre):len(s)-len(suf)] if suf else s[len(pre):]
    try: return D(core)
    except Exception: return None
for id_, it in items.items():
    c = calc[id_]; val = eval(c['expr'], {'D': D, 'fmt': fmt})
    pre, suf = c['tmpl'].split('{}')
    want = c['tmpl'].format(fmt(val))
    ok = [x for x in it['c'] if x.get('k') == 1][0]['t']
    st = 'OK' if ok == want else 'NG'
    for x in it['c']:
        if x.get('k') == 1: continue
        if isinstance(val, str):
            if x['t'] == val: st = 'NG(wrong==ans)'
        else:
            n = num(x['t'], pre, suf)
            if n is not None and n == D(val): st = 'NG(wrong==ans)'
    if st != 'OK': bad += 1
    print(f"{id_}\t{it['q'][:50]}\t=> {want}\t[{ok}]\t{st}")
print('問題数', len(items), '不一致', bad)
