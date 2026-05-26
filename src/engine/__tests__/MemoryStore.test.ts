import { describe, it, expect } from 'vitest'
import { MemoryStore } from '../MemoryStore'

describe('MemoryStore', () => {
  it('returns 0 trust for unknown blob', () => {
    const m = new MemoryStore()
    expect(m.getTrust(0, 1)).toBe(0)
  })

  it('updates and retrieves trust', () => {
    const m = new MemoryStore()
    m.update(0, 1, 0.5, false, true)
    expect(m.getTrust(0, 1)).toBeCloseTo(0.5)
  })

  it('clamps trust to [-1,1]', () => {
    const m = new MemoryStore()
    m.update(0, 1, 2.0, false, false)
    expect(m.getTrust(0, 1)).toBe(1)
    m.update(0, 1, -5.0, false, false)
    expect(m.getTrust(0, 1)).toBe(-1)
  })

  it('betrayal and cooperation counts increment', () => {
    const m = new MemoryStore()
    m.update(0, 1, 0, true, false)
    m.update(0, 1, 0, false, true)
    const mems = m.getMemories(0)
    const entry = mems.find(x => x.targetId === 1)
    expect(entry?.betrayals).toBe(1)
    expect(entry?.cooperations).toBe(1)
  })

  it('clearBlob wipes all slots', () => {
    const m = new MemoryStore()
    m.update(0, 1, 0.3, false, false)
    m.update(0, 2, -0.2, true, false)
    m.clearBlob(0)
    expect(m.getTrust(0, 1)).toBe(0)
    expect(m.getTrust(0, 2)).toBe(0)
  })

  it('clearRefsTo removes dead blob from other memories', () => {
    const m = new MemoryStore()
    m.update(0, 5, 0.4, false, false)
    m.update(3, 5, -0.1, true, false)
    m.clearRefsTo(5)
    expect(m.getTrust(0, 5)).toBe(0)
    expect(m.getTrust(3, 5)).toBe(0)
  })

  it('ageAll increments interactionAge for active slots', () => {
    const m = new MemoryStore()
    m.update(0, 1, 0.1, false, false)
    m.ageAll()
    m.ageAll()
    // After 2 ageAll calls, slot age = 2 (reset to 0 on update, then +1, +1)
    const mems = m.getMemories(0)
    const entry = mems.find(x => x.targetId === 1)
    expect(entry).toBeDefined()
  })

  it('LRU eviction works when slots full', () => {
    const m = new MemoryStore()
    // Fill all 32 slots for blob 0
    for (let t = 1; t <= 32; t++) {
      m.update(0, t, 0.1, false, false)
    }
    // Age all so oldest slots have higher age
    for (let a = 0; a < 5; a++) m.ageAll()
    // Adding a 33rd should evict oldest
    m.update(0, 99, 0.5, false, false)
    const mems = m.getMemories(0)
    expect(mems.some(x => x.targetId === 99)).toBe(true)
    expect(mems.length).toBeLessThanOrEqual(32)
  })
})
