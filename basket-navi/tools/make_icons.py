#!/usr/bin/env python3
"""
アプリのアイコン（ホーム画面用）を作る：assets/icon-180.png（iPad のホーム画面）、icon-192.png・icon-512.png（manifest）。
バスケットボールの絵。丸く切り取られても欠けないよう、ボールは全体の 60% の大きさにしてある。
使い方：  python3 tools/make_icons.py        （Pillow が必要：pip3 install pillow）
できた PNG は git に入れる（bundle.cjs --pwa が、公開用のフォルダにコピーする）。
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

BG = (28, 36, 48)        # 濃い紺
BALL = (234, 88, 12)     # オレンジ
BIG = 2048               # 大きく描いてから縮める（ふちをなめらかに）


def draw():
    img = Image.new('RGB', (BIG, BIG), BG)
    c, r = BIG // 2, int(BIG * 0.30)
    ball_mask = Image.new('L', (BIG, BIG), 0)
    ImageDraw.Draw(ball_mask).ellipse((c - r, c - r, c + r, c + r), fill=255)
    img.paste(Image.new('RGB', (BIG, BIG), BALL), (0, 0), ball_mask)
    seam = Image.new('L', (BIG, BIG), 0)
    sd = ImageDraw.Draw(seam)
    w = max(8, int(r * 0.055))
    sd.line((c, c - r, c, c + r), fill=255, width=w)                 # たて
    sd.line((c - r, c, c + r, c), fill=255, width=w)                 # よこ
    big_r = int(r * 0.95)                                            # 左右の曲がった縫い目：円弧
    sd.arc((c - r - big_r, c - big_r, c - r + big_r, c + big_r), start=-62, end=62, fill=255, width=w)
    sd.arc((c + r - big_r, c - big_r, c + r + big_r, c + big_r), start=118, end=242, fill=255, width=w)
    seam = ImageChops.multiply(seam, ball_mask)                      # ボールの外には出さない
    img.paste(Image.new('RGB', (BIG, BIG), BG), (0, 0), seam)
    return img


def main():
    out = Path(__file__).resolve().parent.parent / 'assets'
    out.mkdir(exist_ok=True)
    big = draw()
    for size in (180, 192, 512):
        big.resize((size, size), Image.LANCZOS).save(out / f'icon-{size}.png', optimize=True)
        print('書き出した：', out / f'icon-{size}.png')


if __name__ == '__main__':
    main()
