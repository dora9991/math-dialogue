# 確かめ: 全問「問題 → 計算した答え」を出し、正解の選択肢と突き合わせる。
# e3c.checks.json は、問題づくりの ときに 正解を 出した 式（expr）と 書式（fmt）。ここで もう一度 計算しなおす。
import json, re, glob, os
D = os.path.dirname(os.path.abspath(__file__))
NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']
def g4(x):
    s = ''
    for v, ch in ((1000, '千'), (100, '百'), (10, '十')):
        d = x // v % 10
        if d: s += ('' if d == 1 else NUM[d]) + ch
    return s + (NUM[x % 10] if x % 10 else '')
def read(n):
    big, rest = divmod(n, 10000); s = ''
    if big: s = g4(big) + '万'
    if rest: s += (' ' if s else '') + g4(rest)
    return s
checks = json.load(open(f'{D}/e3c.checks.json'))
bad = 0; n = 0
for f in sorted(glob.glob(f'{D}/e3c/*.json')):
    for it in json.load(open(f)):
        n += 1; i = it['id']; ck = checks[i]
        right = [c['t'] for c in it['c'] if c.get('k')][0]
        wrong = [c['t'] for c in it['c'] if not c.get('k')]
        if 'expr' in ck:
            calc = ck['fmt'].format(eval(ck['expr'], {'read': read}))
            ok = calc == right and calc not in wrong
            print(('OK ' if ok else 'NG ') + i, '|', it['q'][:50], '→', calc, '| 正解:', right)
        else:
            ok = ck['manual'] == right
            print(('OK ' if ok else 'NG ') + i, '|', it['q'][:50], '→ (文) 正解:', right)
        # 式の たしかめ: 解説 e の 中の 「a × b = c」「a + b = c」「a − b = c」
        def chk(txt):
            global bad
            res = True
            if '□' in txt: return True  # □の 式は 文章の 確かめを べつに（27×3=81、427×2=854）
            for ex, c in re.findall(r'(\d+(?: [×+−] \d+)+) = (\d+)', txt):
                v = eval(ex.replace('×', '*').replace('−', '-'))
                if v != int(c): res = False; print('  NG 式:', ex, '=', c, '(本当は', v, ')')
            return res
        if not chk(it['e']): ok = False
        if not chk(right): ok = False
        # 「A × B の 答え」型は、問題文からも 計算
        m = re.match(r'^(\d+) × (\d+) の 答えは', it['q'])
        if m and str(int(m[1]) * int(m[2])) not in right: ok = False; print('  NG 問題文から:', int(m[1]) * int(m[2]))
        if not ok: bad += 1
print('問題', n, '／ NG', bad)
