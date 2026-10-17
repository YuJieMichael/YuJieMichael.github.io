import { useEffect, useRef, useState } from 'react'
import StoryImage from '../components/StoryImage'
import { MARQUEE_COUNT } from '../data/content'

const SLOTS = Array.from({ length: MARQUEE_COUNT }, (_, i) => i)
const ROW_ONE = SLOTS.slice(0, 11)
const ROW_TWO = SLOTS.slice(11)

export default function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const update = () => {
      const section = sectionRef.current
      if (!section) return
      const sectionTop = section.getBoundingClientRect().top + window.scrollY
      setOffset((window.scrollY - sectionTop + window.innerHeight) * 0.3)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="mt-10 flex flex-col gap-3 md:mt-14"
      style={{ overflowX: 'clip' }}
    >
      <MarqueeRow slots={ROW_ONE} translate={offset - 200} />
      <MarqueeRow slots={ROW_TWO} translate={-(offset - 200)} />
    </section>
  )
}

function MarqueeRow({ slots, translate }: { slots: number[]; translate: number }) {
  // 三倍复制，行宽远大于视口；居中对齐后左右两侧都有余量，位移时不会露出空白
  const tripled = [...slots, ...slots, ...slots]
  return (
    <div className="flex justify-center">
      <div
        className="flex w-max shrink-0 gap-3"
        style={{ transform: `translateX(${translate}px)`, willChange: 'transform' }}
      >
        {tripled.map((slot, i) => (
          <StoryImage
            key={i}
            slot={slot}
            className="h-[206px] w-[320px] shrink-0 rounded-xl bg-[#15161A] object-contain opacity-80 transition-opacity duration-300 hover:opacity-100 md:h-[240px] md:w-[372px]"
          />
        ))}
      </div>
    </div>
  )
}
