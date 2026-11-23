"""Crops and resizes raw sample photos into public/media/p (feed) and public/media/t (thumbs).

Usage: python3 posts.py   (expects the raw sample images in SRC; see README for the source)
Writes tools/manifest.json, which feeds src/data/mediaManifest.ts.
"""
import os, json
from PIL import Image

SRC = '/home/claude/raw'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'media')
IDS = [1213, 1114, 520, 670, 495, 574, 64, 258, 268, 879, 203, 795, 667, 1174, 1302, 870, 533, 718, 82, 66, 1316, 946, 392, 287, 865, 882,
       184, 188, 1089, 1113, 679, 551, 637, 453, 755, 1211, 1165, 1199, 403, 1001, 654, 500, 587, 731, 951,
       693, 709, 1006, 1141, 1258, 822, 837, 1310, 521, 532, 1162, 695, 880, 1098, 1138, 1178, 1217, 1150, 1306, 1044, 518, 891,
       924, 1152, 1166, 1081, 1253, 844, 914, 170, 238, 364, 155, 308, 185, 387, 372, 20, 336, 1037, 580, 859, 609]

os.makedirs(f'{OUT}/p', exist_ok=True)
os.makedirs(f'{OUT}/t', exist_ok=True)
manifest = {}
for i in dict.fromkeys(IDS):
    im = Image.open(f'{SRC}/image-{i}.jpg').convert('RGB')
    w, h = im.size
    if h > w * 1.1:  # portrait → 4:5
        th = int(w * 5 / 4); y = max(0, int((h - th) * 0.4)); im = im.crop((0, y, w, y + th)); asp = '4:5'
    else:            # landscape/square → 1:1
        s = min(w, h); x = (w - s) // 2; y = (h - s) // 2; im = im.crop((x, y, x + s, y + s)); asp = '1:1'
    W = 820 if asp == '1:1' else 700
    im.resize((W, int(W * im.size[1] / im.size[0])), Image.LANCZOS).save(f'{OUT}/p/{i}.jpg', quality=72, optimize=True, progressive=True)
    im.resize((360, int(360 * im.size[1] / im.size[0])), Image.LANCZOS).save(f'{OUT}/t/{i}.jpg', quality=72, optimize=True)
    manifest[i] = asp
json.dump(manifest, open(os.path.join(os.path.dirname(__file__), 'manifest.json'), 'w'))
print(len(manifest), 'images processed')
