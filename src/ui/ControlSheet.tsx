import { useEffect, useState } from 'react'
import { useSimSnapshot, setPaused, setSpeed } from '../store/simStore'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 600)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 600)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

export function ControlSheet() {
  const snap = useSimSnapshot()
  const isMobile = useIsMobile()
  if (!snap) return null

  const paused = snap.paused

  return (
    <div
      style={{
        position: 'absolute',
        bottom: isMobile ? 0 : 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.82)',
        color: '#e0e0e0',
        borderRadius: isMobile ? '12px 12px 0 0' : 40,
        padding: isMobile ? '12px 24px 20px' : '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 20 : 16,
        backdropFilter: 'blur(6px)',
        fontFamily: 'monospace',
        fontSize: 13,
        boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
        width: isMobile ? '100%' : undefined,
        boxSizing: 'border-box',
        justifyContent: isMobile ? 'center' : undefined,
      }}
    >
      <button
        onClick={() => setPaused(!paused)}
        style={{
          background: paused ? 'rgba(124,77,255,0.2)' : 'none',
          border: '1px solid #555',
          color: '#fff',
          borderRadius: 24,
          padding: '0 20px',
          cursor: 'pointer',
          fontSize: 14,
          fontFamily: 'monospace',
          transition: 'background 0.15s',
          minHeight: 44,
          minWidth: 80,
        }}
      >
        {paused ? '▶ Play' : '⏸ Pause'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#888' }}>Speed</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={snap.speedMultiplier}
          onChange={e => setSpeed(Number(e.target.value))}
          style={{ width: isMobile ? 120 : 80, accentColor: '#7c4dff', height: 24 }}
        />
        <span style={{ minWidth: 28, textAlign: 'right' }}>{snap.speedMultiplier}×</span>
      </div>
    </div>
  )
}
