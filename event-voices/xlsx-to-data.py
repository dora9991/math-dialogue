#!/usr/bin/env python3
"""
Googleフォーム等からエクスポートした「みんなの感想.xlsx」のような表から、
event-voices の *-data.js を直接生成する。

  python3 xlsx-to-data.py "みんなの感想.xlsx" --col 3 --out taiikusai-data.js
  python3 xlsx-to-data.py "みんなの感想.xlsx" --col 2 --out shukuhaku-data.js

--col は対象の列番号（1始まり。A列=1, B列=2, ...）。
1行＝1人の回答として扱う（make-data.mjs のような「1行ずつテキストに変換」方式だと、
セル内に改行で複数人分の感想が結合されているケースを誤って別人としてカウントして
しまうことがあるため、必ずこのスクリプトのように「行単位」で読み込むこと）。
"""

import argparse
import json
import re
import sys

try:
    import openpyxl
except ImportError:
    print("openpyxl が必要です: pip3 install openpyxl", file=sys.stderr)
    sys.exit(1)


def clean(value):
    s = "" if value is None else str(value)
    s = re.sub(r"[ 　]{3,}", "　", s)   # 3個以上の連続スペースは1個に
    s = re.sub(r"\n{2,}", "\n", s)      # 空行の連続は1個に
    s = s.strip("\n 　")
    return s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx", help="入力するxlsxファイル")
    ap.add_argument("--sheet", default=None, help="シート名（省略時は先頭シート）")
    ap.add_argument("--col", type=int, required=True, help="対象の列番号（1始まり）")
    ap.add_argument("--header-row", type=int, default=1, help="見出し行の番号（既定1）")
    ap.add_argument("--out", required=True, help="出力先の *-data.js")
    ap.add_argument("--drop-empty", action="store_true",
                     help="空の回答をスキップする（既定は空文字のまま1人分としてカウント）")
    args = ap.parse_args()

    wb = openpyxl.load_workbook(args.xlsx, data_only=True)
    ws = wb[args.sheet] if args.sheet else wb.worksheets[0]

    rows = list(ws.iter_rows(min_row=args.header_row + 1, values_only=True))
    items = []
    for r in rows:
        v = r[args.col - 1] if len(r) >= args.col else None
        v = clean(v)
        if args.drop_empty and not v:
            continue
        items.append(v)

    header = str(ws.cell(row=args.header_row, column=args.col).value or "").strip()
    body = ",\n  ".join(json.dumps(x, ensure_ascii=False) for x in items)
    out = (
        f"// 感想ひろばのデータ（{args.xlsx} / 列: {header!r}、{len(items)}人分）\n"
        f"window.EVENT_DATA = [\n  {body}\n];\n"
    )
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"✅ {len(items)}件（{len(rows)}行中）の感想を {args.out} に書き出しました。")


if __name__ == "__main__":
    main()
