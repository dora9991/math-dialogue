# e5c 確かめスクリプト：全問「問題 → 計算した答え」を出し、正解の選択肢と突き合わせる
# 使い方: python3 out/e5c.verify.py   （式は scratchpad/e5c_work の lib.py の d()/qrs() で再計算。keys.json に 各問の 式が ある）
import json, re, sys, glob
from fractions import Fraction as F
W = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5c_work'
sys.path.insert(0, W)
from lib import *
base = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5/out/'
items = {}
for f in sorted(glob.glob(base + 'e5c/*.json')):
    for it in json.load(open(f)): items[it['id']] = it
keys = {k['id']: k for k in json.load(open(W + '/keys.json'))}
bad = 0
def num(t):
    m = re.search(r'-?\d+(\.\d+)?', t); return F(m.group()) if m else None
for id, it in items.items():
    k = keys[id]; ans = [c for c in it['c'] if c.get('k') == 1]
    assert len(ans) == 1 and len(it['c']) == 4
    val = eval(k['x'])
    exp = val if isinstance(val, str) else k['u'].format(fm(val))
    ok = ans[0]['t'] == exp
    for c in it['c']:
        if c.get('k') != 1:
            if c['t'] == ans[0]['t'] or (re.sub(r'[\d.]+', '#', c['t']) == re.sub(r'[\d.]+', '#', ans[0]['t']) and [F(v) for v in re.findall(r'\d+(?:\.\d+)?', c['t'])] == [F(v) for v in re.findall(r'\d+(?:\.\d+)?', ans[0]['t'])]):
                ok = False; print('  誤答が 正解と 同じ:', c['t'])
    m = re.search(r'(\d+(?:\.\d+)?) ([×÷]) (\d+(?:\.\d+)?) (?:を 計算|を 筆算で 計算します。答え|= □|を 計算します。答え)', it['q'])
    if m and 'あまり' not in ans[0]['t'] and not re.search(r'わりきれ|一の位|四しゃ|先に|くふう|見積|見当|だいたい', it['q']):
        a, o, b = F(m.group(1)), m.group(2), F(m.group(3))
        r = a * b if o == '×' else a / b
        if num(ans[0]['t']) != r:
            ok = False; print('  式の 再計算と ちがう', r)
    print(('OK ' if ok else 'NG '), id, '|', it['q'][:60].replace('\n', ' '), '→', exp)
    bad += (not ok)
print('問題', len(items), 'NG', bad); sys.exit(1 if bad else 0)
