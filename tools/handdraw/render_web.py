"""
网站故事弹窗里播放的手绘短片：每章一段、深色主题、无声，输出到 public/videos/N.mp4 和 N.webm。
用法（在项目根目录）：python tools/handdraw/render_web.py [--only 1 2]
"""
import argparse
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from handdraw import render  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SCENES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scenes')
OUT = os.path.join(ROOT, 'public', 'videos')

ap = argparse.ArgumentParser()
ap.add_argument('--only', type=int, nargs='*')
ap.add_argument('--chapters', type=int, default=28)
a = ap.parse_args()
os.makedirs(OUT, exist_ok=True)
for n in a.only or range(1, a.chapters + 1):
    scene = os.path.join(SCENES, f'{n}.json')
    if os.path.exists(scene):
        cfg, base = json.load(open(scene, encoding='utf-8')), SCENES
    else:
        cfg, base = {'image': f'images/{n}.png', 'regions': [{'name': '整图', 'box': [0, 0, 100000, 100000]}]}, ROOT
    cfg.update(duration=5.5, width=960, fps=24, theme='dark', crf=30)
    print(f'第 {n} 章')
    mp4 = os.path.join(OUT, f'{n}.mp4')
    render(cfg, base, mp4)
    # 同时转一份 WebM（VP9），浏览器优先播放
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '42',
                    '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', '-an', mp4[:-4] + '.webm'], check=True)
