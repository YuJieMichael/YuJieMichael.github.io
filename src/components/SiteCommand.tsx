import { ArrowUpRight, BookOpen, Briefcase, Code2, Copy, Github, Home, Languages, Layers, Linkedin, Mail, Shuffle, Sparkles, User } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CHAPTER_COUNT } from '../data/content'
import { CONTACT, PROJECTS } from '../data/profile'
import { useLanguage } from '../i18n/LanguageContext'
import { LANGS } from '../i18n/strings'
import { withModKey } from '../lib/platform'
import { IslandProvider, useIsland } from './SiteIsland'
import { CommandPalette, type CommandItem } from './spectrum/CommandPalette'
import { useStoryModal } from './StoryModal'

const PaletteContext = createContext<{ open: () => void }>({ open: () => {} })
export const usePalette = () => useContext(PaletteContext)

const icon = 'h-4 w-4'

/** ⌘K / Ctrl+K 或 / 打开命令面板；面板和灵动岛都挂在这里 */
export function CommandProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === '/' && !typing) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <PaletteContext.Provider value={{ open }}>
      <IslandProvider onOpenPalette={open}>
        {children}
        <SitePalette isOpen={isOpen} onClose={close} />
      </IslandProvider>
    </PaletteContext.Provider>
  )
}

function SitePalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, setLang } = useLanguage()
  const { notify } = useIsland()
  const story = useStoryModal()

  const commands = useMemo<CommandItem[]>(() => {
    const run = (fn: () => void) => () => {
      onClose()
      fn()
    }
    const go = (id: string) =>
      run(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
      })
    const openUrl = (url: string) => run(() => window.open(url, '_blank', 'noopener'))

    const nav: CommandItem[] = [
      { id: 'home', title: t.navHome, icon: <Home className={icon} /> },
      { id: 'work', title: t.workLabel, icon: <Layers className={icon} /> },
      { id: 'experience', title: t.experienceTitle, icon: <Briefcase className={icon} /> },
      { id: 'skills', title: t.skillsTitle, icon: <Code2 className={icon} /> },
      { id: 'about', title: t.aboutLabel, icon: <User className={icon} /> },
      { id: 'story', title: t.storyLabel, icon: <BookOpen className={icon} /> },
      { id: 'contact', title: t.navContact, icon: <Mail className={icon} /> },
    ].map((c) => ({ ...c, id: `nav-${c.id}`, category: t.catNavigate, keywords: c.id, action: go(c.id) }))

    const projects: CommandItem[] = PROJECTS.flatMap((p) => [
      ...(p.live
        ? [{ id: `live-${p.name}`, title: t.cmdLive(p.name), description: p.live, category: t.catProjects, icon: <ArrowUpRight className={icon} />, action: openUrl(p.live) }]
        : []),
      ...(p.repo
        ? [{ id: `repo-${p.name}`, title: t.cmdSource(p.name), description: p.repo, category: t.catProjects, icon: <Github className={icon} />, action: openUrl(p.repo) }]
        : []),
    ])

    const stories: CommandItem[] = [
      { id: 'story-1', title: t.cmdChapterOne, category: t.catStory, icon: <Sparkles className={icon} />, action: run(() => story.open(1)) },
      {
        id: 'story-random',
        title: t.cmdRandomChapter,
        category: t.catStory,
        icon: <Shuffle className={icon} />,
        action: run(() => story.open(1 + Math.floor(Math.random() * CHAPTER_COUNT))),
      },
    ]

    const langs: CommandItem[] = LANGS.map((l) => ({
      id: `lang-${l.code}`,
      title: { zh: '中文', en: 'English', fr: 'Français' }[l.code],
      category: t.catLanguage,
      keywords: 'language langue 语言 chinese anglais french',
      shortcut: [l.label],
      icon: <Languages className={icon} />,
      action: run(() => setLang(l.code)),
    }))

    const contact: CommandItem[] = [
      {
        id: 'copy-email',
        title: t.copyEmail,
        description: CONTACT.email,
        category: t.catContact,
        icon: <Copy className={icon} />,
        action: run(() => navigator.clipboard?.writeText(CONTACT.email).then(() => notify(t.emailCopied)).catch(() => {})),
      },
      { id: 'mail', title: t.sendEmail, description: CONTACT.email, category: t.catContact, icon: <Mail className={icon} />, action: run(() => (window.location.href = `mailto:${CONTACT.email}`)) },
      { id: 'linkedin', title: 'LinkedIn', description: CONTACT.linkedin, category: t.catContact, icon: <Linkedin className={icon} />, action: openUrl(CONTACT.linkedin) },
      { id: 'github', title: 'GitHub', description: CONTACT.github, category: t.catContact, icon: <Github className={icon} />, action: openUrl(CONTACT.github) },
    ]

    return [...nav, ...projects, ...stories, ...contact, ...langs]
  }, [t, setLang, notify, story, onClose])

  return (
    <CommandPalette
      isOpen={isOpen}
      onClose={onClose}
      commands={commands}
      placeholder={t.palettePlaceholder}
      emptyText={t.paletteEmpty}
      footer={withModKey(t.paletteFooter)}
    />
  )
}
