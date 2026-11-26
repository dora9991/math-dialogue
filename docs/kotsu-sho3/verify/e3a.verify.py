#!/usr/bin/env python3
"""e3a の 確かめ。使い方: python3 e3/out/e3a.verify.py
各問題の「問題 → 計算した答え」を 一覧に 出し、正解の 選択肢と 突き合わせる。
・meta.json（作る ときに 残した 計算式 ex）を、もう一度 計算し直して 正解の 選択肢と くらべる
・まちがいの 選択肢が 正解と 同じ（かず・書きかたとも）でないか
・解説 e の 中の 「a ＋ b ＝ c」の 式（くさり式も）を ぜんぶ 計算して たしかめる
・正解の 選択肢に ある 式も たしかめる（inv の 問題は ぎゃくに、まちがい 3つの 式が 正しいか）
"""
import json, os, re, sys, glob

BASE = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad'
OUT = BASE + '/e3/out/e3a'
META = BASE + '/e3a_work/meta.json'

def hm(m):
    h, mm = divmod(m, 60)
    if h and mm: return f'{h}時間{mm}分'
    if h: return f'{h}時間'
    return f'{mm}分'
def ms(s):
    m, ss = divmod(s, 60)
    if m and ss: return f'{m}分{ss}秒'
    if m: return f'{m}分'
    return f'{ss}秒'
def t12(total):
    h, m = divmod(total, 60); h = h % 12 or 12
    return f'{h}時{m}分' if m else f'{h}時'
def t24(total):
    h, m = divmod(total, 60)
    ap = '午前' if h < 12 else '午後'
    assert h != 12, 'avoid 午後0時'
    h2 = h if h < 12 else h - 12
    return f'{ap}{h2}時{m}分' if m else f'{ap}{h2}時'
def val(s): return eval(s.replace('−', '-').replace('×', '*').replace('÷', '//'))

def ev(ex, u=''):
    r = eval(ex, {'hm': hm, 'ms': ms, 't12': t12, 't24': t24, 'val': val})
    return r if isinstance(r, str) else f'{r}{u}'

def norm(s): return re.sub(r'\s+', '', str(s)).replace('＝', '=').replace('－', '-').replace('−', '-')

M = r'\d+(?:\s*[+\-−×÷]\s*\d+)*'
def eq_line_ok(line):
    """1行の 中の「=」の まえと うしろの 式（数だけ）を 計算して くらべる。ぜんぶ 合えば True、1つでも ちがえば False、見つからなければ None"""
    segs = re.split(r'[=＝]', line)
    if len(segs) < 2: return None
    res = []
    for l, r in zip(segs, segs[1:]):
        ml = re.search('(' + M + r')\s*$', l)
        mr = re.match(r'\s*(' + M + ')', r)
        if not (ml and mr): continue
        # 左が 「…10が 3つ」の ように 数の まえに ことばが 続く ときも、末尾の 式だけを 見る
        try: res.append(val(ml.group(1)) == val(mr.group(1)))
        except Exception: pass
    if not res: return None
    return all(res)

def main():
    meta = json.load(open(META))
    n = bad = 0
    for f in sorted(glob.glob(OUT + '/*.json')):
        qs = json.load(open(f))
        for it in qs:
            n += 1
            m = meta[it['id']]
            ans = ev(m['ex'], m.get('u', ''))
            ks = [c for c in it['c'] if c.get('k') == 1]
            problems = []
            if len(ks) != 1: problems.append('正解が 1つでない')
            elif norm(ks[0]['t']) != norm(ans): problems.append(f'正解の 選択肢 {ks[0]["t"]} ≠ 計算 {ans}')
            for c in it['c']:
                if c.get('k') != 1 and norm(c['t']) == norm(ans): problems.append(f'まちがいが 正解と 同じ: {c["t"]}')
            lines = it['e'].split('\n')
            if norm(lines[-1]) != norm('こたえ' + ans): problems.append(f'解説の こたえ {lines[-1]} ≠ {ans}')
            for ln in lines[:-1]:
                r = eq_line_ok(ln)
                if r is False: problems.append(f'解説の 式が 合わない: {ln}')
            # 選択肢の 式
            for c in it['c']:
                r = eq_line_ok(c['t'])
                if r is None: continue
                if m.get('inv'):
                    if c.get('k') == 1 and r: problems.append(f'inv: 正解の 式が 正しく ない はず: {c["t"]}')
                    if c.get('k') != 1 and not r: problems.append(f'inv: まちがい の 式が 正しく ない: {c["t"]}')
                elif c.get('k') == 1 and not r:
                    problems.append(f'正解の 式が 合わない: {c["t"]}')
            if m.get('note'):
                pass
            q1 = it['q'].replace('\n', ' ')
            print(f'{it["id"]}  {q1[:60]}  →  {ans}  {"OK" if not problems else "NG"}')
            if problems:
                bad += 1
                for p in problems: print('     ✗', p)
    print(f'\n全 {n} 問・NG {bad} 問')
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
