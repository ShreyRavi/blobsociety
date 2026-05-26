import { describe, it, expect } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { CombatSystem } from '../CombatSystem'
import { InteractionLog } from '../../engine/InteractionLog'
import { MemoryStore } from '../../engine/MemoryStore'
import { PRNG } from '../../engine/prng'
import type { SimEngine } from '../../engine/SimEngine'

function fakeEngine(entries: InstanceType<typeof InteractionLog>['entries'] = []): SimEngine {
  const log = new InteractionLog()
  for (const e of entries) log.entries.push(e)
  return {
    newInteractionLog: log,
    memoryStore: new MemoryStore(),
    prng: new PRNG(42),
  } as unknown as SimEngine
}

function makeBuffers(setup: (b: StateBuffer) => void) {
  const read = new StateBuffer()
  const write = new StateBuffer()
  setup(read)
  write.copyFrom(read)
  return { read, write }
}

describe('CombatSystem', () => {
  it('attacker wins: transfers energy from target to attacker', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 1; b.count = 2
      b.strength[0] = 1.0; b.defense[1] = 0.0; b.spikiness[1] = 0.0
      b.energy[0] = 50; b.energy[1] = 80
    })
    const engine = fakeEngine([{ actorId: 0, targetId: 1, action: 'fight', tick: 1, energyDelta: 0 }])
    CombatSystem.update(read, write, engine)
    expect(write.energy[1]).toBeLessThan(read.energy[1])
    expect(write.energy[0]).toBeGreaterThan(read.energy[0])
  })

  it('defender wins: attacker loses energy via spikiness', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 1; b.count = 2
      b.strength[0] = 0.0; b.defense[1] = 1.0; b.spikiness[1] = 0.5
      b.energy[0] = 50; b.energy[1] = 80
    })
    const engine = fakeEngine([{ actorId: 0, targetId: 1, action: 'fight', tick: 1, energyDelta: 0 }])
    CombatSystem.update(read, write, engine)
    expect(write.energy[0]).toBeLessThan(read.energy[0])
    expect(write.energy[1]).toBe(read.energy[1])
  })

  it('skips dead target', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 0; b.count = 1
      b.energy[0] = 50; b.energy[1] = 80
    })
    const engine = fakeEngine([{ actorId: 0, targetId: 1, action: 'fight', tick: 1, energyDelta: 0 }])
    CombatSystem.update(read, write, engine)
    expect(write.energy[0]).toBe(50)
    expect(write.energy[1]).toBe(80)
  })

  it('multi-attacker: target energy clamps to 0, never negative', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 1; b.alive[2] = 1; b.count = 3
      b.strength[0] = 1.0; b.strength[2] = 1.0
      b.defense[1] = 0.0; b.spikiness[1] = 0.0
      b.energy[0] = 50; b.energy[1] = 5; b.energy[2] = 50
    })
    const engine = fakeEngine([
      { actorId: 0, targetId: 1, action: 'fight', tick: 1, energyDelta: 0 },
      { actorId: 2, targetId: 1, action: 'hunt', tick: 1, energyDelta: 0 },
    ])
    CombatSystem.update(read, write, engine)
    expect(write.energy[1]).toBeGreaterThanOrEqual(0)
    // Second attacker should not gain energy from a negative-energy target
    expect(write.energy[2]).toBeGreaterThanOrEqual(50)
  })

  it('ignores non-fight/hunt actions', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.alive[1] = 1; b.count = 2
      b.energy[0] = 50; b.energy[1] = 80
    })
    const engine = fakeEngine([{ actorId: 0, targetId: 1, action: 'share', tick: 1, energyDelta: 5 }])
    CombatSystem.update(read, write, engine)
    expect(write.energy[0]).toBe(50)
    expect(write.energy[1]).toBe(80)
  })
})
