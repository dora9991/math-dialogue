# 使い方: python3 e1/out/e1d.verify.py   （e1 フォルダの out/e1d.json を、計算で たしかめる）
import json, re, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
KEYS = json.loads(r'''{
"tashi-01-L1-01": {
"k": "num",
"expr": "10-9",
"ans": 1,
"fig": 9
},
"tashi-01-L1-02": {
"k": "num",
"expr": "10-8",
"ans": 2,
"fig": null
},
"tashi-01-L1-03": {
"k": "num",
"expr": "4-1",
"ans": 3,
"fig": null
},
"tashi-01-L1-04": {
"k": "num",
"expr": "10+3",
"ans": 13,
"fig": null
},
"tashi-01-L1-05": {
"k": "num",
"expr": "9+4",
"ans": 13,
"fig": 13
},
"tashi-01-L2-01": {
"k": "num",
"expr": "9+3",
"ans": 12,
"fig": null
},
"tashi-01-L2-02": {
"k": "num",
"expr": "6-1",
"ans": 5,
"fig": null
},
"tashi-01-L2-03": {
"k": "num",
"expr": "9+5",
"ans": 14,
"fig": null
},
"tashi-01-L2-04": {
"k": "num",
"expr": "9+4",
"ans": 13,
"fig": null
},
"tashi-01-L2-05": {
"k": "num",
"expr": "5-1",
"ans": 4,
"fig": null
},
"tashi-01-L3-01": {
"k": "num",
"expr": "9+6",
"ans": 15,
"fig": null
},
"tashi-01-L3-02": {
"k": "method",
"ans": 13
},
"tashi-01-L3-03": {
"k": "num",
"expr": "5-1",
"ans": 4,
"fig": null
},
"tashi-01-L3-04": {
"k": "num",
"expr": "9+5",
"ans": 14,
"fig": null
},
"tashi-01-L3-05": {
"k": "same",
"target": "9+6"
},
"tashi-01-L4-01": {
"k": "num",
"expr": "13-4",
"ans": 9,
"fig": null
},
"tashi-01-L4-02": {
"k": "num",
"expr": "12-9",
"ans": 3,
"fig": null
},
"tashi-01-L4-03": {
"k": "num",
"expr": "9+6",
"ans": 15,
"fig": null
},
"tashi-01-L4-04": {
"k": "manual",
"note": "9+6=15, 10と5で15"
},
"tashi-01-L4-05": {
"k": "num",
"expr": "17-9",
"ans": 8,
"fig": null
},
"tashi-02-L1-01": {
"k": "num",
"expr": "9+2",
"ans": 11,
"fig": 11
},
"tashi-02-L1-02": {
"k": "num",
"expr": "10-9",
"ans": 1,
"fig": null
},
"tashi-02-L1-03": {
"k": "num",
"expr": "10+4",
"ans": 14,
"fig": null
},
"tashi-02-L1-04": {
"k": "num",
"expr": "9+7",
"ans": 16,
"fig": null
},
"tashi-02-L1-05": {
"k": "num",
"expr": "8-1",
"ans": 7,
"fig": null
},
"tashi-02-L2-01": {
"k": "num",
"expr": "9+2",
"ans": 11,
"fig": null
},
"tashi-02-L2-02": {
"k": "num",
"expr": "9+8",
"ans": 17,
"fig": null
},
"tashi-02-L2-03": {
"k": "num",
"expr": "9+6",
"ans": 15,
"fig": null
},
"tashi-02-L2-04": {
"k": "num",
"expr": "10+2",
"ans": 12,
"fig": null
},
"tashi-02-L2-05": {
"k": "num",
"expr": "7-1",
"ans": 6,
"fig": null
},
"tashi-02-L3-01": {
"k": "num",
"expr": "9+7",
"ans": 16,
"fig": null
},
"tashi-02-L3-02": {
"k": "num",
"expr": "9+8",
"ans": 17,
"fig": null
},
"tashi-02-L3-03": {
"k": "method",
"ans": 15
},
"tashi-02-L3-04": {
"k": "eqtarget",
"target": 14
},
"tashi-02-L3-05": {
"k": "same",
"target": "9+3"
},
"tashi-02-L4-01": {
"k": "num",
"expr": "14-9",
"ans": 5,
"fig": null
},
"tashi-02-L4-02": {
"k": "manual",
"note": "9+3=12,9+4=13"
},
"tashi-02-L4-03": {
"k": "num",
"expr": "9+9",
"ans": 18,
"fig": null
},
"tashi-02-L4-04": {
"k": "num",
"expr": "9+7",
"ans": 16,
"fig": null
},
"tashi-02-L4-05": {
"k": "num",
"expr": "17-9",
"ans": 8,
"fig": null
},
"tashi-03-L1-01": {
"k": "num",
"expr": "10-8",
"ans": 2,
"fig": 8
},
"tashi-03-L1-02": {
"k": "num",
"expr": "10-7",
"ans": 3,
"fig": 7
},
"tashi-03-L1-03": {
"k": "num",
"expr": "5-2",
"ans": 3,
"fig": null
},
"tashi-03-L1-04": {
"k": "num",
"expr": "8+4",
"ans": 12,
"fig": 12
},
"tashi-03-L1-05": {
"k": "num",
"expr": "5-3",
"ans": 2,
"fig": null
},
"tashi-03-L2-01": {
"k": "num",
"expr": "8+3",
"ans": 11,
"fig": null
},
"tashi-03-L2-02": {
"k": "num",
"expr": "8+6",
"ans": 14,
"fig": null
},
"tashi-03-L2-03": {
"k": "num",
"expr": "7+4",
"ans": 11,
"fig": null
},
"tashi-03-L2-04": {
"k": "num",
"expr": "7+6",
"ans": 13,
"fig": null
},
"tashi-03-L2-05": {
"k": "num",
"expr": "8+7",
"ans": 15,
"fig": null
},
"tashi-03-L3-01": {
"k": "num",
"expr": "8+5",
"ans": 13,
"fig": null
},
"tashi-03-L3-02": {
"k": "manual",
"note": "8+3=11 wrong; 8+5=13"
},
"tashi-03-L3-03": {
"k": "method",
"ans": 13
},
"tashi-03-L3-04": {
"k": "num",
"expr": "7+8",
"ans": 15,
"fig": null
},
"tashi-03-L3-05": {
"k": "same",
"target": "8+6"
},
"tashi-03-L4-01": {
"k": "num",
"expr": "13-8",
"ans": 5,
"fig": null
},
"tashi-03-L4-02": {
"k": "num",
"expr": "13-6",
"ans": 7,
"fig": null
},
"tashi-03-L4-03": {
"k": "num",
"expr": "7+7",
"ans": 14,
"fig": null
},
"tashi-03-L4-04": {
"k": "cmp",
"a": "8+5",
"b": "7+6"
},
"tashi-03-L4-05": {
"k": "num",
"expr": "15-7",
"ans": 8,
"fig": null
},
"tashi-04-L1-01": {
"k": "num",
"expr": "3+9",
"ans": 12,
"fig": 12
},
"tashi-04-L1-02": {
"k": "num",
"expr": "3-1",
"ans": 2,
"fig": null
},
"tashi-04-L1-03": {
"k": "num",
"expr": "10-9",
"ans": 1,
"fig": null
},
"tashi-04-L1-04": {
"k": "num",
"expr": "10+2",
"ans": 12,
"fig": null
},
"tashi-04-L1-05": {
"k": "num",
"expr": "4-1",
"ans": 3,
"fig": null
},
"tashi-04-L2-01": {
"k": "num",
"expr": "4+9",
"ans": 13,
"fig": null
},
"tashi-04-L2-02": {
"k": "num",
"expr": "3+8",
"ans": 11,
"fig": null
},
"tashi-04-L2-03": {
"k": "num",
"expr": "6-2",
"ans": 4,
"fig": null
},
"tashi-04-L2-04": {
"k": "num",
"expr": "2+9",
"ans": 11,
"fig": null
},
"tashi-04-L2-05": {
"k": "num",
"expr": "5+7",
"ans": 12,
"fig": null
},
"tashi-04-L3-01": {
"k": "num",
"expr": "3+9",
"ans": 12,
"fig": null
},
"tashi-04-L3-02": {
"k": "method",
"ans": 13
},
"tashi-04-L3-03": {
"k": "same",
"target": "3+8"
},
"tashi-04-L3-04": {
"k": "num",
"expr": "4+8",
"ans": 12,
"fig": null
},
"tashi-04-L3-05": {
"k": "num",
"expr": "10+3",
"ans": 13,
"fig": null
},
"tashi-04-L4-01": {
"k": "num",
"expr": "12-9",
"ans": 3,
"fig": null
},
"tashi-04-L4-02": {
"k": "diff",
"a": "4+9",
"b": "3+9",
"ans": 1
},
"tashi-04-L4-03": {
"k": "num",
"expr": "12-8",
"ans": 4,
"fig": null
},
"tashi-04-L4-04": {
"k": "manual",
"note": "4+8=12 both ways"
},
"tashi-04-L4-05": {
"k": "num",
"expr": "12-3",
"ans": 9,
"fig": null
},
"tashi-05-L1-01": {
"k": "num",
"expr": "8+6",
"ans": 14,
"fig": null
},
"tashi-05-L1-02": {
"k": "num",
"expr": "7+5",
"ans": 12,
"fig": null
},
"tashi-05-L1-03": {
"k": "num",
"expr": "9+3",
"ans": 12,
"fig": 12
},
"tashi-05-L1-04": {
"k": "num",
"expr": "6+6",
"ans": 12,
"fig": null
},
"tashi-05-L1-05": {
"k": "num",
"expr": "8+4",
"ans": 12,
"fig": null
},
"tashi-05-L2-01": {
"k": "eqtarget",
"target": 12
},
"tashi-05-L2-02": {
"k": "num",
"expr": "9+3",
"ans": 12,
"fig": null
},
"tashi-05-L2-03": {
"k": "num",
"expr": "7+8",
"ans": 15,
"fig": null
},
"tashi-05-L2-04": {
"k": "num",
"expr": "6+8",
"ans": 14,
"fig": null
},
"tashi-05-L2-05": {
"k": "min",
"exprs": [
"9+3",
"8+5",
"9+6",
"8+8"
]
},
"tashi-05-L3-01": {
"k": "num",
"expr": "8+6",
"ans": 14,
"fig": null
},
"tashi-05-L3-02": {
"k": "num",
"expr": "7+5",
"ans": 12,
"fig": null
},
"tashi-05-L3-03": {
"k": "num",
"expr": "5-3",
"ans": 2,
"fig": null
},
"tashi-05-L3-04": {
"k": "eqtrue"
},
"tashi-05-L3-05": {
"k": "num",
"expr": "7+6",
"ans": 13,
"fig": null
},
"tashi-05-L4-01": {
"k": "num",
"expr": "14-6",
"ans": 8,
"fig": null
},
"tashi-05-L4-02": {
"k": "num",
"expr": "14-8",
"ans": 6,
"fig": null
},
"tashi-05-L4-03": {
"k": "num",
"expr": "12-7",
"ans": 5,
"fig": null
},
"tashi-05-L4-04": {
"k": "trip"
},
"tashi-05-L4-05": {
"k": "num",
"expr": "9+5",
"ans": 14,
"fig": null
},
"hiki-01-L1-01": {
"k": "num",
"expr": "14-4",
"ans": 10,
"fig": [
1,
4
]
},
"hiki-01-L1-02": {
"k": "num",
"expr": "15-5",
"ans": 10,
"fig": null
},
"hiki-01-L1-03": {
"k": "num",
"expr": "12-10",
"ans": 2,
"fig": [
1,
2
]
},
"hiki-01-L1-04": {
"k": "num",
"expr": "10-1",
"ans": 9,
"fig": null
},
"hiki-01-L1-05": {
"k": "num",
"expr": "13-3",
"ans": 10,
"fig": null
},
"hiki-01-L2-01": {
"k": "num",
"expr": "14-6",
"ans": 8,
"fig": null
},
"hiki-01-L2-02": {
"k": "num",
"expr": "15-6",
"ans": 9,
"fig": null
},
"hiki-01-L2-03": {
"k": "num",
"expr": "6-4",
"ans": 2,
"fig": null
},
"hiki-01-L2-04": {
"k": "num",
"expr": "13-5",
"ans": 8,
"fig": null
},
"hiki-01-L2-05": {
"k": "num",
"expr": "12-5",
"ans": 7,
"fig": null
},
"hiki-01-L3-01": {
"k": "num",
"expr": "14-4",
"ans": 10,
"fig": null
},
"hiki-01-L3-02": {
"k": "num",
"expr": "13-6",
"ans": 7,
"fig": null
},
"hiki-01-L3-03": {
"k": "num",
"expr": "13-3",
"ans": 10,
"fig": null
},
"hiki-01-L3-04": {
"k": "manual",
"note": "14-6=8"
},
"hiki-01-L3-05": {
"k": "num",
"expr": "15-6",
"ans": 9,
"fig": null
},
"hiki-01-L4-01": {
"k": "num",
"expr": "14-10",
"ans": 4,
"fig": null
},
"hiki-01-L4-02": {
"k": "num",
"expr": "13-8",
"ans": 5,
"fig": null
},
"hiki-01-L4-03": {
"k": "num",
"expr": "10+4",
"ans": 14,
"fig": null
},
"hiki-01-L4-04": {
"k": "num",
"expr": "13-3-2",
"ans": 8,
"fig": null
},
"hiki-01-L4-05": {
"k": "cmp_gt",
"a": "14-5",
"b": "14-6"
},
"hiki-02-L1-01": {
"k": "num",
"expr": "9-2",
"ans": 7,
"fig": [
1,
2
]
},
"hiki-02-L1-02": {
"k": "num",
"expr": "12-2",
"ans": 10,
"fig": null
},
"hiki-02-L1-03": {
"k": "num",
"expr": "10-7",
"ans": 3,
"fig": null
},
"hiki-02-L1-04": {
"k": "num",
"expr": "8-3",
"ans": 5,
"fig": null
},
"hiki-02-L1-05": {
"k": "num",
"expr": "10-7",
"ans": 3,
"fig": null
},
"hiki-02-L2-01": {
"k": "num",
"expr": "13-8",
"ans": 5,
"fig": null
},
"hiki-02-L2-02": {
"k": "num",
"expr": "15-9",
"ans": 6,
"fig": null
},
"hiki-02-L2-03": {
"k": "num",
"expr": "14-7",
"ans": 7,
"fig": null
},
"hiki-02-L2-04": {
"k": "num",
"expr": "12-8",
"ans": 4,
"fig": null
},
"hiki-02-L2-05": {
"k": "num",
"expr": "17-8",
"ans": 9,
"fig": null
},
"hiki-02-L3-01": {
"k": "num",
"expr": "12-9",
"ans": 3,
"fig": null
},
"hiki-02-L3-02": {
"k": "num",
"expr": "15-9",
"ans": 6,
"fig": null
},
"hiki-02-L3-03": {
"k": "method",
"ans": 5
},
"hiki-02-L3-04": {
"k": "same",
"target": "12-9"
},
"hiki-02-L3-05": {
"k": "num",
"expr": "14-7",
"ans": 7,
"fig": null
},
"hiki-02-L4-01": {
"k": "num",
"expr": "12-3",
"ans": 9,
"fig": null
},
"hiki-02-L4-02": {
"k": "num",
"expr": "13-5",
"ans": 8,
"fig": null
},
"hiki-02-L4-03": {
"k": "num",
"expr": "6+9",
"ans": 15,
"fig": null
},
"hiki-02-L4-04": {
"k": "num",
"expr": "(15-8)-(15-9)",
"ans": 1,
"fig": null
},
"hiki-02-L4-05": {
"k": "num",
"expr": "12-4",
"ans": 8,
"fig": null
},
"hiki-03-L1-01": {
"k": "num",
"expr": "12-10",
"ans": 2,
"fig": [
1,
2
]
},
"hiki-03-L1-02": {
"k": "num",
"expr": "10-9",
"ans": 1,
"fig": null
},
"hiki-03-L1-03": {
"k": "num",
"expr": "1+2",
"ans": 3,
"fig": null
},
"hiki-03-L1-04": {
"k": "num",
"expr": "13-10",
"ans": 3,
"fig": [
1,
3
]
},
"hiki-03-L1-05": {
"k": "num",
"expr": "12-9",
"ans": 3,
"fig": null
},
"hiki-03-L2-01": {
"k": "num",
"expr": "2+3",
"ans": 5,
"fig": null
},
"hiki-03-L2-02": {
"k": "num",
"expr": "14-9",
"ans": 5,
"fig": null
},
"hiki-03-L2-03": {
"k": "num",
"expr": "14-5",
"ans": 9,
"fig": null
},
"hiki-03-L2-04": {
"k": "num",
"expr": "16-8",
"ans": 8,
"fig": null
},
"hiki-03-L2-05": {
"k": "num",
"expr": "11-8",
"ans": 3,
"fig": null
},
"hiki-03-L3-01": {
"k": "num",
"expr": "13-9",
"ans": 4,
"fig": null
},
"hiki-03-L3-02": {
"k": "num",
"expr": "14-9",
"ans": 5,
"fig": null
},
"hiki-03-L3-03": {
"k": "method",
"ans": 5
},
"hiki-03-L3-04": {
"k": "num",
"expr": "15-9",
"ans": 6,
"fig": null
},
"hiki-03-L3-05": {
"k": "num",
"expr": "12-9",
"ans": 3,
"fig": null
},
"hiki-03-L4-01": {
"k": "num",
"expr": "13-4",
"ans": 9,
"fig": null
},
"hiki-03-L4-02": {
"k": "num",
"expr": "5+9",
"ans": 14,
"fig": null
},
"hiki-03-L4-03": {
"k": "num",
"expr": "1+5",
"ans": 6,
"fig": null
},
"hiki-03-L4-04": {
"k": "num",
"expr": "13-9",
"ans": 4,
"fig": null
},
"hiki-03-L4-05": {
"k": "num",
"expr": "17-9",
"ans": 8,
"fig": null
},
"hiki-04-L1-01": {
"k": "num",
"expr": "2+4",
"ans": 6,
"fig": null
},
"hiki-04-L1-02": {
"k": "num",
"expr": "8-4",
"ans": 4,
"fig": null
},
"hiki-04-L1-03": {
"k": "num",
"expr": "13-9",
"ans": 4,
"fig": [
1,
3
]
},
"hiki-04-L1-04": {
"k": "num",
"expr": "16-9",
"ans": 7,
"fig": null
},
"hiki-04-L1-05": {
"k": "num",
"expr": "11-9",
"ans": 2,
"fig": null
},
"hiki-04-L2-01": {
"k": "num",
"expr": "15-7",
"ans": 8,
"fig": [
1,
5
]
},
"hiki-04-L2-02": {
"k": "num",
"expr": "13-7",
"ans": 6,
"fig": null
},
"hiki-04-L2-03": {
"k": "num",
"expr": "17-9",
"ans": 8,
"fig": null
},
"hiki-04-L2-04": {
"k": "num",
"expr": "16-7",
"ans": 9,
"fig": null
},
"hiki-04-L2-05": {
"k": "num",
"expr": "15-8",
"ans": 7,
"fig": null
},
"hiki-04-L3-01": {
"k": "num",
"expr": "13-9",
"ans": 4,
"fig": null
},
"hiki-04-L3-02": {
"k": "num",
"expr": "13-9",
"ans": 4,
"fig": null
},
"hiki-04-L3-03": {
"k": "method",
"ans": 6
},
"hiki-04-L3-04": {
"k": "num",
"expr": "15-7",
"ans": 8,
"fig": null
},
"hiki-04-L3-05": {
"k": "num",
"expr": "12-8",
"ans": 4,
"fig": null
},
"hiki-04-L4-01": {
"k": "num",
"expr": "12-7",
"ans": 5,
"fig": null
},
"hiki-04-L4-02": {
"k": "num",
"expr": "7+8",
"ans": 15,
"fig": null
},
"hiki-04-L4-03": {
"k": "num",
"expr": "16-8",
"ans": 8,
"fig": null
},
"hiki-04-L4-04": {
"k": "max",
"exprs": [
"11-9",
"13-9",
"15-9",
"17-9"
]
},
"hiki-04-L4-05": {
"k": "num",
"expr": "14-6",
"ans": 8,
"fig": null
},
"hiki-05-L1-01": {
"k": "num",
"expr": "13-8",
"ans": 5,
"fig": null
},
"hiki-05-L1-02": {
"k": "num",
"expr": "15-9",
"ans": 6,
"fig": null
},
"hiki-05-L1-03": {
"k": "num",
"expr": "12-9",
"ans": 3,
"fig": null
},
"hiki-05-L1-04": {
"k": "num",
"expr": "15-8",
"ans": 7,
"fig": null
},
"hiki-05-L1-05": {
"k": "num",
"expr": "16-7",
"ans": 9,
"fig": null
},
"hiki-05-L2-01": {
"k": "num",
"expr": "16-9",
"ans": 7,
"fig": null
},
"hiki-05-L2-02": {
"k": "eqtarget",
"target": 7
},
"hiki-05-L2-03": {
"k": "num",
"expr": "13-7",
"ans": 6,
"fig": null
},
"hiki-05-L2-04": {
"k": "num",
"expr": "17-9",
"ans": 8,
"fig": null
},
"hiki-05-L2-05": {
"k": "min",
"exprs": [
"12-9",
"13-7",
"15-8",
"17-9"
]
},
"hiki-05-L3-01": {
"k": "num",
"expr": "15-8",
"ans": 7,
"fig": null
},
"hiki-05-L3-02": {
"k": "num",
"expr": "13-7",
"ans": 6,
"fig": null
},
"hiki-05-L3-03": {
"k": "num",
"expr": "5-4",
"ans": 1,
"fig": null
},
"hiki-05-L3-04": {
"k": "eqtrue"
},
"hiki-05-L3-05": {
"k": "num",
"expr": "17-9",
"ans": 8,
"fig": null
},
"hiki-05-L4-01": {
"k": "num",
"expr": "15-9",
"ans": 6,
"fig": null
},
"hiki-05-L4-02": {
"k": "num",
"expr": "9+7",
"ans": 16,
"fig": null
},
"hiki-05-L4-03": {
"k": "eqtarget",
"target": 7
},
"hiki-05-L4-04": {
"k": "num",
"expr": "(13-6)-(13-7)",
"ans": 1,
"fig": null
},
"hiki-05-L4-05": {
"k": "cmp",
"a": "15-9",
"b": "14-8"
}
}''')
items = json.load(open(os.path.join(HERE, 'e1d.json'), encoding='utf-8'))
bad = []

