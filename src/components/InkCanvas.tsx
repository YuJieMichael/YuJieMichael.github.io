import { useEffect, useRef } from 'react'

const BURST_GROW = 0.35 // 秒：扩散到最大
const BURST_FADE = 1.15 // 秒：随后淡出
const BURST_RADIUS = 70 // px，小一点，不挡内容
const BURST_LOBES = 5
const BURST_OPACITY = 0.8
const TRAIL_LIFE = 1 // 秒：拖动轨迹每个点的寿命

interface Lobe {
  angle: number
  dist: number
  radius: number
  hueShift: number
  seed: number
}

interface Burst {
  x: number
  y: number
  born: number
  hue: number
  lobes: Lobe[]
}

interface TrailPoint {
  x: number
  y: number
  born: number
  hue: number
}

const neonHue = () => Math.floor(Math.random() * 360)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * 点击墨水 + 拖动轨迹。透明画布浮在最上层、pointer-events:none，
 * 只叠加发光色彩（lighter 混合），不挡点击和滚动，也没有黑底。
 */
export default function InkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const bursts: Burst[] = []
    const trail: TrailPoint[] = []
    let dpr = 1
    let frame = 0
    let dragging = false
    let dragHue = 0
    let downX = 0
    let downY = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resize()

    const now = () => performance.now() / 1000

    const spawnBurst = (x: number, y: number) => {
      const lobes: Lobe[] = Array.from({ length: BURST_LOBES }, (_, i) => ({
        angle: (i / BURST_LOBES) * Math.PI * 2 + Math.random() * 0.8,
        dist: i === 0 ? 0 : BURST_RADIUS * (0.25 + Math.random() * 0.3),
        radius: i === 0 ? BURST_RADIUS * 0.55 : BURST_RADIUS * (0.25 + Math.random() * 0.2),
        hueShift: (Math.random() - 0.5) * 80,
        seed: Math.random() * 100,
      }))
      bursts.push({ x, y, born: now(), hue: neonHue(), lobes })
      start()
    }

    /** 一团边缘不规则、带辉光的墨 */
    const drawLobe = (cx: number, cy: number, r: number, hue: number, alpha: number, seed: number, t: number) => {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      grad.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha * 0.55})`)
      grad.addColorStop(0.55, `hsla(${hue}, 100%, 55%, ${alpha * 0.35})`)
      grad.addColorStop(0.85, `hsla(${hue + 30}, 100%, 60%, ${alpha * 0.5})`)
      grad.addColorStop(1, `hsla(${hue + 30}, 100%, 60%, 0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      const steps = 18
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2
        const wobble =
          1 + 0.12 * Math.sin(a * 3 + seed + t * 1.5) + 0.08 * Math.sin(a * 5 - seed * 2 + t * 2.2)
        const px = cx + Math.cos(a) * r * wobble
        const py = cy + Math.sin(a) * r * wobble
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    }

    const render = () => {
      const t = now()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'lighter'

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]
        const age = t - b.born
        if (age > BURST_GROW + BURST_FADE) {
          bursts.splice(i, 1)
          continue
        }
        const grow = easeOutCubic(Math.min(age / BURST_GROW, 1))
        const alpha = BURST_OPACITY * (age < BURST_GROW ? 1 : 1 - (age - BURST_GROW) / BURST_FADE)
        for (const lobe of b.lobes) {
          const cx = b.x + Math.cos(lobe.angle) * lobe.dist * grow
          const cy = b.y + Math.sin(lobe.angle) * lobe.dist * grow
          drawLobe(cx, cy, lobe.radius * grow + 2, b.hue + lobe.hueShift, alpha, lobe.seed, t)
        }
      }

      while (trail.length && t - trail[0].born > TRAIL_LIFE) trail.shift()
      if (trail.length > 1) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        // 两遍：外层宽而淡的辉光 + 内层细而亮的芯
        for (const pass of [
          { width: 10, light: 55, alpha: 0.16 },
          { width: 3.5, light: 72, alpha: 0.65 },
        ]) {
          for (let i = 1; i < trail.length; i++) {
            const p0 = trail[i - 1]
            const p1 = trail[i]
            const life = 1 - (t - p1.born) / TRAIL_LIFE
            const dx = p1.x - p0.x
            const dy = p1.y - p0.y
            const len = Math.hypot(dx, dy) || 1
            // 沿法线方向随时间扭动
            const wave = (p: TrailPoint, k: number) => Math.sin(t * 5 + k * 0.45) * 3.5 * (1 - (t - p.born) / TRAIL_LIFE)
            const nx = -dy / len
            const ny = dx / len
            ctx.strokeStyle = `hsla(${p1.hue + i * 2}, 100%, ${pass.light}%, ${pass.alpha * life})`
            ctx.lineWidth = pass.width * (0.4 + 0.6 * life)
            ctx.beginPath()
            ctx.moveTo(p0.x + nx * wave(p0, i - 1), p0.y + ny * wave(p0, i - 1))
            ctx.lineTo(p1.x + nx * wave(p1, i), p1.y + ny * wave(p1, i))
            ctx.stroke()
          }
        }
      }

      ctx.globalCompositeOperation = 'source-over'
      if (bursts.length || trail.length) frame = requestAnimationFrame(render)
      else frame = 0
    }

    const start = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging = true
      dragHue = neonHue()
      downX = e.clientX
      downY = e.clientY
      spawnBurst(e.clientX, e.clientY)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      if (trail.length === 0 && Math.hypot(e.clientX - downX, e.clientY - downY) < 4) return
      trail.push({ x: e.clientX, y: e.clientY, born: now(), hue: dragHue })
      start()
    }
    const onUp = () => {
      dragging = false
    }

    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('blur', onUp)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('blur', onUp)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] h-screen w-screen"
    />
  )
}
