import { describe, it, expect } from 'vitest'
import { PheromoneGrid } from '../PheromoneGrid'

describe('PheromoneGrid', () => {
  it('initializes to zero', () => {
    const g = new PheromoneGrid()
    expect(g.sample(500, 500, 0)).toBe(0)
  })

  it('deposit adds to write buffer, sample reads read buffer', () => {
    const g = new PheromoneGrid()
    g.deposit(500, 500, 0, 1.0)
    // Before swap, read buffer unchanged
    expect(g.sample(500, 500, 0)).toBe(0)
    // After swap, read = write (with deposit)
    g.swap()
    expect(g.sample(500, 500, 0)).toBeGreaterThan(0)
  })

  it('diffuse spreads values to neighboring cells', () => {
    const g = new PheromoneGrid()
    // Deposit to center, swap so it's in read, then diffuse
    g.deposit(500, 500, 0, 1.0)
    g.swap()  // now read has the deposit
    g.diffuse()  // spreads read → write
    g.swap()  // now read = diffused

    // Neighbor cells should have non-zero values
    expect(g.sample(510, 500, 0)).toBeGreaterThan(0)
    expect(g.sample(490, 500, 0)).toBeGreaterThan(0)
  })

  it('diffuse applies decay', () => {
    const g = new PheromoneGrid()
    g.deposit(500, 500, 0, 1.0)
    g.swap()
    const before = g.sample(500, 500, 0)
    g.diffuse()
    g.swap()
    const after = g.sample(500, 500, 0)
    expect(after).toBeLessThan(before)
  })

  it('sample clamps to grid bounds', () => {
    const g = new PheromoneGrid()
    // Should not throw for out-of-world coords
    expect(() => g.sample(-100, -100, 0)).not.toThrow()
    expect(() => g.sample(2000, 2000, 0)).not.toThrow()
  })

  it('getReadBuffer returns correct Float32Array', () => {
    const g = new PheromoneGrid()
    const buf = g.getReadBuffer()
    expect(buf).toBeInstanceOf(Float32Array)
    expect(buf.length).toBe(100 * 100 * 4)
  })

  it('swap exchanges buffers', () => {
    const g = new PheromoneGrid()
    const originalRead = g.read
    const originalWrite = g.write
    g.swap()
    expect(g.read).toBe(originalWrite)
    expect(g.write).toBe(originalRead)
  })
})
