#!/usr/bin/env python3
"""e2b 確かめ：全問「問題 → 計算した答え」を一覧にし、正解の選択肢と突き合わせる。
  1. 作った ときの 計算値(meta) と 正解の 選択肢が 一致（まちがいは 一致しない）
  2. 文中の「a ± b ＝ c」が 計算として 正しい（q・e・正解）
  3. 長さ：選択肢を mm に 直して 4つが ちがう こと／図（ものさし・ブロック）から 読んだ 数と 比べる
  4. ひき算・長さ計算を 問題文から 独立に 計算して 正解と 比べる
"""
import json, re, glob, os, sys
HERE=os.path.dirname(os.path.abspath(__file__))
WORK='/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e2b_work'
LESSONS=['hihiku-01','hihiku-02','hihiku-03','hihiku-04','hihiku-05','nagasa-01','nagasa-02','nagasa-03','nagasa-04']
bad=0
def NG(id,m):
    global bad; bad+=1; print('  NG',id,m)
def num(s): return int(s)
def mm_of(t):
    t=t.replace(' ','')
    m=re.fullmatch(r'(?:(\d+)cm)?(?:(\d+)mm)?',t)
    if m and (m.group(1) or m.group(2)): return int(m.group(1) or 0)*10+int(m.group(2) or 0)
def eq_check(id,text,where):
    for m in re.finditer(r'(?<![\d+−])((?:\d+\s*[+−]\s*)+\d+)\s*[＝=]\s*(\d+)',text):
        toks=re.findall(r'[+−]|\d+',m[1]); v=int(toks[0]); i=1
        while i<len(toks):
            v=v+int(toks[i+1]) if toks[i]=='+' else v-int(toks[i+1]); i+=2
        if v!=int(m[2]): NG(id,f'{where}: {m[1]}＝{m[2]} は {v}')
def fig_read(f):
    if not f: return None
    if 'aria-label="ものさし"' in f:
        r={}
        m=re.search(r'y="14" width="([\d.]+)"',f)
        if m: r['tape']=round(float(m.group(1))/3.2)
        m=re.search(r'<path d="M([\d.]+) 36',f)
        if m: r['arrow']=round((float(m.group(1))-16)/3.2)
        return r
    if 'aria-label="ブロック"' in f:
        t=len(re.findall(r'width="8" height="60"',f)); o=len(re.findall(r'width="7" height="7"',f)); h=len(re.findall(r'width="60" height="60"',f))
        return {'blocks':h*100+t*10+o}
