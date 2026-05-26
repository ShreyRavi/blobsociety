import { describe, it, expect } from 'vitest'
import { FoodPool } from '../FoodPool'

describe('FoodPool', () => {
  it('spawns food and increments count', () => {
    const p = new FoodPool()
    expect(p.count).toBe(0)
    p.spawn(100, 200, 15)
    expect(p.count).toBe(1)
  })

  it('spawned food is alive at correct position', () => {
    const p = new FoodPool()
    p.spawn(300, 400, 20)
    const slot = p.alive.indexOf(1)
    expect(slot).toBeGreaterThanOrEqual(0)
    expect(p.x[slot]).toBe(300)
    expect(p.y[slot]).toBe(400)
    expect(p.value[slot]).toBe(20)
  })

  it('consume returns value and marks dead', () => {
    const p = new FoodPool()
    p.spawn(50, 50, 10)
    const slot = p.alive.indexOf(1)
    const v = p.consume(slot)
    expect(v).toBe(10)
    expect(p.alive[slot]).toBe(0)
    expect(p.count).toBe(0)
  })

  it('consume on dead slot returns 0', () => {
    const p = new FoodPool()
    p.spawn(50, 50, 10)
    const slot = p.alive.indexOf(1)
    p.consume(slot)
    expect(p.consume(slot)).toBe(0)
  })

  it('free slots are reused after consume', () => {
    const p = new FoodPool()
    p.spawn(10, 10, 5)
    const slot = p.alive.indexOf(1)
    p.consume(slot)
    p.spawn(20, 20, 8)
    // Count back to 1, slot reused
    expect(p.count).toBe(1)
  })
})
