import { ArrowUp, ArrowUpRight, Check, Copy, Github, Globe, Linkedin, Mail, MapPin, Radio, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Dock, DockIcon } from '../components/spectrum/Dock'
import { TiltCard, TiltCardItem } from '../components/spectrum/TiltCard'
import SectionHeading from '../components/SectionHeading'
import ScrambleText from '../components/ScrambleText'
import { CONTACT } from '../data/profile'
import { gsap, prefersReducedMotion, useGSAP } from '../effects/gsap'
import { useLanguage } from '../i18n/LanguageContext'
import { useIsland } from '../components/SiteIsland'

/** 复制到剪贴板；返回刚复制的那一项，1.8 秒后清掉 */
function useCopy(onCopied: () => void) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      onCopied()
      setCopied(key)
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 1800)
    } catch {
      // 剪贴板不可用时，选中文字让访客手动复制
      const el = document.getElementById(`contact-${key}`)
      if (el) window.getSelection()?.selectAllChildren(el)
    }
  }
  return { copied, copy }
}

/** 蒙特利尔当地时间，每分钟刷新 */
function useLocalTime(timeZone: string) {
  const format = () => new Intl.DateTimeFormat('en-CA', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' }).format(new Date())
  const [time, setTime] = useState(format)
  useEffect(() => {
    const id = setInterval(() => setTime(format()), 30_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZone])
  return time
}

const action =
  'relative inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 font-mono text-xs text-ink transition-colors duration-200 hover:border-fox hover:text-fox'

interface CardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  valueId?: string
  note?: string
  children?: ReactNode
}

function ContactCard({ icon: Icon, label, value, valueId, note, children }: CardProps) {
  return (
    <TiltCard maxTilt={8} glareColor="rgba(240, 144, 78, 0.16)" containerClassName="ct-card h-full" className="flex h-full flex-col p-5 md:p-6">
      <TiltCardItem depth={30} className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-muted">
        <Icon size={15} className="text-fox" /> {label}
      </TiltCardItem>
      <TiltCardItem depth={50} className="mt-4">
        <p id={valueId} className="break-words text-xl font-medium tracking-tight text-ink tabular-nums md:text-[1.4rem]" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
          {value}
        </p>
        {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      </TiltCardItem>
      {children && (
        <TiltCardItem depth={40} className="mt-auto flex flex-wrap gap-2 pt-5">
          {children}
        </TiltCardItem>
      )}
    </TiltCard>
  )
}

export default function ContactSection() {
  const { t } = useLanguage()
  const { notify } = useIsland()
  const { copied, copy } = useCopy(() => notify(t.emailCopied))
  const localTime = useLocalTime(CONTACT.timeZone)
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap
        .timeline({ scrollTrigger: { trigger: '.ct-grid', start: 'top 80%' } })
        .from('.ct-card', { y: 50, opacity: 0, rotateX: -12, duration: 0.9, stagger: 0.08, ease: 'power3.out' })
        .from('.ct-dock', { y: 40, opacity: 0, scale: 0.9, duration: 0.8, ease: 'back.out(1.6)' }, 0.4)
      // 收尾的巨型刊名：每个字母从下面顶上来
      gsap.from('.cn-ch', {
        yPercent: 105,
        duration: 1.1,
        stagger: 0.045,
        ease: 'power4.out',
        clearProps: 'transform',
        scrollTrigger: { trigger: '.cn-mark', start: 'top 95%' },
      })
    },
    { scope: root },
  )
  const handle = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

  const copyButton = (key: string, text: string) => (
    <button type="button" onClick={() => copy(key, text)} className={action} aria-live="polite">
      {copied === key ? <Check size={13} /> : <Copy size={13} />}
      {copied === key ? t.copied : t.copy}
    </button>
  )

  return (
    <section ref={root} id="contact" className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 md:px-12 md:pt-16">
      <SectionHeading index="06" text={t.navContact} />
      <h3 className="mt-10 max-w-4xl font-display text-[clamp(2.5rem,7vw,6rem)] leading-[1] text-ink">
        <ScrambleText key={t.contactTitle} text={t.contactTitle} />
        <span className="text-fox">.</span>
      </h3>
      <p className="mt-6 max-w-xl leading-relaxed text-ink/75 md:text-lg">{t.contactText}</p>

      {/* 联系方式卡片：Spectrum UI 的 TiltCard，随鼠标倾斜，内容分层浮起 */}
      <div className="ct-grid mt-10 grid gap-4 [perspective:1200px] sm:grid-cols-2 lg:grid-cols-3">
        <ContactCard icon={Mail} label={t.contactEmail} value={CONTACT.email} valueId="contact-email">
          <a href={`mailto:${CONTACT.email}`} className={action}>
            <ArrowUpRight size={13} /> {t.sendEmail}
          </a>
          {copyButton('email', CONTACT.email)}
        </ContactCard>
        <ContactCard icon={Linkedin} label="LinkedIn" value={handle(CONTACT.linkedin).replace('linkedin.com/', '')}>
          <a href={CONTACT.linkedin} target="_blank" rel="noreferrer" className={action}>
            <ArrowUpRight size={13} /> {t.openLink}
          </a>
        </ContactCard>
        <ContactCard icon={Github} label="GitHub" value={handle(CONTACT.github).replace('github.com/', '@')}>
          <a href={CONTACT.github} target="_blank" rel="noreferrer" className={action}>
            <ArrowUpRight size={13} /> {t.openLink}
          </a>
        </ContactCard>
        <ContactCard icon={MapPin} label={t.contactLocation} value={CONTACT.location} note={t.contactLocalTime(localTime)} />
        <ContactCard icon={Radio} label={t.contactStatus} value={t.contactOpen} note={t.contactRoles} />
        <ContactCard icon={Globe} label={t.contactLanguages} value="English · Français · 中文" note={t.contactReply} />
      </div>

      {/* 快捷联系：Spectrum UI 的 Dock，靠近会放大，点击会弹一下 */}
      <div className="ct-dock mt-16 flex flex-col items-center gap-4">
        <Dock label={t.quickLinks}>
          <DockIcon label={t.sendEmail} href={`mailto:${CONTACT.email}`}>
            <Mail />
          </DockIcon>
          <DockIcon label="LinkedIn" href={CONTACT.linkedin}>
            <Linkedin />
          </DockIcon>
          <DockIcon label="GitHub" href={CONTACT.github}>
            <Github />
          </DockIcon>
          <DockIcon label={copied === 'dock' ? t.copied : t.copyEmail} onClick={() => copy('dock', CONTACT.email)}>
            {copied === 'dock' ? <Check /> : <Copy />}
          </DockIcon>
          <DockIcon label="Top" href="#home">
            <ArrowUp />
          </DockIcon>
        </Dock>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{t.quickLinks}</p>
      </div>

      <footer className="mt-24 flex flex-wrap justify-between gap-2 border-t border-ink/10 pt-6 font-mono text-xs text-muted">
        <span>
          © {new Date().getFullYear()} {t.footer}
        </span>
        <span>React · TypeScript · Three.js · GSAP · Spectrum UI</span>
      </footer>

      {/* 封底：撑满整屏宽的刊名，字母悬停时会跳一下 */}
      <div aria-hidden className="cn-mark relative left-1/2 mt-8 w-screen -translate-x-1/2 overflow-hidden">
        <p className="whitespace-nowrap pb-[0.14em] text-center font-display text-[18vw] leading-[0.8] tracking-[-0.045em]">
          {Array.from('Fox-Program').map((c, i) => (
            <span
              key={i}
              className={`cn-ch inline-block transition-[transform,color] duration-300 hover:-translate-y-[0.06em] ${
                i < 3 ? 'text-ink hover:text-fox' : i === 3 ? 'text-fox' : 'outline-text outline-strong hover:text-ink'
              }`}
            >
              {c}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
