import { useState } from 'react'
import { chapterForSlot, chapterImage, placeholderImage } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'
import { useStoryModal } from './StoryModal'

interface StoryImageProps {
  /** 页面图位编号，按顺序轮流对应章节 */
  slot?: number
  /** 直接指定章节，优先于 slot */
  chapter?: number
  size?: 'sm' | 'lg'
  className?: string
  alt?: string
}

/** 章节图片：优先读本地压缩图，缺失时退回随机占位图；点击弹出该章 md 内容 */
export default function StoryImage({ slot = 0, chapter: fixedChapter, size = 'sm', className = '', alt }: StoryImageProps) {
  const chapter = fixedChapter ?? chapterForSlot(slot)
  const [src, setSrc] = useState(chapterImage(chapter, size))
  const { open } = useStoryModal()
  const { t } = useLanguage()

  return (
    <img
      src={src}
      alt={alt ?? t.chapter(chapter)}
      loading="lazy"
      decoding="async"
      draggable={false}
      data-cloth
      data-cursor={t.cursorOpen}
      onError={() => setSrc(placeholderImage(chapter, size))}
      onClick={() => open(chapter)}
      className={`cursor-pointer ${className}`}
    />
  )
}
