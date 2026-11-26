#!/usr/bin/env python3
"""e4a 確かめ：out/e4a.json の 全問を 一覧に し、正解の 選択肢を 数の 計算で 突き合わせる。
 1) 独立の 計算（正規表現で 問題文から 数を 読み、四捨五入・見積もり・読み方 を 計算し直す）
 2) まちがいの 選択肢が 正解と 一致しない／重ならない ことの 確認
使い方: python3 e4a.verify.py   （e4 フォルダの out/ で）"""
import json, re, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(os.path.join(HERE, 'e4a.json')))

def rn(n, p): return (n + p // 2) // p * p
def up(n, p): return -(-n // p) * p
def top(n, k):
    return rn(n, 10 ** (len(str(n)) - k))
PLACE = {'一の位': 1, '十の位': 10, '百の位': 100, '千の位': 1000, '一万の位': 10000}
D = '一二三四五六七八九'
def grp(g):
    s = ''
    for v, u in ((g // 1000 % 10, '千'), (g // 100 % 10, '百'), (g // 10 % 10, '十')):
        if v: s += u if v == 1 else D[v - 1] + u
    return s + (D[g % 10 - 1] if g % 10 else '')
def kread(n):
    ps = []
    for u, dv in (('兆', 10**12), ('億', 10**8), ('万', 10**4), ('', 1)):
        g = n // dv % 10000
        if g: ps.append('一' + u if g == 1 and u else grp(g) + u)
    return ' '.join(ps)
def mix(n):
    return ''.join(f'{n // dv % 10000}{u}' for u, dv in (('兆', 10**12), ('億', 10**8), ('万', 10**4), ('', 1)) if n // dv % 10000)

def indep(q):
    """問題文から 独立に 答えを 出せる 型。出せない ときは None"""
    m = re.match(r'^(\d+)を ししゃごにゅうして、(.+?)までの がい数に', q)
    if m: return str(rn(int(m[1]), PLACE[m[2]]))
    m = re.match(r'^(\d+)を ししゃごにゅうして、上から (\d)けたの がい数に', q)
    if m: return str(top(int(m[1]), int(m[2])))
    m = re.match(r'^(\d+) は どう 読みますか', q)
    if m: return kread(int(m[1]))
    m = re.match(r'^(\d+) ([+−×÷]) (\d+)を、(.+?)に して 見積もります', q)
    if m:
        a, op, b, how = int(m[1]), m[2], int(m[3]), m[4]
        if '千の位までの' in how: f = lambda x: rn(x, 1000)
        elif '百の位までの' in how: f = lambda x: rn(x, 100)
        elif '上から 1けたの' in how: f = lambda x: top(x, 1)
        else: return None
        a, b = f(a), f(b)
        return str({'+': a + b, '−': a - b, '×': a * b, '÷': a // b}[op])
    return None

bad = 0; nind = 0
for it in items:
    ans = [c for c in it['c'] if c.get('k') == 1]
    assert len(ans) == 1, it['id']
    a = ans[0]['t']
    wr = [c['t'] for c in it['c'] if c.get('k') != 1]
    flag = ''
    if a in wr or len(set(x.replace(' ', '') for x in wr + [a])) != 4:
        flag += ' 【選択肢が 重なる】'; bad += 1
    v = indep(it['q'])
    if v is not None:
        nind += 1
        if v != a:
            flag += f' 【独立計算 {v} と 不一致】'; bad += 1
        elif v in wr:
            flag += ' 【まちがい選択肢が 正解と 一致】'; bad += 1
    print(f"{it['id']}\t{it['q'][:70]}\t=> {a}{flag}")
print(f'\n全 {len(items)} 問、独立計算で 確かめた もの {nind} 問、問題 {bad} 件')
sys.exit(1 if bad else 0)
