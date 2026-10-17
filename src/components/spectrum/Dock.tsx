/**
 * Spectrum UI — Dock
 *
 * macOS-style dock: icons grow as the pointer approaches, show a tooltip on
 * hover and bounce when clicked.
 *
 * Adapted from Spectrum UI (https://ui.spectrumhq.in, Apache-2.0):
 * DockIcon can be a real link (href), the colors use the site tokens, and the
 * magnification and bounce are skipped under prefers-reduced-motion.
 */

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion'
import React, { useContext, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

export interface DockProps {
  children: React.ReactNode
  className?: string
  magnification?: number
  distance?: number
  label?: string
}

export interface DockIconProps {
  children: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  className?: string
}

const DockContext = React.createContext<{
  mouseX: MotionValue<number>
  magnification: number
  distance: number
} | null>(null)

const SPRING_TACTILE = { type: 'spring', stiffness: 400, damping: 25, mass: 0.1 } as const
const BASE = 44

export function Dock({ children, className, magnification = 76, distance = 140, label = 'Dock' }: DockProps) {
  const mouseX = useMotionValue(Infinity)
  return (
    <DockContext.Provider value={{ mouseX, magnification, distance }}>
      <nav
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          'mx-auto flex h-[68px] w-max items-end gap-3 rounded-3xl border border-ink/15 bg-surface/70 px-3 pb-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl',
          className,
        )}
        aria-label={label}
      >
        {children}
      </nav>
    </DockContext.Provider>
  )
}

export function DockIcon({ children, label, href, onClick, className }: DockIconProps) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null)
  const context = useContext(DockContext)
  const reduce = useReducedMotion()
  const [isBouncing, setIsBouncing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  if (!context) throw new Error('DockIcon must be used within a Dock component')
  const { mouseX, magnification, distance } = context

  // 指针离图标中心越近，图标越大
  const widthTransform = useTransform(mouseX, (val) => {
    if (val === Infinity || reduce) return BASE
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    const power = Math.max(0, 1 - Math.abs(val - (bounds.x + bounds.width / 2)) / distance)
    return BASE + (magnification - BASE) * power
  })
  const width = useSpring(widthTransform, SPRING_TACTILE)

  const handleClick = () => {
    onClick?.()
    if (isBouncing || reduce) return
    setIsBouncing(true)
    setTimeout(() => setIsBouncing(false), 600)
  }

  const external = href?.startsWith('http')
  const Tag = href ? 'a' : 'button'
  return (
    <Tag
      ref={ref}
      {...(href ? { href, ...(external ? { target: '_blank', rel: 'noreferrer' } : {}) } : { type: 'button' as const })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onClick={handleClick}
      aria-label={label}
      className="relative flex items-center justify-center rounded-2xl"
    >
      <AnimatePresence>
        {isHovered && (
          <motion.span
            initial={{ opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 4, scale: 0.95, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="pointer-events-none absolute bottom-full left-1/2 mb-3 whitespace-nowrap rounded-lg border border-ink/15 bg-bg px-2.5 py-1 font-mono text-[11px] text-ink shadow-md"
            role="tooltip"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      <motion.span
        style={{ width, height: width }}
        animate={isBouncing ? { y: [0, -16, 0, -8, 0] } : { y: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className={cn(
          'flex items-center justify-center rounded-2xl border border-ink/15 bg-ink/[0.06] text-ink transition-colors hover:border-fox/60 hover:text-fox',
          className,
        )}
      >
        <span className="flex h-1/2 w-1/2 items-center justify-center [&>svg]:h-full [&>svg]:w-full">{children}</span>
      </motion.span>
    </Tag>
  )
}
