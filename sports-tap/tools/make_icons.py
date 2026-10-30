#!/usr/bin/env python3
"""
スポーツ タップ記録のアイコン（ホーム画面用）を作る：icons/apple-touch-icon.png（180）、icon-192.png、icon-512.png。
濃い紺の地に、緑のストップウォッチと「タップ」の輪（バスケ タップ記録と同じ形の輪）。丸く切り取られても欠けないよう、絵は真ん中の 8 割に収めてある。
サッカー タップ記録（soccer/icons/）は、緑の地に白黒のサッカーボールと「タップ」の輪。
使い方：  python3 sports-tap/tools/make_icons.py        （Pillow が必要：pip3 install pillow）
できた PNG は git に入れる（build.mjs が公開用のフォルダにコピーする）。
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw

BG = (15, 23, 42)        # 濃い紺
WATCH = (22, 163, 74)    # 緑
WHITE = (255, 255, 255)
BIG = 2048


def draw():
    img = Image.new('RGB', (BIG, BIG), BG)
    d = ImageDraw.Draw(img)
    cx, cy, r = int(BIG * 0.45), int(BIG * 0.50), int(BIG * 0.26)
    # 上のボタン（りゅうず）
    bw, bh = int(r * 0.30), int(r * 0.22)
    d.rounded_rectangle((cx - bw // 2, cy - r - bh - int(r * 0.08), cx + bw // 2, cy - r + int(r * 0.05)), radius=int(bh * 0.3), fill=WATCH)
    # 本体
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=WATCH)
    ir = int(r * 0.80)
    d.ellipse((cx - ir, cy - ir, cx + ir, cy + ir), fill=BG)
    # 目盛り（12 本）と針
    for k in range(12):
        a = math.radians(k * 30)
        r1, r2 = ir * (0.80 if k % 3 else 0.68), ir * 0.92
        w = int(BIG * (0.016 if k % 3 == 0 else 0.010))
        d.line((cx + r1 * math.sin(a), cy - r1 * math.cos(a), cx + r2 * math.sin(a), cy - r2 * math.cos(a)), fill=WHITE, width=w)
    a = math.radians(55)
    d.line((cx, cy, cx + ir * 0.62 * math.sin(a), cy - ir * 0.62 * math.cos(a)), fill=WHITE, width=int(BIG * 0.024))
    cr = int(BIG * 0.028)
    d.ellipse((cx - cr, cy - cr, cx + cr, cy + cr), fill=WHITE)
    # タップの輪（右下）
    tx, ty = int(BIG * 0.71), int(BIG * 0.73)
    d.ellipse((tx - int(BIG * 0.15), ty - int(BIG * 0.15), tx + int(BIG * 0.15), ty + int(BIG * 0.15)), fill=BG)
    for rr, ww in ((int(BIG * 0.125), int(BIG * 0.021)), (int(BIG * 0.078), int(BIG * 0.021))):
        d.ellipse((tx - rr, ty - rr, tx + rr, ty + rr), outline=WHITE, width=ww)
    dr = int(BIG * 0.040)
    d.ellipse((tx - dr, ty - dr, tx + dr, ty + dr), fill=WHITE)
    return img


def draw_soccer():
    img = Image.new('RGB', (BIG, BIG), (21, 94, 52))       # 芝の緑
    d = ImageDraw.Draw(img)
    cx, cy, r = int(BIG * 0.45), int(BIG * 0.47), int(BIG * 0.28)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=WHITE, outline=(17, 17, 17), width=int(BIG * 0.012))
    # 真ん中の黒い五角形と、まわりの5つ（ボールの模様）
    def pent(x, y, rr, rot):
        pts = [(x + rr * math.sin(math.radians(rot + k * 72)), y - rr * math.cos(math.radians(rot + k * 72))) for k in range(5)]
        d.polygon(pts, fill=(17, 17, 17))
    pent(cx, cy, r * 0.34, 0)
    for k in range(5):
        a = math.radians(k * 72)
        pent(cx + r * 0.78 * math.sin(a), cy - r * 0.78 * math.cos(a), r * 0.24, 180 + k * 72)
        d.line((cx + r * 0.34 * math.sin(a), cy - r * 0.34 * math.cos(a), cx + r * 0.62 * math.sin(a), cy - r * 0.62 * math.cos(a)), fill=(17, 17, 17), width=int(BIG * 0.012))
    # ボールの外にはみ出した模様を消す
    mask = Image.new('L', (BIG, BIG), 0)
    ImageDraw.Draw(mask).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    bg = Image.new('RGB', (BIG, BIG), (21, 94, 52))
    img = Image.composite(img, bg, mask)
    d = ImageDraw.Draw(img)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(17, 17, 17), width=int(BIG * 0.012))
    tx, ty = int(BIG * 0.71), int(BIG * 0.73)
    d.ellipse((tx - int(BIG * 0.15), ty - int(BIG * 0.15), tx + int(BIG * 0.15), ty + int(BIG * 0.15)), fill=(21, 94, 52))
    for rr, ww in ((int(BIG * 0.125), int(BIG * 0.021)), (int(BIG * 0.078), int(BIG * 0.021))):
        d.ellipse((tx - rr, ty - rr, tx + rr, ty + rr), outline=WHITE, width=ww)
    dr = int(BIG * 0.040)
    d.ellipse((tx - dr, ty - dr, tx + dr, ty + dr), fill=WHITE)
    return img


def main():
    base = Path(__file__).resolve().parent.parent
    for out, big in ((base / 'icons', draw()), (base / 'soccer' / 'icons', draw_soccer())):
        out.mkdir(parents=True, exist_ok=True)
        for size, name in ((180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
            big.resize((size, size), Image.LANCZOS).save(out / name, optimize=True)
            print('書き出した：', out / name)


if __name__ == '__main__':
    main()
