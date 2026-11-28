"""e2f の 確かめ。使い方: python3 e2f.verify.py
1. 問題づくり（e2f_work/*.py）が 計算で 出した 正解（truth.json）と、正解の 選択肢が 一致するか
2. まちがいの 選択肢が 正解と 一致して いないか
3. 図（テープ・ひろげた 図）から 正解を 数えなおして 突き合わせる
4. 長さの 計算（m と cm）・数の 大小は、問題文から もう一度 べつに 計算する
全問「問題 → 計算した 答え → 正解の 選択肢」を 一覧に 出す。"""
import json, re, sys
W = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad'
items = json.load(open(f'{W}/e2/out/e2f.json'))
truth = json.load(open(f'{W}/e2f_work/truth.json'))
bad = []
def mcm(cm):
    m, c = divmod(cm, 100)
    return f'{c}cm' if m == 0 else (f'{m}m' if c == 0 else f'{m}m {c}cm')
def parse_len(s):
    m = re.fullmatch(r'(?:(\d+)m)?\s*(?:(\d+)cm)?', s.strip())
    return int(m.group(1) or 0) * 100 + int(m.group(2) or 0)
for it in items:
    iid = it['id']; ks = [c['t'] for c in it['c'] if c.get('k')]
    ans = ks[0]; t = truth[iid]['ans']; ok = (ans == t and len(ks) == 1)
    note = ''
    if any(c['t'] == t for c in it['c'] if not c.get('k')): ok = False; note += ' [誤答が正解と同じ]'
    q = it['q']; f = it.get('f', '')
    # 図から
    if iid.startswith('bunsu2') and 'テープ' in q and f and f.count('<rect') >= 2:
        n = f.count('<rect'); k = f.count('fg-acc-fill')
        if 'ぬって いない' in q and '何つ分' in q: exp = f'{n-k}つ分'
        elif 'ぬって いない' in q: exp = f'1/{n}' if n - k == 1 else ('1/2' if (n - k) * 2 == n else '?')
        elif '何つ分' in q: exp = f'{k}つ分'
        elif 'どれと おなじ' in q: exp = '1/2' if 2 * k == n else ('1/4' if 4 * k == n else '?')
        else: exp = f'1/{n}' if k == 1 else '?'
        if exp != ans: ok = False; note += f' [図から {exp}]'
        note += f' (図: {n}つに わけて {k}つ ぬる)'
    if iid.startswith('hako-03') and f and 'ひろげた 図の めんは' in q:
        n = f.count('<polygon'); exp = f'{n}まい'
        if exp != ans: ok = False; note += f' [図から {exp}]'
        note += f' (図: めん {n}まい)'
    if iid.startswith('hako-03') and f and 'あと 何まい' in q:
        n = f.count('<polygon'); exp = f'{6-n}まい'
        if exp != ans: ok = False; note += f' [図から {exp}]'
    # 長さの 計算（べつに 計算）
    if iid.startswith('meter-02'):
        m = re.search(r'([\dm cm]+?)の (?:リボン|テープ|ひも|ロープ)と ([\dm cm]+?)の (?:リボン|テープ|ひも|ロープ)を つ', q)
        m2 = re.search(r'(\d+m \d+cm|\d+m|\d+cm)の (?:テープ|ひも|ロープ)から、(\d+m \d+cm|\d+m|\d+cm)(?:を)? ?切りとります', q)
        m3 = re.search(r'(\d+m \d+cm|\d+m|\d+cm)の (?:ひも|テープ)に、(\d+m \d+cm|\d+m|\d+cm)の (?:ひも|テープ)を つなぎ', q)
        m4 = re.search(r'(\d+m \d+cm|\d+m|\d+cm)の ひもに、(\d+m \d+cm|\d+m|\d+cm)の ひもを つなぎま', q)
        r = None
        if m2: r = parse_len(m2.group(1)) - parse_len(m2.group(2))
        elif m3: r = parse_len(m3.group(1)) + parse_len(m3.group(2))
        elif m4: r = parse_len(m4.group(1)) + parse_len(m4.group(2))
        elif m and ' ' not in m.group(1)[-1:]:
            try: r = parse_len(m.group(1)) + parse_len(m.group(2))
            except Exception: r = None
        if iid == 'meter-02-L4-05': r = 150 + 80 - 100   # 2段の 計算
        if iid == 'meter-02-L4-01': r = None; ans_ok = (180 - 120 == int(ans.rstrip('cm')))
        if r is not None:
            if mcm(r) != ans: ok = False; note += f' [別計算 {mcm(r)}]'
            else: note += ' (別計算 一致)'
    # 4けたの 数の 大小
    if iid.startswith('suu4-04'):
        m = re.match(r'(\d{4})と (\d{4})では、どちらが (大きい|小さい)', q)
        if m:
            a, b = int(m.group(1)), int(m.group(2)); exp = str(max(a, b) if m.group(3) == '大きい' else min(a, b))
            if exp != ans: ok = False; note += f' [別計算 {exp}]'
            else: note += ' (別計算 一致)'
    print(f'{"OK " if ok else "NG "}{iid} | {q[:46]} | 答え {t} | 正解の 選択肢 {ans}{note}')
    if not ok: bad.append(iid)
print(f'\n全 {len(items)} 問、不一致 {len(bad)} 問', bad)
sys.exit(1 if bad else 0)
