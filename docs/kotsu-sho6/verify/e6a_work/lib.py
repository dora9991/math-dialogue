import json, random, sys, math, os
S='/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad'
E6=S+'/e6'; WORK=S+'/e6a_work'; OUT=E6+'/out/e6a'
sys.path.insert(0,E6); import figs
CODE={'taisho':('A'),'moji':('B')}
INFO={'taisho-01':('A',1),'taisho-02':('A',2),'taisho-03':('A',3),'taisho-04':('A',4),'taisho-05':('A',5),
      'moji-01':('B',1),'moji-02':('B',2),'moji-03':('B',3),'moji-04':('B',4),'moji-05':('B',5)}
_in={x['id']:x for x in json.load(open(E6+'/in/e6a.json'))}
for k,v in INFO.items():
    assert _in[k]['code']==v[0] and _in[k]['no']==v[1],(k,_in[k]['code'],_in[k]['no'])
def refl_line(p,a,b):
    (x,y),(x1,y1),(x2,y2)=p,a,b
    dx,dy=x2-x1,y2-y1; t=((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy)
    fx,fy=x1+t*dx,y1+t*dy
    return (2*fx-x,2*fy-y)
def refl_pt(p,o): return (2*o[0]-p[0],2*o[1]-p[1])
def dist(p,q): return math.hypot(p[0]-q[0],p[1]-q[1])
def area(pts):
    s=0
    for i in range(len(pts)):
        x1,y1=pts[i];x2,y2=pts[(i+1)%len(pts)]; s+=x1*y2-x2*y1
    return abs(s)/2
def ang(p,q,r):  # angle at q
    a=math.atan2(p[1]-q[1],p[0]-q[0]);b=math.atan2(r[1]-q[1],r[0]-q[0])
    d=abs(math.degrees(a-b))%360
    return round(min(d,360-d),6)
def near(p,q): return abs(p[0]-q[0])<1e-9 and abs(p[1]-q[1])<1e-9
def fmt(v):
    if abs(v-round(v))<1e-9: return str(int(round(v)))
    return ('%.6f'%v).rstrip('0').rstrip('.')
class Lesson:
    def __init__(s,lid,seed):
        s.id=lid; s.items=[]; s.ans={}; s.seed=seed
    def q(s,d,q,right,wrongs,e,h,f=None,ans=None):
        assert len(wrongs)==3
        ws=sum(1 for t,w in wrongs if w)
        assert ws>=2,(s.id,q)
        s.items.append(dict(d=d,q=q,right=right,wrongs=wrongs,e=e,h=h,f=f,ans=ans if ans is not None else right))
    def done(s):
        assert len(s.items)==20,(s.id,len(s.items))
        for i in range(20): assert s.items[i]['d']==i//5+1,(s.id,i)
        rng=random.Random(s.seed)
        while True:
            pos=[rng.randrange(4) for _ in range(20)]
            cnt=[pos.count(i) for i in range(4)]
            if max(cnt)<=6 and min(cnt)>=3 and not all(pos[i]==pos[i%4] for i in range(20)) \
               and not any(pos[i]==pos[i+1]==pos[i+2] for i in range(18)): break
        out=[]; code,no=INFO[s.id]
        for i,it in enumerate(s.items):
            wr=it['wrongs'][:]; rng.shuffle(wr)
            ch=[]
            for j in range(4):
                if j==pos[i]: ch.append({'t':it['right'],'k':1})
                else:
                    t,w=wr.pop(); c={'t':t}
                    if w: c['w']=w
                    ch.append(c)
            qid='%s-L%d-%02d'%(s.id,it['d'],i%5+1)
            o={'id':qid,'u':'E6-T'+code,'s':'E6-T%s-%02d'%(code,no),'l':s.id,'d':it['d'],'q':it['q'],'c':ch,'e':it['e'],'h':it['h']}
            if it['f']: o['f']=it['f']
            out.append(o); s.ans[qid]=it['ans']
        os.makedirs(OUT,exist_ok=True)
        json.dump(out,open('%s/%s.json'%(OUT,s.id),'w'),ensure_ascii=False,indent=1)
        a=json.load(open(WORK+'/answers.json')) if os.path.exists(WORK+'/answers.json') else {}
        a.update(s.ans); json.dump(a,open(WORK+'/answers.json','w'),ensure_ascii=False,indent=1)
        print(s.id,'ok',pos)
