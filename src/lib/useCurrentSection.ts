import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

/** 页面从上到下的各节 id（也是「页码」的顺序） */
export const SECTIONS = ['home', 'contents', 'work', 'experience', 'skills', 'about', 'quote', 'story', 'contact'] as const
export type SectionId = (typeof SECTIONS)[number]

/** 当前滚到哪一节：取视口上三分之一处所在的那一节 */
export function useCurrentSection() {
  const [current, setCurrent] = useState<SectionId>('home')
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight / 3
      let found: SectionId = 'home'
      for (const id of SECTIONS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) found = id
      }
      setCurrent(found)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])
  return current
}

/** 各节在当前语言下的名字 */
export function useSectionLabels(): Record<SectionId, string> {
  const { t } = useLanguage()
  return {
    home: t.navHome,
    contents: t.contentsTitle,
    about: t.aboutLabel,
    work: t.workLabel,
    quote: t.quoteLabel,
    experience: t.experienceTitle,
    skills: t.skillsTitle,
    story: t.storyLabel,
    contact: t.navContact,
  }
}
