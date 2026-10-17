import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useRef, type CSSProperties } from 'react'

interface AnimatedTextProps {
  text: string
  className?: string
  style?: CSSProperties
}

/** 随滚动逐字符点亮：每个字符透明度 0.2 → 1 */
export default function AnimatedText({ text, className, style }: AnimatedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })
  const chars = Array.from(text)

  return (
    <p ref={ref} className={className} style={style} data-cloth>
      {chars.map((char, i) => (
        <Char
          key={i}
          progress={scrollYProgress}
          range={[i / chars.length, (i + 1) / chars.length]}
        >
          {char}
        </Char>
      ))}
    </p>
  )
}

interface CharProps {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}

function Char({ children, progress, range }: CharProps) {
  const opacity = useTransform(progress, range, [0.2, 1])
  return <motion.span style={{ opacity }}>{children}</motion.span>
}
