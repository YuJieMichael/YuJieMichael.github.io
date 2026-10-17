import { gsap } from 'gsap'

/**
 * 布料按压效果：把视口当成一块弹性布。
 *
 * - 视口切成 COLS×ROWS 个网格节点，每个节点有位移 (x,y,z) 和速度。
 * - 节点受三种力：回到原位的弹簧力、和相邻节点的耦合（产生向外传播的波纹）、
 *   鼠标的按压力（按下 z，并把周围布料往按压点拉扯，强度随距离衰减）。
 * - 每帧对所有带 data-cloth 的 DOM 元素，在它四个角采样布料位移，
 *   用 matrix3d 把矩形映射成变形后的四边形 —— 页面仍是普通 DOM，没用 Canvas 画内容。
 */

const COLS = 28
const ROWS = 18
const PERSPECTIVE = 900 // 按压深度换算成缩放的“相机距离”
const PRESS_RADIUS = 240 // 鼠标影响半径（px）
const PRESS_DEPTH = 200 // 中心最大下陷深度
const PULL = 0.1 // 周边布料被拉向按压点的比例
const STIFFNESS = 0.07 // 回弹弹簧
const COUPLING = 0.07 // 相邻节点耦合（波纹）
const DAMPING = 0.84 // 阻尼
const PRESS_FOLLOW = 0.2 // 节点追随按压目标的速度
const MAX_OFFSET = 36 // 单点最大屏幕位移，防止极端形变
const REST_EPSILON = 0.05

interface ClothState {
  el: HTMLElement
  /** 上一帧写入的四个角（元素本地坐标），用来从 getBoundingClientRect 反推未变形位置 */
  corners: number[] | null
}

