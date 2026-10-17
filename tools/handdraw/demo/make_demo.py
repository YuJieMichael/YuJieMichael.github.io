"""画一张「手绘风格」测试图（第 1 章：初到蒙特利尔），并写出对应的 scene.json。
真实使用时，这张图由豆包按《豆包生图清单-手绘版》生成。"""
import json, math, random
from PIL import Image, ImageDraw

random.seed(7)
W, H = 1600, 900
PAPER, INK = (236, 224, 198), (52, 38, 30)
img = Image.new('RGB', (W, H), PAPER)
d = ImageDraw.Draw(img)

def wobbly(points, width=5):
    """手绘感：每段线加一点抖动"""
    out = []
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        n = max(2, int(math.dist((x0, y0), (x1, y1)) / 18))
        for k in range(n):
            t = k / n
            out.append((x0 + (x1 - x0) * t + random.uniform(-1.2, 1.2), y0 + (y1 - y0) * t + random.uniform(-1.2, 1.2)))
    out.append(points[-1])
    d.line(out, fill=INK, width=width, joint='curve')

def shape(points, fill, width=5):
    d.polygon(points, fill=fill)
    wobbly(points + [points[0]], width)

# 1. 城市天际线 + 皇家山十字架（左上）
hill = [(80, 430), (160, 330), (260, 290), (360, 320), (440, 430)]
shape(hill, (190, 210, 160))
wobbly([(270, 290), (270, 215)], 6); wobbly([(245, 240), (295, 240)], 6)
for x, h in [(470, 190), (540, 260), (620, 150), (690, 220)]:
    shape([(x, 430), (x, 430 - h), (x + 58, 430 - h), (x + 58, 430)], (176, 196, 214))
    for wy in range(430 - h + 25, 420, 40):
        d.rectangle([x + 16, wy, x + 26, wy + 14], fill=INK); d.rectangle([x + 34, wy, x + 44, wy + 14], fill=INK)
wobbly([(70, 432), (760, 432)], 5)

# 2. 机场出口的玻璃门（右侧）
shape([(1180, 180), (1180, 640), (1470, 640), (1470, 180)], (205, 226, 232))
wobbly([(1325, 180), (1325, 640)], 5)
for gy in (300, 420, 540): wobbly([(1180, gy), (1470, gy)], 3)
shape([(1230, 120), (1420, 120), (1420, 160), (1230, 160)], (120, 170, 120))
wobbly([(1300, 140), (1350, 140)], 5); wobbly([(1335, 128), (1352, 140), (1335, 152)], 5)

# 3. 主角拖着行李箱（中下）
cx, top = 820, 470
d.ellipse([cx - 45, top, cx + 45, top + 90], fill=(240, 205, 170)); d.ellipse([cx - 45, top, cx + 45, top + 90], outline=INK, width=5)
d.ellipse([cx - 20, top + 35, cx - 10, top + 45], fill=INK); d.ellipse([cx + 10, top + 35, cx + 20, top + 45], fill=INK)
d.arc([cx - 18, top + 45, cx + 18, top + 70], 20, 160, fill=INK, width=4)
d.chord([cx - 48, top - 8, cx + 48, top + 50], 180, 360, fill=INK)
shape([(cx - 55, top + 100), (cx + 55, top + 100), (cx + 65, top + 260), (cx - 65, top + 260)], (110, 140, 200))
wobbly([(cx - 30, top + 260), (cx - 35, top + 380)], 9); wobbly([(cx + 30, top + 260), (cx + 35, top + 380)], 9)
wobbly([(cx + 55, top + 120), (cx + 120, top + 210)], 8)
shape([(cx + 105, top + 230), (cx + 215, top + 230), (cx + 215, top + 370), (cx + 105, top + 370)], (225, 130, 90))
wobbly([(cx + 120, top + 210), (cx + 120, top + 230)], 6)
for wx in (cx + 120, cx + 200): d.ellipse([wx - 9, top + 370, wx + 9, top + 388], fill=INK)

# 4. 头顶的对勾气泡
bx, by = 960, 300
d.ellipse([bx - 80, by - 70, bx + 80, by + 70], fill=(250, 246, 236)); d.ellipse([bx - 80, by - 70, bx + 80, by + 70], outline=INK, width=5)
for r, (px, py) in [(14, (bx - 70, by + 85)), (9, (bx - 98, by + 115))]:
    d.ellipse([px - r, py - r, px + r, py + r], fill=(250, 246, 236), outline=INK, width=4)
wobbly([(bx - 35, by), (bx - 8, by + 30), (bx + 40, by - 30)], 10)

img.save('scene1.png')
json.dump({
    'image': 'scene1.png', 'duration': 9.5, 'width': 1280, 'fps': 30,
    'regions': [
        {'name': '城市天际线与皇家山', 'box': [60, 150, 720, 300]},
        {'name': '机场出口的玻璃门', 'box': [1160, 100, 330, 560]},
        {'name': '拖着行李箱的主角', 'box': [740, 450, 320, 420]},
        {'name': '头顶的对勾气泡', 'box': [840, 215, 260, 245]},
    ],
}, open('scene1.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok')
