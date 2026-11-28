"""e4g の 検算。 e4g_work の 作成スクリプトを もう一度 動かし（正解は fractions などで 計算した 値と 突き合わせ、
まちがいの 選択肢が 正解と 一致しない こと・値が 同じ 選択肢が ない ことを assert する）、
書き出した out/e4g/*.json と 一致する ことを たしかめて、全問 一覧を 出す。"""
import sys, json, os
WORK = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e4g_work'
sys.path.insert(0, WORK)
import build_all
from lib import ALL, E4, val

res = build_all.run(write=False)
n = bad = 0
for lid, qs in res.items():
    disk = json.load(open(f'{E4}/out/e4g/{lid}.json'))
    assert disk == qs, f'{lid}: ディスクの JSON と ちがう'
    for o, (tag, it) in zip(qs, ALL[lid][-20:]):
        assert o['id'] == tag
        ks = [c for c in o['c'] if c.get('k') == 1]
        assert len(ks) == 1 and ks[0]['t'] == it['c']
        w = it['want']
        if callable(w): calc = '(条件を 満たす 選択肢を 判定)'
        elif isinstance(w, (int,)) or hasattr(w, 'numerator'): calc = str(w)
        else: calc = w
        v = val(it['c'])
        print(f"{tag}\t{o['q'][:50]}\t→ 計算 {calc}\t正解 {it['c']}\t(図 {'あり' if o.get('f') else 'なし'})")
        n += 1
print('全', n, '問 OK')
