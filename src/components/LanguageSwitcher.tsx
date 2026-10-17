import { useLanguage } from '../i18n/LanguageContext'
import { LANGS } from '../i18n/strings'

/** 中 / EN / FR 切换，当前语言高亮 */
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useLanguage()
  return (
    <div role="group" aria-label={t.switchLang} className={`flex items-center gap-0.5 font-mono text-xs ${className}`}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.htmlLang}
          aria-pressed={lang === l.code}
          onClick={() => setLang(l.code)}
          className={`rounded-full px-2 py-1 transition-colors duration-200 ${
            lang === l.code ? 'bg-ink/10 text-ink' : 'text-ink/50 hover:text-ink'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
