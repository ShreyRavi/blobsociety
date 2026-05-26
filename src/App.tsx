import { useEffect, useRef, useState } from 'react'
import { CanvasRenderer } from './renderer/CanvasRenderer'
import { StatsPanel } from './ui/StatsPanel'
import { ControlSheet } from './ui/ControlSheet'
import { BlobCard } from './ui/BlobCard'
import { DebugOverlay } from './ui/DebugOverlay'
import { getEngine } from './engine/SimEngine'
import { selectBlob, useSelectedBlob, useSimSnapshot } from './store/simStore'

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

    // Canvas click → select blob
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const pz = renderer.getPinchZoom()
      const [wx, wy] = pz.canvasToWorld(cx, cy)

      const buf = engine.readBuf
      let bestId: number | null = null
      let bestD2 = 400  // ~20px click radius in world coords
      for (let i = 0; i < buf.alive.length; i++) {
        if (!buf.alive[i]) continue
        const dx = buf.x[i] - wx
        const dy = buf.y[i] - wy
        const r = 4 * buf.size[i]
        const d2 = dx * dx + dy * dy
        if (d2 < bestD2 + r * r) { bestD2 = d2; bestId = i }
      }
      selectBlob(bestId)
    }
    canvas.addEventListener('click', onClick)

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
        border: '1px solid #333',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
        All blobs have gone extinct
      </div>
      <div style={{ color: '#888', marginBottom: 14 }}>
        The population did not survive. The world continues.
      </div>
      <button
        onClick={() => location.reload()}
        style={{
          background: '#7c4dff',
          border: 'none',
          color: '#fff',
          borderRadius: 20,
          padding: '6px 20px',
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: 'monospace',
          fontWeight: 600,
        }}
      >
        Restart simulation
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

export default function App() {
  return <SimCanvas />
}
