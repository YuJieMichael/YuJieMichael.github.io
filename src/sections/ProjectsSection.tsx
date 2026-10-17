import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { ArrowUpRight, Github } from 'lucide-react'
import { useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../effects/gsap'
import SectionHeading from '../components/SectionHeading'
import StoryImage from '../components/StoryImage'
import { PROJECTS, type Project, type ProjectImage } from '../data/profile'
import { useLanguage } from '../i18n/LanguageContext'

export default function ProjectsSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })
  const totalCards = PROJECTS.length
  const { t } = useLanguage()
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.utils.toArray<HTMLElement>('.pj-card').forEach((card) => {
        gsap
          .timeline({ scrollTrigger: { trigger: card, start: 'top 75%' } })
          .from(card.querySelectorAll('.pj-head > *'), { y: 24, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' })
          .fromTo(
            card.querySelectorAll('.pj-img'),
            { clipPath: 'inset(100% 0% 0% 0% round 16px)' },
            { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.1, stagger: 0.12, ease: 'power4.inOut' },
            0.15,
          )
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="work" className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 md:px-12 md:pt-16">
      <SectionHeading index="02" text={t.workLabel} className="mb-10 px-1 md:mb-14" />
      <div ref={containerRef} className="relative">
        {PROJECTS.map((project, index) => {
          const targetScale = 1 - (totalCards - 1 - index) * 0.03
          return (
            <ProjectCard
              key={project.name}
              project={project}
              index={index}
              progress={scrollYProgress}
              range={[index / totalCards, 1]}
              targetScale={targetScale}
            />
          )
        })}
      </div>
    </section>
  )
}

interface ProjectCardProps {
  project: Project
  index: number
  progress: MotionValue<number>
  range: [number, number]
  targetScale: number
}

const linkClass =
  'inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 font-mono text-xs text-ink transition-colors duration-200 hover:border-fox hover:text-fox'

function ProjectCard({ project, index, progress, range, targetScale }: ProjectCardProps) {
  const scale = useTransform(progress, range, [1, targetScale])
  const { lang, t } = useLanguage()
  const [col1a, col1b, col2] = project.images

  return (
    <div className="sticky top-24 flex h-[85vh] items-start justify-center md:top-28">
      <motion.div
        data-spotlight
        style={{ scale, top: `${index * 28}px` }}
        className="pj-card spotlight relative flex h-[72vh] w-full origin-top flex-col gap-3 rounded-3xl border border-ink/15 bg-surface p-4 shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.9)] sm:p-6 md:h-[70vh] md:gap-4 md:p-8"
      >
        <div className="pj-head flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="font-mono text-xs text-fox">
              {String(index + 1).padStart(2, '0')} <span className="text-muted">/ {project.period[lang]}</span>
            </p>
            <h3 className="mt-1 font-display text-[clamp(1.75rem,3.4vw,3rem)] leading-tight text-ink">{project.name}</h3>
            <p className="text-sm text-muted">{project.tagline[lang]}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {project.live && (
              <a href={project.live} target="_blank" rel="noreferrer" className={linkClass}>
                <ArrowUpRight size={14} /> {t.liveDemo}
              </a>
            )}
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noreferrer" className={linkClass}>
                <Github size={14} /> {t.sourceCode}
              </a>
            )}
            {!project.live && !project.repo && (
              <span className="rounded-full border border-ink/15 px-3 py-1.5 font-mono text-xs text-muted">{t.privateProject}</span>
            )}
          </div>
        </div>

        <p className="pj-desc max-w-3xl text-sm md:line-clamp-3 leading-relaxed text-ink/80 md:text-base">{project.description[lang]}</p>
        <ul className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <li key={tag} className="rounded-md bg-ink/[0.06] px-2 py-0.5 font-mono text-[11px] text-ink/75 md:text-xs">
              {tag}
            </li>
          ))}
        </ul>

        {project.phones ? (
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 md:gap-4">
            {project.images.map((img, i) => (
              <CardImage key={i} image={img} alt={project.name} className="h-full min-h-0 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 gap-3 md:gap-4">
            {/* Col1：40%，两张上下堆叠 */}
            <div className="flex min-h-0 w-[40%] flex-col gap-3 md:gap-4">
              <CardImage image={col1a} alt={project.name} className="min-h-0 w-full flex-1" />
              <CardImage image={col1b} alt={project.name} className="min-h-0 w-full flex-1" />
            </div>
            {/* Col2：60%，一张高图 */}
            <div className="min-h-0 flex-1">
              <CardImage image={col2} alt={project.name} size="lg" className="h-full w-full" />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

/** 章节图（点开故事）或项目截图 */
function CardImage({ image, alt, size = 'sm', className }: { image: ProjectImage; alt: string; size?: 'sm' | 'lg'; className: string }) {
  const style = `pj-img ${className} rounded-2xl bg-[#15161A] object-contain`
  if ('chapter' in image) return <StoryImage chapter={image.chapter} size={size} className={style} />
  return <img src={image.src} alt={alt} loading="lazy" decoding="async" draggable={false} data-cloth className={style} />
}
