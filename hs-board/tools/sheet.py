# 写真を1枚にまとめる：python3 sheet.py <写真のフォルダ>  →  <フォルダ>.sheet.jpg（4列・番号つき）
import sys, os
from PIL import Image, ImageDraw
d = sys.argv[1].rstrip('/')
fs = sorted(f for f in os.listdir(d) if f.endswith('.jpg'))
W, H, C = 560, 315, 4
rows = (len(fs) + C - 1) // C
sheet = Image.new('RGB', (W * C, H * rows), (20, 20, 20))
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    im = Image.open(os.path.join(d, f)).convert('RGB').resize((W, H))
    x, y = (i % C) * W, (i // C) * H
    sheet.paste(im, (x, y))
    dr.rectangle([x, y, x + 46, y + 24], fill=(0, 0, 0))
    dr.text((x + 6, y + 5), f[:3], fill=(255, 255, 0))
sheet.save(d + '.sheet.jpg', quality=72)
print('  写真:', d + '.sheet.jpg')
