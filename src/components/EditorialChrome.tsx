import { useLanguage } from '../i18n/LanguageContext'
import { SECTIONS, useCurrentSection, useSectionLabels } from '../lib/useCurrentSection'
import { TextStates } from './spectrum/TextStates'

/**
 * 杂志的「页眉页脚」：
 * - 全屏胶片颗粒，让深色底有印刷纸的质感
 * - 宽屏左右两侧的竖排书眉：左边是刊名和期号，右边是当前页码和栏目名
 */
export default function EditorialChrome() {
  const { t } = useLanguage()
  const current = useCurrentSection()
  const labels = useSectionLabels()
  const page = String(SECTIONS.indexOf(current) + 1).padStart(2, '0')

  return (
    <>
      <div aria-hidden className="grain pointer-events-none fixed z-[44]" />
      <div aria-hidden className="pointer-events-none fixed inset-y-0 left-0 z-[41] hidden w-14 items-center justify-center xl:flex">
        <p className="-rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.35em] text-muted/70">
          Fox-Program <span className="text-fox">—</span> {t.issueNo} <span className="text-fox">—</span> {t.issueSeason}
        </p>
      </div>
      <div aria-hidden className="pointer-events-none fixed inset-y-0 right-0 z-[41] hidden w-14 items-center justify-center xl:flex">
        <p className="rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.35em] text-muted/70">
          P. <span className="text-fox">{page}</span> <span className="text-fox">—</span> <TextStates text={labels[current]} />
        </p>
      </div>
    </>
  )
}
