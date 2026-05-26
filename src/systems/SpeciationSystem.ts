import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'
import { forEachAlive } from '../engine/StateBuffer'
import { SPECIATION_INTERVAL, SPECIATION_DISTANCE_THRESHOLD, MAX_BLOB_COUNT } from '../engine/constants'

// 11-dimensional trait vector indices and their normalization scales
const TRAIT_SCALES = [
  3.0,   // speed (max 3)
  1.0,   // strength
  1.0,   // defense
  1.0,   // aggression
  1.0,   // sociability
  1.0,   // dietFloat
  2.0,   // size (max 2)
  2.0,   // metabolism (max 2)
  0.5,   // mutationRate (max 0.5)
  1.0,   // courage
  1.0,   // camouflage
]

const DIM = TRAIT_SCALES.length
const traitBuf = new Float32Array(MAX_BLOB_COUNT * DIM)

function getTrait(read: StateBuffer, i: number, k: number): number {
  switch (k) {
    case 0:  return read.speed[i]
    case 1:  return read.strength[i]
    case 2:  return read.defense[i]
    case 3:  return read.aggression[i]
    case 4:  return read.sociability[i]
    case 5:  return read.dietFloat[i]
    case 6:  return read.size[i]
    case 7:  return read.metabolism[i]
    case 8:  return read.mutationRate[i]
    case 9:  return read.courage[i]
    case 10: return read.camouflage[i]
    default: return 0
  }
}

function dist2(a: Float32Array, aOff: number, b: Float32Array, bOff: number): number {
  let s = 0
  for (let k = 0; k < DIM; k++) {
    const d = a[aOff + k] - b[bOff + k]
    s += d * d
  }
  return s
}

export const SpeciationSystem: System = {
  name: 'SpeciationSystem',
  enabled: true,

  update(read: StateBuffer, write: StateBuffer, engine: SimEngine): void {
    if (engine.tick % SPECIATION_INTERVAL !== 0) return

    // Build normalized trait vectors for all alive blobs
    forEachAlive(read, (i) => {
      const base = i * DIM
      for (let k = 0; k < DIM; k++) {
        traitBuf[base + k] = getTrait(read, i, k) / TRAIT_SCALES[k]
      }
    })

    // Compute current centroid per species from alive blobs
    const centroids = engine.speciesCentroids
    centroids.clear()

    forEachAlive(read, (i) => {
      const sid = read.species[i]
      let entry = centroids.get(sid)
      if (!entry) {
        entry = { centroid: new Array(DIM).fill(0) as number[], n: 0 }
        centroids.set(sid, entry)
      }
      entry.n++
      const base = i * DIM
      for (let k = 0; k < DIM; k++) {
        // Welford online mean
        entry.centroid[k] += (traitBuf[base + k] - entry.centroid[k]) / entry.n
      }
    })

    const threshold2 = SPECIATION_DISTANCE_THRESHOLD * SPECIATION_DISTANCE_THRESHOLD

    // Scratch centroid buffer for comparison
    const centBuf = new Float32Array(DIM)

    forEachAlive(read, (i) => {
      const base = i * DIM
      const currentSid = read.species[i]
      const currentEntry = centroids.get(currentSid)

      if (!currentEntry) {
        write.species[i] = engine.nextSpeciesId++
        return
      }

      // Load centroid into scratch
      for (let k = 0; k < DIM; k++) centBuf[k] = currentEntry.centroid[k]

      const d2 = dist2(traitBuf, base, centBuf, 0)

      if (d2 > threshold2) {
        // Find nearest existing centroid within threshold
        let bestSid = -1
        let bestD2 = threshold2
        for (const [sid, entry] of centroids) {
          if (sid === currentSid) continue
          for (let k = 0; k < DIM; k++) centBuf[k] = entry.centroid[k]
          const cd2 = dist2(traitBuf, base, centBuf, 0)
          if (cd2 < bestD2) { bestD2 = cd2; bestSid = sid }
        }
        write.species[i] = bestSid !== -1 ? bestSid : engine.nextSpeciesId++
      } else {
        write.species[i] = currentSid
      }
    })
  },
}
