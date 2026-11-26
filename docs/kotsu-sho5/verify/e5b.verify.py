# 使い方: python3 out/e5b.verify.py  （問題 → 正解 の 一覧を 出し、正解が 1つ・選択肢が 重ならない ことを 確かめる）
# 正解の 数は、作成スクリプト（e5b_work/*.py）で 計算した 値と 突き合わせ ずみ。ここでは out/e5b.json を 読み、形を 確かめる。
import json, os
d = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'e5b.json')))
bad = 0
for q in d:
    ks = [c['t'] for c in q['c'] if c.get('k')]
    ts = [c['t'] for c in q['c']]
    ok = len(ks) == 1 and len(set(ts)) == 4 and len(ts) == 4 and sum(1 for c in q['c'] if c.get('w')) >= 2 and q['e'].split('\n')[-1].startswith('こたえ')
    # 解説の さいごの 行の こたえ が 正解の 選択肢と 一致するか
    if ok and q['e'].split('\n')[-1] != 'こたえ ' + ks[0]: ok = False
    if not ok: bad += 1
    print(('OK ' if ok else 'NG ') + q['id'], '|', q['q'].replace('\n', ' / ')[:110], '→', ks[0] if ks else None)
print('問題数', len(d), '不一致', bad)
