"""e6e 確かめ: 全問「問題 → 計算した 答え」を 一覧に して、正解の 選択肢と 突き合わせる。
計算した 答え（val）は、問題を つくる ときに python（算数・itertools の 数えあげ）で 出した もの
(/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6e_work/answers.json)。
ここでは、それを 読んで ①正解の 選択肢が 計算した 答えと 一致 ②まちがいの 選択肢が 一致しない ③正解は ちょうど 1つ を 確かめる。
さらに、場合の 数・比例 の 一部は、ここで 別に 数えなおして 突き合わせる。"""
import json, glob, os, re, itertools
base = os.path.dirname(os.path.abspath(__file__))
ans = {a['id']: a for a in json.load(open('/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6e_work/answers.json'))}
bad = 0; n = 0
for f in sorted(glob.glob(f'{base}/e6e/*.json')):
    for it in json.load(open(f)):
        n += 1; a = ans[it['id']]
        ks = [c for c in it['c'] if c.get('k') == 1]
        ok = len(ks) == 1 and ks[0]['t'] == a['text'] and a['val'] == a['text']
        wrong_ok = all(c['t'] != a['text'] for c in it['c'] if c.get('k') != 1)
        print(f"{it['id']}  {it['q'][:60]}… → {a['val']}  [{'OK' if ok and wrong_ok else 'NG'}]")
        if not (ok and wrong_ok): bad += 1; print('   !!', it['c'])
# 別に 数えなおす（代表）
P, C = itertools.permutations, itertools.combinations
chk = {
 'baai-01-L1-02': len(list(P('ABC'))), 'baai-01-L1-05': len(list(P('ABCD'))), 'baai-01-L4-02': sum(1 for p in P('ABCD') if p[0] != 'A' and p[-1] != 'A'),
 'baai-02-L1-02': len(list(C('ABCD', 2))), 'baai-02-L2-01': len(list(C(range(5), 2))), 'baai-02-L2-02': len(list(P('ABCD', 2))), 'baai-02-L3-01': len(list(C(range(6), 2))),
 'baai-02-L4-01': len(list(C(range(5), 3))), 'baai-03-L2-01': 2 ** 3, 'baai-03-L4-04': 2 ** 4,
 'baai-04-L1-01': len([1 for a, b in P([1, 2, 3, 4], 2)]), 'baai-04-L2-02': len(list(P([1, 2, 3, 4], 3))), 'baai-04-L3-03': len([p for p in P([0, 1, 2, 3], 3) if p[0]]),
 'baai-05-L1-02': len(list(P(range(5), 2))), 'baai-05-L4-01': len(list(P(range(5), 3))), 'baai-05-L4-05': len([p for p in itertools.product('HT', repeat=4) if p.count('H') == 2]),
 'hirei-01-L1-03': 80 * 5, 'hirei-03-L2-01': 100 * 2800 // 400, 'hirei-04-L4-03': len([x for x in range(1, 13) if 12 % x == 0]), 'hirei-05-L3-01': 24000 // 30,
}
for k, v in chk.items():
    m = re.search(r'\d+', ans[k]['val']); ok = int(m.group()) == v
    print(f'再計算 {k}: {v} 対 {ans[k]["val"]} [{"OK" if ok else "NG"}]'); bad += (not ok)
print(f'\n全 {n} 問、不一致 {bad}')
