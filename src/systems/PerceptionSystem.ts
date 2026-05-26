import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'
import { forEachAlive } from '../engine/StateBuffer'
import { MAX_BLOB_COUNT } from '../engine/constants'

// Per-blob neighbor lists stored on engine (derived per-tick, not in StateBuffer)
export const neighborLists: Uint16Array[] = Array.from(
  { length: MAX_BLOB_COUNT },
  () => new Uint16Array(64),
)
export const neighborCounts = new Uint16Array(MAX_BLOB_COUNT)

export const PerceptionSystem: System = {
  name: 'PerceptionSystem',
  enabled: true,

  update(read: StateBuffer, _write: StateBuffer, engine: SimEngine): void {
    neighborCounts.fill(0)

    forEachAlive(read, (i) => {
      const { buf, count } = engine.spatialHash.queryNeighbors(
        read.x[i],
        read.y[i],
        read.visionRadius[i],
      )
      const vr2 = read.visionRadius[i] * read.visionRadius[i]
      let n = 0
      for (let k = 0; k < count && n < 64; k++) {
        const j = buf[k]
        if (j === i || !read.alive[j]) continue
        const dx = read.x[j] - read.x[i]
        const dy = read.y[j] - read.y[i]
        if (dx * dx + dy * dy < vr2) {
          neighborLists[i][n++] = j
        }
      }
      neighborCounts[i] = n
    })
  },
}
