import { motion, useScroll } from 'framer-motion'

/** 顶部一条狐狸橙细线，随页面滚动变长 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-fox"
      style={{ scaleX: scrollYProgress }}
    />
  )
}
