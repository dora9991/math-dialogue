from decimal import Decimal as D, ROUND_FLOOR, ROUND_HALF_UP, ROUND_CEILING
import json, os
ROOT='/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5/'
IDX={t['id']:t for t in json.load(open(ROOT+'in/index.json'))}
def d(s): return D(str(s))
def fm(x):
    if isinstance(x,str): return x
    x=D(x)
    s=format(x.normalize(),'f')
    return s
def qr(a,b,p=0):
    a=d(a);b=d(b)
    q=(a/b).quantize(D(1).scaleb(-p),rounding=ROUND_FLOOR)
    return q, a-b*q
def qrs(a,b,qu='',ru='',p=0):
    q,r=qr(a,b,p); return f"{fm(q)}{qu} あまり {fm(r)}{ru}"
def rnd(x,p): return D(x).quantize(D(1).scaleb(-p),rounding=ROUND_HALF_UP)
def flo(x,p=0): return D(x).quantize(D(1).scaleb(-p),rounding=ROUND_FLOOR)
def cei(x,p=0): return D(x).quantize(D(1).scaleb(-p),rounding=ROUND_CEILING)
KEYS=[]
class Lesson:
    def __init__(self,lid):
        self.lid=lid; self.items=[]; self.cnt={}
        t=IDX[lid]; self.u='E5-T'+t['code']; self.s=self.u+'-'+str(t['no']).zfill(2)
    def P(self,dd,q,x,W,e,h="わる数を 整数に する には、何倍 すれば いいかな。",u="{}",f=None):
        n=self.cnt.get(dd,0)+1; self.cnt[dd]=n
        val=eval(x) if isinstance(x,str) and not x.startswith('"') else x
        # x が "..." で はじまる とき は そのまま 文字
        if isinstance(x,str) and x.startswith('"'): val=eval(x)
        def F(v):
            if isinstance(v,str):
                return u.format(v[1:]) if v.startswith('#') else v
            return u.format(fm(v))
        ans=F(val)
        cs=[{"t":ans,"k":1}]
        for v,w in W:
            c={"t":F(v)}
            if w: c["w"]=w
            cs.append(c)
        assert len(cs)==4,(self.lid,dd,n)
        pos=(n+dd)%4
        cs=cs[1:]; cs.insert(pos,{"t":ans,"k":1})
        it={"id":f"{self.lid}-L{dd}-{n:02d}","u":self.u,"s":self.s,"l":self.lid,"d":dd,"q":q,"c":cs,"e":e+"\nこたえ "+ans,"h":h}
        if f: it["f"]=f
        self.items.append(it)
        KEYS.append({"id":it["id"],"q":q,"x":x if isinstance(x,str) else repr(x),"ans":ans,"u":u})
    def save(self):
        assert len(self.items)==20 and all(self.cnt.get(k)==5 for k in (1,2,3,4)),(self.lid,self.cnt)
        os.makedirs(ROOT+'out/e5c',exist_ok=True)
        json.dump(self.items,open(ROOT+f'out/e5c/{self.lid}.json','w'),ensure_ascii=False,indent=1)
        old=json.load(open('keys.json')) if os.path.exists('keys.json') else []
        old=[k for k in old if not k['id'].startswith(self.lid+'-')]
        json.dump(old+KEYS,open('keys.json','w'),ensure_ascii=False,indent=1)
