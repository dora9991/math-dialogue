"""この教材と、作者の手元の資料（指導書などを読んで、授業準備用にまとめたもの。公開していない）とで、同じ文字のならびがどれだけあるかを数える。
本の文や場面に、にてしまっているところがないかの確かめ。
相手の中身は表示せず、重なった部分（この教材の側の文字列）だけを出す。
使い方: python3 tools/overlap.py <単元> [長さ=14] [一覧に出す長さ=20]
くらべる相手は tools/overlap.local.json に書く（git には入れない）:
  { "dir": "くらべる相手の data フォルダ", "common": "単元に関係なく読むファイル名の正規表現", "own": "相手の中で、作者が自分で書いた問題のファイル名の正規表現" }"""
import re, sys, glob, os, json
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
cfg_path = os.path.join(HERE, 'overlap.local.json')
if not os.path.exists(cfg_path): sys.exit('tools/overlap.local.json がない（くらべる相手の場所を書く。上の説明を見る）')
cfg = json.load(open(cfg_path, encoding='utf-8'))
their_dir = os.path.normpath(os.path.join(HERE, cfg['dir'])); common = cfg.get('common') or r'^$'; own = cfg.get('own') or r'^$'
key = sys.argv[1]; N = int(sys.argv[2]) if len(sys.argv) > 2 else 14
def strings(path):
    s = open(path, encoding='utf-8').read()
    out = re.findall(r"'((?:[^'\\]|\\.)*)'", s) + re.findall(r'"((?:[^"\\]|\\.)*)"', s) + re.findall(r'`((?:[^`\\]|\\.)*)`', s)
    return [re.sub(r'[\s　、。，．・「」（）()\[\]{}|\\n]+', '', x) for x in out]
def grams(files):
    g = {}
    for f in files:
        for x in strings(f):
            for i in range(len(x) - N + 1):
                t = x[i:i + N]
                if re.search(r'[ぁ-んァ-ヶ一-龥]{4}', t): g.setdefault(t, os.path.basename(f))
    return g
mine = glob.glob(f'{ROOT}/data/*_{key}*.js')
theirs = [f for f in glob.glob(f'{their_dir}/*.js') if re.search(rf'_{key}', os.path.basename(f)) or re.match(common, os.path.basename(f))]
a, b = grams(mine), grams(theirs)
runs = {}
for f in mine:
    for x in strings(f):
        i = 0
        while i <= len(x) - N:
            if x[i:i + N] in b:
                j = i
                while j <= len(x) - N and x[j:j + N] in b: j += 1
                run = x[i:j + N - 1]; runs.setdefault(run, (os.path.basename(f), b[x[i:i + N]])); i = j + N - 1
            else: i += 1
MIN = int(sys.argv[3]) if len(sys.argv) > 3 else 20
big = sorted([r for r in runs if len(r) >= MIN], key=len, reverse=True)
print(f'この教材 {len(mine)} ファイル／相手 {len(theirs)} ファイル　{N}文字以上つづけて同じ部分 {len(runs)} か所、うち {MIN}文字以上 {len(big)} か所')
print('相手のファイル別:', dict(Counter(runs[r][1] for r in runs)))
for r in big[:70]: print(len(r), runs[r][0], '←', runs[r][1], '|', r)
print('--- 相手のうち、本をもとにまとめたファイルに当たったもの（ここに、場面・数値・発問が出たら、差しかえる） ---')
for r in sorted(runs, key=len, reverse=True):
    if not re.match(own, runs[r][1]): print(len(r), runs[r][0], '←', runs[r][1], '|', r)
