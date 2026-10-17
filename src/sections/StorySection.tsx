import FadeIn from '../components/FadeIn'
import SectionHeading from '../components/SectionHeading'
import { useLanguage } from '../i18n/LanguageContext'
import MarqueeSection from './MarqueeSection'
import StorySpread from './StorySpread'

/** 我的故事：一句说明 + 横向画册 + 两行手绘跑马灯，点图展开章节 */
export default function StorySection() {
  const { t } = useLanguage()
  return (
    <section id="story" className="py-16 md:py-24" style={{ overflowX: 'clip' }}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8 md:px-12">
        <SectionHeading index="05" text={t.storyLabel} />
        <FadeIn y={16}>
          <p className="mt-6 max-w-2xl leading-relaxed text-ink/75 md:text-lg">{t.storyIntro}</p>
        </FadeIn>
      </div>
      <StorySpread />
      <MarqueeSection />
    </section>
  )
}
