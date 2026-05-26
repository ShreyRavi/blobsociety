import { describe, it, expect } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { SpeciationSystem } from '../SpeciationSystem'
import { MemoryStore } from '../../engine/MemoryStore'
import { PRNG } from '../../engine/prng'
import { SPECIATION_INTERVAL } from '../../engine/constants'
import type { SimEngine } from '../../engine/SimEngine'

function fakeEngine(tick = SPECIATION_INTERVAL): SimEngine {
  return {
    tick,
    nextSpeciesId: 10,
    speciesCentroids: new Map(),
    memoryStore: new MemoryStore(),
    prng: new PRNG(1),
  } as unknown as SimEngine
}

function makeBuffers(setup: (b: StateBuffer) => void) {
  const read = new StateBuffer()
  const write = new StateBuffer()
  setup(read)
  write.copyFrom(read)
  return { read, write }
}

function setTraits(b: StateBuffer, i: number, val: number): void {
  b.speed[i] = val * 1.5
  b.strength[i] = val
  b.defense[i] = val
  b.aggression[i] = val
  b.sociability[i] = val
  b.dietFloat[i] = val
  b.size[i] = val * 1.5
  b.metabolism[i] = val
  b.mutationRate[i] = val * 0.25
  b.courage[i] = val
  b.camouflage[i] = val
}

describe('SpeciationSystem', () => {
  it('skips on non-speciation ticks', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.species[0] = 1
      setTraits(b, 0, 0.5)
    })
    const engine = fakeEngine(1)  // tick=1, not a speciation tick

    SpeciationSystem.update(read, write, engine)

    expect(write.species[0]).toBe(1)  // unchanged
  })

  it('blob close to species centroid retains its species', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 1; b.count = 2
      b.species[0] = 1; b.species[1] = 1
      setTraits(b, 0, 0.5)
      setTraits(b, 1, 0.5)  // identical traits → at centroid
    })
    const engine = fakeEngine(SPECIATION_INTERVAL)

    SpeciationSystem.update(read, write, engine)

    expect(write.species[0]).toBe(1)
    expect(write.species[1]).toBe(1)
  })

  it('blob very far from centroid gets new species id', () => {
    // Need 5 blobs at min traits so centroid ≈ 0; outlier at max is >2.0 away in 11D
    const { read, write } = makeBuffers(b => {
      for (let i = 0; i < 5; i++) { b.alive[i] = 1; b.species[i] = 1; setTraits(b, i, 0.0) }
      // Outlier: traits at max normalized values
      b.alive[5] = 1; b.species[5] = 1
      b.speed[5] = 3.0; b.strength[5] = 1.0; b.defense[5] = 1.0
      b.aggression[5] = 1.0; b.sociability[5] = 1.0; b.dietFloat[5] = 1.0
      b.size[5] = 2.0; b.metabolism[5] = 2.0; b.mutationRate[5] = 0.5
      b.courage[5] = 1.0; b.camouflage[5] = 1.0
      b.count = 6
    })
    const engine = fakeEngine(SPECIATION_INTERVAL)
    engine.nextSpeciesId = 10

    SpeciationSystem.update(read, write, engine)

    // The outlier (blob 5) should deviate from centroid ~1/6 ≈ far enough
    expect(write.species[5]).not.toBe(1)
  })

  it('increments nextSpeciesId when new species created', () => {
    const { read, write } = makeBuffers(b => {
      for (let i = 0; i < 5; i++) { b.alive[i] = 1; b.species[i] = 1; setTraits(b, i, 0.0) }
      b.alive[5] = 1; b.species[5] = 1
      b.speed[5] = 3.0; b.strength[5] = 1.0; b.defense[5] = 1.0
      b.aggression[5] = 1.0; b.sociability[5] = 1.0; b.dietFloat[5] = 1.0
      b.size[5] = 2.0; b.metabolism[5] = 2.0; b.mutationRate[5] = 0.5
      b.courage[5] = 1.0; b.camouflage[5] = 1.0
      b.count = 6
    })
    const engine = fakeEngine(SPECIATION_INTERVAL)
    engine.nextSpeciesId = 10

    SpeciationSystem.update(read, write, engine)

    expect(engine.nextSpeciesId).toBeGreaterThan(10)
  })
})
