import json, bun, bun2, tani
calc = {}
for m in (bun, bun2, tani): calc.update(m.CALC)
json.dump(calc, open('/tmp/claude-0/-home-user-math-dialogue/a60e1d88-6e51-5ede-b878-141b35b0a075/scratchpad/e5e_work/answers.json','w'), ensure_ascii=False, indent=1)
print(len(calc))
