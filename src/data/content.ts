/**
 * 图片 / 故事资源配置。
 * 故事拆成 N 章后：images/1.png … images/N.png 放进项目根目录 images/，
 * 运行 `npm run images` 压缩成 public/images/N-sm.webp 和 N-lg.webp；
 * 每章正文按语言放在 public/stories/<zh|en|fr>/N.md。
 */
export const CHAPTER_COUNT = 28

const base = import.meta.env.BASE_URL

/** 页面上的第 slot 个图位（从 0 开始）对应第几章，章节不够时循环使用 */
export const chapterForSlot = (slot: number) => (slot % CHAPTER_COUNT) + 1

export const chapterImage = (chapter: number, size: 'sm' | 'lg' = 'sm') =>
  `${base}images/${chapter}-${size}.webp`

/** 本地压缩图还不存在时的临时随机图，回头替换完图片会自动失效 */
export const placeholderImage = (chapter: number, size: 'sm' | 'lg' = 'sm') =>
  size === 'sm'
    ? `https://picsum.photos/seed/fox-program-${chapter}/840/540`
    : `https://picsum.photos/seed/fox-program-${chapter}/1600/900`

/** 每章的手绘短片（tools/handdraw/render_web.py 生成） */
export const chapterVideo = (chapter: number, ext: 'webm' | 'mp4') => `${base}videos/${chapter}.${ext}`

export const chapterMarkdown = (chapter: number, lang: string) =>
  `${base}stories/${lang}/${chapter}.md`

/** 跑马灯 21 张：图位 0–20，按时间顺序显示第 1–21 章 */
export const MARQUEE_COUNT = 21
