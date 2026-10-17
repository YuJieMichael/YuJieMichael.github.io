import { useEffect, useRef, useState } from 'react'
import { gsap, isFinePointer, prefersReducedMotion } from '../effects/gsap'

/**
 * 自定义光标：狐狸橙小点 + 跟随的圆环。
 * 移到链接 / 按钮上圆环变大；移到带 data-cursor="文字" 的元素上，圆环放大并显示文字。
 * 只在鼠标设备上启用，系统光标保留。
 */
export default function CursorFollower() {
  const [enabled] = useState(() => isFinePointer() && !prefersReducedMotion())
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current) return
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3' })
    let state = ''

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
      gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.2, overwrite: 'auto' })

      const target = e.target as Element | null
      const labelled = target?.closest<HTMLElement>('[data-cursor]')
      const clickable = target?.closest('a, button')
      const next = labelled ? `label:${labelled.dataset.cursor}` : clickable ? 'hover' : ''
      if (next === state) return
      state = next
      setLabel(labelled?.dataset.cursor ?? '')
      gsap.to(ring.current, {
        scale: labelled ? 2.4 : clickable ? 1.6 : 1,
        backgroundColor: labelled ? 'rgba(240,144,78,0.92)' : 'rgba(231,237,242,0)',
        borderColor: labelled ? 'rgba(240,144,78,0)' : clickable ? 'rgba(240,144,78,0.8)' : 'rgba(231,237,242,0.35)',
        duration: 0.35,
        ease: 'power3',
      })
      gsap.to(dot.current, { scale: labelled ? 0 : 1, duration: 0.2 })
    }
    const onLeave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.2 })
    const onDown = () => gsap.to(ring.current, { scale: '-=0.25', duration: 0.12, yoyo: true, repeat: 1 })

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    window.addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <>
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[95] -ml-[18px] -mt-[18px] flex h-9 w-9 items-center justify-center rounded-full border border-ink/35 opacity-0"
      >
        <span className="font-mono text-[5px] font-medium uppercase tracking-wider text-bg">{label}</span>
      </div>
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[96] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-fox opacity-0"
      />
    </>
  )
}
