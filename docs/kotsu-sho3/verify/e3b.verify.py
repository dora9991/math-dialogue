#!/usr/bin/env python3
"""e3b 確かめ：out/e3b/*.json の全問について、問題 → 計算した答え を出し、
正解の選択肢だけが 計算結果と合うこと（まちがいの選択肢は合わないこと）を確かめる。
各問の判定式 ex は ../../e3b_work/meta.json（作った時に 計算で 書いたもの）。"""
import json, re, glob, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
META = json.load(open(os.environ.get('E3B_META', HERE + '/../../e3b_work/meta.json')))
def ints(t): return [int(x) for x in re.findall(r'\d+', t)]
bad = 0; n = 0
for f in sorted(glob.glob(HERE + '/e3b/*.json')):
    for it in json.load(open(f)):
        n += 1
        ex = META.get(it['id'], {}).get('ex')
        if not ex: print('判定式なし', it['id']); bad += 1; continue
        ok = []
        for c in it['c']:
            t = c['t']
            ok.append(bool(eval(ex, {'ints': ints, 't': t})))
        key = [bool(c.get('k')) for c in it['c']]
        good = [c['t'] for c in it['c'] if c.get('k')][0]
        flag = 'OK ' if ok == key else 'NG '
        if ok != key: bad += 1
        print(flag, it['id'], '|', it['q'][:50].replace('\n', ' '), '→', good)
        # 解説の 式（a ÷ b = c あまり r）の 計算
        for a, b, q, r in re.findall(r'(\d+) ÷ (\d+) = (\d+)(?: あまり (\d+))?', it['e']):
            a, b, q = int(a), int(b), int(q); r = int(r) if r else 0
            if b == 0 or (a // b, a % b) != (q, r):
                # わる数の ちがう くらべ（まちがいの 説明）は 許す：式が 正しい かだけ 見る
                if not (a == b * q + r and r < b):
                    print('  解説の 式が 合わない', it['id'], a, b, q, r); bad += 1
print(n, '問', '不一致', bad)
sys.exit(1 if bad else 0)
