# 全問「問題 → 計算した答え」を 出し、正解の 選択肢と 突き合わせる。
# 手順: e2c_work の main.py（問題を 作りながら 答えを 計算して calc.json に 書く）→ このファイルで JSON を 読み直して 照合する。
import json, re, glob, os
D = os.path.dirname(os.path.abspath(__file__))
CALC = json.load(open('/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e2c_work/calc.json'))

def val(t):
    """選択肢の 文字を 数に する。L・dL・mL は mL に そろえる。ほかは 数だけ。数に ならない 文字は None"""
    t = t.strip()
    m = re.fullmatch(r'(?:(\d+)L)?\s*(?:(\d+)dL)?\s*(?:(\d+)mL)?', t)
    if m and any(m.groups()):
        L, d, ml = (int(x) if x else 0 for x in m.groups())
        return L*1000 + d*100 + ml
    m = re.fullmatch(r'(\d+)(?:こ|つ|まい|本|円|回|はい|ばい|番め)?', t)
    if m: return int(m.group(1))
    return None

bad = 0; n = 0
for f in sorted(glob.glob(D + '/e2c/*.json')):
    for it in json.load(open(f)):
        n += 1
        q = it['id']; calc = CALC[q]
        ks = [c for c in it['c'] if c.get('k')]
        ok = len(ks) == 1
        a = ks[0]['t']
        if isinstance(calc, int):
            # 単位つきの 答えは mL、数だけの 答えは そのまま の 数 に なっている
            ok = ok and val(a) == calc
            wrong = [val(c['t']) for c in it['c'] if not c.get('k')]
            ok = ok and calc not in wrong
        else:
            ok = ok and a == calc
            ok = ok and all(c['t'] != calc for c in it['c'] if not c.get('k'))
        if not ok: bad += 1
        print(('OK ' if ok else 'NG ') + q, '|', it['q'][:60].replace('\n', ' '), '→ 計算:', calc, '/ 正解:', a)
print('問題', n, '不一致', bad)
