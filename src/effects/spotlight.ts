/**
 * 鼠标聚光：带 data-spotlight 的元素，鼠标在上面移动时更新 --mx / --my，
 * CSS 用它画一圈跟随鼠标的淡淡光晕（见 index.css 的 .spotlight）。
 */
export function initSpotlight(): () => void {
  const onMove = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-spotlight]')
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  return () => window.removeEventListener('pointermove', onMove)
}
