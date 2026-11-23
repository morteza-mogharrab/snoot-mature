"""Crops square avatars from the raw sample photos. Usage: python3 avatars.py sheet|<outdir>"""
import sys, os
from PIL import Image, ImageDraw
SRC = '/home/claude/raw'
# id: (centre x, centre y, side as fraction of the shorter edge)
A = {
 # pets
 1213:(.5,.42,.55), 1114:(.5,.5,.85), 670:(.45,.5,.7), 574:(.5,.55,.7), 258:(.45,.4,.6), 879:(.5,.55,.8),
 795:(.5,.32,.42), 667:(.5,.45,.55), 1174:(.5,.45,.75), 1302:(.45,.35,.5), 533:(.45,.4,.6), 718:(.32,.5,.8),
 82:(.6,.45,.7), 66:(.5,.45,.7), 1316:(.5,.5,.6), 946:(.5,.45,.7), 392:(.62,.55,.5), 287:(.5,.45,.75),
 865:(.55,.5,.7), 184:(.5,.45,.6), 188:(.4,.5,.6), 1089:(.4,.45,.6), 1113:(.35,.4,.55), 679:(.5,.4,.6),
 551:(.5,.5,.8), 637:(.5,.45,.7), 453:(.4,.45,.6), 755:(.5,.55,.6), 1211:(.5,.5,.7),
 # people
 784:(.45,.3,.4), 482:(.5,.3,.4), 589:(.5,.3,.4), 597:(.5,.35,.45), 710:(.45,.3,.4), 813:(.5,.3,.45),
 193:(.40,.40,.45), 38:(.53,.30,.42), 98:(.45,.33,.42), 136:(.55,.36,.45), 152:(.46,.33,.42), 240:(.5,.29,.40),
 262:(.5,.40,.45), 324:(.45,.37,.55), 377:(.45,.30,.35), 181:(.62,.34,.5), 1289:(.5,.35,.5), 951:(.5,.35,.5), 1009:(.5,.3,.4),
}
def crop(i, size=200):
    im = Image.open(f'{SRC}/image-{i}.jpg').convert('RGB'); w, h = im.size; cx, cy, s = A[i]
    side = int(min(w, h) * s); x = int(cx * w - side / 2); y = int(cy * h - side / 2)
    x = max(0, min(w - side, x)); y = max(0, min(h - side, y))
    return im.crop((x, y, x + side, y + side)).resize((size, size), Image.LANCZOS)
if __name__ == '__main__':
    if sys.argv[1] == 'sheet':
        ks = list(A); cols = 12; rows = (len(ks) + cols - 1) // cols
        S = Image.new('RGB', (cols * 130, rows * 140), 'white'); d = ImageDraw.Draw(S)
        for k, i in enumerate(ks):
            S.paste(crop(i, 120), ((k % cols) * 130, (k // cols) * 140)); d.text(((k % cols) * 130 + 4, (k // cols) * 140 + 124), str(i), fill='black')
        S.save('/tmp/snoot-av.jpg')
    else:
        os.makedirs(sys.argv[1], exist_ok=True)
        for i in A: crop(i).save(f'{sys.argv[1]}/{i}.jpg', quality=84)
