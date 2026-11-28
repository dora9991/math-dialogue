"""e6a の 確かめ: 全問 「問題 → 計算した答え」を 一覧にし、正解の選択肢と 突き合わせる。
計算した答えは、問題を つくった とき（座標・式から）に answers.json へ 書いた もの。
さらに 文字の 式の 「式の値」の 問題は、問題文から 別に 式を よみとって 計算し直す。"""
import json, re, sys, math
S='/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad'
items=json.load(open(S+'/e6/out/e6a.json')); ans=json.load(open(S+'/e6a_work/answers.json'))
norm=lambda s: re.sub(r'\s','',s)
bad=0
for it in items:
    ok=[c['t'] for c in it['c'] if c.get('k')==1]
    assert len(ok)==1
    exp=ans[it['id']]
    if norm(ok[0])!=norm(exp): print('NG 正解ちがい',it['id'],exp,ok[0]); bad+=1
    for c in it['c']:
        if c.get('k')!=1 and norm(c['t'])==norm(exp): print('NG まちがいが 正解と同じ',it['id'],c['t']); bad+=1
    print(it['id'], '|', it['q'][:50].replace('\n',' '), '→', exp)
# 別の 計算: 「x が N の とき、(式) の 式の 値」
n=0
for it in items:
    m=re.search(r'x が ([\d.]+)の とき、(.+?) の 式の 値',it['q'])
    if m and '=' not in m.group(2):
        e=m.group(2).replace('×','*').replace('÷','/').replace('−','-')
        v=eval(e.replace('x',m.group(1)))
        ok=[c['t'] for c in it['c'] if c.get('k')==1][0]
        if abs(float(re.sub(r'[^\d.]','',ok))-v)>1e-9: print('NG 式の値',it['id'],v,ok); bad+=1
        n+=1
print('式の値の 再計算',n,'問')
# 図の 問題: 座標から 対応する 点を 計算し直す（家の 形・平行四辺形）
H={'A':(5,1),'B':(7,1),'C':(9,3),'D':(9,7),'E':(3,7),'F':(3,3)}
for a,b in (('A','B'),('F','C'),('E','D')):
    assert (12-H[a][0],H[a][1])==H[b]          # じく x＝6
P={'A':(1,4),'B':(8,0),'C':(9,4),'D':(2,8)}; O=(5,4)
for a,b in (('A','C'),('B','D')):
    assert (2*O[0]-P[a][0],2*O[1]-P[a][1])==P[b]
assert math.hypot(P['A'][0]-O[0],P['A'][1]-O[1])==4 and math.hypot(P['B'][0]-O[0],P['B'][1]-O[1])==5
for n,(ax,pt) in {3:(3,False),4:(4,True),5:(5,False),6:(6,True),7:(7,False),8:(8,True),10:(10,True),14:(14,True)}.items():
    assert ax==n and pt==(n%2==0)
print('NG の 数:',bad); sys.exit(1 if bad else 0)
