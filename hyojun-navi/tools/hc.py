#!/usr/bin/env python3
"""画面を出さない Chrome で、見た目の検査・画面の写真・PDF をつくる（開発用。サーバーはいらない）。
使い方:
  python3 tools/hc.py check '^seifu-'            … ワークシート・演習プリント・小テスト・スライドの、行あふれ／はみ出し／図の字の重なりを調べる
  python3 tools/hc.py check '^seifu-' ws dr      … 種類をしぼる（ws・dr・qz・sl）
  python3 tools/hc.py shot '#/plan' out.png [幅 高さ]      … 画面の写真
  python3 tools/hc.py pdf '#/wsprint/seifu/ans' out.pdf   … 印刷イメージ（PDF）
  python3 tools/hc.py sheet '^seifu-0[1-4]' dr out.png    … 何枚かをならべた一覧の写真（ws・dr・qz・sl、答えつき）
  python3 tools/hc.py run '#/ws/hirei-03' 'JSのコード' [out.png 幅 高さ]   … 画面を開いてから JS を動かす（操作の確かめ）。
        コードの中で return した値を表示する。await が使える。待つときは await sleep(ミリ秒)
"""
import json, os, re, subprocess, sys, tempfile, time, html as H

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

def scripts():
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    return [m for m in re.findall(r'<script src="([^"]+)"', src)]

