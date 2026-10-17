# Fox-Program

React 18 + TypeScript + Tailwind 3 + Framer Motion + lucide-react 的深色作品集落地页，
叠加了 Three.js 星空背景、布料按压鼠标效果和墨水点击特效。

```bash
npm install
npm run dev        # 本地预览 http://localhost:5173
npm run build      # 产物在 dist/
```

## 目录

| 路径 | 内容 |
|---|---|
| `src/sections/` | Hero → About → Work → Experience → Skills → Story（手绘跑马灯）→ Contact |
| `src/components/` 里的科技感效果 | `ScrambleText`（解码动画）、`Terminal`（首页打字终端）、`ScrollProgress`（阅读进度条）、`effects/spotlight.ts`（鼠标聚光） |
| GSAP 动效（`src/effects/gsap.ts` 注册插件） | `Preloader`（开场计数+掀幕）、`CursorFollower`（自定义光标）、`Magnetic`（磁吸按钮）、`TechMarquee`（随滚动速度变化的大字跑马灯）；首页入场时间线、视差和 3D 倾斜在 `HeroSection`；经历进度线、项目图片展开、技能依次出现在对应 section 里 |
| `src/components/` | ContactButton、FadeIn、AnimatedText（公共组件），StarfieldBackground、InkCanvas、StoryImage、StoryModal、ClothChars |
| `src/effects/cloth.ts` | 布料物理（GSAP ticker 驱动，`data-cloth` 元素用 matrix3d 形变） |
| `src/data/content.ts` | 章节数、图片和故事路径 |
| `src/data/profile.ts` | 个人资料：简介、联系方式、工作经历、教育、技能、项目（三语，来自简历） |
| `public/projects/` | 项目截图（如山河策的手机截图） |
| `images/` | 放原图 `1.png … N.png`（豆包按 `story/video/豆包生图清单.md` 生成的 16:9 简笔画） |
| `story/` | 故事章节对照表、主角参考图、手绘视频的字幕和分镜 |
| `tools/handdraw/` | 按叙事顺序一笔一笔手绘的视频渲染器 |
| `public/images/` | `npm run images` 压缩出的 webp（自动生成） |
| `public/stories/<zh\|en\|fr>/` | 每种语言每章一个 `N.md`（润色版正文），点图片弹出的内容 |
| `public/videos/` | 每章一段深色手绘短片，在故事弹窗里播放 |
| `src/i18n/strings.ts` | 中英法三语界面文案 |

## 换图和故事

1. 把 `1.png … N.png` 放进 `images/`
2. 运行 `npm run images`。每张图会压缩成 `N-sm.webp`（宽 840）和 `N-lg.webp`（宽 1920），
   几 MB 的 PNG 一般会压到 100–300 KB
3. 把每章 `# 标题 + 正文` 分别写进 `public/stories/zh/N.md`、`en/N.md`、`fr/N.md`（某种语言缺文件时，弹窗会显示中文原文）
4. 改 `src/data/content.ts` 里的 `CHAPTER_COUNT = N`

页面一共 34 个图位：人像 1 个、跑马灯 21 个、项目卡片 12 个。图位按顺序轮流对应第 1…N 章，
点哪张图就弹出那张图对应章节的 md。本地 webp 还没生成时，会先显示随机占位图。

## 故事弹窗

点任意一张图，弹窗会先播放这一章的手绘短片，再显示「第 N 章 · 共 28 章」、标题和正文；
底部可以翻到上一章 / 下一章，键盘 ← → 也能翻，Esc 关闭。

- 正文是润色版：每章独立成句、读起来连贯，只润色语言，不加原文没有的事实。
  逐字摘自原文的版本保留在 `story/故事章节.md`，生图和视频配音用的是那一版。
- 短片用 `python tools/handdraw/render_web.py` 生成（深色主题、每段约 5 秒、100 KB 左右）。脚本会同时输出 `.webm`，浏览器优先播放 WebM。

## 三语

- 每次打开都是英文；右上角「中 / EN / FR」切换只对当前这次浏览有效
- 可以直接分享指定语言的链接：`…/?lang=fr`、`…/?lang=en`、`…/?lang=zh`
- 界面文案都在 `src/i18n/strings.ts`；大标题放不下一行时会自动缩小字号

## 首页头像

`public/avatar.webp` 由主角参考图生成：线条改成浅色、背景透明，直接叠在星空上。换头像时运行：

```bash
python3 scripts/make-avatar.py story/reference/protagonist.webp public/avatar.webp
```

## 英文手绘视频

视频只做英文版：配音用 OpenAI（ChatGPT 同款）语音，画面用本地渲染器一笔一笔画出来。

**1. 配音**（在自己电脑上跑，需要 OpenAI API Key 和 ffmpeg）：

```bash
# Windows PowerShell: $env:OPENAI_API_KEY="sk-..."    macOS/Linux: export OPENAI_API_KEY=sk-...
python tools/voiceover/make_voiceover.py                 # 默认声音 ash
python tools/voiceover/make_voiceover.py --voice coral --redo 5   # 换声音、只重做第 5 章
```

