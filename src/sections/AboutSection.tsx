import AnimatedText from '../components/AnimatedText'
import FadeIn from '../components/FadeIn'
import SectionHeading from '../components/SectionHeading'
import { NumberTicker } from '../components/spectrum/NumberTicker'
import { useRef } from 'react'
import { CHAPTER_COUNT, chapterImage } from '../data/content'
import { gsap, prefersReducedMotion, useGSAP } from '../effects/gsap'
import { PROJECTS, SKILLS, SUMMARY } from '../data/profile'
import { useLanguage } from '../i18n/LanguageContext'

export default function AboutSection() {
  const { lang, t } = useLanguage()
  const facts = [
    { k: t.factBased, v: 'Montréal, QC' },
    { k: t.factLanguages, v: 'EN · FR · 中文' },
    { k: t.factStack, v: 'React · TypeScript · NestJS' },
  ]
  const root = useRef<HTMLElement>(null)

  // 「Montréal」大字：线稿在字里横向平移，整行从下往上露出来
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '.ab-giant',
        { backgroundPosition: '0% 28%, 0 0' },
        { backgroundPosition: '100% 28%, 0 0', ease: 'none', scrollTrigger: { trigger: '.ab-giant', start: 'top bottom', end: 'bottom top', scrub: true } },
      )
      gsap.from('.ab-giant', { yPercent: 60, scaleY: 1.4, transformOrigin: '50% 100%', duration: 1.3, ease: 'power4.out', scrollTrigger: { trigger: '.ab-giant-wrap', start: 'top 90%' } })
    },
    { scope: root },
  )

  const stats = [
    { n: PROJECTS.length, label: t.statProjects },
    { n: 3, label: t.statLanguages },
    { n: CHAPTER_COUNT, label: t.statChapters },
    { n: SKILLS.reduce((sum, g) => sum + g.items.length, 0), label: t.statTools },
  ]
  return (
    <section ref={root} id="about" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:px-12 md:py-28">
      <SectionHeading index="01" text={t.aboutLabel} />
      <div className="mt-10 grid items-start gap-10 md:mt-14 md:grid-cols-[1fr_220px] md:gap-16">
        <AnimatedText
          key={lang}
          text={SUMMARY[lang]}
          className="font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.3] text-ink"
        />
        <FadeIn y={20} className="flex justify-start md:justify-end">
          <img
            src={`${import.meta.env.BASE_URL}avatar.webp`}
            alt={t.avatarAlt}
            draggable={false}
            data-cloth
            className="h-40 w-auto opacity-90 md:h-56"
          />
        </FadeIn>
      </div>
      {/* 整屏宽的图片填充大字，配一行图注 */}
      <figure className="ab-giant-wrap relative left-1/2 mt-16 w-screen -translate-x-1/2 overflow-hidden md:mt-24">
        <p
          aria-hidden
          className="ab-giant image-text whitespace-nowrap text-center font-display text-[25vw] leading-[0.82] tracking-[-0.045em]"
          style={{
            backgroundImage: `url(${chapterImage(1, 'lg')}), linear-gradient(100deg, #F0904E 0%, #FFD6AE 38%, #F0904E 62%, #7A3E18 100%)`,
          }}
        >
          Montréal
        </p>
        <figcaption className="mx-auto mt-3 flex max-w-6xl justify-between gap-4 px-5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted sm:px-8 md:px-12 md:text-xs">
          <span>
            <span className="text-fox">Fig. 01</span> — Montréal, QC
          </span>
          <span>{t.chapter(1)}</span>
        </figcaption>
      </figure>

      {/* 数字滚动（Spectrum UI 的 NumberTicker）：滚到这里时每一位数字依次转到位 */}
      <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-ink/10 pt-8 md:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <NumberTicker
              value={s.n}
              pad={2}
              blur
              stagger={0.08}
              duration={1.1}
              className="font-display text-[clamp(3rem,6vw,4.5rem)] leading-none text-ink"
              digitClassName="text-ink"
            />
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-muted">{s.label}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-10 grid gap-6 border-t border-ink/10 pt-8 sm:grid-cols-3">
        {facts.map((f) => (
          <div key={f.k}>
            <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{f.k}</dt>
            <dd className="mt-2 text-ink">{f.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
