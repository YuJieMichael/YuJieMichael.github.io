import { useId, useRef } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from '../effects/gsap'

/**
 * 杂志封面上的圆形贴纸：一圈文字慢慢转，滚动越快转得越快。
 * 点一下跳到「联系我」。className 里要给定位（absolute / relative）和尺寸。
 */
export default function RotatingBadge({ text, href = '#contact', className = '' }: { text: string; href?: string; className?: string }) {
  const ring = useRef<SVGSVGElement>(null)
  const pathId = useId().replace(/:/g, '')

  useGSAP(() => {
    if (prefersReducedMotion() || !ring.current) return
    const spin = gsap.to(ring.current, { rotation: 360, duration: 18, ease: 'none', repeat: -1, transformOrigin: '50% 50%' })
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 400, 6)
        gsap.to(spin, { timeScale: boost * (self.direction < 0 ? -1 : 1), duration: 0.2, overwrite: true })
        gsap.to(spin, { timeScale: 1, duration: 1.2, delay: 0.2, ease: 'power2.out' })
      },
    })
    return () => st.kill()
  })

  return (
    <a href={href} aria-label={text} className={`hero-badge group block rounded-full ${className}`}>
      <svg ref={ring} viewBox="0 0 200 200" className="h-full w-full">
        <defs>
          <path id={pathId} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <circle cx="100" cy="100" r="98" className="fill-fox" />
        <text className="fill-bg font-mono text-[15px] font-semibold uppercase" style={{ letterSpacing: '0.18em' }}>
          <textPath href={`#${pathId}`} textLength="488" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-[2.6em] text-bg transition-transform duration-500 group-hover:rotate-[135deg]">
        ✦
      </span>
    </a>
  )
}
