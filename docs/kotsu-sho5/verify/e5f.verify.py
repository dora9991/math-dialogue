# e5f の 確かめ: 各 gen スクリプトを 再実行（中の assert が 計算を 確かめる）してから、
# 書き出した JSON の 正解の 選択肢を、計算した 値（calc）と 突き合わせる。
import json, re, glob, subprocess, sys, os
from decimal import Decimal as D
W = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5f_work'
E5 = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5'
for g in sorted(glob.glob(W + '/g_*.py')):
    r = subprocess.run([sys.executable, g], cwd=W, capture_output=True, text=True)
    assert r.returncode == 0, (g, r.stderr[-500:])
num = lambda s: (lambda m: D(m.group(0)) if m else None)(re.match(r'-?\d+(\.\d+)?', s.strip()))
bad = 0; n = 0
for f in sorted(glob.glob(E5 + '/out/e5f/*.json')):
    lid = os.path.basename(f)[:-5]
    items = json.load(open(f)); calc = {c['id']: c for c in json.load(open(f'{W}/{lid}.calc.json'))}
    for it in items:
        n += 1
        c = calc[it['id']]; right = [x['t'] for x in it['c'] if x.get('k')][0]; wrong = [x['t'] for x in it['c'] if not x.get('k')]
        v = c['val']
        if re.fullmatch(r'-?\d+(\.\d+)?', v) and num(right) is not None:
            ok = num(right) == num(v) and all(num(w) != num(v) for w in wrong if num(w) is not None)
        else:
            ok = right == c['ans']
        print(f"{it['id']}  {it['q'][:50]}… → 計算 {v} / 正解の 選択肢 {right} {'OK' if ok else 'NG'}")
        if not ok: bad += 1
print(n, '問、NG', bad); sys.exit(1 if bad else 0)
