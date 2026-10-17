"""
用 OpenAI（ChatGPT 同款）语音给英文版逐章配音，并按真实音频长度重新对齐字幕和时间轴。
只用 Python 标准库 + 系统里的 ffmpeg / ffprobe。

用法（在项目根目录）：
    # Windows PowerShell:  $env:OPENAI_API_KEY="sk-..."
    # macOS / Linux:       export OPENAI_API_KEY=sk-...
    python tools/voiceover/make_voiceover.py
    python tools/voiceover/make_voiceover.py --voice coral --redo 5   # 换声音 / 只重做第 5 章

输出（story/video/en/）：
    voice/01.mp3 … 28.mp3      每章一段配音（已存在的会跳过，不重复花钱）
    narration.en.mp3           整条配音，章与章之间留白 PAD 秒
    story.en.srt               按真实音频重新计时的英文字幕
    timeline.json              每章开始 / 结束时间，渲染整条视频时用
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
VIDEO = os.path.join(ROOT, 'story', 'video')
OUT = os.path.join(VIDEO, 'en')
PAD = 1.2          # 每章配音结束后，画面多停留的秒数
MAX_CUE = 48       # 每条字幕最多字符数

DEFAULT_INSTRUCTIONS = (
    'Warm, friendly, slightly playful storyteller voice. A young developer telling '
    'his own story to a hiring manager: natural pace, light smile in the voice, '
    'short pauses at commas. Pronounce French names in French (Montréal, ÉTS, '
    'Dépanneur, Propriété En Vente).'
)


def tts(text, path, model, voice, instructions, key):
    body = {'model': model, 'voice': voice, 'input': text, 'response_format': 'mp3'}
    if instructions and model != 'tts-1' and model != 'tts-1-hd':
        body['instructions'] = instructions
    req = urllib.request.Request(
        'https://api.openai.com/v1/audio/speech',
        data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r, open(path, 'wb') as f:
            f.write(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f'OpenAI 返回错误 {e.code}：{e.read().decode(errors="replace")[:400]}')


def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                          '-of', 'default=nw=1:nk=1', path], capture_output=True, text=True)
    return float(out.stdout.strip())


def split_cues(text):
    parts = [p.strip() for p in re.findall(r'[^,.;:!?—()]+[,.;:!?—)]?\s*|[(]', text) if p.strip()]
    cues, cur = [], ''
    for p in parts:
        if cur and len(cur) + len(p) + 1 > MAX_CUE:
            cues.append(cur)
            cur = p
        else:
            cur = f'{cur} {p}'.strip()
    if cur:
        cues.append(cur)
    out = []
    for c in cues:  # 超长的单句按空格硬切
        while len(c) > MAX_CUE * 1.4:
            cut = c.rfind(' ', 0, MAX_CUE)
            if cut <= 0:
                cut = MAX_CUE
            out.append(c[:cut].strip())
            c = c[cut:].strip()
        out.append(c)
    return out


def ts(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default='gpt-4o-mini-tts', help='也可以用 tts-1 / tts-1-hd')
    ap.add_argument('--voice', default='ash', help='alloy / ash / coral / echo / fable / nova / onyx / sage / shimmer …')
    ap.add_argument('--instructions', default=DEFAULT_INSTRUCTIONS, help='语气要求（tts-1 不支持）')
    ap.add_argument('--redo', type=int, nargs='*', default=[], help='重新生成这几章')
    a = ap.parse_args()

    narration = json.load(open(os.path.join(VIDEO, 'narration.en.json'), encoding='utf-8'))
    os.makedirs(os.path.join(OUT, 'voice'), exist_ok=True)
    key = os.environ.get('OPENAI_API_KEY')

    files = []
    for item in narration:
        n = item['chapter']
        path = os.path.join(OUT, 'voice', f'{n:02}.mp3')
        if not os.path.exists(path) or n in a.redo:
            if not key:
                sys.exit('请先设置环境变量 OPENAI_API_KEY')
            print(f'配音第 {n} 章：{item["title"]}')
            tts(item['text'], path, a.model, a.voice, a.instructions, key)
        files.append(path)

    # 按真实音频长度排时间轴和字幕
    t, idx = 0.0, 1
    timeline, srt = [], []
    for item, path in zip(narration, files):
        d = duration(path)
        cues = split_cues(item['text'])
        total_chars = sum(len(c) for c in cues)
        start, cur = t, t
        for c in cues:
            span = d * len(c) / total_chars
            srt.append(f'{idx}\n{ts(cur)} --> {ts(cur + span)}\n{c}\n')
            idx += 1
            cur += span
        t = start + d + PAD
        timeline.append({'chapter': item['chapter'], 'start': round(start, 3), 'end': round(t, 3),
                         'audio': os.path.relpath(path, OUT)})
    open(os.path.join(OUT, 'story.en.srt'), 'w', encoding='utf-8').write('\n'.join(srt))
    json.dump(timeline, open(os.path.join(OUT, 'timeline.json'), 'w', encoding='utf-8'), indent=2)

    # 拼整条配音：每章音频放到时间轴上它的精确起点（而不是首尾相接），整条长度不会漂移
    inputs, filters = [], []
    for k, (path, seg) in enumerate(zip(files, timeline)):
        inputs += ['-i', path]
        ms = int(round(seg['start'] * 1000))
        filters.append(f'[{k}:a]aresample=44100,aformat=channel_layouts=mono,adelay={ms}[a{k}]')
    mix = ''.join(f'[a{k}]' for k in range(len(files)))
    filters.append(f'{mix}amix=inputs={len(files)}:normalize=0:duration=longest,apad=whole_dur={t:.3f}[out]')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(filters),
                    '-map', '[out]', '-c:a', 'libmp3lame', '-q:a', '3', os.path.join(OUT, 'narration.en.mp3')], check=True)
    print(f'完成：{len(files)} 章，总长 {t / 60:.1f} 分钟 → {OUT}')


if __name__ == '__main__':
    main()
