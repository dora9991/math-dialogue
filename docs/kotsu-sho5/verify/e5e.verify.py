"""e5e の 確かめ。全問「問題 → 計算した 答え」を 出し、正解の 選択肢と 突き合わせる。
計算した 答えは、作成スクリプト（scratchpad/e5e_work）が Fraction で 出した 値（answers.json）。
ここでは、(1) 正解の 文字を 数に 読みなおして 計算値と 一致するか、(2) まちがいの 選択肢が 正解と 同じ 数に ならないか を 見る。"""
import json, re, sys
from fractions import Fraction as F
BASE = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad'
calc = json.load(open(BASE + '/e5e_work/answers.json'))
items = json.load(open(BASE + '/e5/out/e5e.json'))
def parse(t):
    """「数＋たんい」だけの 文字を 数に 読みなおす（式・ならび・文は None）"""
    t = t.replace(' ', '')
    m = re.fullmatch(r'(\d+)と(\d+)/(\d+)([^\d=、÷×と]*)', t)
    if m: return F(int(m[1])) + F(int(m[2]), int(m[3]))
    m = re.fullmatch(r'(\d+)/(\d+)([^\d=、÷×と]*)', t)
    if m: return F(int(m[1]), int(m[2]))
    m = re.fullmatch(r'(\d+(\.\d+)?)([^\d=、÷×と.]*)', t)
    if m: return F(m[1])
    return None
bad = 0
for it in items:
    c = calc[it['id']]
    key = [x for x in it['c'] if x.get('k') == 1][0]['t']
    ok = key == c['key']
    kv = parse(key)
    try: cv = F(c['calc'])
    except Exception: cv = None
    if kv is not None and cv is not None and not re.search(r'[a-z]', c['calc']):
        ok = ok and kv == cv
    for x in it['c']:
        if x.get('k') == 1: continue
        wv = parse(x['t'])
        if wv is not None and kv is not None and wv == kv and re.sub(r'[\d./と ]', '', x['t']) == re.sub(r'[\d./と ]', '', key): ok = False; print('  まちがいが 正解と 同じ:', x['t'])
    if not ok: bad += 1
    print(('OK ' if ok else 'NG ') + it['id'], '|', it['q'].replace('\n', ' / '), '→', c['calc'], '| 正解:', key)
print('\n全', len(items), '問、不一致', bad)
sys.exit(1 if bad else 0)
