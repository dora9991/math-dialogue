#!/usr/bin/env python3
"""授業ナビ 標準版の検算と、形の検査（開発用）。
使い方:  python3 tools/verify.py [単元のキー …]      （単元を書かなければ全部）
         python3 tools/verify.py --cover              （単元ごとの、できあがり数だけを出す）

 1) 検算：記入欄（W）につけた v（検算の種類）と vp（問題の式）を読んで、解答例の最後の答えが合っているかを確かめる。
      calc … 式の計算・展開（問題の式と答えが等しい）            fact … 因数分解（等しい＋積の形）
      eq   … 1つの文字の方程式（答えの「x＝…」が解）             sys  … 連立方程式（{|式|式|} と「x＝…、y＝…」）
      quad … 二次方程式（答えの「x＝…、x＝…」が解の全部）         quadw… 文章題の二次方程式
      val  … 式の値（vp は「式 ; a＝2 ; b＝−3」）                 pts  … 関数の式（答えの最後の「y＝…」が vp の点をぜんぶ通る）
      roc  … 変化の割合（vp は「式 ; はじめの x ; おわりの x」）
      num  … vp に書いた計算（Python の式。分数は F(1,2)、平方根は sqrt(2)、円周率は pi）の値が、解答例の最後の答えと等しい
      has  … vp に書いたことば（「|」で区切る）が、解答例にぜんぶ入っている
      py   … vp に書いた確かめの式（Python）が成り立つ（文章題の確かめ・選ぶ問題など）
 2) 形：ワークシート＝1ページ／演習プリント＝表と裏（見出し：問題演習・ポイント・基礎・基本・標準・応用・入試に挑戦）／
        小テスト＝1ページ・合計100点・チャレンジ1問。記入欄の行数が、解答例の行数より少なくないか。
 3) 図：図形（GE）の「長さ」「角」「直角」「印」が、点の座標と合っているか（わざと縮尺を変えた図は ns: true）。
 4) そろい具合：年間計画の各時間に、授業構想・ワークシート・演習プリント・小テストがあるか。
"""
import json, os, re, subprocess, sys, math
from fractions import Fraction
from itertools import permutations, combinations, product
import sympy as sp

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import vcore as dv

ENV = {'F': Fraction, 'sqrt': sp.sqrt, 'pi': sp.pi, 'R': sp.Rational, 'abs': abs, 'max': max, 'min': min, 'sum': sum, 'round': round,
       'sorted': sorted, 'len': len, 'math': math, 'all': all, 'any': any, 'range': range, 'set': set, 'list': list, 'int': int, 'float': float,
       'zip': zip, 'enumerate': enumerate, 'tuple': tuple, 'str': str, 'pow': pow, 'gcd': math.gcd, 'lcm': math.lcm, 'divmod': divmod, 'perm': permutations, 'comb': combinations, 'prod': product, 'C': math.comb,
       'isprime': sp.isprime, 'factorint': sp.factorint, 'divisors': sp.divisors, 'S': dv.S, 'simplify': sp.simplify, 'expand': sp.expand, 'Symbol': sp.Symbol, 'solve': sp.solve}

def check(kind, vp, ans):
    kind = kind.strip()
    if kind == 'py':
        return None if eval(vp, dict(ENV, __builtins__={})) is True else f'確かめの式が成り立たない: {vp}'
    if kind == 'num':
        want = eval(vp, dict(ENV, __builtins__={}))
        if isinstance(want, Fraction): want = sp.Rational(want.numerator, want.denominator)
        if isinstance(want, float): want = sp.nsimplify(want, rational=True)
        a = dv.final_value(ans)
        if not a: return f'解答例の最後の答えが読めない: {dv.last_line(ans)}'
        got = dv.S(a)
        return None if dv.eq_zero(sp.sympify(want) - got) else f'計算 {vp} ＝ {want}、答えは {a}'
    if kind == 'has':
        miss = [w for w in vp.split('|') if w.strip() and w.strip() not in ans]
        return f'解答例に {miss} がない' if miss else None
    return dv.check(kind, vp, ans)

KINDS = (('worksheets', 'W', 'ワークシート'), ('drills', '演', '演習プリント'), ('quizzes', '小', '小テスト'))
DR_SECS = ('問題演習', '基礎・基本', '標準', '応用', '入試に挑戦')

