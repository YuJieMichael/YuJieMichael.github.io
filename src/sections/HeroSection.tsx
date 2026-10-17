import { ArrowDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ContactButton from '../components/ContactButton'
import Magnetic from '../components/Magnetic'
import RotatingBadge from '../components/RotatingBadge'
import ScrambleText from '../components/ScrambleText'
import Terminal from '../components/Terminal'
import { gsap, isFinePointer, prefersReducedMotion, SplitText, useGSAP } from '../effects/gsap'
import { introDone } from '../effects/intro'
import { useLanguage } from '../i18n/LanguageContext'

export default function HeroSection() {
  const { t } = useLanguage()
  const root = useRef<HTMLElement>(null)
  const termWrap = useRef<HTMLDivElement>(null)
  const termTilt = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    introDone.then(() => setReady(true))
  }, [])

  // 入场时间线：开场动画结束后播放；语言切换后只把文字重新逐行升起
  useGSAP(
    () => {
      if (!ready) return
      if (prefersReducedMotion()) {
        gsap.set('.intro-hide', { visibility: 'visible' })
        setTyping(true)
        return
      }
      const split = SplitText.create('.hero-intro', { type: 'lines', mask: 'lines', linesClass: 'hero-line' })
      gsap.set('.intro-hide', { visibility: 'visible' })
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .from('.hero-strip', { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power3.inOut' }, 0)
        .from('.hero-badge', { scale: 0, rotation: -120, duration: 1.2, ease: 'back.out(1.6)' }, 0.5)
        .from('.hero-role', { y: 16, opacity: 0, duration: 0.7 }, 0.2)
        .from(split.lines, { yPercent: 110, duration: 1, stagger: 0.09 }, 0.35)
        .from('.hero-cta > *', { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.6)
        .from(termWrap.current, { y: 60, opacity: 0, rotateX: 18, transformPerspective: 900, duration: 1.1 }, 0.55)
        .add(() => setTyping(true), '-=0.3')
      return () => split.revert()
    },
    { scope: root, dependencies: [ready, t.heroIntro], revertOnUpdate: true },
  )

  // 滚动视差：名字和终端往上飘、逐渐变淡
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const st = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      // 刊名：往上飘的同时字距被拉开，像封面被翻过去
      gsap.to('.hero-name', { yPercent: -45, letterSpacing: '0.14em', opacity: 0.12, ease: 'none', scrollTrigger: st })
      gsap.to('.hero-badge', { rotation: 200, y: -140, ease: 'none', scrollTrigger: st })
      gsap.to(termWrap.current, { y: -90, ease: 'none', scrollTrigger: st })
    },
    { scope: root },
  )

  // 终端跟着鼠标做 3D 倾斜
  useEffect(() => {
    const el = termTilt.current
    if (!el || !isFinePointer() || prefersReducedMotion()) return
    gsap.set(el, { transformPerspective: 900 })
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3' })
    const onMove = (e: PointerEvent) => {
      ry((e.clientX / window.innerWidth - 0.5) * 14)
      rx((e.clientY / window.innerHeight - 0.5) * -10)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <section ref={root} id="home" className="relative" style={{ overflowX: 'clip' }}>
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pb-16 pt-20 sm:px-8 md:px-12 md:pt-24">
        {/* 杂志封面：刊号条 + 撑满一行的刊名 + 旋转贴纸 */}
        <div className="hero-strip intro-hide flex items-center justify-between gap-4 border-y border-ink/20 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted md:text-xs">
          <span className="text-ink">{t.issueNo}</span>
          <span className="hidden sm:inline">{t.issueSeason}</span>
          <span className="text-fox">{t.issueTitle}</span>
          <span className="hidden md:inline">Montréal, QC</span>
        </div>
        <div className="relative">
          <h1 className="hero-name mt-3 whitespace-nowrap font-display text-[clamp(4.1rem,24.5vw,22.5rem)] leading-[0.8] tracking-[-0.035em] text-ink md:mt-5">
            <ScrambleText text="Yujie Xie" trigger="manual" play={ready} duration={1100} delay={100} />
            <span className="text-fox">.</span>
          </h1>
          <RotatingBadge text={t.badgeText} className="absolute -bottom-14 right-0 hidden h-28 w-28 sm:block md:-bottom-16 md:right-4 md:h-40 md:w-40" />
        </div>
        <div className="mt-8 grid flex-1 items-center gap-12 md:mt-10 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="hero-role intro-hide font-mono text-xs uppercase tracking-[0.2em] text-muted md:text-sm">{t.heroRole}</p>
          <p key={t.heroIntro} className="hero-intro intro-hide mt-5 max-w-xl text-lg leading-relaxed text-ink/80 md:text-xl">
            {t.heroIntro}
          </p>
          <div className="hero-cta intro-hide mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <a
                href="#work"
                className="inline-flex items-center gap-2 rounded-full bg-fox px-5 py-2.5 text-sm font-medium text-bg transition-[filter] duration-200 hover:brightness-110 md:text-base"
              >
                {t.viewProjects}
                <ArrowDown size={16} />
              </a>
            </Magnetic>
            <Magnetic>
              <ContactButton />
            </Magnetic>
          </div>
        </div>
        <div ref={termWrap} className="intro-hide flex justify-center will-change-transform md:justify-end">
          <div ref={termTilt} className="w-full max-w-md will-change-transform">
            <Terminal start={typing} />
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}
