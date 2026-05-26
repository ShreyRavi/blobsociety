import { describe, it, expect } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { AgingSystem } from '../AgingSystem'
import type { SimEngine } from '../../engine/SimEngine'
import { MemoryStore } from '../../engine/MemoryStore'

function fakeEngine(): SimEngine {
  return {
    freeList: [],
    memoryStore: new MemoryStore(),
  } as unknown as SimEngine
}

function makeBuffers(setup: (b: StateBuffer) => void) {
  const read = new StateBuffer()
  const write = new StateBuffer()
  setup(read)
  write.copyFrom(read)
  return { read, write }
}

describe('AgingSystem', () => {
  it('increments age each tick', () => {
    const engine = fakeEngine()
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.age[0] = 5
      b.energy[0] = 50
      b.size[0] = 1.0
    })
    AgingSystem.update(read, write, engine)
    expect(write.age[0]).toBe(6)
  })

  it('kills blob when energy reaches 0', () => {
    const engine = fakeEngine()
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.age[0] = 100
      b.energy[0] = 0
      b.size[0] = 1.0
    })
    write.energy[0] = 0
    AgingSystem.update(read, write, engine)
    expect(write.alive[0]).toBe(0)
    expect(write.count).toBe(0)
    expect(engine.freeList).toContain(0)
  })

  it('kills blob when age exceeds lifespan', () => {
    const engine = fakeEngine()
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.energy[0] = 80
      b.size[0] = 0.0  // small blob, short lifespan
    })
    write.age[0] = 99999
    AgingSystem.update(read, write, engine)
    expect(write.alive[0]).toBe(0)
  })

  it('larger blobs live longer', () => {
    // No death should happen for a large blob at age 3001
    const engine = fakeEngine()
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.energy[0] = 80
      b.size[0] = 2.0  // BASE_LIFESPAN + 2*500 = 4000
    })
    write.age[0] = 3001
    AgingSystem.update(read, write, engine)
    expect(write.alive[0]).toBe(1)
  })
})
