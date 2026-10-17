import FadeIn from './FadeIn'
import ScrambleText from './ScrambleText'

/** 区块标题：细分隔线 + 狐狸橙编号 + 衬线标题（进入视口时解码） */
export default function SectionHeading({ index, text, className = '' }: { index: string; text: string; className?: string }) {
  return (
    <FadeIn y={20} className={className}>
      <div className="flex items-baseline gap-4 border-t border-ink/10 pt-6 md:gap-6">
        <span className="font-mono text-xs text-fox md:text-sm">// {index}</span>
        <h2 className="font-display text-4xl leading-none text-ink md:text-6xl">
          <ScrambleText key={text} text={text} />
        </h2>
      </div>
    </FadeIn>
  )
}
