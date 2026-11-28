# 確かめ：全問「問題 → 計算した答え」を 一覧に して、正解の 選択肢と 突き合わせる
# 使い方: python3 out/e4c.verify.py   （e4/ で）
import json, glob, re, sys
META = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e4c_work/meta.json'
meta = json.load(open(META))

def fm(a, b):
    q, r = divmod(a, b)
    return str(q) if r == 0 else f"{q} あまり {r}"
def fmu(a, b, uq, ur=None):
    q, r = divmod(a, b); ur = ur or uq
    return f"{q}{uq}" if r == 0 else f"{q}{uq} あまり {r}{ur}"

bad = 0; n = 0; unchecked = []
for f in sorted(glob.glob('out/e4c/*.json')):
    for it in json.load(open(f)):
        n += 1
        right = [c['t'] for c in it['c'] if c.get('k') == 1]
        wrong = [c['t'] for c in it['c'] if c.get('k') != 1]
        chk = meta.get(it['id'])
        if chk is None:
            unchecked.append(it['id']); print(f"{it['id']} (手で確認) {it['q'][:40]} → {right[0]}"); continue
        calc = eval(chk)
        ok = (calc == right[0]) and calc not in wrong
        print(f"{it['id']} {it['q'][:40]} → 計算 {calc} / 正解 {right[0]} {'OK' if ok else 'NG'}")
        if not ok: bad += 1
print(f"\n{n} 問、NG {bad}、手で確認 {len(unchecked)}: {unchecked}")
sys.exit(1 if bad else 0)
