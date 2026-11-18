#!/usr/bin/env python3
"""
バスケ タップ記録のアイコン（ホーム画面用）を作る：icons/apple-touch-icon.png（180）、icon-192.png、icon-512.png。
濃い紺の地に、オレンジのボールと「タップ」の輪。丸く切り取られても欠けないよう、絵は真ん中の 8 割に収めてある。
使い方：  python3 basket-tap/tools/make_icons.py        （Pillow が必要：pip3 install pillow）
できた PNG は git に入れる（build.mjs が公開用のフォルダにコピーする）。
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

BG = (15, 23, 42)        # 濃い紺
BALL = (234, 88, 12)     # オレンジ
WHITE = (255, 255, 255)
BIG = 2048               # 大きく描いてから縮める（ふちをなめらかに）


def draw():
    img = Image.new('RGB', (BIG, BIG), BG)
    cx, cy, r = int(BIG * 0.45), int(BIG * 0.47), int(BIG * 0.27)
    ball = Image.new('L', (BIG, BIG), 0)
    ImageDraw.Draw(ball).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    img.paste(Image.new('RGB', (BIG, BIG), BALL), (0, 0), ball)
    seam = Image.new('L', (BIG, BIG), 0)
    sd = ImageDraw.Draw(seam)
    w = max(8, int(r * 0.06))
    sd.line((cx, cy - r, cx, cy + r), fill=255, width=w)
    sd.line((cx - r, cy, cx + r, cy), fill=255, width=w)
    br = int(r * 0.95)
    sd.arc((cx - r - br, cy - br, cx - r + br, cy + br), start=-62, end=62, fill=255, width=w)
    sd.arc((cx + r - br, cy - br, cx + r + br, cy + br), start=118, end=242, fill=255, width=w)
    seam = ImageChops.multiply(seam, ball)
    img.paste(Image.new('RGB', (BIG, BIG), BG), (0, 0), seam)
    # タップの輪（右下）
    d = ImageDraw.Draw(img)
    tx, ty = int(BIG * 0.70), int(BIG * 0.70)
    for rr, ww in ((int(BIG * 0.135), int(BIG * 0.022)), (int(BIG * 0.085), int(BIG * 0.022))):
        d.ellipse((tx - rr, ty - rr, tx + rr, ty + rr), outline=WHITE, width=ww)
    dr = int(BIG * 0.042)
    d.ellipse((tx - dr, ty - dr, tx + dr, ty + dr), fill=WHITE)
    return img


def main():
    out = Path(__file__).resolve().parent.parent / 'icons'
    out.mkdir(exist_ok=True)
    big = draw()
    for size, name in ((180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
        big.resize((size, size), Image.LANCZOS).save(out / name, optimize=True)
        print('書き出した：', out / name)


if __name__ == '__main__':
    main()
