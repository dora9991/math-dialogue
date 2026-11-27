# 使い方: python3 out/e6d.verify.py
# 全問「問題 → 計算した答え」を Decimal で計算し直し、出力 JSON の正解の選択肢と突き合わせる。
# 計算式は、問題を作った ときに scratchpad の e6d_work/answers.json に 残した もの。
import json, re, sys
from decimal import Decimal as D
E6 = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6'
ANS = json.load(open('/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6d_work/answers.json'))
PI = D('3.14')
NUM = re.compile(r"(?<![\w.'])\d+(\.\d+)?")
def ev(x):
    return D(eval(NUM.sub(lambda m: "D('%s')" % m.group(), x), {'D': D, 'PI': PI}))
def num(t):
    m = re.search(r'\d+(\.\d+)?', t); return D(m.group()) if m else None
LESSONS = 'en-01,en-02,en-03,en-04,en-05,en-06,kakuchu-01,kakuchu-02,kakuchu-03,kakuchu-04,kakuchu-05'.split(',')
bad = 0; total = 0
for lid in LESSONS:
    items = json.load(open(f'{E6}/out/e6d/{lid}.json'))
    rec = {r['id']: r for r in ANS[lid]}
    assert len(items) == 20, lid
    for it in items:
        total += 1
        r = rec[it['id']]
        okc = [c for c in it['c'] if c.get('k') == 1]
        assert len(okc) == 1
        okt = okc[0]['t']
        wrong = [c['t'] for c in it['c'] if c.get('k') != 1]
        status = ''
        if r['okexpr'] is not None:
            v = ev(r['okexpr'])
            if num(okt) != v: status = f'NG 正解 {okt} != 計算 {v}'; bad += 1
            # 問題文の中身との ずれを 防ぐ: 式の 結果と 選択肢の 数
            for (t, ex), w in zip([(b[0], b[1]) for b in r['bads']], []): pass
            for (bt, bex) in r['bads']:
                bv = ev(bex)
                if bv == v or bv <= 0 or num(bt) != bv or bt not in wrong:
                    status += f' NG まちがい {bt} ({bex}={bv})'; bad += 1
            calc = f'{v}'
        else:
            calc = '(文の 選択肢: 作る ときに 条件式で 確認)'
            for c in (r.get('chk') or []):
                expr = NUM.sub(lambda m: "D('%s')" % m.group(), c)
                if not eval(expr, {'D': D, 'PI': PI}): status += f' NG 条件式 {c}'; bad += 1
        for c in (r.get('chk') or []):
            expr = NUM.sub(lambda m: "D('%s')" % m.group(), c)
            if not eval(expr, {'D': D, 'PI': PI}): status += f' NG 条件式 {c}'; bad += 1
        print(f"{it['id']} | {it['q'][:60]}… → 計算 {calc} | 正解 {okt} {status or 'OK'}")
print(f'\n全 {total} 問、NG {bad} 件')
sys.exit(1 if bad else 0)
