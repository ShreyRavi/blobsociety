import type { SimSnapshot } from '../engine/SimEngine'
import { PinchZoom } from './PinchZoom'
import { WORLD_W, WORLD_H, PHERO_W, PHERO_H, PHERO_CHANNELS } from '../engine/constants'

const BASE_RADIUS = 8
const SPECIES_PALETTE = new Map<number, string>()
const bySpeciesCache = new Map<number, number[]>()

function speciesColor(id: number): string {
  let c = SPECIES_PALETTE.get(id)
  if (!c) {
    const hue = (id * 137.508) % 360
    const sat = 55 + (id % 4) * 5
    const lgt = 48 + (id % 3) * 4
    c = `hsl(${hue.toFixed(0)},${sat}%,${lgt}%)`
    SPECIES_PALETTE.set(id, c)
  }
  return c
}

export class CanvasRenderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  dpr: number
  pz: PinchZoom
  detach: (() => void) | null = null

  // Overlay modes
  showPheromone = false
  pheroChannel = 0  // 0=food,1=danger,2=territory,3=mating
  selectedBlobId: number | null = null

  // Scratch canvas for pheromone overlay
  pheroCanvas: OffscreenCanvas | null = null
  pheroCtx: OffscreenCanvasRenderingContext2D | null = null
  pheroImageData: ImageData | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2D context')
    this.ctx = ctx
    this.dpr = window.devicePixelRatio || 1
    this.pz = new PinchZoom(canvas)
    this.resize()

    if (typeof OffscreenCanvas !== 'undefined') {
      this.pheroCanvas = new OffscreenCanvas(PHERO_W, PHERO_H)
      this.pheroCtx = this.pheroCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D
      this.pheroImageData = this.pheroCtx.createImageData(PHERO_W, PHERO_H)
    }
  }

  attach(): void {
    this.detach = this.pz.attach()
    window.addEventListener('resize', this.resize)
  }

  destroy(): void {
    this.detach?.()
    window.removeEventListener('resize', this.resize)
  }

  private resize = (): void => {
    this.dpr = window.devicePixelRatio || 1
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    this.canvas.width = w * this.dpr
    this.canvas.height = h * this.dpr
  }

  render(snapshot: SimSnapshot): void {
    const { ctx, dpr } = this
    const cw = this.canvas.width
    const ch = this.canvas.height

    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cw / dpr, ch / dpr)

    // Apply pan/zoom
    this.pz.applyTransform(ctx)

    // Draw world background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, WORLD_W, WORLD_H)

    // Pheromone overlay
    if (this.showPheromone) {
      this.drawPheromone(snapshot.pheromoneBuffer)
    }

    // Food
    ctx.fillStyle = '#4caf50'
    ctx.beginPath()
    for (let f = 0; f < snapshot.foodPool.alive.length; f++) {
      if (!snapshot.foodPool.alive[f]) continue
      const r = 2 + snapshot.foodPool.value[f] / 15
      ctx.moveTo(snapshot.foodPool.x[f] + r, snapshot.foodPool.y[f])
      ctx.arc(snapshot.foodPool.x[f], snapshot.foodPool.y[f], r, 0, Math.PI * 2)
    }
    ctx.fill()

    // Blobs batched by species (reuse Map and arrays to avoid per-frame allocation)
    const { readBuf } = snapshot
    bySpeciesCache.forEach(arr => { arr.length = 0 })
    for (let i = 0; i < readBuf.alive.length; i++) {
      if (!readBuf.alive[i]) continue
      const s = readBuf.species[i]
      let arr = bySpeciesCache.get(s)
      if (!arr) { arr = []; bySpeciesCache.set(s, arr) }
      arr.push(i)
    }
    const bySpecies = bySpeciesCache

    const selectedSid = this.selectedBlobId !== null ? readBuf.species[this.selectedBlobId] : -1

    for (const [sid, blobs] of bySpecies) {
      if (sid === selectedSid) continue  // draw selected species last for z-order
      ctx.fillStyle = speciesColor(sid)
      ctx.beginPath()
      for (const i of blobs) {
        const r = BASE_RADIUS * readBuf.size[i]
        ctx.moveTo(readBuf.x[i] + r, readBuf.y[i])
        ctx.arc(readBuf.x[i], readBuf.y[i], r, 0, Math.PI * 2)
      }
      ctx.fill()
    }

    // Draw selected species on top (minus the selected blob itself, drawn last)
    if (selectedSid !== -1) {
      const blobs = bySpecies.get(selectedSid)
      if (blobs) {
        ctx.fillStyle = speciesColor(selectedSid)
        ctx.beginPath()
        for (const i of blobs) {
          if (i === this.selectedBlobId) continue
          const r = BASE_RADIUS * readBuf.size[i]
          ctx.moveTo(readBuf.x[i] + r, readBuf.y[i])
          ctx.arc(readBuf.x[i], readBuf.y[i], r, 0, Math.PI * 2)
        }
        ctx.fill()
      }
    }

    // Selected blob highlight
    if (this.selectedBlobId !== null && readBuf.alive[this.selectedBlobId]) {
      const i = this.selectedBlobId
      const r = BASE_RADIUS * readBuf.size[i]
      const sid = readBuf.species[i]

      // Vision radius ring
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.arc(readBuf.x[i], readBuf.y[i], readBuf.visionRadius[i], 0, Math.PI * 2)
      ctx.stroke()

      // Blob
      ctx.fillStyle = speciesColor(sid)
      ctx.beginPath()
      ctx.arc(readBuf.x[i], readBuf.y[i], r, 0, Math.PI * 2)
      ctx.fill()

      // White outline
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5 / this.pz.zoom
      ctx.beginPath()
      ctx.arc(readBuf.x[i], readBuf.y[i], r + 1, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }

  private drawPheromone(buf: Float32Array): void {
    const ctx = this.pheroCtx
    const canvas = this.pheroCanvas
    if (!ctx || !canvas || !this.pheroImageData) return

    const imgData = this.pheroImageData
    const ch = this.pheroChannel
    const pheroColors: [number, number, number][] = [
      [76, 175, 80],    // food: green
      [244, 67, 54],    // danger: red
      [33, 150, 243],   // territory: blue
      [233, 30, 99],    // mating: pink
    ]
    const [r, g, b] = pheroColors[ch] ?? [255, 255, 255]

    for (let y = 0; y < PHERO_H; y++) {
      for (let x = 0; x < PHERO_W; x++) {
        const v = Math.min(1, buf[(y * PHERO_W + x) * PHERO_CHANNELS + ch])
        const base = (y * PHERO_W + x) * 4
        imgData.data[base]     = r
        imgData.data[base + 1] = g
        imgData.data[base + 2] = b
        imgData.data[base + 3] = Math.round(v * 140)
      }
    }
    ctx.putImageData(imgData, 0, 0)

    const mainCtx = this.ctx
    mainCtx.save()
    mainCtx.imageSmoothingEnabled = false
    mainCtx.drawImage(canvas, 0, 0, WORLD_W, WORLD_H)
    mainCtx.restore()
  }

  getPinchZoom(): PinchZoom {
    return this.pz
  }
}
