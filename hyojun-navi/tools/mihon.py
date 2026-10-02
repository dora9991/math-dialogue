#!/usr/bin/env python3
"""単元の見本PDF（授業構想と板書計画・ワークシート・演習プリント・小テスト）を 見本/ に書き出す。
使い方: python3 tools/mihon.py hou 方程式"""
import subprocess, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
key, name = sys.argv[1], sys.argv[2]
for route, label in ((f'#/cards/{key}', '授業構想と板書計画'), (f'#/wsprint/{key}/ans', 'ワークシート'), (f'#/drprint/{key}/ans', '演習プリント'), (f'#/qzprint/{key}/ans', '小テスト')):
    out = os.path.join(ROOT, '見本', f'{label}_{name}' + ('' if label.startswith('授業') else '_答えつき') + '.pdf')
    r = subprocess.run([sys.executable, os.path.join(HERE, 'hc.py'), 'pdf', route, out], capture_output=True, text=True)
    print((r.stdout.strip().splitlines() or [r.stderr.strip()])[-1])
