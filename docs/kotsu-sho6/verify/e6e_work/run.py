import json, os, sys
from common import *
import hirei, baai
OUT = '/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6/out/e6e'
idx = {t['id']: t for t in json.load(open('/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6/in/index.json'))}
fns = [('hirei-01', hirei.hirei01), ('hirei-02', hirei.hirei02), ('hirei-03', hirei.hirei03), ('hirei-04', hirei.hirei04), ('hirei-05', hirei.hirei05),
       ('baai-01', baai.baai01), ('baai-02', baai.baai02), ('baai-03', baai.baai03), ('baai-04', baai.baai04), ('baai-05', baai.baai05)]
allans = []
for i, (lid, fn) in enumerate(fns):
    t = idx[lid]
    items, ans = build(lid, t['code'], t['no'], fn(), 6000 + i * 7)
    json.dump(items, open(f'{OUT}/{lid}.json', 'w'), ensure_ascii=False, indent=1)
    allans += ans
json.dump(allans, open('/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e6e_work/answers.json', 'w'), ensure_ascii=False, indent=1)
print('ok', len(allans))
