"""
把 28 章渲染成一整条英文手绘视频，并合上配音。

用法（在项目根目录）：
    python tools/handdraw/render_all.py
    python tools/handdraw/render_all.py --only 1 2 3     # 只渲染这几章（调试用）

时间轴：有 story/video/en/timeline.json（跑过配音脚本）就按真实配音；
        没有就按 storyboard.json 里按语速估算的时间（英文）。
分镜：  tools/handdraw/scenes/N.json 标好元素区域的章节，按叙事顺序逐个画；
        还没标的章节，整张图当作一个元素来画（照样是一笔一笔，只是不分先后）。
输出：  story/video/en/fox-program-en.mp4（有配音时带音轨）
"""
import argparse
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from handdraw import render  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
VIDEO = os.path.join(ROOT, 'story', 'video')
OUT = os.path.join(VIDEO, 'en')
SCENES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scenes')


def load_timeline():
    path = os.path.join(OUT, 'timeline.json')
    if os.path.exists(path):
        print('时间轴：真实配音 timeline.json')
        return {t['chapter']: (t['start'], t['end']) for t in json.load(open(path))}, True
    print('时间轴：还没有配音，按英文语速估算')
    sb = json.load(open(os.path.join(VIDEO, 'storyboard.json'), encoding='utf-8'))
    # storyboard 里的时间是按中文估的，英文另按字幕重新算
    srt = open(os.path.join(VIDEO, 'story.en.srt'), encoding='utf-8').read()
    return estimate_from_srt(srt, len(sb)), False


def estimate_from_srt(srt, chapters):
    """英文 SRT 里每章结束后有 1.2 秒空档，按空档把字幕分回各章"""
    import re
    times = [(_sec(a), _sec(b)) for a, b in re.findall(r'(\d\d:\d\d:\d\d,\d\d\d) --> (\d\d:\d\d:\d\d,\d\d\d)', srt)]
    spans, start, prev_end = {}, 0.0, 0.0
    n = 1
    for a, b in times:
        if a - prev_end > 1.0 and prev_end > 0:
            spans[n] = (start, a)
            n += 1
            start = a
        prev_end = b
    spans[n] = (start, prev_end + 1.2)
    durations = spans
    assert n == chapters, f'字幕分出 {n} 章，应为 {chapters} 章'
    return durations


def _sec(t):
    h, m, rest = t.split(':')
    s, ms = rest.split(',')
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', type=int, nargs='*')
    ap.add_argument('--width', type=int, default=1280)
    a = ap.parse_args()

    spans, has_voice = load_timeline()
    fps = 30
    # 每章时长取自整条时间轴的帧边界，保证所有片段拼起来和配音逐帧对齐
    durations = {n: (round(e * fps) - round(s * fps)) / fps for n, (s, e) in spans.items()}
    clips_dir = os.path.join(OUT, 'clips')
    os.makedirs(clips_dir, exist_ok=True)
    chapters = a.only or sorted(durations)
    clips = []
    for n in chapters:
        scene_path = os.path.join(SCENES, f'{n}.json')
        if os.path.exists(scene_path):
            cfg = json.load(open(scene_path, encoding='utf-8'))
            base = SCENES
        else:  # 还没标注：整张图一个元素
            cfg = {'image': f'images/{n}.png', 'regions': [{'name': f'第 {n} 章整图', 'box': [0, 0, 100000, 100000]}]}
            base = ROOT
        cfg['duration'] = durations[n]
        cfg['width'] = a.width
        cfg['fps'] = fps
        out = os.path.join(clips_dir, f'{n:02}.mp4')
        print(f'第 {n} 章（{durations[n]:.1f}s，{"已标注" if base == SCENES else "整图"}）')
        render(cfg, base, out)
        clips.append(out)

    if a.only:
        return
    listing = os.path.join(clips_dir, 'list.txt')
    open(listing, 'w').write(''.join(f"file '{os.path.basename(c)}'\n" for c in clips))
    silent = os.path.join(OUT, 'video-only.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listing, '-c', 'copy', silent], check=True)
    final = os.path.join(OUT, 'fox-program-en.mp4')
    voice = os.path.join(OUT, 'narration.en.mp3')
    if has_voice and os.path.exists(voice):
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', silent, '-i', voice, '-c:v', 'copy', '-c:a', 'aac',
                        '-b:a', '160k', '-shortest', final], check=True)
        print(f'完成（带配音）：{final}')
    else:
        os.replace(silent, final)
        print(f'完成（无配音）：{final}')


if __name__ == '__main__':
    main()
