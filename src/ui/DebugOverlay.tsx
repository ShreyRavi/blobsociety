import { useState } from 'react'
import { useSimSnapshot } from '../store/simStore'

const CHANNEL_NAMES = ['Food', 'Danger', 'Territory', 'Mating']

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
  const [expanded, setExpanded] = useState(false)

  if (!snap) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 64,
        right: 12,
        background: 'rgba(0,0,0,0.75)',
        color: '#e0e0e0',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 11,
        fontFamily: 'monospace',
        backdropFilter: 'blur(4px)',
        minWidth: 140,
      }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          background: 'none',
          border: 'none',
          color: '#ccc',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'monospace',
          padding: 0,
          width: '100%',
          textAlign: 'left',
        }}
      >
        {expanded ? '▾' : '▸'} Debug
      </button>

      {expanded && (
        <div style={{ marginTop: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', lineHeight: 1.8 }}>
            <input
              type="checkbox"
              checked={showPheromone}
              onChange={e => onTogglePheromone(e.target.checked)}
              style={{ accentColor: '#7c4dff' }}
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
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: 6, color: '#666', lineHeight: 1.6 }}>
            <div>World event: {snap.currentWorldEvent ?? 'none'}</div>
            <div>Food mod: {snap.worldEventFoodMod.toFixed(2)}×</div>
          </div>
        </div>
      )}
    </div>
  )
}
