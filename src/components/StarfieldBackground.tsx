import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 6000
const SPACE_SIZE = 1200

/** Three.js r128 蓝色星云：6000 个点粒子在 1200³ 立方体内缓慢自转 */
export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000)
    camera.position.z = 220

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < positions.length; i++) {
      positions[i] = (Math.random() - 0.5) * SPACE_SIZE
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // 柔和的圆形粒子（默认是方块）
    const sprite = document.createElement('canvas')
    sprite.width = sprite.height = 32
    const g = sprite.getContext('2d')!
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 32, 32)
    const texture = new THREE.CanvasTexture(sprite)
    const material = new THREE.PointsMaterial({
      color: 0x8fb4e6,
      size: 1.4,
      map: texture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // 鼠标视差：相机朝鼠标方向轻微偏移，带出纵深感
    const target = { x: 0, y: 0 }
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 24
      target.y = (e.clientY / window.innerHeight - 0.5) * -16
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    let frame = 0
    const tick = () => {
      points.rotation.y += 0.0012
      points.rotation.x += 0.0004
      camera.position.x += (target.x - camera.position.x) * 0.03
      camera.position.y += (target.y - camera.position.y) * 0.03
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    tick()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      texture.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 block h-screen w-screen"
    />
  )
}