读 `story/video/narration.en.json`（28 章英文配音稿），每章生成一段 mp3，已生成的不会重复生成。
然后按真实音频长度重排时间轴，输出到 `story/video/en/`：`narration.en.mp3`（整条配音）、
`story.en.srt`（重新计时的英文字幕）、`timeline.json`（每章起止时间）。

**2. 渲染整条视频**：

```bash
python tools/handdraw/render_all.py
```

输出 `story/video/en/fox-program-en.mp4`，画面和配音逐帧对齐。字幕单独是 `story.en.srt`，
在剪映里导入时可以自己调字体和位置。

- `tools/handdraw/scenes/N.json` 标好了元素区域的章节，按分镜顺序逐个元素画出来；
  还没标的章节整张图一起画。
- 渲染器只依赖 numpy、Pillow 和 ffmpeg，渲染过程不调用 AI。
  笔尖只在「允许掩码」里落墨：允许掩码 = 自己的区域 − 所有后出场的区域，后面的元素不会提前露出来。

## 加新项目

只改一个文件：`src/data/profile.ts` 里的 `PROJECTS` 数组。在里面加一段（放在哪个位置，网页上就排在第几个）：

```ts
  {
    name: 'Pet Saga',
    tagline: { zh: '一句话介绍', en: 'One-line pitch', fr: 'Accroche en une ligne' },
    period: { zh: '2026.10', en: 'Oct 2026', fr: 'oct. 2026' },
    description: {
      zh: '两三句话：做了什么、用了什么、亮点是什么。',
      en: 'Two or three sentences: what it does, how it is built, what stands out.',
      fr: 'Deux ou trois phrases : ce que ça fait, comment, ce qui le distingue.',
    },
    tags: ['React', 'TypeScript', 'Phaser'],
    live: 'https://yujiemichael.github.io/pet-saga/', // 没有在线版就删掉这一行
    repo: 'https://github.com/YuJieMichael/pet-saga', // 私有仓库就删掉这一行
    images: [
      { src: `${base}projects/pet-saga/1.webp` },
      { src: `${base}projects/pet-saga/2.webp` },
      { src: `${base}projects/pet-saga/3.webp` }, // 第三张显示得最大
    ],
    // phones: true, // 三张都是竖屏手机截图时打开，改成三张并排
  },
```

- **截图**放进 `public/projects/<项目名>/`，正好 3 张。`.webp` 最小，`.png` / `.jpg` 也能用
- 横屏截图：前两张叠在左边 40%，第三张占右边 60%；竖屏手机截图加 `phones: true`
- 没有截图时可以先用故事章节图占位：`{ chapter: 5 }`
- `live` 和 `repo` 都没有时，卡片上显示「内部项目」
- 其他地方会自动跟着变：本期目录里的「N projects」、关于区的项目数字、⌘K 命令面板里的「打开在线版 / 查看源码」
- 改完 `git push`，GitHub Actions 会自动重新发布，一两分钟后网站更新

## 杂志风版面

整页按一本杂志来排，每个区域用一种不同的大版面特效：

| 区域 | 文件 | 效果 |
|---|---|---|
| 封面 | `sections/HeroSection.tsx` | 刊号条 + 撑满一行的超大刊名 + 旋转圆形贴纸（`RotatingBadge`，滚得越快转得越快）；往下滚时刊名字距拉开、上飘淡出 |
| 本期目录 | `sections/ContentsSection.tsx` | 整屏大字目录带页码；划过一行时整行被橙色刷满、字变斜体，一张预览图跟着鼠标飘、随移动方向倾斜 |
| 关于 | `sections/AboutSection.tsx` | 整屏宽的「Montréal」大字，字里填着第 1 章的蒙特利尔天际线线稿，随滚动横向平移 |
| 摘录 | `sections/QuoteSection.tsx` | 整屏引文：宽屏时钉住，往下滚字一个个亮起来，巨大的引号和拍立得照片跟着转 |
| 经历 | `sections/ExperienceSection.tsx` | 背景里一整排描边年份「2020 — 2026」随滚动横向滑过 |
| 技能 | `sections/SkillsSection.tsx` | 字体样张：大号衬线字逐词升起；悬停一个词，其他词变暗 |
| 故事 | `sections/StorySpread.tsx` | 横向画册：宽屏时钉住，往下滚 = 往右翻页，大号章节数字和图片以不同速度移动；手机上用手指左右滑 |
| 封底 | `sections/ContactSection.tsx` | 撑满整屏宽的「Fox-Program」，字母从下面依次顶上来，悬停会跳一下 |
| 全站 | `components/EditorialChrome.tsx` | 胶片颗粒质感；宽屏左右两侧的竖排书眉（刊名期号 / 当前页码和栏目） |

- 页码顺序在 `src/lib/useCurrentSection.ts` 的 `SECTIONS`
- 期号、季节、封面贴纸文字、目录副标题、引文都在 `src/i18n/strings.ts`（`issueNo`、`issueSeason`、`badgeText`、`kicker*`、`quoteText`）
- 画册里挑的章节在 `StorySpread.tsx` 顶部的 `CHAPTERS`

