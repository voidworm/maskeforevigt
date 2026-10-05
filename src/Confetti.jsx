import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const COLORS = ['#0042BB', '#DC6021', '#FFB734', '#006274', '#376158', '#6B4E7C', '#B13545', '#A2D8D2', '#606042', '#995174']
const SHAPES = ['rect', 'rect', 'star', 'star', 'circle']
const COUNT = 300
const GRAVITY = 0.15
const DRAG = 0.99

function makeParticle(w, h) {
  // Burst from the bottom-center, fanning upward across the screen
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9
  const speed = 10 + Math.random() * 16
  return {
    x: w / 2,
    y: h * 0.7,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 6 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.4,
    wobble: Math.random() * Math.PI * 2,
    flip: Math.random() * Math.PI * 2,
    flipSpeed: 0.1 + Math.random() * 0.25,
    twinkle: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.2 + Math.random() * 0.3,
    life: 0,
    maxLife: 180 + Math.random() * 120,
  }
}

const BASE = 16 // sprite shape size in px
const PAD = 24 // room for the glow
const sprites = new Map()

// Glow is expensive (shadowBlur per draw), so render each look once and blit it
function getSprite(shape, color, hot) {
  const key = `${shape}|${color}|${hot}`
  let c = sprites.get(key)
  if (c) return c
  const dim = (BASE + PAD) * 2
  c = document.createElement('canvas')
  c.width = c.height = dim
  const ctx = c.getContext('2d')
  ctx.translate(dim / 2, dim / 2)
  ctx.shadowColor = hot ? '#ffffff' : color
  ctx.shadowBlur = hot ? 18 : 8
  ctx.fillStyle = hot ? '#ffffff' : color
  if (shape === 'rect') {
    ctx.fillRect(-BASE / 2, -BASE / 4, BASE, BASE / 2)
  } else if (shape === 'circle') {
    ctx.beginPath()
    ctx.arc(0, 0, BASE / 3, 0, Math.PI * 2)
    ctx.fill()
  } else {
    starPath(ctx, BASE)
    ctx.fill()
  }
  sprites.set(key, c)
  return c
}

function starPath(ctx, r) {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.25
    const a = (i * Math.PI) / 4
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad)
  }
  ctx.closePath()
}

const Confetti = forwardRef(function Confetti(_, ref) {
  const canvasRef = useRef(null)
  const particles = useRef([])
  const raf = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  const tick = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = 'lighter'

    particles.current = particles.current.filter((p) => p.life < p.maxLife && p.y < canvas.height + 50)

    for (const p of particles.current) {
      p.vx *= DRAG
      p.vy = p.vy * DRAG + GRAVITY
      p.x += p.vx + Math.sin(p.wobble) * 0.6
      p.y += p.vy
      p.wobble += 0.1
      p.rotation += p.spin
      p.flip += p.flipSpeed
      p.twinkle += p.twinkleSpeed
      p.life++

      // Glitter: pieces flip in 3D and flash bright when they catch the light
      const flipScale = Math.cos(p.flip)
      const flash = Math.max(0, Math.sin(p.twinkle)) ** 6
      const fade = Math.min(1, (p.maxLife - p.life) / 40)

      ctx.save()
      ctx.globalAlpha = fade * (0.7 + 0.3 * Math.abs(flipScale))
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.scale(1, flipScale)
      const hot = flash > 0.4
      const sprite = getSprite(p.shape, p.color, hot)
      const k = (p.size / BASE) * (p.shape === 'star' ? 0.6 + flash * 0.6 : 1)
      ctx.scale(k, k)
      ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2)
      ctx.restore()
    }

    ctx.globalCompositeOperation = 'source-over'
    raf.current = particles.current.length ? requestAnimationFrame(tick) : 0
  }

  useImperativeHandle(ref, () => ({
    fire() {
      const { width, height } = canvasRef.current
      for (let i = 0; i < COUNT; i++) particles.current.push(makeParticle(width, height))
      if (!raf.current) raf.current = requestAnimationFrame(tick)
    },
  }))

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
    />
  )
})

export default Confetti
