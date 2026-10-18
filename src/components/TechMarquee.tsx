import { useRef } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from '../effects/gsap'

const ROWS = [
  ['React', 'TypeScript', 'Next.js', 'NestJS', 'PostgreSQL', 'Docker', 'Supabase', 'Prisma'],
  ['Full-stack', 'AI agents', 'MCP', 'Montréal', 'EN · FR · 中文', 'REST APIs', 'CI/CD'],
]

/**
 * 大字技术栈跑马灯：两行反向循环滚动。
 * 滚动越快跑得越快、字越斜；往回滚时方向反过来。
 */
export default function TechMarquee() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tracks = gsap.utils.toArray<HTMLElement>('.tm-track')
      const pos = tracks.map(() => 0)
      let dir = 1
      let boost = 0
      const skewTo = gsap.quickTo(tracks, 'skewX', { duration: 0.4, ease: 'power3' })
      const wrap = gsap.utils.wrap(-50, 0)

      const st = ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          dir = self.direction
          const v = self.getVelocity()
          boost = Math.min(Math.abs(v) / 120, 14)
          skewTo(gsap.utils.clamp(-12, 12, v / -220))
        },
      })
      const tick = () => {
        boost *= 0.94
        tracks.forEach((el, i) => {
          const sign = i % 2 === 0 ? 1 : -1
          pos[i] = wrap(pos[i] - (0.035 + boost * 0.02) * dir * sign)
          gsap.set(el, { xPercent: pos[i] })
        })
        if (Math.abs(boost) < 0.05) skewTo(0)
      }
      gsap.ticker.add(tick)
      return () => {
        gsap.ticker.remove(tick)
        st.kill()
      }
    },
    { scope: root },
  )

  return (
    <div ref={root} aria-hidden className="relative flex flex-col gap-2 py-10 md:gap-4 md:py-16" style={{ overflowX: 'clip' }}>
      {ROWS.map((words, r) => (
        <div key={r} className="flex whitespace-nowrap">
          <div className="tm-track flex shrink-0 will-change-transform">
            {[0, 1].map((copy) => (
              <span key={copy} className="flex shrink-0">
                {words.map((w, i) => (
                  <span
                    key={i}
                    className={`px-4 font-display text-[clamp(2.75rem,8vw,7rem)] leading-none md:px-8 ${
                      (i + r) % 3 === 0 ? 'text-ink' : 'tm-outline'
                    }`}
                  >
                    {w}
                    <span className="ml-8 text-fox md:ml-16">✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
