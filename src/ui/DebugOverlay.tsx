import { useEffect, useState } from 'react'
import { useSimSnapshot, triggerWorldEvent } from '../store/simStore'

const CHANNEL_NAMES = ['Food', 'Danger', 'Territory', 'Mating']

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 600)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 600)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

interface DebugOverlayProps {
  showPheromone: boolean
  pheroChannel: number
  onTogglePheromone: (v: boolean) => void
  onSetChannel: (ch: number) => void
}

export function DebugOverlay({
  showPheromone,
  pheroChannel,
  onTogglePheromone,
  onSetChannel,
}: DebugOverlayProps) {
  const snap = useSimSnapshot()
  const isMobile = useIsMobile()
  const [expanded, setExpanded] = useState(false)

  if (!snap) return null

  const bottomOffset = isMobile ? 80 : 64

  return (
    <div
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        right: 12,
        background: 'rgba(0,0,0,0.75)',
        color: '#e0e0e0',
        borderRadius: 8,
        fontSize: 11,
        fontFamily: 'monospace',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Toggle button — gear icon on mobile, text on desktop */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          background: 'none',
          border: 'none',
          color: '#ccc',
          cursor: 'pointer',
          fontSize: isMobile ? 18 : 11,
          fontFamily: 'monospace',
          padding: isMobile ? '8px 12px' : '8px 12px',
          display: 'block',
          minHeight: isMobile ? 44 : 32,
          minWidth: isMobile ? 44 : undefined,
          textAlign: 'left',
        }}
        title="Debug"
      >
        {isMobile ? '⚙' : (expanded ? '▾ Debug' : '▸ Debug')}
      </button>

      {expanded && (
        <div style={{ padding: '0 12px 10px', minWidth: 160 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', lineHeight: 1.8, minHeight: 32 }}>
            <input
              type="checkbox"
              checked={showPheromone}
              onChange={e => onTogglePheromone(e.target.checked)}
              style={{ accentColor: '#7c4dff', width: 14, height: 14 }}
            />
            Pheromone overlay
          </label>

          {showPheromone && (
            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {CHANNEL_NAMES.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => onSetChannel(idx)}
                  style={{
                    background: pheroChannel === idx ? '#7c4dff' : '#222',
                    border: '1px solid #444',
                    color: '#fff',
                    borderRadius: 4,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    minHeight: 28,
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* World event buttons */}
          <div style={{ marginTop: 8, borderTop: '1px solid #333', paddingTop: 6 }}>
            <div style={{ color: '#888', marginBottom: 4 }}>World events</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <EventButton label="🌧 Bloom" name="bloom" active={snap.currentWorldEvent === 'bloom'} />
              <EventButton label="☀ Drought" name="drought" active={snap.currentWorldEvent === 'drought'} />
              <EventButton label="☠ Plague" name="plague" active={snap.currentWorldEvent === 'plague'} />
            </div>
            {snap.currentWorldEvent && (
              <div style={{ marginTop: 4, color: '#ffb74d', fontSize: 10 }}>
                Active: {snap.currentWorldEvent} ({snap.worldEventFoodMod.toFixed(2)}× food)
              </div>
            )}
          </div>

          <div style={{ marginTop: 6, color: '#666', lineHeight: 1.6 }}>
            <div>Tick: {snap.tick.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function EventButton({ label, name, active }: { label: string; name: string; active: boolean }) {
  return (
    <button
      onClick={() => triggerWorldEvent(name)}
      style={{
        background: active ? 'rgba(255,183,77,0.2)' : '#1a1a2e',
        border: `1px solid ${active ? '#ffb74d' : '#444'}`,
        color: active ? '#ffb74d' : '#ccc',
        borderRadius: 4,
        padding: '3px 8px',
        cursor: 'pointer',
        fontSize: 10,
        fontFamily: 'monospace',
        minHeight: 28,
        transition: 'background 0.15s',
      }}
    >
      {label}
    </button>
  )
}
