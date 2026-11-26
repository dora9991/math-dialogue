# 確かめ: 全問「問題 → 計算した答え」を出し、正解の選択肢と突き合わせる。
# 図つきの問題は、SVG の多角形の ちょう点（1マス＝26px）から 面積を 計算し直して 突き合わせる。
import json, re, os
H = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(f'{H}/e5g.json')); chk = {c['id']: c for c in json.load(open(f'{H}/e5g.chk.json'))}
num = lambda s: (lambda m: float(m[-1]) if m else None)(re.findall(r'\d+(?:\.\d+)?', s))
def svg_areas(f):
    res = []
    for p in re.findall(r'<polygon points="([^"]+)"', f):
        pts = [tuple((float(v) - 10) / 26 for v in q.split(',')) for q in p.split()]
        s = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))
        res.append(round(abs(s) / 2, 4))
    return res
bad = 0
for it in items:
    c = chk[it['id']]; oks = [x for x in it['c'] if x.get('k')]
    ok = oks[0]['t']; msg = ''
    if ok != c['ok']: bad += 1; msg += ' [正解の 文字が ちがう]'
    if c['calc'] is not None:
        if abs(num(ok) - c['calc']) > 1e-9: bad += 1; msg += ' [計算と 正解が ちがう]'
        for x in it['c']:
            if not x.get('k') and num(x['t']) is not None and abs(num(x['t']) - c['calc']) < 1e-9: bad += 1; msg += f' [まちがい選択肢が 正解と 一致: {x["t"]}]'
    if 'f' in it:
        ar = svg_areas(it['f']); msg += f' 図の 面積={ar}'
        if len(ar) == 1 and c['calc'] is not None and '面積は 何' in it['q'] and abs(ar[0] - c['calc']) > 1e-9: bad += 1; msg += ' [図から 求めた 面積と ちがう]'
    if len([x for x in it['c'] if x.get('k')]) != 1: bad += 1; msg += ' [正解が 1つでない]'
    print(f"{it['id']}  {it['q'][:50]}… → 計算={c['calc']}  正解={ok}{msg}")
print('\n不一致:', bad)
