import g1, g2, g3, g4
from lib import CALC
import json
json.dump(CALC, open('calc_all.json','w'), ensure_ascii=False, indent=0)
print(len(CALC))
