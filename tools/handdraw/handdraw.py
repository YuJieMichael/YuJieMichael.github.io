"""
按叙事顺序「一笔一笔真手绘」的渲染器。纯计算，不调用任何 AI。
只依赖 numpy、Pillow 和系统里的 ffmpeg。

用法：
    python handdraw.py scene.json -o out.mp4

scene.json：
{
  "image": "scene1.png",            # 原图：浅色纸底、深色线条、元素彼此分开
  "duration": 9.5,                  # 这一幕总时长（秒），一般来自字幕时间
  "width": 1280, "fps": 30,         # 输出尺寸（16:9），原图等比缩放后居中
  "regions": [                      # 按出场顺序，每个元素一块区域
    {"name": "城市天际线", "box": [x, y, w, h]},
    {"name": "猫耳朵", "boxes": [[x, y, w, h], [x, y, w, h]]},
    {"name": "主角", "polygon": [[x, y], ...]}
  ],
  "protect": [{"box": [x, y, w, h]}]  # 可选：任何元素都不许画的保护区
}

核心是「允许掩码」：allowed[i] = 区域[i] − 所有后出场的区域 − 保护区。
笔尖只能在 allowed[i] 里落墨，后出场元素的位置早被挖空，所以绝不会提前露出来。
所有元素共享同一张画布，画完的留在画布上，下一个接着往上画。
每个元素先画线稿、再上色（时间 2:1）；简笔画这种没有颜色的元素，全部时间都用来画线。
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

HOLD_SECONDS = 1.5      # 整幕画完后停留
LINE_SHARE = 2 / 3      # 有颜色的元素：线稿占 2/3，上色占 1/3
MIN_SHARE = 0.4         # 时间分配里平均分的部分，避免小元素一闪而过


# ---------- 区域 ----------

def region_mask(region, size, scale, offset):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    boxes = region.get('boxes') or ([region['box']] if 'box' in region else [])
    polys = [[(x, y), (x + w, y), (x + w, y + h), (x, y + h)] for x, y, w, h in boxes]
    if 'polygon' in region:
        polys.append(region['polygon'])
    for poly in polys:
        d.polygon([(x * scale + offset[0], y * scale + offset[1]) for x, y in poly], fill=1)
    return np.asarray(m, bool)


def allowed_masks(regions, protect):
    """allowed[i] = regions[i] − ∪ regions[j>i] − protect"""
    later = np.zeros_like(regions[0])
    out = [None] * len(regions)
    for i in range(len(regions) - 1, -1, -1):
        out[i] = regions[i] & ~later & ~protect
        later |= regions[i]
    return out


# ---------- 线稿 → 骨架 → 连续轨迹 ----------

def thin(mask):
    """Zhang-Suen 细化：把有粗细的线条收成 1 像素宽的骨架"""
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        return mask.copy()
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    img = np.pad(mask[y0:y1, x0:x1].astype(np.uint8), 1)
    while True:
        changed = False
        for step in (0, 1):
            P = img
            p2, p3, p4 = P[:-2, 1:-1], P[:-2, 2:], P[1:-1, 2:]
            p5, p6, p7 = P[2:, 2:], P[2:, 1:-1], P[2:, :-2]
            p8, p9, c = P[1:-1, :-2], P[:-2, :-2], P[1:-1, 1:-1]
            B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
            seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2]
            A = sum(((seq[k] == 0) & (seq[k + 1] == 1)).astype(np.uint8) for k in range(8))
            if step == 0:
                m1, m2 = p2 * p4 * p6, p4 * p6 * p8
            else:
                m1, m2 = p2 * p4 * p8, p2 * p6 * p8
            rem = (c == 1) & (B >= 2) & (B <= 6) & (A == 1) & (m1 == 0) & (m2 == 0)
            if rem.any():
                c[rem] = 0
                changed = True
        if not changed:
            break
    out = np.zeros_like(mask)
    out[y0:y1, x0:x1] = img[1:-1, 1:-1].astype(bool)
    return out


NEIGHBORS = ((1, 0), (0, 1), (-1, 0), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1))


def trace_path(skel, start):
    """把骨架像素串成连续轨迹：沿 8 邻域一路走，走不动就抬笔跳到最近的未画像素。
    返回 [(x, y, 落笔?)]，抬笔点是笔在空中移动到下一笔起点。"""
    ys, xs = np.nonzero(skel)
    n = len(xs)
    if n == 0:
        return []
    index = {(int(x), int(y)): i for i, (x, y) in enumerate(zip(xs, ys))}
    visited = np.zeros(n, bool)
    deg = np.array([sum((x + dx, y + dy) in index for dx, dy in NEIGHBORS) for x, y in zip(xs, ys)])
    path = []

    def nearest(px, py, prefer_ends=True):
        d = (xs - px) ** 2 + (ys - py) ** 2
        d = np.where(visited, np.inf, d)
        if prefer_ends:  # 优先从线头起笔，笔画更像人画的
            d = d + np.where(deg <= 1, 0, 400)
        return int(np.argmin(d))

    cur = nearest(*start)
    path.append((int(xs[cur]), int(ys[cur]), False))
    left = n
    while left:
        visited[cur] = True
        left -= 1
        x, y = int(xs[cur]), int(ys[cur])
        path.append((x, y, True))
        nxt = None
        for dx, dy in NEIGHBORS:
            j = index.get((x + dx, y + dy))
            if j is not None and not visited[j]:
                nxt = j
                break
        if nxt is None:
            if not left:
                break
            nxt = nearest(x, y)
            path.append((int(xs[nxt]), int(ys[nxt]), False))
        cur = nxt
    return path


def disk(r):
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    keep = xx ** 2 + yy ** 2 <= r * r
    return xx[keep], yy[keep]


# ---------- 画笔 ----------

def draw_pencil(im, x, y, down):
    """斜放的一支铅笔，笔尖在 (x, y)；抬笔时笔尖离纸一点"""
    d = ImageDraw.Draw(im)
    lift = 0 if down else 7
    tx, ty = x + lift, y - lift
    ux, uy = 0.53, -0.85  # 笔杆方向（右上）
    nx, ny = -uy, ux
    L, Wd, T = 150, 11, 24
    ax, ay = tx + ux * T, ty + uy * T
    body = [(ax + nx * Wd, ay + ny * Wd), (ax - nx * Wd, ay - ny * Wd),
            (ax - nx * Wd + ux * L, ay - ny * Wd + uy * L), (ax + nx * Wd + ux * L, ay + ny * Wd + uy * L)]
    d.polygon(body, fill=(235, 170, 60), outline=(90, 60, 30))
    d.polygon([(tx, ty), body[0], body[1]], fill=(230, 200, 150), outline=(90, 60, 30))
    d.polygon([(tx, ty), (tx + ux * 9 + nx * 3.5, ty + uy * 9 + ny * 3.5), (tx + ux * 9 - nx * 3.5, ty + uy * 9 - ny * 3.5)], fill=(40, 40, 40))
    ex, ey = ax + ux * L, ay + uy * L
    d.polygon([(ex + nx * Wd, ey + ny * Wd), (ex - nx * Wd, ey - ny * Wd),
               (ex - nx * Wd + ux * 16, ey - ny * Wd + uy * 16), (ex + nx * Wd + ux * 16, ey + ny * Wd + uy * 16)], fill=(220, 140, 140))


# ---------- 渲染 ----------

def render(cfg, base_dir, out_path):
    W = cfg.get('width', 1280)
    H = round(W * 9 / 16)
    fps = cfg.get('fps', 30)
    src = Image.open(os.path.join(base_dir, cfg['image'])).convert('RGB')
    sw, sh = src.size
    scale = min(W / sw, H / sh)
    nw, nh = round(sw * scale), round(sh * scale)
    ox, oy = (W - nw) // 2, (H - nh) // 2
    arr = np.asarray(src)
    border = np.concatenate([arr[:5].reshape(-1, 3), arr[-5:].reshape(-1, 3), arr[:, :5].reshape(-1, 3), arr[:, -5:].reshape(-1, 3)])
    paper = np.median(border, 0).astype(np.uint8)
    page = Image.new('RGB', (W, H), tuple(int(v) for v in paper))
    page.paste(src.resize((nw, nh), Image.LANCZOS), (ox, oy))
    img = np.asarray(page).copy()

    regions = [region_mask(r, (W, H), scale, (ox, oy)) for r in cfg['regions']]
    protect = np.zeros((H, W), bool)
    for p in cfg.get('protect', []):
        protect |= region_mask(p, (W, H), scale, (ox, oy))
    allowed = allowed_masks(regions, protect)

    gray = img.astype(np.int16).mean(2)
    paper_gray = float(paper.astype(np.int16).mean())
    ink = (gray < paper_gray - 70) & (gray < 130)
    # 有颜色 = 饱和度明显（线条边缘的灰色抗锯齿像素不算颜色）
    chroma = img.max(2).astype(np.int16) - img.min(2).astype(np.int16)
    colored = (chroma > 25) & (np.abs(img.astype(np.int16) - paper.astype(np.int16)).max(2) > 30) & ~ink

    # 画布：区域以外直接用原图（就是纸），区域以内先铺空白纸
    canvas = img.copy()
    canvas[np.any(np.stack(allowed), 0)] = paper

    # 帧预算精确等于 duration：画的帧 + 停留帧 = round(duration × fps)，拼长视频时不会累积漂移
    total = float(cfg['duration'])
    total_frames = max(len(allowed) + 1, round(total * fps))
    hold_frames = min(round(HOLD_SECONDS * fps), round(total_frames * 0.35))
    draw_frames = total_frames - hold_frames
    work = np.array([max(int((ink & a).sum()), 1) for a in allowed], float)
    shares = (1 - MIN_SHARE) * work / work.sum() + MIN_SHARE / len(work)
    # 累计取整分配帧数，保证各元素帧数之和正好等于 draw_frames
    bounds = np.round(np.concatenate([[0], np.cumsum(shares)]) * draw_frames).astype(int)
    frame_alloc = [max(1, int(b - a)) for a, b in zip(bounds[:-1], bounds[1:])]

    proc = subprocess.Popen(
        ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
         '-r', str(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', str(cfg.get('crf', 20)),
         '-movflags', '+faststart', out_path],
        stdin=subprocess.PIPE)
    frames = 0

    # "theme": "dark" → 深色卡片 + 浅色线条（和网站一致），铅笔保持原色
    dark = cfg.get('theme') == 'dark'
    card = np.array([0x15, 0x16, 0x1A], np.float32)
    line = np.array([0xD7, 0xE2, 0xEA], np.float32)

    def to_theme(arr):
        if not dark:
            return arr
        a = np.clip((235 - arr.mean(2, dtype=np.float32)) / 195, 0, 1)[..., None]
        return (card + a * (line - card)).astype(np.uint8)

    def emit(pen=None, down=True):
        nonlocal frames
        frame = to_theme(canvas)
        if pen is not None:
            im = Image.fromarray(frame)
            draw_pencil(im, pen[0], pen[1], down)
            frame = np.asarray(im)
        proc.stdin.write(np.ascontiguousarray(frame).tobytes())
        frames += 1

    pen = (W // 2, H // 2)
    for i, (mask, n_frames) in enumerate(zip(allowed, frame_alloc)):
        name = cfg['regions'][i].get('name', f'#{i + 1}')
        region_ink = ink & mask
        has_color = (colored & mask).sum() > 0.01 * max(mask.sum(), 1)
        t = n_frames / fps
        if has_color and n_frames >= 2:
            line_frames = max(1, min(n_frames - 1, round(n_frames * LINE_SHARE)))
            fill_frames = n_frames - line_frames
        else:
            has_color = has_color and n_frames >= 2
            line_frames, fill_frames = n_frames, 0

        # 1) 线稿：笔尖沿骨架走，经过处把允许区里的墨线揭开
        skel = thin(region_ink)
        r = max(2, int(np.ceil(region_ink.sum() / max(skel.sum(), 1) / 2)) + 1)  # 按线宽估笔尖半径
        dx, dy = disk(r)
        path = trace_path(skel, pen)
        print(f'  {i + 1}. {name}: 骨架 {int(skel.sum())} px，{"线稿+上色" if has_color else "纯线稿"}，{t:.1f}s', file=sys.stderr)
        per = max(1, int(np.ceil(len(path) / line_frames))) if path else 1
        for k in range(line_frames):
            seg = path[k * per:(k + 1) * per]
            down_pts = np.array([(x, y) for x, y, dn in seg if dn], int).reshape(-1, 2)
            if len(down_pts):
                px = (down_pts[:, :1] + dx).ravel().clip(0, W - 1)
                py = (down_pts[:, 1:] + dy).ravel().clip(0, H - 1)
                hit = np.zeros((H, W), bool)
                hit[py, px] = True
                newly = hit & region_ink
                canvas[newly] = img[newly]
            if seg:
                pen = (seg[-1][0], seg[-1][1])
            emit(pen, bool(seg[-1][2]) if seg else False)
        canvas[region_ink] = img[region_ink]  # 收尾：线稿补齐

        # 2) 上色：自上而下扫过允许区，把原图颜色刷回来
        if has_color:
            ys = np.nonzero(mask.any(1))[0]
            xs = np.nonzero(mask.any(0))[0]
            y0, y1 = ys.min(), ys.max() + 1
            prev = y0
            for k in range(fill_frames):
                y = y0 + round((y1 - y0) * (k + 1) / fill_frames)
                band = np.zeros((H, W), bool)
                band[prev:y] = True
                newly = band & mask
                canvas[newly] = img[newly]
                prev = y
                sweep_x = xs[0] + (xs[-1] - xs[0]) * (0.5 + 0.45 * np.sin(k * 0.6))
                emit((int(sweep_x), int(min(y, H - 1))), True)
        canvas[mask] = img[mask]

    # 3) 停留：笔移开，整幅画停住
    remaining = max(total_frames - frames, 0)
    for _ in range(remaining):
        emit()
    proc.stdin.close()
    proc.wait()
    print(f'完成：{out_path}，{frames} 帧，{frames / fps:.1f} 秒', file=sys.stderr)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('scene')
    ap.add_argument('-o', '--out', default='scene.mp4')
    a = ap.parse_args()
    cfg = json.load(open(a.scene, encoding='utf-8'))
    render(cfg, os.path.dirname(os.path.abspath(a.scene)), a.out)