def ev(s):
    s = s.replace('−', '-').replace('＋', '+')
    assert re.fullmatch(r'[\d\s+\-()]+', s), s
    return eval(s)

def num(t):
    m = re.match(r'\s*(\d+)', t)
    return int(m.group(1))

def final_of(t):
    m = re.findall(r'(?:=|で|こたえは)\s*(\d+)', t)
    return int(m[-1]) if m else None

def method_ok(t, ans):
    """文の中の しき・わけかたが ぜんぶ ただしく、さいごの こたえが ans か"""
    ok = True
    for a, op, b, c in re.findall(r'(\d+)\s*([+−-])\s*(\d+)\s*=\s*(\d+)', t):
        ok &= (ev(f'{a}{op}{b}') == int(c))
    for a, b, c in re.findall(r'(\d+)と\s*(\d+)で\s*(\d+)', t):
        ok &= (int(a) + int(b) == int(c))
    for a, b, c in re.findall(r'(\d+)を\s*(\d+)と\s*(\d+)に', t):
        ok &= (int(b) + int(c) == int(a))
    return ok and final_of(t) == ans

def fig_count(f):
    if '<circle' in f and 'fg-dot' in f or ('<circle' in f and 'fg-bg' in f and 'r="10"' in f):
        return len(re.findall(r'<circle[^>]*r="10"', f)) + len(re.findall(r'<path d="M\d+ \d+ l10 18', f))
    rects = re.findall(r'<rect[^>]*>', f)
    tens = sum(1 for r in rects if 'height="60"' in r)
    return [tens, len(rects) - tens]

