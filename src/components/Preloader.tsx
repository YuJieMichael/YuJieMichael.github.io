import { useRef, useState } from 'react'
import { finishIntro } from '../effects/intro'
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from '../effects/gsap'

const SEEN_KEY = 'fox-program-intro-seen'

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/** 开场：计数 000→100 + 进度线，然后整块幕布向上掀开。每个会话只播一次 */
export default function Preloader() {
  const [skip] = useState(() => prefersReducedMotion() || alreadySeen())
  const [gone, setGone] = useState(skip)
  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      if (skip) {
        finishIntro()
        return
      }
      document.documentElement.style.overflow = 'hidden'
      const counter = { v: 0 }
      gsap
        .timeline({
          onComplete: () => {
            document.documentElement.style.overflow = ''
            try {
              sessionStorage.setItem(SEEN_KEY, '1')
            } catch {
              // 存不了就下次再播一遍
            }
            setGone(true)
            ScrollTrigger.refresh()
          },
        })
        .to(counter, {
          v: 100,
          duration: 1.1,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (count.current) count.current.textContent = String(Math.round(counter.v)).padStart(3, '0')
          },
        })
        .to('.pl-bar', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0)
        .to('.pl-fade', { opacity: 0, y: -12, duration: 0.3, stagger: 0.04 }, '+=0.1')
        .add(() => finishIntro(), '-=0.05')
        .to(root.current, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' }, '<')
    },
    { scope: root },
  )

  if (gone) return null
  return (
    <div ref={root} className="fixed inset-0 z-[80] flex flex-col justify-between bg-bg px-5 py-6 sm:px-8 md:px-12" aria-hidden>
      <div className="pl-fade flex justify-between font-mono text-xs text-muted">
        <span>Yujie Xie</span>
        <span>Fox-Program</span>
      </div>
      <div className="flex items-end justify-between gap-6">
        <span ref={count} className="pl-fade font-display text-[clamp(5rem,18vw,14rem)] leading-none tabular-nums text-ink">
          000
        </span>
        <span className="pl-fade mb-4 font-mono text-xs text-fox">loading portfolio…</span>
      </div>
      <div className="pl-fade h-px w-full bg-ink/10">
        <div className="pl-bar h-px w-full origin-left scale-x-0 bg-fox" />
      </div>
    </div>
  )
}
