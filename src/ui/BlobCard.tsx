import { useEffect, useState } from 'react'
import { useSimSnapshot, useSelectedBlob, selectBlob, feedBlob, setBlobSpeed, setBlobAggression, setBlobDietFloat } from '../store/simStore'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 600)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 600)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

function bar(v: number, max = 1): string {
  const pct = Math.max(0, Math.min(1, v / max))
  const filled = Math.round(pct * 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

export function BlobCard() {
  const snap = useSimSnapshot()
  const selectedId = useSelectedBlob()
  const isMobile = useIsMobile()

  if (!snap || selectedId === null || !snap.readBuf.alive[selectedId]) {
    if (selectedId !== null) selectBlob(null)
    return null
  }

  const b = snap.readBuf
  const i = selectedId
  const dietNames = ['Herbivore', 'Omnivore', 'Carnivore', 'Scavenger']

  const mobileStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '55vh',
    overflowY: 'auto',
    borderRadius: '12px 12px 0 0',
    borderTop: '1px solid #444',
  }

  const desktopStyle: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 230,
    maxHeight: 'calc(100vh - 24px)',
    overflowY: 'auto',
    borderRadius: 8,
    boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
  }

  return (
    <div
      style={{
        ...(isMobile ? mobileStyle : desktopStyle),
        background: 'rgba(13,13,26,0.95)',
        color: '#e0e0e0',
        padding: '12px 16px',
        fontSize: 12,
        fontFamily: 'monospace',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Blob #{i}</div>
        <button
          onClick={() => selectBlob(null)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18, padding: '4px 8px', minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✕
        </button>
      </div>

      <div style={{ color: '#9e9e9e', marginBottom: 8 }}>
        Species #{b.species[i]} · Gen {b.generation[i]} · {dietNames[b.diet[i]] ?? '?'}
      </div>

      {/* Energy with Feed button */}
      <div style={{ lineHeight: 1.7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#9e9e9e' }}>Energy</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{b.energy[i].toFixed(0)}/100</span>
            <button
              onClick={() => feedBlob(i)}
              style={{
                background: 'rgba(76,175,80,0.2)',
                border: '1px solid #4caf50',
                color: '#4caf50',
                borderRadius: 10,
                padding: '1px 8px',
                cursor: 'pointer',
                fontSize: 10,
                fontFamily: 'monospace',
                minHeight: 22,
              }}
            >
              +Feed
            </button>
          </div>
        </div>
        <div style={{ fontSize: 9, color: '#4caf50', letterSpacing: -0.5 }}>{bar(b.energy[i], 100)}</div>
      </div>

      <BRow label="Age" value={b.age[i].toString()} />

      {/* Speed slider */}
      <EditableSlider
        label="Speed"
        value={b.speed[i]}
        min={0.1}
        max={3}
        step={0.05}
        color="#64b5f6"
        onChange={v => setBlobSpeed(i, v)}
      />

      <BRow label="Strength" value={b.strength[i].toFixed(2)} bar={bar(b.strength[i])} color="#ef5350" />
      <BRow label="Defense" value={b.defense[i].toFixed(2)} bar={bar(b.defense[i])} color="#78909c" />

      {/* Aggression slider */}
      <EditableSlider
        label="Aggression"
        value={b.aggression[i]}
        min={0}
        max={1}
        step={0.01}
        color="#ff7043"
        onChange={v => setBlobAggression(i, v)}
      />

      <BRow label="Sociability" value={b.sociability[i].toFixed(2)} bar={bar(b.sociability[i])} color="#ab47bc" />
      <BRow label="Metabolism" value={b.metabolism[i].toFixed(2)} />
      <BRow label="Mutation" value={b.mutationRate[i].toFixed(2)} />

      {/* Diet slider */}
      <EditableSlider
        label="Diet"
        value={b.dietFloat[i]}
        min={0}
        max={1}
        step={0.01}
        color="#ffd54f"
        displayValue={dietNames[b.diet[i]] ?? '?'}
        onChange={v => setBlobDietFloat(i, v)}
      />

      <div style={{ borderTop: '1px solid #333', marginTop: 8, paddingTop: 6, color: '#888', fontSize: 10 }}>
        Emotions
      </div>
      <BRow label="Fear" value={b.emotionFear[i].toFixed(2)} bar={bar(b.emotionFear[i])} color="#ef9a9a" />
      <BRow label="Confidence" value={b.emotionConfidence[i].toFixed(2)} bar={bar(b.emotionConfidence[i])} color="#a5d6a7" />
      <BRow label="Stress" value={b.emotionStress[i].toFixed(2)} bar={bar(b.emotionStress[i])} color="#ffcc02" />
      <BRow label="Curiosity" value={b.emotionCuriosity[i].toFixed(2)} bar={bar(b.emotionCuriosity[i])} color="#80cbc4" />
    </div>
  )
}

function EditableSlider({
  label,
  value,
  min,
  max,
  step,
  color,
  displayValue,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  color: string
  displayValue?: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ lineHeight: 1.7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#9e9e9e' }}>{label}</span>
        <span style={{ color }}>{displayValue ?? value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, margin: '2px 0 4px' }}
      />
    </div>
  )
}

function BRow({
  label,
  value,
  bar: barStr,
  color,
}: {
  label: string
  value: string
  bar?: string
  color?: string
}) {
  return (
    <div style={{ lineHeight: 1.7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#9e9e9e' }}>{label}</span>
        <span>{value}</span>
      </div>
      {barStr && (
        <div style={{ fontSize: 9, color: color ?? '#666', letterSpacing: -0.5 }}>{barStr}</div>
      )}
    </div>
  )
}
