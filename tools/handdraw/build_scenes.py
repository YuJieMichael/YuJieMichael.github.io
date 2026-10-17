"""
把 region_spec.py 里的标注转成渲染器用的 scenes/N.json，并画一张标注预览（各元素的允许区域 + 出场序号）。
用法（在项目根目录）：python tools/handdraw/build_scenes.py
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from region_spec import SPEC  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SCENES = os.path.join(HERE, 'scenes')
PROPOSALS = os.path.join(HERE, 'proposals')
COLORS = [(230, 70, 70), (40, 130, 230), (30, 160, 80), (220, 130, 20), (150, 70, 200), (0, 150, 160)]


def to_regions(n, spec, size):
    comps = {}
    path = os.path.join(PROPOSALS, f'{n}.json')
    if os.path.exists(path):
        comps = {c['id']: c['box'] for c in json.load(open(path))}
    regions = []
    for i, (name, parts) in enumerate(spec):
        boxes, polys = [], []
        if i == 0:  # 第一个元素兜底：没被任何元素认领的零碎线条，跟第一个元素一起画
            boxes.append([0, 0, size[0], size[1]])
        for p in parts:
            if isinstance(p, int):
                boxes.append(comps[p])
            elif 'box' in p:
                boxes.append(p['box'])
            else:
                polys.append(p['polygon'])
        r = {'name': name}
        if boxes:
            r['boxes'] = boxes
        if polys:
            r['polygon'] = polys[0]
            assert len(polys) == 1, f'第 {n} 章「{name}」只支持一个多边形'
        regions.append(r)
    return regions


def preview(n, img_path, regions, out):
    """各元素的「允许区域」（扣掉后出场元素之后真正落墨的地方）染色 + 序号"""
    im = Image.open(img_path).convert('RGB')
    W, H = im.size
    masks = []
    for r in regions:
        m = Image.new('L', (W, H), 0)
        d = ImageDraw.Draw(m)
        for x, y, w, h in r.get('boxes', []):
            d.rectangle([x, y, x + w, y + h], fill=1)
        if 'polygon' in r:
            d.polygon([tuple(p) for p in r['polygon']], fill=1)
        masks.append(np.asarray(m, bool))
    later = np.zeros((H, W), bool)
    allowed = [None] * len(masks)
    for i in range(len(masks) - 1, -1, -1):
        allowed[i] = masks[i] & ~later
        later |= masks[i]
    arr = np.asarray(im).astype(np.float32)
    ink = arr.mean(2) < 130
    tint = np.full_like(arr, 255)
    for i, a in enumerate(allowed):
        tint[a] = COLORS[i % len(COLORS)]
    out_arr = np.where(ink[..., None], tint * 0.85, 255 * 0.82 + tint * 0.18)
    pv = Image.fromarray(out_arr.astype(np.uint8))
    d = ImageDraw.Draw(pv)
    try:
        font = ImageFont.truetype('DejaVuSans-Bold.ttf', 30)
    except OSError:
        font = ImageFont.load_default()
    for i, a in enumerate(allowed):
        ys, xs = np.nonzero(a & ink)
        if len(xs):
            cx, cy = int(np.median(xs)), int(np.median(ys))
            d.ellipse([cx - 24, cy - 24, cx + 24, cy + 24], fill=COLORS[i % len(COLORS)])
            d.text((cx - 9, cy - 17), str(i + 1), fill='white', font=font)
    d.text((14, 10), f'{n}', fill=(60, 60, 60), font=font)
    pv.save(out)


def main():
    os.makedirs(SCENES, exist_ok=True)
    os.makedirs(os.path.join(HERE, 'previews'), exist_ok=True)
    for n, spec in sorted(SPEC.items()):
        img = os.path.join(ROOT, 'images', f'{n}.png')
        size = Image.open(img).size
        cfg = {'image': f'../../../images/{n}.png', 'regions': to_regions(n, spec, size)}
        json.dump(cfg, open(os.path.join(SCENES, f'{n}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        preview(n, img, cfg['regions'], os.path.join(HERE, 'previews', f'{n}.png'))
    print(f'{len(SPEC)} 章 → scenes/ 和 previews/')


if __name__ == '__main__':
    main()
