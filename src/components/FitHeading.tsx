import { useLayoutEffect, useRef, type ReactNode } from 'react'

interface FitHeadingProps {
  /** 文字变化时重新测量 */
  text: string
  className?: string
  children: ReactNode
}

/**
 * 单行大标题：按 className 里的字号渲染，放不下时等比缩小到刚好占满一行。
 * 中文「英雄之家」保持原定 vw 字号，英文 / 法文这种长标题会自动缩小。
 */
export default function FitHeading({ text, className = '', children }: FitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      el.style.fontSize = ''
      const overflow = el.scrollWidth / el.clientWidth
      if (overflow > 1) {
        const size = parseFloat(getComputedStyle(el).fontSize)
        el.style.fontSize = `${(size / overflow) * 0.97}px`
      }
    }
    fit()
    document.fonts?.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [text])

  return (
    <h1 ref={ref} aria-label={text} className={`whitespace-nowrap ${className}`}>
      {children}
    </h1>
  )
}
