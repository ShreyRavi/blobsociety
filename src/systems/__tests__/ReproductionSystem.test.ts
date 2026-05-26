import { describe, it, expect } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { ReproductionSystem } from '../ReproductionSystem'
import type { SimEngine } from '../../engine/SimEngine'
import { PRNG } from '../../engine/prng'
import { REPRODUCTION_THRESHOLD, REPRODUCTION_SOFT_CAP } from '../../engine/constants'

function fakeEngine(overrides: Partial<SimEngine> = {}): SimEngine {
  return {
    prng: new PRNG(42),
    freeList: [],
    lastReproductionPrngState: null,
    ...overrides,
  } as unknown as SimEngine
}

function makeBuffers(setup: (b: StateBuffer) => void) {
  const read = new StateBuffer()
  const write = new StateBuffer()
  setup(read)
  write.copyFrom(read)
  return { read, write }
}

describe('ReproductionSystem', () => {
  it('creates child when energy exceeds threshold', () => {
    const engine = fakeEngine()
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.energy[0] = REPRODUCTION_THRESHOLD + 5
      b.reproductionCooldown[0] = 0
      b.speed[0] = 1.0; b.strength[0] = 0.5; b.defense[0] = 0.5
      b.visionRadius[0] = 60; b.aggression[0] = 0.5; b.sociability[0] = 0.5
      b.traitCuriosity[0] = 0.5; b.traitFear[0] = 0.5; b.courage[0] = 0.5
      b.fertility[0] = 0.5; b.metabolism[0] = 0.2; b.camouflage[0] = 0.3
      b.spikiness[0] = 0.2; b.size[0] = 1.0; b.dietFloat[0] = 0.3
      b.mutationRate[0] = 0.1
      b.species[0] = 1; b.generation[0] = 0
      b.x[0] = 500; b.y[0] = 500
    })
    write.count = 1
    ReproductionSystem.update(read, write, engine)
    expect(write.count).toBe(2)
    expect(write.alive[1]).toBe(1)
  })

  it('splits energy 50/50 parent and child', () => {
    const engine = fakeEngine()
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.energy[0] = 80
      b.reproductionCooldown[0] = 0
      b.speed[0] = 1.0; b.strength[0] = 0.5; b.defense[0] = 0.5
      b.visionRadius[0] = 60; b.aggression[0] = 0.5; b.sociability[0] = 0.5
      b.traitCuriosity[0] = 0.5; b.traitFear[0] = 0.5; b.courage[0] = 0.5
      b.fertility[0] = 0.5; b.metabolism[0] = 0.2; b.camouflage[0] = 0.3
      b.spikiness[0] = 0.2; b.size[0] = 1.0; b.dietFloat[0] = 0.3
      b.mutationRate[0] = 0.1; b.species[0] = 1; b.x[0] = 500; b.y[0] = 500
    })
    write.count = 1
    const prevEnergy = write.energy[0]
    ReproductionSystem.update(read, write, engine)
    expect(write.energy[0]).toBeCloseTo(prevEnergy * 0.5, 1)
    expect(write.energy[1]).toBeCloseTo(prevEnergy * 0.5, 1)
  })

  it('skips reproduction when cooldown active', () => {
    const engine = fakeEngine()
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.energy[0] = 90
      b.reproductionCooldown[0] = 100
    })
    write.count = 1
    ReproductionSystem.update(read, write, engine)
    expect(write.count).toBe(1)
    expect(write.reproductionCooldown[0]).toBe(99)
  })

  it('respects soft cap', () => {
    const engine = fakeEngine()
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = REPRODUCTION_SOFT_CAP
      b.energy[0] = 90
      b.reproductionCooldown[0] = 0
    })
    write.count = REPRODUCTION_SOFT_CAP
    ReproductionSystem.update(read, write, engine)
    expect(write.count).toBe(REPRODUCTION_SOFT_CAP)
  })

  it('child inherits parent species', () => {
    const engine = fakeEngine()
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.energy[0] = 80; b.reproductionCooldown[0] = 0
      b.speed[0] = 1; b.strength[0] = 0.5; b.defense[0] = 0.5
      b.visionRadius[0] = 60; b.aggression[0] = 0.5; b.sociability[0] = 0.5
      b.traitCuriosity[0] = 0.5; b.traitFear[0] = 0.5; b.courage[0] = 0.5
      b.fertility[0] = 0.5; b.metabolism[0] = 0.2; b.camouflage[0] = 0.3
      b.spikiness[0] = 0.2; b.size[0] = 1.0; b.dietFloat[0] = 0.3
      b.mutationRate[0] = 0.1; b.species[0] = 7; b.x[0] = 500; b.y[0] = 500
    })
    write.count = 1
    ReproductionSystem.update(read, write, engine)
    expect(write.species[1]).toBe(7)
  })
})
