"""e6c の 確かめ。使い方: python3 out/e6c.verify.py
全 200 問を「問題 → 計算した 答え」で 一覧に し、out/e6c/*.json の 正解の 選択肢と 突き合わせる。
(1) 作る ときに 計算した 答え(calc)と 正解の 一致  (2) 問題文から 独立に 計算し直せる 型は 計算し直す
(3) まちがいの 選択肢が 正解と 同じ 値に ならないこと (4) 正解の 位置の かたより"""
import sys, json, re, glob, os
from fractions import Fraction as Fr
from math import gcd
W = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6c_work'
sys.path.insert(0, W)
import build, lib
lib.REG.clear()
build.build(write_files=False)
REG = {r['id']: r for r in lib.REG}
E6 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = {os.path.basename(f)[:-5]: json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(f'{E6}/out/e6c/*.json'))}
errs = []; indep = 0; calcs = 0; total = 0


def fr(x):
    x = Fr(x); return str(x.numerator) if x.denominator == 1 else f"{x.numerator}/{x.denominator}"


def val(t):
    t = re.sub(r'\s', '', t)
    m = re.fullmatch(r'(\d+):(\d+)', t)
    if m: return ('ratio', Fr(int(m[1]), int(m[2])))
    m = re.fullmatch(r'(\d+(?:\.\d+)?|\d+/\d+)(cm|m|km)', t)
    if m:
        x = Fr(m[1]); return ('len', x * {'cm': 1, 'm': 100, 'km': 100000}[m[2]])
    m = re.fullmatch(r'(\d+(?:\.\d+)?|\d+/\d+)(.*)', t)
    if m: return ('num' + m[2], Fr(m[1]))
    return ('txt', t)


def simp(a, b):
    g = gcd(a, b); return f"{a // g}:{b // g}"


EXEMPT_EQ = {'hi-03-L4-01'}  # 等しい 比の 中から 和で えらぶ 問題（意図して 2つの 等しい 比を ならべる）
rows = []
for lid, items in files.items():
    pos = [0, 0, 0, 0]
    for it in items:
        total += 1
        r = REG[it['id']]
        texts = [c['t'] for c in it['c']]
        ks = [c['t'] for c in it['c'] if c.get('k') == 1]
        ans = ks[0]; pos[texts.index(ans)] += 1
        if ans != r['ans']: errs.append((it['id'], 'json の 正解が 作った 答えと ちがう'))
        if sorted(texts) != sorted([r['ans']] + r['wrongs']): errs.append((it['id'], '選択肢が 作った ものと ちがう'))
        if r['calc'] is not None:
            calcs += 1
            if r['calc'] != ans: errs.append((it['id'], f"計算 {r['calc']} と 正解 {ans} が ちがう"))
        # まちがいが 正解と 同じ 値に ならない
        va = val(ans)
        for t in texts:
            if t != ans and val(t) == va and it['id'] not in EXEMPT_EQ and it['l'] != 'hi-04':
                errs.append((it['id'], f'まちがい {t} が 正解 {ans} と 同じ 値'))
        # 独立に 計算し直す
        q = it['q']; calc = None
        m = re.match(r'^(\d+):(\d+) の 比の 値は どれですか', q)
        if m: calc = fr(Fr(int(m[1]), int(m[2])))
        m = re.match(r'^(\d+):(\d+) ＝ (\d+):□ です', q)
        if m: calc = str(int(m[2]) * int(m[3]) // int(m[1]))
        m = re.match(r'^(\d+):(\d+) ＝ □:(\d+) です', q)
        if m: calc = str(int(m[1]) * int(m[3]) // int(m[2]))
        m = re.match(r'^(\d+):(\d+) ＝ (\d+):□ です', q)
        m = re.match(r'^(\d+):(\d+) を.*(かんたん|比に)', q)
        if m and it['l'] == 'hi-04': calc = simp(int(m[1]), int(m[2]))
        m = re.match(r'^縮尺が 1:(\d+)の (地図上|図面|平面図上)で、(\d+(?:\.\d+)?)cmの 長さは、実際には 何(m|km)', q)
        if m:
            cm = Fr(m[3]) * int(m[1]); u = m[4]
            calc = (fr(cm / 100) + 'm') if u == 'm' else (fr(cm / 100000) + 'km')
        m = re.match(r'^縮尺 1:(\d+)の 縮図で、(?:ABが |AB が |.*?が )(\d+(?:\.\d+)?)cmでした。実際の .*何mですか', q)
        if m and it['l'] == 'shuku-05' and 'ビル' not in q and '目の' not in q and 'ピヨ' not in q:
            calc = fr(Fr(m[2]) * int(m[1]) / 100) + 'm'
        if calc is not None:
            indep += 1
            if calc != ans: errs.append((it['id'], f'問題文から 計算し直すと {calc}、正解は {ans}'))
        rows.append((it['id'], q[:60], r['calc'] if r['calc'] is not None else '-', calc if calc is not None else '-', ans))
    if max(pos) > 8: errs.append((lid, f'正解の 位置が かたよっている {pos}'))
    print(lid, '正解の 位置 A/B/C/D =', pos)
print()
for row in rows: print(' | '.join(str(x) for x in row))
print(f'\n問題 {total} 問。作る ときの 計算と 一致を 確かめた 問題 {calcs}、問題文から 計算し直した 問題 {indep}')
if errs:
    print('エラー', len(errs))
    for e in errs: print('  x', e)
    sys.exit(1)
print('確かめ OK')
