# e5h 確かめ：全問「問題 → 計算した答え」を出し、正解の選択肢と突き合わせる
import json, re, sys
from decimal import Decimal as D
P = D('3.14')
base = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5/out/e5h.json'
items = json.load(open(base))
KN = {'三':3,'四':4,'五':5,'六':6,'八':8,'九':9,'十二':12,'十':10,'二十':20}
def num(t):
    m = re.search(r'-?\d+(\.\d+)?', t.replace(',', ''))
    return D(m.group()) if m else None
def fmt(x): return format(D(x).normalize(), 'f')
bad = 0
for it in items:
    q = it['q']; ans = [c for c in it['c'] if c.get('k')][0]['t']; wr = [c['t'] for c in it['c'] if not c.get('k')]
    exp = None
    m = re.search(r'直径 (\d+)cm の 円の 円周は 何cm', q)
    if m and '3.14' in q: exp = D(m.group(1)) * P
    m = re.search(r'半径 (\d+)cm の 円の 円周は 何cm', q)
    if m and '3.14' in q: exp = D(m.group(1)) * 2 * P
    m = re.search(r'円周が ([\d.]+)cm の 円の 直径は 何cm', q)
    if m: exp = D(m.group(1)) / P
    m = re.search(r'円周が ([\d.]+)cm の 円の 半径は 何cm', q)
    if m: exp = D(m.group(1)) / P / 2
    m = re.search(r'正(\S+?)角形の (1つの )?中心の 角', q)
    if m and m.group(1) in KN and '何度' in q and '式' not in q and '半分' not in q: exp = D(360) / KN[m.group(1)]
    m = re.search(r'(三|四|五|六|七|八|九|十二|十)角柱の (面|辺|ちょう点)は', q)
    if m:
        n = {'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十二':12,'十':10}[m.group(1)]
        exp = {'面': n + 2, '辺': n * 3, 'ちょう点': n * 2}[m.group(2)]
    got = num(ans)
    status = ''
    if exp is not None:
        status = 'OK' if got == exp else 'NG(計算と ちがう)'
        if got != exp: bad += 1
    if got is not None:
        for w in wr:
            if re.findall(r'\d+(?:\.\d+)?', w) == re.findall(r'\d+(?:\.\d+)?', ans) and re.sub(r'[\d.]+', '', w) == re.sub(r'[\d.]+', '', ans): print('  !! まちがいが 正解と 同じ:', it['id'], w); bad += 1
    print(f"{it['id']}: {q[:60]} -> {ans}  [{fmt(exp) if exp is not None else '手計算'}] {status}")
print('NG:', bad)
sys.exit(1 if bad else 0)
