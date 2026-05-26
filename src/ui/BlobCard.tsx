import { useSimSnapshot, useSelectedBlob, selectBlob } from '../store/simStore'

function bar(v: number, max = 1): string {
  const pct = Math.max(0, Math.min(1, v / max))
  const filled = Math.round(pct * 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

export function BlobCard() {
  const snap = useSimSnapshot()
  const selectedId = useSelectedBlob()

  if (!snap || selectedId === null || !snap.readBuf.alive[selectedId]) {
    if (selectedId !== null) selectBlob(null)
    return null
  }

  const b = snap.readBuf
  const i = selectedId
  const dietNames = ['Herbivore', 'Omnivore', 'Carnivore', 'Scavenger']

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        background: 'rgba(0,0,0,0.82)',
        color: '#e0e0e0',
        borderRadius: 8,
        padding: '12px 16px',
        fontSize: 12,
        fontFamily: 'monospace',
        width: 220,
        backdropFilter: 'blur(4px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Blob #{i}</div>
        <button
          onClick={() => selectBlob(null)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, padding: '4px 8px', margin: '-4px -8px', minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✕
        </button>
      </div>

      <div style={{ color: '#9e9e9e', marginBottom: 6 }}>
        Species #{b.species[i]} · Gen {b.generation[i]} · {dietNames[b.diet[i]] ?? '?'}
      </div>

      <BRow label="Energy" value={`${b.energy[i].toFixed(0)}/100`} bar={bar(b.energy[i], 100)} color="#4caf50" />
      <BRow label="Age" value={b.age[i].toString()} />
      <BRow label="Speed" value={b.speed[i].toFixed(2)} bar={bar(b.speed[i], 3)} color="#64b5f6" />
      <BRow label="Strength" value={b.strength[i].toFixed(2)} bar={bar(b.strength[i])} color="#ef5350" />
      <BRow label="Defense" value={b.defense[i].toFixed(2)} bar={bar(b.defense[i])} color="#78909c" />
      <BRow label="Aggression" value={b.aggression[i].toFixed(2)} bar={bar(b.aggression[i])} color="#ff7043" />
      <BRow label="Sociability" value={b.sociability[i].toFixed(2)} bar={bar(b.sociability[i])} color="#ab47bc" />
      <BRow label="Metabolism" value={b.metabolism[i].toFixed(2)} />
      <BRow label="Mutation" value={b.mutationRate[i].toFixed(2)} />
      <BRow label="Size" value={b.size[i].toFixed(2)} />

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
