import { useEffect, useRef, useState } from 'react'

const GLYPHS = '!<>-_\\/[]{}=+*^?#01アカサタナ'
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface ScrambleTextProps {
  text: string
  /** 'mount'：挂载就播放；'view'：滚到视口里才播放；'manual'：play 变成 true 时播放 */
  trigger?: 'mount' | 'view' | 'manual'
  play?: boolean
  duration?: number
  delay?: number
  className?: string
}

/** 文字「解码」动画：先是跳动的乱码，再从左到右逐个定格成真实字符 */
export default function ScrambleText({ text, trigger = 'view', play = false, duration = 900, delay = 0, className }: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(text)

  useEffect(() => {
    if (reduced()) {
      setShown(text)
      return
    }
    const chars = Array.from(text)
    let raf = 0
    let timer = 0
    const run = () => {
      const start = performance.now() + delay
      const tick = (now: number) => {
        const p = Math.min(1, Math.max(0, (now - start) / duration))
        const fixed = Math.floor(p * chars.length)
        setShown(
          chars
            .map((c, i) => (i < fixed || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
            .join(''),
        )
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    if (trigger === 'mount' || (trigger === 'manual' && play)) {
      run()
    } else if (trigger === 'manual') {
      setShown(chars.map((c) => (c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(''))
    } else {
      setShown(chars.map((c) => (c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(''))
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            io.disconnect()
            run()
          }
        },
        { rootMargin: '0px 0px -10% 0px' },
      )
      if (ref.current) io.observe(ref.current)
      return () => {
        io.disconnect()
        cancelAnimationFrame(raf)
      }
    }
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [text, trigger, play, duration, delay])

  return (
    <span ref={ref} aria-label={text} className={className}>
      <span aria-hidden>{shown}</span>
    </span>
  )
}
