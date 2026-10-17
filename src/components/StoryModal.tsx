import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react'
import { marked } from 'marked'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { CHAPTER_COUNT, chapterImage, chapterMarkdown, chapterVideo } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'

interface StoryModalValue {
  open: (chapter: number) => void
}

const StoryModalContext = createContext<StoryModalValue>({ open: () => {} })

export const useStoryModal = () => useContext(StoryModalContext)

interface Story {
  title: string
  html: string
}

/** md 第一行 "# 标题" 拆出来做标题，其余渲染成正文 */
function parseStory(md: string): Story {
  const match = md.match(/^#\s+(.+)\n?/)
  const title = match ? match[1].trim() : ''
  const body = match ? md.slice(match[0].length) : md
  return { title, html: marked.parse(body, { async: false }) as string }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 点图片弹出的故事框：先播这一章的手绘短片，再读文字，可以前后翻章 */
export function StoryModalProvider({ children }: { children: ReactNode }) {
  const [chapter, setChapter] = useState<number | null>(null)
  const [story, setStory] = useState<Story | null>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { lang, t } = useLanguage()

  const open = useCallback((n: number) => setChapter(n), [])
  const close = useCallback(() => setChapter(null), [])
  const go = useCallback(
    (delta: number) =>
      setChapter((n) => (n === null ? n : Math.min(CHAPTER_COUNT, Math.max(1, n + delta)))),
    [],
  )

  useEffect(() => {
    if (chapter === null) return
    let cancelled = false
    setStory(null)
    setVideoFailed(false)
    const load = (l: string) =>
      fetch(chapterMarkdown(chapter, l)).then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
    // 当前语言的文字还没写好时，退回中文
    load(lang)
      .catch(() => (lang === 'zh' ? Promise.reject() : load('zh')))
      .then((md) => !cancelled && setStory(parseStory(md)))
      .catch(() => !cancelled && setStory({ title: t.chapter(chapter), html: `<p>${t.missing(chapter)}</p>` }))
    return () => {
      cancelled = true
    }
  }, [chapter, lang, t])

  useEffect(() => {
    if (chapter === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [chapter, close, go])

  const replay = () => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play().catch(() => {})
  }

  return (
    <StoryModalContext.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {chapter !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.article
              role="dialog"
              aria-modal="true"
              aria-label={story?.title ?? t.chapter(chapter)}
              className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-y-auto rounded-3xl border-2 border-[#D7E2EA] bg-[#0C0C0C] font-kanit text-[#D7E2EA]"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 手绘短片：一笔一笔画出这一章的画面 */}
              <div className="relative m-3 aspect-video shrink-0 overflow-hidden rounded-2xl bg-[#15161A] sm:m-4">
                {videoFailed || prefersReducedMotion() ? (
                  <img src={chapterImage(chapter, 'lg')} alt="" className="h-full w-full object-contain" />
                ) : (
                  <video
                    key={chapter}
                    ref={videoRef}
                    poster={chapterImage(chapter, 'lg')}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    className="h-full w-full object-contain"
                  >
                    {/* WebM 优先，不支持的浏览器用 MP4；两个都放不了就显示静态图 */}
                    <source src={chapterVideo(chapter, 'webm')} type="video/webm" />
                    <source
                      src={chapterVideo(chapter, 'mp4')}
                      type="video/mp4"
                      onError={() => setVideoFailed(true)}
                    />
                  </video>
                )}
                {!videoFailed && !prefersReducedMotion() && (
                  <button
                    type="button"
                    onClick={replay}
                    aria-label={t.replay}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-[#D7E2EA]/40 bg-[#0C0C0C]/70 px-3 py-1.5 text-xs uppercase tracking-wider text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70"
                  >
                    <RotateCcw size={14} />
                    {t.replay}
                  </button>
                )}
              </div>

              <button
                type="button"
                aria-label={t.close}
                onClick={close}
                className="absolute right-5 top-5 rounded-full bg-[#0C0C0C]/70 p-2 text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 sm:right-6 sm:top-6"
              >
                <X size={20} />
              </button>

              <div className="story-md flex flex-col gap-3 px-6 pb-2 pt-2 sm:px-10">
                <p className="text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/60 sm:text-sm">
                  {t.chapterOf(chapter, CHAPTER_COUNT)}
                </p>
                {story ? (
                  <>
                    <h2>{story.title}</h2>
                    <div dangerouslySetInnerHTML={{ __html: story.html }} />
                  </>
                ) : (
                  <p>{t.loading}</p>
                )}
              </div>

              <nav className="mt-auto flex items-center justify-between gap-3 border-t border-[#D7E2EA]/15 px-4 py-3 sm:px-8">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={chapter === 1}
                  className="flex items-center gap-1 rounded-full px-3 py-2 text-sm uppercase tracking-wider transition-opacity duration-200 hover:opacity-70 disabled:pointer-events-none disabled:opacity-25"
                >
                  <ChevronLeft size={18} />
                  {t.prev}
                </button>
                <span className="text-sm tabular-nums text-[#D7E2EA]/60">
                  {chapter} / {CHAPTER_COUNT}
                </span>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={chapter === CHAPTER_COUNT}
                  className="flex items-center gap-1 rounded-full px-3 py-2 text-sm uppercase tracking-wider transition-opacity duration-200 hover:opacity-70 disabled:pointer-events-none disabled:opacity-25"
                >
                  {t.next}
                  <ChevronRight size={18} />
                </button>
              </nav>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </StoryModalContext.Provider>
  )
}
