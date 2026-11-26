# e3g 確かめ：out/e3g.json の全問を、別に 計算した 答えと 突き合わせる。
import json, re, sys
E3 = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e3/'
WORK = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e3g_work/'
items = json.load(open(E3 + 'out/e3g.json')); meta = json.load(open(WORK + 'meta.json'))
def ev(s, box=None):
    s = s.replace('×', '*').replace('÷', '/').replace('−', '-')
    if box is not None: s = s.replace('□', '(%s)' % box)
    return s
def holds(eq, box):
    l, r = eq.split('='); return abs(eval(ev(l, box)) - eval(ev(r, box))) < 1e-9
def lead(t): return int(re.match(r'\d+', t).group())
bad = 0
def fail(i, m): 
    global bad; bad += 1; print('  NG', i, m)
for it in items:
    i = it['id']; m = meta[i]; k = m['kind']
    ci = [j for j, c in enumerate(it['c']) if c.get('k') == 1]
    assert len(ci) == 1, i
    ci = ci[0]; ct = it['c'][ci]['t']
    if k == 'num':
        v = eval(m['calc']); u = m['unit']
        ok = abs(v - round(v)) < 1e-9 and lead(ct) == round(v) and ct == f'{int(round(v))}{u}'
        ok2 = all(lead(c['t']) != round(v) for j, c in enumerate(it['c']) if j != ci)
        shown = f'{round(v)}{u}'
        if not (ok and ok2): fail(i, (ct, v))
    elif k == 'expr':
        v = eval(ev(m['calc']))
        shown = f'{v:g}'
        if abs(eval(ev(ct)) - v) > 1e-9: fail(i, 'correct')
        for j, c in enumerate(it['c']):
            if j != ci and abs(eval(ev(c['t'])) - v) < 1e-9: fail(i, ('wrong equals', c['t']))
    elif k == 'eq' or k == 'story':
        shown = ''
        for j, (c, mc) in enumerate(zip(it['c'], m['choices'])):
            assert c['t'] == mc['t'], i
            if k == 'eq':
                t = holds(mc['eq'], mc['v'])
                shown += f"{mc['eq']}[□={mc['v']}]:{t} "
            else:
                t = (mc['eq'] == m['target']) or (abs(eval(ev(mc['eq'])) - eval(ev(m['target']))) < 1e-9 and mc['eq'] == m['target'])
                shown += f"{mc['eq']}:{t} "
            if t != (j == ci): fail(i, ('truth', mc['eq']))
    elif k == 'txt':
        shown = ''
        for j, (c, mc) in enumerate(zip(it['c'], m['choices'])):
            assert c['t'] == mc['t'], i
            shown += f"{int(mc['truth'])}"
            if mc['truth'] != (j == ci): fail(i, ('truth', c['t']))
    elif k == 'odd':
        sols = [[b for b in range(1000) if holds(s, b)][0] for s in m['eqs']]
        shown = str(sols)
        if it['c'][ci]['t'] != m['eqs'][m['oddidx']] or sum(1 for x in sols if x == sols[m['oddidx']]) != 1: fail(i, 'odd')
    print(i, '|', it['q'][:50], '->', shown, '| 正解:', ct)
    for c in it['c']:
        if c.get('k') != 1 and 'w' not in c: pass
print('NG', bad)
sys.exit(1 if bad else 0)
