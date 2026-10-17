import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { LANGS, STRINGS, type Lang, type Strings } from './strings'

const isLang = (v: unknown): v is Lang => v === 'zh' || v === 'en' || v === 'fr'

/** 初始语言：链接里写了 ?lang=fr 或 #fr 就用它，否则一律英文（不记上次的选择） */
function detectLang(): Lang {
  const fromQuery = new URLSearchParams(window.location.search).get('lang')
  if (isLang(fromQuery)) return fromQuery
  const fromHash = window.location.hash.slice(1)
  if (isLang(fromHash)) return fromHash
  return 'en'
}

interface LanguageValue {
  lang: Lang
  t: Strings
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageValue>({
  lang: 'en',
  t: STRINGS.en,
  setLang: () => {},
})

export const useLanguage = () => useContext(LanguageContext)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = useCallback((next: Lang) => setLangState(next), [])

  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.code === lang)!.htmlLang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, t: STRINGS[lang] as Strings, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}
