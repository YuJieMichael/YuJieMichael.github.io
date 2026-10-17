"""
自动找出画面里的「一团团线条」作为候选元素，并画一张带编号的预览图，方便确认分镜。
纯计算，不调用 AI。

用法：python tools/handdraw/propose_regions.py 2 3 4 5 [--gap 28]
输出：tools/handdraw/proposals/N.json（每个候选的编号和框）和 N.png（带编号的预览）
"""
import argparse
import json
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proposals')
SCALE = 4  # 在缩小 4 倍的图上找连通块，快


def label(mask):
    """4 邻域连通块标号（两遍扫描 + 并查集）"""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    parent = [0]

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    nxt = 1
    for y in range(h):
        row, up = mask[y], lab[y - 1] if y else None
        for x in range(w):
            if not row[x]:
                continue
            left = lab[y, x - 1] if x else 0
            top = up[x] if y else 0
            if left and top:
                a, b = find(left), find(top)
                lab[y, x] = min(a, b)
                parent[max(a, b)] = min(a, b)
            elif left or top:
                lab[y, x] = left or top
            else:
                parent.append(nxt)
                lab[y, x] = nxt
                nxt += 1
    roots = np.array([find(i) for i in range(nxt)])
    return roots[lab]


def propose(n, gap):
    im = Image.open(os.path.join(ROOT, 'images', f'{n}.png')).convert('L')
    W, H = im.size
    small = im.resize((W // SCALE, H // SCALE), Image.BOX)
    ink = Image.fromarray(((np.asarray(small) < 200) * 255).astype(np.uint8))
    r = max(1, gap // SCALE // 2)
    for _ in range(r):  # 膨胀：间距小于 gap 的线条连成一团
        ink = ink.filter(ImageFilter.MaxFilter(3))
    lab = label(np.asarray(ink) > 0)
    comps = []
    for k in np.unique(lab):
        if k == 0:
            continue
        ys, xs = np.nonzero(lab == k)
        if len(xs) < 12:
            continue
        x0, y0 = (xs.min() - r) * SCALE, (ys.min() - r) * SCALE
        x1, y1 = (xs.max() + 1 + r) * SCALE, (ys.max() + 1 + r) * SCALE
        comps.append([int(max(0, x0)), int(max(0, y0)), int(min(W, x1) - max(0, x0)), int(min(H, y1) - max(0, y0))])
    comps.sort(key=lambda b: (b[0], b[1]))
    result = [{'id': i + 1, 'box': b} for i, b in enumerate(comps)]

    preview = Image.open(os.path.join(ROOT, 'images', f'{n}.png')).convert('RGB')
    d = ImageDraw.Draw(preview)
    try:
        font = ImageFont.truetype('DejaVuSans-Bold.ttf', 34)
    except OSError:
        font = ImageFont.load_default()
    colors = [(230, 60, 60), (40, 140, 230), (30, 170, 90), (220, 140, 20), (160, 70, 200), (0, 160, 170)]
    for c in result:
        x, y, w, h = c['box']
        col = colors[(c['id'] - 1) % len(colors)]
        d.rectangle([x, y, x + w, y + h], outline=col, width=4)
        d.rectangle([x, y, x + 46, y + 40], fill=col)
        d.text((x + 6, y + 2), str(c['id']), fill='white', font=font)
    for gx in range(0, W, 200):  # 坐标刻度，方便手动微调
        d.text((gx + 3, H - 30), str(gx), fill=(150, 150, 150), font=font.font_variant(size=20) if hasattr(font, 'font_variant') else font)
    for gy in range(0, H, 200):
        d.text((3, gy + 3), str(gy), fill=(150, 150, 150), font=font.font_variant(size=20) if hasattr(font, 'font_variant') else font)
    os.makedirs(OUT, exist_ok=True)
    json.dump(result, open(os.path.join(OUT, f'{n}.json'), 'w'), indent=1)
    preview.save(os.path.join(OUT, f'{n}.png'))
    return result


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('chapters', type=int, nargs='+')
    ap.add_argument('--gap', type=int, default=28, help='间距小于多少像素的线条算同一团')
    a = ap.parse_args()
    for n in a.chapters:
        print(n, len(propose(n, a.gap)), '个候选')
