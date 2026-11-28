import sys
from PIL import Image, ImageDraw, ImageFont
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert("RGB") for f in files]
if not ims: sys.exit(0)
cols = 2 if len(ims) > 1 else 1
tw = 760
th = [int(im.height * tw / im.width) for im in ims]
rows = (len(ims) + cols - 1) // cols
rh = [max(th[r * cols:(r + 1) * cols]) + 26 for r in range(rows)]
sheet = Image.new("RGB", (cols * (tw + 12) + 12, sum(rh) + 12), (225, 232, 228))
d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype("/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf", 18)
except Exception: font = None
y = 8
for r in range(rows):
    for c in range(cols):
        k = r * cols + c
        if k >= len(ims): break
        x = 12 + c * (tw + 12)
        d.text((x, y), f"コマ {k}", fill=(20, 60, 50), font=font)
        sheet.paste(ims[k].resize((tw, th[k]), Image.LANCZOS), (x, y + 24))
    y += rh[r]
sheet.save(out)
