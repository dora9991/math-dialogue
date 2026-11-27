"""学力推移調査型の類題の目次（suii/index.html）を、各ページから作る。
使い方: python3 suii/tools/build_index.py
  各ページの K3.run の title と、steps の tag（'類題1'〜）・bh（題の名前）を読み、題ごとに #step-N のボタンを作る。"""
import re, os, json, html
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
GRADES = [('中1', '1'), ('中2', '2'), ('中3', '3')]
FIELDS = [('shiki', '数と式'), ('kansu', '関数'), ('zukei', '図形'), ('data', 'データの活用')]
rows = []
for gname, g in GRADES:
    items = []
    if g == '1':   # 中1 データの活用は、データの活用の黒板に 先にある 5題 も ならべる
        items.append({'href': '../katsuyo/', 'page': 'ruidai.html', 'field': 'データの活用（1）', 'title': 'データの活用 類題5題（ヒストグラム・代表値・人数のちがう集団・目的に応じた判断・確率）',
                      'probs': [['1', 'ヒストグラム', 1], ['2', '代表値', 5], ['3', '人数のちがう集団', 9], ['4', '目的に応じた判断', 13], ['5', '確率', 17]]})
    for key, fname in FIELDS:
        f = os.path.join(D, f'{g}-{key}.html')
        if not os.path.exists(f):
            continue
        s = open(f, encoding='utf-8').read()
        m = re.search(r"title:\s*'([^']*)'", s)
        title = m.group(1) if m else ''
        tags = re.findall(r"\{\s*tag:\s*'(類題\d)'(.*?)(?=\{\s*tag:|\]\s*\}\s*\)\s*;)", s, flags=re.S)
        probs, seen = [], set()
        for i, (tg, rest) in enumerate(tags):
            if tg in seen:
                continue
            seen.add(tg)
            bh = re.search(r"bh:\s*'([^']*)'", rest)
            name = bh.group(1) if bh else tg
            name = re.sub(r'^類題\d[\s　]*', '', name)
            probs.append([tg[-1], name, i + 1])
        items.append({'href': '', 'page': f'{g}-{key}.html', 'field': fname + ('（2）' if (g == '1' and key == 'data') else ''),
                      'title': title.replace('学力推移調査型の類題　', ''), 'probs': probs})
    rows.append((gname, items))

def li(it):
    btns = ''.join(f'<a class="btn primary" href="{it["href"]}{it["page"]}#step-{p[2]}">{p[0]} {html.escape(p[1])}</a>' for p in it['probs'])
    return (f'<li class="on"><span class="no">{html.escape(it["field"])}</span><span class="ttl">{html.escape(it["title"])}</span>'
            f'<span class="go">{btns}</span></li>')

body = ''.join(f'<h2>{g}</h2><ul class="list">' + ''.join(li(it) for it in items) + '</ul>' for g, items in rows)
n = sum(len(it['probs']) for _, items in rows for it in items)
out = f'''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>学力推移調査型の類題</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Klee+One:wght@400;600&display=swap">
<link rel="stylesheet" href="../kukan/css/board.css">
<style>
/* 目次：学年ごとに、分野のページと、題ごとのボタン */
html,body{{height:auto}}
.app{{height:auto;min-height:100%}}
.menu{{padding:.4rem 1.4rem 1.4rem;display:flex;flex-direction:column;gap:.9rem}}
.menu p.lead{{margin:0;font-family:var(--f-chalk);font-weight:600;color:var(--chalk-2);font-size:1.05rem;line-height:1.6}}
.menu h2{{margin:.6rem 0 0;font-family:var(--f-chalk);font-size:1.35rem;color:var(--chalk-1, #f2f0e6)}}
.list{{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,26rem),1fr));gap:.6rem}}
.list li{{display:flex;flex-direction:column;gap:.3rem;padding:.65rem .9rem;border:2px solid var(--chalk-4);border-radius:12px;min-width:0}}
.list li.on{{border-color:var(--chalk-3);background:rgba(242,240,230,.05)}}
.list .no{{font-family:var(--f-chalk);font-weight:600;font-size:.9rem;color:var(--chalk-2)}}
.list .ttl{{font-family:var(--f-chalk);font-weight:600;font-size:1.1rem;line-height:1.45}}
.list .go{{display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.15rem}}
</style>
</head>
<body>
<div class="app" lang="ja">
  <div class="board">
    <header class="bar"><h1><small>中1〜中3</small>学力推移調査型の類題（目次）</h1><a class="btn" href="../kokuban/index.html">総目次</a></header>
    <div class="track" aria-hidden="true"></div>
    <main class="menu">
      <p class="lead">学力推移調査でよく出る形の問題を、学年・分野ごとに {n}題。場面と数値はすべて自作。1題＝問題（図と小問）→ 小問ごとの答え。説明する小問は、お手本の文を出します。</p>
      {body}
    </main>
  </div>
</div>
</body>
</html>
'''
open(os.path.join(D, 'index.html'), 'w', encoding='utf-8').write(out)
print('ok', n, '題', json.dumps([(g, [(it['page'], len(it['probs'])) for it in items]) for g, items in rows], ensure_ascii=False))
