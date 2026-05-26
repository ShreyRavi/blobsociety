import { describe, it, expect, beforeEach } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { EmotionSystem } from '../EmotionSystem'
import { neighborLists, neighborCounts } from '../PerceptionSystem'
import { PheromoneGrid, PHERO_DANGER, PHERO_FOOD } from '../../engine/PheromoneGrid'
import { MemoryStore } from '../../engine/MemoryStore'
import { PRNG } from '../../engine/prng'
import { DIET_CARNIVORE, DIET_HERBIVORE } from '../../engine/constants'
import type { SimEngine } from '../../engine/SimEngine'

function fakeEngine(pheromone: PheromoneGrid): SimEngine {
  return {
    pheromone,
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

beforeEach(() => {
  neighborCounts.fill(0)
})

describe('EmotionSystem', () => {
  it('fear increases when there are stronger carnivore neighbors', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 1; b.count = 2
      b.x[0] = 100; b.y[0] = 100
      b.strength[0] = 0.3; b.traitFear[0] = 0.1
      b.hunger[0] = 0.2
      b.diet[1] = DIET_CARNIVORE; b.strength[1] = 0.9
      b.emotionFear[0] = 0
    })
    const pheromone = new PheromoneGrid()
    neighborCounts[0] = 1
    neighborLists[0][0] = 1

    EmotionSystem.update(read, write, fakeEngine(pheromone))

    expect(write.emotionFear[0]).toBeGreaterThan(0)
  })

  it('fear increases with danger pheromone', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = 50; b.y[0] = 50
      b.traitFear[0] = 0.0; b.hunger[0] = 0.0
      b.emotionFear[0] = 0
    })
    const pheromone = new PheromoneGrid()
    pheromone.deposit(50, 50, PHERO_DANGER, 1.0)
    pheromone.swap()

    EmotionSystem.update(read, write, fakeEngine(pheromone))

    expect(write.emotionFear[0]).toBeGreaterThan(0)
  })

  it('confidence increases when stronger than neighbors', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 1; b.count = 2
      b.strength[0] = 0.9; b.strength[1] = 0.2
      b.energy[0] = 80
      b.emotionConfidence[0] = 0
    })
    const pheromone = new PheromoneGrid()
    neighborCounts[0] = 1
    neighborLists[0][0] = 1

    EmotionSystem.update(read, write, fakeEngine(pheromone))

    expect(write.emotionConfidence[0]).toBeGreaterThan(0)
  })

  it('stress increases when energy is below 25', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.energy[0] = 10; b.hunger[0] = 0.5
      b.emotionStress[0] = 0
    })
    const pheromone = new PheromoneGrid()

    EmotionSystem.update(read, write, fakeEngine(pheromone))

    expect(write.emotionStress[0]).toBeGreaterThan(0)
  })

  it('curiosity driven by traitCuriosity when no food pheromone', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.traitCuriosity[0] = 1.0
      b.emotionCuriosity[0] = 0
    })
    const pheromone = new PheromoneGrid() // food pheromone = 0

    EmotionSystem.update(read, write, fakeEngine(pheromone))

    expect(write.emotionCuriosity[0]).toBeGreaterThan(0)
  })

  it('emotions use exponential smoothing — old value blended in', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.traitFear[0] = 0.0; b.hunger[0] = 0.0
      b.emotionFear[0] = 0.5  // large existing value
    })
    const pheromone = new PheromoneGrid() // no threat/danger

    EmotionSystem.update(read, write, fakeEngine(pheromone))

    // 0.8 * 0.5 + 0.2 * targetFear — should be < 0.5 but > 0
    expect(write.emotionFear[0]).toBeGreaterThan(0)
    expect(write.emotionFear[0]).toBeLessThan(0.5)
  })
})
