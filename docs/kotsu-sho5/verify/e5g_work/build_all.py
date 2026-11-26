import json, importlib
import common
for m in ['m1','m2','m3','m4','m5','k1','k2','k3','k4','k5']:
    importlib.import_module(m).build()
json.dump(common.CHK, open(common.E5 + '/out/e5g.chk.json', 'w'), ensure_ascii=False, indent=1)
print(len(common.CHK))
