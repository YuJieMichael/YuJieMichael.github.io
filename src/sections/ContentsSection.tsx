import { useRef } from 'react'
import { CHAPTER_COUNT, chapterImage } from '../data/content'
import { PROJECTS } from '../data/profile'
import { gsap, isFinePointer, prefersReducedMotion, useGSAP } from '../effects/gsap'
import { useLanguage } from '../i18n/LanguageContext'
import { SECTIONS } from '../lib/useCurrentSection'

const base = import.meta.env.BASE_URL

/**
 * 本期目录：整屏的大字目录，每行一个栏目和页码。
 * 鼠标划过一行，整行被狐狸橙从下往上刷满，一张预览图跟着鼠标飘；点一下跳过去。
 */
export default function ContentsSection() {
  const { t } = useLanguage()
  const root = useRef<HTMLElement>(null)
  const preview = useRef<HTMLDivElement>(null)

  const rows = [
    { id: 'work', title: t.workLabel, kicker: t.kickerWork(PROJECTS.length), img: `${base}projects/three-kingdoms/world.webp` },
    { id: 'experience', title: t.experienceTitle, kicker: t.kickerExperience, img: chapterImage(18, 'sm') },
    { id: 'skills', title: t.skillsTitle, kicker: t.kickerSkills, img: chapterImage(20, 'sm') },
    { id: 'about', title: t.aboutLabel, kicker: t.kickerAbout, img: `${base}avatar.webp` },
    { id: 'story', title: t.storyLabel, kicker: t.kickerStory(CHAPTER_COUNT), img: chapterImage(1, 'sm') },
    { id: 'contact', title: t.navContact, kicker: t.kickerContact, img: chapterImage(28, 'sm') },
  ]

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.ct-row > a', {
        yPercent: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.07,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.ct-rows', start: 'top 80%' },
      })
      gsap.from('.ct-title', {
        clipPath: 'inset(0 100% 0 0)',
        duration: 1.2,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: '.ct-title', start: 'top 85%' },
      })

      // 跟随鼠标的预览图
      const box = preview.current
      if (!box || !isFinePointer()) return
      const xTo = gsap.quickTo(box, 'x', { duration: 0.6, ease: 'power3' })
      const yTo = gsap.quickTo(box, 'y', { duration: 0.6, ease: 'power3' })
      const rTo = gsap.quickTo(box, 'rotation', { duration: 0.8, ease: 'power3' })
      let lastX = 0
      const onMove = (e: PointerEvent) => {
        xTo(e.clientX)
        yTo(e.clientY)
        rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6))
        lastX = e.clientX
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      return () => window.removeEventListener('pointermove', onMove)
    },
    { scope: root },
  )

  const show = (i: number) => {
    const box = preview.current
    if (!box || !isFinePointer() || prefersReducedMotion()) return
    gsap.to(box.querySelectorAll('img'), { opacity: (j: number) => (j === i ? 1 : 0), duration: 0.25, overwrite: true })
    gsap.to(box, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.7)', overwrite: 'auto' })
  }
  const hide = () => preview.current && gsap.to(preview.current, { scale: 0.4, opacity: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' })

  return (
    <section ref={root} id="contents" className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 md:px-12 md:py-28">
      <div className="flex items-end justify-between gap-6 border-b border-ink/20 pb-4">
        <h2 className="ct-title font-display text-[clamp(3rem,9vw,7.5rem)] italic leading-[0.9] text-ink">{t.contentsTitle}</h2>
        <p className="pb-2 font-mono text-xs uppercase tracking-[0.25em] text-muted">
          {t.issueNo} <span className="text-fox">/</span> {t.issueSeason}
        </p>
      </div>

      <ol className="ct-rows" onPointerLeave={hide}>
        {rows.map((r, i) => (
          <li key={r.id} className="ct-row overflow-hidden border-b border-ink/15">
            <a
              href={`#${r.id}`}
              onPointerEnter={() => show(i)}
              className="group relative flex items-baseline gap-4 py-4 md:gap-8 md:py-5"
            >
              <span aria-hidden className="absolute inset-0 origin-bottom scale-y-0 bg-fox transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-y-100" />
              <span className="relative w-10 shrink-0 font-mono text-xs text-fox transition-colors duration-300 group-hover:text-bg md:w-14 md:text-sm">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="relative min-w-0 flex-1 truncate font-display text-[clamp(2.2rem,6.5vw,5.5rem)] leading-[1.05] text-ink transition-[color,transform] duration-500 group-hover:translate-x-4 group-hover:italic group-hover:text-bg">
                {r.title}
              </span>
              <span className="relative hidden font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors duration-300 group-hover:text-bg/80 md:inline">
                {r.kicker}
              </span>
              <span className="relative w-12 shrink-0 text-right font-mono text-xs tabular-nums text-muted transition-colors duration-300 group-hover:text-bg md:text-sm">
                p.{String(SECTIONS.indexOf(r.id as (typeof SECTIONS)[number]) + 1).padStart(2, '0')}
              </span>
            </a>
          </li>
        ))}
      </ol>

      {/* 跟随鼠标的预览图：固定定位，中心对准指针 */}
      <div
        ref={preview}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-30 -ml-[150px] -mt-[100px] h-[200px] w-[300px] overflow-hidden rounded-xl border border-ink/20 bg-surface opacity-0 shadow-2xl"
        style={{ transform: 'scale(0.4)' }}
      >
        {rows.map((r) => (
          <img key={r.id} src={r.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0" />
        ))}
      </div>
    </section>
  )
}
