import { useRef } from 'react'
import StoryImage from '../components/StoryImage'
import { gsap, useGSAP } from '../effects/gsap'
import { useLanguage } from '../i18n/LanguageContext'

/**
 * 摘录页：整屏一句大字引文。
 * 宽屏时这一屏被钉住，往下滚，字一个个从暗处亮起来，巨大的引号跟着转。
 */
export default function QuoteSection() {
  const { lang, t } = useLanguage()
  const root = useRef<HTMLElement>(null)
  // 中文没有空格，按字拆；英法按词拆
  const words = lang === 'zh' ? Array.from(t.quoteText) : t.quoteText.split(' ').map((w) => `${w} `)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(
        { wide: '(min-width: 768px)', motion: '(prefers-reduced-motion: no-preference)' },
        (ctx) => {
          const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean }
          if (!motion) {
            gsap.set('.qt-w', { opacity: 1 })
            return
          }
          const tl = gsap.timeline({
            scrollTrigger: wide
              ? { trigger: root.current, start: 'top top', end: '+=130%', pin: true, scrub: 0.6 }
              : { trigger: root.current, start: 'top 70%', end: 'bottom 70%', scrub: 0.6 },
          })
          tl.to('.qt-w', { opacity: 1, stagger: 0.12, ease: 'none' })
            .fromTo('.qt-mark', { rotation: -25, scale: 0.6 }, { rotation: 0, scale: 1, ease: 'none', duration: tl.duration() }, 0)
            .fromTo('.qt-fig', { y: 120, rotation: 12 }, { y: 0, rotation: -5, ease: 'none', duration: tl.duration() }, 0)
        },
      )
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  )

  return (
    <section ref={root} id="quote" className="relative flex min-h-screen items-center overflow-hidden py-24">
      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 md:px-12">
        <span aria-hidden className="qt-mark absolute -left-1 -top-[0.42em] font-display text-[clamp(11rem,30vw,25rem)] leading-none text-fox md:left-4">
          “
        </span>
        <blockquote className="relative font-display text-[clamp(2.1rem,5.4vw,4.8rem)] leading-[1.08] tracking-[-0.01em] text-ink">
          {words.map((w, i) => (
            <span key={i} className="qt-w opacity-[0.13]">
              {w}
            </span>
          ))}
        </blockquote>
        <div className="mt-12 flex items-center gap-6">
          <div className="qt-fig w-40 shrink-0 rounded-md bg-ink p-2 pb-6 shadow-2xl md:w-56">
            <StoryImage chapter={1} className="aspect-video w-full rounded-sm bg-bg object-cover" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted md:text-sm">{t.quoteSource}</p>
        </div>
      </div>
    </section>
  )
}
