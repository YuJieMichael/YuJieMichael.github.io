import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { isMac } from '../lib/platform'
import LanguageSwitcher from './LanguageSwitcher'
import { usePalette } from './SiteCommand'
import { KbdCombo } from './spectrum/KbdKey'

/** 顶部固定导航：左边名字，右边锚点和语言切换；滚动后加一层半透明底 */
export default function SiteHeader() {
  const { t } = useLanguage()
  const palette = usePalette()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: t.navWork, href: '#work' },
    { label: t.navExperience, href: '#experience' },
    { label: t.navStory, href: '#story' },
    { label: t.navContact, href: '#contact' },
  ]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? 'border-b border-ink/10 bg-bg/75 backdrop-blur-md' : 'border-b border-transparent'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8 md:px-12">
        <a href="#home" className="font-display text-xl text-ink md:text-2xl">
          Yujie Xie<span className="text-fox">.</span>
        </a>
        <nav className="flex items-center gap-3 sm:gap-5 md:gap-7">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm text-ink/70 transition-colors duration-200 hover:text-ink ${i < 3 ? 'hidden sm:inline' : ''}`}
            >
              {l.label}
            </a>
          ))}
          {/* 命令面板入口：键帽会跟着真实按键一起按下去（Spectrum UI 的 KbdCombo） */}
          <button
            type="button"
            onClick={palette.open}
            aria-label={t.paletteOpen}
            className="flex items-center gap-2 rounded-full border border-ink/15 p-2 text-ink/70 transition-colors duration-200 hover:border-fox/60 hover:text-fox md:py-1 md:pl-3 md:pr-1.5"
          >
            <Search size={14} />
            <span className="hidden md:inline-flex">
              <KbdCombo keys={isMac ? 'meta+k' : 'ctrl+k'} size="sm" />
            </span>
          </button>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}
