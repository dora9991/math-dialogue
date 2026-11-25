# e1c: 「おおきさ くらべ」4本・「20までの かず」4本・「3つの かずの けいさん」3本 の 220問を つくり、正解を計算で確かめる。
# 使い方: python3 e1c.verify.py   （out/e1c/<授業のid>.json を 書き出し、全問「問題 → 計算した答え」を 一覧に出す）
import sys, json, re, os
WORK = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e1c_work'
sys.path.insert(0, WORK)
import okisa, kazu20, mitsu

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'e1c')
os.makedirs(OUT, exist_ok=True)
bad = 0; total = 0

def evalexpr(s):
    toks = s.replace('−', '-').split()
    v = int(toks[0])
    for i in range(1, len(toks), 2):
        v = v + int(toks[i+1]) if toks[i] == '+' else v - int(toks[i+1])
    return v

for fn in okisa.ALL + kazu20.ALL + mitsu.ALL:
    L = fn()
    items = L.build()
    json.dump(items, open(os.path.join(OUT, L.lid + '.json'), 'w'), ensure_ascii=False, indent=1)
    print('=====', L.lid)
    for x, it in zip(L.qs, items):
        total += 1
        right = [c['t'] for c in it['c'] if c.get('k') == 1]
        wrongs = [c['t'] for c in it['c'] if c.get('k') != 1]
        ok = (len(right) == 1 and right[0] == x['calc'] and x['calc'] not in wrongs)
        # 独立の 検算（しきの もんだいは、問題文 や 選択肢の しきを もういちど 計算）
        m = re.match(r'^([\d+−\s]+) = □', it['q'])
        if m:
            ok &= (str(evalexpr(m.group(1))) == right[0])
        eqs = [(c['t'], re.match(r'^([\d+−\s]+) = (\d+)$', c['t'])) for c in it['c']]
        if all(mm for _, mm in eqs):
            truth = [c for c, mm in eqs if evalexpr(mm.group(1)) == int(mm.group(2))]
            ok &= (truth == right)
        if all(re.match(r'^[\d+−\s]+$', c['t']) for c in it['c']) and 'こたえが' in it['q']:
            tgt = int(re.search(r'こたえが (\d+)に', it['q']).group(1)) if re.search(r'こたえが (\d+)に', it['q']) else None
            if tgt is not None:
                ok &= ([c['t'] for c in it['c'] if evalexpr(c['t']) == tgt] == right)
            elif 'いちばん おおきい' in it['q']:
                ok &= (max(it['c'], key=lambda c: evalexpr(c['t']))['t'] == right[0])
        if not ok: bad += 1
        print(('OK ' if ok else 'NG '), it['id'], '|', it['q'][:70], '→', x['calc'], '|', 'f' if it.get('f') else '-')
print(f'\n{total} 問  不一致 {bad}')
sys.exit(1 if bad else 0)
