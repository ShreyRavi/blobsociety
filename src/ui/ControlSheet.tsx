import { useSimSnapshot, setPaused, setSpeed } from '../store/simStore'

export function ControlSheet() {
  const snap = useSimSnapshot()
  if (!snap) return null

  const paused = snap.paused

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.78)',
        color: '#e0e0e0',
        borderRadius: 40,
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        backdropFilter: 'blur(6px)',
        fontFamily: 'monospace',
        fontSize: 13,
        boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
      }}
    >
      <button
        onClick={() => setPaused(!paused)}
        style={{
          background: 'none',
          border: '1px solid #555',
          color: '#fff',
          borderRadius: 20,
          padding: '4px 16px',
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: 'monospace',
        }}
      >
        {paused ? '▶ Play' : '⏸ Pause'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#888' }}>Speed</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={snap.speedMultiplier}
          onChange={e => setSpeed(Number(e.target.value))}
          style={{ width: 80, accentColor: '#7c4dff' }}
        />
        <span style={{ minWidth: 24, textAlign: 'right' }}>{snap.speedMultiplier}×</span>
      </div>
    </div>
  )
}
