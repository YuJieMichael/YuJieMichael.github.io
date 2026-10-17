import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import StoryImage from '../components/StoryImage'
import { CHAPTER_COUNT, chapterMarkdown } from '../data/content'
import { gsap, useGSAP } from '../effects/gsap'
import { useLanguage } from '../i18n/LanguageContext'

/** 横向画册里挑出来的几章 */
const CHAPTERS = [1, 2, 5, 13, 18, 24, 28]

/** 读各章 md 的第一行标题 */
function useChapterTitles(lang: string) {
  const [titles, setTitles] = useState<Record<number, string>>({})
  useEffect(() => {
    let cancelled = false
    Promise.all(
      CHAPTERS.map((n) =>
        fetch(chapterMarkdown(n, lang))
          .then((r) => (r.ok ? r.text() : ''))
          .then((md) => [n, md.match(/^#\s+(.+)/)?.[1].trim() ?? ''] as const)
          .catch(() => [n, ''] as const),
      ),
    ).then((pairs) => !cancelled && setTitles(Object.fromEntries(pairs)))
    return () => {
      cancelled = true
    }
  }, [lang])
  return titles
}

/**
 * 故事画册：像翻杂志一样横向翻页。
 * 宽屏时整屏被钉住，往下滚 = 往右翻；每页的大号章节数字和图片以不同速度移动。
 * 手机或「减少动态效果」时改成手指左右滑。
 */
export default function StorySpread() {
  const { lang, t } = useLanguage()
  const titles = useChapterTitles(lang)
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const el = track.current!
        const distance = () => el.scrollWidth - window.innerWidth
        const scroll = gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
        })
        gsap.utils.toArray<HTMLElement>('.sp-page').forEach((page) => {
          const st = { trigger: page, containerAnimation: scroll, start: 'left right', end: 'right left', scrub: true }
          gsap.fromTo(page.querySelector('.sp-num'), { xPercent: 60 }, { xPercent: -60, ease: 'none', scrollTrigger: st })
          gsap.fromTo(page.querySelector('.sp-img'), { scale: 1.18, rotation: -3 }, { scale: 1, rotation: 0, ease: 'none', scrollTrigger: { ...st, end: 'center center' } })
        })
      })
    },
    { scope: root },
  )

  return (
    <div ref={root} className="relative flex items-center overflow-x-auto md:min-h-screen md:overflow-hidden md:motion-reduce:overflow-x-auto">
      <div ref={track} className="flex w-max snap-x snap-mandatory items-center gap-[8vw] px-5 py-16 md:snap-none md:px-[8vw]">
        {/* 封面页 */}
        <div className="flex w-[80vw] shrink-0 snap-start flex-col justify-center md:w-[42vw]">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-fox">{t.issueNo} — {t.storyLabel}</p>
          <h3 className="mt-4 font-display text-[clamp(3.5rem,9vw,8.5rem)] italic leading-[0.88] text-ink">{t.storyLabel}</h3>
          <p className="mt-6 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            {t.spreadHint} <ArrowRight size={14} className="text-fox" />
          </p>
        </div>

        {CHAPTERS.map((n, i) => (
          <figure key={n} className={`sp-page relative w-[80vw] shrink-0 snap-start md:w-[min(58vw,880px)] ${i % 2 ? 'md:translate-y-[6vh]' : 'md:-translate-y-[4vh]'}`}>
            <span aria-hidden className="sp-num outline-text pointer-events-none absolute -top-[0.62em] right-0 font-display text-[clamp(7rem,17vw,16rem)] leading-none">
              {String(n).padStart(2, '0')}
            </span>
            <div className="relative overflow-hidden rounded-lg border border-ink/15 bg-surface">
              <div className="sp-img">
                <StoryImage chapter={n} size="lg" className="aspect-video w-full object-cover" />
              </div>
            </div>
            <figcaption className="mt-4 flex items-baseline gap-4">
              <span className="shrink-0 font-mono text-xs text-fox">Fig. {String(n).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1 font-display text-2xl italic leading-tight text-ink md:text-3xl">{titles[n] ?? ' '}</span>
              <span className="hidden shrink-0 font-mono text-xs tabular-nums text-muted sm:inline">
                {n} / {CHAPTER_COUNT}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
