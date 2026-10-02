#!/usr/bin/env python3
"""PDF の何ページかを、1枚の画像にならべる（開発用。目で確かめるため）。
使い方: python3 tools/pdfview.py in.pdf out.png [ページ（例 1-4,7）] [横にならべる数] [1ページの幅px]"""
import sys, fitz
def pages(spec, n):
    if not spec or spec == 'all': return list(range(n))
    out = []
    for part in spec.split(','):
        a, _, b = part.partition('-'); a = int(a); b = int(b) if b else a
        out += list(range(a - 1, min(b, n)))
    return out
doc = fitz.open(sys.argv[1]); ps = pages(sys.argv[3] if len(sys.argv) > 3 else '1-4', len(doc))
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4; w = int(sys.argv[5]) if len(sys.argv) > 5 else 480
pix = [doc[i].get_pixmap(matrix=fitz.Matrix(w / doc[i].rect.width, w / doc[i].rect.width)) for i in ps]
h = max(p.height for p in pix); rows = (len(pix) + cols - 1) // cols
canvas = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, cols * (w + 6), rows * (h + 6)), False); canvas.set_rect(canvas.irect, (217, 215, 208))
for k, p in enumerate(pix):
    if p.alpha: p = fitz.Pixmap(p, 0)
    p.set_origin((k % cols) * (w + 6), (k // cols) * (h + 6)); canvas.copy(p, p.irect)
canvas.save(sys.argv[2]); print(sys.argv[2], len(doc), 'ページ中', len(ps), 'ページ')
