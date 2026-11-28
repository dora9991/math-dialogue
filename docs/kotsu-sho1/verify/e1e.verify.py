"""e1e（とけい・かたち・ぶんしょうだい 12本×20問）の 正解の 確かめ。
使い方: python3 out/e1e.verify.py   （out/e1e/*.json と、問題を つくった ときの 指定 e1e_work/calc.json を 読む）
全問「問題 → 計算した 答え → 正解の 選択肢」を 一覧に 出し、食い違いが あれば NG を 出す。
とけいは、図（SVG）の はりの 角度 から じ・ぷん を 読みなおす。"""
import json, glob, math, re, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
CALC = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e1e_work/calc.json'
calcs = json.load(open(CALC))
SHAPE = {'ティッシュの はこ': 'はこ', 'さいころ': 'はこ', 'おかしの はこ': 'はこ', 'ケーキの はこ': 'はこ',
         'ジュースの かん': 'つつ', 'トイレットペーパーの しん': 'つつ', 'ラップの しん': 'つつ',
         'ボール': 'たま', 'みかん': 'たま', 'ビーだま': 'たま'}
MEN = {'たま': 'ぜんぶ まるい めん', 'つつ': 'たいらな めんと まるい めん', 'はこ': 'ぜんぶ たいらな めん'}
FLAT = {'はこ': True, 'つつ': True, 'たま': False}
ROLL = {'はこ': False, 'つつ': True, 'たま': True}   # よこに して ぽんと おすと
WORD = {'ぜんぶで': '+', 'あわせて': '+', 'ふえると': '+', 'もらうと': '+', 'のこりは': '−', 'へると': '−', 'ちがいは': '−'}
SHORT = {'かん': 'ジュースの かん'}

def ev(e):
    assert re.fullmatch(r'[0-9+\-*() ]+', e), e
    return eval(e)

def clock_from_svg(f):
    hands = re.findall(r'<line x1="90" y1="90" x2="([\d.\-]+)" y2="([\d.\-]+)" class="fg-l fg-hand" stroke-width="(\d)"/>', f)
    d = {}
    for x, y, w in hands:
        a = math.degrees(math.atan2(float(x) - 90, -(float(y) - 90))) % 360
        d[int(w)] = a
    mi = round(d[3] / 6) % 60
    ha = d[6] / 30
    hh = int(math.floor(ha - mi / 60 + 0.5)) % 12 or 12   # みじかい はりの ばしょ から じ を もとめる
    return hh, mi, len(hands), d

def hm_text(h, m):
    return f'{h}じ' if m == 0 else (f'{h}じはん' if m == 30 else f'{h}じ{m}ぷん')

def vals(t):
    return [int(x) for x in re.findall(r'\d+', t)]

