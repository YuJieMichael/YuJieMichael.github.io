import { useLanguage } from '../i18n/LanguageContext'

interface ContactButtonProps {
  href?: string
  variant?: 'solid' | 'outline'
  className?: string
}

/** 「联系我」按钮，全站复用 */
export default function ContactButton({ href = '#contact', variant = 'outline', className = '' }: ContactButtonProps) {
  const { t } = useLanguage()
  const look =
    variant === 'solid'
      ? 'bg-fox text-bg hover:brightness-110'
      : 'border border-ink/25 text-ink hover:border-ink/60'
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition duration-200 md:text-base ${look} ${className}`}
    >
      {t.contact}
    </a>
  )
}