MANUAL = {
    'tashi-01-L4-04': lambda: 9 + 6 == 15 and 10 + 5 == 15 and 10 + 6 != 15 and 9 + 1 == 10 and 1 + 5 == 6,
    'tashi-02-L4-02': lambda: [9 + k + 1 - (9 + k) for k in (3, 4, 5)] == [1, 1, 1],
    'tashi-03-L3-02': lambda: 8 + 2 == 10 and 8 + 3 != 10 and 3 + 2 == 5 and 10 + 3 == 13,
    'tashi-04-L4-04': lambda: (4 + 4 == 8 and 8 + 2 == 10 and 10 + 2 == 12) and (4 + 6 == 10 and 8 == 6 + 2 and 10 + 2 == 12),
    'hiki-01-L3-04': lambda: 14 - 4 == 10 and 10 - 2 == 8 and 14 - 6 == 8 and 10 - 6 != 8 and 10 + 2 != 8,
}

rows = []
for it in items:
    k = KEYS[it['id']]
    kind = k['k']
    c = it['c']
    cor = [x for x in c if x.get('k') == 1]
    wro = [x for x in c if x.get('k') != 1]
    assert len(cor) == 1 and len(wro) == 3, it['id']
    ct = cor[0]['t']
    comp = None
    ok = True
    if kind == 'num':
        comp = ev(k['expr'])
        ok = comp == k['ans'] == num(ct) and all(num(x['t']) != comp for x in wro)
        if k.get('fig') is not None:
            fc = fig_count(it['f'])
            ok &= (fc == k['fig'])
            comp = f'{comp} (図 {fc})'
    elif kind == 'same':
        comp = ev(k['target'])
        ok = ev(ct) == comp and all(ev(x['t']) != comp for x in wro)
    elif kind == 'eqtarget':
        comp = k['target']
        ok = ev(ct) == comp and all(ev(x['t']) != comp for x in wro)
    elif kind in ('min', 'max'):
        vals = {e: ev(e) for e in k['exprs']}
        best = (min if kind == 'min' else max)(vals.values())
        comp = best
        ok = list(vals.values()).count(best) == 1 and ev(ct) == best and all(ev(x['t']) != best for x in wro)
        ok &= sorted(ev(x['t']) for x in c) == sorted(vals.values())
    elif kind == 'eqtrue':
        def truth(t):
            a, op, b, r = re.fullmatch(r'\s*(\d+)\s*([+−])\s*(\d+)\s*=\s*(\d+)\s*', t).groups()
            return ev(f'{a}{op}{b}') == int(r)
        comp = 'ただしい しき'
        ok = truth(ct) and not any(truth(x['t']) for x in wro)
    elif kind == 'cmp':
        comp = f"{ev(k['a'])} と {ev(k['b'])}"
        ok = ev(k['a']) == ev(k['b']) and ct == 'どちらも おなじ' and all('おなじ' not in x['t'] or x['t'] == '' for x in wro)
    elif kind == 'cmp_gt':
        d = ev(k['a']) - ev(k['b'])
        comp = f"{ev(k['a'])} - {ev(k['b'])} = {d}"
        ok = d == 1 and ct.startswith(k['a'].replace('-', ' − ').replace('14', '14', 1)) and '1 おおきい' in ct
    elif kind == 'diff':
        comp = ev(k['a']) - ev(k['b'])
        ok = comp == k['ans'] == num(ct) and all(num(x['t']) != comp for x in wro)
    elif kind == 'trip':
        comp = '9+3,8+4,7+5=12'
        ok = 9 + 3 == 8 + 4 == 7 + 5 == 12 and ct == '3、4、5' and all(x['t'] != '3、4、5' for x in wro)
    elif kind == 'method':
        comp = k['ans']
        ok = method_ok(ct, k['ans']) and not any(method_ok(x['t'], k['ans']) for x in wro)
    elif kind == 'manual':
        ok = MANUAL[it['id']]()
        comp = k.get('note')
    # 解説の さいごの こたえ が 正解と おなじ はじまりか
    last = it['e'].split('\n')[-1]
    if not last.startswith('こたえ'):
        ok = False
    rows.append((it['id'], it['q'][:50], comp, ct, ok))
    if not ok:
        bad.append(it['id'])

for r in rows:
    print(f"{'OK ' if r[4] else 'NG '} {r[0]}  {r[1]}  => 計算 {r[2]} / 正解の選択肢 {r[3]}")
print(f'\n{len(rows)} 問・まちがい {len(bad)} 問', bad)
sys.exit(1 if bad else 0)