def run(args, timeout=240, want=None):
    """Chrome は自分で終わらないことがあるので、できあがり（ファイル、または書き出しの終わり）を見てから止める。want＝できるはずのファイル"""
    prof = tempfile.mkdtemp(prefix='hc-'); log = os.path.join(prof, 'stdout.txt')
    cmd = [CHROME, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--allow-file-access-from-files', f'--user-data-dir={prof}'] + args
    if want and os.path.exists(want): os.remove(want)
    with open(log, 'w') as fh:
        pr = subprocess.Popen(cmd, stdout=fh, stderr=subprocess.DEVNULL)
        t0 = time.time(); last = -1; out = ''
        while time.time() - t0 < timeout:
            time.sleep(0.5)
            if pr.poll() is not None: break
            if want:
                if os.path.exists(want):
                    sz = os.path.getsize(want)
                    if sz > 0 and sz == last: break
                    last = sz
            else:
                out = open(log, encoding='utf-8', errors='ignore').read()
                if '</html>' in out: break
        if pr.poll() is None:
            pr.terminate()
            try: pr.wait(5)
            except Exception: pr.kill()
    out = open(log, encoding='utf-8', errors='ignore').read()
    subprocess.run(['rm', '-rf', prof])
    return out

def page(body_js, extra_head=''):
    tags = '\n'.join(f'<script src="../{s}"></script>' for s in scripts() if not s.endswith('app.js'))
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>run</title>
<link rel="stylesheet" href="../css/app.css"><link rel="stylesheet" href="../css/ws.css"><link rel="stylesheet" href="../css/slides.css"><link rel="stylesheet" href="../css/hyojun.css">{extra_head}</head>
<body><div id="stage"></div><pre id="out"></pre>
{tags}
<script src="wscheck.js"></script><script src="slcheck.js"></script>
<script>(async () => {{ try {{ {body_js} }} catch (e) {{ document.getElementById('out').textContent = JSON.stringify({{ error: String(e && e.stack || e) }}); }} document.title = 'done'; }})();</script>
</body></html>'''

def check(rx, kinds):
    js = f'''
      const re = new RegExp({json.dumps(rx)}), kinds = {json.dumps(kinds)}, res = {{}};
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      for (const k of kinds) {{
        if (k === 'sl') {{ const r = await slChk(re, {{}}); const c = await slChk(re, {{ mode: 'core' }}); res.sl = {{ lessons: r.lessons, slides: r.slides, avg: r.avg, fs: r.fs, empty: r.empty, over: r.over, small: r.small, wide: r.wide, clip: r.clip, lap: r.lap, core: {{ slides: c.slides, over: c.over, wide: c.wide, clip: c.clip, lap: c.lap, empty: c.empty }} }}; }}
        else res[k] = await wsChk(re, {{ kind: k, tight: true, base: true }});
      }}
      document.getElementById('out').textContent = JSON.stringify(res);'''
    p = os.path.join(HERE, '_run.html')
    open(p, 'w', encoding='utf-8').write(page(js))
    out = run(['--dump-dom', '--virtual-time-budget=120000', 'file://' + p])
    m = re.search(r'<pre id="out">(.*?)</pre>', out, re.S)
    if not m or not m.group(1).strip(): print('結果が読めない'); print(out[-600:]); sys.exit(2)
    res = json.loads(H.unescape(m.group(1)))
    if 'error' in res: print('エラー:', res['error']); sys.exit(2)
    bad = 0
    for k, r in res.items():
        if k == 'sl':
            n = len(r['over']) + len(r['wide']) + len(r['clip']) + len(r['lap']) + len(r['empty']) + len(r['core']['over']) + len(r['core']['wide']) + len(r['core']['clip']) + len(r['core']['lap'])
            bad += n
            print(f"[sl] {r['lessons']}時間・{r['slides']}枚（平均{r['avg']}）　字の大きさ {r['fs']}　板書用 {r['core']['slides']}枚　指摘 {n}")
            for key in ('empty', 'over', 'wide', 'clip', 'lap'):
                for x in r[key]: print(f'   {key}: {x}')
                for x in r['core'].get(key, []): print(f'   core {key}: {x}')
            if r['small']: print('   small:', ' '.join(r['small'][:30]))
        else:
            n = sum(len(r[key]) for key in ('rows', 'txt', 'clip', 'lap', 'tight'))
            bad += n
            print(f"[{k}] {r['n']}枚　指摘 {n}")
            if '--base' in sys.argv: print('   行（もと→配分後）:', r.get('base'))
            for key in ('rows', 'txt', 'clip', 'lap', 'tight'):
                for x in r[key]: print(f'   {key}: {x}')
    sys.exit(1 if bad else 0)

def sheet(rx, kind, out, zoom=0.5):
    if kind == 'sl':
        js = f'''
      const re = new RegExp({json.dumps(rx)}), st = document.getElementById('stage'); st.className = 'sl-all';
      for (const id of LDB.lessons.map(l => l.id).filter(id => re.test(id))) {{
        const d = await SLX.deck(id, 'full');
        d.slides.forEach((s, i) => {{ const c = document.createElement('div'); c.className = 'cell'; c.innerHTML = s.html; st.appendChild(c); }});
      }}'''
        head = '<style>body{margin:8px;background:#d9d7d0}#stage{display:flex;flex-wrap:wrap;gap:6px}.cell{position:relative;width:400px;height:225px;overflow:hidden;background:#fff}.cell .sl-slide{position:absolute;left:0;top:0;transform:scale(.25);transform-origin:0 0}#out{display:none}</style>'
    else:
        js = f'''
      const re = new RegExp({json.dumps(rx)}), st = document.getElementById('stage'), kind = {json.dumps(kind)}; st.className = 'ans-on';
      const src = kind === 'dr' ? LDB.drills : kind === 'qz' ? LDB.quizzes : LDB.worksheets;
      let h = '';
      for (const id of Object.keys(src).filter(k => re.test(k))) {{ const ld = await WSX.load(id, kind); h += WSX.pagesHTML(ld.sheet, LDB.lessons.find(x => x.id === id)); }}
      st.innerHTML = h;'''
        head = f'<style>body{{margin:8px;background:#d9d7d0}}#stage{{display:flex;flex-wrap:wrap;gap:8px;zoom:{zoom}}}#stage .wsp{{position:relative;background:#fff;flex:none}}#out{{display:none}}</style>'
    p = os.path.join(HERE, '_run.html')
    open(p, 'w', encoding='utf-8').write(page(js, head))
    return p

def app_page(hash_, code):
    """index.html と同じ画面を tools/ の下につくり、開いたあとで code を動かす"""
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    src = re.sub(r'(href|src)="((?:css|js|data)/)', r'\1="../\2', src)
    extra = f"""<pre id="hcout" style="display:none"></pre><script>(async () => {{ const sleep = ms => new Promise(r => setTimeout(r, ms));
      location.hash = {json.dumps(hash_)}; await sleep(900);
      let res; try {{ res = await (async () => {{ {code} }})(); }} catch (e) {{ res = {{ error: String(e && e.stack || e) }}; }}
      document.getElementById('hcout').textContent = JSON.stringify(res === undefined ? null : res); document.title = 'done'; }})();</script></body>"""
    src = src.replace('</body>', extra)
    p = os.path.join(HERE, '_app.html'); open(p, 'w', encoding='utf-8').write(src); return p

def main():
    a = sys.argv[1:]
    if not a: print(__doc__); return
    if a[0] == 'check':
        check(a[1], [x for x in a[2:] if not x.startswith('--')] or ['ws', 'dr', 'qz', 'sl'])
    elif a[0] == 'shot':
        w, h = (a[3], a[4]) if len(a) > 4 else ('1400', '1800')
        url = 'file://' + os.path.join(ROOT, 'index.html') + a[1]
        run([f'--screenshot={os.path.abspath(a[2])}', f'--window-size={w},{h}', '--virtual-time-budget=20000', url], want=os.path.abspath(a[2]))
        print(a[2], os.path.getsize(a[2]) if os.path.exists(a[2]) else 'できなかった')
    elif a[0] == 'pdf':
        url = 'file://' + os.path.join(ROOT, 'index.html') + a[1]
        run([f'--print-to-pdf={os.path.abspath(a[2])}', '--no-pdf-header-footer', '--virtual-time-budget=60000', url], timeout=400, want=os.path.abspath(a[2]))
        print(a[2], os.path.getsize(a[2]) if os.path.exists(a[2]) else 'できなかった')
    elif a[0] == 'run':
        p = app_page(a[1], a[2])
        out = run(['--dump-dom', '--virtual-time-budget=30000', '--window-size=1600,1000', 'file://' + p])
        m = re.search(r'<pre id="hcout"[^>]*>(.*?)</pre>', out, re.S)
        print(H.unescape(m.group(1)) if m else '結果が読めない\n' + out[-400:])
        if len(a) > 3:
            w, h = (a[4], a[5]) if len(a) > 5 else ('1600', '1000')
            run([f'--screenshot={os.path.abspath(a[3])}', f'--window-size={w},{h}', '--virtual-time-budget=30000', 'file://' + p], want=os.path.abspath(a[3]))
            print(a[3], os.path.getsize(a[3]) if os.path.exists(a[3]) else 'できなかった')
    elif a[0] == 'sheet':
        kind = a[2]; out = a[3]
        w, h = (a[4], a[5]) if len(a) > 5 else ('1700', '1250')
        p = sheet(a[1], kind, out, float(a[6]) if len(a) > 6 else 0.5)
        run([f'--screenshot={os.path.abspath(out)}', f'--window-size={w},{h}', '--virtual-time-budget=60000', 'file://' + p], want=os.path.abspath(out))
        print(out, os.path.getsize(out) if os.path.exists(out) else 'できなかった')

if __name__ == '__main__': main()
