import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  x?: number
  y?: number
  className?: string
  /** 首屏元素：页面加载就播放，不等进入视口（被 overflow 裁掉时 whileInView 不会触发） */
  immediate?: boolean
}

/** 进入视口时淡入（只播放一次） */
export default function FadeIn({
  children,
  delay = 0,
  duration = 0.8,
  x = 0,
  y = 0,
  className,
  immediate = false,
}: FadeInProps) {
  const shown = { opacity: 1, x: 0, y: 0 }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      {...(immediate ? { animate: shown } : { whileInView: shown, viewport: { once: true, margin: '50px' } })}
      transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}
