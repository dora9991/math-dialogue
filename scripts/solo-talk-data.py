import re, json, sys
# 使い方: python3 scripts/solo-talk-data.py <math-dialogue のルート（talk-g2/ talk-g3/ がある所）> <出力先 src/solo/lectures/talk-data.js>
ROOT=sys.argv[1]
OUT=sys.argv[2]
pref={'seifu':'u1','moji':'u2','hou':'u3','hirei':'u4','heimen':'u5','kukan':'kukan','data':'u7'}
chap_of={'seifu':'1','moji':'2','hou':'3','hirei':'4','heimen':'5','kukan':'6','data':'7'}
lessons={}   # id -> [kind,title]
chapters={'J1':{}, 'J2':{}, 'J3':{}}
s=open(f'{ROOT}/hyojun-navi/data/plan1.js',encoding='utf-8').read()
blocks=re.findall(r"plan\('(\w+)',\s*\[(.*?)\n  \]\);",s,flags=re.S)
acc={}
for k,b in blocks:
    acc.setdefault(k,[]).extend(re.findall(r"\['(.)',\s*'([^']*)',\s*'([^']*)'\]",b))
for k,rows in acc.items():
    ids=[]
    for i,(t,ti,tp) in enumerate(rows,1):
        i_d=f"{pref[k]}-{i:02d}"
        lessons[i_d]=[t,ti]; ids.append(i_d)
    chapters['J1'][chap_of[k]]=ids
for g,fn in [('J2','talk-g2/problems/unit-lessons-g2.json'),('J3','talk-g3/problems/unit-lessons-g3.json')]:
    d=json.load(open(f'{ROOT}/{fn}',encoding='utf-8'))
    for x in d:
        lessons[x['id']]=[x['type'],x['title']]
        ch=re.match(r'g[23]u(\d)-',x['id']).group(1)
        chapters[g].setdefault(ch,[]).append(x['id'])
def js(o): return json.dumps(o,ensure_ascii=False,indent=1)
with open(OUT,'w',encoding='utf-8') as f:
    f.write("""// ============================================================
// talk-data.js — 会話授業（ホー先生とポンタ）の一覧（自動生成。手で直さない）
//
//  元：hyojun-navi/data/plan1.js（中1）／talk-g2・talk-g3 の unit-lessons（中2・中3）
//  TALK_LESSONS … 授業ID → [種類（探・例・遊・練・活・確）, 題名]
//  TALK_CHAPTERS … 学年 → 章の番号 → その章の授業IDの並び（授業の順）
//  章の番号は、中1：1正負 2文字式 3方程式 4比例反比例 5平面図形 6空間図形 7データ／中2・中3：章の順
// ============================================================
""")
    f.write("export const TALK_LESSONS = "+js(lessons)+";\n\n")
    f.write("export const TALK_CHAPTERS = "+js(chapters)+";\n")
print(len(lessons),{g:{c:len(v) for c,v in cs.items()} for g,cs in chapters.items()})
