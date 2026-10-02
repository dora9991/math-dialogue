#!/usr/bin/env python3
"""公開用のフォルダを組み立てて、Cloudflare Pages（math-hyojun）に出す。
使い方: python3 tools/deploy.py            … 組み立てて公開する（PDF も出す。約220MB あるので、回線によっては時間がかかる）
        python3 tools/deploy.py --no-pdf   … PDF を出さない（数MB。すぐ終わる）
        python3 tools/deploy.py --dry      … 組み立てるだけ（場所を表示する）
出すもの：index.html・css・js・data・見本（PDF）。README や tools は出さない。
検索に出ないように、_headers（noindex）と robots.txt をつける。"""
import os, sys, shutil, subprocess, tempfile, html
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
PROJECT = 'math-hyojun'
UNITS = [(1, '正の数・負の数'), (1, '文字と式'), (1, '方程式'), (1, '比例と反比例'), (1, '平面図形'), (1, '空間図形'), (1, 'データの活用'),
         (2, '式の計算'), (2, '連立方程式'), (2, '一次関数'), (2, '平行と合同'), (2, '三角形と四角形'), (2, '確率'), (2, 'データの比較'),
         (3, '式の展開と因数分解'), (3, '平方根'), (3, '二次方程式'), (3, '関数y=ax2'), (3, '相似な図形'), (3, '円'), (3, '三平方の定理'), (3, '標本調査')]
KINDS = [('授業構想と板書計画', ''), ('ワークシート', '_答えつき'), ('演習プリント', '_答えつき'), ('小テスト', '_答えつき')]
HEADERS = """/*
  X-Robots-Tag: noindex, nofollow
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
/js/*
  Cache-Control: no-cache
/css/*
  Cache-Control: no-cache
/data/*
  Cache-Control: no-cache
/*.html
  Cache-Control: no-cache
"""

def pdf_index(dst):
    """見本/index.html（PDF の一覧）をつくる。ないファイルは、線を引いて出す"""
    rows = ''
    for g, name in UNITS:
        cells = ''
        for label, tail in KINDS:
            f = f'{label}_{name}{tail}.pdf'
            cells += f'<td><a href="{html.escape(f)}">{label}</a></td>' if os.path.exists(os.path.join(dst, f)) else '<td>—</td>'
        rows += f'<tr><th>中{g}</th><th class="u">{html.escape(name)}</th>{cells}</tr>\n'
    plan = '年間指導計画_中1〜中3.pdf'
    page = f"""<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>授業ナビ 標準版 — PDF の一覧</title>
<style>body{{font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;margin:0;padding:24px 16px;background:#f6f5f1;color:#1f2933;line-height:1.7}}
main{{max-width:860px;margin:0 auto}}h1{{font-size:22px;margin:0 0 6px}}p{{margin:0 0 16px;font-size:14px}}
.wrap{{overflow-x:auto;background:#fff;border:1px solid #d9d6cc;border-radius:8px}}table{{border-collapse:collapse;width:100%;font-size:14px;white-space:nowrap}}
th,td{{padding:8px 12px;border-bottom:1px solid #ebe8df;text-align:left}}th{{font-weight:600}}th.u{{min-width:10em}}a{{color:#0b5cad}}tr:last-child th,tr:last-child td{{border-bottom:0}}</style></head>
<body><main><h1>授業ナビ 標準版　PDF の一覧</h1>
<p>ワークシート・演習プリント・小テストは、答えつき。<a href="{html.escape(plan)}">年間指導計画（中1〜中3）</a>　／　<a href="../">画面で見る</a></p>
<div class="wrap"><table>{rows}</table></div></main></body></html>"""
    open(os.path.join(dst, 'index.html'), 'w', encoding='utf-8').write(page)

def build(pdf=True):
    out = tempfile.mkdtemp(prefix='hyojun-deploy-')
    shutil.copy(os.path.join(ROOT, 'index.html'), out)
    for d in ('css', 'js', 'data'): shutil.copytree(os.path.join(ROOT, d), os.path.join(out, d))
    open(os.path.join(out, '_headers'), 'w', encoding='utf-8').write(HEADERS)
    open(os.path.join(out, 'robots.txt'), 'w', encoding='utf-8').write('User-agent: *\nDisallow: /\n')
    if not pdf: return out
    src = os.path.join(ROOT, '見本'); dst = os.path.join(out, '見本'); os.makedirs(dst)
    names = {f'{label}_{name}{tail}.pdf' for _, name in UNITS for label, tail in KINDS} | {'年間指導計画_中1〜中3.pdf'}
    for f in sorted(os.listdir(src)):
        if f in names: shutil.copy(os.path.join(src, f), dst)
    pdf_index(dst)
    return out

if __name__ == '__main__':
    out = build('--no-pdf' not in sys.argv)
    n = sum(len(fs) for _, _, fs in os.walk(out))
    print(f'組み立てた: {out}（{n} ファイル）')
    if '--dry' in sys.argv: sys.exit(0)
    r = subprocess.run(['npx', 'wrangler', 'pages', 'deploy', out, '--project-name', PROJECT, '--branch', 'main', '--commit-dirty=true'], cwd=ROOT)
    shutil.rmtree(out, ignore_errors=True)
    sys.exit(r.returncode)
