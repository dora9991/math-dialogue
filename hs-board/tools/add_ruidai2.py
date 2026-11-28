"""入試の類題②（scenes/<元のID>b.js）を、目次の一覧 js/lessons.js に足す。
使い方: python3 hs-board/tools/add_ruidai2.py <ID>b [<ID>b …]
  元の ID の行のすぐ下に、同じ course・chapter・group・field・time・tags で、題名だけ台本（HB.lesson の title）のものを入れる。
  すでに入っている ID は とばす。台本ファイルがない ID は エラー。"""
import sys, os, re
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
p = os.path.join(H, 'js', 'lessons.js')
s = open(p, encoding='utf-8').read()
added = []
for nid in sys.argv[1:]:
    assert nid.endswith('b'), nid
    oid = nid[:-1]
    if f"'id': '{nid}'" in s:
        continue
    f = os.path.join(H, 'scenes', nid + '.js')
    sc = open(f, encoding='utf-8').read()
    m = re.search(r"title:\s*'([^']*)'", sc)
    assert m, nid
    title = m.group(1)
    lines = s.split('\n')
    idx = [i for i, l in enumerate(lines) if f"'id': '{oid}'" in l]
    assert len(idx) == 1, (oid, idx)
    old = lines[idx[0]]
    new = old.replace(f"'id': '{oid}'", f"'id': '{nid}'", 1)
    new = re.sub(r"'title': '[^']*'", "'title': '" + title.replace('\\', '\\\\') + "'", new, count=1)
    assert new != old
    lines.insert(idx[0] + 1, new)
    s = '\n'.join(lines)
    added.append(nid)
open(p, 'w', encoding='utf-8').write(s)
print('added', len(added), ' '.join(added))
