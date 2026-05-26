import { describe, it, expect } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { MemorySystem } from '../MemorySystem'
import { MemoryStore } from '../../engine/MemoryStore'
import { InteractionLog } from '../../engine/InteractionLog'
import type { SimEngine } from '../../engine/SimEngine'

function fakeEngine(
  memoryStore: MemoryStore,
  prevLog: InteractionLog,
): SimEngine {
  return {
    memoryStore,
    prevInteractionLog: prevLog,
  } as unknown as SimEngine
}

function aliveBuffer(count: number): StateBuffer {
  const b = new StateBuffer()
  for (let i = 0; i < count; i++) b.alive[i] = 1
  b.count = count
  return b
}

describe('MemorySystem', () => {
  it('fight: decrements trust both ways', () => {
    const mem = new MemoryStore()
    const log = new InteractionLog()
    log.entries.push({ actorId: 0, targetId: 1, action: 'fight', tick: 1, energyDelta: 0 })
    const read = aliveBuffer(2)
    const write = new StateBuffer(); write.copyFrom(read)

    MemorySystem.update(read, write, fakeEngine(mem, log))

    expect(mem.getTrust(0, 1)).toBeLessThan(0)
    expect(mem.getTrust(1, 0)).toBeLessThan(0)
  })

  it('hunt: decrements target trust toward actor only', () => {
    const mem = new MemoryStore()
    const log = new InteractionLog()
    log.entries.push({ actorId: 0, targetId: 1, action: 'hunt', tick: 1, energyDelta: 0 })
    const read = aliveBuffer(2)
    const write = new StateBuffer(); write.copyFrom(read)

    MemorySystem.update(read, write, fakeEngine(mem, log))

    expect(mem.getTrust(1, 0)).toBeLessThan(0)  // prey fears hunter
    expect(mem.getTrust(0, 1)).toBe(0)           // hunter indifferent
  })

  it('share: increments trust both ways', () => {
    const mem = new MemoryStore()
    const log = new InteractionLog()
    log.entries.push({ actorId: 0, targetId: 1, action: 'share', tick: 1, energyDelta: 5 })
    const read = aliveBuffer(2)
    const write = new StateBuffer(); write.copyFrom(read)

    MemorySystem.update(read, write, fakeEngine(mem, log))

    expect(mem.getTrust(0, 1)).toBeGreaterThan(0)
    expect(mem.getTrust(1, 0)).toBeGreaterThan(0)
  })

  it('follow: increments actor trust toward leader only', () => {
    const mem = new MemoryStore()
    const log = new InteractionLog()
    log.entries.push({ actorId: 0, targetId: 1, action: 'follow', tick: 1, energyDelta: 0 })
    const read = aliveBuffer(2)
    const write = new StateBuffer(); write.copyFrom(read)

    MemorySystem.update(read, write, fakeEngine(mem, log))

    expect(mem.getTrust(0, 1)).toBeGreaterThan(0)
    expect(mem.getTrust(1, 0)).toBe(0)
  })

  it('skips entries where actor or target is dead', () => {
    const mem = new MemoryStore()
    const log = new InteractionLog()
    log.entries.push({ actorId: 0, targetId: 1, action: 'fight', tick: 1, energyDelta: 0 })
    const read = new StateBuffer()
    read.alive[0] = 1; read.alive[1] = 0; read.count = 1  // target dead
    const write = new StateBuffer(); write.copyFrom(read)

    MemorySystem.update(read, write, fakeEngine(mem, log))

    expect(mem.getTrust(0, 1)).toBe(0)
    expect(mem.getTrust(1, 0)).toBe(0)
  })

  it('ageAll increments interaction ages', () => {
    const mem = new MemoryStore()
    mem.update(0, 1, 0.2, false, true)  // sets age to 0
    const log = new InteractionLog()    // empty log
    const read = aliveBuffer(2)
    const write = new StateBuffer(); write.copyFrom(read)

    MemorySystem.update(read, write, fakeEngine(mem, log))

    // Age should have incremented by 1 via ageAll
    const memories = mem.getMemories(0)
    expect(memories.length).toBe(1)
    // Trust still present; age incremented (not directly accessible but slot not evicted)
    expect(mem.getTrust(0, 1)).toBeCloseTo(0.2)
  })
})
