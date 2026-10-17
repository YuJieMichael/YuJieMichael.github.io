import { Check, Command, MapPin } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { CONTACT } from '../data/profile'
import { useLanguage } from '../i18n/LanguageContext'
import { withModKey } from '../lib/platform'
import { useCurrentSection, useSectionLabels } from '../lib/useCurrentSection'
import { DynamicIsland, DynamicIslandView } from './spectrum/DynamicIsland'
import { TextStates } from './spectrum/TextStates'

interface IslandValue {
  /** 灵动岛弹出一条消息，2 秒后收回 */
  notify: (message: string) => void
}

const IslandContext = createContext<IslandValue>({ notify: () => {} })
export const useIsland = () => useContext(IslandContext)

/**
 * 全站灵动岛（Spectrum UI 的 DynamicIsland）：
 * 固定在屏幕底部中间。平时是一颗小药丸，显示「求职中」和当前所在的章节；
 * 鼠标停上去展开名片；复制邮箱、切换语言等操作会在这里弹出提示。
 */
export function IslandProvider({ children, onOpenPalette }: { children: ReactNode; onOpenPalette: () => void }) {
  const { lang, t } = useLanguage()
  const current = useCurrentSection()
  const [view, setView] = useState<'note' | 'card' | null>(null)
  const [message, setMessage] = useState('')
  const timer = useRef<number>()
  const firstLang = useRef(true)

  const notify = useCallback((text: string) => {
    setMessage(text)
    setView('note')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setView(null), 2000)
  }, [])

  // 切换语言后提示一下（首次渲染不提示）
  useEffect(() => {
    if (firstLang.current) {
      firstLang.current = false
      return
    }
    notify(t.langSwitched)
  }, [lang, notify, t.langSwitched])

  const sectionLabel = useSectionLabels()

  const time = new Intl.DateTimeFormat('en-CA', { timeZone: CONTACT.timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())

  return (
    <IslandContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[45] flex justify-center">
        <div
          className="pointer-events-auto"
          onMouseEnter={() => view !== 'note' && setView('card')}
          onMouseLeave={() => view === 'card' && setView(null)}
        >
          <DynamicIsland
            view={view}
            compact={
              <button type="button" onClick={onOpenPalette} className="flex items-center gap-2 whitespace-nowrap font-mono text-[11px]" aria-label={t.paletteOpen}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-ink/80">{t.contactOpen}</span>
                <span className="text-ink/25">/</span>
                <TextStates text={sectionLabel[current]} className="text-fox" />
              </button>
            }
          >
            <DynamicIslandView id="note" className="px-5 py-2.5">
              <span className="flex items-center gap-2 whitespace-nowrap text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                  <Check size={12} />
                </span>
                {message}
              </span>
            </DynamicIslandView>
            <DynamicIslandView id="card" className="px-5 py-4">
              <button type="button" onClick={onOpenPalette} className="flex items-center gap-4 whitespace-nowrap text-left">
                <img src={`${import.meta.env.BASE_URL}avatar.webp`} alt="" className="h-11 w-11 rounded-full border border-ink/15 bg-surface object-cover" />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-ink">
                    Yujie Xie <span className="text-muted">· {t.islandRole}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
                    <MapPin size={11} className="text-fox" /> Montréal · {time}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-fox">
                    <Command size={11} /> {withModKey(t.islandHint)}
                  </span>
                </span>
              </button>
            </DynamicIslandView>
          </DynamicIsland>
        </div>
      </div>
    </IslandContext.Provider>
  )
}