## 联系方式和 Spectrum UI

- 邮箱、LinkedIn、GitHub、所在地都在 `src/data/profile.ts` 的 `CONTACT` 里，改这一处全站生效
- 电话没有放到网站上（公开会招来骚扰）；小红书、微信等以后有了，填进 `CONTACT` 再加一张卡片即可
- 用了 [Spectrum UI](https://ui.spectrumhq.in)（Apache-2.0）的 7 个组件，源码在 `src/components/spectrum/`，颜色都换成了本站配色，「减少动态效果」下不动：

| 组件 | 用在哪 | 效果 |
|---|---|---|
| `CommandPalette` | 全站，`SiteCommand.tsx` | 按 ⌘K / Ctrl+K 或 `/` 打开：跳到任一节、打开作品、读故事、复制邮箱、切换语言 |
| `DynamicIsland` | 全站，`SiteIsland.tsx` | 屏幕底部的灵动岛：显示「求职中 / 当前章节」，悬停展开名片，复制邮箱、切换语言时弹出提示 |
| `TextStates` | 灵动岛里的章节名 | 换章节时文字模糊上移、新文字从下方进来 |
| `KbdCombo` | 顶栏搜索按钮 | 3D 键帽，真按下 ⌘/Ctrl 和 K 时跟着按下去 |
| `NumberTicker` | 关于区的数字 | 滚到时每一位数字依次转到位 |
| `TiltCard` | 联系方式卡片 | 随鼠标 3D 倾斜，内容分层浮起，带光泽 |
| `Dock` | 联系区快捷图标 | 仿 macOS Dock，靠近放大，点击弹一下 |

- 命令面板里的条目在 `src/components/SiteCommand.tsx` 增删；要让别的组件在灵动岛弹提示，调用 `useIsland().notify('文字')`

## GSAP 动效开关

- 开场动画每个浏览器会话只播一次（记在 sessionStorage）；想每次都看，清掉 `fox-program-intro-seen`
- 系统开启「减少动态效果」时，开场、光标、跑马灯、入场和滚动动画全部跳过，内容直接显示
- 自定义光标只在鼠标设备上启用；给任意元素加 `data-cursor="文字"`，光标移上去会放大并显示这段文字

## 调整效果强度

- 布料：调 `src/effects/cloth.ts` 顶部的 `PRESS_DEPTH`（按压深度）、`PULL`（拉扯）、
  `PRESS_RADIUS`（影响半径）、`DAMPING`（阻尼）、`MAX_OFFSET`（最大位移）。
  想让某个元素跟着布料动，就给它加 `data-cloth` 属性。
  注意：这个元素自身不能再有别的 transform。
- 点击特效：调 `src/components/InkCanvas.tsx` 顶部的 `BURST_RADIUS`（大小，现在 70px）、`BURST_OPACITY`（浓淡）、`BURST_GROW` / `BURST_FADE`（扩散和淡出时间）、`TRAIL_LIFE`（拖动轨迹停留时间）

## 安装 Git 和 TortoiseGit（Windows）

1. Git for Windows：https://git-scm.com/download/win ，安装时一路默认
2. TortoiseGit：https://tortoisegit.org/download/ ，同一页还有中文语言包
3. 右键 → TortoiseGit → 设置：
   - 常规 → Git.exe 路径：`C:\Program Files\Git\bin`
   - Git → 填写名字和邮箱，作用范围选“全局”
   - 网络 → SSH 客户端：`C:\Program Files\Git\usr\bin\ssh.exe`（用 OpenSSH 的密钥，不用 PuTTY 的 .ppk）
4. 命令行确认：`git --version`

## 连不上 GitHub：改 hosts

hosts 只能解决 DNS 被污染，解决不了 IP 被封。GitHub 的 IP 也会变，所以别把 IP 写死，用时再查最新的：

1. 从 GitHub520 这类定时更新的项目，或 ipaddress.com 查询，拿到
   `github.com`、`github.global.ssl.fastly.net`、`assets-cdn.github.com`、`raw.githubusercontent.com` 等域名当前的 IP
2. 用管理员身份打开记事本，编辑 `C:\Windows\System32\drivers\etc\hosts`，
   每行写一条 `IP 域名`
3. 在命令行运行 `ipconfig /flushdns`

## 部署到 GitHub Pages

项目里已带 `.github/workflows/deploy.yml`：

1. 在 GitHub 新建仓库。仓库名用 `<你的用户名>.github.io`，网址就是 `https://<用户名>.github.io/`；
   用其他名字（比如 `fox-program`），网址是 `https://<用户名>.github.io/fox-program/`。base 路径会自动处理
2. 仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**
3. 在项目目录下执行：
   ```bash
   git init
   git add .
   git commit -m "feat: fox-program 首版"
   git branch -M main
   git remote add origin https://github.com/<用户名>/<仓库名>.git
   git push -u origin main
   ```
   用 TortoiseGit 的话：右键 → Git 在这里创建版本库 → 提交 → 推送
4. 在 Actions 页面等构建变绿，就能打开网址了

参考：https://docs.github.com/en/pages
