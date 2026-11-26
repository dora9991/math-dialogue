# e3h 確かめ: 作問スクリプト（scratchpad/e3h_work）で計算した答えと、out/e3h/*.json の正解を突き合わせる
import sys, json, os
W='/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e3h_work'
sys.path.insert(0,W)
import lib, nito, bou
bad=0; n=0
for L in lib.ALL:
    data=json.load(open(f'{lib.E3}/out/e3h/{L.lid}.json'))
    assert len(data)==20
    for it,row in zip(data,L.rows):
        qid,q,ok,calc,wr=row; n+=1
        assert it['id']==qid
        texts=[c['t'] for c in it['c']]; kt=[c['t'] for c in it['c'] if c.get('k')]
        status='OK'
        if kt!=[ok]: status='NG(json)'
        if calc is not None and calc!=ok: status='NG(calc≠正解)'
        if calc is not None and calc in [c['t'] for c in it['c'] if not c.get('k')]: status='NG(誤答が正解と一致)'
        if calc is None: status+=' (手確認)'
        if status.startswith('NG'): bad+=1
        print(f"{qid} | {q.splitlines()[0][:50]} → 計算: {calc} | 正解: {kt[0]} | {status}")
print('問題数',n,'NG',bad)
sys.exit(1 if bad else 0)
