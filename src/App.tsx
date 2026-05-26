import { useEffect, useRef, useState, Component, type ReactNode, type ErrorInfo } from 'react'
import { CanvasRenderer } from './renderer/CanvasRenderer'
import { StatsPanel } from './ui/StatsPanel'
import { ControlSheet } from './ui/ControlSheet'
import { BlobCard } from './ui/BlobCard'
import { DebugOverlay } from './ui/DebugOverlay'
import { getEngine } from './engine/SimEngine'
import { selectBlob, useSelectedBlob, useSimSnapshot, spawnBlobAtWorld, dropFoodAtWorld, respawnBlobs } from './store/simStore'

function SimCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const selectedId = useSelectedBlob()
  const snap = useSimSnapshot()
  const [showPheromone, setShowPheromone] = useState(false)
  const [pheroChannel, setPheroChannel] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new CanvasRenderer(canvas)
    renderer.attach()
    rendererRef.current = renderer

    const engine = getEngine()
    engine.start()

    const getWorldCoords = (e: MouseEvent): [number, number] => {
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      return renderer.getPinchZoom().canvasToWorld(cx, cy)
    }

    // Left-click: select blob; Shift+click: drop food
    const onClick = (e: MouseEvent) => {
      const [wx, wy] = getWorldCoords(e)
      if (e.shiftKey) {
        dropFoodAtWorld(wx, wy)
        return
      }
      const buf = engine.readBuf
      let bestId: number | null = null
      let bestD2 = 625  // ~25px click radius in world coords
      for (let i = 0; i < buf.alive.length; i++) {
        if (!buf.alive[i]) continue
        const dx = buf.x[i] - wx
        const dy = buf.y[i] - wy
        const r = 8 * buf.size[i]
        const d2 = dx * dx + dy * dy
        if (d2 < bestD2 + r * r) { bestD2 = d2; bestId = i }
      }
      selectBlob(bestId)
    }
    canvas.addEventListener('click', onClick)

    // Right-click: spawn blob at cursor
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      const [wx, wy] = getWorldCoords(e)
      spawnBlobAtWorld(wx, wy)
    }
    canvas.addEventListener('contextmenu', onContextMenu)

    // Keyboard shortcuts
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectBlob(null)
      if (e.key === 'p' || e.key === 'P') engine.setPaused(!engine.paused)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      engine.stop()
      renderer.destroy()
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // Sync renderer settings
  useEffect(() => {
    const r = rendererRef.current
    if (!r) return
    r.selectedBlobId = selectedId
    r.showPheromone = showPheromone
    r.pheroChannel = pheroChannel
  }, [selectedId, showPheromone, pheroChannel])

  // Render on each snapshot
  useEffect(() => {
    const r = rendererRef.current
    if (!r || !snap) return
    r.render(snap)
  }, [snap])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0d0d1a' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
      />
      <StatsPanel />
      {snap?.crashError && <CrashBanner message={snap.crashError} />}
      {snap && snap.blobCount === 0 && snap.tick > 0 && !snap.crashError && <ExtinctionBanner />}
      <ControlSheet />
      <BlobCard />
      <DebugOverlay
        showPheromone={showPheromone}
        pheroChannel={pheroChannel}
        onTogglePheromone={setShowPheromone}
        onSetChannel={setPheroChannel}
      />
    </div>
  )
}

function ExtinctionBanner() {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (countdown <= 0) {
      respawnBlobs(20)
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        background: 'rgba(0,0,0,0.88)',
        color: '#e0e0e0',
        padding: '20px 28px',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 13,
        textAlign: 'center',
        backdropFilter: 'blur(6px)',
        border: '1px solid #ff6b6b',
        minWidth: 220,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: '#ff6b6b', marginBottom: 6 }}>
        Extinction event
      </div>
      <div style={{ color: '#aaa', marginBottom: 14 }}>
        {countdown > 0 ? `Respawning in ${countdown}…` : 'Respawning…'}
      </div>
      <button
        onClick={() => { respawnBlobs(20); setCountdown(0) }}
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid #555',
          color: '#ccc',
          borderRadius: 20,
          padding: '4px 16px',
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        Respawn now
      </button>
    </div>
  )
}

function CrashBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        background: 'rgba(200,0,0,0.85)',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 13,
        maxWidth: 400,
        textAlign: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Simulation Error</div>
      <div style={{ opacity: 0.9 }}>{message}</div>
      <div style={{ marginTop: 10, opacity: 0.7, fontSize: 11 }}>Reload to restart</div>
    </div>
  )
}

class SimErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  componentDidCatch(_e: Error, info: ErrorInfo) { console.error('SimCanvas error:', info.componentStack) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', color: '#e0e0e0' }}>
          <div style={{ background: 'rgba(200,0,0,0.85)', padding: '20px 28px', borderRadius: 8, maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Render Error</div>
            <div style={{ opacity: 0.9, fontSize: 12, marginBottom: 10 }}>{this.state.error}</div>
            <button onClick={() => location.reload()} style={{ background: '#7c4dff', border: 'none', color: '#fff', borderRadius: 20, padding: '6px 20px', cursor: 'pointer', fontFamily: 'monospace' }}>Reload</button>
          </div>
        </div>
      )
    }
    return this.state.error === null ? this.props.children : null
  }
}

export default function App() {
  return <SimErrorBoundary><SimCanvas /></SimErrorBoundary>
}