def shape_of(kind, sid, sh, lesson):
    out = []; blocks = sh.get('blocks', [])
    top = [b.get('type') for b in blocks]
    def flat(bs):   # 段組の中の見出しも数える
        for b in bs:
            yield b
            if b.get('type') == 'cols':
                for c in b.get('cols', []): yield from flat(c.get('blocks', []))
    secs = [b.get('label') for b in flat(blocks) if b.get('type') == 'meate' and b.get('label')]
    def nested(bs, depth=0):   # 段組の中の段組（2列以上の小問）は、画面にも紙にも出ない
        for b in bs:
            if b.get('type') == 'cols':
                if depth: return True
                if any(nested(c.get('blocks', []), depth + 1) for c in b.get('cols', [])): return True
        return False
    if nested(blocks): out.append('段組の中に、段組（2列以上の小問）がある。印刷されない')
    if kind == 'worksheets':
        if top.count('break') > 1: out.append('改ページが多い')
        if not any(b.get('type') == 'meate' and not b.get('label') for b in blocks): out.append('めあてがない')
    elif kind == 'drills':
        if top.count('break') != 1: out.append(f'改ページが {top.count("break")} 個（1個のはず）')
        for need in DR_SECS:
            if need not in secs: out.append(f'見出し「{need}」がない')
        if not any(b.get('type') == 'text' and b.get('label') == 'ポイント' for b in blocks): out.append('ポイントがない')
    else:
        if 'break' in top: out.append('改ページがある（1枚のはず）')
        if secs.count('小テスト') != 1 or secs.count('チャレンジ') != 1: out.append(f'見出しが {secs}')
        pts = [int(b.get('pt') or 0) for b in dv.walk(blocks)]
        if sum(pts) != 100 or sh.get('total') != 100: out.append(f'点の合計が {sum(pts)}／{sh.get("total")} 点')
    return out

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]; cover_only = '--cover' in sys.argv
    data = json.loads(subprocess.run(['node', os.path.join(HERE, 'dump.cjs')], capture_output=True, text=True, check=True).stdout)
    units = {u['key']: u for u in data['units']}; lessons = data['lessons']
    unit_of = {l['id']: l['unit'] for l in lessons}
    sel = lambda lid: (not args) or unit_of.get(lid) in args
    n_ok = n_ng = n_auto = n_w = 0; shape = []
    if not cover_only:
        for kind, mark, name in KINDS:
            for sid, sh in data[kind].items():
                if sid not in unit_of: shape.append(f'{mark} {sid}: 年間計画にない時間'); continue
                if not sel(sid): continue
                for m in shape_of(kind, sid, sh, None): shape.append(f'{mark} {sid}: {m}')
                for b in dv.walk(sh.get('blocks', [])):
                    if b.get('type') == 'figure':
                        for fg in b.get('figs', []):
                            if fg.get('kind') == 'geo' and not fg.get('ns'):
                                for m in dv.geo_check(fg.get('src', '')): shape.append(f'{mark} {sid}: 図 {m}')
                        continue
                    if b.get('type') != 'write': continue
                    n_w += 1
                    ans = b.get('answer') or ''
                    nl = len([x for x in ans.split('\n') if x.strip()])
                    if nl > int(b.get('rows') or 1): shape.append(f'{mark} {sid}: 行数 {b.get("rows")} ＜ 解答例 {nl} 行 「{ans[:18]}…」')
                    if kind != 'worksheets' and not ans: shape.append(f'{mark} {sid}: 解答例のない記入欄')
                    if not b.get('v'): continue
                    n_auto += 1
                    try: err = check(b['v'], b.get('vp', ''), ans)
                    except Exception as e: err = f'検算できない（{type(e).__name__}: {e}）'
                    if err: n_ng += 1; print(f'NG  {mark} {sid} [{b["v"]}] {str(b.get("vp", ""))[:50]} → {err}')
                    else: n_ok += 1
        # 授業構想：本時の中心の分の合計が型どおりか、板書計画・考える問い・表現する場面・見取りがそろっているか
        LECT = {'探': 28, '例': 20, '遊': 30, '練': 5, '活': 33, '確': 10}
        for l in lessons:
            if not sel(l['id']) or not l.get('card'): continue
            tot = sum(int(f.get('min') or 0) for f in l.get('flow', []))
            if tot != LECT.get(l['type']): shape.append(f"構 {l['id']}: 流れの分の合計が {tot}（{l['type']}は {LECT.get(l['type'])} のはず）")
            for key, name in (('goal', 'ねらい'), ('think', '考える問い'), ('say', '表現する場面'), ('see', '見取り'), ('tips', 'つまずき'), ('board', '板書計画'), ('matome', 'まとめ')):
                if not l.get(key): shape.append(f"構 {l['id']}: {name}がない")
            b = l.get('board') or []
            if b and (len(b) != 3 or any(len(c) < 3 for c in b)): shape.append(f"構 {l['id']}: 板書計画は3列・各列2行以上にする")
            # 授業構想の「考える問い」は、ワークシートの「考えよう」と同じ文にする（教師と生徒で、問いがずれないように）
            ws = data['worksheets'].get(l['id'])
            if ws and l.get('think'):
                sq = lambda t: re.sub(r'\s', '', t or '')
                ks = [sq(x.get('text')) for x in dv.walk(ws.get('blocks', [])) if x.get('type') == 'kadai' and x.get('label') == '考えよう']
                if ks and sq(l['think']) not in ks: shape.append(f"構 {l['id']}: 考える問いが、ワークシートの「考えよう」と同じ文になっていない")
            for txt in [l.get('think', ''), l.get('matome', '')] + [x for c in b for x in c] + [f.get('tx', '') for f in l.get('flow', [])]:
                if '{{' in str(txt): shape.append(f"構 {l['id']}: 授業構想・板書に空らんの記号がある「{str(txt)[:20]}」")
        for s in shape: print('形  ' + s)
        print(f'記入欄 {n_w}　自動の検算: {n_ok} 問 OK / {n_ng} 問 NG（対象 {n_auto} 問）   形の指摘: {len(shape)} 件')
    # そろい具合
    print('\n単元             時間  構想   W   演   小')
    tot = [0, 0, 0, 0, 0]
    for u in data['units']:
        if args and u['key'] not in args: continue
        ls = [l for l in lessons if l['unit'] == u['key']]
        c = [len(ls), sum(1 for l in ls if l.get('card')), sum(1 for l in ls if l['id'] in data['worksheets']), sum(1 for l in ls if l['id'] in data['drills']), sum(1 for l in ls if l['id'] in data['quizzes'])]
        for i in range(5): tot[i] += c[i]
        tag = f"中{u['grade']} "
        print(f"{tag} {u['key']:<10} {c[0]:>4} {c[1]:>5} {c[2]:>3} {c[3]:>3} {c[4]:>3}  {u['name']}")
    print(f"計               {tot[0]:>4} {tot[1]:>5} {tot[2]:>3} {tot[3]:>3} {tot[4]:>3}")
    sys.exit(1 if (n_ng or shape) else 0)

if __name__ == '__main__': main()