for lid in LESSONS:
    items=json.load(open(f'{HERE}/e2b/{lid}.json')); meta={m['id']:m for m in json.load(open(f'{WORK}/meta-{lid}.json'))}
    print('=====',lid,len(items))
    for it in items:
        id=it['id']; ks=[c for c in it['c'] if c.get('k')==1]
        if len(ks)!=1: NG(id,'正解が1つでない'); continue
        ans=ks[0]['t']; mt=meta[id]
        if ans!=mt['ans']: NG(id,f'meta と 正解が ちがう {ans} / {mt["ans"]}')
        if ans in [c['t'] for c in it['c'] if c.get('k')!=1]: NG(id,'まちがいが 正解と 同じ')
        calc=mt['calc']
        # 数値の 計算値と 正解の 数が 一致（数値の とき）
        if re.fullmatch(r'\d+',calc):
            a_mm=mm_of(ans)
            if re.fullmatch(r'\d+cm',ans): a_mm=int(ans[:-2])*10; calc=str(int(calc)*10)
            if a_mm is not None:
                if a_mm!=int(calc): NG(id,f'計算値 {calc}mm と 正解 {ans} が ちがう')
            elif re.fullmatch(r'\d+\D{0,4}',ans):
                if int(re.match(r'\d+',ans)[0])!=int(calc): NG(id,f'計算値 {calc} と 正解 {ans} が ちがう')
        # 文中の 式
        eq_check(id,it['q'],'q'); eq_check(id,it['e'],'e'); eq_check(id,ans,'ans')
        # 長さ 4つが ちがう
        ms=[mm_of(c['t']) for c in it['c']]
        if all(x is not None for x in ms) and len(set(ms))!=4: NG(id,f'長さが 重なる {ms}')
        # 独立 計算：「A − B を ひっ算」「A − B を すると」
        q=it['q']; indep=None
        m=re.search(r'ひっ算で (\d+) − (\d+) を(?: します。[^。]*答えは いくつですか| すると、答えは いくつですか)',q) or re.fullmatch(r'ひっ算で (\d+) − (\d+) を すると、答えは いくつですか。',q)
        if m and 'すると' in q: indep=str(int(m[1])-int(m[2]))
        m=re.fullmatch(r'ひっ算で (\d+) − (\d+) を します。[^。]*答えは.*',q)
        m2=re.fullmatch(r'(\d+) − (\d+) ＝ (\d+) です。たしかめの (\d+) \+ (\d+) の 答えは いくつですか。',q)
        if m2:
            if int(m2[1])-int(m2[2])!=int(m2[3]): NG(id,'q の ひき算が まちがい')
            indep=str(int(m2[4])+int(m2[5]))
        m3=re.fullmatch(r'(\d+)cm (\d+)mm の テープと (\d+)cm (\d+)mm の テープを つなぎます。.*',q.replace('\n',''))
        if m3: indep=F=f'{int(m3[1])*10+int(m3[2])+int(m3[3])*10+int(m3[4])}mm'
        m4=re.fullmatch(r'(\d+)cm (\d+)mm ([+−]) (\d+)cm (\d+)mm は 何cm 何mm ですか。',q)
        if m4:
            a=int(m4[1])*10+int(m4[2]); b=int(m4[4])*10+int(m4[5]); indep=f'{a+b if m4[3]=="+" else a-b}mm'
        m5=re.fullmatch(r'(\d+)cm (\d+)mm − (\d+)cm は 何cm 何mm ですか。',q)
        if m5: indep=f'{int(m5[1])*10+int(m5[2])-int(m5[3])*10}mm'
        m6=re.fullmatch(r'(\d+)cm (\d+)mm の リボンから (\d+)cm を きります。.*',q)
        if m6: indep=f'{int(m6[1])*10+int(m6[2])-int(m6[3])*10}mm'
        if indep is not None:
            if indep.endswith('mm') and mm_of(ans) is not None:
                if mm_of(ans)!=int(indep[:-2]): NG(id,f'独立計算 {indep} と 正解 {ans} が ちがう')
            elif re.search(r'\d+',ans) and re.search(r'(?<!\d)'+indep+r'(?!\d)',ans) is None: NG(id,f'独立計算 {indep} と 正解 {ans} が ちがう')
        fr=fig_read(it.get('f'))
        extra=''
        if fr:
            extra=f' [図 {fr}]'
            a=mm_of(ans)
            if 'ものさし' in (it.get('f') or '') and a is not None and 'tape' in fr and 'テープ' in q+it['e'] or ('ひも' in q and 'tape' in (fr or {})):
                if a is not None and fr.get('tape') is not None and re.search(r'図',q) and not re.search(r'あと|ちょうど|つなぎ|2本',q):
                    if fr['tape']!=a: NG(id,f'図 {fr} と 正解 {a}mm が ちがう')
            if fr.get('arrow') is not None and a is not None and '▼の ところは' in q and 'mm ですか' in q and fr['arrow']!=a: NG(id,'図 と 正解 ちがう')
            if fr.get('arrow') is not None and a is not None and '何cm 何mm' in q and '▼' in q and fr['arrow']!=a: NG(id,f'図 {fr} と 正解 {a}')
            if 'blocks' in fr and '何こですか' in q and f"{fr['blocks']}こ"!=ans and 'とります' not in q and 'たべます' not in q: NG(id,f'ブロック {fr} と 正解 {ans}')
        print(f'{id}  {q.replace(chr(10)," ")[:70]}  → {ans}{extra}')
print('\nNG',bad)
sys.exit(1 if bad else 0)
