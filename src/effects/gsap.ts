import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isFinePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

export { gsap, ScrollTrigger, SplitText, useGSAP }

/**
 * 页面高度变了就重算所有滚动触发点（钉住的引文页、横向画册都靠它们定位）。
 * 网络字体比页面晚到、图片和文字晚加载都会让上面的内容变高；不重算的话，
 * 下面钉住的区块会提前开始动，盖住别的内容。返回清理函数。
 */
export function watchLayoutForScrollTrigger() {
  let timer = 0
  const refresh = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => ScrollTrigger.refresh(), 200)
  }
  document.fonts?.ready.then(refresh)
  const main = document.querySelector('main')
  const observer = new ResizeObserver(refresh)
  if (main) observer.observe(main)
  return () => {
    observer.disconnect()
    window.clearTimeout(timer)
  }
}
