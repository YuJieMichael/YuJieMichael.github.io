import { useRef } from 'react'
import SectionHeading from '../components/SectionHeading'
import { EDUCATION, EXPERIENCE } from '../data/profile'
import { gsap, prefersReducedMotion, useGSAP } from '../effects/gsap'
import { useLanguage } from '../i18n/LanguageContext'

/** 工作经历时间线：左侧狐狸橙进度线随滚动画出来，每段经历依次滑入 */
export default function ExperienceSection() {
  const { lang, t } = useLanguage()
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '.xp-progress',
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.xp-list', start: 'top 70%', end: 'bottom 55%', scrub: 0.6 } },
      )
      gsap.utils.toArray<HTMLElement>('.xp-item').forEach((item) => {
        gsap
          .timeline({ scrollTrigger: { trigger: item, start: 'top 80%' } })
          .from(item.querySelector('.xp-dot'), { scale: 0, duration: 0.5, ease: 'back.out(3)' })
          .from(item.querySelectorAll('.xp-in'), { x: -28, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out' }, 0.05)
      })
      gsap.fromTo('.xp-years', { xPercent: 5 }, { xPercent: -45, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.from('.edu-card', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.edu-list', start: 'top 85%' },
      })
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  )

  return (
    <section ref={root} id="experience" className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 md:px-12 md:py-28">
      {/* 背景：一整排描边年份，随滚动横向滑过 */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-40 -z-[1] w-screen -translate-x-1/2 overflow-hidden">
        <p className="xp-years outline-text whitespace-nowrap font-display text-[28vw] leading-none tracking-[-0.03em]">2020 — 2022 — 2024 — 2026</p>
      </div>
      <SectionHeading index="02" text={t.experienceTitle} className="mb-12 md:mb-16" />

      <ol className="xp-list relative flex flex-col gap-14 pl-8 md:pl-12">
        <span aria-hidden className="absolute left-[5px] top-1 h-full w-px bg-ink/10" />
        <span aria-hidden className="xp-progress absolute left-[5px] top-1 h-full w-px origin-top bg-fox" />
        {EXPERIENCE.map((job) => (
          <li key={job.company} className="xp-item relative grid gap-3 md:grid-cols-[200px_1fr] md:gap-10">
            <span aria-hidden className="xp-dot absolute -left-8 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-fox bg-bg md:-left-12" />
            <div className="xp-in">
              <p className="font-mono text-xs tabular-nums text-muted md:text-sm">{job.period[lang]}</p>
              <p className="mt-1 font-mono text-xs text-muted/70">{job.place[lang]}</p>
            </div>
            <div>
              <h3 className="xp-in text-xl font-semibold text-ink md:text-2xl">
                {job.role[lang]} <span className="font-normal text-fox">@ {job.company}</span>
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {job.points.map((p, i) => (
                  <li key={i} className="xp-in flex gap-3 leading-relaxed text-ink/80">
                    <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-fox/70" />
                    <span>{p[lang]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 grid gap-3 md:grid-cols-[200px_1fr] md:gap-10 md:pl-12">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted md:pt-1">{t.educationTitle}</h3>
        <ul className="edu-list grid gap-4 sm:grid-cols-2">
          {EDUCATION.map((e) => (
            <li key={e.period} data-spotlight className="edu-card spotlight rounded-2xl border border-ink/15 bg-surface/60 p-5">
              <p className="font-mono text-xs tabular-nums text-muted">{e.period}</p>
              <p className="mt-1 text-lg font-semibold text-ink">{e.degree[lang]}</p>
              <p className="mt-0.5 text-sm text-ink/70">{e.school[lang]}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