export function initCloth(): () => void {
  if (window.matchMedia('(pointer: coarse)').matches) return () => {}

  const n = COLS * ROWS
  const dx = new Float32Array(n)
  const dy = new Float32Array(n)
  const dz = new Float32Array(n)
  const vx = new Float32Array(n)
  const vy = new Float32Array(n)
  const vz = new Float32Array(n)
  // 每个节点最终在屏幕上的偏移（包含透视）
  const ox = new Float32Array(n)
  const oy = new Float32Array(n)

  let vw = window.innerWidth
  let vh = window.innerHeight
  let mouseX = -9999
  let mouseY = -9999
  let mouseActive = false
  let resting = true
  let elements: ClothState[] = []
  let frameCount = 0

  const collect = () => {
    const known = new Map(elements.map((s) => [s.el, s]))
    elements = Array.from(document.querySelectorAll<HTMLElement>('[data-cloth]')).map(
      (el) => known.get(el) ?? { el, corners: null },
    )
  }

  const restX = (c: number) => (c / (COLS - 1)) * vw
  const restY = (r: number) => (r / (ROWS - 1)) * vh

  const step = () => {
    let energy = 0
    const sigma2 = 2 * (PRESS_RADIUS / 2.2) ** 2
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c
        // 四条边固定，像绷在框上的布
        if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) continue

        const lapX = dx[i - 1] + dx[i + 1] + dx[i - COLS] + dx[i + COLS] - 4 * dx[i]
        const lapY = dy[i - 1] + dy[i + 1] + dy[i - COLS] + dy[i + COLS] - 4 * dy[i]
        const lapZ = dz[i - 1] + dz[i + 1] + dz[i - COLS] + dz[i + COLS] - 4 * dz[i]

        let ax = -STIFFNESS * dx[i] + COUPLING * lapX
        let ay = -STIFFNESS * dy[i] + COUPLING * lapY
        let az = -STIFFNESS * dz[i] + COUPLING * lapZ

        if (mouseActive) {
          const px = restX(c)
          const py = restY(r)
          const d2 = (px - mouseX) ** 2 + (py - mouseY) ** 2
          const falloff = Math.exp(-d2 / sigma2)
          if (falloff > 0.002) {
            ax += ((mouseX - px) * PULL * falloff - dx[i]) * PRESS_FOLLOW * falloff
            ay += ((mouseY - py) * PULL * falloff - dy[i]) * PRESS_FOLLOW * falloff
            az += (-PRESS_DEPTH * falloff - dz[i]) * PRESS_FOLLOW * falloff
          }
        }

        vx[i] = (vx[i] + ax) * DAMPING
        vy[i] = (vy[i] + ay) * DAMPING
        vz[i] = (vz[i] + az) * DAMPING
        dx[i] += vx[i]
        dy[i] += vy[i]
        dz[i] += vz[i]
        energy += Math.abs(dx[i]) + Math.abs(dy[i]) + Math.abs(dz[i]) + Math.abs(vz[i])
      }
    }

    // 透视：下陷的点向按压中心收缩，形成凹坑
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c
        const shrink = PERSPECTIVE / (PERSPECTIVE - dz[i]) - 1
        // 透视收缩只在按压半径内按距离计算，远处不会被放大
        let rx = restX(c) + dx[i] - mouseX
        let ry = restY(r) + dy[i] - mouseY
        const dist = Math.hypot(rx, ry)
        if (dist > PRESS_RADIUS) {
          rx *= PRESS_RADIUS / dist
          ry *= PRESS_RADIUS / dist
        }
        ox[i] = clamp(dx[i] + rx * shrink, MAX_OFFSET)
        oy[i] = clamp(dy[i] + ry * shrink, MAX_OFFSET)
      }
    }
    return energy / n
  }

  /** 屏幕坐标处的布料偏移（双线性插值） */
  const sample = (sx: number, sy: number, out: [number, number]) => {
    const gx = Math.min(Math.max((sx / vw) * (COLS - 1), 0), COLS - 1.0001)
    const gy = Math.min(Math.max((sy / vh) * (ROWS - 1), 0), ROWS - 1.0001)
    const c = Math.floor(gx)
    const r = Math.floor(gy)
    const fx = gx - c
    const fy = gy - r
    const i = r * COLS + c
    const lerp2 = (a: Float32Array) =>
      (a[i] * (1 - fx) + a[i + 1] * fx) * (1 - fy) + (a[i + COLS] * (1 - fx) + a[i + COLS + 1] * fx) * fy
    out[0] = lerp2(ox)
    out[1] = lerp2(oy)
  }

  const tmp: [number, number] = [0, 0]
  const reset = (s: ClothState) => {
    if (!s.corners) return
    s.el.style.transform = ''
    s.el.style.transformOrigin = ''
    s.corners = null
  }

  const apply = () => {
    for (const s of elements) {
      const el = s.el
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) continue
      const rect = el.getBoundingClientRect()
      if (rect.bottom < -50 || rect.top > vh + 50 || rect.right < -50 || rect.left > vw + 50) {
        reset(s)
        continue
      }

      // 反推元素未变形时的屏幕位置与（祖先 transform 造成的）缩放
      let minX = 0
      let minY = 0
      let spanX = w
      if (s.corners) {
        const xs = [s.corners[0], s.corners[2], s.corners[4], s.corners[6]]
        const ys = [s.corners[1], s.corners[3], s.corners[5], s.corners[7]]
        minX = Math.min(...xs)
        minY = Math.min(...ys)
        spanX = Math.max(...xs) - minX || w
      }
      const k = rect.width / spanX // 祖先缩放
      const left = rect.left - minX * k
      const top = rect.top - minY * k

      // 四个角：左上、右上、右下、左下
      const local = [0, 0, w, 0, w, h, 0, h]
      const dest = new Array<number>(8)
      let moved = 0
      for (let j = 0; j < 8; j += 2) {
        sample(left + local[j] * k, top + local[j + 1] * k, tmp)
        dest[j] = local[j] + tmp[0] / k
        dest[j + 1] = local[j + 1] + tmp[1] / k
        moved += Math.abs(tmp[0]) + Math.abs(tmp[1])
      }

      if (moved < 0.6) {
        reset(s)
        continue
      }
      const m = rectToQuad(w, h, dest)
      if (!m) continue
      el.style.transformOrigin = '0 0'
      el.style.transform = `matrix3d(${m.join(',')})`
      s.corners = dest
    }
  }

  const tick = () => {
    if (++frameCount % 60 === 1) collect()
    if (resting && !mouseActive) return
    const energy = step()
    apply()
    resting = !mouseActive && energy < REST_EPSILON
    if (resting) {
      dx.fill(0); dy.fill(0); dz.fill(0); vx.fill(0); vy.fill(0); vz.fill(0); ox.fill(0); oy.fill(0)
      elements.forEach(reset)
    }
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    mouseX = e.clientX
    mouseY = e.clientY
    mouseActive = true
    resting = false
  }
  const onLeave = () => {
    mouseActive = false
  }
  const onLeaveDoc = (e: MouseEvent) => {
    if (!e.relatedTarget) onLeave()
  }
  const onResize = () => {
    vw = window.innerWidth
    vh = window.innerHeight
  }

  if (import.meta.env.DEV) Object.assign(window, { __cloth: { ox, oy, dz, COLS, ROWS } })

  collect()
  gsap.ticker.add(tick)
  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('mouseout', onLeaveDoc)
  window.addEventListener('blur', onLeave)
  window.addEventListener('resize', onResize)

  return () => {
    gsap.ticker.remove(tick)
    window.removeEventListener('pointermove', onMove)
    document.removeEventListener('mouseout', onLeaveDoc)
    window.removeEventListener('blur', onLeave)
    window.removeEventListener('resize', onResize)
    elements.forEach(reset)
  }
}

/**
 * 把 w×h 的矩形 (0,0)(w,0)(w,h)(0,h) 映射到四边形 q 的投影矩阵（matrix3d，列主序）。
 * 单位正方形 → 四边形用 Heckbert 公式，再预先缩放 1/w、1/h。
 */
function rectToQuad(w: number, h: number, q: number[]): number[] | null {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q
  const dx1 = x1 - x2
  const dx2 = x3 - x2
  const dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2
  const dy2 = y3 - y2
  const dy3 = y0 - y1 + y2 - y3
  const den = dx1 * dy2 - dx2 * dy1
  if (Math.abs(den) < 1e-9) return null
  const g = (dx3 * dy2 - dx2 * dy3) / den
  const hh = (dx1 * dy3 - dx3 * dy1) / den
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + hh * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + hh * y3
  // 2D 投影矩阵 [a/w b/h x0; d/w e/h y0; g/w hh/h 1] 嵌入 4×4
  return [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1]
}

const clamp = (v: number, max: number) => (v > max ? max : v < -max ? -max : v)
