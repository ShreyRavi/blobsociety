import { useSimSnapshot } from '../store/simStore'

export function StatsPanel() {
  const snap = useSimSnapshot()

  if (!snap) return null

  const topSpecies = [...snap.speciesCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        background: 'rgba(0,0,0,0.72)',
        color: '#e0e0e0',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
        fontFamily: 'monospace',
        minWidth: 160,
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#fff' }}>
        Blob Society
      </div>
      <Row label="Tick" value={snap.tick.toLocaleString()} />
      <Row label="Blobs" value={snap.blobCount} />
      <Row label="Species" value={snap.speciesCounts.size} />
      <Row label="Speed" value={`${snap.speedMultiplier}×`} />
      {snap.currentWorldEvent && (
        <div style={{ marginTop: 6, color: '#ffb74d', fontWeight: 600 }}>
          ⚡ {snap.currentWorldEvent}
        </div>
      )}
      {topSpecies.length > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px solid #333', paddingTop: 6 }}>
          <div style={{ color: '#888', marginBottom: 3 }}>Top species</div>
          {topSpecies.map(([sid, cnt]) => (
            <SpeciesRow key={sid} id={sid} count={cnt} total={snap.blobCount} />
          ))}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, lineHeight: 1.6 }}>
      <span style={{ color: '#9e9e9e' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function SpeciesRow({ id, count, total }: { id: number; count: number; total: number }) {
  const hue = (id * 137.508) % 360
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.6 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: `hsl(${hue.toFixed(0)},60%,52%)`,
          flexShrink: 0,
        }}
      />
      <span style={{ color: '#ccc' }}>#{id}</span>
      <span style={{ marginLeft: 'auto' }}>{count} ({pct}%)</span>
    </div>
  )
}
