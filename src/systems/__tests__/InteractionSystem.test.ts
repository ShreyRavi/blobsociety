import { describe, it, expect, beforeEach } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { InteractionSystem } from '../InteractionSystem'
import { neighborLists, neighborCounts } from '../PerceptionSystem'
import { InteractionLog } from '../../engine/InteractionLog'
import { MemoryStore } from '../../engine/MemoryStore'
import { PheromoneGrid } from '../../engine/PheromoneGrid'
import { PRNG } from '../../engine/prng'
import {
  DIET_CARNIVORE,
  DIET_HERBIVORE,
} from '../../engine/constants'
import type { SimEngine } from '../../engine/SimEngine'

function fakeEngine(): SimEngine {
  return {
    pheromone: new PheromoneGrid(),
    memoryStore: new MemoryStore(),
    newInteractionLog: new InteractionLog(),
    prng: new PRNG(42),
    tick: 1,
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

describe('InteractionSystem', () => {
  it('flee: high fear blob logs flee when stronger carnivore nearby', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 1; b.count = 2
      b.x[0] = 100; b.y[0] = 100
      b.x[1] = 120; b.y[1] = 100
      b.diet[1] = DIET_CARNIVORE
      b.strength[0] = 0.2; b.strength[1] = 0.9
      b.emotionFear[0] = 0.8; b.emotionConfidence[0] = 0.1
      b.hunger[0] = 0.1; b.aggression[0] = 0.1; b.sociability[0] = 0.1
    })
    neighborCounts[0] = 1
    neighborLists[0][0] = 1
    const engine = fakeEngine()
    write.emotionFear[0] = 0.8; write.emotionConfidence[0] = 0.1

    InteractionSystem.update(read, write, engine)

    const actions = engine.newInteractionLog.entries.map(e => e.action)
    expect(actions).toContain('flee')
  })

  it('hunt: hungry carnivore logs hunt toward herbivore', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 1; b.count = 2
      b.x[0] = 100; b.y[0] = 100
      b.x[1] = 120; b.y[1] = 100
      b.diet[0] = DIET_CARNIVORE; b.diet[1] = DIET_HERBIVORE
      b.hunger[0] = 0.8
      b.emotionFear[0] = 0; b.emotionConfidence[0] = 0.5
      b.aggression[0] = 0; b.sociability[0] = 0
    })
    neighborCounts[0] = 1
    neighborLists[0][0] = 1
    const engine = fakeEngine()
    write.emotionFear[0] = 0; write.emotionConfidence[0] = 0.5

    InteractionSystem.update(read, write, engine)

    const hunts = engine.newInteractionLog.entries.filter(e => e.action === 'hunt')
    expect(hunts.length).toBeGreaterThan(0)
    expect(hunts[0].actorId).toBe(0)
    expect(hunts[0].targetId).toBe(1)
  })

  it('wander: no action context logs wander', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.diet[0] = DIET_HERBIVORE
      b.hunger[0] = 0.1  // not hungry enough to forage
      b.aggression[0] = 0; b.sociability[0] = 0
      b.emotionFear[0] = 0; b.emotionCuriosity[0] = 0.5
    })
    // no neighbors
    const engine = fakeEngine()
    write.emotionFear[0] = 0; write.emotionCuriosity[0] = 0.5; write.emotionConfidence[0] = 0

    InteractionSystem.update(read, write, engine)

    const wanders = engine.newInteractionLog.entries.filter(e => e.action === 'wander')
    expect(wanders.length).toBe(1)
    expect(wanders[0].actorId).toBe(0)
  })

  it('share: sociable blob with surplus energy shares with hungry same-species neighbor', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 1; b.count = 2
      b.x[0] = 100; b.y[0] = 100
      b.x[1] = 110; b.y[1] = 100
      b.species[0] = 1; b.species[1] = 1
      b.sociability[0] = 0.9
      b.energy[0] = 90; b.hunger[1] = 0.8
      b.aggression[0] = 0; b.emotionFear[0] = 0
    })
    neighborCounts[0] = 1
    neighborLists[0][0] = 1
    const engine = fakeEngine()
    engine.memoryStore.update(0, 1, 0.5, false, true)  // high trust
    write.emotionFear[0] = 0; write.emotionConfidence[0] = 0.5; write.energy[0] = 90

    InteractionSystem.update(read, write, engine)

    const shares = engine.newInteractionLog.entries.filter(e => e.action === 'share')
    expect(shares.length).toBeGreaterThan(0)
  })

  it('velocity is set for blob that acts', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.diet[0] = DIET_HERBIVORE
      b.hunger[0] = 0.1
      b.aggression[0] = 0; b.sociability[0] = 0
    })
    const engine = fakeEngine()
    write.vx[0] = 0; write.vy[0] = 0
    write.emotionFear[0] = 0; write.emotionCuriosity[0] = 0.5; write.emotionConfidence[0] = 0

    InteractionSystem.update(read, write, engine)

    // Wander always sets velocity to normalized random
    const speed = Math.sqrt(write.vx[0] ** 2 + write.vy[0] ** 2)
    expect(speed).toBeCloseTo(1, 1)
  })
})