def compute(it, c):
    """(計算した答え, 補足の 検査 NG の リスト) を 返す"""
    k = c[0]; ng = []
    texts = [x['t'] for x in it['c']]
    if k == 'read':
        h, m = c[1], c[2]
        if it.get('f'):
            hh, mi, n, _ = clock_from_svg(it['f'])
            if (hh, mi) != (h, m): ng.append(f'図は {hh}じ{mi}ふん なのに 指定は {h}じ{m}ふん')
        return hm_text(h, m), ng
    if k == 'readdesc':   # 「ながい はりが 6で、みじかい はりが ○と △の あいだ」の ことばを じ・ぷん から つくる
        h, m = c[1], c[2]
        return f'ながい はりが {6 if m == 30 else 12}で、みじかい はりが {h}と {h % 12 + 1}の あいだ', ng
    if k == 'hand':
        which, h, m, n = c[1:]
        hh, mi, nh, d = clock_from_svg(it['f'])
        if (hh, mi) != (h, m): ng.append('図と 指定が ちがう')
        if which == 'long': got = (round(d[3] / 6) // 5) % 12 or 12
        else: got = round(d[6] / 30) % 12 or 12
        if got != n: ng.append(f'図から よむと {got}')
        return str(got), ng
    if k == 'count_hands':
        _, _, nh, _ = clock_from_svg(it['f']); return f'{nh}本', ng
    if k == 'expr':
        e, u = c[1], c[2]
        if ',' in e:
            a, b = e.split(','); return f'{a}と {b}', ng
        return f'{ev(e)}{u}', ng
    if k == 'fact': return c[1], ng
    if k == 'cmp':
        a, b, na, nb = c[1:]; return (na if a > b else nb), ng
    if k == 'hour_hand': return str(c[1]), ng
    if k == 'pick':
        shape, corr, wr = c[1:]
        if SHAPE[corr] != shape: ng.append('正解の ものが ちがう かたち')
        for w in wr:
            if SHAPE[w] == shape: ng.append(f'まちがいの {w} も {shape}')
        if sorted(texts) != sorted([corr] + wr): ng.append('選択肢が 指定と ちがう')
        return corr, ng
    if k == 'of':
        obj, ans = c[1], c[2]; sh = SHAPE[obj]
        if sh not in ans and MEN[sh] != ans: ng.append(f'{obj} は {sh}（{ans} と あわない）')
        return ans, ng
    if k == 'same_shape':
        objs, sh = c[1], c[2]
        if any(SHAPE[o] != sh for o in objs): ng.append('かたちが そろわない')
        return sh, ng
    if k == 'count_shape':
        objs, sh, n = c[1:]
        cnt = sum(SHAPE[o] == sh for o in objs)
        if cnt != n: ng.append(f'かぞえた {cnt}')
        return f'{cnt}こ' if sh != 'つつ' or True else '', ng
    if k == 'count_flat':
        objs, n = c[1:]
        cnt = sum(FLAT[SHAPE[o]] for o in objs)
        return f'{cnt}こ', ng
    if k == 'roll_pair':
        corr, others = c[1], c[2]
        if not all(ROLL[SHAPE[o]] for o in corr): ng.append('ころがらない ものが 正解に')
        if any(ROLL[SHAPE[o]] for o in others): ng.append('ころがる ものが まちがいに')
        return 'と'.join(x.replace('ジュースの ', '') if x.startswith('ジュース') else x for x in [corr[0].replace('ジュースの ', ''), ' ' + corr[1]]).replace('と ', 'と '), ng
    if k == 'pair_shape':
        sh, corr, others = c[1:]
        if any(SHAPE[o] != sh for o in corr) or any(SHAPE[o] == sh for o in others): ng.append('かたちの わけが ちがう')
        return f'{corr[0]}と {corr[1]}', ng
    if k == 'piece':
        d, key = c[1], c[2]; return f'{d[key]}まい', ng
    if k == 'most':
        d = c[1]; return max(d, key=d.get), ng
    if k == 'shiki':
        op, a, b = c[1:]
        mine = f'{a} {op} {b}'
        for x in texts:
            m = re.fullmatch(r'(\d+) ([+−]) (\d+)', x)
            if m and x != mine and m.group(2) == op and sorted([int(m.group(1)), int(m.group(3))]) == sorted([a, b]): ng.append(f'{x} も おなじ しき')
        return mine, ng
    if k == 'eq':
        op, a, b = c[1:]
        r = a + b if op == '+' else a - b
        mine = f'{a} {op} {b} = {r}'
        for x in texts:
            m = re.fullmatch(r'(\d+) ([+−]) (\d+) = (\d+)', x)
            if m and x != mine and m.group(2) == op and sorted([int(m.group(1)), int(m.group(3))]) == sorted([a, b]): ng.append(f'{x} も おなじ しき')
        return mine, ng
    if k == 'gap':
        a, b, u = c[1:]; return f'{b - a}{u}', ng
    if k == 'diff':
        na, a, nb, b = c[1:]
        return (f'{na}が {a - b}こ おおい' if a > b else f'{nb}が {b - a}こ おおい'), ng
    if k == 'which_val':
        v, exprs, ans = c[1:]
        hit = [e for e in exprs if ev(e) == v]
        if len(hit) != 1: ng.append('こたえが 2に なる しきが 1つでない')
        return hit[0].replace('-', ' − ').replace('+', ' + '), ng
    if k == 'word':
        w, sign = c[1:]
        if WORD[w] != sign: ng.append('ことばの しるしが ちがう')
        return ('たす' if WORD[w] == '+' else 'ひく'), ng
    if k == 'same_sum':
        a, b, ans = c[1:]
        return ('どちらも 9' if a + b == b + a == 9 else '?'), ng
    if k == 'two':
        a, b, ans = c[1:]; return f'{a + b}こと {a - b}こ', ng
    raise Exception('未対応 ' + k)

bad = 0; n = 0
files = sorted(glob.glob(os.path.join(HERE, 'e1e', '*.json')))
for f in files:
    for it in json.load(open(f)):
        n += 1; c = calcs[it['id']]
        ans, ng = compute(it, c)
        ks = [x for x in it['c'] if x.get('k') == 1]
        cor = ks[0]['t']
        norm = lambda s: s.replace(' ', '').replace('−', '-')
        sentence = c[0] in ('read', 'hand') and len(norm(cor)) > len(norm(ans)) and norm(ans) in norm(cor)   # 「…だから 4じ」のような 文の 正解
        if norm(cor) != norm(ans) and not sentence: ng.append(f'計算した答え「{ans}」と 正解の 選択肢「{cor}」が ちがう')
        # まちがいの 選択肢が 正解と おなじに ならない（ことばが ちがって も 数と たんいが おなじなら NG）
        for x in it['c']:
            if x.get('k') == 1: continue
            if norm(x['t']) == norm(ans): ng.append(f'まちがい「{x["t"]}」が 答えと おなじ')
            if c[0] in ('expr', 'gap', 'piece', 'count_shape', 'count_hands') and vals(x['t']) == vals(ans) and re.sub(r'\d', '', x['t']) == re.sub(r'\d', '', ans): ng.append(f'まちがい「{x["t"]}」が 答えと おなじ')
        if len([x for x in it['c'] if x.get('w')]) < 2: ng.append('w が 2つ未満')
        mark = 'OK' if not ng else 'NG'
        if ng: bad += 1
        print(f"{mark} {it['id']} | {it['q'][:60]} | 計算: {ans} | 正解: {cor}" + ('' if not ng else '\n     ' + ' / '.join(ng)))
print(f'\n{n} 問 中 NG {bad} 問')
sys.exit(1 if bad else 0)
