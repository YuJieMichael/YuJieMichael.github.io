import { Fragment, useRef } from 'react'
import SectionHeading from '../components/SectionHeading'
import { SKILLS } from '../data/profile'
import { gsap, prefersReducedMotion, useGSAP } from '../effects/gsap'
import { useLanguage } from '../i18n/LanguageContext'

/**
 * 技能：做成字体样张。每组一行大号衬线字，词与词之间用斜线隔开；
 * 滚到时每个词从下面升起，悬停一个词时其他词变暗、这个词变斜体狐狸橙。
 */
export default function SkillsSection() {
  const { lang, t } = useLanguage()
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.utils.toArray<HTMLElement>('.sk-row').forEach((row) => {
        gsap
          .timeline({ scrollTrigger: { trigger: row, start: 'top 82%' } })
          .from(row.querySelector('.sk-label'), { x: -20, opacity: 0, duration: 0.6, ease: 'power3.out' })
          .from(row.querySelectorAll('.sk-item'), { yPercent: 110, duration: 0.9, stagger: 0.035, ease: 'power4.out' }, 0.05)
      })
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  )

  return (
    <section ref={root} id="skills" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 md:px-12 md:pb-28">
      <SectionHeading index="04" text={t.skillsTitle} className="mb-8 md:mb-12" />
      {SKILLS.map((g, gi) => (
        <div key={g.group.en} className="sk-row grid gap-3 border-t border-ink/15 py-6 md:grid-cols-[200px_1fr] md:gap-10 md:py-9">
          <h3 className="sk-label font-mono text-xs uppercase tracking-[0.18em] text-fox md:pt-3">
            {String(gi + 1).padStart(2, '0')} — {g.group[lang]}
          </h3>
          <p className="specimen font-display text-[clamp(1.9rem,4.3vw,3.7rem)] leading-[1.14] text-ink">
            {g.items.map((item, i) => (
              <Fragment key={item}>
                <span className="inline-block overflow-hidden align-bottom">
                  <span className="sk-item specimen-word inline-block cursor-default transition-[opacity,color] duration-300">{item}</span>
                </span>
                {i < g.items.length - 1 && <span className="text-ink/20"> / </span>}
              </Fragment>
            ))}
          </p>
        </div>
      ))}
    </section>
  )
}
