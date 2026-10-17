"""把白底黑线的简笔画头像转成深色网页用的版本：线条改成 #D7E2EA，背景透明。
用法：python3 scripts/make-avatar.py story/reference/protagonist.webp public/avatar.webp"""
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('L')
a = np.asarray(im).astype(np.float32)
# 越黑越不透明；把纸色的轻微噪点压掉
alpha = np.clip((235 - a) / (235 - 40), 0, 1) * 255
rgba = np.zeros((*a.shape, 4), np.uint8)
rgba[..., 0], rgba[..., 1], rgba[..., 2] = 0xD7, 0xE2, 0xEA
rgba[..., 3] = alpha.astype(np.uint8)
out = Image.fromarray(rgba, 'RGBA')
bbox = out.getbbox()
out = out.crop(bbox)
out.thumbnail((900, 900), Image.LANCZOS)
out.save(dst, 'WEBP', quality=88, method=6)
print(dst, out.size)
