/**
 * Spectrum UI — CommandPalette
 *
 * A ⌘K command palette: type to filter, ↑↓ to move, Enter to run. The active
 * row is a shared-layout pill that glides between items.
 *
 * Adapted from Spectrum UI (https://ui.spectrumhq.in, Apache-2.0): commands
 * and labels come in as props (no Next.js router or next-themes), categories
 * are free-form, and the colors use the site tokens.
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CornerDownLeft, Search } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

export interface CommandItem {
  id: string
  title: string
  description?: string
  category: string
  /** Extra words that should match the search, e.g. other-language names */
  keywords?: string
  shortcut?: string[]
  icon: React.ReactNode
  action: () => void
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands: CommandItem[]
  placeholder?: string
  emptyText?: (query: string) => string
  footer?: React.ReactNode
  className?: string
}

const SPRING_FLUID = { type: 'spring', stiffness: 300, damping: 30 } as const
const SPRING_ENTRANCE = { type: 'spring', stiffness: 260, damping: 20 } as const

export function CommandPalette({
  isOpen,
  onClose,
  commands,
  placeholder = 'Type a command or search...',
  emptyText = (q) => `No commands found matching "${q}"`,
  footer,
  className,
}: CommandPaletteProps) {
  const shouldReduceMotion = useReducedMotion()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setActiveIndex(0)
    const id = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(id)
  }, [isOpen])

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((item) =>
      [item.title, item.description, item.category, item.keywords].join(' ').toLowerCase().includes(q),
    )
  }, [commands, query])

  useEffect(() => setActiveIndex(0), [query])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) =>
          filteredCommands.length > 0 ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0,
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        filteredCommands[activeIndex]?.action()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, filteredCommands, activeIndex])

  useEffect(() => {
    itemsContainerRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // 按分类分组，保持原有顺序
  const categories = useMemo(() => {
    const groups = new Map<string, CommandItem[]>()
    filteredCommands.forEach((cmd) => groups.set(cmd.category, [...(groups.get(cmd.category) ?? []), cmd]))
    return [...groups.entries()]
  }, [filteredCommands])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={shouldReduceMotion ? { duration: 0 } : SPRING_ENTRANCE}
            className={cn(
              'relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-ink/15 bg-bg/80 text-left shadow-2xl backdrop-blur-xl',
              className,
            )}
          >
            <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3.5">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={placeholder}
                className="flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              />
              <kbd className="hidden h-5 select-none items-center rounded border border-ink/15 bg-surface px-1.5 font-mono text-[9px] text-muted sm:inline-flex">
                ESC
              </kbd>
            </div>

            <div ref={itemsContainerRef} className="max-h-[min(380px,55vh)] overflow-y-auto overflow-x-hidden p-2">
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center font-mono text-sm text-muted">{emptyText(query)}</div>
              ) : (
                categories.map(([category, items]) => (
                  <div key={category} className="mb-2 last:mb-0">
                    <h4 className="px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-widest text-fox/80">
                      {category}
                    </h4>
                    <div className="mt-1 space-y-0.5">
                      {items.map((item) => {
                        const flatIdx = filteredCommands.indexOf(item)
                        const isActive = flatIdx === activeIndex
                        return (
                          <div
                            key={item.id}
                            data-index={flatIdx}
                            role="option"
                            aria-selected={isActive}
                            onClick={item.action}
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            className={cn(
                              'group relative z-10 flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 transition-colors',
                              isActive ? 'text-ink' : 'text-ink/60',
                            )}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="active-item-pill"
                                className="absolute inset-0 -z-10 rounded-xl border border-fox/25 bg-fox/10"
                                transition={shouldReduceMotion ? { duration: 0 } : SPRING_FLUID}
                              />
                            )}
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={cn('shrink-0 transition-colors', isActive ? 'text-fox' : 'text-muted')}>
                                {item.icon}
                              </div>
                              <div className="min-w-0">
                                <span className="block text-sm font-medium leading-none">{item.title}</span>
                                {item.description && (
                                  <span className="mt-1 block max-w-xs truncate text-[11px] leading-none text-muted sm:max-w-sm">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="ml-4 flex shrink-0 items-center gap-1">
                              {item.shortcut?.map((key, kIdx) => (
                                <kbd
                                  key={kIdx}
                                  className="inline-flex h-5 min-w-5 select-none items-center justify-center rounded border border-ink/15 bg-surface px-1 font-mono text-[9px] text-muted"
                                >
                                  {key}
                                </kbd>
                              ))}
                              {isActive && <CornerDownLeft className="ml-1.5 h-3 w-3 animate-pulse text-fox/70" />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden items-center justify-between border-t border-ink/10 bg-surface/40 px-4 py-2 font-mono text-[10px] text-muted sm:flex">
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border border-ink/15 bg-surface px-1 text-[9px]">↑↓</kbd>
                <kbd className="rounded border border-ink/15 bg-surface px-1 text-[9px]">Enter</kbd>
              </div>
              <div>{footer}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
