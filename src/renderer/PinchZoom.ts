export class PinchZoom {
  zoom = 1.0
  panX = 0
  panY = 0

  canvas: HTMLCanvasElement
  minZoom = 0.2
  maxZoom = 8.0
  dragging = false
  lastX = 0
  lastY = 0
  touches: Map<number, { x: number; y: number }> = new Map()
  lastPinchDist = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  attach(): () => void {
    const el = this.canvas

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      this.zoomAt(cx, cy, factor)
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      this.dragging = true
      this.lastX = e.clientX
      this.lastY = e.clientY
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!this.dragging) return
      this.panX += e.clientX - this.lastX
      this.panY += e.clientY - this.lastY
      this.lastX = e.clientX
      this.lastY = e.clientY
    }

    const onMouseUp = () => { this.dragging = false }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      for (const t of Array.from(e.changedTouches)) {
        this.touches.set(t.identifier, { x: t.clientX, y: t.clientY })
      }
      if (this.touches.size === 2) {
        this.lastPinchDist = this.pinchDist()
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      for (const t of Array.from(e.changedTouches)) {
        this.touches.set(t.identifier, { x: t.clientX, y: t.clientY })
      }

      if (this.touches.size === 2) {
        const d = this.pinchDist()
        if (this.lastPinchDist > 0) {
          const [cx, cy] = this.pinchCenter()
          const rect = this.canvas.getBoundingClientRect()
          this.zoomAt(cx - rect.left, cy - rect.top, d / this.lastPinchDist)
        }
        this.lastPinchDist = d
      } else if (this.touches.size === 1) {
        const vals = Array.from(this.touches.values())
        const t = vals[0]
        const id = Array.from(this.touches.keys())[0]
        const prev = e.changedTouches[0]
        if (prev.identifier === id) {
          this.panX += t.x - prev.clientX
          this.panY += t.y - prev.clientY
        }
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        this.touches.delete(t.identifier)
      }
      this.lastPinchDist = 0
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }

  zoomAt(cx: number, cy: number, factor: number): void {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor))
    const scale = newZoom / this.zoom
    this.panX = cx - (cx - this.panX) * scale
    this.panY = cy - (cy - this.panY) * scale
    this.zoom = newZoom
  }

  // Transform canvas coordinates → world coordinates
  canvasToWorld(cx: number, cy: number): [number, number] {
    return [(cx - this.panX) / this.zoom, (cy - this.panY) / this.zoom]
  }

  // Apply transform to a canvas 2D context
  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(this.zoom, 0, 0, this.zoom, this.panX, this.panY)
  }

  resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  private pinchDist(): number {
    const vals = Array.from(this.touches.values())
    const dx = vals[0].x - vals[1].x
    const dy = vals[0].y - vals[1].y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private pinchCenter(): [number, number] {
    const vals = Array.from(this.touches.values())
    return [(vals[0].x + vals[1].x) / 2, (vals[0].y + vals[1].y) / 2]
  }
}
